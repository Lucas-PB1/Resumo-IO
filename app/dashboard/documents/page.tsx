import { Metadata } from "next"
import DocumentsClient from "./DocumentsClient"

export const metadata: Metadata = {
  title: "Meus Documentos",
  description: "Histórico de currículos e documentos gerados.",
}

export default function Page() {
  return <DocumentsClient />
}
