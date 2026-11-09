"use client";

import { useState, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getOrders, updateOrderStatus } from "@/lib/orders";
import { Order, OrderStatus } from "@/lib/types";
import { DAYS_OPTIONS, PREFERENCE_OPTIONS, MEALS } from "@/lib/meals";
import clsx from "clsx";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) loadOrders();
    });
    return () => unsub();
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setOrdersLoading(false);
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
    setOrders([]);
  };

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (filterStatus !== "all") {
      list = list.filter((o) => o.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.city.toLowerCase().includes(q) ||
          o.customer.zip.includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    ALL_STATUSES.forEach((s) => {
      c[s] = orders.filter((o) => o.status === s).length;
    });
    return c;
  }, [orders]);

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
            <p className="text-gray-500 text-sm mt-1">Inicia sesion para ver los pedidos</p>
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold">
              R
            </div>
            <div>
              <h1 className="font-bold text-lg">Panel Admin</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">
            Pedidos ({filtered.length}
            {filterStatus !== "all" || search ? ` de ${orders.length}` : ""})
          </h2>
          <input
            type="text"
            placeholder="Buscar por orden, nombre, email, telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none text-sm w-full sm:w-80"
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              filterStatus === "all"
                ? "bg-brand-600 text-white border-brand-600"
                : "border-gray-200 hover:bg-gray-50"
            )}
          >
            Todos ({counts.all})
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                filterStatus === s
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              {STATUS_LABELS[s]} ({counts[s] || 0})
            </button>
          ))}
        </div>

        {ordersLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando pedidos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No hay pedidos con estos filtros.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const daysLabel =
                DAYS_OPTIONS.find((d) => d.id === order.plan.days)?.label || order.plan.days;
              const prefLabel =
                PREFERENCE_OPTIONS.find((p) => p.id === order.plan.preference)?.label ||
                order.plan.preference;
              const mealNames = order.plan.meals
                .map((id) => MEALS.find((m) => m.id === id)?.name || id)
                .join(", ");

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="font-mono text-sm text-brand-700 font-semibold">
                        {order.orderNumber || order.id}
                      </div>
                      <div className="font-semibold text-lg">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer.email} · {order.customer.phone}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "text-xs font-medium px-3 py-1 rounded-full",
                        STATUS_COLORS[order.status]
                      )}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Direccion:</span>{" "}
                      <span className="font-medium">
                        {order.customer.address}, {order.customer.city}{" "}
                        {order.customer.zip}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Plan:</span>{" "}
                      <span className="font-medium">
                        {daysLabel} · {prefLabel} · {order.plan.people} pers.
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Comidas:</span>{" "}
                      <span className="font-medium">{mealNames || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total:</span>{" "}
                      <span className="font-bold text-brand-700">
                        ${order.pricing.total.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Fecha:</span>{" "}
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleString("es-US")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["paid", "preparing", "shipped", "delivered", "cancelled"] as const).map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => order.id && changeStatus(order.id, s)}
                          disabled={order.status === s}
                          className={clsx(
                            "text-xs px-3 py-1.5 rounded-lg border transition-colors",
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
