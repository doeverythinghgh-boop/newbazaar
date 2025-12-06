/**
 * @file js/adminPanel.js
 * @description يحتوي هذا الملف على المنطق البرمجي الخاص بصفحة لوحة تحكم المسؤولين (`adminPanel.html`).
 * يتولى جلب بيانات المستخدمين وعرضها في جدول ديناميكي.
 */

/**
 * @description تعرض مؤشر التحميل في حاوية الجدول.
 * @function showLoader
 */
function showLoader() {
  const container = document.getElementById("users-table-container");
  if (!container) return;
  container.innerHTML = `
    <div class="loader-container">
      <div class="loader"></div>
      <p>جاري تحميل بيانات المستخدمين...</p>
    </div>
  `;
}

/**
 * @description تعرض رسالة في حالة عدم وجود مستخدمين.
 * @function showEmptyState
 */
function showEmptyState() {
  const container = document.getElementById("users-table-container");
  if (!container) return;
  container.innerHTML = `<p style="text-align: center; color: #6c757d;">لا يوجد مستخدمون لعرضهم حاليًا.</p>`;
}

/**
 * @description تنشئ وتعرض جدول المستخدمين بناءً على البيانات المستلمة.
 * @param {Array<object>} users - مصفوفة من كائنات المستخدمين (مع بيانات الخدمات المدمجة).
 */
function displayUsersTable(users) {
  const container = document.getElementById("users-table-container");
  if (!container) return;

  // إنشاء هيكل الجدول
  const table = document.createElement("table");
  table.className = "users-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>الاسم</th>
        <th>رقم الهاتف</th>
        <th>كلمة المرور</th>
        <th>العنوان</th>
        <th>المعرف الفريد</th>
        <th>خدمات</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  `;

  const tbody = table.querySelector("tbody");

  // ملء صفوف الجدول
  users.forEach((user) => {
    const deliveryServices = user.delivery_services || [];
    const servicesCount = deliveryServices.length;
    const serviceUserNames = deliveryServices.map((s) => s.username);

    const row = tbody.insertRow();
    row.dataset.userKey = user.user_key;
    row.innerHTML = `
      <td>${user.username || "غير متوفر"}</td>
      <td><a href="tel:${user.phone}">${user.phone || "غير متوفر"}</a></td>
      <td>${user.Password || "لا يوجد"}</td>
      <td>${user.Address || "لا يوجد"}</td>
      <td><code>${user.user_key || "غير متوفر"}</code></td>
      <td>
        <button 
          class="services-btn" 
          ${servicesCount === 0 ? "disabled" : ""}
        >
          الخدمات (${servicesCount})
        </button>
      </td>
    `;

    const servicesBtn = row.querySelector(".services-btn");
    if (servicesBtn && servicesCount > 0) {
      servicesBtn.addEventListener("click", () => {
        const serviceNamesHtml = serviceUserNames.join("<br>") || "لا توجد خدمات توصيل مرتبطة حاليًا.";
        Swal.fire({
          title: "خدمات التوصيل المرتبطة",
          html: serviceNamesHtml,
          icon: "info",
          confirmButtonText: "إغلاق",
        });
      });
    }
  });

  container.innerHTML = ""; // مسح المحتوى السابق (مثل مؤشر التحميل)
  container.appendChild(table);
}



function loadx(){
showLoader();
  const users = await getAllUsers(); // الاعتماد على الدالة من connectUsers.js

  if (users && users.length > 0) {
    displayUsersTable(users);
  } else {
    showEmptyState();
  }
}
loadx();