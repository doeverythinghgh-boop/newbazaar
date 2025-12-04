/**
 * @file sellerPopups.js
 * @description نوافذ البائع المنبثقة (Seller Popups).
 * يحتوي هذا الملف على جميع الدوال المسؤولة عن عرض النوافذ المنبثقة الخاصة بالبائع.
 * تشمل هذه النوافذ:
 * - تأكيد المنتجات (الموافقة على الطلب).
 * - عرض المنتجات المرفوضة.
 * - عرض معلومات الشحن.
 */

import {
    saveStepState,
    loadStepState,
} from "./stateManagement.js";
import { determineCurrentStepId } from "./roleAndStepDetermination.js";
import {
    updateCurrentStepFromState,
    createStepStatusFooter,
} from "./uiUpdates.js";
import { addStatusToggleListener } from "./popupHelpers.js";

/**
 * @function showSellerConfirmationProductsAlert
 * @description تعرض نافذة للبائع لتأكيد توفر المنتجات التي طلبها المشتري.
 * هذه هي الخطوة الثانية (Confirmed Step).
 * 
 * المنطق يشمل:
 * 1. عرض فقط المنتجات التي تخص هذا البائع والتي قام المشتري باختيارها.
 * 2. السماح للبائع بإلغاء تحديد المنتجات (رفضها) إذا لم تكن متوفرة.
 * 3. حفظ حالة التأكيد (المقبول والمرفوض).
 * 
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showSellerConfirmationProductsAlert(data, ordersData) {
    try {
        const sellerId = data.currentUser.idUser;

        // تجميع منتجات البائع مع معلومات التوصيل
        const sellerOwnedProducts = ordersData.flatMap((order) =>
            order.order_items
                .filter((item) => item.seller_key === sellerId)
                .map((item) => {
                    const deliveryKey = item.supplier_delivery?.delivery_key;
                    let deliveryKeyDisplay = "N/A";
                    
                    if (deliveryKey) {
                        if (Array.isArray(deliveryKey)) {
                            deliveryKeyDisplay = deliveryKey.join(", ");
                        } else {
                            deliveryKeyDisplay = deliveryKey;
                        }
                    }
                    
                    return {
                        product_key: item.product_key,
                        delivery_key: deliveryKeyDisplay,
                    };
                })
        );

        // إزالة التكرار
        const uniqueSellerProducts = Array.from(
            new Map(sellerOwnedProducts.map((p) => [p.product_key, p])).values()
        );

        // الحصول على اختيارات المشتري
        const buyerReviewState = loadStepState("step-review");
        // إذا لم يكن هناك حالة مراجعة (لم يقم المشتري بالحفظ)، نعتبر أن جميع المنتجات مقبولة مبدئياً
        const buyerSelectedKeys = buyerReviewState
            ? buyerReviewState.selectedKeys
            : null;

        const sellerConfirmedState = loadStepState("step-confirmed");
        const previouslySellerSelectedKeys = sellerConfirmedState
            ? sellerConfirmedState.selectedKeys
            : null;

        // التحقق مما إذا كانت مرحلة التأكيد مفعلة بالفعل (تم الانتقال لما بعدها)
        const currentStepState = loadStepState("current_step");
        const isConfirmedActivated = currentStepState && parseInt(currentStepState.stepNo) >= 2;

        // تصفية المنتجات لعرض فقط ما طلبه المشتري
        const displayableProducts = uniqueSellerProducts.filter((p) =>
            buyerSelectedKeys === null || buyerSelectedKeys.includes(p.product_key)
        );

        let checkboxes = displayableProducts
            .map((product) => {
                const isChecked =
                    previouslySellerSelectedKeys !== null
                        ? previouslySellerSelectedKeys.includes(product.product_key)
                        : true;

                return `<div class="checkbox-item" id="seller-confirmation-item-${product.product_key
                    }">
                          <input type="checkbox" id="seller-confirmation-checkbox-${product.product_key
                    }" name="sellerProductKeys" value="${product.product_key
                    }" ${isChecked ? "checked" : ""} ${isConfirmedActivated ? "disabled" : ""}>
                          <label for="seller-confirmation-checkbox-${product.product_key
                    }">${product.product_key} (توصيل: ${product.delivery_key
                    })</label>
                      </div>`;
            })
            .join("");

        if (checkboxes === "") {
            checkboxes =
                "<p>لا توجد منتجات مشتركة مع اختيارات المشتري لتأكيدها.</p>";
        }

        const currentStep = determineCurrentStepId(data);

        Swal.fire({
            title: "تأكيد المنتجات (بائع):",
            html: `<div id="seller-confirmation-container" style="display: flex; flex-direction: column; align-items: start;">${checkboxes}</div>`,
            footer: isConfirmedActivated 
                ? "لا يمكن تعديل الاختيارات لأن المرحلة مفعلة بالفعل."
                : createStepStatusFooter("step-confirmed", currentStep),
            cancelButtonText: "إغلاق",
            showConfirmButton: false,
            showCancelButton: true,
            focusConfirm: false,
            allowOutsideClick: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                if (
                    checkboxes !==
                    "<p>لا توجد منتجات مشتركة مع اختيارات المشتري لتأكيدها.</p>" &&
                    !isConfirmedActivated
                ) {
                    addStatusToggleListener(data);
                    const container = document.getElementById(
                        "seller-confirmation-container"
                    );
                    container.addEventListener("change", (e) => {
                        if (e.target.name === "sellerProductKeys") {
                            const sellerSelectedKeys = Array.from(
                                container.querySelectorAll(
                                    'input[name="sellerProductKeys"]:checked'
                                )
                            ).map((cb) => cb.value);
                            
                            // المنتجات غير المحددة تعتبر مرفوضة
                            const sellerDeselectedKeys = displayableProducts
                                .map((p) => p.product_key)
                                .filter((key) => !sellerSelectedKeys.includes(key));
                                
                            saveStepState("step-confirmed", {
                                selectedKeys: sellerSelectedKeys,
                                deselectedKeys: sellerDeselectedKeys,
                            });
                            console.log("Auto-saved seller confirmation state:", {
                                selectedKeys: sellerSelectedKeys,
                                deselectedKeys: sellerDeselectedKeys,
                            });
                            updateCurrentStepFromState(data);
                        }
                    });
                }
            },
        });
    } catch (sellerConfirmAlertError) {
        console.error(
            "Error in showSellerConfirmationProductsAlert:",
            sellerConfirmAlertError
        );
    }
}

/**
 * @function showSellerRejectedProductsAlert
 * @description تعرض نافذة بالمنتجات التي قام البائع برفضها (إلغاء تحديدها) في مرحلة التأكيد.
 * تظهر عند النقر على خطوة "مرفوض".
 * 
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showSellerRejectedProductsAlert(data, ordersData) {
    try {
        const sellerConfirmedState = loadStepState("step-confirmed");
        const sellerDeselectedKeys = sellerConfirmedState
            ? sellerConfirmedState.deselectedKeys
            : [];

        let contentHtml;
        if (sellerDeselectedKeys && sellerDeselectedKeys.length > 0) {
            const itemsHtml = sellerDeselectedKeys
                .map((key) => `<li id="rejected-item-${key}">${key}</li>`)
                .join("");
            contentHtml = `<p>المنتجات التي تم رفضها من قبل البائع:</p><ul id="rejected-products-list" style="text-align: right; margin-top: 1rem; padding-right: 2rem;">${itemsHtml}</ul>`;
        } else {
            contentHtml =
                '<p id="no-rejected-items-message">لم يقم البائع بإلغاء  أي منتجات</p>';
        }

        Swal.fire({
            title: "المنتجات المرفوضة من البائع",
            html: contentHtml,
            icon:
                sellerDeselectedKeys && sellerDeselectedKeys.length > 0
                    ? "info"
                    : "success",
            confirmButtonText: "حسنًا",
            customClass: { popup: "fullscreen-swal" },
        });
    } catch (rejectedAlertError) {
        console.error(
            "Error in showSellerRejectedProductsAlert:",
            rejectedAlertError
        );
    }
}

/**
 * @function showShippingInfoAlert
 * @description تعرض نافذة بالمنتجات التي تم شحنها.
 * تظهر هذه النافذة في خطوة "شُحن".
 * تعرض فقط المنتجات التي تم تأكيدها من قبل البائع.
 * 
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showShippingInfoAlert(data, ordersData) {
    try {
        const sellerConfirmedState = loadStepState("step-confirmed");
        let confirmedKeys;

        if (sellerConfirmedState) {
            confirmedKeys = sellerConfirmedState.selectedKeys;
        } else {
            // إذا لم يكن هناك حالة محفوظة، نفترض أن جميع المنتجات المتاحة هي مؤكدة
            const userId = data.currentUser.idUser;
            const userType = data.currentUser.type;
            
            let userOwnedProducts;
            
            if (userType === "seller") {
                userOwnedProducts = ordersData.flatMap((order) =>
                    order.order_items
                        .filter((item) => item.seller_key === userId)
                        .map((item) => item.product_key)
                );
            } else if (userType === "courier") {
                userOwnedProducts = ordersData.flatMap((order) =>
                    order.order_items
                        .filter((item) => {
                            const deliveryKey = item.supplier_delivery?.delivery_key;
                            if (!deliveryKey) return false;
                            if (Array.isArray(deliveryKey)) {
                                return deliveryKey.includes(userId);
                            } else {
                                return deliveryKey === userId;
                            }
                        })
                        .map((item) => item.product_key)
                );
            } else {
                userOwnedProducts = [];
            }
            
             // إزالة التكرار
            const uniqueUserProducts = [...new Set(userOwnedProducts)];

            const buyerReviewState = loadStepState("step-review");
            const buyerSelectedKeys = buyerReviewState
                ? buyerReviewState.selectedKeys
                : null;

            confirmedKeys = uniqueUserProducts.filter((key) =>
                buyerSelectedKeys === null || buyerSelectedKeys.includes(key)
            );
        }

        if (confirmedKeys.length === 0) {
            Swal.fire({
                title: "لا توجد منتجات للشحن",
                text: "يجب تأكيد المنتجات أولاً قبل الانتقال إلى مرحلة الشحن.",
                icon: "warning",
                confirmButtonText: "حسنًا",
                customClass: { popup: "fullscreen-swal" },
            });
            return;
        }

        const itemsHtml = confirmedKeys
            .map((productKey) => {
                return `<li id="shipped-item-${productKey}" style="text-align: right; margin-bottom: 0.5rem;">${productKey}</li>`;
            })
            .join("");

        const contentHtml = `<div id="shipped-products-container"><p>المنتجات التالية جاهزة للشحن:</p><ul id="shipped-products-list" style="text-align: right; margin-top: 1rem; padding-right: 2rem;">${itemsHtml}</ul></div>`;

        const currentStep = determineCurrentStepId(data);

        Swal.fire({
            title: "المنتجات المشحونة",
            html: contentHtml,
            footer: createStepStatusFooter("step-shipped", currentStep),
            icon: "info",
            confirmButtonText: "إغلاق",
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => addStatusToggleListener(data),
        });
    } catch (shippingAlertError) {
        console.error("Error in showShippingInfoAlert:", shippingAlertError);
    }
}
