"use client"

import React, { useEffect, useState } from "react"
import {
  FileText,
  Download,
  Calendar,
  ArrowUpRight,
  Search,
} from "lucide-react"
import { motion } from "motion/react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  documentService,
  GeneratedDocument,
} from "@/features/documents/services/document.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchDocs() {
      if (!user) return
      try {
        const data = await documentService.getDocuments(user.uid)
        setDocuments(data)
      } catch (err) {
        console.error("Failed to fetch documents", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [user])

  const filteredDocs = documents.filter(
    (doc) =>
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.templateName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando documentos...
      </div>
    )

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-foreground text-4xl font-black tracking-tight">
            Documentos
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Histórico de relatórios gerados e finalizados.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search
            className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2"
            size={18}
          />
          <Input
            placeholder="Pesquisar documentos..."
            className="bg-card/40 h-12 rounded-2xl border-white/5 pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md">
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-white/5">
                  <th className="text-muted-foreground px-8 py-5 text-xs font-bold tracking-widest uppercase">
                    Documento
                  </th>
                  <th className="text-muted-foreground px-8 py-5 text-xs font-bold tracking-widest uppercase">
                    Modelo
                  </th>
                  <th className="text-muted-foreground px-8 py-5 text-xs font-bold tracking-widest uppercase">
                    Data
                  </th>
                  <th className="text-muted-foreground px-8 py-5 text-right text-xs font-bold tracking-widest uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDocs.map((doc, index) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors hover:bg-white/2"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-500/10 text-brand-500 flex h-10 w-10 items-center justify-center rounded-xl">
                          <FileText size={20} />
                        </div>
                        <span className="text-foreground max-w-[200px] truncate font-bold">
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-muted-foreground font-medium">
                        {doc.templateName}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Calendar size={14} />
                        <span className="text-sm font-medium">
                          {new Date(doc.createdAt.toDate()).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-brand-500/10 hover:text-brand-500 gap-2 rounded-xl font-bold"
                        >
                          Download <Download size={16} />
                        </Button>
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-white/5 md:hidden">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-500/10 text-brand-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground font-bold leading-tight break-all">
                        {doc.fileName}
                      </p>
                      <p className="text-muted-foreground text-sm font-medium">
                        {doc.templateName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-xs font-semibold">
                      {new Date(doc.createdAt.toDate()).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      className="bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white gap-2 rounded-xl font-bold"
                    >
                      Download <Download size={16} />
                    </Button>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-muted-foreground px-8 py-20 text-center italic">
              Nenhum documento encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
