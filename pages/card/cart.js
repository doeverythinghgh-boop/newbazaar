// cart.js - إدارة صفحة سلة المشتريات

document.addEventListener('DOMContentLoaded', function () {
    initializeCartPage();
    // الاستماع لحدث تحديث السلة
    window.addEventListener('cartUpdated', refreshCartDisplay);
});

/**
 * تهيئة صفحة سلة المشتريات
 */
function initializeCartPage() {
    displayCartItems();
    updateCartSummary();
    setupCartEvents();
    updateCartBadge();
    loadSuggestedProducts();
    checkForExtraDiscount();
}

/**
 * عرض عناصر السلة
 */
function displayCartItems() {
    const cartItems = getCart();
    const container = document.getElementById('cart-items-container');

    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>سلة المشتريات فارغة</h3>
                <p>ابدأ التسوق الآن لإضافة منتجات إلى سلة مشترياتك</p>
                <button id="continue-shopping" class="btn btn-primary">
                    <i class="fas fa-shopping-bag"></i> متابعة التسوق
                </button>
            </div>
        `;
        return;
    }

    let cartHTML = '';

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const originalTotal = item.original_price * item.quantity;
        const discount = originalTotal - itemTotal;
        const discountPercentage = ((discount / originalTotal) * 100).toFixed(1);

        cartHTML += `
            <div class="cart-item" data-product-key="${item.product_key}">
                <div class="item-product">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.productName}" 
                             onerror="this.src='./assets/default-product.jpg'">
                    </div>
                    <div class="item-details">
                        <h4>${item.productName}</h4>
                        <div class="item-seller">
                            <i class="fas fa-store"></i> البائع: ${item.seller_key}
                        </div>
                        <div class="item-discount">
                            <span class="badge">توفير ${discountPercentage}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="item-price">
                    ${item.price.toFixed(2)} ر.س
                    <span class="original-price">${item.original_price.toFixed(2)} ر.س</span>
                </div>
                
                <div class="item-quantity">
                    <button class="quantity-btn decrease" data-product-key="${item.product_key}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           class="quantity-input"
                           value="${item.quantity}"
                           min="1"
                           max="99"
                           data-product-key="${item.product_key}">
                    <button class="quantity-btn increase" data-product-key="${item.product_key}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="item-total">
                    ${itemTotal.toFixed(2)} ر.س
                </div>
                
                <div class="item-actions">
                    <button class="remove-btn" data-product-key="${item.product_key}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cartHTML;
}

/**
 * تحديث ملخص السلة
 */
function updateCartSummary() {
    const cartItems = getCart();
    const subtotalElement = document.getElementById('cart-subtotal');
    const discountElement = document.getElementById('cart-discount');
    const totalElement = document.getElementById('cart-total');
    const itemCountElement = document.getElementById('cart-item-count');

    if (!subtotalElement || !totalElement) return;

    let subtotal = 0;
    let totalOriginal = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
        totalOriginal += item.original_price * item.quantity;
        totalItems += item.quantity;
    });

    const totalDiscount = totalOriginal - subtotal;
    const shippingCost = getSelectedShippingCost();
    const total = subtotal + shippingCost;

    subtotalElement.textContent = `${subtotal.toFixed(2)} ر.س`;

    if (discountElement) {
        discountElement.textContent = `-${totalDiscount.toFixed(2)} ر.س`;
    }

    totalElement.textContent = `${total.toFixed(2)} ر.س`;

    if (itemCountElement) {
        itemCountElement.textContent = `${totalItems} منتج`;
    }

    // تحديث عرض الخصم الإضافي
    checkForExtraDiscount();
}

/**
 * الحصول على تكلفة الشحن المحددة
 */
function getSelectedShippingCost() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    return selectedShipping ? parseFloat(selectedShipping.value) : 0;
}

/**
 * إعداد أحداث السلة
 */
