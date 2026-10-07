// Cofrim — Temas especiais por categoria (os da versão 1.46 em diante).
// Carregado antes de dados.js: aqui ficam só dados. dados.js monta as cores completas de cada tema (SKINS) e
// config.js junta os mascotes (MASCOTES) e as falas (FUN_TEMA).
// Os temas são "inspirados em": os nomes são neutros (descrevem o assunto, sem citar nem imitar marcas) e os
// personagens são próprios, não os de filmes, desenhos ou jogos.

// [nome, escuro?, destaque, destaque 2, cartão de destaque 1 e 2, matiz, saturação]. Fundo, cartões, linhas e textos
// saem do matiz e da saturação, como nas cores comuns. Destaques: tons claros nos temas escuros e fortes nos claros;
// cartões de destaque: sempre tons fortes (o texto sobre eles é branco).
const TEMAS_NOVOS = {
  colegio:['Colégio rosa', false, '#be185d', '#9d174d', '#be185d', '#a21caf', 335, 80],
  fadas:['Clube das fadas', false, '#a21caf', '#0369a1', '#a21caf', '#6d28d9', 300, 75],
  supermeninas:['Super meninas', false, '#be123c', '#0369a1', '#be185d', '#0369a1', 340, 80],
  portal:['Ciência maluca', true, '#a3e635', '#22d3ee', '#14532d', '#155e75', 150, 60],
  botoes:['Botões', true, '#60a5fa', '#facc15', '#1e3a8a', '#312e81', 225, 50],
  pantano:['Ogro do pântano', false, '#3f6212', '#854d0e', '#3f6212', '#166534', 85, 50],
  jovens:['Jovens heróis', true, '#c084fc', '#4ade80', '#5b21b6', '#9f1239', 270, 60],
  morcego:['Morcego', true, '#facc15', '#e5e7eb', '#111827', '#334155', 220, 20],
  superheroi:['Super-herói', false, '#1d4ed8', '#b91c1c', '#1d4ed8', '#b91c1c', 220, 80],
  lanterna:['Lanterna', true, '#4ade80', '#86efac', '#14532d', '#166534', 140, 65],
  amazona:['Amazona', false, '#b91c1c', '#1e40af', '#b91c1c', '#a16207', 0, 70],
  armadura:['Armadura', true, '#fbbf24', '#f87171', '#991b1b', '#92400e', 5, 65],
  mercenario:['Mercenário', true, '#f87171', '#e5e7eb', '#991b1b', '#111827', 0, 60],
  gigante:['Gigante verde', true, '#4ade80', '#c084fc', '#166534', '#5b21b6', 130, 55],
  capitao:['Capitão', false, '#1e40af', '#b91c1c', '#1e3a8a', '#b91c1c', 220, 70],
  trovao:['Trovão', true, '#7dd3fc', '#fbbf24', '#334155', '#1e3a8a', 215, 40],
  aranha:['Aranha', false, '#b91c1c', '#1d4ed8', '#b91c1c', '#1e40af', 0, 75],
  relampago:['Relâmpago', true, '#facc15', '#f87171', '#991b1b', '#b45309', 5, 75],
  guardioes:['Guardiões do espaço', true, '#fb923c', '#c084fc', '#6b21a8', '#9a3412', 275, 55],
  simbionte:['Simbionte', true, '#e5e7eb', '#f87171', '#111827', '#1f2937', 240, 10],
  chamas:['Caveira em chamas', true, '#fb923c', '#fbbf24', '#9a3412', '#7f1d1d', 20, 75],
  mutantes:['Mutantes', true, '#facc15', '#60a5fa', '#1e3a8a', '#1d4ed8', 225, 65],
  quarteto:['Quarteto', false, '#0369a1', '#1e40af', '#0369a1', '#1e3a8a', 205, 80],
  magosupremo:['Mago supremo', true, '#fbbf24', '#f87171', '#7f1d1d', '#312e81', 350, 50],
  superfamilia:['Super família', true, '#f87171', '#fbbf24', '#b91c1c', '#111827', 0, 65],
  peixe:['Peixe-palhaço', false, '#c2410c', '#0369a1', '#c2410c', '#0369a1', 200, 80],
  trancas:['Torre e tranças', false, '#7e22ce', '#a16207', '#7e22ce', '#a16207', 280, 60],
  maca:['Maçã encantada', false, '#b91c1c', '#1e40af', '#b91c1c', '#1e3a8a', 355, 65],
  cristal:['Sapatinho de cristal', false, '#0369a1', '#6d28d9', '#0369a1', '#4338ca', 205, 75],
  maravilhas:['País das maravilhas', false, '#0e7490', '#b91c1c', '#0e7490', '#1d4ed8', 190, 60],
  adormecida:['Bela adormecida', false, '#be185d', '#1d4ed8', '#be185d', '#1d4ed8', 320, 65],
  sereia:['Sereia', true, '#2dd4bf', '#c084fc', '#115e59', '#6b21a8', 175, 60],
  fera:['A bela e a fera', true, '#fbbf24', '#f87171', '#1e3a8a', '#92400e', 225, 55],
  savana:['Savana', false, '#b45309', '#9a3412', '#b45309', '#9a3412', 30, 70],
  guerreira:['Guerreira', true, '#f87171', '#fbbf24', '#991b1b', '#14532d', 0, 55],
  arqueira:['Arqueira', true, '#fb923c', '#2dd4bf', '#115e59', '#1e3a8a', 185, 45],
  ilha:['Ilha', false, '#0f766e', '#c2410c', '#0f766e', '#0369a1', 180, 70],
  gelo:['Reino de gelo', false, '#0369a1', '#6d28d9', '#0369a1', '#0e7490', 200, 80],
  mel:['Pote de mel', false, '#a16207', '#b91c1c', '#a16207', '#b45309', 42, 85],
  brinquedos:['Brinquedos', false, '#1d4ed8', '#a16207', '#1d4ed8', '#b91c1c', 215, 80],
  lampada:['Lâmpada mágica', true, '#fbbf24', '#c084fc', '#5b21b6', '#1e3a8a', 265, 60],
  monstrinhos:['Monstrinhos', true, '#22d3ee', '#a3e635', '#155e75', '#6b21a8', 190, 60],
  jantar:['Jantar a dois', true, '#fca5a5', '#fbbf24', '#7f1d1d', '#44403c', 10, 40],
  nunca:['Terra do Nunca', true, '#4ade80', '#fbbf24', '#14532d', '#1e3a8a', 150, 50],
  planeta:['Planeta verde', true, '#fbbf24', '#4ade80', '#92400e', '#44403c', 35, 40],
  selva:['Rei da selva', false, '#166534', '#854d0e', '#166534', '#3f6212', 120, 55],
  ferias:['Férias de verão', false, '#c2410c', '#0f766e', '#c2410c', '#0f766e', 25, 85],
  chef:['Chef', false, '#b91c1c', '#44403c', '#9f1239', '#44403c', 15, 40],
  aloha:['Aloha', false, '#0369a1', '#be185d', '#0369a1', '#be185d', 200, 80],
  halloween:['Halloween', true, '#fb923c', '#c084fc', '#1f2937', '#5b21b6', 270, 35],
  noiva:['Noiva fantasma', true, '#7dd3fc', '#c084fc', '#1e3a8a', '#334155', 225, 45],
  sombria:['Fada sombria', true, '#a3e635', '#c084fc', '#111827', '#6b21a8', 280, 45],
  dalmatas:['Dálmatas', false, '#b91c1c', '#1f2937', '#1f2937', '#b91c1c', 0, 15],
  pomagico:['Pó mágico', false, '#15803d', '#a16207', '#15803d', '#a16207', 135, 60],
  supercao:['Super cão', false, '#0369a1', '#a16207', '#0369a1', '#1e3a8a', 210, 70],
  cacadores:['Caçadores', false, '#15803d', '#c2410c', '#15803d', '#0f766e', 140, 60],
  ninja:['Ninja', true, '#fb923c', '#60a5fa', '#c2410c', '#1e3a8a', 25, 75],
  espada:['Espada virtual', true, '#60a5fa', '#e5e7eb', '#111827', '#1e40af', 220, 45]
};
// Categorias dos temas especiais: [chave, nome, temas]. É a ordem em que aparecem em Configurações > Temas especiais.
const TEMA_CATS = [
  ['estilos', 'Estilos', ['hacker', 'boneca', 'neon', 'papel', 'praia', 'noite', 'espaco', 'floresta', 'retro']],
  ['corridas', 'Corridas', ['corrida', 'grandprix', 'rua', 'drift', 'fusca']],
  ['filmes', 'Filmes e jogos', ['bruxo', 'dragao', 'vikings', 'espartano', 'colegio']],
  ['desenhos', 'Desenhos animados', ['fadas', 'supermeninas', 'portal', 'botoes', 'pantano']],
  ['herois', 'Super-heróis', ['jovens', 'morcego', 'superheroi', 'lanterna', 'amazona', 'armadura', 'mercenario', 'gigante', 'capitao', 'trovao', 'aranha', 'relampago', 'guardioes', 'simbionte', 'chamas', 'mutantes', 'quarteto', 'magosupremo']],
  ['contos', 'Contos e animações', ['superfamilia', 'peixe', 'trancas', 'maca', 'cristal', 'maravilhas', 'adormecida', 'sereia', 'fera', 'savana', 'guerreira', 'arqueira', 'ilha', 'gelo', 'mel', 'brinquedos', 'lampada', 'monstrinhos', 'jantar', 'nunca', 'planeta', 'selva', 'ferias', 'chef', 'aloha', 'halloween', 'noiva', 'sombria', 'dalmatas', 'pomagico', 'supercao']],
  ['animes', 'Animes', ['cacadores', 'ninja', 'espada']]
];
const temaCat = k => (TEMA_CATS.find(c => c[2].includes(k)) || TEMA_CATS[0])[0];

