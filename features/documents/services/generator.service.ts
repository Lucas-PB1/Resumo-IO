import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
// @ts-ignore
import ImageModule from "docxtemplater-image-module-free"
import { saveAs } from "file-saver"

export const generatorService = {
  async fetchBuffer(url: string): Promise<ArrayBuffer> {
    const proxyUrl = `/api/storage/proxy?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error("Failed to fetch template file via proxy")
    return await response.arrayBuffer()
  },

  async generateDocx(templateBuffer: ArrayBuffer, data: Record<string, any>) {
    const zip = new PizZip(templateBuffer)

    // Config for Image Module
    const imageOptions = {
      centered: false,
      getImage(tagValue: string) {
        // Tag value should be base64 or buffer
        return Buffer.from(tagValue.split(",")[1], "base64")
      },
      getSize() {
        // default size for now, can be improved to be dynamic
        return [150, 150]
      },
    }

    const doc = new Docxtemplater(zip, {
      modules: [new ImageModule(imageOptions)],
      paragraphLoop: true,
      linebreaks: true,
    })

    try {
      doc.render(data)
    } catch (error: any) {
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
