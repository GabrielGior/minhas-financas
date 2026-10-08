// Cofrim — Sincronização com a conta Google, conta compartilhada, aviso de sem internet e arquivo de anos antigos.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
// ---------- Sincronização com a conta Google (só no APK) ----------
// Os dados vão para o arquivo financas.json na pasta oculta do app no Google Drive do usuário.
// O login e as chamadas de rede são feitos pelo lado nativo (Android.drive); aqui fica a lógica.
// A cada sincronização o app baixa o arquivo, junta com os dados locais registro por registro (mergeDb)
// e envia o resultado. Uma cópia por dia fica guardada por 30 dias (backup-AAAA-MM-DD.json).
const SYNC_KEY = 'financas-sync', DRIVE = 'https://www.googleapis.com';
const canSync = () => !!(window.Android && Android.drive);
let sync = {on:false, linked:false, at:0, err:'', bk:'', demo:false, lockAsked:false, up:[], del:[]}; // estado só deste aparelho, não vai para a conta
try { Object.assign(sync, JSON.parse(localStorage.getItem(SYNC_KEY))); } catch(e){}
const saveSync = () => { if (demoOn) return; try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch(e){} };
let syncing = false, syncAgain = false, syncTimer = 0, driveSeq = 0;
const drivePending = {};

function drive(method, url, body, ctype, interactive){
  if (demoOn) return Promise.resolve({status:-6, text:'demonstração'}); // nada vai para a conta Google
  return espera(new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.drive(id, method, url, body || '', ctype || '', !!interactive); }));
}
// Chamado pelo lado nativo. status: código HTTP; 0 = sem conexão; -1 = precisa entrar na conta; -2 = outro erro;
// -5 = a pessoa não deu ao app uma permissão pedida (desmarcou a caixa na tela do Google).
function onDrive(id, status, text){ const res = drivePending[id]; delete drivePending[id]; if (res) res({status, text}); }
// Erro do Google em palavras para quem usa o app. A resposta do Google (JSON) nunca vai para a tela: fica só no
// registro de erros do Diagnóstico (logErr).
const MSG_ESCOPO = 'Para guardar seus dados, o app precisa da permissão do Google Drive. Toque em "Entrar com Google" e deixe todas as caixas marcadas.';
const MSG_ESCOPO_CONTA = 'Para guardar seus dados, o app precisa da permissão do Google Drive. Toque em "Sincronizar agora" (Configurações › Conta e sincronização) e deixe todas as caixas marcadas.';
const semPermissao = e => e.status === -5 || (e.status === 403 && !/rate ?limit|quota/i.test(String(e.text)));
const erroAmigavel = e => semPermissao(e) ? 'O Google não deu ao app todas as permissões. Entre de novo com sua conta Google e deixe todas as caixas marcadas.'
  : e.status === 401 ? 'Sua sessão do Google expirou. Entre de novo com sua conta Google.'
  : e.status === 0 ? 'Sem conexão com a internet.'
  : 'Não foi possível sincronizar. Tente de novo.';
const ok = r => { if (r.status !== 200 && r.status !== 204) throw r; return r; };
const driveList = async (q, interactive, campos = '') => JSON.parse(ok(await drive('GET', `${DRIVE}/drive/v3/files?spaces=appDataFolder&pageSize=100&orderBy=name%20desc&q=${encodeURIComponent(q)}&fields=files(id,name${campos})`, '', '', interactive)).text).files;
const driveGet = async id => abreGz(JSON.parse(ok(await drive('GET', `${DRIVE}/drive/v3/files/${id}?alt=media`)).text));
// ---------- Dados comprimidos na conta ----------
// O financas.json pode ir comprimido (gzip) em base64 dentro de um JSON: {"ver":3,"gz":"..."}. A ponte do Android leva
// texto, por isso o base64. O "ver":3 faz as versões antigas do app (desde a 1.38, pelo newerDb) pedirem para atualizar
// em vez de lerem um arquivo vazio e gravarem por cima. A leitura aceita os dois formatos em qualquer arquivo; só o
// financas.json é gravado comprimido (as cópias diárias e a planilha da conta compartilhada continuam em JSON).
// Ganho medido com dados de teste: 1.240 lançamentos, de 198 KB para 35 KB.
const GZ_GRAVAR = true;
const gzTem = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function gzPassa(dados, stream){ return new Uint8Array(await new Response(new Blob([dados]).stream().pipeThrough(stream)).arrayBuffer()); }
async function fechaGz(json){
  if (!GZ_GRAVAR || !gzTem()) return json;
  const b = await gzPassa(new TextEncoder().encode(json), new CompressionStream('gzip'));
  let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return JSON.stringify({ver:3, gz:btoa(bin)});
}
async function abreGz(d){
  if (!d || typeof d.gz !== 'string') return d;
  if (!gzTem()) throw new Error('este navegador não abre dados comprimidos');
  const bin = atob(d.gz), b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(await gzPassa(b, new DecompressionStream('gzip'))));
}
// props: etiquetas guardadas junto do arquivo no Drive (appProperties), só na criação; as cópias levam a quantidade de
// lançamentos (n), para a tela "Versões salvas" mostrar sem baixar cada uma.
async function driveWrite(id, name, json, props){
  if (id) return ok(await drive('PATCH', `${DRIVE}/upload/drive/v3/files/${id}?uploadType=media&fields=id,version`, json, 'application/json'));
  const b = 'financas-boundary';
  const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name, parents:['appDataFolder'], ...(props ? {appProperties:props} : {})})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${b}--`;
  return ok(await drive('POST', `${DRIVE}/upload/drive/v3/files?uploadType=multipart&fields=id,version`, body, 'multipart/related; boundary=' + b));
}

// ---------- Conta compartilhada (casal ou família) ----------
// A pasta oculta do app no Drive é de uma conta só. Para duas contas Google verem os mesmos dados, eles ficam numa
// planilha do Google criada por quem convida e compartilhada com a outra pessoa. O JSON dos dados vai na coluna A da
// aba "dados", em pedaços (uma célula aceita até 50 mil caracteres). A junção é a mesma da sincronização normal
// (mergeDb). Fica de cada pessoa, no próprio aparelho e na própria conta: aparência e nome (prefs), cópias diárias e
// comprovantes. sync.shared = {id, owner, with:[e-mails convidados]}.
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
let PEDACO = 40000;
// "Salvar cópia no meu Google Drive": permissão de criar arquivos visíveis (drive.file). Num APK sem driveArquivo
// (anterior à 1.75), vai pelo pedido da conta compartilhada, que também a inclui.
const arq = (method, url, body, ctype) => demoOn ? Promise.resolve({status:-6, text:'demonstração'}) : espera(new Promise(res => { const id = ++driveSeq; drivePending[id] = res; (Android.driveArquivo ? Android.driveArquivo : Android.driveFamilia).call(Android, id, method, url, body || '', ctype || '', true); }));
const fam = (method, url, body, ctype, interactive) => demoOn ? Promise.resolve({status:-6, text:'demonstração'}) : espera(new Promise(res => { const id = ++driveSeq; drivePending[id] = res; Android.driveFamilia(id, method, url, body || '', ctype || '', !!interactive); }));
// sync.pessoal = a pessoa está numa conta compartilhada mas escolheu ver, por enquanto, a conta pessoal (trocarConta):
// nesse modo tudo funciona como sem conta compartilhada (os dados vêm do arquivo da conta Google dela).
const shared = () => sync.shared && !sync.pessoal && sync.shared.id;
const rng = r => encodeURIComponent(r);
// Além dos dados (aba "dados"), a aba "leia-me" guarda dois avisos: A4 = "LIMPA" (conta criada do zero: quem entra não
// leva os próprios lançamentos) e A5 = "ENCERRADA|quem|quando" (alguém saiu: a conta acabou para todos). sharedInfo
// guarda o que a última leitura encontrou. Uma conta encerrada vira o erro {status:-4, por}.
let sharedInfo = {limpa:false};
async function sharedRead(id, interactive){
  const r = JSON.parse(ok(await fam('GET', `${SHEETS}/${id}/values:batchGet?ranges=${rng('dados!A:A')}&ranges=${rng('leia-me!A4:A5')}&majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`, '', '', interactive)).text).valueRanges || [];
  const v = r[0] && r[0].values, av = (r[1] && r[1].values && r[1].values[0]) || [];
  sharedInfo = {limpa:String(av[0] || '') === 'LIMPA'};
  if (String(av[1] || '').startsWith('ENCERRADA')) throw {status:-4, por:String(av[1]).split('|')[1] || '', text:'encerrada'};
  const txt = v && v[0] ? v[0].join('') : '';
  return txt ? JSON.parse(txt) : null;
}
async function sharedWrite(id, json){
  const partes = [];
  for (let i = 0; i < json.length; i += PEDACO) partes.push([json.slice(i, i + PEDACO)]);
  ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('dados!A1:A' + partes.length)}?valueInputOption=RAW`, JSON.stringify({values:partes}), 'application/json'));
  ok(await fam('POST', `${SHEETS}/${id}/values/${rng('dados!A' + (partes.length + 1) + ':A')}:clear`, '{}', 'application/json'));
}
// Texto para comparar na conta compartilhada: a aparência (prefs) é de cada um e não conta como diferença.
const canonS = d => canon(shared() ? {...d, prefs:null} : d);
const sharedMsg = e => e.status === 403 && /SERVICE_DISABLED|has not been used|not been enabled/i.test(e.text) ? 'A API do Google Sheets não está ativada no projeto do app no Google Cloud.'
  : e.status === 403 || e.status === 404 ? 'Sem acesso à conta compartilhada: confira se o convite foi feito para esta conta Google.' : '';
