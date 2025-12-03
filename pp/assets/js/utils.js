/* ============================================
   Utils JS - Helper Functions
   ============================================ */

/**
 * Validation Functions
 */
const Utils = {
    /**
     * Validate if value is a positive integer
     */
    validatePositiveInteger(value) {
        try {
            const num = parseInt(value, 10);
            return !isNaN(num) && num > 0;
        } catch (error) {
            console.error('Error validating positive integer:', error);
            return false;
        }
    },

    /**
     * Validate if value is a non-negative integer
     */
    validateNonNegativeInteger(value) {
        try {
            const num = parseInt(value, 10);
            return !isNaN(num) && num >= 0;
        } catch (error) {
            console.error('Error validating non-negative integer:', error);
            return false;
        }
    },

    /**
     * Validate if value is a valid number
     */
    validateNumber(value) {
        try {
            return !isNaN(parseFloat(value)) && isFinite(value);
        } catch (error) {
            console.error('Error validating number:', error);
            return false;
        }
    },

    /**
     * Format number with thousand separators
     */
    formatNumber(num) {
        try {
            return new Intl.NumberFormat('ar-SA').format(num);
        } catch (error) {
            console.error('Error formatting number:', error);
            return num.toString();
        }
    },

    /**
     * Format date to Arabic format
     */
    formatDate(date) {
        try {
            if (!date) return '';
            const d = new Date(date);
            return new Intl.DateTimeFormat('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(d);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    },

    /**
     * Show UI warning/error message
     */
    showWarning(message, type = 'warning') {
        try {
            // Remove existing warnings
            const existing = document.querySelector('.ui-warning');
            if (existing) {
                existing.remove();
            }

            // Create warning element
            const warning = document.createElement('div');
            warning.className = `ui-warning ui-warning-${type}`;
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'error' ? '#f44336' : '#ff9800'};
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: 600;
                max-width: 90%;
                text-align: center;
            `;
            warning.textContent = message;

            document.body.appendChild(warning);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.style.opacity = '0';
                    warning.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => warning.remove(), 300);
                }
            }, 5000);
        } catch (error) {
            console.error('Error showing warning:', error);
        }
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        try {
            const existing = document.querySelector('.ui-success');
            if (existing) {
                existing.remove();
            }

            const success = document.createElement('div');
            success.className = 'ui-success';
            success.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4caf50;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: 600;
                max-width: 90%;
                text-align: center;
            `;
            success.textContent = message;

            document.body.appendChild(success);

            setTimeout(() => {
                if (success.parentNode) {
                    success.style.opacity = '0';
                    success.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => success.remove(), 300);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing success:', error);
        }
    },

    /**
     * Log with timestamp
     */
    log(message, data = null) {
        try {
            const timestamp = new Date().toLocaleTimeString('ar-SA');
            console.log(`[${timestamp}] ${message}`, data || '');
        } catch (error) {
            console.error('Error logging:', error);
        }
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('Error deep cloning:', error);
            return obj;
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get element by ID safely
     */
    getElement(id) {
        try {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with ID "${id}" not found`);
            }
            return element;
        } catch (error) {
            console.error(`Error getting element "${id}":`, error);
            return null;
        }
    },

    /**
     * Create element with attributes
     */
    createElement(tag, attributes = {}, textContent = '') {
        try {
            const element = document.createElement(tag);
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'style' && typeof attributes[key] === 'object') {
                    Object.assign(element.style, attributes[key]);
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            if (textContent) {
                element.textContent = textContent;
            }
            return element;
        } catch (error) {
            console.error('Error creating element:', error);
            return null;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

