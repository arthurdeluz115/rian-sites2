/* Prévia da loja: reproduz o HTML do tema Shopify (mesmas classes do loja.css).
   URL: loja.html?n=<nicho>&nome=<nome da loja>&p=<produto 1-10> */
(() => {
  const qs = new URLSearchParams(location.search);
  const nicho = (qs.get('n') || 'home').replace(/[^a-z]/g, '');
  const produto = Number(qs.get('p')) || 0;
  const embed = qs.get('embed') === '1';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8zM9 8a3 3 0 016 0"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z"/></svg>',
  };

  function link(p) {
    const u = new URLSearchParams({ n: nicho });
    if (qs.get('nome')) u.set('nome', qs.get('nome'));
    if (embed) u.set('embed', '1');
    if (p) u.set('p', p);
    return `loja.html?${u}`;
  }

  async function main() {
    const res = await fetch(`data/${nicho}.json`);
    if (!res.ok) throw new Error('Estrutura não encontrada');
    const d = await res.json();
    const nome = (qs.get('nome') || d.tienda).slice(0, 60);
    const img = f => `img/${d.id}/${f}`;
    const pal = d.paleta;
    const root = document.documentElement.style;
    [['--bg', pal.background], ['--surface', pal.surface], ['--text', pal.text], ['--muted', pal.muted], ['--accent', pal.accent], ['--on-accent', pal.onAccent], ['--border', pal.border]]
      .forEach(([k, v]) => root.setProperty(k, v));
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', pal.background);
    const price = '<span class="preview-price">Precio en Shopify</span>';
    const nomeLoja = nome !== d.tienda;
    const logo = nomeLoja ? `<span>${esc(nome)}</span>` : `<img src="${img('h1.webp')}" alt="${esc(nome)}" width="1200" height="400">`;

    const header = `
      <div class="announcement">${esc(d.store.announcement)}</div>
      <header class="store-header">
        <button class="icon-btn menu-btn" type="button" data-menu-open aria-label="Abrir menú">${icon.menu}</button>
        <a class="logo" href="${link()}" aria-label="${esc(nome)}">${logo}</a>
        <nav class="main-nav" aria-label="Navegación principal" data-menu>
          <button class="icon-btn menu-close" type="button" data-menu-close aria-label="Cerrar">${icon.close}</button>
          <a href="${link()}">Inicio</a>
          ${d.categorias.map(c => `<a href="${link()}#cat-${c.produtos[0]}">${esc(c.nombre)}</a>`).join('')}
        </nav>
        <a class="icon-btn cart-btn" href="#" aria-label="Carrito">${icon.bag}</a>
      </header>`;
    const footer = `
      <footer class="store-footer">
        <div class="footer-brand"><strong>${esc(nome)}</strong><p>${esc(d.store.aboutText)}</p></div>
        <div><h3>Explorar</h3><a href="${link()}#coleccion">Ver todo</a>${d.categorias.map(c => `<a href="${link()}#cat-${c.produtos[0]}">${esc(c.nombre)}</a>`).join('')}</div>
        <div><h3>Información</h3><a href="#">Política de envíos</a><a href="#">Devoluciones</a><a href="#">Contacto</a></div>
        <small class="footer-copy">© ${new Date().getFullYear()} ${esc(nome)}</small>
      </footer>`;

    const card = p => `
      <article class="product-card"><a href="${link(p.n)}">
        <div class="card-media"><img class="store-image" src="${img(p.imagenes[0])}" alt="" loading="lazy" width="1200" height="1200"><span class="card-badge">${esc(p.badge)}</span></div>
        <h3>${esc(p.t)}</h3><p class="card-price">${price}</p>
      </a></article>`;

    let body;
    if (!produto) {
      document.title = `${nome} · Tienda online`;
      body = `
        <section class="hero">
          <div class="hero-copy"><p class="eyebrow">${esc(nome)}</p><h1>${esc(d.store.headline)}</h1><p class="hero-sub">${esc(d.store.subtitle)}</p><a class="button" href="#coleccion">Ver la colección</a></div>
          <a class="hero-media" href="#coleccion" tabindex="-1" aria-hidden="true"><span class="desktop-only"><img class="store-image" src="${img('h2.webp')}" alt=""></span><span class="mobile-only"><img class="store-image" src="${img('h3.webp')}" alt=""></span></a>
        </section>
        <ul class="trust-row"><li>${icon.shield}Pago 100% seguro</li><li>${icon.truck}Envíos a toda España</li><li>${icon.chat}Atención en español</li></ul>
        <section class="container" id="coleccion"><div class="section-head"><p class="eyebrow">Selección</p><h2>Lo más destacado</h2></div>
          <div class="product-rail">${d.productos.slice(0, 5).map(card).join('')}</div></section>
        <section class="container"><div class="section-head"><p class="eyebrow">Categorías</p><h2>Compra por categoría</h2></div>
          <div class="category-grid">${d.categorias.map((c, i) => `<a class="category-tile" id="cat-${c.produtos[0]}" href="${link(c.produtos[0])}"><img class="store-image" src="${img(`h${i + 4}.webp`)}" alt="" loading="lazy"><span>${esc(c.nombre)}</span></a>`).join('')}</div></section>
        <section class="container"><div class="section-head"><p class="eyebrow">Descubre</p><h2>Más para descubrir</h2></div>
          <div class="product-grid">${d.productos.slice(5).map(card).join('')}</div></section>
        <section class="container split about"><div class="split-media"><img class="store-image" src="${img('h8.webp')}" alt="" loading="lazy"></div>
          <div class="split-copy"><p class="eyebrow">Nuestra historia</p><h2>${esc(d.store.aboutTitle.replace('{{store_name}}', nome))}</h2><p>${esc(d.store.aboutText)}</p></div></section>
        <section class="banner"><div class="banner-copy"><h2>${esc(d.store.bannerTitle)}</h2><a class="button button-light" href="#coleccion">Ver la colección</a></div>
          <div class="banner-media"><span class="desktop-only"><img class="store-image" src="${img('h9.webp')}" alt="" loading="lazy"></span><span class="mobile-only"><img class="store-image" src="${img('h10.webp')}" alt="" loading="lazy"></span></div></section>`;
    } else {
      const p = d.productos.find(x => x.n === produto) || d.productos[0];
      const pics = p.imagenes;
      const pic = k => img(pics[(k - 1) % pics.length]);
      document.title = `${p.t} · ${nome}`;
      const outros = d.productos.filter(x => x.n !== p.n).slice(0, 4);
      body = `
        <div class="product-top" id="product-top">
          <nav class="breadcrumb container"><a href="${link()}">Inicio</a> / <span>${esc(p.categoria)}</span></nav>
          <div class="product-detail container">
            <div class="product-gallery"><div class="gallery-track" data-gallery>${pics.map((f, i) => `<div class="gallery-slide"><img class="store-image" src="${img(f)}" alt="${esc(p.t)} · foto ${i + 1}" ${i ? 'loading="lazy"' : ''} width="1200" height="1200"></div>`).join('')}</div><div class="gallery-dots" data-gallery-dots></div></div>
            <div class="product-copy">
              <div class="offer-badges"><span>${esc(p.badge)}</span><span class="soft">${esc(p.categoria)}</span></div>
              <h1 class="product-title">${esc(p.t)}</h1>
              <div class="price-row">${price}</div>
              <h2 class="offer-headline">${esc(p.h)}</h2>
              <p class="offer-subtitle">${esc(p.s)}</p>
              <ul class="quick-benefits">${p.b.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
              <form class="buy-form" id="buy-form" onsubmit="event.preventDefault()">
                <div class="purchase-row">
                  <div class="quantity-control"><button type="button" data-quantity-step="-1" aria-label="Restar uno">−</button><input aria-label="Cantidad" type="number" min="1" value="1"><button type="button" data-quantity-step="1" aria-label="Sumar uno">+</button></div>
                  <button class="add-to-cart" type="submit" data-main-buy>Añadir al carrito</button>
                </div>
              </form>
              <ul class="mini-trust"><li>Pago seguro</li><li>Atención en español</li></ul>
            </div>
          </div>
        </div>
        <div class="sticky-buy" data-sticky-buy hidden><div><strong>Añadir al carrito</strong><small>${esc(p.t)}</small></div><button type="submit" form="buy-form" class="add-to-cart">Añadir</button></div>
        <section class="container"><div class="section-head"><h2>${esc(p.ctxT)}</h2></div>
          <div class="context-rail">${p.ctx.map(([t, x], i) => `<article class="context-card"><img class="store-image" src="${pic(i + 2)}" alt="" loading="lazy"><h3>${esc(t)}</h3><p>${esc(x)}</p></article>`).join('')}</div></section>
        ${p.ben.map(([e, t, x], i) => `<section class="container split benefit${i === 1 ? ' reverse' : ''}"><div class="split-media"><img class="store-image" src="${pic(i + 3)}" alt="" loading="lazy"></div><div class="split-copy"><p class="eyebrow">${esc(e)}</p><h2>${esc(t)}</h2><p>${esc(x)}</p></div></section>`).join('')}
        <section class="container split details"><div class="split-copy"><p class="eyebrow">En detalle</p><h2>${esc(p.dT)}</h2><p>${esc(p.dX)}</p></div><div class="split-media"><img class="store-image" src="${pic(1)}" alt="" loading="lazy"></div></section>
        <section class="container"><div class="section-head"><h2>Cómo se usa</h2></div><ol class="steps">${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
        <section class="container split specs"><div class="split-media"><img class="store-image" src="${pic(3)}" alt="" loading="lazy"></div><div class="split-copy"><h2>Especificaciones</h2>
          <dl class="spec-list">${p.spec.map(l => { const i = l.indexOf(':'); return i > 0 ? `<div><dt>${esc(l.slice(0, i))}</dt><dd>${esc(l.slice(i + 1).trim())}</dd></div>` : `<div><dd>${esc(l)}</dd></div>`; }).join('')}</dl></div></section>
        ${p.box ? `<section class="container"><div class="section-head"><h2>Qué incluye</h2></div><ul class="quick-benefits">${p.box.split('\n').map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        <section class="final-cta"><h2>${esc(p.fT)}</h2><p>${esc(p.fX)}</p><a class="button button-light" href="#product-top">Elegir el mío</a></section>
        <section class="container faq"><h2>Preguntas frecuentes</h2>${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
        <section class="container"><div class="section-head"><h2>También te puede gustar</h2></div><div class="product-grid">${outros.map(card).join('')}</div></section>`;
    }
    document.getElementById('app').innerHTML = header + `<main id="MainContent">${body}</main>` + footer;
    const s = document.createElement('script');
    s.src = 'js/loja-tema.js';
    document.body.append(s);
    if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
  }

  main().catch(err => {
    document.getElementById('app').innerHTML = `<div class="container" style="padding:64px 20px"><h1>Ops.</h1><p>${esc(err.message)}</p></div>`;
  });
})();
