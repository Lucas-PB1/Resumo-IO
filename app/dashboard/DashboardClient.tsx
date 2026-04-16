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
  ArrowRight,
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
  Cell,
} from "recharts"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { templateService } from "@/features/documents/services/template.service"
import {
  documentService,
  GeneratedDocument,
} from "@/features/documents/services/document.service"
import { taxonomyService } from "@/features/documents/services/taxonomy.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface TimelineData {
  name: string
  total: number
}

interface CategoryData {
  name: string
  value: number
}

export default function DashboardClient() {
  const { user } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    templates: 0,
    documents: 0,
    categories: 0,
  })
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [recentDocs, setRecentDocs] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return
      try {
        const [templates, documents, categories] = await Promise.all([
          templateService.getTemplates(user.uid),
          documentService.getDocuments(user.uid),
          taxonomyService.getCategories(user.uid),
        ])

        setStats({
          templates: templates.length,
          documents: documents.length,
          categories: categories.length,
        })

        setRecentDocs(documents.slice(0, 5))

        // Process Timeline (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })
        }).reverse()

        const timelineMap = documents.reduce(
          (acc: Record<string, number>, doc) => {
            const date = new Date(doc.createdAt.toDate()).toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "2-digit" }
            )
            acc[date] = (acc[date] || 0) + 1
            return acc
          },
          {}
        )

        setTimelineData(
          last7Days.map((date) => ({
            name: date,
            total: timelineMap[date] || 0,
          }))
        )

        // Process Categories (Top 5)
        const catMap = documents.reduce((acc: Record<string, number>, doc) => {
          const cat = doc.category || "Sem Categoria"
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {})

        setCategoryData(
          Object.entries(catMap)
            .map(([name, value]) => ({
              name,
              value,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
        )
      } catch (err) {
        console.error("Dashboard data error", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  const COLORS = ["#8a9a5b", "#c17c67", "#d4a373", "#7a8fa1", "#8b735b"]

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center">
        Carregando inteligência de dados...
      </div>
    )

  return (
    <div className="space-y-12 pb-20">
      {/* Header Area */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-foreground text-4xl font-black tracking-tighter">
            Dashboard Central
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-lg font-medium">
            Bem-vindo,{" "}
            <span className="text-dusty-blue">
              {user?.displayName || user?.email?.split("@")[0]}
            </span>
            <TrendingUp size={18} className="text-moss" />
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/dashboard/documents")}
            variant="outline"
            className="border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 h-12 px-6 font-bold"
          >
            Ver Histórico <Clock size={18} className="ml-2" />
          </Button>
          <Button
            onClick={() => router.push("/dashboard/templates")}
            className="shadow-dusty-blue/20 h-12 gap-2 rounded-xl px-6 font-black shadow-xl"
          >
            Novo Relatório <PlusCircle size={18} />
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Modelos Ativos",
            value: stats.templates,
            icon: Sparkles,
            color: "text-moss",
            bg: "bg-moss/10",
          },
          {
            label: "Documentos Gerados",
            value: stats.documents,
            icon: Files,
            color: "text-terracotta",
            bg: "bg-terracotta/10",
          },
          {
            label: "Categorias de Negócio",
            value: stats.categories,
            icon: Tag,
            color: "text-dusty-blue",
            bg: "bg-dusty-blue/10",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/60 group hover:bg-card/80 hover:border-brand-500/30 border-b-2 border-none border-transparent shadow-2xl backdrop-blur-md transition-all">
              <CardContent className="flex items-center justify-between p-8">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-black tracking-widest uppercase">
                    {kpi.label}
                  </p>
                  <p className="text-foreground text-4xl font-black">
                    {kpi.value}
                  </p>
                </div>
                <div
                  className={`${kpi.bg} ${kpi.color} rounded-2xl p-4 transition-transform group-hover:scale-110`}
                >
                  <kpi.icon size={28} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Production Timeline */}
        <Card className="bg-card/40 overflow-hidden border-none shadow-xl backdrop-blur-sm lg:col-span-2">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">
                  Produção Recente
                </CardTitle>
                <CardDescription>
                  Documentos gerados nos últimos 7 dias
                </CardDescription>
              </div>
              <div className="bg-moss/10 text-moss rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                Tempo Real
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b735b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b735b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2d241e"
                  strokeOpacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#2d241e"
                  strokeOpacity={0.3}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#2d241e"
                  strokeOpacity={0.3}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(139, 115, 91, 0.2)",
                    borderRadius: "16px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: "#2d241e", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#8b735b"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card className="bg-card/40 overflow-hidden border-none shadow-xl backdrop-blur-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-bold">Segmentação</CardTitle>
            <CardDescription>Por categoria principal</CardDescription>
          </CardHeader>
          <CardContent className="relative h-[350px] p-8">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(139, 115, 91, 0.2)",
                    borderRadius: "16px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="mt-4 space-y-2">
              {categoryData.map((cat, i) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground font-medium">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-foreground font-bold">
                    {cat.value} items
                  </span>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-muted-foreground pt-10 text-center text-xs italic">
                  Sem dados categóricos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Shortcuts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-card/40 border-none shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div>
              <CardTitle className="text-xl font-bold">
                Atividade Recente
              </CardTitle>
              <CardDescription>Últimos documentos processados</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/documents")}
              className="text-brand-400 font-bold"
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-8 pt-0">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="group bg-brand-500/5 hover:bg-brand-500/10 flex items-center justify-between rounded-2xl p-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-muted rounded-xl p-3">
                    <FileSearch size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-foreground max-w-[150px] truncate text-sm font-bold">
                      {doc.fileName}
                    </p>
                    <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                      {doc.category || "Geral"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground hidden font-medium sm:block">
                    {new Date(doc.createdAt.toDate()).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ArrowUpRight size={18} className="text-brand-500" />
                  </a>
                </div>
              </div>
            ))}
            {recentDocs.length === 0 && (
              <p className="text-muted-foreground py-4 text-center italic">
                Nenhuma atividade recente.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Shortcuts & Quick Flows */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card
            onClick={() => router.push("/dashboard/templates/new")}
            className="bg-card group hover:bg-dusty-blue/10 cursor-pointer rounded-3xl border-none transition-all"
          >
            <CardContent className="space-y-4 p-8">
              <div className="bg-dusty-blue/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <PlusCircle className="text-dusty-blue" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">Novo Modelo</h4>
                <p className="text-muted-foreground text-sm font-medium">
                  Suba um arquivo DOCX e defina as etiquetas.
                </p>
              </div>
              <div className="text-dusty-blue flex items-center gap-2 pt-2 text-sm font-bold transition-transform group-hover:translate-x-1">
                Começar agora <ArrowRight size={16} />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => router.push("/dashboard/categories")}
            className="bg-card group hover:bg-brand-500/10 cursor-pointer rounded-3xl border-none transition-all"
          >
            <CardContent className="space-y-4 p-8">
              <div className="bg-dusty-blue/20 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Tag className="text-dusty-blue" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">Taxonomia</h4>
                <p className="text-muted-foreground text-sm font-medium">
                  Organize categorias e subcategorias.
                </p>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 pt-2 text-sm font-bold transition-transform group-hover:translate-x-1">
                Gerenciar <ArrowRight size={16} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
