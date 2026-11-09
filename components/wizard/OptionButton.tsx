"use client";

import clsx from "clsx";

interface Props {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  emoji?: string;
}

export default function OptionButton({ selected, onClick, label, desc, emoji }: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4",
        selected
          ? "border-brand-600 bg-brand-50 shadow-sm"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {emoji && <span className="text-2xl">{emoji}</span>}
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {desc && <div className="text-sm text-gray-500">{desc}</div>}
      </div>
      {selected && (
        <div className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm shrink-0">
          ✓
        </div>
      )}
    </button>
  );
}
