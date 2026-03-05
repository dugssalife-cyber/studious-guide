// ==================== GLOBAL VARIABLES ====================

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = '';

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
    initializeNavigation();
    initializeCurrentPage();
});

// ==================== NAVIGATION ====================

function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ==================== PRODUCTS LOADING ====================

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        initializeCurrentPage();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ==================== PAGE SPECIFIC INITIALIZATION ====================

function initializeCurrentPage() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path.endsWith('/')) {
        initializeHomePage();
    } else if (path.includes('products.html')) {
        initializeProductsPage();
    } else if (path.includes('product-detail.html')) {
        initializeProductDetailPage();
    } else if (path.includes('cart.html')) {
        initializeCartPage();
    } else if (path.includes('contact.html')) {
        initializeContactPage();
    }
}

// ==================== HOMEPAGE ====================

function initializeHomePage() {
    displayFeaturedProducts();
}

function displayFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    const featuredProducts = products.slice(0, 6);
    container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');

    attachProductCardListeners();
}

function createProductCard(product) {
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div style="font-size: 80px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; height: 250px;">
                ${product.image}
            </div>
            <div class="product-details">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">⭐ ${product.rating} (${product.reviews} reviews)</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-footer">
                    <button type="button" class="view-product-btn">View Details</button>
                    <button type="button" class="add-to-cart-btn">Add Cart</button>
                </div>
            </div>
        </div>
    `;
}

function attachProductCardListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = parseInt(card.dataset.productId);

        card.querySelector('.view-product-btn').addEventListener('click', () => {
            window.location.href = `product-detail.html?id=${productId}`;
        });

        card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(productId, 1);
            showNotification('Product added to cart!');
        });

        card.addEventListener('click', () => {
            window.location.href = `product-detail.html?id=${productId}`;
        });
    });
}

// ==================== PRODUCTS PAGE ====================

function initializeProductsPage() {
    displayAllProducts();

    // Filter listeners
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', filterProducts);
    });

    document.getElementById('priceRange').addEventListener('input', (e) => {
        document.getElementById('priceValue').textContent = e.target.value;
        filterProducts();
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    document.getElementById('sortBy').addEventListener('change', filterProducts);
}

function displayAllProducts(productsToDisplay = products) {
    const container = document.getElementById('productsGrid');
    const countElement = document.getElementById('productsCount');

    if (!container) return;

    countElement.textContent = productsToDisplay.length;

    container.innerHTML = productsToDisplay.map(product => createProductCard(product)).join('');

    attachProductCardListeners();
}

function filterProducts() {
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(cb => cb.value);
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    const sortBy = document.getElementById('sortBy').value;

    let filtered = products.filter(product => {
        return selectedCategories.includes(product.category) && product.price <= maxPrice;
    });

    // Sort
    filtered = sortProducts(filtered, sortBy);

    displayAllProducts(filtered);
}

function sortProducts(productsToSort, sortBy) {
    const sorted = [...productsToSort];

    switch (sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'popular':
            return sorted.sort((a, b) => b.reviews - a.reviews);
        case 'newest':
        default:
            return sorted.sort((a, b) => b.id - a.id);
    }
}

function resetFilters() {
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.checked = true;
    });

    document.getElementById('priceRange').value = 1000;
    document.getElementById('priceValue').textContent = '1000';
    document.getElementById('sortBy').value = 'newest';

    filterProducts();
}

// ==================== PRODUCT DETAIL PAGE ====================

function initializeProductDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));

    const product = products.find(p => p.id === productId);

    if (!product) {
        document.body.innerHTML = '<p>Product not found</p>';
        return;
    }

    displayProductDetail(product);
    displayRelatedProducts(product);

    // Event listeners
    document.getElementById('increaseQty').addEventListener('click', increaseQuantity);
    document.getElementById('decreaseQty').addEventListener('click', decreaseQuantity);
    document.getElementById('addToCartBtn').addEventListener('click', addProductToCart);
    document.getElementById('wishlistBtn').addEventListener('click', toggleWishlist);

    // Shipping options
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', updateShippingCost);
    });
}

function displayProductDetail(product) {
    document.getElementById('breadcrumbProduct').textContent = product.name;
    document.getElementById('mainImage').src = '';
    document.getElementById('mainImage').innerHTML = `<div style="font-size: 200px;">${product.image}</div>`;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('categoryBadge').textContent = product.category;
    document.getElementById('productPrice').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productRating').textContent = '⭐'.repeat(Math.round(product.rating));
    document.getElementById('reviewCount').textContent = product.reviews;
    document.getElementById('productSKU').textContent = product.sku;
    document.getElementById('productStock').textContent = product.stock;

    // Features
    const featuresContainer = document.getElementById('productFeatures');
    featuresContainer.innerHTML = '<ul>' + product.features.map(f => `<li>${f}</li>`).join('') + '</ul>';

    // Stock status
    const stockStatus = document.getElementById('stockStatus');
    if (product.stock > 0) {
        stockStatus.textContent = 'In Stock';
        stockStatus.style.color = '#28a745';
    } else {
        stockStatus.textContent = 'Out of Stock';
        stockStatus.style.color = '#dc3545';
    }
}

function displayRelatedProducts(currentProduct) {
    const container = document.getElementById('relatedProducts');
    const related = products
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);

    container.innerHTML = related.map(product => createProductCard(product)).join('');
    attachProductCardListeners();
}

function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.min(parseInt(input.value) + 1, 100);
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.max(parseInt(input.value) - 1, 1);
}

function addProductToCart() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));
    const quantity = parseInt(document.getElementById('quantity').value);

    addToCart(productId, quantity);
    showNotification('Product added to cart!');

    // Reset quantity
    document.getElementById('quantity').value = 1;
}

function toggleWishlist() {
    const btn = document.getElementById('wishlistBtn');
    btn.classList.toggle('active');

    if (btn.classList.contains('active')) {
        btn.style.background = '#ff6b6b';
        btn.style.color = 'white';
        btn.textContent = '❤ Wishlisted';
        showNotification('Added to wishlist!');
    } else {
        btn.style.background = '';
        btn.style.color = '';
        btn.textContent = '♡ Wishlist';
        showNotification('Removed from wishlist!');
    }
}

// ==================== CART MANAGEMENT ====================

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
    }

    saveCart();
    updateCartCount();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartPage();
}

function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        updateCartPage();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

// ==================== SHOPPING CART PAGE ====================

function initializeCartPage() {
    updateCartPage();

    if (cart.length > 0) {
        document.getElementById('applyCoupon').addEventListener('click', applyCoupon);
        document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);

        document.querySelectorAll('input[name="shipping"]').forEach(radio => {
            radio.addEventListener('change', calculateTotal);
        });
    }
}

function updateCartPage() {
    const emptyMessage = document.getElementById('emptyCartMessage');
    const cartContent = document.getElementById('cartContent');

    if (cart.length === 0) {
        emptyMessage.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }

    emptyMessage.style.display = 'none';
    cartContent.style.display = 'grid';

    displayCartItems();
    calculateTotal();
}

function displayCartItems() {
    const container = document.getElementById('cartItems');

    container.innerHTML = cart.map(item => `
        <tr>
            <td class="cart-item-name">${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <input type="number" class="qty-input-small" value="${item.quantity}" 
                    onchange="updateCartItemQuantity(${item.id}, this.value)">
            </td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
            <td>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </td>
        </tr>
    `).join('');
}

function calculateTotal() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const shippingCosts = { standard: 10, express: 25, overnight: 50 };
    const shipping = subtotal > 50 && shippingMethod === 'standard' ? 0 : shippingCosts[shippingMethod];

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    document.getElementById('tax').textContent = tax.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.toUpperCase();
    const coupons = {
        'SAVE10': 0.10,
        'SAVE20': 0.20,
        'FREESHIP': 0
    };

    if (couponCode in coupons) {
        showNotification(`Coupon "${couponCode}" applied!`);
        document.getElementById('couponCode').value = '';
    } else {
        showNotification('Invalid coupon code', 'error');
    }
}

function proceedToCheckout() {
    showNotification('Thank you for your order! This is a demo store.', 'success');
    setTimeout(() => {
        cart = [];
        saveCart();
        updateCartCount();
        window.location.href = 'index.html';
    }, 2000);
}

function updateShippingCost() {
    calculateTotal();
}

// ==================== CONTACT PAGE ====================

function initializeContactPage() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', handleContactFormSubmit);
    }
}

function handleContactFormSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        subscribe: document.getElementById('subscribe').checked
    };

    // Simulate form submission
    showNotification('Thank you for contacting us! We will respond within 24 hours.', 'success');

    // Reset form
    document.getElementById('contactForm').reset();

    console.log('Form submitted:', formData);
}

// ==================== NOTIFICATIONS ====================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ANIMATIONS ====================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
