"""Mede quanto texto (OCR) existe em cada foto de produto e grava em tools/fonte/<nicho>.json
o campo textScore. O build usa isso para pôr a foto mais limpa como principal e tirar da
galeria as fotos com muito texto em inglês. Requer: tesseract instalado. Uso: python3 tools/texto_fotos.py"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS = re.compile(r'\b[A-Za-z]{3,}\b')


def score(path):
    out = subprocess.run(['tesseract', path, '-', '--psm', '11', '-l', 'eng'], capture_output=True, text=True).stdout
    words = [w for w in WORDS.findall(out) if sum(c.lower() in 'aeiou' for c in w) >= 1]
    return len(words)


for f in sorted(os.listdir(os.path.join(ROOT, 'tools', 'fonte'))):
    n = f[:-5]
    if len(sys.argv) > 1 and n not in sys.argv[1:]:
        continue
    p = os.path.join(ROOT, 'tools', 'fonte', f)
    d = json.load(open(p))
    for prod in d['products']:
        prod['textScore'] = [score(os.path.join(ROOT, 'img', n, im)) for im in prod['images']]
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1)
    print(n, [pr['textScore'] for pr in d['products']])
