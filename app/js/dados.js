// Cofrim — Dados, aparência, utilidades, regras de cálculo, cotações, taxas, orçamento, planejamento e contas.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
// ---------- Dados ----------
// window.TESTE: página de testes automáticos (ver testes.js); usa outra chave para não tocar nos dados de verdade.
const KEY = window.TESTE ? 'financas-teste' : 'financas-v1';
// Versão do formato dos dados. Sobe quando um campo muda de significado; um backup ou uma conta com versão
// maior que esta foi gravado por um app mais novo e é recusado, para não estragar o que este app não entende.
const DB_VER = 2;
// Modo demonstração (ver demoLigar em entrada.js): dados fictícios só na memória. demoOn nunca é gravado, então o app
// sempre abre com os dados reais. Com ele ligado nada é gravado neste aparelho nem enviado à conta Google; como rede de
// segurança, o localStorage não aceita gravações.
let demoOn = false;
const DEMO_MSG = 'Disponível ao entrar com sua conta Google.';
const demoBloqueia = () => { if (!demoOn) return false; tell(DEMO_MSG); return true; };
{
  let ls = null; try { ls = localStorage; } catch(e){}
  const grava = Storage.prototype.setItem, apaga = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(k, v){ if (demoOn && this === ls) return; return grava.call(this, k, v); };
  Storage.prototype.removeItem = function(k){ if (demoOn && this === ls) return; return apaga.call(this, k); };
}
// Registro de erros (tela Diagnóstico): os últimos 60, só neste aparelho.
const ERR_KEY = 'financas-erros';
function logErr(onde, e){
  try {
    const list = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
    list.push({t:Date.now(), v:APP_VERSION, onde, msg:String((e && (e.stack || e.message || e.text)) || e).slice(0, 600)});
    localStorage.setItem(ERR_KEY, JSON.stringify(list.slice(-60)));
  } catch(x){}
}
addEventListener('error', e => logErr('erro na tela', (e.message || '') + ' @' + (e.lineno || 0) + ':' + (e.colno || 0)));
addEventListener('unhandledrejection', e => logErr('promessa', e.reason));
const APP_VERSION = '1.74'; // manter igual ao versionName do build.gradle
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
// Ícones do app: desenhos em dois tons (traço + preenchimento translúcido nas partes com class="d"),
// todos numa grade de 24×24. I('nome', tamanho) devolve o <svg>; a cor vem do texto ao redor (currentColor).
const ICONS = {
  home:'<path class="d" d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-5h4v5"/>',
  food:'<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path class="d" d="M17 3c-2 1-3 3.5-3 7h3z"/><path d="M17 3v18"/>',
  car:'<path class="d" d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11v6H5z"/><path d="M5 17v2M19 17v2M3 11h18M8 14h.01M16 14h.01"/>',
  health:'<path class="d" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 12h2l1.5-2.5L13 14l1-2h2"/>',
  star:'<path class="d" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.5 19.7l1.2-6.1L3.2 9.4l6.1-.8z"/>',
  book:'<path class="d" d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h13v-4M9 8h6"/>',
  bag:'<path class="d" d="M5 8h14l-1 12H6z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  bolt:'<path class="d" d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
  coins:'<circle class="d" cx="9" cy="9" r="5.5"/><circle cx="15.5" cy="15.5" r="5.5"/><path d="M9 7v4M7.5 9h3"/>',
  box:'<path class="d" d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  briefcase:'<rect class="d" x="3" y="7" width="18" height="12" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18"/>',
  laptop:'<rect class="d" x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>',
  trend:'<path class="d" stroke="none" d="M3 17l6-6 4 4 8-8v13H3z"/><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  tag:'<path class="d" d="M3 12V4h8l10 10-8 8z"/><path d="M7.5 8.5h.01"/>',
  wallet:'<rect class="d" x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h13M16.5 13.5h4.5"/>',
  bank:'<path class="d" d="M3 9l9-5 9 5z"/><path d="M5 9v8M9.7 9v8M14.3 9v8M19 9v8M3 20h18"/>',
  shield:'<path class="d" d="M12 3l8 3v6c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  stack:'<ellipse class="d" cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  chart:'<rect class="d" x="4" y="12" width="4" height="8" rx="1"/><rect class="d" x="10" y="8" width="4" height="12" rx="1"/><rect class="d" x="16" y="4" width="4" height="16" rx="1"/>',
  building:'<rect class="d" x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
  exchange:'<circle class="d" cx="12" cy="12" r="9"/><path d="M8 10h8l-2.5-2.5M16 14H8l2.5 2.5"/>',
  coin:'<circle class="d" cx="12" cy="12" r="9"/><path d="M10 8h3a2 2 0 0 1 0 4h-3zM10 12h3.5a2 2 0 0 1 0 4H10zM10 8v8M11.5 6.5V8M11.5 16v1.5"/>',
  umbrella:'<path class="d" d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>',
  diamond:'<path class="d" d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-1 5 4 11 4-11-1-5"/>',
  card:'<rect class="d" x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  cash:'<rect class="d" x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/>',
  doc:'<path class="d" d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  news:'<rect class="d" x="4" y="4" width="13" height="16" rx="2"/><path d="M17 9h3v9a2 2 0 0 1-2 2H7M8 8h5M8 12h5M8 16h3"/>',
  receipt:'<path class="d" d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  income:'<circle class="d" cx="12" cy="12" r="9"/><path d="M14.6 9.3c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.9 5.3 1.5 5.3 4.4 0 1.2-1.1 2-2.7 2-1.3 0-2.3-.6-2.7-1.6M12 6v1.8M12 16.2V18"/>',
  gear:'<path class="d" d="M12 2.5l2 2.6 3.2-.5.9 3.1 3 1.3-1.3 3 1.3 3-3 1.3-.9 3.1-3.2-.5-2 2.6-2-2.6-3.2.5-.9-3.1-3-1.3 1.3-3-1.3-3 3-1.3.9-3.1 3.2.5z"/><circle cx="12" cy="12" r="3"/>',
  search:'<circle class="d" cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  clock:'<circle class="d" cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar:'<rect class="d" x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  alert:'<path class="d" d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  target:'<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01"/>',
  lock:'<rect class="d" x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2"/>',
  cloud:'<path class="d" d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5 3.75 3.75 0 0 1 17.5 18z"/>',
  refresh:'<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18.5 3.5v4h-4M5.5 20.5v-4h4"/>',
  download:'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>',
  upload:'<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19h14"/>',
  history:'<circle class="d" cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  checked:'<circle class="d" cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  unchecked:'<circle cx="12" cy="12" r="9"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  gift:'<rect class="d" x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z"/>',
  signal:'<path d="M4 19h.01M8.5 19v-4M13 19v-8M17.5 19V7" /><path class="d" d="M3 5l18 16"/>',
  chat:'<path class="d" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4a2 2 0 0 1-2-2z"/><path d="M8.5 9h7M8.5 12.5h4.5"/>',
  send:'<path class="d" d="M4 4l17 8-17 8 3-8z"/><path d="M7 12h7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  mic:'<rect class="d" x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
  eye:'<path class="d" d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path class="d" d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><path d="M4 4l16 16"/>',
  trash:'<path class="d" d="M6 7h12l-1 13H7z"/><path d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6"/>',
  paw:'<path class="d" d="M12 12c-3 0-5 2.5-5 5 0 1.7 1.3 2.5 2.7 2.5 1 0 1.4-.5 2.3-.5s1.3.5 2.3.5c1.4 0 2.7-.8 2.7-2.5 0-2.5-2-5-5-5z"/><circle cx="6" cy="10.5" r="1.5"/><circle cx="9.5" cy="6.5" r="1.5"/><circle cx="14.5" cy="6.5" r="1.5"/><circle cx="18" cy="10.5" r="1.5"/>',
  plane:'<path class="d" d="M21 4L3 11l6 2.5L11.5 20z"/><path d="M9 13.5L21 4"/>',
  bus:'<rect class="d" x="5" y="4" width="14" height="14" rx="2.5"/><path d="M5 12h14M8 18v2M16 18v2M8.5 15h.01M15.5 15h.01"/>',
  bike:'<circle class="d" cx="6" cy="16" r="3.5"/><circle class="d" cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l3 7M9 6h3"/>',
  truck:'<path class="d" d="M2 6h11v10H2z"/><path d="M13 9h4.5L21 12.5V16h-8"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  fuel:'<rect class="d" x="5" y="4" width="9" height="16" rx="1.5"/><path d="M5 10h9M14 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-2.5-2.5M3.5 20h12"/>',
  coffee:'<path class="d" d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  pizza:'<path class="d" d="M12 21L4 6c5-3 11-3 16 0z"/><path d="M9.5 9h.01M14 11h.01M11.5 14h.01"/>',
  cup:'<path class="d" d="M6 8h12l-1.500 12h-9z"/><path d="M5 8h14M13 8l2-5"/>',
  cake:'<path class="d" d="M4 13h16v7H4z"/><path d="M6 13v-2.500h12V13M12 10.500V7M12 4.500v.01M4 16.500c2 1.500 3 1.500 5 0s3-1.500 5 0 3 1.500 6 0"/>',
  cart:'<path class="d" d="M6 7h14l-2 8H8z"/><path d="M3 4h2l3 11M9.500 19h.01M16.500 19h.01"/>',
  shirt:'<path class="d" d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  scissors:'<circle class="d" cx="6.500" cy="7" r="2.500"/><circle class="d" cx="6.500" cy="17" r="2.500"/><path d="M8.500 8.500L20 18M8.500 15.500L20 6"/>',
  game:'<rect class="d" x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4M15.500 12h.01M17.500 14.500h.01"/>',
  music:'<circle class="d" cx="7" cy="18" r="3"/><circle class="d" cx="17" cy="16" r="3"/><path d="M10 18V6l10-2v12"/>',
  film:'<rect class="d" x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.500v5l4.500-2.500z"/>',
  ticket:'<path class="d" d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"/><path d="M14 7v2M14 11.500v1M14 15v2"/>',
  ball:'<circle class="d" cx="12" cy="12" r="9"/><path d="M12 8l3.500 2.500-1.300 4H9.800l-1.300-4zM12 3v5M20.500 9.500l-5 1M17.500 19l-3.300-4.500M6.500 19l3.300-4.500M3.500 9.500l5 1"/>',
  dumbbell:'<rect class="d" x="3" y="8" width="4" height="8" rx="1.200"/><rect class="d" x="17" y="8" width="4" height="8" rx="1.200"/><path d="M7 12h10"/>',
  phone:'<rect class="d" x="7" y="3" width="10" height="18" rx="2.500"/><path d="M11 17.500h2"/>',
  wifi:'<path d="M3 9.500a13 13 0 0 1 18 0M6 13a8.500 8.500 0 0 1 12 0M9 16.500a4.200 4.200 0 0 1 6 0"/><circle class="d" cx="12" cy="19.500" r="1"/>',
  tv:'<rect class="d" x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  camera:'<path class="d" d="M4 8h3.500L9 5.500h6L16.500 8H20v11H4z"/><circle cx="12" cy="13" r="3.200"/>',
  pill:'<rect class="d" x="3" y="8.500" width="18" height="7" rx="3.500" transform="rotate(-45 12 12)"/><path d="M9.500 9.500l5 5"/>',
  cross:'<rect class="d" x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  heart:'<path class="d" d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
  person:'<circle class="d" cx="12" cy="7" r="3.500"/><path class="d" d="M5 21v-2a7 7 0 0 1 14 0v2z"/>',
  bell:'<path class="d" d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  user:'<circle class="d" cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  people:'<circle class="d" cx="8.500" cy="8" r="3"/><circle class="d" cx="16.500" cy="9.500" r="2.500"/><path d="M3 20v-2a5.500 5.500 0 0 1 11 0v2M16 14.500a4.500 4.500 0 0 1 5 4.500v1"/>',
  grad:'<path class="d" d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c1.500 1.500 3.500 2.500 6 2.500s4.500-1 6-2.500v-4.500M22 9v6"/>',
  wrench:'<path class="d" d="M14.500 3.500a5 5 0 0 0-4.600 6.900L3.500 16.800a2.600 2.600 0 0 0 3.700 3.700l6.400-6.400a5 5 0 0 0 6.500-6.400l-3 3-2.800-.800-.800-2.800 3-3a5 5 0 0 0-2-.600z"/>',
  brush:'<path class="d" d="M4 20c3 0 5-1.500 5-4a2.500 2.500 0 0 0-5 0c0 1.500-.500 2.500-1.500 3 .300.600.800 1 1.500 1z"/><path d="M9.500 13.500L19 4a1.400 1.400 0 0 1 2 2l-9.500 9.500"/>',
  bed:'<path class="d" d="M3 12h18v5H3z"/><path d="M3 6v13M21 19v-7M3 12V9h6a2 2 0 0 1 2 2v1"/>',
  key:'<circle class="d" cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.500 2.500M14 9l2 2"/>',
  leaf:'<path class="d" d="M5 19C4 10 9 4 20 4c0 11-6 16-15 15z"/><path d="M5 19c3-5 6-8 10-10"/>',
  sun:'<circle class="d" cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600L7 7M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400"/>',
  drop:'<path class="d" d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  flame:'<path class="d" d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .500 1.500 1 2 2 2 0-3-.500-5 1-8z"/>',
  globe:'<circle class="d" cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  pin:'<path class="d" d="M12 21s-6.500-6-6.500-11a6.500 6.500 0 0 1 13 0c0 5-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
  trophy:'<path class="d" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.500A3.500 3.500 0 0 0 7.500 11M17 6h3v1.500a3.500 3.500 0 0 1-3.500 3.500M12 14v4M8.500 20h7"/>',
  piggy:'<path class="d" d="M4 12a7 6 0 0 1 12.500-3.500L19 7.500v3l2 1v3l-2.500.800L17 18v2h-3v-1.500h-3V20H8v-2.300A6 6 0 0 1 4 12z"/><path d="M15.500 11.500h.01M9 8.500h3"/>',
  percent:'<circle class="d" cx="7.500" cy="7.500" r="2.500"/><circle class="d" cx="16.500" cy="16.500" r="2.500"/><path d="M19 5L5 19"/>',
  smile:'<circle class="d" cx="12" cy="12" r="9"/><path d="M8.500 14a4.500 4.500 0 0 0 7 0M9 9.500h.01M15 9.500h.01"/>',
  sparkle:'<path class="d" d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/><path d="M19 15v4M17 17h4M5 4v3M3.500 5.500h3"/>',
  sliders:'<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle class="d" cx="16" cy="7" r="2.5"/><circle class="d" cx="8" cy="17" r="2.5"/>'
};
const I = (name, size = 18) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
// Categorias: [ícone, nome, cor]
const CAT_GASTO = {
  moradia:['home','Moradia','#6366f1'], alimentacao:['food','Alimentação','#f59e0b'], transporte:['car','Transporte','#0ea5e9'],
  saude:['health','Saúde','#ef4444'], lazer:['star','Lazer','#ec4899'], educacao:['book','Educação','#8b5cf6'],
  compras:['bag','Compras','#14b8a6'], contas:['bolt','Contas e assinaturas','#eab308'],
  mercado:['cart','Mercado','#16a34a'], restaurante:['pizza','Restaurantes e delivery','#f97316'], cafe:['coffee','Café e lanches','#a16207'],
  combustivel:['fuel','Combustível','#dc2626'], estacionamento:['pin','Estacionamento e pedágio','#0284c7'], conducao:['bus','Ônibus, metrô e apps','#0891b2'], oficina:['wrench','Manutenção do carro','#475569'],
  farmacia:['cross','Farmácia','#e11d48'], academia:['dumbbell','Academia e esportes','#7c3aed'], beleza:['scissors','Beleza e cuidados','#db2777'],
  roupas:['shirt','Roupas e calçados','#9333ea'], eletronicos:['phone','Eletrônicos','#2563eb'], presentes:['gift','Presentes','#e879f9'],
  pets:['paw','Pets','#b45309'], filhos:['people','Filhos e família','#0d9488'],
  cinema:['film','Cinema e streaming','#be123c'], shows:['ticket','Shows e eventos','#c026d3'], bares:['cup','Bares e festas','#ea580c'], jogos:['game','Jogos','#4f46e5'], viagem:['plane','Viagens','#0ea5e9'],
  casa:['brush','Casa e manutenção','#65a30d'], luz:['drop','Água, luz e gás','#06b6d4'], internet:['wifi','Internet e celular','#3b82f6'],
  seguros:['shield','Seguros','#64748b'], impostos:['doc','Impostos e taxas','#78716c'], doacoes:['heart','Doações','#f43f5e'],
  emprestimo:['coins','Empréstimo','#b45309'], // só oferecida na aba Parcelas
  outros:['box','Outros','#64748b']
};
const CAT_GANHO = {
  salario:['briefcase','Salário','#059669'], freelance:['laptop','Freelance / extra','#0ea5e9'], rendimentos:['trend','Rendimentos','#8b5cf6'],
  va:['bag','Vale-alimentação','#16a34a'], vr:['food','Vale-refeição','#ea580c'], vt:['bus','Vale-transporte','#0ea5e9'], vt:['bus','Vale-transporte','#0ea5e9'], vt:['bus','Vale-transporte','#0ea5e9'],
  vendas:['tag','Vendas','#f59e0b'], outros:['wallet','Outros','#64748b']
};
const CAT_INV = {
  rendafixa:['bank','Renda fixa (CDB, LCI, LCA)','#4f46e5'], tesouro:['shield','Tesouro Direto','#0ea5e9'], poupanca:['stack','Poupança','#ec4899'],
  acoes:['chart','Ações','#059669'], fiis:['building','Fundos imobiliários','#f59e0b'], moeda:['exchange','Moedas (dólar, euro…)','#0d9488'], cripto:['coin','Cripto','#eab308'],
  previdencia:['umbrella','Previdência','#8b5cf6'], outros:['diamond','Outros','#64748b']
};
// Tipos de parcelamento além da compra parcelada (campo tipo em db.installments; ver Financiamentos mais abaixo).
const PARC_TIPOS = {financiamento:'Financiamento', emprestimo:'Empréstimo'};
const PAY = {credito:'Crédito', debito:'Débito', pix:'Pix', dinheiro:'Dinheiro', boleto:'Boleto', va:'Vale-alimentação', vr:'Vale-refeição', vt:'Vale-transporte', outro:'Outro'};
const BANKS = ['Nubank','Itaú','Bradesco','Banco do Brasil','Caixa','Santander','Inter','C6 Bank','PicPay','Mercado Pago',
  'Alelo','Pluxee (Sodexo)','Ticket','VR','Flash','Caju','iFood Benefícios','Swile','Ben Visa Vale']; // os últimos são cartões de vale-alimentação/refeição
