"use client";

import clsx from "clsx";
import { Meal } from "@/lib/types";

interface Props {
  meal: Meal;
  selected: boolean;
  onToggle: () => void;
}

export default function MealCard({ meal, selected, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        "text-left p-4 rounded-xl border-2 transition-all",
        selected
          ? "border-brand-600 bg-brand-50 shadow-sm"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{meal.emoji}</span>
        {selected && (
          <div className="w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs shrink-0">
            ✓
          </div>
        )}
      </div>
      <h3 className="font-semibold mt-2 text-sm leading-tight">{meal.name}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meal.description}</p>
      <div className="flex gap-2 mt-2 text-xs text-gray-400">
        <span>{meal.calories} cal</span>
        <span>·</span>
        <span>{meal.protein}g prot</span>
      </div>
    </button>
  );
}
