import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'
import { Mark } from './Logo'
import { useLocalStorage } from '../lib/useLocalStorage'
import { isNative } from '../lib/native'
import { canInstall, subscribeInstall, promptInstall, isStandalone, isIOS } from '../lib/pwaInstall'

/**
 * Bannière « 📲 Installer l'application » : propose d'ajouter Chap.ci à l'écran
 * d'accueil (PWA). Les visiteurs obtiennent une vraie app, sans passer par le
 * Play Store — utile tout de suite, en attendant la publication officielle.
 *
 * Ne s'affiche PAS si : on est déjà dans l'app native (Capacitor), l'app est
 * déjà installée (mode standalone), la bannière a été fermée, ou le navigateur
 * ne propose pas l'installation (et ce n'est pas un iPhone).
 */
export function InstallAppBanner() {
  const [ready, setReady] = useState(canInstall())
  const [dismissed, setDismissed] = useLocalStorage('chapci.pwa.dismissed.v1', false)
  const [iosHelp, setIosHelp] = useState(false)
  const ios = isIOS()

  useEffect(() => subscribeInstall(() => setReady(canInstall())), [])

  // Rien à afficher dans ces cas.
  if (isNative || isStandalone() || dismissed) return null
  // Android : uniquement si le navigateur a proposé l'installation. iOS : toujours
  // (on montre les instructions manuelles, faute de prompt automatique).
  if (!ready && !ios) return null

  async function install() {
    if (ios) {
      setIosHelp((v) => !v)
      return
    }
    const res = await promptInstall()
    if (res === 'accepted') setDismissed(true)
  }

  return (
    <section className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl border border-ivoire-green/25 bg-white p-4 shadow-card">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-gray-400 transition md:hover:bg-gray-100 md:hover:text-gray-600"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ivoire-green/10">
            <Mark size={28} />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <p className="font-display text-base font-black leading-tight text-ink">
              Installez l’app Chap.ci 📲
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              Accès direct depuis votre écran d’accueil, comme une vraie app — gratuit.
            </p>
          </div>
          <button
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ivoire-green px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95"
          >
            <Download size={16} /> Installer
          </button>
        </div>

        {/* iOS : instructions manuelles (Safari ne permet pas l'installation auto). */}
        {ios && iosHelp && (
          <div className="mt-3 rounded-xl bg-cream-200 px-3.5 py-3 text-sm text-gray-700">
            Sur iPhone : appuyez sur{' '}
            <Share size={15} className="mx-0.5 -mt-0.5 inline text-ivoire-green-dark" />{' '}
            <b>Partager</b>, puis{' '}
            <span className="whitespace-nowrap">
              <Plus size={15} className="mx-0.5 -mt-0.5 inline text-ivoire-green-dark" />
              <b>Sur l’écran d’accueil</b>
            </span>.
          </div>
        )}
      </div>
    </section>
  )
}
