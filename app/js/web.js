// Cofrim — Versão web (navegador e iPhone, pelo "Adicionar à Tela de Início").
// Carregado pelo index.html antes do inicio.js. No APK não faz nada: lá o lado nativo já define window.Android.
// Aqui ele faz o papel do lado nativo só no que é conta Google — drive(), driveFamilia(), conta(), nome(), sair(),
// copiar(). Lembretes, widget, notificações do banco e câmera nativa não existem na web, e o app já se ajusta pela
// falta dessas funções.
// Login: fluxo de redirecionamento do Google (a página vai ao Google e volta com o acesso no endereço, depois do #).
// Janelas pop-up não funcionam em apps da tela de início do iPhone. O acesso vale 1 hora; ao abrir o app depois
// disso, ele é renovado sem pedir nada (prompt=none), se a pessoa continuar conectada no Google.
const WEB_CLIENT_ID = '357521269892-ja1te6htb465odtcp73vqu4e7j80330k.apps.googleusercontent.com';
// credencial OAuth do tipo "Aplicativo da Web" no projeto do Google Cloud
// No PC (localhost) a prévia continua em modo de demonstração; ?web=1 testa a versão web (e a volta do Google, com #).
const WEB_APP = !window.Android && location.protocol !== 'file:' && (location.hostname !== 'localhost' || /[?&]web=1/.test(location.search) || /^#(access_token|error)=/.test(location.hash) || /[#&]state=/.test(location.hash));
if (WEB_APP) (() => {
  const K = 'financas-web', KS = 'financas-web-acesso', AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
  const BASE = 'openid email profile https://www.googleapis.com/auth/drive.appdata';
  const FAM = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
  const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive.appdata';
  const ARQ = 'https://www.googleapis.com/auth/drive.file'; // "Salvar cópia" (pasta Cofrim visível no Drive), pedida só no toque
  // st: {t (acesso), exp, fam (já autorizou a conta compartilhada), email, name, state, after, silentAt,
  //      pedirConsent (a pessoa desmarcou alguma permissão: na próxima ida ao Google, mostrar as caixas de novo)}
  // O acesso (t, exp) fica no sessionStorage: some ao fechar o navegador ou o app e não fica gravado no aparelho; o resto
  // (e-mail, pedirConsent, state da ida ao Google…) fica no localStorage. A volta do Google acontece na mesma aba, então o
  // sessionStorage continua lá; sem ele (app reaberto), a renovação silenciosa pede um acesso novo.
  let st = {};
  try { st = JSON.parse(localStorage.getItem(K)) || {}; } catch(e){}
  try { Object.assign(st, JSON.parse(sessionStorage.getItem(KS)) || {}); } catch(e){}
  const keep = () => {
    const {t, exp, ...resto} = st;
    try { localStorage.setItem(K, JSON.stringify(resto)); } catch(e){}
    try { if (t) sessionStorage.setItem(KS, JSON.stringify({t, exp})); else sessionStorage.removeItem(KS); } catch(e){}
  };
  keep(); // versões anteriores guardavam o acesso no localStorage: passa para o sessionStorage
  // state da ida ao Google: 16 bytes aleatórios do navegador (crypto), em hexadecimal.
  const novoState = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const valid = (fam, arq) => st.t && st.exp > Date.now() + 60e3 && (!fam || st.fam) && (!arq || st.arq || st.fam);
  const voltaPara = () => location.origin + location.pathname;

  // Vai ao Google. after: o que fazer quando voltar (entrar, sincronizar, continuar a conta compartilhada).
  function redirect(fam, after, silencioso, arq){
    if (!WEB_CLIENT_ID) return false;
    st.state = novoState(); st.after = after; keep();
    const p = new URLSearchParams({client_id:WEB_CLIENT_ID, redirect_uri:voltaPara(), response_type:'token', include_granted_scopes:'true',
      scope:BASE + (fam || st.fam ? ' ' + FAM : '') + (arq ? ' ' + ARQ : ''), state:st.state});
    if (st.email) p.set('login_hint', st.email);
    if (st.pedirConsent) p.set('prompt', 'consent'); // o Google mostra de novo as caixas de permissão
    else if (silencioso) p.set('prompt', 'none'); else if (!st.email) p.set('prompt', 'select_account');
    location.assign(AUTH + '?' + p);
    return true;
  }
  // O que estava acontecendo quando foi preciso ir ao Google, para continuar sozinho na volta.
  function contexto(fam, arq){
    if (!document.getElementById('gate').hidden) return {k:'login'};
    if (arq) return {k:'copia'};
    const email = document.getElementById('shEmail'), code = document.getElementById('shCode');
    if (fam && email) return {k:sync.shared ? 'invite' : 'start', v:email.value};
    if (fam && code) return {k:'join', v:code.value};
    if (fam && document.getElementById('shCreate')) return {k:'sheet'};
    return {k:'sync'};
  }

  // Volta do Google: o acesso chega depois do # do endereço.
  const h = new URLSearchParams(location.hash.slice(1)), voltou = h.has('access_token') || h.has('error');
  let depois = null;
  if (voltou){
    history.replaceState(null, '', voltaPara() + location.search);
    if (h.get('state') === st.state){
      depois = st.after || {k:'sync'};
      if (h.has('access_token')){
        // Na tela do Google dá para desmarcar a permissão do Drive: o login funciona, mas sem ela nada sincroniza
        // (403 "insufficient authentication scopes"). Sem o Drive, o acesso não é guardado e a pessoa é avisada.
        const escopo = (h.get('scope') || '').split(' ');
        if (!escopo.includes(ESCOPO_DRIVE)){ st.pedirConsent = true; depois = {...depois, erro:'escopo'}; }
        else {
          st.t = h.get('access_token'); st.exp = Date.now() + (+h.get('expires_in') || 3600) * 1000; st.pedirConsent = false;
          if (FAM.split(' ').every(s => escopo.includes(s))) st.fam = true;
          st.arq = escopo.includes(ARQ);
          if (depois.k === 'copia' && !st.arq) depois = {...depois, erro:'escopo'};
          // Pediu a conta compartilhada e desmarcou as caixas dela: avisa (famNegado), em vez de voltar ao Google sem fim.
          else if (['start', 'invite', 'join', 'sheet'].includes(depois.k)) depois = {...depois, erro:'escopo'};
        }
      } else depois = {...depois, erro:h.get('error')};
    }
    st.state = ''; st.after = null; keep();
  }

  async function perfil(){
    try {
      const u = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {headers:{Authorization:'Bearer ' + st.t}})).json();
      if (u.email){ st.email = u.email; st.name = u.given_name || ''; keep(); }
    } catch(e){}
  }
  // Mesma resposta do lado nativo: onDrive(id, status, texto). 0 = sem conexão; -1 = precisa entrar na conta; -2 = outro erro.
  async function call(id, method, url, body, ctype, interactive, fam, arq){
    if (!/^https:\/\/(www|sheets)\.googleapis\.com\//.test(url) || (!fam && url.startsWith('https://sheets.'))) return onDrive(id, -2, 'URL não permitida');
    if (!valid(fam, arq)){
      if (!interactive || !redirect(fam, contexto(fam, arq), false, arq)) return onDrive(id, -1, WEB_CLIENT_ID ? 'login' : 'Login web não configurado');
      return; // a página vai ao Google; a ação continua na volta
    }
    if (!st.email) await perfil();
    try {
      const r = await fetch(url, {method, headers:{Authorization:'Bearer ' + st.t, ...(body ? {'Content-Type':ctype} : {})}, body:body || undefined});
      if (r.status === 401){ st.t = ''; keep(); return call(id, method, url, body, ctype, interactive, fam, arq); }
      const texto = await r.text();
      // Acesso sem a permissão necessária (caixa desmarcada no Google): -5, para o app pedir de novo com as caixas.
      if (r.status === 403 && /insufficient.*scope|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(texto)){
        logErr('permissão do Google', '403 ' + texto.slice(0, 300));
        if (fam) st.fam = false; else if (arq) st.arq = false; else { st.t = ''; st.pedirConsent = true; }
        keep();
        return onDrive(id, -5, 'escopo');
      }
      onDrive(id, r.status, texto);
    } catch(e){ onDrive(id, 0, String(e.message || e)); }
  }

  window.Android = {
    drive:(id, m, u, b, c, i) => { call(id, m, u, b, c, i, false); },
    driveFamilia:(id, m, u, b, c, i) => { call(id, m, u, b, c, i, true); },
    driveArquivo:(id, m, u, b, c, i) => { call(id, m, u, b, c, i, false, true); },
    conta:() => st.email || '',
    nome:() => st.name || '',
    sair(){ if (st.t) fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(st.t), {method:'POST'}).catch(() => {}); st = {};
      keep(); if (window.onSair) onSair(true); },
    copiar:t => { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); }
  };

  // Ao abrir o app com o acesso vencido (dura 1 hora), renova sem pedir nada; no máximo uma vez a cada 10 min.
  // Com uma permissão pendente (pedirConsent) não adianta: a renovação silenciosa não mostra as caixas.
  if (!voltou && st.email && !st.pedirConsent && !valid() && navigator.onLine && Date.now() - (st.silentAt || 0) > 10 * 60e3){
    st.silentAt = Date.now(); keep();
    redirect(false, {k:'sync'}, true);
  }

  // Continua o que estava sendo feito antes de ir ao Google (chamado pelo inicio.js, com o app já desenhado).
  window.webResume = () => {
    if (!depois) return;
    const d = depois; depois = null;
    if (d.erro){
      if (d.k === 'login') document.getElementById('gateMsg').textContent = d.erro === 'escopo' ? MSG_ESCOPO : 'Não foi possível entrar com o Google. Tente de novo.';
      else if (['start', 'invite', 'join', 'sheet'].includes(d.k)) famNegado();
      else if (d.k === 'copia') tell(MSG_COPIA);
      else if (d.erro === 'escopo') tell(MSG_ESCOPO);
      return; // renovação silenciosa que falhou: o status da sincronização avisa que é preciso entrar de novo
    }
    if (d.k === 'login') loginGoogle();
    else if (d.k === 'start') shareStart(d.v, true);
    else if (d.k === 'invite') shareInvite(d.v);
    else if (d.k === 'join') shareJoin(d.v);
    else if (d.k === 'sheet') sheetCreate(true);
    else if (d.k === 'copia') salvarCopiaDrive();
    else syncNow();
  };
})();
// iPhone e iPad no Safari, fora do app instalado: como instalar na tela de início.
const iosNoBrowser = () => WEB_APP && /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;

