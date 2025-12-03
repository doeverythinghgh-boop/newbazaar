/* ============================================
   Test Panel JS - Testing & Control Panel
   ============================================ */

/**
 * Initialize test panel
 */
function initTestPanel() {
    try {
        setupRoleSelector();
        setupVendorCountControl();
        setupVendorEditors();
        setupDeliveryEditors();
        setupStatusControl();
        setupActionButtons();
        
        // Load initial data
        loadTestData();
        
        Utils.log('Test panel initialized');
    } catch (error) {
        console.error('Error initializing test panel:', error);
    }
}

/**
 * Setup role selector
 */
function setupRoleSelector() {
    try {
        const roleInputs = document.querySelectorAll('input[name="user-role"]');
        roleInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const role = e.target.value;
                setCurrentUserRole(role);
                Utils.showSuccess(`تم تغيير الدور إلى: ${getRoleDisplayName(role)}`);
            });
        });
    } catch (error) {
        console.error('Error setting up role selector:', error);
    }
}

/**
 * Setup vendor count control
 */
function setupVendorCountControl() {
    try {
        const countInput = Utils.getElement('vendor-count');
        const decreaseBtn = Utils.getElement('decrease-count');
        const increaseBtn = Utils.getElement('increase-count');

        if (countInput) {
            countInput.addEventListener('change', (e) => {
                const count = parseInt(e.target.value, 10);
                if (Utils.validatePositiveInteger(count)) {
                    updateVendorCount(count);
                } else {
                    Utils.showWarning('عدد البائعين يجب أن يكون رقماً صحيحاً موجباً', 'error');
                    e.target.value = getAllVendors().length;
                }
            });
        }

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                const current = getAllVendors().length;
                if (current > 1) {
                    updateVendorCount(current - 1);
                }
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                const current = getAllVendors().length;
                updateVendorCount(current + 1);
            });
        }
    } catch (error) {
        console.error('Error setting up vendor count control:', error);
    }
}

/**
 * Update vendor count
 */
function updateVendorCount(count) {
    try {
        if (!Utils.validatePositiveInteger(count)) {
            Utils.showWarning('عدد البائعين غير صحيح', 'error');
            return;
        }

        initVendorsData(count);
        const vendors = getAllVendors();
        initDeliveryData(vendors);

        // Update UI
        const countInput = Utils.getElement('vendor-count');
        if (countInput) {
            countInput.value = count;
        }

        renderVendorEditors();
        renderDeliveryEditors();
        renderStepper();

        Utils.showSuccess(`تم تحديث عدد البائعين إلى ${count}`);
    } catch (error) {
        console.error('Error updating vendor count:', error);
        Utils.showWarning('حدث خطأ في تحديث عدد البائعين', 'error');
    }
}

/**
 * Setup vendor editors
 */
function setupVendorEditors() {
    try {
        // Event delegation for vendor field changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-vendor-field]')) {
                const vendorId = e.target.getAttribute('data-vendor-id');
                const field = e.target.getAttribute('data-vendor-field');
                const value = e.target.value;

                if (field === 'requestedQty' || field === 'availableQty') {
                    if (!Utils.validateNonNegativeInteger(value)) {
                        Utils.showWarning('الكمية يجب أن تكون رقماً صحيحاً غير سالب', 'error');
                        const vendor = getVendorById(vendorId);
                        if (vendor) {
                            e.target.value = vendor[field];
                        }
                        return;
                    }
                }

                updateVendor(vendorId, { [field]: value });
                renderStepper();
            }
        });
    } catch (error) {
        console.error('Error setting up vendor editors:', error);
    }
}

/**
 * Render vendor editors
 */
function renderVendorEditors() {
    try {
        const container = Utils.getElement('vendors-editor-container');
        if (!container) return;

        container.innerHTML = '';

        const vendors = getAllVendors();
        vendors.forEach(vendor => {
            const editor = createVendorEditor(vendor);
            container.appendChild(editor);
        });
    } catch (error) {
        console.error('Error rendering vendor editors:', error);
    }
}

/**
 * Create vendor editor
 */
