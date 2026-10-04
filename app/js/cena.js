// Minhas Finanças — Motor de cenas dos temas especiais.
// Carregado pelo index.html depois de arte.js. Cada tema especial tem uma CENA própria, desenhada pelo app (sem
// imagens): um horizonte, um astro e partículas que ficam se movendo o tempo todo no fundo da tela; e quatro
// animações com as formas e as cores do tema: a entrada (abertura), a troca de tela, a comemoração e o novo gasto.
// A base é o tema Noite estrelada: o desenho fica por trás do conteúdo, mais forte no topo, e os cartões ficam um
// pouco transparentes para ele aparecer. Só se movem posição e opacidade (o aparelho desenha sem travar); com as
// animações desligadas nas Configurações, a cena fica parada.

// Horizontes: silhuetas numa faixa de 390 x 120 (a base é y = 120). [longe, perto] = dois planos, do mais claro ao mais escuro.
const CENA_HORIZ = {
  montanhas:['M0 120V78l34-30 28 22 40-48 38 44 30-24 44 40 36-30 46 38 40-26 54 44v40z', 'M0 120V96l50-26 44 20 56-34 48 30 60-22 60 30 72-24v50z'],
  serras:['M0 120V70q50-30 100 0t100-6 100 10 90-12v58z', 'M0 120V94q60-24 130-4t130-8 130 6v32z'],
  cidade:['M0 120V70h20V50h16v30h14V34h22v46h12V58h18v22h14V26h20v54h16V46h22v34h14V62h18v18h16V40h20v40h14V56h18v24h16V30h22v50h14V66h30v54z', 'M0 120V92h26V78h20v14h30V70h24v22h34V82h22v10h30V64h26v28h28V80h24v12h36V74h28v18h36v28z'],
  dunas:['M0 120V84q70-40 150-6t140-18 100 14v46z', 'M0 120v-18q80-30 170-6t220-14v38z'],
  pinheiros:['M0 120V92l14-34 14 34 10-22 12 22 16-44 16 44 12-26 12 26 14-38 14 38 12-24 12 24 16-46 16 46 10-20 10 20 14-36 14 36 12-26 12 26 16-42 16 42 10-22 10 22 14-34 14 34 16-30v58z', 'M0 120V100l20-44 20 44 18-34 18 34 22-52 22 52 16-30 16 30 22-48 22 48 18-36 18 36 22-50 22 50 18-34 18 34 20-40 22 40v20z'],
  ondas:['M0 120V84q16-12 32 0t33 0 32 0 33 0 32 0 33 0 32 0 33 0 32 0 33 0 32 0 33 0v36z', 'M0 120V100q20-12 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 30 0v20z'],
  castelo:['M0 120V86l60-20 60 22 50-30 60 24 60-18 100 30v26z', 'M120 120V60h10V46h10v14h14V30h8V16h12v14h8V8h14v22h8V16h12v14h8v30h14V46h10v14h10v60z'],
  ruinas:['M0 120V90l70-16 80 14 90-20 150 26v26z', 'M30 120V56h14v64zM60 120V48h14v72zM24 56h56v-8H24zM150 120V70h12v50zM176 120V40h14v80zM206 120V40h14v80zM170 40h56v-9h-56zM290 120V62h13v58zM318 120V80h12v40zM346 120V54h14v66z'],
  campo:['M0 120V88q100-16 200-4t190-8v44z', 'M0 120v-14h390v14zM20 106V90h4v16zM60 106V90h4v16zM100 106V90h4v16zM140 106V90h4v16zM10 96h140v4H10z'],
  vila:['M0 120V84l70-14 90 10 100-16 130 22v34z', 'M10 120V92l20-16 20 16v28zM60 120V84l24-20 24 20v36zM120 120V96l18-14 18 14v24zM170 120V80l10-30 10 30v40zM200 120V90l22-18 22 18v30zM258 120V86l24-20 24 20v34zM320 120V94l20-16 20 16v26z'],
  mesas:['M0 120V96h40l10-40h50l8 40h70l12-56h44l10 56h60l8-30h40l8 30h30v24z', 'M0 120v-16h390v16zM300 104V70h-8V58h8V44h10v36h8V66h8v14h-8v24zM60 104V80h-6V70h6V60h8v44z'],
  estadio:['M0 120V84q195-50 390 0v36z', 'M0 120v-20q195-34 390 0v20zM30 60l8 40h-16zM352 60l8 40h-16z'],
  palco:['M0 120V30q30 30 0 70zM390 120V30q-30 30 0 70z', 'M0 120v-16h390v16zM90 104l20-50 20 50zM260 104l20-50 20 50z'],
  ponte:['M0 120V92h390v28z', 'M0 96h390v6H0zM60 96V40h10v56zM320 96V40h10v56zM65 44q130 70 260 0v6q-130 70-260 0zM100 96V72h4v24zM140 96V84h4v12zM246 96V84h4v12zM286 96V72h4v24z'],
  vulcao:['M0 120V96l80-20 60 14 40-60h30l40 60 60-18 80 24z', 'M0 120v-14q195-20 390 0v14z'],
  lapides:['M0 120V94q100-20 200-6t190-10v42z', 'M30 120V92a10 10 0 0 1 20 0v28zM80 120V84h6v-8h6v8h6v8h-6v28zM130 120V96a9 9 0 0 1 18 0v24zM230 120V88a11 11 0 0 1 22 0v32zM290 120V82h6v-9h6v9h6v8h-6v30zM340 120V96a9 9 0 0 1 18 0v24z'],
  ilha:['M0 120V100h390v20z', 'M90 120q100-50 210 0zM196 86q-4-34 8-52l5 2q-10 18-6 50zM206 36q-24-14-44 2 24-6 44-2zM208 36q24-16 46-2-24-4-46 2zM207 34q-8-22-30-22 20 6 30 22zM208 34q10-20 30-18-20 4-30 18z'],
  templo:['M0 120V92l80-14 100 12 90-18 120 22v26z', 'M150 120V70h-14l-8-10h134l-8 10h-14v50h-12V82h-66v38zM140 54l-12-10h134l-12 10zM195 44V30h10v14z'],
  muralha:['M0 120V84l90-18 110 16 100-22 90 20v40z', 'M0 120V86h24V74h20v12h24V74h20v12h24V74h20v12h24V74h20v12h24V74h20v12h24V74h20v12h24V74h20v12h24V74h20v12h34v34z'],
  trilho:['M0 120V92q195-26 390 0v28z', 'M0 108h390v4H0zM0 116h390v4H0zM20 104h6v18h-6zM70 104h6v18h-6zM120 104h6v18h-6zM170 104h6v18h-6zM220 104h6v18h-6zM270 104h6v18h-6zM320 104h6v18h-6zM366 104h6v18h-6z'],
  nenhum:['', '']
};
// Astros: desenhados numa área de 100 x 100. c = cor do destaque do tema, c2 = destaque 2.
const CENA_ASTRO = {
  lua:(c, c2) => `<circle cx="50" cy="50" r="46" fill="${c}" opacity=".16"/><circle cx="50" cy="50" r="30" fill="${c}"/><circle cx="40" cy="42" r="6" fill="${c2}" opacity=".35"/><circle cx="60" cy="60" r="8" fill="${c2}" opacity=".3"/><circle cx="58" cy="36" r="3.500" fill="${c2}" opacity=".3"/>`,
  sol:(c, c2) => `<circle cx="50" cy="50" r="48" fill="${c}" opacity=".14"/><circle cx="50" cy="50" r="38" fill="${c}" opacity=".2"/><circle cx="50" cy="50" r="27" fill="${c}"/>`,
  crescente:c => `<circle cx="50" cy="50" r="44" fill="${c}" opacity=".12"/><path d="M62 18a34 34 0 1 0 22 56 28 28 0 0 1-22-56z" fill="${c}"/>`,
  planeta:(c, c2) => `<circle cx="50" cy="50" r="24" fill="${c}"/><ellipse cx="50" cy="50" rx="44" ry="10" fill="none" stroke="${c2}" stroke-width="4" transform="rotate(-18 50 50)"/><path d="M27 43a24 24 0 0 1 46 0z" fill="${c}"/>`,
  eclipse:(c, c2) => `<circle cx="50" cy="50" r="46" fill="${c}" opacity=".18"/><circle cx="50" cy="50" r="33" fill="${c}"/><circle cx="50" cy="50" r="28" fill="${c2}"/>`,
  duasluas:(c, c2) => `<circle cx="36" cy="46" r="26" fill="${c}"/><circle cx="76" cy="66" r="13" fill="${c2}"/><circle cx="36" cy="46" r="34" fill="${c}" opacity=".14"/>`,
  olho:(c, c2) => `<path d="M6 50q44-44 88 0-44 44-88 0z" fill="${c}" opacity=".9"/><circle cx="50" cy="50" r="17" fill="${c2}"/><circle cx="50" cy="50" r="7" fill="${c}"/>`,
  portal:(c, c2) => `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="5" opacity=".5"/><circle cx="50" cy="50" r="32" fill="none" stroke="${c2}" stroke-width="5" opacity=".7"/><circle cx="50" cy="50" r="20" fill="${c}"/>`,
  estrela:c => `<path d="M50 4l11 33 35 1-28 21 10 34-28-20-28 20 10-34L4 38l35-1z" fill="${c}"/>`,
  cogumelo:(c, c2) => `<circle cx="50" cy="38" r="34" fill="${c}"/><circle cx="50" cy="38" r="42" fill="${c}" opacity=".18"/><path d="M40 60h20l6 36H34z" fill="${c2}"/>`,
  nenhum:() => ''
};
// Partículas: [desenho numa área de 20 x 20 (cor = currentColor), movimento, quantas, tamanho mínimo e máximo em px].
// Movimentos: cai, sobe, pisca, voa (atravessa de lado), chove (risca rápido), flutua (balança no lugar).
const CENA_PART = {
  estrelas:['<path d="M10 0l2.400 7.600L20 10l-7.600 2.400L10 20l-2.400-7.600L0 10l7.600-2.400z"/>', 'pisca', 22, 5, 12],
  neve:['<circle cx="10" cy="10" r="8"/>', 'cai', 20, 4, 9],
  chuva:['<path d="M12 0l2 1-6 19-2-1z"/>', 'chove', 26, 14, 22],
  petalas:['<path d="M10 1c7 3 9 11 0 18C1 12 3 4 10 1z"/>', 'cai', 16, 8, 14],
  folhas:['<path d="M2 18C2 6 8 1 19 1c0 11-5 17-17 17zM2 18l9-9" stroke="currentColor" stroke-width="1"/>', 'cai', 14, 9, 16],
  brasas:['<circle cx="10" cy="10" r="7"/>', 'sobe', 18, 3, 7],
  bolhas:['<circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2.200"/><circle cx="7" cy="7" r="1.800"/>', 'sobe', 14, 7, 16],
  codigo:['<rect x="6" y="0" width="8" height="20" rx="2"/>', 'chove', 20, 8, 16],
  vagalumes:['<circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="9" opacity=".3"/>', 'flutua', 14, 7, 13],
  poeira:['<circle cx="10" cy="10" r="6"/>', 'voa', 16, 3, 6],
  notas:['<path d="M7 3l10-2v11a3.500 3.500 0 1 1-2-3.200V5L9 6.200V15a3.500 3.500 0 1 1-2-3.200z"/>', 'sobe', 10, 11, 17],
  cartas:['<rect x="3" y="0" width="14" height="20" rx="2.500"/><path d="M10 6c2-3 5 0 3 2l-3 4-3-4c-2-2 1-5 3-2z" fill="#fff" opacity=".85"/>', 'cai', 10, 12, 18],
  moedas:['<circle cx="10" cy="10" r="9"/><circle cx="10" cy="10" r="6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.500"/>', 'cai', 10, 9, 14],
  coracoes:['<path d="M10 18C-4 9 3-2 10 5c7-7 14 4 0 13z"/>', 'sobe', 12, 8, 14],
  raios:['<path d="M12 0L3 11h6l-2 9 10-12h-6z"/>', 'pisca', 7, 12, 20],
  fumaca:['<circle cx="10" cy="10" r="10"/>', 'sobe', 9, 26, 54],
  nuvens:['<path d="M4 15a4 4 0 0 1 0-8 6 6 0 0 1 11-2 5 5 0 0 1 1 10z"/>', 'voa', 5, 44, 84],
  passaros:['<path d="M0 8q5-5 10 2 5-7 10-2-5-2-10 4-5-6-10-4z"/>', 'voa', 6, 12, 20],
  bolas:['<circle cx="10" cy="10" r="9"/><path d="M1 10h18M10 1v18" stroke="#000" stroke-opacity=".35" stroke-width="1.200" fill="none"/>', 'flutua', 6, 12, 20],
  quadrados:['<rect x="2" y="2" width="16" height="16"/>', 'pisca', 16, 5, 10],
  cinzas:['<circle cx="10" cy="10" r="7"/>', 'cai', 20, 3, 6],
  flocos:['<path d="M10 0v20M0 10h20M3 3l14 14M17 3L3 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', 'cai', 14, 8, 14],
  laminas:['<path d="M10 0l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><circle cx="10" cy="10" r="2" fill="#000" opacity=".4"/>', 'voa', 7, 10, 16],
  gotas:['<path d="M10 1c5 7 7 10 7 13a7 7 0 0 1-14 0c0-3 2-6 7-13z"/>', 'cai', 14, 7, 12],
  hexagonos:['<path d="M10 0l8.700 5v10L10 20l-8.700-5V5z" fill="none" stroke="currentColor" stroke-width="2"/>', 'flutua', 10, 12, 22],
  penas:['<path d="M3 19C3 8 8 2 18 1c-1 10-6 15-12 16zM3 19l8-9" stroke="currentColor" stroke-width=".8"/>', 'cai', 10, 11, 18],
  baloes:['<path d="M10 1a7 8 0 0 1 0 16 7 8 0 0 1 0-16zM10 17v3" stroke="currentColor" stroke-width="1"/>', 'sobe', 9, 14, 24]
};
// Cena de cada tema: [horizonte, astro, partículas, entrada, troca de tela]. Entradas: cai, vel, magia, tec, forca,
// calma, zoom, gira. Trocas: sobe, lado, zoom, vira, degraus, cai, cortina, foco, quica, desliza.
const CENAS = {
  hacker:['cidade', 'nenhum', 'codigo', 'tec', 'degraus'], boneca:['castelo', 'estrela', 'coracoes', 'magia', 'quica'], corrida:['estadio', 'sol', 'poeira', 'vel', 'lado'],
  neon:['cidade', 'sol', 'quadrados', 'tec', 'zoom'], papel:['vila', 'sol', 'penas', 'calma', 'vira'], praia:['ilha', 'sol', 'passaros', 'calma', 'desliza'],
  noite:['nenhum', 'nenhum', 'estrelas', 'magia', 'foco'], bruxo:['castelo', 'crescente', 'vagalumes', 'magia', 'foco'], espaco:['nenhum', 'planeta', 'estrelas', 'zoom', 'zoom'],
  floresta:['pinheiros', 'sol', 'folhas', 'calma', 'sobe'], retro:['montanhas', 'sol', 'quadrados', 'tec', 'degraus'], dragao:['montanhas', 'lua', 'brasas', 'forca', 'cai'],
  grandprix:['estadio', 'nenhum', 'bolas', 'vel', 'lado'], rua:['cidade', 'lua', 'poeira', 'vel', 'desliza'], drift:['templo', 'sol', 'petalas', 'vel', 'lado'],
  fusca:['serras', 'sol', 'nuvens', 'vel', 'quica'], vikings:['montanhas', 'lua', 'neve', 'forca', 'cai'], espartano:['ruinas', 'sol', 'brasas', 'forca', 'cortina'],
  colegio:['cidade', 'estrela', 'coracoes', 'cai', 'quica'], fadas:['pinheiros', 'crescente', 'vagalumes', 'magia', 'foco'], supermeninas:['cidade', 'sol', 'coracoes', 'vel', 'quica'],
  portal:['nenhum', 'portal', 'bolhas', 'gira', 'zoom'], botoes:['vila', 'lua', 'vagalumes', 'calma', 'vira'], pantano:['pinheiros', 'lua', 'vagalumes', 'calma', 'sobe'],
  jovens:['cidade', 'lua', 'estrelas', 'forca', 'lado'], morcego:['cidade', 'lua', 'passaros', 'forca', 'cai'], superheroi:['cidade', 'sol', 'nuvens', 'vel', 'sobe'],
  lanterna:['nenhum', 'portal', 'vagalumes', 'zoom', 'foco'], amazona:['ruinas', 'sol', 'estrelas', 'forca', 'cortina'], armadura:['cidade', 'eclipse', 'brasas', 'tec', 'zoom'],
  mercenario:['cidade', 'nenhum', 'laminas', 'vel', 'lado'], gigante:['cidade', 'nenhum', 'poeira', 'forca', 'quica'], capitao:['montanhas', 'estrela', 'estrelas', 'forca', 'sobe'],
  trovao:['montanhas', 'nenhum', 'raios', 'forca', 'cai'], aranha:['ponte', 'lua', 'poeira', 'vel', 'desliza'], relampago:['cidade', 'nenhum', 'raios', 'vel', 'lado'],
  guardioes:['nenhum', 'duasluas', 'estrelas', 'zoom', 'gira'], simbionte:['cidade', 'eclipse', 'gotas', 'forca', 'foco'], chamas:['vulcao', 'nenhum', 'brasas', 'forca', 'cai'],
  mutantes:['muralha', 'nenhum', 'laminas', 'forca', 'cortina'], quarteto:['cidade', 'planeta', 'estrelas', 'zoom', 'sobe'], magosupremo:['templo', 'olho', 'hexagonos', 'magia', 'gira'],
  superfamilia:['ponte', 'sol', 'nuvens', 'vel', 'quica'], peixe:['ondas', 'nenhum', 'bolhas', 'calma', 'desliza'], trancas:['castelo', 'lua', 'vagalumes', 'magia', 'sobe'],
  maca:['pinheiros', 'crescente', 'folhas', 'magia', 'foco'], cristal:['castelo', 'estrela', 'estrelas', 'magia', 'quica'], maravilhas:['campo', 'crescente', 'cartas', 'gira', 'vira'],
  adormecida:['castelo', 'crescente', 'petalas', 'calma', 'foco'], sereia:['ondas', 'lua', 'bolhas', 'calma', 'desliza'], fera:['castelo', 'lua', 'petalas', 'magia', 'cortina'],
  savana:['mesas', 'sol', 'passaros', 'calma', 'sobe'], guerreira:['muralha', 'sol', 'petalas', 'forca', 'lado'], arqueira:['serras', 'lua', 'vagalumes', 'forca', 'sobe'],
  ilha:['ondas', 'sol', 'passaros', 'calma', 'desliza'], gelo:['montanhas', 'lua', 'flocos', 'calma', 'cai'], mel:['campo', 'sol', 'hexagonos', 'calma', 'quica'],
  brinquedos:['campo', 'sol', 'baloes', 'cai', 'quica'], lampada:['dunas', 'crescente', 'estrelas', 'magia', 'gira'], monstrinhos:['cidade', 'lua', 'bolhas', 'cai', 'quica'],
  jantar:['vila', 'lua', 'coracoes', 'calma', 'foco'], nunca:['ilha', 'estrela', 'vagalumes', 'magia', 'sobe'], planeta:['ruinas', 'sol', 'folhas', 'calma', 'sobe'],
  selva:['pinheiros', 'sol', 'passaros', 'forca', 'desliza'], ferias:['ilha', 'sol', 'nuvens', 'calma', 'quica'], chef:['vila', 'lua', 'fumaca', 'calma', 'vira'],
  aloha:['ilha', 'sol', 'petalas', 'calma', 'desliza'], halloween:['lapides', 'lua', 'passaros', 'magia', 'foco'], noiva:['lapides', 'crescente', 'vagalumes', 'calma', 'foco'],
  sombria:['castelo', 'eclipse', 'penas', 'magia', 'cortina'], dalmatas:['vila', 'sol', 'cinzas', 'cai', 'quica'], pomagico:['pinheiros', 'estrela', 'estrelas', 'magia', 'sobe'],
  supercao:['cidade', 'sol', 'raios', 'vel', 'lado'], cacadores:['serras', 'sol', 'folhas', 'vel', 'sobe'], ninja:['templo', 'sol', 'folhas', 'vel', 'lado'],
  espada:['castelo', 'duasluas', 'quadrados', 'tec', 'zoom']
};
Object.assign(CENAS, typeof CENAS_NOVAS === 'undefined' ? {} : CENAS_NOVAS); // as dos temas de js/temas2.js
const cenaDe = k => CENAS[k] || ['serras', 'sol', 'estrelas', 'cai', 'sobe'];
// Números "sorteados" sempre iguais para o mesmo tema e a mesma partícula: a cena não muda a cada redesenho.
const cenaRnd = (k, i, j) => { let h = 2166136261; for (const ch of k + '|' + i + '|' + j) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };
// O ato do tema (js/atos.js) dentro da cena: a figura própria dele com o movimento dela. As que atravessam a tela
// andam no <i> de fora; o desenho de dentro faz o resto (quicar, rolar, balançar…).
const ATO_ANDA = ['cruza', 'volta', 'quica', 'rola', 'navega', 'arco'];
function atoHtml(k){
  const a = typeof ATOS !== 'undefined' && ATOS[k];
  if (!a) return '';
  const [fig, mov, tam = 46, alt = 150, dur = 10, n = 1] = a, anda = ATO_ANDA.includes(mov);
  // A faixa livre da tela é o topo (atrás do título): as figuras de chão ficam apoiadas no horizonte, logo acima do
  // primeiro cartão; as que voam, mais para cima. (Em ATOS, altura de 150 para cima quer dizer "no chão".)
  const y = alt >= 150 ? 126 - tam : Math.round(alt * .34);
  return `<div class="cenaAto at-${mov}">${[...Array(n)].map((_, i) => { const atraso = `animation-delay:-${(i * dur / n + cenaRnd(k, 'at', i) * 2).toFixed(1)}s`, dy = n > 1 && alt < 150 ? Math.round((cenaRnd(k, 'ay', i) - .5) * 30) : 0;
    return `<i style="top:${y + dy}px;${anda ? `animation-duration:${dur}s;${atraso}` : `left:${Math.round(n > 1 ? 6 + (i + cenaRnd(k, 'ax', i) * .6) * 80 / n : 12 + cenaRnd(k, 'ax', 0) * 52)}%`}"><svg viewBox="0 0 40 40" style="width:${tam}px;height:${tam}px${anda ? '' : `;animation-duration:${dur}s;${atraso}`}">${fig}</svg></i>`; }).join('')}</div>`;
}
// HTML da cena de um tema: céu, astro, dois planos de horizonte, o ato do tema e as partículas.
function cenaHtml(k){
  const s = SKINS[k], [hz, astro, part] = cenaDe(k), P = CENA_PART[part] || CENA_PART.estrelas, [longe, perto] = CENA_HORIZ[hz] || CENA_HORIZ.nenhum;
  const escuro = s[1], c = s[2], c2 = s[3], fundo = s[6];
  const mix = (a, p, b) => `color-mix(in srgb,${a} ${p}%,${b})`;
  const ax = 40 + cenaRnd(k, "a", 0) * 5; // o astro fica no vão entre o título e os botões do topo
  return `<div class="cenaCeu" style="background:linear-gradient(180deg,${mix(s[4], escuro ? 62 : 26, fundo)},${mix(s[5], escuro ? 30 : 12, fundo)} 62%,${fundo})"></div>
    ${astro !== 'nenhum' ? `<svg class="cenaAstro" viewBox="0 0 100 100" style="left:${ax}%">${CENA_ASTRO[astro](mix(c2, escuro ? 88 : 70, fundo), mix(c, escuro ? 70 : 55, fundo))}</svg>` : ''}
    ${longe ? `<svg class="cenaHz longe" viewBox="0 0 390 120" preserveAspectRatio="none"><path d="${longe}" fill="${mix(s[5], escuro ? 62 : 40, fundo)}"/></svg>` : ''}
    ${(ATOS[k] || [])[1] === 'sobe' ? atoHtml(k) : ''}
    ${perto ? `<svg class="cenaHz perto" viewBox="0 0 390 120" preserveAspectRatio="none"><path d="${perto}" fill="${mix(s[4], escuro ? 66 : 54, escuro ? "#000" : fundo)}"/></svg>` : ''}
    ${(ATOS[k] || [])[1] === 'sobe' ? '' : atoHtml(k)}
    <div class="cenaPart mov-${P[1]}">${[...Array(P[2])].map((_, i) => { const r = j => cenaRnd(k, i, j), t = Math.round(P[3] + r(0) * (P[4] - P[3]));
      return `<svg viewBox="0 0 20 20" fill="currentColor" style="left:${(r(1) * 100).toFixed(1)}%;top:${(r(2) * 100).toFixed(1)}%;width:${t}px;height:${t}px;color:${[c, c2, escuro ? '#fff' : s[4]][i % 3]};opacity:${(.35 + r(3) * .5).toFixed(2)};animation-duration:${(P[1] === 'chove' ? 1.1 + r(4) * 1.4 : P[1] === 'pisca' ? 1.8 + r(4) * 3.2 : 9 + r(4) * 14).toFixed(1)}s;animation-delay:-${(r(5) * 20).toFixed(1)}s;--dx:${Math.round(r(6) * 80 - 40)}px">${P[0]}</svg>`; }).join('')}</div><div class="cenaVeu"></div>`;
}
// ---------- Fundo do tema nos widgets (só no app instalado) ----------
// O widget não consegue desenhar a cena; então o app desenha uma versão parada dela (astro, horizonte e a figura do tema,
// sobre fundo transparente), transforma em imagem e entrega ao lado nativo (Android.widgetFundo), que a põe por trás
// dos números, bem suave. Só refaz quando o tema muda (WFUNDO_KEY guarda o último enviado).
const WFUNDO_KEY = 'financas-wfundo';
function cenaWidgetSvg(k){
  const s = SKINS[k], [hz, astro] = cenaDe(k), [longe, perto] = CENA_HORIZ[hz] || CENA_HORIZ.nenhum, ato = ATOS[k];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="400" viewBox="0 0 390 200">
    ${astro !== 'nenhum' && CENA_ASTRO[astro] ? `<g transform="translate(268,10) scale(.9)" opacity=".75">${CENA_ASTRO[astro]('#ffffff', s[3])}</g>` : ''}
    ${longe ? `<path transform="translate(0,80)" d="${longe}" fill="#000000" opacity=".16"/>` : ''}
    ${perto ? `<path transform="translate(0,80)" d="${perto}" fill="#000000" opacity=".28"/>` : ''}
    ${ato ? `<g transform="translate(206,104) scale(1.6)" opacity=".8">${ato[0]}</g>` : ''}</svg>`;
}
function widgetFundoEnviar(){
  if (!(window.Android && Android.widgetFundo) || window.TESTE) return;
  const k = db.prefs.skin && SKINS[db.prefs.skin] ? db.prefs.skin : '', marca = k + '|1';
  try { if (localStorage.getItem(WFUNDO_KEY) === marca) return; } catch(e){}
  const pronto = b64 => { Android.widgetFundo(b64, k); try { localStorage.setItem(WFUNDO_KEY, marca); } catch(e){} };
  if (!k) return pronto('');
  const img = new Image();
  img.onload = () => { try {
    const c = document.createElement('canvas'); c.width = 585; c.height = 300;
    c.getContext('2d').drawImage(img, 0, 0, 585, 300);
    pronto(c.toDataURL('image/png').split(',')[1]);
  } catch(e){ logErr('fundo do widget', e); } };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cenaWidgetSvg(k));
}
// Põe (ou tira) a cena do tema em uso; chamada por applyTheme.
function cenaAplicar(){
  const el = document.getElementById('cena'), k = db.prefs.skin || '';
  if (!el) return;
  if (el.dataset.k !== k){ el.dataset.k = k; el.innerHTML = k && SKINS[k] ? cenaHtml(k) : ''; }
  // Os primeiros temas (SKIN_ANTIGOS) já têm a sua troca de tela no app.css; os demais usam a escolhida em CENAS.
  document.documentElement.dataset.troca = k && !SKIN_ANTIGOS.includes(k) ? cenaDe(k)[4] : '';
  if (typeof logErr === 'function') widgetFundoEnviar(); // na primeira chamada (carga deste arquivo) config.js ainda não existe; inicio.js chama de novo
}
cenaAplicar(); // o tema já foi aplicado antes de este arquivo carregar
// A cena para quando o app sai da tela (não gasta bateria à toa) e volta a andar quando ele reaparece.
document.addEventListener('visibilitychange', () => { const el = document.getElementById('cena'); if (el) el.classList.toggle('parada', document.hidden); });

