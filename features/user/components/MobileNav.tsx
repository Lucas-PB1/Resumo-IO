"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { useNewDocument } from "@/features/documents/components/NewDocumentPicker"
import { UserMenu } from "./UserMenu"
import { NAV_ITEMS, isNavActive } from "./navigation"
import { cn } from "@/lib/utils"

export function MobileTopBar() {
  return (
    <header className="bg-background/90 border-border sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
      <Link href="/dashboard" aria-label="Início">
        <Logo />
      </Link>
      <UserMenu placement="bottom" compact />
    </header>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const { open } = useNewDocument()
  const [first, second, ...rest] = NAV_ITEMS

  const renderItem = ({
    href,
    label,
    icon: Icon,
  }: (typeof NAV_ITEMS)[number]) => {
    const active = isNavActive(pathname, href)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-subtle-foreground flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
          active && "text-primary"
        )}
      >
        <Icon size={20} />
        {label}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Principal"
      className="bg-card border-border fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {renderItem(first)}
      {renderItem(second)}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={open}
          aria-label="Novo documento"
          className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full shadow-md"
        >
          <Plus size={20} />
        </button>
      </div>
      {rest.map(renderItem)}
    </nav>
  )
}
