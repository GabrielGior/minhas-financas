// Cofrim — A nuvem ao lado do título (estado, folha com causas e soluções, histórico) e o aviso de sem internet.
// Depende de sincronizacao.js.
// Saiu de js/sincronizacao.js (só mudou de arquivo); carregado logo depois dele no index.html.

// ---------- Ícone do estado da sincronização (topo das telas principais) ----------
// ok: tudo na conta; sinc: sincronizando; pend: alterações esperando (com internet); off: sem internet; erro: a última
// tentativa falhou. sync.pend conta as gravações feitas desde a última sincronização que deu certo. Sem conta ou na
// demonstração, nada.
function nuvemEstado(){
  if (demoOn || !canSync() || !sync.on) return '';
  return syncing ? 'sinc' : !netOk ? 'off' : sync.err ? 'erro' : sync.pend > 0 ? 'pend' : 'ok';
}
const NUVEM_ICONE = {ok:'nuvemOk', sinc:'cloud', pend:'nuvemPend', off:'nuvemOff', erro:'nuvemErro'};
const haQuanto = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'agora há pouco' : m < 60 ? `há ${m} minuto${m > 1 ? 's' : ''}` : m < 1440 ? `há ${Math.round(m / 60)} hora${m >= 90 ? 's' : ''}` : 'em ' + new Date(t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}); };
function nuvemTexto(){
  const e = nuvemEstado(), n = sync.pend || 0, onde = shared() ? 'na conta compartilhada' : 'no seu Google Drive';
  return e === 'sinc' ? 'Sincronizando…'
    : sync.pausa ? PAUSA_MSG : e === 'erro' ? 'Erro ao sincronizar: ' + sync.err
    : !netOk ? (n ? `${n} ${n > 1 ? 'alterações esperando' : 'alteração esperando'} a internet` : 'Sem internet. O que você lançar fica salvo neste aparelho.')
    : e === 'pend' ? `${n} ${n > 1 ? 'alterações esperando' : 'alteração esperando'} para sincronizar`
    : `Tudo salvo ${onde}` + (sync.at ? ' · ' + haQuanto(sync.at) : '');
}
// A nuvem fica logo depois do título da tela (pequena, na altura do texto; a área de toque tem 44 px).
const nuvemBtn = () => { const e = nuvemEstado();
  return e ? `<button class="nuvem ${e}" data-onclick="openNuvem()" aria-label="Sincronização: ${esc(nuvemTexto())}">${I(NUVEM_ICONE[e], 22)}</button>` : ''; };
// Centro de massa da área preenchida da nuvem (viewBox 24 x 24; ver ICONS.nuvemOk): é ele, e não o centro da caixa,
// que fica no meio da última letra do título.
const NUVEM_CY = 12.527;
// Põe o centro de massa da nuvem exatamente no meio entre o topo e o fim da tinta da última letra do título (medida da
// própria letra, com a fonte da tela). O botão fica apoiado na linha de base; o deslocamento vai em em, para continuar
// certo com outro tamanho de texto.
let nuvemCanvas = null;
function nuvemAlinhar(raiz = document){
  for (const b of raiz.querySelectorAll('h1 .tit > .nuvem')){
    const tit = b.parentElement, txt = [...tit.childNodes].reverse().find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (!txt) continue;
    const cs = getComputedStyle(tit), fs = parseFloat(cs.fontSize), alto = parseFloat(getComputedStyle(b).height); // em px de CSS (sem o zoom do texto)
    let ch = txt.nodeValue.trim().slice(-1);
    if (cs.textTransform === 'uppercase') ch = ch.toUpperCase();
    const g = (nuvemCanvas = nuvemCanvas || document.createElement('canvas').getContext('2d'));
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = g.measureText(ch), meio = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2; // acima da linha de base
    const desce = alto * (1 - NUVEM_CY / 24) - meio;
    b.style.transform = `translateY(${(desce / fs).toFixed(4)}em)`;
  }
}
// Troca só o ícone (sem redesenhar a tela) e, com a folha da nuvem aberta, o texto dela.
function nuvemDraw(){
  for (const b of document.querySelectorAll('.nuvem')) b.outerHTML = nuvemBtn();
  nuvemAlinhar();
  if (document.querySelector('#sheet .nuvemTxt') && sheetOpen()) openNuvem();
}
// Folha da nuvem: o estado no topo (mesmo ícone e cor da nuvem), o erro em palavras simples num cartão que abre as
// causas e soluções, e o histórico da sincronização (que não vai para a central nem tem número no ícone). O detalhe
// técnico (status e resposta do Google) não aparece aqui: fica só no Diagnóstico.
const nuvemFrase = e => e === 'sinc' ? 'Sincronizando…' : e === 'erro' ? 'Erro ao sincronizar' : e === 'off' || !netOk ? 'Sem internet. O que você lançar fica salvo neste aparelho.'
  : e === 'pend' ? `${sync.pend} ${sync.pend > 1 ? 'alterações esperando' : 'alteração esperando'} para sincronizar`
  : `Tudo salvo ${shared() ? 'na conta compartilhada' : 'no seu Google Drive'}` + (sync.at ? ' · ' + haQuanto(sync.at) : '');
