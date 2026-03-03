import type { Metadata } from "next";
import { TeamsView } from "@/components/teams/TeamsView";

export const metadata: Metadata = {
  title: "Mis Equipos — Pokelab Assistant",
  description:
    "Consulta, exporta a Showdown y gestiona todos tus equipos competitivos guardados.",
};

export default function TeamsPage() {
  return <TeamsView />;
}
