"""Gera fotos de estúdio (3 por produto) a partir de fotos CC0 do clothing-dataset
(github.com/alexeygrigorev/clothing-dataset, licença CC0): remove o fundo e aplica
fundo da paleta + sombra. Uso: python3 tools/estudio.py <pasta_imagens> <nicho> id1 id2 ...
"""
import os, sys
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove, new_session

src, nicho, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(ROOT, 'img', nicho)
os.makedirs(out, exist_ok=True)
sess = new_session('u2net')
PAL = {'fashion': ('#F6EFEA', '#FFFFFF', '#EADDD4'), 'fitness': ('#E9F1EE', '#FFFFFF', '#D6E6E0')}[nicho]


def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def bg(color, size=1200, vignette=True):
    im = Image.new('RGB', (size, size), hexrgb(color))
    if vignette:  # leve gradiente de estúdio
        g = Image.new('L', (size, size), 0)
        ImageDraw.Draw(g).ellipse((-size * .2, -size * .35, size * 1.2, size * .9), fill=60)
        g = g.filter(ImageFilter.GaussianBlur(160))
        im = Image.composite(Image.new('RGB', (size, size), (255, 255, 255)), im, g)
    return im


def compose(cut, color, scale=.78, zoom=None):
    S = 1200
    c = cut.crop(cut.getbbox())
    if zoom:  # detalhe: recorta o centro do produto
        w, h = c.size
        c = c.crop((int(w * (1 - zoom) / 2), int(h * (1 - zoom) / 2), int(w * (1 + zoom) / 2), int(h * (1 + zoom) / 2)))
        scale = .95
    r = min(S * scale / c.width, S * scale / c.height)
    c = c.resize((int(c.width * r), int(c.height * r)), Image.LANCZOS)
    im = bg(color).convert('RGBA')
    x, y = (S - c.width) // 2, (S - c.height) // 2 - 10
    if not zoom:  # sombra de contato
        a = c.split()[3].point(lambda v: 70 if v > 20 else 0)
        sh = Image.new('RGBA', c.size, (0, 0, 0, 0)); sh.putalpha(a)
        sh = sh.resize((c.width, max(1, c.height // 9)))
        layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); layer.alpha_composite(sh, (x, y + c.height - sh.height // 2))
        im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(22)))
    im.alpha_composite(c, (x, y))
    return im.convert('RGB')


def flat(cut, color):
    S = 1200
    c = cut.crop(cut.getbbox()).rotate(-9, expand=True, resample=Image.BICUBIC)
    r = min(S * .62 / c.width, S * .62 / c.height)
    c = c.resize((int(c.width * r), int(c.height * r)), Image.LANCZOS)
    im = bg(color, vignette=False).convert('RGBA')
    x, y = (S - c.width) // 2 + 40, (S - c.height) // 2 + 30
    a = c.split()[3].point(lambda v: 90 if v > 20 else 0)
    sh = Image.new('RGBA', c.size, (0, 0, 0, 0)); sh.putalpha(a)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); layer.alpha_composite(sh, (x + 18, y + 26))
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(20)))
    im.alpha_composite(c, (x, y))
    return im.convert('RGB')


for n, iid in enumerate(ids, 1):
    ph = Image.open(os.path.join(src, f'{iid}.jpg')).convert('RGB')
    ph.thumbnail((1400, 1400))
    cut = remove(ph, session=sess, post_process_mask=True)
    compose(cut, PAL[0]).save(os.path.join(out, f'p{n:02d}-1.webp'), quality=86)
    compose(cut, PAL[1], scale=.7).save(os.path.join(out, f'p{n:02d}-2.webp'), quality=86)
    flat(cut, PAL[2]).save(os.path.join(out, f'p{n:02d}-3.webp'), quality=86)
    print(nicho, n, iid)
