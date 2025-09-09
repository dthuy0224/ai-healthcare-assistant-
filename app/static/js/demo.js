// Demo Page JavaScript
// Simple placeholder for demo functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Demo page loaded');
    
    // Add some interactive effects to feature items
    const featureItems = document.querySelectorAll('.feature-item');
    
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});