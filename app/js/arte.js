// Minhas Finanças — Desenhos do ícone do app e a animação de abertura.
// Carregado pelo index.html depois de config.js (usa pigSvg, MASCOTES, ICONES e SKINS).
// Os mesmos desenhos viram os arquivos do Android (android/res) pelo arte.ps1, para o ícone e os widgets do
// celular ficarem iguais ao que o app mostra.

// ---------- Ícone do app ----------
// Desenhos do ícone: [nome, miolo em SVG]. O miolo é desenhado numa área de 108 x 108, como os ícones do Android:
// a parte que aparece sempre são os 66 do meio. 'p' (porquinho) e 't' (o do tema) são montados em iconeMiolo.
const ICON_DESENHOS = {
  b:['Barras', '<rect x="33" y="58" width="13" height="16" rx="2" fill="#fff" opacity=".7"/><rect x="47.5" y="47" width="13" height="27" rx="2" fill="#fff" opacity=".85"/><rect x="62" y="34" width="13" height="40" rx="2" fill="#fff"/>'],
  p:['Porquinho', ''],
  m:['Moeda', '<circle cx="54" cy="54" r="22" fill="#fff" opacity=".2"/><circle cx="54" cy="54" r="22" fill="none" stroke="#fff" stroke-width="5"/><path d="M61.5 46.500c-1.500-3-4.500-4.500-8-4.500-4.500 0-8 2.500-8 6.300 0 8 16.500 3.700 16.500 11.700 0 3.800-3.500 6-8.500 6-4 0-7.300-1.800-8.700-5M54 37.500v33" stroke="#fff" stroke-width="4.500" fill="none" stroke-linecap="round"/>'],
  c:['Carteira', '<path d="M35 39l27-8.500a4 4 0 0 1 5.200 3.800V39z" fill="#fff" opacity=".6"/><rect x="29" y="38" width="48" height="36" rx="7" fill="#fff" opacity=".9"/><rect x="60" y="49" width="23" height="14" rx="7" fill="#fff"/><rect x="60" y="49" width="23" height="14" rx="7" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2"/><circle cx="68" cy="56" r="2.800" fill="#000" opacity=".4"/>'],
  l:['Em alta', '<path d="M31 32v40a4 4 0 0 0 4 4h43" stroke="#fff" stroke-width="4.500" fill="none" stroke-linecap="round" opacity=".65"/><path d="M40 65l11-12 8 7 14-17" stroke="#fff" stroke-width="5.500" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 42h10v10" stroke="#fff" stroke-width="5.500" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
  f:['Cofre', '<rect x="36" y="71" width="9" height="7" rx="2.500" fill="#fff" opacity=".65"/><rect x="63" y="71" width="9" height="7" rx="2.500" fill="#fff" opacity=".65"/><rect x="30" y="31" width="48" height="43" rx="8" fill="#fff" opacity=".92"/><circle cx="54" cy="52.500" r="11.500" fill="none" stroke="#000" stroke-opacity=".38" stroke-width="3.500"/><path d="M54 44.500v16M46 52.500h16" stroke="#000" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/><rect x="71" y="45" width="4" height="15" rx="2" fill="#000" opacity=".3"/>'],
  d:['Pizza', '<circle cx="54" cy="54" r="18" fill="none" stroke="#fff" stroke-width="12" opacity=".4"/><circle cx="54" cy="54" r="18" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="47 200" transform="rotate(-90 54 54)"/><circle cx="54" cy="54" r="18" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="28 200" stroke-dashoffset="-50" transform="rotate(-90 54 54)" opacity=".72"/>'],
  t:['Do tema', '']
};
// Desenhos novos (precisam do APK 1.45 ou mais novo): existem para as doze cores; os temas especiais têm b, p e t.
const ICON_NOVOS = ['m', 'c', 'l', 'f', 'd'];
// Fundo do ícone de cada tema especial (atrás do mascote): o cenário do tema.
const TEMA_FUNDO = {
  hacker:'<g stroke="#4ade80" stroke-width="2.200" stroke-linecap="round" opacity=".4" stroke-dasharray="3 5"><path d="M22 10v90M32 4v96M86 8v92M95 14v80M76 2v30M42 2v18M64 0v14"/></g>',
  boneca:estrela(24, 30, 1.4) + estrela(86, 26, 1.1, '#fde68a', .8) + estrela(22, 78, .9, '#fde68a', .8) + estrela(88, 56, .8) + '<path d="M80 84c-4-5-11-1-7 5l7 7 7-7c4-6-3-10-7-5z" fill="#fff" opacity=".5" transform="translate(-52 -74) scale(.8)"/>',
  corrida:'<g fill="#fff" opacity=".22">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => [0, 1].map(j => (i + j) % 2 ? '' : `<rect x="${12 + i * 7}" y="${22 + j * 7}" width="7" height="7"/>`).join('')).join('') + '</g><path d="M10 86h88" stroke="#f59e0b" stroke-width="3" opacity=".55"/>',
  neon:'<circle cx="54" cy="48" r="29" fill="#f472b6" opacity=".4"/><path d="M8 78h92M8 86h92M8 94h92M30 72L14 100M54 72v28M78 72l16 28" stroke="#22d3ee" stroke-width="1.500" opacity=".55"/>',
  papel:'<path d="M12 28h84M12 40h84M12 52h84M12 64h84M12 76h84M12 88h84" stroke="#fff" stroke-width="1.400" opacity=".25"/><path d="M26 10v90" stroke="#f87171" stroke-width="1.400" opacity=".45"/>',
  praia:'<circle cx="82" cy="30" r="13" fill="#fde047" opacity=".85"/><path d="M6 80q8-6 16 0t16 0 16 0 16 0 16 0 16 0v30H6z" fill="#fff" opacity=".32"/><path d="M6 88q8-6 16 0t16 0 16 0 16 0 16 0 16 0v22H6z" fill="#fff" opacity=".3"/>',
  noite:'<path d="M14 36c10-13 27-9 27 2s-15 11-15 3M68 26c8-9 21-5 20 4s-11 8-11 2M12 70c8-7 18-3 17 4" stroke="#9cc0e7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".65"/>' + estrela(86, 60, 1.2, '#f4d35e', .9) + estrela(24, 22, 1, '#f4d35e', .9) + '<path d="M16 100c2-16 6-26 8-34 3 10 6 20 7 34z" fill="#0b1437" opacity=".7"/>',
  bruxo:'<path d="M86 20a11 11 0 1 0 8 18 9 9 0 0 1-8-18z" fill="#fde047" opacity=".8"/>' + estrela(22, 28, 1.1, '#fde047', .8) + estrela(30, 80, .8, '#fde047', .7) + estrela(90, 62, .7, '#fde047', .7),
  espaco:'<circle cx="84" cy="30" r="8" fill="#f59e0b" opacity=".85"/><ellipse cx="84" cy="30" rx="14" ry="3.500" fill="none" stroke="#fde68a" stroke-width="1.700" opacity=".85" transform="rotate(-20 84 30)"/>' + estrela(22, 26, .8) + estrela(28, 84, .6) + estrela(92, 66, .6) + '<circle cx="18" cy="56" r="1.300" fill="#fff"/><circle cx="64" cy="14" r="1.300" fill="#fff"/>',
  floresta:'<path d="M14 96l11-24 11 24zM17 80l8-19 8 19zM72 96l11-26 11 26zM75 78l8-19 8 19z" fill="#052e16" opacity=".45"/>',
  retro:'<g fill="#fff" opacity=".3"><rect x="18" y="22" width="6" height="6"/><rect x="24" y="28" width="6" height="6"/><rect x="84" y="22" width="6" height="6"/><rect x="22" y="80" width="6" height="6"/><rect x="88" y="46" width="6" height="6"/></g><path d="M8 92h92" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".3"/>',
  dragao:'<path d="M4 100l24-38 13 19 15-28 17 30 11-15 22 32z" fill="#000" opacity=".32"/><circle cx="84" cy="26" r="9" fill="#a3e635" opacity=".35"/>',
  grandprix:'<path d="M42 0h7v108h-7z" fill="#1d4ed8" opacity=".55"/><path d="M50.500 0h7v108h-7z" fill="#fff" opacity=".6"/><path d="M59 0h7v108h-7z" fill="#dc2626" opacity=".55"/>',
  rua:'<path d="M6 100V72h10V60h9v20h8V54h11v24h8V66h10v14h9V58h10v22h8V70h9v30z" fill="#000" opacity=".38"/><path d="M8 92h92" stroke="#fb923c" stroke-width="2.200" opacity=".75"/>',
  drift:'<circle cx="54" cy="50" r="31" fill="#dc2626" opacity=".6"/><path d="M8 90c14-8 26 6 40 0s26 6 52-2" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>',
  fusca:'<g transform="rotate(-22 54 54)" opacity=".55"><path d="M-20 44h150v6H-20z" fill="#dc2626"/><path d="M-20 51h150v6H-20z" fill="#fff"/><path d="M-20 58h150v6H-20z" fill="#1d4ed8"/></g>',
  vikings:'<path d="M6 36q22-18 46-5t50-9" stroke="#5eead4" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/><path d="M4 100l25-35 14 18 18-30 17 27 10-12 18 32z" fill="#fff" opacity=".2"/>',
  espartano:'<path d="M12 26h8v-7h8v7h8v-7h8v7h8v-7h8v7h8v-7h8v7h8v-7h8" stroke="#fbbf24" stroke-width="2.600" fill="none" opacity=".65"/><path d="M12 92h8v-7h8v7h8v-7h8v7h8v-7h8v7h8v-7h8v7h8v-7h8" stroke="#fbbf24" stroke-width="2.600" fill="none" opacity=".65"/>'
};
// O mascote de um tema, para pôr dentro de outro desenho (posição e largura dadas). A moeda só fica se pedida.
function mascoteEm(tema, humor, x, y, w, moeda){
  let s = pigSvg(humor, tema).replace(/class="pig \w+" /, '').replace('width="104" height="95"', `x="${x}" y="${y}" width="${w}" height="${Math.round(w * 110 / 120 * 10) / 10}"`);
  return moeda ? s : s.replace(/<g class="moeda">.*?<\/g>/, '');
}
// Miolo do ícone (sem o fundo).
function iconeMiolo(cor, desenho){
  if (desenho === 'p') return mascoteEm('', 'ok', 24, 25, 60);
  // Do tema: um desenho só, grande e centrado. O cenário fica bem de leve atrás, um halo destaca o personagem (sem
  // moeda nem sombra de chão) e, no canto, a marca do app: as três barras numa plaquinha com contorno da cor do fundo.
  if (desenho === 't' && SKINS[cor]){
    const escuro = SKINS[cor][1] ? SKINS[cor][5] : SKINS[cor][2];
    return `<g opacity=".3">${TEMA_FUNDO[cor] || ''}</g><circle cx="54" cy="54" r="31" fill="#fff" opacity=".13"/>`
      + `<defs><filter id="is${cor}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.500" stdDeviation="2.200" flood-color="#000" flood-opacity=".28"/></filter></defs>`
      + `<g filter="url(#is${cor})">${mascoteEm(cor, 'feliz', 19.500, 20, 69).replace(/<ellipse cx="60" cy="104" rx="30" ry="4"[^>]*>/, '')}</g>`
      + `<rect x="62.500" y="62.500" width="17" height="17" rx="5.500" fill="${escuro}" stroke="${ICONES[cor][2]}" stroke-width="2.600"/>`
      + '<g fill="#fff"><rect x="66.200" y="72" width="2.800" height="4" rx=".8" opacity=".7"/><rect x="69.600" y="69.500" width="2.800" height="6.500" rx=".8" opacity=".85"/><rect x="73" y="66.500" width="2.800" height="9.500" rx=".8"/></g>';
  }
  return (ICON_DESENHOS[desenho] || ICON_DESENHOS.b)[1];
}
// Ícone pronto para mostrar na tela (fundo + miolo), do jeito que aparece na tela inicial.
function iconeSvg(cor, desenho, px = 56){
  const c = ICONES[cor] || ICONES.indigo, id = 'ic' + cor + desenho;
  return `<svg viewBox="18 18 72 72" width="${px}" height="${px}" style="border-radius:26%;display:block" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs><rect x="18" y="18" width="72" height="72" fill="url(#${id})"/>${iconeMiolo(cor, desenho)}</svg>`;
}
// Desenhos que existem para uma cor de ícone neste aparelho.
function iconeDesenhos(cor){
  if (SKINS[cor]) return SKIN_ANTIGOS.includes(cor) ? ['b', 'p', 't'] : ['t']; // os temas por categoria só têm o ícone próprio
  return ['b', 'p', ...(window.Android && Android.criarAtalho ? ICON_NOVOS : [])];
}

// ---------- Abertura ----------
// Ao abrir, o app mostra por um instante uma tela com as cores escolhidas (ou as do tema especial): as barras do app
// subindo ou, com tema especial ou modo divertido, o mascote chegando do jeito do tema. As cores ficam guardadas
// (ABRE_KEY, gravada por applyTheme) para a tela já nascer na cor certa, antes de o resto carregar.
const ABRE_JEITO = {corrida:'vel', grandprix:'vel', rua:'vel', drift:'vel', fusca:'vel', bruxo:'magia', boneca:'magia', noite:'magia', espaco:'magia',
  hacker:'tec', neon:'tec', retro:'tec', vikings:'forca', espartano:'forca', dragao:'forca', papel:'calma', praia:'calma', floresta:'calma'};
// O que deve esperar a abertura sair da frente (as telas que abrem sozinhas ao iniciar): roda na hora se ela já saiu.
const abreFila = [];
function aposAbertura(f){ if (document.getElementById('abre')) abreFila.push(f); else f(); }
function abertura(){
  const el = document.getElementById('abre');
  if (!el) return;
  if (window.TESTE || !db.prefs.anim || matchMedia('(prefers-reduced-motion: reduce)').matches) return el.remove();
  const sk = db.prefs.skin || '', comMascote = sk || db.prefs.fun;
  el.dataset.g = sk ? cenaDe(sk)[3] : ''; // o jeito de entrar de cada tema vem da cena dele (js/cena.js)
  document.getElementById('abreIn').innerHTML = (comMascote
    ? `<div class="abreM">${mascoteEm(sk, 'feliz', 0, 0, 150, true)}</div>`
    : `<svg viewBox="28 28 52 52" width="132" height="132" aria-hidden="true">${[[33, 58, 16, .7], [47.5, 47, 27, .85], [62, 34, 40, 1]].map(([x, y, h, o], i) => `<rect class="abreBar" style="animation-delay:${i * 90}ms" x="${x}" y="${y}" width="13" height="${h}" rx="2" fill="#fff" opacity="${o}"/>`).join('')}</svg>`)
    + `<b>${esc(window.Android && Android.iconeNome && APP_NOMES[Android.iconeNome()] || 'Minhas Finanças')}</b>`;
  let acabou = false;
  const fim = () => { if (acabou) return; acabou = true; el.classList.add('fim'); setTimeout(() => { el.remove(); abreFila.splice(0).forEach(f => f()); }, 400); };
  setTimeout(fim, 1750); // entrada mais demorada, para dar tempo de ver
  el.onclick = fim; // um toque pula
}
