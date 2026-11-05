import { Metadata } from "next"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

export const metadata: Metadata = {
  title: "Criar Conta",
  description: "Crie sua conta e transforme seus modelos Word em formulários.",
}

export default function RegisterPage() {
  return <RegisterForm />
}
