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
    { name: "Categorias", path: "/dashboard/categories", icon: Layout },
    { name: "Arquivos", path: "/dashboard/documents", icon: Files },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 md:hidden">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card/70 flex items-center justify-around rounded-4xl border border-white/10 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          const Icon = tab.icon

          return (
            <Link key={tab.path} href={tab.path} className="group relative p-3">
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-brand-500/10 border-brand-500/20 absolute inset-0 rounded-2xl border"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <div className="relative flex flex-col items-center gap-1">
                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${
                    isActive
                      ? "text-brand-500"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-black tracking-tighter uppercase transition-colors duration-300 ${
                    isActive
                      ? "text-brand-500"
                      : "text-muted-foreground group-hover:text-foreground"
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
