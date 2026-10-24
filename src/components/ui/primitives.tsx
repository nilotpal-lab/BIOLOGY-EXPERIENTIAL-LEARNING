import { HelpCircle, Info } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import {
  ROLE_PROVENANCE_LABEL,
  SOURCE_STATUS_LABEL,
  SOURCE_STATUS_TONE,
  TROPHIC_ROLE_LABEL,
  type MetricValue,
  type RoleProvenance,
  type SourceStatus,
  type StatusTone,
  type TrophicRole,
} from '../../core/types'
import { formatConnectance, formatPercent } from '../../core/metrics'
import { cn } from './cn'
export { cn } from './cn'

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-[#074735] disabled:bg-primary/40 font-semibold shadow-xs',
  secondary:
    'bg-secondary text-white hover:bg-[#1A7779] active:bg-[#146061] disabled:bg-secondary/40 font-semibold shadow-xs',
  outline:
    'border border-line bg-surface text-fg hover:border-primary hover:text-primary active:bg-surface-2 disabled:opacity-50 shadow-xs',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40',
  danger: 'bg-danger text-white hover:bg-[#962F37] active:bg-[#7D262D] disabled:bg-danger/40 font-semibold shadow-xs',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'outline',
  size = 'md',
  icon,
  block,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors',
        'disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1.5 text-[13px]' : 'px-3.5 py-2 text-sm',
        block && 'w-full',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon ? <span aria-hidden="true" className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  )
}

/** Icon-only button. An accessible name is mandatory. */
export function IconButton({
  label,
  icon,
  className,
  ...rest
}: Omit<ButtonProps, 'children' | 'icon'> & { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-line bg-surface',
        'text-fg-muted transition-colors hover:border-primary hover:text-primary hover:bg-surface-2 disabled:opacity-40 shadow-2xs',
        // Expand the touch target to ~44px without growing the visible button.
        "after:absolute after:-inset-1.5 after:content-['']",
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'aside'
}) {
  return <Tag className={cn('fwg-card p-4 sm:p-5', className)}>{children}</Tag>
}

export function CardHeading({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          {icon ? <span aria-hidden="true" className="text-primary">{icon}</span> : null}
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-[13px] leading-snug text-fg-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'highlight'
  | 'danger'
  | StatusTone

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-surface-2 text-fg-muted',
  primary: 'border-primary/25 bg-primary-soft text-primary font-medium',
  secondary: 'border-secondary/25 bg-secondary-soft text-secondary font-medium',
  highlight: 'border-highlight/25 bg-highlight-soft text-highlight font-medium',
  danger: 'border-danger/25 bg-danger-soft text-danger font-medium',
  demo: 'border-highlight/25 bg-highlight-soft text-highlight font-medium',
  pending: 'border-line bg-surface-muted text-fg-faint',
  warning: 'border-highlight/25 bg-highlight-soft text-highlight font-medium',
  verified: 'border-success/25 bg-success-soft text-success font-medium',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: SourceStatus }) {
  return (
    <Badge
      tone={SOURCE_STATUS_TONE[status]}
      title={
        status === 'illustrative-demo'
          ? 'Illustrative demo data — simplified for software demonstration; not a verified empirical food-web dataset.'
          : 'Research status as recorded in this dataset’s provenance.'
      }
    >
      {SOURCE_STATUS_LABEL[status]}
    </Badge>
  )
}

export function RoleBadge({
  role,
  evidence,
}: {
  role: TrophicRole
  evidence?: RoleProvenance
}) {
  return (
    <Badge tone="neutral" title={evidence ? `Trophic role ${ROLE_PROVENANCE_LABEL[evidence].toLowerCase()}` : undefined}>
      {TROPHIC_ROLE_LABEL[role]}
      {evidence && evidence !== 'documented' ? ` · ${ROLE_PROVENANCE_LABEL[evidence]}` : ''}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                              */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  required,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 flex items-center gap-1 text-[12px] font-medium text-fg-muted">
        {label}
        {required ? <span className="text-highlight">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-snug text-fg-faint">{hint}</span> : null}
    </label>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('fwg-field w-full px-3 py-2 text-sm outline-none', className)}
      {...rest}
    />
  )
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('fwg-field w-full px-3 py-2 text-sm outline-none', className)}
      {...rest}
    />
  )
}

