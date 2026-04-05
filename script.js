// State
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const categoryGrid = document.querySelector('.category-grid');
const cartToggleBtn = document.getElementById('cart-toggle');
const closeCartBtn = document.getElementById('close-cart');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartBadge = document.getElementById('cart-badge');
const cartTotalPrice = document.getElementById('cart-total-price');
const navbar = document.getElementById('navbar');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await fetchCategories();
    await fetchProducts();
    updateCartUI();
});

// Setup Listeners
function setupEventListeners() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    cartToggleBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    
    checkoutBtn.addEventListener('click', checkout);
}

// Fetch APIs
async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        categories = await res.json();
        renderCategories();
    } catch (err) {
        console.error("Failed to load categories", err);
    }
}

async function fetchProducts(category = 'all') {
    currentCategory = category;
    try {
        const url = category === 'all' ? '/api/products' : `/api/products?category=${category}`;
        const res = await fetch(url);
        products = await res.json();
        renderProducts();
    } catch (err) {
        console.error("Failed to load products", err);
    }
}

// Renders
function renderCategories() {
    // Add "All" category at the beginning
    let html = `
        <div class="category-card ${currentCategory === 'all' ? 'active-cat' : ''}" onclick="fetchProducts('all')">
            <div class="cat-icon-wrapper"><i class="fa-solid fa-border-all"></i></div>
            <h3>All Products</h3>
            <p>View All</p>
        </div>
    `;
    
    html += categories.map((cat) => `
        <div class="category-card ${currentCategory === cat.id ? 'active-cat' : ''}" onclick="fetchProducts('${cat.id}')">
            <div class="cat-icon-wrapper"><i class="fa-solid ${cat.icon}"></i></div>
            <h3>${cat.name}</h3>
            <p>${cat.itemCount}+ items</p>
        </div>
    `).join('');
    
    categoryGrid.innerHTML = html;
}

function renderProducts() {
    if (products.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found in this category.</p>';
        return;
    }
    
    productGrid.innerHTML = products.map((product, index) => `
        <div class="product-card pop-anim" style="animation-delay: ${(index % 10) * 0.1}s">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-actions">
                <button class="action-btn"><i class="fa-regular fa-heart"></i></button>
                <button class="action-btn"><i class="fa-regular fa-eye"></i></button>
            </div>
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.name}" id="img-prod-${product.id}">
            </div>
            <div class="product-info">
                <p class="product-category">${product.category_id}</p>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-bottom">
                    <div class="product-price">
                        $${product.price.toFixed(2)}
                        ${product.oldPrice ? `<strike>$${product.oldPrice.toFixed(2)}</strike>` : ''}
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})" aria-label="Add to Cart">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Re-render categories to update active state
    renderCategories();
}

// Cart Logic
function toggleCart() {
    cartDrawer.classList.toggle('open');
    cartOverlay.classList.toggle('active');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    cartToggleBtn.classList.remove('pop-anim');
    void cartToggleBtn.offsetWidth; 
    cartToggleBtn.classList.add('pop-anim');

    updateCartUI();
    if (!cartDrawer.classList.contains('open')) {
        toggleCart();
    }
}

function updateQuantity(productId, change) {
    const itemInfo = cart.find(item => item.id === productId);
    if (!itemInfo) return;

    itemInfo.quantity += change;

    if (itemInfo.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is currently empty.</div>';
        cartTotalPrice.textContent = '$0.00';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" id="cart-img-${item.id}">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)"><i class="fa-solid fa-minus" style="font-size: 10px;"></i></button>
                    <span style="font-size: 0.9rem; width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)"><i class="fa-solid fa-plus" style="font-size: 10px;"></i></button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `$${total.toFixed(2)}`;
}

// Checkout
async function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, total })
        });
        
        if (res.ok) {
            alert("Order placed successfully!");
            cart = [];
            updateCartUI();
            toggleCart();
        } else {
            const data = await res.json();
            alert("Checkout failed: " + data.error);
        }
    } catch (err) {
        console.error("Checkout error", err);
        alert("An error occurred during checkout.");
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Proceed to Checkout";
    }
}