const codeOf = s => (String(s).match(/\/d\/([\w-]{20,})/) || String(s).trim().match(/^([\w-]{20,})$/) || [])[1] || '';
const inviteText = id => `Te convidei para a nossa conta compartilhada no app Cofrim. No app, abra Configurações > Conta compartilhada > Tenho um convite e cole este código:\n${id}`;
// Quem lançou: registros antigos (sem by) passam a ser desta pessoa ao entrar numa conta compartilhada.
function claimMine(){ const me = myName(); if (me) for (const c of COLS) for (const r of db[c]) if (!r.by){ r.by = me; r.u = Date.now(); } }
// ---------- Pessoas e avisos da conta compartilhada ----------
// db.membros = {chave: {nome, email, desde, t}}: cada aparelho se inscreve ao sincronizar (membroEu), então a lista
// viaja junto com os dados. A chave é o e-mail da conta Google (ou o nome, se o e-mail não estiver disponível).
const membroChave = () => String((window.Android && Android.conta && Android.conta()) || myName() || 'eu').toLowerCase();
function membroEu(){
  const k = membroChave(), email = k.includes('@') ? k : '', nome = myName() || email.split('@')[0] || 'Sem nome', m = db.membros[k];
  if (m && m.nome === nome) return false;
  db.membros[k] = {nome, email, desde:(m && m.desde) || Date.now(), t:Date.now()};
  return true;
}
// O app não tem servidor: cada aparelho descobre o que os outros fizeram quando sincroniza. Ao juntar os dados, atividade()
// lista quem entrou e o que outra pessoa adicionou ou editou (gastos, ganhos e investimentos); isso vira um aviso na tela
// e fica guardado neste aparelho (ATIV_KEY). Com o app fechado, quem avisa é o lado nativo (ShareReceiver), de hora em hora.
const ATIV_KEY = 'financas-ativ', ATIV_COLS = {expenses:'o gasto', installments:'a compra parcelada', incomes:'o ganho', investments:'o investimento'};
function atividade(a, m){
  const eu = myName(), out = [];
  for (const [k, p] of Object.entries(m.membros || {})) if (!a.membros[k] && k !== membroChave()) out.push({t:p.desde || Date.now(), quem:p.nome, txt:'entrou na conta compartilhada'});
  for (const c in ATIV_COLS){
    const meus = new Map(a[c].map(r => [r.id, r.u || 0]));
    for (const r of m[c]){
      const novo = !meus.has(r.id), quem = (novo ? r.by : r.ed || r.by) || 'Alguém', v = r.value || r.total || 0;
      if ((novo || (r.u || 0) > meus.get(r.id)) && quem !== eu) out.push({t:r.u || Date.now(), quem, txt:`${novo ? 'adicionou' : 'editou'} ${ATIV_COLS[c]} ${r.desc || r.name || r.ticker || ''}`.trim() + (v ? ` (${fmt(v)})` : '')});
    }
  }
  return out.sort((x, y) => x.t - y.t);
}
function ativLista(){ try { return JSON.parse(localStorage.getItem(ATIV_KEY)) || []; } catch(e){ return []; } }
const ativGuardar = l => { try { localStorage.setItem(ATIV_KEY, JSON.stringify(l.slice(-40))); } catch(e){} };
const ativNovas = () => ativLista().filter(x => !x.visto).length;
function ativAvisar(novas){
  if (!novas.length) return;
  ativGuardar([...ativLista(), ...novas]);
  if (db.prefs.avisoComp === false) return;
  toast(novas.length === 1 ? `${sync.pessoal ? 'Conta compartilhada: ' : ''}${novas[0].quem} ${novas[0].txt}` : `${novas.length} novidades na conta compartilhada. Veja no Resumo.`, {dest:{k:'compart'}});
}
// Faixa no topo do Resumo enquanto houver novidades não vistas; tocar abre a lista.
const ativHtml = () => { const n = sync.shared && db.prefs.avisoComp !== false ? ativNovas() : 0, u = n && ativLista().pop();
  return n ? `<div class="card avisoComp" data-onclick="openAtividade()"><span>${I('bell', 20)}</span><div><b>${n === 1 ? '1 novidade' : n + ' novidades'} na conta compartilhada</b><small>${esc(u.quem)} ${esc(u.txt)}</small></div>${I('chev', 18)}</div>` : ''; };
const quando = t => new Date(t).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
function openAtividade(){
  settingsOpen = false; F = null;
  const l = ativLista().reverse();
  showSheet(`<h3>Atividade da conta compartilhada</h3>
    ${l.length ? l.map(x => `<div class="item" style="cursor:default"><span class="${x.visto ? 'muted' : 'in'}">${I(/entrou/.test(x.txt) ? 'people' : 'bell', 20)}</span><div class="mid"><b style="white-space:normal">${esc(x.quem)} ${esc(x.txt)}</b><small>${quando(x.t)}</small></div></div>`).join('')
      : '<div class="hint" style="margin-top:0">Nada por aqui ainda. Quando outra pessoa entrar na conta ou lançar algo, aparece nesta lista.</div>'}
    <div class="hint">O app confere as novidades sempre que sincroniza (ao abrir e a cada alteração) e, com ele fechado, mais ou menos de hora em hora.</div>
    <div class="btns foot">${sync.pessoal ? `<button class="btn" data-onclick="closeForm();render();trocarConta()">${I('people')}Ir para a compartilhada</button>` : ''}<button class="btn primary" data-onclick="closeForm();render()">Pronto</button></div>`);
  ativGuardar(ativLista().map(x => ({...x, visto:1})));
}
// Entrega ao lado nativo o que ele precisa para avisar com o app fechado ('' desliga).
// d = os dados da conta compartilhada: os do app ou, na conta pessoal, os que espiarComp acabou de ler da planilha.
function compNativo(d){
  if (demoOn || !(window.Android && Android.compart) || (sync.shared && sync.pessoal && !d)) return; // na conta pessoal, só espiarComp atualiza o lado nativo
  d = d || db;
  const ligado = sync.shared && db.prefs.avisoComp !== false;
  // A permissão de notificações do Android só é pedida ao ligar os lembretes deste aparelho (ver ligarLembretes);
  // com eles desligados, o lado nativo continua conferindo a conta, mas não mostra notificação.
  Android.compart(ligado ? JSON.stringify({id:sync.shared.id, eu:myName(), t:Math.max(0, ...Object.keys(ATIV_COLS).flatMap(c => d[c].map(r => r.u || 0))), membros:Object.keys(d.membros)}) : '');
}
// ---------- Na conta pessoal: espiar a conta compartilhada ----------
// Quem trocou para a conta pessoal continua sabendo o que acontece na compartilhada: a cada minuto (e a cada
// sincronização) o app lê a planilha, só para leitura, e compara com o que já tinha visto (VISTO_KEY: ids e datas de
// alteração, guardados a cada sincronização na conta compartilhada). As novidades viram o mesmo aviso e a mesma faixa
// do Resumo; nada da planilha entra nos dados pessoais.
const VISTO_KEY = 'financas-comp-visto';
const vistoDe = d => ({membros:Object.fromEntries(Object.keys(d.membros || {}).map(k => [k, 1])), ...Object.fromEntries(Object.keys(ATIV_COLS).map(c => [c, d[c].map(r => ({id:r.id, u:r.u || 0}))]))});
function vistoGuardar(d){ try { localStorage.setItem(VISTO_KEY, JSON.stringify(vistoDe(d))); } catch(e){} }
let espiando = false;
async function espiarComp(){
  if (demoOn || !sync.shared || !sync.pessoal || espiando || trocando || !canSync()) return;
  espiando = true;
  try {
    const bruto = await sharedRead(sync.shared.id), remoto = bruto && fixDb(bruto);
    if (!remoto || !sync.shared || !sync.pessoal) return;
    let visto = null;
    try { visto = JSON.parse(localStorage.getItem(VISTO_KEY)); } catch(e){}
    if (visto){ const novas = atividade(visto, remoto); if (novas.length){ ativAvisar(novas); if (!sheetOpen()) render(); } }
    vistoGuardar(remoto); compNativo(remoto);
  } catch(e){
    if (e && (e.status === -4 || e.status === 404)) shareEnded(e.por || ''); // a conta foi encerrada por outra pessoa
  } finally { espiando = false; }
}
// Estado dos avisos com o app fechado (só no app instalado): o que falta liberar no Android, quando foi a última
// conferência e o que ela achou, e os botões para testar.
function avisoNativoHtml(){
  const A = window.Android;
  if (!A || db.prefs.avisoComp === false) return '';
  if (!A.compartLog) return '<div class="hint warn">Para receber os avisos com o app fechado, instale a atualização do app (Configurações › Atualização).</div>';
  const [t, r] = String(A.compartLog()).split('|'), semPerm = !lembLigados(), economia = A.bateriaLivre && !A.bateriaLivre();
  return `${semPerm ? `<div class="hint warn">Os lembretes estão desligados neste aparelho: os avisos não aparecem como notificação.</div><div class="btns" style="margin-top:6px"><button class="btn primary" data-onclick="ligarLembretes()">Ligar lembretes</button></div>` : ''}
    ${economia ? `<div class="hint warn">O app está na economia de bateria: o Android pode atrasar ou cortar os avisos com ele fechado.</div><div class="btns" style="margin-top:6px"><button class="btn" data-onclick="Android.bateria()">Tirar da economia de bateria</button></div>` : ''}
    <div class="hint">Última conferência com o app fechado: ${t ? `${quando(+t)} — ${esc(r || '')}` : 'ainda não aconteceu'}.</div>
    ${A.compartHist && A.compartHist() ? `<details class="grp"><summary>Últimas conferências${I('chev')}</summary><div class="hint" style="margin:0 0 8px">${String(A.compartHist()).split('\n').map(l => { const i = l.indexOf('|'); return `${quando(+l.slice(0, i))} — ${esc(l.slice(i + 1))}`; }).join('<br>')}</div></details>` : ''}
    <div class="btns" style="margin-top:6px"><button class="btn" data-onclick="testarNotificacao()">Testar notificação</button><button class="btn" data-onclick="conferirNativo()">Conferir agora</button></div>`;
}
// Teste do aviso da conta compartilhada: com os lembretes deste aparelho desligados, oferece ligar.
async function testarNotificacao(){
  if (podeNotificar('compart')) return Android.notificar('Conta compartilhada', 'Teste: é assim que o aviso aparece.');
  if (await ask('Os lembretes estão desligados neste aparelho. Ligar agora?', 'Ligar')) ligarLembretes();
}
function conferirNativo(){ if (demoBloqueia()) return; Android.compartConferir(); comCarga('Conferindo a conta compartilhada…', () => new Promise(r => setTimeout(r, 6000))).then(() => { if (settingsShown()) openSettings(); }); }
// Fim da conta compartilhada neste aparelho: a lista de pessoas e os avisos dela deixam de valer.
function compFim(){ sync.pessoal = false; saveSync(); db.membros = {}; try { localStorage.removeItem(ATIV_KEY); localStorage.removeItem(VISTO_KEY); } catch(e){} compNativo(); }
function setAvisoComp(on){ setPref('avisoComp', on); compNativo(); if (on && !lembLigados()) ligarLembretes(); }
const membrosHtml = s => { const eu = membroChave(), ms = Object.entries(db.membros).sort((a, b) => a[1].desde - b[1].desde), emails = new Set(ms.map(([, m]) => m.email));
  const falta = (s.with || []).filter(e => !emails.has(e));
  return `<label>Pessoas na conta (${ms.length})</label><div class="card" style="box-shadow:none;background:var(--bg);margin:0">
    ${ms.map(([k, m]) => `<div class="item" style="cursor:default">${tile('user')}<div class="mid"><b>${esc(m.nome)}${k === eu ? ' (você)' : ''}</b><small>${m.email ? esc(m.email) + ' · ' : ''}desde ${new Date(m.desde).toLocaleDateString('pt-BR')}</small></div></div>`).join('')}
    ${falta.map(e => `<div class="item" style="cursor:default;opacity:.65">${tile('user')}<div class="mid"><b>${esc(e)}</b><small>convite enviado, ainda não entrou</small></div></div>`).join('')}
    ${ms.length ? '' : '<div class="hint" style="margin:0">A lista aparece depois da próxima sincronização.</div>'}</div>`; };
