"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { articleSchema, type ArticleInput } from "@/lib/schemas";
import { useInventory } from "@/lib/store/inventory-provider";
import type { ArticleType } from "@/lib/types";

export function ArticleDialog({
  open,
  onOpenChange,
  article,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: ArticleType;
}) {
  const { createArticleType, updateArticleType } = useInventory();
  const isEdit = Boolean(article);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: { name: "", stitchingPrice: 0 },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      name: article?.name ?? "",
      stitchingPrice: article?.stitchingPrice ?? 0,
    });
  }, [open, article, reset]);

  const onSubmit = async (values: ArticleInput) => {
    if (article) {
      const result = await updateArticleType(article.id, values);
      if (!result.ok) {
        setError("name", { message: result.error });
        return;
      }
      toast.success(`${values.name.trim()} updated`);
      onOpenChange(false);
      return;
    }

    const result = await createArticleType(values);
    if (!result.ok) {
      setError("name", { message: result.error });
      return;
    }
    toast.success(`${result.data.name} added`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit article" : "New article"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name or stitching rate. Existing assignments keep the rate they were created with."
              : "Add a garment type so you can assign it to employees."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="article-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            label="Article name"
            htmlFor="article-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="article-name"
              placeholder="e.g. Waistcoat"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Stitching rate (₹)"
            htmlFor="article-rate"
            required
            error={errors.stitchingPrice?.message}
          >
            <Input
              id="article-rate"
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              placeholder="e.g. 600"
              aria-invalid={Boolean(errors.stitchingPrice)}
              {...register("stitchingPrice", { valueAsNumber: true })}
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="article-form" disabled={isSubmitting}>
            {isEdit ? "Save changes" : "Add article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
