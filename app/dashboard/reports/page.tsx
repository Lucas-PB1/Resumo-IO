"use client"

import React, { useEffect, useState } from "react"
import { FileText, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  templateService,
  DocumentTemplate,
} from "@/features/documents/services/template.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function ReportsPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTemplates() {
      if (!user) return
      try {
        const data = await templateService.getTemplates(user.uid)
        setTemplates(data)
      } catch (err) {
        console.error("Failed to fetch templates", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [user])

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando modelos...
      </div>
    )

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-foreground flex items-center gap-3 text-4xl font-black tracking-tight">
          Relatórios <Sparkles className="text-brand-500" />
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Escolha um modelo para gerar um novo documento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/dashboard/reports/${template.id}/fill`}>
              <Card className="group bg-card/60 hover:ring-brand-500/50 cursor-pointer overflow-hidden border-none shadow-xl backdrop-blur-md transition-all hover:ring-2">
                <CardHeader className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="bg-brand-500/10 text-brand-500 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                      <FileText size={28} />
                    </div>
                    <ArrowRight className="text-muted-foreground/30 group-hover:text-brand-500 transition-all group-hover:translate-x-1" />
                  </div>
                  <CardTitle className="mb-2 text-2xl font-bold">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    Preencher {template.fields.length} campos mutáveis e gerar
                    arquivo final.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}

        {templates.length === 0 && (
          <div className="bg-card/40 col-span-full rounded-3xl border-2 border-dashed border-white/5 py-20 text-center backdrop-blur-sm">
            <p className="text-muted-foreground font-medium">
              Você precisa cadastrar um modelo antes de gerar relatórios.
            </p>
            <Link href="/dashboard/templates/new">
              <Button variant="link" className="text-brand-500 mt-2 font-bold">
                Criar meu primeiro modelo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
