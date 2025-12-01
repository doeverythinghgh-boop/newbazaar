// categoryModal.js
// نافذة اختيار الفئات - تعيد القيم دائماً حتى عند الإغلاق

window.CategoryModal = (function() {
    'use strict';
    
    // ============================================
    // 1. المتغيرات العامة
    // ============================================
    const MODAL_ID = 'category-modal';
    const CATEGORIES_URL = './shared/list.json';
    let categoriesData = [];
    let isInitialized = false;

    // ============================================
    // 2. إنشاء عناصر DOM للنافذة
    // ============================================
    function createModalDOM() {
        console.log('[CategoryModal] إنشاء عناصر النافذة...');
        
        // إذا كانت النافذة موجودة بالفعل
        if (document.getElementById(MODAL_ID)) {
            console.log('[CategoryModal] النافذة موجودة بالفعل');
            return true;
        }

        try {
            // إنشاء أنماط CSS
            const styles = document.createElement('style');
            styles.id = 'category-modal-styles';
            styles.textContent = `
                .category-modal-backdrop {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    justify-content: center;
                    align-items: center;
                    transition: opacity 0.3s ease;
                    opacity: 0;
                }
                
                .category-modal-backdrop.show {
                    display: flex;
                    opacity: 1;
                }
                
                .category-modal-content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 12px;
                    width: 95%;
                    max-width: 500px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    transform: scale(0.95);
                    transition: transform 0.3s ease;
                }
                
                .category-modal-backdrop.show .category-modal-content {
                    transform: scale(1);
                }
                
                .category-modal-title {
                    color: #03478f;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    text-align: right;
                }
                
                .category-selection-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-bottom: 20px;
                    text-align: right;
                }
                
                .category-select-group {
                    text-align: right;
                }
                
                .category-select-group label {
                    font-weight: 600;
                    margin-bottom: 8px;
                    display: block;
                    color: #333;
                }
                
                .category-modal-select {
                    width: 100%;
                    padding: 12px 15px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                    font-size: 16px;
                    background-color: #fff;
                    color: #333;
                }
                
                .category-modal-select:focus {
                    border-color: #007bff;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
                
                .category-modal-select:disabled {
                    background-color: #f5f5f5;
                    color: #999;
                    cursor: not-allowed;
                }
                
                .category-modal-actions {
                    display: flex;
                    justify-content: flex-start;
                    gap: 15px;
                    margin-top: 25px;
                }
                
                .category-modal-btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    min-width: 120px;
                }
                
                .category-modal-btn-primary {
                    background-color: #007bff;
                    color: white;
                }
                
                .category-modal-btn-primary:hover {
                    background-color: #0056b3;
                    transform: translateY(-2px);
                }
                
                .category-modal-btn-secondary {
                    background-color: #6c757d;
                    color: white;
                }
                
                .category-modal-btn-secondary:hover {
                    background-color: #545b62;
                    transform: translateY(-2px);
                }
                
                .category-validation-error {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 8px;
                    text-align: right;
                    min-height: 20px;
                    display: block;
                }
                
                @media (max-width: 768px) {
                    .category-modal-content {
                        padding: 20px;
                        margin: 15px;
                        width: calc(100% - 30px);
                    }
                    
                    .category-modal-actions {
                        flex-direction: column-reverse;
                        gap: 10px;
                    }
                    
                    .category-modal-btn {
                        width: 100%;
                        min-width: unset;
                    }
                }
                
                @media (max-width: 480px) {
                    .category-modal-content {
                        padding: 15px;
                    }
                    
                    .category-modal-title {
                        font-size: 1.3rem;
                    }
                }
            `;

            // إنشاء هيكل النافذة
            const modalHTML = `
                <div id="${MODAL_ID}" class="category-modal-backdrop">
                    <div class="category-modal-content">
                        <h2 class="category-modal-title">📋 تحديد فئة المنتج</h2>
                        
                        <div class="category-selection-container">
                            <div class="category-select-group">
                                <label for="main-category">
                                    <i class="fas fa-layer-group"></i> السوق الرئيسي
                                </label>
                                <select id="main-category" class="category-modal-select">
                                    <option value="" disabled selected>اختر السوق الرئيسي...</option>
                                </select>
                            </div>
                            
                            <div class="category-select-group">
                                <label for="sub-category">
                                    <i class="fas fa-tags"></i> السوق الفرعي
                                </label>
                                <select id="sub-category" class="category-modal-select" disabled>
                                    <option value="" disabled selected>اختر السوق الفرعي...</option>
                                </select>
                                <span id="validation-message" class="category-validation-error"></span>
                            </div>
                        </div>
                        
                        <div class="category-modal-actions">
                            <button id="cancel-modal-btn" class="category-modal-btn category-modal-btn-secondary">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                            <button id="confirm-modal-btn" class="category-modal-btn category-modal-btn-primary">
                                <i class="fas fa-check"></i> متابعة
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // إضافة الأنماط إلى head
            document.head.appendChild(styles);

            // إضافة النافذة إلى body
            const container = document.createElement('div');
            container.innerHTML = modalHTML;
            document.body.appendChild(container.firstElementChild);

            console.log('[CategoryModal] تم إنشاء النافذة بنجاح');
            return true;

        } catch (error) {
            console.error('[CategoryModal] خطأ في إنشاء النافذة:', error);
            return false;
        }
    }

    // ============================================
    // 3. جلب بيانات الفئات من JSON
    // ============================================
    async function fetchCategoriesData() {
        // إذا كانت البيانات مخزنة مسبقاً
        if (categoriesData && categoriesData.length > 0) {
            return categoriesData;
        }

        try {
            console.log('[CategoryModal] جلب بيانات الفئات...');
            const response = await fetch(CATEGORIES_URL);
            
            if (!response.ok) {
                throw new Error(`فشل تحميل الملف: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            categoriesData = data.categories || [];
            
            console.log('[CategoryModal] تم جلب', categoriesData.length, 'فئة');
            return categoriesData;
            
        } catch (error) {
            console.error('[CategoryModal] خطأ في جلب البيانات:', error);
            throw new Error('تعذر تحميل بيانات الفئات. تأكد من وجود ملف list.json');
        }
    }

    // ============================================
    // 4. إعداد وعرض النافذة (الوظيفة الرئيسية)
    // ============================================
    function showCategoryModal(initialMainId = null, initialSubId = null) {
        console.log('[CategoryModal] فتح النافذة', { initialMainId, initialSubId });
        
        return new Promise(async (resolve) => {
            try {
                // 1. التحقق من التهيئة
                if (!isInitialized) {
                    console.log('[CategoryModal] تهيئة النافذة لأول مرة');
                    const created = createModalDOM();
                    if (!created) {
                        resolve({
                            status: 'error',
                            message: 'فشل إنشاء النافذة المنبثقة',
                            mainId: null,
                            subId: null,
                            action: null
                        });
                        return;
                    }
                    isInitialized = true;
                }

                // 2. التحقق من وجود العنصر
                const modalElement = document.getElementById(MODAL_ID);
                if (!modalElement) {
                    console.error('[CategoryModal] العنصر غير موجود في DOM');
                    resolve({
                        status: 'error',
                        message: 'عنصر النافذة غير موجود',
                        mainId: null,
                        subId: null,
                        action: null
                    });
                    return;
                }

                // 3. جلب البيانات
                let categories;
                try {
                    categories = await fetchCategoriesData();
                } catch (error) {
                    resolve({
                        status: 'error',
                        message: error.message,
                        mainId: null,
                        subId: null,
                        action: null
                    });
                    return;
                }

                // 4. الحصول على عناصر DOM
                const mainSelect = modalElement.querySelector('#main-category');
                const subSelect = modalElement.querySelector('#sub-category');
                const confirmBtn = modalElement.querySelector('#confirm-modal-btn');
                const cancelBtn = modalElement.querySelector('#cancel-modal-btn');
                const validationMsg = modalElement.querySelector('#validation-message');

                // التحقق من وجود جميع العناصر
                if (!mainSelect || !subSelect || !confirmBtn || !cancelBtn) {
                    resolve({
                        status: 'error',
                        message: 'عناصر النافذة غير مكتملة',
                        mainId: null,
                        subId: null,
                        action: null
                    });
                    return;
                }

                // 5. تعبئة القائمة الرئيسية
                mainSelect.innerHTML = '<option value="" disabled selected>اختر السوق الرئيسي...</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.title;
                    mainSelect.appendChild(option);
                });

                // 6. دالة تحديث القائمة الفرعية
                function updateSubCategories() {
                    const selectedId = mainSelect.value;
                    const selectedCategory = categories.find(cat => String(cat.id) === selectedId);

                    subSelect.innerHTML = '<option value="" disabled selected>اختر السوق الفرعي...</option>';
                    
                    if (validationMsg) {
                        validationMsg.textContent = '';
                    }

                    if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
                        selectedCategory.subcategories.forEach(sub => {
                            const option = document.createElement('option');
                            option.value = sub.id;
                            option.textContent = sub.title;
                            subSelect.appendChild(option);
                        });
                        subSelect.disabled = false;
                    } else {
                        subSelect.disabled = true;
                    }
                }

                // 7. تعيين القيم الأولية
                if (initialMainId) {
                    mainSelect.value = initialMainId;
                    updateSubCategories();
                    
                    if (initialSubId) {
                        // تأخير لضمان تحميل الخيارات أولاً
                        setTimeout(() => {
                            if (!subSelect.disabled) {
                                const optionExists = Array.from(subSelect.options).some(
                                    opt => opt.value === String(initialSubId)
                                );
                                if (optionExists) {
                                    subSelect.value = initialSubId;
                                }
                            }
                        }, 50);
                    }
                }

                // 8. معالجات الأحداث
                let isModalActive = true;

                function handleMainChange() {
                    updateSubCategories();
                }

                function handleConfirm() {
                    if (!isModalActive) return;
                    
                    const mainId = mainSelect.value;
                    const subId = subSelect.value;

                    if (!mainId || !subId) {
                        if (validationMsg) {
                            validationMsg.textContent = '⚠️ يجب اختيار الفئة الرئيسية والفرعية للمتابعة';
                        }
                        return;
                    }

                    cleanup();
                    isModalActive = false;
                    modalElement.classList.remove('show');
                    document.body.style.overflow = '';

                    resolve({
                        status: 'success',
                        message: 'تم الاختيار بنجاح',
                        mainId: mainId,
                        subId: subId,
                        action: 'confirm'
                    });
                }

                function handleCancel() {
                    if (!isModalActive) return;
                    
                    const mainId = mainSelect.value;
                    const subId = subSelect.value;
                    
                    cleanup();
                    isModalActive = false;
                    modalElement.classList.remove('show');
                    document.body.style.overflow = '';

                    resolve({
                        status: 'cancelled',
                        message: 'تم إلغاء العملية',
                        mainId: mainId || null,
                        subId: subId || null,
                        action: 'cancel'
                    });
                }

                function handleBackdropClick(e) {
                    if (!isModalActive) return;
                    
                    if (e.target === modalElement) {
                        const mainId = mainSelect.value;
                        const subId = subSelect.value;
                        
                        cleanup();
                        isModalActive = false;
                        modalElement.classList.remove('show');
                        document.body.style.overflow = '';

                        resolve({
                            status: 'cancelled',
                            message: 'تم النقر خارج النافذة',
                            mainId: mainId || null,
                            subId: subId || null,
                            action: 'backdrop'
                        });
                    }
                }

                function handleEscKey(e) {
                    if (!isModalActive) return;
                    
                    if (e.key === 'Escape' && modalElement.classList.contains('show')) {
                        const mainId = mainSelect.value;
                        const subId = subSelect.value;
                        
                        cleanup();
                        isModalActive = false;
                        modalElement.classList.remove('show');
                        document.body.style.overflow = '';

                        resolve({
                            status: 'cancelled',
                            message: 'تم الضغط على زر ESC',
                            mainId: mainId || null,
                            subId: subId || null,
                            action: 'esc'
                        });
                    }
                }

                // 9. دالة تنظيف المستمعات
                function cleanup() {
                    mainSelect.removeEventListener('change', handleMainChange);
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                    modalElement.removeEventListener('click', handleBackdropClick);
                    document.removeEventListener('keydown', handleEscKey);
                }

                // 10. إضافة مستمعات الأحداث
                mainSelect.addEventListener('change', handleMainChange);
                confirmBtn.addEventListener('click', handleConfirm);
                cancelBtn.addEventListener('click', handleCancel);
                modalElement.addEventListener('click', handleBackdropClick);
                document.addEventListener('keydown', handleEscKey);

                // 11. عرض النافذة
                modalElement.classList.add('show');
                document.body.style.overflow = 'hidden';

                // التركيز على العنصر المناسب
                setTimeout(() => {
                    if (initialMainId) {
                        subSelect.focus();
                    } else {
                        mainSelect.focus();
                    }
                }, 100);

            } catch (error) {
                console.error('[CategoryModal] خطأ غير متوقع:', error);
                resolve({
                    status: 'error',
                    message: `خطأ غير متوقع: ${error.message}`,
                    mainId: null,
                    subId: null,
                    action: null
                });
            }
        });
    }

    // ============================================
    // 5. دالة إغلاق النافذة يدوياً
    // ============================================
    function closeCategoryModal() {
        const modalElement = document.getElementById(MODAL_ID);
        if (modalElement) {
            modalElement.classList.remove('show');
            document.body.style.overflow = '';
            console.log('[CategoryModal] تم إغلاق النافذة يدوياً');
        }
    }

    // ============================================
    // 6. دالة التحقق من حالة النافذة
    // ============================================
    function isModalOpen() {
        const modalElement = document.getElementById(MODAL_ID);
        return modalElement ? modalElement.classList.contains('show') : false;
    }

    // ============================================
    // 7. دالة إعادة تعيين النافذة
    // ============================================
    function resetModal() {
        const modalElement = document.getElementById(MODAL_ID);
        if (!modalElement) return;

        const mainSelect = modalElement.querySelector('#main-category');
        const subSelect = modalElement.querySelector('#sub-category');
        const validationMsg = modalElement.querySelector('#validation-message');

        if (mainSelect) mainSelect.selectedIndex = 0;
        if (subSelect) {
            subSelect.selectedIndex = 0;
            subSelect.disabled = true;
        }
        if (validationMsg) validationMsg.textContent = '';
    }

    // ============================================
    // 8. تصدير الواجهة العامة
    // ============================================
    return {
        /**
         * فتح نافذة اختيار الفئات
         * @param {string|null} initialMainId - الفئة الرئيسية الأولية
         * @param {string|null} initialSubId - الفئة الفرعية الأولية
         * @returns {Promise<Object>} - يعيد وعداً بكائن النتيجة
         */
        show: showCategoryModal,
        
        /**
         * إغلاق النافذة يدوياً
         */
        close: closeCategoryModal,
        
        /**
         * التحقق مما إذا كانت النافذة مفتوحة
         * @returns {boolean}
         */
        isOpen: isModalOpen,
        
        /**
         * التحقق مما إذا كانت النافذة مهيأة
         * @returns {boolean}
         */
        isInitialized: function() {
            return isInitialized && !!document.getElementById(MODAL_ID);
        },
        
        /**
         * إعادة تعيين النافذة إلى حالتها الأولية
         */
        reset: resetModal,
        
        /**
         * الحصول على بيانات الفئات المخزنة
         * @returns {Array}
         */
        getCategories: function() {
            return [...categoriesData];
        },
        
        /**
         * تهيئة النافذة مسبقاً دون عرضها
         * @returns {Promise<boolean>}
         */
        preload: async function() {
            try {
                await fetchCategoriesData();
                if (!isInitialized) {
                    createModalDOM();
                    isInitialized = true;
                }
                return true;
            } catch (error) {
                console.error('[CategoryModal] فشل التحميل المسبق:', error);
                return false;
            }
        }
    };
})();

