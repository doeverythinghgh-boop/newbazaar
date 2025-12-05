/**
 * @file main.js
 * @description نقطة دخول التطبيق (Entry Point).
 * هذا الملف هو العقل المدبر للتطبيق، حيث يبدأ التنفيذ منه.
 * يقوم بتنسيق عملية التحميل الأولية:
 * 1. جلب البيانات (Control & Orders).
 * 2. تحديد هوية المستخدم ونوعه.
 * 3. تحديد الحالة الأولية للتطبيق (الخطوة الحالية).
 * 4. ربط معالجات الأحداث (Event Listeners).
 */

import { fetchControlData, fetchOrdersData } from "./dataFetchers.js";
import {
    determineUserType,
    determineCurrentStepId,
} from "./roleAndStepDetermination.js";
import { initializeState } from "./stateManagement.js";
import { updateCurrentStepFromState } from "./uiUpdates.js";
import { addStepClickListeners } from "./stepClickHandlers.js";

/**
 * @event DOMContentLoaded
 * @description يتم تنفيذ هذا الكود بمجرد تحميل هيكل الصفحة (DOM) بالكامل.
 * يضمن هذا أن جميع العناصر التي سنحاول الوصول إليها موجودة بالفعل.
 */
document.addEventListener("DOMContentLoaded", () => {
    /**
     * @description جلب جميع البيانات اللازمة بشكل متزامن (Parallel Fetching).
     * نستخدم Promise.all لانتظار اكتمال كلا الطلبين قبل المتابعة.
     * هذا يحسن الأداء مقارنة بانتظار كل طلب على حدة.
     */
    Promise.all([fetchControlData(), fetchOrdersData()])
        .then(([controlData, ordersData]) => {
            try {
                // --- مرحلة التهيئة (Initialization Phase) ---
                initializeState();

                // 1. استخراج معرف المستخدم من البيانات
                const userId = controlData.currentUser.idUser;

                // 2. تحديد نوع المستخدم (Admin, Buyer, Seller, Courier)
                const userType = determineUserType(userId, ordersData, controlData);

                // إذا لم يتم تحديد نوع المستخدم (مثلاً بيانات غير متناسقة)، أوقف التنفيذ
                if (!userType) {
                    console.error("Failed to determine user type. Aborting initialization.");
                    return;
                }

                // 3. حساب حالة قفل التعديل للمشتري
                // إذا تجاوزنا مرحلة الشحن، لا ينبغي للمشتري تعديل طلباته
                const currentStepNo = parseInt(
                    determineCurrentStepId(controlData).stepNo
                );
                const shippedStepNo = parseInt(
                    controlData.steps.find((step) => step.id === "step-shipped")?.no || 0
                );
                const isBuyerReviewModificationLocked = currentStepNo >= shippedStepNo;

                // 4. تحديث كائن المستخدم بالنوع المحدد
                controlData.currentUser.type = userType;

                // 5. عرض معلومات المستخدم في عنوان المتصفح
                const originalTitle = document.title;
                document.title = `[User: ${userId} | Type: ${userType}] - ${originalTitle}`;

                console.log(`User type determined as: ${userType}`);

                // 6. تحديث الواجهة لتعكس الخطوة الحالية
                updateCurrentStepFromState(controlData, ordersData);

                // 7. تفعيل التفاعل: إضافة مستمعي النقرات للخطوات
                addStepClickListeners(
                    controlData,
                    ordersData,
                    isBuyerReviewModificationLocked
                );
            } catch (initializationError) {
                console.error(
                    "Error in initial data processing (Promise.then):",
                    initializationError
                );
            }
        })
        .catch((error) =>
            console.error("Error fetching initial data (Promise.catch):", error)
        );
});
