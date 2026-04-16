"use client"

import React, { useEffect, useState } from "react"
import {
  Plus,
  FileText,
  Trash2,
  Layout,
  Calendar,
  ArrowRight,
  Sparkles,
  Pencil,
} from "lucide-react"
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
  CardFooter,
} from "@/components/ui/card"

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    async function fetchTemplates() {
      if (!user) {
        if (!authLoading) setDataLoading(false)
        return
      }
      try {
        const data = await templateService.getTemplates(user.uid)
        setTemplates(data)
      } catch (err) {
        console.error("Failed to fetch templates", err)
      } finally {
        setDataLoading(false)
      }
    }
    fetchTemplates()
  }, [user, authLoading])

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm("Tem certeza que deseja excluir este modelo?")) return
    try {
      await templateService.deleteTemplate(id, storagePath)
      setTemplates(templates.filter((t) => t.id !== id))
    } catch (err) {
      console.error("Failed to delete template", err)
      alert("Erro ao excluir modelo.")
    }
  }

  if (authLoading || (dataLoading && user))
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando modelos...
      </div>
    )

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-foreground flex items-center gap-3 text-4xl font-black tracking-tight">
            Modelos <Sparkles className="text-brand-500" />
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Gerencie seus modelos e gere novos documentos instantaneamente.
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button
            size="lg"
            className="shadow-brand-500/20 gap-2 px-8 font-bold"
          >
            <Plus size={20} /> Novo Modelo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex"
          >
            <Card className="bg-card/60 hover:ring-brand-500/20 group relative flex h-full w-full flex-col overflow-hidden border-none shadow-2xl backdrop-blur-md transition-all hover:ring-2">
              {/* Management Actions (Top Right) */}
              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 transition-all group-hover:opacity-100">
                <Link href={`/dashboard/templates/${template.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-brand-500/20 hover:text-brand-400 h-9 w-9 rounded-xl bg-white/5 text-white/70 backdrop-blur-md"
                  >
                    <Pencil size={16} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleDelete(template.id!, template.storagePath)
                  }
                  className="h-9 w-9 rounded-xl bg-white/5 text-red-400/70 backdrop-blur-md hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <CardHeader className="flex-1 p-8 pb-4">
                <div className="bg-brand-500/10 text-brand-500 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                  <FileText size={28} />
                </div>

                {template.category && (
                  <div className="mb-3">
                    <span className="bg-brand-500/10 text-brand-400 rounded-full px-3 py-1 text-[10px] font-black tracking-tight uppercase">
                      {template.category}
                    </span>
                  </div>
                )}

                <CardTitle className="mb-2 line-clamp-2 text-2xl leading-tight font-bold">
                  {template.name}
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  {template.fields.length} campos mapeados.
                </CardDescription>
              </CardHeader>

              <CardFooter className="p-8 pt-4">
                <Link
                  href={`/dashboard/templates/${template.id}/fill`}
                  className="w-full"
                >
                  <Button className="shadow-brand-500/40 h-12 w-full gap-2 rounded-2xl font-black tracking-tighter uppercase shadow-xl">
                    Preencher <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {templates.length === 0 && (
          <div className="bg-card/40 col-span-full rounded-3xl border-2 border-dashed border-white/5 py-20 text-center backdrop-blur-sm">
            <Layout
              size={48}
              className="text-muted-foreground/30 mx-auto mb-4"
            />
            <p className="text-muted-foreground text-lg font-medium">
              Nenhum modelo encontrado.
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
