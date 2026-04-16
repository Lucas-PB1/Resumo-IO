import { Metadata } from "next"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visão geral e estatísticas do Resume IO.",
}

export default function Page() {
  return <DashboardClient />
}