// Sugestões do campo "Banco / conta": os que você já usou primeiro, depois os mais comuns.
// Corretora dos investimentos (texto livre, até 40 letras): as já usadas viram sugestões, e um nome que só muda nas
// maiúsculas ("Xp" com "XP" já cadastrada) fica com a grafia que já existe, para não duplicar.
const brokerSuggestions = () => [...new Map(db.investments.map(v => String(v.broker || '').trim()).filter(Boolean).map(b => [b.toLowerCase(), b])).values()];
const normBroker = s => { const t = String(s ?? '').trim().slice(0, 40); return brokerSuggestions().find(b => b.toLowerCase() === t.toLowerCase()) || t; };
const bankSuggestions = () => [...new Set([...db.accounts.map(a => a.name), ...[...db.expenses, ...db.installments].map(x => x.bank).filter(Boolean), ...BANKS])];
// Trecho " · Nubank · Crédito" mostrado nas listas.
const whereLabel = x => [x.bank && esc(x.bank), PAY[x.pay]].filter(Boolean).map(s => ' · ' + s).join('');
const WHERE_FIELDS = () => [
  {k:'bank', label:'Banco / conta (opcional)', type:'text', ph:'Ex.: Nubank', optional:true, sug:bankSuggestions},
  {k:'pay', label:'Forma de pagamento', type:'select', optional:true, options:[['','Não informar'], ...Object.entries(PAY)]}];
const INDEX = {cdi:'CDI', selic:'Selic', ipca:'IPCA +', pre:'Prefixado'};

