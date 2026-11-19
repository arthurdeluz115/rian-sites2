# Rian Medeiros · Demonstração de lojas para a Espanha

Site estático (sem build) com três páginas:

| Página | O que é |
|---|---|
| `index.html` | Landing page da demonstração |
| `app.html` | Área do aluno: formulário → plano → estrutura → loja pronta, produtos, prompts e guia |
| `loja.html` | Prévia da loja em espanhol (`?n=pets`, `&p=3` para um produto, `&nome=` para outro nome) |

As respostas do aluno ficam salvas no navegador (`localStorage`), então recarregar a página não reinicia a demonstração. O botão de recomeçar fica no topo do formulário e na barra lateral.

## Publicar

**Vercel:** crie o projeto a partir do repositório com as configurações padrão (Framework: *Other*, sem comando de build). O site está na raiz. O `.vercelignore` só evita publicar a pasta `tools/`.

**Local:** `npx serve .` (o app precisa de um servidor porque carrega os JSON com `fetch`).

## Estrutura

```
(raiz)
  css/app.css         visual do app e da landing (paleta verde original)
  css/loja.css        visual da loja (o mesmo CSS que vai dentro do tema Shopify)
  js/app.js           lógica do app (rotas por hash)
  js/loja-preview.js  monta a prévia da loja a partir de data/<nicho>.json
  js/loja-tema.js     interações da loja (menu, galeria, barra de compra fixa)
  data/<nicho>.json   loja, categorias, 10 produtos com copy em espanhol e prompts
  img/<nicho>/        fotos dos produtos (pNN-K.webp) e imagens da home (h1-h10.webp)
  temas/*.zip         tema Shopify em espanhol de cada nicho, pronto para importar
tools/
  build.py            gera data/, banners, logo e temas a partir de fonte + copy
  importar.py         importação única do site antigo (já executada)
  estudio.py          cria fotos de estúdio (remove o fundo) para as lojas de exemplo
  texto_fotos.py      mede texto (OCR) nas fotos; o build põe a mais limpa como principal
  fonte/<nicho>.json  dados dos fornecedores (fatos, imagens, categorias)
  copy/<nicho>.json   TODA a copy em espanhol (edite aqui)
  tema/               código-fonte do tema Shopify (Liquid, CSS, JS)
```

## Editar textos ou adicionar um nicho

1. Edite `tools/copy/<nicho>.json` (loja, categorias e os 10 produtos).
2. Rode `python3 tools/build.py` (precisa de `pip install pillow`). Para um nicho só: `python3 tools/build.py pets`.
3. Faça commit de tudo.

Um nicho só aparece como disponível no formulário quando existe `tools/copy/<id>.json` e `tools/fonte/<id>.json`.

## Lojas de exemplo: Moda (Alma Studio) e Saúde e fitness (Pulso Active)

São lojas de teste. As fotos vêm do [clothing-dataset](https://github.com/alexeygrigorev/clothing-dataset), em domínio público (CC0), com o fundo removido e recompostas em estilo estúdio (`tools/estudio.py`). Antes de vender de verdade, troque pelos produtos reais da Zendrop e rode o build.

## Fotos dos fornecedores com texto em inglês

`tools/texto_fotos.py` mede o texto de cada foto com OCR (tesseract). No build, a foto mais limpa vira a principal e as fotos com muito texto saem da galeria (sempre ficam pelo menos 2). Para refazer a medição depois de trocar fotos: `python3 tools/texto_fotos.py`.

## Tema Shopify

- Idioma `es`, cores editáveis em *Personalizar tema → Cores* (vêm da paleta do nicho).
- Home com hero, selos de confiança, vitrine deslizante no celular, 4 categorias, sobre e banner.
- Página de produto com galeria deslizante, selo da oferta, benefícios com check, barra de compra fixa no celular, contextos, benefícios, detalhes, como usar, especificações, "Qué incluye", chamada final e FAQ.
- Um template por produto (`rian-01` a `rian-10`).
- Passou no Theme Check oficial da Shopify sem avisos.
