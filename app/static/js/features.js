/**
 * Features Grid JavaScript
 * Handles interactions, loading states, and navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeFeatureCards();
});

function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        // Add click handler
        card.addEventListener('click', handleFeatureClick);
        
        // Add keyboard support
        card.addEventListener('keydown', handleFeatureKeydown);
        
        // Add loading state on interaction
        card.addEventListener('mousedown', addLoadingState);
    });
}

function handleFeatureClick(event) {
    const card = event.currentTarget;
    const featureType = card.dataset.feature;
    
    // Add loading state
    addLoadingState.call(card);
    
    // Navigate to feature page
    navigateToFeature(featureType);
}

function handleFeatureKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleFeatureClick(event);
    }
}

function addLoadingState() {
    this.classList.add('loading');
    
    // Remove loading state after navigation
    setTimeout(() => {
        this.classList.remove('loading');
    }, 1000);
}

function navigateToFeature(featureType) {
    const featureRoutes = {
        'diagnosis': '/features/diagnosis',
        'tracking': '/features/tracking',
        'analysis': '/features/analysis',
        'reminders': '/features/reminders',
        'voice': '/features/voice',
        'emergency': '/features/emergency'
    };
    
    const route = featureRoutes[featureType];
    
    if (route) {
        // Simulate loading delay for better UX
        setTimeout(() => {
            window.location.href = route;
        }, 300);
    } else {
        console.warn('Feature route not found:', featureType);
    }
}

// Intersection Observer for scroll animations
function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        // Initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        
        observer.observe(card);
    });
}

// Initialize scroll animations when page loads
if (window.IntersectionObserver) {
    initializeScrollAnimations();
}

// Export functions for testing
window.FeaturesGrid = {
    navigateToFeature,
    handleFeatureClick,
    addLoadingState
};