/* ============================================
   Delivery JS - Delivery Services Management
   ============================================ */

/**
 * Delivery services data structure
 */
let deliveryData = {};

/**
 * Initialize delivery data for vendors
 */
function initDeliveryData(vendors) {
    try {
        deliveryData = {};
        vendors.forEach(vendor => {
            deliveryData[vendor.vendorId] = {
                vendorId: vendor.vendorId,
                vendorName: vendor.vendorName,
                services: [],
                selectedServiceId: null
            };
        });
        Utils.log('Initialized delivery data');
        return deliveryData;
    } catch (error) {
        console.error('Error initializing delivery data:', error);
        return {};
    }
}

/**
 * Get delivery data for vendor
 */
function getDeliveryForVendor(vendorId) {
    try {
        return deliveryData[vendorId] || null;
    } catch (error) {
        console.error('Error getting delivery for vendor:', error);
        return null;
    }
}

/**
 * Get all delivery data
 */
function getAllDeliveryData() {
    try {
        return deliveryData;
    } catch (error) {
        console.error('Error getting all delivery data:', error);
        return {};
    }
}

/**
 * Add delivery service to vendor
 */
function addDeliveryService(vendorId, serviceName, servicePrice = 0) {
    try {
        if (!deliveryData[vendorId]) {
            Utils.showWarning('البائع غير موجود', 'error');
            return false;
        }

        // Check permissions
        if (!hasPermission('canEditDelivery')) {
            Utils.showWarning('ليس لديك صلاحية لتعديل خدمات التوصيل', 'error');
            return false;
        }

        const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const service = {
            serviceId,
            serviceName,
            servicePrice: parseFloat(servicePrice) || 0,
            isSelected: false
        };

        deliveryData[vendorId].services.push(service);
        Utils.log(`Added delivery service to vendor ${vendorId}`, service);

        // Dispatch update event
        const event = new CustomEvent('deliveryUpdated', { detail: { vendorId } });
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error adding delivery service:', error);
        Utils.showWarning('حدث خطأ في إضافة خدمة التوصيل', 'error');
        return false;
    }
}

/**
 * Remove delivery service
 */
function removeDeliveryService(vendorId, serviceId) {
    try {
        if (!deliveryData[vendorId]) {
            Utils.showWarning('البائع غير موجود', 'error');
            return false;
        }

        // Check permissions
        if (!hasPermission('canEditDelivery')) {
            Utils.showWarning('ليس لديك صلاحية لحذف خدمات التوصيل', 'error');
            return false;
        }

        const services = deliveryData[vendorId].services;
        const index = services.findIndex(s => s.serviceId === serviceId);
        
        if (index === -1) {
            Utils.showWarning('خدمة التوصيل غير موجودة', 'error');
            return false;
        }

        // If removing selected service, clear selection
        if (services[index].isSelected) {
            deliveryData[vendorId].selectedServiceId = null;
        }

        services.splice(index, 1);
        Utils.log(`Removed delivery service from vendor ${vendorId}`);

        // Dispatch update event
        const event = new CustomEvent('deliveryUpdated', { detail: { vendorId } });
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error removing delivery service:', error);
        Utils.showWarning('حدث خطأ في حذف خدمة التوصيل', 'error');
        return false;
    }
}

/**
 * Select delivery service for vendor
 */
function selectDeliveryService(vendorId, serviceId) {
    try {
        if (!deliveryData[vendorId]) {
            Utils.showWarning('البائع غير موجود', 'error');
            return false;
        }

        // Check permissions
        if (!hasPermission('canEditDelivery')) {
            Utils.showWarning('ليس لديك صلاحية لاختيار خدمة التوصيل', 'error');
            return false;
        }

        const services = deliveryData[vendorId].services;
        const service = services.find(s => s.serviceId === serviceId);
        
        if (!service) {
            Utils.showWarning('خدمة التوصيل غير موجودة', 'error');
            return false;
        }

        // Unselect all services
        services.forEach(s => s.isSelected = false);

        // Select the service
        service.isSelected = true;
        deliveryData[vendorId].selectedServiceId = serviceId;

        // Update delivery sub steps
        updateDeliverySubSteps(vendorId);

        Utils.log(`Selected delivery service for vendor ${vendorId}`, service);

        // Dispatch update event
        const event = new CustomEvent('deliveryServiceSelected', { detail: { vendorId, serviceId } });
        document.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error('Error selecting delivery service:', error);
        Utils.showWarning('حدث خطأ في اختيار خدمة التوصيل', 'error');
        return false;
    }
}

