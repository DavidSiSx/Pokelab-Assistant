/**
 * scripts/data/synergy-combos.ts
 *
 * Base de datos completa de sinergias y combos competitivos.
 * Cubre: VGC, OU, UU, Doubles OU, Rain/Sun/Sand/Snow, Trick Room, Cobblemon meta.
 *
 * Cada combo incluye:
 *  - Pokémon involucrados
 *  - Items clave
 *  - Movimientos clave
 *  - Mecánica (por qué funciona)
 *  - Resultado en batalla (qué logra)
 *  - Counters conocidos
 *  - Viabilidad y formatos
 */

export interface SynergyCombo {
  id:         string;
  name:       string;
  pokemon:    string[];    // Pokémon principales del combo
  format:     string[];    // Formatos donde se usa
  tags:       string[];    // Etiquetas: weather, trick-room, redirect, etc.
  keyItems:   string[];    // Items esenciales
  keyMoves:   string[];    // Movimientos clave
  mechanic:   string;      // Explicación mecánica de por qué funciona
  result:     string;      // Qué logra en batalla
  counters:   string[];    // Qué lo derrota
  viability:  string;      // Top Tier / High / Mid / Niche
}

export const SYNERGY_COMBOS: SynergyCombo[] = [

  // ═══════════════════════════════════════════════════════════
  // ── WEATHER: LLUVIA ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rain-pelipper-kingdra',
    name: 'Rain + Kingdra (Swift Swim)',
    pokemon: ['pelipper', 'kingdra'],
    format: ['VGC', 'OU', 'Doubles OU'],
    tags: ['weather', 'rain', 'swift-swim', 'speed-boost'],
    keyItems: ['Choice Specs', 'Life Orb', 'Damp Rock'],
    keyMoves: ['Draco Meteor', 'Surf', 'Muddy Water', 'Drizzle'],
    mechanic: 'Pelipper invoca Lluvia automáticamente con Drizzle. Kingdra con Swift Swim dobla su velocidad bajo lluvia, pasando de 85 a 170 efectivo. Water-type moves reciben STAB + boost de lluvia (x1.5), haciendo a Kingdra extremadamente difícil de sobrevivir.',
    result: 'Kingdra alcanza velocidades que superan a casi todo el meta sin necesitar Choice Scarf, mientras sus ataques de agua hacen daño masivo. En Doubles, Muddy Water golpea a ambos rivales con alta precisión bajo lluvia.',
    counters: ['Gastrodon (absorbe agua)', 'Ludicolo (también se beneficia de lluvia)', 'Toxapex (bulk extremo)', 'Ferrothorn (resiste agua/dragon)', 'Amoonguss (redirect + spore)'],
    viability: 'Top Tier',
  },

  {
    id: 'rain-pelipper-barraskewda',
    name: 'Rain + Barraskewda (Swift Swim Físico)',
    pokemon: ['pelipper', 'barraskewda'],
    format: ['VGC', 'OU'],
    tags: ['weather', 'rain', 'swift-swim', 'physical'],
    keyItems: ['Life Orb', 'Choice Band', 'Damp Rock'],
    keyMoves: ['Liquidation', 'Drill Run', 'Poison Jab', 'Close Combat'],
    mechanic: 'Barraskewda tiene 136 de ataque y 136 de velocidad base. Con Swift Swim bajo lluvia, su velocidad se convierte en 272 efectivo — más rápido que cualquier Pokémon sin boost. Liquidation bajo lluvia hace daño devastador.',
    result: 'El sweeper físico más rápido bajo lluvia del meta. Puede OHKOear a casi todo con el set correcto. Su cobertura (Drill Run, Poison Jab) le permite no ser countered por tipos resistentes al agua.',
    counters: ['Rotom-W (resiste agua, inmune a tierra)', 'Gastrodon (absorbe agua)', 'Ferrothorn (resiste todo y pone spikes)', 'Toxapex (sobrevive golpes y usa Haze)'],
    viability: 'Top Tier',
  },

  {
    id: 'rain-politoed-ludicolo',
    name: 'Rain + Ludicolo (Swift Swim Especial)',
    pokemon: ['politoed', 'ludicolo'],
    format: ['VGC', 'OU'],
    tags: ['weather', 'rain', 'swift-swim', 'special'],
    keyItems: ['Life Orb', 'Choice Specs'],
    keyMoves: ['Surf', 'Energy Ball', 'Ice Beam', 'Hydro Pump'],
    mechanic: 'Ludicolo es el único Swift Swim con STAB doble bajo lluvia (agua+planta). Swift Swim dobla velocidad. Rain boost agua x1.5. Cobertura amplísima con Energy Ball para Gastrodon y otros counters de agua.',
    result: 'Cobertura perfecta con un solo Pokémon. Grass STAB destruye los counters normales de lluvia (Gastrodon, Quagsire). En VGC funciona como pivot ofensivo impredecible.',
    counters: ['Ferrothorn (resiste agua y planta)', 'Amoonguss (redirect y espora)', 'Toxapex (bulk + recover)', 'Dragapult (velocidad + dragon)'],
    viability: 'High',
  },

  {
    id: 'rain-swampert-mega',
    name: 'Rain + Mega Swampert (Swift Swim Físico)',
    pokemon: ['politoed', 'swampert-mega'],
    format: ['OU', 'National Dex'],
    tags: ['weather', 'rain', 'swift-swim', 'mega', 'physical'],
    keyItems: ['Swampertite', 'Damp Rock'],
    keyMoves: ['Waterfall', 'Earthquake', 'Ice Punch', 'Power-Up Punch'],
    mechanic: 'Mega Swampert tiene 150 de ataque y Swift Swim. Bajo lluvia alcanza 232 de velocidad efectiva. Su STAB Tierra/Agua cubre casi todo el meta. Power-Up Punch para boost de ataque asegurado.',
    result: 'El sweeper físico bajo lluvia más poderoso en formatos National Dex. Waterfall bajo lluvia + 150 Atk hace daño brutal. Earthquake cubre eléctricos. Casi imposible de wall sin resistencias específicas.',
    counters: ['Ferrothorn', 'Toxapex', 'Tapu Koko (Electric immune a tierra no)', 'Mega Venusaur (bulk + resist agua)'],
    viability: 'Top Tier (National Dex)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── WEATHER: SOL ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'sun-torkoal-lilligant-hisui',
    name: 'After You Torkoal + Lilligant-Hisui (Chlorophyll)',
    pokemon: ['torkoal', 'lilligant-hisui'],
    format: ['VGC'],
    tags: ['weather', 'sun', 'after-you', 'trick-room-counter', 'chlorophyll', 'sleep'],
    keyItems: ['Heat Rock', 'Life Orb', 'Focus Sash'],
    keyMoves: ['After You', 'Victory Dance', 'Close Combat', 'Sleep Powder', 'Eruption'],
    mechanic: 'Torkoal invoca Sol con Drought y usa After You para que Lilligant-Hisui actúe inmediatamente. Lilligant usa Victory Dance (+1 Atk/Def/Spe) en ese turno extra. Bajo Sol, Chlorophyll dobla su velocidad ya boosteada. Desde el turno 2, Lilligant-Hisui con +1 Victory Dance y Chlorophyll es imparable. Torkoal apoya con Eruption masivo cuando tiene HP alto.',
    result: 'Combo meta-definidor de VGC 2023-2024. Lilligant-Hisui con +1 Victory Dance bajo Sol supera en velocidad a todo el meta y OHKOea con Close Combat + Glacial Lance. Torkoal apoya con Eruption que golpea a ambos rivales.',
    counters: ['Amoonguss (Rage Powder roba After You + Spore)', 'Incineroar (Fake Out interrumpe + Intimidate)', 'Roaring Moon (velocidad y Dragon STAB)', 'Tailwind equipo rival (supera velocidad)'],
    viability: 'Top Tier',
  },

  {
    id: 'sun-torkoal-venusaur',
    name: 'Sun + Venusaur (Chlorophyll Especial)',
    pokemon: ['torkoal', 'venusaur'],
    format: ['VGC', 'OU'],
    tags: ['weather', 'sun', 'chlorophyll', 'special', 'sleep'],
    keyItems: ['Heat Rock', 'Life Orb', 'Choice Specs'],
    keyMoves: ['Solar Beam', 'Sludge Bomb', 'Sleep Powder', 'Growth', 'Drought'],
    mechanic: 'Sol elimina el turno de carga de Solar Beam. Venusaur con Chlorophyll dobla velocidad. Growth bajo Sol da +2 Atk Y +2 SpA en un turno. Sludge Bomb para Fairy-types que resisten Solar Beam.',
    result: 'Venusaur con +2 Growth y Chlorophyll bajo Sol es uno de los sweepers más difíciles de detener. Solar Beam sin carga + Sludge Bomb cubre casi todo. Sleep Powder puede dormir al counter.',
    counters: ['Heatran (4x resist a fuego, inmune a Sludge Bomb)', 'Talonflame (velocidad + Brave Bird)', 'Charizard-Y (mismo clima, compite)', 'Steel-types en general'],
    viability: 'High',
  },

  {
    id: 'sun-charizard-y-excadrill',
    name: 'Mega Charizard Y + Sand Rush en Sol',
    pokemon: ['charizard-mega-y', 'excadrill'],
    format: ['OU', 'National Dex'],
    tags: ['weather', 'sun', 'mega', 'mixed-weather'],
    keyItems: ['Charizardite Y', 'Life Orb'],
    keyMoves: ['Fire Blast', 'Solar Beam', 'Air Slash', 'Drought', 'Earthquake'],
    mechanic: 'Mega Charizard Y tiene Drought permanente mientras está en campo. Fire Blast bajo sol hace daño catastrófico (SpA 159 + STAB + Sol). Solar Beam sin carga. Excadrill no tiene Sand Rush aquí pero se beneficia de la presión que ejerce Zard-Y.',
    result: 'Charizard-Y es uno de los nukes especiales más poderosos del juego. Solar Beam elimina a los counters de agua y tierra. Crea presión de switch constante.',
    counters: ['Tyranitar (cambia clima a arena)', 'Politoed (cambia clima a lluvia)', 'Stealth Rock (50% daño al entrar)', 'Heatran (resiste fuego + tierra)'],
    viability: 'Top Tier (National Dex)',
  },

  {
    id: 'sun-groudon-primal',
    name: 'Groudon Primigenio + Abusers de Sol',
    pokemon: ['groudon-primal', 'venusaur', 'blaziken', 'shiftry'],
    format: ['VGC Ubers', 'Doubles Ubers'],
    tags: ['weather', 'sun', 'primal', 'ubers', 'desolate-land'],
    keyItems: ['Red Orb', 'Life Orb', 'Focus Sash'],
    keyMoves: ['Precipice Blades', 'Fire Punch', 'Solar Beam', 'Drought', 'Desolate Land'],
    mechanic: 'Groudon Primigenio invoca Tierra Abrasadora, que NO puede ser reemplazado por Lluvia/Arena normal (solo Kyogre Primigenio puede contra-climatearlo). Moves de agua reciben -50% de poder. Sol extremo potencia fuego masivamente.',
    result: 'El setter de clima más poderoso del juego. Crea ventaja de clima prácticamente permanente en formato Ubers. Precipice Blades hace daño devastador. Todo el equipo de sol opera sin restricciones.',
    counters: ['Kyogre-Primal (único que puede cambiar el clima)', 'Calyrex-Ice (bulk + velocidad)', 'Yveltal (Dark Aura + tipo volador)'],
    viability: 'Top Tier (Ubers)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── WEATHER: ARENA ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'sand-tyranitar-garchomp-sandveil',
    name: 'Sand Veil Garchomp + Tyranitar',
    pokemon: ['tyranitar', 'garchomp'],
    format: ['VGC', 'OU', 'Doubles OU'],
    tags: ['weather', 'sand', 'evasion', 'sand-veil', 'physical'],
    keyItems: ['Smooth Rock', 'Rocky Helmet', 'Choice Scarf', 'Life Orb'],
    keyMoves: ['Earthquake', 'Scale Shot', 'Stone Edge', 'Sandstorm', 'Dragon Claw'],
    mechanic: 'Tyranitar invoca Sandstorm con Sand Stream automáticamente al entrar. Garchomp con Sand Veil tiene 20% de evasión bajo tormenta de arena. Esta evasión adicional causa que el 20% de los ataques rivales fallen estadísticamente. Garchomp además no recibe daño de arena por su tipo Tierra.',
    result: 'Core físico devastador. Garchomp ya es uno de los mejores mons del meta, y Sand Veil lo convierte en una pesadilla adicional por la posibilidad de fallar ataques. Tyranitar también apoya defensivamente con su bulk extremo y Rock STAB.',
    counters: ['Cloyster (Shell Smash + Ice Shard)', 'Weavile (Ice Shard priority)', 'Fairy-types (inmunes a Dragon)', 'Mamoswine (ice STAB prioridad)', 'Ataques de área que ignoran evasión'],
    viability: 'High',
  },

  {
    id: 'sand-tyranitar-excadrill-sandrush',
    name: 'Sand Rush Excadrill + Tyranitar',
    pokemon: ['tyranitar', 'excadrill'],
    format: ['OU', 'VGC'],
    tags: ['weather', 'sand', 'sand-rush', 'speed-boost', 'physical'],
    keyItems: ['Smooth Rock', 'Life Orb', 'Air Balloon', 'Assault Vest'],
    keyMoves: ['Earthquake', 'Iron Head', 'Rock Slide', 'Rapid Spin', 'Stealth Rock'],
    mechanic: 'Excadrill con Sand Rush dobla su velocidad bajo arena (de 88 a 176 efectivo). Recibe además boost de SpDef del 50% por su tipo Roca bajo arena. Con Life Orb, Earthquake hace daño brutal. Iron Head cubre Fairy-types. Rapid Spin limpia hazards para el equipo.',
    result: 'Core dominante en VGC 2020 y OU durante generaciones. Excadrill bajo arena es uno de los sweepers más rápidos del juego. Puede ser hazard setter, hazard remover, y sweeper al mismo tiempo.',
    counters: ['Rotom-W (levita + resiste acero)', 'Skarmory (volador + acero)', 'Landorus-T (Intimidate + volador)', 'Politoed (cambia clima a lluvia)'],
    viability: 'Top Tier',
  },

  {
    id: 'sand-hippowdon-excadrill',
    name: 'Sand Rush Excadrill + Hippowdon',
    pokemon: ['hippowdon', 'excadrill'],
    format: ['OU'],
    tags: ['weather', 'sand', 'sand-rush', 'hazards', 'physical'],
    keyItems: ['Smooth Rock', 'Leftovers', 'Life Orb'],
    keyMoves: ['Earthquake', 'Stealth Rock', 'Whirlwind', 'Slack Off', 'Iron Head'],
    mechanic: 'Hippowdon es más bulky que Tyranitar y tiene acceso a Slack Off para recuperación. Sand Stream permanente (8 turnos con Smooth Rock). Excadrill actúa como su compañero natural con Sand Rush.',
    result: 'Core defensivo-ofensivo. Hippowdon stalls, recupera con Slack Off, pone Stealth Rock y fazes con Whirlwind. Excadrill barre cuando el rival está debilitado. Sinergia defensiva además: Excadrill cubre debilidades de Hippo.',
    counters: ['Ferrothorn (resiste todo y pone hazards)', 'Skarmory (volador inmune a tierra)', 'Tapu Bulu (Grassy Surge reduce Earthquake)'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── WEATHER: NIEVE/GRANIZO ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'snow-ninetales-alola-flutter-mane',
    name: 'Alolan Ninetales + Flutter Mane (Blizzard Spam)',
    pokemon: ['ninetales-alola', 'flutter-mane'],
    format: ['VGC', 'OU'],
    tags: ['weather', 'snow', 'blizzard', 'aurora-veil', 'special'],
    keyItems: ['Icy Rock', 'Life Orb', 'Choice Specs', 'Light Clay'],
    keyMoves: ['Blizzard', 'Aurora Veil', 'Moonblast', 'Shadow Ball', 'Dazzling Gleam'],
    mechanic: 'Ninetales-Alola invoca Nieve con Snow Warning. Bajo Nieve, Blizzard tiene 100% de precisión. Aurora Veil solo se puede colocar bajo Nieve/Granizo, reduciendo daño físico y especial en 50% para el equipo. Flutter Mane tiene 135 de SpA y SpE — con Specs y boost de Nieve/viento es un nuke.',
    result: 'Ninetales establece Aurora Veil + Nieve dando setup defensivo. Flutter Mane aprovecha Blizzard preciso y su velocidad extrema para arrasar. Moonblast para Dragon-types. Shadow Ball cobertura. Casi imposible de walled si se maneja bien.',
    counters: ['Heatran (inmune a hielo, resiste fairy)', 'Incineroar (Fake Out + Intimidate interrumpe)', 'Roaring Moon (velocidad + Dragon STAB)', 'Tyranitar (cancela clima con Arena + Rock hits fuerte)'],
    viability: 'Top Tier',
  },

  {
    id: 'snow-abomasnow-arctozolt',
    name: 'Hail + Arctozolt (Slush Rush)',
    pokemon: ['abomasnow', 'arctozolt'],
    format: ['OU', 'UU'],
    tags: ['weather', 'snow', 'slush-rush', 'speed-boost', 'electric'],
    keyItems: ['Life Orb', 'Choice Band'],
    keyMoves: ['Bolt Beak', 'Blizzard', 'Low Kick', 'Ancient Power'],
    mechanic: 'Arctozolt con Slush Rush dobla velocidad bajo Granizo/Nieve. Bolt Beak tiene 170 de poder base si Arctozolt actúa primero (lo cual hace casi siempre con Slush Rush). Blizzard preciso bajo nieve para cobertura.',
    result: 'Arctozolt con Slush Rush convierte Bolt Beak en el move más poderoso del juego (efectivamente). Daño catastrófico a cualquier cosa que no resista Eléctrico+Hielo.',
    counters: ['Ground-types (inmunes a Bolt Beak)', 'Heatran (4x resist + inmune a hielo)', 'Rotom-H (inmune a eléctrico)'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── VGC: REDIRECCIÓN ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'vgc-indeedee-f-psychic-surge',
    name: 'Indeedee-F + Psychic Seed abuser',
    pokemon: ['indeedee-f', 'urshifu-single-strike', 'flutter-mane', 'hatterene'],
    format: ['VGC'],
    tags: ['terrain', 'psychic-terrain', 'redirection', 'follow-me', 'seed'],
    keyItems: ['Psychic Seed', 'Focus Sash', 'Choice Scarf'],
    keyMoves: ['Follow Me', 'Helping Hand', 'Expanding Force', 'Psychic Terrain'],
    mechanic: 'Indeedee-F tiene Psychic Surge como habilidad, invocando Psychic Terrain automáticamente. Psychic Terrain: (1) bloquea moves de prioridad (Fake Out, Sucker Punch, etc.) en Pokémon en el suelo, (2) boost 30% a moves Psíquicos. Un compañero con Psychic Seed recibe +1 SpDef gratis al activarse el terrain. Follow Me de Indeedee redirige ataques hacia ella mientras el compañero hace setup o ataca.',
    result: 'Indeedee-F crea un escudo protector de dos capas: Follow Me absorbe ataques y Psychic Terrain bloquea prioridad. El compañero opera sin amenaza de Fake Out ni priority. Expanding Force bajo Terrain golpea a ambos rivales. Usado extensivamente en VGC Worlds.',
    counters: ['Incineroar aéreo (Fake Out en turno 1 antes del terrain)', 'Amoonguss (Rage Powder compite con Follow Me + Spore)', 'Ghost-types (inmunes a Expanding Force)', 'Tapu Koko/Bulu (cambia terrain)'],
    viability: 'Top Tier',
  },

  {
    id: 'vgc-sneasler-indeedee-psychic-seed',
    name: 'Sneasler + Indeedee-F (Psychic Seed + Unburden)',
    pokemon: ['sneasler', 'indeedee-f'],
    format: ['VGC'],
    tags: ['terrain', 'psychic-terrain', 'unburden', 'speed-boost', 'redirection'],
    keyItems: ['Psychic Seed', 'Focus Sash'],
    keyMoves: ['Follow Me', 'Close Combat', 'Dire Claw', 'Poison Touch', 'Helping Hand'],
    mechanic: 'Sneasler equipa Psychic Seed. Al activarse Psychic Terrain de Indeedee-F, consume el Psychic Seed automáticamente, activando Unburden (+2 velocidad al consumir item). Sneasler pasa de 130 de velocidad a 260 efectivo — el más rápido del meta. Psychic Terrain bloquea moves de prioridad (Fake Out, Sucker Punch) para proteger a Sneasler. Dire Claw 100% de probabilidad de infligir veneno/parálisis/sueño.',
    result: 'Sneasler con Unburden activado supera a CUALQUIER Pokémon del meta en velocidad. Dire Claw hace daño y casi garantiza un status. Close Combat elimina Steel-types. Follow Me de Indeedee lo protege mientras configura. Combo que dominó VGC 2023.',
    counters: ['Amoonguss (Rage Powder + Spore antes de que ataque)', 'Ghost-types (Shadowless a Close Combat)', 'Dondozo + Tatsugiri (Order Up cambia tipo)', 'Chien-Pao (más rápido si Sneasler no tiene Unburden)'],
    viability: 'Top Tier',
  },

  {
    id: 'vgc-amoonguss-redirect',
    name: 'Amoonguss Rage Powder + attacker',
    pokemon: ['amoonguss', 'flutter-mane', 'urshifu', 'kingambit'],
    format: ['VGC'],
    tags: ['redirection', 'rage-powder', 'spore', 'support'],
    keyItems: ['Rocky Helmet', 'Black Sludge', 'Sitrus Berry'],
    keyMoves: ['Rage Powder', 'Spore', 'Pollen Puff', 'Clear Smog'],
    mechanic: 'Rage Powder redirige TODOS los ataques dirigibles hacia Amoonguss. Esto protege al compañero ofensivo completamente por un turno. Amoonguss es Grass/Poison, inmune a Powder moves (Spore rival, Sleep Powder, etc.). Puede usar Spore para dormir a uno de los rivales mientras su compañero ataca libremente al otro.',
    result: 'El redirector más versátil del VGC. Un turno de Rage Powder permite al compañero atacar sin interrupciones. Spore al rival más peligroso. Pollen Puff cura al compañero. Usado en casi todos los equipos de alto nivel.',
    counters: ['Grass-types (inmunes a Rage Powder... wait, inmunes a Spore pero no a Rage Powder)', 'Overcoat ability (inmune a Spore)', 'Safety Goggles item (inmune a Spore y Rage Powder)', 'Ataques de área que no se pueden redirigir (Discharge, Earthquake compañero)'],
    viability: 'Top Tier',
  },

  {
    id: 'vgc-incineroar-fake-out',
    name: 'Incineroar Fake Out + Intimidate Support',
    pokemon: ['incineroar', 'flutter-mane', 'kingambit', 'urshifu'],
    format: ['VGC'],
    tags: ['fake-out', 'intimidate', 'support', 'pivot'],
    keyItems: ['Assault Vest', 'Sitrus Berry', 'Lum Berry'],
    keyMoves: ['Fake Out', 'Parting Shot', 'Flare Blitz', 'Darkest Lariat'],
    mechanic: 'Fake Out causa flinch garantizado en turno 1 (actúa con prioridad +3, pero solo el primer turno en campo). Incineroar usa Intimidate al entrar, reduciendo el ataque de ambos rivales. Parting Shot reduce Atk Y SpA del objetivo mientras Incineroar hace switch. Puede usarse múltiples veces con U-turn/Parting Shot cicling.',
    result: 'Incineroar es el Pokémon más usado en la historia del VGC por esta razón: aporta Fake Out (control de turno), Intimidate (reducción masiva de daño físico) y Parting Shot (reducción adicional). Permite al compañero actuar libremente el primer turno.',
    counters: ['Inner Focus (inmune a flinch)', 'Prankster Taunt', 'Oblivious (inmune a Parting Shot)', 'Ghosts (Fake Out no los afecta... wait, Fake Out afecta a todos excepto si tienen Inner Focus)'],
    viability: 'Top Tier',
  },

  {
    id: 'vgc-dondozo-tatsugiri',
    name: 'Dondozo + Tatsugiri (Commander)',
    pokemon: ['dondozo', 'tatsugiri'],
    format: ['VGC'],
    tags: ['commander', 'stat-boost', 'unique-mechanic', 'dominant'],
    keyItems: ['Sitrus Berry', 'Leftovers', 'Lum Berry', 'Choice Band'],
    keyMoves: ['Order Up', 'Wave Crash', 'Earthquake', 'Protect', 'Commander'],
    mechanic: 'Si Tatsugiri está en campo con Dondozo, usa Commander: Tatsugiri ENTRA DENTRO de Dondozo. Dondozo recibe +2 en TODOS sus stats (Atk, Def, SpA, SpD, Spe). Tatsugiri desde adentro usa Order Up que puede cambiar el tipo de stat boost dependiendo de la forma de Tatsugiri. Dondozo actúa solo con stats masivamente boosteados.',
    result: 'Dondozo con +2 en todo es prácticamente imparable. Wave Crash con +2 Atk hace daño devastador. El equipo rival necesita usar TWO atacantes solo en Dondozo mientras el compañero del equipo atacante actúa libremente. Dominó VGC 2023.',
    counters: ['Urshifu-R (Surging Strikes ignora Unaware y tiene prioridad? No, pero golpea 3 veces)', 'Taunt (evita Protect)', 'Encore (fuerza a repetir moves)', 'Super efectivos (Water y Grass desde el lado rival)'],
    viability: 'Top Tier',
  },

  {
    id: 'vgc-flutter-mane-ursaluna-blood-moon',
    name: 'Flutter Mane + Ursaluna-Blood Moon',
    pokemon: ['flutter-mane', 'ursaluna-bloodmoon'],
    format: ['VGC'],
    tags: ['paradox', 'special', 'speed', 'coverage'],
    keyItems: ['Choice Specs', 'Booster Energy', 'Life Orb'],
    keyMoves: ['Shadow Ball', 'Moonblast', 'Dazzling Gleam', 'Blood Moon', 'Hyper Voice'],
    mechanic: 'Flutter Mane con Booster Energy o Protosynthesis (bajo sol) boost SpA o Spe a extremos. Ursaluna-BM con Blood Moon (único usuario) que tiene 140 BP pero no se puede usar dos turnos seguidos, forzando variedad. Juntos cubren prácticamente todo el meta: Ghost/Fairy + Normal.',
    result: 'Core de paradoja especial que cubre casi todo el meta. Flutter Mane maneja amenazas rápidas, Ursaluna-BM elimina Pokémon que resisten Fairy/Ghost. Blood Moon hace daño masivo incluso a Steel-types resistentes.',
    counters: ['Incineroar (Fake Out en Flutter Mane + Darkest Lariat en Ursaluna)', 'Kingambit (Steel STAB + Supreme Overlord)', 'Heatran (resiste ambos STAB principales)'],
    viability: 'Top Tier',
  },

  // ═══════════════════════════════════════════════════════════
  // ── TRICK ROOM ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'trick-room-indeedee-hatterene',
    name: 'Trick Room Indeedee-F + Hatterene',
    pokemon: ['indeedee-f', 'hatterene'],
    format: ['VGC'],
    tags: ['trick-room', 'psychic-terrain', 'setup', 'slow-abuser'],
    keyItems: ['Focus Sash', 'Babiri Berry', 'Mental Herb'],
    keyMoves: ['Trick Room', 'Follow Me', 'Expanding Force', 'Magic Powder', 'Heal Pulse'],
    mechanic: 'Hatterene tiene 8 de velocidad base — uno de los más lentos del juego. Con Trick Room activo, actúa PRIMERO. Psychic Terrain de Indeedee previene que Hatterene sea afectada por moves de prioridad (Fake Out, Sucker Punch) mientras setea TR. Indeedee usa Follow Me para proteger a Hatterene mientras setea. Hatterene con Expanding Force bajo Terrain golpea a AMBOS rivales.',
    result: 'El dueto de Trick Room más sinérgico del VGC. Indeedee protege el setup y provee terrain. Hatterene es imparable bajo Trick Room. Expanding Force bajo Terrain hace daño masivo a ambos rivales. Usado en altos niveles de competencia mundial.',
    counters: ['Taunt (previene Trick Room antes del setup)', 'Encore (fuerza move inútil)', 'Imprison + Trick Room (bloquea el move)', 'Ataques inmediatos de máximo daño si se llega antes'],
    viability: 'Top Tier',
  },

  {
    id: 'trick-room-torkoal-stalwart',
    name: 'Trick Room Sun con Torkoal',
    pokemon: ['torkoal', 'hatterene', 'venusaur', 'porygon2'],
    format: ['VGC'],
    tags: ['trick-room', 'weather', 'sun', 'slow-abuser'],
    keyItems: ['Heat Rock', 'Eviolite', 'Life Orb'],
    keyMoves: ['Trick Room', 'Eruption', 'Solar Beam', 'Recover'],
    mechanic: 'Torkoal tiene 20 de velocidad — uno de los más lentos. Bajo Trick Room actúa primero. Eruption con HP máximo hace daño masivo (150 BP base cuando HP lleno) + Sol boost + STAB = move devastador. Porygon2 con Eviolite setea Trick Room de forma bulky.',
    result: 'Torkoal bajo Trick Room convierte su lentitud extrema en ventaja. Eruption a full HP bajo Sol hace daño a ambos rivales. Equipo dual de clima+TR que cambia la velocidad del juego completamente.',
    counters: ['Urshifu-RS (Surging Strikes golpea fuerte)', 'Rock-types (4x resist a Eruption no, pero Rock moves hacen 4x a Torkoal)', 'Ataques de Roca (Torkoal 4x débil)'],
    viability: 'High',
  },

  {
    id: 'trick-room-stakataka-oranguru',
    name: 'Trick Room Stakataka + Oranguru',
    pokemon: ['stakataka', 'oranguru'],
    format: ['VGC', 'Doubles OU'],
    tags: ['trick-room', 'beast-boost', 'slow-abuser', 'instruct'],
    keyItems: ['Choice Band', 'Weakness Policy', 'Mental Herb'],
    keyMoves: ['Trick Room', 'Gyro Ball', 'Rock Slide', 'Instruct', 'Skill Swap'],
    mechanic: 'Stakataka tiene 13 de velocidad — extremadamente lento. Con Trick Room actúa primero. Gyro Ball hace más daño cuanto menor es la velocidad del usuario: Stakataka hace daño máximo con Gyro Ball (120 BP efectivo contra Pokémon rápidos). Beast Boost: al KOear algo, Stakataka sube su stat más alto (Defensa → tanque indestructible). Oranguru puede usar Instruct para hacer que Stakataka repita su último move en el mismo turno.',
    result: 'Stakataka bajo TR usa Gyro Ball que hace daño masivo por su baja velocidad, luego Oranguru lo hace repetir con Instruct, efectivamente atacando DOS VECES en un turno. Beast Boost acumula defensas para volverlo indestructible.',
    counters: ['Fire-types (4x débil a fuego)', 'Fighting-types (4x débil a lucha)', 'Taunt (previene TR)', 'Faster Taunt antes del TR setup'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── OU SINGLES: CORES CLÁSICOS ──────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'ou-magnezone-trap-steel',
    name: 'Magnezone Magnet Pull (Steel Trap)',
    pokemon: ['magnezone', 'volcarona', 'scizor', 'kartana'],
    format: ['OU'],
    tags: ['magnet-pull', 'trapping', 'setup', 'singles'],
    keyItems: ['Choice Scarf', 'Air Balloon', 'Leftovers'],
    keyMoves: ['Thunderbolt', 'Flash Cannon', 'Hidden Power Fire', 'Volt Switch'],
    mechanic: 'Magnezone con Magnet Pull IMPIDE que Pokémon de tipo Acero huyan o hagan switch. Scizor, Ferrothorn, Skarmory, Corviknight — todos quedan atrapados y eliminados por Hidden Power Fire o moves eléctricos. Una vez eliminados los Steel-types, los compañeros de Magnezone que son contrados por Steel (Volcarona, etc.) barren libremente.',
    result: 'Magnezone elimina quirúrgicamente los counters Steel del compañero. Volcarona sin Heatran/Ferrothorn/Scizor en el equipo rival barre absolutamente. Este core ganó múltiples torneos de alto nivel.',
    counters: ['Heatran (resiste Flash Cannon y HP Fire, inmune a fuego)', 'Tyranitar (no es Steel pero puede eliminar a Magnezone)', 'Magnezone sin HP Fire queda sin opciones contra algunos Steel'],
    viability: 'Top Tier (OU)',
  },

  {
    id: 'ou-volcarona-quiver-dance',
    name: 'Volcarona Quiver Dance + Future Sight Support',
    pokemon: ['volcarona', 'slowking-galar', 'hatterene'],
    format: ['OU'],
    tags: ['setup', 'quiver-dance', 'future-sight', 'special', 'singles'],
    keyItems: ['Leftovers', 'Lum Berry', 'Heavy-Duty Boots'],
    keyMoves: ['Quiver Dance', 'Fire Blast', 'Bug Buzz', 'Giga Drain', 'Future Sight'],
    mechanic: 'Slowking-Galar usa Future Sight (ataque psíquico que impacta 2 turnos después). Si el rival hace switch para counters a Volcarona, el nuevo Pokémon recibe Future Sight. Si no hace switch, Volcarona setea Quiver Dance. El rival está en dilema: quedarse y recibir Quiver Dance setup, o switchear y recibir Future Sight + ataque de Volcarona.',
    result: 'Future Sight crea presión dual que prácticamente fuerza al rival a tomar pérdidas. Volcarona con +1 o +2 Quiver Dance y SpDef+Spe es extremadamente difícil de matar. Giga Drain para agua/tierra que countera Volcarona.',
    counters: ['Heatran (resiste fuego y Bug, puede usar Earth Power)', 'Blissey/Chansey (bulk especial extremo)', 'Terapagos (bulk + Terastal)'],
    viability: 'Top Tier (OU)',
  },

  {
    id: 'ou-rillaboom-grassy-glide',
    name: 'Rillaboom Grassy Surge + Grassy Glide Priority',
    pokemon: ['rillaboom', 'urshifu-single', 'kartana'],
    format: ['OU', 'VGC'],
    tags: ['terrain', 'grassy-terrain', 'priority', 'physical', 'singles'],
    keyItems: ['Choice Band', 'Assault Vest', 'Life Orb'],
    keyMoves: ['Grassy Glide', 'Wood Hammer', 'U-turn', 'Knock Off', 'Grassy Terrain'],
    mechanic: 'Rillaboom invoca Grassy Terrain con Grassy Surge. Grassy Glide tiene prioridad +1 SOLO bajo Grassy Terrain. Con Choice Band, Grassy Glide de Rillaboom hace daño masivo con prioridad — superando a Sucker Punch y actuando antes que prácticamente todo. Terrain también cura 1/16 HP cada turno a Pokémon en el suelo.',
    result: 'Rillaboom con Choice Band y Grassy Glide funciona como un priority finisher poderoso. No necesita ser el más rápido del campo. Terrain adicional hace switch más costoso para el rival (reciben curación) y reduce el poder de Earthquake en 50%.',
    counters: ['Flying-types y Levitate (inmunes a Grassy Glide)', 'Steel-types (resisten Grassy Glide)', 'Urshifu-R (Surging Strikes atraviesa)', 'Fire-types en general'],
    viability: 'Top Tier (OU)',
  },

  {
    id: 'ou-banded-pursuit-trap',
    name: 'Pursuit Trap + Setup Sweeper',
    pokemon: ['tyranitar', 'bisharp', 'weavile'],
    format: ['OU', 'UU', 'National Dex'],
    tags: ['pursuit', 'trapping', 'singles', 'removal'],
    keyItems: ['Choice Band', 'Life Orb'],
    keyMoves: ['Pursuit', 'Crunch', 'Stone Edge', 'Ice Punch'],
    mechanic: 'Pursuit hace el doble de daño si el objetivo hace switch al turno que se usa. Pokémon como Latios, Gengar, Alakazam — normalmente counters de muchos sweepers — son eliminados si intentan switchear por el daño masivo de Pursuit. El sweeper compañero puede actuar sin sus counters Psíquicos/Fantasma.',
    result: 'Eliminación quirúrgica de Pokémon que normalmente son intocables por su velocidad o habilidad de switchear. Clears the path para sweepers que no pueden manejar Psychic/Ghost types.',
    counters: ['Resistencias a Dark (Fighting, Fairy, Steel)', 'Pokémon que NO necesitan switchear (tanques)'],
    viability: 'High (National Dex)',
  },

  {
    id: 'ou-dugtrio-arena-trap',
    name: 'Dugtrio Arena Trap (Trapper)',
    pokemon: ['dugtrio', 'volcarona', 'bisharp', 'blissey'],
    format: ['OU', 'National Dex'],
    tags: ['arena-trap', 'trapping', 'singles', 'removal'],
    keyItems: ['Focus Sash', 'Choice Band'],
    keyMoves: ['Earthquake', 'Stone Edge', 'Sucker Punch', 'Final Gambit'],
    mechanic: 'Dugtrio con Arena Trap atrapa a Pokémon en el suelo sin vuelo/levitación. Se usa para eliminar Pokémon específicos que countan al equipo: Heatran (Ground weakness + Arena Trap), Toxapex (Sucker Punch), etc. Final Gambit sacrifica a Dugtrio para hacer daño igual a su HP.',
    result: 'Dugtrio puede eliminar amenazas críticas que de otra forma serían insuperables. Heatran atrapado + Earthquake es eliminación garantizada. Permite a los compañeros barrer sin el counter más problemático.',
    counters: ['Flying-types (inmunes a Arena Trap)', 'Levitate (inmune a Arena Trap y Earthquake)', 'Balloon item (temporal)', 'Pokémon con mucha bulk que sobreviven Earthquake'],
    viability: 'High (National Dex)',
  },

  {
    id: 'ou-rotom-w-pivot',
    name: 'Rotom-W Volt Switch Pivot Core',
    pokemon: ['rotom-wash', 'landorus-therian', 'garchomp'],
    format: ['OU'],
    tags: ['pivot', 'volt-switch', 'momentum', 'singles', 'defensive'],
    keyItems: ['Leftovers', 'Choice Scarf', 'Safety Goggles'],
    keyMoves: ['Volt Switch', 'Hydro Pump', 'Will-O-Wisp', 'Pain Split', 'Defog'],
    mechanic: 'Rotom-W es inmune a tierra y eléctrico (Levitate). Landorus-T es inmune a eléctrico. Garchomp es inmune a eléctrico. El "VoltTurn" crea momentum: Rotom usa Volt Switch para cambiar mientras daña. El nuevo Pokémon que entra es favorable. Repite indefinidamente manteniendo momentum y control del juego.',
    result: 'Core de momentum que domina OU hace generaciones. Rotom-W nunca es una "muerte gratuita" — siempre genera ventaja con Volt Switch, quema con Will-O-Wisp, o lanza Hydro Pump masivo. Control total del ritmo del juego.',
    counters: ['Ground-types que también cubren agua (Swampert)', 'Grass-types (resisten agua)', 'Pokémon con Trace/Turboblaze (ignoran Levitate)'],
    viability: 'Top Tier (OU)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── TAILWIND ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'tailwind-whimsicott-attacker',
    name: 'Whimsicott Tailwind + Fast Attacker',
    pokemon: ['whimsicott', 'flutter-mane', 'urshifu'],
    format: ['VGC', 'Doubles OU'],
    tags: ['tailwind', 'prankster', 'speed-control', 'support'],
    keyItems: ['Focus Sash', 'Mental Herb', 'Eject Button'],
    keyMoves: ['Tailwind', 'Encore', 'Taunt', 'Moonblast', 'Beat Up'],
    mechanic: 'Whimsicott tiene Prankster: moves de estado (Tailwind, Encore, Taunt) ganan prioridad +1. Tailwind con prioridad dobla la velocidad del equipo ANTES de que el rival actúe. Esto permite que los compañeros actúen "primero" incluso en el turno que se setea Tailwind. Encore con Prankster fuerza al rival a repetir un move inútil.',
    result: 'Tailwind con prioridad cambia completamente el orden de velocidad. Rivales más rápidos que el equipo quedan superados. 4 turnos de velocidad doble son suficientes para barrer equipos enteros. Encore neutraliza setups del rival.',
    counters: ['Dark-types (Prankster no funciona en Dark-types)', 'Taunt rival (si es más rápido)', 'Priority attacks que ignoran Tailwind (siguen con prioridad)'],
    viability: 'Top Tier (VGC)',
  },

  {
    id: 'tailwind-tornadus-attacker',
    name: 'Tornadus Tailwind + Rain Core',
    pokemon: ['tornadus', 'pelipper', 'barraskewda'],
    format: ['VGC', 'OU'],
    tags: ['tailwind', 'weather', 'rain', 'speed-control'],
    keyItems: ['Focus Sash', 'Damp Rock'],
    keyMoves: ['Tailwind', 'Hurricane', 'Rain Dance', 'Bleakwind Storm'],
    mechanic: 'Tornadus setea Tailwind para velocidad del equipo. Hurricane bajo Lluvia tiene 100% de precisión (normalmente 70%). Bleakwind Storm es el move más poderoso de Tornadus con 100 BP. Puede usarse en lluvia como setter secundario o independiente.',
    result: 'Tornadus aporta control de velocidad Y potencia ofensiva. Hurricane bajo lluvia preciso es devastador. Sinergia perfecta con equipo de lluvia — dobla la velocidad mientras Pelipper mantiene la lluvia.',
    counters: ['Rock-types (4x débil a Roca)', 'Electric-types fuera de lluvia', 'Ice-types (4x débil a Hielo)'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── TERRAIN SETTERS ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'electric-terrain-tapu-koko',
    name: 'Tapu Koko Electric Terrain + Pincurchin',
    pokemon: ['tapu-koko', 'zeraora', 'raichu-alola', 'pincurchin'],
    format: ['VGC', 'OU'],
    tags: ['terrain', 'electric-terrain', 'speed-boost', 'special'],
    keyItems: ['Electric Seed', 'Life Orb', 'Choice Specs'],
    keyMoves: ['Thunderbolt', 'Dazzling Gleam', 'Volt Switch', 'Rising Voltage'],
    mechanic: 'Electric Terrain boost ataques eléctricos en 30%. Rising Voltage hace el DOBLE de daño bajo Electric Terrain (120 BP x2 = 240 BP efectivo en Pokémon en el suelo). Un compañero con Electric Seed recibe +1 Defensa gratis al activarse el terrain. Zeraora con Volt Absorb es inmune a eléctrico pero se beneficia del terrain para sus propios ataques.',
    result: 'Rising Voltage bajo Electric Terrain es uno de los moves más poderosos del juego. Casi cualquier Pokémon no resistente recibe KO con este setup. Electric Seed da defensa gratis para el compañero.',
    counters: ['Ground-types (inmunes a eléctrico)', 'Tapu Bulu (cambia terrain a Grassy)', 'Pokémon con alta SpDef como Blissey'],
    viability: 'High',
  },

  {
    id: 'misty-terrain-tapu-fini',
    name: 'Tapu Fini Misty Terrain + Dragon Abusers',
    pokemon: ['tapu-fini', 'kommo-o', 'hydreigon'],
    format: ['VGC', 'OU'],
    tags: ['terrain', 'misty-terrain', 'status-immunity', 'dragon'],
    keyItems: ['Leftovers', 'Assault Vest', 'Choice Specs'],
    keyMoves: ['Moonblast', 'Nature\'s Madness', 'Muddy Water', 'Misty Terrain'],
    mechanic: 'Misty Terrain previene status conditions (veneno, parálisis, sueño, etc.) en Pokémon en el suelo. Dragon-types reciben 50% de daño de ataques Dragon bajo Misty Terrain. Compañeros como Kommo-o pueden usar Clangorous Soul sin miedo a status.',
    result: 'Inmunidad total a status para el equipo. Dragons sobreviven ataques Dragon gracias al terrain. Tapu Fini es extremadamente bulky y difícil de matar. Core muy sólido para equipos que temen status.',
    counters: ['Steel-types (resisten Fairy + bloquean status de todas formas)', 'Tapu Koko/Bulu (cambia terrain)', 'Poison types (resisten Moonblast)'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── HELPING HAND COMBOS ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'helping-hand-regieleki-spread',
    name: 'Regieleki Helping Hand + Spread Move',
    pokemon: ['regieleki', 'kyogre', 'zacian'],
    format: ['VGC Ubers', 'Doubles Ubers'],
    tags: ['helping-hand', 'damage-boost', 'ubers', 'support'],
    keyItems: ['Choice Scarf', 'Light Clay', 'Focus Sash'],
    keyMoves: ['Helping Hand', 'Electroweb', 'Thunder Cage', 'Rapid Spin'],
    mechanic: 'Regieleki es el Pokémon más rápido del juego (200 Spe base). Con 200 Spe puede usar Helping Hand ANTES que cualquier rival, dando +50% de daño al compañero en ese turno. Kyogre bajo lluvia con Helping Hand hace daño absolutamente catastrófico. Electroweb baja la velocidad de AMBOS rivales.',
    result: 'Regieleki convierte a Kyogre/Zacian en máquinas de KO inmediato con Helping Hand. Electroweb da control de velocidad. El 200 Spe garantiza que Helping Hand siempre va primero.',
    counters: ['Ground-types (inmunes a Electroweb)', 'Calyrex-Shadow (más rápido o igual en velocidad)', 'Incineroar (Fake Out en Regieleki turno 1)'],
    viability: 'Top Tier (Ubers)',
  },

  {
    id: 'helping-hand-normal-attacker',
    name: 'Helping Hand + Boomburst/Hyper Voice',
    pokemon: ['oranguru', 'exploud', 'sylveon', 'meowstic'],
    format: ['VGC', 'Doubles OU'],
    tags: ['helping-hand', 'sound-move', 'spread', 'special'],
    keyItems: ['Choice Specs', 'Throat Spray', 'Life Orb'],
    keyMoves: ['Helping Hand', 'Boomburst', 'Hyper Voice', 'Instruct'],
    mechanic: 'Boomburst tiene 140 BP y golpea a AMBOS rivales (spread move). Con Helping Hand, Boomburst de Exploud hace daño equivalente a ~210 BP a ambos rivales. Instruct de Oranguru puede hacer que el atacante use Boomburst DOS VECES en un turno.',
    result: 'Daño de área masivo. Un Boomburst potenciado con Helping Hand puede eliminar a ambos rivales simultáneamente. Instruct para doble ataque en el mismo turno.',
    counters: ['Steel-types (resisten Normal)', 'Ghost-types (inmunes a Normal)', 'Soundproof ability (inmune a moves de sonido)'],
    viability: 'Mid',
  },

  // ═══════════════════════════════════════════════════════════
  // ── BEAT UP COMBOS ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'beat-up-justified-terrakion',
    name: 'Beat Up + Justified (Terrakion/Cobalion)',
    pokemon: ['whimsicott', 'terrakion', 'cobalion'],
    format: ['VGC', 'Doubles OU'],
    tags: ['beat-up', 'justified', 'stat-boost', 'setup'],
    keyItems: ['Life Orb', 'Choice Band', 'Lum Berry'],
    keyMoves: ['Beat Up', 'Close Combat', 'Rock Slide', 'Swords Dance'],
    mechanic: 'Beat Up golpea múltiples veces (una por cada miembro del equipo sin fainted/status). Cada golpe de Beat Up activa Justified del objetivo, dando +1 de Ataque por cada hit. Con 4-6 miembros sanos en el equipo, Terrakion recibe +4 a +6 Ataque en un turno. Luego Close Combat con +4/+5/+6 Ataque hace daño absolutamente devastador.',
    result: 'Terrakion con +6 Ataque y Close Combat OHKOea a prácticamente todo lo que no es Ghost. El setup ocurre en un solo turno con Beat Up de Whimsicott. Uno de los combos más explosivos del VGC de generaciones pasadas.',
    counters: ['Ghost-types (inmunes a Close Combat)', 'Flying-types (inmunes a Close Combat y Beat Up)', 'Protect (bloquea Beat Up ese turno)', 'Priority attacks si Terrakion no actúa primero'],
    viability: 'High (aunque situacional)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── CORES DE GENERACIONES PASADAS (NATIONAL DEX / COBBLEMON) ─
  // ═══════════════════════════════════════════════════════════

  {
    id: 'national-skarmory-blissey',
    name: 'SkarmBliss (Skarmory + Blissey)',
    pokemon: ['skarmory', 'blissey'],
    format: ['OU', 'National Dex', 'Cobblemon'],
    tags: ['stall', 'defensive-core', 'hazards', 'singles', 'classic'],
    keyItems: ['Leftovers', 'Rocky Helmet', 'Shed Shell'],
    keyMoves: ['Stealth Rock', 'Spikes', 'Whirlwind', 'Soft-Boiled', 'Seismic Toss'],
    mechanic: 'Skarmory cubre debilidades físicas de Blissey (Fighting, Ground) con su resistencia y volador. Blissey cubre debilidades especiales de Skarmory. Juntos tienen resistencia/inmunidad/HP para sobrevivir casi cualquier ataque. Skarmory pone Stealth Rock + Spikes para daño de entrada, Whirlwind para forzar switches. Blissey cura con Soft-Boiled y hace daño consistente con Seismic Toss.',
    result: 'El core defensivo más famoso de la historia del juego. Virtualmente inrompible sin un Magnezone para trapar a Skarmory o moves de lucha potentes. Definió el meta de generaciones 2-4 y sigue siendo relevante en National Dex.',
    counters: ['Magnezone (trapa a Skarmory con Magnet Pull)', 'Taunt (previene hazards y cura)', 'Heracross/Fighting-types con Guts (neutralizan a Blissey)', 'Serperior (Leaf Storm neutraliza a Skarmory)'],
    viability: 'Top Tier (National Dex)',
  },

  {
    id: 'national-sun-ninetales-venusaur-mega',
    name: 'Sun + Mega Venusaur (Chlorophyll + Thick Fat)',
    pokemon: ['ninetales', 'venusaur-mega'],
    format: ['OU', 'National Dex', 'Cobblemon'],
    tags: ['weather', 'sun', 'chlorophyll', 'mega', 'bulk', 'classic'],
    keyItems: ['Venusaurite', 'Heat Rock'],
    keyMoves: ['Solar Beam', 'Sludge Bomb', 'Synthesis', 'Sleep Powder', 'Growth'],
    mechanic: 'Mega Venusaur tiene Thick Fat, que reduce el daño de Fuego e Hielo en 50%. Bajo Sol, sus debilidades de Fuego e Hielo quedan reducidas significativamente. Chlorophyll dobla su velocidad. Synthesis cura el 75% del HP bajo Sol. Growth da +2 SpA Y +2 Atk bajo Sol. Solar Beam sin carga. Sludge Bomb para Fairy/Grass.',
    result: 'Mega Venusaur es prácticamente imposible de matar bajo Sol. Synthesis lo mantiene siempre vivo. Con +2 Growth, Solar Beam y Sludge Bomb de OHKO a casi todo. Sleep Powder para el counter más problemático.',
    counters: ['Heatran (resiste todo menos Earth Power)', 'Latias/Latios (velocidad + Psyshock)', 'Poison-types que resisten Sludge Bomb'],
    viability: 'Top Tier (National Dex)',
  },

  {
    id: 'cobblemon-stall-chansey-core',
    name: 'Chansey Eviolite Stall Core',
    pokemon: ['chansey', 'ferrothorn', 'toxapex'],
    format: ['OU', 'Cobblemon', 'National Dex'],
    tags: ['stall', 'eviolite', 'hazards', 'toxic-stall', 'singles'],
    keyItems: ['Eviolite', 'Leftovers', 'Black Sludge', 'Rocky Helmet'],
    keyMoves: ['Stealth Rock', 'Spikes', 'Toxic', 'Soft-Boiled', 'Seismic Toss', 'Recover'],
    mechanic: 'Chansey con Eviolite tiene más bulk efectivo que Blissey en algunos casos. Ferrothorn pone Spikes + Stealth Rock con Iron Barbs (daño contacto). Toxapex regenera HP con Regenerator y puede curar status aliados. Toxic + residual daño de hazards + Recover infinita.',
    result: 'Core de stall casi indestructible. Chansey aguanta prácticamente todo lo especial. Ferrothorn aguanta físico. Toxapex es el pivot defensivo perfecto. En Cobblemon donde no hay todos los counters del meta moderno, este core es especialmente poderoso.',
    counters: ['Taunt (previene hazards y Recover)', 'Mold Breaker (ignora Iron Barbs)', 'Haze/Clear Smog (resetea Toxic buildup)', 'Setup sweepers una vez eliminado Toxapex'],
    viability: 'Top Tier (Cobblemon/National Dex)',
  },

  {
    id: 'cobblemon-sand-excadrill-core',
    name: 'Sand Core Cobblemon (Tyranitar + Excadrill)',
    pokemon: ['tyranitar', 'excadrill', 'garchomp'],
    format: ['Cobblemon', 'OU', 'National Dex'],
    tags: ['weather', 'sand', 'sand-rush', 'hazards', 'cobblemon'],
    keyItems: ['Smooth Rock', 'Life Orb', 'Choice Scarf'],
    keyMoves: ['Stealth Rock', 'Crunch', 'Earthquake', 'Iron Head', 'Rapid Spin'],
    mechanic: 'En Cobblemon, la arena de Tyranitar es especialmente efectiva porque muchos Pokémon populares en ese meta son débiles a ella o no tienen counters inmediatos. Excadrill con Sand Rush barre equipos enteros. Garchomp es un complemento natural — inmune a arena, Ground/Dragon STAB.',
    result: 'En el meta de Cobblemon donde el equipo rival raramente tiene los counters perfectos de OU moderno, este core es devastador. Tyranitar-Excadrill-Garchomp cubre sus propias debilidades entre sí y mantiene presión constante.',
    counters: ['Skarmory (inmune a tierra)', 'Politoed (cancela arena)', 'Water-types bulky'],
    viability: 'Top Tier (Cobblemon)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── COMBOS DE HABILIDADES ÚNICAS ────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'innards-out-pyukumuku',
    name: 'Innards Out Pyukumuku (Anti-Sweep)',
    pokemon: ['pyukumuku', 'mimikyu', 'shedinja'],
    format: ['OU', 'UU', 'Cobblemon'],
    tags: ['innards-out', 'anti-sweep', 'support', 'sacrifice'],
    keyItems: ['Custap Berry', 'Leftovers'],
    keyMoves: ['Recover', 'Counter', 'Mirror Coat', 'Toxic'],
    mechanic: 'Innards Out (Pyukumuku): cuando Pyukumuku es KOeado, el Pokémon que lo mató recibe daño igual al HP que tenía Pyukumuku antes del golpe final. Si Pyukumuku tiene 300 HP y es KOeado, el atacante recibe 300 de daño. Combinado con Recover para mantenerse vivo, Counter y Mirror Coat para castigar ataques.',
    result: 'Pyukumuku puede eliminar a Pokémon que normalmente son inmatables. Un sweeper que KOea a Pyukumuku desde alto HP a menudo muere también. Actúa como "bomba de sacrificio" que destruye la amenaza más peligrosa del equipo rival.',
    counters: ['Pokémon que KOean desde lejos (ataques de área, hazards)', 'Status (envenenado Pyukumuku lo debilita gradualmente)', 'Ghost-types (Counter y Mirror Coat no les afecta)'],
    viability: 'Niche',
  },

  {
    id: 'perish-song-trap',
    name: 'Perish Song + Mean Look Trap',
    pokemon: ['mismagius', 'gengar', 'politoed', 'lapras'],
    format: ['OU', 'UU', 'Cobblemon'],
    tags: ['perish-song', 'trapping', 'mean-look', 'stall'],
    keyItems: ['Leftovers', 'Focus Sash'],
    keyMoves: ['Perish Song', 'Mean Look', 'Shadow Ball', 'Protect'],
    mechanic: 'Mean Look previene al objetivo de hacer switch. Perish Song causa que todos en campo sean KOeados después de 3 turnos. Con ambos usados, el rival no puede escapar y muere en 3 turnos. Shadow Tag (Wobbuffet/Gothitelle) hace esto automáticamente sin Mean Look.',
    result: 'Eliminación garantizada de cualquier Pokémon en 3 turnos sin posibilidad de escape. El usuario puede hacer switch después de activar Perish Song (el counter continúa en ambos). Permite eliminar tanques imposibles de matar por daño.',
    counters: ['Ghost-types (pueden escapar de Mean Look)', 'Pokémon con Soundproof (inmunes a Perish Song)', 'Baton Pass (transfiere status pero escapa del trap)', 'Whirlwind/Roar (fuerza switch del trapper)'],
    viability: 'Niche',
  },

  {
    id: 'simple-beam-belly-drum',
    name: 'Simple Beam + Belly Drum',
    pokemon: ['swoobat', 'linoone', 'azumarill'],
    format: ['OU', 'UU'],
    tags: ['simple', 'belly-drum', 'setup', 'singles'],
    keyItems: ['Salac Berry', 'Sitrus Berry', 'Normalium Z'],
    keyMoves: ['Simple Beam', 'Belly Drum', 'Extreme Speed', 'Aqua Jet'],
    mechanic: 'Simple duplica el efecto de todos los cambios de stat. Belly Drum normalmente da +6 Atk (máximo) a costa de la mitad del HP. Con Simple, Belly Drum daría +12 Atk (pero está cappado en +6). Sin embargo, Simple + Swords Dance da +4 en lugar de +2. El truco real: Simple Beam transforma la habilidad del rival en Simple antes de que use Belly Drum.',
    result: 'Setup extremo de Ataque. Azumarill con Belly Drum + Aqua Jet (prioridad) elimina equipos enteros. Salac Berry se activa cuando HP baja por Belly Drum, dando boost de velocidad adicional.',
    counters: ['Haze (resetea todos los boosts)', 'Priority attacks potentes antes del sweep', 'Pokémon bulky que sobreviven Aqua Jet'],
    viability: 'Niche (pero Top Tier cuando funciona)',
  },

  {
    id: 'speed-boost-blaziken-protect',
    name: 'Blaziken Speed Boost (Protect cada turno)',
    pokemon: ['blaziken', 'blaziken-mega'],
    format: ['OU', 'National Dex', 'Cobblemon'],
    tags: ['speed-boost', 'setup', 'protect', 'singles', 'banned'],
    keyItems: ['Life Orb', 'Blazikenite'],
    keyMoves: ['Protect', 'High Jump Kick', 'Flare Blitz', 'Swords Dance', 'Low Kick'],
    mechanic: 'Speed Boost da +1 Spe al final de cada turno. Protect en turno 1 = +1 Spe gratis. Turno 2: ya tiene +1 Spe y puede atacar. Mega Blaziken puede además Swords Dance mientras Speed Boost acumula. Con +2 SD y +3 Speed Boost, es imparable. High Jump Kick con 150 BP hace daño masivo.',
    result: 'Blaziken está Baneado en OU por esta razón. En National Dex Ubers/AG es una amenaza máxima. Cada turno que pasa Blaziken se vuelve más difícil de superar. High Jump Kick + Flare Blitz con STAB cubre casi todo.',
    counters: ['Ghost-types (HJK falla y hace 50% al usuario)', 'Faster Pokémon en turno 1 antes del boost', 'Priority attacks masivos (Extreme Speed de Arceus)'],
    viability: 'Banned en OU / Top Tier en Ubers',
  },

  // ═══════════════════════════════════════════════════════════
  // ── COMBOS DE ABILITIES ESPECIALES ──────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'parental-bond-kangaskhan-mega',
    name: 'Parental Bond Mega Kangaskhan',
    pokemon: ['kangaskhan-mega'],
    format: ['VGC (baneado)', 'National Dex', 'Cobblemon'],
    tags: ['parental-bond', 'double-hit', 'mega', 'physical', 'banned'],
    keyItems: ['Kangaskhanite'],
    keyMoves: ['Return', 'Sucker Punch', 'Earthquake', 'Power-Up Punch', 'Fake Out'],
    mechanic: 'Parental Bond hace que cada move ataque DOS VECES. El segundo hit hace 25% (o 50% en gens anteriores) del daño del primero. Efectivamente multiplica el daño total significativamente. Power-Up Punch activa Parental Bond → dos hits → +2 Ataque en un turno. Fake Out también hace doble flinch.',
    result: 'Mega Kangaskhan fue baneado del VGC por ser demasiado poderosa. En National Dex, sigue siendo una de las mejores atacantes físicas. Fake Out doble es devastador. Power-Up Punch da +2 Ataque garantizado.',
    counters: ['Ghosts (muchos moves no les afectan)', 'Rocky Helmet (doble daño por contacto doble)', 'Intimidate (reduce el poder físico masivamente)'],
    viability: 'Banned VGC / Top Tier National Dex',
  },

  {
    id: 'protean-greninja',
    name: 'Protean Greninja (cambio de tipo)',
    pokemon: ['greninja', 'greninja-ash'],
    format: ['OU', 'National Dex', 'Cobblemon'],
    tags: ['protean', 'type-change', 'coverage', 'special', 'singles'],
    keyItems: ['Life Orb', 'Choice Specs'],
    keyMoves: ['Hydro Pump', 'Dark Pulse', 'Ice Beam', 'Gunk Shot', 'U-turn', 'Spikes'],
    mechanic: 'Protean cambia el tipo de Greninja al tipo del move que va a usar, ANTES de usarlo. Esto significa que CADA move de Greninja recibe STAB (x1.5). Ice Beam recibe STAB. Gunk Shot recibe STAB. Dark Pulse recibe STAB. Con Life Orb, cada move hace daño de un atacante especializado en ese tipo.',
    result: 'Greninja efectivamente tiene cobertura infinita con STAB en todo. No existe un Pokémon que resista todos sus tipos al mismo tiempo. Con Life Orb, puede OHKOear o 2HKOear a casi cualquier cosa con el move correcto. Definió el meta de ORAS.',
    counters: ['Azumarill (Huge Power + bulk + Fairy STAB)', 'Chansey/Blissey (HP masivo)', 'AV Pokémon bulky con alta SpDef'],
    viability: 'Top Tier (National Dex)',
  },

  {
    id: 'wonder-guard-shedinja',
    name: 'Shedinja Wonder Guard + Baton Pass',
    pokemon: ['shedinja', 'ninjask', 'smeargle'],
    format: ['Cobblemon', 'National Dex AG'],
    tags: ['wonder-guard', 'baton-pass', 'immune', 'singles', 'niche'],
    keyItems: ['Lum Berry', 'Focus Sash'],
    keyMoves: ['Shadow Sneak', 'Baton Pass', 'Speed Boost', 'Swords Dance'],
    mechanic: 'Wonder Guard: Shedinja solo puede ser dañado por moves Super Efectivos contra Bug/Ghost (Fuego, Volador, Roca, Fantasma, Oscuro). Con el equipo correcto eliminando esas amenazas, Shedinja es literalmente inmortal — 1HP que no puede bajar. Ninjask pasa Speed Boost via Baton Pass, Shedinja con alta velocidad actúa primero y es inmortal.',
    result: 'En ciertos matchups específicos, Shedinja gana solo. Si el rival no tiene ninguno de los 5 tipos súper efectivos, Shedinja no puede recibir daño. Core de AG extremadamente situacional pero impresionante cuando funciona.',
    counters: ['Cualquier Fire/Flying/Rock/Ghost/Dark move', 'Status (Toxic, Will-O-Wisp, Thunder Wave — Shedinja puede ser statused)', 'Stealth Rock (elimina 50% de HP = muerto)', 'Sandstorm/Hail (daño de residual)'],
    viability: 'Niche (AG solamente viable)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── COMBOS DE DOUBLES OU ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'doubles-discharge-partner-ground',
    name: 'Discharge Spam + Ground Partner',
    pokemon: ['zapdos', 'rotom-wash', 'raichu'],
    format: ['Doubles OU', 'VGC'],
    tags: ['discharge', 'spread-electric', 'ground-immunity', 'doubles'],
    keyItems: ['Life Orb', 'Choice Specs'],
    keyMoves: ['Discharge', 'Earthquake', 'Bulldoze', 'Heat Wave'],
    mechanic: 'Discharge golpea a AMBOS targets en Doubles con 30% de parálisis. Si el compañero es tipo Tierra o tiene Levitate, es inmune a Discharge. Esto permite spamear Discharge sin dañar al compañero. El compañero Ground usa Earthquake también libremente (el usuario de Discharge es inmune si tiene Levitate o es volador).',
    result: 'Parálisis del 30% en ambos rivales cada turno. Daño consistente de área. Si el rival no tiene Ground-types, Discharge libre es devastador. 30% parálisis acumulado cada turno eventualmente paraliza algo crítico.',
    counters: ['Ground-types (inmunes a Discharge)', 'Electric-types (inmunes o resisten)', 'Lightning Rod/Motor Drive (absorben el Discharge)'],
    viability: 'High (Doubles)',
  },

  {
    id: 'doubles-trick-room-reuniclus',
    name: 'Reuniclus Trick Room + Slow Abusers',
    pokemon: ['reuniclus', 'conkeldurr', 'rhyperior', 'snorlax'],
    format: ['VGC', 'Doubles OU'],
    tags: ['trick-room', 'magic-guard', 'setup', 'slow-abuser'],
    keyItems: ['Life Orb', 'Assault Vest', 'Figy Berry'],
    keyMoves: ['Trick Room', 'Psychic', 'Focus Blast', 'Drain Punch'],
    mechanic: 'Reuniclus con Magic Guard: no recibe daño de Life Orb, hazards, burn, poison — solo daño directo. Puede usar Life Orb sin costo de HP. Con Trick Room activo, Reuniclus (35 Spe) actúa primero. Conkeldurr (45 Spe) con Guts + Flame Orb bajo TR actúa antes que el rival.',
    result: 'Reuniclus es el setter de TR más bulky del juego. Magic Guard le da sustentabilidad. Conkeldurr bajo TR con Guts (+50% Atk por burn) hace daño devastador. Core de Trick Room clásico de Doubles.',
    counters: ['Taunt (previene TR)', 'Dark-types (para Reuniclus)', 'Fast Taunt antes del setup', 'Priority moves que ignoran TR (siguen siendo priority)'],
    viability: 'High',
  },

  // ═══════════════════════════════════════════════════════════
  // ── COMBOS DE GENERACIÓN 9 (SCARLET/VIOLET) ─────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'gen9-flutter-mane-protosynthesis',
    name: 'Flutter Mane Protosynthesis (Sol/Booster Energy)',
    pokemon: ['flutter-mane', 'torkoal', 'ninetales-alola'],
    format: ['VGC', 'OU'],
    tags: ['paradox', 'protosynthesis', 'sun', 'booster-energy', 'special'],
    keyItems: ['Booster Energy', 'Life Orb', 'Choice Specs'],
    keyMoves: ['Shadow Ball', 'Moonblast', 'Psyshock', 'Dazzling Gleam'],
    mechanic: 'Protosynthesis (Flutter Mane): bajo Sol o con Booster Energy, boost el stat más alto. Flutter Mane tiene SpA=135 y Spe=135 — boost en cualquiera es masivo. Con Booster Energy, sin necesidad de Sol. Shadow Ball + Moonblast cubre prácticamente todo el meta. 135 SpA con boost llega a niveles de Legendary.',
    result: 'Flutter Mane con Protosynthesis es uno de los nukes especiales más poderosos del meta de Gen 9. SpA o Spe al máximo boost sin necesitar setup. Moonblast para Dragons. Shadow Ball para Psychic/Ghost. Prácticamente imposible de wall sin resist específica.',
    counters: ['Incineroar (Fake Out + Intimidate + resiste Moonblast no, pero bulk)', 'Kingambit (Steel + Supreme Overlord)', 'Heatran (resiste Moonblast, inmune... no, pero bulk de Fairy Torch)', 'Iron Hands (bulk extremo)'],
    viability: 'Top Tier (Gen 9)',
  },

  {
    id: 'gen9-kingambit-supreme-overlord',
    name: 'Kingambit Supreme Overlord Sweep',
    pokemon: ['kingambit'],
    format: ['VGC', 'OU'],
    tags: ['supreme-overlord', 'swords-dance', 'physical', 'late-game', 'gen9'],
    keyItems: ['Black Glasses', 'Life Orb', 'Lum Berry'],
    keyMoves: ['Kowtow Cleave', 'Iron Head', 'Sucker Punch', 'Swords Dance'],
    mechanic: 'Supreme Overlord: Kingambit gana +10% de Atk por cada aliado fainted. Con 5 aliados fainted = +50% Atk base. Kombinado con Swords Dance (+2 Atk) al final del juego, Kingambit tiene stats de ataque absolutamente masivos. Kowtow Cleave nunca falla y tiene STAB Oscuro. Sucker Punch con prioridad.',
    result: 'El mejor late-game cleaner de Gen 9. Entra cuando el equipo está debilitado, tiene +50% Atk extra de Supreme Overlord, usa Swords Dance y barre lo que queda. Kowtow Cleave sin miss es seguro. Iron Head para Fairy-types.',
    counters: ['Fighting-types 4x (Kingambit débil x4 a Lucha)', 'Ground-types (4x débil a Tierra)', 'Prioridad de Fighting antes de que Kingambit ataque'],
    viability: 'Top Tier (Gen 9)',
  },

  {
    id: 'gen9-annihilape-rage-fist',
    name: 'Annihilape Rage Fist Stack',
    pokemon: ['annihilape'],
    format: ['VGC', 'OU'],
    tags: ['rage-fist', 'stacking', 'ghost', 'physical', 'gen9'],
    keyItems: ['Choice Band', 'Sitrus Berry', 'Assault Vest'],
    keyMoves: ['Rage Fist', 'Close Combat', 'Shadow Claw', 'Bulk Up'],
    mechanic: 'Rage Fist empieza con 50 BP y gana +50 BP por cada vez que Annihilape recibió daño en la batalla (acumulativo, no solo ese turno). Si Annihilape fue golpeado 5 veces en la batalla, Rage Fist tiene 300 BP — el move más poderoso del juego. Ghost-type no puede ser bloqueado por Normal/Fighting.',
    result: 'En batallas largas o con uso deliberado de recibir golpes, Rage Fist se convierte en el move más devastador del juego. Con Choice Band y stacks altos, 300+ BP no tiene wall práctica. Close Combat para Steel-types que resisten Ghost.',
    counters: ['Normal-types... wait, Ghost no les afecta a ellos', 'Dark-types (inmunes a Ghost — Rage Fist no les afecta)', 'Priority antes de que Annihilape acumule stacks'],
    viability: 'Top Tier (Gen 9)',
  },

  {
    id: 'gen9-chien-pao-swords-dance',
    name: 'Chien-Pao Swords Dance Sweep',
    pokemon: ['chien-pao'],
    format: ['VGC', 'OU'],
    tags: ['sword-of-ruin', 'swords-dance', 'physical', 'priority', 'gen9'],
    keyItems: ['Focus Sash', 'Life Orb'],
    keyMoves: ['Swords Dance', 'Icicle Crash', 'Sacred Sword', 'Ice Shard', 'Sucker Punch'],
    mechanic: 'Sword of Ruin (habilidad): reduce la Defensa de todos los rivales en campo en 25%. Icicle Crash tiene 30% de flinch. Ice Shard prioridad para rematar. Sacred Sword ignora aumentos de Defensa del rival. Con Swords Dance +2, Chien-Pao OHKOea prácticamente a todo el meta.',
    result: 'Chien-Pao es uno de los sweepers físicos más poderosos de Gen 9. Sword of Ruin hace que incluso Pokémon bulky reciban más daño. +2 Swords Dance + Icicle Crash elimina la mayoría del meta. Ice Shard para rematar a sobrevivientes.',
    counters: ['Steel-types (resisten Hielo)', 'Fire-types (resisten Hielo)', 'Incineroar (Intimidate reduce el daño)', 'Pokémon más rápidos antes del Swords Dance'],
    viability: 'Top Tier (Gen 9)',
  },

  // ═══════════════════════════════════════════════════════════
  // ── COMBOS COBBLEMON ESPECÍFICOS ────────────────────────────
  // ═══════════════════════════════════════════════════════════

  {
    id: 'cobblemon-sun-core-classic',
    name: 'Sun Core Clásico Cobblemon',
    pokemon: ['charizard', 'venusaur', 'ninetales'],
    format: ['Cobblemon'],
    tags: ['weather', 'sun', 'chlorophyll', 'fire-boost', 'cobblemon'],
    keyItems: ['Charizardite Y', 'Life Orb', 'Heat Rock'],
    keyMoves: ['Solar Beam', 'Fire Blast', 'Growth', 'Sleep Powder'],
    mechanic: 'En Cobblemon, los starters de Kanto son muy comunes. Charizard-Y invoca Sol permanente. Venusaur con Chlorophyll dobla velocidad. Fire Blast de Charizard bajo Sol hace daño devastador. Solar Beam de Venusaur sin carga. Equipo temático que funciona muy bien en el meta de Cobblemon donde no todos tienen los counters óptimos.',
    result: 'En Cobblemon donde muchos jugadores usan equipos no optimizados, Sun Core clásico barre muy fácilmente. Charizard-Y es una de las amenazas más obvias pero efectivas. Venusaur apoya con Sleep Powder y Solar Beam.',
    counters: ['Tyranitar (cancela clima)', 'Politoed (cancela clima)', 'Rock moves a Charizard (4x)'],
    viability: 'Top Tier (Cobblemon)',
  },

  {
    id: 'cobblemon-rain-vgc-style',
    name: 'Rain VGC Style en Cobblemon',
    pokemon: ['pelipper', 'kingdra', 'ludicolo', 'swampert'],
    format: ['Cobblemon'],
    tags: ['weather', 'rain', 'cobblemon', 'doubles'],
    keyItems: ['Damp Rock', 'Life Orb', 'Choice Specs'],
    keyMoves: ['Drizzle', 'Muddy Water', 'Draco Meteor', 'Surf'],
    mechanic: 'En Cobblemon en modo Doubles, lluvia VGC funciona igual que en el meta oficial pero con menos counters presentes. Pelipper es accesible fácilmente en el mundo de Cobblemon. Kingdra es un Pokémon raro que muchos rivales no esperan.',
    result: 'Core de lluvia que supera a la mayoría de oponentes en Cobblemon Doubles. Pocos jugadores en Cobblemon tienen los counters óptimos preparados. Efectividad muy alta en el contexto del juego.',
    counters: ['Gastrodon (Storm Drain absorbe agua)', 'Electric-types bulky', 'Grass-types que resisten agua'],
    viability: 'Top Tier (Cobblemon Doubles)',
  },

  {
    id: 'cobblemon-pseudo-legendary-core',
    name: 'Pseudo-Legendary Core Cobblemon',
    pokemon: ['dragonite', 'garchomp', 'tyranitar', 'salamence', 'hydreigon', 'goodra'],
    format: ['Cobblemon'],
    tags: ['pseudo-legendary', 'cobblemon', 'high-bst', 'dragons'],
    keyItems: ['Life Orb', 'Choice Band', 'Choice Scarf'],
    keyMoves: ['Outrage', 'Dragon Claw', 'Earthquake', 'Stone Edge', 'Fire Blast'],
    mechanic: 'En Cobblemon, los pseudo-legendarios son los Pokémon más poderosos accesibles. Un equipo construido alrededor de ellos (Dragonite, Garchomp, Tyranitar) domina la mayoría de encounters PvP en servidores de Cobblemon. Todos tienen BST ≥600 y movepool extenso.',
    result: 'El "team de pseudos" es el equipo más confiable para PvP en Cobblemon. Alta BST garantiza ventaja estadística contra equipos no optimizados. Cobertura amplia y coverage moves para casi cualquier amenaza.',
    counters: ['Fairy-types (inmunes a Dragon y hacen 2x)', 'Ice-types (4x a Dragon/Flying)', 'Steel-types (resisten Dragon)'],
    viability: 'Top Tier (Cobblemon PvP)',
  },

];

/**
 * Obtiene todos los combos donde participa un Pokémon dado.
 * La búsqueda es flexible: busca por nombre normalizado.
 */
export function getCombosForPokemon(nombre: string): SynergyCombo[] {
  const normalized = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  return SYNERGY_COMBOS.filter(combo =>
    combo.pokemon.some(p => {
      const pNorm = p.toLowerCase().replace(/[^a-z0-9]/g, '');
      return pNorm === normalized ||
             pNorm.startsWith(normalized) ||
             normalized.startsWith(pNorm);
    })
  );
}

/**
 * Formatea los combos de un Pokémon como texto para el embedding.
 */
export function formatCombosForEmbedding(combos: SynergyCombo[]): string {
  if (combos.length === 0) return '';

  const lines: string[] = [
    `SYNERGY_COMBOS (${combos.length} combos conocidos):`,
  ];

  for (const combo of combos) {
    lines.push(`\n  [${combo.format.join('/')}] ${combo.name} (${combo.viability})`);
    lines.push(`    Partners: ${combo.pokemon.join(', ')}`);
    lines.push(`    Tags: ${combo.tags.join(', ')}`);
    if (combo.keyItems.length > 0)
      lines.push(`    Key Items: ${combo.keyItems.join(', ')}`);
    if (combo.keyMoves.length > 0)
      lines.push(`    Key Moves: ${combo.keyMoves.join(', ')}`);
    lines.push(`    Mechanic: ${combo.mechanic}`);
    lines.push(`    Result: ${combo.result}`);
    if (combo.counters.length > 0)
      lines.push(`    Counters: ${combo.counters.join(', ')}`);
  }

  return lines.join('\n');
}