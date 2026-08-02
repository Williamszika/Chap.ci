/* ==========================================================================
 *  VÉHICULES — un schéma par sous-catégorie.
 *
 *  Ce qui fait perdre de l'argent à un acheteur ivoirien, ce n'est pas la
 *  couleur du siège : c'est le dossier administratif. Un véhicule dont la
 *  carte grise n'est pas au nom du vendeur, ou qui porte une opposition, ne
 *  pourra jamais être immatriculé au nom de l'acheteur — l'argent est parti,
 *  la voiture reste juridiquement à quelqu'un d'autre.
 *
 *  Sources (juillet 2026) : DGTTC, servicepublic.gouv.ci, Douanes CI,
 *  transports.gouv.ci, AutoMag.ci, KOACI.
 *   · Vente : carte grise originale, certificat de cession légalisé, CNI des
 *     deux parties, visite technique valide, vignette, assurance, CSA.
 *   · Le vendeur déclare la cession à la DGTTC sous 15 jours — passé ce délai
 *     il reste responsable des amendes du nouvel usage.
 *   · Le CSA (certificat de situation administrative, dit « non-gage ») atteste
 *     qu'aucune opposition ni gage ne bloque la mutation. Un véhicule acheté à
 *     crédit non soldé ne peut pas être vendu.
 *   · Import : limite d'âge 5 ans pour une voiture particulière, calculée sur
 *     la première mise en circulation.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { COULEURS, enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Voitures', 'Motos & Scooters', 'Camions & Utilitaires', 'Engins & Agricoles', 'Pièces & Accessoires', 'Bateaux', 'Location']

/* --- Voitures : ordre = ce qui roule vraiment à Abidjan ------------------- */
const MOD_AUTO = {
  'Toyota': ['Corolla','Yaris','RAV4','Hilux','Avensis','Camry','Land Cruiser','Land Cruiser Prado','Carina','Starlet','Vitz','Probox','Hiace','Coaster','Fortuner','Highlander','C-HR','Corolla Cross','Auris','Verso','Rush','Aygo','Prius (hybride)','bZ4X (électrique)','Yaris Cross'],
  'Hyundai': ['Tucson','Accent','Elantra','Santa Fe','i10','Grand i10','i20','Creta','Sonata','Getz','H1','Starex','Kona Electric','Ioniq 5','Ioniq 6'],
  'Kia': ['Rio','Picanto','Sportage','Cerato','Sorento','Optima','Soul','Carens','Seltos','K2700','Niro EV','EV6','EV9','Soul EV'],
  'Nissan': ['Micra','Sunny','Almera','Qashqai','X-Trail','Note','Juke','Patrol','Navara','Pathfinder','Sentra','Leaf (électrique)','Ariya'],
  'Peugeot': ['206','207','208','301','307','308','405','406','Partner','2008','3008','508','Boxer','e-208','e-2008','e-308'],
  'Suzuki': ['Swift','Alto','Vitara','Grand Vitara','Jimny','Baleno','Ertiga','Celerio'],
  'Mercedes-Benz': ['Classe C','Classe E','Classe A','Classe S','ML','GLC','GLE','Sprinter','Vito','Classe B','EQA','EQB','EQC','EQE','EQS'],
  'Renault': ['Clio','Logan','Sandero','Duster','Mégane','Kangoo','Captur','Trafic','Symbol','Zoe (électrique)','Mégane E-Tech','Kangoo E-Tech'],
  'Honda': ['Civic','Accord','CR-V','Fit','HR-V','Pilot','City'],
  'Mitsubishi': ['Pajero','L200','Outlander','Lancer','ASX','Canter','Montero'],
  'Volkswagen': ['Golf','Polo','Passat','Tiguan','Jetta','Touareg','Transporter','Amarok','ID.3','ID.4','ID.6'],
  'Ford': ['Focus','Fiesta','Ranger','Escape','Explorer','EcoSport','Transit'],
  'BMW': ['Série 3','Série 5','Série 1','X1','X3','X5','Série 7','X6','i3','i4','iX3','iX'],
  'Land Rover': ['Range Rover','Range Rover Sport','Evoque','Discovery','Freelander','Defender'],
  'Mazda': ['3','6','Demio','CX-5','CX-3','BT-50'],
  'Audi': ['A3','A4','A6','Q3','Q5','Q7','e-tron','Q4 e-tron'],
  'Isuzu': ['D-Max','Trooper','NKR','NPR'],
  'Chevrolet': ['Aveo','Spark','Cruze','Captiva','Optra'],
  'Opel': ['Corsa','Astra','Zafira','Vectra'],
  'Citroën': ['C3','C4','C-Elysée','Berlingo','Jumper'],
  'Dacia': ['Logan','Sandero','Duster','Lodgy','Spring (électrique)','Jogger'],
  'Lexus': ['RX','LX','GX','IS','ES'],
  'Jeep': ['Grand Cherokee','Cherokee','Compass','Wrangler'],
  'Chery': ['Tiggo 2','Tiggo 4','Tiggo 7','Tiggo 8','QQ','eQ (électrique)','Omoda 5','Omoda E5'],
  'BYD': ['Atto 3','Dolphin','Seal','Seagull','Song Plus','Yuan Plus','Han','Tang','Qin Plus'],
  'MG': ['MG4','MG5','MG3','ZS','ZS EV','HS','Marvel R'],
  'Tesla': ['Model Y','Model 3','Model S','Model X'],
  'Zeekr': ['7X','001','X'],
  'Ora (Great Wall)': ['03 (Funky Cat)','07'],
  'Wuling': ['Mini EV','Bingo','Air EV'],
  'Neta': ['V','U','X'],
  'Leapmotor': ['T03','C10','C11'],
  'Geely': ['Coolray','Emgrand','Okavango','Geometry C'],
  'Haval': ['Jolion','H6','Dargo'],
  'JAC': ['S3','S4','e-JS4','T8'],
  'Seat': ['Ibiza','Leon','Ateca'],
  'Skoda': ['Fabia','Octavia','Kodiaq','Enyaq'],
  'Fiat': ['Punto','500','Doblo','Tipo'],
  'Daihatsu': ['Terios','Sirion','Gran Max'],
  'Subaru': ['Forester','Outback','Impreza'],
  'Volvo': ['XC40','XC60','XC90','S60'],
  'Ssangyong': ['Korando','Tivoli','Rexton'],
  'Autre marque': []
}

