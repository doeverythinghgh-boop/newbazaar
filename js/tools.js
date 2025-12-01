/**
 * @file js/helpers/format.js
 * @description يوفر دوال مساعدة لتنسيق النصوص والأرقام، مثل تحويل الأرقام الهندية إلى إنجليزية وتوحيد النص العربي.
 */

/**
 * @description يحول الأرقام الهندية (٠-٩) إلى أرقام إنجليزية (0-9) في سلسلة نصية.
 *   هذه الدالة مفيدة لمعالجة مدخلات المستخدم التي قد تحتوي على أرقام بأي من الصيغتين.
 * @function normalizeDigits
 * @param {string} str - السلسلة النصية التي قد تحتوي على أرقام.
 * @returns {string} - السلسلة النصية بعد تحويل الأرقام إلى الصيغة الإنجليزية.
 */
function normalizeDigits(str) {
  if (!str) return "";
  const easternArabicNumerals = /[\u0660-\u0669]/g; // نطاق الأرقام العربية الشرقية (الهندية)
  return str.replace(easternArabicNumerals, (d) => d.charCodeAt(0) - 0x0660);
}

/**
 * @description يقوم بتنقيح وتوحيد النص العربي عن طريق إزالة علامات التشكيل وتوحيد أشكال الحروف (الهمزات والتاء المربوطة).
 *   مفيد جدًا لعمليات البحث والمقارنة لضمان تطابق النصوص بغض النظر عن التشكيل.
 * @function normalizeArabicText
 * @param {string} text - النص العربي المراد تنقيحه.
 * @returns {string} - النص بعد إزالة التشكيل وتوحيد الحروف.
 */