// Listas de lançamentos. Cada registro tem id e u (momento da última alteração); a sincronização
// junta os aparelhos registro por registro usando u, e db.tomb guarda o que foi excluído (id → momento).
const COLS = ['incomes', 'expenses', 'installments', 'investments', 'goals', 'accounts', 'transfers'];
// Completa campos que versões antigas do app (ou um backup antigo) não tinham.
// Categoria personalizada com valores seguros (usada pelo fixDb e pelo formulário catEdit). Só corrige o que veio:
// sem ícone ou cor, a categoria de fábrica continua com os dela.
function catLimpa(c){
  if (c.icon != null && !Object.hasOwn(ICONS, c.icon)) c.icon = 'tag';
  if (c.color && !/^#[0-9a-f]{6}$/i.test(c.color)) c.color = '#64748b';
  if (c.name != null) c.name = String(c.name).slice(0, 40);
  return c;
}
function fixDb(d){
  for (const c of COLS) if (!Array.isArray(d[c])) d[c] = [];
  for (const k of ['tomb', 'budgets', 'cardClose', 'cardDue', 'cardAcc', 'cardLimit', 'yieldLog', 'netLog', 'catMemo', 'cats', 'membros']) if (!d[k] || typeof d[k] !== 'object') d[k] = {};
  for (const t of ['gasto', 'ganho']) if (!d.cats[t] || typeof d.cats[t] !== 'object') d.cats[t] = {};
  // Os dados chegam também da planilha da conta compartilhada e de backups importados, que qualquer um pode editar.
  // Ids e chaves de categoria entram em data-onclick="...('id')" nas telas: ficam só com letras, números, _ e -.
  // Categorias: ícone conhecido, cor #rrggbb e nome de até 40 letras (sem tirar caracteres: "Bares & Restaurantes").
  const limpaId = v => typeof v === 'string' && /[^\w-]/.test(v) ? v.replace(/[^\w-]/g, '') : v;
  for (const c of COLS) d[c] = d[c].filter(r => r && typeof r === 'object');
  for (const c of COLS) for (const r of d[c]){ r.id = limpaId(r.id); if (r.pid) r.pid = limpaId(r.pid); if (r.cat) r.cat = limpaId(r.cat); }
  for (const t of ['gasto', 'ganho']){
    const cs = d.cats[t];
    for (const k of Object.keys(cs)){
      const c = cs[k] && typeof cs[k] === 'object' ? catLimpa(cs[k]) : {}, nk = limpaId(k);
      if (nk !== k) delete cs[k];
      if (nk) cs[nk] = c;
    }
  }
  if (typeof d.archUntil !== 'string') d.archUntil = '';
  // Lixeira: o que foi excluído fica 30 dias, só neste aparelho. [{col, rec, at}]
  d.trash = (Array.isArray(d.trash) ? d.trash : []).filter(t => t.at > Date.now() - 30*864e5);
  d.rates = Object.assign({cdi:14.9, selic:15, ipca:4.5, auto:'1'}, d.rates);
  for (const v of d.investments) if (v.ticker && !v.lots) v.lots = [{qty:v.qty, paid:v.paid, date:v.date || ''}];
  for (const v of d.investments) if (v.broker != null) v.broker = String(v.broker).slice(0, 40); // corretora: texto, até 40 letras
  // Parcelas: tipo (financiamento ou empréstimo; sem ele, compra parcelada), credor e conta de débito (texto), dia do
  // vencimento (1 a 31), taxa de juros ao mês (até 20%), seg = valor das parcelas a partir de cada uma (depois de um
  // abatimento) e ab = abatimentos [{d:'AAAA-MM-DD', v, modo}]. Vêm também da conta compartilhada e de backups.
  for (const p of d.installments){
    if (!PARC_TIPOS[p.tipo]) delete p.tipo;
    for (const k of ['credor', 'conta']) if (p[k] != null) p[k] = String(p[k]).slice(0, 60);
    const due = Number(p.due);
    if (Number.isInteger(due) && due >= 1 && due <= 31) p.due = due; else delete p.due;
    const taxa = Number(p.taxa);
    if (taxa > 0 && taxa <= 20) p.taxa = taxa; else delete p.taxa;
    const seg = (Array.isArray(p.seg) ? p.seg : []).filter(s => s && Number.isInteger(s.de) && s.de >= 0 && Number(s.v) > 0).map(s => ({de:s.de, v:Number(s.v)})).sort((a, b) => a.de - b.de);
    if (seg.length && seg[0].de === 0) p.seg = seg; else delete p.seg;
    const ab = (Array.isArray(p.ab) ? p.ab : []).filter(a => a && /^\d{4}-\d{2}-\d{2}$/.test(a.d) && Number(a.v) > 0).map(a => ({d:a.d, v:Number(a.v), modo:a.modo === 'parcela' ? 'parcela' : 'prazo'}));
    if (ab.length) p.ab = ab; else delete p.ab;
  }
  return d;
}
// Onde os dados ficam:
// - no APK, num arquivo do próprio app (Android.dadosSalvar/dadosLer), sem o limite de tamanho do armazenamento da página.
//   Na primeira gravação o app lê o arquivo de volta para conferir; estando igual, o armazenamento antigo (localStorage)
//   deixa de ser usado neste aparelho (FILE_OK). Se um dia o arquivo falhar, a gravação cai de volta no armazenamento antigo;
// - no navegador (prévia do PC), no localStorage, com uma cópia no IndexedDB que cobre o caso de ele encher.
// Ao abrir, vale a cópia alterada por último.
const FILE_OK = 'financas-arquivo-ok';
const fileStore = () => (!window.TESTE || window.TESTE_ARQ) && window.Android && Android.dadosSalvar && Android.dadosLer ? Android : null;
let fileChecked = false;
try { fileChecked = localStorage.getItem(FILE_OK) === '1'; } catch(e){}
function readDb(){
  let a = null, arq = null;
  try { a = JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){}
  const st = fileStore();
  if (st) try { arq = JSON.parse(st.dadosLer() || 'null'); } catch(e){}
  if (arq && !Array.isArray(arq.expenses)) arq = null;
  return arq && (!a || (arq.mod || 0) >= (a.mod || 0)) ? arq : a || {};
}
// Grava o texto dos dados; devolve true se ficou guardado em algum lugar.
function writeDb(json){
  if (demoOn) return true; // demonstração: nada vai para o arquivo do app nem para o IndexedDB
  const st = fileStore();
  if (st && st.dadosSalvar(json)){
    if (fileChecked) return true;
    if (st.dadosLer() === json){ // conferido: o arquivo passa a ser o lugar dos dados
      fileChecked = true;
      try { localStorage.setItem(FILE_OK, '1'); localStorage.removeItem(KEY); } catch(e){}
      return true;
    }
  }
  try { localStorage.setItem(KEY, json); if (!st) idbPut(json); return true; } catch(e){ if (!saveFailed) logErr('gravar dados', e); }
  if (!st) idbPut(json, true); // navegador com o armazenamento cheio: tenta o IndexedDB, que tira o aviso se der certo
  return false;
}
// IndexedDB (só no navegador): uma cópia dos dados que não tem o limite de 5 MB.
let idb = null;
function idbOpen(){
  if (!idb) idb = new Promise((res, rej) => { try {
    setTimeout(() => rej(new Error('IndexedDB não respondeu')), 3000); // alguns navegadores deixam o pedido parado
    const r = indexedDB.open('financas', 1);
    r.onblocked = () => rej(new Error('IndexedDB bloqueado'));
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  } catch(e){ rej(e); } });
  return idb;
}
// Toda operação no IndexedDB tem limite de tempo: em alguns navegadores o pedido fica parado sem responder.
const idbTimed = p => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('IndexedDB não respondeu')), 3000))]);
const idbWrite = json => idbTimed(idbOpen().then(d => new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(json, KEY); t.oncomplete = () => res(true); t.onerror = () => rej(t.error); })));
const idbRead = () => idbTimed(idbOpen().then(d => new Promise((res, rej) => { const r = d.transaction('kv').objectStore('kv').get(KEY); r.onsuccess = () => res(r.result || ''); r.onerror = () => rej(r.error); })));
function idbPut(json, salva){
  later('idb', () => idbWrite(json).then(() => { if (salva && saveFailed){ saveFailed = false; saveWarn(); } }).catch(() => {}));
}
// Ao abrir no navegador: se a cópia do IndexedDB for mais nova que a do localStorage (ele estava cheio), vale ela.
function restoreFromIdb(){
  if (fileStore() || window.TESTE) return Promise.resolve(false);
  return idbRead().then(json => {
    const d = json ? JSON.parse(json) : null;
    if (!d || !Array.isArray(d.expenses) || (d.mod || 0) <= (db.mod || 0)) return false;
    loadDb(d); rollover(); render();
    return true;
  }).catch(() => false);
}
let db = {};
// Resultados de expensesOf/incomesOf por mês, guardados até a próxima alteração (o Resumo pede cada mês dezenas de vezes).
let memo = {};
const dirty = () => { memo = {}; };
const cached = (k, fn) => k in memo ? memo[k] : (memo[k] = fn());
// Trabalho que pode esperar um instante (lembretes, widget, arquivo): várias gravações seguidas viram uma só.
const laterT = {}, laterF = {};
function later(k, fn, ms = 400){
  if (window.TESTE) return fn();
  clearTimeout(laterT[k]); laterF[k] = fn;
  laterT[k] = setTimeout(() => { delete laterF[k]; fn(); }, ms);
}
function flushLater(){ for (const k of Object.keys(laterF)){ clearTimeout(laterT[k]); const fn = laterF[k]; delete laterF[k]; fn(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) flushLater(); }); // saindo do app: grava o que estava esperando
db = readDb();
// Havia dados guardados neste aparelho antes desta abertura: é atualização, não instalação nova (ver lembMigrar).
const dadosNoAparelho = Object.keys(db).length > 0;
fixDb(db);
// Categorias personalizadas: db.cats = {gasto:{chave:{name, icon, hidden}}, ganho:{...}} renomeia ou esconde as
// categorias de fábrica e acrescenta novas. applyCats() refaz CAT_GASTO/CAT_GANHO a partir das de fábrica + db.cats;
// o 4º item de cada categoria (c[3]) indica que ela está escondida (some das listas de escolha, mas não dos lançamentos).
const BASE_CATS = {gasto:JSON.parse(JSON.stringify(CAT_GASTO)), ganho:JSON.parse(JSON.stringify(CAT_GANHO))};
const plainName = s => String(s).trim().toLowerCase();
function applyCats(){
  for (const [type, target] of [['gasto', CAT_GASTO], ['ganho', CAT_GANHO]]){
    for (const k in target) delete target[k];
    Object.assign(target, JSON.parse(JSON.stringify(BASE_CATS[type])));
    for (const [k, c] of Object.entries(db.cats[type])){
      const base = target[k] || ['tag', c.name, '#64748b'];
      target[k] = [c.icon || base[0], c.name || base[1], c.color || base[2], !!c.hidden];
    }
    // Categoria criada pelo usuário com o mesmo nome de uma de fábrica (ex.: "Pets"): fica só a do usuário.
    const proprias = Object.keys(db.cats[type]).filter(k => !BASE_CATS[type][k]).map(k => plainName(target[k][1]));
    for (const k of Object.keys(BASE_CATS[type])) if (!db.cats[type][k] && proprias.includes(plainName(target[k][1]))) delete target[k];
  }
}
applyCats();
// touch = false para gravações que não são alteração do usuário (abrir o app, atualizar taxas e cotações).
const save = (touch = true) => {
  if (demoOn){ dirty(); return; } // demonstração: só na memória
  dirty();
  resumoAutoLiga();
  db.yieldLog[curYM] = yieldOf(curYM);                    // histórico do rendimento estimado, mês a mês
  db.netLog[curYM] = sum(db.investments, v => v.value);   // histórico do total investido, mês a mês
  if (touch){ db.mod = Date.now(); scheduleSync(); autoFile(); }
  db.ver = DB_VER;
  const ok = writeDb(JSON.stringify(db));
  if (saveFailed !== !ok){ saveFailed = !ok; saveWarn(); }
  later('avisos', () => shown(() => { scheduleReminders(); updateWidget(); updateAlerts(); }));
};
// Resumo ainda no padrão enxuto: o primeiro vale liga o bloco Vales e o primeiro parcelamento liga o bloco Parcelas,
// uma vez cada, enquanto a pessoa não tiver mexido nesses blocos em Personalizar.
function resumoAutoLiga(){
  const p = db.prefs;
  if (!Array.isArray(p.resumoAuto) || !p.resumoAuto.length) return;
  for (const [k, tem] of [['vales', temVales], ['parcelas', () => db.installments.length > 0]]){
    if (!p.resumoAuto.includes(k) || !tem()) continue;
    const b = p.resumo.find(x => x.k === k);
    if (b) b.on = true;
    p.resumoAuto = p.resumoAuto.filter(x => x !== k);
  }
}
// A gravação pode falhar (armazenamento cheio). O aviso fica na tela até uma gravação dar certo.
let saveFailed = false;
function saveWarn(){
  const el = document.getElementById('saveWarn');
  if (el) el.hidden = !saveFailed;
}
const newerDb = d => (d && d.ver || 1) > DB_VER;
// Marca o registro como alterado agora. Registro novo (ainda sem u) guarda quem o criou (by), para a conta compartilhada.
const myName = () => (db.prefs && db.prefs.name) || '';
// Conta compartilhada: by = quem lançou; ed = quem alterou por último (usado nos avisos "fulano editou…").
const touch = r => { if (!r.u && !r.by && myName()) r.by = myName(); else if (r.u && typeof shared === 'function' && shared() && myName()) r.ed = myName(); r.u = Date.now(); return r; };
// Cópia de segurança automática em arquivo, uma vez por semana, na pasta do app no celular (só no APK).
function autoFile(){
  if (!(window.Android && Android.backupArquivo) || Date.now() - (sync.fileAt || 0) < 7*864e5) return;
  const dir = Android.backupArquivo(JSON.stringify(db));
  if (dir){ sync.fileAt = Date.now(); sync.fileDir = dir; saveSync(); }
}
// Troca todos os dados pelos de um backup ou pelos que vieram da conta Google.
function loadDb(d){
  db = fixDb(Object.assign({}, d, {rates:d.rates || db.rates}));
  dirty();
  applyCats(); ensurePrefs(); applyTheme();
}

