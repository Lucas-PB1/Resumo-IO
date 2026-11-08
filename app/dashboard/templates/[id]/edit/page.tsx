"use client"

import { useParams } from "next/navigation"
import { TemplateEditor } from "@/features/documents/components/TemplateEditor"

export default function EditTemplatePage() {
  const { id } = useParams() as { id: string }
  return <TemplateEditor templateId={id} />
}
