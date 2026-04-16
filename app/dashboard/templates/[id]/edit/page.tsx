"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  Upload,
  Trash2,
  Hash,
  Type,
  Image as LucideImage,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import PizZip from "pizzip"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  templateService,
  TemplateField,
  DocumentTemplate,
} from "@/features/documents/services/template.service"
import {
  taxonomyService,
  Category,
} from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"

export default function EditTemplatePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [templateName, setTemplateName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchData() {
      if (!user || !id) {
        if (!authLoading) setDataLoading(false)
        return
      }
      try {
        const [template, catData] = await Promise.all([
          templateService.getTemplateById(id),
          taxonomyService.getCategories(user.uid),
        ])

        if (template) {
          setTemplateName(template.name)
          setFields(template.fields)
          setCategory(template.category || "")
          setSubcategory(template.subcategory || "")

          const foundCat = catData.find((c) => c.name === template.category)
          if (foundCat) setSelectedCategoryId(foundCat.id)
        }

        setCategories(catData)
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [user, id, authLoading])

  const handleCategoryChange = (val: string) => {
    const cat = categories.find((c) => c.name === val)
    setCategory(val)
    setSelectedCategoryId(cat?.id || "")
    setSubcategory("")
  }

  const scanPlaceholders = async (file: File) => {
    try {
      setIsScanning(true)
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)
      const content = zip.files["word/document.xml"].asText()

      const tagRegex = /\{([^{}]*)\}/g
      let tagMatch
      const foundTags = new Set<string>()

      while ((tagMatch = tagRegex.exec(content)) !== null) {
        const rawTag = tagMatch[1].replace(/<[^>]*>/g, "").trim()
        if (!rawTag) continue
        foundTags.add(rawTag)
      }

      const newFields: TemplateField[] = Array.from(foundTags)
        .map((tag) => {
          let cleanKey = tag
          let type: "text" | "image" = "text"

          if (tag.startsWith("%")) {
            cleanKey = tag.slice(1)
            type = "image"
          } else if (
            tag.startsWith("/") ||
            tag.startsWith("@") ||
            tag.startsWith("^") ||
            tag.startsWith("#")
          ) {
            return null
          } else if (
            tag.toLowerCase().includes("foto") ||
            tag.toLowerCase().includes("imagem") ||
            tag.toLowerCase().includes("image")
          ) {
            type = "image"
          }

          const existing = fields.find((f) => f.key === cleanKey)
          if (existing) return existing

          return {
            key: cleanKey,
            label:
              cleanKey.charAt(0).toUpperCase() +
              cleanKey.slice(1).replace(/_/g, " "),
            type,
          }
        })
        .filter((f): f is TemplateField => f !== null)

      setFields(newFields)
    } catch (err) {
      console.error("Scanning error", err)
      alert("Erro ao ler o arquivo. Certifique-se de que é um .docx válido.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      scanPlaceholders(selectedFile)
    }
  }

  const handleSave = async () => {
    if (!user || !id || !templateName) return
    setIsUploading(true)
    try {
      const updates: Partial<DocumentTemplate> = {
        name: templateName,
        fields,
        category,
        subcategory,
      }

      if (file) {
        const { fileUrl, storagePath } =
          await templateService.uploadTemplateFile(file, user.uid)
        updates.fileUrl = fileUrl
        updates.storagePath = storagePath

        // Cleanup old file? (Optional, but good practice)
        // if (originalTemplate?.storagePath) templateService.deleteObject(ref(storage, originalTemplate.storagePath))
      }

      await templateService.updateTemplate(id, updates)
      router.push("/dashboard/templates")
    } catch (err) {
      console.error("Save error", err)
      alert("Erro ao salvar o modelo.")
    } finally {
      setIsUploading(false)
    }
  }

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  if (authLoading || (dataLoading && user))
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando dados do modelo...
      </div>
    )

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/templates">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-brand-500/10 text-brand-500 rounded-xl"
          >
            <ArrowLeft />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-foreground text-4xl font-black tracking-tight">
            Editar Modelo
          </h1>
          <p className="text-foreground/70 text-lg font-medium">
            Modifique as configurações e etiquetas deste modelo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-1">
          <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Nome do Modelo
                </Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-muted/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                    Categoria
                  </Label>
                  <Select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="bg-muted/20"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                    Subcategoria
                  </Label>
                  <Select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="bg-muted/20"
                    disabled={!category}
                  >
                    <option value="">Selecione...</option>
                    {categories
                      .find((c) => c.id === selectedCategoryId)
                      ?.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Substituir Arquivo (.docx)
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${file ? "border-brand-500 bg-brand-500/5 text-brand-500" : "hover:border-brand-500/50 border-white/10"}`}
                >
                  <Upload size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold">
                    {file
                      ? file.name
                      : "Clique para substituir o arquivo atual"}
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".docx"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSave}
                disabled={fields.length === 0 || isUploading}
                className="shadow-brand-500/30 h-14 w-full text-lg font-black shadow-xl"
              >
                {isUploading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Etiquetas Detectadas</CardTitle>
                  <CardDescription>
                    Configure como os dados serão inseridos neste modelo.
                  </CardDescription>
                </div>
                <div className="text-brand-500 bg-brand-500/10 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase">
                  <Hash size={14} /> {fields.length} campos
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="text-muted-foreground animate-pulse py-20 text-center">
                  Escaneando etiquetas no Word...
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-muted/10 group hover:bg-muted/20 relative flex flex-col gap-4 rounded-3xl border border-white/5 p-6 transition-all sm:p-5"
                    >
                      {/* Delete Button - Top Right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(index)}
                        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-red-500/5 text-red-400 transition-opacity hover:bg-red-500 hover:text-white sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </Button>

                      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-brand-500" />
                            <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                              Chave:{" "}
                              <span className="text-foreground">
                                {field.key}
                              </span>
                            </Label>
                          </div>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(index, { label: e.target.value })
                            }
                            placeholder="Nome no formulário"
                            className="bg-background/40 h-12 rounded-xl border-none font-bold placeholder:font-medium placeholder:opacity-30"
                          />
                        </div>

                        <div className="w-full space-y-3 sm:w-56">
                          <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                            {field.type === "text" ? (
                              <Type size={14} />
                            ) : (
                              <LucideImage size={14} />
                            )}
                            Tipo do Campo
                          </Label>
                          <Select
                            value={field.type}
                            onChange={(e) =>
                              updateField(index, {
                                type: e.target.value as "text" | "image",
                              })
                            }
                            className="bg-background/40 h-12 rounded-xl border-none font-bold"
                          >
                            <option value="text">Texto Simples</option>
                            <option value="image">Imagem / Foto</option>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
