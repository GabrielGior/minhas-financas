// Minhas Finanças — Modo divertido, configurações, diagnóstico, sincronização, primeiro uso e backup.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, config.js, inicio.js.
// ---------- Modo divertido (db.prefs.fun) ----------
// Porquinho no Resumo, conquistas, confete e recados ao salvar. Nada disso muda os dados: tudo é calculado na hora.
// A sequência de dias fica só neste aparelho (FUN_KEY).
const FUN_KEY = 'financas-fun';
const funState = {last:'', streak:0, tap:0};
try { Object.assign(funState, JSON.parse(localStorage.getItem(FUN_KEY))); } catch(e){}
function funVisit(){
  const dia = d => d.toLocaleDateString('sv'), hoje = dia(now);
  if (funState.last === hoje) return;
  funState.streak = funState.last === dia(new Date(now.getTime() - 864e5)) ? funState.streak + 1 : 1;
  funState.best = Math.max(funState.best || 0, funState.streak); // a conquista da sequência não se perde quando ela quebra
  funState.last = hoje;
  try { localStorage.setItem(FUN_KEY, JSON.stringify(funState)); } catch(e){}
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const FUN_LINES = {
  feliz:['Sobrando {v} este mês, {nome}. Tô até mais gordinho!', 'Mês no azul! Já posso sonhar com milho premium?', 'Olha esse saldo de {v}, {nome}. Orgulho define.', 'Assim eu encho rapidinho. Continua, {nome}!'],
  ok:['Tudo sob controle por aqui, {nome}. Bora registrar os gastos?', 'Equilibrado, como todo porquinho deveria ser.', 'Nem aperto, nem folga. Seguimos de olho.', 'Me conta, {nome}: o que você gastou hoje?'],
  triste:['Faltam {v} para fechar o mês, {nome}. Respira, a gente ajeita.', 'Tô sentindo um vento aqui dentro… saiu mais do que entrou.', 'Mês no vermelho em {v}. Bora rever os gastos, {nome}?', 'Ai, minhas moedinhas! Segura o cartão um pouquinho.']
};
const FUN_SAVED = {
  expenses:['Anotado! A carteira sentiu, mas sobreviveu.', 'Gasto registrado. O porquinho viu tudo.', 'Mais um pra conta. Literalmente.', 'Registrado! Saber para onde vai o dinheiro já é meio caminho.'],
  installments:['Parcelado registrado. O você do futuro mandou um abraço meio torto.', 'Anotado! Parcela é gasto de pijama: discreto, mas tá lá.'],
  incomes:['Dinheiro na conta, {nome}! O porquinho fez a dancinha.', 'Caiu! Hora de fingir costume.', 'Ganho registrado. Continue assim, {nome}!'],
  investments:['Investimento registrado. O seu eu do futuro agradece.', 'Plantou hoje, colhe depois.'],
  goals:['Meta criada! Sonho com prazo vira plano.'],
  goalAdd:['Mais perto da meta! O porquinho aprova.', 'Guardado! Cada moedinha conta.'],
  invAdd:['Aporte feito. Juros compostos, podem trabalhar!', 'Aporte registrado. Devagar e sempre.']
};
const FUN_PAID = ['Conta paga! Menos um boleto no mundo.', 'Pago! Boleto derrotado.', 'Em dia! O porquinho respira aliviado.'];
const FUN_LEVELS = [[0, 'Cofrinho vazio'], [5, 'Aprendiz da poupança'], [15, 'Caçador de boletos'], [30, 'Mestre do orçamento'], [50, 'Guardião do cofrinho'], [75, 'Lenda das finanças'], [100, 'Mito do porquinho']];
// Mensagens com o nome da pessoa: {nome} vira o nome; sem nome cadastrado, some junto com a vírgula.
const comNome = s => myName() ? s.replace(/\{nome\}/g, myName()) : s.replace(/,? ?\{nome\}/g, '').replace(/^\s*[a-zà-ú]/, c => c.toUpperCase());
// Texto do aviso depois de salvar um formulário (e confete nas boas notícias).
function savedMsg(col, isNew){
  const a = FUN_SAVED[col];
  if (!db.prefs.fun || !a || (!isNew && col !== 'goalAdd' && col !== 'invAdd')) return 'Salvo';
  if (col !== 'expenses' && col !== 'installments') confetti();
  return comNome(pick(a));
}
// Humor do porquinho pelo saldo do mês atual.
function funMood(){
  const tin = totalIn(curYM), tout = totalOut(curYM), net = tin - tout;
  return !tin && !tout ? 'ok' : net < 0 ? 'triste' : net >= tin * .1 ? 'feliz' : 'ok';
}
// Desafio do mês: gastar menos em avulsos do que no mês anterior, na categoria em que mais se gastou (mínimo de R$ 50).
// Devolve {cat, target, used, ok} ou null se não houve gasto avulso no mês anterior.
function challenge(m){
  const by = ym => { const g = {}; expensesOf(ym).forEach(x => { if (x.kind === 'expense' && !x.fixed) g[x.cat] = (g[x.cat] || 0) + x.value; }); return g; };
  const prev = by(addMonths(m, -1)), top = Object.entries(prev).filter(([, v]) => v >= 50).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const used = by(m)[top[0]] || 0;
  return {cat:top[0], target:top[1], used, ok:used < top[1]};
}
// Desafios cumpridos nos últimos 6 meses já encerrados.
const challengeWins = () => [...Array(6)].filter((_, i) => { const c = challenge(addMonths(curYM, -1 - i)); return c && c.ok; }).length;
function challengeHtml(){
  const c = challenge(curYM);
  if (!c) return '';
  const nome = (CAT_GASTO[c.cat] || CAT_GASTO.outros)[1], pct = Math.min(100, c.used / c.target * 100);
  return `<div class="card"><b>${I('target')} Desafio de ${monthName(curYM).split(' ')[0]}</b>
    <div class="hint" style="margin-top:4px">Gaste menos de ${fmt(c.target)} em ${nome} (foi o gasto do mês passado).</div>
    <div class="bar"><i style="width:${pct}%;background:${c.ok ? 'var(--in)' : 'var(--out)'}"></i></div>
    <div class="hint" style="margin-top:0">${c.ok ? `Até agora: ${fmt(c.used)}. Ainda cabem ${fmt(c.target - c.used)}.` : `Passou em ${fmt(c.used - c.target)}. Mês que vem tem outro!`}</div></div>`;
}
// Conquistas em níveis. Cada família: [ícone, nome, como ganhar (n => texto), valor atual, metas]; cada meta é uma
// conquista ("Anotador I", "Anotador II"…). Tudo é calculado dos dados, nada fica guardado (só quais já foram avisadas).
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const plural = (n, um, varios) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;
const reais = n => 'R$ ' + n.toLocaleString('pt-BR');
function funFamilies(){
  const ultimos = n => [...Array(n)].map((_, i) => addMonths(curYM, -i));
  const azul = m => totalIn(m) > 0 && totalIn(m) >= totalOut(m), ano2 = ultimos(24);
  let seq = 0, melhor = 0;
  for (const m of [...ano2].reverse()){ seq = azul(m) ? seq + 1 : 0; melhor = Math.max(melhor, seq); }
  const avulsosNoMes = Math.max(0, ...ultimos(12).map(m => db.expenses.filter(x => !x.fixed && x.start === m).length));
  const emDia = db.expenses.some(x => x.fixed && x.due) && upcomingBills().every(b => b.diff >= 0);
  return [
    ['receipt', 'Anotador', n => `lance ${plural(n, 'gasto', 'gastos')}`, db.expenses.length, [1, 5, 10, 25, 50, 100, 250, 500, 1000]],
    ['income', 'Ganha-pão', n => `lance ${plural(n, 'ganho', 'ganhos')}`, db.incomes.length, [1, 5, 10, 25, 50, 100]],
    ['gift', 'Renda extra', n => `lance ${plural(n, 'ganho avulso', 'ganhos avulsos')}`, db.incomes.filter(x => !x.fixed).length, [1, 5, 10]],
    ['card', 'Parcelador', n => `cadastre ${plural(n, 'compra parcelada', 'compras parceladas')}`, db.installments.length, [1, 3, 5, 10]],
    ['key', 'Livre de parcelas', n => `quite ${plural(n, 'compra parcelada', 'compras parceladas')}`, db.installments.filter(p => p.paid >= p.n).length, [1, 3, 5, 10]],
    ['leaf', 'Investidor', n => `cadastre ${plural(n, 'investimento', 'investimentos')}`, db.investments.length, [1, 3, 5, 10]],
    ['trend', 'Patrimônio', n => `tenha ${reais(n)} investidos`, sum(db.investments, x => x.value), [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]],
    ['target', 'Sonhador', n => `crie ${plural(n, 'meta', 'metas')}`, db.goals.length, [1, 3, 5]],
    ['diamond', 'Meta batida', n => `alcance ${plural(n, 'meta', 'metas')}`, db.goals.filter(g => g.saved >= g.target).length, [1, 3, 5, 10]],
    ['smile', 'Mês no azul', n => `feche ${plural(n, 'mês', 'meses')} no azul (nos últimos 2 anos)`, ano2.filter(azul).length, [1, 3, 6, 12, 24]],
    ['trophy', 'Sequência azul', n => `fique ${n} meses seguidos no azul`, melhor, [2, 3, 6, 12]],
    ['flame', 'Fogo no cofrinho', n => `abra o app ${n} dias seguidos`, Math.max(funState.best || 0, funState.streak), [3, 7, 15, 30, 60, 100, 365]],
    ['star', 'Desafiante', n => `cumpra ${plural(n, 'desafio do mês', 'desafios do mês')} (nos últimos 6 meses)`, challengeWins(), [1, 2, 3, 6]],
    ['camera', 'Organizado', n => `anexe ${plural(n, 'comprovante', 'comprovantes')}`, db.expenses.filter(x => x.photo).length, [1, 5, 10, 25, 50]],
    ['tag', 'Etiquetador', n => `use ${plural(n, 'etiqueta diferente', 'etiquetas diferentes')}`, new Set(db.expenses.flatMap(tagsOf)).size, [1, 5, 10]],
    ['box', 'Variado', n => `lance gastos em ${n} categorias diferentes`, new Set(db.expenses.map(x => x.cat)).size, [5, 10, 15, 20]],
    ['sliders', 'Planejador', n => `defina orçamento para ${plural(n, 'categoria', 'categorias')}`, Object.values(db.budgets).filter(v => v > 0).length, [1, 3, 5, 10]],
    ['bank', 'Banqueiro', n => `cadastre ${plural(n, 'conta bancária', 'contas bancárias')}`, db.accounts.length, [1, 2, 3, 5]],
    ['exchange', 'Transferidor', n => `registre ${plural(n, 'transferência', 'transferências')}`, db.transfers.length, [1, 5, 10]],
    ['people', 'Rachador', n => `divida ${plural(n, 'gasto', 'gastos')} com alguém`, db.expenses.filter(x => x.who).length, [1, 5, 10, 25]],
    ['calendar', 'Assinante consciente', n => `cadastre ${plural(n, 'assinatura', 'assinaturas')}`, db.expenses.filter(isSub).length, [1, 3, 5]],
    ['coins', 'Sobrou!', n => `termine um mês com ${reais(n)} sobrando (no último ano)`, Math.max(0, ...ultimos(12).map(m => totalIn(m) - totalOut(m))), [100, 500, 1000, 2500, 5000, 10000]],
    ['book', 'Constância', n => `tenha lançamentos em ${plural(n, 'mês', 'meses')}`, new Set([...db.expenses, ...db.incomes].map(x => x.start)).size, [1, 3, 6, 12, 24, 36]],
    ['search', 'Detalhista', n => `lance ${n} gastos avulsos num mesmo mês`, avulsosNoMes, [10, 30, 60]],
    ['checked', 'Em dia', () => 'tenha contas com vencimento e nenhuma atrasada', emDia ? 1 : 0, [1]],
    ['heart', 'Em dupla', () => 'use a conta compartilhada', sync.shared ? 1 : 0, [1]]];
}
// Lista plana: [ícone, nome, como ganhar, já ganhou, família, nível].
function funBadgeList(){
  return funFamilies().flatMap(([ic, nome, como, v, metas], f) => metas.map((n, i) => [ic, metas.length > 1 ? `${nome} ${ROMANOS[i]}` : nome, como(n), v >= n, f, i]));
}
// Avisa (uma vez) cada conquista nova. Na primeira vez que roda, só anota as que já existiam.
function funCheck(){
  if (!db.prefs.fun) return;
  const ganhas = funBadgeList().filter(b => b[3]).map(b => b[1]);
  if (!funState.got){ funState.got = ganhas; }
  else {
    const novas = ganhas.filter(n => !funState.got.includes(n));
    if (!novas.length) return;
    funState.got = [...funState.got, ...novas];
    confetti();
    toast(novas.length > 1 ? `${novas.length} conquistas desbloqueadas: ${novas.join(', ')}!` : comNome(`Conquista desbloqueada, {nome}: ${novas[0]}!`));
  }
  try { localStorage.setItem(FUN_KEY, JSON.stringify(funState)); } catch(e){}
}
// Mascote de cada tema especial: [claro, médio, forte, fenda, bochecha, olhos, boca] e o acessório desenhado por cima.
// Sem tema especial, o porquinho rosa clássico (não segue a cor do app, para continuar parecendo um porco).
const MASCOTES = {
  '':['#ffc6d9', '#f58fb3', '#ec7aa3', '#c2527c', '#ff5f95', '#4a2338', '#b8456f', ''],
  hacker:['#4ade80', '#16a34a', '#15803d', '#052e16', '#bbf7d0', '#03120a', '#052e16', // óculos escuros
    '<rect x="33" y="48" width="23" height="13" rx="3.5" fill="#03120a"/><rect x="64" y="48" width="23" height="13" rx="3.5" fill="#03120a"/><path d="M56 53h8" stroke="#03120a" stroke-width="3"/><path d="M37 52h6M68 52h6" stroke="#4ade80" stroke-width="1.6" stroke-linecap="round"/>'],
  boneca:['#ffd1e8', '#f472b6', '#ec4899', '#be185d', '#ff5f95', '#500724', '#be185d', // laço e cílios
    '<path d="M60 27 43 17v20zM60 27l17-10v20z" fill="#c026d3"/><circle cx="60" cy="27" r="5" fill="#a21caf"/><path d="M36 50l-4-3M40 48l-2-4M84 50l4-3M80 48l2-4" stroke="#500724" stroke-width="2" stroke-linecap="round"/>'],
  corrida:['#fca5a5', '#ef4444', '#dc2626', '#7f1d1d', '#fecaca', '#1f2937', '#7f1d1d', // capacete com faixa
    '<path d="M23 47a38 30 0 0 1 74 0z" fill="#1f2937"/><path d="M56 17.500h8V47h-8z" fill="#fff"/><path d="M23 47h74" stroke="#f59e0b" stroke-width="3"/>'],
  neon:['#c4b5fd', '#8b5cf6', '#7c3aed', '#4c1d95', '#22d3ee', '#1e1b4b', '#f472b6', // fones de ouvido
    '<path d="M24 60a36 38 0 0 1 72 0" stroke="#22d3ee" stroke-width="4" fill="none"/><rect x="17" y="55" width="11" height="20" rx="5.500" fill="#22d3ee"/><rect x="92" y="55" width="11" height="20" rx="5.500" fill="#22d3ee"/>'],
  papel:['#f5deb3', '#d6a77a', '#b98a5e', '#7c4a2d', '#e9a68a', '#3b2a1a', '#7c4a2d', // óculos redondos
    '<circle cx="43" cy="55" r="9.500" fill="none" stroke="#3b2a1a" stroke-width="2.400"/><circle cx="77" cy="55" r="9.500" fill="none" stroke="#3b2a1a" stroke-width="2.400"/><path d="M52.500 55h15" stroke="#3b2a1a" stroke-width="2.400"/>'],
  praia:['#ffd9a8', '#fb923c', '#f97316', '#c2410c', '#fdba74', '#431407', '#c2410c', // óculos de sol
    '<rect x="33" y="48" width="23" height="13" rx="6" fill="#0e7490"/><rect x="64" y="48" width="23" height="13" rx="6" fill="#0e7490"/><path d="M56 53h8" stroke="#0e7490" stroke-width="3"/>'],
  noite:['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a', '#facc15', '#0a1230', '#1e3a8a', // estrela na testa e redemoinho
    '<path d="M60 36l2.600 5.300 5.900.900-4.300 4.100 1 5.800L60 49.300l-5.200 2.800 1-5.800-4.300-4.100 5.900-.900z" fill="#facc15"/><path d="M22 30c4-6 12-6 14-1s-4 8-7 5" stroke="#facc15" stroke-width="2.200" fill="none" stroke-linecap="round"/>']
};
// Mascote visto de frente; mood: 'feliz', 'ok' ou 'triste'.
function pigSvg(mood){
  const [claro, medio, forte, fenda, bochecha, escuro, boca, acessorio] = MASCOTES[db.prefs.skin] || MASCOTES[''];
  const triste = mood === 'triste', feliz = mood === 'feliz';
  const olho = x => `<circle cx="${x}" cy="55" r="5" fill="${escuro}"/><circle cx="${x + 1.8}" cy="53.2" r="1.7" fill="#fff"/>`;
  const olhos = feliz ? `<path d="M38 57q5-7 10 0M72 57q5-7 10 0" stroke="${escuro}" stroke-width="3" fill="none" stroke-linecap="round"/>` : olho(43) + olho(77);
  const extra = triste ? `<path d="M36 48l10-4M84 48l-10-4" stroke="${escuro}" stroke-width="2.6" stroke-linecap="round"/><path d="M89 58c2.2 3.2 3.2 5.2 3.2 6.8a3.2 3.2 0 0 1-6.400 0c0-1.600 1-3.600 3.200-6.800z" fill="#7dd3fc"/>` : '';
  return `<svg class="pig ${mood}" viewBox="0 0 120 110" width="104" height="95" aria-hidden="true">
    <defs><linearGradient id="pigG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${medio}"/></linearGradient></defs>
    <ellipse cx="60" cy="104" rx="30" ry="4" fill="#000" opacity=".16"/>
    <g class="moeda"><circle cx="60" cy="10" r="7.5" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><path d="M60 6.5v7" stroke="#b45309" stroke-width="2" stroke-linecap="round"/></g>
    <g class="corpo">
    <path d="M95 70c8-2 10 5 5 7s-2 7 3 6" stroke="${medio}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <rect x="38" y="88" width="14" height="14" rx="6" fill="${forte}"/><rect x="68" y="88" width="14" height="14" rx="6" fill="${forte}"/>
    <path d="M30 40c-6-12-3-22 4-24 8 2 14 8 16 16zM90 40c6-12 3-22-4-24-8 2-14 8-16 16z" fill="${medio}"/>
    <path d="M34 36c-3-8-2-14 2-16 5 2 8 6 10 11zM86 36c3-8 2-14-2-16-5 2-8 6-10 11z" fill="${forte}"/>
    <ellipse cx="60" cy="62" rx="38" ry="34" fill="url(#pigG)"/>
    <rect x="50" y="30.5" width="20" height="4" rx="2" fill="${fenda}"/>
    <ellipse cx="41" cy="43" rx="9" ry="4.5" fill="#fff" opacity=".4" transform="rotate(-28 41 43)"/>
    ${olhos}${extra}
    <circle cx="32" cy="69" r="6" fill="${bochecha}" opacity=".4"/><circle cx="88" cy="69" r="6" fill="${bochecha}" opacity=".4"/>
    <ellipse cx="60" cy="69" rx="15" ry="11" fill="${forte}"/>
    <ellipse cx="54.5" cy="69" rx="2.6" ry="3.6" fill="${boca}"/><ellipse cx="65.5" cy="69" rx="2.6" ry="3.6" fill="${boca}"/>
    <path d="${feliz ? 'M52 84q8 7 16 0' : triste ? 'M54 88q6-5 12 0' : 'M54 85q6 3 12 0'}" stroke="${boca}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${acessorio}</g></svg>`;
}
// Bloco do Resumo: o porquinho reage ao saldo do mês atual. Tocar nele troca a fala.
function funMascot(){
  const net = totalIn(curYM) - totalOut(curYM), mood = funMood();
  const falas = FUN_LINES[mood], ganhas = funBadgeList().filter(b => b[3]).length, nivel = [...FUN_LEVELS].reverse().find(l => ganhas >= l[0])[1];
  return `<div class="card fun" onclick="funPoke()"><div class="pigBox">${pigSvg(mood)}</div>
    <div class="mid"><div class="bubble">${esc(comNome(falas[(now.getDate() + funState.tap) % falas.length])).replace('{v}', fmt(Math.abs(net)))}</div>
    <small>${I('trophy', 13)} ${nivel}${funState.streak > 1 ? ` · ${I('flame', 13)} ${funState.streak} dias seguidos` : ''}</small></div></div>`;
}
function funPoke(){
  funState.tap++;
  render();
  const p = document.querySelector('.pigBox');
  if (p) p.classList.add('poke');
}
// Bloco do Resumo: quantas já foram ganhas, as últimas de cada família e as três mais perto de sair.
function funBadges(){
  const fams = funFamilies(), list = funBadgeList(), ganhas = list.filter(b => b[3]).length;
  const proximas = fams.map(([ic, nome, como, v, metas]) => { const i = metas.findIndex(n => v < n); return i < 0 ? null : {ic, nome:metas.length > 1 ? `${nome} ${ROMANOS[i]}` : nome, como:como(metas[i]), pct:Math.min(99, v / metas[i] * 100)}; })
    .filter(Boolean).sort((a, b) => b.pct - a.pct).slice(0, 3);
  const topo = fams.map(([ic, nome, , v, metas]) => { const n = metas.filter(m => v >= m).length; return n ? [ic, metas.length > 1 ? `${nome} ${ROMANOS[n - 1]}` : nome] : null; }).filter(Boolean);
  return `${challengeHtml()}<h2>Conquistas <button onclick="openBadges()">Ver todas (${ganhas} de ${list.length})</button></h2>
  <div class="card"><div class="bar" style="margin-top:0"><i style="width:${ganhas / list.length * 100}%"></i></div>
    ${topo.length ? `<div class="badges">${topo.map(([ic, nome]) => `<button class="on" onclick="openBadges()"><span>${I(ic, 24)}</span>${nome}</button>`).join('')}</div>` : ''}
    ${proximas.length ? `<div class="hint" style="margin:10px 0 2px">Mais perto de ganhar:</div>${proximas.map(p => `<div class="catrow"><div class="top"><span>${I(p.ic, 16)} ${p.nome}</span><b>${Math.floor(p.pct)}%</b></div>
      <div class="hint" style="margin-top:2px">${cap(p.como)}</div><div class="bar"><i style="width:${p.pct}%"></i></div></div>`).join('')}` : ''}</div>`;
}
// Todas as conquistas, por família, com o nível de cada uma.
function openBadges(){
  settingsOpen = false; F = null;
  const list = funBadgeList(), ganhas = list.filter(b => b[3]).length;
  showSheet(`<h3>Conquistas: ${ganhas} de ${list.length}</h3>
    <div class="hint" style="margin-top:0">Cada uma tem níveis: a próxima aparece quando você passa da anterior.</div>
    ${funFamilies().map(([ic, nome, como, v, metas]) => { const n = metas.filter(m => v >= m).length, prox = metas[n]; return `
      <div class="item" style="cursor:default">${tile(ic)}<div class="mid"><b>${nome}${n ? ' ' + (metas.length > 1 ? ROMANOS[n - 1] : '') : ''}</b>
        <small style="white-space:normal">${prox == null ? 'Todos os níveis conquistados!' : cap(como(prox))}</small>
        <div class="lvls">${metas.map((m, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="val ${n === metas.length ? 'in' : 'muted'}">${n}/${metas.length}</div></div>`; }).join('')}
    <div class="btns foot"><button class="btn primary" onclick="closeForm()">Fechar</button></div>`);
}
function confetti(){
  if (!db.prefs.anim) return;
  const box = document.createElement('div'), cores = [shade(0, 4), shade(2, 4), '#fbbf24', '#34d399', '#f472b6', '#38bdf8'];
  box.className = 'confetti';
  box.innerHTML = [...Array(44)].map((_, i) => `<i style="left:${Math.random() * 100}%;background:${cores[i % cores.length]};animation-delay:${Math.random() * .25}s;animation-duration:${1.1 + Math.random() * .9}s;--r:${Math.round(Math.random() * 720 - 360)}deg;--x:${Math.round(Math.random() * 120 - 60)}px;${i % 3 ? '' : 'border-radius:50%'}"></i>`).join('');
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2400);
}
// Os números grandes dos cartões de destaque sobem de zero até o valor.
function funCount(){
  if (!db.prefs.fun || !db.prefs.anim) return;
  document.querySelectorAll('#app .hero .big').forEach(el => {
    if (hideVals) return;
    const fim = parseMoney(el.textContent), t0 = performance.now();
    if (!fim) return;
    const passo = t => { const k = Math.min(1, (t - t0) / 650); el.textContent = fmt(fim * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  });
}

// ---------- Configurações ----------
// Ícone e bloqueio são funções do lado nativo (window.Android). Na prévia do PC (localhost) não há
// lado nativo: demoOpts só guarda as escolhas na memória para a tela poder ser vista; não tem efeito real.
const demoOpts = {
  lock:false, time:30, icon:'indigo',
  bloqueio(){ return this.lock; }, setBloqueio(v){ this.lock = v; },
  tempoBloqueio(){ return this.time; }, setTempoBloqueio(v){ this.time = v; },
  icone(){ return this.icon; }, setIcone(v){ this.icon = v; }
};
const isPreview = location.hostname === 'localhost';
function nativeOpts(){ return window.Android && Android.setTempoBloqueio ? Android : isPreview ? demoOpts : null; }
// Chamado pelo lado nativo depois de pedir a senha para desligar o bloqueio.
function onLockChanged(){ if (settingsShown()) openSettings(); }
// Configurações em categorias: a primeira tela mostra um botão por categoria; cada uma abre só as opções dela.
// setSec guarda a categoria aberta, para as opções que redesenham a tela (openSettings()) continuarem nela.
// Sem argumento e com as configurações fechadas, abre o menu de categorias.
let setSec = '';
const settingsShown = () => sheetOpen() && !!document.querySelector('#sheet .setGrid, #sheet .setHead');
function openSettings(sec){
  if (sec !== undefined) setSec = sec; else if (!settingsShown()) setSec = '';
  const p = db.prefs, n = p.tabs.length;
  // Opções que só existem no APK (ícone, bloqueio). Number()/!! porque os valores vêm do lado nativo.
  const N = nativeOpts(), isApp = !!N, lockOn = isApp && !!N.bloqueio(), lockTime = isApp ? Number(N.tempoBloqueio()) : 0;
  const demo = N === demoOpts ? '<div class="hint warn" style="margin-top:0">Prévia no PC: estas opções só funcionam no app instalado no celular.</div>' : '';
  const batLivre = window.Android && Android.bateriaLivre ? !!Android.bateriaLivre() : null; // null: não dá para saber (prévia)
  const syncHtml = syncSection();
  F = null;
  // [chave, ícone, título, descrição, conteúdo ('' = categoria não existe neste aparelho)]
  const S = [
  ['perfil', 'person', 'Perfil', 'Seu nome, tutorial e atualizações', `
    <label>Seu nome</label>
    <div class="hint" style="margin-top:0">${myName() ? `${greeting()} O nome aparece no topo do Resumo e nas mensagens do app.` : 'Ainda sem nome. Ele aparece no topo do Resumo e nas mensagens do app.'}${sync.shared ? ' Na conta compartilhada, cada pessoa vê o próprio nome no seu celular.' : ''}</div>
    <div class="btns"><button class="btn" onclick="askName(true)">${I('person')}${myName() ? 'Trocar o nome' : 'Informar o nome'}</button></div>
    <label>Ajuda</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openTour(0, true)">${I('book')}Ver o tutorial</button><button class="btn" onclick="maybeNews(true)">${I('sparkle')}Novidades da versão</button></div>
    ${window.Android && Android.atualizar ? `<label>Atualizações</label>
    <div class="hint" style="margin-top:0">Versão ${APP_VERSION}. O app procura atualizações sozinho ao abrir e as aplica na abertura seguinte.</div>
    <div class="btns"><button class="btn" onclick="toast('Procurando atualização…');Android.atualizar()">${I('refresh')}Procurar atualização agora</button></div>` : ''}`],
  ['aparencia', 'sun', 'Aparência', 'Idioma, tema, cores, texto e modo divertido', `
    <label>Idioma</label>
    <div class="btns" style="margin-top:0">${Object.entries(LANGS).map(([k, v]) => `<button class="btn ${lang() === k ? 'primary' : ''}" style="padding:11px 4px" onclick="setLang('${k}')">${v}</button>`).join('')}</div>
    ${lang() !== 'pt' ? '<div class="hint">O assistente entende perguntas só em português. Os valores continuam em reais.</div>' : ''}
    <label>Tema</label>
    <div class="btns" style="margin-top:0">${Object.entries(MODES).map(([k,v]) => `<button class="btn ${p.mode === k ? 'primary' : ''}" onclick="setPref('mode','${k}')">${v}</button>`).join('')}</div>
    <label>Cor</label>
    <div class="swatches">${Object.entries(COLORS).map(([k,c]) => `<button class="sw ${p.color === k ? 'on' : ''}" style="background:linear-gradient(135deg,${c[1]},${c[2]})" onclick="setPref('color','${k}')" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div>
    <label>Tamanho do texto</label>
    <div class="btns" style="margin-top:0">${[[.9,'Pequeno'],[1,'Normal'],[1.12,'Grande'],[1.25,'Maior']].map(([v,t]) => `<button class="btn ${p.font === v ? 'primary' : ''}" style="padding:11px 4px" onclick="setPref('font',${v})">${t}</button>`).join('')}</div>
    ${window.Android && Android.girar ? `<label>Girar a tela com o celular</label>
    <div class="btns" style="margin-top:0">${[[true,'Sim'],[false,'Não, sempre em pé']].map(([v,t]) => `<button class="btn ${!!Android.girarLigado() === v ? 'primary' : ''}" onclick="Android.girar(${v});openSettings()">${t}</button>`).join('')}</div>` : ''}
    <label>Animações</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligadas'],[false,'Desligadas']].map(([v,t]) => `<button class="btn ${p.anim === v ? 'primary' : ''}" onclick="setPref('anim',${v})">${t}</button>`).join('')}</div>
    <label>Cor dos ícones das categorias</label>
    <div class="btns" style="margin-top:0">${[[false,'Do tema'],[true,'Uma cor por categoria']].map(([v,t]) => `<button class="btn ${!!p.catColor === v ? 'primary' : ''}" onclick="setPref('catColor',${v})">${t}</button>`).join('')}</div>
    <label>Modo divertido</label>
    <div class="btns" style="margin-top:0">${[[true, I('sparkle') + 'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${p.fun === v ? 'primary' : ''}" onclick="setPref('fun',${v})">${t}</button>`).join('')}</div>
    <div class="hint">Um porquinho no Resumo que reage ao seu mês, mais de 100 conquistas para desbloquear, confete e recados bem-humorados.</div>
    <label>Tema especial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['', 'Nenhum'], ...Object.entries(SKINS).map(([k, s]) => [k, s[0]])].map(([k, t]) => `<button class="btn ${(p.skin || '') === k ? 'primary' : ''}" style="padding:11px 6px;flex:1 0 30%" onclick="setSkin('${k}')">${k ? `<i class="dot" style="background:linear-gradient(135deg,${SKINS[k][4]},${SKINS[k][2]})"></i>` : ''}${t}</button>`).join('')}</div>
    <div class="hint">Um tema especial muda as cores do app inteiro e o mascote do modo divertido; os ícones das categorias ficam com a cor de cada uma. Com um tema especial ligado, "Tema" e "Cor" acima ficam sem efeito.</div>`],
  ['menu', 'sliders', 'Menu de baixo', 'Esconder e reordenar as abas', `
    <div class="hint" style="margin-top:0">Toque no círculo para esconder ou mostrar uma aba e use as setas para mudar a ordem. O Resumo fica sempre no menu.</div>
    <div>${p.tabs.map((t,i) => { if (WEB_APP && t === 'noticias') return ''; const off = p.tabsOff.includes(t); return `<div class="item" style="cursor:default;padding:6px 0">
      <button class="iconbtn ${off ? 'muted' : 'in'}" onclick="toggleTab('${t}')" ${t === 'resumo' ? 'disabled style="opacity:.35"' : ''} aria-label="${off ? 'Mostrar' : 'Esconder'}">${I(off ? 'unchecked' : 'checked', 24)}</button>
      <div class="mid" style="${off ? 'opacity:.5' : ''}"><b>${I(TABS[t][0])} ${TABS[t][1]}</b>${off ? '<small>escondida</small>' : t === visTabs()[0] ? '<small>Aba inicial</small>' : ''}</div>
      <button class="iconbtn" onclick="moveTab(${i},-1)" ${i ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" onclick="moveTab(${i},1)" ${i < n-1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`; }).join('')}</div>`],
  ['seguranca', 'lock', 'Ícone e bloqueio', 'Cor do ícone, senha ou biometria', !isApp ? '' : `${demo}
    <label>Cor do ícone do app</label>
    <div class="swatches">${Object.entries(ICONES).map(([k,c]) => `<button class="sw ${N.icone() === k ? 'on' : ''}" style="background:linear-gradient(135deg,${c[1]},${c[2]});border-radius:14px" onclick="nativeOpts().setIcone('${k}');openSettings()" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div>
    ${window.Android && Android.setIconeApp ? `<label>Desenho do ícone</label>
    <div class="btns" style="margin-top:0">${[['b', 'Gráfico'], ['p', 'Porquinho']].map(([k, t]) => `<button class="btn ${Android.iconeDesenho() === k ? 'primary' : ''}" onclick="Android.setIconeApp(Android.icone(),'${k}',Android.iconeNome());openSettings()">${t}</button>`).join('')}</div>
    <label>Nome do app na tela inicial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${APP_NOMES.map((t, i) => `<button class="btn ${Number(Android.iconeNome()) === i ? 'primary' : ''}" style="padding:11px 6px;flex:1 0 40%" onclick="Android.setIconeApp(Android.icone(),Android.iconeDesenho(),${i});openSettings()">${t}</button>`).join('')}</div>` : ''}
    <div class="hint">Ao trocar a cor, o desenho ou o nome, o Android fecha o app: é só abrir de novo pelo ícone novo. Se o ícone sumir da tela inicial, adicione de novo pela lista de apps. O Android só deixa escolher entre os nomes desta lista.</div>
    <label>Pedir senha ou biometria ao abrir</label>
    <div class="btns" style="margin-top:0">${[[true, I('lock') + 'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${lockOn === v ? 'primary' : ''}" onclick="nativeOpts().setBloqueio(${v});openSettings()">${t}</button>`).join('')}</div>
    ${lockOn ? '<div class="hint">Para desligar, o app pede a senha ou a biometria. Ao sair da conta Google, o bloqueio desliga sozinho.</div>' : ''}
    <label>Pedir de novo depois de ficar fora do app por</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap${lockOn ? '' : ';opacity:.4;pointer-events:none'}">${[[0,'Sempre'],[30,'30 s'],[60,'1 min'],[300,'5 min'],[900,'15 min']].map(([s,t]) => `<button class="btn ${lockTime === s ? 'primary' : ''}" style="padding:11px 6px" onclick="nativeOpts().setTempoBloqueio(${s});openSettings()">${t}</button>`).join('')}</div>`],
  ['lembretes', 'calendar', 'Lembretes', 'Contas a vencer e economia de bateria', !isApp ? '' : `${demo}
    <label>Notificações de contas a vencer</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligadas'],[false,'Desligadas']].map(([v,t]) => `<button class="btn ${p.notify === v ? 'primary' : ''}" onclick="setNotify(${v})">${t}</button>`).join('')}</div>
    ${p.notify && batLivre === false ? `<div class="hint warn">${I('alert', 13)} A economia de bateria está ligada para o app: os lembretes podem atrasar ou não chegar. Desligue para recebê-los na hora.</div>` : ''}
    ${p.notify && batLivre ? `<div class="hint in">${I('check', 13)} Economia de bateria desligada para o app: os lembretes chegam na hora.</div>` : ''}
    <div style="${p.notify ? '' : 'opacity:.4;pointer-events:none'}">
      <label>Avisar com antecedência de (pode marcar mais de uma)</label>
      <div class="btns" style="margin-top:0">${[[1,'1 dia'],[3,'3 dias'],[5,'5 dias']].map(([d,t]) => `<button class="btn ${p.reminds.includes(d) ? 'primary' : ''}" onclick="toggleRemind(${d})">${p.reminds.includes(d) ? I('check', 15) : ''}${t}</button>`).join('')}</div>
      <label>Categorias que notificam (as que têm gastos fixos; toque para ligar ou desligar)</label>
      <div class="chips" style="margin:0">${Object.entries(CAT_GASTO).filter(([k]) => k !== 'emprestimo' && (p.notifyCats[k] === false || db.expenses.some(x => x.cat === k && x.fixed))).map(([k,c]) => { const on = p.notifyCats[k] !== false; return `<button style="${on ? 'background:var(--brand);color:' + (theme.dark ? '#0b1020' : '#fff') : 'opacity:.6;text-decoration:line-through'}" onclick="toggleNotifyCat('${k}')">${I(c[0], 14)} ${c[1]}</button>`; }).join('')}</div>
    </div>
    <div class="hint">Vale para gastos fixos com dia de vencimento. O app avisa em cada antecedência marcada e de novo no dia do vencimento, por volta das 9h. Sem nenhuma marcada, avisa só no dia.</div>${window.Android && Android.bateria ? `${batLivre ? '' : `<div class="btns"><button class="btn" onclick="Android.bateria()">Tirar o app da economia de bateria</button></div>`}
    <div class="hint">Em alguns celulares (Samsung, Xiaomi, Motorola) a economia de bateria atrasa ou corta os lembretes. Na tela que abre, procure "Minhas Finanças" e escolha "Não otimizar". O app também reagenda os lembretes quando o celular reinicia e quando é atualizado.</div>` : ''}`],
  ['widgets', 'chart', 'Widgets', 'Tela inicial do celular: resumo, saldo e porquinho', !(window.Android && Android.widget) ? '' : `
    <div class="hint" style="margin-top:0">Widgets são quadros do app na tela inicial do celular. Há quatro: <b>Resumo</b> (você escolhe as linhas), <b>Saldo do mês</b>, <b>Contas a vencer</b> e <b>Porquinho</b> (a cara do mês e os gastos).</div>
    <label>Porquinho nos widgets Resumo, Saldo e Contas</label>
    <div class="btns" style="margin-top:0">${[[true, 'Com porquinho'], [false, 'Sem porquinho']].map(([v, t]) => `<button class="btn ${(p.widgetPig ?? !!p.fun) === v ? 'primary' : ''}" onclick="setPref('widgetPig',${v})">${t}</button>`).join('')}</div>
    <label>Widget Resumo</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openLayoutEdit('widget')">${I('sliders')}Escolher o que aparece</button></div>
    <div class="hint">Aparecem até 5 linhas, na ordem escolhida. Linhas sem dado (por exemplo, sem conta a vencer) são puladas.</div>
    ${Android.fixarWidget ? `<label>Pôr na tela inicial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['resumo', 'Resumo'], ['saldo', 'Saldo do mês'], ['contas', 'Contas a vencer'], ['porco', 'Porquinho']].map(([k, t]) => `<button class="btn" style="padding:11px 6px" onclick="if(!Android.fixarWidget('${k}'))tell('Esta tela inicial não aceita o pedido. Segure o dedo num espaço vazio da tela inicial, toque em Widgets e procure Minhas Finanças.')">${t}</button>`).join('')}</div>
    <div class="hint">O Android pede sua confirmação. Também dá para adicionar segurando o dedo num espaço vazio da tela inicial › Widgets › Minhas Finanças.</div>` : ''}`],
  ['conta', 'cloud', 'Conta e sincronização', 'Conta Google, sincronização e cópias', syncHtml],
  ['compart', 'people', 'Conta compartilhada', sync.shared ? 'Ligada: vocês veem os mesmos dados' : 'Casal ou família: os mesmos dados em dois celulares', syncHtml ? shareHtml() : ''],
  ['auto', 'sparkle', 'Lançamento automático', 'Sugestões pelas notificações do banco', !(window.Android && Android.avisosLigar) ? '' : `
    <label>Sugerir lançamentos pelas notificações do banco</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${!!Android.avisosLigado() === v ? 'primary' : ''}" onclick="setAvisos(${v})">${t}</button>`).join('')}</div>
    ${Android.avisosLigado() && !Android.avisosAcesso() ? `<div class="hint warn">${I('alert', 13)} Falta autorizar no Android. <a href="#" onclick="Android.avisosConfigurar();return false" style="color:var(--brand)">Abrir a tela de autorização</a></div>` : ''}
    <div class="hint">Quando o banco avisa uma compra ou um Pix, o app mostra no Resumo uma sugestão já preenchida; você confere e lança. Para isso o Android pede acesso às notificações: o app guarda só as de compras, Pix e pagamentos, e nada sai do aparelho. Depende do texto que cada banco usa, então pode não reconhecer todos. A partir do Android 15, avisos com números longos (como um código de 4 dígitos ou o final do cartão) chegam escondidos: aí o app mostra só "Novo aviso do banco" para você lançar o valor.</div>`],
  ['guia', 'book', 'Guia do app', 'Todas as funções, onde ficam e como usar', guideHtml()],
  ['dados', 'box', 'Dados e ajustes', 'Categorias, taxas, lixeira, backup e apagar', `
    <label>Investimentos</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openRates()">${I('trend')}Taxas de referência (CDI, Selic, IPCA)</button></div>
    <label>Categorias</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openCats()">${I('tag')}Criar, renomear ou esconder categorias</button></div>
    ${archHtml()}
    <label>Lixeira</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openTrash()">${I('trash')}Lançamentos excluídos (${db.trash.length})</button></div>
    <label>Planilha do Google</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openSheetLink()">${I('doc')}${sheetId() ? 'Planilha ligada ao app' : 'Criar planilha ligada ao app'}</button></div>
    <label>Backup em arquivo</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="exportData()">${I('download')}Exportar</button><button class="btn" onclick="document.getElementById('file').click()">${I('upload')}Importar</button></div>
    ${sync.fileAt ? `<div class="hint">Cópia automática semanal: a última foi em ${new Date(sync.fileAt).toLocaleDateString('pt-BR')}, na pasta <span style="overflow-wrap:anywhere">${esc(sync.fileDir || '')}</span> do celular (são guardadas as 8 mais recentes; a pasta é apagada se o app for desinstalado).</div>` : ''}
    <label>Apagar tudo</label>
    <div class="btns" style="margin-top:0"><button class="btn danger" style="flex:1" onclick="wipeAll()">${I('trash')}Apagar todos os meus dados</button></div>
    <div class="hint">Apaga os lançamentos deste aparelho e da sua conta Google (inclusive as cópias diárias e os comprovantes). Não dá para desfazer.</div>`]
  ].filter(s => s[4]);
  const cur = S.find(s => s[0] === setSec);
  if (!cur) setSec = '';
  showSheet(cur ? `<h3 class="setHead"><button class="iconbtn" onclick="openSettings('')" aria-label="Voltar">‹</button>${I(cur[1], 22)} ${cur[2]}</h3>
    <div class="sec">${cur[4]}</div>
    <div class="btns foot"><button class="btn" onclick="openSettings('')">Voltar</button><button class="btn primary" onclick="closeForm()">Fechar</button></div>`
  : `<h3>Configurações</h3>
    <div class="setGrid">${S.map(([k, ic, t, d]) => `<button class="setTile" onclick="openSettings('${k}')"><span>${I(ic, 22)}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    ${window.Android && Android.atualizar ? `<div class="btns"><button class="btn" onclick="toast('Procurando atualização…');Android.atualizar()">${I('refresh')}Procurar atualizações</button></div>` : WEB_APP ? `<div class="btns"><button class="btn" onclick="location.reload()">${I('refresh')}Procurar atualizações</button></div>` : ''}
    <div class="btns foot"><button class="btn primary" onclick="closeForm()">Fechar</button></div>
    <div class="hint" style="text-align:center" onclick="diagTap()">Minhas Finanças · versão ${APP_VERSION}</div>`);
  settingsOpen = true;
}
// Tema especial: aplica e, no APK, oferece trocar também o ícone do app para combinar.
async function setSkin(k){
  setPref('skin', k);
  if (k && window.Android && Android.setIconeApp && Android.icone() !== k
    && await ask(`Trocar também o ícone do app para combinar com o tema ${SKINS[k][0]}?\n\nO Android fecha o app ao trocar o ícone: é só abrir de novo pelo ícone novo.`, 'Trocar o ícone')) Android.setIconeApp(k, Android.iconeDesenho(), Android.iconeNome());
}
// Guia do app (Configurações): todas as funções (GUIA, em js/guia.js), por assunto, com busca.
function guideHtml(){
  return `<div class="search" style="margin-bottom:10px">${I('search')}<input id="gq" type="text" placeholder="Buscar uma função" autocomplete="off" oninput="guideFilter(this.value)"></div>
    ${GUIA.map(([sec, itens]) => `<details class="grp gSec"><summary>${sec}<small>${itens.length}</small>${I('chev')}</summary>${itens.map(([nome, onde, como]) => `
      <div class="gItem" data-t="${esc(plain(nome + ' ' + onde + ' ' + como))}"><b>${esc(nome)}</b><small><i>Onde:</i> ${esc(onde)}</small><small><i>Como usar:</i> ${esc(como)}</small></div>`).join('')}</details>`).join('')}
    <div class="hint" id="gVazio" hidden>Nenhuma função encontrada com esse texto.</div>`;
}
function guideFilter(q){
  q = plain(q.trim());
  let algum = false;
  document.querySelectorAll('#sheet .gSec').forEach(sec => {
    let n = 0;
    sec.querySelectorAll('.gItem').forEach(it => { const ok = !q || it.dataset.t.includes(q); it.hidden = !ok; if (ok) n++; });
    sec.hidden = !n; sec.open = !!q && n > 0;
    if (n) algum = true;
  });
  document.getElementById('gVazio').hidden = algum;
}
// Ao voltar de uma tela do Android (economia de bateria, notificações), as configurações abertas se atualizam.
document.addEventListener('visibilitychange', () => { if (!document.hidden && settingsShown()) openSettings(); });
// ---------- Diagnóstico (tela escondida) ----------
// Abre com 7 toques seguidos no número da versão, em Configurações, e a senha abaixo. A senha só esconde a tela
// de quem não deve mexer nela; não protege dados (quem abre o APK consegue lê-la).
const DIAG_PASS = '12344321';
let diagTaps = 0, diagTimer = 0;
function diagTap(){
  clearTimeout(diagTimer); diagTimer = setTimeout(() => diagTaps = 0, 1500);
  if (++diagTaps < 7) return;
  diagTaps = 0; settingsOpen = false; F = null;
  showSheet(`<h3>Diagnóstico</h3>
    <label for="diagPass">Senha</label>
    <input id="diagPass" type="password" inputmode="numeric" autocomplete="off" onkeydown="if(event.key==='Enter')diagOpen()">
    <div class="err" id="diagErr"></div>
    <div class="btns foot"><button class="btn" onclick="openSettings()">Voltar</button><button class="btn primary" onclick="diagOpen()">Abrir</button></div>`);
  document.getElementById('diagPass').focus();
}
function diagErrors(){ try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch(e){ return []; } }
// Texto do relatório: nada de valores nem descrições dos lançamentos, só contagens e o estado do app.
function diagText(){
  const kb = k => { try { return Math.round((localStorage.getItem(k) || '').length / 1024); } catch(e){ return -1; } };
  const errs = diagErrors();
  return [`Minhas Finanças ${APP_VERSION} · formato dos dados ${db.ver || 1}`,
    `Data: ${new Date().toLocaleString('pt-BR')}`,
    `Aparelho: ${navigator.userAgent}`,
    `Tela: ${screen.width}x${screen.height} · zoom do texto ${db.prefs.font}`,
    `Dados: ${kb(KEY)} KB · ` + COLS.map(c => `${c} ${db[c].length}`).join(', '),
    `Gravação falhou: ${saveFailed ? 'sim' : 'não'}`,
    `Sincronização: ${canSync() ? (sync.on ? 'ligada' : 'desligada') : 'indisponível'} · última: ${sync.at ? new Date(sync.at).toLocaleString('pt-BR') : 'nunca'} · erro: ${sync.err || 'nenhum'}`,
    `Fotos na fila: ${sync.up.length} para enviar, ${sync.del.length} para apagar`,
    `Preferências: tema ${db.prefs.mode}/${db.prefs.color}, animações ${db.prefs.anim ? 'sim' : 'não'}, modo divertido ${db.prefs.fun ? 'sim' : 'não'}, abas escondidas ${db.prefs.tabsOff.join(',') || 'nenhuma'}`,
    '', `Erros registrados (${errs.length}):`,
    ...errs.slice().reverse().map(e => `[${new Date(e.t).toLocaleString('pt-BR')} · v${e.v}] ${e.onde}: ${e.msg}`)].join('\n');
}
function diagOpen(){
  const el = document.getElementById('diagPass');
  if (el && el.value !== DIAG_PASS){ document.getElementById('diagErr').textContent = 'Senha incorreta.'; el.value = ''; el.focus(); return; }
  showSheet(`<h3>Diagnóstico</h3>
    <div class="hint" style="margin-top:0">Estado do app e últimos erros, para enviar a quem dá suporte. Não inclui valores nem descrições dos seus lançamentos.</div>
    <textarea id="diagBox" readonly>${esc(diagText())}</textarea>
    <div class="btns"><button class="btn" onclick="diagSave()">${I('download')}Salvar em arquivo</button><button class="btn" onclick="diagCopy()">Copiar</button></div>
    <div class="btns"><button class="btn danger" style="flex:1" onclick="localStorage.removeItem(ERR_KEY);diagOpen()">Limpar erros</button></div>
    <div class="btns foot"><button class="btn primary" onclick="openSettings()">Voltar</button></div>`);
}
function diagSave(){
  const name = 'financas-diagnostico.txt';
  if (window.Android && Android.exportar) return Android.exportar(diagText(), name);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([diagText()], {type:'text/plain'}));
  a.download = name; a.click();
}
function diagCopy(){
  if (window.Android && Android.copiar){ Android.copiar(diagText()); return toast('Copiado.'); }
  const box = document.getElementById('diagBox');
  box.select();
  try { document.execCommand('copy'); toast('Copiado.'); } catch(e){ toast('Não deu para copiar; use "Salvar em arquivo".'); }
}

// Categorias de gastos e de ganhos: renomear, trocar o ícone, esconder e criar novas.
const ICON_NAMES = {home:'Casa', bed:'Cama', key:'Chave', wrench:'Ferramenta', brush:'Pintura', drop:'Água', flame:'Gás', bolt:'Raio', wifi:'Internet', phone:'Celular', tv:'TV',
  food:'Comida', pizza:'Pizza', coffee:'Café', cup:'Bebida', cake:'Bolo', cart:'Mercado', bag:'Sacola', shirt:'Roupa', scissors:'Beleza', gift:'Presente',
  car:'Carro', fuel:'Combustível', bus:'Ônibus', bike:'Bicicleta', truck:'Entrega', plane:'Viagem', pin:'Lugar', globe:'Mundo',
  health:'Saúde', cross:'Farmácia', pill:'Remédio', dumbbell:'Academia', heart:'Coração', paw:'Pet', person:'Pessoa', people:'Família', smile:'Sorriso',
  star:'Estrela', game:'Jogos', music:'Música', film:'Filmes', ticket:'Ingresso', ball:'Esporte', camera:'Foto', sun:'Sol', leaf:'Planta',
  book:'Livro', grad:'Formatura', laptop:'Computador', briefcase:'Maleta', building:'Prédio', bank:'Banco', calendar:'Calendário', doc:'Documento', receipt:'Recibo',
  coins:'Moedas', coin:'Moeda', cash:'Dinheiro', card:'Cartão', wallet:'Carteira', piggy:'Cofrinho', percent:'Porcentagem', trend:'Gráfico', chart:'Barras',
  tag:'Etiqueta', box:'Caixa', target:'Alvo', trophy:'Troféu', diamond:'Diamante', shield:'Escudo', umbrella:'Guarda-chuva', lock:'Cadeado', cloud:'Nuvem', sparkle:'Brilho'};
const CAT_OF = {gasto:CAT_GASTO, ganho:CAT_GANHO};
// Grupos das categorias de gasto de fábrica, para a tela de categorias não virar uma lista só.
const CAT_GROUPS = {'Casa':['moradia','casa','luz','internet','contas'], 'Alimentação':['alimentacao','mercado','restaurante','cafe','bares'],
  'Transporte':['transporte','combustivel','estacionamento','conducao','oficina','viagem'], 'Saúde e cuidados':['saude','farmacia','academia','beleza'],
  'Lazer':['lazer','cinema','shows','jogos'], 'Compras':['compras','roupas','eletronicos','presentes'], 'Família':['educacao','pets','filhos'],
  'Finanças e outros':['seguros','impostos','doacoes','emprestimo','outros']};
const catGroup = k => Object.keys(CAT_GROUPS).find(g => CAT_GROUPS[g].includes(k));
const catsOpen = new Set(['Suas categorias']);
function openCats(){
  settingsOpen = false; F = null;
  const row = (type, k, c) => `
    <div class="item" style="cursor:default;padding:6px 0">${tile(c[0])}<div class="mid" style="${c[3] ? 'opacity:.5' : ''}"><b>${esc(c[1])}</b>${c[3] ? '<small>escondida</small>' : ''}</div>
      <button class="btn" style="flex:none;padding:8px 12px" onclick="editCat('${type}','${k}')">Editar</button>
      ${BASE_CATS[type][k] ? '' : `<button class="iconbtn out" onclick="deleteCat('${type}','${k}')" aria-label="Excluir categoria">${I('close', 20)}</button>`}
      ${k === 'outros' ? '' : `<button class="iconbtn ${c[3] ? 'muted' : 'in'}" onclick="toggleCat('${type}','${k}')" aria-label="${c[3] ? 'Mostrar' : 'Esconder'}">${I(c[3] ? 'unchecked' : 'checked', 24)}</button>`}</div>`;
  const novo = type => `<div class="btns" style="margin-top:0"><button class="btn" onclick="editCat('${type}','')">${I('plus', 16)}Nova categoria de ${type}</button></div>`;
  const groups = {};
  for (const [k, c] of Object.entries(CAT_GASTO)) (groups[catGroup(k) || 'Suas categorias'] = groups[catGroup(k) || 'Suas categorias'] || []).push([k, c]);
  const ordem = ['Suas categorias', ...Object.keys(CAT_GROUPS)].filter(g => groups[g]);
  showSheet(`<h3>Categorias</h3>
    <div class="hint" style="margin-top:0">Toque em um grupo para abrir. Categoria escondida some das listas de escolha, mas os lançamentos antigos continuam com ela. As que você criou podem ser excluídas (X): os lançamentos passam para a de fábrica com o mesmo nome ou para "Outros".</div>
    <label>Gastos</label>${novo('gasto')}
    ${ordem.map((g, i) => `<details class="grp" ${catsOpen.has(g) ? 'open' : ''} ontoggle="catsOpen[this.open ? 'add' : 'delete'](this.dataset.g)" data-g="${g}"><summary>${g}<small>${groups[g].length}</small>${I('chev')}</summary>${groups[g].map(([k, c]) => row('gasto', k, c)).join('')}</details>`).join('')}
    <label>Ganhos</label>${novo('ganho')}
    <details class="grp" ${catsOpen.has('Ganhos') ? 'open' : ''} ontoggle="catsOpen[this.open ? 'add' : 'delete']('Ganhos')"><summary>Categorias de ganho<small>${Object.keys(CAT_GANHO).length}</small>${I('chev')}</summary>${Object.entries(CAT_GANHO).map(([k, c]) => row('ganho', k, c)).join('')}</details>
    <div class="btns foot"><button class="btn primary" onclick="openSettings('dados')">Voltar</button></div>`);
}
function editCat(type, k){
  const c = CAT_OF[type][k];
  openForm('catEdit', null, {id:type + ':' + k, title:c ? 'Editar categoria' : 'Nova categoria de ' + type, vals:c ? {name:c[1], icon:c[0], color:c[2]} : {icon:'tag', color:'#64748b'}});
}
// Exclui uma categoria criada pelo usuário. Os lançamentos dela vão para a de fábrica de mesmo nome, ou para "Outros".
async function deleteCat(type, k){
  const nome = plainName(CAT_OF[type][k][1]);
  const alvo = Object.keys(BASE_CATS[type]).find(b => plainName((db.cats[type][b] || {}).name || BASE_CATS[type][b][1]) === nome) || 'outros';
  const nomeAlvo = (db.cats[type][alvo] || {}).name || BASE_CATS[type][alvo][1];
  const usados = (type === 'gasto' ? ['expenses', 'installments'] : ['incomes']).flatMap(c => db[c]).filter(x => x.cat === k);
  if (!await ask(`Excluir a categoria "${CAT_OF[type][k][1]}"?` + (usados.length ? `\n${usados.length} lançamento(s) passam para "${nomeAlvo}".` : ''), 'Excluir', true)) return;
  for (const x of usados){ x.cat = alvo; touch(x); }
  if (type === 'gasto'){
    if (db.budgets[k]){ db.budgets[alvo] = (db.budgets[alvo] || 0) + db.budgets[k]; delete db.budgets[k]; }
    delete db.prefs.notifyCats[k];
    for (const d in db.catMemo) if (db.catMemo[d] === k) db.catMemo[d] = alvo;
  }
  delete db.cats[type][k];
  db.cfgMod = Date.now(); applyCats(); save(); render(); openCats();
  toast('Categoria excluída.');
}
function toggleCat(type, k){
  db.cats[type][k] = Object.assign(db.cats[type][k] || {}, {hidden:!CAT_OF[type][k][3]});
  db.cfgMod = Date.now(); applyCats(); save(); render(); openCats();
}
function toggleTab(t){
  const p = db.prefs;
  p.tabsOff = p.tabsOff.includes(t) ? p.tabsOff.filter(x => x !== t) : p.tabsOff.concat(t);
  if (p.tabsOff.includes(state.tab)) state.tab = visTabs()[0];
  db.cfgMod = Date.now(); save(); render(); openSettings();
}
function setPref(k, v){ db.prefs[k] = v; db.cfgMod = Date.now(); save(); applyTheme(); render(); openSettings(); }
function moveTab(i, d){ const t = db.prefs.tabs; [t[i], t[i+d]] = [t[i+d], t[i]]; db.cfgMod = Date.now(); save(); render(); openSettings(); }
async function setNotify(on){
  if (on && window.Android && Android.pedirNotificacao) Android.pedirNotificacao(); // permissão de notificações do Android
  setPref('notify', on);
  // Com a economia de bateria ligada para o app, o Android atrasa ou corta os lembretes: avisa e oferece a tela de desligar.
  if (on && window.Android && Android.bateriaLivre && !Android.bateriaLivre()
    && await ask(comNome('Para os lembretes chegarem na hora, {nome}, é preciso desligar a economia de bateria do app.\n\nNa tela que vai abrir, procure "Minhas Finanças" e escolha "Não otimizar" (ou "Sem restrições").'), 'Abrir a tela'))
    Android.bateria();
}
function toggleRemind(d){ const r = db.prefs.reminds; setPref('reminds', r.includes(d) ? r.filter(x => x !== d) : r.concat(d).sort((a,b) => a - b)); }
function toggleNotifyCat(k){ db.prefs.notifyCats[k] = db.prefs.notifyCats[k] === false; setPref('notifyCats', db.prefs.notifyCats); }

// ---------- Sincronização com a conta Google (só no APK) ----------
// Os dados vão para o arquivo financas.json na pasta oculta do app no Google Drive do usuário.
// O login e as chamadas de rede são feitos pelo lado nativo (Android.drive); aqui fica a lógica.
// A cada sincronização o app baixa o arquivo, junta com os dados locais registro por registro (mergeDb)
// e envia o resultado. Uma cópia por dia fica guardada por 30 dias (backup-AAAA-MM-DD.json).
const SYNC_KEY = 'financas-sync', DRIVE = 'https://www.googleapis.com';
const canSync = () => !!(window.Android && Android.drive);
let sync = {on:false, linked:false, at:0, err:'', bk:'', demo:false, lockAsked:false, up:[], del:[]}; // estado só deste aparelho, não vai para a conta
try { Object.assign(sync, JSON.parse(localStorage.getItem(SYNC_KEY))); } catch(e){}
const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch(e){} };
let syncing = false, syncAgain = false, syncTimer = 0, driveSeq = 0;
const drivePending = {};

function drive(method, url, body, ctype, interactive){
  return new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.drive(id, method, url, body || '', ctype || '', !!interactive); });
}
// Chamado pelo lado nativo. status: código HTTP; 0 = sem conexão; -1 = precisa entrar na conta; -2 = outro erro.
function onDrive(id, status, text){ const res = drivePending[id]; delete drivePending[id]; if (res) res({status, text}); }
const ok = r => { if (r.status !== 200 && r.status !== 204) throw r; return r; };
const driveList = async (q, interactive) => JSON.parse(ok(await drive('GET', `${DRIVE}/drive/v3/files?spaces=appDataFolder&pageSize=100&orderBy=name%20desc&q=${encodeURIComponent(q)}&fields=files(id,name)`, '', '', interactive)).text).files;
const driveGet = async id => JSON.parse(ok(await drive('GET', `${DRIVE}/drive/v3/files/${id}?alt=media`)).text);
async function driveWrite(id, name, json){
  if (id) return ok(await drive('PATCH', `${DRIVE}/upload/drive/v3/files/${id}?uploadType=media`, json, 'application/json'));
  const b = 'financas-boundary';
  const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name, parents:['appDataFolder']})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${b}--`;
  return ok(await drive('POST', `${DRIVE}/upload/drive/v3/files?uploadType=multipart`, body, 'multipart/related; boundary=' + b));
}

// ---------- Conta compartilhada (casal ou família) ----------
// A pasta oculta do app no Drive é de uma conta só. Para duas contas Google verem os mesmos dados, eles ficam numa
// planilha do Google criada por quem convida e compartilhada com a outra pessoa. O JSON dos dados vai na coluna A da
// aba "dados", em pedaços (uma célula aceita até 50 mil caracteres). A junção é a mesma da sincronização normal
// (mergeDb). Fica de cada pessoa, no próprio aparelho e na própria conta: aparência e nome (prefs), cópias diárias e
// comprovantes. sync.shared = {id, owner, with:[e-mails convidados]}.
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
let PEDACO = 40000;
const fam = (method, url, body, ctype, interactive) => new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.driveFamilia(id, method, url, body || '', ctype || '', !!interactive); });
const shared = () => sync.shared && sync.shared.id;
const rng = r => encodeURIComponent(r);
async function sharedRead(id, interactive){
  const v = JSON.parse(ok(await fam('GET', `${SHEETS}/${id}/values/${rng('dados!A:A')}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`, '', '', interactive)).text).values;
  const txt = v && v[0] ? v[0].join('') : '';
  return txt ? JSON.parse(txt) : null;
}
async function sharedWrite(id, json){
  const partes = [];
  for (let i = 0; i < json.length; i += PEDACO) partes.push([json.slice(i, i + PEDACO)]);
  ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('dados!A1:A' + partes.length)}?valueInputOption=RAW`, JSON.stringify({values:partes}), 'application/json'));
  ok(await fam('POST', `${SHEETS}/${id}/values/${rng('dados!A' + (partes.length + 1) + ':A')}:clear`, '{}', 'application/json'));
}
// Texto para comparar na conta compartilhada: a aparência (prefs) é de cada um e não conta como diferença.
const canonS = d => canon(shared() ? {...d, prefs:null} : d);
const sharedMsg = e => e.status === 403 && /SERVICE_DISABLED|has not been used|not been enabled/i.test(e.text) ? 'A API do Google Sheets não está ativada no projeto do app no Google Cloud.'
  : e.status === 403 || e.status === 404 ? 'Sem acesso à conta compartilhada: confira se o convite foi feito para esta conta Google.' : '';
