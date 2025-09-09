/**
 * Multi-Step Registration JavaScript
 * Handles form navigation, validation, and progress tracking
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeRegistration();
});

// Registration state
const registrationState = {
    currentStep: 1,
    totalSteps: 3,
    formData: {},
    isValid: {
        1: false,
        2: false,
        3: false
    }
};

function initializeRegistration() {
    // Initialize form elements
    const form = document.getElementById('registration-form');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form) return;
    
    // Set up event listeners
    nextBtn?.addEventListener('click', handleNext);
    prevBtn?.addEventListener('click', handlePrevious);
    form.addEventListener('submit', handleSubmit);
    
    // Initialize password strength indicator
    initializePasswordStrength();
    
    // Initialize real-time validation
    initializeFormValidation();
    
    // Initialize step navigation
    updateStepDisplay();
    
    // Load saved progress from session storage
    loadSavedProgress();
    
    // Auto-save progress
    setInterval(saveProgress, 30000); // Save every 30 seconds
}

// Step Navigation
function handleNext() {
    if (validateCurrentStep()) {
        saveStepData();
        if (registrationState.currentStep < registrationState.totalSteps) {
            registrationState.currentStep++;
            updateStepDisplay();
            saveProgress();
        }
    }
}

function handlePrevious() {
    saveStepData();
    if (registrationState.currentStep > 1) {
        registrationState.currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.getElementById('progress-fill');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Update form steps visibility
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === registrationState.currentStep);
    });
    
    // Update progress steps
    progressSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.toggle('active', stepNumber === registrationState.currentStep);
        step.classList.toggle('completed', stepNumber < registrationState.currentStep);
    });
    
    // Update progress bar
    const progressPercentage = (registrationState.currentStep / registrationState.totalSteps) * 100;
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update navigation buttons
    if (prevBtn) {
        prevBtn.style.display = registrationState.currentStep > 1 ? 'flex' : 'none';
    }
    
    if (nextBtn && submitBtn) {
        if (registrationState.currentStep === registrationState.totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }
    }
    
    // Scroll to top of form
    document.querySelector('.registration-card')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Form Validation
function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const radios = document.querySelectorAll('input[type="radio"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearValidation(input));
    });
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => validateField(checkbox));
    });
    
    radios.forEach(radio => {
        radio.addEventListener('change', () => validateField(radio));
    });
}

function validateCurrentStep() {
    const currentStepElement = document.querySelector(`#step-${registrationState.currentStep}`);
    const inputs = currentStepElement.querySelectorAll('.form-input, .form-select, .form-textarea');
    const requiredCheckboxes = currentStepElement.querySelectorAll('input[type="checkbox"][required]');
    const radioGroups = currentStepElement.querySelectorAll('input[type="radio"][required]');
    
    let isValid = true;
    
    // Validate regular inputs
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Validate required checkboxes
    requiredCheckboxes.forEach(checkbox => {
        if (!validateField(checkbox)) {
            isValid = false;
        }
    });
    
    // Validate radio groups
    const radioGroupNames = new Set();
    radioGroups.forEach(radio => radioGroupNames.add(radio.name));
    
    radioGroupNames.forEach(groupName => {
        const group = currentStepElement.querySelectorAll(`input[name="${groupName}"]`);
        const isGroupValid = Array.from(group).some(radio => radio.checked);
        
        if (!isGroupValid) {
            setValidationMessage(groupName, 'Please make a selection.', 'error');
            isValid = false;
        } else {
            clearValidationMessage(groupName);
        }
    });
    
    registrationState.isValid[registrationState.currentStep] = isValid;
    return isValid;
}

function validateField(field) {
    const value = field.value?.trim();
    const type = field.type;
    const name = field.name;
    const required = field.required;
    
    // Skip validation for non-required empty fields
    if (!required && !value) {
        clearValidation(field);
        return true;
    }
    
    // Required field validation
    if (required && !value) {
        setValidation(field, 'This field is required.', 'error');
        return false;
    }
    
    // Type-specific validation
    switch (type) {
        case 'email':
            return validateEmail(field);
        case 'password':
            return validatePassword(field);
        case 'tel':
            return validatePhone(field);
        case 'date':
            return validateDateOfBirth(field);
        case 'number':
            return validateNumber(field);
        case 'checkbox':
            return validateCheckbox(field);
        default:
            if (name === 'full_name') {
                return validateFullName(field);
            }
            break;
    }
    
    // Default validation passed
    setValidation(field, '', 'success');
    return true;
}

function validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        setValidation(field, 'Please enter a valid email address.', 'error');
        return false;
    }
    
    setValidation(field, 'Valid email address.', 'success');
    return true;
}

function validatePassword(field) {
    const password = field.value;
    const errors = [];
    
    if (password.length < 8) {
        errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('one lowercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('one special character');
    }
    
    if (errors.length > 0) {
        setValidation(field, `Password must contain ${errors.join(', ')}.`, 'error');
        return false;
    }
    
    setValidation(field, 'Strong password.', 'success');
    return true;
}

function validatePhone(field) {
    const phone = field.value.trim();
    if (!phone) return true; // Optional field
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        setValidation(field, 'Please enter a valid phone number.', 'error');
        return false;
    }
    
    setValidation(field, 'Valid phone number.', 'success');
    return true;
}

function validateDateOfBirth(field) {
    const dateValue = field.value;
    if (!dateValue) {
        setValidation(field, 'Date of birth is required.', 'error');
        return false;
    }
    
    const birthDate = new Date(dateValue);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
        setValidation(field, 'You must be at least 13 years old to register.', 'error');
        return false;
    }
    
    if (age > 120) {
        setValidation(field, 'Please enter a valid date of birth.', 'error');
        return false;
    }
    
    setValidation(field, 'Valid date of birth.', 'success');
    return true;
}

function validateNumber(field) {
    const value = parseFloat(field.value);
    const min = parseFloat(field.min);
    const max = parseFloat(field.max);
    
    if (isNaN(value)) {
        setValidation(field, 'Please enter a valid number.', 'error');
        return false;
    }
    
    if (min && value < min) {
        setValidation(field, `Value must be at least ${min}.`, 'error');
        return false;
    }
    
    if (max && value > max) {
        setValidation(field, `Value must be no more than ${max}.`, 'error');
        return false;
    }
    
    setValidation(field, 'Valid value.', 'success');
    return true;
}

function validateFullName(field) {
    const name = field.value.trim();
    if (name.length < 2) {
        setValidation(field, 'Name must be at least 2 characters long.', 'error');
        return false;
    }
    
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
        setValidation(field, 'Name can only contain letters, spaces, hyphens, and apostrophes.', 'error');
        return false;
    }
    
    setValidation(field, 'Valid name.', 'success');
    return true;
}

function validateCheckbox(field) {
    if (field.required && !field.checked) {
        setValidation(field, 'This field is required.', 'error');
        return false;
    }
    
    clearValidation(field);
    return true;
}

// Validation UI helpers
function setValidation(field, message, type) {
    const errorElement = document.getElementById(`${field.name}-error`) || 
                        document.getElementById(`${field.id}-error`);
    
    field.classList.remove('error', 'success');
    field.classList.add(type);
    
    if (errorElement) {
        errorElement.classList.remove('error', 'success');
        errorElement.classList.add(type);
        errorElement.textContent = message;
    }
}

function clearValidation(field) {
    const errorElement = document.getElementById(`${field.name}-error`) || 
                        document.getElementById(`${field.id}-error`);
    
    field.classList.remove('error', 'success');
    if (errorElement) {
        errorElement.classList.remove('error', 'success');
        errorElement.textContent = '';
    }
}

function setValidationMessage(fieldName, message, type) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.classList.remove('error', 'success');
        errorElement.classList.add(type);
        errorElement.textContent = message;
    }
}

function clearValidationMessage(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.classList.remove('error', 'success');
        errorElement.textContent = '';
    }
}

// Password Strength Indicator
function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthContainer = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (!passwordInput || !strengthContainer) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        if (password.length === 0) {
            strengthContainer.style.display = 'none';
            return;
        }
        
        strengthContainer.style.display = 'block';
        const strength = calculatePasswordStrength(password);
        updatePasswordStrength(strengthFill, strengthText, strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Calculate score
    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.numbers) score++;
    if (checks.symbols) score++;
    
    // Determine strength level
    if (score <= 2) return { level: 'weak', text: 'Weak password' };
    if (score === 3) return { level: 'fair', text: 'Fair password' };
    if (score === 4) return { level: 'good', text: 'Good password' };
    return { level: 'strong', text: 'Strong password' };
}

function updatePasswordStrength(fillElement, textElement, strength) {
    if (!fillElement || !textElement) return;
    
    // Remove all strength classes
    fillElement.className = 'strength-fill';
    textElement.className = 'strength-text';
    
    // Add current strength class
    fillElement.classList.add(strength.level);
    textElement.classList.add(strength.level);
    textElement.textContent = strength.text;
}

// Data Management
function saveStepData() {
    const currentStepElement = document.querySelector(`#step-${registrationState.currentStep}`);
    const formData = new FormData();
    
    // Get all form elements in current step
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (input.checked) {
                if (!registrationState.formData[input.name]) {
                    registrationState.formData[input.name] = [];
                }
                if (Array.isArray(registrationState.formData[input.name])) {
                    registrationState.formData[input.name].push(input.value);
                } else {
                    registrationState.formData[input.name] = [input.value];
                }
            }
        } else if (input.type === 'radio') {
            if (input.checked) {
                registrationState.formData[input.name] = input.value;
            }
        } else {
            registrationState.formData[input.name] = input.value;
        }
    });
}

function saveProgress() {
    saveStepData();
    try {
        sessionStorage.setItem('registrationProgress', JSON.stringify({
            currentStep: registrationState.currentStep,
            formData: registrationState.formData,
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.warn('Could not save registration progress:', error);
    }
}

function loadSavedProgress() {
    try {
        const saved = sessionStorage.getItem('registrationProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            
            // Check if progress is recent (within 24 hours)
            const savedTime = new Date(progress.timestamp);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                registrationState.formData = progress.formData || {};
                populateFormFields();
                
                // Ask user if they want to continue
                if (confirm('We found your previous registration progress. Would you like to continue where you left off?')) {
                    registrationState.currentStep = progress.currentStep || 1;
                    updateStepDisplay();
                }
            }
        }
    } catch (error) {
        console.warn('Could not load saved progress:', error);
    }
}

function populateFormFields() {
    Object.keys(registrationState.formData).forEach(name => {
        const value = registrationState.formData[name];
        const elements = document.querySelectorAll(`[name="${name}"]`);
        
        elements.forEach(element => {
            if (element.type === 'checkbox') {
                element.checked = Array.isArray(value) ? value.includes(element.value) : value === element.value;
            } else if (element.type === 'radio') {
                element.checked = element.value === value;
            } else {
                element.value = value || '';
            }
        });
    });
}

// Form Submission
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
        showMessage('Please fix the errors before submitting.', 'error');
        return;
    }
    
    saveStepData();
    
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = document.getElementById('submit-spinner');
    
    // Show loading state
    setLoadingState(submitBtn, btnText, btnSpinner, true);
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationState.formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Redirecting to dashboard...', 'success');
            
            // Clear saved progress
            sessionStorage.removeItem('registrationProgress');
            
            // Redirect after success
            setTimeout(() => {
                window.location.href = result.redirect_url || '/dashboard';
            }, 2000);
        } else {
            if (result.detail && Array.isArray(result.detail)) {
                handleValidationErrors(result.detail);
            } else {
                showMessage(result.detail || 'Registration failed. Please try again.', 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please try again later.', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnSpinner, false);
    }
}

function handleValidationErrors(errors) {
    errors.forEach(error => {
        const field = error.loc[error.loc.length - 1];
        const input = document.querySelector(`[name="${field}"], #${field}`);
        
        if (input) {
            setValidation(input, error.msg, 'error');
            
            // Navigate to step containing the error
            const stepElement = input.closest('.form-step');
            if (stepElement) {
                const stepNumber = parseInt(stepElement.dataset.step);
                if (stepNumber !== registrationState.currentStep) {
                    registrationState.currentStep = stepNumber;
                    updateStepDisplay();
                }
            }
        }
    });
}

// UI Helper Functions
function setLoadingState(button, textElement, spinnerElement, isLoading) {
    if (isLoading) {
        button.disabled = true;
        textElement.style.display = 'none';
        spinnerElement.style.display = 'flex';
    } else {
        button.disabled = false;
        textElement.style.display = 'block';
        spinnerElement.style.display = 'none';
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
    
    // Scroll to message
    messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messagesContainer.style.display = 'none';
        }, 5000);
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateField,
        calculatePasswordStrength,
        saveProgress,
        loadSavedProgress
    };
}