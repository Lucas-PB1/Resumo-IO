import type { TemplateField } from "./template.service"
import {
  fieldFormatService,
  type TemplateFormData,
} from "./field-format.service"
import { generatorService } from "./generator.service"

const OPEN = "⟦" // ⟦
const CLOSE = "⟧" // ⟧
const MARKER_REGEX = new RegExp(`${OPEN}([^${CLOSE}]+)${CLOSE}`, "g")

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || String(value).trim() === ""
}

/**
 * Gera uma prévia em HTML do documento final.
 * Usa o mesmo caminho do PDF (docxtemplater → mammoth), então o resultado
 * é fiel ao que será exportado. Campos vazios aparecem destacados.
 */
export const previewService = {
  async render(
    templateBuffer: ArrayBuffer,
    formData: TemplateFormData,
    fields: TemplateField[]
  ): Promise<string> {
    const data = fieldFormatService.prepareTemplateData(formData, fields)
    const fieldTypes: Record<string, string> = {}

    fields.forEach((f) => {
      fieldTypes[f.key] = f.type
      if (f.type !== "image" && isEmpty(data[f.key])) {
        data[f.key] = `${OPEN}${f.key}${CLOSE}`
      }
    })

    const blob = await generatorService.generateDocx(
      templateBuffer,
      data,
      fieldTypes
    )
    const mammoth = await import("mammoth")
    const { value: html } = await mammoth.convertToHtml(
      { arrayBuffer: await blob.arrayBuffer() },
      { styleMap: ["u => u", "strike => del"] }
    )

    const labels = new Map(fields.map((f) => [f.key, f.label]))
    return html.replace(MARKER_REGEX, (_, key: string) => {
      const label = labels.get(key) ?? key
      return `<mark data-field="${escapeHtml(key)}" title="Clique para preencher">${escapeHtml(label)}</mark>`
    })
  },
}
