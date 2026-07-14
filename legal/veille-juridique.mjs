export const meta = {
  name: 'veille-juridique-ci',
  description: "Veille juridique mensuelle : 5 agents inspectent les lois ivoiriennes applicables aux marketplaces (données perso/ARTCI, e-commerce, consommation, fiscalité, cybercriminalité) et proposent les mises à jour des pages légales de Chap.ci",
  whenToUse: "1×/mois, pour garder les CGU et la politique de confidentialité de Chap.ci conformes au droit ivoirien.",
  phases: [
    { title: 'Veille', detail: '5 agents, un par domaine juridique (en parallèle)' },
    { title: 'Synthèse', detail: 'comparaison avec les pages légales actuelles du site' },
    { title: 'Rapport', detail: 'rapport final + mises à jour proposées' },
  ],
}

// =============================================================================
//  Les 5 domaines de veille (1 agent chacun).
// =============================================================================
const DOMAINS = [
  {
    key: 'donnees-personnelles',
    title: 'Protection des données personnelles & ARTCI',
    prompt: `Domaine : protection des données personnelles en Côte d'Ivoire.
Cadre connu : loi n° 2013-450 du 19/06/2013 (protection des données à caractère personnel), ARTCI = autorité de contrôle (formalités via la plateforme CERTINUM depuis juillet 2026, fichier national des correspondants — arrêté n° 0099/MTND/CAB du 16/08/2024), acte additionnel CEDEAO A/SA.1/01/10, Convention de Malabo (UA), révision de la loi 2013-450 en réflexion.
Vérifie via la recherche web (WebSearch/WebFetch via ToolSearch) s'il existe : nouvelle loi ou révision, décrets d'application récents, décisions/communiqués ARTCI concernant les plateformes en ligne, nouvelles obligations (délégué à la protection des données, registres, notification de violations), sanctions récentes contre des plateformes.`,
  },
  {
    key: 'commerce-electronique',
    title: 'Commerce électronique & obligations des plateformes',
    prompt: `Domaine : commerce électronique et obligations des plateformes en ligne en Côte d'Ivoire.
Cadre connu : loi n° 2013-546 du 30/07/2013 (transactions électroniques : identification de l'éditeur, contrat électronique, preuve, déclaration d'activité de commerce électronique), loi n° 2024-352 du 06/06/2024 relative aux communications électroniques (abroge l'ordonnance n° 2012-293), avant-projet de loi dédiée au commerce électronique (octobre 2024, non adopté — à surveiller).
Vérifie via la recherche web s'il existe : nouvelles obligations d'identification/immatriculation des e-commerçants ou marketplaces, réglementation du commerce électronique ou du commerce social (réseaux sociaux), textes sur les places de marché, obligations de loyauté des plateformes, réglementation des avis en ligne, nouveaux décrets d'application.`,
  },
  {
    key: 'consommation',
    title: 'Droit de la consommation & pratiques commerciales',
    prompt: `Domaine : droit de la consommation en Côte d'Ivoire appliqué à la vente en ligne.
Cadre connu : loi n° 2016-412 du 15/06/2016 relative à la consommation (information du consommateur, pratiques commerciales trompeuses, garanties, clauses abusives), rôle du ministère du Commerce et des associations de consommateurs.
Vérifie via la recherche web s'il existe : révisions de la loi consommation, textes sur l'affichage des prix en ligne, droit de rétractation en Côte d'Ivoire, réglementation des promotions/soldes, obligations de garantie, décisions récentes concernant des sites de vente.`,
  },
  {
    key: 'fiscalite',
    title: 'Fiscalité du numérique & obligations des plateformes',
    prompt: `Domaine : fiscalité applicable aux plateformes numériques en Côte d'Ivoire.
Cadre connu : annexes fiscales annuelles (chaque loi de finances ivoirienne peut créer des taxes sur le numérique), TVA sur les services numériques, obligations déclaratives DGI, taxes sur les transferts d'argent mobile.
Vérifie via la recherche web : l'annexe fiscale de l'année en cours (et ses mesures numériques/e-commerce), toute taxe nouvelle sur les marketplaces, les ventes en ligne ou les paiements mobiles, les obligations de déclaration des revenus des vendeurs par les plateformes, les seuils d'imposition des vendeurs particuliers.`,
  },
  {
    key: 'cybersecurite-contenus',
    title: 'Cybercriminalité, contenus illicites & produits interdits',
    prompt: `Domaine : cybercriminalité et contenus/produits illicites en Côte d'Ivoire.
Cadre connu : loi n° 2013-451 du 19/06/2013 (lutte contre la cybercriminalité), modifiée par la loi n° 2023-593 du 07/06/2023, PLCC (Plateforme de Lutte Contre la Cybercriminalité), AIRP (Autorité Ivoirienne de Régulation Pharmaceutique — interdiction de la vente en ligne de médicaments/compléments non homologués/cosmétiques éclaircissants), listes de produits interdits ou réglementés à la vente (armes, espèces protégées, etc.).
Vérifie via la recherche web s'il existe : nouvelles infractions ou obligations pour les plateformes (retrait de contenus, signalement, coopération avec la PLCC), évolutions des produits interdits/réglementés à la vente en ligne, campagnes ou décisions récentes contre les arnaques en ligne, obligations de modération.`,
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    changes: {
      type: 'array',
      description: 'nouveautés ou changements juridiques détectés (vide si rien de neuf)',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'intitulé du texte/décision/mesure' },
          date: { type: 'string', description: 'date ou période (ex: mars 2026)' },
          source: { type: 'string', description: 'source (URL ou institution)' },
          impact: { type: 'string', description: "impact concret pour une marketplace comme Chap.ci, en français simple" },
          severity: { type: 'string', enum: ['info', 'important', 'urgent'] },
          actionRequired: { type: 'string', description: 'action recommandée (mettre à jour CGU, déclarer, etc.)' },
        },
        required: ['title', 'impact', 'severity'],
      },
    },
    frameworkConfirmed: { type: 'boolean', description: 'true si le cadre connu (lois citées) est toujours en vigueur tel quel' },
    notes: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['domain', 'changes', 'frameworkConfirmed'],
}

