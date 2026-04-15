"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { motion } from "motion/react";

import { forgotPasswordSchema, ForgotPasswordFormData } from "../schemas";
import { authService } from "../services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const ForgotPasswordForm = () => {
  const [errorStatus, setErrorStatus] = useState("");
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setErrorStatus("");
      await authService.resetPassword(data);
      setSuccess(true);
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao tentar redefinir senha.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-2 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center text-primary mb-2"
        >
          <KeyRound size={24} />
        </motion.div>
        <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
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
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                {errorStatus}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Enviar Link
            </Button>
            <div className="text-sm text-center text-muted-foreground w-full flex justify-between px-2">
              <a href="/login" className="font-medium text-primary hover:underline">
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
            className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 text-center"
          >
            Se houver uma conta associada a este email, você receberá um link para redefinir sua senha.
          </motion.div>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/login"}>
            Voltar para o Login
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
