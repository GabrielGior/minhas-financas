// Minhas Finanças — Guia do app: todas as funções, onde ficam e como usar (Configurações › Guia do app).
// Cada item: [função, onde fica, como usar]. Ao criar ou mudar uma função, atualize aqui também.
// "(só no Android)" marca o que não existe na versão web (iPhone e computador).
const GUIA = [
  ['Lançar', [
    ['Novo gasto', 'Botão + (abas Gastos, Ganhos e Investir) ou atalho "+ Gasto" no Resumo', 'Digite o valor (só os números; os centavos entram sozinhos) e escolha a categoria. O resto é opcional e fica em "Mais opções".'],
    ['Novo ganho', 'Aba Ganhos › botão +, ou atalho "+ Ganho" no Resumo', 'Informe o valor e a categoria. Em "Tipo", escolha fixo (todo mês), anual (13º, bônus) ou avulso.'],
    ['Gasto fixo, anual ou assinatura', 'Novo gasto › Mais opções › Tipo', 'Fixo repete todo mês; anual, uma vez por ano. Gastos fixos com nome de serviço (Netflix, academia…) viram assinatura sozinhos; "É uma assinatura?" corrige.'],
    ['Compra parcelada', 'Aba Gastos › Parceladas › botão +', 'Informe o total (ou o valor da parcela), o número de parcelas e quantas já pagou. As parcelas entram sozinhas em cada mês.'],
    ['Repetir um gasto', 'No topo do formulário de novo gasto', 'Os gastos avulsos que você mais repete aparecem como botões; tocar preenche o formulário.'],
    ['Banco, forma de pagamento e dia', 'Novo gasto ou ganho › Mais opções', 'As sugestões de banco aparecem abaixo do campo. O dia da compra define em qual fatura do cartão ela cai.'],
    ['Etiquetas', 'Novo gasto › Mais opções › Etiquetas', 'Escreva palavras separadas por vírgula (ex.: viagem). Depois filtre por etiqueta na lista de lançamentos.'],
    ['Dividir um gasto com alguém', 'Novo gasto › Mais opções › Dividir com', 'Informe o nome e a parte da outra pessoa. O app mostra em Gastos › "A receber" e você marca quando receber.'],
    ['Comprovante por foto', 'Novo gasto › Mais opções › Comprovante', 'Tire uma foto ou escolha da galeria. No Android, o app tenta ler o valor e a data da foto.'],
    ['Lançar escrevendo ou falando', 'Aba Assistente', 'Escreva "mercado 45 nubank crédito" ou toque no microfone (só no Android). O app mostra o que entendeu e pede confirmação.'],
    ['Sugestões pelos avisos do banco (só no Android)', 'Configurações › Lançamento automático', 'Ligue e autorize o acesso às notificações. Compras e Pix avisados pelo banco viram sugestões no Resumo.'],
    ['Importar extrato', 'Aba Gastos › Importar extrato', 'Escolha um arquivo OFX ou CSV do banco, confira os lançamentos e importe.'],
    ['Editar, excluir e desfazer', 'Toque num lançamento; ou deslize para a esquerda', 'Depois de excluir ou salvar uma alteração aparece "Desfazer" por alguns segundos. O que foi excluído fica 30 dias na Lixeira.']]],
  ['Resumo', [
    ['Saldo do ano e gráfico', 'Aba Resumo', 'Troque o ano nas setas. Toque num mês do gráfico para ver ganhos, gastos e saldo.'],
    ['Previsão', 'Aba Resumo › Previsão', 'Mostra quanto sobra ou falta neste mês e nos três seguintes, com fixos, anuais e parcelas.'],
    ['Contas a vencer', 'Aba Resumo (topo)', 'Gastos fixos com dia de vencimento aparecem até 7 dias antes. Toque em "Pago" para marcar.'],
    ['Contas bancárias e transferências', 'Aba Resumo › Contas', 'Cadastre as contas com o saldo inicial. O saldo acompanha os lançamentos feitos com o mesmo nome de banco. "Transferir" passa dinheiro de uma para outra.'],
    ['Planejamento', 'Aba Resumo › Planejamento', 'Reserva de emergência, lista de assinaturas, dívidas e simulador de quitação.'],
    ['Gastos por categoria, banco e pagamento', 'Aba Resumo', 'Gráfico e listas do ano escolhido.'],
    ['Personalizar o Resumo', 'Botão de ajustes no topo do Resumo', 'Escolha quais blocos aparecem e em que ordem. As outras abas têm o mesmo botão.'],
    ['Esconder valores', 'Botão do olho no topo', 'Troca os valores por •••• para abrir o app em público.']]],
  ['Gastos', [
    ['Grupos da lista', 'Aba Gastos › Lançamentos', 'Assinaturas, Fixos e anuais, Parceladas e Ocasionais. Toque no título para fechar um grupo e em "Ordenar grupos" para mudar a ordem.'],
    ['Busca e filtros', 'Aba Gastos › Lançamentos', 'Busque pela descrição e filtre por categoria, banco, pagamento e etiqueta. "Buscar em todos os meses" procura em tudo.'],
    ['Trocar de mês', 'Setas do mês, ou deslize a tela para os lados', 'Toque no nome do mês para escolher outro direto.'],
    ['Marcar conta como paga', 'Deslize o lançamento para a direita, ou toque no círculo', 'Vale para gastos fixos com dia de vencimento.'],
    ['Orçamento por categoria', 'Aba Gastos › Orçamento do mês', 'Defina um limite mensal por categoria. O app avisa a partir de 80% do limite.'],
    ['Faturas e limite do cartão', 'Aba Gastos › Faturas do cartão › Configurar cartões', 'Informe o dia de fechamento, o limite e a conta que paga cada cartão.'],
    ['Comparativo', 'Aba Gastos › Comparativo por categoria', 'Compara o mês com o anterior e com a média de 6 meses.'],
    ['Relatório em PDF e planilha', 'Aba Gastos (fim da tela)', '"Relatório (PDF)" abre a impressão; "Exportar planilha (CSV)" gera um arquivo para Excel.'],
    ['Planilha do Google ligada ao app', 'Aba Gastos (fim da tela) ou Configurações › Dados e ajustes', 'O app cria uma planilha na sua conta. O que você lançar no app aparece nela, e o que escrever nela aparece no app.']]],
  ['Investimentos e metas', [
    ['Cadastrar investimento', 'Aba Investir › botão +', 'Renda fixa: valor, índice (CDI, Selic, IPCA) e percentual. Ações, FIIs e moedas: procure o código e informe quantidade e preço.'],
    ['Aporte, venda e proventos', 'Aba Investir › toque no investimento', 'Registre aportes, vendas (o lucro pode virar ganho) e dividendos.'],
    ['Alerta de preço (só no Android)', 'Aba Investir › ação ou moeda › Alerta de preço', 'Escolha um preço acima ou abaixo; o app avisa por notificação.'],
    ['Metas', 'Aba Investir › Metas', 'Crie a meta com valor e prazo e use "Guardar" para registrar o que já juntou.'],
    ['Taxas de referência', 'Configurações › Dados e ajustes › Taxas de referência', 'CDI, Selic e IPCA vêm do Banco Central; dá para ajustar à mão.']]],
  ['Assistente e notícias', [
    ['Perguntas sobre os seus dados', 'Aba Assistente', 'Pergunte "quanto gastei com mercado este mês?" ou "qual meu saldo?". As contas são feitas no aparelho, sem enviar nada.'],
    ['Notícias (só no Android)', 'Aba Notícias', 'Manchetes de economia; tocar abre a notícia no navegador.']]],
  ['Conta e segurança', [
    ['Sincronização com a conta Google', 'Configurações › Conta e sincronização', 'Os dados ficam na pasta privada do app no seu Google Drive e sincronizam entre os aparelhos. "Versões salvas" restaura uma cópia dos últimos 30 dias.'],
    ['Conta compartilhada (casal ou família)', 'Configurações › Conta compartilhada', '"Convidar alguém" cria a conta e manda o convite; a outra pessoa usa "Tenho um convite". Cada lançamento mostra quem fez.'],
    ['Bloqueio por senha ou biometria (só no Android)', 'Configurações › Ícone e bloqueio', 'Ligue para o app pedir a digital, o rosto ou a senha do celular ao abrir.'],
    ['Backup em arquivo', 'Configurações › Dados e ajustes › Backup em arquivo', '"Exportar" salva um arquivo com tudo; "Importar" troca os dados pelos do arquivo.'],
    ['Lixeira', 'Configurações › Dados e ajustes › Lixeira', 'Restaure lançamentos excluídos nos últimos 30 dias.'],
    ['Arquivar anos antigos', 'Configurações › Dados e ajustes › Anos antigos', 'Tira da sincronização do dia a dia os lançamentos de anos que já passaram; os resumos continuam.'],
    ['Apagar todos os dados', 'Configurações › Dados e ajustes › Apagar tudo', 'Apaga os dados do aparelho e da conta Google. Não dá para desfazer.']]],
  ['Avisos e tela inicial', [
    ['Lembretes de contas (só no Android)', 'Configurações › Lembretes', 'Ligue as notificações e escolha a antecedência. Tire o app da economia de bateria para os avisos chegarem na hora.'],
    ['Widgets (só no Android)', 'Configurações › Widgets', 'Quadros do app na tela inicial: Resumo (você escolhe as linhas), Saldo do mês, Contas a vencer e Porquinho. O porquinho nos outros widgets é opcional.'],
    ['Atualizações', 'Configurações › Procurar atualizações', 'O app procura versão nova ao abrir e mostra o que vem nela. A versão web se atualiza ao recarregar.']]],
  ['Aparência', [
    ['Tema, cor e tamanho do texto', 'Configurações › Aparência', 'Claro, escuro ou automático; cor do app; texto de pequeno a maior.'],
    ['Idioma', 'Configurações › Aparência › Idioma', 'Português, inglês ou espanhol. O assistente entende só português.'],
    ['Modo divertido', 'Configurações › Aparência › Modo divertido', 'Porquinho no Resumo que reage ao seu mês, mais de 100 conquistas, desafio do mês e confete.'],
    ['Abas do menu', 'Configurações › Menu de baixo', 'Esconda abas que não usa e mude a ordem.'],
    ['Categorias', 'Configurações › Dados e ajustes › Categorias', 'Crie, renomeie ou esconda categorias, com ícone e cor.'],
    ['Ícone e nome do app (só no Android)', 'Configurações › Ícone e bloqueio', 'Escolha a cor, o desenho (gráfico ou porquinho) e o nome que aparece na tela inicial.'],
    ['Seu nome e tutorial', 'Configurações › Perfil', 'Troque o nome usado nas mensagens, reveja o tutorial e as novidades da versão.']]]
];
