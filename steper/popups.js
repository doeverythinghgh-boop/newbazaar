/**
 * @file popups.js
 * @description ملف تجميع وإعادة تصدير (Barrel File) للنوافذ المنبثقة.
 * الغرض من هذا الملف هو تبسيط استيراد الدوال في الملفات الأخرى.
 * بدلاً من استيراد كل دالة من ملفها الخاص، يمكن استيرادها جميعاً من هذا الملف.
 * هذا يحافظ أيضاً على التوافق مع الكود القديم إذا كان يعتمد على ملف واحد.
 */

// إعادة تصدير الدوال المساعدة - Re-export helper functions
export { addStatusToggleListener } from "./popupHelpers.js";

// إعادة تصدير نوافذ المشتري - Re-export buyer popups
export {
    showProductKeysAlert,
    showUnselectedProductsAlert,
    showDeliveryConfirmationAlert,
    showReturnedProductsAlert,
} from "./buyerPopups.js";

// إعادة تصدير نوافذ البائع - Re-export seller popups
export {
    showSellerConfirmationProductsAlert,
    showSellerRejectedProductsAlert,
    showShippingInfoAlert,
} from "./sellerPopups.js";
