// =============================================================================
//  Bascules de fonctionnalités (feature flags).
// =============================================================================

/**
 * Connexion / inscription par téléphone (code SMS).
 *
 * Désactivée pour le moment : l'envoi de SMS en Côte d'Ivoire nécessite une
 * passerelle (Orange / TPE Cloud / Twilio) avec un Sender ID enregistré, pas
 * encore en place. Le code (onglet Téléphone, OTP, backend) reste intact — il
 * suffit de repasser cette valeur à `true` puis de rebuilder pour le rouvrir.
 */
export const PHONE_LOGIN_ENABLED = false
