"""Gera o site a partir de tools/fonte (dados) + tools/copy (textos em espanhol).

Saídas:
  site/data/<nicho>.json   dados da loja usados pelo app e pela prévia
  site/data/nichos.json    índice dos nichos
  site/img/<nicho>/h1-3, h9-10.webp   logo e banners gerados (sem texto embutido)
  site/temas/<loja>.zip    tema Shopify em espanhol, pronto para importar

Uso: python3 tools/build.py
"""
import io, json, os, re, zipfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'tools')
SITE = os.path.join(ROOT, 'site')
NICHOS = ['home', 'pets', 'beauty', 'technology', 'outdoors', 'utilities', 'general']
# Nichos do formulário (ordem de exibição). Sem dados = "em breve".
CATALOGO = [
    ('home', 'Casa e organização'), ('pets', 'Pets'), ('beauty', 'Beleza e cuidados pessoais'),
    ('fitness', 'Saúde e fitness'), ('technology', 'Tecnologia e acessórios'), ('outdoors', 'Jardim e ar livre'),
    ('fashion', 'Moda e acessórios'), ('utilities', 'Carro, ferramentas e viagem'),
]
NOMES_PT = dict(CATALOGO, general='Variedade')
FONT_SERIF = '/usr/share/fonts/truetype/gelasio/Gelasio-Medium.ttf'
FONT_SANS = '/usr/share/fonts/truetype/dm-sans/DMSans-Bold.ttf'


def find_font(name_hint, fallback):
    for root, _, files in os.walk('/usr/share/fonts'):
        for f in files:
            if name_hint.lower() in f.lower() and f.endswith('.ttf'):
                return os.path.join(root, f)
    return fallback