/* --- Motos : les marques chinoises dominent le marché ivoirien ------------ */
const MOD_MOTO = {
  'Haojue': ['HJ125','HJ150','Lindy 125','DK150','TR150','KA150'],
  'Apsonic': ['AP125','AP150','AP200','Kingman','Tricycle AP200'],
  'Sanili': ['SL125','SL150','SL200'],
  'Sanya': ['SY125','SY150','SY110'],
  'TVS': ['Star HLX 125','Star HLX 150','Apache 160','King (tricycle)'],
  'Bajaj': ['Boxer 100','Boxer 150','CT100','Pulsar 150','RE (tricycle)'],
  'Yamaha': ['Crux','YBR 125','Crypton','DT 125','Mio'],
  'Honda': ['CG 125','CB 125','Ace 110','XR 125','Dio'],
  'Suzuki': ['GN125','GS150','Address'],
  'Kaisar': ['KS125','KS150'],
  'KTM': ['Duke 125','Duke 200'],
  'Royal Enfield': ['Classic 350','Hunter 350'],
  'Autre marque': []
}

/* --- Poids lourds et utilitaires ----------------------------------------- */
const MOD_CAMION = {
  'Mercedes-Benz': ['Actros','Atego','Axor','Sprinter','Unimog','Vario'],
  'Isuzu': ['NKR','NPR','NQR','FVR','FRR','D-Max'],
  'Mitsubishi Fuso': ['Canter','Fighter','Super Great'],
  'Hino': ['300','500','700'],
  'Toyota': ['Dyna','Hiace','Coaster','Land Cruiser pick-up'],
  'Renault Trucks': ['Midlum','Premium','Kerax','Master'],
  'Sinotruk / Howo': ['Howo 371','Howo 336','Howo benne'],
  'MAN': ['TGA','TGS','TGX','TGL'],
  'Iveco': ['Daily','Eurocargo','Stralis','Trakker'],
  'Scania': ['R420','R440','P340'],
  'Volvo': ['FH','FM','FMX'],
  'DAF': ['XF','CF','LF'],
  'Foton': ['Aumark','Ollin'],
  'Dongfeng': ['Captain','Duolika'],
  'JAC': ['N56','X200'],
  'Autre marque': []
}

