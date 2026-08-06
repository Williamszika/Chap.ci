// =============================================================================
//  Référentiel foncier ivoirien — une seule source de vérité.
//
//  Sept documents circulent couramment pour un terrain en Côte d'Ivoire. Trois
//  seulement donnent la propriété ; les autres ouvrent une procédure, ou ne
//  valent rien du tout. Ce fichier porte cette connaissance une fois, et le
//  formulaire de publication comme la fiche d'annonce s'y réfèrent — deux
//  textes séparés finiraient toujours par diverger.
//
//  État du droit au 29 juillet 2026 (MCLU, AFOR, Service public de Côte
//  d'Ivoire). Détail et sources : GUIDE-FONCIER-CI.md à la racine du dépôt.
//
//  Rien ici n'est vérifié par Chap.ci. Tout est DÉCLARÉ par le vendeur, et la
//  fiche doit le répéter à chaque fois : afficher « dossier définitif » sans
//  cette réserve fabriquerait le faux signal de confiance dont vivent les
//  escrocs.
// =============================================================================

/** ok = la propriété est acquise · warn = procédure en cours · bad = ne vaut pas propriété. */
export type NiveauFoncier = 'ok' | 'warn' | 'bad'

export interface DocFoncier {
  id: string
  /** Nom court, pour les bandeaux et les tableaux serrés. */
  court: string
  nom: string
  /** Autorité qui le délivre. */
  par: string
  desc: string
  /** Libellé du champ « numéro » ; vide = ce document n'en porte pas. */
  numLabel: string
  numPh: string
  /** Le contrôle affiché à l'acheteur quand le vendeur coche ce document. */
  check: string
  lvl: NiveauFoncier
  zones: ('urbaine' | 'rurale')[]
}

