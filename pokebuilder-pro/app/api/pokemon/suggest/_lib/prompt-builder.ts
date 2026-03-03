import { VALID_MEGA_STONES, LEGENDARY_LIST, MYTHICAL_LIST, PARADOX_LIST, UB_LIST, ELITE_COMPETITIVE_RULES } from "./constants";
import { getMegaStone } from "./mega-validator";

// ─────────────────────────────────────────────────────────────────
// EXPERIENCE PROMPT
// ─────────────────────────────────────────────────────────────────
export function buildExperiencePrompt(level: string): string {
  if (level === "novato") {
    return `MODO NOVATO: Usa lenguaje accesible y analogías para explicar sinergias. 
    Explica la jerga técnica la primera vez que aparezca. 
    Prioriza builds simples y efectivas sobre las ultra-optimizadas.
    Evita referencias a damage calcs complejos — explica el "por qué" de cada decisión.`;
  }
  return `MODO EXPERTO: Conocimiento avanzado de Smogon/VGC asumido. 
    Profundiza en matchups, speed tiers, damage calcs aproximados y win conditions. 
    Sin explicaciones básicas. Usa terminología técnica libremente.
    Considera interacciones avanzadas: ability suppression, terrain interactions, priority moves.`;
}

// ─────────────────────────────────────────────────────────────────
// FORMAT / CLAUSE PROMPT
// ─────────────────────────────────────────────────────────────────
function buildFormatPrompt(config: any): string {
  const clauses = config.clauses ?? [];
  const format = config.format || "";
  const f = format.toLowerCase();

  const isVGC        = f.includes("vgc") || (f.includes("doubles") && !f.includes("6v6"));
  const isSingles    = f.includes("singles") || f.includes("1v1") || f.includes("ou") || f.includes("smogon") || f.includes("bss") || f.includes("battle stadium singles");
  const is6v6        = f.includes("6v6");
  const isCobblemon  = f.includes("cobblemon");
  const isNatDex     = f.includes("national dex") || f.includes("natdex");
  const isLC         = f.includes("little cup") || config.isLittleCup;

  let prompt = `FORMATO: ${format}\n`;

  if (isVGC && !is6v6) {
    prompt += `
REGLAS VGC/DOUBLES (4v4 en campo doble):
- Traes 6, eliges 4, juegas con 2 activos simultáneamente.
- RITMO DE JUEGO: Las victorias se deciden en pocos turnos. 2 Pokémon activos 
  significa el doble de presión por turno — cada movimiento debe contar.
  Un Pokémon mediocre en Singles puede ser S-tier en VGC con el rol correcto.
  Ejemplo: Amoonguss es niche en Singles pero top en VGC por Rage Powder + Spore.
- SPREAD MOVES: Prioritarios para golpear ambos rivales. 
  Top tier: Earthquake, Rock Slide, Heat Wave, Surf, Discharge, Dazzling Gleam, Blizzard.
  OJO: Earthquake golpea a tu propio compañero — coordina con Pokémon voladores/levitadores.
- REDIRECCIÓN: Incluye 1 Pokémon con Follow Me (Clefairy, Togekiss) o 
  Rage Powder (Amoonguss) para proteger al sweeper principal.
- PROTECT: OBLIGATORIO en al menos 3-4 Pokémon. Es el move más importante de VGC.
  Permite scouting, sobrevivir un turno, esperar que el clima/terreno haga daño.
- CLIMA/TERRENO EN VGC: Con solo 4 Pokémon activos, tener 2 setters del mismo clima
  puede ser VIABLE y RECOMENDABLE para redundancia en el teambuilding
  (ej: Torkoal + Venusaur en sol, Pelipper + Ludicolo en lluvia).
  Evalúa si la sinergia del equipo lo justifica — no es redundancia inútil.
- HAZARDS: Stealth Rock y Spikes son INÚTILES en VGC — no los incluyas.
- ITEMS VGC: Safety Goggles (contra spore/pollen), Wide Lens (spread accuracy),
  Covert Cloak (contra secondary effects), Mental Herb (contra Taunt/Encore).
- SPEED TIERS VGC clave: Base 100 es el umbral. 110, 120, 130+ son los más relevantes.
  Importante: en VGC con Tailwind, un Pokémon base 60 puede outspeedear a base 130.
- SOPORTE ACTIVO: Tailwind, Trick Room, clima y terreno benefician al equipo completo.
  Prioriza 1-2 Pokémon de soporte puro si el arquetipo lo permite.
- LEADS: Los 2 primeros Pokémon determinan tu apertura. 
  Optimiza su sinergia mutua — deben funcionar bien juntos desde el turno 1.`;
  }

  if (is6v6 || (isCobblemon && f.includes("doubles"))) {
    prompt += `
REGLAS 6v6 DOUBLES (Cobblemon/Custom):
- Traes 6, usas 6, juegas con 2 activos simultáneamente.
- MÁS PROFUNDIDAD que VGC estándar: puedes tener más cobertura situacional.
- RITMO: Similar a VGC pero con más opciones de back — puedes permitirte 
  más Pokémon de nicho o situacionales porque no sacrificas slots de un equipo de 4.
- LEADS: Con 6 Pokémon, puedes tener 2 combinaciones de lead distintas según matchup.
- CLIMA DOBLE: Con 6v6 es MÁS viable tener 2 setters del mismo clima.
  Tienes flexibilidad para elegir cuál llevar al frente según el oponente.
- REDUNDANCIA: Tener 2 Pokémon con roles similares es viable y recomendable.
  Ejemplo: 2 setters de Trick Room para consistencia.
- HAZARDS: En 6v6 Doubles los hazards son más viables que en VGC estándar 
  (más turnos de batalla) — evalúa si el arquetipo los justifica.
- SPREAD MOVES: Igual de importantes que en VGC estándar.
- PROTECT: Obligatorio en la mayoría del equipo.`;
  }

  if (isSingles && !is6v6) {
    prompt += `
REGLAS SINGLES (1v1 activo):
- SPEED TIERS CRÍTICOS: En Singles, 1 punto de Speed puede determinar quien gana.
  Tiers clave: Base 50 (TR), 70, 80, 95, 100 (umbral), 108, 110, 120, 130+.
  Siempre verifica si el Pokémon outspeedea a las amenazas del meta.
- HAZARDS OBLIGATORIOS: Stealth Rock es el move más importante de Singles.
  SIEMPRE incluye 1 setter de Stealth Rock Y 1 removedor (Defog o Rapid Spin).
  Spikes son viables en arquetipos de stall/balance.
- PIVOTS: U-turn, Volt Switch, Flip Turn para mantener momentum.
  Incluye al menos 1-2 pivots para controlar qué Pokémon entra al campo.
- SETUP SWEEPERS: Singles premia más el setup (Dragon Dance, Swords Dance, Nasty Plot)
  que VGC porque hay menos interrupciones por el segundo Pokémon rival.
- CLIMA EN SINGLES: 1 setter es suficiente. 2 setters del mismo clima es REDUNDANTE
  en Singles — usa ese slot para otro rol.
- TERRAIN EN SINGLES: Similar al clima — 1 setter máximo.
- STALLBREAKERS: Si el meta tiene stall, incluye Pokémon con Taunt, Encore o 
  moves que ignoran evasión/defensa (Chip Away, Sacred Sword).
- WALL BREAKING: Al menos 1 Pokémon capaz de romper cores defensivos comunes.
- PRIORITY MOVES: Extremamente importantes en Singles para revenge killing.
  Considera Pokémon con Sucker Punch, Bullet Punch, Mach Punch, Aqua Jet.`;
  }

  if (isNatDex) {
    prompt += `
CONSIDERACIONES NATIONAL DEX:
- Mega Evoluciones disponibles si enableMega=true — son viables en este formato.
- Pokémon de todas las generaciones disponibles — considera amenazas de gens antiguas.
- Algunas estrategias de generaciones previas (Shell Smash + Baton Pass) 
  pueden estar baneadas según las cláusulas del formato.`;
  }

  if (isLC) {
    prompt += `
CONSIDERACIONES LITTLE CUP:
- Solo pre-evoluciones nivel 5. Máximo nivel 5.
- Sin stones evolutivas (Thunder Stone, Fire Stone, etc.).
- SPEED TIERS LC: Base 15-20 es lento, 25+ es rápido, 30+ es ultra rápido en LC.
- Items exclusivos de LC: Berry Juice (recupera HP completo una vez), Oran Berry.
- Choice Scarf es especialmente poderoso en LC por los speed tiers bajos.
- Eviolite es el item más común — boost de 50% en Def y SpD para pre-evoluciones.`;
  }

  if (isCobblemon) {
    prompt += `
CONSIDERACIONES COBBLEMON (Minecraft mod):
- Puede incluir mecánicas de múltiples generaciones simultáneamente.
- Verifica las mecánicas activas (Mega, Gmax, Tera, Z-Moves) según la config.
- Algunos moves o habilidades pueden comportarse diferente que en los juegos oficiales.
- Prioriza estrategias probadas en el meta competitivo oficial como base.`;
  }

  if (clauses.length > 0) {
    prompt += `\nCLÁUSULAS ACTIVAS: ${clauses.join(", ")}`;
    if (clauses.some((c: string) => c.toLowerCase().includes("item clause")))
      prompt += "\n→ ITEM CLAUSE: PROHIBIDO repetir objetos en el mismo equipo.";
    if (clauses.some((c: string) => c.toLowerCase().includes("species clause")))
      prompt += "\n→ SPECIES CLAUSE: PROHIBIDO repetir Pokémon (misma especie).";
    if (clauses.some((c: string) => c.toLowerCase().includes("sleep clause")))
      prompt += "\n→ SLEEP CLAUSE: Máximo 1 Pokémon rival dormido a la vez. Evita múltiples moves de sleep.";
    if (clauses.some((c: string) => c.toLowerCase().includes("evasion clause")))
      prompt += "\n→ EVASION CLAUSE: PROHIBIDO usar Double Team o Minimize.";
    if (clauses.some((c: string) => c.toLowerCase().includes("ohko clause")))
      prompt += "\n→ OHKO CLAUSE: PROHIBIDO usar Fissure, Guillotine, Sheer Cold, Horn Drill.";
    if (clauses.some((c: string) => c.toLowerCase().includes("dynamax clause")))
      prompt += "\n→ DYNAMAX CLAUSE: PROHIBIDO usar Dynamax o Gigantamax en batalla.";
    if (clauses.some((c: string) => c.toLowerCase().includes("baton pass clause")))
      prompt += "\n→ BATON PASS CLAUSE: PROHIBIDO usar Baton Pass con boosts de stats.";
  }

  return prompt;
}

