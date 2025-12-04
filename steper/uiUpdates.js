/**
 * @file uiUpdates.js
 * @description وحدة تحديث واجهة المستخدم (UI Updates Module).
 * يحتوي هذا الملف على جميع الدوال التي تتعامل مباشرة مع DOM (عناصر الصفحة).
 * يشمل ذلك:
 * - إظهار رسائل التنبيه والخطأ.
 * - تحديث حالة الخطوات (تلوين الخطوة النشطة).
 * - إضافة تأثيرات الحركة (Animations).
 * - إنشاء عناصر HTML ديناميكية (مثل تذييل النوافذ المنبثقة).
 */

import { determineCurrentStepId } from "./roleAndStepDetermination.js";
import { saveStepState, loadStepState } from "./stateManagement.js";

// متغير لتخزين مؤقت الرسالة (لإدارة التكرار ومنع تراكم المؤقتات)
let messageTimeout;

/**
 * @function showUnauthorizedAlert
 * @description تعرض رسالة تنبيه للمستخدم عندما يحاول النقر على خطوة ليس لديه صلاحية الوصول إليها.
 * تظهر الرسالة لفترة قصيرة ثم تختفي تلقائياً.
 */
export function showUnauthorizedAlert() {
    try {
        const messageElement = document.getElementById("permission-denied-message");
        if (!messageElement) return;

        // مسح المؤقت السابق إذا نقر المستخدم مرة أخرى بسرعة قبل اختفاء الرسالة السابقة
        // هذا يمنع اختفاء الرسالة الجديدة مبكراً جداً
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        messageElement.textContent = "ليس لديك الصلاحية لهذه المرحلة";
        messageElement.classList.add("show"); // إضافة كلاس CSS لإظهار الرسالة

        // إخفاء الرسالة بعد 3 ثواني
        messageTimeout = setTimeout(() => {
            messageElement.classList.remove("show");
        }, 3000);
    } catch (alertError) {
        console.error("Error in showUnauthorizedAlert:", alertError);
    }
}

/**
 * @function animateStep
 * @description تضيف تأثير حركة (Animation) على دائرة الخطوة لجذب الانتباه.
 * 
 * @param {HTMLElement} circle - عنصر الدائرة (DOM Element) المراد تحريكه.
 */
export function animateStep(circle) {
    try {
        // يفترض وجود تعريف للأنيميشن 'pulse' في ملف CSS
        circle.style.animation = "pulse 1.5s infinite";
    } catch (animationError) {
        console.error("Error in animateStep:", animationError);
    }
}

/**
 * @function highlightCurrentStep
 * @description تقوم بتحديث المظهر المرئي لشريط التقدم.
 * تزيل التمييز عن جميع الخطوات ثم تضيفه فقط للخطوة المحددة كـ "حالية".
 * 
 * @param {string} stepId - معرف الخطوة المراد إبرازها وتمييزها.
 */
