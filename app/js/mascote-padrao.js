// Cofrim — Personagem padrão em imagem (o mascote do app sem tema especial).
// Carregado pelo index.html antes de divertido.js. Enquanto as três imagens não existem, o app usa o porquinho
// desenhado em código (pigSvg). Quando chegarem (feitas no Gemini, pelo docs/prompt-personagem-padrao.md), cada humor
// vira uma imagem embutida aqui como data:image/webp;base64,… (fundo transparente, quadrada, ~512 px, o personagem
// encostado na base, sem sombra: o app desenha a sombra e a moeda). Embutida, a imagem vai junto nas atualizações das
// telas (o app.html é um arquivo só) e funciona sem internet. Depois, rodar o arte.sh/arte.ps1 para os widgets.
const MASCOTE_PADRAO_IMG = {feliz:'', ok:'', triste:''};
// Imagem do humor pedido (ou a do "ok", se só ela existir); '' = ainda sem imagem.
const mascotePadraoImg = mood => MASCOTE_PADRAO_IMG[mood] || MASCOTE_PADRAO_IMG.ok || '';