// ─────────────────────────────────────────────────────────────────
// MONOTYPE PROMPT
// ─────────────────────────────────────────────────────────────────
function buildMonotypePrompt(config: any): string {
  if (!config.isMonotype || !config.monoTypeSelected) return "";
  return `MODO MONOTYPE ${config.monoTypeSelected.toUpperCase()}:
  - TODOS los Pokémon del equipo DEBEN ser de tipo ${config.monoTypeSelected}.
  - El pool YA está pre-filtrado por tipo — SOLO usa Pokémon del pool.
  - COBERTURA OFENSIVA OBLIGATORIA: Si el tipo carece de atacantes especiales,
    DEBES incluir al menos 1 Pokémon mixto o especial aunque sea de nicho.
    Prioriza la variación ofensiva sobre el usage_score en este caso.
    Un Pokémon de nicho con SpA decente es MEJOR que 6 atacantes físicos idénticos.
  - COBERTURA DE MOVES: Busca moves que cubran las debilidades comunes del tipo.
    Ejemplo Monotype Agua: incluye Ice Beam o Energy Ball para cubrir Dragón/Planta.
    Ejemplo Monotype Lucha: incluye Mach Punch (prioridad) y Stone Edge (cobertura).
  - VARIACIÓN DE ROLES: Aunque todos sean del mismo tipo, asegura variedad de roles:
    al menos 1 sweeper, 1 soporte/setter, 1 wall o pivot.
  - Reporta en debilidades si el equipo depende de un solo eje de daño Y sugiere
    específicamente qué tipo de Pokémon (rol/ataque) mejoraría el equipo.`;
}

