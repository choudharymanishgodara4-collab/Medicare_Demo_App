import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Patient Registration
|--------------------------------------------------------------------------
*/

export const patientRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(
        2,
        "Full name must be at least 2 characters"
      ),

    mobile: z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "Enter a valid 10-digit mobile number"
      ),

    email: z
      .string()
      .email(
        "Enter a valid email address"
      ),

    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      ),

    confirmPassword: z
      .string()
      .min(
        1,
        "Please confirm your password"
      ),

    dateOfBirth: z
      .string()
      .min(
        1,
        "Date of birth is required"
      ),

    gender: z
      .string()
      .min(
        1,
        "Gender is required"
      ),

    city: z
      .string()
      .min(
        2,
        "City is required"
      ),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export type PatientRegisterForm =
  z.infer<
    typeof patientRegisterSchema
  >;


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const loginSchema = z.object({
  email: z
    .string()
    .email(
      "Enter a valid email address"
    ),

  password: z
    .string()
    .min(
      1,
      "Password is required"
    ),
});

export type LoginForm =
  z.infer<typeof loginSchema>;