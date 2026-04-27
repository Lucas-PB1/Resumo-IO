import PizZip from "pizzip"
import type { TemplateField } from "./template.service"
import { fieldFormatService } from "./field-format.service"

const DOCX_DOCUMENT_PATH = "word/document.xml"
const DOCX_TEXT_NODE_REGEX = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
const TAG_REGEX = /\{([^{}]*)\}/g
const CONTROL_PREFIXES = new Set(["/", "@", "^", "#"])
const INTERNAL_GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toFieldLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
}

function resolveFieldType(tag: string): TemplateField["type"] {
  const lowerTag = tag.toLowerCase()

  if (tag.startsWith("%")) return "image"

  if (
    lowerTag.startsWith("foto_") ||
    lowerTag.startsWith("imagem_") ||
    lowerTag.includes("foto") ||
    lowerTag.includes("imagem") ||
    lowerTag.includes("image")
  ) {
    return "image"
  }

  if (fieldFormatService.isDateKey(tag)) {
    return "date"
  }

  if (fieldFormatService.isPhoneKey(tag)) {
    return "phone"
  }

  if (
    lowerTag.startsWith("texto") ||
    lowerTag.startsWith("descricao") ||
    lowerTag.startsWith("observacao") ||
    lowerTag.startsWith("observacoes") ||
    lowerTag.startsWith("historico") ||
    lowerTag.startsWith("relato") ||
    lowerTag.startsWith("resumo") ||
    lowerTag.includes("observacao") ||
    lowerTag.includes("descrição")
  ) {
    return "textarea"
  }

  return "text"
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function getTextContent(xml: string) {
  let textContent = ""
  let textMatch: RegExpExecArray | null

  DOCX_TEXT_NODE_REGEX.lastIndex = 0
  while ((textMatch = DOCX_TEXT_NODE_REGEX.exec(xml)) !== null) {
    textContent += decodeXmlText(textMatch[1])
  }

  return textContent
}

function shouldIgnoreTag(tag: string) {
  return !tag || CONTROL_PREFIXES.has(tag[0]) || INTERNAL_GUID_REGEX.test(tag)
}

export const placeholderService = {
  async extractFields(
    file: File,
    existingFields: TemplateField[] = []
  ): Promise<TemplateField[]> {
    const arrayBuffer = await file.arrayBuffer()
    const zip = new PizZip(arrayBuffer)
    const documentFile = zip.files[DOCX_DOCUMENT_PATH]

    if (!documentFile) {
      throw new Error("O arquivo .docx não possui um documento Word válido.")
    }

    const content = getTextContent(documentFile.asText())
    const foundTags = new Set<string>()
    let tagMatch: RegExpExecArray | null

    TAG_REGEX.lastIndex = 0
    while ((tagMatch = TAG_REGEX.exec(content)) !== null) {
      const rawTag = tagMatch[1].trim()
      if (shouldIgnoreTag(rawTag)) continue
      foundTags.add(rawTag)
    }

    return Array.from(foundTags)
      .map((tag) => {
        const cleanKey = tag.startsWith("%") ? tag.slice(1) : tag
        const existing = existingFields.find((field) => field.key === cleanKey)

        if (existing) {
          return {
            ...existing,
            type:
              existing.type === "image" ? existing.type : resolveFieldType(tag),
          }
        }

        return {
          key: cleanKey,
          label: toFieldLabel(cleanKey),
          type: resolveFieldType(tag),
        } satisfies TemplateField
      })
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
  },
}
