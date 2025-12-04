/**
 * @file popups.js
 * @description دوال SweetAlert2 (النوافذ المنبثقة) - Popups Functions.
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

/**
 * @description يضيف معالج أحداث لخانة اختيار الحالة في تذييل النافذة لتأكيد تفعيل المرحلة.
 * @param {object} controlData - بيانات التحكم.
 */
export function addStatusToggleListener(controlData) {
    try {
        const checkbox = document.getElementById("modal-step-status-checkbox");
        if (!checkbox) return;

        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                const checkboxElement = e.target;
                const stepIdToActivate = checkboxElement.dataset.stepId;

                // تطبيق نمط النافذة المنبثقة المخصص
                Swal.fire({
                    title: "تأكيد تفعيل المرحلة",
                    text: "بمجرد تفعيل هذه المرحلة، لا يمكنك التراجع. هل أنت متأكد؟",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "نعم، قم بالتفعيل",
                    cancelButtonText: "إلغاء",
                    customClass: { popup: "fullscreen-swal" }, // النمط المخصص
                }).then((result) => {
                    if (result.isConfirmed) {
                        // إذا أكد المستخدم، قم بتفعيل المرحلة
                        const stepToActivate = controlData.steps.find(
                            (s) => s.id === stepIdToActivate
                        );
                        if (stepToActivate) {
                            saveStepState("current_step", {
                                stepId: stepToActivate.id,
                                stepNo: stepToActivate.no,
                                status: "active",
                            });
                            updateCurrentStepFromState(controlData);
                            Swal.close(); // إغلاق النافذة الأصلية
                        }
                    } else {
                        // إذا ألغى المستخدم، أعد مربع الاختيار إلى حالته السابقة (غير محدد)
                        checkboxElement.checked = false;
                    }
                });
            }
        });
    } catch (listenerError) {
        console.error("Error in addStatusToggleListener:", listenerError);
    }
}

/**
 * @description يعرض نافذة للمشتري لمراجعة المنتجات وتحديدها.
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 * @param {boolean} isModificationLocked - هل التعديل مقفل.
 */
export function showProductKeysAlert(data, ordersData, isModificationLocked) {
    try {
        const currentUserOrders = ordersData.filter(
            (order) => order.user_key === data.currentUser.idUser
        );
        const productKeys = currentUserOrders.flatMap((order) =>
            order.order_items.map((item) => item.product_key)
        );

        const previousState = loadStepState("step-review");
        const previouslySelectedKeys = previousState
            ? previousState.selectedKeys
            : null;

        let checkboxes = productKeys
            .map(
                (productKey) =>
                    `<div class="checkbox-item" id="review-item-${productKey}">
                  <input type="checkbox" id="review-checkbox-${productKey}" name="productKeys" value="${productKey}" ${previouslySelectedKeys === null ||
                        previouslySelectedKeys.includes(productKey)
                        ? "checked"
                        : ""
                    } ${isModificationLocked ? "disabled" : ""}>
                  <label for="review-checkbox-${productKey}">${productKey}</label>
              </div>`
            )
            .join("");

        const currentStep = determineCurrentStepId(data);

        Swal.fire({
            title: isModificationLocked ? "عرض المنتجات" : "اختر المنتجات:",
            html: `<div id="buyer-review-products-container" style="display: flex; flex-direction: column; align-items: start;">${checkboxes}</div>`,
            footer: isModificationLocked
                ? "لا يمكن تعديل الاختيارات لأن الطلب في مرحلة متقدمة."
                : createStepStatusFooter("step-review", currentStep),
            cancelButtonText: "إغلاق",
            focusConfirm: false,
            allowOutsideClick: !isModificationLocked,
            showConfirmButton: false,
            showCancelButton: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                if (!isModificationLocked) {
                    addStatusToggleListener(data);
                    const container = document.getElementById(
                        "buyer-review-products-container"
                    );
                    container.addEventListener("change", (e) => {
                        if (e.target.name === "productKeys") {
                            const selectedKeys = Array.from(
                                container.querySelectorAll(
                                    'input[name="productKeys"]:checked'
                                )
                            ).map((cb) => cb.value);
                            const unselectedKeys = productKeys.filter(
                                (key) => !selectedKeys.includes(key)
                            );
                            saveStepState("step-review", {
                                selectedKeys: selectedKeys,
                                unselectedKeys: unselectedKeys,
                            });
                            console.log("Auto-saved review state:", {
                                selectedKeys,
                                unselectedKeys,
                            });
                            updateCurrentStepFromState(data);
                        }
                    });
                }
            },
        });
    } catch (reviewAlertError) {
        console.error("Error in showProductKeysAlert:", reviewAlertError);
    }
}

