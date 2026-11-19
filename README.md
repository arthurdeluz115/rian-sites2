# Rian Medeiros · Demonstração de lojas para a Espanha

Site estático (sem build) com três páginas:

| Página | O que é |
|---|---|
| `site/index.html` | Landing page da demonstração |
| `site/app.html` | Área do aluno: formulário → plano → estrutura → loja pronta, produtos, prompts e guia |
| `site/loja.html` | Prévia da loja em espanhol (`?n=pets`, `&p=3` para um produto, `&nome=` para outro nome) |

As respostas do aluno ficam salvas no navegador (`localStorage`), então recarregar a página não reinicia a demonstração. O botão de recomeçar fica no topo do formulário e na barra lateral.

## Publicar

**Vercel:** importe o repositório. O `vercel.json` já aponta a pasta `site` como saída; não há comando de build.

**Local:** `npx serve site` (o app precisa de um servidor porque carrega os JSON com `fetch`).

## Estrutura

```
site/
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
  fonte/<nicho>.json  dados dos fornecedores (fatos, imagens, categorias)
  copy/<nicho>.json   TODA a copy em espanhol (edite aqui)
  tema/               código-fonte do tema Shopify (Liquid, CSS, JS)
```

## Editar textos ou adicionar um nicho

1. Edite `tools/copy/<nicho>.json` (loja, categorias e os 10 produtos).
2. Rode `python3 tools/build.py` (precisa de `pip install pillow`). Para um nicho só: `python3 tools/build.py pets`.
3. Faça commit de `site/`.

Um nicho só aparece como disponível no formulário quando existe `tools/copy/<id>.json` e `tools/fonte/<id>.json`. **Moda** e **Saúde e fitness** aparecem como "Em breve": os arquivos do site antigo para esses dois eram cópias da loja de beleza.

## Tema Shopify

- Idioma `es`, cores editáveis em *Personalizar tema → Cores* (vêm da paleta do nicho).
- Home com hero, selos de confiança, vitrine deslizante no celular, 4 categorias, sobre e banner.
- Página de produto com galeria deslizante, selo da oferta, benefícios com check, barra de compra fixa no celular, contextos, benefícios, detalhes, como usar, especificações, "Qué incluye", chamada final e FAQ.
- Um template por produto (`rian-01` a `rian-10`).
- Passou no Theme Check oficial da Shopify sem avisos.
