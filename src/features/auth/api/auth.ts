import { supabase } from "@/lib/supabase/client";

type SignUpInput = { email: string; password: string; username: string };
type SignInInput = Pick<SignUpInput, "email" | "password">;

export async function signUp({ email, password, username }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: new URL("/dashboard", window.location.origin).toString(),
    },
  });
  if (error) throw error;
  return { requiresEmailConfirmation: data.session === null };
}

export async function signIn({ email, password }: SignInInput) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/reset-password", window.location.origin).toString(),
  });
  if (error) throw error;
}

export async function resetPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