/**
 * Update delivery sub steps
 */
function updateDeliverySubSteps(vendorId) {
    try {
        const delivery = getDeliveryForVendor(vendorId);
        if (!delivery) return;

        const subSteps = [];

        // Step 1: Services available
        if (delivery.services.length === 0) {
            subSteps.push({
                id: 'no-services',
                title: 'لا توجد خدمات توصيل',
                description: 'لم يتم العثور على خدمات توصيل متاحة',
                status: 'failed',
                icon: '✖',
                timestamp: new Date().toISOString()
            });
        } else {
            subSteps.push({
                id: 'services-available',
                title: 'خدمات التوصيل متاحة',
                description: `عدد الخدمات: ${delivery.services.length}`,
                status: 'completed',
                icon: '✓',
                timestamp: new Date().toISOString()
            });

            // Step 2: Service selection
            if (delivery.selectedServiceId) {
                const selectedService = delivery.services.find(s => s.serviceId === delivery.selectedServiceId);
                subSteps.push({
                    id: 'service-selected',
                    title: 'تم اختيار خدمة التوصيل',
                    description: selectedService ? selectedService.serviceName : 'خدمة غير معروفة',
                    status: 'completed',
                    icon: '✓',
                    timestamp: new Date().toISOString()
                });
            } else {
                subSteps.push({
                    id: 'service-pending',
                    title: 'اختيار خدمة التوصيل',
                    description: 'يرجى اختيار خدمة التوصيل',
                    status: 'pending',
                    icon: '⚠',
                    timestamp: new Date().toISOString()
                });
            }
        }

        delivery.subSteps = subSteps;
    } catch (error) {
        console.error('Error updating delivery sub steps:', error);
    }
}

/**
 * Initialize default services for vendor
 */
function initDefaultServices(vendorId, count = 1) {
    try {
        if (!deliveryData[vendorId]) {
            return false;
        }

        // Clear existing services
        deliveryData[vendorId].services = [];

        // Add default services
        const serviceNames = ['توصيل سريع', 'توصيل عادي', 'توصيل مجاني', 'توصيل سريع جداً'];
        for (let i = 0; i < Math.min(count, serviceNames.length); i++) {
            addDeliveryService(
                vendorId,
                serviceNames[i],
                Math.floor(Math.random() * 50) + 10
            );
        }

        // Auto-select first service if only one
        if (deliveryData[vendorId].services.length === 1) {
            selectDeliveryService(vendorId, deliveryData[vendorId].services[0].serviceId);
        }

        return true;
    } catch (error) {
        console.error('Error initializing default services:', error);
        return false;
    }
}

// Listen for vendor updates
if (typeof document !== 'undefined') {
    document.addEventListener('vendorUpdated', (e) => {
        try {
            const { vendorId } = e.detail;
            const delivery = getDeliveryForVendor(vendorId);
            if (!delivery) {
                // Initialize delivery data for new vendor
                const vendor = getVendorById(vendorId);
                if (vendor) {
                    initDeliveryData([vendor]);
                }
            }
        } catch (error) {
            console.error('Error handling vendor update:', error);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDeliveryData,
        getDeliveryForVendor,
        getAllDeliveryData,
        addDeliveryService,
        removeDeliveryService,
        selectDeliveryService,
        updateDeliverySubSteps,
        initDefaultServices
    };
}

