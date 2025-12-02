/**
 * @file js/cardPackage.js
 * @description وحدة لإدارة سلة المشتريات.
 * 
 * توفر هذه الوحدة مجموعة من الدوال للتعامل مع سلة المشتريات المحفوظة في LocalStorage.
 * تشمل العمليات: الإضافة، الحذف، تحديث الكمية، جلب محتويات السلة، وحساب الإجمالي.
 */

/**
 * @description ينشئ مفتاح تخزين فريد للسلة بناءً على المستخدم المسجل دخوله.
 * @function getCartStorageKey
 * @returns {string|null} - مفتاح السلة (مثل 'cart_abcd1234') إذا كان هناك مستخدم مسجل دخوله، وإلا `null`.
 * @see localStorage
 */
function getCartStorageKey() {

  if (window.userSession && window.userSession.user_key) {
    console.log(`cart_${window.userSession.user_key}`);
    return `cart_${window.userSession.user_key}`; // ربط السلة بالـ user_key
  }
  return null; // لا يوجد مستخدم، لا توجد سلة
}

/**
 * @description يجلب السلة الحالية من LocalStorage.
 * @function getCart
 * @returns {Array<Object>} - مصفوفة من كائنات المنتجات الموجودة في السلة، أو مصفوفة فارغة إذا كانت السلة فارغة أو حدث خطأ.
 * @see getCartStorageKey
 */
function getCart() {
  const CART_STORAGE_KEY = getCartStorageKey();
  if (!CART_STORAGE_KEY) return [];

  try {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    const cart = cartJson ? JSON.parse(cartJson) : [];
    
    // إضافة ملاحظة افتراضية إذا لم تكن موجودة
    return cart.map(item => ({
      ...item,
      note: item.note || ''
    }));
  } catch (error) {
    console.error("خطأ في قراءة السلة من LocalStorage:", error);
    return [];
  }
}

/**
 * @description يحفظ السلة المحدثة في LocalStorage ويرسل حدثًا مخصصًا (`cartUpdated`) لإعلام المكونات الأخرى بالتغيير.
 * @function saveCart
 * @param {Array<Object>} cart - مصفوفة كائنات المنتجات التي تمثل السلة الحالية.
 * @returns {void}
 * @see getCartStorageKey
 */
function saveCart(cart) {
  const CART_STORAGE_KEY = getCartStorageKey();
  if (!CART_STORAGE_KEY) return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // إرسال حدث مخصص لإعلام أجزاء أخرى من التطبيق بتحديث السلة
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error("خطأ في حفظ السلة في LocalStorage:", error);
  }
}

/**
 * @description يضيف منتجًا إلى السلة، أو يقوم بتحديث كميته إذا كان المنتج موجودًا بالفعل.
 * @function addToCart
 * @param {Object} product - كائن المنتج المراد إضافته.
 * @param {number} quantity - الكمية المراد إضافتها للمنتج.
 * @param {string} note - ملاحظة للمنتج (اختياري).
 * @returns {boolean} - true إذا تمت الإضافة بنجاح، false إذا كان البائع هو نفسه المستخدم.
 */
function addToCart(product, quantity, note = '') {
  // منع المستخدم من الشراء من نفسه
  if (window.userSession && window.userSession.user_key === product.seller_key) {
    window.Swal.fire({
      icon: 'error',
      title: 'عذراً',
      text: 'لا يمكنك شراء منتجاتك الخاصة',
      confirmButtonText: 'موافق'
    });
    return false;
  }

  const cart = getCart();
  const existingProductIndex = cart.findIndex(item => item.product_key === product.product_key);

  if (existingProductIndex > -1) {
    // المنتج موجود، قم بتحديث الكمية
    cart[existingProductIndex].quantity += quantity;
    if (note) cart[existingProductIndex].note = note;
  } else {
    // المنتج غير موجود، أضفه كعنصر جديد
    const newCartItem = {
      ...product,
      quantity,
      note,
      addedDate: new Date().toISOString() // إضافة تاريخ الإضافة
    };
    if (!newCartItem.product_key && product.product_key) {
      newCartItem.product_key = product.product_key;
    }
    cart.push(newCartItem);
  }

  saveCart(cart);

  window.Swal.fire({
    icon: 'success',
    title: `تمت إضافة "${product.productName}" إلى السلة`,
    text: 'يمكنك متابعة التسوق.',
    confirmButtonText: 'موافق'
  }).then((result) => {
    if (result.isConfirmed) {
    containerGoBack();
    }
  });
  return true;
}

