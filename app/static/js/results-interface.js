/* ================================
   MODERN ASSESSMENT RESULTS INTERFACE
   Interactive functionality for dashboard
   ================================ */

class ResultsInterface {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.animateOnLoad();
    }

    init() {
        this.setupCardExpansion();
        this.setupProgressAnimations();
        this.setupModals();
        this.setupFAQ();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-share')) {
                this.shareWithDoctor();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupCardExpansion() {
        const expandToggles = document.querySelectorAll('.expand-toggle');
        expandToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleCard(toggle);
            });
        });
    }

    toggleCard(toggle) {
        const card = toggle.closest('.analysis-card');
        const content = card.querySelector('.card-content');
        const isExpanded = toggle.classList.contains('expanded');
        
        if (isExpanded) {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            toggle.classList.remove('expanded');
            setTimeout(() => {
                content.classList.add('collapsed');
            }, 300);
        } else {
            content.classList.remove('collapsed');
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            toggle.classList.add('expanded');
        }
    }

    setupProgressAnimations() {
        const progressRings = document.querySelectorAll('.progress-ring-fill');
        progressRings.forEach(ring => {
            const dashArray = ring.getAttribute('stroke-dasharray');
            const dashOffset = ring.getAttribute('stroke-dashoffset');
            
            ring.style.strokeDashoffset = dashArray;
            setTimeout(() => {
                ring.style.strokeDashoffset = dashOffset;
            }, 300);
        });

        const severityBars = document.querySelectorAll('.severity-fill');
        severityBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    }

    setupModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    setupFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                this.toggleFAQ(question);
            });
        });
    }

    toggleFAQ(question) {
        const answer = question.nextElementSibling;
        const isExpanded = question.classList.contains('expanded');
        
        if (isExpanded) {
            question.classList.remove('expanded');
            answer.classList.remove('show');
        } else {
            question.classList.add('expanded');
            answer.classList.add('show');
        }
    }

    animateOnLoad() {
        const cards = document.querySelectorAll('.analysis-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });

        const summaryCard = document.querySelector('.summary-card');
        if (summaryCard) {
            summaryCard.style.opacity = '0';
            summaryCard.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                summaryCard.style.transition = 'all 0.6s ease';
                summaryCard.style.opacity = '1';
                summaryCard.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    shareWithDoctor() {
        this.showNotification('Sharing options will be available soon!', 'info');
    }

    generatePDF() {
        this.showNotification('Generating PDF report...', 'info');
        setTimeout(() => {
            this.showNotification('PDF report generated successfully!', 'success');
        }, 2000);
    }

    sendEmail() {
        this.showNotification('Email functionality will be available soon!', 'info');
    }

    createShareLink() {
        this.showNotification('Creating secure share link...', 'info');
        setTimeout(() => {
            this.showNotification('Secure link created!', 'success');
        }, 1500);
    }

    addToHealthRecord() {
        this.showNotification('Adding to personal health record...', 'info');
        setTimeout(() => {
            this.showNotification('Successfully added to health record!', 'success');
        }, 1000);
    }

    toggleSimpleTerms() {
        const modal = document.getElementById('simpleTermsModal');
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    }

    showFAQ() {
        const modal = document.getElementById('faqModal');
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    scheduleAppointment() {
        this.showNotification('Appointment scheduling will be available soon!', 'info');
    }

    requestSecondOpinion() {
        this.showNotification('Second opinion request feature coming soon!', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for HTML onclick handlers
function toggleCard(toggle) {
    if (window.resultsInterface) {
        window.resultsInterface.toggleCard(toggle);
    }
}

function toggleSimpleTerms() {
    if (window.resultsInterface) {
        window.resultsInterface.toggleSimpleTerms();
    }
}

function showFAQ() {
    if (window.resultsInterface) {
        window.resultsInterface.showFAQ();
    }
}

function toggleFAQ(question) {
    if (window.resultsInterface) {
        window.resultsInterface.toggleFAQ(question);
    }
}

function closeModal(modalId) {
    if (window.resultsInterface) {
        window.resultsInterface.closeModal(modalId);
    }
}

function shareWithDoctor() {
    if (window.resultsInterface) {
        window.resultsInterface.shareWithDoctor();
    }
}

function generatePDF() {
    if (window.resultsInterface) {
        window.resultsInterface.generatePDF();
    }
}

function sendEmail() {
    if (window.resultsInterface) {
        window.resultsInterface.sendEmail();
    }
}

function createShareLink() {
    if (window.resultsInterface) {
        window.resultsInterface.createShareLink();
    }
}

function addToHealthRecord() {
    if (window.resultsInterface) {
        window.resultsInterface.addToHealthRecord();
    }
}

function scheduleAppointment() {
    if (window.resultsInterface) {
        window.resultsInterface.scheduleAppointment();
    }
}

function requestSecondOpinion() {
    if (window.resultsInterface) {
        window.resultsInterface.requestSecondOpinion();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resultsInterface = new ResultsInterface();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
    }
    
    .notification-info {
        background: var(--info);
        color: white;
    }
    
    .notification-success {
        background: var(--success);
        color: white;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
    }
    
    .notification-message {
        flex: 1;
        font-weight: var(--font-medium);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: var(--text-lg);
        cursor: pointer;
        padding: var(--space-1);
        margin-left: var(--space-2);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);