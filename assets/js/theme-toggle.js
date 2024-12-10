// assets/js/theme-toggle.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    const darkThemeClass = 'dark';
  
    // Check for saved user preference, if any, on load of the website
    const userPref = localStorage.getItem('theme');
  
    if (userPref === 'dark' || (!userPref && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add(darkThemeClass);
      themeToggleIcon.classList.remove('fa-moon');
      themeToggleIcon.classList.add('fa-sun');
    } else {
      document.documentElement.classList.remove(darkThemeClass);
      themeToggleIcon.classList.remove('fa-sun');
      themeToggleIcon.classList.add('fa-moon');
    }
  
    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle(darkThemeClass);
      let theme = 'light';
  
      if (document.documentElement.classList.contains(darkThemeClass)) {
        theme = 'dark';
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
      } else {
        theme = 'light';
        themeToggleIcon.classList.remove('fa-sun');
        themeToggleIcon.classList.add('fa-moon');
      }
  
      // Save user preference in localStorage
      localStorage.setItem('theme', theme);
    });
  });
  