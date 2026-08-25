// =============================================================================
//  Traduction d'AFFICHAGE des catégories et sous-catégories.
//
//  ⚠️ Les annonces sont ENREGISTRÉES sous les noms français (voir
//  `data/formulaires/registre.dart` : « c'est sous ces noms que les annonces
//  sont enregistrées »). Le nom français est donc l'identifiant — il ne change
//  jamais, ni côté serveur ni dans ce qu'on envoie. Ici on ne traduit que ce
//  que l'œil voit : les puces d'Explorer, le fil d'Ariane d'une fiche, les
//  sélecteurs de publication.
//
//  Toute entrée absente retombe sur le français — l'app ne casse jamais sur une
//  sous-catégorie ajoutée côté site et pas encore traduite ici.
// =============================================================================
import 'package:flutter/widgets.dart';
import '../data/categories.dart';

/// Les 16 catégories, par identifiant.
const Map<String, Map<String, String>> _cats = {
  'electronique': {'en': 'Electronics', 'es': 'Electrónica', 'pt': 'Eletrónica', 'ar': 'إلكترونيات', 'zh': '电子产品'},
  'vehicules': {'en': 'Vehicles', 'es': 'Vehículos', 'pt': 'Veículos', 'ar': 'مركبات', 'zh': '车辆'},
  'immobilier': {'en': 'Real estate', 'es': 'Inmobiliaria', 'pt': 'Imobiliário', 'ar': 'عقارات', 'zh': '房产'},
  'mode': {'en': 'Fashion & Beauty', 'es': 'Moda y Belleza', 'pt': 'Moda e Beleza', 'ar': 'أزياء وجمال', 'zh': '时尚美妆'},
  'maison': {'en': 'Home & Furniture', 'es': 'Hogar y Muebles', 'pt': 'Casa e Móveis', 'ar': 'منزل وأثاث', 'zh': '家居家具'},
  'scolaire': {'en': 'School & Supplies', 'es': 'Escuela y Útiles', 'pt': 'Escola e Material', 'ar': 'مدرسة ولوازم', 'zh': '学习用品'},
  'emploi': {'en': 'Jobs', 'es': 'Empleo', 'pt': 'Emprego', 'ar': 'وظائف', 'zh': '招聘'},
  'services': {'en': 'Services', 'es': 'Servicios', 'pt': 'Serviços', 'ar': 'خدمات', 'zh': '服务'},
  'materiel-pro': {'en': 'Business equipment', 'es': 'Equipo profesional', 'pt': 'Equipamento Pro', 'ar': 'معدات مهنية', 'zh': '商用设备'},
  'alimentation': {'en': 'Food & Drinks', 'es': 'Alimentos y Bebidas', 'pt': 'Alimentação e Bebidas', 'ar': 'أغذية ومشروبات', 'zh': '食品饮料'},
  'animaux': {'en': 'Animals', 'es': 'Animales', 'pt': 'Animais', 'ar': 'حيوانات', 'zh': '动物'},
  'loisirs': {'en': 'Leisure & Sports', 'es': 'Ocio y Deporte', 'pt': 'Lazer e Desporto', 'ar': 'ترفيه ورياضة', 'zh': '休闲运动'},
  'bebe': {'en': 'Baby & Kids', 'es': 'Bebé y Niños', 'pt': 'Bebé e Criança', 'ar': 'رضّع وأطفال', 'zh': '母婴儿童'},
  'sante': {'en': 'Health & Wellness', 'es': 'Salud y Bienestar', 'pt': 'Saúde e Bem-estar', 'ar': 'صحة وعافية', 'zh': '健康养生'},
  'voyage': {'en': 'Travel', 'es': 'Viajes', 'pt': 'Viagens', 'ar': 'سفر', 'zh': '旅行'},
  'a-donner': {'en': 'Free / Giveaway', 'es': 'Para regalar', 'pt': 'Para doar', 'ar': 'للتبرع', 'zh': '免费赠送'},
};

