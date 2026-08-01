/* ==========================================================================
 *  MATÉRIEL PRO — l'équipement qui fait tourner un commerce.
 *
 *  Ce n'est pas de l'électroménager : ici, l'acheteur achète un OUTIL DE
 *  TRAVAIL. Ce qu'il veut savoir n'est pas « est-ce joli », c'est « combien
 *  d'heures a-t-il tourné, qui répare, et où trouve-t-on les pièces ».
 *
 *  1. LES HEURES DE FONCTIONNEMENT sont le kilométrage d'une machine. Un
 *     groupe frigorifique de 20 000 heures n'a pas la même valeur qu'un de
 *     2 000, même s'ils se ressemblent sur la photo.
 *
 *  2. LES PIÈCES DÉTACHÉES décident de tout. Une machine dont on ne trouve
 *     plus les pièces à Abidjan est une machine morte à la première panne :
 *     elle vaut le prix de la ferraille, pas celui de l'équipement.
 *
 *  3. LA FACTURE. Un professionnel qui achète du matériel a besoin d'une
 *     facture pour l'amortir et pour le déclarer. Sans elle, une partie du
 *     marché est fermée.
 *
 *  Le matériel médical a son propre garde-fou : sa revente est encadrée, et
 *  un dispositif de diagnostic ou de soin sans autorisation ne peut pas être
 *  proposé entre particuliers.
 * ========================================================================== */

var SOUS = ['Restauration & Maquis', 'Boutique & Commerce', 'Agriculture & Élevage',
            'Industrie & Atelier', 'Bureau & Informatique', 'Salon & Esthétique', 'Médical & Paramédical']

var PALETTE_BASE = []
var TOUTES_COULEURS = []

/* Le kilométrage d'une machine. */
function heures() {
  return { k:'heures', l:'Heures de fonctionnement', t:'num', unite:'h', ph:'Ex : 4500',
    h:function (S) {
      var n = parseInt(S.heures, 10)
      if (!n) return 'L’heure de fonctionnement est le kilométrage d’une machine. Si le compteur existe, donnez-le ; sinon, dites-le franchement.'
      var f = n.toLocaleString('fr-FR').replace(/ /g, ' ')
      if (n < 2000) return f + ' heures : très peu. C’est un vrai argument de vente — mettez-le dans le titre.'
      if (n < 10000) return f + ' heures : usage normal pour une machine professionnelle.'
      if (n < 20000) return f + ' heures : bien utilisée. Annoncez l’entretien fait, et le prix suivra.'
      return '!' + f + ' heures : c’est beaucoup. Précisez ce qui a été révisé ou remplacé, sinon l’acheteur suppose le pire.'
    } }
}

/* Ce qui décide vraiment de la valeur d'une machine d'occasion. */
function pieces() {
  return { k:'pieces', l:'Pièces détachées', req:true,
    o:['Disponibles à Abidjan','Disponibles sur commande','Difficiles à trouver','Introuvables — modèle abandonné'],
    alerte:{ bon:'Disponibles à Abidjan',
      ok:['Disponibles sur commande'],
      texteBon:'Les pièces se trouvent sur place. C’est ce qui fait la différence entre une machine et un tas de ferraille au premier pépin.',
      texteMauvais:'Les pièces sont difficiles ou impossibles à trouver. Cette machine s’arrête définitivement à la première panne : n’en payez pas le prix d’un matériel entretenable.',
      textes:{
        'Disponibles sur commande':'Pièces disponibles sur commande : comptez un délai. Demandez le nom du fournisseur avant d’acheter.'
      } },
    h:function (S) {
      if (/Difficiles|Introuvables/.test(S.pieces || ''))
        return '!Une machine dont on ne trouve plus les pièces vaut le prix de la ferraille. Dites-le, et vendez-la pour ce qu’elle est : une source de pièces ou un dépannage court.'
      return 'C’est la première question d’un acheteur professionnel, avant même le prix. Nommez le fournisseur si vous le connaissez.'
    } }
}

