// =============================================================================
//  Le dossier foncier, vu par l'acheteur — sous chaque annonce de vente.
//
//  Trois blocs :
//   1. le bandeau du verdict (dossier définitif / à régulariser / non sécurisé),
//   2. les contrôles à faire AVANT de payer, engendrés par les réponses du
//      vendeur — pas des généralités,
//   3. un menu dépliant qui explique les neuf documents, la réforme de 2025 et
//      les cinq arnaques les plus fréquentes.
//
//  Le rappel « Chap.ci ne vérifie pas » figure sur chacun des trois : c'est la
//  phrase qui empêche le bandeau vert de devenir un faux gage de confiance.
// =============================================================================
import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Clock, ExternalLink, Info, ShieldCheck } from 'lucide-react'
import {
  ARNAQUES, DOCS_FONCIER, DOC_PAR_ID, LIENS_VERIFICATION, NIVEAU_LIBELLE, VERDICT,
  docDeterminant, lireDocs, niveauDossier, verificationsAcheteur, type NiveauFoncier,
} from '../data/foncier'

const TON: Record<NiveauFoncier, { fond: string; texte: string; bord: string; pastille: string }> = {
  ok: {
    fond: 'bg-ivoire-green/8', texte: 'text-ivoire-green-dark', bord: 'border-ivoire-green/30',
    pastille: 'bg-ivoire-green/10 text-ivoire-green-dark ring-ivoire-green/25',
  },
  warn: {
    fond: 'bg-accent-ocre/8', texte: 'text-accent-ocre-dark', bord: 'border-accent-ocre/30',
    pastille: 'bg-accent-ocre/10 text-accent-ocre-dark ring-accent-ocre/25',
  },
  bad: {
    fond: 'bg-accent-terracotta/8', texte: 'text-accent-terracotta', bord: 'border-accent-terracotta/30',
    pastille: 'bg-accent-terracotta/10 text-accent-terracotta ring-accent-terracotta/25',
  },
}

const ICONE: Record<NiveauFoncier, typeof ShieldCheck> = {
  ok: ShieldCheck, warn: Clock, bad: AlertTriangle,
}

