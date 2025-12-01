/**
 * @file js/auth.js
 * @description إدارة حالة المصادقة وتسجيل دخول المستخدم.
 *
 * هذا الملف يوفر الدوال اللازمة للتعامل مع حالة تسجيل دخول المستخدم عبر التخزين المحلي (localStorage).
 * - `checkLoginStatus`: تتحقق مما إذا كان المستخدم مسجلاً دخوله عند تحميل الصفحة وتقوم بتحديث واجهة المستخدم.
 * - `logout`: تقوم بتسجيل خروج المستخدم عبر حذف بياناته من التخزين المحلي وتحديث الصفحة.
 */

/**
 * @description تهيئة Firebase Cloud Messaging (FCM) للمستخدم الحالي.
 *   تتضمن هذه العملية تسجيل Service Worker، طلب إذن الإشعارات،
 *   الحصول على توكن FCM، وإرساله إلى الخادم. تتعامل أيضًا مع تهيئة
 *   FCM للأجهزة التي تعمل بنظام Android.
 * @function setupFCM
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 * @see sendTokenToServer
 * @see handleRevokedPermissions
 */
async function setupFCM() {
  // ✅ تحسين: إضافة علم لمنع إعادة التهيئة في كل مرة يتم فيها تحميل الصفحة.
  // هذا يضمن أن عملية الإعداد تتم مرة واحدة فقط لكل جلسة.
  if (window.fcmInitialized) {
    console.log("[FCM Setup] تم تهيئة FCM بالفعل في هذه الجلسة. سيتم التخطي.");
    return;
  }

  

  /**
   * @description دالة مساعدة لإرسال توكن FCM إلى الخادم.
   * @function sendTokenToServer
   * @param {string} userKey - المفتاح التعريفي للمستخدم.
   * @param {string} token - توكن FCM الذي سيتم إرساله.
   * @param {string} platform - منصة الجهاز (مثل "android" أو "web").
   * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال، ولكنه يعالج الاستجابة من الخادم.
   * @throws {Error} - في حالة فشل الاتصال بالشبكة أو وجود مشكلة في استجابة الخادم.
   */
  async function sendTokenToServer(userKey, token, platform) {
    console.log(`%c[FCM] Sending token to server...`, "color: #fd7e14");
    console.log(`[FCM] User Key: ${userKey}`);
    console.log(`[FCM] FCM Token: ${token}`);
    console.log(`[FCM] Platform: ${platform}`);

    try {
      const response = await fetch(`${baseURL}/api/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_key: userKey,
          token: token,
          platform: platform,
        }),
      });

      const responseData = await response.json();
      if (response.ok) {
        console.log(
          "%c[FCM] Server successfully saved/updated the token.",
          "color: #28a745",
          responseData
        );
      } else {
        console.error(
          "[FCM] Server failed to save token. Status:",
          response.status,
          "Response:",
          responseData
        );
      }
    } catch (networkError) {
      console.error(
        "%c[FCM] Network error while sending token:",
        "color: #dc3545",
        networkError
      );
    }
  }

  
  // ✅ خطوة حاسمة: التحقق إذا كان الكود يعمل داخل تطبيق الأندرويد

  // الخطوة الحاسمة: إعلام كود الأندرويد الأصلي (فقط إذا كان مطلوبًا)
  if (window.Android && typeof window.Android.onUserLoggedIn === "function") {
    // احصل على التوكن المحلي من الأندرويد إذا كان موجودًا
    const existingAndroidToken = localStorage.getItem("android_fcm_key");

    // تحقق مما إذا كان التوكن فارغًا أو غير موجود
    if (!existingAndroidToken) {
      console.log(
        "[Auth] بيئة أندرويد مكتشفة والتوكن المحلي فارغ. جاري طلب توكن جديد..."
      );
      // استدعِ دالة الأندرويد فقط إذا لم يكن هناك توكن بالفعل
      window.Android.onUserLoggedIn(
        JSON.stringify({ user_key: userSession.user_key })
      );
      await waitForFcmKey(async (fcmToken) => {
        console.log("تم العثور على مفتاح للاندرويد محفوظ محليا :", fcmToken);
        // استدعاء الدالة المساعدة الجديدة
        await sendTokenToServer(userSession.user_key, fcmToken, "android");
      });
    } else {
      console.log(
        "[Auth] بيئة أندرويد مكتشفة، والتوكن المحلي موجود بالفعل. لا حاجة لطلب جديد."
      );
      // يمكنك هنا إضافة أي منطق آخر إذا أردت، مثل التحقق من صحة التوكن
    }
    return;
  }

  console.log(
    "%c[FCM Setup] بدأت عملية إعداد الإشعارات...",
    "color: purple; font-weight: bold;"
  );
  // التأكد من أن المتصفح يدعم Service Workers
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] هذا المتصفح لا يدعم ميزة الإشعارات (Service Workers).");
    return;
  }

  console.log("[FCM Setup] جاري التحقق من وجود مستخدم مسجل...");

  if (!userSession || !userSession.user_key) {
    console.warn(
      "[FCM Setup] لا يوجد مستخدم مسجل أو لا يحتوي على user_key. تتوقف العملية."
    );
    return;
  }
  console.log("[FCM Setup] تم العثور على مستخدم مسجل:", userSession.username);
  //
  try {
    console.log("[FCM Setup] جاري تسجيل عامل الخدمة (Service Worker)...");
    await navigator.serviceWorker.register("../js/firebase-messaging-sw.js");
    console.log(
      "%c[FCM] تم تسجيل عامل الخدمة (Service Worker) بنجاح.",
      "color: #28a745"
    );

    // استيراد دوال Firebase بشكل ديناميكي
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js"
    );
    const { getMessaging, getToken, onMessage } = await import(
      "https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging.js"
    );

    console.log("[FCM Setup] جاري تهيئة تطبيق Firebase...");
    const firebaseConfig = {
      apiKey: "AIzaSyClapclT8_4UlPvM026gmZbYCiXaiBDUYk",
      authDomain: "suze-bazaar-notifications.firebaseapp.com",
      projectId: "suze-bazaar-notifications",
      storageBucket: "suze-bazaar-notifications.firebasestorage.app",
      messagingSenderId: "983537000435",
      appId: "1:983537000435:web:92c2729c9aaf872764bc86",
      measurementId: "G-P8FMC3KR7M",
    };

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    console.log("[FCM Setup] تم تهيئة Firebase بنجاح.");

    onMessage(messaging, (payload) => {
      console.log(
        "%c[FCM] تم استقبال إشعار أثناء فتح الموقع (Foreground):",
        "color: #17a2b8",
        payload
      );
      const { title, body } = payload.data;
      Swal.fire({
        title: title, // عنوان الرسالة
        text: body, // نص الرسالة
        icon: "info", // أيقونة معلومات
        confirmButtonText: "موافق", // زر واحد للإغلاق
      });

      // ✅ إعادة إضافة: تسجيل الإشعار المستقبل في IndexedDB لمستخدمي المتصفح
      if (typeof addNotificationLog === 'function') {
        addNotificationLog({
          messageId: payload.messageId, // ✅ جديد: تمرير المعرف الفريد للإشعار
          type: 'received',
          title: title,
          body: body,
          timestamp: new Date(),
          status: 'unread',
          relatedUser: { key: 'admin', name: 'الإدارة' },
          payload: payload.data,
        });
      }
    });

    console.log("[FCM Setup] جاري طلب إذن عرض الإشعارات من المستخدم...");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log(
        "%c[FCM] تم الحصول على إذن إرسال الإشعارات.",
        "color: #28a745"
      );

      let fcmToken = localStorage.getItem("fcm_token");

      if (!fcmToken) {
        console.log(
          "[FCM Setup] لا يوجد توكن مخزن، جاري طلب توكن جديد من Firebase..."
        );
        try {
          const newFcmToken = await getToken(messaging, {
            vapidKey:
              "BK1_lxS32198GdKm0Gf89yk1eEGcKvKLu9bn1sg9DhO8_eUUhRCAW5tjynKGRq4igNhvdSaR0-eL74V3ACl3AIY", // يُفضل نقل هذا إلى ملف config.js
          });
          if (newFcmToken) {
            console.log(
              "%c[FCM Setup] تم الحصول على توكن جديد:",
              "color: #007bff",
              newFcmToken
            );
            console.log(
              "%c[FCM Setup] جاري حفظ التوكن الجديد في localStorage...",
              "color: orange;"
            );
            localStorage.setItem("fcm_token", newFcmToken);
            fcmToken = newFcmToken;

            // ✅ تحسين: إرسال التوكن إلى الخادم فقط عند الحصول على توكن جديد.
            console.log("[FCM] جاري إرسال التوكن الجديد إلى الخادم...");
            await sendTokenToServer(userSession.user_key, fcmToken, "web");

          } else {
            console.error("[FCM] فشل في الحصول على توكن جديد من Firebase.");
          }
        } catch (err) {
          console.error("[FCM] خطأ عند طلب التوكن من Firebase:", err);
        }
      } else {
        console.log("[FCM] تم العثور على توكن مخزن محليًا. لا حاجة لإرساله مرة أخرى.");
      }
    } else {
      console.warn("[FCM Setup] تم رفض إذن إرسال الإشعارات من قبل المستخدم.");
    }
  } catch (error) {
    console.error(
      "%c[FCM] حدث خطأ فادح أثناء إعداد الإشعارات:",
      "color: #dc3545",
      error
    );
  } finally {
    // ✅ تحسين: تعيين العلم إلى true بعد اكتمال المحاولة (سواء نجحت أم فشلت)
    // لمنع المحاولات المتكررة في نفس الجلسة.
    window.fcmInitialized = true;
  }
}

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
   await setupFCM();
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
  const fcmToken = localStorage.getItem("fcm_token") || localStorage.getItem("android_fcm_key");

  // 1. إعلام واجهة Android (إن وجدت)
  if (window.Android && typeof window.Android.onUserLoggedOut === "function") {
    console.log("[Auth] إعلام الواجهة الأصلية بتسجيل خروج المستخدم...");
    window.Android.onUserLoggedOut(JSON.stringify({ user_key: userSession?.user_key }));
  }

  // 2. محاولة حذف التوكن من الخادم (إذا كان المستخدم والتوكن موجودين)
  if (fcmToken && userSession?.user_key) {
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
  }

  // 3. مسح جميع بيانات المتصفح
  console.log("[Auth] جاري مسح جميع بيانات المتصفح...");
  await clearAllBrowserData();
  console.log("[Auth] تم مسح بيانات المتصفح بنجاح.");
userSession=null;
  setUserNameInIndexBar(); 
  // 4. إعادة التوجيه إلى صفحة تسجيل الدخول
  mainLoader(
    "pages/login.html",
    "index-user-container",
    0,
    undefined,
    "showHomeIcon",true
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
