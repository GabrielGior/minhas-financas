// Minhas Finanças — Formulários, seletores, confirmações e comprovantes.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, config.js, inicio.js.
// ---------- Formulários ----------
// Cada formulário: fields (lista ou função que devolve a lista), e opcionalmente defaults, load (ajusta os
// valores ao abrir), onChange, hint, check (valida; devolve mensagem de erro) e commit (grava; sem ele,
// o registro é criado/alterado em db[col]).
const opts = cats => Object.entries(cats).filter(([,c]) => !c[3]).map(([k,c]) => [k, c[1]]); // sem as escondidas
const dayOk = (v, k, name) => v[k] !== '' && (v[k] < 1 || v[k] > 31) ? name + ' deve ser de 1 a 31.' : '';
// Ganhos e gastos fixos: ao editar, a alteração pode valer só a partir de um mês. Nesse caso o registro antigo
// é encerrado no mês anterior e nasce um novo a partir dali, de modo que os meses passados ficam como estavam.
const wasMonthly = () => F && F.id && (db[F.col].find(x => x.id === F.id) || {}).fixed === true;
const SCOPE_FIELDS = [
  {k:'scope', label:'Aplicar a alteração', type:'select', optional:true, showIf:v => wasMonthly() && v.fixed === '1',
    options:[['from','Só a partir de um mês (mantém o histórico)'],['all','Em todos os meses, inclusive os passados']]},
  {k:'from', label:'Vale a partir de', type:'month', showIf:v => wasMonthly() && v.fixed === '1' && v.scope === 'from'}];
const commitRecurring = col => (v, id, newId) => {
  const {scope, from, ...rec} = v;
  if (!id) return void db[col].push(touch({id:newId, ...rec}));
  const old = db[col].find(x => x.id === id);
  if (scope === 'from' && old.fixed === true && rec.fixed === true && from > old.start && (!old.end || from <= old.end)){
    const pm = old.pm || [];
    db[col].push(touch({...old, ...rec, id:uid(), start:from, pm:pm.filter(m => m >= from)}));
    Object.assign(touch(old), {end:addMonths(from, -1), pm:pm.filter(m => m < from)});
  } else Object.assign(touch(old), rec);
};
// Campos de venda/provento: lançar nos Ganhos e em qual conta o dinheiro cai.
const CASH_FIELDS = label => [
  {k:'toIncome', label, type:'select', optional:true, options:[['1','Sim'],['','Não']]},
  {k:'account', label:'Conta que recebe o dinheiro (opcional)', type:'select', optional:true, options:() => [['', 'Não informar'], ...db.accounts.map(a => [a.name, a.name])]}];
