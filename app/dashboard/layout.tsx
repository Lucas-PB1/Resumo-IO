import React from "react";
import { UserMenu } from "@/features/user/components/UserMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="border-b bg-card sticky top-0 z-10 w-full shadow-sm">
        <div className="flex h-16 items-center px-6 md:px-12 justify-between max-w-7xl mx-auto">
          <div className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded-md">CMS</span> Dashboard
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}
