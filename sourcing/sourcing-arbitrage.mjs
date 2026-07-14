export const meta = {
  name: 'sourcing-arbitrage',
  description: "Arbitrage import Europe→Abidjan : repère des articles pas chers (Kleinanzeigen & co), calcule fret + douane + marge, classe les meilleures affaires pour Chap.ci",
  whenToUse: "3×/semaine, pour proposer à l'admin de Chap.ci des articles à acheter en Europe et revendre à Abidjan avec profit.",
  phases: [
    { title: 'Étude', detail: 'demande Abidjan · sourcing Europe · logistique & douane (en parallèle)' },
    { title: 'Calcul', detail: 'consolidation des candidats + économie (marge exacte en JS)' },
    { title: 'Vérification', detail: 'critique marché : pièges, contrefaçon, articles réglementés' },
    { title: 'Rapport', detail: 'rédaction du rapport final (français)' },
  ],
}

// =============================================================================
//  CONFIG — modifie ces valeurs pour recalibrer les agents.
// =============================================================================
const CONFIG = {
  budgetEUR: 1000,            // capital par cycle d'achat/envoi
  airRateEurPerKg: 11,       // fret aérien « tout compris » (groupage/transitaire)
  seaRateEurPerKgEquiv: 2.5, // fret maritime (groupage LCL), équivalent €/kg
  seaMinEUR: 40,             // minimum de facturation groupage maritime
  seaWorthKg: 8,             // le maritime n'est considéré qu'au-delà de ce poids
  vatPct: 18,                // TVA import Côte d'Ivoire
  redevPct: 2.5,             // redevances diverses (RSTA/RS/prélèv. communautaires)
  localClearEUR: 6,          // dédouanement/manutention locale, amorti par article
  acqFeesPct: 5,             // frais d'acquisition (déplacement, négo, risque)
  sellFeesPct: 5,            // frais de vente/négo/retour à Abidjan
  minMarginPct: 30,          // seuil : marge nette minimale (% du coût de revient)
  minMarginFCFA: 20000,      // seuil : marge nette minimale par article
  fcfaPerEur: 655.957,       // taux fixe XOF↔EUR (arrimage à l'euro)
  topN: 10,                  // nombre d'affaires dans le rapport final
}
const FCFA = CONFIG.fcfaPerEur
const money = (n) => Math.round(n)

// =============================================================================
//  SCHÉMAS de sortie structurée des agents
// =============================================================================
const DEMAND_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'article précis (ex: iPhone 12 64Go)' },
          category: { type: 'string', description: 'catégorie Chap.ci (Téléphones, Électronique, Maison & Meubles, Matériel Pro, Loisirs & Sport, Mode & Beauté, Bébé & Enfant, Véhicules…)' },
          resaleFCFAtypical: { type: 'number', description: 'prix de revente TYPIQUE à Abidjan, en FCFA' },
          resaleFCFAlow: { type: 'number' },
          resaleFCFAhigh: { type: 'number' },
          demandLevel: { type: 'string', enum: ['très forte', 'forte', 'moyenne'] },
          whyIvorians: { type: 'string', description: 'pourquoi les Ivoiriens l\'achètent' },
        },
        required: ['product', 'category', 'resaleFCFAtypical', 'demandLevel'],
      },
    },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['products'],
}

const SOURCING_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string' },
          acquisitionPriceEURtypical: { type: 'number', description: 'prix d\'achat TYPIQUE en occasion/déstockage en Europe, en €' },
          acquisitionPriceEURlow: { type: 'number' },
          weightKg: { type: 'number', description: 'poids expédiable réaliste (article + emballage)' },
          condition: { type: 'string', description: 'état typique trouvé (occasion, reconditionné, neuf déstockage)' },
          europeSource: { type: 'string', description: 'où (Kleinanzeigen, Marktplaats, Leboncoin, Wallapop, Vinted, déstockeurs…)' },
          notes: { type: 'string' },
        },
        required: ['product', 'acquisitionPriceEURtypical', 'weightKg'],
      },
    },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['items'],
}