function catDefaults(v){
  const last = db.expenses.filter(x => x.cat === v.cat && (x.bank || x.pay)).sort((a, b) => (b.u || 0) - (a.u || 0))[0];
  v.bank = last ? last.bank || '' : ''; v.pay = last ? last.pay || '' : '';
  return v;
}
// Gastos avulsos lançados pelo menos duas vezes com a mesma descrição e categoria, dos mais frequentes para os menos.
function frequent(){
  const g = {};
  for (const x of db.expenses){ if (x.fixed || !x.desc) continue; const k = plain(x.desc) + '|' + x.cat; (g[k] = g[k] || []).push(x); }
  const novo = a => Math.max(...a.map(x => x.u || 0));
  return Object.values(g).filter(a => a.length >= 2).sort((a, b) => b.length - a.length || novo(b) - novo(a)).slice(0, 6)
    .map(a => ({...a.sort((x, y) => (y.u || 0) - (x.u || 0))[0], same:a.every(x => x.value === a[0].value)}));
}
function repeatFill(i){
  const x = F.freq[i];
  Object.assign(F.vals, {desc:x.desc, cat:x.cat, bank:x.bank || '', pay:x.pay || ''}, x.same ? {value:moneyStr(x.value)} : {});
  Object.assign(F.touched, {desc:true, cat:true, bank:true, pay:true});
  syncForm();
  document.getElementById('f_value').focus();
}
const FORMS = {
  // Campos com more:true ficam atrás de "Mais opções" num lançamento novo (lançamento rápido); big = valor em destaque.
  incomes: { title:'ganho', defaults:() => ({cat:'salario', fixed:'1', start:curYM}), fields:[
    {k:'value', label:'Valor', type:'money', big:true},
    {k:'cat', label:'Categoria', type:'select', options:() => opts(CAT_GANHO)},
    {k:'desc', label:'Descrição (opcional)', type:'text', ph:'Ex.: Salário', optional:true},
    {k:'fixed', label:'Tipo', type:'select', options:[['1','Fixo — repete todo mês'],['y','Anual — uma vez por ano (13º, bônus…)'],['','Avulso — só em um mês']]},
    {k:'bank', label:'Conta onde cai (opcional)', type:'text', ph:'Ex.: Nubank', optional:true, sug:bankSuggestions, more:true},
    {k:'day', label:'Dia em que cai (opcional)', type:'int', optional:true, more:true},
    {k:'start', label:v => v.fixed === 'y' ? 'Mês em que recebe (repete todo ano)' : v.fixed ? 'A partir de' : 'Mês', type:'month', more:true},
    {k:'end', label:'Até (opcional)', type:'month', optional:true, showIf:v => v.fixed, more:true},
    ...SCOPE_FIELDS],
    load(v){ v.scope = 'from'; v.from = curYM; },
    summary:v => [v.bank, v.day && 'dia ' + v.day, v.start && v.start !== curYM && cap(monthName(v.start))].filter(Boolean).join(' · '),
    check(v){ if (!v.desc) v.desc = (CAT_GANHO[v.cat] || [0, 'Ganho'])[1]; return dayOk(v, 'day', 'O dia'); },
    commit:commitRecurring('incomes')},
  expenses: { title:'gasto', defaults:() => catDefaults({cat:'alimentacao', fixed:'', start:state.month}), fields:[
    {k:'value', label:'Valor', type:'money', big:true},
    {k:'cat', label:'Categoria', type:'select', options:() => opts(CAT_GASTO).filter(o => o[0] !== 'emprestimo')},
    {k:'desc', label:'Descrição (opcional)', type:'text', ph:'Ex.: Mercado', optional:true},
    ...WHERE_FIELDS().map(f => ({...f, more:true})),
    {k:'tags', label:'Etiquetas (opcional, separadas por vírgula)', type:'text', ph:'Ex.: viagem SP', optional:true, more:true, sug:() => [...new Set(db.expenses.flatMap(tagsOf))]},
    {k:'who', label:'Dividir com (nome da pessoa, opcional)', type:'text', ph:'Ex.: Ana', optional:true, more:true, sug:() => [...new Set(db.expenses.map(x => x.who).filter(Boolean))]},
    {k:'share', label:v => v.fixed ? 'Parte que a outra pessoa te paga a cada vez' : 'Parte que a outra pessoa vai te pagar', type:'money', showIf:v => v.who, more:true},
    {k:'fixed', label:'Tipo', type:'select', more:true, options:[['','Só neste mês'],['1','Fixo — repete todo mês (aluguel, internet…)'],['y','Anual — uma vez por ano (IPVA, seguro…)']]},
    {k:'sub', label:'É uma assinatura?', type:'select', optional:true, more:true, showIf:v => v.fixed === '1', options:[['','Automático, pelo nome (Netflix, Spotify, academia…)'],['1','Sim, mostrar em Assinaturas'],['0','Não, é uma conta fixa']]},
    {k:'start', label:v => v.fixed === 'y' ? 'Mês em que paga (repete todo ano)' : v.fixed ? 'A partir de' : 'Mês', type:'month', more:true},
    {k:'day', label:'Dia da compra (opcional, usado na fatura do cartão)', type:'int', optional:true, showIf:v => !v.fixed, more:true},
    {k:'due', label:'Dia do vencimento (opcional, para lembretes)', type:'int', optional:true, showIf:v => v.fixed, more:true},
    {k:'end', label:'Até (opcional)', type:'month', optional:true, showIf:v => v.fixed, more:true},
    ...SCOPE_FIELDS],
    load(v){ v.scope = 'from'; v.from = state.month; },
    // Repetir um gasto: os avulsos mais frequentes viram botões no topo do formulário novo.
    top(){ F.freq = frequent(); return F.freq.length ? `<label>Repetir um gasto</label><div class="chips rep">${F.freq.map((x, i) => `<button type="button" onclick="repeatFill(${i})">${esc(x.desc)}</button>`).join('')}</div>` : ''; },
    // Ao trocar a categoria num gasto novo, banco e forma de pagamento vêm do último gasto dessa categoria.
    onChange(k, v, isNew, touched){ if (isNew && k === 'cat' && !touched.bank && !touched.pay) catDefaults(v); },
    summary:v => [v.bank, PAY[v.pay], ...tagsOf(v).map(t => '#' + t), v.who && 'dividido com ' + v.who, v.fixed === 'y' ? 'anual' : v.fixed ? 'fixo' : '', v.start && v.start !== curYM && cap(monthName(v.start))].filter(Boolean).join(' · '),
    check(v){
      if (!v.desc) v.desc = (CAT_GASTO[v.cat] || [0, 'Gasto'])[1];
      if (v.who && v.share >= v.value) return 'A parte da outra pessoa precisa ser menor que o valor total.';
      if (!v.who) v.share = '';
      db.catMemo[plain(v.desc)] = v.cat; // lembra a categoria desta descrição para a importação de extratos
      return dayOk(v, 'day', 'O dia da compra') || dayOk(v, 'due', 'O dia do vencimento');
    },
    commit:commitRecurring('expenses'),
    before:() => photoSection()},
  installments: { title:'compra parcelada', fem:true, defaults:() => ({cat:'compras', pay:'credito', mode:'total', n:'', paid:'0', start:curYM}), fields:[
    {k:'desc', label:'Descrição', type:'text', ph:'Ex.: Celular'},
    {k:'cat', label:'Categoria', type:'select', options:() => opts(CAT_GASTO)},
    ...WHERE_FIELDS(),
    {k:'n', label:'Número de parcelas', type:'int'},
    {k:'mode', label:'Informar', type:'select', options:[['total','Valor total da compra'],['parcela','Valor de cada parcela']]},
    {k:'total', label:v => v.mode === 'parcela' ? 'Valor da parcela' : 'Valor total da compra', type:'money'},
    {k:'paid', label:'Parcelas já pagas', type:'int', zero:true},
    {k:'start', label:'Mês da 1ª parcela', type:'month'}],
    // Em compra nova, deduz o mês da 1ª parcela a partir de quantas já foram pagas.
    onChange(k, v, isNew, touched){ if (isNew && k === 'paid' && !touched.start) v.start = addMonths(curYM, -(parseInt(v.paid)||0)); },
    // O campo "total" guarda o valor digitado; no modo "parcela" ele é o valor de uma parcela.
    load(v, item){ v.mode = item.mode || 'total'; if (v.mode === 'parcela') v.total = moneyStr(item.total/item.n); },
    hint:v => { const n = parseInt(v.n), p = parseInt(v.paid)||0, x = parseMoney(v.total), t = v.mode === 'parcela' ? x*n : x;
      return t > 0 && n > 0 ? `Total ${fmt(t)} · ${n}x de ${fmt(t/n)} · pago ${fmt(t/n*Math.min(p,n))} · falta ${fmt(t/n*Math.max(n-p,0))}` : ''; },
    check(v){ if (v.paid > v.n) return 'As parcelas pagas não podem passar do total de parcelas.';
      if (v.mode === 'parcela') v.total = round2(v.total*v.n); }},
  // Dois formulários em um: categorias com cotação (QUOTE_SRC) registram uma compra (ativo, quantidade, preço);
  // as demais pedem valor e taxa de rendimento.
  investments: { title:'investimento', defaults:() => ({cat:'rendafixa', index:'cdi', pct:'100', date:now.toLocaleDateString('sv')}), fields:[
    {k:'cat', label:'Categoria', type:'select', options:opts(CAT_INV)},
    {k:'name', label:'Nome', type:'text', ph:'Ex.: CDB Banco X', showIf:v => !QUOTE_SRC[v.cat]},
    {k:'ticker', label:v => QUOTE_SRC[v.cat] === 'b3' ? 'Ativo — pesquise por código ou nome' : 'Moeda — pesquise por código ou nome', type:'asset', ph:'Pesquisar…', showIf:v => QUOTE_SRC[v.cat]},
    {k:'qty', label:'Quantidade comprada', type:'num', showIf:v => QUOTE_SRC[v.cat]},
    {k:'paid', label:'Preço pago por unidade (R$)', type:'num', showIf:v => QUOTE_SRC[v.cat]},
    {k:'date', label:'Data da compra', type:'date', showIf:v => QUOTE_SRC[v.cat]},
    {k:'value', label:'Valor investido hoje', type:'money', showIf:v => !QUOTE_SRC[v.cat]},
    {k:'index', label:'Rendimento atrelado a', type:'select', options:Object.entries(INDEX), showIf:v => !QUOTE_SRC[v.cat]},
    {k:'pct', label:v => v.index === 'ipca' ? 'Taxa acima do IPCA (% a.a.)' : v.index === 'pre' ? 'Taxa (% a.a.)' : '% do ' + INDEX[v.index], type:'num', zero:true, showIf:v => !QUOTE_SRC[v.cat]},
    {k:'monthly', label:'Aporte mensal (opcional)', type:'money', optional:true, showIf:v => !QUOTE_SRC[v.cat]}],
    onChange(k, v){
      if (k === 'cat'){ v.ticker = ''; F.asset = null; if (!v.index) v.index = 'cdi'; if (QUOTE_SRC[v.cat]) searchAssets(''); }
      if (k === 'ticker') searchAssets(v.ticker);
    },
    hint:v => {
      if (QUOTE_SRC[v.cat]){
        const q = parseMoney(v.qty), p = parseMoney(v.paid), a = F && F.asset;
        return q > 0 && p > 0 ? `Investido ${fmt(q*p)}` + (a ? ` · vale hoje ${fmt(q*a.quote)}` : '') : '';
      }
      const val = parseMoney(v.value), pct = parseMoney(v.pct);
      return val > 0 && !isNaN(pct) ? 'Em 12 meses: ' + fmt(projection({value:val, index:v.index, pct, monthly:parseMoney(v.monthly)||0})) : '';
    },
    check(v){ if (QUOTE_SRC[v.cat] && (!F.asset || F.asset.code !== v.ticker)) return 'Escolha o ativo na lista de resultados.'; },
    commit(v, id){
      if (!QUOTE_SRC[v.cat]){ // renda fixa e afins: um registro por investimento
        const rec = {name:v.name, cat:v.cat, value:v.value, index:v.index, pct:v.pct, monthly:v.monthly};
        if (id) Object.assign(touch(db.investments.find(x => x.id === id)), rec, {ticker:'', lots:undefined});
        else db.investments.push(touch({id:uid(), accYM:curYM, ...rec}));
        return;
      }
      // Ação/moeda: a compra entra no registro do ativo, criando-o se for a primeira.
      const a = F.asset;
      let inv = db.investments.find(x => x.ticker === a.code && x.cat === v.cat);
      if (!inv) db.investments.push(inv = {id:uid(), cat:v.cat, ticker:a.code, name:a.code, assetName:a.name, lots:[], index:'pre', pct:0, monthly:0});
      inv.lots.push({qty:v.qty, paid:v.paid, date:v.date});
      inv.quote = a.quote; inv.quoteAt = Date.now();
      recalc(inv); touch(inv);
    }},
  // Venda de ação/moeda: sai das compras mais antigas primeiro e guarda o lucro realizado (preço − custo).
  sell: { noDelete:true, fields:[
    {k:'qty', label:'Quantidade vendida', type:'num'},
    {k:'price', label:'Preço de venda por unidade (R$)', type:'num'},
    {k:'date', label:'Data da venda', type:'date'},
    ...CASH_FIELDS('Lançar o lucro nos Ganhos')],
    hint:v => { const inv = F && db.investments.find(x => x.id === F.id), q = parseMoney(v.qty), p = parseMoney(v.price);
      return inv && q > 0 && p > 0 ? `Você tem ${inv.qty.toLocaleString('pt-BR', {maximumFractionDigits:8})}. Venda de ${fmt(q*p)}, resultado aproximado de ${fmt(q * (p - inv.paid))}.` : inv ? `Você tem ${inv.qty.toLocaleString('pt-BR', {maximumFractionDigits:8})}.` : ''; },
    check(v){ if (v.qty > db.investments.find(x => x.id === F.id).qty + 1e-9) return 'Você não tem essa quantidade para vender.'; },
    commit(v, id){
      const inv = db.investments.find(x => x.id === id);
      let left = v.qty, cost = 0;
      while (left > 1e-9 && inv.lots.length){
        const lot = inv.lots[0], take = Math.min(lot.qty, left);
        cost += take * lot.paid; lot.qty -= take; left -= take;
        if (lot.qty <= 1e-9) inv.lots.shift();
      }
      (inv.sales = inv.sales || []).push({qty:v.qty, price:v.price, date:v.date, cost:cost / v.qty});
      recalc(inv); touch(inv);
      // Ganho = só o lucro (o resto é o seu próprio dinheiro voltando); a conta recebe o valor inteiro da venda.
      const profit = round2(v.qty * v.price - cost), ym = v.date.slice(0, 7), day = +v.date.slice(8);
      if (v.toIncome && profit > 0) db.incomes.push(touch({id:uid(), desc:'Lucro na venda de ' + inv.ticker, value:profit, cat:'rendimentos', fixed:false, start:ym, end:'', bank:'', day}));
      if (v.account) db.transfers.push(touch({id:uid(), from:'Investimentos', to:v.account, value:round2(v.qty * v.price), month:ym, day}));
    }},
  div: { noDelete:true, defaults:() => ({date:now.toLocaleDateString('sv'), toIncome:'1'}), fields:[
    {k:'value', label:'Valor recebido (dividendos, JCP, rendimentos)', type:'money'},
    {k:'date', label:'Data do recebimento', type:'date'},
    ...CASH_FIELDS('Lançar nos Ganhos')],
    commit(v, id){
      const inv = db.investments.find(x => x.id === id);
      (inv.divs = inv.divs || []).push({value:v.value, date:v.date}); touch(inv);
      const ym = v.date.slice(0, 7), day = +v.date.slice(8);
      if (v.toIncome) db.incomes.push(touch({id:uid(), desc:'Proventos de ' + inv.ticker, value:v.value, cat:'rendimentos', fixed:false, start:ym, end:'', bank:v.account, day}));
      else if (v.account) db.transfers.push(touch({id:uid(), from:'Investimentos', to:v.account, value:v.value, month:ym, day}));
    }},
  accounts: { fullTitle:'Conta bancária', defaults:() => ({initial:'0,00', since:curYM}), fields:[
    {k:'name', label:'Nome do banco ou da conta', type:'text', ph:'Ex.: Nubank', sug:bankSuggestions},
    {k:'initial', label:'Saldo no início do mês abaixo', type:'money', zero:true},
    {k:'since', label:'Acompanhar o saldo a partir de', type:'month'}],
    extra:() => '<div class="hint">O saldo soma os ganhos e desconta os gastos em que o campo de banco/conta tiver exatamente este nome. Lançamentos com dia depois de hoje ainda não contam, e compras no crédito só saem quando a fatura é paga (configure em Gastos → Faturas do cartão).</div>'},
  transfers: { fullTitle:'Transferência entre contas', defaults:() => ({month:curYM, from:(db.accounts[0] || {}).name, to:(db.accounts[1] || {}).name}),
    // Além das contas, a lista traz nomes já usados em transferências (ex.: "Investimentos", de vendas e proventos).
    fields:() => { const o = [...new Set([...db.accounts.map(a => a.name), ...db.transfers.flatMap(t => [t.from, t.to])])].map(n => [n, n]); return [
      {k:'from', label:'Sai de', type:'select', options:o},
      {k:'to', label:'Entra em', type:'select', options:o},
      {k:'value', label:'Valor', type:'money'},
      {k:'month', label:'Mês', type:'month'},
      {k:'day', label:'Dia (opcional)', type:'int', optional:true}]; },
    check:v => v.from === v.to ? 'Escolha duas contas diferentes.' : dayOk(v, 'day', 'O dia')},
  goals: { title:'meta', fem:true, defaults:() => ({saved:'0,00'}), fields:[
    {k:'name', label:'Nome da meta', type:'text', ph:'Ex.: Viagem, reserva de emergência'},
    {k:'target', label:'Valor da meta', type:'money'},
    {k:'saved', label:'Quanto já tem guardado', type:'money', zero:true},
    {k:'date', label:'Prazo (opcional)', type:'month', optional:true}]},
  goalAdd: { fullTitle:'Guardar dinheiro na meta', noDelete:true, fields:[{k:'amount', label:'Valor a guardar agora', type:'money', big:true}],
    commit(v, id){ const g = db.goals.find(x => x.id === id); g.saved = round2(g.saved + v.amount); touch(g); }},
  // Aporte avulso em um investimento de renda fixa (ações e moedas usam "+ Nova compra").
  invAdd: { fullTitle:'Fazer um aporte', noDelete:true, fields:[{k:'amount', label:'Valor do aporte', type:'money', big:true}],
    hint:v => { const inv = F && db.investments.find(x => x.id === F.id), a = parseMoney(v.amount); return inv && a > 0 ? `${inv.name}: de ${fmt(inv.value)} para ${fmt(inv.value + a)}` : ''; },
    commit(v, id){ const inv = db.investments.find(x => x.id === id); inv.value = round2(inv.value + v.amount); touch(inv); }},
  budgets: { fullTitle:'Orçamento mensal por categoria',
    fields:() => Object.entries(CAT_GASTO).map(([k,c]) => ({k, label:c[1] + ' — limite por mês', type:'money', optional:true})),
    commit(v){ db.budgets = Object.fromEntries(Object.entries(v).filter(([,lim]) => lim > 0)); db.cfgMod = Date.now(); },
    extra:() => `<label>O que sobrar do limite passa para o mês seguinte?</label>
      <div class="optPick" id="rollPick"><button type="button" data-v="1" class="${db.prefs.rollBudget ? 'on' : ''}" onclick="setRoll(true)">Sim</button><button type="button" data-v="" class="${db.prefs.rollBudget ? '' : 'on'}" onclick="setRoll(false)">Não</button></div>
      <div class="hint">Com "Sim", se você gastar menos que o limite de uma categoria, a diferença soma ao limite dela no mês seguinte.</div>`},
  // Cartões: para cada banco com compras no crédito, dia de fechamento (b), dia de pagamento (d) e conta que paga (a).
  cardClose: { fullTitle:'Cartões de crédito',
    fields:() => creditBanks().flatMap((b,i) => [
      {k:'b' + i, label:b + ' — dia de fechamento', type:'int', optional:true},
      {k:'d' + i, label:b + ' — dia de pagamento da fatura', type:'int', optional:true},
      {k:'l' + i, label:b + ' — limite do cartão (opcional)', type:'money', optional:true},
      {k:'a' + i, label:b + ' — conta que paga a fatura', type:'select', optional:true, options:[['', 'Conta com o mesmo nome do cartão'], ...db.accounts.map(a => [a.name, a.name])]}]),
    load(v){ creditBanks().forEach((b,i) => { v['b' + i] = String(db.cardClose[b] || ''); v['d' + i] = String(db.cardDue[b] || ''); v['a' + i] = db.cardAcc[b] || ''; v['l' + i] = db.cardLimit[b] ? moneyStr(db.cardLimit[b]) : ''; }); },
    check:v => Object.keys(v).filter(k => k[0] === 'b' || k[0] === 'd').map(k => dayOk(v, k, 'O dia')).find(Boolean),
    commit(v){
      db.cardClose = {}; db.cardDue = {}; db.cardAcc = {}; db.cardLimit = {};
      creditBanks().forEach((b,i) => { if (v['b' + i]) db.cardClose[b] = v['b' + i]; if (v['d' + i]) db.cardDue[b] = v['d' + i]; if (v['a' + i]) db.cardAcc[b] = v['a' + i]; if (v['l' + i]) db.cardLimit[b] = v['l' + i]; });
      db.cfgMod = Date.now();
    },
    extra:() => '<div class="hint">Fechamento: compras avulsas com dia depois dele entram na fatura do mês seguinte. Pagamento: a fatura de um mês sai da conta no mês seguinte, nesse dia (sem dia, no começo do mês).</div>'},
  // Alerta de preço de uma ação ou moeda (id = o investimento). Vazio desliga.
  priceAlert: { fullTitle:'Alerta de preço', noDelete:true, fields:[
    {k:'alertUp', label:'Avisar quando passar de (R$)', type:'num', optional:true},
    {k:'alertDown', label:'Avisar quando cair abaixo de (R$)', type:'num', optional:true}],
    hint:() => { const inv = F && db.investments.find(x => x.id === F.id); return inv ? `${inv.ticker}: cotação atual ${fmtQ(inv.quote)}. Deixe em branco para desligar.` : ''; },
    check:v => v.alertUp && v.alertDown && v.alertDown >= v.alertUp ? 'O valor de baixo precisa ser menor que o de cima.' : '',
    commit(v, id){ const inv = db.investments.find(x => x.id === id); Object.assign(touch(inv), {alertUp:v.alertUp || '', alertDown:v.alertDown || '', alertHit:''}); },
    extra:() => '<div class="hint">Com o app aberto, o preço é conferido a cada atualização das cotações. Com ele fechado, o celular confere mais ou menos de hora em hora e avisa por notificação (precisa das notificações ligadas e de internet). Não é um aviso em tempo real.</div>'},
  // Categoria (id do formulário = "tipo:chave"; chave vazia = categoria nova).
  catEdit: { noDelete:true, fields:[
    {k:'name', label:'Nome', type:'text', ph:'Ex.: Pets'},
    {k:'icon', label:'Ícone', type:'icons'},
    {k:'color', label:'Cor (aparece com a opção "Uma cor por categoria")', type:'colors', optional:true}],
    commit(v, id){
      const [type, key] = id.split(':'), k = key || 'c' + uid();
      db.cats[type][k] = Object.assign(db.cats[type][k] || {}, {name:v.name, icon:v.icon, color:v.color});
      db.cfgMod = Date.now(); applyCats();
    },
    after:() => openCats()},
  rates: { fullTitle:'Taxas de referência', fields:[
    {k:'auto', label:'Atualização', type:'select', optional:true, options:[['1','Automática — pela internet (Banco Central)'],['','Manual — uso os valores abaixo']]},
    {k:'cdi', label:'CDI (% a.a.)', type:'num'}, {k:'selic', label:'Selic (% a.a.)', type:'num'}, {k:'ipca', label:'IPCA (% a.a.)', type:'num'}],
    commit(v){ Object.assign(db.rates, v); },
    extra:() => `<div class="hint">Taxas ${ratesInfo()}.</div>
      <div class="btns"><button class="btn" onclick="updateRatesNow()">${I('refresh')}Atualizar taxas agora</button></div>`}
};
let F = null; // formulário aberto: {col, cfg, fields, id, vals, touched, asset}
let settingsOpen = false;

