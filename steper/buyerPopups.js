/**
 * @file buyerPopups.js
 * @description نوافذ المشتري المنبثقة (Buyer Popups).
 * يحتوي هذا الملف على جميع الدوال المسؤولة عن عرض النوافذ المنبثقة (Modals) الخاصة بالمشتري.
 * تشمل هذه النوافذ:
 * - مراجعة المنتجات واختيارها.
 * - عرض المنتجات الملغاة.
 * - تأكيد استلام المنتجات.
 * - عرض المنتجات المرتجعة.
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
 * @function showProductKeysAlert
 * @description تعرض نافذة للمشتري لمراجعة المنتجات وتحديد ما يريد طلبه منها.
 * هذه هي الخطوة الأولى في العملية (Review Step).
 * 
 * المنطق يشمل:
 * 1. تصفية المنتجات بناءً على نوع المستخدم (المشتري يرى منتجاته، البائع يرى منتجاته، إلخ).
 * 2. التحقق من حالة القفل (إذا تم شحن الطلب، لا يمكن تعديل المراجعة).
 * 3. إنشاء مربعات اختيار (Checkboxes) لكل منتج.
 * 4. التعامل مع تغييرات الاختيار (إلغاء منتج يتطلب تأكيداً).
 * 
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 * @param {boolean} isModificationLocked - هل التعديل مقفل (مثلاً لأن المرحلة تجاوزت المراجعة).
 */