// ---------- Trocar entre a conta pessoal e a compartilhada ----------
// Quem está numa conta compartilhada continua tendo os dados pessoais guardados na própria conta Google. trocarConta()
// alterna o que este aparelho mostra: envia o que falta da conta atual, baixa os dados da outra e marca sync.pessoal.
// Enquanto troca (trocando), nenhuma sincronização roda: senão os dados de uma conta poderiam ser gravados na outra.
let trocando = false;
// Faixa no topo de todas as telas (só para quem tem conta compartilhada): diz qual conta está em uso; tocar troca.
const contaPill = () => !sync.shared ? '' : `<div class="contaPill ${sync.pessoal ? 'pes' : 'comp'}" data-onclick="trocarConta()">${I(sync.pessoal ? 'user' : 'people', 14)}Você está na <b>conta ${sync.pessoal ? 'pessoal' : 'compartilhada'}</b><span>Trocar</span></div>`;
// Botão do Resumo: as duas contas lado a lado, com a atual marcada.
const trocaContaHtml = () => !sync.shared ? '' : `<div class="trocaConta">${[[true, 'user', 'Pessoal'], [false, 'people', 'Compartilhada']].map(([p, ic, t]) =>
  `<button class="${!!sync.pessoal === p ? 'on' : ''}" data-onclick="${!!sync.pessoal === p ? '' : 'trocarConta()'}">${I(ic, 16)}${t}</button>`).join('')}</div>`;
let trocaOcupada = false; // toque duplo não troca duas vezes
async function trocarConta(semPerguntar){
  if (demoBloqueia()) return;
  if (!sync.shared || !canSync() || trocaOcupada) return;
  trocaOcupada = true;
  try { await trocarContaJa(semPerguntar); } finally { trocaOcupada = false; }
}
async function trocarContaJa(semPerguntar){
  const paraPessoal = !sync.pessoal, destino = paraPessoal ? 'pessoal' : 'compartilhada';
  if (!semPerguntar && !await ask(paraPessoal ? 'Trocar para a sua conta pessoal?\n\nVocê passa a ver e lançar só nos seus dados. A conta compartilhada continua ligada e dá para voltar quando quiser.'
    : 'Trocar para a conta compartilhada?\n\nVocê volta a ver e lançar nos dados que divide com as outras pessoas.', 'Trocar')) return;
  await comCarga(`Abrindo a conta ${destino}…`, async () => {
    clearTimeout(syncTimer);
    while (syncing) await new Promise(r => setTimeout(r, 100));
    await syncNow(); // o que foi lançado na conta atual precisa estar guardado antes de sair dela
    if (!sync.shared) return; // a conta compartilhada foi encerrada enquanto isso (shareEnded já avisou)
    if (sync.err) return tell(`Não consegui guardar os dados da conta atual (${sync.err})\n\nSem isso não dá para trocar de conta agora. Confira a internet e tente de novo.`);
    trocando = true;
    const antes = canonS(db);
    try {
      let novo;
      if (paraPessoal){ const file = (await driveList("name='financas.json'", true))[0]; novo = file ? fixDb(await driveGet(file.id)) : fixDb({}); }
      else novo = await sharedReadDireto(sync.shared.id);
      if (!novo) throw {status:404, text:'vazia'};
      if (demoOn) return; // a demonstração foi ligada no meio
      if (newerDb(novo)) return tell('Os dados dessa conta foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.');
      if (canonS(db) !== antes) return tell('Você lançou ou alterou algo enquanto a troca acontecia. Para não perder nada, a troca foi cancelada: tente de novo.');
      loadDb({...novo, prefs:db.prefs}); // nome e aparência continuam os deste aparelho
      sync.pessoal = paraPessoal; saveSync();
      rollover(); save(false); state.dia = 0;
    } catch(e){
      if (e.status === undefined) throw e;
      logErr('trocar conta', e.status + ' ' + String(e.text).slice(0, 200));
      if (!paraPessoal && (e.status === -4 || e.status === 404)){ trocando = false; sync.pessoal = false; return shareEnded(e.por || ''); }
      return tell(e.status === 0 ? 'Sem conexão com a internet: não deu para abrir a outra conta.' : semPermissao(e) || e.status === 401 ? erroAmigavel(e) : `Não foi possível abrir a conta ${destino} agora (${e.status}).`);
    } finally { trocando = false; }
    closeForm(); render(); scrollTo(0, 0);
    toast(`Agora você está na conta ${destino}.`);
    syncNow();
  });
}
// Lê a planilha compartilhada mesmo com sync.pessoal ligado (shared() devolve vazio nesse modo).
const sharedReadDireto = async id => { const d = await sharedRead(id, true); return d && fixDb(d); };
// Tudo numa tela só: sem conta, as três formas de começar (cada uma com uma linha explicando); com conta, o estado,
// o código do convite à vista e as ações.
// sync.limpaProx = a conta que está sendo criada é "do zero" (fica em sync para sobreviver à ida ao Google na versão web).
function shareHtml(){
  const s = sync.shared;
  if (s && sync.pessoal) return `<div class="hint" style="margin-top:0">${I('user', 14)} Você está vendo a sua <b>conta pessoal</b>. A conta compartilhada continua ligada: troque para ela para ver as pessoas, os avisos e as outras opções.</div>
    <div class="btns"><button class="btn primary" data-onclick="trocarConta()">${I('people')}Trocar para a conta compartilhada</button></div>`;
  const opcao = (ic, t, d, acao) => `<button class="setTile" style="width:100%;text-align:left;margin-bottom:8px" data-onclick="${acao}"><span>${I(ic, 22)}</span><b>${t}</b><small>${d}</small></button>`;
  if (!s) return `<div class="hint" style="margin-top:0">Duas contas Google vendo e lançando nos mesmos dados, cada pessoa no próprio celular. Cada lançamento mostra quem fez; nome e aparência continuam de cada um.</div>
    ${!canSync() ? '<div class="hint warn">Prévia no PC: a conta compartilhada só funciona no app instalado no celular.</div>' : `
    <label>Como você quer começar?</label>
    ${opcao('people', 'Compartilhar os meus lançamentos', 'A outra pessoa passa a ver e lançar nos dados que você já tem.', "openShare('convidar')")}
    ${opcao('sparkle', 'Criar uma conta compartilhada do zero', 'Começa vazia, sem os lançamentos de ninguém. Os seus ficam guardados na sua conta.', "openShare('zero')")}
    ${opcao('download', 'Tenho um código de convite', 'Entre na conta que outra pessoa criou.', "openShare('entrar')")}`}`;
  return `<div class="hint in" style="margin-top:0">${I('people', 14)} Conta compartilhada ligada${s.limpa ? ' (criada do zero)' : ''}. ${s.owner ? (s.with && s.with.length ? 'Você criou e convidou ' + s.with.map(esc).join(', ') + '.' : 'Você criou; falta convidar alguém.') : 'Você entrou por convite.'}</div>
    ${membrosHtml(s)}
    <label>Avisos</label>
    <div class="btns" style="margin-top:0">${[[true, 'Avisar'], [false, 'Não avisar']].map(([v, t]) => `<button class="btn ${(db.prefs.avisoComp !== false) === v ? 'primary' : ''}" data-onclick="setAvisoComp(${v})">${t}</button>`).join('')}</div>
    <div class="hint">Avisa quando outra pessoa entra na conta ou adiciona/edita um gasto, ganho ou investimento: na tela do app e, com ele fechado, por notificação do celular. O celular confere a cada 15 minutos, mais ou menos (o app não tem servidor para avisar na hora).</div>
    ${avisoNativoHtml()}
    <div class="btns"><button class="btn" data-onclick="openAtividade()">${I('bell')}Atividade recente${ativNovas() ? ` (${ativNovas()})` : ''}</button></div>
    <label>Código do convite</label>
    <div class="btns" style="margin-top:0"><input readonly value="${esc(s.id)}" style="flex:3;min-width:0;font-size:12px" data-onclick="this.select()"><button class="btn" style="flex:1" data-onclick="shareCopy()">Copiar</button></div>
    ${s.owner ? `<div class="btns"><button class="btn" data-onclick="openShare('convidar')">${I('people')}Convidar mais alguém</button></div>` : ''}
    <div class="hint">Os lançamentos ficam numa planilha do Google compartilhada entre vocês (não edite a planilha à mão). Cópias diárias e comprovantes continuam de cada um.</div>
    <div class="btns"><button class="btn danger" style="flex:1" data-onclick="shareLeave()">Sair e encerrar a conta compartilhada</button></div>
    <div class="hint">Sair encerra a conta para todos: a outra pessoa também volta para a conta individual e a planilha é apagada. Cada um pode ficar com uma cópia dos lançamentos.</div>`;
}
function openShare(modo){
  settingsOpen = false; F = null;
  if (modo === 'zero' || modo === 'convidar'){ sync.limpaProx = modo === 'zero'; saveSync(); }
  const shareLimpa = !!sync.limpaProx;
  showSheet(modo !== 'entrar' ? `<h3>${sync.shared ? 'Convidar para a conta compartilhada' : shareLimpa ? 'Conta compartilhada do zero' : 'Compartilhar os meus lançamentos'}</h3>
    <div class="hint" style="margin-top:0">${sync.shared ? 'A pessoa recebe um e-mail do Google com o convite.' : shareLimpa ? 'O app cria uma planilha vazia na sua conta Google e a compartilha com a outra pessoa. Os seus lançamentos de hoje não entram: continuam guardados na sua conta. Depois, ela abre o app e cola o código do convite.' : 'O app cria uma planilha na sua conta Google com os seus lançamentos e a compartilha com a outra pessoa, que recebe um e-mail do Google. Depois, ela abre o app, entra com a conta convidada e cola o código do convite.'}</div>
    <label for="shEmail">E-mail da conta Google da outra pessoa</label>
    <input id="shEmail" type="email" autocomplete="off" placeholder="nome@gmail.com">
    <div class="hint">O Google vai pedir sua autorização para o app criar e compartilhar a planilha.</div>
    <div class="err" id="shErr"></div>
    <div class="btns foot"><button class="btn" data-onclick="shareBack()">Cancelar</button><button class="btn primary" data-onclick="${sync.shared ? 'shareInvite' : 'shareStart'}(document.getElementById('shEmail').value)">Convidar</button></div>`
  : `<h3>Entrar numa conta compartilhada</h3>
    <div class="hint" style="margin-top:0">Cole o código (ou o link da planilha) que a outra pessoa te mandou. Você precisa estar com a conta Google que foi convidada${Android.conta && Android.conta() ? ` (agora: <b>${esc(Android.conta())}</b>)` : ''}.</div>
    <label for="shCode">Código do convite</label>
    <input id="shCode" type="text" autocomplete="off">
    <div class="err" id="shErr"></div>
    <div class="btns foot"><button class="btn" data-onclick="shareBack()">Cancelar</button><button class="btn primary" data-onclick="shareJoin(document.getElementById('shCode').value)">Entrar</button></div>`);
}
const shErr = m => { const e = document.getElementById('shErr'); if (e) e.textContent = m; else tell(m); };
// Aberta pela pergunta do primeiro acesso (askShare): ao terminar ou cancelar, segue para as próximas telas de início.
let shareFromStart = false;
function shareBack(){ if (shareFromStart){ shareFromStart = false; closeForm(); startSheets(); } else openSettings('compart'); }
// Tela de permissão do Google: o app abre sozinho, mas o aviso de "app não verificado" e o "Permitir" são da pessoa.
// Antes da primeira vez, explica o que tocar; se a autorização não for concluída, mostra como fazer.
const PASSOS_GOOGLE = '1. Se aparecer "O Google não verificou este app", toque em "Avançado" e depois em "Acessar Cofrim (não seguro)". O aviso aparece porque o app ainda não passou pela verificação do Google; os dados ficam só na sua conta.\n2. Marque as caixas de permissão (Planilhas e arquivos do Drive criados pelo app).\n3. Toque em "Continuar".';
async function famPrepare(){
  if (sync.famOk) return true;
  return ask(`Agora o Google vai pedir sua permissão para o app criar e ler a planilha da conta compartilhada.\n\n${PASSOS_GOOGLE}`, 'Abrir a tela do Google');
}
function famNegado(){ tell(`A permissão do Google não foi concluída, então a conta compartilhada não foi ligada.\n\nPara tentar de novo, toque outra vez no botão e, na tela do Google:\n${PASSOS_GOOGLE}`); }
// Toque duplo num botão que fala com o Google (criar, convidar, entrar, sair) não roda a ação duas vezes.
const umaVez = fn => { let ocupado = false; return async (...a) => { if (ocupado) return; ocupado = true; try { return await fn(...a); } finally { ocupado = false; } }; };
const shareInvite = umaVez(async function(email, quieto){
  if (demoBloqueia()) return;
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return shErr('Digite um e-mail válido.');
  const r = await fam('POST', `${DRIVE}/drive/v3/files/${shared()}/permissions?sendNotificationEmail=true&emailMessage=${encodeURIComponent(inviteText(shared()))}`, JSON.stringify({role:'writer', type:'user', emailAddress:email}), 'application/json', true);
  if (r.status !== 200){
    logErr('convidar', r.status + ' ' + String(r.text).slice(0, 300));
    if (!quieto){ if (r.status === -5 || r.status === -1) famNegado(); else shErr('Não consegui enviar o convite pelo Google (' + r.status + '). Copie o convite e compartilhe a planilha com essa pessoa pelo app do Google Planilhas.'); }
    return false;
  }
  sync.shared.with = [...new Set([...(sync.shared.with || []), email])]; saveSync();
  if (!quieto){ toast('Convite enviado para ' + email); shareBack(); }
  return true;
});
// Cria a conta compartilhada com os dados deste aparelho e convida a outra pessoa.
// limpa = conta criada do zero: começa vazia, sem os lançamentos de ninguém (os pessoais continuam guardados na conta
// de cada um e voltam ao sair).
const shareStart = umaVez(async function(email, semPerguntar, limpa = !!sync.limpaProx){
  if (demoBloqueia()) return;
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return shErr('Digite um e-mail válido.');
  if (!limpa && db.archUntil) return shErr('Antes de compartilhar, traga de volta os anos arquivados (Configurações > Dados e ajustes > Anos antigos).');
  if (!semPerguntar && !await ask(limpa ? `Criar uma conta compartilhada do zero com ${email}?\n\nEla começa vazia, numa planilha na sua conta Google que ${email} poderá ver e editar pelo app. Os seus lançamentos de hoje continuam guardados na sua conta e voltam se a conta compartilhada for encerrada.`
    : `Criar a conta compartilhada com ${email}?\n\nOs seus lançamentos vão para uma planilha na sua conta Google, que ${email} poderá ver e editar pelo app.`, 'Criar e convidar')) return;
  if (!semPerguntar && !await famPrepare()) return;
  const fimCarga = cargaOn('Criando a conta compartilhada…');
  try {
    await syncNow(); // os dados pessoais ficam em dia na sua conta antes de passar a usar a planilha
    if (limpa && sync.err) return shErr('Não consegui guardar os seus dados pessoais na sua conta antes de criar a conta do zero. Confira a internet e tente de novo.');
    const corpo = {properties:{title:'Cofrim (conta compartilhada)'}, sheets:[{properties:{title:'leia-me'}}, {properties:{title:'dados'}}]};
    const id = JSON.parse(ok(await fam('POST', SHEETS, JSON.stringify(corpo), 'application/json', true)).text).spreadsheetId;
    sync.famOk = true;
    await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A1:A3')}?valueInputOption=RAW`, JSON.stringify({values:[['Esta planilha guarda os dados do app Cofrim compartilhados entre contas Google.'], ['Não edite nem apague: o app lê e grava a aba "dados".'], ['Para parar de compartilhar, use "Sair da conta compartilhada" no app.']]}), 'application/json');
    const vazio = limpa ? {...fixDb({}), prefs:db.prefs} : null;
    if (limpa) ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A4')}?valueInputOption=RAW`, JSON.stringify({values:[['LIMPA']]}), 'application/json'));
    else { claimMine(); save(false); }
    await sharedWrite(id, JSON.stringify(vazio || db));
    sync.shared = {id, owner:true, with:[], limpa:!!limpa}; saveSync();
    // Só depois de a planilha estar gravada o aparelho passa a mostrar a conta vazia (os dados pessoais já estão na conta).
    if (vazio){ loadDb(vazio); rollover(); save(false); render(); }
    const convidou = await shareInvite(email, true);
    await syncNow();
    showSheet(`<h3>Conta compartilhada criada</h3>
      <div class="hint" style="margin-top:0">${convidou ? `${esc(email)} vai receber um e-mail do Google.` : `Não consegui enviar o convite pelo Google. Abra a planilha "Cofrim (conta compartilhada)" no Google Planilhas e compartilhe com ${esc(email)} como editor.`} Mande também o código abaixo: no app, a pessoa abre Configurações > Conta compartilhada > Tenho um convite.</div>
      <textarea readonly style="min-height:70px">${esc(id)}</textarea>
      <div class="btns foot"><button class="btn" data-onclick="shareCopy()">Copiar convite</button><button class="btn primary" data-onclick="shareBack()">Pronto</button></div>`);
  } catch(e){
    logErr('compartilhar', e.status ? e.status + ' ' + String(e.text).slice(0, 300) : e);
    sync.shared = null; saveSync();
    if (e.status === -1 || e.status === -5) return famNegado();
    shErr(sharedMsg(e) || (e.status === 0 ? 'Sem conexão com a internet.' : e.status === -1 ? 'É preciso autorizar o acesso na conta Google.' : 'Não foi possível criar a conta compartilhada agora.'));
  } finally { fimCarga(); }
});
function shareCopy(){
  const t = inviteText(shared());
  if (window.Android && Android.copiar) Android.copiar(t); else navigator.clipboard && navigator.clipboard.writeText(t);
  toast('Convite copiado. Mande para a outra pessoa.');
}
// Entra na conta compartilhada de outra pessoa. escolha: 'juntar' (leva os seus lançamentos junto) ou 'so' (usa só os de lá).
const shareJoin = umaVez(async function(code, escolha){
  if (demoBloqueia()) return;
  const id = codeOf(code);
  if (!id) return shErr('Código inválido. Cole o código inteiro que a outra pessoa mandou.');
  let remote;
  if (!escolha && !await famPrepare()) return;
  const fimCarga = cargaOn('Abrindo a conta compartilhada…');
  try {
    await syncNow();
    remote = await sharedRead(id, true);
    sync.famOk = true;
    if (!remote) throw {status:404, text:'vazia'};
    remote = fixDb(remote);
    if (newerDb(remote)) return shErr('Os dados compartilhados foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.');
  } catch(e){
    if (e.status === undefined) throw e;
    logErr('entrar compartilhada', e.status + ' ' + String(e.text).slice(0, 300));
    if (e.status === -1 || e.status === -5) return famNegado();
    if (e.status === -4) return shErr('Esta conta compartilhada já foi encerrada. Peça para a outra pessoa criar uma nova e mandar o novo código.');
    return shErr(sharedMsg(e) || (e.status === 0 ? 'Sem conexão com a internet.' : 'Não foi possível abrir a conta compartilhada (' + e.status + ').'));
  } finally { fimCarga(); }
  if (!escolha){
    const temMeus = COLS.some(c => db[c].length);
    if (!temMeus || sharedInfo.limpa) escolha = 'so'; // conta criada do zero: ninguém leva os próprios lançamentos
    else return pickList('E os lançamentos que já estão neste app?', [['juntar', 'Juntar aos da conta compartilhada'], ['so', 'Usar só os da conta compartilhada (os meus continuam guardados na minha conta)']], '', v => shareJoin(id, v));
  }
  const prefs = db.prefs;
  if (escolha === 'juntar'){ claimMine(); loadDb({...mergeDb(db, remote), prefs}); }
  else loadDb({...remote, prefs});
  rollover(); save(false);
  sync.shared = {id, owner:false, limpa:sharedInfo.limpa}; saveSync();
  await syncNow();
  closeForm(); render();
  toast(comNome('Pronto, {nome}! Agora vocês veem os mesmos lançamentos.'));
  if (shareFromStart){ shareFromStart = false; startSheets(); }
});