function addNew(){ const col = {ganhos:'incomes', gastos:state.gsub === 'parc' ? 'installments' : 'expenses', invest:'investments'}[state.tab]; if (col) openForm(col); }
const ARCH_MSG = 'Este lançamento está no arquivo de anos antigos e não pode ser editado. Para editar, traga os anos de volta em Configurações > Dados e ajustes.';
function edit(col, id){
  event.stopPropagation();
  if (Date.now() - swipedAt < 400) return;
  const r = db[col].find(x => x.id === id);
  if (!r) return tell(ARCH_MSG);
  openForm(col, r);
}
function openRates(){ openForm('rates', db.rates); }
let sheetKey = ''; // título da folha aberta: redesenhar a mesma folha mantém a rolagem; abrir outra volta ao topo
function showSheet(html){
  const sheet = document.getElementById('sheet'), key = html.slice(0, html.indexOf('</h3>')), same = sheet.classList.contains('open') && key === sheetKey;
  const top = sheet.scrollTop;
  sheet.innerHTML = html;
  sheet.scrollTop = same ? top : 0;
  sheetKey = key;
  sheet.classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden'; // a tela de trás não rola enquanto a folha está aberta
  a11y(sheet);
}
// Arrastar a alça (o topo) de uma folha para baixo fecha a folha.
let drag = null;
document.addEventListener('touchstart', e => {
  const el = e.target.closest ? e.target.closest('.sheet.open') : null;
  drag = el && el.scrollTop <= 0 && e.touches[0].clientY - el.getBoundingClientRect().top < 64 ? {el, y:e.touches[0].clientY, dy:0} : null;
}, {passive:true});
document.addEventListener('touchmove', e => {
  if (!drag) return;
  drag.dy = e.touches[0].clientY - drag.y;
  if (drag.dy < 0){ drag.el.style.transform = ''; drag.el.style.transition = ''; return void (drag = null); }
  drag.el.style.transition = 'none'; drag.el.style.transform = `translateY(${drag.dy}px)`;
}, {passive:true});
document.addEventListener('touchend', () => {
  if (!drag) return;
  const d = drag; drag = null;
  d.el.style.transition = ''; d.el.style.transform = '';
  if (d.dy > 110){ if (d.el.id === 'picker') closePicker(); else closeForm(); }
}, {passive:true});

