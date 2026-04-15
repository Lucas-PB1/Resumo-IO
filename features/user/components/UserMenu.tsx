"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { authService } from "@/features/auth/services/auth.service";
import { userService, UserProfileData } from "@/features/user/services/user.service";

export const UserMenu = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (user) {
      userService.getUserProfile(user.uid).then(setProfile);
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;
  const photoURL = profile?.photoURL || user.photoURL;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors border border-transparent hover:border-border"
      >
        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-medium overflow-hidden border">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            displayName?.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-sm font-medium hidden sm:inline-block max-w-[150px] truncate">
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
            className="absolute right-0 mt-3 w-64 bg-card/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/20"
          >
            <div className="p-5 border-b border-white/5 bg-linear-to-b from-white/5 to-transparent">
              <p className="text-sm font-bold tracking-tight text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{user.email}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/profile");
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-brand-500/10 hover:text-brand-400 rounded-xl flex items-center gap-3 transition-colors"
              >
                <div className="bg-brand-500/10 p-1.5 rounded-lg">
                  <User size={16} />
                </div>
                Meu Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors mt-1"
              >
                <div className="bg-red-500/10 p-1.5 rounded-lg">
                  <LogOut size={16} />
                </div>
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
