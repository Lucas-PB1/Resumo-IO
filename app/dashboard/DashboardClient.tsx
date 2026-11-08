"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Download, FileStack, Plus, Upload } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { useProfile } from "@/features/user/hooks/useProfile"
import { useTemplates } from "@/features/documents/hooks/useTemplates"
import { useNewDocument } from "@/features/documents/components/NewDocumentPicker"
import {
  documentService,
  type GeneratedDocument,
} from "@/features/documents/services/document.service"
import {
  draftService,
  type DocumentDraft,
} from "@/features/documents/services/draft.service"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { FileChip } from "@/components/ui/file-chip"
import { formatRelative, greeting } from "@/lib/format"

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function DashboardClient() {
  const { user } = useAuth()
  const { firstName } = useProfile()
  const { open: openPicker } = useNewDocument()
  const { templates, loading: templatesLoading } = useTemplates()
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const drafts = useMemo<DocumentDraft[]>(
    () => (user ? draftService.list(user.uid) : []),
    [user]
  )

  useEffect(() => {
    if (!user) return
    documentService
      .getDocuments(user.uid)
      .then(setDocuments)
      .catch((err) => console.error("Dashboard data error", err))
      .finally(() => setDocsLoading(false))
  }, [user])

  const loading = docsLoading || templatesLoading

  const thisMonth = useMemo(() => {
    const now = new Date()
    return documents.filter((d) => {
      const date = d.createdAt.toDate()
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      )
    }).length
  }, [documents])

  const topTemplates = useMemo(() => {
    const usage = new Map<string, number>()
    documents.forEach((d) =>
      usage.set(d.templateId, (usage.get(d.templateId) ?? 0) + 1)
    )
    return [...templates]
      .sort((a, b) => (usage.get(b.id!) ?? 0) - (usage.get(a.id!) ?? 0))
      .slice(0, 4)
      .map((t) => ({ ...t, uses: usage.get(t.id!) ?? 0 }))
  }, [templates, documents])

  const validDrafts = drafts.filter((d) =>
    templates.some((t) => t.id === d.templateId)
  )

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm first-letter:uppercase">
            {today}
          </p>
          <h1 className="font-serif text-[32px] leading-tight font-medium tracking-[-0.01em]">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          {!loading && (
            <p className="text-muted-foreground text-[15px]">
              {thisMonth === 0
                ? "Nenhum documento gerado este mês ainda."
                : `${thisMonth} ${thisMonth === 1 ? "documento gerado" : "documentos gerados"} este mês.`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/templates/new"
            className={buttonVariants({ variant: "outline" })}
          >
            <Upload size={16} /> Enviar modelo
          </Link>
          <Button onClick={openPicker}>
            <Plus size={16} /> Novo documento
          </Button>
        </div>
      </header>

      {!loading && templates.length === 0 && <OnboardingCard />}

      {validDrafts.length > 0 && (
        <Section title="Continuar de onde parou">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {validDrafts.slice(0, 3).map((d) => (
              <Link
                key={d.templateId}
                href={`/dashboard/templates/${d.templateId}/fill`}
                className="bg-card border-border hover:border-border-strong group rounded-xl border p-4 shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium">
                    {d.templateName}
                  </p>
                  <ArrowRight
                    size={16}
                    className="text-subtle-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Rascunho · editado {formatRelative(d.updatedAt)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${d.total ? (d.filled / d.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground tabular text-xs">
                    {d.filled}/{d.total}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {(loading || topTemplates.length > 0) && (
        <Section
          title="Seus modelos"
          action={
            <Link
              href="/dashboard/templates"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Ver todos
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[92px] rounded-xl" />
                ))
              : topTemplates.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/templates/${t.id}/fill`}
                    className="bg-card border-border hover:border-border-strong group flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-colors"
                  >
                    <div>
                      <p className="line-clamp-2 text-sm font-medium">
                        {t.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {t.category || "Sem categoria"}
                      </p>
                    </div>
                    <p className="text-subtle-foreground group-hover:text-primary mt-3 flex items-center gap-1 text-xs font-medium">
                      Preencher <ArrowRight size={12} />
                      {t.uses > 0 && (
                        <span className="text-subtle-foreground ml-auto font-normal">
                          {t.uses}× usado
                        </span>
                      )}
                    </p>
                  </Link>
                ))}
          </div>
        </Section>
      )}

      <Section
        title="Documentos recentes"
        action={
          documents.length > 0 && (
            <Link
              href="/dashboard/documents"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Ver histórico
            </Link>
          )
        }
      >
        {loading ? (
          <div className="bg-card border-border divide-border divide-y rounded-xl border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-9 w-9" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="Nenhum documento ainda"
            description="Os documentos que você gerar aparecem aqui, prontos para baixar ou editar."
          />
        ) : (
          <ul className="bg-card border-border divide-border divide-y rounded-xl border shadow-xs">
            {documents.slice(0, 6).map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-3 px-3.5 py-3"
              >
                <FileChip fileName={doc.fileName} />
                <Link
                  href={`/dashboard/templates/${doc.templateId}/fill?editDocId=${doc.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium group-hover:underline">
                    {doc.fileName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {doc.templateName}
                    {doc.category ? ` · ${doc.category}` : ""}
                  </p>
                </Link>
                <span className="text-muted-foreground hidden text-xs sm:block">
                  {formatRelative(doc.createdAt.toDate())}
                </span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Baixar ${doc.fileName}`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                  })}
                >
                  <Download size={15} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function OnboardingCard() {
  const steps = [
    {
      title: "Prepare um modelo no Word",
      body: (
        <>
          Onde a informação muda, escreva uma etiqueta entre chaves:{" "}
          <code className="bg-muted rounded px-1 font-mono text-[12px]">
            {"{nome_cliente}"}
          </code>
          ,{" "}
          <code className="bg-muted rounded px-1 font-mono text-[12px]">
            {"{data_audiencia}"}
          </code>
          .
        </>
      ),
    },
    {
      title: "Envie o .docx",
      body: "O sistema lê as etiquetas e monta o formulário sozinho — datas, telefones e textos longos são detectados pelo nome.",
    },
    {
      title: "Preencha e gere",
      body: "Veja o documento sendo montado ao lado enquanto digita e baixe em Word ou PDF.",
    },
  ]

  return (
    <div className="bg-card border-border rounded-xl border p-6 shadow-xs">
      <h2 className="font-serif text-xl font-medium">Comece em três passos</h2>
      <ol className="mt-5 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="space-y-1.5">
            <span className="bg-accent text-accent-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              {i + 1}
            </span>
            <p className="text-sm font-medium">{s.title}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
      <Link
        href="/dashboard/templates/new"
        className={buttonVariants({ className: "mt-6" })}
      >
        <Upload size={16} /> Enviar meu primeiro modelo
      </Link>
    </div>
  )
}
