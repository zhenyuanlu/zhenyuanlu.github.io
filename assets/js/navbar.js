document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
  
    const toggleMenu = () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', !isOpen);
      mobileMenu.classList.toggle('translate-y-0');
      mobileMenu.classList.toggle('opacity-100');
      mobileMenu.classList.toggle('-translate-y-4');
      mobileMenu.classList.toggle('opacity-0');
      mobileMenu.classList.toggle('pointer-events-none');
  
      if (!isOpen) {
        menuIcon.classList.add('opacity-0', '-translate-y-2');
        closeIcon.classList.remove('opacity-0', '-translate-y-2');
      } else {
        menuIcon.classList.remove('opacity-0', '-translate-y-2');
        closeIcon.classList.add('opacity-0', '-translate-y-2');
      }
    };
  
    menuButton.addEventListener('click', toggleMenu);
  
    // Close the menu when resizing the window to desktop size
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        menuButton.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.add('-translate-y-4', 'opacity-0', 'pointer-events-none');
        menuIcon.classList.remove('opacity-0', '-translate-y-2');
        closeIcon.classList.add('opacity-0', '-translate-y-2');
      }
    });
  });
  