// ============================================
// 9. تهيئة تلقائية عند تحميل الصفحة (اختياري)
// ============================================
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        console.log('[CategoryModal] الصفحة محملة، جاهز للاستخدام');
        
        // يمكنك تفعيل التحميل المسبق إذا أردت
        // CategoryModal.preload().catch(() => {});
    });
}

// ============================================
// 10. أمثلة الاستخدام
// ============================================
/*
// المثال 1: استخدام بسيط
CategoryModal.show()
    .then(result => {
        console.log('النتيجة:', result);
        
        if (result.status === 'success') {
            console.log('تم الاختيار:', result.mainId, result.subId);
        } else if (result.status === 'cancelled') {
            console.log('تم الإلغاء، آخر اختيار:', result.mainId, result.subId);
        } else {
            console.error('حدث خطأ:', result.message);
        }
    });

// المثال 2: مع قيم أولية
CategoryModal.show('1', '101')
    .then(result => {
        // التعامل مع النتيجة
    });

// المثال 3: استخدام async/await
async function selectCategory() {
    const result = await CategoryModal.show();
    return result;
}

// المثال 4: إغلاق النافذة يدوياً
CategoryModal.close();

// المثال 5: التحقق من حالة النافذة
if (CategoryModal.isOpen()) {
    console.log('النافذة مفتوحة حالياً');
}
*/