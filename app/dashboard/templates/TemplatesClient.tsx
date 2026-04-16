"use client"

import React, { useEffect, useState } from "react"
import {
  Plus,
  FileText,
  Trash2,
  Layout,
  ArrowRight,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronUp,
  FolderClosed,
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

export default function TemplatesClient() {
  const { user, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({})

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

  // Agrupamento por categoria
  const groupedTemplates = React.useMemo(() => {
    return templates.reduce(
      (acc, template) => {
        const cat = template.category || "Outros"
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(template)
        return acc
      },
      {} as Record<string, DocumentTemplate[]>
    )
  }, [templates])

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  useEffect(() => {
    // Expandir a primeira categoria ou todas por padrão no desktop
    if (templates.length > 0) {
      const initial: Record<string, boolean> = {}
      Object.keys(groupedTemplates).forEach((cat, idx) => {
        initial[cat] = idx === 0 || window.innerWidth > 768
      })
      setExpandedCategories(initial)
    }
  }, [templates.length, groupedTemplates])

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
      <div className="space-y-8">
        {Object.entries(groupedTemplates).map(([category, items]) => (
          <div key={category} className="space-y-6">
            <button
              onClick={() => toggleCategory(category)}
              className="group/btn flex w-full items-center justify-between border-b border-white/5 pb-4 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-brand-500/10 text-brand-500 group-hover/btn:bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-hover/btn:text-white">
                  <FolderClosed size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-black tracking-tight uppercase">
                    {category}
                  </h2>
                  <p className="text-muted-foreground text-xs font-bold uppercase">
                    {items.length} {items.length === 1 ? "Modelo" : "Modelos"}
                  </p>
                </div>
              </div>
              {expandedCategories[category] ? (
                <ChevronUp className="text-muted-foreground" />
              ) : (
                <ChevronDown className="text-muted-foreground" />
              )}
            </button>

            {expandedCategories[category] && (
              <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
                {items.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex"
                  >
                    <Card className="bg-card/60 hover:ring-brand-500/20 group relative flex h-full w-full flex-col overflow-hidden border-none shadow-2xl backdrop-blur-md transition-all hover:ring-2">
                      {/* Management Actions */}
                      <div className="absolute top-4 right-4 z-10 flex gap-2 transition-all md:opacity-0 md:group-hover:opacity-100">
                        <Link href={`/dashboard/templates/${template.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-brand-500/10 hover:bg-brand-500 text-brand-400 h-9 w-9 rounded-xl border border-white/5 backdrop-blur-md transition-all hover:text-white"
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
                          className="h-9 w-9 rounded-xl border border-white/5 bg-red-500/10 text-red-400 backdrop-blur-md transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <CardHeader className="flex-1 p-8 pb-4">
                        <div className="bg-brand-500/10 text-brand-500 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                          <FileText size={28} />
                        </div>

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
              </div>
            )}
          </div>
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
