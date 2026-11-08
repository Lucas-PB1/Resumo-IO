import { Suspense } from "react"
import { Metadata } from "next"
import DocumentsClient from "./DocumentsClient"

export const metadata: Metadata = {
  title: "Documentos",
  description: "Histórico de documentos gerados.",
}

export default function Page() {
  return (
    <Suspense>
      <DocumentsClient />
    </Suspense>
  )
}
