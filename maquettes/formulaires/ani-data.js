/* ==========================================================================
 *  ANIMAUX — tout ce qui est vivant, au même endroit.
 *
 *  L'« Élevage » quittait Agriculture et « Volaille » vivait ici : deux
 *  endroits pour un même mouton. Tout le vivant est désormais réuni — un
 *  acheteur qui cherche une bête la cherche ici, qu'elle serve à la fête ou
 *  au salon.
 *
 *  Trois réalités commandent ces formulaires :
 *
 *  1. LES ESPÈCES PROTÉGÉES. Perroquet gris du Gabon, pangolin, tortue,
 *     singe, python, ivoire : la Côte d'Ivoire est partie à la CITES et sa
 *     loi sur la faune interdit leur capture, leur détention et leur vente.
 *     Ce sont pourtant les annonces les plus fréquentes du rayon « oiseaux
 *     exotiques ». La question est posée, et la réponse refuse l'annonce.
 *
 *  2. LES COMBATS D'ANIMAUX. Interdits. Une annonce qui vend un animal
 *     « pour le combat » est refusée.
 *
 *  3. LA VACCINATION ET LE SEVRAGE. Un chiot vendu à trois semaines meurt
 *     souvent. Un animal non vacciné contamine le foyer. Ces deux champs
 *     protègent l'animal, l'acheteur et le vendeur — et un chiot vacciné se
 *     vend bien plus cher, ce que beaucoup de vendeurs ignorent.
 * ========================================================================== */

var SOUS = ['Volaille', 'Bétail & Élevage', 'Chiens & Chats', 'Oiseaux, Poissons & Reptiles',
            'Aliments pour animaux', 'Accessoires & Matériel']

var PALETTE_BASE = []
var TOUTES_COULEURS = []

/* La question qui refuse l'annonce : l'animal est-il protégé ? */
function protegee() {
  return { k:'protegee', l:'Statut de l’espèce', req:true,
    o:['Espèce domestique ou d’élevage courante',
       'Espèce sauvage capturée (perroquet gris, tortue, pangolin, singe, python…)'],
    alerte:{ bon:'Espèce domestique ou d’élevage courante',
      texteBon:'Espèce courante, rien à signaler. Demandez tout de même à voir l’animal vivant avant de payer.',
      texteMauvais:'INTERDIT. La capture, la détention et la vente d’espèces sauvages protégées sont interdites en Côte d’Ivoire et par la convention CITES.' },
    bloque:['Espèce sauvage capturée (perroquet gris, tortue, pangolin, singe, python…)'],
    motifBloc:'La vente d’une espèce sauvage protégée est interdite par la loi ivoirienne et par la convention CITES.',
    h:function (S) {
      if (/sauvage capturée/.test(S.protegee || ''))
        return '!Le perroquet gris du Gabon, le pangolin, les tortues, les singes et les pythons sont protégés. Leur capture et leur vente sont poursuivies, et la détention elle-même l’est. Cette annonce ne sera pas publiée.'
      return 'Le perroquet gris du Gabon est l’oiseau le plus vendu illégalement d’Afrique de l’Ouest. Si votre oiseau vient d’un élevage, dites-le et gardez le justificatif.'
    } }
}

/* Les combats sont interdits, et l'usage annoncé change tout. */
function usageAnimal(o) {
  return { k:'usage', l:'Usage', req:true, o:o.concat(['Combat / bagarre']),
    bloque:['Combat / bagarre'],
    motifBloc:'Les combats d’animaux sont interdits : une annonce qui vend un animal pour le combat ne peut pas être publiée.',
    h:function (S) {
      if (S.usage === 'Combat / bagarre')
        return '!Les combats d’animaux sont interdits et poursuivis. Cette annonce ne sera pas publiée.'
      return ''
    } }
}