/// Les 101 sous-catégories, par NOM FRANÇAIS canonique (l'identifiant de fait).
const Map<String, Map<String, String>> _sous = {
  // Véhicules
  'Voitures': {'en': 'Cars', 'es': 'Coches', 'pt': 'Carros', 'ar': 'سيارات', 'zh': '汽车'},
  'Motos & Scooters': {'en': 'Motorbikes & Scooters', 'es': 'Motos y scooters', 'pt': 'Motas e scooters', 'ar': 'دراجات نارية وسكوترات', 'zh': '摩托车与踏板车'},
  'Camions & Utilitaires': {'en': 'Trucks & Vans', 'es': 'Camiones y furgonetas', 'pt': 'Camiões e comerciais', 'ar': 'شاحنات ومركبات نفعية', 'zh': '卡车与商用车'},
  'Engins & Agricoles': {'en': 'Machinery & Farm vehicles', 'es': 'Maquinaria y agrícolas', 'pt': 'Máquinas e agrícolas', 'ar': 'آليات ومركبات زراعية', 'zh': '工程与农用机械'},
  'Pièces & Accessoires': {'en': 'Parts & Accessories', 'es': 'Piezas y accesorios', 'pt': 'Peças e acessórios', 'ar': 'قطع غيار وإكسسوارات', 'zh': '零件与配件'},
  'Bateaux': {'en': 'Boats', 'es': 'Barcos', 'pt': 'Barcos', 'ar': 'قوارب', 'zh': '船舶'},
  'Location': {'en': 'Rentals', 'es': 'Alquiler', 'pt': 'Aluguer', 'ar': 'تأجير', 'zh': '租赁'},
  // Mode & Beauté
  'Vêtements Femme': {'en': "Women's clothing", 'es': 'Ropa de mujer', 'pt': 'Roupa de senhora', 'ar': 'ملابس نسائية', 'zh': '女装'},
  'Vêtements Homme': {'en': "Men's clothing", 'es': 'Ropa de hombre', 'pt': 'Roupa de homem', 'ar': 'ملابس رجالية', 'zh': '男装'},
  'Chaussures': {'en': 'Shoes', 'es': 'Zapatos', 'pt': 'Calçado', 'ar': 'أحذية', 'zh': '鞋类'},
  'Sacs & Bijoux': {'en': 'Bags & Jewelry', 'es': 'Bolsos y joyas', 'pt': 'Malas e joias', 'ar': 'حقائب ومجوهرات', 'zh': '箱包首饰'},
  'Pagnes & Tissus': {'en': 'Wax fabric & Textiles', 'es': 'Pagnes y telas', 'pt': 'Panos e tecidos', 'ar': 'أقمشة ومنسوجات', 'zh': '花布与面料'},
  'Beauté & Cosmétiques': {'en': 'Beauty & Cosmetics', 'es': 'Belleza y cosméticos', 'pt': 'Beleza e cosméticos', 'ar': 'تجميل ومستحضرات', 'zh': '美容化妆品'},
  // Électronique
  'Smartphones': {'en': 'Smartphones', 'es': 'Smartphones', 'pt': 'Smartphones', 'ar': 'هواتف ذكية', 'zh': '智能手机'},
  'Tablettes': {'en': 'Tablets', 'es': 'Tabletas', 'pt': 'Tablets', 'ar': 'أجهزة لوحية', 'zh': '平板电脑'},
  'Ordinateurs': {'en': 'Computers', 'es': 'Ordenadores', 'pt': 'Computadores', 'ar': 'حواسيب', 'zh': '电脑'},
  'TV & Écrans': {'en': 'TVs & Screens', 'es': 'TV y pantallas', 'pt': 'TV e ecrãs', 'ar': 'تلفزيونات وشاشات', 'zh': '电视与显示器'},
  'Audio & Son': {'en': 'Audio & Sound', 'es': 'Audio y sonido', 'pt': 'Áudio e som', 'ar': 'صوتيات', 'zh': '音响设备'},
  'Jeux vidéo': {'en': 'Video games', 'es': 'Videojuegos', 'pt': 'Videojogos', 'ar': 'ألعاب فيديو', 'zh': '电子游戏'},
  'Appareils photo': {'en': 'Cameras', 'es': 'Cámaras', 'pt': 'Câmaras', 'ar': 'كاميرات', 'zh': '相机'},
  'Accessoires téléphone': {'en': 'Phone accessories', 'es': 'Accesorios de móvil', 'pt': 'Acessórios de telemóvel', 'ar': 'إكسسوارات هواتف', 'zh': '手机配件'},
  'Accessoires informatiques': {'en': 'Computer accessories', 'es': 'Accesorios informáticos', 'pt': 'Acessórios de informática', 'ar': 'إكسسوارات حاسوب', 'zh': '电脑配件'},
  'Téléphones fixes': {'en': 'Landline phones', 'es': 'Teléfonos fijos', 'pt': 'Telefones fixos', 'ar': 'هواتف ثابتة', 'zh': '固定电话'},
  'Réparation & Dépannage': {'en': 'Repair services', 'es': 'Reparación', 'pt': 'Reparação', 'ar': 'إصلاح وصيانة', 'zh': '维修服务'},
  // Maison & Meubles
  'Meubles': {'en': 'Furniture', 'es': 'Muebles', 'pt': 'Móveis', 'ar': 'أثاث', 'zh': '家具'},
  'Électroménager': {'en': 'Appliances', 'es': 'Electrodomésticos', 'pt': 'Eletrodomésticos', 'ar': 'أجهزة منزلية', 'zh': '家电'},
  'Décoration': {'en': 'Décor', 'es': 'Decoración', 'pt': 'Decoração', 'ar': 'ديكور', 'zh': '装饰'},
  'Cuisine': {'en': 'Kitchen', 'es': 'Cocina', 'pt': 'Cozinha', 'ar': 'مطبخ', 'zh': '厨房用品'},
  'Jardin & Bricolage': {'en': 'Garden & DIY', 'es': 'Jardín y bricolaje', 'pt': 'Jardim e bricolage', 'ar': 'حديقة وأدوات', 'zh': '园艺与工具'},
  'Literie': {'en': 'Bedding', 'es': 'Ropa de cama', 'pt': 'Roupa de cama', 'ar': 'مفروشات وأسرّة', 'zh': '床上用品'},
  // Emploi
  'Offres d’emploi': {'en': 'Job offers', 'es': 'Ofertas de empleo', 'pt': 'Ofertas de emprego', 'ar': 'عروض عمل', 'zh': '招聘信息'},
  'Demandes d’emploi': {'en': 'Job seekers', 'es': 'Demandas de empleo', 'pt': 'Procura de emprego', 'ar': 'طلبات عمل', 'zh': '求职信息'},
  'Stages': {'en': 'Internships', 'es': 'Prácticas', 'pt': 'Estágios', 'ar': 'تدريب', 'zh': '实习'},
  'Freelance': {'en': 'Freelance', 'es': 'Freelance', 'pt': 'Freelance', 'ar': 'عمل حر', 'zh': '自由职业'},
  'Emploi maison': {'en': 'Domestic work', 'es': 'Empleo doméstico', 'pt': 'Trabalho doméstico', 'ar': 'عمل منزلي', 'zh': '家政工作'},
  // Services
  'BTP & Rénovation': {'en': 'Construction & Renovation', 'es': 'Construcción y reformas', 'pt': 'Construção e renovação', 'ar': 'بناء وترميم', 'zh': '建筑装修'},
  'Cours & Formation': {'en': 'Classes & Training', 'es': 'Clases y formación', 'pt': 'Aulas e formação', 'ar': 'دروس وتكوين', 'zh': '课程培训'},
  'Événementiel': {'en': 'Events', 'es': 'Eventos', 'pt': 'Eventos', 'ar': 'فعاليات', 'zh': '活动策划'},
  'Transport & Déménagement': {'en': 'Transport & Moving', 'es': 'Transporte y mudanzas', 'pt': 'Transporte e mudanças', 'ar': 'نقل وترحيل', 'zh': '运输搬家'},
  'Informatique & Digital': {'en': 'IT & Digital', 'es': 'Informática y digital', 'pt': 'Informática e digital', 'ar': 'معلوماتية ورقمية', 'zh': 'IT 与数字服务'},
  'Couture & Artisanat': {'en': 'Sewing & Crafts', 'es': 'Costura y artesanía', 'pt': 'Costura e artesanato', 'ar': 'خياطة وحرف', 'zh': '缝纫手工'},
  // Matériel Pro
  'Restauration & Maquis': {'en': 'Restaurant equipment', 'es': 'Hostelería', 'pt': 'Restauração', 'ar': 'معدات مطاعم', 'zh': '餐饮设备'},
  'Boutique & Commerce': {'en': 'Shop & Retail', 'es': 'Tienda y comercio', 'pt': 'Loja e comércio', 'ar': 'متاجر وتجارة', 'zh': '商店零售'},
  'Agriculture & Élevage': {'en': 'Farming & Livestock', 'es': 'Agricultura y ganadería', 'pt': 'Agricultura e pecuária', 'ar': 'زراعة وتربية', 'zh': '农业养殖'},
  'Industrie & Atelier': {'en': 'Industry & Workshop', 'es': 'Industria y taller', 'pt': 'Indústria e oficina', 'ar': 'صناعة وورش', 'zh': '工业车间'},
  'Bureau & Informatique': {'en': 'Office & IT', 'es': 'Oficina e informática', 'pt': 'Escritório e informática', 'ar': 'مكاتب ومعلوماتية', 'zh': '办公与 IT'},
  'Salon & Esthétique': {'en': 'Salon & Beauty equipment', 'es': 'Peluquería y estética', 'pt': 'Salão e estética', 'ar': 'صالونات وتجميل', 'zh': '美容美发设备'},
  'Médical & Paramédical': {'en': 'Medical equipment', 'es': 'Médico y paramédico', 'pt': 'Médico e paramédico', 'ar': 'معدات طبية', 'zh': '医疗设备'},
  // Alimentation & Boissons
  'Produits vivriers': {'en': 'Staple foods', 'es': 'Productos básicos', 'pt': 'Produtos alimentares', 'ar': 'محاصيل غذائية', 'zh': '主粮食品'},
  'Fruits & Légumes': {'en': 'Fruits & Vegetables', 'es': 'Frutas y verduras', 'pt': 'Fruta e legumes', 'ar': 'فواكه وخضروات', 'zh': '果蔬'},
  'Céréales & Tubercules': {'en': 'Grains & Tubers', 'es': 'Cereales y tubérculos', 'pt': 'Cereais e tubérculos', 'ar': 'حبوب ودرنات', 'zh': '谷物薯类'},
  'Épices & Condiments': {'en': 'Spices & Condiments', 'es': 'Especias y condimentos', 'pt': 'Especiarias e condimentos', 'ar': 'بهارات وتوابل', 'zh': '香料调味品'},
  'Produits du terroir': {'en': 'Local specialties', 'es': 'Productos locales', 'pt': 'Produtos regionais', 'ar': 'منتجات محلية', 'zh': '地方特产'},
  'Boissons': {'en': 'Drinks', 'es': 'Bebidas', 'pt': 'Bebidas', 'ar': 'مشروبات', 'zh': '饮品'},
  'Plats préparés': {'en': 'Prepared meals', 'es': 'Platos preparados', 'pt': 'Refeições prontas', 'ar': 'وجبات جاهزة', 'zh': '熟食'},
  'Cacao & Café': {'en': 'Cocoa & Coffee', 'es': 'Cacao y café', 'pt': 'Cacau e café', 'ar': 'كاكاو وقهوة', 'zh': '可可与咖啡'},
  'Semences & Intrants': {'en': 'Seeds & Farm inputs', 'es': 'Semillas e insumos', 'pt': 'Sementes e insumos', 'ar': 'بذور ومستلزمات زراعية', 'zh': '种子农资'},
  'Poisson & Produits de mer': {'en': 'Fish & Seafood', 'es': 'Pescado y mariscos', 'pt': 'Peixe e marisco', 'ar': 'أسماك ومأكولات بحرية', 'zh': '鱼类海鲜'},
  // Animaux
  'Volaille': {'en': 'Poultry', 'es': 'Aves de corral', 'pt': 'Aves', 'ar': 'دواجن', 'zh': '家禽'},
  'Bétail & Élevage': {'en': 'Livestock', 'es': 'Ganado', 'pt': 'Gado e criação', 'ar': 'ماشية', 'zh': '牲畜养殖'},
  'Chiens & Chats': {'en': 'Dogs & Cats', 'es': 'Perros y gatos', 'pt': 'Cães e gatos', 'ar': 'كلاب وقطط', 'zh': '猫狗'},
  'Oiseaux, Poissons & Reptiles': {'en': 'Birds, Fish & Reptiles', 'es': 'Aves, peces y reptiles', 'pt': 'Pássaros, peixes e répteis', 'ar': 'طيور وأسماك وزواحف', 'zh': '鸟鱼爬宠'},
  'Aliments pour animaux': {'en': 'Animal feed', 'es': 'Alimentos para animales', 'pt': 'Alimentos para animais', 'ar': 'أعلاف', 'zh': '动物饲料'},
  'Accessoires & Matériel': {'en': 'Accessories & Equipment', 'es': 'Accesorios y material', 'pt': 'Acessórios e material', 'ar': 'إكسسوارات ومعدات', 'zh': '用品器材'},
  // Loisirs & Sport
  'Sport & Fitness': {'en': 'Sports & Fitness', 'es': 'Deporte y fitness', 'pt': 'Desporto e fitness', 'ar': 'رياضة ولياقة', 'zh': '运动健身'},
  'Vélos & Trottinettes': {'en': 'Bikes & Scooters', 'es': 'Bicicletas y patinetes', 'pt': 'Bicicletas e trotinetas', 'ar': 'دراجات هوائية وسكوترات', 'zh': '自行车与滑板车'},
  'Instruments de musique': {'en': 'Musical instruments', 'es': 'Instrumentos musicales', 'pt': 'Instrumentos musicais', 'ar': 'آلات موسيقية', 'zh': '乐器'},
  'Livres & BD': {'en': 'Books & Comics', 'es': 'Libros y cómics', 'pt': 'Livros e BD', 'ar': 'كتب وقصص مصورة', 'zh': '图书漫画'},
  'Jeux de société & Puzzles': {'en': 'Board games & Puzzles', 'es': 'Juegos de mesa y puzles', 'pt': 'Jogos de tabuleiro e puzzles', 'ar': 'ألعاب طاولة وأحاجي', 'zh': '桌游拼图'},
  'Collections': {'en': 'Collectibles', 'es': 'Coleccionismo', 'pt': 'Coleções', 'ar': 'مقتنيات', 'zh': '收藏品'},
  // Bébé & Enfant
  'Vêtements bébé & enfant': {'en': "Baby & kids' clothing", 'es': 'Ropa de bebé y niño', 'pt': 'Roupa de bebé e criança', 'ar': 'ملابس رضّع وأطفال', 'zh': '婴童服装'},
  'Poussettes & Sièges auto': {'en': 'Strollers & Car seats', 'es': 'Carritos y sillas de coche', 'pt': 'Carrinhos e cadeiras auto', 'ar': 'عربات ومقاعد سيارة', 'zh': '婴儿车与安全座椅'},
  'Mobilier & Chambre': {'en': 'Nursery furniture', 'es': 'Mobiliario y habitación', 'pt': 'Mobiliário e quarto', 'ar': 'أثاث غرف الأطفال', 'zh': '儿童家具'},
  'Jouets & Éveil': {'en': 'Toys', 'es': 'Juguetes', 'pt': 'Brinquedos', 'ar': 'ألعاب أطفال', 'zh': '玩具'},
  'Puériculture & Repas': {'en': 'Baby care & Feeding', 'es': 'Puericultura y comidas', 'pt': 'Puericultura e refeições', 'ar': 'مستلزمات ورضاعة', 'zh': '育儿喂养'},
  'Vêtements de maternité': {'en': 'Maternity wear', 'es': 'Ropa premamá', 'pt': 'Roupa de gravidez', 'ar': 'ملابس حوامل', 'zh': '孕妇装'},
  // Santé & Bien-être
  'Compléments & Tisanes': {'en': 'Supplements & Herbal teas', 'es': 'Suplementos e infusiones', 'pt': 'Suplementos e tisanas', 'ar': 'مكمّلات وأعشاب', 'zh': '保健品与草本茶'},
  'Soins & Hygiène': {'en': 'Care & Hygiene', 'es': 'Cuidado e higiene', 'pt': 'Cuidados e higiene', 'ar': 'عناية ونظافة', 'zh': '护理卫生'},
  'Matériel médical de confort': {'en': 'Home medical equipment', 'es': 'Material médico', 'pt': 'Material médico', 'ar': 'معدات طبية منزلية', 'zh': '家用医疗器械'},
  'Optique & Audition': {'en': 'Optics & Hearing', 'es': 'Óptica y audición', 'pt': 'Ótica e audição', 'ar': 'نظارات وسمعيات', 'zh': '眼镜与助听'},
  'Bien-être & Massage': {'en': 'Wellness & Massage', 'es': 'Bienestar y masaje', 'pt': 'Bem-estar e massagem', 'ar': 'استرخاء ومساج', 'zh': '养生按摩'},
  'Nutrition sportive': {'en': 'Sports nutrition', 'es': 'Nutrición deportiva', 'pt': 'Nutrição desportiva', 'ar': 'تغذية رياضية', 'zh': '运动营养'},
  // École & Fournitures
  'Fournitures & papeterie': {'en': 'School supplies & stationery', 'es': 'Útiles y papelería', 'pt': 'Material e papelaria', 'ar': 'قرطاسية ولوازم', 'zh': '文具用品'},
  'Cartables & trousses': {'en': 'School bags & pencil cases', 'es': 'Mochilas y estuches', 'pt': 'Mochilas e estojos', 'ar': 'حقائب ومقالم', 'zh': '书包笔袋'},
  'Manuels & livres scolaires': {'en': 'Textbooks', 'es': 'Libros de texto', 'pt': 'Manuais escolares', 'ar': 'كتب مدرسية', 'zh': '教科书'},
  'Annales & parascolaire': {'en': 'Exam prep & study aids', 'es': 'Exámenes y refuerzo', 'pt': 'Exames e apoio escolar', 'ar': 'ملازم ومراجع', 'zh': '真题教辅'},
  'Uniformes & tenues': {'en': 'Uniforms', 'es': 'Uniformes', 'pt': 'Uniformes', 'ar': 'أزياء مدرسية', 'zh': '校服'},
  'Calculatrices & matériel de classe': {'en': 'Calculators & class equipment', 'es': 'Calculadoras y material', 'pt': 'Calculadoras e material', 'ar': 'آلات حاسبة وأدوات', 'zh': '计算器与教具'},
  // Voyage
  'Billets d’avion': {'en': 'Flight tickets', 'es': 'Billetes de avión', 'pt': 'Bilhetes de avião', 'ar': 'تذاكر طيران', 'zh': '机票'},
  'Agences de voyage': {'en': 'Travel agencies', 'es': 'Agencias de viaje', 'pt': 'Agências de viagens', 'ar': 'وكالات سفر', 'zh': '旅行社'},
  'Visas & formalités': {'en': 'Visas & paperwork', 'es': 'Visados y trámites', 'pt': 'Vistos e formalidades', 'ar': 'تأشيرات ومعاملات', 'zh': '签证手续'},
  'Études à l’étranger': {'en': 'Study abroad', 'es': 'Estudios en el extranjero', 'pt': 'Estudos no estrangeiro', 'ar': 'دراسة في الخارج', 'zh': '留学'},
  'Travail à l’étranger': {'en': 'Work abroad', 'es': 'Trabajo en el extranjero', 'pt': 'Trabalho no estrangeiro', 'ar': 'عمل في الخارج', 'zh': '海外工作'},
  'Séjours & circuits': {'en': 'Trips & tours', 'es': 'Estancias y circuitos', 'pt': 'Estadias e circuitos', 'ar': 'رحلات وجولات', 'zh': '度假旅游'},
  // À donner
  'Vêtements & chaussures': {'en': 'Clothes & shoes', 'es': 'Ropa y zapatos', 'pt': 'Roupa e calçado', 'ar': 'ملابس وأحذية', 'zh': '衣服鞋子'},
  'Meubles & électroménager': {'en': 'Furniture & appliances', 'es': 'Muebles y electrodomésticos', 'pt': 'Móveis e eletrodomésticos', 'ar': 'أثاث وأجهزة', 'zh': '家具家电'},
  'Fournitures & matériel scolaire': {'en': 'School supplies', 'es': 'Material escolar', 'pt': 'Material escolar', 'ar': 'لوازم مدرسية', 'zh': '学习用品'},
  'Bébé & enfant': {'en': 'Baby & kids', 'es': 'Bebé y niños', 'pt': 'Bebé e criança', 'ar': 'رضّع وأطفال', 'zh': '母婴儿童'},
  'Nourriture & hygiène': {'en': 'Food & hygiene', 'es': 'Alimentos e higiene', 'pt': 'Alimentos e higiene', 'ar': 'غذاء ونظافة', 'zh': '食品与卫生用品'},
  'Coup de main & services': {'en': 'Helping hands & services', 'es': 'Ayuda y servicios', 'pt': 'Ajuda e serviços', 'ar': 'مساعدة وخدمات', 'zh': '帮忙与服务'},
  'Autres objets': {'en': 'Other items', 'es': 'Otros objetos', 'pt': 'Outros objetos', 'ar': 'أغراض أخرى', 'zh': '其他物品'},
};

/// Le nom d'une catégorie dans la langue de l'application.
String nomCategorieTr(BuildContext context, String id) {
  final code = Localizations.localeOf(context).languageCode;
  if (code == 'fr') return nomCategorie(id);
  return _cats[id]?[code] ?? nomCategorie(id);
}

/// Le nom d'une sous-catégorie dans la langue de l'application.
/// [nomFr] est le nom français canonique (celui enregistré avec l'annonce).
String nomSousTr(BuildContext context, String nomFr) {
  final code = Localizations.localeOf(context).languageCode;
  if (code == 'fr') return nomFr;
  return _sous[nomFr]?[code] ?? nomFr;
}
