"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { templateService } from "@/features/documents/services/template.service"
import type {
  DocumentTemplate,
  TemplateField,
} from "@/features/documents/services/template.service"
import { fileService } from "@/features/documents/services/file.service"
import { placeholderService } from "@/features/documents/services/placeholder.service"
import { taxonomyService } from "@/features/documents/services/taxonomy.service"
import type { Category } from "@/features/documents/services/taxonomy.service"
import { TemplateFieldList } from "@/features/documents/components/TemplateFieldList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
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
      setFields(await placeholderService.extractFields(file, fields))
    } catch (err) {
      console.error("Scanning error", err)
      alert(
        err instanceof Error
          ? err.message
          : "Erro ao ler o arquivo. Certifique-se de que é um .docx válido."
      )
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validation = fileService.validateTemplateFile(selectedFile)
      if (!validation.ok) {
        alert(validation.message)
        e.target.value = ""
        return
      }

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
          <Card className="bg-card/60 border-white/10 shadow-2xl backdrop-blur-2xl">
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
          <TemplateFieldList
            fields={fields}
            isScanning={isScanning}
            emptyMessage="Substitua o arquivo .docx para detectar novas etiquetas."
            onChange={updateField}
            onRemove={removeField}
          />
        </div>
      </div>
    </div>
  )
}
