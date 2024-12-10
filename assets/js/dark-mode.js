const userPref = localStorage.getItem('theme');
if (userPref === 'dark') {
  document.documentElement.classList.add('dark');
}
