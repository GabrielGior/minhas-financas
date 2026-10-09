// Cofrim — Regras de cálculo (sem HTML): o que vale em cada mês, ganhos e gastos do mês, vales,
// arquivo de anos antigos e saldo das contas bancárias.
// Carregado na ordem do index.html (lista e dependências em docs/MAPA.md e ARCHITECTURE.md).

// ---------- Regras ----------
// Vale para ganhos e gastos. fixed: false = só no mês start; true = todo mês a partir de start;
// 'y' = anual, todo ano no mesmo mês de start. Os dois últimos param em end, se houver.
function activeIn(x, ym){
  if (!x.fixed) return x.start === ym;
  if (x.start > ym || (x.end && ym > x.end)) return false;
  return x.fixed !== 'y' || ym.slice(5) === x.start.slice(5);
}
const isMonthly = x => x.fixed && x.fixed !== 'y';
// Assinatura: gasto fixo mensal marcado como tal (sub '1'), ou com nome de serviço conhecido se não foi marcado como conta fixa (sub '0').
const SUB_RX = /netflix|spotify|stream|stremm|disney|prime video|amazon prime|\bhbo\b|\bmax\b|globoplay|paramount|youtube|apple|icloud|google one|deezer|crunchyroll|star\+|telecine|xbox|playstation|\bpsn\b|game ?pass|chatgpt|openai|claude|canva|adobe|microsoft 365|office 365|dropbox|academia|smart ?fit|gympass|wellhub|totalpass|kindle|audible|duolingo|uber one|mubi|assinatura/;
const isSub = x => !!isMonthly(x) && (x.sub === '1' || (x.sub !== '0' && SUB_RX.test(plain(x.desc || ''))));
// Arquivo de anos antigos (ver archiveUntil em sincronizacao.js): os lançamentos até o ano db.archUntil saem dos dados do dia a dia
// e ficam num arquivo à parte, na conta Google (arquivo.json) e neste aparelho (ARCH_KEY). arch = o conteúdo do arquivo,
// carregado quando a tela mostra um período arquivado; os cálculos desses meses somam os lançamentos dele.
let arch = null, archTried = false;
const ARCH_KEY = 'financas-arquivo';
const archRecs = (col, ym) => arch && db.archUntil && ym.slice(0, 4) <= db.archUntil ? (arch[col] || []).filter(r => !db[col].some(x => x.id === r.id)) : [];
const archNeeded = () => !!db.archUntil && (String(state.year) <= db.archUntil || state.month.slice(0, 4) <= db.archUntil);
// Carrega o arquivo: primeiro a cópia deste aparelho; se não houver, busca na conta (uma vez por abertura do app).
function ensureArchive(){
  if (arch || !db.archUntil) return true;
  try { const a = JSON.parse(localStorage.getItem(ARCH_KEY) || 'null'); if (a && a.until >= db.archUntil){ arch = a; dirty(); return true; } } catch(e){}
  if (!archTried && canSync() && sync.on){
    archTried = true;
    driveList("name='arquivo.json'").then(f => f[0] ? driveGet(f[0].id) : null)
      .then(a => { if (a){ arch = a; try { localStorage.setItem(ARCH_KEY, JSON.stringify(a)); } catch(e){} } })
      .catch(() => {}).finally(() => telaAtualizar());
  }
  return false;
}
// Vale-alimentação e vale-refeição ficam separados do resto: não entram nos ganhos, nos gastos nem no saldo do mês.
// Crédito de vale = ganho com a categoria va ou vr; gasto no vale = gasto (ou parcela) com a forma de pagamento va ou vr.
// incomesOf/expensesOf devolvem o mês SEM os vales; incomesAll/expensesAll, com eles; valeIn/valeOut, só eles.
const VALES = {va:'Vale-alimentação', vr:'Vale-refeição', vt:'Vale-transporte'};
// Empresas de vale mais comuns no Brasil (campo "Empresa do vale"); a última usada em cada vale já vem escolhida.
const VALE_EMPRESAS = ['Alelo', 'Pluxee', 'Sodexo', 'Ticket', 'VR', 'iFood Benefícios', 'Ben', 'Flash', 'Caju', 'Swile', 'Up Brasil', 'Greencard', 'Outra'];
const valeEmp = k => ([...db.incomes.filter(x => x.cat === k && x.emp),
  ...db.expenses.filter(x => x.pay === k && x.emp)].sort((a, b) => (b.u || 0) - (a.u || 0))[0] || {}).emp || '';
