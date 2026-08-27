import { z } from "zod";

import { SIZES } from "@/lib/types";

const requiredId = (message: string) => z.string().min(1, message);

export const employeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the employee's full name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .refine((value) => value === "" || /^[0-9+\-\s()]{7,20}$/.test(value), {
      message: "Enter a valid phone number",
    })
    .optional()
    .or(z.literal("")),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const assignmentSchema = z.object({
  employeeId: requiredId("Select an employee"),
  articleTypeId: requiredId("Select an article"),
  size: z.enum(SIZES, { message: "Select a size" }),
  quantityAssigned: z
    .number({ message: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(10_000, "Quantity looks too large"),
  notes: z.string().trim().max(200, "Notes are too long").optional(),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const completionSchema = z.object({
  quantity: z
    .number({ message: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  completedOn: z.string().min(1, "Select a date"),
  note: z.string().trim().max(200, "Note is too long").optional(),
});

export type CompletionInput = z.infer<typeof completionSchema>;

export const topUpSchema = z.object({
  additionalQuantity: z
    .number({ message: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(10_000, "Quantity looks too large"),
  reason: z.string().trim().max(200, "Reason is too long").optional(),
});

export type TopUpInput = z.infer<typeof topUpSchema>;

export const reversalSchema = z.object({
  quantity: z
    .number({ message: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  reason: z.string().trim().min(3, "A reason is required for a reversal"),
});

export type ReversalInput = z.infer<typeof reversalSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
