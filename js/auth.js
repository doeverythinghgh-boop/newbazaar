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
  // [خطوة 1] بدء عملية فحص دورية باستخدام setInterval للبحث عن المفتاح.
  const checkInterval = setInterval(() => {
    // [خطوة 2] في كل دورة، محاولة قراءة "android_fcm_key" من التخزين المحلي.
    const key = localStorage.getItem("android_fcm_key");

    // [خطوة 3] التحقق من أن المفتاح موجود وقيمته ليست فارغة.
    if (key && key.trim() !== "") {
      // [خطوة 4] إذا تم العثور على المفتاح، يتم إيقاف الفحص الدوري.
      clearInterval(checkInterval);
      // [خطوة 5] استدعاء دالة الـ callback وتمرير المفتاح الذي تم العثور عليه.
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
  // [خطوة 1] التحقق مما إذا كان الكود يعمل داخل WebView أندرويد أو إذا كانت الإشعارات غير مدعومة بالمتصفح. في هذه الحالات، لا يتم عمل أي شيء.
  if (window.Android || !("Notification" in window)) {
    return;
  }

  // [خطوة 2] الحصول على حالة إذن الإشعارات الحالية من المتصفح.
  const currentPermission = Notification.permission;
  // [خطوة 3] الحصول على توكن FCM المخزن محليًا (إن وجد).
  const fcmToken = localStorage.getItem("fcm_token");

  // [خطوة 4] التحقق مما إذا كان الإذن قد تم رفضه أو لم يتم تحديده، وفي نفس الوقت لا يزال هناك توكن مخزن.
  // هذا يعني أن المستخدم ألغى الإذن يدويًا من إعدادات المتصفح.
  if (
    (currentPermission === "denied" || currentPermission === "default") &&
    fcmToken
  ) {
    console.warn(
      "[FCM] تم اكتشاف إلغاء إذن الإشعارات. سيتم حذف التوكن..."
    );

    // [خطوة 5] التحقق من وجود جلسة مستخدم نشطة لإرسال طلب الحذف للخادم.
    if (userSession?.user_key) {
      try {
        // [خطوة 6] إرسال طلب HTTP "DELETE" إلى الخادم لحذف التوكن من قاعدة البيانات.
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
        // [خطوة 7] سواء نجح الحذف من الخادم أم لا، يجب دائمًا إزالة التوكن من التخزين المحلي لضمان نظافة الحالة.
        localStorage.removeItem("fcm_token");
        console.log("[FCM] تم حذف التوكن من التخزين المحلي.");
      }
    } else {
      // [خطوة 8] إذا لم يكن هناك مستخدم مسجل، يتم فقط حذف التوكن المحلي.
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
  // [خطوة 1] التأكد من وجود جلسة مستخدم مسجلة. إذا لم يكن هناك مستخدم، تتوقف الدالة.
//  if (!userSession) return;

  // [خطوة 2] استدعاء دالة للتحقق مما إذا كان المستخدم قد ألغى أذونات الإشعارات يدويًا.
  //handleRevokedPermissions();

  // [خطوة 3] التحقق مما إذا كان المستخدم مؤهلاً لاستقبال الإشعارات (بائع أو له دور أعلى).
  if (Number(userSession.is_seller) >= 1) {
    console.log("[Auth] مستخدم مؤهل، جاري إعداد FCM...");
    // [خطوة 4] (معطل حاليًا) استدعاء دالة إعداد FCM لبدء الاستماع للإشعارات.
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
  // [خطوة 1] إظهار نافذة تأكيد منبثقة للمستخدم قبل تسجيل الخروج باستخدام SweetAlert.
  Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم تسجيل خروجك.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "نعم، تسجيل الخروج",
    cancelButtonText: "إلغاء",
    showLoaderOnConfirm: true, // إظهار أيقونة تحميل عند الضغط على "نعم".
    // [خطوة 2] استخدام `preConfirm` لتنفيذ عملية تسجيل الخروج غير المتزامنة.
    // سيضمن هذا أن النافذة المنبثقة ستظل مفتوحة وتعرض مؤشر التحميل حتى تكتمل العملية.
    preConfirm: async () => {
      await clearAndNavigateToLogin();
    },
    // [خطوة 3] منع إغلاق النافذة عند النقر خارجها أثناء عملية التحميل.
    allowOutsideClick: () => !Swal.isLoading(),
  });

}

/**
 * @description تقوم بمسح محتوى جميع الحاويات الرئيسية في الصفحة.
 *   تُستخدم هذه الدالة لإعادة تهيئة الواجهة عند تسجيل الخروج أو الانتقال بين الأقسام الرئيسية.
 * @function clearMainContainers
 * @returns {void}
 */
function clearMainContainers() {
  // [خطوة 1] تعريف مصفوفة تحتوي على معرفات جميع الحاويات التي يجب مسحها.
  const containerIds = [
    "index-home-container",
    "index-search-container",
    "index-user-container",
    "index-product-container",
    "index-cardPackage-container",
    "index-myProducts-container",
  ];

  console.log("[UI] جاري مسح الحاويات الرئيسية...");

  // [خطوة 2] المرور على كل معرف في المصفوفة.
  containerIds.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      // [خطوة 3] إذا تم العثور على الحاوية، يتم تفريغ محتواها بالكامل.
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
  // 3. مسح جميع بيانات المتصفح
  console.log("[Auth] جاري مسح جميع بيانات المتصفح...");
  await clearAllBrowserData();
  clearMainContainers();
  console.log("[Auth] تم مسح بيانات المتصفح بنجاح.");
userSession=null;
//
  setUserNameInIndexBar(); 
checkImpersonationMode();
  // [خطوة 1] استدعاء `mainLoader` لتحميل محتوى صفحة تسجيل الدخول في حاوية المستخدم الرئيسية.
  console.log("[Auth] دخلنا دالة clearAndNavigateToLogin 00000000000. جاري تحميل صفحة تسجيل الدخول...");
await mainLoader(
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
  // [خطوة 1] تسجيل البيانات القادمة من الأندرويد لأغراض التصحيح.
  console.log("[Auth] تم استدعاء saveNotificationFromAndroid من الأندرويد:", notificationJson);
  try {
    // [خطوة 2] محاولة تحليل سلسلة JSON إلى كائن JavaScript.
    const notificationData = JSON.parse(notificationJson);
    const { title, body } = notificationData;

    if (typeof addNotificationLog === 'function') {
      // [خطوة 3] إذا كانت دالة `addNotificationLog` متاحة، يتم استدعاؤها لحفظ الإشعار في IndexedDB.
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
      // [خطوة 4] إذا لم تكن الدالة موجودة، يتم تسجيل خطأ.
      console.error("[Auth] الدالة addNotificationLog غير موجودة. تأكد من تحميل ملف notification-db-manager.js.");
    }
  } catch (error) {
    // [خطوة 5] في حالة حدوث أي خطأ أثناء التحليل أو الحفظ، يتم تسجيله.
    console.error("[Auth] خطأ في معالجة الإشعار القادم من الأندرويد:", error);
  }
}
