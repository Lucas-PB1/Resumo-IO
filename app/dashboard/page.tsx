"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  Files, 
  Tag, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  FileSearch,
  ArrowRight
} from "lucide-react"
import { motion } from "motion/react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { templateService } from "@/features/documents/services/template.service"
import { documentService, GeneratedDocument } from "@/features/documents/services/document.service"
import { taxonomyService } from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState({
    templates: 0,
    documents: 0,
    categories: 0
  })
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [recentDocs, setRecentDocs] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return
      try {
        const [templates, documents, categories] = await Promise.all([
          templateService.getTemplates(user.uid),
          documentService.getDocuments(user.uid),
          taxonomyService.getCategories(user.uid)
        ])

        setStats({
          templates: templates.length,
          documents: documents.length,
          categories: categories.length
        })

        setRecentDocs(documents.slice(0, 5))

        // Process Timeline (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          return d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })
        }).reverse()

        const timelineMap = documents.reduce((acc: any, doc) => {
          const date = new Date(doc.createdAt.toDate()).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})

        setTimelineData(last7Days.map(date => ({
          name: date,
          total: timelineMap[date] || 0
        })))

        // Process Categories (Top 5)
        const catMap = documents.reduce((acc: any, doc) => {
          const cat = doc.category || "Sem Categoria"
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {})

        setCategoryData(Object.entries(catMap).map(([name, value]) => ({
          name,
          value
        })).sort((a: any, b: any) => b.value - a.value).slice(0, 5))

      } catch (err) {
        console.error("Dashboard data error", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"]

  if (loading) return (
    <div className="p-12 text-center text-muted-foreground animate-pulse">
      Carregando inteligência de dados...
    </div>
  )

  return (
    <div className="space-y-12 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-1"
        >
          <h1 className="text-4xl font-black tracking-tighter text-foreground">Dashboard Central</h1>
          <p className="text-muted-foreground text-lg font-medium flex items-center gap-2">
            Bem-vindo, <span className="text-brand-400">{user?.displayName || user?.email?.split('@')[0]}</span> 
            <TrendingUp size={18} className="text-brand-500" />
          </p>
        </motion.div>
        
        <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/dashboard/documents')} variant="outline" className="rounded-xl border-white/5 bg-white/5 h-12 px-6 font-bold hover:bg-white/10">
                Ver Histórico <Clock size={18} className="ml-2" />
            </Button>
            <Button onClick={() => router.push('/dashboard/templates')} className="rounded-xl h-12 px-6 font-black shadow-brand-500/20 shadow-xl gap-2">
                Novo Relatório <PlusCircle size={18} />
            </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Modelos Ativos", value: stats.templates, icon: Sparkles, color: "text-brand-500", bg: "bg-brand-500/10" },
          { label: "Documentos Gerados", value: stats.documents, icon: Files, color: "text-pink-500", bg: "bg-pink-500/10" },
          { label: "Categorias de Negócio", value: stats.categories, icon: Tag, color: "text-blue-500", bg: "bg-blue-500/10" }
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/60 border-none shadow-2xl backdrop-blur-md group hover:bg-card/80 transition-all border-b-2 border-transparent hover:border-brand-500/30">
              <CardContent className="p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-4xl font-black text-foreground">{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} ${kpi.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={28} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Production Timeline */}
        <Card className="lg:col-span-2 bg-card/40 border-none shadow-xl backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-8 pb-0">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">Produção Recente</CardTitle>
                  <CardDescription>Documentos gerados nos últimos 7 dias</CardDescription>
                </div>
                <div className="bg-brand-500/10 text-brand-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Tempo Real</div>
             </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff30" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff30" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e1b4b", border: "none", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8b5cf6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card className="bg-card/40 border-none shadow-xl backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-bold">Segmentação</CardTitle>
            <CardDescription>Por categoria principal</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: "#1e1b4b", border: "none", borderRadius: "16px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="mt-4 space-y-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground font-medium">{cat.name}</span>
                  </div>
                  <span className="text-foreground font-bold">{cat.value} items</span>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-muted-foreground text-center italic text-xs pt-10">Sem dados categóricos.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Recent Activity */}
         <Card className="bg-card/40 border-none shadow-xl backdrop-blur-sm">
            <CardHeader className="p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Atividade Recente</CardTitle>
                <CardDescription>Últimos documentos processados</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/documents')} className="text-brand-400 font-bold">Ver todos</Button>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-xl">
                      <FileSearch size={20} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold text-sm truncate max-w-[150px]">{doc.fileName}</p>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">{doc.category || 'Geral'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground font-medium hidden sm:block">
                      {new Date(doc.createdAt.toDate()).toLocaleDateString('pt-BR')}
                    </span>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={18} className="text-brand-500" />
                    </a>
                  </div>
                </div>
              ))}
              {recentDocs.length === 0 && (
                <p className="text-muted-foreground text-center italic py-4">Nenhuma atividade recente.</p>
              )}
            </CardContent>
         </Card>

         {/* Shortcuts & Quick Flows */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card 
              onClick={() => router.push('/dashboard/templates/new')}
              className="bg-brand-500/10 border-white/5 hover:border-brand-500/30 transition-all cursor-pointer group rounded-3xl"
            >
              <CardContent className="p-8 space-y-4">
                <div className="bg-brand-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/40">
                  <PlusCircle className="text-white" size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold">Novo Modelo</h4>
                  <p className="text-muted-foreground text-sm font-medium">Suba um arquivo DOCX e defina as etiquetas.</p>
                </div>
                <div className="pt-2 flex items-center text-brand-400 font-bold gap-2 text-sm group-hover:translate-x-1 transition-transform">
                  Começar agora <ArrowRight size={16} />
                </div>
              </CardContent>
            </Card>

            <Card 
              onClick={() => router.push('/dashboard/categories')}
              className="bg-card/40 border-none hover:bg-white/5 transition-all cursor-pointer group rounded-3xl"
            >
              <CardContent className="p-8 space-y-4">
                <div className="bg-pink-500/20 w-12 h-12 rounded-2xl flex items-center justify-center">
                  <Tag className="text-pink-500" size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold">Taxonomia</h4>
                  <p className="text-muted-foreground text-sm font-medium">Organize categorias e subcategorias.</p>
                </div>
                <div className="pt-2 flex items-center text-muted-foreground font-bold gap-2 text-sm group-hover:translate-x-1 transition-transform">
                  Gerenciar <ArrowRight size={16} />
                </div>
              </CardContent>
            </Card>
         </div>
      </div>
    </div>
  )
}
