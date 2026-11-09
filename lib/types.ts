export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PlanData {
  days: string | null;
  preference: string | null;
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
}

export interface Order {
  id?: string;
  createdAt: number;
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
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
  };
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
  };
  stripeSessionId?: string;
}