// ---------- Mascotes ----------
// Peças prontas para montar os personagens (as medidas são as do desenho-base do mascote, 120 x 110).
const estrela = (x, y, s = 1, cor = '#fff', o = .6) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-5l1.500 3.400 3.700.400-2.800 2.500.800 3.700L0 3.200-3.200 5l.800-3.700-2.800-2.500 3.700-.400z" fill="${cor}" opacity="${o}"/>`;
const PECA = {
  pont:(c, d) => `<path d="M31 46 25 9l28 21zM89 46l6-37-28 21z" fill="${c}"/>` + (d ? `<path d="M34 37 31 19l15 11zM86 37l3-18-15 11z" fill="${d}"/>` : ''),
  red:(c, d, r = 13) => `<circle cx="28" cy="36" r="${r}" fill="${c}"/><circle cx="92" cy="36" r="${r}" fill="${c}"/>` + (d ? `<circle cx="28" cy="36" r="${r / 2}" fill="${d}"/><circle cx="92" cy="36" r="${r / 2}" fill="${d}"/>` : ''),
  caid:c => `<path d="M28 36c-18 4-22 40-12 62 12-6 16-30 16-50zM92 36c18 4 22 40 12 62-12-6-16-30-16-50z" fill="${c}"/>`,
  long:(c, d) => `<path d="M34 40C26 22 30 4 40 4s14 18 8 34zM86 40c8-18 4-36-6-36S66 22 72 38z" fill="${c}"/><path d="M38 34c-4-12-2-22 2-22s6 10 3 21zM82 34c4-12 2-22-2-22s-6 10-3 21z" fill="${d}"/>`,
  asas:c => `<path d="M24 62C6 52 2 30 7 20c8 9 18 14 27 24zM96 62c18-10 22-32 17-42-8 9-18 14-27 24z" fill="${c}"/>`,
  foc:(c, n = '#1c1917') => `<ellipse cx="60" cy="74" rx="17" ry="13" fill="${c}"/><ellipse cx="60" cy="67.500" rx="6.500" ry="4.500" fill="${n}"/><path d="M60 72v6" stroke="${n}" stroke-width="2"/>`,
  nar:(c, b = '#475569') => `<path d="M55.500 66h9l-4.500 5.500z" fill="${c}"/><path d="M41 68H25M41 73l-15 4M79 68h16M79 73l15 4" stroke="${b}" stroke-width="1.600" stroke-linecap="round"/>`,
  bico:c => `<path d="M51 63h18l-9 14z" fill="${c}"/>`,
  capa:c => `<path d="M26 66c-12 14-14 28-10 38h88c4-10 2-24-10-38z" fill="${c}"/>`,
  masc:c => `<path d="M26 50q34-12 68 0v10q-34 10-68 0z" fill="${c}"/>`,
  coroa:c => `<path d="M44 30l3-15 7 8 6-11 6 11 7-8 3 15z" fill="${c}"/>`,
  laco:(c, x = 60, y = 26) => `<path d="M${x} ${y}l-15-9v18zM${x} ${y}l15-9v18z" fill="${c}"/><circle cx="${x}" cy="${y}" r="4.500" fill="${c}"/>`,
  pes:c => `<rect x="38" y="88" width="14" height="14" rx="6" fill="${c}"/><rect x="68" y="88" width="14" height="14" rx="6" fill="${c}"/>`,
  olhao:(c, r = 12) => `<circle cx="43" cy="55" r="${r}" fill="${c}"/><circle cx="77" cy="55" r="${r}" fill="${c}"/>`
};
const SO = {semFenda:true, semRabo:true}, OBJ = {semFenda:true, semRabo:true, pes:' ', focinho:' '}; // bicho sem rabo de porco; objeto com rosto
// Mesmo formato de MASCOTES (js/config.js): [claro, médio, forte, fenda, bochecha, olhos, boca, partes].
const MASCOTES_NOVOS = {
  // Diário rosa com coração.
  colegio:['#fbcfe8', '#f472b6', '#db2777', '#9d174d', '#ff5f95', '#500724', '#9d174d', {...OBJ, orelhas:' ',
    cabeca:'<rect x="22" y="24" width="76" height="74" rx="10" fill="url(#pigG)"/><rect x="22" y="24" width="13" height="74" rx="5" fill="#9d174d"/><path d="M92 30h6v62h-6z" fill="#fff" opacity=".5"/>',
    sobre:'<path d="M66 34c-3-5-10-2-7 4l7 7 7-7c3-6-4-9-7-4z" fill="#fff"/>'}],
  // Fada-borboleta: asas coloridas e antenas.
  fadas:['#f5d0fe', '#e879f9', '#c026d3', '#86198f', '#f472b6', '#4a044e', '#86198f', {...SO, focinho:' ',
    orelhas:'<ellipse cx="18" cy="46" rx="18" ry="25" fill="#67e8f9" opacity=".85" transform="rotate(-20 18 46)"/><ellipse cx="102" cy="46" rx="18" ry="25" fill="#67e8f9" opacity=".85" transform="rotate(20 102 46)"/><ellipse cx="18" cy="84" rx="12" ry="15" fill="#fde047" opacity=".85"/><ellipse cx="102" cy="84" rx="12" ry="15" fill="#fde047" opacity=".85"/><path d="M52 32 44 12M68 32l8-20" stroke="#a21caf" stroke-width="2.500" stroke-linecap="round"/><circle cx="43" cy="10" r="3.500" fill="#fde047"/><circle cx="77" cy="10" r="3.500" fill="#fde047"/>',
    sobre:estrela(60, 36, 1.2, '#fff', .9)}],
  // Coração de olhos grandes, com laço.
  supermeninas:['#fda4af', '#fb7185', '#e11d48', '#9f1239', '#fff', '#881337', '#881337', {...OBJ, orelhas:' ',
    cabeca:'<path d="M60 100C18 76 10 50 22 34c10-13 30-10 38 5 8-15 28-18 38-5 12 16 4 42-38 66z" fill="url(#pigG)"/>',
    sob:PECA.olhao('#fff', 13), sobre:PECA.laco('#0ea5e9', 60, 30)}],
  // Frasco de laboratório borbulhando.
  portal:['#d9f99d', '#84cc16', '#65a30d', '#3f6212', '#bef264', '#1a2e05', '#365314', {...OBJ,
    orelhas:'<circle cx="52" cy="2" r="4" fill="#a3e635" opacity=".8"/><circle cx="68" cy="6" r="2.500" fill="#a3e635" opacity=".8"/>',
    cabeca:'<rect x="49" y="12" width="22" height="28" fill="#ecfccb"/><rect x="45" y="9" width="30" height="7" rx="3.500" fill="#ecfccb"/><circle cx="60" cy="65" r="36" fill="#ecfccb"/><path d="M26 58a34 36 0 1 0 68 0q-17 8-34 0t-34 0z" fill="url(#pigG)"/>',
    sob:'<circle cx="34" cy="80" r="3" fill="#ecfccb" opacity=".7"/><circle cx="86" cy="76" r="4" fill="#ecfccb" opacity=".7"/><circle cx="60" cy="94" r="2.500" fill="#ecfccb" opacity=".7"/>'}],
  // Botão azul de costura.
  botoes:['#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a', '#fda4af', '#0f172a', '#1e3a8a', {...OBJ, orelhas:' ',
    cabeca:'<circle cx="60" cy="60" r="41" fill="url(#pigG)"/><circle cx="60" cy="60" r="33" fill="none" stroke="#1e3a8a" stroke-width="3" opacity=".45"/>',
    sob:'<circle cx="53" cy="36" r="3.500" fill="#1e3a8a"/><circle cx="67" cy="36" r="3.500" fill="#1e3a8a"/><path d="M53 36 67 36" stroke="#facc15" stroke-width="2.500"/>',
    sobre:'<path d="M67 36c16-10 26-4 34-20" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>'}],
  // Ogro: orelhas de lado, presas e um tufo de cabelo.
  pantano:['#bef264', '#84cc16', '#65a30d', '#3f6212', '#fda4af', '#1a2e05', '#365314', {semFenda:true, semRabo:true,
    orelhas:'<path d="M26 58 2 46l24-6zM94 58l24-12-24-6z" fill="#65a30d"/>',
    focinho:'<ellipse cx="60" cy="69" rx="10" ry="6.500" fill="#4d7c0f"/>',
    sobre:'<path d="M47 85l-2-8M73 85l2-8" stroke="#fff" stroke-width="4.500" stroke-linecap="round"/><path d="M50 31c1-11 6-14 9-5 2-9 9-9 10 5z" fill="#3f2a14"/>'}],
  // Passarinho mascarado.
  jovens:['#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95', '#fca5a5', '#fff', '#1e1b4b', {...SO, pes:PECA.pes('#f59e0b'),
    orelhas:'<path d="M22 68C8 62 2 82 10 98c10-6 16-16 18-26zM98 68c14-6 20 14 12 30-10-6-16-16-18-26z" fill="#6d28d9"/><path d="M54 30c-2-12 4-18 8-20 0 8 2 14 4 20z" fill="#6d28d9"/>',
    sob:'<path d="M30 80q30 22 60 0-8 17-30 17T30 80z" fill="#ef4444"/>' + PECA.masc('#111827'), focinho:PECA.bico('#f59e0b')}],
  // Morcego: orelhas altas, asas e presas.
  morcego:['#6b7280', '#374151', '#1f2937', '#030712', '#facc15', '#fde047', '#d1d5db', {...SO,
    orelhas:PECA.asas('#374151') + '<path d="M34 42 29 4l22 24zM86 42l5-38-22 24z" fill="#1f2937"/>',
    focinho:'<path d="M55.500 66h9l-4.500 5.500z" fill="#030712"/>', sobre:'<path d="M53 86l2.500 6 2.500-6zM62 86l2.500 6 2.500-6z" fill="#fff"/>'}],
  // Herói de capa: rosto, topete e capa vermelha.
  superheroi:['#fde2c8', '#f5c6a0', '#e0a878', '#b45309', '#fb7185', '#1e293b', '#9a3412', {...SO, focinho:' ', pes:PECA.pes('#dc2626'),
    orelhas:PECA.capa('#dc2626'),
    sob:'<path d="M22 58a38 34 0 0 1 76 0c-8-12-20-17-32-17-4 6-12 9-20 8-10 0-18 3-24 9z" fill="#1e293b"/><path d="M62 40c8-3 12 2 9 8" stroke="#1e293b" stroke-width="4" fill="none" stroke-linecap="round"/>'}],
  // Lanterna acesa.
  lanterna:['#dcfce7', '#86efac', '#22c55e', '#166534', '#bbf7d0', '#052e16', '#166534', {...OBJ,
    orelhas:'<circle cx="60" cy="58" r="54" fill="#4ade80" opacity=".16"/><path d="M46 16a14 12 0 0 1 28 0" stroke="#166534" stroke-width="4" fill="none"/>',
    cabeca:'<rect x="42" y="14" width="36" height="12" rx="4" fill="#166534"/><rect x="26" y="24" width="68" height="66" rx="18" fill="url(#pigG)"/><rect x="34" y="88" width="52" height="11" rx="4" fill="#166534"/>',
    sob:'<path d="M38 26v62M82 26v62" stroke="#166534" stroke-width="2.500" opacity=".5"/>'}],
  // Escudo dourado com tiara e estrela.
  amazona:['#fde68a', '#fbbf24', '#d97706', '#92400e', '#fca5a5', '#451a03', '#92400e', {...OBJ, orelhas:' ',
    cabeca:'<circle cx="60" cy="62" r="40" fill="#b91c1c"/><circle cx="60" cy="62" r="34" fill="url(#pigG)"/>',
    sobre:'<path d="M26 44q34-18 68 0l-3 8q-31-15-62 0z" fill="#b91c1c"/>' + estrela(60, 36, 1.5, '#fde68a', 1)}],
  // Robô de armadura vermelha e dourada.
  armadura:['#f87171', '#dc2626', '#b91c1c', '#7f1d1d', '#fde68a', '#7f1d1d', '#7f1d1d', {...SO, focinho:' ', orelhas:' ',
    cabeca:'<path d="M24 42q36-26 72 0v32q-10 24-36 24T24 74z" fill="url(#pigG)"/>',
    sob:'<path d="M33 48q27-9 54 0v24q-8 18-27 18T33 72z" fill="#fbbf24"/><path d="M33 62h54" stroke="#d97706" stroke-width="1.500" opacity=".6"/>',
    sobre:'<circle cx="60" cy="34" r="4" fill="#bae6fd"/>'}],
  // Ninja vermelho com duas espadas nas costas.
  mercenario:['#f87171', '#dc2626', '#b91c1c', '#7f1d1d', '#fecaca', '#fff', '#450a0a', {...SO, focinho:' ',
    orelhas:'<path d="M20 10l7-3 62 82-6 4zM100 10l-7-3-62 82 6 4z" fill="#9ca3af"/><path d="M16 6l10 2-3 9zM104 6 94 8l3 9z" fill="#1f2937"/>',
    sob:'<path d="M23 50q37-10 74 0v12q-37 8-74 0z" fill="#111827"/>', sobre:'<path d="M96 54l15-7-3 10 6 7-14-2z" fill="#111827"/>'}],
  // Rinoceronte verde.
  gigante:['#86efac', '#22c55e', '#16a34a', '#14532d', '#fda4af', '#052e16', '#052e16', {semFenda:true,
    orelhas:'<ellipse cx="31" cy="32" rx="8" ry="12" fill="#16a34a" transform="rotate(-20 31 32)"/><ellipse cx="89" cy="32" rx="8" ry="12" fill="#16a34a" transform="rotate(20 89 32)"/>',
    focinho:'<ellipse cx="60" cy="78" rx="23" ry="14" fill="#15803d"/><path d="M52 72 60 42l8 30z" fill="#fef3c7"/><circle cx="49" cy="78" r="2" fill="#052e16"/><circle cx="71" cy="78" r="2" fill="#052e16"/>',
    sobre:'<path d="M32 44l14 5M88 44l-14 5" stroke="#052e16" stroke-width="3" stroke-linecap="round"/>'}],
  // Águia de cabeça branca com estrela.
  capitao:['#ffffff', '#e5e7eb', '#d1d5db', '#9ca3af', '#fecaca', '#1e293b', '#b45309', {...SO, pes:PECA.pes('#facc15'),
    orelhas:'<path d="M22 64C8 58 2 80 10 98c10-6 16-16 18-28zM98 64c14-6 20 16 12 34-10-6-16-16-18-28z" fill="#78350f"/><path d="M28 86q32 22 64 0v12q-32 10-64 0z" fill="#78350f"/>',
    focinho:PECA.bico('#facc15'), sobre:'<circle cx="60" cy="38" r="9" fill="#1e40af"/>' + estrela(60, 38, 1.2, '#fff', 1)}],
  // Martelo com asas e raio.
  trovao:['#e2e8f0', '#94a3b8', '#64748b', '#334155', '#bae6fd', '#0f172a', '#1e293b', {...OBJ,
    orelhas:'<path d="M20 44C4 36 2 18 8 8c8 8 16 14 20 26zM100 44c16-8 18-26 12-36-8 8-16 14-20 26z" fill="#fef3c7"/>',
    cabeca:'<rect x="18" y="28" width="84" height="66" rx="10" fill="url(#pigG)"/><rect x="18" y="28" width="84" height="9" rx="4" fill="#64748b"/><rect x="52" y="92" width="16" height="16" rx="4" fill="#92400e"/>',
    sobre:'<path d="M98 4l-10 14h8l-5 14 13-18h-8z" fill="#facc15"/>'}],
  // Aranha de olhos grandes.
  aranha:['#f87171', '#dc2626', '#b91c1c', '#7f1d1d', '#fecaca', '#0f172a', '#450a0a', {...OBJ,
    orelhas:'<path d="M26 52 4 38M24 62 0 60M26 72 4 86M32 84 14 102M94 52l22-14M96 62l24-2M94 72l22 14M88 84l18 18" stroke="#1e3a8a" stroke-width="4.500" stroke-linecap="round"/>',
    sob:'<ellipse cx="43" cy="55" rx="12" ry="13" fill="#fff"/><ellipse cx="77" cy="55" rx="12" ry="13" fill="#fff"/><path d="M60 28v13M47 31l5 11M73 31l-5 11" stroke="#7f1d1d" stroke-width="1.500"/>'}],
  // Guepardo com raio na testa.
  relampago:['#fde68a', '#fbbf24', '#f59e0b', '#b45309', '#fca5a5', '#1c1917', '#1c1917', {semFenda:true,
    orelhas:PECA.red('#f59e0b', '#fde68a', 11),
    sob:'<g fill="#92400e"><circle cx="38" cy="38" r="3"/><circle cx="82" cy="38" r="3"/><circle cx="28" cy="84" r="2.500"/><circle cx="92" cy="84" r="2.500"/><circle cx="34" cy="92" r="2"/><circle cx="86" cy="92" r="2"/></g><path d="M47 61q-2 11 3 19M73 61q2 11-3 19" stroke="#1c1917" stroke-width="2.500" fill="none"/>',
    focinho:PECA.foc('#fff7ed'), sobre:'<path d="M64 26l-10 13h7l-4 11 12-15h-7z" fill="#dc2626"/>'}],
  // Guaxinim.
  guardioes:['#d1d5db', '#9ca3af', '#6b7280', '#374151', '#fca5a5', '#fff', '#111827', {semFenda:true, semRabo:true,
    orelhas:PECA.pont('#6b7280', '#d1d5db') + '<path d="M96 78c14-4 20 6 16 16-8 4-16 0-18-8z" fill="#6b7280"/><path d="M104 78l4 16M110 82l-2 10" stroke="#1f2937" stroke-width="3"/>',
    sob:'<path d="M26 52q14-11 30 1 4 3 8 0 16-12 30-1-2 14-16 16-10 0-18-8-8 8-18 8-14-2-16-16z" fill="#1f2937"/>',
    focinho:PECA.foc('#f3f4f6')}],
  // Gosma preta de olhos brancos.
  simbionte:['#374151', '#111827', '#030712', '#000', '#f87171', '#111827', '#f87171', {...OBJ, semBrilho:true, orelhas:' ',
    cabeca:'<path d="M22 60c0-22 16-36 38-36s38 14 38 36c0 10-2 18-6 24v12c0 5-7 5-7 0v-5c-3 2-6 4-9 5v9c0 5-7 5-7 0v-7c-6 1-12 1-18 0v5c0 5-7 5-7 0v-8c-14-6-22-18-22-34z" fill="url(#pigG)"/>',
    sob:'<path d="M28 60c1-12 14-17 26-7-1 12-14 17-26 7zM92 60c-1-12-14-17-26-7 1 12 14 17 26 7z" fill="#fff"/>',
    sobre:'<path d="M46 80l3.500 5 3.500-5 3.500 5 3.500-5 3.500 5 3.500-5 3.500 5 3.500-5" stroke="#fff" stroke-width="1.800" fill="none"/>'}],
  // Caveira em chamas.
  chamas:['#fafaf9', '#e7e5e4', '#d6d3d1', '#a8a29e', '#fdba74', '#fb923c', '#44403c', {...OBJ,
    orelhas:'<path d="M22 54C10 32 24 22 26 6c10 8 13 17 13 24 4-9 4-18 2-27 15 9 21 22 19 33 4-7 6-13 6-20 13 11 15 24 13 33 6-5 9-11 9-18 11 13 9 29 2 37z" fill="#f97316"/><path d="M38 46c-5-11 4-18 6-26 8 8 9 15 9 22 4-5 6-11 6-16 8 9 9 18 7 24 4-2 7-7 8-11 5 9 3 16-2 20z" fill="#fde047"/>',
    cabeca:'<path d="M26 58c0-18 15-30 34-30s34 12 34 30c0 12-6 20-12 24v14H38V82c-6-4-12-12-12-24z" fill="url(#pigG)"/>',
    sob:'<ellipse cx="43" cy="55" rx="10.500" ry="11.500" fill="#1c1917"/><ellipse cx="77" cy="55" rx="10.500" ry="11.500" fill="#1c1917"/><path d="M56 73l4-8 4 8z" fill="#1c1917"/>',
    sobre:'<path d="M46 96v-7M53 96v-6M67 96v-6M74 96v-7" stroke="#a8a29e" stroke-width="1.800"/>'}],
  // Carcaju de garras.
  mutantes:['#a16207', '#854d0e', '#713f12', '#422006', '#fca5a5', '#1c1917', '#1c1917', {semFenda:true,
    orelhas:PECA.red('#422006', '#fde68a', 10),
    sob:'<path d="M37 31q9 20 4 44M83 31q-9 20-4 44" stroke="#fde68a" stroke-width="7" fill="none" opacity=".85"/>',
    focinho:PECA.foc('#fde68a'),
    sobre:'<path d="M16 98l5-18M24 102l4-19M32 104l3-18M104 98l-5-18M96 102l-4-19M88 104l-3-18" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/>'}],
  // Golem de pedra.
  quarteto:['#fdba74', '#fb923c', '#ea580c', '#9a3412', '#fed7aa', '#0c4a6e', '#7c2d12', {...SO, focinho:' ', semBrilho:true, orelhas:' ',
    cabeca:'<path d="M30 28h46l22 18v36l-14 16H34L22 82V44z" fill="url(#pigG)"/>',
    sob:'<path d="M40 28l7 14-9 10M82 33l-7 12 11 8M28 80l13-6 6 11M94 76l-13-2-4 13M58 28l3 10" stroke="#9a3412" stroke-width="2" fill="none"/><path d="M28 44h64v5H28z" fill="#c2410c"/>'}],
  // Amuleto dourado com um terceiro olho.
  magosupremo:['#fde68a', '#fbbf24', '#d97706', '#92400e', '#fca5a5', '#451a03', '#92400e', {...OBJ,
    orelhas:'<path d="M12 104c0-32 14-46 24-52l-4 48zM108 104c0-32-14-46-24-52l4 48z" fill="#b91c1c"/>',
    cabeca:'<circle cx="60" cy="60" r="41" fill="url(#pigG)"/><circle cx="60" cy="60" r="34" fill="none" stroke="#92400e" stroke-width="2.500"/>',
    sobre:'<path d="M47 36q13-11 26 0-13 11-26 0z" fill="#fff"/><circle cx="60" cy="36" r="4.500" fill="#16a34a"/>'}],
  // Pequeno herói de máscara e topete.
  superfamilia:['#fde2c8', '#f5c6a0', '#e0a878', '#b45309', '#fb7185', '#fff', '#9a3412', {...SO, focinho:' ', pes:PECA.pes('#111827'),
    orelhas:'<path d="M28 84q32 22 64 0v14q-32 10-64 0z" fill="#dc2626"/>',
    sob:PECA.masc('#111827'), sobre:'<path d="M38 32c6-16 32-18 46-2-10-3-17-1-21 3-8-5-17-4-25-1z" fill="#fbbf24"/>'}],
  // Peixe-palhaço.
  peixe:['#fdba74', '#fb923c', '#ea580c', '#9a3412', '#fed7aa', '#1c1917', '#7c2d12', {...OBJ,
    orelhas:'<path d="M92 62l26-20v40zM58 30c4-14 18-16 24-6-8 2-12 6-14 12z" fill="#ea580c"/><path d="M26 76 8 84l16 6z" fill="#ea580c"/>',
    sob:'<path d="M54 28q-9 34 0 68h9q-9-34 0-68zM86 37q-6 25 0 50l5-6q-4-19 0-38z" fill="#fff"/>'}],
  // Camaleão de crista e rabo enrolado.
  trancas:['#86efac', '#22c55e', '#16a34a', '#14532d', '#fda4af', '#052e16', '#14532d', {...SO, focinho:' ',
    orelhas:'<path d="M34 36c4-18 16-24 28-22 12 0 22 8 24 20-8-7-16-9-26-9s-20 4-26 11z" fill="#16a34a"/><path d="M96 74c16-2 20 12 10 16s-5 11 2 9" stroke="#22c55e" stroke-width="6" fill="none" stroke-linecap="round"/>',
    sob:PECA.olhao('#bbf7d0', 12.5),
    sobre:'<g fill="#c084fc"><circle cx="86" cy="26" r="4"/><circle cx="92" cy="30" r="4"/><circle cx="90" cy="37" r="4"/><circle cx="83" cy="36" r="4"/><circle cx="81" cy="30" r="4"/></g><circle cx="86.500" cy="32" r="2.500" fill="#fde047"/>'}],
  // Maçã vermelha.
  maca:['#fca5a5', '#ef4444', '#dc2626', '#991b1b', '#fecaca', '#450a0a', '#7f1d1d', {...OBJ,
    orelhas:'<path d="M60 36c0-10 2-17 6-21" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M66 20c8-11 21-9 25-2-8 9-19 8-25 2z" fill="#16a34a"/>',
    cabeca:'<path d="M60 34c-8-8-25-8-33 2-10 13-8 35 2 49 8 12 21 14 31 8 10 6 23 4 31-8 10-14 12-36 2-49-8-10-25-10-33-2z" fill="url(#pigG)"/>'}],
  // Estrela da varinha de condão.
  cristal:['#e0f2fe', '#7dd3fc', '#38bdf8', '#0369a1', '#f9a8d4', '#0c4a6e', '#0369a1', {...OBJ, semBrilho:true,
    orelhas:'<rect x="56" y="92" width="8" height="18" rx="3" fill="#a16207"/>' + estrela(18, 20, 1.3, '#fff', .9) + estrela(104, 72, 1, '#fff', .9),
    cabeca:'<path d="M60 12l14 30 32 4-23 23 6 33-29-12-29 12 6-33-23-23 32-4z" fill="url(#pigG)" stroke="#7dd3fc" stroke-width="8" stroke-linejoin="round"/>'}],
  // Coelho branco de gravata.
  maravilhas:['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#fda4af', '#1f2937', '#be185d', {semFenda:true, semRabo:true,
    orelhas:PECA.long('#f1f5f9', '#fbcfe8'), focinho:PECA.nar('#f472b6', '#94a3b8'),
    sobre:'<rect x="55.500" y="86" width="9" height="7.500" rx="1.500" fill="#fff" stroke="#cbd5e1"/><path d="M60 86v7.500" stroke="#cbd5e1"/>' + PECA.laco('#dc2626', 60, 100)}],
  // Rosa de coroa.
  adormecida:['#fbcfe8', '#f472b6', '#ec4899', '#be185d', '#fda4af', '#500724', '#9d174d', {...OBJ,
    orelhas:'<path d="M24 84c-15 0-19 10-17 19 12 2 19-6 21-15zM96 84c15 0 19 10 17 19-12 2-19-6-21-15z" fill="#16a34a"/>',
    cabeca:'<circle cx="60" cy="62" r="39" fill="url(#pigG)"/>',
    sob:'<path d="M32 42q28-24 56 0M27 68q5 27 33 31M93 68q-5 27-33 31" stroke="#be185d" stroke-width="2.500" fill="none" opacity=".55"/>',
    sobre:PECA.coroa('#fbbf24')}],
  // Concha com pérola e estrela-do-mar.
  sereia:['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce', '#f9a8d4', '#3b0764', '#7e22ce', {...OBJ, orelhas:' ',
    cabeca:'<path d="M60 98C30 98 13 75 15 52 17 34 34 22 60 22s43 12 45 30c2 23-15 46-45 46z" fill="url(#pigG)"/>',
    sob:'<path d="M60 98V24M60 98 35 30M60 98l25-68M60 98 20 46M60 98l40-52" stroke="#a855f7" stroke-width="1.800" opacity=".4"/>',
    sobre:'<circle cx="60" cy="100" r="7" fill="#fff"/>' + estrela(86, 30, 1.6, '#fb7185', 1)}],
  // Fera de chifres enrolados e juba.
  fera:['#b08968', '#8a5a3c', '#6f4528', '#4a2c17', '#e6b8a2', '#1e3a8a', '#2b1d12', {semFenda:true,
    orelhas:'<path d="M22 60c-7 14-3 31 8 39l4-21zM98 60c7 14 3 31-8 39l-4-21z" fill="#4a2c17"/><path d="M33 40c-17-5-26 8-21 21 6-2 9-8 7-13 6 2 13 0 17-4zM87 40c17-5 26 8 21 21-6-2-9-8-7-13-6 2-13 0-17-4z" fill="#a8a29e"/>',
    focinho:PECA.foc('#d6b08a'),
    sobre:'<path d="M50 85l2-7M70 85l-2-7" stroke="#fff" stroke-width="3.500" stroke-linecap="round"/>' + PECA.laco('#1d4ed8', 60, 100)}],
  // Suricato.
  savana:['#fde6b8', '#e9c27a', '#d4a24e', '#92400e', '#fca5a5', '#fef3c7', '#451a03', {semFenda:true,
    orelhas:'<ellipse cx="27" cy="46" rx="8" ry="10" fill="#78350f"/><ellipse cx="93" cy="46" rx="8" ry="10" fill="#78350f"/>',
    cabeca:'<ellipse cx="60" cy="60" rx="34" ry="38" fill="url(#pigG)"/>',
    sob:'<ellipse cx="43" cy="55" rx="10.500" ry="8.500" fill="#78350f"/><ellipse cx="77" cy="55" rx="10.500" ry="8.500" fill="#78350f"/>',
    focinho:'<ellipse cx="60" cy="73" rx="11" ry="9" fill="#fef3c7"/><ellipse cx="60" cy="68" rx="4.500" ry="3.200" fill="#1c1917"/>'}],
  // Dragão vermelho do oriente, de bigodes dourados.
  guerreira:['#f87171', '#dc2626', '#b91c1c', '#7f1d1d', '#fde68a', '#1c1917', '#450a0a', {semFenda:true,
    orelhas:'<path d="M40 32 33 8M35 20l-9-4M80 32l7-24M85 20l9-4" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>',
    sob:'<path d="M44 31l7-11 9 9 9-9 7 11z" fill="#fbbf24"/>',
    focinho:'<ellipse cx="60" cy="72" rx="16" ry="10" fill="#fca5a5"/><circle cx="54" cy="70" r="2" fill="#7f1d1d"/><circle cx="66" cy="70" r="2" fill="#7f1d1d"/><path d="M44 72C30 70 21 78 12 92M76 72c14-2 23 6 32 20" stroke="#fbbf24" stroke-width="2.500" fill="none" stroke-linecap="round"/>'}],
  // Arqueira de cachos ruivos.
  arqueira:['#fde2c8', '#f5c6a0', '#e0a878', '#b45309', '#fb7185', '#134e4a', '#9a3412', {...SO, pes:PECA.pes('#0f766e'),
    orelhas:'<g fill="#ea580c"><circle cx="24" cy="44" r="17"/><circle cx="17" cy="68" r="16"/><circle cx="25" cy="92" r="14"/><circle cx="96" cy="44" r="17"/><circle cx="103" cy="68" r="16"/><circle cx="95" cy="92" r="14"/><circle cx="43" cy="26" r="17"/><circle cx="77" cy="26" r="17"/><circle cx="60" cy="21" r="15"/></g>',
    sob:'<path d="M24 50c8-17 27-23 36-23s28 6 36 23c-12-9-23-11-36-11s-24 2-36 11z" fill="#f97316"/>',
    focinho:'<g fill="#c2410c" opacity=".6"><circle cx="49" cy="67" r="1.100"/><circle cx="53" cy="70" r="1.100"/><circle cx="67" cy="70" r="1.100"/><circle cx="71" cy="67" r="1.100"/></g>'}],
  // Tartaruga marinha com flor.
  ilha:['#a7f3d0', '#6ee7b7', '#34d399', '#047857', '#fda4af', '#064e3b', '#065f46', {...SO, focinho:' ',
    orelhas:'<ellipse cx="60" cy="76" rx="50" ry="30" fill="#0f766e"/><path d="M22 66l14 12M98 66 84 78M40 100l6-12M80 100l-6-12" stroke="#134e4a" stroke-width="3"/>',
    cabeca:'<ellipse cx="60" cy="58" rx="31" ry="32" fill="url(#pigG)"/>',
    pes:'<ellipse cx="18" cy="96" rx="13" ry="6" fill="#34d399" transform="rotate(-25 18 96)"/><ellipse cx="102" cy="96" rx="13" ry="6" fill="#34d399" transform="rotate(25 102 96)"/>',
    sobre:'<g fill="#fb7185"><circle cx="82" cy="28" r="4"/><circle cx="88" cy="32" r="4"/><circle cx="86" cy="39" r="4"/><circle cx="79" cy="38" r="4"/><circle cx="77" cy="32" r="4"/></g><circle cx="82.500" cy="34" r="2.500" fill="#fde047"/>'}],
  // Boneco de neve de cartola e cachecol.
  gelo:['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#fda4af', '#0f172a', '#0f172a', {...OBJ,
    orelhas:'<path d="M24 72 2 56M9 61l-2-9M96 72l22-16M111 61l2-9" stroke="#78350f" stroke-width="3.500" stroke-linecap="round"/>',
    sob:'<path d="M29 88q31 13 62 0l2 9q-33 12-66 0z" fill="#0ea5e9"/>',
    focinho:'<path d="M58 63l24 7-24 5z" fill="#f97316"/>',
    sobre:'<rect x="42" y="4" width="36" height="25" rx="3" fill="#1e293b"/><rect x="31" y="26" width="58" height="7" rx="3.500" fill="#1e293b"/><rect x="42" y="20" width="36" height="5" fill="#dc2626"/>'}],
  // Abelha.
  mel:['#fef08a', '#facc15', '#eab308', '#a16207', '#fca5a5', '#1c1917', '#713f12', {...OBJ,
    orelhas:'<ellipse cx="20" cy="40" rx="17" ry="23" fill="#e0f2fe" opacity=".9" transform="rotate(-30 20 40)"/><ellipse cx="100" cy="40" rx="17" ry="23" fill="#e0f2fe" opacity=".9" transform="rotate(30 100 40)"/><path d="M50 31 43 12M70 31l7-19" stroke="#1c1917" stroke-width="2.500" stroke-linecap="round"/><circle cx="42" cy="10" r="3.500" fill="#1c1917"/><circle cx="78" cy="10" r="3.500" fill="#1c1917"/>',
    sob:'<path d="M30 42q30-13 60 0l3 7q-33-13-66 0zM36 90q24 8 48 0l-7 5q-17 4-34 0z" fill="#1c1917"/>'}],
  // Dinossauro de brinquedo.
  brinquedos:['#d8b4fe', '#a855f7', '#7e22ce', '#581c87', '#fda4af', '#2e1065', '#3b0764', {semFenda:true,
    orelhas:'<path d="M38 32l7-13 7 10 8-13 8 13 7-10 7 13z" fill="#581c87"/><path d="M26 82l-9 6M94 82l9 6" stroke="#7e22ce" stroke-width="5.500" stroke-linecap="round"/>',
    focinho:'<ellipse cx="60" cy="77" rx="25" ry="14" fill="#e9d5ff"/><circle cx="52" cy="71" r="2" fill="#581c87"/><circle cx="68" cy="71" r="2" fill="#581c87"/>',
    sobre:'<path d="M42 87l3 5 3-5zM72 87l3 5 3-5z" fill="#fff"/>'}],
  // Gênio azul saindo da lâmpada.
  lampada:['#93c5fd', '#3b82f6', '#2563eb', '#1e3a8a', '#c4b5fd', '#0f172a', '#1e3a8a', {...SO, focinho:' ',
    orelhas:'<path d="M60 30c-7-10 2-20 0-29 11 7 11 19 5 29z" fill="#1e3a8a"/><path d="M24 56 8 47l16-5zM96 56l16-9-16-5z" fill="#3b82f6"/><circle cx="12" cy="56" r="4.500" fill="none" stroke="#fbbf24" stroke-width="2.500"/><circle cx="108" cy="56" r="4.500" fill="none" stroke="#fbbf24" stroke-width="2.500"/>',
    pes:'<path d="M40 90q20 6 40 0-6 9-14 11 5 2 2 7-16-1-28-18z" fill="#3b82f6"/>',
    sobre:'<rect x="53" y="26" width="14" height="6" rx="3" fill="#fbbf24"/><path d="M54 92q6 11 12 0z" fill="#1e3a8a"/>'}],
  // Monstrinho peludo de chifres.
  monstrinhos:['#f0abfc', '#d946ef', '#c026d3', '#86198f', '#fde68a', '#3b0764', '#701a75', {semFenda:true, semRabo:true, focinho:' ',
    orelhas:'<path d="M20 70l-11-3 9-6-9-7 11-2-6-10 11 2-3-11 10 5 1-11 9 8 4-11 7 9 7-9 4 11 9-8 1 11 10-5-3 11 11-2-6 10 11 2-9 7 9 6-11 3z" fill="#c026d3"/><path d="M38 30c-5-11-3-20 4-24 2 9 5 15 9 20zM82 30c5-11 3-20-4-24-2 9-5 15-9 20z" fill="#fef3c7"/>',
    sob:'<g fill="#fde047" opacity=".8"><circle cx="33" cy="82" r="4"/><circle cx="88" cy="84" r="5"/><circle cx="60" cy="35" r="3.500"/><circle cx="84" cy="40" r="2.500"/></g>',
    sobre:'<path d="M55 87l3.500 7 3.500-7z" fill="#fff"/>'}],
  // Cachorrinha de orelhas compridas.
  jantar:['#fcd9a8', '#e8a860', '#d08a3c', '#92400e', '#fca5a5', '#1c1917', '#451a03', {semFenda:true,
    orelhas:PECA.caid('#92400e'), focinho:PECA.foc('#fff3e0'), sobre:PECA.laco('#dc2626', 60, 100)}],
  // Crocodilo que engoliu um relógio.
  nunca:['#5eead4', '#14b8a6', '#0d9488', '#134e4a', '#fda4af', '#042f2e', '#134e4a', {semFenda:true, semRabo:true,
    orelhas:'<path d="M34 34l7-11 6 8 7-11 6 11 6-11 7 11 6-8 7 11z" fill="#0f766e"/>',
    focinho:'<rect x="32" y="66" width="56" height="26" rx="13" fill="#99f6e4"/><circle cx="46" cy="71" r="2" fill="#134e4a"/><circle cx="74" cy="71" r="2" fill="#134e4a"/>',
    sobre:'<path d="M38 88l3 5 3-5zM48 90l3 5 3-5zM66 90l3 5 3-5zM76 88l3 5 3-5z" fill="#fff"/><circle cx="98" cy="92" r="9" fill="#fef3c7" stroke="#92400e" stroke-width="2"/><path d="M98 87v5l3.500 2" stroke="#1f2937" stroke-width="1.500" fill="none"/>'}],
  // Broto nascendo num vaso.
  planeta:['#fdba74', '#ea580c', '#c2410c', '#7c2d12', '#fed7aa', '#1c1917', '#7c2d12', {...OBJ,
    orelhas:'<path d="M60 38V14" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/><path d="M60 24c-10-13-23-9-25 0 8 9 19 7 25 0zM60 17c8-13 23-11 27-2-8 9-21 8-27 2z" fill="#22c55e"/>',
    cabeca:'<path d="M28 42h64l-8 56H36z" fill="url(#pigG)"/><rect x="23" y="34" width="74" height="13" rx="4" fill="#9a3412"/>'}],
  // Macaco.
  selva:['#a16207', '#854d0e', '#713f12', '#451a03', '#fca5a5', '#1c1917', '#451a03', {semFenda:true,
    orelhas:'<circle cx="19" cy="58" r="14" fill="#713f12"/><circle cx="101" cy="58" r="14" fill="#713f12"/><circle cx="19" cy="58" r="7.500" fill="#fcd9a8"/><circle cx="101" cy="58" r="7.500" fill="#fcd9a8"/>',
    sob:'<path d="M60 44c-8-11-29-7-29 12 0 8 4 12 8 16-4 13 6 23 21 23s25-10 21-23c4-4 8-8 8-16 0-19-21-23-29-12z" fill="#fcd9a8"/>',
    focinho:'<circle cx="56" cy="70" r="1.700" fill="#451a03"/><circle cx="64" cy="70" r="1.700" fill="#451a03"/>',
    sobre:'<path d="M54 30c0-8 3-12 6-14 3 2 6 6 6 14z" fill="#451a03"/>'}],
  // Ornitorrinco de férias.
  ferias:['#5eead4', '#2dd4bf', '#14b8a6', '#0f766e', '#fda4af', '#134e4a', '#7c2d12', {...SO, pes:PECA.pes('#f97316'),
    orelhas:'<ellipse cx="104" cy="88" rx="14" ry="8" fill="#b45309" transform="rotate(-30 104 88)"/>',
    focinho:'<ellipse cx="60" cy="76" rx="26" ry="11" fill="#f97316"/><circle cx="53" cy="72" r="1.700" fill="#7c2d12"/><circle cx="67" cy="72" r="1.700" fill="#7c2d12"/>',
    sobre:'<ellipse cx="60" cy="33" rx="24" ry="5.500" fill="#eab308"/><path d="M46 33c0-11 6-15 14-15s14 4 14 15z" fill="#facc15"/><path d="M46.500 30h27" stroke="#dc2626" stroke-width="3"/>'}],
  // Ratinho cozinheiro.
  chef:['#cbd5e1', '#94a3b8', '#64748b', '#334155', '#fda4af', '#0f172a', '#334155', {semFenda:true,
    orelhas:PECA.red('#64748b', '#fbcfe8', 16), focinho:PECA.nar('#f472b6', '#334155'),
    sobre:'<path d="M38 33c-11-2-13-17-2-21 2-11 17-13 24-6 7-7 22-5 24 6 11 4 9 19-2 21z" fill="#fff"/><rect x="38" y="30" width="44" height="9" rx="2" fill="#f1f5f9" stroke="#cbd5e1"/>'}],
  // Abacaxi com flor.
  aloha:['#fef08a', '#fbbf24', '#f59e0b', '#b45309', '#fda4af', '#1c1917', '#78350f', {...OBJ,
    orelhas:'<path d="M60 36 43 4l13 13 4-17 4 17L77 4z" fill="#16a34a"/><path d="M60 36 32 16l19 7zM60 36l28-20-19 7z" fill="#22c55e"/>',
    cabeca:'<ellipse cx="60" cy="66" rx="35" ry="37" fill="url(#pigG)"/>',
    sob:'<path d="M32 50l42 46M48 34l42 46M72 32 30 80M90 46 46 100" stroke="#b45309" stroke-width="1.500" opacity=".4"/>',
    sobre:'<g fill="#f43f5e"><circle cx="88" cy="40" r="4"/><circle cx="94" cy="44" r="4"/><circle cx="92" cy="51" r="4"/><circle cx="85" cy="50" r="4"/><circle cx="83" cy="44" r="4"/></g><circle cx="88.500" cy="46" r="2.500" fill="#fde047"/>'}],
  // Abóbora de lanterna.
  halloween:['#fdba74', '#f97316', '#ea580c', '#9a3412', '#fed7aa', '#fde047', '#431407', {...OBJ, semBrilho:true,
    orelhas:'<path d="M55 33c0-11 2-17 9-22l7 5c-5 4-7 10-7 17z" fill="#3f6212"/>',
    cabeca:'<ellipse cx="60" cy="64" rx="41" ry="34" fill="url(#pigG)"/>',
    sob:'<path d="M60 30q-15 34 0 68M60 30q15 34 0 68M39 36q-17 28 0 56M81 36q17 28 0 56" stroke="#c2410c" stroke-width="2" fill="none" opacity=".55"/><path d="M31 63l12-19 12 19zM65 63l12-19 12 19z" fill="#431407"/>'}],
  // Fantasminha de véu e flores.
  noiva:['#eff6ff', '#bfdbfe', '#93c5fd', '#3b82f6', '#c4b5fd', '#1e1b4b', '#312e81', {...OBJ,
    orelhas:'<path d="M14 106c-6-42 8-80 46-88 38 8 52 46 46 88z" fill="#e0e7ff" opacity=".4"/>',
    cabeca:'<path d="M24 60c0-22 15-36 36-36s36 14 36 36v42l-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7z" fill="url(#pigG)"/>',
    sobre:'<g fill="#60a5fa"><circle cx="38" cy="32" r="5.500"/><circle cx="52" cy="25" r="5.500"/><circle cx="68" cy="25" r="5.500"/><circle cx="82" cy="32" r="5.500"/></g><g fill="#fff"><circle cx="38" cy="32" r="2"/><circle cx="52" cy="25" r="2"/><circle cx="68" cy="25" r="2"/><circle cx="82" cy="32" r="2"/></g>'}],
  // Corvo de olhos verdes.
  sombria:['#52525b', '#27272a', '#18181b', '#09090b', '#a3e635', '#a3e635', '#a1a1aa', {...SO, pes:PECA.pes('#52525b'),
    orelhas:'<path d="M22 66C7 60 0 82 9 100c11-6 17-17 19-29zM98 66c15-6 22 16 13 34-11-6-17-17-19-29z" fill="#18181b"/><path d="M48 31l-5-18 11 11 6-16 6 16 11-11-5 18z" fill="#18181b"/>',
    focinho:PECA.bico('#71717a')}],
  // Filhote de dálmata.
  dalmatas:['#ffffff', '#f1f5f9', '#e2e8f0', '#94a3b8', '#fda4af', '#1c1917', '#1c1917', {semFenda:true,
    orelhas:PECA.caid('#1c1917'),
    sob:'<g fill="#1c1917"><circle cx="38" cy="36" r="4.500"/><circle cx="76" cy="34" r="3.500"/><circle cx="90" cy="62" r="3"/><circle cx="30" cy="76" r="3.500"/><circle cx="86" cy="84" r="4"/><circle cx="58" cy="32" r="2.500"/></g>',
    focinho:PECA.foc('#fff'),
    sobre:'<path d="M33 92q27 11 54 0l1 7q-28 10-56 0z" fill="#dc2626"/><circle cx="60" cy="101" r="4.500" fill="#fbbf24"/>'}],
  // Sininho de asas.
  pomagico:['#fef9c3', '#fde047', '#eab308', '#a16207', '#fca5a5', '#422006', '#854d0e', {...OBJ,
    orelhas:'<ellipse cx="14" cy="50" rx="16" ry="25" fill="#d9f99d" opacity=".85" transform="rotate(-25 14 50)"/><ellipse cx="106" cy="50" rx="16" ry="25" fill="#d9f99d" opacity=".85" transform="rotate(25 106 50)"/><circle cx="60" cy="16" r="6.500" fill="#ca8a04"/>',
    cabeca:'<path d="M60 20c-21 0-33 14-33 35v22l-9 14h84l-9-14V55c0-21-12-35-33-35z" fill="url(#pigG)"/>',
    pes:'<circle cx="60" cy="98" r="7.500" fill="#ca8a04"/>',
    sobre:estrela(98, 16, 1.2, '#fde047', 1) + estrela(20, 14, .9, '#fde047', 1)}],
  // Cachorro herói de capa.
  supercao:['#fef3c7', '#fde68a', '#fcd34d', '#b45309', '#fca5a5', '#1c1917', '#451a03', {semFenda:true,
    orelhas:PECA.capa('#dc2626') + PECA.pont('#fcd34d', '#fff7ed'), focinho:PECA.foc('#fff'),
    sobre:'<path d="M33 92q27 11 54 0l1 7q-28 10-56 0z" fill="#0369a1"/>' + estrela(60, 101, 1.1, '#fde047', 1)}],
  // Besouro verde de chifres.
  cacadores:['#6ee7b7', '#10b981', '#059669', '#064e3b', '#fca5a5', '#022c22', '#064e3b', {...OBJ,
    orelhas:'<path d="M60 32c-2-13-11-20-20-22 2 9 7 15 13 22zM60 32c2-13 11-20 20-22-2 9-7 15-13 22z" fill="#064e3b"/><path d="M24 58 4 50M23 74 3 84M96 58l20-8M97 74l20 10M34 90l-10 14M86 90l10 14" stroke="#064e3b" stroke-width="4" stroke-linecap="round"/>',
    sob:'<path d="M60 30v68" stroke="#064e3b" stroke-width="2" opacity=".45"/>'}],
  // Tigela de lámen.
  ninja:['#fdba74', '#f97316', '#ea580c', '#9a3412', '#fed7aa', '#1c1917', '#7c2d12', {...OBJ, semBrilho:true,
    orelhas:'<path d="M18 10l48 32M28 4l44 36" stroke="#92400e" stroke-width="3" stroke-linecap="round"/><path d="M24 42c4-15 13-15 17 0M45 42c4-19 15-19 19 0M67 42c4-13 11-13 15 0" stroke="#fde68a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="92" cy="32" r="10.500" fill="#fff"/><path d="M92 32c0-5 6-4 5 1s-9 5-9-1 8-9 12-3" stroke="#f472b6" stroke-width="2" fill="none"/>',
    cabeca:'<path d="M15 46h90c0 31-19 53-45 53S15 77 15 46z" fill="url(#pigG)"/><rect x="11" y="40" width="98" height="10" rx="5" fill="#fff"/>',
    pes:'<rect x="44" y="97" width="32" height="7" rx="3" fill="#9a3412"/>'}],
  // Cristal azul.
  espada:['#a5f3fc', '#22d3ee', '#0891b2', '#155e75', '#f9a8d4', '#083344', '#155e75', {...OBJ, semBrilho:true,
    orelhas:estrela(20, 24, 1.1, '#fff', .9) + estrela(102, 86, .9, '#fff', .9),
    cabeca:'<path d="M60 8 100 48 60 106 20 48z" fill="url(#pigG)"/>',
    sob:'<path d="M20 48h80M60 8 43 48l17 58 17-58z" stroke="#fff" stroke-width="1.500" fill="none" opacity=".5"/>'}]
};

