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
