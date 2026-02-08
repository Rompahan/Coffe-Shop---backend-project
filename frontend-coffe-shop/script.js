class CoffeeShopApp {
    constructor() {
        // API Configuration
        this.API_BASE_URL = 'https://coffe-shop-backend-project.onrender.com';
        this.token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        
        // Initialize
        this.init();
    }

    init() {
        // DOM Elements
        this.elements = {
            userInfo: document.getElementById('userInfo'),
            dynamicContent: document.getElementById('dynamicContent'),
            contentTitle: document.getElementById('contentTitle'),
            contentSubtitle: document.getElementById('contentSubtitle'),
            apiUrl: document.getElementById('apiUrl'),
            apiStatus: document.getElementById('apiStatus'),
            btnTestAPI: document.getElementById('btnTestAPI'),
            backendUrl: document.getElementById('backendUrl')
        };

        // Setup event listeners
        this.setupEventListeners();
        
        // Check API status
        this.checkAPIStatus();
        
        // Update UI based on auth state
        this.updateAuthUI();
        
        // Set backend URL
        this.elements.backendUrl.textContent = this.API_BASE_URL;
        this.elements.apiUrl.textContent = this.API_BASE_URL;
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('btnLogin').addEventListener('click', () => this.showModal('login'));
        document.getElementById('btnRegister').addEventListener('click', () => this.showModal('register'));
        document.getElementById('btnViewProducts').addEventListener('click', () => this.loadProducts());
        document.getElementById('btnAddProduct').addEventListener('click', () => this.showAddProductForm());
        document.getElementById('btnProfile').addEventListener('click', () => this.loadProfile());
        document.getElementById('btnLogout').addEventListener('click', () => this.logout());
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.getAttribute('data-modal');
                this.hideModal(modal);
            });
        });
        
        // Form submissions
        document.getElementById('btnSubmitLogin').addEventListener('click', () => this.login());
        document.getElementById('btnSubmitRegister').addEventListener('click', () => this.register());
        
        // Modal switching
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login');
            this.showModal('register');
        });
        
        // API test
        this.elements.btnTestAPI.addEventListener('click', () => this.checkAPIStatus(true));
        
        // Footer links
        document.getElementById('viewProductsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadProducts();
        });
        
        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const modalId = modal.id.replace('modal', '').toLowerCase();
                    this.hideModal(modalId);
                }
            });
        });
    }

    // API Status Check
    async checkAPIStatus(showNotification = false) {
        const statusDot = this.elements.apiStatus.querySelector('.status-dot');
        this.elements.apiStatus.innerHTML = '<span class="status-dot"></span> Checking...';
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/`);
            if (response.ok) {
                statusDot.className = 'status-dot connected';
                this.elements.apiStatus.innerHTML = '<span class="status-dot connected"></span> Connected';
                if (showNotification) {
                    this.showNotification('API is connected and working', 'success');
                }
            } else {
                throw new Error('API returned error');
            }
        } catch (error) {
            statusDot.className = 'status-dot error';
            this.elements.apiStatus.innerHTML = '<span class="status-dot error"></span> Connection Failed';
            if (showNotification) {
                this.showNotification('Failed to connect to API. Please check the URL.', 'error');
            }
        }
    }

    // Authentication Methods
    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                
                // Save to localStorage
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                this.showNotification('Login successful!', 'success');
                this.hideModal('login');
                this.updateAuthUI();
                this.loadProfile();
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async register() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirm = document.getElementById('registerConfirm').value.trim();
        
        if (!username || !email || !password) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'warning');
            return;
        }
        
        if (password !== confirm) {
            this.showNotification('Passwords do not match', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.hideModal('register');
                this.showModal('login');
                
                // Clear form
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerConfirm').value = '';
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showNotification('Logged out successfully', 'success');
        this.updateAuthUI();
        this.showWelcomeScreen();
    }

    // Product Management
    async loadProducts() {
        if (!this.token) {
            this.showNotification('Please login to view products', 'warning');
            this.showModal('login');
            return;
        }
        
        this.elements.contentTitle.textContent = 'Coffee Products';
        this.elements.contentSubtitle.textContent = 'Manage your coffee shop menu';
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/products`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderProducts(data.products || []);
            } else {
                throw new Error('Failed to load products');
            }
        } catch (error) {
            this.elements.dynamicContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Products</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="app.loadProducts()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    renderProducts(products) {
        if (products.length === 0) {
            this.elements.dynamicContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coffee"></i>
                    <h3>No Products Found</h3>
                    <p>Start by adding your first coffee product</p>
                    <button class="btn-primary" onclick="app.showAddProductForm()">
                        <i class="fas fa-plus"></i> Add First Product
                    </button>
                </div>
            `;
            return;
        }
        
        const productsHtml = products.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <h4>${product.name}</h4>
                    <span class="product-price">$${product.price}</span>
                </div>
                <div class="product-body">
                    <p class="product-description">${product.description}</p>
                    <div class="product-details">
                        <span class="product-category">${product.category}</span>
                        <span class="product-stock">Stock: ${product.stock}</span>
                        <span class="product-status ${product.available ? 'available' : 'unavailable'}">
                            ${product.available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn-secondary" onclick="app.editProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="app.deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        this.elements.dynamicContent.innerHTML = `
            <div class="products-header">
                <h3>${products.length} Products</h3>
                <button class="btn-primary" onclick="app.showAddProductForm()">
                    <i class="fas fa-plus"></i> Add New Product
                </button>
            </div>
            <div class="products-grid">
                ${productsHtml}
            </div>
        `;
    }

    showAddProductForm() {
        if (!this.token) {
            this.showNotification('Please login to add products', 'warning');
            this.showModal('login');
            return;
        }
        
        this.elements.contentTitle.textContent = 'Add New Product';
        this.elements.contentSubtitle.textContent = 'Add a new item to your coffee menu';
        
        this.elements.dynamicContent.innerHTML = `
            <div class="product-form">
                <div class="form-group">
                    <label for="productName">Product Name</label>
                    <input type="text" id="productName" placeholder="e.g., Espresso">
                </div>
                <div class="form-group">
                    <label for="productDescription">Description</label>
                    <textarea id="productDescription" rows="3" placeholder="Describe your product..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productPrice">Price ($)</label>
                        <input type="number" id="productPrice" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="productStock">Stock</label>
                        <input type="number" id="productStock" min="0" value="100">
                    </div>
                </div>
                <div class="form-group">
                    <label for="productCategory">Category</label>
                    <select id="productCategory">
                        <option value="espresso">Espresso</option>
                        <option value="cappuccino">Cappuccino</option>
                        <option value="latte">Latte</option>
                        <option value="tea">Tea</option>
                        <option value="snack">Snack</option>
                                        </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="productAvailable" checked>
                        Available for sale
                    </label>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="app.loadProducts()">
                        <i class="fas fa-arrow-left"></i> Back to Products
                    </button>
                    <button class="btn-primary" onclick="app.createProduct()">
                        <i class="fas fa-save"></i> Create Product
                    </button>
                </div>
            </div>
        `;
    }

    async createProduct() {
        if (!this.token) {
            this.showNotification('Please login to create products', 'warning');
            this.showModal('login');
            return;
        }

        const product = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value,
            available: document.getElementById('productAvailable').checked
        };

        // Validation
        if (!product.name || !product.description || !product.price) {
            this.showNotification('Please fill in all required fields', 'warning');
            return;
        }

        if (product.price <= 0) {
            this.showNotification('Price must be greater than 0', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(product)
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Product created successfully!', 'success');
                this.loadProducts();
            } else {
                throw new Error(data.message || 'Failed to create product');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        if (!this.token) {
            this.showNotification('Please login to delete products', 'warning');
            this.showModal('login');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Product deleted successfully!', 'success');
                this.loadProducts();
            } else {
                throw new Error(data.message || 'Failed to delete product');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    editProduct(productId) {
        // TODO: Implement edit product functionality
        this.showNotification('Edit feature coming soon!', 'warning');
    }

    // Profile Management
    async loadProfile() {
        if (!this.token) {
            this.showNotification('Please login to view profile', 'warning');
            this.showModal('login');
            return;
        }

        this.elements.contentTitle.textContent = 'My Profile';
        this.elements.contentSubtitle.textContent = 'View and update your profile information';

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.renderProfile(data.user);
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            this.elements.dynamicContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Profile</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="app.loadProfile()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    renderProfile(user) {
        this.elements.dynamicContent.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-info">
                        <h3>${user.username}</h3>
                        <p class="profile-email">${user.email}</p>
                        <p class="profile-role">Role: <span>${user.role}</span></p>
                        <p class="profile-joined">Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4>Account Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>User ID:</label>
                            <span class="info-value">${user.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Username:</label>
                            <span class="info-value">${user.username}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span class="info-value">${user.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Account Type:</label>
                            <span class="info-value">${user.role}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4>Update Profile</h4>
                    <div class="form-group">
                        <label for="updateUsername">Username</label>
                        <input type="text" id="updateUsername" value="${user.username}">
                    </div>
                    <div class="form-group">
                        <label for="updateEmail">Email</label>
                        <input type="email" id="updateEmail" value="${user.email}">
                    </div>
                    <div class="form-actions">
                        <button class="btn-primary" onclick="app.updateProfile()">
                            <i class="fas fa-save"></i> Update Profile
                        </button>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4>Session Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>JWT Token:</label>
                            <span class="info-value token-preview">${this.token.substring(0, 20)}...</span>
                        </div>
                        <div class="info-item">
                            <label>Token Expires:</label>
                            <span class="info-value">30 days from login</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async updateProfile() {
        if (!this.token) {
            this.showNotification('Please login to update profile', 'warning');
            this.showModal('login');
            return;
        }

        const updates = {
            username: document.getElementById('updateUsername').value.trim(),
            email: document.getElementById('updateEmail').value.trim()
        };

        if (!updates.username || !updates.email) {
            this.showNotification('Username and email are required', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                // Update local user data
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                this.showNotification('Profile updated successfully!', 'success');
                this.updateAuthUI();
                this.loadProfile();
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // UI Helper Methods
    showWelcomeScreen() {
        this.elements.contentTitle.textContent = 'Welcome to Coffee Shop Admin';
        this.elements.contentSubtitle.textContent = 'Manage your coffee shop products and users';
        
        this.elements.dynamicContent.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-coffee"></i>
                </div>
                <h3>Welcome to the Admin Dashboard</h3>
                <p>Please use the sidebar to navigate through the application features.</p>
                <div class="features">
                    <div class="feature">
                        <i class="fas fa-user-check"></i>
                        <h4>User Authentication</h4>
                        <p>Register new users and login with JWT tokens</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-coffee"></i>
                        <h4>Product Management</h4>
                        <p>Create, view, update and delete coffee products</p>
                    </div>
                    <div class="feature">
                        <i class="fas fa-user-cog"></i>
                        <h4>Profile Management</h4>
                        <p>View and update your user profile</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateAuthUI() {
        if (this.currentUser && this.token) {
            this.elements.userInfo.innerHTML = `
                <div class="user-display">
                    <i class="fas fa-user-circle"></i>
                    <div class="user-details">
                        <strong>${this.currentUser.username}</strong>
                        <small>${this.currentUser.email}</small>
                    </div>
                </div>
            `;
            
            // Update navigation
            document.getElementById('btnProfile').disabled = false;
            document.getElementById('btnLogout').disabled = false;
            document.getElementById('btnViewProducts').disabled = false;
            document.getElementById('btnAddProduct').disabled = false;
            
            document.getElementById('btnLogin').classList.remove('active');
            document.getElementById('btnProfile').classList.add('active');
        } else {
            this.elements.userInfo.innerHTML = `
                <span>Please login to continue</span>
            `;
            
            // Update navigation
            document.getElementById('btnProfile').disabled = true;
            document.getElementById('btnLogout').disabled = true;
            document.getElementById('btnViewProducts').disabled = true;
            document.getElementById('btnAddProduct').disabled = true;
            
            document.getElementById('btnProfile').classList.remove('active');
            document.getElementById('btnLogin').classList.add('active');
        }
    }

    showModal(modalType) {
        document.getElementById(`modal${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalType) {
        document.getElementById(`modal${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`).classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showNotification(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');
        
        toast.className = `toast show ${type}`;
        toastMessage.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoffeeShopApp();
});

// Add missing CSS styles
const additionalStyles = `
    /* Product Cards */
    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }

    .product-card {
        background: white;
        border-radius: 10px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e9ecef;
        transition: transform 0.3s ease;
    }

    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .product-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #f8f9fa;
    }

    .product-header h4 {
        color: #2c3e50;
        font-size: 1.2rem;
        margin: 0;
    }

    .product-price {
        background: #8B4513;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .product-description {
        color: #7f8c8d;
        margin-bottom: 1rem;
        line-height: 1.5;
    }

    .product-details {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .product-category, .product-stock, .product-status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .product-category {
        background: #e3f2fd;
        color: #1565c0;
    }

    .product-stock {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .product-status.available {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .product-status.unavailable {
        background: #ffebee;
        color: #c62828;
    }

    .product-actions {
        display: flex;
        gap: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .btn-danger {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .btn-danger:hover {
        background: #c0392b;
    }

    .products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    /* Profile Styles */
    .profile-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }

    .profile-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid #f8f9fa;
    }

    .profile-avatar {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
    }

    .profile-info h3 {
        color: #2c3e50;
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
    }

    .profile-email {
        color: #7f8c8d;
        margin-bottom: 0.5rem;
    }

    .profile-role span {
        background: #e3f2fd;
        color: #1565c0;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .profile-joined {
        color: #95a5a6;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .profile-section {
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #e9ecef;
    }

    .profile-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .profile-section h4 {
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-size: 1.3rem;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .info-item {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .info-item label {
        display: block;
        color: #7f8c8d;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .info-value {
        color: #2c3e50;
        font-weight: 500;
        word-break: break-all;
    }

    .token-preview {
        font-family: 'Courier New', monospace;
        background: #2c3e50;
        color: #ecf0f1;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
    }

    /* Form Styles */
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        font-size: 1rem;
        font-family: 'Poppins', sans-serif;
        resize: vertical;
        min-height: 100px;
    }

    textarea:focus {
        outline: none;
        border-color: #8B4513;
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }

    select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        cursor: pointer;
    }

    select:focus {
        outline: none;
        border-color: #8B4513;
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }

    /* Empty States */
    .empty-state, .error-message {
        text-align: center;
        padding: 4rem 2rem;
    }

    .empty-state i, .error-message i {
        font-size: 4rem;
        color: #95a5a6;
        margin-bottom: 1.5rem;
    }

    .error-message i {
        color: #e74c3c;
    }

    .empty-state h3, .error-message h3 {
        color: #2c3e50;
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .empty-state p, .error-message p {
        color: #7f8c8d;
        max-width: 500px;
        margin: 0 auto 2rem;
    }

    /* User Display */
    .user-display {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .user-display i {
        font-size: 1.5rem;
        color: #FFD700;
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .user-details strong {
        color: white;
        font-size: 0.9rem;
    }

    .user-details small {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.8rem;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);