// Logo depois do login (antes do nome e do tutorial): pergunta se a pessoa vai usar uma conta compartilhada.
function askShare(){
  settingsOpen = false; F = null;
  showSheet(`<div class="tour"><span class="tourIco">${I('people', 40)}</span>
    <h3>Você vai usar uma conta compartilhada?</h3>
    <p>Casal ou família: duas contas Google vendo e lançando nos mesmos ganhos, gastos e investimentos, cada pessoa no próprio celular. Dá para ligar depois em Configurações › Conta compartilhada.</p></div>
    <div class="btns" style="flex-direction:column">
      <button class="btn primary" data-onclick="askShareAns('entrar')">${I('people')}Sim, recebi um código de convite</button>
      <button class="btn" data-onclick="askShareAns('convidar')">Sim, quero convidar alguém</button>
      <button class="btn" data-onclick="askShareAns('')">Não, vou usar só eu</button></div>`);
}
function askShareAns(modo){
  sync.askedShare = true; saveSync();
  if (!modo){ closeForm(); return startSheets(); }
  shareFromStart = true; openShare(modo);
}
// Sair encerra a conta compartilhada para todos: a planilha recebe o aviso "ENCERRADA", a outra pessoa é desligada na
// próxima sincronização dela (shareEnded) e a planilha é apagada (por quem a criou: só o dono consegue apagar o arquivo).
// escolha: 'copia' = este aparelho fica com uma cópia dos lançamentos compartilhados, juntada aos dados pessoais;
// 'so' = volta só aos dados pessoais, como estavam antes de compartilhar.
const apagarPlanilha = id => fam('DELETE', `${DRIVE}/drive/v3/files/${id}`).catch(() => ({status:0}));
const shareLeave = umaVez(async function(escolha){
  if (demoBloqueia()) return;
  if (!escolha){
    if (!await ask('Sair e ENCERRAR a conta compartilhada?\n\nIsto vale para todos: a outra pessoa também é desligada e volta para a conta individual dela, e a planilha compartilhada é apagada. Não dá para desfazer.\n\nNinguém perde os lançamentos: cada pessoa pode ficar com uma cópia na própria conta.', 'Encerrar para todos', true)) return;
    return pickList('O que fazer com os lançamentos compartilhados neste aparelho?', [['copia', 'Ficar com uma cópia, junto com os meus dados'], ['so', 'Não ficar: voltar só aos meus dados de antes']], '', v => shareLeave(v));
  }
  return comCarga('Encerrando a conta compartilhada…', async () => {
  const id = shared(), dono = sync.shared.owner;
  await syncNow(); // as últimas alterações deste aparelho vão para a planilha antes do aviso
  let pessoal = null;
  try {
    // 'so': primeiro baixa os dados pessoais; sem eles (sem internet), não sai: senão os compartilhados iriam para a conta pessoal.
    if (escolha === 'so'){ const file = (await driveList("name='financas.json'", true))[0]; pessoal = file ? fixDb(await driveGet(file.id)) : fixDb({}); }
    ok(await fam('PUT', `${SHEETS}/${id}/values/${rng('leia-me!A5')}?valueInputOption=RAW`, JSON.stringify({values:[[`ENCERRADA|${myName() || (Android.conta && Android.conta()) || ''}|${Date.now()}`]]}), 'application/json', true));
  } catch(e){
    // A planilha já não existe ou já foi encerrada: segue saindo. Outro erro (sem internet): não sai, para a outra pessoa não ficar numa conta que só um lado abandonou.
    if (e.status !== 404 && e.status !== -4){ logErr('sair compartilhada', e.status ? e.status + ' ' + String(e.text).slice(0, 200) : e); return tell('Não consegui encerrar a conta compartilhada agora (sem internet?). Tente de novo.'); }
  }
  if (dono) await apagarPlanilha(id);
  sync.shared = null; saveSync(); compFim();
  if (pessoal){ loadDb({...pessoal, prefs:db.prefs}); rollover(); save(false); }
  await syncNow();
  closeForm(); render();
  tell(`Conta compartilhada encerrada. ${escolha === 'so' ? 'Este aparelho voltou aos seus dados pessoais.' : 'Você ficou com uma cópia dos lançamentos na sua conta.'}\n\nA outra pessoa será desligada assim que o app dela sincronizar.`);
  });
});
// A conta compartilhada foi encerrada por outra pessoa (ou a planilha sumiu): este aparelho volta à conta individual,
// guardando os lançamentos compartilhados como uma cópia junto aos dados pessoais. Quem criou a planilha a apaga.
async function shareEnded(por){
  const s = sync.shared; if (!s) return;
  sync.shared = null; sync.err = ''; saveSync(); compFim(); save(false);
  if (s.owner) await apagarPlanilha(s.id);
  if (!sheetOpen()) render(); else if (settingsShown()) openSettings();
  tell(`A conta compartilhada foi encerrada${por ? ' por ' + por : ''}.\n\nVocê voltou para a sua conta individual e ficou com uma cópia dos lançamentos compartilhados.`);
  setTimeout(syncNow, 300); // junta a cópia com os dados pessoais da sua conta
}

