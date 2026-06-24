document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (!toggle || !nav) {
    console.warn('menu-hamburger: elementi mancanti', { toggle: !!toggle, nav: !!nav });
    return;
  }

  // crea backdrop se non esiste
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  function setOpen(open) {
    if (open) {
      nav.classList.add('open');
      backdrop.classList.add('visible');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Chiudi menu');
      const first = nav.querySelector('a');
      if (first) first.focus();
      document.body.style.overflow = 'hidden';
    } else {
      nav.classList.remove('open');
      backdrop.classList.remove('visible');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Apri menu');
      toggle.focus();
      document.body.style.overflow = '';
    }
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!nav.classList.contains('open'));
  });

  backdrop.addEventListener('click', function () { setOpen(false); });

  document.addEventListener('click', function (e) {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(e.target) && e.target !== toggle && !backdrop.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720 && nav.classList.contains('open')) setOpen(false);
  });
});
