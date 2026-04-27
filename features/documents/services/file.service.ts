const MB = 1024 * 1024

export const FILE_LIMITS = {
  template: 10 * MB,
  report: 20 * MB,
  evidence: 50 * MB,
  image: 5 * MB,
} as const

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  DOCX_MIME_TYPE,
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".docx": DOCX_MIME_TYPE,
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

const ALLOWED_EVIDENCE_EXTENSIONS = new Set(
  Object.keys(EXTENSION_CONTENT_TYPES)
)
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"])

export interface FileValidationResult {
  ok: boolean
  message?: string
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / MB)}MB`
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".")
  return index === -1 ? "" : fileName.slice(index).toLowerCase()
}

export const fileService = {
  sanitizeFileName(fileName: string) {
    const normalized = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    return normalized || "arquivo"
  },

  getUploadContentType(file: File) {
    return (
      file.type ||
      EXTENSION_CONTENT_TYPES[getExtension(file.name)] ||
      "application/octet-stream"
    )
  },

  validateTemplateFile(file: File): FileValidationResult {
    if (getExtension(file.name) !== ".docx") {
      return { ok: false, message: "Envie um arquivo .docx válido." }
    }

    if (file.size > FILE_LIMITS.template) {
      return {
        ok: false,
        message: `O modelo deve ter no máximo ${formatMegabytes(FILE_LIMITS.template)}.`,
      }
    }

    return { ok: true }
  },

  validateEvidenceFile(file: File): FileValidationResult {
    const extension = getExtension(file.name)

    if (file.size > FILE_LIMITS.evidence) {
      return {
        ok: false,
        message: `${file.name} excede ${formatMegabytes(FILE_LIMITS.evidence)}.`,
      }
    }

    if (
      !ALLOWED_EVIDENCE_EXTENSIONS.has(extension) &&
      (!file.type || !ALLOWED_EVIDENCE_MIME_TYPES.has(file.type))
    ) {
      return {
        ok: false,
        message: `${file.name} não é um anexo permitido.`,
      }
    }

    return { ok: true }
  },

  validateImageFile(file: File): FileValidationResult {
    const extension = getExtension(file.name)

    if (
      !file.type.startsWith("image/") &&
      !ALLOWED_IMAGE_EXTENSIONS.has(extension)
    ) {
      return { ok: false, message: "Selecione uma imagem válida." }
    }

    if (file.size > FILE_LIMITS.image) {
      return {
        ok: false,
        message: `A imagem deve ter no máximo ${formatMegabytes(FILE_LIMITS.image)}.`,
      }
    }

    return { ok: true }
  },
}
