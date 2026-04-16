"use client"

import React, { useEffect, useState } from "react"
import { Plus, Trash2, Tag, FolderTree, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { taxonomyService, Category } from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function CategoriesPage() {
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
      setCategories([...categories, { id, name: newCatName.trim(), subcategories: [], ownerId: user.uid }])
      setNewCatName("")
    } catch (err) {
      console.error("Add category error", err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Todas as subcategorias serão removidas.")) return
    try {
      await taxonomyService.deleteCategory(id)
      setCategories(categories.filter(c => c.id !== id))
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
      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, subcategories: [...c.subcategories, subName] } : c
      ))
      setNewSubNames({ ...newSubNames, [categoryId]: "" })
    } catch (err) {
      console.error("Add subcategory error", err)
      alert("Erro ao adicionar subcategoria.")
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subName: string) => {
    if (!confirm(`Deseja remover a subcategoria "${subName}"?`)) return
    try {
      await taxonomyService.deleteSubcategory(categoryId, subName)
      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, subcategories: c.subcategories.filter(s => s !== subName) } : c
      ))
    } catch (err) {
      console.error("Delete subcategory error", err)
      alert("Erro ao excluir subcategoria.")
    }
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Carregando taxonomia...</div>

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <div className="space-y-1 text-center md:text-left">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center justify-center md:justify-start gap-4">
          Categorias <Tag className="text-brand-500" />
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Gerencie a organização dos seus modelos e documentos.
        </p>
      </div>

      <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="bg-brand-500 h-2 w-full" />
        <CardHeader className="p-8">
          <CardTitle>Nova Categoria</CardTitle>
          <CardDescription>Crie um agrupador principal para seus arquivos.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 flex gap-4">
          <Input 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nome da categoria (ex: Jurídico, RH)"
            className="bg-muted/30 h-14 rounded-2xl border-none text-lg font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} size="lg" className="h-14 px-8 rounded-2xl shadow-brand-500/20 shadow-xl">
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
              <Card className="bg-card/40 border-none shadow-xl backdrop-blur-sm group overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <FolderTree className="text-brand-500" size={24} />
                      {cat.name}
                    </CardTitle>
                    <CardDescription>{cat.subcategories.length} subcategorias cadastradas</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={20} />
                  </Button>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map(sub => (
                      <div key={sub} className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 group/sub">
                        {sub}
                        <button 
                          onClick={() => handleDeleteSubcategory(cat.id, sub)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 max-w-md pt-4 border-t border-white/5">
                    <Input 
                      placeholder="Nova subcategoria..."
                      value={newSubNames[cat.id] || ""}
                      onChange={(e) => setNewSubNames({ ...newSubNames, [cat.id]: e.target.value })}
                      className="bg-muted/20 border-none h-10 rounded-xl text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddSubcategory(cat.id)}
                      className="border-brand-500/20 text-brand-500 hover:bg-brand-500 rounded-xl font-bold h-10 hover:text-white"
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
             <Tag className="mx-auto text-muted-foreground/30 mb-4" size={48} />
             <p className="text-muted-foreground font-medium italic">Nenhuma categoria cadastrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