FONT_SERIF = FONT_SERIF if os.path.exists(FONT_SERIF) else find_font('Gelasio-Medium', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf')
FONT_SANS = FONT_SANS if os.path.exists(FONT_SANS) else find_font('DMSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')


def slug(s):
    s = s.lower().replace('&', 'and')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------- imagens geradas ----------
def card(photo, size, radius=28):
    """Foto quadrada recortada em cartão branco com sombra."""
    w, h = size
    im = Image.open(photo).convert('RGB')
    s = min(im.size)
    im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((w - 24, h - 24), Image.LANCZOS)
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    base = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    inner = Image.new('L', (w - 24, h - 24), 0)
    ImageDraw.Draw(inner).rounded_rectangle((0, 0, w - 25, h - 25), max(6, radius - 10), fill=255)
    base.paste(im, (12, 12), inner)
    c.paste(base, (0, 0), m)
    return c


def place(canvas, c, xy, shadow=True):
    if shadow:
        sh = Image.new('RGBA', (c.width + 80, c.height + 80), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((40, 52, c.width + 40, c.height + 52), 30, fill=(0, 0, 0, 60))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        canvas.alpha_composite(sh, (xy[0] - 40, xy[1] - 40))
    canvas.alpha_composite(c, xy)


def collage(photos, size, bg, layout):
    cv = Image.new('RGBA', size, hexrgb(bg) + (255,))
    for ph, (x, y, w, h) in zip(photos, layout):
        place(cv, card(ph, (w, h)), (x, y))
    return cv.convert('RGB')


def logo(text, tagline, color, accent):
    W, H = 1200, 400
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(cv)
    size = 150
    while size > 40:
        f = ImageFont.truetype(FONT_SERIF, size)
        if d.textlength(text, font=f) < W - 120:
            break
        size -= 6
    f2 = ImageFont.truetype(FONT_SANS, 34)
    tag = '  '.join(tagline.upper())
    tw, gw = d.textlength(text, font=f), d.textlength(tag, font=f2)
    d.text(((W - tw) / 2, 95), text, font=f, fill=hexrgb(color))
    d.text(((W - gw) / 2, 95 + size + 28), tag, font=f2, fill=hexrgb(accent))
    return cv.crop(cv.getbbox() or (0, 0, W, H))


def gerar_imagens(n, fonte, copy):
    pal = fonte['palette']
    d = os.path.join(SITE, 'img', n)
    p = lambda i: os.path.join(d, fonte['products'][i]['images'][0])
    logo(fonte['storeName'], copy['store']['tagline'], pal['text'], pal['accent']).save(os.path.join(d, 'h1.webp'), quality=90)
    # Hero desktop 1600x1100: 3 cartões
    collage([p(0), p(1), p(2)], (1600, 1100), pal['surface'],
            [(140, 150, 720, 720), (930, 120, 520, 520), (900, 690, 360, 360)]).save(os.path.join(d, 'h2.webp'), quality=84)
    # Hero mobile 900x1000: 3 cartões
    collage([p(0), p(1), p(2)], (900, 1000), pal['surface'],
            [(60, 70, 560, 560), (560, 520, 300, 300), (110, 680, 260, 260)]).save(os.path.join(d, 'h3.webp'), quality=84)
    # Banner desktop 1600x700 e mobile 900x900: 4 cartões sobre a cor de destaque
    picks = [p(i) for i in (5, 6, 7, 8)]
    collage(picks, (1600, 700), pal['accent'],
            [(80 + i * 380, 170, 340, 340) for i in range(4)]).save(os.path.join(d, 'h9.webp'), quality=84)
    collage(picks, (900, 900), pal['accent'],
            [(70, 70, 360, 360), (470, 70, 360, 360), (70, 470, 360, 360), (470, 470, 360, 360)]).save(os.path.join(d, 'h10.webp'), quality=84)


# ---------- prompts ----------
HOME_PROMPTS = [
    (1, 'Logo', 1200, 400, 'brand wordmark on a transparent background, the store name only'),
    (2, 'Banner principal · desktop', 1600, 1100, 'desktop hero image: the collection products arranged as an editorial still life, no text'),
    (3, 'Banner principal · celular', 900, 1000, 'mobile hero image: the collection products arranged vertically, no text'),
    (8, 'Sobre a marca', 1200, 1200, 'brand story editorial image showing the products in a warm, lived-in Spanish home'),
    (9, 'Banner secundário · desktop', 1600, 700, 'secondary banner with four products on the accent color, no text'),
    (10, 'Banner secundário · celular', 900, 900, 'secondary mobile banner, four products in a 2x2 grid on the accent color, no text'),
]
PROD_PROMPTS = [
    (1, 'Galeria 1', 1200, 1200, 'main product photograph on a clean background'),
    (2, 'Galeria 2', 1200, 1200, 'product from a second angle'),
    (3, 'Galeria 3', 1200, 1200, 'close-up of a real product detail'),
    (4, 'Galeria 4', 1200, 1200, 'product in a realistic setting'),
    (5, 'Galeria 5', 1200, 1200, 'product scale and proportions next to everyday objects'),
]


def palette_txt(pal):
    return f"background {pal['background']}, surfaces {pal['surface']}, text {pal['text']}, accent {pal['accent']}"


def make_prompt(store, purpose, subject, ref, pal, w, h, extra=''):
    return (f"Create a professional e-commerce image for {store}, an online store selling to customers in Spain. "
            f"Purpose: {purpose}. Subject: {subject}. {extra}Reference facts: {ref} "
            f"Brand palette: {palette_txt(pal)}. Keep the real product design, colors, proportions and components shown in the supplier photo you attach. "
            f"Do not invent features or accessories. Size: {w} × {h} px. Any visible text must be in Spanish (Spain). "
            f"No fake reviews, certifications, prices or claims.")


def gerar_prompts(fonte, copy, cats):
    store, pal = fonte['storeName'], fonte['palette']
    tema = NOMES_PT[fonte['id']]
    out = []
    ref_home = f"Use only the store name and the collection categories ({', '.join(c['nombre'] for c in cats)})."
    for num, title, w, h, purpose in HOME_PROMPTS:
        out.append({'number': num, 'title': title, 'width': w, 'height': h, 'group': 'Home e identidade',
                    'text': make_prompt(store, purpose, tema, ref_home, pal, w, h)})
    for i, c in enumerate(cats, 1):
        nomes = '; '.join(fonte['products'][k - 1]['nameEn'] for k in c['produtos'])
        out.append({'number': 3 + i, 'title': f"Categoria · {c['nombre']}", 'width': 800, 'height': 1000, 'group': 'Home e identidade',
                    'text': make_prompt(store, f'category {i} editorial image', c['nombre'], f'Show these actual products together: {nomes}.', pal, 800, 1000,
                                        'The category name is context only, never lettering in the image. ')})
    out.sort(key=lambda x: x['number'])
    for p, cp in zip(fonte['products'], copy['products']):
        base = p['n'] * 100
        subj = f"{cp['t']} ({p['nameEn']})"
        items = list(PROD_PROMPTS)
        for k, (t, x) in enumerate(cp['ctx'], 1):
            items.append((5 + k, f'Contexto {k}', 1000, 1000, f'usage scene: {t} — {x}'))
        for k, (_, t, x) in enumerate(cp['ben'], 1):
            items.append((9 + k, f'Benefício {k}', 1200, 1000, f'benefit illustration: {t} — {x}'))
        items.append((13, 'Detalhes', 1200, 1500, f"close-up of verified physical details: {cp['dT']}"))
        for off, title, w, h, purpose in items:
            out.append({'number': base + off, 'title': title, 'width': w, 'height': h, 'group': cp['t'], 'product': p['n'],
                        'text': make_prompt(store, purpose, subj, p['facts'], pal, w, h)})
    return out


# ---------- tema Shopify ----------
def s_text(id, label, t='text'):
    return {'type': t, 'id': id, 'label': label}


def schema_home():
    st = [s_text('headline', 'Título principal', 'textarea'), s_text('subtitle', 'Subtítulo', 'textarea'), s_text('cta', 'Texto do botão'),
          s_text('trust_1', 'Selo 1'), s_text('trust_2', 'Selo 2'), s_text('trust_3', 'Selo 3'),
          s_text('aboutTitle', 'Título sobre a marca', 'textarea'), s_text('aboutText', 'Texto sobre a marca', 'textarea'),
          s_text('bannerTitle', 'Título do banner', 'textarea')]
    labels = {2: 'Banner principal · desktop', 3: 'Banner principal · celular', 4: 'Categoria 1', 5: 'Categoria 2', 6: 'Categoria 3', 7: 'Categoria 4',
              8: 'Sobre a marca', 9: 'Banner secundário · desktop', 10: 'Banner secundário · celular'}
    for k, lab in labels.items():
        st += [{'type': 'image_picker', 'id': f'image_{k}', 'label': f'{lab} · #{k}'}, s_text(f'asset_{k}', f'Imagem incluída {k}')]
    for i in range(1, 5):
        st += [s_text(f'category_{i}', f'Categoria {i}'), {'type': 'collection', 'id': f'collection_{i}', 'label': f'Coleção {i}'}]
    return {'name': 'Rian home', 'max_blocks': 10, 'settings': st,
            'blocks': [{'type': 'product', 'name': 'Produto da curadoria', 'settings': [
                s_text('title', 'Título do produto'), s_text('badge', 'Selo do cartão'),
                {'type': 'product', 'id': 'product', 'label': 'Produto importado na Shopify'},
                {'type': 'image_picker', 'id': 'image', 'label': 'Imagem do cartão'}, s_text('asset', 'Imagem incluída'),
                {'type': 'number', 'id': 'prompt', 'label': 'Número do prompt'}]}],
            'presets': [{'name': 'Rian home'}]}


def schema_product():
    st = [{'type': 'number', 'id': 'prompt_base', 'label': 'Base dos prompts'}]
    for i in range(1, 6):
        st += [{'type': 'image_picker', 'id': f'image_{i}', 'label': f'Foto {i}'}, s_text(f'asset_{i}', f'Foto incluída {i}')]
    st += [s_text('offer_badge', 'Selo da oferta (só informações verdadeiras)'), s_text('headline', 'Headline', 'textarea'),
           s_text('subtitle', 'Subtítulo', 'textarea'), s_text('quickBenefits', 'Benefícios rápidos (um por linha)', 'textarea'),
           s_text('shipping_note', 'Nota de envio (opcional)', 'textarea')]
    return {'name': 'Rian produto', 'settings': st}


def schema_story():
    st = [{'type': 'number', 'id': 'prompt_base', 'label': 'Base dos prompts'},
          {'type': 'checkbox', 'id': 'show_contexts', 'label': 'Mostrar contextos', 'default': True}, s_text('contextsTitle', 'Título dos contextos')]
    for i in range(1, 5):
        n = 5 + i
        st += [s_text(f'context{i}Title', f'Contexto {i} · título'), s_text(f'context{i}Text', f'Contexto {i} · texto', 'textarea'),
               {'type': 'image_picker', 'id': f'image_{n}', 'label': f'Contexto {i} · #{n}'}, s_text(f'asset_{n}', f'Imagem incluída {n}')]
    for i in range(1, 4):
        n = 9 + i
        st += [{'type': 'checkbox', 'id': f'show_benefit{i}', 'label': f'Mostrar benefício {i}', 'default': True},
               s_text(f'benefit{i}Eyebrow', f'Benefício {i} · chamada'), s_text(f'benefit{i}Title', f'Benefício {i} · título'),
               s_text(f'benefit{i}Text', f'Benefício {i} · texto', 'textarea'),
               {'type': 'image_picker', 'id': f'image_{n}', 'label': f'Benefício {i} · #{n}'}, s_text(f'asset_{n}', f'Imagem incluída {n}')]
    return {'name': 'Rian história do produto', 'settings': st}


def schema_details():
    st = [{'type': 'number', 'id': 'prompt_base', 'label': 'Base dos prompts'}]
    extra = [{'type': 'checkbox', 'id': 'show_details', 'label': 'Mostrar detalhes', 'default': True}, s_text('detailTitle', 'Título dos detalhes'),
           s_text('detailText', 'Texto dos detalhes', 'textarea'), {'type': 'image_picker', 'id': 'image_13', 'label': 'Detalhes · #13'},
           s_text('asset_13', 'Imagem incluída 13'), {'type': 'checkbox', 'id': 'show_usage', 'label': 'Mostrar como usar', 'default': True},
           s_text('usageTitle', 'Título de como usar'), s_text('step1', 'Passo 1', 'textarea'), s_text('step2', 'Passo 2', 'textarea'), s_text('step3', 'Passo 3', 'textarea')]
    st += extra
    st += [{'type': 'checkbox', 'id': 'show_specifications', 'label': 'Mostrar especificações', 'default': True},
          s_text('specificationsTitle', 'Título das especificações'), s_text('specifications', 'Especificações (uma por linha, "Nome: valor")', 'textarea'),
          {'type': 'image_picker', 'id': 'image_3', 'label': 'Imagem das especificações'}, s_text('asset_3', 'Imagem incluída'),
          {'type': 'checkbox', 'id': 'show_box', 'label': 'Mostrar conteúdo da embalagem', 'default': False}, s_text('boxTitle', 'Título da embalagem'),
          s_text('box', 'Conteúdo da embalagem', 'textarea'),
          {'type': 'checkbox', 'id': 'show_guarantee', 'label': 'Mostrar garantia', 'default': False}, s_text('guaranteeTitle', 'Título da garantia'),
          s_text('guarantee', 'Condições reais de garantia', 'textarea'),
          {'type': 'checkbox', 'id': 'show_closing', 'label': 'Mostrar chamada final', 'default': True}, s_text('finalTitle', 'Título final'),
          s_text('finalText', 'Texto final', 'textarea'), {'type': 'checkbox', 'id': 'show_faq', 'label': 'Mostrar perguntas', 'default': True},
          s_text('faqTitle', 'Título das perguntas')]
    for i in range(1, 4):
        st += [s_text(f'faq{i}Question', f'Pergunta {i}'), s_text(f'faq{i}Answer', f'Resposta {i}', 'textarea')]
    return {'name': 'Rian detalhes do produto', 'settings': st}


LOCALE_ES = {
    'general': {'skip': 'Saltar al contenido', 'menu': 'Abrir menú', 'close': 'Cerrar', 'navigation': 'Navegación principal', 'home': 'Inicio',
                'shop': 'Ver todo', 'search': 'Buscar', 'bag': 'Carrito', 'explore': 'Explorar', 'information': 'Información', 'contact': 'Contacto',
                'breadcrumb': 'Ruta de navegación', 'placeholder': 'Genera con el prompt {{ number }}',
                'assign_product': 'Selecciona el producto importado en los ajustes de este bloque.', 'no_results': 'No hay resultados.',
                'not_found': 'Página no encontrada'},
    'home': {'selected_eyebrow': 'Selección', 'selected': 'Lo más destacado', 'categories_eyebrow': 'Categorías', 'categories': 'Compra por categoría',
             'more_eyebrow': 'Descubre', 'more': 'Más para descubrir', 'our_story': 'Nuestra historia', 'banner_cta': 'Ver la colección'},
    'product': {'quantity': 'Cantidad', 'decrease': 'Restar uno', 'increase': 'Sumar uno', 'add_to_cart': 'Añadir al carrito', 'unavailable': 'Agotado',
                'reviews': 'opiniones', 'details': 'En detalle', 'choose': 'Elegir el mío', 'trust_payment': 'Pago seguro',
                'trust_support': 'Atención en español', 'shipping': 'Envíos y entregas', 'payment_methods': 'Métodos de pago'},
    'cart': {'empty': 'Tu carrito está vacío.', 'remove': 'Eliminar', 'subtotal': 'Subtotal', 'calculated': 'Impuestos incluidos. Envío calculado al finalizar la compra.',
             'update': 'Actualizar', 'checkout': 'Finalizar compra'},
}

SIMPLE_SECTIONS = {
    'rm-cart': """<div class="container" style="padding-top:32px">
  <h1>{{ 'general.bag' | t }}</h1>
  {% if cart.item_count == 0 %}
    <p>{{ 'cart.empty' | t }}</p><a class="button" href="{{ routes.all_products_collection_url }}">{{ 'general.shop' | t }}</a>
  {% else %}
    <form action="{{ routes.cart_url }}" method="post">
      {% for item in cart.items %}
        <div class="cart-row">
          <div><h3><a href="{{ item.url }}">{{ item.product.title | escape }}</a></h3>{% unless item.product.has_only_default_variant %}<p>{{ item.variant.title | escape }}</p>{% endunless %}<label for="q-{{ forloop.index }}">{{ 'product.quantity' | t }}</label> <input type="number" min="0" id="q-{{ forloop.index }}" name="updates[]" value="{{ item.quantity }}" style="width:64px"> · <a href="{{ item.url_to_remove }}">{{ 'cart.remove' | t }}</a></div>
          <strong>{{ item.final_line_price | money }}</strong>
        </div>
      {% endfor %}
      <div class="cart-footer"><p><strong>{{ 'cart.subtotal' | t }}: {{ cart.total_price | money }}</strong></p><small>{{ 'cart.calculated' | t }}</small><button class="button" type="submit" name="checkout">{{ 'cart.checkout' | t }}</button><button class="button button-light" type="submit" name="update">{{ 'cart.update' | t }}</button></div>
    </form>
  {% endif %}
</div>""",
    'rm-collection': """<div class="container" style="padding-top:32px">
  <h1>{{ collection.title | escape }}</h1>
  {% paginate collection.products by 24 %}
    <div class="product-grid">{% for product in collection.products %}<article class="product-card"><a href="{{ product.url }}"><div class="card-media">{% assign template_number = product.template_suffix | remove: 'rian-' | plus: 0 %}{% assign prompt_number = template_number | times: 100 | plus: 1 %}{% render 'rm-image', image: product.featured_image, number: prompt_number, width: 1200, height: 1200 %}</div><h3>{{ product.title | escape }}</h3><p class="card-price">{{ product.price | money }}</p></a></article>{% endfor %}</div>
    {{ paginate | default_pagination }}
  {% endpaginate %}
</div>""",
    'rm-search': """<div class="container" style="padding-top:32px"><h1>{{ 'general.search' | t }}</h1>
  <form class="search-form" action="{{ routes.search_url }}" method="get"><input type="hidden" name="type" value="product"><label for="search-input">{{ 'general.search' | t }}</label><input id="search-input" type="search" name="q" value="{{ search.terms | escape }}" placeholder="{{ 'general.search' | t }}…"><button class="button" type="submit">{{ 'general.search' | t }}</button></form>
  {% if search.performed %}{% paginate search.results by 24 %}<div class="product-grid">{% for item in search.results %}<article class="product-card"><a href="{{ item.url }}"><div class="card-media">{% render 'rm-image', image: item.featured_image, number: 1, width: 1200, height: 1200 %}</div><h3>{{ item.title | escape }}</h3><p class="card-price">{{ item.price | money }}</p></a></article>{% else %}<p>{{ 'general.no_results' | t }}</p>{% endfor %}</div>{{ paginate | default_pagination }}{% endpaginate %}{% endif %}
</div>""",
    'rm-page': """<div class="container" style="padding-top:32px;max-width:760px"><h1>{{ page.title | escape }}</h1>{{ page.content }}</div>""",
}


def section_file(body, schema):
    return body.rstrip() + '\n{% schema %}\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n{% endschema %}\n'


def asset_cycle(imgs, k):
    return f'rm-{imgs[(k - 1) % len(imgs)]}'


def build_theme(n, fonte, copy, cats, out_zip):
    tema = os.path.join(T, 'tema')
    pal, st = fonte['palette'], copy['store']
    store = fonte['storeName']
    files = {}
    files['layout/theme.liquid'] = open(os.path.join(tema, 'layout/theme.liquid')).read()
    for f in ('rm-image', 'rm-card'):
        files[f'snippets/{f}.liquid'] = open(os.path.join(tema, 'snippets', f + '.liquid')).read()
    files['assets/loja.css'] = open(os.path.join(tema, 'assets/loja.css')).read()
    files['assets/loja.js'] = open(os.path.join(tema, 'assets/loja.js')).read()
    rd = lambda f: open(os.path.join(tema, 'sections', f + '.body')).read()
    files['sections/rm-home.liquid'] = section_file(rd('rm-home'), schema_home())
    files['sections/rm-product.liquid'] = section_file(rd('rm-product'), schema_product())
    files['sections/rm-product-story.liquid'] = section_file(rd('rm-product-story'), schema_story())
    files['sections/rm-product-details.liquid'] = section_file(rd('rm-product-details'), schema_details())
    for k, body in SIMPLE_SECTIONS.items():
        files[f'sections/{k}.liquid'] = section_file(body, {'name': k.replace('rm-', 'Rian ')})
    files['templates/404.liquid'] = "<div class=\"container\" style=\"padding:64px 20px\"><h1>{{ 'general.not_found' | t }}</h1><a class=\"button\" href=\"{{ routes.root_url }}\">{{ 'general.home' | t }}</a></div>\n"
    for t, sec in (('cart', 'rm-cart'), ('collection', 'rm-collection'), ('search', 'rm-search'), ('page', 'rm-page')):
        files[f'templates/{t}.json'] = json.dumps({'sections': {'main': {'type': sec, 'settings': {}}}, 'order': ['main']}, indent=2)
    files['locales/es.default.json'] = json.dumps(LOCALE_ES, ensure_ascii=False, indent=2)
    files['config/settings_schema.json'] = json.dumps([
        {'name': 'theme_info', 'theme_name': 'Rian', 'theme_version': '2.0.0', 'theme_author': 'Rian Medeiros',
         'theme_documentation_url': 'https://www.shopify.com', 'theme_support_url': 'https://www.shopify.com'},
        {'name': 'Identidade da loja', 'settings': [
            s_text('brand', 'Nome da loja'), {'type': 'image_picker', 'id': 'logo', 'label': 'Logo · prompt 1'}, s_text('logo_asset', 'Logo incluído'),
            s_text('announcement', 'Barra de anúncio (opcional)'), {'type': 'link_list', 'id': 'menu', 'label': 'Links do menu'},
            s_text('footer_text', 'Texto do rodapé', 'textarea'), s_text('support_email', 'E-mail de atendimento')]},
        {'name': 'Cores', 'settings': [{'type': 'color', 'id': f'color_{k}', 'label': lab, 'default': pal[v]} for k, lab, v in (
            ('bg', 'Fundo', 'background'), ('surface', 'Superfícies', 'surface'), ('text', 'Texto', 'text'), ('muted', 'Texto secundário', 'muted'),
            ('accent', 'Destaque', 'accent'), ('on_accent', 'Texto sobre o destaque', 'onAccent'), ('border', 'Bordas', 'border'))]},
    ], ensure_ascii=False, indent=2)
    files['config/settings_data.json'] = json.dumps({'current': {
        'brand': store, 'logo_asset': 'rm-home-1.webp', 'announcement': st['announcement'],
        'footer_text': st['aboutText'].replace('{{store_name}}', store),
        'color_bg': pal['background'], 'color_surface': pal['surface'], 'color_text': pal['text'], 'color_muted': pal['muted'],
        'color_accent': pal['accent'], 'color_on_accent': pal['onAccent'], 'color_border': pal['border']}, 'presets': {}}, ensure_ascii=False, indent=2)
    # home
    hs = {'headline': st['headline'], 'subtitle': st['subtitle'], 'cta': 'Ver la colección', 'trust_1': 'Pago 100% seguro',
          'trust_2': 'Envíos a toda España', 'trust_3': 'Atención en español',
          'aboutTitle': st['aboutTitle'].replace('{{store_name}}', store), 'aboutText': st['aboutText'], 'bannerTitle': st['bannerTitle']}
    for k in (2, 3, 4, 5, 6, 7, 8, 9, 10):
        hs[f'asset_{k}'] = f'rm-home-{k}.webp'
    for i, c in enumerate(cats, 1):
        hs[f'category_{i}'] = c['nombre']
    blocks, order = {}, []
    for p in sorted(fonte['products'], key=lambda x: x['n']):
        cp = copy['products'][p['n'] - 1]
        blocks[f'product{p["n"]}'] = {'type': 'product', 'settings': {'title': cp['t'], 'badge': cp['badge'], 'prompt': p['n'] * 100 + 1,
                                                                   'asset': f'rm-{p["images"][0]}'}}
        order.append(f'product{p["n"]}')
    files['templates/index.json'] = json.dumps({'sections': {'main': {'type': 'rm-home', 'settings': hs, 'blocks': blocks, 'block_order': order}},
                                                'order': ['main']}, ensure_ascii=False, indent=2)
    # produto padrão + um template por produto
    files['templates/product.json'] = json.dumps({'sections': {'main': {'type': 'rm-product', 'settings': {'prompt_base': 0}}}, 'order': ['main']}, indent=2)
    for p in fonte['products']:
        cp = copy['products'][p['n'] - 1]
        imgs = p['images']
        base = p['n'] * 100
        main = {'prompt_base': base, 'offer_badge': cp['badge'], 'headline': cp['h'], 'subtitle': cp['s'], 'quickBenefits': '\n'.join(cp['b'])}
        for i in range(1, 6):
            if i <= len(imgs):
                main[f'asset_{i}'] = f'rm-{imgs[i - 1]}'
        story = {'prompt_base': base, 'show_contexts': True, 'contextsTitle': cp['ctxT']}
        usage = {'show_details': True, 'detailTitle': cp['dT'], 'detailText': cp['dX'], 'show_usage': True, 'usageTitle': 'Cómo se usa',
                 'step1': cp['steps'][0], 'step2': cp['steps'][1], 'step3': cp['steps'][2], 'asset_13': asset_cycle(imgs, 1)}
        for k, (t, x) in enumerate(cp['ctx'], 1):
            story.update({f'context{k}Title': t, f'context{k}Text': x, f'asset_{5 + k}': asset_cycle(imgs, k + 1)})
        for k, (e, t, x) in enumerate(cp['ben'], 1):
            story.update({f'show_benefit{k}': True, f'benefit{k}Eyebrow': e, f'benefit{k}Title': t, f'benefit{k}Text': x,
                          f'asset_{9 + k}': asset_cycle(imgs, k + 2)})
        det = {'prompt_base': base, 'show_specifications': True, 'specificationsTitle': 'Especificaciones', 'specifications': '\n'.join(cp['spec']),
               'asset_3': asset_cycle(imgs, 3), 'show_box': bool(cp.get('box')), 'boxTitle': 'Qué incluye', 'box': cp.get('box', ''), 'show_guarantee': False, 'show_closing': True, 'finalTitle': cp['fT'],
               'finalText': cp['fX'], 'show_faq': True, 'faqTitle': 'Preguntas frecuentes', **usage}
        for k, (q, a) in enumerate(cp['faq'], 1):
            det.update({f'faq{k}Question': q, f'faq{k}Answer': a})
        files[f'templates/product.rian-{p["n"]:02d}.json'] = json.dumps(
            {'sections': {'main': {'type': 'rm-product', 'settings': main}, 'story': {'type': 'rm-product-story', 'settings': story},
                          'details': {'type': 'rm-product-details', 'settings': det}}, 'order': ['main', 'story', 'details']},
            ensure_ascii=False, indent=2)
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for path, content in sorted(files.items()):
            z.writestr(path, content)
        img = os.path.join(SITE, 'img', n)
        for f in sorted(os.listdir(img)):
            arc = f'assets/rm-home-{f[1:]}' if f.startswith('h') else f'assets/rm-{f}'
            z.write(os.path.join(img, f), arc)


# ---------- dados do site ----------
def build_nicho(n):
    fonte = json.load(open(os.path.join(T, 'fonte', f'{n}.json')))
    copy = json.load(open(os.path.join(T, 'copy', f'{n}.json')))
    assert len(copy['products']) == 10, n
    gerar_imagens(n, fonte, copy)
    by_id = {p['id']: p['n'] for p in fonte['products']}
    cats = [{'nombre': copy['store']['categories'][i], 'produtos': [by_id[x] for x in c['productIds']]} for i, c in enumerate(fonte['categories'])]
    cat_of = {k: c['nombre'] for c in cats for k in c['produtos']}
    zip_name = f"{slug(fonte['storeName'])}-tema-es.zip"
    os.makedirs(os.path.join(SITE, 'temas'), exist_ok=True)
    build_theme(n, fonte, copy, cats, os.path.join(SITE, 'temas', zip_name))
    produtos = []
    for p in fonte['products']:
        cp = copy['products'][p['n'] - 1]
        produtos.append({'n': p['n'], 'nombreOriginal': p['nameEn'], 'categoria': cat_of[p['n']], 'imagenes': p['images'],
                         'plantilla': f"rian-{p['n']:02d}", **cp})
    data = {'id': n, 'nicho': NOMES_PT[n], 'tienda': fonte['storeName'], 'paleta': fonte['palette'], 'paletaNombre': fonte['paletteName'],
            'tema': f'temas/{zip_name}', 'store': copy['store'], 'categorias': cats, 'productos': produtos,
            'prompts': gerar_prompts(fonte, copy, cats)}
    json.dump(data, open(os.path.join(SITE, 'data', f'{n}.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    return data


def main(only=None):
    os.makedirs(os.path.join(SITE, 'data'), exist_ok=True)
    disponiveis = [n for n in NICHOS if os.path.exists(os.path.join(T, 'copy', f'{n}.json'))]
    if only:
        disponiveis = [n for n in disponiveis if n in only]
    for n in disponiveis:
        d = build_nicho(n)
        print(f'{n:11s} {d["tienda"]:16s} {len(d["prompts"])} prompts · {d["tema"]}')
    todos = [n for n in NICHOS if os.path.exists(os.path.join(T, 'copy', f'{n}.json'))]
    idx = []
    for nid, nome in CATALOGO + [('general', 'Variedade')]:
        item = {'id': nid, 'nome': nome, 'disponivel': nid in todos}
        if nid in todos:
            f = json.load(open(os.path.join(T, 'fonte', f'{nid}.json')))
            item.update({'tienda': f['storeName'], 'accent': f['palette']['accent'], 'bg': f['palette']['background']})
        idx.append(item)
    json.dump(idx, open(os.path.join(SITE, 'data', 'nichos.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    import sys
    main(sys.argv[1:] or None)
