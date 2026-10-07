// Cofrim — Modo demonstração, primeiro uso (login e bloqueio), nome, tutorial e backup em arquivo.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
// ---------- Modo demonstração ----------
// Para conhecer o app antes de entrar com a conta Google (botão na tela de entrada) ou, já logado, pelo Diagnóstico.
// Os dados fictícios ficam só na memória: demoOn (dados.js) bloqueia gravação, sincronização e escrita nativa. Os dados
// reais ficam guardados em demoReal (texto) e voltam exatamente iguais ao sair; fechar o app também os traz de volta,
// porque nada da demonstração é gravado.
let demoReal = null;
// ~3 meses de lançamentos com datas relativas ao mês atual, nomes genéricos (sem pessoas reais), passando por fixDb.
function demoDados(){
  let n = 0;
  const id = () => 'demo' + (++n), m = k => addMonths(curYM, k), hoje = Math.min(now.getDate(), 28);
  const dia = (k, d) => k === 0 ? Math.min(d, hoje) : d; // no mês atual, só até hoje
  const g = (desc, cat, value, k, d, mais = {}) => ({id:id(), desc, cat, value, start:m(k), day:dia(k, d), fixed:false, end:'', u:1, ...mais});
  const fixo = (desc, cat, value, due, mais = {}) => ({id:id(), desc, cat, value, start:m(-2), fixed:true, end:'', due, u:1, ...mais});
  const expenses = [
    fixo('Aluguel', 'moradia', 1450, 10, {bank:'Banco Verde', pay:'boleto'}), fixo('Internet', 'internet', 99.9, 15, {bank:'Banco Azul', pay:'credito'}),
    fixo('Streaming de filmes', 'contas', 39.9, 8, {bank:'Banco Azul', pay:'credito'}), fixo('Streaming de música', 'contas', 21.9, 20, {bank:'Banco Azul', pay:'credito'}),
    fixo('Academia', 'academia', 89.9, 5, {bank:'Banco Verde', pay:'debito'})];
  for (const k of [-2, -1, 0]) expenses.push(
    g('Mercado do Bairro', 'mercado', 412.35 + k * 18, k, 6, {bank:'Banco Azul', pay:'credito'}), g('Supermercado Central', 'mercado', 238.6 - k * 11, k, 20, {bank:'Banco Verde', pay:'debito'}),
    g('Padaria Central', 'alimentacao', 46.8, k, 3, {bank:'Banco Verde', pay:'pix'}), g('Combustível', 'combustivel', 180 + k * 12, k, 12, {bank:'Banco Azul', pay:'credito'}),
    g('Transporte por app', 'transporte', 64.5, k, 17, {bank:'Banco Azul', pay:'credito'}), g('Cinema', 'cinema', 58, k, 22, {bank:'Banco Azul', pay:'credito'}),
    g('Restaurante Sabor', 'restaurante', 96.4, k, 14, {bank:'Banco Azul', pay:'credito'}), g('Farmácia', 'farmacia', 37.9, k, 9, {bank:'Banco Verde', pay:'debito'}));
  return {
    incomes:[{id:id(), desc:'Salário', cat:'salario', value:5200, fixed:true, start:m(-2), end:'', bank:'Banco Verde', day:5, u:1},
      {id:id(), desc:'Trabalho extra', cat:'freelance', value:650, fixed:false, start:m(-1), end:'', bank:'Banco Verde', day:18, u:1}],
    expenses,
    installments:[{id:id(), desc:'Geladeira', cat:'casa', total:2400, n:10, paid:2, start:m(-2), bank:'Banco Azul', pay:'credito', u:1},
      {id:id(), tipo:'financiamento', desc:'Financiamento do carro', credor:'Financeira Exemplo', conta:'Banco Azul', cat:'transporte', total:28800, n:24, paid:12, start:m(-12), due:15, taxa:1.2, u:1}],
    accounts:[{id:id(), name:'Banco Verde', initial:2300, since:m(-2), u:1}, {id:id(), name:'Banco Azul', initial:800, since:m(-2), u:1}],
    goals:[{id:id(), name:'Reserva de emergência', target:15000, saved:6200, date:m(12), u:1}, {id:id(), name:'Viagem de férias', target:6000, saved:1800, date:m(8), u:1}],
    investments:[{id:id(), name:'CDB Banco Verde', cat:'rendafixa', value:6200, index:'cdi', pct:105, monthly:300, broker:'Corretora Alfa', accYM:m(-2), u:1},
      {id:id(), name:'Tesouro Selic', cat:'tesouro', value:3500, index:'selic', pct:100, monthly:0, broker:'Corretora Beta', accYM:m(-2), u:1},
      {id:id(), name:'LCI Banco Azul', cat:'rendafixa', value:2000, index:'cdi', pct:92, monthly:0, broker:'Corretora Alfa', accYM:m(-2), u:1}],
    transfers:[{id:id(), from:'Banco Verde', to:'Banco Azul', value:500, month:m(-1), day:6, u:1}],
    budgets:{mercado:700, restaurante:250, transporte:1500, cinema:100},
    cardClose:{'Banco Azul':25}, cardDue:{'Banco Azul':5}, cardAcc:{'Banco Azul':'Banco Azul'}, cardLimit:{'Banco Azul':4000}};
}
async function demoLigar(){
  if (demoOn) return;
  closeForm();
  clearTimeout(syncTimer);
  // Espera a sincronização ou a troca de conta em andamento (no máximo 15 s; se ainda estiverem rodando, elas desistem ao ver
  // demoOn, ver syncNow e trocarContaJa).
  for (let i = 0; i < 150 && (syncing || trocando); i++) await new Promise(r => setTimeout(r, 100));
  flushLater(); // o que estava esperando para ser gravado é dos dados reais: grava antes
  demoReal = JSON.stringify(db);
  demoOn = true;
  // Na demonstração, o Resumo completo: todos os blocos, para mostrar tudo o que o app oferece.
  loadDb({...demoDados(), prefs:{...db.prefs, name:'', greet:'', resumo:Object.keys(RESUMO).map(k => ({k, on:true})), resumoEnxuto:false, resumoAuto:[]}}); rollover();
  chatLog.length = 0; state.tab = 'resumo'; state.month = curYM; state.year = +curYM.slice(0, 4);
  document.getElementById('gate').hidden = true;
  demoFaixa(); render(); scrollTo(0, 0);
}
// Volta aos dados reais, exatamente como estavam (sem gravar nada: eles nunca saíram do aparelho).
function demoSair(){
  if (!demoOn) return;
  const real = JSON.parse(demoReal);
  demoReal = null; demoOn = false;
  loadDb(real);
  chatLog.length = 0; state.tab = 'resumo'; state.month = curYM; state.year = +curYM.slice(0, 4);
  closeForm(); demoFaixa(); render(); scrollTo(0, 0);
  if (needGate()) return showGate();
  scheduleReminders(); updateWidget(); syncNow();
}
// "Entrar com Google" na faixa: os dados fictícios são descartados antes; nada deles vai para a conta.
function demoEntrar(){ demoSair(); if (needGate()) loginGoogle(); }
// Faixa fixa no topo enquanto durar a demonstração.
function demoFaixa(){
  const el = document.getElementById('demo');
  document.documentElement.classList.toggle('demo', demoOn);
  el.hidden = !demoOn;
  el.innerHTML = !demoOn ? '' : `<span>Modo demonstração – dados fictícios</span>${canSync() && sync.linked ? '<button data-onclick="demoSair()">Sair da demonstração</button>' : '<button data-onclick="demoEntrar()">Entrar com Google</button>'}`;
}