function setupCartEvents() {
    // زر متابعة التسوق (عندما تكون السلة فارغة)
    document.addEventListener('click', function (e) {
        if (e.target.id === 'continue-shopping' || e.target.closest('#continue-shopping')) {
            window.location.href = './index.html';
        }
    });

    // زيادة الكمية
    document.addEventListener('click', function (e) {
        if (e.target.closest('.increase')) {
            const btn = e.target.closest('.increase');
            const productKey = btn.dataset.productKey;
            const input = document.querySelector(`.quantity-input[data-product-key="${productKey}"]`);
            const currentValue = parseInt(input.value) || 1;

            if (currentValue < 99) {
                input.value = currentValue + 1;
                updateCartQuantity(productKey, currentValue + 1);
                refreshCartDisplay();
            }
        }
    });

    // تقليل الكمية
    document.addEventListener('click', function (e) {
        if (e.target.closest('.decrease')) {
            const btn = e.target.closest('.decrease');
            const productKey = btn.dataset.productKey;
            const input = document.querySelector(`.quantity-input[data-product-key="${productKey}"]`);
            const currentValue = parseInt(input.value) || 1;

            if (currentValue > 1) {
                input.value = currentValue - 1;
                updateCartQuantity(productKey, currentValue - 1);
                refreshCartDisplay();
            }
        }
    });

    // تغيير الكمية يدويًا
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('quantity-input')) {
            const input = e.target;
            const productKey = input.dataset.productKey;
            const newQuantity = parseInt(input.value) || 1;

            if (newQuantity > 0 && newQuantity <= 99) {
                updateCartQuantity(productKey, newQuantity);
                refreshCartDisplay();
            } else {
                // إعادة تعيين القيمة إذا كانت غير صالحة
                const cart = getCart();
                const item = cart.find(item => item.product_key === productKey);
                if (item) {
                    input.value = item.quantity;
                }
            }
        }
    });

    // حذف منتج
    document.addEventListener('click', function (e) {
        if (e.target.closest('.remove-btn')) {
            const btn = e.target.closest('.remove-btn');
            const productKey = btn.dataset.productKey;

            Swal.fire({
                title: 'حذف المنتج',
                text: 'هل أنت متأكد من حذف هذا المنتج من السلة؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، احذف',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    removeFromCart(productKey);
                    refreshCartDisplay();

                    Swal.fire({
                        title: 'تم الحذف!',
                        text: 'تم حذف المنتج من سلة المشتريات.',
                        icon: 'success',
                        confirmButtonText: 'موافق'
                    });
                }
            });
        }
    });

    // إفراغ السلة
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function () {
            const cart = getCart();
            if (cart.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'السلة فارغة',
                    text: 'سلة المشتريات فارغة بالفعل',
                    confirmButtonText: 'موافق'
                });
                return;
            }

            Swal.fire({
                title: 'إفراغ السلة',
                text: 'هل أنت متأكد من إفراغ سلة المشتريات بالكامل؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، أفرغ السلة',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    clearCart();
                    refreshCartDisplay();

                    Swal.fire({
                        title: 'تم الإفراغ!',
                        text: 'تم إفراغ سلة المشتريات بالكامل.',
                        icon: 'success',
                        confirmButtonText: 'موافق'
                    });
                }
            });
        });
    }

    // تغيير طريقة الشحن
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    shippingOptions.forEach(option => {
        option.addEventListener('change', function () {
            updateCartSummary();
        });
    });

    // تطبيق كوبون الخصم
    const applyCouponBtn = document.getElementById('apply-coupon');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }

    const couponInput = document.getElementById('coupon-code');
    if (couponInput) {
        couponInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                applyCoupon();
            }
        });
    }

    // زر المتابعة للدفع
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            const cart = getCart();

            if (cart.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'سلة فارغة',
                    text: 'لا يمكنك المتابعة للدفع لأن سلة مشترياتك فارغة',
                    confirmButtonText: 'موافق'
                });
                return;
            }

            // الانتقال إلى صفحة الدفع
            window.location.href = './checkout.html';
        });
    }
}

/**
 * تطبيق كوبون الخصم
 */
function applyCoupon() {
    const couponCode = document.getElementById('coupon-code').value.trim();
    const messageElement = document.getElementById('coupon-message');

    if (!couponCode) {
        showCouponMessage('الرجاء إدخال كود الخصم', 'error');
        return;
    }

    // قائمة الكوبونات الصالحة (يمكن جلبها من قاعدة البيانات)
    const validCoupons = {
        'خصم10': { discount: 10, type: 'percentage' },
        'تخفيض20': { discount: 20, type: 'percentage' },
        'هدية50': { discount: 50, type: 'fixed' }
    };

    if (validCoupons[couponCode]) {
        const coupon = validCoupons[couponCode];
        localStorage.setItem('applied_coupon', JSON.stringify(coupon));

        let message = `تم تطبيق كود الخصم بنجاح! `;
        if (coupon.type === 'percentage') {
            message += `خصم ${coupon.discount}%`;
        } else {
            message += `خصم ${coupon.discount} ريال`;
        }

        showCouponMessage(message, 'success');
        updateCartSummary();
    } else {
        showCouponMessage('كود الخصم غير صالح', 'error');
        localStorage.removeItem('applied_coupon');
    }
}