// ---------- Aparência: tema e ordem das abas ----------
const TABS = {resumo:['chart','Resumo'], ganhos:['income','Ganhos'], gastos:['receipt','Gastos'], invest:['trend','Investir'], noticias:['news','Notícias'], chat:['chat','Assistente']};
// nome, par de cores para o modo claro (também usado nos cartões de destaque), par para o modo escuro,
// e matiz + saturação da cor: delas saem o fundo, os cartões, as linhas e os tons dos gráficos.
const COLORS = {
  indigo:['Índigo','#4f46e5','#7c3aed','#818cf8','#a78bfa', 245, 80], esmeralda:['Esmeralda','#047857','#0f766e','#34d399','#2dd4bf', 165, 75],
  oceano:['Oceano','#0369a1','#1d4ed8','#38bdf8','#60a5fa', 212, 85], rosa:['Rosa','#be185d','#a21caf','#f472b6','#e879f9', 322, 75],
  laranja:['Laranja','#c2410c','#b45309','#fb923c','#fbbf24', 26, 88], grafite:['Grafite','#475569','#1e293b','#cbd5e1','#94a3b8', 215, 14],
  vermelho:['Vermelho','#b91c1c','#be123c','#f87171','#fb7185', 0, 75], roxo:['Roxo','#7e22ce','#6d28d9','#c084fc','#a78bfa', 272, 75],
  turquesa:['Turquesa','#0f766e','#0e7490','#2dd4bf','#22d3ee', 182, 70], dourado:['Dourado','#854d0e','#a16207','#facc15','#fbbf24', 42, 85],
  limao:['Verde-limão','#3f6212','#4d7c0f','#a3e635','#bef264', 85, 70], cafe:['Café','#7c2d12','#78350f','#fdba74','#fcd34d', 20, 45]
};
// Temas especiais: trocam as cores do app inteiro (menos os ícones das categorias, que ficam com a cor própria de cada
// uma), o mascote do modo divertido (MASCOTES) e, se a pessoa quiser, o ícone do app.
// [nome, escuro?, destaque, destaque 2, cartão de destaque 1 e 2, fundo, cartões, linhas, texto secundário, texto, matiz, saturação]
const SKINS = {
  hacker:['Hacker', true, '#22c55e', '#4ade80', '#052e16', '#166534', '#020a04', '#07140b', '#14532d', '#86efac', '#d1fae5', 140, 70],
  boneca:['Boneca', false, '#be185d', '#db2777', '#db2777', '#c026d3', '#fff0f7', '#ffffff', '#fbcfe8', '#9d174d', '#500724', 328, 80],
  corrida:['Corrida', true, '#ef4444', '#f59e0b', '#991b1b', '#1f2937', '#0c0c0f', '#17171c', '#2a2a33', '#a1a1aa', '#fafafa', 0, 70],
  neon:['Neon', true, '#f472b6', '#22d3ee', '#7c3aed', '#db2777', '#0d0221', '#1a0b3b', '#3b1d7a', '#c4b5fd', '#f5f3ff', 290, 80],
  papel:['Papel antigo', false, '#7c2d12', '#92400e', '#78350f', '#92400e', '#f5efe0', '#fffaf0', '#e7dcc3', '#6b5a3e', '#2b2118', 35, 45],
  praia:['Praia', false, '#0e7490', '#0369a1', '#0e7490', '#155e75', '#fdf6e3', '#ffffff', '#f0e2bd', '#5b6b73', '#0c2a33', 190, 70],
  noite:['Noite estrelada', true, '#f4d35e', '#9cc0e7', '#1e3a8a', '#274690', '#0b1437', '#13205a', '#2b3f8f', '#b4c6f0', '#f4f7ff', 225, 75], // inspirado no quadro de Van Gogh
  bruxo:['Bruxo', true, '#eab308', '#fbbf24', '#7f1d1d', '#991b1b', '#1a0b0e', '#2a1216', '#4a1f26', '#d6b3a0', '#fdf4e3', 0, 60],
  espaco:['Espaço', true, '#a78bfa', '#38bdf8', '#312e81', '#4338ca', '#05060f', '#0e1024', '#1f2347', '#a5b4d4', '#eef2ff', 240, 60],
  floresta:['Floresta', false, '#166534', '#3f6212', '#166534', '#3f6212', '#eef5e6', '#fbfdf7', '#cfe3bf', '#4b5d3f', '#1a2e12', 110, 45],
  retro:['Retrô 8-bit', true, '#facc15', '#fb7185', '#7c3aed', '#be185d', '#12121c', '#1e1e2e', '#3a3a55', '#b8b8d0', '#f8f8f2', 250, 30],
  dragao:['Dragão', true, '#a3e635', '#4ade80', '#111827', '#064e3b', '#07090c', '#11151b', '#232a33', '#9ca3af', '#f3f4f6', 150, 20],
  grandprix:['Grand Prix', false, '#b91c1c', '#1d4ed8', '#b91c1c', '#1e3a8a', '#f4f6fb', '#ffffff', '#d9e0ee', '#475569', '#0f172a', 0, 70],
  rua:['Corrida de rua', true, '#fb923c', '#a3e635', '#7c2d12', '#1c1917', '#0c0a09', '#1c1917', '#33302c', '#a8a29e', '#fafaf9', 25, 70],
  drift:['Drift', true, '#fb7185', '#fde68a', '#b91c1c', '#1e293b', '#0b0f1a', '#151b2b', '#27304a', '#a8b3cf', '#f8fafc', 350, 70],
  fusca:['Fusca de corrida', false, '#1d4ed8', '#b91c1c', '#1e40af', '#b91c1c', '#f7f3e8', '#fffdf6', '#e5dcc5', '#5c5546', '#1f1b12', 45, 50],
  vikings:['Vikings', true, '#7dd3fc', '#fbbf24', '#1e3a5f', '#334155', '#0b1220', '#141d2e', '#26334d', '#9fb0c8', '#f1f5f9', 210, 45],
  espartano:['Espartano', true, '#f87171', '#e5e7eb', '#7f1d1d', '#374151', '#0f0f10', '#1a1a1c', '#2e2e33', '#a3a3a3', '#f5f5f5', 0, 30]
};
// Temas por categoria (js/temas.js): só trazem os destaques, o matiz e a saturação; o resto sai daí, como nas cores comuns.
const SKIN_ANTIGOS = Object.keys(SKINS); // os primeiros temas: têm ícone do app também com os desenhos de barras e porquinho
for (const [k, [nome, escuro, c1, c2, h1, h2, h, s]] of Object.entries(TEMAS_NOVOS))
  SKINS[k] = [nome, escuro, c1, c2, h1, h2, escuro ? hslHex(h, s * .5, 7) : hslHex(h, s * .6, 96), escuro ? hslHex(h, s * .42, 12) : '#ffffff',
    escuro ? hslHex(h, s * .38, 19) : hslHex(h, s * .5, 90), escuro ? hslHex(h, s * .22, 68) : hslHex(h, s * .2, 37), escuro ? hslHex(h, s * .3, 96) : hslHex(h, s * .5, 12), h, s];
// Cores do ícone do app: as do tema e as dos temas especiais (cada uma tem um ícone pronto no APK).
const ICONES = {...COLORS, ...Object.fromEntries(Object.entries(SKINS).map(([k, s]) => [k, [s[0], s[4], s[2]]]))};
const APP_NOMES = ['Cofrim', 'Finanças', 'Carteira', 'Meu Dinheiro']; // nomes que o app pode ter na tela inicial (lista fixa no APK)
function hslHex(h, s, l){
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}
let theme = {h:245, s:80, dark:false}; // preenchido por applyTheme
// Tom i de n da cor do tema, do mais forte ao mais suave (fatias e legendas dos gráficos).
const shade = (i, n) => hslHex(theme.h, theme.s * .9, theme.dark ? 76 - i * 44 / Math.max(n, 1) : 34 + i * 44 / Math.max(n, 1));
const MODES = {auto:'Automático', light:'Claro', dark:'Escuro'};
// Blocos disponíveis na aba Resumo: [nome, aparece por padrão]. O conteúdo de cada um está em viewResumo.
const RESUMO = {mascote:['Porquinho (modo divertido)', 1, 1], atalhos:['Atalhos para adicionar', 1, 1],
  destaque:['Gastos do mês e do ano', 1, 1], rosca:['Gastos por categoria no mês', 1, 1], dias:['Calendário de gastos do mês', 1, 1], alertas:['Contas a vencer e avisos de orçamento', 1], saldo:['Saldo do ano', 1], grafico:['Gráfico de ganhos e gastos', 1],
  numeros:['Média de gastos e total investido', 1], previsao:['Previsão dos próximos meses', 1], contas:['Contas bancárias', 1], planejar:['Planejamento (reserva, assinaturas, dívidas)', 1], categorias:['Gastos por categoria', 1], bancos:['Gastos por banco', 1],
  pagamentos:['Gastos por forma de pagamento', 1], mes:['Resumo do mês atual', 0], faturas:['Faturas do cartão do mês', 0], parcelas:['Compras parceladas', 0],
  metas:['Metas', 0], invest:['Investimentos', 0], vales:['Vale-refeição e alimentação', 1], conquistas:['Conquistas (modo divertido)', 1]};
const FUN_BLOCKS = ['mascote', 'conquistas']; // só existem com o modo divertido ligado
// Blocos das outras abas, no mesmo formato. A ordem e o que aparece ficam em db.prefs.layout[aba]
// (o Resumo usa db.prefs.resumo, que já existia). O conteúdo de cada bloco está na função view da aba.
const LAYOUT = {
  resumo:RESUMO,
  ganhos:{total:['Total de ganhos do mês', 1], fixos:['Fixos (todo mês)', 1], anuais:['Anuais (uma vez por ano)', 1], avulsos:['Ganhos avulsos', 1]},
  gastos:{mes:['Ganhos, gastos e saldo do mês', 1], orcamento:['Orçamento do mês', 1], comparativo:['Comparativo por categoria', 1], receber:['A receber de gastos divididos', 1],
    faturas:['Faturas do cartão', 1], lancamentos:['Lançamentos', 1], acoes:['Importar extrato, relatório e planilha', 1]},
  // Linhas do widget Resumo da tela inicial (não é uma aba: ver updateWidget e Configurações > Widgets).
  widget:{saldo:['Saldo do mês', 1], ganhos:['Ganhos do mês', 1], gastos:['Gastos do mês', 1], conta:['Próxima conta a vencer', 1], contas:['Saldo nas contas', 0], invest:['Total investido', 0],
    vales:['Saldo dos vales (refeição e alimentação)', 0], fatura:['Faturas do cartão do mês', 0], orcamento:['Orçamento usado', 0], parcelas:['Parcelas do mês', 0], previsao:['Previsão do mês que vem', 0]},
  invest:{total:['Total investido e projeção', 1], evolucao:['Evolução do total investido', 1], metas:['Metas', 1], carteira:['Meus investimentos', 1], taxas:['Taxas usadas na projeção', 1]}
};
// Grupos da lista de lançamentos da aba Gastos: [nome, quais lançamentos entram].
const GRUPOS = {
  sub:['Assinaturas', x => isSub(x)],
  fix:['Fixos e anuais', x => x.fixed && !isSub(x)],
  parc:['Parceladas', x => x.kind === 'installment'],
  avu:['Ocasionais', x => !x.fixed && x.kind !== 'installment']};
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
function ensurePrefs(){
  const p = db.prefs = Object.assign({mode:'auto', color:'indigo', tabs:[], remind:0, anim:true, notifyCats:{}, font:1, fun:false, rollBudget:false, catColor:false, skin:''}, db.prefs);
  if (!SKINS[p.skin]) p.skin = '';
  // Notificações: notify liga/desliga tudo; remind = dias de antecedência; notifyCats[categoria] === false silencia a categoria.
  // resumo = blocos da aba Resumo, na ordem escolhida, cada um ligado ou desligado.
  // Bloco que ainda não está na lista salva (criado numa versão mais nova) entra no fim, ou no começo se d[2].
  const fill = (list, defs) => {
    const r = (list || []).filter(b => defs[b.k]), novo = Object.entries(defs).filter(([k]) => !r.some(b => b.k === k)), item = ([k, d]) => ({k, on:!!d[1]});
    return novo.filter(([, d]) => d[2]).map(item).concat(r, novo.filter(([, d]) => !d[2]).map(item));
  };
  // Resumo de quem abre o app pela primeira vez (sem lista salva): só os blocos essenciais, nesta ordem; os outros ficam
  // em Personalizar, desligados (os do modo divertido seguem o modo divertido, como antes). resumoEnxuto mostra o link
  // "Ver mais informações no resumo" até a primeira personalização; resumoAuto = blocos que ainda ligam sozinhos com o
  // primeiro vale ou parcelamento (ver resumoAutoLiga). Quem já tem a lista salva não muda nada.
  if (!Array.isArray(p.resumo)){
    const ess = ['atalhos', 'destaque', 'alertas', 'rosca', 'contas'];
    p.resumo = ['mascote', ...ess, ...Object.keys(RESUMO).filter(k => k !== 'mascote' && !ess.includes(k))].map(k => ({k, on:ess.includes(k) || FUN_BLOCKS.includes(k)}));
    p.resumoEnxuto = true; p.resumoAuto = ['vales', 'parcelas'];
  }
  p.resumo = fill(p.resumo, RESUMO);
  // grpOrder = ordem dos grupos da lista de gastos (assinaturas, fixos, parceladas, ocasionais).
  p.grpOrder = [...(p.grpOrder || []).filter(k => GRUPOS[k]), ...Object.keys(GRUPOS).filter(k => !(p.grpOrder || []).includes(k))];
  p.layout = p.layout || {};
  for (const t of ['ganhos', 'gastos', 'invest', 'widget']) p.layout[t] = fill(p.layout[t], LAYOUT[t]);
  // tabsOff = abas escondidas do menu de baixo (o Resumo fica sempre: é por ele que se chega às configurações).
  p.tabsOff = (p.tabsOff || []).filter(t => TABS[t] && t !== 'resumo');
  // reminds = lista de antecedências escolhidas (ex.: [1, 3, 5] avisa três vezes, além do aviso no dia).
  if (p.notify === undefined) p.notify = p.remind > 0;
  if (!Array.isArray(p.reminds)) p.reminds = [p.remind || 3];
  p.tabs = p.tabs.filter(t => TABS[t]).concat(Object.keys(TABS).filter(t => !p.tabs.includes(t)));
}
// Na versão web não há aba Notícias: os sites de notícias não deixam o navegador ler os feeds (só o APK consegue).
// O assistente não fica no menu de baixo: abre pelo botão flutuante que aparece em todas as telas (ver render).
const visTabs = () => db.prefs.tabs.filter(t => t !== 'chat' && !db.prefs.tabsOff.includes(t) && !(t === 'noticias' && typeof WEB_APP !== 'undefined' && WEB_APP));
const layoutOf = tab => tab === 'resumo' ? db.prefs.resumo : db.prefs.layout[tab];
// Monta a tela: os blocos ligados da aba, na ordem escolhida. B = {chave: () => html}.
const blocks = (tab, B) => layoutOf(tab).filter(b => b.on && B[b.k]).map(b => B[b.k]()).join('');
function applyTheme(){
  const p = db.prefs, sk = SKINS[p.skin]; // tema especial: define tudo, inclusive claro ou escuro
  const dark = sk ? sk[1] : p.mode === 'dark' || (p.mode === 'auto' && darkQuery.matches), c = sk ? [sk[0], sk[2], sk[3], sk[2], sk[3], sk[11], sk[12]] : COLORS[p.color] || COLORS.indigo;
  const st = document.documentElement.style;
  document.documentElement.dataset.mode = dark ? 'dark' : 'light';
  document.documentElement.dataset.anim = p.anim ? 'on' : 'off';
  document.documentElement.dataset.fun = p.fun ? 'on' : 'off';
  document.documentElement.dataset.skin = sk ? p.skin : '';
  document.body.style.zoom = p.font; // tamanho do texto: amplia ou reduz a tela inteira por igual
  st.setProperty('--brand', c[dark ? 3 : 1]); st.setProperty('--brand2', c[dark ? 4 : 2]);
  st.setProperty('--hero1', sk ? sk[4] : c[1]); st.setProperty('--hero2', sk ? sk[5] : c[2]);
  // Fundo, cartões, linhas e texto secundário levam um toque da cor do tema.
  const h = c[5], s = c[6];
  theme = {h, s, dark};
  const bg = sk ? sk[6] : dark ? hslHex(h, s * .5, 7) : hslHex(h, s * .6, 96), card = sk ? sk[7] : dark ? hslHex(h, s * .42, 12) : '#ffffff';
  st.setProperty('--bg', bg); st.setProperty('--card', card);
  st.setProperty('--line', sk ? sk[8] : dark ? hslHex(h, s * .38, 19) : hslHex(h, s * .5, 90));
  st.setProperty('--muted', sk ? sk[9] : dark ? hslHex(h, s * .22, 68) : hslHex(h, s * .2, 37));
  if (sk) st.setProperty('--text', sk[10]); else st.removeProperty('--text');
  // Cores da tela de abertura da próxima vez (lidas pelo index.html antes de tudo).
  try { localStorage.setItem('financas-abre', JSON.stringify([sk ? sk[4] : c[1], sk ? sk[5] : c[2]])); } catch(e){}
  if (window.webIcone) webIcone(); // versão web: o ícone indicado pela página acompanha o tema
  if (window.cenaAplicar) cenaAplicar(); // fundo animado do tema especial (js/cena.js)
  // barras do sistema no APK
  if (window.Android && Android.cores) Android.cores(bg, card, dark);
  else if (window.Android && Android.tema) Android.tema(dark);
}
darkQuery.addEventListener('change', applyTheme);
ensurePrefs();
applyTheme();

