"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  userService,
  type UserProfileData,
} from "@/features/user/services/user.service"

const cache = new Map<string, UserProfileData | null>()

/** Perfil do usuário logado, com cache em memória entre telas. */
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileData | null>(
    user ? (cache.get(user.uid) ?? null) : null
  )

  useEffect(() => {
    if (!user) return
    let active = true
    userService
      .getUserProfile(user.uid)
      .then((data) => {
        cache.set(user.uid, data ?? null)
        if (active) setProfile(data ?? null)
      })
      .catch((err) => console.error("Failed to fetch profile", err))
    return () => {
      active = false
    }
  }, [user])

  const fullName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
    : ""
  const displayName =
    fullName || user?.displayName || user?.email?.split("@")[0] || ""
  const firstName =
    profile?.firstName || user?.displayName?.split(" ")[0] || displayName

  return {
    profile,
    displayName,
    firstName,
    photoURL: profile?.photoURL || user?.photoURL || null,
    email: user?.email ?? "",
  }
}

export function invalidateProfileCache(uid: string) {
  cache.delete(uid)
}
