// Cofrim — O que roda quando o app abre.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
// ---------- Início ----------
document.getElementById('gateLogo').innerHTML = iconeSvg('indigo', 'b', 92); // o ícone do Cofrim
document.getElementById('lockIcon').innerHTML = I('lock', 48);
document.getElementById('fabChat').innerHTML = I('chat', 26);
document.getElementById('ptr').innerHTML = I('refresh', 22);
document.getElementById('lockX').innerHTML = I('close', 20);
// Cada passo da abertura protegido: um erro num deles (dado inesperado) é registrado no Diagnóstico e o app abre do
// mesmo jeito, em vez de ficar preso na tela de abertura.
const seguro = (onde, fn) => { try { fn(); } catch(e){ logErr('abertura: ' + onde, e); } };
seguro('lembretes', lembMigrar); // interruptor dos lembretes deste aparelho: decidido na primeira abertura (antes da sincronização)
seguro('virada do mês', rollover);
// Atalhos do lado nativo: "gasto" (botão "+ Gasto" do widget) abre o formulário de novo gasto; "sugestao:<t>" (toque na
// notificação de gasto encontrado ou numa sugestão do widget Mascote e gastos) abre o formulário já preenchido com aquela
// sugestão; "sugestoes" (selo do widget) abre a tela Sugestões de gasto. Sem conta ou na demonstração, só abre o app.
function onAtalho(){
  const a = window.Android && Android.atalho ? Android.atalho() : '';
  if (!a || needGate()) return;
  if (a.startsWith('sugestao:')) return demoOn ? undefined : abrirSugestao(a.slice(9));
  if (a === 'sugestoes') return demoOn ? undefined : (closeForm(), openSugestoes());
  if (a !== 'gasto') return;
  closeForm(); state.tab = visTabs().includes('gastos') ? 'gastos' : state.tab; state.gsub = 'mes'; state.month = curYM;
  render(); openForm('expenses');
}
seguro('modo divertido', funVisit);
if (lang() !== 'pt') seguro('idioma', () => { document.documentElement.lang = LOCALES[lang()]; trAll(); }); // partes fixas da página (login, bloqueio)
seguro('tela', render);
seguro('tema do dia', sorteioDoDia); // tema ou cor do dia, se ligado: troca antes de a abertura e as telas aparecerem
seguro('abertura', abertura);
restoreFromIdb();
save(false);
updateRates();
refreshQuotes();
if (needGate()){
  // Sem conta não há dados a proteger: desliga o bloqueio que tenha ficado ligado de antes (sair() desliga no lado nativo).
  if (canSync() && Android.bloqueio && Android.bloqueio() && Android.sair) Android.sair();
  showGate();
} else {
  // Quem já usava o app antes do aviso de conta nova: a conta atual vira a "última usada", sem repetir as boas-vindas.
  if (canSync() && !sync.account && Android.conta && Android.conta()){ sync.account = Android.conta(); saveSync(); }
  netConferir(); // sem internet ao abrir: aviso (com internet, nada)
  syncNow(); aposAbertura(() => { startSheets(); onFoto(); onAtalho(); prevAvisos(); webVerificar(); }); // depois da animação de abertura; o convite do bloqueio vem no fim das telas de início
}
let saiuEm = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ saiuEm = Date.now(); return; }
  // Conversa do assistente: recomeça cada vez que o app é aberto (voltar depois de mais de meio minuto fora conta como abrir).
  if (saiuEm && Date.now() - saiuEm > 30e3){ chatLog.length = 0; chatEntries.length = 0; }
  if (saiuEm && Date.now() - saiuEm >= 30 * 60e3) webVerificar(); // 30 min fora conta como abrir: procura atualização (no APK, o lado nativo procura)
  now = new Date();
  curYM = ymOf(now.getFullYear(), now.getMonth());
  funVisit();
  if (sorteioDoDia()) toast(`${db.prefs.sorteio === 'tema' ? 'Tema' : 'Cor'} de hoje: ${sorteioNome()}`); // virou o dia com o app aberto
  rollover();
  if (!sheetOpen()) render();
  updateRates();
  refreshQuotes();
  if (!needGate()){ syncNow(); prevAvisos(); } // previsões: o dia final pode ter passado com o app fechado
});
// Conta compartilhada com o app aberto: confere a cada minuto o que as outras pessoas lançaram (sem isso, só ao abrir e
// ao alterar algo). Com o app fechado, quem confere é o lado nativo (ShareReceiver).
// Na conta pessoal de quem tem conta compartilhada, só espia a planilha (espiarComp), sem misturar os dados.
if (!window.TESTE) setInterval(() => { if (document.hidden || navigator.onLine === false || needGate()) return; if (shared()) syncNow(); else espiarComp(); }, 60e3);
widgetFundoEnviar(); // fundo do tema para os widgets, se ainda não foi entregue
avisosConfigEnviar(); // sugestões pelas notificações: a lista de apps permitidos e os bloqueados, para o lado nativo
if (window.Android && Android.webOk) Android.webOk(); // APK: as telas abriram sem erro (confirma uma atualização recém-aplicada)
if (window.webResume) webResume(); // versão web: continua o que estava sendo feito antes de ir ao login do Google
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
