import { Link } from 'react-router-dom'
import { Mail, Trash2, UserCog, ShieldCheck } from 'lucide-react'

// Page PUBLIQUE de demande de suppression de compte.
//
// Elle existe pour une raison précise : Google Play exige, pour toute application
// permettant de créer un compte, une page web où l'on peut demander la suppression
// du compte ET des données — accessible SANS installer l'application et SANS être
// connecté. Le chemin de suppression existait déjà dans Chap.ci, mais uniquement
// derrière la connexion, dans « Mon compte » : cela ne répondait pas à l'exigence.
//
// L'URL à déclarer dans la Play Console est : https://chap.ci/#/suppression-compte
const CONTACT_EMAIL = 'contact@chap.ci'
const APP_ID = 'ci.chap.app'

/** Ce qui disparaît, et ce qui doit légalement rester. Honnêteté avant tout. */
const SUPPRIME = [
  'Votre compte et vos identifiants de connexion',
  'Votre nom, votre adresse e-mail et votre numéro de téléphone',
  'Vos annonces, leurs photos et leurs descriptions',
  'Vos conversations et vos messages',
  'Vos favoris, vos recherches enregistrées et vos centres d’intérêt',
  'Vos avis et vos notes',
]

const CONSERVE = [
  'Les journaux techniques de sécurité (adresses IP, tentatives de connexion), conservés au maximum 12 mois, comme l’impose la lutte contre la fraude',
  'Les données rendues anonymes, qui ne permettent plus de vous identifier (comptage de visites, par exemple)',
]

export function DeleteAccount() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-line bg-white px-4 pb-4 pt-6 md:-mx-6 md:px-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-[26px]">
          Supprimer mon compte
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Application Chap.ci ({APP_ID}) et site chap.ci — comment demander la
          suppression de votre compte et de vos données.
        </p>
      </header>

      <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6 md:py-8">
        <p className="txt-legible text-[15px] leading-relaxed text-gray-700">
          Vous pouvez faire supprimer votre compte à tout moment, sans avoir à vous
          justifier. Deux chemins s’offrent à vous : le premier est immédiat, le second
          ne demande qu’un e-mail.
        </p>

        {/* Chemin 1 — depuis le compte */}
        <section className="mt-6 rounded-2xl border border-line2 bg-white p-5">
          <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <UserCog size={18} className="text-primary-600" /> 1. Depuis votre compte
            <span className="ml-auto rounded-full bg-ivoire-green/10 px-2.5 py-0.5 text-[11px] font-semibold text-ivoire-green-dark">
              immédiat
            </span>
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-gray-700">
            <li>Connectez-vous sur l’application ou sur chap.ci.</li>
            <li>Ouvrez <b>Mon compte</b>.</li>
            <li>
              Descendez jusqu’à <b>Supprimer mon compte</b> et confirmez.
            </li>
          </ol>
          <Link
            to="/compte"
            className="btn-primary mt-4 inline-flex h-11 items-center gap-2 px-4 text-sm"
          >
            <Trash2 size={16} /> Aller à mon compte
          </Link>
        </section>

        {/* Chemin 2 — par e-mail, sans connexion */}
        <section className="mt-4 rounded-2xl border border-line2 bg-white p-5">
          <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Mail size={18} className="text-primary-600" /> 2. Par e-mail
            <span className="ml-auto rounded-full bg-accent-sable/30 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
              sous 30 jours
            </span>
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-700">
            Si vous n’avez plus accès à votre compte, écrivez à{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Suppression de mon compte Chap.ci')}`}
              className="font-semibold text-primary-600 underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            depuis l’adresse liée au compte, avec pour objet «&nbsp;Suppression de mon
            compte&nbsp;». Nous traitons la demande sous <b>30 jours</b> au plus et vous
            confirmons par retour d’e-mail.
          </p>
        </section>

        {/* Ce qui est supprimé / conservé */}
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Ce qui est supprimé
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-gray-700">
            {SUPPRIME.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <h2 className="mt-5 font-display text-lg font-bold text-ink">
            Ce qui est conservé, et pourquoi
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-gray-700">
            {CONSERVE.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-cream px-4 py-3 text-[13px] leading-relaxed text-gray-700">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ivoire-green-dark" />
          <span>
            La suppression est <b>définitive</b> : vos annonces et vos messages ne
            peuvent pas être rétablis. Pour le détail de vos droits, consultez notre{' '}
            <Link
              to="/confidentialite"
              className="font-semibold text-primary-600 underline underline-offset-2"
            >
              politique de confidentialité
            </Link>
            .
          </span>
        </p>
      </div>
    </div>
  )
}
