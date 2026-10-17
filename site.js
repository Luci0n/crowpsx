const dialog = document.querySelector('#lightbox');
let lastImageButton;
document.querySelectorAll('.image-open').forEach(button => button.addEventListener('click', () => {
  lastImageButton = button;
  dialog.querySelector('img').src = button.dataset.image;
  dialog.querySelector('img').alt = button.dataset.caption;
  dialog.querySelector('p').textContent = button.dataset.caption;
  dialog.showModal();
}));
dialog?.querySelector('.close').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog?.addEventListener('close', () => lastImageButton?.focus());
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let visible = 0;
  document.querySelectorAll('[data-pipeline]').forEach(row => {
    row.hidden = filter !== 'all' && !row.dataset.pipeline.split(' ').includes(filter);
    if (!row.hidden) visible++;
  });
  document.querySelector('#filter-status').textContent = filter === 'all' ? 'Showing all 4 approaches.' : `Showing ${visible} ${button.textContent} ${visible === 1 ? 'approach' : 'approaches'}.`;
}));

// Move only the overscanned background; captions and page content stay stationary.
const hero = document.querySelector('.home-page .hero');
if (hero) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let parallaxFrame = 0;
  const updateParallax = () => {
    parallaxFrame = 0;
    const bounds = hero.getBoundingClientRect();
    const limit = window.innerWidth <= 760 ? 18 : 36;
    const offset = motionPreference.matches ? 0 : Math.max(-limit, Math.min(limit, -bounds.top * 0.12));
    hero.style.setProperty('--hero-parallax', `${offset.toFixed(2)}px`);
  };
  const requestParallax = () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
  };
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax, { passive: true });
  motionPreference.addEventListener('change', requestParallax);
  requestParallax();
}

// Content is visible without JavaScript. Only observed, offscreen elements are
// animated, and each reveal runs once. Reduced motion restores visibility.
const revealMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = [...document.querySelectorAll('.home-page .hero-copy > *, .home-page .pipeline-strip, .home-page #features .section-heading, .home-page .feature-image, .home-page .feature-list article, .home-page .editor-heading, .home-page .editor-pair figure, .home-page .editor-workflow, .home-page .notes > .section-heading, .home-page .story, .home-page .faq-heading, .home-page .faq details, .home-page .cta > div')];
let revealObserver;
const configureReveals = () => {
  revealObserver?.disconnect();
  revealTargets.forEach(element => {
    element.removeAttribute('data-reveal');
    element.classList.remove('is-visible');
  });
  if (revealMotion.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  revealTargets.forEach(element => {
    // Above-the-fold content appears immediately; deep links remain visible.
    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
    element.setAttribute('data-reveal', '');
    const siblings = [...element.parentElement.children];
    const stagger = element.matches('.feature-list article, .editor-pair figure') ? Math.min(siblings.indexOf(element) * 65, 195) : 0;
    element.style.setProperty('--reveal-delay', `${stagger}ms`);
    revealObserver.observe(element);
  });
};
configureReveals();
revealMotion.addEventListener('change', configureReveals);
