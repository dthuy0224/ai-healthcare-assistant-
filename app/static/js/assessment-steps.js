/* ================================
   AI HEALTH ASSESSMENT - STEP LOGIC
   Interactive functionality for assessment wizard
   ================================ */

class HealthAssessmentWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.autoSaveInterval = null;
        this.medications = [];
        this.selectedBodyParts = [];
        this.recordingData = null;
        this.uploadedFiles = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadSavedData();
        this.updateUI();
        this.initializeStep1();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prev-step')?.addEventListener('click', () => this.previousStep());
        document.getElementById('next-step')?.addEventListener('click', () => this.nextStep());
        document.getElementById('submit-assessment')?.addEventListener('click', (e) => this.submitAssessment(e));
        
        // Sidebar navigation
        document.querySelectorAll('.nav-step').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepNum = parseInt(e.currentTarget.dataset.step);
                if (stepNum <= this.getHighestCompletedStep() + 1) {
                    this.goToStep(stepNum);
                }
            });
        });

        // Save & Exit button
        document.querySelector('.btn-save-exit')?.addEventListener('click', () => this.saveAndExit());
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
            this.updateAutoSaveIndicator();
        }, 30000);
    }

    initializeStep1() {
        // Age slider
        const ageSlider = document.getElementById('age-slider');
        const ageValue = document.getElementById('age-value');
        
        if (ageSlider && ageValue) {
            ageSlider.addEventListener('input', (e) => {
                const age = e.target.value;
                ageValue.textContent = age;
                this.updateSliderFill(ageSlider);
                this.calculateBMI();
            });
            this.updateSliderFill(ageSlider);
        }

        // Height/Weight inputs with unit conversion
        this.setupMeasurementInputs();
        
        // Medication search
        this.setupMedicationSearch();
        
        // No medications checkbox
        const noMedicationsCheck = document.getElementById('no-medications');
        if (noMedicationsCheck) {
            noMedicationsCheck.addEventListener('change', (e) => {
                const medicationSection = document.querySelector('.medication-search');
                const selectedMedications = document.getElementById('selected-medications');
                
                if (e.target.checked) {
                    medicationSection.style.display = 'none';
                    selectedMedications.innerHTML = '';
                    this.medications = [];
                } else {
                    medicationSection.style.display = 'block';
                }
            });
        }
    }

    setupMeasurementInputs() {
        const heightInput = document.getElementById('height');
        const heightUnit = document.getElementById('height-unit');
        const heightConversion = document.getElementById('height-conversion');
        const weightInput = document.getElementById('weight');
        const weightUnit = document.getElementById('weight-unit');
        const weightConversion = document.getElementById('weight-conversion');

        // Height conversion
        const updateHeightConversion = () => {
            const height = parseFloat(heightInput?.value || 0);
            const unit = heightUnit?.value || 'cm';
            
            if (height > 0) {
                if (unit === 'cm') {
                    const feet = Math.floor(height / 30.48);
                    const inches = Math.round((height / 30.48 - feet) * 12);
                    heightConversion.textContent = `${feet}'${inches}"`;
                } else {
                    const cm = Math.round(height * 30.48);
                    heightConversion.textContent = `${cm} cm`;
                }
            }
            this.calculateBMI();
        };

        // Weight conversion
        const updateWeightConversion = () => {
            const weight = parseFloat(weightInput?.value || 0);
            const unit = weightUnit?.value || 'kg';
            
            if (weight > 0) {
                if (unit === 'kg') {
                    const lbs = Math.round(weight * 2.205);
                    weightConversion.textContent = `${lbs} lbs`;
                } else {
                    const kg = Math.round(weight / 2.205);
                    weightConversion.textContent = `${kg} kg`;
                }
            }
            this.calculateBMI();
        };

        heightInput?.addEventListener('input', updateHeightConversion);
        heightUnit?.addEventListener('change', updateHeightConversion);
        weightInput?.addEventListener('input', updateWeightConversion);
        weightUnit?.addEventListener('change', updateWeightConversion);
    }

    calculateBMI() {
        const heightInput = document.getElementById('height');
        const heightUnit = document.getElementById('height-unit');
        const weightInput = document.getElementById('weight');
        const weightUnit = document.getElementById('weight-unit');
        const bmiValue = document.getElementById('bmi-value');
        const bmiCategory = document.getElementById('bmi-category');

        if (!heightInput || !weightInput || !bmiValue || !bmiCategory) return;

        const height = parseFloat(heightInput.value || 0);
        const weight = parseFloat(weightInput.value || 0);

        if (height > 0 && weight > 0) {
            // Convert to metric
            let heightM = height;
            let weightKg = weight;

            if (heightUnit?.value === 'ft') {
                heightM = height * 0.3048; // feet to meters
            } else {
                heightM = height / 100; // cm to meters
            }

            if (weightUnit?.value === 'lbs') {
                weightKg = weight / 2.205; // lbs to kg
            }

            const bmi = weightKg / (heightM * heightM);
            bmiValue.textContent = bmi.toFixed(1);

            // BMI categories
            let category = '';
            let categoryClass = '';
            
            if (bmi < 18.5) {
                category = 'Underweight';
                categoryClass = 'warning';
            } else if (bmi < 25) {
                category = 'Normal';
                categoryClass = 'success';
            } else if (bmi < 30) {
                category = 'Overweight';
                categoryClass = 'warning';
            } else {
                category = 'Obese';
                categoryClass = 'error';
            }

            bmiCategory.textContent = category;
            bmiCategory.className = `bmi-category ${categoryClass}`;
        }
    }

    setupMedicationSearch() {
        const medicationInput = document.getElementById('medication-search');
        const suggestions = document.getElementById('medication-suggestions');
        
        // Mock medication database
        const medications = [
            'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Metformin', 'Lisinopril',
            'Amlodipine', 'Metoprolol', 'Omeprazole', 'Simvastatin', 'Losartan',
            'Hydrochlorothiazide', 'Gabapentin', 'Sertraline', 'Escitalopram', 'Fluoxetine'
        ];

        if (medicationInput && suggestions) {
            medicationInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                suggestions.innerHTML = '';
                
                if (query.length > 1) {
                    const matches = medications.filter(med => 
                        med.toLowerCase().includes(query)
                    );
                    
                    if (matches.length > 0) {
                        matches.slice(0, 5).forEach(med => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.textContent = med;
                            item.addEventListener('click', () => this.addMedication(med));
                            suggestions.appendChild(item);
                        });
                        suggestions.classList.add('show');
                    }
                } else {
                    suggestions.classList.remove('show');
                }
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.medication-search')) {
                    suggestions.classList.remove('show');
                }
            });
        }
    }

    addMedication(medication) {
        if (!this.medications.includes(medication)) {
            this.medications.push(medication);
            this.updateSelectedMedications();
        }
        
        // Clear input and hide suggestions
        const input = document.getElementById('medication-search');
        const suggestions = document.getElementById('medication-suggestions');
        if (input) input.value = '';
        if (suggestions) suggestions.classList.remove('show');
    }

    updateSelectedMedications() {
        const container = document.getElementById('selected-medications');
        if (!container) return;

        container.innerHTML = '';
        this.medications.forEach(med => {
            const tag = document.createElement('div');
            tag.className = 'medication-tag';
            tag.innerHTML = `
                <span>${med}</span>
                <button type="button" class="medication-remove" onclick="assessmentWizard.removeMedication('${med}')">×</button>
            `;
            container.appendChild(tag);
        });
    }

    removeMedication(medication) {
        this.medications = this.medications.filter(med => med !== medication);
        this.updateSelectedMedications();
    }

    initializeStep2() {
        // Character counter for symptom textarea
        const symptomTextarea = document.getElementById('primary-symptom');
        const characterCount = document.getElementById('symptom-count');
        
        if (symptomTextarea && characterCount) {
            symptomTextarea.addEventListener('input', (e) => {
                const count = e.target.value.length;
                characterCount.textContent = count;
                
                if (count > 450) {
                    characterCount.style.color = 'var(--warning-orange)';
                } else if (count > 480) {
                    characterCount.style.color = 'var(--error-red)';
                } else {
                    characterCount.style.color = 'var(--text-tertiary)';
                }
            });
        }

        // Body diagram interaction
        this.setupBodyDiagram();
    }

    setupBodyDiagram() {
        const bodyParts = document.querySelectorAll('.body-part');
        const selectedAreasContainer = document.getElementById('selected-body-areas');
        
        bodyParts.forEach(part => {
            part.addEventListener('click', (e) => {
                const partName = e.target.dataset.part;
                
                if (part.classList.contains('selected')) {
                    part.classList.remove('selected');
                    this.selectedBodyParts = this.selectedBodyParts.filter(p => p !== partName);
                } else {
                    part.classList.add('selected');
                    this.selectedBodyParts.push(partName);
                }
                
                this.updateSelectedBodyAreas();
            });
        });

        // Body view toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                viewButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Toggle body parts visibility
                document.querySelectorAll('.body-part').forEach(part => {
                    if (view === 'back' && part.classList.contains('back-view')) {
                        part.style.display = 'block';
                    } else if (view === 'front' && !part.classList.contains('back-view')) {
                        part.style.display = 'block';
                    } else if (view === 'back' && !part.classList.contains('back-view')) {
                        part.style.display = 'none';
                    } else if (view === 'front' && part.classList.contains('back-view')) {
                        part.style.display = 'none';
                    }
                });
            });
        });
    }

    updateSelectedBodyAreas() {
        const container = document.getElementById('selected-body-areas');
        if (!container) return;

        container.innerHTML = '';
        this.selectedBodyParts.forEach(part => {
            const tag = document.createElement('div');
            tag.className = 'area-tag';
            tag.innerHTML = `
                <span>${this.formatBodyPartName(part)}</span>
                <button type="button" class="area-remove" onclick="assessmentWizard.removeBodyPart('${part}')">×</button>
            `;
            container.appendChild(tag);
        });
    }

    formatBodyPartName(part) {
        return part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    removeBodyPart(part) {
        this.selectedBodyParts = this.selectedBodyParts.filter(p => p !== part);
        document.querySelector(`[data-part="${part}"]`)?.classList.remove('selected');
        this.updateSelectedBodyAreas();
    }

    initializeStep3() {
        // Date presets
        const datePresets = document.querySelectorAll('.date-preset');
        const dateInput = document.getElementById('symptom-onset');
        
        datePresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                const date = new Date();
                date.setDate(date.getDate() - days);
                
                if (dateInput) {
                    dateInput.value = date.toISOString().split('T')[0];
                }
            });
        });

        // File upload
        this.setupFileUpload();
        
        // Voice recording
        this.setupVoiceRecording();
        
        // Generate dynamic questions based on previous answers
        this.generateDynamicQuestions();
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        const uploadButton = document.querySelector('.upload-button');
        
        if (uploadButton && fileInput) {
            uploadButton.addEventListener('click', () => fileInput.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }

        if (uploadArea) {
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
                this.handleFiles(e.dataTransfer.files);
            });
        }
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push(file);
                this.addFileToDisplay(file);
            }
        });
    }

    validateFile(file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert('File type not supported. Please upload PDF, JPG, PNG, or DOCX files.');
            return false;
        }

        if (file.size > maxSize) {
            alert('File size too large. Maximum size is 10MB.');
            return false;
        }

        return true;
    }

    addFileToDisplay(file) {
        const container = document.getElementById('uploaded-files');
        if (!container) return;

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${this.getFileIcon(file.type)}</div>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="assessmentWizard.removeFile('${file.name}')">Remove</button>
        `;
        container.appendChild(fileItem);
    }

    getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('word')) return '📝';
        return '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        const fileItem = Array.from(document.querySelectorAll('.file-name'))
            .find(el => el.textContent === fileName)?.closest('.file-item');
        if (fileItem) fileItem.remove();
    }

    setupVoiceRecording() {
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        const status = document.getElementById('recording-status');
        const audioContainer = document.getElementById('recorded-audio');
        
        let mediaRecorder;
        let recordingTimer;
        let recordingTime = 0;

        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    
                    mediaRecorder.start();
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'inline-flex';
                    status.style.display = 'flex';
                    
                    recordingTime = 0;
                    recordingTimer = setInterval(() => {
                        recordingTime++;
                        const minutes = Math.floor(recordingTime / 60);
                        const seconds = recordingTime % 60;
                        document.querySelector('.recording-time').textContent = 
                            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }, 1000);
                    
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            this.recordingData = e.data;
                            this.createAudioPlayer(e.data);
                        }
                    };
                } catch (err) {
                    alert('Microphone access denied. Please enable microphone permissions.');
                }
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                    
                    startBtn.style.display = 'inline-flex';
                    stopBtn.style.display = 'none';
                    status.style.display = 'none';
                    
                    clearInterval(recordingTimer);
                }
            });
        }
    }

    createAudioPlayer(audioBlob) {
        const container = document.getElementById('recorded-audio');
        if (!container) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        container.innerHTML = `
            <audio controls style="width: 100%; margin-top: 1rem;">
                <source src="${audioUrl}" type="audio/webm">
                Your browser does not support the audio element.
            </audio>
            <button type="button" onclick="assessmentWizard.removeRecording()" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--error-red); color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Remove Recording</button>
        `;
        container.style.display = 'block';
    }

    removeRecording() {
        this.recordingData = null;
        const container = document.getElementById('recorded-audio');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    generateDynamicQuestions() {
        const container = document.getElementById('dynamic-questions');
        if (!container) return;

        // Generate questions based on previous answers
        const questions = this.getDynamicQuestions();
        
        container.innerHTML = '';
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'dynamic-question';
            questionDiv.innerHTML = `
                <div class="question-text">${question.text}</div>
                <div class="toggle-options">
                    <div class="toggle-option">
                        <button type="button" class="toggle-btn" data-question="${index}" data-answer="yes">Yes</button>
                    </div>
                    <div class="toggle-option">
                        <button type="button" class="toggle-btn" data-question="${index}" data-answer="no">No</button>
                    </div>
                </div>
                ${question.followUp ? `<div class="follow-up-question" id="followup-${index}">${question.followUp}</div>` : ''}
            `;
            container.appendChild(questionDiv);
        });

        // Add event listeners for toggle buttons
        container.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionIndex = e.target.dataset.question;
                const answer = e.target.dataset.answer;
                
                // Update button states
                const questionDiv = e.target.closest('.dynamic-question');
                questionDiv.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show/hide follow-up questions
                const followUp = document.getElementById(`followup-${questionIndex}`);
                if (followUp) {
                    if (answer === 'yes') {
                        followUp.classList.add('show');
                    } else {
                        followUp.classList.remove('show');
                    }
                }
            });
        });
    }

    getDynamicQuestions() {
        // Generate questions based on form data
        const questions = [
            {
                text: "Have you experienced this symptom before?",
                followUp: '<input type="text" placeholder="When was the last time?" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-light); border-radius: 0.375rem; margin-top: 0.5rem;">'
            },
            {
                text: "Are you currently taking any medication for this condition?",
                followUp: '<textarea placeholder="Please specify which medications..." style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-light); border-radius: 0.375rem; margin-top: 0.5rem; resize: vertical;" rows="3"></textarea>'
            },
            {
                text: "Have you consulted with a healthcare provider about this?",
                followUp: '<input type="text" placeholder="When and what was their advice?" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-light); border-radius: 0.375rem; margin-top: 0.5rem;">'
            }
        ];

        return questions;
    }

    initializeStep4() {
        // Show loading animation
        this.startAnalysisAnimation();
    }

    startAnalysisAnimation() {
        const loading = document.getElementById('analysis-loading');
        const results = document.getElementById('analysis-results');
        
        if (loading) loading.style.display = 'block';
        if (results) results.style.display = 'none';

        // Simulate AI analysis process
        const messages = document.querySelectorAll('.message');
        let currentMessage = 0;

        const progressMessages = () => {
            if (currentMessage < messages.length) {
                // Mark previous as completed
                if (currentMessage > 0) {
                    messages[currentMessage - 1].classList.remove('active');
                    messages[currentMessage - 1].classList.add('completed');
                }
                
                // Mark current as active
                messages[currentMessage].classList.add('active');
                currentMessage++;
                
                // Continue to next message
                setTimeout(progressMessages, 2000);
            } else {
                // All messages completed, show results
                setTimeout(() => {
                    if (loading) loading.style.display = 'none';
                    if (results) results.style.display = 'block';
                    this.generateAnalysisResults();
                }, 1000);
            }
        };

        setTimeout(progressMessages, 1000);
    }

    generateAnalysisResults() {
        // Generate mock analysis results based on form data
        const riskLevel = this.calculateRiskLevel();
        const insights = this.generateInsights();
        const recommendations = this.generateRecommendations();

        // Update risk level display
        const riskElement = document.getElementById('risk-level');
        if (riskElement) {
            riskElement.className = `risk-level ${riskLevel.level}`;
            riskElement.querySelector('h3').textContent = `${riskLevel.level.charAt(0).toUpperCase() + riskLevel.level.slice(1)} Risk Level`;
            riskElement.querySelector('p').textContent = riskLevel.description;
        }

        // Update insights
        document.getElementById('possible-conditions').innerHTML = 
            insights.conditions.map(c => `<li>${c}</li>`).join('');
        document.getElementById('symptom-timeline').textContent = insights.timeline;
        document.getElementById('key-factors').innerHTML = 
            insights.factors.map(f => `<li>${f}</li>`).join('');
    }

    calculateRiskLevel() {
        // Mock risk calculation based on form data
        const severityLevel = this.formData.severity || 5;
        const duration = this.formData.duration || 'days';
        
        if (severityLevel >= 8 || duration === 'months') {
            return {
                level: 'high',
                description: 'Symptoms require immediate medical attention'
            };
        } else if (severityLevel >= 5 || duration === 'weeks') {
            return {
                level: 'medium',
                description: 'Some symptoms require attention'
            };
        } else {
            return {
                level: 'low',
                description: 'Symptoms appear manageable'
            };
        }
    }

    generateInsights() {
        return {
            conditions: [
                'Common cold (70% match)',
                'Seasonal allergies (45% match)',
                'Viral infection (30% match)'
            ],
            timeline: 'Symptoms started recently and are progressing normally for this type of condition.',
            factors: [
                'Recent weather changes',
                'Seasonal timing',
                'Symptom combination',
                'Age and health profile'
            ]
        };
    }

    generateRecommendations() {
        return [
            {
                priority: 'urgent',
                title: 'Immediate Action',
                description: 'Monitor symptoms closely and seek medical attention if they worsen.'
            },
            {
                priority: 'important',
                title: 'Within 24 Hours',
                description: 'Consider scheduling an appointment with your primary care physician.'
            },
            {
                priority: 'general',
                title: 'General Care',
                description: 'Rest, stay hydrated, and avoid strenuous activities.'
            }
        ];
    }

    updateSliderFill(slider) {
        const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary-blue) 0%, var(--primary-blue) ${value}%, var(--border-light) ${value}%, var(--border-light) 100%)`;
    }

    nextStep() {
        if (this.validateCurrentStep() && this.currentStep < this.totalSteps) {
            this.collectCurrentStepData();
            this.currentStep++;
            this.updateUI();
            this.initializeCurrentStep();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        }
    }

    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.collectCurrentStepData();
            this.currentStep = stepNumber;
            this.updateUI();
            this.initializeCurrentStep();
        }
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

    validateCurrentStep() {
        // Basic validation for each step
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            case 4:
                return true;
            default:
                return true;
        }
    }

    validateStep1() {
        const age = document.getElementById('age-slider')?.value;
        const gender = document.querySelector('input[name="gender"]:checked');
        const activity = document.querySelector('input[name="activity"]:checked');

        if (!age || !gender || !activity) {
            alert('Please complete all required fields in this step.');
            return false;
        }
        return true;
    }

    validateStep2() {
        const primarySymptom = document.getElementById('primary-symptom')?.value;
        const duration = document.querySelector('input[name="duration"]:checked');
        const severity = document.querySelector('input[name="severity"]:checked');

        if (!primarySymptom || !duration || !severity) {
            alert('Please describe your primary symptom, duration, and severity level.');
            return false;
        }
        return true;
    }

    validateStep3() {
        // Step 3 is mostly optional, so always valid
        return true;
    }

    collectCurrentStepData() {
        const form = document.getElementById('health-assessment-form');
        if (!form) return;

        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            this.formData[key] = value;
        }

        // Add non-form data
        this.formData.medications = this.medications;
        this.formData.selectedBodyParts = this.selectedBodyParts;
        this.formData.uploadedFiles = this.uploadedFiles.map(f => f.name);
        this.formData.hasRecording = !!this.recordingData;
    }

    updateUI() {
        // Update step content visibility
        document.querySelectorAll('.step-content').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });

        // Update sidebar navigation
        document.querySelectorAll('.nav-step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.current-step');
        const completionRate = document.querySelector('.completion-rate');
        const currentStepNum = document.getElementById('current-step-num');
        
        const progress = (this.currentStep / this.totalSteps) * 100;
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        if (completionRate) completionRate.textContent = `${Math.round(progress)}% Complete`;
        if (currentStepNum) currentStepNum.textContent = this.currentStep;

        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-assessment');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 1;
        }

        if (nextBtn && submitBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            }
        }
    }

    getHighestCompletedStep() {
        // Return the highest step that has been completed
        return Math.max(1, this.currentStep - 1);
    }

    saveProgress() {
        this.collectCurrentStepData();
        
        const progressData = {
            currentStep: this.currentStep,
            formData: this.formData,
            medications: this.medications,
            selectedBodyParts: this.selectedBodyParts,
            uploadedFiles: this.uploadedFiles.map(f => ({ name: f.name, size: f.size })),
            hasRecording: !!this.recordingData,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('health_assessment_progress', JSON.stringify(progressData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('health_assessment_progress');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.formData = data.formData || {};
                this.medications = data.medications || [];
                this.selectedBodyParts = data.selectedBodyParts || [];
                // Note: Files and recordings cannot be restored from localStorage
                
                // Restore form values
                this.restoreFormValues();
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    restoreFormValues() {
        Object.keys(this.formData).forEach(key => {
            const element = document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'radio' || element.type === 'checkbox') {
                    const specificElement = document.querySelector(`[name="${key}"][value="${this.formData[key]}"]`);
                    if (specificElement) specificElement.checked = true;
                } else {
                    element.value = this.formData[key];
                }
            }
        });
    }

    updateAutoSaveIndicator() {
        const indicator = document.querySelector('.save-status');
        if (indicator) {
            indicator.textContent = 'Auto-saved just now';
            setTimeout(() => {
                if (indicator) {
                    const now = new Date();
                    indicator.textContent = `Auto-saved at ${now.toLocaleTimeString()}`;
                }
            }, 2000);
        }
    }

    saveAndExit() {
        this.saveProgress();
        if (confirm('Your progress has been saved. Do you want to exit the assessment?')) {
            window.location.href = '/dashboard';
        }
    }

    async submitAssessment(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) return;
        
        this.collectCurrentStepData();
        
        // Prepare submission data
        const submissionData = {
            ...this.formData,
            medications: this.medications,
            selectedBodyParts: this.selectedBodyParts,
            completedAt: new Date().toISOString()
        };

        try {
            // Show loading state
            const submitBtn = document.getElementById('submit-assessment');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
            }

            // Submit to backend
            const response = await fetch('/api/health-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Clear saved progress
                localStorage.removeItem('health_assessment_progress');
                
                // Redirect to results page
                window.location.href = `/assessment/results/${result.assessmentId}`;
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('There was an error submitting your assessment. Please try again.');
            
            // Restore submit button
            const submitBtn = document.getElementById('submit-assessment');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="btn-icon">✓</span>Complete Assessment';
            }
        }
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Initialize the assessment wizard when the page loads
let assessmentWizard;

document.addEventListener('DOMContentLoaded', () => {
    assessmentWizard = new HealthAssessmentWizard();
});

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    if (assessmentWizard) {
        assessmentWizard.saveProgress();
        assessmentWizard.destroy();
    }
});