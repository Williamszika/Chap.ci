import { useEffect, useState } from 'react'
import { mediaUrl } from '../lib/native'
import { Link, useParams } from 'react-router-dom'
import { Megaphone, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { fetchAd, fetchAdStats, type Ad, type AdStats } from '../lib/ads'
import { AdImageFill } from '../components/AdImageFill'
import { AdStatsChart } from '../components/AdStatsChart'

const nb = (x: number) => x.toLocaleString('fr-FR')

/** Page d'une publicité (clic sur une pub sans lien externe). */
export function AdDetail() {
  const { id } = useParams()
  const [ad, setAd] = useState<Ad | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  // Chiffres de la campagne : le serveur ne les rend QU'À son annonceur (ou à
  // un administrateur). Pour tout autre visiteur l'appel échoue, et la page
  // reste ce qu'elle est — une page de publicité, pas un tableau de bord.
  const [stats, setStats] = useState<AdStats | null>(null)

  useEffect(() => {
    let alive = true
    if (!id) { setState('missing'); return }
    fetchAd(id)
      .then((a) => { if (alive) { setAd(a); setState('ok') } })
      .catch(() => { if (alive) setState('missing') })
    fetchAdStats(id).then((s) => { if (alive) setStats(s) }).catch(() => {})
    return () => { alive = false }
  }, [id])

  if (state === 'loading') {
    return (
      <div className="grid min-h-[50vh] place-items-center text-gray-500">
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  if (state === 'missing' || !ad) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-4xl">📺</div>
        <p className="font-display text-lg font-bold text-ink">Publicité introuvable ou expirée</p>
        <p className="text-sm text-gray-500">Cette campagne n’est plus à l’écran.</p>
        <Link to="/" className="btn-primary mt-2">Retour à l’accueil</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-4 md:px-6">
      {/* Écran noir : visuel principal — ici on montre le visuel EN ENTIER. */}
      <div className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-3xl bg-black text-white shadow-card-lg md:min-h-[340px]">
        {ad.images[0] && <AdImageFill src={ad.images[0]} className="!object-contain" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="relative p-5 md:p-7">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider backdrop-blur">
            <Megaphone size={12} /> Publicité
          </span>
          {ad.title && (
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight md:text-3xl">{ad.title}</h1>
          )}
        </div>
      </div>

      {/* Visuels supplémentaires */}
      {ad.images.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {ad.images.slice(1).map((img, i) => (
            <img key={i} src={mediaUrl(img)} alt="" className="h-40 w-full rounded-2xl object-cover md:h-52" />
          ))}
        </div>
      )}

      {/* Description */}
      {ad.description && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">{ad.description}</p>
        </div>
      )}

      {ad.link && (
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn-primary mt-4 w-full py-3.5 text-base"
        >
          Visiter le site <ArrowRight size={18} />
        </a>
      )}

      {/* ---- Espace annonceur : visible UNIQUEMENT par le propriétaire ------ */}
      {stats && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[15px] font-extrabold text-ink">📊 Votre campagne</span>
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-gray-500">
              visible par vous seul
            </span>
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              [nb(stats.views), 'affichages'],
              [nb(stats.clicks), 'clics'],
              [`${String(stats.ctr).replace('.', ',')} %`, 'de clics'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-cream-100 px-2 py-3 text-center">
                <p className="tnum font-display text-lg font-extrabold leading-none text-ink">{v}</p>
                <p className="mt-1 text-[11px] text-gray-500">{l}</p>
              </div>
            ))}
          </div>

          {stats.expiresAt && (
            <p className="mt-3 text-[12.5px] text-gray-600">
              {stats.status === 'active' && stats.expiresAt > Date.now() ? (
                <>À l’écran jusqu’au{' '}
                  <b>{new Date(stats.expiresAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b>.
                </>
              ) : (
                <>Campagne terminée le{' '}
                  <b>{new Date(stats.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</b>.
                </>
              )}
            </p>
          )}

          <AdStatsChart
            className="mt-3"
            data={stats.parJour.map((p) => ({ day: p.day, views: Number(p.views), clicks: Number(p.clicks) }))}
          />

          {/* Prolonger : uniquement tant que la bannière est réellement à l'écran. */}
          {stats.status === 'active' && stats.expiresAt && stats.expiresAt > Date.now() ? (
            <>
              <Link to={`/publicite?prolonger=${encodeURIComponent(stats.id)}`} className="btn-primary mt-4 w-full py-3">
                <RefreshCw size={17} /> Prolonger ma publicité
              </Link>
              <p className="mt-1.5 text-center text-[11.5px] leading-relaxed text-gray-400">
                Les jours achetés s’ajoutent à votre date de fin : aucune coupure d’affichage,
                aucun jour déjà payé n’est perdu.
              </p>
            </>
          ) : (
            <Link to="/publicite" className="btn-outline mt-4 w-full py-3">
              <Megaphone size={16} /> Relancer une campagne
            </Link>
          )}
        </section>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        Contenu publicitaire fourni par l’annonceur.{' '}
        <Link to="/publicite" className="font-semibold text-primary-600">Vous aussi, affichez-vous ici</Link>
      </p>
    </div>
  )
}
