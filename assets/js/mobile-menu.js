// assets/js/mobile-menu.js
document.addEventListener('alpine:init', () => {
    Alpine.store('mobileMenu', {
        open: false,
        toggle() {
            this.open = !this.open;
        }
    });
});