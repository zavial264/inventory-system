"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createPlatformUserAction } from "@/lib/data/user-actions";
import {
  createPlatformUserSchema,
  type CreatePlatformUserInput,
} from "@/lib/schemas";

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";

function generateClientPassword(length = 12) {
  return Array.from(
    { length },
    () => PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)],
  ).join("");
}

type CreatedCredentials = {
  email: string;
  password: string;
};

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [credentials, setCredentials] =
    React.useState<CreatedCredentials | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlatformUserInput>({
    resolver: zodResolver(createPlatformUserSchema),
    defaultValues: { email: "", password: "" },
  });

  const passwordValue = watch("password");

  React.useEffect(() => {
    if (!open) return;
    reset({ email: "", password: "" });
    setCredentials(null);
  }, [open, reset]);

  const closeDialog = () => {
    setCredentials(null);
    onOpenChange(false);
  };

  const onSubmit = async (values: CreatePlatformUserInput) => {
    const result = await createPlatformUserAction(values);
    if (!result.ok) {
      setError("email", { message: result.error });
      return;
    }

    onCreated();
    setCredentials(result.data);
    toast.success(`${result.data.email} added`);
  };

  const loginUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/login?email=${encodeURIComponent(credentials?.email ?? "")}`
      : "/login";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Share login details</DialogTitle>
              <DialogDescription>
                Send these to the new admin over Slack, WhatsApp, or in person.
                They sign in at the login page with this email and password.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <CredentialRow
                label="Email"
                value={credentials.email}
                onCopy={() => copyText("Email", credentials.email)}
              />
              <CredentialRow
                label="Password"
                value={credentials.password}
                onCopy={() => copyText("Password", credentials.password)}
              />
              <CredentialRow
                label="Login link"
                value={loginUrl}
                onCopy={() => copyText("Login link", loginUrl)}
              />
            </div>

            <DialogFooter>
              <Button type="button" onClick={closeDialog}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add admin</DialogTitle>
              <DialogDescription>
                Create a platform login. Leave the password blank to generate
                one automatically.
              </DialogDescription>
            </DialogHeader>

            <form
              id="create-user-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                label="Email"
                htmlFor="create-user-email"
                required
                error={errors.email?.message}
              >
                <Input
                  id="create-user-email"
                  type="email"
                  autoComplete="email"
                  placeholder="manager@boutique.com"
                  autoFocus
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
              </FormField>

              <FormField
                label="Password"
                htmlFor="create-user-password"
                hint="Optional — leave blank to auto-generate"
                error={errors.password?.message}
              >
                <div className="flex gap-2">
                  <Input
                    id="create-user-password"
                    type="text"
                    autoComplete="new-password"
                    placeholder="Auto-generate if empty"
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Generate password"
                    onClick={() =>
                      setValue("password", generateClientPassword(), {
                        shouldValidate: true,
                      })
                    }
                  >
                    <RefreshCwIcon className="size-4" />
                  </Button>
                </div>
              </FormField>

              {passwordValue ? (
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters. Share this password securely after
                  creating the account.
                </p>
              ) : null}
            </form>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-user-form"
                disabled={isSubmitting}
              >
                Create account
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 break-all font-medium">{value}</p>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={onCopy}
        >
          <CopyIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
