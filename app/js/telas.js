// Minhas Finanças — As telas de cada aba (Resumo, Ganhos, Gastos, Investir) e as notícias.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, config.js, inicio.js.
// ---------- Telas ----------
// Bloco com o ícone, na cor do tema; c = [ícone, nome, cor própria (não usada na tela: tudo segue o tema)].
const tile = (icon, color) => `<div class="ico" style="background:linear-gradient(135deg,${color ? color + ',' + color + 'cc' : 'var(--hero1),var(--hero2)'})">${I(icon, 22)}</div>`;
// Ícone de uma categoria: na cor do tema ou, com a opção "Por categoria" ligada, na cor própria dela (c[2]).
const ico = (c) => tile(c[0], (db.prefs.catColor || db.prefs.skin) && c[2]); // num tema especial, as categorias ficam com a cor própria
// Valor curto para as escalas dos gráficos ("R$ 5,2 mil").
const kfmt = v => hideVals || !isFinite(v) ? '' : 'R$ ' + v.toLocaleString('pt-BR', {notation:'compact', maximumFractionDigits:1});
const chartGrid = max => `<div class="grid"><i style="top:0"><em>${kfmt(max)}</em></i><i style="top:50%"><em>${kfmt(max / 2)}</em></i></div>`;
// Blocos cinza animados no lugar do conteúdo enquanto ele carrega.
const skel = n => `<div class="sk skHero"></div><div class="card">${'<div class="skRow"><div class="sk skBox"></div><div><div class="sk skLine"></div><div class="sk skLine" style="width:55%"></div></div></div>'.repeat(n)}</div>`;
// Nome da categoria com o ícone pequeno, para textos corridos.
const catName = (c, color = 'var(--brand)') => `<span style="color:${color}">${I(c[0], 16)}</span> ${c[1]}`;
// Título da aba com os botões de personalizar a tela e de configurações.
const head = (title, tab) => `<h1>${title} <span>${eyeBtn()}${LAYOUT[tab] ? `<button class="iconbtn" onclick="openLayoutEdit('${tab}')" aria-label="Personalizar esta tela">${I('sliders', 24)}</button>` : ''}<button class="iconbtn" onclick="openSettings('')" aria-label="Configurações">${I('gear', 24)}</button></span></h1>${offlinePill()}`;
const empty = (icon, t) => `<div class="card empty"><span>${I(icon, 40)}</span>${t}</div>`;
// Conta compartilhada: quem lançou o registro (by), como etiqueta na linha. Fora dela não aparece.
const byTag = x => sync.shared && x.by ? `<span class="tag">${I('user', 11)} ${esc(x.by)}</span>` : '';
const bySmall = x => sync.shared && x.by ? ` · por ${esc(x.by)}` : '';
// Saudação do topo do Resumo, com o nome escolhido (db.prefs.greet: 'o' bem-vindo, 'a' bem-vinda, 'e' boas-vindas).
const greeting = () => { const n = db.prefs.name; return n ? `${{o:'Bem-vindo', a:'Bem-vinda'}[db.prefs.greet] || 'Boas-vindas'}, ${esc(n)}!` : ''; };
// Ordem dos grupos da lista de lançamentos (Gastos): ▲▼ como no "Personalizar".
function openGrpOrder(){
  const o = db.prefs.grpOrder;
  showSheet(`<h3>Ordem dos grupos</h3><div class="hint" style="margin-top:0">Use as setas para escolher a ordem dos grupos na lista de lançamentos.</div>
    ${o.map((k, i) => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><b>${GRUPOS[k][0]}</b></div>
      <button class="iconbtn" onclick="grpMove(${i},-1)" ${i ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" onclick="grpMove(${i},1)" ${i < o.length - 1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`).join('')}
    <div class="btns"><button class="btn" onclick="db.prefs.grpOrder=Object.keys(GRUPOS);db.cfgMod=Date.now();save();render();openGrpOrder()">Restaurar padrão</button><button class="btn primary" onclick="closeForm()">Pronto</button></div>`);
}
function grpMove(i, d){ const o = db.prefs.grpOrder; [o[i], o[i + d]] = [o[i + d], o[i]]; db.cfgMod = Date.now(); save(); render(); openGrpOrder(); }
// Gráfico de rosca. parts = [[cor, valor], ...]
function donut(parts, total){
  let acc = 0;
  const ring = (color, p, off) => `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${off}"/>`;
  return `<svg viewBox="0 0 42 42" style="width:160px;height:160px;display:block;margin:0 auto 4px">${ring('var(--line)', 100, 25)}
    ${parts.map(([color, v]) => { const p = v / total * 100, s = ring(color, p, 25 - acc); acc += p; return s; }).join('')}
    <text x="21" y="19.6" text-anchor="middle" font-size="2.8" fill="var(--muted)">Total</text>
    <text x="21" y="24.2" text-anchor="middle" font-size="3.6" font-weight="700" fill="var(--text)">${hideVals ? MASK : 'R$ ' + total.toLocaleString('pt-BR', {notation:'compact', maximumFractionDigits:1})}</text></svg>`;
}

