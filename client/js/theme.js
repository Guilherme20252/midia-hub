const themeBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeBtn) themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
}

let savedTheme = 'dark';
try {
  savedTheme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
} catch {}
applyTheme(savedTheme);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next);
    } catch {}
    applyTheme(next);
    // redesenha os gráficos com as cores do novo tema
    if (typeof loadStats === 'function') loadStats();
  });
}
