import './StatusBadge.css'

type StatusBadgeProps = {
  label: string
  variant?: 'neutral' | 'normal' | 'attention' | 'critical'
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
