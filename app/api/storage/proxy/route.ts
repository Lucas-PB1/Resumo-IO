import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ message: "URL não fornecida" }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Falha ao buscar recurso")

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
