// Cofrim — Sugestões de gasto: as notificações dos bancos, carteiras e vales lidas pelo lado nativo (BankListener) viram
// sugestões no Resumo; lançadas, ignoradas e abertas ficam guardadas e aparecem no menu de três barras (openSugestoes).
// Depende de dados.js, telas.js (bankName nas telas) e formularios.js (formulário); usado por telas.js (Resumo),
// central.js (central abre a sugestão), inicio.js (atalhos e avisosConfigEnviar) e pelo Java (window.onAvisoBanco).

// ---------- Apps que podem gerar sugestões (o único lugar da lista; o lado nativo recebe a mesma por avisosConfig) ----------
// Só bancos, carteiras digitais, cartões e vales-benefício. Para ampliar: um pacote novo em BANK_APPS (com o nome) ou
// uma palavra em APPS_PADROES. APPS_ANUNCIO: texto de propaganda (oferta, cupom, "bora"…), descartado mesmo de um banco.
const BANK_APPS = {'com.nu.production':'Nubank', 'br.com.intermedium':'Inter', 'com.itau':'Itaú', 'br.com.bb.android':'Banco do Brasil',
  'com.bradesco':'Bradesco',
  'br.com.gabba.Caixa':'Caixa', 'br.gov.caixa.tem':'Caixa Tem', 'com.santander.app':'Santander', 'com.c6bank.app':'C6 Bank', 'com.picpay':'PicPay',
  'com.mercadopago.wallet':'Mercado Pago', 'br.com.uol.ps.myaccount':'PagBank', 'br.com.neon':'Neon', 'br.com.bradesco.next':'Next',
  'com.btg.pactual.banking':'BTG Pactual', 'br.com.banrisul':'Banrisul', 'br.com.digio':'Digio', 'br.com.willbank':'Will Bank'};
// Carteiras digitais: podem sugerir, mas não são a conta do lançamento (o campo banco fica em branco).
const CARTEIRA_APPS = {'com.google.android.apps.walletnfcrel':'Google Carteira', 'com.samsung.android.spay':'Samsung Wallet'};
const APPS_PADROES = ['(^|\\.)(nu|bank|banco|itau|bradesco|santander|caixa|inter|sicredi|sicoob|picpay|mercadopago|pagbank|pagseguro|neon|next|btg|c6|original|banrisul|safra|digio|bancopan|will|nubank)(\\.|$|bank)',
  'wallet|(^|\\.)(spay|samsungpay)(\\.|$)', 'alelo|pluxee|sodexo|swile|valecard|greencard|upbrasil|benef|(^|\\.)(ticket|vr|flash|caju)(\\.|$)'];
