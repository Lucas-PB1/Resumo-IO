import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

export const maxDuration = 60 // Allow more time for PDF generation

export async function POST(req: NextRequest) {
  try {
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
    try {
      executablePath = await chromium.executablePath()
    } catch (e) {
      console.warn("Chromium executable path not found via sparticuz.")
    }

    // Se estivermos em ambiente de desenvolvimento ou ambiente Linux local, tentamos caminhos comuns
    if (!executablePath && process.env.NODE_ENV === "development") {
      const commonPaths = [
        // Windows
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        // Linux
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        // MacOS
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ]
      const fs = require("fs")
      executablePath = commonPaths.find((p) => fs.existsSync(p)) || ""
    }

    if (!executablePath) {
      throw new Error(
        "Não foi possível encontrar um navegador para a conversão PDF. Verifique os logs do servidor."
      )
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: "new" as any,
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

    return new NextResponse(Buffer.from(pdfBuffer) as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(".docx", ".pdf")}"`,
      },
    })
  } catch (error: any) {
    console.error("PDF Conversion Error:", error)
    return NextResponse.json(
      {
        message: "Erro na conversão para PDF",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
