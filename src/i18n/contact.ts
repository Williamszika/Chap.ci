// Traductions de la page « Nous contacter » (src/pages/Contact.tsx).
//
// Le français vit dans la page ; ce fichier n'est téléchargé qu'avec `?lang=`.
//
// ATTENTION aux sujets : la valeur ENVOYÉE au serveur reste le libellé
// français (l'équipe lit les messages en français, et `subjectFromQuery`
// présélectionne par ces mêmes valeurs). `sujets` ne sert qu'à l'AFFICHAGE,
// dans le même ordre que `SUBJECTS` de la page — comme les catégories de
// l'application, stockées en français et traduites à l'écran.

export type TexteContact = {
  titre: string
  sous: string
  compteTitre: string
  compteTexte: string
  compteBouton: string
  envoyeTitre: string
  envoyeTexte: string
  envoyeEncore: string
  nom: string
  email: string
  sujet: string
  message: string
  messageExemple: string
  envoyer: string
  erreurMessage: string
  erreurEmail: string
  erreurEnvoi: string
  emailCarte: string
  /** Affichage seulement — même ordre que `SUBJECTS` (valeurs françaises). */
  sujets: string[]
}

export const traductions: Record<string, TexteContact> = {
  en: {
    titre: 'Contact us',
    sous: 'A question, an issue? We’ll take care of it for you.',
    compteTitre: 'Do you have an account?',
    compteTexte:
      'Write to us from the in-app support: we can see your listings, the whole exchange stays in one place, and you get the reply in your notifications.',
    compteBouton: 'Contact the team',
    envoyeTitre: 'Message sent!',
    envoyeTexte: 'Thank you, we’ve received your message. Our team will get back to you shortly.',
    envoyeEncore: 'Send another message',
    nom: 'Your name',
    email: 'Email',
    sujet: 'Subject',
    message: 'Message',
    messageExemple: 'Hello, I would like…',
    envoyer: 'Send the message',
    erreurMessage: 'Please write your message.',
    erreurEmail: 'Invalid email address.',
    erreurEnvoi: 'Sending failed for now. You can also write directly to contact@chap.ci.',
    emailCarte: 'Email',
    sujets: [
      'General question',
      'Report a problem',
      'Help & support (account, payment)',
      'Partnership / press',
      'Suggestion',
    ],
  },
  es: {
    titre: 'Contáctenos',
    sous: '¿Una pregunta, un problema? Nos encargamos por usted.',
    compteTitre: '¿Tiene una cuenta?',
    compteTexte:
      'Escríbanos desde la asistencia de la aplicación: vemos sus anuncios, la conversación queda en un solo lugar y recibe la respuesta en sus notificaciones.',
    compteBouton: 'Contactar al equipo',
    envoyeTitre: '¡Mensaje enviado!',
    envoyeTexte: 'Gracias, hemos recibido su mensaje. Nuestro equipo le responderá pronto.',
    envoyeEncore: 'Enviar otro mensaje',
    nom: 'Su nombre',
    email: 'Correo electrónico',
    sujet: 'Asunto',
    message: 'Mensaje',
    messageExemple: 'Hola, quisiera…',
    envoyer: 'Enviar el mensaje',
    erreurMessage: 'Escriba su mensaje, por favor.',
    erreurEmail: 'Dirección de correo no válida.',
    erreurEnvoi: 'No se pudo enviar por el momento. También puede escribir directamente a contact@chap.ci.',
    emailCarte: 'Correo',
    sujets: [
      'Pregunta general',
      'Señalar un problema',
      'Ayuda y soporte (cuenta, pago)',
      'Colaboración / prensa',
      'Sugerencia',
    ],
  },
  pt: {
    titre: 'Fale connosco',
    sous: 'Uma pergunta, um problema? Tratamos disso por si.',
    compteTitre: 'Tem uma conta?',
    compteTexte:
      'Escreva-nos a partir da assistência na aplicação: vemos os seus anúncios, a conversa fica num só lugar e recebe a resposta nas suas notificações.',
    compteBouton: 'Contactar a equipa',
    envoyeTitre: 'Mensagem enviada!',
    envoyeTexte: 'Obrigado, recebemos a sua mensagem. A nossa equipa responderá em breve.',
    envoyeEncore: 'Enviar outra mensagem',
    nom: 'O seu nome',
    email: 'E-mail',
    sujet: 'Assunto',
    message: 'Mensagem',
    messageExemple: 'Olá, gostaria de…',
    envoyer: 'Enviar a mensagem',
    erreurMessage: 'Escreva a sua mensagem, por favor.',
    erreurEmail: 'Endereço de e-mail inválido.',
    erreurEnvoi: 'Envio impossível de momento. Também pode escrever diretamente para contact@chap.ci.',
    emailCarte: 'E-mail',
    sujets: [
      'Pergunta geral',
      'Comunicar um problema',
      'Ajuda e suporte (conta, pagamento)',
      'Parceria / imprensa',
      'Sugestão',
    ],
  },
  ar: {
    titre: 'اتصلوا بنا',
    sous: 'سؤال أو مشكلة؟ نتكفل بالأمر من أجلكم.',
    compteTitre: 'هل لديكم حساب؟',
    compteTexte:
      'راسلونا من المساعدة داخل التطبيق: نرى إعلاناتكم، ويبقى الحوار في مكان واحد، وتصلكم الإجابة في إشعاراتكم.',
    compteBouton: 'مراسلة الفريق',
    envoyeTitre: 'تم إرسال الرسالة!',
    envoyeTexte: 'شكرًا، لقد استلمنا رسالتكم. سيعود إليكم فريقنا قريبًا.',
    envoyeEncore: 'إرسال رسالة أخرى',
    nom: 'اسمكم',
    email: 'البريد الإلكتروني',
    sujet: 'الموضوع',
    message: 'الرسالة',
    messageExemple: 'مرحبًا، أودّ…',
    envoyer: 'إرسال الرسالة',
    erreurMessage: 'يرجى كتابة رسالتكم.',
    erreurEmail: 'عنوان البريد الإلكتروني غير صالح.',
    erreurEnvoi: 'تعذّر الإرسال حاليًا. يمكنكم أيضًا الكتابة مباشرة إلى contact@chap.ci.',
    emailCarte: 'البريد الإلكتروني',
    sujets: [
      'سؤال عام',
      'الإبلاغ عن مشكلة',
      'مساعدة ودعم (الحساب، الدفع)',
      'شراكة / صحافة',
      'اقتراح',
    ],
  },
  zh: {
    titre: '联系我们',
    sous: '有疑问或遇到问题？我们来为您解决。',
    compteTitre: '您有账户吗？',
    compteTexte:
      '请通过应用内客服给我们留言：我们能看到您的商品信息，对话集中在同一处，回复会直接送达您的通知。',
    compteBouton: '联系团队',
    envoyeTitre: '消息已发送！',
    envoyeTexte: '谢谢，我们已收到您的消息。我们的团队会尽快回复您。',
    envoyeEncore: '再发一条消息',
    nom: '您的姓名',
    email: '电子邮箱',
    sujet: '主题',
    message: '内容',
    messageExemple: '您好，我想……',
    envoyer: '发送消息',
    erreurMessage: '请填写您的消息内容。',
    erreurEmail: '电子邮箱地址无效。',
    erreurEnvoi: '暂时无法发送。您也可以直接写信至 contact@chap.ci。',
    emailCarte: '邮箱',
    sujets: ['一般咨询', '举报问题', '帮助与支持（账户、支付）', '合作 / 媒体', '建议'],
  },
}
