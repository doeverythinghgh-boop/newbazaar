
/**
 * @description دالة لتوليد مفتاح فريد للطلب يتكون من 3 أحرف و 3 أرقام مختلطة.
 * @function generateOrderKey
 * @returns {string} - مفتاح الطلب الفريد الذي تم إنشاؤه.
 */
function generateOrderKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  let key = "";
  for (let i = 0; i < 3; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 3; i++) {
    key += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  // خلط الحروف والأرقام
  return key.split('').sort(() => 0.5 - Math.random()).join('');
}
/**
 * @description ينشئ طلبًا جديدًا في قاعدة البيانات عبر واجهة برمجة التطبيقات (API).
 * @function createOrder
 * @param {object} orderData - كائن يحتوي على جميع بيانات الطلب المراد إنشاؤه.
 * @param {string} orderData.order_key - المفتاح الفريد الذي تم إنشاؤه للطلب.
 * @param {string} orderData.user_key - مفتاح المستخدم الذي قام بالطلب.
 * @param {number} orderData.total_amount - المبلغ الإجمالي للطلب.
 * @param {Array<object>} orderData.items - مصفوفة من المنتجات الموجودة في الطلب.
 * @returns {Promise<Object>} - وعد (Promise) يحتوي على كائن بيانات الطلب الذي تم إنشاؤه، أو كائن خطأ في حالة الفشل.
 * @see apiFetch
 */
async function createOrder(orderData) {
  return await apiFetch('/api/orders', {
    method: 'POST',
    body: orderData,
  });
}
async function sendOrder2Excution() {
  // 1. جلب البيانات

  const cart = getCart();

  // التحقق من الشروط

  if (!userSession || !Number(userSession.is_seller) < 0) {
    Swal.fire({
      title: "مطلوب التسجيل",
      text: "لإتمام عملية الشراء، يجب عليك تسجيل الدخول أو إنشاء حساب جديد.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "تسجيل الدخول",
      cancelButtonText: "إلغاء",
    }).then((result) => {
      if (result.isConfirmed) {
        mainLoader(
          "./pages/login.html",
          "index-user-container",
          0,
          undefined,
          "hiddenLoginIcon",
          true
        );
      }
    });

    return;
  }
  if (cart.length === 0) {
    Swal.fire("السلة فارغة", "لا توجد منتجات في السلة لإتمام الشراء.", "info");
    return;
  }

  // 2. حساب المبلغ الإجمالي وإنشاء مفتاح الطلب
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const orderKey = generateOrderKey();

  const orderData = {
    order_key: orderKey,
    user_key: userSession.user_key,
    total_amount: totalAmount,
    items: cart.map((item) => ({
      product_key: item.product_key,
      quantity: item.quantity,
      product_key: item.product_key,
      quantity: item.quantity,
      seller_key: item.seller_key, // ✅ إضافة: إرسال مفتاح البائع مع كل عنصر
      note: item.note || "", // ✅ إضافة: إرسال الملاحظة مع كل عنصر
    })),
  };
  console.log("[Checkout] جاري إرسال بيانات الطلب:", orderData);

  // إظهار رسالة تأكيد
  const result = await Swal.fire({
    title: "تأكيد الطلب",
    text: `المبلغ الإجمالي هو ${totalAmount.toFixed(
      2
    )} جنيه. هل تريد المتابعة؟`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "نعم، أرسل الطلب!",
    cancelButtonText: "إلغاء",
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      const response = await createOrder(orderData);
      console.log("[Checkout] الاستجابة من الخادم:", response);
      return response;
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  if (result.isConfirmed && result.value && !result.value.error) {
    // ✅ إصلاح: استخلاص مفتاح الطلب من نتيجة SweetAlert
    const createdOrderKey = result.value.order_key;
    console.log(
      `[Checkout] Order created with key: ${createdOrderKey}. Now sending notifications.`
    );

    // 1. جلب توكنات البائعين
    const sellerKeys = getUniqueSellerKeys(orderData);
    const sellerTokens = await getUsersTokens(sellerKeys);

    // 2. جلب توكنات المسؤولين (من الدالة المركزية)
    //const adminTokens = await getAdminTokens();

    // 3. دمج جميع التوكنات وإزالة التكرار
    const allTokens = [
      ...new Set([...(sellerTokens || [])]),
    ];
    try {
      // 4. إرسال الإشعارات باستخدام الدالة العامة
      const title = "طلب شراء جديد";
      const body = `تم استلام طلب شراء جديد رقم #${createdOrderKey}. يرجى المراجعة.`;
      await sendNotificationsToTokens(allTokens, title, body);
    } catch (error) { console.log(error); }
    console.log(
      "[Checkout] نجاح! تم تأكيد الطلب من قبل المستخدم وإنشاءه بنجاح."
    );
    clearCart(); // هذه الدالة تحذف السلة وتطلق حدث 'cartUpdated'

    // ✅ إصلاح: عرض رسالة النجاح، وبعد إغلاقها، يتم إعادة رسم نافذة السلة لتظهر فارغة.
    Swal.fire("تم إتمام طلبك بنجاح 🎉").then(() => {
    });
  } else if (result.value && result.value.error) {
    console.error("[Checkout] فشل! الخادم أعاد خطأ:", result.value.error);
    Swal.fire("حدث خطأ", `فشل إرسال الطلب: ${result.value.error}`, "error");
  }
}
/**
 * @description تستخلص المفاتيح الفريدة للبائعين (`seller_key`) من بنية بيانات الطلب (`orderData`).
 * @function getUniqueSellerKeys
 * @param {object} orderData - هيكل بيانات الطلب الذي يتم إعداده للإرسال إلى API، ويحتوي على مصفوفة `items`.
 * @param {Array<object>} orderData.items - مصفوفة من عناصر المنتج في الطلب، حيث يجب أن يحتوي كل عنصر على `seller_key`.
 * @returns {Array<string>} - قائمة بمفاتيح البائعين الفريدة المستخرجة من عناصر الطلب.
 */
function getUniqueSellerKeys(orderData) {
  if (!orderData || !Array.isArray(orderData.items)) {
    console.error("Invalid order data structure provided.");
    return [];
  }

  // استخدام كائن Set لضمان أن كل مفتاح بائع يظهر مرة واحدة فقط (فريد)
  const sellerKeys = new Set();

  // المرور على كل عنصر في الطلب
  orderData.items.forEach(item => {
    // يتم افتراض أن كل عنصر (item) يحتوي على حقل باسم 'seller_key'
    if (item.seller_key) {
      sellerKeys.add(item.seller_key);
    }
  });

  // تحويل الـ Set إلى مصفوفة وإعادتها
  return Array.from(sellerKeys);
}