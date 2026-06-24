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

  // Imposta aria-current="page" sui link di navigazione corrispondenti alla pagina attiva
  function normalizePath(p) {
    if (!p) return '';
    // rimuovi query e hash
    p = p.split('?')[0].split('#')[0];
    // rimuovi eventuale slash finale
    p = p.replace(/\/$/, '');
    if (p === '') return '/index.html';
    return p;
  }

  function setAriaCurrent() {
    const links = nav.querySelectorAll('a[role="menuitem"], .nav-links a');
    let currentPath = normalizePath(location.pathname);
    // tratta '/' come '/index.html' per corrispondenza con i link che puntano a index.html
    if (currentPath === '/') currentPath = '/index.html';

    links.forEach(a => {
      try {
        const href = a.getAttribute('href');
        const resolved = new URL(href, location.href);
        let linkPath = normalizePath(resolved.pathname);
        if (linkPath === '/') linkPath = '/index.html';

        if (linkPath === currentPath) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      } catch (e) {
        // ignore malformed hrefs
      }
    });
  }

  // Aggiorna aria-current al caricamento
  setAriaCurrent();

  // Se il sito è single-page o i link vengono gestiti via JS, aggiorna aria-current anche prima della navigazione
  nav.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    // Imposta aria-current immediatamente per rispecchiare la selezione dell'utente
    try {
      const href = a.getAttribute('href');
      const resolved = new URL(href, location.href);
      const linkPath = normalizePath(resolved.pathname) || '/index.html';

      // rimuove aria-current da tutti e lo imposta sul cliccato
      nav.querySelectorAll('a[aria-current="page"]').forEach(el => el.removeAttribute('aria-current'));
      a.setAttribute('aria-current', 'page');
    } catch (err) {
      // ignore
    }
  });

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

  // se la navigazione avviene senza ricaricare (pushState), ascolta i cambi di history
  window.addEventListener('popstate', setAriaCurrent);
});
