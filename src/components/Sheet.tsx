import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Feuille modale qui remonte depuis le bas (style app mobile). */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fade_.2s_ease]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-app rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideup_.25s_ease]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
      <style>{`
        @keyframes slideup { from { transform: translateY(100%);} to { transform: translateY(0);} }
        @keyframes fade { from { opacity: 0;} to { opacity: 1;} }
      `}</style>
    </div>
  )
}
