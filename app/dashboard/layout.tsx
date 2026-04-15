"use client";
import React from "react";
import { motion } from "motion/react";
import { UserMenu } from "@/features/user/components/UserMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-500/30">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-2xl shadow-xl shadow-black/40">
        <div className="flex h-20 items-center px-6 md:px-12 justify-between max-w-[1400px] mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold text-2xl tracking-tighter text-foreground flex items-center gap-3"
          >
            <div className="bg-linear-to-br from-brand-600 to-brand-400 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-brand-500/20">
              C
            </div>
            <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              CMS Panel
            </span>
          </motion.div>
          <div className="flex items-center gap-6">
            <UserMenu />
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}
