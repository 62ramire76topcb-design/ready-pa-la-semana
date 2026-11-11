"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface LastOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  items?: { name: string; qty: number; price: number }[];
  specialRequest?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    deliveryDate?: string;
  };
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");
  const isSpecial = params.get("special") === "1";
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const handleDownloadPdf = () => {
    const w = window.open("", "_blank");
    if (!w || !order) return;
    const itemsHtml =
      order.items
        ?.map(
          (i) =>
            `<div class="row"><span>${i.qty}x ${i.name}</span><span>$${(i.price * i.qty).toFixed(2)}</span></div>`
        )
        .join("") || "";

    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>Orden ${order.orderNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
        h1 { color: #0d9488; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 14px; }
        .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .total { font-size: 22px; font-weight: bold; color: #0f766e; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <h1>Ready pa' la semana</h1>
      <p class="muted">Meal prep · Charlotte NC</p>
      <div class="box">
        <div class="row"><span>Numero de orden</span><strong>${order.orderNumber}</strong></div>
        ${order.customer ? `<div class="row"><span>Cliente</span><span>${order.customer.name}</span></div>` : ""}
        ${order.customer ? `<div class="row"><span>Direccion</span><span>${order.customer.address}, ${order.customer.city} ${order.customer.zip}</span></div>` : ""}
        ${order.customer?.deliveryDate ? `<div class="row"><span>Entrega</span><span>${order.customer.deliveryDate}</span></div>` : ""}
        ${order.specialRequest ? `<div class="row"><span>Especial</span><span>${order.specialRequest}</span></div>` : ""}
        ${itemsHtml}
        <div class="row"><span>Total</span><span class="total">$${Number(order.total).toFixed(2)}</span></div>
      </div>
      <p class="muted">${new Date().toLocaleString("es-US")}</p>
      <p class="muted">Seguimiento: https://ready-pa-la-semana.vercel.app/seguimiento?n=${order.orderNumber}</p>
      <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:12px 24px;background:#0d9488;color:white;border:none;border-radius:8px;cursor:pointer">Imprimir / Guardar PDF</button>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{isSpecial ? "📝" : "✅"}</div>
        <h1 className="text-2xl font-bold text-brand-800 mb-2">
          {isSpecial ? "Pedido especial recibido" : "Pago exitoso!"}
        </h1>
        <p className="text-gray-500 mb-4">
          {isSpecial
            ? "Te contactaremos para confirmar detalles y precio."
            : "Tu meal prep esta en camino. Guarda tu numero de orden."}
        </p>

        {order && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6 text-left text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Numero de orden</span>
              <strong className="text-brand-800">{order.orderNumber}</strong>
            </div>
            {!isSpecial && (
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <strong>${Number(order.total).toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {orderId && !order && (
          <p className="text-xs text-gray-400 mb-4">Pedido ID: {orderId}</p>
        )}

        <div className="flex flex-col gap-3">
          {order && (
            <button
              onClick={handleDownloadPdf}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700"
            >
              Descargar orden (PDF)
            </button>
          )}
          {order && (
            <a
              href={`/seguimiento?n=${order.orderNumber}`}
              className="w-full border-2 border-brand-600 text-brand-700 py-3 rounded-xl font-medium hover:bg-brand-50"
            >
              Seguir mi pedido
            </a>
          )}
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 mt-2">
            Volver al inicio
          </a>
        </div>
        {sessionId && (
          <p className="text-[10px] text-gray-300 mt-4 break-all">Stripe: {sessionId}</p>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Cargando...</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
