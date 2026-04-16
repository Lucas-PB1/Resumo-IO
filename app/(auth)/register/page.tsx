import { Metadata } from "next"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Registre-se no Resume IO e comece a criar currículos profissionais hoje.",
}

export default function RegisterPage() {
  return <RegisterForm />
}