export function highlightCurrentStep(stepId) {
    try {
        // 1. تنظيف الحالة السابقة: إزالة التظليل من جميع الخطوات
        document.querySelectorAll(".step-item.current").forEach((item) => {
            item.classList.remove("current");
            const circle = item.querySelector(".step-circle");
            if (circle) circle.style.animation = ""; // إيقاف الحركة
        });

        // 2. تفعيل الحالة الجديدة: إضافة التظليل والحركة للخطوة المحددة
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
 * @function updateCurrentStepFromState
 * @description دالة مركزية لتحديث حالة التطبيق بالكامل بناءً على البيانات.
 * تقوم بما يلي:
 * 1. تحديد الخطوة الحالية.
 * 2. تحديث الواجهة لإبراز الخطوة الحالية.
 * 3. حفظ الحالة الجديدة.
 * 4. التحقق من الحالات الخاصة (مثل وجود منتجات ملغاة أو مرفوضة) وتحديث أيقونات الخطوات المقابلة.
 * 
 * @param {object} controlData - بيانات التحكم.
 */
export function updateCurrentStepFromState(controlData) {
    try {
        // تحديد الخطوة الحالية
        const currentStep = determineCurrentStepId(controlData);
        
        // تحديث الواجهة
        highlightCurrentStep(currentStep.stepId);
        
        // حفظ الخطوة الحالية المحددة في localStorage لضمان استمراريتها عند التحديث
        saveStepState("current_step", currentStep);
        
        // --- معالجة المؤشرات الخاصة (Badges/Indicators) ---

        // 1. التحقق من وجود منتجات ملغاة (في خطوة 'ملغي')
        const reviewState = loadStepState("step-review");
        const cancelledStep = document.getElementById("step-cancelled");
        
        if (cancelledStep) {
            // إذا كان هناك مفاتيح في unselectedKeys، فهذا يعني أن المشتري ألغى بعض المنتجات
            if (reviewState && reviewState.unselectedKeys && reviewState.unselectedKeys.length > 0) {
                // أضف كلاس لتفعيل تأثير بصري (مثل اهتزاز أو لون مختلف)
                cancelledStep.classList.add("has-cancelled-products");
            } else {
                cancelledStep.classList.remove("has-cancelled-products");
            }
        }
        
        // 2. التحقق من وجود منتجات مرفوضة من البائع (في خطوة 'مرفوض')
        const confirmedState = loadStepState("step-confirmed");
        const rejectedStep = document.getElementById("step-rejected");
        
        if (rejectedStep) {
            // إذا كان هناك مفاتيح في deselectedKeys، فهذا يعني أن البائع رفض بعض المنتجات
            if (confirmedState && confirmedState.deselectedKeys && confirmedState.deselectedKeys.length > 0) {
                rejectedStep.classList.add("has-rejected-products");
            } else {
                rejectedStep.classList.remove("has-rejected-products");
            }
        }

        // 3. التحقق من وجود منتجات مرتجعة (في خطوة 'مرتجع')
        const deliveredState = loadStepState("step-delivered");
        const returnedStep = document.getElementById("step-returned");

        if (returnedStep) {
            // إذا كان هناك مفاتيح في returnedKeys، فهذا يعني أن هناك منتجات مرتجعة
            if (deliveredState && deliveredState.returnedKeys && deliveredState.returnedKeys.length > 0) {
                returnedStep.classList.add("has-returned-products");
            } else {
                returnedStep.classList.remove("has-returned-products");
            }
        }
        
    } catch (updateError) {
        console.error("Error in updateCurrentStepFromState:", updateError);
    }
}

/**
 * @function createStepStatusFooter
 * @description تنشئ كود HTML لتذييل النافذة المنبثقة (Modal Footer).
 * يحتوي التذييل عادةً على مربع اختيار (Checkbox) للسماح للمستخدم بتفعيل المرحلة والانتقال إليها.
 * 
 * @param {string} stepId - معرف الخطوة التي تظهر النافذة لها.
 * @param {object} currentStep - كائن يمثل الخطوة النشطة حالياً في النظام.
 * 
 * @returns {string} - كود HTML جاهز للإدراج في النافذة.
 */
export function createStepStatusFooter(stepId, currentStep) {
    try {
        // هل هذه الخطوة هي الخطوة النشطة حالياً؟
        const isActive = stepId === currentStep.stepId;
        
        // الحصول على رقم الخطوة الحالية (من الحالة)
        const currentStepNo = parseInt(currentStep.stepNo) || 0;
        
        // تحديد ترتيب الخطوات يدوياً للمقارنة
        // هذا يساعد في معرفة ما إذا كانت الخطوة قد اكتملت سابقاً
        const stepOrder = {
            "step-review": 1,
            "step-confirmed": 2,
            "step-shipped": 3,
            "step-delivered": 4,
            "step-cancelled": 5,
            "step-rejected": 6,
            "step-returned": 7
        };
        
        const requestedStepNo = stepOrder[stepId] || 0;
        
        // تحديد ما إذا كانت الخطوة مكتملة (أي أننا تجاوزناها لمرحلة لاحقة)
        // إذا كان رقم الخطوة المطلوبة أقل من رقم الخطوة الحالية، فهي مكتملة
        const isCompleted = requestedStepNo < currentStepNo;
        
        // تحديد حالة الـ checkbox (محدد أو معطل)
        // يكون محدداً إذا كانت الخطوة نشطة أو مكتملة
        const checked = isActive || isCompleted ? "checked" : "";
        // يكون معطلاً (لا يمكن تغييره) إذا كانت الخطوة نشطة أو مكتملة
        const disabled = isActive || isCompleted ? "disabled" : "";

        return `
              <div id="modal-step-status-container" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <input type="checkbox" id="modal-step-status-checkbox" ${checked} ${disabled} data-step-id="${stepId}">
                  <label for="modal-step-status-checkbox" style="font-weight: bold; cursor: pointer;">تفعيل المرحله</label>
              </div>
          `;
    } catch (footerError) {
        console.error("Error in createStepStatusFooter:", footerError);
        return "";
    }
}