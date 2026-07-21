import { checkPassword, passwordColor } from '../lib/password'

/** Jauge de robustesse + rappel des exigences manquantes. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const { score, label, missing, ok } = checkPassword(value)

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? passwordColor(score) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${ok ? 'text-ivoire-green-dark' : 'text-gray-500'}`}>
        {ok ? `Mot de passe ${label.toLowerCase()} ✓` : `Ajoutez : ${missing.join(', ')}`}
      </p>
    </div>
  )
}
