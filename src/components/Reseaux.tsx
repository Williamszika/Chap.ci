import { Facebook, Instagram, Youtube, Linkedin, Globe, Send, ExternalLink } from 'lucide-react'
import { RESEAUX, lisible, reseauxPresents, type ReseauId, type Reseaux } from '../data/reseaux'

/**
 * LES RÉSEAUX SOCIAUX SUR LA PAGE VENDEUR (05/09/2026).
 *
 * Deux pièces : la rangée de boutons aux couleurs des marques, sous
 * « Contacter », et la liste de l'onglet « À propos » qui écrit l'adresse en
 * clair — l'acheteur voit où il va avant d'y aller. Tous les liens sortent en
 * `nofollow noopener` : un lien posé par un vendeur ne porte pas la voix du
 * site auprès des moteurs, et n'a pas la main sur l'onglet d'où il part.
 */

const TRAIT = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}

/** L'icône d'un réseau — celle de lucide quand elle existe, la nôtre sinon. */
export function IconeReseau({ id, size = 16, className }: { id: ReseauId; size?: number; className?: string }) {
  const p = { size, className, strokeWidth: 2, 'aria-hidden': true }
  switch (id) {
    case 'facebook': return <Facebook {...p} />
    case 'instagram': return <Instagram {...p} />
    case 'youtube': return <Youtube {...p} />
    case 'linkedin': return <Linkedin {...p} />
    case 'telegram': return <Send {...p} />
    case 'site': return <Globe {...p} />
    case 'tiktok':
      // La note de musique, au trait de lucide : reconnaissable dans une
      // pastille noire qui dit « TikTok ».
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...TRAIT}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      )
    case 'x':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...TRAIT} strokeWidth={2.4}>
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      )
    case 'snapchat':
      // Le fantôme, plein : sur le jaune Snapchat, un trait fin disparaît.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M12 2c-4.2 0-6.4 3-6.4 6.5v2.6c-.8.3-1.7.2-2.4-.2-.4-.2-.9.2-.7.6.5 1 1.6 1.6 2.6 1.9-.3 1.3-1.5 2.6-3.2 3.1-.4.1-.5.6-.1.8.9.5 2 .6 2.6.8.2.5.2 1.2.6 1.4.6.2 1.5-.3 2.6-.1 1.4.3 2.3 1.8 4.4 1.8s3-1.5 4.4-1.8c1.1-.2 2 .3 2.6.1.4-.2.4-.9.6-1.4.6-.2 1.7-.3 2.6-.8.4-.2.3-.7-.1-.8-1.7-.5-2.9-1.8-3.2-3.1 1-.3 2.1-.9 2.6-1.9.2-.4-.3-.8-.7-.6-.7.4-1.6.5-2.4.2V8.5C18.4 5 16.2 2 12 2z" />
        </svg>
      )
  }
}

/** La rangée de boutons, sous « Contacter » : une pastille par réseau, à la couleur de la marque. */
export function PillesReseaux({ reseaux, nom }: { reseaux?: Reseaux | null; nom: string }) {
  const presents = reseauxPresents(reseaux)
  if (presents.length === 0) return null
  return (
    <section className="px-4 pb-4" aria-label={`Retrouvez ${nom} sur ses réseaux`}>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
        Retrouvez {nom} sur
      </p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {presents.map(([d, url]) => (
          <a
            key={d.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={lisible(url)}
            style={{ background: d.fond, color: d.encre }}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-3 pr-4 text-[12.5px] font-extrabold shadow-[0_5px_14px_-7px_rgba(0,0,0,0.55)] transition hover:brightness-110 active:scale-95"
          >
            <IconeReseau id={d.id} size={16} /> {d.nom}
          </a>
        ))}
      </div>
    </section>
  )
}

/** La liste de l'onglet « À propos » : le réseau, et l'adresse écrite en clair. */
export function ListeReseaux({ reseaux }: { reseaux?: Reseaux | null }) {
  const presents = reseauxPresents(reseaux)
  if (presents.length === 0) return null
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-display text-base font-bold text-ink">Réseaux et site</h2>
      <ul className="divide-y divide-line">
        {presents.map(([d, url]) => (
          <li key={d.id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 py-2.5 transition hover:bg-cream-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: d.fond, color: d.encre }}>
                <IconeReseau id={d.id} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink">{d.nom}</span>
                <span className="block truncate text-[11.5px] text-gray-500">{lisible(url)}</span>
              </span>
              <ExternalLink size={14} className="shrink-0 text-gray-300" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Les neuf champs de la fiche professionnelle. Le parent tient l'état. */
export function ChampsReseaux({ valeurs, onChange }: {
  valeurs: Record<string, string>
  onChange: (id: ReseauId, valeur: string) => void
}) {
  return (
    <div className="space-y-1.5">
      {RESEAUX.map((d) => (
        <label key={d.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 ring-1 ring-line focus-within:ring-primary-400">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: d.fond, color: d.encre }}>
            <IconeReseau id={d.id} size={15} />
          </span>
          <span className="w-[72px] shrink-0 text-[12px] font-bold text-ink">{d.nom}</span>
          <input
            value={valeurs[d.id] ?? ''}
            onChange={(e) => onChange(d.id, e.target.value)}
            placeholder={d.placeholder}
            maxLength={200}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={d.nom}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-300"
          />
        </label>
      ))}
    </div>
  )
}
