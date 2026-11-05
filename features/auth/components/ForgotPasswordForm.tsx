"use client"

import Link from "next/link"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
    <Card className="mx-auto w-full max-w-sm shadow-sm">
      <CardHeader className="space-y-1 px-6 pt-7 pb-5">
        <CardTitle className="font-serif text-[26px] font-medium tracking-[-0.01em]">
          Recuperar senha
        </CardTitle>
        <CardDescription>Enviaremos um link para seu email</CardDescription>
      </CardHeader>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 px-6">
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
              <div className="bg-danger-soft text-danger rounded-lg px-3 py-2.5 text-sm">
                {errorStatus}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-0 px-6 pt-5 pb-7">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Enviar Link
            </Button>
            <div className="text-muted-foreground flex w-full justify-between px-2 text-center text-sm">
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Voltar para o Login
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-4 px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-success-soft text-success rounded-lg p-4 text-sm"
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