// HTML de um campo. Listas, meses e datas guardam o valor num elemento escondido e mostram um componente do app
// (botões ou um seletor próprio), em vez das janelas do Android.
function fieldHtml(f){
  const id = 'f_' + f.k;
  if (f.type === 'select') return `<select id="${id}" hidden>${(typeof f.options === 'function' ? f.options() : f.options).map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>` +
    (f.k === 'cat' ? '<div class="catPick" id="catPick"></div>' : `<div id="o_${f.k}"></div>`);
  if (f.type === 'icons') return `<input id="${id}" type="hidden"><div class="iconGrid">${Object.entries(ICON_NAMES).map(([k, n]) => `<button type="button" data-i="${k}" aria-label="${n}" title="${n}" onclick="pickIcon('${f.k}','${k}')">${I(k, 23)}</button>`).join('')}</div>`;
  if (f.type === 'colors') return `<input id="${id}" type="hidden"><div class="swatches colorGrid">${CAT_COLORS.map(c => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="Cor ${c}" onclick="setField('${f.k}','${c}')"></button>`).join('')}</div>`;
  if (f.type === 'month' || f.type === 'date') return `<input id="${id}" type="hidden"><button type="button" class="pickBtn" id="p_${f.k}" onclick="pickField('${f.k}')"></button>`;
  // Valor de um gasto em vermelho e de um ganho em verde, para confirmar o que está sendo lançado.
  const cor = !['value', 'total'].includes(f.k) || !F ? '' : F.col === 'incomes' ? 'in' : ['expenses', 'installments'].includes(F.col) ? 'out' : '';
  if (f.big) return `<div class="bigVal ${cor}"><span>R$</span><input id="${id}" type="text" inputmode="numeric" placeholder="0,00" autocomplete="off"></div>`;
  return `<input id="${id}" type="text" ${f.type === 'money' ? `inputmode="numeric" class="${cor}"` : f.type === 'num' ? 'inputmode="decimal"' : f.type === 'int' ? 'inputmode="numeric"' : ''} placeholder="${f.type === 'money' ? '0,00' : f.ph || ''}" autocomplete="off">` +
    (f.type === 'asset' ? '<div id="assetList"></div>' : '') +
    (f.sug ? `<div class="chips sug" id="sug_${f.k}" hidden></div>` : '');
}
// Cores oferecidas para uma categoria (as mesmas famílias das categorias de fábrica).
const CAT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#65a30d', '#16a34a', '#14b8a6', '#0ea5e9', '#2563eb', '#b45309', '#64748b'];
// Texto digitado num campo de dinheiro → valor com os centavos: só os números contam, os dois últimos são os centavos.
function centsMask(s){
  const d = String(s).replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
  return d ? (+d / 100).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
}
function setField(k, v){ const el = document.getElementById('f_' + k); el.value = v; el.oninput(); }

// Redesenha os componentes de lista (até 4 opções: botões lado a lado; mais que isso: botão que abre o seletor), mês e data.
function drawPicks(){
  for (const f of F.fields){
    const el = document.getElementById('f_' + f.k);
    if (f.type === 'select' && f.k !== 'cat'){
      const box = document.getElementById('o_' + f.k), os = [...el.options].map(o => [o.value, o.text]), few = os.length <= 4;
      box.className = few ? 'optPick' : '';
      box.innerHTML = few
        ? os.map(([v, t]) => `<button type="button" class="${v === el.value ? 'on' : ''}" data-v="${esc(v)}" onclick="setField('${f.k}',this.dataset.v)">${esc(t)}</button>`).join('')
        : `<button type="button" class="pickBtn" onclick="pickField('${f.k}')"><span>${esc((os.find(o => o[0] === el.value) || ['', 'Escolher'])[1])}</span>${I('chev')}</button>`;
    } else if (f.type === 'month' || f.type === 'date'){
      const v = el.value;
      document.getElementById('p_' + f.k).innerHTML = `<span class="${v ? '' : 'muted'}">${v ? (f.type === 'month' ? cap(monthName(v)) : fmtDate(v)) : 'Não definido'}</span>${I('calendar')}`;
    }
  }
}
function pickField(k){
  const f = F.fields.find(x => x.k === k), el = document.getElementById('f_' + k), title = typeof f.label === 'function' ? f.label(F.vals) : f.label, set = v => setField(k, v);
  if (f.type === 'select') pickList(title, [...el.options].map(o => [o.value, o.text]), el.value, set);
  else if (f.type === 'month') pickMonthP(title, el.value, f.optional, set);
  else pickDateP(title, el.value, set);
}

// ---------- Seletores do app (abrem por cima da folha) ----------
let pickCb = null, pickOpts = [], pickArgs = [];
const pickerOpen = () => document.getElementById('picker').classList.contains('open');
function showPicker(html){
  const p = document.getElementById('picker');
  p.innerHTML = html; p.scrollTop = 0;
  p.classList.add('open'); document.getElementById('pickBg').classList.add('open');
  a11y(p);
}
function closePicker(){
  document.getElementById('picker').classList.remove('open'); document.getElementById('pickBg').classList.remove('open');
  pickCb = null;
}
function picked(v){ const cb = pickCb; closePicker(); if (cb) cb(v); }
function pickList(title, options, cur, cb){
  pickCb = cb; pickOpts = options;
  showPicker(`<h3>${esc(title)}</h3><div class="pickList">${options.map(([v, t], i) => `<button type="button" class="${v === cur ? 'on' : ''}" onclick="picked(pickOpts[${i}][0])"><span>${esc(t)}</span>${v === cur ? I('check') : ''}</button>`).join('')}</div>
    <div class="btns foot"><button class="btn" onclick="closePicker()">Cancelar</button></div>`);
}
function pickMonthP(title, cur, optional, cb, y){
  pickCb = cb; pickArgs = [title, cur, optional];
  y = y || +(cur || curYM).slice(0, 4);
  showPicker(`<h3>${esc(title)}</h3>
    <div class="nav" style="box-shadow:none;background:var(--bg)"><button onclick="pickMonthP(pickArgs[0],pickArgs[1],pickArgs[2],pickCb,${y - 1})" aria-label="Ano anterior">‹</button><b>${y}</b><button onclick="pickMonthP(pickArgs[0],pickArgs[1],pickArgs[2],pickCb,${y + 1})" aria-label="Próximo ano">›</button></div>
    <div class="filters">${MESES.map((n, i) => { const m = ymOf(y, i); return `<button class="btn ${m === cur ? 'primary' : ''}" style="text-transform:capitalize${m === curYM ? ';outline:2px solid var(--brand)' : ''}" onclick="picked('${m}')">${n.slice(0, 3)}</button>`; }).join('')}</div>
    <div class="btns foot">${optional ? `<button class="btn" onclick="picked('')">Sem data</button>` : ''}<button class="btn" onclick="closePicker()">Cancelar</button></div>`);
}
function pickDateP(title, cur, cb, ym){
  pickCb = cb; pickArgs = [title, cur];
  const hoje = now.toLocaleDateString('sv');
  ym = ym || (cur || hoje).slice(0, 7);
  const [y, m] = ym.split('-').map(Number), first = new Date(y, m - 1, 1).getDay();
  showPicker(`<h3>${esc(title)}</h3>
    <div class="nav" style="box-shadow:none;background:var(--bg)"><button onclick="pickDateP(pickArgs[0],pickArgs[1],pickCb,'${addMonths(ym, -1)}')" aria-label="Mês anterior">‹</button><b>${monthName(ym)}</b><button onclick="pickDateP(pickArgs[0],pickArgs[1],pickCb,'${addMonths(ym, 1)}')" aria-label="Próximo mês">›</button></div>
    <div class="cal">${['dom','seg','ter','qua','qui','sex','sáb'].map(d => `<small>${d}</small>`).join('')}${'<i></i>'.repeat(first)}${[...Array(daysIn(ym))].map((_, i) => { const d = ym + '-' + String(i + 1).padStart(2, '0'); return `<button type="button" class="${d === cur ? 'on' : ''} ${d === hoje ? 'today' : ''}" onclick="picked('${d}')">${i + 1}</button>`; }).join('')}</div>
    <div class="btns foot"><button class="btn" onclick="picked('${hoje}')">Hoje</button><button class="btn" onclick="closePicker()">Cancelar</button></div>`);
}

// ---------- Confirmações e avisos do app (no lugar das caixas do Android) ----------
// ask() devolve uma promessa: true se confirmou. tell() só avisa.
let dlgRes = null;
function ask(msg, ok = 'Confirmar', danger = false, only = false){
  return new Promise(res => {
    if (dlgRes) dlgRes(false);
    dlgRes = res;
    document.getElementById('dlgMsg').textContent = msg;
    document.getElementById('dlgBtns').innerHTML = (only ? '' : '<button class="btn" onclick="dlgClose(false)">Cancelar</button>') + `<button class="btn ${danger ? 'del' : 'primary'}" onclick="dlgClose(true)">${esc(ok)}</button>`;
    document.getElementById('dlg').hidden = false;
  });
}
const tell = msg => ask(msg, 'OK', false, true);
function dlgClose(v){ document.getElementById('dlg').hidden = true; const r = dlgRes; dlgRes = null; if (r) r(v); }
// Avisos vindos do lado nativo ("Arquivo salvo", falha da câmera…) aparecem no aviso de rodapé do app.
function onToast(text){ toast(text); }

// preset (opcional): {title, vals, asset, id} para abrir um formulário novo já preenchido.
function openForm(col, item, preset = {}){
  const cfg = FORMS[col], fields = typeof cfg.fields === 'function' ? cfg.fields() : cfg.fields;
  const vals = Object.assign(cfg.defaults ? cfg.defaults() : {}, preset.vals);
  if (item) for (const f of fields){ const v = item[f.k]; vals[f.k] = f.type === 'money' ? moneyStr(v) : f.k === 'fixed' ? (v === 'y' ? 'y' : v ? '1' : '') : v == null ? '' : String(v).replace('.', f.type === 'num' ? ',' : '.'); }
  if (item && cfg.load) cfg.load(vals, item);
  settingsOpen = false;
  F = {col, cfg, fields, id:preset.id || (item && item.id), vals, touched:{}, asset:preset.asset || null};
  // Lançamento rápido: num registro novo, os campos "more" começam recolhidos.
  const hasMore = fields.some(f => f.more);
  F.more = !hasMore || !!F.id || !!preset.more;
  showSheet(`<h3>${preset.title || cfg.fullTitle || (item ? 'Editar ' : cfg.fem ? 'Nova ' : 'Novo ') + cfg.title}</h3>` +
    (!F.id && cfg.top ? cfg.top() : '') +
    fields.map(f => `<div id="w_${f.k}"><label for="f_${f.k}"></label>${fieldHtml(f)}</div>`).join('') +
    (cfg.before ? `<div id="w__before">${cfg.before()}</div>` : '') +
    (hasMore && !F.id ? `<button type="button" class="moreBtn" id="moreBtn" onclick="F.more=!F.more;syncForm()"></button><div class="hint" id="moreSum" style="text-align:center"></div>` : '') +
    `<div class="hint" id="fhint"></div><div class="err" id="ferr"></div>
    <div class="btns foot">${F.id && !cfg.noDelete ? '<button class="btn danger" onclick="removeItem()">Excluir</button>' : ''}
      <button class="btn" onclick="closeForm()">Cancelar</button><button class="btn primary" onclick="submitForm()">Salvar</button></div>` +
    (cfg.extra ? cfg.extra() : '') + histHtml(item));
  for (const f of fields){
    const el = document.getElementById('f_' + f.k);
    el.value = vals[f.k] ?? '';
    // Valor atual que não está mais na lista (ex.: categoria escondida): entra como opção para não se perder.
    if (f.type === 'select' && vals[f.k] && el.value !== vals[f.k]){ el.add(new Option(f.k === 'cat' ? ((CAT_GASTO[vals.cat] || CAT_GANHO[vals.cat] || [0, vals.cat])[1]) : vals[f.k], vals[f.k])); el.value = vals[f.k]; }
    // Valores em dinheiro: a pessoa digita só os números e a vírgula dos centavos entra sozinha (1 → 0,01; 1234 → 12,34).
    // Vale para o que é digitado; valores postos pelo app (setField, comprovante lido) já chegam prontos.
    if (f.type === 'money') el.addEventListener('input', () => { el.value = centsMask(el.value); el.setSelectionRange(el.value.length, el.value.length); });
    el.oninput = el.onchange = () => {
      F.vals[f.k] = el.value; F.touched[f.k] = true;
      if (cfg.onChange) cfg.onChange(f.k, F.vals, !F.id, F.touched);
      syncForm(f.k);
    };

    if (f.sug) sugBind(el, document.getElementById('sug_' + f.k), f.sug());
  }
  // Categoria: em vez da lista suspensa, um botão por categoria (o <select> continua existindo, escondido).
  syncForm();
  if (F.asset) document.getElementById('assetList').innerHTML = assetPicked(F.asset);
}
// Sugestões (bancos, pessoas…) como botões logo abaixo do campo. A lista nativa do navegador (<datalist>)
// cobria a tela inteira no Android e só fechava escolhendo um item.
function sugBind(el, box, list){
  const draw = () => {
    const q = el.value.trim().toLowerCase();
    const hits = list.filter(s => s.toLowerCase() !== q && s.toLowerCase().includes(q)).slice(0, 8);
    box.hidden = !hits.length;
    box.innerHTML = hits.map(s => `<button type="button">${esc(s)}</button>`).join('');
    box.querySelectorAll('button').forEach((b, i) => b.onclick = () => { el.value = hits[i]; el.dispatchEvent(new Event('input')); box.hidden = true; });
  };
  el.addEventListener('focus', draw);
  el.addEventListener('input', draw);
  el.addEventListener('blur', () => setTimeout(() => box.hidden = true, 200)); // dá tempo de o toque no botão chegar
}
function syncForm(skip){
  for (const f of F.fields){
    document.getElementById('w_' + f.k).hidden = (!!f.showIf && !f.showIf(F.vals)) || (!!f.more && !F.more);
    document.querySelector(`#w_${f.k} label`).textContent = typeof f.label === 'function' ? f.label(F.vals) : f.label;
    const el = document.getElementById('f_' + f.k);
    if (f.k !== skip && el.value !== (F.vals[f.k] ?? '')) el.value = F.vals[f.k] ?? '';
  }
  document.getElementById('fhint').textContent = F.cfg.hint ? F.cfg.hint(F.vals) : '';
  const bf = document.getElementById('w__before'), mb = document.getElementById('moreBtn');
  if (bf) bf.hidden = !F.more;
  if (mb){
    mb.innerHTML = I(F.more ? 'close' : 'plus', 16) + (F.more ? 'Menos opções' : 'Mais opções');
    document.getElementById('moreSum').textContent = !F.more && F.cfg.summary ? F.cfg.summary(F.vals) : '';
  }

  drawPicks();
  drawCatPick();
  document.querySelectorAll('.iconGrid button').forEach(b => b.classList.toggle('on', b.dataset.i === F.vals.icon));
  document.querySelectorAll('.colorGrid button').forEach(b => b.classList.toggle('on', b.dataset.c === F.vals.color));
}
// Categoria: em vez da lista suspensa, um botão por categoria (o <select> continua existindo, escondido).
// Com muitas categorias, aparecem as mais usadas primeiro e o resto fica atrás de "Mais categorias".
function drawCatPick(){
  const cp = document.getElementById('catPick');
  if (!cp) return;
  const M = F.col === 'incomes' ? CAT_GANHO : F.col === 'investments' ? CAT_INV : CAT_GASTO, LIM = 11, used = {};
  for (const x of F.col === 'incomes' ? db.incomes : F.col === 'investments' ? db.investments : db.expenses.concat(db.installments)) used[x.cat] = (used[x.cat] || 0) + 1;
  let list = [...document.getElementById('f_cat').options].map(o => [o.value, o.text]);
  const cut = list.length > LIM + 1 && !F.allCats;
  if (cut){ const top = [...list].sort((a, b) => (used[b[0]] || 0) - (used[a[0]] || 0)).slice(0, LIM).map(o => o[0]); list = list.filter(o => top.includes(o[0]) || o[0] === F.vals.cat); }
  cp.innerHTML = list.map(([v, t]) => `<button type="button" class="${v === F.vals.cat ? 'on' : ''}" data-v="${esc(v)}" onclick="pickCat(this.dataset.v)">${I((M[v] || ['tag'])[0], 17)}${esc(t)}</button>`).join('') +
    (cut ? `<button type="button" class="more" onclick="F.allCats=true;drawCatPick()">Mais categorias…</button>` : '');
}
function pickCat(v){ const el = document.getElementById('f_cat'); el.value = v; el.onchange(); }
function pickIcon(k, v){ const el = document.getElementById('f_' + k); el.value = v; el.oninput(); }
// O que mudou entre duas versões de um lançamento, em texto ("valor R$ 10,00 → R$ 12,00"). '' se nada relevante mudou.
const DIFF_FIELDS = [['value', 'valor', 1], ['total', 'total', 1], ['target', 'meta', 1], ['saved', 'guardado', 1], ['desc', 'descrição'], ['name', 'nome'], ['cat', 'categoria'],
  ['bank', 'banco'], ['pay', 'pagamento'], ['start', 'mês'], ['end', 'até'], ['day', 'dia'], ['due', 'vencimento'], ['n', 'parcelas'], ['paid', 'pagas'], ['tags', 'etiquetas']];
