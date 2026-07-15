export const meta = {
  name: 'audit-securite',
  description: "Audit sécurité mensuel de Chap.ci : agents spécialisés qui relisent le backend PHP (injections, authz), le frontend React (XSS, stockage), les dépendances (npm audit) et la configuration, puis vérifient chaque faille avant de la rapporter",
  whenToUse: "1×/mois — le site traite des données personnelles (enjeu ARTCI), un piratage serait une catastrophe.",
  phases: [
    { title: 'Audit', detail: '4 agents spécialisés (en parallèle)' },
    { title: 'Vérification', detail: 'contre-expertise des failles trouvées' },
    { title: 'Rapport', detail: 'synthèse priorisée' },
  ],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const dateLabel = A.date || ''
const root = A.root || '.'

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    findings: {
      type: 'array',
      description: 'UNIQUEMENT les vrais problèmes de sécurité (vide si rien)',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          file: { type: 'string', description: 'fichier:ligne concerné' },
          severity: { type: 'string', enum: ['critique', 'haute', 'moyenne', 'basse'] },
          description: { type: 'string', description: 'la faille + scénario d\'attaque concret' },
          fix: { type: 'string', description: 'correction recommandée, concrète' },
        },
        required: ['title', 'file', 'severity', 'description', 'fix'],
      },
    },
    checked: { type: 'string', description: 'ce qui a été vérifié et trouvé sain (résumé court)' },
  },
  required: ['domain', 'findings', 'checked'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    real: { type: 'boolean', description: 'true si la faille est réelle et exploitable' },
    reason: { type: 'string' },
    severityAdjusted: { type: 'string', enum: ['critique', 'haute', 'moyenne', 'basse'] },
  },
  required: ['real', 'reason'],
}

const CONTEXT = `Contexte : Chap.ci, marketplace ivoirienne. Backend = server/index.php (PHP 8, PDO, JWT maison, SMTP maison, hébergement mutualisé cPanel). Frontend = React 18 + TypeScript + Vite (dossier src/), tokens en localStorage (clés chapci.php.*), déployé en statique. Racine du dépôt : ${root}.
IMPORTANT : rapporte UNIQUEMENT des failles réelles et exploitables avec un scénario d'attaque concret — pas de recommandations théoriques génériques ni de « best practices » sans impact démontré. Si un domaine est sain, dis-le (findings = []).`

phase('Audit')
log('🔒 Audit sécurité : backend, frontend, dépendances, configuration')

const [backend, frontend, deps, config] = await parallel([
  () => agent(`${CONTEXT}
Tu es auditeur sécurité BACKEND. Lis ${root}/server/index.php (fichier long : lis-le par tranches avec offset/limit, en ENTIER) et cherche :
- injections SQL (requêtes non préparées, concaténation), y compris dans les ORDER BY/LIMIT
- contrôles d'autorisation manquants (un utilisateur peut-il lire/modifier les données d'un autre ? chaque route qui prend un id vérifie-t-elle le propriétaire ?)
- failles d'authentification (JWT : algorithme, expiration, secret par défaut « CHANGEZ-MOI » encore actif ?), réinitialisation de mot de passe, 2FA contournable
- uploads de fichiers (type/taille vérifiés ? exécution possible ?), header injection dans les emails, SSRF, chemins de fichiers non filtrés (téléchargement de backups !), divulgation d'infos dans les erreurs
- endpoints cron : la clé est-elle comparée en temps constant ? des données sensibles fuient-elles ?`,
    { label: 'audit:backend', phase: 'Audit', schema: FINDINGS_SCHEMA, effort: 'high' }),
  () => agent(`${CONTEXT}
Tu es auditeur sécurité FRONTEND. Explore ${root}/src/ (Grep/Read) et cherche :
- XSS : usages de dangerouslySetInnerHTML, injection de contenu utilisateur non échappé (titres/descriptions d'annonces, messages, avis), URLs javascript:
- données sensibles exposées : secrets/clés committés dans le code, tokens loggés en console, données personnelles d'autres utilisateurs envoyées au client alors qu'elles devraient rester serveur (ex. numéros de téléphone des vendeurs dans les réponses API affichées)
- validation côté client uniquement là où le serveur devrait valider
- liens externes sans rel="noopener", redirections ouvertes.`,
    { label: 'audit:frontend', phase: 'Audit', schema: FINDINGS_SCHEMA, effort: 'high' }),
  () => agent(`${CONTEXT}
Tu es auditeur des DÉPENDANCES. Depuis ${root} : lance « npm audit --json » (Bash) et analyse le résultat ; regarde aussi package.json pour les versions très en retard sur des paquets critiques (react, vite, react-router). Pour chaque vulnérabilité réelle : gravité, paquet, si le site est concrètement exposé (une CVE dans un outil de build n'a pas le même impact qu'une CVE runtime), et la commande de correction. Ignore le bruit (vulnérabilités dev-only sans impact).`,
    { label: 'audit:dependances', phase: 'Audit', schema: FINDINGS_SCHEMA, effort: 'medium' }),
  () => agent(`${CONTEXT}
Tu es auditeur CONFIGURATION/INFRASTRUCTURE. Vérifie :
- ${root}/server/config.php et ${root}/server/index.php : secrets par défaut encore en place (jwt_secret « CHANGEZ-MOI », cron_key committée en clair dans le dépôt — évalue le risque réel), mots de passe en dur
- ${root}/dist/ ou la racine : fichiers sensibles qui partiraient dans le zip de déploiement (backups, .env, config avec secrets)
- en-têtes de sécurité du site en ligne : lance « curl -sS -D - -o /dev/null https://chap.ci/ » (Bash) et évalue CSP, X-Frame-Options, HSTS, X-Content-Type-Options — en tenant compte qu'un hébergement mutualisé cPanel limite les options (proposer .htaccess si utile)
- le dossier api/backups est-il protégé d'un accès web direct ?`,
    { label: 'audit:config', phase: 'Audit', schema: FINDINGS_SCHEMA, effort: 'high' }),
])

