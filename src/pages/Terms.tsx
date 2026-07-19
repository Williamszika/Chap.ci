import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

const CONTACT_EMAIL = 'contact@chap.ci'
const LAST_UPDATE = '14 juillet 2026'
// Renseignez ces champs quand la société est immatriculée : ils s'affichent
// dans les mentions légales (identification complète exigée par la loi 2013-546).
const EDITOR_NAME = ''    // ex. « Chap.ci SARL »
const EDITOR_RCCM = ''    // ex. « RCCM CI-ABJ-2026-B-12345 »
const EDITOR_ADDRESS = '' // ex. « Cocody, Abidjan, Côte d'Ivoire »
const EDITOR_NCC = ''     // numéro de compte contribuable (DGI)

// Sommaire (ordinateur / tablette) : id d'ancre + libellé court.
const TOC: [string, string][] = [
  ['sec-1', '1. Objet'],
  ['sec-2', '2. Mentions légales'],
  ['sec-3', '3. Compte utilisateur'],
  ['sec-4', '4. Publication d’annonces'],
  ['sec-5', '5. Vendeurs professionnels'],
  ['sec-6', '6. Transactions entre membres'],
  ['sec-7', '7. Responsabilité'],
  ['sec-8', '8. Modération & sanctions'],
  ['sec-9', '9. Propriété intellectuelle'],
  ['sec-10', '10. Données personnelles'],
  ['sec-11', '11. Droit applicable & litiges'],
  ['sec-12', '12. Modification des CGU'],
  ['sec-13', '13. Contact'],
]

