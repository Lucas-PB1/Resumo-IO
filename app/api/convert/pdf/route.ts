import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"
import fs from "fs"

export const maxDuration = 60 // Allow more time for PDF generation

export async function POST(req: NextRequest) {
  try {
    // Dynamic imports can help with dependency tracing on Vercel for native modules
    const puppeteer = await import("puppeteer-core")
    const chromium = (await import("@sparticuz/chromium")).default

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não enviado" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("PDF Conversion: Starting Mammoth conversion...")
    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "u => u", // preserve underlines
          "strike => del",
        ],
      }
    )

    console.log("PDF Conversion: Launching browser...")
    let executablePath = ""
    const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === "production"

    if (isVercel) {
      console.log("PDF Conversion: Vercel environment detected. Getting chromium path...")
      try {
        executablePath = await chromium.executablePath()
      } catch (pathError) {
        console.error("PDF Conversion: Error getting chromium executable path:", pathError)
        throw pathError
      }
    } else {
      console.log("PDF Conversion: Local environment detected.")
      // Local development
      const commonPaths = [
        // Linux
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
        // Windows
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        // MacOS
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ]
      executablePath = commonPaths.find((p) => fs.existsSync(p)) || ""
    }

    if (!executablePath) {
      throw new Error(
        `Não foi possível encontrar um navegador para a conversão PDF (Ambiente: ${isVercel ? "Vercel" : "Local"}).`
      )
    }

    console.log(`PDF Conversion: Launching puppeteer with path: ${executablePath}`)
    const browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: executablePath,
      headless: isVercel ? "shell" : true,
      defaultViewport: { width: 1080, height: 1920 },
    })

    const page = await browser.newPage()

    // Add basic styling to make it look like a document
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 40px auto; 
              padding: 0 20px;
            }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; }
            h1, h2, h3 { color: #1a1a1a; margin-top: 30px; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `

    await page.setContent(fullHtml, { waitUntil: "networkidle0" })

    // 3. Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "2cm",
        bottom: "2cm",
        left: "2cm",
        right: "2cm",
      },
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(".docx", ".pdf")}"`,
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido"
    console.error("PDF Conversion Error:", error)
    return NextResponse.json(
      {
        message: "Erro na conversão para PDF",
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