function sante(quoi) {
  return [
    { k:'vaccins', l:'Vaccination', req:true,
      o:['Vacciné, carnet à l’appui','Vacciné, sans carnet','Primo-vaccination faite','Non vacciné','Trop jeune pour être vacciné'],
      alerte:{ bon:'Vacciné, carnet à l’appui',
        ok:['Vacciné, sans carnet','Primo-vaccination faite','Trop jeune pour être vacciné'],
        texteBon:'Vacciné avec carnet à l’appui. Demandez à le voir avant de payer, et vérifiez que les dates correspondent à l’âge annoncé.',
        texteMauvais:'Animal non vacciné. Il peut contaminer vos autres bêtes ou votre foyer : prévoyez une visite vétérinaire dès la remise, et négociez le prix en conséquence.',
        textes:{
          'Vacciné, sans carnet':'Vacciné, mais sans carnet à montrer. Demandez le nom du vétérinaire et la date — un vendeur sérieux s’en souvient.',
          'Trop jeune pour être vacciné':'Trop jeune pour être vacciné, c’est normal. Prévoyez la primo-vaccination dans les semaines qui suivent.'
        } },
      h:function (S) {
        if (S.vaccins === 'Non vacciné')
          return '!Un animal non vacciné se vend bien moins cher et peut contaminer le foyer de l’acheteur. Une primo-vaccination coûte peu et change le prix du tout au tout.'
        if (/carnet à l’appui/.test(S.vaccins || ''))
          return 'Le carnet est ce qui rassure le plus. Photographiez-le, en masquant vos coordonnées.'
        return ''
      } },
    { k:'vermifuge', l:'Vermifuge', req:true,
      o:['Vermifugé récemment','Vermifugé il y a plus de 3 mois','Jamais vermifugé','Je ne sais pas'] },
    { k:'santeGen', l:'État de santé', req:true,
      o:['En parfaite santé','Bon état général','Sous traitement','Handicap ou maladie chronique'],
      h:'Annoncer un traitement en cours n’empêche pas de vendre — le cacher fait le litige et met ' + quoi + ' en danger.' }
  ]
}

