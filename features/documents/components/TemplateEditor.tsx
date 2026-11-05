"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileStack, FileUp } from "lucide-react"
import { useTemplateEditor } from "@/features/documents/hooks/useTemplateEditor"
import { TemplateFieldList } from "./TemplateFieldList"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[12px]">
    {children}
  </code>
)

export function TemplateEditor({ templateId }: { templateId?: string }) {
  const editor = useTemplateEditor(templateId)
  const router = useRouter()
  const toast = useToast()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const onFile = async (file?: File | null) => {
    if (!file) return
    const error = await editor.selectFile(file)
    if (error)
      toast.error("Não foi possível usar este arquivo", { description: error })
  }

  const onSave = async () => {
    try {
      const id = await editor.save()
      if (editor.isNew) {
        toast.success("Modelo cadastrado", {
          action: {
            label: "Preencher agora",
            onClick: () => router.push(`/dashboard/templates/${id}/fill`),
          },
        })
      } else {
        toast.success("Modelo atualizado")
      }
      router.push("/dashboard/templates")
    } catch (err) {
      console.error("Save error", err)
      toast.error("Não foi possível salvar o modelo", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  if (editor.loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )

  if (editor.notFound)
    return (
      <EmptyState
        icon={FileStack}
        title="Modelo não encontrado"
        action={
          <Link href="/dashboard/templates" className={buttonVariants()}>
            Voltar aos modelos
          </Link>
        }
      />
    )

  const hasFile = !!editor.file || !!editor.original

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/templates", label: "Modelos" }}
        title={editor.isNew ? "Novo modelo" : "Editar modelo"}
        description={
          editor.isNew
            ? "Envie um .docx com etiquetas entre chaves. O formulário é montado a partir delas."
            : "Altere nome, categoria e campos, ou substitua o arquivo Word."
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="bg-card border-border rounded-xl border shadow-xs">
            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <Label>Arquivo Word</Label>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    onFile(e.dataTransfer.files?.[0])
                  }}
                  className={cn(
                    "border-border-strong hover:bg-muted/60 flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center text-sm transition-colors",
                    dragging && "border-primary bg-accent",
                    editor.file && "border-solid"
                  )}
                >
                  <FileUp size={20} className="text-muted-foreground" />
                  {editor.file ? (
                    <>
                      <span className="max-w-full truncate font-medium">
                        {editor.file.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatBytes(editor.file.size)} · clique para trocar
                      </span>
                    </>
                  ) : editor.original ? (
                    <>
                      <span className="font-medium">Substituir arquivo</span>
                      <span className="text-muted-foreground text-xs">
                        Os rótulos já ajustados são mantidos
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        <span className="font-medium">Escolha o .docx</span> ou
                        arraste aqui
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Até 10 MB
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    onFile(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Nome do modelo</Label>
                <Input
                  id="tpl-name"
                  value={editor.name}
                  onChange={(e) => editor.setName(e.target.value)}
                  placeholder="Ex.: Petição inicial — consumidor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-cat">Categoria</Label>
                  <Select
                    id="tpl-cat"
                    value={editor.category}
                    onChange={(e) => editor.setCategory(e.target.value)}
                  >
                    <option value="">Nenhuma</option>
                    {editor.categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-sub">Subcategoria</Label>
                  <Select
                    id="tpl-sub"
                    value={editor.subcategory}
                    onChange={(e) => editor.setSubcategory(e.target.value)}
                    disabled={editor.subcategories.length === 0}
                  >
                    <option value="">—</option>
                    {editor.subcategories.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {editor.categories.length === 0 && (
                <p className="text-muted-foreground -mt-2 text-xs">
                  Organize por área (Cível, Trabalhista…) em{" "}
                  <Link
                    href="/dashboard/categories"
                    className="text-primary hover:underline"
                  >
                    Categorias
                  </Link>
                  .
                </p>
              )}
            </div>
            <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
              <Link
                href="/dashboard/templates"
                className={buttonVariants({ variant: "ghost" })}
              >
                Cancelar
              </Link>
              <Button
                onClick={onSave}
                isLoading={editor.saving}
                disabled={!editor.canSave}
              >
                {editor.isNew ? "Cadastrar modelo" : "Salvar alterações"}
              </Button>
            </div>
          </div>

          <details
            className="bg-card border-border group rounded-xl border shadow-xs"
            open={editor.isNew}
          >
            <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Como preparar o modelo no Word
              <span className="text-muted-foreground float-right transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="text-muted-foreground space-y-3 px-5 pb-5 text-[13px] leading-relaxed">
              <p>
                Escreva o documento normalmente e troque o que muda a cada caso
                por uma etiqueta: <Code>{"{nome_autor}"}</Code>,{" "}
                <Code>{"{numero_processo}"}</Code>, <Code>{"{vara}"}</Code>. Use
                letras minúsculas e <Code>_</Code> no lugar de espaços.
              </p>
              <p>O tipo do campo é sugerido pelo nome da etiqueta:</p>
              <ul className="space-y-1.5">
                <li>
                  <Code>{"{data_audiencia}"}</Code> — começa com <em>data</em> →
                  seletor de data, sai como 12/03/2026
                </li>
                <li>
                  <Code>{"{telefone_cliente}"}</Code> → telefone com máscara
                </li>
                <li>
                  <Code>{"{resumo_fatos}"}</Code>,{" "}
                  <Code>{"{descricao_...}"}</Code>,{" "}
                  <Code>{"{observacoes}"}</Code> → texto longo
                </li>
                <li>
                  <Code>{"{%foto_local}"}</Code> ou{" "}
                  <Code>{"{imagem_...}"}</Code> → imagem
                </li>
              </ul>
              <p>
                Dica: digite a etiqueta inteira de uma vez no Word. Se a
                formatação mudar no meio dela, o Word pode quebrá-la e ela não
                será encontrada.
              </p>
            </div>
          </details>
        </div>

        <TemplateFieldList
          fields={editor.fields}
          isScanning={editor.scanning}
          emptyMessage={
            hasFile
              ? "Nenhuma etiqueta encontrada no arquivo. Confira se elas estão entre chaves, como {nome_cliente}."
              : "Envie o arquivo .docx para encontrar as etiquetas automaticamente."
          }
          onChange={editor.updateField}
          onRemove={editor.removeField}
          onMove={editor.moveField}
        />
      </div>
    </div>
  )
}
