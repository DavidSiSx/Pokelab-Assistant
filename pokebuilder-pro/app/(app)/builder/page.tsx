import type { Metadata } from "next";
import { BuilderView } from "@/components/builder/BuilderView";

export const metadata: Metadata = {
  title: "Team Builder — Pokelab Assistant",
  description:
    "Genera un equipo competitivo desde cero o alrededor de un líder con sugerencias de IA.",
};

export default function BuilderPage() {
  return <BuilderView />;
}
