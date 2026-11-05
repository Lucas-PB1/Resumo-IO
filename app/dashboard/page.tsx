import { Metadata } from "next"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = {
  title: "Início",
  description: "Visão geral dos seus documentos e modelos.",
}

export default function Page() {
  return <DashboardClient />
}
