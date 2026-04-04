'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export const Toggle = ({ checked, onChange, disabled = false, label }: ToggleProps) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-[var(--ac)]' : 'bg-[var(--s4)]'}
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}
        `}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}
