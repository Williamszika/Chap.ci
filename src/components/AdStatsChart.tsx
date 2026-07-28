import { useMemo, useState } from 'react'

export interface AdStatsPoint {
  /** Jour au format ISO court : « 2026-07-28 ». */
  day: string
  views: number
  clicks: number
}

/** « 2026-07-28 » → « lun. 28 juil. » (sans dépendance de date). */
function jourCourt(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Nombre lisible : 1 240 plutôt que 1240. */
const n = (x: number) => x.toLocaleString('fr-FR')

/**
 * Lecture automatique du graphique — la partie « intelligente ».
 *
 * Un annonceur ne lit pas trente barres : il veut savoir si ça monte, quel jour
 * a marché, et si son argent travaille. On calcule donc, en une phrase : la
 * tendance (seconde moitié de la période contre la première), le meilleur jour,
 * et le taux de clic moyen. Rien d'inventé : uniquement ce que les chiffres
 * disent — et on se tait quand la période est trop courte pour dire quoi que ce
 * soit d'honnête.
 */
function lecture(data: AdStatsPoint[]): string[] {
  if (data.length < 2) return []
  const out: string[] = []
  const vues = data.map((p) => p.views)
  const total = vues.reduce((a, b) => a + b, 0)
  if (total === 0) return []

  // Tendance : on compare les deux moitiés de la période, à nombre de jours égal.
  const moitie = Math.floor(data.length / 2)
  if (moitie >= 2) {
    const avant = vues.slice(0, moitie).reduce((a, b) => a + b, 0) / moitie
    const apres = vues.slice(data.length - moitie).reduce((a, b) => a + b, 0) / moitie
    if (avant > 0) {
      const ecart = Math.round((apres / avant - 1) * 100)
      if (ecart >= 10) out.push(`📈 En hausse : +${ecart} % d’affichages sur les ${moitie} derniers jours.`)
      else if (ecart <= -10) out.push(`📉 En baisse : ${ecart} % d’affichages sur les ${moitie} derniers jours.`)
      else out.push('➡️ Audience stable d’un jour à l’autre.')
    }
  }

  // Meilleur jour — utile pour choisir quand relancer une campagne.
  const best = data.reduce((a, b) => (b.views > a.views ? b : a))
  if (best.views > 0) out.push(`⭐ Meilleur jour : ${jourCourt(best.day)} — ${n(best.views)} affichages.`)

  const clics = data.reduce((a, b) => a + b.clicks, 0)
  if (clics > 0) {
    const ctr = Math.round((clics / total) * 1000) / 10
    out.push(`👆 ${n(clics)} clic${clics > 1 ? 's' : ''} — ${String(ctr).replace('.', ',')} % des affichages.`)
  } else {
    out.push('👆 Aucun clic pour l’instant : un titre plus direct ou un visuel plus lisible aide beaucoup.')
  }
  return out
}

/**
 * Graphique d'audience d'une publicité — affichages et clics, jour par jour.
 *
 * Deux bandes plutôt qu'une seule à deux échelles : les clics valent quelques
 * pour cent des affichages, tracés sur la même échelle ils seraient invisibles,
 * et sur une seconde échelle superposée ils mentiraient sur leur ampleur. Deux
 * bandes alignées sur le même axe des jours disent la vérité sans tromper l'œil.
 *
 * Tout est en CSS : aucune bibliothèque de graphiques (elles pèsent plus lourd
 * que toute l'application), et l'affichage reste net sur un téléphone d'entrée
 * de gamme.
 */
export function AdStatsChart({ data, className = '' }: { data: AdStatsPoint[]; className?: string }) {
  const [sel, setSel] = useState<number | null>(null)

  const { maxV, maxC, notes } = useMemo(() => ({
    maxV: Math.max(1, ...data.map((p) => p.views)),
    maxC: Math.max(1, ...data.map((p) => p.clicks)),
    notes: lecture(data),
  }), [data])

  if (data.length === 0) {
    return (
      <p className={`rounded-xl bg-cream-100 px-4 py-6 text-center text-sm text-gray-500 ${className}`}>
        Aucun chiffre pour l’instant — les affichages apparaissent ici dès le premier jour de diffusion.
      </p>
    )
  }

  const p = sel != null ? data[sel] : data[data.length - 1]
  const ctrJour = p.views > 0 ? Math.round((p.clicks / p.views) * 1000) / 10 : 0

  return (
    <div className={className}>
      {/* Légende du jour pointé : sur téléphone, une infobulle flottante se lit
          mal et se ferme au moindre geste — on affiche donc la valeur ici. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[13px] font-semibold text-gray-700">
          {jourCourt(p.day)}
          {sel == null && <span className="ml-1 font-normal text-gray-400">(dernier jour)</span>}
        </p>
        <p className="tnum text-[13px] text-gray-500">
          <b className="text-ink">{n(p.views)}</b> affichages · <b className="text-ink">{n(p.clicks)}</b> clic{p.clicks > 1 ? 's' : ''}
          {p.views > 0 && <> · {String(ctrJour).replace('.', ',')} %</>}
        </p>
      </div>

      {/* Bande 1 — affichages */}
      <div className="mt-2 flex h-28 items-end gap-[3px]" role="img" aria-label={`Affichages par jour, du ${jourCourt(data[0].day)} au ${jourCourt(data[data.length - 1].day)}`}>
        {data.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setSel(i === sel ? null : i)}
            onMouseEnter={() => setSel(i)}
            aria-label={`${jourCourt(d.day)} : ${n(d.views)} affichages, ${n(d.clicks)} clics`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              style={{ height: `${Math.max(2, (d.views / maxV) * 100)}%` }}
              className={`block w-full rounded-t-[3px] transition-colors ${
                i === sel ? 'bg-primary-600' : 'bg-primary-400 group-hover:bg-primary-500'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Bande 2 — clics (échelle propre, indiquée) */}
      <div className="mt-1 flex h-10 items-end gap-[3px]">
        {data.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setSel(i === sel ? null : i)}
            onMouseEnter={() => setSel(i)}
            tabIndex={-1}
            aria-hidden
            className="group flex h-full flex-1 items-end"
          >
            <span
              style={{ height: d.clicks > 0 ? `${Math.max(8, (d.clicks / maxC) * 100)}%` : '2px' }}
              className={`block w-full rounded-t-[3px] transition-colors ${
                i === sel ? 'bg-ivoire-green-dark' : d.clicks > 0 ? 'bg-ivoire-green group-hover:bg-ivoire-green-dark' : 'bg-line2'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
        <span>{jourCourt(data[0].day)}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary-400" /> affichages</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-ivoire-green" /> clics</span>
        </span>
        <span>{jourCourt(data[data.length - 1].day)}</span>
      </div>
      <p className="mt-1 text-center text-[10.5px] text-gray-400">
        Les deux bandes ont leur propre échelle (max. {n(maxV)} affichages · {n(maxC)} clic{maxC > 1 ? 's' : ''}).
      </p>

      {notes.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-cream-100 px-3.5 py-3 text-[12.5px] leading-relaxed text-gray-600">
          {notes.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
    </div>
  )
}
