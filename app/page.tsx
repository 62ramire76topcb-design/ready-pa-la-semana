"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Step = 1 | 2 | 3 | 4 | 5;

interface PlanData {
  days: string | null;
  preference: string | null;
  people: string | null;
  zip: string;
  email: string;
}

const STORAGE_KEY = "ready-pa-la-semana-plan";

const DAYS_OPTIONS = [
  { id: "1-2", label: "1-2 días a la semana", desc: "Ideal para probar", meals: 4 },
  { id: "3", label: "3 días a la semana", desc: "El más popular", meals: 6 },
  { id: "weekdays", label: "Días de semana", desc: "Lunes a viernes", meals: 10 },
  { id: "everyday", label: "Todos los días", desc: "Máximo comodidad", meals: 14 },
];

const PREFERENCE_OPTIONS = [
  { id: "protein", label: "Alto en Proteína", desc: "30g+ de proteína por comida", emoji: "🥩" },
  { id: "calorie", label: "Calorie Smart", desc: "Menos de 550 calorías", emoji: "📊" },
  { id: "keto", label: "Keto / Bajo en carbos", desc: "15g netos de carbos o menos", emoji: "🥑" },
  { id: "balanced", label: "Equilibrado", desc: "Variedad y nutrición completa", emoji: "🥗" },
  { id: "veggie", label: "Vegetariano / Vegano", desc: "Opciones plant-based", emoji: "🥦" },
];

const PEOPLE_OPTIONS = [
  { id: "1", label: "1 persona", desc: "Porciones individuales" },
  { id: "2", label: "2 personas", desc: "Ideal para parejas" },
  { id: "3-4", label: "3-4 personas", desc: "Familia pequeña" },
];

