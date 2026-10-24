import { getSpeciesIcon } from '../art/speciesIcons'
import { cn } from './ui/primitives'

/**
 * Renders an organism illustration from the artwork registry.
 *
 * The illustration is decoration with respect to the science: it never carries
 * information that the text does not also carry, so `decorative` (the default)
 * hides it from assistive technology and the visible label supplies the meaning.
 */
export function SpeciesIcon({
  iconKey,
  size = 40,
  className,
  label,
  decorative = true,
}: {
  iconKey: string | null | undefined
  size?: number
  className?: string
  label?: string
  decorative?: boolean
}) {
  const icon = getSpeciesIcon(iconKey)

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full', className)}
      style={{ width: size, height: size }}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : (label ?? icon.label)}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  )
}