const TYPES_CAMION = ['Benne','Fourgon','Plateau','Citerne','Frigorifique','Porte-conteneur','Tracteur routier','Grue / plateau grue','Malaxeur (toupie)','Pick-up','Minibus','Autocar','Ambulance','Dépanneuse','Autre']

/* --- Pièces détachées ----------------------------------------------------- */
const TYPES_PIECE = [
  'Pneus','Batterie','Jantes','Plaquettes / disques de frein','Amortisseurs','Embrayage',
  'Alternateur','Démarreur','Radiateur','Filtres','Huile / lubrifiant','Phares / optiques',
  'Pare-brise / vitres','Rétroviseur','Pare-chocs','Capot / aile','Moteur complet','Boîte de vitesse',
  'Turbo','Injecteurs','Courroie de distribution','Autoradio','Sièges / sellerie','Climatisation',
  'Échappement','Direction / crémaillère','Autre pièce'
]

/* --- Bateaux -------------------------------------------------------------- */
const TYPES_BATEAU = ['Pirogue','Barque','Hors-bord','Semi-rigide','Vedette','Yacht','Jet-ski','Chalutier','Bateau de pêche','Autre']

/* ==========================================================================
 *  Les champs, sous-catégorie par sous-catégorie.
 * ========================================================================== */

/**
 *  « Ce kilométrage, c'est de combien par an ? »
 *
 *  Un chiffre brut ne dit rien : 145 000 km, c'est beaucoup sur une voiture de
 *  2022 et très peu sur une de 2005. Le formulaire fait donc la division et
 *  donne son avis — en moyenne un particulier roule 15 000 km par an en Côte
 *  d'Ivoire.
 *
 *  Un kilométrage anormalement BAS pour l'âge est le premier signe d'un
 *  compteur trafiqué. Le dire au vendeur au moment où il saisit le chiffre vaut
 *  mieux que de le découvrir chez le garagiste. Le « ! » en tête colore
 *  l'avertissement.
 */
function moyenneAnnuelle(valeur: string, annee: string, unite: string, parAn: number): string {
  var v = Number(valeur), a = Number(String(annee || '').replace(/\D/g, ''))
  if (!v || !a) return ''
  var ans = Math.max(1, 2026 - a)
  var m = Math.round(v / ans)
  var fmt = m.toLocaleString('fr-FR')
  var base = 'Soit environ <b>' + fmt + ' ' + unite + ' par an</b> sur ' + ans + ' an' + (ans > 1 ? 's' : '') + ' — '
  if (m < parAn * 0.5) {
    // Sur un véhicule récent, rouler peu est NORMAL — et c'est même un argument
    // de vente. Le soupçon de compteur trafiqué ne vaut que sur un véhicule
    // ancien affichant un compte impossible. Accuser un vendeur honnête coûte
    // plus cher que de rater un fraudeur.
    if (ans < 6) return base + 'c’est peu : un vrai argument de vente. Dites-le dans la description.'
    return '!' + base + 'c’est très peu pour l’âge. Un acheteur y verra un compteur trafiqué : préparez le carnet d’entretien ou la facture qui le prouve.'
  }
  if (m < parAn * 1.35) return base + 'dans la moyenne.'
  if (m < parAn * 2.3) return base + 'usage soutenu, à mentionner dans la description.'
  return base + 'usage intensif. Précisez l’entretien : c’est ce qui rassurera.'
}

/** Motorisation branchée : électrique pur ou hybride rechargeable. */
function elec(S: Vals) { return S.carburant === '100 % électrique' || S.carburant === 'Hybride rechargeable' }