// ─────────────────────────────────────────────────────────────────
// WEATHER PROMPT
// ─────────────────────────────────────────────────────────────────
function buildWeatherPrompt(config: any): string {
  if (!config.preferredWeather || config.preferredWeather === "none") return "";
  const f = (config.format || "").toLowerCase();
  const isVGC = f.includes("vgc") || f.includes("doubles");
  const setterNote = isVGC
    ? "En VGC puedes incluir 2 setters para redundancia si la sinergia lo justifica."
    : "En Singles 1 setter es suficiente — no incluyas 2 setters del mismo clima.";

  const weatherDetails: Record<string, string> = {
    sun:  `Sol (Drought/Sunny Day): Setter: Ninetales-Alola, Torkoal. Abusers: Chlorophyll, Solar Power. Beneficios: Fire x1.5, SolarBeam sin carga. ${setterNote}`,
    rain: `Lluvia (Drizzle/Rain Dance): Setter: Pelipper, Politoed. Abusers: Swift Swim, Dry Skin. Beneficios: Water x1.5, Thunder 100%. ${setterNote}`,
    sand: `Arena (Sand Stream): Setter: Tyranitar, Hippowdon. Abusers: Sand Rush, Sand Force. Beneficios: SpD+50% Rock. ${setterNote}`,
    snow: `Nevada (Snow Warning): Setter: Abomasnow, Ninetales-Alola. Abusers: Slush Rush, Ice Body. Beneficios: Def+50% Ice, Blizzard 100%. ${setterNote}`,
  };

  return `CLIMA PREFERIDO: ${weatherDetails[config.preferredWeather] || config.preferredWeather}`;
}