function normalizeArabicText(text) {
  if (!text) return "";

  // إزالة التشكيل
  text = text.replace(/[\u064B-\u0652]/g, "");

  // توحيد الهمزات (أ، إ، آ) إلى ا
  text = text.replace(/[آأإ]/g, "ا");

  // تحويل التاء المربوطة (ة) إلى ه
  text = text.replace(/ة/g, "ه");

  // توحيد حرف الياء (ي / ى) إلى ي
  text = text.replace(/[ى]/g, "ي");

  // إزالة المد (ـــ)
  text = text.replace(/ـ+/g, "");

  // إزالة المسافات المكررة
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * @description يدمج معرف الحالة (status ID) مع التاريخ والوقت الحاليين في سلسلة نصية واحدة.
 *   التنسيق الناتج: "ID#TIMESTAMP" (مثال: "1#2023-10-27T10:00:00.000Z").
 *   هذه الدالة تُستخدم قبل إرسال تحديثات الحالة إلى الخادم.
 * @function composeOrderStatus
 * @param {number} statusId - المعرف الرقمي للحالة الجديدة.
 * @returns {string} - السلسلة النصية المدمجة.
 */
function composeOrderStatus(statusId) {
  const timestamp = new Date().toISOString();
  return `${statusId}#${timestamp}`;
}

/**
 * @description يفكك السلسلة النصية لحالة الطلب (القادمة من قاعدة البيانات) إلى كائن منظم.
 *   يتعامل مع الحالات التي تكون فيها القيمة غير صالحة أو قديمة (لا تحتوي على #).
 * @function parseOrderStatus
 * @param {string | null | undefined} statusValue - القيمة المخزنة في عمود `order_status`.
 * @returns {{statusId: number, timestamp: string | null}} - كائن يحتوي على معرف الحالة والتاريخ.
 */
function parseOrderStatus(statusValue) {
  if (!statusValue || typeof statusValue !== "string") {
    return { statusId: -1, timestamp: null }; // حالة غير معروفة أو قيمة فارغة
  }

  if (statusValue.includes("#")) {
    const [idStr, timestamp] = statusValue.split("#");
    return { statusId: parseInt(idStr, 10), timestamp: timestamp };
  }

  // للتعامل مع البيانات القديمة التي قد تكون مجرد رقم أو نص
  return { statusId: -1, timestamp: null }; // افترض أنها حالة غير معروفة إذا لم تكن بالتنسيق الجديد
}

/**
 * @description يعالج كائن طلب فردي لإضافة تفاصيل الحالة المنسقة إليه.
 *   هذه دالة مساعدة مركزية تُستخدم في طبقة الاتصال (connect1.js) لضمان
 *   أن جميع الطلبات القادمة من API تحتوي على `status_details` و `status_timestamp`.
 * @function processOrderStatus
 * @param {object} order - كائن الطلب الأصلي الذي يحتوي على `order_status`.
 * @returns {object} - كائن الطلب بعد إضافة الحقول المنسقة.
 * @see parseOrderStatus
 * @see ORDER_STATUSES
 */
function processOrderStatus(order) {
  const { statusId, timestamp } = parseOrderStatus(order.order_status);
  const statusInfo = ORDER_STATUSES.find((s) => s.id === statusId) || {
    state: "غير معروف",
    description: "حالة الطلب غير معروفة.",
  };
  return {
    ...order,
    status_details: statusInfo,
    status_timestamp: timestamp,
  };
}

/**
 * @function showError
 * @description تعرض رسالة خطأ تحت حقل الإدخال المحدد وتضيف فئة خطأ إليه.
 * @param {HTMLInputElement} input - عنصر الإدخال الذي حدث فيه الخطأ.
 * @param {string} message - رسالة الخطأ المراد عرضها.
 */
const showError = (input, message) => {
  // العثور على العنصر المخصص لعرض رسالة الخطأ.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // إضافة فئة CSS لتغيير نمط حقل الإدخال (مثل تغيير لون الحدود إلى الأحمر).
  input.classList.add("input-error");
  // تعيين نص رسالة الخطأ.
  errorDiv.textContent = message;
};

/**
 * @function clearError
 * @description تزيل رسالة الخطأ من تحت حقل الإدخال المحدد وتزيل فئة الخطأ منه.
 * @param {HTMLInputElement} input - عنصر الإدخال لتنظيف الخطأ منه.
 * @returns {void}
 */
const clearError = (input) => {
  // العثور على عنصر رسالة الخطأ.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // إزالة فئة الخطأ من حقل الإدخال.
  input.classList.remove("input-error");
  // تفريغ نص رسالة الخطأ.
  errorDiv.textContent = "";
};
function setUserNameInIndexBar(){
    let loginTextElement = document.getElementById("index-login-text");

      if (userSession && userSession.username) {
        if (loginTextElement) {
          let displayName = userSession.username;
          if (displayName.length > 8) {
            displayName = displayName.substring(0, 8) + "...";
          }
          loginTextElement.textContent = displayName;
        }
      }else{
          loginTextElement.textContent = "تسجيل الدخول";

      }
}
async function clearAllBrowserData() {
  // -----------------------------
  // 1) مسح localStorage
  // -----------------------------
  try {
    localStorage.clear();
  } catch (e) {
    console.warn("localStorage clear failed:", e);
  }



  // -----------------------------
  // 5) مسح IndexedDB
  // -----------------------------
  try {
    if ("indexedDB" in window) {
      const dbs = (await indexedDB.databases?.()) || [];

      for (const db of dbs) {
        if (db && db.name) {
          try {
            indexedDB.deleteDatabase(db.name);
          } catch (dbErr) {
            console.warn(`Delete IndexedDB "${db.name}" failed:`, dbErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn("IndexedDB wipe failed:", e);
  }

  return true;
}

const pageSnapshots = {};

async function insertUniqueSnapshot(pageUrl, containerId) {
  try {
    // حفظ النسخة إذا لم تكن موجودة
    if (!pageSnapshots[pageUrl]) {
      const response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل: " + pageUrl);
      pageSnapshots[pageUrl] = await response.text();
    }

    // إزالة النسخ السابقة من DOM
    document
      .querySelectorAll(`[data-page-url="${pageUrl}"]`)
      .forEach((el) => el.remove());

    // إدراج النسخة
    const container = document.getElementById(containerId);
    if (!container) throw new Error("لا يوجد عنصر: " + containerId);

    container.replaceChildren();
    container.innerHTML = pageSnapshots[pageUrl];
    container.setAttribute("data-page-url", pageUrl);

    // تشغيل جميع السكربتات
    const scripts = container.querySelectorAll("script");

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");

      // نسخ attributes
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }

      // لو السكربت داخلي
      if (!oldScript.src) {
        let code = oldScript.textContent.trim();

        // تغليف تلقائي داخل IIFE لمنع إعادة تعريف المتغيرات
        code = `(function(){\n${code}\n})();`;

        newScript.textContent = code;
      } else {
        // سكربت خارجي → نضيف وسوم تمنع التكرار
        const uniqueSrc = oldScript.src + "?v=" + Date.now();
        newScript.src = uniqueSrc;

        if (oldScript.type) newScript.type = oldScript.type;
      }

      oldScript.replaceWith(newScript);
    });

  } catch (err) {
    console.error("خطأ:", err);
  }
}

/**
 * دالة تقوم بتحميل جزء HTML من ملف خارجي ودمجه داخل صفحة أخرى،
 * مع إعادة تشغيل السكربتات بداخله بشكل كامل،
 * وتنتظر فترة زمنية بعد اكتمال كل شيء.
 *
 * @param {string} pageUrl - رابط الملف الخارجي المراد تحميله
 * @param {string} containerId - معرف العنصر الذي سيحتوي على المحتوى
 * @param {number} waitMs - فترة الانتظار بعد اكتمال تحميل وتشغيل كل شيء
 */
async function loader(pageUrl, containerId, waitMs = 300) {
  try {
    // ================================
    // 1) جلب الملف عبر fetch
    // ================================
    let response, html;
    try {
      response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل الملف: " + pageUrl);
      html = await response.text();
    } catch (fetchError) {
      console.error("خطأ أثناء جلب الملف:", fetchError);
      return;
    }

    // ================================
    // 2) إدراج المحتوى داخل العنصر الهدف
    // ================================
    let container;
    try {
      container = document.getElementById(containerId);
      if (!container)
        throw new Error("لم يتم العثور على العنصر: " + containerId);

      // تفريغ المحتوى لضمان عدم بقاء سكربتات قديمة
      container.replaceChildren();

      container.innerHTML = html;
    } catch (domError) {
      console.error("خطأ في إدراج المحتوى داخل DOM:", domError);
      return;
    }

    // ================================
    // 3) استخراج جميع السكربتات وتشغيلها من جديد
    // ================================
    try {
      const scripts = [...container.querySelectorAll("script")];

      for (const oldScript of scripts) {
        const newScript = document.createElement("script");

        // نقل النوع (مهم للـ ES Modules)
        if (oldScript.type) newScript.type = oldScript.type;

        // لو السكربت خارجي
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = oldScript.async || false; // الحفاظ على async
        }

        // لو السكربت داخلي
        if (oldScript.innerHTML.trim() !== "") {
          newScript.textContent = oldScript.innerHTML;
        }

        // نقل خصائص السكربت (dataset, attributes)
        for (const attr of oldScript.attributes) {
          if (attr.name !== "src" && attr.name !== "type")
            newScript.setAttribute(attr.name, attr.value);
        }

        oldScript.replaceWith(newScript);
      }
    } catch (scriptError) {
      console.error("خطأ أثناء تشغيل السكربتات:", scriptError);
      return;
    }

    // ================================
    // 4) الانتظار بعد اكتمال كل شيء
    // ================================
    try {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } catch (delayError) {
      console.warn("خطأ أثناء الانتظار:", delayError);
    }

  } catch (globalError) {
    console.error("خطأ غير متوقع في الدالة loader:", globalError);
  }
}



/////////////////////////////////





/**
 * =======================================================================
 * وحدة تحميل المحتوى الديناميكي (Dynamic Content Loader - BidStory)
 *
 * تم تحديث profileRestartScripts لتغليف الأكواد المضمنة بـ IIFE
 * للتعامل مع أخطاء "Identifier has already been declared" الناتجة عن const/let.
 * =======================================================================
 */

// سجل المعرّفات (ID's) الخاصة بالحاويات التي تم تحميلها وعرضها حاليًا
const LOADER_REGISTRY = new Set();

/**
 * @description إخفاء جميع الحاويات المسجلة ما عدا الحالية، والتحقق مما إذا كانت الحاوية مطلوبة للتحميل أم للعرض فقط.
 * @function profileHandleRegistry
 * @param {string} containerId - المعرّف (ID) الخاص بالحاوية الهدف.
 * @param {boolean} reload - هل يجب إعادة تحميل المحتوى حتى لو كان مسجلاً؟
 * @returns {boolean} - true إذا تم العثور على الحاوية ولم يُطلب إعادة التحميل، مما يوقف عملية التحميل.
 */
function profileHandleRegistry(containerId, reload) {
    try {
        // إخفاء جميع الحاويات المفتوحة حاليًا لتحاكي نظام التبويبات
        LOADER_REGISTRY.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

        // إذا كانت الحاوية مسجلة بالفعل ولم يُطلب إعادة التحميل
        if (LOADER_REGISTRY.has(containerId)) {
            const container = document.getElementById(containerId);
            if (container) container.style.display = "block";

            // إيقاف عملية التحميل إذا كانت غير مطلوبة
            if (!reload) {
                return true;
            }
        } else {
            // تسجيل الحاوية الجديدة
            LOADER_REGISTRY.add(containerId);
        }
        return false; // المتابعة لعملية التحميل
    } catch (error) {
        console.error("خطأ في إدارة سجل التحميل (profileHandleRegistry):", error);
        return false;
    }
}

/**
 * @description جلب محتوى HTML من الرابط المحدد.
 * @function profileFetchContent
 * @param {string} pageUrl - رابط الصفحة المراد جلبها.
 * @returns {Promise<string|null>} - وعد (Promise) يعود بمحتوى HTML أو null في حال حدوث خطأ.
 */
async function profileFetchContent(pageUrl) {
    try {
        const response = await fetch(pageUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`فشل تحميل الملف (${response.status}): ${pageUrl}`);
        }
        return await response.text();
    } catch (error) {
        console.error("خطأ في جلب محتوى الملف (profileFetchContent):", error);
        return null;
    }
}

/**
 * @description إعادة تشغيل السكربتات المضمنة يدوياً (المنهجية: hgh_sec).
 *
 * *تم التحديث*: تغليف السكربتات المضمنة بدالة مُنفذة فورياً (IIFE)
 * لإنشاء نطاق خاص وتجنب خطأ "already declared" مع const/let.
 * @function profileRestartScripts
 * @param {HTMLElement} container - العنصر الذي يحتوي على السكربتات المراد إعادة تشغيلها.
 */
async function profileRestartScripts(container) {
    try {
        // استخراج جميع عناصر السكربتات الموجودة
        const scripts = [...container.querySelectorAll("script")];

        for (const oldScript of scripts) {
            const newScript = document.createElement("script");

            // 1. نسخ السمات والخصائص
            for (const attr of oldScript.attributes) {
                newScript.setAttribute(attr.name, attr.value);
            }

            // 2. معالجة محتوى السكربت (للسكربتات المضمنة)
            if (oldScript.innerHTML.trim()) {
                let scriptContent = oldScript.innerHTML;
                
                // تغليف الكود المضمن بدالة منفذة فورياً (IIFE) لإنشاء نطاق خاص
                // هذا يمنع خطأ "Identifier 'X' has already been declared" عند إعادة التحميل
                scriptContent = `(function() {
                    try {
                        ${scriptContent}
                    } catch (err) {
                        // طباعة الخطأ للمساعدة في تتبع المشكلة داخل السكربت المُنفّذ
                        console.error("❌ خطأ في تنفيذ سكربت مُغلّف (IIFE) بعد التحميل:", err);
                    }
                })();`;
                
                newScript.textContent = scriptContent;
            }

            // 3. استبدال السكربت القديم بالجديد
            oldScript.replaceWith(newScript);

            // 4. إذا كان السكربت خارجياً (لديه src)، يجب الانتظار حتى يتم تحميله
            if (newScript.src) {
                // الانتظار باستخدام Promise لضمان التنفيذ التسلسلي قبل متابعة السكربت التالي
                await new Promise((resolve) => {
                    newScript.onload = () => resolve();
                    newScript.onerror = () => {
                        console.error(`❌ فشل تحميل السكربت الخارجي: ${newScript.src}`);
                        resolve(); // الاستمرار حتى لو فشل السكربت
                    };
                });
            }
        }
    } catch (error) {
        console.error("خطأ في إعادة تشغيل السكربتات (profileRestartScripts):", error);
    }
}

/**
 * @description تنفيذ دالة رد النداء (Callback) بعد اكتمال التحميل.
 * @function profileExecuteCallback
 * @param {string} callbackName - اسم دالة رد النداء في النطاق العام (window).
 */
function profileExecuteCallback(callbackName) {
    try {
        if (!callbackName) return;

        const callback = window[callbackName];

        if (typeof callback === "function") {
            callback();
        } else {
            console.warn("❌ لم يتم العثور على دالة رد النداء (Callback) باسم:", callbackName);
        }
    } catch (error) {
        console.error("خطأ في تنفيذ دالة رد النداء (profileExecuteCallback):", error);
    }
}


/**
 * @description تقوم بمسح الأنماط (Styles) والسكربتات (Scripts) المرتبطة بالتحميل السابق للحاوية لمنع التضارب.
 * @function profileClearOldContent
 * @param {string} containerId - المعرّف (ID) الخاص بالحاوية الهدف.
 */
function profileClearOldContent(containerId) {
    try {
        // 1. مسح الـ CSS المخصص المضاف تلقائيًا للحاوية
        // البحث باستخدام السمة المخصصة data-loader-id لضمان تحديد دقيق
        document.querySelectorAll(`style[data-loader-id="${containerId}"]`).forEach(styleTag => {
            styleTag.remove();
        });

        // 2. مسح محتوى HTML للحاوية
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }

        console.log(`✔ تم مسح المحتوى والـ CSS القديم المتعلق بالحاوية: ${containerId}`);

    } catch (error) {
        console.error("خطأ في مسح المحتوى القديم (profileClearOldContent):", error);
    }
}

