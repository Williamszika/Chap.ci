export const meta = {
  name: 'veille-concurrence',
  description: "Veille concurrentielle hebdomadaire : agents qui inspectent les marketplaces concurrentes en Côte d'Ivoire (Jiji, CoinAfrique, Facebook Marketplace, nouveaux entrants) et en tirent des opportunités concrètes pour Chap.ci",
  whenToUse: "1×/semaine, pour garder un coup d'avance sur la concurrence des petites annonces en CI.",
  phases: [
    { title: 'Veille', detail: 'un agent par concurrent (en parallèle)' },
    { title: 'Synthèse', detail: 'opportunités et menaces pour Chap.ci' },
  ],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const dateLabel = A.date || ''

const COMPETITORS = [
  {
    key: 'jiji',
    name: 'Jiji Côte d\'Ivoire (jiji.ci)',
    prompt: `Concurrent : Jiji Côte d'Ivoire (jiji.ci, ex-Tonaton), le leader des petites annonces en CI.
Étudie via la recherche web : nouveautés produit/fonctionnalités récentes, offres payantes pour vendeurs (boost, packages premium — et leurs PRIX en FCFA), campagnes marketing en cours, catégories mises en avant, points faibles reprochés par les utilisateurs (avis, plaintes, arnaques signalées).`,
  },
  {
    key: 'coinafrique',
    name: 'CoinAfrique (ci.coinafrique.com)',
    prompt: `Concurrent : CoinAfrique Côte d'Ivoire (ci.coinafrique.com), marketplace panafricaine de petites annonces.
Étudie via la recherche web : nouveautés récentes, monétisation (annonces premium, tarifs FCFA), présence marketing en CI, forces/faiblesses perçues par les utilisateurs, positionnement vs Jiji.`,
  },
  {
    key: 'facebook-social',
    name: 'Facebook Marketplace & commerce social (WhatsApp/TikTok)',
    prompt: `Concurrent : le commerce SOCIAL en Côte d'Ivoire — Facebook Marketplace, groupes Facebook de vente (Abidjan), vendeuses WhatsApp/statuts, TikTok Shop-like.
Étudie via la recherche web : ampleur du phénomène en CI, ce que les acheteurs/vendeurs y apprécient (gratuité, contact direct) et leurs galères (arnaques, pas d'avis, pas de recours), toute évolution récente (règles Facebook, taxation du commerce social, tendances TikTok commerce en Afrique de l'Ouest).`,
  },
  {
    key: 'nouveaux-entrants',
    name: 'Nouveaux entrants & autres acteurs',
    prompt: `Sujet : les AUTRES acteurs et nouveaux entrants des petites annonces / e-commerce C2C en Côte d'Ivoire (hors Jiji, CoinAfrique, Facebook) : nouvelles plateformes lancées récemment, acteurs immobiliers/auto spécialisés (Afribaba, Locanto, expat.com, plateformes locales…), levées de fonds ou lancements annoncés dans la tech ivoirienne.
Étudie via la recherche web les 3 derniers mois en priorité. Si rien de nouveau, dis-le.`,
  },
]

const COMP_SCHEMA = {
  type: 'object',
  properties: {
    competitor: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fact: { type: 'string', description: 'fait observé (nouveauté, prix, faiblesse, campagne…)' },
          kind: { type: 'string', enum: ['nouveauté', 'monétisation', 'marketing', 'faiblesse', 'menace', 'autre'] },
          source: { type: 'string' },
        },
        required: ['fact', 'kind'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['competitor', 'findings'],
}

const SYNTH_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'la leçon de la semaine en 1 phrase' },
    opportunities: {
      type: 'array',
      description: 'opportunités CONCRÈTES pour Chap.ci, classées par impact',
      items: {
        type: 'object',
        properties: {
          idea: { type: 'string', description: 'action concrète pour Chap.ci' },
          why: { type: 'string', description: 'justification basée sur la veille' },
          effort: { type: 'string', enum: ['petit', 'moyen', 'gros'] },
        },
        required: ['idea', 'why', 'effort'],
      },
    },
    threats: { type: 'array', items: { type: 'string' } },
  },
  required: ['headline', 'opportunities'],
}

