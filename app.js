let products = [];
let cart = JSON.parse(localStorage.getItem('lunea_cart')) || [];
const productsGrid = document.getElementById('products-grid');
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const FACEBOOK_PAGE_URL = "https://www.facebook.com/share/19VBfMDFVb/?mibextid=wwXIfr";
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        renderProducts();
        updateCartUI();
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">عذراً، حدث خطأ أثناء تحميل المنتجات.</p>';
    }
}
function renderProducts() {
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const isAdded = cart.some(item => item.id === product.id);
        const stockBadge = !product.inStock ? '<div class="out-of-stock-badge">نفذت الكمية</div>' : '';
        const btnClass = !product.inStock ? 'disabled-btn' : (isAdded ? 'added' : '');
        const btnAction = !product.inStock ? '' : `onclick="toggleCart(${product.id}, this)"`;
        const iconClass = !product.inStock ? 'fa-ban' : (isAdded ? 'fa-check' : 'fa-plus');
        const card = document.createElement('div');
        card.className = `product-card ${!product.inStock ? 'out-of-stock-card' : ''}`;
        card.innerHTML = `
            <div class="product-image-container">
                ${stockBadge}
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x250?text=Lunéa'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price} ج.م</span>
                    <button class="add-to-cart-btn ${btnClass}" ${btnAction}>
                        <i class="fas ${iconClass}"></i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}
function toggleCart(productId, btnElement) {
    const product = products.find(p => p.id === productId);
    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        openCart();
    } else {
        cart.push({ ...product, quantity: 1 });
        btnElement.classList.add('added');
        btnElement.innerHTML = '<i class="fas fa-check"></i>';
        showToast('تمت إضافة المنتج للسلة بنجاح');
        saveCart();
        updateCartUI();
        btnElement.style.transform = 'scale(1.2)';
        setTimeout(() => btnElement.style.transform = 'scale(1)', 200);
    }
}
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
            renderProducts();
        }
        saveCart();
        updateCartUI();
    }
}
function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
    renderProducts(); 
}
function saveCart() {
    localStorage.setItem('lunea_cart', JSON.stringify(cart));
}
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">سلة المشتريات فارغة</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/70?text=L'">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">${item.price} ج.م</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    }
    cartTotalPrice.textContent = `${total} ج.م`;
}
function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}
function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
function processCheckout() {
    if (cart.length === 0) {
        showToast('السلة فارغة!');
        return;
    }
    let orderText = "مرحباً Lunéa، أود طلب المنتجات التالية:\n\n";
    let total = 0;
    cart.forEach((item, index) => {
        orderText += `${index + 1}- ${item.name} (الكمية: ${item.quantity}) - السعر: ${item.price * item.quantity} ج.م\n`;
        total += item.price * item.quantity;
    });
    orderText += `\nالإجمالي الكلي: ${total} ج.م\n`;
    orderText += "الرجاء تأكيد الطلب وتحديد موعد الشحن. شكراً لكم!";
    navigator.clipboard.writeText(orderText).then(() => {
        showToast('تم نسخ تفاصيل الطلب، سيتم توجيهك للمراسلة...');
        setTimeout(() => {
            window.open(FACEBOOK_PAGE_URL, '_blank');
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        window.open(FACEBOOK_PAGE_URL, '_blank');
    });
}
cartIcon.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
checkoutBtn.addEventListener('click', processCheckout);
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 26, 36, 0.95)';
        navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    } else {
        navbar.style.background = 'rgba(26, 26, 36, 0.7)';
        navbar.style.boxShadow = 'none';
    }
});
document.addEventListener('DOMContentLoaded', loadProducts);
