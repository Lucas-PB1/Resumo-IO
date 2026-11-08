import { Metadata } from "next"
import CategoriesClient from "./CategoriesClient"

export const metadata: Metadata = {
  title: "Categorias",
  description: "Organize modelos e documentos por área.",
}

export default function Page() {
  return <CategoriesClient />
}
