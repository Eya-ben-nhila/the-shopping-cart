// Welcome page JavaScript
class WelcomePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addScrollAnimations();
    }

    setupEventListeners() {
        // Smooth scrolling for navigation
        document.addEventListener('DOMContentLoaded', () => {
            // Add smooth scroll behavior
            document.documentElement.style.scrollBehavior = 'smooth';
        });

        // Handle form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('loginModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Add parallax effect to hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    addScrollAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe feature cards and preview items
        document.querySelectorAll('.feature-card, .preview-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    showLogin() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    showSignup() {
        // For demo purposes, just go to store
        // In a real app, this would show a signup form
        this.goToStore();
    }

    closeModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simulate login (in real app, this would be an API call)
        if (email && password) {
            // Store user info in sessionStorage for demo purposes
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('isLoggedIn', 'true');
            
            this.showNotification('Welcome back! Redirecting to store...', 'success');
            
            setTimeout(() => {
                this.goToStore();
            }, 1500);
        } else {
            this.showNotification('Please fill in all fields', 'error');
        }
    }

    goToStore() {
        // Store a flag to indicate user came from welcome page
        sessionStorage.setItem('fromWelcome', 'true');
        window.location.href = '/index.html';
    }

    scrollToFeatures() {
        const features = document.getElementById('features');
        if (features) {
            features.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for onclick handlers
let welcomePage;

function goToStore() {
    welcomePage.goToStore();
}

function showLogin() {
    welcomePage.showLogin();
}

function showSignup() {
    welcomePage.showSignup();
}

function closeModal() {
    welcomePage.closeModal();
}

function scrollToFeatures() {
    welcomePage.scrollToFeatures();
}

// Initialize welcome page
document.addEventListener('DOMContentLoaded', () => {
    welcomePage = new WelcomePage();
});
