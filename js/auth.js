/**
 * @file js/auth.js
 * @description إدارة حالة المصادقة وتسجيل دخول المستخدم.
 *
 * هذا الملف يوفر الدوال اللازمة للتعامل مع حالة تسجيل دخول المستخدم عبر التخزين المحلي (localStorage).
 * - `checkLoginStatus`: تتحقق مما إذا كان المستخدم مسجلاً دخوله عند تحميل الصفحة وتقوم بتحديث واجهة المستخدم.
 * - `logout`: تقوم بتسجيل خروج المستخدم عبر حذف بياناته من التخزين المحلي وتحديث الصفحة.
 */



/**
 * @description تنتظر حتى يتم حفظ `android_fcm_key` في `localStorage` ثم تستدعي دالة رد الاتصال (callback).
 * @function waitForFcmKey
 * @param {function(string): void} callback - الدالة التي سيتم استدعاؤها مع مفتاح FCM بمجرد توفره.
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 */
async function waitForFcmKey(callback) {
  const checkInterval = setInterval(() => {
    const key = localStorage.getItem("android_fcm_key");

    // تأكد أن القيمة موجودة وليست فارغة وليست null
    if (key && key.trim() !== "") {
      clearInterval(checkInterval);
      callback(key);
    }
  }, 300); // يتم الفحص كل 300 مللي ثانية
}
/**
 * @description يعالج سيناريو قيام المستخدم بإلغاء أذونات الإشعارات من إعدادات المتصفح.
 *   إذا تم العثور على توكن مخزن محليًا بينما الإذن مرفوض، فإنه يحاول حذفه من الخادم.
 * @function handleRevokedPermissions
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.

 */
async function handleRevokedPermissions() {
  // هذا المنطق خاص بالويب فقط، لا ينطبق داخل تطبيق الأندرويد.
  if (window.Android || !("Notification" in window)) {
    return;
  }

  const currentPermission = Notification.permission;
  const fcmToken = localStorage.getItem("fcm_token");

  // إذا كان الإذن 'denied' أو 'default' وما زال لدينا توكن،
  // فهذا يعني أن المستخدم قد ألغى الإذن بعد منحه سابقًا.
  if (
    (currentPermission === "denied" || currentPermission === "default") &&
    fcmToken
  ) {
    console.warn(
      "[FCM] تم اكتشاف أن إذن الإشعارات لم يعد ممنوحًا. سيتم حذف التوكن..."
    );


    if (userSession?.user_key) {
      try {
        await fetch(`${baseURL}/api/tokens`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_key: userSession.user_key,
            token: fcmToken,
          }),
        });
        console.log(
          "[FCM] تم إرسال طلب حذف التوكن من الخادم بسبب تغيير حالة الإذن."
        );
      } catch (error) {
        console.error(
          "[FCM] فشل إرسال طلب حذف التوكن بعد تغيير حالة الإذن:",
          error
        );
        // ملاحظة: من الجيد هنا تسجيل هذا الخطأ في خدمة مراقبة خارجية.
      } finally {
        // سواء نجح الحذف من الخادم أم لا، يجب إزالة التوكن المحلي.
        localStorage.removeItem("fcm_token");
        console.log("[FCM] تم حذف التوكن من التخزين المحلي.");
      }
    } else {
      // إذا لم نجد مستخدمًا مسجلاً، فقط احذف التوكن المحلي.
      localStorage.removeItem("fcm_token");
    }
  }
}





/**
 * @description دالة جديدة ومستقلة لتهيئة الإشعارات.
 *   يتم استدعاؤها من الصفحات التي تحتاج إلى استقبال الإشعارات.
 *   تتحقق من أهلية المستخدم للإشعارات وتقوم بتهيئة FCM إذا كان مؤهلاً.
 * @function initializeNotifications
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 * @see handleRevokedPermissions
 * @see setupFCM
 */
async function initializeNotifications() {

  if (!userSession) return;



  handleRevokedPermissions();

  // الوصول إلى الخاصية من الكائن العام
  if (Number(userSession.is_seller) >= 1) {
    console.log("[Auth] مستخدم مؤهل، جاري إعداد FCM...");
    //await setupFCM();
  } else {
    console.log("[Auth] المستخدم (عميل عادي) غير مؤهل لاستقبال الإشعارات. تم تخطي إعداد FCM.");
  }
}

/**
 * @description يقوم بتسجيل خروج المستخدم عن طريق إزالة بياناته من التخزين المحلي وإعادة التوجيه إلى صفحة `index.html`.
 *   يتضمن ذلك حذف توكنات FCM من الخادم و`localStorage`.
 * @function logout
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال، يعالج عمليات تسجيل الخروج غير المتزامنة.
 * @see clearAndNavigateToLogin
 */