function viewResumo(){
  const y = state.year, months = [...Array(12)].map((_,i) => ymOf(y,i));
  const ins = months.map(totalIn), outs = months.map(totalOut), yields = months.map(yieldOf);
  const tin = sum(ins, x=>x), tout = sum(outs, x=>x), tyield = sum(yields, x=>x), max = Math.max(1, ...ins.map((v,i) => v + yields[i]), ...outs);
  const cats = {}, banks = {}, pays = {};
  months.forEach(m => expensesOf(m).forEach(e => {
    cats[e.cat] = (cats[e.cat]||0) + e.value;
    const b = e.bank || 'Não informado', p = PAY[e.pay] || 'Não informado';
    banks[b] = (banks[b]||0) + e.value;
    pays[p] = (pays[p]||0) + e.value;
  }));
  const catList = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  // Lista "nome → valor" com barra proporcional ao total de gastos do ano.
  const breakdown = obj => `<div class="card">${Object.entries(obj).sort((a,b) => b[1]-a[1]).map(([k,v]) => `
    <div class="catrow"><div class="top"><span>${esc(k)}</span><b>${fmt(v)}</b></div>
    <div class="bar"><i style="width:${v/tout*100}%"></i></div></div>`).join('')}</div>`;
  const invNow = sum(db.investments, x => x.value);
  const bills = upcomingBills(), over = budgetStatus(curYM).filter(b => b.pct >= 80), odd = unusual();
  const si = months.indexOf(state.sel); // mês tocado no gráfico
  const goals = db.goals, open = db.installments.filter(p => p.paid < p.n), inv = invoices(curYM);
  // Blocos do Resumo. Quais aparecem e em que ordem vem de db.prefs.resumo (ver RESUMO e openResumoEdit).
  const B = {
  mascote: () => db.prefs.fun ? funMascot() : '',
  conquistas: () => db.prefs.fun ? funBadges() : '',
  atalhos: () => `<div class="quick">${[['expenses','receipt','Gasto'],['incomes','income','Ganho'],['investments','trend','Investir']].map(([col, ic, t]) => `<button onclick="openForm('${col}')"><span>${I(ic, 20)}</span>+ ${t}</button>`).join('')}</div>`,
  alertas: () => `${bills.length ? `<div class="card"><b>${I('calendar')} Contas a vencer</b>${bills.map(({x, diff}) => `
    <div class="item" style="cursor:default"><div class="mid"><b>${esc(x.desc)}</b>
      <small class="${diff < 0 ? 'out' : diff <= 2 ? 'warn' : ''}">${diff < 0 ? `venceu há ${-diff} dia${diff < -1 ? 's' : ''}` : diff === 0 ? 'vence hoje' : `vence em ${diff} dia${diff > 1 ? 's' : ''}`} · dia ${dueDay(x, curYM)}</small></div>
      <div class="val">${fmt(x.value)}</div><button class="btn" style="flex:none;padding:8px 10px" onclick="togglePaid('${x.id}','${curYM}')">${I('check', 15)}Pago</button></div>`).join('')}</div>` : ''}
  ${over.length ? `<div class="card"><b><span class="warn">${I('alert')}</span> Orçamento de ${monthName(curYM)}</b>${over.map(b => { const c = CAT_GASTO[b.cat] || CAT_GASTO.outros; return `
    <div class="hint" style="color:${budgetColor(b.pct)}">${c[1]}:${Math.round(b.pct)}% usado (${fmt(b.used)} de ${fmt(b.lim)})</div>`; }).join('')}</div>` : ''}${oddHtml(odd)}`,
  planejar: () => planHtml(),
  saldo: () => `<div class="hero"><small>Saldo de ${y}</small><div class="big">${fmt(tin - tout)}</div>
    <div class="row"><div><small>Ganho total</small><b>${fmt(tin)}</b></div><div><small>Gasto total</small><b>${fmt(tout)}</b></div></div></div>`,
  grafico: () => `<div class="card">
    <div class="legend"><span><i class="dot" style="background:var(--in)"></i>Ganhos</span><span><i class="dot" style="background:var(--brand)"></i>Rendimento de investimentos</span><span><i class="dot" style="background:var(--out)"></i>Gastos</span></div>
    <div class="chart">${chartGrid(max)}${months.map((m,i) => `<div class="col ${i === si ? 'sel' : ''}" onclick="state.sel='${m}';render()"><div class="bars">
      <span class="stk" style="height:${(ins[i] + yields[i])/max*100}%"><i style="flex:${yields[i]};background:var(--brand)"></i><i style="flex:${ins[i]};background:var(--in)"></i></span>
      <i style="height:${outs[i]/max*100}%;background:var(--out)"></i></div>
      <small>${MESES[i].slice(0,3)}</small></div>`).join('')}</div>
    ${si < 0 ? '<div class="hint">Toque em um mês para ver os valores.</div>' : `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><b style="text-transform:capitalize">${monthName(months[si])}</b>
      <div class="grid2" style="margin-top:8px;row-gap:8px">
        <div class="stat"><small>Ganhos</small><b class="in">${fmt(ins[si])}</b></div>
        <div class="stat"><small>Gastos</small><b class="out">${fmt(outs[si])}</b></div>
        <div class="stat"><small>Saldo</small><b class="${ins[si] - outs[si] < 0 ? 'out' : ''}">${fmt(ins[si] - outs[si])}</b></div>
        <div class="stat"><small>Rendimento estimado</small><b style="color:var(--brand)">${fmt(yields[si])}</b></div>
      </div>
      <div class="btns"><button class="btn" onclick="goMonth('${months[si]}')">Ver gastos do mês</button></div></div>`}
    ${tyield ? `<div class="hint">Rendimento estimado dos investimentos em ${y}: <b style="color:var(--brand)">${fmt(tyield)}</b>. Meses passados usam o valor registrado pelo app; os futuros são projeção. Não entra no saldo do ano.</div>` : ''}
  </div>`,
  numeros: () => `<div class="grid2">
    <div class="card stat"><small>Média mensal de gastos em ${y}</small><b class="out">${fmt(tout/12)}</b></div>
    <div class="card stat" style="cursor:pointer" onclick="go('invest')"><small>Investido hoje ›</small><b>${fmt(invNow)}</b></div>
  </div>`,
  contas: () => `<h2>Contas <span>${db.accounts.length > 1 ? `<button onclick="openForm('transfers')">Transferir</button> · ` : ''}<button onclick="openForm('accounts')">+ Conta</button></span></h2>
  ${db.accounts.length ? `<div class="card">${db.accounts.map(a => { const b = accountBalance(a); return `
    <div class="item" onclick="edit('accounts','${a.id}')">${tile('bank')}<div class="mid"><b>${esc(a.name)}</b><small>saldo de hoje · fim do mês: ${fmt(accountBalance(a, monthEnd(curYM)))}${bySmall(a)}</small></div>
      <div class="val ${b < 0 ? 'out' : ''}">${fmt(b)}</div></div>`; }).join('')}
    <div class="item" style="cursor:default"><div class="mid"><b>Total nas contas</b></div><div class="val">${fmt(sum(db.accounts, accountBalance))}</div></div></div>
    ${db.transfers.length ? `<div class="card"><b>Transferências</b>${[...db.transfers].sort((a,b) => b.month.localeCompare(a.month)).slice(0, 5).map(t => `
    <div class="item" onclick="edit('transfers','${t.id}')"><div class="mid"><b style="font-weight:500">${esc(t.from)} → ${esc(t.to)}</b><small>${monthName(t.month)}${bySmall(t)}</small></div><div class="val">${fmt(t.value)}</div></div>`).join('')}</div>` : ''}`
  : '<div class="hint" style="margin:0 4px 12px">Cadastre suas contas para acompanhar o saldo de cada uma. O saldo considera os ganhos e gastos em que você informar o mesmo nome no campo de banco/conta.</div>'}`,
  categorias: () => `<h2>Gastos por categoria em ${y}</h2>
  ${catList.length ? `<div class="card">${donut(catList.map(([k,v], i) => [shade(i, catList.length), v]), tout)}
    ${catList.map(([k,v], i) => { const c = CAT_GASTO[k] || CAT_GASTO.outros; return `
    <div class="catrow"><div class="top"><span><i class="dot" style="background:${shade(i, catList.length)}"></i>${catName(c)}</span><b>${fmt(v)} · ${Math.round(v/tout*100)}%</b></div></div>`; }).join('')}</div>`
  : empty('receipt','Nenhum gasto cadastrado neste ano.')}`,
  bancos: () => catList.length ? `<h2>Gastos por banco em ${y}</h2>${breakdown(banks)}` : '',
  pagamentos: () => catList.length ? `<h2>Gastos por forma de pagamento em ${y}</h2>${breakdown(pays)}` : '',
  // Previsão: mês atual e os três seguintes. "Sobra" = ganhos − gastos previstos do mês; com contas cadastradas,
  // mostra também o saldo somado delas no último dia de cada mês.
  previsao: () => { const rows = [...Array(4)].map((_,i) => addMonths(curYM, i)), hasAcc = db.accounts.length > 0;
    const pendIn = sum(incomesOf(curYM).filter(x => x.day > now.getDate()), x => x.value);
    const pendOut = sum(expensesOf(curYM).filter(x => x.kind === 'expense' && (x.fixed ? x.due : x.day) > now.getDate()), x => x.value);
    return `<h2>Previsão</h2><div class="card">${rows.map(m => { const net = totalIn(m) - totalOut(m), end = hasAcc ? sum(db.accounts, a => accountBalance(a, monthEnd(m))) : 0; return `
      <div class="catrow"><div class="top"><span style="text-transform:capitalize">${monthName(m)}</span><b class="${net < 0 ? 'out' : 'in'}">${net < 0 ? 'falta' : 'sobra'} ${fmt(Math.abs(net))}</b></div>
      ${hasAcc ? `<div class="hint" style="margin-top:3px">Saldo das contas no fim do mês: <b class="${end < 0 ? 'out' : ''}">${fmt(end)}</b></div>` : ''}</div>`; }).join('')}
      ${pendIn || pendOut ? `<div class="hint">Até o fim de ${monthName(curYM).split(' ')[0]} ainda entram ${fmt(pendIn)} e saem ${fmt(pendOut)} (lançamentos com dia depois de hoje).</div>` : ''}
      <div class="hint">Considera ganhos e gastos fixos, anuais, parcelas e o que já está lançado em cada mês.</div></div>`; },
  mes: () => { const a = totalIn(curYM), b = totalOut(curYM); return `<h2 style="text-transform:none;letter-spacing:0"><span style="text-transform:uppercase;letter-spacing:.06em">${monthName(curYM)}</span><button onclick="goMonth('${curYM}')">Ver gastos</button></h2>
    <div class="card grid3">
      <div class="stat"><small>Ganhos</small><b class="in" style="font-size:14px">${fmt(a)}</b></div>
      <div class="stat"><small>Gastos</small><b class="out" style="font-size:14px">${fmt(b)}</b></div>
      <div class="stat"><small>Saldo</small><b class="${a - b < 0 ? 'out' : ''}" style="font-size:14px">${fmt(a - b)}</b></div></div>`; },
  faturas: () => `<h2>Faturas de ${monthName(curYM)}</h2>${inv.length ? `<div class="card">${inv.map(([bank, v]) => `<div class="item" style="cursor:default">${tile('card')}<div class="mid"><b>${esc(bank)}</b></div><div class="val out">${fmt(v)}</div></div>`).join('')}</div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma compra no crédito neste mês.</div>'}`,
  parcelas: () => `<h2>Compras parceladas <button onclick="state.gsub='parc';go('gastos')">Ver todas</button></h2>${open.length ? `<div class="card grid2">
      <div class="stat"><small>Falta pagar (${open.length})</small><b class="out">${fmt(sum(open, p => p.total / p.n * (p.n - p.paid)))}</b></div>
      <div class="stat"><small>Parcelas deste mês</small><b>${fmt(sum(expensesOf(curYM).filter(x => x.kind === 'installment'), x => x.value))}</b></div></div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma compra parcelada em aberto.</div>'}`,
  metas: () => `<h2>Metas <button onclick="go('invest')">Ver todas</button></h2>${goals.length ? `<div class="card">${goals.map(g => `
      <div class="catrow"><div class="top"><span>${esc(g.name)}</span><b>${fmt(g.saved)} de ${fmt(g.target)}</b></div>
      <div class="bar"><i style="width:${Math.min(100, g.saved / g.target * 100)}%"></i></div></div>`).join('')}</div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma meta cadastrada.</div>'}`,
  invest: () => `<h2>Investimentos <button onclick="go('invest')">Ver todos</button></h2>${db.investments.length ? `<div class="card grid2">
      <div class="stat"><small>Total hoje</small><b>${fmt(invNow)}</b></div>
      <div class="stat"><small>Projeção em 12 meses</small><b>${fmt(sum(db.investments, projection))}</b></div></div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhum investimento cadastrado.</div>'}`
  };
  return `${greeting() ? `<div class="hello">${greeting()}</div>` : ''}
  <h1 style="margin-bottom:0">Resumo <span>${eyeBtn()}<button class="iconbtn" onclick="openResumoEdit()" aria-label="Personalizar o Resumo">${I('sliders', 24)}</button><button class="iconbtn" onclick="openSettings('')" aria-label="Configurações">${I('gear', 24)}</button></span></h1>
  <div class="muted" style="margin:0 2px 14px;font-size:13.5px">Hoje é ${todayLabel()}</div>${offlinePill()}
  <div class="nav"><button onclick="state.year--;renderIn()">‹</button><b onclick="pickYear()">${y} ▾</b><button onclick="state.year++;renderIn()">›</button></div>
  ${archBanner(y)}${bankNotesHtml()}${blocks('resumo', B)}
  <div class="btns" style="margin-bottom:12px"><button class="btn" onclick="openResumoEdit()">${I('sliders')}Personalizar o Resumo</button></div>`;
}
// Sugestões de lançamento a partir das notificações dos bancos (opcional, só no APK; ver BankListener no lado nativo).
const BANK_APPS = {'com.nu.production':'Nubank', 'br.com.intermedium':'Inter', 'com.itau':'Itaú', 'br.com.bb.android':'Banco do Brasil', 'com.bradesco':'Bradesco',
  'br.com.gabba.Caixa':'Caixa', 'com.santander.app':'Santander', 'com.c6bank.app':'C6 Bank', 'com.picpay':'PicPay', 'com.mercadopago.wallet':'Mercado Pago'};
