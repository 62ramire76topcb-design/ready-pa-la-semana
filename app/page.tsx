"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import ProgressBar from "@/components/wizard/ProgressBar";
import OptionButton from "@/components/wizard/OptionButton";
import MealCard from "@/components/wizard/MealCard";
import {
  DAYS_OPTIONS,
  PREFERENCE_OPTIONS,
  PEOPLE_OPTIONS,
  PRICES,
  MEALS,
  generateOrderNumber,
} from "@/lib/meals";
import { PlanData, Step } from "@/lib/types";
import { createOrder } from "@/lib/orders";

const STORAGE_KEY = "ready-pa-la-semana-plan";
const TOTAL_STEPS = 7;

const initialData: PlanData = {
  days: null,
  preference: null,
  people: null,
  selectedMeals: [],
  zip: "",
  address: "",
  city: "",
  name: "",
  phone: "",
  email: "",
};

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<PlanData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData({ ...initialData, ...parsed.data });
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
  }, [data, step, loaded]);

  const filteredMeals = useMemo(() => {
    if (!data.preference) return MEALS;
    return MEALS.filter((m) => m.tags.includes(data.preference!));
  }, [data.preference]);

  const maxMeals = DAYS_OPTIONS.find((o) => o.id === data.days)?.meals || 6;

  const canContinue = () => {
    if (step === 1) return !!data.days;
    if (step === 2) return !!data.preference;
    if (step === 3) return !!data.people;
    if (step === 4) return data.selectedMeals.length >= 1;
    if (step === 5)
      return data.zip.length >= 5 && data.address.trim().length > 3 && data.city.trim().length > 1;
    if (step === 6)
      return data.name.trim().length > 1 && data.email.includes("@") && data.phone.length >= 7;
    return true;
  };

  const next = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as Step);
  };

  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialData);
    setStep(1);
    setError("");
  };

  const toggleMeal = (id: string) => {
    setData((d) => {
      const exists = d.selectedMeals.includes(id);
      if (exists) return { ...d, selectedMeals: d.selectedMeals.filter((m) => m !== id) };
      if (d.selectedMeals.length >= maxMeals) return d;
      return { ...d, selectedMeals: [...d.selectedMeals, id] };
    });
  };

  const selectedDays = DAYS_OPTIONS.find((o) => o.id === data.days);
  const selectedPref = PREFERENCE_OPTIONS.find((o) => o.id === data.preference);
  const selectedPeople = PEOPLE_OPTIONS.find((o) => o.id === data.people);
  const basePrice = data.days ? PRICES[data.days] : 0;
  const discountPrice = +(basePrice * 0.5).toFixed(2);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const orderNumber = generateOrderNumber();
      const orderId = await createOrder({
        orderNumber,
        createdAt: Date.now(),
        status: "pending",
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          zip: data.zip,
          address: data.address,
          city: data.city,
        },
        plan: {
          days: data.days || "",
          preference: data.preference || "",
          people: data.people || "",
          meals: data.selectedMeals,
        },
        pricing: {
          subtotal: basePrice,
          discount: basePrice - discountPrice,
          total: discountPrice,
        },
      });

      sessionStorage.setItem(
        "last_order",
        JSON.stringify({ orderId, orderNumber, data, total: discountPrice })
      );

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          planLabel: selectedDays?.label || "Plan",
          total: discountPrice,
          orderId,
          orderNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear sesion de pago");
      if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error("No se recibio URL de Stripe");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-semibold text-lg hidden sm:block text-brand-800">
              Ready pa&apos; la semana
            </span>
          </div>

          <div className="hidden md:block flex-1 px-4">
            <ProgressBar step={step} total={TOTAL_STEPS} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/seguimiento"
              className="text-sm font-medium px-3 py-2 rounded-lg border border-brand-600 text-brand-700 hover:bg-brand-50 transition-colors whitespace-nowrap"
            >
              Seguir pedido
            </a>
            <span className="text-sm text-gray-500 hidden sm:inline">
              {step}/{TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      <div className="bg-brand-100 text-brand-900 text-center py-2.5 text-sm font-medium">
        50% de descuento en tu primera caja + Desayuno gratis por 1 ano
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-start">
          <div className="order-2 md:order-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepWrapper key="s1">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Cuantos dias a la semana quieres comidas?
                  </h1>
                  <p className="text-gray-500 mb-8">Puedes cambiarlo cuando quieras.</p>
                  <div className="space-y-3">
                    {DAYS_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt.id}
                        selected={data.days === opt.id}
                        onClick={() =>
                          setData((d) => ({ ...d, days: opt.id, selectedMeals: [] }))
                        }
                        label={opt.label}
                        desc={opt.desc}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {step === 2 && (
                <StepWrapper key="s2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Que tipo de comidas prefieres?
                  </h1>
                  <p className="text-gray-500 mb-8">Elige la que mas se ajuste a tus metas.</p>
                  <div className="space-y-3">
                    {PREFERENCE_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt.id}
                        selected={data.preference === opt.id}
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            preference: opt.id,
                            selectedMeals: [],
                          }))
                        }
                        label={opt.label}
                        desc={opt.desc}
                        emoji={opt.emoji}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {step === 3 && (
                <StepWrapper key="s3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Para cuantas personas?
                  </h1>
                  <p className="text-gray-500 mb-8">Asi ajustamos las porciones.</p>
                  <div className="space-y-3">
                    {PEOPLE_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt.id}
                        selected={data.people === opt.id}
                        onClick={() => setData((d) => ({ ...d, people: opt.id }))}
                        label={opt.label}
                        desc={opt.desc}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {step === 4 && (
                <StepWrapper key="s4">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Elige tus comidas
                  </h1>
                  <p className="text-gray-500 mb-2">
                    Selecciona hasta {maxMeals} comidas ({data.selectedMeals.length}/{maxMeals})
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6 max-h-[420px] overflow-y-auto pr-1">
                    {filteredMeals.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        selected={data.selectedMeals.includes(meal.id)}
                        onToggle={() => toggleMeal(meal.id)}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {step === 5 && (
                <StepWrapper key="s5">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Donde te enviamos las comidas?
                  </h1>
                  <p className="text-gray-500 mb-8">Necesitamos tu direccion de entrega.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Codigo postal</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="30901"
                        value={data.zip}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Direccion</label>
                      <input
                        type="text"
                        placeholder="Calle, numero, apto..."
                        value={data.address}
                        onChange={(e) => setData((d) => ({ ...d, address: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        placeholder="Augusta"
                        value={data.city}
                        onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </StepWrapper>
              )}

              {step === 6 && (
                <StepWrapper key="s6">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Tus datos de contacto
                  </h1>
                  <p className="text-gray-500 mb-8">
                    Para confirmar el pedido y enviarte actualizaciones.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={data.name}
                        onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Correo electronico</label>
                      <input
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={data.email}
                        onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Telefono</label>
                      <input
                        type="tel"
                        placeholder="706-555-1234"
                        value={data.phone}
                        onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </StepWrapper>
              )}

              {step === 7 && (
                <StepWrapper key="s7">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Tu plan esta listo!
                  </h1>
                  <p className="text-gray-500 mb-6">Revisa y procede al pago seguro con Stripe.</p>

                  <div className="bg-brand-50 rounded-2xl p-5 space-y-3 mb-6 border border-brand-100">
                    <Row label="Frecuencia" value={selectedDays?.label} />
                    <Row label="Tipo" value={selectedPref?.label} />
                    <Row label="Personas" value={selectedPeople?.label} />
                    <Row label="Comidas" value={`${data.selectedMeals.length} seleccionadas`} />
                    <Row label="Direccion" value={`${data.address}, ${data.city} ${data.zip}`} />
                    <Row label="Contacto" value={data.name} />
                    <div className="border-t border-brand-200 pt-3 flex justify-between items-center">
                      <span className="text-gray-500">Primera caja</span>
                      <div className="text-right">
                        <span className="line-through text-gray-400 text-sm mr-2">
                          ${basePrice.toFixed(2)}
                        </span>
                        <span className="text-2xl font-bold text-brand-700">
                          ${discountPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className={clsx(
                      "w-full py-4 rounded-xl font-medium text-lg transition-colors",
                      loading
                        ? "bg-gray-300 text-gray-500 cursor-wait"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    )}
                  >
                    {loading ? "Procesando..." : "Pagar con Stripe"}
                  </button>
                  <p className="text-center text-sm text-gray-400 mt-3">
                    Pago seguro. Puedes pausar o cancelar cuando quieras
                  </p>
                  <button
                    onClick={reset}
                    className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600"
                  >
                    Empezar de nuevo
                  </button>
                </StepWrapper>
              )}
            </AnimatePresence>

            {step < 7 && (
              <div className="flex gap-3 mt-10">
                {step > 1 && (
                  <button
                    onClick={back}
                    className="px-6 py-3.5 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50"
                  >
                    Atras
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={!canContinue()}
                  className={clsx(
                    "flex-1 py-3.5 rounded-xl font-medium transition-colors",
                    canContinue()
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          <div className="order-1 md:order-2 hidden md:block sticky top-28">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-brand-50 via-teal-50 to-orange-50 shadow-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-7xl mb-6">🍽️</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Comidas listas en 2 minutos
                </h3>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  Preparadas por chefs · Aprobadas por nutricionistas · Frescas
                </p>
                {selectedDays && (
                  <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm">
                    <div className="text-sm text-gray-500">Tu seleccion</div>
                    <div className="font-semibold text-brand-800">{selectedDays.label}</div>
                    {selectedPref && (
                      <div className="text-sm text-brand-600 mt-0.5">{selectedPref.label}</div>
                    )}
                    {data.selectedMeals.length > 0 && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {data.selectedMeals.length} comidas
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="absolute top-10 left-8 w-24 h-24 rounded-full bg-brand-200/50" />
              <div className="absolute bottom-16 right-8 w-32 h-32 rounded-full bg-orange-200/40" />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        2026 Ready pa&apos; la semana ·{" "}
        <a href="/seguimiento" className="hover:text-brand-600 underline">
          Seguir mi pedido
        </a>
      </footer>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );
}
