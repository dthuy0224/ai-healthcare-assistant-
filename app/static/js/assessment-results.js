/* ================================
   ASSESSMENT RESULTS - MAIN JS
   Interactive functionality for results display
   ================================ */

class AssessmentResults {
    constructor() {
        this.currentResults = null;
        this.simpleTermsMode = false;
        this.expandedSections = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadResults();
        this.initializeAnimations();
        this.setupInteractiveElements();
    }

    setupEventListeners() {
        // Section expand/collapse
        document.querySelectorAll('.expand-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const section = e.target.closest('.expand-toggle').dataset.section;
                this.toggleSection(section);
            });
        });

        // Simple terms toggle
        const simpleTermsToggle = document.getElementById('simple-terms-toggle');
        if (simpleTermsToggle) {
            simpleTermsToggle.addEventListener('change', (e) => {
                this.toggleSimpleTerms(e.target.checked);
            });
        }

        // Medical term explanations
        document.querySelectorAll('.explain-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const term = e.target.dataset.term;
                this.showMedicalExplanation(term);
            });
        });

        // Quick actions
        document.getElementById('ask-question-btn')?.addEventListener('click', () => {
            this.showQuestionModal();
        });

        document.getElementById('second-opinion-btn')?.addEventListener('click', () => {
            this.requestSecondOpinion();
        });

        document.getElementById('share-results-btn')?.addEventListener('click', () => {
            this.shareResults();
        });

        // Export options
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.closest('.export-btn').dataset.format;
                this.exportResults(format);
            });
        });

        // Header actions
        document.getElementById('share-doctor-btn')?.addEventListener('click', () => {
            this.shareWithDoctor();
        });

        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // Action checkboxes
        document.querySelectorAll('.action-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateActionProgress(e.target.id, e.target.checked);
            });
        });

        // Learn more buttons
        document.querySelectorAll('.learn-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const topic = e.target.dataset.topic;
                this.showEducationalContent(topic);
            });
        });

        // Timeline buttons
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                this.handleTimelineAction(action);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Modal overlays
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Resource buttons
        document.querySelectorAll('.watch-btn, .read-btn, .start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceType = e.target.className.includes('watch') ? 'video' : 
                                   e.target.className.includes('read') ? 'article' : 'interactive';
                const title = e.target.closest('.resource-item').querySelector('h4').textContent;
                this.openResource(resourceType, title);
            });
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = e.target.closest('.tool-item').querySelector('h4').textContent;
                this.openTool(toolName);
            });
        });

        // Appointment buttons
        document.querySelector('.schedule-btn')?.addEventListener('click', () => {
            this.scheduleAppointment();
        });

        document.querySelector('.telehealth-btn')?.addEventListener('click', () => {
            this.startTelehealth();
        });
    }

    loadResults() {
        // Load results from URL parameter or local storage
        const urlParams = new URLSearchParams(window.location.search);
        const assessmentId = urlParams.get('id') || this.getAssessmentIdFromPath();
        
        if (assessmentId) {
            this.fetchResultsData(assessmentId);
        } else {
            this.loadMockResults();
        }
    }

    getAssessmentIdFromPath() {
        // Extract assessment ID from URL path like /assessment/results/123
        const pathParts = window.location.pathname.split('/');
        const resultsIndex = pathParts.indexOf('results');
        return resultsIndex !== -1 && pathParts[resultsIndex + 1] ? pathParts[resultsIndex + 1] : null;
    }

    async fetchResultsData(assessmentId) {
        try {
            const response = await fetch(`/api/health-assessment/${assessmentId}`);
            if (response.ok) {
                const data = await response.json();
                this.currentResults = data;
                this.populateResults(data);
            } else {
                console.error('Failed to fetch results:', response.statusText);
                this.loadMockResults();
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            this.loadMockResults();
        }
    }

    loadMockResults() {
        // Mock results data for demonstration
        this.currentResults = {
            assessment_id: 'mock-123',
            submitted_at: new Date().toISOString(),
            analysis_results: {
                risk_level: {
                    level: 'medium',
                    description: 'Some symptoms require attention',
                    score: 65
                },
                insights: [
                    {
                        category: 'symptom_analysis',
                        title: 'Symptom Pattern Analysis',
                        content: {
                            primary_symptom: 'Persistent headache with moderate intensity',
                            severity_level: 6,
                            duration: 'days',
                            affected_areas: 2
                        },
                        confidence: 85
                    }
                ],
                recommendations: [
                    {
                        priority: 'important',
                        title: 'Schedule Medical Consultation',
                        description: 'Consider scheduling an appointment with your primary care physician within the next few days.',
                        timeframe: 'Within 24-48 hours'
                    }
                ],
                possible_conditions: [
                    { name: 'Tension Headache', match_percentage: 75, description: 'Most common type of headache' },
                    { name: 'Migraine', match_percentage: 45, description: 'Recurrent headache disorder' }
                ],
                key_factors: ['High symptom severity', 'Symptom combination pattern'],
                timeline_assessment: 'Symptoms are in early stages and progressing normally.'
            }
        };
        this.populateResults(this.currentResults);
    }

    populateResults(data) {
        // Update completion date
        const completionDate = document.getElementById('completion-date');
        if (completionDate && data.submitted_at) {
            const date = new Date(data.submitted_at);
            completionDate.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Update health score
        const healthScore = document.getElementById('health-score');
        const scoreCircle = document.querySelector('.score-circle');
        if (healthScore && data.analysis_results?.risk_level?.score) {
            const score = Math.min(100, Math.max(0, 100 - data.analysis_results.risk_level.score));
            healthScore.textContent = score;
            scoreCircle.dataset.score = score;
            this.animateHealthScore(score);
        }

        // Update risk level
        const riskLevel = document.getElementById('risk-level');
        if (riskLevel && data.analysis_results?.risk_level) {
            const risk = data.analysis_results.risk_level;
            riskLevel.className = `risk-indicator ${risk.level}`;
            riskLevel.querySelector('h3').textContent = `${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk`;
            riskLevel.querySelector('p').textContent = risk.description;
        }

        // Update possible conditions
        if (data.analysis_results?.possible_conditions) {
            this.updateConditionsList(data.analysis_results.possible_conditions);
        }
    }

    updateConditionsList(conditions) {
        const conditionsList = document.querySelector('.conditions-list');
        if (!conditionsList) return;

        conditionsList.innerHTML = '';
        conditions.forEach(condition => {
            const conditionItem = document.createElement('div');
            conditionItem.className = 'condition-item';
            conditionItem.innerHTML = `
                <div class="condition-info">
                    <h4>${condition.name}</h4>
                    <p>${condition.description}</p>
                </div>
                <div class="confidence-meter">
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${condition.match_percentage}%"></div>
                    </div>
                    <span class="confidence-value">${condition.match_percentage}% match</span>
                </div>
            `;
            conditionsList.appendChild(conditionItem);
        });
    }

    initializeAnimations() {
        // Initialize intersection observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Animate confidence bars
                    const confidenceFills = entry.target.querySelectorAll('.confidence-fill');
                    confidenceFills.forEach(fill => {
                        const width = fill.style.width;
                        fill.style.width = '0%';
                        setTimeout(() => {
                            fill.style.width = width;
                        }, 300);
                    });
                }
            });
        }, observerOptions);

        // Observe all analysis cards
        document.querySelectorAll('.analysis-card, .action-card, .insight-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateHealthScore(score) {
        const scoreRing = document.querySelector('.score-progress');
        const scoreValue = document.getElementById('health-score');
        
        if (!scoreRing || !scoreValue) return;

        // Calculate stroke-dashoffset for the score
        const circumference = 2 * Math.PI * 54; // radius = 54
        const offset = circumference - (score / 100) * circumference;
        
        // Animate the ring
        scoreRing.style.strokeDashoffset = circumference;
        setTimeout(() => {
            scoreRing.style.strokeDashoffset = offset;
        }, 500);

        // Animate the number
        let currentScore = 0;
        const increment = score / 50;
        const timer = setInterval(() => {
            currentScore += increment;
            if (currentScore >= score) {
                currentScore = score;
                clearInterval(timer);
            }
            scoreValue.textContent = Math.round(currentScore);
        }, 20);
    }

    setupInteractiveElements() {
        // Setup expandable sections (all collapsed by default)
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('collapsed');
        });

        // Setup hover effects for interactive elements
        this.setupHoverEffects();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }

    setupHoverEffects() {
        // Add hover effects to cards
        document.querySelectorAll('.analysis-card, .action-card, .insight-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = 'var(--shadow-lg)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
    }

    setupKeyboardNavigation() {
        // Add keyboard support for interactive elements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals
                document.querySelectorAll('.modal.show').forEach(modal => {
                    this.closeModal(modal);
                });
            }
        });
    }

    toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        const toggle = document.querySelector(`[data-section="${sectionId}"]`);
        const content = section.querySelector('.section-content');
        
        if (!section || !toggle || !content) return;

        const isExpanded = this.expandedSections.has(sectionId);
        
        if (isExpanded) {
            // Collapse
            content.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggle.querySelector('.toggle-text').textContent = 'Show Details';
            this.expandedSections.delete(sectionId);
        } else {
            // Expand
            content.classList.remove('collapsed');
            toggle.classList.add('expanded');
            toggle.querySelector('.toggle-text').textContent = 'Hide Details';
            this.expandedSections.add(sectionId);
            
            // Animate content appearance
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.opacity = '1';
            }, 50);
        }
    }

    toggleSimpleTerms(enabled) {
        this.simpleTermsMode = enabled;
        
        // Update all medical explanations
        document.querySelectorAll('[data-medical-term]').forEach(element => {
            if (enabled) {
                element.classList.add('simple-explanation');
            } else {
                element.classList.remove('simple-explanation');
            }
        });

        // Show/hide explanation buttons
        document.querySelectorAll('.explain-btn').forEach(btn => {
            btn.style.display = enabled ? 'none' : 'inline-flex';
        });

        // Update content complexity
        this.updateContentComplexity(enabled);
    }

    updateContentComplexity(simple) {
        const medicalTerms = {
            'headache': {
                complex: 'Cephalgia or head pain caused by various physiological factors',
                simple: 'Pain in your head that can have different causes'
            },
            'migraine': {
                complex: 'Recurrent neurovascular headache disorder with moderate to severe intensity',
                simple: 'A type of bad headache that comes back often'
            },
            'tension': {
                complex: 'Myogenic headache caused by sustained muscle contraction',
                simple: 'Headache caused by tight muscles in your head and neck'
            }
        };

        // Update explanations based on mode
        document.querySelectorAll('[data-term]').forEach(element => {
            const term = element.dataset.term;
            if (medicalTerms[term]) {
                const explanation = simple ? medicalTerms[term].simple : medicalTerms[term].complex;
                element.title = explanation;
            }
        });
    }

    showMedicalExplanation(term) {
        const explanations = {
            'headache': {
                title: 'Headache (Cephalgia)',
                simple: 'A headache is pain anywhere in your head. It can be caused by stress, dehydration, lack of sleep, or other health issues.',
                detailed: 'Cephalgia, commonly known as headache, is pain located anywhere in the region of the head or neck. It occurs as a result of the activation of nociceptors in the head and neck region. The brain tissue itself is not sensitive to pain because it lacks pain receptors. Rather, the pain is caused by disturbance of the pain-sensitive structures around the brain.'
            },
            'migraine': {
                title: 'Migraine',
                simple: 'A migraine is a type of headache that is usually more severe than regular headaches. It often comes with nausea and sensitivity to light.',
                detailed: 'Migraine is a primary headache disorder characterized by recurrent headaches that are moderate to severe. Typically, episodes affect one half of the head, are pulsating in nature, and last from a few hours to three days. Associated symptoms may include nausea, vomiting, and sensitivity to light, sound, or smell.'
            }
        };

        const explanation = explanations[term];
        if (!explanation) return;

        const modal = document.getElementById('medical-terms-modal');
        const termExplanation = document.getElementById('term-explanation');
        
        if (modal && termExplanation) {
            const content = this.simpleTermsMode ? explanation.simple : explanation.detailed;
            termExplanation.innerHTML = `
                <h4>${explanation.title}</h4>
                <p>${content}</p>
                ${!this.simpleTermsMode ? `
                    <div class="simple-version">
                        <h5>In Simple Terms:</h5>
                        <p>${explanation.simple}</p>
                    </div>
                ` : ''}
            `;
            this.showModal(modal);
        }
    }

    showQuestionModal() {
        const modal = document.getElementById('question-modal');
        if (modal) {
            this.showModal(modal);
        }
    }

    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const focusableElements = modal.querySelectorAll('button, input, textarea, select');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    updateActionProgress(actionId, completed) {
        // Update action completion status
        const actionItem = document.querySelector(`#${actionId}`).closest('.action-item');
        if (actionItem) {
            if (completed) {
                actionItem.classList.add('completed');
            } else {
                actionItem.classList.remove('completed');
            }
        }

        // Save progress to local storage
        const progress = JSON.parse(localStorage.getItem('actionProgress') || '{}');
        progress[actionId] = completed;
        localStorage.setItem('actionProgress', JSON.stringify(progress));

        // Update overall progress
        this.updateOverallProgress();
    }

    updateOverallProgress() {
        const checkboxes = document.querySelectorAll('.action-checkbox input[type="checkbox"]');
        const completed = document.querySelectorAll('.action-checkbox input[type="checkbox"]:checked');
        const progress = checkboxes.length > 0 ? (completed.length / checkboxes.length) * 100 : 0;

        // Update progress indicator if exists
        const progressIndicator = document.querySelector('.action-progress');
        if (progressIndicator) {
            progressIndicator.style.width = `${progress}%`;
        }
    }

    showEducationalContent(topic) {
        const educationalContent = {
            'sleep': {
                title: 'Sleep Hygiene for Better Health',
                content: 'Good sleep hygiene involves maintaining regular sleep schedules, creating a comfortable sleep environment, and avoiding stimulants before bedtime.',
                url: '/education/sleep-hygiene'
            },
            'stress': {
                title: 'Stress Management Techniques',
                content: 'Effective stress management includes deep breathing exercises, regular physical activity, mindfulness meditation, and maintaining social connections.',
                url: '/education/stress-management'
            },
            'exercise': {
                title: 'Exercise and Health Benefits',
                content: 'Regular physical activity improves cardiovascular health, strengthens muscles and bones, and enhances mental well-being.',
                url: '/education/exercise-benefits'
            },
            'nutrition': {
                title: 'Nutrition for Optimal Health',
                content: 'A balanced diet rich in fruits, vegetables, whole grains, and lean proteins supports overall health and can help prevent chronic diseases.',
                url: '/education/nutrition-guide'
            }
        };

        const content = educationalContent[topic];
        if (content) {
            // In a real application, this would open a detailed educational page
            alert(`Opening: ${content.title}\n\n${content.content}\n\nThis would redirect to: ${content.url}`);
        }
    }

    handleTimelineAction(action) {
        if (action.includes('Set Reminder')) {
            this.setReminder();
        } else if (action.includes('Schedule Now')) {
            this.scheduleFollowUp();
        }
    }

    setReminder() {
        // Set reminder for follow-up
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 7);
        
        if ('Notification' in window && Notification.permission === 'granted') {
            // Schedule notification (simplified)
            setTimeout(() => {
                new Notification('Health Assessment Reminder', {
                    body: 'Time for your weekly progress check!',
                    icon: '/static/images/favicon.ico'
                });
            }, 1000); // Demo notification after 1 second
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.setReminder();
                }
            });
        }
        
        alert(`Reminder set for ${reminderDate.toLocaleDateString()}`);
    }

    scheduleFollowUp() {
        // Schedule follow-up assessment
        alert('Redirecting to follow-up assessment scheduling...');
        // In a real application: window.location.href = '/assessment/schedule-followup';
    }

    openResource(type, title) {
        // Open educational resource
        const resources = {
            'video': '/education/videos/',
            'article': '/education/articles/',
            'interactive': '/education/tools/'
        };
        
        const baseUrl = resources[type] || '/education/';
        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        alert(`Opening ${type}: ${title}\nURL: ${baseUrl}${slug}`);
        // In a real application: window.open(`${baseUrl}${slug}`, '_blank');
    }

    openTool(toolName) {
        // Open health monitoring tool
        const tools = {
            'Symptom Tracker': '/tools/symptom-tracker',
            'Medication Log': '/tools/medication-log',
            'Follow-up Assessment': '/assessment/followup'
        };
        
        const url = tools[toolName] || '/tools/';
        alert(`Opening tool: ${toolName}\nURL: ${url}`);
        // In a real application: window.location.href = url;
    }

    scheduleAppointment() {
        // Schedule medical appointment
        alert('Redirecting to appointment scheduling system...');
        // In a real application: window.location.href = '/appointments/schedule';
    }

    startTelehealth() {
        // Start telehealth consultation
        alert('Starting telehealth consultation...');
        // In a real application: window.location.href = '/telehealth/start';
    }

    requestSecondOpinion() {
        // Request second medical opinion
        alert('Connecting you with our second opinion service...');
        // In a real application: window.location.href = '/second-opinion/request';
    }

    shareResults() {
        // Share assessment results
        if (navigator.share) {
            navigator.share({
                title: 'My Health Assessment Results',
                text: 'Check out my health assessment results from AI Health Assistant',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Results link copied to clipboard!');
            });
        }
    }

    shareWithDoctor() {
        // Share results with doctor
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share with Healthcare Provider</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <button class="share-option" onclick="assessmentResults.emailToDoctor()">
                            <div class="option-icon">📧</div>
                            <div class="option-info">
                                <h4>Email Report</h4>
                                <p>Send a comprehensive PDF report to your doctor</p>
                            </div>
                        </button>
                        <button class="share-option" onclick="assessmentResults.generateSecureLink()">
                            <div class="option-icon">🔗</div>
                            <div class="option-info">
                                <h4>Secure Link</h4>
                                <p>Generate a secure, temporary link to share</p>
                            </div>
                        </button>
                        <button class="share-option" onclick="assessmentResults.addToHealthRecord()">
                            <div class="option-icon">📋</div>
                            <div class="option-info">
                                <h4>Health Record</h4>
                                <p>Add to your personal health record</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal(modal);
            document.body.removeChild(modal);
        });
    }

    emailToDoctor() {
        const email = prompt('Enter your doctor\'s email address:');
        if (email && this.validateEmail(email)) {
            alert(`Sending assessment results to ${email}...`);
            // In a real application: API call to send email
        } else if (email) {
            alert('Please enter a valid email address.');
        }
    }

    generateSecureLink() {
        // Generate secure sharing link
        const linkId = 'secure-' + Math.random().toString(36).substr(2, 9);
        const secureUrl = `${window.location.origin}/shared-results/${linkId}`;
        
        navigator.clipboard.writeText(secureUrl).then(() => {
            alert(`Secure link generated and copied to clipboard:\n${secureUrl}\n\nThis link will expire in 7 days.`);
        });
    }

    addToHealthRecord() {
        // Add to personal health record
        alert('Adding assessment results to your personal health record...');
        // In a real application: API call to save to health record
    }

    exportResults(format) {
        switch (format) {
            case 'pdf':
                this.exportToPDF();
                break;
            case 'email':
                this.emailToDoctor();
                break;
            case 'link':
                this.generateSecureLink();
                break;
            case 'record':
                this.addToHealthRecord();
                break;
        }
    }

    exportToPDF() {
        // Export results to PDF
        alert('Generating PDF report...');
        
        // In a real application, this would generate and download a PDF
        // For now, we'll simulate the process
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = '#'; // Would be actual PDF blob URL
            link.download = `health-assessment-results-${new Date().toISOString().split('T')[0]}.pdf`;
            link.textContent = 'Download PDF';
            
            alert('PDF report would be downloaded now.\nFilename: ' + link.download);
        }, 1000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Load saved action progress on page load
    loadActionProgress() {
        const progress = JSON.parse(localStorage.getItem('actionProgress') || '{}');
        Object.keys(progress).forEach(actionId => {
            const checkbox = document.getElementById(actionId);
            if (checkbox) {
                checkbox.checked = progress[actionId];
                this.updateActionProgress(actionId, progress[actionId]);
            }
        });
    }
}

// Initialize when DOM is loaded
let assessmentResults;

document.addEventListener('DOMContentLoaded', () => {
    assessmentResults = new AssessmentResults();
    assessmentResults.loadActionProgress();
});

// Export for global access
window.assessmentResults = assessmentResults;