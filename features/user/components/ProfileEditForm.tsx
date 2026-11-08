"use client"

import React, { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { Camera, Loader2 } from "lucide-react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { storage } from "@/lib/firebase/storage"
import { userService, UserProfileData } from "../services/user.service"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { authService } from "@/features/auth/services/auth.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/components/ui/toast"
import { Avatar } from "./UserMenu"
import { invalidateProfileCache } from "../hooks/useProfile"

export const ProfileEditForm = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const toast = useToast()

  // Password state
  const [passwordState, setPasswordState] = useState({ new: "", confirm: "" })
  const [changingPassword, setChangingPassword] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Partial<UserProfileData>>()
  const currentPhotoURL = watch("photoURL")

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const profile = await userService.getUserProfile(user.uid)
        if (profile) {
          reset(profile)
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user, reset])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem")
      return
    }

    try {
      setUploadingImage(true)

      const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setValue("photoURL", downloadURL, { shouldDirty: true })
      await userService.updateUserProfile(user.uid, { photoURL: downloadURL })
      invalidateProfileCache(user.uid)
      toast.success("Foto atualizada")
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível enviar a foto")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: Partial<UserProfileData>) => {
    if (!user) return
    try {
      await userService.updateUserProfile(user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        gender: data.gender,
        photoURL: data.photoURL,
      })
      invalidateProfileCache(user.uid)
      toast.success("Perfil atualizado")
    } catch {
      toast.error("Não foi possível atualizar o perfil")
    }
  }

  const handleChangePassword = async () => {
    if (passwordState.new !== passwordState.confirm) {
      toast.error("As senhas não coincidem")
      return
    }
    if (passwordState.new.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres")
      return
    }

    try {
      setChangingPassword(true)
      await authService.changePassword(passwordState.new)
      toast.success("Senha alterada")
      setPasswordState({ new: "", confirm: "" })
    } catch (err) {
      console.error(err)
      const error = err as { code?: string }
      if (error.code === "auth/requires-recent-login") {
        toast.error("Entre novamente para trocar a senha", {
          description:
            "Por segurança, saia e faça login de novo antes de alterar a senha.",
        })
      } else {
        toast.error("Não foi possível trocar a senha")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading)
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )

  const fullName = [watch("firstName"), watch("lastName")]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Meu perfil"
        description="Seu nome aparece como autor nos documentos gerados."
      />

      <section className="bg-card border-border mb-6 rounded-xl border shadow-xs">
        <div className="border-border flex items-center gap-4 border-b p-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative shrink-0 rounded-full"
            aria-label="Alterar foto"
          >
            <Avatar
              name={fullName || user?.email || "?"}
              photoURL={currentPhotoURL}
              className="h-16 w-16 text-xl"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploadingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Camera size={18} />
              )}
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{fullName || "Sem nome"}</p>
            <p className="text-muted-foreground truncate text-sm">
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                {...register("firstName", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                {...register("lastName", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                {...register("birthDate", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gênero</Label>
              <Select id="gender" {...register("gender")}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
                <option value="PREFIRO_NAO_DIZER">Prefiro não dizer</option>
              </Select>
            </div>
          </div>
          <div className="border-border flex justify-end border-t px-5 py-3">
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </section>

      <section className="bg-card border-border rounded-xl border shadow-xs">
        <div className="p-5 pb-0">
          <h2 className="text-sm font-medium">Senha</h2>
          <p className="text-muted-foreground text-[13px]">
            Use pelo menos 6 caracteres.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleChangePassword()
          }}
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordState.new}
                onChange={(e) =>
                  setPasswordState({ ...passwordState, new: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={passwordState.confirm}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    confirm: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="border-border flex justify-end border-t px-5 py-3">
            <Button
              type="submit"
              variant="outline"
              isLoading={changingPassword}
              disabled={!passwordState.new}
            >
              Alterar senha
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
