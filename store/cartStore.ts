import { create } from "zustand";

import { supabase } from "../services/supabase";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  loadCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  increaseQuantity: (id: string) => Promise<void>;
  decreaseQuantity: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

type CartRow = {
  id: string;
  quantity: number;
  medicine: {
    id: string;
    name: string;
    price: number;
  } | null;
};

const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Please login first.");
  }

  return user.id;
};

const getOrCreateCart = async (userId: string) => {
  const { data: existingCart, error: findError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existingCart) {
    return existingCart.id;
  }

  const { data: newCart, error: createError } = await supabase
    .from("carts")
    .insert({
      user_id: userId,
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return newCart.id;
};

const fetchCartItems = async (cartId: string): Promise<CartItem[]> => {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        quantity,
        medicine:medicines (
          id,
          name,
          price
        )
      `,
    )
    .eq("cart_id", cartId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as CartRow[])
    .filter((row) => row.medicine)
    .map((row) => ({
      id: row.medicine!.id,
      name: row.medicine!.name,
      price: Number(row.medicine!.price),
      quantity: row.quantity,
    }));
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  loadCart: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);
      const items = await fetchCartItems(cartId);

      set({
        items,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load cart.",
      });
    }
  },

  addToCart: async (item) => {
    set({
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);

      const { data: existingItem, error: findError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("medicine_id", item.id)
        .maybeSingle();

      if (findError) {
        throw new Error(findError.message);
      }

      if (existingItem) {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: existingItem.quantity + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            medicine_id: item.id,
            quantity: 1,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      const items = await fetchCartItems(cartId);

      set({
        items,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to add item to cart.",
      });
      throw error;
    }
  },

  removeFromCart: async (medicineId) => {
    set({
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId)
        .eq("medicine_id", medicineId);

      if (error) {
        throw new Error(error.message);
      }

      const items = await fetchCartItems(cartId);

      set({
        items,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to remove item.",
      });
      throw error;
    }
  },

  increaseQuantity: async (medicineId) => {
    set({
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);

      const { data: existingItem, error: findError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("medicine_id", medicineId)
        .maybeSingle();

      if (findError) {
        throw new Error(findError.message);
      }

      if (!existingItem) {
        return;
      }

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const items = await fetchCartItems(cartId);

      set({
        items,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to increase quantity.",
      });
      throw error;
    }
  },

  decreaseQuantity: async (medicineId) => {
    set({
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);

      const { data: existingItem, error: findError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("medicine_id", medicineId)
        .maybeSingle();

      if (findError) {
        throw new Error(findError.message);
      }

      if (!existingItem) {
        return;
      }

      if (existingItem.quantity <= 1) {
        const { error: deleteError } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", existingItem.id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: existingItem.quantity - 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      const items = await fetchCartItems(cartId);

      set({
        items,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to decrease quantity.",
      });
      throw error;
    }
  },

  clearCart: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const userId = await getCurrentUserId();
      const cartId = await getOrCreateCart(userId);

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);

      if (error) {
        throw new Error(error.message);
      }

      set({
        items: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to clear cart.",
      });
      throw error;
    }
  },
}));