function diffRec(a, b){
  const show = (k, v, money) => v === '' || v == null ? 'vazio' : money ? shown(() => fmt(v)) : k === 'cat' ? (CAT_GASTO[v] || CAT_GANHO[v] || CAT_INV[v] || [0, v])[1] : k === 'pay' ? PAY[v] || v : String(v);
  return DIFF_FIELDS.filter(([k]) => (a[k] ?? '') !== (b[k] ?? '')).map(([k, nome, money]) => `${nome} ${show(k, a[k], money)} → ${show(k, b[k], money)}`).join('; ');
}
const histHtml = item => item && item.h && item.h.length ? `<label>Histórico de alterações</label>${[...item.h].reverse().map(h =>
  `<div class="hint" style="margin-top:4px"><b>${new Date(h.t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}</b> · ${esc(h.d)}</div>`).join('')}` : '';
function closeForm(){
  settingsOpen = false;
  welcomeOn = false;
  closePicker();
  try { localStorage.removeItem(DRAFT); } catch(e){}
  document.getElementById('sheet').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
  F = null;
}
function submitForm(){
  if (!F) return; // segundo toque em "Salvar" depois que o formulário já fechou
  // Erro num campo recolhido abre as "Mais opções", para o campo aparecer.
  const out = {}, err = (m, f) => { if (f && f.more && !F.more){ F.more = true; syncForm(); } document.getElementById('ferr').textContent = m; };
  for (const f of F.fields){
    const raw = String(F.vals[f.k] ?? '').trim(), name = typeof f.label === 'function' ? f.label(F.vals) : f.label;
    if (f.showIf && !f.showIf(F.vals)){ out[f.k] = ''; continue; }
    if (f.k === 'fixed'){ out.fixed = raw === 'y' ? 'y' : !!raw; continue; }
    if (!raw){ if (f.optional){ out[f.k] = f.type === 'money' ? 0 : ''; continue; } return err('Preencha: ' + name.toLowerCase(), f); }
    if (f.type === 'money' || f.type === 'num' || f.type === 'int'){
      const n = f.type === 'int' ? (/^\d+$/.test(raw) ? parseInt(raw) : NaN) : parseMoney(raw);
      if (isNaN(n) || n < 0 || (n === 0 && !f.zero)) return err('Valor inválido em: ' + name.toLowerCase(), f);
      if (f.type === 'money'){ out[f.k] = round2(n); continue; }
      out[f.k] = n;
    } else out[f.k] = raw;
  }
  if (out.end && out.end < out.start) return err('O mês final não pode ser antes do inicial.');
  const msg = F.cfg.check && F.cfg.check(out);
  if (msg) return err(msg);
  const newId = uid(), after = F.cfg.after, antes = F.id ? JSON.stringify(db) : null, voltar = welcomeOn;
  const velho = F.id && COLS.includes(F.col) ? {...(db[F.col].find(x => x.id === F.id) || {})} : null;
  if (F.cfg.commit) F.cfg.commit(out, F.id, newId);
  else if (F.id) Object.assign(touch(db[F.col].find(x => x.id === F.id)), out);
  else db[F.col].push(touch({id:newId, ...out}));
  if (velho && velho.id){ // histórico: guarda as 6 últimas alterações do lançamento
    const rec = db[F.col].find(x => x.id === F.id), d = rec && diffRec(velho, rec);
    if (d) rec.h = [...(rec.h || []), {t:Date.now(), d}].slice(-6);
  }
  if (F.photo !== undefined){ // comprovante anexado, trocado ou removido neste formulário
    const rec = db[F.col].find(x => x.id === (F.id || newId));
    if (rec){ rec.photo = !!F.photo; if (F.photo) photoSave(rec.id, F.photo); else photoDelete(rec.id); queuePhoto(F.photo ? 'up' : 'del', rec.id); }
  }
  if (F.col === 'expenses' && !F.id) state.month = out.fixed && out.start > state.month ? out.start : (out.fixed ? state.month : out.start);
  rollover(); // marca registros novos com o mês atual
  const done = savedMsg(F.col, !F.id);
  save(); closeForm(); render();
  if (after) after();
  if (voltar) openWelcome();
  if (antes && done === 'Salvo') showUndo('Alteração salva', () => restoreSnap(antes)); else toast(done);
}

// ---------- Comprovantes (foto anexada a um gasto) ----------
// A foto é reduzida e guardada neste aparelho (no APK, em arquivo; na prévia do PC, no armazenamento do navegador);
// o lançamento guarda apenas photo:true. Na sincronização ela é enviada para a conta Google como foto-<id>.json
// (fila em sync.up / sync.del), e outro aparelho a baixa na primeira vez em que o comprovante é aberto.
const photoFile = id => `foto-${id}.json`;
function queuePhoto(kind, id){
  if (!canSync()) return;
  sync.up = sync.up.filter(i => i !== id); sync.del = sync.del.filter(i => i !== id);
  sync[kind].push(id); saveSync();
}
// Cada comprovante é tentado em separado. Um que falha 5 vezes sai da fila (e vai para o Diagnóstico),
// para não ser reenviado para sempre; sem internet não conta como tentativa.
async function syncPhotos(){
  const tries = sync.tries = sync.tries || {};
  const run = async (kind, id, fn) => {
    try { await fn(); delete tries[id]; sync[kind] = sync[kind].filter(i => i !== id); }
    catch(e){
      if (e && e.status === 0) return false;
      tries[id] = (tries[id] || 0) + 1;
      if (tries[id] >= 5){ delete tries[id]; sync[kind] = sync[kind].filter(i => i !== id); logErr('comprovante', `desisti de ${kind === 'up' ? 'enviar' : 'apagar'} ${id}: ${e && e.status || e}`); }
    }
    saveSync();
    return true;
  };
  for (const id of [...sync.up]) if (!await run('up', id, async () => {
    const data = photoLoad(id);
    if (data){ const f = (await driveList(`name='${photoFile(id)}'`))[0]; await driveWrite(f && f.id, photoFile(id), JSON.stringify(data)); }
  })) return;
  for (const id of [...sync.del]) if (!await run('del', id, async () => {
    const f = (await driveList(`name='${photoFile(id)}'`))[0];
    if (f) ok(await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`));
  })) return;
}
const photoKey = id => 'financas-foto-' + id;
const nativePhotos = () => window.Android && Android.fotoSalvar;
function photoLoad(id){ if (nativePhotos()) return Android.fotoLer(id); try { return localStorage.getItem(photoKey(id)) || ''; } catch(e){ return ''; } }
function photoSave(id, data){ if (nativePhotos()) Android.fotoSalvar(id, data); else try { localStorage.setItem(photoKey(id), data); } catch(e){} }
function photoDelete(id){ if (nativePhotos()) Android.fotoApagar(id); else try { localStorage.removeItem(photoKey(id)); } catch(e){} }
// No celular há dois caminhos: a câmera (aberta pelo app, ver tirarFoto em MainActivity) e a galeria (seletor de arquivos).
const canCam = () => window.Android && Android.tirarFoto;
function photoSection(){
  const has = !F.pick && (F.photo !== undefined ? !!F.photo : !!(F.id && (db.expenses.find(x => x.id === F.id) || {}).photo));
  const gallery = `document.getElementById('photoIn').click()`;
  return `<div id="photoBox"><label>Comprovante</label><div class="btns" style="margin-top:0">${has
    ? `<button class="btn" onclick="photoView()">Ver</button><button class="btn" onclick="photoSwap()">Trocar</button><button class="btn danger" onclick="photoSet('')">Remover</button>`
    : canCam() ? `<button class="btn" onclick="photoCam()">Tirar foto</button><button class="btn" onclick="${gallery}">${I('upload')}Galeria</button>`
    : `<button class="btn" onclick="${gallery}">${I('upload')}Anexar foto do comprovante</button>`}</div>
    ${has ? '' : '<div class="hint">Tire a foto na hora ou escolha uma da galeria.</div>'}</div>`;
}
function photoDraw(){ document.getElementById('photoBox').outerHTML = photoSection(); }
function photoSet(v){
  if (!F) return;
  F.photo = v; F.pick = false; photoDraw();
  if (v && window.Android && Android.lerTexto) Android.lerTexto(v); // o texto lido chega em onTextoFoto
}
// Do texto de um comprovante, tira o valor (o da linha de "total"/"valor"; senão, o maior) e a data.
function readReceipt(text){
  const valores = l => [...l.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})(?!\d)/g)].map(m => parseNum(m[1]));
  const linhas = String(text).split(/\n/), comTotal = linhas.filter(l => /total|valor/i.test(l)).flatMap(valores);
  const todos = linhas.flatMap(valores), value = comTotal.length ? comTotal[comTotal.length - 1] : todos.length ? Math.max(...todos) : 0;
  const d = String(text).match(/\b(\d{2})\/(\d{2})\/(\d{4}|\d{2})\b/);
  const date = d && +d[2] >= 1 && +d[2] <= 12 && +d[1] >= 1 && +d[1] <= 31 ? `${d[3].length === 2 ? '20' + d[3] : d[3]}-${d[2]}-${d[1]}` : '';
  return {value, date};
}
// Chamado pelo app com o texto lido da foto: preenche o valor (se estiver vazio) e, num gasto novo, o mês e o dia.
function onTextoFoto(text){
  if (!F || F.col !== 'expenses') return;
  const r = readReceipt(text), partes = [];
  if (r.value > 0 && !(parseMoney(F.vals.value) > 0)){ F.vals.value = moneyStr(r.value); partes.push(shown(() => fmt(r.value))); }
  if (r.date && !F.id && !F.touched.start && !F.vals.fixed){ F.vals.start = r.date.slice(0, 7); F.vals.day = String(+r.date.slice(8)); partes.push(fmtDate(r.date)); }
  if (!partes.length) return;
  syncForm();
  toast(`Li no comprovante: ${partes.join(', ')}. Confira antes de salvar.`);
}
function photoSwap(){ if (canCam()){ F.pick = true; photoDraw(); } else document.getElementById('photoIn').click(); }
// Rascunho do formulário: o Android pode fechar o app enquanto a câmera está aberta; na volta, o formulário é remontado.
const DRAFT = 'financas-rascunho';
function photoCam(){
  try { localStorage.setItem(DRAFT, JSON.stringify({col:F.col, id:F.id || null, vals:F.vals, touched:F.touched, tab:state.tab, month:state.month})); } catch(e){}
  Android.tirarFoto();
}
// Chamado pelo app quando a foto da câmera fica pronta (e na abertura, caso o app tenha sido fechado no meio).
function onFoto(){
  const data = canCam() && Android.fotoCapturada ? Android.fotoCapturada() : '';
  if (!data) return;
  if (!document.getElementById('photoBox') || !document.getElementById('sheet').classList.contains('open')){
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT)); } catch(e){}
    if (!d || !FORMS[d.col]) return;
    state.tab = d.tab; state.month = d.month; render();
    openForm(d.col, d.id ? db[d.col].find(x => x.id === d.id) : null);
    Object.assign(F.vals, d.vals); F.touched = d.touched || {}; F.more = true;
    for (const f of F.fields){ const el = document.getElementById('f_' + f.k); if (el) el.value = F.vals[f.k] ?? ''; }
    syncForm();
  }
  photoSet(data);
}
function photoChosen(input){
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const img = new Image();
  img.onload = () => { // reduz para no máximo 1280 px no lado maior, em JPEG
    const k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    photoSet(c.toDataURL('image/jpeg', .72));
  };
  img.onerror = () => tell('Não foi possível abrir essa imagem.');
  img.src = URL.createObjectURL(file);
}
async function photoView(){
  const id = F.id, box = document.getElementById('lightbox');
  let src = F.photo || photoLoad(id);
  if (!src && canSync() && sync.on){ // foto anexada em outro aparelho: busca na conta e guarda aqui
    document.getElementById('ferr').textContent = 'Baixando o comprovante…';
    try { const f = (await driveList(`name='${photoFile(id)}'`))[0]; if (f){ src = await driveGet(f.id); photoSave(id, src); } } catch(e){}
    if (F) document.getElementById('ferr').textContent = '';
  }
  if (!src) return tell('Não encontrei a foto deste comprovante. Se ela foi anexada em outro aparelho, abra o app nele com internet para enviá-la.');
  box.querySelector('img').src = src; box.hidden = false;
}
function removeItem(){ const {col, id} = F; closeForm(); removeRec(col, id); }
// Exclui um lançamento e oferece "Desfazer" por alguns segundos.
function removeRec(col, id){
  const i = db[col].findIndex(x => x.id === id), rec = db[col][i];
  if (i < 0) return tell(ARCH_MSG); // lançamento do arquivo de anos antigos
  db[col].splice(i, 1);
  db.tomb[id] = Date.now();
  db.trash.push({col, rec, at:Date.now()});
  save(); render();
  showUndo('Excluído', () => { db[col].splice(i, 0, touch(rec)); delete db.tomb[id]; db.trash = db.trash.filter(t => t.rec !== rec); save(); render(); });
}
// Lixeira: lançamentos excluídos nos últimos 30 dias (neste aparelho), com opção de restaurar.
const COL_NAMES = {incomes:'Ganho', expenses:'Gasto', installments:'Compra parcelada', investments:'Investimento', goals:'Meta', accounts:'Conta', transfers:'Transferência'};
function openTrash(){
  settingsOpen = false; F = null;
  const list = db.trash.map((t, i) => ({t, i})).reverse();
  showSheet(`<h3>Lixeira</h3>
    <div class="hint" style="margin-top:0">O que você exclui fica aqui por 30 dias, só neste aparelho.</div>
    ${list.length ? list.map(({t, i}) => { const r = t.rec, dias = Math.floor((Date.now() - t.at) / 864e5), v = r.value ?? r.total ?? r.target; return `
      <div class="item" style="cursor:default"><div class="mid"><b>${esc(r.desc || r.name || r.ticker || (r.from ? r.from + ' → ' + r.to : 'Sem nome'))}</b>
        <small>${COL_NAMES[t.col] || ''}${v ? ' · ' + fmt(v) : ''} · excluído ${dias ? 'há ' + dias + ' dia' + (dias > 1 ? 's' : '') : 'hoje'}</small></div>
        <button class="btn" style="flex:none;padding:8px 12px" onclick="trashRestore(${i});openTrash()">Restaurar</button></div>`; }).join('') : empty('trash', 'A lixeira está vazia.')}
    <div class="btns foot">${list.length ? '<button class="btn danger" onclick="trashEmpty()">Esvaziar</button>' : ''}<button class="btn primary" onclick="openSettings('dados')">Voltar</button></div>`);
}
function trashRestore(i){
  const t = db.trash.splice(i, 1)[0];
  if (!db[t.col].some(r => r.id === t.rec.id)) db[t.col].push(touch(t.rec));
  delete db.tomb[t.rec.id];
  save(); render();
}
async function trashEmpty(){
  if (!await ask('Esvaziar a lixeira?\nOs lançamentos excluídos não poderão mais ser restaurados.', 'Esvaziar', true)) return;
  db.trash = []; save(); openTrash();
}
// Desfaz uma edição: volta ao estado guardado antes dela. O que mudou fica marcado como "alterado agora"
// (e o que não existia, como excluído), para a volta valer também nos outros aparelhos.
function restoreSnap(json){
  const old = fixDb(JSON.parse(json)), t = Date.now();
  for (const c of COLS){
    const cur = new Map(db[c].map(r => [r.id, JSON.stringify(r)])), ids = new Set(old[c].map(r => r.id));
    for (const r of old[c]) if (cur.get(r.id) !== JSON.stringify(r)) r.u = t;
    for (const r of db[c]) if (!ids.has(r.id)) old.tomb[r.id] = t;
  }
  old.cfgMod = t; old.trash = db.trash;
  loadDb(old); save(); render();
  if (sheetOpen() && !F) closeForm();
}
let snackTimer = 0, undoFn = null;
function showUndo(text, fn){
  const s = document.getElementById('snack');
  undoFn = fn;
  s.innerHTML = `${text} <button onclick="const f=undoFn;hideSnack();f()">Desfazer</button>`;
  s.hidden = false;
  clearTimeout(snackTimer);
  snackTimer = setTimeout(hideSnack, 6000);
}
// Aviso curto no rodapé, sem botão.
function toast(text){
  const s = document.getElementById('snack');
  undoFn = null;
  s.textContent = text;
  s.hidden = false;
  clearTimeout(snackTimer);
  snackTimer = setTimeout(hideSnack, db.prefs.fun ? 3800 : 1800);
}
function hideSnack(){ document.getElementById('snack').hidden = true; undoFn = null; }