var SCHEMAS = {

  'Volaille': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez les bêtes vivantes, dans leur enclos. Une photo de catalogue ne rassure personne.',
    titre: function (S) { return [S.especeV, S.ageV, S.nombreV].filter(Boolean).join(' · ') },
    champs: [
      { k:'especeV', l:'Espèce', req:true,
        o:['Poulet de chair','Poule pondeuse','Poulet bicyclette (local)','Pintade','Canard','Dindon','Pigeon','Caille','Oie','Poussins d’un jour','Œufs à couver','Œufs de consommation'] },
      { k:'ageV', l:'Âge', req:true,
        o:['1 jour','1 à 4 semaines','1 à 2 mois','2 à 4 mois','Plus de 4 mois','Adulte en ponte'] },
      { k:'nombreV', l:'Nombre disponible', req:true,
        o:['À l’unité','2 à 10','10 à 50','50 à 200','200 à 1000','Plus de 1000'] },
      { k:'poidsV', l:'Poids moyen', t:'text', ph:'Ex : 1,8 kg par sujet',
        h:'Sur du poulet de chair, le poids fait le prix. Sans lui, l’acheteur en gros passe son chemin.' },
      { k:'elevageV', l:'Mode d’élevage', req:true,
        o:['Élevage au sol','En cage','Plein air / divagation','Élevage bicyclette traditionnel'],
        h:'Le poulet bicyclette se vend deux fois le prix du poulet de chair : si c’en est un, dites-le.' }
    ].concat(sante('la bête')).concat([
      { k:'ponte', l:'Production d’œufs',
        when:function (S) { return /pondeuse|Caille|Canard|Pintade/.test(S.especeV || '') },
        o:['En pleine ponte','Début de ponte','Fin de ponte','Pas encore en ponte'] },
      { k:'livraisonV', l:'Remise', req:true,
        o:['À venir chercher sur place','Je livre dans ma commune','Je livre tout Abidjan','Je livre en région'],
        h:'Le transport de volaille vivante par forte chaleur tue. Convenez d’une heure fraîche, tôt le matin.' }
    ])
  },

  'Bétail & Élevage': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix par tête',
    sansCouleur: 'Photographiez chaque bête entière, de profil, debout. C’est ainsi qu’on juge un animal.',
    titre: function (S) { return [S.especeB, S.sexeB, S.ageB].filter(Boolean).join(' · ') },
    champs: [
      { k:'especeB', l:'Espèce', req:true,
        o:['Mouton','Bélier','Chèvre','Bouc','Bœuf','Vache','Veau','Porc','Truie','Porcelet','Lapin','Aulacode (agouti)','Escargot','Âne','Cheval'] },
      { k:'sexeB', l:'Sexe', req:true, o:['Mâle','Femelle','Lot mixte'] },
      { k:'ageB', l:'Âge', req:true,
        o:['Moins de 3 mois','3 à 6 mois','6 mois à 1 an','1 à 2 ans','2 à 4 ans','Plus de 4 ans'] },
      { k:'poidsB', l:'Poids approximatif', t:'text', req:true, ph:'Ex : 35 kg',
        h:'Un mouton se vend au poids autant qu’à la vue. Le donner, même approximatif, évite trois négociations.' },
      usageAnimal(['Boucherie','Reproduction','Fête religieuse (Tabaski, Noël)','Élevage / cheptel','Travail / trait','Lait']),
      { k:'raceB', l:'Race', t:'text', ph:'Ex : Djallonké, Sahélien, Balami' },
      { k:'gestation', l:'Gestation',
        when:function (S) { return S.sexeB === 'Femelle' },
        o:['Non gestante','Gestante','Vient de mettre bas','Suitée (avec petits)'] },
      { k:'nombreB', l:'Nombre disponible', req:true,
        o:['1 tête','2 à 5 têtes','5 à 20 têtes','20 à 100 têtes','Plus de 100 têtes'] }
    ].concat(sante('la bête')).concat([
      { k:'certifB', l:'Documents', multi:true,
        o:['Carnet de vaccination','Certificat vétérinaire','Certificat d’origine','Aucun document'],
        h:'Un certificat vétérinaire est exigé pour transporter du bétail entre régions. Sans lui, le contrôle routier bloque le camion.' }
    ])
  },

  'Chiens & Chats': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’animal éveillé, entier, et avec sa mère s’il est jeune. C’est le meilleur gage de sérieux.',
    titre: function (S) { return [S.especeC, S.raceC, S.ageC].filter(Boolean).join(' · ') },
    champs: [
      { k:'especeC', l:'Animal', req:true, o:['Chien','Chiot','Chat','Chaton'] },
      { k:'raceC', l:'Race', t:'text', req:true, ph:'Ex : Berger allemand, Rottweiler, croisé, chat de gouttière',
        h:'« Croisé » et « chat de gouttière » sont des réponses parfaitement honnêtes et se vendent très bien.' },
      { k:'ageC', l:'Âge', req:true,
        o:['Moins de 8 semaines','8 semaines à 3 mois','3 à 6 mois','6 mois à 1 an','1 à 3 ans','Plus de 3 ans'] },
      { k:'sevrage', l:'Sevrage', req:true,
        when:function (S) { return /Chiot|Chaton/.test(S.especeC || '') || /Moins de 8|8 semaines/.test(S.ageC || '') },
        o:['Sevré','En cours de sevrage','Non sevré, encore sous la mère'],
        h:function (S) {
          if (/Non sevré/.test(S.sevrage || ''))
            return '!Un chiot séparé de sa mère avant huit semaines développe des troubles et meurt souvent. Attendez le sevrage : il se vendra mieux, et il survivra.'
          return 'Huit semaines est le minimum. Un chiot sevré, vacciné et vermifugé se vend plusieurs fois le prix d’un chiot pris trop tôt.'
        } },
      { k:'sexeC', l:'Sexe', req:true, o:['Mâle','Femelle','Portée mixte'] },
      usageAnimal(['Compagnie','Garde','Chasse','Reproduction / élevage']),
      { k:'sterilise', l:'Stérilisation', o:['Stérilisé','Non stérilisé','Trop jeune'] },
      { k:'pedigree', l:'Papiers', req:true,
        o:['Pedigree / LOF','Certificat de naissance','Carnet de santé uniquement','Aucun papier'],
        h:'Un pedigree se vérifie. Sans papiers, un « pure race » se vend au prix d’un croisé — et c’est normal.' },
      { k:'caractere', l:'Caractère', multi:true,
        o:['Sociable avec les enfants','S’entend avec d’autres animaux','Craintif','Dominant','Éduqué / propre','Aboie beaucoup'],
        h:'Dire qu’un chien est dominant ou craintif évite qu’il revienne dans un mois. Un mauvais placement finit toujours mal pour l’animal.' }
    ].concat(sante('l’animal'))
  },

  'Oiseaux, Poissons & Reptiles': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’animal vivant dans son installation, et non une image trouvée en ligne.',
    titre: function (S) { return [S.especeO, S.ageO].filter(Boolean).join(' · ') },
    champs: [
      { k:'familleO', l:'Famille', req:true, o:['Oiseau','Poisson d’aquarium','Reptile','Rongeur','Autre'] },
      { k:'especeO', l:'Espèce', req:true, dependDe:'familleO', libre:'Autre',
        table:{
          'Oiseau': ['Canari','Perruche ondulée','Inséparable','Mandarin','Tourterelle','Poule d’ornement','Paon'],
          'Poisson d’aquarium': ['Poisson rouge','Guppy','Combattant (betta)','Cichlidé','Scalaire','Silure d’ornement','Poissons assortis'],
          'Reptile': ['Tortue d’élevage déclarée','Gecko d’élevage','Iguane d’élevage'],
          'Rongeur': ['Hamster','Cochon d’Inde','Lapin nain','Souris','Rat domestique']
        } },

      // Le champ qui refuse l'annonce.
      protegee(),

      { k:'ageO', l:'Âge', req:true, o:['Jeune','Adulte','Reproducteur','Je ne sais pas'] },
      { k:'origineO', l:'Origine', req:true,
        o:['Né en captivité, élevage local','Élevage déclaré avec justificatif','Importé avec documents','Origine inconnue'],
        h:function (S) {
          if (S.origineO === 'Origine inconnue')
            return '!Un oiseau ou un reptile d’origine inconnue est présumé capturé dans la nature. Sans justificatif, l’annonce sera signalée.'
          return 'Un animal né en captivité se vend légalement et sereinement. Gardez le justificatif de l’éleveur.'
        } },
      { k:'nombreO', l:'Nombre', req:true, o:['À l’unité','Par paire','Petit groupe','Lot complet'] },
      { k:'installation', l:'Fourni avec', multi:true,
        o:['Cage','Aquarium','Terrarium','Mangeoire','Filtre / pompe','Chauffage','Aucun matériel'] }
    ].concat(sante('l’animal'))
  },

  'Aliments pour animaux': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le sac et son étiquette : composition, date, numéro de lot.',
    titre: function (S) { return [S.typeAl, S.pourQui, S.condAl].filter(Boolean).join(' · ') },
    champs: [
      { k:'pourQui', l:'Pour quel animal', req:true,
        o:['Volaille','Bétail','Porc','Chien','Chat','Poisson','Lapin','Oiseau','Aulacode'] },
      { k:'typeAl', l:'Type d’aliment', req:true,
        o:['Aliment complet','Provende','Son de blé','Tourteau','Maïs concassé','Croquettes','Pâtée','Fourrage / foin','Complément minéral','Vitamines'] },
      { k:'stade', l:'Stade',
        when:function (S) { return /Volaille|Porc|Bétail/.test(S.pourQui || '') },
        o:['Démarrage','Croissance','Finition','Ponte','Gestation / lactation'] },
      { k:'condAl', l:'Conditionnement', req:true,
        o:['Sac de 5 kg','Sac de 10 kg','Sac de 25 kg','Sac de 50 kg','En vrac','Petit sachet'] },
      { k:'peremptionAl', l:'Date limite', req:true,
        o:['Plus de 6 mois','1 à 6 mois','Moins d’un mois','Dépassée','Sans date'],
        alerte:{ bon:'Plus de 6 mois',
          ok:['1 à 6 mois','Sans date'],
          texteBon:'Date confortable. Vérifiez tout de même le sac : ni humidité, ni odeur de moisi.',
          texteMauvais:'La date approche. Vérifiez l’état du sac avant d’acheter en quantité.',
          textes:{ 'Dépassée':'INTERDIT. Un aliment périmé rend les bêtes malades et ne peut pas être vendu.' } },
        bloque:['Dépassée'],
        motifBloc:'Un aliment pour animaux dont la date est dépassée ne peut pas être vendu.',
        h:function (S) {
          if (S.peremptionAl === 'Dépassée')
            return '!Un aliment périmé ou moisi provoque des mortalités en élevage. Cette annonce ne sera pas publiée.'
          return 'Un aliment mal stocké moisit et devient toxique. Précisez qu’il est resté au sec.'
        } },
      { k:'marqueAl', l:'Marque ou fabricant', t:'text', ph:'Ex : Ivograin, provende maison' },
      { k:'grosAl', l:'Vente en gros', t:'toggle' }
    ]
  },

  'Accessoires & Matériel': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le matériel monté, et de près sur les points d’usure.',
    titre: function (S) { return [S.typeMat, S.pourQuiM].filter(Boolean).join(' · ') },
    champs: [
      { k:'pourQuiM', l:'Pour quel animal', req:true,
        o:['Volaille','Bétail','Porc','Chien','Chat','Poisson','Lapin','Oiseau','Tous animaux'] },
      { k:'typeMat', l:'Type de matériel', req:true,
        o:['Cage','Poulailler','Couveuse / incubateur','Mangeoire','Abreuvoir','Éleveuse / chauffage','Aquarium','Terrarium','Niche','Laisse et collier','Panier de transport','Litière','Clôture / grillage','Matériel de traite','Tondeuse animale','Produit de soin'] },
      { k:'capaciteMat', l:'Capacité',
        when:function (S) { return /Cage|Poulailler|Couveuse|Aquarium|Mangeoire|Abreuvoir/.test(S.typeMat || '') },
        o:['Moins de 10 sujets','10 à 50 sujets','50 à 200 sujets','Plus de 200 sujets','Petit volume','Grand volume'] },
      { k:'matiereMat', l:'Matière',
        o:['Métal galvanisé','Grillage','Bois','Plastique','Verre','Tissu'] },
      { k:'etatMat', l:'Fonctionnement', req:true,
        o:['Fonctionne parfaitement, essai possible','Fonctionne, petit défaut','En panne — pour pièces ou à réparer','Sans mécanisme'],
        alerte:{ bon:'Fonctionne parfaitement, essai possible',
          ok:['Sans mécanisme','En panne — pour pièces ou à réparer'],
          texteBon:'Le vendeur propose un essai devant vous. Exigez-le sur une couveuse : c’est le seul moyen de vérifier la régulation.',
          texteMauvais:'Un défaut est annoncé. Demandez lequel exactement et faites brancher l’appareil avant de payer.',
          textes:{ 'En panne — pour pièces ou à réparer':'Vendu en panne, et le vendeur le dit. Le prix doit être celui des pièces.' } } },
      { k:'dimsMat', l:'Dimensions', t:'text', ph:'Ex : 120 × 60 × 90 cm' },
      { k:'grosMat', l:'Vente en gros', t:'toggle' }
    ]
  }
}
