/* ============================================
   Stepper JS - Progress Bar Management
   ============================================ */

/**
 * Current order status
 */
let currentOrderStatus = 'REVIEW';

/**
 * Set current order status
 */
function setCurrentOrderStatus(statusId) {
    try {
        if (!isValidStatus(statusId)) {
            Utils.showWarning('حالة الطلب غير صحيحة', 'error');
            return false;
        }

        // Check permissions
        if (!canChangeStatus(currentOrderStatus, statusId)) {
            Utils.showWarning('ليس لديك صلاحية لتغيير الحالة إلى هذه المرحلة', 'error');
            return false;
        }

        currentOrderStatus = statusId;
        Utils.log(`Order status changed to: ${statusId}`);

        // Render stepper
        renderStepper();

        // Dispatch status change event
        const event = new CustomEvent('orderStatusChanged', { detail: { statusId } });
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error setting order status:', error);
        Utils.showWarning('حدث خطأ في تغيير حالة الطلب', 'error');
        return false;
    }
}

/**
 * Get current order status
 */
function getCurrentOrderStatus() {
    try {
        return currentOrderStatus;
    } catch (error) {
        console.error('Error getting current order status:', error);
        return 'REVIEW';
    }
}

/**
 * Render stepper component
 */
function renderStepper(containerId = 'stepper-container') {
    try {
        const container = Utils.getElement(containerId);
        if (!container) {
            console.warn(`Stepper container with ID "${containerId}" not found`);
            return;
        }

        const allStatuses = getAllStatuses();
        const currentStatus = getStatusById(currentOrderStatus);

        // Create stepper wrapper
        let wrapper = container.querySelector('.stepper-wrapper');
        if (!wrapper) {
            wrapper = Utils.createElement('div', { className: 'stepper-wrapper' });
            container.appendChild(wrapper);
        } else {
            wrapper.innerHTML = '';
        }

        // Create step items
        allStatuses.forEach((status, index) => {
            const stepItem = createStepItem(status, index, allStatuses.length);
            wrapper.appendChild(stepItem);
        });

        // Add order summary
        renderOrderSummary(container);

        Utils.log('Stepper rendered');
    } catch (error) {
        console.error('Error rendering stepper:', error);
    }
}

/**
 * Create step item element
 */
function createStepItem(status, index, totalSteps) {
    try {
        const stepItem = Utils.createElement('div', {
            className: 'step-item',
            'data-status': status.id
        });

        // Determine step state
        const currentStatus = getStatusById(currentOrderStatus);
        let stepClass = '';
        if (status.order < currentStatus.order) {
            stepClass = 'completed';
        } else if (status.order === currentStatus.order) {
            stepClass = 'active';
        }
        stepClass += ` ${status.id.toLowerCase()}`;

        stepItem.className = `step-item ${stepClass}`;

        // Step circle
        const circle = Utils.createElement('div', {
            className: 'step-circle',
            'aria-label': status.name,
            role: 'button',
            tabIndex: '0'
        });
        circle.textContent = status.icon;

        // Add click handler
        circle.addEventListener('click', () => {
            handleStepClick(status.id);
        });

        circle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStepClick(status.id);
            }
        });

        // Step label
        const label = Utils.createElement('div', { className: 'step-label' });
        label.textContent = status.name;

        // Step description
        const description = Utils.createElement('div', { className: 'step-description' });
        description.textContent = status.description;

        // Append to step item
        stepItem.appendChild(circle);
        stepItem.appendChild(label);
        stepItem.appendChild(description);

        return stepItem;
    } catch (error) {
        console.error('Error creating step item:', error);
        return null;
    }
}

/**
 * Handle step click
 */
function handleStepClick(statusId) {
    try {
        // Try to change status
        if (setCurrentOrderStatus(statusId)) {
            // Show vendors if status is CONFIRMED or later
            if (statusId === 'CONFIRMED' || getStatusById(statusId).order > 2) {
                showVendorsForStep(statusId);
            } else {
                hideVendorsForStep();
            }
        }
    } catch (error) {
        console.error('Error handling step click:', error);
    }
}