/**
 * عرض رسالة الكوبون
 */
function showCouponMessage(message, type) {
    const messageElement = document.getElementById('coupon-message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `coupon-message coupon-${type}`;

    // إخفاء الرسالة بعد 5 ثوانٍ
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'coupon-message';
    }, 5000);
}

/**
 * التحقق من الخصم الإضافي
 */
function checkForExtraDiscount() {
    const cartItems = getCart();
    let subtotal = 0;

    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const extraDiscountInfo = document.getElementById('extra-discount-info');
    if (!extraDiscountInfo) return;

    // عروض إضافية بناءً على المبلغ
    if (subtotal >= 1000) {
        extraDiscountInfo.innerHTML = `
            <p>🎉 مبروك! لقد تأهلت للحصول على خصم إضافي 5%!</p>
            <small>قم بإضافة منتجات بقيمة ${(1500 - subtotal).toFixed(2)} ر.س للحصول على خصم 10%</small>
        `;
        extraDiscountInfo.style.display = 'block';
    } else if (subtotal >= 500) {
        extraDiscountInfo.innerHTML = `
            <p>🎁 أنت قريب من الخصم! أضف ${(1000 - subtotal).toFixed(2)} ر.س للحصول على خصم 5%</p>
        `;
        extraDiscountInfo.style.display = 'block';
    } else {
        extraDiscountInfo.style.display = 'none';
    }
}

/**
 * تحميل المنتجات المقترحة
 */
function loadSuggestedProducts() {
    // يمكن جلب هذه البيانات من قاعدة البيانات أو API
    const suggestedProducts = [
        {
            product_key: 'sug1',
            productName: 'منتج مقترح 1',
            price: 99.99,
            original_price: 129.99,
            image: 'https://via.placeholder.com/200x150?text=Product+1'
        },
        {
            product_key: 'sug2',
            productName: 'منتج مقترح 2',
            price: 149.99,
            original_price: 199.99,
            image: 'https://via.placeholder.com/200x150?text=Product+2'
        },
        {
            product_key: 'sug3',
            productName: 'منتج مقترح 3',
            price: 199.99,
            original_price: 249.99,
            image: 'https://via.placeholder.com/200x150?text=Product+3'
        },
        {
            product_key: 'sug4',
            productName: 'منتج مقترح 4',
            price: 79.99,
            original_price: 99.99,
            image: 'https://via.placeholder.com/200x150?text=Product+4'
        }
    ];

    const container = document.getElementById('suggested-products');
    if (!container) return;

    let productsHTML = '';

    suggestedProducts.forEach(product => {
        productsHTML += `
            <div class="suggested-product">
                <img src="${product.image}" alt="${product.productName}">
                <h5>${product.productName}</h5>
                <div class="price">
                    ${product.price.toFixed(2)} ر.س
                    <small style="display: block; color: #999; text-decoration: line-through;">
                        ${product.original_price.toFixed(2)} ر.س
                    </small>
                </div>
                <button class="btn btn-outline add-suggested" 
                        data-product='${JSON.stringify(product)}'>
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
            </div>
        `;
    });

    container.innerHTML = productsHTML;

    // إضافة أحداث لأزرار المنتجات المقترحة
    document.querySelectorAll('.add-suggested').forEach(button => {
        button.addEventListener('click', function () {
            const product = JSON.parse(this.dataset.product);
            addToCart(product, 1);
            refreshCartDisplay();

            Swal.fire({
                icon: 'success',
                title: 'تمت الإضافة',
                text: `تمت إضافة "${product.productName}" إلى السلة`,
                confirmButtonText: 'موافق'
            });
        });
    });
}

/**
 * تحديث عرض السلة بالكامل
 */
function refreshCartDisplay() {
    displayCartItems();
    updateCartSummary();
    updateCartBadge();
}