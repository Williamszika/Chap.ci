/* ==========================================================================
 *  SANTÉ & BIEN-ÊTRE — la catégorie la plus dangereuse du site.
 *
 *  Ici, une annonce de trop ne coûte pas de l'argent : elle coûte la santé de
 *  quelqu'un. Quatre interdits, tous fondés sur une règle ivoirienne réelle.
 *
 *  1. LES MÉDICAMENTS. Leur vente est un monopole pharmaceutique. Le marché
 *     de la rue — « les médicaments par terre » d'Adjamé et de Roxy — est
 *     combattu par les autorités depuis des années : produits contrefaits,
 *     mal conservés sous 30 °C, dosages faux. Aucun médicament ne se vend
 *     sur Chap.ci, avec ou sans ordonnance.
 *
 *  2. LES PRODUITS ÉCLAIRCISSANTS. Le décret d'avril 2015 interdit la
 *     fabrication, la commercialisation ET l'utilisation des dépigmentants
 *     au mercure, aux corticoïdes, à la vitamine A éclaircissante ou à
 *     l'hydroquinone au-delà de 2 %. Même règle qu'en Mode & Beauté.
 *
 *  3. LES PROMESSES DE GUÉRISON. « Guérit le diabète », « soigne le VIH »,
 *     « fait maigrir de 10 kg en une semaine » : ces annonces détournent des
 *     malades d'un vrai traitement. C'est là que se joue le vrai danger de
 *     cette catégorie, bien plus que dans le produit lui-même.
 *
 *  4. LES DISPOSITIFS MÉDICAUX PROFESSIONNELS, déjà traités dans Matériel Pro.
 *
 *  Tout le reste — tisanes, karité, matériel de confort, optique, sport —
 *  se vend librement, et le formulaire le facilite.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import type { Couleur } from '../couleurs'


const SOUS = ['Compléments & Tisanes', 'Soins & Hygiène', 'Matériel médical de confort',
            'Optique & Audition', 'Bien-être & Massage', 'Nutrition sportive']

const PALETTE_BASE: Couleur[] = [
  { nom:'Blanc', css:'#FFFFFF', clair:true }, { nom:'Noir', css:'#1B1A17' },
  { nom:'Gris', css:'#9CA3AF' }, { nom:'Argenté', css:'linear-gradient(135deg,#F3F4F6,#9CA3AF)', clair:true },
  { nom:'Doré', css:'linear-gradient(135deg,#F5D882,#D4AF37)', clair:true },
  { nom:'Écaille', css:'linear-gradient(135deg,#7A4423,#C89B6A)' },
  { nom:'Transparent', css:'linear-gradient(135deg,#FFFFFF,#E5E7EB)', clair:true },
  { nom:'Bleu', css:'#2563EB' }, { nom:'Vert', css:'#16A34A' },
  { nom:'Rouge', css:'#DC2626' }, { nom:'Rose', css:'#EC4899' },
  { nom:'Violet', css:'#8B5CF6' }, { nom:'Marron', css:'#7A4423' },
  { nom:'Multicolore', css:'conic-gradient(#EC4899,#8B5CF6,#2563EB,#16A34A,#FACC15,#EC4899)' }
]
const TOUTES_COULEURS: Couleur[] = PALETTE_BASE

/* Le monopole pharmaceutique : aucun médicament ne se vend ici. */
function medicament(): ChampCourt {
  return { k:'medicament', l:'Nature du produit', req:true,
    o:['Complément alimentaire ou produit de bien-être',
       'Plante, tisane ou produit naturel',
       'Dispositif de confort (non médicamenteux)',
       'Médicament, avec ou sans ordonnance'],
    alerte:{ bon:'Complément alimentaire ou produit de bien-être',
      ok:['Plante, tisane ou produit naturel','Dispositif de confort (non médicamenteux)'],
      texteBon:'Complément ou produit de bien-être : vente libre. Lisez la composition, et parlez-en à votre médecin si vous suivez un traitement.',
      texteMauvais:'INTERDIT. La vente de médicaments est réservée aux pharmacies. Les produits vendus hors circuit sont souvent contrefaits ou mal conservés.',
      textes:{
        'Plante, tisane ou produit naturel':'Produit naturel. « Naturel » ne veut pas dire « sans effet » : certaines plantes interagissent avec les traitements. Demandez l’avis d’un professionnel.',
        'Dispositif de confort (non médicamenteux)':'Dispositif de confort, vente libre. Vérifiez l’état et l’hygiène avant l’achat.'
      } },
    bloque:['Médicament, avec ou sans ordonnance'],
    motifBloc:'La vente de médicaments est un monopole des pharmacies : elle ne peut pas se faire sur Chap.ci.',
    h:function (S: Vals) {
      if (/Médicament/.test(S.medicament || ''))
        return '!La vente de médicaments hors pharmacie est interdite en Côte d’Ivoire. Les produits du marché de la rue sont souvent contrefaits, mal dosés ou conservés sous 30 °C — ils tuent. Cette annonce ne sera pas publiée.'
      return 'Les compléments, tisanes et produits de bien-être se vendent librement. Les médicaments, jamais — même sans ordonnance, même en pharmacie fermée.'
    } }
}