export const DOCS_FONCIER: DocFoncier[] = [
  {
    id: 'tf', lvl: 'ok', zones: ['urbaine', 'rurale'], court: 'Titre foncier',
    nom: 'Titre foncier (TF)', par: 'Conservation foncière — Livre foncier',
    desc: 'Propriété pleine et entière, inscrite au Livre foncier. Le document le plus sûr qui existe.',
    numLabel: 'Numéro du titre foncier', numPh: 'Ex : TF 12345 — Circonscription d’Abidjan',
    check: 'Titre foncier : demandez l’original et faites-le contrôler à la Conservation foncière ou par un notaire. L’état des droits réels dira s’il existe une hypothèque.',
  },
  {
    id: 'acd', lvl: 'ok', zones: ['urbaine'], court: 'ACD',
    nom: 'ACD — Arrêté de Concession Définitive',
    par: 'Ministère de la Construction (MCLU), ou le Préfet hors Abidjan',
    desc: 'En ville, c’est l’acte qui donne la propriété. Il ouvre le permis de construire et le prêt bancaire, et donne lieu à l’inscription au Livre foncier.',
    numLabel: 'Numéro de l’ACD', numPh: 'Ex : 2024/1234/MCLU',
    check: 'ACD : demandez l’original et vérifiez qu’il est bien au nom du vendeur. Un ACD ancien peut avoir été muté depuis.',
  },
  {
    id: 'tfr', lvl: 'ok', zones: ['rurale'], court: 'Titre foncier rural',
    nom: 'Titre foncier rural', par: 'Immatriculation après certificat foncier',
    desc: 'Aboutissement de la procédure rurale : pleine propriété, immatriculée.',
    numLabel: 'Numéro du titre foncier rural', numPh: 'Ex : TF 987 — Département d’Agboville',
    check: 'Titre foncier rural : demandez l’original et l’état des droits réels auprès de la Conservation foncière.',
  },
  {
    id: 'cf', lvl: 'warn', zones: ['rurale'], court: 'Certificat foncier',
    nom: 'Certificat foncier', par: 'AFOR — Agence Foncière Rurale',
    desc: 'Constate des droits coutumiers reconnus par l’État. C’est l’étape obligatoire vers le titre foncier rural — mais ce n’est pas encore la pleine propriété.',
    numLabel: 'Numéro du certificat foncier', numPh: 'Ex : CF 2023/0456',
    check: 'Certificat foncier : faites-le confirmer auprès de l’AFOR et du comité villageois de gestion foncière, et vérifiez qu’aucune opposition n’a été enregistrée.',
  },
  {
    id: 'acp', lvl: 'warn', zones: ['urbaine'], court: 'ACP',
    nom: 'ACP — Arrêté de Concession Provisoire', par: 'Ministère de la Construction (MCLU)',
    desc: 'Concession accordée à titre provisoire, sous condition de mise en valeur. Elle doit devenir un ACD.',
    numLabel: 'Numéro de l’ACP', numPh: 'Ex : 2022/0789/MCLU',
    check: 'ACP : demandez où en est la transformation en ACD et quelles conditions de mise en valeur restent à remplir. Une ACP peut être retirée.',
  },
  {
    id: 'adu', lvl: 'warn', zones: ['urbaine', 'rurale'], court: 'ADU',
    nom: 'ADU — Attestation de Droit d’Usage coutumier',
    par: 'Ministère de la Construction (MCLU) — avec QR code',
    desc: 'Depuis le 1ᵉʳ janvier 2025, c’est le seul document d’entrée accepté pour demander un ACD. Elle ne vaut pas titre de propriété : elle ouvre la procédure.',
    numLabel: 'Numéro de l’ADU', numPh: 'Ex : ADU-2025-000123',
    check: 'ADU : scannez le QR code devant le vendeur. Une ADU dont le QR code ne renvoie rien, ou renvoie un autre nom, est à écarter.',
  },
  {
    id: 'lettre', lvl: 'warn', zones: ['urbaine'], court: 'Lettre d’attribution',
    nom: 'Lettre d’attribution', par: 'Mairie ou société de lotissement',
    desc: 'Document transitoire. Elle ne prouve pas la propriété : elle doit être transformée en ACD.',
    numLabel: 'Référence de la lettre d’attribution', numPh: 'Ex : LA/2019/0342',
    check: 'Lettre d’attribution : seule, elle ne protège pas. Demandez le dossier ACD en cours et le récépissé de dépôt.',
  },
  {
    id: 'village', lvl: 'bad', zones: ['urbaine', 'rurale'], court: 'Attestation villageoise',
    nom: 'Attestation villageoise', par: 'Chefferie du village',
    desc: 'Depuis le 31 mars 2025, elle n’ouvre plus de dossier ACD. Elle n’a jamais valu titre de propriété.',
    numLabel: 'Référence de l’attestation', numPh: 'Ex : attestation du 12/03/2018',
    check: 'Attestation villageoise : exigez au minimum une ADU en cours au nom du vendeur. Sans cela, la parcelle ne peut plus entrer dans la procédure officielle.',
  },
  {
    id: 'aucun', lvl: 'bad', zones: ['urbaine', 'rurale'], court: 'Aucun document',
    nom: 'Aucun document / papier de vente entre particuliers', par: 'Aucune autorité',
    desc: 'Un papier signé entre particuliers ne transfère pas la propriété et ne protège pas l’acheteur.',
    numLabel: '', numPh: '',
    check: 'Sans document officiel, le risque de double vente est maximal. N’engagez aucun argent avant qu’un titre existe.',
  },
]

export const DOC_PAR_ID: Record<string, DocFoncier> = Object.fromEntries(
  DOCS_FONCIER.map((d) => [d.id, d]),
)

export const VERDICT: Record<NiveauFoncier, { titre: string; phrase: string }> = {
  ok: { titre: 'Dossier définitif', phrase: 'Le vendeur détient un document qui donne la propriété.' },
  warn: { titre: 'À régulariser', phrase: 'Procédure en cours : la propriété n’est pas encore acquise.' },
  bad: { titre: 'Non sécurisé', phrase: 'Aucun document ne donne la propriété. Prudence maximale.' },
}

export const NIVEAU_LIBELLE: Record<NiveauFoncier, string> = {
  ok: 'Sûr', warn: 'Provisoire', bad: 'Sans valeur',
}

const RANG: Record<NiveauFoncier, number> = { ok: 0, warn: 1, bad: 2 }

// --- Valeurs des listes déroulantes, partagées formulaire ↔ fiche -----------

export const NATURES = [
  'Terrain nu', 'Terrain agricole', 'Maison / Villa', 'Appartement', 'Immeuble', 'Bureau / Commerce',
] as const

