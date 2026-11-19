/* Tema Rian · interacciones ligeras (menú, galería, compra fija, cantidad, variantes). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Menú móvil
  const menu = $('[data-menu]');
  const toggleMenu = open => { if (!menu) return; menu.classList.toggle('open', open); document.body.style.overflow = open ? 'hidden' : ''; };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-menu-open]')) toggleMenu(true);
    else if (e.target.closest('[data-menu-close]') || (menu?.classList.contains('open') && !e.target.closest('[data-menu]'))) toggleMenu(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  // Galería con puntos
  $$('[data-gallery]').forEach(track => {
    const dots = track.parentElement.querySelector('[data-gallery-dots]');
    const slides = Array.from(track.children);
    if (!dots || slides.length < 2) return;
    slides.forEach((slide, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Foto ${i + 1} de ${slides.length}`);
      b.addEventListener('click', () => track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' }));
      dots.append(b);
    });
    const mark = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      Array.from(dots.children).forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    mark();
  });

  // Barra de compra fija en móvil
  const mainBuy = $('[data-main-buy]');
  const sticky = $('[data-sticky-buy]');
  if (mainBuy && sticky && 'IntersectionObserver' in window) {
    sticky.hidden = false;
    new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('show', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(mainBuy);
  }

  // Cantidad
  document.addEventListener('click', e => {
    const control = e.target.closest('[data-quantity-step]');
    if (!control) return;
    const input = control.closest('.quantity-control')?.querySelector('input');
    if (!input) return;
    const value = Number.parseInt(input.value, 10);
    const min = Number(input.min) || 1;
    input.value = Math.max(min, (Number.isFinite(value) ? value : min) + Number(control.dataset.quantityStep));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Variantes (solo en Shopify)
  document.addEventListener('change', e => {
    const option = e.target.closest('[data-option-select]');
    if (!option) return;
    const container = option.closest('[data-product-options]');
    const selected = $$('select', container).map(s => s.value).join(',');
    const url = new URL(window.location.href);
    url.searchParams.delete('variant');
    url.searchParams.set('option_values', selected);
    window.location.assign(url.toString());
  });
})();
