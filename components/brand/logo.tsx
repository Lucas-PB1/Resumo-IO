import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/brand"

/** Marca: monograma em "papel dobrado" + nome em serifa. */
export function Logo({
  className,
  showName = true,
}: {
  className?: string
  showName?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M5 3.5h11l5 5V22a.5.5 0 0 1-.5.5h-15A.5.5 0 0 1 5 22V3.5Z"
          className="fill-primary"
        />
        <path d="M16 3.5v5h5" className="fill-primary-hover" />
        <path
          d="M10.5 11.4h2.1a3.3 3.3 0 0 1 0 6.6h-2.1z"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary-foreground"
        />
      </svg>
      {showName && (
        <span className="font-serif text-[21px] leading-none font-medium tracking-[-0.01em]">
          {BRAND.name}
        </span>
      )}
    </span>
  )
}
