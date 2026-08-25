import type { TexteFaq } from './index'

export const faq: TexteFaq = {
  titre: 'Perguntas frequentes',
  sous: 'Tudo o que precisa de saber para comprar e vender com tranquilidade.',
  recherche: 'Procurar uma pergunta…',
  aucunTitre: 'Nenhuma resposta encontrada',
  aucunTexte: 'Tente outras palavras, ou contacte-nos diretamente — respondemos depressa.',
  contactTitre: 'Não encontrou a sua resposta?',
  contactTexte: 'A nossa equipa está aqui para ajudar. Escreva-nos e responderemos rapidamente.',
  contactBouton: 'Fale connosco',
  sections: [
    {
      titre: 'Geral',
      items: [
        {
          q: 'O que é o Chap.ci?',
          r: 'O Chap.ci é o site de classificados 100% marfinense. Compra e vende chap-chap (rapidamente) em toda a Costa do Marfim: carros, telemóveis, imóveis, moda, alimentação, serviços e muito mais.',
        },
        {
          q: 'É gratuito?',
          r: 'Sim — a inscrição, a publicação de anúncios e as mensagens são totalmente gratuitas. Pode apoiar a plataforma com um donativo por Mobile Money se quiser, mas nada é obrigatório.',
        },
        {
          q: 'Preciso de instalar uma aplicação?',
          r: 'Não. O Chap.ci funciona no seu navegador, em telemóvel, tablet e computador. Também pode adicioná-lo ao ecrã inicial para o usar como uma aplicação: iPhone (Safari → Partilhar → « Adicionar ao ecrã principal ») ou Android (Chrome → menu ⋮ → « Instalar aplicação »).',
        },
        {
          q: 'O site, a instalação no meu telemóvel e a aplicação são a mesma coisa?',
          r: 'Sim, é o mesmo Chap.ci, com os mesmos anúncios e a mesma conta. Três formas de aceder: o site, no navegador; a instalação no ecrã inicial, que lhe dá um ícone como uma verdadeira aplicação sem descarregar nada; e a aplicação Android, em preparação na Play Store. Até lá, a instalação a partir do site é mais rápida e pesa menos nos seus dados — e recebe as novidades sem esperar por uma atualização.',
        },
        {
          q: 'Em que cidades funciona o Chap.ci?',
          r: 'Em toda a Costa do Marfim. Pode filtrar os anúncios por distrito, região, cidade e comuna — de Abidjan a Bouaké, San-Pédro, Yamoussoukro, Korhogo…',
        },
      ],
    },
    {
      titre: 'A minha conta',
      items: [
        {
          q: 'Como criar uma conta?',
          r: 'Clique em « Iniciar sessão / Criar uma conta » e inscreva-se com o seu e-mail, o seu telefone, ou com Google/Apple. É gratuito e imediato.',
        },
        {
          q: 'Porque preciso de uma conta para publicar um anúncio?',
          r: 'Uma conta permite aos compradores identificá-lo e escrever-lhe com confiança, e limita os perfis falsos e os anúncios fraudulentos. Criá-la é gratuito e demora menos de um minuto. Para comprar ou escrever a um vendedor, pelo contrário, não é pedida nenhuma conta.',
        },
        {
          q: 'Esqueci a minha palavra-passe, o que fazer?',
          r: 'Na página de início de sessão, clique em « Esqueceu a palavra-passe? » e siga as instruções recebidas por e-mail para escolher uma nova.',
        },
        {
          q: 'Como eliminar a minha conta?',
          r: 'Vá a Conta → Definições → Eliminar a minha conta. É pedida uma confirmação por palavra-passe. A eliminação é definitiva: os seus anúncios e dados são apagados.',
        },
        {
          q: 'Como proteger a minha conta?',
          r: 'Ative a autenticação dupla (2FA) em Conta → Definições e nunca partilhe a sua palavra-passe. O Chap.ci nunca lhe pedirá a palavra-passe por mensagem.',
        },
      ],
    },
    {
      titre: 'Comprar',
      items: [
        {
          q: 'Como contactar um vendedor?',
          r: 'Abra o anúncio e clique em « Contactar o vendedor ». Conversa pelas mensagens integradas, sem revelar o seu número de telefone.',
        },
        {
          q: 'Posso negociar o preço?',
          r: 'Sim, se o anúncio indicar « negociável ». Proponha o seu preço com educação nas mensagens. Seja cortês: uma boa conversa fecha muitas vezes um bom negócio.',
        },
        {
          q: 'Como pagar em segurança?',
          r: 'Prefira o pagamento na entrega ou a entrega em mão num lugar público. Verifique sempre o artigo antes de pagar. Evite enviar dinheiro adiantado a uma pessoa que não conhece.',
        },
        {
          q: 'Como funciona a entrega?',
          r: 'A entrega é combinada diretamente entre si e o vendedor nas mensagens: entrega em mão (idealmente num lugar público e movimentado) ou envio, se o vendedor o indicou no anúncio (selo « Entrega »). Combinem com antecedência o lugar, a hora e os eventuais custos de entrega. O Chap.ci não assegura o transporte e não é parte na transação: prefira pagar no momento da entrega.',
        },
        {
          q: 'Como confirmar uma compra e deixar uma avaliação?',
          r: 'Como a transação se faz de mão em mão (Mobile Money, dinheiro…), é você quem a confirma. Na conversa com o vendedor: toque em « Comprei » e depois em « Bem recebido » quando tiver o artigo. Pode então avaliar o vendedor ⭐. O vendedor, por seu lado, pode avaliá-lo como comprador. Se se esquecer, enviamos-lhe um pequeno lembrete por e-mail.',
        },
        {
          q: 'Como guardar uma pesquisa para ser avisado?',
          r: 'No explorador, ajuste os filtros e clique em « Criar um alerta ». Receberá um e-mail assim que um novo anúncio corresponder. Encontre os seus alertas em Conta → Definições → Os meus alertas.',
        },
      ],
    },
    {
      titre: 'Vender',
      items: [
        {
          q: 'Como publicar um anúncio?',
          r: 'Clique em Publicar, adicione fotos, escolha a categoria, preencha o título, o preço e a descrição, e publique. O formulário adapta-se à categoria (marca, ano, área…) para anúncios mais precisos.',
        },
        {
          q: 'Quantas fotos posso adicionar e como fazê-las bem?',
          r: 'São exigidas pelo menos três fotos para publicar, e cinco no máximo. Tire-as você mesmo, com boa luz e de ângulos diferentes — é o que distingue um anúncio verdadeiro de um copiado, e evita discussões quando o comprador chega. Mostre os defeitos, se existirem: inspira mais confiança do que escondê-los. A primeira foto serve de capa e atrai muitos mais compradores. As imagens são otimizadas automaticamente no envio.',
        },
        {
          q: 'Como modificar, ocultar ou eliminar o meu anúncio?',
          r: 'Em Conta → Os meus anúncios, cada anúncio pode ser modificado, ocultado (pausa sem o eliminar) e novamente exibido, ou eliminado definitivamente.',
        },
        {
          q: 'Como vender mais depressa?',
          r: 'Ponha um preço justo, uma descrição honesta e completa, boas fotos, e responda depressa às mensagens. Um vendedor reativo e bem avaliado inspira confiança e fecha negócio mais depressa.',
        },
      ],
    },
    {
      titre: 'Segurança e confiança',
      items: [
        {
          q: 'Como evitar as burlas?',
          r: 'Nunca pague adiantado a um desconhecido, desconfie de preços anormalmente baixos, encontre-se num lugar público, verifique o artigo antes de pagar e mantenha as conversas nas mensagens do Chap.ci. Em caso de dúvida, não vá mais longe.',
        },
        {
          q: 'Como denunciar um anúncio ou um utilizador suspeito?',
          r: 'Em cada anúncio, use o botão « Denunciar » e indique o motivo. A nossa equipa de moderação examina as denúncias. Um anúncio muito denunciado é automaticamente ocultado enquanto se verifica.',
        },
        {
          q: 'O que fazer em caso de litígio com um comprador ou um vendedor?',
          r: 'Antes de tudo mantenha a calma, e toda a conversa nas mensagens do Chap.ci (serve de prova). Tente chegar a um acordo amigável. Se a pessoa não cumprir os compromissos, denuncie o anúncio ou o perfil e escreva-nos para contact@chap.ci com os detalhes. O Chap.ci é um intermediário técnico e não é parte na transação: não podemos reembolsar, mas podemos sancionar um membro de má-fé. Em caso de burla comprovada, apresente queixa à PLCC (plataforma marfinense de luta contra a cibercriminalidade).',
        },
        {
          q: 'Para que servem as avaliações?',
          r: 'Depois de uma transação, o comprador pode deixar uma avaliação ao vendedor. As avaliações verificadas ajudam toda a comunidade a comprar com confiança. Um bom histórico de avaliações valoriza o seu perfil de vendedor.',
        },
      ],
    },
    {
      titre: 'Pagamento e donativo',
      items: [
        {
          q: 'Que meios de pagamento são aceites?',
          r: 'Os pagamentos fazem-se diretamente entre comprador e vendedor, geralmente por Mobile Money (Orange Money, MTN MoMo, Wave), em dinheiro na entrega, ou em mão. O Chap.ci não cobra nada sobre as suas vendas.',
        },
        {
          q: 'Como apoiar o Chap.ci?',
          r: 'O Chap.ci é gratuito e independente. Pode apoiar-nos com um donativo por Mobile Money na página « Fazer um donativo ». Obrigado a todos os que ajudam a plataforma a crescer 🇨🇮',
        },
      ],
    },
  ],
}
