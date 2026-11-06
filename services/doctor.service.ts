import { supabase } from "./supabase";

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  city: string;
  experience: number;
  rating: number;
  category: string;
};

export async function getDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      `
      user_id,
      specialization,
      city,
      experience,
      rating,
      category,
      profiles!inner (
        id,
        full_name,
        role
      )
    `,
    )
    .eq("profiles.role", "doctor")
    .order("full_name", {
      referencedTable: "profiles",
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const profile = Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles;

    return {
      id: item.user_id,
      name: profile?.full_name ?? "Doctor",
      specialization: item.specialization,
      city: item.city,
      experience: Number(item.experience),
      rating: Number(item.rating),
      category: item.category,
    };
  });
}

export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      `
      user_id,
      specialization,
      city,
      experience,
      rating,
      category,
      profiles!inner (
        id,
        full_name,
        role
      )
    `,
    )
    .eq("user_id", doctorId)
    .eq("profiles.role", "doctor")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const profile = Array.isArray(data.profiles)
    ? data.profiles[0]
    : data.profiles;

  return {
    id: data.user_id,
    name: profile?.full_name ?? "Doctor",
    specialization: data.specialization,
    city: data.city,
    experience: Number(data.experience),
    rating: Number(data.rating),
    category: data.category,
  };
}