function openNuvem(){
  settingsOpen = false; F = null;
  const e = nuvemEstado(), log = nuvemLogLer().slice().sort((a, b) => b.t - a.t).slice(0, 30);
  const hoje = centralDia(Date.now()), ontem = centralDia(Date.now() - 864e5);
  let dia = '', hist = '';
  for (const x of log){
    const d = centralDia(x.t), [ic, cor] = CENTRAL_TIPOS[x.tipo] || CENTRAL_TIPOS.info;
    if (d !== dia){ dia = d; hist += `<label>${d === hoje ? 'Hoje' : d === ontem ? 'Ontem' : new Date(x.t).toLocaleDateString('pt-BR')}</label>`; }
    hist += `<div class="semCursor item"><span class="centralIco" style="color:${cor}">${I(ic, 18)}</span><div class="mid"><b style="white-space:normal;font-weight:600">${esc(x.txt)}</b><small>${centralQuando(x.t)}${x.n > 1 ? ` · ${x.n} vezes` : ''}</small></div></div>`;
  }
  showSheet(`<h3>${I('cloud', 22)} Sincronização</h3>
    <div class="nuvemEstado ${e}">${e ? I(NUVEM_ICONE[e], 24) : ''}<b class="nuvemTxt">${esc(nuvemFrase(e))}</b></div>
    ${e === 'erro' && sync.err ? `<div class="item nuvemErroCard" data-onclick="openNuvemCausas()"><span class="centralIco">${I('alert', 20)}</span><div class="mid"><b class="quebra">${esc(sync.err)}</b><small>Possíveis causas e soluções</small></div><span class="centralVai">${I('chev', 16)}</span></div>` : ''}
    ${pausaHtml()}
    <div class="hint">Última sincronização: ${sync.at ? new Date(sync.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : 'ainda nenhuma'}</div>
    ${hist ? `<details class="grp"><summary>Histórico da sincronização<small>${log.length}</small>${I('chev')}</summary>${hist}</details>` : ''}
    <div class="btns foot"><button class="btn" data-onclick="closeForm()">Fechar</button><button class="btn primary" ${e === 'sinc' ? 'disabled' : ''} data-onclick="nuvemSincronizar()">${I('refresh')}Sincronizar agora</button></div>`);
}
// "Sincronizar agora" da folha: sincroniza e atualiza a tela aberta como o "puxar para atualizar" (cotações, taxas,
// sugestões do banco); o resultado aparece na própria folha, que se redesenha.
async function nuvemSincronizar(){
  if (demoOn) return tell(DEMO_MSG);
  now = new Date(); curYM = ymOf(now.getFullYear(), now.getMonth());
  rollover(); updateRates(); refreshQuotes();
  await syncNow(true);
  render();
  if (sheetOpen() && document.querySelector('#sheet .nuvemTxt')) openNuvem();
  toast(sync.err ? 'Não foi possível sincronizar.' : 'Sincronizado agora.', {central:false});
}
// Tipo do erro da sincronização (sync.errTipo), gravado junto com o texto (sync.err).
const erroTipo = e => e.status === -7 ? 'pausa' : e.status === -8 ? 'semDados' : e.status === -3 ? 'versao'
  : shared() && sharedMsg(e) ? 'compartilhada' : e.status === -1 ? 'login'
  : e.status === 403 && /storageQuotaExceeded|storage quota/i.test(String(e.text)) ? 'espaco'
  : semPermissao(e) ? 'permissao' : e.status === 401 ? 'sessao' : e.status === 0 ? 'internet'
  : e.status === 429 || e.status >= 500 ? 'google' : 'outro';
