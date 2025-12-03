/* ============================================
   Vendors JS - Vendor Data Management
   ============================================ */

/**
 * Vendors data structure
 */
let vendorsData = [];

/**
 * Initialize vendors data
 */
function initVendorsData(count = 1) {
    try {
        vendorsData = [];
        for (let i = 1; i <= count; i++) {
            vendorsData.push({
                vendorId: `vendor-${i}`,
                vendorName: `بائع ${i}`,
                requestedQty: Math.floor(Math.random() * 100) + 10,
                availableQty: Math.floor(Math.random() * 100) + 10,
                subSteps: [],
                statusPerVendor: 'FULL',
                products: []
            });
        }
        Utils.log(`Initialized ${count} vendors`);
        return vendorsData;
    } catch (error) {
        console.error('Error initializing vendors data:', error);
        return [];
    }
}

/**
 * Get all vendors
 */
function getAllVendors() {
    try {
        return vendorsData;
    } catch (error) {
        console.error('Error getting all vendors:', error);
        return [];
    }
}

/**
 * Get vendor by ID
 */
function getVendorById(vendorId) {
    try {
        return vendorsData.find(v => v.vendorId === vendorId) || null;
    } catch (error) {
        console.error('Error getting vendor by ID:', error);
        return null;
    }
}

/**
 * Update vendor data
 */
function updateVendor(vendorId, updates) {
    try {
        const vendor = getVendorById(vendorId);
        if (!vendor) {
            Utils.showWarning('البائع غير موجود', 'error');
            return false;
        }

        // Check permissions
        if (!canEditVendor(vendorId)) {
            Utils.showWarning('ليس لديك صلاحية لتعديل بيانات هذا البائع', 'error');
            return false;
        }

        // Validate updates
        if (updates.requestedQty !== undefined) {
            if (!Utils.validateNonNegativeInteger(updates.requestedQty)) {
                Utils.showWarning('الكمية المطلوبة يجب أن تكون رقماً صحيحاً غير سالب', 'error');
                return false;
            }
            vendor.requestedQty = parseInt(updates.requestedQty, 10);
        }

        if (updates.availableQty !== undefined) {
            if (!Utils.validateNonNegativeInteger(updates.availableQty)) {
                Utils.showWarning('الكمية المتوفرة يجب أن تكون رقماً صحيحاً غير سالب', 'error');
                return false;
            }
            vendor.availableQty = parseInt(updates.availableQty, 10);
        }

        if (updates.vendorName !== undefined) {
            vendor.vendorName = updates.vendorName;
        }

        // Recalculate status
        calculateVendorStatus(vendorId);

        // Update sub steps
        updateVendorSubSteps(vendorId);

        Utils.log(`Vendor ${vendorId} updated`, updates);
        
        // Dispatch update event
        const event = new CustomEvent('vendorUpdated', { detail: { vendorId, vendor } });
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error updating vendor:', error);
        Utils.showWarning('حدث خطأ في تحديث بيانات البائع', 'error');
        return false;
    }
}

/**
 * Calculate vendor status based on quantities
 */
function calculateVendorStatus(vendorId) {
    try {
        const vendor = getVendorById(vendorId);
        if (!vendor) return null;

        if (vendor.availableQty >= vendor.requestedQty) {
            vendor.statusPerVendor = 'FULL';
        } else if (vendor.availableQty > 0) {
            vendor.statusPerVendor = 'PARTIAL';
        } else {
            vendor.statusPerVendor = 'FAIL';
        }

        return vendor.statusPerVendor;
    } catch (error) {
        console.error('Error calculating vendor status:', error);
        return null;
    }
}

/**
 * Update vendor sub steps
 */
