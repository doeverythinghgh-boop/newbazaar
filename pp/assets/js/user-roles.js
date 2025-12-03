/* ============================================
   User Roles JS - Role Permissions Management
   ============================================ */

/**
 * User Roles and Permissions
 */
const UserRoles = {
    BUYER: 'buyer',
    VENDOR: 'vendor',
    SHIPPER: 'shipper',
    ADMIN: 'admin'
};

/**
 * Current user role
 */
let currentUserRole = UserRoles.BUYER;

/**
 * Permissions configuration
 */
const Permissions = {
    [UserRoles.BUYER]: {
        canEditRequestedQty: true,
        canEditAvailableQty: false,
        canChangeStatus: false,
        canChangeStatusFromReview: false,
        canChangeStatusToConfirmed: false,
        canChangeShipped: false,
        canChangeDelivered: false,
        canCancel: false,
        canReject: false,
        canReturn: false,
        canEditAnyVendor: false,
        canEditOwnVendor: false,
        canEditDelivery: false
    },
    [UserRoles.VENDOR]: {
        canEditRequestedQty: false,
        canEditAvailableQty: true,
        canChangeStatus: true,
        canChangeStatusFromReview: true,
        canChangeStatusToConfirmed: true,
        canChangeShipped: false,
        canChangeDelivered: false,
        canCancel: false,
        canReject: false,
        canReturn: false,
        canEditAnyVendor: false,
        canEditOwnVendor: true,
        canEditDelivery: false
    },
    [UserRoles.SHIPPER]: {
        canEditRequestedQty: false,
        canEditAvailableQty: false,
        canChangeStatus: true,
        canChangeStatusFromReview: false,
        canChangeStatusToConfirmed: false,
        canChangeShipped: true,
        canChangeDelivered: true,
        canCancel: false,
        canReject: false,
        canReturn: false,
        canEditAnyVendor: false,
        canEditOwnVendor: false,
        canEditDelivery: true
    },
    [UserRoles.ADMIN]: {
        canEditRequestedQty: true,
        canEditAvailableQty: true,
        canChangeStatus: true,
        canChangeStatusFromReview: true,
        canChangeStatusToConfirmed: true,
        canChangeShipped: true,
        canChangeDelivered: true,
        canCancel: true,
        canReject: true,
        canReturn: true,
        canEditAnyVendor: true,
        canEditOwnVendor: true,
        canEditDelivery: true
    }
};

/**
 * Get current user role
 */
function getCurrentUserRole() {
    try {
        return currentUserRole;
    } catch (error) {
        console.error('Error getting current user role:', error);
        return UserRoles.BUYER;
    }
}

/**
 * Set current user role
 */
function setCurrentUserRole(role) {
    try {
        if (Object.values(UserRoles).includes(role)) {
            currentUserRole = role;
            Utils.log(`User role changed to: ${role}`);
            updateUIForRole();
            return true;
        } else {
            Utils.showWarning('دور المستخدم غير صحيح', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error setting user role:', error);
        Utils.showWarning('حدث خطأ في تغيير دور المستخدم', 'error');
        return false;
    }
}

/**
 * Check if user has permission
 */
function hasPermission(permission) {
    try {
        const role = getCurrentUserRole();
        const rolePermissions = Permissions[role];
        if (!rolePermissions) {
            console.warn(`No permissions found for role: ${role}`);
            return false;
        }
        return rolePermissions[permission] === true;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Check if user can change status from current to target
 */
function canChangeStatus(currentStatus, targetStatus) {
    try {
        const role = getCurrentUserRole();
        const rolePermissions = Permissions[role];

        // Admin can change to any status
        if (role === UserRoles.ADMIN) {
            return true;
        }

        // Buyer cannot change status after REVIEW
        if (role === UserRoles.BUYER && currentStatus !== 'REVIEW') {
            return false;
        }

        // Vendor can only change from REVIEW to CONFIRMED
        if (role === UserRoles.VENDOR) {
            return currentStatus === 'REVIEW' && targetStatus === 'CONFIRMED';
        }

        // Shipper can only change SHIPPED and DELIVERED
        if (role === UserRoles.SHIPPER) {
            return targetStatus === 'SHIPPED' || targetStatus === 'DELIVERED';
        }

        return false;
    } catch (error) {
        console.error('Error checking status change permission:', error);
        return false;
    }
}

/**
 * Check if user can edit vendor data
 */
function canEditVendor(vendorId) {
    try {
        const role = getCurrentUserRole();
        
        if (hasPermission('canEditAnyVendor')) {
            return true;
        }
        
        if (hasPermission('canEditOwnVendor')) {
            // In real app, check if vendorId matches user's vendor
            // For now, return true for vendor role
            return role === UserRoles.VENDOR;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking vendor edit permission:', error);
        return false;
    }
}

/**
 * Update UI elements based on current role
 */
function updateUIForRole() {
    try {
        const role = getCurrentUserRole();
        Utils.log(`Updating UI for role: ${role}`);

        // Update all edit buttons
        const editButtons = document.querySelectorAll('[data-permission]');
        editButtons.forEach(button => {
            const permission = button.getAttribute('data-permission');
            if (hasPermission(permission)) {
                button.disabled = false;
                button.style.opacity = '1';
            } else {
                button.disabled = true;
                button.style.opacity = '0.5';
            }
        });

        // Update all input fields
        const editInputs = document.querySelectorAll('[data-edit-permission]');
        editInputs.forEach(input => {
            const permission = input.getAttribute('data-edit-permission');
            if (hasPermission(permission)) {
                input.disabled = false;
                input.style.opacity = '1';
            } else {
                input.disabled = true;
                input.style.opacity = '0.5';
            }
        });

        // Dispatch custom event for other modules
        const event = new CustomEvent('roleChanged', { detail: { role } });
        document.dispatchEvent(event);
    } catch (error) {
        console.error('Error updating UI for role:', error);
    }
}

/**
 * Get role display name in Arabic
 */
function getRoleDisplayName(role) {
    try {
        const names = {
            [UserRoles.BUYER]: 'مشتري',
            [UserRoles.VENDOR]: 'بائع',
            [UserRoles.SHIPPER]: 'شركة شحن',
            [UserRoles.ADMIN]: 'إدارة'
        };
        return names[role] || role;
    } catch (error) {
        console.error('Error getting role display name:', error);
        return role;
    }
}

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            updateUIForRole();
        } catch (error) {
            console.error('Error initializing user roles:', error);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UserRoles,
        Permissions,
        getCurrentUserRole,
        setCurrentUserRole,
        hasPermission,
        canChangeStatus,
        canEditVendor,
        updateUIForRole,
        getRoleDisplayName
    };
}

