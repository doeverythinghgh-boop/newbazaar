/**
 * @file stateManagement.js
 * @description وحدة إدارة الحالة (State Management) باستخدام LocalStorage.
 * يوفر هذا الملف دوال مساعدة لحفظ واسترجاع البيانات من تخزين المتصفح المحلي.
 * يستخدم هذا للحفاظ على حالة التطبيق (مثل الخطوة الحالية، المنتجات المحددة) حتى بعد تحديث الصفحة.
 */

/**
 * @function saveStepState
 * @description تقوم هذه الدالة بحفظ كائن حالة لخطوة معينة في LocalStorage.
 * يتم تحويل الكائن إلى نص JSON قبل الحفظ.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة (مثل 'step-review', 'step-confirmed').
 * يستخدم كجزء من مفتاح التخزين لتمييز بيانات كل خطوة.
 * @param {object} state - كائن البيانات الذي يحتوي على حالة الخطوة (مثل المنتجات المحددة، أو الحالة النشطة).
 * 
 * @returns {void} لا ترجع قيمة.
 * 
 * @example
 * saveStepState('step-review', { selectedKeys: ['p1', 'p2'] });
 */
export function saveStepState(stepId, state) {
    try {
        // استخدام JSON.stringify لتحويل الكائن إلى نص لتخزينه
        localStorage.setItem(`${stepId}_state`, JSON.stringify(state));
    } catch (saveError) {
        // التعامل مع أخطاء التخزين (مثل امتلاء الذاكرة أو تعطيل الكوكيز)
        console.error("Failed to save state to LocalStorage:", saveError);
    }
}

/**
 * @function loadStepState
 * @description تقوم هذه الدالة باسترجاع حالة خطوة معينة من LocalStorage.
 * تقوم بتحويل النص المخزن (JSON) وتعود به ككائن JavaScript.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة المراد استرجاع بياناتها.
 * 
 * @returns {object | null} - تعيد كائن الحالة إذا وجد، أو null إذا لم تكن هناك بيانات محفوظة أو حدث خطأ.
 * 
 * @example
 * const reviewState = loadStepState('step-review');
 * if (reviewState) { console.log(reviewState.selectedKeys); }
 */
export function loadStepState(stepId) {
    try {
        const state = localStorage.getItem(`${stepId}_state`);
        // إذا وجدت البيانات، قم بتحليلها، وإلا أرجع null
        return state ? JSON.parse(state) : null;
    } catch (loadError) {
        console.error("Failed to load state from LocalStorage:", loadError);
        return null;
    }
}
