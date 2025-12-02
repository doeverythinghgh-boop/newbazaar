/**
 * =======================================================================
 * وحدة تحميل المحتوى الديناميكي (Dynamic Content Loader - BidStory)
 *
 * *تحديث رئيسي*: تمت إضافة نظام سجل التنقل الداخلي (HISTORY_STACK)
 * للعودة خطوة للوراء وإدارة حالة الـ `reload` المُخزنة.
 * =======================================================================
 */

// سجل المعرّفات (ID's) الخاصة بالحاويات التي تم تحميلها وعرضها حاليًا
const LOADER_REGISTRY = new Set();

// سجل التاريخ (History Stack) لتتبع مسارات التنقل الداخلية
const HISTORY_STACK = []; 
// مؤشر الموقع الحالي في السجل، يبدأ عند -1 للدلالة على أنه فارغ
let CURRENT_INDEX = -1; 

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
 * @description إدارة وإضافة إدخال جديد إلى سجل التاريخ (History Stack).
 * يتم قص السجل إذا كان التنقل لمسار جديد من منتصف السجل.
 * @function profileHandleHistory
 * @param {string} pageUrl - رابط الصفحة المراد جلبها.
 * @param {string} containerId - الـ ID الخاص بالحاوية الهدف.
 * @param {boolean} reload - قيمة الـ reload التي تم استخدامها في هذا التحميل.
 */
function profileHandleHistory(pageUrl, containerId, reload) {
    // 1. توليد عنوان بسيط (تلقائي بناءً على الوقت الحالي)
    const title = `Page: ${containerId} (${new Date().toLocaleTimeString()})`;

    // 2. التحقق مما إذا كنا في منتصف السجل وإزالة الإدخالات اللاحقة
    // (سلوك المتصفح القياسي: عند العودة ثم اختيار مسار جديد، يتم مسح المستقبل)
    if (CURRENT_INDEX < HISTORY_STACK.length - 1) {
        HISTORY_STACK.length = CURRENT_INDEX + 1;
    }

    // 3. إضافة الإدخال الجديد
    const newEntry = {
        containerId: containerId,
        pageUrl: pageUrl,
        reload: reload,
        title: title,
    };
    HISTORY_STACK.push(newEntry);

    // 4. تحديث المؤشر
    CURRENT_INDEX = HISTORY_STACK.length - 1;
    
    // سجل إخراج للإدخال الجديد (للتصحيح فقط)
    console.log(`+ تم إضافة إدخال إلى السجل. المؤشر الحالي: ${CURRENT_INDEX}`);
    console.log("السجل الحالي:", HISTORY_STACK);
}

/**
 * @description دالة لتنفيذ عملية الرجوع خطوة واحدة في سجل التنقل الداخلي.
 * تُستدعى يدوياً من خارج الوحدة.
 * @function profileGoBack
 */
async function profileGoBack() {
    try {
        if (CURRENT_INDEX <= 0) {
            console.warn("لا توجد صفحات سابقة للعودة إليها في سجل التاريخ الداخلي.");
            return;
        }

        // 1. تحديث المؤشر خطوة للخلف
        CURRENT_INDEX--;
        const historyEntry = HISTORY_STACK[CURRENT_INDEX];

        // 2. تحديد قيمة reload بناءً على منطق التباين في الحاوية
        const currentContainerId = Array.from(LOADER_REGISTRY).find(id => {
             const el = document.getElementById(id);
             return el && el.style.display !== 'none';
        });

        let effectiveReload = historyEntry.reload;

        if (currentContainerId && currentContainerId !== historyEntry.containerId) {
            // إذا كنا ننتقل إلى حاوية أخرى: يجب إجبار reload=false 
            // لضمان عرض المحتوى المخزن وإخفاء الحاوية الحالية، دون جلب جديد من الشبكة.
            effectiveReload = false;
        }

        console.log(`← العودة إلى: ${historyEntry.title}. reload المستخدم: ${effectiveReload}`);

        // 3. استدعاء mainLoader مع البيانات المخزنة (دون انتظار التحميل).
        // ملاحظة: يتم تمرير waitMs و cssRules و callbackName بقيمها الافتراضية
        // حيث لا يمكن تخزينها بشكل عملي في سجل التنقل العادي.
        await mainLoader(
            historyEntry.pageUrl,
            historyEntry.containerId,
            300, // waitMs
            undefined, // cssRules (لتمرير القيمة الافتراضية)
            undefined, // callbackName
            effectiveReload
        );

    } catch (error) {
        console.error("خطأ في عملية العودة للخلف (profileGoBack):", error);
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
            // تحديث المؤشر إذا كان التنقل فقط للعرض (لإعادة تمكين وظيفة الرجوع/الأمام)
            if (!reload) {
                 const newIndex = HISTORY_STACK.findIndex(entry => 
                     entry.containerId === containerId && entry.pageUrl === pageUrl
                 );
                 if (newIndex !== -1 && newIndex < CURRENT_INDEX) {
                     // هذا يعني أننا عدنا للخلف ثم ضغطنا على رابط قديم (للتصحيح فقط)
                     CURRENT_INDEX = newIndex;
                 }
            }
            
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

        // 4. إدارة سجل التاريخ (يجب أن يتم قبل إدخال المحتوى في أول استدعاء)
        // يتم تسجيل الإدخال فقط إذا كانت عملية الجلب (Fetch) ناجحة.
        profileHandleHistory(pageUrl, containerId, reload);

        // 5. إدخال المحتوى وعرض الحاوية
        container.innerHTML = html;
        container.style.display = "block";

        // 6. تطبيق CSS تلقائياً (فصل المسؤوليات - SoC)
        const styleTag = document.createElement("style");
        // إضافة سمة مخصصة لتمييز الأنماط التي أنشأها الـ Loader
        styleTag.setAttribute('data-loader-id', containerId);
        styleTag.innerHTML = `
            #${containerId} {
                ${cssRules}
            }
        `;
        document.head.appendChild(styleTag);

        // 7. إعادة تشغيل السكربتات (المنهجية المحفوظة: hgh_sec)
        await profileRestartScripts(container); 

        // 8. الانتظار
        await new Promise((r) => setTimeout(r, waitMs));

        // سجل الإخراج النهائي لعملية التحميل
        console.log(
            `%c✔✔✔✔✔✔✔ تم التحميل ✔✔✔✔✔✔✔\n` +
            `pageUrl: ${pageUrl}\n` +
            `containerId: ${containerId}\n` +
            `reload: ${reload}`,
            "color: #0a4902ff; font-size: 12px; font-weight: bold; font-family: 'Tahoma';"
        );

        // 9. تنفيذ رد النداء
        profileExecuteCallback(callbackName);

    } catch (globalError) {
        console.error("خطأ عام غير متوقع في دالة mainLoader:", globalError);
        
        // عند فشل التحميل، يجب التراجع عن إضافة السجل (إذا كانت قد أضيفت قبل الفشل)
        if (CURRENT_INDEX === HISTORY_STACK.length - 1 && HISTORY_STACK.length > 0) {
            HISTORY_STACK.pop();
            CURRENT_INDEX--;
            console.warn("تم التراجع عن إضافة السجل بسبب فشل التحميل العام.");
        }
    }
}