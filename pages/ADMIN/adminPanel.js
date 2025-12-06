/** 
 * دالة getAllUsers_
 * @description دالة غير متزامنة لجلب جميع بيانات المستخدمين الأساسية من API الخادم
 * @returns {Promise<Array>} مصفوفة من كائنات المستخدمين بعد معالجة البيانات
 */
async function getAllUsers_() {
    console.log('[getAllUsers_] بدء عملية جلب جميع بيانات المستخدمين...');

    try {
        console.log('[getAllUsers_] جاري إرسال طلب GET إلى /api/users...');

        // إرسال طلب GET إلى نقطة النهاية المحددة
        const response = await fetch(`${baseURL}/api/users`);

        console.log(`[getAllUsers_] تم استلام استجابة من الخادم، رمز الحالة: ${response.status}`);

        // التحقق من نجاح الطلب (الحالة بين 200 و 299)
        if (!response.ok) {
            console.error(`[getAllUsers_] فشل استلام البيانات من الخادم، رمز الخطأ: ${response.status}`);
            throw new Error(`فشل استجابة الخادم: ${response.status}`);
        }

        console.log('[getAllUsers_] جاري تحويل الاستجابة إلى تنسيق JSON...');

        // تحويل البيانات الواردة من الخادم إلى كائنات JavaScript
        const rawUsersData = await response.json();

        console.log(`[getAllUsers_] تم تحويل البيانات بنجاح، عدد المستخدمين الخام: ${rawUsersData.length}`);

        // معالجة البيانات: تحويل كل مستخدم إلى الصيغة المطلوبة
        console.log('[getAllUsers_] بدء معالجة البيانات وتنظيفها...');

        // استخراج جميع user_keys للتحقق من الحالة دفعة واحدة
        const userKeys = rawUsersData.map(user => user.user_key);

        // خريطة لتخزين النتائج لسهولة الوصول
        const deliveryStatusMap = {};

        try {
            console.log('[getAllUsers_] جاري التحقق من حالة التوصيل للمستخدمين...');
            const statusResponse = await fetch(`${baseURL}/api/suppliers-deliveries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userKeys })
            });

            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                const results = statusData.results || [];

                results.forEach(item => {
                    deliveryStatusMap[item.key] = {
                        isSeller: item.isSeller,
                        isDelivery: item.isDelivery
                    };
                });

                console.log('[getAllUsers_] تم استلام حالات التوصيل بنجاح');
            } else {
                console.warn(`[getAllUsers_] فشل التحقق من حالة التوصيل: ${statusResponse.status}`);
            }
        } catch (statusError) {
            console.error('[getAllUsers_] خطأ أثناء جلب حالة التوصيل:', statusError);
        }

        const processedUsers = rawUsersData.map((user, index) => {
            const status = deliveryStatusMap[user.user_key] || { isSeller: false, isDelivery: false };

            const processedUser = {
                user_key: user.user_key,
                username: user.username,
                phone: user.phone,
                Address: user.Address,
                Password: user.Password,
                hasFCMToken: !!user.fcm_token,
                tokenPlatform: user.platform ? user.platform : "لا يوجد",
                isSeller: status.isSeller,
                isDelivery: status.isDelivery
            };
            return processedUser;
        });

        console.log(`[getAllUsers_] اكتملت المعالجة، المستخدمون المعالجون:`, processedUsers);
        return processedUsers;

    } catch (error) {
        console.error('[getAllUsers_] حدث خطأ غير متوقع أثناء تنفيذ الدالة:', error);
        throw new Error(`فشلت عملية جلب بيانات المستخدمين: ${error.message}`);
    }
}

/**
 * @description تقوم بتعبئة جدول المستخدمين بالبيانات التي تم جلبها.
 * @param {Array<object>} users - مصفوفة تحتوي على كائنات المستخدمين.
 */
function populateUsersTable(users) {
    const tbody = document.getElementById('admin-panel-users-tbody');
    if (!tbody) {
        console.error('[populateUsersTable] لم يتم العثور على عنصر tbody للجدول.');
        return;
    }

    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        const emptyRow = `<tr><td colspan="7" style="text-align: center; padding: 20px;">لا يوجد مستخدمون لعرضهم.</td></tr>`;
        tbody.innerHTML = emptyRow;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        const tokenClass = user.hasFCMToken ? 'has-token-true' : 'has-token-false';
        const tokenText = user.hasFCMToken ? 'نعم' : 'لا';

        let deliveryAction = '-';
        if (user.isSeller && user.isDelivery) {
            deliveryAction = `<button class="btn-delivery-status btn-role-both" onclick="showRelationsModal('${user.user_key}', '${user.username}')">مشترك</button>`;
        } else if (user.isSeller) {
            deliveryAction = `<button class="btn-delivery-status btn-role-seller" onclick="showRelationsModal('${user.user_key}', '${user.username}')">بائع</button>`;
        } else if (user.isDelivery) {
            deliveryAction = `<button class="btn-delivery-status btn-role-delivery" onclick="showRelationsModal('${user.user_key}', '${user.username}')">توصيل</button>`;
        } else {
            deliveryAction = `<button class="btn-delivery-status btn-role-manage" style="background-color: #6c757d;" onclick="showRelationsModal('${user.user_key}', '${user.username}')">إدارة</button>`;
        }

        const loginAction = `<button class="btn-delivery-status" style="background-color: #17a2b8;" onclick="loginAsUser('${user.user_key}')">دخول</button>`;

        row.innerHTML = `
            <td>${user.user_key || 'غير متوفر'}</td>
            <td>${user.username || 'غير متوفر'}</td>
            <td>${user.phone || 'غير متوفر'}</td>
            <td>${user.Password || 'لا يوجد'}</td>
            <td>${user.Address || 'غير متوفر'}</td>
            <td class="${tokenClass}">${tokenText}</td>
            <td>${user.tokenPlatform || 'N/A'}</td>
            <td style="text-align: center;">${deliveryAction}</td>
            <td style="text-align: center;">${loginAction}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @description الدالة الرئيسية التي يتم تنفيذها عند تحميل الصفحة.
 */
async function initializeAdminPanel() {
    const loader = document.getElementById('admin-panel-loader');
    const tableContainer = document.getElementById('admin-panel-table-container');
    const errorContainer = document.createElement('div');
    errorContainer.className = 'admin-panel-error';
    errorContainer.style.textAlign = 'center'; errorContainer.style.padding = '20px'; errorContainer.style.color = 'var(--danger-color)';

    try {
        loader.style.display = 'flex';
        tableContainer.style.display = 'none';

        const users = await getAllUsers_();
        populateUsersTable(users);

        loader.style.display = 'none';
        tableContainer.style.display = 'block';

        // ✅ إضافة ميزة النسخ عند النقر (Click to Copy)
        const tbody = document.getElementById('admin-panel-users-tbody');
        if (tbody) {
            tbody.onclick = function (e) {
                const target = e.target;
                if (target.tagName === 'BUTTON' || target.closest('button')) return;

                const cell = target.closest('td');
                if (!cell || cell.colSpan > 1) return;

                const textToCopy = cell.innerText.trim();
                if (textToCopy && !['غير متوفر', 'لا يوجد', '-', 'N/A'].includes(textToCopy)) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', Swal.stopTimer);
                                toast.addEventListener('mouseleave', Swal.resumeTimer);
                            }
                        });
                        Toast.fire({ icon: 'success', title: 'تم النسخ: ' + textToCopy });
                    }).catch(err => console.error('فشل النسخ', err));
                }
            };
        }

    } catch (error) {
        console.error('[initializeAdminPanel] فشلت عملية تهيئة لوحة التحكم:', error);
        loader.style.display = 'none';
        errorContainer.innerHTML = `<p>حدث خطأ أثناء تحميل بيانات المستخدمين.</p><p><small>${error.message}</small></p>`;
        const mainContainer = document.querySelector('.admin-panel-container');
        if (mainContainer) mainContainer.appendChild(errorContainer);
    }
}

