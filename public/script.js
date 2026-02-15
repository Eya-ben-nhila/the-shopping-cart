class PersistentCart {
    constructor() {
        this.cart = [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        await this.loadCart();
        this.renderProducts();
        this.renderCart();
        this.setupEventListeners();
        
        // Sync with server on page load
        await this.syncWithServer();
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            this.products = await response.json();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Error loading products', 'error');
        }
    }

    async loadCart() {
        // First try to load from localStorage
        const localCart = localStorage.getItem('persistentCart');
        if (localCart) {
            try {
                const parsedCart = JSON.parse(localCart);
                // Check if localStorage cart is not too old (7 days)
                const lastUpdated = new Date(parsedCart.lastUpdated);
                const now = new Date();
                const daysDiff = (now - lastUpdated) / (1000 * 60 * 60 * 24);
                
                if (daysDiff <= 7) {
                    this.cart = parsedCart.items || [];
                } else {
                    // Clear expired localStorage cart
                    localStorage.removeItem('persistentCart');
                    this.cart = [];
                }
            } catch (error) {
                console.error('Error parsing localStorage cart:', error);
                this.cart = [];
            }
        }

        // Then sync with server
        try {
            const response = await fetch('/api/cart');
            const serverCart = await response.json();
            
            // Merge server cart with local cart (prefer server data)
            if (serverCart.items && serverCart.items.length > 0) {
                this.cart = serverCart.items;
                this.saveCartToLocalStorage();
            } else if (this.cart.length > 0) {
                // If server cart is empty but local has items, sync to server
                await this.syncCartToServer();
            }
        } catch (error) {
            console.error('Error loading cart from server:', error);
        }
    }

    saveCartToLocalStorage() {
        const cartData = {
            items: this.cart,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('persistentCart', JSON.stringify(cartData));
    }

    async syncWithServer() {
        try {
            const response = await fetch('/api/cart');
            const serverCart = await response.json();
            
            // Use server cart as source of truth
            this.cart = serverCart.items || [];
            this.saveCartToLocalStorage();
            this.renderCart();
        } catch (error) {
            console.error('Error syncing with server:', error);
        }
    }

    async syncCartToServer() {
        try {
            // Clear server cart first
            await fetch('/api/cart/clear', { method: 'DELETE' });
            
            // Add all items to server cart
            for (const item of this.cart) {
                await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: item.productId,
                        quantity: item.quantity
                    })
                });
            }
        } catch (error) {
            console.error('Error syncing cart to server:', error);
        }
    }

    renderProducts() {
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '';

        this.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <button class="btn btn-primary" onclick="cartApp.addToCart(${product.id})">
                        Add to Cart
                    </button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartTax = document.getElementById('cart-tax');
        const cartFinalTotal = document.getElementById('cart-final-total');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add some amazing products to get started!</p>
                </div>
            `;
            cartTotal.textContent = '0.00';
            cartTax.textContent = '0.00';
            cartFinalTotal.textContent = '0.00';
            return;
        }

        let subtotal = 0;
        cartItems.innerHTML = '';

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="cartApp.updateQuantity(${item.productId}, ${item.quantity - 1})">−</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="cartApp.updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="cartApp.removeFromCart(${item.productId})">Remove</button>
            `;
            cartItems.appendChild(cartItem);
        });

        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        cartTotal.textContent = subtotal.toFixed(2);
        cartTax.textContent = tax.toFixed(2);
        cartFinalTotal.textContent = total.toFixed(2);
    }

    async addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });

            if (response.ok) {
                const updatedCart = await response.json();
                this.cart = updatedCart.items;
                this.saveCartToLocalStorage();
                this.renderCart();
                this.showNotification(`${product.name} added to cart!`);
            } else {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Error adding item to cart', 'error');
        }
    }

    async updateQuantity(productId, newQuantity) {
        if (newQuantity < 0) return;

        try {
            const response = await fetch('/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                const updatedCart = await response.json();
                this.cart = updatedCart.items;
                this.saveCartToLocalStorage();
                this.renderCart();
            } else {
                throw new Error('Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            this.showNotification('Error updating item quantity', 'error');
        }
    }

    async removeFromCart(productId) {
        try {
            const response = await fetch(`/api/cart/remove/${productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const updatedCart = await response.json();
                this.cart = updatedCart.items;
                this.saveCartToLocalStorage();
                this.renderCart();
                this.showNotification('Item removed from cart');
            } else {
                throw new Error('Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            this.showNotification('Error removing item from cart', 'error');
        }
    }

    async clearCart() {
        if (!confirm('Are you sure you want to clear your cart?')) return;

        try {
            const response = await fetch('/api/cart/clear', {
                method: 'DELETE'
            });

            if (response.ok) {
                this.cart = [];
                this.saveCartToLocalStorage();
                this.renderCart();
                this.showNotification('Cart cleared');
            } else {
                throw new Error('Failed to clear cart');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            this.showNotification('Error clearing cart', 'error');
        }
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'info');
            return;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (confirm(`Checkout Summary:\n${itemCount} items\nSubtotal: $${subtotal.toFixed(2)}\nTax: $${tax.toFixed(2)}\nTotal: $${total.toFixed(2)}\n\nProceed to checkout?`)) {
            this.showNotification('Checkout functionality would be implemented here!', 'info');
            // In a real application, this would redirect to a payment gateway
        }
    }

    goHome() {
        window.location.href = '/';
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    setupEventListeners() {
        // Sync with server when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncWithServer();
            }
        });

        // Sync with server when window gets focus
        window.addEventListener('focus', () => {
            this.syncWithServer();
        });

        // Auto-save to localStorage periodically
        setInterval(() => {
            this.saveCartToLocalStorage();
        }, 5000); // Every 5 seconds
    }
}

// Global functions for onclick handlers
let cartApp;

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('open');
}

function clearCart() {
    cartApp.clearCart();
}

function checkout() {
    cartApp.checkout();
}

function goHome() {
    cartApp.goHome();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    cartApp = new PersistentCart();
});
