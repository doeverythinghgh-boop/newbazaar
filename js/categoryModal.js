// categoryModal.js - النسخة المصححة

window.CategoryModal = (function() {
    var MODAL_ID = 'category-modal';
    var CATEGORIES_URL = './shared/list.json';
    var categoriesData = [];
    var isInitialized = false;

    // ============================================
    // 1. دالة محسنة لإنشاء الـ DOM
    // ============================================

    function createModalDOM() {
        console.log('محاولة إنشاء النافذة المنبثقة...');
        
        // التحقق مما إذا كانت النافذة موجودة بالفعل
        if (document.getElementById(MODAL_ID)) {
            console.log('النافذة موجودة بالفعل');
            return true;
        }

        try {
            // أنماط CSS
            var styles = `
                <style id="category-modal-styles">
                    .modal-backdrop {
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
                    .modal-backdrop.show {
                        display: flex;
                        opacity: 1;
                    }
                    .modal-content {
                        background-color: white;
                        padding: 30px;
                        border-radius: 12px;
                        width: 95%;
                        max-width: 500px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                        transform: scale(0.95);
                        transition: transform 0.3s ease;
                    }
                    .modal-backdrop.show .modal-content {
                        transform: scale(1);
                    }
                    .modal-title {
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
                    .category-select-group label {
                        font-weight: 600;
                        margin-bottom: 5px;
                        display: block;
                    }
                    .modal-select {
                        width: 100%;
                        padding: 10px;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        box-sizing: border-box;
                        transition: border-color 0.2s;
                    }
                    .modal-select:focus {
                        border-color: #007bff;
                        outline: none;
                    }
                    .modal-actions {
                        display: flex;
                        justify-content: flex-start;
                        gap: 10px;
                    }
                    .btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .btn-primary {
                        background-color: #007bff;
                        color: white;
                    }
                    .btn-secondary {
                        background-color: #e9ecef;
                        color: #333;
                    }
                    .validation-error {
                        color: #dc3545;
                        font-size: 0.875rem;
                        margin-top: 5px;
                        text-align: right;
                        height: 1.2em;
                    }
                    @media (max-width: 768px) {
                        .modal-content {
                            padding: 20px;
                            margin: 10px;
                            width: calc(100% - 20px);
                        }
                    }
                </style>
            `;

            // HTML للنافذة
            var modalHTML = `
                <div id="${MODAL_ID}" class="modal-backdrop">
                    <div class="modal-content">
                        <h2 class="modal-title">تحديد فئة المنتج</h2>
                        <div class="category-selection-container">
                            <div class="category-select-group">
                                <label for="main-category">
                                    <i class="fas fa-layer-group"></i> السوق الرئيسي
                                </label>
                                <select id="main-category" class="modal-select">
                                    <option value="" disabled selected>اختر السوق الرئيسي...</option>
                                </select>
                            </div>
                            <div class="category-select-group">
                                <label for="sub-category">
                                    <i class="fas fa-tags"></i> السوق الفرعي
                                </label>
                                <select id="sub-category" class="modal-select" disabled>
                                    <option value="" disabled selected>اختر السوق الفرعي...</option>
                                </select>
                                <p id="validation-message" class="validation-error"></p>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button id="cancel-modal-btn" class="btn btn-secondary">إلغاء</button>
                            <button id="confirm-modal-btn" class="btn btn-primary">متابعة</button>
                        </div>
                    </div>
                </div>
            `;

            // طريقة آمنة لإضافة العناصر إلى الـ DOM
            var styleElement = document.createElement('div');
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement.firstElementChild);

            var modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            
            // إضافة النافذة مباشرة إلى body
            document.body.appendChild(modalContainer.firstElementChild);
            
            console.log('تم إنشاء النافذة المنبثقة بنجاح');
            return true;
            
        } catch (error) {
            console.error('فشل إنشاء النافذة المنبثقة:', error);
            return false;
        }
    }

    // ============================================
    // 2. دالة محسنة للعرض مع التحقق الشديد
    // ============================================

    function showCategoryModal(initialMainId, initialSubId) {
        console.log('بدء عرض النافذة المنبثقة...');
        
        return new Promise(function(resolve, reject) {
            // 1. التحقق من تهيئة النافذة أولاً
            if (!isInitialized) {
                console.log('تهيئة النافذة لأول مرة...');
                var created = createModalDOM();
                if (!created) {
                    reject(new Error('فشل إنشاء النافذة المنبثقة'));
                    return;
                }
                isInitialized = true;
            }

            // 2. التحقق الشديد من وجود العنصر
            var modalElement = document.getElementById(MODAL_ID);
            if (!modalElement) {
                console.error('خطأ: عنصر النافذة غير موجود في الـ DOM');
                console.log('بحث عن عنصر بالـ ID:', MODAL_ID);
                console.log('عناصر body:', document.body.children.length);
                
                // محاولة إنشاء العنصر مرة أخرى
                console.log('محاولة إنشاء العنصر مرة أخرى...');
                var retryCreated = createModalDOM();
                if (!retryCreated) {
                    reject(new Error('فشل إنشاء النافذة المنبثقة بعد المحاولة الثانية'));
                    return;
                }
                
                modalElement = document.getElementById(MODAL_ID);
                if (!modalElement) {
                    reject(new Error('عنصر النافذة غير موجود حتى بعد المحاولة الثانية'));
                    return;
                }
            }

            console.log('تم العثور على عنصر النافذة:', modalElement);

            // 3. جلب البيانات وعرض النافذة
            fetchCategoriesData()
                .then(function(categories) {
                    setupModal(modalElement, categories, initialMainId, initialSubId, resolve, reject);
                })
                .catch(function(error) {
                    console.error('خطأ في جلب البيانات:', error);
                    reject(error);
                });
        });
    }

    // ============================================
    // 3. دالة إعداد النافذة (منفصلة للتنظيم)
    // ============================================

    function setupModal(modalElement, categories, initialMainId, initialSubId, resolve, reject) {
        try {
            // الحصول على عناصر الـ DOM داخل النافذة
            var mainSelect = modalElement.querySelector('#main-category');
            var subSelect = modalElement.querySelector('#sub-category');
            var confirmBtn = modalElement.querySelector('#confirm-modal-btn');
            var cancelBtn = modalElement.querySelector('#cancel-modal-btn');
            var validationMsg = modalElement.querySelector('#validation-message');

            // التحقق من وجود جميع العناصر
            if (!mainSelect || !subSelect || !confirmBtn || !cancelBtn) {
                console.error('عناصر النافذة الداخلية مفقودة');
                reject(new Error('عناصر النافذة الداخلية غير مكتملة'));
                return;
            }

            // 1. تعبئة القائمة الرئيسية
            mainSelect.innerHTML = '<option value="" disabled selected>اختر السوق الرئيسي...</option>';
            categories.forEach(function(category) {
                var option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.title;
                mainSelect.appendChild(option);
            });

            // 2. دالة تحديث القائمة الفرعية
            function updateSubCategories() {
                var selectedId = mainSelect.value;
                var selectedCat = categories.find(function(cat) {
                    return String(cat.id) === selectedId;
                });

                subSelect.innerHTML = '<option value="" disabled selected>اختر السوق الفرعي...</option>';
                if (validationMsg) validationMsg.textContent = '';

                if (selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0) {
                    selectedCat.subcategories.forEach(function(sub) {
                        var option = document.createElement('option');
                        option.value = sub.id;
                        option.textContent = sub.title;
                        subSelect.appendChild(option);
                    });
                    subSelect.disabled = false;
                } else {
                    subSelect.disabled = true;
                }
            }

            // 3. تعيين القيم المبدئية
            if (initialMainId) {
                mainSelect.value = initialMainId;
                updateSubCategories();
                
                if (initialSubId) {
                    // استخدام setTimeout لضمان تحميل الخيارات أولاً
                    setTimeout(function() {
                        if (!subSelect.disabled) {
                            var optionExists = Array.from(subSelect.options).some(function(opt) {
                                return opt.value === String(initialSubId);
                            });
                            if (optionExists) {
                                subSelect.value = initialSubId;
                            }
                        }
                    }, 10);
                }
            }

            // 4. تعريف معالجات الأحداث
            function handleMainChange() {
                updateSubCategories();
            }

            function handleConfirm() {
                var mainId = mainSelect.value;
                var subId = subSelect.value;

                if (!mainId || !subId) {
                    if (validationMsg) {
                        validationMsg.textContent = 'يجب اختيار الفئة الرئيسية والفرعية';
                    }
                    return;
                }

                // تنظيف المستمعات
                cleanup();
                
                // إخفاء النافذة
                modalElement.classList.remove('show');
                document.body.style.overflow = '';
                
                // إرجاع النتيجة
                resolve({
                    mainId: mainId,
                    subId: subId
                });
            }

            function handleCancel() {
                cleanup();
                modalElement.classList.remove('show');
                document.body.style.overflow = '';
                reject(new Error('تم الإلغاء من قبل المستخدم'));
            }

            function handleBackdropClick(e) {
                if (e.target === modalElement) {
                    handleCancel();
                }
            }

            function handleEscKey(e) {
                if (e.key === 'Escape' && modalElement.classList.contains('show')) {
                    handleCancel();
                }
            }

            // دالة تنظيف المستمعات
            function cleanup() {
                mainSelect.removeEventListener('change', handleMainChange);
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                modalElement.removeEventListener('click', handleBackdropClick);
                document.removeEventListener('keydown', handleEscKey);
            }

            // 5. إضافة المستمعات
            mainSelect.addEventListener('change', handleMainChange);
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modalElement.addEventListener('click', handleBackdropClick);
            document.addEventListener('keydown', handleEscKey);

            // 6. عرض النافذة
            modalElement.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // التركيز على القائمة الرئيسية
            setTimeout(function() {
                mainSelect.focus();
            }, 100);

        } catch (error) {
            console.error('خطأ في إعداد النافذة:', error);
            reject(new Error('فشل إعداد النافذة المنبثقة: ' + error.message));
        }
    }

    // ============================================
    // 4. باقي الدوال (بدون تغيير)
    // ============================================

    function fetchCategoriesData() {
        return new Promise(function(resolve, reject) {
            if (categoriesData.length > 0) {
                resolve(categoriesData);
                return;
            }

            fetch(CATEGORIES_URL)
                .then(function(response) {
                    if (!response.ok) throw new Error('فشل تحميل بيانات الفئات');
                    return response.json();
                })
                .then(function(data) {
                    categoriesData = data.categories || [];
                    resolve(categoriesData);
                })
                .catch(reject);
        });
    }

    function closeCategoryModal() {
        var modalElement = document.getElementById(MODAL_ID);
        if (modalElement) {
            modalElement.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // 5. إرجاع الواجهة العامة
    // ============================================

    return {
        show: showCategoryModal,
        close: closeCategoryModal,
        // دالة مساعدة للتحقق من التهيئة
        isInitialized: function() {
            return isInitialized && !!document.getElementById(MODAL_ID);
        }
    };
})();