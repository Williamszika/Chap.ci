import { useEffect, useRef } from 'react'
import { useToast } from '../store/ToastContext'
import { isNative } from '../lib/native'

/**
 * Coquille « native » (Android / iOS via Capacitor). Ne fait RIEN sur le web.
 *
 * - Barre de statut : non superposée, fond crème, icônes sombres (Style.Light =
 *   texte sombre sur fond clair) → lisible en plein soleil.
 * - Écran de démarrage : masqué dès que l'app est prête.
 * - Bouton retour matériel Android : recule dans l'historique de l'app ; quand il
 *   n'y a plus rien derrière, 2 appuis rapprochés pour quitter (évite les sorties
 *   accidentelles). Sans ce câblage, le bouton retour fermait l'app à chaque appui.
 *
 * Les plugins sont importés dynamiquement : aucun poids ajouté au bundle web.
 */
export function NativeShell() {
  const toast = useToast()
  const exitArmed = useRef(false)

  useEffect(() => {
    if (!isNative) return
    let remove = () => {}
    let cancelled = false

    ;(async () => {
      const [{ App }, statusBar, splash] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
      ])
      if (cancelled) return
      const { StatusBar, Style } = statusBar
      const { SplashScreen } = splash

      try {
        await StatusBar.setOverlaysWebView({ overlay: false })
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#FFFDF9' })
      } catch {
        /* iOS ne gère pas setBackgroundColor : sans gravité. */
      }
      try {
        await SplashScreen.hide()
      } catch {
        /* déjà masqué. */
      }

      const sub = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
        } else if (exitArmed.current) {
          App.exitApp()
        } else {
          exitArmed.current = true
          toast.show('Appuyez encore pour quitter Chap.ci')
          window.setTimeout(() => {
            exitArmed.current = false
          }, 2000)
        }
      })
      remove = () => {
        void sub.remove()
      }
    })()

    return () => {
      cancelled = true
      remove()
    }
    // toast est stable (mémoïsé dans le provider) : effet monté une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