const LOGISTICS_SCHEMA = {
  type: 'object',
  properties: {
    airRateEurPerKg: { type: 'number' },
    seaRateEurPerKgEquiv: { type: 'number' },
    customs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          dutyPct: { type: 'number', description: 'droit de douane (TEC UEMOA) en %' },
          restricted: { type: 'boolean', description: 'article réglementé/interdit à l\'import' },
          notes: { type: 'string' },
        },
        required: ['category', 'dutyPct'],
      },
    },
    notes: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['customs'],
}

const CONSOLIDATE_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      description: 'articles fusionnés : chaque ligne combine achat Europe + revente Abidjan + taux douane',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string' },
          category: { type: 'string' },
          acquisitionEUR: { type: 'number', description: 'prix d\'achat Europe retenu (€)' },
          weightKg: { type: 'number' },
          resaleFCFA: { type: 'number', description: 'prix de revente Abidjan retenu (FCFA)' },
          dutyPct: { type: 'number', description: 'droit de douane catégorie (%)' },
          restricted: { type: 'boolean' },
          condition: { type: 'string' },
          demandLevel: { type: 'string' },
          europeSource: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['product', 'category', 'acquisitionEUR', 'weightKg', 'resaleFCFA', 'dutyPct'],
      },
    },
  },
  required: ['candidates'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string' },
          verdict: { type: 'string', enum: ['garder', 'écarter'] },
          risk: { type: 'string', enum: ['faible', 'moyen', 'élevé'] },
          reason: { type: 'string', description: 'contrefaçon, saturation, réglementation, saisonnalité, SAV…' },
          buyingTip: { type: 'string', description: 'conseil d\'achat concret (quoi vérifier, quelle version viser)' },
        },
        required: ['product', 'verdict', 'risk', 'reason'],
      },
    },
    marketOutlook: { type: 'string', description: 'note de marché globale, 3-5 phrases, en français' },
  },
  required: ['verdicts'],
}

// =============================================================================
//  ÉCONOMIE — calcul déterministe (JS), marges toujours exactes.
// =============================================================================
function economics(c, rates) {
  const acq = Math.max(1, c.acquisitionEUR)
  const w = Math.max(0.2, c.weightKg)
  const acqFees = acq * CONFIG.acqFeesPct / 100
  const air = w * rates.air
  const sea = Math.max(CONFIG.seaMinEUR, w * rates.sea)
  const useSea = w >= CONFIG.seaWorthKg && sea < air
  const freight = useSea ? sea : air
  const mode = useSea ? 'Maritime' : 'Aérien'
  const cif = acq + acqFees + freight
  const duty = cif * (c.dutyPct || 0) / 100
  const vat = (cif + duty) * CONFIG.vatPct / 100
  const redev = cif * CONFIG.redevPct / 100
  const customs = duty + vat + redev
  const landedEUR = cif + customs + CONFIG.localClearEUR
  const landedFCFA = landedEUR * FCFA
  const resale = c.resaleFCFA
  const sellFees = resale * CONFIG.sellFeesPct / 100
  const margin = resale - landedFCFA - sellFees
  const marginPct = landedFCFA > 0 ? (margin / landedFCFA) * 100 : 0
  const units = Math.max(1, Math.floor(CONFIG.budgetEUR / landedEUR))
  const totalProfit = margin * units
  return {
    ...c,
    freightMode: mode,
    freightEUR: money(freight),
    customsEUR: money(customs),
    landedEUR: money(landedEUR),
    landedFCFA: money(landedFCFA),
    resaleFCFA: money(resale),
    marginFCFA: money(margin),
    marginPct: Math.round(marginPct),
    unitsForBudget: units,
    totalProfitFCFA: money(totalProfit),
  }
}

const fmt = (n) => (n == null ? '?' : Math.round(n).toLocaleString('fr-FR'))