function communsPro() {
  return [
    heures(),
    { k:'etatMarche', l:'Fonctionnement', req:true,
      o:['Fonctionne, essai possible sur place','Fonctionne, petit défaut annoncé','En panne — à réparer ou pour pièces'],
      h:'Un acheteur professionnel voudra faire tourner la machine devant vous. Proposez-le d’emblée : cela vaut toutes les descriptions.' },
    pieces(),
    { k:'entretien', l:'Entretien', req:true,
      o:['Carnet d’entretien à jour','Entretenu régulièrement, sans carnet','Entretien irrégulier','Jamais entretenu'] },
    { k:'voltagePro', l:'Alimentation', req:true,
      o:['220 V monophasé','380 V triphasé','Gaz','Diesel / essence','Manuel','Batterie'],
      h:function (S) {
        if (/380 V/.test(S.voltagePro || ''))
          return '!Le triphasé n’est pas disponible partout : l’acheteur doit vérifier son abonnement CIE avant de se déplacer. Le préciser évite le camion pour rien.'
        return ''
      } },
    { k:'facturePro', l:'Facture', req:true,
      o:['Facture d’origine fournie','Facture de revente possible','Aucune facture'],
      h:'Un professionnel a besoin d’une facture pour amortir son matériel. Sans elle, une partie du marché vous est fermée.' },
    { k:'garantiePro', l:'Garantie', req:true,
      o:['Aucune garantie','15 jours','1 mois','3 mois','6 mois','1 an','Garantie constructeur en cours'] },
    { k:'livraisonPro', l:'Transport et installation', req:true,
      o:['À enlever sur place','Livraison possible','Livraison et installation comprises','Installation en supplément'],
      h:'Une machine lourde ne se transporte pas dans un taxi. Dire qui s’en charge évite la vente annulée au dernier moment.' }
  ]
}