const SYNTHESIS_SCHEMA = {
  type: 'object',
  properties: {
    conformityScore: { type: 'number', description: 'note de conformité des pages actuelles, 0-100' },
    summary: { type: 'string', description: 'synthèse en 3-6 phrases, français' },
    updates: {
      type: 'array',
      description: 'mises à jour proposées pour les pages du site (vide si tout est conforme)',
      items: {
        type: 'object',
        properties: {
          page: { type: 'string', enum: ['confidentialite', 'cgu', 'faq', 'autre'] },
          section: { type: 'string', description: 'section concernée' },
          priority: { type: 'string', enum: ['urgent', 'recommandé', 'optionnel'] },
          reason: { type: 'string', description: 'pourquoi (texte de loi, décision…)' },
          proposedText: { type: 'string', description: 'texte EXACT proposé, prêt à intégrer, en français' },
        },
        required: ['page', 'section', 'priority', 'reason', 'proposedText'],
      },
    },
    otherActions: {
      type: 'array',
      description: 'actions hors site (déclaration ARTCI, immatriculation, fiscalité…)',
      items: { type: 'string' },
    },
  },
  required: ['conformityScore', 'summary', 'updates'],
}

// =============================================================================
//  WORKFLOW
// =============================================================================
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const dateLabel = A.date || ''
const privacyPath = A.privacyPath || 'src/pages/Privacy.tsx'
const termsPath = A.termsPath || 'src/pages/Terms.tsx'

phase('Veille')
log('⚖️ Veille juridique Côte d\'Ivoire : 5 agents (données perso, e-commerce, consommation, fiscalité, cybercriminalité)')

const findings = await parallel(DOMAINS.map((d) => () =>
  agent(
    `Tu es juriste spécialisé en droit ivoirien du numérique, chargé de la veille mensuelle pour Chap.ci (marketplace de petites annonces 100 % ivoirienne, chap.ci — mise en relation acheteurs/vendeurs, paiements hors plateforme).
${d.prompt}
MÉTHODE : fais plusieurs recherches web ciblées (français). Priorité aux sources officielles ou fiables (ARTCI, DGI, gouv.ci, journaux ivoiriens sérieux). Fenêtre : ce qui est entré en vigueur ou annoncé ces 3 derniers mois, plus toute obligation existante qu'une marketplace ivoirienne ignorerait souvent.
HONNÊTETÉ : si rien de nouveau, dis-le (changes = [] et frameworkConfirmed = true). N'invente JAMAIS un texte de loi. Cite tes sources. Tout en français.`,
    { label: `veille:${d.key}`, phase: 'Veille', schema: FINDINGS_SCHEMA, effort: 'medium' },
  ),
))

