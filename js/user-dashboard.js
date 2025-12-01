/**
 * @description إعداد منطق النافذة المنبثقة (Modal) بشكل معياري.
 * @file js/user-dashboard.js - هذا الجزء من الكود خاص بصفحة لوحة تحكم المستخدم.
 *   تنشئ وتدير دورة حياة نافذة منبثقة، وتتولى إظهار وإخفاء النافذة،
 *   وإضافة وإزالة فئة `modal-open` من الجسم، وربط أحداث الإغلاق
 *   (زر الإغلاق والنقر على الخلفية).
 * @function setupModalLogic
 * @param {string} modalId - معرف (ID) حاوية النافذة المنبثقة.
 * @param {string} closeBtnId - معرف (ID) زر الإغلاق داخل النافذة.
 * @param {object} [options={}] - خيارات إضافية.
 * @param {function(): void} [options.onClose] - دالة رد اتصال اختيارية يتم استدعاؤها عند إغلاق النافذة.
 * @returns {{open: function(): void, close: function(): void, modalElement: HTMLElement}|null} - كائن يحتوي على دوال الفتح والإغلاق وعنصر النافذة، أو `null` إذا لم يتم العثور على عنصر النافذة.
 */
function setupModalLogic(modalId, closeBtnId, options = {}) {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) {
    console.error(
      `[Modal Logic] لم يتم العثور على عنصر النافذة بالمعرف: ${modalId}`
    );
    return null;
  }

  // دالة لإغلاق النافذة المنبثقة
  const close = () => {
    modalElement.style.display = "none";
    document.body.classList.remove("modal-open");
    // استدعاء دالة رد النداء (callback) عند الإغلاق إذا تم توفيرها
    if (typeof options.onClose === "function") {
      options.onClose();
    }
  };

  // دالة لفتح النافذة المنبثقة
  const open = () => {
    modalElement.style.display = "block";
    document.body.classList.add("modal-open");

    // ✅ إصلاح: ربط حدث الإغلاق بالزر والخلفية بشكل صحيح
    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) closeBtn.onclick = close;

    // ربط حدث النقر على النافذة نفسها (الخلفية)
    // يتم الإغلاق فقط إذا كان النقر على الخلفية الرمادية مباشرة وليس على المحتوى الداخلي
    modalElement.onclick = (event) => {
      if (event.target === modalElement) close();
    };
  };

  // إرجاع كائن يحتوي على دوال التحكم في النافذة
  return { open, close, modalElement };
}
/**
 * @file js/user-dashboard.js
 * @description يحتوي هذا الملف على المنطق البرمجي الخاص بصفحة لوحة تحكم المستخدم (`user-dashboard.html`).
 * يتولى عرض الأزرار والإجراءات المناسبة بناءً على دور المستخدم.
 */

/**
 * @description تحديث واجهة المستخدم لتعكس حالة تسجيل الدخول،
 *   وتخصيص الأزرار والإجراءات المتاحة بناءً على دور المستخدم (ضيف، عميل، بائع، مسؤول).
 *   مع تخصيص الأزرار والإجراءات بناءً على دور المستخدم (ضيف، عميل، بائع، مسؤول).
 * @function updateViewForLoggedInUser
 * @param {object|null} user - كائن المستخدم المسجل دخوله. يمكن أن يكون `null` إذا لم يتم العثور على مستخدم.
 * @param {string} userSession.username - اسم المستخدم.
 * @param {boolean} [userSession.is_guest] - علامة تشير إلى ما إذا كان المستخدم ضيفًا.
 * @param {number} [userSession.is_seller] - دور المستخدم (1: بائع، 2: توصيل).
 * @param {string} [userSession.phone] - رقم هاتف المستخدم.
 * @requires module:js/config - للوصول إلى `adminPhoneNumbers`.
 * @requires module:js/auth - لاستخدام دالة `logout`.
 * @requires module:js/messaging-system - لاستخدام `requestNavigation`.
 */
