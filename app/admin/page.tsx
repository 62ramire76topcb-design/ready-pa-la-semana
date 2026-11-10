"use client";

import { useState, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getOrders, updateOrderStatus, updateOrderNotes, createOrder, deleteOrder } from "@/lib/orders";
import { Order, OrderStatus } from "@/lib/types";
import { DAYS_OPTIONS, PREFERENCE_OPTIONS, MEALS, generateOrderNumber, PRICES } from "@/lib/meals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import clsx from "clsx";

const STATUS_LABELS: Record<OrderStatus, string> = {
  lead: "Lead (WhatsApp)",
  pending: "Pendiente pago",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  lead: "bg-emerald-100 text-emerald-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ALL_STATUSES: OrderStatus[] = [
  "lead",
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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [manual, setManual] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    days: "3",
    notes: "",
  });

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
      const drafts: Record<string, string> = {};
      data.forEach((o) => {
        if (o.id) drafts[o.id] = o.notes || "";
      });
      setNoteDrafts(drafts);
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
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const saveNotes = async (orderId: string) => {
    const notes = noteDrafts[orderId] || "";
    await updateOrderNotes(orderId, notes);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, notes } : o)));
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Eliminar este pedido?")) return;
    await deleteOrder(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const orderNumber = generateOrderNumber();
      const total = PRICES[manual.days] ? +(PRICES[manual.days] * 0.5).toFixed(2) : 39.99;
      const id = await createOrder({
        orderNumber,
        createdAt: Date.now(),
        status: "lead",
        source: "manual",
        notes: manual.notes,
        customer: {
          name: manual.name,
          email: manual.email || "sin-email@local",
          phone: manual.phone,
          zip: manual.zip || "00000",
          address: manual.address || "Por definir",
          city: manual.city || "Por definir",
        },
        plan: {
          days: manual.days,
          preference: "balanced",
          people: "1",
          meals: [],
        },
        pricing: {
          subtotal: total * 2,
          discount: total,
          total,
        },
      });
      await loadOrders();
      setShowCreate(false);
      setManual({ name: "", phone: "", email: "", address: "", city: "", zip: "", days: "3", notes: "" });
      // Copiar numero al portapapeles
      try {
        await navigator.clipboard.writeText(orderNumber);
        alert(`Orden creada: ${orderNumber}\n(Numero copiado al portapapeles)`);
      } catch {
        alert(`Orden creada: ${orderNumber}`);
      }
      void id;
    } catch (err) {
      console.error(err);
      alert("Error al crear orden");
    }
    setCreating(false);
  };

  const filtered = useMemo(() => {
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
          o.customer.city.toLowerCase().includes(q) ||
          (o.notes || "").toLowerCase().includes(q)
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

  const stats = useMemo(() => {
    const paid = orders.filter((o) => ["paid", "preparing", "shipped", "delivered"].includes(o.status));
    const revenue = paid.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const leads = orders.filter((o) => o.status === "lead").length;
    return { paid: paid.length, revenue, leads, total: orders.length };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-3">R</div>
            <h1 className="text-2xl font-bold">Admin · Ready pa&apos; la semana</h1>
          </div>
          {authError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{authError}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Contrasena</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none" required />
          </div>
          <button type="submit" className="w-full py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center font-bold">R</div>
            <div>
              <h1 className="font-bold text-lg">Panel Admin</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={() => setShowCreate(true)} className="text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800">
              + Nueva orden
            </button>
            <button onClick={loadOrders} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Actualizar</button>
            <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total pedidos" value={String(stats.total)} />
          <StatCard label="Leads WhatsApp" value={String(stats.leads)} accent />
          <StatCard label="Pagados / activos" value={String(stats.paid)} />
          <StatCard label="Ingresos" value={`$${stats.revenue.toFixed(2)}`} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">
            Pedidos ({filtered.length}{filterStatus !== "all" || search ? ` de ${orders.length}` : ""})
          </h2>
          <input
            type="text"
            placeholder="Buscar orden, nombre, telefono, notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm w-full sm:w-80"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip active={filterStatus === "all"} onClick={() => setFilterStatus("all")} label={`Todos (${counts.all})`} />
          {ALL_STATUSES.map((s) => (
            <FilterChip key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} label={`${STATUS_LABELS[s]} (${counts[s] || 0})`} />
          ))}
        </div>

        {ordersLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No hay pedidos con estos filtros.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const daysLabel = DAYS_OPTIONS.find((d) => d.id === order.plan.days)?.label || order.plan.days;
              const prefLabel = PREFERENCE_OPTIONS.find((p) => p.id === order.plan.preference)?.label || order.plan.preference;
              const mealNames = (order.plan.meals || []).map((id) => MEALS.find((m) => m.id === id)?.name || id).join(", ");
              const waMsg = `Hola ${order.customer.name}, te escribo de Ready pa' la semana sobre tu orden ${order.orderNumber}.`;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-mono text-sm font-semibold text-gray-800">{order.orderNumber}</div>
                      <div className="font-semibold text-lg">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email} · {order.customer.phone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Origen: {order.source || "—"} · {new Date(order.createdAt).toLocaleString("es-US")}
                      </div>
                    </div>
                    <span className={clsx("text-xs font-medium px-3 py-1 rounded-full", STATUS_COLORS[order.status])}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-gray-400">Direccion:</span> {order.customer.address}, {order.customer.city} {order.customer.zip}</div>
                    <div><span className="text-gray-400">Plan:</span> {daysLabel} · {prefLabel} · {order.plan.people} pers.</div>
                    <div className="sm:col-span-2"><span className="text-gray-400">Comidas:</span> {mealNames || "—"}</div>
                    <div><span className="text-gray-400">Total:</span> <strong>${order.pricing.total.toFixed(2)}</strong></div>
                    <div>
                      <span className="text-gray-400">Seguimiento:</span>{" "}
                      <a className="text-blue-600 underline" href={`/seguimiento?n=${order.orderNumber}`} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="mb-3">
                    <label className="text-xs text-gray-400">Notas internas</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={noteDrafts[order.id || ""] || ""}
                        onChange={(e) => setNoteDrafts((d) => ({ ...d, [order.id || ""]: e.target.value }))}
                        placeholder="Ej: cliente prefiere entrega martes..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black"
                      />
                      <button onClick={() => order.id && saveNotes(order.id)} className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                        Guardar
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => order.id && changeStatus(order.id, s)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        → {STATUS_LABELS[s]}
                      </button>
                    ))}
                    <a
                      href={buildWhatsAppUrl(waMsg)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50"
                    >
                      WhatsApp cliente
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.orderNumber);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Copiar # orden
                    </button>
                    <button
                      onClick={() => order.id && handleDelete(order.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal crear orden manual */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateManual} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">Nueva orden / lead manual</h3>
            <p className="text-sm text-gray-500">Genera numero de seguimiento para cerrar por WhatsApp o telefono.</p>
            <input required placeholder="Nombre *" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
            <input required placeholder="Telefono *" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
            <input placeholder="Email" value={manual.email} onChange={(e) => setManual({ ...manual, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
            <input placeholder="Direccion" value={manual.address} onChange={(e) => setManual({ ...manual, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Ciudad" value={manual.city} onChange={(e) => setManual({ ...manual, city: e.target.value })} className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
              <input placeholder="ZIP" value={manual.zip} onChange={(e) => setManual({ ...manual, zip: e.target.value })} className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" />
            </div>
            <select value={manual.days} onChange={(e) => setManual({ ...manual, days: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm">
              {DAYS_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            <textarea placeholder="Notas" value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-sm" rows={2} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200">Cancelar</button>
              <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50">
                {creating ? "Creando..." : "Crear + generar #"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={clsx("rounded-2xl p-4 border", accent ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100")}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-xs px-3 py-1.5 rounded-full border transition-colors",
        active ? "bg-black text-white border-black" : "border-gray-200 hover:bg-gray-50"
      )}
    >
      {label}
    </button>
  );
}