const codeOf = s => (String(s).match(/\/d\/([\w-]{20,})/) || String(s).trim().match(/^([\w-]{20,})$/) || [])[1] || '';
const inviteText = id => `Te convidei para a nossa conta compartilhada no app Minhas Finanças. No app, abra Configurações > Conta compartilhada > Tenho um convite e cole este código:\n${id}`;
// Quem lançou: registros antigos (sem by) passam a ser desta pessoa ao entrar numa conta compartilhada.
function claimMine(){ const me = myName(); if (me) for (const c of COLS) for (const r of db[c]) if (!r.by){ r.by = me; r.u = Date.now(); } }
function shareHtml(){
  const s = sync.shared;
  if (!s) return `<label>Conta compartilhada (casal ou família)</label>
    <div class="hint" style="margin-top:0">Duas contas Google vendo e lançando nos mesmos ganhos, gastos, investimentos e contas. Cada pessoa usa o app no próprio celular, com o próprio nome e a própria aparência; cada lançamento mostra quem fez.</div>
    ${!canSync() ? '<div class="hint warn">Prévia no PC: a conta compartilhada só funciona no app instalado no celular.</div>' : `<div class="btns"><button class="btn" onclick="openShare('convidar')">${I('people')}Convidar alguém</button><button class="btn" onclick="openShare('entrar')">Tenho um convite</button></div>`}`;
  return `<label>Conta compartilhada (casal ou família)</label>
    <div class="hint in" style="margin-top:0">${I('people', 14)} Ligada${s.owner && s.with && s.with.length ? ': compartilhada com ' + s.with.map(esc).join(', ') : ''}.</div>
    <div class="hint">Os lançamentos ficam numa planilha do Google compartilhada entre vocês (não edite a planilha à mão). Nome, aparência, cópias diárias e comprovantes continuam de cada um.</div>
    <div class="btns"><button class="btn" onclick="shareCopy()">Copiar convite</button>${s.owner ? `<button class="btn" onclick="openShare('convidar')">Convidar mais alguém</button>` : ''}</div>
    <div class="btns"><button class="btn danger" style="flex:1" onclick="shareLeave()">Sair da conta compartilhada</button></div>`;
}
function openShare(modo){
  settingsOpen = false; F = null;
  showSheet(modo === 'convidar' ? `<h3>Convidar para a conta compartilhada</h3>
    <div class="hint" style="margin-top:0">${sync.shared ? 'A pessoa recebe um e-mail do Google com o convite.' : 'O app cria uma planilha na sua conta Google com os seus lançamentos e a compartilha com a outra pessoa, que recebe um e-mail do Google. Depois, ela abre o app, entra com a conta convidada e cola o código do convite.'}</div>
    <label for="shEmail">E-mail da conta Google da outra pessoa</label>
    <input id="shEmail" type="email" autocomplete="off" placeholder="nome@gmail.com">
    <div class="hint">O Google vai pedir sua autorização para o app criar e compartilhar a planilha.</div>
    <div class="err" id="shErr"></div>
    <div class="btns foot"><button class="btn" onclick="shareBack()">Cancelar</button><button class="btn primary" onclick="${sync.shared ? 'shareInvite' : 'shareStart'}(document.getElementById('shEmail').value)">Convidar</button></div>`
  : `<h3>Entrar numa conta compartilhada</h3>
    <div class="hint" style="margin-top:0">Cole o código (ou o link da planilha) que a outra pessoa te mandou. Você precisa estar com a conta Google que foi convidada${Android.conta && Android.conta() ? ` (agora: <b>${esc(Android.conta())}</b>)` : ''}.</div>
    <label for="shCode">Código do convite</label>
    <input id="shCode" type="text" autocomplete="off">
    <div class="err" id="shErr"></div>
    <div class="btns foot"><button class="btn" onclick="shareBack()">Cancelar</button><button class="btn primary" onclick="shareJoin(document.getElementById('shCode').value)">Entrar</button></div>`);
}
const shErr = m => { const e = document.getElementById('shErr'); if (e) e.textContent = m; else tell(m); };
// Aberta pela pergunta do primeiro acesso (askShare): ao terminar ou cancelar, segue para as próximas telas de início.
let shareFromStart = false;
function shareBack(){ if (shareFromStart){ shareFromStart = false; closeForm(); startSheets(); } else openSettings('compart'); }
// Tela de permissão do Google: o app abre sozinho, mas o aviso de "app não verificado" e o "Permitir" são da pessoa.
// Antes da primeira vez, explica o que tocar; se a autorização não for concluída, mostra como fazer.
const PASSOS_GOOGLE = '1. Se aparecer "O Google não verificou este app", toque em "Avançado" e depois em "Acessar Minhas Finanças (não seguro)". O aviso aparece porque o app ainda não passou pela verificação do Google; os dados ficam só na sua conta.\n2. Marque as caixas de permissão (Planilhas e arquivos do Drive criados pelo app).\n3. Toque em "Continuar".';
async function famPrepare(){
  if (sync.famOk) return true;
  return ask(`Agora o Google vai pedir sua permissão para o app criar e ler a planilha da conta compartilhada.\n\n${PASSOS_GOOGLE}`, 'Abrir a tela do Google');
}
function famNegado(){ tell(`A permissão do Google não foi concluída, então a conta compartilhada não foi ligada.\n\nPara tentar de novo, toque outra vez no botão e, na tela do Google:\n${PASSOS_GOOGLE}`); }
// Toque duplo num botão que fala com o Google (criar, convidar, entrar, sair) não roda a ação duas vezes.
const umaVez = fn => { let ocupado = false; return async (...a) => { if (ocupado) return; ocupado = true; try { return await fn(...a); } finally { ocupado = false; } }; };
const shareInvite = umaVez(async function(email, quieto){
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return shErr('Digite um e-mail válido.');
  const r = await fam('POST', `${DRIVE}/drive/v3/files/${shared()}/permissions?sendNotificationEmail=true&emailMessage=${encodeURIComponent(inviteText(shared()))}`, JSON.stringify({role:'writer', type:'user', emailAddress:email}), 'application/json', true);
  if (r.status !== 200){
    logErr('convidar', r.status + ' ' + String(r.text).slice(0, 300));
    if (!quieto) shErr('Não consegui enviar o convite pelo Google (' + r.status + '). Copie o convite e compartilhe a planilha com essa pessoa pelo app do Google Planilhas.');
    return false;
  }
  sync.shared.with = [...new Set([...(sync.shared.with || []), email])]; saveSync();
  if (!quieto){ toast('Convite enviado para ' + email); shareBack(); }
  return true;
});
// Cria a conta compartilhada com os dados deste aparelho e convida a outra pessoa.
const shareStart = umaVez(async function(email, semPerguntar){
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return shErr('Digite um e-mail válido.');
  if (db.archUntil) return shErr('Antes de compartilhar, traga de volta os anos arquivados (Configurações > Dados e ajustes > Anos antigos).');
  if (!semPerguntar && !await ask(`Criar a conta compartilhada com ${email}?\n\nOs seus lançamentos vão para uma planilha na sua conta Google, que ${email} poderá ver e editar pelo app.`, 'Criar e convidar')) return;
  if (!semPerguntar && !await famPrepare()) return;
  try {
    await syncNow(); // os dados pessoais ficam em dia na sua conta antes de passar a usar a planilha
    const corpo = {properties:{title:'Minhas Finanças (conta compartilhada)'}, sheets:[{properties:{title:'leia-me'}}, {properties:{title:'dados'}}]};
    const id = JSON.parse(ok(await fam('POST', SHEETS, JSON.stringify(corpo), 'application/json', true)).text).spreadsheetId;
    sync.famOk = true;
    await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A1:A3')}?valueInputOption=RAW`, JSON.stringify({values:[['Esta planilha guarda os dados do app Minhas Finanças compartilhados entre contas Google.'], ['Não edite nem apague: o app lê e grava a aba "dados".'], ['Para parar de compartilhar, use "Sair da conta compartilhada" no app.']]}), 'application/json');
    claimMine(); save(false);
    await sharedWrite(id, JSON.stringify(db));
    sync.shared = {id, owner:true, with:[]}; saveSync();
    const convidou = await shareInvite(email, true);
    await syncNow();
    showSheet(`<h3>Conta compartilhada criada</h3>
      <div class="hint" style="margin-top:0">${convidou ? `${esc(email)} vai receber um e-mail do Google.` : `Não consegui enviar o convite pelo Google. Abra a planilha "Minhas Finanças (conta compartilhada)" no Google Planilhas e compartilhe com ${esc(email)} como editor.`} Mande também o código abaixo: no app, a pessoa abre Configurações > Conta compartilhada > Tenho um convite.</div>
      <textarea readonly style="min-height:70px">${esc(id)}</textarea>
      <div class="btns foot"><button class="btn" onclick="shareCopy()">Copiar convite</button><button class="btn primary" onclick="shareBack()">Pronto</button></div>`);
  } catch(e){
    logErr('compartilhar', e.status ? e.status + ' ' + String(e.text).slice(0, 300) : e);
    sync.shared = null; saveSync();
    if (e.status === -1) return famNegado();
    shErr(sharedMsg(e) || (e.status === 0 ? 'Sem conexão com a internet.' : e.status === -1 ? 'É preciso autorizar o acesso na conta Google.' : 'Não foi possível criar a conta compartilhada agora.'));
  }
});
function shareCopy(){
  const t = inviteText(shared());
  if (window.Android && Android.copiar) Android.copiar(t); else navigator.clipboard && navigator.clipboard.writeText(t);
  toast('Convite copiado. Mande para a outra pessoa.');
}
// Entra na conta compartilhada de outra pessoa. escolha: 'juntar' (leva os seus lançamentos junto) ou 'so' (usa só os de lá).
const shareJoin = umaVez(async function(code, escolha){
  const id = codeOf(code);
  if (!id) return shErr('Código inválido. Cole o código inteiro que a outra pessoa mandou.');
  let remote;
  if (!escolha && !await famPrepare()) return;
  try {
    await syncNow();
    remote = await sharedRead(id, true);
    sync.famOk = true;
    if (!remote) throw {status:404, text:'vazia'};
    remote = fixDb(remote);
    if (newerDb(remote)) return shErr('Os dados compartilhados foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.');
  } catch(e){
    if (e.status === undefined) throw e;
    logErr('entrar compartilhada', e.status + ' ' + String(e.text).slice(0, 300));
    if (e.status === -1) return famNegado();
    return shErr(sharedMsg(e) || (e.status === 0 ? 'Sem conexão com a internet.' : 'Não foi possível abrir a conta compartilhada (' + e.status + ').'));
  }
  if (!escolha){
    const temMeus = COLS.some(c => db[c].length);
    if (!temMeus) escolha = 'so';
    else return pickList('E os lançamentos que já estão neste app?', [['juntar', 'Juntar aos da conta compartilhada'], ['so', 'Usar só os da conta compartilhada (os meus continuam guardados na minha conta)']], '', v => shareJoin(id, v));
  }
  const prefs = db.prefs;
  if (escolha === 'juntar'){ claimMine(); loadDb({...mergeDb(db, remote), prefs}); }
  else loadDb({...remote, prefs});
  rollover(); save(false);
  sync.shared = {id, owner:false}; saveSync();
  await syncNow();
  closeForm(); render();
  toast(comNome('Pronto, {nome}! Agora vocês veem os mesmos lançamentos.'));
  if (shareFromStart){ shareFromStart = false; startSheets(); }
});

