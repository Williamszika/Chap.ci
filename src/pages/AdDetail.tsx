import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Megaphone, ArrowRight, Loader2 } from 'lucide-react'
import { fetchAd, type Ad } from '../lib/ads'
import { AdImageFill } from '../components/AdImageFill'

/** Page d'une publicité (clic sur une pub sans lien externe). */
export function AdDetail() {
  const { id } = useParams()
  const [ad, setAd] = useState<Ad | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')

  useEffect(() => {
    let alive = true
    if (!id) { setState('missing'); return }
    fetchAd(id)
      .then((a) => { if (alive) { setAd(a); setState('ok') } })
      .catch(() => { if (alive) setState('missing') })
    return () => { alive = false }
  }, [id])

  if (state === 'loading') {
    return (
      <div className="grid min-h-[50vh] place-items-center text-gray-400">
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
      {/* Écran noir : visuel principal */}
      <div className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-3xl bg-black text-white shadow-card-lg md:min-h-[340px]">
        {ad.images[0] && <AdImageFill src={ad.images[0]} />}
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
            <img key={i} src={img} alt="" className="h-40 w-full rounded-2xl object-cover md:h-52" />
          ))}
        </div>
      )}

      {/* Description */}
      {ad.description && (
        <div className="mt-4 rounded-2xl border border-[#EFE6D7] bg-white p-5 shadow-card">
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

      <p className="mt-6 text-center text-xs text-gray-400">
        Contenu publicitaire fourni par l’annonceur.{' '}
        <Link to="/publicite" className="font-semibold text-primary-600">Vous aussi, affichez-vous ici</Link>
      </p>
    </div>
  )
}