/* Le décret d'avril 2015 — même règle qu'en Mode & Beauté. */
function eclaircissant(): ChampCourt {
  return { k:'eclaircissant', l:'Ce produit éclaircit-il la peau ?', req:true,
    o:['Non — aucun agent éclaircissant','Oui — il contient un agent éclaircissant'],
    bloque:['Oui — il contient un agent éclaircissant'],
    motifBloc:'Les produits éclaircissants sont interdits à la vente en Côte d’Ivoire (décret d’avril 2015).',
    h:function (S: Vals) {
      if (/Oui/.test(S.eclaircissant || ''))
        return '!Le décret d’avril 2015 interdit en Côte d’Ivoire la fabrication, la commercialisation ET l’utilisation des dépigmentants contenant du mercure, des corticoïdes, de la vitamine A éclaircissante ou de l’hydroquinone au-delà de 2 %. Cette annonce ne sera pas publiée.'
      return 'Même règle qu’en Mode & Beauté : un décret adopté en Conseil des ministres en avril 2015 interdit ces produits en Côte d’Ivoire.'
    } }
}

/* Le vrai danger de cette catégorie : détourner un malade d'un traitement. */
function promesse(): ChampCourt {
  return { k:'promesse', l:'Ce que vous annoncez', req:true,
    o:['Aucune promesse de guérison — bien-être uniquement',
       'Aide à la digestion, à l’énergie, au confort',
       'Guérit une maladie (diabète, hypertension, VIH, cancer…)',
       'Fait maigrir rapidement et sans effort'],
    bloque:['Guérit une maladie (diabète, hypertension, VIH, cancer…)','Fait maigrir rapidement et sans effort'],
    motifBloc:'Annoncer qu’un produit guérit une maladie détourne des malades d’un vrai traitement : c’est interdit sur Chap.ci.',
    h:function (S: Vals) {
      if (/Guérit une maladie/.test(S.promesse || ''))
        return '!Promettre de guérir le diabète, l’hypertension, le VIH ou un cancer détourne des malades d’un traitement qui, lui, les soigne. C’est le danger le plus réel de ce rayon. Cette annonce ne sera pas publiée.'
      if (/maigrir rapidement/.test(S.promesse || ''))
        return '!« Perdre 10 kg en une semaine » n’existe pas, et les produits qui le promettent contiennent souvent des diurétiques ou des laxatifs dangereux. Cette annonce ne sera pas publiée.'
      return 'Vantez le confort, l’énergie, le goût, la qualité de la plante. Pas la guérison — c’est là que se joue la limite.'
    } }
}

function peremptionS(): ChampCourt {
  return { k:'peremptionS', l:'Date de péremption', req:true,
    o:['Plus d’un an','6 mois à 1 an','3 à 6 mois','Moins de 3 mois','Dépassée','Sans date (produit brut)'],
    bloque:['Dépassée'],
    motifBloc:'Un produit de santé dont la date est dépassée ne peut pas être vendu.',
    h:function (S: Vals) {
      if (S.peremptionS === 'Dépassée')
        return '!Un complément ou un cosmétique périmé peut être toxique. Cette annonce ne sera pas publiée.'
      if (S.peremptionS === 'Moins de 3 mois')
        return '!Dites-le dans le titre et ajustez le prix : l’acheteur doit savoir qu’il lui reste peu de temps.'
      return 'La date figure sur l’emballage, souvent près du code-barres. Photographiez-la : cela évite toutes les questions.'
    } }
}

