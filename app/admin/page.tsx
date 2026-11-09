"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getOrders, updateOrderStatus } from "@/lib/orders";
import { Order } from "@/lib/types";
import { DAYS_OPTIONS, PREFERENCE_OPTIONS, MEALS } from "@/lib/meals";
import clsx from "clsx";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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

  const changeStatus = async (orderId: string, status: Order["status"]) => {
    await updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

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
            <h1 className="text-2xl font-bold">Admin \u00b7 Ready pa&apos; la semana</h1>
            <p className="text-gray-500 text-sm mt-1">Inicia sesi\u00f3n para ver los pedidos</p>
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
            <label className="block text-sm font-medium mb-1.5">Contrase\u00f1a</label>
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
          <p className="text-center text-xs text-gray-400">
            Usa una cuenta de Firebase Auth del proyecto agromaxgt-app
          </p>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Pedidos ({orders.length})</h2>
          <a href="/" className="text-sm text-brand-600 hover:underline">
            \u2190 Ir al sitio
          </a>
        </div>

        {ordersLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            A\u00fan no hay pedidos. Cuando alguien complete el flujo aparecer\u00e1n aqu\u00ed.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
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
                      <div className="font-semibold text-lg">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer.email} \u00b7 {order.customer.phone}
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
                      <span className="text-gray-400">Direcci\u00f3n:</span>{" "}
                      <span className="font-medium">
                        {order.customer.address}, {order.customer.city} {order.customer.zip}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Plan:</span>{" "}
                      <span className="font-medium">
                        {daysLabel} \u00b7 {prefLabel} \u00b7 {order.plan.people} pers.
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Comidas:</span>{" "}
                      <span className="font-medium">{mealNames || "\u2014"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total:</span>{" "}
                      <span className="font-bold text-brand-700">
                        ${order.pricing.total.toFixed(2)}
                      </span>
                      {order.pricing.discount > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          (ahorro ${order.pricing.discount.toFixed(2)})
                        </span>
                      )}
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