// =============================================================================
//  RAPPORT — assemblage markdown (chiffres exacts issus du JS).
// =============================================================================
function buildReport(items, marketOutlook, dateLabel) {
  const head = `# 🛒➡️🇨🇮 Rapport de sourcing — Europe → Abidjan${dateLabel ? `\n**${dateLabel}**` : ''}

Budget de référence : **${CONFIG.budgetEUR} €** (${fmt(CONFIG.budgetEUR * FCFA)} FCFA) · Taux 1 € = ${FCFA} FCFA
Seuils : marge ≥ ${CONFIG.minMarginPct} % **et** ≥ ${fmt(CONFIG.minMarginFCFA)} FCFA/article.

`
  if (!items.length) {
    return head + `\n> Aucune affaire n'a passé les seuils de rentabilité ce cycle. Rien à recommander (mieux vaut ne pas acheter que perdre).\n`
  }
  const best = items[0]
  const summary = `## 🏆 En bref
**${items.length} affaires** retenues. La meilleure : **${best.product}** — acheter ~**${fmt(best.acquisitionEUR)} €** en Europe, revendre ~**${fmt(best.resaleFCFA)} FCFA** à Abidjan → **+${fmt(best.marginFCFA)} FCFA/article** (marge **${best.marginPct} %**, fret ${best.freightMode.toLowerCase()}). Avec ${CONFIG.budgetEUR} € : ~${best.unitsForBudget} unités, profit potentiel **${fmt(best.totalProfitFCFA)} FCFA**.

`
  const rows = items.map((it, i) => {
    return `| ${i + 1} | **${it.product}** | ${it.category} | ${fmt(it.acquisitionEUR)} € | ${it.freightMode} · ${fmt(it.freightEUR)} € | ${fmt(it.landedFCFA)} | ${fmt(it.resaleFCFA)} | **+${fmt(it.marginFCFA)}** | ${it.marginPct} % | ${it.unitsForBudget} | ${fmt(it.totalProfitFCFA)} |`
  }).join('\n')
  const table = `## 📊 Top ${items.length} des affaires

| # | Article | Catégorie | Achat | Fret | Revient (FCFA) | Revente Abidjan | Marge/u | Marge % | Unités/${CONFIG.budgetEUR}€ | Profit total |
|---|---------|-----------|-------|------|----------------|-----------------|---------|---------|--------|--------------|
${rows}

`
  const advice = `## 💡 Conseils d'achat
${items.map((it) => `- **${it.product}** — ${it.buyingTip || it.notes || 'Vérifier l\'état réel et négocier sous le prix typique.'}${it.risk ? ` _(risque : ${it.risk})_` : ''}`).join('\n')}

`
  const outlook = marketOutlook ? `## 🔭 Note de marché\n${marketOutlook}\n\n` : ''
  const foot = `---
_Prix indicatifs (recherche best-effort) — à vérifier au moment de l'achat. Import à déclarer et dédouaner en règle. Généré par le moteur de sourcing Chap.ci._`
  return head + summary + table + advice + outlook + foot
}

// =============================================================================
//  WORKFLOW
// =============================================================================
// args peut arriver en objet ou en chaîne JSON selon l'appelant → on normalise.
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const catHint = A.categories || 'libre (les agents choisissent les niches les plus rentables)'
const dateLabel = A.date || null

phase('Étude')
log('🔎 Étude de marché : demande Abidjan · sourcing Europe · logistique & douane')

