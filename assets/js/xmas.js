// Immediately determine if it's Xmas time.
// No event listeners needed.
(function() {
    const now = new Date();
    const month = now.getMonth(); // December is month 11
    const day = now.getDate();    // day of month
    // Xmas season: December 1 to December 25
    window.isXmas = (month === 11 && day >= 1 && day <= 25);
  })();
  