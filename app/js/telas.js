// Cofrim — As telas de cada aba (Resumo, Ganhos, Gastos, Investir) e as notícias.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
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
const catName = (c, color = 'var(--brand)') => `<span style="color:${esc(color)}">${I(c[0], 16)}</span> ${esc(c[1])}`;
// Título da aba com os botões de personalizar a tela e de configurações.
// Título das telas: a nuvem da sincronização logo depois do nome; à direita, o sino (só no Resumo), o olho e o menu.
const tituloTela = (title, tab, extra = '') => `<h1><span class="tit">${title}${nuvemBtn()}</span><span class="acoes">${extra}${eyeBtn()}${menuBtn(tab)}</span></h1>`;
const head = (title, tab) => tituloTela(title, tab) + offlinePill();
const empty = (icon, t) => `<div class="card empty"><span>${I(icon, 40)}</span>${t}</div>`;
// Conta compartilhada: quem lançou o registro (by), como etiqueta na linha. Fora dela não aparece.
const byTag = x => shared() && x.by ? `<span class="tag">${I('user', 11)} ${esc(x.by)}</span>` : '';
const bySmall = x => shared() && x.by ? ` · por ${esc(x.by)}` : '';
// Saudação do topo do Resumo, com o nome escolhido (db.prefs.greet: 'o' bem-vindo, 'a' bem-vinda, 'e' boas-vindas).
const greeting = () => { const n = db.prefs.name; return n ? `${{o:'Bem-vindo', a:'Bem-vinda'}[db.prefs.greet] || 'Boas-vindas'}, ${esc(n)}!` : ''; };
// Ordem dos grupos da lista de lançamentos (Gastos): ▲▼ como no "Personalizar".
function openGrpOrder(){
  const o = db.prefs.grpOrder;
  showSheet(`<h3>Ordem dos grupos</h3><div class="hint" style="margin-top:0">Use as setas para escolher a ordem dos grupos na lista de lançamentos.</div>
    ${o.map((k, i) => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><b>${GRUPOS[k][0]}</b></div>
      <button class="iconbtn" data-onclick="grpMove(${i},-1)" ${i ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" data-onclick="grpMove(${i},1)" ${i < o.length - 1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`).join('')}
    <div class="btns"><button class="btn" data-onclick="db.prefs.grpOrder=Object.keys(GRUPOS);db.cfgMod=Date.now();save();render();openGrpOrder()">Restaurar padrão</button><button class="btn primary" data-onclick="closeForm()">Pronto</button></div>`);
}
function grpMove(i, d){ const o = db.prefs.grpOrder; [o[i], o[i + d]] = [o[i + d], o[i]]; db.cfgMod = Date.now(); save(); render(); openGrpOrder(); }
// Gráfico de rosca. parts = [[cor, valor], ...]
// Dia do mês de um gasto (para o calendário do Resumo e a ordenação das listas): o dia lançado ou, numa conta fixa,
// o do vencimento; 0 = sem dia informado.
// Gasto sem dia informado (avulso, fixo sem vencimento ou parcelado): vale o dia do mês em que foi cadastrado (o id
// guarda o momento da criação, ver uid). Um fixo cadastrado no dia 15 aparece no dia 15 de cada mês.
const criadoEm = x => { const t = parseInt(String(x.id).slice(0, -5), 36); return t > 1.5e12 && t < 4e12 ? new Date(t) : null; };
const diaCriado = (x, m) => { const d = criadoEm(x); return d ? Math.min(d.getDate(), daysIn(m)) : 0; };
const diaDe = (x, m) => (x.kind === 'installment' ? +x.day : x.fixed ? (x.due ? dueDay(x, m) : 0) : +x.day) || diaCriado(x, m);
// Gastos do mês por dia: posição = dia (a 0 junta os sem dia); cada uma {v: total, itens}.
function gastosPorDia(m){
  const por = [...Array(daysIn(m) + 1)].map(() => ({v:0, itens:[]}));
  for (const x of expensesOf(m)){ const d = por[Math.min(diaDe(x, m), por.length - 1)]; d.v += x.value; d.itens.push(x); }
  return por;
}
// Valor curto para os cartões de destaque: "R$ 3.975" até dez mil, "R$ 28,8 mil" acima.
const fmtCurto = v => hideVals ? MASK : Math.abs(v) < 1e4 ? 'R$ ' + Math.round(v).toLocaleString('pt-BR') : 'R$ ' + v.toLocaleString('pt-BR', {notation:'compact', maximumFractionDigits:1});
function donut(parts, total, rotulo = 'Total'){
  let acc = 0;
  // Cada fatia termina um pouco antes da seguinte (folga), para o anel não parecer um bloco só.
  const folga = parts.length > 1 ? .7 : 0;
  const ring = (color, p, off) => `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${color}" stroke-width="5.2" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${off}"/>`;
  return `<svg viewBox="0 0 42 42" style="width:160px;height:160px;display:block;margin:0 auto 4px">${ring('var(--line)', 100, 25)}
    ${parts.map(([color, v]) => { const p = v / total * 100, s = ring(color, Math.max(p - folga, .3), 25 - acc); acc += p; return s; }).join('')}
    <text x="21" y="19.6" text-anchor="middle" font-size="2.8" fill="var(--muted)">${rotulo}</text>
    <text x="21" y="24.2" text-anchor="middle" font-size="3.6" font-weight="700" fill="var(--text)">${hideVals ? MASK : 'R$ ' + total.toLocaleString('pt-BR', {notation:'compact', maximumFractionDigits:1})}</text></svg>`;
}

// Cartão com a rosca de gastos por categoria: total no centro e, ao lado, as cinco maiores categorias (o resto vira
// "Outras") com valor e percentual. lista = [[categoria, valor], ...]; rotulo = o que vai no centro (mês ou ano).
function roscaCats(lista, rotulo, vazio){
  const cs = [...lista].sort((a, b) => b[1] - a[1]), tot = sum(cs, c => c[1]), top = cs.slice(0, 5), resto = sum(cs.slice(5), c => c[1]);
  if (!cs.length) return `<div class="hint" style="margin:0 4px 12px">${vazio}</div>`;
  const cor = (k, i) => (CAT_GASTO[k] || CAT_GASTO.outros)[2] || shade(i, top.length);
  const linhas = [...top.map(([k, v], i) => [cor(k, i), (CAT_GASTO[k] || CAT_GASTO.outros)[1], v]), ...(resto ? [['var(--muted)', 'Outras', resto]] : [])];
  return `<div class="card rosca">${donut(linhas.map(([c, , v]) => [c, v]), tot, rotulo)}
    <div>${linhas.map(([c, nome, v]) => `<div class="leg duas"><i class="dot" style="background:${esc(c)}"></i><span>${esc(nome)}<small>${fmtCurto(v)}</small></span><b>${Math.round(v / tot * 100)}%</b></div>`).join('')}</div></div>`;
}

const mesCurto = ym => monthName(ym).split(' ')[0].slice(0, 3) + '.';
function viewResumo(){
  // rm = mês escolhido no Resumo (state.rmes), sempre dentro do ano escolhido (state.year).
  const y = state.year, rm = resumoMes(), nomeM = monthName(rm).split(' ')[0], months = [...Array(12)].map((_,i) => ymOf(y,i));
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
  const goals = db.goals, open = db.installments.filter(p => p.paid < p.n), inv = invoices(rm);
  // Blocos do Resumo. Quais aparecem e em que ordem vem de db.prefs.resumo (ver RESUMO e openResumoEdit).
  const B = {
  mascote: () => db.prefs.fun ? funMascot() : '',
  conquistas: () => db.prefs.fun ? funBadges() : '',
  atalhos: () => `<div class="quick">${[['expenses','receipt','Gasto'],['incomes','income','Ganho'],['investments','trend','Investir']].map(([col, ic, t]) => `<button data-onclick="openForm('${col}')"><span>${I(ic, 20)}</span>+ ${t}</button>`).join('')}</div>`,
  // Mês e ano lado a lado, no mesmo cartão de destaque: o gasto em cima, os ganhos embaixo. Tocar leva aos gastos do mês.
  // Em cada um: barra de quanto dos ganhos já foi gasto e um selo (mês: comparação com o mês anterior; ano: sobra ou falta).
  // O selo fala do mês anterior pelo nome curto ("set."): o cartão é estreito e o texto longo saía do cartão.
  destaque: () => { const mi = totalIn(rm), mo = totalOut(rm), ant = totalOut(addMonths(rm, -1)), dif = ant ? Math.round((mo - ant) / ant * 100) : null;
    const uso = (g, t) => `<div class="uso"><i style="width:${g ? Math.min(100, t / g * 100) : 0}%"></i></div><small>${g ? `${hideVals ? '••' : Math.round(t / g * 100)}% dos ganhos (${fmtCurto(g)})` : 'sem ganhos lançados'}</small>`;
    return `<div class="hero2">
    <div class="hero" data-onclick="goMonth('${rm}')"><small>Gastos de ${nomeM}</small>${bigNum(mo, 1)}${uso(mi, mo)}
      ${dif == null || hideVals ? '' : `<span class="selo">${dif ? `${dif > 0 ? '▲' : '▼'} ${Math.abs(dif)}% sobre ${mesCurto(addMonths(rm, -1))}` : `= igual a ${mesCurto(addMonths(rm, -1))}`}</span>`}</div>
    <div class="hero ano"><small>Gastos de ${y}</small>${bigNum(tout, 1)}${uso(tin, tout)}
      ${tin || tout ? `<span class="selo">${tin - tout < 0 ? 'faltou' : 'sobrou'} ${fmtCurto(Math.abs(tin - tout))}</span>` : ''}</div></div>`; },
  // Gastos por categoria do mês escolhido: rosca com o total no centro e as maiores categorias ao lado.
  rosca: () => { const g = {}; expensesOf(rm).forEach(e => g[e.cat] = (g[e.cat] || 0) + e.value);
    return `<h2>Gastos por categoria em ${nomeM} <button data-onclick="goMonth('${rm}')">Ver gastos</button></h2>${roscaCats(Object.entries(g), cap(nomeM), `Nenhum gasto em ${monthName(rm)}.`)}`; },
  // Calendário do mês atual: cada dia fica mais escuro quanto mais se gastou nele. Tocar num dia mostra o que saiu.
  dias: () => { const por = gastosPorDia(rm), max = Math.max(...por.slice(1).map(d => d.v)), n = daysIn(rm), [ay, am] = rm.split('-').map(Number), vazio = new Date(ay, am - 1, 1).getDay();
    const sel = state.dia && state.dia <= n ? por[state.dia] : null;
    return `<h2>Calendário de gastos de ${nomeM}</h2><div class="card">
      <div class="cal">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<small>${d}</small>`).join('')}${'<span></span>'.repeat(vazio)}
      ${[...Array(n)].map((_, i) => { const d = i + 1, v = por[d].v, nivel = !v || !max ? 0 : Math.max(1, Math.ceil(v / max * 4));
        return `<button class="n${nivel}${rm === curYM && d === now.getDate() ? ' hoje' : ''}${state.dia === d ? ' sel' : ''}" data-onclick="state.dia=${state.dia === d ? 0 : d};render()" aria-label="Dia ${d}: ${hideVals ? MASK : fmt(v)}">${d}</button>`; }).join('')}</div>
      ${sel ? `<div class="calSel"><b>Dia ${state.dia}: ${fmt(sel.v)}</b>${sel.itens.length ? sel.itens.map(x => `<div class="leg"><span>${esc(x.desc)}</span><b>${fmt(x.value)}</b></div>`).join('') : '<div class="hint" style="margin:2px 0 0">Nenhum gasto neste dia.</div>'}</div>`
      : `<div class="escala"><span>menos</span>${[0, 1, 2, 3, 4].map(i => `<i class="n${i}"></i>`).join('')}<span>mais</span></div>
        <div class="hint">Quanto mais forte a cor, mais gasto no dia. Toque num dia para ver o que saiu. Gasto sem dia informado entra no dia do mês em que foi cadastrado.${por[0].v ? ` Sem dia informado: ${fmt(por[0].v)}.` : ''}</div>`}</div>`; },
  alertas: () => `${bills.length ? `<div class="card"><b>${I('calendar')} Contas a vencer</b>${bills.map(({x, diff}) => `
    <div class="item" style="cursor:default"><div class="mid"><b>${esc(x.desc)}</b>
      <small class="${diff < 0 ? 'out' : diff <= 2 ? 'warn' : ''}">${diff < 0 ? `venceu há ${-diff} dia${diff < -1 ? 's' : ''}` : diff === 0 ? 'vence hoje' : `vence em ${diff} dia${diff > 1 ? 's' : ''}`} · dia ${dueDay(x, curYM)}</small></div>
      <div class="val">${fmt(x.value)}</div><button class="btn" style="flex:none;padding:8px 10px" data-onclick="togglePaid('${x.id}','${curYM}')">${I('check', 15)}Pago</button></div>`).join('')}</div>` : ''}
  ${over.length ? `<div class="card"><b><span class="warn">${I('alert')}</span> Orçamento de ${monthName(curYM)}</b>${over.map(b => { const c = CAT_GASTO[b.cat] || CAT_GASTO.outros; return `
    <div class="hint" style="color:${budgetColor(b.pct)}">${esc(c[1])}:${Math.round(b.pct)}% usado (${fmt(b.used)} de ${fmt(b.lim)})</div>`; }).join('')}</div>` : ''}${oddHtml(odd)}`,
  planejar: () => planHtml(),
  saldo: () => `<div class="hero"><small>Saldo de ${y}</small>${bigNum(tin - tout)}
    <div class="row cores"><div><small>Ganho total</small><b class="hIn">${fmt(tin)}</b></div><div><small>Gasto total</small><b class="hOut">${fmt(tout)}</b></div></div></div>`,
  // Ganhos e gastos mês a mês, em curvas suaves: a linha cheia (cor do tema, com a área preenchida em degradê) são os
  // ganhos, com o rendimento dos investimentos; a pontilhada vermelha são os gastos. O mês tocado (ou, sem toque, o mês
  // atual) ganha um anel na linha dos ganhos e uma etiqueta com o valor. O desenho é um SVG esticado atrás das colunas.
  grafico: () => { const gan = ins.map((v, i) => v + yields[i]), alt = v => v / max * 90, mi = si >= 0 ? si : months.indexOf(curYM);
    const lim = v => Math.max(0, Math.min(100, v)).toFixed(2);
    const curva = vals => { const p = vals.map((v, i) => [i * 10 + 5, 100 - alt(v)]);
      return p.map(([x, yy], i) => { if (!i) return `M${x},${lim(yy)}`; const a = p[i - 2] || p[i - 1], b = p[i - 1], d = p[i + 1] || p[i];
        return `C${(b[0] + (x - a[0]) / 6).toFixed(2)},${lim(b[1] + (yy - a[1]) / 6)} ${(x - (d[0] - b[0]) / 6).toFixed(2)},${lim(yy - (d[1] - b[1]) / 6)} ${x},${lim(yy)}`; }).join(''); };
    const tr = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"', cg = curva(gan);
    return `<div class="card graf"><div class="grafTit">Ganhos e gastos por mês<span>${y}</span></div>
    <div class="chart curva"><svg viewBox="0 0 120 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="grafDeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brand);stop-opacity:.38"/><stop offset="1" style="stop-color:var(--brand);stop-opacity:0"/></linearGradient></defs>
        ${[25, 50, 75].map(g => `<line x1="0" x2="120" y1="${g}" y2="${g}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
        <path d="${cg}L115,100L5,100Z" fill="url(#grafDeg)"/><path d="${cg}" stroke="var(--brand)" stroke-width="3.5" ${tr}/>
        <path d="${curva(outs)}" stroke="var(--out)" stroke-width="3.5" stroke-dasharray="0.1 8" ${tr}/></svg>
      ${months.map((m,i) => `<div class="col ${i === si ? 'sel' : ''}${m === curYM ? ' atual' : ''}" data-onclick="state.sel='${state.sel === m ? '' : m}';render()"><div class="bars">
        ${i === mi ? `<i class="anel" style="bottom:${alt(gan[i])}%"></i><span class="dica${alt(gan[i]) > 62 ? ' baixo' : ''}${i < 2 ? ' esq' : i > 9 ? ' dir' : ''}" style="bottom:${alt(gan[i])}%">${MESES[i].slice(0,3)} · ${fmtCurto(gan[i])}</span>` : ''}</div>
      <small>${[0, 3, 6, 9, 11].includes(i) || i === mi ? MESES[i].slice(0,3) : ''}</small></div>`).join('')}</div>
    <div class="legend" style="margin-top:8px"><span><i class="dot" style="background:var(--brand)"></i>Ganhos${tyield ? ' (com rendimento)' : ''}</span><span><i class="dot" style="background:var(--out)"></i>Gastos</span></div>
    ${si < 0 ? '<div class="hint">Toque em um mês para ver os valores.</div>' : `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><b style="text-transform:capitalize">${monthName(months[si])}</b>
      <div class="grid2" style="margin-top:8px;row-gap:8px">
        <div class="stat"><small>Ganhos</small><b class="in">${fmt(ins[si])}</b></div>
        <div class="stat"><small>Gastos</small><b class="out">${fmt(outs[si])}</b></div>
        <div class="stat"><small>Saldo</small><b class="${ins[si] - outs[si] < 0 ? 'out' : ''}">${fmt(ins[si] - outs[si])}</b></div>
        <div class="stat"><small>Rendimento estimado</small><b style="color:var(--brand)">${fmt(yields[si])}</b></div>
      </div>
      <div class="btns"><button class="btn" data-onclick="goMonth('${months[si]}')">Ver gastos do mês</button></div></div>`}
    ${tyield ? `<div class="hint">Rendimento estimado dos investimentos em ${y}: <b style="color:var(--brand)">${fmt(tyield)}</b>. Meses passados usam o valor registrado pelo app; os futuros são projeção. Não entra no saldo do ano.</div>` : ''}
  </div>`; },
  numeros: () => `<div class="grid2">
    <div class="card stat"><small>Média mensal de gastos em ${y}</small><b class="out">${fmt(tout/12)}</b></div>
    <div class="card stat" style="cursor:pointer" data-onclick="go('invest')"><small>Investido hoje ›</small><b>${fmt(invNow)}</b></div>
  </div>`,
  contas: () => `<h2>Contas <span>${db.accounts.length > 1 ? `<button data-onclick="openForm('transfers')">Transferir</button> · ` : ''}<button data-onclick="openForm('accounts')">+ Conta</button></span></h2>
  ${db.accounts.length ? `<div class="card">${db.accounts.map(a => { const b = accountBalance(a); return `
    <div class="item" data-onclick="edit('accounts','${a.id}')">${tile('bank')}<div class="mid"><b>${esc(a.name)}</b><small>saldo de hoje · fim do mês: ${fmt(accountBalance(a, monthEnd(curYM)))}${bySmall(a)}</small></div>
      <div class="val ${b < 0 ? 'out' : ''}">${fmt(b)}</div></div>`; }).join('')}
    <div class="item" style="cursor:default"><div class="mid"><b>Total nas contas</b></div><div class="val">${fmt(sum(db.accounts, accountBalance))}</div></div></div>
    ${db.transfers.length ? `<div class="card"><b>Transferências</b>${[...db.transfers].sort((a,b) => b.month.localeCompare(a.month)).slice(0, 5).map(t => `
    <div class="item" data-onclick="edit('transfers','${t.id}')"><div class="mid"><b style="font-weight:500">${esc(t.from)} → ${esc(t.to)}</b><small>${monthName(t.month)}${bySmall(t)}</small></div><div class="val">${fmt(t.value)}</div></div>`).join('')}</div>` : ''}`
  : '<div class="hint" style="margin:0 4px 12px">Cadastre suas contas para acompanhar o saldo de cada uma. O saldo considera os ganhos e gastos em que você informar o mesmo nome no campo de banco/conta.</div>'}`,
  // Gastos por categoria do ano: a mesma rosca do mês.
  categorias: () => `<h2>Gastos por categoria em ${y}</h2>${roscaCats(Object.entries(cats), y, 'Nenhum gasto cadastrado neste ano.')}`,
  bancos: () => catList.length ? `<h2>Gastos por banco em ${y}</h2>${breakdown(banks)}` : '',
  pagamentos: () => catList.length ? `<h2>Gastos por forma de pagamento em ${y}</h2>${breakdown(pays)}` : '',
  // Previsão: mês atual e os três seguintes. "Sobra" = ganhos − gastos previstos do mês; com contas cadastradas,
  // mostra também o saldo somado delas no último dia de cada mês.
  previsao: () => { const rows = [...Array(4)].map((_,i) => addMonths(curYM, i)), hasAcc = db.accounts.length > 0;
    const pendIn = sum(incomesOf(curYM).filter(x => x.day > now.getDate()), x => x.value);
    const pendOut = sum(expensesOf(curYM).filter(x => x.kind === 'expense' && (x.fixed ? x.due : x.day) > now.getDate()), x => x.value);
    // Um cartão por mês: selo de sobra/falta, barra de quanto dos ganhos os gastos consomem e os dois valores.
    return `<h2>Previsão dos próximos meses</h2><div class="card prev">${rows.map((m, i) => { const tin = totalIn(m), tout = totalOutPrev(m), net = tin - tout, end = hasAcc ? sum(db.accounts, a => accountBalance(a, monthEnd(m))) - reservaAte(m) : 0, r = reservaPrevisoes(m); return `
      <div class="prevM ${net < 0 ? 'neg' : ''}">
        <div class="prevCab"><b>${cap(monthName(m).split(' ')[0])}${i ? '' : '<em>este mês</em>'}</b><span class="${net < 0 ? 'out' : 'in'}">${net < 0 ? 'falta' : 'sobra'} ${fmt(Math.abs(net))}</span></div>
        <div class="prevBar"><i style="width:${tin ? Math.min(100, tout / tin * 100) : tout ? 100 : 0}%"></i></div>
        <div class="prevNum"><span>${I('income', 13)} entra <b>${fmt(tin)}</b></span><span>${I('receipt', 13)} sai <b>${fmt(tout)}</b></span></div>${r ? `<div class="hint" style="margin:2px 0 0">Sai ${prevInclui(r)}.</div>` : ''}
        ${hasAcc ? `<div class="prevNum"><span>Saldo das contas no fim do mês</span><b class="${end < 0 ? 'out' : ''}">${fmt(end)}</b></div>` : ''}</div>`; }).join('')}
      ${pendIn || pendOut ? `<div class="hint">Até o fim de ${monthName(curYM).split(' ')[0]} ainda entram ${fmt(pendIn)} e saem ${fmt(pendOut)} (lançamentos com dia depois de hoje).</div>` : ''}
      <div class="hint">Considera ganhos e gastos fixos, anuais, parcelas, o que já está lançado em cada mês e o que falta gastar das previsões.</div></div>`; },
  // Resumo do mês: o mesmo cartão de destaque do saldo do ano. Tocar leva aos gastos do mês.
  mes: () => { const a = totalIn(rm), b = totalOut(rm), r = reservaPrevisoes(rm); return `<div class="hero" style="cursor:pointer" data-onclick="goMonth('${rm}')"><small>Saldo de ${monthName(rm)}</small>${bigNum(a - b - r)}${r ? `<small class="prevInc">${prevInclui(r)}</small>` : ''}
    <div class="row cores"><div><small>Ganhos</small><b class="hIn">${fmt(a)}</b></div><div><small>Gastos</small><b class="hOut">${fmt(b)}</b></div><div style="margin-left:auto;align-self:flex-end"><small>Ver gastos ›</small></div></div></div>`; },
  faturas: () => `<h2>Faturas de ${monthName(rm)}</h2>${inv.length ? `<div class="card">${inv.map(([bank, v]) => `<div class="item" style="cursor:default">${tile('card')}<div class="mid"><b>${esc(bank)}</b></div><div class="val out">${fmt(v)}</div></div>`).join('')}</div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma compra no crédito neste mês.</div>'}`,
  parcelas: () => `<h2>Compras parceladas <button data-onclick="state.gsub='parc';go('gastos')">Ver todas</button></h2>${open.length ? `<div class="card grid2">
      <div class="stat"><small>Falta pagar (${open.length})</small><b class="out">${fmt(sum(open, parcFalta))}</b></div>
      <div class="stat"><small>Parcelas deste mês</small><b>${fmt(sum(expensesOf(curYM).filter(x => x.kind === 'installment'), x => x.value))}</b></div></div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma compra parcelada em aberto.</div>'}`,
  vales: () => !temVales() ? '' : `<h2>Vales <button data-onclick="state.gsub='vale';state.month=curYM;go('gastos')">Ver gastos</button></h2>
    <div class="card">${Object.keys(VALES).filter(temVale).map(k => { const s = valeSaldo(k); return `<div class="item" data-onclick="openVale('${k}')">${ico(CAT_GANHO[k])}<div class="mid"><b>${VALES[k]}${valeEmp(k) ? ' · ' + esc(valeEmp(k)) : ''}</b>
      <small>neste mês: entrou ${fmt(sum(valeIn(curYM, k), x => x.value))}, saiu ${fmt(sum(valeOut(curYM, k), x => x.value))}</small></div><div class="val ${s < 0 ? 'out' : ''}">${fmt(s)}</div></div>`; }).join('')}
    <div class="hint">Saldo de cada vale. Fica separado dos ganhos, gastos e do saldo do mês.</div></div>`,
  metas: () => `<h2>Metas <button data-onclick="go('invest')">Ver todas</button></h2>${goals.length ? `<div class="card">${goals.map(g => `
      <div class="catrow"><div class="top"><span>${esc(g.name)}</span><b>${fmt(g.saved)} de ${fmt(g.target)}</b></div>
      <div class="bar"><i style="width:${Math.min(100, g.saved / g.target * 100)}%"></i></div></div>`).join('')}</div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhuma meta cadastrada.</div>'}`,
  invest: () => `<h2>Investimentos <button data-onclick="go('invest')">Ver todos</button></h2>${db.investments.length ? `<div class="card grid2">
      <div class="stat"><small>Total hoje</small><b>${fmt(invNow)}</b></div>
      <div class="stat"><small>Projeção em 12 meses</small><b>${fmt(sum(db.investments, projection))}</b></div></div>`
    : '<div class="hint" style="margin:0 4px 12px">Nenhum investimento cadastrado.</div>'}`
  };
  return `${greeting() ? `<div class="hello">${greeting()}</div>` : ''}
  ${tituloTela('Resumo', 'resumo', sinoBtn()).replace('<h1>', '<h1 style="margin-bottom:0">')}
  <div class="muted" style="margin:0 2px 14px;font-size:13.5px">Hoje é ${todayLabel()}</div>${offlinePill(true)}${trocaContaHtml()}${typeof avisoInstalar === 'function' ? avisoInstalar() : ''}
  <div class="nav periodo"><button data-onclick="resMes(-1)" aria-label="Mês anterior">‹</button><b data-onclick="pickResumo()"><span>${nomeM}</span><small>${y} ▾</small></b><button data-onclick="resMes(1)" aria-label="Próximo mês">›</button></div>
  ${archBanner(y)}${ativHtml()}${bankNotesHtml()}${blocks('resumo', B)}
  ${db.prefs.resumoEnxuto ? '<div style="text-align:center;margin:2px 0 16px"><button class="linkBtn" data-onclick="openResumoEdit()">Ver mais informações no resumo</button></div>'
    : `<div class="btns" style="margin-bottom:12px"><button class="btn" data-onclick="openResumoEdit()">${I('sliders')}Personalizar o Resumo</button></div>`}`;
}
// Sugestões de lançamento a partir das notificações de bancos, carteiras digitais e apps de vale (opcional, só no APK;
// ver BankListener no lado nativo, que marca n.tipo = 'vale' ou 'carteira').
// ---------- Apps que podem gerar sugestões (o único lugar da lista; o lado nativo recebe a mesma por avisosConfig) ----------
// Só bancos, carteiras digitais, cartões e vales-benefício. Para ampliar: um pacote novo em BANK_APPS (com o nome) ou
// uma palavra em APPS_PADROES. APPS_ANUNCIO: texto de propaganda (oferta, cupom, "bora"…), descartado mesmo de um banco.
const BANK_APPS = {'com.nu.production':'Nubank', 'br.com.intermedium':'Inter', 'com.itau':'Itaú', 'br.com.bb.android':'Banco do Brasil', 'com.bradesco':'Bradesco',
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
  if (window.Android && Android.avisosConfig) Android.avisosConfig(JSON.stringify({pacotes:Object.keys({...BANK_APPS, ...CARTEIRA_APPS}), padroes:APPS_PADROES, anuncio:APPS_ANUNCIO, bloqueados:appsBloqueados()}));
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
function bankNotes(){ if (demoOn) return demoNotas; try { return window.Android && Android.avisosBanco ? JSON.parse(Android.avisosBanco()).filter(notaPermitida) : []; } catch(e){ return []; } }
// {value, desc, income, bank, date} a partir do texto da notificação; null se não houver valor.
// Notificação que chegou escondida (n.oculto, ver BankListener): {hidden, app, title, income, bank, date}, sem valor.
// Nome do app que avisou: o da lista, o que o Android informou ou, sem nenhum, o do pacote (ex.: "mcdonalds").
const bankName = n => BANK_APPS[n.app] || CARTEIRA_APPS[n.app] || n.nome || (String(n.app || '').split('.').filter(p => !/^(com|br|android|apps?|mobile|mobileapp|production|prod)$/i.test(p)).pop() || 'banco');
// App de vale: a empresa vem do nome do pacote; o vale (VR ou VA), do texto ou, sem pista, do único vale que a pessoa usa
// (k = '' quando não dá para saber: o app pergunta).
const VALE_APPS = [[/alelo/i, 'Alelo'], [/pluxee/i, 'Pluxee'], [/sodexo/i, 'Sodexo'], [/ticket/i, 'Ticket'], [/ifood/i, 'iFood Benefícios'], [/flash/i, 'Flash'],
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
  if (n.oculto) return {hidden:true, value:0, desc:'', title:String(n.titulo || ''), app:bankName(n), income:/receb|transfer[eê]ncia recebida|dep[oó]sito|creditad/i.test(n.titulo), bank:BANK_APPS[n.app] || '', date, ...vale};
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
  return list.length ? `<div class="card"><b>${I('sparkle')} Sugestões de gasto</b>${list.map(({i, n, p}) => `
    <div class="item" style="cursor:default"><div class="mid">${p.hidden
      ? `<b>Novo aviso do ${esc(p.app)}</b><small style="white-space:normal">${p.title ? esc(p.title) + ' · ' : ''}${new Date(n.t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}. Não deu para ler o valor (o Android esconde avisos com números parecidos com código); confira no app do banco.</small>`
      : `<b>${esc(p.desc)}</b><small style="white-space:normal">${esc(bankName(n))} · ${esc(String(n.texto).slice(0, 90))}</small>`}</div>
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
function noteDrop(t, st = 'ignorada'){
  const n = bankNotes().find(n => n.t === t);
  avisoCancelar(t); // a notificação dela, se ainda estiver na barra do Android
  if (n && demoOn){ demoNotas = demoNotas.filter(n => n.t !== t); } // demonstração: só na memória
  else if (n){ sugGuardar(n, st); Android.avisosGuardar(JSON.stringify(bankNotes().filter(n => n.t !== t))); }
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
    openForm('expenses', null, {sug:t, vals:{desc:p.desc, value, ...(p.desc ? {cat:guessCat(p.desc)} : {}), bank:p.bank, start:p.date.slice(0, 7), day:String(+p.date.slice(8))}, more:true});
  });
}
// Configurações › Lançamento automático › Apps ignorados: a lista e o "Voltar a sugerir" de cada um.
function openAppsIgnorados(){
  settingsOpen = false; F = null;
  const l = appsIgnorados();
  showSheet(`<h3>Apps ignorados</h3>
    <div class="hint" style="margin-top:0">Destes apps o Cofrim não sugere lançamentos. Ao voltar a sugerir, valem só as próximas notificações: as que chegaram enquanto o app estava ignorado não voltam.</div>
    ${l.length ? `<div class="card" style="box-shadow:none;background:var(--bg)">${l.map((x, i) => `<div class="item" style="cursor:default"><div class="mid"><b>${esc(nomeIgnorado(x))}</b>${nomeIgnorado(x) !== x.app ? `<small>${esc(x.app)}</small>` : ''}</div>
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
const avisoCancelar = t => { if (window.Android && Android.avisoCancelar) Android.avisoCancelar(String(t)); };
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
  Android.avisosGuardar(JSON.stringify(bankNotes().filter(x => x.t !== t)));
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
  Android.avisosLigar(v);
  if (v && !Android.avisosAcesso()){
    await tell('Na tela que vai abrir, ative o "Cofrim" (pode aparecer como "Sugestões de gasto"). O Android vai avisar que o app poderá ler suas notificações: ele guarda só as que têm um valor em R$ e nada sai do aparelho.');
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
      <button class="iconbtn ${b.on ? 'in' : 'muted'}" data-onclick="layoutSet('${tab}',${i},'toggle')" aria-label="${b.on ? 'Esconder' : 'Mostrar'}">${I(b.on ? 'checked' : 'unchecked', 24)}</button>
      <div class="mid" style="${b.on ? '' : 'opacity:.5'}"><b style="white-space:normal">${defs[b.k][0]}</b></div>
      <button class="iconbtn" data-onclick="layoutSet('${tab}',${i},${n ? r[n - 1].i : i})" ${n ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" data-onclick="layoutSet('${tab}',${i},${n < r.length - 1 ? r[n + 1].i : i})" ${n < r.length - 1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`).join('')}
    <div class="btns"><button class="btn" data-onclick="layoutSet('${tab}',0,'reset')">Restaurar padrão</button><button class="btn primary" data-onclick="closeForm()">Pronto</button></div>`);
}
const openResumoEdit = () => openLayoutEdit('resumo');
// op: 'toggle', 'reset' ou a posição com a qual o bloco i troca de lugar.
function layoutSet(tab, i, op){
  const r = layoutOf(tab);
  // Resumo: a primeira personalização tira o link "Ver mais informações" e o bloco mexido deixa de ligar sozinho.
  if (tab === 'resumo'){ db.prefs.resumoEnxuto = false; db.prefs.resumoAuto = op === 'reset' ? [] : (db.prefs.resumoAuto || []).filter(k => k !== r[i].k); }
  if (op === 'toggle') r[i].on = !r[i].on;
  else if (op === 'reset'){ const novo = Object.entries(LAYOUT[tab]).map(([k, d]) => ({k, on:!!d[1]})); if (tab === 'resumo') db.prefs.resumo = novo; else db.prefs.layout[tab] = novo; }
  else [r[i], r[op]] = [r[op], r[i]];
  db.cfgMod = Date.now(); save(); render(); openLayoutEdit(tab);
}

// Vale-refeição e vale-alimentação: parte própria nas abas Gastos (o que foi gasto no vale) e Ganhos (os créditos).
// Para cada vale: o crédito e o gasto do mês e o saldo acumulado. Nada disso entra nos totais do mês.
function viewVales(lado){
  const m = state.month, gastos = lado === 'gastos', lista = gastos ? valeOut(m) : valeIn(m);
  const novo = k => `event.stopPropagation();novoVale('${lado}','${k}')`;
  return `<div class="nav"><button data-onclick="state.month=addMonths(state.month,-1);renderIn()">‹</button><b data-onclick="pickMonth()">${monthName(m)} ▾</b><button data-onclick="state.month=addMonths(state.month,1);renderIn()">›</button></div>
  ${Object.keys(VALES).map(k => { const c = sum(valeIn(m, k), x => x.value), g = sum(valeOut(m, k), x => x.value), s = valeSaldo(k, m); return `
    <div class="card" style="cursor:pointer" data-onclick="openVale('${k}')"><b>${I(CAT_GANHO[k][0])} ${VALES[k]}${valeEmp(k) ? ' · ' + esc(valeEmp(k)) : ''}</b>
      <div class="grid3" style="margin-top:10px">
        <div class="stat"><small>Crédito do mês</small><b class="in" style="font-size:14px">${fmt(c)}</b></div>
        <div class="stat"><small>Gasto do mês</small><b class="out" style="font-size:14px">${fmt(g)}</b></div>
        <div class="stat"><small>Saldo do vale</small><b class="${s < 0 ? 'out' : ''}" style="font-size:14px">${fmt(s)}</b></div></div>
      <div class="btns"><button class="btn" data-onclick="${novo(k)}">${gastos ? '+ Gasto neste vale' : '+ Crédito deste vale'}</button><button class="btn">${I('doc')}Histórico</button></div></div>`; }).join('')}
  <h2>${gastos ? 'Gastos nos vales' : 'Créditos dos vales'}</h2>
  ${lista.length ? `<div class="card">${lista.map(x => gastos ? expRow(x, m) : incRow(x)).join('')}</div>`
    : empty(gastos ? 'receipt' : 'wallet', gastos ? 'Nenhum gasto nos vales em ' + monthName(m) + '.' : 'Nenhum crédito de vale em ' + monthName(m) + '.<br>Cadastre o crédito como fixo para ele entrar todo mês.')}
  <div class="hint" style="text-align:center">Os vales ficam separados: não entram nos ganhos, nos gastos nem no saldo do mês. O saldo do vale é tudo o que entrou menos o que saiu desde o primeiro lançamento. ${gastos ? 'Um gasto vem para cá quando a forma de pagamento é um vale.' : 'Um ganho vem para cá quando a categoria é um vale.'}</div>`;
}
const ganhosSeg = () => `<div class="seg">${[['todos','Ganhos'],['vale','Vales']].map(([k,t]) => `<button class="${state.isub === k ? 'on' : ''}" data-onclick="state.isub='${k}';renderIn()">${t}</button>`).join('')}</div>`;
// Tela de um vale: saldo, totais e o histórico de tudo o que entrou e saiu nele, mês a mês (do mais novo ao mais antigo).
function openVale(k){
  settingsOpen = false; F = null;
  const todos = [...db.incomes.filter(x => x.cat === k), ...db.expenses.filter(x => x.pay === k), ...db.installments.filter(x => x.pay === k)];
  const ini = todos.reduce((a, x) => x.start < a ? x.start : a, curYM), fim = todos.reduce((a, x) => !x.fixed && x.start > a ? x.start : a, curYM), meses = [];
  for (let m = fim, i = 0; m >= ini && i < 240; m = addMonths(m, -1), i++){
    const e = valeIn(m, k), s = valeOut(m, k);
    if (e.length || s.length) meses.push([m, e, s]);
  }
  const tin = sum(meses, ([, e]) => sum(e, x => x.value)), tout = sum(meses, ([, , s]) => sum(s, x => x.value)), saldo = valeSaldo(k), n = sum(meses, ([, e, s]) => e.length + s.length);
  const linha = (x, entra) => `<div class="item" data-onclick="edit('${entra ? 'incomes' : x.kind === 'installment' ? 'installments' : 'expenses'}','${x.pid || x.id}')"><div class="mid"><b>${esc(x.desc)}</b>
    <small>${entra ? 'crédito' : 'gasto'}${x.day ? ' · dia ' + x.day : ''}${x.emp ? `<span class="tag">${esc(x.emp)}</span>` : ''}${byTag(x)}</small></div><div class="val ${entra ? 'in' : 'out'}">${entra ? '+' : '−'} ${fmt(x.value)}</div></div>`;
  showSheet(`<h3>${VALES[k]}${valeEmp(k) ? ' · ' + esc(valeEmp(k)) : ''}</h3>
    <div class="hero" style="margin-bottom:10px"><small>Saldo do vale</small>${bigNum(saldo)}
      <div class="row"><div><small>Entrou no total</small><b>${fmt(tin)}</b></div><div><small>Saiu no total</small><b>${fmt(tout)}</b></div></div></div>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="novoVale('ganhos','${k}')">+ Crédito</button><button class="btn primary" data-onclick="novoVale('gastos','${k}')">+ Gasto</button></div>
    <label>Histórico (${n} ${n === 1 ? 'lançamento' : 'lançamentos'})</label>
    ${meses.length ? meses.map(([m, e, s]) => `<div class="grpHead on" style="cursor:default"><b>${cap(monthName(m))}</b><small>${fmt(sum(e, x => x.value) - sum(s, x => x.value))}</small></div>
      <div class="card" style="box-shadow:none;background:var(--bg)">${e.map(x => linha(x, true)).join('')}${[...s].sort((a, b) => (b.day || 0) - (a.day || 0)).map(x => linha(x, false)).join('')}</div>`).join('')
    : '<div class="hint" style="margin-top:0">Nenhum lançamento neste vale ainda.</div>'}
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
}
// Uma linha da lista de ganhos.
function incRow(x){ const c = CAT_GANHO[x.cat] || CAT_GANHO.outros; return `
    <div class="item" data-onclick="edit('incomes','${x.id}')">${ico(c)}<div class="mid"><b>${esc(x.desc)}</b>
    <small>${esc(c[1])}${x.bank ? ' · ' + esc(x.bank) : ''}${x.emp ? `<span class="tag">${esc(x.emp)}</span>` : ''}<span class="tag">${x.fixed === 'y' ? 'anual, em ' + MESES[+x.start.slice(5) - 1] : x.fixed ? 'fixo' : monthName(x.start) + (x.day ? ', dia ' + x.day : '')}</span>${x.fixed ? `<span class="tag">desde ${x.fixed === 'y' ? x.start.slice(0,4) : monthName(x.start)}${x.end ? ' até ' + monthName(x.end) : ''}</span>` : ''}${byTag(x)}</small></div>
    <div class="val in">${fmt(x.value)}</div></div>`; }
// Ordem das listas de Gastos e Ganhos: db.prefs.ordem = 'ant' (mais antigo primeiro) ou qualquer outro valor (mais
// recente primeiro, o padrão). O botão alterna.
const ordemBtn = () => `<button data-onclick="setOrdem()">${db.prefs.ordem === 'ant' ? '↑ Mais antigo' : '↓ Mais recente'}</button>`;
function setOrdem(){ db.prefs.ordem = db.prefs.ordem === 'ant' ? 'rec' : 'ant'; db.cfgMod = Date.now(); save(); render(); }
function viewGanhos(){
  if (state.isub === 'vale') return `${head('Ganhos', 'ganhos')}${ganhosSeg()}${viewVales('ganhos')}`;
  const naoVale = db.incomes.filter(x => !valeGanho(x));
  const row = incRow, sinal = db.prefs.ordem === 'ant' ? -1 : 1, quando = x => x.start + String(x.day || 0).padStart(2, '0');
  const ordena = l => [...l].sort((a, b) => sinal * quando(b).localeCompare(quando(a)));
  const fixed = ordena(naoVale.filter(isMonthly)), yearly = ordena(naoVale.filter(x => x.fixed === 'y')), once = ordena(naoVale.filter(x => !x.fixed));
  const B = {
  total: () => `<div class="hero"><small>Ganhos em ${monthName(curYM)}</small>${bigNum(totalIn(curYM))}
    <small>Fixos mensais: ${fmt(sum(fixed.filter(x => activeIn(x,curYM)), x => x.value))}</small></div>`,
  fixos: () => `<h2>Fixos (todo mês) ${ordemBtn()}</h2>
  ${fixed.length ? `<div class="card">${fixed.map(row).join('')}</div>` : empty('briefcase','Cadastre seu salário e outros ganhos fixos.<br>Eles entram automaticamente em todos os meses.')}`,
  anuais: () => `<h2>Anuais (uma vez por ano)</h2>
  ${yearly.length ? `<div class="card">${yearly.map(row).join('')}</div>` : empty('gift','13º, férias, bônus…<br>Escolha o mês em que você recebe.')}`,
  avulsos: () => `<h2>Ganhos avulsos</h2>
  ${once.length ? `<div class="card">${once.map(row).join('')}</div>` : empty('wallet','Nenhum ganho avulso cadastrado.')}`
  };
  return head('Ganhos', 'ganhos') + ganhosSeg() + blocks('ganhos', B)
    + `<div class="btns" style="margin-bottom:12px"><button class="btn danger" style="flex:1" data-onclick="openApagar('ganhos')">${I('trash')}Apagar ganhos por dia, mês ou ano</button></div>`;
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
// ---------- Previsões (bloco da aba Gastos e detalhe) ----------
// Barra: verde até 80% do previsto, amarela até 100%, vermelha acima (cheia, com o excesso escrito).
const prevCor = pct => pct > 100 ? 'var(--out)' : pct >= 80 ? 'var(--yield)' : 'var(--in)';
const prevNome = cat => (CAT_GASTO[cat] || CAT_GASTO.outros)[1];
function prevPrazo(it){
  const g = prevGasto(it), dif = round2(g - it.value), hoje = today();
  if (!prevAtiva(it) && it.m <= hoje[0]) return dif > 0 ? `encerrada · ${fmt(dif)} acima` : dif < 0 ? `encerrada · sobraram ${fmt(-dif)}` : 'encerrada · exatamente o previsto';
  const falta = it.m === hoje[0] ? it.dia - hoje[1] : null;
  return `até dia ${it.dia}${falta == null ? '' : falta === 0 ? ' · termina hoje' : ` · falta${falta > 1 ? 'm' : ''} ${falta} dia${falta > 1 ? 's' : ''}`}`;
}
function prevBloco(m){
  const l = previsoesDoMes(m);
  return `<h2>Previsões <button data-onclick="novaPrevisao()">Nova previsão</button></h2>${l.length ? `<div class="card">${l.map(it => {
    const g = prevGasto(it), pct = g / it.value * 100, dif = round2(g - it.value);
    return `<div class="catrow prevItem" data-id="${it.p.id}" data-m="${m}" data-onclick="abrirPrevisao(this.dataset.id,this.dataset.m)"><div class="top"><span>${catName(CAT_GASTO[it.cat] || CAT_GASTO.outros)}</span><b>${fmt(g)} de ${fmt(it.value)}</b></div>
      <div class="bar" style="margin:6px 0"><i style="width:${Math.min(100, pct)}%;background:${prevCor(pct)}"></i></div>
      <div class="hint" style="margin-top:0">${prevPrazo(it)}${dif > 0 && prevAtiva(it) ? ` · <span class="out">${fmt(dif)} acima do previsto</span>` : ''}${it.p.rep ? ' · todo mês' : ''}</div></div>`; }).join('')}</div>`
    : `<div class="card"><div class="hint" style="margin:0">Previsão é um gasto que você espera ter numa categoria até um dia do mês (ex.: R$ 300 de combustível até o dia 25). Diferente do orçamento, que é um limite, ela já entra no saldo previsto do mês.</div>
      <div class="btns"><button class="btn" data-onclick="novaPrevisao()">${I('plus')}Nova previsão</button></div></div>`}`;
}
// Detalhe: os lançamentos que contaram, editar e excluir.
function abrirPrevisao(id, m){
  const it = previsoesDoMes(m).find(x => x.p.id === id);
  if (!it) return;
  settingsOpen = false; F = null;
  const l = prevLanc(it), g = prevGasto(it);
  showSheet(`<h3>Previsão de ${esc(prevNome(it.cat))}</h3>
    <div class="hint" style="margin-top:0">${monthName(m)} · ${fmt(g)} de ${fmt(it.value)} · ${prevPrazo(it)}${it.p.rep ? ' · repete todo mês' : ''}</div>
    <label>Lançamentos que contaram (do dia 1 ao dia ${it.dia})</label>
    ${l.length ? `<div class="card" style="background:var(--bg);box-shadow:none">${l.map(x => `<div class="item" style="cursor:default"><div class="mid"><b>${esc(x.desc || prevNome(x.cat))}</b><small>dia ${diaDe(x, m) || '—'}</small></div><div class="val out">${fmt(x.value)}</div></div>`).join('')}</div>`
      : '<div class="hint">Nenhum gasto desta categoria até o dia final.</div>'}
    <div class="btns"><button class="btn danger" data-id="${id}" data-m="${m}" data-onclick="excluirPrevisao(this.dataset.id,this.dataset.m)">Excluir</button><button class="btn" data-id="${id}" data-m="${m}" data-onclick="editarPrevisao(this.dataset.id,this.dataset.m)">Editar</button></div>
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
}
// Gravação do formulário. Nova: vale a partir do mês aberto. Numa que se repete, "Só este mês" guarda a mudança em ex
// (com outra categoria, sai deste mês e vira uma previsão só deste mês); "Este e os próximos" fecha a antiga no mês
// anterior e começa outra daqui (no primeiro mês dela, muda a própria).
function prevSalvar(v, id, novoId){
  const m = prevCtx.m, dados = {cat:v.cat, value:v.value, dia:v.dia || 31}, p = id && db.previsoes.find(x => x.id === id);
  if (!p) return db.previsoes.push(touch({id:novoId, mes:m, ...dados, rep:!!v.rep, ex:{}}));
  if (p.rep && prevCtx.modo === 'este'){
    if (v.cat !== p.cat){ p.ex[m] = {del:1}; db.previsoes.push(touch({id:novoId, mes:m, ...dados, rep:false, ex:{}})); }
    else p.ex[m] = {value:dados.value, dia:dados.dia};
    return touch(p);
  }
  if (p.rep && m > p.mes){ p.ate = addMonths(m, -1); touch(p); return db.previsoes.push(touch({id:novoId, mes:m, ...dados, rep:!!v.rep, ex:{}})); }
  Object.assign(touch(p), dados, {rep:!!v.rep});
}
function prevJaExiste(it){
  ask(`Já existe uma previsão de ${prevNome(it.cat)} em ${monthName(it.m)}. Editar a que existe?`, 'Editar').then(sim => { if (sim) editarPrevisao(it.p.id, it.m); });
}
// Uma que se repete: perguntar se a mudança vale só para este mês ou para este e os próximos.
function prevModo(it, titulo, cb){
  if (!it.p.rep) return cb('');
  pickList(titulo, [['este', 'Só este mês'], ['prox', 'Este e os próximos']], '', cb);
}
function novaPrevisao(){
  prevCtx = {m:state.month, modo:''};
  openForm('previsoes', null, {vals:{dia:String(daysIn(state.month)), rep:''}});
}
function editarPrevisao(id, m){
  const it = previsoesDoMes(m).find(x => x.p.id === id);
  if (it) prevModo(it, 'Editar a previsão', modo => {
    prevCtx = {m, modo};
    openForm('previsoes', null, {id, title:'Editar previsão', vals:{cat:it.cat, value:moneyStr(it.value), dia:String(it.dia), rep:it.p.rep && modo !== 'este' ? '1' : ''}});
  });
}
function excluirPrevisao(id, m){
  const it = previsoesDoMes(m).find(x => x.p.id === id);
  if (it) prevModo(it, 'Excluir a previsão', async modo => {
    if (!await ask(`Excluir a previsão de ${prevNome(it.cat)}${modo === 'este' ? ` só em ${monthName(m)}` : modo === 'prox' ? ` de ${monthName(m)} em diante` : ''}?`, 'Excluir', true)) return;
    const p = it.p;
    closeForm();
    if (!p.rep || (modo !== 'este' && m <= p.mes)) return removeRec('previsoes', id);
    const antes = JSON.stringify(db);
    if (modo === 'este') (p.ex = p.ex || {})[m] = {del:1}; else p.ate = addMonths(m, -1);
    touch(p); save(); render();
    showUndo('Previsão excluída', () => restoreSnap(antes));
  });
}

// ---------- Saúde financeira (bloco da aba Gastos e tela "Detalhe da análise") ----------
// Nota de 0 a 100 calculada na hora com os dados do mês (nada é gravado). Cada componente vai de 0 a 100 e tem um peso;
// componente sem dados suficientes fica de fora e o peso dele se divide entre os outros. Com menos de 3 componentes
// com dados, não há nota (semDados). calcSaude não mexe na tela: lê os dados pelos mesmos cálculos das outras telas.
const SAUDE_FAIXAS = [[80, 'Excelente', 'var(--in)'], [60, 'Boa', 'var(--brand)'], [40, 'Regular', 'var(--yield)'], [0, 'Atenção', 'var(--out)']];
const saudeFaixa = n => SAUDE_FAIXAS.find(f => n >= f[0]);
const numBR = (v, casas = 1) => v.toLocaleString('pt-BR', {maximumFractionDigits:casas});
// Linear entre "ruim" (0) e "bom" (100), limitado aos dois.
const escala = (v, ruim, bom) => Math.round(Math.max(0, Math.min(1, (v - ruim) / (bom - ruim))) * 100);
function calcSaude(ym){
  return cached('S' + ym, () => {
    const meses3 = [0, 1, 2].map(i => addMonths(ym, -i)), tin = totalIn(ym), tout = totalOutPrev(ym); // com o que falta das previsões
    const fim = ym < curYM ? [ym, daysIn(ym)] : today(); // saldo das contas no fim do mês (ou hoje, no mês atual)
    const C = [];
    const comp = (k, nome, peso, nota, frase, curta, dica, ativar) => C.push({k, nome, peso, nota, frase, curta, dica, ativar});
    // Poupança: (ganhos − gastos) ÷ ganhos; 20% ou mais = 100.
    const taxa = tin > 0 ? (tin - tout) / tin * 100 : null;
    comp('poupanca', 'Poupança', 22, taxa == null ? null : escala(taxa, 0, 20), taxa == null ? '' : `Taxa de poupança em ${numBR(taxa)}% (referência: 20%).`,
      taxa == null ? '' : taxa <= 0 ? 'Seus gastos passaram dos ganhos neste mês' : `Você guardou ${numBR(taxa)}% dos ganhos`,
      'Tente separar uma parte dos ganhos assim que eles entram, antes de gastar.', 'Lance os ganhos do mês.');
    // Reserva: saldo das contas ÷ média de gastos dos últimos 3 meses; 6 meses ou mais = 100.
    const media = sum(meses3, totalOut) / 3, saldo = sum(db.accounts, a => accountBalance(a, fim)), cobre = db.accounts.length && media > 0 ? Math.max(0, saldo) / media : null;
    comp('reserva', 'Reserva', 20, cobre == null ? null : escala(cobre, 0, 6), cobre == null ? '' : `Cobre ${numBR(cobre)} ${cobre === 1 ? 'mês' : 'meses'} de despesas (alvo: 3 a 6).`,
      cobre == null ? '' : `Sua reserva cobre ${numBR(cobre)} ${cobre === 1 ? 'mês' : 'meses'} de despesas`,
      'Guarde um pouco todo mês numa conta separada até juntar de 3 a 6 meses de gastos.', 'Cadastre suas contas bancárias com o saldo (Investir › Contas).');
    // Dívidas: vale a pior de três medidas. Uso do limite do cartão (fatura do mês ÷ limite) e compras parceladas do mês
    // seguinte ÷ renda: até 30% = 100, 100% ou mais = 0. Parcelas de financiamentos e empréstimos do mês seguinte ÷ renda:
    // até 30% = 100, 60% ou mais = 0.
    const lims = Object.entries(db.cardLimit || {}).filter(([, l]) => l > 0), fat = Object.fromEntries(invoices(ym));
    const uso = lims.length ? sum(lims, ([b]) => fat[b] || 0) / sum(lims, ([, l]) => l) * 100 : null;
    const renda = sum(meses3, totalIn) / 3, prox = expensesOf(addMonths(ym, 1)).filter(x => x.kind === 'installment' && !x.abat);
    const fins = new Set(db.installments.filter(isFin).map(p => p.id)), ehFin = x => fins.has(x.pid || x.id);
    const pesoParc = renda > 0 && db.installments.some(p => !isFin(p)) ? sum(prox.filter(x => !ehFin(x)), x => x.value) / renda * 100 : null;
    const pesoFin = renda > 0 && fins.size ? sum(prox.filter(ehFin), x => x.value) / renda * 100 : null;
    const notas = [[uso, 100], [pesoParc, 100], [pesoFin, 60]].filter(([v]) => v != null).map(([v, ruim]) => escala(v, ruim, 30));
    comp('dividas', 'Dívidas', 20, notas.length ? Math.min(...notas) : null,
      [uso != null && `Uso do cartão em ${numBR(uso)}% do limite.`, pesoParc != null && `Compras parceladas do mês que vem: ${numBR(pesoParc)}% da renda.`,
        pesoFin != null && `Financiamentos e empréstimos: ${numBR(pesoFin)}% da renda.`].filter(Boolean).join(' '),
      pesoFin != null && escala(pesoFin, 60, 30) === Math.min(...notas) ? `Financiamentos e empréstimos levam ${numBR(pesoFin)}% da renda`
        : uso != null ? `O cartão usa ${numBR(uso)}% do limite` : `As parcelas levam ${numBR(pesoParc || 0)}% da renda`,
      'Use menos de 30% do limite do cartão e evite novas compras parceladas até as atuais terminarem.', 'Informe o limite do cartão (Gastos › Faturas do cartão).');
    // Investimentos: quanto entra por mês nos investimentos (aportes mensais cadastrados ÷ renda; 10% ou mais = 100) e
    // quanto já está investido (total hoje ÷ média de gastos; 12 meses de gastos ou mais = 100). Vale a média das duas.
    const aporte = sum(db.investments, x => x.monthly || 0), investido = sum(db.investments, x => x.value || 0);
    const taxaInv = db.investments.length && renda > 0 ? aporte / renda * 100 : null, mesesInv = db.investments.length && media > 0 ? investido / media : null;
    const notasInv = [taxaInv != null && escala(taxaInv, 0, 10), mesesInv != null && escala(mesesInv, 0, 12)].filter(v => v !== false);
    comp('investimentos', 'Investimentos', 15, notasInv.length ? Math.round(sum(notasInv, v => v) / notasInv.length) : null,
      [taxaInv != null && `Aportes de ${numBR(taxaInv)}% da renda por mês (referência: 10%).`, mesesInv != null && `Investido o equivalente a ${numBR(mesesInv)} ${mesesInv === 1 ? 'mês' : 'meses'} de gastos (alvo: 12).`].filter(Boolean).join(' '),
      taxaInv != null && taxaInv < 10 && (mesesInv == null || escala(taxaInv, 0, 10) <= escala(mesesInv, 0, 12)) ? `Você investe ${numBR(taxaInv)}% da renda por mês` : mesesInv != null ? `Seus investimentos cobrem ${numBR(mesesInv)} ${mesesInv === 1 ? 'mês' : 'meses'} de gastos` : `Você investe ${numBR(taxaInv || 0)}% da renda por mês`,
      'Depois da reserva, invista todo mês uma parte fixa da renda (10% é um bom começo), de preferência no dia em que o dinheiro entra.', 'Cadastre seus investimentos e o aporte mensal (aba Investir).');
    // Orçamento: categorias com orçamento dentro do limite no mês.
    const orc = budgetStatus(ym), dentro = orc.length ? orc.filter(b => b.pct <= 100).length / orc.length * 100 : null;
    comp('orcamento', 'Orçamento', 13, dentro == null ? null : Math.round(dentro), dentro == null ? '' : `${numBR(dentro, 0)}% dos orçamentos dentro do limite.`,
      dentro == null ? '' : `${numBR(dentro, 0)}% dos orçamentos ficaram dentro do limite`,
      'Reveja as categorias que estouraram: ajuste o limite ou corte um pouco nelas.', 'Defina um orçamento por categoria (Gastos › Orçamento do mês).');
    // Regularidade: dias do mês (até hoje) com pelo menos um lançamento.
    const lanc = [...incomesOf(ym), ...expensesOf(ym)], ate = ym === curYM ? now.getDate() : ym < curYM ? daysIn(ym) : 0;
    const dias = new Set(lanc.map(x => diaDe(x, ym)).filter(d => d >= 1 && d <= ate)), reg = lanc.length && ate ? dias.size / ate * 100 : null;
    comp('regularidade', 'Regularidade', 6, reg == null ? null : Math.round(reg), reg == null ? '' : `Lançamentos em ${numBR(reg, 0)}% dos dias do mês.`,
      reg == null ? '' : `Você lançou algo em ${numBR(reg, 0)}% dos dias do mês`,
      'Anote os gastos no dia em que acontecem: leva segundos e deixa a análise mais certa.', 'Lance seus gastos do mês.');
    // Fontes de renda: descrições diferentes de ganhos nos últimos 3 meses; 3 ou mais = 100, 2 = 70, 1 = 40, 0 = 0.
    const fontes = new Set(meses3.flatMap(incomesOf).map(x => plain(String(x.desc || x.cat || '').trim()))).size;
    comp('fontes', 'Fontes de renda', 4, [0, 40, 70, 100][Math.min(fontes, 3)], `${fontes} ${fontes === 1 ? 'fonte de renda registrada' : 'fontes de renda registradas'}.`,
      `${fontes} ${fontes === 1 ? 'fonte de renda registrada' : 'fontes de renda registradas'}`,
      'Uma renda extra (um trabalho por fora, aluguel, dividendos) deixa você menos dependente de uma fonte só.', '');
    const com = C.filter(c => c.nota != null), peso = sum(com, c => c.peso);
    if (com.length < 3) return {semDados:true, componentes:C};
    const nota = Math.round(sum(com, c => c.nota * c.peso) / peso), fraco = [...com].sort((a, b) => a.nota - b.nota || b.peso - a.peso)[0];
    return {semDados:false, nota, faixa:saudeFaixa(nota)[1], cor:saudeFaixa(nota)[2], fraco, componentes:C};
  });
}
const SAUDE_VAZIO = 'Lance seus ganhos e gastos para ver sua saúde financeira.';
function saudeBloco(m){
  const r = calcSaude(m);
  return `<h2>Saúde financeira</h2><div class="card saude" data-onclick="abrirSaude()">${r.semDados ? `<div class="hint" style="margin:0">${SAUDE_VAZIO}</div>`
    : `<div class="saudeTopo"><div class="saudeNota" style="color:${r.cor}">${r.nota}<small>/100</small></div><div><b style="color:${r.cor}">${r.faixa}</b><small>${esc(r.fraco.curta)}</small></div></div>`}
    <div class="saudeVer">Ver detalhe da análise ${I('chev', 14)}</div></div>`;
}
function abrirSaude(){ state.gsub = 'saude'; renderIn(); scrollTo(0, 0); }
function fecharSaude(){ state.gsub = 'mes'; renderIn(); scrollTo(0, 0); }
function viewSaude(){
  const m = state.month, r = calcSaude(m), ant = addMonths(m, -1), ra = calcSaude(ant);
  const dif = !r.semDados && !ra.semDados ? r.nota - ra.nota : null;
  const topo = `<h1><span class="volta"><button class="iconbtn" data-onclick="fecharSaude()" aria-label="Voltar para Gastos">‹</button>Detalhe da análise</span></h1>`;
  if (r.semDados) return `${topo}<div class="card"><div class="hint" style="margin:0">${SAUDE_VAZIO}</div></div>${saudeItens(r)}`;
  return `${topo}
  <div class="card saude"><div class="saudeTopo"><div class="saudeNota" style="color:${r.cor}">${r.nota}<small>/100</small></div><div><b style="color:${r.cor}">${r.faixa}</b>
    ${dif != null ? `<small>${dif > 0 ? '+' : ''}${dif === 0 ? 'Igual a' : dif + ' desde'} ${monthName(ant).split(' ')[0]}</small>` : ''}</div></div>
    <div class="hint" style="margin:8px 0 0">Analisado em ${fmtDate(new Date().toLocaleDateString('sv'))} · análise local · ${monthName(m)}</div></div>
  ${saudeItens(r)}`;
}
const saudeItens = r => `<h2>Composição do score</h2><div class="card">${r.componentes.map(c => c.nota == null
  ? `<div class="catrow"><div class="top"><span>${c.nome}</span><b class="muted">Sem dados suficientes</b></div>${c.ativar ? `<div class="hint" style="margin-top:2px">${c.ativar}</div>` : ''}</div>`
  : `<div class="catrow"><div class="top"><span>${c.nome}</span><b style="color:${saudeFaixa(c.nota)[2]}">${c.nota}</b></div>
    <div class="bar" style="margin:6px 0"><i style="width:${c.nota}%;background:${saudeFaixa(c.nota)[2]}"></i></div><div class="hint" style="margin-top:0">${esc(c.frase)}</div>
    ${c.nota < 60 ? `<div class="hint saudeDica">${I('sparkle', 13)} ${c.dica}</div>` : ''}</div>`).join('')}</div>
  <div class="hint" style="text-align:center">Pesos: poupança 25, reserva 25, dívidas 20, orçamento 15, regularidade 10 e fontes de renda 5. O que está sem dados fica de fora da conta.</div>`;

// A aba Gastos tem duas partes: os gastos do mês e as compras parceladas.
const gastosSeg = () => `<div class="seg">${[['mes','Do mês'],['parc','Parceladas'],['vale','Vales']].map(([k,t]) => `<button class="${state.gsub === k ? 'on' : ''}" data-onclick="state.gsub='${k}';state.parcDet='';renderIn()">${t}</button>`).join('')}</div>`;
function viewGastos(){
  if (state.gsub === 'parc') return `${head('Gastos', 'gastos')}${gastosSeg()}${viewParcelas()}`;
  if (state.gsub === 'vale') return `${head('Gastos', 'gastos')}${gastosSeg()}${viewVales('gastos')}`;
  if (state.gsub === 'saude') return viewSaude();
  const m = state.month, list = expensesOf(m), tin = totalIn(m), tout = sum(list, x => x.value);
  const budgets = budgetStatus(m), inv = invoices(m), cmp = compareMonths(m), resPrev = reservaPrevisoes(m); // previsões: só no saldo projetado
  const owed = owedList(); // de qualquer mês
  const uniq = f => [...new Set(list.map(f).filter(Boolean))];
  // Um filtro que não existe neste mês (ex.: depois de trocar de mês) é desfeito, para não esconder tudo sem aviso.
  for (const [k, f] of [['fcat', x => x.cat], ['fbank', x => x.bank], ['fpay', x => x.pay]]) if (state[k] && !list.some(x => f(x) === state[k])) state[k] = '';
  const tags = [...new Set(list.flatMap(tagsOf))];
  if (state.ftag && !tags.includes(state.ftag)) state.ftag = '';
  const sel = (key, label, options) => { filterOpts[key] = [['', 'Todos'], ...options]; const cur = options.find(o => o[0] === state[key]);
    return `<button type="button" class="pickBtn sm ${cur ? 'on' : ''}" data-onclick="pickFilter('${key}','${label}')"><span>${esc(cur ? cur[1] : label)}</span>${I('chev', 14)}</button>`; };
  const B = {
  saude: () => saudeBloco(m),
  previsoes: () => prevBloco(m),
  // O mesmo cartão de destaque das outras abas (Ganhos, Investir, Resumo): o total do mês em cima, o resto embaixo.
  mes: () => `<div class="hero"><small>Gastos em ${monthName(m)}</small>${bigNum(tout)}
    <div class="row"><div><small>Ganhos</small><b>${fmt(tin)}</b></div><div><small>Saldo</small><b>${fmt(tin - tout - resPrev)}</b></div><div><small>Lançamentos</small><b>${list.length}</b></div></div>${resPrev ? `<small class="prevInc">Saldo ${prevInclui(resPrev)}</small>` : ''}</div>`,
  orcamento: () => `<h2>Orçamento do mês <button data-onclick="openForm('budgets', db.budgets)">${budgets.length ? 'Alterar' : 'Definir'}</button></h2>
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
      <div class="val in">${fmt(x.share)}</div><button class="btn" style="flex:none;padding:8px 10px" data-onclick="settle('${x.id}','${om}')">${I('check', 15)}Recebi</button></div>`).join('')}</div>` : '',
  faturas: () => inv.length ? `<h2>Faturas do cartão <button data-onclick="openForm('cardClose', db.cardClose)">Configurar cartões</button></h2>
  <div class="card">${inv.map(([bank, v]) => `<div class="item" style="cursor:default">${tile('card')}<div class="mid"><b>${esc(bank)}</b>
    ${[db.cardClose[bank] ? 'Fecha no dia ' + db.cardClose[bank] : 'Sem dia de fechamento definido',
      db.cardLimit[bank] && 'Limite: ' + fmt(db.cardLimit[bank]),
      db.cardLimit[bank] && `Comprometido: ${fmt(cardUsed(bank))} (${Math.round(cardUsed(bank) / db.cardLimit[bank] * 100)}%)`,
      db.accounts.length && cardAccount(bank) && 'Paga pela conta ' + esc(cardAccount(bank))].filter(Boolean).map(t => `<small style="display:block">${t}</small>`).join('')}
    ${db.accounts.length && !cardAccount(bank) ? `<small class="warn" style="display:block">${I('alert', 13)} Escolha a conta que paga esta fatura; sem isso ela não é descontada de nenhuma conta.</small>` : ''}</div><div class="val out">${fmt(v)}</div></div>`).join('')}
    ${inv.some(([bank]) => db.accounts.length && !cardAccount(bank)) ? `<div class="btns"><button class="btn primary" data-onclick="openForm('cardClose', db.cardClose)">Escolher a conta que paga</button></div>` : ''}</div>` : '',
  lancamentos: () => `<h2>Lançamentos <span>${ordemBtn()} · <button data-onclick="openGrpOrder()">Grupos</button></span></h2>
  <div class="card" style="padding:12px">
    <div class="search">${I('search')}<input id="q" type="text" placeholder="Buscar por descrição" value="${esc(state.q)}" autocomplete="off" data-oninput="state.q=this.value;this.nextElementSibling.hidden=!this.value;drawExpList()"><button type="button" class="iconbtn" ${state.q ? '' : 'hidden'} data-onclick="clearSearch()" aria-label="Limpar busca">${I('close')}</button></div>
    <div class="filters">
      ${sel('fcat', 'Categoria', uniq(x => x.cat).map(k => [k, (CAT_GASTO[k] || CAT_GASTO.outros)[1]]))}
      ${sel('fbank', 'Banco', uniq(x => x.bank).map(b => [b, b]))}
      ${sel('fpay', 'Pagamento', uniq(x => x.pay).map(p => [p, PAY[p] || p]))}
      ${tags.length ? sel('ftag', 'Etiqueta', tags.map(t => [t, '#' + t])) : ''}
    </div>
    <button type="button" class="moreBtn" style="margin-top:10px;padding:10px" data-onclick="openSearch()">${I('search', 16)}Buscar em todos os meses</button>
  </div>
  <div id="expList">${expListHtml()}</div>`,
  acoes: () => `<div class="btns"><button class="btn" data-onclick="openStatementHelp()">${I('upload')}Importar extrato</button><button class="btn" data-onclick="shown(printReport)">${I('doc')}Relatório (PDF)</button></div>
  <div class="btns"><button class="btn" data-onclick="openSheetLink()">${I('doc')}${sheetId() ? 'Planilha do Google (ligada)' : 'Exportar para uma planilha do Google ligada ao app'}</button></div>
  <div class="btns"><button class="btn" data-onclick="shown(exportPlanilha)">${I('download')}Exportar planilha de ${m.slice(0,4)} (Excel)</button></div>
  <div class="btns" style="margin-bottom:12px"><button class="btn danger" style="flex:1" data-onclick="openApagar('gastos')">${I('trash')}Apagar gastos por dia, mês ou ano</button></div>`
  };
  return `${head('Gastos', 'gastos')}${gastosSeg()}
  <div class="nav"><button data-onclick="state.month=addMonths(state.month,-1);renderIn()">‹</button><b data-onclick="pickMonth()">${monthName(m)} ▾</b><button data-onclick="state.month=addMonths(state.month,1);renderIn()">›</button></div>
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
  // Dentro de cada grupo, pela data: mais recente ou mais antigo primeiro (db.prefs.ordem); os sem dia ficam no fim.
  // Quando dois não têm dia (contas fixas sem vencimento, parcelas), vale o mês em que começaram e, por fim, quando
  // foram lançados: assim o botão sempre inverte a lista, mesmo num mês só de contas fixas.
  const sinal = db.prefs.ordem === 'ant' ? -1 : 1, quando = x => [diaDe(x, m), x.start || '', x.u || 0];
  const porDia = l => [...l].sort((a, b) => { const qa = quando(a), qb = quando(b), i = qa.findIndex((v, j) => v !== qb[j]); return i < 0 ? 0 : sinal * (qb[i] > qa[i] ? 1 : -1); });
  const gs = db.prefs.grpOrder.map(k => [k, GRUPOS[k][0], porDia(list.filter(GRUPOS[k][1]))]);
  // Todos os grupos começam abertos; tocar no título fecha (fica só o total). Numa busca ou filtro, todo grupo com resultado abre.
  return gs.map(([k, t, g]) => { if (!g.length) return ''; const on = filt ? true : open[k] ?? true; return `
    <button type="button" class="grpHead ${on ? 'on' : ''}" ${filt ? 'disabled' : `data-onclick="state.gopen.${k}=${!on};drawExpList()"`} aria-expanded="${on}"><b>${t}</b><small>${g.length} · ${fmt(sum(g, x => x.value))}</small>${filt ? '' : I('chev', 16)}</button>
    ${on ? `<div class="card">${(k === 'avu' ? g.slice(0, state.limit) : g).map(x => expRow(x, m)).join('')}</div>
    ${k === 'avu' && g.length > state.limit ? `<button type="button" class="moreBtn" style="margin:0 0 12px" data-onclick="state.limit+=60;drawExpList()">Mostrar mais ${Math.min(60, g.length - state.limit)} de ${g.length - state.limit} restantes</button>` : ''}` : ''}`; }).join('')
    + (list.length < all.length ? `<div class="hint" style="text-align:center;margin-bottom:12px">${list.length} de ${all.length} lançamentos · ${fmt(sum(list, x => x.value))}</div>` : '');
}
// Uma linha da lista de lançamentos do mês m.
function expRow(x, m){ const c = CAT_GASTO[x.cat] || CAT_GASTO.outros, inst = x.kind === 'installment', bill = !inst && x.fixed && x.due, paid = bill && isPaid(x, m); return `
    <div class="item" ${inst ? '' : `data-sw="${x.id}" data-bill="${bill ? 1 : ''}"`} data-onclick="edit('${inst ? 'installments' : 'expenses'}','${x.id}')">${ico(c)}<div class="mid"><b>${esc(x.desc)}</b>
    <small>${esc(c[1])}${whereLabel(x)}${x.emp ? `<span class="tag">${esc(x.emp)}</span>` : ''}${inst ? `<span class="tag">${parcTag(x)}${x.paid ? ' paga' : ''}</span>` : x.fixed ? `<span class="tag">${x.fixed === 'y' ? 'anual' : isSub(x) ? 'assinatura' : 'fixo'}</span>` : x.day ? `<span class="tag">dia ${x.day}</span>` : ''}${bill ? `<span class="tag">${paid ? 'pago' : 'vence dia ' + dueDay(x, m)}</span>` : ''}${tagsOf(x).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}${x.share ? `<span class="tag">dividido com ${esc(x.who)}${x.got ? ', recebido' : ''}</span>` : ''}${x.photo ? `<span class="tag">${I('doc', 11)} comprovante</span>` : ''}${byTag(x)}</small></div>
    <div class="val out">${fmt(x.value)}</div>${bill ? `<button class="iconbtn ${paid ? 'in' : 'muted'}" data-onclick="togglePaid('${x.id}','${m}')" aria-label="Marcar como pago">${I(paid ? 'checked' : 'unchecked', 24)}</button>` : ''}</div>`; }
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
    <div class="search">${I('search')}<input id="qAll" type="text" placeholder="Descrição, etiqueta ou banco" autocomplete="off" data-oninput="drawSearch()"></div>
    <div id="searchOut"></div>
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
  drawSearch();
  document.getElementById('qAll').focus();
}
function drawSearch(){
  const q = document.getElementById('qAll').value;
  searchHits = searchAll(q);
  document.getElementById('searchOut').innerHTML = q.trim().length < 2 ? '<div class="hint">Digite pelo menos duas letras.</div>'
    : !searchHits.length ? '<div class="hint">Nada encontrado.</div>'
    : searchHits.map(({col, x}, i) => `<div class="item" data-onclick="openHit(${i})"><div class="mid"><b>${esc(x.desc)}</b>
        <small>${COL_NAMES[col]} · ${x.fixed ? 'desde ' : ''}${cap(monthName(x.start))}${x.bank ? ' · ' + esc(x.bank) : ''}${tagsOf(x).map(t => ' · #' + esc(t)).join('')}</small></div>
        <div class="val ${col === 'incomes' ? 'in' : 'out'}">${fmt(col === 'installments' ? x.total : x.value)}</div></div>`).join('');
}
function openHit(i){ const h = searchHits[i]; if (h.col === 'expenses' && !h.x.fixed) state.month = h.x.start; openForm(h.col, h.x); }
const filterOpts = {};
function pickFilter(key, label){ pickList(label, filterOpts[key], state[key], v => { state[key] = v; render(); }); }
function clearSearch(){ const i = document.getElementById('q'); state.q = i.value = ''; i.nextElementSibling.hidden = true; drawExpList(); i.focus(); }
function drawExpList(){ const el = document.getElementById('expList'); if (el) el.innerHTML = expListHtml(); }

// Parceladas: lista (financiamentos e empréstimos primeiro) e, com state.parcDet, a tela de detalhe de um deles.
function viewParcelas(){
  const det = state.parcDet && db.installments.find(p => p.id === state.parcDet);
  if (det) return viewParcDet(det);
  state.parcDet = '';
  const ps = db.installments, fins = ps.filter(isFin), compras = ps.filter(p => !isFin(p));
  const falta = sum(ps, parcFalta), pago = sum(ps, p => parcPago(p) + abatido(p));
  return `
  <div class="hero"><small>Falta pagar</small>${bigNum(falta)}
    <div class="row"><div><small>Valor total</small><b>${fmt(falta + pago)}</b></div><div><small>Já pago</small><b>${fmt(pago)}</b></div></div></div>
  ${fins.length ? `<h2>Financiamentos e empréstimos</h2><div class="card">${fins.map(parcItem).join('')}</div>` : ''}
  ${compras.length ? `${fins.length ? '<h2>Compras parceladas</h2>' : ''}<div class="card">${compras.map(parcItem).join('')}</div>` : ''}
  ${ps.length ? '<div class="hint" style="text-align:center">A contagem avança sozinha quando o mês vira: as parcelas dos meses que já passaram contam como pagas. Toque num item para ver as parcelas.</div>'
    : empty('card', 'Nenhuma compra parcelada, financiamento ou empréstimo.<br>As parcelas entram sozinhas nos gastos de cada mês.')}`;
}
// Um item da lista: nome, credor (ou banco e pagamento), "parcela X de N", valor da parcela, próximo vencimento e a barra.
function parcItem(p){
  const c = CAT_GASTO[p.cat] || CAT_GASTO.outros, done = p.paid >= p.n, j = Math.min(p.paid, p.n - 1);
  const onde = isFin(p) ? esc(p.credor || PARC_TIPOS[p.tipo]) : esc(c[1]) + whereLabel(p);
  return `<div class="item" data-onclick="abrirParc('${p.id}')">${ico(c)}<div class="mid"><b>${esc(p.desc)}</b>
      <small style="display:block">${onde}${bySmall(p)}</small>
      <small style="display:block">${done ? 'quitado' : `parcela ${p.paid + 1} de ${p.n} · vence ${vencTxt(parcVenc(p, p.paid))}`}</small>
      <div class="bar" style="margin:6px 0 0;height:6px"><i style="width:${p.paid / p.n * 100}%"></i></div></div>
    <div class="val ${done ? 'in' : 'out'}">${fmt(parcVal(p, j))}</div></div>`;
}
function abrirParc(id){ state.parcDet = id; state.parcTodas = false; state.parcPagas = false; renderIn(); scrollTo(0, 0); }
function fecharParc(){ state.parcDet = ''; renderIn(); }
// Tela de detalhe: topo com o saldo devedor e o progresso, a próxima parcela, o que já foi pago e todas as parcelas
// (geradas na hora: nada é gravado por parcela).
function viewParcDet(p){
  const c = CAT_GASTO[p.cat] || CAT_GASTO.outros, fin = isFin(p), n = p.n, pagas = Math.min(p.paid, n), rest = n - pagas;
  const saldo = saldoDevedor(p), linhas = parcLinhas(p), prox = rest ? linhas[pagas] : null;
  const onde = fin ? [p.credor && esc(p.credor), (p.conta ? `debita na ${esc(p.conta)} · ` : '') + esc(c[1])] : [[p.bank && esc(p.bank), PAY[p.pay], esc(c[1])].filter(Boolean).join(' · ')];
  const progresso = n <= 36 ? `<div class="segs">${linhas.map(l => `<i class="${l.st === 'paga' ? 'on' : ''}"></i>`).join('')}</div>`
    : `<div class="bar" style="background:rgba(255,255,255,.25)"><i style="width:${pagas / n * 100}%;background:#fff"></i></div>`;
  const venc = linhas.filter(l => l.st === 'vencida'), aVencer = linhas.filter(l => l.st === 'avencer');
  const pagasL = [...linhas.filter(l => l.st === 'paga').map(l => ({...l, ord:(vencData(l.v) || l.v.ym + '-28') + String(l.j).padStart(4, '0')})),
    ...(p.ab || []).map((a, k) => ({ab:a, ord:a.d + 'z' + k}))].sort((a, b) => b.ord.localeCompare(a.ord));
  const quando = l => l.dias < 0 ? `vencida há ${plural(-l.dias, 'dia', 'dias')}` : l.dias === 0 ? 'vence hoje' : `vence em ${plural(l.dias, 'dia', 'dias')}`;
  const linha = l => { const paga = l.st === 'paga', vencida = l.st === 'vencida';
    return `<div class="item parcRow" data-onclick="tocarParc('${p.id}',${l.j})"><span class="stIco ${l.st}">${I(paga ? 'check' : vencida ? 'alert' : 'clock', 16)}</span>${ico(c)}
      <div class="mid"><b>${esc(p.desc)}</b><small>Parcela ${l.j + 1}/${n}${fin ? (p.conta ? ' · ' + esc(p.conta) : '') : PAY[p.pay] ? ' · ' + PAY[p.pay] : p.bank ? ' · ' + esc(p.bank) : ''}</small></div>
      <div class="val ${paga ? 'in' : 'out'}"><small class="${vencida ? 'out' : ''}">${l.j + 1}/${n} · ${vencTxt(l.v)}</small>${fmt(l.val)}</div></div>`; };
  const linhaAb = a => `<div class="item parcRow" style="cursor:default"><span class="stIco paga">${I('coins', 16)}</span>${ico(c)}
      <div class="mid"><b>Abatimento</b><small>${fmtDate(a.d)} · ${a.modo === 'parcela' ? 'reduziu a parcela' : 'reduziu o prazo'}</small></div>
      <div class="val in"><small>${fmtDate(a.d)}</small>${fmt(a.v)}</div></div>`;
  const verAV = state.parcTodas ? aVencer : aVencer.slice(0, 12), verPg = pagasL.length <= 3 || state.parcPagas;
  const pend = venc.length + aVencer.length, concl = pagasL.length;
  return `
  <div class="detTop"><button class="btn" data-onclick="fecharParc()">‹ Parceladas</button><button class="iconbtn" data-onclick="parcMenu('${p.id}')" aria-label="Opções">⋯</button></div>
  <div class="hero">
    <b style="font-size:19px;display:block">${esc(p.desc)}</b>
    ${onde.filter(Boolean).map(t => `<small>${t}</small>`).join('')}
    <small style="margin-top:12px">Saldo devedor hoje</small>${bigNum(saldo)}
    ${p.taxa && rest ? '<small>Valor aproximado; o valor oficial é o informado pelo banco.</small>' : ''}
    ${progresso}
    <div class="row" style="justify-content:space-between"><small>${plural(pagas, 'paga', 'pagas')}</small><small>${rest ? `${plural(rest, 'restante', 'restantes')} · até ${MESES[+addMonths(p.start, n - 1).slice(5) - 1].slice(0, 3)}/${addMonths(p.start, n - 1).slice(0, 4)}` : 'quitado'}</small></div>
  </div>
  <div class="grid2">
    <div class="card" style="margin:0">${prox ? `<small class="muted">Parcela ${prox.j + 1} de ${n}</small><b style="display:block;font-size:18px">${fmt(prox.val)}</b>
      <small class="${prox.dias < 0 ? 'out' : 'muted'}" style="display:block">${vencTxt(prox.v)} · ${quando(prox)}</small>
      <div class="btns"><button class="btn primary" data-onclick="pagarParc('${p.id}',1)">${I('check', 16)}Pagar</button></div>`
      : `<small class="muted">Próxima parcela</small><b style="display:block;font-size:18px" class="in">Quitado</b>`}</div>
    <div class="card" style="margin:0"><small class="muted">Já pago</small><b style="display:block;font-size:18px" class="in">${fmt(parcPago(p) + abatido(p))}</b>
      <small class="muted" style="display:block">${plural(pagas, 'parcela', 'parcelas')}${p.ab ? ' e ' + plural(p.ab.length, 'abatimento', 'abatimentos') : ''}</small>
      ${fin && rest ? `<div class="btns"><button class="btn" data-onclick="openAbater('${p.id}')">${I('coins', 16)}Abater</button></div>` : ''}</div>
  </div>
  <h2 style="display:block">Lançamentos<small style="display:block;text-transform:none;letter-spacing:0;font-weight:400;margin-top:2px">${plural(pend, 'pendente', 'pendentes')} · ${plural(concl, 'concluída', 'concluídas')}</small></h2>
  <div class="card">
    ${venc.length ? `<div class="pGrp out">VENCIDAS</div>${venc.map(linha).join('')}` : ''}
    ${aVencer.length ? `<div class="pGrp">A VENCER</div>${verAV.map(linha).join('')}
      ${aVencer.length > verAV.length ? `<div class="btns"><button class="btn" data-onclick="state.parcTodas=true;render()">Ver todas (${aVencer.length})</button></div>` : ''}` : ''}
    ${pagasL.length ? `<div class="pGrp">PAGAS</div>${verPg ? pagasL.map(l => l.ab ? linhaAb(l.ab) : linha(l)).join('')
      : `<div class="btns"><button class="btn" data-onclick="state.parcPagas=true;render()">Ver pagas (${pagasL.length})</button></div>`}` : ''}
  </div>`;
}
// Tocar numa parcela: a próxima pode ser marcada como paga; a última paga pode ser desfeita. Sempre em ordem.
async function tocarParc(id, j){
  const p = db.installments.find(x => x.id === id);
  if (!p) return;
  if (j < p.paid){
    if (j !== p.paid - 1) return tell(`Para desfazer, comece pela última parcela paga (${p.paid}/${p.n}).`);
    if (await ask(`Desfazer o pagamento da parcela ${j + 1}/${p.n}?`, 'Desfazer pagamento')) pagarParc(id, -1);
    return;
  }
  if (j !== p.paid) return tell(`Pague primeiro a parcela ${p.paid + 1}/${p.n}.`);
  if (await ask(`Marcar parcela ${j + 1}/${p.n} como paga?`, 'Marcar como paga')) pagarParc(id, 1);
}
// Pagar (d = 1) ou desfazer (d = −1) a próxima parcela. Só muda o status: a parcela já está nos gastos do mês dela.
function pagarParc(id, d){
  const p = db.installments.find(x => x.id === id);
  if (!p) return;
  const antes = p.paid;
  p.paid = Math.max(0, Math.min(p.n, p.paid + d));
  if (p.paid === antes) return;
  touch(p); save(); render();
  showUndo(d > 0 ? `Parcela ${p.paid}/${p.n} paga` : 'Pagamento desfeito', () => { p.paid = antes; touch(p); save(); render(); });
}
function parcMenu(id){
  pickList('Opções', [['editar', 'Editar'], ['pdf', 'Exportar PDF'], ['excluir', 'Excluir']], null, async v => {
    const p = db.installments.find(x => x.id === id);
    if (!p) return;
    if (v === 'editar') openForm('installments', p);
    else if (v === 'pdf') parcPdf(id);
    else if (v === 'excluir' && await ask(`Excluir "${p.desc}"?\nAs parcelas saem também dos gastos de cada mês.`, 'Excluir', true)){ state.parcDet = ''; removeRec('installments', id); }
  });
}
// Abater (amortização antecipada): valor e o que diminuir, com a prévia do resultado antes de confirmar.
const abat = {id:'', modo:'prazo'};
function openAbater(id){
  const p = db.installments.find(x => x.id === id);
  if (!p) return;
  settingsOpen = false; F = null; abat.id = id;
  showSheet(`<h3>Abater</h3>
    <div class="hint" style="margin-top:0">${esc(p.desc)} · saldo devedor hoje ${fmt(saldoDevedor(p))}${p.taxa ? ' (aproximado)' : ''}.</div>
    <label for="abV">Valor do abatimento</label>
    <div class="bigVal out"><span>R$</span><input id="abV" type="text" inputmode="numeric" placeholder="0,00" autocomplete="off" data-oninput="this.value=centsMask(this.value);drawAbater()"></div>
    <label>O que diminuir</label><div class="optPick" id="abModo"></div>
    <div class="hint" id="abOut"></div>
    <div class="btns foot"><button class="btn" data-onclick="closeForm()">Cancelar</button><button class="btn primary" data-onclick="confirmarAbater()">Abater</button></div>`);
  drawAbater();
}
function drawAbater(){
  const p = db.installments.find(x => x.id === abat.id), A = parseMoney(document.getElementById('abV').value) || 0;
  document.getElementById('abModo').innerHTML = [['prazo', 'Reduzir o prazo'], ['parcela', 'Reduzir o valor da parcela']].map(([k, t]) =>
    `<button type="button" class="${abat.modo === k ? 'on' : ''}" data-onclick="abat.modo='${k}';drawAbater()">${t}</button>`).join('');
  const S = saldoDevedor(p), c = A > 0 && A < S - .005 && abaterCalc(p, A, abat.modo);
  document.getElementById('abOut').textContent = !A ? 'Digite o valor que você vai pagar a mais.' : !c ? `O abatimento precisa ser menor que o saldo devedor (${fmt(S)}). Para quitar, marque as parcelas restantes como pagas.`
    : `Novo saldo: ${fmt(c.saldo)} · parcelas restantes: ${c.r} · parcela: ${fmt(c.parc)} (valores aproximados)`;
}
function confirmarAbater(){
  const p = db.installments.find(x => x.id === abat.id), A = parseMoney(document.getElementById('abV').value) || 0;
  if (!p || !(A > 0) || A >= saldoDevedor(p) - .005) return drawAbater();
  const antes = JSON.stringify(db);
  abater(p, A, abat.modo, now.toLocaleDateString('sv'));
  save(); closeForm(); render();
  showUndo('Abatimento registrado', () => restoreSnap(antes));
}
// PDF de um parcelamento: pela tela de impressão (no Android, "Salvar como PDF"), como o relatório do mês.
function parcPdf(id){
  const p = db.installments.find(x => x.id === id);
  if (!p) return;
  const c = CAT_GASTO[p.cat] || CAT_GASTO.outros, linhas = parcLinhas(p), fin = isFin(p);
  const table = (head, rows) => `<table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
  const sit = {paga:'paga', vencida:'vencida', avencer:'a vencer'};
  const dados = [['Tipo', fin ? PARC_TIPOS[p.tipo] : 'Compra parcelada'], fin && ['Credor', esc(p.credor || '')], fin && ['Conta de débito', esc(p.conta || '')],
    !fin && ['Banco / pagamento', [p.bank && esc(p.bank), PAY[p.pay]].filter(Boolean).join(' · ')], ['Categoria', esc(c[1])], ['Parcelas', `${p.n} (${Math.min(p.paid, p.n)} pagas)`],
    ['Valor da próxima parcela', p.paid < p.n ? fmt(parcVal(p, p.paid)) : 'quitado'], p.taxa && ['Taxa de juros', String(p.taxa).replace('.', ',') + '% ao mês'],
    ['Primeira e última parcela', `${monthName(p.start)} a ${monthName(addMonths(p.start, p.n - 1))}`], p.due && ['Dia do vencimento', 'dia ' + p.due]].filter(Boolean);
  const pg = linhas.filter(l => l.st === 'paga'), av = linhas.filter(l => l.st !== 'paga');
  document.getElementById('report').innerHTML = `
    <div class="capa"><h1>${esc(p.desc)}</h1><small>Cofrim${myName() ? ' · ' + esc(myName()) : ''} · gerado em ${now.toLocaleDateString('pt-BR')}</small></div>
    <div class="boxes"><div class="out"><small>Saldo devedor${p.taxa ? ' (aproximado)' : ''}</small><b>${fmt(saldoDevedor(p))}</b></div><div class="in"><small>Já pago</small><b>${fmt(parcPago(p) + abatido(p))}</b></div><div><small>Parcelas restantes</small><b>${p.n - Math.min(p.paid, p.n)}</b></div></div>
    <h2>Dados</h2>${table(['', ''], dados)}
    <h2>Parcelas a vencer</h2>${av.length ? table(['Parcela', 'Vencimento', 'Situação', 'Valor'], av.map(l => [`${l.j + 1}/${p.n}`, vencTxt(l.v), sit[l.st], fmt(l.val)])) : '<small>Nenhuma.</small>'}
    <h2>Parcelas pagas</h2>${pg.length ? table(['Parcela', 'Vencimento', 'Valor'], pg.map(l => [`${l.j + 1}/${p.n}`, vencTxt(l.v), fmt(l.val)])) : '<small>Nenhuma.</small>'}
    ${p.ab ? `<h2>Abatimentos</h2>${table(['Data', 'Efeito', 'Valor'], p.ab.map(a => [fmtDate(a.d), a.modo === 'parcela' ? 'reduziu a parcela' : 'reduziu o prazo', fmt(a.v)]))}` : ''}
    <div class="rodape">Gerado pelo app Cofrim${p.taxa ? '. Saldo devedor calculado pela tabela Price; o valor oficial é o informado pelo banco.' : ''}</div>`;
  const name = 'parcelas-' + plain(p.desc).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (window.Android && Android.imprimir) Android.imprimir(name); else window.print();
}

function viewInvest(){
  const vs = db.investments, hoje = sum(vs, v => v.value), fut = sum(vs, projection), r = db.rates;
  // Evolução: últimos 12 meses do histórico (db.netLog), com o mês atual ao vivo.
  const hist = [...Array(12)].map((_,i) => addMonths(curYM, i - 11)).map(m => [m, m === curYM ? hoje : db.netLog[m]]);
  const known = hist.filter(h => h[1] != null), hmax = Math.max(1, ...known.map(h => h[1]));
  const B = {
  total: () => `<div class="hero"><small>Total investido hoje</small>${bigNum(hoje)}
    <div class="row"><div><small>Projeção em 12 meses</small><b>${fmt(fut)}</b></div><div><small>Aportes do ano</small><b>${fmt(sum(vs, v => (v.monthly||0)*12))}</b></div></div></div>`,
  evolucao: () => vs.length ? `<div class="card"><b>Evolução do total investido</b>
    <div class="chart" style="height:110px">${chartGrid(hmax)}${hist.map(([m, v]) => `<div class="col" style="cursor:default"><div class="bars"><i style="height:${v == null ? 0 : v/hmax*100}%;width:70%;max-width:16px;background:${v == null ? 'transparent' : 'linear-gradient(var(--brand),var(--brand2))'}"></i></div><small>${MESES[+m.slice(5)-1].slice(0,3)}</small></div>`).join('')}</div>
    <div class="hint">${known.length > 1 ? `De ${fmt(known[0][1])} em ${monthName(known[0][0])} para ${fmt(hoje)} hoje.` : 'O histórico começa neste mês e ganha uma barra a cada mês de uso.'}</div></div>` : '',
  metas: () => `<h2>Metas <button data-onclick="openForm('goals')">+ Nova meta</button></h2>
  ${db.goals.length ? db.goals.map(g => { const pct = Math.min(100, g.saved / g.target * 100), left = Math.max(0, g.target - g.saved), months = g.date ? monthDiff(g.date, curYM) : 0; return `
    <div class="card">
      <div class="item" data-onclick="edit('goals','${g.id}')">${tile('target')}<div class="mid"><b>${esc(g.name)}</b>
        <small>${g.date ? 'até ' + monthName(g.date) : 'sem prazo'}${bySmall(g)}</small></div><div class="val">${Math.round(pct)}%</div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="grid3"><div class="stat"><small>Guardado</small><b class="in" style="font-size:14px">${fmt(g.saved)}</b></div>
        <div class="stat"><small>Meta</small><b style="font-size:14px">${fmt(g.target)}</b></div>
        <div class="stat"><small>Falta</small><b style="font-size:14px">${fmt(left)}</b></div></div>
      ${left <= 0 ? `<div class="hint in">${I('checked', 15)} Meta alcançada</div>` : g.date ? `<div class="hint">${months > 0 ? `Guardando ${fmt(left / months)} por mês você chega lá no prazo (${months} ${months > 1 ? 'meses' : 'mês'}).` : 'O prazo desta meta já chegou.'}</div>` : ''}
      <div class="btns"><button class="btn primary" data-onclick="openForm('goalAdd', null, {id:'${g.id}'})">+ Guardar dinheiro</button></div>
    </div>`; }).join('') : '<div class="hint" style="margin:0 4px 12px">Crie uma meta (viagem, reserva de emergência…) e acompanhe quanto falta.</div>'}`,
  carteira: () => `<h2>Meus investimentos ${vs.some(v => v.ticker) ? `<button data-onclick="refreshQuotes(true)">${quoting ? 'Atualizando…' : I('refresh', 14) + 'Atualizar cotações'}</button>` : ''}</h2>
  ${vs.length ? vs.map(v => { const c = CAT_INV[v.cat] || CAT_INV.outros, p = projection(v), ap = (v.monthly||0)*12;
    if (v.ticker){ const cost = v.qty*v.paid, gain = v.value - cost, cls = gain < 0 ? 'out' : 'in', sign = gain < 0 ? '−' : '+';
      const sales = v.sales || [], divs = v.divs || [], realized = sum(sales, s => s.qty * (s.price - s.cost)), divTotal = sum(divs, d => d.value);
      const signed = x => `<b class="${x < 0 ? 'out' : 'in'}">${x < 0 ? '−' : '+'}${fmt(Math.abs(x))}</b>`; return `
    <div class="card">
      <div class="item" style="cursor:default">${ico(c)}<div class="mid"><b>${esc(v.ticker)}</b>
        <small>${esc(v.assetName || c[1])}${v.broker ? ' · ' + esc(v.broker) : ''}</small></div>
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
        <button class="iconbtn" data-onclick="removeLot('${v.id}',${i})" aria-label="Excluir compra">${I('close', 18)}</button></div>`).join('')}
      ${sales.length ? `<label>Vendas (${sales.length})</label>${sales.map(s => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><b style="font-weight:500">${s.qty.toLocaleString('pt-BR',{maximumFractionDigits:8})} × ${fmtQ(s.price)}</b><small>${fmtDate(s.date)} · custo médio ${fmtQ(s.cost)}</small></div><div class="val">${signed(s.qty * (s.price - s.cost))}</div></div>`).join('')}` : ''}
      ${divs.length ? `<label>Proventos (${divs.length})</label>${divs.map(d => `<div class="item" style="cursor:default;padding:6px 0"><div class="mid"><small>${fmtDate(d.date)}</small></div><div class="val in">+${fmt(d.value)}</div></div>`).join('')}` : ''}
      ${sales.length || divs.length ? `<div class="grid3" style="margin-top:12px">
        <div class="stat"><small>Lucro das vendas</small>${signed(realized)}</div>
        <div class="stat"><small>Proventos</small>${signed(divTotal)}</div>
        <div class="stat"><small>Retorno total</small>${signed(gain + realized + divTotal)}</div></div>` : ''}
      <div class="btns"><button class="btn primary" data-onclick="buyMore('${v.id}')">${I('plus', 16)}Nova compra</button><button class="btn" data-onclick="sellAsset('${v.id}')" ${v.qty > 0 ? '' : 'disabled style="opacity:.4"'}>Vender</button></div>
      <div class="btns"><button class="btn" data-onclick="openDiv('${v.id}')">${I('coins', 16)}Registrar provento</button><button class="btn danger" data-onclick="removeRec('investments','${v.id}')">Excluir</button></div>
      <div class="btns"><button class="btn" data-onclick="openForm('priceAlert', db.investments.find(x => x.id === '${v.id}'))">${I('alert', 16)}Alerta de preço</button></div>
      <div class="hint">Cotação de ${new Date(v.quoteAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</div>
    </div>`; }
    return `
    <div class="card">
      <div class="item" data-onclick="edit('investments','${v.id}')">${ico(c)}<div class="mid"><b>${esc(v.name)}</b>
        <small>${esc(c[1])}${v.broker ? ' · ' + esc(v.broker) : ''} · ${rateLabel(v)}${bySmall(v)}</small></div>
        <div class="val muted">≈ ${(annualRate(v)*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}% a.a.</div></div>
      <div class="grid3" style="margin-top:12px">
        <div class="stat"><small>Hoje</small><b style="font-size:14px">${fmt(v.value)}</b></div>
        <div class="stat"><small>Em 12 meses</small><b style="font-size:14px">${fmt(p)}</b></div>
        <div class="stat"><small>Rendimento</small><b class="in" style="font-size:14px">+${fmt(p - v.value - ap)}</b></div>
      </div>
      <div class="btns"><button class="btn primary" data-onclick="openForm('invAdd', null, {id:'${v.id}'})">${I('plus', 16)}Fazer um aporte</button></div>
      <div class="hint">O valor é atualizado sozinho a cada virada de mês com o rendimento${v.monthly ? ` e o aporte mensal de ${fmt(v.monthly)}` : ''}.</div>
    </div>`; }).join('')
  : empty('trend','Cadastre seus investimentos para ver<br>quanto você terá daqui a um ano.')}`,
  taxas: () => `<div class="hint" style="text-align:center;padding:0 10px">Projeção bruta (sem IR), com as taxas: CDI ${r.cdi}% · Selic ${r.selic}% · IPCA ${r.ipca}% a.a. (${ratesInfo()}).
    <a href="#" data-onclick="openRates();return false" style="color:var(--brand)">Ver taxas</a>
    ${vs.some(v => v.ticker) ? '<br>Ações e moedas entram pelo valor atual, sem projeção. As cotações podem ter alguns minutos de atraso.' : ''}</div>`
  };
  return head('Investimentos', 'invest') + blocks('invest', B)
    + (vs.length ? `<div class="btns" style="margin-bottom:12px"><button class="btn danger" style="flex:1" data-onclick="openApagar('invest')">${I('trash')}Apagar investimentos por dia, mês ou ano</button></div>` : '');
}
function openDiv(id){ const v = db.investments.find(x => x.id === id); openForm('div', null, {id, title:'Provento de ' + v.ticker}); }
function buyMore(id){
  const v = db.investments.find(x => x.id === id);
  openForm('investments', null, {title:'Nova compra de ' + v.ticker, vals:{cat:v.cat, ticker:v.ticker, paid:String(v.quote).replace('.', ','), broker:v.broker || ''}, asset:{code:v.ticker, name:v.assetName, quote:v.quote}});
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
  if (window.Android && Android.get) return espera(new Promise((res, rej) => { const id = ++driveSeq; drivePending[id] = r => r.status === 200 ? res(r.text) : rej(r); Android.get(id, url); }));
  return espera(fetch(location.hostname === 'localhost' ? '/proxy?u=' + encodeURIComponent(url) : url)).then(r => { if (!r.ok) throw r; return r.text(); });
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
  <div class="btns" style="margin:0 0 12px">${Object.entries(NEWS).map(([k,n]) => `<button class="btn ${newsTab === k ? 'primary' : ''}" data-onclick="newsTab='${k}';render();scrollTo(0,0)">${n.label}</button>`).join('')}</div>
  ${newsTab === 'rec' ? '<div class="hint" style="margin:0 4px 12px">Matérias e análises publicadas por sites de notícias. Não são uma recomendação deste app: avalie seu perfil e seus objetivos antes de investir.</div>' : ''}
  ${items.length ? `${top < 0 ? '' : `<div class="newsHero" data-onclick="openNews(${top})">
      <img src="${esc(items[top].img.replace('w=160&h=160', 'w=640&h=360'))}" alt="" referrerpolicy="no-referrer" data-onerror="this.remove()">
      <div><span class="src">${esc(items[top].source || 'Destaque')}</span><b>${esc(items[top].title)}</b><small>${ago(items[top].date)}</small></div></div>`}
    <div class="card news">${items.map((n,i) => i === top ? '' : `<div class="item" data-onclick="openNews(${i})">
      ${n.img ? `<img class="thumb" src="${esc(n.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-onerror="this.outerHTML=newsPh(this.dataset.s)" data-s="${esc(n.source)}">` : newsPh(n.source)}
      <div class="mid"><b>${esc(n.title)}</b><span class="src">${esc(n.source || 'Notícia')}</span> <small>${ago(n.date)}</small></div></div>`).join('')}</div>`
  : newsLoading[newsTab] ? skel(4) : empty('signal','Não foi possível carregar as notícias.<br>Verifique a internet e toque em Atualizar.')}
  <div class="btns" style="margin-bottom:12px"><button class="btn" data-onclick="loadNews(newsTab,true);render()">${newsLoading[newsTab] ? 'Atualizando…' : I('refresh') + 'Atualizar'}</button></div>
  ${c && c.err && items.length ? '<div class="hint" style="text-align:center">Sem conexão: mostrando as últimas notícias salvas.</div>' : ''}`;
}

