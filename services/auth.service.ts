import { supabase } from "./supabase";

type SignUpData = {
  email: string;
  password: string;
  fullName: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  city: string;
};

export async function signUpPatient(data: SignUpData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,

    options: {
      data: {
        role: "patient",
        fullName: data.fullName,
        mobile: data.mobile,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        city: data.city,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, mobile, date_of_birth, gender, city, avatar_url",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Profile not found for the currently logged-in user.");
  }

  return data;
}
