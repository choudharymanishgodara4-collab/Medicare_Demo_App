import { supabase } from "./supabase";

export type UpdateProfileData = {
  full_name: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  city: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, mobile, date_of_birth, gender, city, avatar_url"
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProfile(
  userId: string,
  profile: UpdateProfileData
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.full_name,
      mobile: profile.mobile,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      city: profile.city,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(
      "id, role, full_name, mobile, date_of_birth, gender, city, avatar_url"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadAvatar(
  userId: string,
  uri: string,
  contentType: string = "image/jpeg"
) {
  const extension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";

  const newPath =
    `${userId}/profile.${extension}`;

  const arrayBuffer = await fetch(uri).then(
    (response) => response.arrayBuffer()
  );

  const { data: currentProfile } =
    await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

  if (
    currentProfile?.avatar_url &&
    currentProfile.avatar_url !== newPath
  ) {
    await supabase.storage
      .from("avatars")
      .remove([
        currentProfile.avatar_url,
      ]);
  }

  const { error: uploadError } =
    await supabase.storage
      .from("avatars")
      .upload(
        newPath,
        arrayBuffer,
        {
          contentType,
          cacheControl: "3600",
          upsert: true,
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message
    );
  }

  const { error: profileError } =
    await supabase
      .from("profiles")
      .update({
        avatar_url: newPath,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", userId);

  if (profileError) {
    throw new Error(
      profileError.message
    );
  }

  return newPath;
}

export async function getAvatarUrl(
  path: string
) {
  const cacheBuster = Date.now();

  const { data, error } =
    await supabase.storage
      .from("avatars")
      .createSignedUrl(
        path,
        60 * 60
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return `${data.signedUrl}&v=${cacheBuster}`;
}

export async function deleteAvatar(
  userId: string
) {
  const { data: profile } =
    await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

  if (profile?.avatar_url) {
    const { error: deleteError } =
      await supabase.storage
        .from("avatars")
        .remove([
          profile.avatar_url,
        ]);

    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }
  }

  const { error: profileError } =
    await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", userId);

  if (profileError) {
    throw new Error(
      profileError.message
    );
  }
}