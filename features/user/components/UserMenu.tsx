"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { authService } from "@/features/auth/services/auth.service"
import {
  userService,
  UserProfileData,
} from "@/features/user/services/user.service"

export const UserMenu = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfileData | null>(null)

  useEffect(() => {
    if (user) {
      userService.getUserProfile(user.uid).then(setProfile)
    }
  }, [user])

  if (!user) return null

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user.email
  const photoURL = profile?.photoURL || user.photoURL

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted hover:border-border flex items-center gap-2 rounded-md border border-transparent p-2 transition-colors"
      >
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border font-medium">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoURL}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            displayName?.charAt(0).toUpperCase()
          )}
        </div>
        <span className="hidden max-w-[150px] truncate text-sm font-medium sm:inline-block">
          {displayName}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-card border-brand-500/10 ring-brand-900/5 absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border shadow-2xl ring-1 transition-all"
          >
            <div className="border-brand-500/10 from-brand-500/5 border-b bg-linear-to-b to-transparent p-5">
              <p className="text-foreground text-sm font-bold tracking-tight">
                {displayName}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs font-medium">
                {user.email}
              </p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push("/dashboard/profile")
                }}
                className="hover:bg-brand-500/10 hover:text-brand-400 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
              >
                <div className="bg-brand-500/10 rounded-lg p-1.5">
                  <User size={16} />
                </div>
                Meu Perfil
              </button>
              <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <div className="rounded-lg bg-red-500/10 p-1.5">
                  <LogOut size={16} />
                </div>
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
