(function(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (!toggle || !nav) return;

  function setOpen(open){
    if (open) {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Chiudi menu');
      const first = nav.querySelector('a');
      if (first) first.focus();
      document.body.style.overflow = 'hidden';
    } else {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Apri menu');
      toggle.focus();
      document.body.style.overflow = '';
    }
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!nav.classList.contains('open'));
  });

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(e.target) && e.target !== toggle) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && nav.classList.contains('open')) setOpen(false);
  });
})();
