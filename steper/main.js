/**
 * @file main.js
 * @description نقطة دخول التطبيق (Entry Point).
 */

import { fetchControlData, fetchOrdersData } from "./dataFetchers.js";
import {
    determineUserType,
    determineCurrentStepId,
} from "./roleAndStepDetermination.js";
import { updateCurrentStepFromState } from "./uiUpdates.js";
import { addStepClickListeners } from "./stepClickHandlers.js";

/**
 * @description يقوم بتهيئة جميع الوظائف بعد تحميل محتوى DOM بالكامل.
 */
document.addEventListener("DOMContentLoaded", () => {
    /**
     * @description جلب جميع البيانات اللازمة بشكل متزامن وبدء تهيئة الواجهة.
     */
    Promise.all([fetchControlData(), fetchOrdersData()])
        .then(([controlData, ordersData]) => {
            try {
                // إتمام تهيئة البيانات والواجهة
                const userId = controlData.currentUser.idUser;
                const userType = determineUserType(userId, ordersData, controlData);

                // إذا لم يتم تحديد نوع المستخدم، أوقف التنفيذ
                if (!userType) {
                    return;
                }

                // تحديد ما إذا كان تعديل المنتجات مقفلاً
                const currentStepNo = parseInt(
                    determineCurrentStepId(controlData).stepNo
                );
                const shippedStepNo = parseInt(
                    controlData.steps.find((step) => step.id === "step-shipped")?.no || 0
                );
                const isBuyerReviewModificationLocked = currentStepNo >= shippedStepNo;

                // أضف النوع المحدد إلى كائن المستخدم الحالي
                controlData.currentUser.type = userType;

                // عرض معلومات المستخدم في الواجهة
                const userIdElement = document.getElementById("display-user-id");
                const userTypeElement = document.getElementById("display-user-type");

                if (userIdElement) userIdElement.textContent = userId;
                if (userTypeElement) userTypeElement.textContent = userType;

                console.log(`User type determined as: ${userType}`);

                updateCurrentStepFromState(controlData); // تحديث الخطوة الحالية بناءً على الحالة
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
