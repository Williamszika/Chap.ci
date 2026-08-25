import 'package:flutter/widgets.dart';

/// Les traductions de l'interface : clé → { code langue → texte }.
///
/// Le français est la référence. Toute clé absente d'une langue retombe sur le
/// français ; une clé inconnue s'affiche telle quelle (visible pendant le
/// développement, jamais silencieuse).
///
/// On migre l'application écran par écran vers ces clés. Ce fichier couvre pour
/// l'instant la barre de navigation et l'écran Paramètres ; les écrans non
/// encore migrés restent en français quelle que soit la langue choisie.
///
/// NOTE : les traductions arabe et chinoise gagneraient à être relues par des
/// locuteurs natifs avant une diffusion large.
const Map<String, Map<String, String>> _t = {
  // Navigation & actions globales
  'nav.accueil': {'fr': "Accueil", 'en': "Home", 'es': "Inicio", 'pt': "Início", 'ar': "الرئيسية", 'zh': "首页"},
  'nav.explorer': {'fr': "Explorer", 'en': "Explore", 'es': "Explorar", 'pt': "Explorar", 'ar': "استكشاف", 'zh': "探索"},
  'nav.messages': {'fr': "Messages", 'en': "Messages", 'es': "Mensajes", 'pt': "Mensagens", 'ar': "الرسائل", 'zh': "消息"},
  'nav.compte': {'fr': "Compte", 'en': "Account", 'es': "Cuenta", 'pt': "Conta", 'ar': "الحساب", 'zh': "账户"},
  'action.publier': {'fr': "Publier", 'en': "Post", 'es': "Publicar", 'pt': "Publicar", 'ar': "نشر", 'zh': "发布"},
  'action.annuler': {'fr': "Annuler", 'en': "Cancel", 'es': "Cancelar", 'pt': "Cancelar", 'ar': "إلغاء", 'zh': "取消"},
  'action.modifier': {'fr': "Modifier", 'en': "Change", 'es': "Cambiar", 'pt': "Alterar", 'ar': "تغيير", 'zh': "修改"},
  'login.connectezVous': {'fr': "Connectez-vous pour publier une annonce.", 'en': "Sign in to post a listing.", 'es': "Inicia sesión para publicar un anuncio.", 'pt': "Inicie sessão para publicar um anúncio.", 'ar': "سجّل الدخول لنشر إعلان.", 'zh': "登录后即可发布信息。"},

  // Écran Compte (barre du haut)
  'compte.titre': {'fr': "Mon compte", 'en': "My account", 'es': "Mi cuenta", 'pt': "Minha conta", 'ar': "حسابي", 'zh': "我的账户"},
  'compte.connexion': {'fr': "Connexion", 'en': "Sign in", 'es': "Iniciar sesión", 'pt': "Entrar", 'ar': "تسجيل الدخول", 'zh': "登录"},

  // Écran Paramètres
  'param.titre': {'fr': "Paramètres", 'en': "Settings", 'es': "Ajustes", 'pt': "Definições", 'ar': "الإعدادات", 'zh': "设置"},

  'section.administration': {'fr': "Administration", 'en': "Administration", 'es': "Administración", 'pt': "Administração", 'ar': "الإدارة", 'zh': "管理"},
  'item.tableauBord': {'fr': "Tableau de bord", 'en': "Dashboard", 'es': "Panel", 'pt': "Painel", 'ar': "لوحة التحكم", 'zh': "仪表板"},

  'section.monActivite': {'fr': "Mon activité", 'en': "My activity", 'es': "Mi actividad", 'pt': "Minha atividade", 'ar': "نشاطي", 'zh': "我的动态"},
  'item.mesFavoris': {'fr': "Mes favoris", 'en': "My favorites", 'es': "Mis favoritos", 'pt': "Meus favoritos", 'ar': "المفضلة", 'zh': "我的收藏"},
  'item.mesFavoris.sous': {'fr': "Les annonces que vous avez enregistrées", 'en': "Listings you've saved", 'es': "Los anuncios que has guardado", 'pt': "Os anúncios que guardou", 'ar': "الإعلانات التي حفظتها", 'zh': "您收藏的信息"},

  'section.compte': {'fr': "Compte", 'en': "Account", 'es': "Cuenta", 'pt': "Conta", 'ar': "الحساب", 'zh': "账户"},
  'item.profil': {'fr': "Profil", 'en': "Profile", 'es': "Perfil", 'pt': "Perfil", 'ar': "الملف الشخصي", 'zh': "个人资料"},
  'item.profil.sous': {'fr': "Nom, photo, bio, téléphone", 'en': "Name, photo, bio, phone", 'es': "Nombre, foto, biografía, teléfono", 'pt': "Nome, foto, bio, telefone", 'ar': "الاسم، الصورة، النبذة، الهاتف", 'zh': "姓名、照片、简介、电话"},
  'item.email': {'fr': "Adresse e-mail", 'en': "Email address", 'es': "Correo electrónico", 'pt': "Endereço de e-mail", 'ar': "البريد الإلكتروني", 'zh': "电子邮箱"},
  'email.confirmee': {'fr': "confirmée", 'en': "confirmed", 'es': "confirmado", 'pt': "confirmado", 'ar': "مؤكَّد", 'zh': "已确认"},
  'email.aConfirmer': {'fr': "à confirmer", 'en': "to confirm", 'es': "por confirmar", 'pt': "a confirmar", 'ar': "بحاجة إلى تأكيد", 'zh': "待确认"},
  'item.motDePasse': {'fr': "Mot de passe", 'en': "Password", 'es': "Contraseña", 'pt': "Palavra-passe", 'ar': "كلمة المرور", 'zh': "密码"},
  'item.doubleAuth': {'fr': "Double authentification", 'en': "Two-factor authentication", 'es': "Autenticación de dos factores", 'pt': "Autenticação de dois fatores", 'ar': "المصادقة الثنائية", 'zh': "双重认证"},
  'etat.activee': {'fr': "Activée", 'en': "Enabled", 'es': "Activada", 'pt': "Ativada", 'ar': "مُفعّلة", 'zh': "已启用"},
  'etat.desactivee': {'fr': "Désactivée", 'en': "Disabled", 'es': "Desactivada", 'pt': "Desativada", 'ar': "معطّلة", 'zh': "未启用"},

  'section.notifications': {'fr': "Notifications", 'en': "Notifications", 'es': "Notificaciones", 'pt': "Notificações", 'ar': "الإشعارات", 'zh': "通知"},
  'notif.messages': {'fr': "Messages reçus", 'en': "Incoming messages", 'es': "Mensajes recibidos", 'pt': "Mensagens recebidas", 'ar': "الرسائل الواردة", 'zh': "收到的消息"},
  'notif.favoris': {'fr': "Favoris & avis", 'en': "Favorites & reviews", 'es': "Favoritos y reseñas", 'pt': "Favoritos e avaliações", 'ar': "المفضلة والتقييمات", 'zh': "收藏与评价"},
  'notif.email': {'fr': "Rappels par e-mail", 'en': "Email reminders", 'es': "Recordatorios por correo", 'pt': "Lembretes por e-mail", 'ar': "تذكيرات بالبريد الإلكتروني", 'zh': "邮件提醒"},
  'notif.email.sous': {'fr': "Quand vous n’êtes pas joignable autrement", 'en': "When you can't be reached otherwise", 'es': "Cuando no se te puede localizar de otro modo", 'pt': "Quando não é possível contactá-lo de outra forma", 'ar': "عندما يتعذّر الوصول إليك بطريقة أخرى", 'zh': "当无法通过其他方式联系到您时"},

  'section.preferences': {'fr': "Préférences", 'en': "Preferences", 'es': "Preferencias", 'pt': "Preferências", 'ar': "التفضيلات", 'zh': "偏好设置"},
  'item.langue': {'fr': "Langue", 'en': "Language", 'es': "Idioma", 'pt': "Idioma", 'ar': "اللغة", 'zh': "语言"},
  'langue.choisir': {'fr': "Choisir la langue", 'en': "Choose language", 'es': "Elegir idioma", 'pt': "Escolher idioma", 'ar': "اختر اللغة", 'zh': "选择语言"},

  'section.partager': {'fr': "Faire connaître Chap.ci", 'en': "Spread the word", 'es': "Dar a conocer Chap.ci", 'pt': "Divulgar o Chap.ci", 'ar': "انشر خبر Chap.ci", 'zh': "推荐 Chap.ci"},
  'item.partager': {'fr': "Partager l’application", 'en': "Share the app", 'es': "Compartir la aplicación", 'pt': "Partilhar a aplicação", 'ar': "مشاركة التطبيق", 'zh': "分享应用"},
  'item.partager.sous': {'fr': "Envoyer le lien à un ami", 'en': "Send the link to a friend", 'es': "Envía el enlace a un amigo", 'pt': "Envie o link a um amigo", 'ar': "أرسل الرابط إلى صديق", 'zh': "把链接发给朋友"},
  'item.noter': {'fr': "Noter l'application", 'en': "Rate the app", 'es': "Valorar la aplicación", 'pt': "Avaliar a aplicação", 'ar': "قيّم التطبيق", 'zh': "为应用评分"},
  'item.noter.sous': {'fr': "Laisser un avis sur le Play Store", 'en': "Leave a review on the Play Store", 'es': "Deja una reseña en Play Store", 'pt': "Deixe uma avaliação na Play Store", 'ar': "اترك تقييماً على Play Store", 'zh': "在 Play Store 上留下评价"},

  'section.aide': {'fr': "Aide & informations", 'en': "Help & information", 'es': "Ayuda e información", 'pt': "Ajuda e informações", 'ar': "المساعدة والمعلومات", 'zh': "帮助与信息"},
  'item.aide': {'fr': "Aide", 'en': "Help", 'es': "Ayuda", 'pt': "Ajuda", 'ar': "المساعدة", 'zh': "帮助"},
  'item.faq': {'fr': "Questions fréquentes (FAQ)", 'en': "Frequently asked questions (FAQ)", 'es': "Preguntas frecuentes (FAQ)", 'pt': "Perguntas frequentes (FAQ)", 'ar': "الأسئلة الشائعة", 'zh': "常见问题"},
  'item.contact': {'fr': "Nous contacter", 'en': "Contact us", 'es': "Contáctanos", 'pt': "Contacte-nos", 'ar': "اتصل بنا", 'zh': "联系我们"},
  'item.apropos': {'fr': "À propos", 'en': "About", 'es': "Acerca de", 'pt': "Sobre", 'ar': "حول", 'zh': "关于"},
  'item.conditions': {'fr': "Conditions d’utilisation", 'en': "Terms of use", 'es': "Términos de uso", 'pt': "Termos de utilização", 'ar': "شروط الاستخدام", 'zh': "使用条款"},
  'item.confidentialite': {'fr': "Confidentialité", 'en': "Privacy", 'es': "Privacidad", 'pt': "Privacidade", 'ar': "الخصوصية", 'zh': "隐私"},

  'section.zoneSensible': {'fr': "Zone sensible", 'en': "Danger zone", 'es': "Zona sensible", 'pt': "Zona sensível", 'ar': "منطقة حسّاسة", 'zh': "敏感操作"},
  'item.deconnexion': {'fr': "Se déconnecter", 'en': "Sign out", 'es': "Cerrar sesión", 'pt': "Terminar sessão", 'ar': "تسجيل الخروج", 'zh': "退出登录"},
  'item.supprimer': {'fr': "Supprimer mon compte", 'en': "Delete my account", 'es': "Eliminar mi cuenta", 'pt': "Eliminar a minha conta", 'ar': "حذف حسابي", 'zh': "删除我的账户"},
  'dialog.deconnexion.titre': {'fr': "Se déconnecter ?", 'en': "Sign out?", 'es': "¿Cerrar sesión?", 'pt': "Terminar sessão?", 'ar': "تسجيل الخروج؟", 'zh': "退出登录？"},
  'dialog.deconnexion.corps': {'fr': "Vous devrez ressaisir votre mot de passe pour revenir.", 'en': "You'll need to enter your password to return.", 'es': "Tendrás que volver a introducir tu contraseña para regresar.", 'pt': "Terá de introduzir a sua palavra-passe para voltar.", 'ar': "ستحتاج إلى إدخال كلمة المرور للعودة.", 'zh': "重新登录时需要再次输入密码。"},

  // Accueil
  'action.reessayer': {'fr': "Réessayer", 'en': "Try again", 'es': "Reintentar", 'pt': "Tentar novamente", 'ar': "إعادة المحاولة", 'zh': "重试"},
  'home.recherche': {'fr': "Rechercher une annonce…", 'en': "Search for a listing…", 'es': "Buscar un anuncio…", 'pt': "Procurar um anúncio…", 'ar': "ابحث عن إعلان…", 'zh': "搜索商品…"},
  'home.toutes': {'fr': "Toutes les annonces", 'en': "All listings", 'es': "Todos los anuncios", 'pt': "Todos os anúncios", 'ar': "كل الإعلانات", 'zh': "全部商品"},
  'home.filtrer': {'fr': "Filtrer", 'en': "Filter", 'es': "Filtrar", 'pt': "Filtrar", 'ar': "تصفية", 'zh': "筛选"},
  'home.vide': {'fr': "Aucune annonce pour le moment. Revenez bientôt !", 'en': "No listings yet. Check back soon!", 'es': "Aún no hay anuncios. ¡Vuelve pronto!", 'pt': "Ainda não há anúncios. Volte em breve!", 'ar': "لا توجد إعلانات بعد. عُد قريباً!", 'zh': "暂无商品，请稍后再来！"},
  'home.erreur': {'fr': "Impossible de charger les annonces.", 'en': "Couldn't load listings.", 'es': "No se pudieron cargar los anuncios.", 'pt': "Não foi possível carregar os anúncios.", 'ar': "تعذّر تحميل الإعلانات.", 'zh': "无法加载商品。"},

  // Détail d'une annonce
  'annonce.titre': {'fr': "Annonce", 'en': "Listing", 'es': "Anuncio", 'pt': "Anúncio", 'ar': "إعلان", 'zh': "商品"},
  'annonce.details': {'fr': "Détails", 'en': "Details", 'es': "Detalles", 'pt': "Detalhes", 'ar': "التفاصيل", 'zh': "详情"},
  'annonce.description': {'fr': "Description", 'en': "Description", 'es': "Descripción", 'pt': "Descrição", 'ar': "الوصف", 'zh': "描述"},
  'annonce.sansDescription': {'fr': "Aucune description.", 'en': "No description.", 'es': "Sin descripción.", 'pt': "Sem descrição.", 'ar': "لا يوجد وصف.", 'zh': "暂无描述。"},
  'annonce.negociable': {'fr': "négociable", 'en': "negotiable", 'es': "negociable", 'pt': "negociável", 'ar': "قابل للتفاوض", 'zh': "可议价"},
  'annonce.prixAffiche': {'fr': "prix affiché", 'en': "listed price", 'es': "precio indicado", 'pt': "preço indicado", 'ar': "السعر المعروض", 'zh': "标价"},
  'annonce.vendu': {'fr': "VENDU", 'en': "SOLD", 'es': "VENDIDO", 'pt': "VENDIDO", 'ar': "مُباع", 'zh': "已售"},
  'annonce.etat': {'fr': "État", 'en': "Condition", 'es': "Estado", 'pt': "Estado", 'ar': "الحالة", 'zh': "成色"},
  'annonce.livraison': {'fr': "Livraison", 'en': "Delivery", 'es': "Envío", 'pt': "Entrega", 'ar': "التوصيل", 'zh': "配送"},
  'annonce.possible': {'fr': "Possible", 'en': "Available", 'es': "Posible", 'pt': "Possível", 'ar': "متاح", 'zh': "可以"},
  'annonce.surPlace': {'fr': "Sur place", 'en': "In person", 'es': "En persona", 'pt': "No local", 'ar': "استلام شخصي", 'zh': "自取"},
  'cond.neuf': {'fr': "Neuf", 'en': "New", 'es': "Nuevo", 'pt': "Novo", 'ar': "جديد", 'zh': "全新"},
  'cond.occasion': {'fr': "Occasion", 'en': "Used", 'es': "Usado", 'pt': "Usado", 'ar': "مستعمل", 'zh': "二手"},
  'bool.oui': {'fr': "Oui", 'en': "Yes", 'es': "Sí", 'pt': "Sim", 'ar': "نعم", 'zh': "是"},
  'bool.non': {'fr': "Non", 'en': "No", 'es': "No", 'pt': "Não", 'ar': "لا", 'zh': "否"},
  'action.partager': {'fr': "Partager", 'en': "Share", 'es': "Compartir", 'pt': "Partilhar", 'ar': "مشاركة", 'zh': "分享"},
  'action.contacter': {'fr': "Contacter", 'en': "Contact", 'es': "Contactar", 'pt': "Contactar", 'ar': "تواصل", 'zh': "联系"},
  'action.compris': {'fr': "J’ai compris", 'en': "Got it", 'es': "Entendido", 'pt': "Entendido", 'ar': "حسناً", 'zh': "知道了"},
  'etat.venduCourt': {'fr': "Vendu", 'en': "Sold", 'es': "Vendido", 'pt': "Vendido", 'ar': "مُباع", 'zh': "已售"},
  'vendeur.voir': {'fr': "Voir ses annonces et ses infos", 'en': "See their listings and info", 'es': "Ver sus anuncios e información", 'pt': "Ver os seus anúncios e informações", 'ar': "اطّلع على إعلاناته ومعلوماته", 'zh': "查看其商品和信息"},
  'vendeur.sur': {'fr': "Vendeur sur Chap.ci", 'en': "Seller on Chap.ci", 'es': "Vendedor en Chap.ci", 'pt': "Vendedor no Chap.ci", 'ar': "بائع على Chap.ci", 'zh': "Chap.ci 上的卖家"},
  'annonce.contacterConnexion': {'fr': "Connectez-vous depuis l’onglet Compte pour contacter le vendeur.", 'en': "Sign in from the Account tab to contact the seller.", 'es': "Inicia sesión desde la pestaña Cuenta para contactar al vendedor.", 'pt': "Inicie sessão no separador Conta para contactar o vendedor.", 'ar': "سجّل الدخول من تبويب الحساب للتواصل مع البائع.", 'zh': "请在“账户”标签登录后联系卖家。"},
  'annonce.contacterImpossible': {'fr': "Ce vendeur ne peut pas être contacté dans l’application pour le moment.", 'en': "This seller can't be contacted in the app right now.", 'es': "No se puede contactar a este vendedor en la app por ahora.", 'pt': "Este vendedor não pode ser contactado na aplicação de momento.", 'ar': "لا يمكن التواصل مع هذا البائع في التطبيق حالياً.", 'zh': "目前无法在应用内联系该卖家。"},
  'annonce.proprAnnonce': {'fr': "C’est votre propre annonce.", 'en': "This is your own listing.", 'es': "Este es tu propio anuncio.", 'pt': "Este é o seu próprio anúncio.", 'ar': "هذا إعلانك أنت.", 'zh': "这是您自己的商品。"},
  'annonce.partageEchec': {'fr': "Le partage n’a pas pu s’ouvrir. Voici le lien de l’annonce : ", 'en': "Sharing couldn't open. Here's the listing link: ", 'es': "No se pudo abrir el menú de compartir. Aquí tienes el enlace: ", 'pt': "Não foi possível abrir a partilha. Aqui está o link: ", 'ar': "تعذّر فتح المشاركة. إليك رابط الإعلان: ", 'zh': "无法打开分享。这是商品链接："},

  // Connexion / inscription
  'login.bonRetour': {'fr': "Bon retour 👋", 'en': "Welcome back 👋", 'es': "Bienvenido de nuevo 👋", 'pt': "Bem-vindo de volta 👋", 'ar': "مرحباً بعودتك 👋", 'zh': "欢迎回来 👋"},
  'login.sousTitre': {'fr': "Connectez-vous pour publier et suivre vos annonces.", 'en': "Sign in to post and track your listings.", 'es': "Inicia sesión para publicar y seguir tus anuncios.", 'pt': "Inicie sessão para publicar e acompanhar os seus anúncios.", 'ar': "سجّل الدخول لنشر ومتابعة إعلاناتك.", 'zh': "登录以发布和管理您的商品。"},
  'form.emailInvalide': {'fr': "E-mail invalide", 'en': "Invalid email", 'es': "Correo no válido", 'pt': "E-mail inválido", 'ar': "بريد إلكتروني غير صالح", 'zh': "邮箱无效"},
  'form.min6': {'fr': "Au moins 6 caractères", 'en': "At least 6 characters", 'es': "Al menos 6 caracteres", 'pt': "Pelo menos 6 caracteres", 'ar': "6 أحرف على الأقل", 'zh': "至少 6 个字符"},
  'login.oublie': {'fr': "Mot de passe oublié ?", 'en': "Forgot password?", 'es': "¿Olvidaste tu contraseña?", 'pt': "Esqueceu a palavra-passe?", 'ar': "نسيت كلمة المرور؟", 'zh': "忘记密码？"},
  'login.seConnecter': {'fr': "Se connecter", 'en': "Sign in", 'es': "Iniciar sesión", 'pt': "Entrar", 'ar': "تسجيل الدخول", 'zh': "登录"},
  'login.pasDeCompte': {'fr': "Pas encore de compte ? ", 'en': "No account yet? ", 'es': "¿Aún no tienes cuenta? ", 'pt': "Ainda não tem conta? ", 'ar': "ليس لديك حساب بعد؟ ", 'zh': "还没有账户？ "},
  'login.creerCompte': {'fr': "Créer un compte", 'en': "Create an account", 'es': "Crear una cuenta", 'pt': "Criar uma conta", 'ar': "إنشاء حساب", 'zh': "注册账户"},
  'login.oublieTitre': {'fr': "Mot de passe oublié", 'en': "Forgot password", 'es': "Contraseña olvidada", 'pt': "Palavra-passe esquecida", 'ar': "نسيت كلمة المرور", 'zh': "忘记密码"},
  'login.oublieCorps': {'fr': "La réinitialisation par e-mail n’est pas encore disponible. Écrivez-nous à contact@chap.ci et nous vous aiderons — ou, si vous vous êtes inscrit avec Google, utilisez le bouton Google.", 'en': "Password reset by email isn't available yet. Write to us at contact@chap.ci and we'll help — or, if you signed up with Google, use the Google button.", 'es': "El restablecimiento por correo aún no está disponible. Escríbenos a contact@chap.ci y te ayudaremos — o, si te registraste con Google, usa el botón de Google.", 'pt': "A reposição por e-mail ainda não está disponível. Escreva-nos para contact@chap.ci e ajudamos — ou, se se registou com o Google, use o botão Google.", 'ar': "إعادة تعيين كلمة المرور بالبريد غير متاحة بعد. راسلنا على contact@chap.ci وسنساعدك — أو استخدم زر Google إن سجّلت به.", 'zh': "暂不支持通过邮件重置密码。请发邮件至 contact@chap.ci，我们会协助您；若您用 Google 注册，请使用 Google 按钮。"},

  // Mon compte (tableau de bord)
  'compte.mesAnnonces': {'fr': "Mes annonces", 'en': "My listings", 'es': "Mis anuncios", 'pt': "Os meus anúncios", 'ar': "إعلاناتي", 'zh': "我的商品"},
  'compte.confirmezBanniere': {'fr': "Confirmez votre e-mail pour pouvoir publier.", 'en': "Confirm your email to be able to post.", 'es': "Confirma tu correo para poder publicar.", 'pt': "Confirme o seu e-mail para poder publicar.", 'ar': "أكّد بريدك الإلكتروني لتتمكن من النشر.", 'zh': "确认邮箱后才能发布。"},
  'compte.chargeErreur': {'fr': "Impossible de charger vos annonces.", 'en': "Couldn't load your listings.", 'es': "No se pudieron cargar tus anuncios.", 'pt': "Não foi possível carregar os seus anúncios.", 'ar': "تعذّر تحميل إعلاناتك.", 'zh': "无法加载您的商品。"},
  'compte.tirezReessayer': {'fr': "Tirez vers le bas pour réessayer.", 'en': "Pull down to try again.", 'es': "Desliza hacia abajo para reintentar.", 'pt': "Puxe para baixo para tentar de novo.", 'ar': "اسحب للأسفل لإعادة المحاولة.", 'zh': "下拉重试。"},
  'compte.aucuneAnnonce': {'fr': "Vous n’avez pas encore d’annonce.", 'en': "You don't have any listings yet.", 'es': "Aún no tienes anuncios.", 'pt': "Ainda não tem anúncios.", 'ar': "ليس لديك أي إعلان بعد.", 'zh': "您还没有商品。"},
  'compte.publierBientot': {'fr': "La publication depuis l’application arrive bientôt. En attendant, vous pouvez publier sur chap.ci.", 'en': "Posting from the app is coming soon. In the meantime, you can post on chap.ci.", 'es': "Publicar desde la app llegará pronto. Mientras tanto, puedes publicar en chap.ci.", 'pt': "Publicar pela aplicação chega em breve. Entretanto, pode publicar em chap.ci.", 'ar': "النشر من التطبيق قريباً. في هذه الأثناء يمكنك النشر على chap.ci.", 'zh': "很快可在应用内发布。目前请在 chap.ci 上发布。"},
  'statut.enLigne': {'fr': "En ligne", 'en': "Active", 'es': "Activo", 'pt': "Ativo", 'ar': "منشور", 'zh': "在售"},
  'statut.vendue': {'fr': "Vendue", 'en': "Sold", 'es': "Vendido", 'pt': "Vendido", 'ar': "مُباع", 'zh': "已售"},
  'statut.masquee': {'fr': "Masquée", 'en': "Hidden", 'es': "Oculto", 'pt': "Oculto", 'ar': "مخفي", 'zh': "已隐藏"},
  'stat.vues': {'fr': "Vues", 'en': "Views", 'es': "Vistas", 'pt': "Visualizações", 'ar': "مشاهدات", 'zh': "浏览"},
  'badge.emailConfirme': {'fr': "E-mail confirmé", 'en': "Email confirmed", 'es': "Correo confirmado", 'pt': "E-mail confirmado", 'ar': "تم تأكيد البريد", 'zh': "邮箱已确认"},
  'badge.equipe': {'fr': "Équipe Chap.ci", 'en': "Chap.ci team", 'es': "Equipo Chap.ci", 'pt': "Equipa Chap.ci", 'ar': "فريق Chap.ci", 'zh': "Chap.ci 团队"},
  'badge.membre': {'fr': "Membre vérifié", 'en': "Verified member", 'es': "Miembro verificado", 'pt': "Membro verificado", 'ar': "عضو موثّق", 'zh': "认证会员"},
  'badge.confianceDans': {'fr': "Badge de confiance dans", 'en': "Trust badge in", 'es': "Insignia de confianza en", 'pt': "Distintivo de confiança em", 'ar': "شارة الثقة خلال", 'zh': "信任徽章还需"},
  'common.mois': {'fr': "mois", 'en': "months", 'es': "meses", 'pt': "meses", 'ar': "أشهر", 'zh': "个月"},
  'annonce.supprimerTitre': {'fr': "Supprimer l’annonce ?", 'en': "Delete listing?", 'es': "¿Eliminar el anuncio?", 'pt': "Eliminar anúncio?", 'ar': "حذف الإعلان؟", 'zh': "删除商品？"},
  'annonce.supprimerCorps': {'fr': "sera retirée définitivement.", 'en': "will be permanently removed.", 'es': "se eliminará definitivamente.", 'pt': "será removido definitivamente.", 'ar': "سيُحذف نهائياً.", 'zh': "将被永久删除。"},
  'action.supprimer': {'fr': "Supprimer", 'en': "Delete", 'es': "Eliminar", 'pt': "Eliminar", 'ar': "حذف", 'zh': "删除"},
  'menu.voir': {'fr': "Voir l’annonce", 'en': "View listing", 'es': "Ver anuncio", 'pt': "Ver anúncio", 'ar': "عرض الإعلان", 'zh': "查看商品"},
  'menu.remettre': {'fr': "Remettre en ligne", 'en': "Republish", 'es': "Volver a publicar", 'pt': "Voltar a publicar", 'ar': "إعادة النشر", 'zh': "重新上架"},
  'menu.masquer': {'fr': "Masquer", 'en': "Hide", 'es': "Ocultar", 'pt': "Ocultar", 'ar': "إخفاء", 'zh': "隐藏"},

  // Explorer (recherche & filtres)
  'expl.chargeErreur': {'fr': "Impossible de charger les annonces", 'en': "Couldn't load listings", 'es': "No se pudieron cargar los anuncios", 'pt': "Não foi possível carregar os anúncios", 'ar': "تعذّر تحميل الإعلانات", 'zh': "无法加载商品"},
  'expl.verifConnexion': {'fr': "Vérifiez votre connexion.", 'en': "Check your connection.", 'es': "Comprueba tu conexión.", 'pt': "Verifique a sua ligação.", 'ar': "تحقّق من اتصالك.", 'zh': "请检查网络连接。"},
  'expl.aucuneCorrespond': {'fr': "Aucune annonce ne correspond", 'en': "No listings match", 'es': "Ningún anuncio coincide", 'pt': "Nenhum anúncio corresponde", 'ar': "لا توجد إعلانات مطابقة", 'zh': "没有匹配的商品"},
  'expl.elargir': {'fr': "Essayez d’élargir votre recherche ou vos filtres.", 'en': "Try widening your search or filters.", 'es': "Prueba a ampliar tu búsqueda o tus filtros.", 'pt': "Tente alargar a pesquisa ou os filtros.", 'ar': "جرّب توسيع البحث أو الفلاتر.", 'zh': "请尝试放宽搜索条件或筛选。"},
  'expl.toutes': {'fr': "Toutes", 'en': "All", 'es': "Todas", 'pt': "Todas", 'ar': "الكل", 'zh': "全部"},
  'expl.tous': {'fr': "Tous", 'en': "All", 'es': "Todos", 'pt': "Todos", 'ar': "الكل", 'zh': "全部"},
  'expl.communeTri': {'fr': "Commune et tri", 'en': "Area and sorting", 'es': "Zona y orden", 'pt': "Zona e ordenação", 'ar': "المنطقة والترتيب", 'zh': "区域与排序"},
  'expl.filtres': {'fr': "Filtres", 'en': "Filters", 'es': "Filtros", 'pt': "Filtros", 'ar': "الفلاتر", 'zh': "筛选"},
  'expl.commune': {'fr': "Commune", 'en': "Area", 'es': "Zona", 'pt': "Zona", 'ar': "المنطقة", 'zh': "区域"},
  'expl.toutesCommunes': {'fr': "Toutes les communes", 'en': "All areas", 'es': "Todas las zonas", 'pt': "Todas as zonas", 'ar': "كل المناطق", 'zh': "所有区域"},
  'expl.trierPar': {'fr': "Trier par", 'en': "Sort by", 'es': "Ordenar por", 'pt': "Ordenar por", 'ar': "ترتيب حسب", 'zh': "排序方式"},
  'expl.plusRecentes': {'fr': "Plus récentes", 'en': "Most recent", 'es': "Más recientes", 'pt': "Mais recentes", 'ar': "الأحدث", 'zh': "最新"},
  'expl.presDeMoi': {'fr': "Près de moi 📍", 'en': "Near me 📍", 'es': "Cerca de mí 📍", 'pt': "Perto de mim 📍", 'ar': "بالقرب مني 📍", 'zh': "附近 📍"},
  'expl.prixCroissant': {'fr': "Prix croissant", 'en': "Price: low to high", 'es': "Precio: de menor a mayor", 'pt': "Preço: crescente", 'ar': "السعر: من الأقل للأعلى", 'zh': "价格从低到高"},
  'expl.prixDecroissant': {'fr': "Prix décroissant", 'en': "Price: high to low", 'es': "Precio: de mayor a menor", 'pt': "Preço: decrescente", 'ar': "السعر: من الأعلى للأقل", 'zh': "价格从高到低"},
  'expl.voirResultats': {'fr': "Voir les résultats", 'en': "See results", 'es': "Ver resultados", 'pt': "Ver resultados", 'ar': "عرض النتائج", 'zh': "查看结果"},
  'expl.localisation': {'fr': "Localisation…", 'en': "Locating…", 'es': "Localizando…", 'pt': "A localizar…", 'ar': "جارٍ تحديد الموقع…", 'zh': "定位中…"},
  'expl.aucunResultat': {'fr': "Aucun résultat", 'en': "No results", 'es': "Sin resultados", 'pt': "Sem resultados", 'ar': "لا نتائج", 'zh': "无结果"},
  'expl.annonce1': {'fr': "annonce", 'en': "listing", 'es': "anuncio", 'pt': "anúncio", 'ar': "إعلان", 'zh': "个商品"},
  'expl.annonceN': {'fr': "annonces", 'en': "listings", 'es': "anuncios", 'pt': "anúncios", 'ar': "إعلانات", 'zh': "个商品"},
  'expl.posIntrouvable': {'fr': "Position introuvable. Réessayez à l’air libre.", 'en': "Couldn't get your location. Try again outdoors.", 'es': "No se pudo obtener tu ubicación. Inténtalo al aire libre.", 'pt': "Não foi possível obter a sua localização. Tente ao ar livre.", 'ar': "تعذّر تحديد موقعك. حاول في الهواء الطلق.", 'zh': "无法获取位置，请到室外重试。"},

  // Messagerie
  'msg.aucune': {'fr': "Aucune conversation", 'en': "No conversations", 'es': "Sin conversaciones", 'pt': "Sem conversas", 'ar': "لا توجد محادثات", 'zh': "暂无对话"},
  'msg.contactez': {'fr': "Contactez un vendeur depuis une annonce pour démarrer une discussion.", 'en': "Contact a seller from a listing to start a conversation.", 'es': "Contacta a un vendedor desde un anuncio para iniciar una conversación.", 'pt': "Contacte um vendedor a partir de um anúncio para iniciar uma conversa.", 'ar': "تواصل مع بائع من صفحة إعلان لبدء محادثة.", 'zh': "从商品页联系卖家即可开始对话。"},
  'msg.conversation': {'fr': "Conversation", 'en': "Conversation", 'es': "Conversación", 'pt': "Conversa", 'ar': "محادثة", 'zh': "对话"},
  'msg.nouvelle': {'fr': "Nouvelle conversation", 'en': "New conversation", 'es': "Nueva conversación", 'pt': "Nova conversa", 'ar': "محادثة جديدة", 'zh': "新对话"},
  'msg.epingler': {'fr': "Épingler", 'en': "Pin", 'es': "Fijar", 'pt': "Fixar", 'ar': "تثبيت", 'zh': "置顶"},
  'msg.desepingler': {'fr': "Désépingler", 'en': "Unpin", 'es': "Soltar", 'pt': "Desafixar", 'ar': "إلغاء التثبيت", 'zh': "取消置顶"},
  'msg.archiver': {'fr': "Archiver", 'en': "Archive", 'es': "Archivar", 'pt': "Arquivar", 'ar': "أرشفة", 'zh': "归档"},
  'msg.desarchiver': {'fr': "Désarchiver", 'en': "Unarchive", 'es': "Desarchivar", 'pt': "Desarquivar", 'ar': "إلغاء الأرشفة", 'zh': "取消归档"},
  'msg.bloquer': {'fr': "Bloquer", 'en': "Block", 'es': "Bloquear", 'pt': "Bloquear", 'ar': "حظر", 'zh': "屏蔽"},
  'msg.debloquer': {'fr': "Débloquer", 'en': "Unblock", 'es': "Desbloquear", 'pt': "Desbloquear", 'ar': "إلغاء الحظر", 'zh': "取消屏蔽"},
  'msg.supprimerTitre': {'fr': "Supprimer la conversation ?", 'en': "Delete conversation?", 'es': "¿Eliminar la conversación?", 'pt': "Eliminar conversa?", 'ar': "حذف المحادثة؟", 'zh': "删除对话？"},
  'msg.supprimerCorps': {'fr': "Elle disparaîtra de votre liste. L’autre personne garde la sienne.", 'en': "It will disappear from your list. The other person keeps theirs.", 'es': "Desaparecerá de tu lista. La otra persona conserva la suya.", 'pt': "Desaparecerá da sua lista. A outra pessoa mantém a dela.", 'ar': "ستختفي من قائمتك، وتبقى لدى الطرف الآخر.", 'zh': "将从您的列表中消失，对方仍保留。"},
  'msg.actionImpossible': {'fr': "Action impossible pour le moment.", 'en': "Can't do that right now.", 'es': "Acción no disponible por ahora.", 'pt': "Ação indisponível de momento.", 'ar': "تعذّر تنفيذ الإجراء حالياً.", 'zh': "暂时无法执行该操作。"},
  'msg.archivees': {'fr': "Archivées", 'en': "Archived", 'es': "Archivadas", 'pt': "Arquivadas", 'ar': "المؤرشفة", 'zh': "已归档"},
  'msg.convArchivees': {'fr': "Conversations archivées", 'en': "Archived conversations", 'es': "Conversaciones archivadas", 'pt': "Conversas arquivadas", 'ar': "المحادثات المؤرشفة", 'zh': "已归档的对话"},
  'msg.connectezVoir': {'fr': "Connectez-vous pour voir vos messages", 'en': "Sign in to see your messages", 'es': "Inicia sesión para ver tus mensajes", 'pt': "Inicie sessão para ver as suas mensagens", 'ar': "سجّل الدخول لعرض رسائلك", 'zh': "登录后查看您的消息"},
  'msg.allerCompte': {'fr': "Aller à mon compte", 'en': "Go to my account", 'es': "Ir a mi cuenta", 'pt': "Ir para a minha conta", 'ar': "الذهاب إلى حسابي", 'zh': "前往我的账户"},
};

/// Le texte de la clé [cle] dans la langue de l'application.
///
/// On lit la locale via `Localizations.localeOf(context)` : cela crée une
/// dépendance, donc tout widget qui appelle `tr(...)` dans son `build` se
/// reconstruit automatiquement dès que la langue change — barre de navigation,
/// écrans déjà ouverts, tout. Repli sur le français, puis sur la clé.
String tr(BuildContext context, String cle) {
  final code = Localizations.localeOf(context).languageCode;
  final m = _t[cle];
  if (m == null) return cle;
  return m[code] ?? m['fr'] ?? cle;
}
