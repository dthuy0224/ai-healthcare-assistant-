/* ================================
   RESULTS INTERACTIONS JS
   Additional interactive functionality
   ================================ */

class ResultsInteractions {
    constructor() {
        this.tooltips = new Map();
        this.animations = new Map();
        this.shortcuts = new Map();
        
        this.init();
    }

    init() {
        this.setupTooltips();
        this.setupAnimationTriggers();
        this.setupKeyboardShortcuts();
        this.setupAccessibilityFeatures();
        this.setupPrintStyles();
    }

    setupTooltips() {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: var(--surface-primary);
            color: var(--text-primary);
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--border-light);
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 250px;
            word-wrap: break-word;
        `;
        document.body.appendChild(tooltip);

        // Add tooltips to elements with data-tooltip attribute
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            this.addTooltip(element, tooltip);
        });

        // Add tooltips to medical badges
        document.querySelectorAll('.medical-badge').forEach(badge => {
            const tooltipText = this.getMedicalBadgeTooltip(badge.textContent.trim());
            if (tooltipText) {
                badge.setAttribute('data-tooltip', tooltipText);
                this.addTooltip(badge, tooltip);
            }
        });

        // Add tooltips to risk indicators
        document.querySelectorAll('.risk-indicator').forEach(indicator => {
            const riskLevel = indicator.classList.contains('low') ? 'low' : 
                            indicator.classList.contains('medium') ? 'medium' : 'high';
            const tooltipText = this.getRiskLevelTooltip(riskLevel);
            indicator.setAttribute('data-tooltip', tooltipText);
            this.addTooltip(indicator, tooltip);
        });

        // Add tooltips to confidence meters
        document.querySelectorAll('.confidence-value').forEach(confidence => {
            const percentage = parseInt(confidence.textContent);
            const tooltipText = this.getConfidenceTooltip(percentage);
            confidence.setAttribute('data-tooltip', tooltipText);
            this.addTooltip(confidence, tooltip);
        });
    }

    addTooltip(element, tooltipElement) {
        let showTimeout, hideTimeout;

        element.addEventListener('mouseenter', (e) => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(() => {
                const tooltipText = element.getAttribute('data-tooltip');
                if (tooltipText) {
                    tooltipElement.textContent = tooltipText;
                    this.positionTooltip(e, tooltipElement);
                    tooltipElement.style.opacity = '1';
                }
            }, 500);
        });

        element.addEventListener('mouseleave', () => {
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(() => {
                tooltipElement.style.opacity = '0';
            }, 100);
        });

        element.addEventListener('mousemove', (e) => {
            if (tooltipElement.style.opacity === '1') {
                this.positionTooltip(e, tooltipElement);
            }
        });
    }

    positionTooltip(event, tooltip) {
        const x = event.clientX;
        const y = event.clientY;
        const tooltipRect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let left = x + 10;
        let top = y - tooltipRect.height - 10;

        // Adjust if tooltip goes off screen
        if (left + tooltipRect.width > windowWidth) {
            left = x - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = y + 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    getMedicalBadgeTooltip(badgeText) {
        const tooltips = {
            'URGENT': 'Requires immediate medical attention or action',
            'PRIORITY': 'High priority item that should be addressed soon',
            'IMPORTANT': 'Significant finding that requires attention',
            'GENERAL': 'General recommendation for overall health improvement'
        };
        return tooltips[badgeText.toUpperCase()];
    }

    getRiskLevelTooltip(riskLevel) {
        const tooltips = {
            'low': 'Low risk: Symptoms are manageable and not immediately concerning',
            'medium': 'Medium risk: Some symptoms require monitoring and possible medical consultation',
            'high': 'High risk: Symptoms require immediate medical attention'
        };
        return tooltips[riskLevel];
    }

    getConfidenceTooltip(percentage) {
        if (percentage >= 80) {
            return 'High confidence: Strong match based on symptom analysis';
        } else if (percentage >= 60) {
            return 'Moderate confidence: Good match with some uncertainty';
        } else if (percentage >= 40) {
            return 'Low-moderate confidence: Possible match requiring further evaluation';
        } else {
            return 'Low confidence: Weak match, consider other possibilities';
        }
    }

    setupAnimationTriggers() {
        // Stagger animations for lists
        this.setupStaggeredAnimations('.concern-list .concern-item', 100);
        this.setupStaggeredAnimations('.conditions-list .condition-item', 150);
        this.setupStaggeredAnimations('.action-list .action-item', 120);
        this.setupStaggeredAnimations('.lifestyle-grid .lifestyle-item', 80);
        this.setupStaggeredAnimations('.prevention-list .prevention-item', 100);
        this.setupStaggeredAnimations('.resource-list .resource-item', 90);

        // Animate progress bars and meters
        this.animateProgressElements();
        
        // Animate timeline
        this.animateTimeline();
    }

    setupStaggeredAnimations(selector, delay) {
        const elements = document.querySelectorAll(selector);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(element);
        });
    }

    animateProgressElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate confidence bars
                    const confidenceFills = entry.target.querySelectorAll('.confidence-fill');
                    confidenceFills.forEach(fill => {
                        const targetWidth = fill.style.width;
                        fill.style.width = '0%';
                        fill.style.transition = 'width 1.5s ease-out';
                        setTimeout(() => {
                            fill.style.width = targetWidth;
                        }, 300);
                    });

                    // Animate severity scale
                    const scaleItems = entry.target.querySelectorAll('.scale-item.active');
                    scaleItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.transform = 'scale(1.1)';
                            setTimeout(() => {
                                item.style.transform = 'scale(1)';
                            }, 200);
                        }, index * 100);
                    });

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.analysis-card, .insight-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateTimeline() {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const timelineItems = entry.target.querySelectorAll('.timeline-item');
                    timelineItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateX(0)';
                            
                            // Animate marker
                            const marker = item.querySelector('.timeline-marker');
                            if (marker) {
                                marker.style.transform = 'scale(1.2)';
                                setTimeout(() => {
                                    marker.style.transform = 'scale(1)';
                                }, 200);
                            }
                        }, index * 200);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        // Prepare timeline items for animation
        const timelineItems = timeline.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        observer.observe(timeline);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when no input is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                'KeyE': () => this.toggleAllSections(), // E - Expand/collapse all
                'KeyP': () => window.print(), // P - Print
                'KeyS': () => assessmentResults?.shareResults(), // S - Share
                'KeyH': () => this.showKeyboardHelp(), // H - Help
                'Escape': () => this.closeAllModals(), // Escape - Close modals
                'Digit1': () => this.scrollToSection('symptom-analysis'), // 1 - Symptom analysis
                'Digit2': () => this.scrollToSection('recommended-actions'), // 2 - Actions
                'Digit3': () => this.scrollToSection('additional-insights'), // 3 - Insights
            };

            // Handle Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                const ctrlShortcuts = {
                    'KeyP': () => { e.preventDefault(); assessmentResults?.exportToPDF(); }, // Ctrl+P - PDF
                    'KeyS': () => { e.preventDefault(); assessmentResults?.shareWithDoctor(); }, // Ctrl+S - Share with doctor
                };
                
                if (ctrlShortcuts[e.code]) {
                    ctrlShortcuts[e.code]();
                    return;
                }
            }

            if (shortcuts[e.code]) {
                e.preventDefault();
                shortcuts[e.code]();
            }
        });
    }

    toggleAllSections() {
        const sections = ['symptom-analysis', 'recommended-actions', 'additional-insights'];
        const expandedCount = sections.filter(id => 
            assessmentResults?.expandedSections?.has(id)
        ).length;

        // If most sections are expanded, collapse all; otherwise expand all
        const shouldExpand = expandedCount < sections.length / 2;

        sections.forEach(sectionId => {
            const isExpanded = assessmentResults?.expandedSections?.has(sectionId);
            if (shouldExpand && !isExpanded) {
                assessmentResults?.toggleSection(sectionId);
            } else if (!shouldExpand && isExpanded) {
                assessmentResults?.toggleSection(sectionId);
            }
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the section briefly
            section.style.outline = '2px solid var(--primary-blue)';
            section.style.outlineOffset = '4px';
            setTimeout(() => {
                section.style.outline = '';
                section.style.outlineOffset = '';
            }, 2000);
        }
    }

    showKeyboardHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal show';
        helpModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-list">
                        <div class="shortcut-group">
                            <h4>Navigation</h4>
                            <div class="shortcut-item">
                                <kbd>1</kbd> <span>Go to Symptom Analysis</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>2</kbd> <span>Go to Recommended Actions</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>3</kbd> <span>Go to Additional Insights</span>
                            </div>
                        </div>
                        <div class="shortcut-group">
                            <h4>Actions</h4>
                            <div class="shortcut-item">
                                <kbd>E</kbd> <span>Expand/Collapse All Sections</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>P</kbd> <span>Print Results</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>S</kbd> <span>Share Results</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>P</kbd> <span>Export to PDF</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>S</kbd> <span>Share with Doctor</span>
                            </div>
                        </div>
                        <div class="shortcut-group">
                            <h4>General</h4>
                            <div class="shortcut-item">
                                <kbd>H</kbd> <span>Show this help</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Esc</kbd> <span>Close modals</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles for shortcuts
        const style = document.createElement('style');
        style.textContent = `
            .shortcuts-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-4);
            }
            .shortcut-group h4 {
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
                color: var(--text-primary);
                margin: 0 0 var(--space-2) 0;
                padding-bottom: var(--space-1);
                border-bottom: 1px solid var(--border-light);
            }
            .shortcut-item {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                padding: var(--space-1) 0;
            }
            .shortcut-item kbd {
                background: var(--surface-tertiary);
                border: 1px solid var(--border-medium);
                border-radius: var(--radius-sm);
                padding: var(--space-1) var(--space-2);
                font-family: monospace;
                font-size: var(--text-sm);
                min-width: 24px;
                text-align: center;
            }
            .shortcut-item span {
                color: var(--text-secondary);
                font-size: var(--text-sm);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(helpModal);

        // Add close functionality
        const closeModal = () => {
            helpModal.remove();
            style.remove();
        };

        helpModal.querySelector('.modal-close').addEventListener('click', closeModal);
        helpModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    setupAccessibilityFeatures() {
        // Add ARIA labels and roles
        this.enhanceAccessibility();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Add screen reader announcements
        this.setupScreenReaderAnnouncements();
    }

    enhanceAccessibility() {
        // Add ARIA labels to interactive elements
        document.querySelectorAll('.expand-toggle').forEach(toggle => {
            const section = toggle.dataset.section;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-controls', section);
            toggle.setAttribute('role', 'button');
        });

        // Add ARIA labels to progress indicators
        document.querySelectorAll('.confidence-bar').forEach(bar => {
            const value = bar.querySelector('.confidence-fill').style.width;
            bar.setAttribute('role', 'progressbar');
            bar.setAttribute('aria-valuenow', parseInt(value));
            bar.setAttribute('aria-valuemin', '0');
            bar.setAttribute('aria-valuemax', '100');
        });

        // Add ARIA labels to action checkboxes
        document.querySelectorAll('.action-checkbox').forEach(checkbox => {
            const label = checkbox.closest('.action-item').querySelector('h4').textContent;
            checkbox.querySelector('input').setAttribute('aria-label', `Mark "${label}" as completed`);
        });
    }

    setupFocusManagement() {
        // Ensure keyboard navigation works properly
        document.querySelectorAll('.expand-toggle').forEach(toggle => {
            toggle.setAttribute('tabindex', '0');
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });

        // Add focus indicators
        const style = document.createElement('style');
        style.textContent = `
            .expand-toggle:focus,
            .action-btn:focus,
            .quick-btn:focus,
            .export-btn:focus {
                outline: 2px solid var(--primary-blue);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    setupScreenReaderAnnouncements() {
        // Create announcement region
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(announcer);

        // Announce section changes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.expand-toggle')) {
                const toggle = e.target.closest('.expand-toggle');
                const section = toggle.dataset.section;
                const isExpanded = toggle.classList.contains('expanded');
                
                setTimeout(() => {
                    announcer.textContent = `${section.replace('-', ' ')} section ${isExpanded ? 'expanded' : 'collapsed'}`;
                }, 100);
            }
        });

        // Announce action completions
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.action-checkbox')) {
                const actionName = e.target.closest('.action-item').querySelector('h4').textContent;
                announcer.textContent = `${actionName} marked as ${e.target.checked ? 'completed' : 'incomplete'}`;
            }
        });
    }

    setupPrintStyles() {
        // Add print-specific styles
        const printStyle = document.createElement('style');
        printStyle.setAttribute('media', 'print');
        printStyle.textContent = `
            @media print {
                .results-wrapper {
                    padding-top: 0 !important;
                }
                
                .interactive-panel,
                .expand-toggle,
                .action-btn,
                .quick-btn,
                .export-btn,
                .learn-more-btn,
                .tool-btn,
                .schedule-btn,
                .telehealth-btn,
                .timeline-btn,
                .watch-btn,
                .read-btn,
                .start-btn {
                    display: none !important;
                }
                
                .section-content {
                    display: block !important;
                }
                
                .section-content.collapsed {
                    display: block !important;
                }
                
                .analysis-section {
                    break-inside: avoid;
                    margin-bottom: var(--space-6);
                }
                
                .analysis-card,
                .action-card,
                .insight-card {
                    break-inside: avoid;
                    margin-bottom: var(--space-4);
                }
                
                .results-header {
                    background: none !important;
                    color: var(--text-primary) !important;
                    border-bottom: 2px solid var(--border-medium);
                }
                
                .score-progress {
                    stroke: var(--text-primary) !important;
                }
                
                .page-break {
                    page-break-before: always;
                }
            }
        `;
        document.head.appendChild(printStyle);

        // Add print preparation
        window.addEventListener('beforeprint', () => {
            // Expand all sections for printing
            document.querySelectorAll('.section-content.collapsed').forEach(content => {
                content.style.display = 'block';
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResultsInteractions();
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});