import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/providers/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangeAccountPassword, useProfile, useUpdateAccountEmail, useUpdateUsername } from "@/features/profiles/hooks/use-profile";
import { emailSchema, passwordSchema, usernameSchema, type EmailValues, type PasswordValues, type UsernameValues } from "@/features/profiles/schemas/profile-schema";

export function ProfilePage() {
  const { user } = useAuth();
  const profile = useProfile(user?.id ?? "");

  if (!user) return null;
  if (profile.isPending) return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  if (profile.isError) return <p role="alert" className="text-sm text-red-400">Could not load your profile.</p>;

  return <section className="space-y-8"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Account</p><h1 className="mt-2 text-3xl font-bold">Edit profile</h1><p className="mt-2 text-muted-foreground">Manage how you appear in Aim Protocol and keep your account secure.</p></div><UsernameForm userId={user.id} initialUsername={profile.data.username} /><EmailForm initialEmail={user.email ?? ""} /><PasswordForm email={user.email ?? ""} /></section>;
}

function UsernameForm({ userId, initialUsername }: { userId: string; initialUsername: string }) {
  const mutation = useUpdateUsername();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UsernameValues>({ resolver: zodResolver(usernameSchema), defaultValues: { username: initialUsername } });
  useEffect(() => reset({ username: initialUsername }), [initialUsername, reset]);
  return <Card><CardHeader><CardTitle>Public profile</CardTitle><CardDescription>Your username is shown in the application header.</CardDescription></CardHeader><CardContent><form className="max-w-md space-y-4" onSubmit={handleSubmit((values) => mutation.mutate({ userId, username: values.username }))}><Field label="Username" error={errors.username?.message}><Input autoComplete="username" {...register("username")} /></Field><MutationFeedback mutation={mutation} success="Username updated." /><Button disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save username"}</Button></form></CardContent></Card>;
}

function EmailForm({ initialEmail }: { initialEmail: string }) {
  const mutation = useUpdateAccountEmail();
  const { register, handleSubmit, formState: { errors } } = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: initialEmail } });
  return <Card><CardHeader><CardTitle>Email address</CardTitle><CardDescription>Supabase may ask you to confirm the new address before it changes.</CardDescription></CardHeader><CardContent><form className="max-w-md space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values.email))}><Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field><MutationFeedback mutation={mutation} success="Check your inbox to confirm the email change." /><Button disabled={mutation.isPending}>{mutation.isPending ? "Updating…" : "Update email"}</Button></form></CardContent></Card>;
}

function PasswordForm({ email }: { email: string }) {
  const mutation = useChangeAccountPassword();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const submit = async (values: PasswordValues) => {
    try {
      await mutation.mutateAsync({ email, currentPassword: values.currentPassword, newPassword: values.newPassword });
      reset();
    } catch {
      // The mutation state renders the authentication error below the form.
    }
  };
  return <Card><CardHeader><CardTitle>Change password</CardTitle><CardDescription>Confirm your current password before setting a new one.</CardDescription></CardHeader><CardContent><form className="max-w-md space-y-4" onSubmit={handleSubmit((values) => void submit(values))}><Field label="Current password" error={errors.currentPassword?.message}><Input type="password" autoComplete="current-password" {...register("currentPassword")} /></Field><Field label="New password" error={errors.newPassword?.message}><Input type="password" autoComplete="new-password" {...register("newPassword")} /></Field><Field label="Confirm new password" error={errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...register("confirmPassword")} /></Field><MutationFeedback mutation={mutation} success="Password updated." /><Button disabled={mutation.isPending || !email}>{mutation.isPending ? "Updating…" : "Change password"}</Button></form></CardContent></Card>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-sm text-red-400">{error}</p>}</div>;
}

function MutationFeedback({ mutation, success }: { mutation: { isError: boolean; isSuccess: boolean; error: Error | null }; success: string }) {
  if (mutation.isError) return <p role="alert" className="text-sm text-red-400">{mutation.error?.message}</p>;
  if (mutation.isSuccess) return <p role="status" className="text-sm text-emerald-400">{success}</p>;
  return null;
}