/* Le dossier administratif — commun aux véhicules immatriculés. */
function dossierVehicule(quoi: string): ChampCourt[] {
  return [
    { k:'carteGrise', l:'Carte grise', req:true,
      o:['À mon nom','Au nom d’un tiers (avec procuration)','Mutation en cours','Duplicata','Pas de carte grise'],
      alerte:{ bon:'À mon nom',
        texteBon:'La carte grise est au nom du vendeur : la mutation peut se faire directement. Vérifiez que le nom correspond à sa pièce d’identité.',
        texteMauvais:'La carte grise n’est pas au nom du vendeur. Exigez la procuration légalisée ou le dossier de mutation AVANT de payer — sans cela vous ne pourrez jamais immatriculer ' + quoi + ' à votre nom.' },
      h:'Si la carte grise n’est pas à votre nom, l’acheteur exigera la procuration : préparez-la. C’est le premier point de blocage d’une vente.' },
    { k:'csa', l:'CSA (certificat de non-gage)', req:true,
      o:['Je l’ai, à jour','Je peux le demander','Le véhicule est gagé (crédit en cours)','Je ne sais pas'],
      h:'Le CSA, délivré par la DGTTC, atteste qu’aucune opposition ni gage ne bloque la mutation. Un véhicule acheté à crédit non soldé ne peut pas être vendu.' },
    { k:'visite', l:'Visite technique', req:true,
      o:['Valide plus de 6 mois','Valide moins de 6 mois','Expirée','Véhicule neuf, non concerné'] },
    { k:'papiers', l:'Autres pièces à jour', multi:true,
      o:['Vignette','Assurance','Patente / transport','Certificat de cession prêt','Facture d’achat','Carnet d’entretien'],
      h:'Le vendeur doit déclarer la cession à la DGTTC sous 15 jours : passé ce délai, les amendes du nouvel usage restent à son nom.' }
  ]
}

