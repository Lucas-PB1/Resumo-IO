import { FileStack, FolderTree, House, ScrollText } from "lucide-react"

export const NAV_ITEMS = [
  { label: "Início", href: "/dashboard", icon: House },
  { label: "Documentos", href: "/dashboard/documents", icon: ScrollText },
  { label: "Modelos", href: "/dashboard/templates", icon: FileStack },
  { label: "Categorias", href: "/dashboard/categories", icon: FolderTree },
] as const

export function isNavActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href)
}
