import { Metadata } from "next"
import TemplatesClient from "./TemplatesClient"

export const metadata: Metadata = {
  title: "Modelos",
  description: "Gerencie seus modelos de currículo e documentos.",
}

export default function Page() {
  return <TemplatesClient />
}
