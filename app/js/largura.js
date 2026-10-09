// Cofrim — Largura do layout. Carregado no <head> do index.html, antes de tudo (era um script embutido na página).
// Em celulares, o layout é sempre desenhado com 390 px de largura e o sistema o redimensiona
// para caber exatamente na tela, seja ela mais estreita ou mais larga. Tablets usam a largura real.
function ajustarLargura(){
  const m = document.querySelector('meta[name=viewport]'),
  v = screen.width < 520 ? 'width=390, viewport-fit=cover, user-scalable=no' : 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
  if (m.content !== v) m.content = v;
}
ajustarLargura();
addEventListener('orientationchange', () => setTimeout(ajustarLargura, 150)); // celular deitado ou tablet: usa a largura real
// Dobrável abrindo ou fechando e janela redimensionada (tela dividida, computador): a tela não recarrega, só troca a largura.
let larguraT = 0;
addEventListener('resize', () => { clearTimeout(larguraT); larguraT = setTimeout(ajustarLargura, 150); });