/**
 * Show vendors for step
 */
function showVendorsForStep(statusId) {
    try {
        const allStepItems = document.querySelectorAll('.step-item');
        allStepItems.forEach(item => {
            const vendorsSection = item.querySelector('.step-vendors');
            if (vendorsSection) {
                vendorsSection.classList.remove('show');
            }
        });

        const currentStepItem = document.querySelector(`[data-status="${statusId}"]`);
        if (!currentStepItem) return;

        let vendorsSection = currentStepItem.querySelector('.step-vendors');
        if (!vendorsSection) {
            vendorsSection = createVendorsSection();
            currentStepItem.appendChild(vendorsSection);
        }

        renderVendorsList(vendorsSection);
        vendorsSection.classList.add('show');
    } catch (error) {
        console.error('Error showing vendors for step:', error);
    }
}

/**
 * Hide vendors for step
 */
function hideVendorsForStep() {
    try {
        const allVendorsSections = document.querySelectorAll('.step-vendors');
        allVendorsSections.forEach(section => {
            section.classList.remove('show');
        });
    } catch (error) {
        console.error('Error hiding vendors:', error);
    }
}

/**
 * Create vendors section
 */
function createVendorsSection() {
    try {
        const section = Utils.createElement('div', { className: 'step-vendors' });
        const list = Utils.createElement('ul', { className: 'vendors-list' });
        section.appendChild(list);
        return section;
    } catch (error) {
        console.error('Error creating vendors section:', error);
        return null;
    }
}

/**
 * Render vendors list
 */
function renderVendorsList(container) {
    try {
        const list = container.querySelector('.vendors-list');
        if (!list) return;

        list.innerHTML = '';

        const vendors = getAllVendors();
        vendors.forEach(vendor => {
            const item = Utils.createElement('li', {
                className: `vendor-item ${vendor.statusPerVendor.toLowerCase()}`
            });

            const vendorName = Utils.createElement('strong');
            vendorName.textContent = vendor.vendorName;

            const vendorStatus = Utils.createElement('span', {
                style: { marginRight: '1rem', color: 'var(--text-secondary)' }
            });
            vendorStatus.textContent = `(${vendor.statusPerVendor === 'FULL' ? 'كامل' : vendor.statusPerVendor === 'PARTIAL' ? 'جزئي' : 'فشل'})`;

            item.appendChild(vendorName);
            item.appendChild(vendorStatus);
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error rendering vendors list:', error);
    }
}

/**
 * Render order summary
 */
function renderOrderSummary(container) {
    try {
        let summary = container.querySelector('.order-summary');
        if (!summary) {
            summary = Utils.createElement('div', { className: 'order-summary' });
            container.appendChild(summary);
        }

        const orderData = getOrderSummary();

        summary.innerHTML = `
            <div class="summary-title">ملخص الطلب</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">المنتجات المطلوبة</div>
                    <div class="summary-value">${Utils.formatNumber(orderData.totalRequested)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">عدد البائعين</div>
                    <div class="summary-value">${orderData.totalVendors}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">نجاح كامل</div>
                    <div class="summary-value" style="color: var(--color-full)">${orderData.statusCounts.FULL}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">نجاح جزئي</div>
                    <div class="summary-value" style="color: var(--color-partial)">${orderData.statusCounts.PARTIAL}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">فشل</div>
                    <div class="summary-value" style="color: var(--color-fail)">${orderData.statusCounts.FAIL}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering order summary:', error);
    }
}

// Listen for updates
if (typeof document !== 'undefined') {
    document.addEventListener('vendorsUpdated', () => {
        try {
            renderStepper();
        } catch (error) {
            console.error('Error handling vendors update:', error);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        try {
            renderStepper();
        } catch (error) {
            console.error('Error initializing stepper:', error);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setCurrentOrderStatus,
        getCurrentOrderStatus,
        renderStepper
    };
}

