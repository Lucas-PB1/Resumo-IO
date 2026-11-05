import { Metadata } from "next"
import { ProfileEditForm } from "@/features/user/components/ProfileEditForm"

export const metadata: Metadata = {
  title: "Meu perfil",
  description: "Suas informações de perfil e conta.",
}

export default function ProfilePage() {
  return <ProfileEditForm />
}