const all = [backend, frontend, deps, config].filter(Boolean)
const rawFindings = all.flatMap((a) => (a.findings || []).map((f) => ({ ...f, domain: a.domain })))
log(`🔎 ${rawFindings.length} problème(s) potentiel(s) — contre-expertise en cours`)

phase('Vérification')
const verified = rawFindings.length
  ? await parallel(rawFindings.map((f) => () =>
      agent(`Tu es contre-expert sécurité, sceptique. Un audit de Chap.ci (racine ${root}) affirme :
« ${f.title} » — ${f.description} (fichier : ${f.file})
VÉRIFIE toi-même dans le code (Read/Grep) si cette faille est RÉELLE et EXPLOITABLE. Cherche les protections que le premier auditeur aurait manquées (vérification faite ailleurs, middleware, échappement en amont…). En cas de doute sérieux → real=false. Ajuste la sévérité si besoin.`,
        { label: `verif:${f.title.slice(0, 30)}`, phase: 'Vérification', schema: VERDICT_SCHEMA, effort: 'high' })
        .then((v) => ({ ...f, real: v?.real ?? false, verifNote: v?.reason || '', severity: v?.severityAdjusted || f.severity }))))
  : []

const confirmed = verified.filter(Boolean).filter((f) => f.real)
const rejected = rawFindings.length - confirmed.length
log(`✅ ${confirmed.length} faille(s) confirmée(s), ${rejected} écartée(s) par la contre-expertise`)

phase('Rapport')
const sev = { critique: '🔴', haute: '🟠', moyenne: '🟡', basse: '🔵' }
const order = { critique: 0, haute: 1, moyenne: 2, basse: 3 }
confirmed.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4))

const findingsMd = confirmed.length
  ? confirmed.map((f, i) => `### ${i + 1}. ${sev[f.severity]} [${f.severity.toUpperCase()}] ${f.title}
**Où :** \`${f.file}\` · **Domaine :** ${f.domain}
**Problème :** ${f.description}
**Correction :** ${f.fix}
_Contre-expertise : ${f.verifNote}_`).join('\n\n')
  : '✅ **Aucune faille exploitable confirmée ce mois-ci.**'

const sains = all.map((a) => `- **${a.domain}** : ${a.checked}`).join('\n')

const report = `# 🔒 Audit sécurité mensuel — Chap.ci${dateLabel ? `\n**${dateLabel}**` : ''}

**${confirmed.length} faille(s) confirmée(s)** (${confirmed.filter((f) => f.severity === 'critique').length} critique(s)) · ${rejected} fausse(s) alerte(s) écartée(s) par contre-expertise.

## Failles confirmées

${findingsMd}

## Ce qui a été vérifié et trouvé sain

${sains}

---
_Audit automatique mensuel (4 auditeurs + contre-expertise systématique). Les corrections critiques/hautes doivent être appliquées rapidement — demandez-les dans une session interactive. Généré par le moteur de sécurité Chap.ci._`

return { report, findings: confirmed, rejected, generatedFor: dateLabel }
