/**
 * AI Health Care Assistant - Main JavaScript
 * Handles global functionality and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeMobileMenu();
    initializeScrollEffects();
    initializeAccessibility();
});

/**
 * Mobile Menu Toggle
 */
function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isHidden = mobileMenu.style.display === 'none' || mobileMenu.style.display === '';

            if (isHidden) {
                mobileMenu.style.display = 'block';
                mobileMenuButton.setAttribute('aria-expanded', 'true');
            } else {
                mobileMenu.style.display = 'none';
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
                mobileMenu.style.display = 'none';
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

/**
 * Scroll Effects for Header
 */
function initializeScrollEffects() {
    const header = document.querySelector('.navigation-bar');

    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Accessibility Enhancements
 */
function initializeAccessibility() {
    // Skip to main content link
    const skipLink = document.querySelector('a[href="#main-content"]');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.getElementById('main-content');
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });
    }

    // Enhanced focus states
    const focusableElements = document.querySelectorAll('button, a, input, textarea, select');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--primary-blue)';
            this.style.outlineOffset = '2px';
        });

        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
}

/**
 * Utility Functions
 */

// Show loading state
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.setAttribute('aria-busy', 'true');
    }
}

// Hide loading state
function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Debounce function for input handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date for display
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('vi-VN', options);
}

// Check if user is online
function isOnline() {
    return navigator.onLine;
}

// Handle online/offline events
window.addEventListener('online', function() {
    showToast('Kết nối internet đã được khôi phục', 'success');
});

window.addEventListener('offline', function() {
    showToast('Mất kết nối internet. Một số tính năng có thể không khả dụng.', 'warning');
});

/**
 * Form Validation Helpers
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
    return re.test(phone);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

/**
 * Emergency Contact Helper
 */
function callEmergency() {
    if (confirm('Bạn có muốn gọi cấp cứu 115 không?')) {
        window.location.href = 'tel:115';
    }
}

/**
 * Health Data Formatting
 */
function formatBloodPressure(systolic, diastolic) {
    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);

    let status = 'normal';
    let statusText = 'Bình thường';

    if (systolicNum >= 180 || diastolicNum >= 120) {
        status = 'crisis';
        statusText = 'Crisis';
    } else if (systolicNum >= 140 || diastolicNum >= 90) {
        status = 'high';
        statusText = 'Cao';
    } else if (systolicNum < 90 || diastolicNum < 60) {
        status = 'low';
        statusText = 'Thấp';
    }

    return {
        formatted: `${systolicNum}/${diastolicNum}`,
        status: status,
        statusText: statusText
    };
}

function formatTemperature(temp, unit = 'C') {
    const tempNum = parseFloat(temp);
    let status = 'normal';
    let statusText = 'Bình thường';

    if (tempNum >= 38.0) {
        status = 'fever';
        statusText = 'Sốt';
    } else if (tempNum < 36.0) {
        status = 'low';
        statusText = 'Thấp';
    }

    return {
        formatted: `${tempNum}°${unit}`,
        status: status,
        statusText: statusText
    };
}

/**
 * Export for use in other modules
 */
window.HealthCareUtils = {
    showLoading,
    hideLoading,
    showToast,
    debounce,
    formatDate,
    isOnline,
    validateEmail,
    validatePhone,
    validatePassword,
    callEmergency,
    formatBloodPressure,
    formatTemperature
};