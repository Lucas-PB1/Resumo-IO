import { Metadata } from "next"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse seus modelos e documentos.",
}

export default function LoginPage() {
  return <LoginForm />
}