const temVales = () => Object.keys(VALES).some(temVale);
const valeGanho = x => !!VALES[x.cat], valeGasto = x => !!VALES[x.pay];
const incomesAll = ym => cached('I' + ym, () => [...db.incomes, ...archRecs('incomes', ym)].filter(x => activeIn(x, ym)));
const incomesOf = ym => cached('i' + ym, () => incomesAll(ym).filter(x => !valeGanho(x)));
const expensesAll = ym => cached('E' + ym, () => expensesRaw(ym));
const expensesOf = ym => cached('e' + ym, () => expensesAll(ym).filter(x => !valeGasto(x)));
const valeIn = (ym, k) => incomesAll(ym).filter(x => k ? x.cat === k : valeGanho(x));
const valeOut = (ym, k) => expensesAll(ym).filter(x => k ? x.pay === k : valeGasto(x));
const temVale = k => db.incomes.some(x => x.cat === k) || db.expenses.some(x => x.pay === k) || db.installments.some(x => x.pay === k);
// Saldo de um vale no fim do mês ym: tudo o que entrou menos tudo o que saiu, desde o primeiro lançamento dele.
const valeSaldo = (k, ym = curYM) => cached('vs' + k + ym, () => {
  const ini = [...db.incomes.filter(x => x.cat === k), ...db.expenses.filter(x => x.pay === k),
    ...db.installments.filter(x => x.pay === k)].reduce((a, x) => x.start < a ? x.start : a, ym);
  let s = 0;
  for (let m = ini, i = 0; m <= ym && i < 240; m = addMonths(m, 1), i++) s += sum(valeIn(m, k), x => x.value) - sum(valeOut(m, k), x => x.value);
  return round2(s);
});
function expensesRaw(ym){
  // Gasto dividido: value passa a ser só a sua parte; full guarda o total que saiu da sua conta;
  // got diz se a parte da outra pessoa já foi recebida (nos gastos fixos, mês a mês, em x.sm).
  const list = [...db.expenses, ...archRecs('expenses', ym)].filter(x => activeIn(x, ym)).map(x => ({...x, kind:'expense', full:x.value,
    value:x.value - (x.share || 0), got:x.fixed ? (x.sm || []).includes(ym) : !!x.settled}));
  // Parcelas: cada uma no mês dela, paga ou não ("Pagar" só muda o status). Financiamento e empréstimo saem da conta de
  // débito. Os abatimentos entram como gasto no mês em que foram feitos.
  for (const p of [...db.installments, ...archRecs('installments', ym)]){
    const i = monthDiff(ym, p.start), onde = isFin(p) ? {bank:p.conta || '', pay:'debito'} : {bank:p.bank, pay:p.pay};
    if (i >= 0 && i < p.n) list.push({id:p.id, kind:'installment', desc:p.desc, cat:p.cat, ...onde, by:p.by, value:parcVal(p, i), num:i+1, n:p.n,
      paid:i < p.paid});
    for (const a of p.ab || []) if (a.d.slice(0, 7) === ym) list.push({id:p.id, kind:'installment', abat:true, desc:p.desc, cat:p.cat, ...onde,
      by:p.by, value:a.v, day:+a.d.slice(8)});
  }
  return list;
}
const totalIn = ym => sum(incomesOf(ym), x => x.value);
const totalOut = ym => sum(expensesOf(ym), x => x.value);
// ---------- Contas bancárias ----------
// db.accounts = [{name, initial, since}]: initial é o saldo no começo do mês since. O saldo de hoje soma, de since
// até o mês atual, os ganhos que caem na conta e as transferências recebidas, menos os gastos e parcelas feitos
// nesse banco (qualquer forma de pagamento) e as transferências enviadas. A ligação é pelo nome do banco/conta.
// Regras do saldo:
// - conta até a data-limite `until` = [mês, dia] (padrão: hoje). Lançamento com dia depois do limite, no mês do limite,
//   ainda não entrou; sem dia informado, conta desde o começo do mês. Gasto fixo usa o dia do vencimento.
// - compras no crédito não saem da conta na hora: a fatura do mês M sai no mês seguinte, no dia de pagamento do
//   cartão (db.cardDue), da conta escolhida em db.cardAcc (ou da conta com o mesmo nome do banco do cartão).
// - gasto dividido: sai o valor cheio; a parte da outra pessoa volta quando marcada como recebida.
const today = () => [curYM, now.getDate()];
const monthEnd = ym => [ym, 31];
const reached = (ym, day, [uy, ud]) => ym < uy || (ym === uy && (day || 1) <= ud);
// Conta que paga a fatura de um cartão: a escolhida; senão a de mesmo nome; senão a única conta que existir.
// Com várias contas e nenhuma escolhida, devolve '' e a tela de Gastos avisa que falta escolher.
const cardAccount = bank => db.cardAcc[bank] || (db.accounts.some(a => a.name === bank) ? bank : db.accounts.length === 1 ? db.accounts[0].name : '');
function accountBalance(a, until = today()){
  let b = a.initial || 0;
  for (let m = a.since; m <= until[0]; m = addMonths(m, 1)){
    for (const x of incomesOf(m)) if (x.bank === a.name && reached(m, x.day, until)) b += x.value;
    for (const x of expensesOf(m)){
      if (x.bank !== a.name) continue;
      if (x.share && x.got) b += x.share;
      if (x.pay !== 'credito' && reached(m, x.kind === 'expense' ? (x.fixed ? x.due : x.day) : 0, until)) b -= x.full || x.value;
    }
    // faturas dos cartões pagos por esta conta: a de M-1 vence em M
    for (const [bank, v] of invoices(addMonths(m, -1))) if (cardAccount(bank) === a.name && reached(m, db.cardDue[bank], until)) b -= v;
  }
  for (const t of db.transfers) if (t.month >= a.since && reached(t.month, t.day, until)) b += (t.to === a.name ? t.value : 0) - (t.from === a.name ? t.value : 0);
  return b;
}