/**
 * @description يعرض نافذة بالمنتجات التي لم يتم تحديدها (الملغاة) في خطوة المراجعة.
 * @param {object} data - بيانات التحكم (currentUser).
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showUnselectedProductsAlert(data, ordersData) {
    try {
        const reviewState = loadStepState("step-review");
        const unselectedKeys = reviewState ? reviewState.unselectedKeys : [];

        let contentHtml;
        if (unselectedKeys.length > 0) {
            const itemsHtml = unselectedKeys
                .map((key) => `<li id="cancelled-item-${key}">${key}</li>`)
                .join("");
            contentHtml = `<ul id="cancelled-products-list" style="text-align: right; margin-top: 1rem; padding-right: 2rem;">${itemsHtml}</ul>`;
        } else {
            contentHtml =
                '<p id="no-cancelled-items-message">لم يتم العثور على عناصر غير محددة.</p>';
        }

        Swal.fire({
            title: "المنتجات التي تم الغائها",
            html: contentHtml,
            icon: unselectedKeys.length > 0 ? "info" : "success",
            confirmButtonText: "حسنًا",
            customClass: { popup: "fullscreen-swal" },
        });
    } catch (unselectedAlertError) {
        console.error(
            "Error in showUnselectedProductsAlert:",
            unselectedAlertError
        );
    }
}

/**
 * @description يعرض نافذة SweetAlert للبائع لتأكيد/رفض المنتجات في مرحلة 'مؤكدة'.
 * @param {object} data - بيانات التحكم (currentUser).
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showSellerConfirmationProductsAlert(data, ordersData) {
    try {
        const sellerId = data.currentUser.idUser;

        const sellerOwnedProducts = ordersData.flatMap((order) =>
            order.order_items
                .filter((item) => item.seller_key === sellerId)
                .map((item) => ({
                    product_key: item.product_key,
                    delivery_key: item.supplier_delivery?.delivery_key || "N/A",
                }))
        );

        const uniqueSellerProducts = Array.from(
            new Map(sellerOwnedProducts.map((p) => [p.product_key, p])).values()
        );

        const buyerReviewState = loadStepState("step-review");
        const buyerSelectedKeys = buyerReviewState
            ? buyerReviewState.selectedKeys
            : [];

        const sellerConfirmedState = loadStepState("step-confirmed");
        const previouslySellerSelectedKeys = sellerConfirmedState
            ? sellerConfirmedState.selectedKeys
            : null;

        const displayableProducts = uniqueSellerProducts.filter((p) =>
            buyerSelectedKeys.includes(p.product_key)
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
                    }" ${isChecked ? "checked" : ""}>
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
            footer: createStepStatusFooter("step-confirmed", currentStep),
            cancelButtonText: "إلغاء",
            showConfirmButton: false,
            showCancelButton: true,
            focusConfirm: false,
            allowOutsideClick: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                if (
                    checkboxes !==
                    "<p>لا توجد منتجات مشتركة مع اختيارات المشتري لتأكيدها.</p>"
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
 * @description يعرض نافذة SweetAlert بالمنتجات التي قام البائع بإلغاء تفعيلها في مرحلة 'مؤكدة'.
 * @param {object} data - بيانات التحكم (currentUser).
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
                '<p id="no-rejected-items-message">لم يقم البائع بإلغاء تفعيل أي منتجات في مرحلة التأكيد.</p>';
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
 * @description يعرض نافذة للبائع لإدخال معلومات الشحن للمنتجات المؤكدة.
 * @param {object} data - بيانات التحكم.
 */
export function showShippingInfoAlert(data) {
    try {
        const sellerConfirmedState = loadStepState("step-confirmed");
        const confirmedKeys = sellerConfirmedState
            ? sellerConfirmedState.selectedKeys
            : [];

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
            confirmButtonText: "حسنًا",
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => addStatusToggleListener(data),
        });
    } catch (shippingAlertError) {
        console.error("Error in showShippingInfoAlert:", shippingAlertError);
    }
}

