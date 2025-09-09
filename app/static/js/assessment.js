/**
 * AI Health Care Assistant - Assessment Form JavaScript
 * Handles multi-step form navigation, validation, and submission
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeAssessment();
});

let currentStep = 1;
const totalSteps = 4;
let formData = {};

function initializeAssessment() {
    // Initialize form elements
    setupFormValidation();
    setupStepNavigation();
    setupProgressBar();
    setupSeveritySlider();
    setupFormSubmission();

    // Load saved data if exists
    loadSavedData();

    // Update UI
    updateStepDisplay();
}

/**
 * Setup Form Validation
 */
function setupFormValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            // Remove error state on input
            this.parentElement.classList.remove('error');
        });
    });
}

/**
 * Validate Individual Field
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Trường này là bắt buộc';
    }

    // Email validation
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Email không hợp lệ';
        }
    }

    // Phone validation
    if (fieldName === 'phone' && value) {
        const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Số điện thoại không hợp lệ';
        }
    }

    // Height validation
    if (fieldName === 'height' && value) {
        const height = parseInt(value);
        if (height < 100 || height > 250) {
            isValid = false;
            errorMessage = 'Chiều cao phải từ 100-250 cm';
        }
    }

    // Weight validation
    if (fieldName === 'weight' && value) {
        const weight = parseInt(value);
        if (weight < 30 || weight > 200) {
            isValid = false;
            errorMessage = 'Cân nặng phải từ 30-200 kg';
        }
    }

    // Update field state
    const formGroup = field.parentElement;
    if (!isValid) {
        formGroup.classList.add('error');
        showFieldError(field, errorMessage);
    } else {
        formGroup.classList.remove('error');
        hideFieldError(field);
    }

    return isValid;
}

/**
 * Show Field Error
 */
