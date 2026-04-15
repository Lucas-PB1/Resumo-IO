"use client"

import React, { useEffect, useState } from "react"
import { Plus, FileText, Trash2, Layout, Calendar } from "lucide-react"
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"

export default function TemplatesPage() {
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

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando modelos...
      </div>
    )

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-foreground text-4xl font-black tracking-tight">
            Modelos
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Gerencie seus modelos de documentos interativos.
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-card/60 group h-full overflow-hidden border-none shadow-xl backdrop-blur-md">
              <div className="bg-brand-500/10 group-hover:bg-brand-500 h-3 transition-colors" />
              <CardHeader className="pb-4">
                <div className="bg-brand-500/10 text-brand-500 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <FileText size={24} />
                </div>
                <CardTitle className="text-xl font-bold">
                  {template.name}
                </CardTitle>
                <CardDescription className="font-medium">
                  {template.fields.length} campos mapeados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
                  <Calendar size={14} />
                  <span>
                    {new Date(template.createdAt?.toDate()).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 flex justify-between border-t border-white/5 pt-6">
                <div className="flex gap-2">
                  <Link href={`/dashboard/reports/${template.id}/fill`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-brand-500/20 text-brand-400 hover:bg-brand-500 rounded-xl font-bold hover:text-white"
                    >
                      Preencher
                    </Button>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleDelete(template.id!, template.storagePath)
                  }
                  className="rounded-xl text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={18} />
                </Button>
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
