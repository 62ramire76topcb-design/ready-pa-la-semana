"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Step = 1 | 2 | 3 | 4;

interface PlanData {
  days: string | null;
  preference: string | null;
  zip: string;
}

const DAYS_OPTIONS = [
  { id: "1-2", label: "1-2 días a la semana", desc: "Ideal para probar" },
  { id: "3", label: "3 días a la semana", desc: "El más popular" },
  { id: "weekdays", label: "Días de semana", desc: "Lunes a viernes" },
  { id: "everyday", label: "Todos los días", desc: "Máximo comodidad" },
];

const PREFERENCE_OPTIONS = [
  { id: "protein", label: "Alto en Proteína", desc: "30g+ de proteína por comida" },
  { id: "calorie", label: "Calorie Smart", desc: "Menos de 550 calorías" },
  { id: "keto", label: "Keto / Bajo en carbos", desc: "15g netos de carbos o menos" },
  { id: "balanced", label: "Equilibrado", desc: "Variedad y nutrición completa" },
  { id: "veggie", label: "Vegetariano / Vegano", desc: "Opciones plant-based" },
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<PlanData>({
    days: null,
    preference: null,
    zip: "",
  });

  const canContinue = () => {
    if (step === 1) return !!data.days;
    if (step === 2) return !!data.preference;
    if (step === 3) return data.zip.trim().length >= 5;
    return true;
  };

  const next = () => {
    if (!canContinue()) return;
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-semibold text-lg hidden sm:block">Ready pa&apos; la semana</span>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs mx-8 hidden sm:block">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span className={step >= 1 ? "text-black font-medium" : ""}>Tu plan</span>
              <span className={step >= 2 ? "text-black font-medium" : ""}>Preferencias</span>
              <span className={step >= 3 ? "text-black font-medium" : ""}>Ubicación</span>
              <span className={step >= 4 ? "text-black font-medium" : ""}>Listo</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">Paso {step} de 4</div>
        </div>
      </header>

      {/* Promo banner */}
      <div className="bg-green-100 text-green-900 text-center py-2.5 text-sm font-medium">
        🎁 50% de descuento en tu primera caja + Desayuno gratis por 1 año
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Form */}
          <div className="order-2 md:order-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    ¿Cuántos días a la semana quieres comidas?
                  </h1>
                  <p className="text-gray-500 mb-8">Puedes cambiarlo cuando quieras.</p>

                  <div className="space-y-3">
                    {DAYS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setData((d) => ({ ...d, days: opt.id }))}
                        className={clsx(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all",
                          data.days === opt.id
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    ¿Qué tipo de comidas prefieres?
                  </h1>
                  <p className="text-gray-500 mb-8">Elige la que más se ajuste a tus metas.</p>

                  <div className="space-y-3">
                    {PREFERENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setData((d) => ({ ...d, preference: opt.id }))}
                        className={clsx(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all",
                          data.preference === opt.id
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Llevemos comida saludable a tu casa
                  </h1>
                  <p className="text-gray-500 mb-8">
                    Solo necesitamos tu código postal para saber dónde enviarte tus comidas.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Código postal"
                      value={data.zip}
                      onChange={(e) =>
                        setData((d) => ({ ...d, zip: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                      }
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-lg"
                      maxLength={5}
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    ¡Tu plan está listo!
                  </h1>
                  <p className="text-gray-500 mb-8">Revisa tu selección y continúa.</p>

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4 mb-8">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frecuencia</span>
                      <span className="font-medium">
                        {DAYS_OPTIONS.find((o) => o.id === data.days)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preferencia</span>
                      <span className="font-medium">
                        {PREFERENCE_OPTIONS.find((o) => o.id === data.preference)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Código postal</span>
                      <span className="font-medium">{data.zip}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                      <span className="text-gray-500">Primera caja</span>
                      <div className="text-right">
                        <span className="line-through text-gray-400 text-sm mr-2">$119.99</span>
                        <span className="text-2xl font-bold text-green-600">$59.99</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-black text-white py-4 rounded-xl font-medium text-lg hover:bg-gray-800 transition-colors">
                    Continuar al pago →
                  </button>
                  <p className="text-center text-sm text-gray-400 mt-3">
                    Puedes pausar o cancelar en cualquier momento
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            {step < 4 && (
              <div className="flex gap-3 mt-10">
                {step > 1 && (
                  <button
                    onClick={back}
                    className="px-6 py-3.5 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Atrás
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={!canContinue()}
                  className={clsx(
                    "flex-1 py-3.5 rounded-xl font-medium transition-colors",
                    canContinue()
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Right: Image */}
          <div className="order-1 md:order-2 hidden md:block">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50 to-green-50 shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Comidas listas en 2 minutos
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Chef-prepared • Dietitian-approved • Fresh, never frozen
                  </p>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-orange-200/40" />
              <div className="absolute bottom-12 right-10 w-28 h-28 rounded-full bg-green-200/40" />
              <div className="absolute top-1/3 right-6 w-12 h-12 rounded-full bg-yellow-200/50" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 Ready pa&apos; la semana. Todos los derechos reservados.
      </footer>
    </div>
  );
}