phase('Veille')
log('🔭 Veille concurrentielle : Jiji, CoinAfrique, commerce social, nouveaux entrants')

const results = await parallel(COMPETITORS.map((c) => () =>
  agent(
    `Tu es analyste concurrentiel pour Chap.ci (chap.ci — marketplace de petites annonces 100 % ivoirienne : annonces gratuites, messagerie intégrée qui masque les numéros, avis après transaction confirmée, profils vendeurs, catégories du terroir comme Alimentation/Agriculture ; monétisation pas encore lancée).
${c.prompt}
MÉTHODE : plusieurs recherches web ciblées (français). Rapporte des FAITS datés et sourcés, pas des généralités. 4 à 8 faits maximum, les plus significatifs. Si peu de nouveautés cette semaine, dis-le honnêtement.`,
    { label: `veille:${c.key}`, phase: 'Veille', schema: COMP_SCHEMA, effort: 'medium' },
  ),
))

const clean = results.filter(Boolean)
log(`✅ ${clean.reduce((n, r) => n + (r.findings?.length || 0), 0)} fait(s) collecté(s) sur ${clean.length}/4 fronts`)

phase('Synthèse')
const synth = await agent(
  `Tu es le stratège produit de Chap.ci (marketplace ivoirienne en construction, différenciation : 100 % ivoirien, confiance — numéros masqués, avis vérifiés après transaction, modération quotidienne — et catégories locales). Voici la veille concurrentielle de la semaine.
Tire-en : la leçon principale, 3 à 6 OPPORTUNITÉS CONCRÈTES pour Chap.ci (fonctionnalité à copier/améliorer, faiblesse d'un concurrent à exploiter, positionnement marketing, idée de monétisation avec prix réalistes en FCFA vs ceux des concurrents), et les menaces à surveiller. Sois concret et actionnable : « faire X parce que Y », pas de blabla stratégique.

VEILLE DE LA SEMAINE :
${JSON.stringify(clean)}`,
  { label: 'synthese-strategie', phase: 'Synthèse', schema: SYNTH_SCHEMA, effort: 'high' },
)

const kindIcon = { 'nouveauté': '🆕', 'monétisation': '💰', marketing: '📣', faiblesse: '🎯', menace: '⚠️', autre: '🔹' }
const effortTag = { petit: '🟢 petit effort', moyen: '🟠 effort moyen', gros: '🔴 gros chantier' }

const blocks = clean.map((r) => {
  const lines = (r.findings || []).length
    ? r.findings.map((f) => `- ${kindIcon[f.kind] || '🔹'} ${f.fact}${f.source ? ` _(source : ${f.source})_` : ''}`).join('\n')
    : '- Rien de significatif cette semaine.'
  return `### ${r.competitor}\n${lines}`
}).join('\n\n')

const opps = (synth?.opportunities || []).map((o, i) => `**${i + 1}. ${o.idea}** (${effortTag[o.effort] || o.effort})\n_${o.why}_`).join('\n\n')
const threats = (synth?.threats || []).length ? synth.threats.map((t) => `- ⚠️ ${t}`).join('\n') : '- Aucune menace nouvelle identifiée.'

const report = `# 🔭 Veille concurrentielle — petites annonces en Côte d'Ivoire${dateLabel ? `\n**${dateLabel}**` : ''}

> **${synth?.headline || ''}**

## Ce que fait la concurrence

${blocks}

## 💡 Opportunités pour Chap.ci

${opps || '_Rien de nouveau à exploiter cette semaine._'}

## ⚠️ Menaces à surveiller

${threats}

---
_Veille automatique hebdomadaire (4 fronts surveillés) — sources best-effort. Généré par le moteur de veille Chap.ci._`

log('📄 Rapport de veille concurrentielle prêt')
return { report, opportunities: synth?.opportunities || [], generatedFor: dateLabel }
