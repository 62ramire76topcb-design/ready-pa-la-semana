"use client";

import clsx from "clsx";
import { Meal } from "@/lib/types";

export default function MealCard({
  meal,
  selected,
  onToggle,
}: {
  meal: Meal;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "text-left rounded-2xl border-2 overflow-hidden transition-all",
        selected
          ? "border-brand-600 ring-2 ring-brand-100"
          : "border-gray-100 hover:border-gray-300"
      )}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meal.image}
          alt={meal.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {selected && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            ✓
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm leading-tight">{meal.name}</div>
        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{meal.description}</div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{meal.calories} cal</span>
          <span>{meal.protein}g prot</span>
          <span className="font-medium text-brand-700">${meal.price.toFixed(2)}</span>
        </div>
      </div>
    </button>
  );
}