// ---------- Instalar o app (atalho na tela de início) ----------
// Android e computador (Chrome, Edge, Samsung Internet): o navegador avisa que dá para instalar (beforeinstallprompt) e o
// botão abre a janela de instalação dele. iPhone: o Safari não deixa uma página instalar sozinha; o botão mostra o caminho
// (Compartilhar › Adicionar à Tela de Início). Android com outro navegador: o caminho pelo menu dele.
let pedidoInstalar = null;
const appInstalado = () => !!navigator.standalone || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
const ehIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const podeInstalar = () => WEB_APP && !appInstalado() && (!!pedidoInstalar || ehIphone() || /Android/.test(navigator.userAgent));
if (WEB_APP) {
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; if (typeof renderIn === 'function' && db) renderIn(); });
  addEventListener('appinstalled', () => { pedidoInstalar = null; if (typeof renderIn === 'function' && db) renderIn(); });
}
async function instalarApp(){
  if (pedidoInstalar){
    const p = pedidoInstalar; pedidoInstalar = null;
    try { p.prompt(); await p.userChoice; } catch(e){}
    if (typeof renderIn === 'function') renderIn();
    return;
  }
  settingsOpen = false; F = null;
  const safari = !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  showSheet(`<h3>Instalar o Cofrim</h3>${ehIphone()
    ? `<div class="semTopo hint">No iPhone e no iPad, o app entra na Tela de Início assim:</div>
      <ol class="passos"><li>${safari ? 'Toque em <b>Compartilhar</b> (o quadrado com a seta para cima, na barra do Safari).' : 'Toque em <b>Compartilhar</b> (o quadrado com a seta para cima, ao lado do endereço). Se não aparecer, abra esta página no Safari.'}</li>
      <li>Role a lista e toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>. O Cofrim aparece na Tela de Início, com o ícone do tema em uso.</li></ol>`
    : `<div class="semTopo hint">Este navegador não abriu a instalação sozinho. Faça pelo menu dele:</div>
      <ol class="passos"><li>Toque no menu do navegador (<b>⋮</b> ou <b>☰</b>).</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme. O Cofrim aparece na tela inicial como um app.</li></ol>
      <div class="hint">No Chrome do Android a instalação abre direto pelo botão. Para o app completo, com widgets e lembretes, há o app para Android na página do Cofrim.</div>`}
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Entendi</button></div>`);
}
// Aviso no topo do Resumo, enquanto o app não estiver instalado (some ao instalar ou ao tocar no X).
const INST_AVISO = 'financas-instalar-fechado';
function avisoInstalar(){
  if (!podeInstalar()) return '';
  try { if (localStorage.getItem(INST_AVISO)) return ''; } catch(e){}
  return `<div class="card instAviso"><div class="mid"><b>Instale o Cofrim</b><small>Abre direto da tela inicial, como um app.</small></div>
    <button class="btn primary" data-onclick="instalarApp()">${I('download')}Instalar</button><button class="iconbtn" aria-label="Fechar" data-onclick="fecharAvisoInstalar()">${I('close')}</button></div>`;
}
function fecharAvisoInstalar(){ try { localStorage.setItem(INST_AVISO, '1'); } catch(e){} renderIn(); }

