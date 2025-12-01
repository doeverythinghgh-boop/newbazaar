
/**
 * @description تحميل وعرض نافذة منبثقة من قالب HTML.
 * @function loadAndShowModal
 * @param {string} modalId - معرف حاوية النافذة المنبثقة.
 * @param {string|null} templatePath - مسار ملف القالب HTML المراد تحميله (إذا كان `null`، يفترض أن الهيكل موجود بالفعل).
 * @param {function(HTMLElement): void} initCallback - دالة رد نداء تُستدعى بعد تحميل المحتوى وفتح النافذة، لتجهيز المنطق الخاص بها. تستقبل عنصر الـ modal كمعامل.
 * @param {function(): void} [onCloseCallback] - دالة رد نداء اختيارية تُستدعى عند إغلاق النافذة المنبثقة.
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 * @see setupModalLogic
 */
async function loadAndShowModal(modalId, templatePath, initCallback, onCloseCallback) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`[Modal Loader] لم يتم العثور على حاوية النافذة: ${modalId}`);
    return;
  }

  const modalLogic = setupModalLogic(modalId, `${modalId}-close-btn`, { onClose: onCloseCallback });

  try {
    // تحميل المحتوى فقط إذا لم يكن موجودًا أو تم تحديد مسار
    if (templatePath && modal.children.length === 0) {
      const response = await fetch(templatePath);
      if (!response.ok) throw new Error(`فشل تحميل القالب: ${response.status}`);
      modal.innerHTML = await response.text();

      // تنفيذ أي سكربتات مضمنة
      modal.querySelectorAll("script").forEach(script => {
        const newScript = document.createElement("script");
        newScript.textContent = script.textContent;
        document.body.appendChild(newScript).remove();
      });
    }

    modalLogic.open();
    if (typeof initCallback === 'function') initCallback(modal);

  } catch (error) {
    console.error(`[Modal Loader] خطأ في تحميل أو عرض النافذة ${modalId}:`, error);
    Swal.fire("خطأ في التحميل", "حدث خطأ أثناء محاولة تحميل المحتوى. يرجى المحاولة مرة أخرى.", "error");
    if (typeof onCloseCallback === 'function') onCloseCallback();
  }
}
/**
 * @file js/profile-modal.js
 * @description يحتوي هذا الملف على المنطق البرمجي الخاص بنافذة تعديل الملف الشخصي للمستخدم.
 * يوفر دوال لعرض النافذة، تحديث بيانات المستخدم، وحذف الحساب.
 * @requires module:sweetalert2 - لعرض رسائل وتنبيهات تفاعلية.
 * @requires module:api/users - للتفاعل مع واجهة برمجة التطبيقات (API) الخاصة بالمستخدمين (updateUser, deleteUser, verifyUserPassword).
 * @requires js/modal.js - لاستيراد `loadAndShowModal` و `setupModalLogic` لإدارة النوافذ المنبثقة.
 */

/**
 * @description يعرض نافذة منبثقة (Modal) لتعديل بيانات المستخدم الشخصية.
 * يقوم بتحميل محتوى النافذة من ملف HTML، يملأ الحقول ببيانات المستخدم الحالية،
 * ويدير منطق التحقق من صحة المدخلات، تغيير كلمة المرور، وحفظ التغييرات.
 * @function showEditProfileModal
 * @async
 * @param {object} currentUser - كائن يحتوي على بيانات المستخدم الحالية.
 * @param {string} currentUser.user_key - المفتاح الفريد للمستخدم.
 * @param {string} [currentUser.username] - اسم المستخدم.
 * @param {string} [currentUser.phone] - رقم هاتف المستخدم.
 * @param {string} [currentUser.Address] - عنوان المستخدم.
 * @param {boolean} currentUser.Password - علامة تشير إلى ما إذا كان المستخدم لديه كلمة مرور.
 * @returns {Promise<void>} - يُرجع وعدًا (Promise) يتم حله عند إغلاق النافذة أو اكتمال العملية، دون إرجاع قيمة.
 * @see loadAndShowModal
 * @see handleAccountDeletion
 * @see verifyUserPassword
 * @see updateUser
 */
async function showEditProfileModal(currentUser) {
  await loadAndShowModal("profile-modal-container", "../pages/profile-modal.html", (modal) => {
    // --- Get DOM Elements ---
  
  });
}
