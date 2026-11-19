/* Rian Medeiros · área do aluno (demonstração offline).
   Estado salvo no navegador (localStorage). Rotas por hash. */
(() => {
  'use strict';
  const KEY = 'rm-demo-es-v2';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    home: ic('<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'),
    store: ic('<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'),
    box: ic('<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>'),
    spark: ic('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
    book: ic('<path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z"/>'),
    map: ic('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    copy: ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 011-1h10"/>'),
    dl: ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    ext: ic('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
    back: ic('<path d="M15 6l-6 6 6 6"/>'),
    next: ic('<path d="M9 6l6 6-6 6"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    reset: ic('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>'),
    phone: ic('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
    desk: ic('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  };

  // ---------- opções do formulário ----------
  const OPT = {
    value: [['problem', 'Resolver um problema', '🛠️'], ['practical', 'Facilitar a rotina', '⚡'], ['design', 'Design e apresentação', '✨'], ['hobby', 'Ajudar em um hobby', '🎯'], ['system', 'O sistema pode indicar', '🧭']],
    vision: [['system', 'Quero uma indicação do sistema', 'Escolhemos o melhor formato para você'], ['niche', 'Uma marca focada em um assunto', 'Loja nichada, mais fácil de posicionar'], ['general', 'Uma marca com variedade', 'Produtos de categorias diferentes']],
    skills: { service: 'Atender clientes', writing: 'Escrever', organizing: 'Organizar', selling: 'Vender', design: 'Criar imagens ou vídeos', none: 'Estou começando' },
    difficulties: { technology: 'Tecnologia', spanish: 'Espanhol', time: 'Tempo', money: 'Dinheiro', marketing: 'Divulgação', none: 'Nenhuma dessas' },
    experience: { none: 'Nunca vendi pela internet', social: 'Já vendi em redes sociais ou marketplaces', store: 'Já tive uma loja virtual' },
    dailyTime: { 30: 'Até 30 minutos', 60: 'Cerca de 1 hora', 120: 'Cerca de 2 horas', 240: '4 horas ou mais', varies: 'Minha rotina varia' },
    brandGoal: { brand: 'Construir uma marca', sales: 'Começar vendendo produtos' },
    returnGoal: { 1: 'Até 1 mês', 3: 'Até 3 meses', 6: 'Até 6 meses', 12: 'Até 12 meses', flexible: 'Sem prazo definido' },
    company: { none: 'Ainda não tenho empresa', br: 'Tenho CNPJ no Brasil', abroad: 'Tenho empresa fora do Brasil', both: 'Tenho CNPJ e empresa fora' },
    accounts: { shopify: 'Shopify', zendrop: 'Zendrop', paypal: 'PayPal', card: 'Cartão internacional', none: 'Ainda não tenho essas contas' },
  };
  const EMOJI = { home: '🏡', pets: '🐾', beauty: '💄', fitness: '💪', technology: '🎧', outdoors: '🌿', fashion: '👜', utilities: '🚗', general: '🛍️' };
  const POR_VALOR = { problem: 'home', practical: 'utilities', design: 'beauty', hobby: 'outdoors' };
  const NOMES = {
    home: ['Home Natural', 'Casa Serena', 'Hogar Claro', 'Nido & Co'], pets: ['Tail & Meadow', 'Huellas Club', 'Bigotes & Co', 'Patitas Home'],
    beauty: ['Lumi Ritual', 'Brillo Diario', 'Rosa Ritual', 'Piel & Calma'], technology: ['Volt Corner', 'Pixel Plaza', 'Onda Tech', 'Clic Store'],
    outdoors: ['Green Nook', 'Jardín Vivo', 'Raíz & Luz', 'Terra Verde'], utilities: ['Roadready Goods', 'Ruta Lista', 'Taller Fácil', 'Motor & Co'],
    general: ['Everyday Edit', 'Casa Curiosa', 'Todo Bonito', 'Buen Hallazgo'],
  };
  const STEPS = ['Suas preferências', 'Restrições', 'Seu ponto de partida', 'Recursos', 'Revisão'];

  // ---------- estado ----------
  const blank = () => ({
    step: 0,
    a: { interests: [], favorite: '', value: '', vision: '', excluded: [], otherExclusion: '', skills: [], difficulties: [], experience: '', dailyTime: '',
      brandGoal: '', investment: '', currency: 'BRL', returnGoal: '', company: '', accounts: [], acknowledged: false },
    nicho: null, storeName: '', reason: '', planOk: false, generatedAt: null, checklist: [],
  });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch { S = blank(); }
  if (!S.a) S = blank();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* modo privado */ } };

  let NICHOS = [];
  const cache = {};
  const loadNicho = async id => cache[id] || (cache[id] = fetch(`data/${id}.json`).then(r => { if (!r.ok) throw new Error('Não foi possível carregar a loja. Confira a conexão.'); return r.json(); }));

  // ---------- utilidades ----------
  let toastT;
  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg; t.className = `toast show ${type}`;
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast'), 3200);
  }
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch { toast('Selecione o texto e copie manualmente.', 'error'); ta.remove(); return; } ta.remove();
    }
    if (btn) { btn.classList.add('done'); btn.innerHTML = `${I.check} Copiado`; setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = `${I.copy} Copiar`; }, 1800); }
    else toast('Copiado!');
  }
  const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };
  const money = (v, c) => { try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(Number(v) || 0); } catch { return `${c} ${v}`; } };
  const lojaUrl = (d, p, embed) => {
    const u = new URLSearchParams({ n: d.id });
    if (S.storeName && S.storeName !== d.tienda) u.set('nome', S.storeName);
    if (p) u.set('p', p);
    if (embed) u.set('embed', '1');
    return `loja.html?${u}`;
  };
  const copyBtn = (key) => `<button class="copy-btn" type="button" data-copy="${key}">${I.copy} Copiar</button>`;
  const copyStore = {};
  const block = (label, text, cls = 'es') => { const k = 'c' + Object.keys(copyStore).length; copyStore[k] = text; return `<div class="copy-block"><header><span>${esc(label)}</span>${copyBtn(k)}</header><div class="body ${cls}">${esc(text)}</div></div>`; };

  // ---------- lógica ----------
  function escolher(a) {
    const ok = id => NICHOS.find(n => n.id === id && n.disponivel);
    const fora = new Set(a.excluded);
    if (a.vision === 'general') return 'general';
    const cand = a.interests.filter(x => x !== 'none' && !fora.has(x) && ok(x));
    if (a.favorite && cand.includes(a.favorite)) return a.favorite;
    if (cand.length) return cand[0];
    const s = POR_VALOR[a.value];
    if (s && !fora.has(s) && ok(s)) return s;
    return (NICHOS.find(n => n.disponivel && n.id !== 'general' && !fora.has(n.id)) || { id: 'general' }).id;
  }

  function plano(a) {
    const min = a.dailyTime === 'varies' ? 30 : Number(a.dailyTime) || 60;
    const launch = a.experience === 'none' || min < 60 ? 1 : 2;
    const sup = [];
    if (a.difficulties.includes('technology')) sup.push('Seguir o guia de instalação passo a passo e conferir cada conexão antes de publicar.');
    if (a.difficulties.includes('spanish')) sup.push('Usar as copies em espanhol entregues prontas e montar respostas-modelo de atendimento em espanhol.');
    if (a.difficulties.includes('time')) sup.push('Uma tarefa por sessão e um único canal de divulgação no começo.');
    if (a.difficulties.includes('money')) sup.push('Conferir custos de ferramentas antes de assinar e registrar cada despesa no orçamento.');
    if (a.difficulties.includes('marketing')) sup.push('Começar com vídeos curtos do produto principal e anotar as dúvidas do público.');
    if (!a.skills.includes('service')) sup.push('Preparar respostas para dúvidas frequentes, prazos de entrega e rastreio.');
    if (!a.skills.includes('organizing')) sup.push('Usar o checklist do guia para acompanhar tarefas, custos e pedidos.');
    if (!sup.length) sup.push('Revisar instalação e atendimento com o checklist antes da abertura.');
    let acc = 0;
    const timeline = [
      ['Estrutura e revisão', 120, 'Gerar a loja e revisar nome, coleção, copies e páginas.'],
      ['Imagens e identidade', a.brandGoal === 'brand' ? 180 : 120, 'Conferir as imagens incluídas e, se quiser, gerar novas com os prompts.'],
      ['Instalação e conexões', 180, 'Importar o tema, importar os produtos pela Zendrop e associar os templates.'],
      ['Custos e teste', 120, 'Levantar o custo de cada produto na Zendrop, definir preços em euro e testar a compra.'],
      ['Primeira divulgação', 120, `Divulgar ${launch} produto${launch > 1 ? 's' : ''} para o público espanhol e registrar visitas e vendas.`],
    ].map(([t, m, g]) => { const s = Math.floor(acc / min) + 1; acc += m; return { t, g, s, e: Math.ceil(acc / min) }; });
    return {
      min, launch, sup, timeline,
      pos: a.brandGoal === 'brand' ? 'Construção de marca: nome coerente, voz consistente e identidade visual do nicho em todas as páginas.' : 'Foco em vendas: destacar a utilidade de cada produto com uma apresentação direta e chamadas fortes.',
      canal: a.skills.includes('design') ? 'Conteúdo visual: vídeos curtos (Reels/TikTok) mostrando o produto principal em uso.' : a.skills.includes('writing') ? 'Conteúdo escrito: publicações com situações de uso, benefícios e respostas às dúvidas.' : 'Demonstração simples: mostrar o produto funcionando e responder às dúvidas do público.',
    };
  }

  function validar(i) {
    const a = S.a;
    if (i === 0) {
      if (!a.interests.length) return 'Escolha pelo menos um assunto (ou "Ainda não tenho preferência").';
      if (!a.value) return 'Diga o que mais chama sua atenção em um produto.';
      if (!a.vision) return 'Escolha o formato da sua marca.';
    }
    if (i === 2) {
      if (!a.skills.length || !a.difficulties.length) return 'Marque suas habilidades e dificuldades.';
      if (!a.experience || !a.dailyTime || !a.brandGoal) return 'Responda às perguntas sobre seu momento.';
    }
    if (i === 3) {
      const v = Number(String(a.investment).replace(',', '.'));
      if (a.investment === '' || !Number.isFinite(v) || v < 0) return 'Informe quanto pretende investir (pode ser zero).';
      if (!a.returnGoal || !a.company || !a.accounts.length) return 'Responda às perguntas sobre recursos.';
    }
    if (i === 4 && !a.acknowledged) return 'Confirme que entendeu como funciona a instalação.';
    return null;
  }

  // ---------- componentes do formulário ----------
  const tick = `<span class="tick">${I.check}</span>`;
  function multi(name, entries, sel, opts = {}) {
    return `<div class="opts ${opts.cols ? 'cols' : ''}">${entries.map(([id, label, extra, off]) => `
      <button type="button" class="opt ${sel.includes(id) ? 'on' : ''} ${off ? 'off' : ''}" data-multi="${name}" data-id="${id}" ${off ? 'aria-disabled="true"' : ''} aria-pressed="${sel.includes(id)}">
        ${extra && extra.length <= 3 ? `<span class="emo">${extra}</span>` : ''}<span class="txt">${esc(label)}${extra && extra.length > 3 ? `<small>${esc(extra)}</small>` : ''}</span>
        ${off ? '<span class="soon">Em breve</span>' : tick}
      </button>`).join('')}</div>`;
  }
  function single(name, entries, sel, cols) {
    return `<div class="opts ${cols ? 'cols' : ''}" role="radiogroup">${entries.map(([id, label, extra]) => `
      <button type="button" role="radio" class="opt ${String(sel) === String(id) ? 'on' : ''}" data-single="${name}" data-id="${id}" aria-checked="${String(sel) === String(id)}">
        ${extra && extra.length <= 3 ? `<span class="emo">${extra}</span>` : ''}<span class="txt">${esc(label)}${extra && extra.length > 3 ? `<small>${esc(extra)}</small>` : ''}</span>${tick}
      </button>`).join('')}</div>`;
  }
  const ent = o => Object.entries(o).map(([k, v]) => [k, v]);

  function stepHtml(i) {
    const a = S.a;
    const cats = NICHOS.filter(n => n.id !== 'general');
    if (i === 0) {
      const favs = a.interests.filter(x => x !== 'none');
      return `
        <h1>O que combina com você?</h1>
        <p class="muted">Responda rápido — cada resposta ajusta o nicho, o plano e a sua loja.</p>
        <div class="dest"><span class="flag">🇪🇸</span><div><strong>Sua loja vai vender na Espanha.</strong><br><span class="muted">Loja em espanhol · preços em euro · cores definidas pelo nicho</span></div></div>
        <div class="q"><h3>Quais assuntos você gostaria de vender?</h3><p class="hint">Até três.</p>
          ${multi('interests', [...cats.map(c => [c.id, c.nome, EMOJI[c.id], !c.disponivel]), ['none', 'Ainda não tenho preferência', '🤷']], a.interests, { cols: 1 })}</div>
        ${favs.length > 1 ? `<div class="q"><h3>E o favorito?</h3>${single('favorite', favs.map(f => [f, cats.find(c => c.id === f)?.nome, EMOJI[f]]), a.favorite, 1)}</div>` : ''}
        <div class="q"><h3>O que mais chama sua atenção em um produto?</h3>${single('value', OPT.value, a.value, 1)}</div>
        <div class="q"><h3>Como imagina sua marca?</h3>${single('vision', OPT.vision, a.vision)}</div>`;
    }
    if (i === 1) {
      return `
        <h1>O que prefere deixar de fora?</h1>
        <p class="muted">Opcional. Suas exclusões são respeitadas na escolha da loja.</p>
        <div class="q"><h3>Categorias que você não quer vender</h3>
          ${multi('excluded', cats.filter(c => c.disponivel).map(c => [c.id, c.nome, EMOJI[c.id]]), a.excluded, { cols: 1 })}</div>
        <div class="q"><h3>Alguma outra restrição?</h3><p class="hint">Ex.: não quero produtos elétricos.</p>
          <textarea class="input" data-text="otherExclusion" maxlength="240" placeholder="Escreva aqui (opcional)">${esc(a.otherExclusion)}</textarea></div>`;
    }
    if (i === 2) {
      return `
        <h1>Seu ponto de partida</h1>
        <p class="muted">Isso define o ritmo do seu plano e onde vamos te dar mais apoio.</p>
        <div class="q"><h3>O que você já sabe fazer?</h3>${multi('skills', ent(OPT.skills), a.skills, { cols: 1 })}</div>
        <div class="q"><h3>Onde você tem mais dificuldade?</h3>${multi('difficulties', ent(OPT.difficulties), a.difficulties, { cols: 1 })}</div>
        <div class="q"><h3>Quanto tempo pode dedicar por dia?</h3>${single('dailyTime', ent(OPT.dailyTime), a.dailyTime, 1)}</div>
        <div class="q"><h3>Já vendeu pela internet?</h3>${single('experience', ent(OPT.experience), a.experience)}</div>
        <div class="q"><h3>Quer construir uma marca ou começar vendendo?</h3>${single('brandGoal', ent(OPT.brandGoal), a.brandGoal, 1)}</div>`;
    }
    if (i === 3) {
      return `
        <h1>Recursos e preparação</h1>
        <p class="muted">Não informe senhas, números de cartão ou documentos.</p>
        <div class="q"><h3>Quanto pretende investir para começar?</h3><p class="hint">O total disponível. Use zero se ainda não reservou um valor.</p>
          <div class="money"><select class="input" data-text="currency" aria-label="Moeda"><option value="BRL" ${a.currency === 'BRL' ? 'selected' : ''}>R$ BRL</option><option value="EUR" ${a.currency === 'EUR' ? 'selected' : ''}>€ EUR</option></select>
          <input class="input" data-text="investment" inputmode="decimal" placeholder="Ex.: 1500" value="${esc(a.investment)}" aria-label="Valor"></div></div>
        <div class="q"><h3>Em quanto tempo gostaria de recuperar o investimento?</h3>${single('returnGoal', ent(OPT.returnGoal), a.returnGoal, 1)}</div>
        <div class="q"><h3>Você tem empresa?</h3>${single('company', ent(OPT.company), a.company)}</div>
        <div class="q"><h3>Quais contas você já tem?</h3><p class="hint">Ter a conta não significa que ela já está pronta para receber.</p>${multi('accounts', ent(OPT.accounts), a.accounts, { cols: 1 })}</div>`;
    }
    const nome = id => NICHOS.find(n => n.id === id)?.nome || id;
    const rows = [
      ['Assuntos', a.interests.map(x => x === 'none' ? 'Sem preferência' : nome(x)).join(', ')],
      ['Destaque', OPT.value.find(v => v[0] === a.value)?.[1]], ['Formato', OPT.vision.find(v => v[0] === a.vision)?.[1]],
      ['Excluir', a.excluded.map(nome).join(', ') || 'Nada'], ['Tempo por dia', OPT.dailyTime[a.dailyTime]],
      ['Investimento', money(String(a.investment).replace(',', '.'), a.currency)], ['Retorno', OPT.returnGoal[a.returnGoal]],
      ['Loja', 'Espanha · espanhol · euro'],
    ];
    return `
      <h1>Vamos conferir?</h1>
      <p class="muted">Depois da análise, sua loja fica definida — você não precisa escolher produto nenhum.</p>
      <div class="panel review">${rows.map(([k, v]) => `<div><span>${k}</span><strong>${esc(v || '—')}</strong></div>`).join('')}</div>
      ${a.otherExclusion.trim() ? `<p class="muted" style="margin-top:12px">Sua observação (“${esc(a.otherExclusion.trim())}”) fica registrada para revisão da equipe.</p>` : ''}
      <label class="check-line" style="margin-top:16px"><input type="checkbox" data-check="acknowledged" ${a.acknowledged ? 'checked' : ''}>
        <span>Entendi que vou instalar o tema na Shopify, importar os produtos pela <b>Zendrop</b> e associar os templates seguindo o guia. Nesta demonstração as imagens já vêm prontas.</span></label>`;
  }

  // ---------- telas ----------
  const stagesHtml = cur => `<div class="stages">${['Formulário', 'Meu plano', 'Estrutura', 'Loja pronta'].map((s, i) =>
    `<div class="stage ${i === cur ? 'on' : ''} ${i < cur ? 'done' : ''}"><b>${i < cur ? '✓' : i + 1}</b><span>${s}</span></div>`).join('')}</div>`;
  const brand = `<a class="brand" href="index.html" aria-label="Rian Medeiros — início"><span class="brand-mark">RM</span><span class="brand-name">RIAN<small>MEDEIROS</small></span></a>`;
  const obShell = (cur, inner, dock = '') => `
    <div class="ob-top"><div class="row">${brand}<button class="icon-btn" data-act="reset" title="Recomeçar demonstração" aria-label="Recomeçar demonstração">${I.reset}</button></div>${stagesHtml(cur)}</div>
    <div class="form-wrap view">${inner}</div>${dock}`;

  function viewForm() {
    const i = Math.min(S.step || 0, 4);
    const inner = `<div class="step-label">ETAPA ${i + 1} DE 5 · ${STEPS[i].toUpperCase()}</div><div class="progress"><i style="width:${(i + 1) * 20}%"></i></div>${stepHtml(i)}`;
    const dock = `<div class="dock"><div class="row ${i ? '' : 'single'}">${i ? `<button class="btn ghost" data-act="prev" aria-label="Voltar">${I.back}</button>` : ''}
      <button class="btn" data-act="${i < 4 ? 'next' : 'analyze'}">${i < 4 ? 'Continuar' : 'Analisar minhas respostas'} ${I.next}</button></div></div>`;
    return obShell(0, inner, dock);
  }

  function loaderHtml(title, steps) {
    return `<div class="loader"><div class="loader-box"><div class="orb"></div><h2>${esc(title)}</h2><p class="muted">Leva só alguns segundos.</p>
      <ul class="load-steps">${steps.map(s => `<li><span class="dot"></span>${esc(s)}</li>`).join('')}</ul></div></div>`;
  }
  function runSteps(ms) {
    const lis = [...document.querySelectorAll('.load-steps li')];
    return new Promise(res => {
      let k = 0;
      const tickStep = () => {
        lis.forEach((li, j) => li.className = j < k ? 'ok' : j === k ? 'run' : '');
        if (k++ >= lis.length) return setTimeout(res, 250);
        setTimeout(tickStep, ms);
      };
      tickStep();
    });
  }

  async function analyze() {
    const app = $('#app');
    app.innerHTML = obShell(1, loaderHtml('Analisando suas respostas', ['Encontrando a direção da loja', 'Escolhendo os 10 produtos', 'Montando seu plano de ação', 'Definindo a identidade visual']));
    const id = escolher(S.a);
    const [d] = await Promise.all([loadNicho(id), runSteps(650)]);
    S.nicho = id; S.storeName = S.storeName && NOMES[id]?.includes(S.storeName) ? S.storeName : d.tienda;
    S.reason = id === 'general' ? 'Você pediu uma marca com variedade: a coleção mistura categorias que se completam.' : `Combinando suas respostas, o nicho com mais afinidade é ${d.nicho.toLowerCase()}.`;
    save(); go('plano');
  }

  async function viewPlano() {
    const d = await loadNicho(S.nicho);
    const p = plano(S.a); const a = S.a; const pal = d.paleta;
    const nomes = NOMES[d.id] || [d.tienda];
    const contas = Object.keys(OPT.accounts).filter(k => k !== 'none');
    const inner = `
      <div class="hero-card">
        <p class="eyebrow">Seu plano está pronto</p>
        <h1 style="font-size:clamp(1.7rem,7vw,2.6rem)">Uma loja de ${esc(d.nicho.toLowerCase())} para a Espanha.</h1>
        <p class="muted">${esc(S.reason)} Seu orçamento, ritmo e prioridades usam as respostas do formulário.</p>
        <div class="store-pill"><span class="sw" style="background:${pal.background};color:${pal.accent}">${EMOJI[d.id] || '🛍️'}</span>
          <div><strong>${esc(d.tienda)}</strong><div class="muted" style="font-size:13px">${esc(d.paletaNombre)} · 10 produtos · 4 categorias</div>
          <div class="palette">${['background', 'surface', 'accent', 'text'].map(k => `<i style="background:${pal[k]}"></i>`).join('')}</div></div></div>
        <div class="chips"><span class="chip ok">🇪🇸 Espanha</span><span class="chip">Espanhol</span><span class="chip">Euro (€)</span><span class="chip">${a.brandGoal === 'brand' ? 'Construção de marca' : 'Foco em vendas'}</span></div>
      </div>

      <div class="panel" style="margin-top:14px">
        <p class="eyebrow">Dê um nome à sua loja</p>
        <p class="muted" style="font-size:14px">Escolha uma sugestão ou escreva o seu. Ele aparece na prévia e você aplica na Shopify em um clique.</p>
        <div class="names">${nomes.map(n => `<button type="button" class="${S.storeName === n ? 'on' : ''}" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>
        <input class="input" id="storeName" maxlength="40" value="${esc(S.storeName)}" aria-label="Nome da loja">
        <p class="muted" style="font-size:12.5px;margin:8px 0 0">Confira domínio e marca disponíveis antes de registrar.</p>
      </div>

      <div class="grid2" style="margin-top:14px">
        <div class="panel"><p class="eyebrow">Seu ritmo</p>
          <div class="stat"><strong>${p.min} min/dia</strong><span>${p.timeline.at(-1).e} dias para colocar no ar, no seu ritmo</span></div><div class="divider"></div>
          <ol class="timeline">${p.timeline.map(t => `<li><small>Dia ${t.s}${t.e > t.s ? `–${t.e}` : ''}</small><div><strong>${esc(t.t)}</strong></div><div class="muted" style="font-size:13.5px">${esc(t.g)}</div></li>`).join('')}</ol></div>
        <div>
          <div class="panel"><p class="eyebrow">Onde vamos focar</p><ul class="bullets">${p.sup.map(s => `<li>${I.check}<span>${esc(s)}</span></li>`).join('')}</ul></div>
          <div class="panel"><p class="eyebrow">Posicionamento</p><p style="font-size:14.5px">${esc(p.pos)}</p><p class="eyebrow" style="margin-top:14px">Primeira divulgação</p><p style="font-size:14.5px;margin:0">${esc(p.canal)} Comece pelo produto principal${p.launch > 1 ? ' e pelo primeiro complementar' : ''}.</p></div>
        </div>
      </div>

      <div class="grid2" style="margin-top:14px">
        <div class="panel"><p class="eyebrow">Orçamento inicial</p><div class="stat"><strong>${money(String(a.investment).replace(',', '.'), a.currency)}</strong><span>Meta de retorno: ${esc(OPT.returnGoal[a.returnGoal])}</span></div>
          <p class="muted" style="font-size:13px;margin:12px 0 0">Prazo de retorno é objetivo, não previsão. A margem depende do custo na Zendrop, frete, taxas, IVA e anúncios — você calcula isso na etapa de custos.</p></div>
        <div class="panel"><p class="eyebrow">Contas e recebimento</p>
          <div class="kv">${contas.map(k => `<div><span>${OPT.accounts[k]}</span><strong>${a.accounts.includes(k) ? '<span class="chip ok">Você já tem</span>' : '<span class="chip warn">Preparar</span>'}</strong></div>`).join('')}</div>
          <p class="muted" style="font-size:13px;margin:12px 0 0">${a.company === 'none' ? 'Antes de ativar o recebimento, confira a elegibilidade dos provedores para a sua situação.' : 'Confira país, dados da empresa e titularidade da conta antes de ativar o recebimento.'}</p></div>
      </div>`;
    const dock = `<div class="dock"><div class="row single"><button class="btn" data-act="toStructure">Ver meus 10 produtos ${I.next}</button></div></div>`;
    return obShell(1, inner, dock);
  }

  function prodCard(d, p, main) {
    return `<a class="prod ${main ? 'main' : ''}" href="#produto/${p.n}">
      <img src="img/${d.id}/${p.imagenes[0]}" alt="" loading="lazy">
      <div class="in">${main ? '<p class="eyebrow" style="margin-top:12px">Produto principal</p>' : ''}<h3>${esc(p.t)}</h3><p>${esc(main ? p.h : p.categoria)}</p>
      <div class="tags"><span class="chip">${esc(p.badge)}</span>${main ? `<span class="chip">${esc(p.categoria)}</span>` : ''}</div></div></a>`;
  }

  async function viewEstrutura() {
    const d = await loadNicho(S.nicho);
    const inner = `
      <p class="eyebrow">Sua seleção</p><h1>Dez produtos. Uma direção.</h1>
      <p class="muted">Escolhidos pela curadoria para o seu perfil, já com copy em espanhol, fotos e página pronta.</p>
      <div class="chips" style="margin:6px 0 18px">${d.categorias.map(c => `<span class="chip">${esc(c.nombre)} · ${c.produtos.length}</span>`).join('')}</div>
      <div class="prod-list">${d.productos.map((p, i) => prodCard(d, p, i === 0)).join('')}</div>
      <div class="panel" style="margin-top:16px"><h3>Pronto para gerar sua loja?</h3><p class="muted" style="margin:0">A geração monta a home, as 10 páginas de produto, os prompts e o tema .zip para a Shopify.</p></div>`;
    const dock = `<div class="dock"><div class="row"><a class="btn ghost" href="#plano" aria-label="Voltar ao plano">${I.back}</a><button class="btn" data-act="generate">Gerar minha loja ${I.spark}</button></div></div>`;
    return obShell(2, inner, dock);
  }

  async function generate() {
    $('#app').innerHTML = obShell(3, loaderHtml(`Montando a ${S.storeName}`, ['Aplicando a identidade visual', 'Compondo a página inicial', 'Criando as 10 páginas de produto', 'Escrevendo as copies em espanhol', 'Empacotando o tema para a Shopify']));
    await Promise.all([runSteps(600), loadNicho(S.nicho)]);
    S.generatedAt = new Date().toISOString(); save();
    toast('Sua loja está pronta! 🎉');
    go('loja');
  }

  // ----- área pós-geração -----
  const NAV = [['inicio', 'Início', I.home], ['loja', 'Minha loja', I.store], ['produtos', 'Produtos', I.box], ['prompts', 'Prompts', I.spark], ['guia', 'Guia', I.book]];
  function appShell(cur, title, inner) {
    const nav = NAV.map(([h, l, ico]) => `<a class="nav ${cur === h ? 'on' : ''}" href="#${h}">${ico}${l}</a>`).join('');
    return `<div class="app">
      <aside class="sidebar">${brand}${nav}<a class="nav ${cur === 'plano' ? 'on' : ''}" href="#plano">${I.map}Meu plano</a>
        <div class="side-foot"><button class="btn ghost sm" data-act="reset">${I.reset} Recomeçar demo</button><p style="margin-top:12px">Do primeiro passo à sua loja internacional.</p></div></aside>
      <div><header class="topbar">${brand}<strong class="desk-title" style="font-size:14px">${esc(title)}</strong>
        <div class="who"><span class="chip warn">Demo</span><span class="avatar">A</span></div></header>
        <main class="main view">${inner}</main></div>
      <nav class="tabbar" aria-label="Navegação">${NAV.map(([h, l, ico]) => `<a class="${cur === h || (cur === 'produto' && h === 'produtos') ? 'on' : ''}" href="#${h}">${ico}${l}</a>`).join('')}</nav>
    </div>`;
  }

  async function viewInicio() {
    const d = await loadNicho(S.nicho);
    const done = S.checklist.length;
    return appShell('inicio', 'Início', `
      <div class="welcome">
        <div class="hero-card">
          <p class="eyebrow">Olá, Aluno 👋</p><h1 style="font-size:clamp(1.7rem,7vw,2.6rem)">A ${esc(S.storeName)} está pronta.</h1>
          <p class="muted">Sua loja para a Espanha tem home, 10 páginas de produto com copy em espanhol, prompts de imagem e o tema para importar na Shopify.</p>
          <div class="chips" style="margin:14px 0 18px"><span class="chip ok">🇪🇸 Espanha</span><span class="chip">${esc(d.nicho)}</span><span class="chip">${done}/6 etapas do guia</span></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#loja">${I.store} Ver minha loja</a><a class="btn ghost" href="${d.tema}" download>${I.dl} Baixar tema</a></div>
        </div>
        <a class="shot" href="#loja" aria-label="Abrir prévia"><img src="img/${d.id}/h3.webp" alt=""></a>
      </div>
      <h2 style="margin-top:28px">Próximos passos</h2>
      <div class="quick">
        <a href="#produtos">${I.box}<strong>Meus produtos</strong><span>Copies prontas para colar</span></a>
        <a href="#guia">${I.book}<strong>Guia de instalação</strong><span>${done}/6 concluídas</span></a>
        <a href="#prompts">${I.spark}<strong>Prompts</strong><span>${d.prompts.length} prompts de imagem</span></a>
        <a href="#plano">${I.map}<strong>Meu plano</strong><span>Ritmo e prioridades</span></a>
      </div>`);
  }

  let device = window.innerWidth >= 960 ? 'desktop' : 'mobile';
  let page = 0;
  async function viewLoja() {
    const d = await loadNicho(S.nicho);
    const pages = [{ n: 0, l: 'Home', img: `img/${d.id}/h3.webp` }, ...d.productos.map(p => ({ n: p.n, l: `Prod. ${p.n}`, img: `img/${d.id}/${p.imagenes[0]}` }))];
    return appShell('loja', 'Minha loja', `
      <div class="page-head"><p class="eyebrow">Sua marca ganhou forma</p><h1>${esc(S.storeName)}</h1>
        <p>Navegue pela loja como um cliente espanhol veria. A prévia usa as mesmas seções do tema que você instala na Shopify.</p>
        <div class="actions"><a class="btn" href="${d.tema}" download>${I.dl} Baixar tema .zip</a><a class="btn ghost" href="${lojaUrl(d, page)}" target="_blank" rel="noopener">${I.ext} Abrir em nova aba</a></div></div>
      <div class="preview-bar"><div class="seg" role="group" aria-label="Dispositivo"><button class="${device === 'mobile' ? 'on' : ''}" data-device="mobile">${I.phone} Celular</button><button class="${device === 'desktop' ? 'on' : ''}" data-device="desktop">${I.desk} Computador</button></div>
        <button class="copy-btn" data-copylink="${esc(new URL(lojaUrl(d, page), location.href).href)}">${I.copy} Copiar link</button></div>
      <div class="device ${device}"><iframe id="preview" title="Prévia da loja" src="${lojaUrl(d, page, true)}" loading="lazy"></iframe></div>
      <div class="page-pick" aria-label="Páginas">${pages.map(p => `<button class="${p.n === page ? 'on' : ''}" data-page="${p.n}"><img src="${p.img}" alt=""><span>${p.l}</span></button>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin-top:14px">Preços, variantes e checkout vêm dos produtos reais depois da importação na Shopify.</p>`);
  }

  let catFilter = 'all';
  async function viewProdutos() {
    const d = await loadNicho(S.nicho);
    const list = d.productos.filter(p => catFilter === 'all' || p.categoria === catFilter);
    return appShell('produtos', 'Produtos', `
      <div class="page-head"><p class="eyebrow">Curadoria</p><h1>Seus 10 produtos</h1><p>Cada um com página própria, copy em espanhol e template <b>rian-01</b> a <b>rian-10</b>. Importe pela Zendrop e cole os textos.</p></div>
      <div class="cat-row"><button class="chip ${catFilter === 'all' ? 'on' : ''}" data-cat="all">Todos · 10</button>${d.categorias.map(c => `<button class="chip ${catFilter === c.nombre ? 'on' : ''}" data-cat="${esc(c.nombre)}">${esc(c.nombre)} · ${c.produtos.length}</button>`).join('')}</div>
      <div class="prod-list three">${list.map(p => prodCard(d, p, false).replace('<p>', `<p><b style="color:var(--accent-light)">rian-${String(p.n).padStart(2, '0')}</b> · `)).join('')}</div>`);
  }

  async function viewProduto(n) {
    const d = await loadNicho(S.nicho);
    const p = d.productos.find(x => x.n === n) || d.productos[0];
    for (const k in copyStore) delete copyStore[k];
    const desc = [p.h, '', p.s, '', ...p.b.map(b => `✓ ${b}`), '', ...p.ben.map(([, t, x]) => `${t}\n${x}`), '', 'Especificaciones', ...p.spec.map(s => `• ${s}`)].join('\n');
    const seoT = `${p.t} | ${S.storeName}`.slice(0, 70);
    const seoD = p.s.slice(0, 160);
    const prev = d.productos.find(x => x.n === p.n - 1), next = d.productos.find(x => x.n === p.n + 1);
    return appShell('produto', p.t, `
      <a href="#produtos" class="btn ghost sm" style="margin-bottom:14px">${I.back} Produtos</a>
      <div class="pd-gallery">${p.imagenes.map(f => `<img src="img/${d.id}/${f}" alt="" loading="lazy">`).join('')}</div>
      <div class="page-head" style="margin-top:18px"><div class="chips" style="margin-bottom:10px"><span class="chip ok">Template rian-${String(p.n).padStart(2, '0')}</span><span class="chip">${esc(p.categoria)}</span><span class="chip">${esc(p.badge)}</span></div>
        <h1 style="font-size:clamp(1.6rem,6.5vw,2.4rem)">${esc(p.t)}</h1><p>${esc(p.h)}</p>
        <div class="actions"><a class="btn" href="${lojaUrl(d, p.n)}" target="_blank" rel="noopener">${I.ext} Ver página</a><button class="btn ghost" data-act="previewProduct" data-n="${p.n}">${I.store} Ver na prévia</button></div></div>
      <div class="grid2">
        <div>
          <h2>Textos para a Shopify</h2>
          ${block('Título do produto', p.t)}
          ${block('Descrição (cole no editor da Shopify)', desc)}
          ${block('SEO · título', seoT)}${block('SEO · descrição', seoD)}
        </div>
        <div>
          <h2>Importar pela Zendrop</h2>
          <div class="panel"><ol style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:14px">
            <li>Na Zendrop, busque pelo nome original:</li></ol>
            ${block('Nome original do fornecedor', p.nombreOriginal, '')}
            <ol start="2" style="margin:12px 0 0;padding-left:18px;display:grid;gap:8px;font-size:14px">
            <li>Importe para a Shopify e confira variantes, custo e prazo de envio para a Espanha.</li>
            <li>Troque o título e a descrição pelos textos em espanhol ao lado.</li>
            <li>Em <b>Modelo de tema</b>, escolha <b>rian-${String(p.n).padStart(2, '0')}</b> e salve.</li></ol>
            <a class="btn soft sm" style="margin-top:14px" href="https://app.zendrop.com/" target="_blank" rel="noopener">${I.ext} Abrir Zendrop</a></div>
          <div class="panel"><p class="eyebrow">Página do produto inclui</p>
            <ul class="bullets">${['Galeria com ' + p.imagenes.length + ' fotos', '3 benefícios rápidos + selo “' + p.badge + '”', '4 contextos de uso', '3 blocos de benefício', 'Como usar, especificações e 3 perguntas frequentes', 'Barra de compra fixa no celular'].map(x => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:22px">
        ${prev ? `<a class="btn ghost sm" href="#produto/${prev.n}">${I.back} ${esc(prev.t.slice(0, 22))}…</a>` : '<span></span>'}
        ${next ? `<a class="btn ghost sm" href="#produto/${next.n}">${esc(next.t.slice(0, 22))}… ${I.next}</a>` : ''}</div>`);
  }

  let promptQ = '', promptG = 'all';
  async function viewPrompts() {
    const d = await loadNicho(S.nicho);
    const groups = ['Home e identidade', ...d.productos.map(p => p.t)];
    return appShell('prompts', 'Prompts', `
      <div class="page-head"><p class="eyebrow">Direção criativa</p><h1>Prompts de imagem</h1>
        <p>As imagens da demonstração já estão prontas. Use os prompts para criar versões próprias: anexe a foto real do fornecedor na sua IA de imagem e cole o prompt. O número corresponde ao espaço no tema.</p></div>
      <div class="search"><span>${I.search}</span><input class="input" id="pq" type="search" placeholder="Buscar por nome ou número" value="${esc(promptQ)}" aria-label="Buscar prompts"></div>
      <div class="cat-row" style="margin-top:12px"><button class="chip ${promptG === 'all' ? 'on' : ''}" data-pg="all">Todos</button>${groups.map(g => `<button class="chip ${promptG === g ? 'on' : ''}" data-pg="${esc(g)}">${esc(g.length > 28 ? g.slice(0, 26) + '…' : g)}</button>`).join('')}</div>
      <div id="plist"></div>`);
  }
  function renderPrompts(d) {
    const q = promptQ.trim().toLowerCase();
    const list = d.prompts.filter(p => (promptG === 'all' || p.group === promptG) && (!q || String(p.number) === q || `${p.title} ${p.group} ${p.text}`.toLowerCase().includes(q)));
    for (const k in copyStore) delete copyStore[k];
    $('#plist').innerHTML = list.length ? list.slice(0, 80).map(p => { const k = 'p' + p.number; copyStore[k] = p.text; return `
      <article class="prompt"><div class="top"><span class="num">${p.number}</span><h3>${esc(p.title)}<small>${esc(p.group)} · ${p.width}×${p.height}</small></h3>${copyBtn(k)}</div>
      <p>${esc(p.text)}</p><button class="more" data-more>Ver completo</button></article>`; }).join('') + (list.length > 80 ? `<p class="muted" style="margin-top:12px">Mostrando 80 de ${list.length}. Refine a busca.</p>` : '')
      : '<div class="panel muted">Nenhum prompt encontrado. Tente outro nome ou número.</div>';
  }

  async function viewGuia() {
    const d = await loadNicho(S.nicho);
    const pct = Math.round(S.checklist.length / 6 * 100);
    const steps = [
      ['Crie a loja e configure a Espanha', `<ol><li>Crie sua conta na Shopify.</li><li>Em <b>Configurações → Mercados</b>, adicione <b>Espanha</b> e defina o <b>euro (€)</b>.</li><li>Em <b>Idiomas</b>, publique o <b>espanhol</b> como idioma padrão.</li><li>Em <b>Impostos</b>, revise o IVA e mostre os preços com impostos incluídos.</li></ol>`],
      ['Importe e publique o tema', `<ol><li>Baixe o tema abaixo.</li><li>Na Shopify, abra <b>Loja virtual → Temas → Adicionar tema → Fazer upload</b>.</li><li>Publique o tema. Os templates rian-01 a rian-10 passam a aparecer nos produtos.</li></ol><a class="btn sm" href="${d.tema}" download>${I.dl} Baixar tema .zip</a>`],
      ['Importe os 10 produtos pela Zendrop', `<ol><li>Conecte a Zendrop à sua Shopify.</li><li>Busque cada produto pelo <b>nome original</b> (está em Produtos).</li><li>Confira variantes, custo, prazo e frete para a Espanha antes de importar.</li><li>Cole o título e a descrição em espanhol.</li></ol><a class="btn sm soft" href="#produtos">${I.box} Abrir meus produtos</a>`],
      ['Atribua o template de cada produto', `<ol><li>Abra cada produto na Shopify.</li><li>Em <b>Modelo de tema</b>, escolha o template indicado (rian-01 a rian-10).</li><li>Salve.</li></ol>`],
      ['Vincule produtos e coleções à home', `<ol><li>No editor do tema, abra a seção <b>Rian home</b>.</li><li>Em cada bloco <b>Produto da curadoria</b>, selecione o produto importado.</li><li>Crie as 4 coleções abaixo e vincule em Coleção 1 a 4:</li></ol><div class="chips">${d.categorias.map((c, i) => `<span class="chip">${i + 1}. ${esc(c.nombre)}</span>`).join('')}</div>`],
      ['Revise a operação e teste', `<ol><li>Defina preços em euro com margem sobre custo + frete + taxas.</li><li>Configure pagamentos, frete para a Espanha, domínio e e-mail de atendimento.</li><li>Crie as políticas (envíos, devoluciones, privacidad) em espanhol.</li><li>Faça um pedido de teste no celular antes de divulgar.</li></ol>`],
    ];
    return appShell('guia', 'Guia', `
      <div class="page-head"><p class="eyebrow">Da estrutura à Shopify</p><h1>Um passo de cada vez.</h1><p>Marque cada etapa ao concluir. O progresso fica salvo neste navegador.</p></div>
      <div class="panel guide-progress"><div class="ring" style="--p:${pct}"><span>${pct}%</span></div><div><strong>${S.checklist.length} de 6 etapas concluídas</strong><p class="muted" style="margin:0;font-size:13px">O app não acessa sua Shopify; o checklist registra a sua confirmação.</p></div></div>
      <div style="margin-top:14px">${steps.map(([t, b], i) => `
        <details class="gstep ${S.checklist.includes(i) ? 'done' : ''}" ${!S.checklist.includes(i) && i === steps.findIndex((_, k) => !S.checklist.includes(k)) ? 'open' : ''}>
          <summary><span class="n">${S.checklist.includes(i) ? '✓' : i + 1}</span><strong>${t}</strong>${I.next}</summary>
          <div class="body">${b}<div style="margin-top:12px"><button class="btn sm ${S.checklist.includes(i) ? 'ghost' : ''}" data-done="${i}">${S.checklist.includes(i) ? 'Desmarcar' : `${I.check} Marcar como concluída`}</button></div></div>
        </details>`).join('')}</div>`);
  }

  // ---------- roteador ----------
  async function render() {
    const app = $('#app');
    const h = location.hash.slice(1) || '';
    const [route, arg] = h.split('/');
    if (!S.nicho && route !== 'formulario') return go('formulario');
    if (S.nicho && !S.generatedAt && !['formulario', 'plano', 'estrutura'].includes(route)) return go(S.planOk ? 'estrutura' : 'plano');
    if (S.generatedAt && ['formulario', 'estrutura', ''].includes(route)) return go('inicio');
    try {
      let html;
      if (route === 'formulario') html = viewForm();
      else if (route === 'plano') html = await viewPlano();
      else if (route === 'estrutura') html = await viewEstrutura();
      else if (route === 'loja') html = await viewLoja();
      else if (route === 'produtos') html = await viewProdutos();
      else if (route === 'produto') html = await viewProduto(Number(arg));
      else if (route === 'prompts') html = await viewPrompts();
      else if (route === 'guia') html = await viewGuia();
      else html = await viewInicio();
      // se o plano foi aberto depois de gerar, mostra no shell do app
      if (route === 'plano' && S.generatedAt) html = appShell('plano', 'Meu plano', html.replace(/^[\s\S]*?<div class="form-wrap view">/, '').replace(/<div class="dock">[\s\S]*$/, ''));
      app.innerHTML = html;
      document.title = `${{ formulario: 'Formulário', plano: 'Meu plano', estrutura: 'Estrutura', loja: 'Minha loja', produtos: 'Produtos', produto: 'Produto', prompts: 'Prompts', guia: 'Guia' }[route] || 'Início'} · Rian Medeiros`;
      if (route === 'prompts') renderPrompts(await loadNicho(S.nicho));
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {
      app.innerHTML = `<div class="loader"><div class="loader-box"><h2>Algo não carregou</h2><p class="muted">${esc(e.message)}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div></div>`;
    }
  }

  // ---------- eventos ----------
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, a');
    if (!t) return;
    const a = S.a;
    if (t.dataset.multi) {
      if (t.classList.contains('off')) return toast('Este nicho chega em breve.');
      const k = t.dataset.multi, id = t.dataset.id; let arr = a[k];
      const exclusive = ['none'];
      if (arr.includes(id)) arr = arr.filter(x => x !== id);
      else if (exclusive.includes(id)) arr = [id];
      else { arr = arr.filter(x => !exclusive.includes(x)); if (k === 'interests' && arr.length >= 3) return toast('Escolha até três assuntos.'); arr.push(id); }
      a[k] = arr;
      if (k === 'interests' && !arr.includes(a.favorite)) a.favorite = '';
      save(); const y = scrollY; $('#app').innerHTML = viewForm(); scrollTo(0, y); return;
    }
    if (t.dataset.single) { a[t.dataset.single] = t.dataset.id; save(); const y = scrollY; $('#app').innerHTML = viewForm(); scrollTo(0, y); return; }
    if (t.dataset.copy) return copyText(copyStore[t.dataset.copy], t);
    if (t.dataset.copylink) return copyText(t.dataset.copylink, t);
    if (t.dataset.name) { S.storeName = t.dataset.name; save(); $('#storeName').value = S.storeName; document.querySelectorAll('[data-name]').forEach(b => b.classList.toggle('on', b === t)); return; }
    if (t.dataset.device) { device = t.dataset.device; render(); return; }
    if (t.dataset.page !== undefined) { page = Number(t.dataset.page); render(); return; }
    if (t.dataset.cat) { catFilter = t.dataset.cat; render(); return; }
    if (t.dataset.pg) { promptG = t.dataset.pg; document.querySelectorAll('[data-pg]').forEach(b => b.classList.toggle('on', b === t)); renderPrompts(await loadNicho(S.nicho)); return; }
    if (t.hasAttribute('data-more')) { const c = t.closest('.prompt'); c.classList.toggle('open'); t.textContent = c.classList.contains('open') ? 'Ver menos' : 'Ver completo'; return; }
    if (t.dataset.done !== undefined) { const i = Number(t.dataset.done); S.checklist = S.checklist.includes(i) ? S.checklist.filter(x => x !== i) : [...S.checklist, i]; save(); if (S.checklist.length === 6) toast('Guia concluído! Hora de divulgar 🚀'); render(); return; }
    switch (t.dataset.act) {
      case 'next': { const err = validar(S.step); if (err) return toast(err, 'error'); S.step++; save(); render(); break; }
      case 'prev': S.step = Math.max(0, S.step - 1); save(); render(); break;
      case 'analyze': { const err = validar(4) || validar(0) || validar(2) || validar(3); if (err) return toast(err, 'error'); analyze(); break; }
      case 'toStructure': { const v = $('#storeName').value.trim(); if (v.length < 2) return toast('Dê um nome à sua loja.', 'error'); S.storeName = v; S.planOk = true; save(); go('estrutura'); break; }
      case 'generate': generate(); break;
      case 'previewProduct': page = Number(t.dataset.n); go('loja'); break;
      case 'reset': if (confirmReset()) { S = blank(); save(); go('formulario'); } break;
    }
  });
  function confirmReset() {
    // sem window.confirm (bloqueia iframes/automação): segundo toque confirma
    const b = document.querySelector('[data-act="reset"]:focus') || document.activeElement;
    if (b?.dataset.armed) return true;
    document.querySelectorAll('[data-act="reset"]').forEach(x => { x.dataset.armed = '1'; setTimeout(() => delete x.dataset.armed, 3000); });
    toast('Toque de novo para recomeçar a demonstração.');
    return false;
  }
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.text) { S.a[t.dataset.text] = t.value; save(); }
    if (t.id === 'storeName') { S.storeName = t.value; save(); document.querySelectorAll('[data-name]').forEach(b => b.classList.toggle('on', b.dataset.name === t.value)); }
    if (t.id === 'pq') { promptQ = t.value; loadNicho(S.nicho).then(renderPrompts); }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.check) { S.a[e.target.dataset.check] = e.target.checked; save(); }
    if (e.target.dataset.text) { S.a[e.target.dataset.text] = e.target.value; save(); }
  });
  window.addEventListener('hashchange', render);

  fetch('data/nichos.json').then(r => r.json()).then(n => { NICHOS = n; render(); }).catch(() => { $('#app').innerHTML = '<div class="loader"><p>Não foi possível carregar. Abra o site por um servidor (Vercel ou <code>npx serve</code>).</p></div>'; });
})();