// Ícone da versão web conforme o tema: o iPhone (e o navegador) usam o ícone que a página indica na hora em que a
// pessoa adiciona o app à tela de início; depois disso o sistema não deixa trocar. Então a página mantém o ícone
// indicado igual ao tema em uso: com tema especial, o ícone dele; sem tema, o ícone do Cofrim na cor escolhida.
function webIcone(){
  if (!WEB_APP || window.TESTE || typeof iconeMiolo !== 'function') return;
  const p = db.prefs, cor = p.skin || p.color, c = ICONES[cor] || ICONES.indigo;
  const svg = !p.skin && iconeCofrim(cor, 'b') ? iconeSvg(cor, 'b').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 18 72 72"><defs><linearGradient id="wi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs><rect x="18" y="18" width="72" height="72" fill="url(#wi)"/>${iconeMiolo(cor, p.skin ? 't' : 'b')}</svg>`;
  const img = new Image();
  img.onload = () => {
    try {
      const cv = document.createElement('canvas'); cv.width = cv.height = 180;
      cv.getContext('2d').drawImage(img, 0, 0, 180, 180);
      const url = cv.toDataURL('image/png');
      document.querySelector('link[rel="apple-touch-icon"]').href = url;
      document.querySelector('link[rel="icon"]').href = url;
    } catch(e){}
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}
webIcone();
