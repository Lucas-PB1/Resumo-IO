"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { UserMenu } from "@/features/user/components/UserMenu"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/features/user/components/MobileNav"
import { BarChart3, FileBox, Files, Sparkles, Tags } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Início", href: "/dashboard", icon: BarChart3 },
  { label: "Modelos", href: "/dashboard/templates", icon: Sparkles },
  { label: "Categorias", href: "/dashboard/categories", icon: Tags },
  { label: "Documentos", href: "/dashboard/documents", icon: Files },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="bg-background selection:bg-brand-500/30 flex min-h-screen flex-col">
      <header className="bg-background/85 border-border sticky top-0 z-40 w-full border-b shadow-lg shadow-slate-900/5 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 md:px-12">
          <Link href="/dashboard">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-foreground flex items-center gap-3 text-2xl font-bold tracking-tighter"
            >
              <div className="from-dusty-blue to-brand-400 shadow-dusty-blue/20 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg">
                <FileBox size={22} strokeWidth={2.5} />
              </div>
              <span className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-transparent">
                Resume <span className="text-dusty-blue font-black">IO</span>
              </span>
            </motion.div>
          </Link>
          <div className="bg-card/75 border-border mx-8 hidden items-center gap-1 rounded-2xl border p-1.5 shadow-sm backdrop-blur-2xl md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "hover:bg-muted hover:text-dusty-blue gap-2 rounded-xl px-4 font-bold",
                      isActive &&
                        "bg-dusty-blue/10 text-dusty-blue ring-dusty-blue/20 ring-1"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-6">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 p-6 pb-28 md:p-12">
        {children}
      </main>

      <MobileNav />
    </div>
  )
}