// Data de hoje, lida do relógio do aparelho. É relida sempre que o app volta para a tela
// (ver "visibilitychange" no fim), para o mês atual virar sozinho mesmo com o app aberto.
let now = new Date();
let curYM = ymOf(now.getFullYear(), now.getMonth());
const todayLabel = () => now.toLocaleDateString(LOCALES[lang()], {weekday:'long', day:'numeric', month:'long', year:'numeric'});
const state = {tab:visTabs()[0], year:now.getFullYear(), month:curYM, sel:'', q:'', fcat:'', fbank:'', fpay:'', ftag:'', limit:60, gsub:'mes', isub:'todos', parcDet:''}; // gsub: parte da aba Gastos (do mês / parceladas / vales); isub: parte da aba Ganhos (todos / vales)

// ---------- Utilidades ----------
function ymOf(y, m0){ return y + '-' + String(m0+1).padStart(2,'0'); }
function addMonths(ym, n){ const [y,m] = ym.split('-').map(Number); const t = y*12 + (m-1) + n; return ymOf(Math.floor(t/12), t%12); }
function monthDiff(a, b){ const [ya,ma] = a.split('-').map(Number), [yb,mb] = b.split('-').map(Number); return (ya-yb)*12 + (ma-mb); }
function monthName(ym){ const [y,m] = ym.split('-').map(Number); return MESES[m-1] + ' ' + y; }
const daysIn = ym => { const [y,m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
// Esconder valores (botão do olho): todo valor em dinheiro vira "R$ ••••". Fica só neste aparelho.
const HIDE_KEY = 'financas-olho', MASK = 'R$ ••••';
let hideVals = false;
try { hideVals = localStorage.getItem(HIDE_KEY) === '1'; } catch(e){}
const fmt = v => hideVals ? MASK : (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
// Roda fn com os valores à mostra (lembretes, widget e relatório não podem sair mascarados).
function shown(fn){ const h = hideVals; hideVals = false; try { return fn(); } finally { hideVals = h; } }
function toggleHide(){ hideVals = !hideVals; try { localStorage.setItem(HIDE_KEY, hideVals ? '1' : ''); } catch(e){} render(); }
const eyeBtn = () => `<button class="iconbtn" data-onclick="toggleHide()" aria-label="${hideVals ? 'Mostrar valores' : 'Esconder valores'}">${I(hideVals ? 'eyeOff' : 'eye', 24)}</button>`;
// Etiquetas livres de um lançamento ("viagem SP, trabalho" -> ['viagem SP', 'trabalho']).
const tagsOf = x => String(x.tags || '').split(',').map(s => s.trim()).filter(Boolean);
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
function parseMoney(s){ s = String(s).trim().replace(/[R$\s]/g,''); if (s.includes(',')) s = s.replace(/\./g,'').replace(',','.'); return parseFloat(s); }
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const moneyStr = v => v == null || v === '' ? '' : Number(v).toFixed(2).replace('.',',');
const sum = (a, f) => a.reduce((t,x) => t + f(x), 0);
const round2 = v => Math.round(v*100)/100;
const sheetOpen = () => document.getElementById('sheet').classList.contains('open');

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
      .catch(() => {}).finally(() => { if (!sheetOpen()) render(); });
  }
  return false;
}
const archBanner = y => !db.archUntil || String(y) > db.archUntil ? '' : `<div class="offline">${I('box', 14)}${arch
  ? 'Período arquivado: estes lançamentos vêm do arquivo e não podem ser editados.'
  : canSync() && sync.on ? 'Período arquivado: carregando o arquivo da sua conta…' : 'Período arquivado: entre com a conta Google para ver os lançamentos.'}</div>`;
// Vale-alimentação e vale-refeição ficam separados do resto: não entram nos ganhos, nos gastos nem no saldo do mês.
// Crédito de vale = ganho com a categoria va ou vr; gasto no vale = gasto (ou parcela) com a forma de pagamento va ou vr.
// incomesOf/expensesOf devolvem o mês SEM os vales; incomesAll/expensesAll, com eles; valeIn/valeOut, só eles.
const VALES = {va:'Vale-alimentação', vr:'Vale-refeição', vt:'Vale-transporte'};
// Empresas de vale mais comuns no Brasil (campo "Empresa do vale"); a última usada em cada vale já vem escolhida.
const VALE_EMPRESAS = ['Alelo', 'Pluxee', 'Sodexo', 'Ticket', 'VR', 'iFood Benefícios', 'Ben', 'Flash', 'Caju', 'Swile', 'Up Brasil', 'Greencard', 'Outra'];
const valeEmp = k => ([...db.incomes.filter(x => x.cat === k && x.emp), ...db.expenses.filter(x => x.pay === k && x.emp)].sort((a, b) => (b.u || 0) - (a.u || 0))[0] || {}).emp || '';
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
  const ini = [...db.incomes.filter(x => x.cat === k), ...db.expenses.filter(x => x.pay === k), ...db.installments.filter(x => x.pay === k)].reduce((a, x) => x.start < a ? x.start : a, ym);
  let s = 0;
  for (let m = ini, i = 0; m <= ym && i < 240; m = addMonths(m, 1), i++) s += sum(valeIn(m, k), x => x.value) - sum(valeOut(m, k), x => x.value);
  return round2(s);
});
function expensesRaw(ym){
  // Gasto dividido: value passa a ser só a sua parte; full guarda o total que saiu da sua conta;
  // got diz se a parte da outra pessoa já foi recebida (nos gastos fixos, mês a mês, em x.sm).
  const list = [...db.expenses, ...archRecs('expenses', ym)].filter(x => activeIn(x, ym)).map(x => ({...x, kind:'expense', full:x.value, value:x.value - (x.share || 0), got:x.fixed ? (x.sm || []).includes(ym) : !!x.settled}));
  // Parcelas: cada uma no mês dela, paga ou não ("Pagar" só muda o status). Financiamento e empréstimo saem da conta de
  // débito. Os abatimentos entram como gasto no mês em que foram feitos.
  for (const p of [...db.installments, ...archRecs('installments', ym)]){
    const i = monthDiff(ym, p.start), onde = isFin(p) ? {bank:p.conta || '', pay:'debito'} : {bank:p.bank, pay:p.pay};
    if (i >= 0 && i < p.n) list.push({id:p.id, kind:'installment', desc:p.desc, cat:p.cat, ...onde, by:p.by, value:parcVal(p, i), num:i+1, n:p.n, paid:i < p.paid});
    for (const a of p.ab || []) if (a.d.slice(0, 7) === ym) list.push({id:p.id, kind:'installment', abat:true, desc:p.desc, cat:p.cat, ...onde, by:p.by, value:a.v, day:+a.d.slice(8)});
  }
  return list;
}
const totalIn = ym => sum(incomesOf(ym), x => x.value);
const totalOut = ym => sum(expensesOf(ym), x => x.value);
function annualRate(inv){
  const r = db.rates, p = inv.pct/100;
  if (inv.index === 'cdi') return r.cdi/100 * p;
  if (inv.index === 'selic') return r.selic/100 * p;
  if (inv.index === 'ipca') return (1 + r.ipca/100) * (1 + p) - 1;
  return p;
}
const monthlyRate = inv => Math.pow(1 + annualRate(inv), 1/12) - 1;
function projection(inv){
  const r = annualRate(inv), i = monthlyRate(inv), a = inv.monthly || 0;
  return inv.value * (1+r) + (i ? a * (Math.pow(1+i,12) - 1) / i : a*12);
}
// Rendimento estimado dos investimentos em um mês, com as taxas atuais e os aportes mensais.
// Meses passados usam o valor anotado em db.yieldLog (ver save); antes do primeiro uso do app, zero.
function yieldOf(ym){
  const k = monthDiff(ym, curYM);
  if (k < 0) return db.yieldLog[ym] || 0;
  return sum(db.investments.filter(inv => !inv.ticker), inv => { // ações e moedas não têm rendimento projetado
    const i = monthlyRate(inv), g = Math.pow(1+i, k), a = inv.monthly || 0;
    return (inv.value * g + (i ? a * (g - 1) / i : a*k)) * i;
  });
}

// Virada de mês: o que o app atualiza sozinho. Roda ao abrir, ao voltar para a tela e após sincronizar.
// - Parcelas: as parcelas dos meses que já passaram contam como pagas (o botão fica para correções).
// - Renda fixa: o valor recebe o rendimento do mês e o aporte mensal, mês a mês.
function rollover(){
  let changed = false;
  const hadLog = {...db.yieldLog};
  for (const p of db.installments){
    if (!p.autoYM){ p.autoYM = curYM; continue; } // registro novo ou de versão antiga: começa a contar daqui
    if (p.autoYM >= curYM) continue;
    const expected = Math.max(0, Math.min(p.n, monthDiff(curYM, p.start)));
    if (expected > p.paid) p.paid = expected;
    p.autoYM = curYM; touch(p); changed = true;
  }
  for (const v of db.investments){
    if (v.ticker) continue; // ações e moedas seguem a cotação
    if (!v.accYM){ v.accYM = curYM; continue; }
    if (v.accYM >= curYM) continue;
    const i = monthlyRate(v);
    for (let m = v.accYM; m < curYM; m = addMonths(m, 1)){
      if (!(m in hadLog)) db.yieldLog[m] = (db.yieldLog[m] || 0) + v.value * i; // mês em que o app não foi aberto
      v.value = v.value * (1 + i) + (v.monthly || 0);
    }
    v.value = round2(v.value);
    v.accYM = curYM; touch(v); changed = true;
  }
  if (changed) save();
  return changed;
}

