import { Metadata } from "next"
import TemplatesClient from "./TemplatesClient"

export const metadata: Metadata = {
  title: "Modelos",
  description: "Seus modelos Word com etiquetas.",
}

export default function Page() {
  return <TemplatesClient />
}
