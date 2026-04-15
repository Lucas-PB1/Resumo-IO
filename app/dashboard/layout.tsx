"use client"

import React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { UserMenu } from "@/features/user/components/UserMenu"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/features/user/components/MobileNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background selection:bg-brand-500/30 flex min-h-screen flex-col">
      <header className="bg-background/80 sticky top-0 z-40 w-full border-b border-white/10 shadow-xl shadow-black/40 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground flex items-center gap-3 text-2xl font-bold tracking-tighter"
          >
            <div className="from-brand-600 to-brand-400 shadow-brand-500/20 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg">
              C
            </div>
            <span className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-transparent">
              CMS Panel
            </span>
          </motion.div>
          <div className="bg-muted/20 mx-8 hidden items-center gap-1 rounded-2xl border border-white/5 p-1.5 md:flex">
            <Link href="/dashboard/templates">
              <Button
                variant="ghost"
                className="hover:bg-brand-500/10 hover:text-brand-400 rounded-xl px-5 font-bold"
              >
                Modelos
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button
                variant="ghost"
                className="hover:bg-brand-500/10 hover:text-brand-400 rounded-xl px-5 font-bold"
              >
                Relatórios
              </Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button
                variant="ghost"
                className="hover:bg-brand-500/10 hover:text-brand-400 rounded-xl px-5 font-bold"
              >
                Documentos
              </Button>
            </Link>
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
