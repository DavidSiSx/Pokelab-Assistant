import type { Metadata } from "next";
import { ReviewView } from "@/components/review/ReviewView";

export const metadata: Metadata = {
  title: "Review de Equipo — Pokelab Assistant",
  description:
    "Análisis competitivo profundo de tu equipo: sinergia, cobertura, speed control y veredicto de meta.",
};

export default function ReviewPage() {
  return <ReviewView />;
}
