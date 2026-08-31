import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = loginSchema.extend({
  username: z.string().trim().min(3, "Usa al menos 3 caracteres").max(24, "Usa como máximo 24 caracteres"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
