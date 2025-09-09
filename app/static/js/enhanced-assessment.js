/* ================================
   ENHANCED AI HEALTH ASSESSMENT
   Medical-grade wizard with accessibility and advanced features
   ================================ */

class EnhancedHealthAssessment {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.medications = new Set();
        this.selectedBodyParts = new Set();
        this.uploadedFiles = [];
        this.recordingData = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.dynamicQuestions = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadSavedData();
        this.updateProgressBar();
        this.initializeCurrentStep();
        this.setupAccessibility();
    }

    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-assessment');
        
        prevBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());
        submitBtn?.addEventListener('click', (e) => this.submitAssessment(e));
        
        // Enhanced sidebar navigation with accessibility
        document.querySelectorAll('.nav-step').forEach(step => {
            step.addEventListener('click', (e) => this.handleSidebarNavigation(e));
            step.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleSidebarNavigation(e);
                }
            });
        });

        // Enhanced save functionality
        document.getElementById('save-exit-btn')?.addEventListener('click', () => this.saveAndExit());
        
        // Step 1 - Enhanced functionality
        this.setupStep1Listeners();
        
        // Step 2 - Enhanced symptom input
        this.setupStep2Listeners();
        
        // Step 3 - Dynamic questions
        this.setupStep3Listeners();
        
        // Step 4 - Results actions
        this.setupStep4Listeners();
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    setupStep1Listeners() {
        // Enhanced age slider with live feedback
        const ageSlider = document.getElementById('age-slider');
        const ageValue = document.getElementById('age-value');
        
        ageSlider?.addEventListener('input', (e) => {
            const age = e.target.value;
            ageValue.textContent = age;
            this.updateBMI();
            this.announceToScreenReader(`Age set to ${age} years`);
        });

        // Enhanced gender selection with custom option
        document.querySelectorAll('input[name="gender"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customField = document.getElementById('gender-custom');
                if (e.target.value === 'other') {
                    customField.style.display = 'block';
                    document.getElementById('custom-gender')?.focus();
                } else {
                    customField.style.display = 'none';
                }
            });
        });

        // Height and weight with real-time BMI calculation
        ['height', 'weight', 'height-unit', 'weight-unit'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateBMI());
        });

        // Enhanced medication search
        this.setupMedicationSearch();
    }

    setupStep2Listeners() {
        // Enhanced body diagram interaction
        this.setupBodyDiagram();
        
        // Symptom textarea with character count
        const symptomTextarea = document.getElementById('primary-symptom');
        const charCount = document.getElementById('symptom-count');
        
        symptomTextarea?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            charCount.textContent = count;
            
            if (count > 450) {
                charCount.style.color = 'var(--medical-warning)';
            } else {
                charCount.style.color = 'var(--text-muted)';
            }
        });

        // Pain scale with accessibility
        document.querySelectorAll('input[name="severity"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const level = e.target.value;
                this.announceToScreenReader(`Pain level set to ${level} out of 10`);
            });
        });
    }

    setupStep3Listeners() {
        // Dynamic question generation based on previous answers
        this.setupDynamicQuestions();
        
        // Enhanced file upload
        this.setupFileUpload();
        
        // Voice recording functionality
        this.setupVoiceRecording();
        
        // Date picker presets
        document.querySelectorAll('.date-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                const date = new Date();
                date.setDate(date.getDate() - days);
                document.getElementById('symptom-onset').value = date.toISOString().split('T')[0];
            });
        });
    }

    setupStep4Listeners() {
        // PDF download functionality
        document.getElementById('download-pdf-btn')?.addEventListener('click', () => this.downloadPDF());
        
        // Doctor sharing options
        document.getElementById('share-doctor-btn')?.addEventListener('click', () => this.toggleSharingOptions());
        
        // Save to profile
        document.getElementById('save-to-profile-btn')?.addEventListener('click', () => this.saveToProfile());
        
        // Share method handlers
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                this.handleShare(method);
            });
        });
    }

    setupAutoSave() {
        // Enhanced auto-save with visual feedback
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // Save every 30 seconds
    }

    async autoSave() {
        try {
            this.collectCurrentStepData();
            const saveData = {
                currentStep: this.currentStep,
                formData: this.formData,
                medications: Array.from(this.medications),
                selectedBodyParts: Array.from(this.selectedBodyParts),
                uploadedFiles: this.uploadedFiles.map(f => f.name),
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem('health_assessment_progress', JSON.stringify(saveData));
            this.lastSaveTime = new Date();
            this.updateSaveIndicator('saved');
            
            // Announce to screen reader
            this.announceToScreenReader('Assessment progress saved automatically');
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.updateSaveIndicator('error');
        }
    }

    updateSaveIndicator(status) {
        const indicator = document.getElementById('auto-save-indicator');
        const icon = document.getElementById('save-icon');
        const statusText = document.getElementById('save-status');
        const timeText = document.getElementById('save-time');
        
        indicator?.classList.remove('saving');
        
        switch (status) {
            case 'saving':
                indicator?.classList.add('saving');
                statusText.textContent = 'Saving...';
                icon.textContent = '⏳';
                break;
            case 'saved':
                statusText.textContent = 'Auto-saved';
                timeText.textContent = this.formatSaveTime();
                icon.textContent = '💾';
                break;
            case 'error':
                statusText.textContent = 'Save failed';
                timeText.textContent = 'Please try again';
                icon.textContent = '⚠️';
                break;
        }
    }

    formatSaveTime() {
        if (!this.lastSaveTime) return 'just now';
        
        const now = new Date();
        const diff = Math.floor((now - this.lastSaveTime) / 1000);
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        return `${Math.floor(diff / 3600)} hours ago`;
    }

    updateProgressBar() {
        const percentage = (this.currentStep / this.totalSteps) * 100;
        const progressFill = document.getElementById('main-progress-fill');
        const progressStep = document.getElementById('progress-step');
        const progressPercentage = document.getElementById('progress-percentage');
        
        progressFill.style.width = `${percentage}%`;
        progressStep.textContent = this.currentStep;
        progressPercentage.textContent = Math.round(percentage);
        
        // Update step indicators
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    setupBodyDiagram() {
        const bodyParts = document.querySelectorAll('.body-part');
        const selectedAreas = document.getElementById('selected-body-areas');
        const clearBtn = document.getElementById('clear-body-areas');
        
        bodyParts.forEach(part => {
            part.addEventListener('click', (e) => {
                const partName = e.target.dataset.part;
                this.toggleBodyPart(partName);
            });
            
            // Keyboard accessibility
            part.setAttribute('tabindex', '0');
            part.setAttribute('role', 'button');
            part.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const partName = e.target.dataset.part;
                    this.toggleBodyPart(partName);
                }
            });
        });
        
        clearBtn?.addEventListener('click', () => this.clearBodyParts());
        
        // Body view toggle (front/back)
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchBodyView(view);
            });
        });
    }

    toggleBodyPart(partName) {
        if (this.selectedBodyParts.has(partName)) {
            this.selectedBodyParts.delete(partName);
        } else {
            this.selectedBodyParts.add(partName);
        }
        
        this.updateBodyPartDisplay();
        this.announceToScreenReader(`${partName} ${this.selectedBodyParts.has(partName) ? 'selected' : 'deselected'}`);
    }

    updateBodyPartDisplay() {
        const selectedAreas = document.getElementById('selected-body-areas');
        const clearBtn = document.getElementById('clear-body-areas');
        
        selectedAreas.innerHTML = '';
        
        this.selectedBodyParts.forEach(part => {
            const tag = document.createElement('span');
            tag.className = 'area-tag';
            tag.innerHTML = `
                ${this.formatBodyPartName(part)}
                <button type="button" class="remove-tag" onclick="assessment.removeBodyPart('${part}')" aria-label="Remove ${part}">×</button>
            `;
            selectedAreas.appendChild(tag);
        });
        
        clearBtn.style.display = this.selectedBodyParts.size > 0 ? 'block' : 'none';
        
        // Update visual indicators on diagram
        document.querySelectorAll('.body-part').forEach(part => {
            const partName = part.dataset.part;
            if (this.selectedBodyParts.has(partName)) {
                part.classList.add('selected');
            } else {
                part.classList.remove('selected');
            }
        });
    }

    formatBodyPartName(part) {
        return part.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    removeBodyPart(partName) {
        this.selectedBodyParts.delete(partName);
        this.updateBodyPartDisplay();
        this.announceToScreenReader(`${partName} removed from selection`);
    }

    clearBodyParts() {
        this.selectedBodyParts.clear();
        this.updateBodyPartDisplay();
        this.announceToScreenReader('All body parts cleared from selection');
    }

    switchBodyView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        const frontView = document.querySelector('.front-view');
        const backView = document.querySelector('.back-view');
        
        if (view === 'back') {
            frontView?.style.setProperty('display', 'none');
            backView?.style.setProperty('display', 'block');
        } else {
            frontView?.style.setProperty('display', 'block');
            backView?.style.setProperty('display', 'none');
        }
        
        this.announceToScreenReader(`Switched to ${view} view of body diagram`);
    }

    setupMedicationSearch() {
        const searchInput = document.getElementById('medication-search');
        const suggestions = document.getElementById('medication-suggestions');
        const selectedMeds = document.getElementById('selected-medications');
        const noMedsCheckbox = document.getElementById('no-medications');
        
        // Mock medication database - in production, this would be an API call
        const medicationDatabase = [
            'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Lisinopril', 'Metformin',
            'Amlodipine', 'Metoprolol', 'Omeprazole', 'Simvastatin', 'Losartan',
            'Albuterol', 'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Prednisone'
        ];
        
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.length < 2) {
                suggestions.style.display = 'none';
                return;
            }
            
            const matches = medicationDatabase.filter(med => 
                med.toLowerCase().includes(query)
            ).slice(0, 5);
            
            this.displayMedicationSuggestions(matches);
        });
        
        noMedsCheckbox?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.medications.clear();
                this.updateMedicationDisplay();
                searchInput.disabled = true;
            } else {
                searchInput.disabled = false;
            }
        });
    }

    displayMedicationSuggestions(matches) {
        const suggestions = document.getElementById('medication-suggestions');
        
        suggestions.innerHTML = matches.map(med => `
            <button type="button" class="medication-suggestion" onclick="assessment.addMedication('${med}')">
                ${med}
            </button>
        `).join('');
        
        suggestions.style.display = matches.length > 0 ? 'block' : 'none';
    }

    addMedication(medication) {
        this.medications.add(medication);
        this.updateMedicationDisplay();
        document.getElementById('medication-search').value = '';
        document.getElementById('medication-suggestions').style.display = 'none';
        this.announceToScreenReader(`${medication} added to medications list`);
    }

    updateMedicationDisplay() {
        const selectedMeds = document.getElementById('selected-medications');
        
        selectedMeds.innerHTML = Array.from(this.medications).map(med => `
            <span class="medication-tag">
                ${med}
                <button type="button" class="remove-tag" onclick="assessment.removeMedication('${med}')" aria-label="Remove ${med}">×</button>
            </span>
        `).join('');
    }

    removeMedication(medication) {
        this.medications.delete(medication);
        this.updateMedicationDisplay();
        this.announceToScreenReader(`${medication} removed from medications list`);
    }

    updateBMI() {
        const height = parseFloat(document.getElementById('height')?.value);
        const weight = parseFloat(document.getElementById('weight')?.value);
        const heightUnit = document.getElementById('height-unit')?.value;
        const weightUnit = document.getElementById('weight-unit')?.value;
        
        if (!height || !weight) return;
        
        // Convert to metric
        let heightM = heightUnit === 'cm' ? height / 100 : height * 0.3048;
        let weightKg = weightUnit === 'kg' ? weight : weight * 0.453592;
        
        const bmi = weightKg / (heightM * heightM);
        const bmiValue = document.getElementById('bmi-value');
        const bmiCategory = document.getElementById('bmi-category');
        
        bmiValue.textContent = bmi.toFixed(1);
        
        let category, color;
        if (bmi < 18.5) {
            category = 'Underweight';
            color = 'var(--medical-warning)';
        } else if (bmi < 25) {
            category = 'Normal';
            color = 'var(--medical-success)';
        } else if (bmi < 30) {
            category = 'Overweight';
            color = 'var(--medical-warning)';
        } else {
            category = 'Obese';
            color = 'var(--medical-danger)';
        }
        
        bmiCategory.textContent = category;
        bmiCategory.style.color = color;
    }

    setupFileUpload() {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        const uploadedFiles = document.getElementById('uploaded-files');
        
        // Drag and drop functionality
        fileUploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('drag-over');
        });
        
        fileUploadArea?.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('drag-over');
        });
        
        fileUploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // Click to browse
        fileUploadArea?.addEventListener('click', () => fileInput?.click());
        
        fileInput?.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push(file);
                this.displayUploadedFile(file);
            }
        });
    }

    validateFile(file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload PDF, JPG, PNG, or DOCX files.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File too large. Maximum size is 10MB.');
            return false;
        }
        
        return true;
    }

    displayUploadedFile(file) {
        const uploadedFiles = document.getElementById('uploaded-files');
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <div class="file-info">
                <span class="file-icon">${this.getFileIcon(file.type)}</span>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
            </div>
            <button type="button" class="remove-file" onclick="assessment.removeFile('${file.name}')" aria-label="Remove ${file.name}">×</button>
        `;
        uploadedFiles.appendChild(fileElement);
    }

    getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
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

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== fileName);
        const fileElements = document.querySelectorAll('.uploaded-file');
        fileElements.forEach(el => {
            if (el.querySelector('.file-name').textContent === fileName) {
                el.remove();
            }
        });
    }

    setupVoiceRecording() {
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        const recordingStatus = document.getElementById('recording-status');
        const recordedAudio = document.getElementById('recorded-audio');
        
        startBtn?.addEventListener('click', () => this.startRecording());
        stopBtn?.addEventListener('click', () => this.stopRecording());
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
                this.recordingData = audioBlob;
                this.displayRecordedAudio(audioBlob);
            };
            
            this.mediaRecorder.start();
            this.startRecordingTimer();
            
            document.getElementById('start-recording').style.display = 'none';
            document.getElementById('stop-recording').style.display = 'block';
            document.getElementById('recording-status').style.display = 'flex';
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Unable to access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        this.stopRecordingTimer();
        
        document.getElementById('start-recording').style.display = 'block';
        document.getElementById('stop-recording').style.display = 'none';
        document.getElementById('recording-status').style.display = 'none';
    }

    startRecordingTimer() {
        this.recordingStartTime = Date.now();
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.querySelector('.recording-time').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    displayRecordedAudio(audioBlob) {
        const recordedAudio = document.getElementById('recorded-audio');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        recordedAudio.innerHTML = `
            <div class="audio-player">
                <audio controls>
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                <button type="button" class="delete-recording" onclick="assessment.deleteRecording()">Delete Recording</button>
            </div>
        `;
        
        recordedAudio.style.display = 'block';
    }

    deleteRecording() {
        this.recordingData = null;
        document.getElementById('recorded-audio').style.display = 'none';
        document.getElementById('recorded-audio').innerHTML = '';
    }

    // Step navigation methods
    nextStep() {
        if (this.validateCurrentStep()) {
            this.collectCurrentStepData();
            
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateUI();
                this.initializeCurrentStep();
                this.autoSave();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.collectCurrentStepData();
            this.currentStep--;
            this.updateUI();
            this.initializeCurrentStep();
        }
    }

    goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
            this.collectCurrentStepData();
            this.currentStep = stepNum;
            this.updateUI();
            this.initializeCurrentStep();
        }
    }

    updateUI() {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        document.getElementById(`step-${this.currentStep}`)?.classList.add('active');
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-assessment');
        
        prevBtn.disabled = this.currentStep === 1;
        
        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }
        
        // Update sidebar navigation
        document.querySelectorAll('.nav-step').forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });
        
        // Update progress bar
        this.updateProgressBar();
        
        // Focus management for accessibility
        this.manageFocus();
    }

    initializeCurrentStep() {
        switch (this.currentStep) {
            case 1:
                this.initializeStep1();
                break;
            case 2:
                this.initializeStep2();
                break;
            case 3:
                this.initializeStep3();
                break;
            case 4:
                this.initializeStep4();
                break;
        }
    }

    initializeStep1() {
        // Focus on first input
        document.getElementById('age-slider')?.focus();
    }

    initializeStep2() {
        // Focus on primary symptom textarea
        document.getElementById('primary-symptom')?.focus();
    }

    initializeStep3() {
        // Generate dynamic questions based on previous answers
        this.generateDynamicQuestions();
    }

    async initializeStep4() {
        // Start AI analysis simulation
        this.startAnalysisAnimation();
        
        // Simulate analysis process
        setTimeout(() => {
            this.displayResults();
        }, 8000);
    }

    startAnalysisAnimation() {
        document.getElementById('analysis-loading').style.display = 'block';
        document.getElementById('analysis-results').style.display = 'none';
        
        // Animate progress messages
        const messages = document.querySelectorAll('.message');
        let currentMessage = 0;
        
        const animateMessage = () => {
            if (currentMessage < messages.length) {
                messages[currentMessage].classList.add('active');
                currentMessage++;
                setTimeout(animateMessage, 1500);
            }
        };
        
        animateMessage();
    }

    displayResults() {
        document.getElementById('analysis-loading').style.display = 'none';
        document.getElementById('analysis-results').style.display = 'block';
        
        // Announce completion to screen reader
        this.announceToScreenReader('AI analysis complete. Results are now available.');
    }

    validateCurrentStep() {
        // Implement validation logic for each step
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            default:
                return true;
        }
    }

    validateStep1() {
        const age = document.getElementById('age-slider')?.value;
        const gender = document.querySelector('input[name="gender"]:checked');
        const height = document.getElementById('height')?.value;
        const weight = document.getElementById('weight')?.value;
        const activity = document.querySelector('input[name="activity"]:checked');
        
        if (!age || !gender || !height || !weight || !activity) {
            this.showValidationError('Please complete all required fields in Step 1.');
            return false;
        }
        
        return true;
    }

    validateStep2() {
        const primarySymptom = document.getElementById('primary-symptom')?.value.trim();
        const duration = document.querySelector('input[name="duration"]:checked');
        const severity = document.querySelector('input[name="severity"]:checked');
        
        if (!primarySymptom || primarySymptom.length < 10) {
            this.showValidationError('Please describe your primary symptom in at least 10 characters.');
            return false;
        }
        
        if (!duration) {
            this.showValidationError('Please select how long you have been experiencing symptoms.');
            return false;
        }
        
        if (!severity) {
            this.showValidationError('Please rate your pain/discomfort level.');
            return false;
        }
        
        return true;
    }

    validateStep3() {
        // Step 3 validation is mostly optional, so we'll just return true
        return true;
    }

    showValidationError(message) {
        // Create or update validation message
        let errorDiv = document.querySelector('.validation-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'polite');
        }
        
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: var(--medical-danger);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        `;
        
        const currentStep = document.getElementById(`step-${this.currentStep}`);
        const stepHeader = currentStep?.querySelector('.step-header');
        stepHeader?.appendChild(errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            errorDiv?.remove();
        }, 5000);
        
        // Announce to screen reader
        this.announceToScreenReader(message);
    }

    collectCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                this.formData.basicProfile = this.collectStep1Data();
                break;
            case 2:
                this.formData.symptoms = this.collectStep2Data();
                break;
            case 3:
                this.formData.contextualInfo = this.collectStep3Data();
                break;
        }
    }

    collectStep1Data() {
        return {
            age: document.getElementById('age-slider')?.value,
            gender: document.querySelector('input[name="gender"]:checked')?.value,
            customGender: document.getElementById('custom-gender')?.value,
            height: document.getElementById('height')?.value,
            heightUnit: document.getElementById('height-unit')?.value,
            weight: document.getElementById('weight')?.value,
            weightUnit: document.getElementById('weight-unit')?.value,
            activityLevel: document.querySelector('input[name="activity"]:checked')?.value,
            medications: Array.from(this.medications),
            noMedications: document.getElementById('no-medications')?.checked
        };
    }

    collectStep2Data() {
        return {
            primarySymptom: document.getElementById('primary-symptom')?.value,
            duration: document.querySelector('input[name="duration"]:checked')?.value,
            severity: document.querySelector('input[name="severity"]:checked')?.value,
            affectedAreas: Array.from(this.selectedBodyParts),
            additionalSymptoms: Array.from(document.querySelectorAll('input[name="additional-symptoms"]:checked')).map(cb => cb.value)
        };
    }

    collectStep3Data() {
        return {
            allergies: document.querySelector('input[name="allergies"]:checked')?.value,
            allergiesDetails: document.querySelector('#allergies-details textarea')?.value,
            pregnancy: document.querySelector('input[name="pregnancy"]:checked')?.value,
            chronicConditions: document.querySelector('input[name="chronic-conditions"]:checked')?.value,
            conditions: Array.from(document.querySelectorAll('input[name="conditions"]:checked')).map(cb => cb.value),
            symptomOnset: document.getElementById('symptom-onset')?.value,
            uploadedFiles: this.uploadedFiles.map(f => f.name),
            voiceRecording: this.recordingData !== null,
            dynamicQuestions: this.dynamicQuestions
        };
    }

    async submitAssessment(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) return;
        
        this.collectCurrentStepData();
        
        const submissionData = {
            ...this.formData,
            submittedAt: new Date().toISOString(),
            assessmentId: this.generateAssessmentId()
        };
        
        try {
            const response = await fetch('/api/health-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });
            
            if (response.ok) {
                const result = await response.json();
                localStorage.removeItem('health_assessment_progress');
                // Results are displayed in step 4, no redirect needed
                this.announceToScreenReader('Assessment submitted successfully. Analyzing your health data.');
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            this.showValidationError('Failed to submit assessment. Please try again.');
        }
    }

    generateAssessmentId() {
        return 'assessment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Accessibility methods
    setupAccessibility() {
        // Add ARIA labels and descriptions
        this.addAriaLabels();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Announce page changes
        this.announceToScreenReader('Health Assessment wizard loaded. Use Tab to navigate between form elements.');
    }

    addAriaLabels() {
        // Add appropriate ARIA labels to form elements
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                const label = element.closest('.form-section')?.querySelector('label');
                if (label) {
                    element.setAttribute('aria-describedby', label.textContent);
                }
            }
        });
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation for the wizard
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        if (this.currentStep < this.totalSteps) this.nextStep();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (this.currentStep > 1) this.previousStep();
                        break;
                    case 's':
                        e.preventDefault();
                        this.autoSave();
                        break;
                }
            }
        });
    }

    manageFocus() {
        // Move focus to the first focusable element in the current step
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        const firstFocusable = currentStepElement?.querySelector('input, select, textarea, button');
        firstFocusable?.focus();
    }

    announceToScreenReader(message) {
        // Create a live region for screen reader announcements
        let liveRegion = document.getElementById('sr-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'sr-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
    }

    handleKeyboardNavigation(e) {
        // Handle keyboard shortcuts
        if (e.altKey) {
            switch (e.key) {
                case '1':
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    const stepNum = parseInt(e.key);
                    if (stepNum <= this.getHighestCompletedStep() + 1) {
                        this.goToStep(stepNum);
                    }
                    break;
            }
        }
    }

    getHighestCompletedStep() {
        // Logic to determine which steps have been completed
        let completed = 0;
        if (this.formData.basicProfile) completed = Math.max(completed, 1);
        if (this.formData.symptoms) completed = Math.max(completed, 2);
        if (this.formData.contextualInfo) completed = Math.max(completed, 3);
        return completed;
    }

    handleSidebarNavigation(e) {
        const stepNum = parseInt(e.currentTarget.dataset.step);
        if (stepNum <= this.getHighestCompletedStep() + 1) {
            this.goToStep(stepNum);
        } else {
            this.announceToScreenReader(`Step ${stepNum} is not yet available. Please complete the current step first.`);
        }
    }

    // Results and sharing methods
    async downloadPDF() {
        try {
            this.announceToScreenReader('Generating PDF report...');
            
            // Mock PDF generation - in production, this would call an API
            const pdfData = {
                assessmentData: this.formData,
                generatedAt: new Date().toISOString()
            };
            
            // Simulate PDF generation delay
            setTimeout(() => {
                const blob = new Blob([JSON.stringify(pdfData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `health-assessment-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.announceToScreenReader('PDF report downloaded successfully.');
            }, 1000);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.announceToScreenReader('Failed to generate PDF report. Please try again.');
        }
    }

    toggleSharingOptions() {
        const sharingOptions = document.getElementById('sharing-options');
        const isVisible = sharingOptions.style.display === 'block';
        sharingOptions.style.display = isVisible ? 'none' : 'block';
        
        this.announceToScreenReader(isVisible ? 'Sharing options hidden' : 'Sharing options displayed');
    }

    handleShare(method) {
        switch (method) {
            case 'email':
                this.shareViaEmail();
                break;
            case 'link':
                this.copyShareLink();
                break;
            case 'print':
                this.printReport();
                break;
        }
    }

    shareViaEmail() {
        const subject = 'Health Assessment Report';
        const body = 'Please find my health assessment report attached.';
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        
        this.announceToScreenReader('Email client opened with health assessment report');
    }

    async copyShareLink() {
        try {
            const shareLink = `${window.location.origin}/assessment/shared/${this.generateAssessmentId()}`;
            await navigator.clipboard.writeText(shareLink);
            this.announceToScreenReader('Share link copied to clipboard');
            
            // Visual feedback
            const btn = document.querySelector('[data-method="link"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="share-icon">✓</span>Copied!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy link:', error);
            this.announceToScreenReader('Failed to copy share link');
        }
    }

    printReport() {
        window.print();
        this.announceToScreenReader('Print dialog opened for health assessment report');
    }

    saveToProfile() {
        // Mock save to profile functionality
        const profileData = {
            ...this.formData,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('health_profile_' + Date.now(), JSON.stringify(profileData));
        this.announceToScreenReader('Health assessment saved to your profile');
        
        // Visual feedback
        const btn = document.getElementById('save-to-profile-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">✓</span>Saved!';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }

    saveAndExit() {
        if (confirm('Are you sure you want to save and exit? You can resume your assessment later.')) {
            this.collectCurrentStepData();
            this.autoSave();
            this.announceToScreenReader('Assessment saved. You can resume later from the dashboard.');
            window.location.href = '/dashboard';
        }
    }

    loadSavedData() {
        const savedData = localStorage.getItem('health_assessment_progress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.currentStep = data.currentStep || 1;
                this.formData = data.formData || {};
                this.medications = new Set(data.medications || []);
                this.selectedBodyParts = new Set(data.selectedBodyParts || []);
                
                // Restore form fields
                this.restoreFormData();
                
                this.announceToScreenReader('Previous assessment progress loaded');
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    restoreFormData() {
        // Restore Step 1 data
        if (this.formData.basicProfile) {
            const profile = this.formData.basicProfile;
            document.getElementById('age-slider').value = profile.age || 25;
            document.getElementById('age-value').textContent = profile.age || 25;
            
            if (profile.gender) {
                document.querySelector(`input[value="${profile.gender}"]`).checked = true;
            }
            
            // Restore other fields...
        }
        
        // Update displays
        this.updateMedicationDisplay();
        this.updateBodyPartDisplay();
        this.updateBMI();
    }

    generateDynamicQuestions() {
        // Generate contextual questions based on previous answers
        const questionsContainer = document.getElementById('dynamic-questions-container');
        const symptoms = this.formData.symptoms;
        const profile = this.formData.basicProfile;
        
        if (!symptoms || !profile) return;
        
        // Clear existing dynamic questions
        questionsContainer.innerHTML = '';
        
        // Generate questions based on symptoms
        if (symptoms.primarySymptom.toLowerCase().includes('chest')) {
            this.addDynamicQuestion('chest-related', 'Do you experience shortness of breath?', 'yes-no');
        }
        
        if (symptoms.severity > 7) {
            this.addDynamicQuestion('high-pain', 'Have you taken any pain medication for this?', 'yes-no');
        }
        
        if (profile.age > 50) {
            this.addDynamicQuestion('age-related', 'Have you had any recent changes in your health routine?', 'yes-no');
        }
    }

    addDynamicQuestion(id, question, type) {
        const questionsContainer = document.getElementById('dynamic-questions-container');
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-group dynamic-question';
        questionDiv.dataset.questionId = id;
        
        questionDiv.innerHTML = `
            <div class="form-section">
                <label class="section-label">${question}</label>
                <div class="yes-no-toggle">
                    <input type="radio" id="${id}-yes" name="${id}" value="yes">
                    <label for="${id}-yes" class="toggle-option">Yes</label>
                    <input type="radio" id="${id}-no" name="${id}" value="no">
                    <label for="${id}-no" class="toggle-option">No</label>
                </div>
            </div>
        `;
        
        questionsContainer.appendChild(questionDiv);
        this.dynamicQuestions.push({ id, question, type });
    }
}

// Initialize the enhanced assessment when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.assessment = new EnhancedHealthAssessment();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedHealthAssessment;
}