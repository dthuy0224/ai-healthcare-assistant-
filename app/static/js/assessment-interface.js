/**
 * AI Health Assessment Interface
 * Comprehensive JavaScript for step navigation, form validation, and auto-save
 */

class HealthAssessment {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.autoSaveInterval = null;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.selectedBodyParts = new Set();
        this.selectedMedications = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadSavedProgress();
        this.updateProgress();
        this.setupAccessibility();
    }

    setupEventListeners() {
        // Step navigation
        document.getElementById('next-step')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prev-step')?.addEventListener('click', () => this.prevStep());
        document.getElementById('submit-assessment')?.addEventListener('click', () => this.submitAssessment());

        // Sidebar navigation
        document.querySelectorAll('.nav-step').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepNumber = parseInt(e.currentTarget.dataset.step);
                this.goToStep(stepNumber);
            });
        });

        // Age slider
        const ageSlider = document.getElementById('age-slider');
        if (ageSlider) {
            ageSlider.addEventListener('input', (e) => this.updateAgeDisplay(e.target.value));
        }

        // Height/Weight inputs with BMI calculation
        document.getElementById('height')?.addEventListener('input', () => this.calculateBMI());
        document.getElementById('weight')?.addEventListener('input', () => this.calculateBMI());
        document.getElementById('height-unit')?.addEventListener('change', () => this.calculateBMI());
        document.getElementById('weight-unit')?.addEventListener('change', () => this.calculateBMI());

        // Medication search
        this.setupMedicationSearch();

        // Body diagram
        this.setupBodyDiagram();

        // Voice recording
        this.setupVoiceRecording();

        // File upload
        this.setupFileUpload();

        // Dynamic questions
        this.setupDynamicQuestions();

        // Form validation
        this.setupFormValidation();

        // Save & Exit
        document.querySelector('.btn-save-exit')?.addEventListener('click', () => this.saveAndExit());
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
        }, 30000);

        // Save on form changes
        document.addEventListener('input', () => this.debounceSave());
        document.addEventListener('change', () => this.debounceSave());
    }

    debounceSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveProgress();
        }, 1000);
    }

    saveProgress() {
        const formData = this.collectFormData();
        localStorage.setItem('healthAssessmentProgress', JSON.stringify({
            currentStep: this.currentStep,
            formData: formData,
            timestamp: new Date().toISOString()
        }));
        
        this.updateSaveIndicator();
    }

    loadSavedProgress() {
        const saved = localStorage.getItem('healthAssessmentProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentStep = data.currentStep || 1;
                this.formData = data.formData || {};
                this.populateForm();
                this.goToStep(this.currentStep, false);
            } catch (error) {
                console.error('Error loading saved progress:', error);
            }
        }
    }

    collectFormData() {
        const form = document.getElementById('health-assessment-form');
        const formData = new FormData(form);
        const data = {};

        // Collect all form data
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // Add special data
        data.selectedBodyParts = Array.from(this.selectedBodyParts);
        data.selectedMedications = Array.from(this.selectedMedications);
        data.currentStep = this.currentStep;

        return data;
    }

    populateForm() {
        // Populate form fields from saved data
        Object.entries(this.formData).forEach(([key, value]) => {
            if (key === 'selectedBodyParts') {
                value.forEach(part => this.selectedBodyParts.add(part));
            } else if (key === 'selectedMedications') {
                value.forEach(med => this.selectedMedications.add(med));
            } else if (Array.isArray(value)) {
                value.forEach(val => {
                    const element = document.querySelector(`[name="${key}"][value="${val}"]`);
                    if (element) element.checked = true;
                });
            } else {
                const element = document.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'radio' || element.type === 'checkbox') {
                        element.checked = true;
                    } else {
                        element.value = value;
                    }
                }
            }
        });

        // Update UI elements
        this.updateBodyDiagram();
        this.updateMedicationDisplay();
        this.calculateBMI();
    }

    updateSaveIndicator() {
        const indicator = document.querySelector('.save-status');
        if (indicator) {
            indicator.textContent = 'Auto-saved just now';
            setTimeout(() => {
                indicator.textContent = 'All changes saved';
            }, 2000);
        }
    }

    // Step Navigation
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.goToStep(this.currentStep);
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.goToStep(this.currentStep);
        }
    }

    goToStep(stepNumber, saveProgress = true) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;

        // Hide all steps
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-step').forEach((navStep, index) => {
            navStep.classList.remove('active', 'completed');
            if (index + 1 === stepNumber) {
                navStep.classList.add('active');
            } else if (index + 1 < stepNumber) {
                navStep.classList.add('completed');
            }
        });

        // Update progress bar
        this.updateProgress();

        // Update navigation buttons
        this.updateNavigationButtons();

        this.currentStep = stepNumber;

        if (saveProgress) {
            this.saveProgress();
        }

        // Special handling for step 4
        if (stepNumber === 4) {
            this.startAnalysis();
        }
    }

    updateProgress() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        const progressFill = document.querySelector('.progress-fill');
        const currentStepText = document.querySelector('.current-step');
        const completionRate = document.querySelector('.completion-rate');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (currentStepText) {
            currentStepText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }

        if (completionRate) {
            completionRate.textContent = `${Math.round(progress)}% Complete`;
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-assessment');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 1;
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'flex';
        }

        if (submitBtn) {
            submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
        }
    }

    // Form Validation
    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        if (!currentStepElement) return true;

        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Step-specific validation
        switch (this.currentStep) {
            case 1:
                isValid = this.validateStep1() && isValid;
                break;
            case 2:
                isValid = this.validateStep2() && isValid;
                break;
            case 3:
                isValid = this.validateStep3() && isValid;
                break;
        }

        return isValid;
    }

    validateStep1() {
        let isValid = true;

        // Check if gender is selected
        const genderSelected = document.querySelector('input[name="gender"]:checked');
        if (!genderSelected) {
            this.showSectionError('gender-options', 'Please select your gender');
            isValid = false;
        }

        // Check if activity level is selected
        const activitySelected = document.querySelector('input[name="activity"]:checked');
        if (!activitySelected) {
            this.showSectionError('activity-scale', 'Please select your activity level');
            isValid = false;
        }

        return isValid;
    }

    validateStep2() {
        let isValid = true;

        // Check if primary symptom is provided
        const primarySymptom = document.getElementById('primary-symptom');
        if (!primarySymptom.value.trim()) {
            this.showFieldError(primarySymptom, 'Please describe your primary symptom');
            isValid = false;
        }

        // Check if duration is selected
        const durationSelected = document.querySelector('input[name="duration"]:checked');
        if (!durationSelected) {
            this.showSectionError('duration-timeline', 'Please select symptom duration');
            isValid = false;
        }

        // Check if severity is selected
        const severitySelected = document.querySelector('input[name="severity"]:checked');
        if (!severitySelected) {
            this.showSectionError('severity-scale', 'Please select pain/discomfort level');
            isValid = false;
        }

        return isValid;
    }

    validateStep3() {
        // Step 3 validation can be more flexible
        return true;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--error-red)';
        errorDiv.style.fontSize = 'var(--text-sm)';
        errorDiv.style.marginTop = 'var(--space-1)';
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = 'var(--error-red)';
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }

    showSectionError(sectionId, message) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        this.clearSectionError(section);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'section-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--error-red)';
        errorDiv.style.fontSize = 'var(--text-sm)';
        errorDiv.style.marginTop = 'var(--space-2)';
        errorDiv.style.textAlign = 'center';
        
        section.appendChild(errorDiv);
    }

    clearSectionError(section) {
        const existingError = section.querySelector('.section-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Age Slider
    updateAgeDisplay(value) {
        const ageValue = document.getElementById('age-value');
        if (ageValue) {
            ageValue.textContent = value;
        }
    }

    // BMI Calculation
    calculateBMI() {
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const heightUnit = document.getElementById('height-unit');
        const weightUnit = document.getElementById('weight-unit');
        const heightConversion = document.getElementById('height-conversion');
        const weightConversion = document.getElementById('weight-conversion');
        const bmiValue = document.getElementById('bmi-value');
        const bmiCategory = document.getElementById('bmi-category');

        if (!heightInput || !weightInput || !heightUnit || !weightUnit) return;

        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);

        if (!height || !weight) return;

        // Convert to metric
        let heightInMeters = height;
        let weightInKg = weight;

        if (heightUnit.value === 'ft') {
            heightInMeters = height * 0.3048; // Convert feet to meters
        } else {
            heightInMeters = height / 100; // Convert cm to meters
        }

        if (weightUnit.value === 'lbs') {
            weightInKg = weight * 0.453592; // Convert lbs to kg
        }

        // Calculate BMI
        const bmi = weightInKg / (heightInMeters * heightInMeters);

        // Update displays
        if (bmiValue) {
            bmiValue.textContent = bmi.toFixed(1);
        }

        if (bmiCategory) {
            let category = 'Normal';
            let categoryColor = 'var(--success)';

            if (bmi < 18.5) {
                category = 'Underweight';
                categoryColor = 'var(--warning)';
            } else if (bmi >= 25 && bmi < 30) {
                category = 'Overweight';
                categoryColor = 'var(--warning)';
            } else if (bmi >= 30) {
                category = 'Obese';
                categoryColor = 'var(--error-red)';
            }

            bmiCategory.textContent = category;
            bmiCategory.style.color = categoryColor;
        }

        // Update conversion displays
        if (heightConversion) {
            if (heightUnit.value === 'cm') {
                const feet = Math.floor(height / 30.48);
                const inches = Math.round((height % 30.48) / 2.54);
                heightConversion.textContent = `${feet}'${inches}"`;
            } else {
                const cm = Math.round(height * 30.48);
                heightConversion.textContent = `${cm} cm`;
            }
        }

        if (weightConversion) {
            if (weightUnit.value === 'kg') {
                const lbs = Math.round(weight * 2.20462);
                weightConversion.textContent = `${lbs} lbs`;
            } else {
                const kg = Math.round(weight * 0.453592);
                weightConversion.textContent = `${kg} kg`;
            }
        }
    }

    // Medication Search
    setupMedicationSearch() {
        const searchInput = document.getElementById('medication-search');
        const suggestionsContainer = document.getElementById('medication-suggestions');
        const selectedContainer = document.getElementById('selected-medications');

        if (!searchInput || !suggestionsContainer) return;

        // Mock medication database
        const medications = [
            'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Metformin', 'Lisinopril',
            'Atorvastatin', 'Metoprolol', 'Omeprazole', 'Amlodipine', 'Hydrochlorothiazide',
            'Simvastatin', 'Losartan', 'Albuterol', 'Gabapentin', 'Tramadol',
            'Furosemide', 'Pantoprazole', 'Sertraline', 'Montelukast', 'Trazodone'
        ];

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                suggestionsContainer.classList.remove('show');
                return;
            }

            const filtered = medications.filter(med => 
                med.toLowerCase().includes(query) && 
                !this.selectedMedications.has(med)
            );

            if (filtered.length > 0) {
                suggestionsContainer.innerHTML = filtered.map(med => 
                    `<div class="suggestion-item" data-medication="${med}">${med}</div>`
                ).join('');
                suggestionsContainer.classList.add('show');
            } else {
                suggestionsContainer.classList.remove('show');
            }
        });

        // Handle suggestion clicks
        suggestionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-item')) {
                const medication = e.target.dataset.medication;
                this.addMedication(medication);
                searchInput.value = '';
                suggestionsContainer.classList.remove('show');
            }
        });

        // Handle no medications checkbox
        const noMedicationsCheckbox = document.getElementById('no-medications');
        if (noMedicationsCheckbox) {
            noMedicationsCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.clearAllMedications();
                    searchInput.disabled = true;
                } else {
                    searchInput.disabled = false;
                }
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.remove('show');
            }
        });
    }

    addMedication(medication) {
        this.selectedMedications.add(medication);
        this.updateMedicationDisplay();
    }

    removeMedication(medication) {
        this.selectedMedications.delete(medication);
        this.updateMedicationDisplay();
    }

    clearAllMedications() {
        this.selectedMedications.clear();
        this.updateMedicationDisplay();
    }

    updateMedicationDisplay() {
        const container = document.getElementById('selected-medications');
        if (!container) return;

        container.innerHTML = Array.from(this.selectedMedications).map(med => `
            <div class="medication-tag">
                <span>${med}</span>
                <button type="button" class="remove-btn" data-medication="${med}">×</button>
            </div>
        `).join('');

        // Add remove event listeners
        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const medication = e.target.dataset.medication;
                this.removeMedication(medication);
            });
        });
    }

    // Body Diagram
    setupBodyDiagram() {
        const bodySvg = document.getElementById('body-svg');
        const selectedAreasContainer = document.getElementById('selected-body-areas');
        const clearBtn = document.getElementById('clear-body-areas');

        if (!bodySvg) return;

        // Handle body part clicks
        bodySvg.addEventListener('click', (e) => {
            const bodyPart = e.target.closest('.body-part');
            if (bodyPart) {
                const partName = bodyPart.dataset.part;
                this.toggleBodyPart(partName);
            }
        });

        // Handle view toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchBodyView(view);
            });
        });

        // Handle clear all
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllBodyParts();
            });
        }
    }

    toggleBodyPart(partName) {
        if (this.selectedBodyParts.has(partName)) {
            this.selectedBodyParts.delete(partName);
        } else {
            this.selectedBodyParts.add(partName);
        }
        this.updateBodyDiagram();
    }

    clearAllBodyParts() {
        this.selectedBodyParts.clear();
        this.updateBodyDiagram();
    }

    updateBodyDiagram() {
        // Update SVG styling
        document.querySelectorAll('.body-part').forEach(part => {
            const partName = part.dataset.part;
            if (this.selectedBodyParts.has(partName)) {
                part.classList.add('selected');
            } else {
                part.classList.remove('selected');
            }
        });

        // Update selected areas display
        const container = document.getElementById('selected-body-areas');
        const clearBtn = document.getElementById('clear-body-areas');
        
        if (container) {
            container.innerHTML = Array.from(this.selectedBodyParts).map(part => `
                <div class="area-tag">
                    <span>${this.formatBodyPartName(part)}</span>
                    <button type="button" class="remove-btn" data-part="${part}">×</button>
                </div>
            `).join('');

            // Add remove event listeners
            container.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const part = e.target.dataset.part;
                    this.selectedBodyParts.delete(part);
                    this.updateBodyDiagram();
                });
            });
        }

        if (clearBtn) {
            clearBtn.style.display = this.selectedBodyParts.size > 0 ? 'block' : 'none';
        }
    }

    formatBodyPartName(part) {
        return part.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    switchBodyView(view) {
        const frontView = document.querySelector('.body-svg > g:not(.back-view)');
        const backView = document.querySelector('.back-view');
        const frontBtn = document.querySelector('[data-view="front"]');
        const backBtn = document.querySelector('[data-view="back"]');

        if (view === 'back') {
            if (frontView) frontView.style.display = 'none';
            if (backView) backView.style.display = 'block';
            if (frontBtn) frontBtn.classList.remove('active');
            if (backBtn) backBtn.classList.add('active');
        } else {
            if (frontView) frontView.style.display = 'block';
            if (backView) backView.style.display = 'none';
            if (frontBtn) frontBtn.classList.add('active');
            if (backBtn) backBtn.classList.remove('active');
        }
    }

    // Voice Recording
    setupVoiceRecording() {
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        const statusDiv = document.getElementById('recording-status');
        const timeSpan = document.getElementById('recording-time');
        const audioContainer = document.getElementById('recorded-audio');

        if (!startBtn || !stopBtn) return;

        startBtn.addEventListener('click', () => this.startRecording());
        stopBtn.addEventListener('click', () => this.stopRecording());
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.displayRecordedAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.recordingStartTime = Date.now();
            this.startRecordingTimer();

            // Update UI
            document.getElementById('start-recording').style.display = 'none';
            document.getElementById('stop-recording').style.display = 'flex';
            document.getElementById('recording-status').style.display = 'flex';
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.stopRecordingTimer();

            // Update UI
            document.getElementById('start-recording').style.display = 'flex';
            document.getElementById('stop-recording').style.display = 'none';
            document.getElementById('recording-status').style.display = 'none';
        }
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const timeSpan = document.getElementById('recording-time');
            if (timeSpan) {
                timeSpan.textContent = timeString;
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    displayRecordedAudio(audioBlob) {
        const audioContainer = document.getElementById('recorded-audio');
        if (!audioContainer) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        audioContainer.innerHTML = `
            <div class="audio-player">
                <audio controls>
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                <button type="button" class="remove-audio-btn">Remove</button>
            </div>
        `;
        audioContainer.style.display = 'block';

        // Handle remove button
        audioContainer.querySelector('.remove-audio-btn').addEventListener('click', () => {
            audioContainer.style.display = 'none';
            audioContainer.innerHTML = '';
            URL.revokeObjectURL(audioUrl);
        });
    }

    // File Upload
    setupFileUpload() {
        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        const uploadedFilesContainer = document.getElementById('uploaded-files');

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
    }

    handleFileUpload(files) {
        const container = document.getElementById('uploaded-files');
        if (!container) return;

        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.displayUploadedFile(file, container);
            }
        });
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (file.size > maxSize) {
            alert(`File ${file.name} is too large. Maximum size is 10MB.`);
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            alert(`File ${file.name} has an unsupported format.`);
            return false;
        }

        return true;
    }

    displayUploadedFile(file, container) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">${this.getFileIcon(file.type)}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="file-remove">×</button>
        `;

        // Handle remove
        fileItem.querySelector('.file-remove').addEventListener('click', () => {
            fileItem.remove();
        });

        container.appendChild(fileItem);
    }

    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type === 'application/pdf') return '📄';
        if (type.includes('word')) return '📝';
        return '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Dynamic Questions
    setupDynamicQuestions() {
        // Handle yes/no toggles with follow-up questions
        document.querySelectorAll('.yes-no-toggle input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleYesNoToggle(e.target);
            });
        });

        // Handle condition checkboxes
        document.querySelectorAll('input[name="conditions"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleConditionChange(e.target);
            });
        });
    }

    handleYesNoToggle(radio) {
        const name = radio.name;
        const followUpId = `${name}-details`;
        const followUp = document.getElementById(followUpId);
        
        if (followUp) {
            followUp.style.display = radio.value === 'yes' ? 'block' : 'none';
        }
    }

    handleConditionChange(checkbox) {
        if (checkbox.value === 'other' && checkbox.checked) {
            const textarea = checkbox.closest('.condition-selector').nextElementSibling;
            if (textarea && textarea.tagName === 'TEXTAREA') {
                textarea.style.display = 'block';
            }
        } else if (checkbox.value === 'other' && !checkbox.checked) {
            const textarea = checkbox.closest('.condition-selector').nextElementSibling;
            if (textarea && textarea.tagName === 'TEXTAREA') {
                textarea.style.display = 'none';
            }
        }
    }

    // Form Validation
    setupFormValidation() {
        // Character count for symptom textarea
        const symptomTextarea = document.getElementById('primary-symptom');
        const charCount = document.getElementById('symptom-count');
        
        if (symptomTextarea && charCount) {
            symptomTextarea.addEventListener('input', (e) => {
                const count = e.target.value.length;
                charCount.textContent = count;
                
                if (count > 500) {
                    charCount.style.color = 'var(--error-red)';
                } else if (count > 400) {
                    charCount.style.color = 'var(--warning)';
                } else {
                    charCount.style.color = 'var(--gray-500)';
                }
            });
        }
    }

    // AI Analysis
    startAnalysis() {
        const loadingDiv = document.getElementById('analysis-loading');
        const resultsDiv = document.getElementById('analysis-results');
        
        if (!loadingDiv || !resultsDiv) return;

        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';

        // Simulate analysis progress
        this.simulateAnalysisProgress();
    }

    simulateAnalysisProgress() {
        const messages = document.querySelectorAll('.progress-messages .message');
        let currentMessage = 0;

        const progressInterval = setInterval(() => {
            if (currentMessage < messages.length) {
                // Mark previous message as completed
                if (currentMessage > 0) {
                    messages[currentMessage - 1].classList.remove('active');
                    messages[currentMessage - 1].classList.add('completed');
                }

                // Activate current message
                messages[currentMessage].classList.add('active');
                currentMessage++;
            } else {
                clearInterval(progressInterval);
                setTimeout(() => {
                    this.showAnalysisResults();
                }, 1000);
            }
        }, 2000);
    }

    showAnalysisResults() {
        const loadingDiv = document.getElementById('analysis-loading');
        const resultsDiv = document.getElementById('analysis-results');
        
        if (loadingDiv && resultsDiv) {
            loadingDiv.style.display = 'none';
            resultsDiv.style.display = 'block';
        }

        // Mark step as completed
        document.querySelector(`[data-step="${this.totalSteps}"]`).classList.add('completed');
    }

    // Submit Assessment
    async submitAssessment() {
        if (!this.validateCurrentStep()) {
            return;
        }

        const formData = this.collectFormData();
        
        try {
            // Show loading state
            const submitBtn = document.getElementById('submit-assessment');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
            }

            // Simulate API call
            await this.delay(2000);
            
            // Clear saved progress
            localStorage.removeItem('healthAssessmentProgress');
            
            // Redirect to results page
            window.location.href = '/assessment/results';
            
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('There was an error submitting your assessment. Please try again.');
            
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="btn-icon">✓</span> Complete Assessment';
            }
        }
    }

    // Save and Exit
    saveAndExit() {
        this.saveProgress();
        window.location.href = '/dashboard';
    }

    // Accessibility
    setupAccessibility() {
        // Keyboard navigation for custom elements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('gender-card') || 
                    target.classList.contains('activity-card') ||
                    target.classList.contains('timeline-card') ||
                    target.classList.contains('pain-face')) {
                    e.preventDefault();
                    target.click();
                }
            }
        });

        // ARIA labels and roles
        this.setupARIA();
    }

    setupARIA() {
        // Add ARIA labels to custom elements
        document.querySelectorAll('.body-part').forEach(part => {
            part.setAttribute('role', 'button');
            part.setAttribute('tabindex', '0');
            part.setAttribute('aria-label', `Select ${this.formatBodyPartName(part.dataset.part)}`);
        });

        // Add ARIA live region for progress updates
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.setAttribute('aria-live', 'polite');
        }
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthAssessment();
});