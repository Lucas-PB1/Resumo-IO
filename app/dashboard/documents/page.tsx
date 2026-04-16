"use client"

import React, { useEffect, useState } from "react"
import {
  FileText,
  Download,
  Calendar,
  ArrowUpRight,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  documentService,
  GeneratedDocument,
} from "@/features/documents/services/document.service"
import {
  Category,
  taxonomyService,
} from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("TODOS")
  const [subcategoryFilter, setSubcategoryFilter] = useState("TODOS")
  const [authorFilter, setAuthorFilter] = useState("TODOS")
  const [registeredCategories, setRegisteredCategories] = useState<Category[]>(
    []
  )

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<GeneratedDocument | null>(null)
  const [editForm, setEditForm] = useState({
    fileName: "",
    category: "",
    subcategory: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return
      try {
        const [docs, cats] = await Promise.all([
          documentService.getDocuments(user.uid),
          taxonomyService.getCategories(user.uid),
        ])
        setDocuments(docs)
        setRegisteredCategories(cats)
      } catch (err) {
        console.error("Failed to fetch initial data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [user])

  const handleDelete = async (id: string, storagePath: string) => {
    if (
      !confirm("Tem certeza que deseja excluir este documento permanentemente?")
    )
      return
    try {
      await documentService.deleteDocument(id, storagePath)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error("Delete error", err)
      alert("Erro ao excluir documento.")
    }
  }

  const openEditModal = (doc: GeneratedDocument) => {
    setEditingDoc(doc)
    setEditForm({
      fileName: doc.fileName,
      category: doc.category || "",
      subcategory: doc.subcategory || "",
    })
  }

  const handleUpdate = async () => {
    if (!editingDoc || !user) return
    setIsUpdating(true)
    try {
      await documentService.updateDocument(editingDoc.id!, editForm)
      setDocuments((prev) =>
        prev.map((d) => (d.id === editingDoc.id ? { ...d, ...editForm } : d))
      )
      setEditingDoc(null)
    } catch (err) {
      console.error("Update error", err)
      alert("Erro ao atualizar documento.")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.authorName || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      categoryFilter === "TODOS" || doc.category === categoryFilter
    const matchesSubcategory =
      subcategoryFilter === "TODOS" || doc.subcategory === subcategoryFilter
    const matchesAuthor =
      authorFilter === "TODOS" || doc.authorName === authorFilter

    return (
      matchesSearch && matchesCategory && matchesSubcategory && matchesAuthor
    )
  })

  const uniqueCategories = [
    "TODOS",
    ...Array.from(
      new Set([
        ...documents.map((d) => d.category).filter(Boolean),
        ...registeredCategories.map((c) => c.name),
      ])
    ),
  ]
  const uniqueSubcategories = [
    "TODOS",
    ...Array.from(
      new Set([
        ...documents.map((d) => d.subcategory).filter(Boolean),
        ...(registeredCategories.find((c) => c.name === categoryFilter)
          ?.subcategories || []),
      ])
    ),
  ]
  const uniqueAuthors = [
    "TODOS",
    ...Array.from(new Set(documents.map((d) => d.authorName).filter(Boolean))),
  ]

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-[10px] font-black uppercase">
            Categoria
          </Label>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-card/40 h-10 rounded-xl border-white/5"
          >
            {uniqueCategories.map((cat) => (
              <option key={cat!} value={cat!}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-[10px] font-black uppercase">
            Subcategoria
          </Label>
          <Select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className="bg-card/40 h-10 rounded-xl border-white/5"
          >
            {uniqueSubcategories.map((sub) => (
              <option key={sub!} value={sub!}>
                {sub}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-[10px] font-black uppercase">
            Autor
          </Label>
          <Select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="bg-card/40 h-10 rounded-xl border-white/5"
          >
            {uniqueAuthors.map((author) => (
              <option key={author!} value={author!}>
                {author}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md">
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
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
                    Taxonomia
                  </th>
                  <th className="text-muted-foreground px-8 py-5 text-xs font-bold tracking-widest uppercase">
                    Autor
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
                      <div className="flex flex-col">
                        <span className="text-foreground text-sm font-bold">
                          {doc.category || "-"}
                        </span>
                        <span className="text-muted-foreground text-xs font-medium">
                          {doc.subcategory || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-muted-foreground text-sm font-medium">
                        {doc.authorName || "Desconhecido"}
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
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-brand-500/10 hover:text-brand-500 h-9 w-9 rounded-xl"
                          >
                            <Download size={18} />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(doc)}
                          className="hover:bg-brand-500/10 hover:text-brand-500 h-9 w-9 rounded-xl"
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id!, doc.storagePath)}
                          className="h-9 w-9 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
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
                className="space-y-4 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-500/10 text-brand-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground leading-tight font-bold break-all">
                        {doc.fileName}
                      </p>
                      <p className="text-muted-foreground text-sm font-medium">
                        {doc.templateName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-xs font-semibold">
                    {new Date(doc.createdAt.toDate()).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] font-black uppercase">
                      Taxonomia
                    </p>
                    <p className="text-foreground text-xs font-bold">
                      {doc.category || "-"} / {doc.subcategory || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] font-black uppercase">
                      Autor
                    </p>
                    <p className="text-foreground text-xs font-bold">
                      {doc.authorName || "Desconhecido"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(doc)}
                    className="hover:bg-brand-500/10 hover:text-brand-500 rounded-xl"
                  >
                    <Pencil size={18} className="mr-2" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id!, doc.storagePath)}
                    className="rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={18} className="mr-2" /> Excluir
                  </Button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      className="bg-brand-500 shadow-brand-500/20 rounded-xl font-bold"
                    >
                      <Download size={18} className="mr-2" /> Download
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

      {/* Edit Modal Overlay */}
      <AnimatePresence>
        {editingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl"
            onClick={() => setEditingDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-brand-500/10 flex items-center justify-between p-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">
                    Editar Documento
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Ajuste os detalhes do seu documento gerado.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingDoc(null)}
                  className="rounded-full hover:bg-white/5"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6 p-8">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-black tracking-widest uppercase">
                    Nome do Arquivo
                  </Label>
                  <Input
                    value={editForm.fileName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fileName: e.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl border-none bg-white/5 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-black tracking-widest uppercase">
                      Categoria
                    </Label>
                    <Select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                          subcategory: "",
                        }))
                      }
                      className="h-12 rounded-2xl border-none bg-white/5 font-bold"
                    >
                      <option value="">Selecione...</option>
                      {registeredCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-black tracking-widest uppercase">
                      Subcategoria
                    </Label>
                    <Select
                      value={editForm.subcategory}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          subcategory: e.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border-none bg-white/5 font-bold"
                      disabled={!editForm.category}
                    >
                      <option value="">Selecione...</option>
                      {registeredCategories
                        .find((c) => c.name === editForm.category)
                        ?.subcategories.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-8 pt-0">
                <Button
                  variant="ghost"
                  onClick={() => setEditingDoc(null)}
                  className="h-12 flex-1 rounded-2xl font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-brand-500 shadow-brand-500/20 h-12 flex-1 gap-2 rounded-2xl font-black shadow-xl"
                >
                  {isUpdating ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save size={18} /> Salvar Alterações
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-white/5 p-8 pt-6">
                <Button
                  variant="outline"
                  className="border-brand-500/20 text-brand-400 hover:bg-brand-500 h-14 w-full gap-3 rounded-2xl border-2 font-black transition-all hover:text-white"
                  onClick={() => {
                    window.location.href = `/dashboard/templates/${editingDoc.templateId}/fill?editDocId=${editingDoc.id}`
                  }}
                >
                  <ArrowUpRight size={20} /> Editar Conteúdo e Regenerar
                </Button>
                <p className="text-muted-foreground mt-3 text-center text-[10px] font-medium tracking-widest uppercase opacity-50">
                  Você voltará ao formulário com os dados preenchidos.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
