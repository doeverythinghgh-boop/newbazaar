/** 
 * دالة getAllUsers
 * @description دالة غير متزامنة لجلب جميع بيانات المستخدمين الأساسية من API الخادم
 * @returns {Promise<Array>} مصفوفة من كائنات المستخدمين بعد معالجة البيانات
 */
async function getAllUsers() {
    console.log('[getAllUsers] بدء عملية جلب جميع بيانات المستخدمين...');
    
    try {
        console.log('[getAllUsers] جاري إرسال طلب GET إلى /api/users...');
        
        // إرسال طلب GET إلى نقطة النهاية المحددة
        const response = await fetch(`${baseURL}/api/users`);
        
        console.log(`[getAllUsers] تم استلام استجابة من الخادم، رمز الحالة: ${response.status}`);
        
        // التحقق من نجاح الطلب (الحالة بين 200 و 299)
        if (!response.ok) {
            console.error(`[getAllUsers] فشل استلام البيانات من الخادم، رمز الخطأ: ${response.status}`);
            throw new Error(`فشل استجابة الخادم: ${response.status}`);
        }
        
        console.log('[getAllUsers] جاري تحويل الاستجابة إلى تنسيق JSON...');
        
        // تحويل البيانات الواردة من الخادم إلى كائنات JavaScript
        const rawUsersData = await response.json();
        
        console.log(`[getAllUsers] تم تحويل البيانات بنجاح، عدد المستخدمين الخام: ${rawUsersData.length}`);
        
        // معالجة البيانات: تحويل كل مستخدم إلى الصيغة المطلوبة
        console.log('[getAllUsers] بدء معالجة البيانات وتنظيفها...');
        
        const processedUsers = rawUsersData.map((user, index) => {
            console.log(`[getAllUsers] معالجة المستخدم رقم ${index + 1} من ${rawUsersData.length}`);
            
            // إنشاء كائن المستخدم النهائي بالحقول المطلوبة فقط
            const processedUser = {
                // البيانات الأساسية
                user_key: user.user_key,           // المفتاح الفريد للمستخدم
                username: user.username,           // الاسم المعروض
                phone: user.phone,                 // رقم الهاتف
                Address: user.Address,             // العنوان
                Password: user.Password,           // كلمة المرور (تظهر كما هي)
                
                // معلومات توكن FCM (من جدول user_tokens عبر LEFT JOIN)
                hasFCMToken: !!user.fcm_token,     // تحويل إلى قيمة منطقية (true/false)
                tokenPlatform: user.platform       // نوع المنصة (iOS, Android, Web, etc.)
                    ? user.platform               // إذا كانت القيمة موجودة
                    : "لا يوجد"                   // إذا كانت null أو undefined
            };
            
            return processedUser;
        });
        
        console.log(`[getAllUsers] اكتملت المعالجة، المستخدمون المعالجون:`, processedUsers);
        
        // إرجاع البيانات المعالجة للاستخدام
        return processedUsers;
        
    } catch (error) {
        console.error('[getAllUsers] حدث خطأ غير متوقع أثناء تنفيذ الدالة:');
        console.error(`[getAllUsers] نوع الخطأ: ${error.name}`);
        console.error(`[getAllUsers] رسالة الخطأ: ${error.message}`);
        
        // إعادة رمي الخطأ للسماح للكود المستدعي بالتعامل معه
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

    // تفريغ المحتوى السابق للجدول
    tbody.innerHTML = '';

    // التحقق مما إذا كانت البيانات فارغة
    if (!users || users.length === 0) {
        const emptyRow = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">لا يوجد مستخدمون لعرضهم.</td>
            </tr>
        `;
        tbody.innerHTML = emptyRow;
        return;
    }

    // إنشاء صفوف الجدول من البيانات
    users.forEach(user => {
        const row = document.createElement('tr');

        // تحديد الفئة اللونية والأيقونة بناءً على وجود التوكن
        const tokenClass = user.hasFCMToken ? 'has-token-true' : 'has-token-false';
        const tokenText = user.hasFCMToken ? 'نعم' : 'لا';

        row.innerHTML = `
            <td>${user.user_key || 'غير متوفر'}</td>
            <td>${user.username || 'غير متوفر'}</td>
            <td>${user.phone || 'غير متوفر'}</td>
            <td>${user.Password || 'لا يوجد'}</td>
            <td>${user.Address || 'غير متوفر'}</td>
            <td class="${tokenClass}">${tokenText}</td>
            <td>${user.tokenPlatform || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * @description الدالة الرئيسية التي يتم تنفيذها عند تحميل الصفحة.
 *   تقوم بجلب بيانات المستخدمين وتعبئة الجدول.
 */
async function initializeAdminPanel() {
    const loader = document.getElementById('admin-panel-loader');
    const tableContainer = document.getElementById('admin-panel-table-container');
    const errorContainer = document.createElement('div');
    errorContainer.className = 'admin-panel-error'; // يمكن إضافة تنسيق خاص للأخطاء في CSS
    errorContainer.style.textAlign = 'center';
    errorContainer.style.padding = '20px';
    errorContainer.style.color = 'var(--danger-color)';

    try {
        // عرض مؤشر التحميل وإخفاء الجدول
        loader.style.display = 'flex';
        tableContainer.style.display = 'none';

        // جلب البيانات
        const users = await getAllUsers();

        // تعبئة الجدول بالبيانات
        populateUsersTable(users);

        // إخفاء مؤشر التحميل وإظهار الجدول
        loader.style.display = 'none';
        tableContainer.style.display = 'block';

    } catch (error) {
        console.error('[initializeAdminPanel] فشلت عملية تهيئة لوحة التحكم:', error);
        
        // إخفاء مؤشر التحميل وعرض رسالة خطأ
        loader.style.display = 'none';
        errorContainer.innerHTML = `<p>حدث خطأ أثناء تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.</p><p><small>${error.message}</small></p>`;
        const mainContainer = document.querySelector('.admin-panel-container');
        if (mainContainer) mainContainer.appendChild(errorContainer);
    }
}

// بدء تنفيذ الكود عند تحميل محتوى الصفحة بالكامل
 initializeAdminPanel();