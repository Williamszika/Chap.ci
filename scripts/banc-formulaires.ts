/* Banc d'essai des 82 sous-catégories.
   Ouvre chaque formulaire, coche chaque puce, et vérifie ce qui doit tenir :
   les clés, le bandeau, les blocages, les listes en cascade, les couleurs. */
import { CATEGORIES_A_SCHEMA, chargerSchema, formSous, sousDe } from '../src/data/sous/index.ts'
import { NOMS_SOUS } from '../src/data/sous/noms.ts'

// Les schémas se chargent désormais à la demande, catégorie par catégorie. Le
// banc les charge donc TOUS d'un coup avant de commencer — c'est le seul
// endroit où on veut vraiment tout en mémoire.
const DONNEES_SOUS: Record<string, any> = {}
for (const cat of CATEGORIES_A_SCHEMA) {
  const d = await chargerSchema(cat)
  if (d) DONNEES_SOUS[cat] = d
  else console.log(`  !! ${cat} : schéma introuvable`)
}

type Souci = { ou: string; quoi: string }
const soucis: Souci[] = []
const bilan: string[] = []
let nbSous = 0, nbChamps = 0, nbReq = 0, nbBandeaux = 0, nbBlocages = 0

for (const [cat, data] of Object.entries(DONNEES_SOUS)) {
  const lignes: string[] = []
  for (const sous of sousDe(cat)) {
    nbSous++
    const ou = `${cat} / ${sous}`
    const schema = data.schemas[sous]
    if (!schema) { soucis.push({ ou, quoi: 'aucun schéma' }); continue }

    // 1. Formulaire vide — il doit s'ouvrir sans exploser.
    let f = formSous(cat, sous, {})
    if (!f) { soucis.push({ ou, quoi: 'formSous renvoie null' }); continue }

    // 2. Clés uniques : deux champs de même clé s'écrasent en silence.
    const vues = new Set<string>()
    for (const c of f.fields) {
      if (vues.has(c.key)) soucis.push({ ou, quoi: `clé en double : ${c.key}` })
      vues.add(c.key)
      if (!c.label) soucis.push({ ou, quoi: `champ sans libellé : ${c.key}` })
    }

    // 3. Un choix multiple ne peut pas porter le bandeau : sa valeur est une
    //    liste, jamais la réponse unique qu'on compare — le bandeau serait
    //    éternellement rouge. Plusieurs bandeaux sont en revanche permis :
    //    ils s'empilent, l'alerte avant la réassurance.
    const multiAlerte = schema.champs.filter((c) => c.alerte && c.multi)
    if (multiAlerte.length) soucis.push({ ou, quoi: `bandeau sur un choix multiple : ${multiAlerte.map((c) => c.k).join(', ')}` })

    // 4. Cascade : la clé dont on dépend doit exister.
    for (const c of schema.champs) {
      if (c.dependDe && !schema.champs.some((x) => x.k === c.dependDe)) {
        soucis.push({ ou, quoi: `${c.k} dépend de « ${c.dependDe} », qui n'existe pas` })
      }
      if (c.dependDe && !c.table) soucis.push({ ou, quoi: `${c.k} dépend sans table` })
    }

    // 5. On coche TOUT, option par option, sur trois tours — un champ peut en
    //    faire apparaître un autre, qui en fait apparaître un troisième.
    const attrs: Record<string, string> = {}
    for (let tour = 0; tour < 3; tour++) {
      f = formSous(cat, sous, attrs)!
      for (const c of f.fields) {
        if (c.type === 'colors' || c.type === 'docs') continue
        // `formSous` rend TOUS les champs du schéma ; c'est l'écran qui masque
        // ceux dont la condition n'est pas remplie. Le banc doit faire pareil,
        // sinon il coche l'état d'une bouteille de gaz sur une vente de
        // marmites et s'étonne qu'aucun bandeau ne sorte.
        if (c.when && !c.when(attrs)) continue
        if (c.options?.length) {
          for (const o of c.options) {
            const essai = { ...attrs, [c.key]: o }
            const g = formSous(cat, sous, essai)
            if (!g) { soucis.push({ ou, quoi: `plantage sur ${c.key} = ${o}` }); continue }
            // Le bandeau doit produire un texte dès que la question a réponse.
            if (schema.champs.find((x) => x.k === c.key && x.alerte && !x.multi) && !g.bandeaux.length) {
              soucis.push({ ou, quoi: `pas de bandeau pour ${c.key} = « ${o} »` })
            }
            // Un blocage doit dire pourquoi, et quoi faire à la place.
            const bloque = schema.champs.find((x) => x.k === c.key)?.bloque
            if (bloque?.includes(o)) {
              if (!g.blocages.length) soucis.push({ ou, quoi: `« ${o} » devrait bloquer et ne bloque pas` })
              else if (g.blocages[0].length < 40) soucis.push({ ou, quoi: `motif de blocage trop court : ${g.blocages[0]}` })
            }
          }
          if (!attrs[c.key]) attrs[c.key] = c.options[0]
        } else if (c.type === 'number') {
          attrs[c.key] = '2020'
        } else if (c.type === 'toggle') {
          attrs[c.key] = 'Oui'
        } else if (!attrs[c.key]) {
          attrs[c.key] = 'Essai'
        }
      }
    }

    f = formSous(cat, sous, attrs)!
    const req = f.fields.filter((c) => c.required).length
    nbChamps += f.fields.length
    nbReq += req
    nbBandeaux += f.bandeaux.length
    const nBloc = schema.champs.filter((c) => c.bloque?.length).length
    nbBlocages += nBloc

    // 6. Les couleurs : une palette annoncée doit exister.
    if (f.couleurs && !f.palette.length) soucis.push({ ou, quoi: 'couleurs demandées, palette vide' })
    if (!f.couleurs && !f.sansCouleur) soucis.push({ ou, quoi: 'ni couleurs ni phrase de remplacement' })

    lignes.push(
      `    ${sous.padEnd(30)} ${String(f.fields.length).padStart(2)} champs · ${String(req).padStart(2)} obligatoires` +
      ` · ${f.bandeaux.length ? `${f.bandeaux.length} bandeau ` : '—        '} · ${f.couleurs ? `${f.palette.length} teintes` : 'sans couleur'}` +
      (nBloc ? ` · ${nBloc} blocage(s)` : ''),
    )
  }
  bilan.push(`  ${cat}`)
  bilan.push(...lignes)
}

