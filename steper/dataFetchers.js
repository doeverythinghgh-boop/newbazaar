/**
 * @file dataFetchers.js
 * @description وحدة جلب البيانات (Data Fetching Module).
 * يحتوي هذا الملف على الدوال المسؤولة عن جلب البيانات الأساسية للتطبيق من ملفات JSON المحلية.
 * يتم استخدام `fetch` API لجلب البيانات بشكل غير متزامن.
 */

/**
 * @function fetchControlData
 * @description تقوم هذه الدالة بجلب ملف `control.json`.
 * يحتوي هذا الملف على إعدادات التحكم، تعريف الخطوات، وبيانات المستخدم الحالي.
 * 
 * @returns {Promise<Object>} وعد (Promise) يتم حله (resolves) بكائن بيانات التحكم عند نجاح الطلب.
 * 
 * @throws {Error} يرمي خطأ إذا فشل طلب الشبكة أو لم يكن الرد ناجحاً (not ok).
 */
export function fetchControlData() {
    try {
        // استخدام `cache: "no-cache"` يضمن أن المتصفح يطلب الملف من الخادم دائماً ولا يعتمد على النسخة المخبأة،
        // مما يضمن الحصول على أحدث البيانات في كل مرة يتم فيها تحميل الصفحة.
        return fetch("./control.json", { cache: "no-cache" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Error fetching control data: ${response.statusText}`);
            }
            return response.json();
        });
    } catch (fetchError) {
        console.error("Error in fetchControlData:", fetchError);
        // إعادة رمي الخطأ ليتم التعامل معه في المكان الذي استدعى هذه الدالة (عادة في main.js)
        throw fetchError;
    }
}

/**
 * @function fetchOrdersData
 * @description تقوم هذه الدالة بجلب ملف `orders_.json`.
 * يحتوي هذا الملف على قائمة الطلبات وتفاصيلها (المنتجات، البائعين، حالة التوصيل).
 * 
 * @returns {Promise<Object>} وعد (Promise) يتم حله بكائن بيانات الطلبات (مصفوفة عادة).
 * 
 * @throws {Error} يرمي خطأ إذا فشل الطلب.
 */
export function fetchOrdersData() {
    try {
        // جلب البيانات مع منع التخزين المؤقت (Caching)
        return fetch("./orders_.json", { cache: "no-cache" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Error fetching orders data: ${response.statusText}`);
            }
            return response.json();
        });
    } catch (fetchError) {
        console.error("Error in fetchOrdersData:", fetchError);
        throw fetchError;
    }
}
