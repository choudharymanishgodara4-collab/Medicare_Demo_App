import { supabase } from "./supabase";

export type Patient = {
  id: string;
  full_name: string;
  mobile: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  avatar_url: string | null;
};

export async function getPatients(): Promise<Patient[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Please login first.");
  }

  if (!user.id) {
    throw new Error("Invalid user session.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        mobile,
        date_of_birth,
        gender,
        city,
        avatar_url
      `,
    )
    .eq("role", "patient")
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
