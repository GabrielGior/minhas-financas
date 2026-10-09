// Cofrim — Previsões de gastos: cálculos (quanto falta, reserva no saldo previsto) e os avisos (80%, passou,
// encerramento…). Depende de dados.js.
// Saiu de js/dados.js (só mudou de arquivo); carregado logo depois dele no index.html.

// ---------- Previsões de gastos ----------
// Gasto ESPERADO numa categoria até um dia do mês (o orçamento é um limite e só avisa; a previsão entra nos valores
// projetados). db.previsoes: {id, cat, mes, value, dia, rep, ex, ate}. Uma que se repete vale do mês dela em diante (até
// "ate"), calculada a cada mês, sem cópia gravada; ex guarda o que mudou ou saiu num mês só. Uma por categoria e mês.
function previsoesDoMes(m){
  return cached('P' + m, () => {
    const por = {};
    for (const p of db.previsoes){
      if (!(p.mes === m || (p.rep && p.mes < m && (!p.ate || m <= p.ate)))) continue;
      const e = (p.ex || {})[m] || {};
      if (e.del || (por[p.cat] && por[p.cat].p.mes > p.mes)) continue; // duas na mesma categoria: vale a mais recente
      por[p.cat] = {p, m, cat:p.cat, value:e.value || p.value, dia:Math.min(e.dia || p.dia, daysIn(m))}; // dia 31 em fevereiro = 28 ou 29
    }
    return Object.values(por);
  });
}
// Lançamentos que contam: gastos da categoria do dia 1 até o dia final, pela data da aba Gastos (diaDe: fixos pelo
// vencimento, parcelas pelo dia delas, crédito pela data da compra).
const prevLanc = it => expensesOf(it.m).filter(x => x.cat === it.cat && diaDe(x, it.m) <= it.dia);
const prevGasto = it => round2(sum(prevLanc(it), x => x.value));
// Ainda vale o previsto? Mês futuro, sim; mês passado, não; no mês atual, até o dia final (inclusive).
const prevAtiva = (it, hoje = today()) => it.m > hoje[0] || (it.m === hoje[0] && hoje[1] <= it.dia);
// Quanto as previsões somam ao total PROJETADO de gastos do mês: só o que falta gastar do previsto, enquanto a previsão
// vale (o já gasto está nos totais e não conta duas vezes). Não mexe no saldo real das contas nem nos gastos feitos.
const reservaPrevisoes = (m, hoje = today()) => round2(sum(previsoesDoMes(m), it => prevAtiva(it, hoje) ? Math.max(0, it.value - prevGasto(it)) : 0));
const totalOutPrev = ym => round2(totalOut(ym) + reservaPrevisoes(ym));
// Do mês atual até m: o que as previsões tiram do saldo das contas no fim de m (projetado).
const reservaAte = m => { let t = 0; for (let k = curYM; k <= m; k = addMonths(k, 1)) t += reservaPrevisoes(k); return round2(t); };
const prevInclui = v => v > 0 ? `inclui ${fmt(v)} de previsões` : '';
// Avisos das previsões: os pontos marcados em Configurações › Lembretes (prevPontos: 50%, 80%, 90%, chegou no previsto,
// passou do previsto e o encerramento; os padrões são 80%, passou e encerramento), uma vez por previsão, mês e ponto. Se
// o gasto pula vários pontos de uma vez, avisa só o maior e marca os menores como vistos. As marcas guardadas antes da
// 1.90 continuam valendo (sufixos 80, 100 = passou e fim). Conferido ao abrir, ao voltar ao app e ao salvar. O que já foi avisado fica guardado neste
// aparelho (na
// demonstração, só na memória), para não repetir ao reabrir ou sincronizar. O encerramento descoberto dias depois leva o
// horário do fim do dia final (23:59). Olha o mês atual e o anterior (app fechado por muito tempo).
const PREV_AVISOS_KEY = 'financas-prev-avisos';
let prevAvisosDemo = {};
function prevAvisosLer(){ if (demoOn) return prevAvisosDemo; try { return JSON.parse(localStorage.getItem(PREV_AVISOS_KEY)) || {}; } catch(e){ return {}; } }
function prevAvisosGuardar(o){ if (demoOn){ prevAvisosDemo = o; return; } try { localStorage.setItem(PREV_AVISOS_KEY, JSON.stringify(o)); } catch(e){} }
// Sufixo guardado de cada ponto (passou continua "100", como antes da 1.90).
const PREV_MARCA = {'50':'50', '80':'80', '90':'90', chegou:'chegou', passou:'100', fim:'fim'};
const prevPontos = () => Array.isArray(db.prefs.prevPontos) ? db.prefs.prevPontos : PREV_PONTOS_PADRAO;
function prevAvisosNovos(hoje = today()){
  const vistos = prevAvisosLer(), novos = [], velho = addMonths(hoje[0], -3), pontos = prevPontos();
  for (const k of Object.keys(vistos)) if (k.split(':')[1] < velho) delete vistos[k];
  for (const m of [addMonths(hoje[0], -1), hoje[0]]) for (const it of previsoesDoMes(m)){
    const k = it.p.id + ':' + m + ':', nome = prevNome(it.cat), g = prevGasto(it), dif = round2(g - it.value), dest = {k:'prev', id:it.p.id, m};
    if (!prevAtiva(it, hoje)){
      if (vistos[k + 'fim']) continue;
      for (const p of Object.values(PREV_MARCA)) vistos[k + p] = 1;
      if (!pontos.includes('fim')) continue;
      const [y, mo] = m.split('-').map(Number);
      novos.push({t:new Date(y, mo - 1, it.dia, 23, 59).getTime(), tipo:dif > 0 ? 'aviso' : 'sucesso', dest,
        txt:dif < 0 ? `Previsão de ${nome} encerrada: você gastou ${fmtTexto(g)} de ${fmtTexto(it.value)}. Sobraram ${fmtTexto(-dif)}, e o valor do mês foi atualizado.`
          : dif > 0 ? `Previsão de ${nome} encerrada: você gastou ${fmtTexto(g)}, ${fmtTexto(dif)} acima do previsto. O valor do mês foi atualizado.`
          : `Previsão de ${nome} encerrada: você gastou exatamente o previsto.`});
    } else if (m === hoje[0]){
      const pct = g / it.value * 100;
      const alcancados = ['50', '80', '90', 'chegou', 'passou'].filter(p => p === 'passou' ? pct > 100 : p === 'chegou' ? pct >= 100 : pct >= +p);
      const topo = alcancados.filter(p => pontos.includes(p)).pop();
      if (!topo || vistos[k + PREV_MARCA[topo]]) continue;
      for (const p of alcancados) vistos[k + PREV_MARCA[p]] = 1;
      novos.push({t:Date.now(), tipo:'aviso', dest,
        txt:topo === 'passou' ? `Previsão de ${nome}: você passou do previsto. Gastou ${fmtTexto(g)} de ${fmtTexto(it.value)}, ${fmtTexto(dif)} acima.`
        : topo === 'chegou' ? `Previsão de ${nome}: você chegou no previsto (${fmtTexto(it.value)}).`
        : `Previsão de ${nome}: você já gastou ${Math.round(pct)}% do previsto (${fmtTexto(g)} de ${fmtTexto(it.value)}).`});
    }
  }
  prevAvisosGuardar(vistos);
  return novos.sort((a, b) => a.t - b.t);
}
// Orçamento: 80% e estouro do limite de uma categoria no mês atual, uma vez cada, só na central (a tela já mostra).
function orcAvisos(hoje = today()){
  const vistos = prevAvisosLer(), m = hoje[0];
  for (const b of budgetStatus(m)){
    const k = 'orc:' + m + ':' + b.cat + ':', nome = (CAT_GASTO[b.cat] || CAT_GASTO.outros)[1], dest = {k:'orc', m};
    if (b.pct > 100 && !vistos[k + '100']){ vistos[k + '100'] = vistos[k + '80'] = 1;
      centralAdd(`Orçamento de ${nome} estourou: ${fmtTexto(b.used)} de ${fmtTexto(b.lim)}.`, 'aviso', 0, dest); }
    else if (b.pct >= 80 && b.pct <= 100 && !vistos[k + '80']){ vistos[k + '80'] = 1;
      centralAdd(`Orçamento de ${nome}: ${Math.round(b.pct)}% do limite usado (${fmtTexto(b.used)} de ${fmtTexto(b.lim)}).`, 'aviso', 0, dest); }
  }
  prevAvisosGuardar(vistos);
}
function prevAvisos(){
  orcAvisos();
  const novos = prevAvisosNovos();
  if (!novos.length) return novos;
  // Cada um vai para a central de notificações com o horário do acontecimento; na tela, só o último (ou quantos foram).
  for (const a of novos){
    centralAdd(a.txt, a.tipo, a.t, a.dest);
    if (temNativo('notificar') && podeNotificar('prev')) nativo('notificar', 'Previsão de gastos', a.txt);
  }
  toast(novos.length === 1 ? novos[0].txt : `${novos.length} avisos das suas previsões de gastos.`, {central:false});
  return novos;
}