const SCHEMAS: Record<string, SchemaSous> = {
  'Voitures': {
    couleurs: true, etat: true, livraison: false,
    titre: function (S: Vals) {
      return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.annee].filter(Boolean).join(' ')
    },
    champs: ([
      { k:'marque', l:'Marque', o:Object.keys(MOD_AUTO), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_AUTO, req:true, libre:'Autre modèle',
        h:'Le modèle exact fait trouver votre annonce : c’est lui que les acheteurs tapent.' },
      { k:'annee', l:'Année de première mise en circulation', req:true,
        o:['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004 et avant'] },
      { k:'km', l:'Kilométrage au compteur', t: 'num' as const, ph:'Ex : 120000', req:true, unite:'km',
        h:function (S: Vals) {
          return moyenneAnnuelle(S.km, S.annee, 'km', 15000) ||
            'Indiquez le chiffre exact lu au compteur. Le formulaire vous dira s’il est cohérent avec l’âge du véhicule.'
        } },
      { k:'kmFiable', l:'Ce kilométrage est', req:true,
        o:['Réel, d’origine','Compteur remplacé','Non garanti — je ne sais pas'],
        h:'Le dire vous protège autant que l’acheteur : un vice caché se retourne contre le vendeur.' },
      { k:'carburant', l:'Motorisation', req:true,
        o:['Essence','Diesel','Hybride','Hybride rechargeable','100 % électrique','GPL','Flex-fuel'] },

      // --- Bloc électrique : ce qui fait la valeur d'une voiture branchée ---
      { k:'autonomie', l:'Autonomie annoncée', t: 'num' as const, unite:'km', ph:'Ex : 350', req:true,
        h:'L’autonomie réelle en ville d’Abidjan, climatisation allumée, est toujours inférieure à l’annonce du constructeur. Donnez le chiffre du constructeur, l’acheteur fera la part des choses.',
        when:function (S: Vals) { return elec(S) } },
      { k:'batterieKwh', l:'Capacité de la batterie', o:['Moins de 20 kWh','20 à 40 kWh','40 à 60 kWh','60 à 80 kWh','Plus de 80 kWh'],
        when:function (S: Vals) { return elec(S) } },
      { k:'santeBat', l:'Santé de la batterie (SoH)', req:true,
        o:['Neuve — 100 %','Plus de 90 %','80 à 90 %','70 à 80 %','Moins de 70 %','Batterie remplacée','Je ne sais pas'],
        alerte:{ bon:'Plus de 90 %',
          texteBon:'Le vendeur déclare une batterie en bon état. Faites-la contrôler : sur une électrique d’occasion, la batterie EST la valeur du véhicule.',
          texteMauvais:'Sur une voiture électrique, la batterie représente une grande part du prix. Exigez un rapport de santé (SoH) avant de payer — son remplacement se chiffre en millions.' },
        h:'Le SoH s’affiche dans le menu du véhicule ou se lit avec un boîtier de diagnostic. C’est le chiffre que tout acheteur averti demandera.',
        when:function (S: Vals) { return elec(S) } },
      { k:'charge', l:'Recharge possible', multi:true,
        o:['Prise domestique 220 V','Borne murale (wallbox)','Charge rapide DC','Charge triphasée 380 V'],
        h:'La CIE distribue du 220 V monophasé chez les particuliers : une recharge à la maison est lente. Les bornes rapides d’Abidjan et Yamoussoukro font 20 à 80 % en moins de 30 minutes.',
        when:function (S: Vals) { return elec(S) } },
      { k:'cables', l:'Câbles fournis', multi:true,
        o:['Câble domestique','Câble Type 2','Adaptateur','Aucun'],
        when:function (S: Vals) { return elec(S) } },
      { k:'boite', l:'Boîte de vitesse', o:['Manuelle','Automatique'], req:true,
        when:function (S: Vals) { return S.carburant !== '100 % électrique' } },
      { k:'cv', l:'Puissance fiscale', o:['4 CV et moins','5 CV','6 CV','7 CV','8 CV','9 CV','10 CV','11 CV','12 CV','13 CV et plus'],
        h:'Figure sur la carte grise. Elle détermine la vignette — et au-delà de 13 CV, les droits d’accise à l’import.',
        when:function (S: Vals) { return S.carburant !== '100 % électrique' } },
      { k:'carrosserie', l:'Type de carrosserie', req:true,
        o:['Berline','Citadine','4x4 / SUV','Break','Monospace','Pick-up','Coupé','Cabriolet','Utilitaire / fourgonnette',
           'Minibus','Limousine','Voiture de collection','Véhicule sans permis','Buggy','Corbillard','Ambulance','Taxi (véhicule)'] },
      { k:'places', l:'Places', o:['2','4','5','7','9 et plus'] },
      { k:'provenance', l:'Provenance', req:true,
        o:['Neuve, concession Côte d’Ivoire','Occasion Côte d’Ivoire','Importée d’Europe','Importée du Japon','Importée de Dubaï','Importée des États-Unis'],
        h:'Une voiture particulière ne peut être importée que si elle a moins de 5 ans à la première mise en circulation.' },
      { k:'sinistre', l:'Historique d’accident', req:true,
        o:['Jamais accidentée','Choc léger réparé','Choc important réparé','Accidentée, à réparer'],
        h:'L’« arnaque à l’épave » — un véhicule pour la casse remis en état de paraître — se découvre toujours. Autant le dire.' },
      { k:'equipements', l:'Équipements', multi:true,
        o:['Climatisation','Direction assistée','Vitres électriques','Caméra de recul','Écran tactile','GPS','Sièges cuir','Toit ouvrant','Jantes alliage','Régulateur','ABS','Airbags','Radar de recul','Démarrage sans clé','Apple CarPlay / Android Auto','Sièges chauffants'] },
      { k:'entretien', l:'Dernier entretien', o:['Moins de 3 mois','3 à 6 mois','6 à 12 mois','Plus d’un an','Je ne sais pas'] }
    ] as ChampCourt[]).concat(dossierVehicule('la voiture'))
  },

  'Motos & Scooters': {
    couleurs: true, etat: true, livraison: false,
    titre: function (S: Vals) { return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.cylindree].filter(Boolean).join(' ') },
    champs: ([
      { k:'typeMoto', l:'Type', req:true,
        o:['Moto','Scooter','Tricycle (« taxi-moto »)','Moto-cross','Vélomoteur','Moto électrique','Scooter électrique','Quad','Karting','Vélo électrique','Trottinette électrique'] },
      { k:'marque', l:'Marque', o:Object.keys(MOD_MOTO), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_MOTO, req:true, libre:'Autre modèle' },
      { k:'cylindree', l:'Cylindrée', req:true,
        o:['50 cm³','100 cm³','110 cm³','125 cm³','150 cm³','200 cm³','250 cm³','400 cm³ et plus','Électrique'],
        when:function (S: Vals) { return !/électrique/i.test(S.typeMoto || '') } },
      { k:'autonomieMoto', l:'Autonomie annoncée', t: 'num' as const, unite:'km', ph:'Ex : 80', req:true,
        when:function (S: Vals) { return /électrique/i.test(S.typeMoto || '') } },
      { k:'batterieMoto', l:'Batterie', o:['Amovible','Fixe','Deux batteries'],
        h:'Une batterie amovible se recharge à l’étage, sans rallonge dans la cour. C’est un argument de vente.',
        when:function (S: Vals) { return /électrique/i.test(S.typeMoto || '') } },
      { k:'annee', l:'Année', req:true, o:['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015 et avant'] },
      { k:'km', l:'Kilométrage au compteur', t: 'num' as const, ph:'Ex : 15000', req:true, unite:'km',
        h:function (S: Vals) {
          return moyenneAnnuelle(S.km, S.annee, 'km', 12000) ||
            'Le chiffre exact lu au compteur. Une moto de taxi fait bien plus qu’une moto personnelle.'
        } },
      { k:'demarrage', l:'Démarrage', o:['Électrique','Kick','Les deux'] },
      { k:'provenance', l:'Provenance', req:true, o:['Neuve, concession','Occasion Côte d’Ivoire','Importée'] },
      { k:'sinistre', l:'Historique d’accident', req:true, o:['Jamais accidentée','Choc léger réparé','Choc important réparé','Accidentée, à réparer'] },
      { k:'usage', l:'Usage', o:['Personnel','Taxi-moto','Livraison','Peu servi'] },
      { k:'equipements', l:'Fournis avec', multi:true, o:['Casque','Deux casques','Antivol','Top-case','Housse','Jeu d’outils'] }
    ] as ChampCourt[]).concat(dossierVehicule('la moto'))
  },

  'Camions & Utilitaires': {
    couleurs: true, etat: true, livraison: false,
    titre: function (S: Vals) { return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.typeCamion].filter(Boolean).join(' ') },
    champs: ([
      { k:'typeCamion', l:'Type de véhicule', o:TYPES_CAMION, req:true },
      { k:'marque', l:'Marque', o:Object.keys(MOD_CAMION), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_CAMION, req:true, libre:'Autre modèle' },
      { k:'annee', l:'Année', req:true, o:['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010 et avant'] },
      { k:'charge', l:'Charge utile', req:true, o:['Moins de 1 t','1 à 3 t','3 à 5 t','5 à 10 t','10 à 20 t','Plus de 20 t'] },
      { k:'essieux', l:'Configuration', o:['4x2','4x4','6x2','6x4','8x4','Semi-remorque'] },
      { k:'km', l:'Kilométrage au compteur', t: 'num' as const, ph:'Ex : 250000', req:true, unite:'km',
        h:function (S: Vals) {
          return moyenneAnnuelle(S.km, S.annee, 'km', 40000) ||
            'Le chiffre exact lu au compteur. Sur un poids lourd, un acheteur compare toujours au nombre d’années.'
        } },
      { k:'carburant', l:'Carburant', o:['Diesel','Essence'], req:true },
      { k:'provenance', l:'Provenance', req:true, o:['Neuf, concession','Occasion Côte d’Ivoire','Importé d’Europe','Importé du Japon','Importé de Dubaï'] },
      { k:'sinistre', l:'État mécanique', req:true, o:['Roulant, bon état','Roulant, entretien à prévoir','En panne','Pour pièces'] },
      { k:'usage', l:'Usage précédent', o:['Transport de marchandises','BTP / carrière','Transport de personnes','Agricole','Peu servi'] }
    ] as ChampCourt[]).concat(dossierVehicule('le véhicule'))
  },

  'Engins & Agricoles': {
    couleurs: true, etat: true, livraison: false,
    titre: function (S: Vals) { return [S.typeEngin, S.marqueEngin, S.anneeEngin].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeEngin', l:'Type d’engin', req:true,
        o:['Tracteur agricole','Pelleteuse / excavatrice','Chargeuse','Bulldozer','Niveleuse','Compacteur / rouleau',
           'Chariot élévateur','Nacelle','Bétonnière','Motoculteur','Moissonneuse','Groupe électrogène',
           'Remorque','Semi-remorque','Citerne remorquée','Karting / quad utilitaire','Autre engin'] },
      { k:'marqueEngin', l:'Marque', req:true,
        o:['John Deere','Massey Ferguson','New Holland','Caterpillar','Komatsu','JCB','Hitachi','Kubota',
           'Sonalika','Mahindra','Doosan','Liebherr','Hyundai','SDLG','XCMG','Toyota (chariot)','Autre marque'] },
      { k:'modeleEngin', l:'Modèle', t: 'text' as const, ph:'Ex : 5075E, 320D, 3CX' },
      { k:'anneeEngin', l:'Année', o:['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010 et avant'] },
      { k:'heures', l:'Heures de fonctionnement', t: 'num' as const, unite:'h', ph:'Ex : 4500', req:true,
        h:function (S: Vals) {
          return moyenneAnnuelle(S.heures, S.anneeEngin, 'heures', 800) ||
            'Sur un engin, l’heure compte plus que le kilomètre. C’est le premier chiffre que demande un acheteur professionnel.'
        } },
      { k:'kmEngin', l:'Kilométrage au compteur', t: 'num' as const, unite:'km', ph:'Ex : 60000',
        h:function (S: Vals) {
          return moyenneAnnuelle(S.kmEngin, S.anneeEngin, 'km', 10000) ||
            'Si l’engin roule sur route (tracteur, chariot, remorque). Laissez vide pour un engin qui ne se déplace pas seul.'
        } },
      { k:'puissanceEngin', l:'Puissance', o:['Moins de 50 ch','50 à 100 ch','100 à 150 ch','150 à 250 ch','Plus de 250 ch'] },
      { k:'etatEngin', l:'État de marche', req:true,
        o:['En état de marche','Entretien à prévoir','En panne','Pour pièces'] },
      { k:'provenanceEngin', l:'Provenance', req:true,
        o:['Neuf, concessionnaire','Occasion Côte d’Ivoire','Importé d’Europe','Importé du Japon','Importé de Chine'] },
      { k:'papiersEngin', l:'Documents', multi:true, req:true,
        o:['Facture d’achat','Carte grise (si immatriculé)','Carnet d’entretien','Manuel d’utilisation','Aucun'],
        h:'Un engin non immatriculé se vend sur facture. Sans aucun papier, l’acheteur ne peut ni l’assurer ni le revendre.' },
      { k:'accessoiresEngin', l:'Équipements fournis', multi:true,
        o:['Godet','Fourches','Charrue','Remorque','Lame','Marteau hydraulique','Jeu de pièces'] }
    ]
  },

  'Pièces & Accessoires': {
    couleurs: true, etat: true, livraison: true,
    titre: function (S: Vals) { return [S.typePiece, S.compatible].filter(Boolean).join(' — ') },
    champs: [
      { k:'typePiece', l:'Type de pièce', o:TYPES_PIECE, req:true },
      { k:'compatible', l:'Compatible avec', t: 'text' as const, req:true, ph:'Ex : Toyota Corolla 2010-2015, universel',
        h:'La première question de l’acheteur. Une pièce « universelle » qui ne l’est pas fait un retour et un litige.' },
      { k:'etatPiece', l:'État de la pièce', req:true,
        o:['Neuve, d’origine (OEM)','Neuve, adaptable','Occasion, bon état','Reconditionnée','Pour pièces'],
        h:'« Adaptable » n’est pas « d’origine ». Le préciser évite la moitié des disputes.' },
      { k:'reference', l:'Référence constructeur', t: 'text' as const, ph:'Ex : 90915-YZZD4 (facultatif)',
        h:'La référence exacte rassure et fait remonter votre annonce dans la recherche.' },
      { k:'quantite', l:'Quantité disponible', t: 'num' as const, ph:'Ex : 4' },
      { k:'garantiePiece', l:'Garantie', o:['Aucune','7 jours','1 mois','3 mois','6 mois','1 an'] }
    ]
  },

  'Bateaux': {
    couleurs: true, etat: true, livraison: false,
    titre: function (S: Vals) { return [S.typeBateau, S.longueur, S.annee].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeBateau', l:'Type', o:TYPES_BATEAU, req:true },
      { k:'longueur', l:'Longueur', o:['Moins de 4 m','4 à 6 m','6 à 8 m','8 à 12 m','12 à 18 m','Plus de 18 m'], req:true },
      { k:'coque', l:'Coque', o:['Bois','Fibre de verre','Aluminium','Acier','Pneumatique'], req:true },
      { k:'moteurBat', l:'Motorisation', o:['Sans moteur','Hors-bord','In-board','Deux moteurs'], req:true },
      { k:'puissanceBat', l:'Puissance moteur', o:['Moins de 15 ch','15 à 40 ch','40 à 100 ch','100 à 200 ch','Plus de 200 ch'],
        when:function (S: Vals) { return S.moteurBat && S.moteurBat !== 'Sans moteur' } },
      { k:'annee', l:'Année', req:true, o:['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015 et avant'] },
      { k:'heuresBat', l:'Heures moteur', t: 'num' as const, unite:'h', ph:'Ex : 900',
        h:function (S: Vals) {
          return moyenneAnnuelle(S.heuresBat, S.annee, 'heures', 150) ||
            'L’équivalent du kilométrage pour un bateau. C’est ce qui dit l’usure réelle du moteur.'
        },
        when:function (S: Vals) { return S.moteurBat && S.moteurBat !== 'Sans moteur' } },
      { k:'immat', l:'Immatriculation / titre de navigation', req:true,
        o:['En règle, à mon nom','En règle, à un autre nom','Non immatriculé','Je ne sais pas'],
        alerte:{ bon:'En règle, à mon nom',
          texteBon:'Le titre de navigation est au nom du vendeur : le transfert est possible.',
          texteMauvais:'Le titre n’est pas au nom du vendeur, ou n’existe pas. Vérifiez auprès des Affaires maritimes avant de payer.' } },
      { k:'equipBat', l:'Équipements', multi:true, o:['Gilets de sauvetage','GPS / sondeur','Remorque','Bâche','Ancre','Réservoir supplémentaire','Filets de pêche'] }
    ]
  },

  'Location': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Tarif par jour',
    // On loue un service, pas une carrosserie : le client ne choisit pas la
    // couleur, il regarde la propreté et l'état du véhicule qu'on lui remettra.
    sansCouleur: 'Photographiez le véhicule propre, dedans comme dehors : sur une location, c’est l’état à la remise qui décide, pas la teinte.',
    titre: function (S: Vals) {
      // Pas de .toLowerCase() : il transformerait « 4x4 / SUV » en « suv ».
      var t = [S.typeLoc, S.marqueLoc].filter(Boolean).join(' ')
      return t ? 'Location ' + t : 'Location de véhicule'
    },
    champs: [
      { k:'typeLoc', l:'Type de véhicule', req:true,
        o:['Berline','Citadine','4x4 / SUV','Minibus','Bus','Camion','Utilitaire','Moto','Voiture avec chauffeur','Véhicule de mariage'] },
      { k:'marqueLoc', l:'Marque', o:Object.keys(MOD_AUTO) },
      { k:'chauffeur', l:'Avec chauffeur', req:true, o:['Avec chauffeur','Sans chauffeur','Au choix du client'] },
      { k:'duree', l:'Durées proposées', multi:true, req:true, o:['À l’heure','À la journée','Au week-end','À la semaine','Au mois','Longue durée'] },
      { k:'kmInclus', l:'Kilométrage inclus', o:['Illimité','100 km/jour','200 km/jour','300 km/jour','Sur devis'] },
      { k:'caution', l:'Caution demandée', t: 'num' as const, ph:'Ex : 200000', unite:'FCFA',
        h:'L’annoncer évite la mauvaise surprise au comptoir — et les avis fâchés qui suivent.' },
      { k:'carburantLoc', l:'Carburant', o:['À la charge du client','Plein à plein','Inclus'] },
      { k:'zone', l:'Zone couverte', t: 'text' as const, ph:'Ex : Abidjan et intérieur du pays' },
      { k:'exigences', l:'Conditions', multi:true, o:['Permis depuis 2 ans','Pièce d’identité','Âge minimum 25 ans','Contrat signé','Paiement d’avance'] },
      { k:'assuranceLoc', l:'Assurance', req:true, o:['Tous risques incluse','Au tiers incluse','À la charge du client'],
        alerte:{ bon:'Tous risques incluse',
          texteBon:'Le loueur déclare une assurance tous risques incluse. Demandez l’attestation avant de partir.',
          texteMauvais:'Vérifiez précisément ce que couvre l’assurance : en cas d’accident, la différence se chiffre en millions.' } }
    ]
  }
}

/* Les véhicules se vendent dans les quinze teintes habituelles : c'est la
   catégorie où la couleur est la plus banale, et la plus regardée. Aucune
   palette de métier à inventer. */
const PALETTE_BASE: Couleur[] = COULEURS
const TOUTES_COULEURS: Couleur[] = COULEURS

export const VEHICULES: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}

// La palette de ce metier rejoint le repertoire general au moment ou ce module
// est charge. C'est ce qui permet a `couleurs.ts` de n'avoir AUCUN import vers
// `data/sous/` : sans quoi les quatre-vingt-deux schemas repartiraient au
// demarrage, juste pour resoudre le nom d'une teinte.
enregistrerCouleurs(TOUTES_COULEURS)
