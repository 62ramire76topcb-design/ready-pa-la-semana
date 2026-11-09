"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">\u2705</div>
        <h1 className="text-2xl font-bold text-brand-800 mb-2">\u00a1Pago exitoso!</h1>
        <p className="text-gray-500 mb-6">
          Tu pedido ha sido recibido. Te enviaremos un correo con los detalles.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-2">Pedido: {orderId}</p>
        )}
        {sessionId && (
          <p className="text-xs text-gray-400 mb-6 truncate">Sesi\u00f3n: {sessionId}</p>
        )}
        <a
          href="/"
          className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700"
        >
          Volver al inicio
        </a>
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