import { Metadata } from "next"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta no Resume IO para gerenciar seus currículos.",
}

export default function LoginPage() {
  return <LoginForm />
}
