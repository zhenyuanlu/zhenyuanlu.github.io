// assets/js/dark-mode.js
document.addEventListener('alpine:init', () => {
    Alpine.store('darkMode', {
        on: false,
        toggle() {
            this.on = !this.on;
            localStorage.setItem('darkMode', this.on);
        },
        init() {
            this.on = localStorage.getItem('darkMode') === 'true';
        }
    });
});