const APPS_ANUNCIO = 'oferta|promo[cç]|promo\\b|cupo[nm]|desconto de|\\bbora\\b|aproveit|imperd[ií]ve|frete gr[aá]tis|s[oó] hoje|[uú]ltim[oa]s (dias|horas|unidades)|black friday|liquida[cç]|ganhe at[eé]|pe[cç]a j[aá]|garanta (j[aá]|o seu|a sua)|corre que';
// Apps que a pessoa mandou não sugerir mais (Ignorar › Não sugerir do <app>), só neste aparelho: [{app, nome}]. Até a
// 1.77 a lista era só de pacotes (["com.x"]); ao ler, ela passa para o formato novo sem perder nenhum app.
const APPS_BLOQ_KEY = 'financas-apps-bloqueados';
function appsIgnorados(){
  let l = [];
  try { l = JSON.parse(localStorage.getItem(APPS_BLOQ_KEY)) || []; } catch(e){}
  if (!Array.isArray(l)) l = [];
  const novo = l.map(x => typeof x === 'string' ? {app:x, nome:''} : x).filter(x => x && x.app);
  if (l.some(x => typeof x === 'string')) appsIgnoradosGuardar(novo);
  return novo;
}
function appsIgnoradosGuardar(l){ try { localStorage.setItem(APPS_BLOQ_KEY, JSON.stringify(l)); } catch(e){} }
const appsBloqueados = () => appsIgnorados().map(x => x.app); // só os pacotes (o que o lado nativo recebe)
const nomeIgnorado = x => BANK_APPS[x.app] || CARTEIRA_APPS[x.app] || x.nome || x.app;
function appIgnorar(app, nome){
  if (!appsBloqueados().includes(app)) appsIgnoradosGuardar([...appsIgnorados(), {app, nome:nome || ''}]);
  avisosConfigEnviar();
}
const appFinanceiro = pacote => !!BANK_APPS[pacote] || !!CARTEIRA_APPS[pacote] || APPS_PADROES.some(p => new RegExp(p, 'i').test(pacote || ''));
const ehAnuncio = texto => new RegExp(APPS_ANUNCIO, 'i').test(String(texto || ''));
// Pode virar sugestão: de um app financeiro, que a pessoa não bloqueou, e sem cara de propaganda.
const notaPermitida = n => !!n && appFinanceiro(n.app) && !appsBloqueados().includes(n.app) && (n.oculto || !ehAnuncio(n.texto));
// Entrega a lista ao lado nativo (BankListener), para ele nem guardar o que não vale.
function avisosConfigEnviar(){
  if (temNativo('avisosConfig')) nativo('avisosConfig', JSON.stringify({pacotes:Object.keys({...BANK_APPS, ...CARTEIRA_APPS}),
    padroes:APPS_PADROES, anuncio:APPS_ANUNCIO, bloqueados:appsBloqueados()}));
}
// Sugestão nova pela notificação do banco: uma mensagem na central, com o horário do aviso (uma vez cada).
function centralBanco(list){
  let visto = 0; try { visto = +localStorage.getItem('financas-central-banco') || 0; } catch(e){}
  const novas = list.filter(x => x.n.t > visto);
  if (!novas.length) return;
  // Cada sugestão é um item próprio (não agrupa), e o toque abre o formulário dela (abrirSugestao).
  for (const x of novas) centralAdd(x.p.hidden ? `Novo aviso do ${bankName(x.n)}: toque para lançar o valor.`
    : `Nova sugestão: ${fmtTexto(x.p.value)}${x.p.desc ? ' em ' + x.p.desc : ''} (${bankName(x.n)})`, 'info', x.n.t, {k:'sug', t:x.n.t});
  try { localStorage.setItem('financas-central-banco', String(Math.max(...novas.map(x => x.n.t)))); } catch(e){}
}
function bankNotes(){ if (demoOn) return demoNotas;
  try { return temNativo('avisosBanco') ? JSON.parse(nativo('avisosBanco')).filter(notaPermitida) : []; } catch(e){ return []; } }
// {value, desc, income, bank, date} a partir do texto da notificação; null se não houver valor.
// Notificação que chegou escondida (n.oculto, ver BankListener): {hidden, app, title, income, bank, date}, sem valor.
// Nome do app que avisou: o da lista, o que o Android informou ou, sem nenhum, o do pacote (ex.: "mcdonalds").
const bankName = n => BANK_APPS[n.app] || CARTEIRA_APPS[n.app] || n.nome || (String(n.app || '').split('.').filter(p => !/^(com|br|android|apps?|mobile|mobileapp|production|prod)$/i.test(p)).pop() || 'banco');
// App de vale: a empresa vem do nome do pacote; o vale (VR ou VA), do texto ou, sem pista, do único vale que a pessoa usa
// (k = '' quando não dá para saber: o app pergunta).
const VALE_APPS = [[/alelo/i, 'Alelo'], [/pluxee/i, 'Pluxee'], [/sodexo/i, 'Sodexo'], [/ticket/i, 'Ticket'], [/ifood/i, 'iFood Benefícios'],
  [/flash/i, 'Flash'],
  [/caju/i, 'Caju'], [/swile/i, 'Swile'], [/upbrasil/i, 'Up Brasil'], [/greencard/i, 'Greencard'], [/(^|\.)vr(\.|$)/i, 'VR']];
