/**
 * @file stateManagement.js
 * @description وحدة إدارة الحالة (State Management) باستخدام LocalStorage.
 * تم تحديثها لتجميع جميع البيانات في مفتاح واحد 'stepper_app_data'.
 * يوفر هذا الملف دوال مساعدة لحفظ واسترجاع البيانات من تخزين المتصفح المحلي.
 */

import { updateGlobalStepperAppData, globalStepperAppData } from "./config.js";

const APP_STATE_KEY = "stepper_app_data";

/**
 * @function getAppState
 * @description استرجاع حالة التطبيق الكاملة من LocalStorage.
 * @returns {object} كائن الحالة الكامل (يحتوي على steps و dates).
 */
function getAppState() {
    try {
        const stateStr = localStorage.getItem(APP_STATE_KEY);
        return stateStr ? JSON.parse(stateStr) : { steps: {}, dates: {} };
    } catch (e) {
        console.error("Failed to parse app state:", e);
        return { steps: {}, dates: {} };
    }
}

/**
 * @function saveAppState
 * @description حفظ حالة التطبيق الكاملة في LocalStorage وتحديث المتغير العام.
 * @param {object} state - كائن الحالة الكامل.
 */
function saveAppState(state) {
    try {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
        // تحديث المتغير العام في config.js
        updateGlobalStepperAppData(state);
    } catch (e) {
        console.error("Failed to save app state:", e);
    }
}

/**
 * @function initializeState
 * @description تهيئة الحالة الأولية إذا لم تكن موجودة.
 * يجب استدعاؤها عند بدء التطبيق.
 */
export function initializeState() {
    // 1. التحقق من المتغير العام أولاً
    // ملاحظة: globalStepperAppData يتم استيراده من config.js، ولكن بما أننا في نفس السياق (modules)،
    // فإننا نعتمد على القيمة التي قد تكون عُينت قبل استدعاء هذه الدالة.
    // ومع ذلك، في هيكلية ES modules، المتغيرات المستوردة تكون read-only bindings.
    // للوصول إلى القيمة الحالية، نحتاج للتأكد من أننا نستخدم المتغير المستورد.
    // في هذا الملف، نحن نستورد updateGlobalStepperAppData فقط، لذا سنحتاج لاستيراد globalStepperAppData أيضًا.

    // لكن انتظر، globalStepperAppData معرف في config.js كـ var ويتم تصديره.
    // سنقوم بتعديل الاستيراد في الأعلى ليشمل globalStepperAppData.

    let state;

    if (globalStepperAppData && Object.keys(globalStepperAppData).length > 0) {
        console.log("Found initial globalStepperAppData, using it:", globalStepperAppData);
        state = globalStepperAppData;
        // حفظ الحالة الموجودة في المتغير العام إلى LocalStorage لضمان التزامن
        saveAppState(state);
    } else {
        console.log("No initial globalStepperAppData found, loading from LocalStorage.");
        state = getAppState();
        // تحديث المتغير العام بالقيمة الحالية عند البدء
        updateGlobalStepperAppData(state);
    }

    let updated = false;
    if (!state.steps) {
        state.steps = {};
        updated = true;
    }
    if (!state.dates) {
        state.dates = {};
        updated = true;
    }
    if (updated) {
        saveAppState(state);
    }

    // تنظيف المفاتيح القديمة
    cleanupLegacyKeys();
}

/**
 * @function cleanupLegacyKeys
 * @description إزالة المفاتيح القديمة التي كانت تستخدم قبل التجميع.
 */
function cleanupLegacyKeys() {
    console.log("Running cleanupLegacyKeys...");
    try {
        const keysToRemove = [
            "current_step_state",
            "step-review_state",
            "step-confirmed_state",
            "step-shipped_state",
            "step-delivered_state",
            "step-cancelled_state",
            "step-rejected_state",
            "step-returned_state"
        ];

        // إزالة مفاتيح التواريخ القديمة
        const stepIds = [
            "step-review", "step-confirmed", "step-shipped", "step-delivered",
            "step-cancelled", "step-rejected", "step-returned"
        ];
        stepIds.forEach(id => keysToRemove.push(`date_${id}`));

        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.error("Failed to cleanup legacy keys:", e);
    }
}

/**
 * @function saveStepState
 * @description حفظ حالة خطوة معينة داخل الكائن المجمع.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة.
 * @param {object} state - كائن البيانات الذي يحتوي على حالة الخطوة.
 */
export function saveStepState(stepId, state) {
    const appState = getAppState();
    if (!appState.steps) appState.steps = {};
    appState.steps[stepId] = state;
    saveAppState(appState);
}

/**
 * @function loadStepState
 * @description استرجاع حالة خطوة معينة من الكائن المجمع.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة.
 * @returns {object|null} - تعيد كائن الحالة إذا وجد، أو null.
 */
export function loadStepState(stepId) {
    const appState = getAppState();
    return (appState.steps && appState.steps[stepId]) || null;
}

/**
 * @function saveStepDate
 * @description حفظ تاريخ تفعيل خطوة معينة.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة.
 * @param {string} dateStr - نص التاريخ المنسق.
 */
export function saveStepDate(stepId, dateStr) {
    const appState = getAppState();
    if (!appState.dates) appState.dates = {};
    appState.dates[stepId] = dateStr;
    saveAppState(appState);
}

/**
 * @function loadStepDate
 * @description استرجاع تاريخ تفعيل خطوة معينة.
 * 
 * @param {string} stepId - المعرف الفريد للخطوة.
 * @returns {string|null} - نص التاريخ أو null.
 */
export function loadStepDate(stepId) {
    const appState = getAppState();
    return (appState.dates && appState.dates[stepId]) || null;
}
