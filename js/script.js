// Smooth scrolling per i link di navigazione
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animazione delle card quando vengono visualizzate
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Osserva tutte le feature card
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
});

// Effetto parallax sul hero
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrollPosition = window.pageYOffset;
        hero.style.backgroundPosition = `0px ${scrollPosition * 0.5}px`;
    }
});

// Aggiunto active state alla navigazione in base alla pagina corrente
document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (window.location.pathname.includes(href) || 
        (window.location.pathname.endsWith('/') && href === 'index.html')) {
        link.style.borderBottom = '2px solid var(--secondary-color)';
    }
});

// Animazione semplice al caricamento
window.addEventListener('load', () => {
    document.body.style.animation = 'fadeInUp 0.8s ease';
});