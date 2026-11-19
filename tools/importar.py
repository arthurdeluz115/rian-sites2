"""Importação única: lê os dados extraídos do site antigo e grava
tools/fonte/<nicho>.json (dados enxutos, sem imagens) e site/img/<nicho>/ (fotos).
Uso: python3 tools/importar.py <pasta_extraida>
"""
import json, os, re, shutil, sys

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(ROOT, 'tools', 'fonte')
IMG = os.path.join(ROOT, 'img')
NICHOS = ['home', 'pets', 'beauty', 'technology', 'outdoors', 'utilities', 'general']

os.makedirs(FONTE, exist_ok=True)
for n in NICHOS:
    raw = json.load(open(os.path.join(SRC, 'home.json' if n == 'home' else f'nicho_{n}.json')))
    sn = raw['bootstrap']['snapshot'] if n == 'home' else raw['snapshot']
    store = raw.get('storeName', 'Home Natural')
    assets = raw['assets']
    pages = raw['pages']
    out_img = os.path.join(IMG, n)
    os.makedirs(out_img, exist_ok=True)

    def copy(key, name):
        src = os.path.join(SRC, 'assets', assets[key])
        shutil.copyfile(src, os.path.join(out_img, name))
        return name

    produtos = []
    for i, p in enumerate(sn['products'], 1):
        keys = [k for k in dict.fromkeys(re.findall(r'__DEMO_ASSET_([\w-]+)__', pages[i])) if not k.startswith('home-')]
        imgs = [copy(k, f'p{i:02d}-{j}.webp') for j, k in enumerate(keys, 1)]
        produtos.append({
            'n': i, 'id': p['id'].replace('wiio-', 'p-'), 'nameEn': p['name'], 'categoryEn': p['storeCategory'],
            'facts': re.sub(r'\s*US delivery and landed cost not verified\.?', '', p['facts']).strip(),
            'sections': p['sections'], 'images': imgs,
        })
    # imagens de categoria (4-7) e "sobre" (8) não têm texto; o resto é gerado no build
    for k in range(4, 9):
        copy(f'home-{k}', f'h{k}.webp')
    json.dump({
        'id': n, 'storeName': store,
        'palette': sn['branding']['colors'], 'paletteName': sn['branding']['name'],
        'categories': [{'en': c['english'], 'productIds': c['productIds']} for c in sn['storeCategories']],
        'products': produtos,
    }, open(os.path.join(FONTE, f'{n}.json'), 'w'), ensure_ascii=False, indent=1)
    print(n, store, len(produtos), 'produtos')