// Junta os dados deste aparelho (a) com os da conta (b):
// - lançamentos: um a um pelo id, valendo a versão alterada por último (u); excluídos (tomb) não voltam;
// - configurações (tema, abas, orçamentos, fechamento do cartão): vale o lado que mexeu nelas por último (cfgMod);
// - históricos mensais: soma dos dois lados, preferindo o deste aparelho.
function mergeDb(a, b){
  // As datas de alteração vêm de cada aparelho (e da planilha, que qualquer pessoa da conta pode editar). Uma data no
  // futuro faria o registro vencer todas as edições seguintes: ficam limitadas a agora + 5 minutos (folga de relógio).
  const max = Date.now() + 5 * 60e3;
  for (const d of [a, b]){
    if (d.cfgMod > max) d.cfgMod = max;
    for (const c of COLS) for (const r of d[c] || []) if (r.u > max) r.u = max;
    for (const id in d.tomb || {}) if (d.tomb[id] > max) d.tomb[id] = max;
  }
  const tomb = {...b.tomb};
  for (const [id, t] of Object.entries(a.tomb || {})) tomb[id] = Math.max(t, tomb[id] || 0);
  for (const id in tomb) if (tomb[id] < Date.now() - 90*864e5) delete tomb[id]; // 90 dias bastam para todos os aparelhos saberem
  const out = {...b, ...a, tomb, mod:Math.max(a.mod || 0, b.mod || 0)};
  for (const c of COLS){
    const byId = new Map((b[c] || []).map(r => [r.id, r]));
    for (const r of a[c] || []){ const o = byId.get(r.id); if (!o || (r.u || 0) >= (o.u || 0)) byId.set(r.id, r); }
    out[c] = [...byId.values()].filter(r => !(tomb[r.id] >= (r.u || 0)));
  }
  // Empate sem nenhuma alteração deste lado (aparelho novo, com o Resumo enxuto de primeira abertura): valem as da conta.
  const cfg = (b.cfgMod || 0) > (a.cfgMod || 0) || (!a.cfgMod && a.prefs && a.prefs.resumoEnxuto && b.prefs && Array.isArray(b.prefs.resumo)) ? b : a;
  Object.assign(out, {prefs:cfg.prefs, budgets:cfg.budgets, cardClose:cfg.cardClose, cardDue:cfg.cardDue, cardAcc:cfg.cardAcc, cardLimit:cfg.cardLimit, archUntil:cfg.archUntil || '', cats:cfg.cats, cfgMod:cfg.cfgMod});
  // Categorias criadas no outro lado não somem só porque este mexeu numa configuração depois (o tema, por exemplo): as
  // próprias (fora as de fábrica) que só existem no lado perdedor entram também, menos as excluídas (tomb "cat:tipo:chave").
  const outro = cfg === a ? b : a;
  out.cats = {gasto:{...(cfg.cats || {}).gasto}, ganho:{...(cfg.cats || {}).ganho}};
  for (const t of ['gasto', 'ganho']) for (const [k, v] of Object.entries(((outro.cats || {})[t]) || {}))
    if (!out.cats[t][k] && !BASE_CATS[t][k] && !tomb['cat:' + t + ':' + k]) out.cats[t][k] = v;
  out.membros = {...b.membros};
  for (const [k, m] of Object.entries(a.membros || {})) if (!out.membros[k] || (m.t || 0) >= (out.membros[k].t || 0)) out.membros[k] = m;
  // Última versão do app vista nesta conta (novidades depois de reinstalar): a mais nova dos dois lados.
  const vs = [a.verVista, b.verVista].filter(v => typeof v === 'string' && /^\d+\.\d+$/.test(v));
  if (vs.length) out.verVista = vs.reduce((x, y) => verNum(y) > verNum(x) ? y : x); else delete out.verVista;
  out.catMemo = {...b.catMemo, ...a.catMemo};
  out.yieldLog = {...b.yieldLog, ...a.yieldLog};
  out.netLog = {...b.netLog, ...a.netLog};
  return out;
}
// Texto para comparar dois estados sem depender da ordem das chaves.
const SYNCED = [...COLS, 'tomb', 'prefs', 'budgets', 'cardClose', 'cardDue', 'cardAcc', 'cardLimit', 'archUntil', 'cats', 'catMemo', 'yieldLog', 'netLog', 'membros'];
const canon = d => JSON.stringify(SYNCED.map(k => d[k]), (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([x],[y]) => x < y ? -1 : 1)) : v);

