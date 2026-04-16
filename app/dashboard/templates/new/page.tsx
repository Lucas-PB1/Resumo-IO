"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  Upload,
  Save,
  Trash2,
  Hash,
  Type,
  Image as LucideImage,
  Table,
  Sparkles,
  X,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PizZip from "pizzip"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  templateService,
  TemplateField,
} from "@/features/documents/services/template.service"
import { taxonomyService, Category } from "@/features/documents/services/taxonomy.service"
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

export default function NewTemplatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [templateName, setTemplateName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [authorName, setAuthorName] = useState("")

  // Fetch user profile and categories
  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const { userService } = await import("@/features/user/services/user.service")
        const { taxonomyService } = await import("@/features/documents/services/taxonomy.service")
        
        const [profile, catData] = await Promise.all([
          userService.getUserProfile(user.uid),
          taxonomyService.getCategories(user.uid)
        ])

        if (profile) {
          setAuthorName(`${profile.firstName} ${profile.lastName}`)
        } else if (user.displayName) {
          setAuthorName(user.displayName)
        }
        
        setCategories(catData)
      } catch (err) {
        console.error("Failed to fetch data", err)
      }
    }
    fetchData()
  }, [user])

  const handleCategoryChange = (val: string) => {
    const cat = categories.find(c => c.name === val)
    setCategory(val)
    setSelectedCategoryId(cat?.id || "")
    setSubcategory("") // Reset subcategory when category changes
  }

  const scanPlaceholders = async (file: File) => {
    try {
      setIsScanning(true)
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)
      const content = zip.files["word/document.xml"].asText()

      // 1. Detect Loops and their columns
      // Regex to find {#tag}...{/tag}
      const loopRegex = /\{#([^}]+)\}([\s\S]*?)\{\/\1\}/g
      const fieldMap = new Map<string, TemplateField>()
      let loopMatch

      while ((loopMatch = loopRegex.exec(content)) !== null) {
        const loopKey = loopMatch[1].replace(/<[^>]*>/g, "").trim()
        const loopContent = loopMatch[2]
        
        // Find tags inside this loop
        const innerRegex = /\{([^{}#%/]*)\}/g
        const innerTags = new Set<string>()
        let innerMatch
        while ((innerMatch = innerRegex.exec(loopContent)) !== null) {
          const innerTag = innerMatch[1].replace(/<[^>]*>/g, "").trim()
          if (innerTag && innerTag !== loopKey) innerTags.add(innerTag)
        }

        fieldMap.set(loopKey, {
          key: loopKey,
          label: loopKey.charAt(0).toUpperCase() + loopKey.slice(1).replace(/_/g, " "),
          type: "table",
          columns: Array.from(innerTags)
        })
      }

      // 2. Detect regular tags (excluding what we found in loops)
      const tagRegex = /\{([^{}]*)\}/g
      let tagMatch
      while ((tagMatch = tagRegex.exec(content)) !== null) {
         const rawTag = tagMatch[1].replace(/<[^>]*>/g, "").trim()
         if (!rawTag) continue

         let cleanKey = rawTag
         let type: "text" | "image" | "table" = "text"

         if (rawTag.startsWith("%")) {
            cleanKey = rawTag.slice(1)
            type = "image"
         } else if (rawTag.startsWith("#")) {
            cleanKey = rawTag.slice(1)
            type = "table"
         } else if (rawTag.startsWith("/") || rawTag.startsWith("@") || rawTag.startsWith("^")) {
            continue
         } else if (
          rawTag.toLowerCase().includes("foto") ||
          rawTag.toLowerCase().includes("imagem") ||
          rawTag.toLowerCase().includes("image")
         ) {
           type = "image"
         }

         // If we already detected this as a loop, skip it or merge
         if (fieldMap.has(cleanKey)) continue

         fieldMap.set(cleanKey, {
           key: cleanKey,
           label: cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1).replace(/_/g, " "),
           type: type,
           columns: type === 'table' ? [] : undefined
         })
      }

      setFields(Array.from(fieldMap.values()))
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
      if (!templateName) setTemplateName(selectedFile.name.replace(".docx", ""))
      scanPlaceholders(selectedFile)
    }
  }

  const handleSave = async () => {
    if (!user || !file || !templateName) return
    setIsUploading(true)
    try {
      const { fileUrl, storagePath } = await templateService.uploadTemplateFile(
        file,
        user.uid
      )
      const cleanFields = fields.map(f => {
        const cleanField: any = {
          key: f.key,
          label: f.label,
          type: f.type,
        }
        if (f.type === 'table') {
          cleanField.columns = f.columns || []
        }
        return cleanField as TemplateField
      })

      await templateService.saveTemplate({
        name: templateName,
        fileUrl,
        storagePath,
        fields: cleanFields,
        ownerId: user.uid,
        category,
        subcategory,
        authorId: user.uid,
        authorName: authorName || user.displayName || user.email || "Autor Desconhecido",
      })
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
            Novo Modelo
          </h1>
          <p className="text-foreground/70 text-lg font-medium">
            Configure as etiquetas mutáveis do seu documento.
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
                  placeholder="Ex: Relatório Mensal"
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
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
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
                    {categories.find(c => c.id === selectedCategoryId)?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Arquivo Base (.docx)
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    file
                      ? "border-brand-500 bg-brand-500/5 text-brand-500"
                      : "hover:border-brand-500/50 border-white/10"
                  }`}
                >
                  <Upload size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold">
                    {file ? file.name : "Clique para subir o Word"}
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
                disabled={!file || fields.length === 0 || isUploading}
                className="shadow-brand-500/30 h-14 w-full text-lg font-black shadow-xl"
              >
                {isUploading ? "Salvando..." : "Finalizar Cadastro"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-brand-500/3 border-brand-500/10 overflow-hidden border border-none shadow-2xl backdrop-blur-md">
            <CardHeader className="bg-brand-500/10 pb-4">
              <CardTitle className="text-brand-500 flex items-center gap-2 text-sm font-black tracking-tighter uppercase">
                <Sparkles size={16} /> Guia de Formatação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6 text-sm">
              <div className="space-y-2">
                <p className="text-foreground font-bold">1. Texto Simples</p>
                <p className="text-muted-foreground leading-relaxed">
                  Use chaves simples:{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{nome}`}</code>{" "}
                  ou{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{data}`}</code>
                  .
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-bold">2. Imagens e Fotos</p>
                <p className="text-muted-foreground leading-relaxed">
                  No Word, use o símbolo <span className="text-brand-500 font-bold">%</span> para imagens:{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{%foto_vistoria}`}</code>
                  . Isso garante que o sistema insira a foto e não o texto.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-bold">3. Tabelas / Listas</p>
                <p className="text-muted-foreground leading-relaxed">
                  Inicie com{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{#itens}`}</code>{" "}
                  e feche com{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{/itens}`}</code>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Etiquetas Detectadas</CardTitle>
                  <CardDescription>
                    Mapeie os campos que serão preenchidos pelo usuário.
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
                      className="bg-muted/20 flex flex-col items-start gap-4 rounded-2xl border border-white/5 p-5 md:flex-row md:items-end"
                    >
                      <div className="flex w-full flex-col gap-4">
                        <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end">
                            <div className="flex-1 space-y-2">
                                <Label className="text-brand-500 text-[10px] font-black tracking-tighter uppercase">
                                Chave do Word:{" "}
                                <span className="text-foreground">{field.key}</span>
                                </Label>
                                <Input
                                value={field.label}
                                onChange={(e) =>
                                    updateField(index, { label: e.target.value })
                                }
                                placeholder="Nome amigável para o formulário"
                                className="bg-background/40"
                                />
                            </div>
                            <div className="w-full space-y-2 md:w-48">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase">
                                Tipo do Campo
                                </Label>
                                <Select
                                value={field.type}
                                onChange={(e) =>
                                    updateField(index, { type: e.target.value as any, columns: e.target.value === 'table' ? (field.columns || []) : undefined })
                                }
                                className="bg-background/40"
                                >
                                <option value="text">Texto Simples</option>
                                <option value="image">Imagem / Foto</option>
                                <option value="table">Tabela (Lista)</option>
                                </Select>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeField(index)}
                                className="mb-0.5 rounded-xl text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>

                        {field.type === 'table' && (
                            <div className="bg-brand-500/5 w-full space-y-3 rounded-2xl border border-brand-500/10 p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-brand-500 text-[10px] font-black uppercase">
                                        Colunas da Tabela (Etiquetas internas)
                                    </Label>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => {
                                            const col = prompt("Nome da etiqueta no Word (ex: preco)")
                                            if (col) updateField(index, { columns: [...(field.columns || []), col] })
                                        }}
                                        className="h-7 rounded-lg px-2 text-[10px]"
                                    >
                                        + Add Coluna
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(field.columns || []).map((col, colIdx) => (
                                        <div key={colIdx} className="bg-brand-500/10 text-brand-400 border-brand-500/20 flex items-center gap-2 rounded-lg border px-2 py-1 text-[10px] font-bold">
                                            {col}
                                            <button 
                                                onClick={() => updateField(index, { columns: (field.columns || []).filter((_, i) => i !== colIdx) })} 
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {(field.columns || []).length === 0 && (
                                        <p className="text-muted-foreground text-[10px] italic opacity-50">Nenhuma coluna definida. Use # ou adicione manualmente.</p>
                                    )}
                                </div>
                            </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {fields.length === 0 && !file && (
                    <div className="text-muted-foreground/50 py-20 text-center italic">
                      Suba um arquivo .docx para identificar as chaves
                      automaticamente.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
