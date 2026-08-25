// Traductions de la page « À propos » (src/pages/About.tsx).
//
// Le français vit dans la page elle-même ; ce fichier n'est téléchargé que
// lorsqu'un visiteur arrive avec `?lang=` (l'application). Les emojis des
// cartes de valeurs restent ceux de la page — seuls les textes changent, dans
// le même ordre : Chap-chap, En confiance, 100 % ivoirien, Mobile Money.

export type TexteAPropos = {
  /** Suffixe du titre, affiché juste après le logo (« , c'est nous 🧡 »). */
  titre: string
  sous: string
  valeurs: { t: string; d: string }[]
}

export const traductions: Record<string, TexteAPropos> = {
  en: {
    titre: ', that’s us 🧡',
    sous:
      'The 100% Ivorian marketplace connecting buyers and sellers, from Cocody to Korhogo. Sell chap-chap (fast), with confidence.',
    valeurs: [
      { t: 'Chap-chap', d: 'Post and sell in minutes, with zero friction.' },
      { t: 'Trust built in', d: 'Hidden phone numbers, verified reviews, secure accounts.' },
      { t: '100% Ivorian', d: 'Made for Côte d’Ivoire, its cities and its payment habits.' },
      { t: 'Mobile Money', d: 'Orange, MTN, Wave, Moov — just like in real life.' },
    ],
  },
  es: {
    titre: ', somos nosotros 🧡',
    sous:
      'El marketplace 100 % marfileño que conecta compradores y vendedores, de Cocody a Korhogo. Vender chap-chap (rápido), con confianza.',
    valeurs: [
      { t: 'Chap-chap', d: 'Publique y venda en minutos, sin fricción.' },
      { t: 'Con confianza', d: 'Números ocultos, reseñas verificadas, cuentas seguras.' },
      { t: '100 % marfileño', d: 'Pensado para Costa de Marfil, sus ciudades y sus pagos.' },
      { t: 'Mobile Money', d: 'Orange, MTN, Wave, Moov — como en la vida real.' },
    ],
  },
  pt: {
    titre: ', somos nós 🧡',
    sous:
      'O marketplace 100% marfinense que liga compradores e vendedores, de Cocody a Korhogo. Vender chap-chap (rápido), com confiança.',
    valeurs: [
      { t: 'Chap-chap', d: 'Publique e venda em minutos, sem fricção.' },
      { t: 'Com confiança', d: 'Números ocultos, avaliações verificadas, contas seguras.' },
      { t: '100% marfinense', d: 'Pensado para a Costa do Marfim, as suas cidades e os seus pagamentos.' },
      { t: 'Mobile Money', d: 'Orange, MTN, Wave, Moov — como na vida real.' },
    ],
  },
  ar: {
    titre: '، هذا نحن 🧡',
    sous:
      'السوق الإلكتروني الإيفواري 100% الذي يربط البائعين والمشترين، من كوكودي إلى كورهوغو. بِع بسرعة « تشاب-تشاب »، وبثقة.',
    valeurs: [
      { t: 'تشاب-تشاب', d: 'انشر وبِع في دقائق، دون أي تعقيد.' },
      { t: 'ثقة مضمونة', d: 'أرقام هاتف مخفية، تقييمات موثَّقة، حسابات آمنة.' },
      { t: 'إيفواري 100%', d: 'صُمِّم لكوت ديفوار، مدنها وطرق الدفع فيها.' },
      { t: 'Mobile Money', d: 'Orange وMTN وWave وMoov — كما في الحياة اليومية.' },
    ],
  },
  zh: {
    titre: '，就是我们 🧡',
    sous:
      '100% 科特迪瓦本土的交易平台，连接从科科迪到科尔霍戈的买家与卖家。Chap-chap（快速）出售，放心交易。',
    valeurs: [
      { t: 'Chap-chap', d: '几分钟内发布并卖出，毫无阻碍。' },
      { t: '安心可信', d: '隐藏电话号码、经过核实的评价、安全的账户。' },
      { t: '100% 科特迪瓦', d: '为科特迪瓦及其城市和支付习惯量身打造。' },
      { t: 'Mobile Money', d: 'Orange、MTN、Wave、Moov——就像日常生活中一样。' },
    ],
  },
}
