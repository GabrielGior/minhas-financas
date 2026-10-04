// Minhas Finanças — O que roda quando o app abre.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, config.js, inicio.js.
// ---------- Início ----------
document.getElementById('gateLogo').innerHTML = I('chart', 52);
document.getElementById('lockIcon').innerHTML = I('lock', 48);
document.getElementById('fabChat').innerHTML = I('chat', 26);
document.getElementById('lockX').innerHTML = I('close', 20);
rollover();
// Botão "+ Gasto" do widget: abre direto o formulário de novo gasto.
function onAtalho(){
  const a = window.Android && Android.atalho ? Android.atalho() : '';
  if (a !== 'gasto' || needGate()) return;
  closeForm(); state.tab = visTabs().includes('gastos') ? 'gastos' : state.tab; state.gsub = 'mes'; state.month = curYM;
  render(); openForm('expenses');
}
funVisit();
if (lang() !== 'pt'){ document.documentElement.lang = LOCALES[lang()]; trAll(); } // partes fixas da página (login, bloqueio)
render();
abertura();
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
  syncNow(); aposAbertura(() => { startSheets(); onFoto(); onAtalho(); }); // depois da animação de abertura; o convite do bloqueio vem no fim das telas de início
}
let saiuEm = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ saiuEm = Date.now(); return; }
  // Conversa do assistente: recomeça cada vez que o app é aberto (voltar depois de mais de meio minuto fora conta como abrir).
  if (saiuEm && Date.now() - saiuEm > 30e3){ chatLog.length = 0; chatEntries.length = 0; }
  now = new Date();
  curYM = ymOf(now.getFullYear(), now.getMonth());
  funVisit();
  rollover();
  if (!sheetOpen()) render();
  updateRates();
  refreshQuotes();
  if (!needGate()) syncNow();
});
if (window.Android && Android.webOk) Android.webOk(); // APK: as telas abriram sem erro (confirma uma atualização recém-aplicada)
if (window.webResume) webResume(); // versão web: continua o que estava sendo feito antes de ir ao login do Google
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