/**
 * @description يعرض نافذة للمشتري لتأكيد استلام المنتجات أو تحديدها للإرجاع.
 * @param {object} data - بيانات التحكم.
 */
export function showDeliveryConfirmationAlert(data) {
    try {
        const sellerConfirmedState = loadStepState("step-confirmed");
        const productsToDeliver = sellerConfirmedState
            ? sellerConfirmedState.selectedKeys
            : [];

        const deliveryState = loadStepState("step-delivered");
        const previouslyDeliveredKeys = deliveryState
            ? deliveryState.deliveredKeys
            : null;

        if (productsToDeliver.length === 0) {
            Swal.fire({
                title: "لا توجد منتجات لتأكيد استلامها",
                text: "يجب أن يؤكد البائع المنتجات أولاً.",
                icon: "info",
                confirmButtonText: "حسنًا",
                customClass: { popup: "fullscreen-swal" },
            });
            return;
        }

        const checkboxesHtml = productsToDeliver
            .map((productKey) => {
                const isChecked =
                    previouslyDeliveredKeys !== null
                        ? previouslyDeliveredKeys.includes(productKey)
                        : true;

                return `<div class="checkbox-item" id="delivery-item-${productKey}">
                          <input type="checkbox" id="delivery-checkbox-${productKey}" name="deliveryProductKeys" value="${productKey}" ${isChecked ? "checked" : ""
                    }>
                          <label for="delivery-checkbox-${productKey}">${productKey}</label>
                      </div>`;
            })
            .join("");

        const currentStep = determineCurrentStepId(data);

        Swal.fire({
            title: "تأكيد استلام المنتجات",
            html: `<div id="delivery-confirmation-container" style="display: flex; flex-direction: column; align-items: start;">${checkboxesHtml}</div>`,
            footer: createStepStatusFooter("step-delivered", currentStep),
            cancelButtonText: "إلغاء",
            showConfirmButton: false,
            showCancelButton: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                if (productsToDeliver.length > 0) {
                    addStatusToggleListener(data);
                    const container = document.getElementById(
                        "delivery-confirmation-container"
                    );
                    container.addEventListener("change", (e) => {
                        if (e.target.name === "deliveryProductKeys") {
                            const deliveredKeys = Array.from(
                                container.querySelectorAll(
                                    'input[name="deliveryProductKeys"]:checked'
                                )
                            ).map((cb) => cb.value);
                            const returnedKeys = productsToDeliver.filter(
                                (key) => !deliveredKeys.includes(key)
                            );
                            saveStepState("step-delivered", {
                                deliveredKeys: deliveredKeys,
                                returnedKeys: returnedKeys,
                            });
                            console.log("Auto-saved delivery state:", {
                                deliveredKeys,
                                returnedKeys,
                            });
                            updateCurrentStepFromState(data);
                        }
                    });
                }
            },
        });
    } catch (deliveryAlertError) {
        console.error(
            "Error in showDeliveryConfirmationAlert:",
            deliveryAlertError
        );
    }
}

/**
 * @description يعرض نافذة بالمنتجات التي تم تحديدها للإرجاع.
 * @param {object} data - بيانات التحكم.
 */
export function showReturnedProductsAlert(data) {
    try {
        const deliveryState = loadStepState("step-delivered");
        const returnedKeys = deliveryState ? deliveryState.returnedKeys : [];

        let contentHtml;

        if (returnedKeys && returnedKeys.length > 0) {
            const itemsHtml = returnedKeys
                .map((key) => `<li id="returned-item-${key}">${key}</li>`)
                .join("");
            contentHtml = `<div id="returned-products-container"><p>المنتجات التالية تم تحديدها للإرجاع:</p><ul id="returned-products-list" style="text-align: right; margin-top: 1rem; padding-right: 2rem;">${itemsHtml}</ul></div>`;
        } else {
            contentHtml =
                '<p id="no-returned-items-message">لم يتم تحديد أي منتجات للإرجاع.</p>';
        }

        Swal.fire({
            title: "المنتجات المرتجعة",
            html: contentHtml,
            icon: returnedKeys && returnedKeys.length > 0 ? "warning" : "success",
            confirmButtonText: "حسنًا",
            customClass: { popup: "fullscreen-swal" },
        });
    } catch (returnedAlertError) {
        console.error("Error in showReturnedProductsAlert:", returnedAlertError);
    }
}