function updateViewForLoggedInUser() {
  // التحقق مما إذا كان هناك مستخدم مسجل. إذا لم يكن كذلك، يتم توجيهه إلى صفحة تسجيل الدخول.
  if (!userSession) {
    // إذا لم يتم العثور على المستخدم، ربما تم الوصول إلى الصفحة مباشرة

    return;
  }

  // عرض رسالة ترحيب مخصصة باسم المستخدم
  document.getElementById(
    "dash-welcome-message"
  ).textContent = `أهلاً بك، ${userSession.username}`;

  // --- منطق العرض للمستخدم الضيف ---
  if (userSession.is_guest) {
    [
      // ✅ تعديل: تحديث المعرفات لتبدأ بـ "dash-"
      "dash-edit-profile-btn",
      "dash-admin-panel-btn",
      "dash-add-product-btn",
      "dash-view-my-products-btn",
      "dash-view-sales-movement-btn",
    ].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = "none"; // إخفاء الزر إذا كان موجودًا
    });
    // ربط زر تسجيل الخروج بالدالة الخاصة به
    document
      .getElementById("dash-logout-btn-alt")
      .addEventListener("click", () => {
        console.log("تم النقر على زر تسجيل الخروج.1");
        if (typeof logout === "function") logout();
      });
  } else {
    // --- منطق العرض للمستخدم المسجل (غير الضيف) ---

    // --- أزرار البائعين ---
    // التحقق مما إذا كان المستخدم بائعًا أو مسؤولاً لعرض أزرار إدارة المنتجات
    // تحقق إذا كان بائعًا أو مسؤولاً
    if (
      userSession.is_seller === 1 ||
      (typeof adminPhoneNumbers !== "undefined" &&
        adminPhoneNumbers.includes(userSession.phone))
    ) {
      // لا حاجة لإجراء هنا، الأزرار ظاهرة بشكل افتراضي
    } else {
      // إذا لم يكن بائعًا أو مسؤولاً، يتم إخفاء أزرار إضافة وعرض المنتجات
      document.getElementById("dash-add-product-btn").style.display = "none";
      document.getElementById("dash-view-my-products-btn").style.display =
        "none";
    }

    // --- زر لوحة تحكم المسؤول ---
    // تحقق إذا كان مسؤولاً
    if (
      typeof adminPhoneNumbers !== "undefined" &&
      adminPhoneNumbers.includes(userSession.phone)
    ) {
      // لا حاجة لإجراء هنا، زر المسؤول ظاهر
    } else {
      // إخفاء زر لوحة التحكم إذا لم يكن المستخدم مسؤولاً
      const adminBtn = document.getElementById("dash-admin-panel-btn");
      if (adminBtn) adminBtn.style.display = "none";
    }

    // --- زر عرض التقارير ---
    // تحقق إذا كان مؤهلاً للتقارير
    // (البائعون، موظفو التوصيل، والمسؤولون يمكنهم رؤية التقارير)
    if (
      userSession.is_seller === 1 ||
      userSession.is_seller === 2 ||
      (typeof adminPhoneNumbers !== "undefined" &&
        adminPhoneNumbers.includes(userSession.phone))
    ) {
      // لا حاجة لإجراء هنا، زر التقارير ظاهر
    } else {
      // إخفاء زر التقارير لباقي المستخدمين
      document.getElementById("dash-view-sales-movement-btn").style.display =
        "none";
    }
    // --- ربط الأحداث بالأزرار ---

    // 1. إعداد زر تسجيل الخروج
    document
      .getElementById("dash-logout-btn-alt")
      .addEventListener("click", () => {
        console.log("تم النقر على زر تسجيل الخروج.2");

        logout();
      });

    // 2. إعداد زر تعديل الملف الشخصي
    // عند النقر عليه، يتم طلب الانتقال إلى صفحة تعديل الملف الشخصي مع تمرير بيانات المستخدم
    document
      .getElementById("dash-edit-profile-btn")

      .addEventListener("click", () =>
        mainLoader(
          "pages/profile-modal.html",
          "index-user-container",
          0,
          undefined,
          "showHomeIcon",
          true
        )
      );

    // ✅ جديد: إعداد زر إضافة منتج
    const addProductBtn = document.getElementById("dash-add-product-btn");
    if (addProductBtn) {
      addProductBtn.addEventListener("click", showAddProductModal);
    }

    // ✅ جديد: إعداد زر عرض منتجاتي
    const viewMyProductsBtn = document.getElementById(
      "dash-view-my-products-btn"
    );
    if (viewMyProductsBtn) {
      viewMyProductsBtn.addEventListener("click", async () => {
        console.log(myProducts);
        mainLoader(
          "pages/product2Me.html",
          "index-product-container",
          0,
          undefined,
          "showHomeIcon",
          true
        );
      });
    }
  }
}