const PRICES: Record<string, number> = {
  "1-2": 59.99,
  "3": 79.99,
  weekdays: 109.99,
  everyday: 139.99,
};

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<PlanData>({
    days: null,
    preference: null,
    people: null,
    zip: "",
    email: "",
  });
  const [loaded, setLoaded] = useState(false);

  // Cargar progreso guardado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Guardar progreso
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
  }, [data, step, loaded]);

  const canContinue = () => {
    if (step === 1) return !!data.days;
    if (step === 2) return !!data.preference;
    if (step === 3) return !!data.people;
    if (step === 4) return data.zip.trim().length >= 5;
    if (step === 5) return data.email.includes("@") && data.email.includes(".");
    return true;
  };

  const next = () => {
    if (!canContinue()) return;
    if (step < 5) setStep((s) => (s + 1) as Step);
  };

  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData({ days: null, preference: null, people: null, zip: "", email: "" });
    setStep(1);
  };

  const progress = (step / 5) * 100;
  const selectedDays = DAYS_OPTIONS.find((o) => o.id === data.days);
  const selectedPref = PREFERENCE_OPTIONS.find((o) => o.id === data.preference);
  const selectedPeople = PEOPLE_OPTIONS.find((o) => o.id === data.people);
  const basePrice = data.days ? PRICES[data.days] : 0;
  const discountPrice = +(basePrice * 0.5).toFixed(2);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-semibold text-lg hidden sm:block">Ready pa&apos; la semana</span>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-sm mx-6 hidden sm:block">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
              <span className={step >= 1 ? "text-black font-medium" : ""}>Días</span>
              <span className={step >= 2 ? "text-black font-medium" : ""}>Tipo</span>
              <span className={step >= 3 ? "text-black font-medium" : ""}>Personas</span>
              <span className={step >= 4 ? "text-black font-medium" : ""}>Ubicación</span>
              <span className={step >= 5 ? "text-black font-medium" : ""}>Listo</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">Paso {step} de 5</div>
        </div>
      </header>

      {/* Promo banner */}
      <div className="bg-emerald-100 text-emerald-900 text-center py-2.5 text-sm font-medium">
        🎁 50% de descuento en tu primera caja + Desayuno gratis por 1 año
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-start">
          {/* Left: Form */}
          <div className="order-2 md:order-1">
            <AnimatePresence mode="wait">
              {/* STEP 1 - Days */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
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
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between",
                          data.days === opt.id
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-sm text-gray-500">{opt.desc}</div>
                        </div>
                        {data.days === opt.id && (
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 - Preference */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
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
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4",
                          data.preference === opt.id
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-sm text-gray-500">{opt.desc}</div>
                        </div>
                        {data.preference === opt.id && (
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3 - People */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    ¿Para cuántas personas?
                  </h1>
                  <p className="text-gray-500 mb-8">Así ajustamos las porciones.</p>

                  <div className="space-y-3">
                    {PEOPLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setData((d) => ({ ...d, people: opt.id }))}
                        className={clsx(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between",
                          data.people === opt.id
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-sm text-gray-500">{opt.desc}</div>
                        </div>
                        {data.people === opt.id && (
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 4 - ZIP */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
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
                      inputMode="numeric"
                      placeholder="Código postal (ej. 30901)"
                      value={data.zip}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                        }))
                      }
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none text-lg"
                      maxLength={5}
                    />
                  </div>
                  {data.zip.length > 0 && data.zip.length < 5 && (
                    <p className="text-sm text-amber-600 mt-2">Ingresa los 5 dígitos del código postal</p>
                  )}
                </motion.div>
              )}

              {/* STEP 5 - Summary + Email */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    ¡Tu plan está listo!
                  </h1>
                  <p className="text-gray-500 mb-6">Revisa tu selección y deja tu correo para continuar.</p>

                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Frecuencia</span>
                      <span className="font-medium">{selectedDays?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipo de comida</span>
                      <span className="font-medium">{selectedPref?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Personas</span>
                      <span className="font-medium">{selectedPeople?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Código postal</span>
                      <span className="font-medium">{data.zip}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-gray-500">Primera caja</span>
                      <div className="text-right">
                        <span className="line-through text-gray-400 text-sm mr-2">${basePrice.toFixed(2)}</span>
                        <span className="text-2xl font-bold text-emerald-600">${discountPrice}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Incluye ~{selectedDays?.meals || 0} comidas + desayuno gratis
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Tu correo electrónico</label>
                    <input
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={data.email}
                      onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none"
                    />
                  </div>

                  <button
                    disabled={!canContinue()}
                    className={clsx(
                      "w-full py-4 rounded-xl font-medium text-lg transition-colors",
                      canContinue()
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Continuar al pago →
                  </button>
                  <p className="text-center text-sm text-gray-400 mt-3">
                    Puedes pausar o cancelar en cualquier momento
                  </p>

                  <button
                    onClick={reset}
                    className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Empezar de nuevo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            {step < 5 && (
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

          {/* Right: Visual */}
          <div className="order-1 md:order-2 hidden md:block sticky top-28">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-emerald-50 shadow-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-7xl mb-6">🍽️</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Comidas listas en 2 minutos
                </h3>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  Preparadas por chefs • Aprobadas por nutricionistas • Frescas, nunca congeladas
                </p>

                {selectedDays && (
                  <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm">
                    <div className="text-sm text-gray-500">Tu selección actual</div>
                    <div className="font-semibold text-gray-900">{selectedDays.label}</div>
                    {selectedPref && (
                      <div className="text-sm text-emerald-700 mt-0.5">{selectedPref.label}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Decorative circles */}
              <div className="absolute top-10 left-8 w-24 h-24 rounded-full bg-orange-200/50" />
              <div className="absolute bottom-16 right-8 w-32 h-32 rounded-full bg-emerald-200/40" />
              <div className="absolute top-1/3 right-10 w-14 h-14 rounded-full bg-amber-200/60" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 Ready pa&apos; la semana · Puedes pausar o cancelar cuando quieras
      </footer>
    </div>
  );
}