// ---------- Comemoração e novo gasto ----------
// Chuva de comemoração com as formas e as cores do tema (sem tema especial, o confete de sempre).
function festaTema(){
  const k = db.prefs.skin;
  if (!db.prefs.anim || !k || !SKINS[k]) return false;
  const s = SKINS[k], P = CENA_PART[cenaDe(k)[2]] || CENA_PART.estrelas, cores = [s[2], s[3], s[4], s[5], '#fbbf24', '#ffffff'], box = document.createElement('div');
  const fig = (ATOS[k] || [])[0]; // a figura do tema cai junto com as partículas dele
  box.className = 'confetti tema';
  box.innerHTML = [...Array(36)].map((_, i) => { const t = 12 + Math.round(Math.random() * 14);
    const fx = `left:${Math.random() * 100}%;animation-delay:${Math.random() * .35}s;animation-duration:${1.5 + Math.random() * 1.1}s;--r:${Math.round(Math.random() * 720 - 360)}deg;--x:${Math.round(Math.random() * 140 - 70)}px`;
    return fig && i % 3 === 0 ? `<svg viewBox="0 0 40 40" style="${fx};width:${t + 16}px;height:${t + 16}px">${fig}</svg>`
      : `<svg viewBox="0 0 20 20" fill="currentColor" style="${fx};width:${t}px;height:${t}px;color:${cores[i % cores.length]}">${P[0]}</svg>`; }).join('');
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
  return true;
}
// Novo gasto registrado: o valor sobe e some, e as formas do tema (ou moedas, sem tema especial) se espalham de onde
// estava o botão de salvar. O jeito de espalhar muda com a entrada do tema (explode, sobe em leque, gira…).
function gastoAnim(valor){
  if (!db.prefs.anim || window.TESTE) return;
  const k = db.prefs.skin, s = SKINS[k], P = (s && CENA_PART[cenaDe(k)[2]]) || CENA_PART.moedas, jeito = s ? cenaDe(k)[3] : 'cai';
  const cores = s ? [s[2], s[3], '#fff'] : ['#fbbf24', '#f59e0b', '#fde68a'], n = 12, box = document.createElement('div');
  box.className = 'gastoAnim j-' + jeito;
  const fig = s && (ATOS[k] || [])[0]; // no meio, a figura do tema dá um pulo e some
  box.innerHTML = `<b>− ${fmt(valor)}</b>` + (fig ? `<svg class="gastoFig" viewBox="0 0 40 40">${fig}</svg>` : '') + [...Array(n)].map((_, i) => { const a = (jeito === 'calma' || jeito === 'magia' ? -150 + i * 120 / (n - 1) : i * 360 / n) * Math.PI / 180, d = 70 + (i % 3) * 34, t = 12 + (i % 4) * 4;
    return `<svg viewBox="0 0 20 20" fill="currentColor" style="width:${t}px;height:${t}px;color:${cores[i % 3]};--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d)}px;animation-delay:${(i % 4) * 30}ms">${P[0]}</svg>`; }).join('');
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1500);
}