export function SelectInput({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('fwg-field w-full px-3 py-2 text-sm outline-none', className)} {...rest}>
      {children}
    </select>
  )
}

/* -------------------------------------------------------------------------- */
/* Informational helpers                                                      */
/* -------------------------------------------------------------------------- */

/** Metric with an immediately accessible definition (Prompt §19). */
export function HelpHint({ text, label }: { text: string; label?: string }) {
  return (
    <span
      className="relative inline-flex cursor-help items-center text-fg-faint hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary after:absolute after:-inset-3 after:content-['']"
      title={text}
      role="note"
      aria-label={label ? `${label}: ${text}` : text}
      tabIndex={0}
    >
      <HelpCircle size={13} aria-hidden="true" />
    </span>
  )
}

export function Callout({
  tone = 'info',
  title,
  children,
  icon,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success'
  title?: ReactNode
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  const tones = {
    info: 'border-line bg-surface-2 text-fg-muted',
    warning: 'border-highlight/35 bg-highlight-soft text-[#7A4E0B]',
    danger: 'border-danger/35 bg-danger-soft text-[#9E2E36]',
    success: 'border-success/35 bg-success-soft text-[#0F6B52]',
  } as const

  return (
    <div className={cn('rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed', tones[tone], className)}>
      {title ? (
        <p className="mb-1 flex items-center gap-1.5 font-semibold">
          {icon ?? <Info size={14} aria-hidden="true" />}
          {title}
        </p>
      ) : null}
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-soft px-5 py-8 text-center">
      {icon ? <span className="text-fg-faint" aria-hidden="true">{icon}</span> : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-md text-[13px] leading-relaxed text-fg-muted">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}

/** Compact metric readout: value, unit and the exact denominator/definition. */
export function MetricReadout({
  label,
  metric,
  format = 'percent',
  hint,
  emphasis,
  supporting,
}: {
  label: string
  metric: MetricValue
  format?: 'percent' | 'connectance' | 'count'
  hint?: string
  emphasis?: 'primary' | 'secondary' | 'highlight' | 'danger'
  supporting?: ReactNode
}) {
  const display =
    metric.value === null
      ? 'Not applicable'
      : format === 'percent'
        ? formatPercent(metric.value)
        : format === 'connectance'
          ? formatConnectance(metric.value)
          : String(metric.value)

  const emphasisClass =
    metric.value === null
      ? 'text-fg-faint'
      : emphasis === 'primary'
        ? 'text-primary'
        : emphasis === 'secondary'
          ? 'text-secondary'
          : emphasis === 'highlight'
            ? 'text-highlight'
            : emphasis === 'danger'
              ? 'text-danger'
              : 'text-fg'

  return (
    <div className="rounded-xl border border-line-soft bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-faint">
        <span>{label}</span>
        {hint ? <HelpHint text={hint} label={label} /> : null}
      </div>
      <div className={cn('mt-1 text-xl font-semibold tabular-nums', emphasisClass)}>
        {metric.value === null ? (
          <span className="text-[13px] font-medium">Not applicable</span>
        ) : (
          display
        )}
      </div>
      {metric.value === null && metric.notApplicable ? (
        <p className="mt-1 text-[11px] leading-snug text-fg-faint">{metric.notApplicable}</p>
      ) : supporting ? (
        <p className="mt-1 text-[11px] leading-snug text-fg-faint">{supporting}</p>
      ) : null}
    </div>
  )
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-fg-faint">{label}</p>
    </div>
  )
}

/** Machine-readable value shown in monospace, as required for ids. */
export function MonoId({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[11px] text-fg-faint">{children}</code>
}
