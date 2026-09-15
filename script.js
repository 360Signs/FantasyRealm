(() => {
  "use strict";

  const screenRoot = document.getElementById("screenRoot");
  const saveButton = document.getElementById("saveButton");
  const menuButton = document.getElementById("menuButton");
  const brandButton = document.getElementById("brandButton");
  const saveStatus = document.getElementById("saveStatus");

  const SAVE_KEY = "realmsAndRuinV1";
  const DRAFT_KEY = "realmsAndRuinDraftV1";

  const RACES = {
    Human: { desc: "Adaptable and ambitious. +1 to every core stat.", bonus: { str:1, dex:1, con:1, int:1, wis:1, cha:1 } },
    Elf: { desc: "Graceful, long-lived and magically sensitive. +2 DEX, +2 INT.", bonus: { dex:2, int:2 } },
    Dwarf: { desc: "Hardy, disciplined and difficult to kill. +2 STR, +2 CON.", bonus: { str:2, con:2 } },
    Orc: { desc: "Powerful and intimidating. +3 STR, +1 CON.", bonus: { str:3, con:1 } },
    "Half-Elf": { desc: "Versatile and socially adept. +1 DEX, +1 INT, +2 CHA.", bonus: { dex:1, int:1, cha:2 } },
    Tiefling: { desc: "Touched by old magic. +2 INT, +2 CHA.", bonus: { int:2, cha:2 } }
  };

  const BACKGROUNDS = {
    Peasant: { desc: "Raised among farms, workshops and village disputes.", gold: 12, items: ["Worn cloak", "Utility knife", "Bread x2"], skill: "Survival" },
    Noble: { desc: "Born into privilege, obligations and political enemies.", gold: 70, items: ["Fine clothes", "Signet ring", "Steel dagger"], skill: "Persuasion" },
    Soldier: { desc: "Drilled for battle and accustomed to command.", gold: 28, items: ["Iron sword", "Leather coat", "Rations x3"], skill: "Swordsmanship" },
    Hunter: { desc: "A tracker familiar with forests and dangerous beasts.", gold: 19, items: ["Hunting bow", "Arrows x20", "Skinning knife"], skill: "Archery" },
    Criminal: { desc: "A survivor of alleys, fences and people best avoided.", gold: 32, items: ["Lockpicks", "Hooded cloak", "Dagger"], skill: "Stealth" },
    Scholar: { desc: "Educated in history, languages and forgotten lore.", gold: 22, items: ["Field journal", "Ink & quill", "Old map"], skill: "Lore" },
    "Apprentice Mage": { desc: "Trained in the safest fragments of dangerous arts.", gold: 16, items: ["Ashwood focus", "Spell notes", "Minor mana draught"], skill: "Arcana" },
    Mercenary: { desc: "You fought for coin before causes.", gold: 40, items: ["Short sword", "Buckler", "Repair kit"], skill: "Tactics" }
  };

  const CLASSES = {
    Warrior: { desc: "Front-line fighter with strong martial growth.", hp: 22, skill: "Power Strike" },
    Ranger: { desc: "Mobile hunter skilled at ranged combat and tracking.", hp: 14, skill: "Quick Shot" },
    Rogue: { desc: "Fast, opportunistic and dangerous from the shadows.", hp: 12, skill: "Cheap Shot" },
    Mage: { desc: "Fragile early, but capable of powerful arcane growth.", hp: 8, skill: "Arcane Bolt" },
    "Spellblade": { desc: "A balanced mixture of steel and sorcery.", hp: 15, skill: "Runic Slash" },
    Diplomat: { desc: "Excels at influence, negotiation and social leverage.", hp: 10, skill: "Silver Tongue" }
  };

  const ALL_SKILLS = [
    "Swordsmanship","Archery","Stealth","Arcana","Survival","Persuasion","Lore","Tactics",
    "Alchemy","Smithing","Healing","Lockpicking","Athletics","Acrobatics","Horsemanship","Leadership",
    "Trading","Hunting","Tracking","Dual Wielding","Two-Handed Weapons","Shield Mastery","Fire Magic",
    "Frost Magic","Lightning Magic","Restoration","Illusion","Necromancy","Enchanting","Cooking","Fishing",
    "Sailing","Beast Taming","Herbalism","Mining","Thievery","Investigation","Intimidation","Diplomacy"
  ];

  const CUSTOM = "__custom__";

  function getRaceData(c=draft.character) {
    if (c.race === CUSTOM) {
      const name = (c.customRace?.name || "Custom Race").trim();
      const desc = (c.customRace?.desc || "").trim() || `A custom fantasy race called ${name}. Use common fantasy knowledge for this race unless the player's description overrides it.`;
      return { name, desc, bonus: {...(c.customRace?.bonus || {})}, custom: true };
    }
    const data = RACES[c.race] || RACES.Human;
    return { name: c.race || "Human", desc: data.desc, bonus: {...data.bonus}, custom: false };
  }

  function getBackgroundData(c=draft.character) {
    if (c.background === CUSTOM) {
      const name = (c.customBackground?.name || "Custom Background").trim();
      return {
        name,
        desc: (c.customBackground?.desc || "").trim() || `A custom life background called ${name}.`,
        gold: Math.max(0, Number(c.customBackground?.gold) || 0),
        items: Array.isArray(c.customBackground?.items) ? c.customBackground.items.filter(Boolean) : [],
        skill: (c.customBackground?.skill || "").trim(),
        custom: true
      };
    }
    const data = BACKGROUNDS[c.background] || BACKGROUNDS.Peasant;
    return { name: c.background || "Peasant", ...data, custom: false };
  }

  function getClassData(c=draft.character) {
    if (c.className === CUSTOM) {
      const name = (c.customClass?.name || "Custom Class").trim();
      return {
        name,
        desc: (c.customClass?.desc || "").trim() || `A custom adventuring class called ${name}.`,
        hp: Math.max(0, Math.min(200, Number(c.customClass?.hp) || 0)),
        skill: (c.customClass?.skill || "Focused Strike").trim(),
        custom: true
      };
    }
    const data = CLASSES[c.className] || CLASSES.Warrior;
    return { name: c.className || "Warrior", ...data, custom: false };
  }

  function skillList(c=draft.character) {
    const merged = [...(c.startingSkills || []), ...(c.customSkills || [])]
      .map(x => String(x).trim())
      .filter(Boolean);
    return [...new Set(merged)];
  }

  const STAT_INFO = {
    str: ["Strength", "Damage & physical feats"],
    dex: ["Dexterity", "Speed, aim & stealth"],
    con: ["Constitution", "Health & endurance"],
    int: ["Intelligence", "Magic & knowledge"],
    wis: ["Wisdom", "Awareness & judgement"],
    cha: ["Charisma", "Influence & leadership"]
  };


  const BODY_PARTS = ["head","torso","left arm","right arm","left leg","right leg"];
  const SEVERABLE = ["left arm","right arm","left leg","right leg"];

  function bodyPartPenalty(part, injuries) {
    return injuries.some(i => i.part === part && ["severe","severed"].includes(i.severity)) ? 1 : 0;
  }

  function hasSevereInjury(part) {
    return (state.character.injuries || []).some(i => i.part === part && ["severe","severed"].includes(i.severity));
  }

  function actionBlockedByInjury(kind) {
    if (kind === "flee" && hasSevereInjury("left leg") && hasSevereInjury("right leg")) return "Both legs are unusable.";
    if (kind === "flee" && (hasSevereInjury("left leg") || hasSevereInjury("right leg"))) return "Your injured leg makes fleeing much harder.";
    if (kind === "power" && hasSevereInjury("right arm") && hasSevereInjury("left arm")) return "Both arms are unusable.";
    return null;
  }

  function applyInjury(part, severity, cause) {
    state.character.injuries ||= [];
    const existing = state.character.injuries.find(i => i.part === part);
    if (existing) {
      const rank = {minor:1,severe:2,severed:3};
      if ((rank[severity] || 0) >= (rank[existing.severity] || 0)) existing.severity = severity;
      existing.cause = cause;
    } else {
      state.character.injuries.push({part, severity, cause, day: state.world.day});
    }
  }

  function describeInjuries() {
    const list = state.character.injuries || [];
    if (!list.length) return "No injuries";
    return list.map(i => `${titleCase(i.part)} — ${titleCase(i.severity)}`).join(", ");
  }

  const WORLD_PREFIX = ["Ael", "Bran", "Caer", "Dra", "Eld", "Fyr", "Glen", "High", "Ivor", "Khar", "Lorn", "Mor", "Nor", "Ost", "Raven", "Storm", "Thorn", "Val", "West", "Yar"];
  const WORLD_SUFFIX = ["ador", "ath", "dor", "en", "eria", "fall", "gard", "helm", "ia", "mere", "or", "reach", "ryn", "spire", "vale", "wyn"];

  const KINGDOM_FIRST = ["Alder", "Ash", "Black", "Bright", "Cinder", "Crow", "Dawn", "Dragon", "Eagle", "Elder", "Ember", "Frost", "Gold", "Grey", "Iron", "Moon", "Oak", "Raven", "Red", "River", "Silver", "Stone", "Storm", "Sun", "Thorn", "White", "Wolf"];
  const KINGDOM_LAST = ["crest", "fall", "gard", "hold", "mark", "mere", "reach", "rest", "vale", "watch", "wood", "wyn", "moor", "haven", "spire"];

  const FIRST_NAMES = ["Aldric","Brenna","Cassian","Darian","Elara","Fenric","Garran","Helena","Isolde","Joren","Kael","Lyra","Mira","Nerys","Orin","Perrin","Rhea","Seren","Talia","Ulric","Veyra","Wren","Ysabel","Zoren"];
  const LAST_NAMES = ["Ashford","Blackwood","Crowe","Dunmere","Emberfell","Fairwind","Grey","Harrow","Ironwood","Kestrel","Locke","Mourn","North","Oakheart","Rook","Storme","Thorne","Vale","Westfall","Wolfe"];
  const SETTLEMENT_PREFIX = ["Oak","Raven","Red","Green","High","Low","Kings","Queens","Stone","River","West","East","North","South","Wolf","Ash","Briar","Gold","White","Black"];
  const SETTLEMENT_SUFFIX = ["mere","ford","bridge","haven","wick","field","bury","watch","cross","stead","brook","fall","gate","ton","ham","keep"];

  const CREATURES = [
    {name:"Starved Wolf", level:1, hp:18, dmg:[3,7], xp:25, gold:[0,2], habitats:["wilderness","forest","road","outskirts"], attacks:["bite","lunge"]},
    {name:"Goblin Scavenger", level:1, hp:22, dmg:[4,7], xp:30, gold:[2,8], habitats:["wilderness","ruin","road","outskirts"], attacks:["slash","stab","dirty trick"]},
    {name:"Roadside Bandit", level:2, hp:28, dmg:[5,9], xp:38, gold:[6,15], habitats:["road","outskirts","wilderness"], attacks:["slash","thrust","kick"]},
    {name:"Bog Imp", level:2, hp:24, dmg:[4,10], xp:36, gold:[1,6], habitats:["swamp","wilderness","ruin"], attacks:["claw","bite","hex"]},
    {name:"Dire Boar", level:3, hp:40, dmg:[6,11], xp:52, gold:[0,0], habitats:["forest","wilderness","outskirts"], attacks:["gore","charge"]},
    {name:"Skeleton Guard", level:3, hp:34, dmg:[7,11], xp:55, gold:[4,12], habitats:["ruin","crypt","wilderness"], attacks:["slash","thrust"]}
  ];

  const URBAN_ENCOUNTERS = [
    {name:"Drunk Brawler", level:1, hp:20, dmg:[2,6], xp:18, gold:[1,5], habitats:["town"], attacks:["punch","kick","grab"]},
    {name:"Cutpurse", level:1, hp:18, dmg:[2,5], xp:20, gold:[3,9], habitats:["town"], attacks:["stab","slash","flee feint"]},
    {name:"Angry Guard Dog", level:1, hp:16, dmg:[3,6], xp:16, gold:[0,0], habitats:["town","outskirts"], attacks:["bite","lunge"]},
    {name:"Thug", level:2, hp:26, dmg:[4,8], xp:28, gold:[4,10], habitats:["town"], attacks:["punch","slash","grab"]}
  ];


  const GUARD_ENCOUNTER = {name:"Town Guard", level:2, hp:34, dmg:[5,9], xp:18, gold:[0,4], habitats:["town"], attacks:["shield bash","slash","grapple"]};

  const FACTION_ARCHETYPES = [
    {type:"crown", names:["Royal Wardens","Crown Guard","Lionguard","King's Spears"], lawful:90, focuses:["order","war","law"]},
    {type:"merchant", names:["Merchant Compact","Golden Scale Guild","Free Traders","Caravan League"], lawful:65, focuses:["trade","wealth","roads"]},
    {type:"arcane", names:["Circle of the Veil","Azure Conclave","Order of Embers","Star Collegium"], lawful:55, focuses:["magic","lore","artefacts"]},
    {type:"faith", names:["Temple Synod","Keepers of the Dawn","Order of Mercy","Sacred Chapter"], lawful:80, focuses:["faith","healing","charity"]},
    {type:"hunters", names:["Rangers' Lodge","Greycloak Hunters","Beastwardens","Trailwardens"], lawful:60, focuses:["hunting","beasts","wilds"]},
    {type:"underworld", names:["Black Hand","Night Market","Rook Syndicate","Whisper Knives"], lawful:10, focuses:["crime","smuggling","secrets"]}
  ];

  const MARKET_GOODS = [
    {name:"Rations", base:6, category:"food", item:"Rations x1"},
    {name:"Healing Draught", base:20, category:"medicine", item:"Healing Draught"},
    {name:"Lockpicks", base:14, category:"tools", item:"Lockpicks"},
    {name:"Torch", base:4, category:"tools", item:"Torch"},
    {name:"Iron Dagger", base:24, category:"weapons", item:"Iron Dagger"},
    {name:"Travel Cloak", base:16, category:"clothing", item:"Travel Cloak"}
  ];

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function reputationLabel(value) {
    if (value >= 60) return "Revered";
    if (value >= 30) return "Trusted";
    if (value >= 10) return "Favourable";
    if (value <= -60) return "Hated";
    if (value <= -30) return "Hostile";
    if (value <= -10) return "Distrusted";
    return "Neutral";
  }

  function relationLabel(value) {
    if (value >= 55) return "Allied";
    if (value >= 20) return "Friendly";
    if (value <= -65) return "Hostile";
    if (value <= -25) return "Tense";
    return "Neutral";
  }

  function factionForType(kingdomId, type) {
    return (state.world?.factions || []).find(f => f.kingdomId === kingdomId && f.type === type) || null;
  }

  function factionById(id) { return (state.world?.factions || []).find(f => f.id === id) || null; }
  function kingdomById(id) { return (state.world?.kingdoms || []).find(k => k.id === id) || null; }

  function generateFactionsForKingdoms(kingdoms, rng) {
    const factions = [];
    let counter = 0;
    kingdoms.forEach((k, kingdomIndex) => {
      const mandatory = [FACTION_ARCHETYPES[0], FACTION_ARCHETYPES[1]];
      const optional = FACTION_ARCHETYPES.slice(2);
      const third = optional[Math.floor(rng() * optional.length)];
      [...mandatory, third].forEach((arch, idx) => {
        const nameRoot = pick(arch.names, rng);
        const factionName = `${nameRoot} of ${k.name}`;
        factions.push({
          id:`f${counter++}`,
          name:factionName,
          type:arch.type,
          kingdomId:k.id,
          leader:personName(rng),
          lawful:arch.lawful,
          focuses:[...arch.focuses],
          power:randInt(35,85,rng),
          wealth:randInt(30,90,rng),
          playerRep:0,
          joined:false,
          relations:{},
          description:`A ${arch.type} faction operating throughout ${k.name}.`
        });
      });
    });
    const underworldKingdom = pick(kingdoms, rng);
    const under = FACTION_ARCHETYPES.find(a => a.type === "underworld");
    factions.push({
      id:`f${counter++}`,
      name:`${pick(under.names,rng)} Network`,
      type:"underworld",
      kingdomId:underworldKingdom.id,
      leader:personName(rng), lawful:10, focuses:[...under.focuses],
      power:randInt(30,75,rng), wealth:randInt(35,90,rng), playerRep:0, joined:false,
      relations:{}, description:`A criminal network with cells extending beyond ${underworldKingdom.name}.`
    });
    factions.forEach(a => factions.forEach(b => {
      if (a.id !== b.id) a.relations[b.id] = a.kingdomId === b.kingdomId ? randInt(-20,35,rng) : randInt(-45,20,rng);
    }));
    return factions;
  }

  function initialiseKingdomV2(kingdom, rng=Math.random) {
    kingdom.prosperity ??= randInt(38,82,rng);
    kingdom.stability ??= randInt(38,82,rng);
    kingdom.treasury ??= randInt(300,1100,rng);
    kingdom.playerRep ??= 0;
    kingdom.relations ||= {};
    kingdom.wars ||= [];
    kingdom.market ||= {
      index:Number((1.15 - kingdom.prosperity / 250).toFixed(2)),
      categories:{food:1,medicine:1,tools:1,weapons:1,clothing:1}
    };
  }

  function ensureV2Data() {
    if (!state.character || !state.world || !state.game) return;
    state.character.renown ??= 0;
    state.character.infamy ??= 0;
    state.character.injuries ||= [];
    state.world.events ||= [];
    state.world.npcs ||= [];
    state.world.quests ||= [];
    state.world.questCounter ??= 1;
    state.world.eventCounter ??= 1;
    state.world.kingdoms.forEach((k, i) => initialiseKingdomV2(k, seeded(`${state.world.seed}-migrate-${i}`)));
    state.world.kingdoms.forEach((a, i) => state.world.kingdoms.forEach((b,j) => {
      if (i !== j && a.relations[b.id] == null) a.relations[b.id] = clamp(Number(a.relation ?? randInt(-35,35)), -100, 100);
    }));
    if (!state.world.factions?.length) state.world.factions = generateFactionsForKingdoms(state.world.kingdoms, seeded(`${state.world.seed}-factions-v2`));
    state.game.crimeHeat ||= {};
    state.game.bounties ||= {};
    state.game.activeQuestOffer ??= null;
    state.game.marketOpen ??= false;
    state.game.crimeMenu ??= false;
    state.game.lawEncounter ??= null;
    state.game.travelMenu ??= false;
    state.game.ledgerTab ||= "overview";
    state.game.lastWorldTickDay ??= state.world.day;
    state.world.kingdoms.forEach(k => {
      state.game.crimeHeat[k.id] ??= 0;
      state.game.bounties[k.id] ??= 0;
    });
    ensureV3Data();
  }

  function dateStamp() { return `${state.world.day} ${state.world.season}, ${state.world.year}`; }

  function currentHeat(kingdomId=state.game.kingdomId) { return Number(state.game.crimeHeat?.[kingdomId] || 0); }
  function currentBounty(kingdomId=state.game.kingdomId) { return Number(state.game.bounties?.[kingdomId] || 0); }

  function legalStatus(kingdomId=state.game.kingdomId) {
    const h = currentHeat(kingdomId);
    if (h >= 60) return "Notorious";
    if (h >= 35) return "Wanted";
    if (h >= 15) return "Suspected";
    return "Clear";
  }

  function changeKingdomRep(kingdomId, amount) {
    const k = kingdomById(kingdomId); if (!k) return;
    k.playerRep = clamp((k.playerRep || 0) + amount, -100, 100);
  }

  function changeFactionRep(factionId, amount) {
    const f = factionById(factionId); if (!f) return;
    f.playerRep = clamp((f.playerRep || 0) + amount, -100, 100);
    if (amount > 0) {
      (state.world.factions || []).forEach(rival => {
        if (rival.id !== f.id && Number(f.relations?.[rival.id] || 0) <= -30) {
          rival.playerRep = clamp((rival.playerRep || 0) - Math.max(1, Math.round(amount * .18)), -100, 100);
        }
      });
    }
  }

  function addNpcMemory(npc, text) {
    npc.memory ||= [];
    npc.memory.push({day:state.world.day, text});
    if (npc.memory.length > 8) npc.memory.shift();
  }

  function recordCrime(type, severity=8, witnessed=true) {
    const kid = state.game.kingdomId;
    const k = kingdomById(kid);
    if (!witnessed) severity = Math.ceil(severity * .45);
    state.game.crimeHeat[kid] = clamp(currentHeat(kid) + severity, 0, 100);
    state.game.bounties[kid] = Math.max(0, currentBounty(kid) + Math.round(severity * 1.8));
    state.character.infamy = clamp((state.character.infamy || 0) + Math.max(1, Math.floor(severity/4)), 0, 999);
    changeKingdomRep(kid, -Math.max(1, Math.floor(severity/5)));
    addEvent(`${type} reported in ${k?.name || "the realm"}`);
  }

  function worldPrice(good, kingdom=currentKingdom()) {
    const market = kingdom.market || {index:1,categories:{}};
    let mult = Number(market.index || 1) * Number(market.categories?.[good.category] || 1);
    const merchant = factionForType(kingdom.id, "merchant");
    if (merchant) mult *= clamp(1 - merchant.playerRep * .002, .82, 1.18);
    if ((kingdom.wars || []).length) {
      if (["food","medicine","weapons"].includes(good.category)) mult *= 1.18;
    }
    return Math.max(1, Math.round(good.base * mult));
  }

  function normaliseCalendar() {
    const seasons = ["Springwane","Highsummer","Harvest","Frostfall"];
    while (state.world.day > 30) {
      state.world.day -= 30;
      let idx = seasons.indexOf(state.world.season);
      idx = idx < 0 ? 0 : idx + 1;
      if (idx >= seasons.length) { idx = 0; state.world.year++; }
      state.world.season = seasons[idx];
    }
  }

  function recordWorldEvent(text, kingdomIds=[], factionIds=[]) {
    const event = {id:`e${state.world.eventCounter++}`, date:dateStamp(), text, kingdomIds, factionIds};
    state.world.events.push(event);
    if (state.world.events.length > 80) state.world.events.shift();
    addEvent(`World: ${text}`);
    if (kingdomIds.includes(state.game.kingdomId)) addLog(`<strong>World event:</strong> ${escapeHtml(text)}`, "system");
  }

  function updateEconomyForKingdom(k) {
    const market = k.market;
    const drift = (55 - k.prosperity) / 1200 + (k.wars.length ? .025 : 0) + randInt(-2,2) / 100;
    market.index = clamp(Number((market.index + drift).toFixed(2)), .65, 1.85);
    Object.keys(market.categories).forEach(cat => {
      market.categories[cat] = clamp(Number((market.categories[cat] + randInt(-2,2)/100).toFixed(2)), .75, 1.7);
    });
  }

  function livingWorldTick() {
    ensureV2Data();
    state.world.kingdoms.forEach(k => {
      k.prosperity = clamp(k.prosperity + randInt(-2,2), 5, 100);
      k.stability = clamp(k.stability + randInt(-2,2), 5, 100);
      k.treasury = Math.max(0, k.treasury + randInt(-25,35) - (k.wars.length ? 35 : 0));
      updateEconomyForKingdom(k);
    });
    state.world.factions.forEach(f => {
      f.power = clamp(f.power + randInt(-2,2), 5, 100);
      f.wealth = clamp(f.wealth + randInt(-2,2), 5, 100);
    });

    // Ongoing wars cost both sides strength and prosperity.
    state.world.kingdoms.forEach(k => {
      (k.wars || []).forEach(enemyId => {
        if (k.id < enemyId) {
          const enemy = kingdomById(enemyId); if (!enemy) return;
          const lossA = randInt(0,3), lossB = randInt(0,3);
          k.strength = clamp(k.strength-lossA, 5, 100); enemy.strength = clamp(enemy.strength-lossB, 5, 100);
          k.prosperity = clamp(k.prosperity-1, 5, 100); enemy.prosperity = clamp(enemy.prosperity-1,5,100);
          if (Math.random() < .18) recordWorldEvent(`Forces of ${k.name} and ${enemy.name} clash along the border.`, [k.id, enemy.id]);
        }
      });
    });

    if (Math.random() < .72) {
      const k = pick(state.world.kingdoms);
      const roll = Math.random();
      if (roll < .18) {
        k.prosperity = clamp(k.prosperity+6,5,100); k.market.index = clamp(k.market.index-.08,.65,1.85);
        recordWorldEvent(`A strong trading season brings new wealth into ${k.name}.`, [k.id]);
      } else if (roll < .34) {
        k.stability = clamp(k.stability-6,5,100); k.market.categories.food = clamp(k.market.categories.food+.12,.75,1.7);
        recordWorldEvent(`Bandit attacks disrupt roads and food deliveries in ${k.name}.`, [k.id]);
      } else if (roll < .50) {
        const f = pick(state.world.factions.filter(x => x.kingdomId === k.id));
        f.power = clamp(f.power+7,5,100);
        recordWorldEvent(`${f.name} gains influence at court and in the streets.`, [k.id], [f.id]);
      } else if (roll < .67 && state.world.kingdoms.length > 1) {
        const other = pick(state.world.kingdoms.filter(x => x.id !== k.id));
        k.relations[other.id] = clamp(k.relations[other.id]-12,-100,100);
        other.relations[k.id] = clamp(other.relations[k.id]-12,-100,100);
        recordWorldEvent(`A border dispute sharply worsens relations between ${k.name} and ${other.name}.`, [k.id,other.id]);
        if (k.relations[other.id] <= -70 && !k.wars.includes(other.id) && Math.random() < .42) {
          k.wars.push(other.id); other.wars.push(k.id);
          recordWorldEvent(`${k.name} and ${other.name} formally enter a state of war.`, [k.id,other.id]);
        }
      } else if (roll < .82 && k.wars.length) {
        const enemy = kingdomById(pick(k.wars));
        if (enemy) {
          k.wars = k.wars.filter(id=>id!==enemy.id); enemy.wars = enemy.wars.filter(id=>id!==k.id);
          k.relations[enemy.id] = Math.max(k.relations[enemy.id], -25); enemy.relations[k.id] = Math.max(enemy.relations[k.id], -25);
          recordWorldEvent(`${k.name} and ${enemy.name} agree to a fragile peace.`, [k.id,enemy.id]);
        }
      } else {
        k.stability = clamp(k.stability+4,5,100);
        recordWorldEvent(`Local officials in ${k.name} restore order after weeks of unrest.`, [k.id]);
      }
    }

    deepSimulationTick();

    // Heat slowly cools if the player is not actively causing trouble.
    Object.keys(state.game.crimeHeat).forEach(id => state.game.crimeHeat[id] = Math.max(0, state.game.crimeHeat[id]-2));
  }

  function advanceWorldDay(days=1) {
    for (let i=0; i<days; i++) {
      state.world.day++;
      normaliseCalendar();
      livingWorldTick();
    }
  }

  function generateQuestOffer(sourceFactionId=null) {
    ensureV2Data();
    const k = currentKingdom();
    const localFactions = state.world.factions.filter(f => f.kingdomId === k.id && f.type !== "underworld");
    const faction = factionById(sourceFactionId) || pick(localFactions);
    const templates = [
      {type:"hunt", title:"Clear the Roads", objectiveKind:"combat", goal:2, desc:"Defeat threats on the roads or outskirts before more travellers disappear."},
      {type:"delivery", title:"Courier Needed", objectiveKind:"travel", goal:1, desc:"Carry sealed correspondence safely to another settlement."},
      {type:"investigation", title:"Signs in the Dark", objectiveKind:"explore", goal:2, desc:"Investigate suspicious activity and return with useful information."},
      {type:"patrol", title:"Keep the Peace", objectiveKind:"urban_help", goal:2, desc:"Help locals and deal with trouble without adding to the disorder."}
    ];
    const t = pick(templates);
    const quest = {
      id:`q${state.world.questCounter++}`, title:t.title, type:t.type, description:t.desc,
      objectiveKind:t.objectiveKind, progress:0, goal:t.goal, status:"offered",
      kingdomId:k.id, factionId:faction?.id || null,
      rewardGold:randInt(20,45)+state.character.level*4,
      rewardXp:randInt(28,55), createdDay:state.world.day
    };
    state.game.activeQuestOffer = quest;
    return quest;
  }

  function acceptQuest() {
    const q = state.game.activeQuestOffer; if (!q) return;
    q.status = "active";
    state.world.quests.push(q);
    state.game.activeQuestOffer = null;
    addLog(`You accept <strong>${escapeHtml(q.title)}</strong>. ${escapeHtml(q.description)}`, "event");
    addEvent(`Accepted quest: ${q.title}`);
  }

  function progressQuests(kind, amount=1) {
    const active = state.world.quests.filter(q => q.status === "active" && q.objectiveKind === kind);
    active.forEach(q => {
      q.progress = Math.min(q.goal, q.progress + amount);
      addLog(`<strong>Quest:</strong> ${escapeHtml(q.title)} — ${q.progress}/${q.goal}`, "system");
      if (q.progress >= q.goal) completeQuest(q);
    });
  }

  function completeQuest(q) {
    if (q.status !== "active") return;
    q.status = "completed";
    q.completedDay = state.world.day;
    state.character.gold += q.rewardGold;
    awardXp(q.rewardXp);
    state.character.renown = clamp((state.character.renown||0)+3,0,999);
    changeKingdomRep(q.kingdomId, 4);
    if (q.factionId) changeFactionRep(q.factionId, 8);
    addLog(`<strong>QUEST COMPLETE:</strong> ${escapeHtml(q.title)}. You receive ${q.rewardGold} gold and ${q.rewardXp} XP.`, "event");
    addEvent(`Completed quest: ${q.title}`);
  }

  function maybeLawCheck() {
    if (state.game.areaType !== "town" || state.game.combat || state.game.lawEncounter) return false;
    const heat = currentHeat();
    if (heat < 15) return false;
    const chance = clamp(.05 + heat/160, .08, .7);
    if (Math.random() < chance) {
      state.game.lawEncounter = {kingdomId:state.game.kingdomId, bounty:currentBounty()};
      addLog(`A patrol recognises your description and blocks the street. "You are wanted for questioning."`, "event");
      return true;
    }
    return false;
  }

  const state = {
    screen: "title",
    wizardStep: 0,
    character: null,
    worldConfig: null,
    world: null,
    game: null
  };

  let draft = {
    character: {
      name: "",
      sex: "Male",
      age: 19,
      race: "Human",
      customRace: { name: "", desc: "", bonus: { str:0, dex:0, con:0, int:0, wis:0, cha:0 } },
      appearance: "Dark hair, weathered travelling clothes",
      background: "Peasant",
      customBackground: { name: "", desc: "", gold: 20, items: [], skill: "" },
      className: "Warrior",
      customClass: { name: "", desc: "", hp: 12, skill: "Focused Strike" },
      stats: { str:8, dex:8, con:8, int:8, wis:8, cha:8 },
      pointsRemaining: 18,
      infiniteStatPoints: false,
      startingSkills: [],
      customSkills: []
    },
    world: {
      name: "",
      seed: randomSeed(),
      kingdoms: 5,
      magic: 2,
      danger: 2,
      beasts: 2,
      climate: "Temperate",
      politics: "Unstable"
    }
  };

  function randomSeed() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function seeded(seedText) {
    return mulberry32(hashString(seedText));
  }

  function pick(arr, rng=Math.random) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function randInt(min, max, rng=Math.random) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function titleCase(str) {
    return String(str).replace(/\b\w/g, c => c.toUpperCase());
  }

  function showToast(message) {
    const node = document.getElementById("toastTemplate").content.firstElementChild.cloneNode(true);
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2400);
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.character && parsed?.world) {
        draft = parsed;
        draft.character.customRace ||= { name: "", desc: "", bonus: { str:0, dex:0, con:0, int:0, wis:0, cha:0 } };
        draft.character.customBackground ||= { name: "", desc: "", gold: 20, items: [], skill: "" };
        draft.character.customClass ||= { name: "", desc: "", hp: 12, skill: "Focused Strike" };
        draft.character.startingSkills ||= [];
        draft.character.customSkills ||= [];
        draft.character.infiniteStatPoints ||= false;
      }
    } catch {}
  }

  function saveGame(showMessage=true) {
    if (!state.character || !state.world || !state.game) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: "4.0",
      character: state.character,
      worldConfig: state.worldConfig,
      world: state.world,
      game: state.game
    }));
    const now = new Date();
    saveStatus.textContent = `Saved ${now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
    if (showMessage) showToast("Adventure saved.");
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      state.character = data.character;
      state.worldConfig = data.worldConfig;
      state.world = data.world;
      state.game = data.game;
      ensureV2Data();
      state.screen = "game";
      render();
      showToast("Adventure loaded.");
      return true;
    } catch {
      showToast("Save data could not be loaded.");
      return false;
    }
  }

  function setTopActions(inGame) {
    saveButton.classList.toggle("hidden", !inGame);
    menuButton.classList.toggle("hidden", !inGame);
  }

  function render() {
    window.scrollTo({top: 0, behavior: "smooth"});
    setTopActions(state.screen === "game");
    if (state.screen === "title") renderTitle();
    if (state.screen === "wizard") renderWizard();
    if (state.screen === "worldReview") renderWorldReview();
    if (state.screen === "game") renderGame();
  }

  function renderTitle() {
    const saved = hasSave();
    screenRoot.innerHTML = `
      <section class="hero">
        <div class="hero-grid">
          <div>
            <div class="kicker">A living fantasy sandbox</div>
            <h1>Write no destiny. Live one.</h1>
            <p>Create a character, generate a realm, meet strangers, fight creatures, gain levels and decide what kind of person you become. V1 runs entirely in your browser.</p>
            <div class="action-row">
              <button class="primary-button" id="newAdventure">New Adventure</button>
              <button class="secondary-button" id="continueAdventure" ${saved ? "" : "disabled"}>${saved ? "Continue Adventure" : "No Save Found"}</button>
            </div>
          </div>
          <aside class="title-card" aria-label="Game preview">
            <div class="rune-grid"></div>
            <div class="card-content">
              <div class="eyebrow">Your realm is waiting</div>
              <div class="world-preview">
                <div class="preview-line"><span>Kingdoms</span><strong>Procedurally generated</strong></div>
                <div class="preview-line"><span>NPCs</span><strong>Random encounters</strong></div>
                <div class="preview-line"><span>Progression</span><strong>Levels, XP & skills</strong></div>
                <div class="preview-line"><span>Cost</span><strong>None</strong></div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    `;

    document.getElementById("newAdventure").addEventListener("click", () => {
      state.screen = "wizard";
      state.wizardStep = 0;
      render();
    });
    document.getElementById("continueAdventure").addEventListener("click", loadGame);
  }

  const WIZARD_STEPS = ["Identity", "Origin", "Attributes", "World", "Review"];

  function stepNavHtml() {
    return WIZARD_STEPS.map((label, i) => `
      <div class="step-item ${i === state.wizardStep ? "active" : ""} ${i < state.wizardStep ? "complete" : ""}">
        <span class="step-number">${i < state.wizardStep ? "✓" : i+1}</span>
        <span>${label}</span>
      </div>
    `).join("");
  }

  function renderWizard() {
    saveDraft();
    const body = [
      renderIdentityStep,
      renderOriginStep,
      renderStatsStep,
      renderWorldStep,
      renderReviewStep
    ][state.wizardStep]();

    screenRoot.innerHTML = `
      <div class="eyebrow">Create your adventure</div>
      <h1 class="page-title">${WIZARD_STEPS[state.wizardStep]}</h1>
      <div class="wizard-layout">
        <aside class="panel step-list">${stepNavHtml()}</aside>
        <section class="panel panel-pad">
          ${body}
          <div class="divider"></div>
          <div class="action-row">
            ${state.wizardStep > 0 ? `<button class="ghost-button" id="backStep">Back</button>` : `<button class="ghost-button" id="cancelWizard">Cancel</button>`}
            <button class="primary-button" id="nextStep">${state.wizardStep === 4 ? "Generate Realm" : "Continue"}</button>
          </div>
        </section>
      </div>
    `;

    wireWizardStep();

    const back = document.getElementById("backStep");
    if (back) back.addEventListener("click", () => { state.wizardStep--; render(); });
    const cancel = document.getElementById("cancelWizard");
    if (cancel) cancel.addEventListener("click", () => { state.screen = "title"; render(); });
    document.getElementById("nextStep").addEventListener("click", nextWizardStep);
  }

  function renderIdentityStep() {
    const c = draft.character;
    const race = getRaceData(c);
    const customBonus = c.customRace?.bonus || {};
    return `
      <h2 class="section-title">Who are you?</h2>
      <p class="section-copy">Set the identity the world — and a future AI narrator — will use when describing and reacting to your character.</p>
      <div class="form-grid">
        <div class="field">
          <label for="charName">Name</label>
          <input class="input" id="charName" maxlength="28" value="${escapeHtml(c.name)}" placeholder="e.g. Rowan Vale">
        </div>
        <div class="field">
          <label for="charSex">Sex</label>
          <select class="select" id="charSex">
            ${["Male","Female"].map(x => `<option ${c.sex===x?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="charAge">Age</label>
          <input class="input" id="charAge" type="number" min="1" max="2000" value="${c.age}">
        </div>
        <div class="field">
          <label for="charRace">Race</label>
          <select class="select" id="charRace">
            ${Object.keys(RACES).map(x => `<option value="${x}" ${c.race===x?"selected":""}>${x}</option>`).join("")}
            <option value="${CUSTOM}" ${c.race===CUSTOM?"selected":""}>Create my own…</option>
          </select>
          <small id="raceDesc">${escapeHtml(race.desc)}</small>
        </div>
        <div class="field full">
          <label for="appearance">Appearance</label>
          <textarea class="textarea" id="appearance" maxlength="500" placeholder="Hair, eyes, build, scars, clothing...">${escapeHtml(c.appearance)}</textarea>
        </div>
      </div>

      <div id="customRacePanel" class="creator-panel ${c.race===CUSTOM?"":"hidden"}">
        <div>
          <div class="eyebrow">Custom race definition</div>
          <h3>Teach the world what you are</h3>
          <p>For a familiar race such as <strong>Goblin</strong>, the name alone is useful to a future AI. Add a description when you want your version to differ from normal fantasy lore.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="customRaceName">Race name</label>
            <input class="input" id="customRaceName" maxlength="40" value="${escapeHtml(c.customRace?.name || "")}" placeholder="Goblin, Dragonborn, Moon Elf...">
          </div>
          <div class="field full">
            <label for="customRaceDesc">Race description / lore</label>
            <textarea class="textarea" id="customRaceDesc" maxlength="900" placeholder="Describe biology, culture, lifespan, magical traits or anything the narrator should know...">${escapeHtml(c.customRace?.desc || "")}</textarea>
          </div>
        </div>
        <div class="eyebrow" style="margin-top:8px">Optional racial stat bonuses</div>
        <div class="mini-stat-grid">
          ${Object.entries(STAT_INFO).map(([key,[name]]) => `<label><span>${name}</span><input class="input" type="number" min="-20" max="100" data-race-bonus="${key}" value="${Number(customBonus[key] || 0)}"></label>`).join("")}
        </div>
      </div>
    `;
  }

  function renderOriginStep() {
    const c = draft.character;
    const bg = getBackgroundData(c);
    const cls = getClassData(c);
    return `
      <h2 class="section-title">Choose your origin</h2>
      <p class="section-copy">Use a preset or define your own background and class. Custom definitions are stored with your character for future AI narration.</p>
      <div class="eyebrow">Background</div>
      <div class="card-select-grid" id="backgroundGrid">
        ${Object.entries(BACKGROUNDS).map(([name, data]) => `
          <button type="button" class="select-card ${c.background===name?"selected":""}" data-background="${name}">
            <strong>${name}</strong><span>${data.desc}</span>
          </button>`).join("")}
        <button type="button" class="select-card custom-card ${c.background===CUSTOM?"selected":""}" data-background="${CUSTOM}">
          <strong>+ Create background</strong><span>Define your own past, equipment, gold and signature skill.</span>
        </button>
      </div>
      <div id="customBackgroundPanel" class="creator-panel ${c.background===CUSTOM?"":"hidden"}">
        <div class="form-grid">
          <div class="field"><label for="customBackgroundName">Background name</label><input class="input" id="customBackgroundName" maxlength="45" value="${escapeHtml(c.customBackground?.name || "")}" placeholder="Exiled Prince, Goblin Scavenger..."></div>
          <div class="field"><label for="customBackgroundGold">Starting gold</label><input class="input" id="customBackgroundGold" type="number" min="0" max="999999" value="${Number(c.customBackground?.gold ?? 20)}"></div>
          <div class="field full"><label for="customBackgroundDesc">Background description</label><textarea class="textarea" id="customBackgroundDesc" maxlength="900" placeholder="Where did you come from? What shaped you?">${escapeHtml(c.customBackground?.desc || "")}</textarea></div>
          <div class="field"><label for="customBackgroundSkill">Signature skill</label><input class="input" id="customBackgroundSkill" maxlength="50" value="${escapeHtml(c.customBackground?.skill || "")}" placeholder="Scavenging"></div>
          <div class="field"><label for="customBackgroundItems">Starting items</label><input class="input" id="customBackgroundItems" maxlength="220" value="${escapeHtml((c.customBackground?.items || []).join(", "))}" placeholder="Rusty cleaver, patched cloak, mushrooms"></div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="eyebrow">Starting class</div>
      <div class="card-select-grid" id="classGrid">
        ${Object.entries(CLASSES).map(([name, data]) => `
          <button type="button" class="select-card ${c.className===name?"selected":""}" data-class="${name}">
            <strong>${name}</strong><span>${data.desc}</span>
          </button>`).join("")}
        <button type="button" class="select-card custom-card ${c.className===CUSTOM?"selected":""}" data-class="${CUSTOM}">
          <strong>+ Create class</strong><span>Name and describe any archetype, from Beastmaster to Blood Knight.</span>
        </button>
      </div>
      <div id="customClassPanel" class="creator-panel ${c.className===CUSTOM?"":"hidden"}">
        <div class="form-grid">
          <div class="field"><label for="customClassName">Class name</label><input class="input" id="customClassName" maxlength="45" value="${escapeHtml(c.customClass?.name || "")}" placeholder="Shaman, Monster Hunter, Rune Knight..."></div>
          <div class="field"><label for="customClassHp">Bonus starting HP</label><input class="input" id="customClassHp" type="number" min="0" max="200" value="${Number(c.customClass?.hp ?? 12)}"></div>
          <div class="field full"><label for="customClassDesc">Class description</label><textarea class="textarea" id="customClassDesc" maxlength="900" placeholder="How does this class fight, survive or use magic?">${escapeHtml(c.customClass?.desc || "")}</textarea></div>
          <div class="field"><label for="customClassSkill">Signature technique</label><input class="input" id="customClassSkill" maxlength="50" value="${escapeHtml(c.customClass?.skill || "Focused Strike")}" placeholder="Savage Lunge"></div>
        </div>
      </div>
    `;
  }

  function renderStatsStep() {
    const c = draft.character;
    const selected = new Set(c.startingSkills || []);
    return `
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap">
        <div>
          <h2 class="section-title">Attributes & abilities</h2>
          <p class="section-copy" style="margin-bottom:0">Use standard point-buy or enable Creator Control for unrestricted character building.</p>
        </div>
        <div class="points-pill"><span>Points remaining</span><strong id="pointsRemaining">${c.infiniteStatPoints ? "∞" : c.pointsRemaining}</strong></div>
      </div>

      <label class="creator-toggle">
        <input type="checkbox" id="infiniteStats" ${c.infiniteStatPoints?"checked":""}>
        <span><strong>Creator Control — unlimited attribute points</strong><small>Ignore the normal point pool and type any stat value from 1–999.</small></span>
      </label>

      <div class="divider"></div>
      <div class="stat-builder">
        ${Object.entries(STAT_INFO).map(([key, [name, desc]]) => `
          <div class="stat-row">
            <div class="stat-name"><strong>${name}</strong><small>${desc}</small></div>
            <input class="input stat-number" id="stat-${key}" type="number" min="${c.infiniteStatPoints?1:8}" max="999" value="${c.stats[key]}" data-stat-input="${key}" aria-label="${name} value">
            <div class="stat-controls">
              <button class="icon-button" type="button" data-stat="${key}" data-delta="-1" aria-label="Lower ${name}">−</button>
              <button class="icon-button" type="button" data-stat="${key}" data-delta="1" aria-label="Raise ${name}">+</button>
            </div>
          </div>`).join("")}
      </div>

      <div class="divider"></div>
      <div class="ability-header">
        <div><div class="eyebrow">Starting skills</div><h3>Give yourself any abilities you want</h3></div>
        <span class="skill-count" id="skillCount">${selected.size + (c.customSkills || []).length} chosen</span>
      </div>
      <p class="section-copy">These are added on top of your background skill and class technique. There is no limit.</p>
      <div class="skill-grid" id="skillGrid">
        ${ALL_SKILLS.map(skill => `<label class="skill-option ${selected.has(skill)?"selected":""}"><input type="checkbox" data-skill="${escapeHtml(skill)}" ${selected.has(skill)?"checked":""}><span>${escapeHtml(skill)}</span></label>`).join("")}
      </div>
      <div class="custom-skill-box">
        <div class="field"><label for="customSkillInput">Create a custom skill</label><div style="display:flex;gap:8px"><input class="input" id="customSkillInput" maxlength="50" placeholder="e.g. Goblin Engineering"><button type="button" class="secondary-button" id="addCustomSkill">Add</button></div></div>
        <div class="custom-skill-list" id="customSkillList">
          ${(c.customSkills || []).map((skill,i) => `<span class="skill-tag">${escapeHtml(skill)}<button type="button" data-remove-custom-skill="${i}" aria-label="Remove ${escapeHtml(skill)}">×</button></span>`).join("") || `<span class="muted-note">No custom skills yet.</span>`}
        </div>
      </div>
    `;
  }

  function renderWorldStep() {
    const w = draft.world;
    const scaleLabel = (v, type) => {
      const labels = {
        magic:["Rare","Low","Common","High","Mythic"],
        danger:["Safe","Uneasy","Dangerous","Brutal","Nightmare"],
        beasts:["Sparse","Occasional","Common","Abundant","Overrun"]
      };
      return labels[type][v-1];
    };
    return `
      <h2 class="section-title">Build the world</h2>
      <p class="section-copy">Choose the broad rules. The seed makes kingdom names and starting geography repeatable.</p>
      <div class="form-grid">
        <div class="field">
          <label for="worldName">World name</label>
          <input class="input" id="worldName" maxlength="32" value="${escapeHtml(w.name)}" placeholder="Leave blank to generate">
        </div>
        <div class="field">
          <label for="worldSeed">World seed</label>
          <div style="display:flex;gap:8px">
            <input class="input" id="worldSeed" maxlength="20" value="${escapeHtml(w.seed)}">
            <button type="button" class="secondary-button" id="rerollSeed">↻</button>
          </div>
        </div>
        <div class="field">
          <label for="kingdoms">Kingdoms</label>
          <input class="input" id="kingdoms" type="number" min="3" max="9" value="${w.kingdoms}">
        </div>
        <div class="field">
          <label for="climate">Dominant climate</label>
          <select class="select" id="climate">
            ${["Temperate","Cold","Mediterranean","Arid","Wet & Wild","Varied"].map(x => `<option ${w.climate===x?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="politics">Political climate</label>
          <select class="select" id="politics">
            ${["Stable","Tense","Unstable","Open War"].map(x => `<option ${w.politics===x?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
        <div></div>
        ${[
          ["magic","Magic prevalence",w.magic],
          ["danger","World danger",w.danger],
          ["beasts","Magical beasts",w.beasts]
        ].map(([id,label,val]) => `
          <div class="field full">
            <label for="${id}">${label}</label>
            <div class="range-wrap">
              <input id="${id}" type="range" min="1" max="5" value="${val}">
              <strong id="${id}Label">${scaleLabel(val,id)}</strong>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderReviewStep() {
    const c = draft.character;
    const w = draft.world;
    const race = getRaceData(c);
    const bg = getBackgroundData(c);
    const cls = getClassData(c);
    const finalStats = Object.fromEntries(Object.keys(c.stats).map(k => [k, c.stats[k] + (race.bonus[k] || 0)]));
    const chosenSkills = skillList(c);
    return `
      <h2 class="section-title">Ready to enter the realm</h2>
      <p class="section-copy">Review your setup. Custom definitions will be preserved in the save data for later AI integration.</p>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>${escapeHtml(c.name || "Unnamed Adventurer")}</h3>
          <div class="summary-list">
            <div><span>Identity</span><strong>${c.age} • ${c.sex} • ${escapeHtml(race.name)}</strong></div>
            <div><span>Origin</span><strong>${escapeHtml(bg.name)}</strong></div>
            <div><span>Class</span><strong>${escapeHtml(cls.name)}</strong></div>
            <div><span>Creator Control</span><strong>${c.infiniteStatPoints ? "Unlimited" : "Standard"}</strong></div>
          </div>
        </div>
        <div class="summary-card">
          <h3>Attributes</h3>
          <div class="summary-list">
            ${Object.entries(STAT_INFO).map(([k,[name]]) => `<div><span>${name}</span><strong>${finalStats[k]}</strong></div>`).join("")}
          </div>
        </div>
        <div class="summary-card">
          <h3>${escapeHtml(w.name || "Generated World")}</h3>
          <div class="summary-list">
            <div><span>Kingdoms</span><strong>${w.kingdoms}</strong></div>
            <div><span>Climate</span><strong>${w.climate}</strong></div>
            <div><span>Politics</span><strong>${w.politics}</strong></div>
            <div><span>Seed</span><strong>${escapeHtml(w.seed)}</strong></div>
          </div>
        </div>
        <div class="summary-card">
          <h3>Starting package</h3>
          <div class="summary-list">
            <div><span>Gold</span><strong>${bg.gold}</strong></div>
            <div><span>Signature skills</span><strong>${escapeHtml([bg.skill, cls.skill].filter(Boolean).join(" • ") || "None")}</strong></div>
            <div><span>Extra skills</span><strong>${chosenSkills.length}</strong></div>
            <div><span>Equipment</span><strong>${bg.items.length} items</strong></div>
          </div>
        </div>
      </div>
      ${(race.custom || bg.custom || cls.custom) ? `<div class="creator-panel" style="margin-top:16px"><div class="eyebrow">Custom character definitions</div>${race.custom?`<p><strong>${escapeHtml(race.name)}:</strong> ${escapeHtml(race.desc)}</p>`:""}${bg.custom?`<p><strong>${escapeHtml(bg.name)}:</strong> ${escapeHtml(bg.desc)}</p>`:""}${cls.custom?`<p><strong>${escapeHtml(cls.name)}:</strong> ${escapeHtml(cls.desc)}</p>`:""}</div>` : ""}
    `;
  }

  function wireWizardStep() {
    if (state.wizardStep === 0) {
      const raceSelect = document.getElementById("charRace");
      const refreshRacePanel = () => {
        const isCustom = raceSelect.value === CUSTOM;
        document.getElementById("customRacePanel").classList.toggle("hidden", !isCustom);
        document.getElementById("raceDesc").textContent = isCustom
          ? "Create a race name and optional lore below."
          : RACES[raceSelect.value].desc;
      };
      raceSelect.addEventListener("change", refreshRacePanel);
    }

    if (state.wizardStep === 1) {
      document.querySelectorAll("[data-background]").forEach(btn => {
        btn.addEventListener("click", () => {
          captureOriginFields();
          draft.character.background = btn.dataset.background;
          saveDraft();
          render();
        });
      });
      document.querySelectorAll("[data-class]").forEach(btn => {
        btn.addEventListener("click", () => {
          captureOriginFields();
          draft.character.className = btn.dataset.class;
          saveDraft();
          render();
        });
      });
    }

    if (state.wizardStep === 2) {
      const updatePointsUI = () => {
        document.getElementById("pointsRemaining").textContent = draft.character.infiniteStatPoints ? "∞" : draft.character.pointsRemaining;
      };
      const setStat = (key, requested) => {
        const c = draft.character;
        const current = Number(c.stats[key]);
        let next = Math.max(c.infiniteStatPoints ? 1 : 8, Math.min(999, Number(requested) || current));
        if (!c.infiniteStatPoints) {
          const delta = next - current;
          if (delta > c.pointsRemaining) {
            next = current + c.pointsRemaining;
            showToast("That would use more attribute points than you have.");
          }
          c.pointsRemaining -= (next - current);
        }
        c.stats[key] = next;
        document.getElementById(`stat-${key}`).value = next;
        updatePointsUI();
        saveDraft();
      };

      document.getElementById("infiniteStats").addEventListener("change", e => {
        draft.character.infiniteStatPoints = e.target.checked;
        saveDraft();
        render();
      });

      document.querySelectorAll("[data-stat]").forEach(btn => {
        btn.addEventListener("click", () => setStat(btn.dataset.stat, draft.character.stats[btn.dataset.stat] + Number(btn.dataset.delta)));
      });
      document.querySelectorAll("[data-stat-input]").forEach(input => {
        input.addEventListener("change", () => setStat(input.dataset.statInput, input.value));
      });

      document.querySelectorAll("[data-skill]").forEach(box => {
        box.addEventListener("change", () => {
          const set = new Set(draft.character.startingSkills || []);
          box.checked ? set.add(box.dataset.skill) : set.delete(box.dataset.skill);
          draft.character.startingSkills = [...set];
          saveDraft();
          box.closest(".skill-option")?.classList.toggle("selected", box.checked);
          const count = (draft.character.startingSkills || []).length + (draft.character.customSkills || []).length;
          document.getElementById("skillCount").textContent = `${count} chosen`;
        });
      });

      document.getElementById("addCustomSkill").addEventListener("click", () => {
        const input = document.getElementById("customSkillInput");
        const value = input.value.trim();
        if (!value) return;
        const existing = new Set((draft.character.customSkills || []).map(x => x.toLowerCase()));
        if (!existing.has(value.toLowerCase())) draft.character.customSkills.push(value);
        saveDraft();
        renderWizard();
      });
      document.querySelectorAll("[data-remove-custom-skill]").forEach(btn => {
        btn.addEventListener("click", () => {
          draft.character.customSkills.splice(Number(btn.dataset.removeCustomSkill), 1);
          saveDraft();
          renderWizard();
        });
      });
    }

    if (state.wizardStep === 3) {
      const labels = {
        magic:["Rare","Low","Common","High","Mythic"],
        danger:["Safe","Uneasy","Dangerous","Brutal","Nightmare"],
        beasts:["Sparse","Occasional","Common","Abundant","Overrun"]
      };
      ["magic","danger","beasts"].forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener("input", () => {
          document.getElementById(`${id}Label`).textContent = labels[id][Number(slider.value)-1];
        });
      });
      document.getElementById("rerollSeed").addEventListener("click", () => {
        document.getElementById("worldSeed").value = randomSeed();
      });
    }
  }

  function captureOriginFields() {
    const c = draft.character;
    const bgName = document.getElementById("customBackgroundName");
    if (bgName) {
      c.customBackground = {
        name: bgName.value.trim(),
        desc: document.getElementById("customBackgroundDesc").value.trim(),
        gold: Math.max(0, Number(document.getElementById("customBackgroundGold").value) || 0),
        items: document.getElementById("customBackgroundItems").value.split(",").map(x => x.trim()).filter(Boolean),
        skill: document.getElementById("customBackgroundSkill").value.trim()
      };
    }
    const clsName = document.getElementById("customClassName");
    if (clsName) {
      c.customClass = {
        name: clsName.value.trim(),
        desc: document.getElementById("customClassDesc").value.trim(),
        hp: Math.max(0, Math.min(200, Number(document.getElementById("customClassHp").value) || 0)),
        skill: document.getElementById("customClassSkill").value.trim() || "Focused Strike"
      };
    }
  }

  function captureCurrentStep() {
    const c = draft.character;
    const w = draft.world;

    if (state.wizardStep === 0) {
      c.name = document.getElementById("charName").value.trim();
      c.sex = document.getElementById("charSex").value;
      c.age = Math.max(1, Math.min(2000, Number(document.getElementById("charAge").value) || 19));
      c.race = document.getElementById("charRace").value;
      c.appearance = document.getElementById("appearance").value.trim() || "A plainly dressed traveller.";
      if (c.race === CUSTOM) {
        c.customRace = {
          name: document.getElementById("customRaceName").value.trim(),
          desc: document.getElementById("customRaceDesc").value.trim(),
          bonus: Object.fromEntries(Object.keys(STAT_INFO).map(key => [key, Math.max(-20, Math.min(100, Number(document.querySelector(`[data-race-bonus="${key}"]`).value) || 0))]))
        };
        if (c.customRace.name.length < 2) {
          showToast("Give your custom race a name.");
          return false;
        }
      }
      if (c.name.length < 2) {
        showToast("Enter a character name.");
        return false;
      }
    }

    if (state.wizardStep === 1) {
      captureOriginFields();
      if (c.background === CUSTOM && (c.customBackground?.name || "").trim().length < 2) {
        showToast("Give your custom background a name.");
        return false;
      }
      if (c.className === CUSTOM && (c.customClass?.name || "").trim().length < 2) {
        showToast("Give your custom class a name.");
        return false;
      }
    }

    if (state.wizardStep === 3) {
      w.name = document.getElementById("worldName").value.trim();
      w.seed = document.getElementById("worldSeed").value.trim().toUpperCase() || randomSeed();
      w.kingdoms = Math.max(3, Math.min(9, Number(document.getElementById("kingdoms").value) || 5));
      w.climate = document.getElementById("climate").value;
      w.politics = document.getElementById("politics").value;
      w.magic = Number(document.getElementById("magic").value);
      w.danger = Number(document.getElementById("danger").value);
      w.beasts = Number(document.getElementById("beasts").value);
    }

    saveDraft();
    return true;
  }

  function nextWizardStep() {
    if (!captureCurrentStep()) return;
    if (state.wizardStep < 4) {
      state.wizardStep++;
      render();
      return;
    }
    createAdventure();
  }

  function generatedName(rng) {
    return pick(WORLD_PREFIX, rng) + pick(WORLD_SUFFIX, rng);
  }

  function kingdomName(rng, used) {
    let name;
    do {
      name = pick(KINGDOM_FIRST, rng) + pick(KINGDOM_LAST, rng);
    } while (used.has(name));
    used.add(name);
    return name;
  }

  function personName(rng) {
    return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
  }

  function settlementName(rng) {
    return pick(SETTLEMENT_PREFIX, rng) + pick(SETTLEMENT_SUFFIX, rng);
  }

  function createWorld(config) {
    const rng = seeded(config.seed);
    const used = new Set();
    const worldName = config.name || generatedName(rng);
    const regionTypes = ["wooded marches","rolling heartlands","high mountain valleys","wind-scoured moors","broad riverlands","rugged coast","old-growth forests","fertile plains"];
    const traits = ["wealthy but divided","militarised and proud","ancient and secretive","mercantile and ambitious","devout and traditional","scarred by old wars","rich in mines and forges","famed for horsemen","known for sorcerers","troubled by monsters"];
    const colors = ["#c9a45c","#75a7c8","#a586c8","#75b98e","#c76565","#d08e5c","#8ba6a0","#b98bba","#8f9ec9"];

    const kingdoms = [];
    for (let i=0; i<config.kingdoms; i++) {
      const name = kingdomName(rng, used);
      const ruler = personName(rng);
      const capital = settlementName(rng);
      const kingdom = {
        id:`k${i}`, name, ruler, rulerTitle:rng()>.5?"King":"Queen", capital,
        region:pick(regionTypes,rng), trait:pick(traits,rng), strength:randInt(35,92,rng),
        color:colors[i%colors.length], relation:randInt(-55,55,rng), relations:{}, wars:[],
        prosperity:randInt(38,82,rng), stability:randInt(38,82,rng), treasury:randInt(350,1200,rng), playerRep:0
      };
      initialiseKingdomV2(kingdom, rng);
      kingdoms.push(kingdom);
    }
    kingdoms.forEach(a => kingdoms.forEach(b => {
      if (a.id !== b.id) a.relations[b.id] = randInt(-55,55,rng);
    }));
    // Make bilateral diplomacy broadly consistent.
    for (let i=0;i<kingdoms.length;i++) for (let j=i+1;j<kingdoms.length;j++) {
      const value = Math.round((kingdoms[i].relations[kingdoms[j].id] + kingdoms[j].relations[kingdoms[i].id])/2);
      kingdoms[i].relations[kingdoms[j].id]=value; kingdoms[j].relations[kingdoms[i].id]=value;
    }

    const startKingdom = kingdoms[0];
    const settlement = settlementName(rng);
    const factions = generateFactionsForKingdoms(kingdoms, rng);
    return {
      name:worldName, seed:config.seed, kingdoms, factions, npcs:[], quests:[], questCounter:1, events:[], eventCounter:1,
      startKingdomId:startKingdom.id, startSettlement:settlement,
      year:randInt(610,980,rng), day:randInt(3,25,rng), season:pick(["Springwane","Highsummer","Harvest","Frostfall"],rng),
      rumours:[
        `Caravans have vanished on the old road beyond ${settlement}.`,
        `${startKingdom.rulerTitle} ${startKingdom.ruler.split(" ")[0]} is said to be gathering troops near the border.`,
        `A ruined watchtower in the hills has begun showing lights after midnight.`
      ]
    };
  }

  function createAdventure() {
    const c = JSON.parse(JSON.stringify(draft.character));
    const wConfig = JSON.parse(JSON.stringify(draft.world));
    const race = getRaceData(c);
    const bg = getBackgroundData(c);
    const cls = getClassData(c);
    Object.keys(c.stats).forEach(k => c.stats[k] += Number(race.bonus[k] || 0));

    c.raceProfile = { name: race.name, description: race.desc, custom: race.custom, statBonuses: race.bonus };
    c.backgroundProfile = { name: bg.name, description: bg.desc, custom: bg.custom };
    c.classProfile = { name: cls.name, description: cls.desc, custom: cls.custom };
    c.race = race.name;
    c.background = bg.name;
    c.className = cls.name;
    c.level = 1;
    c.xp = 0;
    c.xpNext = 100;
    c.maxHp = 65 + c.stats.con * 3 + cls.hp;
    c.hp = c.maxHp;
    c.gold = bg.gold;
    c.inventory = [...bg.items];
    c.injuries = [];
    c.skills = {};
    if (bg.skill) c.skills[bg.skill] = 15;
    if (cls.skill) c.skills[cls.skill] = Math.max(c.skills[cls.skill] || 0, 10);
    skillList(draft.character).forEach(skill => c.skills[skill] = Math.max(c.skills[skill] || 0, 20));
    c.signatureTechnique = cls.skill || "Focused Strike";
    c.renown = 0;
    c.infamy = 0;

    const world = createWorld(wConfig);
    const startKingdom = world.kingdoms.find(k => k.id === world.startKingdomId);

    state.character = c;
    state.worldConfig = wConfig;
    state.world = world;
    state.game = {
      location: world.startSettlement,
      areaType: "town",
      kingdomId: world.startKingdomId,
      time: "Morning",
      turn: 1,
      activeNpc: null,
      combat: null,
      mobileTab: "story",
      log: [
        { type: "event", text: `Year ${world.year}, ${world.day}th day of ${world.season}. ${escapeHtml(c.name)} begins in <strong>${world.startSettlement}</strong>, a small settlement within the Kingdom of <strong>${startKingdom.name}</strong>.` },
        { type: "story", text: openingText(c, world, startKingdom, bg) }
      ],
      recentEvents: ["Adventure begun"],
      crimeHeat: Object.fromEntries(world.kingdoms.map(k=>[k.id,0])),
      bounties: Object.fromEntries(world.kingdoms.map(k=>[k.id,0])),
      activeQuestOffer: null,
      marketOpen: false,
      crimeMenu: false,
      lawEncounter: null,
      travelMenu: false,
      ledgerTab: "overview",
      lastWorldTickDay: world.day
    };
    ensureV2Data();

    state.screen = "worldReview";
    localStorage.removeItem(DRAFT_KEY);
    render();
  }

  function openingText(c, world, kingdom, backgroundData=null) {
    const openings = {
      Peasant: `Rain taps against the shutters above your family's workshop. Voices rise in the street below; a royal courier has arrived with mud on his cloak and blood on one sleeve.`,
      Noble: `You wake in a guest chamber overlooking the market square. Your family's seal lies beside an unopened letter marked with the wax of ${kingdom.rulerTitle} ${kingdom.ruler.split(" ")[0]}.`,
      Soldier: `Your old sword belt hangs from the bedpost of a crowded inn. Downstairs, two off-duty guards argue about a patrol that failed to return from the northern road.`,
      Hunter: `You return from the treeline just before sunrise. Tracks you found in the mud were too large for any wolf you know, and they led toward the old watchtower.`,
      Criminal: `A folded note has been pushed beneath your rented room's door. It contains only a meeting place, a time, and the crude drawing of a black crown.`,
      Scholar: `The innkeeper left an old bronze coin beside your breakfast. The symbol stamped into it matches one in a forbidden history you once studied.`,
      "Apprentice Mage": `The small crystal in your travelling kit has been humming since midnight. At dawn, it finally cracks — pointing like a compass needle toward the hills.`,
      Mercenary: `Your purse is lighter than you would like and your blade needs work. Fortunately, a notice has appeared outside the tavern offering coin for anyone willing to clear the east road.`
    };
    const customIntro = backgroundData?.custom
      ? `Your past as a ${escapeHtml(backgroundData.name)} has brought you to this moment. ${escapeHtml(backgroundData.desc)} A disturbance in ${world.startSettlement} gives you your first opportunity to decide what happens next.`
      : openings[c.background] || `You begin the day in ${world.startSettlement} with no obligation except the ones you choose for yourself.`;
    return `${customIntro} You are free to investigate, leave town, seek work, speak to locals or simply choose another path.`;
  }

  function renderWorldReview() {
    const world = state.world;
    screenRoot.innerHTML = `
      <div class="eyebrow">World generated</div>
      <h1 class="page-title">${escapeHtml(world.name)}</h1>
      <p class="page-copy">Seed ${escapeHtml(world.seed)} • ${state.worldConfig.climate} • ${state.worldConfig.politics}</p>
      <section class="panel panel-pad">
        <h2 class="section-title">The powers of the realm</h2>
        <p class="section-copy">These kingdoms now exist as persistent world state for this adventure.</p>
        <div class="world-grid">
          ${world.kingdoms.map(k => `
            <article class="kingdom-card" style="--kingdom-color:${k.color}">
              <h3>${k.name}</h3>
              <p>${k.rulerTitle} ${k.ruler} rules from ${k.capital}. The realm spans ${k.region} and is ${k.trait}. Prosperity ${k.prosperity}/100 • Stability ${k.stability}/100.</p>
            </article>
          `).join("")}
        </div>
        <div class="divider"></div>
        <h2 class="section-title">Major factions</h2>
        <p class="section-copy">Guilds, orders, courts and criminal networks compete for influence independently of the crowns.</p>
        <div class="world-grid">
          ${world.factions.slice(0, Math.min(8, world.factions.length)).map(f => `
            <article class="kingdom-card">
              <h3>${escapeHtml(f.name)}</h3>
              <p>${titleCase(f.type)} faction led by ${escapeHtml(f.leader)}. Power ${f.power}/100 • Wealth ${f.wealth}/100.</p>
            </article>
          `).join("")}
        </div>
        <div class="divider"></div>
        <div class="action-row">
          <button class="ghost-button" id="rerollWorld">Regenerate with new seed</button>
          <button class="primary-button" id="enterWorld">Enter ${escapeHtml(world.name)}</button>
        </div>
      </section>
    `;

    document.getElementById("rerollWorld").addEventListener("click", () => {
      draft.world = {...state.worldConfig, seed: randomSeed()};
      state.wizardStep = 3;
      state.screen = "wizard";
      render();
    });

    document.getElementById("enterWorld").addEventListener("click", () => {
      state.screen = "game";
      saveGame(false);
      render();
    });
  }

  function currentKingdom() {
    return state.world.kingdoms.find(k => k.id === state.game.kingdomId);
  }

  function renderGame() {
    ensureV2Data();
    const c = state.character, g = state.game, w = state.world, k = currentKingdom();
    const hpPct = Math.max(0, Math.round(c.hp/c.maxHp*100));
    const xpPct = Math.max(0, Math.round(c.xp/c.xpNext*100));
    const gameClass = g.mobileTab === "character" ? "show-character" : g.mobileTab === "world" ? "show-world" : "";
    const activeQuests = w.quests.filter(q=>q.status==="active");
    const localFactions = w.factions.filter(f=>f.kingdomId===k.id);

    screenRoot.innerHTML = `
      <div class="mobile-tabs">
        <button type="button" data-mobiletab="character" class="${g.mobileTab==="character"?"active":""}">Character</button>
        <button type="button" data-mobiletab="story" class="${g.mobileTab==="story"?"active":""}">Adventure</button>
        <button type="button" data-mobiletab="world" class="${g.mobileTab==="world"?"active":""}">World</button>
      </div>
      <div class="game-layout ${gameClass}">
        <aside class="side-stack left-panel">
          <section class="panel hud-card">
            <div class="hud-heading">Character</div>
            <h2 class="character-name">${escapeHtml(c.name)}</h2>
            <div class="character-sub">Level ${c.level} ${escapeHtml(c.race)} ${escapeHtml(c.className)}</div>
            <div class="divider"></div>
            <div class="hud-row"><span>HP</span><strong>${c.hp}/${c.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${hpPct}%"></span></div><div class="hud-row"><span>Mana</span><strong>${c.mana||0}/${c.maxMana||0}</strong></div><div class="bar"><span class="mana-fill" style="width:${c.maxMana?Math.max(0,Math.round((c.mana||0)/c.maxMana*100)):0}%"></span></div>
            <div class="hud-row"><span>XP</span><strong>${c.xp}/${c.xpNext}</strong></div><div class="bar"><span class="xp-fill" style="width:${xpPct}%"></span></div>
            <div class="hud-row"><span>Gold</span><strong>${c.gold}</strong></div>
            <div class="hud-row"><span>Renown</span><strong>${c.renown||0}</strong></div>
            <div class="hud-row"><span>Infamy</span><strong>${c.infamy||0}</strong></div>
            <div class="divider"></div>
            <div class="stat-chip-grid">${Object.entries(STAT_INFO).map(([key,[name]])=>`<div class="stat-chip"><strong>${c.stats[key]}</strong><small>${name.slice(0,3).toUpperCase()}</small></div>`).join("")}</div>
            <div class="divider"></div>
            <div class="hud-heading">Condition</div>
            <div class="inventory-list">${c.injuries?.length?c.injuries.map(i=>`<div class="inventory-item"><span>${escapeHtml(titleCase(i.part))}</span><strong>${escapeHtml(titleCase(i.severity))}</strong></div>`).join(""):`<div class="inventory-item"><span>Uninjured</span></div>`}</div>
          </section>
          <section class="panel hud-card">
            <div class="hud-heading">Quest journal</div>
            <div class="inventory-list">${activeQuests.length?activeQuests.slice(0,3).map(q=>`<div class="quest-mini"><strong>${escapeHtml(q.title)}</strong><span>${q.progress}/${q.goal} • ${escapeHtml(factionById(q.factionId)?.name || "Independent")}</span></div>`).join(""):`<div class="inventory-item"><span>No active quests</span></div>`}</div>
          </section>
          <section class="panel hud-card"><div class="hud-heading">Inventory</div><div class="inventory-list">${c.inventory.length?c.inventory.map(item=>`<div class="inventory-item"><span>${escapeHtml(item)}</span></div>`).join(""):`<div class="inventory-item"><span>Empty</span></div>`}</div></section>
        </aside>

        <section class="panel story-panel">
          <header class="scene-header">
            <div class="eyebrow">${escapeHtml(k.name)}</div>
            <h2>${escapeHtml(g.location)}</h2>
            <div class="scene-meta">Year ${w.year} • ${w.day} ${w.season} • ${g.time} • ${legalStatus()}${currentBounty()?` • Bounty ${currentBounty()}g`:""}</div>
          </header>
          <div class="story-log" id="storyLog">${g.log.slice(-12).map(entry=>`<div class="story-entry ${entry.type}">${entry.text}</div>`).join("")}</div>
          <div class="choice-area">${renderActionArea()}${renderRoleplayComposer()}</div>
        </section>

        <aside class="side-stack right-panel">
          <section class="panel hud-card">
            <div class="hud-heading">Current realm</div>
            <h3 style="margin:0 0 5px">${escapeHtml(k.name)}</h3>
            <div class="character-sub">${k.rulerTitle} ${escapeHtml(k.ruler)}</div>
            <div class="divider"></div>
            <div class="hud-row"><span>Standing</span><strong>${reputationLabel(k.playerRep||0)} (${k.playerRep||0})</strong></div>
            <div class="hud-row"><span>Prosperity</span><strong>${k.prosperity}/100</strong></div>
            <div class="hud-row"><span>Stability</span><strong>${k.stability}/100</strong></div>
            <div class="hud-row"><span>At war</span><strong>${k.wars.length?k.wars.map(id=>escapeHtml(kingdomById(id)?.name||id)).join(", "):"No"}</strong></div>
            <button class="secondary-button ledger-button" id="openLedger" type="button">Open World Ledger</button>
          </section>
          <section class="panel hud-card">
            <div class="hud-heading">Local factions</div>
            <div class="event-list">${localFactions.map(f=>`<div class="event-item"><span>${escapeHtml(f.name)}</span><strong>${reputationLabel(f.playerRep)} ${f.playerRep}</strong></div>`).join("")}</div>
          </section>
          <section class="panel hud-card"><div class="hud-heading">Recent world events</div><div class="event-list">${w.events.length?w.events.slice(-3).reverse().map(e=>`<div class="event-item"><span>${escapeHtml(e.text)}</span></div>`).join(""):`<div class="event-item"><span>The world is quiet—for now.</span></div>`}</div></section>
        </aside>
      </div>`;

    document.querySelectorAll("[data-mobiletab]").forEach(btn=>btn.addEventListener("click",()=>{g.mobileTab=btn.dataset.mobiletab;renderGame();}));
    document.getElementById("openLedger")?.addEventListener("click", showWorldLedger);
    wireGameActions();
  }

  function renderActionArea() {
    const g = state.game;
    if (g.combat) {
      const e=g.combat;
      return `<div class="combat-box"><h3>${escapeHtml(e.name)} — Lv.${e.level}</h3><div class="hud-row"><span>Enemy HP</span><strong>${e.hp}/${e.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></span></div>${e.statuses?.length?`<div class="character-sub" style="margin-top:8px">Status: ${e.statuses.map(s=>escapeHtml(titleCase(s.name))).join(", ")}</div>`:""}</div>
      <div class="choice-grid"><button class="choice-button" data-action="combat-attack"><strong>Attack</strong><small>Make a direct weapon attack.</small></button><button class="choice-button" data-action="combat-power"><strong>Use Technique</strong><small>${escapeHtml(state.character.signatureTechnique||"Technique")}</small></button><button class="choice-button" data-action="combat-defend"><strong>Defend</strong><small>Brace for the next attack.</small></button><button class="choice-button" data-action="combat-flee"><strong>Flee</strong><small>Attempt to escape.</small></button></div>
      <div class="custom-action"><input class="input" id="combatCustomAction" maxlength="180" placeholder="Custom combat action: throw dirt, climb a cart, target a limb..."><button class="secondary-button" id="doCombatCustomAction">Try it</button></div>`;
    }
    if (g.lawEncounter) {
      return `<div class="combat-box law-box"><h3>Stopped by the Watch</h3><div class="character-sub">Bounty: ${currentBounty()} gold • Heat: ${currentHeat()}/100</div></div><div class="choice-grid"><button class="choice-button" data-action="law-pay"><strong>Pay bounty</strong><small>Settle what you owe if you have enough gold.</small></button><button class="choice-button" data-action="law-surrender"><strong>Surrender</strong><small>Accept detention and confiscation.</small></button><button class="choice-button" data-action="law-run"><strong>Run</strong><small>Use Dexterity to escape.</small></button><button class="choice-button" data-action="law-resist"><strong>Resist</strong><small>Fight the guards and increase your infamy.</small></button></div>`;
    }
    if (g.activeQuestOffer) {
      const q=g.activeQuestOffer, f=factionById(q.factionId);
      return `<div class="quest-offer"><div class="eyebrow">Contract offered${f?` • ${escapeHtml(f.name)}`:""}</div><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description)}</p><div class="reward-line"><span>${q.goal} objective${q.goal!==1?"s":""}</span><strong>${q.rewardGold}g • ${q.rewardXp} XP</strong></div></div><div class="choice-grid"><button class="choice-button" data-action="quest-accept"><strong>Accept contract</strong><small>Add it to your quest journal.</small></button><button class="choice-button" data-action="quest-decline"><strong>Decline</strong><small>Leave the offer.</small></button></div>`;
    }
    if (g.marketOpen) {
      const k=currentKingdom();
      return `<div class="market-panel"><div class="eyebrow">${escapeHtml(g.location)} market</div><h3>Local prices</h3><p>Prices respond to prosperity, war, shortages and your standing with merchants.</p><div class="market-list">${MARKET_GOODS.map((good,i)=>{const price=worldPrice(good,k),owned=state.character.inventory.includes(good.item);return `<div class="market-row"><div><strong>${escapeHtml(good.name)}</strong><small>${titleCase(good.category)}${owned?" • Owned":""}</small></div><div class="market-actions"><button type="button" class="secondary-button" data-buy="${i}">Buy ${price}g</button>${owned?`<button type="button" class="ghost-button" data-sell="${i}">Sell ${Math.max(1,Math.floor(price*.55))}g</button>`:""}</div></div>`}).join("")}</div><button type="button" class="ghost-button" data-action="market-leave">Leave market</button></div>`;
    }
    if (g.crimeMenu) {
      return `<div class="crime-panel"><div class="eyebrow">Underworld</div><h3>Risk and consequence</h3><p>Crimes can earn quick money, but witnesses create heat, bounties, infamy and hostility with lawful factions.</p></div><div class="choice-grid"><button class="choice-button" data-action="crime-pickpocket"><strong>Pickpocket</strong><small>Low reward • lower risk</small></button><button class="choice-button" data-action="crime-burglary"><strong>Burglary</strong><small>Moderate reward • moderate risk</small></button><button class="choice-button" data-action="crime-robbery"><strong>Robbery</strong><small>High reward • high risk</small></button><button class="choice-button" data-action="crime-leave"><strong>Back away</strong><small>Commit no crime.</small></button></div>`;
    }
    if (g.travelMenu) {
      const from=currentKingdom();
      return `<div class="quest-offer"><div class="eyebrow">Travel</div><h3>Choose a destination</h3><p>Crossing a border takes longer and may be dangerous when kingdoms are at war.</p></div><div class="choice-grid"><button class="choice-button" data-action="travel-local"><strong>Another settlement in ${escapeHtml(from.name)}</strong><small>Short journey • same laws and reputation</small></button>${state.world.kingdoms.filter(x=>x.id!==from.id).map(dest=>`<button class="choice-button" data-action="travel-kingdom:${dest.id}"><strong>${escapeHtml(dest.name)}</strong><small>${escapeHtml(dest.capital)} • ${relationLabel(from.relations[dest.id]||0)}${from.wars.includes(dest.id)?" • AT WAR":""}</small></button>`).join("")}<button class="choice-button" data-action="travel-cancel"><strong>Stay here</strong><small>Close travel choices.</small></button></div>`;
    }
    if (g.activeNpc) {
      const n=g.activeNpc, f=factionById(n.factionId);
      return `<div class="npc-card"><div class="eyebrow">${f?escapeHtml(f.name):"Independent"}</div><h3>${escapeHtml(n.name)}</h3><div class="character-sub">${escapeHtml(n.occupation)} • ${escapeHtml(n.personality)} • Relationship ${n.relationship}</div>${n.memory?.length?`<p class="npc-memory">Remembers: ${escapeHtml(n.memory[n.memory.length-1].text)}</p>`:""}</div><div class="choice-grid"><button class="choice-button" data-action="npc-talk"><strong>Ask about the area</strong><small>Talk and build a relationship.</small></button><button class="choice-button" data-action="npc-work"><strong>Ask for work</strong><small>Request a faction-linked contract.</small></button><button class="choice-button" data-action="npc-help"><strong>Offer help</strong><small>Spend time helping them directly.</small></button>${f&&!f.joined?`<button class="choice-button" data-action="npc-join"><strong>Ask to join faction</strong><small>${f.playerRep>=20?"Your reputation may be sufficient.":`Requires Favourable standing (20). Current: ${f.playerRep}`}</small></button>`:""}<button class="choice-button" data-action="npc-threaten"><strong>Intimidate</strong><small>Risk relationship and legal consequences.</small></button><button class="choice-button" data-action="npc-leave"><strong>End conversation</strong><small>Return to the settlement.</small></button></div>`;
    }
    return `<div class="choice-grid"><button class="choice-button" data-action="explore"><strong>Explore</strong><small>Investigate the local area.</small></button><button class="choice-button" data-action="talk"><strong>Speak to someone</strong><small>Meet or revisit a local NPC.</small></button><button class="choice-button" data-action="work"><strong>Seek a contract</strong><small>Get a persistent quest from a local faction.</small></button><button class="choice-button" data-action="travel"><strong>Travel onward</strong><small>Move to another settlement.</small></button><button class="choice-button" data-action="market"><strong>Visit market</strong><small>Buy goods at dynamic local prices.</small></button><button class="choice-button" data-action="rest"><strong>Rest</strong><small>Recover and advance the living world.</small></button><button class="choice-button" data-action="rumour"><strong>Follow a rumour</strong><small>Investigate unusual activity.</small></button><button class="choice-button" data-action="underworld"><strong>Underworld</strong><small>Attempt criminal activity and accept the risk.</small></button></div><div class="custom-action"><input class="input" id="customAction" maxlength="180" placeholder="Or type an action: help a guard, steal a purse, visit the tavern, investigate the woods..."><button class="secondary-button" id="doCustomAction">Do it</button></div>`;
  }

  function wireGameActions() {
    document.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => handleGameAction(btn.dataset.action));
    });

    const custom = document.getElementById("doCustomAction");
    if (custom) {
      custom.addEventListener("click", doCustomAction);
      document.getElementById("customAction").addEventListener("keydown", (e) => {
        if (e.key === "Enter") doCustomAction();
      });
    }

    const combatCustom = document.getElementById("doCombatCustomAction");
    if (combatCustom) {
      combatCustom.addEventListener("click", doCombatCustomAction);
      document.getElementById("combatCustomAction").addEventListener("keydown", (e) => {
        if (e.key === "Enter") doCombatCustomAction();
      });
    }

    document.querySelectorAll("[data-buy]").forEach(btn => btn.addEventListener("click", () => buyMarketGood(Number(btn.dataset.buy))));
    document.querySelectorAll("[data-sell]").forEach(btn => btn.addEventListener("click", () => sellMarketGood(Number(btn.dataset.sell))));
  }

  function addLog(text, type="story") {
    state.game.log.push({text, type});
    if (state.game.log.length > 60) state.game.log.splice(0, state.game.log.length - 60);
  }

  function addEvent(text) {
    state.game.recentEvents.push(text);
    if (state.game.recentEvents.length > 12) state.game.recentEvents.shift();
  }

  function advanceTurn(amount=1) {
    const times=["Morning","Late Morning","Afternoon","Evening","Night"];
    amount=Math.max(1,Math.floor(amount));
    for (let i=0;i<amount;i++) {
      state.game.turn++;
      let idx=times.indexOf(state.game.time); if(idx<0) idx=0;
      if (idx===times.length-1) { state.game.time="Morning"; advanceWorldDay(1); }
      else state.game.time=times[idx+1];
    }
    maybeLawCheck();
  }

  function awardXp(amount) {
    const c = state.character;
    c.xp += amount;
    let levelled = false;
    while (c.xp >= c.xpNext) {
      c.xp -= c.xpNext;
      c.level++;
      c.xpNext = Math.round(c.xpNext * 1.28);
      c.maxHp += 8 + Math.floor(c.stats.con / 3);
      c.hp = c.maxHp;
      c.stats.str += c.className === "Warrior" ? 1 : 0;
      c.stats.dex += ["Ranger","Rogue"].includes(c.className) ? 1 : 0;
      c.stats.int += ["Mage","Spellblade"].includes(c.className) ? 1 : 0;
      c.stats.cha += c.className === "Diplomat" ? 1 : 0;
      levelled = true;
    }
    if (levelled) {
      addLog(`<strong>LEVEL UP:</strong> You are now level ${c.level}. Your health is restored and your class attributes improve.`, "system");
      addEvent(`Reached level ${c.level}`);
    }
  }

  function generateNpc() {
    ensureV2Data();
    const existing = state.world.npcs.filter(n=>!n.dead && n.location===state.game.location && n.kingdomId===state.game.kingdomId);
    if (existing.length && Math.random()<.38) return pick(existing);
    const occupations=["blacksmith","travelling merchant","town guard","hunter","scribe","innkeeper","hedge mage","farmhand","mercenary","messenger","herbalist","stablemaster"];
    const personalities=["guarded but fair","cheerful and talkative","sharp-eyed and suspicious","weary but courteous","proud and impatient","soft-spoken and observant","reckless and amused","nervous around strangers"];
    const occupation=pick(occupations);
    const personality=pick(personalities);
    const typeMap={"town guard":"crown","travelling merchant":"merchant","blacksmith":"merchant","hedge mage":"arcane","herbalist":"faith","hunter":"hunters"};
    const faction=factionForType(state.game.kingdomId,typeMap[occupation]) || pick(state.world.factions.filter(f=>f.kingdomId===state.game.kingdomId));
    const baseRep=(faction?.playerRep||0)+(currentKingdom()?.playerRep||0);
    const npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation,personality,factionId:faction?.id||null,kingdomId:state.game.kingdomId,location:state.game.location,relationship:clamp(randInt(-10,18)+Math.round(baseRep/8),-100,100),memory:[]};
    state.world.npcs.push(npc);
    return npc;
  }

  function maybeEncounter(context=state.game.areaType || "town") {
    const dangerBonus = state.worldConfig.danger * 0.07;
    const beastsBonus = state.worldConfig.beasts * 0.035;
    let baseChance = 0.07;

    if (["wilderness","forest","road","ruin","crypt","swamp","outskirts"].includes(context)) baseChance = 0.16;
    if (context === "town") baseChance = 0.05;

    if (Math.random() < baseChance + dangerBonus + (context !== "town" ? beastsBonus : 0)) {
      startCombat(null, context);
      return true;
    }
    return false;
  }

  function chooseEncounter(context) {
    const c = state.character;
    let pool;
    if (context === "town") {
      pool = URBAN_ENCOUNTERS.filter(x => x.level <= Math.max(1, c.level + 1));
      if (currentHeat() >= 35) pool = [...pool, GUARD_ENCOUNTER, GUARD_ENCOUNTER];
    } else {
      pool = CREATURES.filter(x =>
        x.level <= Math.max(1, c.level + 1) &&
        (!x.habitats || x.habitats.includes(context) || x.habitats.includes("wilderness"))
      );
    }
    if (!pool.length) pool = context === "town" ? URBAN_ENCOUNTERS : CREATURES;
    return pick(pool);
  }

  function startCombat(forceType=null, context=state.game.areaType || "town") {
    const c = state.character;
    const base = forceType || chooseEncounter(context);
    const scale = 1 + Math.max(0, c.level - base.level) * 0.12;
    state.game.combat = {
      name: base.name,
      level: Math.max(base.level, Math.min(c.level + 1, base.level + randInt(0,1))),
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      dmg: base.dmg,
      xp: Math.round(base.xp * scale),
      gold: base.gold,
      attacks: base.attacks || ["strike"],
      defending: false,
      context,
      lastPlayerAction: null,
      statuses: []
    };
    addLog(`A <strong>${base.name}</strong> blocks your path.`, "event");
    addEvent(`Encountered ${base.name}`);
  }

  function handleGameAction(action) {
    ensureV2Data();
    const g=state.game,c=state.character;
    if (action.startsWith("combat-")) return combatAction(action);
    if (action.startsWith("npc-")) return npcAction(action);
    if (action==="property") { g.propertyMenu=true; closeV3Menus("propertyMenu"); return renderGame(); }
    if (action==="magic") { g.magicMenu=true; closeV3Menus("magicMenu"); return renderGame(); }
    if (action==="crafting") { g.craftingMenu=true; closeV3Menus("craftingMenu"); return renderGame(); }
    if (action==="dungeons") { g.dungeonMenu=true; closeV3Menus("dungeonMenu"); return renderGame(); }
    if (action==="politics") { g.politicsMenu=true; closeV3Menus("politicsMenu"); return renderGame(); }
    if (action==="v3-close") { closeV3Menus(); return renderGame(); }
    if (action==="dungeon-discover") return discoverDungeon();
    if (action==="dungeon-advance") return dungeonAdvance();
    if (action==="dungeon-search") return dungeonSearch();
    if (action==="dungeon-leave") return leaveDungeon();
    if (action==="politics-crown") return politicalAction("crown");
    if (action==="politics-nobles") return politicalAction("nobles");
    if (action==="politics-court") return politicalAction("court");
    if (action.startsWith("law-")) return lawAction(action);
    if (action.startsWith("crime-")) return crimeAction(action);
    if (action==="quest-accept") { acceptQuest(); saveGame(false); return renderGame(); }
    if (action==="quest-decline") { addLog(`You decline the contract.`); g.activeQuestOffer=null; saveGame(false); return renderGame(); }
    if (action==="market-leave") { g.marketOpen=false; return renderGame(); }
    if (action==="travel-cancel") { g.travelMenu=false; return renderGame(); }
    if (action==="travel-local") {
      const old=g.location;g.travelMenu=false;g.areaType="road";advanceTurn(2);
      if(!g.lawEncounter&&!maybeEncounter("road")){const newPlace=settlementName(Math.random);g.location=newPlace;g.areaType="town";addLog(`You travel from ${escapeHtml(old)} to <strong>${escapeHtml(newPlace)}</strong> within ${escapeHtml(currentKingdom().name)}.`);awardXp(8);progressQuests("travel",1);maybeLawCheck();}
      saveGame(false);return renderGame();
    }
    if (action.startsWith("travel-kingdom:")) {
      const destId=action.split(":")[1],from=currentKingdom(),dest=kingdomById(destId); if(!dest)return;
      g.travelMenu=false;g.areaType="road";advanceTurn(3);
      const atWar=from.wars.includes(dest.id);
      if(!g.lawEncounter && (atWar?Math.random()<.55:Math.random()<.18) && maybeEncounter("road")){addLog(atWar?`War has made the border road extremely dangerous.`:`The longer road journey is interrupted before you reach the border.`);saveGame(false);return renderGame();}
      g.kingdomId=dest.id;g.location=dest.capital;g.areaType="town";addLog(`You cross into <strong>${escapeHtml(dest.name)}</strong> and eventually reach ${escapeHtml(dest.capital)}. Local laws, prices and reputation now apply.` ,"event");awardXp(15);progressQuests("travel",1);addEvent(`Entered ${dest.name}`);maybeLawCheck();saveGame(false);return renderGame();
    }

    if (action==="explore") {
      advanceTurn();
      const ctx=g.areaType==="town"?(Math.random()<.72?"town":"outskirts"):g.areaType;
      if (!g.lawEncounter && !maybeEncounter(ctx)) {
        const finds=[`You map several unfamiliar streets and learn which alleys locals avoid after dark.`,`You follow a trail of wagon marks beyond ${g.location} and discover evidence of recent traffic off the main road.`,`You spend time asking questions and comparing details that most travellers would ignore.`,`Behind a collapsed wall you find a discarded purse containing ${randInt(3,10)} gold.`];
        const result=pick(finds), m=result.match(/(\d+) gold/); if(m)c.gold+=Number(m[1]); addLog(result);
        if(Math.random()<.32){const mat=pick(["Herbs","Leather","Iron Scrap","Crystal Shard"]);c.materials[mat]=(c.materials[mat]||0)+1;addLog(`<strong>Material:</strong> You gather 1 ${mat}.`,"system");}
        awardXp(7); progressQuests("explore",1);
      }
    }
    if (action==="talk") { g.activeNpc=generateNpc(); addLog(`You approach <strong>${escapeHtml(g.activeNpc.name)}</strong>, a ${escapeHtml(g.activeNpc.occupation)}. They seem ${escapeHtml(g.activeNpc.personality)}.`,"event"); advanceTurn(); }
    if (action==="work") { const q=generateQuestOffer(); const f=factionById(q.factionId); addLog(`${f?escapeHtml(f.name):"A local employer"} has a contract available.`,"event"); advanceTurn(); }
    if (action==="travel") { g.travelMenu=true; addLog(`You consider the roads and borders open to you.`); }
    if (action==="market") { g.marketOpen=true; addLog(`You make your way to the market. Prices reflect the current state of ${escapeHtml(currentKingdom().name)}.`); }
    if (action==="rest") {
      const recovered=Math.min(c.maxHp-c.hp,Math.round(c.maxHp*.38)); c.hp+=recovered; c.mana=c.maxMana||c.mana||0; c.injuries=(c.injuries||[]).filter(i=>!(i.severity==="minor"&&Math.random()<.55)); g.time="Morning"; g.turn++; advanceWorldDay(1); addLog(`You rest until morning. ${recovered?`${recovered} HP is restored.`:"You were already at full strength."} The wider world continues moving while you sleep.`); addEvent("Rested for the night"); maybeLawCheck();
    }
    if (action==="rumour") { advanceTurn(); addLog(`You follow a local rumour through taverns, side streets and guarded conversations.`); if(!g.lawEncounter&&!maybeEncounter("outskirts")){const npc=generateNpc();g.activeNpc=npc;addLog(`<strong>${escapeHtml(npc.name)}</strong> appears to know more than they first admit.`,"event");progressQuests("explore",1);} awardXp(8); }
    if (action==="underworld") { g.crimeMenu=true; addLog(`You begin looking for opportunities that respectable citizens would avoid.`); }
    saveGame(false); renderGame();
  }

  function npcAction(action) {
    const g=state.game,c=state.character,n=g.activeNpc;if(!n)return; const f=factionById(n.factionId);
    if (action==="npc-recruit") {
      recruitActiveNpc();
      saveGame(false);
      renderGame();
      return;
    }
    if(action==="npc-talk"){
      const rel=n.relationship;
      const friendly=rel>=25;
      const lines=friendly?[`"You've done right by people here. I'll tell you what I've heard."`,`"There are changes coming. Watch the roads and watch the court."`]:[`"If you're new here, keep your eyes open. The roads have been worse lately."`,`"Everyone wants something. Crowns, guilds, thieves—it makes no difference."`,`"Prices are moving again. Usually means someone important has made a mistake."`];
      addLog(`${escapeHtml(n.name)} ${friendly?"speaks more openly":"glances around before speaking"}. ${pick(lines)}`); n.relationship=clamp(n.relationship+2,-100,100); addNpcMemory(n,"The player took time to speak with me respectfully."); awardXp(3);
    }
    if(action==="npc-work"){ const q=generateQuestOffer(n.factionId); addLog(`${escapeHtml(n.name)} offers you a contract on behalf of ${escapeHtml(f?.name||"a local employer")}.`,"event"); addNpcMemory(n,"I offered the player a contract."); }
    if(action==="npc-help"){
      const cost=randInt(1,4); n.relationship=clamp(n.relationship+7,-100,100); if(f)changeFactionRep(f.id,2); changeKingdomRep(n.kingdomId,1); c.renown=clamp((c.renown||0)+1,0,999); addNpcMemory(n,"The player helped me without demanding much in return."); addLog(`You spend time helping ${escapeHtml(n.name)} with a problem that would otherwise have cost them most of the day. Their attitude toward you noticeably improves.`); progressQuests("urban_help",1); advanceTurn(cost>2?2:1);
    }
    if(action==="npc-join"){
      if(!f){addLog(`${escapeHtml(n.name)} has no faction to induct you into.`);} else if(f.joined){addLog(`You are already recognised as a member of ${escapeHtml(f.name)}.`);} else if(f.playerRep<20){addLog(`${escapeHtml(n.name)} shakes their head. "You need to prove yourself to ${escapeHtml(f.name)} first."`);addNpcMemory(n,"The player asked to join our faction before earning enough trust.");} else {f.joined=true;changeFactionRep(f.id,10);state.character.renown=clamp((state.character.renown||0)+4,0,999);n.relationship=clamp(n.relationship+8,-100,100);addNpcMemory(n,"I helped induct the player into my faction.");addLog(`<strong>FACTION JOINED:</strong> ${escapeHtml(f.name)} now recognises you as one of its own.`,"event");addEvent(`Joined ${f.name}`);} 
    }
    if(action==="npc-threaten"){
      const roll=randInt(1,20)+Math.floor((c.stats.cha+c.stats.str)/5); if(roll>=13){const gold=randInt(3,12);c.gold+=gold;n.relationship=clamp(n.relationship-20,-100,100);addLog(`${escapeHtml(n.name)} backs down and hands over ${gold} gold. Several people nearby notice.`);recordCrime("Extortion",9,true);addNpcMemory(n,"The player threatened me for money.");}else{n.relationship=clamp(n.relationship-12,-100,100);addLog(`${escapeHtml(n.name)} refuses to be intimidated and calls for help.`);recordCrime("Threatening behaviour",6,true);maybeLawCheck();}
    }
    if(action==="npc-leave"){addLog(`You end the conversation with ${escapeHtml(n.name)}.`);g.activeNpc=null;}
    if(action!=="npc-work"&&action!=="npc-help")advanceTurn(); saveGame(false); renderGame();
  }

  function buyMarketGood(index) {
    const good=MARKET_GOODS[index]; if(!good||!state.game.marketOpen)return; const price=worldPrice(good);
    if(state.character.gold<price){showToast(`You need ${price} gold.`);return;}
    state.character.gold-=price; state.character.inventory.push(good.item); const merchant=factionForType(state.game.kingdomId,"merchant"); if(merchant)changeFactionRep(merchant.id,1); addLog(`You buy <strong>${escapeHtml(good.name)}</strong> for ${price} gold.`); advanceTurn(); saveGame(false); renderGame();
  }

  function sellMarketGood(index) {
    const good=MARKET_GOODS[index]; if(!good||!state.game.marketOpen)return;
    const invIndex=state.character.inventory.indexOf(good.item); if(invIndex<0){showToast("You do not own that item.");return;}
    const price=Math.max(1,Math.floor(worldPrice(good)*.55));state.character.inventory.splice(invIndex,1);state.character.gold+=price;const merchant=factionForType(state.game.kingdomId,"merchant");if(merchant)changeFactionRep(merchant.id,1);addLog(`You sell <strong>${escapeHtml(good.name)}</strong> for ${price} gold.`);advanceTurn();saveGame(false);renderGame();
  }

  function crimeAction(action) {
    const c=state.character,g=state.game; if(action==="crime-leave"){g.crimeMenu=false;addLog(`You decide against committing a crime.`);return renderGame();}
    const skill=Number(c.skills?.Thievery||0); let diff=11,reward=[4,12],severity=5,label="Pickpocketing";
    if(action==="crime-burglary"){diff=14;reward=[15,35];severity=10;label="Burglary";}
    if(action==="crime-robbery"){diff=16;reward=[28,65];severity=18;label="Robbery";}
    const roll=randInt(1,20)+Math.floor(c.stats.dex/4)+Math.floor(skill/10); const success=roll>=diff; const witnessed=Math.random()<(success?.35:.85);
    if(success){const gold=randInt(reward[0],reward[1]);c.gold+=gold;addLog(`The ${label.toLowerCase()} succeeds and you gain <strong>${gold} gold</strong>. ${witnessed?"Someone saw enough to report you.":"You appear to get away unseen."}`);recordCrime(label,severity,witnessed);const under=state.world.factions.find(f=>f.type==="underworld");if(under)changeFactionRep(under.id,3);}
    else{addLog(`The ${label.toLowerCase()} goes wrong. A witness raises the alarm.`);recordCrime(`Failed ${label}`,severity+7,true);}
    g.crimeMenu=false; advanceTurn(); maybeLawCheck(); saveGame(false); renderGame();
  }

  function lawAction(action) {
    const c=state.character,g=state.game,kid=g.kingdomId,bounty=currentBounty(kid);
    if(action==="law-pay"){
      if(bounty<=0){g.lawEncounter=null;return renderGame();}
      if(c.gold<bounty){addLog(`You cannot pay the ${bounty} gold bounty.`);return renderGame();}
      c.gold-=bounty;g.bounties[kid]=0;g.crimeHeat[kid]=Math.max(0,currentHeat(kid)-30);g.lawEncounter=null;addLog(`You pay ${bounty} gold in fines. The immediate warrant is cleared, though your reputation remains.`);changeKingdomRep(kid,-1);
    }
    if(action==="law-surrender"){
      const taken=Math.min(c.gold,Math.max(5,bounty));c.gold-=taken;g.bounties[kid]=Math.max(0,bounty-taken);g.crimeHeat[kid]=Math.max(5,currentHeat(kid)-40);g.lawEncounter=null;advanceWorldDay(1);g.time="Morning";addLog(`You surrender. After a night in custody and ${taken} gold confiscated, you are released.`);changeKingdomRep(kid,-2);
    }
    if(action==="law-run"){
      const roll=randInt(1,20)+Math.floor(c.stats.dex/4);if(roll>=15){g.lawEncounter=null;g.crimeHeat[kid]=clamp(currentHeat(kid)+5,0,100);addLog(`You lose the patrol in a maze of streets. Your description will spread further.`);}else{g.lawEncounter=null;recordCrime("Fleeing the watch",8,true);addLog(`The patrol catches up and draws weapons.`);startCombat(GUARD_ENCOUNTER,"town");}
    }
    if(action==="law-resist"){g.lawEncounter=null;recordCrime("Resisting arrest",20,true);addLog(`You refuse to surrender. Steel leaves scabbards.`);startCombat(GUARD_ENCOUNTER,"town");}
    saveGame(false);renderGame();
  }

  function addEnemyStatus(name, turns=1) {
    const e = state.game.combat;
    if (!e) return;
    const existing = e.statuses.find(s => s.name === name);
    if (existing) existing.turns = Math.max(existing.turns, turns);
    else e.statuses.push({name, turns});
  }

  function hasEnemyStatus(name) {
    const e = state.game.combat;
    return !!e?.statuses?.some(s => s.name === name && s.turns > 0);
  }

  function tickEnemyStatuses() {
    const e = state.game.combat;
    if (!e) return;
    e.statuses.forEach(s => s.turns--);
    e.statuses = e.statuses.filter(s => s.turns > 0);
  }

  function randomCombatBeat() {
    const e = state.game.combat;
    if (!e || Math.random() > .28) return;
    const context = e.context;
    const beats = context === "town" ? [
      "A bystander shouts and scrambles clear, knocking over a stool.",
      "Loose rubbish skitters across the street under your feet.",
      "A doorway slams nearby as people retreat from the fight.",
      "The fight shifts dangerously close to a wall and narrow alley."
    ] : context === "road" ? [
      "Loose gravel shifts beneath both of you.",
      "A gust catches dust from the road and briefly obscures the ground.",
      "The fight drifts toward the ditch at the edge of the road.",
      "A startled horse pulls at its tether nearby."
    ] : [
      "Uneven ground forces both of you to adjust your footing.",
      "Branches and loose stones make the next movement harder to read.",
      "The fight shifts around a patch of broken ground.",
      "For a second, the terrain gives you both a new angle of attack."
    ];
    addLog(`<strong>Battlefield:</strong> ${pick(beats)}`, "system");
  }

  function enemyTurn() {
    const c = state.character;
    const e = state.game.combat;
    if (!e) return;

    randomCombatBeat();

    if (hasEnemyStatus("staggered") && Math.random() < .65) {
      addLog(`The ${e.name} is still staggered and loses its chance to attack.`);
      tickEnemyStatuses();
      return;
    }

    const attackType = pick(e.attacks || ["strike"]);
    const target = pick(BODY_PARTS);
    let enemyDamage = randInt(e.dmg[0], e.dmg[1]) + Math.floor(e.level / 2);

    if (hasEnemyStatus("blinded")) {
      enemyDamage = Math.max(1, Math.floor(enemyDamage * .55));
      addLog(`The ${e.name} attacks through impaired vision.`);
    }

    if (e.defending) {
      enemyDamage = Math.max(1, Math.floor(enemyDamage * .42));
      e.defending = false;
    }

    const activeComp=(c.companions||[]).filter(x=>x.active!==false&&x.hp>0);
    if(activeComp.length && Math.random()<.16){
      const comp=pick(activeComp);
      const cdmg=Math.max(1,Math.round(enemyDamage*.85));
      comp.hp=Math.max(0,comp.hp-cdmg);
      comp.morale=clamp((comp.morale||60)-5,0,100);
      addLog(`The ${e.name} turns on <strong>${escapeHtml(comp.name)}</strong> and deals ${cdmg} damage.${comp.hp<=0?` ${escapeHtml(comp.name)} collapses and can no longer fight.`:""}`);
      tickEnemyStatuses();
      return;
    }

    if(state.game.magicWard>0){
      const reduced=Math.max(1,Math.round(enemyDamage*(1-state.game.magicWard)));
      addLog(`Your magical ward absorbs part of the blow, reducing ${enemyDamage} damage to ${reduced}.`,"system");
      enemyDamage=reduced;
      state.game.magicWard=0;
    }

    const injuryChance = Math.min(.42, .08 + enemyDamage / Math.max(30, c.maxHp) + state.worldConfig.danger * .025);
    let injuryText = "";

    if (Math.random() < injuryChance) {
      let severity = enemyDamage >= Math.max(10, c.maxHp * .18) ? "severe" : "minor";
      const catastrophic = SEVERABLE.includes(target) && enemyDamage >= Math.max(14, c.maxHp * .22) && Math.random() < .12;
      if (catastrophic) severity = "severed";
      applyInjury(target, severity, `${e.name} ${attackType}`);
      if (catastrophic) {
        injuryText = ` The blow catastrophically destroys your <strong>${target}</strong>; it is completely unusable and cannot recover through ordinary rest.`;
      } else if (severity === "severe") {
        injuryText = ` Your <strong>${target}</strong> is badly injured and becomes difficult or impossible to use.`;
      } else {
        injuryText = ` Your <strong>${target}</strong> is hurt.`;
      }
    }

    c.hp -= enemyDamage;
    addLog(`The ${e.name} uses a ${attackType}, hitting your ${target} for <strong>${enemyDamage} damage</strong>.${injuryText}`);

    tickEnemyStatuses();

    if (c.hp <= 0) {
      c.hp = Math.max(1, Math.floor(c.maxHp * .25));
      const lost = Math.min(c.gold, Math.max(2, Math.floor(c.gold * .18)));
      c.gold -= lost;
      state.game.combat = null;
      state.world.day += 1;
      state.game.time = "Morning";
      addLog(`You collapse. Hours later, you wake after being dragged from danger. You have ${c.hp} HP, ${lost} gold is missing, and your injuries remain.`, "event");
      addEvent("Defeated in combat");
      return;
    }
  }

  function combatAction(action) {
    const c = state.character;
    const e = state.game.combat;
    if (!e) return;

    const block = actionBlockedByInjury(action === "combat-flee" ? "flee" : action === "combat-power" ? "power" : "attack");
    if (block && action !== "combat-flee") {
      addLog(`<strong>Injury:</strong> ${block}`, "system");
      renderGame();
      return;
    }

    let playerDamage = 0;
    let text = "";

    if (action === "combat-attack") {
      const armPenalty = hasSevereInjury("right arm") || hasSevereInjury("left arm") ? 0.72 : 1;
      playerDamage = Math.max(1, Math.round((randInt(5, 10) + Math.floor(c.stats.str / 3) + c.level) * armPenalty));
      e.hp -= playerDamage;
      text = `You strike the ${e.name} for <strong>${playerDamage} damage</strong>.`;
      e.lastPlayerAction = "direct attack";
    }

    if (action === "combat-power") {
      const primary = c.className === "Mage" ? c.stats.int : c.className === "Ranger" || c.className === "Rogue" ? c.stats.dex : c.stats.str;
      playerDamage = randInt(8, 14) + Math.floor(primary / 2) + c.level;
      e.hp -= playerDamage;
      text = `You use <strong>${CLASSES[c.className]?.skill || state.character.customClass?.technique || "your technique"}</strong>, dealing <strong>${playerDamage} damage</strong>.`;
      e.lastPlayerAction = "special technique";
    }

    if (action === "combat-defend") {
      e.defending = true;
      text = `You brace, shift your footing and prepare for the enemy's next move.`;
      e.lastPlayerAction = "defend";
    }

    if (action === "combat-flee") {
      let chance = .34 + c.stats.dex * .025;
      if (hasSevereInjury("left leg") || hasSevereInjury("right leg")) chance *= .45;
      if (hasSevereInjury("left leg") && hasSevereInjury("right leg")) chance = .03;
      if (Math.random() < chance) {
        addLog(`You break away from the ${e.name} and escape.`);
        addEvent(`Escaped ${e.name}`);
        state.game.combat = null;
        advanceTurn();
        saveGame(false);
        renderGame();
        return;
      }
      text = `You try to flee, but your escape fails${block ? ` — ${block}` : ""}.`;
      e.lastPlayerAction = "failed flee";
    }

    addLog(text);

    if (e.hp <= 0) {
      finishCombatVictory();
      return;
    }

    if (companionAssist()) {
      if (e.hp <= 0) { finishCombatVictory(); return; }
    }
    enemyTurn();
    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function finishCombatVictory() {
    const c = state.character;
    const e = state.game.combat;
    if (!e) return;
    const gold = randInt(e.gold[0], e.gold[1]);
    addLog(`The <strong>${e.name}</strong> falls. You gain <strong>${e.xp} XP</strong>${gold ? ` and <strong>${gold} gold</strong>` : ""}.`, "event");
    c.gold += gold;
    awardXp(e.xp);
    awardCraftingLoot(e);
    addEvent(`Defeated ${e.name}`);
    if (e.name !== "Town Guard") progressQuests("combat",1);
    if (e.name === "Town Guard") recordCrime("Violence against the watch", 25, true);
    if (e.npcId) {
      const victim=state.world.npcs.find(n=>n.id===e.npcId);
      if(victim){victim.dead=true;victim.memory.push({day:state.world.day,text:"I was killed by the player."});}
      recordCrime(`Killing of ${e.name}`,30,true);
      addEvent(`${e.name} was killed`);
    }
    state.game.combat = null;
    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function doCombatCustomAction(rawOverride=null, suppressInputLog=false) {
    const input = document.getElementById("combatCustomAction");
    const raw = String(rawOverride ?? input?.value ?? "").trim();
    if (!raw) return;

    const c = state.character;
    const e = state.game.combat;
    if (!e) return;
    const text = raw.toLowerCase();

    if (!suppressInputLog) addLog(`<strong>You attempt:</strong> ${escapeHtml(raw)}`, "system");

    let difficulty = 11;
    let stat = c.stats.dex;
    let successText = "";
    let failText = "";
    let damage = 0;
    let control = false;
    let successStatus = null;

    if (/\b(kick|trip|sweep|knee|leg)\b/.test(text)) {
      if (hasSevereInjury("left leg") && hasSevereInjury("right leg")) {
        addLog(`You cannot perform that action: both legs are unusable.`, "system");
        renderGame();
        return;
      }
      stat = Math.max(c.stats.str, c.stats.dex);
      difficulty = 12 + e.level;
      successText = `Your improvised leg attack disrupts the ${e.name}'s balance.`;
      failText = `The ${e.name} reads the movement and keeps its footing.`;
      damage = randInt(2,6) + Math.floor(stat/5);
      control = true;
    } else if (/\b(dirt|sand|eyes|blind)\b/.test(text)) {
      stat = c.stats.dex;
      difficulty = 12;
      successText = `The ${e.name} recoils, vision disrupted.`;
      failText = `The trick misses and the ${e.name} presses in.`;
      control = true;
    } else if (/\b(climb|cart|table|wall|roof|higher ground)\b/.test(text)) {
      stat = c.stats.dex;
      difficulty = 10 + (hasSevereInjury("left leg") || hasSevereInjury("right leg") ? 5 : 0);
      successText = `You gain better positioning and force the ${e.name} to adjust.`;
      failText = `You fail to gain useful ground before the ${e.name} closes in.`;
      control = true;
    } else if (/\b(stab|slash|cut|strike|hit|smash)\b/.test(text)) {
      if (hasSevereInjury("right arm") && hasSevereInjury("left arm")) {
        addLog(`You cannot make an effective weapon attack: both arms are unusable.`, "system");
        renderGame();
        return;
      }
      stat = Math.max(c.stats.str, c.stats.dex);
      difficulty = 10 + e.level;
      successText = `Your targeted attack lands cleanly.`;
      failText = `The ${e.name} avoids the targeted strike.`;
      damage = randInt(5,11) + Math.floor(stat/4);
    } else if (/\b(grab|wrestle|pin|choke|shove)\b/.test(text)) {
      stat = c.stats.str;
      difficulty = 12 + e.level;
      successText = `You overpower the ${e.name} momentarily and control the exchange.`;
      failText = `The ${e.name} breaks your grip before you can control it.`;
      damage = randInt(1,4);
      control = true;
      successStatus = "staggered";
    } else {
      stat = Math.max(c.stats.dex, c.stats.int, c.stats.str);
      difficulty = 13;
      successText = `The improvised action works well enough to create an advantage.`;
      failText = `The idea does not work as intended, and the ${e.name} reacts quickly.`;
      control = true;
    }

    const roll = randInt(1,20) + Math.floor(stat/4);
    if (roll >= difficulty) {
      if (damage) e.hp -= damage;
      addLog(`${successText}${damage ? ` You deal <strong>${damage} damage</strong>.` : ""}`);
      if (successStatus) addEnemyStatus(successStatus, successStatus === "blinded" ? 2 : 1);
      else if (control) e.defending = true;
      e.lastPlayerAction = raw;
    } else {
      addLog(failText);
    }

    if (e.hp <= 0) {
      finishCombatVictory();
      return;
    }

    if (companionAssist()) {
      if (e.hp <= 0) { finishCombatVictory(); return; }
    }
    enemyTurn();
    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function doCustomAction(rawOverride=null, suppressInputLog=false) {
    const input = document.getElementById("customAction");
    const raw = String(rawOverride ?? input?.value ?? "").trim();
    if (!raw) return;
    const text = raw.toLowerCase();

    if (!suppressInputLog) addLog(`<strong>You:</strong> ${escapeHtml(raw)}`, "system");

    if (/\b(inventory|bag|items|equipment)\b/.test(text)) {
      addLog(`You check your belongings: ${state.character.inventory.map(escapeHtml).join(", ")}. You have ${state.character.gold} gold. Condition: ${escapeHtml(describeInjuries())}.`);
    } else if (/\b(regrow|restore limb|restoration magic|regenerate limb)\b/.test(text)) {
      const severed = (state.character.injuries || []).filter(i => i.severity === "severed");
      if (!severed.length) {
        addLog(`You have no severed limb requiring restoration.`);
      } else if (state.worldConfig.magic < 3) {
        addLog(`Magic capable of restoring a lost limb is not readily available in this world. You would need to find an exceptionally powerful healer or artefact.`);
      } else {
        const cost = 120 * severed.length;
        if (state.character.gold < cost) {
          addLog(`Restorative magic is available, but the ritual costs ${cost} gold. You only have ${state.character.gold}.`);
        } else {
          state.character.gold -= cost;
          state.character.injuries = state.character.injuries.filter(i => i.severity !== "severed");
          addLog(`Powerful restorative magic rebuilds the lost limb${severed.length > 1 ? "s" : ""}. The process costs ${cost} gold.`);
          addEvent("Restored a lost limb");
        }
      }
    } else if (/\b(drink|use)\b.*\b(mana draught|mana potion)\b/.test(text)) {
      const idx=state.character.inventory.findIndex(i=>/mana draught|mana potion/i.test(i));
      if(idx<0){addLog(`You do not have a mana draught.`);}else{state.character.inventory.splice(idx,1);const amount=Math.max(10,Math.round(state.character.maxMana*.35));const restored=Math.min(amount,state.character.maxMana-state.character.mana);state.character.mana+=restored;addLog(`You drink a mana draught and recover <strong>${restored} mana</strong>.`);}
    } else if (/\b(drink|use)\b.*\b(healing draught|healing potion|potion)\b/.test(text)) {
      const idx=state.character.inventory.findIndex(i=>/healing draught|healing potion/i.test(i));
      if(idx<0){addLog(`You do not have a healing draught.`);}else{state.character.inventory.splice(idx,1);const amount=Math.max(12,Math.round(state.character.maxHp*.28));const healed=Math.min(amount,state.character.maxHp-state.character.hp);state.character.hp+=healed;addLog(`You drink a healing draught and recover <strong>${healed} HP</strong>. It cannot restore a severed limb.`);}
    } else if (/\b(healer|doctor|physician|temple|heal injury|treat injury)\b/.test(text)) {
      const severed = (state.character.injuries || []).filter(i => i.severity === "severed");
      const severe = (state.character.injuries || []).filter(i => i.severity === "severe");
      const minor = (state.character.injuries || []).filter(i => i.severity === "minor");
      const cost = severe.length * 25 + minor.length * 6;
      if (!severed.length && !severe.length && !minor.length) {
        addLog(`You look for treatment, but you have no injuries that require care.`);
      } else if (cost === 0 && severed.length) {
        addLog(`A local healer can stabilise the wound, but ordinary treatment cannot restore a missing limb. Powerful restorative magic would be required.`);
      } else if (state.character.gold < cost) {
        addLog(`A local healer can treat your injuries for ${cost} gold, but you only have ${state.character.gold}.`);
      } else {
        state.character.gold -= cost;
        state.character.injuries = state.character.injuries.filter(i => i.severity === "severed");
        state.character.hp = Math.max(state.character.hp, Math.round(state.character.maxHp * .75));
        addLog(`You receive proper treatment for ${cost} gold. Minor and severe injuries are treated.${severed.length ? " Severed limbs remain missing and require powerful restorative magic." : ""}`);
        addEvent("Received medical treatment");
      }
    } else if (/\b(rest|sleep|camp)\b/.test(text)) {
      state.character.hp = Math.min(state.character.maxHp, state.character.hp + Math.round(state.character.maxHp * .3));
      state.character.mana = state.character.maxMana || state.character.mana || 0;
      state.game.time = "Morning";
      advanceWorldDay(1);
      addLog(`You find somewhere reasonably safe and rest until morning. The world continues to change while you sleep.`);
    } else if (/\b(tavern|inn|ale|drink)\b/.test(text)) {
      const npc = generateNpc();
      state.game.activeNpc = npc;
      addLog(`You head for the nearest tavern. Inside, smoke and conversation fill the room. ${npc.name}, a ${npc.occupation}, catches your attention near the hearth.`);
    } else if (state.game.activeNpc && /\b(attack|punch|stab|slash|hit|strike|kill|choke|kick)\b/.test(text)) {
      const n=state.game.activeNpc;
      n.relationship=-100;
      addNpcMemory(n,"The player attacked me.");
      const hostile={name:n.name,level:Math.max(1,state.character.level),hp:30+state.character.level*7,dmg:[4+Math.floor(state.character.level/2),8+state.character.level],xp:28+state.character.level*8,gold:[2,14],attacks:["punch","slash","grapple","kick"]};
      state.game.activeNpc=null;
      startCombat(hostile,"town");
      state.game.combat.npcId=n.id;
      recordCrime(`Assault on ${n.name}`,14,true);
      addLog(`Your action turns the encounter with <strong>${escapeHtml(n.name)}</strong> into a fight.`,"event");
    } else if (/\b(attack|fight|hunt|kill)\b/.test(text)) {
      addLog(`You go looking for a fight. It does not take long.`);
      startCombat();
    } else if (/\b(travel|leave|road|north|south|east|west|journey)\b/.test(text)) {
      const newPlace = settlementName(Math.random);
      addLog(`You act on the decision and take to the road. Several hours later you reach <strong>${newPlace}</strong>.`);
      state.game.location = newPlace;
      state.game.areaType = "town";
      awardXp(8);
      progressQuests("travel",1);
    } else if (/\b(talk|speak|ask|person|local|guard|merchant)\b/.test(text)) {
      const npc = generateNpc();
      state.game.activeNpc = npc;
      addLog(`You seek someone out and meet <strong>${npc.name}</strong>, a ${npc.occupation} who seems ${npc.personality}.`);
    } else if (/\b(property|house|home|workshop|manor|farmstead|buy a house|buy house)\b/.test(text)) {
      state.game.propertyMenu = true;
      addLog(`You look into property and holdings available in ${escapeHtml(state.game.location)}.`);
    } else if (/\b(craft|crafting|forge|smith|brew|alchemy)\b/.test(text)) {
      state.game.craftingMenu = true;
      addLog(`You prepare your tools and review what you can make from your materials.`);
    } else if (/\b(spell|magic|grimoire|mana|learn magic)\b/.test(text)) {
      state.game.magicMenu = true;
      addLog(`You focus on your magical knowledge and available spells.`);
    } else if (/\b(dungeon|crypt|cave|catacomb|tomb|ancient ruin)\b/.test(text)) {
      state.game.dungeonMenu = true;
      addLog(`You look for dangerous places worth exploring beneath or beyond the settlement.`);
    } else if (/\b(court|politics|nobles|royal court|petition ruler)\b/.test(text)) {
      state.game.politicsMenu = true;
      addLog(`You turn your attention toward the local court and its political struggles.`);
    } else if (/\b(search|explore|look|investigate|woods|forest|ruin)\b/.test(text)) {
      if (!maybeEncounter()) {
        addLog(`You follow through on your plan. After a careful search, you uncover signs that someone passed through recently: boot prints, ash from a small fire and a strip of dark cloth caught on a thorn.`);
        awardXp(7);
        progressQuests("explore",1);
      }
    } else if (/\b(steal|pickpocket|rob|burglary|break in|shoplift)\b/.test(text)) {
      state.game.crimeMenu = true;
      addLog(`You start looking for a criminal opportunity. Choose how far you want to take it.`);
    } else if (/\b(market|shop|buy|merchant stall)\b/.test(text)) {
      state.game.marketOpen = true;
      addLog(`You head toward the local market.`);
    } else if (/\b(quest|contract|job board|work)\b/.test(text)) {
      generateQuestOffer();
      addLog(`You ask around for serious work and receive a contract offer.`);
    } else {
      const generic = [
        `You attempt it. Nothing in the world prevents you, though the immediate result is less dramatic than you hoped. The action changes how you spend the next part of the day.`,
        `You carry out the plan as far as the circumstances allow. A few locals notice, but none interfere.`,
        `You commit to the action. It does not produce an immediate reward, but it gives you a better sense of your surroundings.`
      ];
      addLog(pick(generic));
      awardXp(3);
    }

    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function showWorldLedger() {
    ensureV2Data();
    const wrap=document.createElement("div");wrap.className="modal-backdrop";
    const tabs=["overview","kingdoms","factions","quests","contacts","economy","events"];
    function body(tab){
      const k=currentKingdom();
      if(tab==="overview") return `<div class="ledger-grid"><div class="ledger-stat"><span>Renown</span><strong>${state.character.renown||0}</strong></div><div class="ledger-stat"><span>Infamy</span><strong>${state.character.infamy||0}</strong></div><div class="ledger-stat"><span>Local status</span><strong>${legalStatus()}</strong></div><div class="ledger-stat"><span>Local bounty</span><strong>${currentBounty()}g</strong></div></div><div class="ledger-section"><h3>${escapeHtml(k.name)}</h3><p>${k.rulerTitle} ${escapeHtml(k.ruler)} • Prosperity ${k.prosperity}/100 • Stability ${k.stability}/100 • Treasury ${k.treasury}g</p><p>Your standing: <strong>${reputationLabel(k.playerRep)} (${k.playerRep})</strong>.</p></div>`;
      if(tab==="kingdoms") return state.world.kingdoms.map(x=>`<div class="ledger-row"><div><strong>${escapeHtml(x.name)}</strong><small>${x.rulerTitle} ${escapeHtml(x.ruler)} • ${escapeHtml(x.capital)}</small></div><div class="ledger-tags"><span>${reputationLabel(x.playerRep)} ${x.playerRep}</span><span>P ${x.prosperity}</span><span>S ${x.stability}</span>${x.id!==state.game.kingdomId?`<span>${relationLabel(currentKingdom().relations[x.id]||0)}</span>`:""}${x.wars.length?`<span class="bad-tag">WAR</span>`:""}</div></div>`).join("");
      if(tab==="factions") return state.world.factions.map(f=>`<div class="ledger-row"><div><strong>${escapeHtml(f.name)}</strong><small>${titleCase(f.type)} • Leader ${escapeHtml(f.leader)} • ${escapeHtml(kingdomById(f.kingdomId)?.name||"Independent")}</small></div><div class="ledger-tags"><span>${reputationLabel(f.playerRep)} ${f.playerRep}</span>${f.joined?`<span>MEMBER</span>`:""}<span>Power ${f.power}</span></div></div>`).join("");
      if(tab==="quests") {const qs=state.world.quests;return qs.length?qs.slice().reverse().map(q=>`<div class="ledger-row"><div><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(q.description)}</small></div><div class="ledger-tags"><span>${titleCase(q.status)}</span><span>${q.progress}/${q.goal}</span><span>${q.rewardGold}g</span></div></div>`).join(""):`<p class="empty-copy">No contracts recorded yet.</p>`;}
      if(tab==="contacts") {const ns=state.world.npcs;return ns.length?ns.slice().reverse().map(n=>`<div class="ledger-row"><div><strong>${escapeHtml(n.name)}</strong><small>${escapeHtml(n.occupation)} • ${escapeHtml(n.location)}${n.memory?.length?` • ${escapeHtml(n.memory[n.memory.length-1].text)}`:""}</small></div><div class="ledger-tags"><span>${reputationLabel(n.relationship)} ${n.relationship}</span></div></div>`).join(""):`<p class="empty-copy">You have not formed any lasting contacts yet.</p>`;}
      if(tab==="economy") return `<div class="ledger-section"><h3>${escapeHtml(k.name)} market</h3><p>General price index: <strong>x${Number(k.market.index).toFixed(2)}</strong>. War and shortages alter individual categories.</p></div>${MARKET_GOODS.map(g=>`<div class="ledger-row"><div><strong>${escapeHtml(g.name)}</strong><small>${titleCase(g.category)}</small></div><div class="ledger-tags"><span>${worldPrice(g,k)}g</span></div></div>`).join("")}`;
      if(tab==="events") return state.world.events.length?state.world.events.slice().reverse().map(e=>`<div class="ledger-row"><div><strong>${escapeHtml(e.date)}</strong><small>${escapeHtml(e.text)}</small></div></div>`).join(""):`<p class="empty-copy">No major world events have occurred since your adventure began.</p>`;
      return "";
    }
    function paint(tab){state.game.ledgerTab=tab;wrap.innerHTML=`<div class="modal ledger-modal" role="dialog" aria-modal="true"><div class="ledger-head"><div><div class="eyebrow">Living world</div><h2>World Ledger</h2></div><button class="ghost-button" id="ledgerClose">Close</button></div><div class="ledger-tabs">${tabs.map(t=>`<button type="button" data-ledger="${t}" class="${t===tab?"active":""}">${titleCase(t)}</button>`).join("")}</div><div class="ledger-body">${body(tab)}</div></div>`;wrap.querySelector("#ledgerClose").addEventListener("click",()=>wrap.remove());wrap.querySelectorAll("[data-ledger]").forEach(b=>b.addEventListener("click",()=>paint(b.dataset.ledger)));}
    document.body.appendChild(wrap);wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});paint(state.game.ledgerTab||"overview");
  }


  // ============================
  // V3 — DEEP SIMULATION
  // ============================

  const PROPERTY_TYPES = [
    {id:"room", name:"Permanent Rooms", price:45, income:0, prestige:0, desc:"A secure rented suite and a reliable place to recover."},
    {id:"cottage", name:"Town Cottage", price:120, income:1, prestige:1, desc:"A modest home that establishes you as a local resident."},
    {id:"workshop", name:"Craft Workshop", price:280, income:7, prestige:2, desc:"A workshop that produces modest daily income and supports crafting."},
    {id:"farmstead", name:"Farmstead", price:430, income:11, prestige:3, desc:"Land, storage and workers producing food and steady income."},
    {id:"shop", name:"Merchant Shop", price:520, income:15, prestige:4, desc:"A staffed shop whose earnings respond to the local economy."},
    {id:"manor", name:"Manor House", price:900, income:8, prestige:10, desc:"A prestigious estate with servants, storage and political weight."}
  ];

  const SPELL_LIBRARY = [
    {id:"arcane_bolt", name:"Arcane Bolt", school:"Arcane", tier:1, cost:6, type:"damage", power:10, desc:"A compact bolt of magical force."},
    {id:"ward", name:"Aegis Ward", school:"Abjuration", tier:1, cost:8, type:"ward", power:45, desc:"Reduce the next incoming attack."},
    {id:"mend", name:"Mend Flesh", school:"Restoration", tier:1, cost:10, type:"heal", power:24, desc:"Restore health and sometimes ease a minor injury."},
    {id:"flame_lance", name:"Flame Lance", school:"Pyromancy", tier:2, cost:12, type:"damage", power:18, desc:"A focused lance of fire with high damage."},
    {id:"frost_bind", name:"Frost Bind", school:"Cryomancy", tier:2, cost:11, type:"control", power:9, desc:"Damage and stagger a target with constricting frost."},
    {id:"blink", name:"Blink", school:"Spatial", tier:2, cost:9, type:"blink", power:0, desc:"Shift a short distance instantly and disrupt an enemy's attack."},
    {id:"chain_lightning", name:"Chain Lightning", school:"Storm", tier:4, cost:21, type:"damage", power:31, desc:"Violent high-tier lightning magic."},
    {id:"raise_skeleton", name:"Raise Skeleton", school:"Necromancy", tier:3, cost:18, type:"summon", power:7, desc:"Raise a temporary skeletal servant for several combat turns."}
  ];

  const CRAFT_RECIPES = [
    {id:"salve", name:"Healing Draught", output:"Healing Draught", materials:{"Herbs":2,"Crystal Shard":1}, desc:"Restorative medicine."},
    {id:"mana", name:"Mana Draught", output:"Mana Draught", materials:{"Herbs":1,"Arcane Dust":2}, desc:"Restores magical energy."},
    {id:"blade", name:"Forged Shortsword", output:"Forged Shortsword", materials:{"Iron Scrap":3,"Leather":1}, desc:"A dependable forged weapon."},
    {id:"armour", name:"Reinforced Leather", output:"Reinforced Leather Armour", materials:{"Leather":3,"Iron Scrap":1}, desc:"Flexible reinforced protection."},
    {id:"bone_charm", name:"Bone Ward Charm", output:"Bone Ward Charm", materials:{"Bone":2,"Arcane Dust":1}, desc:"A charm made from monster remains and arcane dust."},
    {id:"lockset", name:"Lockpick Set", output:"Lockpicks", materials:{"Iron Scrap":1}, desc:"Simple tools for locks and mechanisms."}
  ];

  const DUNGEON_PREFIX = ["Sunken","Forsaken","Black","Whispering","Ashen","Buried","Hollow","Blood","Silver","Forgotten","Shattered","Moonlit"];
  const DUNGEON_SUFFIX = ["Crypt","Vault","Catacombs","Barrow","Sanctum","Keep","Halls","Depths","Tomb","Caverns"];

  function closeV3Menus(except=null) {
    ["propertyMenu","magicMenu","craftingMenu","dungeonMenu","politicsMenu"].forEach(key => {
      if (key !== except) state.game[key] = false;
    });
  }

  function generateDynasties() {
    const rng = seeded(`${state.world.seed}-dynasties-v3`);
    return state.world.kingdoms.map((k,i) => {
      const surname = (k.ruler || personName(rng)).split(" ").slice(-1)[0];
      const rulerSex = k.rulerTitle === "Queen" ? "Female" : "Male";
      const rulerAge = randInt(30,68,rng);
      const spouseSex = rulerSex === "Female" ? "Male" : "Female";
      const spouse = rng() < .82 ? {name:personName(rng), sex:spouseSex, age:clamp(rulerAge+randInt(-8,8,rng),22,78), health:randInt(55,95,rng)} : null;
      const heirCount = randInt(1,3,rng);
      const heirs = [];
      for(let h=0;h<heirCount;h++){
        const sex = rng()>.5?"Female":"Male";
        heirs.push({name:personName(rng), sex, age:Math.max(1,rulerAge-randInt(18+h*3,34+h*4,rng)), claim:randInt(55,95,rng), relation:randInt(45,85,rng)});
      }
      const d = {
        id:`dyn${i}`, kingdomId:k.id, houseName:`House ${surname}`,
        motto:pick(["Steel Before Fear","From Ash, Strength","Duty Binds the Crown","By Oath and Blood","Wisdom Holds the Realm","No Storm Endures"],rng),
        prestige:randInt(40,90,rng), successionLaw:pick(["Primogeniture","Absolute Primogeniture","Council Selection"],rng),
        ruler:{name:k.ruler,sex:rulerSex,age:rulerAge,health:randInt(60,98,rng)},
        spouse, heirs
      };
      k.dynastyId=d.id;
      return d;
    });
  }

  function initialisePolitics(k, index=0) {
    if (k.politics) return;
    const rng = seeded(`${state.world.seed}-${k.id}-politics-v3-${index}`);
    const roles=["Chancellor","Marshal","Spymaster","Treasurer","Court Mage"];
    k.politics = {
      crownAuthority:randInt(35,80,rng),
      noblePower:randInt(25,75,rng),
      popularSupport:randInt(30,80,rng),
      unrest:clamp(100-k.stability+randInt(-10,10,rng),0,100),
      policy:pick(["Centralisation","Mercantile Expansion","Military Readiness","Religious Concord","Local Autonomy"],rng),
      court:roles.map(role=>({name:personName(rng),role,influence:randInt(35,85,rng),loyalty:randInt(25,90,rng)}))
    };
  }

  function ensureV3Data() {
    if (!state.character || !state.world || !state.game) return;
    const c=state.character,w=state.world,g=state.game;

    c.maxMana ??= Math.max(20, 24 + Number(c.stats?.int||8)*3);
    c.mana ??= c.maxMana;
    c.materials ||= {"Herbs":0,"Leather":0,"Iron Scrap":0,"Arcane Dust":0,"Bone":0,"Crystal Shard":0};
    c.properties ||= [];
    c.companions ||= [];
    c.spells ||= [];

    if (!c.spells.length) {
      const skillNames=Object.keys(c.skills||{}).join(" ").toLowerCase();
      if (/magic|arcana|mage|pyro|frost|necro|healing|spell/.test(skillNames+" "+String(c.className).toLowerCase())) {
        c.spells.push("arcane_bolt","ward");
      }
      if (/fire|pyro/.test(skillNames)) c.spells.push("flame_lance");
      if (/heal|restor/.test(skillNames)) c.spells.push("mend");
      if (/necro/.test(skillNames)) c.spells.push("raise_skeleton");
      c.spells=[...new Set(c.spells)];
    }

    w.dynasties ||= generateDynasties();
    w.kingdoms.forEach((k,i)=>initialisePolitics(k,i));
    w.deepWars ||= [];
    w.warCounter ??= 1;
    w.dungeons ||= [];
    w.dungeonCounter ??= 1;
    w.lastDynastyYear ??= w.year;

    g.propertyMenu ??= false;
    g.magicMenu ??= false;
    g.craftingMenu ??= false;
    g.dungeonMenu ??= false;
    g.politicsMenu ??= false;
    g.dungeonRun ??= null;
    g.magicWard ??= 0;
    g.summon ??= null;
    g.lastPropertyIncomeDay ??= -1;

    syncDeepWars();
  }

  function dynastyForKingdom(kingdomId) {
    return (state.world.dynasties||[]).find(d=>d.kingdomId===kingdomId) || null;
  }

  function syncDeepWars() {
    if (!state.world?.deepWars) return;
    state.world.kingdoms.forEach(a=>{
      (a.wars||[]).forEach(bid=>{
        if(a.id>bid)return;
        const existing=state.world.deepWars.find(w=>w.status==="active"&&((w.a===a.id&&w.b===bid)||(w.a===bid&&w.b===a.id)));
        if(!existing){
          const b=kingdomById(bid); if(!b)return;
          state.world.deepWars.push({
            id:`war${state.world.warCounter++}`,a:a.id,b:b.id,attacker:a.id,defender:b.id,status:"active",
            goal:pick(["Border Claims","Dynastic Claim","Trade Control","Punitive Campaign","Religious Dispute"]),
            score:0,days:0,casualtiesA:0,casualtiesB:0,started:dateStamp()
          });
        }
      });
    });
    state.world.deepWars.forEach(w=>{
      if(w.status!=="active")return;
      const a=kingdomById(w.a),b=kingdomById(w.b);
      if(!a||!b||!a.wars.includes(b.id)||!b.wars.includes(a.id)){
        w.status="ended"; w.ended=dateStamp(); w.outcome=w.outcome||"Negotiated peace";
      }
    });
  }

  function resolveDynastySuccession(d,k) {
    const heir = d.heirs.sort((a,b)=>b.claim-a.claim||b.age-a.age)[0];
    if (heir) {
      d.heirs=d.heirs.filter(h=>h!==heir);
      d.ruler={name:heir.name,sex:heir.sex,age:heir.age,health:randInt(60,95)};
      k.ruler=heir.name;
      k.rulerTitle=heir.sex==="Female"?"Queen":"King";
      k.stability=clamp(k.stability-8,5,100);
      d.prestige=clamp(d.prestige+2,0,100);
      recordWorldEvent(`${k.rulerTitle} ${k.ruler} succeeds to the throne of ${k.name} after the death of the previous ruler.`,[k.id]);
    } else {
      const courtier=pick(k.politics.court);
      d.houseName=`House ${courtier.name.split(" ").slice(-1)[0]}`;
      d.ruler={name:courtier.name,sex:"Unknown",age:randInt(30,60),health:80};
      k.ruler=courtier.name;k.rulerTitle="Sovereign";
      k.stability=clamp(k.stability-18,5,100);
      recordWorldEvent(`With no clear heir, ${courtier.name} seizes the throne of ${k.name}, founding ${d.houseName}.`,[k.id]);
    }
  }

  function deepSimulationTick() {
    ensureV3Data();
    const w=state.world,c=state.character,g=state.game;
    syncDeepWars();

    // Property income
    if (g.lastPropertyIncomeDay !== w.day) {
      let income=0;
      (c.properties||[]).forEach(p=>{
        const base=Number(p.income||0) * Number(p.level||1);
        const k=kingdomById(p.kingdomId);
        const adjusted=Math.max(0,Math.round(base*(k?(.65+k.prosperity/180):1)));
        income+=adjusted;
      });
      if(income>0){
        c.gold+=income;
        addLog(`<strong>Holdings:</strong> Your properties generate ${income} gold in income.`,"system");
      }
      g.lastPropertyIncomeDay=w.day;
    }

    // Active wars
    w.deepWars.filter(x=>x.status==="active").forEach(war=>{
      const a=kingdomById(war.a),b=kingdomById(war.b); if(!a||!b)return;
      war.days++;
      const momentum=(a.strength-b.strength)/18 + randInt(-4,4);
      war.score=clamp(war.score+Math.round(momentum),-100,100);
      const ca=randInt(2,12),cb=randInt(2,12);
      war.casualtiesA+=ca;war.casualtiesB+=cb;
      if(Math.random()<.20) recordWorldEvent(`${a.name} and ${b.name} fight a major engagement in their ${war.goal.toLowerCase()} war. War score: ${war.score>0?"+":""}${war.score}.`,[a.id,b.id]);
      if(war.days>=4 && Math.abs(war.score)>=70){
        const winner=war.score>0?a:b, loser=war.score>0?b:a;
        winner.treasury+=80; loser.treasury=Math.max(0,loser.treasury-100);
        winner.prosperity=clamp(winner.prosperity+3,5,100);loser.stability=clamp(loser.stability-10,5,100);
        winner.wars=winner.wars.filter(id=>id!==loser.id);loser.wars=loser.wars.filter(id=>id!==winner.id);
        winner.relations[loser.id]=-30;loser.relations[winner.id]=-45;
        war.status="ended";war.ended=dateStamp();war.outcome=`${winner.name} victory`;
        recordWorldEvent(`${winner.name} forces ${loser.name} to accept peace after winning the ${war.goal.toLowerCase()} war.`,[winner.id,loser.id]);
      }
    });

    // Politics
    w.kingdoms.forEach(k=>{
      const p=k.politics;
      p.unrest=clamp(p.unrest + (50-k.stability)/25 + randInt(-2,2),0,100);
      p.popularSupport=clamp(p.popularSupport+randInt(-2,2),0,100);
      if(Math.random()<.08){
        const courtier=pick(p.court);
        courtier.influence=clamp(courtier.influence+randInt(-4,6),5,100);
        courtier.loyalty=clamp(courtier.loyalty+randInt(-3,3),0,100);
      }
      if(p.unrest>72 && Math.random()<.08){
        k.stability=clamp(k.stability-5,5,100);
        recordWorldEvent(`Political unrest erupts into demonstrations and street violence in ${k.name}.`,[k.id]);
      }
      if(k.stability<22 && Math.random()<.025){
        const d=dynastyForKingdom(k.id);
        const plotter=pick(p.court);
        if(plotter.loyalty<45){
          k.ruler=plotter.name;k.rulerTitle="Regent";k.stability=30;p.crownAuthority=25;
          if(d){d.houseName=`House ${plotter.name.split(" ").slice(-1)[0]}`;d.ruler={name:plotter.name,sex:"Unknown",age:randInt(30,60),health:75};d.heirs=[];}
          recordWorldEvent(`${plotter.name} leads a palace coup in ${k.name} and takes control of the crown.`,[k.id]);
        }
      }
    });

    // Dynasties age yearly; occasional births/deaths.
    if(w.lastDynastyYear!==w.year){
      const years=Math.max(1,w.year-w.lastDynastyYear);
      w.dynasties.forEach(d=>{
        d.ruler.age+=years;if(d.spouse)d.spouse.age+=years;d.heirs.forEach(h=>h.age+=years);
        const k=kingdomById(d.kingdomId);
        const mortality=clamp((d.ruler.age-55)*.012,0.01,.55);
        if(k && Math.random()<mortality) resolveDynastySuccession(d,k);
      });
      w.lastDynastyYear=w.year;
    }
    w.dynasties.forEach(d=>{
      if(d.spouse && d.ruler.age<52 && d.spouse.age<48 && Math.random()<.003){
        const sex=Math.random()>.5?"Female":"Male";
        const child={name:personName(Math.random),sex,age:0,claim:randInt(45,80),relation:70};
        d.heirs.push(child);
        const k=kingdomById(d.kingdomId);
        recordWorldEvent(`A new child is born into ${d.houseName}${k?` of ${k.name}`:""}.`,k?[k.id]:[]);
      }
    });

    // Companions recover between days.
    (c.companions||[]).forEach(comp=>{
      if(comp.active!==false){
        comp.hp=Math.min(comp.maxHp,comp.hp+Math.round(comp.maxHp*.22));
        comp.morale=clamp((comp.morale||60)+randInt(-1,2),0,100);
      }
    });
  }

  function buyProperty(typeId) {
    const type=PROPERTY_TYPES.find(x=>x.id===typeId); if(!type)return;
    const c=state.character,g=state.game,k=currentKingdom();
    if(c.gold<type.price){showToast(`You need ${type.price} gold.`);return;}
    if(c.properties.some(p=>p.typeId===type.id&&p.location===g.location&&p.kingdomId===k.id)){showToast("You already own that property here.");return;}
    c.gold-=type.price;
    c.properties.push({id:`prop${Date.now()}${Math.floor(Math.random()*999)}`,typeId:type.id,name:type.name,location:g.location,kingdomId:k.id,price:type.price,income:type.income,prestige:type.prestige,level:1});
    c.renown=clamp((c.renown||0)+type.prestige,0,999);
    changeKingdomRep(k.id,Math.max(1,Math.floor(type.prestige/2)));
    addLog(`<strong>PROPERTY PURCHASED:</strong> ${escapeHtml(type.name)} in ${escapeHtml(g.location)} for ${type.price} gold.`,"event");
    addEvent(`Purchased ${type.name} in ${g.location}`);
    saveGame(false);renderGame();
  }

  function recruitActiveNpc() {
    const n=state.game.activeNpc,c=state.character;if(!n)return;
    if(c.companions.filter(x=>x.active!==false).length>=3){addLog(`${escapeHtml(n.name)} cannot join you: you already have three active companions.`);return;}
    if(n.relationship<20){addLog(`${escapeHtml(n.name)} does not trust you enough to travel at your side. Raise the relationship to at least 20.`);return;}
    if(c.companions.some(x=>x.npcId===n.id)){addLog(`${escapeHtml(n.name)} is already one of your companions.`);return;}
    const maxHp=48+Math.max(0,state.character.level-1)*8;
    c.companions.push({npcId:n.id,name:n.name,role:n.occupation,loyalty:clamp(n.relationship+35,0,100),morale:70,hp:maxHp,maxHp,active:true});
    n.companion=true;addNpcMemory(n,"I chose to travel as the player's companion.");
    addLog(`<strong>COMPANION RECRUITED:</strong> ${escapeHtml(n.name)} agrees to travel with you.`,"event");addEvent(`${n.name} became a companion`);
  }

  function companionAssist() {
    const active=(state.character.companions||[]).filter(c=>c.active!==false&&c.hp>0);
    if(!active.length||!state.game.combat)return false;
    const comp=pick(active);
    if(Math.random()>.62)return false;
    const dmg=randInt(3,7)+Math.floor(state.character.level/2);
    state.game.combat.hp-=dmg;
    addLog(`<strong>${escapeHtml(comp.name)}</strong> joins the exchange and deals ${dmg} damage to the ${escapeHtml(state.game.combat.name)}.`);
    return true;
  }

  function awardCraftingLoot(enemy) {
    const m=state.character.materials;
    let loot=null;
    const name=String(enemy?.name||"").toLowerCase();
    if(/wolf|boar|dog/.test(name)) loot=Math.random()<.65?"Leather":null;
    else if(/skeleton/.test(name)) loot=Math.random()<.75?"Bone":null;
    else if(/goblin|bandit|guard|thug|cutpurse/.test(name)) loot=Math.random()<.55?"Iron Scrap":null;
    else loot=Math.random()<.35?"Arcane Dust":null;
    if(loot){const amt=randInt(1,2);m[loot]=(m[loot]||0)+amt;addLog(`<strong>Material:</strong> You recover ${amt} ${loot}.`,"system");}
  }

  function spellById(id){return SPELL_LIBRARY.find(s=>s.id===id)||null;}

  function learnSpell(id) {
    const s=spellById(id);if(!s)return;
    if(state.character.spells.includes(id)){showToast("You already know that spell.");return;}
    if(state.worldConfig.magic<s.tier){showToast(`World magic level ${s.tier} is required.`);return;}
    const cost=25+s.tier*22;
    if(state.character.gold<cost){showToast(`Learning this spell costs ${cost} gold.`);return;}
    state.character.gold-=cost;state.character.spells.push(id);
    addLog(`You spend time and coin studying until <strong>${escapeHtml(s.name)}</strong> becomes a usable spell.`,"event");
    awardXp(8*s.tier);saveGame(false);renderGame();
  }

  function castSpell(id) {
    const s=spellById(id);if(!s||!state.character.spells.includes(id))return;
    const c=state.character,g=state.game;
    if(c.mana<s.cost){showToast(`You need ${s.cost} mana.`);return;}
    c.mana-=s.cost;
    if(g.combat){
      const e=g.combat;
      if(s.type==="damage"){const dmg=s.power+randInt(0,6)+Math.floor(c.stats.int/4);e.hp-=dmg;addLog(`You cast <strong>${s.name}</strong> and deal <strong>${dmg} damage</strong>.`);}
      if(s.type==="control"){const dmg=s.power+randInt(0,4);e.hp-=dmg;addEnemyStatus("staggered",2);addLog(`<strong>${s.name}</strong> bites into the enemy for ${dmg} damage and restricts its movement.`);}
      if(s.type==="ward"){g.magicWard=Math.max(g.magicWard,.45);addLog(`A translucent <strong>${s.name}</strong> settles around you.`);}
      if(s.type==="heal"){const heal=Math.min(c.maxHp-c.hp,s.power+Math.floor(c.stats.int/3));c.hp+=heal;const minor=(c.injuries||[]).find(i=>i.severity==="minor");if(minor)c.injuries=c.injuries.filter(i=>i!==minor);addLog(`<strong>${s.name}</strong> restores ${heal} HP.${minor?` The injury to your ${minor.part} also closes.`:""}`);}
      if(s.type==="blink"){addEnemyStatus("staggered",1);g.magicWard=Math.max(g.magicWard,.65);addLog(`You blink several paces away, forcing the ${e.name} to reacquire you.`);}
      if(s.type==="summon"){g.summon={name:"Raised Skeleton",turns:4,dmg:s.power};addLog(`Bones knit together under your command. A <strong>Raised Skeleton</strong> joins the fight.`);}
      if(e.hp<=0){finishCombatVictory();return;}
      if(g.summon?.turns>0){const sd=randInt(Math.max(1,g.summon.dmg-2),g.summon.dmg+2);e.hp-=sd;g.summon.turns--;addLog(`${g.summon.name} strikes for ${sd} damage.`);if(e.hp<=0){finishCombatVictory();return;}}
      companionAssist();if(e.hp<=0){finishCombatVictory();return;}
      enemyTurn();advanceTurn();saveGame(false);renderGame();return;
    } else {
      if(s.type==="heal"){const heal=Math.min(c.maxHp-c.hp,s.power+Math.floor(c.stats.int/3));c.hp+=heal;const minor=(c.injuries||[]).find(i=>i.severity==="minor");if(minor)c.injuries=c.injuries.filter(i=>i!==minor);addLog(`You cast <strong>${s.name}</strong>, restoring ${heal} HP.${minor?` A minor ${minor.part} injury is also healed.`:""}`);}
      else if(s.type==="blink"){addLog(`Space folds for an instant as you use <strong>${s.name}</strong> to cross the immediate area almost instantly.`);}
      else if(s.type==="summon"){addLog(`You raise a temporary skeletal servant. Without a battle to anchor it, the magic lasts only a short while.`);}
      else if(s.type==="ward"){g.magicWard=Math.max(g.magicWard,.45);addLog(`You surround yourself with an <strong>${s.name}</strong>.`);}
      else addLog(`You cast <strong>${s.name}</strong>. With no hostile target, the magic dissipates into the surroundings.`);
      advanceTurn();saveGame(false);renderGame();
    }
  }

  function craftRecipe(id) {
    const r=CRAFT_RECIPES.find(x=>x.id===id);if(!r)return;
    const mats=state.character.materials;
    const missing=Object.entries(r.materials).filter(([m,n])=>(mats[m]||0)<n);
    if(missing.length){showToast(`Missing: ${missing.map(([m,n])=>`${m} x${n}`).join(", ")}`);return;}
    Object.entries(r.materials).forEach(([m,n])=>mats[m]-=n);
    state.character.inventory.push(r.output);
    addLog(`<strong>CRAFTED:</strong> ${escapeHtml(r.name)}.`,"event");awardXp(8);advanceTurn();saveGame(false);renderGame();
  }

  function generatedDungeonName(rng=Math.random){return `${pick(DUNGEON_PREFIX,rng)} ${pick(DUNGEON_SUFFIX,rng)}`;}

  function createDungeon() {
    const rng=seeded(`${state.world.seed}-dungeon-${state.world.dungeonCounter}-${state.game.kingdomId}-${state.game.location}`);
    const depth=randInt(5,9,rng),rooms=[];
    for(let i=0;i<depth;i++){
      let type=i===0?"entrance":i===depth-1?"boss":pick(["enemy","trap","treasure","shrine","puzzle","enemy"],rng);
      rooms.push({index:i,type,searched:false,resolved:i===0});
    }
    const d={id:`dg${state.world.dungeonCounter++}`,name:generatedDungeonName(rng),kingdomId:state.game.kingdomId,near:state.game.location,depth,rooms,status:"discovered",danger:randInt(1,5,rng)};
    state.world.dungeons.push(d);return d;
  }

  function discoverDungeon() {
    const existing=state.world.dungeons.find(d=>d.kingdomId===state.game.kingdomId&&d.status!=="cleared");
    const d=existing||createDungeon();
    state.game.dungeonMenu=true;
    addLog(`You locate the entrance to <strong>${escapeHtml(d.name)}</strong> near ${escapeHtml(d.near)}. Its ${d.depth} chambers have not been fully explored.`,"event");
    saveGame(false);renderGame();
  }

  function enterDungeon(id) {
    const d=state.world.dungeons.find(x=>x.id===id);if(!d)return;
    state.game.dungeonRun={dungeonId:d.id,roomIndex:0,previousLocation:state.game.location,previousArea:state.game.areaType};
    state.game.dungeonMenu=false;state.game.location=d.name;state.game.areaType="ruin";
    addLog(`You enter <strong>${escapeHtml(d.name)}</strong>. The air changes immediately: colder, stiller and heavy with old dust.`,"event");
    advanceTurn();saveGame(false);renderGame();
  }

  function activeDungeon(){return state.game.dungeonRun?state.world.dungeons.find(d=>d.id===state.game.dungeonRun.dungeonId):null;}

  function dungeonAdvance() {
    const d=activeDungeon(),run=state.game.dungeonRun;if(!d||!run)return;
    if(run.roomIndex>=d.rooms.length-1){
      d.status="cleared";state.character.renown=clamp((state.character.renown||0)+8,0,999);
      const reward=randInt(35,80);state.character.gold+=reward;
      addLog(`<strong>DUNGEON CLEARED:</strong> You secure ${reward} gold worth of treasure and your name spreads among adventurers.`,"event");
      addEvent(`Cleared ${d.name}`);return leaveDungeon(true);
    }
    run.roomIndex++;const room=d.rooms[run.roomIndex];
    addLog(`You push deeper into chamber ${run.roomIndex+1} of ${d.depth}.`,"system");
    if(room.type==="enemy"){room.resolved=true;startCombat(null,"ruin");}
    else if(room.type==="boss"){
      room.resolved=true;
      const boss={name:pick(["Crypt Warden","Barrow Knight","Vault Horror","Ancient Bonekeeper"]),level:Math.max(3,state.character.level+1),hp:55+state.character.level*10,dmg:[7,13],xp:85+state.character.level*10,gold:[18,45],attacks:["crushing strike","grave slash","rune burst"]};
      startCombat(boss,"ruin");addLog(`A <strong>${boss.name}</strong> rises to defend the final chamber.`,"event");
    } else if(room.type==="trap"){
      room.resolved=true;const roll=randInt(1,20)+Math.floor(state.character.stats.dex/4);
      if(roll>=13){addLog(`You notice a trap mechanism just in time and bypass it.`);state.character.materials["Iron Scrap"]++;}
      else{const dmg=randInt(5,13);state.character.hp=Math.max(1,state.character.hp-dmg);addLog(`A hidden trap catches you for <strong>${dmg} damage</strong>.`);}
    } else if(room.type==="treasure"){
      room.resolved=true;const gold=randInt(12,38);state.character.gold+=gold;const mat=pick(["Arcane Dust","Crystal Shard","Iron Scrap"]);state.character.materials[mat]+=randInt(1,2);addLog(`You uncover a cache containing <strong>${gold} gold</strong> and useful crafting materials.`);
    } else if(room.type==="shrine"){
      room.resolved=true;state.character.mana=state.character.maxMana;state.character.hp=Math.min(state.character.maxHp,state.character.hp+15);addLog(`An old shrine still holds a trace of power. Your mana is restored and you recover 15 HP.`);
    } else if(room.type==="puzzle"){
      room.resolved=true;const roll=randInt(1,20)+Math.floor(state.character.stats.int/4);
      if(roll>=13){const dust=randInt(1,3);state.character.materials["Arcane Dust"]+=dust;addLog(`You decipher the mechanism and recover ${dust} Arcane Dust from its sealed compartment.`);}
      else addLog(`The mechanism refuses to yield. You leave it intact rather than risk triggering something worse.`);
    }
    advanceTurn();saveGame(false);renderGame();
  }

  function dungeonSearch() {
    const d=activeDungeon(),run=state.game.dungeonRun;if(!d||!run)return;
    const room=d.rooms[run.roomIndex];
    if(room.searched){addLog(`You have already searched this chamber thoroughly.`);return renderGame();}
    room.searched=true;
    const roll=randInt(1,20)+Math.floor(state.character.stats.wis/4);
    if(roll>=12){
      const mat=pick(["Herbs","Iron Scrap","Bone","Arcane Dust","Crystal Shard","Leather"]);
      const amt=randInt(1,2);state.character.materials[mat]=(state.character.materials[mat]||0)+amt;
      addLog(`A careful search reveals <strong>${amt} ${mat}</strong>.`);
    } else addLog(`You find nothing useful that survived the years.`);
    advanceTurn();saveGame(false);renderGame();
  }

  function leaveDungeon(cleared=false) {
    const run=state.game.dungeonRun;if(!run)return;
    const d=activeDungeon();
    state.game.location=run.previousLocation;state.game.areaType=run.previousArea||"town";state.game.dungeonRun=null;
    addLog(`You leave ${d?escapeHtml(d.name):"the dungeon"} and return toward ${escapeHtml(state.game.location)}.${cleared?" The site is now considered cleared.":""}`,"event");
    saveGame(false);renderGame();
  }

  function politicalAction(kind) {
    const k=currentKingdom(),p=k.politics,c=state.character;
    if(kind==="crown"){
      p.crownAuthority=clamp(p.crownAuthority+3,0,100);p.noblePower=clamp(p.noblePower-1,0,100);changeKingdomRep(k.id,2);
      const crown=factionForType(k.id,"crown");if(crown)changeFactionRep(crown.id,3);
      addLog(`You publicly support the authority of ${k.rulerTitle} ${escapeHtml(k.ruler)}. Crown loyalists take notice.`);
    }
    if(kind==="nobles"){
      p.noblePower=clamp(p.noblePower+3,0,100);p.crownAuthority=clamp(p.crownAuthority-1,0,100);
      addLog(`You spend time cultivating relationships among the nobles of ${escapeHtml(k.name)}.`);
    }
    if(kind==="court"){
      if((c.renown||0)<10){addLog(`You lack enough renown to gain meaningful access to the royal court. Renown 10 is required.`);return renderGame();}
      const roll=randInt(1,20)+Math.floor(c.stats.cha/4)+Math.floor(c.stats.int/6);
      if(roll>=14){c.renown=clamp((c.renown||0)+2,0,999);changeKingdomRep(k.id,3);p.popularSupport=clamp(p.popularSupport+2,0,100);addLog(`You navigate the court successfully, gaining access and political credibility.`);}
      else{changeKingdomRep(k.id,-1);addLog(`Your attempt to influence the court misfires. A few important people now regard you with suspicion.`);}
    }
    advanceTurn();saveGame(false);renderGame();
  }

  function renderRoleplayComposer() {
    return `<div class="rp-composer">
      <div class="rp-help"><strong>Roleplay input</strong><span>Normal text is spoken dialogue. Put actions between <code>**double asterisks**</code>.</span></div>
      <textarea class="textarea rp-input" id="roleplayInput" maxlength="600" placeholder='Example: Stay behind me. **I draw my sword and move toward the doorway.** What did you hear?'></textarea>
      <div class="rp-actions"><span id="rpHint">Dialogue + actions can be mixed in one message.</span><button class="primary-button" id="sendRoleplay" type="button">Send</button></div>
    </div>`;
  }

  function parseRoleplayInput(raw) {
    const segments=[];let last=0;const re=/\*\*([\s\S]*?)\*\*/g;let m;
    while((m=re.exec(raw))){
      const speech=raw.slice(last,m.index).trim();if(speech)segments.push({type:"dialogue",text:speech});
      const action=String(m[1]||"").trim();if(action)segments.push({type:"action",text:action});
      last=re.lastIndex;
    }
    const tail=raw.slice(last).trim();if(tail)segments.push({type:"dialogue",text:tail});
    return segments;
  }

  function proceduralDialogueReply(text) {
    const n=state.game.activeNpc,k=currentKingdom();
    const lower=text.toLowerCase();
    if(n){
      let reply;
      if(/\b(war|battle|army)\b/.test(lower)) reply=k.wars.length?`"${k.name} is at war. People here watch the roads and count every cart of supplies."`:`"No declared war at present, but peace never feels permanent."`;
      else if(/\b(king|queen|ruler|crown|court)\b/.test(lower)) reply=`"${k.rulerTitle} ${k.ruler} rules ${k.name}. Whether that means the ruler controls the court is another question."`;
      else if(/\b(work|job|contract)\b/.test(lower)){generateQuestOffer(n.factionId);reply=`"There is work, actually. Hear the terms before you decide."`;}
      else if(/\b(faction|guild|order)\b/.test(lower)){const f=factionById(n.factionId);reply=f?`"I have ties to ${f.name}. Reputation matters to them more than promises."`:`"I keep clear of the big factions when I can."`;}
      else if(/\b(dungeon|crypt|ruin|tomb)\b/.test(lower)) reply=`"There are old places outside the settled roads. Some are empty. Some are very much not."`;
      else if(/\b(magic|spell|mage)\b/.test(lower)) reply=state.worldConfig.magic>=3?`"Magic is common enough that people know to respect it, even if they don't understand it."`:`"Real spellcasters are rare here. When one appears, people remember."`;
      else reply=pick([`"${text.length>80?"That's quite a story.":"I hear you."} Around here, actions tend to matter longer than words."`,`"Maybe. I'd still watch who you say that around."`,`"I've heard stranger things in ${state.game.location}."`]);
      const polite=/\b(please|thank|sir|madam|friend)\b/.test(lower),hostile=/\b(idiot|kill you|threat|shut up|bastard)\b/.test(lower);
      n.relationship=clamp(n.relationship+(polite?2:0)-(hostile?5:0),-100,100);
      addNpcMemory(n,`The player said: "${text.slice(0,100)}"`);
      addLog(`<strong>${escapeHtml(n.name)}:</strong> ${reply}`,"story");
    } else {
      const comp=(state.character.companions||[]).find(x=>x.active!==false&&x.hp>0);
      if(comp && Math.random()<.7) addLog(`<strong>${escapeHtml(comp.name)}:</strong> "${pick(["I'm listening.","That sounds like a plan.","Just say when.","I don't love it, but I'll follow your lead."])}"`,"story");
      else addLog(`Your words carry into ${escapeHtml(state.game.location)}, heard by whoever happens to be nearby.`,"story");
    }
  }

  function submitRoleplayInput() {
    const box=document.getElementById("roleplayInput");const raw=box?.value.trim();if(!raw)return;
    const segments=parseRoleplayInput(raw);if(!segments.length)return;
    const formatted=segments.map(s=>s.type==="action"?`<span class="rp-action-text">**${escapeHtml(s.text)}**</span>`:`<span class="rp-dialogue-text">${escapeHtml(s.text)}</span>`).join(" ");
    addLog(`<strong>${escapeHtml(state.character.name)}:</strong> ${formatted}`,"roleplay");
    const dialogue=segments.filter(s=>s.type==="dialogue").map(s=>s.text).join(" ").trim();
    const actions=segments.filter(s=>s.type==="action").map(s=>s.text).join(" then ").trim();
    if(dialogue)proceduralDialogueReply(dialogue);

    if(actions){
      const spell=SPELL_LIBRARY.find(s=>actions.toLowerCase().includes(s.name.toLowerCase()));
      if(spell&&state.character.spells.includes(spell.id)){castSpell(spell.id);return;}
      if(state.game.combat){doCombatCustomAction(actions,true);return;}
      doCustomAction(actions,true);return;
    }

    if(state.game.combat){
      addLog(`The ${escapeHtml(state.game.combat.name)} does not wait for the conversation to end.`,"system");
      companionAssist();if(state.game.combat&&state.game.combat.hp<=0){finishCombatVictory();return;}
      enemyTurn();advanceTurn();saveGame(false);renderGame();return;
    }
    advanceTurn();saveGame(false);renderGame();
  }

  // V3 replacement action renderer. The persistent roleplay composer is rendered separately.
  function renderActionArea() {
    const g=state.game,c=state.character;
    if(g.combat){
      const e=g.combat;const known=(c.spells||[]).map(spellById).filter(Boolean);
      return `<div class="combat-box"><h3>${escapeHtml(e.name)} — Lv.${e.level}</h3><div class="hud-row"><span>Enemy HP</span><strong>${e.hp}/${e.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></span></div>${e.statuses?.length?`<div class="character-sub" style="margin-top:8px">Status: ${e.statuses.map(s=>escapeHtml(titleCase(s.name))).join(", ")}</div>`:""}</div>
      <div class="choice-grid"><button class="choice-button" data-action="combat-attack"><strong>Attack</strong><small>Make a direct weapon attack.</small></button><button class="choice-button" data-action="combat-power"><strong>Use Technique</strong><small>${escapeHtml(c.signatureTechnique||"Technique")}</small></button><button class="choice-button" data-action="combat-defend"><strong>Defend</strong><small>Brace for the next attack.</small></button><button class="choice-button" data-action="combat-flee"><strong>Flee</strong><small>Attempt to escape.</small></button></div>
      ${known.length?`<div class="v3-subpanel"><div class="eyebrow">Known magic • ${c.mana}/${c.maxMana} mana</div><div class="spell-buttons">${known.map(s=>`<button type="button" class="ghost-button" data-cast-spell="${s.id}" ${c.mana<s.cost?"disabled":""}>${escapeHtml(s.name)} • ${s.cost}</button>`).join("")}</div></div>`:""}`;
    }
    if(g.lawEncounter) return `<div class="combat-box law-box"><h3>Stopped by the Watch</h3><div class="character-sub">Bounty: ${currentBounty()} gold • Heat: ${currentHeat()}/100</div></div><div class="choice-grid"><button class="choice-button" data-action="law-pay"><strong>Pay bounty</strong><small>Settle what you owe.</small></button><button class="choice-button" data-action="law-surrender"><strong>Surrender</strong><small>Accept detention.</small></button><button class="choice-button" data-action="law-run"><strong>Run</strong><small>Attempt escape.</small></button><button class="choice-button" data-action="law-resist"><strong>Resist</strong><small>Fight the guards.</small></button></div>`;
    if(g.activeQuestOffer){const q=g.activeQuestOffer,f=factionById(q.factionId);return `<div class="quest-offer"><div class="eyebrow">Contract offered${f?` • ${escapeHtml(f.name)}`:""}</div><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description)}</p><div class="reward-line"><span>${q.goal} objective${q.goal!==1?"s":""}</span><strong>${q.rewardGold}g • ${q.rewardXp} XP</strong></div></div><div class="choice-grid"><button class="choice-button" data-action="quest-accept"><strong>Accept contract</strong><small>Add to journal.</small></button><button class="choice-button" data-action="quest-decline"><strong>Decline</strong><small>Leave the offer.</small></button></div>`;}
    if(g.marketOpen){const k=currentKingdom();return `<div class="market-panel"><div class="eyebrow">${escapeHtml(g.location)} market</div><h3>Local prices</h3><div class="market-list">${MARKET_GOODS.map((good,i)=>{const price=worldPrice(good,k),owned=c.inventory.includes(good.item);return `<div class="market-row"><div><strong>${escapeHtml(good.name)}</strong><small>${titleCase(good.category)}${owned?" • Owned":""}</small></div><div class="market-actions"><button type="button" class="secondary-button" data-buy="${i}">Buy ${price}g</button>${owned?`<button type="button" class="ghost-button" data-sell="${i}">Sell ${Math.max(1,Math.floor(price*.55))}g</button>`:""}</div></div>`}).join("")}</div><button type="button" class="ghost-button" data-action="market-leave">Leave market</button></div>`;}
    if(g.crimeMenu) return `<div class="crime-panel"><div class="eyebrow">Underworld</div><h3>Risk and consequence</h3><p>Crimes can earn money but create heat, bounties and hostility.</p></div><div class="choice-grid"><button class="choice-button" data-action="crime-pickpocket"><strong>Pickpocket</strong><small>Lower risk.</small></button><button class="choice-button" data-action="crime-burglary"><strong>Burglary</strong><small>Moderate risk.</small></button><button class="choice-button" data-action="crime-robbery"><strong>Robbery</strong><small>High risk.</small></button><button class="choice-button" data-action="crime-leave"><strong>Back away</strong><small>Commit no crime.</small></button></div>`;
    if(g.travelMenu){const from=currentKingdom();return `<div class="quest-offer"><div class="eyebrow">Travel</div><h3>Choose a destination</h3></div><div class="choice-grid"><button class="choice-button" data-action="travel-local"><strong>Another settlement in ${escapeHtml(from.name)}</strong><small>Short journey.</small></button>${state.world.kingdoms.filter(x=>x.id!==from.id).map(dest=>`<button class="choice-button" data-action="travel-kingdom:${dest.id}"><strong>${escapeHtml(dest.name)}</strong><small>${escapeHtml(dest.capital)} • ${relationLabel(from.relations[dest.id]||0)}${from.wars.includes(dest.id)?" • AT WAR":""}</small></button>`).join("")}<button class="choice-button" data-action="travel-cancel"><strong>Stay here</strong></button></div>`;}

    if(g.propertyMenu){
      const local=c.properties.filter(p=>p.location===g.location&&p.kingdomId===g.kingdomId);
      return `<div class="v3-subpanel"><div class="eyebrow">Property & holdings</div><h3>${escapeHtml(g.location)}</h3><p>${local.length?`You own ${local.length} holding${local.length===1?"":"s"} here.`:"You own no property here yet."}</p><div class="property-grid">${PROPERTY_TYPES.map(t=>`<div class="system-card"><strong>${t.name}</strong><span>${t.desc}</span><small>${t.income}g base daily income • ${t.price}g</small><button type="button" class="secondary-button" data-buy-property="${t.id}" ${c.gold<t.price?"disabled":""}>Buy ${t.price}g</button></div>`).join("")}</div><button class="ghost-button" data-action="v3-close">Back</button></div>`;
    }
    if(g.magicMenu){
      return `<div class="v3-subpanel"><div class="eyebrow">Advanced magic</div><h3>${c.mana}/${c.maxMana} Mana</h3><div class="system-list">${SPELL_LIBRARY.map(s=>{const known=c.spells.includes(s.id),locked=state.worldConfig.magic<s.tier;return `<div class="system-row"><div><strong>${s.name}</strong><small>${s.school} • Tier ${s.tier} • ${s.cost} mana — ${s.desc}</small></div>${known?`<button class="secondary-button" data-cast-spell="${s.id}">Cast</button>`:`<button class="ghost-button" data-learn-spell="${s.id}" ${locked?"disabled":""}>${locked?"Magic too rare":`Learn ${25+s.tier*22}g`}</button>`}</div>`}).join("")}</div><button class="ghost-button" data-action="v3-close">Back</button></div>`;
    }
    if(g.craftingMenu){
      return `<div class="v3-subpanel"><div class="eyebrow">Crafting</div><h3>Materials</h3><div class="material-strip">${Object.entries(c.materials).map(([m,n])=>`<span>${escapeHtml(m)} <strong>${n}</strong></span>`).join("")}</div><div class="system-list">${CRAFT_RECIPES.map(r=>{const req=Object.entries(r.materials).map(([m,n])=>`${m} x${n}`).join(" • ");return `<div class="system-row"><div><strong>${r.name}</strong><small>${r.desc} — ${req}</small></div><button class="secondary-button" data-craft="${r.id}">Craft</button></div>`}).join("")}</div><button class="ghost-button" data-action="v3-close">Back</button></div>`;
    }
    if(g.politicsMenu){
      const k=currentKingdom(),p=k.politics,d=dynastyForKingdom(k.id);
      return `<div class="v3-subpanel"><div class="eyebrow">Court & politics</div><h3>${escapeHtml(k.name)}</h3><div class="ledger-grid"><div class="ledger-stat"><span>Crown authority</span><strong>${p.crownAuthority}</strong></div><div class="ledger-stat"><span>Noble power</span><strong>${p.noblePower}</strong></div><div class="ledger-stat"><span>Popular support</span><strong>${p.popularSupport}</strong></div><div class="ledger-stat"><span>Unrest</span><strong>${Math.round(p.unrest)}</strong></div></div><p>${d?`${escapeHtml(d.houseName)} rules under ${escapeHtml(d.successionLaw)}. Heirs: ${d.heirs.length}.`:""}</p><div class="choice-grid"><button class="choice-button" data-action="politics-crown"><strong>Support the Crown</strong><small>Increase royal authority and crown reputation.</small></button><button class="choice-button" data-action="politics-nobles"><strong>Cultivate Nobles</strong><small>Increase aristocratic influence.</small></button><button class="choice-button" data-action="politics-court"><strong>Influence the Court</strong><small>Requires 10 Renown.</small></button><button class="choice-button" data-action="v3-close"><strong>Leave Court</strong></button></div></div>`;
    }
    if(g.dungeonRun){
      const d=activeDungeon(),room=d?.rooms[g.dungeonRun.roomIndex];
      return `<div class="v3-subpanel dungeon-panel"><div class="eyebrow">Procedural dungeon</div><h3>${escapeHtml(d?.name||"Unknown Dungeon")}</h3><p>Chamber ${g.dungeonRun.roomIndex+1}/${d?.depth||"?"} • ${room?titleCase(room.type):"Unknown"}</p><div class="choice-grid"><button class="choice-button" data-action="dungeon-advance"><strong>Go deeper</strong><small>Advance to the next chamber.</small></button><button class="choice-button" data-action="dungeon-search"><strong>Search chamber</strong><small>Look for hidden materials or valuables.</small></button><button class="choice-button" data-action="dungeon-leave"><strong>Leave dungeon</strong><small>Return to the surface.</small></button></div></div>`;
    }
    if(g.dungeonMenu){
      const local=state.world.dungeons.filter(d=>d.kingdomId===g.kingdomId&&d.status!=="cleared");
      return `<div class="v3-subpanel"><div class="eyebrow">Dungeons</div><h3>Sites near ${escapeHtml(g.location)}</h3>${local.length?local.map(d=>`<div class="system-row"><div><strong>${escapeHtml(d.name)}</strong><small>${d.depth} chambers • Danger ${d.danger}/5 • ${titleCase(d.status)}</small></div><button class="secondary-button" data-enter-dungeon="${d.id}">Enter</button></div>`).join(""):`<p>No dangerous site has been located nearby yet.</p>`}<div class="action-row"><button class="secondary-button" data-action="dungeon-discover">Search for a dungeon</button><button class="ghost-button" data-action="v3-close">Back</button></div></div>`;
    }
    if(g.activeNpc){
      const n=g.activeNpc,f=factionById(n.factionId),comp=c.companions.find(x=>x.npcId===n.id);
      return `<div class="npc-card"><div class="eyebrow">${f?escapeHtml(f.name):"Independent"}</div><h3>${escapeHtml(n.name)}</h3><div class="character-sub">${escapeHtml(n.occupation)} • ${escapeHtml(n.personality)} • Relationship ${n.relationship}</div>${n.memory?.length?`<p class="npc-memory">Remembers: ${escapeHtml(n.memory[n.memory.length-1].text)}</p>`:""}</div><div class="choice-grid"><button class="choice-button" data-action="npc-talk"><strong>Ask about the area</strong><small>Build the relationship.</small></button><button class="choice-button" data-action="npc-work"><strong>Ask for work</strong><small>Request a contract.</small></button><button class="choice-button" data-action="npc-help"><strong>Offer help</strong><small>Improve relations.</small></button>${!comp?`<button class="choice-button" data-action="npc-recruit"><strong>Recruit companion</strong><small>${n.relationship>=20?"They may agree.":`Requires relationship 20. Current: ${n.relationship}`}</small></button>`:""}<button class="choice-button" data-action="npc-threaten"><strong>Intimidate</strong><small>Risk legal consequences.</small></button><button class="choice-button" data-action="npc-leave"><strong>End conversation</strong></button></div>`;
    }
    return `<div class="choice-grid"><button class="choice-button" data-action="explore"><strong>Explore</strong><small>Investigate locally.</small></button><button class="choice-button" data-action="talk"><strong>Speak to someone</strong><small>Meet a persistent NPC.</small></button><button class="choice-button" data-action="work"><strong>Seek a contract</strong><small>Find quest work.</small></button><button class="choice-button" data-action="travel"><strong>Travel</strong><small>Move within or between kingdoms.</small></button><button class="choice-button" data-action="market"><strong>Market</strong><small>Dynamic economy.</small></button><button class="choice-button" data-action="rest"><strong>Rest</strong><small>Recover and advance the world.</small></button><button class="choice-button" data-action="politics"><strong>Court & Politics</strong><small>Interfere in the balance of power.</small></button><button class="choice-button" data-action="property"><strong>Property</strong><small>Buy homes, workshops and estates.</small></button><button class="choice-button" data-action="magic"><strong>Magic</strong><small>Learn and cast advanced spells.</small></button><button class="choice-button" data-action="crafting"><strong>Crafting</strong><small>Turn materials into equipment.</small></button><button class="choice-button" data-action="dungeons"><strong>Dungeons</strong><small>Discover procedural ruins.</small></button><button class="choice-button" data-action="underworld"><strong>Underworld</strong><small>Crime and illicit opportunities.</small></button></div>`;
  }

  // V3 replacement listener wiring.
  function wireGameActions() {
    document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>handleGameAction(btn.dataset.action)));
    document.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>buyMarketGood(Number(btn.dataset.buy))));
    document.querySelectorAll("[data-sell]").forEach(btn=>btn.addEventListener("click",()=>sellMarketGood(Number(btn.dataset.sell))));
    document.querySelectorAll("[data-buy-property]").forEach(btn=>btn.addEventListener("click",()=>buyProperty(btn.dataset.buyProperty)));
    document.querySelectorAll("[data-learn-spell]").forEach(btn=>btn.addEventListener("click",()=>learnSpell(btn.dataset.learnSpell)));
    document.querySelectorAll("[data-cast-spell]").forEach(btn=>btn.addEventListener("click",()=>castSpell(btn.dataset.castSpell)));
    document.querySelectorAll("[data-craft]").forEach(btn=>btn.addEventListener("click",()=>craftRecipe(btn.dataset.craft)));
    document.querySelectorAll("[data-enter-dungeon]").forEach(btn=>btn.addEventListener("click",()=>enterDungeon(btn.dataset.enterDungeon)));
    document.getElementById("sendRoleplay")?.addEventListener("click",submitRoleplayInput);
    document.getElementById("roleplayInput")?.addEventListener("keydown",e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();submitRoleplayInput();}
    });
  }

  // V3 expanded World Ledger.
  function showWorldLedger() {
    ensureV2Data();
    const wrap=document.createElement("div");wrap.className="modal-backdrop";
    const tabs=["overview","kingdoms","wars","politics","dynasties","factions","quests","contacts","holdings","economy","events"];
    function body(tab){
      const k=currentKingdom(),c=state.character;
      if(tab==="overview") return `<div class="ledger-grid"><div class="ledger-stat"><span>Renown</span><strong>${c.renown||0}</strong></div><div class="ledger-stat"><span>Infamy</span><strong>${c.infamy||0}</strong></div><div class="ledger-stat"><span>Companions</span><strong>${(c.companions||[]).filter(x=>x.active!==false).length}/3</strong></div><div class="ledger-stat"><span>Properties</span><strong>${(c.properties||[]).length}</strong></div></div><div class="ledger-section"><h3>${escapeHtml(k.name)}</h3><p>${k.rulerTitle} ${escapeHtml(k.ruler)} • Prosperity ${k.prosperity}/100 • Stability ${k.stability}/100 • Treasury ${k.treasury}g</p><p>Your standing: <strong>${reputationLabel(k.playerRep)} (${k.playerRep})</strong>.</p></div>`;
      if(tab==="kingdoms") return state.world.kingdoms.map(x=>`<div class="ledger-row"><div><strong>${escapeHtml(x.name)}</strong><small>${x.rulerTitle} ${escapeHtml(x.ruler)} • ${escapeHtml(x.capital)}</small></div><div class="ledger-tags"><span>${reputationLabel(x.playerRep)} ${x.playerRep}</span><span>P ${x.prosperity}</span><span>S ${x.stability}</span>${x.wars.length?`<span class="bad-tag">WAR</span>`:""}</div></div>`).join("");
      if(tab==="wars"){const wars=state.world.deepWars.slice().reverse();return wars.length?wars.map(w=>{const a=kingdomById(w.a),b=kingdomById(w.b);return `<div class="ledger-row"><div><strong>${escapeHtml(a?.name||w.a)} vs ${escapeHtml(b?.name||w.b)}</strong><small>${escapeHtml(w.goal)} • ${titleCase(w.status)} • ${w.days} days</small></div><div class="ledger-tags"><span>Score ${w.score>0?"+":""}${w.score}</span><span>Losses ${w.casualtiesA}/${w.casualtiesB}</span>${w.outcome?`<span>${escapeHtml(w.outcome)}</span>`:""}</div></div>`}).join(""):`<p class="empty-copy">No wars are currently recorded.</p>`;}
      if(tab==="politics") return state.world.kingdoms.map(x=>{const p=x.politics;return `<div class="ledger-row"><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(p.policy)} • Court: ${p.court.map(c=>`${c.role} ${c.name}`).slice(0,2).join(", ")}…</small></div><div class="ledger-tags"><span>Crown ${p.crownAuthority}</span><span>Nobles ${p.noblePower}</span><span>Unrest ${Math.round(p.unrest)}</span></div></div>`}).join("");
      if(tab==="dynasties") return state.world.dynasties.map(d=>{const x=kingdomById(d.kingdomId);return `<div class="ledger-row"><div><strong>${escapeHtml(d.houseName)} • ${escapeHtml(x?.name||"")}</strong><small>${escapeHtml(d.motto)} • ${escapeHtml(d.successionLaw)}</small></div><div class="ledger-tags"><span>${escapeHtml(d.ruler.name)} age ${d.ruler.age}</span><span>${d.heirs.length} heir${d.heirs.length===1?"":"s"}</span><span>Prestige ${d.prestige}</span></div></div>`}).join("");
      if(tab==="factions") return state.world.factions.map(f=>`<div class="ledger-row"><div><strong>${escapeHtml(f.name)}</strong><small>${titleCase(f.type)} • Leader ${escapeHtml(f.leader)}</small></div><div class="ledger-tags"><span>${reputationLabel(f.playerRep)} ${f.playerRep}</span>${f.joined?`<span>MEMBER</span>`:""}<span>Power ${f.power}</span></div></div>`).join("");
      if(tab==="quests"){const qs=state.world.quests;return qs.length?qs.slice().reverse().map(q=>`<div class="ledger-row"><div><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(q.description)}</small></div><div class="ledger-tags"><span>${titleCase(q.status)}</span><span>${q.progress}/${q.goal}</span><span>${q.rewardGold}g</span></div></div>`).join(""):`<p class="empty-copy">No contracts recorded yet.</p>`;}
      if(tab==="contacts"){const ns=state.world.npcs;return ns.length?ns.slice().reverse().map(n=>`<div class="ledger-row"><div><strong>${escapeHtml(n.name)}</strong><small>${escapeHtml(n.occupation)} • ${escapeHtml(n.location)}${n.companion?" • COMPANION":""}</small></div><div class="ledger-tags"><span>${reputationLabel(n.relationship)} ${n.relationship}</span></div></div>`).join(""):`<p class="empty-copy">No lasting contacts yet.</p>`;}
      if(tab==="holdings"){const props=c.properties||[],comps=c.companions||[];return `<div class="ledger-section"><h3>Properties</h3>${props.length?props.map(p=>`<div class="ledger-row"><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.location)} • ${escapeHtml(kingdomById(p.kingdomId)?.name||"")}</small></div><div class="ledger-tags"><span>${p.income}g base/day</span><span>Lv ${p.level}</span></div></div>`).join(""):`<p class="empty-copy">No property owned.</p>`}</div><div class="ledger-section"><h3>Companions</h3>${comps.length?comps.map(x=>`<div class="ledger-row"><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.role)}</small></div><div class="ledger-tags"><span>HP ${x.hp}/${x.maxHp}</span><span>Loyalty ${x.loyalty}</span><span>Morale ${x.morale}</span></div></div>`).join(""):`<p class="empty-copy">No companions recruited.</p>`}</div>`;}
      if(tab==="economy") return `<div class="ledger-section"><h3>${escapeHtml(k.name)} market</h3><p>Price index <strong>x${Number(k.market.index).toFixed(2)}</strong>.</p></div>${MARKET_GOODS.map(g=>`<div class="ledger-row"><div><strong>${escapeHtml(g.name)}</strong><small>${titleCase(g.category)}</small></div><div class="ledger-tags"><span>${worldPrice(g,k)}g</span></div></div>`).join("")}`;
      if(tab==="events") return state.world.events.length?state.world.events.slice().reverse().map(e=>`<div class="ledger-row"><div><strong>${escapeHtml(e.date)}</strong><small>${escapeHtml(e.text)}</small></div></div>`).join(""):`<p class="empty-copy">No major events yet.</p>`;
      return "";
    }
    function paint(tab){state.game.ledgerTab=tab;wrap.innerHTML=`<div class="modal ledger-modal" role="dialog" aria-modal="true"><div class="ledger-head"><div><div class="eyebrow">Deep simulation</div><h2>World Ledger</h2></div><button class="ghost-button" id="ledgerClose">Close</button></div><div class="ledger-tabs">${tabs.map(t=>`<button type="button" data-ledger="${t}" class="${t===tab?"active":""}">${titleCase(t)}</button>`).join("")}</div><div class="ledger-body">${body(tab)}</div></div>`;wrap.querySelector("#ledgerClose").addEventListener("click",()=>wrap.remove());wrap.querySelectorAll("[data-ledger]").forEach(b=>b.addEventListener("click",()=>paint(b.dataset.ledger)));}
    document.body.appendChild(wrap);wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});paint(state.game.ledgerTab||"overview");
  }


  // ============================
  // V4 — AI NARRATOR LAYER
  // ============================

  const AI_CONFIG_KEY = "realmsAndRuinAiConfigV4";
  const AI_DEFAULT_CONFIG = {
    mode: "demo",
    endpoint: "",
    narratorStyle: "immersive",
    responseLength: "medium"
  };

  function getAiConfig() {
    try {
      return {...AI_DEFAULT_CONFIG, ...(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}"))};
    } catch {
      return {...AI_DEFAULT_CONFIG};
    }
  }

  function setAiConfig(next) {
    const cfg = {...getAiConfig(), ...next};
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
    return cfg;
  }

  function ensureV4Data() {
    if (!state.game || !state.character || !state.world) return;
    state.game.aiHistory ||= [];
    state.game.aiSuggestions ||= [];
    state.game.aiBusy ||= false;
    state.game.aiTurn ||= 0;
    state.game.aiLastError ||= "";
  }

  function stripHtml(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "");
    return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  }

  function compactArray(arr, max=8) {
    return Array.isArray(arr) ? arr.slice(-max) : [];
  }

  function aiWorldSnapshot() {
    ensureV4Data();
    const c = state.character, g = state.game, w = state.world, k = currentKingdom();
    const npc = g.activeNpc;
    const localFactions = (w.factions || []).filter(f => f.kingdomId === k.id).slice(0, 8);
    const activeQuests = (w.quests || []).filter(q => q.status === "active").slice(0, 6);
    const d = dynastyForKingdom(k.id);

    return {
      game_rules: {
        world_magic_level: state.worldConfig.magic,
        world_danger_level: state.worldConfig.danger,
        political_climate: state.worldConfig.politics,
        player_controls_own_choices: true,
        permanent_injuries_enabled: true
      },
      player: {
        name: c.name,
        sex: c.sex,
        age: c.age,
        race: c.race,
        race_description: c.raceProfile?.description || "",
        background: c.background,
        background_description: c.backgroundProfile?.description || "",
        class: c.className,
        class_description: c.classProfile?.description || "",
        level: c.level,
        stats: c.stats,
        hp: {current:c.hp, max:c.maxHp},
        mana: {current:c.mana || 0, max:c.maxMana || 0},
        injuries: c.injuries || [],
        gold: c.gold,
        renown: c.renown || 0,
        infamy: c.infamy || 0,
        skills: Object.entries(c.skills || {}).slice(0, 18).map(([name,value])=>({name,value})),
        spells: (c.spells || []).map(id => spellById(id)).filter(Boolean).map(s=>({name:s.name, school:s.school, tier:s.tier, cost:s.cost})),
        inventory: (c.inventory || []).slice(0, 25),
        companions: (c.companions || []).filter(x=>x.active!==false).map(x=>({
          name:x.name, role:x.role, hp:x.hp, maxHp:x.maxHp, loyalty:x.loyalty, morale:x.morale
        }))
      },
      scene: {
        world: w.name,
        date: `${w.day} ${w.season}, ${w.year}`,
        time: g.time,
        location: g.location,
        area_type: g.areaType,
        legal_status: legalStatus(),
        heat: currentHeat(),
        bounty: currentBounty(),
        dungeon: g.dungeonRun ? {
          name: activeDungeon()?.name || "Unknown",
          chamber: (g.dungeonRun.roomIndex || 0) + 1,
          depth: activeDungeon()?.depth || null
        } : null,
        combat: g.combat ? {
          enemy: g.combat.name,
          level: g.combat.level,
          hp: g.combat.hp,
          maxHp: g.combat.maxHp,
          statuses: g.combat.statuses || [],
          context: g.combat.context
        } : null
      },
      current_npc: npc ? {
        id:npc.id,
        name:npc.name,
        occupation:npc.occupation,
        personality:npc.personality,
        relationship:npc.relationship,
        faction: factionById(npc.factionId)?.name || null,
        faction_id:npc.factionId || null,
        memory: compactArray(npc.memory || [], 8),
        companion: !!npc.companion,
        dead: !!npc.dead
      } : null,
      kingdom: {
        id:k.id,
        name:k.name,
        ruler:`${k.rulerTitle} ${k.ruler}`,
        capital:k.capital,
        prosperity:k.prosperity,
        stability:k.stability,
        player_reputation:k.playerRep || 0,
        wars:(k.wars || []).map(id=>kingdomById(id)?.name || id),
        politics:k.politics ? {
          crown_authority:k.politics.crownAuthority,
          noble_power:k.politics.noblePower,
          popular_support:k.politics.popularSupport,
          unrest:Math.round(k.politics.unrest),
          policy:k.politics.policy
        } : null,
        dynasty:d ? {
          house:d.houseName,
          ruler:d.ruler,
          heirs:d.heirs?.slice(0,5),
          succession_law:d.successionLaw
        } : null
      },
      local_factions: localFactions.map(f=>({
        id:f.id, name:f.name, type:f.type, player_reputation:f.playerRep, joined:!!f.joined, power:f.power
      })),
      active_quests: activeQuests.map(q=>({
        id:q.id,title:q.title,description:q.description,progress:q.progress,goal:q.goal,faction_id:q.factionId
      })),
      recent_world_events: compactArray(w.events || [], 5).map(e=>({date:e.date,text:e.text})),
      recent_story: compactArray(g.log || [], 10).map(e=>stripHtml(e.text)),
      recent_ai_memory: compactArray(g.aiHistory || [], 8)
    };
  }

  function chooseActionStat(actionText) {
    const t = String(actionText || "").toLowerCase();
    if (/\b(persuade|convince|lie|deceive|threaten|intimidate|charm|flirt|speak)\b/.test(t)) return "cha";
    if (/\b(recall|study|decode|solve|spell|magic|analyse|analyze|read)\b/.test(t)) return "int";
    if (/\b(search|notice|listen|track|sense|investigate)\b/.test(t)) return "wis";
    if (/\b(sneak|dodge|climb|jump|throw|aim|pickpocket|lock|finesse)\b/.test(t)) return "dex";
    if (/\b(endure|hold breath|resist poison|push through)\b/.test(t)) return "con";
    return "str";
  }

  function buildActionResolution(segments) {
    const actionText = segments.filter(s=>s.type==="action").map(s=>s.text).join(" then ").trim();
    if (!actionText) return {has_action:false};
    const stat = chooseActionStat(actionText);
    const score = Number(state.character.stats?.[stat] || 8);
    let difficulty = state.game.combat ? 13 + Math.min(4, state.game.combat.level || 1) : 11;
    if (/\b(impossible|teleport without|lift a castle|destroy the world)\b/.test(actionText.toLowerCase())) difficulty = 30;

    let blocked = "";
    const t = actionText.toLowerCase();
    if ((/\b(run|sprint|jump|kick|climb)\b/.test(t)) && hasSevereInjury("left leg") && hasSevereInjury("right leg")) blocked = "Both legs are unusable.";
    if ((/\b(swing|stab|slash|grab|punch|draw|shoot|throw)\b/.test(t)) && hasSevereInjury("left arm") && hasSevereInjury("right arm")) blocked = "Both arms are unusable.";

    const d20 = randInt(1,20);
    const modifier = Math.floor(score / 4);
    const total = d20 + modifier;
    return {
      has_action:true,
      action_text:actionText,
      stat,
      stat_score:score,
      d20,
      modifier,
      total,
      difficulty,
      success:!blocked && total >= difficulty,
      margin:blocked ? -99 : total - difficulty,
      blocked_reason:blocked,
      combat_damage_cap: state.game.combat ? Math.max(2, 6 + Math.floor(score/3) + state.character.level*2) : 0
    };
  }

  function aiSystemSummary() {
    const cfg=getAiConfig();
    return {
      mode:cfg.mode,
      label:cfg.mode==="live" ? "Live AI" : "Demo AI",
      connected:cfg.mode==="demo" || !!cfg.endpoint
    };
  }

  function renderRoleplayComposer() {
    ensureV4Data();
    const cfg=getAiConfig(), info=aiSystemSummary(), busy=!!state.game.aiBusy;
    const suggestions=(state.game.aiSuggestions||[]).slice(0,4);
    return `<div class="rp-composer ai-composer">
      <div class="ai-composer-head">
        <div>
          <div class="rp-help"><strong>AI roleplay</strong><span>Normal text = dialogue • <code>**text**</code> = action</span></div>
          <div class="ai-status-line"><span class="ai-dot ${cfg.mode==="live"?"live":"demo"}"></span><strong>${info.label}</strong><span>${cfg.mode==="live"?(cfg.endpoint?"simulation-linked narrator":"proxy not configured"):"local preview — no credits"}</span></div>
        </div>
        <button class="ghost-button ai-settings-button" id="aiSettings" type="button">AI Settings</button>
      </div>
      ${suggestions.length?`<div class="ai-suggestions">${suggestions.map((s,i)=>`<button type="button" class="ai-suggestion" data-ai-suggestion="${i}">${escapeHtml(s)}</button>`).join("")}</div>`:""}
      <textarea class="textarea rp-input" id="roleplayInput" maxlength="1000" ${busy?"disabled":""} placeholder='Example: I never touched the merchant. **I keep one hand near my sword and watch the guard for a reaction.**'></textarea>
      <div class="rp-actions">
        <span id="rpHint">${busy?"The narrator is reacting to the current world state…":"Ctrl+Enter to send • the AI cannot directly overwrite simulation rules"}</span>
        <button class="primary-button" id="sendRoleplay" type="button" ${busy?"disabled":""}>${busy?"Narrating…":"Send"}</button>
      </div>
      ${state.game.aiLastError?`<div class="ai-error">${escapeHtml(state.game.aiLastError)}</div>`:""}
    </div>`;
  }

  function showAiSettings() {
    const cfg=getAiConfig();
    const wrap=document.createElement("div");
    wrap.className="modal-backdrop";
    wrap.innerHTML=`<div class="modal ai-settings-modal" role="dialog" aria-modal="true" aria-label="AI settings">
      <div class="eyebrow">V4 narrator</div>
      <h2>AI Settings</h2>
      <p>Demo mode shows the interface with a local narrator. Live mode sends a compact simulation snapshot to your secure AI proxy. Never put an API key in this page.</p>
      <div class="ai-mode-grid">
        <label class="ai-mode-card ${cfg.mode==="demo"?"selected":""}">
          <input type="radio" name="aiMode" value="demo" ${cfg.mode==="demo"?"checked":""}>
          <strong>Demo AI</strong><span>Free local preview. Context-aware templates, but not a language model.</span>
        </label>
        <label class="ai-mode-card ${cfg.mode==="live"?"selected":""}">
          <input type="radio" name="aiMode" value="live" ${cfg.mode==="live"?"checked":""}>
          <strong>Live AI</strong><span>Fluid narrator + NPC conversations through the included secure proxy.</span>
        </label>
      </div>
      <div class="field">
        <label for="aiEndpoint">Secure proxy URL</label>
        <input class="input" id="aiEndpoint" value="${escapeHtml(cfg.endpoint||"")}" placeholder="https://your-worker.example.workers.dev/ai">
        <small>GitHub Pages calls this URL. Your OpenAI key stays on the proxy/server.</small>
      </div>
      <div class="form-grid">
        <div class="field"><label for="aiStyle">Narrator style</label><select class="select" id="aiStyle">
          ${["immersive","concise","dark fantasy","high fantasy"].map(x=>`<option ${cfg.narratorStyle===x?"selected":""}>${x}</option>`).join("")}
        </select></div>
        <div class="field"><label for="aiLength">Response length</label><select class="select" id="aiLength">
          ${["short","medium","long"].map(x=>`<option ${cfg.responseLength===x?"selected":""}>${x}</option>`).join("")}
        </select></div>
      </div>
      <div class="action-row">
        <button class="primary-button" id="saveAiSettings">Save settings</button>
        <button class="ghost-button" id="closeAiSettings">Close</button>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    const syncCards=()=>wrap.querySelectorAll(".ai-mode-card").forEach(card=>card.classList.toggle("selected",card.querySelector("input").checked));
    wrap.querySelectorAll('input[name="aiMode"]').forEach(r=>r.addEventListener("change",syncCards));
    wrap.querySelector("#closeAiSettings").addEventListener("click",()=>wrap.remove());
    wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});
    wrap.querySelector("#saveAiSettings").addEventListener("click",()=>{
      const mode=wrap.querySelector('input[name="aiMode"]:checked')?.value||"demo";
      let endpoint=wrap.querySelector("#aiEndpoint").value.trim();
      if(endpoint && !/^https:\/\//i.test(endpoint) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(endpoint)){
        showToast("Use an HTTPS proxy URL.");
        return;
      }
      setAiConfig({
        mode,
        endpoint:endpoint.replace(/\/+$/,""),
        narratorStyle:wrap.querySelector("#aiStyle").value,
        responseLength:wrap.querySelector("#aiLength").value
      });
      state.game.aiLastError="";
      wrap.remove();renderGame();
    });
  }

  function demoAiTurn(payload) {
    const {snapshot,segments,resolution}=payload;
    const action=segments.filter(x=>x.type==="action").map(x=>x.text).join(" then ");
    const dialogue=segments.filter(x=>x.type==="dialogue").map(x=>x.text).join(" ");
    const npc=snapshot.current_npc, combat=snapshot.scene.combat;
    const intents=[], lines=[];
    let narration="";

    if(action){
      if(resolution.blocked_reason){
        narration=`You try to follow through, but your body refuses the movement. ${resolution.blocked_reason}`;
      } else if(combat){
        const success=resolution.success;
        if(success){
          const dmg=Math.max(2,Math.min(resolution.combat_damage_cap,randInt(4,resolution.combat_damage_cap||6)));
          narration=`You commit to the action instead of falling into a predictable exchange. ${combat.enemy} reacts a fraction too late; your timing creates a real opening.`;
          intents.push({type:"enemy_damage",amount:dmg,status:resolution.margin>=5?"staggered":"",reason:action});
        } else {
          narration=`You attempt it, but ${combat.enemy} reads the movement and denies the opening. The failed commitment leaves you exposed for a heartbeat.`;
          const dmg=Math.max(1,randInt(2,6));
          intents.push({type:"player_damage",amount:dmg,body_part:pick(BODY_PARTS),severity:dmg>=6?"minor":"none",cause:`counterattack by ${combat.enemy}`});
        }
      } else if(npc && /\b(stab|attack|hit|punch|kick|kill|slash|draw.*sword)\b/i.test(action)){
        narration=`The atmosphere changes instantly. ${npc.name} sees the violence coming and reacts on instinct; whatever this conversation was a moment ago, it is over now.`;
        intents.push({type:"relationship",target_id:npc.id,amount:-60,reason:"Player initiated violence"});
        intents.push({type:"npc_memory",target_id:npc.id,text:`The player attacked me: ${action.slice(0,140)}`});
        intents.push({type:"start_combat",target_id:npc.id,enemy_name:npc.name,context:snapshot.scene.area_type});
        intents.push({type:"crime",description:`Assault on ${npc.name}`,severity:14,witnessed:true});
      } else if(/\b(steal|pickpocket|rob|take.*without|break in|burglar)\b/i.test(action)){
        narration=resolution.success
          ? `You choose your moment carefully and act while attention is elsewhere. For now, the theft goes unnoticed.`
          : `You make the attempt, but somebody notices the movement before you can cleanly get away with it.`;
        intents.push({type:"crime",description:"Theft",severity:resolution.success?8:14,witnessed:!resolution.success});
        if(resolution.success) intents.push({type:"gold",amount:randInt(3,14)});
      } else if(/\b(tavern|inn)\b/i.test(action)){
        narration=`You make your way through ${snapshot.scene.location} until warm light, conversation and the smell of drink announce the nearest tavern.`;
        intents.push({type:"move",location:"The local tavern",area_type:"town"});
      } else {
        narration=resolution.success
          ? `You act decisively. The attempt works well enough to change the immediate situation, and the people around you adjust to what you have just done.`
          : `You try it, but circumstances resist the plan. The failure is noticeable without becoming absurdly catastrophic.`;
      }
    }

    if(dialogue && npc){
      const lower=dialogue.toLowerCase();
      let reply;
      if(npc.relationship<=-40) reply=`"${pick(["You've said enough.","Don't mistake this conversation for trust.","Watch your next words carefully."])}"`;
      else if(/\b(who are you|your name)\b/.test(lower)) reply=`"I'm ${npc.name}. ${titleCase(npc.occupation)}. That's enough of an introduction until I know what you want."`;
      else if(/\b(war|army|battle)\b/.test(lower)) reply=snapshot.kingdom.wars.length?`"We're at war. Even people who never see a battlefield feel it in prices, patrols and empty chairs."`:`"No declared war today. That doesn't mean the borders are calm."`;
      else if(/\b(help|work|job|coin)\b/.test(lower)) reply=`"Maybe. People always need something carried, found, guarded or made to disappear. Depends what kind of work you mean."`;
      else if(/\b(king|queen|ruler|crown)\b/.test(lower)) reply=`"${snapshot.kingdom.ruler} wears the crown. Around here, that isn't always the same thing as holding all the power."`;
      else reply=pick([
        `"${dialogue.length>90?"That's more than I expected you to say.":"I hear you."} I'm deciding what it tells me about you."`,
        `"Maybe. But people in ${snapshot.scene.location} have learned not to take strangers at their word."`,
        `"You speak plainly. I can respect that, even if I'm not sure I believe you yet."`
      ]);
      lines.push({speaker:npc.name,text:reply.replace(/^"|"$/g,""),emotion:npc.relationship>30?"open":npc.relationship<0?"guarded":"neutral"});
      const delta=/\b(thank|please|friend|sorry)\b/.test(lower)?2:/\b(idiot|coward|bastard|kill you)\b/.test(lower)?-5:0;
      if(delta) intents.push({type:"relationship",target_id:npc.id,amount:delta,reason:"Tone of conversation"});
      intents.push({type:"npc_memory",target_id:npc.id,text:`The player said: "${dialogue.slice(0,140)}"`});
    } else if(dialogue && !npc){
      const comp=snapshot.player.companions?.[0];
      if(comp) lines.push({speaker:comp.name,text:pick(["I'm listening.","Say what you need to say.","I was thinking the same thing.","Just remember where we are."]),emotion:"attentive"});
      else if(!narration) narration=`Your words are spoken aloud into the life of ${snapshot.scene.location}. Nearby people may hear, but nobody in particular answers.`;
    }

    if(!narration) narration=npc
      ? `${npc.name} watches you rather than filling the silence. Their expression gives away less than their posture does.`
      : `The world carries on around you, waiting on what you choose to do next.`;

    const suggestions=combat
      ? ["**I feint left, then attack the weapon arm.**","**I back away and look for an escape route.**","You don't have to die here. **I keep my guard raised.**"]
      : npc
      ? ["What do you know about this place?","**I study their reaction carefully.**","Who holds real power around here?"]
      : ["**I look for someone who seems well informed.**","**I head toward the busiest part of town.**","What rumours are people talking about?"];

    return Promise.resolve({narration,dialogue:lines,intents,memory:[],suggested_actions:suggestions});
  }

  async function requestLiveAiTurn(payload) {
    const cfg=getAiConfig();
    if(!cfg.endpoint) throw new Error("Live AI proxy URL is not configured.");
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    try{
      const res=await fetch(cfg.endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          version:"4.0",
          narrator_style:cfg.narratorStyle,
          response_length:cfg.responseLength,
          ...payload
        }),
        signal:controller.signal
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body.error || `AI proxy returned HTTP ${res.status}`);
      if(!body || typeof body.narration!=="string") throw new Error("AI response did not match the V4 narrator contract.");
      return body;
    }finally{
      clearTimeout(timer);
    }
  }

  function clampIntentAmount(value,min,max){
    const n=Number(value);
    return Number.isFinite(n)?clamp(Math.round(n),min,max):0;
  }

  function findNpcById(id){
    return (state.world.npcs||[]).find(n=>n.id===id) || (state.game.activeNpc?.id===id?state.game.activeNpc:null);
  }

  function applyAiIntent(intent,resolution) {
    if(!intent || typeof intent.type!=="string") return;
    const c=state.character,g=state.game;
    switch(intent.type){
      case "relationship": {
        const n=findNpcById(intent.target_id);
        if(!n)return;
        n.relationship=clamp((n.relationship||0)+clampIntentAmount(intent.amount,-12,12),-100,100);
        break;
      }
      case "npc_memory": {
        const n=findNpcById(intent.target_id);
        if(!n || !intent.text)return;
        addNpcMemory(n,String(intent.text).slice(0,180));
        break;
      }
      case "start_combat": {
        if(g.combat)return;
        const n=findNpcById(intent.target_id);
        if(n){
          n.relationship=-100;
          g.activeNpc=null;
          startCombat({
            name:n.name, level:Math.max(1,c.level),
            hp:30+c.level*7, dmg:[4+Math.floor(c.level/2),8+c.level],
            xp:28+c.level*8, gold:[2,14],
            attacks:["punch","slash","grapple","kick"]
          },["town","road","outskirts","wilderness","ruin"].includes(intent.context)?intent.context:g.areaType);
          g.combat.npcId=n.id;
        } else if(intent.enemy_name){
          startCombat({
            name:String(intent.enemy_name).slice(0,50),level:Math.max(1,c.level),
            hp:24+c.level*8,dmg:[3+c.level,7+c.level],xp:25+c.level*7,gold:[0,12],
            attacks:["strike","lunge","grapple"]
          },g.areaType);
        }
        break;
      }
      case "enemy_damage": {
        if(!g.combat || !resolution?.has_action || !resolution.success)return;
        const cap=Math.max(1,resolution.combat_damage_cap||8);
        const dmg=clampIntentAmount(intent.amount,1,cap);
        g.combat.hp=Math.max(0,g.combat.hp-dmg);
        if(intent.status && ["staggered","blinded"].includes(intent.status)) addEnemyStatus(intent.status,1);
        break;
      }
      case "player_damage": {
        if(!g.combat && !resolution?.has_action)return;
        const cap=g.combat?Math.max(3,(g.combat.dmg?.[1]||8)+4):12;
        const dmg=clampIntentAmount(intent.amount,0,cap);
        c.hp=Math.max(1,c.hp-dmg);
        if(dmg>0 && intent.body_part && BODY_PARTS.includes(intent.body_part) && ["minor","severe"].includes(intent.severity)){
          const sev=intent.severity==="severe" && dmg<8?"minor":intent.severity;
          applyInjury(intent.body_part,sev,String(intent.cause||"AI-resolved consequence").slice(0,100));
        }
        break;
      }
      case "move": {
        if(g.combat)return;
        const loc=String(intent.location||"").trim().slice(0,60);
        if(!loc)return;
        g.location=loc;
        if(["town","road","outskirts","wilderness","forest","ruin","crypt","swamp"].includes(intent.area_type)) g.areaType=intent.area_type;
        break;
      }
      case "gold": {
        const amt=clampIntentAmount(intent.amount,-Math.min(50,c.gold),50);
        c.gold=Math.max(0,c.gold+amt);
        break;
      }
      case "crime": {
        const sev=clampIntentAmount(intent.severity,1,30);
        recordCrime(String(intent.description||"Unlawful act").slice(0,80),sev,!!intent.witnessed);
        break;
      }
      case "reputation": {
        const amount=clampIntentAmount(intent.amount,-8,8);
        if(intent.scope==="kingdom" && kingdomById(intent.target_id)) changeKingdomRep(intent.target_id,amount);
        if(intent.scope==="faction" && factionById(intent.target_id)) changeFactionRep(intent.target_id,amount);
        break;
      }
      case "quest_progress": {
        progressQuests(String(intent.kind||"explore").slice(0,30),clampIntentAmount(intent.amount,1,1));
        break;
      }
      case "item_add": {
        const item=String(intent.item||"").trim().slice(0,60);
        if(item && !c.inventory.includes(item)) c.inventory.push(item);
        break;
      }
      case "material_add": {
        const item=String(intent.item||"");
        if(Object.prototype.hasOwnProperty.call(c.materials||{},item)) c.materials[item]+=clampIntentAmount(intent.amount,1,2);
        break;
      }
      case "time": {
        const turns=clampIntentAmount(intent.amount,0,2);
        for(let i=0;i<turns;i++)advanceTurn();
        break;
      }
    }
  }

  function applyAiTurn(result,resolution) {
    const g=state.game;
    if(result.narration) addLog(`<div class="ai-narrator-label">AI NARRATOR</div>${escapeHtml(result.narration).replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>")}`,"ai-narration");
    (result.dialogue||[]).slice(0,5).forEach(line=>{
      const speaker=String(line.speaker||"Unknown").slice(0,60);
      const emotion=line.emotion?` <span class="ai-emotion">${escapeHtml(String(line.emotion).slice(0,30))}</span>`:"";
      addLog(`<strong>${escapeHtml(speaker)}:</strong>${emotion} “${escapeHtml(String(line.text||"").slice(0,1200))}”`,"ai-dialogue");
    });
    (result.intents||[]).slice(0,10).forEach(intent=>applyAiIntent(intent,resolution));
    (result.memory||[]).slice(0,5).forEach(m=>{
      const n=findNpcById(m.npc_id);
      if(n && m.text)addNpcMemory(n,String(m.text).slice(0,180));
    });

    g.aiSuggestions=Array.isArray(result.suggested_actions)?result.suggested_actions.slice(0,4).map(x=>String(x).slice(0,140)):[];
    g.aiHistory.push({
      turn:++g.aiTurn,
      narration:String(result.narration||"").slice(0,600),
      dialogue:(result.dialogue||[]).slice(0,3).map(x=>`${x.speaker}: ${x.text}`).join(" | ")
    });
    if(g.aiHistory.length>16)g.aiHistory.splice(0,g.aiHistory.length-16);

    if(g.combat && g.combat.hp<=0){
      finishCombatVictory();
      return;
    }
  }

  async function submitRoleplayInput(prefill=null) {
    ensureV4Data();
    if(state.game.aiBusy)return;
    const box=document.getElementById("roleplayInput");
    const raw=String(prefill ?? box?.value ?? "").trim();
    if(!raw)return;

    const segments=parseRoleplayInput(raw);
    if(!segments.length)return;
    const formatted=segments.map(s=>s.type==="action"
      ?`<span class="rp-action-text">**${escapeHtml(s.text)}**</span>`
      :`<span class="rp-dialogue-text">${escapeHtml(s.text)}</span>`).join(" ");
    addLog(`<strong>${escapeHtml(state.character.name)}:</strong> ${formatted}`,"roleplay");

    const resolution=buildActionResolution(segments);
    const snapshot=aiWorldSnapshot();
    const cfg=getAiConfig();

    state.game.aiBusy=true;
    state.game.aiLastError="";
    renderGame();

    try{
      const payload={input:raw,segments,resolution,snapshot};
      const result=cfg.mode==="live" ? await requestLiveAiTurn(payload) : await demoAiTurn(payload);
      applyAiTurn(result,resolution);

      // A normal AI turn advances time once unless the AI already explicitly advanced it.
      const explicitTime=(result.intents||[]).some(x=>x.type==="time");
      if(!explicitTime && !state.game.combat) advanceTurn();

      saveGame(false);
    }catch(err){
      const msg=err?.name==="AbortError"?"AI request timed out.":String(err?.message||err);
      state.game.aiLastError=msg;
      addLog(`<strong>AI connection:</strong> ${escapeHtml(msg)} The simulation has not been altered by the failed request.`,"system");
    }finally{
      state.game.aiBusy=false;
      renderGame();
    }
  }

  // V4 listener override.
  function wireGameActions() {
    document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>handleGameAction(btn.dataset.action)));
    document.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>buyMarketGood(Number(btn.dataset.buy))));
    document.querySelectorAll("[data-sell]").forEach(btn=>btn.addEventListener("click",()=>sellMarketGood(Number(btn.dataset.sell))));
    document.querySelectorAll("[data-buy-property]").forEach(btn=>btn.addEventListener("click",()=>buyProperty(btn.dataset.buyProperty)));
    document.querySelectorAll("[data-learn-spell]").forEach(btn=>btn.addEventListener("click",()=>learnSpell(btn.dataset.learnSpell)));
    document.querySelectorAll("[data-cast-spell]").forEach(btn=>btn.addEventListener("click",()=>castSpell(btn.dataset.castSpell)));
    document.querySelectorAll("[data-craft]").forEach(btn=>btn.addEventListener("click",()=>craftRecipe(btn.dataset.craft)));
    document.querySelectorAll("[data-enter-dungeon]").forEach(btn=>btn.addEventListener("click",()=>enterDungeon(btn.dataset.enterDungeon)));

    document.getElementById("sendRoleplay")?.addEventListener("click",()=>submitRoleplayInput());
    document.getElementById("roleplayInput")?.addEventListener("keydown",e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();submitRoleplayInput();}
    });
    document.getElementById("aiSettings")?.addEventListener("click",showAiSettings);
    document.querySelectorAll("[data-ai-suggestion]").forEach(btn=>btn.addEventListener("click",()=>{
      const suggestion=state.game.aiSuggestions?.[Number(btn.dataset.aiSuggestion)];
      if(suggestion)submitRoleplayInput(suggestion);
    }));
  }

  function showMenu() {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Game menu">
        <h2>Adventure menu</h2>
        <p>Your current adventure is stored locally in this browser.</p>
        <div class="action-row">
          <button class="primary-button" id="menuSave">Save game</button>
          <button class="secondary-button" id="menuReturn">Return to title</button>
          <button class="danger-button" id="menuDelete">Delete save</button>
          <button class="ghost-button" id="menuClose">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.remove();
    });
    wrap.querySelector("#menuClose").addEventListener("click", () => wrap.remove());
    wrap.querySelector("#menuSave").addEventListener("click", () => { saveGame(); wrap.remove(); });
    wrap.querySelector("#menuReturn").addEventListener("click", () => {
      saveGame(false);
      state.screen = "title";
      wrap.remove();
      render();
    });
    wrap.querySelector("#menuDelete").addEventListener("click", () => {
      if (confirm("Delete the saved adventure from this browser?")) {
        localStorage.removeItem(SAVE_KEY);
        state.screen = "title";
        wrap.remove();
        render();
      }
    });
  }

  saveButton.addEventListener("click", () => saveGame(true));
  menuButton.addEventListener("click", showMenu);
  brandButton.addEventListener("click", () => {
    if (state.screen === "game") {
      saveGame(false);
    }
    state.screen = "title";
    render();
  });

  loadDraft();
  render();
})();
