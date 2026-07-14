import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '14 juillet 2026'
// Renseignez ici l'immatriculation de l'entreprise quand elle est disponible
// (ex. « RCCM CI-ABJ-2026-B-12345 ») : elle s'affichera dans les mentions légales.
const EDITOR_RCCM = ''

export function Terms() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:max-w-3xl">
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
              technique</b> au sens de la <b>loi n° 2013-546 relative aux transactions électroniques</b> :
              la plateforme n’est ni vendeur, ni acheteur, et n’est <b>pas partie</b> aux transactions
              conclues entre les membres.
            </p>
          </Section>

          <Section title="2. Mentions légales — éditeur et hébergeur">
            <ul className="ml-4 list-disc space-y-1.5">
              <li><b>Éditeur du service</b> : Chap.ci{EDITOR_RCCM ? <> — {EDITOR_RCCM}</> : null}, Côte d’Ivoire.</li>
              <li><b>Contact</b> : <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a> (nous répondons aux demandes dans les meilleurs délais).</li>
              <li><b>Hébergeur</b> : TPE Cloud, hébergement en Côte d’Ivoire.</li>
            </ul>
            <p className="mt-2">
              Ces informations sont fournies au titre de l’obligation d’identification prévue par la
              loi n° 2013-546 relative aux transactions électroniques.
            </p>
          </Section>

          <Section title="3. Compte utilisateur">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>L’inscription est réservée aux personnes <b>âgées de 18 ans ou plus</b>.</li>
              <li>Vous vous engagez à fournir des informations <b>exactes</b> (identité, coordonnées, localisation) et à les tenir à jour.</li>
              <li>Vous êtes responsable de la <b>confidentialité de votre mot de passe</b> et de toute activité réalisée depuis votre compte.</li>
              <li>Un compte est <b>personnel</b>. Sa revente ou son partage est interdit.</li>
            </ul>
          </Section>

          <Section title="4. Règles de publication des annonces">
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
              Les fraudes en ligne (escroquerie, usurpation d’identité, faux moyens de paiement) sont
              réprimées par la <b>loi n° 2013-451 relative à la lutte contre la cybercriminalité</b> et
              peuvent être signalées aux autorités compétentes (Plateforme de Lutte Contre la
              Cybercriminalité — PLCC).
            </p>
          </Section>

          <Section title="5. Vendeurs professionnels">
            <p>
              Les membres qui vendent <b>à titre professionnel</b> (activité régulière et lucrative)
              doivent respecter les obligations applicables aux commerçants en Côte d’Ivoire, notamment :
              être régulièrement <b>immatriculés</b> (RCCM), respecter la{' '}
              <b>loi n° 2016-412 relative à la consommation</b> (information loyale du consommateur,
              affichage des prix, garanties), et assumer leurs obligations fiscales. Chap.ci peut demander
              des justificatifs et suspendre les comptes professionnels non conformes.
            </p>
          </Section>

          <Section title="6. Transactions entre membres">
            <p>
              Les échanges, paiements et livraisons se font <b>directement entre l’acheteur et le vendeur</b>.
              Chap.ci n’intervient pas dans la transaction et ne garantit ni la qualité, ni la conformité,
              ni la livraison des biens. Nous vous recommandons la prudence : privilégiez les rencontres en
              lieu public, vérifiez le bien avant de payer, et méfiez-vous des offres trop belles. Lorsque
              le vendeur est un professionnel, l’acheteur bénéficie des protections prévues par la loi
              n° 2016-412 relative à la consommation.
            </p>
          </Section>

          <Section title="7. Responsabilité et signalement">
            <p>
              Chap.ci s’efforce d’assurer le bon fonctionnement du service mais ne peut être tenue
              responsable des <b>litiges entre membres</b>, des contenus publiés par les utilisateurs,
              d’éventuelles <b>arnaques</b>, ni des interruptions techniques. Le service est fourni « en
              l’état ». Tout contenu illicite peut être <b>signalé</b> depuis l’application ou à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a> :
              nous le retirons promptement après vérification.
            </p>
          </Section>

          <Section title="8. Modération et sanctions">
            <p>
              Nous pouvons, à tout moment et sans préavis, <b>modérer, masquer ou supprimer</b> une annonce,
              et <b>suspendre ou supprimer</b> un compte qui ne respecte pas les présentes CGU ou la loi.
            </p>
          </Section>

          <Section title="9. Propriété intellectuelle">
            <p>
              La marque « Chap.ci », le logo et l’application sont protégés. En publiant une annonce, vous
              autorisez Chap.ci à afficher son contenu (textes, photos) dans le cadre du service. Vous
              garantissez détenir les droits sur les contenus que vous publiez.
            </p>
          </Section>

          <Section title="10. Données personnelles">
            <p>
              Le traitement de vos données est décrit dans notre{' '}
              <a href="#/confidentialite" className="font-semibold text-primary-600">Politique de confidentialité</a>,
              qui fait partie intégrante des présentes CGU et est conforme à la{' '}
              <b>loi n° 2013-450 relative à la protection des données à caractère personnel</b>. Vous
              disposez de droits d’information, d’accès, de rectification, de suppression et d’opposition,
              et pouvez saisir l’<b>ARTCI</b> en cas de difficulté (voir cette politique).
            </p>
          </Section>

          <Section title="11. Droit applicable et litiges">
            <p>
              Les présentes CGU sont régies par le <b>droit ivoirien</b>, notamment la loi n° 2013-546
              (transactions électroniques), la loi n° 2013-450 (données personnelles), la loi n° 2013-451
              (cybercriminalité) et la loi n° 2016-412 (consommation). En cas de litige, une solution
              amiable sera recherchée en priorité — les consommateurs peuvent également s’adresser aux
              associations de consommateurs ou aux services compétents du ministère chargé du Commerce ;
              à défaut, les <b>tribunaux compétents de Côte d’Ivoire</b> (Abidjan) seront saisis.
            </p>
          </Section>

          <Section title="12. Modification des CGU">
            <p>
              Chap.ci peut modifier les présentes CGU pour les adapter aux évolutions du service ou de la
              loi. La version en vigueur est celle publiée dans l’application. En continuant à l’utiliser,
              vous acceptez la version mise à jour.
            </p>
          </Section>

          <Section title="13. Contact">
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
