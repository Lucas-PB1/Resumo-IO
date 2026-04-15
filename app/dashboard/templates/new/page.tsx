"use client"

import React, { useState, useRef } from "react"
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
  const [isUploading, setIsUploading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scanPlaceholders = async (file: File) => {
    setIsScanning(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      // Extract XML content from document.xml
      const content = zip.files["word/document.xml"].asText()

      // Regex for {tag}
      const regex = /\{([^{}]*)\}/g
      const foundTags = new Set<string>()
      let match

      while ((match = regex.exec(content)) !== null) {
        // Clean tag from XML tags if any (Docxtemplater handles this, but we just want the key)
        const cleanTag = match[1].replace(/<[^>]*>/g, "").trim()
        if (cleanTag) foundTags.add(cleanTag)
      }

      const newFields: TemplateField[] = Array.from(foundTags).map((tag) => ({
        key: tag,
        label: tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " "),
        type:
          tag.includes("foto") ||
          tag.includes("imagem") ||
          tag.includes("image")
            ? "image"
            : "text",
      }))

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
                  Para fotos, comece a chave com "foto" ou "imagem":{" "}
                  <code className="bg-brand-500/10 text-brand-500 rounded-md px-1.5 py-0.5 font-mono">{`{foto_vistoria}`}</code>
                  .
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
                            updateField(index, { type: e.target.value as any })
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