// ---------- Falas ----------
// Falas dos mascotes novos. As da categoria (FALAS_CAT) só valem para um tema que ainda não tenha as suas em FALAS_MAIS
// (js/temas2.js); hoje todos têm, então o mascote só diz frases do próprio tema. {v} = saldo do mês; {nome} = a pessoa.
const FALAS_CAT = {
  filmes:{feliz:['Final feliz: sobrou {v}, {nome}!', 'Esse mês merece continuação.', 'Sucesso de bilheteria: {v} no azul.', 'Cena pós-créditos: ainda tem {v} na conta.', 'Roteiro perfeito este mês, {nome}.'],
    ok:['O enredo segue equilibrado, {nome}.', 'Nem drama, nem comédia: tudo no eixo.', 'Próxima cena: anotar os gastos de hoje.', 'Suspense leve nas contas. Sigo de olho.', 'Meio do filme, tudo sob controle.'],
    triste:['Reviravolta: faltam {v}, {nome}.', 'Drama nas contas: {v} no vermelho.', 'Esse capítulo pede um corte de gastos.', 'Calma, todo herói passa pelo segundo ato.', 'Hora de reescrever o roteiro do mês.']},
  desenhos:{feliz:['Episódio feliz: sobrou {v}!', 'Hoje o desenho termina bem, {nome}.', '{v} de sobra. Dá até pra repetir o episódio.', 'Mês colorido: tudo no azul.', 'Aplausos da plateia: {v} guardados!'],
    ok:['Episódio tranquilo por aqui, {nome}.', 'Nada de vilão nas contas hoje.', 'Anotou os gastos? O próximo episódio agradece.', 'Tudo em ordem no nosso desenho.', 'Mês equilibrado, sem sustos.'],
    triste:['Ops! Faltam {v} neste episódio.', 'O vilão do mês foi o cartão, {nome}.', 'Plano novo: gastar menos até o fim do mês.', 'Faltam {v}. Mas todo desenho tem volta por cima.', 'Hora de rever os gastos, {nome}.']},
  herois:{feliz:['Missão cumprida: {v} salvos, {nome}!', 'Hoje o herói é você: sobrou {v}.', 'Vilão das dívidas derrotado!', 'Grande saldo, grandes planos.', 'A cidade está segura e a carteira também: {v}.'],
    ok:['Tudo calmo na cidade, {nome}.', 'Patrulhando os gastos. Nada suspeito.', 'Equilíbrio é o melhor superpoder.', 'Sem alerta por enquanto. Sigo de guarda.', 'Registrou os gastos de hoje, {nome}?'],
    triste:['Alerta: {v} no vermelho, {nome}!', 'O vilão do mês atacou a carteira.', 'Precisamos de um plano: cortar gastos.', 'Até herói apanha. Faltam {v}, mas a gente vira.', 'Chamando reforços para segurar o cartão.']},
  contos:{feliz:['E viveram felizes: sobrou {v}!', 'Era uma vez um mês no azul, {nome}.', 'Que magia: {v} de sobra!', 'Seu conto deste mês tem final feliz.', 'O tesouro cresceu: {v} guardados.'],
    ok:['O conto segue tranquilo, {nome}.', 'Nem feitiço, nem susto: tudo em ordem.', 'Anote os gastos antes da meia-noite.', 'Capítulo calmo no nosso reino.', 'Tudo no lugar por aqui, {nome}.'],
    triste:['O feitiço virou: faltam {v}, {nome}.', 'Capítulo difícil: {v} no vermelho.', 'Toda história tem um aperto antes do final feliz.', 'Hora de quebrar o feitiço dos gastos.', 'Faltam {v}. Vamos virar essa página.']},
  animes:{feliz:['Nível acima! Sobrou {v}, {nome}.', 'Treino concluído: mês no azul.', 'Poder de economia: {v}!', 'Arco encerrado com vitória.', 'Você ficou mais forte: {v} guardados.'],
    ok:['Treino do dia: anotar os gastos, {nome}.', 'Energia estável. Seguimos.', 'Nem vitória, nem derrota: empate técnico.', 'Concentração. O mês ainda não acabou.', 'Tudo sob controle nesta fase.'],
    triste:['Derrota neste round: faltam {v}.', 'Chefão difícil este mês, {nome}.', 'Hora de treinar a economia.', 'Faltam {v}. Nunca desista, {nome}!', 'Recuar, poupar e voltar mais forte.']}
};
// Uma fala própria por tema e humor: [feliz, ok, triste].
const FALAS_TEMA = {
  colegio:['Mês cor-de-rosa: sobrou {v}.', 'Anotado no diário: mês em ordem.', 'Isso não é nada legal: faltam {v}.'],
  fadas:['Pó de fada na carteira: {v}!', 'Asas leves, contas em dia.', 'Faltou brilho: {v} no vermelho.'],
  supermeninas:['Docinho de mês: {v} de sobra!', 'Dia tranquilo na cidade.', 'Dia de vilão: faltam {v}.'],
  portal:['Experimento aprovado: {v} de folga!', 'Fórmula estável por enquanto.', 'Explodiu o laboratório: faltam {v}.'],
  botoes:['Tudo bem costurado: sobrou {v}.', 'Ponto por ponto, o mês segue.', 'Soltou um botão: faltam {v}.'],
  pantano:['Pântano em paz e {v} no bolso.', 'Lama boa, contas boas.', 'Invadiram meu pântano: faltam {v}.'],
  jovens:['Equipe, vencemos: {v} a mais na conta!', 'Torre em silêncio. Tudo certo.', 'Equipe, reunir: faltam {v}.'],
  morcego:['A noite é nossa: {v} guardados.', 'Vigiando as contas lá do alto.', 'Sinal no céu: faltam {v}.'],
  superheroi:['Voando alto: {v}!', 'Tudo calmo visto lá de cima.', 'Minha fraqueza é o cartão: faltam {v}.'],
  lanterna:['Luz acesa e {v} poupados.', 'Força de vontade em dia.', 'A luz enfraqueceu: faltam {v}.'],
  amazona:['Vitória de guerreira: {v}!', 'Escudo erguido, contas protegidas.', 'A batalha apertou: faltam {v}.'],
  armadura:['Sistemas em 100%: sobrou {v}.', 'Diagnóstico: tudo estável.', 'Energia baixa: faltam {v}.'],
  mercenario:['Esforço máximo: {v} na reserva!', 'Quebrei a quarta parede só pra dizer: tá em ordem.', 'Essa doeu: faltam {v}.'],
  gigante:['Gigante feliz: {v} guardados!', 'Gigante calmo. Contas calmas.', 'Gigante bravo: faltam {v}!'],
  capitao:['Firme na missão: {v} sobrando.', 'Escudo firme, mês firme.', 'Recuar e reorganizar: faltam {v}.'],
  trovao:['Digno do martelo: {v} em caixa!', 'Céu limpo nas contas.', 'Trovejou na carteira: faltam {v}.'],
  aranha:['Caiu na teia: {v} guardados!', 'Sentido aguçado: nada estranho.', 'A teia arrebentou: faltam {v}.'],
  relampago:['Rápido assim: {v} no azul!', 'Correndo no ritmo certo.', 'Fui rápido demais no cartão: faltam {v}.'],
  guardioes:['Galáxia salva e {v} no bolso.', 'Tocando a fita e seguindo viagem.', 'A nave está no vermelho: faltam {v}.'],
  simbionte:['Nós estamos felizes: {v}!', 'Nós estamos de olho nas contas.', 'Nós gastamos demais: faltam {v}.'],
  chamas:['Mês pegando fogo: {v} de sobra!', 'Chama baixa, tudo sob controle.', 'Queimou a carteira: faltam {v}.'],
  mutantes:['Garras recolhidas e {v} guardados.', 'A escola segue tranquila.', 'Arranhou feio: faltam {v}.'],
  quarteto:['Hora de comemorar: {v}!', 'Firme feito pedra.', 'Rachou o orçamento: faltam {v}.'],
  magosupremo:['Vi todos os futuros: neste sobram {v}.', 'O tempo corre a nosso favor.', 'Negociando com as contas: faltam {v}.'],
  superfamilia:['Família unida, {v} de folga!', 'Missão em casa: tudo em ordem.', 'Sem acrobacias nos gastos: faltam {v}.'],
  peixe:['Nadando de braçada: sobrou {v}!', 'Mar calmo por aqui.', 'A correnteza levou: faltam {v}.'],
  trancas:['Lanternas no céu: {v} a mais na conta!', 'Da torre, tudo tranquilo.', 'Enrolou tudo: faltam {v}.'],
  maca:['Mês mais doce do reino: {v}.', 'Espelho meu, as contas estão bem.', 'Mordida amarga: faltam {v}.'],
  cristal:['Serviu direitinho: {v} poupados!', 'Ainda falta para a meia-noite.', 'Virou abóbora: faltam {v}.'],
  maravilhas:['Cheguei na hora: {v} guardados!', 'Nem cedo, nem tarde: em dia.', 'É tarde, é tarde: faltam {v}!'],
  adormecida:['Sonho bom: {v} na reserva.', 'Dormindo tranquila com as contas.', 'Acorda, {nome}: faltam {v}.'],
  sereia:['Tesouro do fundo do mar: {v}!', 'Maré calma por aqui.', 'A maré baixou: faltam {v}.'],
  fera:['Sentimentos e saldo em alta: {v}.', 'A rosa segue inteira.', 'Caiu uma pétala: faltam {v}.'],
  savana:['Sem problemas: sobrou {v}!', 'A savana está em paz.', 'Seca na savana: faltam {v}.'],
  guerreira:['Honra para a casa: {v}!', 'Treino em dia, contas em dia.', 'Desonra na carteira: faltam {v}.'],
  arqueira:['Flecha no alvo: {v} sobrando!', 'Arco firme, mira calma.', 'Errei o alvo: faltam {v}.'],
  ilha:['O mar escolheu: {v} pra você.', 'Remando no ritmo das ondas.', 'A canoa virou: faltam {v}.'],
  gelo:['Mês congelado no azul: {v} em caixa!', 'Frio lá fora, contas em dia.', 'Derreteu: faltam {v}.'],
  mel:['Pote cheio: {v} de mel!', 'Zum, zum: tudo no lugar.', 'O pote esvaziou: faltam {v}.'],
  brinquedos:['Até o teto do quarto e além: {v}!', 'Brinquedos guardados, contas também.', 'Faltou pilha: {v} no vermelho.'],
  lampada:['Desejo realizado: {v} no azul!', 'Ainda restam desejos este mês.', 'Acabaram os desejos: faltam {v}.'],
  monstrinhos:['Risada vale mais: {v} guardados!', 'Turno tranquilo na fábrica.', 'Susto na conta: faltam {v}.'],
  jantar:['Jantar garantido: sobrou {v}.', 'Passeio calmo pelo bairro.', 'Sobrou só o prato vazio: faltam {v}.'],
  nunca:['Pensamento feliz: {v} de sobra!', 'Segunda estrela à direita, tudo certo.', 'Tique-taque: faltam {v}.'],
  planeta:['Brotou: {v} de economia!', 'Regando um pouquinho por dia.', 'Faltou água: {v} no vermelho.'],
  selva:['Rei da selva e do saldo: {v}!', 'Pulando de galho em galho, sem cair.', 'Escorreguei do cipó: faltam {v}.'],
  ferias:['Plano do dia: guardar {v}!', 'Férias tranquilas por aqui.', 'Acabou o verão: faltam {v}.'],
  chef:['Receita perfeita: {v} de folga!', 'Tempero no ponto, contas no ponto.', 'Queimou a panela: faltam {v}.'],
  aloha:['Aloha! Sobrou {v}.', 'Maré mansa, contas em dia.', 'Onda forte: faltam {v}.'],
  halloween:['Doces e mais doces: {v}!', 'Nenhum susto na conta.', 'Travessura do cartão: faltam {v}.'],
  noiva:['Mês de festa: {v} a mais na conta!', 'Flutuando leve pelas contas.', 'Assombrou a carteira: faltam {v}.'],
  sombria:['Até eu sorrio: {v} guardados.', 'O reino dorme tranquilo.', 'Maldição do cartão: faltam {v}.'],
  dalmatas:['Cento e uma moedas… e mais {v}!', 'Abanando o rabo: tudo em ordem.', 'Pintou sujeira: faltam {v}.'],
  pomagico:['Um punhado de brilho e {v} poupados!', 'Um tilintar: contas em dia.', 'Faltou pó mágico: {v} no vermelho.'],
  supercao:['Super latido de alegria: {v}!', 'De guarda, e tudo calmo.', 'Sem superpoder hoje: faltam {v}.'],
  cacadores:['Licença de caçador: {v} conquistados!', 'Prova em andamento, sem tropeços.', 'Reprovado nesta fase: faltam {v}.'],
  ninja:['Golpe silencioso: {v} na reserva!', 'Passos leves, contas em dia.', 'A bomba de fumaça falhou: faltam {v}.'],
  espada:['Andar concluído: {v} de recompensa!', 'Vida cheia, seguimos no jogo.', 'Barra de vida baixa: faltam {v}.']
};