var SCHEMAS = {

  'Restauration & Maquis': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la machine en marche, et la plaque signalétique. Un professionnel regarde d’abord ça.',
    titre: function (S) { return [S.typeResto, S.marquePro, S.capaciteResto].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeResto', l:'Type de matériel', req:true,
        o:['Chambre froide','Congélateur coffre','Vitrine réfrigérée','Réfrigérateur professionnel','Four à pizza','Four professionnel','Fourneau / piano','Friteuse','Grill / braisier','Plancha','Machine à glaçons','Machine à café','Batteur / pétrin','Trancheuse','Hotte aspirante','Plonge inox','Table inox','Chariot','Chaises et tables de maquis','Bar / comptoir'] },
      { k:'marquePro', l:'Marque', t:'text', ph:'Ex : Bosch, Nasco, fabrication locale' },
      { k:'capaciteResto', l:'Capacité',
        when:function (S) { return /froide|Congélateur|Vitrine|Réfrigérateur|Four|Friteuse|glaçons|Pétrin/.test(S.typeResto || '') },
        o:['Petite (moins de 100 L)','Moyenne (100 à 400 L)','Grande (400 à 1000 L)','Très grande (plus de 1000 L)','Chambre complète'] },
      { k:'inox', l:'Matériau', o:['Inox alimentaire','Acier peint','Aluminium','Mixte'],
        h:'L’inox alimentaire est exigé par les contrôles d’hygiène. C’est un vrai argument de revente.' }
    ].concat(communsPro())
  },

  'Boutique & Commerce': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Montrez le matériel installé si possible : un commerçant se projette mieux.',
    titre: function (S) { return [S.typeBoutique, S.marquePro].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeBoutique', l:'Type de matériel', req:true,
        o:['Caisse enregistreuse','Terminal de paiement','Balance commerciale','Rayonnage / gondole','Présentoir','Vitrine','Portique antivol','Caméra de surveillance','Étiqueteuse','Lecteur code-barres','Imprimante à tickets','Coffre-fort','Comptoir','Mannequin','Chariot / panier','Enseigne lumineuse'] },
      { k:'marquePro', l:'Marque', t:'text', ph:'Ex : Casio, Sam4s, fabrication locale' },
      { k:'homologBalance', l:'Vérification métrologique', req:true,
        when:function (S) { return /Balance/.test(S.typeBoutique || '') },
        o:['Vérifiée et poinçonnée','Vérification à refaire','Jamais vérifiée'],
        h:'Une balance commerciale doit être vérifiée par le service de métrologie. Sans poinçon à jour, le contrôle la met sous scellé.' },
      { k:'dimsPro', l:'Dimensions', t:'text', ph:'Ex : 200 × 90 × 45 cm' }
    ].concat(communsPro())
  },

  'Agriculture & Élevage': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la machine en fonctionnement, et le moteur ouvert.',
    titre: function (S) { return [S.typeAgri, S.marquePro, S.heures ? S.heures + ' h' : ''].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeAgri', l:'Type de matériel', req:true,
        o:['Motopompe','Pulvérisateur','Broyeur','Décortiqueuse','Moulin','Égreneuse','Presse à huile','Séchoir','Couveuse industrielle','Mangeoire automatique','Abreuvoir automatique','Système d’irrigation','Motoculteur','Débroussailleuse pro','Tronçonneuse pro','Charrue','Semoir','Matériel de traite','Ruche et matériel apicole'],
        h:'Les tracteurs et pelleteuses ne sont pas ici : ils vivent dans Véhicules → Engins & Agricoles.' },
      { k:'marquePro', l:'Marque', t:'text', ph:'Ex : Honda, Kipor, sans marque' },
      { k:'debit', l:'Débit ou capacité', t:'text', ph:'Ex : 30 m³/h, 500 kg/h',
        h:'Le débit est ce qui permet à un exploitant de calculer s’il rentre dans ses frais. Sans lui, il ne se déplace pas.' },
      { k:'surface', l:'Adapté à une surface de',
        o:['Moins d’un hectare','1 à 5 hectares','5 à 20 hectares','Plus de 20 hectares','Sans objet'] }
    ].concat(communsPro())
  },

  'Industrie & Atelier': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la plaque signalétique et la machine sous tension.',
    titre: function (S) { return [S.typeIndus, S.marquePro, S.heures ? S.heures + ' h' : ''].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeIndus', l:'Type de matériel', req:true,
        o:['Groupe électrogène','Compresseur','Poste à souder','Tour','Fraiseuse','Perceuse à colonne','Scie à ruban','Cintreuse','Presse','Cabine de peinture','Pont élévateur','Cric hydraulique','Machine à coudre industrielle','Machine à broder','Imprimerie / offset','Sérigraphie','Découpe laser','Groupe froid','Palan / treuil','Chariot élévateur'] },
      { k:'marquePro', l:'Marque', t:'text' },
      { k:'puissancePro', l:'Puissance', t:'text', ph:'Ex : 5,5 kW, 10 kVA, 3 CV' },
      { k:'usagePro', l:'Usage précédent', req:true,
        o:['Atelier artisanal','Usine / production continue','Chantier','Peu utilisé','Neuf, jamais servi'],
        h:'Une machine sortie d’une production continue n’a pas vécu la vie d’une machine d’atelier. Le dire protège le prix des deux côtés.' }
    ].concat(communsPro())
  },

  'Bureau & Informatique': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le mobilier monté et les compteurs des copieurs.',
    titre: function (S) { return [S.typeBureau, S.marquePro].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeBureau', l:'Type de matériel', req:true,
        o:['Photocopieur','Imprimante professionnelle','Scanner de production','Destructeur de documents','Relieuse','Plastifieuse','Vidéoprojecteur','Tableau blanc / paperboard','Bureau','Chaise de bureau','Armoire de classement','Cloison / open space','Fauteuil de direction','Table de réunion','Coffre de bureau','Standard téléphonique'],
        h:'Les ordinateurs, écrans et petites imprimantes vivent dans Électronique. Ici, c’est le matériel de production et le mobilier professionnel.' },
      { k:'marquePro', l:'Marque', t:'text', ph:'Ex : Canon, Ricoh, Konica' },
      { k:'compteurCopies', l:'Compteur de copies', t:'num', unite:'copies', ph:'Ex : 120000',
        when:function (S) { return /Photocopieur|Imprimante|Scanner/.test(S.typeBureau || '') },
        h:function (S) {
          var n = parseInt(S.compteurCopies, 10)
          if (n && n > 500000) return '!Au-delà de 500 000 copies, le tambour et le four arrivent en fin de vie. Précisez s’ils ont été remplacés.'
          return 'Le compteur est le kilométrage d’un copieur. Il s’affiche dans le menu de la machine — l’acheteur le vérifiera.'
        } },
      { k:'consommables', l:'Consommables', req:true,
        when:function (S) { return /Photocopieur|Imprimante|Relieuse|Plastifieuse|Vidéoprojecteur/.test(S.typeBureau || '') },
        o:['Consommables neufs fournis','Consommables entamés','Sans consommable','Consommables encore trouvables','Consommables introuvables'],
        h:'Un toner de copieur professionnel coûte parfois plus cher que la machine d’occasion. L’acheteur doit le savoir avant.' },
      { k:'quantitePro', l:'Quantité disponible',
        o:['À l’unité','2 à 5','5 à 20','Plus de 20','Lot complet de bureau'] }
    ].concat(communsPro())
  },

  'Salon & Esthétique': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le poste complet, installé : c’est ce qu’achète une gérante de salon.',
    titre: function (S) { return [S.typeSalon, S.marquePro].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeSalon', l:'Type de matériel', req:true,
        o:['Fauteuil de coiffure','Bac à shampoing','Casque séchoir','Vapozone','Table de massage','Chariot de coiffure','Miroir professionnel','Stérilisateur','Lampe UV / LED ongles','Ponceuse à ongles','Appareil de soin visage','Table d’esthétique','Tondeuse professionnelle','Sèche-cheveux professionnel','Lisseur professionnel','Chaise d’attente','Comptoir d’accueil','Mannequin de coiffure'] },
      { k:'marquePro', l:'Marque', t:'text' },
      { k:'hygienePro', l:'Hygiène', req:true,
        o:['Désinfecté et prêt à l’emploi','À nettoyer','Housse ou revêtement à changer'],
        h:'Un fauteuil ou une table dont le revêtement est fendu ne se désinfecte plus correctement. Le dire, ou le changer.' },
      { k:'quantiteSalon', l:'Quantité', o:['À l’unité','2 à 3 postes','4 à 6 postes','Salon complet'] }
    ].concat(communsPro())
  },

  'Médical & Paramédical': {
    couleurs: false, etat: true, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la plaque, le numéro de série et les accessoires fournis.',
    titre: function (S) { return [S.typeMed, S.marquePro].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeMed', l:'Type de matériel', req:true,
        o:['Fauteuil roulant','Béquilles / déambulateur','Lit médicalisé','Tensiomètre','Glucomètre','Oxymètre','Nébuliseur','Concentrateur d’oxygène','Table d’examen','Autoclave / stérilisateur','Négatoscope','Échographe','Appareil dentaire','Matériel de laboratoire','Balance médicale','Matelas anti-escarres','Attelle / orthèse'] },

      { k:'cadreMed', l:'Cadre de la vente', req:true,
        o:['Matériel de confort ou d’aide à la mobilité','Appareil de mesure grand public','Dispositif médical réservé aux professionnels de santé'],
        alerte:{ bon:'Matériel de confort ou d’aide à la mobilité',
          ok:['Appareil de mesure grand public'],
          texteBon:'Fauteuil, béquilles, lit : ce matériel se revend librement. Vérifiez l’état des sangles, des freins et des roues.',
          texteMauvais:'Un dispositif médical réservé aux professionnels ne peut pas être revendu entre particuliers sur Chap.ci.',
          textes:{
            'Appareil de mesure grand public':'Tensiomètre, glucomètre, oxymètre : vente libre. Vérifiez que l’appareil a été étalonné et que les accessoires suivent.'
          } },
        bloque:['Dispositif médical réservé aux professionnels de santé'],
        motifBloc:'La revente d’un dispositif médical réservé aux professionnels de santé est encadrée : elle ne peut pas se faire entre particuliers sur Chap.ci.',
        h:function (S) {
          if (/réservé aux professionnels/.test(S.cadreMed || ''))
            return '!Échographe, autoclave, matériel dentaire ou de laboratoire : leur revente passe par un distributeur agréé, pas par une petite annonce. Cette annonce ne sera pas publiée.'
          return 'Le confort et l’aide à la mobilité se revendent librement. Les dispositifs de diagnostic ou de soin réservés aux soignants, non.'
        } },
      { k:'marquePro', l:'Marque', t:'text' },
      { k:'hygieneMed', l:'Hygiène', req:true,
        o:['Désinfecté','À désinfecter avant usage','Housse à changer'],
        h:'Un matériel médical d’occasion se désinfecte toujours avant réemploi, même s’il paraît propre.' },
      { k:'accessoiresMed', l:'Fourni avec', multi:true,
        o:['Notice','Chargeur','Brassard','Sondes / accessoires','Housse','Facture','Certificat d’étalonnage'] }
    ].concat(communsPro())
  }
}