// ---------- Primeiro uso: login obrigatório e convite para ligar o bloqueio ----------
const needGate = () => demoOn ? false : canSync() ? !sync.linked : isPreview && !sync.demo;
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
    // Quem nunca usou o app (conta sem nenhum dado): sem a tela de novidades, que só faz sentido para quem já usava.
    if (sync.forceNews && contaVazia()) semNovidades();
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
    ${WELCOME.map(([ic, t, s, ok], i) => `<div class="item" data-onclick="welcomeGo(${i})">${tile(ic)}<div class="mid"><b>${i + 1}. ${t}</b><small>${s}</small></div><span class="${ok() ? 'in' : 'muted'}">${I(ok() ? 'checked' : 'unchecked', 26)}</span></div>`).join('')}
    <div class="btns foot"><button class="btn primary" data-onclick="welcomeDone()">${feitos === WELCOME.length ? 'Concluir' : 'Pular por agora'}</button></div>`);
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
  const opcoes = () => [['o', 'Masculino'], ['a', 'Feminino'], ['e', 'Prefiro não dizer']].map(([k, t]) => `<button type="button" class="btn ${nameGreet === k ? 'primary' : ''}" style="padding:11px 4px" data-onclick="nameGreet='${k}';this.parentNode.querySelectorAll('.btn').forEach(b=>b.classList.toggle('primary',b===this))">${t}</button>`).join('');
  showSheet(`<h3>Como você quer ser chamado?</h3>
    <div class="hint" style="margin-top:0">O nome aparece no topo do Resumo e nas mensagens do app. Fica só neste app: numa conta compartilhada, cada pessoa vê o próprio nome no seu celular.</div>
    <label for="nmIn">Seu nome</label>
    <input id="nmIn" type="text" maxlength="30" autocomplete="given-name" value="${esc(sugestao)}" data-onkeydown="if(event.key==='Enter')nameSave(${!!daConfig})">
    <label>Sexo</label>
    <div class="btns" style="margin-top:0">${opcoes()}</div>
    <div class="err" id="nmErr"></div>
    <div class="btns foot">${daConfig ? `<button class="btn" data-onclick="openSettings('perfil')">Cancelar</button>` : ''}<button class="btn primary" data-onclick="nameSave(${!!daConfig})">${daConfig ? 'Salvar' : 'Continuar'}</button></div>`);
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
  ['piggy', () => `${greeting() || 'Boas-vindas!'}`, 'Este é o Cofrim: seus ganhos, gastos, contas e investimentos num lugar só, salvos na sua conta Google. Veja em um minuto como usar.'],
  ['plus', 'Lançar é rápido', 'Toque no + (ou nos atalhos do Resumo) e informe só o valor e a categoria; o resto fica em "Mais opções". Os gastos que você mais repete viram botões.'],
  ['chart', 'Resumo', 'Gastos do mês e do ano, contas a vencer, gastos por categoria e contas bancárias. Há muito mais (previsão, gráficos, metas, investimentos): toque em "Ver mais informações no resumo", no fim da tela, ou no botão de ajustes, no topo.'],
  ['receipt', 'Gastos do mês', 'Separados em Assinaturas, Fixos e anuais, Parceladas e Ocasionais, com busca e filtros. Deslize um lançamento para a esquerda para excluir; numa conta com vencimento, para a direita marca como paga.'],
  ['card', 'Parcelas e financiamentos', 'Em Gastos › Parceladas, cadastre compras parceladas, financiamentos e empréstimos. Toque num item para ver o saldo devedor e todas as parcelas, pagar, abater ou exportar em PDF.'],
  ['trend', 'Investimentos e metas', 'Cadastre aplicações, ações e metas. O app projeta quanto vão render com CDI, Selic e IPCA e mostra quanto falta para cada meta.'],
  ['chat', 'Assistente', 'Pergunte "quanto gastei com mercado este mês?" ou escreva "gastei 30 no almoço" para lançar sem abrir formulário.'],
  ['calendar', 'Lembretes', 'Começam desligados neste aparelho. Ligue em Configurações › Lembretes (o Android pede a permissão de notificações) e escolha os tipos: contas a vencer, antes e no dia, e parcelas de financiamentos. Desligue a economia de bateria do app para os avisos chegarem na hora.'],
  ['people', 'Sua conta e a conta compartilhada', 'Tudo sincroniza com a sua conta Google, com uma cópia por dia. Em Configurações > Conta compartilhada, dá para dividir os dados com outra pessoa.'],
  ['gear', 'Do seu jeito', 'Tema, cores, abas do menu, bloqueio com senha, widgets na tela inicial (com ou sem os valores) e o modo divertido, com mais de 100 conquistas. Tudo em Configurações.']];
function openTour(i, daConfig){
  settingsOpen = false; F = null;
  const [ic, t, s] = TOUR[i], ult = i === TOUR.length - 1;
  showSheet(`<div class="tour"><span class="tourIco">${I(ic, 40)}</span>
    <h3>${typeof t === 'function' ? t() : t}</h3><p>${s}</p>
    <div class="dots">${TOUR.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="btns foot">${i ? `<button class="btn" data-onclick="openTour(${i - 1},${!!daConfig})">Voltar</button>` : `<button class="btn" data-onclick="tourDone(${!!daConfig})">Pular</button>`}
      <button class="btn primary" data-onclick="${ult ? `tourDone(${!!daConfig})` : `openTour(${i + 1},${!!daConfig})`}">${ult ? 'Começar' : 'Próximo'}</button></div>`);
}
function tourDone(daConfig){
  sync.tour = true; saveSync();
  if (daConfig) openSettings('perfil'); else { closeForm(); startSheets(); }
}
// Novidades: mostradas uma vez quando o app abre numa versão diferente da última usada neste aparelho.
const VER_KEY = 'financas-versao';
// Última versão publicada antes de a versão vista ir também para os dados da conta (db.verVista): quem reinstala vindo
// dela ou de antes não tem registro em lugar nenhum e vê as novidades a partir daqui.
const NOV_SEM_REGISTRO = '1.66';
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
    const j = await comCarga('Procurando atualização…', async () => (await fetch('https://raw.githubusercontent.com/cofrim/cofrim-updater/main/versao.json?t=' + Date.now(), {cache:'no-store'})).json());
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
    <div class="hint" style="margin-top:0">${url ? 'Esta atualização precisa ser instalada: o app baixa o arquivo e o Android pede sua confirmação. Seus dados continuam no aparelho e na sua conta.' : 'A atualização já foi baixada. Seus dados não mudam.'}</div>
    ${updNews(novas)}
    <div class="btns foot"><button class="btn" data-onclick="closeForm()">Depois</button><button class="btn primary" data-onclick="updateNow()">${url ? 'Baixar e instalar' : 'Atualizar agora'}</button></div>`);
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
  if (updUrl) return Android.instalarApk ? Android.instalarApk(updUrl) : Android.abrir(updUrl);
  try { localStorage.setItem(VER_KEY, updVer); } catch(e){} // a prévia já mostrou as novidades: não repete ao recarregar
  Android.recarregar();
}
// Andamento do APK novo baixado pelo próprio app (Android.instalarApk): baixando, permissao (a pessoa precisa liberar
// "instalar apps desconhecidos" na tela que abriu), pronto (abriu a instalação do Android) ou erro.
let apkCarga = null;
function onApkEstado(e){
  if (apkCarga){ apkCarga(); apkCarga = null; }
  if (e === 'baixando') apkCarga = cargaOn('Baixando a atualização…');
  else if (e === 'permissao') tell('Para instalar, o Android pede uma permissão: na tela que abriu, ligue "Permitir desta fonte" para o Cofrim e volte ao app.');
  else if (e === 'erro') ask('Não foi possível baixar a atualização agora. Quer baixar pelo navegador?', 'Abrir no navegador').then(sim => { if (sim) Android.abrir(updUrl); });
}
// Conta sem nada lançado nem versão vista: é a primeira vez da pessoa no app.
const contaVazia = () => !db.verVista && COLS.every(c => !db[c].length);
// Marca a versão atual como vista, sem mostrar as novidades (primeira entrada de quem nunca usou o app).
function semNovidades(){
  sync.forceNews = false; saveSync();
  try { localStorage.setItem(VER_KEY, APP_VERSION); } catch(e){}
  if (db.verVista !== APP_VERSION && !demoOn){ db.verVista = APP_VERSION; save(); }
}
// Número de uma versão, para comparar ("1.9" < "1.40").
const verNum = v => String(v).split('.').reduce((a, n) => a * 1000 + (+n || 0), 0);
// sempre = aberta pelas Configurações; sync.forceNews = conta nova neste aparelho (mostra mesmo sem versão nova).
function maybeNews(sempre){
  let last = null;
  try { last = localStorage.getItem(VER_KEY); localStorage.setItem(VER_KEY, APP_VERSION); } catch(e){}
  // Reinstalação ou celular novo: este aparelho não sabe a versão anterior, mas os dados da conta (que voltam do Drive)
  // guardam a última que a pessoa viu. Sem esse registro e com dados, ela vem da 1.66 ou de antes.
  if (!last) last = db.verVista || (db.expenses.length || db.incomes.length ? NOV_SEM_REGISTRO : null);
  if (db.verVista !== APP_VERSION && !demoOn){ db.verVista = APP_VERSION; save(); }
  if (!sempre && !sync.forceNews && (last === APP_VERSION || (!last && !db.expenses.length && !db.incomes.length))) return false;
  if (sync.forceNews){ sync.forceNews = false; saveSync(); }
  settingsOpen = false; F = null;
  // Só o que é novo para esta pessoa: as versões depois da última que ela usou (numa conta nova ou pelas
  // Configurações, só a versão atual).
  const desde = !sempre && last && verNum(last) < verNum(APP_VERSION) ? verNum(last) : verNum(APP_VERSION) - 1;
  const novas = Object.entries(NOVIDADES).filter(([v]) => verNum(v) > desde && verNum(v) <= verNum(APP_VERSION)).sort((a, b) => verNum(b[0]) - verNum(a[0]));
  showSheet(`<h3>Novidades da versão ${APP_VERSION}</h3>
    ${novas.length ? novas.map(([v, lista]) => (novas.length > 1 ? `<label>Versão ${v}</label>` : '') + newsHtml(lista)).join('') : '<div class="hint" style="margin-top:0">Correções e pequenas melhorias.</div>'}
    <div class="btns foot"><button class="btn primary" data-onclick="${sempre ? "openSettings('perfil')" : 'closeForm();askLock()'}">Entendi</button></div>`);
  return true;
}
// Folhas que abrem sozinhas ao iniciar, uma depois da outra: nome, tutorial (uma vez por conta), primeiros passos
// (app vazio) e novidades (versão nova ou conta nova).
function startSheets(){
  if (window.TESTE) return;
  if (canSync() && !sync.askedShare && !sync.shared) return askShare();
  if (!db.prefs.name) return askName();
  if (!sync.tour) return openTour(0);
  if (!maybeWelcome() && !maybeNews() && !avisoLembretes()) askLock();
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
  if (demoOn){ input.value = ''; return demoBloqueia(); }
  const file = input.files && input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onerror = () => { logErr('importar backup', 'leitura: ' + ((r.error && r.error.message) || r.error)); tell(LER_ERRO); input.value = ''; };
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result);
      if (!Array.isArray(d.incomes) || !Array.isArray(d.expenses)) throw 0;
      if (newerDb(d)) return tell('Este backup foi feito por uma versão mais nova do app. Atualize o app para importar.');
      if (!await ask('Substituir todos os dados atuais pelos do backup?', 'Substituir', true)) return;
      // Como restaurar uma versão salva: o que veio do arquivo fica como "alterado agora" e o que existe hoje mas não está
      // nele é marcado como excluído. Sem isso, a próxima sincronização trazia de volta da conta tudo o que não estava no
      // arquivo, e a troca não valia nos outros aparelhos.
      applySnapshot(fixDb(d));
    } catch(e){ if (e !== 0) logErr('importar backup', e); tell('Arquivo de backup inválido.'); }
    input.value = '';
  };
  try { r.readAsText(file); } catch(e){ logErr('importar backup', e); tell(LER_ERRO); input.value = ''; }
}