/**
 * @description يزيل منتجًا محددًا من السلة بناءً على مفتاحه الفريد.
 * @function removeFromCart
 * @param {string} productKey - المفتاح الفريد للمنتج المراد إزالته من السلة.
 * @returns {void}
 */
function removeFromCart(productKey) {
  let cart = getCart();
  cart = cart.filter(item => item.product_key !== productKey);
  saveCart(cart);
}

/**
 * @description يحدث كمية منتج معين في السلة.
 * @function updateCartQuantity
 * @param {string} productKey - المفتاح الفريد للمنتج.
 * @param {number} newQuantity - الكمية الجديدة للمنتج.
 * @returns {void}
 */
function updateCartQuantity(productKey, newQuantity) {
  const cart = getCart();
  const productIndex = cart.findIndex(item => item.product_key === productKey);

  if (productIndex > -1) {
    if (newQuantity > 0) {
      cart[productIndex].quantity = newQuantity;
    } else {
      cart.splice(productIndex, 1);
    }
    saveCart(cart);
  }
}

/**
 * @description يحدث ملاحظة منتج في السلة.
 * @function updateCartItemNote
 * @param {string} productKey - المفتاح الفريد للمنتج.
 * @param {string} note - الملاحظة الجديدة.
 * @returns {void}
 */
function updateCartItemNote(productKey, note) {
  const cart = getCart();
  const productIndex = cart.findIndex(item => item.product_key === productKey);

  if (productIndex > -1) {
    cart[productIndex].note = note;
    saveCart(cart);
  }
}

/**
 * @description يفرغ السلة بالكامل.
 * @function clearCart
 * @returns {void}
 */
function clearCart() {
  saveCart([]);
}

/**
 * @description يحسب العدد الإجمالي للوحدات من جميع المنتجات في السلة.
 * @function getCartItemCount
 * @returns {number} - إجمالي عدد الوحدات.
 */
function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * @description يحسب المجموع الكلي لسعر المنتجات في السلة.
 * @function getCartTotalPrice
 * @returns {number} - المجموع الكلي.
 */
function getCartTotalPrice() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * @description يحسب إجمالي التوفير من الخصومات.
 * @function getCartTotalSavings
 * @returns {number} - إجمالي التوفير.
 */
function getCartTotalSavings() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    if (item.original_price && item.original_price > item.price) {
      return total + ((item.original_price - item.price) * item.quantity);
    }
    return total;
  }, 0);
}

/**
 * @description يبحث عن منتج في السلة.
 * @function findInCart
 * @param {string} productKey - المفتاح الفريد للمنتج.
 * @returns {Object|null} - المنتج إذا وجد، وإلا null.
 */
function findInCart(productKey) {
  const cart = getCart();
  return cart.find(item => item.product_key === productKey) || null;
}

/**
 * @description يحدث شارة عدد عناصر السلة في الواجهة الرسومية.
 * @function updateCartBadge
 * @returns {void}
 */
function updateCartBadge() {
  console.log('updateCartBadge');
  const cartBadge = document.getElementById('xx');
  if (!cartBadge) return;

  const count = getCartItemCount();
  if (count > 0) {
    cartBadge.textContent = count;
    cartBadge.style.display = 'flex';
  } else {
    cartBadge.style.display = 'none';
  }
}

// الاستماع لحدث تحديث السلة لتحديث الشارة تلقائياً
window.addEventListener('cartUpdated', updateCartBadge);

// تحديث الشارة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateCartBadge);