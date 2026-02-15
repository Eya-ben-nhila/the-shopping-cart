const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    genid: (req) => {
        return uuidv4();
    },
    secret: 'ecommerce-cart-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Sample products data with real images
const products = [
    { 
        id: 1, 
        name: 'Premium Laptop', 
        price: 999.99, 
        description: 'High-performance laptop with 16GB RAM and 512GB SSD', 
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 2, 
        name: 'Smartphone Pro', 
        price: 699.99, 
        description: 'Latest smartphone with advanced camera system', 
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 3, 
        name: 'Wireless Headphones', 
        price: 199.99, 
        description: 'Premium noise-cancelling headphones', 
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 4, 
        name: 'Tablet Ultra', 
        price: 449.99, 
        description: '10-inch tablet with stylus support', 
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 5, 
        name: 'Smartwatch Fit', 
        price: 299.99, 
        description: 'Fitness and health tracking smartwatch', 
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 6, 
        name: 'DSLR Camera', 
        price: 1299.99, 
        description: 'Professional 4K camera with lenses', 
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 7, 
        name: 'Gaming Console', 
        price: 499.99, 
        description: 'Next-gen gaming console with 4K gaming', 
        image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop&crop=center' 
    },
    { 
        id: 8, 
        name: 'Wireless Keyboard', 
        price: 89.99, 
        description: 'Mechanical wireless keyboard with RGB', 
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop&crop=center' 
    }
];

// Cart storage functions
const getCartFilePath = (sessionId) => {
    return path.join(dataDir, `cart_${sessionId}.json`);
};

const loadCart = (sessionId) => {
    const cartPath = getCartFilePath(sessionId);
    try {
        if (fs.existsSync(cartPath)) {
            const cartData = fs.readFileSync(cartPath, 'utf8');
            const cart = JSON.parse(cartData);
            
            // Check if cart is older than 7 days
            const lastUpdated = new Date(cart.lastUpdated);
            const now = new Date();
            const daysDiff = (now - lastUpdated) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 7) {
                // Cart expired, delete it and return empty
                fs.unlinkSync(cartPath);
                return { items: [], lastUpdated: new Date().toISOString() };
            }
            
            return cart;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
    return { items: [], lastUpdated: new Date().toISOString() };
};

const saveCart = (sessionId, cart) => {
    const cartPath = getCartFilePath(sessionId);
    try {
        cart.lastUpdated = new Date().toISOString();
        fs.writeFileSync(cartPath, JSON.stringify(cart, null, 2));
    } catch (error) {
        console.error('Error saving cart:', error);
    }
};

// Cleanup expired carts
const cleanupExpiredCarts = () => {
    try {
        const files = fs.readdirSync(dataDir);
        const now = new Date();
        
        files.forEach(file => {
            if (file.startsWith('cart_') && file.endsWith('.json')) {
                const filePath = path.join(dataDir, file);
                const cartData = fs.readFileSync(filePath, 'utf8');
                const cart = JSON.parse(cartData);
                
                const lastUpdated = new Date(cart.lastUpdated);
                const daysDiff = (now - lastUpdated) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > 7) {
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up expired cart: ${file}`);
                }
            }
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredCarts, 60 * 60 * 1000);

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Get cart
app.get('/api/cart', (req, res) => {
    const sessionId = req.sessionID;
    const cart = loadCart(sessionId);
    res.json(cart);
});

// Add item to cart
app.post('/api/cart/add', (req, res) => {
    const sessionId = req.sessionID;
    const { productId, quantity = 1 } = req.body;
    
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    const cart = loadCart(sessionId);
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cart.items.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: parseInt(quantity)
        });
    }
    
    saveCart(sessionId, cart);
    res.json(cart);
});

// Update cart item quantity
app.put('/api/cart/update', (req, res) => {
    const sessionId = req.sessionID;
    const { productId, quantity } = req.body;
    
    const cart = loadCart(sessionId);
    const item = cart.items.find(item => item.productId === parseInt(productId));
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    if (parseInt(quantity) <= 0) {
        cart.items = cart.items.filter(item => item.productId !== parseInt(productId));
    } else {
        item.quantity = parseInt(quantity);
    }
    
    saveCart(sessionId, cart);
    res.json(cart);
});

// Remove item from cart
app.delete('/api/cart/remove/:productId', (req, res) => {
    const sessionId = req.sessionID;
    const productId = parseInt(req.params.productId);
    
    const cart = loadCart(sessionId);
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    saveCart(sessionId, cart);
    res.json(cart);
});

// Clear cart
app.delete('/api/cart/clear', (req, res) => {
    const sessionId = req.sessionID;
    const cart = { items: [], lastUpdated: new Date().toISOString() };
    
    saveCart(sessionId, cart);
    res.json(cart);
});

// Serve welcome page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Serve main store page
app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve main store page (alternative route)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Cart persistence enabled with 7-day expiration');
    cleanupExpiredCarts(); // Run cleanup on startup
});
