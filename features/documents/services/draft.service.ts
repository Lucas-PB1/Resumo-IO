import type { TemplateFormData } from "./field-format.service"

/**
 * Rascunhos locais de preenchimento (autosave).
 * Ficam no navegador do usuário — não vão para o Firestore.
 */
export interface DocumentDraft {
  templateId: string
  templateName: string
  formData: TemplateFormData
  filled: number
  total: number
  updatedAt: number
}

const PREFIX = "minuta:draft:"
/** Imagens muito grandes ficam fora do rascunho para não estourar o localStorage. */
const MAX_VALUE_LENGTH = 400_000

function key(uid: string, templateId: string) {
  return `${PREFIX}${uid}:${templateId}`
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

export const draftService = {
  get(uid: string, templateId: string): DocumentDraft | null {
    try {
      const raw = safeStorage()?.getItem(key(uid, templateId))
      return raw ? (JSON.parse(raw) as DocumentDraft) : null
    } catch {
      return null
    }
  },

  save(uid: string, draft: Omit<DocumentDraft, "updatedAt">) {
    const storage = safeStorage()
    if (!storage) return
    const formData = Object.fromEntries(
      Object.entries(draft.formData).filter(
        ([, v]) => typeof v !== "string" || v.length <= MAX_VALUE_LENGTH
      )
    )
    try {
      storage.setItem(
        key(uid, draft.templateId),
        JSON.stringify({ ...draft, formData, updatedAt: Date.now() })
      )
    } catch (err) {
      console.warn("Could not save draft", err)
    }
  },

  remove(uid: string, templateId: string) {
    try {
      safeStorage()?.removeItem(key(uid, templateId))
    } catch {}
  },

  list(uid: string): DocumentDraft[] {
    const storage = safeStorage()
    if (!storage) return []
    const prefix = `${PREFIX}${uid}:`
    const drafts: DocumentDraft[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (!k?.startsWith(prefix)) continue
      try {
        drafts.push(JSON.parse(storage.getItem(k) ?? "") as DocumentDraft)
      } catch {}
    }
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt)
  },
}

export function countFilled(data: TemplateFormData, keys: string[]): number {
  return keys.filter((k) => {
    const v = data[k]
    return v !== null && v !== undefined && String(v).trim() !== ""
  }).length
}