// ─────────────────────────────────────────────────────────────────
// TERRAIN PROMPT
// ─────────────────────────────────────────────────────────────────
function buildTerrainPrompt(config: any): string {
  if (!config.preferredTerrain || config.preferredTerrain === "none") return "";
  const f = (config.format || "").toLowerCase();
  const isVGC = f.includes("vgc") || f.includes("doubles");
  const setterNote = isVGC
    ? "En VGC puedes considerar 2 setters si ambos tienen roles distintos además del terreno."
    : "En Singles 1 setter es suficiente.";

  const terrainDetails: Record<string, string> = {
    electric: `Eléctrico (Electric Surge): Setter: Tapu Koko, Pincurchin. Electric x1.3, previene sleep. ${setterNote}`,
    grassy:   `Herboso (Grassy Surge): Setter: Tapu Bulu, Rillaboom. Grass x1.3, HP+1/16, Earthquake x0.5. ${setterNote}`,
    psychic:  `Psíquico (Psychic Surge): Setter: Tapu Lele, Indeedee. Psychic x1.3, bloquea prioridad. ${setterNote}`,
    misty:    `Brumoso (Misty Surge): Setter: Tapu Fini. Previene status, Dragon x0.5. ${setterNote}`,
  };

  return `TERRENO PREFERIDO: ${terrainDetails[config.preferredTerrain] || config.preferredTerrain}`;
}

// ─────────────────────────────────────────────────────────────────
// SPEED CONTROL PROMPT
// ─────────────────────────────────────────────────────────────────
function buildSpeedControlPrompt(config: any): string {
  let prompt = "";
  if (config.preferTrickRoom) {
    prompt += `TRICK ROOM ACTIVADO:
    - DEBES incluir 1-2 setters de Trick Room (Porygon2, Dusclops, Oranguru, Hatterene, Indeedee, Slowbro).
    - Sweepers TR ideales: Marowak-Alola, Conkeldurr, Reuniclus, Rhyperior, Torkoal, Ursaluna, Stakataka.
    - NATURE SWEEPERS TR: Brave (Atk) o Quiet (SpA). IVS: 0 Speed IVs OBLIGATORIO.
    - BASE SPEED IDEAL: ≤ 50 para sweepers. EN VGC: Fake Out + TR como apertura.`;
  }
  if (config.preferTailwind) {
    prompt += `\nTAILWIND ACTIVADO:
    - DEBES incluir 1-2 setters de Tailwind (Whimsicott, Tornadus, Talonflame, Pelipper, Murkrow).
    - Tailwind dura 4 turnos. Abusers ideales: base Speed 60-90.
    - EN VGC: Whimsicott top tier por Prankster + Tailwind (prioridad).`;
  }
  return prompt;
}

// ─────────────────────────────────────────────────────────────────
// ARCHETYPE PROMPT
// ─────────────────────────────────────────────────────────────────
function buildArchetypePrompt(config: any): string {
  const archetypes: Record<string, string> = {
    offense: `ARQUETIPO OFENSIVO (Hyper Offense):
    - Maximiza presión ofensiva desde el turno 1.
    - Prioriza Setup Sweepers (DD, SD, NP, QD) y Wallbreakers de alto poder.
    - Items preferidos: Choice Band, Choice Specs, Life Orb, Booster Energy.
    - Movimientos: Máximo daño directo. Moves de estado solo si tienen doble propósito.
    - Speed Control: Tailwind es preferible a TR. Evita builds puramente defensivas.
    - Win condition clara: al menos 1 sweeper que pueda limpiar con 1-2 KOs.
    - Considera Pokémon con Prioridad para revenge killing (Bullet Punch, Mach Punch).`,

    balance: `ARQUETIPO BALANCE:
    - Mezcla de amenazas ofensivas y defensivas.
    - Incluye: 1-2 Pivots (U-turn/Volt Switch), 1 wall defensivo, 1-2 sweepers.
    - Items variados: Leftovers, Rocky Helmet, Choice items, Assault Vest, Boots.
    - Debe tener respuesta para las amenazas comunes del meta.
    - Hazard setter + remover si es Singles. Protect en la mayoría si es Doubles.
    - Win condition flexible: puede ganar por attrition o por setup sweep.`,

    stall: `ARQUETIPO STALL/DEFENSIVO:
    - Máxima durabilidad. EVs defensivos: 252 HP + 252 Def o SpD.
    - OBLIGATORIO en Singles: Stealth Rock setter + Defog/Rapid Spin remover.
    - Hazards: Spikes (1-3 capas) + Stealth Rock para desgaste pasivo.
    - Moves de estado prioritarios: Toxic, Will-O-Wisp, Thunder Wave.
    - Recovery: Wish + Protect, Recover, Roost, Synthesis en todos los walls.
    - Win condition: Desgaste total (chip + hazards + status + recovery).
    - Incluye al menos 1 Pokémon con Taunt para evitar que el rival también stallée.
    - Items: Leftovers, Rocky Helmet, Eviolite, Heavy-Duty Boots para pivots.`,
  };
  return archetypes[config.teamArchetype] || "";
}

