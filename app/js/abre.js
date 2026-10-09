// Cofrim — Cor da tela de abertura. Carregado logo depois do <div id="abre"> no index.html, para a tela já nascer
// na cor escolhida (era um script embutido na página).
try {
  var abreCor = JSON.parse(localStorage.getItem('financas-abre') || 'null'), hex = /^#[0-9a-f]{3,8}$/i;
  if (abreCor && hex.test(abreCor[0]) && hex.test(abreCor[1])) document.getElementById('abre').style.background = 'linear-gradient(135deg,' + abreCor[0] + ',' + abreCor[1] + ')';
} catch(e){}
// Rede de segurança: se a abertura não começar (erro antes dela), a tela de abertura sai sozinha depois de 6 s.
setTimeout(function(){ var el = document.getElementById('abre'), dentro = document.getElementById('abreIn');
  if (el && dentro && !dentro.innerHTML) el.remove(); }, 6000);
