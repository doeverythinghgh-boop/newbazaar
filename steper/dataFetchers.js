/**
 * @file dataFetchers.js
 * @description دوال جلب البيانات الأساسية (Core Data Fetchers).
 */

/**
 * @description يجلب ملف الإعدادات والتحكم.
 * @returns {Promise<Object>} وعد (Promise) بكائن بيانات التحكم.
 */
export function fetchControlData() {
    try {
        // استخدام `no-cache` لضمان الحصول على أحدث البيانات
        return fetch("./control.json", { cache: "no-cache" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Error fetching control data: ${response.statusText}`);
            }
            return response.json();
        });
    } catch (fetchError) {
        console.error("Error in fetchControlData:", fetchError);
        // رمي الخطأ مرة أخرى ليتم التقاطه في Promise.all
        throw fetchError;
    }
}

/**
 * @description يجلب ملف الطلبات.
 * @returns {Promise<Object>} وعد (Promise) بكائن بيانات الطلبات.
 */
export function fetchOrdersData() {
    try {
        // استخدام `no-cache` لضمان الحصول على أحدث البيانات
        return fetch("./orders_.json", { cache: "no-cache" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Error fetching orders data: ${response.statusText}`);
            }
            return response.json();
        });
    } catch (fetchError) {
        console.error("Error in fetchOrdersData:", fetchError);
        // رمي الخطأ مرة أخرى ليتم التقاطه في Promise.all
        throw fetchError;
    }
}
