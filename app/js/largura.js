// Cofrim — Largura do layout. Carregado no <head> do index.html, antes de tudo (era um script embutido na página).
// Em celulares, o layout é sempre desenhado com 390 px de largura e o sistema o redimensiona
// para caber exatamente na tela, seja ela mais estreita ou mais larga. Tablets usam a largura real.
function ajustarLargura(){
  document.querySelector('meta[name=viewport]').content = screen.width < 520 ? 'width=390, viewport-fit=cover, user-scalable=no' : 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
}
ajustarLargura();
addEventListener('orientationchange', () => setTimeout(ajustarLargura, 150)); // celular deitado ou tablet: usa a largura real
