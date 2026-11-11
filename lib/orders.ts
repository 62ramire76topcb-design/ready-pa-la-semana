import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { Order, OrderStatus } from "./types";

const ORDERS_COLLECTION = "ready_orders";

export async function createOrder(order: Omit<Order, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...order,
    createdAt: Date.now(),
    statusHistory: [{ status: order.status, at: Date.now() }],
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

export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, ORDERS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("orderNumber", "==", orderNumber)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...(d.data() as Omit<Order, "id">) };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  const snap = await getDoc(ref);
  const prev = snap.data();
  const history = Array.isArray(prev?.statusHistory) ? prev.statusHistory : [];
  await updateDoc(ref, {
    status,
    statusHistory: [...history, { status, at: Date.now() }],
  });
}