function updateVendorSubSteps(vendorId) {
    try {
        const vendor = getVendorById(vendorId);
        if (!vendor) return;

        const subSteps = [];

        // Step 1: Receive product list
        subSteps.push({
            id: 'receive-list',
            title: 'استلام قائمة المنتجات',
            description: 'تم استلام قائمة المنتجات المطلوبة',
            status: 'completed',
            icon: '✓',
            timestamp: new Date().toISOString()
        });

        // Step 2: Compare quantities
        subSteps.push({
            id: 'compare-qty',
            title: 'مقارنة الكميات',
            description: `المطلوب: ${vendor.requestedQty} | المتوفر: ${vendor.availableQty}`,
            status: 'completed',
            icon: '✓',
            timestamp: new Date().toISOString()
        });

        // Step 3: Suggest alternatives if needed
        if (vendor.availableQty < vendor.requestedQty) {
            subSteps.push({
                id: 'suggest-alternatives',
                title: 'اقتراح بدائل',
                description: `نقص في الكمية: ${vendor.requestedQty - vendor.availableQty} وحدة`,
                status: vendor.statusPerVendor === 'PARTIAL' ? 'pending' : 'failed',
                icon: vendor.statusPerVendor === 'PARTIAL' ? '⚠' : '✖',
                timestamp: new Date().toISOString()
            });
        }

        // Step 4: Make decision
        subSteps.push({
            id: 'make-decision',
            title: 'اتخاذ قرار',
            description: `القرار: ${vendor.statusPerVendor === 'FULL' ? 'قبول كامل' : vendor.statusPerVendor === 'PARTIAL' ? 'قبول جزئي' : 'رفض'}`,
            status: vendor.statusPerVendor === 'FAIL' ? 'failed' : 'completed',
            icon: vendor.statusPerVendor === 'FULL' ? '✓' : vendor.statusPerVendor === 'PARTIAL' ? '⚠' : '✖',
            timestamp: new Date().toISOString()
        });

        vendor.subSteps = subSteps;
    } catch (error) {
        console.error('Error updating vendor sub steps:', error);
    }
}

/**
 * Get order summary
 */
function getOrderSummary() {
    try {
        const totalRequested = vendorsData.reduce((sum, v) => sum + v.requestedQty, 0);
        const totalAvailable = vendorsData.reduce((sum, v) => sum + v.availableQty, 0);
        const totalVendors = vendorsData.length;
        
        const statusCounts = {
            FULL: vendorsData.filter(v => v.statusPerVendor === 'FULL').length,
            PARTIAL: vendorsData.filter(v => v.statusPerVendor === 'PARTIAL').length,
            FAIL: vendorsData.filter(v => v.statusPerVendor === 'FAIL').length
        };

        return {
            totalRequested,
            totalAvailable,
            totalVendors,
            statusCounts,
            missingQty: totalRequested - totalAvailable
        };
    } catch (error) {
        console.error('Error getting order summary:', error);
        return {
            totalRequested: 0,
            totalAvailable: 0,
            totalVendors: 0,
            statusCounts: { FULL: 0, PARTIAL: 0, FAIL: 0 },
            missingQty: 0
        };
    }
}

/**
 * Simulate shortage for vendors
 */
function simulateShortage() {
    try {
        vendorsData.forEach(vendor => {
            if (vendor.availableQty >= vendor.requestedQty) {
                // Reduce available quantity by random amount (10-30%)
                const reduction = Math.floor(vendor.availableQty * (0.1 + Math.random() * 0.2));
                vendor.availableQty = Math.max(0, vendor.availableQty - reduction);
                calculateVendorStatus(vendor.vendorId);
                updateVendorSubSteps(vendor.vendorId);
            }
        });

        Utils.log('Simulated shortage for vendors');
        
        // Dispatch update event
        const event = new CustomEvent('vendorsUpdated');
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error simulating shortage:', error);
        return false;
    }
}

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            initVendorsData(1);
        } catch (error) {
            console.error('Error initializing vendors:', error);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initVendorsData,
        getAllVendors,
        getVendorById,
        updateVendor,
        calculateVendorStatus,
        updateVendorSubSteps,
        getOrderSummary,
        simulateShortage
    };
}

