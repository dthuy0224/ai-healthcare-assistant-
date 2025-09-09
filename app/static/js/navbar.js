// Modern Healthcare Navigation Bar JavaScript
// Handles mobile menu, user dropdown, scroll effects, and accessibility

class HealthcareNavbar {
    constructor() {
        this.navbar = document.getElementById('main-navbar');
        this.mobileMenuButton = document.getElementById('mobile-menu-button');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        this.mobileMenuClose = document.getElementById('mobile-menu-close');
        this.userDropdown = document.getElementById('user-dropdown');
        
        this.isScrolled = false;
        this.isMobileMenuOpen = false;
        this.isUserDropdownOpen = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollEffect();
        this.setupKeyboardNavigation();
        this.setActiveNavLink();
    }

    setupEventListeners() {
        // Mobile menu toggle
        if (this.mobileMenuButton) {
            this.mobileMenuButton.addEventListener('click', () => this.toggleMobileMenu());
        }

        if (this.mobileMenuClose) {
            this.mobileMenuClose.addEventListener('click', () => this.closeMobileMenu());
        }

        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.addEventListener('click', () => this.closeMobileMenu());
        }

        // User dropdown toggle
        if (this.userDropdown) {
            const trigger = this.userDropdown.querySelector('.user-trigger');
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleUserDropdown();
                });
            }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userDropdown && !this.userDropdown.contains(e.target)) {
                this.closeUserDropdown();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isMobileMenuOpen) {
                    this.closeMobileMenu();
                }
                if (this.isUserDropdownOpen) {
                    this.closeUserDropdown();
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    setupScrollEffect() {
        let ticking = false;

        const updateNavbar = () => {
            const scrollY = window.scrollY;
            const shouldAddScrolled = scrollY > 10;

            if (shouldAddScrolled !== this.isScrolled) {
                this.isScrolled = shouldAddScrolled;
                this.navbar.classList.toggle('scrolled', this.isScrolled);
            }

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        });
    }

    setupKeyboardNavigation() {
        // Handle keyboard navigation for dropdown menu
        if (this.userDropdown) {
            const trigger = this.userDropdown.querySelector('.user-trigger');
            const dropdownItems = this.userDropdown.querySelectorAll('.dropdown-item');

            if (trigger) {
                trigger.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleUserDropdown();
                    } else if (e.key === 'ArrowDown' && this.isUserDropdownOpen) {
                        e.preventDefault();
                        if (dropdownItems.length > 0) {
                            dropdownItems[0].focus();
                        }
                    }
                });
            }

            // Handle arrow key navigation within dropdown
            dropdownItems.forEach((item, index) => {
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextIndex = (index + 1) % dropdownItems.length;
                        dropdownItems[nextIndex].focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevIndex = index === 0 ? dropdownItems.length - 1 : index - 1;
                        dropdownItems[prevIndex].focus();
                    } else if (e.key === 'Escape') {
                        this.closeUserDropdown();
                        trigger.focus();
                    }
                });
            });
        }
    }

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.isMobileMenuOpen = true;
        this.mobileMenu.classList.add('active');
        this.mobileMenuOverlay.classList.add('active');
        this.mobileMenuButton.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first menu item for accessibility
        const firstNavLink = this.mobileMenu.querySelector('.mobile-nav-link');
        if (firstNavLink) {
            setTimeout(() => firstNavLink.focus(), 100);
        }

        // Update ARIA attributes
        this.mobileMenuButton.setAttribute('aria-expanded', 'true');
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.mobileMenu.classList.remove('active');
        this.mobileMenuOverlay.classList.remove('active');
        this.mobileMenuButton.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to menu button
        this.mobileMenuButton.focus();

        // Update ARIA attributes
        this.mobileMenuButton.setAttribute('aria-expanded', 'false');
    }

    toggleUserDropdown() {
        if (this.isUserDropdownOpen) {
            this.closeUserDropdown();
        } else {
            this.openUserDropdown();
        }
    }

    openUserDropdown() {
        this.isUserDropdownOpen = true;
        this.userDropdown.setAttribute('aria-expanded', 'true');
        
        // Focus first dropdown item for accessibility
        const firstItem = this.userDropdown.querySelector('.dropdown-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 100);
        }
    }

    closeUserDropdown() {
        this.isUserDropdownOpen = false;
        this.userDropdown.setAttribute('aria-expanded', 'false');
    }

    // Public method to programmatically close menus
    closeAllMenus() {
        this.closeMobileMenu();
        this.closeUserDropdown();
    }

    // Method to handle route changes (for SPAs)
    updateActiveNavLink(newPath) {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === newPath || (newPath === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.healthcareNavbar = new HealthcareNavbar();
});

// Handle page visibility change to close menus when tab becomes hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.healthcareNavbar) {
        window.healthcareNavbar.closeAllMenus();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthcareNavbar;
}