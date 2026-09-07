import { supabase } from "@/lib/supabase/client";

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("id, username, created_at, updated_at").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function updateUsername({ userId, username }: { userId: string; username: string }) {
  const { data, error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", userId).select("id, username, created_at, updated_at").single();
  if (error) throw error;
  return data;
}

export async function updateAccountEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw error;
}

export async function changeAccountPassword({ email, currentPassword, newPassword }: { email: string; currentPassword: string; newPassword: string }) {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (signInError) throw new Error("Your current password is incorrect.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