// Logo depois do login (antes do nome e do tutorial): pergunta se a pessoa vai usar uma conta compartilhada.
function askShare(){
  settingsOpen = false; F = null;
  showSheet(`<div class="tour"><span class="tourIco">${I('people', 40)}</span>
    <h3>Você vai usar uma conta compartilhada?</h3>
    <p>Casal ou família: duas contas Google vendo e lançando nos mesmos ganhos, gastos e investimentos, cada pessoa no próprio celular. Dá para ligar depois em Configurações › Conta compartilhada.</p></div>
    <div class="btns" style="flex-direction:column">
      <button class="btn primary" onclick="askShareAns('entrar')">${I('people')}Sim, recebi um código de convite</button>
      <button class="btn" onclick="askShareAns('convidar')">Sim, quero convidar alguém</button>
      <button class="btn" onclick="askShareAns('')">Não, vou usar só eu</button></div>`);
}
function askShareAns(modo){
  sync.askedShare = true; saveSync();
  if (!modo){ closeForm(); return startSheets(); }
  shareFromStart = true; openShare(modo);
}
// Volta a usar só a sua conta: os dados deste aparelho passam a ser os da sua conta pessoal (como antes de compartilhar).
const shareLeave = umaVez(async function(semPerguntar){
  if (!semPerguntar && !await ask('Sair da conta compartilhada?\n\nEste aparelho volta a mostrar só os seus dados pessoais, como estavam antes de compartilhar. Os dados compartilhados continuam na planilha para a outra pessoa.', 'Sair', true)) return;
  await syncNow();
  // Primeiro baixa os dados pessoais; sem eles (sem internet), não sai: senão os compartilhados iriam para a conta pessoal.
  let pessoal;
  try { const file = (await driveList("name='financas.json'", true))[0]; pessoal = file ? fixDb(await driveGet(file.id)) : fixDb({}); }
  catch(e){ logErr('sair compartilhada', e.status || e); return tell('Não consegui baixar os seus dados pessoais (sem internet?). Tente de novo.'); }
  sync.shared = null; saveSync();
  loadDb({...pessoal, prefs:db.prefs}); rollover(); save(false);
  await syncNow();
  closeForm(); render();
  toast('Você saiu da conta compartilhada.');
});

