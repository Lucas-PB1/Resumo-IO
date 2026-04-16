"use client"

import React, { useEffect, useState } from "react"
import { Plus, Trash2, Tag, FolderTree, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  taxonomyService,
  Category,
} from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function CategoriesClient() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState("")
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchCategories() {
      if (!user) return
      try {
        const data = await taxonomyService.getCategories(user.uid)
        setCategories(data)
      } catch (err) {
        console.error("Failed to fetch categories", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [user])

  const handleAddCategory = async () => {
    if (!user || !newCatName.trim()) return
    try {
      const id = await taxonomyService.addCategory(newCatName.trim(), user.uid)
      setCategories([
        ...categories,
        { id, name: newCatName.trim(), subcategories: [], ownerId: user.uid },
      ])
      setNewCatName("")
    } catch (err) {
      console.error("Add category error", err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta categoria? Todas as subcategorias serão removidas."
      )
    )
      return
    try {
      await taxonomyService.deleteCategory(id)
      setCategories(categories.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Delete category error", err)
      alert("Erro ao excluir categoria. Tente novamente.")
    }
  }

  const handleAddSubcategory = async (categoryId: string) => {
    const subName = newSubNames[categoryId]?.trim()
    if (!subName) return
    try {
      await taxonomyService.addSubcategory(categoryId, subName)
      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: [...c.subcategories, subName] }
            : c
        )
      )
      setNewSubNames({ ...newSubNames, [categoryId]: "" })
    } catch (err) {
      console.error("Add subcategory error", err)
      alert("Erro ao adicionar subcategoria.")
    }
  }

  const handleDeleteSubcategory = async (
    categoryId: string,
    subName: string
  ) => {
    if (!confirm(`Deseja remover a subcategoria "${subName}"?`)) return
    try {
      await taxonomyService.deleteSubcategory(categoryId, subName)
      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subcategories: c.subcategories.filter((s) => s !== subName),
              }
            : c
        )
      )
    } catch (err) {
      console.error("Delete subcategory error", err)
      alert("Erro ao excluir subcategoria.")
    }
  }

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando taxonomia...
      </div>
    )

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-20">
      <div className="space-y-1 text-center md:text-left">
        <h1 className="text-foreground flex items-center justify-center gap-4 text-4xl font-black tracking-tight md:justify-start">
          Categorias <Tag className="text-brand-500" />
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Gerencie a organização dos seus modelos e documentos.
        </p>
      </div>

      <Card className="bg-card/60 overflow-hidden border-none shadow-2xl backdrop-blur-md">
        <div className="bg-brand-500 h-2 w-full" />
        <CardHeader className="p-8">
          <CardTitle>Nova Categoria</CardTitle>
          <CardDescription>
            Crie um agrupador principal para seus arquivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 p-8 pt-0">
          <Input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nome da categoria (ex: Jurídico, RH)"
            className="bg-muted/30 h-14 rounded-2xl border-none text-lg font-medium"
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button
            onClick={handleAddCategory}
            size="lg"
            className="shadow-brand-500/20 h-14 rounded-2xl px-8 shadow-xl"
          >
            <Plus size={20} className="mr-2" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence>
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card/40 group overflow-hidden border-none shadow-xl backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <FolderTree className="text-brand-500" size={24} />
                      {cat.name}
                    </CardTitle>
                    <CardDescription>
                      {cat.subcategories.length} subcategorias cadastradas
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded-xl text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10"
                  >
                    <Trash2 size={20} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 p-8 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub}
                        className="bg-brand-500/10 text-brand-400 border-brand-500/20 group/sub flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
                      >
                        {sub}
                        <button
                          onClick={() => handleDeleteSubcategory(cat.id, sub)}
                          className="transition-colors hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex max-w-md items-center gap-3 border-t border-white/5 pt-4">
                    <Input
                      placeholder="Nova subcategoria..."
                      value={newSubNames[cat.id] || ""}
                      onChange={(e) =>
                        setNewSubNames({
                          ...newSubNames,
                          [cat.id]: e.target.value,
                        })
                      }
                      className="bg-muted/20 h-10 rounded-xl border-none text-sm"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddSubcategory(cat.id)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubcategory(cat.id)}
                      className="border-brand-500/20 text-brand-500 hover:bg-brand-500 h-10 rounded-xl font-bold hover:text-white"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {categories.length === 0 && (
          <div className="bg-card/20 rounded-3xl border-2 border-dashed border-white/5 py-20 text-center">
            <Tag className="text-muted-foreground/30 mx-auto mb-4" size={48} />
            <p className="text-muted-foreground font-medium italic">
              Nenhuma categoria cadastrada ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
