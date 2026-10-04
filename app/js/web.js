// Minhas Finanças — Versão web (navegador e iPhone, pelo "Adicionar à Tela de Início").
// Carregado pelo index.html antes do inicio.js. No APK não faz nada: lá o lado nativo já define window.Android.
// Aqui ele faz o papel do lado nativo só no que é conta Google — drive(), driveFamilia(), conta(), nome(), sair(),
// copiar(). Lembretes, widget, notificações do banco e câmera nativa não existem na web, e o app já se ajusta pela
// falta dessas funções.
// Login: fluxo de redirecionamento do Google (a página vai ao Google e volta com o acesso no endereço, depois do #).
// Janelas pop-up não funcionam em apps da tela de início do iPhone. O acesso vale 1 hora; ao abrir o app depois
// disso, ele é renovado sem pedir nada (prompt=none), se a pessoa continuar conectada no Google.
const WEB_CLIENT_ID = '357521269892-ja1te6htb465odtcp73vqu4e7j80330k.apps.googleusercontent.com'; // credencial OAuth do tipo "Aplicativo da Web" no projeto do Google Cloud
// No PC (localhost) a prévia continua em modo de demonstração; ?web=1 testa a versão web (e a volta do Google, com #).
const WEB_APP = !window.Android && location.protocol !== 'file:' && (location.hostname !== 'localhost' || /[?&]web=1/.test(location.search) || /^#(access_token|error)=/.test(location.hash) || /[#&]state=/.test(location.hash));
if (WEB_APP) (() => {
  const K = 'financas-web', AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
  const BASE = 'openid email profile https://www.googleapis.com/auth/drive.appdata';
  const FAM = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
  // st: {t (acesso), exp, fam (já autorizou a conta compartilhada), email, name, state, after, silentAt}
  let st = {};
  try { st = JSON.parse(localStorage.getItem(K)) || {}; } catch(e){}
  const keep = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch(e){} };
  const valid = fam => st.t && st.exp > Date.now() + 60e3 && (!fam || st.fam);
  const voltaPara = () => location.origin + location.pathname;

  // Vai ao Google. after: o que fazer quando voltar (entrar, sincronizar, continuar a conta compartilhada).
  function redirect(fam, after, silencioso){
    if (!WEB_CLIENT_ID) return false;
    st.state = Math.random().toString(36).slice(2); st.after = after; keep();
    const p = new URLSearchParams({client_id:WEB_CLIENT_ID, redirect_uri:voltaPara(), response_type:'token', include_granted_scopes:'true',
      scope:BASE + (fam || st.fam ? ' ' + FAM : ''), state:st.state});
    if (st.email) p.set('login_hint', st.email);
    if (silencioso) p.set('prompt', 'none'); else if (!st.email) p.set('prompt', 'select_account');
    location.assign(AUTH + '?' + p);
    return true;
  }
  // O que estava acontecendo quando foi preciso ir ao Google, para continuar sozinho na volta.
  function contexto(fam){
    if (!document.getElementById('gate').hidden) return {k:'login'};
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
        st.t = h.get('access_token'); st.exp = Date.now() + (+h.get('expires_in') || 3600) * 1000;
        if (FAM.split(' ').every(s => (h.get('scope') || '').includes(s))) st.fam = true;
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
  async function call(id, method, url, body, ctype, interactive, fam){
    if (!/^https:\/\/(www|sheets)\.googleapis\.com\//.test(url) || (!fam && url.startsWith('https://sheets.'))) return onDrive(id, -2, 'URL não permitida');
    if (!valid(fam)){
      if (!interactive || !redirect(fam, contexto(fam))) return onDrive(id, -1, WEB_CLIENT_ID ? 'login' : 'Login web não configurado');
      return; // a página vai ao Google; a ação continua na volta
    }
    if (!st.email) await perfil();
    try {
      const r = await fetch(url, {method, headers:{Authorization:'Bearer ' + st.t, ...(body ? {'Content-Type':ctype} : {})}, body:body || undefined});
      if (r.status === 401){ st.t = ''; keep(); return call(id, method, url, body, ctype, interactive, fam); }
      onDrive(id, r.status, await r.text());
    } catch(e){ onDrive(id, 0, String(e.message || e)); }
  }

  window.Android = {
    drive:(id, m, u, b, c, i) => { call(id, m, u, b, c, i, false); },
    driveFamilia:(id, m, u, b, c, i) => { call(id, m, u, b, c, i, true); },
    conta:() => st.email || '',
    nome:() => st.name || '',
    sair(){ if (st.t) fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(st.t), {method:'POST'}).catch(() => {}); st = {}; keep(); },
    copiar:t => { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); }
  };

  // Ao abrir o app com o acesso vencido (dura 1 hora), renova sem pedir nada; no máximo uma vez a cada 10 min.
  if (!voltou && st.email && !valid() && navigator.onLine && Date.now() - (st.silentAt || 0) > 10 * 60e3){
    st.silentAt = Date.now(); keep();
    redirect(false, {k:'sync'}, true);
  }

  // Continua o que estava sendo feito antes de ir ao Google (chamado pelo inicio.js, com o app já desenhado).
  window.webResume = () => {
    if (!depois) return;
    const d = depois; depois = null;
    if (d.erro){
      if (d.k === 'login') document.getElementById('gateMsg').textContent = 'Não foi possível entrar com o Google. Tente de novo.';
      else if (['start', 'invite', 'join', 'sheet'].includes(d.k)) famNegado();
      return; // renovação silenciosa que falhou: o status da sincronização avisa que é preciso entrar de novo
    }
    if (d.k === 'login') loginGoogle();
    else if (d.k === 'start') shareStart(d.v, true);
    else if (d.k === 'invite') shareInvite(d.v);
    else if (d.k === 'join') shareJoin(d.v);
    else if (d.k === 'sheet') sheetCreate(true);
    else syncNow();
  };
})();
// iPhone e iPad no Safari, fora do app instalado: como instalar na tela de início.
const iosNoBrowser = () => WEB_APP && /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;

// Ícone da versão web conforme o tema: o iPhone (e o navegador) usam o ícone que a página indica na hora em que a
// pessoa adiciona o app à tela de início; depois disso o sistema não deixa trocar. Então a página mantém o ícone
// indicado igual ao tema em uso: com tema especial, o ícone dele; sem tema, as barras na cor escolhida.
function webIcone(){
  if (!WEB_APP || window.TESTE || typeof iconeMiolo !== 'function') return;
  const p = db.prefs, cor = p.skin || p.color, c = ICONES[cor] || ICONES.indigo;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 18 72 72"><defs><linearGradient id="wi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs><rect x="18" y="18" width="72" height="72" fill="url(#wi)"/>${iconeMiolo(cor, p.skin ? 't' : 'b')}</svg>`;
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
