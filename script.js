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
      version: "2.0",
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
            <div class="hud-row"><span>HP</span><strong>${c.hp}/${c.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${hpPct}%"></span></div>
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
          <div class="choice-area">${renderActionArea()}</div>
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
    const existing = state.world.npcs.filter(n=>n.location===state.game.location && n.kingdomId===state.game.kingdomId);
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
        const result=pick(finds), m=result.match(/(\d+) gold/); if(m)c.gold+=Number(m[1]); addLog(result); awardXp(7); progressQuests("explore",1);
      }
    }
    if (action==="talk") { g.activeNpc=generateNpc(); addLog(`You approach <strong>${escapeHtml(g.activeNpc.name)}</strong>, a ${escapeHtml(g.activeNpc.occupation)}. They seem ${escapeHtml(g.activeNpc.personality)}.`,"event"); advanceTurn(); }
    if (action==="work") { const q=generateQuestOffer(); const f=factionById(q.factionId); addLog(`${f?escapeHtml(f.name):"A local employer"} has a contract available.`,"event"); advanceTurn(); }
    if (action==="travel") { g.travelMenu=true; addLog(`You consider the roads and borders open to you.`); }
    if (action==="market") { g.marketOpen=true; addLog(`You make your way to the market. Prices reflect the current state of ${escapeHtml(currentKingdom().name)}.`); }
    if (action==="rest") {
      const recovered=Math.min(c.maxHp-c.hp,Math.round(c.maxHp*.38)); c.hp+=recovered; c.injuries=(c.injuries||[]).filter(i=>!(i.severity==="minor"&&Math.random()<.55)); g.time="Morning"; g.turn++; advanceWorldDay(1); addLog(`You rest until morning. ${recovered?`${recovered} HP is restored.`:"You were already at full strength."} The wider world continues moving while you sleep.`); addEvent("Rested for the night"); maybeLawCheck();
    }
    if (action==="rumour") { advanceTurn(); addLog(`You follow a local rumour through taverns, side streets and guarded conversations.`); if(!g.lawEncounter&&!maybeEncounter("outskirts")){const npc=generateNpc();g.activeNpc=npc;addLog(`<strong>${escapeHtml(npc.name)}</strong> appears to know more than they first admit.`,"event");progressQuests("explore",1);} awardXp(8); }
    if (action==="underworld") { g.crimeMenu=true; addLog(`You begin looking for opportunities that respectable citizens would avoid.`); }
    saveGame(false); renderGame();
  }

  function npcAction(action) {
    const g=state.game,c=state.character,n=g.activeNpc;if(!n)return; const f=factionById(n.factionId);
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
    addEvent(`Defeated ${e.name}`);
    if (e.name !== "Town Guard") progressQuests("combat",1);
    if (e.name === "Town Guard") recordCrime("Violence against the watch", 25, true);
    state.game.combat = null;
    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function doCombatCustomAction() {
    const input = document.getElementById("combatCustomAction");
    const raw = input?.value.trim();
    if (!raw) return;

    const c = state.character;
    const e = state.game.combat;
    if (!e) return;
    const text = raw.toLowerCase();

    addLog(`<strong>You attempt:</strong> ${escapeHtml(raw)}`, "system");

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

    enemyTurn();
    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function doCustomAction() {
    const input = document.getElementById("customAction");
    const raw = input.value.trim();
    if (!raw) return;
    const text = raw.toLowerCase();

    addLog(`<strong>You:</strong> ${escapeHtml(raw)}`, "system");

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
      state.game.time = "Morning";
      advanceWorldDay(1);
      addLog(`You find somewhere reasonably safe and rest until morning. The world continues to change while you sleep.`);
    } else if (/\b(tavern|inn|ale|drink)\b/.test(text)) {
      const npc = generateNpc();
      state.game.activeNpc = npc;
      addLog(`You head for the nearest tavern. Inside, smoke and conversation fill the room. ${npc.name}, a ${npc.occupation}, catches your attention near the hearth.`);
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