export const ZONE_URBAINE = 'Zone urbaine (lotissement)'
export const ZONE_RURALE = 'Zone rurale (domaine coutumier)'

/** Un bien bâti : les pièces, le permis de construire et la conformité s'appliquent. */
export function estBati(nature?: string): boolean {
  return !!nature && nature !== 'Terrain nu' && nature !== 'Terrain agricole'
}

export function estUrbain(zone?: string): boolean {
  return (zone ?? ZONE_URBAINE).includes('urbaine')
}

export function docsDeZone(zone?: string): DocFoncier[] {
  const z = estUrbain(zone) ? 'urbaine' : 'rurale'
  return DOCS_FONCIER.filter((d) => d.zones.includes(z))
}

/** Les identifiants sont stockés en une seule chaîne : « acd,adu ». */
export function lireDocs(v?: string): string[] {
  return (v ?? '').split(',').map((s) => s.trim()).filter((s) => !!DOC_PAR_ID[s])
}

export function ecrireDocs(ids: string[]): string {
  return ids.join(',')
}

/** Le verdict affiché est celui du MEILLEUR document détenu. */
export function niveauDossier(ids: string[]): NiveauFoncier {
  if (!ids.length) return 'bad'
  return ids.reduce<NiveauFoncier>(
    (best, id) => (RANG[DOC_PAR_ID[id].lvl] < RANG[best] ? DOC_PAR_ID[id].lvl : best),
    'bad',
  )
}

/** Le document qui détermine le verdict — celui dont la description est affichée. */
export function docDeterminant(ids: string[]): DocFoncier | null {
  return ids.reduce<DocFoncier | null>(
    (best, id) => (!best || RANG[DOC_PAR_ID[id].lvl] < RANG[best.lvl] ? DOC_PAR_ID[id] : best),
    null,
  )
}

/** Clé de l'attribut portant le numéro d'un document donné. */
export function cleNumero(id: string): string {
  return `num_${id}`
}

// --- Ce qui relève du dossier foncier --------------------------------------

/**
 * Une annonce dont le formulaire foncier s'applique : une VENTE immobilière.
 * Les anciennes annonces n'ont pas d'attribut `transaction` — on ne les traite
 * comme des locations que lorsqu'elles le disent, explicitement ou par leur
 * sous-catégorie. Le doute penche du côté de l'acheteur.
 */
export function estVenteFonciere(l: {
  categoryId?: string
  subcategory?: string | null
  attributes?: Record<string, string> | null
}): boolean {
  if (l.categoryId !== 'immobilier') return false
  const t = l.attributes?.transaction
  if (t) return t === 'Vente'
  const sub = l.subcategory ?? ''
  return !['Location', 'Colocation', 'Location vacances'].includes(sub)
}

/** Champs du dossier foncier absents. Vide = le dossier est complet. */
export function champsFonciersManquants(attrs: Record<string, string>): string[] {
  const out: string[] = []
  const ids = lireDocs(attrs.docs)
  if (!ids.length) out.push('les documents que vous détenez')
  // Le numéro des documents et l'identifiant IDUFCI ne figurent PLUS ici : ils
  // sont facultatifs. Ce qui est exigé, c'est de dire quelle pièce on détient —
  // le numéro et l'IDUFCI se donnent ensuite à l'acheteur sérieux.
  if (!attrs.titulaire) out.push('le nom porté sur vos documents')
  if (!attrs.bornage) out.push('le bornage')
  if (!attrs.juridique) out.push('la situation juridique')
  if (!attrs.occupation) out.push('l’occupation')
  if (!attrs.vendeur) out.push('votre qualité (propriétaire, héritier…)')
  if (attrs.engagement !== 'oui') out.push('les trois engagements')
  return out
}

/**
 * Les contrôles présentés à l'acheteur, engendrés par ce que le vendeur a
 * déclaré. Ce ne sont pas des généralités : chaque ligne répond à une réponse
 * précise du formulaire.
 */
