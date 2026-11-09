"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MEALS, DAYS_OPTIONS, PREFERENCE_OPTIONS } from "@/lib/meals";

interface LastOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    days: string;
    preference: string;
    people: string;
    selectedMeals: string[];
  };
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");
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

    const daysLabel =
      DAYS_OPTIONS.find((d) => d.id === order.data.days)?.label || order.data.days;
    const prefLabel =
      PREFERENCE_OPTIONS.find((p) => p.id === order.data.preference)?.label ||
      order.data.preference;
    const mealNames = order.data.selectedMeals
      .map((id) => MEALS.find((m) => m.id === id)?.name || id)
      .join(", ");

    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>Orden ${order.orderNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
        h1 { color: #0d9488; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 14px; }
        .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .row:last-child { border-bottom: none; }
        .total { font-size: 22px; font-weight: bold; color: #0f766e; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
      </style></head><body>
      <h1>Ready pa' la semana</h1>
      <p class="muted">Comprobante de pedido</p>
      <div class="box">
        <div class="row"><span>Numero de orden</span><strong>${order.orderNumber}</strong></div>
        <div class="row"><span>Cliente</span><span>${order.data.name}</span></div>
        <div class="row"><span>Email</span><span>${order.data.email}</span></div>
        <div class="row"><span>Telefono</span><span>${order.data.phone}</span></div>
        <div class="row"><span>Direccion</span><span>${order.data.address}, ${order.data.city} ${order.data.zip}</span></div>
        <div class="row"><span>Plan</span><span>${daysLabel}</span></div>
        <div class="row"><span>Preferencia</span><span>${prefLabel}</span></div>
        <div class="row"><span>Personas</span><span>${order.data.people}</span></div>
        <div class="row"><span>Comidas</span><span style="max-width:60%;text-align:right">${mealNames}</span></div>
        <div class="row"><span>Total pagado</span><span class="total">$${Number(order.total).toFixed(2)}</span></div>
      </div>
      <p class="muted">Fecha: ${new Date().toLocaleString("es-US")}</p>
      ${sessionId ? `<p class="muted">Stripe: ${sessionId}</p>` : ""}
      <p class="muted">Sigue tu pedido en: https://ready-pa-la-semana.vercel.app/seguimiento?n=${order.orderNumber}</p>
      <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:12px 24px;background:#0d9488;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Imprimir / Guardar PDF</button>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-brand-800 mb-2">Pago exitoso!</h1>
        <p className="text-gray-500 mb-4">
          Tu pedido ha sido recibido. Te enviaremos un correo con los detalles.
        </p>

        {order && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6 text-left text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Numero de orden</span>
              <strong className="text-brand-800">{order.orderNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <strong>${Number(order.total).toFixed(2)}</strong>
            </div>
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
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 mt-2"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
