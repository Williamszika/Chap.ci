import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { phpProEntonnoir, type ProEntonnoir } from '../lib/php'
import { formatPrice } from '../lib/format'

/**
 * « Statistiques de vente » — comprendre, pas seulement compter
 * (maquette validée par le Patron le 27/08).
 *
 * Un total de vues ne dit rien à faire. Le chemin de l'acheteur — vues,
 * favoris, contacts, ventes — montre OÙ l'on perd les gens, et c'est
 * exactement ce qu'on peut corriger : la photo, le prix, le délai de réponse.
 */

const ETAPES = [
  { cle: 'vues' as const, emoji: '👁️', label: 'Vues' },
  { cle: 'favoris' as const, emoji: '❤️', label: 'Favoris' },
  { cle: 'contacts' as const, emoji: '💬', label: 'Contacts' },
  { cle: 'ventes' as const, emoji: '🤝', label: 'Ventes' },
]

/** Les heures montrées : avant 6 h, personne ne regarde une annonce. */
const H_DEBUT = 6
const H_FIN = 23

function pct(n: number, sur: number): number {
  return sur > 0 ? Math.round((n / sur) * 100) : 0
}

/**
 * Où ça coince : la marche la plus basse de l'escalier. On ne rend qu'un seul
 * conseil — trois conseils à la fois, personne n'en applique aucun.
 */
function conseil(e: ProEntonnoir['entonnoir']): { titre: string; texte: string } | null {
  if (e.vues < 20) {
    return {
      titre: 'Trop tôt pour conclure',
      texte: 'Il faut une vingtaine de vues avant que ces chiffres veuillent dire quelque chose. '
        + 'Publiez, partagez vos annonces, et revenez dans quelques jours.',
    }
  }
  const tFav = pct(e.favoris, e.vues)
  const tCon = pct(e.contacts, Math.max(e.favoris, 1))
  const tVen = pct(e.ventes, Math.max(e.contacts, 1))
  if (tFav < 3) {
    return {
      titre: 'Où ça coince chez vous',
      texte: `${e.vues} personnes ont vu vos annonces et seulement ${e.favoris} les ont enregistrées. `
        + 'C’est la première photo et le prix qui décident à cet instant : une photo nette, en plein '
        + 'jour, et un prix affiché changent ce chiffre plus que tout le reste.',
    }
  }
  if (tCon < 25 && e.favoris > 0) {
    return {
      titre: 'Où ça coince chez vous',
      texte: `${e.favoris} personnes enregistrent l’annonce mais n’écrivent pas. `
        + 'Un prix affiché « à débattre », une photo de plus ou une description qui répond d’avance '
        + '(état, livraison, garantie) débloquent souvent ce passage.',
    }
  }
  if (tVen < 20 && e.contacts > 0) {
    return {
      titre: 'Où ça coince chez vous',
      texte: `${e.contacts} personnes vous ont écrit, ${e.ventes} `
        + `${e.ventes > 1 ? 'ventes ont été conclues' : 'vente a été conclue'}. `
        + 'Le délai de réponse est ce qui se joue ici : au-delà de 24 h, l’acheteur a écrit à quelqu’un d’autre.',
    }
  }
  return {
    titre: 'Rien ne coince',
    texte: 'Votre chemin se tient de bout en bout. Pour vendre plus, il faut maintenant plus de vues : '
      + 'publiez davantage, ou mettez une annonce à la une.',
  }
}