export function verificationsAcheteur(attrs: Record<string, string>): string[] {
  const out: string[] = []
  const ids = lireDocs(attrs.docs)
  ids.forEach((id) => out.push(DOC_PAR_ID[id].check))
  if (ids.length > 1) {
    out.push('Le vendeur présente plusieurs documents : vérifiez qu’ils désignent bien la même parcelle — mêmes numéros de lot et d’îlot, même superficie, même plan.')
  }
  if (estUrbain(attrs.zone) && attrs.lotissement) {
    out.push(`Vérifiez que le lotissement « ${attrs.lotissement} » est approuvé sur le portail public du MCLU. Un lotissement annulé ou en sursis ne peut pas donner de titre.`)
  }
  if (attrs.bornage === 'Non borné' || attrs.bornage === 'Je ne sais pas') {
    out.push('Le terrain n’est pas borné, ou le vendeur l’ignore. Exigez un bornage contradictoire par un géomètre agréé, en présence du vendeur, avant tout versement.')
  }
  if (attrs.titulaire === 'Un tiers (procuration)' || attrs.vendeur === 'Mandataire') {
    out.push('Le vendeur agit pour le compte d’un tiers : demandez la procuration notariée et la pièce d’identité du véritable propriétaire.')
  }
  if (attrs.titulaire === 'Un parent (succession)' || attrs.vendeur === 'Héritier') {
    out.push('Bien issu d’une succession : demandez le certificat d’hérédité et l’accord écrit de tous les héritiers. Un seul héritier ne peut pas vendre seul.')
  }
  if (attrs.juridique && attrs.juridique !== 'Libre de tout litige') {
    out.push(`Le vendeur déclare : ${attrs.juridique.toLowerCase()}. Faites lever la situation, par écrit, avant le moindre versement.`)
  }
  if (attrs.occupation && attrs.occupation !== 'Libre') {
    out.push(`Le bien n’est pas libre (${attrs.occupation.toLowerCase()}). Faites préciser par écrit la date de libération et qui en supporte le coût.`)
  }
  if (attrs.acces === 'Enclavé') {
    out.push('Terrain enclavé : faites établir une servitude de passage écrite, sinon vous ne pourrez ni construire ni revendre.')
  }
  if (attrs.notaire !== 'Oui') {
    out.push('Le vendeur n’annonce pas de vente devant notaire. Sans acte notarié, la mutation ne peut pas être enregistrée : vous paieriez sans devenir propriétaire.')
  }
  out.push('Ne versez jamais d’acompte avant la signature du compromis chez un notaire — et choisissez votre propre notaire.')
  return out
}

// --- Le guide, servi sous chaque annonce et dans l'aide ---------------------

export const ARNAQUES: { titre: string; texte: string }[] = [
  { titre: 'La double vente', texte: 'La même parcelle est vendue à plusieurs acheteurs, souvent sur la base d’attestations villageoises successives. C’est de loin la fraude la plus répandue.' },
  { titre: 'La photocopie', texte: 'Le vendeur ne montre jamais l’original — parce qu’il ne l’a pas, ou parce que le document est falsifié. Un document authentique se présente en original.' },
  { titre: 'Le lotissement fantôme', texte: 'Un « lot » vendu dans un lotissement jamais approuvé, annulé, ou en sursis. Cela se vérifie gratuitement, en ligne, en deux minutes.' },
  { titre: 'Le faux mandataire', texte: 'Une personne vend « pour le compte du propriétaire » sans procuration notariée, ou un héritier vend seul un bien indivis sans l’accord des autres.' },
  { titre: 'Le prix trop beau', texte: 'Un terrain 40 % sous le prix du quartier cache presque toujours un litige, un enclavement, une emprise publique ou un dossier vide.' },
]

export const LIENS_VERIFICATION: { url: string; titre: string; texte: string }[] = [
  {
    url: 'https://construction.gouv.ci/mclulotissement/index.php',
    titre: 'Portail des lotissements — MCLU',
    texte: 'Recherche publique par nom de lotissement, région et département. Renvoie un statut officiel : approuvé, annulé ou en sursis.',
  },
  {
    url: 'https://www.afor.ci/',
    titre: 'AFOR — Agence Foncière Rurale',
    texte: 'Délivre le certificat foncier en zone rurale et renseigne sur son état.',
  },
  {
    url: 'https://servicepublic.gouv.ci/',
    titre: 'Service public de Côte d’Ivoire',
    texte: 'Démarches officielles : ACD, titre foncier, pièces à fournir, guichets compétents.',
  },
]
