"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { useNewDocument } from "@/features/documents/components/NewDocumentPicker"
import { UserMenu } from "./UserMenu"
import { NAV_ITEMS, isNavActive } from "./navigation"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const { open } = useNewDocument()

  return (
    <aside className="bg-surface border-border sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r md:flex">
      <div className="px-4 pt-5 pb-4">
        <Link href="/dashboard" aria-label="Início">
          <Logo />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Button onClick={open} className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Plus size={16} /> Novo documento
          </span>
          <kbd className="text-primary-foreground/60 font-sans text-xs">N</kbd>
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:bg-muted hover:text-foreground flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                active && "bg-card text-foreground shadow-xs"
              )}
            >
              <Icon size={17} className={cn(active && "text-primary")} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-border border-t p-2">
        <UserMenu placement="top" />
      </div>
    </aside>
  )
}
