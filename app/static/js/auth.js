/**
 * Healthcare Authentication JavaScript
 * Handles form validation, submission, and user interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    const loginForm = document.getElementById('login-form');
    const passwordToggle = document.getElementById('password-toggle');
    
    if (loginForm) {
        initializeLoginForm(loginForm);
    }
    
    if (passwordToggle) {
        initializePasswordToggle(passwordToggle);
    }
    
    // Initialize real-time validation
    initializeFormValidation();
}

// Login Form Handling
function initializeLoginForm(form) {
    form.addEventListener('submit', handleLoginSubmit);
    
    // Add input event listeners for real-time validation
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearValidationOnInput);
    });
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('login-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = document.getElementById('login-spinner');
    
    // Validate form before submission
    const isValid = validateForm(form);
    if (!isValid) {
        showMessage('Please fix the errors below before submitting.', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(submitBtn, btnText, btnSpinner, true);
    
    // Collect form data
    const formData = new FormData(form);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
    };
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard after successful login
            setTimeout(() => {
                window.location.href = result.redirect_url || '/dashboard';
            }, 1500);
        } else {
            // Handle specific error cases
            if (result.detail) {
                if (Array.isArray(result.detail)) {
                    // Validation errors
                    handleValidationErrors(result.detail);
                } else {
                    // General error message
                    showMessage(result.detail, 'error');
                }
            } else {
                showMessage('Login failed. Please check your credentials.', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again later.', 'error');
    } finally {
        // Hide loading state
        setLoadingState(submitBtn, btnText, btnSpinner, false);
    }
}

// Form Validation
function initializeFormValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => validateEmail(emailInput));
        emailInput.addEventListener('input', () => clearValidation(emailInput));
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
        passwordInput.addEventListener('input', () => clearValidation(passwordInput));
    }
}

function validateForm(form) {
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    
    let isValid = true;
    
    if (emailInput && !validateEmail(emailInput)) {
        isValid = false;
    }
    
    if (passwordInput && !validatePassword(passwordInput)) {
        isValid = false;
    }
    
    return isValid;
}

function validateInput(event) {
    const input = event.target;
    
    switch (input.type) {
        case 'email':
            return validateEmail(input);
        case 'password':
            return validatePassword(input);
        default:
            return true;
    }
}

function validateEmail(input) {
    const email = input.value.trim();
    const errorElement = document.getElementById('email-error');
    
    if (!email) {
        setInputValidation(input, errorElement, 'Email address is required.', 'error');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setInputValidation(input, errorElement, 'Please enter a valid email address.', 'error');
        return false;
    }
    
    setInputValidation(input, errorElement, 'Valid email address.', 'success');
    return true;
}

function validatePassword(input) {
    const password = input.value;
    const errorElement = document.getElementById('password-error');
    
    if (!password) {
        setInputValidation(input, errorElement, 'Password is required.', 'error');
        return false;
    }
    
    if (password.length < 6) {
        setInputValidation(input, errorElement, 'Password must be at least 6 characters long.', 'error');
        return false;
    }
    
    setInputValidation(input, errorElement, 'Password meets requirements.', 'success');
    return true;
}

function setInputValidation(input, errorElement, message, type) {
    // Remove previous validation classes
    input.classList.remove('error', 'success');
    errorElement.classList.remove('error', 'success');
    
    // Add new validation class
    input.classList.add(type);
    errorElement.classList.add(type);
    errorElement.textContent = message;
}

function clearValidation(input) {
    const errorElement = document.querySelector(`#${input.id}-error`);
    
    input.classList.remove('error', 'success');
    if (errorElement) {
        errorElement.classList.remove('error', 'success');
        errorElement.textContent = '';
    }
}

function clearValidationOnInput(event) {
    const input = event.target;
    if (input.classList.contains('error')) {
        clearValidation(input);
    }
}

function handleValidationErrors(errors) {
    errors.forEach(error => {
        const field = error.loc[error.loc.length - 1]; // Get field name
        const input = document.getElementById(field);
        const errorElement = document.getElementById(`${field}-error`);
        
        if (input && errorElement) {
            setInputValidation(input, errorElement, error.msg, 'error');
        }
    });
    
    showMessage('Please fix the validation errors below.', 'error');
}

// Password Toggle
function initializePasswordToggle(toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const eyeOpen = toggleBtn.querySelector('.eye-open');
        const eyeClosed = toggleBtn.querySelector('.eye-closed');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
            toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
    });
}

// UI Helper Functions
function setLoadingState(button, textElement, spinnerElement, isLoading) {
    if (isLoading) {
        button.disabled = true;
        textElement.style.display = 'none';
        spinnerElement.style.display = 'flex';
        button.setAttribute('aria-label', 'Signing in...');
    } else {
        button.disabled = false;
        textElement.style.display = 'block';
        spinnerElement.style.display = 'none';
        button.setAttribute('aria-label', 'Sign In');
    }
}

function showMessage(text, type) {
    const messagesContainer = document.getElementById('form-messages');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const successText = document.getElementById('success-text');
    const errorText = document.getElementById('error-text');
    
    // Hide all messages first
    messagesContainer.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Show appropriate message
    if (type === 'success') {
        successText.textContent = text;
        successMessage.style.display = 'flex';
    } else {
        errorText.textContent = text;
        errorMessage.style.display = 'flex';
    }
    
    messagesContainer.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messagesContainer.style.display = 'none';
        }, 5000);
    }
}

// Social Login Functions
function loginWithGoogle() {
    showMessage('Google login integration coming soon...', 'error');
    
    // TODO: Implement Google OAuth integration
    // window.location.href = '/auth/google';
}

function loginWithApple() {
    showMessage('Apple login integration coming soon...', 'error');
    
    // TODO: Implement Apple OAuth integration
    // window.location.href = '/auth/apple';
}

// Utility Functions
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

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePassword,
        validateForm,
        handleLoginSubmit,
        loginWithGoogle,
        loginWithApple
    };
}