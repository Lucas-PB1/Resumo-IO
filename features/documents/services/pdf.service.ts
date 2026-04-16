export const pdfService = {
  async convertDocxToPdf(docxBlob: Blob, fileName: string): Promise<Blob> {
    const formData = new FormData()
    formData.append("file", docxBlob, fileName)

    const response = await fetch("/api/convert/pdf", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = "Falha na conversão para PDF"
      try {
        const error = await response.json()
        errorMessage = error.message || errorMessage
      } catch {
        // Response was not JSON (e.g. server crash)
        errorMessage = `Erro do Servidor (${response.status}): O processo de conversão falhou.`
      }
      throw new Error(errorMessage)
    }

    return await response.blob()
  },
}
