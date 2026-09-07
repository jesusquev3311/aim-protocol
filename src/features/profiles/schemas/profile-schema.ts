import { z } from "zod";

export const usernameSchema = z.object({ username: z.string().trim().min(3, "Use at least 3 characters.").max(24, "Use at most 24 characters.") });
export const emailSchema = z.object({ email: z.string().trim().email("Enter a valid email address.") });
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).refine((values) => values.newPassword === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export type UsernameValues = z.infer<typeof usernameSchema>;
export type EmailValues = z.infer<typeof emailSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