let retryTimer = 0;
const retryDelay = n => Math.min(30e3 * 2 ** (n - 1), 30 * 60e3);
// Quantas alterações a junção trouxe para este aparelho: registros novos, mais recentes ou excluídos em outro lugar.
function incoming(a, m){
  let n = 0;
  for (const c of COLS){
    const meus = new Map(a[c].map(r => [r.id, r.u || 0])), ids = new Set(m[c].map(r => r.id));
    for (const r of m[c]) if (!meus.has(r.id) || (r.u || 0) > meus.get(r.id)) n++;
    for (const r of a[c]) if (!ids.has(r.id)) n++;
  }
  return n;
}
const BEFORE_KEY = 'financas-antes';
function keepBefore(motivo){ try { localStorage.setItem(BEFORE_KEY, JSON.stringify({at:Date.now(), db:JSON.stringify(db), motivo:motivo || ''})); } catch(e){} }
function beforeInfo(){ try { return JSON.parse(localStorage.getItem(BEFORE_KEY)); } catch(e){ return null; } }
async function restoreBefore(){
  if (demoBloqueia()) return;
  const o = beforeInfo();
  if (!o) return;
  const quando = new Date(o.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});
  if (!await ask(o.motivo === 'importar' ? `Voltar este aparelho ao estado de ${quando}, antes da importação do arquivo?\nO que veio do arquivo será desfeito em todos os aparelhos.`
    : `Voltar este aparelho ao estado de ${quando}, antes da última junção com a conta?\nO que veio de outros aparelhos nessa junção será desfeito em todos eles.`, 'Voltar', true)) return;
  applySnapshot(fixDb(JSON.parse(o.db)));
  try { localStorage.removeItem(BEFORE_KEY); } catch(e){}
  syncNow();
}
const beforeHtml = () => { const o = beforeInfo(); return o ? `<div class="btns"><button class="btn" data-onclick="restoreBefore()">${I('history')}${o.motivo === 'importar' ? 'Desfazer a importação' : 'Desfazer a última junção'} (${new Date(o.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})})</button></div>` : ''; };
// Troca os dados pelos de uma cópia, de modo que a troca valha em todos os aparelhos: tudo o que veio da cópia fica
// como "alterado agora", e o que existe hoje mas não existia nela é marcado como excluído.
function applySnapshot(snap){
  const t = Date.now(), ids = new Set();
  for (const c of COLS) for (const r of snap[c]){ r.u = t; ids.add(r.id); }
  snap.tomb = {};
  for (const c of COLS) for (const r of db[c]) if (!ids.has(r.id)) snap.tomb[r.id] = t;
  snap.cfgMod = t;
  loadDb(snap); rollover(); save(); closeForm(); render();
}
// ---------- Mesmo lançamento editado em dois aparelhos ----------
// A junção fica com a edição mais recente. Quando os dois lados mudaram o registro depois da última sincronização deste
// aparelho (desde) e a versão descartada tem descrição, valor, data ou categoria diferentes, ela é guardada aqui (só
// neste aparelho, até 20) para a pessoa ver as duas e, se quiser, trocar pela outra.
const CONFLITO_KEY = 'financas-conflitos', CONFLITO_CAMPOS = [['desc', 'Descrição'], ['name', 'Nome'], ['value', 'Valor'], ['total', 'Valor total'], ['start', 'Mês'], ['day', 'Dia'], ['due', 'Vencimento'], ['date', 'Data'], ['cat', 'Categoria']];
function conflitos(a, b, desde){
  const out = [];
  if (!desde) return out; // primeira sincronização deste aparelho: não há o que comparar
  for (const c of COLS){
    const meus = new Map(a[c].map(r => [r.id, r]));
    for (const rb of b[c]){
      const ra = meus.get(rb.id);
      if (!ra || (ra.u || 0) <= desde || (rb.u || 0) <= desde || ra.u === rb.u) continue;
      if (!CONFLITO_CAMPOS.some(([k]) => String(ra[k] ?? '') !== String(rb[k] ?? ''))) continue;
      if ((b.tomb || {})[rb.id] >= rb.u || (a.tomb || {})[ra.id] >= ra.u) continue;
      out.push({col:c, id:rb.id, t:Date.now(), outra:JSON.parse(JSON.stringify((ra.u || 0) >= (rb.u || 0) ? rb : ra))}); // mesma regra do mergeDb
    }
  }
  return out;
}
function conflitoLista(){ try { return JSON.parse(localStorage.getItem(CONFLITO_KEY)) || []; } catch(e){ return []; } }
const conflitoGuardar = l => { try { localStorage.setItem(CONFLITO_KEY, JSON.stringify(l.slice(-20))); } catch(e){} };
function conflitoAvisar(novos){
  conflitoGuardar([...conflitoLista().filter(x => !novos.some(n => n.id === x.id)), ...novos]);
  showAcao(novos.length === 1 ? '1 lançamento foi editado em dois aparelhos. Mantivemos a edição mais recente.'
    : `${novos.length} lançamentos foram editados em dois aparelhos. Mantivemos a edição mais recente.`, 'Ver', openConflitos, {tipo:'aviso', dest:{k:'conflito'}});
}
const conflitoCats = c => c === 'incomes' ? CAT_GANHO : c === 'investments' ? CAT_INV : CAT_GASTO;
function conflitoValor(c, k, v){
  if (v == null || v === '') return '—';
  if (k === 'value' || k === 'total') return fmt(+v || 0);
  if (k === 'start') return monthName(String(v));
  if (k === 'date') return fmtDate(String(v));
  if (k === 'cat') return esc((conflitoCats(c)[v] || [, String(v)])[1]);
  return esc(String(v));
}
function openConflitos(){
  settingsOpen = false; F = null;
  const l = conflitoLista().map((x, i) => [x, i, (db[x.col] || []).find(r => r.id === x.id)]).filter(([, , r]) => r).reverse();
  showSheet(`<h3>Editados em dois aparelhos</h3>
    <div class="hint" style="margin-top:0">O app ficou com a edição mais recente de cada lançamento. Se a outra estava certa, toque em "Usar a outra".</div>
    ${l.length ? l.map(([x, i, r]) => { const difs = CONFLITO_CAMPOS.filter(([k]) => String(r[k] ?? '') !== String(x.outra[k] ?? ''));
      return `<div class="card" style="background:var(--bg);box-shadow:none"><b>${esc(r.desc || r.name || r.ticker || 'Lançamento')}</b><small style="display:block;color:var(--muted)">${quando(x.t)}</small>
        <table class="conflito"><tr><th></th><th>Ficou</th><th>A outra</th></tr>${difs.map(([k, nome]) => `<tr><td>${nome}</td><td>${conflitoValor(x.col, k, r[k])}</td><td>${conflitoValor(x.col, k, x.outra[k])}</td></tr>`).join('')}</table>
        <div class="btns"><button class="btn" data-onclick="conflitoDispensar(${i})">Manter</button><button class="btn primary" data-onclick="conflitoUsar(${i})">Usar a outra</button></div></div>`; }).join('')
      : '<div class="hint">Nenhuma edição em dois aparelhos para conferir.</div>'}
    <div class="btns foot"><button class="btn" data-onclick="closeForm();render()">Fechar</button></div>`);
}
function conflitoDispensar(i){ const l = conflitoLista(); l.splice(i, 1); conflitoGuardar(l); openConflitos(); }
// Trocar pela outra vale como uma edição feita agora: ela passa a vencer em todos os aparelhos. A que ficava antes
// passa a ser "a outra", para dar para voltar.
function conflitoUsar(i){
  if (demoBloqueia()) return;
  const l = conflitoLista(), x = l[i], lista = x && db[x.col], j = lista ? lista.findIndex(r => r.id === x.id) : -1;
  if (j < 0) return tell('Esse lançamento não existe mais neste aparelho.');
  const atual = lista[j];
  lista[j] = touch(Object.assign({}, x.outra, {id:x.id, u:atual.u}));
  x.outra = JSON.parse(JSON.stringify(atual)); x.t = Date.now();
  conflitoGuardar(l);
  save(); render(); openConflitos();
}
// ---------- Dados incompletos: a sincronização pausa em vez de gravar ----------
// Rede de segurança contra gravar na conta um estado ruim. Com o arquivo da conta (conta), a junção só tira um registro
// que tem marca de exclusão (tomb): sumir mais da metade dos registros da conta sem essa marca é sinal de erro. Sem o
// arquivo, num aparelho que já sincronizou (sync.nConta = registros na última vez), gravar dados com menos da metade
// criaria um segundo arquivo, quase vazio, na conta. Nos dois casos a pessoa escolhe: baixar os dados da conta ou enviar.
const PAUSA_MSG = 'Seus dados neste aparelho parecem incompletos. Para proteger sua conta, a sincronização foi pausada.';
const nRegs = d => COLS.reduce((t, c) => t + ((d && d[c]) || []).length, 0);
function incompleto(conta, d){
  if (!conta) return !!sync.linked && (sync.nConta || 0) >= 10 && nRegs(d) < sync.nConta / 2;
  const n = nRegs(conta), tem = new Set(COLS.flatMap(c => d[c].map(r => r.id)));
  const sumiram = COLS.reduce((t, c) => t + conta[c].filter(r => !tem.has(r.id) && !((d.tomb || {})[r.id] >= (r.u || 0))).length, 0);
  return n >= 10 && sumiram > n / 2;
}
const pausaHtml = () => sync.pausa ? `<div class="btns"><button class="btn primary" data-onclick="pausaBaixar()">${I('download')}Baixar os dados da conta</button><button class="btn" data-onclick="pausaEnviar()">Enviar mesmo assim</button></div>` : '';
function openPausa(){
  settingsOpen = false; F = null;
  showSheet(`<h3>${I('alert', 22)} Sincronização pausada</h3><div class="hint" style="margin-top:0;color:var(--out)">${PAUSA_MSG}</div>
    <div class="hint">"Baixar os dados da conta" troca os dados deste aparelho pelos da sua conta Google (dá para desfazer em Configurações › Conta e sincronização). "Enviar mesmo assim" grava os dados deste aparelho na conta.</div>
    ${pausaHtml()}<div class="btns foot"><button class="btn" data-onclick="closeForm()">Decidir depois</button></div>`);
}
function pausaBaixar(){ closeForm(); Object.assign(sync, {pausa:false, baixar:true}); syncNow(true); }
async function pausaEnviar(){
  if (!await ask('Enviar os dados deste aparelho para a sua conta Google, mesmo parecendo incompletos?', 'Enviar', true)) return;
  closeForm(); Object.assign(sync, {pausa:false, forcar:true}); syncNow(true);
}
// ---------- Ícone do estado da sincronização (topo das telas principais) ----------
// ok: tudo na conta; sinc: sincronizando; pend: alterações esperando (ou sem internet); erro: a última tentativa falhou.
// sync.pend conta as gravações feitas desde a última sincronização que deu certo. Sem conta ou na demonstração, nada.
function nuvemEstado(){
  if (demoOn || !canSync() || !sync.on) return '';
  return syncing ? 'sinc' : !netOk ? 'pend' : sync.err ? 'erro' : sync.pend > 0 ? 'pend' : 'ok';
}
const haQuanto = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'agora há pouco' : m < 60 ? `há ${m} minuto${m > 1 ? 's' : ''}` : m < 1440 ? `há ${Math.round(m / 60)} hora${m >= 90 ? 's' : ''}` : 'em ' + new Date(t).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}); };
function nuvemTexto(){
  const e = nuvemEstado(), n = sync.pend || 0, onde = shared() ? 'na conta compartilhada' : 'no seu Google Drive';
  return e === 'sinc' ? 'Sincronizando…'
    : sync.pausa ? PAUSA_MSG : e === 'erro' ? 'Erro ao sincronizar: ' + sync.err
    : !netOk ? (n ? `${n} ${n > 1 ? 'alterações esperando' : 'alteração esperando'} a internet` : 'Sem internet. O que você lançar fica salvo neste aparelho.')
    : e === 'pend' ? `${n} ${n > 1 ? 'alterações esperando' : 'alteração esperando'} para sincronizar`
    : `Tudo salvo ${onde}` + (sync.at ? ' · ' + haQuanto(sync.at) : '');
}
const nuvemBtn = () => { const e = nuvemEstado();
  return e ? `<button class="iconbtn nuvem ${e}" data-onclick="openNuvem()" aria-label="Sincronização: ${esc(nuvemTexto())}">${I({ok:'nuvemOk', sinc:'cloud', pend:'nuvemPend', erro:'nuvemErro'}[e], 22)}</button>` : ''; };
