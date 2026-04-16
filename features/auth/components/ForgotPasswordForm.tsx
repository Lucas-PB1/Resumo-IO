"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { motion } from "motion/react"

import { forgotPasswordSchema, ForgotPasswordFormData } from "../schemas"
import { authService } from "../services/auth.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const ForgotPasswordForm = () => {
  const [errorStatus, setErrorStatus] = useState("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setErrorStatus("")
      await authService.resetPassword(data)
      setSuccess(true)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao tentar redefinir senha."
      setErrorStatus(errorMessage)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full"
        >
          <KeyRound size={24} />
        </motion.div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Recuperar Senha
        </CardTitle>
        <CardDescription>Enviaremos um link para seu email</CardDescription>
      </CardHeader>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>

            {errorStatus && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                {errorStatus}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Enviar Link
            </Button>
            <div className="text-muted-foreground flex w-full justify-between px-2 text-center text-sm">
              <a
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Voltar para o Login
              </a>
            </div>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md border border-green-500/20 bg-green-500/10 p-4 text-center text-green-500"
          >
            Se houver uma conta associada a este email, você receberá um link
            para redefinir sua senha.
          </motion.div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/login")}
          >
            Voltar para o Login
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
