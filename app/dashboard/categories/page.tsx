import { Metadata } from "next"
import CategoriesClient from "./CategoriesClient"

export const metadata: Metadata = {
  title: "Categorias",
  description: "Organize seus documentos por categorias de negócio.",
}

export default function Page() {
  return <CategoriesClient />
}
