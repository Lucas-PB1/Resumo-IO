"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { BarChart3, Sparkles, Files, Tags } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { name: "Início", path: "/dashboard", icon: BarChart3 },
    { name: "Modelos", path: "/dashboard/templates", icon: Sparkles },
    { name: "Categorias", path: "/dashboard/categories", icon: Tags },
    { name: "Arquivos", path: "/dashboard/documents", icon: Files },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 md:hidden">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card/90 border-border flex items-center justify-around rounded-4xl border p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl"
      >
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/dashboard"
              ? pathname === tab.path
              : pathname.startsWith(tab.path)
          const Icon = tab.icon

          return (
            <Link
              key={tab.path}
              href={tab.path}
              aria-current={isActive ? "page" : undefined}
              className="group relative p-3"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-dusty-blue/10 border-dusty-blue/20 absolute inset-0 rounded-2xl border"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <div className="relative flex flex-col items-center gap-1">
                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${
                    isActive
                      ? "text-dusty-blue"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-black tracking-tighter uppercase transition-colors duration-300 ${
                    isActive
                      ? "text-dusty-blue"
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