export function Terms() {
  const navigate = useNavigate()
  const [active, setActive] = useState('sec-1')

  // Surligne dans le sommaire la section actuellement à l'écran.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-88px 0px -65% 0px' },
    )
    TOC.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  // Défilement doux vers une section (HashRouter : on n'utilise pas d'ancre href).
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:max-w-3xl lg:max-w-5xl">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[#EFE6D7] bg-white/90 backdrop-blur-md px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Conditions d’utilisation</h1>
      </header>

      {/* Ordinateur / tablette : sommaire latéral + texte. Mobile : colonne unique. */}
      <div className="md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Sommaire (masqué sur mobile) */}
        <aside className="hidden md:block">
          <nav className="sticky top-20 py-6" aria-label="Sommaire">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sommaire</p>
            <div className="flex flex-col gap-0.5">
              {TOC.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={`rounded-lg px-3 py-1.5 text-left text-[13px] leading-snug transition ${
                    active === id
                      ? 'bg-primary-50 font-semibold text-primary-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Contenu */}
        <div className="mx-auto max-w-2xl px-5 py-6 md:mx-0 md:px-0">
          <div className="mb-6 flex flex-col items-center text-center md:items-start md:text-left">
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

            <Section id="sec-1" title="1. Objet">
              <p>
                Chap.ci est une plateforme de petites annonces en Côte d’Ivoire. Elle met en relation des
                vendeurs et des acheteurs particuliers ou professionnels. Chap.ci est un <b>intermédiaire
                technique</b> au sens de la <b>loi n° 2013-546 relative aux transactions électroniques</b> :
                la plateforme n’est ni vendeur, ni acheteur, et n’est <b>pas partie</b> aux transactions
                conclues entre les membres.
              </p>
            </Section>

            <Section id="sec-2" title="2. Mentions légales — éditeur et hébergeur">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>
                  <b>Éditeur du service</b> : {EDITOR_NAME || 'Chap.ci'}
                  {EDITOR_RCCM ? <>, société de droit ivoirien immatriculée au Registre du Commerce et du Crédit Mobilier sous le numéro {EDITOR_RCCM}</> : null}
                  {EDITOR_ADDRESS ? <>, dont le siège social est situé à {EDITOR_ADDRESS}</> : <>, Côte d’Ivoire</>}
                  {EDITOR_NCC ? <> — numéro de compte contribuable : {EDITOR_NCC}</> : null}.
                </li>
                <li><b>Contact</b> : <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a> (nous répondons aux demandes dans les meilleurs délais).</li>
                <li><b>Hébergeur</b> : TPE Cloud, hébergement en Côte d’Ivoire.</li>
              </ul>
              <p className="mt-2">
                Ces informations sont fournies au titre de l’obligation d’identification prévue par la
                loi n° 2013-546 relative aux transactions électroniques.
              </p>
            </Section>

            <Section id="sec-3" title="3. Compte utilisateur">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>L’inscription est réservée aux personnes <b>âgées de 18 ans ou plus</b>.</li>
                <li>Vous vous engagez à fournir des informations <b>exactes</b> (identité, coordonnées, localisation) et à les tenir à jour.</li>
                <li>Vous êtes responsable de la <b>confidentialité de votre mot de passe</b> et de toute activité réalisée depuis votre compte.</li>
                <li>Un compte est <b>personnel</b>. Sa revente ou son partage est interdit.</li>
              </ul>
            </Section>

            <Section id="sec-4" title="4. Règles de publication des annonces">
              <p>Vous êtes seul responsable du contenu que vous publiez. Il est <b>interdit</b> de publier :</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>des produits <b>illégaux</b> ou réglementés : armes, munitions, drogues, espèces protégées, documents officiels, ainsi que tout <b>médicament</b>, produit pharmaceutique, dispositif médical, complément alimentaire ou produit présenté comme ayant des vertus thérapeutiques non homologué, et tout cosmétique dangereux, <b>dépigmentant ou éclaircissant pour la peau</b> (contenant notamment de l’<b>hydroquinone</b>, du <b>mercure</b> ou des <b>corticoïdes</b>) — la vente de médicaments en ligne hors du circuit pharmaceutique agréé est interdite en Côte d’Ivoire (réglementation de l’Autorité Ivoirienne de Régulation Pharmaceutique — AIRP) ;</li>
                <li>des <b>contrefaçons</b> ou produits volés ;</li>
                <li>du contenu à caractère <b>violent, haineux, pornographique</b> ou portant atteinte à la dignité ;</li>
                <li>des annonces <b>trompeuses</b>, frauduleuses (arnaques, fausses promotions) ou des doublons ;</li>
                <li>des données personnelles de tiers sans leur accord.</li>
              </ul>
              <p className="mt-2">
                Les annonces doivent être <b>honnêtes</b> : prix réel, description fidèle, photos du bien réel.
                Les fraudes en ligne (escroquerie, usurpation d’identité, faux moyens de paiement) sont
                réprimées par la <b>loi n° 2013-451 du 19 juin 2013 relative à la lutte contre la
                cybercriminalité</b>, telle que modifiée par la loi n° 2023-593 du 7 juin 2023, et
                peuvent être signalées aux autorités compétentes (Plateforme de Lutte Contre la
                Cybercriminalité — PLCC).
              </p>
            </Section>

            <Section id="sec-5" title="5. Vendeurs professionnels">
              <p>
                Les membres qui vendent <b>à titre professionnel</b> (activité régulière et lucrative)
                doivent respecter les obligations applicables aux commerçants en Côte d’Ivoire, notamment :
                être régulièrement <b>immatriculés</b> (RCCM), respecter la{' '}
                <b>loi n° 2016-412 relative à la consommation</b> (information loyale du consommateur,
                affichage des prix, garanties), et assumer leurs obligations fiscales. Chap.ci peut demander
                des justificatifs et suspendre les comptes professionnels non conformes.
              </p>
              <p className="mt-2">
                <b>Promotions et soldes.</b> Les mentions « soldes », « promotion », les prix barrés et
                toute annonce de réduction de prix doivent respecter la réglementation ivoirienne,
                notamment le <b>décret n° 2013-167 du 6 mars 2013</b> réglementant les soldes et ventes
                promotionnelles : les soldes ne sont autorisées que pendant les périodes fixées par le
                ministère chargé du Commerce (en 2026 : du 10 au 31 mars et du 10 au 31 août) ; en dehors
                de ces périodes, toute vente promotionnelle est soumise à autorisation préalable. Toute
                annonce de réduction doit afficher clairement le prix initial et le prix réduit. Le vendeur
                est seul responsable du respect de ces règles ; Chap.ci peut retirer sans préavis toute
                annonce promotionnelle non conforme.
              </p>
              <p className="mt-2">
                <b>Droit de rétractation.</b> Pour une vente à distance conclue avec un vendeur
                <b> professionnel</b>, l’acheteur consommateur peut bénéficier d’un <b>droit de
                rétractation</b> dans les conditions et délais prévus par la <b>loi n° 2013-546 du
                30 juillet 2013 relative aux transactions électroniques</b>. Ce droit, ainsi que le
                remboursement éventuel, relèvent de la responsabilité du <b>vendeur professionnel</b>
                concerné. Chap.ci, simple <b>intermédiaire technique</b> non partie à la vente, n’en
                assure pas l’exécution.
              </p>
            </Section>

            <Section id="sec-6" title="6. Transactions entre membres">
              <p>
                Les échanges, paiements et livraisons se font <b>directement entre l’acheteur et le vendeur</b>.
                Chap.ci n’intervient pas dans la transaction et ne garantit ni la qualité, ni la conformité,
                ni la livraison des biens. Nous vous recommandons la plus grande prudence : privilégiez les
                rencontres en lieu public, vérifiez le bien avant de payer, méfiez-vous des offres
                anormalement avantageuses et <b>ne versez jamais d’avance ni d’acompte</b> (notamment par
                mobile money) sans avoir vu le produit — l’exigence d’un paiement anticipé est le schéma
                d’escroquerie le plus courant. En cas d’arnaque, signalez l’annonce dans l’application et
                déposez plainte auprès de la <b>Plateforme de Lutte Contre la Cybercriminalité (PLCC)</b>. Lorsque
                le vendeur est un professionnel, l’acheteur bénéficie des protections prévues par la loi
                n° 2016-412 relative à la consommation.
              </p>
            </Section>

            <Section id="sec-7" title="7. Responsabilité et signalement">
              <p>
                Chap.ci s’efforce d’assurer le bon fonctionnement du service mais ne peut être tenue
                responsable des <b>litiges entre membres</b>, des contenus publiés par les utilisateurs,
                d’éventuelles <b>arnaques</b>, ni des interruptions techniques. Le service est fourni « en
                l’état ». Tout contenu illicite peut être <b>signalé</b> depuis l’application ou à{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a> :
                nous le retirons promptement après vérification.
              </p>
            </Section>

            <Section id="sec-8" title="8. Modération et sanctions">
              <p>
                Nous pouvons, à tout moment et sans préavis, <b>modérer, masquer ou supprimer</b> une annonce,
                et <b>suspendre ou supprimer</b> un compte qui ne respecte pas les présentes CGU ou la loi.
              </p>
            </Section>

            <Section id="sec-9" title="9. Propriété intellectuelle">
              <p>
                La marque « Chap.ci », le logo et l’application sont protégés. En publiant une annonce, vous
                autorisez Chap.ci à afficher son contenu (textes, photos) dans le cadre du service. Vous
                garantissez détenir les droits sur les contenus que vous publiez.
              </p>
            </Section>

            <Section id="sec-10" title="10. Données personnelles">
              <p>
                Le traitement de vos données est décrit dans notre{' '}
                <a href="#/confidentialite" className="font-semibold text-primary-600">Politique de confidentialité</a>,
                qui fait partie intégrante des présentes CGU et est conforme à la{' '}
                <b>loi n° 2013-450 relative à la protection des données à caractère personnel</b>. Vous
                disposez de droits d’information, d’accès, de rectification, de suppression et d’opposition,
                et pouvez saisir l’<b>ARTCI</b> en cas de difficulté (voir cette politique).
              </p>
            </Section>

            <Section id="sec-11" title="11. Droit applicable et litiges">
              <p>
                Les présentes CGU sont régies par le <b>droit ivoirien</b>, notamment la loi n° 2013-546
                (transactions électroniques), la loi n° 2013-450 (données personnelles), la loi n° 2013-451
                (cybercriminalité) et la loi n° 2016-412 (consommation). En cas de litige, une solution
                amiable sera recherchée en priorité — les consommateurs peuvent également s’adresser aux
                associations de consommateurs ou aux services compétents du ministère chargé du Commerce ;
                à défaut, les <b>tribunaux compétents de Côte d’Ivoire</b> (Abidjan) seront saisis.
              </p>
            </Section>

            <Section id="sec-12" title="12. Modification des CGU">
              <p>
                Chap.ci peut modifier les présentes CGU pour les adapter aux évolutions du service ou de la
                loi. La version en vigueur est celle publiée dans l’application. En continuant à l’utiliser,
                vous acceptez la version mise à jour.
              </p>
            </Section>

            <Section id="sec-13" title="13. Contact">
              <p>
                Pour toute question :{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600">{CONTACT_EMAIL}</a>.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-1.5 font-display text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}
