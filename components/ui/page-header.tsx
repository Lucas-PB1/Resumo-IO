import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 space-y-3", className)}>
      {back && (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-serif text-[28px] leading-tight font-medium tracking-[-0.01em] md:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-[15px]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