/**
 * @description الدالة الرئيسية لتحميل المحتوى الديناميكي وتطبيقه في الحاوية الهدف.
 *
 * @param {string} pageUrl - رابط الصفحة المراد تحميلها.
 * @param {string} containerId - الـ ID الخاص بالحاوية الهدف.
 * @param {number} [waitMs=300] - وقت الانتظار بالملي ثانية.
 * @param {string} [cssRules=...] - كود CSS يتم تطبيقه على الـ container (افتراضي جاهز).
 * @param {string} [callbackName] - اسم دالة رد النداء في النطاق العام (window) ليتم استدعاؤها بعد التحميل.
 * @param {boolean} [reload=false] - فرض إعادة تحميل المحتوى حتى لو كان مسجلاً.
 */
async function mainLoader(
    pageUrl,
    containerId,
    waitMs = 300,
    cssRules = `
        flex: 1;
        border: none;
        overflow-y: auto;
        overflow-x: hidden;
    `,
    callbackName,
    reload = false
) {
    try {
        // 1. إدارة السجل وإخفاء الحاويات الأخرى
        const skipLoading = profileHandleRegistry(containerId, reload);
        
        if (skipLoading) {
            profileExecuteCallback(callbackName);
            return;
        }

        // 2. المسح عند إعادة التحميل: يمنع تضارب الـ Styles والـ Scripts القديمة
        if (reload) {
            profileClearOldContent(containerId);
        }

        // 3. تحميل محتوى HTML
        const html = await profileFetchContent(pageUrl);

        if (html === null) return; // فشل التحميل

        const container = document.getElementById(containerId);
        if (!container) {
            console.error("لم يتم العثور على العنصر: " + containerId);
            return;
        }

        // إدخال المحتوى وعرض الحاوية
        container.innerHTML = html;
        container.style.display = "block";

        // 4. تطبيق CSS تلقائياً (فصل المسؤوليات - SoC)
        const styleTag = document.createElement("style");
        // إضافة سمة مخصصة لتمييز الأنماط التي أنشأها الـ Loader
        styleTag.setAttribute('data-loader-id', containerId);
        styleTag.innerHTML = `
            #${containerId} {
                ${cssRules}
            }
        `;
        document.head.appendChild(styleTag);

        // 5. إعادة تشغيل السكربتات (المنهجية المحفوظة: hgh_sec)
        await profileRestartScripts(container); 

        // 6. الانتظار
        await new Promise((r) => setTimeout(r, waitMs));

        // سجل الإخراج النهائي لعملية التحميل
        console.log(
            `%c✔✔✔✔✔✔✔ تم التحميل ✔✔✔✔✔✔✔\n` +
            `pageUrl: ${pageUrl}\n` +
            `containerId: ${containerId}\n` +
            `reload: ${reload}`,
            "color: #0a4902ff; font-size: 12px; font-weight: bold; font-family: 'Tahoma';"
        );

        // 7. تنفيذ رد النداء
        profileExecuteCallback(callbackName);

    } catch (globalError) {
        console.error("خطأ عام غير متوقع في دالة mainLoader:", globalError);
    }
}