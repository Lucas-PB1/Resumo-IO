import type { TemplateField } from "./template.service"

export type TemplateFormData = Record<string, string | number | boolean | null>

const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/
const PT_BR_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/

function normalizeKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const fieldFormatService = {
  isDateKey(key: string) {
    return normalizeKey(key).startsWith("data")
  },

  isPhoneKey(key: string) {
    const normalizedKey = normalizeKey(key)

    return (
      normalizedKey.startsWith("telefone") ||
      normalizedKey.startsWith("celular") ||
      normalizedKey.startsWith("whatsapp") ||
      normalizedKey.startsWith("fone") ||
      normalizedKey.includes("telefone") ||
      normalizedKey.includes("celular") ||
      normalizedKey.includes("whatsapp")
    )
  },

  formatPhoneForInput(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return ""

    const digits = value.toString().replace(/\D/g, "").slice(0, 11)
    const areaCode = digits.slice(0, 2)
    const number = digits.slice(2)

    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${areaCode}) ${number}`
    if (digits.length <= 10) {
      return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`
    }

    return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`
  },

  toDateInputValue(value: unknown) {
    if (typeof value !== "string") return ""
    if (DATE_INPUT_REGEX.test(value)) return value

    const ptBrMatch = value.match(PT_BR_DATE_REGEX)
    if (ptBrMatch) {
      const [, day, month, year] = ptBrMatch
      return `${year}-${month}-${day}`
    }

    return ""
  },

  formatDateForDisplay(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return ""

    if (DATE_INPUT_REGEX.test(value)) {
      const [year, month, day] = value.split("-")
      return `${day}/${month}/${year}`
    }

    if (PT_BR_DATE_REGEX.test(value)) return value

    return value
  },

  prepareTemplateData(data: TemplateFormData, fields: TemplateField[]) {
    return fields.reduce<TemplateFormData>(
      (acc, field) => {
        if (field.type === "date") {
          acc[field.key] = this.formatDateForDisplay(data[field.key])
        }

        if (field.type === "phone") {
          acc[field.key] = this.formatPhoneForInput(data[field.key])
        }

        return acc
      },
      { ...data }
    )
  },
}
