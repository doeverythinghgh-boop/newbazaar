/**
 * @file stepClickHandlers.js
 * @description دالة إضافة معالجات النقر على الخطوات (Step Click Handler).
 */

import { isStepAllowedForCurrentUser } from "./roleAndStepDetermination.js";
import { showUnauthorizedAlert } from "./uiUpdates.js";
import {
    showProductKeysAlert,
    showSellerConfirmationProductsAlert,
    showShippingInfoAlert,
    showUnselectedProductsAlert,
    showSellerRejectedProductsAlert,
    showDeliveryConfirmationAlert,
    showReturnedProductsAlert,
} from "./popups.js";

/**
 * @description يضيف معالج النقر لكل عنصر خطوة لتنفيذ الإجراءات المناسبة.
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 * @param {boolean} isBuyerReviewModificationLocked - حالة قفل التعديل على المراجعة.
 */
export function addStepClickListeners(
    data,
    ordersData,
    isBuyerReviewModificationLocked
) {
    try {
        const stepItems = document.querySelectorAll(".step-item");
        stepItems.forEach((stepItem) => {
            stepItem.addEventListener("click", () => {
                const stepId = stepItem.id;
                const userType = data.currentUser.type;

                // 1. التحقق من الصلاحيات
                if (!isStepAllowedForCurrentUser(stepId, data)) {
                    showUnauthorizedAlert();
                    return; // إيقاف أي إجراء آخر
                }

                // 2. تنفيذ الإجراء الخاص بالخطوة ونوع المستخدم
                switch (stepId) {
                    case "step-review":
                        if (userType === "buyer")
                            showProductKeysAlert(
                                data,
                                ordersData,
                                isBuyerReviewModificationLocked
                            );
                        break;
                    case "step-confirmed":
                        if (userType === "seller")
                            showSellerConfirmationProductsAlert(data, ordersData);
                        break;
                    case "step-shipped":
                        if (userType === "seller" || userType === "courier")
                            showShippingInfoAlert(data);
                        break;
                    case "step-cancelled":
                        showUnselectedProductsAlert(data, ordersData);
                        break;
                    case "step-rejected":
                        showSellerRejectedProductsAlert(data, ordersData);
                        break;
                    case "step-delivered":
                        if (userType === "buyer" || userType === "courier")
                            showDeliveryConfirmationAlert(data);
                        break;
                    case "step-returned":
                        showReturnedProductsAlert(data);
                        break;
                }
            });
        });
    } catch (listenerError) {
        console.error("Error in addStepClickListeners:", listenerError);
    }
}
