"use client"

import React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { UserMenu } from "@/features/user/components/UserMenu"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/features/user/components/MobileNav"
import { FileBox } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background selection:bg-dusty-blue/30 flex min-h-screen flex-col">
      <header className="bg-background/80 border-border sticky top-0 z-40 w-full border-b shadow-lg shadow-slate-900/5 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 md:px-12">
          <Link href="/dashboard">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-foreground flex items-center gap-3 text-2xl font-bold tracking-tighter"
            >
              <div className="from-dusty-blue to-dusty-blue/80 shadow-dusty-blue/10 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg">
                <FileBox size={22} strokeWidth={2.5} />
              </div>
              <span className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-transparent">
                Resume <span className="text-dusty-blue font-black">IO</span>
              </span>
            </motion.div>
          </Link>
          <div className="bg-accent border-border mx-8 hidden items-center gap-1 rounded-2xl border p-1.5 md:flex">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="hover:bg-background hover:text-dusty-blue rounded-xl px-4 font-bold"
              >
                Início
              </Button>
            </Link>
            <Link href="/dashboard/templates">
              <Button
                variant="ghost"
                className="hover:bg-background hover:text-dusty-blue rounded-xl px-4 font-bold"
              >
                Modelos
              </Button>
            </Link>
            <Link href="/dashboard/categories">
              <Button
                variant="ghost"
                className="hover:bg-background hover:text-dusty-blue rounded-xl px-5 font-bold"
              >
                Categorias
              </Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button
                variant="ghost"
                className="hover:bg-background hover:text-dusty-blue rounded-xl px-5 font-bold"
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
