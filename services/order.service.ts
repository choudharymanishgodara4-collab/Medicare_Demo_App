import { supabase } from "./supabase";

export type CreateOrderItem = {
  medicineId: string;
  medicineName: string;
  price: number;
  quantity: number;
};

export async function createOrder(items: CreateOrderItem[], addressId: string) {
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

  if (items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  if (!addressId) {
    throw new Error("Please select a delivery address.");
  }

  const { data: address, error: addressError } = await supabase
    .from("delivery_addresses")
    .select(
      `
      id,
      full_name,
      mobile,
      address_line1,
      address_line2,
      city,
      state,
      postal_code
    `,
    )
    .eq("id", addressId)
    .eq("patient_id", user.id)
    .single();

  if (addressError) {
    throw new Error(addressError.message);
  }

  if (!address) {
    throw new Error("Selected delivery address was not found.");
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const deliveryFee = 0;
  const totalAmount = subtotal + deliveryFee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "PLACED",

      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,

      address_id: address.id,
      address_name: address.full_name,
      address_mobile: address.mobile,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      address_city: address.city,
      address_state: address.state,
      address_postal_code: address.postal_code,

      payment_method: "COD",
      payment_status: "PENDING",
    })
    .select(
      `
      id,
      status,
      subtotal,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      address_id,
      created_at
    `,
    )
    .single();

  if (orderError) {
    throw new Error(orderError.message);
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    medicine_id: item.medicineId,
    medicine_name: item.medicineName,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);

    throw new Error(itemsError.message);
  }

  return order;
}

export async function getMyOrders() {
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

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      subtotal,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      created_at
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    delivery_fee: Number(order.delivery_fee),
    total_amount: Number(order.total_amount),
  }));
}
