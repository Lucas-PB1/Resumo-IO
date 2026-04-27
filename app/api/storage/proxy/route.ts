import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const ALLOWED_STORAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
])

function getConfiguredBucket() {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace("gs://", "")
}

function extractStorageObject(url: URL) {
  if (url.protocol !== "https:" || !ALLOWED_STORAGE_HOSTS.has(url.hostname)) {
    return null
  }

  if (url.username || url.password) {
    return null
  }

  if (url.hostname === "firebasestorage.googleapis.com") {
    const parts = url.pathname.split("/").filter(Boolean)
    const bucketIndex = parts.indexOf("b")
    const objectIndex = parts.indexOf("o")
    const bucket = parts[bucketIndex + 1]
    const encodedPath = parts.slice(objectIndex + 1).join("/")

    if (bucketIndex === -1 || objectIndex === -1 || !bucket || !encodedPath) {
      return null
    }

    return {
      bucket,
      objectPath: decodeURIComponent(encodedPath),
    }
  }

  const [, bucket, ...objectSegments] = url.pathname.split("/")
  if (!bucket || objectSegments.length === 0) return null

  return {
    bucket,
    objectPath: decodeURIComponent(objectSegments.join("/")),
  }
}

function canAccessStorageObject(rawUrl: string, userId: string) {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return false
  }

  const storageObject = extractStorageObject(parsedUrl)
  const configuredBucket = getConfiguredBucket()

  if (!storageObject || storageObject.bucket !== configuredBucket) {
    return false
  }

  return ["templates", "reports", "evidence"].some((folder) =>
    storageObject.objectPath.startsWith(`${folder}/${userId}/`)
  )
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  }

  if (!url) {
    return NextResponse.json({ message: "URL não fornecida" }, { status: 400 })
  }

  if (!canAccessStorageObject(url, session.user.id)) {
    return NextResponse.json({ message: "URL não autorizada" }, { status: 403 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Falha ao buscar recurso")

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