// Junta os dados deste aparelho (a) com os da conta (b):
// - lançamentos: um a um pelo id, valendo a versão alterada por último (u); excluídos (tomb) não voltam;
// - configurações (tema, abas, orçamentos, fechamento do cartão): vale o lado que mexeu nelas por último (cfgMod);
// - históricos mensais: soma dos dois lados, preferindo o deste aparelho.
function mergeDb(a, b){
  const tomb = {...b.tomb};
  for (const [id, t] of Object.entries(a.tomb || {})) tomb[id] = Math.max(t, tomb[id] || 0);
  for (const id in tomb) if (tomb[id] < Date.now() - 90*864e5) delete tomb[id]; // 90 dias bastam para todos os aparelhos saberem
  const out = {...b, ...a, tomb, mod:Math.max(a.mod || 0, b.mod || 0)};
  for (const c of COLS){
    const byId = new Map((b[c] || []).map(r => [r.id, r]));
    for (const r of a[c] || []){ const o = byId.get(r.id); if (!o || (r.u || 0) >= (o.u || 0)) byId.set(r.id, r); }
    out[c] = [...byId.values()].filter(r => !(tomb[r.id] >= (r.u || 0)));
  }
  const cfg = (b.cfgMod || 0) > (a.cfgMod || 0) ? b : a;
  Object.assign(out, {prefs:cfg.prefs, budgets:cfg.budgets, cardClose:cfg.cardClose, cardDue:cfg.cardDue, cardAcc:cfg.cardAcc, cardLimit:cfg.cardLimit, archUntil:cfg.archUntil || '', cats:cfg.cats, cfgMod:cfg.cfgMod});
  out.catMemo = {...b.catMemo, ...a.catMemo};
  out.yieldLog = {...b.yieldLog, ...a.yieldLog};
  out.netLog = {...b.netLog, ...a.netLog};
  return out;
}
// Texto para comparar dois estados sem depender da ordem das chaves.
const SYNCED = [...COLS, 'tomb', 'prefs', 'budgets', 'cardClose', 'cardDue', 'cardAcc', 'cardLimit', 'archUntil', 'cats', 'catMemo', 'yieldLog', 'netLog'];
const canon = d => JSON.stringify(SYNCED.map(k => d[k]), (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([x],[y]) => x < y ? -1 : 1)) : v);

