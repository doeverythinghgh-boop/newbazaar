/**
 * @file uiUpdates.js
 * @description دوال تحديث الواجهة والتحقق (UI Update and Validation).
 */

import { determineCurrentStepId } from "./roleAndStepDetermination.js";
import { saveStepState } from "./stateManagement.js";

// متغير لتخزين مؤقت الرسالة (لإدارة التكرار)
let messageTimeout;

/**
 * @description يعرض رسالة تنبيه عند محاولة الوصول لخطوة غير مصرح بها.
 */
export function showUnauthorizedAlert() {
    try {
        const messageElement = document.getElementById("permission-denied-message");
        if (!messageElement) return;

        // مسح المؤقت السابق إذا نقر المستخدم مرة أخرى بسرعة
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        messageElement.textContent = "ليس لديك صلاحية الوصول إلى هذه الخطوة.";
        messageElement.classList.add("show");

        // إخفاء الرسالة بعد 3 ثواني
        messageTimeout = setTimeout(() => {
            messageElement.classList.remove("show");
        }, 3000);
    } catch (alertError) {
        console.error("Error in showUnauthorizedAlert:", alertError);
    }
}

/**
 * @description يضيف تأثير الحركة على دائرة الخطوة.
 * @param {HTMLElement} circle - عنصر الدائرة.
 */
export function animateStep(circle) {
    try {
        // يفترض وجود نمط 'pulse' في CSS
        circle.style.animation = "pulse 1.5s infinite";
    } catch (animationError) {
        console.error("Error in animateStep:", animationError);
    }
}

/**
 * @description يبرز الخطوة الحالية في الواجهة ويزيل التظليل من البقية.
 * @param {string} stepId - معرف الخطوة المراد إبرازها.
 */
export function highlightCurrentStep(stepId) {
    try {
        // إزالة التظليل من جميع الخطوات أولاً
        document.querySelectorAll(".step-item.current").forEach((item) => {
            item.classList.remove("current");
            const circle = item.querySelector(".step-circle");
            if (circle) circle.style.animation = ""; // إزالة الحركة
        });

        // إضافة التظليل والحركة للخطوة المحددة
        const stepItem = document.getElementById(stepId);
        if (stepItem) {
            stepItem.classList.add("current");
            animateStep(stepItem.querySelector(".step-circle"));
        }
    } catch (highlightError) {
        console.error("Error in highlightCurrentStep:", highlightError);
    }
}

/**
 * @description يقوم بتحديث الخطوة الحالية في الواجهة و LocalStorage بناءً على الحالة.
 * @param {object} controlData - بيانات التحكم.
 */
export function updateCurrentStepFromState(controlData) {
    try {
        const currentStep = determineCurrentStepId(controlData);
        highlightCurrentStep(currentStep.stepId);
        // حفظ الخطوة الحالية المحددة في localStorage لضمان استمراريتها
        saveStepState("current_step", currentStep);
    } catch (updateError) {
        console.error("Error in updateCurrentStepFromState:", updateError);
    }
}

/**
 * @description ينشئ محتوى التذييل الذي يعرض حالة الخطوة الحالية.
 * @param {string} stepId - معرف الخطوة الخاصة بالنافذة.
 * @param {object} currentStep - كائن الخطوة الحالية.
 * @returns {string} - كود HTML للتذييل.
 */
export function createStepStatusFooter(stepId, currentStep) {
    try {
        const isActive = stepId === currentStep.stepId;
        const disabled = isActive ? "disabled" : ""; // تعطيل مربع الاختيار إذا كانت الخطوة نشطة بالفعل

        return `
              <div id="modal-step-status-container" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <input type="checkbox" id="modal-step-status-checkbox" ${isActive ? "checked" : ""
            } ${disabled} data-step-id="${stepId}">
                  <label for="modal-step-status-checkbox" style="font-weight: bold; cursor: pointer;">تفعيل المرحله</label>
              </div>
          `;
    } catch (footerError) {
        console.error("Error in createStepStatusFooter:", footerError);
        return "";
    }
}
