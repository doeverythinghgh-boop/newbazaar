/**
 * هذا المقطع يمثل نقطة دخول التطبيق (Entry Point)
 * ويقوم بتهيئة جميع الوظائف بعد تحميل محتوى DOM بالكامل.
 */
document.addEventListener("DOMContentLoaded", () => {
  // قائمة معرفات الأدمن الثابتة للمقارنة
  const ADMIN_IDS = ["xx1", "xx2"];

  // ---------------------------------------------------
  // I. دوال جلب البيانات الأساسية (Core Data Fetchers)
  // ---------------------------------------------------

  /**
   * @description يجلب ملف الإعدادات والتحكم.
   * @returns {Promise<Object>} وعد (Promise) بكائن بيانات التحكم.
   */
  function fetchControlData() {
    try {
      // استخدام `no-cache` لضمان الحصول على أحدث البيانات
      return fetch("./control.json", { cache: "no-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error fetching control data: ${response.statusText}`
          );
        }
        return response.json();
      });
    } catch (fetchError) {
      console.error("Error in fetchControlData:", fetchError);
      // رمي الخطأ مرة أخرى ليتم التقاطه في Promise.all
      throw fetchError;
    }
  }

  /**
   * @description يجلب ملف الطلبات.
   * @returns {Promise<Object>} وعد (Promise) بكائن بيانات الطلبات.
   */
  function fetchOrdersData() {
    try {
      // استخدام `no-cache` لضمان الحصول على أحدث البيانات
      return fetch("./orders_.json", { cache: "no-cache" }).then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching orders data: ${response.statusText}`);
        }
        return response.json();
      });
    } catch (fetchError) {
      console.error("Error in fetchOrdersData:", fetchError);
      // رمي الخطأ مرة أخرى ليتم التقاطه في Promise.all
      throw fetchError;
    }
  }

  // ---------------------------------------------------
  // II. دوال إدارة حالة LocalStorage (State Management)
  // ---------------------------------------------------

  /**
   * @description يحفظ حالة خطوة معينة في LocalStorage.
   * @param {string} stepId - معرف الخطوة (مثل 'step-review').
   * @param {object} state - الكائن الذي سيتم حفظه.
   */
  function saveStepState(stepId, state) {
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
  function loadStepState(stepId) {
    try {
      const state = localStorage.getItem(`${stepId}_state`);
      return state ? JSON.parse(state) : null;
    } catch (loadError) {
      console.error("Failed to load state from LocalStorage:", loadError);
      return null;
    }
  }

  // ---------------------------------------------------
  // III. دوال تحديد الدور والحالة (Role and State Determination)
  // ---------------------------------------------------

  /**
   * @description يحدد نوع المستخدم بناءً على القواعد المحددة.
   * @param {string} userId - معرف المستخدم الحالي.
   * @param {Array<Object>} ordersData - بيانات الطلبات.
   * @param {Object} controlData - بيانات التحكم (لم تستخدم هنا لكن تم الحفاظ على التوقيع).
   * @returns {string|null} - نوع المستخدم أو null إذا لم يتم العثور عليه.
   */
  function determineUserType(userId, ordersData, controlData) {
    try {
      // 1. التحقق مما إذا كان المستخدم هو admin
      if (ADMIN_IDS.includes(userId)) {
        return "admin";
      }

      // 2. البحث في الطلبات لتحديد الأدوار الأخرى
      let isBuyer = false;
      let isSeller = false;
      let isCourier = false;

      for (const order of ordersData) {
        if (order.user_key === userId) isBuyer = true;
        for (const item of order.order_items) {
          if (item.seller_key === userId) isSeller = true;
          // التحقق الآمن من وجود supplier_delivery ثم delivery_key
          if (
            item.supplier_delivery &&
            item.supplier_delivery.delivery_key === userId
          )
            isCourier = true;
        }
      }

      // 3. معالجة تضارب الأدوار
      if (isBuyer && isSeller) {
        console.error(
          "Fatal Error: Query unacceptable. User cannot be both 'seller' and 'buyer'. Please review data."
        );
        return null;
      }

      // 4. إرجاع الدور بناءً على الأولوية
      if (isSeller) return "seller";
      if (isBuyer) return "buyer";
      if (isCourier) return "courier";

      // 5. في حالة عدم تطابق أي دور
      console.error(
        `Fatal Error: No role found for user ID '${userId}'. Stopping execution.`
      );
      return null;
    } catch (roleError) {
      console.error("Error in determineUserType:", roleError);
      return null;
    }
  }

  /**
   * @description يحدد الخطوة الحالية بناءً على البيانات المحفوظة في LocalStorage.
   * @param {Object} controlData - بيانات التحكم.
   * @returns {{stepId: string, stepNo: string}} - معرف الخطوة الحالية ورقمها.
   */
  function determineCurrentStepId(controlData) {
    try {
      // 1. حاول تحميل الخطوة الحالية مباشرة من localStorage
      const savedCurrentStep = loadStepState("current_step");
      if (savedCurrentStep && savedCurrentStep.stepId) {
        return savedCurrentStep;
      }

      // دالة مساعدة للحصول على رقم الخطوة بأمان
      const getStepNo = (id, defaultNo) =>
        controlData.steps.find((s) => s.id === id)?.no || defaultNo;

      // 2. إذا لم تكن محفوظة، قم بتحديدها بناءً على حالات الخطوات الأخرى (منطق احتياطي)
      const deliveredState = loadStepState("step-delivered");
      const confirmedState = loadStepState("step-confirmed");
      const reviewState = loadStepState("step-review");

      // ترتيب الأولوية من الأحدث للأقدم
      if (deliveredState) {
        return {
          stepId: "step-delivered",
          stepNo: getStepNo("step-delivered", "4"),
          status: "active",
        };
      }
      if (confirmedState) {
        return {
          stepId: "step-shipped",
          stepNo: getStepNo("step-shipped", "3"),
          status: "active",
        };
      }
      if (reviewState) {
        return {
          stepId: "step-confirmed",
          stepNo: getStepNo("step-confirmed", "2"),
          status: "active",
        };
      }

      // 3. الحالة الافتراضية عند عدم وجود أي بيانات محفوظة على الإطلاق
      return {
        stepId: "step-review",
        stepNo: getStepNo("step-review", "1"),
        status: "active",
      };
    } catch (stepError) {
      console.error("Error in determineCurrentStepId:", stepError);
      // إرجاع الافتراضي في حالة الفشل
      return {
        stepId: "step-review",
        stepNo:
          controlData.steps.find((s) => s.id === "step-review")?.no || "1",
        status: "active",
      };
    }
  }

  /**
   * @description التحقق مما إذا كانت الخطوة مسموحة للمستخدم الحالي.
   * @param {string} stepId - معرف الخطوة المراد التحقق منها.
   * @param {object} data - بيانات التحكم التي تحتوي على صلاحيات المستخدم.
   * @returns {boolean} - هل الخطوة مسموحة أم لا.
   */
  function isStepAllowedForCurrentUser(stepId, data) {
    try {
      const currentUserType = data.currentUser.type;
      const userPermissions = data.users.find(
        (user) => user.type === currentUserType
      );

      if (userPermissions && userPermissions.allowedSteps) {
        return userPermissions.allowedSteps.includes(stepId);
      }
      return false;
    } catch (permissionError) {
      console.error("Error in isStepAllowedForCurrentUser:", permissionError);
      return false;
    }
  }

  // ---------------------------------------------------
  // IV. دوال تحديث الواجهة والتحقق (UI Update and Validation)
  // ---------------------------------------------------

  // متغير لتخزين مؤقت الرسالة (لإدارة التكرار)
  let messageTimeout;

  /**
   * @description يعرض رسالة تنبيه عند محاولة الوصول لخطوة غير مصرح بها.
   */
  function showUnauthorizedAlert() {
    try {
      const messageElement = document.getElementById(
        "permission-denied-message"
      );
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
  function animateStep(circle) {
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
  function highlightCurrentStep(stepId) {
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
  function updateCurrentStepFromState(controlData) {
    try {
      const currentStep = determineCurrentStepId(controlData);
      highlightCurrentStep(currentStep.stepId);
      // حفظ الخطوة الحالية المحددة في localStorage لضمان استمراريتها
      saveStepState("current_step", currentStep);
    } catch (updateError) {
      console.error("Error in updateCurrentStepFromState:", updateError);
    }
  }

  // ---------------------------------------------------
  // V. دوال SweetAlert2 (النوافذ المنبثقة) - Popups Functions
  // ---------------------------------------------------

  /**
   * @description ينشئ محتوى التذييل الذي يعرض حالة الخطوة الحالية.
   * @param {string} stepId - معرف الخطوة الخاصة بالنافذة.
   * @param {object} currentStep - كائن الخطوة الحالية.
   * @returns {string} - كود HTML للتذييل.
   */
  function createStepStatusFooter(stepId, currentStep) {
    try {
      const isActive = stepId === currentStep.stepId;
      const disabled = isActive ? "disabled" : ""; // تعطيل مربع الاختيار إذا كانت الخطوة نشطة بالفعل

      return `
                <div id="modal-step-status-container" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <input type="checkbox" id="modal-step-status-checkbox" ${
                      isActive ? "checked" : ""
                    } ${disabled} data-step-id="${stepId}">
                    <label for="modal-step-status-checkbox" style="font-weight: bold; cursor: pointer;">تفعيل المرحله</label>
                </div>
            `;
    } catch (footerError) {
      console.error("Error in createStepStatusFooter:", footerError);
      return "";
    }
  }

  /**
   * @description يضيف معالج أحداث لخانة اختيار الحالة في تذييل النافذة لتأكيد تفعيل المرحلة.
   * @param {object} controlData - بيانات التحكم.
   */
  function addStatusToggleListener(controlData) {
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
  function showProductKeysAlert(data, ordersData, isModificationLocked) {
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
                    <input type="checkbox" id="review-checkbox-${productKey}" name="productKeys" value="${productKey}" ${
              previouslySelectedKeys === null ||
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
  function showUnselectedProductsAlert(data, ordersData) {
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
  function showSellerConfirmationProductsAlert(data, ordersData) {
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

          return `<div class="checkbox-item" id="seller-confirmation-item-${
            product.product_key
          }">
                            <input type="checkbox" id="seller-confirmation-checkbox-${
                              product.product_key
                            }" name="sellerProductKeys" value="${
            product.product_key
          }" ${isChecked ? "checked" : ""}>
                            <label for="seller-confirmation-checkbox-${
                              product.product_key
                            }">${product.product_key} (توصيل: ${
            product.delivery_key
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
  function showSellerRejectedProductsAlert(data, ordersData) {
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
  function showShippingInfoAlert(data) {
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
  function showDeliveryConfirmationAlert(data) {
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
                            <input type="checkbox" id="delivery-checkbox-${productKey}" name="deliveryProductKeys" value="${productKey}" ${
            isChecked ? "checked" : ""
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
  function showReturnedProductsAlert(data) {
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

  // ---------------------------------------------------
  // VI. دالة إضافة معالجات النقر على الخطوات (Step Click Handler)
  // ---------------------------------------------------

  /**
   * @description يضيف معالج النقر لكل عنصر خطوة لتنفيذ الإجراءات المناسبة.
   * @param {object} data - بيانات التحكم.
   * @param {Array<object>} ordersData - بيانات الطلبات.
   * @param {boolean} isBuyerReviewModificationLocked - حالة قفل التعديل على المراجعة.
   */
  function addStepClickListeners(
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

  // ---------------------------------------------------
  // VII. نقطة البداية (تنفيذ جلب البيانات وبدء التطبيق) - Initialization
  // ---------------------------------------------------

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