const clean = findings.filter(Boolean)
const totalChanges = clean.reduce((n, f) => n + (f.changes?.length || 0), 0)
log(`✅ Veille terminée : ${totalChanges} évolution(s) détectée(s) sur ${clean.length}/5 domaines analysés`)

phase('Synthèse')
const synthesis = await agent(
  `Tu es le juriste principal de Chap.ci. Voici (1) les résultats de la veille mensuelle sur le droit ivoirien des marketplaces et (2) les pages légales ACTUELLES du site à lire toi-même.

ÉTAPE 1 — Lis les deux fichiers du dépôt avec l'outil Read :
- Politique de confidentialité : ${privacyPath}
- CGU : ${termsPath}

ÉTAPE 2 — Compare leur contenu avec les résultats de veille ci-dessous et le cadre juridique ivoirien (loi 2013-450 données perso/ARTCI, loi 2013-546 transactions électroniques, loi 2013-451 cybercriminalité, loi 2016-412 consommation, fiscalité DGI).

ÉTAPE 3 — Produis : une note de conformité (0-100), une synthèse, la liste des mises à jour à faire sur les pages (avec le TEXTE EXACT proposé, en français, prêt à intégrer) et les actions hors site (ex. déclaration des traitements à l'ARTCI, immatriculation RCCM, obligations fiscales). Si les pages sont déjà conformes, dis-le et propose peu ou pas de changements — ne modifie pas pour modifier.

RÉSULTATS DE VEILLE :
${JSON.stringify(clean)}`,
  { label: 'synthese-conformite', phase: 'Synthèse', schema: SYNTHESIS_SCHEMA, effort: 'high' },
)

phase('Rapport')
const sev = { urgent: '🔴', important: '🟠', info: '🔵' }
const pri = { 'urgent': '🔴 Urgent', 'recommandé': '🟠 Recommandé', 'optionnel': '🔵 Optionnel' }

const domainBlocks = clean.map((f) => {
  const changes = (f.changes || [])
  const lines = changes.length
    ? changes.map((c) => `- ${sev[c.severity] || '🔵'} **${c.title}**${c.date ? ` (${c.date})` : ''} — ${c.impact}${c.actionRequired ? `\n  → _Action : ${c.actionRequired}_` : ''}`).join('\n')
    : '- ✅ Rien de nouveau ce mois-ci — cadre en vigueur confirmé.'
  return `### ${f.domain}\n${lines}`
}).join('\n\n')

const updateBlocks = (synthesis?.updates || []).length
  ? synthesis.updates.map((u, i) =>
      `**${i + 1}. [${pri[u.priority] || u.priority}] Page « ${u.page} » — ${u.section}**\n_Pourquoi :_ ${u.reason}\n\n> ${u.proposedText.split('\n').join('\n> ')}`,
    ).join('\n\n')
  : '_Aucune mise à jour de page nécessaire ce mois-ci._'

const actions = (synthesis?.otherActions || []).length
  ? synthesis.otherActions.map((a) => `- ${a}`).join('\n')
  : '- _Aucune action hors site signalée._'

const report = `# ⚖️ Veille juridique Chap.ci — marketplaces en Côte d'Ivoire${dateLabel ? `\n**${dateLabel}**` : ''}

**Note de conformité des pages actuelles : ${synthesis?.conformityScore ?? '?'} / 100**

${synthesis?.summary || ''}

## 🔎 Résultats de veille par domaine

${domainBlocks}

## ✏️ Mises à jour proposées pour le site

${updateBlocks}

## 📋 Actions hors site

${actions}

---
_Veille automatique mensuelle (5 agents) — sources best-effort à confirmer auprès d'un conseil juridique pour les décisions importantes. Généré par le moteur de veille Chap.ci._`

log(`📄 Rapport prêt — conformité ${synthesis?.conformityScore ?? '?'}/100, ${(synthesis?.updates || []).length} mise(s) à jour proposée(s)`)

return {
  report,
  conformityScore: synthesis?.conformityScore ?? null,
  updates: synthesis?.updates || [],
  otherActions: synthesis?.otherActions || [],
  changesDetected: totalChanges,
  generatedFor: dateLabel,
}