// ─────────────────────────────────────────────────────────────────
// MECHANICS PROMPT
// ─────────────────────────────────────────────────────────────────
function buildMechanicsPrompt(config: any): string {
  let prompt = "";

  if (config.enableMega) {
    const stoneList = Object.entries(VALID_MEGA_STONES)
      .filter(([, stone]) => stone && stone !== "None (no stone needed)")
      .map(([poke, stone]) => `${poke}→${stone}`)
      .join(", ");
    prompt += `MEGA EVOLUTION ACTIVADA:
    - Asigna Mega Stone a MÁXIMO 1 miembro del equipo.
    - Candidatos marcados [MEGA: X] tienen Mega confirmada — usa esa stone exacta.
    - Candidatos marcados [SIN MEGA] NUNCA pueden tener Mega Stone.
    - Rayquaza puede Mega sin stone si enableMega=true y allowLegendaries=true.
    - Stones válidas: ${stoneList}.
    - La Mega Evolution cambia ability y stats — considera el ability post-mega.
      Ejemplo: Mega Charizard Y gana Drought. Mega Gyarados cambia a Mold Breaker.`;
  }

  if (config.enableGmax) {
    prompt += `\nGIGANTAMAX ACTIVADO:
    - G-Max moves tienen efectos secundarios únicos superiores a Max Moves normales.
    - Top Gmax: Charizard (G-Max Wildfire), Gengar (G-Max Terror), 
      Lapras (G-Max Resonance), Urshifu (G-Max One Blow/Rapid Flow).
    - Considera que solo Pokémon específicos tienen forma Gmax.`;
  }

  if (config.enableDynamax) {
    prompt += `\nDYNAMAX ACTIVADO:
    - Cualquier Pokémon puede Dynamaxear por 3 turnos.
    - Max Moves tienen efectos secundarios: Max Airstream (Tailwind), 
      Max Quake (SpDef +1 equipo), Max Knuckle (Atk +1 equipo), 
      Max Ooze (SpA +1 equipo), Max Guard (Protect infalible).
    - Dinamaxea al Pokémon que más se beneficie de los boost de Max Moves.`;
  }

  if (config.enableTera) {
    if (config.preferredTeraType) {
      prompt += `\nTERACRISTALIZACIÓN ACTIVADA (tipo preferido: ${config.preferredTeraType.toUpperCase()}):
    - El Tera Type cambia el tipo del Pokémon completamente.
    - Potencia moves del Tera Type: x2 si es STAB original, x1.5 si es nuevo tipo.
    - Uso ofensivo: cubre resistencias del rival (Tera Ghost en Normal para Immune).
    - Uso defensivo: elimina debilidades (Tera Normal en Gengar quita su debilidad).
    - Incluye "teraType": "${config.preferredTeraType}" en el Pokémon que más se beneficie.`;
    } else {
      prompt += `\nTERACRISTALIZACIÓN ACTIVADA (tipo libre):
    - Elige el Tera Type más estratégico para cada Pokémon individualmente.
    - Ofensivo: tipo que cubra las resistencias del equipo rival más común.
    - Defensivo: tipo que elimine debilidades críticas del Pokémon.
    - Sorpresa: Tera Type inesperado para confundir al rival (Tera Stellar para STAB universal).
    - Incluye "teraType" en cada build con el tipo en inglés lowercase.`;
    }
  }

  if (config.enableZMoves) {
    prompt += `\nZ-MOVES ACTIVADOS:
    - Asigna MÁXIMO 1 Z-Crystal en todo el equipo.
    - Elige el Pokémon que más se beneficie de un Z-Move de alta potencia.
    - Z-Crystals especiales tienen efectos únicos:
      Tapunium Z: Guardian of Alola (75% HP del rival).
      Decidium Z: Sinister Arrow Raid (180 potencia).
      Incinium Z: Malicious Moonsault (180 potencia).
      Pikachuium Z: Catastropika (210 potencia).
    - Z-Moves de estado también son útiles: Z-Splash (+3 Atk), Z-Haze (resetea stats).`;
  }

  return prompt;
}

