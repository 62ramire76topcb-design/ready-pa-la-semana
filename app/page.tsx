"use client";

import { useEffect, useMemo, useState } from "react";
import { getAvailableMeals, generateOrderNumber } from "@/lib/meals";
import { createOrder } from "@/lib/orders";
import { CartItem, DELIVERY_FEE, DELIVERY_ZONE, Meal } from "@/lib/types";
import clsx from "clsx";

type Step = "menu" | "cart" | "delivery" | "checkout";

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pedido especial
  const [specialMode, setSpecialMode] = useState(false);
  const [specialRequest, setSpecialRequest] = useState("");
  const [specialPrice, setSpecialPrice] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Charlotte",
    zip: "",
    notes: "",
    deliveryDate: "",
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    setLoadingMeals(true);
    try {
      const data = await getAvailableMeals();
      setMeals(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingMeals(false);
  };

  const addToCart = (meal: Meal) => {
    if (!meal.id || meal.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.mealId === meal.id);
      if (existing) {
        if (existing.qty >= meal.stock) return prev;
        return prev.map((i) =>
          i.mealId === meal.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          mealId: meal.id!,
          name: meal.name,
          price: meal.price,
          qty: 1,
          imageUrl: meal.imageUrl,
        },
      ];
    });
  };

  const updateQty = (mealId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.mealId === mealId ? { ...i, qty } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );
  const total = subtotal + (cart.length > 0 || specialMode ? DELIVERY_FEE : 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const canCheckout = () => {
    if (specialMode) {
      return specialRequest.trim().length > 5;
    }
    return cart.length > 0;
  };

  const canSubmitDelivery = () => {
    return (
      form.name.trim().length > 1 &&
      form.email.includes("@") &&
      form.phone.length >= 7 &&
      form.address.trim().length > 3 &&
      form.zip.length >= 5 &&
      form.deliveryDate
    );
  };

  const handleCheckout = async () => {
    if (!canSubmitDelivery()) return;
    setLoading(true);
    setError("");

    try {
      const orderNumber = generateOrderNumber();
      const isSpecial = specialMode;

      const items: CartItem[] = isSpecial
        ? [
            {
              mealId: "special",
              name: "Pedido especial",
              price: Number(specialPrice) || 0,
              qty: 1,
            },
          ]
        : cart;

      const orderSubtotal = isSpecial
        ? Number(specialPrice) || 0
        : subtotal;
      const orderTotal = orderSubtotal + DELIVERY_FEE;

      const orderId = await createOrder({
        orderNumber,
        createdAt: Date.now(),
        status: "pending",
        type: isSpecial ? "special" : "menu",
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city || "Charlotte",
          zip: form.zip,
          notes: form.notes,
        },
        items,
        specialRequest: isSpecial ? specialRequest : undefined,
        deliveryDate: form.deliveryDate,
        pricing: {
          subtotal: orderSubtotal,
          deliveryFee: DELIVERY_FEE,
          total: orderTotal,
        },
      });

      sessionStorage.setItem(
        "last_order",
        JSON.stringify({
          orderId,
          orderNumber,
          total: orderTotal,
          items,
          specialRequest: isSpecial ? specialRequest : undefined,
          customer: form,
        })
      );

      // Si es especial sin precio fijo, no va a Stripe; queda pending para cotizar
      if (isSpecial && (!specialPrice || Number(specialPrice) <= 0)) {
        window.location.href = `/success?order_id=${orderId}&special=1`;
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          planLabel: isSpecial
            ? "Pedido especial"
            : `Meal prep (${cartCount} platos)`,
          total: orderTotal,
          orderId,
          orderNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear pago");
      if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error("No se recibio URL de Stripe");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#faf8f5]/90 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
              R
            </div>
            <span className="font-semibold tracking-tight">Ready pa&apos; la semana</span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#menu" className="hover:text-brand-700 hidden sm:inline">
              Menu de hoy
            </a>
            <a href="#como" className="hover:text-brand-700 hidden sm:inline">
              Como funciona
            </a>
            <a href="/seguimiento" className="hover:text-brand-700">
              Seguir pedido
            </a>
            <button
              onClick={() => setStep("cart")}
              className="relative px-3 py-1.5 rounded-full bg-brand-600 text-white text-sm font-medium"
            >
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      {step === "menu" && (
        <>
          <section className="relative min-h-[70vh] flex items-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=80')",
              }}
            />
            <div className="relative max-w-6xl mx-auto px-4 py-20 text-white">
              <p className="uppercase tracking-[0.2em] text-sm text-white/80 mb-3">
                Meal prep semanal · Charlotte NC
              </p>
              <h1 className="text-4xl md:text-6xl font-serif font-medium leading-tight max-w-2xl mb-4">
                Comidas hechas en casa, listas para tu semana.
              </h1>
              <p className="text-lg text-white/85 max-w-xl mb-8">
                Cocina boricua casera, porciones listas y menu del dia. Sin planes fijos ni
                suscripciones: eliges lo que hay disponible y lo recibes en Charlotte.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#menu"
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition"
                >
                  Ver menu de hoy
                </a>
                <button
                  onClick={() => {
                    setSpecialMode(true);
                    setStep("delivery");
                  }}
                  className="px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/40 rounded-lg font-medium transition"
                >
                  Pedido especial
                </button>
              </div>
            </div>
          </section>

          {/* Como funciona */}
          <section id="como" className="max-w-6xl mx-auto px-4 py-16">
            <p className="text-center text-sm uppercase tracking-widest text-brand-700 mb-2">
              El proceso
            </p>
            <h2 className="text-center text-3xl md:text-4xl font-serif mb-12">
              Como funciona
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  n: "01",
                  t: "Elige del menu",
                  d: "Mira lo que hay disponible hoy. Stock limitado: se actualiza segun lo que se cocine.",
                },
                {
                  n: "02",
                  t: "Programa entrega",
                  d: "Solo Charlotte, NC. Indica direccion y fecha. Tambien puedes pedir un plato especial.",
                },
                {
                  n: "03",
                  t: "Recibe y disfruta",
                  d: "Comida casera lista para calentar. Seguimiento de tu pedido con numero de orden.",
                },
              ].map((s) => (
                <div key={s.n} className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                  <div className="text-brand-600 font-mono text-sm mb-3">{s.n}</div>
                  <h3 className="text-xl font-semibold mb-2">{s.t}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Menu */}
          <section id="menu" className="bg-white border-y border-black/5 py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm uppercase tracking-widest text-brand-700 mb-1">
                    Disponible ahora
                  </p>
                  <h2 className="text-3xl md:text-4xl font-serif">Menu de hoy</h2>
                </div>
                <button
                  onClick={() => {
                    setSpecialMode(true);
                    setStep("delivery");
                  }}
                  className="text-sm font-medium text-brand-700 underline underline-offset-4"
                >
                  Quieres algo especial? Pidelo aqui
                </button>
              </div>

              {loadingMeals ? (
                <div className="text-center py-16 text-gray-400">Cargando menu...</div>
              ) : meals.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-lg mb-2">No hay platos publicados ahora.</p>
                  <p className="text-sm">Vuelve pronto o solicita un pedido especial.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meals.map((meal) => (
                    <article
                      key={meal.id}
                      className="group rounded-2xl overflow-hidden border border-black/5 bg-[#faf8f5] shadow-sm hover:shadow-md transition"
                    >
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {meal.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-50">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-lg leading-snug">{meal.name}</h3>
                          <span className="font-bold text-brand-700 whitespace-nowrap">
                            ${meal.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {meal.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {meal.stock <= 3
                              ? `Solo ${meal.stock} disponibles`
                              : `${meal.stock} disponibles`}
                          </span>
                          <button
                            onClick={() => addToCart(meal)}
                            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="py-10 text-center text-sm text-gray-500">
            <p>Entrega solo en {DELIVERY_ZONE}</p>
            <p className="mt-1">
              2026 Ready pa&apos; la semana ·{" "}
              <a href="/seguimiento" className="underline hover:text-brand-700">
                Seguir mi pedido
              </a>
            </p>
          </footer>
        </>
      )}

      {/* Cart / Delivery / Checkout panel */}
      {(step === "cart" || step === "delivery" || step === "checkout") && (
        <main className="max-w-lg mx-auto px-4 py-10">
          <button
            onClick={() => {
              setStep("menu");
              setSpecialMode(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            ← Volver al menu
          </button>

          {step === "cart" && (
            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
              <h1 className="text-2xl font-serif mb-6">Tu carrito</h1>
              {cart.length === 0 ? (
                <p className="text-gray-500 mb-6">Aun no has agregado platos.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.mealId} className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} c/u
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.mealId, item.qty - 1)}
                          className="w-8 h-8 rounded-full border border-gray-200"
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.mealId, item.qty + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-medium w-16 text-right">
                        ${(item.price * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Entrega ({DELIVERY_ZONE})</span>
                    <span>${DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-brand-700">${total.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <button
                disabled={!canCheckout()}
                onClick={() => {
                  setSpecialMode(false);
                  setStep("delivery");
                }}
                className={clsx(
                  "w-full py-3.5 rounded-xl font-medium",
                  canCheckout()
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                Continuar
              </button>
            </div>
          )}

          {step === "delivery" && (
            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm space-y-4">
              <h1 className="text-2xl font-serif mb-2">
                {specialMode ? "Pedido especial" : "Datos de entrega"}
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                Entrega solo en <strong>{DELIVERY_ZONE}</strong>
              </p>

              {specialMode && (
                <div className="space-y-3 p-4 bg-brand-50 rounded-xl border border-brand-100">
                  <label className="block text-sm font-medium">
                    Describe tu plato especial
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej: pollo guisado con arroz y habichuelas, sin cebolla..."
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none text-sm"
                  />
                  <label className="block text-sm font-medium">
                    Precio acordado (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Deja vacio si aun no hay precio"
                    value={specialPrice}
                    onChange={(e) => setSpecialPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Si no pones precio, el pedido queda pendiente para confirmar contigo.
                  </p>
                </div>
              )}

              {(
                [
                  ["name", "Nombre completo", "text"],
                  ["email", "Email", "email"],
                  ["phone", "Telefono", "tel"],
                  ["address", "Direccion en Charlotte", "text"],
                  ["zip", "Codigo postal", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [key]:
                          key === "zip"
                            ? e.target.value.replace(/\D/g, "").slice(0, 5)
                            : e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1">Fecha de entrega</label>
                <input
                  type="date"
                  value={form.deliveryDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Apto, porton, instrucciones..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-600 focus:outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>
              )}

              <button
                disabled={!canSubmitDelivery() || loading}
                onClick={handleCheckout}
                className={clsx(
                  "w-full py-3.5 rounded-xl font-medium",
                  canSubmitDelivery() && !loading
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {loading
                  ? "Procesando..."
                  : specialMode && !specialPrice
                    ? "Enviar pedido especial"
                    : "Pagar con Stripe"}
              </button>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
