import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { Meal } from "./types";

const COLLECTION = "meals";

export function generateOrderNumber(): string {
  const d = new Date();
  const date =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPS-${date}-${rand}`;
}

export async function getAllMeals(): Promise<Meal[]> {
  const q = query(collection(db, COLLECTION), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Meal, "id">) }));
}

export async function getAvailableMeals(): Promise<Meal[]> {
  const q = query(
    collection(db, COLLECTION),
    where("available", "==", true),
    orderBy("updatedAt", "desc")
  );
  try {
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Meal, "id">) }))
      .filter((m) => m.stock > 0);
  } catch {
    // fallback si falta indice compuesto
    const all = await getAllMeals();
    return all.filter((m) => m.available && m.stock > 0);
  }
}

export async function createMeal(
  data: Omit<Meal, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateMeal(
  id: string,
  data: Partial<Omit<Meal, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteMeal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function uploadMealImage(file: File, mealId?: string): Promise<string> {
  const name = `${mealId || "new"}_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const storageRef = ref(storage, `meals/${name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