// ─────────────────────────────────────────────────────────────────
// PROHIBITIONS PROMPT
// ─────────────────────────────────────────────────────────────────
function buildProhibitionsPrompt(config: any): string {
  const prohibitions: string[] = [];

  if (!config.enableMega)
    prohibitions.push("PROHIBIDO asignar Mega Stones. Ningún item puede ser una Mega Stone (terminar en 'ite' siendo una stone).");
  if (!config.enableZMoves)
    prohibitions.push("PROHIBIDO asignar Z-Crystals. Ningún item puede terminar en 'ium Z' o '-Z'.");
  if (!config.enableTera)
    prohibitions.push("PROHIBIDO incluir campo 'teraType' en ningún build.");
  if (!config.enableDynamax && !config.enableGmax)
    prohibitions.push("PROHIBIDO mencionar Dynamax, Gigantamax, Max Moves o G-Max moves.");
  if (!config.allowLegendaries)
    prohibitions.push(`PROHIBIDO incluir Legendarios. Lista parcial: ${LEGENDARY_LIST.slice(0, 15).join(", ")} y otros legendarios conocidos.`);
  if (!config.allowMythicals)
    prohibitions.push(`PROHIBIDO incluir Mythicals/Singulares: ${MYTHICAL_LIST.join(", ")}.`);
  if (!config.allowParadox)
    prohibitions.push(`PROHIBIDO incluir Pokémon Paradoja: ${PARADOX_LIST.join(", ")}.`);
  if (!config.allowUB)
    prohibitions.push(`PROHIBIDO incluir Ultra Bestias: ${UB_LIST.join(", ")}.`);
  if (!config.includeAlola)
    prohibitions.push("PROHIBIDO incluir formas de Alola (nombre-alola).");
  if (!config.includeGalar)
    prohibitions.push("PROHIBIDO incluir formas de Galar (nombre-galar).");
  if (!config.includeHisui)
    prohibitions.push("PROHIBIDO incluir formas de Hisui (nombre-hisui).");
  if (!config.includePaldea)
    prohibitions.push("PROHIBIDO incluir formas de Paldea (nombre-paldea).");
  if (config.isLittleCup)
    prohibitions.push("FORMATO LITTLE CUP: SOLO pre-evoluciones nivel 5. Sin stones evolutivas.");

  if (prohibitions.length === 0) return "";

  return `\n⛔ PROHIBICIONES ABSOLUTAS (NUNCA IGNORAR):
${prohibitions.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
}

// ─────────────────────────────────────────────────────────────────
// BUILD MODE MODIFIERS — función principal que combina todo
// ─────────────────────────────────────────────────────────────────
export function buildModeModifiers(config: any): string {
  const metaPreferencePrompt: Record<string, string> = {
    extrememeta: "PREFERENCIA META: EXTREMADAMENTE META. Usa SOLO los Pokémon más usados y dominantes. Sin nicho, sin sorpresas.",
    meta:        "PREFERENCIA META: META. Prioriza Pokémon tier S/OU del meta competitivo actual.",
    balanced:    "PREFERENCIA META: BALANCEADO. Mezcla de Pokémon meta con algunos de nicho para sorpresa táctica.",
    varied:      "PREFERENCIA META: VARIADO. Prioriza diversidad sobre el meta. Incluye Pokémon de nicho con potencial.",
    niche:       "PREFERENCIA META: NICHO. Construye un equipo sorpresa fuera del meta. Pokémon subestimados con sinergia específica.",
  };

  const metaPrompt = metaPreferencePrompt[config.metaPreference ?? "balanced"] ?? "";

  const sections = [
    buildFormatPrompt(config),
    metaPrompt,
    buildMonotypePrompt(config),
    buildWeatherPrompt(config),
    buildTerrainPrompt(config),
    buildSpeedControlPrompt(config),
    buildArchetypePrompt(config),
    buildMechanicsPrompt(config),
    config.isRandomizer
      ? "MODO RANDOMIZER: Estrategias caóticas y sorpresivas. Prioriza diversidad y sorpresa sobre el meta."
      : "",
    config.allowLegendaries
      ? "LEGENDARIOS PERMITIDOS: Incluye 1-2 Legendarios top-tier si hay sinergia clara con el equipo."
      : "",
    config.allowParadox
      ? "PARADOJAS PERMITIDAS: Considera Pokémon Paradoja por su dominancia en el meta actual."
      : "",
    buildProhibitionsPrompt(config),
  ].filter(Boolean);

  return sections.join("\n\n");
}

// ─────────────────────────────────────────────────────────────────
// CANDIDATE STRING — formatea candidatos para el prompt
// ─────────────────────────────────────────────────────────────────
export function buildCandidateString(candidates: any[], config: any): string {
  return candidates.map(c => {
    const tier   = c.tier  || "Unranked";
    const types  = c.tipo2 ? `${c.tipo1}/${c.tipo2}` : c.tipo1;
    const usage  = c.usage_score ? `${Number(c.usage_score).toFixed(1)}%` : "—";
    const perfil = c.perfil_estrategico
      ? ` | ${String(c.perfil_estrategico).slice(0, 80)}`
      : "";
    const megaNote = config.enableMega
      ? (getMegaStone(c.nombre) ? ` [MEGA: ${getMegaStone(c.nombre)}]` : " [SIN MEGA]")
      : "";

    return `[ID: ${c.id}] ${c.nombre} (${types}) | Tier: ${tier} | Usage: ${usage}${megaNote}${perfil}`;
  }).join("\n");
}

// ─────────────────────────────────────────────────────────────────
// ITEM CLAUSE RULE
// ─────────────────────────────────────────────────────────────────
export function buildItemClauseRule(config: any): string {
  const hasItemClause = config.clauses?.some(
    (c: string) => c.toLowerCase().includes("item clause")
  );
  return hasItemClause
    ? "3. ITEM CLAUSE ACTIVA: PROHIBIDO REPETIR OBJETOS EN EL MISMO EQUIPO. Cada Pokémon debe tener un item único."
    : "3. OBJETOS: Variedad estratégica. Prioriza Eviolite y objetos exclusivos donde corresponda.";
}

// ─────────────────────────────────────────────────────────────────
// SELECTION PROMPT — primera llamada a Gemini
// ─────────────────────────────────────────────────────────────────
export function buildSelectionPrompt(
  candidatesString: string,
  lockedString: string,
  leaderName: string | null,
  leaderConstraints: string,
  slotsNeeded: number,
  config: any,
  modeModifiers: string,
  experiencePrompt: string,
  itemClauseRule: string,
  comboPrompt: string = "",
): string {
  return `
Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
${modeModifiers}
${comboPrompt ? `\n${comboPrompt}\n` : ""}
DIRECTIVA TÁCTICA: "${config.customStrategy || "Crea el equipo más sinérgico y competitivo posible"}"
NIVEL DE ANÁLISIS: ${experiencePrompt}
${leaderName ? `\nLÍDER DEL EQUIPO: ${leaderName}.${leaderConstraints}` : ""}
${lockedString ? `\nPOKÉMON FIJADOS (NO cambiar):\n${lockedString}` : ""}

CANDIDATOS DISPONIBLES (${candidatesString.split("\n").length} Pokémon):
NOTA: Pokémon marcados [SIN MEGA] NUNCA pueden tener Mega Stone.
${candidatesString}

━━━ REGLAS ESTRICTAS ━━━
1. LEGALIDAD: NUNCA inventes movimientos, habilidades o items inexistentes.
${itemClauseRule}
${ELITE_COMPETITIVE_RULES}
6. SOLO usa IDs del listado de CANDIDATOS. NUNCA inventes IDs externos.
   SELECCIONA EXACTAMENTE ${slotsNeeded} IDs DISTINTOS. PROHIBIDO REPETIR IDs.
7. RESPETA TODAS LAS PROHIBICIONES. Son absolutas e innegociables.
8. BUILDS: Para cada ID incluye item, ability, nature, moves (exactamente 4), 
   ev_hp, ev_atk, ev_def, ev_spa, ev_spd, ev_spe (suma máx 510, cada uno máx 252).

DEVUELVE SOLO JSON VÁLIDO (sin markdown, sin texto extra):
{
  "selected_ids": [123, 456, 789],
  "builds": {
    "123": {
      "item": "Choice Specs",
      "ability": "Levitate",
      "nature": "Timid",
      "moves": ["move1", "move2", "move3", "move4"],
      "ev_hp": 4, "ev_atk": 0, "ev_def": 0, "ev_spa": 252, "ev_spd": 0, "ev_spe": 252,
      "iv_atk": 0,
      "teraType": "fire"
    }
  }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────
// REPORT PROMPT PARTE 1 — análisis general (~600-900 tokens, no trunca)
// ─────────────────────────────────────────────────────────────────
export function buildReportPromptPart1(
  confirmedTeam: any[],
  buildsJson: string,
  config: any,
  modeModifiers: string,
  experiencePrompt: string,
): string {
  const teamString = confirmedTeam.map(p => {
    const types = p.tipo2 ? `${p.tipo1}/${p.tipo2}` : (p.tipo1 || "Normal");
    return `- ${p.nombre} (${types})`;
  }).join("\n");
  const allTypes = [...new Set(confirmedTeam.flatMap((p: any) => [p.tipo1, p.tipo2].filter(Boolean)))];
  const f = (config.format || "").toLowerCase();
  const isVGC     = f.includes("vgc") || f.includes("doubles");
  const isSingles = f.includes("singles") || f.includes("ou") || f.includes("smogon");

  return `Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
${modeModifiers}
NIVEL: ${experiencePrompt}

EQUIPO (${confirmedTeam.length} Pokémon):
${teamString}
TIPOS DEL EQUIPO: ${allTypes.join(", ")}

BUILDS:
${buildsJson}

REGLAS:
- SOLO los Pokémon listados. PROHIBIDO mencionar otros.
- Movimientos/items/habilidades siempre en inglés original.
${isVGC ? "- Evalúa sinergia de leads (primeros 2), spread moves y distribución de Protect." : ""}
${isSingles ? "- Evalúa hazard control (setter+remover) y pivots." : ""}

DEVUELVE SOLO JSON VÁLIDO — sin markdown, sin texto extra:
{
  "teamComposition": "Arquetipo, win condition y primeros turnos. Máx 3 frases.",
  "typesCoverage": "Tipos ofensivos cubiertos y huecos. Máx 2 frases.",
  "speedControl": "Control de velocidad y matchups clave. Máx 2 frases.",
  "synergySummary": "Sinergias clave entre los miembros. Máx 2 frases.",
  "strengths": ["Fortaleza concreta 1", "Fortaleza concreta 2", "Fortaleza concreta 3"],
  "weaknesses": ["Debilidad concreta 1 (ej: Triple debilidad Tierra)", "Debilidad 2"],
  "recommendation": "Consejo táctico final. Máx 2 frases.",
  "typeChart": {
    "teamWeaknesses":  ["Fuego x3", "Tierra x2"],
    "teamResistances": ["Normal x4", "Veneno x3"],
    "teamImmunities":  ["Eléctrico (Levitate en X)", "Tierra (Volador x2)"]
  }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────
// REPORT PROMPT PARTE 2 — análisis individual (~800-1200 tokens, no trunca)
// ─────────────────────────────────────────────────────────────────
export function buildReportPromptPart2(
  confirmedTeam: any[],
  buildsJson: string,
  config: any,
  experiencePrompt: string,
): string {
  const teamNames  = confirmedTeam.map((p: any) => p.nombre).join(", ");
  const teamString = confirmedTeam.map((p: any) => {
    const types = p.tipo2 ? `${p.tipo1}/${p.tipo2}` : (p.tipo1 || "Normal");
    return `- ${p.nombre} (${types})`;
  }).join("\n");

  return `Eres el Analista Táctico Principal de un equipo campeón mundial de Pokémon.
NIVEL: ${experiencePrompt}

EQUIPO (${confirmedTeam.length} Pokémon):
${teamString}

BUILDS:
${buildsJson}

REGLAS:
- SOLO analiza: ${teamNames}
- Counters: Pokémon/tipos concretos del meta que lo amenazan directamente.
- Threatens: tipos/Pokémon que este Pokémon puede KO con sus ataques.
- SynergyWith: SOLO compañeros DE ESTE EQUIPO. Máx 2 por Pokémon.
- Movimientos/items/habilidades en inglés. Máx 3 items por lista.

DEVUELVE SOLO JSON VÁLIDO — sin markdown, sin texto extra:
{
  "perPokemon": [
    {
      "name": "Nombre exacto como en el equipo",
      "role": "Rol: Setup Sweeper / Pivot / TR Setter / Hazard Setter / Wall / Redirector / Wallbreaker / etc.",
      "counters": [
        "Pokémon meta concreto (ej: Landorus-T con Earthquake OHKO)",
        "Tipo o core que lo neutraliza"
      ],
      "threatens": [
        "Tipo/Pokémon que puede KO con STAB principal",
        "Matchup favorable del meta"
      ],
      "synergyWith": [
        "NombreCompañero - razón de sinergia táctica",
        "NombreCompañero2 - interacción específica"
      ]
    }
  ]
}`.trim();
}

// ─────────────────────────────────────────────────────────────────
// REPORT PROMPT legacy — delega a Part1 para compatibilidad
// ─────────────────────────────────────────────────────────────────
export function buildReportPrompt(
  confirmedTeam: any[],
  buildsJson: string,
  config: any,
  modeModifiers: string,
  experiencePrompt: string,
): string {
  return buildReportPromptPart1(confirmedTeam, buildsJson, config, modeModifiers, experiencePrompt);
}

// ─────────────────────────────────────────────────────────────────
// COMBO PROMPT — informa a Gemini los combos detectados
// ─────────────────────────────────────────────────────────────────
export function buildComboPrompt(
  detectedCombos: import("@/utils/synergy-combos").SynergyCombo[],
  comboItemOverrides: Record<string, string>,
): string {
  if (detectedCombos.length === 0) return "";

  const lines: string[] = [
    "SINERGIAS DETECTADAS EN EL POOL (considera estas interacciones al armar el equipo):",
  ];

  for (const combo of detectedCombos.slice(0, 5)) {
    lines.push(`\n▶ ${combo.name} [${combo.viability}]`);
    lines.push(`  Partners clave: ${combo.pokemon.join(", ")}`);
    lines.push(`  Mecánica: ${combo.mechanic.slice(0, 150)}...`);
    lines.push(`  Items clave: ${combo.keyItems.join(", ")}`);
    lines.push(`  Moves clave: ${combo.keyMoves.join(", ")}`);
  }

  if (Object.keys(comboItemOverrides).length > 0) {
    lines.push("\nITEMS SUGERIDOS POR SINERGIA (aplica estos si usas estos Pokémon):");
    for (const [pokemon, item] of Object.entries(comboItemOverrides)) {
      lines.push(`  → ${pokemon}: ${item}`);
    }
  }

  return lines.join("\n");
}