async function logout() {

  Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم تسجيل خروجك.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "نعم، تسجيل الخروج",
    cancelButtonText: "إلغاء",
    showLoaderOnConfirm: true,
    // ✅ إصلاح: استخدام preConfirm لعرض أيقونة التحميل أثناء تنفيذ عملية تسجيل الخروج.
    // هذا هو الاستخدام الصحيح لـ showLoaderOnConfirm.
    preConfirm: async () => {
      await clearAndNavigateToLogin();
    },
    // منع إغلاق النافذة أثناء التحميل
    allowOutsideClick: () => !Swal.isLoading(),
  });
  // لم نعد بحاجة إلى .then() لأن clearAndNavigateToLogin يعالج إعادة التوجيه.

}

/**
 * @description تقوم بمسح محتوى جميع الحاويات الرئيسية في الصفحة.
 *   تُستخدم هذه الدالة لإعادة تهيئة الواجهة عند تسجيل الخروج أو الانتقال بين الأقسام الرئيسية.
 * @function clearMainContainers
 * @returns {void}
 */
function clearMainContainers() {
  const containerIds = [
    "index-home-container",
    "index-search-container",
    "index-user-container",
    "index-product-container",
    "index-cardPackage-container",
    "index-myProducts-container",
  ];

  console.log("[UI] جاري مسح الحاويات الرئيسية...");

  containerIds.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = "";
    }
  });

  console.log("[UI] تم مسح الحاويات الرئيسية بنجاح.");
}

/**
 * @description دالة مساعدة جديدة تعالج عملية تسجيل الخروج الكاملة:
 * 1. إعلام واجهة Android (إذا كانت موجودة).
 * 2. محاولة حذف توكن FCM من الخادم.
 * 3. مسح جميع بيانات المتصفح (localStorage, etc.).
 * 4. إعادة توجيه المستخدم إلى صفحة تسجيل الدخول.
 * @async
 * @function clearAndNavigateToLogin
 * @returns {Promise<void>}
 */
async function clearAndNavigateToLogin() {
  //const fcmToken = localStorage.getItem("fcm_token") || localStorage.getItem("android_fcm_key");

  // 1. إعلام واجهة Android (إن وجدت)
  /*if (window.Android && typeof window.Android.onUserLoggedOut === "function") {
    console.log("[Auth] إعلام الواجهة الأصلية بتسجيل خروج المستخدم...");
    window.Android.onUserLoggedOut(JSON.stringify({ user_key: userSession?.user_key }));
  }*/

  // 2. محاولة حذف التوكن من الخادم (إذا كان المستخدم والتوكن موجودين)
  /*if (fcmToken && userSession?.user_key) {
    try {
      await fetch(`${baseURL}/api/tokens`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_key: userSession.user_key,
          token: fcmToken,
        }),
      });
      console.log("[FCM] تم إرسال طلب حذف التوكن من الخادم بنجاح.");
    } catch (error) {
      console.error(
        "[FCM] فشل إرسال طلب حذف التوكن من الخادم. الخطأ:",
        error
      );
      // ملاحظة: حتى لو فشل الحذف من الخادم، ستستمر عملية تسجيل الخروج من جانب العميل.
    }
  }*/

  // 4. إعادة التوجيه إلى صفحة تسجيل الدخول
  mainLoader(
    "pages/login.html",
    "index-user-container",
    0,
    undefined,
    "showHomeIcon", true
  );
}

/**
 * @description دالة مخصصة ليتم استدعاؤها من كود الأندرويد الأصلي.
 *   تقوم هذه الدالة باستلام بيانات إشعار كـ JSON string وحفظه في IndexedDB.
 * @function saveNotificationFromAndroid
 * @param {string} notificationJson - سلسلة JSON تحتوي على بيانات الإشعار (title, body).
 * @returns {void}
 * @see addNotificationLog
 */
function saveNotificationFromAndroid(notificationJson) {
  console.log("[Auth] تم استدعاء saveNotificationFromAndroid من الأندرويد:", notificationJson);
  try {
    const notificationData = JSON.parse(notificationJson);
    const { title, body } = notificationData;

    if (typeof addNotificationLog === 'function') {
      addNotificationLog({
        messageId: notificationData.messageId || `android_${Date.now()}`, // ✅ جديد: استخدام المعرف الفريد أو إنشاء واحد
        type: 'received',
        title: title,
        body: body,
        timestamp: new Date(),
        status: 'unread',
        relatedUser: { key: 'admin', name: 'الإدارة' }, // يمكن تحسينه لتمرير المرسل الفعلي
        payload: notificationData,
      });
      console.log("[Auth] تم حفظ الإشعار من الأندرويد بنجاح في IndexedDB.");
    } else {
      console.error("[Auth] الدالة addNotificationLog غير موجودة. تأكد من تحميل ملف notification-db-manager.js.");
    }
  } catch (error) {
    console.error("[Auth] خطأ في معالجة الإشعار القادم من الأندرويد:", error);
  }
}
