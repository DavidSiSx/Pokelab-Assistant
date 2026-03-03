"use client";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Pokémon type → CSS class (from globals.css)
const TYPE_CLASS: Record<string, string> = {
  normal:   "type-normal",
  fire:     "type-fire",
  water:    "type-water",
  electric: "type-electric",
  grass:    "type-grass",
  ice:      "type-ice",
  fighting: "type-fighting",
  poison:   "type-poison",
  ground:   "type-ground",
  flying:   "type-flying",
  psychic:  "type-psychic",
  bug:      "type-bug",
  rock:     "type-rock",
  ghost:    "type-ghost",
  dragon:   "type-dragon",
  dark:     "type-dark",
  steel:    "type-steel",
  fairy:    "type-fairy",
  stellar:  "type-stellar",
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[0.6rem]",
  md: "px-2.5 py-0.5 text-[0.7rem]",
  lg: "px-3 py-1 text-xs",
};

export function TypeBadge({ type, size = "md", className = "" }: TypeBadgeProps) {
  const normalized = type.toLowerCase();
  const typeClass = TYPE_CLASS[normalized] ?? "type-normal";

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-bold
        uppercase tracking-widest leading-none
        ${typeClass} ${SIZE_CLASSES[size]} ${className}
      `}
    >
      {type}
    </span>
  );
}