// Possíveis causas e soluções de cada tipo de erro: [título, causas, solução, botões [texto, comando]].
const ENTRAR = ['Entrar de novo', 'closeForm();syncNow(true)'], DE_NOVO = ['Tentar de novo', 'closeForm();nuvemSincronizar()'];
const NUVEM_CAUSAS = {
  permissao:['Falta a permissão do Google Drive', ['A caixa do Google Drive foi desmarcada na tela do Google ao entrar.'],
    'Entre de novo e deixe todas as caixas marcadas na tela do Google.', [ENTRAR]],
  sessao:['A sessão do Google expirou', ['A sessão do Google expirou.', 'A senha da conta Google mudou.'], 'Entre de novo com a mesma conta Google.', [ENTRAR]],
  login:['O app saiu da conta Google', ['O app não está mais conectado à sua conta Google.'], 'Entre com a sua conta Google.',
    [['Entrar com Google', 'closeForm();syncNow(true)']]],
  internet:['Sem conexão', ['Sem internet ou Wi-Fi sem acesso.', 'Modo avião ligado.', 'Economia de dados bloqueando o app.'],
    'Confira a conexão. O que você lançar fica salvo neste aparelho e vai para a conta quando a internet voltar.', [DE_NOVO]],
  versao:['Versão mais nova em outro aparelho', ['Outro aparelho usa uma versão mais nova do Cofrim e já gravou os dados nesse formato.'],
    'Atualize o app neste aparelho.', [['Procurar atualização', 'closeForm();procurarAtualizacao()']]],
  semDados:['Dados não encontrados na conta', ['Você entrou com uma conta Google diferente.', 'Os dados do app foram apagados do Google Drive.'],
    'Confira se é a mesma conta Google de sempre. Se precisar, restaure uma cópia.', [['Versões salvas', 'openBackups()'], ['Trocar de conta', 'logout()']]],
  pausa:['Sincronização pausada', ['Os dados deste aparelho parecem incompletos perto dos da conta (bem menos lançamentos).'],
    'Para não apagar nada da conta por engano, o app espera você escolher: baixar os dados da conta ou enviar os deste aparelho mesmo assim.', []],
  espaco:['Google Drive cheio', ['O espaço da sua conta Google acabou.'],
    'Libere espaço na conta Google (e-mails, fotos e arquivos grandes) e tente de novo.', [DE_NOVO]],
  google:['Google instável', ['O Google está instável ou recebeu pedidos demais.'], 'Espere alguns minutos: o app tenta de novo sozinho.', [DE_NOVO]],
  compartilhada:['Problema na conta compartilhada', ['A conta compartilhada foi encerrada.', 'O seu acesso a ela foi removido.'],
    'Confira a conta compartilhada nas Configurações (dá para voltar à conta pessoal).', [['Abrir conta compartilhada', "openSettings('compart')"]]],
  outro:['Erro desconhecido', ['A causa não foi identificada.'],
    'Tente de novo. Se continuar, abra o Diagnóstico e envie o relatório para quem dá suporte.', [DE_NOVO, ['Abrir Diagnóstico', 'diagOpen()']]]
};
function openNuvemCausas(){
  const [titulo, causas, solucao, botoes] = NUVEM_CAUSAS[sync.errTipo] || NUVEM_CAUSAS.outro;
  showSheet(`<h3>${I('alert', 22)} ${esc(titulo)}</h3>
    <div class="hint" style="margin-top:0;color:var(--out)">${esc(sync.err || '')}</div>
    <label>Possíveis causas</label><ul class="causas">${causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <label>O que fazer</label><div class="semTopo hint">${esc(solucao)}</div>
    ${sync.errTipo === 'espaco' ? '<div class="btns"><a class="btn" href="https://one.google.com/storage" target="_blank" rel="noopener">Ver o espaço da conta Google</a></div>' : ''}
    ${sync.errTipo === 'pausa' ? pausaHtml() : ''}
    ${botoes.length ? `<div class="btns">${botoes.map(([t, c], i) => `<button class="btn ${i ? '' : 'primary'}" data-onclick="${c}">${t}</button>`).join('')}</div>` : ''}
    <div class="btns foot"><button class="btn" data-onclick="openNuvem()">Voltar</button></div>`);
}
// ---------- Histórico da sincronização ----------
// Os avisos da sincronização (efetuada, erro, alterações vindas de outro aparelho, cópia do dia: destino {k:'sync'})
// ficam aqui, não na central de notificações: aparecem na folha da nuvem, sem número no ícone. Como na central, avisos
// iguais no mesmo dia viram um item (n = quantas vezes). Até 60 itens e 30 dias; na demonstração, só na memória.
const NUVEM_LOG_KEY = 'financas-nuvem-log';
let nuvemLogDemo = [];
function nuvemLogLer(){ if (demoOn) return nuvemLogDemo;
  try { const l = JSON.parse(localStorage.getItem(NUVEM_LOG_KEY)); return Array.isArray(l) ? l : []; } catch(e){ return []; } }