export function StatsPro() {
  const [periode, setPeriode] = useState<7 | 30>(7)
  const [d, setD] = useState<ProEntonnoir | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let actif = true
    setD(null); setErr('')
    phpProEntonnoir(periode)
      .then((r) => actif && setD(r))
      .catch((e) => actif && setErr((e as Error).message))
    return () => { actif = false }
  }, [periode])

  if (err) {
    return <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-gray-600 shadow-card">{err}</div>
  }
  if (!d) {
    return <div className="grid min-h-[30vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
  }

  const e = d.entonnoir
  const c = conseil(e)
  const heures = d.heures.slice(H_DEBUT, H_FIN + 1)
  const maxH = Math.max(1, ...heures)
  const totalH = heures.reduce((s, n) => s + n, 0)
  const meilleure = totalH > 0 ? H_DEBUT + heures.indexOf(maxH) : null

  return (
    <div className="space-y-4">
      {/* Période — deux fenêtres, pas douze. */}
      <div className="flex justify-end">
        <div className="flex rounded-xl border border-line2 bg-white p-0.5 text-xs font-bold shadow-card">
          {([[7, '7 jours'], [30, '30 jours']] as [7 | 30, string][]).map(([p, lab]) => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`rounded-lg px-3 py-1.5 transition ${periode === p ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500'}`}>
              {lab}
            </button>
          ))}
        </div>
      </div>

      {/* LE CHEMIN DE L'ACHETEUR */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
        <p className="font-display text-[15px] font-extrabold text-ink">Le chemin de l’acheteur</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Ce que {formatPrice(e.vues)} vue{e.vues > 1 ? 's' : ''} sont devenues, {periode === 7 ? 'cette semaine' : 'ce mois-ci'}
        </p>

        <div className="mt-3 space-y-2">
          {ETAPES.map((et, i) => {
            const n = e[et.cle]
            const largeur = e.vues > 0 ? Math.max(n > 0 ? 8 : 2, Math.round((n / e.vues) * 100)) : 2
            // Le pourcentage de droite, c'est le passage DEPUIS l'étape
            // précédente — la marche qu'on vient de monter, pas le total.
            const prec = i === 0 ? 0 : e[ETAPES[i - 1].cle]
            const passage = i === 0 ? null : pct(n, prec)
            return (
              <div key={et.cle} className="flex items-center gap-2.5">
                <span className="w-[74px] shrink-0 text-[11.5px] font-bold text-gray-600">
                  {et.emoji} {et.label}
                </span>
                <span className="h-6 flex-1 overflow-hidden rounded-lg bg-cream-100">
                  <span
                    className={`flex h-full items-center justify-end rounded-lg px-2 text-[11.5px] font-extrabold text-white ${
                      // Deux séries, donc deux couleurs : les ventes en vert,
                      // le reste en orange. Elles étaient toutes deux vertes
                      // depuis que `primary-500` vaut #009E60, et les barres
                      // ne se distinguaient plus les unes des autres.
                      et.cle === 'ventes' ? 'bg-ivoire-green' : 'bg-gradient-to-r from-action-500 to-action-700'}`}
                    style={{ width: `${largeur}%`, minWidth: n > 0 ? '2.2rem' : undefined }}>
                    {formatPrice(n)}
                  </span>
                </span>
                <span className="tnum w-9 shrink-0 text-right text-[10.5px] text-gray-400">
                  {passage === null ? '' : `${passage} %`}
                </span>
              </div>
            )
          })}
        </div>

        {c && (
          <div className="mt-3 rounded-xl bg-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600">
            <b className="text-ink">{c.titre} :</b> {c.texte}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* VOS MEILLEURES HEURES */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
          <p className="font-display text-[15px] font-extrabold text-ink">Vos meilleures heures</p>
          <p className="mt-0.5 text-xs text-gray-500">Quand les acheteurs regardent</p>
          {totalH === 0 ? (
            <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600">
              Ce graphique se remplit à partir d’aujourd’hui : l’heure des vues n’était pas
              enregistrée avant. Comptez quelques jours avant qu’il dise quelque chose.
            </p>
          ) : (
            <>
              <div className="mt-3 flex h-16 items-end gap-[3px]">
                {heures.map((n, i) => {
                  const h = H_DEBUT + i
                  const haut = Math.max(4, Math.round((n / maxH) * 100))
                  const fort = n === maxH
                  return (
                    <span key={h} title={`${h} h · ${n} vue${n > 1 ? 's' : ''}`}
                      className={`flex-1 rounded-t ${fort ? 'bg-primary-700' : n > maxH * 0.6 ? 'bg-primary-500' : n > 0 ? 'bg-primary-300' : 'bg-cream-100'}`}
                      style={{ height: `${haut}%` }} />
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span>
              </div>
              {meilleure !== null && (
                <p className="mt-2 text-[11.5px] text-gray-600">
                  Publiez vers <b className="text-ink">{meilleure} h</b> : c’est là qu’on vous voit le plus.
                </p>
              )}
            </>
          )}
        </section>

        {/* D'OÙ VIENNENT VOS ACHETEURS */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
          <p className="font-display text-[15px] font-extrabold text-ink">D’où viennent vos acheteurs</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Communes · {periode} derniers jours
          </p>
          {d.communes.length === 0 ? (
            <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600">
              Personne ne vous a encore écrit ni enregistré d’annonce sur cette période — ou vos
              acheteurs n’ont pas renseigné leur commune.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {d.communes.map((c2) => (
                <div key={c2.nom}>
                  <div className="flex justify-between text-[11.5px] text-gray-700">
                    <span className="min-w-0 truncate">{c2.nom}</span>
                    <b className="tnum shrink-0">{c2.pct} %</b>
                  </div>
                  <span className="mt-1 block h-[5px] overflow-hidden rounded-full bg-cream-100">
                    <span className="block h-full rounded-full bg-primary-500" style={{ width: `${c2.pct}%` }} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed text-gray-400">
        Chiffres réels de votre compte · le pourcentage à droite de chaque barre est le passage
        depuis l’étape du dessus
      </p>
    </div>
  )
}
