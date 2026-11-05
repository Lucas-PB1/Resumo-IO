"use client"

import React, { useEffect, useState } from "react"
import { FolderTree, Plus, Trash2, X } from "lucide-react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  taxonomyService,
  type Category,
} from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm"

const SUGGESTIONS = [
  "Cível",
  "Trabalhista",
  "Família",
  "Consumidor",
  "Previdenciário",
  "Criminal",
  "Contratos",
]

export default function CategoriesClient() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!user) return
    taxonomyService
      .getCategories(user.uid)
      .then(setCategories)
      .catch((err) => console.error("Failed to fetch categories", err))
      .finally(() => setLoading(false))
  }, [user])

  const addCategory = async (raw: string) => {
    const name = raw.trim()
    if (!user || !name) return
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.info(`"${name}" já existe`)
      return
    }
    setAdding(true)
    try {
      const id = await taxonomyService.addCategory(name, user.uid)
      setCategories((prev) => [
        ...prev,
        { id, name, subcategories: [], ownerId: user.uid },
      ])
      setNewCatName("")
    } catch (err) {
      console.error("Add category error", err)
      toast.error("Não foi possível criar a categoria")
    } finally {
      setAdding(false)
    }
  }

  const deleteCategory = async (category: Category) => {
    const ok = await confirm({
      title: `Excluir "${category.name}"?`,
      description:
        category.subcategories.length > 0
          ? `As ${category.subcategories.length} subcategorias também serão removidas. Modelos e documentos não são apagados.`
          : "Modelos e documentos não são apagados.",
      confirmLabel: "Excluir",
      tone: "danger",
    })
    if (!ok) return
    try {
      await taxonomyService.deleteCategory(category.id)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
    } catch (err) {
      console.error("Delete category error", err)
      toast.error("Não foi possível excluir a categoria")
    }
  }

  const addSubcategory = async (category: Category, raw: string) => {
    const name = raw.trim()
    if (!name) return false
    if (
      category.subcategories.some((s) => s.toLowerCase() === name.toLowerCase())
    ) {
      toast.info(`"${name}" já existe em ${category.name}`)
      return false
    }
    try {
      await taxonomyService.addSubcategory(category.id, name)
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id
            ? { ...c, subcategories: [...c.subcategories, name] }
            : c
        )
      )
      return true
    } catch (err) {
      console.error("Add subcategory error", err)
      toast.error("Não foi possível adicionar a subcategoria")
      return false
    }
  }

  const deleteSubcategory = async (category: Category, name: string) => {
    try {
      await taxonomyService.deleteSubcategory(category.id, name)
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id
            ? { ...c, subcategories: c.subcategories.filter((s) => s !== name) }
            : c
        )
      )
      toast.success(`"${name}" removida`, {
        action: {
          label: "Desfazer",
          onClick: () =>
            addSubcategory({ ...category, subcategories: [] }, name),
        },
      })
    } catch (err) {
      console.error("Delete subcategory error", err)
      toast.error("Não foi possível remover a subcategoria")
    }
  }

  const unusedSuggestions = SUGGESTIONS.filter(
    (s) => !categories.some((c) => c.name.toLowerCase() === s.toLowerCase())
  )

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Categorias"
        description="Agrupe modelos e documentos por área de atuação. Subcategorias ajudam a filtrar o histórico."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          addCategory(newCatName)
        }}
        className="mb-3 flex gap-2"
      >
        <Input
          aria-label="Nova categoria"
          placeholder="Nova categoria, ex.: Trabalhista"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
        />
        <Button type="submit" isLoading={adding} disabled={!newCatName.trim()}>
          {!adding && <Plus size={16} />} Criar
        </Button>
      </form>

      {!loading && unusedSuggestions.length > 0 && categories.length < 4 && (
        <div className="text-muted-foreground mb-8 flex flex-wrap items-center gap-1.5 text-[13px]">
          Sugestões:
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addCategory(s)}
              className="border-border-strong hover:bg-muted hover:text-foreground rounded-full border border-dashed px-2.5 py-0.5"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria"
          description="Crie uma acima ou use uma das sugestões."
        />
      ) : (
        <ul className="space-y-3">
          {[...categories]
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
            .map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onDelete={() => deleteCategory(category)}
                onAddSub={(name) => addSubcategory(category, name)}
                onDeleteSub={(name) => deleteSubcategory(category, name)}
              />
            ))}
        </ul>
      )}
    </div>
  )
}

function CategoryItem({
  category,
  onDelete,
  onAddSub,
  onDeleteSub,
}: {
  category: Category
  onDelete: () => void
  onAddSub: (name: string) => Promise<boolean>
  onDeleteSub: (name: string) => void
}) {
  const [value, setValue] = useState("")

  return (
    <li className="bg-card border-border group rounded-xl border p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-medium">{category.name}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir ${category.name}`}
          onClick={onDelete}
          className="hover:text-danger md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {category.subcategories.map((sub) => (
          <span
            key={sub}
            className="bg-muted inline-flex h-7 items-center gap-1 rounded-md pr-1 pl-2.5 text-[13px]"
          >
            {sub}
            <button
              type="button"
              aria-label={`Remover ${sub}`}
              onClick={() => onDeleteSub(sub)}
              className="text-subtle-foreground hover:text-foreground hover:bg-border rounded p-0.5"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (await onAddSub(value)) setValue("")
          }}
        >
          <input
            aria-label={`Nova subcategoria em ${category.name}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+ subcategoria"
            className="placeholder:text-subtle-foreground focus:border-border-strong focus:bg-input h-7 w-36 rounded-md border border-transparent bg-transparent px-2 text-[13px] outline-none"
          />
        </form>
      </div>
    </li>
  )
}
