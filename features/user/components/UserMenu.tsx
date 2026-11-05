"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { authService } from "@/features/auth/services/auth.service"
import { useProfile } from "@/features/user/hooks/useProfile"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

export function Avatar({
  name,
  photoURL,
  className,
}: {
  name: string
  photoURL?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "bg-accent text-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-semibold",
        className
      )}
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

export const UserMenu = ({
  placement = "top",
  compact = false,
}: {
  placement?: "top" | "bottom"
  compact?: boolean
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const { displayName, email, photoURL } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false)
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  if (!user) return null

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "hover:bg-muted flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors",
          isOpen && "bg-muted"
        )}
      >
        <Avatar name={displayName || "?"} photoURL={photoURL} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {displayName}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {email}
              </span>
            </span>
            <ChevronsUpDown size={14} className="text-subtle-foreground" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: placement === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "bg-card border-border absolute z-50 w-60 overflow-hidden rounded-xl border p-1 shadow-lg",
              placement === "top"
                ? "bottom-full left-0 mb-2"
                : "top-full right-0 mt-2"
            )}
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">{email}</p>
            </div>
            <div className="border-border my-1 border-t" />
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push("/dashboard/profile")
              }}
              className="hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm"
            >
              <UserRound size={16} className="text-muted-foreground" />
              Meu perfil
            </button>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm">
              <span>Tema</span>
              <ThemeToggle className="w-28" />
            </div>
            <div className="border-border my-1 border-t" />
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              className="text-danger hover:bg-danger-soft flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm"
            >
              <LogOut size={16} />
              Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
