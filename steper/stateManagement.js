/**
 * @file stateManagement.js
 * @description دوال إدارة حالة LocalStorage.
 */

/**
 * @description يحفظ حالة خطوة معينة في LocalStorage.
 * @param {string} stepId - معرف الخطوة (مثل 'step-review').
 * @param {object} state - الكائن الذي سيتم حفظه.
 */
export function saveStepState(stepId, state) {
    try {
        localStorage.setItem(`${stepId}_state`, JSON.stringify(state));
    } catch (saveError) {
        console.error("Failed to save state to LocalStorage:", saveError);
    }
}

/**
 * @description يجلب حالة خطوة معينة من LocalStorage.
 * @param {string} stepId - معرف الخطوة.
 * @returns {object | null} - الكائن المحفوظ أو null.
 */
export function loadStepState(stepId) {
    try {
        const state = localStorage.getItem(`${stepId}_state`);
        return state ? JSON.parse(state) : null;
    } catch (loadError) {
        console.error("Failed to load state from LocalStorage:", loadError);
        return null;
    }
}