function createVendorEditor(vendor) {
    try {
        const editor = Utils.createElement('div', { className: 'vendor-editor' });

        const header = Utils.createElement('div', { className: 'vendor-editor-header' });
        header.innerHTML = `
            <div class="editor-vendor-name">${vendor.vendorName}</div>
            <div class="editor-vendor-status ${vendor.statusPerVendor.toLowerCase()}">${vendor.statusPerVendor === 'FULL' ? 'كامل' : vendor.statusPerVendor === 'PARTIAL' ? 'جزئي' : 'فشل'}</div>
        `;

        const fields = Utils.createElement('div', { className: 'vendor-fields' });
        fields.innerHTML = `
            <div class="field-group">
                <label class="field-label">الكمية المطلوبة</label>
                <input type="number" 
                       class="field-input" 
                       data-vendor-id="${vendor.vendorId}" 
                       data-vendor-field="requestedQty"
                       data-edit-permission="canEditRequestedQty"
                       value="${vendor.requestedQty}" 
                       min="0">
            </div>
            <div class="field-group">
                <label class="field-label">الكمية المتوفرة</label>
                <input type="number" 
                       class="field-input" 
                       data-vendor-id="${vendor.vendorId}" 
                       data-vendor-field="availableQty"
                       data-edit-permission="canEditAvailableQty"
                       value="${vendor.availableQty}" 
                       min="0">
            </div>
        `;

        editor.appendChild(header);
        editor.appendChild(fields);

        return editor;
    } catch (error) {
        console.error('Error creating vendor editor:', error);
        return null;
    }
}

/**
 * Setup delivery editors
 */
function setupDeliveryEditors() {
    try {
        // Event delegation for delivery changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-delivery-service-select]')) {
                const vendorId = e.target.getAttribute('data-vendor-id');
                const serviceId = e.target.value;
                selectDeliveryService(vendorId, serviceId);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-remove-service]')) {
                const vendorId = e.target.getAttribute('data-vendor-id');
                const serviceId = e.target.getAttribute('data-service-id');
                removeDeliveryService(vendorId, serviceId);
                renderDeliveryEditors();
            }

            if (e.target.matches('[data-add-service]')) {
                const vendorId = e.target.getAttribute('data-vendor-id');
                const serviceName = prompt('اسم خدمة التوصيل:');
                if (serviceName) {
                    const servicePrice = prompt('سعر الخدمة:', '0');
                    addDeliveryService(vendorId, serviceName, servicePrice);
                    renderDeliveryEditors();
                }
            }
        });
    } catch (error) {
        console.error('Error setting up delivery editors:', error);
    }
}

/**
 * Render delivery editors
 */
function renderDeliveryEditors() {
    try {
        const container = Utils.getElement('delivery-editor-container');
        if (!container) return;

        container.innerHTML = '';

        const vendors = getAllVendors();
        vendors.forEach(vendor => {
            const editor = createDeliveryEditor(vendor);
            container.appendChild(editor);
        });
    } catch (error) {
        console.error('Error rendering delivery editors:', error);
    }
}

/**
 * Create delivery editor
 */