// Troca só o ícone (sem redesenhar a tela) e, com a folha da nuvem aberta, o texto dela.
function nuvemDraw(){
  for (const b of document.querySelectorAll('.nuvem')) b.outerHTML = nuvemBtn();
  if (document.querySelector('#sheet .nuvemTxt') && sheetOpen()) openNuvem();
}
function openNuvem(){
  settingsOpen = false; F = null;
  const e = nuvemEstado();
  showSheet(`<h3>${I('cloud', 22)} Sincronização</h3>
    <div class="hint nuvemTxt ${e}" style="margin-top:0">${esc(nuvemTexto())}</div>
    <div class="hint">Última sincronização: ${sync.at ? new Date(sync.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : 'ainda nenhuma'}</div>${pausaHtml()}
    <div class="btns foot"><button class="btn" data-onclick="closeForm()">Fechar</button><button class="btn primary" ${e === 'sinc' ? 'disabled' : ''} data-onclick="syncNow(true)">${I('refresh')}Sincronizar agora</button></div>`);
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
const netNativo = () => !!(window.Android && Android.redeOk);
const netAgora = () => netNativo() ? !!Android.redeOk() : navigator.onLine !== false;
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
function scheduleSync(){ if (demoOn || !canSync() || !sync.on) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 3000); }
async function syncNow(interactive){
  if (demoOn){ if (interactive) tell(DEMO_MSG); return; }
  if (!canSync() || !sync.on || trocando) return;
  if (sync.pausa && !interactive) return; // dados incompletos: espera a pessoa escolher (pausaHtml)
  if (syncing){ syncAgain = true; return; } // houve alteração durante a sincronização: repete ao terminar
  syncing = true; nuvemDraw();
  const pend0 = sync.pend || 0, forcar = sync.forcar, baixar = sync.baixar;
  sync.forcar = sync.baixar = false;
  try {
    // Na conta compartilhada, os dados vêm da planilha (sharedRead); senão, do arquivo na pasta oculta do Drive.
    const sid = shared(), file = sid ? null : (await driveList("name='financas.json'", interactive, ',version'))[0];
    // Conta pessoal: arquivo na mesma versão do Drive da última sincronização deste aparelho = os dados dele são os que
    // este aparelho já juntou. Não precisa baixar; só envia se algo mudou aqui (sync.hash). Com bem menos registros que
    // da última vez, baixa e confere como sempre (incompleto).
    const mesma = !!(file && file.version && !baixar && file.id === sync.idConta && String(file.version) === sync.verConta && nRegs(db) >= (sync.nConta || 0) / 2);
    const bruto = sid ? await sharedRead(sid, interactive) : file && !mesma ? await driveGet(file.id) : null, remote = bruto && fixDb(bruto);
    if (demoOn) return; // a demonstração foi ligada no meio: os dados reais não podem entrar na tela
    if (newerDb(remote)) throw {status:-3};
    if (sid && membroEu()) save(false); // este aparelho entra na lista de pessoas da conta
    if (baixar && !remote) throw {status:-8};
    if (baixar){ keepBefore(); loadDb(sid ? {...remote, prefs:db.prefs} : remote); rollover(); save(false); if (!sheetOpen()) render(); } // "Baixar os dados da conta"
    if (!forcar && !remote && !mesma && incompleto(null, db)) throw {status:-7};
    if (remote){
      const cf = conflitos(db, remote, sync.at), merged = mergeDb(db, remote);
      if (!forcar && incompleto(remote, merged)) throw {status:-7};
      if (sid) merged.prefs = db.prefs; // nome e aparência são de cada pessoa
      if (canonS(merged) !== canonS(db)){
        const veio = incoming(db, merged), novas = sid ? atividade(db, merged) : [];
        keepBefore(); // cópia deste aparelho antes de juntar, para poder desfazer
        loadDb(merged); rollover(); save(false);
        if (novas.length) ativAvisar(novas); // conta compartilhada: diz quem fez o quê
        else if (veio && !cf.length) toast(`Sincronizado: ${veio} ${veio > 1 ? 'alterações vieram' : 'alteração veio'} de outro aparelho.`, {dest:{k:'sync'}});
        if (cf.length) conflitoAvisar(cf); // por cima do aviso de cima: este pede atenção
        if (!sheetOpen()) render();
      }
    }
    compNativo();
    if (sid) vistoGuardar(db); else espiarComp(); // na conta pessoal, aproveita para espiar a compartilhada
    let ver = file && file.version, idc = file && file.id;
    if (mesma ? hashId(canonS(db)) !== sync.hash : !remote || canonS(db) !== canonS(remote)){
      if (sid) await sharedWrite(sid, JSON.stringify(db));
      else { const r = await driveWrite(file && file.id, 'financas.json', await fechaGz(JSON.stringify(db))); try { ({id:idc, version:ver} = JSON.parse(r.text)); } catch(e){ ver = ''; } }
    }
    if (!sid) Object.assign(sync, {idConta:idc || '', verConta:ver ? String(ver) : '', hash:hashId(canonS(db))});
    centralAdd('Sincronização efetuada', 'sucesso', 0, {k:'sync'});
    Object.assign(sync, {linked:true, at:Date.now(), err:'', retry:0, pend:Math.max(0, (sync.pend || 0) - pend0), pausa:false, nConta:nRegs(db)}); // o que foi salvo durante a sincronização continua pendente
    clearTimeout(retryTimer);
    await dailyBackup().catch(() => {}); // a cópia diária não pode derrubar a sincronização
    await syncPhotos().catch(() => {});  // comprovantes pendentes: se falhar, ficam na fila para a próxima vez
    await sheetSync().catch(() => {});   // planilha do Google ligada ao app (se houver)
  } catch(e){
    // Conta compartilhada encerrada pela outra pessoa (aviso na planilha) ou planilha apagada: este aparelho volta sozinho
    // para a conta individual, ficando com uma cópia dos lançamentos.
    if (shared() && (e.status === -4 || e.status === 404)){ shareEnded(e.por || ''); return; }
    if (e.status !== 0 && e.status !== -1) logErr('sincronizar', e.status ? e.status + ' ' + String(e.text).slice(0, 300) : e);
    if (e.status === -7){ sync.pausa = true; if (interactive || !sheetOpen()) openPausa(); }
    if (e.status === -8) tell('Não encontramos os dados na sua conta Google. Se precisar, restaure uma cópia em "Versões salvas".');
    sync.err = e.status === -7 ? PAUSA_MSG : e.status === -8 ? 'Não encontramos os dados na sua conta Google.' : e.status === -3 ? 'Os dados da conta foram gravados por uma versão mais nova do app. Atualize o app neste aparelho.'
      : shared() && sharedMsg(e) ? sharedMsg(e)
      : e.status === -1 ? 'É preciso entrar na conta Google.' : e.status === -5 && !shared() ? (sync.linked ? MSG_ESCOPO_CONTA : MSG_ESCOPO) : erroAmigavel(e);
    centralAdd('Erro ao sincronizar: ' + sync.err, 'erro', 0, {k:'sync'});
    // Permissão desmarcada na tela do Google, num pedido da pessoa: oferece tentar de novo (na tela de entrada, o próprio
    // botão "Entrar com Google" faz isso).
    if (e.status === -5 && interactive && sync.linked) ask(sync.err, 'Tentar de novo').then(sim => { if (sim) syncNow(true); });
    // Sem internet ou falha do servidor: tenta de novo sozinho, esperando cada vez mais (30 s, 1 min, 2 min… até 30 min).
    if (e.status === 0 || e.status >= 500 || e.status === undefined){
      sync.retry = Math.min((sync.retry || 0) + 1, 8);
      clearTimeout(retryTimer); retryTimer = setTimeout(syncNow, retryDelay(sync.retry));
    }
  } finally {
    syncing = false;
    saveSync(); nuvemDraw();
    if (settingsShown()) openSettings();
    if (syncAgain){ syncAgain = false; scheduleSync(); }
  }
}
// Uma cópia por dia na conta, guardada por 30 dias, para desfazer um erro ou uma importação errada.
const dayStr = t => new Date(t).toLocaleDateString('sv'); // AAAA-MM-DD
async function dailyBackup(){
  const today = dayStr(Date.now());
  if (sync.bk === today) return;
  const files = await driveList("name contains 'backup-'");
  if (!files.some(f => f.name === `backup-${today}.json`)){ await driveWrite(null, `backup-${today}.json`, JSON.stringify(db), {n:String(nLanc(db))}); centralAdd('Cópia do dia salva na sua conta Google (Versões salvas).', 'sucesso', 0, {k:'sync'}); }
  const oldest = `backup-${dayStr(Date.now() - 30*864e5)}.json`;
  for (const f of files) if (f.name < oldest) await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`);
  sync.bk = today;
}
// Lançamentos (ganhos, gastos e compras parceladas), para a tela "Versões salvas" ajudar a escolher.
const nLanc = d => ['incomes', 'expenses', 'installments'].reduce((t, c) => t + ((d && d[c]) || []).length, 0);
// Cópia feita antes de restaurar: backup-AAAA-MM-DD-antes-HHMM.json. Começa com a data, como as diárias: a limpeza de 30
// dias e as versões antigas do app (que mostram a data do nome) continuam funcionando com ela.
const backupData = n => n.slice(7, 17), backupAntes = n => /-antes-(\d\d)(\d\d)/.exec(n);
function backupNome(f){
  const a = backupAntes(f.name), t = f.modifiedTime ? new Date(f.modifiedTime) : null;
  const hora = a ? `${a[1]}:${a[2]}` : t ? t.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';
  return (a ? (f.appProperties && f.appProperties.antes === 'importar' ? 'Antes de importar – ' : 'Antes de restaurar – ') : '') + fmtDate(backupData(f.name)) + (hora ? ', ' + hora : '');
}
async function openBackups(){
  if (demoBloqueia()) return;
  settingsOpen = false; F = null;
  showSheet('<h3>Versões salvas na conta</h3><div class="hint">Carregando…</div>');
  let files;
  try { files = await comCarga('Buscando as versões salvas…', () => driveList("name contains 'backup-'", false, ',modifiedTime,appProperties')); }
  catch(e){ return showSheet('<h3>Versões salvas na conta</h3><div class="hint">Não foi possível carregar. Verifique a internet.</div><div class="btns"><button class="btn" data-onclick="openSettings(\'conta\')">Voltar</button></div>'); }
  showSheet(`<h3>Versões salvas na conta</h3>
    <div class="hint" style="margin-top:0">O app guarda uma cópia por dia de uso, por 30 dias. Restaurar troca todos os dados atuais pelos daquele dia, em todos os aparelhos.</div>
    ${files.length ? files.map(f => { const n = f.appProperties && +f.appProperties.n;
      return `<div class="item" data-id="${esc(f.id)}" data-name="${esc(f.name)}" data-onclick="restoreBackup(this.dataset.id,this.dataset.name)"><div class="mid"><b>${esc(backupNome(f))}</b>${n >= 0 && f.appProperties.n !== '' ? `<small>${n} ${n === 1 ? 'lançamento' : 'lançamentos'}</small>` : ''}</div><div class="muted">Restaurar ›</div></div>`; }).join('') : '<div class="hint">Ainda não há cópias. A primeira é criada na próxima sincronização.</div>'}
    <div class="btns"><button class="btn" data-onclick="openSettings('conta')">Voltar</button></div>`);
}
// Grava os dados atuais em "Versões salvas" como backup-AAAA-MM-DD-antes-HHMM.json (motivo: '1' = restaurar, 'importar').
async function copiaAntes(motivo){
  const t = new Date(), hhmm = t.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}).replace(':', '');
  await comCarga('Guardando uma cópia dos dados atuais…', () => driveWrite(null, `backup-${dayStr(t)}-antes-${hhmm}.json`, JSON.stringify(db), {n:String(nLanc(db)), antes:motivo}));
}
async function restoreBackup(id, name){
  if (demoBloqueia()) return;
  if (!await ask(`Restaurar os dados de ${backupNome({name})}?\nOs dados atuais serão substituídos. Antes, o app guarda uma cópia deles em "Versões salvas", para dar para desfazer.`, 'Restaurar', true)) return;
  let snap;
  try { snap = fixDb(await comCarga('Baixando a versão escolhida…', () => driveGet(id))); } catch(e){ return tell('Não foi possível baixar essa versão.'); }
  // Cópia do estado atual antes de trocar ("antes de restaurar"): restaurar essa cópia desfaz a restauração.
  try { await copiaAntes('1'); }
  catch(e){ logErr('cópia antes de restaurar', e.status ? e.status + ' ' + String(e.text).slice(0, 300) : e); return tell('Não foi possível guardar a cópia dos dados atuais, então nada foi restaurado. Verifique a internet e tente de novo.'); }
  // Para a restauração valer em todos os aparelhos: tudo o que veio da cópia fica como "alterado agora",
  // e o que existe hoje mas não existia nela é marcado como excluído.
  applySnapshot(snap);
  syncNow();
}
// Sai da conta Google no lado nativo. Com o bloqueio ligado, o Android pede antes a senha ou a biometria e responde
// em onSair(true/false); a promessa diz se saiu. Sem o lado nativo, não há o que confirmar.
function sairNativo(){
  if (!(window.Android && Android.sair)) return Promise.resolve(true);
  return new Promise(res => { window.onSair = ok => { window.onSair = null; res(ok !== false); }; Android.sair(); });
}
// Sair da conta (para trocar de conta): envia o que falta, apaga os dados deste aparelho e volta ao login.
// Os dados precisam sair do aparelho; senão, ao entrar com outra conta, eles seriam misturados aos dela.
async function logout(){
  if (demoBloqueia()) return;
  if (!await ask('Sair da conta Google?\n\nOs dados deste aparelho serão apagados. Eles continuam salvos na sua conta e voltam quando você entrar de novo com ela.', 'Sair', true)) return;
  if (canSync()){
    await syncNow();
    if (sync.err && !await ask(`Não foi possível sincronizar agora (${sync.err})\n\nSe sair mesmo assim, as alterações ainda não enviadas serão perdidas. Sair?`, 'Sair mesmo assim', true)) return;
    // O próximo login volta a perguntar qual conta usar. Sem a senha ou a biometria (bloqueio ligado), nada muda.
    if (!await sairNativo()) return;
  }
  clearTimeout(syncTimer);
  db.expenses.filter(x => x.photo).forEach(x => photoDelete(x.id)); // as fotos continuam na conta; aqui saem junto com os dados
  // Tema, cores, abas e o resto das preferências voltam ao padrão (fica só o idioma): a tela de login e quem entrar depois
  // não herdam o jeito de quem saiu. As preferências de cada conta voltam com ela, da conta Google.
  db = fixDb({rates:db.rates, prefs:db.prefs.lang ? {lang:db.prefs.lang} : {}});
  ensurePrefs(); applyCats(); applyTheme();
  chatLog.length = 0;
  Object.assign(sync, {on:false, linked:false, demo:false, err:'', at:0, bk:'', up:[], del:[], shared:null});
  saveSync(); save(false); closeForm(); render(); showGate();
  iconePadrao();
}
// Ícone do app (só no Android) de volta ao padrão: o do Cofrim (cor índigo, desenho b). Pode fechar o app no Android,
// por isso fica por último, com os dados já apagados e a tela de login à mostra.
function iconePadrao(){
  if (!(window.Android && Android.setIconeApp && Android.icone)) return;
  if (Android.icone() !== 'indigo' || Android.iconeDesenho() !== 'b') Android.setIconeApp('indigo', 'b', 0);
}
// Apaga tudo: os arquivos do app na conta Google e os dados deste aparelho; depois volta à tela de login.
async function wipeAll(semPerguntar){
  if (demoBloqueia()) return;
  // Na conta compartilhada, apagar tudo apagaria os dados da outra pessoa também.
  if (shared()){ tell('Você está numa conta compartilhada. Saia dela antes (Configurações > Conta compartilhada) para apagar os seus dados.'); return; }
  if (!semPerguntar){
    if (!await ask('Apagar todos os seus dados?\n\nSomem os lançamentos deste aparelho e os da sua conta Google, com as cópias diárias e os comprovantes. Outros aparelhos com esta conta também ficam sem os dados.', 'Apagar tudo', true)) return;
    if (!await ask('Tem certeza? Isso não pode ser desfeito.', 'Sim, apagar', true)) return;
  }
  if (canSync() && sync.on){
    try {
      for (let volta = 0; volta < 20; volta++){
        const files = await driveList('trashed=false');
        if (!files.length) break;
        for (const f of files) ok(await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`));
      }
    } catch(e){ return tell('Não consegui apagar os dados da conta Google (sem internet?). Nada foi apagado neste aparelho; tente de novo.'); }
    await sairNativo(); // os dados da conta já foram apagados: os deste aparelho saem mesmo se a senha não for confirmada
  }
  clearTimeout(syncTimer); clearTimeout(retryTimer);
  db.expenses.filter(x => x.photo).forEach(x => photoDelete(x.id));
  for (const k of [KEY, ERR_KEY, BEFORE_KEY, FUN_KEY, HIDE_KEY, VER_KEY, DRAFT]) try { localStorage.removeItem(k); } catch(e){}
  if (!fileStore()) idbWrite('').catch(() => {});
  if (window.Android && Android.dadosApagar) Android.dadosApagar();
  db = fixDb({});
  ensurePrefs(); applyCats(); applyTheme();
  chatLog.length = 0; hideVals = false;
  Object.assign(sync, {on:false, linked:false, demo:false, err:'', at:0, bk:'', up:[], del:[], tries:{}, retry:0, welcomed:false, lockAsked:sync.lockAsked, shared:null, tour:false, account:'', askedShare:false, famOk:false});
  saveSync(); save(false); closeForm(); render(); showGate();
}
// ---------- Arquivo de anos antigos ----------
// Tira dos dados do dia a dia os lançamentos até o ano Y (inclusive) e guarda num arquivo na conta Google, para a
// sincronização não crescer para sempre. Vão para o arquivo: ganhos e gastos avulsos do período, fixos que já terminaram,
// compras parceladas já encerradas e transferências. Ordem segura: grava o arquivo, confere lendo de volta e só então tira.
const ARCH_COLS = ['incomes', 'expenses', 'installments', 'transfers'];
function archPick(Y){
  const ate = ym => ym && ym.slice(0, 4) <= Y;
  return {
    incomes:db.incomes.filter(x => x.fixed ? ate(x.end) : ate(x.start)),
    expenses:db.expenses.filter(x => x.fixed ? ate(x.end) : ate(x.start)),
    installments:db.installments.filter(p => ate(addMonths(p.start, p.n - 1))),
    transfers:db.transfers.filter(t => ate(t.month))};
}
async function archiveUntil(Y, semPerguntar){
  if (demoBloqueia()) return;
  if (!(canSync() && sync.on)) return tell('O arquivo fica na sua conta Google: entre com a conta para usar.');
  if (shared()) return tell('Na conta compartilhada ainda não dá para arquivar anos antigos (o arquivo ficaria só na sua conta).');
  const pick = archPick(Y), n = ARCH_COLS.reduce((t, c) => t + pick[c].length, 0);
  if (!n) return tell(`Não há lançamentos até ${Y} para arquivar.`);
  if (!semPerguntar && !await ask(`Arquivar ${n} lançamentos de ${Y} e antes?\n\nEles saem dos dados do dia a dia (a sincronização fica mais leve) e vão para um arquivo na sua conta Google. Os resumos desses anos continuam aparecendo, mas os lançamentos não podem ser editados enquanto estiverem arquivados. Dá para trazer de volta.`, 'Arquivar')) return;
  try {
    const f = (await driveList("name='arquivo.json'"))[0], velho = f ? await driveGet(f.id) : {};
    const novo = {until:[Y, velho.until || ''].sort().pop()};
    for (const c of ARCH_COLS){ const m = new Map((velho[c] || []).map(r => [r.id, r])); for (const r of pick[c]) m.set(r.id, r); novo[c] = [...m.values()]; }
    await driveWrite(f && f.id, 'arquivo.json', JSON.stringify(novo));
    const g = (await driveList("name='arquivo.json'"))[0], conf = g ? await driveGet(g.id) : {};
    if (ARCH_COLS.some(c => (conf[c] || []).length !== novo[c].length)) throw new Error('a conferência do arquivo não bateu');
    // Contas acompanhadas desde o período arquivado: o saldo do fim dele vira o saldo inicial, e os saldos não mudam.
    for (const a of db.accounts) if (a.since.slice(0, 4) <= Y) Object.assign(touch(a), {initial:round2(accountBalance(a, monthEnd(Y + '-12'))), since:(+Y + 1) + '-01'});
    const t = Date.now();
    for (const c of ARCH_COLS){ const ids = new Set(pick[c].map(r => r.id)); db[c] = db[c].filter(r => !ids.has(r.id)); ids.forEach(id => db.tomb[id] = t); }
    db.archUntil = novo.until; db.cfgMod = t;
    arch = novo; try { localStorage.setItem(ARCH_KEY, JSON.stringify(novo)); } catch(e){}
    save(); closeForm(); render();
    await syncNow();
    toast(`${n} lançamentos arquivados.`);
  } catch(e){ logErr('arquivar', e); tell('Não foi possível arquivar agora (sem internet?). Nada foi tirado dos seus dados.'); }
}
async function archiveRestore(semPerguntar){
  if (demoBloqueia()) return;
  if (!semPerguntar && !await ask('Trazer de volta todos os lançamentos arquivados?\nEles voltam a ser editáveis e a sincronizar normalmente.', 'Trazer de volta')) return;
  if (!arch && canSync() && sync.on) try { const f = (await driveList("name='arquivo.json'"))[0]; if (f) arch = await driveGet(f.id); } catch(e){}
  if (!arch) return tell('Não consegui abrir o arquivo (sem internet?). Tente de novo.');
  const t = Date.now();
  for (const c of ARCH_COLS) for (const r of arch[c] || []) if (!db[c].some(x => x.id === r.id)){ db[c].push({...r, u:t}); delete db.tomb[r.id]; }
  db.archUntil = ''; db.cfgMod = t; arch = null;
  try { localStorage.removeItem(ARCH_KEY); } catch(e){}
  save(); closeForm(); render();
  await syncNow();
  try { const f = (await driveList("name='arquivo.json'"))[0]; if (f) ok(await drive('DELETE', `${DRIVE}/drive/v3/files/${f.id}`)); } catch(e){}
  toast('Lançamentos trazidos de volta.');
}
function archHtml(){
  const ultimo = String(now.getFullYear() - 1), anos = [...new Set([...db.incomes, ...db.expenses].map(x => x.start.slice(0, 4)))].filter(y => y <= ultimo).sort();
  if ((!db.archUntil && !anos.length) || shared()) return '';
  return `<label>Anos antigos</label>
    ${db.archUntil ? `<div class="hint" style="margin-top:0">Arquivado até ${db.archUntil}.</div>` : ''}
    <div class="btns" style="margin-top:${db.archUntil ? 8 : 0}px">${anos.length ? `<button class="btn" data-onclick="archivePick()">${I('box')}Arquivar anos antigos</button>` : ''}${db.archUntil ? '<button class="btn" data-onclick="archiveRestore()">Trazer de volta</button>' : ''}</div>
    <div class="hint">Tira da sincronização do dia a dia os lançamentos de anos que já passaram e guarda num arquivo na sua conta Google. Os resumos desses anos continuam aparecendo.</div>`;
}
function archivePick(){
  const ultimo = String(now.getFullYear() - 1), anos = [...new Set([...db.incomes, ...db.expenses].map(x => x.start.slice(0, 4)))].filter(y => y <= ultimo).sort().reverse();
  pickList('Arquivar até o ano (inclusive)', anos.map(y => [y, y]), '', y => archiveUntil(y));
}
function syncSection(){
  if (!canSync()) return !isPreview ? '' : `<label>Conta Google</label><div class="hint in" style="margin-top:0">${I('check', 14)} Conectado (demonstração)</div>
    <div class="btns"><button class="btn" disabled style="opacity:.5">${I('history')}Versões salvas</button><button class="btn danger" style="flex:1" data-onclick="logout()">Sair ou trocar de conta</button></div>`;
  const status = syncing ? 'Sincronizando…' : sync.err ? `<span class="warn">${I('alert', 14)}</span> ` + esc(sync.err)
    : sync.at ? `<span class="in">${I('check', 14)}</span> Sincronizado em ` + new Date(sync.at).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : 'Ainda não sincronizado.';
  const email = Android.conta ? Android.conta() : '';
  return `<label>Conta Google</label>${email ? `<div class="hint" style="margin-top:0">Conectado como <b>${esc(email)}</b></div>` : ''}<div class="hint" style="margin-top:${email ? 4 : 0}px">${status}</div>
    <div class="btns"><button class="btn" data-onclick="syncNow(true)">${I('refresh')}Sincronizar agora</button><button class="btn" data-onclick="openBackups()">${I('history')}Versões salvas</button></div>
    ${pausaHtml()}${beforeHtml()}${conflitoLista().length ? `<div class="btns"><button class="btn" data-onclick="openConflitos()">${I('alert')}Editados em dois aparelhos (${conflitoLista().length})</button></div>` : ''}
    <div class="btns"><button class="btn danger" style="flex:1" data-onclick="logout()">Sair ou trocar de conta</button></div>`;
}