// ---------- Ações e moedas: investimentos com cotação ----------
// Categorias cujo valor vem de cotação: 'b3' = ações/FIIs (brapi.dev), 'fx' = moedas e cripto (AwesomeAPI).
// Cada ativo é um registro só, com lots = lista de compras [{qty, paid, date}]. A partir delas saem
// qty (total), paid (preço médio) e value = qty × quote, então o resto do app o trata como qualquer investimento.
const QUOTE_SRC = {acoes:'b3', fiis:'b3', moeda:'fx', cripto:'fx'};
const BRAPI = 'https://brapi.dev/api', AWESOME = 'https://economia.awesomeapi.com.br';
const FX_POPULAR = ['USD','EUR','GBP','BTC','ETH','JPY','CAD','AUD','CHF','ARS','CNY','SOL'];
const fmtQ = v => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits: v < 10 ? 4 : 2});
const fmtDate = d => d ? d.split('-').reverse().join('/') : 'sem data';
const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const getJson = async url => { const r = await espera(fetch(url)); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
function recalc(v){
  v.qty = sum(v.lots, l => l.qty);
  v.paid = v.qty ? sum(v.lots, l => l.qty * l.paid) / v.qty : 0;
  v.value = v.qty * v.quote;
}

// Busca na lista completa da B3 por código ou nome; sem texto, traz as mais negociadas.
async function searchB3(q){
  const j = await getJson(`${BRAPI}/quote/list?limit=25&search=${encodeURIComponent(q.trim())}`);
  return j.stocks.map(s => ({code:s.stock, name:s.name, quote:s.close}));
}
let fxList = null; // {USD:'Dólar Americano', ...}, carregada uma vez
async function searchFx(q){
  if (!fxList){ fxList = await getJson(`${AWESOME}/json/available/uniq`); delete fxList.BRL; delete fxList.BRLT; }
  const t = plain(q.trim()), all = Object.entries(fxList);
  const hits = t ? all.filter(([c,n]) => plain(c).includes(t) || plain(n).includes(t)) : FX_POPULAR.filter(c => fxList[c]).map(c => [c, fxList[c]]);
  const rank = c => (FX_POPULAR.indexOf(c) + 1) || 99; // as mais usadas primeiro
  hits.sort((a,b) => rank(a[0]) - rank(b[0]));
  return hits.slice(0, 25).map(([code,name]) => ({code, name, quote:null})); // a cotação é buscada ao escolher
}
async function fxQuotes(codes){
  const j = await getJson(`${AWESOME}/json/last/${codes.map(c => c + '-BRL').join(',')}`);
  return Object.fromEntries(codes.map(c => [c, parseFloat((j[c + 'BRL'] || {}).bid)]));
}
// CDI acumulado (em %) de uma data até hoje, pela taxa atual do CDI. É uma aproximação: a taxa mudou ao longo do tempo.
function cdiSince(date){
  const dias = Math.max(0, (now - new Date(date + 'T00:00:00')) / 864e5);
  return (Math.pow(1 + db.rates.cdi / 100, dias / 365) - 1) * 100;
}
// Alerta de preço: avisa uma vez quando a cotação cruza o valor definido (alertUp / alertDown); alertHit evita repetir.
function checkPriceAlerts(){
  const hits = [];
  for (const v of db.investments){
    if (!v.ticker || !v.quote) continue;
    const lado = v.alertUp && v.quote >= v.alertUp ? 'up' : v.alertDown && v.quote <= v.alertDown ? 'down' : '';
    if (lado && v.alertHit !== lado) hits.push(`${v.ticker} ${lado === 'up' ? 'passou de' : 'caiu abaixo de'} ${fmtQ(lado === 'up' ? v.alertUp : v.alertDown)} (agora ${fmtQ(v.quote)})`);
    v.alertHit = lado;
  }
  if (hits.length){ toast(hits.join(' · ')); if (window.Android && Android.notificar && podeNotificar('preco')) Android.notificar('Alerta de preço', hits.join('\n')); }
  return hits;
}
// Entrega ao lado nativo os alertas de preço, para ele conferir de hora em hora mesmo com o app fechado (só no APK).
let alertsSent = '';
function updateAlerts(){
  if (!(window.Android && Android.alertas) || demoOn) return;
  const json = JSON.stringify(db.investments.filter(v => v.ticker && (v.alertUp || v.alertDown)).map(v => ({code:v.ticker, src:QUOTE_SRC[v.cat] || 'b3', up:+v.alertUp || 0, down:+v.alertDown || 0})));
  if (json !== alertsSent){ alertsSent = json; Android.alertas(json); }
}
// Atualiza a cotação de tudo o que o usuário tem. Automático no máximo a cada 10 minutos.
let quoting = false;
async function refreshQuotes(force){
  const held = db.investments.filter(v => v.ticker);
  if (!held.length || quoting || (!force && Date.now() - (db.quotesAt || 0) < 10*60e3)) return false;
  quoting = true;
  if (!sheetOpen()) render(); // mostra os valores "carregando" enquanto as cotações chegam
  let ok = false;
  const set = (list, code, q) => { if (q > 0) list.filter(v => v.ticker === code).forEach(v => { v.quote = q; v.quoteAt = Date.now(); recalc(v); ok = true; }); };
  const fx = held.filter(v => QUOTE_SRC[v.cat] === 'fx'), b3 = held.filter(v => QUOTE_SRC[v.cat] === 'b3');
  try { if (fx.length){ const qs = await fxQuotes([...new Set(fx.map(v => v.ticker))]); for (const c in qs) set(fx, c, qs[c]); } } catch(e){}
  for (const code of new Set(b3.map(v => v.ticker))){
    try { const hit = (await searchB3(code)).find(a => a.code === code); if (hit) set(b3, code, hit.quote); } catch(e){}
  }
  quoting = false;
  if (ok){ db.quotesAt = Date.now(); checkPriceAlerts(); save(false); }
  if (!sheetOpen()) render();
  return ok;
}

// Lista de resultados dentro do formulário de investimento.
let assetTimer = 0, assetResults = [];
function searchAssets(q){
  clearTimeout(assetTimer);
  assetTimer = setTimeout(async () => {
    const src = F && QUOTE_SRC[F.vals.cat], box = document.getElementById('assetList');
    if (!src || !box) return;
    let items;
    try { items = await (src === 'b3' ? searchB3(q) : searchFx(q)); }
    catch(e){ box.innerHTML = '<div class="hint">Não foi possível buscar. Verifique a internet.</div>'; return; }
    if (!F || document.getElementById('assetList') !== box) return;
    assetResults = items;
    box.innerHTML = items.length ? items.map((a,i) => `<div class="item" style="padding:9px 2px" data-onclick="pickAsset(${i})"><div class="mid"><b>${esc(a.code)}</b><small>${esc(a.name)}</small></div><div class="val">${a.quote != null ? fmtQ(a.quote) : ''}</div></div>`).join('')
      : '<div class="hint">Nada encontrado.</div>';
  }, 350);
}
const assetPicked = a => `<div class="hint in">${I('check', 14)} ${esc(a.code)} — ${esc(a.name || '')} · cotação atual ${fmtQ(a.quote)}</div>`;
async function pickAsset(i){
  const a = assetResults[i], box = document.getElementById('assetList');
  if (a.quote == null){
    try { a.quote = (await fxQuotes([a.code]))[a.code]; } catch(e){}
    if (!(a.quote > 0)){ box.innerHTML = `<div class="hint">Não há cotação em reais para ${esc(a.code)}.</div>`; return; }
  }
  if (!F) return;
  F.asset = a;
  F.vals.ticker = a.code;
  if (!F.touched.paid) F.vals.paid = String(a.quote).replace('.', ',');
  syncForm();
  box.innerHTML = assetPicked(a);
}

function rateLabel(inv){
  if (inv.index === 'ipca') return 'IPCA + ' + inv.pct.toLocaleString('pt-BR') + '% a.a.';
  if (inv.index === 'pre') return inv.pct.toLocaleString('pt-BR') + '% a.a. prefixado';
  return inv.pct.toLocaleString('pt-BR') + '% ' + (inv.index === 'cdi' ? 'do CDI' : 'da Selic');
}

// ---------- Taxas pela internet (API pública do Banco Central, séries SGS) ----------
// 4389 = CDI anualizado, 432 = meta Selic, 13522 = IPCA acumulado em 12 meses (todas em % a.a.)
async function updateRates(force){
  if (!force && (!db.rates.auto || Date.now() - (db.rates.at || 0) < 12*3600e3)) return false;
  try {
    const get = async code => {
      const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`);
      const v = parseFloat((await r.json())[0].valor);
      if (isNaN(v)) throw new Error('valor inválido');
      return v;
    };
    const [cdi, selic, ipca] = await Promise.all([get(4389), get(432), get(13522)]);
    Object.assign(db.rates, {cdi, selic, ipca, at:Date.now()});
    save(false);
    if (!sheetOpen()) render();
    return true;
  } catch(e){ return false; } // sem internet: continua com as últimas taxas salvas
}
async function updateRatesNow(){
  document.getElementById('ferr').textContent = 'Buscando taxas…';
  if (await updateRates(true)) openRates();
  else if (F) document.getElementById('ferr').textContent = 'Não foi possível buscar as taxas. Verifique a internet.';
}
const ratesInfo = () => db.rates.at ? 'atualizadas em ' + new Date(db.rates.at).toLocaleDateString('pt-BR') + ' pelo Banco Central' : 'ainda não atualizadas pela internet';

// ---------- Orçamento, contas a vencer e fatura do cartão ----------
// Orçamento: db.budgets = {categoria: limite mensal}. Aviso a partir de 80% do limite.
// Com db.prefs.rollBudget, o que sobrou do limite no mês anterior soma ao limite deste mês (base = limite simples).
function budgetStatus(ym){
  const spentOf = m => { const s = {}; expensesOf(m).forEach(e => s[e.cat] = (s[e.cat] || 0) + e.value); return s; };
  const spent = spentOf(ym), prev = db.prefs.rollBudget ? spentOf(addMonths(ym, -1)) : null;
  return Object.entries(db.budgets).filter(([,lim]) => lim > 0).map(([cat, base]) => {
    const extra = prev ? Math.max(0, base - (prev[cat] || 0)) : 0, lim = base + extra;
    return {cat, lim, base, extra, used:spent[cat] || 0, pct:(spent[cat] || 0) / lim * 100};
  });
}
function setRoll(v){
  db.prefs.rollBudget = v; db.cfgMod = Date.now(); save(); render();
  document.querySelectorAll('#rollPick button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!v));
}
// Gastos avulsos fora do padrão: categorias em que o mês atual passou 30% (e pelo menos R$ 50) da média dos 6 meses anteriores.
// Fixos e parcelas ficam de fora: são esperados.
function unusual(){
  const by = ym => { const g = {}; expensesOf(ym).forEach(x => { if (x.kind === 'expense' && !x.fixed) g[x.cat] = (g[x.cat] || 0) + x.value; }); return g; };
  const cur = by(curYM), past = [...Array(6)].map((_, i) => by(addMonths(curYM, -1 - i)));
  return Object.keys(cur).map(cat => ({cat, cur:cur[cat], avg:sum(past, g => g[cat] || 0) / 6}))
    .filter(r => r.avg > 0 && r.cur > r.avg * 1.3 && r.cur - r.avg >= 50).sort((a, b) => b.cur - a.cur);
}
const oddHtml = odd => odd.length ? `<div class="card"><b><span class="warn">${I('alert')}</span> Gastos acima do seu padrão</b>${odd.map(r => `
    <div class="hint">${esc((CAT_GASTO[r.cat] || CAT_GASTO.outros)[1])}: ${fmt(r.cur)} neste mês, ${Math.round((r.cur / r.avg - 1) * 100)}% acima da sua média de 6 meses (${fmt(r.avg)}).</div>`).join('')}</div>` : '';
// Limite do cartão (db.cardLimit): quanto já está comprometido = parcelas que ainda faltam + compras no crédito deste mês.
function cardUsed(bank){
  return sum(db.installments.filter(p => !isFin(p) && p.bank === bank && p.pay === 'credito'), parcFalta)
    + sum(expensesOf(curYM).filter(e => e.kind === 'expense' && e.bank === bank && e.pay === 'credito'), e => e.full || e.value);
}

// ---------- Planejamento: reserva de emergência, assinaturas, dívidas e simulador de quitação ----------
// Reserva: quantos meses de gastos (média dos últimos 6 meses com gasto) as contas e os investimentos cobrem.
function reserve(){
  const outs = [...Array(6)].map((_, i) => totalOut(addMonths(curYM, -1 - i))).filter(v => v > 0);
  const avg = outs.length ? sum(outs, v => v) / outs.length : 0;
  const have = sum(db.accounts, a => Math.max(0, accountBalance(a))) + sum(db.investments, v => v.value || 0);
  return {have, avg, months:avg ? have / avg : null};
}
// ---------- Financiamentos, empréstimos e compras parceladas ----------
// Tudo em db.installments; financiamento e empréstimo têm tipo. As parcelas não são gravadas uma a uma: saem de total,
// n, paid, start, seg e due. j = índice da parcela (0 = a primeira).
const isFin = p => !!PARC_TIPOS[p.tipo];
// Etiqueta de uma parcela na lista do mês: "parcela 3/10" ou "abatimento".
const parcTag = x => x.abat ? 'abatimento' : `parcela ${x.num}/${x.n}`;
// Valor da parcela j: total/n; depois de um abatimento, seg diz o valor a partir de cada parcela (as já passadas não mudam).
function parcVal(p, j){
  let v = p.total / p.n;
  for (const s of p.seg || []) if (s.de <= j) v = s.v;
  return v;
}
const parcSoma = (p, de, ate) => { let s = 0; for (let j = Math.max(0, de); j < ate; j++) s += parcVal(p, j); return s; };
const parcFalta = p => parcSoma(p, p.paid, p.n);          // soma das parcelas que faltam (sem juros)
const parcPago = p => parcSoma(p, 0, Math.min(p.paid, p.n));
const abatido = p => sum(p.ab || [], a => a.v);
// Saldo devedor hoje: sem taxa, a soma das parcelas que faltam; com taxa i ao mês, o valor presente delas (tabela Price:
// com parcelas iguais, P × (1 − (1+i)^−n) ÷ i).
function saldoDevedor(p){
  const i = (+p.taxa || 0) / 100;
  if (!i) return parcFalta(p);
  let s = 0;
  for (let j = p.paid, k = 1; j < p.n; j++, k++) s += parcVal(p, j) / Math.pow(1 + i, k);
  return s;
}
// Vencimento da parcela j: {ym, dia}. Dia cadastrado; senão, numa compra no crédito, o vencimento da fatura do banco;
// senão só o mês (dia 0). Em meses mais curtos, o último dia do mês.
function parcVenc(p, j){
  const ym = addMonths(p.start, j), d = +p.due || (!isFin(p) && p.pay === 'credito' && +db.cardDue[p.bank]) || 0;
  return {ym, dia:d ? Math.min(d, daysIn(ym)) : 0};
}
const vencData = v => v.dia ? v.ym + '-' + String(v.dia).padStart(2, '0') : '';
const vencTxt = v => v.dia ? fmtDate(vencData(v)) : MESES[+v.ym.slice(5) - 1].slice(0, 3) + '/' + v.ym.slice(0, 4);
// Dias até o vencimento (negativo = vencida). Só com o mês, conta até o último dia dele.
function diasAte(v){
  const [y, m] = v.ym.split('-').map(Number), hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, v.dia || daysIn(v.ym)) - hoje) / 864e5);
}
// Situação de cada parcela: paga, vencida (data passou e não foi paga) ou a vencer.
const parcLinhas = p => [...Array(p.n)].map((_, j) => { const v = parcVenc(p, j), dias = diasAte(v); return {j, v, dias, val:parcVal(p, j), st:j < p.paid ? 'paga' : dias < 0 ? 'vencida' : 'avencer'}; });
// Abater A (amortização antecipada, só financiamento e empréstimo). modo 'prazo': a parcela fica igual e o número de
// parcelas que faltam diminui (arredondado para cima: todas as parcelas continuam iguais); 'parcela': o prazo fica igual e
// a parcela diminui. Com taxa, pela tabela Price; sem taxa, na proporção do saldo. Devolve {saldo, r, parc} depois do abatimento.
function abaterCalc(p, A, modo){
  const i = (+p.taxa || 0) / 100, r = p.n - p.paid, P = parcVal(p, p.paid), saldo = Math.max(0, saldoDevedor(p) - A);
  if (modo === 'prazo'){
    const nr = i ? -Math.log(1 - saldo * i / P) / Math.log(1 + i) : saldo / P;
    return {saldo, r:Math.min(r, Math.max(1, Math.ceil(nr - 1e-9))), parc:P};
  }
  return {saldo, r, parc:round2(i ? saldo * i / (1 - Math.pow(1 + i, -r)) : saldo / r)};
}
// Grava o abatimento: as parcelas pagas guardam o valor que tinham; as restantes passam ao valor novo.
function abater(p, A, modo, dia){
  const c = abaterCalc(p, A, modo), seg = (p.seg || [{de:0, v:p.total / p.n}]).filter(s => s.de < p.paid);
  seg.push({de:p.paid, v:c.parc});
  p.seg = seg; p.n = p.paid + c.r;
  p.total = round2(parcSoma(p, 0, p.n));
  p.ab = [...(p.ab || []), {d:dia, v:round2(A), modo}];
  touch(p);
  return c;
}
const subsList = () => db.expenses.filter(x => isMonthly(x) && activeIn(x, curYM)).sort((a, b) => b.value - a.value);
function debts(){
  const list = db.installments.filter(p => p.paid < p.n).map(p => ({p, left:parcFalta(p), end:addMonths(p.start, p.n - 1)})).sort((a, b) => a.end.localeCompare(b.end));
  return {list, total:sum(list, d => d.left), end:list.length ? list[list.length - 1].end : ''};
}
// Adiantar k parcelas: quanto custa agora, quando a compra termina e quantas parcelas ainda ficam.
function payoffCalc(p, k){
  const rem = p.n - p.paid, oldEnd = addMonths(p.start, p.n - 1);
  k = Math.max(0, Math.min(parseInt(k) || 0, rem));
  return {cost:round2(parcSoma(p, p.n - k, p.n)), oldEnd, newEnd:addMonths(oldEnd, -k), left:rem - k};
}
function planHtml(){
  const r = reserve(), meses = r.months == null ? '' : r.months.toLocaleString('pt-BR', {maximumFractionDigits:1});
  return `<h2>Planejamento</h2><div class="card">
    <div class="catrow" style="margin-top:0"><div class="top"><span>Reserva de emergência</span><b class="${r.months == null ? '' : r.months < 3 ? 'warn' : 'in'}">${r.months == null ? 'sem histórico' : hideVals ? '••' : meses + (r.months >= 1.5 ? ' meses' : ' mês')}</b></div>
    ${r.months == null ? '' : `<div class="bar"><i style="width:${Math.min(100, r.months / 6 * 100)}%"></i></div>`}
    <div class="hint" style="margin-top:3px">${r.months == null ? 'Depois de um mês de gastos lançados, o app calcula quantos meses suas contas e investimentos cobrem.'
      : `Você tem ${fmt(r.have)} em contas e investimentos e gasta em média ${fmt(r.avg)} por mês. O recomendado é guardar de 3 a 6 meses de gastos.`}</div></div>
    <div class="quick" style="margin:14px 0 0">
      <button data-onclick="openSubs()"><span>${I('calendar', 20)}</span>Assinaturas</button>
      <button data-onclick="openDebts()"><span>${I('coins', 20)}</span>Dívidas</button>
      <button data-onclick="openPayoff()"><span>${I('percent', 20)}</span>Quitação</button></div></div>`;
}
let subsHits = [];
function openSubs(){
  settingsOpen = false; F = null;
  subsHits = subsList();
  const anuais = db.expenses.filter(x => x.fixed === 'y' && (!x.end || x.end >= curYM)), mes = sum(subsHits, x => x.value);
  showSheet(`<h3>Assinaturas e contas fixas</h3>
    <div class="hint" style="margin-top:0">Tudo o que se repete todo mês, do mais caro ao mais barato, com o custo em um ano. Toque em um item para editar ou encerrar.</div>
    ${subsHits.length ? `<div class="card" style="background:var(--bg);box-shadow:none"><div class="grid2">
        <div class="stat"><small>Por mês</small><b>${fmt(mes)}</b></div><div class="stat"><small>Por ano</small><b class="out">${fmt(mes * 12)}</b></div></div></div>
      ${subsHits.map((x, i) => { const c = CAT_GASTO[x.cat] || CAT_GASTO.outros; return `<div class="item" data-onclick="openForm('expenses', subsHits[${i}])">${ico(c)}<div class="mid"><b>${esc(x.desc)}</b>
        <small>${c[1]} · ${fmt(x.value)} por mês</small></div><div class="val out">${fmt(x.value * 12)}<small style="display:block;font-weight:500;color:var(--muted);text-align:right">por ano</small></div></div>`; }).join('')}`
    : empty('calendar', 'Nenhum gasto fixo mensal cadastrado.')}
    ${anuais.length ? `<label>Uma vez por ano</label>${anuais.map(x => `<div class="item" style="cursor:default"><div class="mid"><b>${esc(x.desc)}</b><small>todo mês de ${MESES[+x.start.slice(5) - 1]}</small></div><div class="val out">${fmt(x.value)}</div></div>`).join('')}` : ''}
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
}
function openDebts(){
  settingsOpen = false; F = null;
  const d = debts(), mes = sum(expensesOf(curYM).filter(x => x.kind === 'installment'), x => x.value);
  showSheet(`<h3>Dívidas e parcelas</h3>
    ${d.list.length ? `<div class="hero" style="margin-top:4px"><small>Saldo devedor</small><div class="big">${fmt(d.total)}</div>
        <div class="row"><div><small>Parcelas deste mês</small><b>${fmt(mes)}</b></div><div><small>Tudo termina em</small><b style="text-transform:capitalize">${monthName(d.end)}</b></div></div></div>
      ${d.list.map(({p, left, end}) => { const c = CAT_GASTO[p.cat] || CAT_GASTO.outros; return `<div class="item" style="cursor:default">${ico(c)}<div class="mid"><b>${esc(p.desc)}</b>
        <small>${p.n - p.paid} de ${p.n} parcelas de ${fmt(parcVal(p, p.paid))} · até ${monthName(end)}</small>
        <div class="bar" style="margin:6px 0 0;height:6px"><i style="width:${p.paid / p.n * 100}%"></i></div></div><div class="val out">${fmt(left)}</div></div>`; }).join('')}`
    : empty('checked', 'Nenhuma compra parcelada em aberto.')}
    <div class="btns foot">${d.list.length ? '<button class="btn" data-onclick="openPayoff()">Simular quitação</button>' : ''}<button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
}
const payoff = {id:'', k:1};
const payoffOpts = () => db.installments.filter(p => p.paid < p.n).map(p => [p.id, p.desc]);
function openPayoff(id){
  settingsOpen = false; F = null;
  const open = db.installments.filter(p => p.paid < p.n);
  if (!open.length) return tell('Nenhuma compra parcelada em aberto para simular.');
  payoff.id = typeof id === 'string' && id ? id : open.some(p => p.id === payoff.id) ? payoff.id : open[0].id;
  const p = open.find(x => x.id === payoff.id);
  payoff.k = Math.max(1, Math.min(payoff.k, p.n - p.paid));
  showSheet(`<h3>Simular quitação</h3>
    <label>Compra</label>
    <button type="button" class="pickBtn" data-onclick="pickList('Compra', payoffOpts(), payoff.id, openPayoff)"><span>${esc(p.desc)}</span>${I('chev')}</button>
    <label for="payK">Parcelas a adiantar (faltam ${p.n - p.paid}, de ${fmt(parcVal(p, p.paid))} cada)</label>
    <input id="payK" type="text" inputmode="numeric" autocomplete="off" value="${payoff.k}" data-oninput="payoff.k=parseInt(this.value)||0;drawPayoff()">
    <div id="payOut"></div>
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`);
  drawPayoff();
}
function drawPayoff(){
  const p = db.installments.find(x => x.id === payoff.id), r = payoffCalc(p, payoff.k), parc = parcVal(p, p.n - 1), k = p.n - p.paid - r.left;
  document.getElementById('payOut').innerHTML = k < 1 ? '<div class="hint">Digite quantas parcelas você quer adiantar.</div>' : `
    <div class="card" style="background:var(--bg);box-shadow:none;margin-top:12px">
      <div class="catrow" style="margin-top:0"><div class="top"><span>Você paga agora (${k}x)</span><b class="out">${fmt(r.cost)}</b></div></div>
      <div class="catrow"><div class="top"><span>Última parcela</span><b>${r.left ? cap(monthName(r.newEnd)) : 'quitada'}</b></div>
        <div class="hint" style="margin-top:3px">Hoje a compra termina em ${monthName(r.oldEnd)}.</div></div>
      <div class="catrow"><div class="top"><span>Sobra por mês depois disso</span><b class="in">${fmt(parc)}</b></div>
        <div class="hint" style="margin-top:3px">De ${monthName(addMonths(r.newEnd, 1))} a ${monthName(r.oldEnd)} (${k} ${k > 1 ? 'meses' : 'mês'}) você deixa de pagar essa parcela.</div></div></div>
    <div class="hint">Conta feita sem desconto. Se o banco ou a loja der desconto para adiantar, a economia é maior.</div>`;
}
const budgetColor = pct => pct > 100 ? 'var(--out)' : pct >= 80 ? 'var(--yield)' : 'var(--in)';
// Contas a vencer: gastos fixos/anuais com dia de vencimento (due) e ainda não marcados como pagos no mês (pm).
const isPaid = (x, ym) => (x.pm || []).includes(ym);
const dueDay = (x, ym) => Math.min(x.due, daysIn(ym));
function upcomingBills(){
  const today = now.getDate();
  return db.expenses.filter(x => x.fixed && x.due && activeIn(x, curYM) && !isPaid(x, curYM))
    .map(x => ({x, diff:dueDay(x, curYM) - today})).filter(b => b.diff <= 7).sort((a,b) => a.diff - b.diff);
}
function togglePaid(id, ym){
  if (window.event) event.stopPropagation();
  const x = db.expenses.find(e => e.id === id);
  if (!x) return tell(ARCH_MSG);
  const pm = x.pm || [];
  x.pm = pm.includes(ym) ? pm.filter(m => m !== ym) : pm.concat(ym);
  touch(x); save(); render();
  if (db.prefs.fun && !pm.includes(ym)){ confetti(); toast(pick(FUN_PAID)); }
}
// Fatura do cartão: compras no crédito por banco. db.cardClose = {banco: dia de fechamento}.
// Um gasto avulso com dia da compra depois do fechamento cai na fatura do mês seguinte.
function invoices(ym){
  const tot = {};
  for (const m of [addMonths(ym, -1), ym]) for (const e of expensesOf(m)){
    if (e.pay !== 'credito' || !e.bank) continue;
    const close = db.cardClose[e.bank], late = e.kind === 'expense' && !e.fixed && e.day && close && e.day > close;
    if ((late ? addMonths(m, 1) : m) === ym) tot[e.bank] = (tot[e.bank] || 0) + (e.full || e.value); // a fatura cobra o valor cheio, mesmo em gasto dividido
  }
  return Object.entries(tot).sort((a,b) => b[1] - a[1]);
}
const creditBanks = () => [...new Set([...db.expenses, ...db.installments].filter(x => x.pay === 'credito' && x.bank).map(x => x.bank))];

// Lembretes no celular (só no APK): monta a lista de avisos dos próximos meses e entrega ao lado nativo,
// que agenda as notificações. db.prefs.remind = quantos dias antes avisar (0 = desligado).
const hashId = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
// ---------- Lembretes: interruptor deste aparelho ----------
// "Lembretes ativos neste aparelho" fica só no aparelho (no APK, nas preferências nativas; no navegador, no localStorage):
// nunca nos dados da conta, no backup, na sincronização ou na conta compartilhada. Uma notificação só é agendada ou
// mostrada com ele ligado E com aquele tipo de aviso ligado nas preferências da conta (db.prefs). O lado nativo confere
// o mesmo interruptor antes de mostrar qualquer notificação (ReminderReceiver.ligado).
const LEMB_KEY = 'financas-lembretes-aparelho', LEMB_AVISO = 'financas-lembretes-aviso';
// '1' ligado, '0' desligado, '' ainda não decidido (só até lembMigrar rodar).
function aparelhoLemb(){
  if (window.Android && Android.lembretesAparelho) return Android.lembretesAparelho();
  try { return localStorage.getItem(LEMB_KEY) || ''; } catch(e){ return ''; }
}
function setAparelhoLemb(on){
  if (window.Android && Android.setLembretesAparelho) Android.setLembretesAparelho(!!on);
  else try { localStorage.setItem(LEMB_KEY, on ? '1' : '0'); } catch(e){}
}
// Android 13 ou mais novo: as notificações precisam da permissão (retirada nas configurações, o interruptor aparece desligado).
const notifLiberada = () => !(window.Android && Android.notificacaoLiberada) || Android.notificacaoLiberada();
const lembLigados = () => aparelhoLemb() === '1' && notifLiberada();
// Preferências da conta que geram notificação: contas a vencer, parcelas de financiamentos e empréstimos, alertas de preço
// dos investimentos e avisos da conta compartilhada.
const lembTipos = p => ({contas:!!p.notify, fin:!!(p.notifyFin ?? p.notify), preco:db.investments.some(v => v.ticker && (v.alertUp || v.alertDown)),
  compart:!!sync.shared && p.avisoComp !== false});
// Decide se um tipo de aviso pode virar notificação: com o interruptor do aparelho desligado, sempre não.
const podeNotificar = tipo => !demoOn && lembLigados() && !!lembTipos(db.prefs)[tipo];
// Primeira abertura desta versão: instalação nova começa desligada (mesmo entrando numa conta com lembretes); quem
// atualizou o app (havia dados neste aparelho) continua como estava: ligado se já tinha algum lembrete ativo.
function lembMigrar(antes = dadosNoAparelho){
  if (aparelhoLemb() !== '') return;
  setAparelhoLemb(antes && Object.values(lembTipos(db.prefs)).some(Boolean));
}
function scheduleReminders(){
  if (demoOn) return;
  if (!(window.Android && Android.lembretes)) return;
  const p = db.prefs, list = [];
  if (!lembLigados()) return void Android.lembretes('[]'); // interruptor do aparelho desligado: nada agendado
  if (podeNotificar('contas')) for (const x of db.expenses){
    if (!x.fixed || !x.due || p.notifyCats[x.cat] === false) continue;
    for (const m of [curYM, addMonths(curYM, 1), addMonths(curYM, 2)]){
      if (!activeIn(x, m) || isPaid(x, m)) continue;
      const [y, mo] = m.split('-').map(Number), d = dueDay(x, m), at = new Date(y, mo - 1, d, 9, 0).getTime();
      const dm = String(d).padStart(2,'0') + '/' + String(mo).padStart(2,'0');
      for (const days of p.reminds) list.push({id:hashId(x.id + m + 'a' + days), at:at - days*864e5, title:p.fun ? 'Oinc! Conta a vencer' : 'Conta a vencer', text:`${x.desc} (${fmt(x.value)}) vence em ${days} dia${days > 1 ? 's' : ''}, em ${dm}.`});
      list.push({id:hashId(x.id + m + 'b'), at, title:p.fun ? 'Oinc! Conta vence hoje' : 'Conta vence hoje', text:`${x.desc} (${fmt(x.value)}) vence hoje, ${dm}.`});
    }
  }
  // Financiamentos e empréstimos com dia de vencimento: aviso no dia, por volta das 9h, das próximas parcelas.
  if (podeNotificar('fin')) for (const q of db.installments){
    if (!isFin(q) || !q.due) continue;
    for (let j = q.paid; j < Math.min(q.n, q.paid + 3); j++){
      const v = parcVenc(q, j), [y, mo] = v.ym.split('-').map(Number);
      list.push({id:hashId(q.id + j + 'f'), at:new Date(y, mo - 1, v.dia, 9, 0).getTime(), title:p.fun ? 'Oinc! Parcela vence hoje' : 'Parcela vence hoje',
        text:`${q.desc}: parcela ${j + 1}/${q.n} (${fmt(parcVal(q, j))}) vence hoje, ${fmtDate(vencData(v)).slice(0, 5)}.`});
    }
  }
  Android.lembretes(JSON.stringify(list.filter(n => n.at > Date.now()).sort((a,b) => a.at - b.at).slice(0, 60)));
}

// Widget da tela inicial (só no APK): entrega ao lado nativo os números do mês atual, já formatados.
function updateWidget(){
  if (!(window.Android && Android.widget) || demoOn) return;
  const tin = totalIn(curYM), tout = totalOut(curYM), m = monthName(curYM), humor = funMood();
  const frase = {feliz:'Oinc! Mês no azul', ok:'Tudo sob controle', triste:'Segura o cartão…'}[humor];
  const curto = v => fmt(v).replace(/^R\$\s?/, '').replace(/,\d\d$/, ''); // sem "R$" nem centavos: cabe no widget de saldo, que é estreito
  Android.widget(JSON.stringify({mes:m[0].toUpperCase() + m.slice(1), saldo:fmt(tin - tout), negativo:tin - tout < 0, ganhos:fmt(tin), gastos:fmt(tout), ganhosC:curto(tin), gastosC:curto(tout),
    fun:!!db.prefs.fun, frase, linhas:widgetLines(), pig:db.prefs.widgetPig ?? !!db.prefs.fun, humor, skin:db.prefs.skin || '',
    // cor = cor do app (o fundo dos widgets acompanha); fundo = 'tema' (cor ou tema especial) ou 'escuro'; pct = gastos sobre ganhos.
    cor:db.prefs.color, fundo:db.prefs.widgetFundo || 'tema', pct:tin > 0 ? Math.min(100, Math.round(tout / tin * 100)) : tout > 0 ? 100 : 0,
    ...widgetGastos(),
    contas:upcomingBills().slice(0, 12).map(b => ({t:b.x.desc, s:b.diff < 0 ? 'atrasada' : b.diff === 0 ? 'vence hoje' : 'vence dia ' + dueDay(b.x, curYM), v:fmt(b.x.value), c:b.diff <= 0 ? 'out' : '', k:(CAT_GASTO[b.x.cat] || CAT_GASTO.outros)[2]})), porco:{humor, frase, gastos:fmt(tout), sub:tin > 0 ? `gastos: ${Math.round(tout / tin * 100)}% dos ganhos` : 'gastos do mês'}}));
}
// Widget "Gastos": a lista dos gastos do mês, como na aba Gastos. db.prefs.widgetLista = qual grupo ('' = todos) e
// db.prefs.widgetOrdem = 'valor' (maiores primeiro) ou '' (a ordem dos grupos do app). Vai até 40 linhas.
function widgetGastos(){
  const p = db.prefs, g = GRUPOS[p.widgetLista], todos = expensesOf(curYM);
  let l = g ? todos.filter(g[1]) : p.grpOrder.flatMap(k => todos.filter(GRUPOS[k][1]));
  if (p.widgetOrdem === 'valor') l = [...l].sort((a, b) => b.value - a.value);
  const m = monthName(curYM).split(' ')[0];
  return {listaTitulo:(g ? g[0] : 'Gastos') + ' de ' + m, listaSub:l.length ? `${l.length} ${l.length > 1 ? 'lançamentos' : 'lançamento'} · ${fmt(sum(l, x => x.value))}` : '',
    lista:l.slice(0, 40).map(x => { const c = CAT_GASTO[x.cat] || CAT_GASTO.outros;
      return {t:x.desc, s:c[1] + (x.kind === 'installment' ? ' · ' + parcTag(x) : x.fixed ? (x.fixed === 'y' ? ' · anual' : isSub(x) ? ' · assinatura' : ' · fixo') : x.day ? ' · dia ' + x.day : ''), v:fmt(x.value), c:'out', k:c[2]}; })};
}
// Linhas do widget Resumo: as escolhidas em Configurações > Widgets, na ordem; as que não têm dado são puladas. [{t, v, c}]
function widgetLines(){
  const tin = totalIn(curYM), tout = totalOut(curYM);
  const itens = {
    saldo:() => ['Saldo do mês', fmt(tin - tout), tin - tout < 0 ? 'out' : 'in'],
    ganhos:() => ['Ganhos', fmt(tin), 'in'],
    gastos:() => ['Gastos', fmt(tout), 'out'],
    conta:() => { const b = upcomingBills()[0]; return b && [`${b.x.desc} · ${b.diff < 0 ? 'atrasada' : b.diff === 0 ? 'vence hoje' : 'em ' + b.diff + (b.diff > 1 ? ' dias' : ' dia')}`, fmt(b.x.value), b.diff <= 0 ? 'out' : '']; },
    contas:() => db.accounts.length && ['Saldo nas contas', fmt(sum(db.accounts, a => accountBalance(a))), ''],
    invest:() => db.investments.length && ['Investido', fmt(sum(db.investments, x => x.value)), ''],
    fatura:() => { const v = sum(invoices(curYM), i => i[1]); return v > 0 && ['Faturas do cartão', fmt(v), 'out']; },
    orcamento:() => { const b = budgetStatus(curYM), lim = sum(b, x => x.lim); return lim > 0 && ['Orçamento usado', Math.round(sum(b, x => x.used) / lim * 100) + '%', '']; },
    vales:() => temVales() && ['Saldo dos vales', fmt(sum(Object.keys(VALES), k => valeSaldo(k))), ''],
    parcelas:() => { const v = sum(expensesOf(curYM).filter(x => x.kind === 'installment'), x => x.value); return v > 0 && ['Parcelas do mês', fmt(v), 'out']; },
    previsao:() => { const n = addMonths(curYM, 1), s = totalIn(n) - totalOut(n); return [(s < 0 ? 'Falta em ' : 'Sobra em ') + monthName(n).split(' ')[0], fmt(Math.abs(s)), s < 0 ? 'out' : 'in']; }};
  return db.prefs.layout.widget.filter(b => b.on).map(b => itens[b.k]()).filter(Boolean).map(([t, v, c]) => ({t, v, c}));
}

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

