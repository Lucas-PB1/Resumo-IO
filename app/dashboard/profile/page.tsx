import { Metadata } from "next"
import { ProfileEditForm } from "@/features/user/components/ProfileEditForm"

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Gerencie suas informações de perfil e conta.",
}

export default function ProfilePage() {
  return (
    <div className="mt-6 flex justify-center">
      <ProfileEditForm />
    </div>
  )
}