function valeDaNota(n){
  if (n.tipo !== 'vale') return null;
  const t = String(n.texto || '') + ' ' + String(n.nome || ''), usados = ['vr', 'va'].filter(temVale), e = VALE_APPS.find(([re]) => re.test(n.app));
  const k = /aliment|mercado|supermerc|a[cç]ougue|hortifr/i.test(t) ? 'va' : /refei|restaur|lanch/i.test(t) ? 'vr' : usados.length === 1 ? usados[0] : '';
  return {k, emp:e ? e[1] : ''};
}
function parseBankNote(n){
  const date = new Date(n.t).toLocaleDateString('sv');
  const v = valeDaNota(n), vale = v ? {vale:v} : {};
  if (n.oculto) return {hidden:true, value:0, desc:'', title:String(n.titulo || ''), app:bankName(n),
    income:/receb|transfer[eê]ncia recebida|dep[oó]sito|creditad/i.test(n.titulo), bank:BANK_APPS[n.app] || '', date, ...vale};
  const m = String(n.texto).match(/R\$\s?(\d[\d.]*,\d{2})/);
  if (!m) return null;
  const t = n.texto, loja = t.match(/\b(?:em|no|na)\s+([A-ZÀ-Ú0-9][^.,;\n]*?)(?=\s+(?:foi|no valor|com (?:o|seu)|para|às|as \d|em \d)|[.,;\n]|$)/);
  const desc = (loja ? loja[1] : t.split(' — ')[0]).trim().slice(0, 40);
  return {value:parseNum(m[1]), desc:cap(desc.toLowerCase()), income:/receb|pix recebido|transfer[eê]ncia recebida|dep[oó]sito|creditad/i.test(t),
    bank:BANK_APPS[n.app] || '', date:new Date(n.t).toLocaleDateString('sv'), ...vale};
}
function bankNotesHtml(){
  const list = bankNotes().map((n, i) => ({i, n, p:parseBankNote(n)})).filter(x => x.p).slice(-5).reverse();
  centralBanco(list);
  // Só as novas: lançadas, ignoradas e abertas ficam na tela Sugestões de gasto, no menu de três barras (openSugestoes).
  const todas = bankNotes().length;
  return list.length ? `<div class="card"><div class="sugTopo"><b>${I('sparkle')} Sugestões de gasto</b>${todas > 1 ? `<button class="btn" data-onclick="noteIgnorarTodas()">Ignorar todas</button>` : ''}</div>${list.map(({i, n, p}) => `
    <div class="semCursor item"><div class="mid">${p.hidden
      ? `<b>Novo aviso do ${esc(p.app)}</b><small class="quebra">${p.title ? esc(p.title) + ' · ' : ''}${new Date(n.t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}. Não deu para ler o valor (o Android esconde avisos com números parecidos com código); confira no app do banco.</small>`
      : `<b>${esc(p.desc)}</b><small class="quebra">${esc(bankName(n))} · ${esc(String(n.texto).slice(0, 90))}</small>`}</div>
      <div style="flex:none;text-align:right"><div class="val ${p.income ? 'in' : 'out'}">${p.hidden ? 'R$ ?' : fmt(p.value)}</div>
      <button class="btn primary" style="padding:7px 10px;margin-top:4px" data-onclick="noteUse(${+n.t})">Lançar</button> <button class="btn" style="padding:7px 10px;margin-top:4px" data-onclick="noteIgnorar(${+n.t})">Ignorar</button></div></div>`).join('')}</div>` : '';
}
// Os botões levam a hora do aviso (t), não a posição: a lista pode mudar se chegar um aviso novo com a tela aberta.
// Uma sugestão que sai da lista (lançada ou ignorada) vai para a tela Sugestões de gasto (ver openSugestoes, em js/exporta.js).
// Ignorar: só esta sugestão ou, daqui para frente, nada deste app (guardado neste aparelho; vale também no lado nativo).
function noteIgnorar(t){
  const n = bankNotes().find(n => n.t === t);
  if (!n) return render();
  pickList('Ignorar', [['esta', 'Ignorar esta sugestão'], ['app', `Não sugerir do ${bankName(n)}`]], '', v => {
    noteDrop(t); // antes de bloquear: depois o app some da lista e a sugestão não iria para o histórico
    if (v === 'app'){
      appIgnorar(n.app, bankName(n));
      toast(`O app não vai mais sugerir lançamentos do ${bankName(n)}.`);
      render();
    }
  });
}
// Ignorar todas as novas de uma vez (também as que não cabem nas cinco do Resumo): vão para a tela Sugestões de gasto como
// "ignoradas" e saem da barra do Android, com "Desfazer". Não bloqueia nenhum app.
async function noteIgnorarTodas(){
  const novas = bankNotes(), ts = new Set(novas.map(n => n.t));
  if (!novas.length) return render();
  if (!await ask(`Ignorar ${novas.length > 1 ? `as ${novas.length} sugestões novas` : 'a sugestão nova'}? Elas continuam na tela Sugestões de gasto, no menu de três barras.`, 'Ignorar todas')) return;
  const antes = sugLog();
  novas.forEach(n => avisoCancelar(n.t));
  if (demoOn) demoNotas = [];
  else { novas.forEach(n => sugGuardar(n, 'ignorada')); nativo('avisosGuardar', JSON.stringify(bankNotes().filter(n => !ts.has(n.t)))); }
  render();
  showUndo(`${novas.length} ${novas.length > 1 ? 'sugestões ignoradas' : 'sugestão ignorada'}`, () => {
    if (demoOn) demoNotas = [...novas, ...demoNotas];
    else { try { localStorage.setItem(SUG_KEY, JSON.stringify(antes)); } catch(e){} nativo('avisosGuardar', JSON.stringify([...novas, ...bankNotes()])); }
    render();
  });
}
function noteDrop(t, st = 'ignorada'){
  const n = bankNotes().find(n => n.t === t);
  avisoCancelar(t); // a notificação dela, se ainda estiver na barra do Android
  if (n && demoOn){ demoNotas = demoNotas.filter(n => n.t !== t); } // demonstração: só na memória
  else if (n){ sugGuardar(n, st); nativo('avisosGuardar', JSON.stringify(bankNotes().filter(n => n.t !== t))); }
  else if (st === 'lancada') sugGuardar(sugLog().find(n => n.t === t), st); // relançada a partir do histórico
  render();
}
// Formulário aberto por uma sugestão foi salvo (submitForm): só aí ela vira "lançada". Nova (ainda no Resumo): sai da
// lista e da barra do Android; já no histórico (aberta, ignorada): muda a situação lá.
function sugLancada(t){ if (bankNotes().some(n => n.t === t)) noteDrop(t, 'lancada'); else sugMarcar(t, 'lancada'); }
function noteUse(t){
  const nova = bankNotes().find(n => n.t === t), n = nova || sugLog().find(n => n.t === t), p = n && parseBankNote(n);
  if (!p) return render(); // já lançado ou ignorado
  if (F && F.sug === t) return; // toque duplo: o formulário dela já está aberto
  const value = p.hidden ? '' : moneyStr(p.value); // aviso escondido: o valor fica para a pessoa digitar
  const quando = {start:p.date.slice(0, 7), day:String(+p.date.slice(8))}, v = p.vale, emp = k => (v && v.emp) || valeEmp(k);
  const credito = k => openForm('incomes', null, {vale:true, sug:t, vals:{cat:k, emp:emp(k), value, ...quando}});
  const noVale = pay => openForm('expenses', null, {vale:true, sug:t, vals:{desc:p.desc, value, pay, emp:emp(pay), fixed:'', ...quando}, more:true});
  // App de vale com o vale conhecido: lança direto nele (crédito do benefício ou gasto).
  // (A sugestão só vira "lançada" se o formulário for salvo, em sugLancada; cancelar deixa como estava.)
  if (v && v.k) return p.income ? credito(v.k) : noVale(v.k);
  if (v && p.income) return pickList('Esse crédito entrou em qual vale?', Object.entries(VALES).filter(([k]) => k !== 'vt'), null, k => {
    if (nova && !bankNotes().some(n => n.t === t)) return;
    credito(k);
  });
  if (p.income) return openForm('incomes', null, {sug:t, vals:{desc:p.desc, value, fixed:'', bank:p.bank, ...quando}, more:true});
  // Gasto: antes de abrir, pergunta se saiu do dinheiro normal ou de um vale (os vales ficam separados).
  pickList('Esse gasto foi pago com…', [['', 'Dinheiro normal (conta, cartão, Pix)'], ...Object.entries(VALES)], null, pay => {
    if (nova && !bankNotes().some(n => n.t === t)) return; // já lançado ou ignorado
    if (pay) return noVale(pay);
    openForm('expenses', null,
      {sug:t, vals:{desc:p.desc, value, ...(p.desc ? {cat:guessCat(p.desc)} : {}), bank:p.bank, start:p.date.slice(0, 7), day:String(+p.date.slice(8))},
      more:true});
  });
}
// Configurações › Lançamento automático › Apps ignorados: a lista e o "Voltar a sugerir" de cada um.
function openAppsIgnorados(){
  settingsOpen = false; F = null;
  const l = appsIgnorados();
  showSheet(`<h3>Apps ignorados</h3>
    <div class="semTopo hint">Destes apps o Cofrim não sugere lançamentos. Ao voltar a sugerir, valem só as próximas notificações: as que chegaram enquanto o app estava ignorado não voltam.</div>
    ${l.length ? `<div class="plano card">${l.map((x, i) => `<div class="semCursor item"><div class="mid"><b>${esc(nomeIgnorado(x))}</b>${nomeIgnorado(x) !== x.app ? `<small>${esc(x.app)}</small>` : ''}</div>
      <button class="btn" style="flex:none;padding:7px 10px" data-onclick="appVoltar(${i})">Voltar a sugerir</button></div>`).join('')}</div>`
    : '<div class="hint">Nenhum app ignorado.</div>'}
    <div class="btns foot"><button class="btn" data-onclick="openSettings('auto')">Voltar</button><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
}
async function appVoltar(i){
  const x = appsIgnorados()[i];
  if (!x) return openAppsIgnorados();
  const nome = nomeIgnorado(x);
  if (!await ask(`Voltar a receber sugestões do ${nome}?`, 'Voltar a sugerir')) return;
  appsIgnoradosGuardar(appsIgnorados().filter(y => y.app !== x.app));
  avisosConfigEnviar();
  toast(`O ${nome} volta a gerar sugestões a partir das próximas notificações.`);
  openAppsIgnorados();
}
// Notificação de uma sugestão (BankListener): some da barra quando a sugestão sai da lista por outro caminho.
const avisoCancelar = t => { if (temNativo('avisoCancelar')) nativo('avisoCancelar', String(t)); };
// Toque na notificação "Novo gasto encontrado" (Android) ou na sugestão da central: vai para Gastos (ou Ganhos) e abre
// direto o formulário já preenchido, sem a pergunta "Esse gasto foi pago com…". A sugestão sai do Resumo na hora e vai
// para o histórico como "aberta"; salvar o formulário a marca como "lançada" (submitForm). Sugestão que já saiu da lista
// abre o histórico com ela destacada. "teste" (Diagnóstico › Testar aviso de gasto): só o formulário, sem sugestão.
function abrirSugestao(t){
  if (needGate() || demoOn) return;
  if (t === 'teste') return abrirFormSugestao({value:12.34, desc:'Padaria teste', income:false, bank:'', date:new Date().toLocaleDateString('sv')}, null);
  t = +t;
  if (F && F.sug === t) return; // toque duplo: o formulário dela já está aberto
  const n = bankNotes().find(x => x.t === t), p = n && parseBankNote(n);
  if (!p) return openSugestoes(t);
  sugGuardar(n, 'aberta');
  nativo('avisosGuardar', JSON.stringify(bankNotes().filter(x => x.t !== t)));
  avisoCancelar(t);
  abrirFormSugestao(p, t);
}
function abrirFormSugestao(p, t){
  const value = p.hidden ? '' : moneyStr(p.value), quando = {start:p.date.slice(0, 7), day:String(+p.date.slice(8))}, v = p.vale;
  const emp = k => (v && v.emp) || valeEmp(k), aba = p.income ? 'ganhos' : 'gastos';
  closeForm();
  if (visTabs().includes(aba)) state.tab = aba;
  state.gsub = 'mes'; state.month = curYM; state.parcDet = '';
  render(); scrollTo(0, 0);
  // App de vale com o vale conhecido: no vale. Vale desconhecido: dinheiro normal (o formulário de gasto comum não escolhe vale).
  if (v && v.k) return p.income ? openForm('incomes', null, {vale:true, sug:t, vals:{cat:v.k, emp:emp(v.k), value, ...quando}})
    : openForm('expenses', null, {vale:true, sug:t, vals:{desc:p.desc, value, pay:v.k, emp:emp(v.k), fixed:'', ...quando}, more:true});
  if (p.income) return openForm('incomes', null, {sug:t, vals:{desc:p.desc, value, fixed:'', bank:p.bank, ...quando}, more:true});
  openForm('expenses', null, {sug:t, vals:{desc:p.desc, value, ...(p.desc ? {cat:guessCat(p.desc)} : {}), bank:p.bank, ...quando}, more:true});
}
// Sugestão nova guardada com o app aberto (aviso do lado nativo): o Resumo e a central se atualizam na hora.
let avisoBancoVisto = 0;
window.onAvisoBanco = () => {
  const l = bankNotes(), ult = l.length ? Math.max(...l.map(n => n.t)) : 0;
  if (ult <= avisoBancoVisto) return;
  avisoBancoVisto = ult;
  centralBanco(l.map(n => ({n, p:parseBankNote(n)})).filter(x => x.p));
  if (state.tab === 'resumo' && !sheetOpen() && !pickerOpen()) render();
};
async function setAvisos(v){
  if (demoBloqueia()) return;
  nativo('avisosLigar', v);
  if (v && !nativo('avisosAcesso')){
    await tell('Na tela que vai abrir, ative o "Cofrim" (pode aparecer como "Sugestões de gasto"). O Android vai avisar que o app poderá ler suas notificações: ele guarda só as que têm um valor em R$ e nada sai do aparelho.');
    nativo('avisosConfigurar');
  }
  openSettings();
}

// ---------- Sugestões de gasto (menu de três barras) ----------
// As sugestões lidas das notificações saem do Resumo quando são lançadas, ignoradas ou abertas; aqui ficam todas (neste
// aparelho), as novas também, com um botão para lançar a partir de qualquer uma. Cada uma ocupa uns 220 caracteres; guardamos
// as dos últimos 12 meses, até 2.000 (uns 450 mil caracteres, menos de um décimo do armazenamento da página no APK, onde
// os dados ficam num arquivo à parte), e só as mais antigas saem.
const SUG_KEY = 'financas-sugestoes', SUG_MESES = 12, SUG_MAX = 2000;
function sugLog(){ try { return JSON.parse(localStorage.getItem(SUG_KEY)) || []; } catch(e){ return []; } }
function sugGuardar(n, st){
  if (!n) return;
  const desde = Date.now() - SUG_MESES * 31 * 864e5, l = sugLog().filter(x => x.t !== n.t && x.t >= desde);
  l.push({...n, st});
  try { localStorage.setItem(SUG_KEY, JSON.stringify(l.slice(-SUG_MAX))); } catch(e){}
}
// Muda a situação de uma sugestão que já está guardada (ex.: de "aberta" para "lançada").
function sugMarcar(t, st){ const n = sugLog().find(x => x.t === t); if (n) sugGuardar(n, st); }
// destaque: hora de uma sugestão a mostrar em evidência (a que foi tocada na notificação ou na central e já tinha saído
// do Resumo). filtro: todas, nova, lancada ou ignorada.
const SUG_ROT = {nova:['Nova', 'in'], aberta:['Aberta, não lançada', 'out'], lancada:['Lançada', 'muted'], ignorada:['Ignorada', 'muted']};
const SUG_FILTROS = [['todas', 'Todas'], ['nova', 'Novas'], ['lancada', 'Lançadas'], ['ignorada', 'Ignoradas']];
function openSugestoes(destaque, filtro = 'todas'){
  settingsOpen = false; F = null;
  const todas = [...bankNotes().map(n => ({...n, st:'nova'})), ...sugLog()].sort((a, b) => b.t - a.t).filter(notaPermitida).map(n => ({n, p:parseBankNote(n)})).filter(x => x.p);
  const lista = filtro === 'todas' ? todas : todas.filter(x => (SUG_ROT[x.n.st] ? x.n.st : 'lancada') === filtro), guardadas = todas.length > 0;
  const rot = st => SUG_ROT[st] || SUG_ROT.lancada;
  showSheet(`<h3>Sugestões de gasto</h3>
    <div class="semTopo hint">O que o app leu das notificações dos bancos, carteiras e vales, da mais nova para a mais antiga. Toque em "Lançar" para registrar qualquer uma.</div>
    ${guardadas ? `<div class="seg sugFiltro" role="tablist">${SUG_FILTROS.map(([k, t]) => `<button role="tab" class="${k === filtro ? 'on' : ''}" aria-selected="${k === filtro}" data-onclick="openSugestoes(null,'${k}')">${t}</button>`).join('')}</div>` : ''}
    ${lista.length ? lista.map(({n, p}) => `<div class="semCursor item${n.t === destaque ? ' sugDestaque' : ''}"><div class="mid"><b class="quebra">${p.hidden ? 'Aviso do ' + esc(p.app) : esc(p.desc)}</b>
      <small class="quebra">${new Date(n.t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})} · ${esc(p.app || p.bank || bankName(n))}<span class="tag ${rot(n.st)[1]}">${rot(n.st)[0]}</span></small>
      ${p.hidden ? '' : `<small class="quebra">${esc(String(n.texto).slice(0, 110))}</small>`}</div>
      <div style="flex:none;text-align:right"><div class="val ${p.income ? 'in' : 'out'}">${p.hidden ? 'R$ ?' : fmt(p.value)}</div>
      <button class="btn ${n.st === 'nova' ? 'primary' : ''}" style="padding:7px 10px;margin-top:4px" data-onclick="noteUse(${+n.t})">${p.income ? 'Lançar ganho' : 'Lançar gasto'}</button></div></div>`).join('')
    : `<div class="card empty" style="box-shadow:none">${guardadas ? 'Nenhuma sugestão nesta situação.' : 'Nenhuma sugestão por enquanto.<br>Elas aparecem quando o banco avisa uma compra ou um Pix.'}</div>`}
    <div class="hint">Guardamos neste aparelho as sugestões dos últimos ${SUG_MESES} meses (até ${SUG_MAX.toLocaleString('pt-BR')}).</div>
    <div class="btns foot">${guardadas ? '<button class="btn" data-onclick="sugLimpar()">Limpar todas</button>' : ''}<button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
  const d = document.querySelector('#sheet .sugDestaque');
  if (d) d.scrollIntoView({block:'center'});
}
// "Limpar todas": apaga as guardadas e as novas (que saem do Resumo) e tira da barra as notificações de gasto encontrado.
async function sugLimpar(){
  if (!await ask('Apagar todas as sugestões guardadas neste aparelho? As novas também saem do Resumo.', 'Apagar')) return openSugestoes();
  for (const n of bankNotes()) avisoCancelar(n.t);
  try { localStorage.removeItem(SUG_KEY); } catch(e){}
  if (demoOn) demoNotas = [];
  else if (temNativo('avisosGuardar')) nativo('avisosGuardar', '[]');
  render(); openSugestoes();
  toast('Sugestões apagadas.');
}
