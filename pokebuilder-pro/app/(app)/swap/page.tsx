import type { Metadata } from "next";
import { SwapView } from "@/components/swap/SwapView";

export const metadata: Metadata = {
  title: "Swap de Miembro — Pokelab Assistant",
  description:
    "Reemplaza un miembro de tu equipo con sugerencias optimizadas por IA. Importa desde Showdown paste o usa tu equipo del builder.",
};

export default function SwapPage() {
  return <SwapView />;
}
