"use client"

import * as React from "react"
import { Check, ImagePlus, Trash2 } from "lucide-react"
import type { TemplateField } from "@/features/documents/services/template.service"
import { fieldFormatService } from "@/features/documents/services/field-format.service"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const fieldDomId = (key: string) => `field-${key}`

interface FieldInputProps {
  field: TemplateField
  value: string | number | boolean | null | undefined
  onChange: (value: string | null) => void
  onImage: (file: File) => void
  onFocus?: () => void
}

function asText(value: FieldInputProps["value"]) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : ""
}

export function FieldInput({
  field,
  value,
  onChange,
  onImage,
  onFocus,
}: FieldInputProps) {
  const id = fieldDomId(field.key)
  const text = asText(value)
  const isFilled = text.trim() !== ""

  return (
    <div className="group/field space-y-1.5" data-field-wrapper={field.key}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          {field.label}
          {isFilled && (
            <Check size={13} className="text-success" aria-label="preenchido" />
          )}
        </Label>
        <code className="text-subtle-foreground hidden truncate font-mono text-[11px] opacity-0 transition-opacity group-focus-within/field:opacity-100 group-hover/field:opacity-100 sm:block">
          {`{${field.key}}`}
        </code>
      </div>

      {field.type === "text" && (
        <Input
          id={id}
          value={text}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "phone" && (
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={fieldFormatService.formatPhoneForInput(value)}
          onFocus={onFocus}
          onChange={(e) =>
            onChange(fieldFormatService.formatPhoneForInput(e.target.value))
          }
        />
      )}

      {field.type === "date" && (
        <div className="flex gap-2">
          <Input
            id={id}
            type="date"
            value={fieldFormatService.toDateInputValue(value)}
            onFocus={onFocus}
            onChange={(e) => onChange(e.target.value)}
            className="tabular"
          />
          <Button
            variant="outline"
            onClick={() => onChange(new Date().toISOString().slice(0, 10))}
            className="shrink-0"
          >
            Hoje
          </Button>
        </div>
      )}

      {field.type === "textarea" && (
        <>
          <Textarea
            id={id}
            value={text}
            onFocus={onFocus}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-32"
          />
          {text.length > 0 && (
            <p className="text-subtle-foreground tabular text-right text-[11px]">
              {text.trim().split(/\s+/).length} palavras
            </p>
          )}
        </>
      )}

      {field.type === "image" && (
        <ImageField
          id={id}
          value={text}
          onImage={onImage}
          onClear={() => onChange(null)}
          onFocus={onFocus}
        />
      )}
    </div>
  )
}

function ImageField({
  id,
  value,
  onImage,
  onClear,
  onFocus,
}: {
  id: string
  value: string
  onImage: (file: File) => void
  onClear: () => void
  onFocus?: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onImage(file)
  }

  if (value) {
    return (
      <div className="border-border flex items-center gap-3 rounded-lg border p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-16 w-16 rounded-md object-cover" />
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Trocar
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remover imagem"
          onClick={onClear}
        >
          <Trash2 size={15} />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    )
  }

  return (
    <button
      id={id}
      type="button"
      onFocus={onFocus}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "border-border-strong text-muted-foreground hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-left text-sm transition-colors",
        dragging && "border-primary bg-accent"
      )}
    >
      <ImagePlus size={18} className="shrink-0" />
      <span>
        <span className="text-foreground font-medium">Escolher imagem</span> ou
        arraste aqui
        <span className="text-subtle-foreground block text-xs">
          JPG, PNG ou WEBP até 5 MB
        </span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  )
}
