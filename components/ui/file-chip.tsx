import { cn } from "@/lib/utils"
import { fileExtension } from "@/lib/format"

const TONES: Record<string, string> = {
  pdf: "bg-danger-soft text-danger",
  docx: "bg-accent text-accent-foreground",
  doc: "bg-accent text-accent-foreground",
}

/** Selo com a extensão do arquivo (PDF, DOCX, PNG...). */
export function FileChip({
  fileName,
  className,
}: {
  fileName: string
  className?: string
}) {
  const ext = fileExtension(fileName) || "arq"
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tracking-wide uppercase",
        TONES[ext] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {ext.slice(0, 4)}
    </span>
  )
}