function showFieldError(field, message) {
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: var(--danger);
            font-size: var(--text-sm);
            margin-top: var(--space-1);
        `;
        field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

/**
 * Hide Field Error
 */
function hideFieldError(field) {
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Setup Step Navigation
 */
function setupStepNavigation() {
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    nextBtn.addEventListener('click', function() {
        if (validateCurrentStep()) {
            saveCurrentStepData();
            goToNextStep();
        }
    });

    prevBtn.addEventListener('click', function() {
        saveCurrentStepData();
        goToPreviousStep();
    });
}

/**
 * Validate Current Step
 */
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

/**
 * Save Current Step Data
 */
function saveCurrentStepData() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (input.checked) {
                if (!formData[input.name]) {
                    formData[input.name] = [];
                }
                formData[input.name].push(input.value);
            }
        } else if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else {
            formData[input.name] = input.value;
        }
    });

    // Save to localStorage
    localStorage.setItem('assessmentData', JSON.stringify(formData));
}

/**
 * Load Saved Data
 */
function loadSavedData() {
    const savedData = localStorage.getItem('assessmentData');
    if (savedData) {
        formData = JSON.parse(savedData);

        // Populate form fields
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            const inputs = document.querySelectorAll(`[name="${key}"]`);

            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    if (Array.isArray(value) && value.includes(input.value)) {
                        input.checked = true;
                    }
                } else if (input.type === 'radio') {
                    if (input.value === value) {
                        input.checked = true;
                    }
                } else {
                    input.value = value;
                }
            });
        });
    }
}

/**
 * Go to Next Step
 */
function goToNextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        updateStepDisplay();
    }
}

/**
 * Go to Previous Step
 */
function goToPreviousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

/**
 * Update Step Display
 */
function updateStepDisplay() {
    // Hide all steps
    for (let i = 1; i <= totalSteps; i++) {
        const step = document.getElementById(`step-${i}`);
        step.classList.add('hidden');
    }

    // Show current step
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    currentStepElement.classList.remove('hidden');

    // Update progress bar
    updateProgressBar();

    // Update navigation buttons
    updateNavigationButtons();

    // Update step counter
    document.getElementById('current-step').textContent = `Bước ${currentStep}`;

    // Update review content if on last step
    if (currentStep === totalSteps) {
        updateReviewContent();
    }
}

/**
 * Update Progress Bar
 */
function updateProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;

    const progressText = document.getElementById('total-steps');
    progressText.textContent = `trên ${totalSteps}`;
}

/**
 * Update Navigation Buttons
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Previous button
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    // Next/Submit button
    if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

/**
 * Setup Severity Slider
 */
function setupSeveritySlider() {
    const slider = document.querySelector('.slider');
    const currentSeverity = document.querySelector('.current-severity');

    if (slider && currentSeverity) {
        slider.addEventListener('input', function() {
            currentSeverity.textContent = this.value;
        });
    }
}

/**
 * Update Review Content
 */
function updateReviewContent() {
    const reviewContent = document.getElementById('review-content');

    let content = '<div class="space-y-4">';

    // Basic Information
    content += '<div class="review-section">';
    content += '<h4 class="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>';
    content += `<p>Tuổi: ${formData.age || 'Chưa cung cấp'}</p>`;
    content += `<p>Giới tính: ${getGenderText(formData.gender) || 'Chưa cung cấp'}</p>`;
    if (formData.height && formData.weight) {
        content += `<p>Chiều cao/cân nặng: ${formData.height}cm / ${formData.weight}kg</p>`;
    }
    content += `<p>Mức độ hoạt động: ${getActivityText(formData.activity_level) || 'Chưa cung cấp'}</p>`;
    content += '</div>';

    // Symptoms
    content += '<div class="review-section">';
    content += '<h4 class="font-medium text-gray-900 mb-2">Triệu chứng</h4>';
    content += `<p>Triệu chứng chính: ${formData.primary_symptom || 'Chưa cung cấp'}</p>`;
    content += `<p>Thời gian: ${getDurationText(formData.symptom_duration) || 'Chưa cung cấp'}</p>`;
    content += `<p>Mức độ: ${formData.severity || 'Chưa cung cấp'}/10</p>`;
    if (formData.additional_symptoms && formData.additional_symptoms.length > 0) {
        content += `<p>Triệu chứng kèm theo: ${formData.additional_symptoms.join(', ')}</p>`;
    }
    content += '</div>';

    // Medical History
    content += '<div class="review-section">';
    content += '<h4 class="font-medium text-gray-900 mb-2">Tiền sử bệnh</h4>';
    if (formData.chronic_conditions && formData.chronic_conditions.length > 0) {
        content += `<p>Bệnh mãn tính: ${formData.chronic_conditions.join(', ')}</p>`;
    }
    if (formData.current_medications) {
        content += `<p>Thuốc đang dùng: ${formData.current_medications}</p>`;
    }
    if (formData.allergies) {
        content += `<p>Dị ứng: ${formData.allergies}</p>`;
    }
    content += '</div>';

    // Lifestyle
    content += '<div class="review-section">';
    content += '<h4 class="font-medium text-gray-900 mb-2">Lối sống</h4>';
    content += `<p>Giấc ngủ: ${getSleepText(formData.sleep_quality) || 'Chưa cung cấp'}</p>`;
    content += `<p>Căng thẳng: ${getStressText(formData.stress_level) || 'Chưa cung cấp'}</p>`;
    content += '</div>';

    content += '</div>';

    reviewContent.innerHTML = content;
}

/**
 * Helper Functions for Text Display
 */
function getGenderText(gender) {
    const genderMap = {
        'male': 'Nam',
        'female': 'Nữ',
        'other': 'Khác',
        'prefer-not-to-say': 'Không muốn trả lời'
    };
    return genderMap[gender];
}

function getActivityText(activity) {
    const activityMap = {
        'low': 'Ít vận động',
        'moderate': 'Vận động vừa',
        'high': 'Vận động nhiều'
    };
    return activityMap[activity];
}

function getDurationText(duration) {
    const durationMap = {
        'hours': 'Vài giờ',
        '1-day': '1 ngày',
        '2-3-days': '2-3 ngày',
        '1-week': '1 tuần',
        '2-weeks': '2 tuần',
        '1-month': '1 tháng',
        'months': 'Nhiều tháng'
    };
    return durationMap[duration];
}

function getSleepText(sleep) {
    const sleepMap = {
        'excellent': 'Xuất sắc',
        'good': 'Tốt',
        'fair': 'Bình thường',
        'poor': 'Kém',
        'very_poor': 'Rất kém'
    };
    return sleepMap[sleep];
}

function getStressText(stress) {
    const stressMap = {
        'low': 'Thấp',
        'moderate': 'Vừa',
        'high': 'Cao'
    };
    return stressMap[stress];
}

/**
 * Setup Form Submission
 */
function setupFormSubmission() {
    const form = document.getElementById('assessment-form');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (validateCurrentStep()) {
            saveCurrentStepData();

            // Show processing modal
            showProcessingModal();

            try {
                // Simulate API call
                await submitAssessment(formData);

                // Hide processing modal
                hideProcessingModal();

                // Redirect to results
                window.location.href = '/assessment/results';

            } catch (error) {
                console.error('Error submitting assessment:', error);
                hideProcessingModal();
                alert('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        }
    });
}

/**
 * Show Processing Modal
 */
function showProcessingModal() {
    const modal = document.getElementById('processing-modal');
    modal.style.display = 'flex';

    // Animate processing steps
    let step = 1;
    const interval = setInterval(() => {
        const currentStepElement = document.querySelector(`.processing-step[data-step="${step}"]`);
        const nextStepElement = document.querySelector(`.processing-step[data-step="${step + 1}"]`);

        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }

        if (nextStepElement) {
            nextStepElement.classList.add('active');
            step++;
        } else {
            clearInterval(interval);
        }
    }, 1500);
}

/**
 * Hide Processing Modal
 */
function hideProcessingModal() {
    const modal = document.getElementById('processing-modal');
    modal.style.display = 'none';

    // Reset processing steps
    document.querySelectorAll('.processing-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.processing-step[data-step="1"]').classList.add('active');
}

/**
 * Submit Assessment (Mock API Call)
 */
async function submitAssessment(data) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock successful submission
    console.log('Assessment submitted:', data);

    // Clear saved data
    localStorage.removeItem('assessmentData');

    return { success: true };
}

/**
 * Setup Progress Bar
 */
function setupProgressBar() {
    updateProgressBar();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAssessment();
});