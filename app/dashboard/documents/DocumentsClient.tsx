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
  Paperclip,
  Eye,
  Image as ImageIcon,
  Loader2,
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
import {
  templateService,
  DocumentTemplate,
} from "@/features/documents/services/template.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentsClient() {
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

  // Details Modal State
  const [detailsDoc, setDetailsDoc] = useState<GeneratedDocument | null>(null)
  const [detailsTemplate, setDetailsTemplate] =
    useState<DocumentTemplate | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

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
      const docToDelete = documents.find((d) => d.id === id)
      await documentService.deleteDocument(
        id,
        storagePath,
        docToDelete?.evidence
      )
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

  const handleViewDetails = async (doc: GeneratedDocument) => {
    setDetailsDoc(doc)
    setLoadingDetails(true)
    try {
      const tpl = await templateService.getTemplateById(doc.templateId)
      setDetailsTemplate(tpl)
    } catch (err) {
      console.error("Failed to fetch template for details", err)
    } finally {
      setLoadingDetails(false)
    }
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
                          onClick={() => handleViewDetails(doc)}
                          className="hover:bg-brand-500/10 hover:text-brand-500 h-9 w-9 rounded-xl"
                        >
                          <Eye size={18} />
                        </Button>
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

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(doc)}
                    className="hover:bg-brand-500/10 hover:text-brand-500 h-9 rounded-xl px-3 text-xs"
                  >
                    <Eye size={16} className="mr-2" /> Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(doc)}
                    className="hover:bg-brand-500/10 hover:text-brand-500 h-9 rounded-xl px-3 text-xs"
                  >
                    <Pencil size={16} className="mr-2" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id!, doc.storagePath)}
                    className="h-9 rounded-xl px-3 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={16} className="mr-2" /> Excluir
                  </Button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      size="sm"
                      className="bg-brand-500 shadow-brand-500/20 w-full rounded-xl font-bold sm:w-auto"
                    >
                      <Download size={16} className="mr-2" /> Baixar
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
              className="bg-card mx-4 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-brand-500/10 flex items-center justify-between p-6 sm:p-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                    Editar Documento
                  </h3>
                  <p className="text-muted-foreground text-xs font-medium sm:text-sm">
                    Ajuste os detalhes do seu documento.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingDoc(null)}
                  className="h-10 w-10 rounded-full hover:bg-white/5"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
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
                      <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
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

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="ghost"
                    onClick={() => setEditingDoc(null)}
                    className="h-12 flex-1 rounded-2xl font-bold sm:h-14"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="bg-brand-500 shadow-brand-500/20 h-12 flex-1 gap-2 rounded-2xl font-black shadow-xl sm:h-14"
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

                <div className="mt-8 border-t border-white/5 pt-6">
                  <Button
                    variant="outline"
                    className="border-brand-500/20 text-brand-400 hover:bg-brand-500 h-14 w-full gap-3 rounded-2xl border-2 font-black transition-all hover:text-white"
                    onClick={() => {
                      window.location.href = `/dashboard/templates/${editingDoc.templateId}/fill?editDocId=${editingDoc.id}`
                    }}
                  >
                    <ArrowUpRight size={20} /> Editar e Regenerar
                  </Button>
                  <p className="text-muted-foreground mt-3 text-center text-[9px] font-medium tracking-widest uppercase opacity-50">
                    Você voltará ao formulário original.
                  </p>
                </div>

                {editingDoc.evidence && editingDoc.evidence.length > 0 && (
                  <div className="bg-brand-500/5 mt-8 rounded-3xl border border-white/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Paperclip size={14} className="text-brand-400" />
                      <h4 className="text-[10px] font-black tracking-widest uppercase">
                        Evidências ({editingDoc.evidence.length})
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {editingDoc.evidence.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-card flex items-center justify-between rounded-xl border border-white/5 p-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span className="text-foreground truncate text-xs font-medium">
                              {item.fileName}
                            </span>
                          </div>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-brand-500/10 text-brand-400 hover:bg-brand-500 rounded-lg p-2 transition-all hover:text-white"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal Overlay */}
      <AnimatePresence>
        {detailsDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl"
            onClick={() => {
              setDetailsDoc(null)
              setDetailsTemplate(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-card flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-brand-500/10 flex items-center justify-between p-6 sm:p-10">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="bg-brand-500 shadow-brand-500/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xl sm:h-16 sm:w-16 sm:rounded-3xl">
                    <FileText size={20} className="text-white sm:h-8 sm:w-8" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="text-xl leading-tight font-black tracking-tight sm:text-3xl">
                      Detalhes
                    </h3>
                    <p className="text-muted-foreground flex items-center gap-2 text-[10px] font-medium sm:text-xs">
                      <Calendar size={12} />{" "}
                      {new Date(
                        detailsDoc.createdAt.toDate()
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDetailsDoc(null)
                    setDetailsTemplate(null)
                  }}
                  className="h-10 w-10 rounded-full hover:bg-white/5 sm:h-12 sm:w-12"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                {loadingDetails ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 py-20 opacity-50">
                    <Loader2
                      className="text-brand-500 animate-spin"
                      size={40}
                    />
                    <p className="text-base font-bold">Carregando...</p>
                  </div>
                ) : (
                  <div className="space-y-10 sm:space-y-12">
                    {/* Model Info Card */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="bg-muted/10 rounded-3xl border border-white/5 p-8">
                        <Label className="text-muted-foreground mb-4 block text-[10px] font-black tracking-widest uppercase">
                          Informações Gerais
                        </Label>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium opacity-50">
                              Nome do Arquivo
                            </p>
                            <p className="text-lg font-bold">
                              {detailsDoc.fileName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium opacity-50">
                              Modelo Base
                            </p>
                            <p className="text-brand-400 text-lg font-bold">
                              {detailsDoc.templateName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium opacity-50">
                              Taxonomia
                            </p>
                            <p className="text-lg font-bold">
                              {detailsDoc.category || "-"} /{" "}
                              {detailsDoc.subcategory || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <Button
                          className="shadow-brand-500/20 h-14 w-full gap-3 rounded-2xl font-black shadow-xl"
                          onClick={() =>
                            window.open(detailsDoc.fileUrl, "_blank")
                          }
                        >
                          <Download size={20} /> Baixar Documento
                        </Button>
                        <Button
                          variant="outline"
                          className="border-brand-500/20 text-brand-400 hover:bg-brand-500 h-14 w-full gap-3 rounded-2xl border-2 font-black transition-all hover:text-white"
                          onClick={() => {
                            window.location.href = `/dashboard/templates/${detailsDoc.templateId}/fill?editDocId=${detailsDoc.id}`
                          }}
                        >
                          <Pencil size={20} /> Editar e Regenerar
                        </Button>
                      </div>
                    </div>

                    {/* Form Data Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-500/20 text-brand-500 h-8 w-1 rounded-full" />
                        <h4 className="text-xl font-black tracking-tight italic">
                          Dados Preenchidos
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {detailsTemplate?.fields.map((field) => (
                          <div
                            key={field.key}
                            className="bg-muted/5 hover:bg-muted/10 rounded-2xl border border-white/5 p-6 transition-colors"
                          >
                            <Label className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                              {field.label}
                              {field.type === "image" && (
                                <ImageIcon
                                  size={12}
                                  className="text-brand-500"
                                />
                              )}
                            </Label>
                            {field.type === "image" ? (
                              detailsDoc.formData?.[field.key] ? (
                                <div className="mt-3 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      typeof detailsDoc.formData[field.key] ===
                                      "string"
                                        ? (detailsDoc.formData[
                                            field.key
                                          ] as string)
                                        : ""
                                    }
                                    alt={field.label}
                                    className="h-32 w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  Imagem não informada.
                                </p>
                              )
                            ) : (
                              <p className="text-foreground text-lg font-bold">
                                {detailsDoc.formData?.[
                                  field.key
                                ]?.toString() || (
                                  <span className="text-muted-foreground italic opacity-30">
                                    Vazio
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence Section */}
                    {detailsDoc.evidence && detailsDoc.evidence.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-500/20 text-brand-500 h-8 w-1 rounded-full" />
                          <h4 className="text-xl font-black tracking-tight italic">
                            Anexos de Evidência
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {detailsDoc.evidence.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-brand-500/5 group hover:bg-brand-500/10 flex items-center justify-between rounded-2xl border border-white/5 p-4 transition-all"
                            >
                              <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-brand-500/20 text-brand-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                                  <Paperclip size={24} />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-foreground truncate font-bold">
                                    {item.fileName}
                                  </p>
                                  <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                    Documento Base
                                  </p>
                                </div>
                              </div>
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl text-white opacity-40 transition-all hover:scale-110 hover:opacity-100"
                              >
                                <Download size={20} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
