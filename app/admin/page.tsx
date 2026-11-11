"use client";

import { useEffect, useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getAllMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  uploadMealImage,
} from "@/lib/meals";
import { getOrders, updateOrderStatus } from "@/lib/orders";
import { Meal, Order, OrderStatus } from "@/lib/types";
import clsx from "clsx";

type Tab = "meals" | "orders";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const emptyMealForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  available: true,
  stock: "5",
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("meals");

  const [meals, setMeals] = useState<Meal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [form, setForm] = useState(emptyMealForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) refresh();
    });
    return () => unsub();
  }, []);

  const refresh = async () => {
    setDataLoading(true);
    try {
      const [m, o] = await Promise.all([getAllMeals(), getOrders()]);
      setMeals(m);
      setOrders(o);
    } catch (e) {
      console.error(e);
    }
    setDataLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setAuthError("Credenciales incorrectas");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMeals([]);
    setOrders([]);
  };

  const resetForm = () => {
    setForm(emptyMealForm);
    setEditingId(null);
    setFormError("");
  };

  const startEdit = (meal: Meal) => {
    setEditingId(meal.id || null);
    setForm({
      name: meal.name,
      description: meal.description,
      price: String(meal.price),
      imageUrl: meal.imageUrl || "",
      available: meal.available,
      stock: String(meal.stock),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const url = await uploadMealImage(file, editingId || undefined);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      console.error(err);
      setFormError(
        "No se pudo subir la imagen. Revisa Firebase Storage (reglas y bucket)."
      );
    }
    setUploading(false);
  };

  const saveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (isNaN(price) || price < 0) {
      setFormError("Precio invalido");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError("Stock invalido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        imageUrl: form.imageUrl.trim(),
        available: form.available,
        stock,
      };
      if (editingId) {
        await updateMeal(editingId, payload);
      } else {
        await createMeal(payload);
      }
      resetForm();
      await refresh();
    } catch (err) {
      console.error(err);
      setFormError("Error al guardar. Revisa reglas de Firestore.");
    }
    setSaving(false);
  };

  const toggleAvailable = async (meal: Meal) => {
    if (!meal.id) return;
    await updateMeal(meal.id, { available: !meal.available });
    await refresh();
  };

  const removeMeal = async (id: string) => {
    if (!confirm("Eliminar este plato?")) return;
    await deleteMeal(id);
    await refresh();
  };

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filterStatus !== "all") list = list.filter((o) => o.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          (o.specialRequest || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-brand-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-3">
              R
            </div>
            <h1 className="text-2xl font-bold">Admin · Ready pa&apos; la semana</h1>
            <p className="text-gray-500 text-sm mt-1">Control del menu y pedidos</p>
          </div>
          {authError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{authError}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold">
              R
            </div>
            <div>
              <h1 className="font-bold text-lg">Panel Admin</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab("meals")}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-medium",
                  tab === "meals" ? "bg-white shadow text-brand-800" : "text-gray-600"
                )}
              >
                Menu / Platos
              </button>
              <button
                onClick={() => setTab("orders")}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-medium",
                  tab === "orders" ? "bg-white shadow text-brand-800" : "text-gray-600"
                )}
              >
                Pedidos ({orders.length})
              </button>
            </div>
            <button
              onClick={refresh}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {dataLoading && (
          <p className="text-center text-gray-400 mb-4">Cargando...</p>
        )}

        {tab === "meals" && (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <form
                onSubmit={saveMeal}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 sticky top-24"
              >
                <h2 className="font-bold text-lg">
                  {editingId ? "Editar plato" : "Agregar plato nuevo"}
                </h2>
                <p className="text-xs text-gray-500">
                  Publica cuando tengas comida lista o sobras para vender rapido.
                </p>

                {formError && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Pollo guisado con arroz"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ingredientes / descripcion
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Pollo, arroz, habichuelas, cilantro..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImage(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                  {uploading && (
                    <p className="text-xs text-brand-700 mt-1">Subiendo imagen...</p>
                  )}
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="mt-2 h-28 w-full object-cover rounded-lg"
                    />
                  )}
                  <input
                    type="url"
                    placeholder="O pega una URL de imagen"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, available: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  Publicado / disponible hoy
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Publicar plato"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista platos */}
            <div className="lg:col-span-3 space-y-3">
              <h2 className="font-bold text-lg mb-2">
                Tus platos ({meals.length})
              </h2>
              {meals.length === 0 ? (
                <p className="text-gray-400 py-10 text-center">
                  Aun no hay platos. Agrega el primero a la izquierda.
                </p>
              ) : (
                meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {meal.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={meal.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{meal.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {meal.description}
                          </div>
                        </div>
                        <div className="font-bold text-brand-700">
                          ${meal.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full",
                            meal.available
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {meal.available ? "Publicado" : "Oculto"}
                        </span>
                        <span className="text-gray-500">Stock: {meal.stock}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => startEdit(meal)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleAvailable(meal)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          {meal.available ? "Ocultar hoy" : "Publicar hoy"}
                        </button>
                        <button
                          onClick={() => meal.id && removeMeal(meal.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Buscar orden, nombre, email, especial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {(["all", "pending", "paid", "preparing", "ready", "delivered", "cancelled"] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={clsx(
                      "text-xs px-3 py-1.5 rounded-full border",
                      filterStatus === s
                        ? "bg-brand-600 text-white border-brand-600"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {s === "all" ? "Todos" : STATUS_LABELS[s]}
                  </button>
                )
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-16">No hay pedidos.</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <div>
                        <div className="font-mono text-sm text-brand-700 font-semibold">
                          {order.orderNumber}
                        </div>
                        <div className="font-semibold text-lg">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {order.customer.email} · {order.customer.phone}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={clsx(
                            "text-xs font-medium px-3 py-1 rounded-full",
                            STATUS_COLORS[order.status]
                          )}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        {order.type === "special" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                            Especial
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm space-y-1 mb-3">
                      <div>
                        <span className="text-gray-400">Direccion:</span>{" "}
                        {order.customer.address}, {order.customer.city}{" "}
                        {order.customer.zip}
                      </div>
                      {order.deliveryDate && (
                        <div>
                          <span className="text-gray-400">Entrega:</span>{" "}
                          {order.deliveryDate}
                        </div>
                      )}
                      {order.specialRequest && (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mt-2">
                          <span className="text-orange-800 font-medium">Pedido especial:</span>{" "}
                          {order.specialRequest}
                        </div>
                      )}
                      {order.items?.length > 0 && (
                        <div>
                          <span className="text-gray-400">Items:</span>{" "}
                          {order.items
                            .map((i) => `${i.qty}x ${i.name}`)
                            .join(", ")}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Total:</span>{" "}
                        <strong className="text-brand-700">
                          ${order.pricing?.total?.toFixed(2) ?? "0.00"}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(["paid", "preparing", "ready", "delivered", "cancelled"] as const).map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => order.id && changeStatus(order.id, s)}
                            disabled={order.status === s}
                            className={clsx(
                              "text-xs px-3 py-1.5 rounded-lg border",
                              order.status === s
                                ? "bg-brand-600 text-white border-brand-600"
                                : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
