import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Insira um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
})
export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  firstName: z.string().min(2, "Nome é obrigatório"),
  lastName: z.string().min(2, "Sobrenome é obrigatório"),
  email: z.string().email("Insira um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  birthDate: z.string().min(1, "A data de nascimento é obrigatória"),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO", "PREFIRO_NAO_DIZER"], {
    errorMap: () => ({ message: "Selecione um gênero válido" }),
  }),
})
export type RegisterFormData = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Insira um email válido"),
})
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
