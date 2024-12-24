// Immediately determine if it's Xmas time.
// No event listeners needed.
// Usage: if (window.isXmas) { /* do something */ }
(function() {
    const now = new Date();
    const month = now.getMonth(); // December is month 11
    const day = now.getDate();    // day of month
    // Xmas season: December 1 to December 25
    window.isXmas = (month === 11 && day >= 1 && day <= 25);
  })();
  

  document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offset = 80; // Adjust based on navbar height + padding
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
  
          // Update URL without jumping
          history.pushState(null, null, this.getAttribute('href'));
        }
      });
    });
  
    // Handle initial hash in URL
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          const offset = 80;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }, 0);
      }
    }
  });