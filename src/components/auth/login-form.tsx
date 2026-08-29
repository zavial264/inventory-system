"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";

import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/data/auth-actions";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm({
  nextPath,
  defaultEmail,
}: {
  nextPath?: string;
  defaultEmail?: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail ?? "", password: "" },
  });

  React.useEffect(() => {
    reset({ email: defaultEmail ?? "", password: "" });
  }, [defaultEmail, reset]);

  const onSubmit = async (values: LoginInput) => {
    const result = await signInAction(values);

    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }

    window.location.assign(nextPath ?? result.data.redirectTo);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@boutique.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
      </FormField>

      {errors.root?.message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
