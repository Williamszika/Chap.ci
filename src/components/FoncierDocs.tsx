// =============================================================================
//  Choix des documents fonciers détenus par le vendeur.
//
//  Cases à cocher, pas boutons radio : un vendeur détient rarement une seule
//  pièce — une ADU et la lettre d'attribution vont souvent ensemble. Chaque
//  document coché ouvre son propre champ « numéro », obligatoire, parce qu'un
//  numéro affiché sur l'annonce se vérifie.
//
//  « Aucun document » est exclusif dans les deux sens : le cocher décoche le
//  reste, cocher un vrai document le fait sauter.
// =============================================================================
import { AlertTriangle, Check, Clock, ShieldCheck, Info } from 'lucide-react'
import {
  DOC_PAR_ID, NIVEAU_LIBELLE, cleNumero, docsDeZone, ecrireDocs, lireDocs,
  type NiveauFoncier,
} from '../data/foncier'

/** Couleurs par niveau — distinctes de l'orange de marque, qui ne sert qu'aux commandes. */
const TON: Record<NiveauFoncier, { rail: string; pastille: string; bord: string; fond: string; case_: string }> = {
  ok: {
    rail: 'bg-ivoire-green', pastille: 'bg-ivoire-green/10 text-ivoire-green-dark ring-ivoire-green/25',
    bord: 'border-ivoire-green ring-1 ring-ivoire-green', fond: 'bg-white',
    case_: 'border-ivoire-green bg-ivoire-green text-white',
  },
  warn: {
    rail: 'bg-accent-ocre', pastille: 'bg-accent-ocre/10 text-accent-ocre-dark ring-accent-ocre/25',
    bord: 'border-accent-ocre ring-1 ring-accent-ocre', fond: 'bg-white',
    case_: 'border-accent-ocre bg-accent-ocre text-white',
  },
  bad: {
    rail: 'bg-accent-terracotta', pastille: 'bg-accent-terracotta/10 text-accent-terracotta ring-accent-terracotta/25',
    bord: 'border-accent-terracotta ring-1 ring-accent-terracotta', fond: 'bg-white',
    case_: 'border-accent-terracotta bg-accent-terracotta text-white',
  },
}

const ICONE: Record<NiveauFoncier, typeof ShieldCheck> = {
  ok: ShieldCheck, warn: Clock, bad: AlertTriangle,
}

export function FoncierDocs({
  attrs,
  setAttr,
}: {
  attrs: Record<string, string>
  setAttr: (k: string, v: string) => void
}) {
  const choisis = lireDocs(attrs.docs)
  const liste = docsDeZone(attrs.zone)

  function basculer(id: string) {
    let suivant: string[]
    if (choisis.includes(id)) {
      suivant = choisis.filter((x) => x !== id)
    } else if (id === 'aucun') {
      suivant = ['aucun']
    } else {
      suivant = [...choisis.filter((x) => x !== 'aucun'), id]
    }
    // Les numéros des documents décochés n'ont plus de raison d'être.
    for (const ancien of choisis) {
      if (!suivant.includes(ancien)) setAttr(cleNumero(ancien), '')
    }
    setAttr('docs', ecrireDocs(suivant))
  }

  const avecNumero = choisis.filter((id) => DOC_PAR_ID[id]?.numLabel)

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {liste.map((d) => {
          const on = choisis.includes(d.id)
          const t = TON[d.lvl]
          const Icone = ICONE[d.lvl]
          return (
            <label
              key={d.id}
              className={`relative block cursor-pointer overflow-hidden rounded-xl border py-3 pl-[18px] pr-3 transition ${
                on ? `${t.bord} ${t.fond}` : 'border-line2 bg-cream-100/50 hover:border-line2'
              }`}
            >
              <span className={`absolute inset-y-0 left-0 w-[5px] ${t.rail}`} aria-hidden="true" />
              <input
                type="checkbox"
                checked={on}
                onChange={() => basculer(d.id)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-md border-[1.6px] transition ${
                    on ? t.case_ : 'border-line2 bg-white text-transparent'
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-tight text-gray-900">{d.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-gray-500">{d.par}</span>
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ${t.pastille}`}
                >
                  <Icone size={11} /> {NIVEAU_LIBELLE[d.lvl]}
                </span>
              </span>
              <span className="mt-1.5 block pl-[31px] text-[13px] leading-relaxed text-gray-600">{d.desc}</span>
            </label>
          )
        })}
      </div>

      {avecNumero.map((id) => {
        const d = DOC_PAR_ID[id]
        return (
          <div key={id} className="space-y-1.5">
            <label htmlFor={`fonc-${id}`} className="block text-[13.5px] font-semibold text-gray-700">
              {d.numLabel} <span className="font-bold text-primary-600">· obligatoire</span>
            </label>
            <input
              id={`fonc-${id}`}
              className="input"
              maxLength={60}
              value={attrs[cleNumero(id)] ?? ''}
              onChange={(e) => setAttr(cleNumero(id), e.target.value)}
              placeholder={d.numPh}
            />
          </div>
        )
      })}
      {avecNumero.length > 0 && (
        <p className="text-xs text-gray-500">Un numéro affiché sur l’annonce rassure, parce qu’il se vérifie.</p>
      )}

      {attrs.zone !== 'Zone rurale (domaine coutumier)' && (
        <div className="flex gap-2.5 rounded-xl border border-line2 bg-cream-100/60 p-3 text-[13px] leading-relaxed text-gray-600">
          <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <p>
            Le statut d’un lotissement — approuvé, annulé ou en sursis — se vérifie gratuitement sur le{' '}
            <a
              href="https://construction.gouv.ci/mclulotissement/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-600 underline underline-offset-2"
            >
              portail du MCLU
            </a>
            . Votre acheteur le fera : autant le faire avant lui.
          </p>
        </div>
      )}
    </div>
  )
}
