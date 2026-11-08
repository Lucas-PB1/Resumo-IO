"use client"

import React, { use, useCallback, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  FileDown,
  FileText,
  Pencil,
  RotateCcw,
} from "lucide-react"

import { useDocumentForm } from "@/features/documents/hooks/useDocumentForm"
import type { OutputFormat } from "@/features/documents/hooks/useDocumentForm"
import {
  FieldInput,
  fieldDomId,
} from "@/features/documents/components/FieldInput"
import { DocumentPreview } from "@/features/documents/components/DocumentPreview"
import { EvidencePanel } from "@/features/documents/components/EvidencePanel"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function FillReportPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const form = useDocumentForm(params.id, {
    editDocId: searchParams.get("editDocId"),
    fromDocId: searchParams.get("fromDocId"),
  })
  const [activeField, setActiveField] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form")

  const {
    template,
    editingDoc,
    formData,
    filled,
    total,
    generating,
    saveState,
  } = form

  const focusField = useCallback((key: string) => {
    setMobileTab("form")
    setActiveField(key)
    window.setTimeout(() => {
      const el = document.getElementById(fieldDomId(key))
      el?.scrollIntoView({ block: "center", behavior: "smooth" })
      el?.focus({ preventScroll: true })
    }, 50)
  }, [])

  const handleGenerate = async (format: OutputFormat) => {
    if (!template) return
    const empty = template.fields.filter((f) => {
      const v = formData[f.key]
      return v === null || v === undefined || String(v).trim() === ""
    })
    if (empty.length > 0) {
      const names = empty
        .slice(0, 4)
        .map((f) => f.label)
        .join(", ")
      const ok = await confirm({
        title: `${empty.length} ${empty.length === 1 ? "campo vazio" : "campos vazios"}`,
        description: `${names}${empty.length > 4 ? "…" : ""} ${empty.length === 1 ? "ficará" : "ficarão"} em branco no documento. Gerar mesmo assim?`,
        confirmLabel: "Gerar assim mesmo",
        cancelLabel: "Revisar",
      })
      if (!ok) {
        focusField(empty[0].key)
        return
      }
    }

    try {
      const saved = await form.generate(format)
      toast.success("Documento gerado", {
        description: `${saved.fileName} foi baixado e salvo no histórico.`,
        action: {
          label: "Ver histórico",
          onClick: () => router.push("/dashboard/documents"),
        },
      })
    } catch (err) {
      console.error("Generation error", err)
      toast.error(
        format === "pdf"
          ? "Não foi possível gerar o PDF"
          : "Não foi possível gerar o arquivo Word",
        {
          description:
            err instanceof Error && err.message
              ? err.message
              : "Tente novamente em instantes.",
        }
      )
    }
  }

  const handleImage = (key: string, file: File) => {
    const error = form.setImage(key, file)
    if (error) toast.error(error)
  }

  const handleAddEvidence = (files: File[]) => {
    const error = form.addEvidence(files)
    if (error) toast.error("Anexo não permitido", { description: error })
  }

  if (form.loading) return <FillSkeleton />

  if (form.notFound || !template)
    return (
      <EmptyState
        icon={FileText}
        title="Modelo não encontrado"
        description="Ele pode ter sido excluído ou você não tem acesso a ele."
        action={
          <Link href="/dashboard/templates" className={buttonVariants()}>
            Ver meus modelos
          </Link>
        }
      />
    )

  const progress = total ? Math.round((filled / total) * 100) : 0

  return (
    <div className="-mt-2">
      {/* Cabeçalho */}
      <div className="mb-6 space-y-3">
        <Link
          href={
            searchParams.get("editDocId")
              ? "/dashboard/documents"
              : "/dashboard/templates"
          }
          className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} />
          {searchParams.get("editDocId") ? "Documentos" : "Modelos"}
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-[26px] leading-tight font-medium tracking-[-0.01em] md:text-[30px]">
              {template.name}
            </h1>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {[template.category, template.subcategory]
                .filter(Boolean)
                .join(" › ") || "Sem categoria"}
              {editingDoc && (
                <Badge tone="primary">
                  <Pencil size={11} /> Editando {editingDoc.fileName}
                </Badge>
              )}
            </p>
          </div>
          <SaveIndicator state={saveState} />
        </div>
      </div>

      {saveState.kind === "restored" && (
        <div className="bg-accent text-accent-foreground mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm">
          <span>
            Recuperamos seu rascunho de {formatRelative(saveState.at)}.
          </span>
          <button
            type="button"
            onClick={form.discardDraft}
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            <RotateCcw size={14} /> Começar do zero
          </button>
        </div>
      )}

      {saveState.kind === "copied" && (
        <div className="bg-accent text-accent-foreground mb-6 rounded-lg px-4 py-2.5 text-sm">
          Novo documento com os dados de <strong>{saveState.from}</strong>.
          Ajuste o que mudou e gere.
        </div>
      )}

      {/* Abas no celular */}
      <div
        role="tablist"
        className="bg-muted mb-4 grid grid-cols-2 gap-1 rounded-lg p-1 lg:hidden"
      >
        {(["form", "preview"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              "text-muted-foreground h-8 rounded-md text-sm font-medium",
              mobileTab === tab && "bg-card text-foreground shadow-xs"
            )}
          >
            {tab === "form" ? "Formulário" : "Prévia"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        {/* Formulário */}
        <div
          className={cn("min-w-0", mobileTab !== "form" && "hidden lg:block")}
        >
          <div className="bg-card border-border rounded-xl border shadow-xs">
            <div className="border-border flex items-center gap-3 border-b px-5 py-3">
              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-muted-foreground tabular text-xs">
                {filled} de {total} campos
              </span>
            </div>

            <div className="space-y-5 p-5">
              {template.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onChange={(v) => form.setField(field.key, v)}
                  onImage={(file) => handleImage(field.key, file)}
                  onFocus={() => setActiveField(field.key)}
                />
              ))}
              {template.fields.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Este modelo não tem etiquetas. Edite o modelo para adicionar
                  campos.
                </p>
              )}
            </div>

            <div className="border-border border-t p-5">
              <EvidencePanel
                existing={editingDoc?.evidence ?? []}
                pending={form.evidenceFiles}
                onAdd={handleAddEvidence}
                onRemove={form.removeEvidence}
              />
            </div>

            {/* Ações */}
            <div className="bg-card/95 border-border sticky bottom-16 z-10 flex items-center gap-2 rounded-b-xl border-t px-5 py-3 backdrop-blur md:bottom-0">
              <p className="text-muted-foreground hidden flex-1 text-xs sm:block">
                {editingDoc
                  ? "Regerar atualiza o documento no histórico."
                  : "O arquivo é baixado e salvo no histórico."}
              </p>
              <Button
                variant="outline"
                onClick={() => handleGenerate("docx")}
                isLoading={generating === "docx"}
                disabled={!!generating}
                className="flex-1 sm:flex-none"
              >
                {generating !== "docx" && <FileDown size={16} />}
                Word
              </Button>
              <Button
                onClick={() => handleGenerate("pdf")}
                isLoading={generating === "pdf"}
                disabled={!!generating}
                className="flex-1 sm:flex-none"
              >
                {generating !== "pdf" && <FileDown size={16} />}
                {generating === "pdf" ? "Gerando PDF…" : "Gerar PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Prévia */}
        <div
          className={cn(
            "min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1",
            mobileTab !== "preview" && "hidden lg:block"
          )}
        >
          <DocumentPreview
            templateBuffer={form.templateBuffer}
            formData={formData}
            fields={template.fields}
            activeField={activeField}
            onFieldClick={focusField}
          />
          <p className="text-subtle-foreground mt-3 text-center text-xs">
            Campos destacados ainda estão vazios — clique neles para preencher.
          </p>
        </div>
      </div>
    </div>
  )
}

function SaveIndicator({
  state,
}: {
  state: ReturnType<typeof useDocumentForm>["saveState"]
}) {
  const [, force] = useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 30_000)
    return () => window.clearInterval(t)
  }, [])

  if (state.kind !== "draft") return null
  return (
    <p className="text-subtle-foreground flex items-center gap-1.5 text-xs">
      <span className="bg-success h-1.5 w-1.5 rounded-full" />
      Rascunho salvo {formatRelative(state.at)}
    </p>
  )
}

function FillSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="bg-card border-border space-y-5 rounded-xl border p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-[70vh] rounded-sm lg:block" />
      </div>
    </div>
  )
}