function bankNotes(){ try { return window.Android && Android.avisosBanco ? JSON.parse(Android.avisosBanco()) : []; } catch(e){ return []; } }
// {value, desc, income, bank, date} a partir do texto da notificação; null se não houver valor.
// Notificação que chegou escondida (n.oculto, ver BankListener): {hidden, app, title, income, bank, date}, sem valor.
const bankName = n => BANK_APPS[n.app] || n.nome || 'banco';
function parseBankNote(n){
  const date = new Date(n.t).toLocaleDateString('sv');
  if (n.oculto) return {hidden:true, value:0, desc:'', title:String(n.titulo || ''), app:bankName(n), income:/receb|transfer[eê]ncia recebida|dep[oó]sito/i.test(n.titulo), bank:BANK_APPS[n.app] || '', date};
  const m = String(n.texto).match(/R\$\s?(\d[\d.]*,\d{2})/);
  if (!m) return null;
  const t = n.texto, loja = t.match(/\b(?:em|no|na)\s+([A-ZÀ-Ú0-9][^.,;\n]*?)(?=\s+(?:foi|no valor|com (?:o|seu)|para|às|as \d|em \d)|[.,;\n]|$)/);
  const desc = (loja ? loja[1] : t.split(' — ')[0]).trim().slice(0, 40);
  return {value:parseNum(m[1]), desc:cap(desc.toLowerCase()), income:/receb|pix recebido|transfer[eê]ncia recebida|dep[oó]sito/i.test(t),
    bank:BANK_APPS[n.app] || '', date:new Date(n.t).toLocaleDateString('sv')};
}
function bankNotesHtml(){
  const list = bankNotes().map((n, i) => ({i, n, p:parseBankNote(n)})).filter(x => x.p).slice(-5).reverse();
  return list.length ? `<div class="card"><b>${I('sparkle')} Sugestões pelas notificações do banco</b>${list.map(({i, n, p}) => `
    <div class="item" style="cursor:default"><div class="mid">${p.hidden
      ? `<b>Novo aviso do ${esc(p.app)}</b><small style="white-space:normal">${p.title ? esc(p.title) + ' · ' : ''}${new Date(n.t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}. Não deu para ler o valor (o Android esconde avisos com números parecidos com código); confira no app do banco.</small>`
      : `<b>${esc(p.desc)}</b><small style="white-space:normal">${esc(String(n.texto).slice(0, 90))}</small>`}</div>
      <div style="flex:none;text-align:right"><div class="val ${p.income ? 'in' : 'out'}">${p.hidden ? 'R$ ?' : fmt(p.value)}</div>
      <button class="btn primary" style="padding:7px 10px;margin-top:4px" onclick="noteUse(${+n.t})">Lançar</button> <button class="btn" style="padding:7px 10px;margin-top:4px" onclick="noteDrop(${+n.t})">Ignorar</button></div></div>`).join('')}</div>` : '';
}
// Os botões levam a hora do aviso (t), não a posição: a lista pode mudar se chegar um aviso novo com a tela aberta.
function noteDrop(t){ Android.avisosGuardar(JSON.stringify(bankNotes().filter(n => n.t !== t))); render(); }
function noteUse(t){
  const n = bankNotes().find(n => n.t === t), p = n && parseBankNote(n);
  if (!p) return render(); // já lançado ou ignorado (toque duplo)
  noteDrop(t);
  const value = p.hidden ? '' : moneyStr(p.value); // aviso escondido: o valor fica para a pessoa digitar
  if (p.income) openForm('incomes', null, {vals:{desc:p.desc, value, fixed:'', bank:p.bank, start:p.date.slice(0, 7), day:String(+p.date.slice(8))}, more:true});
  else openForm('expenses', null, {vals:{desc:p.desc, value, ...(p.desc ? {cat:guessCat(p.desc)} : {}), bank:p.bank, start:p.date.slice(0, 7), day:String(+p.date.slice(8))}, more:true});
}
async function setAvisos(v){
  Android.avisosLigar(v);
  if (v && !Android.avisosAcesso()){
    await tell('Na tela que vai abrir, ative "Minhas Finanças" (aparece como "Sugestões de lançamento"). O Android vai avisar que o app poderá ler suas notificações: ele guarda só as que têm um valor em R$ e nada sai do aparelho.');
    Android.avisosConfigurar();
  }
  openSettings();
}
// Tela para escolher quais blocos aparecem no Resumo e em que ordem.
// Vale para qualquer aba que tenha blocos em LAYOUT (Resumo, Ganhos, Gastos, Investir).
function openLayoutEdit(tab = state.tab){
  const defs = LAYOUT[tab], shown = b => db.prefs.fun || !FUN_BLOCKS.includes(b.k);
  const r = layoutOf(tab).map((b, i) => ({b, i})).filter(x => shown(x.b)); // i = posição na lista completa
  settingsOpen = false; F = null;
  showSheet(`<h3>Personalizar: ${tab === 'widget' ? 'widget Resumo' : TABS[tab][1]}</h3>
    <div class="hint" style="margin-top:0">Toque no círculo para mostrar ou esconder um bloco e use as setas para mudar a ordem.</div>
    ${r.map(({b, i}, n) => `<div class="item" style="cursor:default;padding:6px 0">
      <button class="iconbtn ${b.on ? 'in' : 'muted'}" onclick="layoutSet('${tab}',${i},'toggle')" aria-label="${b.on ? 'Esconder' : 'Mostrar'}">${I(b.on ? 'checked' : 'unchecked', 24)}</button>
      <div class="mid" style="${b.on ? '' : 'opacity:.5'}"><b style="white-space:normal">${defs[b.k][0]}</b></div>
      <button class="iconbtn" onclick="layoutSet('${tab}',${i},${n ? r[n - 1].i : i})" ${n ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" onclick="layoutSet('${tab}',${i},${n < r.length - 1 ? r[n + 1].i : i})" ${n < r.length - 1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`).join('')}
    <div class="btns"><button class="btn" onclick="layoutSet('${tab}',0,'reset')">Restaurar padrão</button><button class="btn primary" onclick="closeForm()">Pronto</button></div>`);
}
const openResumoEdit = () => openLayoutEdit('resumo');
// op: 'toggle', 'reset' ou a posição com a qual o bloco i troca de lugar.
function layoutSet(tab, i, op){
  const r = layoutOf(tab);
  if (op === 'toggle') r[i].on = !r[i].on;
  else if (op === 'reset'){ const novo = Object.entries(LAYOUT[tab]).map(([k, d]) => ({k, on:!!d[1]})); if (tab === 'resumo') db.prefs.resumo = novo; else db.prefs.layout[tab] = novo; }
  else [r[i], r[op]] = [r[op], r[i]];
  db.cfgMod = Date.now(); save(); render(); openLayoutEdit(tab);
}

function viewGanhos(){
  const row = x => { const c = CAT_GANHO[x.cat] || CAT_GANHO.outros; return `
    <div class="item" onclick="edit('incomes','${x.id}')">${ico(c)}<div class="mid"><b>${esc(x.desc)}</b>
    <small>${c[1]} · ${x.fixed === 'y' ? 'todo mês de ' + MESES[+x.start.slice(5) - 1] + ', ' : ''}${x.fixed ? 'desde ' + (x.fixed === 'y' ? x.start.slice(0,4) : monthName(x.start)) + (x.end ? ' até ' + monthName(x.end) : '') : monthName(x.start)}${bySmall(x)}</small></div>
    <div class="val in">${fmt(x.value)}</div></div>`; };
  const fixed = db.incomes.filter(isMonthly), yearly = db.incomes.filter(x => x.fixed === 'y'), once = db.incomes.filter(x => !x.fixed).sort((a,b) => b.start.localeCompare(a.start));
  const B = {
  total: () => `<div class="hero"><small>Ganhos em ${monthName(curYM)}</small><div class="big">${fmt(totalIn(curYM))}</div>
    <small>Fixos mensais: ${fmt(sum(fixed.filter(x => activeIn(x,curYM)), x => x.value))}</small></div>`,
  fixos: () => `<h2>Fixos (todo mês)</h2>
  ${fixed.length ? `<div class="card">${fixed.map(row).join('')}</div>` : empty('briefcase','Cadastre seu salário e outros ganhos fixos.<br>Eles entram automaticamente em todos os meses.')}`,
  anuais: () => `<h2>Anuais (uma vez por ano)</h2>
  ${yearly.length ? `<div class="card">${yearly.map(row).join('')}</div>` : empty('gift','13º, férias, bônus…<br>Escolha o mês em que você recebe.')}`,
  avulsos: () => `<h2>Ganhos avulsos</h2>
  ${once.length ? `<div class="card">${once.map(row).join('')}</div>` : empty('wallet','Nenhum ganho avulso cadastrado.')}`
  };
  return head('Ganhos', 'ganhos') + blocks('ganhos', B);
}

// Comparativo: gasto de cada categoria no mês m, no mês anterior e na média dos 6 meses antes de m.
function compareMonths(m){
  const byCat = ym => { const g = {}; expensesOf(ym).forEach(x => g[x.cat] = (g[x.cat] || 0) + x.value); return g; };
  const cur = byCat(m), prev = byCat(addMonths(m, -1)), past = [...Array(6)].map((_,i) => byCat(addMonths(m, -1 - i)));
  return [...new Set([...Object.keys(cur), ...Object.keys(prev)])]
    .map(cat => ({cat, cur:cur[cat] || 0, prev:prev[cat] || 0, avg:sum(past, g => g[cat] || 0) / 6})).sort((a,b) => b.cur - a.cur);
}
// Gastos divididos ainda não recebidos: [{x, m}]. Avulso gera uma linha; fixo ou anual, uma por mês
// (ou ano) já ocorrido e ainda não marcado em x.sm.
function owedList(){
  const out = [];
  for (const x of db.expenses){
    if (!x.share || !x.who) continue;
    if (!x.fixed){ if (!x.settled) out.push({x, m:x.start}); continue; }
    for (let m = x.start; m <= curYM && (!x.end || m <= x.end); m = addMonths(m, x.fixed === 'y' ? 12 : 1)) if (!(x.sm || []).includes(m)) out.push({x, m});
  }
  return out;
}
// Marca a parte da outra pessoa como recebida (no gasto fixo, só a do mês m).
function settle(id, m){
  const x = db.expenses.find(e => e.id === id), set = on => {
    if (x.fixed) x.sm = on ? (x.sm || []).concat(m) : (x.sm || []).filter(k => k !== m); else x.settled = on;
    touch(x); save(); render();
  };
  set(true);
  showUndo('Marcado como recebido', () => set(false));
}
// A aba Gastos tem duas partes: os gastos do mês e as compras parceladas.
const gastosSeg = () => `<div class="seg">${[['mes','Do mês'],['parc','Parceladas']].map(([k,t]) => `<button class="${state.gsub === k ? 'on' : ''}" onclick="state.gsub='${k}';renderIn()">${t}</button>`).join('')}</div>`;
function viewGastos(){
  if (state.gsub === 'parc') return `${head('Gastos', 'gastos')}${gastosSeg()}${viewParcelas()}`;
  const m = state.month, list = expensesOf(m), tin = totalIn(m), tout = sum(list, x => x.value);
  const budgets = budgetStatus(m), inv = invoices(m), cmp = compareMonths(m);
  const owed = owedList(); // de qualquer mês
  const uniq = f => [...new Set(list.map(f).filter(Boolean))];
  // Um filtro que não existe neste mês (ex.: depois de trocar de mês) é desfeito, para não esconder tudo sem aviso.
  for (const [k, f] of [['fcat', x => x.cat], ['fbank', x => x.bank], ['fpay', x => x.pay]]) if (state[k] && !list.some(x => f(x) === state[k])) state[k] = '';
  const tags = [...new Set(list.flatMap(tagsOf))];
  if (state.ftag && !tags.includes(state.ftag)) state.ftag = '';
  const sel = (key, label, options) => { filterOpts[key] = [['', 'Todos'], ...options]; const cur = options.find(o => o[0] === state[key]);
    return `<button type="button" class="pickBtn sm ${cur ? 'on' : ''}" onclick="pickFilter('${key}','${label}')"><span>${esc(cur ? cur[1] : label)}</span>${I('chev', 14)}</button>`; };
  const B = {
  mes: () => `<div class="card grid3">
    <div class="stat"><small>Ganhos</small><b class="in" style="font-size:14px">${fmt(tin)}</b></div>
    <div class="stat"><small>Gastos</small><b class="out" style="font-size:14px">${fmt(tout)}</b></div>
    <div class="stat"><small>Saldo</small><b class="${tin-tout < 0 ? 'out' : ''}" style="font-size:14px">${fmt(tin - tout)}</b></div>
  </div>`,
  orcamento: () => `<h2>Orçamento do mês <button onclick="openForm('budgets', db.budgets)">${budgets.length ? 'Alterar' : 'Definir'}</button></h2>
  ${budgets.length ? `<div class="card">${budgets.map(b => { const c = CAT_GASTO[b.cat] || CAT_GASTO.outros; return `
    <div class="catrow"><div class="top"><span>${catName(c)}</span><b>${fmt(b.used)} de ${fmt(b.lim)}</b></div>${b.extra ? `<div class="hint" style="margin-top:2px">inclui ${fmt(b.extra)} que sobraram do mês anterior</div>` : ''}
    <div class="bar"><i style="width:${Math.min(b.pct, 100)}%;background:${budgetColor(b.pct)}"></i></div>
    ${b.pct >= 80 ? `<div class="hint" style="margin-top:4px;color:${budgetColor(b.pct)}">${b.pct > 100 ? `Estourou em ${fmt(b.used - b.lim)}` : `${I('alert', 14)} ${Math.round(b.pct)}% do limite usado`}</div>` : ''}</div>`; }).join('')}</div>`
  : '<div class="hint" style="margin:0 4px 12px">Defina um limite mensal por categoria para acompanhar quanto já foi usado.</div>'}`,
  comparativo: () => cmp.length ? `<h2>Comparativo por categoria</h2>
  <div class="card">${cmp.map(r => { const c = CAT_GASTO[r.cat] || CAT_GASTO.outros, d = r.prev ? (r.cur - r.prev) / r.prev * 100 : null; return `
    <div class="catrow"><div class="top"><span>${catName(c)}</span><b>${fmt(r.cur)}</b></div>
    <div class="hint" style="margin-top:3px">${monthName(addMonths(m, -1)).split(' ')[0]}: ${fmt(r.prev)}${d == null || !Math.round(d) ? '' : ` <b class="${d > 0 ? 'out' : 'in'}">${d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(d))}%</b>`} · média de 6 meses: ${fmt(r.avg)}</div></div>`; }).join('')}</div>` : '',
  receber: () => owed.length ? `<h2>A receber de gastos divididos</h2>
  <div class="card">${Object.entries(owed.reduce((g, {x}) => (g[x.who] = (g[x.who] || 0) + x.share, g), {})).map(([who, v]) => `<div class="hint" style="margin:0 0 6px">${esc(who)} te deve <b>${fmt(v)}</b></div>`).join('')}
    ${owed.map(({x, m: om}) => `<div class="item" style="cursor:default"><div class="mid"><b>${esc(x.desc)}</b><small>${esc(x.who)} · ${monthName(om)}</small></div>
      <div class="val in">${fmt(x.share)}</div><button class="btn" style="flex:none;padding:8px 10px" onclick="settle('${x.id}','${om}')">${I('check', 15)}Recebi</button></div>`).join('')}</div>` : '',
  faturas: () => inv.length ? `<h2>Faturas do cartão <button onclick="openForm('cardClose', db.cardClose)">Configurar cartões</button></h2>
  <div class="card">${inv.map(([bank, v]) => `<div class="item" style="cursor:default">${tile('card')}<div class="mid"><b>${esc(bank)}</b>
    ${[db.cardClose[bank] ? 'Fecha no dia ' + db.cardClose[bank] : 'Sem dia de fechamento definido',
      db.cardLimit[bank] && 'Limite: ' + fmt(db.cardLimit[bank]),
      db.cardLimit[bank] && `Comprometido: ${fmt(cardUsed(bank))} (${Math.round(cardUsed(bank) / db.cardLimit[bank] * 100)}%)`,
      db.accounts.length && cardAccount(bank) && 'Paga pela conta ' + esc(cardAccount(bank))].filter(Boolean).map(t => `<small style="display:block">${t}</small>`).join('')}
    ${db.accounts.length && !cardAccount(bank) ? `<small class="warn" style="display:block">${I('alert', 13)} Escolha a conta que paga esta fatura; sem isso ela não é descontada de nenhuma conta.</small>` : ''}</div><div class="val out">${fmt(v)}</div></div>`).join('')}
    ${inv.some(([bank]) => db.accounts.length && !cardAccount(bank)) ? `<div class="btns"><button class="btn primary" onclick="openForm('cardClose', db.cardClose)">Escolher a conta que paga</button></div>` : ''}</div>` : '',
  lancamentos: () => `<h2>Lançamentos <button onclick="openGrpOrder()">Ordenar grupos</button></h2>
  <div class="card" style="padding:12px">
    <div class="search">${I('search')}<input id="q" type="text" placeholder="Buscar por descrição" value="${esc(state.q)}" autocomplete="off" oninput="state.q=this.value;this.nextElementSibling.hidden=!this.value;drawExpList()"><button type="button" class="iconbtn" ${state.q ? '' : 'hidden'} onclick="clearSearch()" aria-label="Limpar busca">${I('close')}</button></div>
    <div class="filters">
      ${sel('fcat', 'Categoria', uniq(x => x.cat).map(k => [k, (CAT_GASTO[k] || CAT_GASTO.outros)[1]]))}
      ${sel('fbank', 'Banco', uniq(x => x.bank).map(b => [b, b]))}
      ${sel('fpay', 'Pagamento', uniq(x => x.pay).map(p => [p, PAY[p] || p]))}
      ${tags.length ? sel('ftag', 'Etiqueta', tags.map(t => [t, '#' + t])) : ''}
    </div>
    <button type="button" class="moreBtn" style="margin-top:10px;padding:10px" onclick="openSearch()">${I('search', 16)}Buscar em todos os meses</button>
  </div>
  <div id="expList">${expListHtml()}</div>`,
  acoes: () => `<div class="btns"><button class="btn" onclick="document.getElementById('stmt').click()">${I('upload')}Importar extrato</button><button class="btn" onclick="shown(printReport)">${I('doc')}Relatório (PDF)</button></div>
  <div class="btns"><button class="btn" onclick="openSheetLink()">${I('doc')}${sheetId() ? 'Planilha do Google (ligada)' : 'Exportar para uma planilha do Google ligada ao app'}</button></div>
  <div class="btns" style="margin-bottom:12px"><button class="btn" onclick="exportCsv()">${I('download')}Exportar planilha de ${m.slice(0,4)} (CSV)</button></div>`
  };
  return `${head('Gastos', 'gastos')}${gastosSeg()}
  <div class="nav"><button onclick="state.month=addMonths(state.month,-1);renderIn()">‹</button><b onclick="pickMonth()">${monthName(m)} ▾</b><button onclick="state.month=addMonths(state.month,1);renderIn()">›</button></div>
  ${archBanner(m.slice(0, 4))}${blocks('gastos', B)}
  <div class="hint" style="text-align:center">Deslize a tela para os lados para trocar de mês. Num lançamento, deslize para a esquerda para excluir e, numa conta com vencimento, para a direita para marcar como paga.</div>`;
}
// Lista de lançamentos do mês com busca e filtros, em grupos (GRUPOS: assinaturas, fixos e anuais, parceladas e ocasionais),
// na ordem escolhida em db.prefs.grpOrder. A busca e os filtros valem para todos. Fica separada da tela para o campo
// de busca não perder o foco.
function expListHtml(){
  const m = state.month, all = expensesOf(m), q = plain(state.q.trim());
  const list = all.filter(x => (!q || plain(x.desc + ' ' + (x.tags || '') + ' ' + (x.by || '')).includes(q)) && (!state.fcat || x.cat === state.fcat) && (!state.fbank || x.bank === state.fbank) && (!state.fpay || x.pay === state.fpay) && (!state.ftag || tagsOf(x).includes(state.ftag)));
  if (!all.length) return empty('receipt','Nenhum gasto em ' + monthName(m) + '.<br>Toque em + para adicionar.');
  if (!list.length) return empty('search','Nenhum lançamento com esses filtros.');
  const filt = q || state.fcat || state.fbank || state.fpay || state.ftag, open = state.gopen || (state.gopen = {});
  const gs = db.prefs.grpOrder.map(k => [k, GRUPOS[k][0], list.filter(GRUPOS[k][1])]);
  // Todos os grupos começam abertos; tocar no título fecha (fica só o total). Numa busca ou filtro, todo grupo com resultado abre.
  return gs.map(([k, t, g]) => { if (!g.length) return ''; const on = filt ? true : open[k] ?? true; return `
    <button type="button" class="grpHead ${on ? 'on' : ''}" ${filt ? 'disabled' : `onclick="state.gopen.${k}=${!on};drawExpList()"`} aria-expanded="${on}"><b>${t}</b><small>${g.length} · ${fmt(sum(g, x => x.value))}</small>${filt ? '' : I('chev', 16)}</button>
    ${on ? `<div class="card">${(k === 'avu' ? g.slice(0, state.limit) : g).map(x => expRow(x, m)).join('')}</div>
    ${k === 'avu' && g.length > state.limit ? `<button type="button" class="moreBtn" style="margin:0 0 12px" onclick="state.limit+=60;drawExpList()">Mostrar mais ${Math.min(60, g.length - state.limit)} de ${g.length - state.limit} restantes</button>` : ''}` : ''}`; }).join('')
    + (list.length < all.length ? `<div class="hint" style="text-align:center;margin-bottom:12px">${list.length} de ${all.length} lançamentos · ${fmt(sum(list, x => x.value))}</div>` : '');
}
// Uma linha da lista de lançamentos do mês m.
function expRow(x, m){ const c = CAT_GASTO[x.cat] || CAT_GASTO.outros, inst = x.kind === 'installment', bill = !inst && x.fixed && x.due, paid = bill && isPaid(x, m); return `
    <div class="item" ${inst ? '' : `data-sw="${x.id}" data-bill="${bill ? 1 : ''}"`} onclick="edit('${inst ? 'installments' : 'expenses'}','${x.id}')">${ico(c)}<div class="mid"><b>${esc(x.desc)}</b>
    <small>${c[1]}${whereLabel(x)}${inst ? `<span class="tag">parcela ${x.num}/${x.n}${x.paid ? ' paga' : ''}</span>` : x.fixed ? `<span class="tag">${x.fixed === 'y' ? 'anual' : isSub(x) ? 'assinatura' : 'fixo'}</span>` : x.day ? `<span class="tag">dia ${x.day}</span>` : ''}${bill ? `<span class="tag">${paid ? 'pago' : 'vence dia ' + dueDay(x, m)}</span>` : ''}${tagsOf(x).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}${x.share ? `<span class="tag">dividido com ${esc(x.who)}${x.got ? ', recebido' : ''}</span>` : ''}${x.photo ? `<span class="tag">${I('doc', 11)} comprovante</span>` : ''}${byTag(x)}</small></div>
    <div class="val out">${fmt(x.value)}</div>${bill ? `<button class="iconbtn ${paid ? 'in' : 'muted'}" onclick="togglePaid('${x.id}','${m}')" aria-label="Marcar como pago">${I(paid ? 'checked' : 'unchecked', 24)}</button>` : ''}</div>`; }
// Busca em todos os meses: ganhos, gastos e compras parceladas, pela descrição, etiqueta ou banco.
let searchHits = [];
function searchAll(q){
  q = plain(String(q).trim());
  if (q.length < 2) return [];
  const hit = (col, x) => plain([x.desc, x.tags, x.bank, x.who].filter(Boolean).join(' ')).includes(q) ? [{col, x}] : [];
  return [...db.expenses.flatMap(x => hit('expenses', x)), ...db.installments.flatMap(x => hit('installments', x)), ...db.incomes.flatMap(x => hit('incomes', x))]
    .sort((a, b) => (b.x.start || '').localeCompare(a.x.start || '')).slice(0, 80);
}
function openSearch(){
  settingsOpen = false; F = null;
  showSheet(`<h3>Buscar em todos os meses</h3>
    <div class="search">${I('search')}<input id="qAll" type="text" placeholder="Descrição, etiqueta ou banco" autocomplete="off" oninput="drawSearch()"></div>
    <div id="searchOut"></div>
    <div class="btns foot"><button class="btn primary" onclick="closeForm()">Fechar</button></div>`);
  drawSearch();
  document.getElementById('qAll').focus();
}
function drawSearch(){
  const q = document.getElementById('qAll').value;
  searchHits = searchAll(q);
  document.getElementById('searchOut').innerHTML = q.trim().length < 2 ? '<div class="hint">Digite pelo menos duas letras.</div>'
    : !searchHits.length ? '<div class="hint">Nada encontrado.</div>'
    : searchHits.map(({col, x}, i) => `<div class="item" onclick="openHit(${i})"><div class="mid"><b>${esc(x.desc)}</b>
        <small>${COL_NAMES[col]} · ${x.fixed ? 'desde ' : ''}${cap(monthName(x.start))}${x.bank ? ' · ' + esc(x.bank) : ''}${tagsOf(x).map(t => ' · #' + esc(t)).join('')}</small></div>
        <div class="val ${col === 'incomes' ? 'in' : 'out'}">${fmt(col === 'installments' ? x.total : x.value)}</div></div>`).join('');
}
function openHit(i){ const h = searchHits[i]; if (h.col === 'expenses' && !h.x.fixed) state.month = h.x.start; openForm(h.col, h.x); }
const filterOpts = {};
function pickFilter(key, label){ pickList(label, filterOpts[key], state[key], v => { state[key] = v; render(); }); }
function clearSearch(){ const i = document.getElementById('q'); state.q = i.value = ''; i.nextElementSibling.hidden = true; drawExpList(); i.focus(); }
function drawExpList(){ const el = document.getElementById('expList'); if (el) el.innerHTML = expListHtml(); }

function viewParcelas(){
  const ps = db.installments;
  const total = sum(ps, p => p.total), pago = sum(ps, p => p.total/p.n*p.paid);
  return `
  <div class="hero"><small>Falta pagar</small><div class="big">${fmt(total - pago)}</div>
    <div class="row"><div><small>Valor total</small><b>${fmt(total)}</b></div><div><small>Já pago</small><b>${fmt(pago)}</b></div></div></div>
  ${ps.length ? ps.map(p => { const c = CAT_GASTO[p.cat] || CAT_GASTO.outros, parc = p.total/p.n, done = p.paid >= p.n; return `
    <div class="card">
      <div class="item" onclick="edit('installments','${p.id}')">${ico(c)}<div class="mid"><b>${esc(p.desc)}</b>
        <small>${c[1]}${whereLabel(p)} · ${done ? 'quitado' : 'termina em ' + monthName(addMonths(p.start, p.n-1))}${bySmall(p)}</small></div>
        <div class="val">${p.paid}/${p.n}</div></div>
      <div class="bar"><i style="width:${p.paid/p.n*100}%"></i></div>
      <div class="grid2" style="row-gap:10px">
        <div class="stat"><small>Valor da parcela</small><b>${fmt(parc)}</b></div>
        <div class="stat"><small>Valor total (${p.n}x)</small><b>${fmt(p.total)}</b></div>
        <div class="stat"><small>Já pago (${p.paid}x)</small><b class="in">${fmt(parc*p.paid)}</b></div>
        <div class="stat"><small>Falta pagar (${p.n-p.paid}x)</small><b class="out">${fmt(parc*(p.n-p.paid))}</b></div>
      </div>
      <div class="btns"><button class="btn" onclick="pay('${p.id}',-1)" ${p.paid <= 0 ? 'disabled style="opacity:.4"' : ''}>− Desfazer</button>
        <button class="btn primary" onclick="pay('${p.id}',1)" ${done ? 'disabled style="opacity:.4"' : ''}>${I('check', 16)}Pagar parcela</button></div>
    </div>`; }).join('')
  : empty('card','Nenhuma compra parcelada.<br>As parcelas entram sozinhas nos gastos dos meses seguintes.')}
  ${ps.length ? '<div class="hint" style="text-align:center">A contagem avança sozinha quando o mês vira: as parcelas dos meses que já passaram contam como pagas. Use os botões para corrigir.</div>' : ''}`;
}

function viewInvest(){
  const vs = db.investments, hoje = sum(vs, v => v.value), fut = sum(vs, projection), r = db.rates;
  // Evolução: últimos 12 meses do histórico (db.netLog), com o mês atual ao vivo.
  const hist = [...Array(12)].map((_,i) => addMonths(curYM, i - 11)).map(m => [m, m === curYM ? hoje : db.netLog[m]]);
  const known = hist.filter(h => h[1] != null), hmax = Math.max(1, ...known.map(h => h[1]));
  const B = {
  total: () => `<div class="hero"><small>Total investido hoje</small><div class="big">${fmt(hoje)}</div>
    <div class="row"><div><small>Projeção em 12 meses</small><b>${fmt(fut)}</b></div><div><small>Aportes do ano</small><b>${fmt(sum(vs, v => (v.monthly||0)*12))}</b></div></div></div>`,
  evolucao: () => vs.length ? `<div class="card"><b>Evolução do total investido</b>
    <div class="chart" style="height:110px">${chartGrid(hmax)}${hist.map(([m, v]) => `<div class="col" style="cursor:default"><div class="bars"><i style="height:${v == null ? 0 : v/hmax*100}%;width:70%;max-width:16px;background:${v == null ? 'transparent' : 'linear-gradient(var(--brand),var(--brand2))'}"></i></div><small>${MESES[+m.slice(5)-1].slice(0,3)}</small></div>`).join('')}</div>
    <div class="hint">${known.length > 1 ? `De ${fmt(known[0][1])} em ${monthName(known[0][0])} para ${fmt(hoje)} hoje.` : 'O histórico começa neste mês e ganha uma barra a cada mês de uso.'}</div></div>` : '',
  metas: () => `<h2>Metas <button onclick="openForm('goals')">+ Nova meta</button></h2>
  ${db.goals.length ? db.goals.map(g => { const pct = Math.min(100, g.saved / g.target * 100), left = Math.max(0, g.target - g.saved), months = g.date ? monthDiff(g.date, curYM) : 0; return `
    <div class="card">
      <div class="item" onclick="edit('goals','${g.id}')">${tile('target')}<div class="mid"><b>${esc(g.name)}</b>
        <small>${g.date ? 'até ' + monthName(g.date) : 'sem prazo'}${bySmall(g)}</small></div><div class="val">${Math.round(pct)}%</div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="grid3"><div class="stat"><small>Guardado</small><b class="in" style="font-size:14px">${fmt(g.saved)}</b></div>
        <div class="stat"><small>Meta</small><b style="font-size:14px">${fmt(g.target)}</b></div>
        <div class="stat"><small>Falta</small><b style="font-size:14px">${fmt(left)}</b></div></div>
      ${left <= 0 ? `<div class="hint in">${I('checked', 15)} Meta alcançada</div>` : g.date ? `<div class="hint">${months > 0 ? `Guardando ${fmt(left / months)} por mês você chega lá no prazo (${months} ${months > 1 ? 'meses' : 'mês'}).` : 'O prazo desta meta já chegou.'}</div>` : ''}
      <div class="btns"><button class="btn primary" onclick="openForm('goalAdd', null, {id:'${g.id}'})">+ Guardar dinheiro</button></div>
    </div>`; }).join('') : '<div class="hint" style="margin:0 4px 12px">Crie uma meta (viagem, reserva de emergência…) e acompanhe quanto falta.</div>'}`,
  carteira: () => `<h2>Meus investimentos ${vs.some(v => v.ticker) ? `<button onclick="refreshQuotes(true)">${quoting ? 'Atualizando…' : I('refresh', 14) + 'Atualizar cotações'}</button>` : ''}</h2>
  ${vs.length ? vs.map(v => { const c = CAT_INV[v.cat] || CAT_INV.outros, p = projection(v), ap = (v.monthly||0)*12;
    if (v.ticker){ const cost = v.qty*v.paid, gain = v.value - cost, cls = gain < 0 ? 'out' : 'in', sign = gain < 0 ? '−' : '+';
      const sales = v.sales || [], divs = v.divs || [], realized = sum(sales, s => s.qty * (s.price - s.cost)), divTotal = sum(divs, d => d.value);
      const signed = x => `<b class="${x < 0 ? 'out' : 'in'}">${x < 0 ? '−' : '+'}${fmt(Math.abs(x))}</b>`; return `
    <div class="card">
      <div class="item" style="cursor:default">${ico(c)}<div class="mid"><b>${esc(v.ticker)}</b>
        <small>${esc(v.assetName || c[1])}</small></div>
        <div class="val ${cls}">${sign}${Math.abs(cost ? gain/cost*100 : 0).toLocaleString('pt-BR',{maximumFractionDigits:2})}%</div></div>
      <div class="grid2" style="margin-top:12px;row-gap:10px">
        <div class="stat"><small>Quantidade</small><b>${v.qty.toLocaleString('pt-BR',{maximumFractionDigits:8})}</b></div>
        <div class="stat"><small>Valor hoje</small><b>${quoting ? '<span class="sk skTxt"></span>' : fmt(v.value)}</b></div>
        <div class="stat"><small>Preço médio</small><b>${fmtQ(v.paid)}</b></div>
        <div class="stat"><small>Cotação atual</small><b>${quoting ? '<span class="sk skTxt"></span>' : fmtQ(v.quote)}</b></div>
        <div class="stat"><small>Total investido</small><b>${fmt(cost)}</b></div>
        <div class="stat"><small>Rendimento</small><b class="${cls}">${sign}${fmt(Math.abs(gain))}</b></div>
      </div>
      ${(d0 => d0 && cost ? (c => `<div class="hint">Desde ${fmtDate(d0)}: você ${gain < 0 ? '−' : '+'}${Math.abs(gain / cost * 100).toLocaleString('pt-BR', {maximumFractionDigits:1})}% · CDI ≈ +${c.toLocaleString('pt-BR', {maximumFractionDigits:1})}%. <b class="${gain / cost * 100 >= c ? 'in' : 'out'}">${gain / cost * 100 >= c ? 'Rendeu mais' : 'Rendeu menos'} que o CDI.</b></div>`)(cdiSince(d0)) : '')(v.lots.map(l => l.date).filter(Boolean).sort()[0])}
      ${v.alertUp || v.alertDown ? `<div class="hint">${I('alert', 13)} Alerta de preço: ${[v.alertUp && 'acima de ' + fmtQ(v.alertUp), v.alertDown && 'abaixo de ' + fmtQ(v.alertDown)].filter(Boolean).join(' · ')}</div>` : ''}
      <label>Compras (${v.lots.length})</label>
      ${v.lots.map((l,i) => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><b style="font-weight:500">${l.qty.toLocaleString('pt-BR',{maximumFractionDigits:8})} × ${fmtQ(l.paid)}</b><small>${fmtDate(l.date)} · ${fmt(l.qty*l.paid)}</small></div>
        <button class="iconbtn" onclick="removeLot('${v.id}',${i})" aria-label="Excluir compra">${I('close', 18)}</button></div>`).join('')}
      ${sales.length ? `<label>Vendas (${sales.length})</label>${sales.map(s => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><b style="font-weight:500">${s.qty.toLocaleString('pt-BR',{maximumFractionDigits:8})} × ${fmtQ(s.price)}</b><small>${fmtDate(s.date)} · custo médio ${fmtQ(s.cost)}</small></div><div class="val">${signed(s.qty * (s.price - s.cost))}</div></div>`).join('')}` : ''}
      ${divs.length ? `<label>Proventos (${divs.length})</label>${divs.map(d => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><small>${fmtDate(d.date)}</small></div><div class="val in">+${fmt(d.value)}</div></div>`).join('')}` : ''}
      ${sales.length || divs.length ? `<div class="grid3" style="margin-top:12px">
        <div class="stat"><small>Lucro das vendas</small>${signed(realized)}</div>
        <div class="stat"><small>Proventos</small>${signed(divTotal)}</div>
        <div class="stat"><small>Retorno total</small>${signed(gain + realized + divTotal)}</div></div>` : ''}
      <div class="btns"><button class="btn primary" onclick="buyMore('${v.id}')">${I('plus', 16)}Nova compra</button><button class="btn" onclick="sellAsset('${v.id}')" ${v.qty > 0 ? '' : 'disabled style="opacity:.4"'}>Vender</button></div>
      <div class="btns"><button class="btn" onclick="openDiv('${v.id}')">${I('coins', 16)}Registrar provento</button><button class="btn danger" onclick="removeRec('investments','${v.id}')">Excluir</button></div>
      <div class="btns"><button class="btn" onclick="openForm('priceAlert', db.investments.find(x => x.id === '${v.id}'))">${I('alert', 16)}Alerta de preço</button></div>
      <div class="hint">Cotação de ${new Date(v.quoteAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</div>
    </div>`; }
    return `
    <div class="card">
      <div class="item" onclick="edit('investments','${v.id}')">${ico(c)}<div class="mid"><b>${esc(v.name)}</b>
        <small>${c[1]} · ${rateLabel(v)}${bySmall(v)}</small></div>
        <div class="val muted">≈ ${(annualRate(v)*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}% a.a.</div></div>
      <div class="grid3" style="margin-top:12px">
        <div class="stat"><small>Hoje</small><b style="font-size:14px">${fmt(v.value)}</b></div>
        <div class="stat"><small>Em 12 meses</small><b style="font-size:14px">${fmt(p)}</b></div>
        <div class="stat"><small>Rendimento</small><b class="in" style="font-size:14px">+${fmt(p - v.value - ap)}</b></div>
      </div>
      <div class="btns"><button class="btn primary" onclick="openForm('invAdd', null, {id:'${v.id}'})">${I('plus', 16)}Fazer um aporte</button></div>
      <div class="hint">O valor é atualizado sozinho a cada virada de mês com o rendimento${v.monthly ? ` e o aporte mensal de ${fmt(v.monthly)}` : ''}.</div>
    </div>`; }).join('')
  : empty('trend','Cadastre seus investimentos para ver<br>quanto você terá daqui a um ano.')}`,
  taxas: () => `<div class="hint" style="text-align:center;padding:0 10px">Projeção bruta (sem IR), com as taxas: CDI ${r.cdi}% · Selic ${r.selic}% · IPCA ${r.ipca}% a.a. (${ratesInfo()}).
    <a href="#" onclick="openRates();return false" style="color:var(--brand)">Ver taxas</a>
    ${vs.some(v => v.ticker) ? '<br>Ações e moedas entram pelo valor atual, sem projeção. As cotações podem ter alguns minutos de atraso.' : ''}</div>`
  };
  return head('Investimentos', 'invest') + blocks('invest', B);
}
function openDiv(id){ const v = db.investments.find(x => x.id === id); openForm('div', null, {id, title:'Provento de ' + v.ticker}); }
function buyMore(id){
  const v = db.investments.find(x => x.id === id);
  openForm('investments', null, {title:'Nova compra de ' + v.ticker, vals:{cat:v.cat, ticker:v.ticker, paid:String(v.quote).replace('.', ',')}, asset:{code:v.ticker, name:v.assetName, quote:v.quote}});
}
function sellAsset(id){
  const v = db.investments.find(x => x.id === id);
  openForm('sell', null, {id, title:'Vender ' + v.ticker, vals:{price:String(v.quote).replace('.', ','), date:now.toLocaleDateString('sv'), toIncome:'1'}});
}
function removeLot(id, i){
  const v = db.investments.find(x => x.id === id);
  if (v.lots.length === 1) return removeRec('investments', id);
  const lot = v.lots.splice(i, 1)[0];
  recalc(v); touch(v); save(); render();
  showUndo('Compra excluída', () => { v.lots.splice(i, 0, lot); recalc(v); touch(v); save(); render(); });
}

// ---------- Notícias (manchetes de sites de notícias, via RSS) ----------
const gnews = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
// Bing Notícias e Exame trazem foto; o Google Notícias não traz, mas tem mais volume.
// interval "7" = últimas 24 horas, "8" = última semana.
const bnews = (q, interval) => `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&qft=${encodeURIComponent(`interval="${interval}"`)}&format=rss&cc=br&setlang=pt-br`;
const NEWS = {
  dia:{label:'Principais do dia', feeds:[['https://exame.com/invest/feed/', 'Exame'], [bnews('mercado financeiro ibovespa', 7), ''], [bnews('investimentos dólar selic', 7), ''],
    [gnews('"mercado financeiro" OR ibovespa OR "bolsa de valores" when:1d'), '']]},
  rec:{label:'Onde investir', feeds:[[bnews('onde investir', 8), ''], [bnews('carteira recomendada ações', 8), ''],
    [gnews('"onde investir" OR "carteira recomendada" OR "recomendações de investimento" when:7d'), '']]}
};
const NEWS_KEY = 'financas-news';
let newsTab = 'dia', newsCache = {}; // {dia:{at, items:[{title, link, date, source, img}], err}}
try { newsCache = JSON.parse(localStorage.getItem(NEWS_KEY)) || {}; } catch(e){}
const newsLoading = {};

// Baixa um texto de outro site. No APK passa pelo lado nativo (sites de notícia não permitem acesso direto do WebView);
// no navegador do PC, pelo /proxy do serve.ps1.
function httpGet(url){
  if (window.Android && Android.get) return new Promise((res, rej) => { const id = ++driveSeq; drivePending[id] = r => r.status === 200 ? res(r.text) : rej(r); Android.get(id, url); });
  return fetch(location.hostname === 'localhost' ? '/proxy?u=' + encodeURIComponent(url) : url).then(r => { if (!r.ok) throw r; return r.text(); });
}
function parseRss(xml, source){
  return [...new DOMParser().parseFromString(xml, 'text/xml').querySelectorAll('item')].map(it => {
    const get = t => ((it.getElementsByTagName(t)[0] || {}).textContent || '').trim(), src = get('News:Source') || get('source') || source;
    let title = get('title'), link = get('link'), img = get('News:Image') || get('mediaurl');
    if (src && title.endsWith(' - ' + src)) title = title.slice(0, -src.length - 3); // o Google repete a fonte no título
    if (link.includes('bing.com/news/apiclick')) try { link = new URL(link).searchParams.get('url') || link; } catch(e){} // endereço real da matéria
    if (img.includes('bing.com/th')) img += '&w=160&h=160&c=7'; // miniatura quadrada
    return {title, link, date:Date.parse(get('pubDate')) || 0, source:src, img:img.replace(/^http:/, 'https:')};
  }).filter(n => n.title && /^https?:\/\//.test(n.link));
}
async function loadNews(k, force){
  const c = newsCache[k];
  if (newsLoading[k] || (!force && c && Date.now() - c.at < 30*60e3)) return;
  newsLoading[k] = true;
  const results = await Promise.all(NEWS[k].feeds.map(([url, src]) => httpGet(url).then(x => parseRss(x, src)).catch(() => null)));
  newsLoading[k] = false;
  const seen = new Set(), byDate = (a,b) => b.date - a.date;
  const all = results.filter(Boolean).flat()
    .sort((a,b) => !!b.img - !!a.img) // entre repetidas, fica a que tem foto
    .filter(n => !seen.has(n.title) && seen.add(n.title)).sort(byDate);
  // Até 30 com foto; as sem foto (Google, que vem em volume bem maior) só completam a lista até 40.
  const withImg = all.filter(n => n.img).slice(0, 30);
  const items = withImg.concat(all.filter(n => !n.img).slice(0, 40 - withImg.length)).sort(byDate);
  newsCache[k] = items.length ? {at:Date.now(), items} : {at:Date.now() - 29*60e3, items:(c && c.items) || [], err:true}; // falhou: tenta de novo em 1 min
  try { localStorage.setItem(NEWS_KEY, JSON.stringify(newsCache)); } catch(e){}
  if (state.tab === 'noticias' && !sheetOpen()) render();
}
function ago(ts){
  const m = Math.round((Date.now() - ts) / 60e3);
  return !ts ? '' : m < 60 ? `há ${Math.max(m,1)} min` : m < 1440 ? `há ${Math.round(m/60)} h` : `há ${Math.round(m/1440)} d`;
}
function openNews(i){
  const url = newsCache[newsTab].items[i].link;
  if (window.Android && Android.abrir) Android.abrir(url); else window.open(url, '_blank', 'noopener');
}
// Quadro com a inicial da fonte, para notícias sem foto (ou cuja foto não carregou).
const newsPh = s => `<div class="thumb ph">${esc((s || 'N').trim()[0].toUpperCase())}</div>`;
function viewNoticias(){
  const c = newsCache[newsTab], items = (c && c.items) || [];
  const top = items.findIndex(n => n.img); // a primeira com foto vira o destaque
  loadNews(newsTab);
  return `
  ${head('Notícias', 'noticias')}
  <div class="btns" style="margin:0 0 12px">${Object.entries(NEWS).map(([k,n]) => `<button class="btn ${newsTab === k ? 'primary' : ''}" onclick="newsTab='${k}';render();scrollTo(0,0)">${n.label}</button>`).join('')}</div>
  ${newsTab === 'rec' ? '<div class="hint" style="margin:0 4px 12px">Matérias e análises publicadas por sites de notícias. Não são uma recomendação deste app: avalie seu perfil e seus objetivos antes de investir.</div>' : ''}
  ${items.length ? `${top < 0 ? '' : `<div class="newsHero" onclick="openNews(${top})">
      <img src="${esc(items[top].img.replace('w=160&h=160', 'w=640&h=360'))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">
      <div><span class="src">${esc(items[top].source || 'Destaque')}</span><b>${esc(items[top].title)}</b><small>${ago(items[top].date)}</small></div></div>`}
    <div class="card news">${items.map((n,i) => i === top ? '' : `<div class="item" onclick="openNews(${i})">
      ${n.img ? `<img class="thumb" src="${esc(n.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=newsPh(this.dataset.s)" data-s="${esc(n.source)}">` : newsPh(n.source)}
      <div class="mid"><b>${esc(n.title)}</b><span class="src">${esc(n.source || 'Notícia')}</span> <small>${ago(n.date)}</small></div></div>`).join('')}</div>`
  : newsLoading[newsTab] ? skel(4) : empty('signal','Não foi possível carregar as notícias.<br>Verifique a internet e toque em Atualizar.')}
  <div class="btns" style="margin-bottom:12px"><button class="btn" onclick="loadNews(newsTab,true);render()">${newsLoading[newsTab] ? 'Atualizando…' : I('refresh') + 'Atualizar'}</button></div>
  ${c && c.err && items.length ? '<div class="hint" style="text-align:center">Sem conexão: mostrando as últimas notícias salvas.</div>' : ''}`;
}