/**
 * @description يعرض نافذة منبثقة لاختيار الفئة الرئيسية والفرعية قبل إضافة منتج جديد.
 * @async
 * @function showAddProductModal
 * @returns {Promise<void>}
 */
async function showAddProductModal() {
  try {
    console.log('0000000000000000');

const result = await CategoryModal.show();
if (result.status === 'success') {
            console.log('تم الاختيار:', result.mainId, result.subId);
        }else{  console.log('00000000111111111111111111111111111100000000');}
    return;
    // 1. جلب بيانات الفئات
    const response = await fetch("../shared/list.json");
    if (!response.ok) throw new Error("فشل تحميل ملف الفئات");
    const data = await response.json();
    const categories = data.categories;

    // ✅ تعديل: جلب هيكل النافذة من القالب في HTML
    const template = document.getElementById("category-selection-template");
    if (!template) throw new Error("لم يتم العثور على قالب اختيار الفئة.");
    const modalContent = template.content.cloneNode(true);
    const mainCategorySelectInTemplate = modalContent.querySelector(
      "#swal-main-category"
    ); // NOSONAR

    // ملء القائمة الرئيسية بالبيانات
    const mainCategoryOptions = categories
      .map((cat) => `<option value="${cat.id}">${cat.title}</option>`)
      .join("");
    mainCategorySelectInTemplate.innerHTML += mainCategoryOptions;

    // ✅ إصلاح: إنشاء حاوية جديدة وتمريرها إلى Swal بدلاً من DocumentFragment
    const container = document.createElement("div");
    container.appendChild(modalContent);

    // 3. عرض نافذة Swal باستخدام الهيكل من القالب
    const { value: formValues } = await Swal.fire({
      title: "تحديد فئة المنتج",
      html: container,
      confirmButtonText: "متابعة",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
      focusConfirm: false,
      customClass: {
        popup: "category-selection-popup", // تطبيق الكلاس المخصص
      },
      didOpen: () => {
        // ✅ إصلاح: البحث داخل حاوية Swal لضمان العثور على العناصر الصحيحة
        const popup = Swal.getPopup();
        const mainCategorySelect = popup.querySelector("#swal-main-category"); // NOSONAR
        const subCategorySelect = popup.querySelector("#swal-sub-category"); // NOSONAR

        mainCategorySelect.addEventListener("change", (e) => {
          const selectedMainCategoryId = e.target.value;
          const selectedCategory = categories.find(
            (cat) => cat.id == selectedMainCategoryId
          );

          // تفريغ وتحديث القائمة الفرعية
          subCategorySelect.innerHTML = `<option value="" disabled selected>اختر السوق الفرعي...</option>`;
          if (selectedCategory && selectedCategory.subcategories) {
            const subCategoryOptions = selectedCategory.subcategories
              .map((sub) => `<option value="${sub.id}">${sub.title}</option>`)
              .join("");
            subCategorySelect.innerHTML += subCategoryOptions;
            subCategorySelect.disabled = false;
          } else {
            subCategorySelect.disabled = true;
          }
        });
      },
      preConfirm: () => {
        // ✅ إصلاح: البحث داخل حاوية Swal
        const popup = Swal.getPopup();
        const mainCategory = popup.querySelector("#swal-main-category").value; // NOSONAR
        const subCategory = popup.querySelector("#swal-sub-category").value; // NOSONAR
        if (!mainCategory || !subCategory) {
          Swal.showValidationMessage("يجب اختيار الفئة الرئيسية والفرعية");
          return false;
        }
        // ✅ جديد: رسالة خاصة للمطور لتتبع القيم المختارة
        console.log(
          `%c[HGH-Dev] Category Selected: Main=${mainCategory}, Sub=${subCategory}`,
          "color: #8A2BE2; font-weight: bold;"
        );
        mainCategorySelectToAdd = mainCategory; //الفئه الرئيسية المختارة عند اضافة منتج
        subCategorySelectToAdd = subCategory; //الفئه الفرعية المختارة عند اضافة منتج
        productAddLayout();
      
      },
    });
  } catch (error) {
    console.error("خطأ في عرض نافذة إضافة المنتج:", error);
    Swal.fire("خطأ", "حدث خطأ أثناء محاولة عرض النافذة.", "error");
  }
}

updateViewForLoggedInUser();
