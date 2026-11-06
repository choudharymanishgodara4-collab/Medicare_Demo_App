import { supabase } from "./supabase";

export type Medicine = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  manufacturer: string;
};

export async function getMedicines(): Promise<Medicine[]> {
  const { data, error } = await supabase
    .from("medicines")
    .select("id, name, category, price, description, manufacturer")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((medicine) => ({
    id: medicine.id,
    name: medicine.name,
    category: medicine.category,
    price: Number(medicine.price),
    description: medicine.description,
    manufacturer: medicine.manufacturer,
  }));
}

export async function getMedicineById(id: string): Promise<Medicine | null> {
  const { data, error } = await supabase
    .from("medicines")
    .select("id, name, category, price, description, manufacturer")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    description: data.description,
    manufacturer: data.manufacturer,
  };
}
