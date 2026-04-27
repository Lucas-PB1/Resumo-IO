"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowLeft, Upload, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { templateService } from "@/features/documents/services/template.service"
import type { TemplateField } from "@/features/documents/services/template.service"
import { fileService } from "@/features/documents/services/file.service"
import { placeholderService } from "@/features/documents/services/placeholder.service"
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
        const { userService } =
          await import("@/features/user/services/user.service")
        const { taxonomyService } =
          await import("@/features/documents/services/taxonomy.service")

        const [profile, catData] = await Promise.all([
          userService.getUserProfile(user.uid),
          taxonomyService.getCategories(user.uid),
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
    const cat = categories.find((c) => c.name === val)
    setCategory(val)
    setSelectedCategoryId(cat?.id || "")
    setSubcategory("") // Reset subcategory when category changes
  }

  const scanPlaceholders = async (file: File) => {
    try {
      setIsScanning(true)
      setFields(await placeholderService.extractFields(file))
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
      await templateService.saveTemplate({
        name: templateName,
        fileUrl,
        storagePath,
        fields,
        ownerId: user.uid,
        category,
        subcategory,
        authorId: user.uid,
        authorName:
          authorName || user.displayName || user.email || "Autor Desconhecido",
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

          <Card className="bg-card/60 border-brand-500/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
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
                <p className="text-foreground font-bold">2. Texto Longo</p>
                <p className="text-muted-foreground leading-relaxed">
                  Para campos com vários parágrafos, use uma chave comum e
                  altere o tipo para{" "}
                  <span className="text-brand-500 font-bold">Texto Longo</span>.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-bold">3. Telefone</p>
                <p className="text-muted-foreground leading-relaxed">
                  Chaves como{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{telefone}`}</code>{" "}
                  já são sugeridas como telefone, ou você pode selecionar esse
                  tipo manualmente.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-bold">4. Imagens e Fotos</p>
                <p className="text-muted-foreground leading-relaxed">
                  No Word, use o símbolo{" "}
                  <span className="text-brand-500 font-bold">%</span> para
                  imagens:{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{%foto_vistoria}`}</code>
                  . Isso garante que o sistema insira a foto e não o texto.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <TemplateFieldList
            fields={fields}
            isScanning={isScanning}
            emptyMessage="Suba um arquivo .docx para identificar as chaves automaticamente."
            onChange={updateField}
            onRemove={removeField}
          />
        </div>
      </div>
    </div>
  )
}