function nuvemLogGuardar(l){
  const lim = Date.now() - 30*864e5;
  l = l.filter(x => x.t >= lim).sort((a, b) => a.t - b.t).slice(-60);
  if (demoOn) nuvemLogDemo = l; else try { localStorage.setItem(NUVEM_LOG_KEY, JSON.stringify(l)); } catch(e){}
}
function nuvemLogAdd(txt, tipo, t, n = 1){
  t = t || Date.now();
  const l = nuvemLogLer(), igual = l.find(x => x.txt === txt && centralDia(x.t) === centralDia(t));
  if (igual){ igual.n = (igual.n || 1) + n; igual.t = Math.max(igual.t, t); }
  else l.push({txt, tipo:tipo || centralTipo(txt), t, n});
  nuvemLogGuardar(l);
}
// semConta: o Resumo já mostra a conta em uso no botão Pessoal / Compartilhada, então dispensa a faixa.
// (A falta de internet tem aviso próprio, #net, logo abaixo.)
const offlinePill = semConta => semConta ? '' : contaPill();
// ---------- Aviso de sem internet e de internet de volta ----------
// Só com o app aberto e visível, sem notificação do sistema. Uma mudança só vale depois de NET_FIRME no mesmo estado
// (conexão instável não gera avisos repetidos). O aviso de sem internet fica no topo enquanto durar, sem bloquear o uso;
// "Internet de volta" aparece por alguns segundos, só para quem viu o de sem internet, e dispara a sincronização.
// Mudança com o app em segundo plano não gera aviso: ao voltar, só aparece o de sem internet, se ainda faltar.
// No APK quem informa é o lado nativo (onRede e Android.redeOk, pelo ConnectivityManager, só em primeiro plano); na
// versão web, navigator.onLine e os eventos online/offline.
const NET_MSG = 'Você está sem internet. Suas alterações ficam salvas e serão sincronizadas quando a conexão voltar.';
let NET_FIRME = 3000;
const netNativo = () => !!(temNativo('redeOk'));
const netAgora = () => netNativo() ? !!nativo('redeOk') : navigator.onLine !== false;
const visivel = () => document.visibilityState === 'visible';
let netOk = true, netBruto = true, netTimer = 0, netVoltaT = 0, netViuCaiu = false;
function netMostrar(tipo){
  const el = document.getElementById('net');
  if (!el) return;
  clearTimeout(netVoltaT);
  el.hidden = !tipo; el.className = tipo || ''; el.textContent = tipo === 'caiu' ? NET_MSG : tipo === 'voltou' ? 'Internet de volta' : '';
  if (tipo === 'caiu') netViuCaiu = true;
  if (tipo === 'voltou') netVoltaT = setTimeout(() => netMostrar(''), 3000);
}
function netEvento(on){ netBruto = on; clearTimeout(netTimer); netTimer = setTimeout(netFirmou, NET_FIRME); }
function netFirmou(){
  if (!visivel() || netBruto === netOk) return;
  netOk = netBruto; nuvemDraw();
  if (!netOk) return netMostrar('caiu');
  netMostrar(netViuCaiu ? 'voltou' : ''); netViuCaiu = false;
  syncNow();
}
// Começo e volta para a tela: o estado de agora, sem esperar e sem "Internet de volta" (a sincronização ao voltar para
// a tela já acontece no inicio.js).
function netConferir(){
  netOk = netBruto = netAgora(); clearTimeout(netTimer);
  netViuCaiu = false; netMostrar(netOk ? '' : 'caiu'); nuvemDraw();
}
window.onRede = on => netEvento(!!on);
addEventListener('online', () => { if (!netNativo()) netEvento(true); });
addEventListener('offline', () => { if (!netNativo()) netEvento(false); });
document.addEventListener('visibilitychange', () => { if (visivel()) netConferir(); else { clearTimeout(netTimer); netMostrar(''); } });