export function FoncierDossier({ attributes }: { attributes: Record<string, string> }) {
  const [ouvert, setOuvert] = useState(false)
  const ids = lireDocs(attributes.docs)
  const lvl = niveauDossier(ids)
  const t = TON[lvl]
  const Icone = ICONE[lvl]
  const determinant = docDeterminant(ids)
  const noms = ids.map((id) => DOC_PAR_ID[id].court).join(' · ')

  return (
    <section className="space-y-3" aria-label="Dossier foncier">
      {/* 1 — le verdict */}
      <div className={`flex gap-3 rounded-2xl border p-3.5 ${t.fond} ${t.bord} ${t.texte}`}>
        <Icone size={19} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight">
            {VERDICT[lvl].titre}
            {noms && <> · {noms}</>}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed opacity-95">
            {determinant ? determinant.desc : 'Le vendeur n’a indiqué aucun document de propriété.'}
          </p>
        </div>
      </div>

      {/* 2 — ce qu'il faut vérifier, d'après ce que le vendeur a déclaré */}
      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-gray-500">
          Avant de payer, vérifiez
        </p>
        <ul className="mt-2.5 space-y-2.5">
          {verificationsAcheteur(attributes).map((c, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-gray-700">
              <Check size={15} strokeWidth={2.5} className="mt-[3px] shrink-0 text-primary-500" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3.5 border-t border-dashed border-line2 pt-3 text-[11.5px] leading-relaxed text-gray-500">
          Ces informations sont déclarées par le vendeur. <b className="font-bold">Chap.ci ne les vérifie pas</b> et ne
          détient aucun fonds. Ne versez jamais d’argent — ni en espèces, ni par Mobile Money — avant la signature chez
          un notaire.
        </p>
      </div>

      {/* 3 — le menu dépliant : comprendre les documents fonciers */}
      <div className="overflow-hidden rounded-2xl border border-line2 bg-cream-100/50">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-bold text-gray-700"
        >
          <Info size={16} className="shrink-0 text-gray-400" />
          Comprendre les documents fonciers
          <ChevronDown
            size={17}
            className={`ml-auto shrink-0 text-gray-500 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`}
          />
        </button>

        {ouvert && (
          <div className="animate-fadeup space-y-4 border-t border-line px-4 pb-5 pt-4">
            <p className="text-[13px] leading-relaxed text-gray-600">
              Sept documents circulent couramment pour un terrain en Côte d’Ivoire. Trois seulement donnent la
              propriété ; les autres ouvrent une procédure, ou ne valent rien du tout. Voilà pourquoi le formulaire pose
              la question d’abord, et pourquoi la réponse est affichée en clair sur l’annonce.
            </p>

            <h3 className="font-display text-[15px] font-extrabold text-gray-900">
              Les documents, du plus sûr au plus risqué
            </h3>
            <ul className="space-y-2">
              {DOCS_FONCIER.map((d) => (
                <li key={d.id} className="rounded-xl border border-line bg-white p-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold leading-tight text-gray-900">{d.nom}</p>
                      <p className="mt-0.5 text-[11.5px] text-gray-500">{d.par}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ${TON[d.lvl].pastille}`}
                    >
                      {NIVEAU_LIBELLE[d.lvl]}
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">{d.desc}</p>
                </li>
              ))}
            </ul>

            <h3 className="font-display text-[15px] font-extrabold text-gray-900">Ce qui a changé en 2025</h3>
            <div className="flex gap-2.5 rounded-xl border border-line2 bg-white p-3 text-[12.5px] leading-relaxed text-gray-600">
              <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <p>
                Depuis le <b className="font-bold">1ᵉʳ janvier 2025</b>, l’
                <b className="font-bold">Attestation de Droit d’Usage coutumier (ADU)</b>, munie d’un QR code, est le
                seul document d’entrée accepté pour demander un ACD. La période de transition accordée aux détenteurs
                d’attestations villageoises déjà enregistrées s’est achevée le <b className="font-bold">31 mars 2025</b> :
                depuis cette date, une attestation villageoise n’ouvre plus de dossier. Le QR code existe précisément
                pour empêcher qu’une même parcelle soit attribuée deux fois.
              </p>
            </div>

            <h3 className="font-display text-[15px] font-extrabold text-gray-900">
              Les cinq arnaques les plus fréquentes
            </h3>
            <ul className="space-y-2">
              {ARNAQUES.map((a, i) => (
                <li key={a.titre} className="flex gap-2.5 rounded-xl border border-line bg-white p-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent-terracotta/10 text-[11px] font-extrabold tabular-nums text-accent-terracotta ring-1 ring-accent-terracotta/25">
                    {i + 1}
                  </span>
                  <div className="min-w-0 text-[12.5px] leading-relaxed text-gray-600">
                    <b className="block font-bold text-gray-900">{a.titre}</b>
                    {a.texte}
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="font-display text-[15px] font-extrabold text-gray-900">Vérifier soi-même, gratuitement</h3>
            <div className="space-y-2">
              {LIENS_VERIFICATION.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-white p-3 transition hover:border-primary-400"
                >
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px] font-bold text-gray-900">{l.titre}</b>
                    <small className="mt-0.5 block text-[12px] leading-relaxed text-gray-500">{l.texte}</small>
                  </span>
                  <ExternalLink size={16} className="shrink-0 text-gray-500" />
                </a>
              ))}
            </div>

            <p className="text-[12px] leading-relaxed text-gray-500">
              L’authenticité d’un titre foncier ou d’un ACD se contrôle à la Conservation foncière du lieu, ou par un
              notaire. L’identifiant IDUFCI d’une parcelle, lui, n’est consultable que par les professionnels
              habilités — géomètres, notaires, banques : demandez-le à votre notaire plutôt que d’essayer vous-même.
            </p>
            <p className="border-t border-line pt-3 text-[11.5px] leading-relaxed text-gray-500">
              Ce guide résume l’état du droit ivoirien tel qu’il est publié par les services de l’État. Il informe, il ne
              remplace pas un notaire.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