/**
 * @description عرض نافذة إدارة العلاقات للمستخدم
 */
async function showRelationsModal(userKey, username) {
    Swal.fire({
        title: 'جاري جلب العلاقات...',
        didOpen: () => Swal.showLoading()
    });

    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries?relatedTo=${userKey}`);
        if (!response.ok) throw new Error('فشل جلب العلاقات');
        const data = await response.json();

        let htmlContent = `<div style="text-align: right; font-family: 'Tajawal', sans-serif;">`;
        htmlContent += `<h3 style="color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">📦 الموزعين التابعين له (كموزعين لديك)</h3>`;
        htmlContent += (data.asSeller && data.asSeller.length > 0) ? createRelationsListHtml(data.asSeller, userKey, 'seller') : `<p style="color: #777;">لا يوجد موزعين مرتبطين.</p>`;

        htmlContent += `<h3 style="color: var(--success-color); border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">🚚 البائعين التابع لهم (كموزع لديهم)</h3>`;
        htmlContent += (data.asDelivery && data.asDelivery.length > 0) ? createRelationsListHtml(data.asDelivery, userKey, 'delivery') : `<p style="color: #777;">لا يوجد بائعين مرتبطين.</p>`;

        htmlContent += `
            <div style="margin-top: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h4 style="margin-top: 0;">➕ إضافة علاقة جديدة</h4>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="newRelUserKey" placeholder="أدخل مفتاح المستخدم المراد ربطه" class="swal2-input" style="margin: 0; flex: 1;">
                    <select id="newRelType" class="swal2-input" style="margin: 0; width: 120px; font-size: 14px;">
                        <option value="delivery">هو موزع لي</option>
                        <option value="seller">هو بائع لي</option>
                    </select>
                </div>
                <button onclick="handleAddRelation('${userKey}')" style="margin-top: 10px; background-color: var(--primary-color); color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; width: 100%;">ربط الآن</button>
            </div>
        </div>`;

        Swal.fire({
            title: `إدارة علاقات: ${username}`,
            html: htmlContent,
            width: '600px',
            showConfirmButton: false,
            showCloseButton: true
        });

    } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء جلب البيانات: ' + error.message, 'error');
    }
}

/**
 * @description إنشاء HTML لقائمة العلاقات
 */
function createRelationsListHtml(list, currentUserKey, currentRoleContext) {
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    list.forEach(item => {
        const actionBtnText = item.isActive ? 'تعطيل' : 'تفعيل';
        const sellerKey = currentRoleContext === 'seller' ? currentUserKey : item.userKey;
        const deliveryKey = currentRoleContext === 'delivery' ? currentUserKey : item.userKey;

        html += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div>
                    <strong style="display: block;">${item.username || 'بدون اسم'}</strong>
                    <small style="color: #666;">${item.userKey}</small>
                    <span style="font-size: 0.8em; padding: 2px 5px; border-radius: 3px; background: ${item.isActive ? '#d4edda' : '#f8d7da'}; color: ${item.isActive ? '#155724' : '#721c24'}; margin-right: 5px;">${item.isActive ? 'نشط' : 'غير نشط'}</span>
                </div>
                <div>
                    <button onclick="handleToggleRelation('${sellerKey}', '${deliveryKey}', ${!item.isActive}, '${currentUserKey}')" 
                            style="padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; background-color: ${item.isActive ? '#dc3545' : '#28a745'}; color: white; margin-left: 5px;">
                        ${actionBtnText}
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

/**
 * @description معالجة إضافة علاقة جديدة
 */
window.handleAddRelation = async (currentUserKey) => {
    const targetUserKey = document.getElementById('newRelUserKey').value.trim();
    const relType = document.getElementById('newRelType').value;

    if (!targetUserKey) {
        Swal.showValidationMessage('يرجى إدخال مفتاح المستخدم');
        return;
    }

    let sellerKey, deliveryKey;
    if (relType === 'delivery') {
        sellerKey = currentUserKey;
        deliveryKey = targetUserKey;
    } else {
        sellerKey = targetUserKey;
        deliveryKey = currentUserKey;
    }

    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerKey, deliveryKey, isActive: true })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'فشل الإضافة');

        Swal.fire({
            icon: 'success',
            title: 'تم!',
            text: 'تم إضافة العلاقة بنجاح',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            const title = Swal.getTitle().textContent.replace('إدارة علاقات: ', '');
            showRelationsModal(currentUserKey, title);
        });

    } catch (error) {
        Swal.fire('خطأ', error.message, 'error');
    }
};

/**
 * @description معالجة تبديل حالة العلاقة
 */
window.handleToggleRelation = async (sellerKey, deliveryKey, newStatus, modalOwnerKey) => {
    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerKey, deliveryKey, isActive: newStatus })
        });

        if (!response.ok) throw new Error('فشل التحديث');

        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });

        const title = Swal.getTitle().textContent.replace('إدارة علاقات: ', '');
        showRelationsModal(modalOwnerKey, title);

    } catch (error) {
        Swal.fire('خطأ', 'فشل تغيير الحالة', 'error');
    }
};

/**
 * @description تسجيل الدخول كمسؤول باسم مستخدم آخر (Impersonation)
 */
window.loginAsUser = async (targetUserKey) => {
    try {
        Swal.fire({
            title: 'جاري تبديل المستخدم...',
            text: 'سيتم تسجيل الخروج وتنظيف البيانات الحالية...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 1. جلب بيانات المستخدم المستهدف للتحقق أولاً
        const response = await fetch(`${baseURL}/api/users`);
        const allUsers = await response.json();
        const targetUser = allUsers.find(u => u.user_key === targetUserKey);

        if (!targetUser) throw new Error('المستخدم غير موجود');

        // 2. الاحتفاظ بجلسة المسؤول الأصلية في الذاكرة المؤقتة
        // إذا كنا بالفعل في وضع الانتحال، نستخدم الجلسة الأصلية المحفوظة، وإلا نستخدم المستخدم الحالي كـ "أصل"
        const currentSession = JSON.parse(localStorage.getItem('loggedInUser'));
        const existingOriginalSession = JSON.parse(localStorage.getItem('originalAdminSession'));
        const originalAdminSession = existingOriginalSession || currentSession;

        if (!originalAdminSession) throw new Error('لا يوجد جلسة مسؤول صالحة للحفظ');

        // 3. تنفيذ عملية تسجيل الخروج الكاملة (تنظيف المتصفح)
        // نستخدم الدالة الموجودة في tools.js أو auth.js لمسح كل شيء
        console.log('[Impersonation] Cleaning browser data...');
        if (typeof clearAllBrowserData === 'function') {
            await clearAllBrowserData();
        } else {
            // fallback إذا لم تكن الدالة متاحة
            localStorage.clear();
        }

        // 4. استعادة جلسة المسؤول في localStorage (لكي يظهر الزر لاحقاً)
        localStorage.setItem('originalAdminSession', JSON.stringify(originalAdminSession));

        // 5. إعداد وحفظ جلسة المستخدم الجديد
        const newUserSession = {
            user_key: targetUser.user_key,
            username: targetUser.username,
            phone: targetUser.phone,
            is_seller: targetUser.is_seller || 0,
            is_guest: false,
            platform: targetUser.platform || 'web'
        };
        localStorage.setItem('loggedInUser', JSON.stringify(newUserSession));

        // 6. إعادة توجيه كاملة لضمان تحميل النظام بالبيانات الجديدة
        console.log('[Impersonation] Redirecting to home as new user...');
        window.location.href = 'index.html';

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل تبديل المستخدم: ' + error.message
        });
    }
};

initializeAdminPanel();