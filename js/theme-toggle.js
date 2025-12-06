/**
 * Modern Alchemy - Theme Toggle
 * Provides dark/light mode switching across all pages
 */

(function() {
  // Get saved theme or default to dark
  const getSavedTheme = () => localStorage.getItem('alchemy-theme') || 'dark';
  
  // Apply theme to document
  const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle button icon if exists
    const toggleIcon = document.querySelector('.theme-toggle .theme-icon, #themeToggle .theme-icon');
    if (toggleIcon) {
      toggleIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  };
  
  // Toggle between themes
  const toggleTheme = () => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('alchemy-theme', newTheme);
    applyTheme(newTheme);
  };
  
  // Initialize on DOM ready
  const init = () => {
    // Apply saved theme immediately
    applyTheme(getSavedTheme());
    
    // Add click handler to any theme toggle buttons
    document.querySelectorAll('.theme-toggle, #themeToggle, [data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  };
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also apply immediately to prevent flash
  applyTheme(getSavedTheme());
  
  // Expose globally for manual use
  window.AlchemyTheme = {
    toggle: toggleTheme,
    set: (theme) => {
      localStorage.setItem('alchemy-theme', theme);
      applyTheme(theme);
    },
    get: getSavedTheme
  };
})();
