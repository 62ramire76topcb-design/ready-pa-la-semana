import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Order } from "./types";

const ORDERS_COLLECTION = "ready_orders";

export async function createOrder(order: Omit<Order, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...order,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Order, "id">),
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<void> {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { status });
}