function scelle(): ChampCourt {
  return { k:'scelle', l:'Emballage', req:true,
    o:['Neuf, scellé d’origine','Neuf, emballage ouvert','Entamé','Reconditionné par mes soins'],
    h:function (S: Vals) {
      if (/Entamé|Reconditionné/.test(S.scelle || ''))
        return '!Un produit à avaler ou à appliquer, une fois ouvert ou reconditionné, ne peut plus être garanti. Beaucoup d’acheteurs refuseront — et ils ont raison.'
      return 'Le scellé d’origine est la meilleure garantie qu’un acheteur puisse avoir sur ce rayon.'
    } }
}

const SCHEMAS: Record<string, SchemaSous> = {

  'Compléments & Tisanes': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’emballage, la liste des ingrédients et la date. C’est ce qu’un acheteur prudent regarde.',
    titre: function (S: Vals) { return [S.typeComp, S.marqueS, S.contenanceS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeComp', l:'Type de produit', req:true,
        o:['Tisane / infusion','Plante séchée','Gélules','Comprimés complément','Sirop naturel','Huile essentielle','Huile végétale','Miel médicinal','Poudre (moringa, baobab…)','Vitamines','Probiotiques','Écorce / racine','Complément minéral'] },
      medicament(),
      promesse(),
      { k:'plante', l:'Plante ou principe', t: 'text' as const, ph:'Ex : moringa, kinkeliba, gingembre, curcuma',
        h:'Nommez la plante précisément : c’est ce que l’acheteur tape dans la recherche.' },
      { k:'marqueS', l:'Marque ou producteur', t: 'text' as const, ph:'Ex : préparation artisanale, marque connue' },
      { k:'contenanceS', l:'Contenance', t: 'text' as const, req:true, ph:'Ex : 60 gélules, 250 g, 50 cl' },
      scelle(), peremptionS(),
      { k:'origineS', l:'Origine', req:true,
        o:['Production ivoirienne','Autre pays africain','Importé','Préparation artisanale personnelle'] }
    ]
  },

  'Soins & Hygiène': {
    couleurs: true, etat: false, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque teinte ou parfum disponible.',
    titre: function (S: Vals) { return [S.typeSoin, S.marqueS, S.contenanceS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeSoin', l:'Type de produit', req:true,
        o:['Savon','Savon noir','Beurre de karité','Huile de coco','Crème hydratante','Gel douche','Shampoing','Déodorant','Dentifrice','Protection intime','Couches adulte','Gel hydroalcoolique','Coton / compresses','Pansements','Antiseptique','Serviettes hygiéniques','Crème solaire'] },
      medicament(),
      eclaircissant(),
      promesse(),
      { k:'marqueS', l:'Marque', t: 'text' as const, ph:'Ex : Dudu Osun, artisanal, Nivea' },
      { k:'contenanceS', l:'Contenance', t: 'text' as const, req:true, ph:'Ex : 250 ml, 100 g, lot de 3' },
      scelle(), peremptionS(),
      { k:'naturelS', l:'Composition', req:true,
        o:['100 % naturel','Majoritairement naturel','Formulation classique','Je ne sais pas'],
        h:'Le karité et le savon noir ivoiriens se vendent très bien sur leur naturalité. Ne l’annoncez que si c’est vrai.' }
    ]
  },

  'Matériel médical de confort': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’article entier, les sangles et les points d’appui.',
    titre: function (S: Vals) { return [S.typeMatS, S.marqueS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeMatS', l:'Type de matériel', req:true,
        o:['Fauteuil roulant','Béquilles','Canne','Déambulateur','Attelle / orthèse','Ceinture lombaire','Bas de contention','Matelas anti-escarres','Coussin ergonomique','Chaise percée','Barre d’appui','Tensiomètre','Glucomètre','Oxymètre','Thermomètre','Balance','Pilulier','Nébuliseur'],
        h:'Les échographes, autoclaves et matériels de laboratoire ne sont pas ici : leur revente est réservée aux distributeurs agréés (voir Matériel Pro).' },
      medicament(),
      { k:'marqueS', l:'Marque', t: 'text' as const },
      { k:'etatMatS', l:'Fonctionnement', req:true,
        o:['Fonctionne, essai possible','Fonctionne, petit défaut','En panne — pour pièces','Sans mécanisme'] },
      { k:'hygieneS', l:'Hygiène', req:true,
        o:['Désinfecté, prêt à l’usage','À désinfecter avant usage','Housse ou mousse à changer','Usage strictement personnel — non revendable'],
        h:function (S: Vals) {
          if (/strictement personnel/.test(S.hygieneS || ''))
            return '!Bas de contention, embouts buccaux de nébuliseur, protections : ces pièces ne se revendent pas. Vendez l’appareil sans elles, en le précisant.'
          return 'Un matériel de confort d’occasion se désinfecte toujours avant réemploi, même s’il paraît propre.'
        } },
      { k:'poidsMaxS', l:'Poids supporté',
        when:function (S: Vals) { return /Fauteuil|Déambulateur|Chaise percée|Barre/.test(S.typeMatS || '') },
        o:['Jusqu’à 80 kg','Jusqu’à 100 kg','Jusqu’à 120 kg','Plus de 120 kg'],
        h:'Le poids supporté est ce qui décide de l’achat pour un aidant. Sans lui, il ne se déplace pas.' },
      { k:'etalonnage', l:'Étalonnage',
        when:function (S: Vals) { return /Tensiomètre|Glucomètre|Oxymètre|Balance|Thermomètre/.test(S.typeMatS || '') },
        o:['Étalonné récemment','Jamais étalonné','Je ne sais pas'],
        h:'Un tensiomètre déréglé donne des chiffres faux, et c’est pire que pas de tensiomètre du tout.' },
      { k:'accessoiresS', l:'Fourni avec', multi:true,
        o:['Notice','Chargeur','Brassard','Bandelettes','Housse','Facture','Sangles de rechange'] }
    ]
  },

  'Optique & Audition': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque coloris de monture disponible.',
    titre: function (S: Vals) { return [S.typeOpt, S.marqueS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeOpt', l:'Type', req:true,
        o:['Monture de lunettes','Lunettes de soleil','Lunettes de lecture','Étui à lunettes','Cordon','Loupe','Appareil auditif','Pile pour appareil auditif','Produit d’entretien lentilles','Verres correcteurs'] },

      { k:'correction', l:'Correction', req:true,
        o:['Monture seule, sans verres correcteurs','Verres de lecture standard (+1, +1,5, +2…)','Verres correcteurs à ma vue','Verres solaires non correcteurs'],
        alerte:{ bon:'Monture seule, sans verres correcteurs',
          ok:['Verres de lecture standard (+1, +1,5, +2…)','Verres solaires non correcteurs'],
          texteBon:'Monture seule : vous y ferez monter vos propres verres chez un opticien. C’est la bonne façon d’acheter des lunettes d’occasion.',
          texteMauvais:'Des verres taillés pour la vue de quelqu’un d’autre fatiguent les yeux et donnent des maux de tête. Achetez la monture, et faites tailler vos verres.',
          textes:{
            'Verres de lecture standard (+1, +1,5, +2…)':'Verres de lecture standard : ils conviennent si votre correction correspond. Une visite chez l’opticien reste préférable.',
            'Verres solaires non correcteurs':'Verres solaires sans correction. Vérifiez la catégorie de protection UV — une lunette sombre sans filtre UV est pire que pas de lunette.'
          } },
        h:'C’est LA question des lunettes d’occasion. La monture se revend très bien ; les verres, non — ils sont taillés pour un œil précis.' },
      { k:'marqueS', l:'Marque', t: 'text' as const, ph:'Ex : Ray-Ban, sans marque' },
      { k:'uv', l:'Protection UV',
        when:function (S: Vals) { return /soleil/.test(S.typeOpt || '') },
        o:['Catégorie 3 (soleil fort)','Catégorie 2','Catégorie 1','Catégorie 4 (montagne)','Non indiquée'],
        h:'Sous le soleil d’Abidjan, une lunette sombre sans filtre UV fait dilater la pupille et laisse entrer plus d’UV qu’à l’œil nu.' },
      { k:'etatOpt', l:'État', req:true,
        o:['Neuf','Très bon état','Rayures légères sur les verres','Branche à réparer','Verres rayés'] },
      { k:'hygieneOpt', l:'Hygiène', req:true,
        when:function (S: Vals) { return /auditif/.test(S.typeOpt || '') },
        o:['Embouts neufs fournis','Embouts à changer','Usage strictement personnel — non revendable'],
        h:'Les embouts d’un appareil auditif ne se partagent pas : ils se remplacent, et ils sont sur mesure.' },
      { k:'accessoiresOpt', l:'Fourni avec', multi:true, o:['Étui','Chiffon','Cordon','Notice','Facture','Piles'] }
    ]
  },

  'Bien-être & Massage': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible.',
    titre: function (S: Vals) { return [S.typeBien, S.marqueS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeBien', l:'Type', req:true,
        o:['Huile de massage','Appareil de massage','Pistolet de massage','Tapis d’acupression','Coussin chauffant','Bouillotte','Encens','Diffuseur','Bougie parfumée','Sauna facial','Hammam / sauna portable','Ventouses','Rouleau de massage','Tapis de yoga','Balle de massage','Prestation de massage'] },
      medicament(),
      promesse(),
      { k:'marqueS', l:'Marque', t: 'text' as const },
      { k:'prestationB', l:'S’agit-il d’une prestation ?', req:true,
        o:['Non — vente d’un produit','Oui — je propose une séance'],
        h:function (S: Vals) {
          if (/Oui/.test(S.prestationB || ''))
            return 'Une prestation de massage bien-être se propose librement. Le massage thérapeutique et la kinésithérapie, eux, sont réservés aux professionnels diplômés.'
          return ''
        } },
      { k:'lieuB', l:'Où', multi:true,
        when:function (S: Vals) { return /Oui/.test(S.prestationB || '') },
        o:['Dans mon institut','À domicile','En entreprise','En hôtel'] },
      { k:'dureeB', l:'Durée de la séance',
        when:function (S: Vals) { return /Oui/.test(S.prestationB || '') },
        o:['30 minutes','45 minutes','1 heure','1 h 30','2 heures'] },
      { k:'contenanceS', l:'Contenance', t: 'text' as const,
        when:function (S: Vals) { return /huile|encens|bougie|Diffuseur/i.test(S.typeBien || '') }, ph:'Ex : 100 ml' },
      scelle(), peremptionS()
    ]
  },

  'Nutrition sportive': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le pot, la liste des ingrédients et le tableau nutritionnel.',
    titre: function (S: Vals) { return [S.typeNut, S.marqueS, S.contenanceS].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeNut', l:'Type de produit', req:true,
        o:['Protéine en poudre (whey)','Gainer / prise de masse','Créatine','BCAA / acides aminés','Brûleur de graisse','Pré-workout','Barre protéinée','Boisson isotonique','Multivitamines sportives','Oméga 3','Magnésium','Shaker','Substitut de repas'] },
      medicament(),
      promesse(),

      { k:'dopant', l:'Substances', req:true,
        o:['Aucune substance interdite — complément alimentaire courant',
           'Contient un anabolisant, une hormone ou un stéroïde'],
        alerte:{ bon:'Aucune substance interdite — complément alimentaire courant',
          texteBon:'Complément alimentaire courant. Lisez tout de même la composition, et parlez-en à un médecin si vous suivez un traitement.',
          texteMauvais:'INTERDIT ET DANGEREUX. Les anabolisants et hormones vendus hors circuit médical détruisent le foie, le cœur et la fertilité.' },
          bloque:['Contient un anabolisant, une hormone ou un stéroïde'],
        motifBloc:'La vente d’anabolisants, d’hormones et de stéroïdes est interdite : ils relèvent de la prescription médicale.',
        h:function (S: Vals) {
          if (/anabolisant/.test(S.dopant || ''))
            return '!Anabolisants, testostérone et hormones de croissance vendus en salle ou en ligne sont presque toujours contrefaits, et détruisent le foie, le cœur et la fertilité. Cette annonce ne sera pas publiée.'
          return 'Whey, créatine, BCAA et vitamines sont des compléments alimentaires ordinaires, en vente libre.'
        } },
      { k:'marqueS', l:'Marque', t: 'text' as const, ph:'Ex : Optimum Nutrition, sans marque' },
      { k:'contenanceS', l:'Contenance', t: 'text' as const, req:true, ph:'Ex : 2 kg, 90 gélules' },
      { k:'gout', l:'Parfum', t: 'text' as const, ph:'Ex : chocolat, vanille, fraise' },
      scelle(), peremptionS(),
      { k:'authenticiteN', l:'Authenticité', req:true,
        o:['Produit authentique, avec facture ou preuve','Produit authentique, sans preuve','Je ne sais pas'],
        h:'La contrefaçon est massive sur la protéine en poudre : un pot rempli de farine et d’arôme se vend au prix du vrai. Le numéro de lot et le sceau sous le couvercle se vérifient.' }
    ]
  }
}

export const SANTE: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}