function createDeliveryEditor(vendor) {
    try {
        const editor = Utils.createElement('div', { className: 'delivery-editor' });
        const delivery = getDeliveryForVendor(vendor.vendorId);

        if (!delivery) {
            initDeliveryData([vendor]);
            return createDeliveryEditor(vendor);
        }

        const header = Utils.createElement('div', { className: 'delivery-editor-header' });
        header.innerHTML = `
            <div class="editor-delivery-vendor">${vendor.vendorName}</div>
            <div class="services-count">${delivery.services.length} خدمة</div>
        `;

        const servicesList = Utils.createElement('div', { className: 'services-list-editor' });
        
        if (delivery.services.length === 0) {
            servicesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">لا توجد خدمات توصيل</p>';
        } else {
            delivery.services.forEach(service => {
                const serviceItem = Utils.createElement('div', { className: 'service-editor-item' });
                serviceItem.innerHTML = `
                    <input type="radio" 
                           name="delivery-${vendor.vendorId}" 
                           value="${service.serviceId}"
                           data-delivery-service-select
                           data-vendor-id="${vendor.vendorId}"
                           ${service.isSelected ? 'checked' : ''}>
                    <input type="text" 
                           class="service-name-input" 
                           value="${service.serviceName}" 
                           readonly>
                    <span style="color: var(--color-primary); font-weight: 600;">${service.servicePrice} ر.س</span>
                    <button class="btn-remove-service" 
                            data-remove-service
                            data-vendor-id="${vendor.vendorId}"
                            data-service-id="${service.serviceId}">حذف</button>
                `;
                servicesList.appendChild(serviceItem);
            });
        }

        const addButton = Utils.createElement('button', {
            className: 'btn-add-service',
            'data-add-service': '',
            'data-vendor-id': vendor.vendorId
        });
        addButton.textContent = 'إضافة خدمة توصيل';

        editor.appendChild(header);
        editor.appendChild(servicesList);
        editor.appendChild(addButton);

        return editor;
    } catch (error) {
        console.error('Error creating delivery editor:', error);
        return null;
    }
}

/**
 * Setup status control
 */
function setupStatusControl() {
    try {
        const statusInputs = document.querySelectorAll('input[name="order-status"]');
        statusInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const statusId = e.target.value;
                if (setCurrentOrderStatus(statusId)) {
                    Utils.showSuccess(`تم تغيير حالة الطلب إلى: ${getStatusById(statusId).name}`);
                }
            });
        });
    } catch (error) {
        console.error('Error setting up status control:', error);
    }
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    try {
        const applyBtn = Utils.getElement('btn-apply-changes');
        const resetBtn = Utils.getElement('btn-reset');
        const simulateBtn = Utils.getElement('btn-simulate-shortage');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                applyChanges();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                resetTestData();
            });
        }

        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                simulateShortage();
                renderVendorEditors();
                renderStepper();
                Utils.showSuccess('تم محاكاة النقص في المنتجات');
            });
        }
    } catch (error) {
        console.error('Error setting up action buttons:', error);
    }
}

/**
 * Apply changes
 */
function applyChanges() {
    try {
        // All changes are applied in real-time, so this just refreshes the display
        renderStepper();
        renderVendorEditors();
        renderDeliveryEditors();
        Utils.showSuccess('تم تطبيق التغييرات');
    } catch (error) {
        console.error('Error applying changes:', error);
        Utils.showWarning('حدث خطأ في تطبيق التغييرات', 'error');
    }
}

/**
 * Reset test data
 */
function resetTestData() {
    try {
        if (confirm('هل أنت متأكد من إعادة ضبط جميع البيانات؟')) {
            initVendorsData(1);
            const vendors = getAllVendors();
            initDeliveryData(vendors);
            setCurrentOrderStatus('REVIEW');
            setCurrentUserRole(UserRoles.BUYER);

            // Reset UI
            const countInput = Utils.getElement('vendor-count');
            if (countInput) countInput.value = 1;

            const roleInputs = document.querySelectorAll('input[name="user-role"]');
            roleInputs.forEach(input => {
                if (input.value === UserRoles.BUYER) {
                    input.checked = true;
                }
            });

            const statusInputs = document.querySelectorAll('input[name="order-status"]');
            statusInputs.forEach(input => {
                if (input.value === 'REVIEW') {
                    input.checked = true;
                }
            });

            renderVendorEditors();
            renderDeliveryEditors();
            renderStepper();
            updateUIForRole();

            Utils.showSuccess('تم إعادة ضبط البيانات');
        }
    } catch (error) {
        console.error('Error resetting test data:', error);
        Utils.showWarning('حدث خطأ في إعادة ضبط البيانات', 'error');
    }
}

/**
 * Load test data
 */
function loadTestData() {
    try {
        renderVendorEditors();
        renderDeliveryEditors();
        renderStepper();
    } catch (error) {
        console.error('Error loading test data:', error);
    }
}

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            initTestPanel();
        } catch (error) {
            console.error('Error initializing test panel:', error);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTestPanel,
        renderVendorEditors,
        renderDeliveryEditors
    };
}

