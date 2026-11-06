// Pasang tema sebelum render agar tidak berkedip.
// Dipisah ke file sendiri (bukan inline di index.html) agar CSP bisa
// memakai script-src 'self' tanpa 'unsafe-inline' (lihat nginx.conf).
(function () {
  if (
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark')
  }
})()