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
  AVOID_OPTIONS,
  GOAL_OPTIONS,
  PRICES,
  MEALS,
  generateOrderNumber,
} from "@/lib/meals";
import { PlanData, Step } from "@/lib/types";
import { createOrder } from "@/lib/orders";

const STORAGE_KEY = "ready-pa-la-semana-plan-v2";
const TOTAL_STEPS = 9;

const initialData: PlanData = {
  days: null,
  preference: null,
  avoid: [],
  goals: [],
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
    let list = MEALS;
    if (data.preference) {
      list = list.filter((m) => m.tags.includes(data.preference!));
    }
    // Filtrar por ingredientes a evitar (simple)
    if (data.avoid.includes("fish")) {
      list = list.filter((m) => !m.id.includes("salmon") && !m.id.includes("cod") && !m.id.includes("shrimp"));
    }
    if (data.avoid.includes("shellfish")) {
      list = list.filter((m) => !m.id.includes("shrimp"));
    }
    if (data.avoid.includes("pork")) {
      list = list.filter((m) => !m.id.includes("pork"));
    }
    if (data.avoid.includes("mushrooms")) {
      list = list.filter((m) => !m.id.includes("mushroom"));
    }
    return list;
  }, [data.preference, data.avoid]);

  const maxMeals = DAYS_OPTIONS.find((o) => o.id === data.days)?.meals || 6;

  const canContinue = () => {
    if (step === 1) return !!data.days;
    if (step === 2) return !!data.preference;
    if (step === 3) return true; // avoid opcional
    if (step === 4) return data.goals.length >= 1;
    if (step === 5) return !!data.people;
    if (step === 6) return data.selectedMeals.length >= 1;
    if (step === 7)
      return data.zip.length >= 5 && data.address.trim().length > 3 && data.city.trim().length > 1;
    if (step === 8)
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

  const toggleAvoid = (id: string) => {
    setData((d) => ({
      ...d,
      avoid: d.avoid.includes(id) ? d.avoid.filter((x) => x !== id) : [...d.avoid, id],
    }));
  };

  const toggleGoal = (id: string) => {
    setData((d) => ({
      ...d,
      goals: d.goals.includes(id) ? d.goals.filter((x) => x !== id) : [...d.goals, id],
    }));
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
          avoid: data.avoid,
          goals: data.goals,
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
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-black text-white rounded-md flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-semibold text-base hidden sm:block">Ready pa&apos; la semana</span>
          </div>
          <div className="hidden sm:block flex-1 px-6">
            <ProgressBar step={step} total={TOTAL_STEPS} />
          </div>
          <a
            href="/seguimiento"
            className="text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 whitespace-nowrap"
          >
            Seguir pedido
          </a>
        </div>
      </header>

      <div className="bg-emerald-50 text-emerald-900 text-center py-2.5 text-sm font-medium">
        50% de descuento en tu primera caja + Desayuno gratis por 1 ano
      </div>

      <main className="flex-1 px-4 py-10 md:py-14 pb-32">
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepWrapper key="s1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Cuantos dias a la semana quieres comidas?
                </h1>
                <p className="text-gray-500 mb-8">Puedes cambiarlo cuando quieras.</p>
                <div className="grid sm:grid-cols-2 gap-3">
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
                <Tip text="Construyamos un plan alrededor de lo que mas te importa." />
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper key="s2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Que tipo de comidas prefieres?
                </h1>
                <p className="text-gray-500 mb-8">
                  Priorizaremos comidas que encajen. Puedes cambiarlo despues.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
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
                  Algún ingrediente a evitar?
                </h1>
                <p className="text-gray-500 mb-8">Opcional. Salta lo que no te guste.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVOID_OPTIONS.map((opt) => {
                    const selected = data.avoid.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAvoid(opt.id)}
                        className={clsx(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                          selected
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        )}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className="text-sm font-medium text-center">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Tip text="Omite lo que no te gusta. Quédate con lo que amas." />
              </StepWrapper>
            )}

            {step === 4 && (
              <StepWrapper key="s4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Cuales son tus metas?
                </h1>
                <p className="text-gray-500 mb-8">Puedes elegir mas de una.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map((opt) => {
                    const selected = data.goals.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleGoal(opt.id)}
                        className={clsx(
                          "text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all",
                          selected
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <Tip text="Armemos el plan alrededor de lo que mas te importa." />
              </StepWrapper>
            )}

            {step === 5 && (
              <StepWrapper key="s5">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Para cuantas personas?
                </h1>
                <p className="text-gray-500 mb-8">Asi ajustamos las porciones.</p>
                <div className="grid sm:grid-cols-3 gap-3">
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

            {step === 6 && (
              <StepWrapper key="s6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Elige tus comidas
                </h1>
                <p className="text-gray-500 mb-2">
                  Hasta {maxMeals} comidas ({data.selectedMeals.length}/{maxMeals})
                </p>
                <div className="grid grid-cols-2 gap-3 mt-6 max-h-[480px] overflow-y-auto pr-1">
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

            {step === 7 && (
              <StepWrapper key="s7">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Donde te enviamos las comidas?
                </h1>
                <p className="text-gray-500 mb-8">Necesitamos tu direccion de entrega.</p>
                <div className="space-y-4">
                  <Field
                    label="Codigo postal"
                    value={data.zip}
                    onChange={(v) =>
                      setData((d) => ({ ...d, zip: v.replace(/\D/g, "").slice(0, 5) }))
                    }
                    placeholder="30901"
                    maxLength={5}
                  />
                  <Field
                    label="Direccion"
                    value={data.address}
                    onChange={(v) => setData((d) => ({ ...d, address: v }))}
                    placeholder="Calle, numero, apto..."
                  />
                  <Field
                    label="Ciudad"
                    value={data.city}
                    onChange={(v) => setData((d) => ({ ...d, city: v }))}
                    placeholder="Augusta"
                  />
                </div>
              </StepWrapper>
            )}

            {step === 8 && (
              <StepWrapper key="s8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Tus datos de contacto
                </h1>
                <p className="text-gray-500 mb-8">
                  Para confirmar el pedido y enviarte actualizaciones.
                </p>
                <div className="space-y-4">
                  <Field
                    label="Nombre completo"
                    value={data.name}
                    onChange={(v) => setData((d) => ({ ...d, name: v }))}
                    placeholder="Tu nombre"
                  />
                  <Field
                    label="Correo electronico"
                    value={data.email}
                    onChange={(v) => setData((d) => ({ ...d, email: v }))}
                    placeholder="tucorreo@ejemplo.com"
                    type="email"
                  />
                  <Field
                    label="Telefono"
                    value={data.phone}
                    onChange={(v) => setData((d) => ({ ...d, phone: v }))}
                    placeholder="706-555-1234"
                    type="tel"
                  />
                </div>
              </StepWrapper>
            )}

            {step === 9 && (
              <StepWrapper key="s9">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Tu plan esta listo!
                </h1>
                <p className="text-gray-500 mb-6">Revisa y procede al pago seguro.</p>

                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-6 border border-gray-100">
                  <Row label="Frecuencia" value={selectedDays?.label} />
                  <Row label="Tipo" value={selectedPref?.label} />
                  <Row
                    label="Metas"
                    value={
                      data.goals
                        .map((g) => GOAL_OPTIONS.find((o) => o.id === g)?.label)
                        .filter(Boolean)
                        .join(", ") || "—"
                    }
                  />
                  <Row
                    label="Evitar"
                    value={
                      data.avoid
                        .map((a) => AVOID_OPTIONS.find((o) => o.id === a)?.label)
                        .filter(Boolean)
                        .join(", ") || "Ninguno"
                    }
                  />
                  <Row label="Personas" value={selectedPeople?.label} />
                  <Row label="Comidas" value={`${data.selectedMeals.length} seleccionadas`} />
                  <Row label="Direccion" value={`${data.address}, ${data.city} ${data.zip}`} />
                  <Row label="Contacto" value={data.name} />
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-gray-500">Primera caja</span>
                    <div className="text-right">
                      <span className="line-through text-gray-400 text-sm mr-2">
                        ${basePrice.toFixed(2)}
                      </span>
                      <span className="text-2xl font-bold">${discountPrice.toFixed(2)}</span>
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
                      : "bg-black text-white hover:bg-gray-800"
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
        </div>
      </main>

      {/* Barra fija inferior tipo Factor */}
      {step < 9 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30">
          <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
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
                "flex-1 py-3.5 rounded-xl font-medium text-lg transition-colors",
                canContinue()
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 pb-24">
        2026 Ready pa&apos; la semana
      </footer>
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="mt-10 bg-stone-100 rounded-2xl px-5 py-4 text-sm text-gray-600 flex items-center gap-3">
      <span className="text-xl">🍽️</span>
      <span>{text}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
