"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { Layout, Sparkles, Files, User } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { name: "Início", path: "/dashboard", icon: Layout },
    { name: "Modelos", path: "/dashboard/templates", icon: Sparkles },
    { name: "Gerar", path: "/dashboard/reports", icon: Files },
    { name: "Arquivos", path: "/dashboard/documents", icon: User },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-around bg-card/70 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl shadow-black/50"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          const Icon = tab.icon

          return (
            <Link key={tab.path} href={tab.path} className="relative p-3 group">
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-brand-500/10 rounded-2xl border border-brand-500/20"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <div className="relative flex flex-col items-center gap-1">
                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${
                    isActive ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter transition-colors duration-300 ${
                    isActive ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {tab.name}
                </span>
              </div>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
