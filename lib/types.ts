export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PlanData {
  days: string | null;
  preference: string | null;
  avoid: string[];
  goals: string[];
  people: string | null;
  selectedMeals: string[];
  zip: string;
  address: string;
  city: string;
  name: string;
  phone: string;
  email: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  tags: string[];
  emoji: string;
  price: number;
  image: string;
}

export type OrderStatus =
  | "lead"
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderSource = "stripe" | "whatsapp" | "manual";

export interface Order {
  id?: string;
  orderNumber: string;
  createdAt: number;
  status: OrderStatus;
  source?: OrderSource;
  notes?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    zip: string;
    address: string;
    city: string;
  };
  plan: {
    days: string;
    preference: string;
    people: string;
    meals: string[];
    avoid?: string[];
    goals?: string[];
  };
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
  };
  stripeSessionId?: string;
  statusHistory?: { status: OrderStatus; at: number }[];
}
