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
// Mascote de cada tema especial. Cada tema tem um personagem próprio (não é o porquinho fantasiado):
// [claro, médio, forte, fenda, bochecha, olhos, boca, partes]. As partes trocam pedaços do desenho-base:
// orelhas (atrás da cabeça), cabeca (no lugar do rosto redondo), focinho (no lugar do focinho de porco; ' ' = sem),
// sob (por cima da cabeça, por baixo dos olhos), sobre (por cima de tudo), pes (no lugar das patas; ' ' = sem),
// semRabo, semFenda (a fenda de cofrinho) e semBrilho. Os olhos (em 43,55 e 77,55) e a boca mudam com o humor em todos.
// Sem tema especial, o porquinho rosa clássico (não segue a cor do app, para continuar parecendo um porco).
const MASCOTES = {
  '':['#ffc6d9', '#f58fb3', '#ec7aa3', '#c2527c', '#ff5f95', '#4a2338', '#b8456f', {}],
  // Robô: cabeça quadrada, antena, parafusos, grade no lugar do focinho e visor verde.
  hacker:['#4ade80', '#16a34a', '#15803d', '#052e16', '#bbf7d0', '#03120a', '#052e16', {semFenda:true, semRabo:true,
    orelhas:'<path d="M60 30V15" stroke="#16a34a" stroke-width="3.500"/><circle cx="60" cy="11" r="5" fill="#bbf7d0"/><rect x="15" y="52" width="10" height="20" rx="4" fill="#15803d"/><rect x="95" y="52" width="10" height="20" rx="4" fill="#15803d"/>',
    cabeca:'<rect x="23" y="29" width="74" height="66" rx="17" fill="url(#pigG)"/>',
    focinho:'<rect x="45" y="63" width="30" height="13" rx="5" fill="#15803d"/><path d="M52 66v7M60 66v7M68 66v7" stroke="#052e16" stroke-width="2.200" stroke-linecap="round"/>',
    sobre:'<rect x="32" y="47" width="56" height="15" rx="7.500" fill="#03120a"/><path d="M38 54.500h8M50 54.500h3M68 54.500h8M80 54.500h3" stroke="#4ade80" stroke-width="2.400" stroke-linecap="round"/>'}],
  // Unicórnio: chifre dourado, crina colorida, cílios e estrelinha.
  boneca:['#fff0f8', '#f9a8d4', '#f472b6', '#be185d', '#ff5f95', '#500724', '#be185d', {semFenda:true,
    orelhas:'<path d="M60 2l8 28H52z" fill="#fde68a"/><path d="M56 13l8 2.500M54.500 21l11 3" stroke="#f59e0b" stroke-width="1.800" stroke-linecap="round"/><path d="M27 40c-10 10-12 28-5 44" stroke="#c026d3" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M34 31c-12 4-18 16-18 30" stroke="#a855f7" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M44 26c-10-2-20 4-25 14" stroke="#38bdf8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M84 36c5-10 3-18-3-20-6 3-9 9-10 16z" fill="#f9a8d4"/>',
    focinho:'<ellipse cx="60" cy="72" rx="13" ry="9" fill="#f9a8d4"/><ellipse cx="55.500" cy="72" rx="1.800" ry="2.600" fill="#be185d"/><ellipse cx="64.500" cy="72" rx="1.800" ry="2.600" fill="#be185d"/>',
    sobre:'<path d="M36 50l-4-3M40 48l-2-4M84 50l4-3M80 48l2-4" stroke="#500724" stroke-width="2" stroke-linecap="round"/><path d="M90 74l1.600 3.300 3.600.500-2.600 2.500.600 3.600-3.200-1.700-3.200 1.700.600-3.600-2.600-2.500 3.600-.500z" fill="#facc15"/>'}],
  // Carro de corrida vermelho, visto de frente: faróis no lugar dos olhos, grade e aerofólio.
  corrida:['#f87171', '#dc2626', '#991b1b', '#7f1d1d', '#fecaca', '#111827', '#111827', {semFenda:true, semRabo:true, semBrilho:true,
    pes:'<rect x="22" y="82" width="19" height="22" rx="7" fill="#111827"/><rect x="79" y="82" width="19" height="22" rx="7" fill="#111827"/>',
    orelhas:'<rect x="20" y="20" width="80" height="8" rx="3.500" fill="#7f1d1d"/><path d="M32 28v12M88 28v12" stroke="#7f1d1d" stroke-width="5"/>',
    cabeca:'<path d="M38 32h44l11 20H27z" fill="#dc2626"/><path d="M42 36h36l7 13H35z" fill="#bae6fd"/><rect x="17" y="46" width="86" height="46" rx="15" fill="url(#pigG)"/>',
    sob:'<circle cx="43" cy="56" r="10.500" fill="#fef9c3"/><circle cx="77" cy="56" r="10.500" fill="#fef9c3"/><path d="M56 46h8v19h-8z" fill="#fff"/>',
    focinho:'<rect x="47" y="67" width="26" height="10" rx="4.500" fill="#111827"/><path d="M53 69.500v5M60 69.500v5M67 69.500v5" stroke="#4b5563" stroke-width="1.600"/>'}],
  // Gato DJ: orelhas pontudas, bigodes, focinho pequeno e fones.
  neon:['#c4b5fd', '#8b5cf6', '#7c3aed', '#4c1d95', '#22d3ee', '#1e1b4b', '#f472b6', {semFenda:true,
    orelhas:'<path d="M31 46 25 8l28 20zM89 46l6-38-28 20z" fill="#8b5cf6"/><path d="M34 37 31 17l15 11zM86 37l3-20-15 11z" fill="#f472b6"/>',
    focinho:'<path d="M55.500 65h9l-4.500 5.500z" fill="#f472b6"/><path d="M41 67H23M41 72l-17 5M79 67h18M79 72l17 5" stroke="#1e1b4b" stroke-width="1.700" stroke-linecap="round"/>',
    sobre:'<path d="M23 60a37 40 0 0 1 74 0" stroke="#22d3ee" stroke-width="4.500" fill="none"/><rect x="15" y="54" width="12" height="22" rx="6" fill="#22d3ee"/><rect x="93" y="54" width="12" height="22" rx="6" fill="#22d3ee"/><path d="M18 60v10M102 60v10" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>'}],
  // Coruja estudiosa: tufos, olhões com óculos e bico.
  papel:['#f5deb3', '#d6a77a', '#b98a5e', '#7c4a2d', '#e9a68a', '#3b2a1a', '#7c4a2d', {semFenda:true, semRabo:true,
    orelhas:'<path d="M33 42 27 11l25 17zM87 42l6-31-25 17z" fill="#b98a5e"/>',
    sob:'<circle cx="43" cy="55" r="14" fill="#fff7e6"/><circle cx="77" cy="55" r="14" fill="#fff7e6"/><path d="M40 86q20 12 40 0" stroke="#b98a5e" stroke-width="2" fill="none" stroke-dasharray="3 4" stroke-linecap="round"/>',
    focinho:'<path d="M53 63h14l-7 13z" fill="#e0a02b"/>',
    sobre:'<circle cx="43" cy="55" r="14" fill="none" stroke="#3b2a1a" stroke-width="2.600"/><circle cx="77" cy="55" r="14" fill="none" stroke="#3b2a1a" stroke-width="2.600"/><path d="M57 55h6" stroke="#3b2a1a" stroke-width="2.600"/>'}],
  // Caranguejo: garras para cima, perninhas e chapéu de palha.
  praia:['#fca5a5', '#ef4444', '#dc2626', '#991b1b', '#fecaca', '#450a0a', '#450a0a', {semFenda:true, semRabo:true, focinho:' ',
    pes:'<path d="M27 84l-11 9M33 90l-9 12M39 93l-4 11M93 84l11 9M87 90l9 12M81 93l4 11" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>',
    orelhas:'<path d="M24 52C8 46 4 28 13 18c2 9 8 11 13 9-3 9 1 16 6 18zM96 52c16-6 20-24 11-34-2 9-8 11-13 9 3 9-1 16-6 18z" fill="#ef4444"/>',
    cabeca:'<ellipse cx="60" cy="66" rx="41" ry="30" fill="url(#pigG)"/>',
    sobre:'<ellipse cx="60" cy="38" rx="24" ry="5.500" fill="#eab308"/><path d="M47 38c0-10 6-14 13-14s13 4 13 14z" fill="#facc15"/><path d="M47.500 35h25" stroke="#0e7490" stroke-width="3"/>'}],
  // Lua cheia do quadro: crateras, halo e estrelas em volta.
  noite:['#fff3b0', '#f4d35e', '#e0b93a', '#c99a1d', '#f59e0b', '#1b2a6b', '#1b2a6b', {semFenda:true, semRabo:true, pes:' ', focinho:' ',
    orelhas:'<circle cx="60" cy="60" r="50" fill="#f4d35e" opacity=".16"/><circle cx="60" cy="60" r="44" fill="#f4d35e" opacity=".2"/>',
    cabeca:'<circle cx="60" cy="60" r="38" fill="url(#pigG)"/>',
    sob:'<circle cx="34" cy="78" r="5" fill="#e0b93a" opacity=".7"/><circle cx="86" cy="80" r="6.500" fill="#e0b93a" opacity=".7"/><circle cx="84" cy="36" r="3.500" fill="#e0b93a" opacity=".7"/><circle cx="60" cy="30" r="2.500" fill="#e0b93a" opacity=".7"/>',
    sobre:'<path d="M14 26l2 4.200 4.600.600-3.300 3.200.800 4.600-4.100-2.200-4.100 2.200.800-4.600-3.300-3.200 4.600-.600zM104 84l1.600 3.300 3.600.500-2.600 2.500.600 3.600-3.200-1.700-3.200 1.700.600-3.600-2.600-2.500 3.600-.500z" fill="#fff6bf"/><path d="M96 18c6-6 14-4 15 2s-5 8-8 5" stroke="#9cc0e7" stroke-width="2.200" fill="none" stroke-linecap="round"/>'}],
  // Sapo mago: olhos saltados, narinas e chapéu pontudo com estrelas.
  bruxo:['#86efac', '#22c55e', '#16a34a', '#14532d', '#fda4af', '#052e16', '#052e16', {semFenda:true, semRabo:true, semBrilho:true,
    orelhas:'<circle cx="43" cy="44" r="16" fill="#22c55e"/><circle cx="77" cy="44" r="16" fill="#22c55e"/>',
    cabeca:'<ellipse cx="60" cy="70" rx="41" ry="28" fill="url(#pigG)"/>',
    sob:'<circle cx="43" cy="52" r="11.500" fill="#fff"/><circle cx="77" cy="52" r="11.500" fill="#fff"/>',
    focinho:'<circle cx="56" cy="71" r="1.600" fill="#14532d"/><circle cx="64" cy="71" r="1.600" fill="#14532d"/>',
    pes:'<ellipse cx="38" cy="98" rx="12" ry="6" fill="#16a34a"/><ellipse cx="82" cy="98" rx="12" ry="6" fill="#16a34a"/>',
    sobre:'<ellipse cx="60" cy="31" rx="19" ry="4.500" fill="#2e1657"/><path d="M62 2 47 30h27z" fill="#3b1d6e"/><path d="M49 27h23" stroke="#eab308" stroke-width="3"/><circle cx="59" cy="17" r="1.600" fill="#fde047"/><circle cx="65" cy="22" r="1.200" fill="#fde047"/>'}],
  // Alienígena: cabeçona, olhos enormes e antenas.
  espaco:['#a7f3d0', '#34d399', '#10b981', '#047857', '#6ee7b7', '#d1fae5', '#064e3b', {semFenda:true, semRabo:true, focinho:' ',
    orelhas:'<path d="M45 32 36 12M75 32l9-20" stroke="#34d399" stroke-width="3.500" stroke-linecap="round"/><circle cx="35" cy="10" r="5.500" fill="#fde047"/><circle cx="85" cy="10" r="5.500" fill="#fde047"/>',
    cabeca:'<path d="M20 54c0-23 17-36 40-36s40 13 40 36-17 44-40 44-40-21-40-44z" fill="url(#pigG)"/>',
    sob:'<ellipse cx="43" cy="55" rx="11.500" ry="15" fill="#022c22" transform="rotate(-16 43 55)"/><ellipse cx="77" cy="55" rx="11.500" ry="15" fill="#022c22" transform="rotate(16 77 55)"/>'}],
  // Raposa: orelhas pontudas, cara branca e nariz preto, com uma folha.
  floresta:['#fdba74', '#f97316', '#ea580c', '#9a3412', '#fed7aa', '#3b1d0a', '#7c2d12', {semFenda:true,
    orelhas:'<path d="M30 46 22 8l30 20zM90 46l8-38-30 20z" fill="#ea580c"/><path d="M33 37 29 18l15 10zM87 37l4-19-15 10z" fill="#fff7ed"/>',
    sob:'<path d="M23 64c5 22 24 32 37 32s32-10 37-32c-9 9-21 12-37 12s-28-3-37-12z" fill="#fff7ed"/>',
    focinho:'<ellipse cx="60" cy="71" rx="5.500" ry="4" fill="#3b1d0a"/>',
    sobre:'<path d="M60 30c-2-12 6-20 18-20-1 12-8 19-18 20z" fill="#4d7c0f"/><path d="M61 29c4-7 9-12 16-18" stroke="#a3e635" stroke-width="1.600" fill="none"/>'}],
  // Monstrinho de videogame antigo: tudo em quadradinhos, com antenas e perninhas.
  retro:['#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95', '#f0abfc', '#12121c', '#12121c', {semFenda:true, semRabo:true, semBrilho:true, focinho:' ',
    orelhas:'<path d="M34 14h8v8h8v8h-8v-8h-8zM86 14h-8v8h-8v8h8v-8h8z" fill="#8b5cf6"/>',
    cabeca:'<path d="M34 30h52v8h8v8h8v32h-8v8h-8v8H34v-8h-8v-8h-8V46h8v-8h8z" fill="url(#pigG)"/>',
    pes:'<path d="M34 94h12v10H34zM74 94h12v10H74z" fill="#6d28d9"/>',
    sob:'<path d="M35 47h16v16H35zM69 47h16v16H69z" fill="#fff"/>',
    sobre:'<path d="M100 8h7v7h-7z" fill="#facc15"/><path d="M12 16h6v6h-6z" fill="#fb7185"/>'}],
  // Dragãozinho da noite: escuro, olhos verdes, chifres e asas.
  dragao:['#4b5563', '#1f2937', '#111827', '#030712', '#4ade80', '#a3e635', '#9ca3af', {semFenda:true,
    orelhas:'<path d="M24 62C6 52 2 30 7 20c8 9 18 14 27 24zM96 62c18-10 22-32 17-42-8 9-18 14-27 24z" fill="#1f2937"/><path d="M34 42 20 12l26 16zM86 42l14-30-26 16z" fill="#111827"/><path d="M50 30l-4-14 10 9zM70 30l4-14-10 9z" fill="#111827"/>',
    focinho:'<circle cx="55" cy="70" r="2" fill="#030712"/><circle cx="65" cy="70" r="2" fill="#030712"/>',
    sob:'<ellipse cx="43" cy="55" rx="9" ry="8" fill="#030712"/><ellipse cx="77" cy="55" rx="9" ry="8" fill="#030712"/>'}],
  // Carro de fórmula antigo, branco: rodas à mostra, bico fino, asa dianteira e número.
  grandprix:['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8', '#fecaca', '#0f172a', '#0f172a', {semFenda:true, semRabo:true, semBrilho:true,
    pes:'<rect x="6" y="58" width="21" height="40" rx="9" fill="#111827"/><rect x="93" y="58" width="21" height="40" rx="9" fill="#111827"/><rect x="13" y="92" width="94" height="9" rx="4" fill="#dc2626"/>',
    orelhas:'<rect x="30" y="20" width="60" height="9" rx="3.500" fill="#1d4ed8"/><path d="M50 29h20v12H50z" fill="#1e3a8a"/><path d="M27 70h8M85 70h8" stroke="#64748b" stroke-width="4"/>',
    cabeca:'<rect x="31" y="36" width="58" height="58" rx="20" fill="url(#pigG)"/>',
    sob:'<path d="M56 36h8v12h-8z" fill="#dc2626"/>',
    focinho:'<circle cx="60" cy="72" r="9" fill="#dc2626"/><text x="60" y="76" text-anchor="middle" font-size="12" font-weight="800" font-family="sans-serif" fill="#fff">8</text>'}],
  // Buldogue de rua: orelhas caídas, focinhão, dentinhos, boné para trás e corrente.
  rua:['#e7d3bd', '#c9a27e', '#a67c52', '#7a5a3a', '#f5b7a0', '#1c1917', '#1c1917', {semFenda:true,
    orelhas:'<path d="M27 38c-14 2-18 22-11 38 9-5 13-16 14-28zM93 38c14 2 18 22 11 38-9-5-13-16-14-28z" fill="#a67c52"/>',
    focinho:'<ellipse cx="60" cy="76" rx="21" ry="15" fill="#f5e6d3"/><ellipse cx="60" cy="67" rx="6.500" ry="4.500" fill="#1c1917"/><path d="M60 71.500v7" stroke="#1c1917" stroke-width="2"/>',
    sobre:'<path d="M52 84.500l1.500-4M68 84.500l-1.500-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M25 46a35 28 0 0 1 70 0z" fill="#1c1917"/><path d="M25 42.500h70v4.500H25z" fill="#fb923c"/><path d="M90 44l19 3-17 6z" fill="#1c1917"/><path d="M38 95q22 11 44 0" stroke="#fbbf24" stroke-width="3.500" fill="none" stroke-dasharray="2.500 3" stroke-linecap="round"/>'}],
  // Gato da sorte: branco, pata levantada, coleira vermelha com guizo e mancha dourada.
  drift:['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#fda4af', '#1f2937', '#b91c1c', {semFenda:true, semRabo:true,
    orelhas:'<path d="M31 46 25 9l28 21zM89 46l6-37-28 21z" fill="#f1f5f9"/><path d="M34 37 31 19l15 11zM86 37l3-18-15 11z" fill="#ef4444"/><path d="M95 62c11-4 15-19 10-32-8 0-14 7-14 15z" fill="#f1f5f9"/><path d="M98 36v6M103 38l-1 6" stroke="#cbd5e1" stroke-width="1.600" stroke-linecap="round"/>',
    sob:'<path d="M68 30c9-3 18 3 21 12-8 3-17-1-21-12z" fill="#f59e0b" opacity=".85"/>',
    focinho:'<path d="M55.500 66h9l-4.500 5.500z" fill="#f472b6"/><path d="M41 68H25M41 73l-15 4M79 68h16M79 73l15 4" stroke="#94a3b8" stroke-width="1.600" stroke-linecap="round"/>',
    sobre:'<path d="M31 90q29 13 58 0" stroke="#dc2626" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="60" cy="98" r="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.500"/><path d="M60 98v3" stroke="#92400e" stroke-width="1.600"/>'}],
  // Fusquinha de corrida, visto de frente: redondinho, faróis, faixas e número no capô.
  fusca:['#fffaf0', '#f3e3bf', '#e2cb9a', '#a8894e', '#f59e0b', '#3b2f1a', '#3b2f1a', {semFenda:true, semRabo:true, semBrilho:true,
    pes:'<rect x="23" y="84" width="17" height="20" rx="7" fill="#1f2937"/><rect x="80" y="84" width="17" height="20" rx="7" fill="#1f2937"/>',
    orelhas:'<circle cx="18" cy="62" r="5" fill="#cbd5e1"/><circle cx="102" cy="62" r="5" fill="#cbd5e1"/>',
    cabeca:'<path d="M20 72c0-32 17-46 40-46s40 14 40 46v12c0 6-4 9-10 9H30c-6 0-10-3-10-9z" fill="url(#pigG)"/><path d="M38 46c2-10 11-15 22-15s20 5 22 15z" fill="#bae6fd"/>',
    sob:'<path d="M52 27h5v66h-5z" fill="#dc2626" opacity=".9"/><path d="M57 26.500h6V93h-6z" fill="#fff"/><path d="M63 27h5v66h-5z" fill="#1d4ed8" opacity=".9"/><circle cx="43" cy="56" r="10.500" fill="#fef9c3" stroke="#cbd5e1" stroke-width="2"/><circle cx="77" cy="56" r="10.500" fill="#fef9c3" stroke="#cbd5e1" stroke-width="2"/>',
    focinho:'<circle cx="60" cy="72" r="8.500" fill="#fff" stroke="#3b2f1a" stroke-width="1.500"/><text x="60" y="75.500" text-anchor="middle" font-size="9" font-weight="800" font-family="sans-serif" fill="#3b2f1a">12</text>',
    sobre:'<rect x="24" y="92" width="72" height="5" rx="2.500" fill="#cbd5e1"/>'}],
  // Urso viking: orelhas redondas, focinho claro e elmo de ferro com chifres.
  vikings:['#c8a27c', '#a47148', '#7f5539', '#5e3c23', '#e6b8a2', '#2b1d12', '#2b1d12', {semFenda:true,
    orelhas:'<circle cx="28" cy="36" r="13" fill="#a47148"/><circle cx="92" cy="36" r="13" fill="#a47148"/><circle cx="28" cy="36" r="6.500" fill="#e6b8a2"/><circle cx="92" cy="36" r="6.500" fill="#e6b8a2"/><path d="M30 40C14 36 10 20 14 8c6 11 15 16 24 20zM90 40c16-4 20-20 16-32-6 11-15 16-24 20z" fill="#fef3c7"/>',
    focinho:'<ellipse cx="60" cy="74" rx="17" ry="13" fill="#f1dcc3"/><ellipse cx="60" cy="67.500" rx="6.500" ry="4.500" fill="#2b1d12"/><path d="M60 72v6" stroke="#2b1d12" stroke-width="2"/>',
    sobre:'<path d="M25 47a35 29 0 0 1 70 0z" fill="#94a3b8"/><path d="M25 47h70" stroke="#64748b" stroke-width="5"/><path d="M57 19h6v28h-6z" fill="#64748b"/><circle cx="37" cy="43" r="2" fill="#e2e8f0"/><circle cx="83" cy="43" r="2" fill="#e2e8f0"/>'}],
  // Leão espartano: juba, focinho claro e crista vermelha.
  espartano:['#fde68a', '#f59e0b', '#d97706', '#92400e', '#fcd34d', '#451a03', '#451a03', {semFenda:true,
    orelhas:'<circle cx="60" cy="60" r="49" fill="#92400e"/><path d="M60 8l8 10 12-6 2 13 13 0-4 12 12 6-9 9 8 10-12 4 3 13-13-1-3 13-11-7-9 9-9-9-11 7-3-13-13 1 3-13-12-4 8-10-9-9 12-6-4-12 13 0 2-13 12 6z" fill="#b45309"/><circle cx="31" cy="32" r="9" fill="#f59e0b"/><circle cx="89" cy="32" r="9" fill="#f59e0b"/>',
    focinho:'<ellipse cx="60" cy="74" rx="16" ry="12" fill="#fef3c7"/><path d="M54 67h12l-6 6.500z" fill="#451a03"/><path d="M60 73.500v5" stroke="#451a03" stroke-width="2"/>',
    sobre:'<path d="M53 0h14l3 24H50z" fill="#dc2626"/><path d="M50.500 7h19M50 14h20" stroke="#991b1b" stroke-width="1.600"/><path d="M27 42q33-15 66 0v6q-33-13-66 0z" fill="#b45309"/><path d="M27 45q33-14 66 0" stroke="#fbbf24" stroke-width="2" fill="none"/>'}]
};
Object.assign(MASCOTES, MASCOTES_NOVOS); // os dos temas por categoria (js/temas.js)
// Mascote visto de frente; mood: 'feliz', 'ok' ou 'triste'. tema: de qual tema (padrão: o que está em uso).
function pigSvg(mood, tema = db.prefs.skin){
  const [claro, medio, forte, fenda, bochecha, escuro, boca, p] = MASCOTES[tema] || MASCOTES[''];
  const triste = mood === 'triste', feliz = mood === 'feliz', g = 'pigG' + (tema || '');
  const olho = x => `<circle cx="${x}" cy="55" r="5" fill="${escuro}"/><circle cx="${x + 1.8}" cy="53.2" r="1.7" fill="#fff"/>`;
  const olhos = feliz ? `<path d="M38 57q5-7 10 0M72 57q5-7 10 0" stroke="${escuro}" stroke-width="3" fill="none" stroke-linecap="round"/>` : olho(43) + olho(77);
  const extra = triste ? `<path d="M36 48l10-4M84 48l-10-4" stroke="${escuro}" stroke-width="2.6" stroke-linecap="round"/><path d="M89 58c2.2 3.2 3.2 5.2 3.2 6.8a3.2 3.2 0 0 1-6.400 0c0-1.600 1-3.600 3.200-6.800z" fill="#7dd3fc"/>` : '';
  const parte = (s, padrao) => (s == null ? padrao : s).replace(/url\(#pigG\)/g, `url(#${g})`);
  return `<svg class="pig ${mood}" viewBox="0 0 120 110" width="104" height="95" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${medio}"/></linearGradient></defs>
    <ellipse cx="60" cy="104" rx="30" ry="4" fill="#000" opacity=".16"/>
    <g class="moeda"><circle cx="60" cy="10" r="7.5" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><path d="M60 6.5v7" stroke="#b45309" stroke-width="2" stroke-linecap="round"/></g>
    <g class="corpo">
    ${p.semRabo ? '' : `<path d="M95 70c8-2 10 5 5 7s-2 7 3 6" stroke="${medio}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`}
    ${parte(p.pes, `<rect x="38" y="88" width="14" height="14" rx="6" fill="${forte}"/><rect x="68" y="88" width="14" height="14" rx="6" fill="${forte}"/>`)}
    ${parte(p.orelhas, `<path d="M30 40c-6-12-3-22 4-24 8 2 14 8 16 16zM90 40c6-12 3-22-4-24-8 2-14 8-16 16z" fill="${medio}"/>
    <path d="M34 36c-3-8-2-14 2-16 5 2 8 6 10 11zM86 36c3-8 2-14-2-16-5 2-8 6-10 11z" fill="${forte}"/>`)}
    ${parte(p.cabeca, '<ellipse cx="60" cy="62" rx="38" ry="34" fill="url(#pigG)"/>')}
    ${p.semFenda ? '' : `<rect x="50" y="30.5" width="20" height="4" rx="2" fill="${fenda}"/>`}
    ${p.semBrilho ? '' : '<ellipse cx="41" cy="43" rx="9" ry="4.5" fill="#fff" opacity=".4" transform="rotate(-28 41 43)"/>'}
    ${p.sob || ''}${olhos}${extra}
    <circle cx="32" cy="69" r="6" fill="${bochecha}" opacity=".4"/><circle cx="88" cy="69" r="6" fill="${bochecha}" opacity=".4"/>
    ${parte(p.focinho, `<ellipse cx="60" cy="69" rx="15" ry="11" fill="${forte}"/>
    <ellipse cx="54.5" cy="69" rx="2.6" ry="3.6" fill="${boca}"/><ellipse cx="65.5" cy="69" rx="2.6" ry="3.6" fill="${boca}"/>`)}
    <path d="${feliz ? 'M52 84q8 7 16 0' : triste ? 'M54 88q6-5 12 0' : 'M54 85q6 3 12 0'}" stroke="${boca}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${p.sobre || ''}</g></svg>`;
}
// Falas do mascote, por tema (a de cada dia muda, e tocar nele troca). {v} = valor do saldo do mês; {nome} = nome da pessoa.
const FUN_TEMA = {
  '':{
    feliz:['Sobrando {v} este mês, {nome}. Tô até mais gordinho!', 'Mês no azul! Já posso sonhar com milho premium?', 'Olha esse saldo de {v}, {nome}. Orgulho define.', 'Assim eu encho rapidinho. Continua, {nome}!',
      '{v} de folga. Guarda um pouquinho pra mim?', 'Hoje eu durmo tranquilo: sobrou {v}.', 'Se continuar assim, vou precisar de um cofrinho maior.', 'Oinc de alegria: as contas fecharam com {v} sobrando!'],
    ok:['Tudo sob controle por aqui, {nome}. Bora registrar os gastos?', 'Equilibrado, como todo porquinho deveria ser.', 'Nem aperto, nem folga. Seguimos de olho.', 'Me conta, {nome}: o que você gastou hoje?',
      'Mês no fio da navalha. Um cafezinho a menos e a gente respira.', 'Anotou tudo? Gasto esquecido é moedinha que foge.', 'Tá empatado. Eu torço pelo time do "sobrou".', 'Sem sustos por enquanto. Gosto assim.'],
    triste:['Faltam {v} para fechar o mês, {nome}. Respira, a gente ajeita.', 'Tô sentindo um vento aqui dentro… saiu mais do que entrou.', 'Mês no vermelho em {v}. Bora rever os gastos, {nome}?', 'Ai, minhas moedinhas! Segura o cartão um pouquinho.',
      'Faltando {v}. Que tal olhar as assinaturas?', 'Não é o fim do mundo, {nome}: é só {v}. Mas vamos cuidar.', 'Eu emagreci {v} este mês. Me ajuda?', 'Cartão, senta lá um pouco. Faltam {v}.']},
  hacker:{
    feliz:['> saldo: +{v}. Sistema estável.', 'Acesso concedido: {v} sobrando, {nome}.', 'Nenhum bug no orçamento. Bip bop.', 'Compilou sem erros: mês no azul.', 'Firewall do cofrinho ativo. {v} protegidos.', 'sudo guardar {v}. Feito.'],
    ok:['> status: OK. Aguardando novos lançamentos.', 'Rodando em modo econômico, {nome}.', 'Ping no orçamento: resposta em 0 ms.', 'Log do dia vazio. Lançou tudo?', 'Sem alertas. Monitorando…', 'Entrada e saída empatadas. Zero a zero binário.'],
    triste:['ALERTA: déficit de {v} detectado.', 'Erro 402: faltam {v}, {nome}.', 'Vazamento de moedas em andamento. Faltam {v}.', 'Orçamento invadido por boletos. Contra-atacar?', 'Memória cheia de parcelas. Faltam {v}.', '> encerrando gastos supérfluos…']},
  boneca:{
    feliz:['Sobrou {v}! Hoje o dia é rosa, {nome}.', 'Um arraso: mês no azul e brilho no olhar.', 'Com {v} de sobra, dá até pra sonhar com o castelo.', 'Linda, organizada e com {v} guardados.', 'Glitter e saldo positivo: combinação perfeita.', 'Hoje eu desfilo: fechamos com {v}!'],
    ok:['Tudo no lugar, {nome}. Como um bom closet.', 'Nem sobra, nem falta: equilíbrio é chique.', 'Conta pra mim, {nome}: teve comprinha hoje?', 'Anotar os gastos também é autocuidado.', 'Mês comportado. Continuamos brilhando.', 'De olho na carteira e no brilho.'],
    triste:['Faltam {v}… respira, {nome}, a gente dá um jeito.', 'O saldo ficou menos rosa: {v} no vermelho.', 'Hora de guardar o cartão na bolsinha. Faltam {v}.', 'Nem todo dia é de festa. Faltam {v}.', 'Vamos rever as comprinhas? Faltam {v}.', 'Sem drama: {v} a gente recupera.']},
  corrida:{
    feliz:['Bandeirada! Mês fechando com {v} de vantagem.', 'Pole position: {v} sobrando, {nome}.', 'Volta mais rápida do orçamento!', 'Tanque cheio: {v} na reserva.', 'Ultrapassamos os boletos pela direita.', 'No pódio com {v}. Champanhe? Só de água.'],
    ok:['Ritmo de corrida, {nome}. Sem forçar o motor.', 'Parada no box: lançou os gastos de hoje?', 'Pneus bons, estratégia mantida.', 'Lado a lado com os gastos. Segura a curva!', 'Sem bandeira amarela por enquanto.', 'Meio da prova: concentração total.'],
    triste:['Bandeira vermelha: faltam {v}.', 'Motor no limite, {nome}. Faltam {v}.', 'Pneu furado no orçamento: {v} atrás.', 'Hora de tirar o pé. Faltam {v}.', 'Derrapamos na curva dos gastos. Faltam {v}.', 'Pit stop urgente: rever as despesas.']},
  neon:{
    feliz:['A pista tá cheia: {v} sobrando, {nome}!', 'Batida boa e saldo positivo.', 'Solta o grave: fechamos com {v}!', 'Hoje o set é de vitória. Miau.', 'Luzes acesas, bolso tranquilo.', 'Remix perfeito: ganhar mais, gastar menos.'],
    ok:['No ritmo, {nome}. Nem acelera, nem para.', 'Mixando ganhos e gastos sem desafinar.', 'Qual foi o gasto de hoje? Conta no microfone.', 'Volume no médio. Tudo sob controle.', 'Passando o som do orçamento.', 'Sem ruído na pista.'],
    triste:['Desafinou: faltam {v}.', 'A música parou, {nome}. Faltam {v}.', 'Queimou um fusível no orçamento: {v}.', 'Baixa o volume dos gastos. Faltam {v}.', 'Set difícil hoje. Faltam {v}.', 'Hora de trocar o disco das despesas.']},
  papel:{
    feliz:['Conforme os registros, sobram {v}. Excelente, {nome}.', 'A prudência rende: {v} de saldo.', 'Capítulo feliz no livro-caixa.', 'Quem anota, não se espanta. Sobram {v}.', 'Economia exemplar. Uh-uh!', 'Nota dez em finanças este mês.'],
    ok:['Tudo devidamente anotado, {nome}?', 'O livro-caixa está em ordem.', 'Mês equilibrado, como recomenda a boa doutrina.', 'Uma coruja atenta não perde um centavo.', 'Sem novidades no balancete.', 'Estudando os seus gastos com calma.'],
    triste:['Segundo meus cálculos, faltam {v}.', 'Página difícil, {nome}: {v} negativos.', 'Recomendo revisar as despesas. Faltam {v}.', 'A lição do mês: gastou-se {v} além.', 'Hora de consultar o orçamento.', 'Nem os sábios escapam de um mês apertado.']},
  praia:{
    feliz:['Sombra, água fresca e {v} sobrando.', 'Maré boa, {nome}: fechamos no azul.', 'Dá até pra um picolé: sobram {v}.', 'Sol brilhando no orçamento.', 'Pé na areia e conta em dia.', 'Onda perfeita: {v} de saldo.'],
    ok:['Mar calmo por aqui, {nome}.', 'Nem ressaca, nem maré alta.', 'Passou protetor no bolso hoje?', 'Brisa leve nas finanças.', 'De boa na rede, de olho nos gastos.', 'Anota aí antes do mergulho.'],
    triste:['Maré baixa: faltam {v}.', 'Vem onda forte, {nome}. Faltam {v}.', 'O sol torrou {v} do orçamento.', 'Hora de recolher a canga dos gastos.', 'Areia no cofrinho. Faltam {v}.', 'Ressaca de boletos. Vamos com calma.']},
  noite:{
    feliz:['O céu gira em festa: sobram {v}, {nome}.', 'Pintei o mês de azul. E sobrou {v}.', 'As estrelas brilham mais com a conta em dia.', 'Uma obra-prima de orçamento.', 'Pinceladas certeiras: {v} de saldo.', 'Hoje até o cipreste dança.'],
    ok:['Noite tranquila na vila, {nome}.', 'Cada gasto é uma pincelada. Anotou?', 'O quadro do mês está tomando forma.', 'Nem tempestade, nem calmaria.', 'Olhando as estrelas e as contas.', 'Tons equilibrados na paleta.'],
    triste:['Faltou tinta: {v} a menos.', 'Noite turbulenta, {nome}. Faltam {v}.', 'O redemoinho levou {v}.', 'Até os gênios tiveram meses difíceis.', 'Vamos repintar esse orçamento.', 'Céu fechado. Faltam {v}.']},
  bruxo:{
    feliz:['Feitiço de multiplicar moedas: sobram {v}!', 'Dez pontos para {nome}: mês no azul.', 'O cofre encantado guardou {v}.', 'Poção da economia funcionando.', 'Nem precisei de varinha: sobrou {v}.', 'Mágica mesmo é fechar o mês com folga.'],
    ok:['Nada de travessuras no orçamento, {nome}.', 'Caldeirão em fogo baixo. Tudo sob controle.', 'Anotou os gastos no pergaminho?', 'Equilíbrio digno de um bom feiticeiro.', 'A coruja ainda não trouxe más notícias.', 'Sem feitiços estranhos por aqui.'],
    triste:['Alguém lançou um feitiço de sumiço: faltam {v}.', 'Faltam {v}, {nome}. Hora de um contrafeitiço.', 'O dragão do cofre está com fome: {v}.', 'Poção errada este mês. Faltam {v}.', 'Nem toda mágica dá certo. Vamos rever.', 'Menos dez pontos para os gastos.']},
  espaco:{
    feliz:['Órbita estável: {v} sobrando, {nome}.', 'Missão cumprida, mês no azul!', 'Combustível de sobra: {v}.', 'Pousamos com {v} no tanque.', 'Rumo às estrelas, sem dívidas.', 'Central, aqui é o cofrinho: tudo certo.'],
    ok:['Navegando em velocidade de cruzeiro, {nome}.', 'Sem turbulência no orçamento.', 'Registrou os gastos no diário de bordo?', 'Gravidade normal por aqui.', 'Radar limpo. Seguimos.', 'Trajetória mantida.'],
    triste:['Houston, faltam {v}.', 'Alerta de combustível: {v} a menos.', 'Entramos num buraco negro de gastos, {nome}.', 'Chuva de meteoros no orçamento: {v}.', 'Corrigindo a rota. Faltam {v}.', 'Oxigênio baixo no cofrinho.']},
  floresta:{
    feliz:['Colheita boa: sobram {v}, {nome}.', 'A toca está cheia para o inverno.', 'Guardei {v} debaixo da árvore.', 'Dia de sol na floresta e na conta.', 'Raposa esperta guarda antes de gastar.', 'Folhas verdes, saldo verde.'],
    ok:['Tudo calmo na trilha, {nome}.', 'Nem seca, nem enchente.', 'Farejou algum gasto hoje? Anota.', 'Passo a passo, sem pressa.', 'A floresta está em equilíbrio.', 'De orelha em pé nos gastos.'],
    triste:['A toca ficou vazia: faltam {v}.', 'Inverno chegando, {nome}. Faltam {v}.', 'Alguém comeu as provisões: {v}.', 'Trilha difícil este mês.', 'Hora de guardar mais nozes.', 'Faltam {v}. Vamos farejar onde cortar.']},
  retro:{
    feliz:['+{v} PONTOS! FASE CONCLUÍDA.', 'NOVO RECORDE, {nome}!', 'VIDA EXTRA: sobram {v}.', 'CHEFÃO DOS BOLETOS DERROTADO.', 'COMBO DE ECONOMIA x3!', 'Moedas coletadas: {v}.'],
    ok:['FASE EM ANDAMENTO…', 'PRESS START para lançar um gasto.', 'Sem inimigos à vista, {nome}.', 'Energia no meio da barra.', 'Jogo salvo.', 'Modo normal ativado.'],
    triste:['GAME OVER? Ainda não: faltam {v}.', 'Você perdeu {v} moedas, {nome}.', 'Chefão dos boletos na tela!', 'Energia baixa. Faltam {v}.', 'CONTINUE? 9… 8… 7…', 'Insira mais moedas no cofrinho.']},
  dragao:{
    feliz:['Voo tranquilo: sobram {v}, {nome}.', 'Tesouro protegido: {v} guardados.', 'Nenhum invasor no ninho de moedas.', 'Rugido de alegria: mês no azul!', 'Planando com {v} de folga.', 'Dragão bem alimentado, bolso também.'],
    ok:['Céu limpo sobre a ilha, {nome}.', 'De olho no tesouro.', 'Pousou algum gasto hoje? Anota.', 'Asas abertas, vento a favor.', 'Tudo calmo na caverna.', 'Patrulha sem novidades.'],
    triste:['Fogo no orçamento: faltam {v}.', 'O tesouro encolheu {v}, {nome}.', 'Tempestade à frente. Faltam {v}.', 'Queimamos {v} a mais.', 'Hora de voar baixo nos gastos.', 'O ninho precisa de mais moedas.']},
  grandprix:{
    feliz:['Vitória de ponta a ponta: sobram {v}!', 'Bandeira quadriculada, {nome}: mês no azul.', 'Largada perfeita e {v} no tanque.', 'Campeão da economia desta temporada.', 'Volta de honra com {v} de sobra.', 'Motor cantando, bolso sorrindo.'],
    ok:['Reta longa, {nome}. Ritmo constante.', 'Conferindo os mostradores do orçamento.', 'Passou no box hoje? Anota o gasto.', 'Nada de sustos na pista.', 'Seguimos no vácuo dos gastos.', 'Corrida limpa até aqui.'],
    triste:['Rodamos na curva: faltam {v}.', 'Bandeira amarela, {nome}. Faltam {v}.', 'O motor pediu arrego: {v} atrás.', 'Abandonar? Jamais. Mas faltam {v}.', 'Hora de trocar a estratégia.', 'Perdemos posições para os boletos.']},
  rua:{
    feliz:['Quarto de milha vencido: sobram {v}.', 'Nitro guardado, {nome}: {v} no bolso.', 'Família, contas pagas e {v} sobrando.', 'Arrancada limpa neste mês.', 'Motor turbinado, carteira também.', 'Ganhamos o racha contra os boletos.'],
    ok:['Rodando na boa, {nome}.', 'Sem pisar fundo no cartão.', 'Abasteceu hoje? Lança o gasto.', 'Noite calma no asfalto.', 'De olho no retrovisor dos gastos.', 'Marcha lenta, tudo sob controle.'],
    triste:['Queimamos a largada: faltam {v}.', 'Acabou o nitro, {nome}. Faltam {v}.', 'Motor fundido no orçamento: {v}.', 'Perdemos o racha deste mês.', 'Hora de voltar pra garagem e rever os gastos.', 'O tanque secou. Faltam {v}.']},
  drift:{
    feliz:['Curva perfeita: sobram {v}, {nome}.', 'Deslizando com {v} de folga.', 'O rei do drift fecha no azul.', 'Fumaça nos pneus, não na carteira.', 'Controle total: {v} guardados.', 'Descida da montanha sem um arranhão.'],
    ok:['Carro alinhado, {nome}.', 'Entrando na curva com calma.', 'Anotou o gasto antes da próxima curva?', 'Traseira firme, orçamento também.', 'Noite tranquila na cidade.', 'Ajustando o ponto de frenagem.'],
    triste:['Saímos de traseira: faltam {v}.', 'Bateu no muro, {nome}. Faltam {v}.', 'Pneus carecas no orçamento: {v}.', 'Curva fechada demais este mês.', 'Hora de treinar o controle dos gastos.', 'Perdemos a traseira. Faltam {v}.']},
  fusca:{
    feliz:['Bip-bip! Sobraram {v}, {nome}.', 'Pequeno, valente e com {v} no porta-luvas.', 'Cruzamos a linha na frente dos boletos.', 'Motor traseiro, saldo dianteiro.', 'Hoje eu empino de alegria.', 'Quem diria: o fusquinha venceu o mês.'],
    ok:['Rodando redondinho, {nome}.', 'Devagar e sempre a gente chega.', 'Parou pra abastecer? Anota aí.', 'Nenhum barulho estranho no orçamento.', 'Farol aceso, olho nos gastos.', 'Na estrada, sem pressa.'],
    triste:['Enguiçou: faltam {v}.', 'Preciso de um empurrãozinho, {nome}. Faltam {v}.', 'Furou o pneu do orçamento: {v}.', 'Subida difícil este mês.', 'Vamos pra oficina rever os gastos.', 'Engasguei. Faltam {v}.']},
  vikings:{
    feliz:['Saque glorioso: sobram {v}, {nome}!', 'O baú está cheio. Skol!', 'Os deuses sorriem: {v} de folga.', 'Banquete garantido neste mês.', 'Velas ao vento e ouro no porão.', 'Digno de uma saga: mês no azul.'],
    ok:['Mar calmo no fiorde, {nome}.', 'Remando no ritmo.', 'Algum gasto na travessia? Anota.', 'O escudo está firme.', 'Sem tempestade à vista.', 'O clã está em paz com as contas.'],
    triste:['O baú foi saqueado: faltam {v}.', 'Inverno duro, {nome}. Faltam {v}.', 'Naufragaram {v} moedas.', 'Os corvos trazem más notícias.', 'Hora de afiar o machado nos gastos.', 'Faltam {v}. À luta!']},
  espartano:{
    feliz:['Vitória! Sobram {v}, {nome}.', 'Disciplina dá resultado: {v} guardados.', 'O orçamento resistiu como uma muralha.', 'Batalha vencida este mês.', 'Escudo erguido, saldo positivo.', 'Honra e {v} no cofre.'],
    ok:['Formação mantida, {nome}.', 'Guardando a passagem do orçamento.', 'Algum gasto em combate? Anota.', 'Sem baixas por enquanto.', 'Vigília tranquila.', 'Treino diário: anotar tudo.'],
    triste:['Perdemos terreno: faltam {v}.', 'Batalha dura, {nome}. Faltam {v}.', 'O inimigo levou {v}.', 'Recuar para reagrupar os gastos.', 'Um guerreiro não desiste: vamos rever.', 'A muralha cedeu. Faltam {v}.']}
};
// Temas por categoria (js/temas.js): as falas da categoria e mais uma própria do tema, por humor.
for (const [k, [feliz, ok, triste]] of Object.entries(FALAS_TEMA)){
  const c = FALAS_CAT[temaCat(k)] || FALAS_CAT.contos;
  FUN_TEMA[k] = {feliz:[feliz, ...c.feliz], ok:[ok, ...c.ok], triste:[triste, ...c.triste]};
}
// Bloco do Resumo: o porquinho reage ao saldo do mês atual. Tocar nele troca a fala.
function funMascot(){
  const net = totalIn(curYM) - totalOut(curYM), mood = funMood();
  const falas = (FUN_TEMA[db.prefs.skin] || FUN_TEMA[''])[mood], ganhas = funBadgeList().filter(b => b[3]).length, nivel = [...FUN_LEVELS].reverse().find(l => ganhas >= l[0])[1];
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
  if (festaTema()) return; // com tema especial, a comemoração usa as formas e as cores dele (js/cena.js)
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
    <div class="btns"><button class="btn" onclick="procurarAtualizacao()">${I('refresh')}Procurar atualização agora</button></div>` : ''}`],
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
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openSettings('temas')">${I('sparkle')}${p.skin ? 'Em uso: ' + SKINS[p.skin][0] : 'Escolher um tema especial'}</button></div>
    <div class="hint">Os temas especiais têm uma área própria nas Configurações, separados por categoria. Com um deles ligado, "Tema" e "Cor" acima ficam sem efeito.</div>`],
  ['temas', 'sparkle', 'Temas especiais', `${Object.keys(SKINS).length} temas por categoria, com mascote próprio`, `
    <div class="hint" style="margin-top:0">Um tema especial muda as cores do app inteiro, o mascote do modo divertido, a abertura e os widgets; os ícones das categorias ficam com a cor de cada uma. ${p.skin ? `Em uso: <b>${SKINS[p.skin][0]}</b>.` : 'Nenhum em uso.'}</div>
    <div class="btns" style="margin-top:0"><button class="btn ${p.skin ? '' : 'primary'}" onclick="setSkin('')">Sem tema especial</button></div>
    ${WEB_APP ? '<div class="hint">No iPhone, o ícone do app é fixado na hora de adicionar à Tela de Início. Para ele ficar com o tema: abra o app no Safari com o tema já escolhido, toque em Compartilhar › Adicionar à Tela de Início e apague o ícone antigo.</div>' : ''}
    ${TEMA_CATS.map(([c, nome, ks]) => `<details class="grp" ${ks.includes(p.skin) || (!p.skin && c === 'estilos') ? 'open' : ''}><summary>${nome}<small>${ks.length}</small>${I('chev')}</summary>
      <div class="icoGrid t3">${ks.map(k => `<button class="${p.skin === k ? 'on' : ''}" onclick="setSkin('${k}')"><span class="temaM" style="background:linear-gradient(135deg,${SKINS[k][4]},${SKINS[k][5]})">${mascoteEm(k, 'ok', 0, 0, 46)}</span><small>${SKINS[k][0]}</small></button>`).join('')}</div></details>`).join('')}`],
  ['menu', 'sliders', 'Menu de baixo', 'Esconder e reordenar as abas', `
    <div class="hint" style="margin-top:0">Toque no círculo para esconder ou mostrar uma aba e use as setas para mudar a ordem. O Resumo fica sempre no menu.</div>
    <div>${p.tabs.map((t,i) => { if (t === 'chat' || (WEB_APP && t === 'noticias')) return ''; const off = p.tabsOff.includes(t); return `<div class="item" style="cursor:default;padding:6px 0">
      <button class="iconbtn ${off ? 'muted' : 'in'}" onclick="toggleTab('${t}')" ${t === 'resumo' ? 'disabled style="opacity:.35"' : ''} aria-label="${off ? 'Mostrar' : 'Esconder'}">${I(off ? 'unchecked' : 'checked', 24)}</button>
      <div class="mid" style="${off ? 'opacity:.5' : ''}"><b>${I(TABS[t][0])} ${TABS[t][1]}</b>${off ? '<small>escondida</small>' : t === visTabs()[0] ? '<small>Aba inicial</small>' : ''}</div>
      <button class="iconbtn" onclick="moveTab(${i},-1)" ${i ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" onclick="moveTab(${i},1)" ${i < n-1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`; }).join('')}</div>`],
  ['seguranca', 'lock', 'Ícone e bloqueio', 'Cor do ícone, senha ou biometria', !isApp ? '' : `${demo}
    <label>Cor do ícone do app</label>
    <div class="swatches">${Object.entries(ICONES).filter(([k]) => !SKINS[k] || SKIN_ANTIGOS.includes(k) || (k === p.skin || k === N.icone()) && iconeTem(k)).map(([k,c]) => `<button class="sw ${N.icone() === k ? 'on' : ''}" style="background:linear-gradient(135deg,${c[1]},${c[2]});border-radius:14px" onclick="nativeOpts().setIcone('${k}');openSettings()" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div>
    ${window.Android && Android.setIconeApp ? `<label>Desenho do ícone</label>
    <div class="icoGrid">${iconeDesenhos(Android.icone()).map(k => `<button class="${Android.iconeDesenho() === k ? 'on' : ''}" onclick="Android.setIconeApp(Android.icone(),'${k}',Android.iconeNome());openSettings()">${iconeSvg(Android.icone(), k)}<small>${ICON_DESENHOS[k][0]}</small></button>`).join('')}</div>
    ${SKINS[Android.icone()] ? '<div class="hint">Os outros desenhos (moeda, carteira, cofre…) existem para as doze cores comuns: escolha uma delas acima para vê-los.</div>' : Android.criarAtalho ? '' : '<div class="hint">Há mais desenhos (moeda, carteira, cofre…) na versão nova do app: toque em Procurar atualizações.</div>'}
    <label>Nome do app na tela inicial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${APP_NOMES.map((t, i) => `<button class="btn ${Number(Android.iconeNome()) === i ? 'primary' : ''}" style="padding:11px 6px;flex:1 0 40%" onclick="Android.setIconeApp(Android.icone(),Android.iconeDesenho(),${i});openSettings()">${t}</button>`).join('')}</div>` : ''}
    <div class="hint">Ao trocar a cor, o desenho ou o nome, o Android fecha o app: é só abrir de novo pelo ícone novo. Se o ícone sumir da tela inicial, adicione de novo pela lista de apps.</div>
    ${window.Android && Android.criarAtalho ? `<label>Outro nome, escrito por você</label>
    <div class="hint" style="margin-top:0">O Android só deixa o app trocar de nome entre os da lista acima. Para um nome livre, o app cria na tela inicial um atalho com o nome que você escrever e o ícone escolhido aqui; na lista de apps continua o nome da lista.</div>
    <div class="btns"><button class="btn" onclick="askAtalho()">${I('edit')}Criar atalho com o meu nome</button></div>` : ''}
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
    <div class="hint" style="margin-top:0">Widgets são quadros do app na tela inicial do celular. Há cinco: <b>Resumo</b> (você escolhe as linhas), <b>Gastos</b> (a lista dos gastos do mês), <b>Saldo do mês</b>, <b>Contas a vencer</b> e <b>Mascote</b> (a cara do mês e os gastos). O que você muda aqui vale na hora para os widgets que já estão na tela inicial.</div>
    <label>Fundo dos widgets</label>
    <div class="btns" style="margin-top:0">${[['tema', p.skin ? 'Tema especial' : 'Cor do app'], ['escuro', 'Escuro']].map(([v, t]) => `<button class="btn ${(p.widgetFundo || 'tema') === v ? 'primary' : ''}" onclick="setPref('widgetFundo','${v}')">${t}</button>`).join('')}</div>
    <label>Mascote nos widgets Resumo, Gastos, Saldo e Contas</label>
    <div class="btns" style="margin-top:0">${[[true, 'Com mascote'], [false, 'Sem mascote']].map(([v, t]) => `<button class="btn ${(p.widgetPig ?? !!p.fun) === v ? 'primary' : ''}" onclick="setPref('widgetPig',${v})">${t}</button>`).join('')}</div>
    <div class="hint">É o mesmo mascote do app: o porquinho ou o personagem do tema especial, com a cara do mês.</div>
    <label>Widget Resumo</label>
    <div class="btns" style="margin-top:0"><button class="btn" onclick="openLayoutEdit('widget')">${I('sliders')}Escolher o que aparece</button></div>
    <div class="hint">As linhas aparecem na ordem escolhida; se não couberem, dá para rolar dentro do widget ou aumentá-lo (segure o dedo nele e puxe a borda). Linhas sem dado (por exemplo, sem conta a vencer) são puladas.</div>
    <label>Widget Gastos: o que listar</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['', 'Todos'], ...Object.entries(GRUPOS).map(([k, g]) => [k, g[0]])].map(([k, t]) => `<button class="btn ${(p.widgetLista || '') === k ? 'primary' : ''}" style="padding:11px 6px;flex:1 0 30%" onclick="setPref('widgetLista','${k}')">${t}</button>`).join('')}</div>
    <label>Widget Gastos: ordem</label>
    <div class="btns" style="margin-top:0">${[['', 'Como no app'], ['valor', 'Maiores primeiro']].map(([k, t]) => `<button class="btn ${(p.widgetOrdem || '') === k ? 'primary' : ''}" onclick="setPref('widgetOrdem','${k}')">${t}</button>`).join('')}</div>
    ${Android.fixarWidget ? `<label>Pôr na tela inicial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['resumo', 'Resumo'], ...(Android.criarAtalho ? [['gastos', 'Gastos']] : []), ['saldo', 'Saldo do mês'], ['contas', 'Contas a vencer'], ['porco', 'Mascote']].map(([k, t]) => `<button class="btn" style="padding:11px 6px;flex:1 0 30%" onclick="if(!Android.fixarWidget('${k}'))tell('Esta tela inicial não aceita o pedido. Segure o dedo num espaço vazio da tela inicial, toque em Widgets e procure Minhas Finanças.')">${t}</button>`).join('')}</div>
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
    ${(window.Android && Android.atualizar) || WEB_APP ? `<div class="btns"><button class="btn" onclick="procurarAtualizacao()">${I('refresh')}Procurar atualizações</button></div>` : ''}
    <div class="btns foot"><button class="btn primary" onclick="closeForm()">Fechar</button></div>
    <div class="hint" style="text-align:center" onclick="diagTap()">Minhas Finanças · versão ${APP_VERSION}</div>`);
  settingsOpen = true;
}
// O APK instalado tem ícone para esta cor ou tema? (Os temas por categoria chegaram ao ícone no APK 1.46.)
const iconeTem = k => !SKINS[k] || SKIN_ANTIGOS.includes(k) || !!(window.Android && Android.iconeTem && Android.iconeTem(k));
// Tema especial: aplica e, no APK, oferece trocar também o ícone do app para combinar.
async function setSkin(k){
  setPref('skin', k);
  if (k && window.Android && Android.setIconeApp && Android.icone() !== k && iconeTem(k)
    && await ask(`Trocar também o ícone do app para combinar com o tema ${SKINS[k][0]}?\n\nO Android fecha o app ao trocar o ícone: é só abrir de novo pelo ícone novo.`, 'Trocar o ícone')) Android.setIconeApp(k, 't', Android.iconeNome()); // o ícone do tema: o mascote dele e as barras do app
}
// Nome livre para o app: o Android só troca o nome do app entre os que estão no APK; então o app pede à tela inicial
// um atalho com o nome escrito pela pessoa e o ícone (cor e desenho) em uso.
function askAtalho(){
  settingsOpen = false; F = null;
  showSheet(`<h3>Atalho com o seu nome</h3>
    <div class="hint" style="margin-top:0">O atalho aparece na tela inicial com o nome que você escrever e este ícone. O Android pede sua confirmação e, em alguns celulares, põe um selo pequeno do app no canto do atalho.</div>
    <div style="display:flex;justify-content:center;margin:8px 0 4px">${iconeSvg(Android.icone(), Android.iconeDesenho(), 76)}</div>
    <label for="atNome">Nome</label>
    <input id="atNome" type="text" maxlength="30" autocomplete="off" placeholder="Ex.: Meu cofre" value="${esc(sync.atalhoNome || (myName() ? 'Finanças de ' + myName() : ''))}" onkeydown="if(event.key==='Enter')atalhoCriar()">
    <div class="btns foot"><button class="btn" onclick="openSettings('seguranca')">Voltar</button><button class="btn primary" onclick="atalhoCriar()">Criar atalho</button></div>`);
}
function atalhoCriar(){
  const nome = document.getElementById('atNome').value.trim().slice(0, 30);
  if (!nome) return tell('Escreva o nome do atalho.');
  sync.atalhoNome = nome; saveSync();
  if (Android.criarAtalho(nome, Android.icone(), Android.iconeDesenho())) openSettings('seguranca');
  else tell('Esta tela inicial não aceita criar atalhos pelo app.');
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
  return espera(new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.drive(id, method, url, body || '', ctype || '', !!interactive); }));
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
const fam = (method, url, body, ctype, interactive) => espera(new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.driveFamilia(id, method, url, body || '', ctype || '', !!interactive); }));
// sync.pessoal = a pessoa está numa conta compartilhada mas escolheu ver, por enquanto, a conta pessoal (trocarConta):
// nesse modo tudo funciona como sem conta compartilhada (os dados vêm do arquivo da conta Google dela).
const shared = () => sync.shared && !sync.pessoal && sync.shared.id;
const rng = r => encodeURIComponent(r);
// Além dos dados (aba "dados"), a aba "leia-me" guarda dois avisos: A4 = "LIMPA" (conta criada do zero: quem entra não
// leva os próprios lançamentos) e A5 = "ENCERRADA|quem|quando" (alguém saiu: a conta acabou para todos). sharedInfo
// guarda o que a última leitura encontrou. Uma conta encerrada vira o erro {status:-4, por}.
let sharedInfo = {limpa:false};
async function sharedRead(id, interactive){
  const r = JSON.parse(ok(await fam('GET', `${SHEETS}/${id}/values:batchGet?ranges=${rng('dados!A:A')}&ranges=${rng('leia-me!A4:A5')}&majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`, '', '', interactive)).text).valueRanges || [];
  const v = r[0] && r[0].values, av = (r[1] && r[1].values && r[1].values[0]) || [];
  sharedInfo = {limpa:String(av[0] || '') === 'LIMPA'};
  if (String(av[1] || '').startsWith('ENCERRADA')) throw {status:-4, por:String(av[1]).split('|')[1] || '', text:'encerrada'};
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
// ---------- Pessoas e avisos da conta compartilhada ----------
// db.membros = {chave: {nome, email, desde, t}}: cada aparelho se inscreve ao sincronizar (membroEu), então a lista
// viaja junto com os dados. A chave é o e-mail da conta Google (ou o nome, se o e-mail não estiver disponível).
const membroChave = () => String((window.Android && Android.conta && Android.conta()) || myName() || 'eu').toLowerCase();
function membroEu(){
  const k = membroChave(), email = k.includes('@') ? k : '', nome = myName() || email.split('@')[0] || 'Sem nome', m = db.membros[k];
  if (m && m.nome === nome) return false;
  db.membros[k] = {nome, email, desde:(m && m.desde) || Date.now(), t:Date.now()};
  return true;
}
// O app não tem servidor: cada aparelho descobre o que os outros fizeram quando sincroniza. Ao juntar os dados, atividade()
// lista quem entrou e o que outra pessoa adicionou ou editou (gastos, ganhos e investimentos); isso vira um aviso na tela
// e fica guardado neste aparelho (ATIV_KEY). Com o app fechado, quem avisa é o lado nativo (ShareReceiver), de hora em hora.
const ATIV_KEY = 'financas-ativ', ATIV_COLS = {expenses:'o gasto', installments:'a compra parcelada', incomes:'o ganho', investments:'o investimento'};
function atividade(a, m){
  const eu = myName(), out = [];
  for (const [k, p] of Object.entries(m.membros || {})) if (!a.membros[k] && k !== membroChave()) out.push({t:p.desde || Date.now(), quem:p.nome, txt:'entrou na conta compartilhada'});
  for (const c in ATIV_COLS){
    const meus = new Map(a[c].map(r => [r.id, r.u || 0]));
    for (const r of m[c]){
      const novo = !meus.has(r.id), quem = (novo ? r.by : r.ed || r.by) || 'Alguém', v = r.value || r.total || 0;
      if ((novo || (r.u || 0) > meus.get(r.id)) && quem !== eu) out.push({t:r.u || Date.now(), quem, txt:`${novo ? 'adicionou' : 'editou'} ${ATIV_COLS[c]} ${r.desc || r.name || r.ticker || ''}`.trim() + (v ? ` (${fmt(v)})` : '')});
    }
  }
  return out.sort((x, y) => x.t - y.t);
}
function ativLista(){ try { return JSON.parse(localStorage.getItem(ATIV_KEY)) || []; } catch(e){ return []; } }
const ativGuardar = l => { try { localStorage.setItem(ATIV_KEY, JSON.stringify(l.slice(-40))); } catch(e){} };
const ativNovas = () => ativLista().filter(x => !x.visto).length;
function ativAvisar(novas){
  if (!novas.length) return;
  ativGuardar([...ativLista(), ...novas]);
  if (db.prefs.avisoComp === false) return;
  toast(novas.length === 1 ? `${novas[0].quem} ${novas[0].txt}` : `${novas.length} novidades na conta compartilhada. Veja no Resumo.`);
}
// Faixa no topo do Resumo enquanto houver novidades não vistas; tocar abre a lista.
const ativHtml = () => { const n = shared() && db.prefs.avisoComp !== false ? ativNovas() : 0, u = n && ativLista().pop();
  return n ? `<div class="card avisoComp" onclick="openAtividade()"><span>${I('bell', 20)}</span><div><b>${n === 1 ? '1 novidade' : n + ' novidades'} na conta compartilhada</b><small>${esc(u.quem)} ${esc(u.txt)}</small></div>${I('chev', 18)}</div>` : ''; };
const quando = t => new Date(t).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
function openAtividade(){
  settingsOpen = false; F = null;
  const l = ativLista().reverse();
  showSheet(`<h3>Atividade da conta compartilhada</h3>
    ${l.length ? l.map(x => `<div class="item" style="cursor:default"><span class="${x.visto ? 'muted' : 'in'}">${I(/entrou/.test(x.txt) ? 'people' : 'bell', 20)}</span><div class="mid"><b style="white-space:normal">${esc(x.quem)} ${esc(x.txt)}</b><small>${quando(x.t)}</small></div></div>`).join('')
      : '<div class="hint" style="margin-top:0">Nada por aqui ainda. Quando outra pessoa entrar na conta ou lançar algo, aparece nesta lista.</div>'}
    <div class="hint">O app confere as novidades sempre que sincroniza (ao abrir e a cada alteração) e, com ele fechado, mais ou menos de hora em hora.</div>
    <div class="btns foot"><button class="btn primary" onclick="closeForm();render()">Pronto</button></div>`);
  ativGuardar(ativLista().map(x => ({...x, visto:1})));
}
// Entrega ao lado nativo o que ele precisa para avisar com o app fechado ('' desliga).
function compNativo(){
  if (!(window.Android && Android.compart) || (sync.shared && sync.pessoal)) return; // na conta pessoal, o lado nativo segue com o último estado da compartilhada
  const ligado = shared() && db.prefs.avisoComp !== false;
  Android.compart(ligado ? JSON.stringify({id:shared(), eu:myName(), t:Math.max(0, ...Object.keys(ATIV_COLS).flatMap(c => db[c].map(r => r.u || 0))), membros:Object.keys(db.membros)}) : '');
}
// Fim da conta compartilhada neste aparelho: a lista de pessoas e os avisos dela deixam de valer.
function compFim(){ sync.pessoal = false; saveSync(); db.membros = {}; try { localStorage.removeItem(ATIV_KEY); } catch(e){} compNativo(); }
function setAvisoComp(on){
  if (on && window.Android && Android.pedirNotificacao) Android.pedirNotificacao();
  setPref('avisoComp', on); compNativo();
}
const membrosHtml = s => { const eu = membroChave(), ms = Object.entries(db.membros).sort((a, b) => a[1].desde - b[1].desde), emails = new Set(ms.map(([, m]) => m.email));
  const falta = (s.with || []).filter(e => !emails.has(e));
  return `<label>Pessoas na conta (${ms.length})</label><div class="card" style="box-shadow:none;background:var(--bg);margin:0">
    ${ms.map(([k, m]) => `<div class="item" style="cursor:default">${tile('user')}<div class="mid"><b>${esc(m.nome)}${k === eu ? ' (você)' : ''}</b><small>${m.email ? esc(m.email) + ' · ' : ''}desde ${new Date(m.desde).toLocaleDateString('pt-BR')}</small></div></div>`).join('')}
    ${falta.map(e => `<div class="item" style="cursor:default;opacity:.65">${tile('user')}<div class="mid"><b>${esc(e)}</b><small>convite enviado, ainda não entrou</small></div></div>`).join('')}
    ${ms.length ? '' : '<div class="hint" style="margin:0">A lista aparece depois da próxima sincronização.</div>'}</div>`; };
// ---------- Trocar entre a conta pessoal e a compartilhada ----------
// Quem está numa conta compartilhada continua tendo os dados pessoais guardados na própria conta Google. trocarConta()
// alterna o que este aparelho mostra: envia o que falta da conta atual, baixa os dados da outra e marca sync.pessoal.
// Enquanto troca (trocando), nenhuma sincronização roda: senão os dados de uma conta poderiam ser gravados na outra.
let trocando = false;
// Faixa no topo de todas as telas (só para quem tem conta compartilhada): diz qual conta está em uso; tocar troca.
const contaPill = () => !sync.shared ? '' : `<div class="contaPill ${sync.pessoal ? 'pes' : 'comp'}" onclick="trocarConta()">${I(sync.pessoal ? 'user' : 'people', 14)}Você está na <b>conta ${sync.pessoal ? 'pessoal' : 'compartilhada'}</b><span>Trocar</span></div>`;
// Botão do Resumo: as duas contas lado a lado, com a atual marcada.
const trocaContaHtml = () => !sync.shared ? '' : `<div class="trocaConta">${[[true, 'user', 'Pessoal'], [false, 'people', 'Compartilhada']].map(([p, ic, t]) =>
  `<button class="${!!sync.pessoal === p ? 'on' : ''}" onclick="${!!sync.pessoal === p ? '' : 'trocarConta()'}">${I(ic, 16)}${t}</button>`).join('')}</div>`;
let trocaOcupada = false; // toque duplo não troca duas vezes
async function trocarConta(semPerguntar){
  if (!sync.shared || !canSync() || trocaOcupada) return;
  trocaOcupada = true;
  try { await trocarContaJa(semPerguntar); } finally { trocaOcupada = false; }
}
async function trocarContaJa(semPerguntar){
  const paraPessoal = !sync.pessoal, destino = paraPessoal ? 'pessoal' : 'compartilhada';
  if (!semPerguntar && !await ask(paraPessoal ? 'Trocar para a sua conta pessoal?\n\nVocê passa a ver e lançar só nos seus dados. A conta compartilhada continua ligada e dá para voltar quando quiser.'
    : 'Trocar para a conta compartilhada?\n\nVocê volta a ver e lançar nos dados que divide com as outras pessoas.', 'Trocar')) return;
  await comCarga(`Abrindo a conta ${destino}…`, async () => {
    clearTimeout(syncTimer);
    while (syncing) await new Promise(r => setTimeout(r, 100));
    await syncNow(); // o que foi lançado na conta atual precisa estar guardado antes de sair dela
    if (!sync.shared) return; // a conta compartilhada foi encerrada enquanto isso (shareEnded já avisou)
    if (sync.err) return tell(`Não consegui guardar os dados da conta atual (${sync.err})\n\nSem isso não dá para trocar de conta agora. Confira a internet e tente de novo.`);
    trocando = true;
    const antes = canonS(db);
    try {
      let novo;
      if (paraPessoal){ const file = (await driveList("name='financas.json'", true))[0]; novo = file ? fixDb(await driveGet(file.id)) : fixDb({}); }
      else novo = await sharedReadDireto(sync.shared.id);
      if (!novo) throw {status:404, text:'vazia'};
      if (newerDb(novo)) return tell('Os dados dessa conta foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.');
      if (canonS(db) !== antes) return tell('Você lançou ou alterou algo enquanto a troca acontecia. Para não perder nada, a troca foi cancelada: tente de novo.');
      loadDb({...novo, prefs:db.prefs}); // nome e aparência continuam os deste aparelho
      sync.pessoal = paraPessoal; saveSync();
      rollover(); save(false); state.dia = 0;
    } catch(e){
      if (e.status === undefined) throw e;
      logErr('trocar conta', e.status + ' ' + String(e.text).slice(0, 200));
      if (!paraPessoal && (e.status === -4 || e.status === 404)){ trocando = false; sync.pessoal = false; return shareEnded(e.por || ''); }
      return tell(e.status === 0 ? 'Sem conexão com a internet: não deu para abrir a outra conta.' : `Não foi possível abrir a conta ${destino} agora (${e.status}).`);
    } finally { trocando = false; }
    closeForm(); render(); scrollTo(0, 0);
    toast(`Agora você está na conta ${destino}.`);
    syncNow();
  });
}
// Lê a planilha compartilhada mesmo com sync.pessoal ligado (shared() devolve vazio nesse modo).
const sharedReadDireto = async id => { const d = await sharedRead(id, true); return d && fixDb(d); };
// Tudo numa tela só: sem conta, as três formas de começar (cada uma com uma linha explicando); com conta, o estado,
// o código do convite à vista e as ações.
// sync.limpaProx = a conta que está sendo criada é "do zero" (fica em sync para sobreviver à ida ao Google na versão web).
function shareHtml(){
  const s = sync.shared;
  if (s && sync.pessoal) return `<div class="hint" style="margin-top:0">${I('user', 14)} Você está vendo a sua <b>conta pessoal</b>. A conta compartilhada continua ligada: troque para ela para ver as pessoas, os avisos e as outras opções.</div>
    <div class="btns"><button class="btn primary" onclick="trocarConta()">${I('people')}Trocar para a conta compartilhada</button></div>`;
  const opcao = (ic, t, d, acao) => `<button class="setTile" style="width:100%;text-align:left;margin-bottom:8px" onclick="${acao}"><span>${I(ic, 22)}</span><b>${t}</b><small>${d}</small></button>`;
  if (!s) return `<div class="hint" style="margin-top:0">Duas contas Google vendo e lançando nos mesmos dados, cada pessoa no próprio celular. Cada lançamento mostra quem fez; nome e aparência continuam de cada um.</div>
    ${!canSync() ? '<div class="hint warn">Prévia no PC: a conta compartilhada só funciona no app instalado no celular.</div>' : `
    <label>Como você quer começar?</label>
    ${opcao('people', 'Compartilhar os meus lançamentos', 'A outra pessoa passa a ver e lançar nos dados que você já tem.', "openShare('convidar')")}
    ${opcao('sparkle', 'Criar uma conta compartilhada do zero', 'Começa vazia, sem os lançamentos de ninguém. Os seus ficam guardados na sua conta.', "openShare('zero')")}
    ${opcao('download', 'Tenho um código de convite', 'Entre na conta que outra pessoa criou.', "openShare('entrar')")}`}`;
  return `<div class="hint in" style="margin-top:0">${I('people', 14)} Conta compartilhada ligada${s.limpa ? ' (criada do zero)' : ''}. ${s.owner ? (s.with && s.with.length ? 'Você criou e convidou ' + s.with.map(esc).join(', ') + '.' : 'Você criou; falta convidar alguém.') : 'Você entrou por convite.'}</div>
    ${membrosHtml(s)}
    <label>Avisos</label>
    <div class="btns" style="margin-top:0">${[[true, 'Avisar'], [false, 'Não avisar']].map(([v, t]) => `<button class="btn ${(db.prefs.avisoComp !== false) === v ? 'primary' : ''}" onclick="setAvisoComp(${v})">${t}</button>`).join('')}</div>
    <div class="hint">Avisa quando outra pessoa entra na conta ou adiciona/edita um gasto, ganho ou investimento: na tela do app e, com ele fechado, por notificação do celular (pode levar até cerca de uma hora).</div>
    <div class="btns"><button class="btn" onclick="openAtividade()">${I('bell')}Atividade recente${ativNovas() ? ` (${ativNovas()})` : ''}</button></div>
    <label>Código do convite</label>
    <div class="btns" style="margin-top:0"><input readonly value="${esc(s.id)}" style="flex:3;min-width:0;font-size:12px" onclick="this.select()"><button class="btn" style="flex:1" onclick="shareCopy()">Copiar</button></div>
    ${s.owner ? `<div class="btns"><button class="btn" onclick="openShare('convidar')">${I('people')}Convidar mais alguém</button></div>` : ''}
    <div class="hint">Os lançamentos ficam numa planilha do Google compartilhada entre vocês (não edite a planilha à mão). Cópias diárias e comprovantes continuam de cada um.</div>
    <div class="btns"><button class="btn danger" style="flex:1" onclick="shareLeave()">Sair e encerrar a conta compartilhada</button></div>
    <div class="hint">Sair encerra a conta para todos: a outra pessoa também volta para a conta individual e a planilha é apagada. Cada um pode ficar com uma cópia dos lançamentos.</div>`;
}
function openShare(modo){
  settingsOpen = false; F = null;
  if (modo === 'zero' || modo === 'convidar'){ sync.limpaProx = modo === 'zero'; saveSync(); }
  const shareLimpa = !!sync.limpaProx;
  showSheet(modo !== 'entrar' ? `<h3>${sync.shared ? 'Convidar para a conta compartilhada' : shareLimpa ? 'Conta compartilhada do zero' : 'Compartilhar os meus lançamentos'}</h3>
    <div class="hint" style="margin-top:0">${sync.shared ? 'A pessoa recebe um e-mail do Google com o convite.' : shareLimpa ? 'O app cria uma planilha vazia na sua conta Google e a compartilha com a outra pessoa. Os seus lançamentos de hoje não entram: continuam guardados na sua conta. Depois, ela abre o app e cola o código do convite.' : 'O app cria uma planilha na sua conta Google com os seus lançamentos e a compartilha com a outra pessoa, que recebe um e-mail do Google. Depois, ela abre o app, entra com a conta convidada e cola o código do convite.'}</div>
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
// limpa = conta criada do zero: começa vazia, sem os lançamentos de ninguém (os pessoais continuam guardados na conta
// de cada um e voltam ao sair).
const shareStart = umaVez(async function(email, semPerguntar, limpa = !!sync.limpaProx){
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return shErr('Digite um e-mail válido.');
  if (!limpa && db.archUntil) return shErr('Antes de compartilhar, traga de volta os anos arquivados (Configurações > Dados e ajustes > Anos antigos).');
  if (!semPerguntar && !await ask(limpa ? `Criar uma conta compartilhada do zero com ${email}?\n\nEla começa vazia, numa planilha na sua conta Google que ${email} poderá ver e editar pelo app. Os seus lançamentos de hoje continuam guardados na sua conta e voltam se a conta compartilhada for encerrada.`
    : `Criar a conta compartilhada com ${email}?\n\nOs seus lançamentos vão para uma planilha na sua conta Google, que ${email} poderá ver e editar pelo app.`, 'Criar e convidar')) return;
  if (!semPerguntar && !await famPrepare()) return;
  const fimCarga = cargaOn('Criando a conta compartilhada…');
  try {
    await syncNow(); // os dados pessoais ficam em dia na sua conta antes de passar a usar a planilha
    if (limpa && sync.err) return shErr('Não consegui guardar os seus dados pessoais na sua conta antes de criar a conta do zero. Confira a internet e tente de novo.');
    const corpo = {properties:{title:'Minhas Finanças (conta compartilhada)'}, sheets:[{properties:{title:'leia-me'}}, {properties:{title:'dados'}}]};
    const id = JSON.parse(ok(await fam('POST', SHEETS, JSON.stringify(corpo), 'application/json', true)).text).spreadsheetId;
    sync.famOk = true;
    await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A1:A3')}?valueInputOption=RAW`, JSON.stringify({values:[['Esta planilha guarda os dados do app Minhas Finanças compartilhados entre contas Google.'], ['Não edite nem apague: o app lê e grava a aba "dados".'], ['Para parar de compartilhar, use "Sair da conta compartilhada" no app.']]}), 'application/json');
    const vazio = limpa ? {...fixDb({}), prefs:db.prefs} : null;
    if (limpa) ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A4')}?valueInputOption=RAW`, JSON.stringify({values:[['LIMPA']]}), 'application/json'));
    else { claimMine(); save(false); }
    await sharedWrite(id, JSON.stringify(vazio || db));
    sync.shared = {id, owner:true, with:[], limpa:!!limpa}; saveSync();
    // Só depois de a planilha estar gravada o aparelho passa a mostrar a conta vazia (os dados pessoais já estão na conta).
    if (vazio){ loadDb(vazio); rollover(); save(false); render(); }
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
  } finally { fimCarga(); }
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
  const fimCarga = cargaOn('Abrindo a conta compartilhada…');
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
    if (e.status === -4) return shErr('Esta conta compartilhada já foi encerrada. Peça para a outra pessoa criar uma nova e mandar o novo código.');
    return shErr(sharedMsg(e) || (e.status === 0 ? 'Sem conexão com a internet.' : 'Não foi possível abrir a conta compartilhada (' + e.status + ').'));
  } finally { fimCarga(); }
  if (!escolha){
    const temMeus = COLS.some(c => db[c].length);
    if (!temMeus || sharedInfo.limpa) escolha = 'so'; // conta criada do zero: ninguém leva os próprios lançamentos
    else return pickList('E os lançamentos que já estão neste app?', [['juntar', 'Juntar aos da conta compartilhada'], ['so', 'Usar só os da conta compartilhada (os meus continuam guardados na minha conta)']], '', v => shareJoin(id, v));
  }
  const prefs = db.prefs;
  if (escolha === 'juntar'){ claimMine(); loadDb({...mergeDb(db, remote), prefs}); }
  else loadDb({...remote, prefs});
  rollover(); save(false);
  sync.shared = {id, owner:false, limpa:sharedInfo.limpa}; saveSync();
  if (window.Android && Android.pedirNotificacao && !window.TESTE) Android.pedirNotificacao(); // para os avisos do que a outra pessoa lançar
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
// Sair encerra a conta compartilhada para todos: a planilha recebe o aviso "ENCERRADA", a outra pessoa é desligada na
// próxima sincronização dela (shareEnded) e a planilha é apagada (por quem a criou: só o dono consegue apagar o arquivo).
// escolha: 'copia' = este aparelho fica com uma cópia dos lançamentos compartilhados, juntada aos dados pessoais;
// 'so' = volta só aos dados pessoais, como estavam antes de compartilhar.
const apagarPlanilha = id => fam('DELETE', `${DRIVE}/drive/v3/files/${id}`).catch(() => ({status:0}));
const shareLeave = umaVez(async function(escolha){
  if (!escolha){
    if (!await ask('Sair e ENCERRAR a conta compartilhada?\n\nIsto vale para todos: a outra pessoa também é desligada e volta para a conta individual dela, e a planilha compartilhada é apagada. Não dá para desfazer.\n\nNinguém perde os lançamentos: cada pessoa pode ficar com uma cópia na própria conta.', 'Encerrar para todos', true)) return;
    return pickList('O que fazer com os lançamentos compartilhados neste aparelho?', [['copia', 'Ficar com uma cópia, junto com os meus dados'], ['so', 'Não ficar: voltar só aos meus dados de antes']], '', v => shareLeave(v));
  }
  return comCarga('Encerrando a conta compartilhada…', async () => {
  const id = shared(), dono = sync.shared.owner;
  await syncNow(); // as últimas alterações deste aparelho vão para a planilha antes do aviso
  let pessoal = null;
  try {
    // 'so': primeiro baixa os dados pessoais; sem eles (sem internet), não sai: senão os compartilhados iriam para a conta pessoal.
    if (escolha === 'so'){ const file = (await driveList("name='financas.json'", true))[0]; pessoal = file ? fixDb(await driveGet(file.id)) : fixDb({}); }
    ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A5')}?valueInputOption=RAW`, JSON.stringify({values:[[`ENCERRADA|${myName() || (Android.conta && Android.conta()) || ''}|${Date.now()}`]]}), 'application/json', true));
  } catch(e){
    // A planilha já não existe ou já foi encerrada: segue saindo. Outro erro (sem internet): não sai, para a outra pessoa não ficar numa conta que só um lado abandonou.
    if (e.status !== 404 && e.status !== -4){ logErr('sair compartilhada', e.status ? e.status + ' ' + String(e.text).slice(0, 200) : e); return tell('Não consegui encerrar a conta compartilhada agora (sem internet?). Tente de novo.'); }
  }
  if (dono) await apagarPlanilha(id);
  sync.shared = null; saveSync(); compFim();
  if (pessoal){ loadDb({...pessoal, prefs:db.prefs}); rollover(); save(false); }
  await syncNow();
  closeForm(); render();
  tell(`Conta compartilhada encerrada. ${escolha === 'so' ? 'Este aparelho voltou aos seus dados pessoais.' : 'Você ficou com uma cópia dos lançamentos na sua conta.'}\n\nA outra pessoa será desligada assim que o app dela sincronizar.`);
  });
});
// A conta compartilhada foi encerrada por outra pessoa (ou a planilha sumiu): este aparelho volta à conta individual,
// guardando os lançamentos compartilhados como uma cópia junto aos dados pessoais. Quem criou a planilha a apaga.
async function shareEnded(por){
  const s = sync.shared; if (!s) return;
  sync.shared = null; sync.err = ''; saveSync(); compFim(); save(false);
  if (s.owner) await apagarPlanilha(s.id);
  if (!sheetOpen()) render(); else if (settingsShown()) openSettings();
  tell(`A conta compartilhada foi encerrada${por ? ' por ' + por : ''}.\n\nVocê voltou para a sua conta individual e ficou com uma cópia dos lançamentos compartilhados.`);
  setTimeout(syncNow, 300); // junta a cópia com os dados pessoais da sua conta
}

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
  out.membros = {...b.membros};
  for (const [k, m] of Object.entries(a.membros || {})) if (!out.membros[k] || (m.t || 0) >= (out.membros[k].t || 0)) out.membros[k] = m;
  out.catMemo = {...b.catMemo, ...a.catMemo};
  out.yieldLog = {...b.yieldLog, ...a.yieldLog};
  out.netLog = {...b.netLog, ...a.netLog};
  return out;
}
// Texto para comparar dois estados sem depender da ordem das chaves.
const SYNCED = [...COLS, 'tomb', 'prefs', 'budgets', 'cardClose', 'cardDue', 'cardAcc', 'cardLimit', 'archUntil', 'cats', 'catMemo', 'yieldLog', 'netLog', 'membros'];
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
const offlinePill = () => contaPill() + (offline() ? `<div class="offline">${I('signal', 14)}Sem conexão: o que você lançar fica salvo e sincroniza depois.</div>` : '');
addEventListener('online', () => { render(); syncNow(); });
addEventListener('offline', () => render());
function scheduleSync(){ if (!canSync() || !sync.on) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 3000); }
async function syncNow(interactive){
  if (!canSync() || !sync.on || trocando) return;
  if (syncing){ syncAgain = true; return; } // houve alteração durante a sincronização: repete ao terminar
  syncing = true;
  try {
    // Na conta compartilhada, os dados vêm da planilha (sharedRead); senão, do arquivo na pasta oculta do Drive.
    const sid = shared(), file = sid ? null : (await driveList("name='financas.json'", interactive))[0];
    const bruto = sid ? await sharedRead(sid, interactive) : file ? await driveGet(file.id) : null, remote = bruto && fixDb(bruto);
    if (newerDb(remote)) throw {status:-3};
    if (sid && membroEu()) save(false); // este aparelho entra na lista de pessoas da conta
    if (remote){
      const merged = mergeDb(db, remote);
      if (sid) merged.prefs = db.prefs; // nome e aparência são de cada pessoa
      if (canonS(merged) !== canonS(db)){
        const veio = incoming(db, merged), novas = sid ? atividade(db, merged) : [];
        keepBefore(); // cópia deste aparelho antes de juntar, para poder desfazer
        loadDb(merged); rollover(); save(false);
        if (novas.length) ativAvisar(novas); // conta compartilhada: diz quem fez o quê
        else if (veio) toast(`Sincronizado: ${veio} ${veio > 1 ? 'alterações vieram' : 'alteração veio'} de outro aparelho.`);
        if (!sheetOpen()) render();
      }
    }
    compNativo();
    if (!remote || canonS(db) !== canonS(remote)) await (sid ? sharedWrite(sid, JSON.stringify(db)) : driveWrite(file && file.id, 'financas.json', JSON.stringify(db)));
    Object.assign(sync, {linked:true, at:Date.now(), err:'', retry:0});
    clearTimeout(retryTimer);
    await dailyBackup().catch(() => {}); // a cópia diária não pode derrubar a sincronização
    await syncPhotos().catch(() => {});  // comprovantes pendentes: se falhar, ficam na fila para a próxima vez
    await sheetSync().catch(() => {});   // planilha do Google ligada ao app (se houver)
  } catch(e){
    // Conta compartilhada encerrada pela outra pessoa (aviso na planilha) ou planilha apagada: este aparelho volta sozinho
    // para a conta individual, ficando com uma cópia dos lançamentos.
    if (shared() && (e.status === -4 || e.status === 404)){ shareEnded(e.por || ''); return; }
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
  try { files = await comCarga('Buscando as versões salvas…', () => driveList("name contains 'backup-'")); }
  catch(e){ return showSheet('<h3>Versões salvas na conta</h3><div class="hint">Não foi possível carregar. Verifique a internet.</div><div class="btns"><button class="btn" onclick="openSettings(\'conta\')">Voltar</button></div>'); }
  showSheet(`<h3>Versões salvas na conta</h3>
    <div class="hint" style="margin-top:0">O app guarda uma cópia por dia de uso, por 30 dias. Restaurar troca todos os dados atuais pelos daquele dia, em todos os aparelhos.</div>
    ${files.length ? files.map(f => `<div class="item" data-id="${esc(f.id)}" data-name="${esc(f.name)}" onclick="restoreBackup(this.dataset.id,this.dataset.name)"><div class="mid"><b>${fmtDate(f.name.slice(7, 17))}</b></div><div class="muted">Restaurar ›</div></div>`).join('') : '<div class="hint">Ainda não há cópias. A primeira é criada na próxima sincronização.</div>'}
    <div class="btns"><button class="btn" onclick="openSettings('conta')">Voltar</button></div>`);
}
async function restoreBackup(id, name){
  if (!await ask(`Restaurar os dados de ${fmtDate(name.slice(7, 17))}?\nOs dados atuais serão substituídos.`, 'Restaurar', true)) return;
  let snap;
  try { snap = fixDb(await comCarga('Baixando a versão escolhida…', () => driveGet(id))); } catch(e){ return tell('Não foi possível baixar essa versão.'); }
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
  if (shared()) claimMine(); // na conta compartilhada, o que foi lançado sem nome passa a ser seu
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
// Um aviso de cada vez: se outra tela estiver aberta (novidades, tutorial, login, bloqueio), o aviso de versão nova
// espera ela fechar (updPend/updFlush) em vez de aparecer por cima. Com um formulário aberto, só um recado curto.
// updManual = a pessoa tocou em "Procurar atualizações": aí a resposta aparece sempre, mesmo que seja "já está em dia".
let updManual = false, updPend = null;
function procurarAtualizacao(){
  if (!(window.Android && Android.atualizar)) return webProcurar();
  updManual = true; toast('Procurando atualização…'); Android.atualizar();
}
function onAtualizacao(tipo, versao, url, novas){
  const manual = updManual; updManual = false;
  if (tipo === 'nada') return tell(`Você já está na versão mais recente (${APP_VERSION}).`);
  if (tipo === 'erro') return tell('Não consegui procurar atualizações. Confira a internet e tente de novo.');
  if (tipo !== 'web' && tipo !== 'apk') return;
  if (tipo === 'apk' && !manual && sync.apkAsk === versao + dayStr(Date.now())) return; // sozinho, no máximo uma vez por dia
  if (tipo === 'web' && !manual && F) return toast(`Versão ${versao} baixada. Ela entra na próxima vez que você abrir o app.`);
  updPend = {versao, novas, url:tipo === 'apk' ? url : ''};
  updFlush(manual);
}
const updOcupado = () => sheetOpen() || ['gate', 'lockAsk'].some(id => !document.getElementById(id).hidden) || !!document.getElementById('abre');
// Mostra o aviso pendente quando a tela estiver livre (agora = pedido pela pessoa: troca a tela das Configurações).
function updFlush(agora){
  clearTimeout(updFlush.t);
  if (!updPend) return;
  if (agora !== true && updOcupado()){ updFlush.t = setTimeout(updFlush, 1200); return; }
  const u = updPend; updPend = null;
  if (u.url){ sync.apkAsk = u.versao + dayStr(Date.now()); saveSync(); }
  openUpdate(u.versao, u.novas, u.url);
}
// Versão web: confere a versão publicada; se for mais nova, recarrega (o app busca os arquivos novos na rede).
async function webProcurar(){
  try {
    const j = await comCarga('Procurando atualização…', async () => (await fetch('https://raw.githubusercontent.com/GabrielGior/minhas-financas-app/main/atualizacao/versao.json?t=' + Date.now(), {cache:'no-store'})).json());
    if (verNum(j.versao) <= verNum(APP_VERSION)) return tell(`Você já está na versão mais recente (${APP_VERSION}).`);
    if (await ask(`Saiu a versão ${j.versao}. Atualizar agora? Seus dados não mudam.`, 'Atualizar')) location.reload();
  } catch(e){ tell('Não consegui procurar atualizações. Confira a internet e tente de novo.'); }
}
const newsHtml = lista => lista.map(([t, s]) => `<div class="item" style="cursor:default"><span class="in">${I('sparkle', 22)}</span><div class="mid"><b style="white-space:normal">${esc(t)}</b><small>${esc(s)}</small></div></div>`).join('');
// Aviso de versão nova, com a prévia do que vem nela. url vazio: as telas já foram baixadas e basta recarregar;
// com url: é preciso baixar e instalar o APK.
function openUpdate(versao, novas, url){
  settingsOpen = false; F = null;
  updUrl = url; updVer = versao;
  showSheet(`<h3>Nova versão ${esc(versao)} disponível</h3>
    <div class="hint" style="margin-top:0">${url ? 'Esta atualização precisa ser instalada: o Android baixa o arquivo e pede sua confirmação. Seus dados continuam no aparelho e na sua conta.' : 'A atualização já foi baixada. Seus dados não mudam.'}</div>
    ${updNews(novas)}
    <div class="btns foot"><button class="btn" onclick="closeForm()">Depois</button><button class="btn primary" onclick="updateNow()">${url ? 'Baixar e instalar' : 'Atualizar agora'}</button></div>`);
}
let updUrl = '', updVer = '';
// Prévia das novidades: cada item pode trazer a versão ([título, texto, versão]); mostra só as das versões que a
// pessoa ainda não tem, separadas por versão quando são várias.
function updNews(novas){
  if (!Array.isArray(novas)) return '';
  const faltam = novas.filter(n => !n[2] || verNum(n[2]) > verNum(APP_VERSION)), vs = [...new Set(faltam.map(n => n[2] || ''))];
  if (!faltam.length) return '';
  return vs.length < 2 ? `<label>O que vem nesta versão</label>${newsHtml(faltam)}` : vs.map(v => `<label>Versão ${esc(v)}</label>${newsHtml(faltam.filter(n => (n[2] || '') === v))}`).join('');
}
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

