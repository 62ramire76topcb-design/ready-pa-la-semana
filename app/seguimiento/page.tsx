"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderByNumber } from "@/lib/orders";
import { Order, OrderStatus } from "@/lib/types";
import { DAYS_OPTIONS } from "@/lib/meals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import clsx from "clsx";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "lead", label: "Solicitud recibida" },
  { status: "pending", label: "Pedido registrado" },
  { status: "paid", label: "Pago confirmado" },
  { status: "preparing", label: "Preparando" },
  { status: "shipped", label: "En camino" },
  { status: "delivered", label: "Entregado" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  lead: 0,
  pending: 1,
  paid: 2,
  preparing: 3,
  shipped: 4,
  delivered: 5,
  cancelled: -1,
};

function TrackingContent() {
  const params = useSearchParams();
  const initial = params.get("n") || "";
  const [query, setQuery] = useState(initial);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (n?: string) => {
    const num = (n || query).trim().toUpperCase();
    if (!num) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const result = await getOrderByNumber(num);
      if (!result) setError("No encontramos un pedido con ese numero.");
      else setOrder(result);
    } catch {
      setError("Error al buscar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initial) search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const currentIdx = order ? STATUS_INDEX[order.status] ?? -1 : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center font-bold">R</a>
          <h1 className="font-bold text-lg">Seguir mi pedido</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium mb-2">Numero de orden</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="RPS-20261109-XXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none uppercase"
            />
            <button onClick={() => search()} disabled={loading} className="px-5 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
              {loading ? "..." : "Buscar"}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div>
              <div className="text-sm text-gray-500">Orden</div>
              <div className="text-xl font-bold">{order.orderNumber}</div>
              <div className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString("es-US")}</div>
              {order.status === "lead" && (
                <div className="mt-2 text-sm bg-emerald-50 text-emerald-800 rounded-lg px-3 py-2">
                  Estamos coordinando tu pedido por WhatsApp.
                </div>
              )}
            </div>

            {order.status === "cancelled" ? (
              <div className="bg-red-50 text-red-700 rounded-xl p-4 text-center font-medium">Este pedido fue cancelado</div>
            ) : (
              <div className="space-y-0">
                {STEPS.map((s, i) => {
                  const done = currentIdx >= i;
                  const active = currentIdx === i;
                  return (
                    <div key={s.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0", done ? "bg-black text-white" : "bg-gray-100 text-gray-400")}>
                          {done ? "✓" : i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={clsx("w-0.5 h-8", currentIdx > i ? "bg-black" : "bg-gray-200")} />
                        )}
                      </div>
                      <div className={clsx("pt-1 pb-4", active && "font-semibold")}>
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{order.customer.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Direccion</span><span className="font-medium text-right max-w-[60%]">{order.customer.address}, {order.customer.city} {order.customer.zip}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium">{DAYS_OPTIONS.find((d) => d.id === order.plan.days)?.label || order.plan.days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">${order.pricing.total.toFixed(2)}</span></div>
            </div>

            <a
              href={buildWhatsAppUrl(`Hola, mi numero de seguimiento es ${order.orderNumber}.`)}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center py-3 rounded-xl border-2 border-green-600 text-green-700 font-medium hover:bg-green-50"
            >
              Contactar por WhatsApp
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
