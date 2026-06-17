import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string("Email должен быть строкой")
    .trim()
    .email("Некорректный email"),

  password: z
    .string("Пароль должен быть строкой")
    .min(6, "Пароль должен содержать минимум 6 символов")
    .max(64, "Пароль должен содержать максимум 64 символа")
});

export type LoginSchema = z.infer<typeof loginSchema>