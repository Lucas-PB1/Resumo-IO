"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { authService } from "@/features/auth/services/auth.service";

export const UserMenu = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors"
      >
        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
          {user.email}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-muted/50">
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
              >
                <User size={16} /> Meu Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
