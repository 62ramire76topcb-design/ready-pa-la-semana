"use client";

import { motion } from "framer-motion";

const LABELS = ["D\u00edas", "Tipo", "Personas", "Comidas", "Direcci\u00f3n", "Datos", "Pago"];

export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const progress = (step / total) * 100;

  return (
    <div className="flex-1 max-w-md mx-4 hidden sm:block">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
        {LABELS.map((label, i) => (
          <span
            key={label}
            className={step >= i + 1 ? "text-brand-700 font-medium" : ""}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}