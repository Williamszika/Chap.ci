import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '13 juillet 2026'

export function Terms() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Conditions d’utilisation</h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mark size={48} />
          <Wordmark className="mt-2 text-xl text-ink" />
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary-600">
            <ScrollText size={16} /> Conditions Générales d’Utilisation
          </p>
          <p className="text-xs text-gray-400">Dernière mise à jour : {LAST_UPDATE}</p>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-gray-700">
          <p>
            Bienvenue sur Chap.ci. En créant un compte ou en utilisant l’application, vous acceptez
            sans réserve les présentes Conditions Générales d’Utilisation (« CGU »). Si vous ne les
            acceptez pas, n’utilisez pas l’application.
          </p>

          <Section title="1. Objet">
            <p>
              Chap.ci est une plateforme de petites annonces en Côte d’Ivoire. Elle met en relation des
              vendeurs et des acheteurs particuliers ou professionnels. Chap.ci est un <b>intermédiaire
              technique</b> : la plateforme n’est ni vendeur, ni acheteur, et n’est <b>pas partie</b> aux
              transactions conclues entre les membres.
            </p>
          </Section>

          <Section title="2. Compte utilisateur">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>L’inscription est réservée aux personnes <b>âgées de 18 ans ou plus</b>.</li>
              <li>Vous vous engagez à fournir des informations <b>exactes</b> (identité, coordonnées, localisation) et à les tenir à jour.</li>
              <li>Vous êtes responsable de la <b>confidentialité de votre mot de passe</b> et de toute activité réalisée depuis votre compte.</li>
              <li>Un compte est <b>personnel</b>. Sa revente ou son partage est interdit.</li>
            </ul>
          </Section>

          <Section title="3. Règles de publication des annonces">
            <p>Vous êtes seul responsable du contenu que vous publiez. Il est <b>interdit</b> de publier :</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>des produits <b>illégaux</b> ou réglementés : armes, munitions, drogues, médicaments, espèces protégées, documents officiels ;</li>
              <li>des <b>contrefaçons</b> ou produits volés ;</li>
              <li>du contenu à caractère <b>violent, haineux, pornographique</b> ou portant atteinte à la dignité ;</li>
              <li>des annonces <b>trompeuses</b>, frauduleuses (arnaques, fausses promotions) ou des doublons ;</li>
              <li>des données personnelles de tiers sans leur accord.</li>
            </ul>
            <p className="mt-2">
              Les annonces doivent être <b>honnêtes</b> : prix réel, description fidèle, photos du bien réel.
            </p>
          </Section>

          <Section title="4. Transactions entre membres">
            <p>
              Les échanges, paiements et livraisons se font <b>directement entre l’acheteur et le vendeur</b>.
              Chap.ci n’intervient pas dans la transaction et ne garantit ni la qualité, ni la conformité,
              ni la livraison des biens. Nous vous recommandons la prudence : privilégiez les rencontres en
              lieu public, vérifiez le bien avant de payer, et méfiez-vous des offres trop belles.
            </p>
          </Section>

          <Section title="5. Responsabilité">
            <p>
              Chap.ci s’efforce d’assurer le bon fonctionnement du service mais ne peut être tenue
              responsable des <b>litiges entre membres</b>, des contenus publiés par les utilisateurs,
              d’éventuelles <b>arnaques</b>, ni des interruptions techniques. Le service est fourni « en
              l’état ».
            </p>
          </Section>

          <Section title="6. Modération et sanctions">
            <p>
              Nous pouvons, à tout moment et sans préavis, <b>modérer, masquer ou supprimer</b> une annonce,
              et <b>suspendre ou supprimer</b> un compte qui ne respecte pas les présentes CGU ou la loi.
            </p>
          </Section>

          <Section title="7. Propriété intellectuelle">
            <p>
              La marque « Chap.ci », le logo et l’application sont protégés. En publiant une annonce, vous
              autorisez Chap.ci à afficher son contenu (textes, photos) dans le cadre du service. Vous
              garantissez détenir les droits sur les contenus que vous publiez.
            </p>
          </Section>

          <Section title="8. Données personnelles">
            <p>
              Le traitement de vos données est décrit dans notre{' '}
              <a href="#/confidentialite" className="font-semibold text-primary-600">Politique de confidentialité</a>,
              qui fait partie intégrante des présentes CGU. Vous disposez de droits d’accès, de
              rectification et de suppression de vos données (voir cette politique).
            </p>
          </Section>

          <Section title="9. Droit applicable et litiges">
            <p>
              Les présentes CGU sont régies par le <b>droit ivoirien</b>. En cas de litige, une solution
              amiable sera recherchée en priorité ; à défaut, les tribunaux compétents de Côte d’Ivoire
              seront saisis.
            </p>
          </Section>

          <Section title="10. Modification des CGU">
            <p>
              Chap.ci peut modifier les présentes CGU pour les adapter aux évolutions du service ou de la
              loi. La version en vigueur est celle publiée dans l’application. En continuant à l’utiliser,
              vous acceptez la version mise à jour.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Pour toute question :{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 font-display text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}
