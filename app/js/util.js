// Cofrim — Utilidades sem estado de tela: meses e datas, dinheiro (fmt, parseMoney), esc() e somas.
// Carregado na ordem do index.html (lista e dependências em docs/MAPA.md e ARCHITECTURE.md).

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
const fmt = v => hideVals ? MASK : fmtTexto(v);
// Sem a máscara de "Esconder valores": para textos guardados (central de notificações) e notificações do Android.
const fmtTexto = v => (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
// Roda fn com os valores à mostra (lembretes, widget e relatório não podem sair mascarados).
function shown(fn){ const h = hideVals; hideVals = false; try { return fn(); } finally { hideVals = h; } }
// Etiquetas livres de um lançamento ("viagem SP, trabalho" -> ['viagem SP', 'trabalho']).
const tagsOf = x => String(x.tags || '').split(',').map(s => s.trim()).filter(Boolean);
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
function parseMoney(s){ s = String(s).trim().replace(/[R$\s]/g,''); if (s.includes(',')) s = s.replace(/\./g,'').replace(',','.'); return parseFloat(s); }
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const moneyStr = v => v == null || v === '' ? '' : Number(v).toFixed(2).replace('.',',');
const sum = (a, f) => a.reduce((t,x) => t + f(x), 0);
function round2(v){ return Math.round(v*100)/100; } // função (e não const): o fixDb a usa ao abrir o app, antes desta linha
const sheetOpen = () => document.getElementById('sheet').classList.contains('open');
// Regras avisam a tela sem conhecê-la (padrão observador): depois de mudar dados sozinhas (cotação nova, arquivo de
// anos antigos, conta trocada…), chamam telaAtualizar(); a tela se inscreve com aoAtualizar(fn) (ver assistente.js).
// sempre = redesenha mesmo com uma folha aberta.
const ouvintesTela = [];
function aoAtualizar(fn){ ouvintesTela.push(fn); }
function telaAtualizar(sempre = false){ for (const fn of ouvintesTela) fn(sempre); }