const [demand, sourcing, logistics] = await parallel([
  () => agent(
    `Tu es analyste de marché pour Abidjan (Côte d'Ivoire). Objectif : lister les articles d'OCCASION/reconditionnés importés d'Europe que les Ivoiriens achètent le plus, avec leur PRIX DE REVENTE RÉALISTE à Abidjan en FCFA.
Catégories visées : ${catHint}. Familles fortes à Abidjan : téléphones (iPhone/Samsung d'occasion), électronique (PC portables, TV, consoles PS4/PS5, appareils photo), électroménager compact, pièces auto, outillage/groupes électrogènes, vélos/fitness, mode de marque, puériculture.
Utilise la recherche web (WebSearch/WebFetch via ToolSearch) pour estimer les prix de revente RÉELS à Abidjan (jumia.ci, marketplaces locales, groupes de vente Facebook/WhatsApp). Donne 12 à 18 articles PRÉCIS (modèle exact), pas de généralités.
IMPORTANT : donne le prix de revente RÉEL DU MARCHÉ actuel — celui auquel ça se vend VRAIMENT à Abidjan (l'électronique importée y est plus chère qu'en Europe : prime de rareté). Fournis low/typical/high. NE SOUS-ESTIME PAS : un iPhone 11 propre se revend ~140–170 k FCFA, une PS4 Slim+jeu ~130–160 k, une TV 43" Smart ~150–200 k, un reflex ~150–190 k. Sortie structurée.`,
    { label: 'demande-abidjan', phase: 'Étude', schema: DEMAND_SCHEMA, effort: 'medium' },
  ),
  () => agent(
    `Tu es acheteur/sourceur en Europe. Pour des articles d'occasion/reconditionnés/déstockage recherchés en Afrique de l'Ouest (téléphones, PC portables, TV, consoles, appareils photo, électroménager compact, pièces auto, outillage, vélos, mode de marque, puériculture), estime le PRIX D'ACHAT BAS TYPIQUE en € et le POIDS expédiable (article + emballage).
Sources à considérer : Kleinanzeigen (Allemagne), Marktplaats (Pays-Bas), Leboncoin (France), Wallapop (Espagne), Vinted, déstockeurs/lots. Utilise la recherche web (WebSearch/WebFetch via ToolSearch) pour caler des fourchettes récentes.
Donne 12 à 18 articles PRÉCIS avec prix d'achat BAS ATTEIGNABLE (le meilleur prix qu'un bon acheteur négocie VRAIMENT sur ces plateformes — c'est tout l'intérêt du sourcing) + le prix typique, poids réaliste (kg), état typique et la source la plus adaptée. Vise des prix réels et négociés, pas les plus bas rêvés ni le prix « affiché » moyen. Sortie structurée.`,
    { label: 'sourcing-europe', phase: 'Étude', schema: SOURCING_SCHEMA, effort: 'medium' },
  ),
  () => agent(
    `Tu es expert logistique & douane pour l'import Europe → Abidjan (Côte d'Ivoire).
1) Donne des tarifs de fret « tout compris » réalistes : aérien (€/kg, groupage/transitaire) et maritime groupage LCL (équivalent €/kg).
2) Pour chaque grande catégorie (Téléphones, Électronique, Maison & Électroménager, Matériel Pro/outillage, Véhicules-Pièces auto, Loisirs & Sport, Mode & Beauté, Bébé & Enfant), donne le DROIT DE DOUANE (TEC UEMOA, %).
restricted=true UNIQUEMENT pour les articles réellement interdits ou très réglementés à l'import (armes, médicaments, matériel radio soumis à licence, contrefaçons, certains produits d'occasion explicitement prohibés). L'électronique grand public, les téléphones, les pièces auto, la mode, la puériculture, l'électroménager courant NE SONT PAS restricted (restricted=false).
Rappelle que s'ajoutent la TVA 18 % et des redevances (~2,5 %). Utilise la recherche web (WebSearch/WebFetch via ToolSearch) pour vérifier les taux et règles ivoiriennes récentes. Sortie structurée, en français.`,
    { label: 'logistique-douane', phase: 'Étude', schema: LOGISTICS_SCHEMA, effort: 'medium' },
  ),
])

log(`✅ Étude : ${demand?.products?.length || 0} produits demandés · ${sourcing?.items?.length || 0} sources · ${logistics?.customs?.length || 0} catégories douane`)

