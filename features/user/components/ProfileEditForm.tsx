"use client"

import React, { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { User, Upload } from "lucide-react"
import { motion } from "motion/react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { storage } from "@/lib/firebase/storage"
import { userService, UserProfileData } from "../services/user.service"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { authService } from "@/features/auth/services/auth.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

export const ProfileEditForm = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [successStatus, setSuccessStatus] = useState("")
  const [errorStatus, setErrorStatus] = useState("")

  // Password state
  const [passwordState, setPasswordState] = useState({ new: "", confirm: "" })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

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
      setErrorStatus("Por favor, selecione apenas imagens.")
      return
    }

    try {
      setUploadingImage(true)
      setErrorStatus("")
      setSuccessStatus("")

      const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setValue("photoURL", downloadURL, { shouldDirty: true })
      await onSubmit({ photoURL: downloadURL })
      setSuccessStatus("Avatar atualizado com sucesso!")
    } catch (err) {
      console.error(err)
      setErrorStatus("Erro ao fazer upload da imagem.")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: Partial<UserProfileData>) => {
    if (!user) return
    try {
      setSuccessStatus("")
      setErrorStatus("")
      await userService.updateUserProfile(user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        gender: data.gender,
        photoURL: data.photoURL,
      })
      setSuccessStatus("Perfil atualizado com sucesso!")
    } catch {
      setErrorStatus("Erro ao atualizar o perfil")
    }
  }

  const handleChangePassword = async () => {
    if (passwordState.new !== passwordState.confirm) {
      setPasswordError("As senhas não coincidem.")
      return
    }
    if (passwordState.new.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    try {
      setChangingPassword(true)
      setPasswordError("")
      setPasswordSuccess("")
      await authService.changePassword(passwordState.new)
      setPasswordSuccess("Senha alterada com sucesso!")
      setPasswordState({ new: "", confirm: "" })
    } catch (err) {
      console.error(err)
      const error = err as { code?: string }
      if (error.code === "auth/requires-recent-login") {
        setPasswordError(
          "Para sua segurança, saia e entre novamente antes de trocar a senha."
        )
      } else {
        setPasswordError("Erro ao trocar a senha. Tente novamente.")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading)
    return (
      <div className="text-muted-foreground animate-pulse p-12 text-center font-medium">
        Carregando perfil...
      </div>
    )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full pb-20"
    >
      <Card className="bg-card/70 w-full overflow-hidden border-none shadow-2xl backdrop-blur-2xl">
        {/* Banner Area */}
        <div className="from-brand-600/30 via-brand-500/10 h-40 bg-linear-to-r to-transparent" />

        {/* Header with Avatar */}
        <div className="to-card/50 -mt-16 flex flex-col items-end gap-6 border-b border-white/5 bg-linear-to-b from-transparent px-8 pb-8 md:flex-row">
          <div
            className="group relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-background text-primary border-background group-hover:border-brand-500/50 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2.5rem] border-4 shadow-2xl transition-all duration-500 hover:rotate-3">
              {currentPhotoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPhotoURL}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={64} className="text-muted-foreground/30" />
              )}
              {uploadingImage && (
                <div className="bg-background/60 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-brand-500 animate-spin">⏳</span>
                </div>
              )}
            </div>
            <div className="bg-brand-600 border-background absolute -right-2 -bottom-2 rounded-2xl border-4 p-2.5 text-white shadow-xl transition-transform group-hover:scale-110">
              <Upload size={18} />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-1 pb-2">
            <h1 className="text-foreground text-4xl font-black tracking-tight">
              Minha Conta
            </h1>
            <p className="text-muted-foreground font-medium">
              Gerencie suas informações e segurança em um só lugar.
            </p>
          </div>
        </div>

        {/* Section 1: Personal Data */}
        <div className="space-y-10 p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 h-6 w-1.5 rounded-full" />
            <h2 className="text-xl font-bold tracking-tight">Dados Pessoais</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label
                  htmlFor="firstName"
                  className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
                >
                  Primeiro Nome
                </Label>
                <Input
                  id="firstName"
                  {...register("firstName", { required: true })}
                  placeholder="Ex: Lucas"
                  className="bg-muted/20"
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="lastName"
                  className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
                >
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  {...register("lastName", { required: true })}
                  placeholder="Ex: Soares"
                  className="bg-muted/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label
                  htmlFor="birthDate"
                  className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
                >
                  Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate", { required: true })}
                  className="bg-muted/20"
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="gender"
                  className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
                >
                  Gênero
                </Label>
                <Select
                  id="gender"
                  {...register("gender")}
                  className="bg-muted/20 text-foreground"
                >
                  <option
                    value="MASCULINO"
                    className="bg-background text-foreground"
                  >
                    Masculino
                  </option>
                  <option
                    value="FEMININO"
                    className="bg-background text-foreground"
                  >
                    Feminino
                  </option>
                  <option
                    value="OUTRO"
                    className="bg-background text-foreground"
                  >
                    Outro
                  </option>
                  <option
                    value="PREFIRO_NAO_DIZER"
                    className="bg-background text-foreground"
                  >
                    Prefiro não dizer
                  </option>
                </Select>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-6 border-t border-white/5 pt-4 sm:flex-row">
              <Button
                type="submit"
                isLoading={isSubmitting || uploadingImage}
                size="lg"
                className="shadow-brand-500/20 w-full px-12 font-bold shadow-xl sm:w-auto"
              >
                Salvar Alterações
              </Button>
              {(errorStatus || successStatus) && (
                <p
                  className={`text-sm font-semibold ${errorStatus ? "text-red-500" : "text-brand-500"}`}
                >
                  {errorStatus || successStatus}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Separator */}
        <div className="mx-8 h-px bg-white/5 md:mx-12" />

        {/* Section 2: Security */}
        <div className="space-y-10 p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 h-6 w-1.5 rounded-full" />
            <h2 className="text-xl font-bold tracking-tight">Segurança</h2>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="newPassword"
                className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
              >
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordState.new}
                onChange={(e) =>
                  setPasswordState({ ...passwordState, new: e.target.value })
                }
                className="bg-muted/20"
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="text-muted-foreground/80 ml-1 text-xs font-bold tracking-widest uppercase"
              >
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Sua senha novamente"
                value={passwordState.confirm}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    confirm: e.target.value,
                  })
                }
                className="bg-muted/20"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6 border-t border-white/5 pt-4 sm:flex-row">
            <Button
              onClick={handleChangePassword}
              variant="outline"
              isLoading={changingPassword}
              size="lg"
              className="border-brand-500/20 hover:bg-brand-500 w-full border-2 px-12 font-bold shadow-lg transition-all hover:text-white sm:w-auto"
            >
              Mudar Senha
            </Button>
            {(passwordError || passwordSuccess) && (
              <p
                className={`text-sm font-semibold ${passwordError ? "text-red-500" : "text-brand-500"}`}
              >
                {passwordError || passwordSuccess}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
