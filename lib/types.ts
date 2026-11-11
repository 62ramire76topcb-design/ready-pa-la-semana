export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Meal {
  id?: string;
  name: string;
  description: string; // ingredientes / descripcion corta
  price: number;
  imageUrl: string;
  available: boolean; // disponible hoy / publicado
  stock: number; // stock bajo editable
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  mealId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  createdAt: number;
  status: OrderStatus;
  type: "menu" | "special";
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    notes?: string;
  };
  items: CartItem[];
  specialRequest?: string; // pedido especial
  deliveryDate?: string; // fecha programada YYYY-MM-DD
  pricing: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  stripeSessionId?: string;
  statusHistory?: { status: OrderStatus; at: number }[];
}

export const DELIVERY_ZONE = "Charlotte, NC";
export const DELIVERY_FEE = 5;