phase('Calcul')
const consolidated = await agent(
  `Tu es l'économiste du projet. On te donne 3 jeux de données. FUSIONNE-les en une liste de CANDIDATS exploitables : chaque candidat = un article précis avec son prix d'achat Europe (€), son poids (kg), son prix de revente Abidjan (FCFA) et le droit de douane (%) de sa catégorie.
Ne garde que les articles où l'on a À LA FOIS une source d'achat Europe crédible ET une revente Abidjan crédible. Vise 12 à 18 candidats.
Pour chaque candidat : acquisitionEUR = le PRIX D'ACHAT BAS ATTEIGNABLE en Europe (le bon deal négocié, pas le prix moyen — c'est le métier du sourceur d'acheter bas). resaleFCFA = le prix de revente TYPIQUE réel du marché d'Abidjan (ni le plus bas ni le plus haut extrême). N'invente pas : reste dans les fourchettes fournies. Marque restricted=true SEULEMENT pour un article réellement interdit/très réglementé (pas une catégorie grand public).
NE CALCULE PAS les marges (c'est fait ailleurs) — fournis seulement les entrées brutes propres.

DEMANDE ABIDJAN:
${JSON.stringify(demand?.products || [])}

SOURCING EUROPE:
${JSON.stringify(sourcing?.items || [])}

LOGISTIQUE & DOUANE:
${JSON.stringify(logistics?.customs || [])}`,
  { label: 'consolidation', phase: 'Calcul', schema: CONSOLIDATE_SCHEMA, effort: 'high' },
)

// --- Tarifs de fret réels de l'agent logistique (bornés), sinon valeurs CONFIG ---
const inRange = (v, lo, hi, d) => (typeof v === 'number' && v >= lo && v <= hi ? v : d)
const rates = {
  air: inRange(logistics?.airRateEurPerKg, 5, 16, CONFIG.airRateEurPerKg),
  sea: inRange(logistics?.seaRateEurPerKgEquiv, 1, 5, CONFIG.seaRateEurPerKgEquiv),
}
log(`🚚 Fret retenu : aérien ${rates.air} €/kg · maritime ${rates.sea} €/kg-équiv`)

// --- Calcul déterministe des marges (JS) ---
let computed = (consolidated?.candidates || [])
  .filter((c) => !c.restricted)
  .map((c) => economics(c, rates))
  .filter((c) => c.marginFCFA >= CONFIG.minMarginFCFA && c.marginPct >= CONFIG.minMarginPct)
  .sort((a, b) => b.totalProfitFCFA - a.totalProfitFCFA)

log(`🧮 ${computed.length} candidats passent les seuils de rentabilité`)

// On soumet les meilleurs (marge) à la critique marché.
const shortlist = computed.slice(0, Math.max(CONFIG.topN + 4, 12))

phase('Vérification')
const critic = shortlist.length
  ? await agent(
      `Tu es un vétéran du commerce d'import à Abidjan, sceptique mais pragmatique. Voici des affaires candidates (achat Europe → revente Abidjan). Pour CHACUNE, dis « garder » ou « écarter » et le niveau de risque, en traquant les pièges : contrefaçon fréquente, marché déjà saturé, article réglementé/interdit, saisonnalité, SAV/pièces difficiles, revente très surestimée. Ajoute un conseil d'achat concret (quelle version viser, quoi vérifier).
Par défaut, GARDE l'affaire avec une note de risque — n'écarte QUE si le risque est vraiment rédhibitoire (interdit, contrefaçon quasi-certaine, marché mort). Termine par une note de marché globale (3-5 phrases).

CANDIDATS:
${JSON.stringify(shortlist.map((c) => ({ product: c.product, category: c.category, achatEUR: c.acquisitionEUR, reventeFCFA: c.resaleFCFA, margeFCFA: c.marginFCFA, margePct: c.marginPct, fret: c.freightMode })))}`,
      { label: 'critique-marche', phase: 'Vérification', schema: CRITIC_SCHEMA, effort: 'high' },
    )
  : { verdicts: [], marketOutlook: '' }

// Applique les verdicts : ne garder que « garder », greffer risque + conseil.
const vmap = new Map((critic?.verdicts || []).map((v) => [v.product, v]))
const finalItems = shortlist
  .map((c) => {
    const v = vmap.get(c.product)
    return { ...c, risk: v?.risk, buyingTip: v?.buyingTip, _drop: v?.verdict === 'écarter' }
  })
  .filter((c) => !c._drop)
  .slice(0, CONFIG.topN)

phase('Rapport')
const report = buildReport(finalItems, critic?.marketOutlook || '', dateLabel)
log(`📄 Rapport prêt : ${finalItems.length} affaires recommandées`)

return { report, items: finalItems, generatedFor: dateLabel }