let retryTimer = 0;
const retryDelay = n => Math.min(30e3 * 2 ** (n - 1), 30 * 60e3);
// Quantas alterações a junção trouxe para este aparelho: registros novos, mais recentes ou excluídos em outro lugar.
function incoming(a, m){
  let n = 0;
  for (const c of COLS){
    const meus = new Map(a[c].map(r => [r.id, r.u || 0])), ids = new Set(m[c].map(r => r.id));
    for (const r of m[c]) if (!meus.has(r.id) || (r.u || 0) > meus.get(r.id)) n++;
    for (const r of a[c]) if (!ids.has(r.id)) n++;
  }
  return n;
}
const BEFORE_KEY = 'financas-antes';
function keepBefore(){ try { localStorage.setItem(BEFORE_KEY, JSON.stringify({at:Date.now(), db:JSON.stringify(db)})); } catch(e){} }
function beforeInfo(){ try { return JSON.parse(localStorage.getItem(BEFORE_KEY)); } catch(e){ return null; } }
async function restoreBefore(){
  const o = beforeInfo();
  if (!o) return;
  if (!await ask(`Voltar este aparelho ao estado de ${new Date(o.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}, antes da última junção com a conta?\nO que veio de outros aparelhos nessa junção será desfeito em todos eles.`, 'Voltar', true)) return;
  applySnapshot(fixDb(JSON.parse(o.db)));
  try { localStorage.removeItem(BEFORE_KEY); } catch(e){}
  syncNow();
}
const beforeHtml = () => { const o = beforeInfo(); return o ? `<div class="btns"><button class="btn" onclick="restoreBefore()">${I('history')}Desfazer a última junção (${new Date(o.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})})</button></div>` : ''; };
// Troca os dados pelos de uma cópia, de modo que a troca valha em todos os aparelhos: tudo o que veio da cópia fica
// como "alterado agora", e o que existe hoje mas não existia nela é marcado como excluído.
function applySnapshot(snap){
  const t = Date.now(), ids = new Set();
  for (const c of COLS) for (const r of snap[c]){ r.u = t; ids.add(r.id); }
  snap.tomb = {};
  for (const c of COLS) for (const r of db[c]) if (!ids.has(r.id)) snap.tomb[r.id] = t;
  snap.cfgMod = t;
  loadDb(snap); rollover(); save(); closeForm(); render();
}
// Sem conexão: aviso discreto no topo das telas. As alterações ficam salvas no aparelho e sobem depois.
const offline = () => navigator.onLine === false || (canSync() && sync.on && sync.err === 'Sem conexão com a internet.');
const offlinePill = () => offline() ? `<div class="offline">${I('signal', 14)}Sem conexão: o que você lançar fica salvo e sincroniza depois.</div>` : '';
addEventListener('online', () => { render(); syncNow(); });
addEventListener('offline', () => render());
function scheduleSync(){ if (!canSync() || !sync.on) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 3000); }
async function syncNow(interactive){
  if (!canSync() || !sync.on) return;
  if (syncing){ syncAgain = true; return; } // houve alteração durante a sincronização: repete ao terminar
  syncing = true;
  try {
    // Na conta compartilhada, os dados vêm da planilha (sharedRead); senão, do arquivo na pasta oculta do Drive.
    const sid = shared(), file = sid ? null : (await driveList("name='financas.json'", interactive))[0];
    const bruto = sid ? await sharedRead(sid, interactive) : file ? await driveGet(file.id) : null, remote = bruto && fixDb(bruto);
    if (newerDb(remote)) throw {status:-3};
    if (remote){
      const merged = mergeDb(db, remote);
      if (sid) merged.prefs = db.prefs; // nome e aparência são de cada pessoa
      if (canonS(merged) !== canonS(db)){
        const veio = incoming(db, merged);
        keepBefore(); // cópia deste aparelho antes de juntar, para poder desfazer
        loadDb(merged); rollover(); save(false); if (!sheetOpen()) render();
        if (veio) toast(`Sincronizado: ${veio} ${veio > 1 ? 'alterações vieram' : 'alteração veio'} de outro aparelho.`);
      }
    }
    if (!remote || canonS(db) !== canonS(remote)) await (sid ? sharedWrite(sid, JSON.stringify(db)) : driveWrite(file && file.id, 'financas.json', JSON.stringify(db)));
    Object.assign(sync, {linked:true, at:Date.now(), err:'', retry:0});
    clearTimeout(retryTimer);
    await dailyBackup().catch(() => {}); // a cópia diária não pode derrubar a sincronização
    await syncPhotos().catch(() => {});  // comprovantes pendentes: se falhar, ficam na fila para a próxima vez
    await sheetSync().catch(() => {});   // planilha do Google ligada ao app (se houver)
  } catch(e){
    if (e.status !== 0 && e.status !== -1) logErr('sincronizar', e.status ? e.status + ' ' + String(e.text).slice(0, 300) : e);
    sync.err = e.status === -3 ? 'Os dados da conta foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.'
      : shared() && sharedMsg(e) ? sharedMsg(e)
      : e.status === -1 ? 'É preciso entrar na conta Google.' : e.status === 0 ? 'Sem conexão com a internet.'
      : 'Erro ao sincronizar' + (e.status ? ` (${e.status}): ` + String(e.text).slice(0, 200) : '.');
    // Sem internet ou falha do servidor: tenta de novo sozinho, esperando cada vez mais (30 s, 1 min, 2 min… até 30 min).
    if (e.status === 0 || e.status >= 500 || e.status === undefined){
      sync.retry = Math.min((sync.retry || 0) + 1, 8);
      clearTimeout(retryTimer); retryTimer = setTimeout(syncNow, retryDelay(sync.retry));
    }
  } finally {
    syncing = false;
    saveSync();
    if (settingsShown()) openSettings();
    if (syncAgain){ syncAgain = false; scheduleSync(); }
  }
}
// Uma cópia por dia na conta, guardada por 30 dias, para desfazer um erro ou uma importação errada.
const dayStr = t => new Date(t).toLocaleDateString('sv'); // AAAA-MM-DD
async function dailyBackup(){
  const today = dayStr(Date.now());
  if (sync.bk === today) return;
  const files = await driveList("name contains 'backup-'");
  if (!files.some(f => f.name === `backup-${today}.json`)) await driveWrite(null, `backup-${today}.json`, JSON.stringify(db));
  const oldest = `backup-${dayStr(Date.now() - 30*864e5)}.json`;
  for (const f of files) if (f.name < oldest) await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`);
  sync.bk = today;
}
async function openBackups(){
  settingsOpen = false; F = null;
  showSheet('<h3>Versões salvas na conta</h3><div class="hint">Carregando…</div>');
  let files;
  try { files = await driveList("name contains 'backup-'"); }
  catch(e){ return showSheet('<h3>Versões salvas na conta</h3><div class="hint">Não foi possível carregar. Verifique a internet.</div><div class="btns"><button class="btn" onclick="openSettings(\'conta\')">Voltar</button></div>'); }
  showSheet(`<h3>Versões salvas na conta</h3>
    <div class="hint" style="margin-top:0">O app guarda uma cópia por dia de uso, por 30 dias. Restaurar troca todos os dados atuais pelos daquele dia, em todos os aparelhos.</div>
    ${files.length ? files.map(f => `<div class="item" data-id="${esc(f.id)}" data-name="${esc(f.name)}" onclick="restoreBackup(this.dataset.id,this.dataset.name)"><div class="mid"><b>${fmtDate(f.name.slice(7, 17))}</b></div><div class="muted">Restaurar ›</div></div>`).join('') : '<div class="hint">Ainda não há cópias. A primeira é criada na próxima sincronização.</div>'}
    <div class="btns"><button class="btn" onclick="openSettings('conta')">Voltar</button></div>`);
}
async function restoreBackup(id, name){
  if (!await ask(`Restaurar os dados de ${fmtDate(name.slice(7, 17))}?\nOs dados atuais serão substituídos.`, 'Restaurar', true)) return;
  let snap;
  try { snap = fixDb(await driveGet(id)); } catch(e){ return tell('Não foi possível baixar essa versão.'); }
  // Para a restauração valer em todos os aparelhos: tudo o que veio da cópia fica como "alterado agora",
  // e o que existe hoje mas não existia nela é marcado como excluído.
  applySnapshot(snap);
  syncNow();
}
// Sair da conta (para trocar de conta): envia o que falta, apaga os dados deste aparelho e volta ao login.
// Os dados precisam sair do aparelho; senão, ao entrar com outra conta, eles seriam misturados aos dela.
async function logout(){
  if (!await ask('Sair da conta Google?\n\nOs dados deste aparelho serão apagados. Eles continuam salvos na sua conta e voltam quando você entrar de novo com ela.', 'Sair', true)) return;
  if (canSync()){
    await syncNow();
    if (sync.err && !await ask(`Não foi possível sincronizar agora (${sync.err})\n\nSe sair mesmo assim, as alterações ainda não enviadas serão perdidas. Sair?`, 'Sair mesmo assim', true)) return;
    if (Android.sair) Android.sair(); // o próximo login volta a perguntar qual conta usar
  }
  clearTimeout(syncTimer);
  db.expenses.filter(x => x.photo).forEach(x => photoDelete(x.id)); // as fotos continuam na conta; aqui saem junto com os dados
  // Tema e ordem das abas ficam; lançamentos e nome, não. Sem cfgMod, as preferências da próxima conta valem sobre estas.
  db = fixDb({rates:db.rates, prefs:{...db.prefs, name:'', greet:''}});
  applyCats();
  chatLog.length = 0;
  Object.assign(sync, {on:false, linked:false, demo:false, err:'', at:0, bk:'', up:[], del:[], shared:null});
  saveSync(); save(false); closeForm(); render(); showGate();
}
// Apaga tudo: os arquivos do app na conta Google e os dados deste aparelho; depois volta à tela de login.
async function wipeAll(semPerguntar){
  // Na conta compartilhada, apagar tudo apagaria os dados da outra pessoa também.
  if (shared()){ tell('Você está numa conta compartilhada. Saia dela antes (Configurações > Conta compartilhada) para apagar os seus dados.'); return; }
  if (!semPerguntar){
    if (!await ask('Apagar todos os seus dados?\n\nSomem os lançamentos deste aparelho e os da sua conta Google, com as cópias diárias e os comprovantes. Outros aparelhos com esta conta também ficam sem os dados.', 'Apagar tudo', true)) return;
    if (!await ask('Tem certeza? Isso não pode ser desfeito.', 'Sim, apagar', true)) return;
  }
  if (canSync() && sync.on){
    try {
      for (let volta = 0; volta < 20; volta++){
        const files = await driveList('trashed=false');
        if (!files.length) break;
        for (const f of files) ok(await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`));
      }
    } catch(e){ return tell('Não consegui apagar os dados da conta Google (sem internet?). Nada foi apagado neste aparelho; tente de novo.'); }
    if (Android.sair) Android.sair();
  }
  clearTimeout(syncTimer); clearTimeout(retryTimer);
  db.expenses.filter(x => x.photo).forEach(x => photoDelete(x.id));
  for (const k of [KEY, ERR_KEY, BEFORE_KEY, FUN_KEY, HIDE_KEY, VER_KEY, DRAFT]) try { localStorage.removeItem(k); } catch(e){}
  if (!fileStore()) idbWrite('').catch(() => {});
  if (window.Android && Android.dadosApagar) Android.dadosApagar();
  db = fixDb({});
  ensurePrefs(); applyCats(); applyTheme();
  chatLog.length = 0; hideVals = false;
  Object.assign(sync, {on:false, linked:false, demo:false, err:'', at:0, bk:'', up:[], del:[], tries:{}, retry:0, welcomed:false, lockAsked:sync.lockAsked, shared:null, tour:false, account:'', askedShare:false, famOk:false});
  saveSync(); save(false); closeForm(); render(); showGate();
}
// ---------- Arquivo de anos antigos ----------
// Tira dos dados do dia a dia os lançamentos até o ano Y (inclusive) e guarda num arquivo na conta Google, para a
// sincronização não crescer para sempre. Vão para o arquivo: ganhos e gastos avulsos do período, fixos que já terminaram,
// compras parceladas já encerradas e transferências. Ordem segura: grava o arquivo, confere lendo de volta e só então tira.
const ARCH_COLS = ['incomes', 'expenses', 'installments', 'transfers'];
function archPick(Y){
  const ate = ym => ym && ym.slice(0, 4) <= Y;
  return {
    incomes:db.incomes.filter(x => x.fixed ? ate(x.end) : ate(x.start)),
    expenses:db.expenses.filter(x => x.fixed ? ate(x.end) : ate(x.start)),
    installments:db.installments.filter(p => ate(addMonths(p.start, p.n - 1))),
    transfers:db.transfers.filter(t => ate(t.month))};
}
async function archiveUntil(Y, semPerguntar){
  if (!(canSync() && sync.on)) return tell('O arquivo fica na sua conta Google: entre com a conta para usar.');
  if (shared()) return tell('Na conta compartilhada ainda não dá para arquivar anos antigos (o arquivo ficaria só na sua conta).');
  const pick = archPick(Y), n = ARCH_COLS.reduce((t, c) => t + pick[c].length, 0);
  if (!n) return tell(`Não há lançamentos até ${Y} para arquivar.`);
  if (!semPerguntar && !await ask(`Arquivar ${n} lançamentos de ${Y} e antes?\n\nEles saem dos dados do dia a dia (a sincronização fica mais leve) e vão para um arquivo na sua conta Google. Os resumos desses anos continuam aparecendo, mas os lançamentos não podem ser editados enquanto estiverem arquivados. Dá para trazer de volta.`, 'Arquivar')) return;
  try {
    const f = (await driveList("name='arquivo.json'"))[0], velho = f ? await driveGet(f.id) : {};
    const novo = {until:[Y, velho.until || ''].sort().pop()};
    for (const c of ARCH_COLS){ const m = new Map((velho[c] || []).map(r => [r.id, r])); for (const r of pick[c]) m.set(r.id, r); novo[c] = [...m.values()]; }
    await driveWrite(f && f.id, 'arquivo.json', JSON.stringify(novo));
    const g = (await driveList("name='arquivo.json'"))[0], conf = g ? await driveGet(g.id) : {};
    if (ARCH_COLS.some(c => (conf[c] || []).length !== novo[c].length)) throw new Error('a conferência do arquivo não bateu');
    // Contas acompanhadas desde o período arquivado: o saldo do fim dele vira o saldo inicial, e os saldos não mudam.
    for (const a of db.accounts) if (a.since.slice(0, 4) <= Y) Object.assign(touch(a), {initial:round2(accountBalance(a, monthEnd(Y + '-12'))), since:(+Y + 1) + '-01'});
    const t = Date.now();
    for (const c of ARCH_COLS){ const ids = new Set(pick[c].map(r => r.id)); db[c] = db[c].filter(r => !ids.has(r.id)); ids.forEach(id => db.tomb[id] = t); }
    db.archUntil = novo.until; db.cfgMod = t;
    arch = novo; try { localStorage.setItem(ARCH_KEY, JSON.stringify(novo)); } catch(e){}
    save(); closeForm(); render();
    await syncNow();
    toast(`${n} lançamentos arquivados.`);
  } catch(e){ logErr('arquivar', e); tell('Não foi possível arquivar agora (sem internet?). Nada foi tirado dos seus dados.'); }
}
async function archiveRestore(semPerguntar){
  if (!semPerguntar && !await ask('Trazer de volta todos os lançamentos arquivados?\nEles voltam a ser editáveis e a sincronizar normalmente.', 'Trazer de volta')) return;
  if (!arch && canSync() && sync.on) try { const f = (await driveList("name='arquivo.json'"))[0]; if (f) arch = await driveGet(f.id); } catch(e){}
  if (!arch) return tell('Não consegui abrir o arquivo (sem internet?). Tente de novo.');
  const t = Date.now();
  for (const c of ARCH_COLS) for (const r of arch[c] || []) if (!db[c].some(x => x.id === r.id)){ db[c].push({...r, u:t}); delete db.tomb[r.id]; }
  db.archUntil = ''; db.cfgMod = t; arch = null;
  try { localStorage.removeItem(ARCH_KEY); } catch(e){}
  save(); closeForm(); render();
  await syncNow();
  try { const f = (await driveList("name='arquivo.json'"))[0]; if (f) ok(await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`)); } catch(e){}
  toast('Lançamentos trazidos de volta.');
}
function archHtml(){
  const ultimo = String(now.getFullYear() - 1), anos = [...new Set([...db.incomes, ...db.expenses].map(x => x.start.slice(0, 4)))].filter(y => y <= ultimo).sort();
  if ((!db.archUntil && !anos.length) || shared()) return '';
  return `<label>Anos antigos</label>
    ${db.archUntil ? `<div class="hint" style="margin-top:0">Arquivado até ${db.archUntil}.</div>` : ''}
    <div class="btns" style="margin-top:${db.archUntil ? 8 : 0}px">${anos.length ? `<button class="btn" onclick="archivePick()">${I('box')}Arquivar anos antigos</button>` : ''}${db.archUntil ? '<button class="btn" onclick="archiveRestore()">Trazer de volta</button>' : ''}</div>
    <div class="hint">Tira da sincronização do dia a dia os lançamentos de anos que já passaram e guarda num arquivo na sua conta Google. Os resumos desses anos continuam aparecendo.</div>`;
}
function archivePick(){
  const ultimo = String(now.getFullYear() - 1), anos = [...new Set([...db.incomes, ...db.expenses].map(x => x.start.slice(0, 4)))].filter(y => y <= ultimo).sort().reverse();
  pickList('Arquivar até o ano (inclusive)', anos.map(y => [y, y]), '', y => archiveUntil(y));
}
function syncSection(){
  if (!canSync()) return !isPreview ? '' : `<label>Conta Google</label><div class="hint in" style="margin-top:0">${I('check', 14)} Conectado (demonstração)</div>
    <div class="btns"><button class="btn" disabled style="opacity:.5">${I('history')}Versões salvas</button><button class="btn danger" style="flex:1" onclick="logout()">Sair ou trocar de conta</button></div>`;
  const status = syncing ? 'Sincronizando…' : sync.err ? `<span class="warn">${I('alert', 14)}</span> ` + esc(sync.err)
    : sync.at ? `<span class="in">${I('check', 14)}</span> Sincronizado em ` + new Date(sync.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : 'Ainda não sincronizado.';
  const email = Android.conta ? Android.conta() : '';
  return `<label>Conta Google</label>${email ? `<div class="hint" style="margin-top:0">Conectado como <b>${esc(email)}</b></div>` : ''}<div class="hint" style="margin-top:${email ? 4 : 0}px">${status}</div>
    <div class="btns"><button class="btn" onclick="syncNow(true)">${I('refresh')}Sincronizar agora</button><button class="btn" onclick="openBackups()">${I('history')}Versões salvas</button></div>
    ${beforeHtml()}
    <div class="btns"><button class="btn danger" style="flex:1" onclick="logout()">Sair ou trocar de conta</button></div>`;
}

// ---------- Primeiro uso: login obrigatório e convite para ligar o bloqueio ----------
const needGate = () => canSync() ? !sync.linked : isPreview && !sync.demo;
function showGate(){
  document.getElementById('gateMsg').textContent = WEB_APP && !WEB_CLIENT_ID ? 'O login da versão web ainda não foi configurado.'
    : iosNoBrowser() ? 'Dica: para usar como app, toque em Compartilhar (□↑) e depois em "Adicionar à Tela de Início".'
    : isPreview && !canSync() ? 'Prévia no PC: o login de verdade só acontece no celular.' : '';
  document.getElementById('gate').hidden = false;
}
async function loginGoogle(){
  const msg = document.getElementById('gateMsg');
  if (canSync()){
    msg.textContent = 'Entrando…';
    sync.on = true;
    await syncNow(true);
    if (!sync.linked){ msg.textContent = sync.err || 'Não foi possível entrar. Tente de novo.'; return; }
    // Conta diferente da última usada neste aparelho: boas-vindas, tutorial e novidades de novo.
    const conta = Android.conta ? Android.conta() : '';
    if (conta && conta !== sync.account) Object.assign(sync, {account:conta, tour:false, welcomed:false, forceNews:true, askedShare:false, famOk:false});
    saveSync();
  } else { sync.demo = true; saveSync(); }
  document.getElementById('gate').hidden = true;
  render();
  startSheets(); // termina no convite do bloqueio, depois das outras telas (nunca duas de uma vez)
}
// Boas-vindas: três passos no primeiro uso (app sem nenhum dado). Depois de salvar cada passo, volta a esta tela.
let welcomeOn = false;
const WELCOME = [
  ['briefcase', 'Cadastre seu salário', 'Ele entra sozinho em todos os meses.', () => db.incomes.some(x => x.fixed), () => openForm('incomes')],
  ['home', 'Cadastre um gasto fixo', 'Aluguel, internet, academia…', () => db.expenses.some(x => x.fixed), () => openForm('expenses', null, {vals:{fixed:'1', cat:'moradia'}, more:true})],
  ['bank', 'Cadastre uma conta do banco', 'Para acompanhar o saldo dela.', () => db.accounts.length > 0, () => openForm('accounts')]];
function maybeWelcome(){
  if (sync.welcomed || db.incomes.length || db.expenses.length || db.accounts.length || db.installments.length) return false;
  openWelcome();
  return true;
}
function openWelcome(){
  settingsOpen = false; F = null;
  const feitos = WELCOME.filter(s => s[3]()).length;
  showSheet(`<h3>${greeting() || 'Boas-vindas!'}</h3>
    <div class="hint" style="margin-top:0">Três passos para o app começar a mostrar o seu mês. Dá para pular e fazer depois.</div>
    ${WELCOME.map(([ic, t, s, ok], i) => `<div class="item" onclick="welcomeGo(${i})">${tile(ic)}<div class="mid"><b>${i + 1}. ${t}</b><small>${s}</small></div><span class="${ok() ? 'in' : 'muted'}">${I(ok() ? 'checked' : 'unchecked', 26)}</span></div>`).join('')}
    <div class="btns foot"><button class="btn primary" onclick="welcomeDone()">${feitos === WELCOME.length ? 'Concluir' : 'Pular por agora'}</button></div>`);
  welcomeOn = true;
}
function welcomeGo(i){ WELCOME[i][4](); welcomeOn = true; }
function welcomeDone(){ sync.welcomed = true; saveSync(); closeForm(); startSheets(); }

// ---------- Nome e tutorial ----------
// O nome fica nas preferências (db.prefs.name), que acompanham a conta pessoal; na conta compartilhada elas não são
// trocadas entre as pessoas, então cada uma vê o próprio nome. greet: 'o' bem-vindo, 'a' bem-vinda, 'e' boas-vindas.
let nameGreet = '';
function askName(daConfig){
  settingsOpen = false; F = null;
  const sugestao = db.prefs.name || (window.Android && Android.nome ? Android.nome() : '');
  nameGreet = db.prefs.greet || 'e';
  // A saudação do topo sai do sexo informado: "Bem-vindo", "Bem-vinda" ou, sem informar, "Boas-vindas".
  const opcoes = () => [['o', 'Masculino'], ['a', 'Feminino'], ['e', 'Prefiro não dizer']].map(([k, t]) => `<button type="button" class="btn ${nameGreet === k ? 'primary' : ''}" style="padding:11px 4px" onclick="nameGreet='${k}';this.parentNode.querySelectorAll('.btn').forEach(b=>b.classList.toggle('primary',b===this))">${t}</button>`).join('');
  showSheet(`<h3>Como você quer ser chamado?</h3>
    <div class="hint" style="margin-top:0">O nome aparece no topo do Resumo e nas mensagens do app. Fica só neste app: numa conta compartilhada, cada pessoa vê o próprio nome no seu celular.</div>
    <label for="nmIn">Seu nome</label>
    <input id="nmIn" type="text" maxlength="30" autocomplete="given-name" value="${esc(sugestao)}" onkeydown="if(event.key==='Enter')nameSave(${!!daConfig})">
    <label>Sexo</label>
    <div class="btns" style="margin-top:0">${opcoes()}</div>
    <div class="err" id="nmErr"></div>
    <div class="btns foot">${daConfig ? `<button class="btn" onclick="openSettings('perfil')">Cancelar</button>` : ''}<button class="btn primary" onclick="nameSave(${!!daConfig})">${daConfig ? 'Salvar' : 'Continuar'}</button></div>`);
}
function nameSave(daConfig){
  const n = document.getElementById('nmIn').value.trim().replace(/\s+/g, ' ');
  if (!n) return document.getElementById('nmErr').textContent = 'Digite o seu nome (ou um apelido).';
  Object.assign(db.prefs, {name:n, greet:nameGreet}); db.cfgMod = Date.now();
  if (sync.shared) claimMine(); // na conta compartilhada, o que foi lançado sem nome passa a ser seu
  save(); render();
  if (daConfig) openSettings('perfil'); else { closeForm(); startSheets(); }
}
// Tutorial: boas-vindas e um passeio rápido pelas funções. Abre sozinho uma vez por conta; dá para rever no Perfil.
const TOUR = [
  ['piggy', () => `${greeting() || 'Boas-vindas!'}`, 'Este é o Minhas Finanças: seus ganhos, gastos, contas e investimentos num lugar só, salvos na sua conta Google. Veja em um minuto como usar.'],
  ['plus', 'Lançar é rápido', 'Toque no + (ou nos atalhos do Resumo) e informe só o valor e a categoria; o resto fica em "Mais opções". Os gastos que você mais repete viram botões.'],
  ['chart', 'Resumo', 'Saldo do ano, previsão dos próximos meses, contas a vencer e gráficos. O botão de ajustes, no topo, escolhe quais blocos aparecem e em que ordem.'],
  ['receipt', 'Gastos do mês', 'Separados em Assinaturas, Fixos e anuais, Parceladas e Ocasionais, com busca e filtros. Deslize um lançamento para a esquerda para excluir; numa conta com vencimento, para a direita marca como paga.'],
  ['trend', 'Investimentos e metas', 'Cadastre aplicações, ações e metas. O app projeta quanto vão render com CDI, Selic e IPCA e mostra quanto falta para cada meta.'],
  ['chat', 'Assistente', 'Pergunte "quanto gastei com mercado este mês?" ou escreva "gastei 30 no almoço" para lançar sem abrir formulário.'],
  ['calendar', 'Lembretes', 'Contas fixas com dia de vencimento avisam antes e no dia. Para os avisos chegarem na hora, desligue a economia de bateria do app.'],
  ['people', 'Sua conta e a conta compartilhada', 'Tudo sincroniza com a sua conta Google, com uma cópia por dia. Em Configurações > Conta compartilhada, dá para dividir os dados com outra pessoa.'],
  ['gear', 'Do seu jeito', 'Tema, cores, abas do menu, bloqueio com senha e o modo divertido, com mais de 100 conquistas. Tudo em Configurações.']];
function openTour(i, daConfig){
  settingsOpen = false; F = null;
  const [ic, t, s] = TOUR[i], ult = i === TOUR.length - 1;
  showSheet(`<div class="tour"><span class="tourIco">${I(ic, 40)}</span>
    <h3>${typeof t === 'function' ? t() : t}</h3><p>${s}</p>
    <div class="dots">${TOUR.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="btns foot">${i ? `<button class="btn" onclick="openTour(${i - 1},${!!daConfig})">Voltar</button>` : `<button class="btn" onclick="tourDone(${!!daConfig})">Pular</button>`}
      <button class="btn primary" onclick="${ult ? `tourDone(${!!daConfig})` : `openTour(${i + 1},${!!daConfig})`}">${ult ? 'Começar' : 'Próximo'}</button></div>`);
}
function tourDone(daConfig){
  sync.tour = true; saveSync();
  if (daConfig) openSettings('perfil'); else { closeForm(); startSheets(); }
}
// Novidades: mostradas uma vez quando o app abre numa versão diferente da última usada neste aparelho.
const VER_KEY = 'financas-versao';
// Atualização automática (só no APK; ver Updater no lado nativo). tipo: 'web' = telas novas baixadas, entram na próxima
// abertura; 'apk' = é preciso instalar um APK novo (mudou a parte nativa); 'nada' e 'erro' = resposta à busca manual.
async function onAtualizacao(tipo, versao, url, novas){
  if (tipo === 'web'){
    // Com algo aberto (formulário, outra tela), só avisa; a versão nova entra na próxima abertura.
    if (sheetOpen() || !document.getElementById('gate').hidden) toast(`Versão ${versao} baixada. Ela entra na próxima vez que você abrir o app.`);
    else openUpdate(versao, novas, '');
  }
  else if (tipo === 'nada') toast('O app já está na versão mais recente.');
  else if (tipo === 'erro') toast('Não consegui procurar atualizações (sem internet?).');
  else if (tipo === 'apk' && sync.apkAsk !== versao + dayStr(Date.now())){ // no máximo uma vez por dia
    sync.apkAsk = versao + dayStr(Date.now()); saveSync();
    if (!sheetOpen() && document.getElementById('gate').hidden) return openUpdate(versao, novas, url);
    if (await ask(`Saiu a versão ${versao} do app. Esta atualização precisa ser instalada: o Android vai baixar o arquivo e pedir sua confirmação.\n\nSeus dados continuam no aparelho e na sua conta.`, 'Baixar')) Android.abrir(url);
  }
}
const newsHtml = lista => lista.map(([t, s]) => `<div class="item" style="cursor:default"><span class="in">${I('sparkle', 22)}</span><div class="mid"><b style="white-space:normal">${esc(t)}</b><small>${esc(s)}</small></div></div>`).join('');
// Aviso de versão nova, com a prévia do que vem nela. url vazio: as telas já foram baixadas e basta recarregar;
// com url: é preciso baixar e instalar o APK.
function openUpdate(versao, novas, url){
  settingsOpen = false; F = null;
  updUrl = url; updVer = versao;
  showSheet(`<h3>Nova versão ${esc(versao)} disponível</h3>
    <div class="hint" style="margin-top:0">${url ? 'Esta atualização precisa ser instalada: o Android baixa o arquivo e pede sua confirmação. Seus dados continuam no aparelho e na sua conta.' : 'A atualização já foi baixada. Seus dados não mudam.'}</div>
    ${Array.isArray(novas) && novas.length ? `<label>O que vem nesta versão</label>${newsHtml(novas)}` : ''}
    <div class="btns foot"><button class="btn" onclick="closeForm()">Depois</button><button class="btn primary" onclick="updateNow()">${url ? 'Baixar e instalar' : 'Atualizar agora'}</button></div>`);
}
let updUrl = '', updVer = '';
function updateNow(){
  closeForm();
  if (updUrl) return Android.abrir(updUrl);
  try { localStorage.setItem(VER_KEY, updVer); } catch(e){} // a prévia já mostrou as novidades: não repete ao recarregar
  Android.recarregar();
}
// Número de uma versão, para comparar ("1.9" < "1.40").
const verNum = v => String(v).split('.').reduce((a, n) => a * 1000 + (+n || 0), 0);
// sempre = aberta pelas Configurações; sync.forceNews = conta nova neste aparelho (mostra mesmo sem versão nova).
function maybeNews(sempre){
  let last = null;
  try { last = localStorage.getItem(VER_KEY); localStorage.setItem(VER_KEY, APP_VERSION); } catch(e){}
  if (!sempre && !sync.forceNews && (last === APP_VERSION || (!last && !db.expenses.length && !db.incomes.length))) return false;
  if (sync.forceNews){ sync.forceNews = false; saveSync(); }
  settingsOpen = false; F = null;
  // Só o que é novo para esta pessoa: as versões depois da última que ela usou (numa conta nova ou pelas
  // Configurações, só a versão atual).
  const desde = !sempre && last && verNum(last) < verNum(APP_VERSION) ? verNum(last) : verNum(APP_VERSION) - 1;
  const novas = Object.entries(NOVIDADES).filter(([v]) => verNum(v) > desde && verNum(v) <= verNum(APP_VERSION)).sort((a, b) => verNum(b[0]) - verNum(a[0]));
  showSheet(`<h3>Novidades da versão ${APP_VERSION}</h3>
    ${novas.length ? novas.map(([v, lista]) => (novas.length > 1 ? `<label>Versão ${v}</label>` : '') + newsHtml(lista)).join('') : '<div class="hint" style="margin-top:0">Correções e pequenas melhorias.</div>'}
    <div class="btns foot"><button class="btn primary" onclick="${sempre ? "openSettings('perfil')" : 'closeForm();askLock()'}">Entendi</button></div>`);
  return true;
}
// Folhas que abrem sozinhas ao iniciar, uma depois da outra: nome, tutorial (uma vez por conta), primeiros passos
// (app vazio) e novidades (versão nova ou conta nova).
function startSheets(){
  if (window.TESTE) return;
  if (canSync() && !sync.askedShare && !sync.shared) return askShare();
  if (!db.prefs.name) return askName();
  if (!sync.tour) return openTour(0);
  if (!maybeWelcome() && !maybeNews()) askLock();
}
// Mostrado uma vez, depois do login: convida a ligar o bloqueio por senha/biometria.
function askLock(){
  const N = nativeOpts();
  if (sync.lockAsked || !N || N.bloqueio()) return;
  document.getElementById('lockAsk').hidden = false;
}
function answerLock(on){
  document.getElementById('lockAsk').hidden = true;
  sync.lockAsked = true; saveSync();
  if (on) nativeOpts().setBloqueio(true);
}

// ---------- Backup em arquivo ----------
function exportData(){
  // No APK, o salvamento do arquivo é feito pelo lado nativo (MainActivity).
  if (window.Android && Android.exportar) return Android.exportar(JSON.stringify(db, null, 2), 'financas-backup-' + curYM + '.json');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], {type:'application/json'}));
  a.download = 'financas-backup-' + curYM + '.json'; a.click();
}
function importData(input){
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result);
      if (!Array.isArray(d.incomes) || !Array.isArray(d.expenses)) throw 0;
      if (newerDb(d)) return tell('Este backup foi feito por uma versão mais nova do app. Atualize o app para importar.');
      if (!await ask('Substituir todos os dados atuais pelos do backup?', 'Substituir', true)) return;
      loadDb(d); rollover();
      save(); closeForm(); render();
    } catch(e){ tell('Arquivo de backup inválido.'); }
    input.value = '';
  };
  r.readAsText(file);
}