export function showProductKeysAlert(data, ordersData, isModificationLocked) {
    try {
        const userId = data.currentUser.idUser;
        const userType = data.currentUser.type;
        
        // 1. تحديد المنتجات التي يجب عرضها حسب نوع المستخدم
        let productKeys;
        
        if (userType === "buyer") {
            // المشتري يرى جميع منتجاته في جميع الطلبات
            const currentUserOrders = ordersData.filter(
                (order) => order.user_key === userId
            );
            productKeys = currentUserOrders.flatMap((order) =>
                order.order_items.map((item) => item.product_key)
            );
        } else if (userType === "seller") {
            // البائع يرى فقط المنتجات التي يبيعها هو
            productKeys = ordersData.flatMap((order) =>
                order.order_items
                    .filter((item) => item.seller_key === userId)
                    .map((item) => item.product_key)
            );
        } else if (userType === "courier") {
            // الساعي يرى فقط المنتجات الموكلة إليه للتوصيل
            productKeys = ordersData.flatMap((order) =>
                order.order_items
                    .filter((item) => {
                        const deliveryKey = item.supplier_delivery?.delivery_key;
                        if (!deliveryKey) return false;
                        
                        // دعم delivery_key كـ string أو array
                        if (Array.isArray(deliveryKey)) {
                            return deliveryKey.includes(userId);
                        } else {
                            return deliveryKey === userId;
                        }
                    })
                    .map((item) => item.product_key)
            );
        } else {
            productKeys = [];
        }

        // استرجاع الحالة السابقة (إذا كان قد تم الاختيار من قبل)
        const previousState = loadStepState("step-review");
        const previouslySelectedKeys = previousState
            ? previousState.selectedKeys
            : null;

        // التحقق مما إذا كانت مرحلة الشحن مفعلة بالفعل (قفل التعديل)
        const currentStepState = loadStepState("current_step");
        const isShippedActivated = currentStepState && parseInt(currentStepState.stepNo) >= 3;
        
        // تحديد ما إذا كانت الواجهة مقفلة (للعرض فقط)
        // تقفل إذا: تم تمرير قفل صريح، أو تم الشحن، أو المستخدم ليس مشترياً (لأن المشتري فقط هو من يراجع ويقرر)
        const isLocked = isModificationLocked || isShippedActivated || userType !== "buyer";

        // إنشاء HTML لمربعات الاختيار
        let checkboxes = productKeys
            .map(
                (productKey) =>
                    `<div class="checkbox-item" id="review-item-${productKey}">
                  <input type="checkbox" id="review-checkbox-${productKey}" name="productKeys" value="${productKey}" ${previouslySelectedKeys === null ||
                        previouslySelectedKeys.includes(productKey)
                        ? "checked" // افتراضياً الكل محدد إذا لم يكن هناك حالة سابقة
                        : ""
                    } ${isLocked ? "disabled" : ""}>
                  <label for="review-checkbox-${productKey}">${productKey}</label>
              </div>`
            )
            .join("");

        const currentStep = determineCurrentStepId(data);

        // عرض النافذة باستخدام SweetAlert2
        Swal.fire({
            title: isLocked ? "عرض المنتجات" : "اختر المنتجات:",
            html: `<div id="buyer-review-products-container" style="display: flex; flex-direction: column; align-items: start;">${checkboxes}</div>`,
            // التذييل يختلف حسب حالة القفل
            footer: isLocked
                ? (userType !== "buyer" 
                    ? "عرض فقط - لا يمكن التعديل إلا من قبل المشتري."
                    : "لا يمكن تعديل الاختيارات لأن الطلب في مرحلة متقدمة.")
                : createStepStatusFooter("step-review", currentStep),
            cancelButtonText: "إغلاق",
            focusConfirm: false,
            allowOutsideClick: !isLocked,
            showConfirmButton: false,
            showCancelButton: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                // إضافة المستمعين فقط إذا كانت النافذة قابلة للتعديل
                if (!isLocked) {
                    addStatusToggleListener(data); // لتفعيل المرحلة
                    
                    // الاستماع لتغييرات اختيار المنتجات
                    const container = document.getElementById(
                        "buyer-review-products-container"
                    );
                    container.addEventListener("change", (e) => {
                        if (e.target.name === "productKeys") {
                            const checkbox = e.target;
                            const wasChecked = previouslySelectedKeys === null || previouslySelectedKeys.includes(checkbox.value);
                            
                            // إذا تم إلغاء تحديد منتج (من checked إلى unchecked)
                            if (wasChecked && !checkbox.checked) {
                                // عرض رسالة تأكيد إضافية لمنع الإلغاء بالخطأ
                                Swal.fire({
                                    title: "تأكيد الإلغاء",
                                    text: "هل أنت متأكد من إلغاء هذا المنتج؟",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#d33",
                                    cancelButtonColor: "#3085d6",
                                    confirmButtonText: "نعم، قم بالإلغاء",
                                    cancelButtonText: "تراجع",
                                    customClass: { popup: "fullscreen-swal" },
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        // المستخدم أكد الإلغاء، احفظ الحالة الجديدة
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
                                    } else {
                                        // المستخدم ألغى، أعد الـ checkbox إلى checked
                                        checkbox.checked = true;
                                    }
                                });
                            } else {
                                // تم تحديد منتج (من unchecked إلى checked)، احفظ مباشرة
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
 * @function showUnselectedProductsAlert
 * @description تعرض نافذة بالمنتجات التي قام المشتري بإلغائها (عدم تحديدها) في خطوة المراجعة.
 * تظهر هذه النافذة عند النقر على خطوة "ملغي".
 * 
 * @param {object} data - بيانات التحكم.
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
                '<p id="no-cancelled-items-message">المشتري لم يلغي طلب اي من المنتجات.</p>';
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
 * @function showDeliveryConfirmationAlert
 * @description تعرض نافذة للمشتري لتأكيد استلام المنتجات.
 * تظهر فقط المنتجات التي تم تأكيدها من قبل البائع.
 * 
 * @param {object} data - بيانات التحكم.
 * @param {Array<object>} ordersData - بيانات الطلبات.
 */
export function showDeliveryConfirmationAlert(data, ordersData) {
    try {
        const sellerConfirmedState = loadStepState("step-confirmed");
        let productsToDeliver;

        if (sellerConfirmedState) {
            // نأخذ فقط المنتجات التي وافق عليها البائع
            productsToDeliver = sellerConfirmedState.selectedKeys;
        } else {
             // منطق احتياطي: إذا لم يكن هناك حالة تأكيد، نفترض أن كل ما طلبه المشتري جاهز
             const userId = data.currentUser.idUser;
             const userType = data.currentUser.type;
             
             let allProductKeys;
             
             if (userType === "buyer") {
                 allProductKeys = ordersData.flatMap(order => order.order_items.map(item => item.product_key));
             } else if (userType === "courier") {
                 allProductKeys = ordersData.flatMap(order => 
                     order.order_items
                         .filter(item => {
                             const deliveryKey = item.supplier_delivery?.delivery_key;
                             if (!deliveryKey) return false;
                             if (Array.isArray(deliveryKey)) {
                                 return deliveryKey.includes(userId);
                             } else {
                                 return deliveryKey === userId;
                             }
                         })
                         .map(item => item.product_key)
                 );
             } else {
                 allProductKeys = [];
             }
             
             const uniqueAllProducts = [...new Set(allProductKeys)];

             // فلترة حسب اختيار المشتري (إذا وجد)
             const buyerReviewState = loadStepState("step-review");
             const buyerSelectedKeys = buyerReviewState
                ? buyerReviewState.selectedKeys
                : null;
            
             productsToDeliver = uniqueAllProducts.filter(key => 
                buyerSelectedKeys === null || buyerSelectedKeys.includes(key)
             );
        }

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
                            
                            // المنتجات التي لم يتم تحديدها تعتبر مرتجعة
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
 * @function showReturnedProductsAlert
 * @description تعرض نافذة بالمنتجات التي تم إرجاعها (لم يتم استلامها في خطوة التسليم).
 * 
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