// La liste des noms (chargée au démarrage par l'accueil) doit dire exactement
// la même chose que les schémas (chargés à la demande). Si les deux divergent,
// une sous-catégorie devient soit inatteignable, soit sans formulaire — et
// personne ne s'en aperçoit avant qu'un vendeur ne tombe dessus.
for (const [cat, data] of Object.entries(DONNEES_SOUS)) {
  const noms = NOMS_SOUS[cat] ?? []
  const dansSchema = (data as any).sous as string[]
  if (JSON.stringify(noms) !== JSON.stringify(dansSchema)) {
    soucis.push({ ou: cat, quoi: `noms.ts et le schéma divergent :\n      noms.ts = ${JSON.stringify(noms)}\n      schéma  = ${JSON.stringify(dansSchema)}` })
  }
}
for (const cat of Object.keys(NOMS_SOUS)) {
  if (!DONNEES_SOUS[cat]) soucis.push({ ou: cat, quoi: 'présente dans noms.ts mais sans schéma chargeable' })
}

console.log(bilan.join('\n'))
console.log(`\n  ${nbSous} sous-catégories · ${nbChamps} champs · ${nbReq} obligatoires`)
console.log(`  ${nbBandeaux} bandeaux · ${nbBlocages} champs bloquants`)
if (soucis.length) {
  console.log(`\n  ${soucis.length} SOUCIS :`)
  for (const s of soucis) console.log(`    ${s.ou} — ${s.quoi}`)
  process.exit(1)
}
console.log('\n  Aucun souci.')
