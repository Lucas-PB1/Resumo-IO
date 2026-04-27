"use client"

import {
  AlignLeft,
  CalendarDays,
  Hash,
  Image as ImageIcon,
  Phone,
  Trash2,
  Type,
} from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import type { TemplateField } from "@/features/documents/services/template.service"

interface TemplateFieldListProps {
  fields: TemplateField[]
  isScanning: boolean
  emptyMessage: string
  onChange: (index: number, updates: Partial<TemplateField>) => void
  onRemove: (index: number) => void
}

export function TemplateFieldList({
  fields,
  isScanning,
  emptyMessage,
  onChange,
  onRemove,
}: TemplateFieldListProps) {
  const renderFieldTypeIcon = (type: TemplateField["type"]) => {
    if (type === "image") return <ImageIcon size={14} />
    if (type === "date") return <CalendarDays size={14} />
    if (type === "phone") return <Phone size={14} />
    if (type === "textarea") return <AlignLeft size={14} />
    return <Type size={14} />
  }

  return (
    <Card className="bg-card/60 border-white/10 shadow-2xl backdrop-blur-2xl">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Etiquetas Detectadas</CardTitle>
            <CardDescription>
              Configure como os dados serão inseridos neste modelo.
            </CardDescription>
          </div>
          <div className="text-brand-300 bg-brand-500/10 border-brand-500/20 flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase">
            <Hash size={14} /> {fields.length} campos
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="text-muted-foreground animate-pulse rounded-2xl border border-white/5 bg-white/5 py-20 text-center">
            Escaneando etiquetas no Word...
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-muted/10 group hover:bg-muted/20 relative flex flex-col gap-4 rounded-2xl border border-white/5 p-5 transition-all"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  aria-label={`Remover etiqueta ${field.key}`}
                  className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-red-500/5 text-red-400 transition-opacity hover:bg-red-500 hover:text-white sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </Button>

                <div className="flex flex-col gap-6 pr-10 sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-brand-400" />
                      <Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                        Chave:{" "}
                        <span className="text-foreground">{field.key}</span>
                      </Label>
                    </div>
                    <Input
                      value={field.label}
                      onChange={(event) =>
                        onChange(index, { label: event.target.value })
                      }
                      placeholder="Nome no formulário"
                      className="bg-background/60 h-12 rounded-xl border-white/10 font-bold placeholder:font-medium placeholder:opacity-30"
                    />
                  </div>

                  <div className="w-full space-y-3 sm:w-56">
                    <Label className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                      {renderFieldTypeIcon(field.type)}
                      Tipo do Campo
                    </Label>
                    <Select
                      value={field.type}
                      onChange={(event) =>
                        onChange(index, {
                          type: event.target.value as TemplateField["type"],
                        })
                      }
                      className="bg-background/60 h-12 rounded-xl border-white/10 font-bold"
                    >
                      <option value="text">Texto Simples</option>
                      <option value="textarea">Texto Longo</option>
                      <option value="phone">Telefone</option>
                      <option value="date">Data</option>
                      <option value="image">Imagem / Foto</option>
                    </Select>
                  </div>
                </div>
              </motion.div>
            ))}

            {fields.length === 0 && (
              <div className="text-muted-foreground/70 rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center italic">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
