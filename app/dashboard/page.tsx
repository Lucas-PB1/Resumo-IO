"use client"

import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { motion } from "motion/react"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Central</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Bem-vindo de volta, {user?.email || "Administrador"}.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
            <CardDescription>
              Métricas em tempo real sobre seu projeto CMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground bg-muted/10 m-6 mt-0 flex h-32 items-center justify-center rounded-md border border-dashed">
            Métricas em breve
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
