import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
// @ts-expect-error - No types for docxtemplater-image-module-free
import ImageModule from "docxtemplater-image-module-free"
import { saveAs } from "file-saver"

export const generatorService = {
  async fetchBuffer(url: string): Promise<ArrayBuffer> {
    const proxyUrl = `/api/storage/proxy?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error("Failed to fetch template file via proxy")
    return await response.arrayBuffer()
  },

  autoPromoteImageTags(zip: PizZip, fieldTypes: Record<string, string>) {
    // Files to scan for tags
    const filesToProcess = [
      "word/document.xml",
      ...Object.keys(zip.files).filter(
        (name) =>
          name.startsWith("word/header") || name.startsWith("word/footer")
      ),
    ]

    filesToProcess.forEach((fileName) => {
      const file = zip.file(fileName)
      if (!file) return

      let content = file.asText()
      let modified = false

      Object.entries(fieldTypes).forEach(([key, type]) => {
        if (type === "image") {
          // Regex to find {key} even if split by XML tags like <w:t>{</w:t><w:t>key</w:t>
          // For simplicity and safety during generation, we target the most common <w:t>{key}</w:t>
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          const regex = new RegExp(`\\{(${escapedKey})\\}`, "g")

          if (regex.test(content)) {
            content = content.replace(regex, "{%$1}")
            modified = true
          }
        }
      })

      if (modified) {
        zip.file(fileName, content)
      }
    })
  },

  async generateDocx(
    templateBuffer: ArrayBuffer,
    data: Record<string, string | number | boolean | null>,
    fieldTypes: Record<string, string> = {}
  ) {
    const zip = new PizZip(templateBuffer)

    // Automagically promote {tag} to {%tag} for image fields
    this.autoPromoteImageTags(zip, fieldTypes)

    // Config for Image Module
    const imageOptions = {
      centered: false,
      getImage(tagValue: string | Buffer | null) {
        if (!tagValue) return null
        if (typeof tagValue === "string" && tagValue.includes("base64,")) {
          return Buffer.from(tagValue.split(",")[1], "base64")
        }
        return tagValue
      },
      getSize() {
        return [300, 300]
      },
    }

    const imageModule = new ImageModule(imageOptions)

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
    })

    try {
      doc.render(data)
    } catch (error) {
      console.error("Docxtemplater Error:", error)
      throw error
    }

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    return out
  },

  async downloadBlob(blob: Blob, fileName: string) {
    saveAs(blob, fileName)
  },
}
