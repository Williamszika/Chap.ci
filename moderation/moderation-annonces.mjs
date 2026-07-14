export const meta = {
  name: 'moderation-annonces',
  description: "Modération quotidienne des annonces Chap.ci : détecte produits interdits (AIRP, contrefaçons…), arnaques probables, doublons et contenus inappropriés, avec liens directs vers les annonces à traiter",
  whenToUse: "1×/jour, pour signaler à l'admin les annonces à masquer/vérifier (obligation légale de retrait des contenus illicites).",
  phases: [
    { title: 'Chargement', detail: 'lecture et découpage des annonces' },
    { title: 'Modération', detail: 'un agent par lot de 20 annonces' },
    { title: 'Rapport', detail: 'fusion des signalements + rapport final' },
  ],
}

// args : { date, listingsPath } — listingsPath = fichier JSON (export de /api/listings)
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const dateLabel = A.date || ''
const listingsPath = A.listingsPath
if (!listingsPath) throw new Error('args.listingsPath requis (fichier JSON des annonces)')

const LOAD_SCHEMA = {
  type: 'object',
  properties: {
    listings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          description: { type: 'string', description: 'description tronquée à ~300 caractères' },
          seller: { type: 'string' },
          createdAt: { type: 'string' },
        },
        required: ['id', 'title'],
      },
    },
    total: { type: 'number' },
  },
  required: ['listings', 'total'],
}

const FLAGS_SCHEMA = {
  type: 'object',
  properties: {
    flags: {
      type: 'array',
      description: 'UNIQUEMENT les annonces posant problème (vide si tout est propre)',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          probleme: { type: 'string', enum: ['produit-interdit', 'arnaque-probable', 'contrefacon', 'contenu-inapproprie', 'doublon', 'donnees-personnelles', 'autre'] },
          severity: { type: 'string', enum: ['critique', 'important', 'a-verifier'] },
          reason: { type: 'string', description: 'explication courte en français' },
          action: { type: 'string', description: 'action recommandée (masquer, demander justificatif, surveiller…)' },
        },
        required: ['id', 'title', 'probleme', 'severity', 'reason', 'action'],
      },
    },
    reviewed: { type: 'number', description: 'nombre d\'annonces examinées dans ce lot' },
  },
  required: ['flags', 'reviewed'],
}

phase('Chargement')
const loaded = await agent(
  `Lis le fichier JSON ${listingsPath} avec l'outil Read (c'est l'export de l'API /listings de Chap.ci — un tableau d'annonces).
Retourne la liste compacte : pour CHAQUE annonce → id, title, price (nombre, FCFA), category (categoryId ou category), description tronquée à 300 caractères max, seller (sellerName si présent), createdAt. Ne filtre rien, ne juge rien — extraction pure. Si le fichier est très gros, traite tout quand même (Read par tranches avec offset/limit si nécessaire).`,
  { label: 'chargement', phase: 'Chargement', schema: LOAD_SCHEMA, effort: 'low' },
)
const all = loaded?.listings || []
log(`📦 ${all.length} annonce(s) à modérer`)

let report, flags = []
if (!all.length) {
  report = `# 🛡️ Modération des annonces — Chap.ci${dateLabel ? `\n**${dateLabel}**` : ''}\n\nAucune annonce à modérer (aucune annonce active sur le site).`
} else {
  phase('Modération')
  const BATCH = 20
  const batches = []
  for (let i = 0; i < all.length; i += BATCH) batches.push(all.slice(i, i + BATCH))

  const CRITERIA = `Tu es modérateur pour Chap.ci (petites annonces, Côte d'Ivoire). Examine chaque annonce du lot et signale UNIQUEMENT celles qui posent problème :
1. PRODUITS INTERDITS (severity critique) : armes/munitions, drogues, médicaments et produits pharmaceutiques, compléments alimentaires ou produits « miracle » non homologués, cosmétiques éclaircissants dangereux (réglementation AIRP), espèces protégées (ivoire, peaux…), documents officiels (passeports, diplômes), objets volés évidents.
2. CONTREFAÇONS (critique/important) : marques de luxe à prix dérisoire présentées comme authentiques, « première main » douteux.
3. ARNAQUES PROBABLES (important) : prix anormalement bas vs marché ivoirien (iPhone récent à 20 000 FCFA…), demande d'avance/acompte dans la description, redirection hors plateforme (liens, « écrivez-moi sur WhatsApp » avec paiement anticipé), incohérences grossières titre/photo/prix, promesses de gains (crypto, paris, tontines).
4. CONTENU INAPPROPRIÉ (critique) : violence, haine, sexuel, atteinte à la dignité.
5. DOUBLONS (a-verifier) : même titre + même prix répétés dans le lot.
6. DONNÉES PERSONNELLES DE TIERS (important) : annonce exposant les coordonnées de quelqu'un d'autre.
Sois MESURÉ : une annonce normale (prix plausible, description honnête) ne doit PAS être signalée. En cas de doute → severity « a-verifier ». Prix du marché ivoirien en FCFA (repères : iPhone 11 ~150k, PS4 ~140k, TV 43" ~160k, voiture correcte ≥ 2M).`

  const results = await parallel(batches.map((b, i) => () =>
    agent(`${CRITERIA}\n\nLOT ${i + 1}/${batches.length} (${b.length} annonces) :\n${JSON.stringify(b)}`,
      { label: `lot-${i + 1}`, phase: 'Modération', schema: FLAGS_SCHEMA, effort: 'medium' }),
  ))

  flags = results.filter(Boolean).flatMap((r) => r.flags || [])
  const reviewed = results.filter(Boolean).reduce((n, r) => n + (r.reviewed || 0), 0)
  log(`🛡️ ${flags.length} signalement(s) sur ${reviewed} annonce(s) examinée(s)`)

  phase('Rapport')
  const sev = { critique: '🔴', important: '🟠', 'a-verifier': '🔵' }
  const order = { critique: 0, important: 1, 'a-verifier': 2 }
  flags.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))
  const lines = flags.length
    ? flags.map((f) => `- ${sev[f.severity] || '🔵'} **${f.title}** (${f.probleme}) — ${f.reason}\n  → _${f.action}_ · [Voir l'annonce](https://chap.ci/#/annonce/${f.id})`).join('\n')
    : '✅ **Aucun problème détecté** — toutes les annonces examinées semblent conformes.'
  report = `# 🛡️ Modération des annonces — Chap.ci${dateLabel ? `\n**${dateLabel}**` : ''}

**${all.length} annonce(s) examinée(s) · ${flags.length} signalement(s)** (${flags.filter((f) => f.severity === 'critique').length} critique(s))

${lines}

---
_Pour masquer une annonce : Tableau de bord admin → Annonces → Masquer. Le retrait « prompt » des contenus illicites signalés est une obligation légale (loi n° 2013-451). Modération automatique quotidienne Chap.ci._`
}

return { report, flags, total: all.length, generatedFor: dateLabel }
