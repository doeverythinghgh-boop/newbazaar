/* ============================================
   Order Status Map JS - Order States Definition
   ============================================ */

/**
 * Order Status Map
 * Defines all main order states with their properties
 */
const OrderStatusMap = {
    REVIEW: {
        id: 'REVIEW',
        name: 'مراجعة',
        description: 'الطلب قيد المراجعة',
        color: '#ffa500',
        icon: '📋',
        order: 1
    },
    CONFIRMED: {
        id: 'CONFIRMED',
        name: 'مؤكد',
        description: 'تم تأكيد الطلب',
        color: '#4caf50',
        icon: '✓',
        order: 2
    },
    SHIPPED: {
        id: 'SHIPPED',
        name: 'شُحن',
        description: 'تم شحن الطلب',
        color: '#2196f3',
        icon: '🚚',
        order: 3
    },
    DELIVERED: {
        id: 'DELIVERED',
        name: 'تم التسليم',
        description: 'تم تسليم الطلب',
        color: '#00bcd4',
        icon: '📦',
        order: 4
    },
    CANCELLED: {
        id: 'CANCELLED',
        name: 'ملغي',
        description: 'تم إلغاء الطلب',
        color: '#f44336',
        icon: '✖',
        order: 5
    },
    REJECTED: {
        id: 'REJECTED',
        name: 'مرفوض',
        description: 'تم رفض الطلب',
        color: '#e91e63',
        icon: '❌',
        order: 6
    },
    RETURNED: {
        id: 'RETURNED',
        name: 'مرتجع',
        description: 'تم إرجاع الطلب',
        color: '#9c27b0',
        icon: '↩',
        order: 7
    }
};

/**
 * Get status by ID
 */
function getStatusById(statusId) {
    try {
        return OrderStatusMap[statusId] || null;
    } catch (error) {
        console.error('Error getting status by ID:', error);
        return null;
    }
}

/**
 * Get all statuses in order
 */
function getAllStatuses() {
    try {
        return Object.values(OrderStatusMap).sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('Error getting all statuses:', error);
        return [];
    }
}

/**
 * Get statuses up to a certain status
 */
function getStatusesUpTo(statusId) {
    try {
        const targetStatus = getStatusById(statusId);
        if (!targetStatus) return [];
        
        return getAllStatuses().filter(status => status.order <= targetStatus.order);
    } catch (error) {
        console.error('Error getting statuses up to:', error);
        return [];
    }
}

/**
 * Check if status is valid
 */
function isValidStatus(statusId) {
    try {
        return statusId in OrderStatusMap;
    } catch (error) {
        console.error('Error validating status:', error);
        return false;
    }
}

/**
 * Get next status
 */
function getNextStatus(currentStatusId) {
    try {
        const currentStatus = getStatusById(currentStatusId);
        if (!currentStatus) return null;
        
        const allStatuses = getAllStatuses();
        const currentIndex = allStatuses.findIndex(s => s.id === currentStatusId);
        
        if (currentIndex < allStatuses.length - 1) {
            return allStatuses[currentIndex + 1];
        }
        return null;
    } catch (error) {
        console.error('Error getting next status:', error);
        return null;
    }
}

/**
 * Get previous status
 */
function getPreviousStatus(currentStatusId) {
    try {
        const currentStatus = getStatusById(currentStatusId);
        if (!currentStatus) return null;
        
        const allStatuses = getAllStatuses();
        const currentIndex = allStatuses.findIndex(s => s.id === currentStatusId);
        
        if (currentIndex > 0) {
            return allStatuses[currentIndex - 1];
        }
        return null;
    } catch (error) {
        console.error('Error getting previous status:', error);
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OrderStatusMap,
        getStatusById,
        getAllStatuses,
        getStatusesUpTo,
        isValidStatus,
        getNextStatus,
        getPreviousStatus
    };
}

