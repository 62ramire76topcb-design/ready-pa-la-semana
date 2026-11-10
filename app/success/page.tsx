"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MEALS, DAYS_OPTIONS, PREFERENCE_OPTIONS } from "@/lib/meals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface LastOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  source?: string;
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
  const isLead = params.get("lead") === "1";
  const nParam = params.get("n");
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const orderNumber = order?.orderNumber || nParam || "";

  const handleDownloadPdf = () => {
    const w = window.open("", "_blank");
    if (!w || !order) return;
    const daysLabel = DAYS_OPTIONS.find((d) => d.id === order.data.days)?.label || order.data.days;
    const prefLabel = PREFERENCE_OPTIONS.find((p) => p.id === order.data.preference)?.label || order.data.preference;
    const mealNames = order.data.selectedMeals.map((id) => MEALS.find((m) => m.id === id)?.name || id).join(", ");
    w.document.write(`<!DOCTYPE html><html><head><title>Orden ${order.orderNumber}</title>
      <style>body{font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto}
      h1{color:#0d9488}.box{border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:24px 0}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
      .total{font-size:22px;font-weight:bold}</style></head><body>
      <h1>Ready pa' la semana</h1><p>Comprobante de pedido</p>
      <div class="box">
      <div class="row"><span>Numero</span><strong>${order.orderNumber}</strong></div>
      <div class="row"><span>Cliente</span><span>${order.data.name}</span></div>
      <div class="row"><span>Email</span><span>${order.data.email}</span></div>
      <div class="row"><span>Telefono</span><span>${order.data.phone}</span></div>
      <div class="row"><span>Direccion</span><span>${order.data.address}, ${order.data.city} ${order.data.zip}</span></div>
      <div class="row"><span>Plan</span><span>${daysLabel} · ${prefLabel}</span></div>
      <div class="row"><span>Comidas</span><span>${mealNames}</span></div>
      <div class="row"><span>Total</span><span class="total">$${Number(order.total).toFixed(2)}</span></div>
      </div>
      <p>Seguimiento: https://ready-pa-la-semana.vercel.app/seguimiento?n=${order.orderNumber}</p>
      <button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{isLead ? "💬" : "✅"}</div>
        <h1 className="text-2xl font-bold mb-2">
          {isLead ? "Solicitud enviada" : "Pago exitoso!"}
        </h1>
        <p className="text-gray-500 mb-4">
          {isLead
            ? "Creamos tu numero de seguimiento. Continua la conversacion por WhatsApp para cerrar tu pedido."
            : "Tu pedido ha sido recibido. Te enviaremos un correo con los detalles."}
        </p>

        {orderNumber && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Numero de seguimiento</span>
              <strong>{orderNumber}</strong>
            </div>
            {order && (
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <strong>${Number(order.total).toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {order && !isLead && (
            <button onClick={handleDownloadPdf} className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800">
              Descargar orden (PDF)
            </button>
          )}
          {orderNumber && (
            <a href={`/seguimiento?n=${orderNumber}`} className="w-full border-2 border-black py-3 rounded-xl font-medium hover:bg-gray-50">
              Seguir mi pedido
            </a>
          )}
          <a
            href={buildWhatsAppUrl(
              orderNumber
                ? `Hola, mi numero de seguimiento es ${orderNumber}. Quiero mas informacion.`
                : "Hola, quiero informacion sobre Ready pa' la semana."
            )}
            target="_blank"
            rel="noreferrer"
            className="w-full border-2 border-green-600 text-green-700 py-3 rounded-xl font-medium hover:bg-green-50"
          >
            Escribir por WhatsApp
          </a>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 mt-2">Volver al inicio</a>
        </div>
        {sessionId && <p className="text-xs text-gray-300 mt-4">Stripe: {sessionId.slice(0, 20)}...</p>}
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
