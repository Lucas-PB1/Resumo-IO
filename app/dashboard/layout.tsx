"use client"

import React from "react"
import { Sidebar } from "@/features/user/components/Sidebar"
import { MobileNav, MobileTopBar } from "@/features/user/components/MobileNav"
import { NewDocumentProvider } from "@/features/documents/components/NewDocumentPicker"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NewDocumentProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-16">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </NewDocumentProvider>
  )
}
