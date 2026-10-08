// Cofrim — Configurações (a folha com as categorias), tema ou cor do dia e o Diagnóstico.
// Carregado pelo index.html, nesta ordem: dados.js, telas.js, assistente.js, formularios.js, divertido.js, config.js, sincronizacao.js, entrada.js, inicio.js.
// ---------- Configurações ----------
// Ícone e bloqueio são funções do lado nativo (window.Android). Na prévia do PC (localhost) não há
// lado nativo: demoOpts só guarda as escolhas na memória para a tela poder ser vista; não tem efeito real.
const demoOpts = {
  lock:false, time:30, icon:'indigo', esconde:true,
  bloqueio(){ return this.lock; }, setBloqueio(v){ this.lock = v; },
  tempoBloqueio(){ return this.time; }, setTempoBloqueio(v){ this.time = v; },
  icone(){ return this.icon; }, setIcone(v){ this.icon = v; }
};
const isPreview = location.hostname === 'localhost';
function nativeOpts(){ return window.Android && Android.setTempoBloqueio ? Android : isPreview ? demoOpts : null; }
// Chamado pelo lado nativo depois de pedir a senha para desligar o bloqueio.
function onLockChanged(){ if (settingsShown()) openSettings(); }
// Configurações em categorias: a primeira tela mostra um botão por categoria; cada uma abre só as opções dela.
// setSec guarda a categoria aberta, para as opções que redesenham a tela (openSettings()) continuarem nela.
// Sem argumento e com as configurações fechadas, abre o menu de categorias.
let setSec = '';
const settingsShown = () => sheetOpen() && !!document.querySelector('#sheet .setGrid, #sheet .setHead');
function openSettings(sec){
  if (sec !== undefined) setSec = sec; else if (!settingsShown()) setSec = '';
  const p = db.prefs, n = p.tabs.length;
  // Opções que só existem no APK (ícone, bloqueio). Number()/!! porque os valores vêm do lado nativo.
  const N = nativeOpts(), isApp = !!N, lockOn = isApp && !!N.bloqueio(), lockTime = isApp ? Number(N.tempoBloqueio()) : 0;
  const demo = N === demoOpts ? '<div class="hint warn" style="margin-top:0">Prévia no PC: estas opções só funcionam no app instalado no celular.</div>' : '';
  const batLivre = window.Android && Android.bateriaLivre ? !!Android.bateriaLivre() : null; // null: não dá para saber (prévia)
  const syncHtml = syncSection();
  F = null;
  // [chave, ícone, título, descrição, conteúdo ('' = categoria não existe neste aparelho)]
  const S = [
  ['perfil', 'person', 'Perfil', 'Seu nome, tutorial e atualizações', `
    <label>Seu nome</label>
    <div class="hint" style="margin-top:0">${myName() ? `${greeting()} O nome aparece no topo do Resumo e nas mensagens do app.` : 'Ainda sem nome. Ele aparece no topo do Resumo e nas mensagens do app.'}${sync.shared ? ' Na conta compartilhada, cada pessoa vê o próprio nome no seu celular.' : ''}</div>
    <div class="btns"><button class="btn" data-onclick="askName(true)">${I('person')}${myName() ? 'Trocar o nome' : 'Informar o nome'}</button></div>
    <label>Ajuda</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openTour(0, true)">${I('book')}Ver o tutorial</button><button class="btn" data-onclick="maybeNews(true)">${I('sparkle')}Novidades da versão</button></div>
    ${typeof podeInstalar === 'function' && podeInstalar() ? `<label>Instalar o app</label>
    <div class="hint" style="margin-top:0">Põe o Cofrim na tela inicial do celular (ou no computador), para abrir direto, como um app.</div>
    <div class="btns"><button class="btn primary" data-onclick="instalarApp()">${I('download')}Instalar o Cofrim</button></div>` : ''}
    ${window.Android && Android.atualizar ? `<label>Atualizações</label>
    <div class="hint" style="margin-top:0">Versão ${APP_VERSION}. O app procura atualizações sozinho ao abrir e as aplica na abertura seguinte.</div>
    <div class="btns"><button class="btn" data-onclick="procurarAtualizacao()">${I('refresh')}Procurar atualização agora</button></div>` : ''}`],
  ['aparencia', 'sun', 'Aparência', 'Idioma, tema, cores, texto e modo divertido', `
    <label>Idioma</label>
    <div class="btns" style="margin-top:0">${Object.entries(LANGS).map(([k, v]) => `<button class="btn ${lang() === k ? 'primary' : ''}" style="padding:11px 4px" data-onclick="setLang('${k}')">${v}</button>`).join('')}</div>
    ${lang() !== 'pt' ? '<div class="hint">O assistente entende perguntas só em português. Os valores continuam em reais.</div>' : ''}
    <label>Tema</label>
    <div class="btns" style="margin-top:0">${Object.entries(MODES).map(([k,v]) => `<button class="btn ${p.mode === k ? 'primary' : ''}" data-onclick="setPref('mode','${k}')">${v}</button>`).join('')}</div>
    <label>Cor</label>
    <div class="swatches">${Object.entries(COLORS).map(([k,c]) => `<button class="sw ${p.color === k ? 'on' : ''}" style="background:linear-gradient(135deg,${c[1]},${c[2]})" data-onclick="setCor('${k}')" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div>
    ${sorteioBtn('cor', 'Cor aleatória todo dia')}
    <label>Tamanho do texto</label>
    <div class="btns" style="margin-top:0">${[[.9,'Pequeno'],[1,'Normal'],[1.12,'Grande'],[1.25,'Maior']].map(([v,t]) => `<button class="btn ${p.font === v ? 'primary' : ''}" style="padding:11px 4px" data-onclick="setPref('font',${v})">${t}</button>`).join('')}</div>
    ${window.Android && Android.girar ? `<label>Girar a tela com o celular</label>
    <div class="btns" style="margin-top:0">${[[true,'Sim'],[false,'Não, sempre em pé']].map(([v,t]) => `<button class="btn ${!!Android.girarLigado() === v ? 'primary' : ''}" data-onclick="Android.girar(${v});openSettings()">${t}</button>`).join('')}</div>` : ''}
    <label>Animações</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligadas'],[false,'Desligadas']].map(([v,t]) => `<button class="btn ${p.anim === v ? 'primary' : ''}" data-onclick="setPref('anim',${v})">${t}</button>`).join('')}</div>
    <label>Cor dos ícones das categorias</label>
    <div class="btns" style="margin-top:0">${[[false,'Do tema'],[true,'Uma cor por categoria']].map(([v,t]) => `<button class="btn ${!!p.catColor === v ? 'primary' : ''}" data-onclick="setPref('catColor',${v})">${t}</button>`).join('')}</div>
    <label>Modo divertido</label>
    <div class="btns" style="margin-top:0">${[[true, I('sparkle') + 'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${p.fun === v ? 'primary' : ''}" data-onclick="setPref('fun',${v})">${t}</button>`).join('')}</div>
    <div class="hint">Um porquinho no Resumo que reage ao seu mês, mais de 100 conquistas para desbloquear, confete e recados bem-humorados.</div>
    <label>Tema especial</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openSettings('temas')">${I('sparkle')}${p.skin ? 'Em uso: ' + SKINS[p.skin][0] : 'Escolher um tema especial'}</button></div>
    <div class="hint">Os temas especiais têm uma área própria nas Configurações, separados por categoria. Com um deles ligado, "Tema" e "Cor" acima ficam sem efeito.</div>`],
  ['temas', 'sparkle', 'Temas especiais', `${Object.keys(SKINS).length} temas por categoria, com mascote próprio`, `
    <div class="hint" style="margin-top:0">Um tema especial muda as cores do app inteiro, o mascote do modo divertido, a abertura e os widgets; os ícones das categorias ficam com a cor de cada uma. ${p.skin ? `Em uso: <b>${SKINS[p.skin][0]}</b>.` : 'Nenhum em uso.'}</div>
    <div class="btns" style="margin-top:0"><button class="btn ${p.skin ? '' : 'primary'}" data-onclick="setSkin('')">Sem tema especial</button></div>
    ${sorteioBtn('tema', 'Tema aleatório todo dia')}
    ${WEB_APP ? '<div class="hint">No iPhone, o ícone do app é fixado na hora de adicionar à Tela de Início. Para ele ficar com o tema: abra o app no Safari com o tema já escolhido, toque em Compartilhar › Adicionar à Tela de Início e apague o ícone antigo.</div>' : ''}
    ${TEMA_CATS.map(([c, nome, ks]) => `<details class="grp" ${ks.includes(p.skin) || (!p.skin && c === 'estilos') ? 'open' : ''}><summary>${nome}<small>${ks.length}</small>${I('chev')}</summary>
      <div class="icoGrid t3">${ks.map(k => `<button class="${p.skin === k ? 'on' : ''}" data-onclick="setSkin('${k}')"><span class="temaM" style="background:linear-gradient(135deg,${SKINS[k][4]},${SKINS[k][5]})">${mascoteEm(k, 'ok', 0, 0, 46)}</span><small>${SKINS[k][0]}</small></button>`).join('')}</div></details>`).join('')}`],
  ['menu', 'sliders', 'Menu de baixo', 'Esconder e reordenar as abas', `
    <div class="hint" style="margin-top:0">Toque no círculo para esconder ou mostrar uma aba e use as setas para mudar a ordem. O Resumo fica sempre no menu.</div>
    <div>${p.tabs.map((t,i) => { if (t === 'chat' || (WEB_APP && t === 'noticias')) return ''; const off = p.tabsOff.includes(t); return `<div class="item" style="cursor:default;padding:6px 0">
      <button class="iconbtn ${off ? 'muted' : 'in'}" data-onclick="toggleTab('${t}')" ${t === 'resumo' ? 'disabled style="opacity:.35"' : ''} aria-label="${off ? 'Mostrar' : 'Esconder'}">${I(off ? 'unchecked' : 'checked', 24)}</button>
      <div class="mid" style="${off ? 'opacity:.5' : ''}"><b>${I(TABS[t][0])} ${TABS[t][1]}</b>${off ? '<small>escondida</small>' : t === visTabs()[0] ? '<small>Aba inicial</small>' : ''}</div>
      <button class="iconbtn" data-onclick="moveTab(${i},-1)" ${i ? '' : 'disabled style="opacity:.25"'} aria-label="Subir">▲</button>
      <button class="iconbtn" data-onclick="moveTab(${i},1)" ${i < n-1 ? '' : 'disabled style="opacity:.25"'} aria-label="Descer">▼</button></div>`; }).join('')}</div>`],
  ['seguranca', 'lock', 'Ícone e bloqueio', 'Cor do ícone, senha ou biometria', !isApp ? '' : `${demo}
    <label>Cor do ícone do app</label>
    <div class="swatches">${Object.entries(ICONES).filter(([k]) => !SKINS[k] || SKIN_ANTIGOS.includes(k) || (k === p.skin || k === N.icone()) && iconeTem(k)).map(([k,c]) => `<button class="sw ${N.icone() === k ? 'on' : ''}" style="background:linear-gradient(135deg,${c[1]},${c[2]});border-radius:14px" data-onclick="nativeOpts().setIcone('${k}');openSettings()" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div>
    ${window.Android && Android.setIconeApp ? `<label>Desenho do ícone</label>
    <div class="icoGrid">${iconeDesenhos(Android.icone()).map(k => `<button class="${Android.iconeDesenho() === k ? 'on' : ''}" data-onclick="Android.setIconeApp(Android.icone(),'${k}',0);openSettings()">${iconeSvg(Android.icone(), k)}<small>${iconeNomeDesenho(Android.icone(), k)}</small></button>`).join('')}</div>
    ${SKINS[Android.icone()] ? '<div class="hint">Os outros desenhos (moeda, carteira, cofre…) existem para as doze cores comuns: escolha uma delas acima para vê-los.</div>' : Android.criarAtalho ? '' : '<div class="hint">Há mais desenhos (moeda, carteira, cofre…) na versão nova do app: toque em Procurar atualizações.</div>'}` : ''}
    <div class="hint">Ao trocar a cor ou o desenho, o Android fecha o app: é só abrir de novo pelo ícone novo. Se o ícone sumir da tela inicial, adicione de novo pela lista de apps.</div>
    <label>Pedir senha ou biometria ao abrir</label>
    <div class="btns" style="margin-top:0">${[[true, I('lock') + 'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${lockOn === v ? 'primary' : ''}" data-onclick="nativeOpts().setBloqueio(${v});openSettings()">${t}</button>`).join('')}</div>
    ${lockOn ? '<div class="hint">Para desligar, o app pede a senha ou a biometria. Ao sair da conta Google, o app também pede, e o bloqueio desliga.</div>' : ''}
    <label>Pedir de novo depois de ficar fora do app por</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap${lockOn ? '' : ';opacity:.4;pointer-events:none'}">${[[0,'Sempre'],[30,'30 s'],[60,'1 min'],[300,'5 min'],[900,'15 min']].map(([s,t]) => `<button class="btn ${lockTime === s ? 'primary' : ''}" style="padding:11px 6px" data-onclick="nativeOpts().setTempoBloqueio(${s});openSettings()">${t}</button>`).join('')}</div>`],
  ['lembretes', 'calendar', 'Lembretes', 'Contas a vencer, parcelas e economia de bateria', !isApp ? '' : `${demo}
    <label>Lembretes ativos neste aparelho</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligados'],[false,'Desligados']].map(([v,t]) => `<button class="btn ${lembLigados() === v ? 'primary' : ''}" data-onclick="${v ? 'ligarLembretes()' : 'desligarLembretes()'}">${t}</button>`).join('')}</div>
    ${aparelhoLemb() === '1' && !notifLiberada() ? `<div class="hint warn">${I('alert', 13)} Desligados porque as notificações do Cofrim estão bloqueadas nas configurações do Android.</div>
      <div class="btns"><button class="btn" data-onclick="Android.abrirConfigNotificacoes()">Abrir configurações do Android</button></div>` : ''}
    <div class="hint">Vale só para este aparelho. O que você escolhe abaixo fica salvo na sua conta e vale em todos os aparelhos em que os lembretes estiverem ligados.</div>
    ${lembLigados() && batLivre === false ? `<div class="hint warn">${I('alert', 13)} A economia de bateria está ligada para o app: os lembretes podem atrasar ou não chegar. Desligue para recebê-los na hora.</div>` : ''}
    ${lembLigados() && batLivre ? `<div class="hint in">${I('check', 13)} Economia de bateria desligada para o app: os lembretes chegam na hora.</div>` : ''}
    <label>Contas a vencer (gastos fixos com dia de vencimento)</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${!!p.notify === v ? 'primary' : ''}" data-onclick="setNotify(${v})">${t}</button>`).join('')}</div>
    <div style="${p.notify ? '' : 'opacity:.4;pointer-events:none'}">
      <label>Avisar com antecedência de (pode marcar mais de uma)</label>
      <div class="btns" style="margin-top:0">${[[1,'1 dia'],[3,'3 dias'],[5,'5 dias']].map(([d,t]) => `<button class="btn ${p.reminds.includes(d) ? 'primary' : ''}" data-onclick="toggleRemind(${d})">${p.reminds.includes(d) ? I('check', 15) : ''}${t}</button>`).join('')}</div>
      <label>Categorias que notificam (as que têm gastos fixos; toque para ligar ou desligar)</label>
      <div class="chips" style="margin:0">${Object.entries(CAT_GASTO).filter(([k]) => k !== 'emprestimo' && (p.notifyCats[k] === false || db.expenses.some(x => x.cat === k && x.fixed))).map(([k,c]) => { const on = p.notifyCats[k] !== false; return `<button style="${on ? 'background:var(--brand);color:' + (theme.dark ? '#0b1020' : '#fff') : 'opacity:.6;text-decoration:line-through'}" data-onclick="toggleNotifyCat('${k}')">${I(c[0], 14)} ${esc(c[1])}</button>`; }).join('')}</div>
    </div>
    <div class="hint">Vale para gastos fixos com dia de vencimento. O app avisa em cada antecedência marcada e de novo no dia do vencimento, por volta das 9h. Sem nenhuma marcada, avisa só no dia.</div>${window.Android && Android.bateria ? `${batLivre ? '' : `<div class="btns"><button class="btn" data-onclick="Android.bateria()">Tirar o app da economia de bateria</button></div>`}
    <label>Previsões de gastos (80%, passou do previsto e encerramento)</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${!!(p.notifyPrev ?? p.notify) === v ? 'primary' : ''}" data-onclick="setNotifyTipo('notifyPrev',${v})">${t}</button>`).join('')}</div>
    <label>Parcelas de financiamentos e empréstimos (no dia do vencimento)</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${!!(p.notifyFin ?? p.notify) === v ? 'primary' : ''}" data-onclick="setNotifyTipo('notifyFin',${v})">${t}</button>`).join('')}</div>
    <div class="hint">Em alguns celulares (Samsung, Xiaomi, Motorola) a economia de bateria atrasa ou corta os lembretes. Na tela que abre, procure "Cofrim" e escolha "Não otimizar". O app também reagenda os lembretes quando o celular reinicia e quando é atualizado.</div>` : ''}`],
  ['widgets', 'chart', 'Widgets', 'Tela inicial do celular: resumo, saldo e porquinho', !(window.Android && Android.widget) ? '' : `
    <div class="hint" style="margin-top:0">Widgets são quadros do app na tela inicial do celular. Há seis: <b>Resumo</b> (você escolhe as linhas), <b>Gastos</b> (a lista dos gastos do mês), <b>Saldo do mês</b>, <b>Contas a vencer</b>, <b>Mascote</b> (a cara do mês e os gastos) e <b>Gastar</b> (só o mascote e o botão de novo gasto, sem valores). O que você muda aqui vale na hora para os widgets que já estão na tela inicial.</div>
    ${Android.setWidgetOculto ? `<label>Valores nos widgets</label>
    <div class="btns" style="margin-top:0">${[[false, 'Mostrar'], [true, 'Esconder']].map(([v, t]) => `<button class="btn ${!!Android.widgetOculto() === v ? 'primary' : ''}" data-onclick="Android.setWidgetOculto(${v});openSettings()">${t}</button>`).join('')}</div>
    <div class="hint">Escondendo, os widgets mostram R$ •••• no lugar dos valores. Vale só para este aparelho, com ou sem o bloqueio ligado.</div>` : ''}
    <div class="hint">Cada widget também tem as próprias configurações: segure o dedo nele na tela inicial e toque em <b>Configurações</b> para escolher a opacidade do fundo, o formato dos cantos e o fundo escuro (Android 12 ou mais novo; nos anteriores, elas aparecem ao pôr o widget).</div>
    <label>Fundo dos widgets</label>
    <div class="btns" style="margin-top:0">${[['tema', p.skin ? 'Tema especial' : 'Cor do app'], ['escuro', 'Escuro']].map(([v, t]) => `<button class="btn ${(p.widgetFundo || 'tema') === v ? 'primary' : ''}" data-onclick="setPref('widgetFundo','${v}')">${t}</button>`).join('')}</div>
    <label>Mascote nos widgets Resumo, Gastos, Saldo e Contas</label>
    <div class="btns" style="margin-top:0">${[[true, 'Com mascote'], [false, 'Sem mascote']].map(([v, t]) => `<button class="btn ${(p.widgetPig ?? !!p.fun) === v ? 'primary' : ''}" data-onclick="setPref('widgetPig',${v})">${t}</button>`).join('')}</div>
    <div class="hint">É o mesmo mascote do app: o porquinho ou o personagem do tema especial, com a cara do mês.</div>
    <label>Widget Resumo</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openLayoutEdit('widget')">${I('sliders')}Escolher o que aparece</button></div>
    <div class="hint">As linhas aparecem na ordem escolhida; se não couberem, dá para rolar dentro do widget ou aumentá-lo (segure o dedo nele e puxe a borda). Linhas sem dado (por exemplo, sem conta a vencer) são puladas.</div>
    <label>Widget Gastos: o que listar</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['', 'Todos'], ...Object.entries(GRUPOS).map(([k, g]) => [k, g[0]])].map(([k, t]) => `<button class="btn ${(p.widgetLista || '') === k ? 'primary' : ''}" style="padding:11px 6px;flex:1 0 30%" data-onclick="setPref('widgetLista','${k}')">${t}</button>`).join('')}</div>
    <label>Widget Gastos: ordem</label>
    <div class="btns" style="margin-top:0">${[['', 'Como no app'], ['valor', 'Maiores primeiro']].map(([k, t]) => `<button class="btn ${(p.widgetOrdem || '') === k ? 'primary' : ''}" data-onclick="setPref('widgetOrdem','${k}')">${t}</button>`).join('')}</div>
    ${Android.fixarWidget ? `<label>Pôr na tela inicial</label>
    <div class="btns" style="margin-top:0;flex-wrap:wrap">${[['resumo', 'Resumo'], ...(Android.criarAtalho ? [['gastos', 'Gastos']] : []), ['saldo', 'Saldo do mês'], ['contas', 'Contas a vencer'], ['porco', 'Mascote'], ['gastar', 'Gastar']].map(([k, t]) => `<button class="btn" style="padding:11px 6px;flex:1 0 30%" data-onclick="if(!Android.fixarWidget('${k}'))tell('Esta tela inicial não aceita o pedido. Segure o dedo num espaço vazio da tela inicial, toque em Widgets e procure Cofrim.')">${t}</button>`).join('')}</div>
    <div class="hint">O Android pede sua confirmação. Também dá para adicionar segurando o dedo num espaço vazio da tela inicial › Widgets › Cofrim.</div>` : ''}`],
  ['conta', 'cloud', 'Conta e sincronização', 'Conta Google, sincronização e cópias', syncHtml],
  ['compart', 'people', 'Conta compartilhada', sync.shared ? 'Ligada: vocês veem os mesmos dados' : 'Casal ou família: os mesmos dados em dois celulares', syncHtml ? shareHtml() : ''],
  ['auto', 'sparkle', 'Lançamento automático', 'Sugestões pelas notificações de bancos, carteiras e vales', !(window.Android && Android.avisosLigar) ? '' : `
    <label>Sugerir lançamentos pelas notificações de bancos, carteiras e vales</label>
    <div class="btns" style="margin-top:0">${[[true,'Ligado'],[false,'Desligado']].map(([v,t]) => `<button class="btn ${!!Android.avisosLigado() === v ? 'primary' : ''}" data-onclick="setAvisos(${v})">${t}</button>`).join('')}</div>
    ${Android.avisosLigado() && !Android.avisosAcesso() ? `<div class="hint warn">${I('alert', 13)} Falta autorizar no Android. <a href="#" data-onclick="Android.avisosConfigurar();return false" style="color:var(--brand)">Abrir a tela de autorização</a></div>` : ''}
    <div class="hint">Quando o banco, a carteira do celular (Google, Samsung…) ou o app do vale-refeição ou alimentação avisa uma compra ou um Pix, o app mostra no Resumo uma sugestão já preenchida; você confere e lança. Para isso o Android pede acesso às notificações: o app guarda só as de compras, Pix e pagamentos, e nada sai do aparelho. Depende do texto que cada banco usa, então pode não reconhecer todos. A partir do Android 15, avisos com números longos (como um código de 4 dígitos ou o final do cartão) chegam escondidos: aí o app mostra só "Novo aviso do banco" para você lançar o valor.</div>`],
  ['guia', 'book', 'Guia do app', 'Todas as funções, onde ficam e como usar', guideHtml()],
  ['dados', 'box', 'Dados e ajustes', 'Categorias, taxas, lixeira, backup e apagar', `
    <label>Investimentos</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openRates()">${I('trend')}Taxas de referência (CDI, Selic, IPCA)</button></div>
    <label>Categorias</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openCats()">${I('tag')}Criar, renomear ou esconder categorias</button></div>
    ${archHtml()}
    <label>Lixeira</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openTrash()">${I('trash')}Lançamentos excluídos (${db.trash.length})</button></div>
    <label>Planilha do Google</label>
    <div class="btns" style="margin-top:0"><button class="btn" data-onclick="openSheetLink()">${I('doc')}${sheetId() ? 'Planilha ligada ao app' : 'Criar planilha ligada ao app'}</button></div>
    <label>Backup em arquivo</label>
    ${canSync() && sync.on ? `<div class="hint" style="margin-top:0">Seus dados ficam numa área privada do seu Google Drive, que só o Cofrim acessa. Use "Salvar cópia" para ter um arquivo que você pode ver e guardar onde quiser.</div>
    <div class="btns"><button class="btn" data-onclick="salvarCopiaDrive()">${I('cloud')}Salvar cópia no meu Google Drive</button></div>` : ''}
    <div class="btns" style="margin-top:${canSync() && sync.on ? 8 : 0}px"><button class="btn" data-onclick="exportData()">${I('download')}Salvar no aparelho</button><button class="btn" data-onclick="if(!demoBloqueia())document.getElementById('file').click()">${I('upload')}Importar</button></div>
    ${sync.fileAt ? `<div class="hint">Cópia automática semanal: a última foi em ${new Date(sync.fileAt).toLocaleDateString('pt-BR')}, na pasta <span style="overflow-wrap:anywhere">${esc(sync.fileDir || '')}</span> do celular (são guardadas as 8 mais recentes; a pasta é apagada se o app for desinstalado).</div>` : ''}
    <label>Apagar tudo</label>
    <div class="btns" style="margin-top:0"><button class="btn danger" style="flex:1" data-onclick="wipeAll()">${I('trash')}Apagar todos os meus dados</button></div>
    <div class="hint">Apaga os lançamentos deste aparelho e da sua conta Google (inclusive as cópias diárias e os comprovantes). Não dá para desfazer.</div>`]
  ].filter(s => s[4]);
  const cur = S.find(s => s[0] === setSec);
  if (!cur) setSec = '';
  showSheet(cur ? `<h3 class="setHead"><button class="iconbtn" data-onclick="openSettings('')" aria-label="Voltar">‹</button>${I(cur[1], 22)} ${cur[2]}</h3>
    <div class="sec">${cur[4]}</div>
    <div class="btns foot"><button class="btn" data-onclick="openSettings('')">Voltar</button><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>`
  : `<h3>Configurações</h3>
    <div class="setGrid">${S.map(([k, ic, t, d]) => `<button class="setTile" data-onclick="openSettings('${k}')"><span>${I(ic, 22)}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    ${(window.Android && Android.atualizar) || WEB_APP ? `<div class="btns"><button class="btn" data-onclick="procurarAtualizacao()">${I('refresh')}Procurar atualizações</button></div>` : ''}
    <div class="btns foot"><button class="btn primary" data-onclick="closeForm()">Fechar</button></div>
    <div class="hint" style="text-align:center" data-onclick="diagTap()">Cofrim · versão ${APP_VERSION}</div>`);
  settingsOpen = true;
}
// O APK instalado tem ícone para esta cor ou tema? (Os temas por categoria chegaram ao ícone no APK 1.46.)
const iconeTem = k => !SKINS[k] || SKIN_ANTIGOS.includes(k) || !!(window.Android && Android.iconeTem && Android.iconeTem(k));
// Tema especial: aplica e, no APK, oferece trocar também o ícone do app para combinar.
// ---------- Tema ou cor do dia ----------
// db.prefs.sorteio = 'tema' (um tema especial por dia) ou 'cor' (uma cor comum por dia); '' = desligado. A cada dia o
// app sorteia um que ainda não saiu (sorteioVistos); quando todos já saíram, a rodada recomeça. Escolher um tema ou uma
// cor à mão desliga o sorteio.
function sorteioDoDia(forcar){
  const p = db.prefs, modo = p.sorteio, hoje = new Date().toLocaleDateString('sv');
  if ((modo !== 'tema' && modo !== 'cor') || (!forcar && p.sorteioDia === hoje)) return false;
  const todos = Object.keys(modo === 'tema' ? SKINS : COLORS), atual = modo === 'tema' ? p.skin : p.color;
  let vistos = (p.sorteioVistos || []).filter(k => todos.includes(k)), resto = todos.filter(k => !vistos.includes(k) && k !== atual);
  if (!resto.length){ vistos = []; resto = todos.filter(k => k !== atual); } // todos já saíram: começa outra rodada
  const k = resto[Math.floor(Math.random() * resto.length)];
  if (modo === 'tema') p.skin = k; else { p.skin = ''; p.color = k; }
  Object.assign(p, {sorteioVistos:[...vistos, k], sorteioDia:hoje});
  db.cfgMod = Date.now(); save(); applyTheme();
  return true;
}
const sorteioNome = () => db.prefs.sorteio === 'tema' ? SKINS[db.prefs.skin][0] : COLORS[db.prefs.color][0];
function setSorteio(modo){
  const p = db.prefs;
  p.sorteio = p.sorteio === modo ? '' : modo;
  if (p.sorteio){ p.sorteioVistos = []; sorteioDoDia(true); toast(`${modo === 'tema' ? 'Tema' : 'Cor'} de hoje: ${sorteioNome()}`); }
  else { db.cfgMod = Date.now(); save(); }
  render(); openSettings();
}
const sorteioBtn = (modo, texto) => `<div class="btns" style="margin-top:8px"><button class="btn ${db.prefs.sorteio === modo ? 'primary' : ''}" data-onclick="setSorteio('${modo}')">${I('sparkle')}${texto}: ${db.prefs.sorteio === modo ? 'ligado' : 'desligado'}</button></div>
  ${db.prefs.sorteio === modo ? `<div class="hint">Todo dia o app escolhe ${modo === 'tema' ? 'um tema especial' : 'uma cor'} diferente, sem repetir até passar por ${modo === 'tema' ? 'todos' : 'todas'} (${(db.prefs.sorteioVistos || []).length} de ${Object.keys(modo === 'tema' ? SKINS : COLORS).length}). Hoje: <b>${sorteioNome()}</b>. <button style="color:var(--brand);font-weight:700" data-onclick="sorteioDoDia(true);render();openSettings()">Sortear outro agora</button></div>` : ''}`;
// Escolha feita à mão: vale ela, e o sorteio diário para.
function setCor(k){ db.prefs.sorteio = ''; setPref('color', k); iconeNaCor(k); }
// O ícone do Cofrim (desenho 'b') acompanha a cor escolhida à mão. Na versão web o ícone indicado pela página já segue a
// cor (webIcone); no Android, trocar o ícone pode fechar o app, então pergunta antes. Outro desenho ou o ícone de um tema
// ficam como estão.
async function iconeNaCor(k){
  if (!(window.Android && Android.setIconeApp && Android.icone) || demoOn || !COLORS[k]) return;
  if (Android.iconeDesenho() !== 'b' || !COLORS[Android.icone()] || Android.icone() === k) return;
  if (await ask(`Usar o ${COLORS[k][0].toLowerCase()} também no ícone do app?\n\nAo trocar o ícone, o Android pode fechar o app: é só abrir de novo.`, 'Trocar o ícone')) Android.setIconeApp(k, 'b', 0);
}
async function setSkin(k){
  db.prefs.sorteio = '';
  setPref('skin', k);
  if (k && window.Android && Android.setIconeApp && Android.icone() !== k && iconeTem(k)
    && await ask(`Trocar também o ícone do app para combinar com o tema ${SKINS[k][0]}?\n\nO Android fecha o app ao trocar o ícone: é só abrir de novo pelo ícone novo.`, 'Trocar o ícone')) Android.setIconeApp(k, 't', Android.iconeNome()); // o ícone do tema: o mascote dele e as barras do app
}
// Guia do app (Configurações): todas as funções (GUIA, em js/guia.js), por assunto, com busca.
function guideHtml(){
  return `<div class="search" style="margin-bottom:10px">${I('search')}<input id="gq" type="text" placeholder="Buscar uma função" autocomplete="off" data-oninput="guideFilter(this.value)"></div>
    ${GUIA.map(([sec, itens]) => `<details class="grp gSec"><summary>${sec}<small>${itens.length}</small>${I('chev')}</summary>${itens.map(([nome, onde, como]) => `
      <div class="gItem" data-t="${esc(plain(nome + ' ' + onde + ' ' + como))}"><b>${esc(nome)}</b><small><i>Onde:</i> ${esc(onde)}</small><small><i>Como usar:</i> ${esc(como)}</small></div>`).join('')}</details>`).join('')}
    <div class="hint" id="gVazio" hidden>Nenhuma função encontrada com esse texto.</div>`;
}
function guideFilter(q){
  q = plain(q.trim());
  let algum = false;
  document.querySelectorAll('#sheet .gSec').forEach(sec => {
    let n = 0;
    sec.querySelectorAll('.gItem').forEach(it => { const ok = !q || it.dataset.t.includes(q); it.hidden = !ok; if (ok) n++; });
    sec.hidden = !n; sec.open = !!q && n > 0;
    if (n) algum = true;
  });
  document.getElementById('gVazio').hidden = algum;
}
// Ao voltar de uma tela do Android (economia de bateria, notificações), as configurações abertas se atualizam.
document.addEventListener('visibilitychange', () => { if (!document.hidden && settingsShown()) openSettings(); });
// ---------- Diagnóstico (tela escondida) ----------
// Abre com 7 toques seguidos no número da versão, em Configurações. Não tem senha: o relatório não traz valores nem
// descrições dos lançamentos, e uma senha fixa no código não protegia nada.
let diagTaps = 0, diagTimer = 0;
function diagTap(){
  clearTimeout(diagTimer); diagTimer = setTimeout(() => diagTaps = 0, 1500);
  if (++diagTaps < 7) return;
  diagTaps = 0; settingsOpen = false; F = null;
  diagOpen();
}
function diagErrors(){ try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch(e){ return []; } }
// Texto do relatório: nada de valores nem descrições dos lançamentos, só contagens e o estado do app. O texto inteiro
// passa por limpaDiag (e-mails, tokens, respostas do Google, valores e códigos longos), também o que veio do lado nativo.
function diagText(){ return limpaDiag(diagTextoBruto()); }
function diagTextoBruto(){
  const kb = k => { try { return Math.round((localStorage.getItem(k) || '').length / 1024); } catch(e){ return -1; } };
  const errs = diagErrors();
  return [`Cofrim ${APP_VERSION} · formato dos dados ${db.ver || 1}`,
    `Data: ${new Date().toLocaleString('pt-BR')}`,
    `Aparelho: ${navigator.userAgent}`,
    `Tela: ${screen.width}x${screen.height} · zoom do texto ${db.prefs.font}`,
    `Dados: ${kb(KEY)} KB · ` + COLS.map(c => `${c} ${db[c].length}`).join(', '),
    `Gravação falhou: ${saveFailed ? 'sim' : 'não'}`,
    `Sincronização: ${canSync() ? (sync.on ? 'ligada' : 'desligada') : 'indisponível'} · última: ${sync.at ? new Date(sync.at).toLocaleString('pt-BR') : 'nunca'} · erro: ${sync.err || 'nenhum'}`,
    `Fotos na fila: ${sync.up.length} para enviar, ${sync.del.length} para apagar`,
    `Preferências: tema ${db.prefs.mode}/${db.prefs.color}, animações ${db.prefs.anim ? 'sim' : 'não'}, modo divertido ${db.prefs.fun ? 'sim' : 'não'}, abas escondidas ${db.prefs.tabsOff.join(',') || 'nenhuma'}`,
    `Último fechamento por erro: ${(() => { const e = window.Android && Android.ultimoErro ? String(Android.ultimoErro()) : ''; return e ? new Date(+e.split('|')[0]).toLocaleString('pt-BR') + ' — ' + e.slice(e.indexOf('|') + 1, 1500) : 'nenhum registrado'; })()}`,
    `Conferências da conta compartilhada com o app fechado: ${(() => { const h = window.Android && Android.compartHist ? String(Android.compartHist()) : ''; return h ? '\n' + h.split('\n').map(l => { const i = l.indexOf('|'); return '  ' + new Date(+l.slice(0, i)).toLocaleString('pt-BR') + ' — ' + l.slice(i + 1); }).join('\n') : 'nenhuma registrada'; })()}`,
    '', `Erros registrados (${errs.length}):`,
    ...errs.slice().reverse().map(e => `[${new Date(e.t).toLocaleString('pt-BR')} · v${e.v}] ${e.onde}: ${e.msg}`)].join('\n');
}
function diagOpen(){
  showSheet(`<h3>Diagnóstico</h3>
    <div class="hint" style="margin-top:0">Estado do app e últimos erros, para enviar a quem dá suporte. Não inclui valores nem descrições dos seus lançamentos.</div>
    <textarea id="diagBox" readonly>${esc(diagText())}</textarea>
    <div class="btns"><button class="btn" data-onclick="diagSave()">${I('download')}Salvar em arquivo</button><button class="btn" data-onclick="diagCopy()">Copiar</button></div>
    <div class="btns"><button class="btn danger" style="flex:1" data-onclick="localStorage.removeItem(ERR_KEY);diagOpen()">Limpar erros</button></div>
    <div class="btns"><button class="btn" style="flex:1" data-onclick="demoLigar()">${I('sparkle')}Ligar modo demonstração</button></div>
    <div class="btns foot"><button class="btn primary" data-onclick="openSettings()">Voltar</button></div>`);
}
function diagSave(){
  const name = 'financas-diagnostico.txt';
  if (window.Android && Android.exportar) return Android.exportar(diagText(), name);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([diagText()], {type:'text/plain'}));
  a.download = name; a.click();
}
function diagCopy(){
  if (window.Android && Android.copiar){ Android.copiar(diagText()); return toast('Copiado.'); }
  const box = document.getElementById('diagBox');
  box.select();
  try { document.execCommand('copy'); toast('Copiado.'); } catch(e){ toast('Não deu para copiar; use "Salvar em arquivo".'); }
}

// Categorias de gastos e de ganhos: renomear, trocar o ícone, esconder e criar novas.
const ICON_NAMES = {home:'Casa', bed:'Cama', key:'Chave', wrench:'Ferramenta', brush:'Pintura', drop:'Água', flame:'Gás', bolt:'Raio', wifi:'Internet', phone:'Celular', tv:'TV',
  food:'Comida', pizza:'Pizza', coffee:'Café', cup:'Bebida', cake:'Bolo', cart:'Mercado', bag:'Sacola', shirt:'Roupa', scissors:'Beleza', gift:'Presente',
  car:'Carro', fuel:'Combustível', bus:'Ônibus', bike:'Bicicleta', truck:'Entrega', plane:'Viagem', pin:'Lugar', globe:'Mundo',
  health:'Saúde', cross:'Farmácia', pill:'Remédio', dumbbell:'Academia', heart:'Coração', paw:'Pet', person:'Pessoa', people:'Família', smile:'Sorriso',
  star:'Estrela', game:'Jogos', music:'Música', film:'Filmes', ticket:'Ingresso', ball:'Esporte', camera:'Foto', sun:'Sol', leaf:'Planta',
  book:'Livro', grad:'Formatura', laptop:'Computador', briefcase:'Maleta', building:'Prédio', bank:'Banco', calendar:'Calendário', doc:'Documento', receipt:'Recibo',
  coins:'Moedas', coin:'Moeda', cash:'Dinheiro', card:'Cartão', wallet:'Carteira', piggy:'Cofrinho', percent:'Porcentagem', trend:'Gráfico', chart:'Barras',
  tag:'Etiqueta', box:'Caixa', target:'Alvo', trophy:'Troféu', diamond:'Diamante', shield:'Escudo', umbrella:'Guarda-chuva', lock:'Cadeado', cloud:'Nuvem', sparkle:'Brilho'};
const CAT_OF = {gasto:CAT_GASTO, ganho:CAT_GANHO};
// Grupos das categorias de gasto de fábrica, para a tela de categorias não virar uma lista só.
const CAT_GROUPS = {'Casa':['moradia','casa','luz','internet','contas'], 'Alimentação':['alimentacao','mercado','restaurante','cafe','bares'],
  'Transporte':['transporte','combustivel','estacionamento','conducao','oficina','viagem'], 'Saúde e cuidados':['saude','farmacia','academia','beleza'],
  'Lazer':['lazer','cinema','shows','jogos'], 'Compras':['compras','roupas','eletronicos','presentes'], 'Família':['educacao','pets','filhos'],
  'Finanças e outros':['seguros','impostos','doacoes','emprestimo','outros']};
const catGroup = k => Object.keys(CAT_GROUPS).find(g => CAT_GROUPS[g].includes(k));
const catsOpen = new Set(['Suas categorias']);
function openCats(){
  settingsOpen = false; F = null;
  const row = (type, k, c) => `
    <div class="item" style="cursor:default;padding:6px 0">${tile(c[0])}<div class="mid" style="${c[3] ? 'opacity:.5' : ''}"><b>${esc(c[1])}</b>${c[3] ? '<small>escondida</small>' : ''}</div>
      <button class="btn" style="flex:none;padding:8px 12px" data-onclick="editCat('${type}','${k}')">Editar</button>
      ${BASE_CATS[type][k] ? '' : `<button class="iconbtn out" data-onclick="deleteCat('${type}','${k}')" aria-label="Excluir categoria">${I('close', 20)}</button>`}
      ${k === 'outros' ? '' : `<button class="iconbtn ${c[3] ? 'muted' : 'in'}" data-onclick="toggleCat('${type}','${k}')" aria-label="${c[3] ? 'Mostrar' : 'Esconder'}">${I(c[3] ? 'unchecked' : 'checked', 24)}</button>`}</div>`;
  const novo = type => `<div class="btns" style="margin-top:0"><button class="btn" data-onclick="editCat('${type}','')">${I('plus', 16)}Nova categoria de ${type}</button></div>`;
  const groups = {};
  for (const [k, c] of Object.entries(CAT_GASTO)) (groups[catGroup(k) || 'Suas categorias'] = groups[catGroup(k) || 'Suas categorias'] || []).push([k, c]);
  const ordem = ['Suas categorias', ...Object.keys(CAT_GROUPS)].filter(g => groups[g]);
  showSheet(`<h3>Categorias</h3>
    <div class="hint" style="margin-top:0">Toque em um grupo para abrir. Categoria escondida some das listas de escolha, mas os lançamentos antigos continuam com ela. As que você criou podem ser excluídas (X): os lançamentos passam para a de fábrica com o mesmo nome ou para "Outros".</div>
    <label>Gastos</label>${novo('gasto')}
    ${ordem.map((g, i) => `<details class="grp" ${catsOpen.has(g) ? 'open' : ''} data-ontoggle="catsOpen[this.open ? 'add' : 'delete'](this.dataset.g)" data-g="${g}"><summary>${g}<small>${groups[g].length}</small>${I('chev')}</summary>${groups[g].map(([k, c]) => row('gasto', k, c)).join('')}</details>`).join('')}
    <label>Ganhos</label>${novo('ganho')}
    <details class="grp" ${catsOpen.has('Ganhos') ? 'open' : ''} data-ontoggle="catsOpen[this.open ? 'add' : 'delete']('Ganhos')"><summary>Categorias de ganho<small>${Object.keys(CAT_GANHO).length}</small>${I('chev')}</summary>${Object.entries(CAT_GANHO).map(([k, c]) => row('ganho', k, c)).join('')}</details>
    <div class="btns foot"><button class="btn primary" data-onclick="openSettings('dados')">Voltar</button></div>`);
}
function editCat(type, k){
  const c = CAT_OF[type][k];
  openForm('catEdit', null, {id:type + ':' + k, title:c ? 'Editar categoria' : 'Nova categoria de ' + type, vals:c ? {name:c[1], icon:c[0], color:c[2]} : {icon:'tag', color:'#64748b'}});
}
// Exclui uma categoria criada pelo usuário. Os lançamentos dela vão para a de fábrica de mesmo nome, ou para "Outros".
async function deleteCat(type, k){
  const nome = plainName(CAT_OF[type][k][1]);
  const alvo = Object.keys(BASE_CATS[type]).find(b => plainName((db.cats[type][b] || {}).name || BASE_CATS[type][b][1]) === nome) || 'outros';
  const nomeAlvo = (db.cats[type][alvo] || {}).name || BASE_CATS[type][alvo][1];
  const usados = (type === 'gasto' ? ['expenses', 'installments'] : ['incomes']).flatMap(c => db[c]).filter(x => x.cat === k);
  if (!await ask(`Excluir a categoria "${CAT_OF[type][k][1]}"?` + (usados.length ? `\n${usados.length} lançamento(s) passam para "${nomeAlvo}".` : ''), 'Excluir', true)) return;
  for (const x of usados){ x.cat = alvo; touch(x); }
  if (type === 'gasto'){
    if (db.budgets[k]){ db.budgets[alvo] = (db.budgets[alvo] || 0) + db.budgets[k]; delete db.budgets[k]; }
    delete db.prefs.notifyCats[k];
    for (const d in db.catMemo) if (db.catMemo[d] === k) db.catMemo[d] = alvo;
  }
  delete db.cats[type][k];
  db.tomb['cat:' + type + ':' + k] = Date.now(); // a exclusão vale nos outros aparelhos (ver mergeDb)
  db.cfgMod = Date.now(); applyCats(); save(); render(); openCats();
  toast('Categoria excluída.');
}
function toggleCat(type, k){
  db.cats[type][k] = Object.assign(db.cats[type][k] || {}, {hidden:!CAT_OF[type][k][3]});
  db.cfgMod = Date.now(); applyCats(); save(); render(); openCats();
}
function toggleTab(t){
  const p = db.prefs;
  p.tabsOff = p.tabsOff.includes(t) ? p.tabsOff.filter(x => x !== t) : p.tabsOff.concat(t);
  if (p.tabsOff.includes(state.tab)) state.tab = visTabs()[0];
  db.cfgMod = Date.now(); save(); render(); openSettings();
}
function setPref(k, v){ db.prefs[k] = v; db.cfgMod = Date.now(); save(); applyTheme(); render(); openSettings(); }
function moveTab(i, d){ const t = db.prefs.tabs; [t[i], t[i+d]] = [t[i+d], t[i]]; db.cfgMod = Date.now(); save(); render(); openSettings(); }
// Um tipo de lembrete (preferência da conta). Ligar um tipo com o interruptor do aparelho desligado liga os dois juntos.
function setNotify(on){ setNotifyTipo('notify', on); }
function setNotifyTipo(k, on){
  setPref(k, on);
  if (on && !lembLigados()) ligarLembretes();
}
// Liga os lembretes deste aparelho. No Android 13 ou mais novo, sem a permissão de notificações, pede a permissão: se a
// pessoa permitir, liga; se recusar (ou se o Android não perguntar mais), fica desligado e oferece as configurações.
let lembQuerLigar = false, permRes = null;
async function ligarLembretes(){
  if (demoBloqueia()) return;
  const A = window.Android;
  if (!notifLiberada()){
    lembQuerLigar = true;
    const ok = A.notificacaoBloqueada && A.notificacaoBloqueada() ? false : await new Promise(r => { permRes = r; A.pedirNotificacao(); });
    if (!ok) return lembNegado();
  }
  lembQuerLigar = false;
  setAparelhoLemb(true); scheduleReminders(); compNativo();
  if (settingsOpen) openSettings('lembretes');
  // Com a economia de bateria ligada para o app, o Android atrasa ou corta os lembretes: avisa e oferece a tela de desligar.
  if (A && A.bateriaLivre && !A.bateriaLivre()
    && await ask(comNome('Para os lembretes chegarem na hora, {nome}, é preciso desligar a economia de bateria do app.\n\nNa tela que vai abrir, procure "Cofrim" e escolha "Não otimizar" (ou "Sem restrições").'), 'Abrir a tela'))
    A.bateria();
}
function desligarLembretes(){
  lembQuerLigar = false;
  setAparelhoLemb(false); scheduleReminders();
  if (settingsOpen) openSettings('lembretes');
}
async function lembNegado(){
  if (settingsOpen) openSettings('lembretes');
  if (await ask('Para receber lembretes, permita as notificações do Cofrim.', 'Abrir configurações do Android') && window.Android.abrirConfigNotificacoes) Android.abrirConfigNotificacoes();
  else lembQuerLigar = false;
}
// Resposta do pedido de permissão (chamada pelo lado nativo).
function onPermissaoNotificacao(ok){ const r = permRes; permRes = null; if (r) r(!!ok); }
// Volta ao app (das configurações do Android, por exemplo): confere a permissão de novo e, se a parte de lembretes
// das Configurações estiver aberta, atualiza o aviso dela. Outra tela (ou outra parte das Configurações) fica como está.
function onVoltouApp(){
  if (lembQuerLigar && notifLiberada()) return void ligarLembretes();
  if (settingsOpen && setSec === 'lembretes' && settingsShown()) openSettings('lembretes');
}
// Entrou numa conta que já tem lembretes, com eles desligados neste aparelho: pergunta uma vez, de forma discreta.
function avisoLembretes(){
  if (!(window.Android && Android.lembretes) || demoOn || lembLigados() || !Object.values(lembTipos(db.prefs)).some(Boolean)) return false;
  try { if (localStorage.getItem(LEMB_AVISO)) return false; localStorage.setItem(LEMB_AVISO, '1'); } catch(e){ return false; }
  ask('Seus lembretes estão salvos na conta, mas desligados neste aparelho. Ligar agora?', 'Ligar').then(sim => { if (sim) ligarLembretes(); askLock(); });
  return true;
}
function toggleRemind(d){ const r = db.prefs.reminds; setPref('reminds', r.includes(d) ? r.filter(x => x !== d) : r.concat(d).sort((a,b) => a - b)); }
function toggleNotifyCat(k){ db.prefs.notifyCats[k] = db.prefs.notifyCats[k] === false; setPref('notifyCats', db.prefs.notifyCats); }
