(() => {
  "use strict";

  const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(max-width: 900px)").matches);


  const VIEW_MODE_KEY = "realmsAndRuinViewModeV42";
  const VALID_VIEW_MODES = ["auto","mobile","desktop"];

  function getViewMode() {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      return VALID_VIEW_MODES.includes(stored) ? stored : "auto";
    } catch {
      return "auto";
    }
  }

  function effectiveViewMode() {
    const selected = getViewMode();
    if (selected !== "auto") return selected;
    return IS_MOBILE ? "mobile" : "desktop";
  }

  function applyViewMode() {
    const selected = getViewMode();
    const effective = effectiveViewMode();
    document.documentElement.dataset.viewMode = selected;
    document.documentElement.classList.toggle("force-mobile", effective === "mobile");
    document.documentElement.classList.toggle("force-desktop", effective === "desktop");

    const btn = document.getElementById("viewModeButton");
    if (btn) btn.textContent = `View: ${selected === "auto" ? "Auto" : selected === "mobile" ? "Mobile" : "Desktop"}`;
  }

  function setViewMode(mode) {
    if (!VALID_VIEW_MODES.includes(mode)) return;
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch {}
    applyViewMode();
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showViewModeMenu() {
    const current = getViewMode();
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML = `
      <div class="modal view-mode-modal" role="dialog" aria-modal="true" aria-label="View mode">
        <div class="eyebrow">Display</div>
        <h2>Choose View Mode</h2>
        <p>Use Auto to let the game choose based on screen size, or force either layout on this device.</p>

        <div class="view-mode-options">
          <button type="button" class="view-mode-option ${current==="auto"?"selected":""}" data-view-choice="auto">
            <strong>Auto</strong>
            <span>Desktop on wide screens, Mobile on phones.</span>
          </button>
          <button type="button" class="view-mode-option ${current==="mobile"?"selected":""}" data-view-choice="mobile">
            <strong>Mobile</strong>
            <span>Single-column touch layout, even on a desktop browser.</span>
          </button>
          <button type="button" class="view-mode-option ${current==="desktop"?"selected":""}" data-view-choice="desktop">
            <strong>Desktop</strong>
            <span>Full three-column layout and wider interface.</span>
          </button>
        </div>

        <div class="view-mode-current">
          Current effective layout: <strong>${effectiveViewMode()==="mobile"?"Mobile":"Desktop"}</strong>
        </div>

        <div class="action-row">
          <button type="button" class="ghost-button" id="closeViewMode">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    wrap.querySelectorAll("[data-view-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        setViewMode(btn.dataset.viewChoice);
        wrap.remove();
        render();
      });
    });
    wrap.querySelector("#closeViewMode").addEventListener("click", () => wrap.remove());
    wrap.addEventListener("click", e => { if (e.target === wrap) wrap.remove(); });
  }

  // Allows the static loading panel in index.html to distinguish a successful JS start.
  document.documentElement.dataset.rrJs = "started";

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

  const POWER_TIERS = {
    mundane:{label:"Mundane",score:5,summary:"ordinary and widely understandable"},
    notable:{label:"Notable",score:18,summary:"clearly above ordinary quality or ability"},
    uncommon:{label:"Uncommon",score:30,summary:"unusual enough to draw informed attention"},
    rare:{label:"Rare",score:43,summary:"rare and impressive even to experienced people"},
    exceptional:{label:"Exceptional",score:57,summary:"far beyond ordinary local standards"},
    legendary:{label:"Legendary",score:71,summary:"the sort of thing people tell stories about"},
    mythic:{label:"Mythic",score:84,summary:"almost outside normal mortal experience"},
    divine:{label:"Divine",score:95,summary:"holy, godlike or otherwise beyond conventional mortal power"},
    transcendent:{label:"Transcendent",score:100,summary:"so far beyond normal understanding that ordinary comparisons cease to be useful"}
  };

  const MANIFESTATION_LEVELS = {
    hidden:{label:"Hidden / internal",factor:0,summary:"not normally perceptible"},
    subtle:{label:"Subtle",factor:.35,summary:"noticed mainly by sensitive, trained or attentive observers"},
    obvious:{label:"Obvious",factor:.72,summary:"clearly unusual to ordinary observers"},
    overwhelming:{label:"Overwhelming",factor:1,summary:"difficult or impossible for nearby people to ignore"}
  };

  function tierData(key){
    return POWER_TIERS[key] || POWER_TIERS.notable;
  }

  function tierOptions(selected="notable"){
    return Object.entries(POWER_TIERS).map(([key,v])=>`<option value="${key}" ${selected===key?"selected":""}>${v.label}</option>`).join("");
  }

  function manifestationOptions(selected="obvious"){
    return Object.entries(MANIFESTATION_LEVELS).map(([key,v])=>`<option value="${key}" ${selected===key?"selected":""}>${v.label}</option>`).join("");
  }

  function normalizeCustomSkillEntry(value){
    if(typeof value==="string") return {name:value.trim(),desc:"",tier:"notable"};
    value=value||{};
    return {
      name:String(value.name||"").trim(),
      desc:String(value.desc||value.description||"").trim(),
      tier:POWER_TIERS[value.tier]?value.tier:"notable"
    };
  }

  function normalizedCustomSkills(c=draft.character){
    return (c.customSkills||[]).map(normalizeCustomSkillEntry).filter(x=>x.name);
  }

  function normalizeItemDef(value){
    if(typeof value==="string") return {name:value.trim(),desc:"",tier:"mundane",presence:"ordinary",slot:"auto"};
    value=value||{};
    return {
      name:String(value.name||"").trim(),
      desc:String(value.desc||value.description||"").trim(),
      tier:POWER_TIERS[value.tier]?value.tier:"mundane",
      presence:["ordinary","distinctive","supernatural","overwhelming"].includes(value.presence)?value.presence:"ordinary",
      slot:["auto","head","body","hands","mainHand","offHand","cloak","accessory","carried"].includes(value.slot)?value.slot:"auto"
    };
  }

  function normalizeSpecialTrait(value){
    value=value||{};
    return {
      name:String(value.name||"").trim(),
      category:String(value.category||"Aura").trim()||"Aura",
      desc:String(value.desc||value.description||"").trim(),
      tier:POWER_TIERS[value.tier]?value.tier:"notable",
      manifestation:MANIFESTATION_LEVELS[value.manifestation]?value.manifestation:"obvious"
    };
  }

  function normalizedSpecialTraits(c=draft.character){
    return (c.specialTraits||[]).map(normalizeSpecialTrait).filter(x=>x.name);
  }


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
        itemDefs: Array.isArray(c.customBackground?.itemDefs)
          ? c.customBackground.itemDefs.map(normalizeItemDef).filter(x=>x.name)
          : (Array.isArray(c.customBackground?.items)?c.customBackground.items.map(normalizeItemDef).filter(x=>x.name):[]),
        items: Array.isArray(c.customBackground?.itemDefs)
          ? c.customBackground.itemDefs.map(normalizeItemDef).filter(x=>x.name).map(x=>x.name)
          : (Array.isArray(c.customBackground?.items)?c.customBackground.items.filter(Boolean):[]),
        skill: (c.customBackground?.skill || "").trim(),
        skillDesc: (c.customBackground?.skillDesc || "").trim(),
        skillTier: POWER_TIERS[c.customBackground?.skillTier] ? c.customBackground.skillTier : "notable",
        custom: true
      };
    }
    const data = BACKGROUNDS[c.background] || BACKGROUNDS.Peasant;
    return { name: c.background || "Peasant", ...data, itemDefs:(data.items||[]).map(normalizeItemDef), skillDesc:"", skillTier:"notable", custom: false };
  }

  function getClassData(c=draft.character) {
    if (c.className === CUSTOM) {
      const name = (c.customClass?.name || "Custom Class").trim();
      return {
        name,
        desc: (c.customClass?.desc || "").trim() || `A custom adventuring class called ${name}.`,
        hp: Math.max(0, Math.min(200, Number(c.customClass?.hp) || 0)),
        skill: (c.customClass?.skill || "Focused Strike").trim(),
        skillDesc: (c.customClass?.skillDesc || "").trim(),
        skillTier: POWER_TIERS[c.customClass?.skillTier] ? c.customClass.skillTier : "notable",
        custom: true
      };
    }
    const data = CLASSES[c.className] || CLASSES.Warrior;
    return { name: c.className || "Warrior", ...data, skillDesc:"", skillTier:"notable", custom: false };
  }

  function skillList(c=draft.character) {
    const merged = [...(c.startingSkills || []), ...normalizedCustomSkills(c).map(x=>x.name)]
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
    {name:"Rations", base:1, baseCopper:8, category:"food", item:"Rations x1"},
    {name:"Healing Draught", base:4, baseCopper:420, category:"medicine", item:"Healing Draught"},
    {name:"Lockpicks", base:1, baseCopper:70, category:"tools", item:"Lockpicks"},
    {name:"Torch", base:1, baseCopper:3, category:"tools", item:"Torch"},
    {name:"Iron Dagger", base:2, baseCopper:180, category:"weapons", item:"Iron Dagger"},
    {name:"Travel Cloak", base:1, baseCopper:90, category:"clothing", item:"Travel Cloak"}
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
    const c=state.character,w=state.world,g=state.game;
    ensureCurrencySystem(c,w,g);
    ensureSimulationIntegrityData(c,w,g);

    // V4.8 defensive migration: old/partial saves may be missing arrays introduced in later versions.
    c.renown ??= 0;
    c.infamy ??= 0;
    c.injuries = Array.isArray(c.injuries) ? c.injuries : [];
    c.inventory = Array.isArray(c.inventory) ? c.inventory : [];
    c.companions = Array.isArray(c.companions) ? c.companions : [];
    c.properties = Array.isArray(c.properties) ? c.properties : [];
    c.spells = Array.isArray(c.spells) ? c.spells : [];
    c.customSkills = Array.isArray(c.customSkills) ? c.customSkills : [];
    c.specialTraits = Array.isArray(c.specialTraits) ? c.specialTraits : [];
    c.skills = c.skills && typeof c.skills==="object" ? c.skills : {};
    c.stats = c.stats && typeof c.stats==="object" ? c.stats : {str:8,dex:8,con:8,int:8,wis:8,cha:8};
    c.materials = c.materials && typeof c.materials==="object" ? c.materials : {};
    c.equipment ||= {head:null,body:null,hands:null,mainHand:null,offHand:null,cloak:null,accessory:null};
    c.itemProfiles ||= {};
    c.skillProfiles ||= {};
    c.equipmentCondition ||= {};

    w.events = Array.isArray(w.events) ? w.events : [];
    w.npcs = Array.isArray(w.npcs) ? w.npcs : [];
    w.quests = Array.isArray(w.quests) ? w.quests : [];
    w.kingdoms = Array.isArray(w.kingdoms) ? w.kingdoms : [];
    w.factions = Array.isArray(w.factions) ? w.factions : [];
    w.dynasties = Array.isArray(w.dynasties) ? w.dynasties : [];
    w.deepWars = Array.isArray(w.deepWars) ? w.deepWars : [];
    w.dungeons = Array.isArray(w.dungeons) ? w.dungeons : [];
    w.rumours = Array.isArray(w.rumours) ? w.rumours : [];

    g.log = Array.isArray(g.log) ? g.log : [];
    g.sceneNpcs = Array.isArray(g.sceneNpcs) ? g.sceneNpcs : [];
    g.aiHistory = Array.isArray(g.aiHistory) ? g.aiHistory : [];
    g.aiSuggestions = Array.isArray(g.aiSuggestions) ? g.aiSuggestions : [];

    w.questCounter ??= 1;
    w.eventCounter ??= 1;

    w.kingdoms.forEach((k, i) => initialiseKingdomV2(k, seeded(`${w.seed}-migrate-${i}`)));
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
      k.wars = Array.isArray(k.wars) ? k.wars : [];
      k.relations = k.relations && typeof k.relations==="object" ? k.relations : {};
      state.game.crimeHeat[k.id] ??= 0;
      state.game.bounties[k.id] ??= 0;
    });
    state.world.dynasties.forEach(d=>{
      d.heirs = Array.isArray(d.heirs) ? d.heirs : [];
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

  function advanceWorldDayV415(days=1) {
    for (let i=0; i<days; i++) {
      state.world.day++;
      normaliseCalendar();
      livingWorldTick();
    }
  }

  function generateQuestOfferV415(sourceFactionId=null) {
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

  function acceptQuestV417() {
    const q = state.game.activeQuestOffer; if (!q) return;
    q.status = "active";
    state.world.quests.push(q);
    state.game.activeQuestOffer = null;
    addLog(`You accept <strong>${escapeHtml(q.title)}</strong>. ${escapeHtml(q.description)}`, "event");
    addEvent(`Accepted quest: ${q.title}`);
  }

  function progressQuestsV417(kind, amount=1) {
    const active = state.world.quests.filter(q => q.status === "active" && q.objectiveKind === kind);
    active.forEach(q => {
      q.progress = Math.min(q.goal, q.progress + amount);
      addLog(`<strong>Quest:</strong> ${escapeHtml(q.title)} — ${q.progress}/${q.goal}`, "system");
      if (q.progress >= q.goal) completeQuest(q);
    });
  }

  function completeQuestV417(q) {
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

  function maybeLawCheckV415() {
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
      height: "5'10\"",
      build: "Average",
      background: "Peasant",
      customBackground: { name: "", desc: "", gold: 20, items: [], itemDefs: [], skill: "", skillDesc:"", skillTier:"notable" },
      className: "Warrior",
      customClass: { name: "", desc: "", hp: 12, skill: "Focused Strike", skillDesc:"", skillTier:"notable" },
      stats: { str:8, dex:8, con:8, int:8, wis:8, cha:8 },
      pointsRemaining: 18,
      infiniteStatPoints: false,
      startingSkills: [],
      customSkills: [],
      specialTraits: []
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
    setTimeout(() => node.remove(), effectiveViewMode() === "mobile" ? 1800 : 2400);
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn("Draft storage unavailable:", err);
    }
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.character && parsed?.world) {
        draft = parsed;
        draft.character.customRace ||= { name: "", desc: "", bonus: { str:0, dex:0, con:0, int:0, wis:0, cha:0 } };
        draft.character.customBackground ||= { name: "", desc: "", gold: 20, items: [], itemDefs: [], skill: "", skillDesc:"", skillTier:"notable" };
        draft.character.customBackground.itemDefs ||= (draft.character.customBackground.items||[]).map(normalizeItemDef);
        draft.character.customBackground.skillDesc ||= "";
        draft.character.customBackground.skillTier ||= "notable";
        draft.character.customClass ||= { name: "", desc: "", hp: 12, skill: "Focused Strike", skillDesc:"", skillTier:"notable" };
        draft.character.customClass.skillDesc ||= "";
        draft.character.customClass.skillTier ||= "notable";
        draft.character.startingSkills ||= [];
        draft.character.customSkills = normalizedCustomSkills(draft.character);
        draft.character.specialTraits = normalizedSpecialTraits(draft.character);
        draft.character.infiniteStatPoints ||= false;
        draft.character.height ||= "5'10\"";
        draft.character.build ||= "Average";
      }
    } catch {}
  }

  function saveGame(showMessage=true) {
    if (!state.character || !state.world || !state.game) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: "4.20",
      character: state.character,
      worldConfig: state.worldConfig,
      world: state.world,
      game: state.game
    }));
    } catch (err) {
      console.warn("Save storage unavailable:", err);
      if (showMessage) showToast("Safari could not write the local save.");
      return;
    }
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
    window.scrollTo({top: 0, behavior: effectiveViewMode() === "mobile" ? "auto" : "smooth"});
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
            <p>Create a character, generate a realm, meet strangers, fight creatures, gain levels and decide what kind of person you become. The simulation runs in your browser; Free AI narration connects through your Cloudflare Worker.</p>
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
        <div class="field">
          <label for="charHeight">Height</label>
          <input class="input" id="charHeight" maxlength="24" value="${escapeHtml(c.height || "5'10\"")}" placeholder="5'10\", 8'0\", 180 cm...">
          <small>Used by NPCs when judging stature and intimidation.</small>
        </div>
        <div class="field">
          <label for="charBuild">Build</label>
          <select class="select" id="charBuild">
            ${["Slight","Lean","Average","Athletic","Broad","Muscular","Massive"].map(x=>`<option ${c.build===x?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
        <div class="field full">
          <label for="appearance">Appearance & distinguishing features</label>
          <textarea class="textarea" id="appearance" maxlength="700" placeholder="Hair, eyes, scars, tattoos, unusual features, clothing style...">${escapeHtml(c.appearance)}</textarea>
          <small>The AI can see this description every turn. Equipped gear is tracked separately.</small>
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
          <div class="field"><label for="customBackgroundSkillTier">Skill potency</label><select class="select" id="customBackgroundSkillTier">${tierOptions(c.customBackground?.skillTier||"notable")}</select></div>
          <div class="field full"><label for="customBackgroundSkillDesc">What does the skill do?</label><textarea class="textarea compact-textarea" id="customBackgroundSkillDesc" maxlength="650" placeholder="Describe what the skill actually allows your character to do...">${escapeHtml(c.customBackground?.skillDesc || "")}</textarea></div>
        </div>

        <div class="divider"></div>
        <div class="eyebrow">Starting equipment & items</div>
        <p class="section-copy">Define each item separately so the narrator understands what it is and how extraordinary it should appear.</p>
        <div class="form-grid">
          <div class="field"><label for="creatorItemName">Item name</label><input class="input" id="creatorItemName" maxlength="70" placeholder="Heavenly Divine Plate"></div>
          <div class="field"><label for="creatorItemTier">Significance / power</label><select class="select" id="creatorItemTier">${tierOptions("mundane")}</select></div>
          <div class="field"><label for="creatorItemPresence">Visible presence</label><select class="select" id="creatorItemPresence">
            <option value="ordinary">Ordinary-looking</option><option value="distinctive">Distinctive</option><option value="supernatural">Obviously supernatural</option><option value="overwhelming">Overwhelming presence</option>
          </select></div>
          <div class="field"><label for="creatorItemSlot">Equipment slot</label><select class="select" id="creatorItemSlot">
            <option value="auto">Auto-detect</option><option value="head">Head</option><option value="body">Body</option><option value="hands">Hands</option><option value="mainHand">Main hand</option><option value="offHand">Off hand</option><option value="cloak">Cloak</option><option value="accessory">Accessory</option><option value="carried">Carried item</option>
          </select></div>
          <div class="field full"><label for="creatorItemDesc">What is it / what does it do?</label><textarea class="textarea compact-textarea" id="creatorItemDesc" maxlength="900" placeholder="Describe its material, abilities, protections, origin or supernatural properties."></textarea></div>
        </div>
        <button type="button" class="secondary-button" id="addCreatorItem">Add item</button>
        <div class="definition-list">
          ${(c.customBackground?.itemDefs || (c.customBackground?.items||[]).map(normalizeItemDef)).map((item,i)=>`
            <div class="definition-card">
              <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(tierData(item.tier).label)} • ${escapeHtml(item.presence||"ordinary")}${item.slot&&item.slot!=="auto"?` • ${escapeHtml(item.slot)}`:""}</span>${item.desc?`<small>${escapeHtml(item.desc)}</small>`:""}</div>
              <button type="button" class="ghost-button" data-remove-creator-item="${i}">Remove</button>
            </div>`).join("") || `<span class="muted-note">No custom starting items yet.</span>`}
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
          <div class="field"><label for="customClassSkillTier">Technique potency</label><select class="select" id="customClassSkillTier">${tierOptions(c.customClass?.skillTier||"notable")}</select></div>
          <div class="field full"><label for="customClassSkillDesc">What does the technique do?</label><textarea class="textarea compact-textarea" id="customClassSkillDesc" maxlength="650" placeholder="Describe its effect, limitations and what it looks like when used...">${escapeHtml(c.customClass?.skillDesc || "")}</textarea></div>
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
        <span class="skill-count" id="skillCount">${selected.size + normalizedCustomSkills(c).length} chosen</span>
      </div>
      <p class="section-copy">These are added on top of your background skill and class technique. There is no limit.</p>
      <div class="skill-grid" id="skillGrid">
        ${ALL_SKILLS.map(skill => `<label class="skill-option ${selected.has(skill)?"selected":""}"><input type="checkbox" data-skill="${escapeHtml(skill)}" ${selected.has(skill)?"checked":""}><span>${escapeHtml(skill)}</span></label>`).join("")}
      </div>
      <div class="custom-skill-box">
        <div class="form-grid">
          <div class="field"><label for="customSkillInput">Custom skill name</label><input class="input" id="customSkillInput" maxlength="60" placeholder="e.g. Goblin Engineering"></div>
          <div class="field"><label for="customSkillTier">Potency</label><select class="select" id="customSkillTier">${tierOptions("notable")}</select></div>
          <div class="field full"><label for="customSkillDesc">What does this skill do?</label><textarea class="textarea compact-textarea" id="customSkillDesc" maxlength="700" placeholder="Describe exactly what the ability allows, including unusual effects or limitations."></textarea></div>
        </div>
        <button type="button" class="secondary-button" id="addCustomSkill">Add custom skill</button>
        <div class="definition-list" id="customSkillList">
          ${normalizedCustomSkills(c).map((skill,i) => `<div class="definition-card"><div><strong>${escapeHtml(skill.name)}</strong><span>${escapeHtml(tierData(skill.tier).label)}</span>${skill.desc?`<small>${escapeHtml(skill.desc)}</small>`:""}</div><button type="button" class="ghost-button" data-remove-custom-skill="${i}">Remove</button></div>`).join("") || `<span class="muted-note">No custom skills yet.</span>`}
        </div>
      </div>

      <div class="divider"></div>
      <div class="ability-header"><div><div class="eyebrow">Special traits, auras & powers</div><h3>Define passive or unusual attributes</h3></div><span class="skill-count">${normalizedSpecialTraits(c).length} defined</span></div>
      <p class="section-copy">Use this for things such as a Holy Aura, demonic presence, supernatural beauty, dragon blood, a curse, divine blessing or any passive power NPCs may perceive.</p>
      <div class="custom-skill-box">
        <div class="form-grid">
          <div class="field"><label for="traitName">Trait / aura name</label><input class="input" id="traitName" maxlength="70" placeholder="Holy Aura"></div>
          <div class="field"><label for="traitCategory">Type</label><select class="select" id="traitCategory">${["Aura","Blessing","Curse","Mutation","Presence","Bloodline","Passive Power","Other"].map(x=>`<option>${x}</option>`).join("")}</select></div>
          <div class="field"><label for="traitTier">Magnitude</label><select class="select" id="traitTier">${tierOptions("rare")}</select></div>
          <div class="field"><label for="traitManifestation">How noticeable is it?</label><select class="select" id="traitManifestation">${manifestationOptions("obvious")}</select></div>
          <div class="field full"><label for="traitDesc">What does it do / how does it manifest?</label><textarea class="textarea compact-textarea" id="traitDesc" maxlength="1000" placeholder="Example: A radiant holy presence surrounds me. Ordinary people feel warmth and reverence; undead feel instinctive dread."></textarea></div>
        </div>
        <button type="button" class="secondary-button" id="addSpecialTrait">Add trait</button>
        <div class="definition-list">
          ${normalizedSpecialTraits(c).map((trait,i)=>`<div class="definition-card"><div><strong>${escapeHtml(trait.name)}</strong><span>${escapeHtml(trait.category)} • ${escapeHtml(tierData(trait.tier).label)} • ${escapeHtml(MANIFESTATION_LEVELS[trait.manifestation].label)}</span>${trait.desc?`<small>${escapeHtml(trait.desc)}</small>`:""}</div><button type="button" class="ghost-button" data-remove-special-trait="${i}">Remove</button></div>`).join("") || `<span class="muted-note">No special traits yet.</span>`}
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
            <div><span>Identity</span><strong>${c.age} • ${c.sex} • ${escapeHtml(race.name)}</strong></div><div><span>Stature</span><strong>${escapeHtml(c.height || "Average height")} • ${escapeHtml(c.build || "Average")}</strong></div>
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
            <div><span>Special traits</span><strong>${normalizedSpecialTraits(c).length}</strong></div>
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

      document.getElementById("addCreatorItem")?.addEventListener("click",()=>{
        captureOriginFields();
        const name=document.getElementById("creatorItemName")?.value.trim();
        if(!name)return;
        draft.character.customBackground.itemDefs ||= [];
        const exists=draft.character.customBackground.itemDefs.some(x=>String(x.name).toLowerCase()===name.toLowerCase());
        if(!exists){
          draft.character.customBackground.itemDefs.push(normalizeItemDef({
            name,
            desc:document.getElementById("creatorItemDesc")?.value.trim()||"",
            tier:document.getElementById("creatorItemTier")?.value||"mundane",
            presence:document.getElementById("creatorItemPresence")?.value||"ordinary",
            slot:document.getElementById("creatorItemSlot")?.value||"auto"
          }));
        }
        draft.character.customBackground.items=draft.character.customBackground.itemDefs.map(x=>x.name);
        saveDraft();renderWizard();
      });
      document.querySelectorAll("[data-remove-creator-item]").forEach(btn=>btn.addEventListener("click",()=>{
        captureOriginFields();
        draft.character.customBackground.itemDefs ||= [];
        draft.character.customBackground.itemDefs.splice(Number(btn.dataset.removeCreatorItem),1);
        draft.character.customBackground.items=draft.character.customBackground.itemDefs.map(x=>x.name);
        saveDraft();renderWizard();
      }));
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
        const name = document.getElementById("customSkillInput").value.trim();
        if (!name) return;
        const existing = new Set(normalizedCustomSkills(draft.character).map(x => x.name.toLowerCase()));
        if (!existing.has(name.toLowerCase())) {
          draft.character.customSkills.push(normalizeCustomSkillEntry({
            name,
            desc: document.getElementById("customSkillDesc").value.trim(),
            tier: document.getElementById("customSkillTier").value
          }));
        }
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
      document.getElementById("addSpecialTrait")?.addEventListener("click", () => {
        const name=document.getElementById("traitName").value.trim();
        if(!name)return;
        draft.character.specialTraits ||= [];
        const existing=new Set(normalizedSpecialTraits(draft.character).map(x=>x.name.toLowerCase()));
        if(!existing.has(name.toLowerCase())){
          draft.character.specialTraits.push(normalizeSpecialTrait({
            name,
            category:document.getElementById("traitCategory").value,
            tier:document.getElementById("traitTier").value,
            manifestation:document.getElementById("traitManifestation").value,
            desc:document.getElementById("traitDesc").value.trim()
          }));
        }
        saveDraft();renderWizard();
      });
      document.querySelectorAll("[data-remove-special-trait]").forEach(btn=>btn.addEventListener("click",()=>{
        draft.character.specialTraits.splice(Number(btn.dataset.removeSpecialTrait),1);
        saveDraft();renderWizard();
      }));
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
      const previousItems=(c.customBackground?.itemDefs||c.customBackground?.items||[]).map(normalizeItemDef).filter(x=>x.name);
      c.customBackground = {
        name: bgName.value.trim(),
        desc: document.getElementById("customBackgroundDesc").value.trim(),
        gold: Math.max(0, Number(document.getElementById("customBackgroundGold").value) || 0),
        itemDefs: previousItems,
        items: previousItems.map(x=>x.name),
        skill: document.getElementById("customBackgroundSkill").value.trim(),
        skillDesc: document.getElementById("customBackgroundSkillDesc")?.value.trim()||"",
        skillTier: document.getElementById("customBackgroundSkillTier")?.value||"notable"
      };
    }
    const clsName = document.getElementById("customClassName");
    if (clsName) {
      c.customClass = {
        name: clsName.value.trim(),
        desc: document.getElementById("customClassDesc").value.trim(),
        hp: Math.max(0, Math.min(200, Number(document.getElementById("customClassHp").value) || 0)),
        skill: document.getElementById("customClassSkill").value.trim() || "Focused Strike",
        skillDesc: document.getElementById("customClassSkillDesc")?.value.trim()||"",
        skillTier: document.getElementById("customClassSkillTier")?.value||"notable"
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
      c.height = document.getElementById("charHeight")?.value.trim() || "5'10\"";
      c.build = document.getElementById("charBuild")?.value || "Average";
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

    // V4.9: every kingdom receives several persistent places the player may choose as a starting point.
    kingdoms.forEach((k,idx)=>{
      const town=settlementName(rng);
      let village=settlementName(rng);
      if(village===town)village=settlementName(rng);
      const ruin=settlementName(rng);
      k.spawnSites=[
        {id:`${k.id}-capital`,kind:"capital",name:k.capital,areaType:"town",label:`Capital — ${k.capital}`,description:`Begin inside ${k.capital}, the political and commercial heart of ${k.name}. Expect crowds, law enforcement, wealth and faction activity.`},
        {id:`${k.id}-town`,kind:"town",name:town,areaType:"town",label:`Market town — ${town}`,description:`Begin in ${town}, a populated regional town with inns, traders, guards and local problems, but less power than the capital.`},
        {id:`${k.id}-village`,kind:"village",name:village,areaType:"town",label:`Village — ${village}`,description:`Begin in the smaller settlement of ${village}. Local relationships matter more here and outsiders are easier to notice.`},
        {id:`${k.id}-outskirts`,kind:"outskirts",name:`Outskirts of ${k.capital}`,areaType:"outskirts",label:`Outskirts of ${k.capital}`,description:`Begin beyond the main gates among farms, roadside buildings, travellers and the outer approaches to the capital.`},
        {id:`${k.id}-road`,kind:"road",name:`The ${k.name} High Road`,areaType:"road",label:`High road through ${k.name}`,description:`Begin travelling on a major road through ${k.region}, away from immediate shelter and with encounters shaped by travellers, patrols and bandits.`},
        {id:`${k.id}-wild`,kind:"wilderness",name:`The ${k.region} Wilds`,areaType:"wilderness",label:`Wilderness — ${k.region}`,description:`Begin deep in the wild landscape of ${k.region}, where settlements are distant and survival, beasts and discovery matter more than law.`},
        {id:`${k.id}-ruin`,kind:"ruin",name:`Ruins of ${ruin}`,areaType:"ruin",label:`Ancient ruins — ${ruin}`,description:`Begin among abandoned ruins in ${k.region}. The location is isolated, potentially dangerous and suited to immediate exploration.`}
      ];
    });

    const startKingdom = kingdoms[0];
    const defaultSite = startKingdom.spawnSites.find(s=>s.kind==="town") || startKingdom.spawnSites[0];
    const settlement = defaultSite.name;
    const factions = generateFactionsForKingdoms(kingdoms, rng);
    return {
      name:worldName, seed:config.seed, kingdoms, factions, npcs:[], quests:[], questCounter:1, events:[], eventCounter:1,
      startKingdomId:startKingdom.id, startSettlement:settlement, startAreaType:defaultSite.areaType, startSpawnSiteId:defaultSite.id,
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
    c.itemProfiles = Object.fromEntries((bg.itemDefs||[]).map(def=>{
      const n=normalizeItemDef(def); return [n.name,n];
    }));
    c.specialTraits = normalizedSpecialTraits(c);
    c.skillProfiles = {};
    c.equipment = {head:null, body:null, hands:null, mainHand:null, offHand:null, cloak:null, accessory:null};
    autoEquipStartingItems(c);
    c.injuries = [];
    c.skills = {};
    if (bg.skill) {
      c.skills[bg.skill] = 15;
      c.skillProfiles[bg.skill]={name:bg.skill,desc:bg.skillDesc||"",tier:bg.skillTier||"notable",source:"background"};
    }
    if (cls.skill) {
      c.skills[cls.skill] = Math.max(c.skills[cls.skill] || 0, 10);
      c.skillProfiles[cls.skill]={name:cls.skill,desc:cls.skillDesc||"",tier:cls.skillTier||"notable",source:"class"};
    }
    skillList(draft.character).forEach(skill => c.skills[skill] = Math.max(c.skills[skill] || 0, 20));
    normalizedCustomSkills(draft.character).forEach(def=>{
      c.skillProfiles[def.name]={...def,source:"custom"};
    });
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
      areaType: world.startAreaType || "town",
      kingdomId: world.startKingdomId,
      time: "Morning",
      turn: 1,
      activeNpc: null,
      sceneNpcs: [],
      conversationFocusId: null,
      entryReactionKey: null,
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
    ensureV4Data();
    const initialPerception=buildSocialPerception();
    if(["hostile","restricted","kill_on_sight"].includes(initialPerception.local_race_policy)){
      state.game.log.push({type:"event",text:`Local attitudes toward <strong>${escapeHtml(c.race)}</strong> are ${escapeHtml(initialPerception.local_race_policy)} in ${escapeHtml(startKingdom.name)}. Your appearance may immediately affect how guards and civilians treat you.`});
    }

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

  function ensureWorldSpawnSites(world=state.world){
    if(!world?.kingdoms)return;
    world.kingdoms.forEach((k,idx)=>{
      if(Array.isArray(k.spawnSites)&&k.spawnSites.length)return;
      const rng=seeded(`${world.seed}-spawn-migrate-${k.id}-${idx}`);
      const town=settlementName(rng),village=settlementName(rng),ruin=settlementName(rng);
      k.spawnSites=[
        {id:`${k.id}-capital`,kind:"capital",name:k.capital,areaType:"town",label:`Capital — ${k.capital}`,description:`Begin inside ${k.capital}, the political and commercial heart of ${k.name}.`},
        {id:`${k.id}-town`,kind:"town",name:town,areaType:"town",label:`Market town — ${town}`,description:`Begin in a regional market town with guards, inns, traders and local work.`},
        {id:`${k.id}-village`,kind:"village",name:village,areaType:"town",label:`Village — ${village}`,description:`Begin in a smaller settlement where outsiders are noticed quickly.`},
        {id:`${k.id}-outskirts`,kind:"outskirts",name:`Outskirts of ${k.capital}`,areaType:"outskirts",label:`Outskirts of ${k.capital}`,description:`Begin just beyond the capital walls among farms, roadside buildings and travellers.`},
        {id:`${k.id}-road`,kind:"road",name:`The ${k.name} High Road`,areaType:"road",label:`High road through ${k.name}`,description:`Begin on a major road, exposed to travellers, patrols, weather and bandits.`},
        {id:`${k.id}-wild`,kind:"wilderness",name:`The ${k.region} Wilds`,areaType:"wilderness",label:`Wilderness — ${k.region}`,description:`Begin far from settlement in the wild landscape of ${k.region}.`},
        {id:`${k.id}-ruin`,kind:"ruin",name:`Ruins of ${ruin}`,areaType:"ruin",label:`Ancient ruins — ${ruin}`,description:`Begin among isolated ancient ruins with immediate exploration and danger.`}
      ];
    });
  }

  function openingTextForSpawn(c,world,kingdom,backgroundData,site){
    if(!site || ["capital","town","village"].includes(site.kind)){
      return openingText(c,world,kingdom,backgroundData);
    }
    const origin=backgroundData?.custom
      ? `Your life as a ${escapeHtml(backgroundData.name)} has shaped how you reached this point.`
      : `Whatever obligations came with your past as a ${escapeHtml(c.background)}, they have brought you here.`;
    const intros={
      outskirts:`The walls of ${escapeHtml(kingdom.capital)} rise nearby, close enough to hear distant bells and gate traffic but far enough that fields, carts and roadside buildings still dominate the landscape.`,
      road:`The ${escapeHtml(kingdom.name)} High Road stretches ahead through ${escapeHtml(kingdom.region)}. Wagon ruts, old milestones and the occasional distant traveller are the nearest signs of civilisation.`,
      wilderness:`You begin far from any city wall in the ${escapeHtml(kingdom.region)} wilds. Wind, vegetation and the sounds of unseen creatures replace the noise of streets and markets.`,
      ruin:`Broken masonry and weathered stone surround you at ${escapeHtml(site.name)}. Whatever once stood here has been abandoned long enough for the land to begin reclaiming it.`
    };
    return `${origin} ${intros[site.kind]||`You begin at ${escapeHtml(site.name)}.`} You are free to remain, explore, travel toward civilisation or choose another path entirely.`;
  }

  function applyStartingSpawn(kingdomId,siteId){
    ensureWorldSpawnSites();
    const world=state.world;
    const kingdom=world.kingdoms.find(k=>k.id===kingdomId)||world.kingdoms[0];
    const site=kingdom.spawnSites.find(s=>s.id===siteId)||kingdom.spawnSites[0];
    if(!kingdom||!site)return;

    world.startKingdomId=kingdom.id;
    world.startSettlement=site.name;
    world.startAreaType=site.areaType;
    world.startSpawnSiteId=site.id;

    const g=state.game,c=state.character;
    g.location=site.name;
    g.areaType=site.areaType;
    g.kingdomId=kingdom.id;
    g.entryReactionKey=null;
    g.activeNpc=null;
    g.sceneNpcs=[];
    g.conversationFocusId=null;

    const bg={
      name:c.backgroundProfile?.name||c.background,
      desc:c.backgroundProfile?.description||"",
      custom:!!c.backgroundProfile?.custom
    };

    g.log=[
      {type:"event",text:`Year ${world.year}, ${world.day}th day of ${world.season}. ${escapeHtml(c.name)} begins at <strong>${escapeHtml(site.name)}</strong> in <strong>${escapeHtml(kingdom.name)}</strong>.`},
      {type:"story",text:openingTextForSpawn(c,world,kingdom,bg,site)}
    ];
    g.recentEvents=["Adventure begun"];
    ensureSceneState?.();
  }

  function renderWorldReview() {
    const world = state.world;
    ensureWorldSpawnSites(world);
    const selectedKingdom=world.kingdoms.find(k=>k.id===world.startKingdomId)||world.kingdoms[0];

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
              <h3>${escapeHtml(k.name)}</h3>
              <p>${escapeHtml(k.rulerTitle)} ${escapeHtml(k.ruler)} rules from ${escapeHtml(k.capital)}. The realm spans ${escapeHtml(k.region)} and is ${escapeHtml(k.trait)}. Prosperity ${k.prosperity}/100 • Stability ${k.stability}/100.</p>
            </article>
          `).join("")}
        </div>

        <div class="divider"></div>
        <h2 class="section-title">Major factions</h2>
        <p class="section-copy">Guilds, orders, courts and criminal networks compete for influence independently of the crowns.</p>
        <div class="world-grid">
          ${(world.factions||[]).slice(0, Math.min(8, (world.factions||[]).length)).map(f => `
            <article class="kingdom-card">
              <h3>${escapeHtml(f.name)}</h3>
              <p>${titleCase(f.type)} faction led by ${escapeHtml(f.leader)}. Power ${f.power}/100 • Wealth ${f.wealth}/100.</p>
            </article>
          `).join("")}
        </div>

        <div class="divider"></div>
        <div class="spawn-selector-panel">
          <div class="eyebrow">Starting point</div>
          <h2 class="section-title">Choose where your story begins</h2>
          <p class="section-copy">Pick the kingdom first, then the exact kind of place. You are no longer dropped into an unexplained random settlement.</p>
          <div class="form-grid">
            <div class="field">
              <label for="spawnKingdom">Starting kingdom</label>
              <select class="select" id="spawnKingdom">
                ${world.kingdoms.map(k=>`<option value="${escapeHtml(k.id)}" ${k.id===selectedKingdom.id?"selected":""}>${escapeHtml(k.name)} — ${escapeHtml(k.region)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="spawnSite">Starting location</label>
              <select class="select" id="spawnSite"></select>
            </div>
          </div>
          <div class="spawn-preview" id="spawnPreview"></div>
        </div>

        <div class="divider"></div>
        <div class="action-row">
          <button class="ghost-button" id="rerollWorld">Regenerate with new seed</button>
          <button class="primary-button" id="enterWorld">Begin adventure</button>
        </div>
      </section>
    `;

    const kingdomSelect=document.getElementById("spawnKingdom");
    const siteSelect=document.getElementById("spawnSite");
    const preview=document.getElementById("spawnPreview");

    const refreshSites=(keepExisting=true)=>{
      const k=world.kingdoms.find(x=>x.id===kingdomSelect.value)||world.kingdoms[0];
      const previous=keepExisting && world.startKingdomId===k.id ? world.startSpawnSiteId : null;
      siteSelect.innerHTML="";
      (k.spawnSites||[]).forEach(site=>{
        const opt=document.createElement("option");
        opt.value=site.id;
        opt.textContent=site.label||site.name;
        if(site.id===previous)opt.selected=true;
        siteSelect.appendChild(opt);
      });
      if(!siteSelect.value && k.spawnSites?.[0])siteSelect.value=k.spawnSites[0].id;
      refreshPreview();
    };

    const refreshPreview=()=>{
      const k=world.kingdoms.find(x=>x.id===kingdomSelect.value)||world.kingdoms[0];
      const site=k.spawnSites?.find(s=>s.id===siteSelect.value)||k.spawnSites?.[0];
      if(!site)return;
      const typeLabel={town:"Settlement",outskirts:"Outskirts",road:"Road",wilderness:"Wilderness",ruin:"Ruins"}[site.areaType]||titleCase(site.areaType);
      preview.innerHTML=`<strong>${escapeHtml(site.name)}</strong><span>${escapeHtml(k.name)} • ${escapeHtml(typeLabel)}</span><p>${escapeHtml(site.description||"")}</p>`;
    };

    kingdomSelect.addEventListener("change",()=>{
      world.startKingdomId=kingdomSelect.value;
      world.startSpawnSiteId=null;
      refreshSites(false);
    });
    siteSelect.addEventListener("change",refreshPreview);
    refreshSites(true);

    document.getElementById("rerollWorld").addEventListener("click", () => {
      draft.world = {...state.worldConfig, seed: randomSeed()};
      state.wizardStep = 3;
      state.screen = "wizard";
      render();
    });

    document.getElementById("enterWorld").addEventListener("click", () => {
      applyStartingSpawn(kingdomSelect.value,siteSelect.value);
      state.screen = "game";
      if(state.game.areaType==="town")applyTownEntryReaction();
      else if(state.game.areaType==="outskirts")applyGateApproachReaction();
      saveGame(false);
      render();
    });
  }

  function currentKingdom() {
    return state.world.kingdoms.find(k => k.id === state.game.kingdomId);
  }

  function renderGameV415() {
    ensureV2Data();
    const c = state.character, g = state.game, w = state.world, k = currentKingdom();
    const hpPct = Math.max(0, Math.round(c.hp/c.maxHp*100));
    const xpPct = Math.max(0, Math.round(c.xp/c.xpNext*100));
    const gameClass = g.mobileTab === "character" ? "show-character" : g.mobileTab === "world" ? "show-world" : "";
    const activeQuests = (w.quests||[]).filter(q=>q.status==="active");
    const localFactions = (w.factions||[]).filter(f=>f.kingdomId===k.id);
    const metPeople = metNpcList();
    const recentPeople = metPeople.slice(0,3);
    const romanceCount = metPeople.filter(n=>["interested","courting","partner","committed"].includes(n.romance?.state)).length;

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
            <div class="hud-row"><span>Coin</span><strong>${formatWallet(c.currency)}</strong></div>
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
          <section class="panel hud-card"><div class="hud-heading">Visible gear</div><div class="inventory-list">${Object.entries(c.equipment||{}).filter(([,v])=>v).length?Object.entries(c.equipment||{}).filter(([,v])=>v).map(([slot,item])=>`<div class="inventory-item"><span>${escapeHtml(equipmentSlotLabel(slot))}</span><strong>${escapeHtml(item)}</strong></div>`).join(""):`<div class="inventory-item"><span>No equipment visibly worn</span></div>`}</div></section>
          <section class="panel hud-card"><div class="hud-heading">Inventory</div><div class="inventory-list">${(c.inventory||[]).length?(c.inventory||[]).map(item=>`<div class="inventory-item"><span>${escapeHtml(item)}</span></div>`).join(""):`<div class="inventory-item"><span>Empty</span></div>`}</div></section>
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
          <section class="panel hud-card people-hud">
            <div class="hud-heading">People & relationships</div>
            <div class="hud-row"><span>NPCs met</span><strong>${metPeople.length}</strong></div>
            <div class="hud-row"><span>Romantic connections</span><strong>${romanceCount}</strong></div>
            <div class="event-list people-mini-list">
              ${recentPeople.length?recentPeople.map(n=>`<div class="event-item"><span><strong>${escapeHtml(n.name)}</strong><small>${escapeHtml(n.occupation)} • ${escapeHtml(relationshipSummaryLabel(n))}${n.romance?.state&&n.romance.state!=="none"?` • ${escapeHtml(romanceStateLabel(n.romance.state))}`:""}</small></span></div>`).join(""):`<div class="event-item"><span>No one recorded yet.</span></div>`}
            </div>
            <button class="secondary-button ledger-button" id="openPeople" type="button">Open NPC Journal</button>
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
    document.getElementById("openPeople")?.addEventListener("click", showPeopleJournal);
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
      return renderRealMarket();
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
    return `<div class="choice-grid"><button class="choice-button" data-action="explore"><strong>Explore</strong><small>Investigate the local area.</small></button><button class="choice-button" data-action="talk"><strong>Speak to someone</strong><small>Meet or revisit a local NPC.</small></button><button class="choice-button" data-action="work"><strong>Seek a contract</strong><small>Get a persistent quest from a local faction.</small></button><button class="choice-button" data-action="travel"><strong>Travel onward</strong><small>Move to another settlement.</small></button><button class="choice-button" data-action="market"><strong>Visit market</strong><small>Buy goods at dynamic local prices.</small></button><button class="choice-button" data-action="inn"><strong>Visit inn</strong><small>Meet the innkeeper, buy food and hear local talk.</small></button><button class="choice-button" data-action="rest"><strong>Rest</strong><small>Recover and advance the living world.</small></button><button class="choice-button" data-action="rumour"><strong>Follow a rumour</strong><small>Investigate unusual activity.</small></button><button class="choice-button" data-action="underworld"><strong>Underworld</strong><small>Attempt criminal activity and accept the risk.</small></button></div><div class="custom-action"><input class="input" id="customAction" maxlength="180" placeholder="Or type an action: help a guard, steal a purse, visit the tavern, investigate the woods..."><button class="secondary-button" id="doCustomAction">Do it</button></div>`;
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
    const existing=state.world.npcs.filter(n=>!n.dead&&n.location===state.game.location&&n.kingdomId===state.game.kingdomId&&npcScheduleAllowsEncounter(n));
    if(existing.length&&Math.random()<.38)return pick(existing);
    const occupations=["blacksmith","travelling merchant","town guard","hunter","scribe","innkeeper","hedge mage","farmhand","mercenary","messenger","herbalist","stablemaster"];
    const personalities=["guarded but fair","cheerful and talkative","sharp-eyed and suspicious","weary but courteous","proud and impatient","soft-spoken and observant","reckless and amused","nervous around strangers"];
    const occupation=pick(occupations),personality=pick(personalities);
    const typeMap={"town guard":"crown","travelling merchant":"merchant","blacksmith":"merchant","hedge mage":"arcane","herbalist":"faith","hunter":"hunters"};
    const faction=factionForType(state.game.kingdomId,typeMap[occupation])||pick(state.world.factions.filter(f=>f.kingdomId===state.game.kingdomId));
    const baseRep=(faction?.playerRep||0)+(currentKingdom()?.playerRep||0);
    const raceScore=raceAttitudeFor(currentKingdom(),state.character.race);
    const socialShift=Math.round(raceScore/12);
    const npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation,personality,factionId:faction?.id||null,kingdomId:state.game.kingdomId,location:state.game.location,relationship:clamp(randInt(-10,18)+Math.round(baseRep/8)+socialShift,-100,100),memory:[],socialLinks:{}};
    npc.firstImpression=socialPerceptionForNpc(npc);
    state.world.npcs.push(npc);return npc;
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

  function startCombatV417(forceType=null, context=state.game.areaType || "town") {
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

  function handleGameActionV415(action) {
    ensureV2Data();
    const g=state.game,c=state.character;
    if (action.startsWith("combat-")) return combatAction(action);
    if (action.startsWith("npc-")) return npcAction(action);
    if (action==="equipment") { g.equipmentMenu=true; closeV3Menus("equipmentMenu"); return renderGame(); }
    if (action==="equipment-close") { g.equipmentMenu=false; return renderGame(); }
    if (action==="group-add") { addConversationParticipant(); saveGame(false); return renderGame(); }
    if (action==="group-clear") { endConversationGroup(); saveGame(false); return renderGame(); }
    if (action==="social") { g.socialMenu=true; closeV3Menus("socialMenu"); return renderGame(); }
    if (action==="social-close") { g.socialMenu=false; return renderGame(); }
    if (action==="social-face") { c.visibility.faceCovered=!c.visibility.faceCovered; saveGame(false); return renderGame(); }
    if (action==="social-cloak") { c.visibility.cloakClosed=!c.visibility.cloakClosed; saveGame(false); return renderGame(); }
    if (action==="social-weapon") { c.visibility.weaponConcealed=!c.visibility.weaponConcealed; saveGame(false); return renderGame(); }
    if (action==="social-insignia") { c.visibility.insigniaVisible=!c.visibility.insigniaVisible; saveGame(false); return renderGame(); }
    if (action.startsWith("social-aura:")) {
      const idx=Number(action.split(":")[1]);
      const trait=(c.specialTraits||[])[idx];
      if(trait){
        c.auraStates ||= {};
        const key=auraStateKey(trait,idx);
        const current=c.auraStates[key]||"normal";
        c.auraStates[key]=current==="suppressed"?"normal":current==="normal"?"flared":"suppressed";
        invalidateNpcPerceptionSignatures();
        addLog(`<strong>${escapeHtml(trait.name)}:</strong> ${escapeHtml(titleCase(c.auraStates[key]))} manifestation.` ,"system");
      }
      saveGame(false); return renderGame();
    }
    if (action==="social-clear-disguise") { clearPlayerDisguise(); saveGame(false); return renderGame(); }
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
    if (action==="inn") { visitLocalInn(); saveGame(false); return renderGame(); }
    if (action==="market-leave") { g.marketOpen=false; return renderGame(); }
    if (action==="travel-cancel") { g.travelMenu=false; return renderGame(); }
    if (action==="travel-local") {
      const old=g.location;g.travelMenu=false;g.areaType="road";advanceTurn(2);
      if(!g.lawEncounter&&!maybeEncounter("road")){const newPlace=settlementName(Math.random);g.location=newPlace;g.areaType="town";g.entryReactionKey=null;addLog(`You travel from ${escapeHtml(old)} to <strong>${escapeHtml(newPlace)}</strong> within ${escapeHtml(currentKingdom().name)}.`);awardXp(8);progressQuests("travel",1);applyTownEntryReaction();maybeLawCheck();}
      saveGame(false);return renderGame();
    }
    if (action.startsWith("travel-kingdom:")) {
      const destId=action.split(":")[1],from=currentKingdom(),dest=kingdomById(destId); if(!dest)return;
      g.travelMenu=false;g.areaType="road";advanceTurn(3);
      const atWar=from.wars.includes(dest.id);
      if(!g.lawEncounter && (atWar?Math.random()<.55:Math.random()<.18) && maybeEncounter("road")){addLog(atWar?`War has made the border road extremely dangerous.`:`The longer road journey is interrupted before you reach the border.`);saveGame(false);return renderGame();}
      g.kingdomId=dest.id;g.location=dest.capital;g.areaType="town";g.entryReactionKey=null;addLog(`You cross into <strong>${escapeHtml(dest.name)}</strong> and eventually reach ${escapeHtml(dest.capital)}. Local laws, prices and reputation now apply.` ,"event");awardXp(15);progressQuests("travel",1);addEvent(`Entered ${dest.name}`);applyTownEntryReaction();maybeLawCheck();saveGame(false);return renderGame();
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
    if (action==="talk") { const npc=generateNpc(); startConversation(npc, Math.random()<.38 ? randInt(2,3) : 1); addLog(conversationOpeningText(),"event"); advanceTurn(); }
    if (action==="work") { const q=generateQuestOffer(); const f=factionById(q.factionId); addLog(`${f?escapeHtml(f.name):"A local employer"} has a contract available.`,"event"); advanceTurn(); }
    if (action==="travel") { g.travelMenu=true; addLog(`You consider the roads and borders open to you.`); }
    if (action==="market") { g.marketOpen=true; const merchant=getOrCreateMarketMerchant(); g.marketMerchantId=merchant?.id||null; addLog(`You make your way to the market. ${merchant?`<strong>${escapeHtml(merchant.name)}</strong> is handling the stall today. `:""}Prices reflect the current state of ${escapeHtml(currentKingdom().name)}.`); }
    if (action==="rest") {
      const recovered=Math.min(c.maxHp-c.hp,Math.round(c.maxHp*.38)); c.hp+=recovered; c.mana=c.maxMana||c.mana||0; c.injuries=(c.injuries||[]).filter(i=>!(i.severity==="minor"&&Math.random()<.55)); g.time="Morning"; g.turn++; advanceWorldDay(1); addLog(`You rest until morning. ${recovered?`${recovered} HP is restored.`:"You were already at full strength."} The wider world continues moving while you sleep.`); addEvent("Rested for the night"); maybeLawCheck();
    }
    if (action==="rumour") { advanceTurn(); addLog(`You follow a local rumour through taverns, side streets and guarded conversations.`); if(!g.lawEncounter&&!maybeEncounter("outskirts")){const npc=generateNpc();startConversation(npc, Math.random()<.45?2:1);addLog(`<strong>${escapeHtml(npc.name)}</strong> appears to know more than they first admit.`,"event");progressQuests("explore",1);} awardXp(8); }
    if (action==="underworld") { g.crimeMenu=true; addLog(`You begin looking for opportunities that respectable citizens would avoid.`); }
    saveGame(false); renderGame();
  }

  function npcActionV413(action) {
    const g=state.game,c=state.character,n=g.activeNpc;if(!n)return; const f=factionById(n.factionId);
    ensureNpcRelationshipData(n);markNpcMet(n,"interaction");
    if(action==="npc-flirt"){
      attemptNpcFlirt(n);
      advanceTurn();saveGame(false);renderGame();return;
    }
    if(action==="npc-court"){
      attemptNpcCourtship(n);
      advanceTurn();saveGame(false);renderGame();return;
    }
    if(action==="npc-partner"){
      attemptNpcPartnership(n);
      advanceTurn();saveGame(false);renderGame();return;
    }
    if(action==="npc-romance-talk"){
      spendRomanticTime(n);
      advanceTurn();saveGame(false);renderGame();return;
    }
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
      addLog(`${escapeHtml(n.name)} ${friendly?"speaks more openly":"glances around before speaking"}. ${pick(lines)}`); n.relationship=clamp(n.relationship+2,-100,100); addNpcMemory(n,"The player took time to speak with me respectfully.",{category:"conversation"}); awardXp(3);
    }
    if(action==="npc-work"){ const q=generateQuestOffer(n.factionId); addLog(`${escapeHtml(n.name)} offers you a contract on behalf of ${escapeHtml(f?.name||"a local employer")}.`,"event"); addNpcMemory(n,"I offered the player a contract.",{category:"work"}); }
    if(action==="npc-help"){
      const cost=randInt(1,4); n.relationship=clamp(n.relationship+7,-100,100); if(f)changeFactionRep(f.id,2); changeKingdomRep(n.kingdomId,1); c.renown=clamp((c.renown||0)+1,0,999); addNpcMemory(n,"The player helped me without demanding much in return.",{category:"help"}); addLog(`You spend time helping ${escapeHtml(n.name)} with a problem that would otherwise have cost them most of the day. Their attitude toward you noticeably improves.`); progressQuests("urban_help",1); advanceTurn(cost>2?2:1);
    }
    if(action==="npc-join"){
      if(!f){addLog(`${escapeHtml(n.name)} has no faction to induct you into.`);} else if(f.joined){addLog(`You are already recognised as a member of ${escapeHtml(f.name)}.`);} else if(f.playerRep<20){addLog(`${escapeHtml(n.name)} shakes their head. "You need to prove yourself to ${escapeHtml(f.name)} first."`);addNpcMemory(n,"The player asked to join our faction before earning enough trust.");} else {f.joined=true;changeFactionRep(f.id,10);state.character.renown=clamp((state.character.renown||0)+4,0,999);n.relationship=clamp(n.relationship+8,-100,100);addNpcMemory(n,"I helped induct the player into my faction.");addLog(`<strong>FACTION JOINED:</strong> ${escapeHtml(f.name)} now recognises you as one of its own.`,"event");addEvent(`Joined ${f.name}`);} 
    }
    if(action==="npc-threaten"){
      const roll=randInt(1,20)+Math.floor((c.stats.cha+c.stats.str)/5); if(roll>=13){const gold=randInt(3,12);c.gold+=gold;n.relationship=clamp(n.relationship-20,-100,100);addLog(`${escapeHtml(n.name)} backs down and hands over ${gold} gold. Several people nearby notice.`);recordCrime("Extortion",9,true);addNpcMemory(n,"The player threatened me for money.",{category:"hostility"});}else{n.relationship=clamp(n.relationship-12,-100,100);addLog(`${escapeHtml(n.name)} refuses to be intimidated and calls for help.`);recordCrime("Threatening behaviour",6,true);maybeLawCheck();}
    }
    if(action==="npc-leave"){addLog(`You end the conversation.`);endConversationGroup();}
    if(action!=="npc-work"&&action!=="npc-help")advanceTurn(); saveGame(false); renderGame();
  }

  function buyMarketGoodLegacy(index) {
    const good=MARKET_GOODS[index]; if(!good||!state.game.marketOpen)return; const price=worldPrice(good);
    if(state.character.gold<price){showToast(`You need ${price} gold.`);return;}
    state.character.gold-=price; state.character.inventory.push(good.item); const merchant=factionForType(state.game.kingdomId,"merchant"); if(merchant)changeFactionRep(merchant.id,1); addLog(`You buy <strong>${escapeHtml(good.name)}</strong> for ${price} gold.`); advanceTurn(); saveGame(false); renderGame();
  }

  function sellMarketGoodLegacy(index) {
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

  function lawActionV415(action) {
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

  function enemyTurnV412() {
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

  function combatActionV418(action) {
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
    wearEquipmentAfterConflict(e.level || 1);
    persistSceneChange("combat_aftermath", `${e.name} was defeated here.`, {enemy:e.name});
    addEvent(`Defeated ${e.name}`);
    if (e.name !== "Town Guard") progressQuests("combat",1);
    if (e.name === "Town Guard") recordCrime("Violence against the watch", 25, true);
    if (e.npcId) {
      const victim=state.world.npcs.find(n=>n.id===e.npcId);
      if(victim){victim.dead=true;victim.memory.push({day:state.world.day,text:"I was killed by the player."});}
      persistSceneChange("corpse", `${e.name}'s body was left at this location.`, {npcId:e.npcId,name:e.name});
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
      if(tab==="contacts") {const ns=metNpcList();return ns.length?ns.map(n=>`<div class="ledger-row"><div><strong>${escapeHtml(n.name)}</strong><small>${escapeHtml(n.occupation)} • Last known: ${escapeHtml(n.location||"Unknown")} • ${escapeHtml(npcJournalSummary(n))}</small></div><div class="ledger-tags"><span>${escapeHtml(relationshipSummaryLabel(n))}</span>${n.romance?.state!=="none"?`<span>${escapeHtml(romanceStateLabel(n.romance.state))}</span>`:""}${n.dead?`<span class="bad-tag">DEAD</span>`:""}</div></div>`).join(""):`<p class="empty-copy">You have not met any persistent NPCs yet.</p>`;}
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
    ["propertyMenu","magicMenu","craftingMenu","dungeonMenu","politicsMenu","equipmentMenu"].forEach(key => {
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
    g.equipmentMenu ??= false;

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
    // V4.8: both *action* and **action** are accepted.
    const segments=[];let last=0;
    const re=/(\*\*|\*)([\s\S]*?)\1/g;let m;
    while((m=re.exec(raw))){
      const speech=raw.slice(last,m.index).trim();
      if(speech)segments.push({type:"dialogue",text:speech});
      const action=String(m[2]||"").trim();
      if(action)segments.push({type:"action",text:action});
      last=re.lastIndex;
    }
    const tail=raw.slice(last).trim();
    if(tail)segments.push({type:"dialogue",text:tail});
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
  function renderActionAreaV415() {
    const g=state.game,c=state.character;
    if(g.combat){
      const e=g.combat;const known=(c.spells||[]).map(spellById).filter(Boolean);
      return `<div class="combat-box"><h3>${escapeHtml(e.name)} — Lv.${e.level}</h3><div class="hud-row"><span>Enemy HP</span><strong>${e.hp}/${e.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></span></div>${e.statuses?.length?`<div class="character-sub" style="margin-top:8px">Status: ${e.statuses.map(s=>escapeHtml(titleCase(s.name))).join(", ")}</div>`:""}${combatSupportHud(e)}</div>
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
    if(g.equipmentMenu){
      const eq=c.equipment||{};
      const slots=[["head","Head"],["body","Body"],["hands","Hands"],["mainHand","Main hand"],["offHand","Off hand"],["cloak","Cloak"],["accessory","Accessory"]];
      return `<div class="v3-subpanel equipment-panel"><div class="eyebrow">Visible equipment</div><h3>Equipment & appearance</h3><p>Equipped items are treated as visibly worn/carried and directly influence AI social reactions.</p><div class="equipment-slots">${slots.map(([key,label])=>`<div class="system-row"><div><strong>${label}</strong><small>${eq[key]?escapeHtml(eq[key]):"Empty"}</small></div>${eq[key]?`<button class="ghost-button" data-unequip="${key}">Unequip</button>`:""}</div>`).join("")}</div><div class="divider"></div><div class="eyebrow">Inventory</div>${c.inventory.length?c.inventory.map((item,i)=>{const p=itemProfileFor(item,c),slot=guessEquipmentSlot(item,c);return `<div class="system-row"><div><strong>${escapeHtml(item)}</strong><small>${escapeHtml(slot?`Can equip: ${equipmentSlotLabel(slot)}`:"Carried / not wearable")} • ${escapeHtml(p.tierData.label)}${p.desc?`<br>${escapeHtml(p.desc)}`:""}</small></div>${slot?`<button class="secondary-button" data-equip-index="${i}">Equip</button>`:""}</div>`}).join(""):`<p>No carried items.</p>`}<div class="action-row"><button class="ghost-button" data-action="equipment-close">Back</button></div></div>`;
    }
    if(g.socialMenu){
      ensureV46Data();
      const vis=c.visibility,dis=c.disguise,rep=c.reputationLayers,langs=c.languages||[];
      const eq=visibleEquipmentWithCondition(c);
      const seen=playerVisibleIdentity();
      return `<div class="v3-subpanel social-panel">
        <div class="eyebrow">V4.6 social simulation</div>
        <h3>Identity, visibility & reputation</h3>
        <p>These controls change what NPCs can actually perceive. Hidden information remains available to the narrator but should not be used by NPC dialogue unless discovered.</p>

        <div class="social-readout-grid">
          <div class="social-readout"><span>NPCs currently see</span><strong>${escapeHtml(seen.display_identity)}</strong><small>${escapeHtml(seen.apparent_race)} • ${escapeHtml(seen.apparent_status)}</small></div>
          <div class="social-readout"><span>Face</span><strong>${vis.faceCovered?"Obscured":"Visible"}</strong><small>${dis.active?`Disguise quality ${dis.quality}/100`:"No active disguise"}</small></div>
          <div class="social-readout"><span>Weapons</span><strong>${vis.weaponConcealed?"Concealed where possible":"Visible"}</strong><small>${seen.visible_weapons.length} visibly armed item${seen.visible_weapons.length===1?"":"s"}</small></div>
          <div class="social-readout"><span>Apparent wealth</span><strong>${seen.apparent_wealth_label}</strong><small>Based only on visible gear and condition</small></div>
        </div>

        <div class="divider"></div>
        <div class="eyebrow">Visibility</div>
        <div class="choice-grid">
          <button class="choice-button" data-action="social-face"><strong>${vis.faceCovered?"Reveal face":"Cover face"}</strong><small>Changes race/identity recognition.</small></button>
          <button class="choice-button" data-action="social-cloak"><strong>${vis.cloakClosed?"Open cloak":"Close cloak"}</strong><small>Can hide body gear and some heraldry.</small></button>
          <button class="choice-button" data-action="social-weapon"><strong>${vis.weaponConcealed?"Show concealed weapon":"Conceal small weapon"}</strong><small>Large weapons remain obvious.</small></button>
          <button class="choice-button" data-action="social-insignia"><strong>${vis.insigniaVisible?"Hide insignia":"Show insignia"}</strong><small>Controls visible faction/heraldic symbols.</small></button>
        </div>

        <div class="divider"></div>
        <div class="eyebrow">Aura & passive presence</div>
        ${(c.specialTraits||[]).length ? `<p class="section-copy">Cycle each manifested trait between <strong>Suppressed → Normal → Flared</strong>. This changes how strongly nearby NPCs perceive it without changing its underlying canonical power.</p><div class="system-list">${(c.specialTraits||[]).map((trait,i)=>{const mode=getAuraMode(trait,i),eff=effectiveAuraProfile(trait,i);return `<div class="system-row"><div><strong>${escapeHtml(trait.name)}</strong><small>${escapeHtml(trait.category||"Aura")} • ${escapeHtml(tierData(trait.tier).label)} • ${escapeHtml(titleCase(mode))}<br>${escapeHtml(eff.observable_summary)}</small></div><button class="secondary-button" data-action="social-aura:${i}">${escapeHtml(titleCase(mode))}</button></div>`}).join("")}</div>` : `<p>No aura/passive traits are currently defined.</p>`}

        <div class="divider"></div>
        <div class="eyebrow">Current combined impression</div>
        ${(()=>{const imp=synthesizeVisibleImpression(null);return `<div class="impression-card"><strong>${escapeHtml(imp.label)}</strong><span>Overall signal ${imp.score}/100 • ${escapeHtml(imp.novelty_label)}</span><p>${escapeHtml(imp.summary)}</p></div>`})()}

        <div class="divider"></div>
        <div class="eyebrow">Disguise</div>
        <div class="form-grid">
          <div class="field"><label for="disguiseAlias">Alias</label><input class="input" id="disguiseAlias" maxlength="40" value="${escapeHtml(dis.alias||"")}" placeholder="e.g. Ser Corvin"></div>
          <div class="field"><label for="disguiseRace">Apparent race / identity</label><input class="input" id="disguiseRace" maxlength="50" value="${escapeHtml(dis.apparentRace||"")}" placeholder="e.g. Human traveller"></div>
        </div>
        <div class="action-row">
          <button class="secondary-button" id="applyDisguise">Apply disguise</button>
          <button class="ghost-button" data-action="social-clear-disguise">Clear disguise</button>
        </div>

        <div class="divider"></div>
        <div class="eyebrow">Languages</div>
        <div class="ledger-tags">${langs.map(l=>`<span>${escapeHtml(l.name)} • ${escapeHtml(l.level)}</span>`).join("")}</div>

        <div class="divider"></div>
        <div class="eyebrow">Reputation layers</div>
        <div class="social-readout-grid">
          <div class="social-readout"><span>Local</span><strong>${rep.local[currentLocationKey()]||0}</strong><small>${escapeHtml(g.location)}</small></div>
          <div class="social-readout"><span>Kingdom</span><strong>${rep.kingdom[g.kingdomId]??currentKingdom().playerRep??0}</strong><small>${escapeHtml(currentKingdom().name)}</small></div>
          <div class="social-readout"><span>Underworld</span><strong>${rep.underworld||0}</strong><small>Criminal circles</small></div>
          <div class="social-readout"><span>Legendary</span><strong>${rep.legendary||0}</strong><small>Wide-reaching fame</small></div>
        </div>

        <div class="divider"></div>
        <div class="eyebrow">Visible equipment condition</div>
        ${eq.length?eq.map(x=>`<div class="system-row"><div><strong>${escapeHtml(x.label)} — ${escapeHtml(x.item)}</strong><small>${x.condition}% • ${escapeHtml(equipmentConditionLabel(x.condition))}</small></div></div>`).join(""):`<p>No visible equipment.</p>`}

        <div class="action-row"><button class="ghost-button" data-action="social-close">Back</button></div>
      </div>`;
    }
    if(g.activeNpc){
      const n=g.activeNpc,f=factionById(n.factionId),comp=c.companions.find(x=>x.npcId===n.id);
      ensureNpcRelationshipData(n);
      markNpcMet(n,"current conversation");
      const group=getConversationNpcs();
      const romance=n.romance;
      const adultRomance=romanceSystemAvailable(n);
      const romanticButtons=adultRomance
        ? `${romance.state==="none"||romance.state==="interested"?`<button class="choice-button" data-action="npc-flirt"><strong>Flirt</strong><small>Test the romantic waters without forcing an outcome.</small></button>`:""}
           ${romance.state==="interested"?`<button class="choice-button" data-action="npc-court"><strong>Ask to court ${escapeHtml(n.name.split(" ")[0])}</strong><small>Requires genuine trust and mutual interest.</small></button>`:""}
           ${romance.state==="courting"?`<button class="choice-button" data-action="npc-partner"><strong>Ask to become partners</strong><small>Turn an established courtship into a relationship.</small></button>`:""}
           ${["partner","committed"].includes(romance.state)?`<button class="choice-button" data-action="npc-romance-talk"><strong>Spend time together</strong><small>Strengthen the relationship through conversation and shared time.</small></button>`:""}`
        : "";
      return `<div class="npc-card">
        <div class="eyebrow">Conversation • ${group.length} participant${group.length===1?"":"s"}</div>
        <h3>${escapeHtml(n.name)}</h3>
        <div class="character-sub">${escapeHtml(n.occupation)} • ${escapeHtml(n.personality)} • Relationship ${n.relationship}</div>
        <div class="relationship-strip">
          <span>Trust ${n.socialAxes?.trust??0}</span><span>Respect ${n.socialAxes?.respect??0}</span><span>Fear ${n.socialAxes?.fear??0}</span>
          ${romance.state!=="none"?`<span class="romance-tag">${escapeHtml(romanceStateLabel(romance.state))}</span>`:""}
        </div>
        ${group.length>1?`<div class="conversation-cast">${group.map(x=>`<span title="${escapeHtml(x.occupation)} • relationship ${x.relationship}">${escapeHtml(x.name)}</span>`).join("")}</div>`:""}
        ${n.memory?.length?`<p class="npc-memory">Remembers: ${escapeHtml(humaniseNpcMemory(n,n.memory[n.memory.length-1].text))}</p>`:""}
      </div>
      <div class="choice-grid">
        <button class="choice-button" data-action="npc-talk"><strong>Ask about the area</strong><small>The group can react naturally.</small></button>
        <button class="choice-button" data-action="npc-work"><strong>Ask for work</strong><small>Request a contract.</small></button>
        <button class="choice-button" data-action="npc-help"><strong>Offer help</strong><small>Improve relations.</small></button>
        ${romanticButtons}
        ${!comp?`<button class="choice-button" data-action="npc-recruit"><strong>Recruit ${escapeHtml(n.name.split(" ")[0])}</strong><small>${n.relationship>=20?"They may agree.":`Requires relationship 20. Current: ${n.relationship}`}</small></button>`:""}
        ${/innkeeper/.test(String(n.occupation||"").toLowerCase())?`<button class="choice-button" data-action="npc-meal"><strong>Buy a meal</strong><small>3 copper • coin moves into ${escapeHtml(n.name.split(" ")[0])}'s purse.</small></button>`:""}<button class="choice-button" data-action="group-add"><strong>Bring someone else in</strong><small>Add another nearby person to the conversation.</small></button>
        <button class="choice-button" data-action="npc-threaten"><strong>Intimidate</strong><small>Everyone present may react.</small></button>
        <button class="choice-button" data-action="npc-leave"><strong>End conversation</strong></button>
      </div>`;
    }
    return `<div class="choice-grid"><button class="choice-button" data-action="explore"><strong>Explore</strong><small>Investigate locally.</small></button><button class="choice-button" data-action="talk"><strong>Speak to someone</strong><small>Meet a persistent NPC.</small></button><button class="choice-button" data-action="work"><strong>Seek a contract</strong><small>Find quest work.</small></button><button class="choice-button" data-action="travel"><strong>Travel</strong><small>Move within or between kingdoms.</small></button><button class="choice-button" data-action="market"><strong>Market</strong><small>Dynamic economy.</small></button><button class="choice-button" data-action="rest"><strong>Rest</strong><small>Recover and advance the world.</small></button><button class="choice-button" data-action="politics"><strong>Court & Politics</strong><small>Interfere in the balance of power.</small></button><button class="choice-button" data-action="property"><strong>Property</strong><small>Buy homes, workshops and estates.</small></button><button class="choice-button" data-action="magic"><strong>Magic</strong><small>Learn and cast advanced spells.</small></button><button class="choice-button" data-action="crafting"><strong>Crafting</strong><small>Turn materials into equipment.</small></button><button class="choice-button" data-action="equipment"><strong>Equipment</strong><small>Choose what NPCs can visibly see you wearing and carrying.</small></button><button class="choice-button" data-action="social"><strong>Social & Identity</strong><small>Disguise, concealment, languages, reputation and visible condition.</small></button><button class="choice-button" data-action="dungeons"><strong>Dungeons</strong><small>Discover procedural ruins.</small></button><button class="choice-button" data-action="underworld"><strong>Underworld</strong><small>Crime and illicit opportunities.</small></button></div>`;
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
  // V4.5 — RACE EXPECTATIONS / SOCIAL PERCEPTION / GROUP CONVERSATION
  // ============================

  const EQUIPMENT_SLOTS = {
    head:"Head", body:"Body", hands:"Hands", mainHand:"Main hand", offHand:"Off hand", cloak:"Cloak", accessory:"Accessory"
  };

  function equipmentSlotLabel(slot){ return EQUIPMENT_SLOTS[slot] || titleCase(slot); }

  function guessEquipmentSlot(item,c=state.character){
    const explicit=c?.itemProfiles?.[item]?.slot;
    if(explicit && !["auto","carried"].includes(explicit)) return explicit;
    if(explicit==="carried") return null;
    const t=String(item||"").toLowerCase();
    if(/helm|helmet|hood|crown|hat|mask/.test(t)) return "head";
    if(/armour|armor|plate|mail|coat|leather|robe|tunic|clothes|gambeson/.test(t)) return "body";
    if(/gauntlet|glove/.test(t)) return "hands";
    if(/cloak|cape|mantle/.test(t)) return "cloak";
    if(/ring|amulet|necklace|brooch|signet|charm/.test(t)) return "accessory";
    if(/buckler|shield|parrying/.test(t)) return "offHand";
    if(/sword|dagger|knife|bow|axe|mace|spear|staff|wand|focus|hammer|crossbow|cleaver|blade/.test(t)) return "mainHand";
    return null;
  }

  function autoEquipStartingItems(c){
    c.equipment ||= {head:null,body:null,hands:null,mainHand:null,offHand:null,cloak:null,accessory:null};
    (c.inventory||[]).forEach(item=>{
      let slot=guessEquipmentSlot(item,c); if(!slot)return;
      if(slot==="mainHand" && c.equipment.mainHand && !c.equipment.offHand && /dagger|knife|short sword|cleaver/.test(String(item).toLowerCase())) slot="offHand";
      if(!c.equipment[slot]) c.equipment[slot]=item;
    });
  }

  function equipInventoryItem(index){
    ensureV4Data();
    const c=state.character,item=c.inventory[index]; if(!item)return;
    let slot=guessEquipmentSlot(item); if(!slot){showToast("That item is not wearable equipment.");return;}
    if(slot==="mainHand" && c.equipment.mainHand && !c.equipment.offHand && /dagger|knife|short sword|cleaver/.test(String(item).toLowerCase())) slot="offHand";
    c.equipment[slot]=item;
    addLog(`You equip <strong>${escapeHtml(item)}</strong> (${escapeHtml(equipmentSlotLabel(slot))}). NPCs can now visibly react to it.`,"system");
    saveGame(false);renderGame();
  }

  function unequipSlot(slot){
    ensureV4Data(); if(!Object.prototype.hasOwnProperty.call(state.character.equipment,slot))return;
    state.character.equipment[slot]=null; saveGame(false);renderGame();
  }

  function visibleEquipment(c=state.character){
    return Object.entries(c?.equipment||{}).filter(([,item])=>!!item).map(([slot,item])=>({slot,label:equipmentSlotLabel(slot),item}));
  }

  function inferItemTierKey(item,desc=""){
    const t=`${item||""} ${desc||""}`.toLowerCase();
    if(/transcendent|cosmic|reality[- ]?warping|beyond gods|primordial artifact/.test(t))return "transcendent";
    if(/divine|godforged|god-forged|heavenly|celestial armour|celestial armor|holy relic|artifact of a god/.test(t))return "divine";
    if(/mythic|mythical|world[- ]?forged|ancient artifact|archangel/.test(t))return "mythic";
    if(/legendary|legendary relic|dragonforged|dragon-forged/.test(t))return "legendary";
    if(/relic|adamant|mithril|enchanted|masterwork|royal|gilded/.test(t))return "exceptional";
    if(/full plate|plate armour|plate armor|fine steel|silvered|runed/.test(t))return "rare";
    if(/mail|steel|iron armour|iron armor|fine|reinforced/.test(t))return "uncommon";
    if(/sword|bow|leather|iron|shield|helm/.test(t))return "notable";
    return "mundane";
  }

  function inferItemPresence(item,tier){
    const t=String(item||"").toLowerCase();
    if(/radiant|blazing|impossible|halo|divine light|reality|celestial glow/.test(t)||["divine","transcendent"].includes(tier))return "overwhelming";
    if(/enchanted|glowing|rune|mythic|legendary|holy|demonic|celestial/.test(t)||tier==="mythic")return "supernatural";
    if(["rare","exceptional","legendary"].includes(tier)||/gilded|royal|masterwork|ornate/.test(t))return "distinctive";
    return "ordinary";
  }

  function itemProfileFor(item,c=state.character){
    const raw=c?.itemProfiles?.[item];
    if(raw){
      const n=normalizeItemDef(raw);
      return {...n,tierData:tierData(n.tier),custom:true};
    }
    const tier=inferItemTierKey(item,"");
    return {name:String(item||""),desc:"",tier,presence:inferItemPresence(item,tier),slot:"auto",tierData:tierData(tier),custom:false};
  }

  function itemPowerScore(item,c=state.character){
    const p=itemProfileFor(item,c);
    let score=p.tierData.score;
    const condition=typeof equipmentCondition==="function"&&c===state.character?equipmentCondition(item):100;
    score*=.65+.35*(condition/100);
    return clamp(Math.round(score),0,100);
  }

  function itemWealthScore(item,c=state.character){
    const p=itemProfileFor(item,c),t=String(item||"").toLowerCase();
    let n=6+p.tierData.score*.5;
    if(/worn|rust|patched|crude|rag|poor/.test(t))n-=8;
    if(/gold|jewel|gilded|royal|crown|silk/.test(t))n+=10;
    return clamp(Math.round(n),0,65);
  }

  function itemThreatScore(item,c=state.character){
    const p=itemProfileFor(item,c),t=String(item||"").toLowerCase(); let n=p.tierData.score*.28;
    if(/dagger|knife|bow|sword|axe|mace|spear|hammer|crossbow|staff|blade|greatsword/.test(t))n+=18;
    if(/great|war|heavy|two-handed/.test(t))n+=8;
    if(/plate|mail|armour|armor|shield|helm/.test(t))n+=8;
    if(["supernatural","overwhelming"].includes(p.presence))n+=p.tierData.score*.12;
    return clamp(Math.round(n),0,70);
  }

  function equipmentSignificanceSummary(c=state.character,eq=visibleEquipment(c)){
    const entries=eq.map(x=>{
      const profile=itemProfileFor(x.item,c);
      return {...x,profile,score:itemPowerScore(x.item,c)};
    });
    entries.sort((a,b)=>b.score-a.score);
    const top=entries[0]||null;
    const score=top?.score||0;
    const band=score>=98?"transcendent":score>=90?"divine":score>=78?"mythic":score>=64?"legendary":score>=48?"exceptional":score>=32?"rare":score>=18?"martial / notable":"ordinary";
    return {
      highest_score:score,
      reaction_band:band,
      highest_item:top?{name:top.item,tier:top.profile.tierData.label,presence:top.profile.presence,description:top.profile.desc}:null,
      items:entries.map(x=>({name:x.item,slot:x.slot,tier:x.profile.tierData.label,score:x.score,presence:x.profile.presence,description:x.profile.desc}))
    };
  }

  function parseHeightInches(value){
    const s=String(value||"").trim().toLowerCase();
    const cm=s.match(/([0-9.]+)\s*cm/); if(cm)return Number(cm[1])/2.54;
    const m=s.match(/([0-9.]+)\s*m\b/); if(m)return Number(m[1])*39.3701;
    const ft=s.match(/(\d+)\s*['′]\s*(\d+)?/); if(ft)return Number(ft[1])*12+Number(ft[2]||0);
    const plain=Number(s); return Number.isFinite(plain)&&plain>30?plain:null;
  }

  function baseRaceAttitude(name,desc=""){
    const t=`${name} ${desc}`.toLowerCase();
    if(/demon|fiend|abyss|hellspawn/.test(t)) return -95;
    if(/undead|vampire|lich|zombie|skeleton/.test(t)) return -90;
    if(/goblin|kobold/.test(t)) return -55;
    if(/orc|ogre|troll/.test(t)) return -30;
    if(/tiefling|infernal/.test(t)) return -18;
    if(/half-elf/.test(t)) return 18;
    if(/elf/.test(t)) return 28;
    if(/dwarf/.test(t)) return 32;
    if(/human/.test(t)) return 48;
    return 5;
  }

  function ensureKingdomCulture(k,index=0){
    if(k.culture?.raceAttitudes)return k.culture;
    const rng=seeded(`${state.world?.seed||"world"}-culture-${k.id}-${index}`);
    const attitudes={};
    ["Human","Elf","Dwarf","Orc","Half-Elf","Tiefling","Goblin","Undead","Demon"].forEach(r=>{
      attitudes[r]=clamp(baseRaceAttitude(r)+randInt(-18,18,rng),-100,100);
    });
    const trait=String(k.trait||"").toLowerCase();
    if(/secretive|traditional|militarised/.test(trait)) Object.keys(attitudes).forEach(r=>{if(r!=="Human")attitudes[r]=clamp(attitudes[r]-8,-100,100);});
    if(/mercantile|sorcer/.test(trait)){attitudes.Elf=clamp(attitudes.Elf+8,-100,100);attitudes.Tiefling=clamp(attitudes.Tiefling+8,-100,100);}
    k.culture={raceAttitudes:attitudes,armedEntry:pick(["permitted","regulated","regulated","strict"],rng),outsiderTolerance:randInt(32,78,rng)};
    return k.culture;
  }

  function raceAttitudeFor(k,race=state.character?.race){
    ensureKingdomCulture(k);
    if(k.culture.raceAttitudes[race]!=null)return k.culture.raceAttitudes[race];
    const base=baseRaceAttitude(race,state.character?.raceProfile?.description||"");
    const mod=Math.round((k.culture.outsiderTolerance-50)*.45);
    k.culture.raceAttitudes[race]=clamp(base+mod,-100,100);
    return k.culture.raceAttitudes[race];
  }

  function racePolicyFromScore(score){
    if(score<=-80)return "kill_on_sight";
    if(score<=-55)return "hostile";
    if(score<=-30)return "restricted";
    if(score<5)return "distrusted";
    if(score<35)return "tolerated";
    return "accepted";
  }

  const RACE_EXPECTATION_ARCHETYPES = {
    human:{height:[58,78],physical:"ordinary",status:"social baseline",wealth:"varied",magic:"varied",stereotype:"Humans are usually judged more by dress, profession, reputation and behaviour than by race alone."},
    elf:{height:[62,78],physical:"graceful and capable",status:"refined outsider",wealth:"moderate to refined",magic:"above average",stereotype:"Elves are often expected to be poised, skilled and more magically educated than common humans."},
    dwarf:{height:[48,60],physical:"short but sturdy",status:"respected craft tradition",wealth:"practical to prosperous",magic:"low to moderate",stereotype:"Dwarves are expected to be compact, durable and associated with strong arms, metalwork and craftsmanship."},
    orc:{height:[66,84],physical:"strong and dangerous",status:"martial outsider",wealth:"rough to practical",magic:"low",stereotype:"Orcs are commonly assumed to be physically dangerous even before equipment or reputation is considered."},
    goblin:{height:[38,58],physical:"small and comparatively weak",status:"low-status outsider",wealth:"poor",magic:"low",stereotype:"In human societies, ordinary goblins are commonly assumed to be small, physically weaker than humans, poor, lightly equipped scavengers, labourers or raiders."},
    kobold:{height:[30,48],physical:"small and weak",status:"low-status outsider",wealth:"poor",magic:"low",stereotype:"Kobolds are usually assumed to be physically weak individually and dangerous mainly through traps, numbers or cunning."},
    halfling:{height:[34,50],physical:"small and non-threatening",status:"ordinary outsider",wealth:"modest",magic:"low",stereotype:"Halflings are usually perceived as physically non-threatening unless their equipment, behaviour or reputation suggests otherwise."},
    tiefling:{height:[58,80],physical:"human-like",status:"supernaturally marked outsider",wealth:"varied",magic:"elevated",stereotype:"Tieflings are often treated as potentially magical or infernal, with fear depending heavily on local religion and superstition."},
    undead:{height:[36,90],physical:"unnatural",status:"forbidden being",wealth:"irrelevant",magic:"high",stereotype:"Undead are generally assumed to be unnatural and dangerous regardless of mundane wealth or social presentation."},
    demon:{height:[40,110],physical:"supernatural threat",status:"hostile supernatural being",wealth:"irrelevant",magic:"extreme",stereotype:"Demons are generally treated as supernatural threats whose appearance can override ordinary social assumptions."}
  };

  function raceExpectationArchetype(name=state.character?.race,desc=state.character?.raceProfile?.description||""){
    const t=`${name||""} ${desc||""}`.toLowerCase();
    if(/demon|demonic|fiend|abyss|hellspawn|devil|infernal goblin/.test(t)) return {key:"demon",...RACE_EXPECTATION_ARCHETYPES.demon,base_race:/goblin/.test(t)?"goblin":null};
    if(/undead|vampire|lich|zombie|skeleton/.test(t)) return {key:"undead",...RACE_EXPECTATION_ARCHETYPES.undead};
    for(const key of ["goblin","kobold","orc","dwarf","halfling","tiefling","elf","human"]){if(t.includes(key)) return {key,...RACE_EXPECTATION_ARCHETYPES[key]};}
    return {key:"custom",height:[54,82],physical:"unknown",status:"unfamiliar outsider",wealth:"unknown",magic:"unknown",stereotype:`Most locals have no reliable shared expectation for ${name||"this race"}; they judge visible traits, behaviour and rumours more heavily.`};
  }

  function raceDeviationProfile(c=state.character,eq=visibleEquipment(c)){
    const exp=raceExpectationArchetype(c.race,c.raceProfile?.description||"");
    const h=parseHeightInches(c.height), deviations=[];
    let anomaly=0;
    if(h){
      if(h>exp.height[1]+10){deviations.push(`extremely tall for the expected ${c.race} range (${c.height})`);anomaly+=32;}
      else if(h>exp.height[1]){deviations.push(`unusually tall for ${c.race} (${c.height})`);anomaly+=18;}
      else if(h<exp.height[0]-6){deviations.push(`unusually small even for ${c.race} (${c.height})`);anomaly+=10;}
    }
    const build=String(c.build||"").toLowerCase();
    if(/massive|hulking|giant|muscular|broad/.test(build)){deviations.push(`an unusually imposing ${c.build} build`);anomaly+=exp.key==="goblin"||exp.key==="kobold"||exp.key==="halfling"?24:10;}
    const str=Number(c.stats?.str||8);
    if(str>=18){deviations.push(`exceptional visible physical power (STR ${str})`);anomaly+=exp.key==="goblin"||exp.key==="kobold"?20:9;}
    const gearWealth=eq.reduce((sum,x)=>sum+itemWealthScore(x.item),0);
    const gearThreat=eq.reduce((sum,x)=>sum+itemThreatScore(x.item),0);
    const gearText=eq.map(x=>x.item).join(" ").toLowerCase();
    if(gearWealth>=55){deviations.push("obviously expensive or elite equipment");anomaly+=exp.key==="goblin"?26:13;}
    else if(gearWealth>=35){deviations.push("better equipment than locals would normally expect");anomaly+=exp.key==="goblin"?15:7;}
    if(gearThreat>=45){deviations.push("heavily armed or battle-ready equipment");anomaly+=12;}
    const full=`${c.race||""} ${c.raceProfile?.description||""} ${c.appearance||""} ${c.classProfile?.description||""} ${gearText}`.toLowerCase();
    const demonic=/demon|demonic|fiend|abyss|hell|infernal|horned|hellspawn|devil/.test(full);
    if(demonic && exp.key!=="demon"){deviations.push("visible demonic or infernal traits that contradict the ordinary racial baseline");anomaly+=38;}
    const magical=/arcane|sorcer|wizard|warlock|mage|eldritch|necrom|rune|enchanted|glowing/.test(full)||(c.spells||[]).length>=3;
    if(magical){deviations.push("clear signs of significant magical capability");anomaly+=exp.key==="goblin"||exp.key==="kobold"?18:8;}
    if((c.renown||0)>=50){deviations.push(`high renown (${c.renown})`);anomaly+=12;}
    if((c.infamy||0)>=35){deviations.push(`dangerous infamy (${c.infamy})`);anomaly+=15;}
    anomaly=clamp(anomaly,0,100);
    let category=anomaly>=75?"extraordinary exception":anomaly>=50?"major exception":anomaly>=25?"noticeable exception":"fits ordinary expectations";
    return {expectation:exp,deviations,anomaly_score:anomaly,anomaly_category:category,demonic,magical,gear_wealth_score:gearWealth,gear_threat_score:gearThreat};
  }

  function perceptionThreatLabel(baseThreat,anomaly,intimidation){
    if(baseThreat==="supernatural threat"||baseThreat==="unnatural") return intimidation>=75?"extreme":"very high";
    if(anomaly>=70||intimidation>=85) return "extreme";
    if(anomaly>=45||intimidation>=70) return "high";
    if(anomaly>=20||intimidation>=50) return "elevated";
    if(/weak|non-threatening/.test(baseThreat)) return "low";
    return "ordinary";
  }

  function ensureNpcVisualProfile(npc){
    if(!npc)return null;
    if(npc.visualProfile)return npc.visualProfile;
    const rng=seeded(`${state.world?.seed||"world"}-npc-visual-${npc.id}`);
    const occ=String(npc.occupation||"").toLowerCase();
    const age=pick(["young adult","in their thirties","middle-aged","weathered and older"],rng);
    const build=pick(["lean","stocky","broad-shouldered","rangy","compact","heavy-set"],rng);
    const face=pick(["a square jaw","sharp cheekbones","a broad weathered face","a narrow face and deep-set eyes","a crooked nose","a scar cutting one eyebrow"],rng);
    const hair=pick(["close-cropped dark hair","greying hair cut short","ash-blond hair","curly brown hair","black hair tied at the nape","a shaved head"],rng);
    let clothing,gear=[];
    if(/guard|watch|warden|soldier/.test(occ)){
      clothing=pick(["a faded surcoat over riveted mail","a dented breastplate over a quilted gambeson","well-oiled mail beneath a weather-stained watch cloak"],rng);
      gear=pick([["iron-tipped spear","shortsword","wooden shield"],["halberd","belt knife","signal horn"],["spear","mace","round shield"]],rng);
    }else if(/noble|court/.test(occ)){
      clothing=pick(["a fitted wool coat edged with embroidery","dark velvet beneath an expensive mantle","finely tailored riding clothes with a signet ring"],rng); gear=[pick(["ceremonial dagger","jewelled clasp","signet ring"],rng)];
    }else if(/merchant|trader|innkeeper/.test(occ)){
      clothing=pick(["a well-cut wool coat with polished buttons","layered travelling clothes of good quality","a fur-trimmed vest over clean linen"],rng);gear=[pick(["heavy coin purse","ledger case","brass key-ring"],rng)];
    }else if(/mage|scholar|scribe/.test(occ)){
      clothing=pick(["ink-marked robes under a practical travel coat","layered robes stitched with faded symbols","a scholar's coat with stained cuffs and many pockets"],rng);gear=[pick(["wand case","leather folio","rune-marked staff"],rng)];
    }else{
      clothing=pick(["a plain wool tunic under a weatherproof cloak","road-worn clothes patched at the elbows","practical local clothing worn soft at the seams"],rng);gear=[];
    }
    const detail=pick(["callused hands","mud dried around the boots","an old burn mark near the jaw","a nick missing from one ear","carefully maintained gloves","a faint limp"],rng);
    const posture=/nervous|wary|suspicious/.test(npc.personality||"")?"tense and watchful":/proud|stern/.test(npc.personality||"")?"upright and controlled":"alert but natural";
    const voice=/nervous/.test(npc.personality||"")?"quick and slightly tight":/stern|disciplined/.test(npc.personality||"")?"clipped and authoritative":pick(["low and rough","clear and measured","dry and matter-of-fact"],rng);
    npc.visualProfile={apparent_age:age,build,face,hair,clothing,visible_gear:gear,distinguishing_detail:detail,posture,voice};
    return npc.visualProfile;
  }

  function locationVisualContext(){
    const g=state.game,k=currentKingdom(); state.world.locationVisuals ||= {};
    const key=`${k.id}:${g.location}:${g.areaType}`;
    if(state.world.locationVisuals[key])return state.world.locationVisuals[key];
    const rng=seeded(`${state.world.seed}-location-visual-${key}`);
    let ctx;
    if(g.areaType==="town"){
      ctx={
        architecture:pick(["timber-framed houses crowded behind a stone curtain wall","grey stone buildings roofed in slate around a muddy central road","plastered townhouses and workshops pressed inside an old defensive wall"],rng),
        condition:pick(["well-kept but heavily trafficked","prosperous in the centre and worn at the edges","scarred by weather and years of hurried repairs"],rng),
        sensory:pick(["woodsmoke, horse sweat and baking bread","coal smoke, wet stone and tannery stink","market shouting, hammering metal and the smell of roasting onions"],rng),
        defences:pick(["a gatehouse with murder holes and iron-bound doors","a squat gate tower, raised portcullis and watch platform","a narrow stone gate flanked by arrow slits and a timber fighting gallery"],rng),
        banners:`the colours of ${k.name}`
      };
    }else if(g.areaType==="road") ctx={terrain:pick(["a rutted trade road between hedges","a stone-marked road crossing open farmland","a muddy road winding between low hills"],rng),sensory:pick(["cold wind and wagon dust","damp earth and distant woodsmoke","birdsong broken by cart wheels"],rng)};
    else if(g.areaType==="wilderness"||g.areaType==="forest") ctx={terrain:pick(["dense woodland broken by animal tracks","rough heath and scrub beyond cultivated land","old forest where roots buckle the path"],rng),sensory:pick(["wet leaves and resin","moss, rain and distant birds","cold soil and decaying wood"],rng)};
    else ctx={terrain:pick(["weathered stone and uneven ground","a cramped, shadowed space marked by age","broken masonry and old debris"],rng),sensory:pick(["dust and damp","stale air and stone","cold air carrying faint echoes"],rng)};
    state.world.locationVisuals[key]=ctx; return ctx;
  }

  function buildSocialPerception(npc=null){
    const c=state.character,k=currentKingdom(),eq=visibleEquipment(c);
    const height=parseHeightInches(c.height);
    const gearWealth=eq.reduce((sum,x)=>sum+itemWealthScore(x.item),0);
    const gearThreat=eq.reduce((sum,x)=>sum+itemThreatScore(x.item),0);
    const bodyThreat={Slight:-8,Lean:-4,Average:0,Athletic:6,Broad:8,Muscular:13,Massive:19}[c.build]||0;
    const heightThreat=height?clamp(Math.round((height-68)*1.35),-12,25):0;
    const apparentWealth=clamp(Math.round(gearWealth+(c.renown||0)*.2+(c.background==="Noble"?15:0)),0,100);
    const intimidation=clamp(Math.round(20+(c.stats?.str||8)*1.4+bodyThreat+heightThreat+gearThreat*.45+(c.infamy||0)*.35),0,100);
    const prestige=clamp(Math.round((c.renown||0)*.7+apparentWealth*.35+(currentKingdom()?.playerRep||0)*.2),0,100);
    const attitude=raceAttitudeFor(k,c.race),policy=racePolicyFromScore(attitude);
    const deviation=raceDeviationProfile(c,eq);
    const visiblyArmed=eq.some(x=>["mainHand","offHand"].includes(x.slot)&&/sword|dagger|knife|bow|axe|mace|spear|hammer|crossbow|staff|blade|cleaver/.test(String(x.item).toLowerCase()));
    const threat=perceptionThreatLabel(deviation.expectation.physical,deviation.anomaly_score,intimidation);
    let guard="routine";
    if(policy==="kill_on_sight") guard=threat==="extreme"||threat==="high"?"raise the alarm, keep distance, form a defensive line and attack with support":"attack on recognition";
    else if(policy==="hostile") guard=threat==="extreme"||threat==="high"?"avoid a lone confrontation; level weapons, call reinforcements and issue commands from distance":visiblyArmed?"armed confrontation likely":"detain, expel or challenge";
    else if(policy==="restricted") guard=threat==="extreme"||threat==="high"?"block entry cautiously, summon a superior and avoid provoking the unusually dangerous outsider":"challenge entry and demand justification/disarmament";
    else if(policy==="distrusted") guard=threat==="extreme"||threat==="high"?"watch intensely, keep tactical distance and quietly alert other guards":"watch closely and question if suspicious";
    else if(k.culture?.armedEntry==="strict"&&visiblyArmed) guard="demand weapons be surrendered or peace-bonded";
    else if(k.culture?.armedEntry==="regulated"&&visiblyArmed) guard=threat==="high"||threat==="extreme"?"notice the weaponry, keep distance and question purpose before allowing passage":"notice weapons and may question purpose";
    const injured=(c.injuries||[]).length>0;
    const base={
      height:c.height,build:c.build,appearance:c.appearance,
      apparent_wealth:apparentWealth,apparent_wealth_label:apparentWealth>=70?"wealthy":apparentWealth>=40?"comfortable":apparentWealth>=20?"modest":"poor",
      intimidation,intimidation_label:intimidation>=80?"extreme":intimidation>=60?"high":intimidation>=40?"noticeable":"low",
      prestige,visible_weapons:visiblyArmed,visibly_injured:injured,
      local_race_attitude:attitude,local_race_policy:policy,expected_guard_reaction:guard,
      race_expectation:deviation.expectation,racial_deviations:deviation.deviations,racial_anomaly_score:deviation.anomaly_score,racial_anomaly_category:deviation.anomaly_category,
      perceived_threat:threat,demonic_traits:deviation.demonic,magical_signs:deviation.magical
    };
    base.npc_specific=npc?socialPerceptionForNpc(npc,base):null;
    return base;
  }

  function socialPerceptionForNpc(npc,base=null){
    const p=base||buildSocialPerception();
    const attitude=Number(p.local_race_attitude??0),wealth=Number(p.apparent_wealth??0),anomaly=Number(p.racial_anomaly_score||0);
    let fear=Math.round(Number(p.intimidation||0)*.55),respect=Math.round(Number(p.prestige||0)*.5),suspicion=Math.max(0,Math.round(-attitude*.55)),curiosity=Math.round(anomaly*.25);
    const occ=String(npc?.occupation||"").toLowerCase(),person=String(npc?.personality||"").toLowerCase();
    let likelyReaction="assess normally";
    if(/guard|watch|warden|soldier/.test(occ)){suspicion+=15;if(p.visible_weapons)suspicion+=12;fear+=Math.round(anomaly*.18);likelyReaction=p.expected_guard_reaction;}
    if(/merchant|trader|innkeeper|blacksmith/.test(occ)){respect+=Math.round(wealth*.2);likelyReaction=wealth>=65?"notice the player's purchasing power and unusual equipment":"judge whether the player is safe and able to pay";}
    if(/noble|court|official/.test(occ)){respect+=Math.round(p.prestige*.2);suspicion+=Math.round(anomaly*.1);likelyReaction=anomaly>=45?"wonder what status, patron or story explains such an unusual figure":"judge status, heraldry and etiquette";}
    if(/mage|scholar|scribe|alchemist/.test(occ)){curiosity+=Math.round(anomaly*.35)+(p.magical_signs?20:0);likelyReaction=anomaly>=30?"show intellectual curiosity about the unusual racial or magical traits":"observe details others may miss";}
    if(/thief|criminal|bandit|smuggler/.test(occ)){suspicion+=8;likelyReaction=(fear>=55||p.perceived_threat==="high"||p.perceived_threat==="extreme")?"decide the player is dangerous prey and avoid a simple robbery":"assess the player as a possible mark";}
    if(/farmer|peasant|labour|labor|beggar/.test(occ)){fear+=Math.round(anomaly*.2);likelyReaction=anomaly>=45?"stare, give space, whisper or react superstitiously":"react according to local racial prejudice and visible status";}
    if(/nervous|wary/.test(person))fear+=12;
    if(/proud|reckless/.test(person))fear-=8;
    if(/curious|scholarly/.test(person))curiosity+=15;
    return {fear:clamp(fear,0,100),respect:clamp(respect,0,100),suspicion:clamp(suspicion,0,100),curiosity:clamp(curiosity,0,100),likely_reaction:likelyReaction};
  }

  function npcForAi(n){
    const f=factionById(n.factionId),per=buildSocialPerception(n).npc_specific;
    return {id:n.id,name:n.name,occupation:n.occupation,personality:n.personality,relationship:n.relationship,faction:f?.name||null,faction_id:n.factionId||null,memory:compactArray(n.memory||[],6),companion:!!n.companion,dead:!!n.dead,first_impression:n.firstImpression||per,perception_of_player:per,visual_profile:ensureNpcVisualProfile(n)};
  }

  function getConversationNpcs(){
    if(!state.game||!state.world)return [];
    const ids=[...(state.game.sceneNpcs||[])];
    if(state.game.activeNpc?.id&&!ids.includes(state.game.activeNpc.id))ids.unshift(state.game.activeNpc.id);
    return ids.map(id=>findNpcById(id)).filter(n=>n&&!n.dead).slice(0,5);
  }

  function ensureNpcSocialLink(a,b){
    if(!a||!b||a.id===b.id)return null;
    a.socialLinks||={};b.socialLinks||={};
    if(a.socialLinks[b.id])return a.socialLinks[b.id];
    const rng=seeded(`${state.world.seed}-link-${[a.id,b.id].sort().join("-")}`);
    let score=randInt(-35,45,rng);
    if(a.factionId&&a.factionId===b.factionId)score+=20;
    if(a.occupation===b.occupation)score+=8;
    score=clamp(score,-100,100);
    const label=score>=45?"close ally":score>=20?"friendly":score<=-45?"rival":score<=-20?"strained":"acquaintance";
    const link={score,label}; a.socialLinks[b.id]=link;b.socialLinks[a.id]={score,label};return link;
  }

  function conversationDynamics(list=getConversationNpcs()){
    const out=[];
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
      const link=ensureNpcSocialLink(list[i],list[j]);
      out.push({a_id:list[i].id,a_name:list[i].name,b_id:list[j].id,b_name:list[j].name,relationship:link?.label||"acquaintance",score:link?.score||0});
    }
    return out;
  }

  function generateDistinctNpc(excluded=[]){
    for(let tries=0;tries<10;tries++){const n=generateNpc();if(n&&!excluded.includes(n.id))return n;}
    return null;
  }

  function startConversationV417(primary,count=1){
    if(!primary)return;
    const g=state.game;g.activeNpc=primary;g.conversationFocusId=primary.id;g.sceneNpcs=[primary.id];
    const target=clamp(count,1,4);
    while(g.sceneNpcs.length<target){const n=generateDistinctNpc(g.sceneNpcs);if(!n)break;g.sceneNpcs.push(n.id);}
    getConversationNpcs().forEach(n=>{
      markNpcMet(n,"conversation");
      n.firstImpression||=socialPerceptionForNpc(n);
    });
    conversationDynamics();
  }

  function addConversationParticipant(){
    const g=state.game;if(!g.activeNpc){showToast("Start a conversation first.");return;}
    g.sceneNpcs||=[g.activeNpc.id];
    if(g.sceneNpcs.length>=5){showToast("The conversation is already crowded.");return;}
    const n=generateDistinctNpc(g.sceneNpcs);if(!n)return;
    g.sceneNpcs.push(n.id);markNpcMet(n,"joined conversation");n.firstImpression||=socialPerceptionForNpc(n);conversationDynamics();
    addLog(`<strong>${escapeHtml(n.name)}</strong>, a ${escapeHtml(n.occupation)}, joins the conversation.`,"event");
  }

  function endConversationGroup(){
    if(!state.game)return;state.game.activeNpc=null;state.game.sceneNpcs=[];state.game.conversationFocusId=null;
  }

  function conversationOpeningText(){
    const list=getConversationNpcs(); if(!list.length)return "You look for someone to speak with.";
    if(list.length===1){
      const n=list[0],v=ensureNpcVisualProfile(n);
      return `You approach <strong>${escapeHtml(n.name)}</strong>, a ${escapeHtml(n.occupation)}: ${escapeHtml(v.apparent_age)}, ${escapeHtml(v.build)}, with ${escapeHtml(v.face)} and ${escapeHtml(v.hair)}. They wear ${escapeHtml(v.clothing)}${v.visible_gear.length?`, with ${escapeHtml(v.visible_gear.join(", "))} visible`:""}. Their posture is ${escapeHtml(v.posture)}.`;
    }
    const details=list.slice(0,3).map(n=>{const v=ensureNpcVisualProfile(n);return `<strong>${escapeHtml(n.name)}</strong> (${escapeHtml(n.occupation)}), ${escapeHtml(v.build)}, wearing ${escapeHtml(v.clothing)}`;}).join("; ");
    return `You approach a small group: ${details}. The conversation shifts as they notice you.`;
  }

  function makeGuardNpc(){
    const k=currentKingdom(),f=factionForType(k.id,"crown");
    const npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation:"town guard",personality:pick(["disciplined and wary","stern and procedural","sharp-eyed and suspicious"]),factionId:f?.id||null,kingdomId:k.id,location:state.game.location,relationship:-20,memory:[],socialLinks:{}};
    npc.firstImpression=socialPerceptionForNpc(npc);state.world.npcs.push(npc);return npc;
  }

  function applyTownEntryReaction(){
    ensureV4Data();const g=state.game;if(g.areaType!=="town"||g.combat)return;
    const key=`${g.kingdomId}:${g.location}:${state.character.race}`;if(g.entryReactionKey===key)return;g.entryReactionKey=key;
    const p=buildSocialPerception();
    maybeAmbientPresenceReaction(p);
    if(p.local_race_policy==="kill_on_sight"){
      addLog(`Your race is legally treated as an immediate threat in ${escapeHtml(currentKingdom().name)}. The watch recognises you and moves to attack.`,"event");
      startCombat(GUARD_ENCOUNTER,"town");return;
    }
    if(p.local_race_policy==="hostile" || p.local_race_policy==="restricted"){
      const a=makeGuardNpc(),b=makeGuardNpc();startConversation(a,1);state.game.sceneNpcs=[a.id,b.id];
      const av=ensureNpcVisualProfile(a),bv=ensureNpcVisualProfile(b);
      addLog(`<strong>The town watch intercepts you.</strong> ${escapeHtml(a.name)} is ${escapeHtml(av.apparent_age)}, ${escapeHtml(av.build)}, wearing ${escapeHtml(av.clothing)} and carrying ${escapeHtml(av.visible_gear.join(", "))}. ${escapeHtml(b.name)} is ${escapeHtml(bv.apparent_age)}, ${escapeHtml(bv.build)}, in ${escapeHtml(bv.clothing)}, with ${escapeHtml(bv.visible_gear.join(", "))}. Local policy toward ${escapeHtml(state.character.race)}s is ${escapeHtml(p.local_race_policy)}; ${escapeHtml(p.expected_guard_reaction)}.`,"event");
      return;
    }
    if(/strict|regulated/.test(currentKingdom().culture?.armedEntry||"") && p.visible_weapons){
      const guard=makeGuardNpc();startConversation(guard,1);addLog(`A guard's attention settles on your visible weaponry. ${escapeHtml(p.expected_guard_reaction)}.`,"event");
    }
  }

  // ============================
  // V4 — AI NARRATOR LAYER
  // ============================

  const AI_CONFIG_KEY = "realmsAndRuinAiConfigV4";
  const AI_DEFAULT_CONFIG = {
    mode: "free",
    endpoint: "https://long-forest-5ba7.chudfart195.workers.dev",
    narratorStyle: "immersive",
    responseLength: "medium"
  };

  function getAiConfig() {
    try {
      const cfg = {...AI_DEFAULT_CONFIG, ...(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}"))};
      if (cfg.mode === "live") cfg.mode = "free";
      if (!["free","demo"].includes(cfg.mode)) cfg.mode = "free";
      return cfg;
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
    const c=state.character,g=state.game,w=state.world;
    g.aiHistory ||= [];
    g.aiSuggestions ||= [];
    g.aiBusy ||= false;
    g.aiTurn ||= 0;
    g.aiLastError ||= "";
    g.sceneNpcs ||= g.activeNpc ? [g.activeNpc.id] : [];
    g.conversationFocusId ||= g.activeNpc?.id || null;
    g.entryReactionKey ??= null;
    c.height ||= "5'10\"";
    c.build ||= "Average";
    c.equipment ||= {head:null,body:null,hands:null,mainHand:null,offHand:null,cloak:null,accessory:null};
    if(!Object.values(c.equipment).some(Boolean)) autoEquipStartingItems(c);
    w.kingdoms.forEach((k,i)=>ensureKingdomCulture(k,i));
    w.locationVisuals ||= {};
    (w.npcs||[]).forEach(n=>{n.socialLinks ||= {}; n.firstImpression ||= null;});
    ensureV46Data();
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
    const c=state.character,g=state.game,w=state.world,k=currentKingdom();
    const participants=getConversationNpcs();
    const npc=g.activeNpc;
    const localFactions=(w.factions||[]).filter(f=>f.kingdomId===k.id).slice(0,5);
    const activeQuests=(w.quests||[]).filter(q=>q.status==="active").slice(0,4);
    const d=dynastyForKingdom(k.id);
    const perception=buildSocialPerception();

    return {
      game_rules:{
        world_magic_level:state.worldConfig.magic,
        world_danger_level:state.worldConfig.danger,
        political_climate:state.worldConfig.politics,
        player_controls_own_choices:true,
        permanent_injuries_enabled:true,
        appearance_affects_social_reactions:true,
        race_policy_is_simulation_fact:true,
        group_conversations_enabled:true
      },
      player:{
        name:c.name,sex:c.sex,age:c.age,race:c.race,
        race_description:c.raceProfile?.description||"",
        background:c.background,background_description:c.backgroundProfile?.description||"",
        class:c.className,class_description:c.classProfile?.description||"",
        level:c.level,stats:c.stats,
        appearance_profile:{height:c.height,build:c.build,description:c.appearance},
        equipment:{...(c.equipment||{})},
        visibly_equipped:visibleEquipment(c),
        social_perception:perception,
        hp:{current:c.hp,max:c.maxHp},mana:{current:c.mana||0,max:c.maxMana||0},
        injuries:c.injuries||[],gold:c.gold,renown:c.renown||0,infamy:c.infamy||0,
        skills:Object.entries(c.skills||{}).slice(0,12).map(([name,value])=>({name,value})),
        spells:(c.spells||[]).map(id=>spellById(id)).filter(Boolean).map(s=>({name:s.name,school:s.school,tier:s.tier,cost:s.cost})),
        inventory:(c.inventory||[]).slice(0,12),
        companions:(c.companions||[]).filter(x=>x.active!==false).map(x=>({name:x.name,role:x.role,hp:x.hp,maxHp:x.maxHp,loyalty:x.loyalty,morale:x.morale}))
      },
      location_visual_context:locationVisualContext(),
      scene:{
        world:w.name,date:`${w.day} ${w.season}, ${w.year}`,time:g.time,location:g.location,area_type:g.areaType,
        legal_status:legalStatus(),heat:currentHeat(),bounty:currentBounty(),
        local_race_policy:perception.local_race_policy,
        expected_guard_reaction:perception.expected_guard_reaction,
        dungeon:g.dungeonRun?{name:activeDungeon()?.name||"Unknown",chamber:(g.dungeonRun.roomIndex||0)+1,depth:activeDungeon()?.depth||null}:null,
        combat:g.combat?{enemy:g.combat.name,level:g.combat.level,hp:g.combat.hp,maxHp:g.combat.maxHp,statuses:g.combat.statuses||[],context:g.combat.context}:null
      },
      conversation:{
        focus_npc_id:npc?.id||null,
        participant_count:participants.length,
        participants:participants.map(n=>npcForAi(n)),
        group_dynamics:conversationDynamics(participants),
        instruction:participants.length>1?"This is a group conversation. NPCs may address, interrupt, support, contradict, tease, warn, or answer one another when natural. Do not force every participant to speak every turn.":"Single-NPC conversation."
      },
      current_npc:npc?npcForAi(npc):null,
      kingdom:{
        id:k.id,name:k.name,ruler:`${k.rulerTitle} ${k.ruler}`,capital:k.capital,prosperity:k.prosperity,stability:k.stability,
        player_reputation:k.playerRep||0,wars:(k.wars||[]).map(id=>kingdomById(id)?.name||id),
        culture:{race_attitudes:{...(k.culture?.raceAttitudes||{})},armed_entry:k.culture?.armedEntry||"regulated",outsider_tolerance:k.culture?.outsiderTolerance||50},
        politics:k.politics?{crown_authority:k.politics.crownAuthority,noble_power:k.politics.noblePower,popular_support:k.politics.popularSupport,unrest:Math.round(k.politics.unrest),policy:k.politics.policy}:null,
        dynasty:d?{house:d.houseName,ruler:d.ruler,heirs:d.heirs?.slice(0,5),succession_law:d.successionLaw}:null
      },
      local_factions:localFactions.map(f=>({id:f.id,name:f.name,type:f.type,player_reputation:f.playerRep,joined:!!f.joined,power:f.power})),
      active_quests:activeQuests.map(q=>({id:q.id,title:q.title,description:q.description,progress:q.progress,goal:q.goal,faction_id:q.factionId})),
      recent_world_events:compactArray(w.events||[],4).map(e=>({date:e.date,text:e.text})),
      recent_story:compactArray(g.log||[],7).map(e=>stripHtml(e.text)),
      recent_ai_memory:compactArray(g.aiHistory||[],6)
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
      label:cfg.mode==="free" ? "Free AI" : "Demo AI",
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
          <div class="rp-help"><strong>AI roleplay</strong><span>Normal text = dialogue • <code>*action*</code> or <code>**action**</code> = action</span></div>
          <div class="ai-status-line"><span class="ai-dot ${cfg.mode==="free"?"live":"demo"}"></span><strong>${info.label}</strong><span>${cfg.mode==="free"?(cfg.endpoint?"Cloudflare Workers AI — free daily allowance":"Worker URL not configured"):"local fallback — no network AI"}</span></div>
        </div>
        <button class="ghost-button ai-settings-button" id="aiSettings" type="button">AI Settings</button>
      </div>
      ${suggestions.length?`<div class="ai-suggestions">${suggestions.map((s,i)=>`<button type="button" class="ai-suggestion" data-ai-suggestion="${i}">${escapeHtml(s)}</button>`).join("")}</div>`:""}
      ${getConversationNpcs().length?`<div class="conversation-strip"><span>Speaking with</span>${getConversationNpcs().map(n=>`<strong>${escapeHtml(n.name)}</strong>`).join("")}</div>`:""}
      <textarea class="textarea rp-input" id="roleplayInput" maxlength="1000" ${busy?"disabled":""} placeholder='Example: I never touched the merchant. **I keep one hand near my sword and watch the guard for a reaction.**'></textarea>
      <div class="rp-actions">
        <span id="rpHint">${busy?"The narrator is reacting to the current world state…":"Ctrl+Enter to send • actions can attempt anything; the simulation resolves consequences"}</span>
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
      <p><strong>Free AI</strong> uses Cloudflare Workers AI. It does not require an OpenAI API key or OpenAI credits. Cloudflare provides a free daily AI allowance; if it is exhausted, the game falls back to Demo AI.</p>
      <div class="ai-mode-grid">
        <label class="ai-mode-card ${cfg.mode==="free"?"selected":""}">
          <input type="radio" name="aiMode" value="free" ${cfg.mode==="free"?"checked":""}>
          <strong>Free AI</strong><span>Real language-model narration and NPC conversations through your Cloudflare Worker.</span>
        </label>
        <label class="ai-mode-card ${cfg.mode==="demo"?"selected":""}">
          <input type="radio" name="aiMode" value="demo" ${cfg.mode==="demo"?"checked":""}>
          <strong>Demo AI</strong><span>Offline rule-based fallback. No AI quota required.</span>
        </label>
      </div>
      <div class="field">
        <label for="aiEndpoint">Cloudflare Worker URL</label>
        <input class="input" id="aiEndpoint" value="${escapeHtml(cfg.endpoint||"")}" placeholder="https://realms-and-ruin-ai.yourname.workers.dev">
        <small>No OpenAI key goes here. This is only the public URL of your Cloudflare Worker.</small>
      </div>
      <div class="form-grid">
        <div class="field"><label for="aiStyle">Narrator style</label><select class="select" id="aiStyle">
          ${["immersive","concise","dark fantasy","high fantasy"].map(x=>`<option ${cfg.narratorStyle===x?"selected":""}>${x}</option>`).join("")}
        </select></div>
        <div class="field"><label for="aiLength">Response length</label><select class="select" id="aiLength">
          ${["short","medium","long"].map(x=>`<option ${cfg.responseLength===x?"selected":""}>${x}</option>`).join("")}
        </select><small>Short/Medium stretches the free daily allowance further.</small></div>
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
    const participants=snapshot.conversation?.participants||[];
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
      if(participants.length>1 && Math.random()<.65){
        const other=pick(participants.filter(x=>x.id!==npc.id));
        if(other) lines.push({speaker:other.name,text:pick([`That's not the whole of it.`,`Careful. You're making it sound simpler than it is.`,`He's got a point, but I'd phrase it differently.`,`Don't look at me. I warned you this conversation would turn strange.`]),emotion:"reactive"});
      }
      const delta=/\b(thank|please|friend|sorry)\b/.test(lower)?2:/\b(idiot|coward|bastard|kill you)\b/.test(lower)?-5:0;
      if(delta) intents.push({type:"relationship",target_id:npc.id,amount:delta,reason:"Tone of conversation"});
      intents.push({type:"npc_memory",target_id:npc.id,text:`The player said: "${dialogue.slice(0,140)}"`});
    } else if(dialogue && !npc){
      const comp=snapshot.player_mechanics?.companions?.[0];
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

  async function requestFreeAiTurn(payload) {
    const cfg=getAiConfig();
    if(!cfg.endpoint) throw new Error("Cloudflare Worker URL is not configured.");
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    try{
      const res=await fetch(cfg.endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          version:"4.20",
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
    return (state.world.npcs||[]).find(n=>n.id===id) || (state.game.activeNpc?.id===id?state.game.activeNpc:null) || null;
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
    rememberNarrationPatterns(result.narration, result.dialogue);

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

    updateConversationFocusFromInput(raw);
    const resolution=buildActionResolution(segments);
    const snapshot=aiWorldSnapshot();
    const cfg=getAiConfig();

    state.game.aiBusy=true;
    state.game.aiLastError="";
    renderGame();

    try{
      const payload={input:raw,segments,resolution,snapshot};
      const result=cfg.mode==="free" ? await requestFreeAiTurn(payload) : await demoAiTurn(payload);
      applyAiTurn(result,resolution);

      // A normal AI turn advances time once unless the AI already explicitly advanced it.
      const explicitTime=(result.intents||[]).some(x=>x.type==="time");
      if(!explicitTime && !state.game.combat) advanceTurn();

      saveGame(false);
    }catch(err){
      const msg=err?.name==="AbortError"?"AI request timed out.":String(err?.message||err);
      state.game.aiLastError=msg;
      addLog(`<strong>Free AI:</strong> ${escapeHtml(msg)} Falling back to Demo AI for this turn.`,"system");
      try {
        const fallbackPayload={input:raw,segments,resolution,snapshot};
        const fallback=await demoAiTurn(fallbackPayload);
        applyAiTurn(fallback,resolution);
        const explicitTime=(fallback.intents||[]).some(x=>x.type==="time");
        if(!explicitTime && !state.game.combat) advanceTurn();
        saveGame(false);
      } catch (fallbackErr) {
        addLog(`<strong>Demo fallback:</strong> ${escapeHtml(String(fallbackErr?.message||fallbackErr))}`,"system");
      }
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
    document.querySelectorAll("[data-equip-index]").forEach(btn=>btn.addEventListener("click",()=>equipInventoryItem(Number(btn.dataset.equipIndex))));
    document.querySelectorAll("[data-unequip]").forEach(btn=>btn.addEventListener("click",()=>unequipSlot(btn.dataset.unequip)));

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


  // ============================================================
  // V4.6 — DEEP SOCIAL SIMULATION
  // Knowledge • Visibility • Disguise • Goals • Social axes
  // Reputation spread • Witnesses • Rumours • Hierarchy
  // Heraldry • Languages • Emotion • Secrets • Scene persistence
  // Perception • Equipment condition • Anti-repetition
  // ============================================================

  const V46_SOCIAL_RANKS = {
    outcast:0, commoner:10, labourer:12, professional:22, merchant:28,
    soldier:30, guard:32, priest:38, scholar:38, knight:50,
    official:52, noble:65, high_noble:78, royalty:95
  };

  const V46_EMOTIONS = ["calm","wary","nervous","angry","afraid","curious","amused","grieving","exhausted","excited","suspicious"];

  function currentLocationKey(){
    if(!state.game)return "unknown";
    return `${state.game.kingdomId||"none"}::${state.game.location||"unknown"}`;
  }

  function ensureV46Data(){
    if(!state.character||!state.world||!state.game)return;
    const c=state.character,w=state.world,g=state.game;

    c.inventory = Array.isArray(c.inventory)?c.inventory:[];
    c.companions = Array.isArray(c.companions)?c.companions:[];
    c.spells = Array.isArray(c.spells)?c.spells:[];
    c.customSkills = Array.isArray(c.customSkills)?c.customSkills:[];
    c.specialTraits = Array.isArray(c.specialTraits)?c.specialTraits:[];
    w.npcs = Array.isArray(w.npcs)?w.npcs:[];
    w.quests = Array.isArray(w.quests)?w.quests:[];
    w.factions = Array.isArray(w.factions)?w.factions:[];
    g.sceneNpcs = Array.isArray(g.sceneNpcs)?g.sceneNpcs:[];
    g.aiHistory = Array.isArray(g.aiHistory)?g.aiHistory:[];
    g.aiSuggestions = Array.isArray(g.aiSuggestions)?g.aiSuggestions:[];
    g.spectacleMarkers = g.spectacleMarkers && typeof g.spectacleMarkers==="object" ? g.spectacleMarkers : {};
    c.auraStates = c.auraStates && typeof c.auraStates==="object" ? c.auraStates : {};
    c.visibility ||= {faceCovered:false,cloakClosed:false,weaponConcealed:false,insigniaVisible:true};
    c.disguise ||= {active:false,alias:"",apparentRace:"",quality:45};
    c.languages ||= defaultPlayerLanguages(c);
    c.reputationLayers ||= {local:{},kingdom:{},underworld:0,legendary:0};
    c.reputationLayers.local ||= {};
    c.reputationLayers.kingdom ||= {};
    if(c.reputationLayers.kingdom[g.kingdomId]==null)c.reputationLayers.kingdom[g.kingdomId]=currentKingdom()?.playerRep||0;
    c.equipmentCondition ||= {};
    c.itemProfiles ||= {};
    c.skillProfiles ||= {};
    c.auraStates ||= {};
    c.specialTraits = normalizedSpecialTraits(c);
    c.customSkills = normalizedCustomSkills(c);
    for(const item of (c.inventory||[])) {
      if(c.equipmentCondition[item]==null)c.equipmentCondition[item]=100;
    }
    for(const {item} of visibleEquipment(c)) {
      if(c.equipmentCondition[item]==null)c.equipmentCondition[item]=100;
    }

    w.rumours ||= [];
    w.rumourCounter ||= 1;
    w.sceneStates ||= {};
    w.newsRoutes ||= {};
    w.heraldry ||= {};
    g.socialMenu ??= false;
    g.aiRecentPhrases ||= [];
    g.aiRecentDescriptionTopics ||= [];
    g.lastPerceptionResult ||= null;

    const scene=ensureSceneState();
    scene.lastVisitedDay ??= w.day;

    (w.npcs||[]).forEach(n=>ensureNpcDeepProfile(n));
  }

  function defaultPlayerLanguages(c=state.character){
    const r=String(c?.race||"").toLowerCase();
    const out=[{name:"Common",level:"Fluent"}];
    const add=(name,level="Native")=>{if(!out.some(x=>x.name===name))out.push({name,level});};
    if(/goblin/.test(r))add("Goblin");
    if(/orc/.test(r))add("Orcish");
    if(/elf/.test(r))add("Elvish");
    if(/dwarf/.test(r))add("Dwarven");
    if(/halfling/.test(r))add("Halfling");
    if(/tiefling|demon|infernal/.test(r))add("Infernal","Conversational");
    if(/undead|lich/.test(r))add("Grave Tongue","Conversational");
    const bg=String(c?.background||"").toLowerCase();
    if(/scholar|scribe|noble|diplomat/.test(bg))add("High Imperial","Basic");
    return out;
  }

  function npcRankForOccupation(occupation=""){
    const t=String(occupation).toLowerCase();
    if(/king|queen|prince|princess|royal/.test(t))return {label:"royalty",score:95};
    if(/duke|duchess|high noble|lord marshal/.test(t))return {label:"high_noble",score:78};
    if(/noble|lord|lady|courtier/.test(t))return {label:"noble",score:65};
    if(/knight|paladin/.test(t))return {label:"knight",score:50};
    if(/official|magistrate|captain|reeve/.test(t))return {label:"official",score:52};
    if(/priest|cleric|abbot/.test(t))return {label:"priest",score:38};
    if(/mage|scholar|scribe|alchemist/.test(t))return {label:"scholar",score:38};
    if(/guard|soldier|mercenary|warden/.test(t))return {label:"guard",score:32};
    if(/merchant|trader|innkeeper|blacksmith/.test(t))return {label:"merchant",score:28};
    if(/hunter|herbalist|stablemaster/.test(t))return {label:"professional",score:22};
    if(/farm|labour|labor|beggar/.test(t))return {label:"commoner",score:10};
    return {label:"commoner",score:14};
  }

  function defaultNpcLanguages(npc){
    const out=[{name:"Common",level:"Fluent"}];
    const occ=String(npc?.occupation||"").toLowerCase();
    const add=(name,level)=>{if(!out.some(x=>x.name===name))out.push({name,level});};
    if(/scribe|scholar|mage/.test(occ))add("High Imperial","Conversational");
    if(/merchant|travelling/.test(occ))add(pick(["Dwarven","Elvish","Goblin"]),"Basic");
    if(/guard|soldier/.test(occ)&&Math.random()<.25)add("Orcish","Basic");
    return out;
  }

  function npcGoalProfile(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    if(/guard|watch|warden/.test(occ))return {primary:"keep public order and finish the shift without unnecessary bloodshed",secondary:"identify genuine threats before they enter protected areas",fear:"losing control before reinforcements arrive"};
    if(/soldier|mercenary/.test(occ))return {primary:"survive while fulfilling the current duty",secondary:"maintain professional reputation",fear:"being trapped in a fight with no advantage"};
    if(/merchant|trader/.test(occ))return {primary:"make profitable deals without being robbed or cheated",secondary:"build useful commercial contacts",fear:"losing stock, coin or reputation"};
    if(/innkeeper/.test(occ))return {primary:"keep the establishment profitable and peaceful",secondary:"hear useful local information",fear:"violence damaging the business"};
    if(/blacksmith/.test(occ))return {primary:"protect the forge and sell skilled work at a fair price",secondary:"judge unusual weapons and armour",fear:"fire, theft or unpaid commissions"};
    if(/scribe|scholar|mage/.test(occ))return {primary:"acquire reliable information",secondary:"study unusual people, magic or events",fear:"destroyed knowledge or dangerous ignorance"};
    if(/hunter/.test(occ))return {primary:"return alive with useful game or information",secondary:"keep wilderness routes safe",fear:"being surprised by something stronger than expected"};
    if(/messenger/.test(occ))return {primary:"deliver information quickly and intact",secondary:"avoid delays and questioning",fear:"losing the message"};
    if(/herbalist/.test(occ))return {primary:"help paying customers and maintain supplies",secondary:"learn about unusual injuries and illnesses",fear:"running short during an emergency"};
    if(/farm/.test(occ))return {primary:"protect family, land and livelihood",secondary:"avoid trouble with authorities or armed strangers",fear:"raids, taxes and violence"};
    return {primary:"protect personal interests and get through the day",secondary:"learn who is safe or useful",fear:"being exploited by a dangerous stranger"};
  }

  function npcSecretProfile(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    const seed=`${state.world?.seed||"world"}-secret-${npc.id}`;
    const rng=seeded(seed);
    const base=[
      {private:"owes more money than they admit",secret:"quietly pays a local fixer for protection",cover:"claims finances are stable"},
      {private:"dislikes a superior",secret:"passed confidential information to a rival once",cover:"presents as completely loyal"},
      {private:"has family outside the kingdom",secret:"occasionally helps them evade taxes or travel rules",cover:"claims to have no outside ties"},
      {private:"is frightened by recent events",secret:"plans to leave if conditions worsen",cover:"acts more confident than they feel"}
    ];
    if(/guard|watch/.test(occ))base.push({private:"resents an officer",secret:"has accepted a small bribe before",cover:"insists the watch is incorruptible"});
    if(/merchant|trader/.test(occ))base.push({private:"has cash-flow problems",secret:"one shipment was acquired through smugglers",cover:"claims every transaction is legitimate"});
    if(/mage|scholar/.test(occ))base.push({private:"studies a forbidden subject",secret:"keeps notes that would concern local authorities",cover:"describes the work as harmless theory"});
    const s=pick(base,rng);
    return {public:`Known locally as a ${npc.occupation}.`,private:s.private,secret:s.secret,cover_story:s.cover};
  }

  function npcKnowledgeProfile(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    const local=[
      `Lives or works around ${npc.location||state.game.location}.`,
      `Knows the ruler of ${currentKingdom()?.name||"the realm"} and ordinary local laws.`,
      "Knows common public rumours from nearby settlements."
    ];
    const specialist=[];
    if(/guard|watch|warden|soldier/.test(occ))specialist.push("Knows watch procedures, wanted notices and obvious local security concerns.");
    if(/merchant|trader|innkeeper/.test(occ))specialist.push("Knows ordinary prices, trade gossip and commercially important travellers.");
    if(/mage|scholar|scribe/.test(occ))specialist.push("Knows more about magic, history and written records than an average local.");
    if(/hunter|herbalist/.test(occ))specialist.push("Knows nearby wilderness, tracks, animals and practical hazards.");
    return {
      local_facts:local,
      specialist_knowledge:specialist,
      forbidden_without_source:[
        "The player's hidden inventory.",
        "Crimes with no surviving or communicating witness.",
        "Secret quest facts never shared with this NPC.",
        "Private thoughts or secrets of other NPCs.",
        "Distant events before news could plausibly arrive."
      ],
      knows_player_identity:false,
      known_rumour_ids:[]
    };
  }

  function npcHeraldryKnowledge(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    const knowledge=["local crown"];
    if(/guard|soldier|noble|court|merchant/.test(occ))knowledge.push("major local factions");
    if(/noble|court|scribe|scholar/.test(occ))knowledge.push("regional noble houses");
    if(/merchant|travelling|messenger/.test(occ))knowledge.push("common foreign trade emblems");
    return knowledge;
  }

  function ensureNpcDeepProfile(npc){
    if(!npc)return null;
    npc.socialAxes ||= {
      trust:clamp(50+Math.round((npc.relationship||0)*.35),0,100),
      fear:0,respect:clamp(25+Math.max(0,npc.relationship||0)*.15,0,100),
      suspicion:clamp(25+Math.max(0,-(npc.relationship||0))*.3,0,100)
    };
    npc.goals ||= npcGoalProfile(npc);
    npc.socialRank ||= npcRankForOccupation(npc.occupation);
    npc.languages ||= defaultNpcLanguages(npc);
    npc.emotion ||= {state:pick(["calm","wary","curious","tired"]),intensity:randInt(20,55),cause:"ordinary circumstances"};
    npc.secrets ||= npcSecretProfile(npc);
    npc.knowledge ||= npcKnowledgeProfile(npc);
    npc.heraldryKnowledge ||= npcHeraldryKnowledge(npc);
    npc.playerRecognition ||= {recognised:false,identity:null,confidence:0,lastCheckedTurn:-1};
    npc.bodyLanguage ||= {distance:"normal conversational distance",hands:"relaxed but visible",gaze:"observant"};
    npc.sharedMemoryLog ||= [];
    npc.perceptionHistory ||= {signature:"",exposureCount:0,lastExposureTurn:-1,lastReactionTurn:-1,knownFeatures:[]};
    ensureNpcRelationshipData(npc);
    ensureNpcEconomyData(npc);
    ensureNpcCombatIdentity(npc);
    return npc;
  }

  function equipmentCondition(item){
    ensureV46Data();
    return clamp(Number(state.character.equipmentCondition?.[item] ?? 100),0,100);
  }

  function equipmentConditionLabel(v){
    if(v>=90)return "pristine";
    if(v>=70)return "well-kept";
    if(v>=45)return "worn";
    if(v>=20)return "damaged";
    return "badly damaged";
  }

  function visibleEquipmentWithCondition(c=state.character){
    return visibleEquipment(c).map(x=>({...x,condition:equipmentCondition(x.item),condition_label:equipmentConditionLabel(equipmentCondition(x.item))}));
  }

  function wearEquipmentAfterConflict(level=1){
    ensureV46Data();
    for(const {item,slot} of visibleEquipment(state.character)){
      const loss=slot==="mainHand"||slot==="offHand"?randInt(1,3)+Math.floor(level/4):randInt(0,2)+Math.floor(level/6);
      state.character.equipmentCondition[item]=clamp(equipmentCondition(item)-loss,0,100);
    }
  }

  function insigniaFromItem(item){
    const t=String(item||"").toLowerCase();
    if(/royal|crown/.test(t))return {type:"royal",label:"royal or crown-associated heraldry"};
    if(/noble|signet|crest|herald|house/.test(t))return {type:"noble",label:"noble heraldry or a house device"};
    if(/guild|merchant/.test(t))return {type:"guild",label:"merchant or guild insignia"};
    if(/temple|holy|priest|order/.test(t))return {type:"religious",label:"religious/order insignia"};
    return null;
  }

  function playerVisibleIdentity(){
    ensureV46Data();
    const c=state.character,vis=c.visibility,dis=c.disguise;
    let gear=visibleEquipmentWithCondition(c);

    if(vis.cloakClosed){
      gear=gear.filter(x=>["cloak","head","mainHand","offHand"].includes(x.slot));
    }
    if(vis.weaponConcealed){
      gear=gear.filter(x=>{
        if(!["mainHand","offHand"].includes(x.slot))return true;
        return !/dagger|knife|shortsword|short sword|wand|pistol/.test(String(x.item).toLowerCase());
      });
    }

    const visibleWeapons=gear.filter(x=>itemThreatScore(x.item)>0&&/sword|dagger|knife|bow|axe|mace|spear|hammer|crossbow|staff|blade|wand/.test(String(x.item).toLowerCase()));
    const heraldry=vis.insigniaVisible?gear.map(x=>insigniaFromItem(x.item)).filter(Boolean):[];
    const wealth=Math.round(gear.reduce((s,x)=>s+itemWealthScore(x.item)*(0.45+0.55*x.condition/100),0));
    const faceVisible=!vis.faceCovered;
    const raceVisible=faceVisible && !(dis.active&&dis.apparentRace);
    const apparentRace=dis.active&&dis.apparentRace ? dis.apparentRace : raceVisible ? c.race : "Unclear";
    const identity=dis.active&&dis.alias ? dis.alias : faceVisible ? c.name : "Unidentified traveller";
    let status=wealth>=75?"wealthy / elite":wealth>=45?"comfortable / well-equipped":wealth>=20?"modest":"poor";
    if(heraldry.some(x=>x.type==="royal"))status="possibly high-status / crown-connected";
    return {
      display_identity:identity,
      apparent_race:apparentRace,
      true_race_visible:raceVisible,
      face_visible:faceVisible,
      visible_gear:gear,
      visible_weapons:visibleWeapons.map(x=>x.item),
      visible_heraldry:heraldry,
      apparent_wealth:wealth,
      apparent_wealth_label:status,
      cloak_closed:vis.cloakClosed,
      disguise_active:dis.active,
      disguise_quality:dis.active?dis.quality:0
    };
  }

  function recognitionForNpc(npc){
    ensureNpcDeepProfile(npc);
    const v=playerVisibleIdentity(),c=state.character,rec=npc.playerRecognition;
    if(rec.lastCheckedTurn===state.game.turn)return rec;

    let score=0;
    if(v.face_visible)score+=45;
    if(v.true_race_visible)score+=20;
    if((c.renown||0)>45)score+=Math.round((c.renown||0)*.25);
    if((c.infamy||0)>35)score+=Math.round((c.infamy||0)*.3);
    score+=Math.round(npc.socialAxes.suspicion*.15);
    if(c.disguise.active)score-=c.disguise.quality;
    if(c.visibility.faceCovered)score-=25;

    const rng=seeded(`${state.world.seed}-recognition-${npc.id}-${state.game.turn}-${c.disguise.active?c.disguise.alias:"true"}`);
    const roll=randInt(1,100,rng);
    const recognised=roll<=clamp(score,3,95);

    rec.recognised=recognised;
    rec.identity=recognised?c.name:(c.disguise.active&&c.disguise.alias?c.disguise.alias:null);
    rec.confidence=clamp(recognised?score:100-score,5,95);
    rec.lastCheckedTurn=state.game.turn;
    if(recognised)npc.knowledge.knows_player_identity=true;
    return rec;
  }

  function clearPlayerDisguise(){
    ensureV46Data();
    state.character.disguise={active:false,alias:"",apparentRace:"",quality:45};
    state.character.visibility.faceCovered=false;
    for(const n of getConversationNpcs())n.playerRecognition.lastCheckedTurn=-1;
    addLog("You abandon the disguise and present your normal appearance.","system");
  }

  function applyPlayerDisguise(alias,apparentRace){
    ensureV46Data();
    const c=state.character;
    alias=String(alias||"").trim().slice(0,40);
    apparentRace=String(apparentRace||"").trim().slice(0,50);
    if(!alias&&!apparentRace){showToast("Enter an alias or apparent identity.");return;}
    const dex=Number(c.stats?.dex||8),cha=Number(c.stats?.cha||8);
    const gearPenalty=playerVisibleIdentity().visible_weapons.length*4;
    const quality=clamp(32+Math.floor((dex+cha)*1.4)+(c.visibility.faceCovered?18:0)-gearPenalty,15,92);
    c.disguise={active:true,alias,apparentRace,quality};
    c.visibility.faceCovered=true;
    for(const n of (state.world.npcs||[]))ensureNpcDeepProfile(n).playerRecognition.lastCheckedTurn=-1;
    addLog(`You adopt the identity <strong>${escapeHtml(alias||apparentRace)}</strong>. Disguise quality: ${quality}/100.`,"system");
    saveGame(false);renderGame();
  }

  function playerRankEstimate(){
    const c=state.character,v=playerVisibleIdentity();
    let score=12+Math.round((c.renown||0)*.25)+Math.round(v.apparent_wealth*.35);
    if(v.visible_heraldry.some(x=>x.type==="royal"))score+=25;
    if(/noble|knight|diplomat/.test(String(c.background||"").toLowerCase()))score+=15;
    return clamp(score,0,100);
  }

  function layeredReputationForNpc(npc){
    ensureV46Data();
    const rep=state.character.reputationLayers;
    const local=Number(rep.local[currentLocationKey()]||0);
    const kingdom=Number(rep.kingdom[state.game.kingdomId]??currentKingdom()?.playerRep??0);
    const faction=Number(factionById(npc?.factionId)?.playerRep||0);
    const underworld=/criminal|thief|smuggler|bandit/.test(String(npc?.occupation||"").toLowerCase())?Number(rep.underworld||0):0;
    const legendary=Number(rep.legendary||0);
    return {local,kingdom,faction,underworld,legendary,
      known_weighted:Math.round(local*.35+kingdom*.25+faction*.2+underworld*.1+legendary*.1)};
  }

  function updateLayeredReputation(scope,amount,targetId=null){
    ensureV46Data(); const r=state.character.reputationLayers;
    amount=clamp(Number(amount)||0,-20,20);
    if(scope==="local")r.local[currentLocationKey()]=clamp((r.local[currentLocationKey()]||0)+amount,-100,100);
    if(scope==="kingdom")r.kingdom[targetId||state.game.kingdomId]=clamp((r.kingdom[targetId||state.game.kingdomId]||0)+amount,-100,100);
    if(scope==="underworld")r.underworld=clamp((r.underworld||0)+amount,-100,100);
    if(scope==="legendary")r.legendary=clamp((r.legendary||0)+amount,-100,100);
  }

  function ensureSceneState(key=currentLocationKey()){
    if(!state.world)return {changes:[]};
    state.world.sceneStates ||= {};
    state.world.sceneStates[key] ||= {changes:[],corpses:[],damage:[],objects:[],lastVisitedDay:state.world.day};
    return state.world.sceneStates[key];
  }

  function persistSceneChange(type,text,data={}){
    ensureV46Data();
    const scene=ensureSceneState();
    const entry={id:`sc-${state.world.day}-${state.game.turn}-${scene.changes.length}`,day:state.world.day,turn:state.game.turn,type,text:String(text).slice(0,180),data};
    scene.changes.push(entry);
    if(scene.changes.length>18)scene.changes.splice(0,scene.changes.length-18);
    if(type==="corpse"){scene.corpses.push(entry);if(scene.corpses.length>8)scene.corpses.shift();}
    if(/damage|burn|break|smash/.test(type)){scene.damage.push(entry);if(scene.damage.length>8)scene.damage.shift();}
  }

  function sceneStateForAi(){
    const s=ensureSceneState();
    return {
      persistent_changes:s.changes.slice(-8),
      corpses:s.corpses.slice(-4),
      structural_damage:s.damage.slice(-4),
      instruction:"These physical changes persist until the simulation explicitly resolves them. Do not describe destroyed or dead things as intact/alive."
    };
  }

  function createRumour(claim,{source="unknown",reliability=60,witnessIds=[],kingdomId=state.game.kingdomId,location=state.game.location,severity=5}={}){
    ensureV46Data();
    const rum={
      id:`rum${state.world.rumourCounter++}`,claim:String(claim).slice(0,180),source,
      reliability:clamp(Math.round(reliability),5,100),createdDay:state.world.day,
      kingdomId,originLocation:location,severity:clamp(severity,1,30),
      knownBy:[...new Set(witnessIds)],knownLocations:[currentLocationKey()],distortion:0
    };
    state.world.rumours.push(rum);
    if(state.world.rumours.length>60)state.world.rumours.splice(0,state.world.rumours.length-60);
    for(const id of rum.knownBy){
      const n=findNpcById(id); if(n){ensureNpcDeepProfile(n);if(!n.knowledge.known_rumour_ids.includes(rum.id))n.knowledge.known_rumour_ids.push(rum.id);}
    }
    return rum;
  }

  function plausibleWitnessesV418(){
    const participants=getConversationNpcs().filter(n=>!n.dead);
    const local=(state.world.npcs||[]).filter(n=>!n.dead&&n.kingdomId===state.game.kingdomId&&n.location===state.game.location);
    const ids=[...participants.map(n=>n.id)];
    for(const n of local){
      if(ids.length>=5)break;
      if(!ids.includes(n.id)&&Math.random()<.45)ids.push(n.id);
    }
    return ids;
  }

  function propagateRumoursV415(){
    ensureV46Data();
    for(const r of state.world.rumours){
      const age=Math.max(0,state.world.day-r.createdDay);
      if(age>18)continue;
      const sourceNpcs=r.knownBy.map(findNpcById).filter(Boolean);
      for(const src of sourceNpcs){
        const contacts=(state.world.npcs||[]).filter(n=>!n.dead&&n.id!==src.id&&n.kingdomId===src.kingdomId);
        if(!contacts.length)continue;
        if(Math.random() < Math.min(.7,.16+r.severity*.012)){
          const target=pick(contacts);
          ensureNpcDeepProfile(target);
          if(!target.knowledge.known_rumour_ids.includes(r.id)){
            target.knowledge.known_rumour_ids.push(r.id);
            r.knownBy.push(target.id);
          }
        }
      }
      if(age>=2 && Math.random()<.28 && !r.knownLocations.includes(`${r.kingdomId}::${currentKingdom()?.capital||""}`)){
        r.knownLocations.push(`${r.kingdomId}::${currentKingdom()?.capital||""}`);
      }
    }
  }

  function rumoursKnownByNpcV415(npc){
    ensureNpcDeepProfile(npc);
    return (npc.knowledge.known_rumour_ids||[]).map(id=>state.world.rumours.find(r=>r.id===id)).filter(Boolean).slice(-5).map(r=>({
      claim:r.claim,reliability:r.reliability,source:r.source,age_days:state.world.day-r.createdDay,
      truth_instruction:"This is a reported claim, not guaranteed objective truth."
    }));
  }

  function shareNpcMemoryWithPresent(npc,text){
    const present=getConversationNpcs().filter(n=>n.id!==npc.id);
    for(const other of present){
      ensureNpcDeepProfile(other);
      if(Math.random()<.7){
        const memory={day:state.world.day,text:`I witnessed ${npc.name} react to this: ${String(text).slice(0,120)}`,sourceNpcId:npc.id,confidence:85};
        other.memory ||= []; other.memory.push(memory);
        if(other.memory.length>10)other.memory.shift();
        other.sharedMemoryLog.push({from:npc.id,day:state.world.day});
      }
    }
  }

  // Override old memory function: memories now track confidence/source and can propagate to present NPCs.
  function addNpcMemory(npc,text,meta={}){
    if(!npc)return;
    ensureNpcDeepProfile(npc);
    npc.memory ||= [];
    npc.memory.push({
      day:state.world.day,text:String(text).slice(0,180),
      source:meta.source||"direct experience",
      confidence:clamp(Number(meta.confidence??95),5,100)
    });
    if(npc.memory.length>10)npc.memory.shift();
    if(meta.propagate!==false)shareNpcMemoryWithPresent(npc,text);
  }

  // Override old crime function with actual witnesses + rumours.
  function recordCrimeV415(type,severity=8,witnessed=true){
    ensureV46Data();
    const kid=state.game.kingdomId,k=kingdomById(kid);
    const witnesses=witnessed?plausibleWitnesses():[];
    const actuallyKnown=witnesses.length>0;
    const appliedSeverity=actuallyKnown?severity:Math.ceil(severity*.18);

    state.game.crimeHeat[kid]=clamp(currentHeat(kid)+appliedSeverity,0,100);
    state.game.bounties[kid]=Math.max(0,currentBounty(kid)+(actuallyKnown?Math.round(severity*1.8):0));
    state.character.infamy=clamp((state.character.infamy||0)+(actuallyKnown?Math.max(1,Math.floor(severity/4)):0),0,999);
    changeKingdomRep(kid, actuallyKnown?-Math.max(1,Math.floor(severity/5)):0);
    updateLayeredReputation("local",-Math.max(1,Math.floor(appliedSeverity/4)));
    updateLayeredReputation("kingdom",-Math.max(0,Math.floor(appliedSeverity/7)),kid);
    updateLayeredReputation("underworld",Math.max(0,Math.floor(severity/8)));

    if(actuallyKnown){
      createRumour(`${state.character.name} was implicated in ${type} at ${state.game.location}.`,{
        source:witnesses.length===1?"an eyewitness":"several witnesses",
        reliability:witnesses.length>=2?88:72,witnessIds:witnesses,severity
      });
      addEvent(`${type} reported in ${k?.name||"the realm"}`);
      for(const id of witnesses){
        const n=findNpcById(id);
        if(n)addNpcMemory(n,`I witnessed or learned directly that ${state.character.name} committed ${type}.`,{source:"crime witness",confidence:92,propagate:false});
      }
    }else{
      createRumour(`Something happened at ${state.game.location}; details are unclear.`,{source:"unconfirmed traces",reliability:22,witnessIds:[],severity:Math.max(1,Math.floor(severity/3))});
      addEvent(`${type} occurred without a clear surviving witness`);
    }
  }

  function updateNpcEmotion(npc,trigger="conversation"){
    ensureNpcDeepProfile(npc);
    const s=npc.socialAxes;
    let state="calm",intensity=25,cause=trigger;
    if(s.fear>=70){state="afraid";intensity=s.fear;}
    else if(s.suspicion>=70){state="suspicious";intensity=s.suspicion;}
    else if((npc.relationship||0)<=-45){state="angry";intensity=Math.min(90,45+Math.abs(npc.relationship)/2);}
    else if(s.trust>=70){state="calm";intensity=35;}
    else if(raceDeviationProfile(state.character,visibleEquipment(state.character)).anomaly_score>=55){state="curious";intensity=60;}
    npc.emotion={state,intensity:Math.round(intensity),cause};
    return npc.emotion;
  }

  // Override V4.5 social perception with persistent fear/trust/respect/suspicion axes.
  function socialPerceptionForNpc(npc,base=null){
    ensureNpcDeepProfile(npc);
    const p=base||buildSocialPerception();
    const a=npc.socialAxes;
    const attitude=Number(p.local_race_attitude??0),wealth=Number(p.apparent_wealth??0),anomaly=Number(p.racial_anomaly_score||0);
    const rep=layeredReputationForNpc(npc);
    const recognition=recognitionForNpc(npc);
    const visible=playerVisibleIdentity();

    let fear=Math.max(a.fear,Math.round(Number(p.intimidation||0)*.55));
    let respect=Math.max(a.respect,Math.round(Number(p.prestige||0)*.45)+Math.round(rep.known_weighted*.18));
    let suspicion=Math.max(a.suspicion,Math.max(0,Math.round(-attitude*.55)));
    let curiosity=Math.round(anomaly*.25);

    const occ=String(npc.occupation||"").toLowerCase(),person=String(npc.personality||"").toLowerCase();
    let likelyReaction="assess the stranger according to visible evidence and personal goals";

    if(/guard|watch|warden|soldier/.test(occ)){
      suspicion+=15;if(visible.visible_weapons.length)suspicion+=12;fear+=Math.round(anomaly*.18);
      likelyReaction=p.expected_guard_reaction;
    }
    if(/merchant|trader|innkeeper|blacksmith/.test(occ)){
      respect+=Math.round(visible.apparent_wealth*.2);
      likelyReaction=visible.apparent_wealth>=65?"notice purchasing power, equipment provenance and whether the player is safe to deal with":"judge safety, honesty and ability to pay";
    }
    if(/noble|court|official/.test(occ)){
      respect+=Math.round(p.prestige*.2);suspicion+=Math.round(anomaly*.1);
      likelyReaction=anomaly>=45?"assess status, patronage, heraldry and political implications":"judge rank, etiquette and affiliation";
    }
    if(/mage|scholar|scribe|alchemist/.test(occ)){curiosity+=Math.round(anomaly*.35)+(p.magical_signs?20:0);}
    if(/thief|criminal|bandit|smuggler/.test(occ))likelyReaction=fear>=55?"avoid treating the player as easy prey":"assess the player as a possible mark";
    if(/nervous|wary/.test(person))fear+=12;
    if(/proud|reckless/.test(person))fear-=8;

    a.fear=clamp(Math.round((a.fear*2+fear)/3),0,100);
    a.respect=clamp(Math.round((a.respect*2+respect)/3),0,100);
    a.suspicion=clamp(Math.round((a.suspicion*2+suspicion)/3),0,100);
    a.trust=clamp(a.trust,0,100);
    updateNpcEmotion(npc,"current social situation");

    return {
      fear:a.fear,respect:a.respect,suspicion:a.suspicion,trust:a.trust,curiosity:clamp(curiosity,0,100),
      likely_reaction:likelyReaction,
      recognised_identity:recognition.recognised,
      recognised_as:recognition.identity,
      recognition_confidence:recognition.confidence,
      visible_identity:visible.display_identity,
      visible_race:visible.apparent_race,
      reputation_known:rep
    };
  }

  function updateSocialAxesFromRelationship(npc,amount,reason="interaction"){
    ensureNpcDeepProfile(npc);
    const a=npc.socialAxes;
    if(amount>0){
      a.trust=clamp(a.trust+Math.max(1,Math.round(amount*.7)),0,100);
      a.respect=clamp(a.respect+Math.max(0,Math.round(amount*.35)),0,100);
      a.suspicion=clamp(a.suspicion-Math.max(1,Math.round(amount*.45)),0,100);
    }else if(amount<0){
      a.trust=clamp(a.trust+Math.round(amount*.8),0,100);
      a.suspicion=clamp(a.suspicion+Math.max(1,Math.round(Math.abs(amount)*.7)),0,100);
      if(/threat|violence|attack|intimid/i.test(reason))a.fear=clamp(a.fear+Math.max(2,Math.round(Math.abs(amount)*.9)),0,100);
    }
    updateNpcEmotion(npc,reason);
  }

  function languageUnderstanding(npc,language="Common"){
    ensureNpcDeepProfile(npc);
    const found=npc.languages.find(x=>x.name.toLowerCase()===String(language).toLowerCase());
    return found?.level||"None";
  }

  function visibleHeraldryForNpc(npc){
    ensureNpcDeepProfile(npc);
    const vis=playerVisibleIdentity();
    return vis.visible_heraldry.map(h=>({
      ...h,
      recognised:npc.heraldryKnowledge.some(k=>h.type==="royal"||k.includes("noble")||k.includes("faction")||k.includes("crown"))
    }));
  }

  function bodyLanguageForNpc(npc){
    ensureNpcDeepProfile(npc);
    const e=updateNpcEmotion(npc);
    const a=npc.socialAxes;
    if(a.fear>=70)return {distance:"keeps extra distance",hands:"stays close to a weapon or escape route",gaze:"watches the player's hands and weapon",tells:["controlled breathing","weight shifted backward"]};
    if(a.suspicion>=70)return {distance:"maintains formal distance",hands:"kept visible and ready",gaze:"repeatedly checks equipment, exits and companions",tells:["short pauses before answering"]};
    if(a.trust>=70)return {distance:"comfortable conversational distance",hands:"relaxed",gaze:"direct but not challenging",tells:["open posture"]};
    return {distance:"normal conversational distance",hands:"mostly relaxed",gaze:"observant",tells:[`${e.state} expression`]};
  }

  function npcKnowledgeForAi(npc){
    ensureNpcDeepProfile(npc);
    const knownRumours=rumoursKnownByNpc(npc);
    return {
      local_facts:npc.knowledge.local_facts,
      specialist_knowledge:npc.knowledge.specialist_knowledge,
      known_rumours:knownRumours,
      knows_player_identity:npc.knowledge.knows_player_identity,
      forbidden_without_source:npc.knowledge.forbidden_without_source,
      instruction:"NPC dialogue may only assert facts available in this knowledge object, direct memories, visible evidence, or something another present speaker just said. Unknown facts may be guessed, lied about, or asked about, but not stated as certain."
    };
  }

  function npcForAi(n){
    ensureNpcDeepProfile(n);
    const f=factionById(n.factionId);
    const per=buildSocialPerception(n).npc_specific;
    const rank=n.socialRank;
    const playerRank=playerRankEstimate();
    return {
      id:n.id,name:n.name,occupation:n.occupation,personality:n.personality,relationship:n.relationship,
      faction:f?.name||null,faction_id:n.factionId||null,companion:!!n.companion,dead:!!n.dead,
      memory:compactArray(n.memory||[],6),
      perception_of_player:per,
      visual_profile:ensureNpcVisualProfile(n),
      body_language:bodyLanguageForNpc(n),
      emotion:n.emotion,
      goals:n.goals,
      social_axes:{...n.socialAxes},
      social_rank:rank,
      hierarchy_context:{
        npc_rank_score:rank.score,player_apparent_rank_score:playerRank,
        relation:playerRank>=rank.score+20?"player appears substantially higher status":playerRank+20<=rank.score?"NPC appears substantially higher status":"roughly comparable apparent status"
      },
      languages:n.languages,
      heraldry_interpretation:visibleHeraldryForNpc(n),
      knowledge:npcKnowledgeForAi(n),
      secrets:{
        public:n.secrets.public,
        private_instruction:"Private/secret fields are narrator truth, not automatically known to the player. Reveal only through behaviour, discovery, confession or justified inference.",
        private:n.secrets.private,
        secret:n.secrets.secret,
        current_cover_story:n.secrets.cover_story
      }
    };
  }

  function updateConversationFocusFromInput(raw){
    if(!state.game)return;
    const t=String(raw||"").toLowerCase();
    const list=getConversationNpcs();
    for(const n of list){
      const first=String(n.name||"").split(/\s+/)[0].toLowerCase();
      if(first&&new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`).test(t)){
        state.game.conversationFocusId=n.id;
        state.game.activeNpc=n;
        return;
      }
    }
  }

  function turnTakingForConversation(list=getConversationNpcs()){
    const focusId=state.game.conversationFocusId||state.game.activeNpc?.id||null;
    return list.map(n=>({
      npc_id:n.id,name:n.name,
      role:n.id===focusId?"primary responder":"secondary participant",
      interruption_likelihood:n.id===focusId?20:clamp(Math.round((n.socialAxes.suspicion+n.socialAxes.fear)/4)+(n.personality?.includes("talkative")?20:0),5,65),
      instruction:n.id===focusId?"Usually answers direct questions first.":"Speak only if relevant: interrupt, support, contradict, warn, react, or answer when this NPC has a reason."
    }));
  }

  function perceptionCheckForTurn(resolution){
    if(!resolution?.has_action)return null;
    if(!["wis","int"].includes(resolution.stat))return null;
    const reveal=resolution.success
      ? (resolution.margin>=5?"strong insight":"useful observation")
      : "uncertain impression";
    const result={stat:resolution.stat,total:resolution.total,difficulty:resolution.difficulty,success:resolution.success,reveal,
      instruction:resolution.success?"Narrator may reveal body-language clues, inconsistencies, tracks, details or uncertainty that are actually observable. Do not reveal omniscient secrets.":"Narrator should avoid confidently revealing hidden motives; impressions may be incomplete or misleading."};
    state.game.lastPerceptionResult=result;
    return result;
  }

  function rememberNarrationPatterns(narration,dialogue=[]){
    ensureV46Data();
    const text=[String(narration||""),...(dialogue||[]).map(x=>String(x.text||""))].join(" ");
    const motifs=[
      "eyes narrow","expression hardens","air grows tense","jaw tightens","hand moves to","takes a step back",
      "for a heartbeat","lets out a breath","studies you","watches you carefully","silence stretches"
    ];
    for(const m of motifs)if(text.toLowerCase().includes(m))state.game.aiRecentPhrases.push(m);
    state.game.aiRecentPhrases=[...new Set(state.game.aiRecentPhrases)].slice(-10);

    const topics=[];
    if(/armour|armor|plate|mail/.test(text.toLowerCase()))topics.push("armour");
    if(/scar|face|hair|eyes/.test(text.toLowerCase()))topics.push("face");
    if(/gate|wall|street|roof|market/.test(text.toLowerCase()))topics.push("environment");
    if(/sword|spear|weapon|dagger/.test(text.toLowerCase()))topics.push("weapons");
    state.game.aiRecentDescriptionTopics.push(...topics);
    state.game.aiRecentDescriptionTopics=state.game.aiRecentDescriptionTopics.slice(-8);
  }

  function antiRepetitionForAi(){
    ensureV46Data();
    return {
      recently_used_phrases:state.game.aiRecentPhrases.slice(-8),
      recently_described_topics:state.game.aiRecentDescriptionTopics.slice(-6),
      instruction:"Avoid recycling recently used stock phrases. Do not repeatedly re-describe the same face, armour, weapon or location unless it changed or matters to the current action. Prefer new sensory or behavioural detail."
    };
  }

  // Override advanceTurn so information can spread and emotions/scene state can evolve.
  function advanceTurnV415(amount=1){
    const times=["Morning","Late Morning","Afternoon","Evening","Night"];
    amount=Math.max(1,Math.floor(amount));
    for(let i=0;i<amount;i++){
      state.game.turn++;
      let idx=times.indexOf(state.game.time);if(idx<0)idx=0;
      if(idx===times.length-1){state.game.time="Morning";advanceWorldDay(1);propagateRumours();}
      else state.game.time=times[idx+1];

      if(Math.random()<.12)propagateRumours();
      for(const n of getConversationNpcs())updateNpcEmotion(n,"time and conversation");
    }
    maybeLawCheck();
  }

  // Extended snapshot: every social subsystem is separated into truth vs NPC-observable state.
  function aiWorldSnapshot(){
    ensureV4Data(); ensureV46Data();
    const c=state.character,g=state.game,w=state.world,k=currentKingdom();
    const participants=getConversationNpcs();
    const focus=participants.find(n=>n.id===g.conversationFocusId)||g.activeNpc||participants[0]||null;
    const localFactions=(w.factions||[]).filter(f=>f.kingdomId===k.id).slice(0,5);
    const activeQuests=(w.quests||[]).filter(q=>q.status==="active").slice(0,4);
    const d=dynastyForKingdom(k.id);
    const perception=buildSocialPerception();
    const visible=playerVisibleIdentity();

    return {
      game_rules:{
        world_magic_level:state.worldConfig.magic,world_danger_level:state.worldConfig.danger,
        political_climate:state.worldConfig.politics,player_controls_own_choices:true,
        permanent_injuries_enabled:true,appearance_affects_social_reactions:true,
        race_policy_is_simulation_fact:true,group_conversations_enabled:true,
        npc_knowledge_is_limited:true,hidden_player_information_must_not_leak:true,
        rumours_can_be_false:true,scene_changes_persist:true
      },

      player_truth_for_narrator_only:{
        name:c.name,sex:c.sex,age:c.age,race:c.race,race_description:c.raceProfile?.description||"",
        background:c.background,class:c.className,level:c.level,stats:c.stats,
        full_appearance:{height:c.height,build:c.build,description:c.appearance},
        full_equipment:{...(c.equipment||{})},
        equipment_definitions:itemProfilesForAi(c),
        special_traits_and_auras:specialTraitTruthForAi(c),
        skill_definitions:skillProfilesForAi(c),
        injuries:c.injuries||[],gold:c.gold,renown:c.renown||0,infamy:c.infamy||0,
        languages:c.languages,
        instruction:"Narrator may know this. NPCs must NOT automatically know hidden fields; use each NPC's visible_identity, recognition and knowledge."
      },

      player_visible_to_npcs:{
        ...visible,
        equipped_with_condition:visible.visible_gear,
        equipment_significance:equipmentSignificanceSummary(c,visibleEquipment(c)),
        local_social_perception:perception,
        apparent_rank_score:playerRankEstimate(),
        instruction:"Visible equipment power/significance is canonical. Exact hidden item abilities and hidden traits remain narrator truth unless an NPC has a plausible way to recognise them."
      },

      player_mechanics:{
        hp:{current:c.hp,max:c.maxHp},mana:{current:c.mana||0,max:c.maxMana||0},
        skills:skillProfilesForAi(c).slice(0,16),
        spells:(c.spells||[]).map(id=>spellById(id)).filter(Boolean).map(s=>({name:s.name,school:s.school,tier:s.tier,cost:s.cost})),
        companions:(c.companions||[]).filter(x=>x.active!==false).map(x=>({name:x.name,role:x.role,hp:x.hp,maxHp:x.maxHp,loyalty:x.loyalty,morale:x.morale}))
      },

      reputation_layers:{
        local:c.reputationLayers.local[currentLocationKey()]||0,
        kingdom:c.reputationLayers.kingdom[g.kingdomId]??k.playerRep??0,
        underworld:c.reputationLayers.underworld||0,
        legendary:c.reputationLayers.legendary||0,
        instruction:"Do not assume reputation is globally known. Each NPC's recognition/knowledge determines what they actually know."
      },

      location_visual_context:locationVisualContext(),
      persistent_scene_state:sceneStateForAi(),

      scene:{
        world:w.name,date:`${w.day} ${w.season}, ${w.year}`,time:g.time,location:g.location,area_type:g.areaType,
        legal_status:legalStatus(),heat:currentHeat(),bounty:currentBounty(),
        local_race_policy:perception.local_race_policy,expected_guard_reaction:perception.expected_guard_reaction,
        dungeon:g.dungeonRun?{name:activeDungeon()?.name||"Unknown",chamber:(g.dungeonRun.roomIndex||0)+1,depth:activeDungeon()?.depth||null}:null,
        combat:g.combat?{enemy:g.combat.name,level:g.combat.level,hp:g.combat.hp,maxHp:g.combat.maxHp,statuses:g.combat.statuses||[],context:g.combat.context}:null
      },

      conversation:{
        focus_npc_id:focus?.id||null,
        focus_npc_name:focus?.name||null,
        participant_count:participants.length,
        participants:participants.map(n=>npcForAi(n)),
        group_dynamics:conversationDynamics(participants),
        turn_taking:turnTakingForConversation(participants),
        instruction:participants.length>1
          ?"This is a group conversation. Preserve turn-taking: direct questions usually go to the focus NPC; other NPCs speak only when they have a motive to interrupt, support, contradict, react or confer."
          :"Single-NPC conversation."
      },

      player_perception_check:g.lastPerceptionResult,
      anti_repetition:antiRepetitionForAi(),

      kingdom:{
        id:k.id,name:k.name,ruler:`${k.rulerTitle} ${k.ruler}`,capital:k.capital,prosperity:k.prosperity,stability:k.stability,
        player_reputation:k.playerRep||0,wars:(k.wars||[]).map(id=>kingdomById(id)?.name||id),
        culture:{race_attitudes:{...(k.culture?.raceAttitudes||{})},armed_entry:k.culture?.armedEntry||"regulated",outsider_tolerance:k.culture?.outsiderTolerance||50},
        politics:k.politics?{crown_authority:k.politics.crownAuthority,noble_power:k.politics.noblePower,popular_support:k.politics.popularSupport,unrest:Math.round(k.politics.unrest),policy:k.politics.policy}:null,
        dynasty:d?{house:d.houseName,ruler:d.ruler,heirs:d.heirs?.slice(0,5),succession_law:d.successionLaw}:null
      },

      local_factions:localFactions.map(f=>({id:f.id,name:f.name,type:f.type,player_reputation:f.playerRep,joined:!!f.joined,power:f.power})),
      active_quests:activeQuests.map(q=>({id:q.id,title:q.title,description:q.description,progress:q.progress,goal:q.goal,faction_id:q.factionId})),
      recent_world_events:compactArray(w.events||[],4).map(e=>({date:e.date,text:e.text})),
      recent_story:compactArray(g.log||[],7).map(e=>stripHtml(e.text)),
      recent_ai_memory:compactArray(g.aiHistory||[],6)
    };
  }

  // Override action roll to attach a perception layer when WIS/INT is being used to observe/investigate.
  function buildActionResolution(segments){
    const actionText=segments.filter(s=>s.type==="action").map(s=>s.text).join(" then ").trim();
    if(!actionText)return {has_action:false};
    const stat=chooseActionStat(actionText);
    const score=Number(state.character.stats?.[stat]||8);
    let difficulty=state.game.combat?13+Math.min(4,state.game.combat.level||1):11;
    if(/\b(impossible|teleport without|lift a castle|destroy the world)\b/.test(actionText.toLowerCase()))difficulty=30;
    let blocked="";
    const t=actionText.toLowerCase();
    if((/\b(run|sprint|jump|kick|climb)\b/.test(t))&&hasSevereInjury("left leg")&&hasSevereInjury("right leg"))blocked="Both legs are unusable.";
    if((/\b(swing|stab|slash|grab|punch|draw|shoot|throw)\b/.test(t))&&hasSevereInjury("left arm")&&hasSevereInjury("right arm"))blocked="Both arms are unusable.";
    const d20=randInt(1,20),modifier=Math.floor(score/4),total=d20+modifier;
    const result={has_action:true,action_text:actionText,stat,stat_score:score,d20,modifier,total,difficulty,success:!blocked&&total>=difficulty,margin:blocked?-99:total-difficulty,blocked_reason:blocked,
      combat_damage_cap:state.game.combat?Math.max(2,6+Math.floor(score/3)+state.character.level*2):0};
    result.perception=perceptionCheckForTurn(result);
    return result;
  }

  // Override AI intent application so social changes affect separate axes and layered reputation.
  function applyAiIntentV415(intent,resolution){
    if(!intent||typeof intent.type!=="string")return;
    const c=state.character,g=state.game;
    switch(intent.type){
      case "relationship":{
        const n=findNpcById(intent.target_id);if(!n)return;
        const amt=clampIntentAmount(intent.amount,-12,12);
        n.relationship=clamp((n.relationship||0)+amt,-100,100);
        updateSocialAxesFromRelationship(n,amt,String(intent.reason||"interaction"));
        break;
      }
      case "romance":{
        const n=findNpcById(intent.target_id);if(!n)return;
        applyRomanceIntent(n,String(intent.kind||"affection"),clampIntentAmount(intent.amount,-12,12),String(intent.reason||"romantic interaction"));
        break;
      }
      case "npc_memory":{
        const n=findNpcById(intent.target_id);if(!n||!intent.text)return;
        addNpcMemory(n,String(intent.text).slice(0,180),{source:"AI-resolved direct interaction",confidence:95});
        break;
      }
      case "start_combat":{
        if(g.combat)return;
        const n=findNpcById(intent.target_id);
        if(n){
          n.relationship=-100;updateSocialAxesFromRelationship(n,-30,"violence");
          g.activeNpc=null;
          const prof=(resolution?.target_npc_id===n.id && resolution?.target_combat_profile)
            ? resolution.target_combat_profile
            : npcCombatProfile(n);
          startCombat({
            name:n.name,level:Math.max(1,Math.round((prof.defense||10)/3)),
            hp:prof.hp||30,dmg:prof.damage||[4,8],xp:prof.xp||28,gold:prof.gold||[0,10],
            attacks:["punch","slash","grapple","kick"]
          },["town","road","outskirts","wilderness","ruin"].includes(intent.context)?intent.context:g.areaType);
          g.combat.npcId=n.id;
        }else if(intent.enemy_name){
          startCombat({name:String(intent.enemy_name).slice(0,50),level:Math.max(1,c.level),hp:24+c.level*8,dmg:[3+c.level,7+c.level],xp:25+c.level*7,gold:[0,12],attacks:["strike","lunge","grapple"]},g.areaType);
        }
        break;
      }
      case "enemy_damage":{
        if(!g.combat||!resolution?.has_action||!resolution.success)return;
        const cap=Math.max(1,resolution.combat_damage_cap||8),dmg=clampIntentAmount(intent.amount,1,cap);
        damageCombatTarget(resolution?.target_npc_id,dmg,intent.status,resolution);
        break;
      }
      case "player_damage":{
        if(!g.combat&&!resolution?.has_action)return;
        const cap=g.combat?Math.max(3,(g.combat.dmg?.[1]||8)+6):14,dmg=clampIntentAmount(intent.amount,0,cap);
        c.hp=Math.max(0,c.hp-dmg);
        if(dmg>0&&intent.body_part&&BODY_PARTS.includes(intent.body_part)&&["minor","severe"].includes(intent.severity)){
          const sev=intent.severity==="severe"&&dmg<8?"minor":intent.severity;
          applyInjury(intent.body_part,sev,String(intent.cause||"AI-resolved consequence").slice(0,100));
        }
        if(c.hp<=0)resolveReactivePlayerDefeat(intent.cause||"combat");
        break;
      }
      case "request_help":{
        const n=findNpcById(intent.target_id)||combatPrimaryNpc();
        requestCombatHelp(n,String(intent.kind||"reinforcements"),String(intent.reason||"calls for help"));
        break;
      }
      case "move":{
        if(g.combat)return;
        const loc=String(intent.location||"").trim().slice(0,60);if(!loc)return;
        g.location=loc;if(["town","road","outskirts","wilderness","forest","ruin","crypt","swamp"].includes(intent.area_type))g.areaType=intent.area_type;
        ensureSceneState();break;
      }
      case "currency_transfer":{
        const npc=findNpcById(intent.target_id)||g.activeNpc;
        if(!npc)return;
        executeNpcTransaction(npc,Math.max(0,Math.round(Number(intent.amount)||0)),String(intent.kind||"pay"),intent.item,String(intent.reason||intent.description||"transaction"));
        break;
      }
      case "gold":{
        const amt=clampIntentAmount(intent.amount,-Math.min(50,c.gold),50);c.gold=Math.max(0,c.gold+amt);break;
      }
      case "crime":{
        const sev=clampIntentAmount(intent.severity,1,30);recordCrime(String(intent.description||"Unlawful act").slice(0,80),sev,!!intent.witnessed);break;
      }
      case "reputation":{
        const amount=clampIntentAmount(intent.amount,-8,8);
        if(intent.scope==="kingdom"&&kingdomById(intent.target_id)){changeKingdomRep(intent.target_id,amount);updateLayeredReputation("kingdom",amount,intent.target_id);}
        if(intent.scope==="faction"&&factionById(intent.target_id))changeFactionRep(intent.target_id,amount);
        if(intent.scope==="local")updateLayeredReputation("local",amount);
        if(intent.scope==="underworld")updateLayeredReputation("underworld",amount);
        if(intent.scope==="legendary")updateLayeredReputation("legendary",amount);
        break;
      }
      case "quest_progress":progressQuests(String(intent.kind||"explore").slice(0,30),clampIntentAmount(intent.amount,1,1));break;
      case "item_add":{
        const item=String(intent.item||"").trim().slice(0,60);if(item&&!c.inventory.includes(item)){c.inventory.push(item);c.equipmentCondition[item]=100;}break;
      }
      case "material_add":{
        const item=String(intent.item||"");if(Object.prototype.hasOwnProperty.call(c.materials||{},item))c.materials[item]+=clampIntentAmount(intent.amount,1,2);break;
      }
      case "scene_change":{
        const kind=String(intent.kind||"change").slice(0,40);
        const description=String(intent.description||intent.reason||"The scene was physically altered.").slice(0,180);
        persistSceneChange(kind,description,{source:"freeform action"});
        break;
      }
      case "npc_injury":{
        const n=findNpcById(intent.target_id);
        if(!n)return;
        n.injuries=Array.isArray(n.injuries)?n.injuries:[];
        const sev=["minor","severe","severed"].includes(intent.severity)?intent.severity:"minor";
        const part=String(intent.body_part||"body").slice(0,40);
        n.injuries.push({part,severity:sev,cause:String(intent.cause||intent.reason||"player action").slice(0,100),day:state.world.day});
        if(n.injuries.length>8)n.injuries.shift();
        applyCombatInjuryPenalty(intent.target_id,part,sev);
        addNpcMemory(n,`I was injured by the player: ${sev} injury to ${part}.`,{source:"direct experience",confidence:100});
        break;
      }
      case "time":{
        const turns=clampIntentAmount(intent.amount,0,2);for(let i=0;i<turns;i++)advanceTurn();break;
      }
    }
  }

  // V4.6 listener override adds disguise controls while retaining every previous listener.
  function wireGameActions(){
    document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>handleGameAction(btn.dataset.action)));
    document.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>buyMarketGood(Number(btn.dataset.buy))));
    document.querySelectorAll("[data-sell]").forEach(btn=>btn.addEventListener("click",()=>sellMarketGood(Number(btn.dataset.sell))));
    document.querySelectorAll("[data-buy-property]").forEach(btn=>btn.addEventListener("click",()=>buyProperty(btn.dataset.buyProperty)));
    document.querySelectorAll("[data-learn-spell]").forEach(btn=>btn.addEventListener("click",()=>learnSpell(btn.dataset.learnSpell)));
    document.querySelectorAll("[data-cast-spell]").forEach(btn=>btn.addEventListener("click",()=>castSpell(btn.dataset.castSpell)));
    document.querySelectorAll("[data-craft]").forEach(btn=>btn.addEventListener("click",()=>craftRecipe(btn.dataset.craft)));
    document.querySelectorAll("[data-enter-dungeon]").forEach(btn=>btn.addEventListener("click",()=>enterDungeon(btn.dataset.enterDungeon)));
    document.querySelectorAll("[data-equip-index]").forEach(btn=>btn.addEventListener("click",()=>equipInventoryItem(Number(btn.dataset.equipIndex))));
    document.querySelectorAll("[data-unequip]").forEach(btn=>btn.addEventListener("click",()=>unequipSlot(btn.dataset.unequip)));

    document.getElementById("applyDisguise")?.addEventListener("click",()=>applyPlayerDisguise(
      document.getElementById("disguiseAlias")?.value,
      document.getElementById("disguiseRace")?.value
    ));

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



  // ============================================================
  // V4.7 — POWERS, AURAS & EQUIPMENT SIGNIFICANCE
  // ============================================================

  function normalizeCharacterPowerData(c=state.character){
    if(!c)return;
    c.itemProfiles ||= {};
    c.skillProfiles ||= {};
    c.auraStates ||= {};
    c.specialTraits = normalizedSpecialTraits(c);
    c.customSkills = normalizedCustomSkills(c);
    for(const item of c.inventory||[]){
      if(!c.itemProfiles[item] && draft?.character?.customBackground?.itemDefs){
        const found=draft.character.customBackground.itemDefs.map(normalizeItemDef).find(x=>x.name===item);
        if(found)c.itemProfiles[item]=found;
      }
    }
  }

  function classifySpecialTrait(trait){
    const t=`${trait.name} ${trait.category} ${trait.desc}`.toLowerCase();
    if(/holy|divine|celestial|sacred|angel|radiant|heaven/.test(t))return "holy / celestial";
    if(/demon|infernal|fiend|abyss|hell|corrupt/.test(t))return "infernal / demonic";
    if(/death|necrot|undead|grave|shadow|void/.test(t))return "deathly / necrotic";
    if(/fear|dread|terror|menace/.test(t))return "dread / intimidation";
    if(/royal|sovereign|command|majest|kingly/.test(t))return "majestic / commanding";
    if(/life|healing|nature|verdant|restoration/.test(t))return "life / restorative";
    if(/dragon|draconic/.test(t))return "draconic";
    if(/arcane|magic|mana|eldritch|rune|sorcer/.test(t))return "arcane";
    return "unclassified supernatural";
  }

  function specialTraitTruthForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return (c.specialTraits||[]).map(trait=>{
      const td=tierData(trait.tier),m=MANIFESTATION_LEVELS[trait.manifestation]||MANIFESTATION_LEVELS.obvious;
      return {
        name:trait.name,category:trait.category,description:trait.desc,
        magnitude:td.label,magnitude_score:td.score,
        manifestation:m.label,manifestation_key:trait.manifestation,
        classified_signal:classifySpecialTrait(trait)
      };
    });
  }

  function npcSensitivityScore(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    let n=22;
    if(/mage|wizard|sorcer|scholar|alchemist|seer/.test(occ))n+=32;
    if(/priest|cleric|paladin|templar|monk/.test(occ))n+=35;
    if(/guard|soldier|hunter|warden/.test(occ))n+=10;
    if(/nervous|wary|curious|scholarly/.test(String(npc?.personality||"").toLowerCase()))n+=10;
    return clamp(n,5,95);
  }

  function traitReactionGuidance(npc,trait,score){
    const kind=classifySpecialTrait(trait),occ=String(npc?.occupation||"").toLowerCase();
    const extreme=score>=90,major=score>=70;
    if(kind==="holy / celestial"){
      if(/priest|cleric|paladin|templar|monk/.test(occ))return extreme?"potential reverence, doctrinal shock, recognition of overwhelming sanctity, or fear of offending the source":"religious respect, curiosity or careful reverence";
      if(/mage|scholar/.test(occ))return extreme?"treat the phenomenon as extraordinary proof of power and investigate cautiously":"recognise a powerful supernatural signature";
      return extreme?"awe, reverence, fear, disbelief or instinctive deference depending on faith and personality":major?"strong awe and caution; this is clearly not an ordinary mortal presence":"notice unusual warmth, purity or sanctity if perceptible";
    }
    if(kind==="infernal / demonic"||kind==="deathly / necrotic"){
      if(/priest|cleric|paladin|templar/.test(occ))return extreme?"immediate grave alarm; may invoke doctrine, wards, reinforcements or confrontation":"religious suspicion and defensive caution";
      return extreme?"terror, panic, defensive hostility or flight depending on courage":"fear, disgust, superstition or guarded fascination";
    }
    if(kind==="dread / intimidation")return extreme?"ordinary social confidence may collapse; people may freeze, retreat, appease or summon help":"heightened fear and defensive behaviour";
    if(kind==="majestic / commanding")return extreme?"instinctive deference or stunned resistance even before formal status is known":"noticeable pressure toward respect or obedience";
    if(kind==="arcane")return /mage|scholar|alchemist/.test(occ)?(extreme?"profound professional shock and fascination":"technical curiosity mixed with caution"):(extreme?"obvious supernatural power beyond ordinary experience":"cautious awareness of magic");
    return extreme?"treat as a phenomenon far outside ordinary experience; disbelief is possible but casual dismissal is not":major?"strong curiosity, caution or awe":"notice according to personality and training";
  }

  function observableTraitsForNpc(npc){
    normalizeCharacterPowerData();
    return (state.character.specialTraits||[]).flatMap(trait=>{
      const td=tierData(trait.tier),m=MANIFESTATION_LEVELS[trait.manifestation]||MANIFESTATION_LEVELS.obvious;
      if(trait.manifestation==="hidden")return [];
      let noticed=trait.manifestation==="overwhelming"||trait.manifestation==="obvious";
      if(trait.manifestation==="subtle"){
        const threshold=clamp(Math.round(npcSensitivityScore(npc)+td.score*.38),5,95);
        const rng=seeded(`${state.world.seed}-trait-notice-${npc?.id||"scene"}-${trait.name}-${state.world.day}`);
        noticed=randInt(1,100,rng)<=threshold;
      }
      if(!noticed)return [];
      const apparentScore=clamp(Math.round(td.score*m.factor+(trait.manifestation==="overwhelming"?10:0)),0,100);
      return [{
        signal:classifySpecialTrait(trait),
        apparent_magnitude:tierData(trait.tier).label,
        apparent_score:apparentScore,
        manifestation:MANIFESTATION_LEVELS[trait.manifestation].label,
        reaction_guidance:traitReactionGuidance(npc,trait,apparentScore),
        exact_power_known:false,
        instruction:"React to the perceived phenomenon. Do not automatically know its formal name, origin or exact mechanical effects unless the NPC has learned them."
      }];
    });
  }

  function equipmentObservationForNpc(npc,item){
    const c=state.character,p=itemProfileFor(item,c),score=itemPowerScore(item,c);
    const occ=String(npc?.occupation||"").toLowerCase();
    let recognition="sees the item but does not automatically know its exact abilities or formal name";
    if(/blacksmith|armourer|armorer|smith|merchant/.test(occ)&&score<65)recognition="can make an informed estimate of quality, material and value, but not hidden powers";
    if(/mage|scholar|alchemist/.test(occ)&&["supernatural","overwhelming"].includes(p.presence))recognition="can recognise that the item carries major supernatural power, but not necessarily its exact abilities";
    if(score>=90)recognition="can tell that this is far beyond normal equipment; exact nature may still be incomprehensible";
    return {
      narrator_reference:item,
      power_tier:p.tierData.label,
      significance_score:score,
      visible_presence:p.presence,
      condition:equipmentCondition(item),
      condition_label:equipmentConditionLabel(equipmentCondition(item)),
      observer_interpretation:recognition,
      exact_effects_known:false
    };
  }

  function equipmentObservationsForNpc(npc){
    const visible=playerVisibleIdentity();
    return visible.visible_gear.map(x=>equipmentObservationForNpc(npc,x.item));
  }

  function strongestVisiblePowerSignal(npc){
    const eq=equipmentObservationsForNpc(npc);
    const traits=observableTraitsForNpc(npc);
    const e=Math.max(0,...eq.map(x=>x.significance_score||0));
    const t=Math.max(0,...traits.map(x=>x.apparent_score||0));
    return Math.max(e,t);
  }

  function skillProfilesForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return Object.entries(c.skills||{}).map(([name,value])=>{
      const p=c.skillProfiles?.[name]||{};
      const td=tierData(p.tier||"notable");
      return {name,value,description:p.desc||"",potency:td.label,potency_score:td.score,source:p.source||"standard skill"};
    });
  }

  function itemProfilesForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return (c.inventory||[]).map(item=>{
      const p=itemProfileFor(item,c);
      return {name:item,description:p.desc||"",power_tier:p.tierData.label,power_score:p.tierData.score,visible_presence:p.presence,slot:p.slot};
    });
  }

  // V4.7 override: equipment and supernatural traits are explicit inputs to social threat/status.
  function buildSocialPerception(npc=null){
    normalizeCharacterPowerData();
    const c=state.character,k=currentKingdom(),eq=visibleEquipment(c);
    const height=parseHeightInches(c.height);
    const gearWealth=eq.reduce((sum,x)=>sum+itemWealthScore(x.item,c),0);
    const gearThreat=eq.reduce((sum,x)=>sum+itemThreatScore(x.item,c),0);
    const significance=equipmentSignificanceSummary(c,eq);
    const bodyThreat={Slight:-8,Lean:-4,Average:0,Athletic:6,Broad:8,Muscular:13,Massive:19}[c.build]||0;
    const heightThreat=height?clamp(Math.round((height-68)*1.35),-12,25):0;
    const apparentWealth=clamp(Math.round(gearWealth+(c.renown||0)*.2+(c.background==="Noble"?15:0)),0,100);
    const broadTraitSignals=specialTraitTruthForAi(c).filter(x=>x.manifestation_key!=="hidden");
    const traitMagnitude=Math.max(0,...broadTraitSignals.map(x=>Math.round(x.magnitude_score*(MANIFESTATION_LEVELS[x.manifestation_key]?.factor||0))));
    const intimidation=clamp(Math.round(20+(c.stats?.str||8)*1.4+bodyThreat+heightThreat+gearThreat*.4+significance.highest_score*.22+traitMagnitude*.18+(c.infamy||0)*.35),0,100);
    const prestige=clamp(Math.round((c.renown||0)*.7+apparentWealth*.3+significance.highest_score*.28+traitMagnitude*.12+(currentKingdom()?.playerRep||0)*.2),0,100);
    const attitude=raceAttitudeFor(k,c.race),policy=racePolicyFromScore(attitude);
    const deviation=raceDeviationProfile(c,eq);
    const visiblyArmed=eq.some(x=>["mainHand","offHand"].includes(x.slot)&&/sword|dagger|knife|bow|axe|mace|spear|hammer|crossbow|staff|blade|cleaver/.test(String(x.item).toLowerCase()));
    let threat=perceptionThreatLabel(deviation.expectation.physical,deviation.anomaly_score,intimidation);
    if(significance.highest_score>=90||traitMagnitude>=92)threat="extreme";
    else if(significance.highest_score>=75||traitMagnitude>=78)threat=["low","ordinary","elevated"].includes(threat)?"high":threat;

    let guard="routine";
    if(significance.highest_score>=90||traitMagnitude>=92){
      guard="do not treat this as an ordinary armed traveller; maintain distance, avoid casual confiscation or provocation, alert a superior and consider calling clergy, mages or elite support depending on what is visible";
    }else if(significance.highest_score>=75||traitMagnitude>=78){
      guard="treat the player as an exceptional threat or high-status supernatural figure; keep tactical distance, summon senior support and avoid assuming normal guard numbers are sufficient";
    }else if(significance.highest_score>=48){
      guard="recognise elite or extraordinary equipment; approach cautiously and assume the wearer may be a highly capable warrior or important figure";
    }else if(significance.highest_score>=25){
      guard="notice costly or serious martial equipment; remain professional and more cautious than with an unarmed common traveller";
    }else if(policy==="kill_on_sight") guard=threat==="extreme"||threat==="high"?"raise the alarm, keep distance, form a defensive line and attack with support":"attack on recognition";
    else if(policy==="hostile") guard=threat==="extreme"||threat==="high"?"avoid a lone confrontation; level weapons, call reinforcements and issue commands from distance":visiblyArmed?"armed confrontation likely":"detain, expel or challenge";
    else if(policy==="restricted") guard=threat==="extreme"||threat==="high"?"block entry cautiously, summon a superior and avoid provoking the unusually dangerous outsider":"challenge entry and demand justification/disarmament";
    else if(policy==="distrusted") guard=threat==="extreme"||threat==="high"?"watch intensely, keep tactical distance and quietly alert other guards":"watch closely and question if suspicious";
    else if(k.culture?.armedEntry==="strict"&&visiblyArmed) guard="demand ordinary weapons be surrendered or peace-bonded, unless visible power makes direct enforcement unsafe";
    else if(k.culture?.armedEntry==="regulated"&&visiblyArmed) guard="notice weapons and question purpose";

    const base={
      height:c.height,build:c.build,appearance:c.appearance,
      apparent_wealth:apparentWealth,apparent_wealth_label:apparentWealth>=80?"extremely wealthy / elite":apparentWealth>=55?"wealthy":apparentWealth>=35?"comfortable":apparentWealth>=18?"modest":"poor",
      intimidation,intimidation_label:intimidation>=90?"overwhelming":intimidation>=75?"extreme":intimidation>=60?"high":intimidation>=40?"noticeable":"low",
      prestige,visible_weapons:visiblyArmed,visibly_injured:(c.injuries||[]).length>0,
      local_race_attitude:attitude,local_race_policy:policy,expected_guard_reaction:guard,
      race_expectation:deviation.expectation,racial_deviations:deviation.deviations,racial_anomaly_score:deviation.anomaly_score,racial_anomaly_category:deviation.anomaly_category,
      perceived_threat:threat,demonic_traits:deviation.demonic,magical_signs:deviation.magical,
      equipment_significance:significance,
      visible_supernatural_magnitude:traitMagnitude
    };
    base.npc_specific=npc?socialPerceptionForNpc(npc,base):null;
    return base;
  }

  // V4.7 override: different professions interpret impossible equipment / auras differently.
  function socialPerceptionForNpc(npc,base=null){
    ensureNpcDeepProfile(npc);
    const p=base||buildSocialPerception();
    const a=npc.socialAxes;
    const attitude=Number(p.local_race_attitude??0),wealth=Number(p.apparent_wealth??0),anomaly=Number(p.racial_anomaly_score||0);
    const rep=layeredReputationForNpc(npc),recognition=recognitionForNpc(npc),visible=playerVisibleIdentity();
    const equipmentSignals=equipmentObservationsForNpc(npc),traitSignals=observableTraitsForNpc(npc);
    const powerSignal=Math.max(0,...equipmentSignals.map(x=>x.significance_score),...traitSignals.map(x=>x.apparent_score));
    let fear=Math.max(a.fear,Math.round(Number(p.intimidation||0)*.55));
    let respect=Math.max(a.respect,Math.round(Number(p.prestige||0)*.45)+Math.round(rep.known_weighted*.18));
    let suspicion=Math.max(a.suspicion,Math.max(0,Math.round(-attitude*.55)));
    let curiosity=Math.round(anomaly*.25);
    const occ=String(npc.occupation||"").toLowerCase(),person=String(npc.personality||"").toLowerCase();
    let likelyReaction="assess the stranger according to visible evidence, power and personal goals";

    if(powerSignal>=95){fear+=28;respect+=24;curiosity+=20;likelyReaction="recognise that something present is beyond normal mortal standards; casual bravado or routine treatment would be implausible";}
    else if(powerSignal>=82){fear+=20;respect+=18;curiosity+=16;likelyReaction="treat the visible power as mythic or almost unbelievable, reassessing normal assumptions";}
    else if(powerSignal>=65){fear+=12;respect+=15;curiosity+=10;likelyReaction="recognise legendary-grade capability or equipment and avoid treating the player as ordinary";}
    else if(powerSignal>=45){respect+=11;suspicion+=5;likelyReaction="notice exceptional quality/power and take the player more seriously";}
    else if(powerSignal>=25){respect+=6;likelyReaction="notice serious equipment or unusual capability associated with a competent warrior or prosperous figure";}

    if(/guard|watch|warden|soldier/.test(occ)){
      suspicion+=15;if(visible.visible_weapons.length)suspicion+=12;fear+=Math.round(anomaly*.18);
      if(powerSignal>=90)likelyReaction="keep distance, avoid routine weapon seizure, alert senior command and seek specialised support rather than casually challenging the player";
      else if(powerSignal>=65)likelyReaction="maintain tactical caution and call additional guards or a superior before escalating";
      else if(powerSignal>=25)likelyReaction="treat the player as a serious armed warrior rather than an easy civilian encounter";
      else likelyReaction=p.expected_guard_reaction;
    }
    if(/merchant|trader|innkeeper/.test(occ)){
      respect+=Math.round(wealth*.2);
      if(powerSignal>=80)likelyReaction="recognise an almost priceless or incomprehensible display and become unusually careful about offence, theft and ability to pay";
      else likelyReaction=visible.apparent_wealth>=65?"notice purchasing power and unusual equipment":"judge safety, honesty and ability to pay";
    }
    if(/blacksmith|armourer|armorer|smith/.test(occ)){
      curiosity+=powerSignal>=60?35:15;
      likelyReaction=powerSignal>=90?"professional disbelief: the craftsmanship/power exceeds anything this NPC reasonably expects to encounter":powerSignal>=55?"intense professional interest in extraordinary workmanship":"assess materials, wear and quality";
    }
    if(/noble|court|official/.test(occ)){
      respect+=Math.round(p.prestige*.2);suspicion+=Math.round(anomaly*.1);
      likelyReaction=powerSignal>=80?"treat the display as politically or religiously significant, questioning what patron, power or authority could explain it":anomaly>=45?"assess status, patronage, heraldry and political implications":"judge rank, etiquette and affiliation";
    }
    if(/mage|scholar|scribe|alchemist/.test(occ)){
      curiosity+=Math.round(anomaly*.3)+(p.magical_signs?20:0)+(powerSignal>=65?25:0);
      likelyReaction=powerSignal>=90?"profound intellectual or magical shock; this exceeds ordinary scholarly expectations":powerSignal>=55?"careful study of exceptional supernatural signatures":"observe unusual details others may miss";
    }
    if(/priest|cleric|paladin|templar|monk/.test(occ)&&traitSignals.some(x=>x.signal==="holy / celestial")){
      const holy=Math.max(...traitSignals.filter(x=>x.signal==="holy / celestial").map(x=>x.apparent_score));
      respect+=Math.round(holy*.25);fear+=Math.round(holy*.1);
      likelyReaction=holy>=90?"religious awe, doctrinal shock or reverence is plausible; the NPC may hesitate to treat the player as an ordinary mortal":holy>=65?"strong religious recognition and respect":"notice a sacred quality";
    }
    if(/thief|criminal|bandit|smuggler/.test(occ))likelyReaction=powerSignal>=60||fear>=55?"conclude this is a dangerously poor robbery target despite visible wealth":"assess the player as a possible mark";
    if(/farmer|peasant|labour|labor|beggar/.test(occ)&&powerSignal>=80)likelyReaction="ordinary experience offers little frame of reference; awe, fear, staring, retreat, prayer or disbelief are plausible";
    if(/nervous|wary/.test(person))fear+=12;
    if(/proud|reckless/.test(person))fear-=8;

    a.fear=clamp(Math.round((a.fear*2+fear)/3),0,100);
    a.respect=clamp(Math.round((a.respect*2+respect)/3),0,100);
    a.suspicion=clamp(Math.round((a.suspicion*2+suspicion)/3),0,100);
    a.trust=clamp(a.trust,0,100);
    updateNpcEmotion(npc,"current social situation");

    return {
      fear:a.fear,respect:a.respect,suspicion:a.suspicion,trust:a.trust,curiosity:clamp(curiosity,0,100),
      likely_reaction:likelyReaction,
      recognised_identity:recognition.recognised,recognised_as:recognition.identity,recognition_confidence:recognition.confidence,
      visible_identity:visible.display_identity,visible_race:visible.apparent_race,reputation_known:rep,
      highest_observable_power:powerSignal,
      equipment_observations:equipmentSignals,
      supernatural_observations:traitSignals
    };
  }

  // V4.7 override: NPC payload contains observations, not hidden exact powers.
  function npcForAi(n){
    ensureNpcDeepProfile(n);
    const f=factionById(n.factionId),per=buildSocialPerception(n).npc_specific,rank=n.socialRank,playerRank=playerRankEstimate();
    return {
      id:n.id,name:n.name,occupation:n.occupation,personality:n.personality,relationship:n.relationship,
      faction:f?.name||null,faction_id:n.factionId||null,companion:!!n.companion,dead:!!n.dead,
      memory:compactArray(n.memory||[],6),perception_of_player:per,
      equipment_observations:equipmentObservationsForNpc(n),
      supernatural_observations:observableTraitsForNpc(n),
      visual_profile:ensureNpcVisualProfile(n),body_language:bodyLanguageForNpc(n),emotion:n.emotion,goals:n.goals,
      social_axes:{...n.socialAxes},social_rank:rank,
      hierarchy_context:{npc_rank_score:rank.score,player_apparent_rank_score:playerRank,relation:playerRank>=rank.score+20?"player appears substantially higher status":playerRank+20<=rank.score?"NPC appears substantially higher status":"roughly comparable apparent status"},
      languages:n.languages,heraldry_interpretation:visibleHeraldryForNpc(n),knowledge:npcKnowledgeForAi(n),
      secrets:{public:n.secrets.public,private_instruction:"Private/secret fields are narrator truth, not automatically known to the player. Reveal only through behaviour, discovery, confession or justified inference.",private:n.secrets.private,secret:n.secrets.secret,current_cover_story:n.secrets.cover_story}
    };
  }



  // ============================================================
  // V4.8 — UNBOUND ACTION ENGINE
  // Any marked action is an actual attempt. Violence does not
  // require combat to already exist.
  // ============================================================

  function classifyFreeformAction(text){
    const t=String(text||"").toLowerCase();
    if(/\b(decapitat|behead|kill|murder|execute|slit .*throat|cut .*head|chop .*head)\b/.test(t))return "lethal_attack";
    if(/\b(attack|stab|slash|swing|strike|punch|kick|shoot|fire at|hit|smash .*with|choke|strangle|bite|maul|impale|cleave)\b/.test(t))return "attack";
    if(/\b(steal|pickpocket|rob|snatch|burglar|break in|take .*without)\b/.test(t))return "theft";
    if(/\b(break|smash|burn|set fire|destroy|cut down|kick down|shatter|damage)\b/.test(t))return "scene_change";
    if(/\b(run|flee|escape|climb|jump|vault|swim|crawl|fly|teleport|blink|move|walk|enter|leave)\b/.test(t))return "movement";
    if(/\b(search|inspect|study|watch|listen|investigate|examine|look for|sense)\b/.test(t))return "perception";
    if(/\b(cast|spell|summon|invoke|channel|magic|aura)\b/.test(t))return "power";
    return "general";
  }

  function freeformTargetNpcV412(actionText){
    const list=getConversationNpcs();
    if(!list.length)return state.game.activeNpc||null;
    const t=String(actionText||"").toLowerCase();
    for(const n of list){
      const full=String(n.name||"").toLowerCase();
      const first=full.split(/\s+/)[0];
      if((full&&t.includes(full))||(first&&new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`).test(t)))return n;
    }
    if(/\b(him|her|them|the guard|the man|the woman|the person|the stranger|my target|himself|herself)\b/.test(t)){
      return list.find(n=>n.id===state.game.conversationFocusId)||state.game.activeNpc||list[0];
    }
    return state.game.activeNpc||list.find(n=>n.id===state.game.conversationFocusId)||list[0];
  }

  function npcCombatProfile(npc){
    const occ=String(npc?.occupation||"").toLowerCase();
    let hp=20,defense=10,damage=[2,6],xp=18;
    if(/guard|watch|warden/.test(occ)){hp=30;defense=13;damage=[4,8];xp=28;}
    if(/soldier|mercenary|hunter/.test(occ)){hp=34;defense=14;damage=[5,9];xp=34;}
    if(/knight|paladin|champion/.test(occ)){hp=46;defense=17;damage=[7,12];xp=50;}
    if(/mage|wizard|sorcer/.test(occ)){hp=27;defense=13;damage=[5,12];xp=42;}
    if(/noble|merchant|scribe|farmer|innkeeper|beggar/.test(occ)){hp=18;defense=9;damage=[1,5];xp=12;}
    const suspicion=Number(npc?.socialAxes?.suspicion||0);
    const fear=Number(npc?.socialAxes?.fear||0);
    defense += suspicion>=70?2:suspicion>=45?1:0;
    defense -= fear>=80?2:fear>=60?1:0;
    return {hp,defense:clamp(defense,7,21),damage,xp,gold:[0,Math.max(2,Math.round(hp/4))]};
  }

  function actionWeaponInfo(actionText){
    const c=state.character;
    const t=String(actionText||"").toLowerCase();
    const equipped=[c.equipment?.mainHand,c.equipment?.offHand].filter(Boolean);
    let item=equipped.find(x=>t.includes(String(x).toLowerCase()))||equipped[0]||null;
    if(!item){
      item=(c.inventory||[]).find(x=>{
        const n=String(x).toLowerCase();
        return t.includes(n) || (
          /\bsword\b/.test(t)&&/sword|blade|cleaver/.test(n)
        ) || (
          /\bdagger|knife\b/.test(t)&&/dagger|knife/.test(n)
        ) || (
          /\bbow|shoot|arrow\b/.test(t)&&/bow|crossbow/.test(n)
        );
      })||null;
    }
    const score=item?itemPowerScore(item,c):0;
    return {item,power_score:score,profile:item?itemProfileFor(item,c):null};
  }

  function capabilitySupportForAction(actionText){
    const t=String(actionText||"").toLowerCase();
    normalizeCharacterPowerData();
    const sources=[];
    for(const skill of skillProfilesForAi(state.character)){
      const hay=`${skill.name} ${skill.description}`.toLowerCase();
      const words=t.split(/\W+/).filter(w=>w.length>=5);
      if(words.some(w=>hay.includes(w)))sources.push({type:"skill",name:skill.name,potency:skill.potency,score:skill.potency_score});
    }
    for(const trait of specialTraitTruthForAi(state.character)){
      const hay=`${trait.name} ${trait.description} ${trait.classified_signal}`.toLowerCase();
      const words=t.split(/\W+/).filter(w=>w.length>=5);
      if(words.some(w=>hay.includes(w)))sources.push({type:"trait",name:trait.name,potency:trait.magnitude,score:trait.magnitude_score});
    }
    const eq=actionWeaponInfo(actionText);
    if(eq.item)sources.push({type:"equipment",name:eq.item,potency:eq.profile?.tierData?.label||"Mundane",score:eq.power_score});
    return sources.sort((a,b)=>b.score-a.score).slice(0,4);
  }

  function resolveFreeformAction(segments){
    ensureV2Data();ensureV4Data();ensureV46Data();
    const actionText=(segments||[]).filter(s=>s.type==="action").map(s=>s.text).join(" then ").trim();
    if(!actionText)return {has_action:false};

    const kind=classifyFreeformAction(actionText);
    const target=(kind==="attack"||kind==="lethal_attack")?freeformTargetNpc(actionText):null;
    const stat=chooseActionStat(actionText);
    const statScore=Number(state.character.stats?.[stat]||8);
    const supports=capabilitySupportForAction(actionText);
    const supportBonus=Math.min(10,Math.floor((supports[0]?.score||0)/12));
    const weapon=actionWeaponInfo(actionText);

    let difficulty=state.game.combat?13+Math.min(4,state.game.combat.level||1):11;
    let targetProfile=null;
    if(target){
      targetProfile=npcCombatProfile(target);
      difficulty=targetProfile.defense;
      if(kind==="lethal_attack")difficulty+=4; // called-shot / instant-kill attempt
      if(/\b(from behind|surprise|while he isn't looking|while she isn't looking|unaware)\b/i.test(actionText))difficulty-=2;
      if(Number(target.socialAxes?.suspicion||0)>=70)difficulty+=2;
    }

    let blocked="";
    const t=actionText.toLowerCase();
    if((/\b(run|sprint|jump|kick|climb)\b/.test(t))&&hasSevereInjury("left leg")&&hasSevereInjury("right leg"))blocked="Both legs are unusable.";
    if((/\b(swing|stab|slash|grab|punch|draw|shoot|throw|decapitat|behead)\b/.test(t))&&hasSevereInjury("left arm")&&hasSevereInjury("right arm"))blocked="Both arms are unusable.";

    const d20=randInt(1,20);
    const modifier=Math.floor(statScore/4)+supportBonus;
    const total=d20+modifier;
    const success=!blocked&&total>=difficulty;
    const margin=blocked?-99:total-difficulty;

    let damageCap=state.game.combat?Math.max(2,6+Math.floor(statScore/3)+state.character.level*2):0;
    let resolvedDamage=0,lethalSuccess=false;

    if(target){
      const martialBase=4+Math.floor(statScore/3)+Math.max(1,state.character.level||1);
      const weaponBonus=Math.floor((weapon.power_score||0)/7);
      damageCap=Math.max(4,martialBase+weaponBonus+Math.max(0,margin));
      if(success){
        resolvedDamage=clamp(Math.round(martialBase+weaponBonus+Math.max(0,margin*.8)),1,Math.max(1,damageCap));
        const overwhelming=(weapon.power_score||0)>=90 || (supports[0]?.score||0)>=95;
        lethalSuccess=kind==="lethal_attack" && (
          margin>=7 ||
          (margin>=3 && (weapon.power_score||0)>=70) ||
          (margin>=1 && overwhelming)
        );
        if(lethalSuccess){
          resolvedDamage=Math.max(resolvedDamage,targetProfile.hp+5);
          damageCap=Math.max(damageCap,resolvedDamage);
        }
      }
    }

    const result={
      has_action:true,
      action_text:actionText,
      action_kind:kind,
      action_is_never_ignored:true,
      target_npc_id:target?.id||null,
      target_name:target?.name||null,
      target_occupation:target?.occupation||null,
      target_combat_profile:targetProfile,
      stat,stat_score:statScore,d20,modifier,total,difficulty,
      success,margin,blocked_reason:blocked,
      capability_support:supports,
      weapon_used:weapon.item,
      weapon_power_score:weapon.power_score,
      combat_damage_cap:damageCap,
      resolved_damage:resolvedDamage,
      lethal_intent:kind==="lethal_attack",
      lethal_success:lethalSuccess,
      mandatory_consequence:target
        ? (success
          ? (lethalSuccess?"The assault succeeds lethally if the mechanical intents are applied.":"The assault lands and must change the scene; combat/hostility cannot be ignored.")
          :"The assault attempt fails to land cleanly but still constitutes an attack; the conversation cannot continue as if nothing happened.")
        :"The attempted action must receive an in-world consequence or a clear physical reason it fails."
    };

    result.perception=perceptionCheckForTurn(result);
    return result;
  }

  // Latest action resolver used by the AI layer.
  function buildActionResolution(segments){
    return resolveFreeformAction(segments);
  }

  function enforceFreeformActionResult(result,resolution){
    result=result&&typeof result==="object"?result:{narration:"",dialogue:[],intents:[],memory:[],suggested_actions:[]};
    result.dialogue=Array.isArray(result.dialogue)?result.dialogue:[];
    result.intents=Array.isArray(result.intents)?result.intents:[];
    result.memory=Array.isArray(result.memory)?result.memory:[];
    result.suggested_actions=Array.isArray(result.suggested_actions)?result.suggested_actions:[];

    if(!resolution?.has_action)return result;

    const intents=result.intents;
    const has=t=>intents.some(x=>x?.type===t);
    const targetId=resolution.target_npc_id;

    // Violence is mechanically binding even if the language model forgets an intent.
    if(targetId && ["attack","lethal_attack"].includes(resolution.action_kind)){
      if(!has("relationship"))intents.unshift({type:"relationship",target_id:targetId,amount:-12,reason:"The player physically attacked this NPC"});
      if(!has("npc_memory"))intents.unshift({type:"npc_memory",target_id:targetId,text:`The player attacked me: ${resolution.action_text}`,reason:null});
      if(!has("crime"))intents.push({type:"crime",description:`Assault on ${resolution.target_name}`,severity:resolution.lethal_intent?22:14,witnessed:true});
      if(!has("start_combat"))intents.unshift({type:"start_combat",target_id:targetId,enemy_name:resolution.target_name,context:state.game.areaType});
      if(resolution.success && resolution.resolved_damage>0 && !has("enemy_damage")){
        intents.push({type:"enemy_damage",amount:resolution.resolved_damage,status:resolution.margin>=5?"staggered":null,reason:resolution.action_text});
      }

      // If narration tried to ignore a mechanically resolved attack, replace that framing.
      const n=String(result.narration||"");
      if(!n || /no action resolution|scene does not change|cannot resolve|action is ignored|does not change to reflect/i.test(n)){
        if(resolution.blocked_reason){
          result.narration=`You try to act, but ${resolution.blocked_reason} The attempt itself is still obvious to ${resolution.target_name} and everyone nearby.`;
        }else if(!resolution.success){
          result.narration=`You launch the attack on ${resolution.target_name}, but the attempt fails to land cleanly. Whatever conversation existed a moment ago is over; ${resolution.target_name} reacts to the assault immediately.`;
        }else if(resolution.lethal_success){
          result.narration=`You commit fully to the lethal strike against ${resolution.target_name}. The attack lands exactly where you intended, with enough force and precision to make the result immediately catastrophic.`;
        }else{
          result.narration=`You attack ${resolution.target_name} without warning. The blow lands, instantly turning the conversation into violence.`;
        }
      }
    }

    return result;
  }

  // V4.8 overrides the AI submission path so any action is resolved before narration is applied.
  async function submitRoleplayInputV412(prefill=null){
    ensureV2Data();ensureV4Data();ensureV46Data();
    if(state.game.aiBusy)return;
    const box=document.getElementById("roleplayInput");
    const raw=String(prefill ?? box?.value ?? "").trim();
    if(!raw)return;

    const segments=parseRoleplayInput(raw);
    if(!segments.length)return;

    const formatted=segments.map(s=>s.type==="action"
      ?`<span class="rp-action-text">*${escapeHtml(s.text)}*</span>`
      :`<span class="rp-dialogue-text">${escapeHtml(s.text)}</span>`).join(" ");
    addLog(`<strong>${escapeHtml(state.character.name)}:</strong> ${formatted}`,"roleplay");

    updateConversationFocusFromInput(raw);
    const resolution=buildActionResolution(segments);
    const snapshot=aiWorldSnapshot();
    const cfg=getAiConfig();

    state.game.aiBusy=true;
    state.game.aiLastError="";
    renderGame();

    try{
      const payload={input:raw,segments,resolution,snapshot};
      let result=cfg.mode==="free" ? await requestFreeAiTurn(payload) : await demoAiTurn(payload);
      result=enforceFreeformActionResult(result,resolution);
      applyAiTurn(result,resolution);

      const explicitTime=(result.intents||[]).some(x=>x.type==="time");
      if(!explicitTime && !state.game.combat)advanceTurn();
      saveGame(false);
    }catch(err){
      const msg=err?.name==="AbortError"?"AI request timed out.":String(err?.message||err);
      state.game.aiLastError=msg;
      addLog(`<strong>Free AI:</strong> ${escapeHtml(msg)} Falling back to Demo AI for this turn.`,"system");
      try{
        const fallbackPayload={input:raw,segments,resolution,snapshot};
        let fallback=await demoAiTurn(fallbackPayload);
        fallback=enforceFreeformActionResult(fallback,resolution);
        applyAiTurn(fallback,resolution);
        const explicitTime=(fallback.intents||[]).some(x=>x.type==="time");
        if(!explicitTime&&!state.game.combat)advanceTurn();
        saveGame(false);
      }catch(fallbackErr){
        addLog(`<strong>Demo fallback:</strong> ${escapeHtml(String(fallbackErr?.message||fallbackErr))}`,"system");
      }
    }finally{
      state.game.aiBusy=false;
      renderGame();
    }
  }



  // ============================================================
  // V4.9 — CINEMATIC CONSEQUENCE ENGINE
  // Actions carry a physical/sensory consequence profile so the
  // narrator describes what actually happens instead of reducing
  // meaningful actions to "you killed X" or "it worked".
  // ============================================================

  const CONSEQUENCE_LEXICON={
    lightning:{
      cues:["a white-blue flash","the crack of displaced air","the sharp smell of ozone","electric arcs crawling across nearby metal"],
      aftermath:["faint smoke curling from struck material","the air left tasting metallic","nearby hair and loose cloth lifting with static"],
      death:"electrical"
    },
    fire:{
      cues:["a sudden bloom of heat","orange-white flame","the roar and hiss of ignition","smoke rolling into the air"],
      aftermath:["scorched cloth and blackened surfaces","heat shimmering above the impact","embers dying across the ground"],
      death:"burning"
    },
    ice:{
      cues:["a hard snap of forming frost","mist spilling through the air","ice whitening the struck surface","a brittle crystalline crack"],
      aftermath:["frost clinging to nearby material","condensation fogging the air","splinters of ice melting where they landed"],
      death:"freezing"
    },
    holy:{
      cues:["a surge of pale radiant light","shadows driven sharply backward","a pressure like sudden sunlight","a clear resonant hum"],
      aftermath:["a lingering warmth in the air","faint radiance fading from nearby surfaces","a momentary stillness after the light"],
      death:"radiant"
    },
    necrotic:{
      cues:["light seeming to thin around the impact","a cold pressure in the air","colour draining from the immediate space","a dry whispering rush"],
      aftermath:["a chill that lingers after the magic fades","darkened marks around the point of impact","an unnatural silence"],
      death:"necrotic"
    },
    force:{
      cues:["a concussive crack","air compressing visibly for an instant","dust kicked outward from the impact","a heavy invisible blow"],
      aftermath:["loose objects knocked from place","dust hanging in the air","scrapes where the target was driven backward"],
      death:"concussive"
    },
    acid:{
      cues:["a violent hiss","acrid fumes","material blistering at the point of contact","drops spitting against the ground"],
      aftermath:["corroded marks left behind","a sharp chemical smell","damaged material continuing to smoke faintly"],
      death:"corrosive"
    },
    poison:{
      cues:["a sudden loss of colour","a tremor passing through the target","breath catching unevenly","muscles beginning to fail"],
      aftermath:["an unnatural pallor","shallow uneven breathing giving way to stillness","the weapon or wound carrying a suspicious residue"],
      death:"poison"
    },
    slash:{
      cues:["the whistle of a cutting edge","the impact of steel meeting its target","a sharp metallic movement","the target recoiling from the cut"],
      aftermath:["the weapon left marked by the strike","the target's balance broken","nearby witnesses reacting to the sudden violence"],
      death:"bladed"
    },
    pierce:{
      cues:["a direct driving thrust","the point striking with concentrated force","a short impact rather than a sweeping blow","the target folding around the wound"],
      aftermath:["the weapon withdrawing from the point of impact","the target struggling to remain upright","the immediate space falling abruptly tense"],
      death:"piercing"
    },
    blunt:{
      cues:["a heavy impact","a dull crack","the target jolting under the force","footing giving way beneath the blow"],
      aftermath:["the target driven off balance","dust or loose objects jumping from the impact","a stunned silence nearby"],
      death:"blunt-force"
    },
    unarmed:{
      cues:["the sudden shift of weight","the flat sound of close-range impact","the target's body twisting with the hit","boots scraping for balance"],
      aftermath:["the target trying to recover their footing","nearby people instinctively creating distance","the conversation collapsing into immediate violence"],
      death:"physical"
    },
    magic:{
      cues:["magic gathering visibly around the action","a pulse of unnatural energy","the immediate air reacting to the release","the target caught by the spell's force"],
      aftermath:["residual energy fading from the scene","nearby observers left staring at the effect","the environment bearing a brief supernatural trace"],
      death:"magical"
    },
    physical:{
      cues:["a decisive physical impact","the movement connecting with real force","the target or object reacting immediately","the sound of the action carrying through the space"],
      aftermath:["the physical result remaining plainly visible","nearby people adjusting to what just happened","the scene no longer matching the moment before"],
      death:"physical"
    }
  };

  function detectActionMedium(text,resolution=null){
    const t=String(text||"").toLowerCase();
    const support=(resolution?.capability_support||[]).map(x=>`${x.name||""} ${x.potency||""}`).join(" ").toLowerCase();
    const all=`${t} ${support}`;
    if(/\b(lightning|electric|electrical|thunderbolt|thunder bolt|shock|electrocut|storm magic)\b/.test(all))return "lightning";
    if(/\b(fire|flame|burn|inferno|ember|pyro|heat ray)\b/.test(all))return "fire";
    if(/\b(ice|frost|freeze|frozen|blizzard|cold magic)\b/.test(all))return "ice";
    if(/\b(holy|divine|radiant|celestial|sacred|smite|sunlight)\b/.test(all))return "holy";
    if(/\b(necrot|shadow|death magic|dark magic|void|life drain|drain life)\b/.test(all))return "necrotic";
    if(/\b(acid|corros|dissolve)\b/.test(all))return "acid";
    if(/\b(poison|venom|toxin)\b/.test(all))return "poison";
    if(/\b(force|telekin|kinetic|shockwave|blast|repulse)\b/.test(all))return "force";
    if(/\b(stab|thrust|impale|spear|arrow|bolt|pierce)\b/.test(all))return "pierce";
    if(/\b(slash|slice|cut|cleave|decapitat|behead|sword|axe|blade)\b/.test(all))return "slash";
    if(/\b(punch|kick|headbutt|elbow|knee|fist|bare hand)\b/.test(all))return "unarmed";
    if(/\b(hammer|mace|club|bash|smash|crush|bludgeon)\b/.test(all))return "blunt";
    if(/\b(cast|spell|magic|arcane|sorcer|invoke|channel)\b/.test(all))return "magic";
    return "physical";
  }

  function detectBodyTarget(text){
    const t=String(text||"").toLowerCase();
    if(/\b(head|skull|face|neck|throat|decapitat|behead)\b/.test(t))return "head / neck";
    if(/\b(chest|heart|torso|stomach|gut|ribs|spine|back)\b/.test(t))return "torso";
    if(/\b(left arm|right arm|arm|hand|wrist|shoulder)\b/.test(t))return "arm";
    if(/\b(left leg|right leg|leg|knee|ankle|thigh)\b/.test(t))return "leg";
    return "unspecified";
  }

  function meaningfulObjectTarget(text){
    const t=String(text||"").toLowerCase();
    for(const x of ["door","window","table","chair","wall","gate","lock","rope","cart","barrel","weapon","shield","tree","bridge"]){
      if(t.includes(x))return x;
    }
    return null;
  }

  function consequenceIntensity(resolution){
    const support=Math.max(0,...(resolution?.capability_support||[]).map(x=>Number(x.score)||0));
    const weapon=Number(resolution?.weapon_power_score||0);
    const margin=Math.max(0,Number(resolution?.margin||0));
    return clamp(Math.round(Math.max(support,weapon,15+margin*5)),0,100);
  }

  function consequenceProfileForResolution(resolution){
    if(!resolution?.has_action)return null;
    const medium=detectActionMedium(resolution.action_text,resolution);
    const lex=CONSEQUENCE_LEXICON[medium]||CONSEQUENCE_LEXICON.physical;
    const intensity=consequenceIntensity(resolution);
    return {
      medium,
      intensity,
      intensity_label:intensity>=95?"overwhelming / divine-scale":intensity>=80?"mythic-scale":intensity>=65?"legendary-scale":intensity>=48?"exceptional":intensity>=30?"strong":intensity>=18?"notable":"ordinary",
      body_target:detectBodyTarget(resolution.action_text),
      object_target:meaningfulObjectTarget(resolution.action_text),
      sensory_cues:lex.cues,
      aftermath_cues:lex.aftermath,
      death_character:lex.death,
      detail_requirements:[
        "Describe the immediate mechanism of the action rather than summarising it.",
        "Describe the target/person/object physically reacting to the action.",
        "Use at least one medium-appropriate sensory detail when the action is significant.",
        "State the resulting physical state of the target or object.",
        "If nearby NPCs witness something shocking or supernatural, include a natural reaction when useful."
      ],
      lethal_detail_requirement:resolution.lethal_success
        ?"If this kills the target, describe the death specifically as a consequence of this medium and impact. Do not reduce it to 'you killed them' or 'they fall'."
        :"Do not describe death unless mechanics actually make the target die."
    };
  }

  function isOffensiveMagicAttempt(text){
    const t=String(text||"").toLowerCase();
    const magical=/\b(cast|magic|spell|lightning|fire|flame|ice|frost|holy|radiant|necrot|shadow|force|blast|smite|shock|electrocut)\b/.test(t);
    const directed=/\b(at|into|against|strike|hit|blast|burn|freeze|shock|smite|electrocut|attack)\b/.test(t);
    const referent=/\b(him|her|them|guard|man|woman|person|wren|target)\b/.test(t) || getConversationNpcs().some(n=>t.includes(String(n.name||"").toLowerCase())||t.includes(String(n.name||"").split(/\s+/)[0].toLowerCase()));
    return magical&&directed&&referent;
  }

  function promoteOffensiveMagicResolution(base){
    if(!base?.has_action || base.target_npc_id || !isOffensiveMagicAttempt(base.action_text))return base;
    const target=freeformTargetNpc(base.action_text);
    if(!target)return base;

    base.action_kind=/\b(kill|execute|destroy|incinerate|electrocute to death)\b/i.test(base.action_text)?"lethal_attack":"attack";
    base.target_npc_id=target.id;
    base.target_name=target.name;
    base.target_occupation=target.occupation;
    base.target_combat_profile=npcCombatProfile(target);
    base.difficulty=base.target_combat_profile.defense+(base.action_kind==="lethal_attack"?4:0);
    base.success=!base.blocked_reason&&base.total>=base.difficulty;
    base.margin=base.blocked_reason?-99:base.total-base.difficulty;

    const statScore=Number(base.stat_score||8);
    const support=Math.max(0,...(base.capability_support||[]).map(x=>Number(x.score)||0));
    const powerBase=5+Math.floor(statScore/3)+Math.max(1,state.character.level||1)+Math.floor(support/8);
    base.combat_damage_cap=Math.max(5,powerBase+Math.max(0,base.margin));
    base.resolved_damage=base.success?clamp(Math.round(powerBase+Math.max(0,base.margin*.8)),1,base.combat_damage_cap):0;
    const overwhelming=support>=92;
    base.lethal_success=base.action_kind==="lethal_attack" && base.success && (base.margin>=6||(overwhelming&&base.margin>=1));
    if(base.lethal_success){
      base.resolved_damage=Math.max(base.resolved_damage,base.target_combat_profile.hp+5);
      base.combat_damage_cap=Math.max(base.combat_damage_cap,base.resolved_damage);
    }
    base.mandatory_consequence=base.success
      ?"The directed magical attack lands and must physically affect the target."
      :"The directed spell attack fails to land cleanly, but the target and witnesses still react to the attempt.";
    return base;
  }

  // V4.9 final action-resolution wrapper.
  function buildActionResolutionV412(segments){
    let result=resolveFreeformAction(segments);
    result=promoteOffensiveMagicResolution(result);
    if(result?.has_action)result.consequence_profile=consequenceProfileForResolution(result);
    return result;
  }

  function effectSpecificFallback(resolution,targetName="",lethal=false){
    const p=resolution?.consequence_profile||consequenceProfileForResolution(resolution);
    const name=targetName||resolution?.target_name||"the target";
    const success=!!resolution?.success;
    if(!p)return success?"The action takes effect and leaves a visible result.":"The attempt fails to produce the intended result.";

    if(!success){
      const misses={
        lightning:`Electric light snaps across the space toward ${name}, but the strike fails to catch them cleanly. The flash and crack still tear through the moment, leaving the sharp smell of ozone behind as ${name} reacts to the attack.`,
        fire:`Flame surges toward ${name}, but the attack fails to take hold as intended. Heat rolls through the space and forces an immediate reaction even though the decisive hit is denied.`,
        ice:`Frost bursts across the line of the attack but fails to lock onto ${name} as intended. Cold mist spills outward and crystals briefly whiten the nearest surfaces.`,
        holy:`Radiance breaks across the scene but fails to strike ${name} with the intended force. The sudden light still drives back the shadows and makes the attempt impossible to ignore.`,
        slash:`Your cutting attack comes through with real intent, but ${name} manages to deny the clean hit. Steel moves close enough to turn the conversation into immediate violence.`,
        pierce:`You drive the attack toward ${name}, but the point fails to find the opening you wanted. The attempt is unmistakably lethal in intent even without the decisive wound.`,
        blunt:`You commit to the blow, but ${name} avoids the full impact. The movement and force are enough to make the situation immediately physical.`,
        physical:`You commit fully to the action, but circumstances deny the intended result. The attempt itself remains obvious and changes how everyone nearby responds.`
      };
      return misses[p.medium]||misses.physical;
    }

    const deaths={
      lightning:`The lightning connects with ${name} in a white-blue flash. Their body locks under the current as arcs race across clothing and metal, the crack of the discharge followed by the sharp smell of ozone and scorched fabric. ${lethal?`${name} loses all strength at once and collapses motionless as faint smoke curls from the point of impact.`:`When the current breaks, ${name} staggers violently, struggling to regain control of muscles that are still twitching from the shock.`}`,
      fire:`Flame engulfs the point of impact around ${name}, heat rolling outward hard enough to force nearby people back. Smoke and the hiss of burning material follow the initial burst. ${lethal?`${name}'s resistance gives way beneath the sustained heat, leaving them motionless amid the scorched aftermath.`:`${name} reels away from the flames, trying desperately to escape the heat and recover.`}`,
      ice:`Cold detonates across ${name} in a rush of white frost and spilling mist. Ice forms faster than breath can clear it, stiffening movement and making every small motion sound brittle. ${lethal?`The last movement stops as the cold overwhelms them, frost still clinging to their clothing and the ground around them.`:`${name} lurches away stiffly, fighting through numb limbs as ice cracks from the struck area.`}`,
      holy:`Radiant force strikes ${name} and floods the space with pale light, throwing every nearby shadow sharply backward. The air seems to tighten around the impact before the brilliance begins to fade. ${lethal?`${name} is overwhelmed by the sacred force and sinks into stillness as the lingering glow slowly leaves the scene.`:`${name} staggers under the radiance, momentarily unable to answer the force that just passed through them.`}`,
      necrotic:`The magic reaches ${name} with almost no ordinary impact sound; instead the light around them seems to thin and the air turns abruptly cold. Colour drains from the struck area as the effect takes hold. ${lethal?`${name}'s strength simply empties away until they can no longer remain standing, leaving an unnatural stillness behind.`:`${name} recoils, visibly weakened as the cold pressure of the magic refuses to vanish immediately.`}`,
      force:`The invisible blow hits ${name} with a concussive crack, kicking dust outward and driving them bodily from where they stood. ${lethal?`They hit hard and do not recover, loose debris settling around the place the impact threw them.`:`${name} struggles back toward balance, stunned by the sheer physical force of the hit.`}`,
      acid:`The corrosive attack catches ${name} with an immediate hiss, acrid fumes rising as material at the impact point begins to blister and fail. ${lethal?`The corrosive effect proves catastrophic; by the time the reaction slows, ${name} has stopped moving.`:`${name} jerks away in panic, trying to escape the continuing chemical burn.`}`,
      poison:`The effect reaches ${name} less dramatically than a blade or spell, but the change is immediate: colour leaves their face, their breath catches and their muscles begin to betray them. ${lethal?`Their legs finally give way and the uneven breathing fades into stillness.`:`${name} remains conscious but visibly weakened, fighting for control of a body that is no longer responding normally.`}`,
      slash:`Your cutting strike lands cleanly on ${name}, the edge passing through the opening you created before they can properly recover. ${lethal?`The wound is immediately decisive; ${name}'s balance vanishes and they collapse without managing another meaningful defence.`:`${name} recoils from the cut, one hand instinctively moving toward the wound as they fight to keep their footing.`}`,
      pierce:`The thrust drives straight into ${name} with concentrated force rather than a sweeping impact. ${lethal?`The hit proves decisive; their strength drains almost immediately and they fold around the wound before going still.`:`${name} jerks back from the point of impact, struggling to create distance while protecting the wound.`}`,
      blunt:`The blow lands on ${name} with a heavy, ugly crack, jolting their entire body and throwing their balance apart. ${lethal?`They drop under the force and never manage to rise again.`:`${name} stumbles away dazed, trying to recover orientation after the impact.`}`,
      unarmed:`You close the distance and the strike lands with the flat sound of a hard close-range impact. ${lethal?`${name} is driven down by the force and does not recover.`:`${name} reels backward, boots scraping for balance as the encounter becomes a fight.`}`,
      magic:`The spell connects with ${name}, supernatural energy visibly changing the air around the point of impact. ${lethal?`The effect overwhelms them completely and leaves them still as the residual magic slowly fades.`:`${name} staggers under the effect, forced to react to a power that has physically changed the situation.`}`,
      physical:`The action connects with ${name} and produces an immediate physical reaction rather than an abstract success. ${lethal?`The result is decisive; ${name} collapses and does not recover.`:`${name} is forced off balance and must deal with the consequence before anything else can continue.`}`
    };
    return deaths[p.medium]||deaths.physical;
  }

  function detailNormalActionFallback(resolution){
    const p=resolution?.consequence_profile;
    const t=String(resolution?.action_text||"").toLowerCase();
    if(!resolution?.success)return effectSpecificFallback(resolution,"",false);

    if(/\bdoor\b/.test(t))return `You commit to the door rather than merely testing it. The impact runs through the frame with a hard crack; wood flexes, fittings jump and the doorway is left visibly changed by the force you put through it.`;
    if(/\bwindow\b/.test(t))return `The action hits the window decisively. Glass gives with a sharp cascading break, fragments scattering across the nearest surface and leaving the opening exposed to the air beyond.`;
    if(/\btable\b/.test(t))return `The table moves violently under the action, legs scraping and loose objects jumping or spilling as the furniture is knocked out of its previous position. Everyone close enough to hear it immediately knows the scene has changed.`;
    if(/\b(climb|vault|jump)\b/.test(t))return `You put the movement into practice rather than simply declaring the destination. Footing, reach and momentum carry you through the attempt, and you finish in the new position with the physical effort and risk plainly reflected in the scene.`;
    if(/\b(steal|pickpocket|snatch)\b/.test(t))return `You make the theft through timing and hand movement rather than abstraction, choosing the moment when attention shifts and using the brief opening before anyone can react.`;
    const cue=p?.sensory_cues?.[0]||"the physical result";
    const aftermath=p?.aftermath_cues?.[0]||"a visible change left behind";
    return `You follow through on the action and it produces a concrete result: ${cue}. The immediate aftermath leaves ${aftermath}, giving everyone nearby something real to react to.`;
  }

  function narrationNeedsMoreConsequence(text,resolution){
    if(!resolution?.has_action)return false;
    const words=String(text||"").trim().split(/\s+/).filter(Boolean).length;
    const generic=/\b(you killed|you defeat|is killed|falls\.?$|it works|you succeed|action succeeds|scene changes)\b/i.test(String(text||""));
    const meaningful=["attack","lethal_attack","scene_change","power"].includes(resolution.action_kind) || resolution.target_npc_id;
    return meaningful && (words<36 || generic);
  }

  function enforceFreeformActionResultV412(result,resolution){
    result=result&&typeof result==="object"?result:{narration:"",dialogue:[],intents:[],memory:[],suggested_actions:[]};
    result.dialogue=Array.isArray(result.dialogue)?result.dialogue:[];
    result.intents=Array.isArray(result.intents)?result.intents:[];
    result.memory=Array.isArray(result.memory)?result.memory:[];
    result.suggested_actions=Array.isArray(result.suggested_actions)?result.suggested_actions:[];

    if(!resolution?.has_action)return result;

    const intents=result.intents;
    const has=t=>intents.some(x=>x?.type===t);
    const targetId=resolution.target_npc_id;

    if(targetId && ["attack","lethal_attack"].includes(resolution.action_kind)){
      if(!has("relationship"))intents.unshift({type:"relationship",target_id:targetId,amount:-12,reason:"The player physically attacked this NPC"});
      if(!has("npc_memory"))intents.unshift({type:"npc_memory",target_id:targetId,text:`The player attacked me: ${resolution.action_text}`,reason:null});
      if(!has("crime"))intents.push({type:"crime",description:`Assault on ${resolution.target_name}`,severity:resolution.lethal_intent?22:14,witnessed:true});
      if(!has("start_combat"))intents.unshift({type:"start_combat",target_id:targetId,enemy_name:resolution.target_name,context:state.game.areaType});
      if(resolution.success && resolution.resolved_damage>0 && !has("enemy_damage")){
        intents.push({type:"enemy_damage",amount:resolution.resolved_damage,status:resolution.margin>=5?"staggered":null,reason:resolution.action_text});
      }
    }

    const n=String(result.narration||"");
    if(/no action resolution|scene does not change|cannot resolve|action is ignored|does not change to reflect/i.test(n)){
      result.narration=targetId
        ? effectSpecificFallback(resolution,resolution.target_name,!!resolution.lethal_success)
        : detailNormalActionFallback(resolution);
    }else if(narrationNeedsMoreConsequence(n,resolution)){
      const extra=targetId
        ? effectSpecificFallback(resolution,resolution.target_name,!!resolution.lethal_success)
        : detailNormalActionFallback(resolution);
      result.narration=n.trim()?`${n.trim()}\n\n${extra}`:extra;
    }

    return result;
  }

  function narrationClearlyDescribesDeath(text){
    const t=String(text||"");
    const words=t.trim().split(/\s+/).filter(Boolean).length;
    return words>=38 && /\b(dies|dead|lifeless|motionless|goes still|does not rise|doesn't rise|stops moving|final breath|no longer moves|collapses and|crumples.*still)\b/i.test(t);
  }

  function combatDeathFallback(enemy){
    const impact=enemy?.lastImpact||{};
    const res=impact.resolution||{
      has_action:true,success:true,target_name:enemy?.name||"the enemy",
      action_text:impact.action_text||enemy?.lastPlayerAction||"attack",
      action_kind:"attack",capability_support:[],weapon_power_score:0
    };
    if(!res.consequence_profile)res.consequence_profile=impact.profile||consequenceProfileForResolution(res);
    return effectSpecificFallback(res,enemy?.name||"the enemy",true);
  }

  // V4.9 final AI application: remember exactly how the killing blow happened.
  function applyAiTurnV418(result,resolution){
    const g=state.game;
    if(result.narration) addLog(`<div class="ai-narrator-label">AI NARRATOR</div>${escapeHtml(result.narration).replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>")}`,"ai-narration");

    (result.dialogue||[]).slice(0,5).forEach(line=>{
      const speaker=String(line.speaker||"Unknown").slice(0,60);
      const emotion=line.emotion?` <span class="ai-emotion">${escapeHtml(String(line.emotion).slice(0,30))}</span>`:"";
      addLog(`<strong>${escapeHtml(speaker)}:</strong>${emotion} “${escapeHtml(String(line.text||"").slice(0,1200))}”`,"ai-dialogue");
    });

    (result.intents||[]).slice(0,12).forEach(intent=>applyAiIntent(intent,resolution));

    if(g.combat && resolution?.has_action){
      g.combat.lastImpact={
        action_text:resolution.action_text,
        resolution:JSON.parse(JSON.stringify(resolution)),
        profile:resolution.consequence_profile||null,
        narration:String(result.narration||""),
        narrated_death:narrationClearlyDescribesDeath(result.narration)
      };
    }

    (result.memory||[]).slice(0,5).forEach(m=>{
      const n=findNpcById(m.npc_id);
      if(n&&m.text)addNpcMemory(n,String(m.text).slice(0,180));
    });

    g.aiSuggestions=Array.isArray(result.suggested_actions)?result.suggested_actions.slice(0,4).map(x=>String(x).slice(0,140)):[];
    g.aiHistory=Array.isArray(g.aiHistory)?g.aiHistory:[];
    g.aiHistory.push({
      turn:++g.aiTurn,
      narration:String(result.narration||"").slice(0,900),
      dialogue:(result.dialogue||[]).slice(0,3).map(x=>`${x.speaker}: ${x.text}`).join(" | ")
    });
    if(g.aiHistory.length>16)g.aiHistory.splice(0,g.aiHistory.length-16);
    rememberNarrationPatterns(result.narration,result.dialogue);

    if(g.combat&&g.combat.hp<=0){
      finishCombatVictory();
      return;
    }
  }

  // V4.9 final combat victory: descriptive physical death first, rewards second.
  function finishCombatVictoryV412(){
    const c=state.character;
    const e=state.game.combat;
    if(!e)return;

    const impact=e.lastImpact||{};
    const alreadyDetailed=!!impact.narrated_death;
    let deathText="";
    if(!alreadyDetailed){
      deathText=combatDeathFallback(e);
      addLog(`<div class="ai-narrator-label">CONSEQUENCE</div>${escapeHtml(deathText)}`,"ai-narration");
    }else{
      deathText=String(impact.narration||"");
    }

    const gold=randInt(e.gold[0],e.gold[1]);
    addLog(`<strong>Victory.</strong> You gain <strong>${e.xp} XP</strong>${gold?` and <strong>${gold} gold</strong>`:""}.`,"event");
    c.gold+=gold;
    awardXp(e.xp);
    awardCraftingLoot(e);
    wearEquipmentAfterConflict(e.level||1);

    const medium=impact.profile?.medium||"physical";
    const aftermath=(impact.profile?.aftermath_cues||[])[0]||"the aftermath of the fight remains visible";
    persistSceneChange("combat_aftermath",`${e.name} died here after a ${medium} attack; ${aftermath}.`,{enemy:e.name,medium,action:impact.action_text||e.lastPlayerAction||"combat"});

    markBestiaryDefeat?.(e.name);addEvent(`${e.name} died in combat`);
    if(e.name!=="Town Guard")progressQuests("combat",1);
    if(e.name==="Town Guard")recordCrime("Violence against the watch",25,true);

    if(e.npcId){
      const victim=(state.world.npcs||[]).find(n=>n.id===e.npcId);
      if(victim){
        victim.dead=true;
        victim.deathDescription=deathText.slice(0,900);
        victim.deathCause={medium,action:impact.action_text||"combat",day:state.world.day};
        victim.memory=Array.isArray(victim.memory)?victim.memory:[];
        victim.memory.push({day:state.world.day,text:`I was killed by the player using ${impact.action_text||medium}.`});
      }
      persistSceneChange("corpse",`${e.name}'s body remains at this location. Cause: ${medium}.`,{npcId:e.npcId,name:e.name,medium});
      recordCrime(`Killing of ${e.name}`,30,true);
      addEvent(`${e.name} was killed`);
    }

    markBestiaryDefeat?.(e.name);
    state.game.combat=null;
    advanceTurn();
    saveGame(false);
    renderGame();
  }


  // ============================================================
  // V4.10 — SEMANTIC ITEM / AURA WEIGHT
  // Descriptions for gear, gadgets and auras now feed directly
  // into NPC perception rather than acting like flavour-only text.
  // ============================================================

  function pushUnique(arr,value){
    value=String(value||"").trim();
    if(value && !arr.includes(value))arr.push(value);
  }

  function visibleCueSummaryFromSignals(cues=[]){
    return cues.slice(0,4).join(', ');
  }

  function descriptionSignalProfile(text, sourceType='generic'){
    const t=String(text||'').toLowerCase();
    const tags=[],cues=[],notes=[];
    let fear=0,prestige=0,suspicion=0,curiosity=0,danger=0,awe=0,magic=0,sacred=0,dread=0,wealth=0,authority=0;
    const hit=(re)=>re.test(t);

    if(hit(/holy|sacred|radiant|blessed|sanctified/)){
      pushUnique(tags,'holy');pushUnique(cues,'a palpable sacred quality');
      prestige+=14;awe+=12;sacred+=16;magic+=8;
    }
    if(hit(/divine|celestial|heavenly|godly|seraph|angelic/)){
      pushUnique(tags,'divine');pushUnique(cues,'light or presence beyond ordinary mortal craft');
      prestige+=20;awe+=18;sacred+=20;magic+=12;fear+=5;
    }
    if(hit(/infernal|demonic|hellfire|abyssal|fiend|corrupt/)){
      pushUnique(tags,'demonic');pushUnique(cues,'an unsettling infernal quality');
      fear+=18;suspicion+=14;dread+=18;magic+=10;
    }
    if(hit(/necrot|grave|deathly|death magic|void|shadow|cursed|unholy/)){
      pushUnique(tags,'necrotic');pushUnique(cues,'a cold or unnatural presence');
      fear+=15;suspicion+=9;dread+=16;magic+=12;
    }
    if(hit(/terror|dread|fear|horrific|nightmar|menacing|oppress/)){
      pushUnique(tags,'dread');pushUnique(cues,'a pressure that makes onlookers uneasy');
      fear+=18;dread+=16;
    }
    if(hit(/royal|regal|imperial|kingly|queenly|sovereign|lordly|crown/)){
      pushUnique(tags,'regal');pushUnique(cues,'obvious symbols of elite status');
      prestige+=14;wealth+=12;authority+=14;
    }
    if(hit(/command|dominion|majestic|authoritative|aura of command/)){
      pushUnique(tags,'commanding');pushUnique(cues,'a commanding social presence');
      prestige+=9;authority+=15;awe+=6;
    }
    if(hit(/lightning|storm|thunder|electric|voltaic|shock/)){
      pushUnique(tags,'lightning');pushUnique(cues,'static, ozone or a storm-charged feeling');
      danger+=15;fear+=10;magic+=12;
    }
    if(hit(/fire|flame|burn|ember|inferno|blazing/)){
      pushUnique(tags,'fire');pushUnique(cues,'heat, ember-glow or scorched signs');
      danger+=13;fear+=9;magic+=8;
    }
    if(hit(/ice|frost|glacial|frozen|winter/)){
      pushUnique(tags,'ice');pushUnique(cues,'cold mist or visible frost');
      danger+=10;fear+=5;magic+=8;
    }
    if(hit(/poison|venom|toxin/)){
      pushUnique(tags,'poison');pushUnique(cues,'a suspicious toxic quality');
      danger+=12;suspicion+=12;fear+=8;
    }
    if(hit(/acid|corros/)){
      pushUnique(tags,'corrosive');pushUnique(cues,'corrosive residue or acrid fumes');
      danger+=14;fear+=9;
    }
    if(hit(/heal|restor|life-?giving|vitality|mend/)){
      pushUnique(tags,'healing');pushUnique(cues,'a restorative or life-affirming quality');
      prestige+=8;awe+=6;sacred+=4;magic+=8;
    }
    if(hit(/glow|luminous|shining|radiance|halo/)){
      pushUnique(tags,'glowing');pushUnique(cues,'visible glow or radiance');
      awe+=8;magic+=6;
    }
    if(hit(/rune|sigil|glyph|enchanted|arcane|spellbound/)){
      pushUnique(tags,'arcane');pushUnique(cues,'runes, sigils or obvious magical workmanship');
      curiosity+=13;magic+=14;awe+=6;
    }
    if(hit(/floating|levitat|hover|orbit/)){
      pushUnique(tags,'levitating');pushUnique(cues,'motion that ignores normal physics');
      awe+=12;magic+=12;fear+=4;
    }
    if(hit(/mechanical|clockwork|gearwork|engineering|device|gadget|contraption|apparatus/)){
      pushUnique(tags,'gadget');pushUnique(cues,'nonstandard engineered workmanship');
      curiosity+=14;danger+=6;
    }
    if(hit(/bomb|grenade|explosive|detonat|volatile|blast charge/)){
      pushUnique(tags,'explosive');pushUnique(cues,'volatile components that imply blast danger');
      danger+=20;fear+=12;suspicion+=10;
    }
    if(hit(/concealed|hidden|folding|compact|sleeve-mounted|secret/)){
      pushUnique(tags,'concealable');
      suspicion+=7;curiosity+=5;
    }
    if(hit(/masterwork|priceless|jewel|gem|gold|silver|ornate|gilded|filigree|silk/)){
      pushUnique(tags,'luxurious');pushUnique(cues,'expensive craftsmanship or precious materials');
      prestige+=10;wealth+=16;
    }
    if(hit(/ancient|relic|artifact|legendary|mythic/)){
      pushUnique(tags,'relic');pushUnique(cues,'the air of an old but significant relic');
      awe+=10;prestige+=8;curiosity+=8;
    }
    if(hit(/impossible|unfathomable|beyond mortal|world-ending|reality/)){
      pushUnique(tags,'impossible');pushUnique(cues,'something that feels beyond ordinary reality');
      awe+=18;fear+=10;magic+=15;prestige+=8;
    }

    if(!tags.length && sourceType==='trait' && String(text||'').trim()){
      pushUnique(tags,'unusual-presence');curiosity+=6;
    }
    if(!tags.length && sourceType==='item' && String(text||'').trim()){
      pushUnique(tags,'special-item');curiosity+=4;
    }

    if(fear>=16)notes.push('likely to make ordinary people wary or afraid');
    if(prestige>=16||wealth>=16||authority>=16)notes.push('likely to alter social status assumptions');
    if(sacred>=14)notes.push('likely to be interpreted as sacred by religious observers');
    if(dread>=14)notes.push('likely to create instinctive unease');
    if(curiosity>=14)notes.push('likely to draw focused study from specialists');
    if(danger>=16)notes.push('looks obviously dangerous if seen clearly');

    const visualBoost=Math.min(18,cues.length*4);
    const weight=clamp(Math.round(Math.max(danger+fear*.35,prestige+awe*.35,magic+curiosity*.35,sacred+dread*.25,wealth+authority*.35)+visualBoost),0,100);
    const summary=tags.length
      ? `Visible meaning: ${tags.slice(0,5).join(', ')}${notes.length?`; ${notes.slice(0,3).join('; ')}`:''}.`
      : 'No strong semantic signals beyond basic appearance.';
    return {tags,cues,notes,fear,prestige,suspicion,curiosity,danger,awe,magic,sacred,dread,wealth,authority,weight,summary};
  }

  function semanticTraitProfile(trait){
    const base=normalizeSpecialTrait(trait||{});
    const signals=descriptionSignalProfile(`${base.name} ${base.category} ${base.desc}`, 'trait');
    return {base,signals};
  }

  function semanticItemProfile(item,c=state.character){
    const p=itemProfileFor(item,c);
    const signals=descriptionSignalProfile(`${p.name||item} ${p.desc||''}`, 'item');
    const semanticWeight=clamp(Math.round(Math.max(p.tierData?.score||0, Math.round((p.tierData?.score||0)*.55 + signals.weight*.65))),0,100);
    return {profile:p,signals,semanticWeight};
  }

  function combinedSemanticOverview(npc=null){
    normalizeCharacterPowerData();
    const visible=playerVisibleIdentity().visible_gear.map(x=>semanticItemProfile(x.item,state.character));
    const traits=(state.character.specialTraits||[])
      .map(semanticTraitProfile)
      .filter(entry=>{
        const m=MANIFESTATION_LEVELS[entry.base.manifestation]||MANIFESTATION_LEVELS.obvious;
        if(entry.base.manifestation==='hidden')return false;
        if(entry.base.manifestation==='subtle' && npc){
          const threshold=clamp(Math.round(npcSensitivityScore(npc)+tierData(entry.base.tier).score*.38),5,95);
          const rng=seeded(`${state.world.seed}-trait-sem-${npc?.id||'scene'}-${entry.base.name}-${state.world.day}`);
          return randInt(1,100,rng)<=threshold;
        }
        return true;
      });
    const tags=[],cues=[],notes=[];
    let fear=0,prestige=0,suspicion=0,curiosity=0,danger=0,awe=0,magic=0,sacred=0,dread=0,weight=0;
    for(const entry of [...visible,...traits]){
      entry.signals.tags.forEach(x=>pushUnique(tags,x));
      entry.signals.cues.forEach(x=>pushUnique(cues,x));
      entry.signals.notes.forEach(x=>pushUnique(notes,x));
      fear=Math.max(fear,entry.signals.fear);
      prestige=Math.max(prestige,entry.signals.prestige);
      suspicion=Math.max(suspicion,entry.signals.suspicion);
      curiosity=Math.max(curiosity,entry.signals.curiosity);
      danger=Math.max(danger,entry.signals.danger);
      awe=Math.max(awe,entry.signals.awe);
      magic=Math.max(magic,entry.signals.magic);
      sacred=Math.max(sacred,entry.signals.sacred);
      dread=Math.max(dread,entry.signals.dread);
      weight=Math.max(weight, entry.semanticWeight || entry.signals.weight || 0);
    }
    const summary = tags.length
      ? `NPC-visible semantic signals: ${tags.slice(0,6).join(', ')}. ${notes.slice(0,3).join('; ')}`
      : 'No particularly strong visible semantic signals beyond ordinary equipment and bearing.';
    return {tags,cues,notes,fear,prestige,suspicion,curiosity,danger,awe,magic,sacred,dread,weight,summary};
  }

  // V4.10 override: trait descriptions influence what NPCs actually notice and how they interpret it.
  function specialTraitTruthForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return (c.specialTraits||[]).map(trait=>{
      const td=tierData(trait.tier),m=MANIFESTATION_LEVELS[trait.manifestation]||MANIFESTATION_LEVELS.obvious;
      const semantic=semanticTraitProfile(trait).signals;
      return {
        name:trait.name,category:trait.category,description:trait.desc,
        magnitude:td.label,magnitude_score:td.score,
        manifestation:m.label,manifestation_key:trait.manifestation,
        classified_signal:classifySpecialTrait(trait),
        semantic_tags:semantic.tags,
        visible_cues:semantic.cues,
        social_weight:semantic.weight,
        semantic_summary:semantic.summary
      };
    });
  }

  // V4.10 override: observable auras include semantic cues from the written description.
  function observableTraitsForNpc(npc){
    normalizeCharacterPowerData();
    return (state.character.specialTraits||[]).flatMap(trait=>{
      const base=normalizeSpecialTrait(trait);
      const td=tierData(base.tier),m=MANIFESTATION_LEVELS[base.manifestation]||MANIFESTATION_LEVELS.obvious;
      if(base.manifestation==='hidden')return [];
      let noticed=base.manifestation==='overwhelming'||base.manifestation==='obvious';
      if(base.manifestation==='subtle'){
        const threshold=clamp(Math.round(npcSensitivityScore(npc)+td.score*.38),5,95);
        const rng=seeded(`${state.world.seed}-trait-notice-${npc?.id||'scene'}-${base.name}-${state.world.day}`);
        noticed=randInt(1,100,rng)<=threshold;
      }
      if(!noticed)return [];
      const semantic=semanticTraitProfile(base).signals;
      const apparentScore=clamp(Math.round(td.score*m.factor+(base.manifestation==='overwhelming'?10:0)+semantic.weight*.28),0,100);
      return [{
        name:base.name,
        category:base.category,
        description:base.desc,
        signal:classifySpecialTrait(base),
        apparent_magnitude:td.label,
        apparent_score:apparentScore,
        manifestation:m.label,
        reaction_guidance:traitReactionGuidance(npc,base,apparentScore),
        perceived_features:semantic.tags,
        visible_cues:semantic.cues,
        semantic_weight:semantic.weight,
        semantic_summary:semantic.summary,
        exact_power_known:false,
        instruction:'React to the perceived phenomenon. The description carries real weight: if the aura is visible/manifested, NPCs may notice the cues and socially respond to them without automatically knowing the hidden mechanics.'
      }];
    });
  }

  function equipmentDescriptionReactionGuidance(npc,itemProfile,signals,score){
    const occ=String(npc?.occupation||'').toLowerCase();
    const tags=signals.tags||[];
    const visible=visibleCueSummaryFromSignals(signals.cues||[]);
    if(tags.includes('divine')||tags.includes('holy')){
      if(/priest|cleric|paladin|templar|monk/.test(occ))return 'religious observers should recognise sacred significance, show reverence or doctrinal alarm, and not treat the item as a normal piece of gear.';
      if(/guard|watch|warden|soldier/.test(occ))return 'guards should understand that the visible item looks far beyond ordinary equipment and adjust their confidence and protocol accordingly.';
    }
    if(tags.includes('demonic')||tags.includes('necrotic')){
      if(/priest|cleric|paladin|templar/.test(occ))return 'religious or disciplined observers should treat the item as spiritually dangerous, corrupt or heretical rather than ordinary gear.';
      return 'ordinary observers should feel unease, superstition or fear if the item is seen clearly.';
    }
    if(tags.includes('explosive')||tags.includes('gadget')){
      if(/guard|watch|warden|soldier/.test(occ))return 'security-minded NPCs should be alert to unconventional danger, sabotage risk or unstable technology.';
      if(/smith|merchant|alchemist|scholar|mage/.test(occ))return 'specialists should focus on the device/gadget aspect and what it might be capable of.';
    }
    if(tags.includes('regal')||tags.includes('luxurious')||tags.includes('commanding')){
      if(/noble|court|official|guard/.test(occ))return 'status-conscious NPCs should read the item as a marker of rank, wealth, patronage or authority.';
    }
    if(score>=88)return `The item appears far beyond ordinary standards. Visible cues: ${visible || 'extreme quality and power'}.`;
    if(score>=65)return `The item should be treated as extraordinary rather than generic. Visible cues: ${visible || 'unusual presence'}.`;
    if(signals.weight>=28)return `Even without exact knowledge, the item's description implies visible significance. Cues: ${visible || 'notable features'}.`;
    return 'NPCs may note quality, danger or unusual style without knowing hidden mechanics.';
  }

  // V4.10 override: equipment descriptions alter social interpretation.
  function equipmentObservationForNpc(npc,item){
    const c=state.character,semantic=semanticItemProfile(item,c),p=semantic.profile;
    const baseScore=itemPowerScore(item,c);
    const score=clamp(Math.round(Math.max(baseScore, baseScore*.72 + semantic.signals.weight*.55 + (['supernatural','overwhelming'].includes(p.presence)?8:0))),0,100);
    const occ=String(npc?.occupation||'').toLowerCase();
    let recognition='sees the item but does not automatically know its exact abilities or formal name';
    if(/blacksmith|armourer|armorer|smith|merchant/.test(occ)&&score<65)recognition='can make an informed estimate of quality, material and value, but not hidden powers';
    if(/mage|scholar|alchemist/.test(occ)&&['supernatural','overwhelming'].includes(p.presence))recognition='can recognise that the item carries major supernatural power, but not necessarily its exact abilities';
    if(score>=90)recognition='can tell that this is far beyond normal equipment; exact nature may still be incomprehensible';
    return {
      narrator_reference:item,
      description:p.desc||'',
      power_tier:p.tierData.label,
      significance_score:score,
      description_weight:semantic.signals.weight,
      visible_presence:p.presence,
      condition:equipmentCondition(item),
      condition_label:equipmentConditionLabel(equipmentCondition(item)),
      observer_interpretation:recognition,
      perceived_features:semantic.signals.tags,
      visible_cues:semantic.signals.cues,
      semantic_summary:semantic.signals.summary,
      reaction_guidance:equipmentDescriptionReactionGuidance(npc,p,semantic.signals,score),
      exact_effects_known:false
    };
  }

  function equipmentObservationsForNpc(npc){
    const visible=playerVisibleIdentity();
    return visible.visible_gear.map(x=>equipmentObservationForNpc(npc,x.item));
  }

  // V4.10 override: item definitions now expose semantic meaning for the narrator.
  function itemProfilesForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return (c.inventory||[]).map(item=>{
      const semantic=semanticItemProfile(item,c),p=semantic.profile;
      return {
        name:item,
        description:p.desc||'',
        power_tier:p.tierData.label,
        power_score:p.tierData.score,
        visible_presence:p.presence,
        slot:p.slot,
        semantic_tags:semantic.signals.tags,
        visible_cues:semantic.signals.cues,
        social_weight:semantic.signals.weight,
        semantic_summary:semantic.signals.summary
      };
    });
  }

  // V4.10 override: description-level signals contribute to threat, prestige and expected reactions.
  function buildSocialPerception(npc=null){
    normalizeCharacterPowerData();
    const c=state.character,k=currentKingdom(),eq=visibleEquipment(c);
    const height=parseHeightInches(c.height);
    const gearWealth=eq.reduce((sum,x)=>sum+itemWealthScore(x.item,c),0);
    const gearThreat=eq.reduce((sum,x)=>sum+itemThreatScore(x.item,c),0);
    const significance=equipmentSignificanceSummary(c,eq);
    const semantic=combinedSemanticOverview(npc);
    const bodyThreat={Slight:-8,Lean:-4,Average:0,Athletic:6,Broad:8,Muscular:13,Massive:19}[c.build]||0;
    const heightThreat=height?clamp(Math.round((height-68)*1.35),-12,25):0;
    const apparentWealth=clamp(Math.round(gearWealth+(c.renown||0)*.2+(c.background==='Noble'?15:0)+(semantic.prestige*.18)+(semantic.weight*.08)),0,100);
    const broadTraitSignals=specialTraitTruthForAi(c).filter(x=>x.manifestation_key!=='hidden');
    const traitMagnitude=Math.max(0,...broadTraitSignals.map(x=>Math.round(x.magnitude_score*(MANIFESTATION_LEVELS[x.manifestation_key]?.factor||0))));
    const semanticPressure=Math.max(semantic.weight, semantic.danger, semantic.sacred, semantic.dread, semantic.magic);
    const intimidation=clamp(Math.round(20+(c.stats?.str||8)*1.4+bodyThreat+heightThreat+gearThreat*.4+significance.highest_score*.22+traitMagnitude*.18+(c.infamy||0)*.35+semantic.danger*.24+semantic.dread*.22+semantic.weight*.12),0,100);
    const prestige=clamp(Math.round((c.renown||0)*.7+apparentWealth*.3+significance.highest_score*.28+traitMagnitude*.12+(currentKingdom()?.playerRep||0)*.2+semantic.prestige*.24+semantic.sacred*.16+semantic.authority*.16),0,100);
    const attitude=raceAttitudeFor(k,c.race),policy=racePolicyFromScore(attitude);
    const deviation=raceDeviationProfile(c,eq);
    const visiblyArmed=eq.some(x=>['mainHand','offHand'].includes(x.slot)&&/sword|dagger|knife|bow|axe|mace|spear|hammer|crossbow|staff|blade|cleaver/.test(String(x.item).toLowerCase()));
    let threat=perceptionThreatLabel(deviation.expectation.physical,deviation.anomaly_score,intimidation);
    if(significance.highest_score>=90||traitMagnitude>=92||semanticPressure>=92)threat='extreme';
    else if(significance.highest_score>=75||traitMagnitude>=78||semanticPressure>=75)threat=['low','ordinary','elevated'].includes(threat)?'high':threat;

    let guard='routine';
    if(significance.highest_score>=90||traitMagnitude>=92||semantic.weight>=88){
      guard='do not treat this as an ordinary armed traveller; maintain distance, avoid casual confiscation or provocation, alert a superior and consider calling clergy, mages or elite support depending on what is visibly carried or emanated';
    }else if(significance.highest_score>=75||traitMagnitude>=78||semantic.weight>=70){
      guard='treat the player as an exceptional threat or high-status supernatural figure; keep tactical distance, summon senior support and avoid assuming normal guard numbers are sufficient';
    }else if(significance.highest_score>=48||semantic.weight>=40){
      guard='recognise elite or extraordinary equipment; approach cautiously and assume the wearer may be a highly capable warrior or unusual specialist';
    }else if(significance.highest_score>=25||semantic.weight>=22){
      guard='notice costly or serious martial equipment; remain professional and more cautious than with an unarmed common traveller';
    }else if(policy==='kill_on_sight') guard=threat==='extreme'||threat==='high'?'raise the alarm, keep distance, form a defensive line and attack with support':'attack on recognition';
    else if(policy==='hostile') guard=threat==='extreme'||threat==='high'?'avoid a lone confrontation; level weapons, call reinforcements and issue commands from distance':visiblyArmed?'armed confrontation likely':'detain, expel or challenge';
    else if(policy==='restricted') guard=threat==='extreme'||threat==='high'?'block entry cautiously, summon a superior and avoid provoking the unusually dangerous outsider':'challenge entry and demand justification/disarmament';
    else if(policy==='distrusted') guard=threat==='extreme'||threat==='high'?'watch intensely, keep tactical distance and quietly alert other guards':'watch closely and question if suspicious';
    else if(k.culture?.armedEntry==='strict'&&visiblyArmed) guard='demand ordinary weapons be surrendered or peace-bonded, unless visible power makes direct enforcement unsafe';
    else if(k.culture?.armedEntry==='regulated'&&visiblyArmed) guard='notice weapons and question purpose';

    const base={
      height:c.height,build:c.build,appearance:c.appearance,
      apparent_wealth:apparentWealth,apparent_wealth_label:apparentWealth>=80?'extremely wealthy / elite':apparentWealth>=55?'wealthy':apparentWealth>=35?'comfortable':apparentWealth>=18?'modest':'poor',
      intimidation,intimidation_label:intimidation>=90?'overwhelming':intimidation>=75?'extreme':intimidation>=60?'high':intimidation>=40?'noticeable':'low',
      prestige,visible_weapons:visiblyArmed,visibly_injured:(c.injuries||[]).length>0,
      local_race_attitude:attitude,local_race_policy:policy,expected_guard_reaction:guard,
      race_expectation:deviation.expectation,racial_deviations:deviation.deviations,racial_anomaly_score:deviation.anomaly_score,racial_anomaly_category:deviation.anomaly_category,
      perceived_threat:threat,demonic_traits:deviation.demonic,magical_signs:deviation.magical,
      equipment_significance:significance,
      visible_supernatural_magnitude:traitMagnitude,
      semantic_signals:semantic,
      visible_description_weight:semantic.weight,
      visible_description_summary:semantic.summary
    };
    base.npc_specific=npc?socialPerceptionForNpc(npc,base):null;
    return base;
  }

  // V4.10 override: NPC reactions explicitly account for description-driven cues like holy auras, gadgets and impossible armour.
  function socialPerceptionForNpc(npc,base=null){
    ensureNpcDeepProfile(npc);
    const p=base||buildSocialPerception(npc);
    const a=npc.socialAxes;
    const attitude=Number(p.local_race_attitude??0),wealth=Number(p.apparent_wealth??0),anomaly=Number(p.racial_anomaly_score||0);
    const rep=layeredReputationForNpc(npc),recognition=recognitionForNpc(npc),visible=playerVisibleIdentity();
    const equipmentSignals=equipmentObservationsForNpc(npc),traitSignals=observableTraitsForNpc(npc);
    const semantics=p.semantic_signals||combinedSemanticOverview(npc);
    const powerSignal=Math.max(0,...equipmentSignals.map(x=>x.significance_score),...traitSignals.map(x=>x.apparent_score),semantics.weight||0);
    let fear=Math.max(a.fear,Math.round(Number(p.intimidation||0)*.55));
    let respect=Math.max(a.respect,Math.round(Number(p.prestige||0)*.45)+Math.round(rep.known_weighted*.18));
    let suspicion=Math.max(a.suspicion,Math.max(0,Math.round(-attitude*.55)));
    let curiosity=Math.round(anomaly*.25);
    const occ=String(npc.occupation||'').toLowerCase(),person=String(npc.personality||'').toLowerCase();
    let likelyReaction='assess the stranger according to visible evidence, power and personal goals';

    fear+=Math.round((semantics.fear||0)*.35)+Math.round((semantics.dread||0)*.25);
    respect+=Math.round((semantics.prestige||0)*.32)+Math.round((semantics.sacred||0)*.18)+Math.round((semantics.authority||0)*.18);
    suspicion+=Math.round((semantics.suspicion||0)*.28);
    curiosity+=Math.round((semantics.curiosity||0)*.35)+Math.round((semantics.magic||0)*.18);

    if(powerSignal>=95){fear+=28;respect+=24;curiosity+=20;likelyReaction='recognise that something present is beyond normal mortal standards; casual bravado or routine treatment would be implausible';}
    else if(powerSignal>=82){fear+=20;respect+=18;curiosity+=16;likelyReaction='treat the visible power as mythic or almost unbelievable, reassessing normal assumptions';}
    else if(powerSignal>=65){fear+=12;respect+=15;curiosity+=10;likelyReaction='recognise legendary-grade capability or equipment and avoid treating the player as ordinary';}
    else if(powerSignal>=45){respect+=11;suspicion+=5;likelyReaction='notice exceptional quality/power and take the player more seriously';}
    else if(powerSignal>=25){respect+=6;likelyReaction='notice serious equipment or unusual capability associated with a competent warrior or prosperous figure';}

    const tags=semantics.tags||[];
    if(/guard|watch|warden|soldier/.test(occ)){
      suspicion+=15;if(visible.visible_weapons.length)suspicion+=12;fear+=Math.round(anomaly*.18);
      if(tags.includes('explosive')||tags.includes('gadget'))suspicion+=12;
      if(tags.includes('divine')||tags.includes('holy'))respect+=10;
      if(powerSignal>=90)likelyReaction='keep distance, avoid routine weapon seizure, alert senior command and seek specialised support rather than casually challenging the player';
      else if(tags.includes('explosive'))likelyReaction='treat the player as carrying unconventional high-risk equipment and avoid crowding them while alerting other guards';
      else if(tags.includes('holy')||tags.includes('divine'))likelyReaction='notice that the aura/equipment looks overtly sacred or impossible and proceed much more carefully than normal';
      else if(powerSignal>=65)likelyReaction='maintain tactical caution and call additional guards or a superior before escalating';
      else if(powerSignal>=25)likelyReaction='treat the player as a serious armed warrior rather than an easy civilian encounter';
      else likelyReaction=p.expected_guard_reaction;
    }
    if(/merchant|trader|innkeeper/.test(occ)){
      respect+=Math.round(wealth*.2);
      if(tags.includes('luxurious')||tags.includes('regal'))respect+=8;
      if(powerSignal>=80)likelyReaction='recognise an almost priceless or incomprehensible display and become unusually careful about offence, theft and ability to pay';
      else if(tags.includes('gadget'))likelyReaction='wonder whether the unusual device has value, risk or novelty worth discussing';
      else likelyReaction=visible.apparent_wealth>=65?'notice purchasing power and unusual equipment':'judge safety, honesty and ability to pay';
    }
    if(/blacksmith|armourer|armorer|smith/.test(occ)){
      curiosity+=powerSignal>=60?35:15;
      if(tags.includes('gadget'))curiosity+=14;
      likelyReaction=powerSignal>=90?'professional disbelief: the craftsmanship/power exceeds anything this NPC reasonably expects to encounter':powerSignal>=55?'intense professional interest in extraordinary workmanship':'assess materials, wear and quality';
    }
    if(/noble|court|official/.test(occ)){
      respect+=Math.round(p.prestige*.2);suspicion+=Math.round(anomaly*.1);
      if(tags.includes('regal')||tags.includes('commanding'))respect+=10;
      likelyReaction=powerSignal>=80?'treat the display as politically or religiously significant, questioning what patron, power or authority could explain it':anomaly>=45?'assess status, patronage, heraldry and political implications':'judge rank, etiquette and affiliation';
    }
    if(/mage|scholar|scribe|alchemist/.test(occ)){
      curiosity+=Math.round(anomaly*.3)+(p.magical_signs?20:0)+(powerSignal>=65?25:0);
      if(tags.some(x=>['arcane','lightning','fire','ice','necrotic','divine','gadget','explosive'].includes(x)))curiosity+=12;
      likelyReaction=powerSignal>=90?'profound intellectual or magical shock; this exceeds ordinary scholarly expectations':powerSignal>=55?'careful study of exceptional supernatural signatures':'observe unusual details others may miss';
    }
    if(/priest|cleric|paladin|templar|monk/.test(occ)){
      if(tags.includes('holy')||tags.includes('divine')){
        const holy=Math.max(...traitSignals.filter(x=>x.signal==='holy / celestial').map(x=>x.apparent_score), semantics.sacred||0);
        respect+=Math.round(holy*.25);fear+=Math.round(holy*.1);
        likelyReaction=holy>=90?'religious awe, doctrinal shock or reverence is plausible; the NPC may hesitate to treat the player as an ordinary mortal':holy>=65?'strong religious recognition and respect':'notice a sacred quality';
      }
      if(tags.includes('demonic')||tags.includes('necrotic')){
        suspicion+=14;fear+=10;
        likelyReaction='religious alarm, condemnation or defensive caution is plausible because the visible aura/gear looks spiritually dangerous';
      }
    }
    if(/thief|criminal|bandit|smuggler/.test(occ))likelyReaction=powerSignal>=60||fear>=55?'conclude this is a dangerously poor robbery target despite visible wealth':'assess the player as a possible mark';
    if(/farmer|peasant|labour|labor|beggar/.test(occ)&& (powerSignal>=80 || semantics.weight>=65))likelyReaction='ordinary experience offers little frame of reference; awe, fear, staring, retreat, prayer or disbelief are plausible';
    if(/nervous|wary/.test(person))fear+=12;
    if(/proud|reckless/.test(person))fear-=8;

    a.fear=clamp(Math.round((a.fear*2+fear)/3),0,100);
    a.respect=clamp(Math.round((a.respect*2+respect)/3),0,100);
    a.suspicion=clamp(Math.round((a.suspicion*2+suspicion)/3),0,100);
    a.trust=clamp(a.trust,0,100);
    updateNpcEmotion(npc,'current social situation');

    return {
      fear:a.fear,respect:a.respect,suspicion:a.suspicion,trust:a.trust,curiosity:clamp(curiosity,0,100),
      likely_reaction:likelyReaction,
      recognised_identity:recognition.recognised,recognised_as:recognition.identity,recognition_confidence:recognition.confidence,
      visible_identity:visible.display_identity,visible_race:visible.apparent_race,reputation_known:rep,
      highest_observable_power:powerSignal,
      equipment_observations:equipmentSignals,
      supernatural_observations:traitSignals,
      semantic_overview:semantics,
      instruction:'Use the written descriptions of visible gear, gadgets and observable traits as actionable world facts. If something visibly crackles with lightning, radiates sanctity or looks like an explosive device, NPC behaviour should acknowledge that.'
    };
  }

  // V4.10 override: NPC payload emphasises semantic interpretation.
  function npcForAi(n){
    ensureNpcDeepProfile(n);
    const f=factionById(n.factionId),per=buildSocialPerception(n).npc_specific,rank=n.socialRank,playerRank=playerRankEstimate();
    return {
      id:n.id,name:n.name,occupation:n.occupation,personality:n.personality,relationship:n.relationship,
      faction:f?.name||null,faction_id:n.factionId||null,companion:!!n.companion,dead:!!n.dead,
      memory:compactArray(n.memory||[],6),perception_of_player:per,
      equipment_observations:equipmentObservationsForNpc(n),
      supernatural_observations:observableTraitsForNpc(n),
      visible_description_signals:per.semantic_overview,
      visual_profile:ensureNpcVisualProfile(n),body_language:bodyLanguageForNpc(n),emotion:n.emotion,goals:n.goals,
      social_axes:{...n.socialAxes},social_rank:rank,
      hierarchy_context:{npc_rank_score:rank.score,player_apparent_rank_score:playerRank,relation:playerRank>=rank.score+20?'player appears substantially higher status':playerRank+20<=rank.score?'NPC appears substantially higher status':'roughly comparable apparent status'},
      languages:n.languages,heraldry_interpretation:visibleHeraldryForNpc(n),knowledge:npcKnowledgeForAi(n),
      secrets:{public:n.secrets.public,private_instruction:'Private/secret fields are narrator truth, not automatically known to the player. Reveal only through behaviour, discovery, confession or justified inference.',private:n.secrets.private,secret:n.secrets.secret,current_cover_story:n.secrets.cover_story}
    };
  }

  // V4.10 override: snapshot tells the AI to respect visible description semantics.
  function aiWorldSnapshot(){
    ensureV4Data(); ensureV46Data();
    const c=state.character,g=state.game,w=state.world,k=currentKingdom();
    const participants=getConversationNpcs();
    const focus=participants.find(n=>n.id===g.conversationFocusId)||g.activeNpc||participants[0]||null;
    const localFactions=(w.factions||[]).filter(f=>f.kingdomId===k.id).slice(0,5);
    const activeQuests=(w.quests||[]).filter(q=>q.status==='active').slice(0,4);
    const d=dynastyForKingdom(k.id);
    const perception=buildSocialPerception();
    const visible=playerVisibleIdentity();

    return {
      game_rules:{
        world_magic_level:state.worldConfig.magic,world_danger_level:state.worldConfig.danger,
        political_climate:state.worldConfig.politics,player_controls_own_choices:true,
        permanent_injuries_enabled:true,appearance_affects_social_reactions:true,
        race_policy_is_simulation_fact:true,group_conversations_enabled:true,
        npc_knowledge_is_limited:true,hidden_player_information_must_not_leak:true,
        rumours_can_be_false:true,scene_changes_persist:true,
        visible_descriptions_affect_social_logic:true
      },

      player_truth_for_narrator_only:{
        name:c.name,sex:c.sex,age:c.age,race:c.race,race_description:c.raceProfile?.description||'',
        background:c.background,class:c.className,level:c.level,stats:c.stats,
        full_appearance:{height:c.height,build:c.build,description:c.appearance},
        full_equipment:{...(c.equipment||{})},
        equipment_definitions:itemProfilesForAi(c),
        special_traits_and_auras:specialTraitTruthForAi(c),
        skill_definitions:skillProfilesForAi(c),
        injuries:c.injuries||[],gold:c.gold,renown:c.renown||0,infamy:c.infamy||0,
        languages:c.languages,
        instruction:'Narrator may know this. Item and aura descriptions are mechanically meaningful: if a description says the gear crackles with storm power or radiates holy force, treat that as real world information. NPCs still only know what they can plausibly perceive.'
      },

      player_visible_to_npcs:{
        ...visible,
        equipped_with_condition:visible.visible_gear,
        equipment_significance:equipmentSignificanceSummary(c,visibleEquipment(c)),
        local_social_perception:perception,
        apparent_rank_score:playerRankEstimate(),
        description_signal_summary:perception.semantic_signals,
        instruction:'Visible equipment power/significance is canonical. The written descriptions of visible equipment, gadgets and manifested auras also matter: NPCs can react to visible cues, sacred pressure, dangerous devices, crackling lightning, regal symbolism, dread or other perceptible signals without automatically learning hidden mechanics.'
      },

      player_mechanics:{
        hp:{current:c.hp,max:c.maxHp},mana:{current:c.mana||0,max:c.maxMana||0},
        skills:skillProfilesForAi(c).slice(0,16),
        spells:(c.spells||[]).map(id=>spellById(id)).filter(Boolean).map(s=>({name:s.name,school:s.school,tier:s.tier,cost:s.cost})),
        companions:(c.companions||[]).filter(x=>x.active!==false).map(x=>({name:x.name,role:x.role,hp:x.hp,maxHp:x.maxHp,loyalty:x.loyalty,morale:x.morale}))
      },

      reputation_layers:{
        local:c.reputationLayers.local[currentLocationKey()]||0,
        kingdom:c.reputationLayers.kingdom[g.kingdomId]??k.playerRep??0,
        underworld:c.reputationLayers.underworld||0,
        legendary:c.reputationLayers.legendary||0,
        instruction:'Do not assume reputation is globally known. Each NPC\'s recognition/knowledge determines what they actually know.'
      },

      location_visual_context:locationVisualContext(),
      persistent_scene_state:sceneStateForAi(),

      scene:{
        world:w.name,date:`${w.day} ${w.season}, ${w.year}`,time:g.time,location:g.location,area_type:g.areaType,
        legal_status:legalStatus(),heat:currentHeat(),bounty:currentBounty(),
        local_race_policy:perception.local_race_policy,expected_guard_reaction:perception.expected_guard_reaction,
        dungeon:g.dungeonRun?{name:activeDungeon()?.name||'Unknown',chamber:(g.dungeonRun.roomIndex||0)+1,depth:activeDungeon()?.depth||null}:null,
        combat:g.combat?{enemy:g.combat.name,level:g.combat.level,hp:g.combat.hp,maxHp:g.combat.maxHp,statuses:g.combat.statuses||[],context:g.combat.context}:null
      },

      conversation:{
        focus_npc_id:focus?.id||null,
        focus_npc_name:focus?.name||null,
        participant_count:participants.length,
        participants:participants.map(n=>npcForAi(n)),
        group_dynamics:conversationDynamics(participants),
        turn_taking:turnTakingForConversation(participants),
        instruction:participants.length>1
          ?'This is a group conversation. Preserve turn-taking: direct questions usually go to the focus NPC; other NPCs speak only when they have a motive to interrupt, support, contradict, react or confer.'
          :'Single-NPC conversation.'
      },

      player_perception_check:g.lastPerceptionResult,
      anti_repetition:antiRepetitionForAi(),

      kingdom:{
        id:k.id,name:k.name,ruler:`${k.rulerTitle} ${k.ruler}`,capital:k.capital,prosperity:k.prosperity,stability:k.stability,
        player_reputation:k.playerRep||0,wars:(k.wars||[]).map(id=>kingdomById(id)?.name||id),
        culture:{race_attitudes:{...(k.culture?.raceAttitudes||{})},armed_entry:k.culture?.armedEntry||'regulated',outsider_tolerance:k.culture?.outsiderTolerance||50},
        politics:k.politics?{crown_authority:k.politics.crownAuthority,noble_power:k.politics.noblePower,popular_support:k.politics.popularSupport,unrest:Math.round(k.politics.unrest),policy:k.politics.policy}:null,
        dynasty:d?{house:d.houseName,ruler:d.ruler,heirs:d.heirs?.slice(0,5),succession_law:d.successionLaw}:null
      },

      local_factions:localFactions.map(f=>({id:f.id,name:f.name,type:f.type,player_reputation:f.playerRep,joined:!!f.joined,power:f.power})),
      active_quests:activeQuests.map(q=>({id:q.id,title:q.title,description:q.description,progress:q.progress,goal:q.goal,faction_id:q.factionId})),
      recent_world_events:compactArray(w.events||[],4).map(e=>({date:e.date,text:e.text})),
      recent_story:compactArray(g.log||[],7).map(e=>stripHtml(e.text)),
      recent_ai_memory:compactArray(g.aiHistory||[],6)
    };
  }


  // ============================================================
  // V4.11 — PERCEPTION SYNTHESIS, SLOT LOGIC & AURA CONTROL
  // ============================================================

  const AURA_MODES={
    suppressed:{label:'Suppressed',powerFactor:.22,perceptionShift:-1,description:'deliberately muted; sensitive observers may still notice powerful auras'},
    normal:{label:'Normal',powerFactor:1,perceptionShift:0,description:'manifests at its natural creator-defined level'},
    flared:{label:'Flared',powerFactor:1.28,perceptionShift:1,description:'deliberately allowed to surge outward and become harder to ignore'}
  };

  const MANIFESTATION_ORDER=['hidden','subtle','obvious','overwhelming'];

  function auraStateKey(trait,index=0){
    return `${index}:${String(trait?.name||'aura').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
  }

  function getAuraMode(trait,index=0,c=state.character){
    c.auraStates ||= {};
    return AURA_MODES[c.auraStates[auraStateKey(trait,index)]] ? c.auraStates[auraStateKey(trait,index)] : 'normal';
  }

  function shiftedManifestation(base,shift){
    let i=MANIFESTATION_ORDER.indexOf(base);
    if(i<0)i=2;
    return MANIFESTATION_ORDER[clamp(i+shift,0,MANIFESTATION_ORDER.length-1)];
  }

  function effectiveAuraProfile(trait,index=0,c=state.character){
    const base=normalizeSpecialTrait(trait||{});
    const mode=getAuraMode(base,index,c),modeData=AURA_MODES[mode];
    const td=tierData(base.tier);
    let effectiveManifestation=shiftedManifestation(base.manifestation,modeData.perceptionShift);
    // Truly overwhelming creator-defined auras cannot be made completely absent merely by choosing Suppressed.
    if(base.manifestation==='overwhelming'&&mode==='suppressed'&&effectiveManifestation==='subtle')effectiveManifestation='obvious';
    const m=MANIFESTATION_LEVELS[effectiveManifestation]||MANIFESTATION_LEVELS.obvious;
    const semantic=descriptionSignalProfile(`${base.name} ${base.category} ${base.desc}`,'trait');
    const effectiveScore=clamp(Math.round(td.score*modeData.powerFactor*m.factor + semantic.weight*.24 + (mode==='flared'?8:0)),0,100);
    return {
      trait:base,index,mode,mode_label:modeData.label,
      base_manifestation:base.manifestation,effective_manifestation:effectiveManifestation,
      effective_manifestation_label:m.label,effective_score:effectiveScore,
      semantic,
      observable_summary:`${m.label}; effective presence ${effectiveScore}/100. ${semantic.cues.slice(0,2).join(', ')||modeData.description}.`
    };
  }

  function invalidateNpcPerceptionSignatures(){
    for(const n of (state.world?.npcs||[])){
      if(n?.perceptionHistory)n.perceptionHistory.signature='';
    }
  }

  function slotMeaning(slot,item,profile,signals,npc=null){
    const occ=String(npc?.occupation||'').toLowerCase();
    const score=clamp(Math.round(Math.max(profile?.tierData?.score||0,signals?.weight||0)),0,100);
    const base={slot,score,fear:0,respect:0,suspicion:0,curiosity:0,status:0,summary:''};
    switch(slot){
      case 'head':
        base.respect+=Math.round(score*.10);base.suspicion+=/mask|closed|faceless|hood/.test(`${item} ${profile?.desc||''}`.toLowerCase())?14:2;
        base.summary='Headgear shapes identity recognition, authority and intimidation; unusual helms or masks draw attention to who is underneath.';break;
      case 'body':
        base.respect+=Math.round(score*.18);base.fear+=Math.round(score*.12);base.status+=Math.round(score*.15);
        base.summary='Body armour is read primarily as protection, wealth, battlefield experience and willingness to survive violence.';break;
      case 'hands':
        base.curiosity+=Math.round(score*.10);base.respect+=Math.round(score*.07);
        base.summary='Gauntlets, tools and hand-mounted devices imply readiness, craft, hidden mechanisms or specialised fighting ability.';break;
      case 'mainHand':
        base.fear+=Math.round(score*.24);base.suspicion+=Math.round(score*.15);base.respect+=Math.round(score*.09);
        base.summary='A main-hand weapon is an immediate tactical signal; guards and combatants prioritise it over decorative gear.';break;
      case 'offHand':
        base.fear+=Math.round(score*.12);base.suspicion+=Math.round(score*.09);base.curiosity+=Math.round(score*.08);
        base.summary=/shield/.test(String(item).toLowerCase())?'A shield signals defence, discipline and preparation for a real fight.':'An off-hand item can signal defence, magic, a secondary weapon or an unconventional gadget.';break;
      case 'cloak':
        base.status+=Math.round(score*.14);base.respect+=Math.round(score*.08);base.suspicion+=signals?.tags?.includes('regal')?0:2;
        base.summary='Cloaks are read for status, faction symbolism, travel background, wealth and attempts to conceal what lies beneath.';break;
      case 'accessory':
        base.curiosity+=Math.round(score*.12);base.status+=Math.round(score*.10);base.respect+=signals?.tags?.includes('holy')||signals?.tags?.includes('divine')?12:3;
        base.summary='Accessories are subtle but important to observers who recognise jewellery, relics, holy symbols, signets or arcane focuses.';break;
      default:
        base.curiosity+=Math.round(score*.05);base.summary='The item contributes to the overall visible impression.';
    }
    if(/guard|watch|soldier|warden/.test(occ)&&['mainHand','offHand','body'].includes(slot))base.suspicion+=8;
    if(/smith|blacksmith|armourer|armorer/.test(occ)&&['body','head','hands','mainHand','offHand'].includes(slot))base.curiosity+=10;
    return base;
  }

  function equipmentObservationForNpc(npc,item,slot=null){
    const c=state.character,semantic=semanticItemProfile(item,c),p=semantic.profile;
    slot=slot||guessEquipmentSlot(item,c)||p.slot||'carried';
    const baseScore=itemPowerScore(item,c);
    const slotData=slotMeaning(slot,item,p,semantic.signals,npc);
    const score=clamp(Math.round(Math.max(baseScore,baseScore*.72+semantic.signals.weight*.55+slotData.score*.18+(['supernatural','overwhelming'].includes(p.presence)?8:0))),0,100);
    const occ=String(npc?.occupation||'').toLowerCase();
    let recognition='sees the item but does not automatically know its exact abilities or formal name';
    if(/blacksmith|armourer|armorer|smith|merchant/.test(occ)&&score<65)recognition='can make an informed estimate of quality, material and value, but not hidden powers';
    if(/mage|scholar|alchemist/.test(occ)&&['supernatural','overwhelming'].includes(p.presence))recognition='can recognise that the item carries major supernatural power, but not necessarily its exact abilities';
    if(score>=90)recognition='can tell that this is far beyond normal equipment; exact nature may still be incomprehensible';
    return {
      narrator_reference:item,slot,slot_label:equipmentSlotLabel(slot),description:p.desc||'',
      power_tier:p.tierData.label,significance_score:score,description_weight:semantic.signals.weight,
      visible_presence:p.presence,condition:equipmentCondition(item),condition_label:equipmentConditionLabel(equipmentCondition(item)),
      observer_interpretation:recognition,perceived_features:semantic.signals.tags,visible_cues:semantic.signals.cues,
      semantic_summary:semantic.signals.summary,reaction_guidance:equipmentDescriptionReactionGuidance(npc,p,semantic.signals,score),
      slot_reaction:slotData,exact_effects_known:false
    };
  }

  function equipmentObservationsForNpc(npc){
    const visible=playerVisibleIdentity();
    return visible.visible_gear.map(x=>equipmentObservationForNpc(npc,x.item,x.slot));
  }

  function specialTraitTruthForAi(c=state.character){
    normalizeCharacterPowerData(c);
    return (c.specialTraits||[]).map((trait,index)=>{
      const base=normalizeSpecialTrait(trait),td=tierData(base.tier),eff=effectiveAuraProfile(base,index,c),semantic=eff.semantic;
      return {
        name:base.name,category:base.category,description:base.desc,
        magnitude:td.label,magnitude_score:td.score,
        creator_manifestation:MANIFESTATION_LEVELS[base.manifestation]?.label||base.manifestation,
        aura_control:eff.mode_label,effective_manifestation:eff.effective_manifestation_label,effective_score:eff.effective_score,
        classified_signal:classifySpecialTrait(base),semantic_tags:semantic.tags,visible_cues:semantic.cues,
        social_weight:semantic.weight,semantic_summary:semantic.summary
      };
    });
  }

  function observableTraitsForNpc(npc){
    normalizeCharacterPowerData();
    return (state.character.specialTraits||[]).flatMap((trait,index)=>{
      const eff=effectiveAuraProfile(trait,index),base=eff.trait,td=tierData(base.tier),semantic=eff.semantic;
      if(eff.effective_manifestation==='hidden')return [];
      let noticed=['overwhelming','obvious'].includes(eff.effective_manifestation);
      if(eff.effective_manifestation==='subtle'){
        const threshold=clamp(Math.round(npcSensitivityScore(npc)+td.score*.34+semantic.weight*.18),5,98);
        const rng=seeded(`${state.world.seed}-trait-notice-v411-${npc?.id||'scene'}-${base.name}-${state.world.day}-${eff.mode}`);
        noticed=randInt(1,100,rng)<=threshold;
      }
      if(!noticed)return [];
      return [{
        name:base.name,category:base.category,description:base.desc,signal:classifySpecialTrait(base),
        apparent_magnitude:td.label,apparent_score:eff.effective_score,
        aura_control:eff.mode_label,manifestation:eff.effective_manifestation_label,
        reaction_guidance:traitReactionGuidance(npc,base,eff.effective_score),
        perceived_features:semantic.tags,visible_cues:semantic.cues,semantic_weight:semantic.weight,semantic_summary:semantic.summary,
        exact_power_known:false,
        instruction:'The aura control and description both matter. React to what this NPC actually perceives now; do not automatically know hidden exact mechanics.'
      }];
    });
  }

  function perceptionSignature(npc=null){
    const c=state.character,visible=playerVisibleIdentity();
    const gear=visible.visible_gear.map(x=>`${x.slot}:${x.item}`).sort().join('|');
    const aura=(c.specialTraits||[]).map((t,i)=>`${t.name}:${getAuraMode(t,i)}:${effectiveAuraProfile(t,i).effective_manifestation}`).sort().join('|');
    return [visible.apparent_race,visible.display_identity,gear,aura,c.visibility?.faceCovered,c.visibility?.cloakClosed,c.visibility?.weaponConcealed].join('::');
  }

  function exposureForNpc(npc){
    if(!npc)return {exposureCount:0,novelty:1,changed:false,novelty_label:'first impression'};
    ensureNpcDeepProfile(npc);
    const h=npc.perceptionHistory,signature=perceptionSignature(npc);
    const changed=!!h.signature && h.signature!==signature;
    if(h.lastExposureTurn!==state.game.turn){
      if(h.signature===signature)h.exposureCount+=1;
      else {h.signature=signature;h.exposureCount=1;}
      h.lastExposureTurn=state.game.turn;
      const obs=equipmentObservationsForNpc(npc),traits=observableTraitsForNpc(npc);
      const features=[...obs.flatMap(x=>x.perceived_features||[]),...traits.flatMap(x=>x.perceived_features||[])];
      h.knownFeatures=[...new Set([...(h.knownFeatures||[]),...features])].slice(-18);
    }
    const novelty=changed?1:clamp(1-(Math.max(0,h.exposureCount-1)*.13),.38,1);
    const novelty_label=changed?'appearance/power changed':h.exposureCount<=1?'first impression':h.exposureCount<=3?'still unfamiliar':'increasingly familiar';
    return {exposureCount:h.exposureCount,novelty,changed,novelty_label,knownFeatures:h.knownFeatures||[]};
  }

  function synthesizeVisibleImpression(npc=null,base=null,equipmentSignals=null,traitSignals=null){
    const c=state.character;
    const eq=equipmentSignals||equipmentObservationsForNpc(npc);
    const traits=traitSignals||observableTraitsForNpc(npc);
    const race=raceDeviationProfile(c,visibleEquipment(c));
    const semantic=combinedSemanticOverview(npc);
    const topEq=[...eq].sort((a,b)=>(b.significance_score||0)-(a.significance_score||0))[0]||null;
    const topAura=[...traits].sort((a,b)=>(b.apparent_score||0)-(a.apparent_score||0))[0]||null;
    const main=eq.find(x=>x.slot==='mainHand')||null;
    const armour=eq.find(x=>x.slot==='body')||null;
    const contradiction=clamp(Math.round(race.anomaly_score*.55 + (topEq?.significance_score||0)*.22 + (topAura?.apparent_score||0)*.23),0,100);
    const score=clamp(Math.round(Math.max(topEq?.significance_score||0,topAura?.apparent_score||0,semantic.weight||0,contradiction)),0,100);
    const tags=new Set(semantic.tags||[]);
    let label='unusual traveller';
    if((tags.has('holy')||tags.has('divine')) && score>=85 && (armour||main))label='overwhelming sacred warrior';
    else if((tags.has('demonic')||tags.has('necrotic')) && score>=75)label='supernaturally threatening outsider';
    else if(tags.has('explosive')||tags.has('gadget'))label=score>=65?'dangerous artificer / unconventional combatant':'unusual gadget-bearing traveller';
    else if(topAura?.apparent_score>=85)label='manifestly supernatural figure';
    else if(armour?.significance_score>=80&&main?.significance_score>=65)label='mythic or legendary martial figure';
    else if(armour?.significance_score>=45)label='elite heavily equipped warrior';
    else if(main?.significance_score>=45)label='visibly dangerous armed specialist';
    else if(race.anomaly_score>=60)label=`extraordinary ${c.race} who breaks local expectations`;
    else if(semantic.prestige>=35)label='high-status or prestigious traveller';

    const parts=[];
    if(race.deviations?.length)parts.push(`Racial expectation is disrupted by ${race.deviations.slice(0,2).join(' and ')}.`);
    if(armour)parts.push(`${armour.slot_label} gear (${armour.narrator_reference}) reads as ${armour.power_tier.toLowerCase()} and ${armour.reaction_guidance}`);
    if(main)parts.push(`The main-hand item (${main.narrator_reference}) is an immediate tactical signal.`);
    if(topAura)parts.push(`${topAura.name} is currently ${topAura.aura_control?.toLowerCase()||'normally'} manifested at ${topAura.apparent_magnitude.toLowerCase()} scale.`);
    if(semantic.summary)parts.push(semantic.summary);
    const exposure=npc?exposureForNpc(npc):{novelty:1,changed:false,novelty_label:'scene-wide first impression',exposureCount:0};
    return {
      label,score,contradiction_score:contradiction,
      top_equipment:topEq,top_aura:topAura,main_hand:main,body_armour:armour,
      semantic_tags:[...tags],summary:parts.filter(Boolean).join(' '),
      novelty:exposure.novelty,novelty_label:exposure.novelty_label,exposure_count:exposure.exposureCount,
      reaction_instruction:exposure.novelty<.65
        ?'This NPC has already had time to absorb the player\'s appearance. Do not repeat the same shocked introduction unless something changed; let the established fear/respect remain in behaviour.'
        :'This appearance/power is still novel to this NPC, so an explicit first reaction is appropriate.'
    };
  }

  function combinedSemanticOverview(npc=null){
    normalizeCharacterPowerData();
    const visible=visibleEquipment(state.character).map(x=>semanticItemProfile(x.item,state.character));
    const traits=(state.character.specialTraits||[]).map((t,i)=>({eff:effectiveAuraProfile(t,i),sem:semanticTraitProfile(t).signals})).filter(x=>x.eff.effective_manifestation!=='hidden');
    const tags=[],cues=[],notes=[];
    let fear=0,prestige=0,suspicion=0,curiosity=0,danger=0,awe=0,magic=0,sacred=0,dread=0,wealth=0,authority=0,weight=0;
    for(const entry of visible){
      const s=entry.signals;s.tags.forEach(x=>pushUnique(tags,x));s.cues.forEach(x=>pushUnique(cues,x));s.notes.forEach(x=>pushUnique(notes,x));
      fear=Math.max(fear,s.fear);prestige=Math.max(prestige,s.prestige);suspicion=Math.max(suspicion,s.suspicion);curiosity=Math.max(curiosity,s.curiosity);danger=Math.max(danger,s.danger);awe=Math.max(awe,s.awe);magic=Math.max(magic,s.magic);sacred=Math.max(sacred,s.sacred);dread=Math.max(dread,s.dread);wealth=Math.max(wealth,s.wealth);authority=Math.max(authority,s.authority);weight=Math.max(weight,entry.semanticWeight||s.weight||0);
    }
    for(const entry of traits){
      const s=entry.sem,scale=entry.eff.mode==='suppressed'?.45:entry.eff.mode==='flared'?1.25:1;
      s.tags.forEach(x=>pushUnique(tags,x));s.cues.forEach(x=>pushUnique(cues,x));s.notes.forEach(x=>pushUnique(notes,x));
      fear=Math.max(fear,Math.round(s.fear*scale));prestige=Math.max(prestige,Math.round(s.prestige*scale));suspicion=Math.max(suspicion,Math.round(s.suspicion*scale));curiosity=Math.max(curiosity,Math.round(s.curiosity*scale));danger=Math.max(danger,Math.round(s.danger*scale));awe=Math.max(awe,Math.round(s.awe*scale));magic=Math.max(magic,Math.round(s.magic*scale));sacred=Math.max(sacred,Math.round(s.sacred*scale));dread=Math.max(dread,Math.round(s.dread*scale));weight=Math.max(weight,entry.eff.effective_score);
    }
    const summary=tags.length?`NPC-visible semantic signals: ${tags.slice(0,7).join(', ')}. ${notes.slice(0,3).join('; ')}`:'No particularly strong visible semantic signals beyond ordinary equipment and bearing.';
    return {tags,cues,notes,fear,prestige,suspicion,curiosity,danger,awe,magic,sacred,dread,wealth,authority,weight,summary};
  }

  function buildSocialPerception(npc=null){
    normalizeCharacterPowerData();
    const c=state.character,k=currentKingdom(),eq=visibleEquipment(c),height=parseHeightInches(c.height);
    const gearWealth=eq.reduce((sum,x)=>sum+itemWealthScore(x.item,c),0),gearThreat=eq.reduce((sum,x)=>sum+itemThreatScore(x.item,c),0);
    const significance=equipmentSignificanceSummary(c,eq),semantic=combinedSemanticOverview(npc);
    const bodyThreat={Slight:-8,Lean:-4,Average:0,Athletic:6,Broad:8,Muscular:13,Massive:19}[c.build]||0;
    const heightThreat=height?clamp(Math.round((height-68)*1.35),-12,25):0;
    const apparentWealth=clamp(Math.round(gearWealth+(c.renown||0)*.2+(c.background==='Noble'?15:0)+semantic.prestige*.18+semantic.weight*.08),0,100);
    const effectiveTraits=(c.specialTraits||[]).map((t,i)=>effectiveAuraProfile(t,i)).filter(x=>x.effective_manifestation!=='hidden');
    const traitMagnitude=Math.max(0,...effectiveTraits.map(x=>x.effective_score));
    const intimidation=clamp(Math.round(20+(c.stats?.str||8)*1.4+bodyThreat+heightThreat+gearThreat*.4+significance.highest_score*.22+traitMagnitude*.18+(c.infamy||0)*.35+semantic.danger*.24+semantic.dread*.22+semantic.weight*.12),0,100);
    const prestige=clamp(Math.round((c.renown||0)*.7+apparentWealth*.3+significance.highest_score*.28+traitMagnitude*.12+(currentKingdom()?.playerRep||0)*.2+semantic.prestige*.24+semantic.sacred*.16+semantic.authority*.16),0,100);
    const attitude=raceAttitudeFor(k,c.race),policy=racePolicyFromScore(attitude),deviation=raceDeviationProfile(c,eq);
    const visiblyArmed=eq.some(x=>['mainHand','offHand'].includes(x.slot)&&/sword|dagger|knife|bow|axe|mace|spear|hammer|crossbow|staff|blade|cleaver/.test(String(x.item).toLowerCase()));
    let threat=perceptionThreatLabel(deviation.expectation.physical,deviation.anomaly_score,intimidation);
    if(significance.highest_score>=90||traitMagnitude>=92||semantic.weight>=92)threat='extreme';
    else if(significance.highest_score>=75||traitMagnitude>=78||semantic.weight>=75)threat=['low','ordinary','elevated'].includes(threat)?'high':threat;
    let guard='routine';
    if(significance.highest_score>=90||traitMagnitude>=92||semantic.weight>=88)guard='do not treat this as an ordinary armed traveller; maintain distance, avoid casual confiscation or provocation, alert a superior and consider calling clergy, mages or elite support depending on what is visibly carried or emanated';
    else if(significance.highest_score>=75||traitMagnitude>=78||semantic.weight>=70)guard='treat the player as an exceptional threat or high-status supernatural figure; keep tactical distance, summon senior support and avoid assuming normal guard numbers are sufficient';
    else if(significance.highest_score>=48||semantic.weight>=40)guard='recognise elite or extraordinary equipment; approach cautiously and assume the wearer may be a highly capable warrior or unusual specialist';
    else if(significance.highest_score>=25||semantic.weight>=22)guard='notice costly or serious martial equipment; remain professional and more cautious than with an unarmed common traveller';
    else if(policy==='kill_on_sight')guard=threat==='extreme'||threat==='high'?'raise the alarm, keep distance, form a defensive line and attack with support':'attack on recognition';
    else if(policy==='hostile')guard=threat==='extreme'||threat==='high'?'avoid a lone confrontation; level weapons, call reinforcements and issue commands from distance':visiblyArmed?'armed confrontation likely':'detain, expel or challenge';
    else if(policy==='restricted')guard=threat==='extreme'||threat==='high'?'block entry cautiously, summon a superior and avoid provoking the unusually dangerous outsider':'challenge entry and demand justification/disarmament';
    else if(policy==='distrusted')guard=threat==='extreme'||threat==='high'?'watch intensely, keep tactical distance and quietly alert other guards':'watch closely and question if suspicious';
    else if(k.culture?.armedEntry==='strict'&&visiblyArmed)guard='demand ordinary weapons be surrendered or peace-bonded, unless visible power makes direct enforcement unsafe';
    else if(k.culture?.armedEntry==='regulated'&&visiblyArmed)guard='notice weapons and question purpose';
    const base={height:c.height,build:c.build,appearance:c.appearance,apparent_wealth:apparentWealth,apparent_wealth_label:apparentWealth>=80?'extremely wealthy / elite':apparentWealth>=55?'wealthy':apparentWealth>=35?'comfortable':apparentWealth>=18?'modest':'poor',intimidation,intimidation_label:intimidation>=90?'overwhelming':intimidation>=75?'extreme':intimidation>=60?'high':intimidation>=40?'noticeable':'low',prestige,visible_weapons:visiblyArmed,visibly_injured:(c.injuries||[]).length>0,local_race_attitude:attitude,local_race_policy:policy,expected_guard_reaction:guard,race_expectation:deviation.expectation,racial_deviations:deviation.deviations,racial_anomaly_score:deviation.anomaly_score,racial_anomaly_category:deviation.anomaly_category,perceived_threat:threat,demonic_traits:deviation.demonic,magical_signs:deviation.magical,equipment_significance:significance,visible_supernatural_magnitude:traitMagnitude,semantic_signals:semantic,visible_description_weight:semantic.weight};
    base.synthesized_impression=synthesizeVisibleImpression(npc,base);
    base.npc_specific=npc?socialPerceptionForNpc(npc,base):null;
    return base;
  }

  function socialPerceptionForNpc(npc,base=null){
    ensureNpcDeepProfile(npc);
    const p=base||buildSocialPerception();
    const a=npc.socialAxes,attitude=Number(p.local_race_attitude??0),wealth=Number(p.apparent_wealth??0),anomaly=Number(p.racial_anomaly_score||0);
    const rep=layeredReputationForNpc(npc),recognition=recognitionForNpc(npc),visible=playerVisibleIdentity();
    const equipmentSignals=equipmentObservationsForNpc(npc),traitSignals=observableTraitsForNpc(npc),semantics=p.semantic_signals||combinedSemanticOverview(npc);
    const synthesized=synthesizeVisibleImpression(npc,p,equipmentSignals,traitSignals),novelty=synthesized.novelty;
    const slotTotals=equipmentSignals.reduce((o,x)=>{o.fear+=x.slot_reaction?.fear||0;o.respect+=x.slot_reaction?.respect||0;o.suspicion+=x.slot_reaction?.suspicion||0;o.curiosity+=x.slot_reaction?.curiosity||0;return o;},{fear:0,respect:0,suspicion:0,curiosity:0});
    const powerSignal=Math.max(0,...equipmentSignals.map(x=>x.significance_score),...traitSignals.map(x=>x.apparent_score),semantics.weight||0,synthesized.score||0);
    let fear=Math.max(a.fear,Math.round(Number(p.intimidation||0)*.55))+Math.round(slotTotals.fear*.45);
    let respect=Math.max(a.respect,Math.round(Number(p.prestige||0)*.45)+Math.round(rep.known_weighted*.18))+Math.round(slotTotals.respect*.45);
    let suspicion=Math.max(a.suspicion,Math.max(0,Math.round(-attitude*.55)))+Math.round(slotTotals.suspicion*.38);
    let curiosity=Math.round(anomaly*.25)+Math.round(slotTotals.curiosity*.5);
    const occ=String(npc.occupation||'').toLowerCase(),person=String(npc.personality||'').toLowerCase();
    fear+=Math.round((semantics.fear||0)*.35)+Math.round((semantics.dread||0)*.25);respect+=Math.round((semantics.prestige||0)*.32)+Math.round((semantics.sacred||0)*.18)+Math.round((semantics.authority||0)*.18);suspicion+=Math.round((semantics.suspicion||0)*.28);curiosity+=Math.round((semantics.curiosity||0)*.35)+Math.round((semantics.magic||0)*.18);
    // Familiarity primarily dampens surprise/curiosity, not the real tactical threat.
    curiosity=Math.round(curiosity*novelty);
    let likelyReaction=synthesized.summary||'assess the stranger according to visible evidence, power and personal goals';
    if(/guard|watch|warden|soldier/.test(occ)){
      suspicion+=15;if(visible.visible_weapons.length)suspicion+=12;fear+=Math.round(anomaly*.18);
      if(powerSignal>=90)likelyReaction='keep distance, avoid routine weapon seizure, alert senior command and seek specialised support rather than casually challenging the player';
      else if(powerSignal>=65)likelyReaction='maintain tactical caution and call additional guards or a superior before escalating';
      else if(powerSignal>=25)likelyReaction='treat the player as a serious armed warrior rather than an easy civilian encounter';
      else likelyReaction=p.expected_guard_reaction;
    }
    if(/merchant|trader|innkeeper/.test(occ)){respect+=Math.round(wealth*.2);if(powerSignal>=80)likelyReaction='recognise an almost priceless or incomprehensible display and become unusually careful about offence, theft and ability to pay';}
    if(/blacksmith|armourer|armorer|smith/.test(occ)){curiosity+=powerSignal>=60?35:15;likelyReaction=powerSignal>=90?'professional disbelief: the craftsmanship/power exceeds anything this NPC reasonably expects to encounter':powerSignal>=55?'intense professional interest in extraordinary workmanship':'assess materials, wear and quality';}
    if(/noble|court|official/.test(occ)){respect+=Math.round(p.prestige*.2);suspicion+=Math.round(anomaly*.1);likelyReaction=powerSignal>=80?'treat the display as politically or religiously significant, questioning what patron, power or authority could explain it':anomaly>=45?'assess status, patronage, heraldry and political implications':'judge rank, etiquette and affiliation';}
    if(/mage|scholar|scribe|alchemist/.test(occ)){curiosity+=Math.round(anomaly*.3)+(p.magical_signs?20:0)+(powerSignal>=65?25:0);likelyReaction=powerSignal>=90?'profound intellectual or magical shock; this exceeds ordinary scholarly expectations':powerSignal>=55?'careful study of exceptional supernatural signatures':'observe unusual details others may miss';}
    if(/priest|cleric|paladin|templar|monk/.test(occ)&&traitSignals.some(x=>x.signal==='holy / celestial')){const holy=Math.max(...traitSignals.filter(x=>x.signal==='holy / celestial').map(x=>x.apparent_score));respect+=Math.round(holy*.25);fear+=Math.round(holy*.1);likelyReaction=holy>=90?'religious awe, doctrinal shock or reverence is plausible; the NPC may hesitate to treat the player as an ordinary mortal':holy>=65?'strong religious recognition and respect':'notice a sacred quality';}
    if(/thief|criminal|bandit|smuggler/.test(occ))likelyReaction=powerSignal>=60||fear>=55?'conclude this is a dangerously poor robbery target despite visible wealth':'assess the player as a possible mark';
    if(/farmer|peasant|labour|labor|beggar/.test(occ)&&powerSignal>=80)likelyReaction='ordinary experience offers little frame of reference; awe, fear, staring, retreat, prayer or disbelief are plausible';
    if(/nervous|wary/.test(person))fear+=12;if(/proud|reckless/.test(person))fear-=8;
    a.fear=clamp(Math.round((a.fear*2+fear)/3),0,100);a.respect=clamp(Math.round((a.respect*2+respect)/3),0,100);a.suspicion=clamp(Math.round((a.suspicion*2+suspicion)/3),0,100);a.trust=clamp(a.trust,0,100);updateNpcEmotion(npc,'current social situation');
    return {fear:a.fear,respect:a.respect,suspicion:a.suspicion,trust:a.trust,curiosity:clamp(curiosity,0,100),likely_reaction:likelyReaction,recognised_identity:recognition.recognised,recognised_as:recognition.identity,recognition_confidence:recognition.confidence,visible_identity:visible.display_identity,visible_race:visible.apparent_race,reputation_known:rep,highest_observable_power:powerSignal,equipment_observations:equipmentSignals,supernatural_observations:traitSignals,semantic_overview:semantics,synthesized_impression:synthesized,familiarity:{exposure_count:synthesized.exposure_count,novelty:synthesized.novelty,novelty_label:synthesized.novelty_label},instruction:synthesized.reaction_instruction};
  }

  function npcForAiV415(n){
    ensureNpcDeepProfile(n);
    const f=factionById(n.factionId),per=buildSocialPerception(n).npc_specific,rank=n.socialRank,playerRank=playerRankEstimate();
    ensureNpcRelationshipData(n);return {id:n.id,name:n.name,occupation:n.occupation,personality:n.personality,relationship:n.relationship,faction:f?.name||null,faction_id:n.factionId||null,companion:!!n.companion,dead:!!n.dead,memory:compactArray(n.memory||[],6),interaction_summary:npcJournalSummary(n),perception_of_player:per,equipment_observations:per.equipment_observations,supernatural_observations:per.supernatural_observations,synthesized_impression:per.synthesized_impression,visual_profile:ensureNpcVisualProfile(n),body_language:bodyLanguageForNpc(n),emotion:n.emotion,goals:n.goals,social_axes:{...n.socialAxes},romance:romanceForAi(n),social_rank:rank,hierarchy_context:{npc_rank_score:rank.score,player_apparent_rank_score:playerRank,relation:playerRank>=rank.score+20?'player appears substantially higher status':playerRank+20<=rank.score?'NPC appears substantially higher status':'roughly comparable apparent status'},languages:n.languages,heraldry_interpretation:visibleHeraldryForNpc(n),knowledge:npcKnowledgeForAi(n),secrets:{public:n.secrets.public,private_instruction:'Private/secret fields are narrator truth, not automatically known to the player. Reveal only through behaviour, discovery, confession or justified inference.',private:n.secrets.private,secret:n.secrets.secret,current_cover_story:n.secrets.cover_story}};
  }

  function capabilitySupportForAction(actionText){
    const t=String(actionText||'').toLowerCase();
    const stop=new Set(['with','from','into','onto','that','this','then','them','their','there','have','using','through','toward','towards','about','against','around','after','before','while','where','when','will','would','could','should','your','mine','myself']);
    const words=t.split(/\W+/).filter(w=>w.length>=4&&!stop.has(w));
    normalizeCharacterPowerData();
    const sources=[];
    for(const skill of skillProfilesForAi(state.character)){const hay=`${skill.name} ${skill.description}`.toLowerCase();if(words.some(w=>hay.includes(w)))sources.push({type:'skill',name:skill.name,description:skill.description,potency:skill.potency,score:skill.potency_score});}
    for(const trait of specialTraitTruthForAi(state.character)){const hay=`${trait.name} ${trait.description} ${trait.classified_signal} ${(trait.semantic_tags||[]).join(' ')}`.toLowerCase();if(words.some(w=>hay.includes(w)))sources.push({type:'trait',name:trait.name,description:trait.description,potency:trait.magnitude,score:trait.effective_score||trait.magnitude_score});}
    for(const item of itemProfilesForAi(state.character)){
      const hay=`${item.name} ${item.description} ${(item.semantic_tags||[]).join(' ')}`.toLowerCase();
      const explicitlyNamed=t.includes(String(item.name||'').toLowerCase());
      const semanticMatch=words.some(w=>hay.includes(w));
      if(explicitlyNamed||semanticMatch)sources.push({type:'equipment-description',name:item.name,description:item.description,potency:item.power_tier,score:Math.max(item.power_score||0,item.social_weight||0)});
    }
    const eq=actionWeaponInfo(actionText);if(eq.item&&!sources.some(x=>x.name===eq.item))sources.push({type:'equipment',name:eq.item,description:eq.profile?.desc||'',potency:eq.profile?.tierData?.label||'Mundane',score:eq.power_score});
    return sources.sort((a,b)=>b.score-a.score).slice(0,5);
  }

  function maybeAmbientPresenceReaction(perception=buildSocialPerception()){
    const g=state.game;if(!g||!['town','outskirts'].includes(g.areaType))return;
    const imp=perception.synthesized_impression||synthesizeVisibleImpression(null),score=imp.score||0;
    if(score<62)return;
    g.spectacleMarkers ||= {};
    const key=`${currentLocationKey()}:${state.world.day}:${perceptionSignature(null)}`;
    if(g.spectacleMarkers[key])return;
    g.spectacleMarkers[key]=true;
    let text='People nearby begin to notice you more than they would an ordinary traveller.';
    if(score>=92)text=`Your presence is impossible to fold into the normal rhythm of ${g.location}. Conversations falter, people give you room, and more than one observer simply stops to stare. ${imp.summary}`;
    else if(score>=78)text=`Your arrival draws a visible ripple through the people nearby: second looks, lowered voices and deliberate extra distance. ${imp.summary}`;
    else text=`You attract sustained attention as you move through ${g.location}. ${imp.summary}`;
    addLog(`<strong>Ambient reaction:</strong> ${escapeHtml(text)}`,'event');
    if(score>=80){
      const witnesses=plausibleWitnesses();
      createRumour(`${state.character.name} was seen in ${g.location}, presenting as ${imp.label}.`,{source:'local eyewitnesses',reliability:78,witnessIds:witnesses,severity:Math.max(5,Math.round(score/8))});
    }
  }

  function aiWorldSnapshotV412(){
    ensureV4Data();ensureV46Data();
    const c=state.character,g=state.game,w=state.world,k=currentKingdom(),participants=getConversationNpcs(),focus=participants.find(n=>n.id===g.conversationFocusId)||g.activeNpc||participants[0]||null;
    const localFactions=(w.factions||[]).filter(f=>f.kingdomId===k.id).slice(0,5),activeQuests=(w.quests||[]).filter(q=>q.status==='active').slice(0,4),d=dynastyForKingdom(k.id),perception=buildSocialPerception(),visible=playerVisibleIdentity();
    return {game_rules:{world_magic_level:state.worldConfig.magic,world_danger_level:state.worldConfig.danger,political_climate:state.worldConfig.politics,player_controls_own_choices:true,permanent_injuries_enabled:true,appearance_affects_social_reactions:true,race_policy_is_simulation_fact:true,group_conversations_enabled:true,npc_knowledge_is_limited:true,hidden_player_information_must_not_leak:true,rumours_can_be_false:true,scene_changes_persist:true,slot_specific_equipment_reactions:true,aura_intensity_is_dynamic:true,combined_impression_is_canonical:true,romance_system_enabled:true,npc_codex_enabled:true},player_truth_for_narrator_only:{name:c.name,sex:c.sex,age:c.age,race:c.race,race_description:c.raceProfile?.description||'',background:c.background,class:c.className,level:c.level,stats:c.stats,full_appearance:{height:c.height,build:c.build,description:c.appearance},full_equipment:{...(c.equipment||{})},equipment_definitions:itemProfilesForAi(c),special_traits_and_auras:specialTraitTruthForAi(c),skill_definitions:skillProfilesForAi(c),injuries:c.injuries||[],gold:c.gold,renown:c.renown||0,infamy:c.infamy||0,languages:c.languages,instruction:'Narrator may know this. Descriptions remain canonical. Aura control changes current manifestation, not underlying true power.'},player_visible_to_npcs:{...visible,equipped_with_condition:visible.visible_gear,equipment_significance:equipmentSignificanceSummary(c,visibleEquipment(c)),local_social_perception:perception,synthesized_impression:perception.synthesized_impression,apparent_rank_score:playerRankEstimate(),description_signal_summary:perception.semantic_signals,instruction:'React to the whole visible package, not isolated fields. Slot, race contradiction, current aura intensity, weapon, armour and description-driven cues should be synthesized.'},player_mechanics:{hp:{current:c.hp,max:c.maxHp},mana:{current:c.mana||0,max:c.maxMana||0},skills:skillProfilesForAi(c).slice(0,16),spells:(c.spells||[]).map(id=>spellById(id)).filter(Boolean).map(s=>({name:s.name,school:s.school,tier:s.tier,cost:s.cost})),companions:(c.companions||[]).filter(x=>x.active!==false).map(x=>({name:x.name,role:x.role,hp:x.hp,maxHp:x.maxHp,loyalty:x.loyalty,morale:x.morale}))},reputation_layers:{local:c.reputationLayers.local[currentLocationKey()]||0,kingdom:c.reputationLayers.kingdom[g.kingdomId]??k.playerRep??0,underworld:c.reputationLayers.underworld||0,legendary:c.reputationLayers.legendary||0,instruction:'Do not assume reputation is globally known.'},location_visual_context:locationVisualContext(),persistent_scene_state:sceneStateForAi(),scene:{world:w.name,date:`${w.day} ${w.season}, ${w.year}`,time:g.time,location:g.location,area_type:g.areaType,legal_status:legalStatus(),heat:currentHeat(),bounty:currentBounty(),local_race_policy:perception.local_race_policy,expected_guard_reaction:perception.expected_guard_reaction,dungeon:g.dungeonRun?{name:activeDungeon()?.name||'Unknown',chamber:(g.dungeonRun.roomIndex||0)+1,depth:activeDungeon()?.depth||null}:null,combat:g.combat?{enemy:g.combat.name,level:g.combat.level,hp:g.combat.hp,maxHp:g.combat.maxHp,statuses:g.combat.statuses||[],context:g.combat.context}:null},conversation:{focus_npc_id:focus?.id||null,focus_npc_name:focus?.name||null,participant_count:participants.length,participants:participants.map(n=>npcForAi(n)),group_dynamics:conversationDynamics(participants),turn_taking:turnTakingForConversation(participants),instruction:participants.length>1?'This is a group conversation. Preserve turn-taking and do not make everyone speak.':'Single-NPC conversation.'},player_perception_check:g.lastPerceptionResult,anti_repetition:antiRepetitionForAi(),kingdom:{id:k.id,name:k.name,ruler:`${k.rulerTitle} ${k.ruler}`,capital:k.capital,prosperity:k.prosperity,stability:k.stability,player_reputation:k.playerRep||0,wars:(k.wars||[]).map(id=>kingdomById(id)?.name||id),culture:{race_attitudes:{...(k.culture?.raceAttitudes||{})},armed_entry:k.culture?.armedEntry||'regulated',outsider_tolerance:k.culture?.outsiderTolerance||50},politics:k.politics?{crown_authority:k.politics.crownAuthority,noble_power:k.politics.noblePower,popular_support:k.politics.popularSupport,unrest:Math.round(k.politics.unrest),policy:k.politics.policy}:null,dynasty:d?{house:d.houseName,ruler:d.ruler,heirs:d.heirs?.slice(0,5),succession_law:d.successionLaw}:null},local_factions:localFactions.map(f=>({id:f.id,name:f.name,type:f.type,player_reputation:f.playerRep,joined:!!f.joined,power:f.power})),active_quests:activeQuests.map(q=>({id:q.id,title:q.title,description:q.description,progress:q.progress,goal:q.goal,faction_id:q.factionId})),recent_world_events:compactArray(w.events||[],4).map(e=>({date:e.date,text:e.text})),recent_story:compactArray(g.log||[],7).map(e=>stripHtml(e.text)),recent_ai_memory:compactArray(g.aiHistory||[],6)};
  }


  // ============================================================
  // V4.12 — NPC CODEX & RELATIONSHIPS
  // ============================================================

  function ensureNpcRelationshipData(npc){
    if(!npc)return npc;
    const seed=seeded(`${state.world?.seed||"world"}-npc-rel-${npc.id||npc.name||"unknown"}`);
    npc.age = Number(npc.age)||randInt(20,58,seed);
    npc.met ??= !!(npc.memory?.length || npc.companion || npc.firstImpression);
    npc.firstMet ||= null;
    npc.lastSeen ||= null;
    npc.meetingCount ||= 0;
    npc.interactionHistory = Array.isArray(npc.interactionHistory)?npc.interactionHistory:[];
    npc.journalPinned ??= false;

    if(!npc.romance || typeof npc.romance!=="object"){
      const opennessRoll=randInt(1,100,seed);
      const openness=opennessRoll<=7?"unavailable":opennessRoll<=30?"guarded":"open";
      npc.romance={
        state:"none",
        attraction:clamp(randInt(5,24,seed)+Math.floor((state.character?.stats?.cha||8)/4),0,100),
        affection:clamp(Math.max(0,Math.round((npc.relationship||0)*.22)),0,100),
        chemistry:randInt(25,82,seed),
        commitment:0,
        openness,
        availabilityKnown:false,
        lastRomanceTurn:-1
      };
    }
    npc.romance.state ||= "none";
    npc.romance.attraction=clamp(Number(npc.romance.attraction)||0,0,100);
    npc.romance.affection=clamp(Number(npc.romance.affection)||0,0,100);
    npc.romance.chemistry=clamp(Number(npc.romance.chemistry)||50,0,100);
    npc.romance.commitment=clamp(Number(npc.romance.commitment)||0,0,100);
    npc.romance.openness ||= "open";
    npc.romance.availabilityKnown ??= false;
    return npc;
  }

  function romanceSystemAvailable(npc){
    ensureNpcRelationshipData(npc);
    return Number(state.character?.age||0)>=18 && Number(npc.age||0)>=18 && !npc.dead;
  }

  function romanceStateLabel(stateName){
    const map={
      none:"No romance",
      interested:"Mutual interest",
      courting:"Courting",
      partner:"Partners",
      committed:"Committed partners",
      ended:"Former romance"
    };
    return map[stateName]||titleCase(stateName||"none");
  }

  function relationshipSummaryLabel(npc){
    ensureNpcRelationshipData(npc);
    if(npc.dead)return "Deceased";
    if(npc.relationship>=70)return "Deeply trusted";
    if(npc.relationship>=45)return "Close";
    if(npc.relationship>=20)return "Friendly";
    if(npc.relationship>=-10)return "Neutral";
    if(npc.relationship>=-40)return "Strained";
    if(npc.relationship>=-70)return "Hostile";
    return "Enemy";
  }

  function markNpcMet(npc,context="met"){
    if(!npc)return;
    ensureNpcRelationshipData(npc);
    const now={day:state.world?.day||0,season:state.world?.season||"",year:state.world?.year||0,turn:state.game?.turn||0,location:state.game?.location||npc.location||"Unknown",kingdomId:state.game?.kingdomId||npc.kingdomId||null};
    if(!npc.met){
      npc.met=true;
      npc.firstMet={...now,context};
      recordNpcInteraction(npc,`You first met ${npc.name} at ${now.location}.`,"met",false);
    }
    npc.lastSeen={...now,context};
    npc.meetingCount=(npc.meetingCount||0)+1;
  }

  function recordNpcInteraction(npc,text,category="general",dedupe=true){
    if(!npc)return;
    ensureNpcRelationshipData(npc);
    npc.interactionHistory ||= [];
    const clean=String(text||"").trim().slice(0,260);
    if(!clean)return;
    if(dedupe && npc.interactionHistory.some(x=>x.text===clean && x.day===state.world?.day))return;
    npc.interactionHistory.push({
      day:state.world?.day||0,
      season:state.world?.season||"",
      year:state.world?.year||0,
      turn:state.game?.turn||0,
      location:state.game?.location||npc.location||"Unknown",
      category,
      text:clean
    });
    if(npc.interactionHistory.length>30)npc.interactionHistory.splice(0,npc.interactionHistory.length-30);
  }

  function humaniseNpcMemory(npc,text){
    let s=String(text||"");
    s=s.replace(/\bThe player\b/gi,"You").replace(/\bthe player\b/gi,"you");
    if(/^I\b/.test(s))s=s.replace(/^I\b/,npc.name);
    return s;
  }

  // Final V4.12 memory function: every durable NPC memory also feeds the journal.
  function addNpcMemoryV415(npc,text,meta={}){
    if(!npc)return;
    ensureNpcDeepProfile(npc);
    markNpcMet(npc,"memory");
    npc.memory ||= [];
    npc.memory.push({
      day:state.world.day,text:String(text).slice(0,180),
      source:meta.source||"direct experience",
      confidence:clamp(Number(meta.confidence??95),5,100)
    });
    if(npc.memory.length>12)npc.memory.shift();
    recordNpcInteraction(npc,humaniseNpcMemory(npc,text),meta.category||"memory");
    if(meta.propagate!==false)shareNpcMemoryWithPresent(npc,text);
  }

  function metNpcList(){
    const list=(state.world?.npcs||[]).filter(n=>{
      ensureNpcRelationshipData(n);
      return n.met;
    });
    return list.sort((a,b)=>{
      if(!!b.journalPinned!==!!a.journalPinned)return b.journalPinned?1:-1;
      return Number(b.lastSeen?.turn??-1)-Number(a.lastSeen?.turn??-1);
    });
  }

  function npcJournalSummary(npc){
    ensureNpcRelationshipData(npc);
    const history=(npc.interactionHistory||[]).slice(-5);
    if(!history.length){
      return npc.firstMet?`Met at ${npc.firstMet.location}. No major shared events recorded yet.`:"No shared history recorded yet.";
    }
    const categories=new Set(history.map(x=>x.category));
    const bits=[];
    if(categories.has("help"))bits.push("you have helped them");
    if(categories.has("hostility"))bits.push("there has been conflict or intimidation");
    if(categories.has("work"))bits.push("you have discussed work or contracts");
    if(categories.has("romance"))bits.push("your relationship has had a romantic element");
    if(categories.has("combat"))bits.push("you have fought");
    if(!bits.length)bits.push("you have spoken and built shared memories");
    return `${bits.join("; ")}. Latest: ${history[history.length-1].text}`;
  }

  function romanceForAi(npc){
    ensureNpcRelationshipData(npc);
    const r=npc.romance;
    return {
      enabled:romanceSystemAvailable(npc),
      state:r.state,
      attraction:r.attraction,
      affection:r.affection,
      chemistry:r.chemistry,
      commitment:r.commitment,
      openness:r.openness,
      player_age:state.character?.age,
      npc_age:npc.age,
      instruction:"Romance is mutual, gradual and consent-based. Do not force feelings, physical affection or commitment. Either party can hesitate or refuse. Only adult characters may participate."
    };
  }

  function applyRomanceIntent(npc,kind,amount,reason="romantic interaction"){
    ensureNpcRelationshipData(npc);
    if(!romanceSystemAvailable(npc))return;
    const r=npc.romance;
    const amt=clamp(Number(amount)||0,-12,12);
    if(kind==="attraction"||kind==="flirt"){
      r.attraction=clamp(r.attraction+amt,0,100);
      r.affection=clamp(r.affection+Math.round(amt*.4),0,100);
    }else if(kind==="affection"){
      r.affection=clamp(r.affection+amt,0,100);
      r.attraction=clamp(r.attraction+Math.round(amt*.25),0,100);
    }else if(kind==="commitment"){
      r.commitment=clamp(r.commitment+amt,0,100);
    }else if(kind==="breakup"){
      r.state="ended";r.commitment=0;r.affection=clamp(r.affection-18,0,100);
    }
    if(r.state==="none" && r.attraction>=38 && r.affection>=24)r.state="interested";
    if(r.state==="interested" && r.affection>=55 && r.attraction>=48 && r.commitment>=20)r.state="courting";
    if(r.state==="courting" && r.affection>=72 && r.attraction>=55 && r.commitment>=48)r.state="partner";
    if(r.state==="partner" && r.affection>=85 && r.commitment>=78)r.state="committed";
    r.lastRomanceTurn=state.game?.turn||0;
    recordNpcInteraction(npc,reason,"romance");
  }

  function romanceRoll(npc,mode="flirt"){
    ensureNpcRelationshipData(npc);
    const r=npc.romance,axes=npc.socialAxes||{};
    const cha=Number(state.character?.stats?.cha||8);
    let score=randInt(1,20)+Math.floor(cha/3)+Math.floor((axes.trust||0)/14)+Math.floor((r.chemistry||0)/18)+Math.floor((npc.relationship||0)/18)-Math.floor((axes.fear||0)/20);
    if(r.openness==="guarded")score-=3;
    if(r.openness==="unavailable")score-=20;
    if(mode==="court")score+=Math.floor(r.attraction/15)+Math.floor(r.affection/15)-10;
    if(mode==="partner")score+=Math.floor(r.commitment/18)+Math.floor(r.affection/16)-14;
    return score;
  }

  function attemptNpcFlirt(npc){
    if(!romanceSystemAvailable(npc)){
      addLog(`Romance is only available between adult characters.`,"system");return;
    }
    const r=npc.romance;
    r.availabilityKnown=true;
    if(r.openness==="unavailable"){
      addLog(`${escapeHtml(npc.name)} understands the flirtation but does not reciprocate it. They steer the conversation away from romance without treating the refusal as hostility.`);
      recordNpcInteraction(npc,"You flirted, but they made it clear they were not open to romance.","romance");
      return;
    }
    const roll=romanceRoll(npc,"flirt");
    if(roll>=18){
      const gain=clamp(5+Math.floor((r.chemistry||50)/15),5,11);
      r.attraction=clamp(r.attraction+gain,0,100);
      r.affection=clamp(r.affection+Math.max(2,Math.floor(gain*.6)),0,100);
      npc.relationship=clamp(npc.relationship+2,-100,100);
      if(r.state==="none"&&r.attraction>=38&&r.affection>=24)r.state="interested";
      addLog(`${escapeHtml(npc.name)} catches the intent behind your words and responds rather than brushing it aside. The exchange gains a more personal edge, though nothing is assumed beyond what either of you has actually expressed.`);
      addNpcMemory(npc,"The player flirted with me and I responded positively.",{category:"romance"});
    }else{
      r.attraction=clamp(r.attraction-2,0,100);
      addLog(`${escapeHtml(npc.name)} notices the flirtation, but the moment does not quite land. They remain polite and let the conversation move on.`);
      addNpcMemory(npc,"The player flirted with me, but I did not strongly reciprocate.",{category:"romance"});
    }
    r.lastRomanceTurn=state.game.turn;
  }

  function attemptNpcCourtship(npc){
    if(!romanceSystemAvailable(npc)){addLog(`Romance is only available between adult characters.`,"system");return;}
    const r=npc.romance,axes=npc.socialAxes||{};
    r.availabilityKnown=true;
    if(r.openness==="unavailable"){
      addLog(`${escapeHtml(npc.name)} declines. Whatever warmth exists between you, they do not want a courtship.`);
      return;
    }
    if(r.attraction<38 || r.affection<35 || (axes.trust||0)<45 || npc.relationship<15){
      addLog(`${escapeHtml(npc.name)} does not dismiss you cruelly, but the relationship is not yet close or trusting enough for them to agree to a courtship.`);
      recordNpcInteraction(npc,"You asked about courting before the relationship was ready.","romance");return;
    }
    const roll=romanceRoll(npc,"court");
    if(roll>=20){
      r.state="courting";r.commitment=clamp(r.commitment+24,0,100);r.affection=clamp(r.affection+6,0,100);npc.relationship=clamp(npc.relationship+5,-100,100);
      addLog(`<strong>${escapeHtml(npc.name)} agrees to court you.</strong> It is an actual relationship change, not just flavour dialogue.`,"event");
      addNpcMemory(npc,"The player asked to court me and I agreed.",{category:"romance"});
    }else{
      addLog(`${escapeHtml(npc.name)} hesitates and says they are not ready to call this a courtship yet.`);
      recordNpcInteraction(npc,"You asked to court them, but they were not ready.","romance");
    }
  }

  function attemptNpcPartnership(npc){
    if(!romanceSystemAvailable(npc)){addLog(`Romance is only available between adult characters.`,"system");return;}
    const r=npc.romance,axes=npc.socialAxes||{};
    if(r.state!=="courting"){
      addLog(`${escapeHtml(npc.name)} is not currently courting you, so asking for a committed partnership would be premature.`);return;
    }
    if(r.affection<65 || r.attraction<50 || r.commitment<35 || (axes.trust||0)<60){
      addLog(`${escapeHtml(npc.name)} cares about you, but does not feel ready to make the relationship more serious yet.`);return;
    }
    const roll=romanceRoll(npc,"partner");
    if(roll>=22){
      r.state="partner";r.commitment=clamp(r.commitment+20,0,100);r.affection=clamp(r.affection+8,0,100);npc.relationship=clamp(npc.relationship+6,-100,100);
      addLog(`<strong>${escapeHtml(npc.name)} agrees that you are partners.</strong>`,"event");
      addNpcMemory(npc,"We agreed to become romantic partners.",{category:"romance"});
    }else{
      addLog(`${escapeHtml(npc.name)} does not reject the relationship, but asks for more time before making that commitment.`);
    }
  }

  function spendRomanticTime(npc){
    if(!romanceSystemAvailable(npc) || !["partner","committed","courting"].includes(npc.romance.state)){
      addLog(`There is not an established romantic relationship to deepen yet.`);return;
    }
    const r=npc.romance;
    const gain=randInt(3,7);
    r.affection=clamp(r.affection+gain,0,100);
    r.commitment=clamp(r.commitment+Math.max(1,Math.floor(gain*.7)),0,100);
    npc.relationship=clamp(npc.relationship+3,-100,100);
    if(r.state==="partner"&&r.affection>=85&&r.commitment>=78)r.state="committed";
    addLog(`You spend unhurried time with ${escapeHtml(npc.name)}, letting the relationship develop through actual shared attention rather than a single dialogue flag.`);
    addNpcMemory(npc,"The player deliberately spent personal time with me and strengthened our relationship.",{category:"romance"});
  }

  function knownNpcAppearance(npc){
    const v=ensureNpcVisualProfile(npc);
    return `${v.apparent_age}, ${v.build}, ${v.face}; ${v.clothing}${v.visible_gear?.length?`; usually seen with ${v.visible_gear.join(", ")}`:""}`;
  }

  function peopleJournalCardV417(npc){
    ensureNpcDeepProfile(npc);
    const f=factionById(npc.factionId);
    const r=npc.romance;
    const hist=(npc.interactionHistory||[]).slice(-5).reverse();
    const last=npc.lastSeen;
    return `<article class="people-card ${npc.dead?"dead":""}">
      <div class="people-card-head">
        <div>
          <div class="eyebrow">${f?escapeHtml(f.name):"Independent"}${npc.companion?" • Companion":""}</div>
          <h3>${escapeHtml(npc.name)}</h3>
          <div class="character-sub">${escapeHtml(npc.occupation)} • Age ${npc.age} • ${escapeHtml(npc.personality)} • ${escapeHtml(updateNpcBond(npc))}</div>
        </div>
        <div class="people-status-stack">
          <span>${escapeHtml(relationshipSummaryLabel(npc))}</span>
          ${r.state!=="none"?`<span class="romance-tag">${escapeHtml(romanceStateLabel(r.state))}</span>`:""}
          ${npc.dead?`<span class="bad-tag">DEAD</span>`:""}
        </div>
      </div>
      <div class="people-facts-grid">
        <div><span>Relationship</span><strong>${npc.relationship}</strong></div>
        <div><span>Trust</span><strong>${npc.socialAxes?.trust??0}</strong></div>
        <div><span>Respect</span><strong>${npc.socialAxes?.respect??0}</strong></div>
        <div><span>Fear</span><strong>${npc.socialAxes?.fear??0}</strong></div>
        <div><span>Suspicion</span><strong>${npc.socialAxes?.suspicion??0}</strong></div>
        <div><span>Meetings</span><strong>${npc.meetingCount||1}</strong></div>
      </div>
      <p class="people-summary">${escapeHtml(npcJournalSummary(npc))}</p>
      <div class="people-known">
        <strong>Known information</strong>
        <p>${escapeHtml(knownNpcAppearance(npc))}</p>
        <p>Last known location: <strong>${escapeHtml(npc.schedule?.currentLocation||npc.location||last?.location||"Unknown")}</strong>${last?` • last seen day ${last.day}`:""}</p><p>Current routine: ${escapeHtml(npc.schedule?.activity||"unknown")} • Goal: ${escapeHtml(npc.lifeGoal?.text||"No known current goal")}</p>
      </div>
      ${hist.length?`<div class="people-history"><strong>Shared history</strong>${hist.map(h=>`<div><span>Day ${h.day}</span><p>${escapeHtml(h.text)}</p></div>`).join("")}</div>`:""}
      ${!npc.dead && npc.location===state.game.location && npc.kingdomId===state.game.kingdomId?`<button type="button" class="secondary-button" data-people-talk="${escapeHtml(npc.id)}">Approach ${escapeHtml(npc.name.split(" ")[0])}</button>`:""}
    </article>`;
  }

  function showPeopleJournal(initialFilter="all"){
    ensureV4Data();ensureV46Data();
    const wrap=document.createElement("div");
    wrap.className="modal-backdrop";
    let filter=initialFilter,query="",sortMode="recent";
    let searchTimer=null;

    const searchableText=n=>{
      ensureNpcDeepProfile(n);
      let bond="";
      try{bond=typeof updateNpcBond==="function"?updateNpcBond(n):"";}catch{}
      return [
        n.name,n.occupation,n.personality,
        n.location,n.schedule?.currentLocation,
        factionById(n.factionId)?.name,
        relationshipSummaryLabel(n),
        romanceStateLabel(n.romance?.state||"none"),
        bond,
        npcJournalSummary(n),
        ...(n.memory||[]).map(m=>m.text),
        ...(n.interactionHistory||[]).map(h=>h.text)
      ].filter(Boolean).join(" ").toLowerCase();
    };

    const filteredNpcs=()=>{
      const all=metNpcList();
      let out=all.filter(n=>{
        if(query&&!searchableText(n).includes(query.toLowerCase()))return false;
        if(filter==="close")return n.relationship>=35&&!n.dead;
        if(filter==="romance")return n.romance?.state!=="none"&&n.romance?.state!=="ended";
        if(filter==="companions")return !!n.companion&&!n.dead;
        if(filter==="hostile")return n.relationship<=-25&&!n.dead;
        if(filter==="dead")return !!n.dead;
        return true;
      });
      if(sortMode==="name")out.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
      else if(sortMode==="relationship")out.sort((a,b)=>(b.relationship||0)-(a.relationship||0));
      else if(sortMode==="location")out.sort((a,b)=>String(a.schedule?.currentLocation||a.location||"").localeCompare(String(b.schedule?.currentLocation||b.location||"")));
      else out.sort((a,b)=>Number(b.lastSeen?.turn??-1)-Number(a.lastSeen?.turn??-1));
      return {all,out};
    };

    const render=()=>{
      const {all,out}=filteredNpcs();

      wrap.innerHTML=`<div class="modal people-modal" role="dialog" aria-modal="true">
        <div class="ledger-head">
          <div>
            <div class="eyebrow">Persistent relationships</div>
            <h2>NPC Catalogue</h2>
            <p class="section-copy">Search by name, profession, faction, settlement, relationship or anything recorded in your shared history.</p>
          </div>
          <button class="ghost-button" id="peopleClose">Close</button>
        </div>

        <div class="npc-search-panel">
          <div class="npc-search-box">
            <span class="npc-search-icon" aria-hidden="true">⌕</span>
            <input class="input" id="peopleSearch" value="${escapeHtml(query)}" autocomplete="off"
              placeholder="Search NPCs — name, profession, faction, location, memory...">
            ${query?`<button type="button" class="ghost-button npc-clear-search" id="clearPeopleSearch">Clear</button>`:""}
          </div>
          <div class="npc-result-count">${out.length} of ${all.length} known NPC${all.length===1?"":"s"}</div>
        </div>

        <div class="people-toolbar npc-catalogue-toolbar">
          <div class="people-filters">
            ${["all","close","romance","companions","hostile","dead"].map(x=>`<button type="button" data-people-filter="${x}" class="${filter===x?"active":""}">${titleCase(x)}</button>`).join("")}
          </div>
          <label class="npc-sort-control">Sort
            <select id="peopleSort">
              <option value="recent" ${sortMode==="recent"?"selected":""}>Recently seen</option>
              <option value="name" ${sortMode==="name"?"selected":""}>Name</option>
              <option value="relationship" ${sortMode==="relationship"?"selected":""}>Relationship</option>
              <option value="location" ${sortMode==="location"?"selected":""}>Location</option>
            </select>
          </label>
        </div>

        <div class="people-list">${out.length
          ?out.map(peopleJournalCard).join("")
          :`<div class="npc-no-results"><strong>No NPCs found.</strong><p>Try a name, profession, faction, settlement or a word from your shared history.</p></div>`
        }</div>
      </div>`;

      wrap.querySelector("#peopleClose")?.addEventListener("click",()=>wrap.remove());

      wrap.querySelectorAll("[data-people-filter]").forEach(b=>b.addEventListener("click",()=>{
        filter=b.dataset.peopleFilter;render();
      }));

      const search=wrap.querySelector("#peopleSearch");
      search?.addEventListener("input",()=>{
        query=search.value;
        clearTimeout(searchTimer);
        searchTimer=setTimeout(()=>{
          render();
          const next=wrap.querySelector("#peopleSearch");
          next?.focus();
          try{next?.setSelectionRange(query.length,query.length);}catch{}
        },90);
      });

      wrap.querySelector("#clearPeopleSearch")?.addEventListener("click",()=>{
        query="";render();wrap.querySelector("#peopleSearch")?.focus();
      });

      wrap.querySelector("#peopleSort")?.addEventListener("change",e=>{
        sortMode=e.target.value;render();
      });

      wrap.querySelectorAll("[data-people-talk]").forEach(b=>b.addEventListener("click",()=>{
        const npc=findNpcById(b.dataset.peopleTalk);
        if(npc&&!npc.dead){
          startConversation(npc,1);
          addLog(`You seek out <strong>${escapeHtml(npc.name)}</strong> again.`,"event");
          wrap.remove();saveGame(false);renderGame();
        }
      }));
    };

    document.body.appendChild(wrap);
    wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});
    render();
  }

  function ensureReactiveCombatState(){
    const e=state.game?.combat;
    if(!e)return null;
    e.round ||= 0;
    e.allies = Array.isArray(e.allies)?e.allies:[];
    e.reinforcementQueue = Array.isArray(e.reinforcementQueue)?e.reinforcementQueue:[];
    e.helpRequests ||= {};
    e.alarmLevel ||= 0;
    e.maxReinforcements ??= 4;
    e.defeatedCount ||= 0;
    return e;
  }

  function combatPrimaryNpc(){
    const e=state.game?.combat;
    return e?.npcId?findNpcById(e.npcId):null;
  }

  function combatNpcCandidates(){
    const out=[];
    for(const n of getConversationNpcs())if(n&&!out.some(x=>x.id===n.id))out.push(n);
    const primary=combatPrimaryNpc();if(primary&&!primary.dead&&!out.some(x=>x.id===primary.id))out.unshift(primary);
    const e=state.game?.combat;
    for(const a of (e?.allies||[])){
      const n=a.npcId?findNpcById(a.npcId):null;
      if(n&&!n.dead&&!out.some(x=>x.id===n.id))out.push(n);
    }
    return out;
  }

  // V4.13 target resolver: combatants remain targetable even after dialogue state ends.
  function freeformTargetNpc(actionText){
    const t=String(actionText||'').toLowerCase();
    const list=combatNpcCandidates();
    for(const n of list){
      const full=String(n.name||'').toLowerCase();
      const first=full.split(/\s+/)[0];
      if((full&&t.includes(full))||(first&&new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`).test(t)))return n;
    }
    if(state.game?.combat){
      if(/\b(him|her|them|the guard|the captain|the enemy|my opponent|target|his|her)\b/.test(t)){
        return combatPrimaryNpc() || list[0] || {id:'__combat_primary__',name:state.game.combat.name,occupation:'opponent',relationship:-100,socialAxes:{fear:0,suspicion:70}};
      }
      return combatPrimaryNpc() || list[0] || {id:'__combat_primary__',name:state.game.combat.name,occupation:'opponent',relationship:-100,socialAxes:{fear:0,suspicion:70}};
    }
    return freeformTargetNpcV412(actionText);
  }

  function combatantRecordForNpcId(npcId){
    const e=ensureReactiveCombatState();
    if(!e)return null;
    if(!npcId || npcId==='__combat_primary__' || npcId===e.npcId)return {kind:'primary',combatant:e};
    const ally=e.allies.find(a=>a.npcId===npcId);
    return ally?{kind:'ally',combatant:ally}:null;
  }

  function markCombatNpcDefeatedV418(npcId,name,cause='combat'){
    if(!npcId||npcId==='__combat_primary__')return;
    const n=findNpcById(npcId);
    if(n){
      n.dead=true;
      n.location=state.game.location;
      recordNpcInteraction?.(n,`You defeated ${n.name} in combat.`,`combat`);
      n.deathCause ||= {medium:cause,action:cause,day:state.world.day};
    }
  }

  function damageCombatTargetV414(targetNpcId,dmg,status=null,resolution=null){
    const e=ensureReactiveCombatState();if(!e)return;
    const rec=combatantRecordForNpcId(targetNpcId);
    if(!rec||rec.kind==='primary'){
      e.hp=Math.max(0,e.hp-dmg);
      if(status&&['staggered','blinded'].includes(status))addEnemyStatus(status,1);
      return;
    }
    const a=rec.combatant;
    a.hp=Math.max(0,a.hp-dmg);
    if(a.hp<=0){
      const impact=resolution?.consequence_profile?.medium||'combat';
      addLog(`<strong>${escapeHtml(a.name)}</strong> is taken out of the fight by the attack.`,'event');
      markCombatNpcDefeated(a.npcId,a.name,impact);
      persistSceneChange('combatant_defeated',`${a.name} was defeated here.`,{npcId:a.npcId,name:a.name,medium:impact});
      e.allies=e.allies.filter(x=>x!==a);
    }
  }

  function playerCombatDefense(){
    const c=state.character;
    const dex=Number(c.stats?.dex||8);
    const body=c.equipment?.body;
    const armour=body?itemPowerScore(body,c):0;
    const shield=c.equipment?.offHand&&/shield|buckler/.test(String(c.equipment.offHand).toLowerCase())?2:0;
    return clamp(9+Math.floor(dex/4)+Math.floor(armour/35)+shield,8,21);
  }

  function freeformAttackStat(actionText){
    const t=String(actionText||'').toLowerCase(),c=state.character;
    if(/\b(jab|hook|uppercut|punch|fist|elbow|knee|kick|headbutt)\b/.test(t))return Number(c.stats?.dex||8)>Number(c.stats?.str||8)?'dex':'str';
    if(/\b(feint|finesse|quick strike|precise|aim|shoot|throw|lunge)\b/.test(t))return 'dex';
    return chooseActionStat(actionText);
  }

  function reactionStyleForNpc(npc,resolution){
    const occ=String(npc?.occupation||resolution?.target_occupation||'').toLowerCase();
    const armed=/guard|soldier|mercenary|knight|warden|captain|hunter/.test(occ);
    const t=String(resolution?.action_text||'').toLowerCase();
    const unarmed=/jab|punch|hook|uppercut|kick|headbutt|fist/.test(t);
    if(armed && !unarmed)return pick(['parry','block','sidestep']);
    if(/guard|soldier|captain|mercenary/.test(occ))return pick(['slip','guard','sidestep','block']);
    return pick(['dodge','recoil','sidestep','duck']);
  }

  function npcCounterMove(npc,resolution){
    const occ=String(npc?.occupation||resolution?.target_occupation||'').toLowerCase();
    const armed=/guard|watch|soldier|warden|captain/.test(occ);
    if(armed)return pick(['a short spear thrust','a fast shield-and-fist counter','a compact sword cut','a driving pommel strike','a hard shove followed by a quick strike']);
    if(/knight|mercenary/.test(occ))return pick(['a measured counter-cut','a shoulder check into a follow-up strike','a quick weapon feint and riposte']);
    if(/mage|wizard|sorcer/.test(occ))return pick(['a short-range burst of force','a hurried arcane lash','a defensive spell followed by a snapping counter']);
    return pick(['a quick right hand','a sharp counter-jab','a knee toward your midsection','a sudden shove and follow-up punch','a short hook']);
  }

  function previewNpcReaction(resolution){
    if(!resolution?.has_action || !['attack','lethal_attack'].includes(resolution.action_kind))return null;
    const target=resolution.target_npc_id&&resolution.target_npc_id!=='__combat_primary__'?findNpcById(resolution.target_npc_id):combatPrimaryNpc();
    const prof=resolution.target_combat_profile || (target?npcCombatProfile(target):{defense:12,damage:[3,7]});
    const style=reactionStyleForNpc(target,resolution);
    const move=npcCounterMove(target,resolution);
    const fear=Number(target?.socialAxes?.fear||0);
    const staggered=resolution.success && resolution.margin>=5;
    let counterChance=resolution.success?(staggered?.28:.58):.82;
    if(fear>=75)counterChance-=.16;
    if(/reckless|aggressive|bold/.test(String(target?.personality||'').toLowerCase()))counterChance+=.12;
    counterChance=clamp(counterChance,.12,.94);
    const counterAttempt=Math.random()<counterChance;
    const reactionRoll=randInt(1,20)+Math.floor(Number(prof.defense||11)/3)+(resolution.success?0:2)-(staggered?3:0);
    const defense=playerCombatDefense();
    const counterHit=counterAttempt && reactionRoll>=defense;
    const damage=counterHit?randInt(Number(prof.damage?.[0]||2),Number(prof.damage?.[1]||7))+Math.max(0,Math.floor((Number(prof.defense||10)-10)/4)):0;
    const body=pick(BODY_PARTS);
    const occupation=String(target?.occupation||resolution.target_occupation||'').toLowerCase();
    const guardLike=/guard|watch|warden|captain|soldier/.test(occupation);
    const callForHelp=guardLike && state.game.areaType!=='wilderness' && !(state.game.combat?.helpRequests?.[target?.id||resolution.target_npc_id]);
    let hint;
    if(!resolution.success){
      hint=`${resolution.target_name||'The opponent'} ${style}s away from the attack and ${counterAttempt?`tries to answer immediately with ${move}`:'uses the opening to reset their stance'}.`;
    }else if(staggered){
      hint=`The hit forces ${resolution.target_name||'the opponent'} back; ${counterAttempt?`they still try to recover into ${move}`:'they spend the beat recovering rather than attacking'}.`;
    }else{
      hint=`${resolution.target_name||'The opponent'} absorbs or rides the hit and ${counterAttempt?`fires back with ${move}`:'shifts defensively instead of trading immediately'}.`;
    }
    return {defensive_reaction:style,counter_attempt:counterAttempt,counter_move:move,counter_hit:counterHit,counter_damage:damage,counter_body_part:body,reaction_roll:reactionRoll,player_defense:defense,call_for_help:callForHelp,narrative_hint:hint};
  }

  // V4.13 final action resolver: typed attacks use combat targets and pre-resolve the opponent's immediate response.
  function buildActionResolutionV413(segments){
    let r=buildActionResolutionV412(segments);
    if(!r?.has_action)return r;
    const t=String(r.action_text||'').toLowerCase();
    if(['attack','lethal_attack'].includes(r.action_kind)){
      r.stat=freeformAttackStat(r.action_text);
      r.stat_score=Number(state.character.stats?.[r.stat]||8);
      // Recalculate common unarmed/finesse attacks so typed jabs are not unfairly penalised.
      if(r.target_combat_profile){
        let diff=Number(r.target_combat_profile.defense||11);
        if(/\b(jab|punch|hook|uppercut|kick|elbow|knee)\b/.test(t))diff=Math.max(8,diff-1);
        if(/\b(nose|chin|jaw|body|ribs)\b/.test(t) && r.action_kind!=='lethal_attack')diff+=1;
        const supportBonus=Math.min(10,Math.floor((r.capability_support?.[0]?.score||0)/12));
        r.modifier=Math.floor(r.stat_score/4)+supportBonus;
        // Preserve the original d20 so AI and deterministic systems agree on one roll.
        r.total=Number(r.d20||randInt(1,20))+r.modifier;
        r.difficulty=diff;
        r.success=!r.blocked_reason && r.total>=diff;
        r.margin=r.blocked_reason?-99:r.total-diff;
        const base=4+Math.floor(r.stat_score/3)+Math.max(1,state.character.level||1);
        const unarmed=/\b(jab|punch|hook|uppercut|kick|elbow|knee|headbutt)\b/.test(t);
        const weaponBonus=unarmed?0:Math.floor((r.weapon_power_score||0)/7);
        r.combat_damage_cap=Math.max(3,base+weaponBonus+Math.max(0,r.margin));
        r.resolved_damage=r.success?clamp(Math.round(base+weaponBonus+Math.max(0,r.margin*.7)),1,r.combat_damage_cap):0;
      }
      r.npc_reaction=previewNpcReaction(r);
    }
    r.reactive_combat=true;
    r.combat_group=combatGroupSnapshot();
    return r;
  }

  function combatGroupSnapshot(){
    const e=ensureReactiveCombatState();
    if(!e)return null;
    return {round:e.round,primary:{name:e.name,npc_id:e.npcId||null,hp:e.hp,max_hp:e.maxHp},allies:e.allies.map(a=>({name:a.name,npc_id:a.npcId||null,role:a.role||a.occupation||'ally',hp:a.hp,max_hp:a.maxHp})),incoming:e.reinforcementQueue.map(q=>({role:q.role,count:q.count,eta_rounds:q.eta})),alarm_level:e.alarmLevel||0};
  }

  function reactionAlreadyNarrated(text){
    return /\b(dodge|duck|slip|sidestep|block|parr|counter|riposte|retaliat|jab|hook|thrust|shove|swings back|strikes back|answers with)\b/i.test(String(text||''));
  }

  // V4.13 enforcement guarantees an NPC response to a freeform attack.
  function enforceFreeformActionResultV414(result,resolution){
    result=enforceFreeformActionResultV412(result,resolution);
    if(!resolution?.npc_reaction)return result;
    result.intents=Array.isArray(result.intents)?result.intents:[];
    const react=resolution.npc_reaction;
    const targetId=resolution.target_npc_id;

    // The deterministic reaction owns the immediate counter damage.
    result.intents=result.intents.filter(x=>x?.type!=='player_damage');
    if(react.counter_hit && react.counter_damage>0){
      result.intents.push({type:'player_damage',target_id:null,amount:react.counter_damage,reason:`counterattack by ${resolution.target_name||'opponent'}`,text:null,enemy_name:null,context:null,status:null,body_part:react.counter_body_part,severity:react.counter_damage>=9?'severe':react.counter_damage>=5?'minor':null,cause:`${resolution.target_name||'The opponent'} counters with ${react.counter_move}`,location:null,area_type:null,description:null,witnessed:null,scope:null,kind:null,item:null});
    }
    if(react.call_for_help && !result.intents.some(x=>x?.type==='request_help')){
      result.intents.push({type:'request_help',target_id:targetId&&targetId!=='__combat_primary__'?targetId:null,amount:null,reason:'The attacked guard calls nearby allies for immediate assistance.',text:null,enemy_name:null,context:state.game.areaType,status:null,body_part:null,severity:null,cause:null,location:null,area_type:null,description:null,witnessed:null,scope:null,kind:'watch',item:null});
    }
    if(!reactionAlreadyNarrated(result.narration)){
      const outcome=react.counter_attempt?(react.counter_hit?` The counter catches you in the ${react.counter_body_part} for ${react.counter_damage} damage.`:` The counter comes back quickly, but you avoid the return strike.`):'';
      result.narration=`${String(result.narration||'').trim()}\n\n${react.narrative_hint}${outcome}`.trim();
    }
    return result;
  }

  function reinforcementRoleForNpc(npc){
    const occ=String(npc?.occupation||'').toLowerCase();
    if(/guard|watch|warden|captain|soldier/.test(occ))return 'watch';
    if(/noble|lord|lady|court/.test(occ))return 'bodyguard';
    if(/bandit|thief|criminal|smuggler/.test(occ))return 'gang';
    if(/priest|cleric|paladin|templar/.test(occ))return 'order';
    if(/mage|wizard|sorcer/.test(occ))return 'arcane';
    return 'local';
  }

  function requestCombatHelpV413(npc,kind='reinforcements',reason='calls for help'){
    const e=ensureReactiveCombatState();if(!e)return;
    const id=npc?.id||`generic-${kind}`;
    if(e.helpRequests[id])return;
    const currentCount=e.allies.length+e.reinforcementQueue.reduce((s,q)=>s+q.count,0);
    if(currentCount>=e.maxReinforcements)return;
    e.helpRequests[id]={round:e.round,reason};
    e.alarmLevel=clamp((e.alarmLevel||0)+25,0,100);
    const role=kind==='reinforcements'?reinforcementRoleForNpc(npc):kind;
    const area=state.game.areaType;
    let eta=area==='town'?2:area==='outskirts'?3:area==='road'?4:5;
    let count=role==='watch'&&area==='town'?2:1;
    count=Math.min(count,e.maxReinforcements-currentCount);
    if(count<=0)return;
    e.reinforcementQueue.push({role,count,eta,requestedBy:npc?.id||null,reason});
    const caller=npc?.name||e.name;
    const calls={watch:`${caller} shouts for the watch, calling nearby guards to the fight.`,bodyguard:`${caller} calls for retainers and protection.`,gang:`${caller} yells for nearby allies to get involved.`,order:`${caller} calls on nearby members of their order for aid.`,arcane:`${caller} calls for magical assistance.`,local:`${caller} shouts for help.`};
    addLog(`<strong>Call for help:</strong> ${escapeHtml(calls[role]||calls.local)} Reinforcements may arrive in about ${eta} combat rounds.`,'event');

    const impression=typeof synthesizeVisibleImpression==='function'?synthesizeVisibleImpression(npc):{score:0};
    const existingQueued=e.allies.length+e.reinforcementQueue.reduce((s,q)=>s+q.count,0);
    if(role==='watch' && area==='town' && impression.score>=60 && existingQueued<e.maxReinforcements){
      const capEta=eta+2;
      e.reinforcementQueue.push({role:'captain',count:1,eta:capEta,requestedBy:npc?.id||null,reason:'Escalated watch response to an unusually dangerous attacker'});
      addLog(`The alarm is serious enough that a <strong>watch captain</strong> may be drawn into the response if the fight continues.`,'system');
    }
  }

  function makeReinforcementNpcV413(role){
    let npc;
    if(['watch','captain','bodyguard'].includes(role)){
      npc=makeGuardNpc();
      if(role==='captain'){
        npc.occupation='watch captain';npc.personality=pick(['veteran, controlled and decisive','hard-eyed and tactically cautious','authoritative and battle-tested']);
        npc.relationship=-80;
      }else if(role==='bodyguard'){
        npc.occupation='professional bodyguard';npc.personality=pick(['disciplined and protective','quiet and watchful','professional and unsentimental']);
      }
    }else{
      npc=generateNpc();
      if(role==='gang')npc.occupation=pick(['gang enforcer','smuggler enforcer','street tough']);
      if(role==='order')npc.occupation=pick(['temple guard','paladin','cleric']);
      if(role==='arcane')npc.occupation=pick(['battle mage','apprentice mage','arcane warden']);
    }
    npc.kingdomId=state.game.kingdomId;npc.location=state.game.location;npc.relationship=-75;
    ensureNpcDeepProfile(npc);markNpcMet?.(npc,'combat reinforcement');
    return npc;
  }

  function combatantFromNpcV413(npc,role='ally',arrivedRound=0){
    const p=npcCombatProfile(npc);
    if(role==='captain'){p.hp=Math.round(p.hp*1.35);p.defense+=2;p.damage=[p.damage[0]+2,p.damage[1]+3];p.xp=Math.round(p.xp*1.5);}
    return {npcId:npc.id,name:npc.name,occupation:npc.occupation,role,hp:p.hp,maxHp:p.hp,defense:p.defense,dmg:p.damage,xp:p.xp,gold:p.gold,attacks:['jab','slash','thrust','grapple','counter'],arrivedRound};
  }

  function processReinforcementArrivals(){
    const e=ensureReactiveCombatState();if(!e)return;
    const arriving=[];
    for(const q of e.reinforcementQueue){q.eta-=1;if(q.eta<=0)arriving.push(q);}
    e.reinforcementQueue=e.reinforcementQueue.filter(q=>q.eta>0);
    for(const q of arriving){
      const names=[];
      for(let i=0;i<q.count && e.allies.length<e.maxReinforcements;i++){
        const npc=makeReinforcementNpc(q.role);names.push(npc.name);e.allies.push(combatantFromNpc(npc,q.role,e.round));
      }
      if(names.length){
        const roleLabel=q.role==='captain'?'watch captain':q.role==='watch'?'watch reinforcement':q.role;
        addLog(`<strong>Reinforcements arrive:</strong> ${escapeHtml(names.join(', '))} ${names.length===1?'enters':'enter'} the fight as ${escapeHtml(roleLabel)}.`,'event');
        persistSceneChange('reinforcements_arrive',`${names.join(', ')} arrived to join the ongoing fight.`,{names,role:q.role});
      }
    }
  }

  function applyReactiveDamageToPlayerV415(attacker,damage,move){
    if(!state.game.combat)return;
    const c=state.character,body=pick(BODY_PARTS);
    c.hp=Math.max(0,c.hp-damage);
    let injury='';
    if(damage>=7 && Math.random()<.22){
      const severity=damage>=11?'severe':'minor';applyInjury(body,severity,`${attacker.name} ${move}`);injury=` The hit also leaves a ${severity} injury to your ${body}.`;
    }
    addLog(`<strong>${escapeHtml(attacker.name)}</strong> ${escapeHtml(move)}, catching your ${escapeHtml(body)} for <strong>${damage} damage</strong>.${injury}`,'ai-narration');
    if(c.hp<=0)resolveReactivePlayerDefeat(`${attacker.name} ${move}`);
  }

  function resolveReactivePlayerDefeatV415(cause='combat'){
    const c=state.character;if(c.hp>0)return;
    c.hp=Math.max(1,Math.floor(c.maxHp*.25));
    const lost=Math.min(c.gold,Math.max(2,Math.floor(c.gold*.18)));c.gold-=lost;
    state.game.combat=null;state.world.day+=1;state.game.time='Morning';
    addLog(`The fight finally overwhelms you. You lose consciousness after ${escapeHtml(String(cause))}. Hours later you wake away from immediate danger with ${c.hp} HP; ${lost} gold is missing and your injuries remain.`,'event');
    addEvent('Defeated in combat');
  }

  function allyCombatTurnV413(ally){
    if(!state.game.combat||ally.hp<=0)return;
    const profile={defense:ally.defense,damage:ally.dmg};
    const move=pick(ally.attacks||['strike']);
    const roll=randInt(1,20)+Math.floor((ally.defense||10)/3);
    const def=playerCombatDefense();
    if(roll>=def){
      const dmg=randInt(ally.dmg?.[0]||2,ally.dmg?.[1]||6);
      applyReactiveDamageToPlayer(ally,dmg,`moves in with ${move}`);
    }else{
      addLog(`<strong>${escapeHtml(ally.name)}</strong> tries to join the opening with ${escapeHtml(move)}, but you keep clear of the attack.`,'ai-narration');
    }
  }

  function processCombatSupportRoundV413(){
    const e=ensureReactiveCombatState();if(!e)return;
    e.round+=1;
    processReinforcementArrivals();
    if(!state.game.combat)return;
    // Reinforcements do not teleport in and strike on the exact same beat they arrive.
    const eligible=e.allies.filter(a=>a.hp>0 && a.arrivedRound<e.round);
    const attackers=eligible.slice(0,Math.min(2,eligible.length));
    for(const a of attackers){if(!state.game.combat)break;allyCombatTurn(a);}
    if(eligible.length>attackers.length && state.game.combat){
      addLog(`${eligible.length-attackers.length} additional opponent${eligible.length-attackers.length===1?'':'s'} spread out, trying to box you in rather than all attacking through the same space.`,'system');
    }
  }

  function settleGroupPrimaryDefeat(e){
    const c=state.character;
    const gold=randInt(e.gold?.[0]||0,e.gold?.[1]||0);
    c.gold+=gold;awardXp(e.xp||12);awardCraftingLoot(e);wearEquipmentAfterConflict(e.level||1);
    const impact=e.lastImpact||{};const medium=impact.profile?.medium||'combat';
    if(!impact.narrated_death){
      const deathText=combatDeathFallback(e);addLog(`<div class="ai-narrator-label">CONSEQUENCE</div>${escapeHtml(deathText)}`,'ai-narration');
    }
    if(e.npcId){
      const victim=findNpcById(e.npcId);if(victim){victim.dead=true;victim.deathCause={medium,action:impact.action_text||'combat',day:state.world.day};recordNpcInteraction?.(victim,`You killed ${victim.name} during the fight.`,'combat');}
      persistSceneChange('corpse',`${e.name}'s body remains at this location.`,{npcId:e.npcId,name:e.name,medium});
      recordCrime(`Killing of ${e.name}`,30,true);
    }
    e.defeatedCount=(e.defeatedCount||0)+1;
  }

  function promoteNextCombatAllyV413(e){
    const next=e.allies.shift();if(!next)return false;
    addLog(`<strong>${escapeHtml(next.name)}</strong> steps into the opening and becomes the immediate threat.`,'event');
    e.name=next.name;e.npcId=next.npcId;e.level=Math.max(1,Math.round((next.defense||10)/3));e.hp=next.hp;e.maxHp=next.maxHp;e.dmg=next.dmg;e.xp=next.xp;e.gold=next.gold;e.attacks=next.attacks;e.statuses=[];e.lastImpact=null;
    return true;
  }

  // V4.13 victory handler: killing one guard does not erase guards who already arrived.
  function finishCombatVictoryV418(){
    const e=ensureReactiveCombatState();if(!e)return;
    if(e.allies.length){
      settleGroupPrimaryDefeat(e);
      if(promoteNextCombatAlly(e)){saveGame(false);renderGame();return;}
    }
    finishCombatVictoryV412();
  }

  // Quick actions also use the support/reinforcement system.
  function enemyTurnV418(){
    enemyTurnV412();
    if(state.game.combat)processCombatSupportRound();
  }

  function combatSupportHudV413(e){
    ensureReactiveCombatState();
    const allies=(e.allies||[]).filter(a=>a.hp>0);
    const incoming=e.reinforcementQueue||[];
    if(!allies.length&&!incoming.length)return '';
    return `<div class="combat-support-hud">${allies.length?`<div><strong>Other hostiles</strong><span>${allies.map(a=>`${escapeHtml(a.name)} (${a.hp}/${a.maxHp})`).join(' • ')}</span></div>`:''}${incoming.length?`<div><strong>Incoming help</strong><span>${incoming.map(q=>`${escapeHtml(titleCase(q.role))} ×${q.count} — ~${q.eta} round${q.eta===1?'':'s'}`).join(' • ')}</span></div>`:''}</div>`;
  }

  // V4.13 AI snapshot exposes the real combat group and pending reinforcement state.
  function aiWorldSnapshotV413(){
    const snap=aiWorldSnapshotV412();
    const e=ensureReactiveCombatState();
    if(e&&snap?.scene?.combat){
      snap.scene.combat.group=combatGroupSnapshot();
      snap.scene.combat.instruction='Combat is a continuous exchange, not a menu turn queue. Active opponents may dodge, counterattack, retreat, communicate and call reinforcements. Pending reinforcements are real simulation state; do not repeatedly call for help if help is already incoming.';
    }
    return snap;
  }

  // V4.13 submission wrapper: one freeform input advances one real combat beat.
  async function submitRoleplayInputV413(prefill=null){
    const raw=String(prefill ?? document.getElementById('roleplayInput')?.value ?? '').trim();
    const hadCombat=!!state.game?.combat;
    await submitRoleplayInputV412(prefill);
    if(state.game?.combat){
      // Freeform combat already resolved the primary NPC's immediate response via npc_reaction.
      // This progresses arrivals and lets existing additional hostiles act.
      processCombatSupportRound();
      saveGame(false);renderGame();
    }
  }



  // ============================================================
  // V4.14 — TACTICAL BATTLES & REAL ECONOMY
  // ============================================================

  // ---------- Currency ----------
  const COPPER_PER_SILVER=10;
  const COPPER_PER_GOLD=100;
  const COPPER_PER_PLATINUM=1000;

  function walletFromCopper(total){
    total=Math.max(0,Math.round(Number(total)||0));
    const platinum=Math.floor(total/COPPER_PER_PLATINUM);total%=COPPER_PER_PLATINUM;
    const gold=Math.floor(total/COPPER_PER_GOLD);total%=COPPER_PER_GOLD;
    const silver=Math.floor(total/COPPER_PER_SILVER);const copper=total%COPPER_PER_SILVER;
    return {platinum,gold,silver,copper};
  }
  function walletCopper(wallet){
    wallet=wallet||{};
    return Math.max(0,Math.round((Number(wallet.platinum)||0)*COPPER_PER_PLATINUM+(Number(wallet.gold)||0)*COPPER_PER_GOLD+(Number(wallet.silver)||0)*COPPER_PER_SILVER+(Number(wallet.copper)||0)));
  }
  function setWalletCopper(owner,total){owner.currency=walletFromCopper(total);return owner.currency;}
  function formatCopper(total){
    const w=walletFromCopper(total),parts=[];
    if(w.platinum)parts.push(`${w.platinum}p`);if(w.gold)parts.push(`${w.gold}g`);if(w.silver)parts.push(`${w.silver}s`);if(w.copper||!parts.length)parts.push(`${w.copper}c`);
    return parts.join(' ');
  }
  function formatWallet(wallet){return formatCopper(walletCopper(wallet));}
  function canAfford(owner,amountCopper){return walletCopper(owner?.currency)>=Math.max(0,Math.round(amountCopper||0));}
  function changeCurrency(owner,deltaCopper){
    if(!owner)return false;const next=walletCopper(owner.currency)+Math.round(Number(deltaCopper)||0);if(next<0)return false;setWalletCopper(owner,next);return true;
  }
  function installLegacyGoldBridge(c){
    if(!c)return;
    const desc=Object.getOwnPropertyDescriptor(c,'gold');
    if(desc?.get && desc?.set)return;
    const legacy=Number(c.gold||0);
    if(!c.currency)c.currency=walletFromCopper(Math.round(legacy*COPPER_PER_GOLD));
    try{
      Object.defineProperty(c,'gold',{configurable:true,enumerable:true,get(){return walletCopper(this.currency)/COPPER_PER_GOLD;},set(v){setWalletCopper(this,Math.max(0,Math.round((Number(v)||0)*COPPER_PER_GOLD)));}});
    }catch{c.gold=walletCopper(c.currency)/COPPER_PER_GOLD;}
  }
  function ensureCurrencySystem(c=state.character,w=state.world,g=state.game){
    if(!c)return;
    if(!c.currency)c.currency=walletFromCopper(Math.round((Number(c.gold)||0)*COPPER_PER_GOLD));
    installLegacyGoldBridge(c);
    if(w){w.transactions=Array.isArray(w.transactions)?w.transactions:[];w.npcs=Array.isArray(w.npcs)?w.npcs:[];for(const n of w.npcs)ensureNpcEconomyData(n);}
    if(g)g.marketMerchantId??=null;
  }
  function npcStartingCopper(npc){
    const occ=String(npc?.occupation||'').toLowerCase();
    if(/merchant|trader/.test(occ))return randInt(3500,12500);
    if(/innkeeper/.test(occ))return randInt(900,4200);
    if(/noble|lord|lady/.test(occ))return randInt(6000,18000);
    if(/captain|knight|mercenary/.test(occ))return randInt(900,3500);
    if(/guard|soldier|hunter|blacksmith|mage|scribe/.test(occ))return randInt(250,1300);
    if(/beggar/.test(occ))return randInt(0,30);
    return randInt(40,450);
  }
  function ensureNpcEconomyData(npc){
    if(!npc)return npc;
    if(!npc.currency)npc.currency=walletFromCopper(npcStartingCopper(npc));
    npc.inventory=Array.isArray(npc.inventory)?npc.inventory:[];
    npc.transactionHistory=Array.isArray(npc.transactionHistory)?npc.transactionHistory:[];
    return npc;
  }
  function recordTransaction(from,to,amountCopper,reason,item=null){
    state.world.transactions=Array.isArray(state.world.transactions)?state.world.transactions:[];
    state.world.transactions.push({day:state.world.day,turn:state.game.turn,location:state.game.location,from,to,amountCopper:Math.round(amountCopper),reason:String(reason||'transaction').slice(0,120),item:item?String(item).slice(0,80):null});
    if(state.world.transactions.length>120)state.world.transactions.splice(0,state.world.transactions.length-120);
  }
  function transferCurrency(fromOwner,toOwner,amountCopper,meta={}){
    amountCopper=Math.max(0,Math.round(Number(amountCopper)||0));
    if(!amountCopper)return true;
    if(!fromOwner||!toOwner||!canAfford(fromOwner,amountCopper))return false;
    changeCurrency(fromOwner,-amountCopper);changeCurrency(toOwner,amountCopper);
    recordTransaction(meta.from||'unknown',meta.to||'unknown',amountCopper,meta.reason,meta.item);
    return true;
  }
  function findInventoryItemIndex(owner,item){
    const inv=owner?.inventory||[];if(!item)return -1;const q=String(item).toLowerCase();
    let idx=inv.findIndex(x=>String(x).toLowerCase()===q);if(idx<0)idx=inv.findIndex(x=>String(x).toLowerCase().includes(q)||q.includes(String(x).toLowerCase()));return idx;
  }
  function executeNpcTransaction(npc,amountCopper,kind='pay',item=null,reason='transaction'){
    ensureCurrencySystem();ensureNpcEconomyData(npc);amountCopper=Math.max(0,Math.round(amountCopper||0));
    if(!amountCopper){addLog(`No coin changes hands.`,'system');return false;}
    const outgoing=['pay','purchase','tip','bribe','gift'].includes(kind);
    const incoming=['sale','reward','refund'].includes(kind);
    const serviceLike=item&&/meal|room|drink|ale|food|service|information|entry|fee|fare|healing|lodging/i.test(String(item));
    if(outgoing){
      let purchaseIndex=-1;
      if(kind==='purchase'&&item&&!serviceLike){purchaseIndex=findInventoryItemIndex(npc,item);if(purchaseIndex<0){addLog(`${escapeHtml(npc.name)} does not have ${escapeHtml(item)} available to sell.`,'system');return false;}}
      if(!transferCurrency(state.character,npc,amountCopper,{from:'player',to:`npc:${npc.id}`,reason,item})){addLog(`You do not have ${formatCopper(amountCopper)} available.`,'system');return false;}
      if(purchaseIndex>=0)state.character.inventory.push(npc.inventory.splice(purchaseIndex,1)[0]);
      addLog(`You pay <strong>${formatCopper(amountCopper)}</strong> to ${escapeHtml(npc.name)}${item?` for ${escapeHtml(item)}`:''}. The coins leave your purse and enter theirs.`,'event');
    }else if(incoming){
      let saleIndex=-1;
      if(kind==='sale'&&item){saleIndex=findInventoryItemIndex(state.character,item);if(saleIndex<0){addLog(`You do not have ${escapeHtml(item)} to sell.`,'system');return false;}}
      if(!transferCurrency(npc,state.character,amountCopper,{from:`npc:${npc.id}`,to:'player',reason,item})){addLog(`${escapeHtml(npc.name)} cannot cover ${formatCopper(amountCopper)} from their current purse.`,'system');return false;}
      if(saleIndex>=0)npc.inventory.push(state.character.inventory.splice(saleIndex,1)[0]);
      addLog(`${escapeHtml(npc.name)} pays you <strong>${formatCopper(amountCopper)}</strong>${item?` for ${escapeHtml(item)}`:''}.`,'event');
    }else return false;
    npc.transactionHistory.push({day:state.world.day,kind,amountCopper,item,reason});if(npc.transactionHistory.length>20)npc.transactionHistory.shift();
    return true;
  }
  function parseExplicitCoin(text){
    const t=String(text||'').toLowerCase();let total=0,found=false;
    const re=/(\d+)\s*(platinum|plat|p|gold|g|silver|s|copper|c)\b/g;let m;
    while((m=re.exec(t))){const n=Number(m[1]);const u=m[2];found=true;if(['platinum','plat','p'].includes(u))total+=n*1000;else if(['gold','g'].includes(u))total+=n*100;else if(['silver','s'].includes(u))total+=n*10;else total+=n;}
    return found?total:null;
  }
  function explicitEconomyFallback(raw,npc,transactionsBefore){
    if(!npc||!state.world)return false;
    if((state.world.transactions||[]).length>transactionsBefore)return false;
    const amount=parseExplicitCoin(raw);if(amount==null)return false;const t=String(raw||'').toLowerCase();
    if(/\b(buy|purchase|pay|tip|give|hand|bribe)\b/.test(t))return executeNpcTransaction(npc,amount,/\bbuy|purchase\b/.test(t)?'purchase':/\btip\b/.test(t)?'tip':/\bbribe\b/.test(t)?'bribe':'pay',null,'explicit player transaction');
    if(/\bsell\b/.test(t))return executeNpcTransaction(npc,amount,'sale',null,'explicit player sale');
    return false;
  }

  function getOrCreateMarketMerchantV418(){
    ensureCurrencySystem();const g=state.game;
    let npc=g.marketMerchantId?findNpcById(g.marketMerchantId):null;
    if(!npc||npc.dead||npc.location!==g.location){
      npc=(state.world.npcs||[]).find(n=>!n.dead&&n.location===g.location&&n.kingdomId===g.kingdomId&&/merchant|trader/.test(String(n.occupation||'').toLowerCase()));
    }
    if(!npc){
      npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation:'market merchant',personality:pick(['businesslike and observant','friendly but shrewd','patient and calculating']),factionId:factionForType(g.kingdomId,'merchant')?.id||null,kingdomId:g.kingdomId,location:g.location,relationship:0,memory:[],socialLinks:{}};
      state.world.npcs.push(npc);ensureNpcDeepProfile(npc);
    }
    ensureNpcEconomyData(npc);npc.marketStock ||= Object.fromEntries(MARKET_GOODS.map((_,i)=>[i,randInt(2,8)]));g.marketMerchantId=npc.id;return npc;
  }
  function worldPriceCopperV415(good,kingdom=currentKingdom()){
    const market=kingdom.market||{index:1,categories:{}};let mult=Number(market.index||1)*Number(market.categories?.[good.category]||1);const merchant=factionForType(kingdom.id,'merchant');if(merchant)mult*=clamp(1-merchant.playerRep*.002,.82,1.18);if((kingdom.wars||[]).length&&['food','medicine','weapons'].includes(good.category))mult*=1.18;return Math.max(1,Math.round(Number(good.baseCopper||good.base*100)*mult));
  }
  function renderRealMarket(){
    const c=state.character,k=currentKingdom(),merchant=getOrCreateMarketMerchant();
    return `<div class="market-panel"><div class="eyebrow">${escapeHtml(state.game.location)} market</div><h3>${escapeHtml(merchant.name)}'s stall</h3><p>Prices respond to prosperity, war and reputation. Purchases move real coin between your purse and ${escapeHtml(merchant.name)}'s purse.</p><div class="market-wallets"><span>Your purse: <strong>${formatWallet(c.currency)}</strong></span><span>Merchant funds: <strong>${formatWallet(merchant.currency)}</strong></span></div><div class="market-list">${MARKET_GOODS.map((good,i)=>{const price=worldPriceCopper(good,k),sell=Math.max(1,Math.floor(price*.55)),owned=c.inventory.includes(good.item),stock=Number(merchant.marketStock?.[i]||0);return `<div class="market-row"><div><strong>${escapeHtml(good.name)}</strong><small>${titleCase(good.category)} • Stock ${stock}${owned?' • You own one':''}</small></div><div class="market-actions"><button type="button" class="secondary-button" data-buy="${i}" ${stock<=0||!canAfford(c,price)?'disabled':''}>Buy ${formatCopper(price)}</button>${owned?`<button type="button" class="ghost-button" data-sell="${i}" ${!canAfford(merchant,sell)?'disabled':''}>Sell ${formatCopper(sell)}</button>`:''}</div></div>`}).join('')}</div><button type="button" class="ghost-button" data-action="market-leave">Leave market</button></div>`;
  }
  function buyMarketGoodV415(index){
    const good=MARKET_GOODS[index];if(!good||!state.game.marketOpen)return;const merchant=getOrCreateMarketMerchant(),price=worldPriceCopper(good);if(Number(merchant.marketStock?.[index]||0)<=0){showToast('That item is out of stock.');return;}if(!canAfford(state.character,price)){showToast(`You need ${formatCopper(price)}.`);return;}if(!transferCurrency(state.character,merchant,price,{from:'player',to:`npc:${merchant.id}`,reason:`Bought ${good.name}`,item:good.item}))return;merchant.marketStock[index]-=1;state.character.inventory.push(good.item);changeFactionRep(merchant.factionId,1);addLog(`You buy <strong>${escapeHtml(good.name)}</strong> from ${escapeHtml(merchant.name)} for <strong>${formatCopper(price)}</strong>.`,'event');advanceTurn();saveGame(false);renderGame();
  }
  function sellMarketGoodV415(index){
    const good=MARKET_GOODS[index];if(!good||!state.game.marketOpen)return;const merchant=getOrCreateMarketMerchant(),ix=findInventoryItemIndex(state.character,good.item);if(ix<0){showToast('You do not own that item.');return;}const price=Math.max(1,Math.floor(worldPriceCopper(good)*.55));if(!canAfford(merchant,price)){showToast(`${merchant.name} cannot afford ${formatCopper(price)} right now.`);return;}if(!transferCurrency(merchant,state.character,price,{from:`npc:${merchant.id}`,to:'player',reason:`Bought ${good.name} from player`,item:good.item}))return;const item=state.character.inventory.splice(ix,1)[0];merchant.inventory.push(item);merchant.marketStock[index]=(merchant.marketStock[index]||0)+1;changeFactionRep(merchant.factionId,1);addLog(`${escapeHtml(merchant.name)} buys <strong>${escapeHtml(good.name)}</strong> from you for <strong>${formatCopper(price)}</strong>.`,'event');advanceTurn();saveGame(false);renderGame();
  }
  function visitLocalInnV418(){
    let npc=(state.world.npcs||[]).find(n=>!n.dead&&n.location===state.game.location&&n.kingdomId===state.game.kingdomId&&/innkeeper/.test(String(n.occupation||'').toLowerCase()));
    if(!npc){npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation:'innkeeper',personality:pick(['welcoming but busy','cheerful and observant','dry-humoured and practical']),factionId:factionForType(state.game.kingdomId,'merchant')?.id||null,kingdomId:state.game.kingdomId,location:state.game.location,relationship:3,memory:[],socialLinks:{}};state.world.npcs.push(npc);ensureNpcDeepProfile(npc);}
    startConversation(npc,1);addLog(`You enter a local inn. <strong>${escapeHtml(npc.name)}</strong> is working the room. A basic hot meal costs <strong>3 copper</strong>.`,'event');
  }
  function npcActionV417(action){
    const n=state.game.activeNpc;
    if(action==='npc-meal'&&n){executeNpcTransaction(n,3,'purchase',null,'Hot inn meal');addLog(`A hot meal is set down in front of you. The payment is now in ${escapeHtml(n.name)}'s purse.`);advanceTurn();saveGame(false);renderGame();return;}
    if(action==='npc-threaten'&&n){
      ensureNpcEconomyData(n);const roll=randInt(1,20)+Math.floor((state.character.stats.cha+state.character.stats.str)/5);
      if(roll>=13){const wanted=randInt(30,220),take=Math.min(wanted,walletCopper(n.currency));if(take>0)transferCurrency(n,state.character,take,{from:`npc:${n.id}`,to:'player',reason:'Extortion'});n.relationship=clamp(n.relationship-20,-100,100);addLog(`${escapeHtml(n.name)} backs down and hands over <strong>${formatCopper(take)}</strong> from their actual purse. Several people nearby notice.`);recordCrime('Extortion',9,true);addNpcMemory(n,'The player threatened me for money.',{category:'hostility'});}else{n.relationship=clamp(n.relationship-12,-100,100);addLog(`${escapeHtml(n.name)} refuses to be intimidated and calls for help.`);recordCrime('Threatening behaviour',6,true);maybeLawCheck();}advanceTurn();saveGame(false);renderGame();return;
    }
    return npcActionV413(action);
  }

  // ---------- Named combat classes & formations ----------
  const COMBAT_CLASS_TEMPLATES={
    watchman:{label:'Watchman',role:'front',weapon:'spear and side sword',armour:'mail shirt and watch shield',style:'disciplined street fighting'},
    shield_guard:{label:'Shield Guard',role:'front',weapon:'short spear',armour:'large shield and mail',style:'holds formation and protects allies'},
    gate_spearman:{label:'Gate Spearman',role:'front',weapon:'long spear',armour:'shield, helm and mail',style:'controls chokepoints'},
    wall_archer:{label:'Wall Archer',role:'rear',weapon:'longbow',armour:'padded jack and helm',style:'fires from protected elevation'},
    crossbowman:{label:'Crossbowman',role:'rear',weapon:'crossbow',armour:'mail vest',style:'deliberate armour-piercing fire'},
    captain:{label:'Watch Captain',role:'command',weapon:'sword and shield',armour:'quality mail and officer insignia',style:'commands and exploits openings'},
    shieldman:{label:'Shieldman',role:'front',weapon:'spear',armour:'large shield and mail',style:'maintains a shield wall'},
    spearman:{label:'Spearman',role:'front',weapon:'long spear',armour:'shield and gambeson',style:'fights in ranked formation'},
    archer:{label:'Archer',role:'rear',weapon:'war bow',armour:'light armour',style:'missile support behind the line'},
    cavalry:{label:'Cavalryman',role:'flank',weapon:'lance and sword',armour:'mail with mounted shield',style:'charges exposed flanks'},
    man_at_arms:{label:'Man-at-Arms',role:'front',weapon:'sword and shield',armour:'mail and plate pieces',style:'professional close combat'},
    enforcer:{label:'Enforcer',role:'flank',weapon:'club and knife',armour:'leather coat',style:'surrounds and pressures targets'},
    templar:{label:'Templar',role:'front',weapon:'mace and shield',armour:'mail with religious insignia',style:'disciplined protective fighting'},
    battle_mage:{label:'Battle Mage',role:'rear',weapon:'arcane focus',armour:'warded robes',style:'ranged magical support'}
  };
  function classKeyForRole(role,npc=null){
    if(role==='captain')return 'captain';if(role==='wall_archer'||role==='archer')return role;if(role==='gate_spearman')return 'gate_spearman';if(role==='line_infantry')return pick(['shieldman','spearman']);if(role==='cavalry')return 'cavalry';if(role==='bodyguard')return 'man_at_arms';if(role==='gang')return 'enforcer';if(role==='order')return 'templar';if(role==='arcane')return 'battle_mage';if(role==='watch')return pick(['watchman','shield_guard','crossbowman']);
    const occ=String(npc?.occupation||'').toLowerCase();if(/captain/.test(occ))return 'captain';if(/mage/.test(occ))return 'battle_mage';if(/knight|bodyguard|mercenary/.test(occ))return 'man_at_arms';return 'watchman';
  }
  function ensureNpcCombatIdentityV418(npc,preferredRole=null){
    if(!npc)return npc;const key=npc.combatClassKey||classKeyForRole(preferredRole,npc),tpl=COMBAT_CLASS_TEMPLATES[key]||COMBAT_CLASS_TEMPLATES.watchman;npc.combatClassKey=key;npc.combatClass=tpl.label;npc.tacticalRole=tpl.role;npc.combatLoadout ||= {weapon:tpl.weapon,armour:tpl.armour,style:tpl.style};npc.rank ||= key==='captain'?'Captain':key==='cavalry'?'Trooper':'Rank and file';return npc;
  }
  function makeReinforcementNpc(role){
    let npc;
    if(['watch','captain','wall_archer','gate_spearman','line_infantry','archer','cavalry','bodyguard'].includes(role)){
      npc={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation:role==='captain'?'watch captain':role==='wall_archer'?'wall archer':role==='gate_spearman'?'gate guard':role==='line_infantry'?'kingdom soldier':role==='archer'?'army archer':role==='cavalry'?'cavalry trooper':role==='bodyguard'?'professional bodyguard':'town guard',personality:pick(['disciplined and wary','steady under pressure','aggressive but trained','quiet and professional','alert and tactical']),factionId:factionForType(state.game.kingdomId,'crown')?.id||null,kingdomId:state.game.kingdomId,location:state.game.location,relationship:-75,memory:[],socialLinks:{}};
      state.world.npcs.push(npc);
    }else npc=makeReinforcementNpcV413(role);
    ensureNpcDeepProfile(npc);ensureNpcCombatIdentity(npc,role);markNpcMet?.(npc,'combat reinforcement');return npc;
  }
  function tacticalScenario(e=state.game.combat){
    if(!e)return 'skirmish';const npc=e.npcId?findNpcById(e.npcId):null,occ=String(npc?.occupation||e.name||'').toLowerCase(),military=/guard|watch|soldier|captain|knight|warden/.test(occ);const area=state.game.areaType,loc=String(state.game.location||'').toLowerCase();
    if(military&&area==='outskirts'&&(/outskirts|gate/.test(loc)||state.game.location?.includes(currentKingdom()?.capital)))return 'gate_defense';
    if(military&&(currentKingdom()?.wars||[]).length&&['road','outskirts','wilderness'].includes(area))return 'wartime_field';
    if(/guard|watch|captain/.test(occ))return 'watch_cordon';if(/gang|bandit|thief|smuggler|enforcer/.test(occ))return 'encirclement';if(/noble|bodyguard/.test(occ))return 'protective_ring';return 'skirmish';
  }
  function ensureTacticalBattleState(){
    const e=ensureReactiveCombatState();if(!e)return null;e.maxReinforcements=Math.max(e.maxReinforcements||4,10);const scenario=tacticalScenario(e);e.battlefield ||= {};e.battlefield.scenario=scenario;e.battlefield.cohesion ??= 78;e.battlefield.phase ||= 'engagement';
    const forms={gate_defense:{name:'Gate Defence',formation:'shield wall at the gate',strategy:'hold the choke point while wall archers fire from elevation'},wartime_field:{name:'Field Battle Line',formation:'shield line with archer rear and cavalry flank',strategy:'pin the enemy with infantry, maintain missile pressure and use cavalry against exposed flanks'},watch_cordon:{name:'Watch Cordon',formation:'loose shield-and-spear containment line',strategy:'contain, call reinforcements and avoid isolated duels'},encirclement:{name:'Loose Encirclement',formation:'mobile ring',strategy:'pressure from several angles and punish escape attempts'},protective_ring:{name:'Protective Ring',formation:'bodyguard ring',strategy:'shield the protected figure and counter anyone who closes'},skirmish:{name:'Skirmish',formation:'loose individual spacing',strategy:'react independently and exploit openings'}};Object.assign(e.battlefield,forms[scenario]||forms.skirmish);
    const p=e.npcId?findNpcById(e.npcId):null;if(p){ensureNpcCombatIdentity(p);e.combatClass=p.combatClass;e.formationRole=p.tacticalRole;e.loadout=p.combatLoadout;}
    return e.battlefield;
  }
  function queueTacticalGroup(role,count,eta,reason){const e=ensureReactiveCombatState();e.reinforcementQueue.push({role,count,eta,requestedBy:null,reason});}
  function requestCombatHelpV418(npc,kind='reinforcements',reason='calls for help'){
    const e=ensureReactiveCombatState();if(!e)return;ensureTacticalBattleState();const id=npc?.id||`generic-${kind}`;if(e.helpRequests[id])return;e.helpRequests[id]={round:e.round,reason};e.alarmLevel=clamp((e.alarmLevel||0)+30,0,100);const scenario=e.battlefield.scenario;
    if(scenario==='gate_defense'){
      e.maxReinforcements=9;queueTacticalGroup('gate_spearman',2,1,'Gate guard sortie');queueTacticalGroup('wall_archer',2,1,'Alarm on the wall');queueTacticalGroup('captain',1,3,'Watch command response');addLog(`<strong>Gate alarm:</strong> ${escapeHtml(npc?.name||'The guard')} sounds the alarm. Two archers take positions on the wall while shielded spearmen prepare to hold the gateway.`,'event');return;
    }
    if(scenario==='wartime_field'){
      e.maxReinforcements=10;queueTacticalGroup('line_infantry',3,1,'Nearby infantry line');queueTacticalGroup('archer',2,2,'Archer support');queueTacticalGroup('cavalry',2,3,'Mounted reserve');queueTacticalGroup('captain',1,2,'Field officer');addLog(`<strong>Military alarm:</strong> ${escapeHtml(npc?.name||'A soldier')} calls the formation. Infantry begin forming a shield line; archers move behind them and mounted troops are signalled from the flank.`,'event');return;
    }
    requestCombatHelpV413(npc,kind,reason);ensureTacticalBattleState();
  }
  function combatantFromNpc(npc,role='ally',arrivedRound=0){
    ensureNpcCombatIdentity(npc,role);const p=npcCombatProfile(npc),key=npc.combatClassKey,tpl=COMBAT_CLASS_TEMPLATES[key]||COMBAT_CLASS_TEMPLATES.watchman;if(key==='captain'){p.hp=Math.round(p.hp*1.35);p.defense+=2;p.damage=[p.damage[0]+2,p.damage[1]+3];p.xp=Math.round(p.xp*1.5);}if(key==='shieldman'||key==='shield_guard'||key==='gate_spearman')p.defense+=1;if(key==='cavalry')p.damage=[p.damage[0]+2,p.damage[1]+4];
    const position=key==='wall_archer'?'wall':tpl.role==='rear'?'rear':tpl.role==='flank'?'flank':'front';return {npcId:npc.id,name:npc.name,occupation:npc.occupation,combatClass:npc.combatClass,combatClassKey:key,rank:npc.rank,loadout:npc.combatLoadout,formationRole:tpl.role,position,role,hp:p.hp,maxHp:p.hp,defense:p.defense,dmg:p.damage,xp:p.xp,gold:p.gold,attacks:key==='wall_archer'||key==='archer'?['looses an arrow','takes a measured shot','fires into an opening']:key==='cavalry'?['drives in with a lance','slashes from the saddle','makes a passing charge']:key==='battle_mage'?['casts a force bolt','throws a warded flame','lashes out with battle magic']:['thrusts with a spear','strikes around the shield','jabs and recovers behind guard'],arrivedRound};
  }
  function formationDefenseBonusV415(targetId,actionText){
    const e=ensureReactiveCombatState();if(!e)return {bonus:0,blocked:''};ensureTacticalBattleState();const all=[{npcId:e.npcId,formationRole:e.formationRole,position:e.position||'front',combatClassKey:findNpcById(e.npcId)?.combatClassKey},...(e.allies||[])];const t=all.find(x=>x.npcId===targetId)||all[0];const melee=/\b(punch|kick|jab|hook|slash|stab|swing|thrust|grapple|headbutt)\b/i.test(String(actionText||''));if(t?.position==='wall'&&melee)return {bonus:7,blocked:'The target is on the wall above normal melee reach.'};let bonus=0;if(/shield wall|shield line/.test(e.battlefield?.formation||'')&&t?.formationRole==='front')bonus+=2;if(t?.position==='rear'&&e.allies.some(a=>a.formationRole==='front'&&a.hp>0))bonus+=2;if(t?.position==='flank')bonus+=1;return {bonus,blocked:''};
  }
  function buildActionResolutionV414(segments){
    const r=buildActionResolutionV413(segments);if(!r?.has_action||!state.game.combat)return r;const f=formationDefenseBonus(r.target_npc_id,r.action_text);if(f.blocked){r.success=false;r.blocked_reason=f.blocked;r.margin=-99;}else if(f.bonus){r.difficulty+=f.bonus;r.success=!r.blocked_reason&&r.total>=r.difficulty;r.margin=r.blocked_reason?-99:r.total-r.difficulty;}r.battlefield=ensureTacticalBattleState();return r;
  }
  function tacticalAttackMove(a,e){
    const key=a.combatClassKey||'';if(key==='wall_archer')return 'looses an arrow from the wall';if(key==='archer')return 'fires from behind the infantry line';if(key==='cavalry')return a.arrivedRound+1>=e.round?'wheels along the flank looking for an opening':'drives in with a mounted charge';if(key==='shieldman'||key==='shield_guard'||key==='gate_spearman')return 'keeps the shield line intact and thrusts from behind the rim';if(key==='captain')return 'calls an opening and steps in with a controlled officer’s strike';if(key==='battle_mage')return 'casts from behind the line';return pick(a.attacks||['attacks']);
  }
  function allyCombatTurn(ally){
    const e=ensureReactiveCombatState();if(!e||ally.hp<=0)return;ensureTacticalBattleState();const move=tacticalAttackMove(ally,e);let accuracy=Math.floor((ally.defense||10)/3);if(e.battlefield.scenario==='wartime_field'&&ally.formationRole==='front')accuracy+=1;if(e.battlefield.scenario==='gate_defense'&&ally.position==='wall')accuracy+=2;if(e.battlefield.formation.includes('shield')&&ally.formationRole==='front')accuracy+=1;const roll=randInt(1,20)+accuracy,def=playerCombatDefense();if(roll>=def){let dmg=randInt(ally.dmg?.[0]||2,ally.dmg?.[1]||6);if(ally.combatClassKey==='cavalry'&&ally.arrivedRound+1===e.round)dmg+=3;applyReactiveDamageToPlayer(ally,dmg,move);}else addLog(`<strong>${escapeHtml(ally.name)}</strong>, ${escapeHtml(ally.combatClass||ally.occupation)}, ${escapeHtml(move)}, but you avoid the attack.`,'ai-narration');
  }
  function processCombatSupportRoundV414(){
    const e=ensureReactiveCombatState();if(!e)return;ensureTacticalBattleState();e.round+=1;processReinforcementArrivals();if(!state.game.combat)return;ensureTacticalBattleState();const eligible=e.allies.filter(a=>a.hp>0&&a.arrivedRound<e.round);let attackers=[];if(e.battlefield.scenario==='gate_defense'){attackers=[...eligible.filter(a=>a.position==='wall').slice(0,2),...eligible.filter(a=>a.position==='front').slice(0,1)];}else if(e.battlefield.scenario==='wartime_field'){attackers=[...eligible.filter(a=>a.formationRole==='front').slice(0,1),...eligible.filter(a=>a.formationRole==='rear').slice(0,1),...eligible.filter(a=>a.formationRole==='flank').slice(0,1)];}else attackers=eligible.slice(0,Math.min(2,eligible.length));const seen=new Set();attackers=attackers.filter(a=>!seen.has(a.npcId)&&seen.add(a.npcId));for(const a of attackers){if(!state.game.combat)break;allyCombatTurn(a);}const holding=eligible.length-attackers.length;if(holding>0&&state.game.combat)addLog(`<strong>${escapeHtml(e.battlefield.name)}:</strong> ${holding} other combatant${holding===1?'':'s'} maintain ${escapeHtml(e.battlefield.formation)} instead of all crowding the same opening.`,'system');
  }
  function promoteNextCombatAlly(e){
    const next=e.allies.shift();if(!next)return false;addLog(`<strong>${escapeHtml(next.name)}</strong> — ${escapeHtml(next.combatClass||next.occupation)} — steps into the immediate fighting position while the formation holds around them.`,'event');Object.assign(e,{name:next.name,npcId:next.npcId,level:Math.max(1,Math.round((next.defense||10)/3)),hp:next.hp,maxHp:next.maxHp,dmg:next.dmg,xp:next.xp,gold:next.gold,attacks:next.attacks,statuses:[],lastImpact:null,combatClass:next.combatClass,combatClassKey:next.combatClassKey,formationRole:next.formationRole,position:next.position,loadout:next.loadout});return true;
  }
  function combatSupportHud(e){
    ensureReactiveCombatState();ensureTacticalBattleState();const allies=(e.allies||[]).filter(a=>a.hp>0),incoming=e.reinforcementQueue||[];return `<div class="combat-support-hud"><div><strong>${escapeHtml(e.battlefield.name)}</strong><span>${escapeHtml(e.battlefield.formation)} • ${escapeHtml(e.battlefield.strategy)}</span></div>${e.combatClass?`<div><strong>Primary</strong><span>${escapeHtml(e.name)} — ${escapeHtml(e.combatClass)}${e.loadout?.weapon?` • ${escapeHtml(e.loadout.weapon)}`:''}</span></div>`:''}${allies.length?`<div><strong>Other hostiles</strong><span>${allies.map(a=>`${escapeHtml(a.name)} — ${escapeHtml(a.combatClass||a.occupation)} [${escapeHtml(a.position)}] (${a.hp}/${a.maxHp})`).join(' • ')}</span></div>`:''}${incoming.length?`<div><strong>Incoming units</strong><span>${incoming.map(q=>`${escapeHtml(titleCase(q.role))} ×${q.count} — ~${q.eta} round${q.eta===1?'':'s'}`).join(' • ')}</span></div>`:''}</div>`;
  }
  function processReinforcementArrivalsV414(){
    const e=ensureReactiveCombatState();if(!e)return;ensureTacticalBattleState();const arriving=[];for(const q of e.reinforcementQueue){q.eta-=1;if(q.eta<=0)arriving.push(q);}e.reinforcementQueue=e.reinforcementQueue.filter(q=>q.eta>0);for(const q of arriving){const entries=[];for(let i=0;i<q.count&&e.allies.length<e.maxReinforcements;i++){const npc=makeReinforcementNpc(q.role),combatant=combatantFromNpc(npc,q.role,e.round);e.allies.push(combatant);entries.push(`${npc.name} (${npc.combatClass})`);}if(entries.length){addLog(`<strong>Reinforcements arrive:</strong> ${escapeHtml(entries.join(', '))}. They take their assigned places in the ${escapeHtml(e.battlefield.formation)}.`,'event');persistSceneChange('reinforcements_arrive',`${entries.join(', ')} joined the fight.`,{entries,role:q.role,formation:e.battlefield.formation});}}
  }
  function isVisibleEnemyAtGate(){const p=buildSocialPerception(),k=currentKingdom();return ['hostile','kill_on_sight'].includes(p.local_race_policy)||currentHeat()>=35||Number(k?.playerRep||0)<=-45;}
  function startCombatAgainstNpc(npc,context='outskirts'){const p=npcCombatProfile(npc);startCombat({name:npc.name,level:Math.max(1,Math.round(p.defense/3)),hp:p.hp,dmg:p.damage,xp:p.xp,gold:[0,0],attacks:['thrust','shield bash','counter']},context);state.game.combat.npcId=npc.id;ensureNpcCombatIdentity(npc,'gate_spearman');ensureTacticalBattleState();}
  function applyGateApproachReaction(){
    if(state.game.combat||!isVisibleEnemyAtGate())return;const guard=makeGuardNpc();guard.occupation='gate guard';ensureNpcCombatIdentity(guard,'gate_spearman');addLog(`<strong>${escapeHtml(guard.name)}</strong>, a ${escapeHtml(guard.combatClass)}, recognises you as a visible threat outside ${escapeHtml(currentKingdom().capital)}. He backs toward the gate and sounds the alarm rather than trying to duel you alone.`,'event');startCombatAgainstNpc(guard,'outskirts');requestCombatHelp(guard,'watch','Gate alarm raised against a visible enemy');
  }

  // Named-NPC deaths transfer the actual purse rather than generating generic gold.
  function lootNamedCombatant(npcId,name){const n=npcId?findNpcById(npcId):null;if(!n)return 0;ensureNpcEconomyData(n);const amount=walletCopper(n.currency);if(amount>0){transferCurrency(n,state.character,amount,{from:`npc:${n.id}`,to:'player',reason:`Looted ${name||n.name}`});addLog(`You recover <strong>${formatCopper(amount)}</strong> from ${escapeHtml(n.name)}'s purse.`,'event');}return amount;}
  const settleGroupPrimaryDefeatV413=settleGroupPrimaryDefeat;
  settleGroupPrimaryDefeat=function(e){if(e?.npcId){const saved=e.gold;e.gold=[0,0];lootNamedCombatant(e.npcId,e.name);settleGroupPrimaryDefeatV413(e);e.gold=saved;}else settleGroupPrimaryDefeatV413(e);};
  const finishCombatVictoryV413Economy=finishCombatVictory;
  finishCombatVictory=function(){const e=state.game.combat;if(e?.npcId){const n=findNpcById(e.npcId);if(n&&!n.dead){lootNamedCombatant(e.npcId,e.name);e.gold=[0,0];}}return finishCombatVictoryV413Economy();};

  // AI snapshot: tactical battlefield + real purses/transactions.
  function aiWorldSnapshotV415(){
    const snap=aiWorldSnapshotV413();ensureCurrencySystem();const e=state.game.combat;if(e&&snap?.scene?.combat){ensureTacticalBattleState();snap.scene.combat.battlefield={...e.battlefield,primary:{name:e.name,class:e.combatClass||findNpcById(e.npcId)?.combatClass||'Combatant',position:e.position||'front'},allies:(e.allies||[]).map(a=>({name:a.name,class:a.combatClass,role:a.formationRole,position:a.position,hp:a.hp,max_hp:a.maxHp,loadout:a.loadout})),incoming:(e.reinforcementQueue||[]).map(q=>({role:q.role,count:q.count,eta:q.eta}))};snap.scene.combat.instruction='Treat named combatants, classes, positions and formation as hard tactical state. Shield walls protect front/rear lines; wall archers are elevated; cavalry manoeuvre on flanks. Do not narrate everyone as an interchangeable guard.';}
    snap.player_mechanics.currency={wallet:{...state.character.currency},total_copper:walletCopper(state.character.currency),display:formatWallet(state.character.currency),rates:{platinum_to_gold:10,gold_to_silver:10,silver_to_copper:10}};snap.economy={currency_source_of_truth:true,rates:{platinum:1000,gold:100,silver:10,copper:1},recent_transactions:(state.world.transactions||[]).slice(-8),instruction:'Coin is conserved in NPC transactions. Purchases, sales, tips, bribes and rewards involving a named NPC should use currency_transfer; JavaScript validates actual balances.'};return snap;
  }

  // Reliable explicit payment fallback after an AI turn.
  async function submitRoleplayInputV415(prefill=null){const raw=String(prefill??document.getElementById('roleplayInput')?.value??'').trim();const npc=state.game.activeNpc;const tx=(state.world.transactions||[]).length;await submitRoleplayInputV413(prefill);if(npc&&raw)explicitEconomyFallback(raw,npc,tx);saveGame(false);renderGame();}



  // ============================================================
  // V4.15 — MULTI-COMBATANT COMBAT FIXES
  // ============================================================

  function classifyFreeformAction(text){
    const t=String(text||"").toLowerCase();

    if(/\b(decapitat(?:e|es|ed|ing)?|behead(?:s|ed|ing)?|murder(?:s|ed|ing)?|execute(?:s|d|ing)?|slit(?:s|ting)?\s+.*throat|chop(?:s|ped|ping)?\s+.*head|cut(?:s|ting)?\s+.*head|kill(?:s|ed|ing)?)\b/.test(t))
      return "lethal_attack";

    if(/\b(attack(?:s|ed|ing)?|stab(?:s|bed|bing)?|slash(?:es|ed|ing)?|slice(?:s|d|ing)?|swing(?:s|ing)?|swung|strike(?:s|ing)?|struck|punch(?:es|ed|ing)?|jab(?:s|bed|bing)?|hook(?:s|ed|ing)?|uppercut(?:s|ting)?|kick(?:s|ed|ing)?|elbow(?:s|ed|ing)?|knee(?:s|d|ing)?|headbutt(?:s|ed|ing)?|shoot(?:s|ing)?|shot|hit(?:s|ting)?|smash(?:es|ed|ing)?|bash(?:es|ed|ing)?|choke(?:s|d|ing)?|strangle(?:s|d|ing)?|bite(?:s|biting)?|bit|maul(?:s|ed|ing)?|impale(?:s|d|ing)?|cleave(?:s|d|ing)?|hack(?:s|ed|ing)?|chop(?:s|ped|ping)?|thrust(?:s|ing)?|lunge(?:s|d|ing)?|tackle(?:s|d|ing)?|grapple(?:s|d|ing)?|trip(?:s|ped|ping)?)\b/.test(t))
      return "attack";

    if(state.game?.combat && /\b(go for|rush|charge|close on|drive at|go at)\b/.test(t) &&
       /\b(him|her|them|guard|captain|enemy|opponent|hand|arm|leg|head|chin|jaw|throat|chest)\b/.test(t))
      return "attack";

    if(/\b(steal|pickpocket|rob|snatch|burglar|break in|take .*without)\b/.test(t))return "theft";
    if(/\b(break|smash|burn|set fire|destroy|cut down|kick down|shatter|damage)\b/.test(t))return "scene_change";
    if(/\b(run|flee|escape|climb|jump|vault|swim|crawl|fly|teleport|blink|move|walk|enter|leave)\b/.test(t))return "movement";
    if(/\b(search|inspect|study|watch|listen|investigate|examine|look for|sense)\b/.test(t))return "perception";
    if(/\b(cast|spell|summon|invoke|channel|magic|aura)\b/.test(t))return "power";
    return "general";
  }

  function preciseCombatBodyTarget(text){
    const t=String(text||"").toLowerCase();
    if(/\b(sword hand|weapon hand|right hand|left hand|hand|fingers?|wrist)\b/.test(t))return "weapon hand";
    if(/\b(forearm|right arm|left arm|upper arm|arm|shoulder)\b/.test(t))return "arm";
    if(/\b(knee|ankle|shin|calf|thigh|right leg|left leg|leg)\b/.test(t))return "leg";
    if(/\b(nose|chin|jaw|face|mouth|temple|skull|head)\b/.test(t))return "head";
    if(/\b(neck|throat)\b/.test(t))return "neck";
    if(/\b(chest|ribs|stomach|gut|abdomen|torso|heart|back|spine)\b/.test(t))return "torso";
    return "unspecified";
  }

  function targetedInjurySeverity(resolution){
    if(!resolution?.success)return null;
    const part=resolution.targeted_body_part;
    if(!part||part==="unspecified")return null;
    const damage=Number(resolution.resolved_damage||0),margin=Number(resolution.margin||0);
    if(resolution.lethal_success)return "severe";
    if(damage>=12||margin>=8)return "severe";
    if(damage>=5||margin>=3)return "minor";
    return null;
  }

  function buildActionResolutionV415(segments){
    const r=buildActionResolutionV414(segments);
    if(!r?.has_action)return r;

    const inferredKind=classifyFreeformAction(r.action_text);
    if(["attack","lethal_attack"].includes(inferredKind) && !["attack","lethal_attack"].includes(r.action_kind)){
      r.action_kind=inferredKind;
      const target=freeformTargetNpc(r.action_text);
      if(target){
        r.target_npc_id=target.id;
        r.target_name=target.name;
        r.target_occupation=target.occupation;
        r.target_combat_profile=npcCombatProfile(target);
      }
    }

    if(["attack","lethal_attack"].includes(r.action_kind)){
      r.targeted_body_part=preciseCombatBodyTarget(r.action_text);

      if(r.target_combat_profile && (!Number.isFinite(Number(r.resolved_damage)) || Number(r.combat_damage_cap||0)===0)){
        r.stat=freeformAttackStat(r.action_text);
        r.stat_score=Number(state.character.stats?.[r.stat]||8);

        let diff=Number(r.target_combat_profile.defense||11);
        const t=String(r.action_text||"").toLowerCase();
        if(/\b(jab|punch|hook|uppercut|kick|elbow|knee)\b/.test(t))diff=Math.max(8,diff-1);
        if(r.targeted_body_part!=="unspecified" && r.action_kind!=="lethal_attack")diff+=1;

        const supportBonus=Math.min(10,Math.floor((r.capability_support?.[0]?.score||0)/12));
        r.modifier=Math.floor(r.stat_score/4)+supportBonus;
        r.total=Number(r.d20||randInt(1,20))+r.modifier;
        r.difficulty=diff;
        r.success=!r.blocked_reason&&r.total>=diff;
        r.margin=r.blocked_reason?-99:r.total-diff;

        const unarmed=/\b(jab|punch|hook|uppercut|kick|elbow|knee|headbutt)\b/.test(t);
        const base=4+Math.floor(r.stat_score/3)+Math.max(1,state.character.level||1);
        const weaponBonus=unarmed?0:Math.floor((r.weapon_power_score||0)/7);
        r.combat_damage_cap=Math.max(3,base+weaponBonus+Math.max(0,r.margin));
        r.resolved_damage=r.success?clamp(Math.round(base+weaponBonus+Math.max(0,r.margin*.7)),1,r.combat_damage_cap):0;
      }

      r.targeted_injury_severity=targetedInjurySeverity(r);
    }
    return r;
  }

  function applyCombatInjuryPenalty(targetNpcId,part,severity){
    const e=ensureReactiveCombatState();if(!e)return;
    const rec=combatantRecordForNpcId(targetNpcId);if(!rec)return;
    const c=rec.combatant;
    c.combatInjuries=Array.isArray(c.combatInjuries)?c.combatInjuries:[];
    c.combatInjuries.push({part,severity});
    const severe=severity==="severe"||severity==="severed";

    if(/hand|arm/.test(part)){
      c.dmg=Array.isArray(c.dmg)?c.dmg:[2,6];
      c.dmg=[Math.max(1,c.dmg[0]-(severe?2:1)),Math.max(2,c.dmg[1]-(severe?4:2))];
      c.defense=Math.max(6,(c.defense||10)-(severe?2:1));
      c.weaponArmImpaired=true;
    }else if(/leg/.test(part)){
      c.defense=Math.max(6,(c.defense||10)-(severe?3:1));
      c.mobilityImpaired=true;
    }else if(/head|neck/.test(part)){
      c.defense=Math.max(6,(c.defense||10)-(severe?2:1));
    }else if(/torso/.test(part)&&severe){
      c.dmg=Array.isArray(c.dmg)?c.dmg:[2,6];
      c.dmg=[Math.max(1,c.dmg[0]-1),Math.max(2,c.dmg[1]-2)];
    }
  }

  function damageCombatTargetV415(targetNpcId,dmg,status=null,resolution=null){
    const e=ensureReactiveCombatState();if(!e)return;
    dmg=Math.max(0,Math.round(Number(dmg)||0));
    const rec=combatantRecordForNpcId(targetNpcId);

    if(!rec||rec.kind==="primary"){
      const before=e.hp;
      e.hp=Math.max(0,e.hp-dmg);
      e.lastDamageEvent={target:e.name,targetNpcId:e.npcId||targetNpcId,before,after:e.hp,damage:before-e.hp,part:resolution?.targeted_body_part||null,action:resolution?.action_text||""};
      if(status&&["staggered","blinded"].includes(status))addEnemyStatus(status,1);
      if(before!==e.hp)addLog(`<strong>${escapeHtml(e.name)}</strong> loses <strong>${before-e.hp} HP</strong> (${before} → ${e.hp}).`,"system");
      return;
    }

    const a=rec.combatant,before=a.hp;
    a.hp=Math.max(0,a.hp-dmg);
    e.lastDamageEvent={target:a.name,targetNpcId:a.npcId,before,after:a.hp,damage:before-a.hp,part:resolution?.targeted_body_part||null,action:resolution?.action_text||""};
    if(before!==a.hp)addLog(`<strong>${escapeHtml(a.name)}</strong> loses <strong>${before-a.hp} HP</strong> (${before} → ${a.hp}).`,"system");

    if(a.hp<=0){
      const impact=resolution?.consequence_profile?.medium||"combat";
      addLog(`<strong>${escapeHtml(a.name)}</strong> is taken out of the fight by the attack.`,"event");
      markCombatNpcDefeated(a.npcId,a.name,impact);
      persistSceneChange("combatant_defeated",`${a.name} was defeated here.`,{npcId:a.npcId,name:a.name,medium:impact});
      e.allies=e.allies.filter(x=>x!==a);
    }
  }

  function enforceFreeformActionResultV415(result,resolution){
    result=enforceFreeformActionResultV414(result,resolution);
    if(!resolution?.has_action)return result;
    result.intents=Array.isArray(result.intents)?result.intents:[];

    if(["attack","lethal_attack"].includes(resolution.action_kind) &&
       resolution.success && Number(resolution.resolved_damage||0)>0 && resolution.target_npc_id){

      if(!result.intents.some(x=>x?.type==="enemy_damage")){
        result.intents.push({
          type:"enemy_damage",
          amount:resolution.resolved_damage,
          status:resolution.margin>=5?"staggered":null,
          reason:resolution.action_text
        });
      }

      if(resolution.targeted_injury_severity &&
         resolution.target_npc_id!=="__combat_primary__" &&
         !result.intents.some(x=>x?.type==="npc_injury"&&x.target_id===resolution.target_npc_id)){
        result.intents.push({
          type:"npc_injury",
          target_id:resolution.target_npc_id,
          body_part:resolution.targeted_body_part,
          severity:resolution.targeted_injury_severity,
          cause:resolution.action_text
        });
      }
    }
    return result;
  }

  function combatantCanAttackNow(a,e){
    if(!a||a.hp<=0)return false;
    if(a.mobilityImpaired&&a.formationRole==="flank"&&Math.random()<.35)return false;
    return true;
  }

  function groupAttackAccuracyPenalty(index,total){
    if(total<=2)return 0;
    return Math.floor(index/2);
  }

  function performReinforcementAttackV415(ally,index,total){
    const e=ensureReactiveCombatState();
    if(!e||!combatantCanAttackNow(ally,e))return false;

    const move=tacticalAttackMove(ally,e);
    let accuracy=Math.floor((ally.defense||10)/3);

    if(e.battlefield?.scenario==="wartime_field"&&ally.formationRole==="front")accuracy+=1;
    if(e.battlefield?.scenario==="gate_defense"&&ally.position==="wall")accuracy+=2;
    if(/shield/.test(e.battlefield?.formation||"")&&ally.formationRole==="front")accuracy+=1;

    accuracy-=groupAttackAccuracyPenalty(index,total);

    const roll=randInt(1,20)+accuracy;
    const def=playerCombatDefense();

    if(roll>=def){
      let dmg=randInt(ally.dmg?.[0]||2,ally.dmg?.[1]||6);
      if(ally.combatClassKey==="cavalry"&&ally.arrivedRound+1>=e.round)dmg+=2;
      applyReactiveDamageToPlayer(ally,dmg,move);
    }else{
      addLog(`<strong>${escapeHtml(ally.name)}</strong> — ${escapeHtml(ally.combatClass||ally.occupation)} — ${escapeHtml(move)}, but the attack misses or is turned aside.`,"ai-narration");
    }

    ally.lastActionRound=e.round;
    return true;
  }

  function processReinforcementArrivals(){
    const e=ensureReactiveCombatState();if(!e)return;
    ensureTacticalBattleState();
    const arriving=[];

    for(const q of e.reinforcementQueue){
      q.eta-=1;
      if(q.eta<=0)arriving.push(q);
    }
    e.reinforcementQueue=e.reinforcementQueue.filter(q=>q.eta>0);

    for(const q of arriving){
      const entries=[];
      for(let i=0;i<q.count&&e.allies.length<e.maxReinforcements;i++){
        const npc=makeReinforcementNpc(q.role);
        const combatant=combatantFromNpc(npc,q.role,e.round);
        combatant.arrivedRound=Math.max(0,e.round-1);
        e.allies.push(combatant);
        entries.push(`${npc.name} (${npc.combatClass})`);
      }

      if(entries.length){
        addLog(`<strong>Reinforcements arrive:</strong> ${escapeHtml(entries.join(", "))}. They immediately join the ${escapeHtml(e.battlefield.formation)} rather than standing idle.`,"event");
        persistSceneChange("reinforcements_arrive",`${entries.join(", ")} joined the fight.`,{entries,role:q.role,formation:e.battlefield.formation});
      }
    }
  }

  function processCombatSupportRoundV415(){
    const e=ensureReactiveCombatState();if(!e)return;
    ensureTacticalBattleState();
    e.round+=1;
    processReinforcementArrivals();
    if(!state.game.combat)return;
    ensureTacticalBattleState();

    const eligible=e.allies.filter(a=>a.hp>0&&a.arrivedRound<=e.round);
    if(!eligible.length)return;

    const ranged=eligible.filter(a=>a.position==="wall"||a.formationRole==="rear");
    const front=eligible.filter(a=>a.formationRole==="front");
    const flank=eligible.filter(a=>a.formationRole==="flank");
    const command=eligible.filter(a=>a.formationRole==="command");
    const others=eligible.filter(a=>!ranged.includes(a)&&!front.includes(a)&&!flank.includes(a)&&!command.includes(a));

    let actionOrder;
    if(e.battlefield?.scenario==="gate_defense"){
      actionOrder=[...ranged,...front.slice(0,3),...command,...flank,...others];
    }else if(e.battlefield?.scenario==="wartime_field"){
      actionOrder=[...ranged,...front.slice(0,3),...flank.slice(0,2),...command,...others];
    }else{
      actionOrder=[...front.slice(0,3),...ranged,...flank.slice(0,2),...command,...others];
    }

    const seen=new Set();
    actionOrder=actionOrder.filter(a=>a?.npcId&&!seen.has(a.npcId)&&seen.add(a.npcId));

    const attackers=actionOrder.slice(0,6);
    attackers.forEach((a,i)=>{
      if(state.game.combat)performReinforcementAttack(a,i,attackers.length);
    });

    const holding=eligible.filter(a=>!attackers.includes(a));
    for(const a of holding){
      a.lastActionRound=e.round;
      addLog(`<strong>${escapeHtml(a.name)}</strong> — ${escapeHtml(a.combatClass||a.occupation)} — maintains ${escapeHtml(a.position||a.formationRole||"position")} in the ${escapeHtml(e.battlefield.formation)}, covering the active attackers and waiting for a clean opening.`,"system");
    }
  }

  function combatSupportHudV415(e){
    ensureReactiveCombatState();
    ensureTacticalBattleState();
    const allies=(e.allies||[]).filter(a=>a.hp>0),incoming=e.reinforcementQueue||[];
    const last=e.lastDamageEvent;

    return `<div class="combat-support-hud">
      <div><strong>${escapeHtml(e.battlefield.name)}</strong><span>${escapeHtml(e.battlefield.formation)} • ${escapeHtml(e.battlefield.strategy)}</span></div>
      ${last?`<div class="last-damage-readout"><strong>Last mechanical hit</strong><span>${escapeHtml(last.target)} −${last.damage} HP • ${last.before} → ${last.after}${last.part&&last.part!=="unspecified"?` • ${escapeHtml(last.part)}`:""}</span></div>`:""}
      ${e.combatClass?`<div><strong>Primary</strong><span>${escapeHtml(e.name)} — ${escapeHtml(e.combatClass)} • HP ${e.hp}/${e.maxHp}${e.loadout?.weapon?` • ${escapeHtml(e.loadout.weapon)}`:""}</span></div>`:""}
      ${allies.length?`<div><strong>Other active attackers</strong><div class="combatant-list">${allies.map(a=>`
        <div class="combatant-mini">
          <span>${escapeHtml(a.name)} — ${escapeHtml(a.combatClass||a.occupation)} [${escapeHtml(a.position||a.formationRole||"line")}]</span>
          <span>${a.hp}/${a.maxHp} HP</span>
          <div class="mini-hp"><i style="width:${Math.max(0,a.hp/a.maxHp*100)}%"></i></div>
        </div>`).join("")}</div></div>`:""}
      ${incoming.length?`<div><strong>Incoming units</strong><span>${incoming.map(q=>`${escapeHtml(titleCase(q.role))} ×${q.count} — ~${q.eta} round${q.eta===1?"":"s"}`).join(" • ")}</span></div>`:""}
    </div>`;
  }



  // ============================================================
  // V4.16 — SIMULATION INTEGRITY LAYER
  // State resolves first. Narration describes that state second.
  // ============================================================

  const RANGE_INDEX={engaged:0,close:1,short:2,medium:3,long:4,elevated:5};
  const RANGE_LABEL=['Engaged','Close','Short','Medium','Long','Elevated'];

  function ensureSimulationIntegrityData(c=state.character,w=state.world,g=state.game){
    if(!c||!w||!g)return;
    w.lawCases=Array.isArray(w.lawCases)?w.lawCases:[];
    w.ownershipLedger=Array.isArray(w.ownershipLedger)?w.ownershipLedger:[];
    w.itemSerial=Number(w.itemSerial||1);
    w.serviceNpcs=w.serviceNpcs&&typeof w.serviceNpcs==='object'?w.serviceNpcs:{};
    w.marketDynamics=w.marketDynamics&&typeof w.marketDynamics==='object'?w.marketDynamics:{};
    w.rumourRetellings=w.rumourRetellings&&typeof w.rumourRetellings==='object'?w.rumourRetellings:{};
    w.rumours=Array.isArray(w.rumours)?w.rumours:[];
    w.rumourCounter=Number(w.rumourCounter||1);
    w.rumours=w.rumours.map((r,i)=>typeof r==='string'?{id:`rum${w.rumourCounter++}`,claim:r,source:'local gossip',reliability:55,createdDay:w.day,kingdomId:g.kingdomId,originLocation:g.location,severity:4,knownBy:[],knownLocations:[`${g.kingdomId||'none'}::${g.location||'unknown'}`],distortion:8,retellings:{}}:r);
    g.custody=g.custody||null;
    g.companionOrders=g.companionOrders||{mode:'balanced',targetNpcId:null,text:'Act independently and protect the group.'};
    g.playerCombatPosition=g.playerCombatPosition||{range:'engaged',cover:'none',elevation:'ground',shift:0};g.playerCombatPosition.shift=Number(g.playerCombatPosition.shift||0);
    g.lastResolvedOutcome=g.lastResolvedOutcome||null;
    g.debugSimulation??=false;
    c.carrying=c.carrying||{};
    c.itemDurability=c.itemDurability||{};
    c.mount=c.mount||null;
    c.bonds=c.bonds||{};
    syncOwnershipLedger();
    updateCarryingState();
    for(const n of (w.npcs||[])){ensureNpcLifeState(n);ensureNpcResourceState(n);updateNpcBond(n);}
  }

  // ---------- Authoritative outcome engine ----------
  function rangeForCombatant(targetId){
    const e=state.game.combat;if(!e)return state.game.activeNpc?'engaged':'close';
    let base='close';
    if(!targetId||targetId==='__combat_primary__'||targetId===e.npcId){
      if(e.position==='wall')base='elevated';
      else if(e.position==='rear')base='medium';
      else if(e.position==='flank')base='short';
      else base='engaged';
    }else{
      const a=(e.allies||[]).find(x=>x.npcId===targetId);
      if(a){if(a.position==='wall')base='elevated';else if(a.position==='rear')base='medium';else if(a.position==='flank')base='short';else if(a.position==='front')base='engaged';}
    }
    if(base==='elevated')return base;
    const shift=clamp(Number(state.game.playerCombatPosition?.shift||0),-1,3);
    return RANGE_LABEL[clamp((RANGE_INDEX[base]??1)+shift,0,4)].toLowerCase();
  }
  function actionReach(text){
    const t=String(text||'').toLowerCase();
    if(/\b(bow|crossbow|arrow|shoot|shot|longbow)\b/.test(t))return 4;
    if(/\b(lightning|fireball|bolt|spell|magic|smite|blast|ray|telekin)\b/.test(t))return 4;
    if(/\b(throw|thrown|javelin)\b/.test(t))return 3;
    if(/\b(spear|halberd|polearm|pike)\b/.test(t))return 1;
    if(/\b(sword|axe|mace|dagger|knife|punch|jab|hook|kick|grapple|slice|slash|stab|lunge|thrust)\b/.test(t))return 0;
    return 1;
  }
  function lineOfSightState(targetId){
    const scene=ensureSceneState();
    const cover=scene.integrity?.cover||{};
    const targetRange=rangeForCombatant(targetId);
    let penalty=0,blocked=false,reason='clear';
    if(targetRange==='elevated'&&cover.wallObstruction){blocked=false;}
    if(cover.player==='heavy')penalty+=2;
    if(cover.enemy==='heavy')penalty+=3;
    if(scene.integrity?.smoke)penalty+=2;
    return {blocked,penalty,reason};
  }
  function carryingPenalty(){
    const s=updateCarryingState();
    return s.state==='Overloaded'?4:s.state==='Heavy'?2:0;
  }
  function detectPositionIntent(text){
    const t=String(text||'').toLowerCase();
    if(/\b(back away|retreat a few|step back|create distance|fall back)\b/.test(t))return {kind:'range',direction:'out'};
    if(/\b(close distance|rush forward|rush him|rush her|charge forward|move in|step in)\b/.test(t))return {kind:'range',direction:'in'};
    if(/\b(take cover|duck behind|hide behind|use .* as cover)\b/.test(t))return {kind:'cover',level:'heavy'};
    if(/\b(leave cover|step out from cover|abandon cover)\b/.test(t))return {kind:'cover',level:'none'};
    return null;
  }
  function detectEnvironmentEffect(text){
    const t=String(text||'').toLowerCase();
    if(/\b(overturn|flip|kick over)\b.*\b(table|cart|bench)\b/.test(t))return {kind:'cover_create',object:(t.match(/table|cart|bench/)||['object'])[0],cover:'heavy'};
    if(/\b(smash|break|shatter)\b.*\bwindow\b/.test(t))return {kind:'break_window',object:'window'};
    if(/\b(ignite|light|set fire|burn)\b.*\b(hay|oil|curtain|wood|building|tavern)\b/.test(t))return {kind:'fire',object:(t.match(/hay|oil|curtain|wood|building|tavern/)||['material'])[0]};
    if(/\b(cut|slice|sever)\b.*\b(rope|bridge rope|support rope)\b/.test(t))return {kind:'cut_rope',object:'rope'};
    if(/\b(bar|lock|close|slam)\b.*\bdoor|gate\b/.test(t))return {kind:'block_route',object:(t.match(/door|gate/)||['door'])[0]};
    return null;
  }
  function buildIntegrityOutcome(r){
    const out={id:`out-${state.game.turn}-${Date.now()}`,action:r.action_text||'',kind:r.action_kind||'none',success:!!r.success,targetNpcId:r.target_npc_id||null,target:r.target_name||null,state_changes:[],range:null,line_of_sight:null,blocked_reason:r.blocked_reason||'',authoritative:true};
    if(!r?.has_action)return out;
    const carry=carryingPenalty();
    if(carry && !r.blocked_reason){r.difficulty=Number(r.difficulty||11)+carry;r.success=Number(r.total||0)>=r.difficulty;r.margin=Number(r.total||0)-r.difficulty;out.carry_penalty=carry;}
    if(['attack','lethal_attack'].includes(r.action_kind)&&r.target_npc_id){
      const range=rangeForCombatant(r.target_npc_id),ri=RANGE_INDEX[range]??1,reach=actionReach(r.action_text),los=lineOfSightState(r.target_npc_id);out.range={band:range,index:ri,reach};out.line_of_sight=los;
      const charge=/\b(lunge|rush|charge|close distance|leap)\b/i.test(r.action_text||'');
      if(range==='elevated'&&reach<4){r.success=false;r.resolved_damage=0;r.blocked_reason='The target is elevated and outside melee reach.';}
      else if(ri>reach){
        if(charge&&ri-reach<=1&&range!=='elevated'){out.state_changes.push({type:'range_close',target:r.target_npc_id});}
        else{r.success=false;r.resolved_damage=0;r.blocked_reason=`Target is at ${range} range; this action cannot reach them.`;}
      }
      if(los.blocked){r.success=false;r.resolved_damage=0;r.blocked_reason='Line of sight is blocked.';}
      else if(los.penalty&&r.success){r.difficulty+=los.penalty;r.success=r.total>=r.difficulty;r.margin=r.total-r.difficulty;if(!r.success)r.resolved_damage=0;}
      if(r.success&&Number(r.resolved_damage||0)>0)out.state_changes.push({type:'damage',target:r.target_npc_id,amount:r.resolved_damage,part:r.targeted_body_part||null});
    }
    const pos=detectPositionIntent(r.action_text);if(pos)out.state_changes.push({type:'position',...pos});
    const env=detectEnvironmentEffect(r.action_text);if(env&&r.success)out.state_changes.push({type:'environment',...env});
    if(!r.success){r.resolved_damage=0;r.lethal_success=false;}
    if(["attack","lethal_attack"].includes(r.action_kind) && typeof previewNpcReaction==="function")r.npc_reaction=previewNpcReaction(r);
    out.success=!!r.success;out.blocked_reason=r.blocked_reason||'';out.resolved_damage=Number(r.resolved_damage||0);out.injury=r.targeted_injury_severity||null;state.game.lastResolvedOutcome=out;return out;
  }
  function buildActionResolutionV418(segments){const r=buildActionResolutionV415(segments);if(r?.has_action)r.integrity_outcome=buildIntegrityOutcome(r);return r;}
  function enforceFreeformActionResult(result,resolution){
    result=enforceFreeformActionResultV415(result,resolution);const out=resolution?.integrity_outcome;if(!out)return result;result.intents=Array.isArray(result.intents)?result.intents:[];
    if(out.success&&out.resolved_damage>0&&out.targetNpcId&&!result.intents.some(x=>x?.type==='enemy_damage'))result.intents.push({type:'enemy_damage',amount:out.resolved_damage,status:resolution.margin>=5?'staggered':null,reason:resolution.action_text});
    for(const ch of out.state_changes){
      if(ch.type==='environment'&&!result.intents.some(x=>x?.type==='scene_change'&&x.kind===ch.kind))result.intents.push({type:'scene_change',kind:ch.kind,description:`Player action changed the scene: ${resolution.action_text}`,item:ch.object});
      if(ch.type==='position')result.intents.push({type:'scene_change',kind:'player_position',description:`Player repositioned: ${resolution.action_text}`,item:JSON.stringify(ch)});
      if(ch.type==='range_close')result.intents.push({type:'scene_change',kind:'range_close',description:`Player closed distance while attacking.`,item:ch.target});
    }
    return result;
  }

  // ---------- Environment / object permanence ----------
  function sceneIntegrity(){const s=ensureSceneState();s.integrity ||= {cover:{player:'none',enemy:'none'},fire:null,smoke:false,blockedRoutes:[],interactables:[],containers:[]};if(!s.integrity.interactables.length)seedSceneInteractables(s);return s.integrity;}
  function seedSceneInteractables(scene){
    const a=state.game.areaType;const arr=[];
    if(a==='town')arr.push({id:'table',name:'heavy table',tags:['cover','movable']},{id:'window',name:'street-facing window',tags:['breakable']},{id:'door',name:'wooden doorway',tags:['blockable']});
    if(a==='outskirts'||a==='road')arr.push({id:'cart',name:'wooden cart',tags:['cover','movable']},{id:'hay',name:'dry hay',tags:['flammable']});
    if(a==='wilderness')arr.push({id:'tree',name:'large tree',tags:['cover']},{id:'brush',name:'dense brush',tags:['cover','flammable']});
    if(a==='ruin')arr.push({id:'masonry',name:'broken masonry',tags:['cover']},{id:'rope',name:'old support rope',tags:['cuttable']});
    scene.integrity.interactables=arr;
  }
  function applySceneEffectIntent(intent){
    const s=sceneIntegrity(),kind=String(intent.kind||'change'),obj=String(intent.item||intent.object||'object');
    if(kind==='cover_create'){s.cover.player='heavy';}
    if(kind==='fire'){s.fire={object:obj,intensity:35,startedTurn:state.game.turn};s.smoke=true;}
    if(kind==='block_route'&&!s.blockedRoutes.includes(obj))s.blockedRoutes.push(obj);
    if(kind==='break_window'){s.windowBroken=true;}
    if(kind==='cut_rope'){s.ropeCut=true;if(/bridge/i.test(String(intent.description||'')))s.blockedRoutes.push('bridge');}
    if(kind==='player_position'){try{const p=JSON.parse(String(intent.item||'{}'));if(p.kind==='range')state.game.playerCombatPosition.shift=clamp(Number(state.game.playerCombatPosition.shift||0)+(p.direction==='out'?1:-1),-1,3);if(p.kind==='cover'){state.game.playerCombatPosition.cover=p.level;s.cover.player=p.level;}}catch{}}
    if(kind==='range_close')state.game.playerCombatPosition.shift=clamp(Number(state.game.playerCombatPosition.shift||0)-1,-1,3);
  }
  function applyAiIntent(intent,resolution){if(intent?.type==='scene_change')applySceneEffectIntent(intent);return applyAiIntentV415(intent,resolution);}
  function processEnvironmentalHazards(){const s=sceneIntegrity();if(!state.game.combat||!s.fire)return;s.fire.intensity=clamp(s.fire.intensity+randInt(-4,8),5,100);if(Math.random()<s.fire.intensity/160){const dmg=randInt(2,6);state.character.hp=Math.max(0,state.character.hp-dmg);addLog(`<strong>Environmental fire:</strong> heat and flame catch you for ${dmg} damage.`,'system');if(state.character.hp<=0)resolveReactivePlayerDefeat('environmental fire');}}

  // ---------- Carrying capacity ----------
  function itemWeightUnits(item){const t=String(item||'').toLowerCase();if(/plate|heavy armour|heavy armor/.test(t))return 7;if(/mail|armour|armor/.test(t))return 5;if(/greatsword|halberd|pike|warhammer|shield/.test(t))return 4;if(/sword|axe|bow|crossbow|spear|mace|staff/.test(t))return 3;if(/dagger|knife|cloak|tool|gadget/.test(t))return 1.5;if(/ration|potion|draught|torch/.test(t))return .5;return 1;}
  function updateCarryingState(){if(!state.character)return {state:'Normal',weight:0,capacity:1,ratio:0};const c=state.character;const weight=(c.inventory||[]).reduce((s,x)=>s+itemWeightUnits(x),0)+Object.values(c.materials||{}).reduce((s,n)=>s+Number(n||0)*.15,0);const capacity=18+Number(c.stats?.str||8)*3+(c.mount?24:0);const ratio=weight/Math.max(1,capacity);const stateName=ratio<=.45?'Light':ratio<=.78?'Normal':ratio<=1?'Heavy':'Overloaded';c.carrying={weight:Math.round(weight*10)/10,capacity,ratio:Math.round(ratio*100)/100,state:stateName};return c.carrying;}

  // ---------- Ownership / containers ----------
  function ledgerOwnerKey(type,id){return `${type}:${id||'none'}`;}
  function syncOwnerInventory(type,id,inventory){
    const w=state.world,ownerKey=ledgerOwnerKey(type,id),counts={};for(const x of (inventory||[]))counts[x]=(counts[x]||0)+1;
    for(const [name,count] of Object.entries(counts)){let rows=w.ownershipLedger.filter(r=>r.ownerKey===ownerKey&&r.name===name&&r.status==='owned');while(rows.length<count){const rec={id:`itm${w.itemSerial++}`,name,ownerKey,ownerType:type,ownerId:id||null,status:'owned',location:type==='player'?state.game.location:null,condition:100};w.ownershipLedger.push(rec);rows.push(rec);}}
    for(const name of new Set(w.ownershipLedger.filter(r=>r.ownerKey===ownerKey&&r.status==='owned').map(r=>r.name))){const allowed=counts[name]||0;const rows=w.ownershipLedger.filter(r=>r.ownerKey===ownerKey&&r.name===name&&r.status==='owned');rows.slice(allowed).forEach(r=>{r.status='untracked';});}
  }
  function syncOwnershipLedger(){if(!state.world?.ownershipLedger||!state.character)return;syncOwnerInventory('player','player',state.character.inventory||[]);for(const n of (state.world.npcs||[]))syncOwnerInventory('npc',n.id,n.inventory||[]);}
  function ensureSceneContainers(){const s=sceneIntegrity();if(s.containers.length)return s.containers;const loc=currentLocationKey();if(state.game.areaType==='town'){const merchant=getOrCreateMarketMerchant();s.containers.push({id:`${loc}-barrel`,name:'Street barrel',ownerId:null,locked:false,contents:['Rope','Empty Bottle']},{id:`${loc}-merchant-crate`,name:`${merchant.name}'s supply crate`,ownerId:merchant.id,locked:false,contents:['Rations x1','Torch']});}else if(state.game.areaType==='ruin'){s.containers.push({id:`${loc}-chest`,name:'Weathered chest',ownerId:null,locked:Math.random()<.45,contents:[pick(['Old Coin Pouch','Iron Scrap','Ancient Charm','Torch'])]});}else{s.containers.push({id:`${loc}-satchel`,name:'Abandoned satchel',ownerId:null,locked:false,contents:[pick(['Rations x1','Herbs','Rope'])]});}return s.containers;}
  function takeContainerItem(containerId,index){const c=ensureSceneContainers().find(x=>x.id===containerId);if(!c||c.locked)return false;const item=c.contents?.[index];if(!item)return false;c.contents.splice(index,1);state.character.inventory.push(item);if(c.ownerId)recordCrime(`Theft of ${item}`,5,true);syncOwnershipLedger();updateCarryingState();addLog(`You take <strong>${escapeHtml(item)}</strong> from ${escapeHtml(c.name)}.`,'event');return true;}
  function dropInventoryItem(index){const item=state.character.inventory?.[index];if(!item)return false;state.character.inventory.splice(index,1);const containers=ensureSceneContainers();let ground=containers.find(x=>x.id.endsWith('-ground'));if(!ground){ground={id:`${currentLocationKey()}-ground`,name:'Items on the ground',ownerId:null,locked:false,contents:[]};containers.push(ground);}ground.contents.push(item);syncOwnershipLedger();updateCarryingState();addLog(`You leave <strong>${escapeHtml(item)}</strong> here.`,'event');return true;}

  // ---------- Durability ----------
  function durabilityFor(item){state.character.itemDurability ||= {};if(state.character.itemDurability[item]==null)state.character.itemDurability[item]=equipmentCondition(item);return clamp(Number(state.character.itemDurability[item]),0,100);}
  function damageItemDurability(item,amount,reason='use'){if(!item)return;const before=durabilityFor(item),after=clamp(before-Math.max(0,amount),0,100);state.character.itemDurability[item]=after;state.character.equipmentCondition[item]=after;if(after<=0&&before>0){for(const [slot,v] of Object.entries(state.character.equipment||{}))if(v===item)state.character.equipment[slot]=null;addLog(`<strong>${escapeHtml(item)}</strong> breaks and can no longer be used until repaired.`,'event');}else if(after<25&&before>=25)addLog(`<strong>${escapeHtml(item)}</strong> is now badly damaged (${after}% condition).`,'system');}
  function applyReactiveDamageToPlayer(attacker,damage,move){const before=state.character.hp;const result=applyReactiveDamageToPlayerV415(attacker,damage,move);if(before>state.character.hp){const body=state.character.equipment?.body,shield=state.character.equipment?.offHand;if(body)damageItemDurability(body,Math.max(1,Math.floor(damage/5)),'absorbing a hit');if(shield&&/shield/i.test(shield))damageItemDurability(shield,Math.max(1,Math.floor(damage/6)),'blocking');}return result;}
  function damageCombatTargetV418(targetNpcId,dmg,status=null,resolution=null){const result=damageCombatTargetV415(targetNpcId,dmg,status,resolution);if(resolution?.success){const weapon=actionWeaponInfo(resolution.action_text)?.item;if(weapon)damageItemDurability(weapon,Math.random()<.18?2:1,'combat');updateMoraleAfterHit(targetNpcId,dmg,resolution);}return result;}

  // ---------- NPC resources ----------
  function ensureNpcResourceState(n){if(!n)return;n.resources ||= {};const occ=String(n.occupation||'').toLowerCase();if(n.resources.ammo==null)n.resources.ammo=/archer|crossbow|hunter/.test(occ)?randInt(8,20):0;if(n.resources.mana==null)n.resources.mana=/mage|wizard|sorcer|cleric/.test(occ)?randInt(25,70):0;if(n.resources.healing==null)n.resources.healing=/guard|soldier|knight|mercenary|mage|cleric/.test(occ)?randInt(0,2):0;if(n.resources.stamina==null)n.resources.stamina=100;return n.resources;}
  function performReinforcementAttackV418(ally,index,total){const n=ally.npcId?findNpcById(ally.npcId):null;if(n){const r=ensureNpcResourceState(n);if(ally.hp<ally.maxHp*.38&&r.healing>0){const heal=randInt(5,11);ally.hp=Math.min(ally.maxHp,ally.hp+heal);r.healing--;addLog(`<strong>${escapeHtml(ally.name)}</strong> uses a field dressing and recovers ${heal} HP.`,'ai-narration');return true;}if((ally.position==='wall'||ally.formationRole==='rear')&&/archer|crossbow/.test(String(ally.combatClass||ally.occupation).toLowerCase())){if(r.ammo<=0){ally.position='front';ally.formationRole='front';ally.combatClassKey='watchman';ally.combatClass=ally.combatClass==='Wall Archer'?'Disarmed Archer':ally.combatClass;ally.attacks=['slashes with a sidearm','jabs with a short blade'];addLog(`<strong>${escapeHtml(ally.name)}</strong> is out of ammunition and draws a sidearm.`,'system');}else r.ammo--;}if(/mage/.test(String(ally.combatClass||ally.occupation).toLowerCase())){if(r.mana<8){ally.attacks=['strikes with a staff'];}else r.mana-=8;}r.stamina=Math.max(0,r.stamina-6);}return performReinforcementAttackV415(ally,index,total);}

  // ---------- Morale / formation cohesion ----------
  function combatMoraleFor(c,npc=null){if(c.morale==null){const base=55+(npc?.personality&&/bold|reckless|disciplined|veteran/.test(npc.personality)?15:0)-(npc?.socialAxes?.fear||0)*.18;c.morale=clamp(Math.round(base),10,100);}return c.morale;}
  function updateBattlefieldCohesionV418(delta,reason='battle'){const e=state.game.combat;if(!e)return;ensureTacticalBattleState();e.battlefield.cohesion=clamp(Number(e.battlefield.cohesion??78)+delta,0,100);e.battlefield.lastCohesionReason=reason;if(e.battlefield.cohesion<35&&!e.battlefield.broken){e.battlefield.broken=true;e.battlefield.formation='broken formation';e.battlefield.strategy='individual survival and improvised fighting after cohesion collapses';addLog(`<strong>Formation broken:</strong> enemy cohesion collapses.`,'event');}}
  function updateMoraleAfterHit(targetId,dmg,resolution){const e=state.game.combat;if(!e)return;const rec=combatantRecordForNpcId(targetId);if(targetId&&targetId!==e.npcId&&targetId!=='__combat_primary__'&&!rec){updateBattlefieldCohesion(-4,'an allied combatant was removed');return;}const c=rec?.combatant||e;const n=targetId?findNpcById(targetId):combatPrimaryNpc();combatMoraleFor(c,n);const percent=dmg/Math.max(1,c.maxHp||e.maxHp||30);let loss=Math.round(6+percent*35);if(resolution?.consequence_profile?.intensity>=80)loss+=10;c.morale=clamp(c.morale-loss,0,100);updateBattlefieldCohesion(-Math.max(1,Math.round(loss*.18)),'a combatant was badly hit');}
  function resolveCombatMorale(){const e=state.game.combat;if(!e)return;ensureTacticalBattleState();const units=[{combatant:e,npc:combatPrimaryNpc(),primary:true},...(e.allies||[]).map(a=>({combatant:a,npc:findNpcById(a.npcId),primary:false}))];for(const u of units){const m=combatMoraleFor(u.combatant,u.npc);if(m>=24)continue;const fanatic=/fanatic|zealous|reckless/.test(String(u.npc?.personality||''));if(fanatic&&m>=8)continue;const surrender=m<14&&Math.random()<.55;const text=surrender?'throws down their weapon and surrenders':'breaks away and flees the fight';addLog(`<strong>${escapeHtml(u.combatant.name)}</strong> ${text}.`,'event');if(u.npc){u.npc.surrendered=!!surrender;u.npc.fled=!surrender;recordNpcInteraction?.(u.npc,surrender?'They surrendered to you in battle.':'They fled from you in battle.','combat');}if(u.primary){if(e.allies?.length)promoteNextCombatAlly(e);else{state.game.combat=null;addEvent(surrender?`${u.combatant.name} surrendered`:`${u.combatant.name} fled`);return;}}else e.allies=e.allies.filter(a=>a!==u.combatant);updateBattlefieldCohesion(-12,'a combatant broke morale');}}
  function formationDefenseBonus(targetId,actionText){const base=formationDefenseBonusV415(targetId,actionText),e=state.game.combat;if(!e)return base;ensureTacticalBattleState();const coh=Number(e.battlefield.cohesion??78);if(coh<35)return {bonus:0,blocked:base.blocked&&/wall above/.test(base.blocked)?base.blocked:''};if(coh<60)return {bonus:Math.ceil((base.bonus||0)/2),blocked:base.blocked};return base;}

  // ---------- Autonomous player companions ----------
  function companionCombatRole(comp){const r=String(comp.role||'').toLowerCase();if(/mage|wizard|sorc/.test(r))return 'rear';if(/archer|ranger/.test(r))return 'rear';if(/rogue|thief|assassin/.test(r))return 'flank';return 'front';}
  function parseCompanionCommand(raw){const t=String(raw||'').toLowerCase();if(!/(companion|everyone|you two|you all|hold|protect|focus|retreat|fall back)/.test(t))return null;if(/hold (the )?(door|doorway|line|gate)/.test(t))return {mode:'hold',text:'Hold the chokepoint and prevent enemies passing.'};if(/protect (me|the mage|him|her)/.test(t))return {mode:'protect',text:'Protect the named ally and intercept threats.'};if(/focus (the )?(captain|mage|archer)/.test(t)){const q=(t.match(/captain|mage|archer/)||['primary'])[0];return {mode:'focus',targetClass:q,text:`Focus attacks on the ${q}.`};}if(/retreat|fall back/.test(t))return {mode:'retreat',text:'Disengage and fall back.'};return null;}
  function processPlayerCompanions(){const e=state.game.combat;if(!e)return;const comps=(state.character.companions||[]).filter(c=>c.active!==false&&c.hp>0);if(!comps.length)return;const order=state.game.companionOrders||{mode:'balanced'};for(const comp of comps){if(comp.lastCombatRound===e.round)continue;comp.lastCombatRound=e.round;if(order.mode==='retreat'){addLog(`<strong>${escapeHtml(comp.name)}</strong> falls back as ordered.`,'system');continue;}let targetId=e.npcId;let targetName=e.name;if(order.mode==='focus'&&order.targetClass){const a=(e.allies||[]).find(x=>String(x.combatClass||x.occupation).toLowerCase().includes(order.targetClass));if(a){targetId=a.npcId;targetName=a.name;}}const roll=randInt(1,20)+Math.floor((comp.loyalty||50)/20)+Math.floor(state.character.level/3);const targetRec=combatantRecordForNpcId(targetId);const def=Number(targetRec?.combatant?.defense||10);if(roll>=def){const dmg=randInt(3,7)+Math.floor(state.character.level/3);damageCombatTarget(targetId,dmg,null,{success:true,action_text:`${comp.name} attacks ${targetName}`,targeted_body_part:null,consequence_profile:{intensity:25}});addLog(`<strong>${escapeHtml(comp.name)}</strong> attacks ${escapeHtml(targetName)} for ${dmg} damage.`,'ai-narration');}else addLog(`<strong>${escapeHtml(comp.name)}</strong> attacks ${escapeHtml(targetName)}, but the opponent turns it aside.`,'ai-narration');}}

  // ---------- NPC schedules / active needs ----------
  function ensureNpcLifeState(n){if(!n)return n;n.schedule ||= {home:`Residence near ${n.location||'town'}`,work:n.location,activity:'available',shift:pick(['day','day','evening']),currentLocation:n.location,available:true};n.lifeGoal ||= generateNpcLifeGoal(n);return n;}
  function npcScheduleAllowsEncounter(n){ensureNpcLifeState(n);if(state.game.activeNpc?.id===n.id||n.companion)return true;return n.schedule.available!==false;}
  function generateNpcLifeGoal(n){const o=String(n.occupation||'').toLowerCase();if(/merchant|innkeeper/.test(o))return {kind:'profit',text:'Keep the business profitable and maintain stock.',progress:randInt(10,45),urgency:randInt(25,65)};if(/guard|soldier|captain/.test(o))return {kind:'security',text:'Keep order and improve professional standing.',progress:randInt(10,50),urgency:randInt(30,75)};if(/blacksmith/.test(o))return {kind:'materials',text:'Acquire materials and complete paid work.',progress:randInt(15,55),urgency:randInt(25,70)};if(/healer|herbalist|cleric/.test(o))return {kind:'supplies',text:'Maintain medical supplies and help patients.',progress:randInt(20,60),urgency:randInt(20,65)};return {kind:'personal',text:pick(['Earn enough coin for the coming weeks.','Protect family and local interests.','Improve standing in the community.','Resolve an unresolved personal problem.']),progress:randInt(5,55),urgency:randInt(15,70)};}
  function updateNpcSchedules(){const time=state.game.time;for(const n of (state.world.npcs||[])){if(n.dead||n.companion||state.game.activeNpc?.id===n.id||state.game.combat?.npcId===n.id)continue;ensureNpcLifeState(n);const occ=String(n.occupation||'').toLowerCase();let activity='available',available=true,current=n.schedule.work;if(time==='Night'){if(/guard|watch/.test(occ)&&n.schedule.shift==='evening'){activity='night patrol';current=n.schedule.work;}else{activity='at home / asleep';current=n.schedule.home;available=/innkeeper/.test(occ);}}else if(time==='Morning'||time==='Late Morning'){activity=/innkeeper/.test(occ)?'preparing the inn':/guard|watch/.test(occ)?'on patrol':'at work';current=n.schedule.work;}else if(time==='Afternoon'){activity='at work';current=n.schedule.work;}else if(time==='Evening'){activity=/innkeeper|merchant/.test(occ)?'serving customers':/guard|watch/.test(occ)?'patrolling':'off duty';current=n.schedule.work;available=!(/blacksmith|healer|alchemist/.test(occ));}n.schedule.activity=activity;n.schedule.currentLocation=current;n.schedule.available=available;n.schedule.lastUpdatedTurn=state.game.turn;}}
  function simulateNpcGoals(){for(const n of (state.world.npcs||[])){if(n.dead)continue;ensureNpcLifeState(n);n.lifeGoal.progress=clamp(n.lifeGoal.progress+randInt(-2,5),0,100);n.lifeGoal.urgency=clamp(n.lifeGoal.urgency+(n.lifeGoal.progress<30?3:-1),0,100);if(n.lifeGoal.progress>=100)n.lifeGoal=generateNpcLifeGoal(n);}}
  function generateQuestOfferV417(sourceFactionId=null){const q=generateQuestOfferV415(sourceFactionId),n=state.game.activeNpc;if(n?.lifeGoal&&q){const goal=n.lifeGoal;if(goal.kind==='materials'){q.title=`Materials for ${n.name.split(' ')[0]}`;q.description=`${n.name} needs usable materials for ongoing work.`;q.objectiveKind='explore';}if(goal.kind==='security'){q.title='A Local Security Problem';q.description=`${n.name} needs help dealing with a threat affecting their duties.`;q.objectiveKind='combat';}if(goal.kind==='supplies'){q.title='Needed Supplies';q.description=`${n.name} is short on important supplies and needs help obtaining them.`;q.objectiveKind='explore';}q.personalSourceNpcId=n.id;}return q;}

  // ---------- Bonds / favours ----------
  function updateNpcBond(n){if(!n)return;ensureNpcRelationshipData?.(n);n.favourBalance=Number(n.favourBalance||0);let bond='acquaintance';const rel=Number(n.relationship||0),trust=Number(n.socialAxes?.trust||0);if(rel<=-65)bond='enemy';else if(rel<=-30&&n.meetingCount>=2)bond='rival';else if(rel>=55&&trust>=60&&Number(n.age||0)>=Number(state.character.age||18)+10&&/mage|scholar|smith|captain|knight|hunter|healer/.test(String(n.occupation||'').toLowerCase()))bond='mentor';else if(rel>=55&&trust>=60&&Number(n.age||99)+8<=Number(state.character.age||18)&&state.character.level>=4)bond='protege';else if(rel>=70&&trust>=70)bond='close friend';else if(rel>=40&&trust>=50)bond='friend';if(n.favourBalance>=2)bond='owes you a favour';if(n.favourBalance<=-2)bond='you owe them';n.bond=bond;return bond;}
  function addNpcMemoryV418(npc,text,meta={}){const r=addNpcMemoryV415(npc,text,meta);if(npc){if(meta.category==='help')npc.favourBalance=Number(npc.favourBalance||0)+1;if(meta.category==='hostility')npc.favourBalance=Number(npc.favourBalance||0)-1;updateNpcBond(npc);}return r;}
  function callInNpcFavour(n){if(!n||Number(n.favourBalance||0)<=0){addLog(`${escapeHtml(n?.name||'They')} do not owe you a meaningful favour.`,'system');return;}n.favourBalance--;n.relationship=clamp((n.relationship||0)+3,-100,100);const gift=Math.min(walletCopper(n.currency||{}),randInt(15,60));if(gift>0)transferCurrency(n,state.character,gift,{from:`npc:${n.id}`,to:'player',reason:'Called-in favour'});addLog(`${escapeHtml(n.name)} honours a favour they owe you${gift?` and provides ${formatCopper(gift)} from their own funds`:''}.`,'event');updateNpcBond(n);}

  // ---------- Rumour mutation ----------
  function mutateRumourClaim(text,distortion){let s=String(text||'');const swaps=[['implicated in','definitely responsible for'],['several','many'],['guard','soldier'],['stranger','dangerous stranger'],['unusual','terrifying'],['fight','battle']];if(distortion>10&&Math.random()<.55){const [a,b]=pick(swaps);s=s.replace(new RegExp(a,'i'),b);}if(distortion>25&&Math.random()<.35)s=s.replace(/\b(\d+)\b/,m=>String(Math.max(1,Math.round(Number(m)*pick([1.5,2,3])))));if(distortion>40&&Math.random()<.25)s=`Rumour claims ${s.charAt(0).toLowerCase()+s.slice(1)}`;return s.slice(0,220);}
  function propagateRumours(){ensureV46Data();for(const r of state.world.rumours){r.retellings ||= {};const age=Math.max(0,state.world.day-r.createdDay);if(age>22)continue;const sources=r.knownBy.map(findNpcById).filter(Boolean);for(const src of sources){if(Math.random()>=Math.min(.76,.14+r.severity*.013))continue;const contacts=(state.world.npcs||[]).filter(n=>!n.dead&&n.id!==src.id&&n.kingdomId===src.kingdomId&&!r.knownBy.includes(n.id));if(!contacts.length)continue;const target=pick(contacts);ensureNpcDeepProfile(target);const parent=r.retellings[src.id]||{text:r.claim,reliability:r.reliability,distortion:r.distortion||0};const distortion=clamp((parent.distortion||0)+randInt(3,12),0,80);const reliability=clamp((parent.reliability||r.reliability)-randInt(3,10),5,100);r.retellings[target.id]={text:mutateRumourClaim(parent.text,distortion),reliability,distortion,sourceNpcId:src.id};target.knowledge.known_rumour_ids.push(r.id);r.knownBy.push(target.id);}if(age>=2&&Math.random()<.28){const cap=`${r.kingdomId}::${kingdomById(r.kingdomId)?.capital||''}`;if(!r.knownLocations.includes(cap))r.knownLocations.push(cap);}}}
  function rumoursKnownByNpc(npc){ensureNpcDeepProfile(npc);return (npc.knowledge.known_rumour_ids||[]).map(id=>state.world.rumours.find(r=>r.id===id)).filter(Boolean).slice(-5).map(r=>{const v=r.retellings?.[npc.id];return {id:r.id,reported_claim:v?.text||r.claim,source:r.source,reliability:v?.reliability??r.reliability,age_days:Math.max(0,state.world.day-r.createdDay),distortion:v?.distortion??r.distortion??0,truth_instruction:'This is a reported claim and may be distorted or false.'};});}

  // ---------- Law / evidence / custody ----------
  function playerWitnessDescription(){const v=playerVisibleIdentity();return `${v.apparent_race||state.character.race}; ${state.character.height}; ${state.character.build}; ${v.face_visible?'face visible':'face obscured'}; ${v.visible_weapons?.map(x=>x.item).join(', ')||'no obvious weapon'}; ${v.visible_gear?.map(x=>x.item).slice(0,2).join(', ')||'ordinary gear'}`;}
  function recordCrimeV418(type,severity=8,witnessed=true){
    ensureSimulationIntegrityData();
    const kid=state.game.kingdomId,k=kingdomById(kid);
    const witnesses=witnessed?plausibleWitnesses():[];
    const recognitions=witnesses.map(findNpcById).filter(Boolean).map(n=>recognitionForNpc(n));
    const nameKnown=recognitions.some(x=>x.recognised);
    const evidence=clamp((witnesses.length?20:4)+witnesses.length*18+severity+(nameKnown?12:0),5,100);
    const c={id:`case${state.world.lawCases.length+1}`,kingdomId:kid,type,severity,day:state.world.day,location:state.game.location,witnessIds:[...witnesses],suspectDescription:playerWitnessDescription(),suspectName:nameKnown?state.character.name:null,evidence,status:witnesses.length?'reported':'unreported',reportEta:witnesses.length?(state.game.areaType==='town'?1:2):null,consequencesApplied:false};
    state.world.lawCases.push(c);if(state.world.lawCases.length>60)state.world.lawCases.shift();
    if(witnesses.length){
      state.game.crimeHeat[kid]=clamp(currentHeat(kid)+Math.max(2,Math.ceil(severity*.22)),0,100);
      createRumour(`${nameKnown?state.character.name:'A suspect matching '+c.suspectDescription} was implicated in ${type} at ${state.game.location}.`,{source:witnesses.length===1?'an eyewitness':'several witnesses',reliability:witnesses.length>=2?86:70,witnessIds:witnesses,severity});
      for(const id of witnesses){const n=findNpcById(id);if(n)addNpcMemory(n,`I witnessed ${type} and can describe the suspect.`,{source:'crime witness',confidence:92,propagate:false});}
      addEvent(`${type} witnessed in ${k?.name||'the realm'}`);
    }else{
      createRumour(`Something suspicious happened at ${state.game.location}, but no clear witness can identify who was responsible.`,{source:'unconfirmed traces',reliability:18,witnessIds:[],severity:Math.max(1,Math.floor(severity/3))});
      addEvent(`${type} occurred without a clear witness`);
    }
  }
  function updateLawCasesV418(){
    for(const c of state.world.lawCases){
      if(c.status==='reported'&&c.reportEta!=null){c.reportEta--;if(c.reportEta<=0){c.status='wanted';c.reportEta=null;}}
      if(c.status==='wanted'&&!c.consequencesApplied){
        state.game.crimeHeat[c.kingdomId]=clamp(currentHeat(c.kingdomId)+c.severity,0,100);
        state.game.bounties[c.kingdomId]=Math.max(0,currentBounty(c.kingdomId)+Math.round(c.severity*1.8));
        state.character.infamy=clamp((state.character.infamy||0)+Math.max(1,Math.floor(c.severity/4)),0,999);
        changeKingdomRep(c.kingdomId,-Math.max(1,Math.floor(c.severity/5)));
        updateLayeredReputation('local',-Math.max(1,Math.floor(c.severity/4)));
        updateLayeredReputation('kingdom',-Math.max(0,Math.floor(c.severity/7)),c.kingdomId);
        c.consequencesApplied=true;
        addEvent(`Authorities circulate a report for ${c.type}`);
      }
    }
  }
  function activeLawCases(kid=state.game.kingdomId){return state.world.lawCases.filter(c=>c.kingdomId===kid&&['reported','wanted','charged'].includes(c.status));}
  function maybeLawCheck(){if(state.game.custody||state.game.areaType!=='town'||state.game.combat||state.game.lawEncounter)return false;const cases=activeLawCases();if(!cases.length)return maybeLawCheckV415();const heat=currentHeat();if(heat<12)return false;const d=state.character.disguise||{};const disguised=d.active&&d.quality>=50;const named=cases.some(c=>c.suspectName===state.character.name);const chance=clamp(.18+heat/145+(named?.18:0)-(disguised?.28:0),.05,.92);if(Math.random()<chance){state.game.lawEncounter={kingdomId:state.game.kingdomId,bounty:currentBounty(),caseIds:cases.map(c=>c.id),recognisedAs:named?state.character.name:'a matching suspect'};addLog(`A watch patrol stops you. Their description of the suspect matches enough details to justify questioning or arrest.`,'event');return true;}return false;}
  function enterCustody(reason='arrest'){const cases=activeLawCases();const severity=cases.reduce((s,c)=>s+c.severity,0);state.game.combat=null;state.game.lawEncounter=null;state.world.confiscatedItems=Array.isArray(state.world.confiscatedItems)?state.world.confiscatedItems:[];const held=[...new Set(Object.values(state.character.equipment||{}).filter(Boolean))];for(const item of held){const i=state.character.inventory.indexOf(item);if(i>=0)state.character.inventory.splice(i,1);state.world.confiscatedItems.push({item,owner:'player',kingdomId:state.game.kingdomId,reason:'custody'});}for(const slot of Object.keys(state.character.equipment||{}))state.character.equipment[slot]=null;state.game.custody={kingdomId:state.game.kingdomId,daysRemaining:clamp(Math.ceil(severity/14),1,7),caseIds:cases.map(c=>c.id),reason,stage:'cell',fineCopper:Math.max(30,currentBounty()*100),evidence:cases.length?Math.round(cases.reduce((s,c)=>s+c.evidence,0)/cases.length):45,heldEquipment:held};syncOwnershipLedger();addLog(`<strong>Taken into custody.</strong> ${held.length?`The watch removes and stores ${held.length} equipped item${held.length===1?'':'s'} as held property.`:'You have no equipped weapons or armour to confiscate.'}`,'event');}
  function releaseCustody(text='You are released from custody.',restore=true){const cu=state.game.custody;if(restore&&cu?.heldEquipment?.length){for(const item of cu.heldEquipment){const rec=(state.world.confiscatedItems||[]).find(x=>x.owner==='player'&&x.item===item);if(rec){state.character.inventory.push(item);state.world.confiscatedItems.splice(state.world.confiscatedItems.indexOf(rec),1);}}addLog(`Your held equipment is returned.`,'system');}state.game.custody=null;state.game.time='Morning';syncOwnershipLedger();addLog(`<strong>${escapeHtml(text)}</strong>`,'event');}
  function custodyAction(action){const cu=state.game.custody;if(!cu)return;if(action==='custody-wait'){advanceWorldDay(1);cu.daysRemaining--;addLog(`Another day passes in custody. ${Math.max(0,cu.daysRemaining)} day(s) remain on the current sentence.`,'system');if(cu.daysRemaining<=0)releaseCustody('Your sentence is served and your held equipment is returned.');}else if(action==='custody-trial'){const roll=randInt(1,20)+Math.floor(Math.max(state.character.stats.cha,state.character.stats.wis)/4);const target=12+Math.floor(cu.evidence/18);if(roll>=target){cu.daysRemaining=Math.max(0,cu.daysRemaining-2);cu.fineCopper=Math.floor(cu.fineCopper*.45);addLog(`You successfully challenge part of the evidence. The sentence and fine are reduced.`,'event');if(cu.daysRemaining<=0)releaseCustody('The court orders your release.');}else{addLog(`The court is not persuaded. The existing sentence stands.`,'event');}}else if(action==='custody-bribe'){const guard=getServiceNpc('gaoler');const cost=Math.max(80,Math.floor(cu.fineCopper*.65));if(executeNpcTransaction(guard,cost,'bribe',null,'Bribe for release')){recordCrime('Bribing a gaoler',8,false);releaseCustody('A bribed gaoler quietly creates an opportunity for you to leave.');}}else if(action==='custody-escape'){const roll=randInt(1,20)+Math.floor(state.character.stats.dex/4);if(roll>=15){recordCrime('Escape from custody',18,true);releaseCustody('You escape custody before the watch can stop you.',false);state.game.areaType='outskirts';state.game.location=`Outskirts of ${currentKingdom().capital}`;}else{cu.daysRemaining+=2;cu.evidence=clamp(cu.evidence+12,0,100);addLog(`The escape attempt fails. Security tightens and two days are added to the sentence.`,'event');}}saveGame(false);renderGame();}
  function lawAction(action){if(action==='law-surrender'){enterCustody('voluntary surrender');saveGame(false);renderGame();return;}if(action==='law-pay'){const cost=Math.max(0,currentBounty()*100);if(cost>0&&!changeCurrency(state.character,-cost)){addLog(`You cannot afford the ${formatCopper(cost)} fine.`,'system');renderGame();return;}state.game.bounties[state.game.kingdomId]=0;state.game.crimeHeat[state.game.kingdomId]=Math.max(0,currentHeat()-30);for(const c of activeLawCases())c.status='settled';state.game.lawEncounter=null;addLog(`You pay ${formatCopper(cost)} in fines. The immediate warrant is settled.`,'event');saveGame(false);renderGame();return;}return lawActionV415(action);}
  function resolveReactivePlayerDefeat(cause='combat'){const e=state.game.combat,n=e?.npcId?findNpcById(e.npcId):null;if(n&&/guard|watch|captain|soldier/.test(String(n.occupation||e.name).toLowerCase())){state.character.hp=Math.max(1,Math.floor(state.character.maxHp*.2));enterCustody('defeated by the watch');saveGame(false);return;}return resolveReactivePlayerDefeatV415(cause);}

  // ---------- Services / market pressure ----------
  function marketDyn(k=currentKingdom()){state.world.marketDynamics[k.id] ||= {pressure:{food:0,medicine:0,tools:0,weapons:0,clothing:0,services:0},shortages:[],lastDay:state.world.day};return state.world.marketDynamics[k.id];}
  function worldPriceCopper(good,kingdom=currentKingdom()){const base=worldPriceCopperV415(good,kingdom),d=marketDyn(kingdom),p=Number(d.pressure?.[good.category]||0);return Math.max(1,Math.round(base*(1+p/100)));}
  function adjustMarketPressure(category,delta,k=currentKingdom()){const d=marketDyn(k);d.pressure[category]=clamp(Number(d.pressure[category]||0)+delta,-25,80);}
  function buyMarketGood(index){const before=(state.character.inventory||[]).length;const r=buyMarketGoodV415(index);if((state.character.inventory||[]).length>before)adjustMarketPressure(MARKET_GOODS[index]?.category||'tools',2);syncOwnershipLedger();updateCarryingState();return r;}
  function sellMarketGood(index){const before=(state.character.inventory||[]).length;const r=sellMarketGoodV415(index);if((state.character.inventory||[]).length<before)adjustMarketPressure(MARKET_GOODS[index]?.category||'tools',-1);syncOwnershipLedger();updateCarryingState();return r;}
  function getServiceNpcV418(type){const key=`${state.game.kingdomId}:${state.game.location}:${type}`;let id=state.world.serviceNpcs[key],n=id?findNpcById(id):null;if(n)return n;const defs={blacksmith:['blacksmith','practical and exacting'],healer:['healer','calm and attentive'],stable:['stablemaster','weathered and good with animals'],alchemist:['alchemist','precise and curious'],gaoler:['gaoler','tired and watchful']};const d=defs[type]||['service provider','businesslike'];n={id:`n${state.world.npcs.length+1}`,name:personName(Math.random),occupation:d[0],personality:d[1],kingdomId:state.game.kingdomId,location:state.game.location,relationship:0,memory:[],socialLinks:{}};state.world.npcs.push(n);ensureNpcDeepProfile(n);ensureNpcEconomyData(n);state.world.serviceNpcs[key]=n.id;return n;}
  function serviceAction(action){if(action==='service-close'){state.game.servicesMenu=false;renderGame();return;}const providerType=action==='service-repair'?'blacksmith':action==='service-heal'?'healer':action==='service-stable'?'stable':action==='service-alchemy'?'alchemist':null;if(providerType){const provider=getServiceNpc(providerType);updateNpcSchedules();if(provider.schedule?.available===false){addLog(`${escapeHtml(provider.name)} is currently ${escapeHtml(provider.schedule.activity)} and the service is unavailable until their schedule brings them back.`,'system');renderGame();return;}}if(action==='service-repair'){const smith=getServiceNpc('blacksmith');const damaged=Object.values(state.character.equipment||{}).filter(Boolean).sort((a,b)=>durabilityFor(a)-durabilityFor(b))[0];if(!damaged){addLog(`You have no equipped item needing repair.`,'system');}else{const missing=100-durabilityFor(damaged),cost=Math.max(5,missing*2);if(executeNpcTransaction(smith,cost,'purchase',null,`Repair ${damaged}`)){state.character.itemDurability[damaged]=100;state.character.equipmentCondition[damaged]=100;addLog(`${escapeHtml(smith.name)} restores <strong>${escapeHtml(damaged)}</strong> to full condition.`,'event');}}}else if(action==='service-heal'){const h=getServiceNpc('healer'),cost=45;if(executeNpcTransaction(h,cost,'purchase',null,'Medical treatment')){state.character.hp=Math.min(state.character.maxHp,state.character.hp+Math.round(state.character.maxHp*.55));const severe=(state.character.injuries||[]).find(x=>x.severity!=='severed');if(severe)state.character.injuries=state.character.injuries.filter(x=>x!==severe);addLog(`${escapeHtml(h.name)} treats your wounds.`,'event');}}else if(action==='service-stable'){const s=getServiceNpc('stable'),cost=180;if(state.character.mount){addLog(`You already have access to ${escapeHtml(state.character.mount.name)}.`,'system');}else if(executeNpcTransaction(s,cost,'purchase',null,'Riding horse')){state.character.mount={name:'Riding Horse',speedBonus:.35,carryBonus:24};addLog(`You acquire a riding horse. Long journeys and carrying capacity improve.`,'event');updateCarryingState();}}else if(action==='service-alchemy'){const a=getServiceNpc('alchemist'),cost=55;if(executeNpcTransaction(a,cost,'purchase',null,'Healing Draught')){state.character.inventory.push('Healing Draught');syncOwnershipLedger();}}advanceTurn();saveGame(false);renderGame();}
  function dailyEconomicTickV418(){for(const k of state.world.kingdoms){const d=marketDyn(k);for(const key of Object.keys(d.pressure))d.pressure[key]=Math.round(d.pressure[key]*.86);if((k.wars||[]).length){d.pressure.food=clamp(d.pressure.food+2,-25,80);d.pressure.medicine=clamp(d.pressure.medicine+2,-25,80);d.pressure.weapons=clamp(d.pressure.weapons+1,-25,80);}if(Math.random()<.08){const cat=pick(['food','medicine','tools']);d.pressure[cat]=clamp(d.pressure[cat]+randInt(5,14),-25,80);}}for(const n of (state.world.npcs||[])){ensureNpcResourceState(n);if(/merchant|innkeeper/.test(String(n.occupation||'')))changeCurrency(n,randInt(-20,80));}}

  // ---------- Travel-time world simulation ----------
  function travelDaysV418(kind,dest=null){let days=kind==='local'?1:randInt(2,4);if(state.character.mount)days=Math.max(1,Math.ceil(days*(1-state.character.mount.speedBonus)));const carry=updateCarryingState();if(carry.state==='Heavy')days+=1;if(carry.state==='Overloaded')days+=2;if(dest&&currentKingdom().wars?.includes(dest.id))days+=1;return days;}
  function performIntegrityTravel(kind,destId=null){const g=state.game,from=currentKingdom(),old=g.location,dest=destId?kingdomById(destId):null,days=travelDays(kind,dest);g.travelMenu=false;g.areaType='road';addLog(`You set out from ${escapeHtml(old)}. The journey is expected to take about <strong>${days} day${days===1?'':'s'}</strong>.`,'event');for(let d=0;d<days;d++){advanceWorldDay(1);if(Math.random()<.18+(from.wars?.length?.08:0)){if(maybeEncounter('road')){addLog(`The journey is interrupted on day ${d+1}.`,'event');saveGame(false);renderGame();return;}}}if(kind==='local'){g.location=settlementName(Math.random);g.areaType='town';g.entryReactionKey=null;addLog(`After ${days} day${days===1?'':'s'}, you reach <strong>${escapeHtml(g.location)}</strong> within ${escapeHtml(from.name)}.`,'event');awardXp(8);progressQuests('travel',1);applyTownEntryReaction();}else if(dest){g.kingdomId=dest.id;g.location=dest.capital;g.areaType='town';g.entryReactionKey=null;addLog(`After ${days} day${days===1?'':'s'} on the road, you enter <strong>${escapeHtml(dest.name)}</strong> and reach ${escapeHtml(dest.capital)}.`,'event');awardXp(15);progressQuests('travel',1);addEvent(`Entered ${dest.name}`);applyTownEntryReaction();}updateNpcSchedules();maybeLawCheck();saveGame(false);renderGame();}

  // ---------- Turn/day wrappers ----------
  function advanceTurnV418(amount=1){advanceTurnV415(amount);updateNpcSchedules();updateLawCases();syncOwnershipLedger();updateCarryingState();}
  function advanceWorldDayV417(days=1){for(let i=0;i<days;i++){advanceWorldDayV415(1);dailyEconomicTick();simulateNpcGoals();updateLawCases();updateNpcSchedules();propagateRumours();}}

  // ---------- Combat round integration ----------
  function playerCombatDefense(){let base=9+Math.floor(Number(state.character.stats?.dex||8)/4);const body=state.character.equipment?.body,shield=state.character.equipment?.offHand;if(body)base+=Math.floor(itemPowerScore(body,state.character)/35);if(shield&&/shield|buckler/.test(String(shield).toLowerCase()))base+=2;const cover=sceneIntegrity().cover.player;if(cover==='heavy')base+=3;else if(cover==='light')base+=1;if(state.game.companionOrders?.mode==='protect'&&(state.character.companions||[]).some(c=>c.active!==false&&c.hp>0))base+=2;return clamp(base,8,24);}
  function processCombatSupportRound(){if(state.game.integrityFreeformBeat)processPlayerCompanions();processCombatSupportRoundV415();state.game.integrityFreeformBeat=false;processEnvironmentalHazards();resolveCombatMorale();}

  // ---------- Debug state inspector ----------
  function debugSnapshot(){const e=state.game.combat,n=state.game.activeNpc;return {version:'4.16',player:{hp:`${state.character.hp}/${state.character.maxHp}`,currency:formatWallet(state.character.currency),carry:updateCarryingState(),position:state.game.playerCombatPosition,equipment_condition:Object.fromEntries(Object.values(state.character.equipment||{}).filter(Boolean).map(x=>[x,durabilityFor(x)])),companions:(state.character.companions||[]).map(c=>({name:c.name,hp:`${c.hp}/${c.maxHp}`,order:state.game.companionOrders}))},combat:e?{primary:{name:e.name,hp:`${e.hp}/${e.maxHp}`,morale:e.morale,position:e.position},formation:e.battlefield,allies:(e.allies||[]).map(a=>({name:a.name,class:a.combatClass,hp:`${a.hp}/${a.maxHp}`,morale:a.morale,position:a.position,resources:findNpcById(a.npcId)?.resources})),incoming:e.reinforcementQueue}:null,last_outcome:state.game.lastResolvedOutcome,scene:sceneIntegrity(),law:{heat:currentHeat(),bounty:currentBounty(),cases:activeLawCases(),custody:state.game.custody},active_npc:n?{name:n.name,schedule:n.schedule,goal:n.lifeGoal,bond:n.bond,resources:n.resources,wallet:formatWallet(n.currency)}:null,recent_rumours:(state.world.rumours||[]).slice(-5),recent_transactions:(state.world.transactions||[]).slice(-5)};}
  function showSimulationDebug(){const wrap=document.createElement('div');wrap.className='modal-backdrop';const snap=debugSnapshot();wrap.innerHTML=`<div class="modal debug-modal"><div class="ledger-head"><div><div class="eyebrow">Developer state</div><h2>Simulation Inspector</h2><p class="section-copy">Authoritative state behind the narration. Useful for identifying whether a bug is mechanical or descriptive.</p></div><button class="ghost-button" id="debugClose">Close</button></div><pre class="debug-pre">${escapeHtml(JSON.stringify(snap,null,2))}</pre></div>`;document.body.appendChild(wrap);wrap.querySelector('#debugClose').onclick=()=>wrap.remove();wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove();});}

  // ---------- UI wrappers ----------
  function renderActionArea(){const g=state.game;if(g.custody)return `<div class="combat-box law-box"><h3>In Custody</h3><div class="character-sub">Sentence: ${g.custody.daysRemaining} day(s) • Evidence ${g.custody.evidence}/100 • Fine ${formatCopper(g.custody.fineCopper)}</div></div><div class="choice-grid"><button class="choice-button" data-action="custody-wait"><strong>Serve a day</strong><small>Let a day pass in the living world.</small></button><button class="choice-button" data-action="custody-trial"><strong>Challenge the case</strong><small>Use reason, credibility and flaws in the evidence.</small></button><button class="choice-button" data-action="custody-bribe"><strong>Attempt a bribe</strong><small>Pay a real gaoler from your actual purse.</small></button><button class="choice-button" data-action="custody-escape"><strong>Attempt escape</strong><small>Failure increases your sentence.</small></button></div>`;if(g.servicesMenu)return `<div class="quest-offer"><div class="eyebrow">Local services</div><h3>Trades & services</h3><p>Real NPC providers take real payment.</p></div><div class="choice-grid"><button class="choice-button" data-action="service-repair"><strong>Blacksmith repair</strong><small>Repair your most damaged equipped item.</small></button><button class="choice-button" data-action="service-heal"><strong>Healer</strong><small>Treat HP and a non-severed injury.</small></button><button class="choice-button" data-action="service-stable"><strong>Stable</strong><small>Acquire a riding horse for travel and carrying.</small></button><button class="choice-button" data-action="service-alchemy"><strong>Alchemist</strong><small>Buy a healing draught.</small></button><button class="choice-button" data-action="service-close"><strong>Leave</strong></button></div>`;return renderActionAreaV415();}
  function injectIntegrityUiV417(){const left=document.querySelector('.left-panel .hud-card');if(left&&!document.getElementById('integrityCarry')){const div=document.createElement('div');div.id='integrityCarry';div.innerHTML=`<div class="hud-row"><span>Load</span><strong>${escapeHtml(updateCarryingState().state)} ${state.character.carrying.weight}/${state.character.carrying.capacity}</strong></div>`;left.appendChild(div);}const right=document.querySelector('.right-panel');if(right&&!document.getElementById('openDebug')){const sec=document.createElement('section');sec.className='panel hud-card';sec.innerHTML=`<div class="hud-heading">Simulation integrity</div><div class="hud-row"><span>Law cases</span><strong>${activeLawCases().length}</strong></div><div class="hud-row"><span>Scene effects</span><strong>${sceneIntegrity().changes?.length||sceneIntegrity().interactables.length}</strong></div><button class="secondary-button ledger-button" id="openEnvironment" type="button">Environment & containers</button><button class="ghost-button ledger-button" id="openDebug" type="button">Developer State</button>`;right.appendChild(sec);sec.querySelector('#openDebug').onclick=showSimulationDebug;sec.querySelector('#openEnvironment').onclick=showEnvironmentPanel;}const grid=document.querySelector('.choice-area .choice-grid');if(grid&&!state.game.combat&&!state.game.activeNpc&&!state.game.marketOpen&&!state.game.custody&&!document.querySelector('[data-action="services"]')){const b=document.createElement('button');b.className='choice-button';b.dataset.action='services';b.innerHTML='<strong>Local services</strong><small>Smith, healer, stable and alchemist.</small>';b.onclick=()=>handleGameAction('services');grid.appendChild(b);}if(state.game.activeNpc&&Number(state.game.activeNpc.favourBalance||0)>0&&!document.querySelector('[data-action="npc-favour"]')){const grid2=document.querySelector('.choice-area .choice-grid');if(grid2){const b=document.createElement('button');b.className='choice-button';b.dataset.action='npc-favour';b.innerHTML=`<strong>Call in a favour</strong><small>${escapeHtml(state.game.activeNpc.name)} owes you.</small>`;b.onclick=()=>handleGameAction('npc-favour');grid2.appendChild(b);}}}
  function renderGame(){ensureSimulationIntegrityData();renderGameV415();injectIntegrityUi();}
  function showEnvironmentPanel(){const wrap=document.createElement('div');wrap.className='modal-backdrop';const cons=ensureSceneContainers();wrap.innerHTML=`<div class="modal people-modal"><div class="ledger-head"><div><div class="eyebrow">Object permanence</div><h2>Environment</h2><p class="section-copy">Objects and containers at ${escapeHtml(state.game.location)} persist in simulation state.</p></div><button class="ghost-button" id="envClose">Close</button></div><div class="people-list">${cons.map(c=>`<article class="people-card"><h3>${escapeHtml(c.name)}</h3><p>${c.locked?'Locked':'Accessible'}${c.ownerId?' • Owned':''}</p><div class="inventory-list">${(c.contents||[]).length?c.contents.map((x,i)=>`<div class="inventory-item"><span>${escapeHtml(x)}</span>${!c.locked?`<button class="ghost-button" data-container-take="${escapeHtml(c.id)}:${i}">Take</button>`:''}</div>`).join(''):'<div class="inventory-item">Empty</div>'}</div></article>`).join('')}<article class="people-card"><h3>Your carried items</h3><div class="inventory-list">${(state.character.inventory||[]).slice(0,20).map((x,i)=>`<div class="inventory-item"><span>${escapeHtml(x)}</span><button class="ghost-button" data-drop-item="${i}">Drop</button></div>`).join('')}</div></article></div></div>`;document.body.appendChild(wrap);wrap.querySelector('#envClose').onclick=()=>wrap.remove();wrap.querySelectorAll('[data-container-take]').forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.containerTake.split(':');takeContainerItem(id,Number(i));wrap.remove();showEnvironmentPanel();saveGame(false);});wrap.querySelectorAll('[data-drop-item]').forEach(b=>b.onclick=()=>{dropInventoryItem(Number(b.dataset.dropItem));wrap.remove();showEnvironmentPanel();saveGame(false);});}

  // ---------- Game-action / freeform wrappers ----------
  function handleGameAction(action){if(action.startsWith('custody-'))return custodyAction(action);if(action.startsWith('service-'))return serviceAction(action);if(action==='services'){state.game.servicesMenu=true;renderGame();return;}if(action==='npc-favour'){callInNpcFavour(state.game.activeNpc);advanceTurn();saveGame(false);renderGame();return;}if(action==='travel-local')return performIntegrityTravel('local');if(action.startsWith('travel-kingdom:'))return performIntegrityTravel('kingdom',action.split(':')[1]);return handleGameActionV415(action);}
  async function submitRoleplayInputV417(prefill=null){const raw=String(prefill??document.getElementById('roleplayInput')?.value??'').trim();state.game.integrityFreeformBeat=!!state.game.combat;const cmd=parseCompanionCommand(raw);if(cmd){state.game.companionOrders=cmd;addLog(`<strong>Companion order:</strong> ${escapeHtml(cmd.text)}`,'system');}if(state.game.combat&&/^\*{1,2}.*\b(i surrender|surrender|drop my weapon|yield)\b/i.test(raw)&&/guard|watch|captain|soldier/.test(String(state.game.combat.name||'').toLowerCase())){enterCustody('surrender during combat');saveGame(false);renderGame();return;}await submitRoleplayInputV415(prefill);syncOwnershipLedger();updateCarryingState();for(const n of (state.world.npcs||[]))updateNpcBond(n);}

  // ---------- AI payload ----------
  function npcForAiV417(n){const base=npcForAiV415(n);ensureNpcLifeState(n);ensureNpcResourceState(n);updateNpcBond(n);return {...base,schedule:n.schedule,current_goal:n.lifeGoal,bond:n.bond,favour_balance:n.favourBalance||0,resources:n.resources,ownership_note:'This NPC has their own inventory, money and resources; do not assume infinite supplies.'};}
  function aiWorldSnapshotV418(){const snap=aiWorldSnapshotV415();snap.simulation_integrity={last_resolved_outcome:state.game.lastResolvedOutcome,carrying:updateCarryingState(),player_position:state.game.playerCombatPosition,scene_integrity:sceneIntegrity(),law_cases:activeLawCases().map(c=>({type:c.type,status:c.status,evidence:c.evidence,suspect_name:c.suspectName,suspect_description:c.suspectDescription})),custody:state.game.custody,companion_orders:state.game.companionOrders,ownership_enforced:true,durability_enforced:true,world_time_enforced:true,instruction:'This block is authoritative. Describe resolved state; never replace it with a contradictory outcome.'};if(snap.conversation?.participants)snap.conversation.participants=snap.conversation.participants.map(p=>{const n=findNpcById(p.id);return n?npcForAi(n):p;});return snap;}



  // ============================================================
  // V4.18 — ADVENTURE SYSTEMS & LIVING CODEX
  // ============================================================

  // ------------------------------------------------------------
  // Persistent media cache (NPC portraits / bestiary illustrations)
  // ------------------------------------------------------------
  let rrMediaDbPromise=null;
  function openMediaDb(){
    if(rrMediaDbPromise)return rrMediaDbPromise;
    rrMediaDbPromise=new Promise(resolve=>{
      if(!("indexedDB" in window)){resolve(null);return;}
      const req=indexedDB.open("RealmsAndRuinMediaV1",1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("media"))db.createObjectStore("media");};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
    });
    return rrMediaDbPromise;
  }
  async function mediaCacheGet(key){
    const db=await openMediaDb();if(!db)return null;
    return new Promise(resolve=>{
      try{
        const tx=db.transaction("media","readonly"),req=tx.objectStore("media").get(key);
        req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null);
      }catch{resolve(null);}
    });
  }
  async function mediaCachePut(key,value){
    const db=await openMediaDb();if(!db)return false;
    return new Promise(resolve=>{
      try{
        const tx=db.transaction("media","readwrite");tx.objectStore("media").put(value,key);
        tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);
      }catch{resolve(false);}
    });
  }
  function placeholderArtSvg(label,kind="npc"){
    const safe=String(label||"Unknown").replace(/[<>&'"]/g,"").slice(0,30);
    const icon=kind==="beast"?"♞":"♜";
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#221a12"/><rect x="20" y="20" width="472" height="472" rx="14" fill="#302419" stroke="#b58a4a" stroke-width="4"/><circle cx="256" cy="202" r="105" fill="#4b3824" stroke="#d3af6a" stroke-width="3"/><text x="256" y="235" text-anchor="middle" font-size="112" fill="#d9bd82">${icon}</text><text x="256" y="385" text-anchor="middle" font-size="28" font-family="serif" fill="#ecd9ad">${safe}</text><text x="256" y="420" text-anchor="middle" font-size="18" font-family="serif" fill="#a99168">Realms &amp; Ruin Codex</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  async function requestGeneratedArt(prompt,seed=1){
    const cfg=getAiConfig();
    if(!cfg.endpoint)throw new Error("Cloudflare Worker URL is not configured.");
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
    try{
      const res=await fetch(cfg.endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({kind:"image_generate",prompt:String(prompt).slice(0,1900)}),
        signal:controller.signal
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok||!body.dataURI){
        const raw=String(body.error||`Image generation failed (${res.status})`);
        const friendly=/unevaluated properties|additional.*properties|not allowed/i.test(raw)
          ?"Cloudflare rejected an image-model option. Make sure worker_for_cloudflare_V420.txt is deployed, then retry."
          :raw;
        throw new Error(friendly);
      }
      return body.dataURI;
    }finally{clearTimeout(timer);}
  }

  function ensureQuestStages(q){
    if(!q)return q;
    if(!Array.isArray(q.stages)||!q.stages.length){
      q.stages=[{title:q.title||"Objective",objectiveKind:q.objectiveKind||"explore",goal:q.goal||1,progress:q.progress||0,description:q.description||""}];
      q.stageIndex=0;
      q.multiStage=false;
    }
    q.stageIndex=clamp(Number(q.stageIndex)||0,0,Math.max(0,q.stages.length-1));
    q.stages=q.stages.map(s=>({...s,progress:Number(s.progress)||0,goal:Math.max(1,Number(s.goal)||1)}));
    const s=q.stages[q.stageIndex];
    if(s){q.objectiveKind=s.objectiveKind;q.progress=s.progress;q.goal=s.goal;q.stageTitle=s.title;}
    return q;
  }
  function activeQuestStage(q){ensureQuestStages(q);return q?.stages?.[q.stageIndex]||null;}
  function generateQuestOffer(sourceFactionId=null){
    const base=generateQuestOfferV417(sourceFactionId);
    const npc=state.game.activeNpc;
    const multi=Math.random()<.58;
    if(multi){
      const template=pick(V418_QUESTLINES);
      base.title=template.title;
      base.description=template.desc;
      base.stages=template.stages.map(s=>({...s,progress:0}));
      base.stageIndex=0;base.multiStage=true;
      base.rewardCopper=Math.max(180,Math.round((base.rewardGold||25)*100*1.4));
      base.rewardXp=Math.round((base.rewardXp||35)*1.35);
    }else{
      base.stages=[{title:base.title,objectiveKind:base.objectiveKind,goal:base.goal,progress:0,description:base.description}];
      base.stageIndex=0;base.multiStage=false;
      base.rewardCopper=Math.max(60,Math.round((base.rewardGold||20)*100));
    }
    base.questGiverNpcId=npc?.id||base.personalSourceNpcId||null;
    ensureQuestStages(base);
    state.game.activeQuestOffer=base;
    return base;
  }
  function acceptQuest(){
    const q=state.game.activeQuestOffer;if(!q)return;
    ensureQuestStages(q);q.status="active";
    state.world.quests.push(q);state.game.activeQuestOffer=null;
    const s=activeQuestStage(q);
    addLog(`You accept <strong>${escapeHtml(q.title)}</strong>.${q.multiStage?` This is a multi-stage quest. <strong>Stage 1:</strong> ${escapeHtml(s.title)} — ${escapeHtml(s.description)}`:` ${escapeHtml(q.description)}`}`,"event");
    addEvent(`Accepted quest: ${q.title}`);
  }
  function progressQuestsV418(kind,amount=1){
    const active=(state.world.quests||[]).filter(q=>q.status==="active");
    for(const q of active){
      ensureQuestStages(q);const s=activeQuestStage(q);if(!s||s.objectiveKind!==kind)continue;
      s.progress=Math.min(s.goal,s.progress+amount);q.progress=s.progress;q.goal=s.goal;
      addLog(`<strong>Quest:</strong> ${escapeHtml(q.title)} — ${escapeHtml(s.title)} ${s.progress}/${s.goal}`,"system");
      if(s.progress>=s.goal){
        if(q.stageIndex<q.stages.length-1){
          q.stageIndex++;const next=activeQuestStage(q);
          q.objectiveKind=next.objectiveKind;q.progress=next.progress;q.goal=next.goal;q.stageTitle=next.title;
          addLog(`<strong>QUEST UPDATED:</strong> ${escapeHtml(q.title)} — ${escapeHtml(next.title)}. ${escapeHtml(next.description)}`,"event");
        }else completeQuest(q);
      }
    }
  }
  function completeQuestV418(q){
    if(q.status!=="active")return;
    q.status="completed";q.completedDay=state.world.day;
    const copper=Math.max(1,Number(q.rewardCopper)||Math.round((q.rewardGold||20)*100));
    const giver=q.questGiverNpcId?findNpcById(q.questGiverNpcId):null;
    let paid=false;
    if(giver){ensureNpcEconomyData(giver);if(canAfford(giver,copper))paid=transferCurrency(giver,state.character,copper,{from:`npc:${giver.id}`,to:"player",reason:`Quest reward: ${q.title}`});}
    if(!paid)changeCurrency(state.character,copper);
    awardXp(q.rewardXp||30);state.character.renown=clamp((state.character.renown||0)+3,0,999);
    changeKingdomRep(q.kingdomId,4);if(q.factionId)changeFactionRep(q.factionId,8);
    addLog(`<strong>QUEST COMPLETE:</strong> ${escapeHtml(q.title)}. You receive ${formatCopper(copper)} and ${q.rewardXp||30} XP.`,"event");
    addEvent(`Completed quest: ${q.title}`);
  }
  function questTurnInForNpc(npc){
    const qs=(state.world.quests||[]).filter(q=>q.status==="active"&&q.questGiverNpcId===npc?.id);
    let did=false;
    for(const q of qs){const s=activeQuestStage(q);if(s?.objectiveKind==="return"){progressQuests("return",1);did=true;}}
    return did;
  }
  function showQuestJournal(){
    const wrap=document.createElement("div");wrap.className="modal-backdrop";
    const quests=(state.world.quests||[]).slice().reverse();
    wrap.innerHTML=`<div class="modal codex-modal"><div class="ledger-head"><div><div class="eyebrow">Contracts & stories</div><h2>Quest Journal</h2><p class="section-copy">Simple tasks and longer questlines both persist here.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="codex-grid">${quests.length?quests.map(q=>{ensureQuestStages(q);return `<article class="questline-card"><div class="eyebrow">${q.multiStage?"Multi-stage quest":"Simple quest"} • ${escapeHtml(titleCase(q.status))}</div><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description||"")}</p><div class="quest-stages">${q.stages.map((s,i)=>`<div class="quest-stage ${i<q.stageIndex||q.status==="completed"?"done":i===q.stageIndex&&q.status==="active"?"current":""}"><span>${i+1}</span><div><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.description)} • ${s.progress}/${s.goal}</small></div></div>`).join("")}</div><div class="character-sub">Reward: ${formatCopper(q.rewardCopper||Math.round((q.rewardGold||20)*100))} • ${q.rewardXp||0} XP</div></article>`}).join(""):`<p class="empty-copy">No quests recorded yet.</p>`}</div></div>`;
    document.body.appendChild(wrap);wrap.onclick=e=>{if(e.target===wrap||e.target.closest("[data-close-modal]"))wrap.remove();};
  }

  // ------------------------------------------------------------
  // Atlas: world map / settlement map
  // ------------------------------------------------------------
  function ensureAtlasData(){
    state.world.atlas ||= {kingdomPositions:{},settlements:{}};
    const rng=seeded(`${state.world.seed}-atlas-v418`);
    state.world.kingdoms.forEach((k,i)=>{
      if(!state.world.atlas.kingdomPositions[k.id]){
        const angle=(Math.PI*2*i/Math.max(1,state.world.kingdoms.length))+(randInt(-12,12,rng)*Math.PI/180);
        const radius=215+randInt(-45,55,rng);
        state.world.atlas.kingdomPositions[k.id]={x:500+Math.cos(angle)*radius,y:325+Math.sin(angle)*radius};
      }
    });
  }
  function establishmentSeed(location){
    return seeded(`${state.world.seed}-settlement-${location}`);
  }
  function ensureSettlementMap(location=state.game.location){
    ensureAtlasData();const key=`${state.game.kingdomId}:${location}`;
    if(state.world.atlas.settlements[key])return state.world.atlas.settlements[key];
    const rng=establishmentSeed(location),k=currentKingdom();
    const types=[
      ["inn","Inn"],["market","Market"],["smith","Forge"],["temple","Temple"],
      ["healer","Healer"],["stable","Stables"],["alchemist","Alchemist"],["watch","Watch Post"]
    ];
    const establishments=types.map(([type,label],i)=>{
      let owner=null;
      if(type==="inn")owner=(state.world.npcs||[]).find(n=>n.location===location&&/innkeeper/.test(String(n.occupation||"").toLowerCase()));
      if(type==="smith")owner=(state.world.npcs||[]).find(n=>n.location===location&&/blacksmith|smith/.test(String(n.occupation||"").toLowerCase()));
      const ownerName=owner?.name;
      const name=ownerName?(type==="inn"?`${ownerName.split(" ")[0]}'s Inn`:`${ownerName.split(" ")[0]}'s ${label}`):`${pick(["Crowned","Silver","Old","Red","Golden","Wayfarer's","King's","Moonlit"],rng)} ${label}`;
      const cols=[180,380,610,820],rows=[170,330,500];
      return {id:`${key}-${type}`,type,name,x:cols[i%4]+randInt(-35,35,rng),y:rows[Math.floor(i/4)]+randInt(-30,30,rng)};
    });
    const map={key,location,kingdomId:state.game.kingdomId,establishments};
    state.world.atlas.settlements[key]=map;return map;
  }
  function worldMapSvg(){
    ensureAtlasData();
    const regions=state.world.kingdoms.map(k=>{
      const p=state.world.atlas.kingdomPositions[k.id],sites=(k.spawnSites||[]).slice(0,4);
      const siteLabels=sites.map((s,i)=>{
        const a=(Math.PI*2*i/Math.max(1,sites.length))+.3;
        const sx=p.x+Math.cos(a)*(75+i*5),sy=p.y+Math.sin(a)*(58+i*4);
        return `<circle cx="${sx}" cy="${sy}" r="${s.kind==="capital"?7:4}" class="atlas-town ${s.kind==="capital"?"capital":""}"/><text x="${sx+8}" y="${sy+4}" class="atlas-settlement-label">${escapeHtml(s.name)}</text>`;
      }).join("");
      return `<g><ellipse cx="${p.x}" cy="${p.y}" rx="125" ry="90" fill="${escapeHtml(k.color||"#775533")}" opacity=".14" stroke="${escapeHtml(k.color||"#997755")}" stroke-width="2"/><text x="${p.x}" y="${p.y-18}" text-anchor="middle" class="atlas-region-label">${escapeHtml(k.region)}</text><text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="atlas-kingdom-label">${escapeHtml(k.name)}</text>${siteLabels}</g>`;
    }).join("");
    return `<svg class="atlas-svg" viewBox="0 0 1000 650" role="img" aria-label="World map"><defs><pattern id="paperGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(115,83,47,.16)" stroke-width="1"/></pattern></defs><rect width="1000" height="650" rx="16" fill="#d6c091"/><rect width="1000" height="650" rx="16" fill="url(#paperGrid)"/><path d="M70,120 C190,40 310,70 400,130 S620,70 750,130 S930,210 905,360 S780,590 640,555 S430,610 300,545 S80,515 92,350 S15,205 70,120Z" fill="#b9a378" opacity=".35" stroke="#6a5031" stroke-width="3"/>${regions}<text x="500" y="625" text-anchor="middle" class="atlas-caption">${escapeHtml(state.world.name)} — regions and known settlements</text></svg>`;
  }
  function settlementMapSvg(){
    const map=ensureSettlementMap(),localNpcs=(state.world.npcs||[]).filter(n=>!n.dead&&(n.location===state.game.location||n.schedule?.currentLocation===state.game.location));
    const buildings=map.establishments.map((e,i)=>`<g class="settlement-place"><rect x="${e.x-48}" y="${e.y-28}" width="96" height="56" rx="8"/><text x="${e.x}" y="${e.y+4}" text-anchor="middle">${escapeHtml(e.name)}</text><text x="${e.x}" y="${e.y+20}" text-anchor="middle" class="small">${escapeHtml(titleCase(e.type))}</text></g>`).join("");
    const npcs=localNpcs.slice(0,18).map((n,i)=>{
      const rng=seeded(`${map.key}-${n.id}`),x=130+randInt(0,740,rng),y=105+randInt(0,430,rng);
      return `<g class="settlement-npc"><circle cx="${x}" cy="${y}" r="9"/><text x="${x+13}" y="${y+4}">${escapeHtml(n.name)}</text></g>`;
    }).join("");
    return `<svg class="atlas-svg settlement-svg" viewBox="0 0 1000 650"><rect width="1000" height="650" rx="16" fill="#d6c091"/><path d="M80 320H920M500 65V590" stroke="#9b845d" stroke-width="40" opacity=".25"/><path d="M80 320H920M500 65V590" stroke="#6f5738" stroke-width="3" opacity=".45"/><rect x="55" y="55" width="890" height="540" rx="28" fill="none" stroke="#6b5131" stroke-width="5"/>${buildings}${npcs}<text x="500" y="40" text-anchor="middle" class="atlas-title">${escapeHtml(state.game.location)}</text><text x="500" y="625" text-anchor="middle" class="atlas-caption">Establishments and currently known NPC positions</text></svg>`;
  }
  function showAtlas(mode="world"){
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.dataset.atlasMode=mode;
    const render=()=>{
      const m=wrap.dataset.atlasMode||"world";
      wrap.innerHTML=`<div class="modal atlas-modal"><div class="ledger-head"><div><div class="eyebrow">Cartographer's atlas</div><h2>${m==="world"?"World Map":"Settlement Map"}</h2></div><button class="ghost-button" data-close-modal>Close</button></div><div class="atlas-tabs"><button class="${m==="world"?"active":""}" data-atlas-tab="world">World</button><button class="${m==="settlement"?"active":""}" data-atlas-tab="settlement">Settlement</button></div>${m==="world"?worldMapSvg():settlementMapSvg()}</div>`;
      wrap.querySelectorAll("[data-atlas-tab]").forEach(b=>b.onclick=()=>{wrap.dataset.atlasMode=b.dataset.atlasTab;render();});
      wrap.querySelector("[data-close-modal]").onclick=()=>wrap.remove();
    };
    document.body.appendChild(wrap);wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});render();
  }

  // ------------------------------------------------------------
  // Equipment slot icons
  // ------------------------------------------------------------
  function equipmentIconSvg(type){
    const common=`viewBox="0 0 64 64" aria-hidden="true"`;
    if(type==="helmet")return `<svg ${common}><path d="M15 35V25C15 14 23 8 32 8s17 6 17 17v10H38v12h-8V35H15Z"/><path d="M15 28h34M23 13l4 9h10l4-9"/></svg>`;
    if(type==="armour")return `<svg ${common}><path d="M21 10l11 5 11-5 9 10-7 7v26H19V27l-7-7 9-10Z"/><path d="M26 17v31M38 17v31M19 30h26"/></svg>`;
    if(type==="weapon")return `<svg ${common}><path d="M43 7l8 8-25 25-7-1-1-7L43 7Z"/><path d="M16 37l11 11M12 43l9 9M8 56l8-8"/></svg>`;
    return `<svg ${common}><circle cx="30" cy="30" r="15"/><path d="M30 9v8M30 43v8M9 30h8M43 30h8M19 19l6 6M41 19l-6 6M19 41l6-6M41 41l-6-6"/></svg>`;
  }
  function equipmentMiniIcon(item){
    const t=String(item||"").toLowerCase();
    const type=/helm|hood|crown|hat/.test(t)?"helmet":/armour|armor|mail|plate|robe|coat/.test(t)?"armour":/sword|axe|bow|spear|dagger|mace|staff|blade|hammer/.test(t)?"weapon":"gadget";
    return `<span class="equipment-mini-icon">${equipmentIconSvg(type)}</span>`;
  }
  function injectEquipmentSilhouette(){
    const left=document.querySelector(".left-panel");if(!left||document.getElementById("equipmentSilhouette"))return;
    const c=state.character,slots=[
      ["helmet","Helmet",c.equipment?.head],
      ["armour","Armour",c.equipment?.body],
      ["weapon","Weapon",c.equipment?.mainHand],
      ["gadget","Gadget",c.equipment?.accessory||c.equipment?.offHand]
    ];
    const sec=document.createElement("section");sec.className="panel hud-card";sec.id="equipmentSilhouette";
    sec.innerHTML=`<div class="hud-heading">Equipment</div><div class="equipment-icon-grid">${slots.map(([type,label,item])=>`<div class="equipment-slot-tile"><div class="slot-icon">${equipmentIconSvg(type)}</div><strong>${label}</strong><span>${escapeHtml(item||"Empty")}</span></div>`).join("")}</div>`;
    left.appendChild(sec);
  }

  // ------------------------------------------------------------
  // Bestiary
  // ------------------------------------------------------------
  const BESTIARY_LORE={
    "Starved Wolf":"A gaunt predatory wolf made dangerous by hunger. It circles for weakness before lunging at exposed limbs.",
    "Goblin Scavenger":"A small but cunning goblin survivor that fights with scavenged weapons, feints and opportunistic dirty tricks.",
    "Bog Imp":"A spiteful marsh-dwelling lesser fiend whose claws and crude hexes make it more dangerous than its size suggests.",
    "Dire Boar":"An enormous wild boar with dense muscle, heavy tusks and a devastating straight-line charge.",
    "Skeleton Guard":"An animated warrior skeleton held together by old magic and the habits of a soldier long after death.",
    "Angry Guard Dog":"A trained dog driven into combat by aggression, fear or command."
  };
  function ensureBestiaryData(){state.world.bestiary=state.world.bestiary&&typeof state.world.bestiary==="object"?state.world.bestiary:{};return state.world.bestiary;}
  function bestiaryEligible(name){
    if(!name)return false;
    if(BESTIARY_LORE[name])return true;
    if((CREATURES||[]).some(x=>x.name===name))return !/bandit/i.test(name);
    return /wolf|boar|imp|skeleton|undead|dragon|wyrm|spider|bear|dog|beast|goblin|orc|troll|ogre|demon|fiend|elemental|slime|serpent|wyvern|griff|harpy|wraith|ghoul|zombie|vampire|kobold/i.test(name);
  }
  function registerBestiaryEncounter(base){
    if(!base?.name||!bestiaryEligible(base.name))return;
    const b=ensureBestiaryData(),existing=b[base.name]||{
      name:base.name,
      description:BESTIARY_LORE[base.name]||`A dangerous creature encountered in ${state.game.areaType}. Its exact nature is recorded from direct observation rather than hearsay.`,
      skills:[...(base.attacks||["Unknown attack"])],
      habitats:[...(base.habitats||[state.game.areaType])],
      level:base.level||state.game.combat?.level||1,
      encounters:0,defeated:0,firstSeen:{day:state.world.day,location:state.game.location}
    };
    existing.encounters++;existing.lastSeen={day:state.world.day,location:state.game.location};
    if(base.attacks)existing.skills=[...new Set([...existing.skills,...base.attacks])];
    b[base.name]=existing;
  }
  function startCombatV418(forceType=null,context=state.game.areaType||"town"){
    startCombatV417(forceType,context);
    const combat=state.game.combat;if(!combat)return;
    const def=forceType||[...(CREATURES||[]),...(URBAN_ENCOUNTERS||[])].find(x=>x.name===combat.name)||{name:combat.name,level:combat.level,attacks:combat.attacks,habitats:[context]};
    registerBestiaryEncounter(def);
  }
  function markBestiaryDefeat(name){
    const b=ensureBestiaryData();if(b[name])b[name].defeated=(b[name].defeated||0)+1;
  }
  async function hydrateBestiaryImage(name){
    const img=document.querySelector(`[data-bestiary-img="${CSS.escape(name)}"]`);if(!img)return;
    const cached=await mediaCacheGet(`bestiary:${name}`);if(cached)img.src=cached;
  }
  async function generateBestiaryImage(name){
    const e=ensureBestiaryData()[name];if(!e)return;
    const img=document.querySelector(`[data-bestiary-img="${CSS.escape(name)}"]`);
    const btn=document.querySelector(`[data-gen-bestiary="${CSS.escape(name)}"]`);
    if(btn){btn.disabled=true;btn.textContent="Illustrating…";}
    try{
      const prompt=`Medieval illuminated bestiary illustration on aged parchment, full body fantasy creature study, ${e.name}. ${e.description} Known abilities: ${(e.skills||[]).join(", ")}. Historically inspired ink, tempera and gold-leaf manuscript style, detailed creature anatomy, no text, no modern objects, no border watermark.`;
      const art=await requestGeneratedArt(prompt,Math.abs(hashString(`${state.world.seed}-${name}`)));
      await mediaCachePut(`bestiary:${name}`,art);
      if(img){img.src=art;img.classList.remove("portrait-error");}
    }catch(err){
      const message=String(err?.message||err||"Bestiary illustration failed.");
      if(img){img.src=placeholderArtSvg(name,"beast");img.classList.add("portrait-error");}
      showToast(message);
    }finally{
      if(btn){btn.disabled=false;btn.textContent="Generate medieval illustration";}
    }
  }

  function showBestiary(){
    const entries=Object.values(ensureBestiaryData()).sort((a,b)=>a.name.localeCompare(b.name)),wrap=document.createElement("div");wrap.className="modal-backdrop";
    wrap.innerHTML=`<div class="modal codex-modal"><div class="ledger-head"><div><div class="eyebrow">Field observations</div><h2>Bestiary</h2><p class="section-copy">Creatures are added when you actually encounter them.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="bestiary-grid">${entries.length?entries.map(e=>{queueMicrotask(()=>hydrateBestiaryImage(e.name));return `<article class="bestiary-card"><img data-bestiary-img="${escapeHtml(e.name)}" src="${placeholderArtSvg(e.name,"beast")}" alt="${escapeHtml(e.name)} medieval bestiary illustration"><div><div class="eyebrow">Encountered ${e.encounters} • Defeated ${e.defeated||0}</div><h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.description)}</p><div class="skill-chips">${(e.skills||[]).map(s=>`<span>${escapeHtml(titleCase(s))}</span>`).join("")}</div><small>Habitats: ${escapeHtml((e.habitats||[]).join(", "))}</small><button class="secondary-button" data-gen-bestiary="${escapeHtml(e.name)}">Generate medieval illustration</button></div></article>`}).join(""):`<p class="empty-copy">You have not encountered any monsters or creatures yet.</p>`}</div></div>`;
    document.body.appendChild(wrap);wrap.onclick=e=>{if(e.target===wrap||e.target.closest("[data-close-modal]"))wrap.remove();};
  }

  // ------------------------------------------------------------
  // NPC generated portraits
  // ------------------------------------------------------------
  function npcPortraitPromptV418(npc){
    const v=ensureNpcVisualProfile(npc),gear=[...(v.visible_gear||[]),npc.combatLoadout?.weapon,npc.combatLoadout?.armour].filter(Boolean);
    return `Medieval fantasy character portrait painted like an illuminated manuscript and realistic period portrait, waist-up, ${npc.name}, ${npc.occupation}, age ${npc.age||v.apparent_age}, ${v.build}, ${v.face}, hair: ${v.hair}, clothing: ${v.clothing}, posture: ${v.posture}, distinguishing feature: ${v.distinguishing_detail}. Visible equipment: ${gear.join(", ")||"simple period clothing"}. Neutral parchment background, accurate equipment, natural face, no text, no modern objects, no extra limbs.`;
  }
  async function hydrateNpcPortrait(npcId){
    const img=document.querySelector(`[data-npc-portrait="${CSS.escape(npcId)}"]`);if(!img)return;
    const cached=await mediaCacheGet(`npc:${npcId}`);if(cached)img.src=cached;
  }
  async function generateNpcPortrait(npcId){
    const npc=findNpcById(npcId);if(!npc)return;
    const img=document.querySelector(`[data-npc-portrait="${CSS.escape(npcId)}"]`);
    const btn=document.querySelector(`[data-gen-portrait="${CSS.escape(npcId)}"]`);
    const status=document.querySelector(`[data-portrait-status="${CSS.escape(npcId)}"]`);
    if(btn){btn.disabled=true;btn.textContent="Painting…";}
    if(status){status.textContent="Generating portrait…";status.className="portrait-status loading";}
    try{
      const art=await requestGeneratedArt(npcPortraitPrompt(npc),Math.abs(hashString(`${state.world.seed}-${npc.id}`)));
      await mediaCachePut(`npc:${npc.id}`,art);
      if(img){img.src=art;img.classList.remove("portrait-error");}
      if(status){status.textContent="Portrait generated and cached locally.";status.className="portrait-status success";}
    }catch(err){
      const message=String(err?.message||err||"Portrait generation failed.");
      if(img){img.src=placeholderArtSvg(npc.name,"npc");img.classList.add("portrait-error");}
      if(status){status.textContent=message;status.className="portrait-status error";}
      showToast(message);
    }finally{
      if(btn){btn.disabled=false;btn.textContent="Generate portrait";}
    }
  }

  function npcEquipmentStrip(npc){
    const v=ensureNpcVisualProfile(npc),items=[...(v.visible_gear||[])];
    if(npc.combatLoadout?.weapon)items.unshift(npc.combatLoadout.weapon);
    return [...new Set(items)].slice(0,5).map(item=>`<span class="npc-equipment-chip">${equipmentMiniIcon(item)}<span>${escapeHtml(item)}</span></span>`).join("");
  }
  function peopleJournalCard(npc){
    ensureNpcDeepProfile(npc);ensureFamilyData(npc);queueMicrotask(()=>hydrateNpcPortrait(npc.id));
    const f=factionById(npc.factionId),r=npc.romance,hist=(npc.interactionHistory||[]).slice(-5).reverse(),last=npc.lastSeen;
    const pregnancy=npc.pregnancy?.active?`<span>Pregnant • day ${npc.pregnancy.days}/${npc.pregnancy.term}</span>`:"";
    const children=(npc.childrenIds||[]).length;
    return `<article class="people-card ${npc.dead?"dead":""}">
      <div class="npc-codex-layout">
        <div class="npc-portrait-column"><img class="npc-portrait" data-npc-portrait="${escapeHtml(npc.id)}" src="${placeholderArtSvg(npc.name,"npc")}" alt="${escapeHtml(npc.name)} portrait"><button class="ghost-button" data-gen-portrait="${escapeHtml(npc.id)}">Generate portrait</button><div class="portrait-status" data-portrait-status="${escapeHtml(npc.id)}"></div><div class="npc-equipment-strip">${npcEquipmentStrip(npc)}</div></div>
        <div class="npc-codex-main">
          <div class="people-card-head"><div><div class="eyebrow">${f?escapeHtml(f.name):"Independent"}${npc.companion?" • Companion":""}</div><h3>${escapeHtml(npc.name)}</h3><div class="character-sub">${escapeHtml(npc.occupation)} • ${escapeHtml(npc.sex||"Unknown")} • Age ${npc.age} • ${escapeHtml(npc.personality)} • ${escapeHtml(updateNpcBond(npc))}</div></div><div class="people-status-stack"><span>${escapeHtml(relationshipSummaryLabel(npc))}</span>${r.state!=="none"?`<span class="romance-tag">${escapeHtml(romanceStateLabel(r.state))}</span>`:""}${pregnancy}${children?`<span>${children} child${children===1?"":"ren"}</span>`:""}${npc.dead?`<span class="bad-tag">DEAD</span>`:""}</div></div>
          <div class="people-facts-grid"><div><span>Relationship</span><strong>${npc.relationship}</strong></div><div><span>Trust</span><strong>${npc.socialAxes?.trust??0}</strong></div><div><span>Respect</span><strong>${npc.socialAxes?.respect??0}</strong></div><div><span>Fear</span><strong>${npc.socialAxes?.fear??0}</strong></div><div><span>Suspicion</span><strong>${npc.socialAxes?.suspicion??0}</strong></div><div><span>Meetings</span><strong>${npc.meetingCount||1}</strong></div></div>
          <p class="people-summary">${escapeHtml(npcJournalSummary(npc))}</p>
          <div class="people-known"><strong>Known information</strong><p>${escapeHtml(knownNpcAppearance(npc))}</p><p>Last known location: <strong>${escapeHtml(npc.schedule?.currentLocation||npc.location||last?.location||"Unknown")}</strong>${last?` • last seen day ${last.day}`:""}</p><p>Current routine: ${escapeHtml(npc.schedule?.activity||"unknown")} • Goal: ${escapeHtml(npc.lifeGoal?.text||"No known current goal")}</p></div>
          ${hist.length?`<div class="people-history"><strong>Shared history</strong>${hist.map(h=>`<div><span>Day ${h.day}</span><p>${escapeHtml(h.text)}</p></div>`).join("")}</div>`:""}
          ${!npc.dead&&npc.location===state.game.location&&npc.kingdomId===state.game.kingdomId?`<button type="button" class="secondary-button" data-people-talk="${escapeHtml(npc.id)}">Approach ${escapeHtml(npc.name.split(" ")[0])}</button>`:""}
        </div>
      </div>
    </article>`;
  }

  // ------------------------------------------------------------
  // Procedural audio: music + action-synchronised SFX
  // ------------------------------------------------------------
  let rrAudioCtx=null,rrMusicTimer=null,rrMusicStep=0;
  function ensureAudioSettings(){
    state.game.audioSettings=state.game.audioSettings||{music:false,sfx:true,volume:.35};
    return state.game.audioSettings;
  }
  function audioCtx(){
    if(!rrAudioCtx)rrAudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(rrAudioCtx.state==="suspended")rrAudioCtx.resume();
    return rrAudioCtx;
  }
  function tone(freq,duration=.12,type="sine",gain=.05,delay=0){
    try{
      const ctx=audioCtx(),o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime+delay;
      o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*ensureAudioSettings().volume),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+duration+.03);
    }catch{}
  }
  function noiseBurst(duration=.16,gain=.05,filterFreq=1200){
    try{
      const ctx=audioCtx(),buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate),d=buffer.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;filter.type="bandpass";filter.frequency.value=filterFreq;g.gain.value=gain*ensureAudioSettings().volume;src.connect(filter).connect(g).connect(ctx.destination);src.start();
    }catch{}
  }
  function playSfx(kind){
    if(!ensureAudioSettings().sfx)return;
    if(kind==="fire"){noiseBurst(.28,.08,500);tone(150,.3,"sawtooth",.05);tone(95,.36,"triangle",.04,.05);}
    else if(kind==="lightning"){noiseBurst(.12,.13,2400);tone(1100,.08,"square",.08);tone(210,.22,"sawtooth",.055,.04);}
    else if(kind==="ice"){tone(1800,.09,"sine",.05);tone(1300,.13,"sine",.04,.06);noiseBurst(.16,.025,3400);}
    else if(kind==="sword"){tone(680,.08,"square",.04);tone(1040,.06,"sine",.035,.03);}
    else if(kind==="punch"){tone(90,.09,"sine",.09);noiseBurst(.06,.035,450);}
    else if(kind==="bow"){tone(360,.09,"triangle",.04);noiseBurst(.09,.025,1500);}
    else if(kind==="heal"){tone(523,.18,"sine",.035);tone(659,.2,"sine",.03,.09);tone(784,.22,"sine",.025,.18);}
    else if(kind==="coin"){tone(1400,.08,"sine",.035);tone(1900,.1,"sine",.025,.07);}
    else if(kind==="magic"){tone(420,.18,"sine",.035);tone(630,.16,"triangle",.025,.05);}
  }
  function actionSoundKind(text){
    const t=String(text||"").toLowerCase();
    if(/lightning|thunder|electric|shock|storm bolt/.test(t))return "lightning";
    if(/fireball|fire|flame|inferno|burn/.test(t))return "fire";
    if(/ice|frost|freeze|blizzard/.test(t))return "ice";
    if(/heal|restore|mend|holy light/.test(t))return "heal";
    if(/arrow|bow|crossbow|shoot/.test(t))return "bow";
    if(/sword|slash|slice|blade|stab|axe|cleave/.test(t))return "sword";
    if(/punch|jab|hook|kick|elbow|headbutt/.test(t))return "punch";
    if(/spell|magic|cast|arcane|aura/.test(t))return "magic";
    return null;
  }
  function playActionSoundFromText(text){const k=actionSoundKind(text);if(k)playSfx(k);}
  function stopFantasyMusic(){if(rrMusicTimer){clearInterval(rrMusicTimer);rrMusicTimer=null;}ensureAudioSettings().music=false;}
  function startFantasyMusic(){
    const settings=ensureAudioSettings();settings.music=true;audioCtx();
    if(rrMusicTimer)return;
    const scale=[220,261.63,293.66,329.63,392,329.63,293.66,246.94];
    const play=()=>{if(!ensureAudioSettings().music)return;const f=scale[rrMusicStep++%scale.length];tone(f,.8,"triangle",.018);tone(f/2,1.15,"sine",.009,.06);};
    play();rrMusicTimer=setInterval(play,1450);
  }
  function showAudioPanel(){
    const a=ensureAudioSettings(),wrap=document.createElement("div");wrap.className="modal-backdrop";
    wrap.innerHTML=`<div class="modal"><div class="ledger-head"><div><div class="eyebrow">Soundscape</div><h2>Audio</h2><p class="section-copy">Procedural ambience and effects generated directly in the browser.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="system-row"><div><strong>Medieval ambience</strong><small>Quiet procedural fantasy music. Browser rules require a click before audio can start.</small></div><button class="secondary-button" id="toggleMusic">${a.music?"Stop music":"Start music"}</button></div><div class="system-row"><div><strong>Action sound effects</strong><small>Typed fire, lightning, blades, punches, bows and magic trigger matching effects.</small></div><button class="secondary-button" id="toggleSfx">${a.sfx?"SFX on":"SFX off"}</button></div><div class="field"><label>Volume</label><input id="audioVol" type="range" min="0.1" max="0.8" step="0.05" value="${a.volume}"></div></div>`;
    document.body.appendChild(wrap);wrap.querySelector("[data-close-modal]").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};
    wrap.querySelector("#toggleMusic").onclick=()=>{a.music?stopFantasyMusic():startFantasyMusic();saveGame(false);wrap.remove();showAudioPanel();};
    wrap.querySelector("#toggleSfx").onclick=()=>{a.sfx=!a.sfx;if(a.sfx)playSfx("coin");saveGame(false);wrap.remove();showAudioPanel();};
    wrap.querySelector("#audioVol").oninput=e=>{a.volume=Number(e.target.value);};
  }

  // ------------------------------------------------------------
  // Adult romance, intimacy, pregnancy and children
  // ------------------------------------------------------------
  function ensureFamilyData(npc){
    if(!npc)return npc;ensureNpcRelationshipData(npc);
    npc.sex ||= seeded(`${state.world.seed}-sex-${npc.id}`)()>.5?"Female":"Male";
    npc.childrenIds=Array.isArray(npc.childrenIds)?npc.childrenIds:[];
    npc.flirtHistory=Array.isArray(npc.flirtHistory)?npc.flirtHistory:[];
    npc.family= npc.family&&typeof npc.family==="object"?npc.family:{};
    npc.romance.flirtMomentum=Number(npc.romance.flirtMomentum)||0;
    npc.romance.lastNpcInitiatedFlirtTurn??=-999;
    return npc;
  }
  function pregnancyCompatible(a,b){
    const sexA=String(a?.sex||"").toLowerCase(),sexB=String(b?.sex||"").toLowerCase();
    return (sexA==="female"&&sexB==="male")||(sexA==="male"&&sexB==="female");
  }
  function pregnancyCarrier(player,npc){
    if(!pregnancyCompatible(player,npc))return null;
    return String(player.sex).toLowerCase()==="female"?{kind:"player",person:player}:{kind:"npc",person:npc};
  }
  function recordPregnancy(player,npc,trying=false){
    const carrier=pregnancyCarrier(player,npc);if(!carrier)return false;
    if(carrier.person.pregnancy?.active)return false;
    const chance=trying?.32:.09;if(Math.random()>=chance)return false;
    carrier.person.pregnancy={active:true,days:0,term:270,otherParentId:carrier.kind==="player"?npc.id:"player",conceivedLocation:state.game.location};
    addLog(`<strong>Family:</strong> A pregnancy begins as a persistent part of the world simulation.`,"event");
    if(carrier.kind==="npc")addNpcMemory(npc,"I became pregnant during our relationship.",{category:"romance",propagate:false});
    return true;
  }
  function attemptAdultIntimacy(npc,tryingForChild=false){
    ensureFamilyData(npc);const c=state.character,r=npc.romance;
    if(Number(c.age)<18||Number(npc.age)<18){addLog("Intimacy is unavailable because both characters must be adults.","system");return;}
    if(!["partner","committed"].includes(r.state)){addLog(`${escapeHtml(npc.name)} does not have an established consenting partnership with you for that level of intimacy.`,"system");return;}
    const trust=Number(npc.socialAxes?.trust||0),willing=trust>=55&&r.affection>=60&&r.openness!=="unavailable";
    if(!willing){addLog(`${escapeHtml(npc.name)} is not comfortable with that right now and says so. The boundary is respected.`,"event");recordNpcInteraction(npc,"They declined intimacy and the boundary was respected.","romance");return;}
    r.affection=clamp(r.affection+4,0,100);r.commitment=clamp(r.commitment+2,0,100);
    addLog(`You and <strong>${escapeHtml(npc.name)}</strong> mutually choose to spend private intimate time together. The scene fades to black; later, you return to the wider world.`,"event");
    recordNpcInteraction(npc,tryingForChild?"You mutually chose intimacy while trying for a child.":"You mutually shared private intimate time.","romance");
    if(pregnancyCompatible(c,npc))recordPregnancy(c,npc,tryingForChild);
    advanceTurn();
  }
  function maybeNpcInitiatedFlirt(npc){
    ensureFamilyData(npc);if(!romanceSystemAvailable(npc))return;
    const r=npc.romance;if(!["interested","courting","partner","committed"].includes(r.state))return;
    if(state.game.turn-r.lastNpcInitiatedFlirtTurn<5)return;
    const chance=clamp((r.attraction+r.affection+r.flirtMomentum)/360,.08,.42);
    if(Math.random()>chance)return;
    r.lastNpcInitiatedFlirtTurn=state.game.turn;r.flirtMomentum=clamp(r.flirtMomentum+3,0,100);
    const lines=[
      `${npc.name}'s expression softens when you arrive, and the compliment that follows is just pointed enough to be unmistakably flirtatious.`,
      `${npc.name} catches your eye and lets a teasing remark linger between you instead of immediately returning to business.`,
      `${npc.name} greets you with an unusually warm smile and a playful observation clearly meant for you rather than the room.`
    ];
    addLog(escapeHtml(pick(lines)),"ai-dialogue");
    recordNpcInteraction(npc,"They initiated a light flirtatious exchange with you.","romance");
  }
  function startConversation(primary,count=1){
    startConversationV417(primary,count);
    if(primary){ensureFamilyData(primary);maybeNpcInitiatedFlirt(primary);questTurnInForNpc(primary);}
  }
  function npcAction(action){
    const n=state.game.activeNpc;
    if(action==="npc-intimacy"&&n){attemptAdultIntimacy(n,false);saveGame(false);renderGame();return;}
    if(action==="npc-try-child"&&n){attemptAdultIntimacy(n,true);saveGame(false);renderGame();return;}
    if(action==="npc-quest-turnin"&&n){questTurnInForNpc(n);saveGame(false);renderGame();return;}
    const out=npcActionV417(action);if(n&&action==="npc-flirt"){ensureFamilyData(n);n.romance.flirtMomentum=clamp(n.romance.flirtMomentum+6,0,100);n.flirtHistory.push({turn:state.game.turn,from:"player"});}
    return out;
  }
  function createChildNpcV418(carrier,otherParentId){
    const player=state.character,other=otherParentId==="player"?null:findNpcById(otherParentId);
    const id=`child-${Date.now()}-${Math.floor(Math.random()*9999)}`,name=personName(Math.random);
    const child={id,name,sex:Math.random()>.5?"Female":"Male",age:0,occupation:"child",personality:pick(["quiet and observant","curious and cheerful","bold and energetic","gentle and thoughtful"]),factionId:null,kingdomId:state.game.kingdomId,location:state.game.location,relationship:80,memory:[],socialLinks:{},parents:carrier===player?["player",other?.id].filter(Boolean):[carrier.id,"player"],met:true,firstMet:{day:state.world.day,location:state.game.location,context:"birth"},childrenIds:[]};
    state.world.npcs.push(child);ensureNpcDeepProfile(child);ensureFamilyData(child);
    player.childrenIds=Array.isArray(player.childrenIds)?player.childrenIds:[];player.childrenIds.push(child.id);
    if(other){ensureFamilyData(other);other.childrenIds.push(child.id);}
    if(carrier!==player){ensureFamilyData(carrier);carrier.childrenIds.push(child.id);}
    addLog(`<strong>Family:</strong> ${escapeHtml(name)} is born and becomes a persistent member of your family and the world.`,"event");
    addEvent(`${name} was born`);
    return child;
  }
  function advanceFamilySimulationV418(){
    state.world.elapsedDays=(state.world.elapsedDays||0)+1;
    const c=state.character;
    if(c.pregnancy?.active){c.pregnancy.days++;if(c.pregnancy.days>=c.pregnancy.term){const other=c.pregnancy.otherParentId;c.pregnancy.active=false;createChildNpc(c,other);}}
    for(const n of state.world.npcs||[]){
      ensureFamilyData(n);
      if(n.pregnancy?.active){n.pregnancy.days++;if(n.pregnancy.days>=n.pregnancy.term){const other=n.pregnancy.otherParentId;n.pregnancy.active=false;createChildNpc(n,other);}}
      if(n.occupation==="child"&&n.parents?.includes("player")){n.daysAlive=(n.daysAlive||0)+1;n.age=Math.floor(n.daysAlive/365);}
    }
  }
  function advanceWorldDayV418(days=1){for(let i=0;i<days;i++){advanceWorldDayV417(1);advanceFamilySimulation();}}

  // ------------------------------------------------------------
  // V4.18 UI injection
  // ------------------------------------------------------------
  function injectAdventureUiV418(){
    injectEquipmentSilhouette();
    const right=document.querySelector(".right-panel");
    if(right&&!document.getElementById("adventureCodexPanel")){
      const sec=document.createElement("section");sec.className="panel hud-card";sec.id="adventureCodexPanel";
      sec.innerHTML=`<div class="hud-heading">Adventure codex</div><div class="codex-button-grid"><button class="secondary-button" id="openAtlas">Atlas</button><button class="secondary-button" id="openQuests">Quests</button><button class="secondary-button" id="openBestiary">Bestiary</button><button class="ghost-button" id="openAudio">Audio</button></div>`;
      right.appendChild(sec);
      sec.querySelector("#openAtlas").onclick=()=>showAtlas("world");
      sec.querySelector("#openQuests").onclick=showQuestJournal;
      sec.querySelector("#openBestiary").onclick=showBestiary;
      sec.querySelector("#openAudio").onclick=showAudioPanel;
    }
    const grid=document.querySelector(".choice-area .choice-grid"),n=state.game.activeNpc;
    if(grid&&n){
      ensureFamilyData(n);
      const returnQuest=(state.world.quests||[]).some(q=>q.status==="active"&&q.questGiverNpcId===n.id&&activeQuestStage(q)?.objectiveKind==="return");
      if(returnQuest&&!grid.querySelector('[data-action="npc-quest-turnin"]')){
        const b=document.createElement("button");b.className="choice-button";b.dataset.action="npc-quest-turnin";b.innerHTML="<strong>Report back</strong><small>Advance or complete the quest you took from this NPC.</small>";grid.appendChild(b);
      }
      if(["partner","committed"].includes(n.romance?.state)&&!grid.querySelector('[data-action="npc-intimacy"]')){
        const b=document.createElement("button");b.className="choice-button";b.dataset.action="npc-intimacy";b.innerHTML="<strong>Share private time</strong><small>Adult, mutual intimacy; handled as a fade-to-black relationship event.</small>";grid.appendChild(b);
        if(pregnancyCompatible(state.character,n)){
          const c=document.createElement("button");c.className="choice-button";c.dataset.action="npc-try-child";c.innerHTML="<strong>Try for a child</strong><small>Adult partners can mutually choose to try for pregnancy.</small>";grid.appendChild(c);
        }
      }
    }
    const left=document.querySelector(".left-panel");
    if(left&&!document.getElementById("familyHud")&&((state.character.childrenIds||[]).length||state.character.pregnancy?.active)){
      const sec=document.createElement("section");sec.className="panel hud-card";sec.id="familyHud";
      sec.innerHTML=`<div class="hud-heading">Family</div>${state.character.pregnancy?.active?`<div class="hud-row"><span>Pregnancy</span><strong>Day ${state.character.pregnancy.days}/${state.character.pregnancy.term}</strong></div>`:""}<div class="hud-row"><span>Children</span><strong>${(state.character.childrenIds||[]).length}</strong></div>`;left.appendChild(sec);
    }
  }
  function injectIntegrityUiV418(){injectIntegrityUiV417();injectAdventureUiV418();}

  // ------------------------------------------------------------
  // AI / action wrappers
  // ------------------------------------------------------------
  function npcForAi(n){
    const base=npcForAiV417(n);ensureFamilyData(n);
    return {...base,family:{sex:n.sex,pregnancy:n.pregnancy?.active?{days:n.pregnancy.days,term:n.pregnancy.term}:null,children:(n.childrenIds||[]).length},romance:{...base.romance,flirt_momentum:n.romance?.flirtMomentum||0,adult_only:true,intimacy_instruction:"Any sexual intimacy must involve consenting adults age 18+ and be narrated non-explicitly / fade-to-black."}};
  }
  async function submitRoleplayInput(prefill=null){
    const raw=String(prefill??document.getElementById("roleplayInput")?.value??"").trim();
    if(raw)playActionSoundFromText(raw);
    return submitRoleplayInputV417(prefill);
  }

  // ------------------------------------------------------------
  // Global delegated handlers for generated art buttons
  // ------------------------------------------------------------
  document.addEventListener("click",e=>{
    const p=e.target.closest?.("[data-gen-portrait]");if(p){generateNpcPortrait(p.dataset.genPortrait);return;}
    const b=e.target.closest?.("[data-gen-bestiary]");if(b){generateBestiaryImage(b.dataset.genBestiary);return;}
  });



  function showMenuV418() {
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

  // ============================================================
  // V4.19 — WORLD COHERENCE & STABILITY
  // ============================================================
  const V419_SCHEMA_VERSION=19;
  const V419_BACKUP_COUNT=3;
  const V419_BACKUP_PREFIX=`${SAVE_KEY}.backup.`;

  function cloneJson(value){
    if(value==null)return value;
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
    catch{return JSON.parse(JSON.stringify(value));}
  }
  function checksumString(text){
    let h=2166136261;
    for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16).padStart(8,'0');
  }
  function currentSavePayload(){
    return {version:'4.19',schemaVersion:V419_SCHEMA_VERSION,character:state.character,worldConfig:state.worldConfig,world:state.world,game:state.game};
  }
  function makeSaveEnvelope(payload=currentSavePayload()){
    // Clone first so later in-memory mutations cannot invalidate the checksum of
    // an envelope that is waiting to be written/exported.
    const snapshot=cloneJson(payload),payloadText=JSON.stringify(snapshot);
    return {format:'realms-and-ruin-save',schemaVersion:V419_SCHEMA_VERSION,savedAt:new Date().toISOString(),turn:Number(snapshot?.game?.turn||0),worldDay:Number(snapshot?.world?.day||0),checksum:checksumString(payloadText),payload:snapshot};
  }
  function parseSaveRecord(raw){
    if(!raw)return {ok:false,error:'empty'};
    try{
      const parsed=JSON.parse(raw);
      if(parsed?.format==='realms-and-ruin-save'&&parsed.payload){
        const actual=checksumString(JSON.stringify(parsed.payload));
        if(actual!==parsed.checksum)return {ok:false,error:'checksum mismatch',record:parsed};
        return {ok:true,envelope:parsed,payload:parsed.payload,legacy:false};
      }
      if(parsed?.character&&parsed?.world&&parsed?.game)return {ok:true,payload:parsed,legacy:true,envelope:null};
      return {ok:false,error:'unrecognised save format'};
    }catch(err){return {ok:false,error:String(err?.message||err)};}
  }
  function effectiveBackupCount(raw=''){
    // localStorage quotas are usually small. As a campaign grows, reduce the
    // number of duplicate snapshots rather than allowing saving to fail.
    const bytes=String(raw||'').length*2;
    return bytes>1_600_000?1:bytes>800_000?2:V419_BACKUP_COUNT;
  }
  function rotateValidBackup(previousRaw){
    const parsed=parseSaveRecord(previousRaw);if(!parsed.ok)return;
    try{
      const keep=effectiveBackupCount(previousRaw);
      for(let i=keep+1;i<=V419_BACKUP_COUNT;i++)localStorage.removeItem(`${V419_BACKUP_PREFIX}${i}`);
      const b1=parseSaveRecord(localStorage.getItem(`${V419_BACKUP_PREFIX}1`));
      const previousTurn=Number(parsed.payload?.game?.turn||0),lastBackupTurn=Number(b1.payload?.game?.turn??-999);
      if(previousTurn-lastBackupTurn<4&&b1.ok)return;
      for(let i=keep;i>=2;i--){const prior=localStorage.getItem(`${V419_BACKUP_PREFIX}${i-1}`);if(prior)localStorage.setItem(`${V419_BACKUP_PREFIX}${i}`,prior);}
      localStorage.setItem(`${V419_BACKUP_PREFIX}1`,previousRaw);
    }catch(err){
      try{localStorage.removeItem(`${V419_BACKUP_PREFIX}${V419_BACKUP_COUNT}`);}catch{}
      console.warn('Backup rotation limited by browser storage:',err);
    }
  }
  function backupRecords(){
    const rows=[];
    for(let i=1;i<=V419_BACKUP_COUNT;i++){
      const raw=localStorage.getItem(`${V419_BACKUP_PREFIX}${i}`),p=parseSaveRecord(raw);
      if(p.ok)rows.push({slot:i,raw,turn:Number(p.payload?.game?.turn||0),day:Number(p.payload?.world?.day||0),savedAt:p.envelope?.savedAt||'Legacy backup'});
    }
    return rows;
  }

  function ensureV419Collections(){
    if(!state.character||!state.world||!state.game)return;
    const c=state.character,w=state.world,g=state.game;
    w.notifications=Array.isArray(w.notifications)?w.notifications:[];
    w.factionKnowledge=w.factionKnowledge&&typeof w.factionKnowledge==='object'?w.factionKnowledge:{};
    w.settlementStates=w.settlementStates&&typeof w.settlementStates==='object'?w.settlementStates:{};
    w.persistentEncounters=w.persistentEncounters&&typeof w.persistentEncounters==='object'?w.persistentEncounters:{};
    w.processedTransactions=w.processedTransactions&&typeof w.processedTransactions==='object'?w.processedTransactions:{};
    w.transactionSeq=Number(w.transactionSeq)||1;
    w.longTermSummaries=Array.isArray(w.longTermSummaries)?w.longTermSummaries:[];
    w.discoveredSites=Array.isArray(w.discoveredSites)?w.discoveredSites:[];
    w.weather=w.weather&&typeof w.weather==='object'?w.weather:{};
    w.saveMeta=w.saveMeta&&typeof w.saveMeta==='object'?w.saveMeta:{};
    w.regressionHistory=Array.isArray(w.regressionHistory)?w.regressionHistory:[];
    c.childrenIds=Array.isArray(c.childrenIds)?c.childrenIds:[];
    c.familyHousehold=c.familyHousehold&&typeof c.familyHousehold==='object'?c.familyHousehold:{};
    g.validation=g.validation&&typeof g.validation==='object'?g.validation:{};
    g.lastSanityReport=g.lastSanityReport&&typeof g.lastSanityReport==='object'?g.lastSanityReport:{};
  }
  function freshNpcId(prefix='npc'){
    ensureV419Collections();const used=new Set((state.world.npcs||[]).map(n=>n.id));let n=Number(state.world.nextNpcSerial)||state.world.npcs.length+1,id;
    do{id=`${prefix}-${state.world.seed||'world'}-${n++}`;}while(used.has(id));state.world.nextNpcSerial=n;return id;
  }
  function validateAndRepairState({quiet=true}={}){
    const report={ok:true,repaired:[],warnings:[],checkedAt:new Date().toISOString()};
    if(!state.character||!state.world||!state.game){report.ok=false;report.warnings.push('Core adventure state is incomplete.');return report;}
    try{ensureV2Data();ensureV4Data?.();ensureV46Data?.();ensureSimulationIntegrityData?.();ensureV419Collections();}catch(err){report.warnings.push(`Migration helper warning: ${String(err?.message||err)}`);}
    const c=state.character,w=state.world,g=state.game;
    const arr=(obj,key)=>{if(!Array.isArray(obj[key])){obj[key]=[];report.repaired.push(`${key} reset to array`);}return obj[key];};
    arr(c,'inventory');arr(c,'injuries');arr(c,'companions');arr(c,'childrenIds');arr(w,'npcs');arr(w,'quests');arr(w,'rumours');arr(w,'events');arr(w,'transactions');
    c.stats=c.stats&&typeof c.stats==='object'?c.stats:{str:8,dex:8,con:8,int:8,wis:8,cha:8};
    c.hp=clamp(Number(c.hp)||1,0,Math.max(1,Number(c.maxHp)||1));
    if(c.currency)setWalletCopper(c,Math.max(0,walletCopper(c.currency)));
    g.turn=Math.max(0,Number(g.turn)||0);g.aiTurn=Math.max(0,Number(g.aiTurn)||0);
    const seen=new Set();
    for(const n of w.npcs){
      if(!n||typeof n!=='object')continue;
      if(!n.id||seen.has(n.id)){const old=n.id;n.id=freshNpcId('npc');report.repaired.push(`NPC id repaired${old?` (${old})`:''}`);}seen.add(n.id);
      n.memory=Array.isArray(n.memory)?n.memory:[];n.inventory=Array.isArray(n.inventory)?n.inventory:[];n.injuries=Array.isArray(n.injuries)?n.injuries:[];
      n.relationship=clamp(Number(n.relationship)||0,-100,100);
      try{ensureNpcDeepProfile(n);ensureNpcEconomyData(n);ensureNpcResourceState(n);ensureNpcLifeState(n);ensureFamilyData(n);ensureNpcCombatIdentity(n);ensureNpcVisualIdentity(n);}catch(err){report.warnings.push(`NPC repair ${n.name||n.id}: ${String(err?.message||err)}`);}
      if(n.dead)n.schedule&&(n.schedule.available=false);
    }
    if(g.activeNpc?.id){const live=findNpcById(g.activeNpc.id);if(!live||live.dead){g.activeNpc=null;g.conversationFocusId=null;report.repaired.push('Invalid active NPC cleared');}}
    g.sceneNpcs=Array.isArray(g.sceneNpcs)?g.sceneNpcs.filter(id=>{const n=findNpcById(id);return n&&!n.dead;}):[];
    for(const [key,id] of Object.entries(w.serviceNpcs||{})){const n=findNpcById(id);if(!n||n.dead){delete w.serviceNpcs[key];report.repaired.push(`Dead/missing service provider reference cleared: ${key}`);}}
    for(const q of w.quests){if(!q||typeof q!=='object')continue;ensureQuestStages(q);ensureQuestCoherence(q);if(!['active','completed','failed','abandoned','resolved_differently'].includes(q.status))q.status='active';}
    for(const r of w.rumours){if(typeof r==='object'){r.knownBy=Array.isArray(r.knownBy)?r.knownBy:[];r.retellings=r.retellings&&typeof r.retellings==='object'?r.retellings:{};}}
    for(const comp of c.companions){comp.hp=clamp(Number(comp.hp)||0,0,Math.max(1,Number(comp.maxHp)||1));comp.morale=clamp(Number(comp.morale)||50,0,100);if(comp.npcId&&!findNpcById(comp.npcId))report.warnings.push(`Companion ${comp.name||comp.npcId} has no matching NPC record.`);}
    try{ensureSettlementState(g.location,g.kingdomId);updateCarryingState();syncOwnershipLedger();currentWeather();}catch(err){report.warnings.push(`World-state repair warning: ${String(err?.message||err)}`);}
    g.validation={...report,repairCount:report.repaired.length,warningCount:report.warnings.length};
    report.ok=report.warnings.length<8;
    if(!quiet&&(report.repaired.length||report.warnings.length))showToast(`State check: ${report.repaired.length} repair(s), ${report.warnings.length} warning(s).`);
    return report;
  }

  function saveGame(showMessage=true){
    if(!state.character||!state.world||!state.game)return;
    const validation=validateAndRepairState({quiet:true});
    try{
      const previous=localStorage.getItem(SAVE_KEY);if(previous)rotateValidBackup(previous);
      // Put current validation metadata into the payload before the immutable
      // envelope snapshot is made. The checksum itself stays envelope-level.
      state.world.saveMeta={schema:V419_SCHEMA_VERSION,lastSavedAt:new Date().toISOString(),lastValidation:{repairs:validation.repaired.length,warnings:validation.warnings.length}};
      const env=makeSaveEnvelope();
      state.world.saveMeta.lastSavedAt=env.savedAt;
      localStorage.setItem(SAVE_KEY,JSON.stringify(env));
      state.world.saveMeta.lastChecksum=env.checksum; // runtime diagnostic only; avoids checksum self-reference
      if(saveStatus)saveStatus.textContent=`Saved ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • integrity ${validation.warnings.length?'CHECK':'OK'}`;
      if(showMessage)showToast(validation.warnings.length?'Adventure saved with validation warnings.':'Adventure saved + verified.');
    }catch(err){console.warn('Initial save write failed:',err);try{localStorage.removeItem(`${V419_BACKUP_PREFIX}${V419_BACKUP_COUNT}`);const retry=makeSaveEnvelope();localStorage.setItem(SAVE_KEY,JSON.stringify(retry));state.world.saveMeta.lastChecksum=retry.checksum;if(showMessage)showToast('Adventure saved after pruning the oldest backup.');}catch(err2){console.warn('Save storage unavailable:',err2);if(showMessage)showToast('Browser storage could not write the save. Open Recovery & Diagnostics to export it.');}}
  }
  function applyLoadedPayload(payload){
    state.character=payload.character;state.worldConfig=payload.worldConfig;state.world=payload.world;state.game=payload.game;ensureV2Data();validateAndRepairState({quiet:true});state.screen='game';render();
  }
  function loadGame(){
    const candidates=[{label:'main',raw:localStorage.getItem(SAVE_KEY)},...backupRecords().map(x=>({label:`backup ${x.slot}`,raw:x.raw}))];
    for(const candidate of candidates){
      const parsed=parseSaveRecord(candidate.raw);if(!parsed.ok)continue;
      try{
        applyLoadedPayload(parsed.payload);
        if(candidate.label!=='main'){
          // Promote the recovered snapshot immediately so the next launch does
          // not depend on the same backup again.
          saveGame(false);
          showToast(`Main save was invalid. Recovered ${candidate.label} and promoted it to the main save.`);
        }else if(parsed.legacy){
          saveGame(false);
          showToast('Legacy adventure loaded, migrated and re-saved in V4.19 format.');
        }else showToast('Adventure loaded + verified.');
        return true;
      }catch(err){console.warn(`Could not load ${candidate.label}:`,err);}
    }
    showToast('No valid save or backup could be loaded.');return false;
  }
  function exportCurrentSave(){
    validateAndRepairState({quiet:true});const text=JSON.stringify(makeSaveEnvelope(),null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`realms-and-ruin-${state.world?.name||'save'}-v419.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importSaveFile(file){
    if(!file)return;
    if(Number(file.size||0)>8_000_000){showToast('Import rejected: save file is unexpectedly large (>8 MB).');return;}
    const reader=new FileReader();reader.onload=()=>{const raw=String(reader.result||''),parsed=parseSaveRecord(raw);if(!parsed.ok){showToast(`Import rejected: ${parsed.error}`);return;}try{if(!parsed.payload?.character||!parsed.payload?.world||!parsed.payload?.game)throw new Error('Core adventure data is missing');const current=localStorage.getItem(SAVE_KEY);if(current)rotateValidBackup(current);const env=parsed.envelope||makeSaveEnvelope(parsed.payload);localStorage.setItem(SAVE_KEY,JSON.stringify(env));applyLoadedPayload(parsed.payload);saveGame(false);showToast('Imported save loaded, migrated and validated.');}catch(err){showToast(`Import failed: ${String(err?.message||err)}`);}};reader.onerror=()=>showToast('Import failed: browser could not read the file.');reader.readAsText(file);
  }

  function snapshotCoreState(){return cloneJson({character:state.character,worldConfig:state.worldConfig,world:state.world,game:state.game,screen:state.screen});}
  function restoreCoreState(s){
    state.character=s.character;state.worldConfig=s.worldConfig;state.world=s.world;state.game=s.game;state.screen=s.screen;
    // structuredClone/JSON snapshots turn compatibility accessors (notably
    // character.gold) into ordinary data properties. Re-run migrations after
    // rollback so old and new systems cannot drift apart.
    try{ensureV2Data();ensureV4Data?.();ensureV46Data?.();ensureSimulationIntegrityData?.();ensureV419Collections();}catch(err){console.warn('Rollback migration repair warning:',err);}
  }
  function atomicStateTransaction(label,executor){
    const before=snapshotCoreState();
    try{const result=executor();if(result===false||result?.ok===false)throw new Error(result?.error||`${label} rejected`);validateAndRepairState({quiet:true});return {ok:true,result};}
    catch(err){restoreCoreState(before);if(!String(label).startsWith('test '))console.warn(`Rolled back transaction: ${label}`,err);return {ok:false,error:String(err?.message||err)};}
  }

  function pushNotification(type,title,detail='',ref=null,{dedupe=null}={}){
    ensureV419Collections();const w=state.world,key=dedupe||`${type}:${title}:${detail}`;
    const recent=w.notifications.slice(-30).find(n=>n.dedupe===key&&Number(state.game.turn)-Number(n.turn)<3);if(recent)return recent;
    const note={id:`note-${Date.now()}-${Math.floor(Math.random()*9999)}`,type,title,detail,ref,day:w.day,turn:state.game.turn,read:false,dedupe:key};w.notifications.push(note);if(w.notifications.length>100)w.notifications.splice(0,w.notifications.length-100);return note;
  }
  function unreadNotificationCount(){return (state.world?.notifications||[]).filter(n=>!n.read).length;}
  function showNotifications(){
    ensureV419Collections();const wrap=document.createElement('div');wrap.className='modal-backdrop';const notes=state.world.notifications.slice().reverse();
    wrap.innerHTML=`<div class="modal people-modal"><div class="ledger-head"><div><div class="eyebrow">Living world</div><h2>Event Feed</h2><p class="section-copy">Important simulation changes without burying the story log.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="notification-list">${notes.length?notes.map(n=>`<button class="notification-row ${n.read?'':'unread'}" data-note-id="${escapeHtml(n.id)}"><span class="notification-type">${escapeHtml(titleCase(n.type))}</span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.detail||'')} • Day ${n.day}</small></button>`).join(''):`<p class="empty-copy">No important events recorded yet.</p>`}</div><div class="action-row"><button class="ghost-button" id="markNotesRead">Mark all read</button></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('[data-close-modal]').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close();};
    wrap.querySelector('#markNotesRead').onclick=()=>{state.world.notifications.forEach(n=>n.read=true);saveGame(false);close();renderGame();};
    wrap.querySelectorAll('[data-note-id]').forEach(b=>b.onclick=()=>{const n=state.world.notifications.find(x=>x.id===b.dataset.noteId);if(n)n.read=true;saveGame(false);if(n?.type==='quest'){close();showQuestJournal();}else if(n?.type==='map'||n?.type==='settlement'){close();showAtlas(n?.ref?.mode||'world');}else if(n?.type==='npc'){close();showPeopleJournal();}});
  }

  // ---------- Atomic economy / exploit protection ----------
  function nextTransactionId(meta={},amount=0){
    ensureV419Collections();
    if(meta.transactionId)return String(meta.transactionId);
    if(state.game?._currentTransactionId)return String(state.game._currentTransactionId);
    return `tx-${state.world.seed}-${state.world.transactionSeq++}-${state.game.turn}-${amount}`;
  }
  function pruneProcessedTransactions(){
    const entries=Object.entries(state.world.processedTransactions||{});if(entries.length<=320)return;
    entries.sort((a,b)=>Number(a[1]?.turn||0)-Number(b[1]?.turn||0));for(const [id] of entries.slice(0,entries.length-260))delete state.world.processedTransactions[id];
  }
  function transferCurrency(fromOwner,toOwner,amountCopper,meta={}){
    ensureV419Collections();amountCopper=Math.max(0,Math.round(Number(amountCopper)||0));if(amountCopper===0)return true;
    if(!fromOwner||!toOwner)return false;
    const txId=nextTransactionId(meta,amountCopper);
    if(state.world.processedTransactions[txId])return true;
    if(!canAfford(fromOwner,amountCopper))return false;
    const beforeFrom=walletCopper(fromOwner.currency),beforeTo=walletCopper(toOwner.currency);
    if(!changeCurrency(fromOwner,-amountCopper))return false;
    if(!changeCurrency(toOwner,amountCopper)){setWalletCopper(fromOwner,beforeFrom);setWalletCopper(toOwner,beforeTo);return false;}
    const rec={id:txId,day:state.world.day,turn:state.game.turn,location:state.game.location,from:meta.from||'unknown',to:meta.to||'unknown',amountCopper,reason:String(meta.reason||'transaction').slice(0,140),item:meta.item?String(meta.item).slice(0,90):null};
    state.world.transactions.push(rec);if(state.world.transactions.length>160)state.world.transactions.splice(0,state.world.transactions.length-160);
    state.world.processedTransactions[txId]={turn:state.game.turn,day:state.world.day};pruneProcessedTransactions();return true;
  }
  function executeNpcTransaction(npc,amountCopper,kind='pay',item=null,reason='transaction'){
    if(!npc||npc.dead)return false;ensureNpcEconomyData(npc);amountCopper=Math.max(0,Math.round(Number(amountCopper)||0));if(!amountCopper)return true;const explicitTx=state.game?._currentTransactionId;if(explicitTx&&state.world.processedTransactions?.[explicitTx])return true;
    const tx=atomicStateTransaction(`NPC transaction: ${reason}`,()=>{
      const outgoing=['pay','purchase','tip','bribe','gift'].includes(kind),incoming=['sale','reward','refund'].includes(kind);
      if(!outgoing&&!incoming)throw new Error('Unknown transaction direction');
      if(outgoing){
        if(kind==='purchase'&&item){const ix=findInventoryItemIndex(npc,item);if(ix<0)throw new Error(`${npc.name} does not possess ${item}`);}
        if(!transferCurrency(state.character,npc,amountCopper,{from:'player',to:`npc:${npc.id}`,reason,item}))throw new Error('Player cannot afford transaction');
        if(kind==='purchase'&&item){const ix=findInventoryItemIndex(npc,item);state.character.inventory.push(npc.inventory.splice(ix,1)[0]);}
      }else{
        if(kind==='sale'&&item&&findInventoryItemIndex(state.character,item)<0)throw new Error(`Player does not possess ${item}`);
        if(!transferCurrency(npc,state.character,amountCopper,{from:`npc:${npc.id}`,to:'player',reason,item}))throw new Error(`${npc.name} cannot afford transaction`);
        if(kind==='sale'&&item){const ix=findInventoryItemIndex(state.character,item);npc.inventory.push(state.character.inventory.splice(ix,1)[0]);}
      }
      npc.transactionHistory=Array.isArray(npc.transactionHistory)?npc.transactionHistory:[];npc.transactionHistory.push({day:state.world.day,kind,amountCopper,item,reason});if(npc.transactionHistory.length>30)npc.transactionHistory.shift();
      syncOwnershipLedger();updateCarryingState();return true;
    });
    if(!tx.ok){state.game.lastTransactionFailure={turn:state.game.turn,reason:tx.error};addLog(`<strong>Transaction cancelled:</strong> ${escapeHtml(tx.error)}`,'system');return false;}state.game.lastTransactionFailure=null;
    addLog(outgoingTransactionText(npc,amountCopper,kind,item),'event');return true;
  }
  function outgoingTransactionText(npc,amount,kind,item){
    if(['sale','reward','refund'].includes(kind))return `${escapeHtml(npc.name)} pays you <strong>${formatCopper(amount)}</strong>${item?` for ${escapeHtml(item)}`:''}.`;
    return `You pay <strong>${formatCopper(amount)}</strong> to ${escapeHtml(npc.name)}${item?` for ${escapeHtml(item)}`:''}.`;
  }
  function merchantBuybackCap(merchant,good,currentSell){
    merchant.lastPlayerPurchasePrice=merchant.lastPlayerPurchasePrice||{};const last=Number(merchant.lastPlayerPurchasePrice[good.item]||0);return last?Math.min(currentSell,Math.floor(last*.78)):currentSell;
  }
  function buyMarketGood(index){
    const good=MARKET_GOODS[index];if(!good||!state.game.marketOpen)return;const merchant=getOrCreateMarketMerchant();if(!merchant||merchant.dead)return;
    const price=worldPriceCopper(good),stock=Number(merchant.marketStock?.[index]||0);if(stock<=0){showToast('That item is out of stock.');pushNotification('economy',`${good.name} out of stock`,`${merchant.name} has no more available.`,null,{dedupe:`stock:${merchant.id}:${index}`});return;}
    const tx=atomicStateTransaction(`Buy ${good.name}`,()=>{if(!canAfford(state.character,price))throw new Error(`You need ${formatCopper(price)}.`);if(!transferCurrency(state.character,merchant,price,{from:'player',to:`npc:${merchant.id}`,reason:`Bought ${good.name}`,item:good.item}))throw new Error('Payment failed');merchant.marketStock[index]=stock-1;merchant.lastPlayerPurchasePrice=merchant.lastPlayerPurchasePrice||{};merchant.lastPlayerPurchasePrice[good.item]=price;state.character.inventory.push(good.item);adjustMarketPressure(good.category||'tools',2);syncOwnershipLedger();updateCarryingState();return true;});
    if(!tx.ok){showToast(tx.error);return;}addLog(`You buy <strong>${escapeHtml(good.name)}</strong> from ${escapeHtml(merchant.name)} for <strong>${formatCopper(price)}</strong>.`,'event');if(merchant.marketStock[index]===0)pushNotification('economy',`${good.name} sold out`,`${merchant.name}'s remaining stock is exhausted.`);advanceTurn();saveGame(false);renderGame();
  }
  function sellMarketGood(index){
    const good=MARKET_GOODS[index];if(!good||!state.game.marketOpen)return;const merchant=getOrCreateMarketMerchant();if(!merchant||merchant.dead)return;const ix=findInventoryItemIndex(state.character,good.item);if(ix<0){showToast('You do not own that item.');return;}
    const nominal=Math.max(1,Math.floor(worldPriceCopper(good)*.55)),price=merchantBuybackCap(merchant,good,nominal);
    const tx=atomicStateTransaction(`Sell ${good.name}`,()=>{if(!canAfford(merchant,price))throw new Error(`${merchant.name} cannot afford ${formatCopper(price)}.`);if(!transferCurrency(merchant,state.character,price,{from:`npc:${merchant.id}`,to:'player',reason:`Bought ${good.name} from player`,item:good.item}))throw new Error('Merchant payment failed');const remove=findInventoryItemIndex(state.character,good.item);if(remove<0)throw new Error('Item disappeared before sale committed');merchant.inventory.push(state.character.inventory.splice(remove,1)[0]);merchant.marketStock[index]=(merchant.marketStock[index]||0)+1;adjustMarketPressure(good.category||'tools',-1);syncOwnershipLedger();updateCarryingState();return true;});
    if(!tx.ok){showToast(tx.error);return;}addLog(`${escapeHtml(merchant.name)} buys <strong>${escapeHtml(good.name)}</strong> from you for <strong>${formatCopper(price)}</strong>.`,'event');advanceTurn();saveGame(false);renderGame();
  }
  function restockMerchant(n,settlement){
    if(!n||n.dead||!/merchant/.test(String(n.occupation||'')))return;n.marketStock=n.marketStock||{};const wealth=Math.max(10,Number(settlement?.wealth||50));
    MARKET_GOODS.forEach((good,i)=>{const stock=Number(n.marketStock[i]||0),target=clamp(Math.round(2+wealth/18),2,10);if(stock>=target)return;const units=Math.min(target-stock,randInt(0,2));if(units<=0)return;const wholesale=Math.max(1,Math.round(worldPriceCopper(good)*.42))*units;if(canAfford(n,wholesale)){changeCurrency(n,-wholesale);n.marketStock[i]=stock+units;}});
  }

  // ---------- Branching quests / failure / alternate resolutions ----------
  function ensureQuestCoherence(q){
    if(!q)return q;ensureQuestStages(q);q.createdDay=Number(q.createdDay??state.world?.day??0);q.deadlineDay=Number(q.deadlineDay||q.createdDay+(q.multiStage?45:22));q.outcome=q.outcome||null;q.branchHistory=Array.isArray(q.branchHistory)?q.branchHistory:[];
    const s=activeQuestStage(q);if(s&&s.objectiveKind==='combat'&&!s.branchOptions){s.branchOptions=[{key:'direct',label:'Confront the threat',description:'Keep the current combat objective.',kind:'combat'},{key:'nonviolent',label:'Seek a non-violent solution',description:'Replace the fight with investigation / negotiation.',kind:'urban_help'}];}
    return q;
  }
  function resolveQuestBranch(q,key){
    if(!q||q.status!=='active')return;ensureQuestCoherence(q);const s=activeQuestStage(q),opt=s?.branchOptions?.find(x=>x.key===key);if(!opt)return;
    q.branchHistory.push({day:state.world.day,stage:q.stageIndex,choice:key,label:opt.label});
    if(key==='nonviolent'){s.objectiveKind='urban_help';s.goal=1;s.progress=0;s.title=`Alternative: ${s.title}`;s.description='Resolve the current problem without defeating the target in combat.';q.objectiveKind=s.objectiveKind;q.goal=s.goal;q.progress=0;q.outcome='nonviolent_path';}
    else q.outcome='direct_path';
    s.branchOptions=null;pushNotification('quest',`Quest path chosen: ${q.title}`,opt.label,{questId:q.id});addLog(`<strong>QUEST PATH:</strong> ${escapeHtml(opt.label)}.`,'event');saveGame(false);showQuestJournal();
  }
  function abandonQuest(q){if(!q||q.status!=='active')return;q.status='abandoned';q.outcome='abandoned_by_player';pushNotification('quest',`Quest abandoned: ${q.title}`,'The quest remains in your journal as abandoned.',{questId:q.id});addEvent(`Abandoned quest: ${q.title}`);saveGame(false);}
  function resolveQuestDifferently(q,reason){if(!q||q.status!=='active')return;q.status='resolved_differently';q.outcome=reason;awardXp(Math.max(5,Math.floor((q.rewardXp||20)*.35)));pushNotification('quest',`Quest resolved differently: ${q.title}`,reason,{questId:q.id});addLog(`<strong>QUEST RESOLVED DIFFERENTLY:</strong> ${escapeHtml(q.title)} — ${escapeHtml(reason)}`,'event');}
  function evaluateQuestConsequences(){
    for(const q of state.world.quests||[]){if(q.status!=='active')continue;ensureQuestCoherence(q);if(state.world.day>q.deadlineDay){q.status='failed';q.outcome='deadline_missed';pushNotification('quest',`Quest failed: ${q.title}`,'Too much world time passed before the objective was completed.',{questId:q.id});continue;}const giver=q.questGiverNpcId?findNpcById(q.questGiverNpcId):null;if(q.questGiverNpcId&&(!giver||giver.dead)){const s=activeQuestStage(q);if(s?.objectiveKind==='return')resolveQuestDifferently(q,'The original quest giver died before you could report back.');else{q.status='failed';q.outcome='quest_giver_dead';pushNotification('quest',`Quest failed: ${q.title}`,'The NPC responsible for the quest is dead.',{questId:q.id});}}if(q.targetNpcId){const target=findNpcById(q.targetNpcId);if(target?.dead&&activeQuestStage(q)?.objectiveKind!=='combat')resolveQuestDifferently(q,'The target died before the planned objective could be completed.');}}
  }
  function progressQuests(kind,amount=1){
    const before=new Map((state.world.quests||[]).map(q=>[q.id,{stage:q.stageIndex,status:q.status}]));progressQuestsV418(kind,amount);
    for(const q of state.world.quests||[]){const b=before.get(q.id);if(!b)continue;if(q.stageIndex!==b.stage&&q.status==='active')pushNotification('quest',`Quest updated: ${q.title}`,`Stage ${q.stageIndex+1}: ${activeQuestStage(q)?.title||'New objective'}`,{questId:q.id});if(q.status!==b.status&&q.status==='completed')pushNotification('quest',`Quest complete: ${q.title}`,'Reward and consequences have been applied.',{questId:q.id});}
  }
  function completeQuest(q){
    if(!q||q.status!=='active')return;const giver=q.questGiverNpcId?findNpcById(q.questGiverNpcId):null;if(q.questGiverNpcId&&(!giver||giver.dead)){resolveQuestDifferently(q,'The quest was completed in substance, but the original giver was no longer alive to receive the report.');return;}completeQuestV418(q);pushNotification('quest',`Quest complete: ${q.title}`,`${formatCopper(q.rewardCopper||Math.round((q.rewardGold||20)*100))} and ${q.rewardXp||0} XP received.`,{questId:q.id});
  }
  function showQuestJournal(){
    const wrap=document.createElement('div');wrap.className='modal-backdrop';const quests=(state.world.quests||[]).slice().reverse();
    wrap.innerHTML=`<div class="modal codex-modal"><div class="ledger-head"><div><div class="eyebrow">Contracts & consequences</div><h2>Quest Journal</h2><p class="section-copy">Quests can branch, fail, be abandoned, or resolve differently as the world changes.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="codex-grid">${quests.length?quests.map(q=>{ensureQuestCoherence(q);const s=activeQuestStage(q);return `<article class="questline-card"><div class="eyebrow">${q.multiStage?'Multi-stage':'Simple'} • ${escapeHtml(titleCase(String(q.status).replace('_',' ')))}</div><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description||'')}</p><div class="quest-stages">${q.stages.map((st,i)=>`<div class="quest-stage ${i<q.stageIndex||q.status==='completed'?'done':i===q.stageIndex&&q.status==='active'?'current':''}"><span>${i+1}</span><div><strong>${escapeHtml(st.title)}</strong><small>${escapeHtml(st.description)} • ${st.progress}/${st.goal}</small></div></div>`).join('')}</div>${q.status==='active'&&s?.branchOptions?.length?`<div class="quest-branch-row">${s.branchOptions.map(o=>`<button class="secondary-button" data-quest-branch="${escapeHtml(q.id)}:${escapeHtml(o.key)}"><strong>${escapeHtml(o.label)}</strong><small>${escapeHtml(o.description)}</small></button>`).join('')}</div>`:''}${q.status==='active'?`<button class="ghost-button" data-abandon-quest="${escapeHtml(q.id)}">Abandon quest</button>`:''}${q.outcome?`<p class="quest-outcome">Outcome: ${escapeHtml(String(q.outcome).replaceAll('_',' '))}</p>`:''}<div class="character-sub">Deadline day ${q.deadlineDay} • Reward ${formatCopper(q.rewardCopper||Math.round((q.rewardGold||20)*100))}</div></article>`}).join(''):`<p class="empty-copy">No quests recorded yet.</p>`}</div></div>`;
    document.body.appendChild(wrap);wrap.querySelector('[data-close-modal]').onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};wrap.querySelectorAll('[data-quest-branch]').forEach(b=>b.onclick=()=>{const [id,key]=b.dataset.questBranch.split(':');wrap.remove();resolveQuestBranch(state.world.quests.find(q=>q.id===id),key);});wrap.querySelectorAll('[data-abandon-quest]').forEach(b=>b.onclick=()=>{const q=state.world.quests.find(x=>x.id===b.dataset.abandonQuest);if(q&&confirm(`Abandon ${q.title}?`)){abandonQuest(q);wrap.remove();showQuestJournal();}});
  }

  // ---------- Faction-wide memory ----------
  function factionKnowledgeRecord(fid){
    ensureV419Collections();if(!fid)return null;state.world.factionKnowledge[fid] ||= {reports:[],playerIdentity:{nameKnown:false,descriptions:[],threat:0,respect:0},updatedDay:state.world.day};return state.world.factionKnowledge[fid];
  }
  function shareFactionKnowledge(npc,text,{kind='report',confidence=65}={}){
    if(!npc?.factionId||confidence<55)return;const fk=factionKnowledgeRecord(npc.factionId);if(!fk)return;const report={id:`fk-${Date.now()}-${Math.floor(Math.random()*9999)}`,day:state.world.day,sourceNpcId:npc.id,kind,text:String(text||'').slice(0,180),confidence:clamp(confidence,5,100)};if(fk.reports.some(r=>r.text===report.text&&state.world.day-r.day<2))return;fk.reports.push(report);if(fk.reports.length>40)fk.reports.splice(0,fk.reports.length-40);fk.updatedDay=state.world.day;if(/crime|attack|killed|threat|assault/i.test(report.text))fk.playerIdentity.threat=clamp(fk.playerIdentity.threat+8,0,100);if(/help|saved|assisted|honour/i.test(report.text))fk.playerIdentity.respect=clamp(fk.playerIdentity.respect+6,0,100);if(report.confidence>=85)fk.playerIdentity.nameKnown=true;const desc=playerWitnessDescription?.();if(desc&&!fk.playerIdentity.descriptions.includes(desc))fk.playerIdentity.descriptions.push(desc);fk.playerIdentity.descriptions=fk.playerIdentity.descriptions.slice(-4);
  }
  function addNpcMemory(npc,text,meta={}){const r=addNpcMemoryV418(npc,text,meta);if(npc&&(meta.category==='hostility'||meta.category==='help'||/witness|crime|attack|killed|saved/i.test(String(text))))shareFactionKnowledge(npc,text,{kind:meta.category||'memory',confidence:Number(meta.confidence??75)});return r;}
  function updateLawCases(){
    const before=new Map((state.world.lawCases||[]).map(c=>[c.id,c.status]));updateLawCasesV418();for(const c of state.world.lawCases||[]){if(before.get(c.id)!=='wanted'&&c.status==='wanted'){const crown=(state.world.factions||[]).find(f=>f.kingdomId===c.kingdomId&&/crown|guard|watch|law/.test(`${f.type} ${f.name}`.toLowerCase()))||(state.world.factions||[]).find(f=>f.kingdomId===c.kingdomId);if(crown){const fk=factionKnowledgeRecord(crown.id);fk.playerIdentity.threat=clamp(fk.playerIdentity.threat+c.severity,0,100);fk.playerIdentity.nameKnown ||= !!c.suspectName;fk.reports.push({id:`law-${c.id}`,day:state.world.day,kind:'law report',text:`${c.type}: ${c.suspectName||c.suspectDescription}`,confidence:c.evidence});}pushNotification('law',`Authorities circulate a report`,`${c.type} • evidence ${c.evidence}/100`,{caseId:c.id});}}
  }

  // ---------- Authoritative NPC equipment / wounds ----------
  function normaliseLoadoutItem(text){const t=String(text||'').trim();if(!t)return null;return t.split(/\s+and\s+|,/i)[0].trim().replace(/^a\s+/i,'').replace(/\bwith\b.*$/i,'').trim().replace(/\b\w/g,c=>c.toUpperCase());}
  function syncNpcEquipmentState(npc){
    if(!npc)return;npc.inventory=Array.isArray(npc.inventory)?npc.inventory:[];npc.equipment=npc.equipment&&typeof npc.equipment==='object'?npc.equipment:{head:null,body:null,hands:null,mainHand:null,offHand:null,cloak:null,accessory:null};npc.itemDurability=npc.itemDurability&&typeof npc.itemDurability==='object'?npc.itemDurability:{};
    const cap=x=>String(x||'').trim().replace(/^a\s+/i,'').replace(/\b\w/g,c=>c.toUpperCase());
    const weaponParts=String(npc.combatLoadout?.weapon||'').split(/\s+and\s+|,/i).map(cap).filter(Boolean);
    const armourParts=String(npc.combatLoadout?.armour||'').split(/\s+and\s+|,/i).map(cap).filter(Boolean);
    const main=weaponParts.find(x=>!/shield|buckler/i.test(x))||weaponParts[0]||null;
    const shield=[...weaponParts,...armourParts].find(x=>/shield|buckler/i.test(x))||null;
    const body=armourParts.find(x=>/mail|plate|leather|gambeson|robe|jack|armour|armor|coat/i.test(x))||armourParts.find(x=>!/shield/i.test(x))||null;
    if(main&&!npc.equipment.mainHand)npc.equipment.mainHand=main;if(shield&&!npc.equipment.offHand)npc.equipment.offHand=shield;if(body&&!npc.equipment.body)npc.equipment.body=body;
    npc.backupWeapons=weaponParts.filter(x=>x!==npc.equipment.mainHand&&!/shield|buckler/i.test(x));
    for(const item of [...weaponParts,...armourParts,...Object.values(npc.equipment).filter(Boolean)]){if(item&&!npc.inventory.includes(item))npc.inventory.push(item);if(item&&npc.itemDurability[item]==null)npc.itemDurability[item]=100;}
    return npc.equipment;
  }
  function ensureNpcCombatIdentity(npc,preferredRole=null){const r=ensureNpcCombatIdentityV418(npc,preferredRole);syncNpcEquipmentState(npc);return r;}
  function dropNpcEquipmentToScene(npc,reason='defeated'){
    if(!npc||npc.inventoryDropped)return;syncNpcEquipmentState(npc);const items=[...new Set(npc.inventory||[])];if(!items.length){npc.inventoryDropped=true;return;}const cons=ensureSceneContainers();let body=cons.find(c=>c.id===`corpse-${npc.id}`);if(!body){body={id:`corpse-${npc.id}`,name:`${npc.name}'s belongings`,ownerId:npc.id,locked:false,contents:[]};cons.push(body);}body.contents.push(...items);npc.inventory=[];for(const k of Object.keys(npc.equipment||{}))npc.equipment[k]=null;npc.inventoryDropped=true;syncOwnershipLedger();pushNotification('npc',`${npc.name}'s equipment remains at ${state.game.location}`,`${items.length} item${items.length===1?'':'s'} can be recovered from the scene.`,{npcId:npc.id});
  }
  function disarmNpc(npcId){const n=findNpcById(npcId);if(!n||n.dead)return false;syncNpcEquipmentState(n);const weapon=n.equipment.mainHand;if(!weapon)return false;n.equipment.mainHand=null;const ix=n.inventory.indexOf(weapon);if(ix>=0)n.inventory.splice(ix,1);const cons=ensureSceneContainers();let ground=cons.find(c=>c.id.endsWith('-ground'));if(!ground){ground={id:`${currentLocationKey()}-ground`,name:'Items on the ground',ownerId:null,locked:false,contents:[]};cons.push(ground);}ground.contents.push(weapon);const rec=combatantRecordForNpcId(npcId);if(rec){rec.combatant.dmg=[Math.max(1,(rec.combatant.dmg?.[0]||2)-2),Math.max(2,(rec.combatant.dmg?.[1]||6)-4)];rec.combatant.disarmed=true;}addLog(`<strong>${escapeHtml(n.name)}</strong> is disarmed. ${escapeHtml(weapon)} falls to the ground as a real scene item.`,'event');syncOwnershipLedger();return true;}
  function markCombatNpcDefeated(npcId,name,cause='combat'){const n=npcId?findNpcById(npcId):null;const r=markCombatNpcDefeatedV418(npcId,name,cause);if(n){dropNpcEquipmentToScene(n,'defeated');applyNpcDeathConsequences(n);}return r;}
  function finishCombatVictory(){const e=state.game.combat,n=e?.npcId?findNpcById(e.npcId):null;if(n&&!n.dead){dropNpcEquipmentToScene(n,'killed');applyNpcDeathConsequences(n);}rememberPersistentEncounter('defeated');return finishCombatVictoryV418();}
  function progressNpcInjuries(){
    for(const n of state.world.npcs||[]){if(n.dead||!Array.isArray(n.injuries)||!n.injuries.length)continue;ensureNpcResourceState(n);const remaining=[];for(const inj of n.injuries){inj.daysHealing=Number(inj.daysHealing||0)+1;const care=(n.resources?.healing||0)>0||/healer|cleric|noble/.test(String(n.occupation||'').toLowerCase());const minorNeed=care?3:6,severeNeed=care?16:28;if(inj.severity==='minor'&&inj.daysHealing>=minorNeed){if(Math.random()<.28)n.scars=(n.scars||[]).concat(`${inj.part} scar`);continue;}if(inj.severity==='severe'&&inj.daysHealing>=severeNeed){inj.severity='minor';inj.daysHealing=0;inj.cause=`recovering from ${inj.cause||'a severe wound'}`;remaining.push(inj);continue;}remaining.push(inj);}n.injuries=remaining;}
  }

  function getOrCreateMarketMerchant(){const n=getOrCreateMarketMerchantV418();if(n){const est=settlementEstablishmentState('market');est.providerId=n.id;est.status=n.dead?'unstaffed':'open';}return n;}
  function visitLocalInn(){const r=visitLocalInnV418();const n=state.game.activeNpc;if(n&&/innkeeper/.test(String(n.occupation||'').toLowerCase())){const est=settlementEstablishmentState('inn');est.providerId=n.id;est.status=n.dead?'unstaffed':'open';}return r;}
  function travelDays(kind,dest=null){const base=travelDaysV418(kind,dest),w=currentWeather();return Math.max(1,Math.ceil(base*Number(w.travelMultiplier||1)));}

  // ---------- Weather / day-night mechanics ----------
  function weatherSeed(kid,day=state.world.day){return seeded(`${state.world.seed}-weather-${kid}-${state.world.year}-${state.world.season}-${day}`);}
  function generateWeather(kid=state.game.kingdomId){
    ensureV419Collections();const rng=weatherSeed(kid),climate=String(state.worldConfig?.climate||'Temperate').toLowerCase(),season=String(state.world.season||'').toLowerCase();let pool=['Clear','Cloudy','Light Rain','Windy'];
    if(/cold|tundra|alpine/.test(climate)||/winter/.test(season))pool=['Clear','Cloudy','Snow','Snow','Cold Wind','Fog'];
    else if(/arid|desert/.test(climate))pool=['Clear','Clear','Hot Wind','Dust','Cloudy'];
    else if(/tropical|humid/.test(climate))pool=['Humid','Heavy Rain','Thunderstorm','Cloudy','Clear'];
    else if(/autumn|fall/.test(season))pool.push('Fog','Heavy Rain');
    const type=pick(pool,rng);let wetness=0,visibility=100,travel=1,wind=randInt(0,35,rng),temperature=randInt(6,22,rng);
    if(type==='Light Rain'){wetness=55;visibility=82;travel=1.08;}if(type==='Heavy Rain'){wetness=90;visibility=62;travel=1.22;}if(type==='Thunderstorm'){wetness=100;visibility=52;travel=1.35;wind=55;}if(type==='Snow'){wetness=65;visibility=65;travel=1.3;temperature=-2;}if(type==='Fog'){wetness=35;visibility=42;travel=1.12;}if(type==='Dust'){visibility=48;travel=1.18;wind=45;}if(type==='Cold Wind'){temperature=-4;wind=50;}if(type==='Hot Wind'){temperature=31;wind=42;}if(type==='Humid'){wetness=20;temperature=28;}
    const w={type,wetness,visibility,travelMultiplier:travel,wind,temperature,day:state.world.day,year:state.world.year,season:state.world.season};state.world.weather[kid]=w;return w;
  }
  function currentWeather(kid=state.game.kingdomId){ensureV419Collections();const w=state.world.weather[kid];return (!w||w.day!==state.world.day||w.year!==state.world.year)?generateWeather(kid):w;}
  function weatherActionAdjust(r){
    if(!r?.has_action)return r;const w=currentWeather(),t=String(r.action_text||'').toLowerCase();let mod=0,dmg=1,notes=[];
    if(/fireball|fire|flame|burn|inferno/.test(t)&&w.wetness>=55){mod-=2;dmg*=w.wetness>=90?.68:.82;notes.push('rain suppresses open flame');}
    if(/lightning|thunder|electric|shock/.test(t)&&w.wetness>=55){mod+=2;dmg*=1.15;notes.push('wet conditions improve electrical conduction');}
    if(/bow|arrow|crossbow|shoot|throw/.test(t)&&w.visibility<70){mod-=2;notes.push('poor visibility hinders ranged accuracy');}
    if(state.game.time==='Night'&&/bow|arrow|shoot|search|inspect|aim/.test(t)){mod-=2;notes.push('darkness reduces visibility');}
    if(mod){r.total=Number(r.total||0)+mod;r.success=!r.blocked_reason&&r.total>=Number(r.difficulty||11);r.margin=r.total-Number(r.difficulty||11);if(!r.success)r.resolved_damage=0;}
    if(r.success&&Number(r.resolved_damage||0)>0&&dmg!==1)r.resolved_damage=Math.max(1,Math.round(r.resolved_damage*dmg));r.weather_effect={type:w.type,modifier:mod,damageMultiplier:Math.round(dmg*100)/100,notes};return r;
  }
  function buildActionResolution(segments){const r=buildActionResolutionV418(segments);weatherActionAdjust(r);if(r?.has_action)r.integrity_outcome=buildIntegrityOutcome(r);return r;}
  function plausibleWitnesses(){
    const ids=plausibleWitnessesV418(),w=currentWeather(),night=state.game.time==='Night';const visibility=clamp((w.visibility/100)*(night?.62:1),.18,1);return ids.filter(()=>Math.random()<visibility);
  }

  // ---------- Settlement simulation ----------
  function settlementKey(location=state.game.location,kid=state.game.kingdomId){return `${kid}::${location}`;}
  function settlementKind(location,kid){const k=kingdomById(kid);const site=(k?.spawnSites||[]).find(s=>s.name===location);return site?.kind||(location===k?.capital?'capital':'town');}
  function ensureSettlementState(location=state.game.location,kid=state.game.kingdomId){
    ensureV419Collections();const key=settlementKey(location,kid);if(state.world.settlementStates[key])return state.world.settlementStates[key];const kind=settlementKind(location,kid),rng=seeded(`${state.world.seed}-settlement-state-${key}`),basePop=kind==='capital'?randInt(9000,26000,rng):kind==='village'?randInt(300,1500,rng):randInt(1800,6500,rng),k=kingdomById(kid);
    const s={key,name:location,originalKingdomId:kid,ownerKingdomId:kid,kind,population:basePop,security:clamp(Math.round((k?.stability||50)*.65+randInt(15,35,rng)),15,95),wealth:clamp(Math.round((k?.prosperity||50)*.7+randInt(10,30,rng)),10,95),foodSupply:randInt(55,90,rng),damage:0,crime:randInt(4,22,rng),watchManpower:kind==='capital'?randInt(45,90,rng):kind==='village'?randInt(4,12,rng):randInt(12,35,rng),siegePressure:0,establishments:{},lastUpdatedDay:state.world.day};state.world.settlementStates[key]=s;return s;
  }
  function settlementStateForKnownLocation(location=state.game.location,kid=state.game.kingdomId){
    const k=kingdomById(kid);if(!k)return null;
    let loc=location;
    if(k.spawnSites?.some(s=>s.name===loc)||loc===k.capital)return ensureSettlementState(loc,kid);
    if(kid===state.game.kingdomId&&state.game.areaType==='outskirts'&&(/outskirts/i.test(String(loc))||String(loc).includes(k.capital)))return ensureSettlementState(k.capital,kid);
    return null;
  }
  function currentSettlementState(){return settlementStateForKnownLocation(state.game.location,state.game.kingdomId)||ensureSettlementState(state.game.location,state.game.kingdomId);}
  function settlementEstablishmentState(type,name=''){const s=currentSettlementState(),key=type||name;s.establishments[key] ||= {type,name,status:'open',damage:0,providerId:null};return s.establishments[key];}
  function applyNpcDeathConsequences(n){
    if(!n)return;if((n.childrenIds||[]).some(id=>(state.character.childrenIds||[]).includes(id))){for(const id of n.childrenIds||[]){const child=findNpcById(id);if(child){child.familyAffection=child.familyAffection||{};child.familyAffection.parentLossDay=state.world.day;}}pushNotification('family',`${n.name} died`,`Their death changes the persistent family state.`,{npcId:n.id},{dedupe:`familydeath:${n.id}`});}const occ=String(n.occupation||'').toLowerCase(),s=settlementStateForKnownLocation(n.location||state.game.location,n.kingdomId||state.game.kingdomId);if(s&&/guard|watch|captain|soldier/.test(occ)){s.watchManpower=Math.max(0,s.watchManpower-1);s.security=clamp(s.security-2,0,100);pushNotification('settlement',`${s.name} watch weakened`,`${n.name}'s death reduces available watch manpower to ${s.watchManpower}.`,{mode:'settlement'},{dedupe:`watchdeath:${n.id}`});}if(s&&/innkeeper|merchant|blacksmith|healer|alchemist|stablemaster/.test(occ)){const type=/innkeeper/.test(occ)?'inn':/merchant/.test(occ)?'market':/blacksmith/.test(occ)?'smith':/healer/.test(occ)?'healer':/alchemist/.test(occ)?'alchemist':'stable';const est=s.establishments[type]||{type,status:'open',damage:0};est.status='unstaffed';est.providerId=null;s.establishments[type]=est;pushNotification('settlement',`${s.name}: ${titleCase(type)} unstaffed`,`${n.name} is dead; the establishment cannot operate normally until replaced.`,{mode:'settlement'});}}
  function recordCrime(type,severity=8,witnessed=true){const before=(state.world.lawCases||[]).length;recordCrimeV418(type,severity,witnessed);if(['town','outskirts'].includes(state.game.areaType)){const st=currentSettlementState();st.crime=clamp(st.crime+Math.ceil(severity*.28),0,100);st.security=clamp(st.security-Math.ceil(severity*.08),0,100);}if((state.world.lawCases||[]).length>before)pushNotification('law',type,`${witnessed?'Possible witnesses':'No clear witness'} • ${state.game.location}`,null,{dedupe:`crime:${state.game.turn}:${type}`});}
  function processSettlementDay(){
    for(const s of Object.values(state.world.settlementStates||{})){
      const owner=kingdomById(s.ownerKingdomId)||kingdomById(s.originalKingdomId);s.foodSupply=clamp(s.foodSupply+randInt(-3,2),0,100);s.crime=clamp(s.crime+(s.security<35?2:-1),0,100);s.damage=clamp(s.damage-(s.siegePressure===0?randInt(0,2):0),0,100);s.security=clamp(s.security+(s.watchManpower>5&&s.crime<45?1:0),0,100);s.wealth=clamp(s.wealth+(s.damage>40?-2:s.foodSupply<25?-1:1),0,100);
      const wars=owner?.wars||[];if(wars.length&&Math.random()<.24){s.siegePressure=clamp(s.siegePressure+randInt(4,12),0,100);s.foodSupply=clamp(s.foodSupply-randInt(2,7),0,100);s.damage=clamp(s.damage+randInt(0,4),0,100);}else s.siegePressure=clamp(s.siegePressure-randInt(1,4),0,100);
      if(s.siegePressure>=85&&wars.length&&Math.random()<.12){const newOwner=pick(wars);if(newOwner&&newOwner!==s.ownerKingdomId){const old=s.ownerKingdomId;s.ownerKingdomId=newOwner;s.siegePressure=42;s.security=Math.max(15,Math.floor(s.security*.6));pushNotification('map',`${s.name} changes hands`,`${kingdomById(old)?.name||'The former ruler'} loses control to ${kingdomById(newOwner)?.name||'an enemy kingdom'}.`,{mode:'world'});addEvent(`${s.name} changed hands during the war`);}}
      s.lastUpdatedDay=state.world.day;
    }
    const current=state.game.areaType==='town'?currentSettlementState():null;if(current&&sceneIntegrity().fire){current.damage=clamp(current.damage+Math.max(1,Math.round(sceneIntegrity().fire.intensity/18)),0,100);current.wealth=clamp(current.wealth-1,0,100);if(current.damage>=55)pushNotification('settlement',`${current.name} suffers major damage`,`Settlement damage has reached ${current.damage}/100.`,{mode:'settlement'},{dedupe:`damage:${current.key}:${Math.floor(current.damage/10)}`});}
  }
  function getServiceNpc(type){
    const key=`${state.game.kingdomId}:${state.game.location}:${type}`,id=state.world.serviceNpcs?.[key],old=id?findNpcById(id):null;if(old&&!old.dead&&!old.imprisoned)return old;if(state.world.serviceNpcs)delete state.world.serviceNpcs[key];const n=getServiceNpcV418(type);const est=settlementEstablishmentState(type);est.providerId=n.id;est.status='open';return n;
  }
  function worldPriceCopper(good,kingdom=currentKingdom()){const base=worldPriceCopperV415(good,kingdom),d=marketDyn(kingdom),s=state.game.areaType==='town'?currentSettlementState():null,p=Number(d.pressure?.[good.category]||0),scarcity=s?((50-s.foodSupply)*(good.category==='food'?.012:.0025)+(50-s.wealth)*.003):0;return Math.max(1,Math.round(base*(1+p/100)*(1+scarcity)));}
  function dailyEconomicTick(){
    dailyEconomicTickV418();
    const current=state.game.areaType==='town'?currentSettlementState():null;
    for(const n of state.world.npcs||[]){
      if(!/merchant/.test(String(n.occupation||''))||n.dead)continue;
      const settlement=n.location===state.game.location&&current?current:settlementStateForKnownLocation(n.location,n.kingdomId);
      const kingdom=kingdomById(n.kingdomId);
      restockMerchant(n,settlement||{wealth:Number(kingdom?.prosperity||50)});
    }
  }

  // ---------- Persistent encounters ----------
  function persistentEncounterKey(){return currentLocationKey();}
  function encounterIsCreature(e){return !!e&&!e.npcId&&bestiaryEligible(e.name);}
  function rememberPersistentEncounter(status='active',combat=state.game.combat){
    if(!encounterIsCreature(combat))return;ensureV419Collections();const key=persistentEncounterKey(),record=state.world.persistentEncounters[key]||{};state.world.persistentEncounters[key]={id:record.id||`enc-${Date.now()}-${Math.floor(Math.random()*9999)}`,location:state.game.location,kingdomId:state.game.kingdomId,areaType:state.game.areaType,name:combat.name,level:combat.level,hp:Math.max(0,combat.hp),maxHp:combat.maxHp,dmg:combat.dmg,xp:combat.xp,gold:combat.gold,attacks:[...(combat.attacks||[])],status,lastSeenDay:state.world.day,lastSeenTurn:state.game.turn};
  }
  function persistentEncounterAtCurrentLocation(){const e=state.world.persistentEncounters?.[persistentEncounterKey()];if(!e||e.status==='defeated')return null;if(state.world.day-e.lastSeenDay>7)return null;return e;}
  function startCombat(forceType=null,context=state.game.areaType||'town'){
    let resume=null;if(!forceType){resume=persistentEncounterAtCurrentLocation();if(resume&&Math.random()<.82)forceType={name:resume.name,level:resume.level,hp:resume.maxHp,dmg:resume.dmg,xp:resume.xp,gold:resume.gold,attacks:resume.attacks,habitats:[context]};}
    startCombatV418(forceType,context);const e=state.game.combat;if(!e)return;if(resume&&e.name===resume.name){e.hp=Math.max(1,Math.min(e.maxHp,resume.hp));e.persistentEncounterId=resume.id;addLog(`<strong>Persistent encounter:</strong> ${escapeHtml(e.name)} is still here with ${e.hp}/${e.maxHp} HP from the earlier encounter.`,'system');}else if(encounterIsCreature(e))rememberPersistentEncounter('active',e);
  }
  function damageCombatTarget(targetNpcId,dmg,status=null,resolution=null){const r=damageCombatTargetV418(targetNpcId,dmg,status,resolution);if(state.game.combat&&(!targetNpcId||targetNpcId===state.game.combat.npcId||targetNpcId==='__combat_primary__'))rememberPersistentEncounter('active');return r;}
  function combatAction(action){const before=state.game.combat?cloneJson(state.game.combat):null;const r=combatActionV418(action);if(action==='combat-flee'&&before&&!state.game.combat){rememberPersistentEncounter('fled',before);saveGame(false);}return r;}
  function progressPersistentEncounters(){for(const [key,e] of Object.entries(state.world.persistentEncounters||{})){if(e.status==='defeated'){if(state.world.day-e.lastSeenDay>4)delete state.world.persistentEncounters[key];continue;}const days=Math.max(0,state.world.day-e.lastSeenDay);if(days>0){e.hp=Math.min(e.maxHp,e.hp+Math.ceil(e.maxHp*.08*days));e.lastSeenDay=state.world.day;}if(days>7)delete state.world.persistentEncounters[key];}}

  // ---------- Smarter threat selection ----------
  function hostileTargetCandidates(){const list=[{kind:'player',id:'player',name:state.character.name,hp:state.character.hp,maxHp:state.character.maxHp,role:state.character.className||'adventurer',threat:55+state.character.level*4}];for(const c of state.character.companions||[]){if(c.active===false||c.hp<=0)continue;const role=String(c.role||'').toLowerCase();let threat=35+(c.loyalty||50)/4;if(/mage|wizard|sorcer/.test(role))threat+=22;if(/archer|ranger/.test(role))threat+=12;if(c.hp<c.maxHp*.4)threat-=8;list.push({kind:'companion',id:c.npcId||c.name,name:c.name,hp:c.hp,maxHp:c.maxHp,role:c.role,comp:c,threat});}return list;}
  function chooseHostileTarget(attacker){const candidates=hostileTargetCandidates();const role=String(attacker?.combatClass||attacker?.occupation||'').toLowerCase();for(const t of candidates){if(/archer|crossbow|mage/.test(role)&&/mage|wizard|sorcer|healer/.test(String(t.role||'').toLowerCase()))t.threat+=24;if(/captain|veteran/.test(role)&&t.kind==='player')t.threat+=10;if(state.game.companionOrders?.mode==='protect'&&t.kind==='player')t.threat-=10;t.threat+=randInt(-8,8);}return candidates.sort((a,b)=>b.threat-a.threat)[0];}
  function damageCompanionTarget(comp,dmg,attacker,move){comp.hp=Math.max(0,comp.hp-dmg);comp.morale=clamp((comp.morale||60)-Math.max(3,Math.round(dmg/2)),0,100);addLog(`<strong>${escapeHtml(attacker.name)}</strong> ${escapeHtml(move)} against <strong>${escapeHtml(comp.name)}</strong>, dealing ${dmg} damage.${comp.hp<=0?` ${escapeHtml(comp.name)} collapses.`:''}`,'ai-narration');const npc=comp.npcId?findNpcById(comp.npcId):null;if(npc&&dmg>=7){npc.injuries=Array.isArray(npc.injuries)?npc.injuries:[];npc.injuries.push({part:pick(BODY_PARTS),severity:dmg>=11?'severe':'minor',cause:`${attacker.name}: ${move}`,day:state.world.day,daysHealing:0});}}
  function performReinforcementAttack(ally,index,total){
    const n=ally.npcId?findNpcById(ally.npcId):null;if(n){syncNpcEquipmentState(n);if(ally.disarmed&&!n.equipment.mainHand){const backup=(n.backupWeapons||[]).find(x=>n.inventory.includes(x));if(backup){n.equipment.mainHand=backup;ally.disarmed=false;ally.dmg=[Math.max(2,(ally.dmg?.[0]||1)+1),Math.max(5,(ally.dmg?.[1]||3)+2)];addLog(`<strong>${escapeHtml(ally.name)}</strong> draws ${escapeHtml(backup)} from their own inventory.`,'system');}}const res=ensureNpcResourceState(n);if(ally.hp<ally.maxHp*.38&&res.healing>0){const heal=randInt(5,11);ally.hp=Math.min(ally.maxHp,ally.hp+heal);res.healing--;addLog(`<strong>${escapeHtml(ally.name)}</strong> uses a field dressing and recovers ${heal} HP.`,'ai-narration');return true;}if((ally.position==='wall'||ally.formationRole==='rear')&&/archer|crossbow/.test(String(ally.combatClass||ally.occupation).toLowerCase())){if(res.ammo<=0){ally.position='front';ally.formationRole='front';ally.attacks=['slashes with a sidearm','jabs with a short blade'];}else res.ammo--;}if(/mage/.test(String(ally.combatClass||ally.occupation).toLowerCase())){if(res.mana<8)ally.attacks=['strikes with a staff'];else res.mana-=8;}res.stamina=Math.max(0,res.stamina-6);}
    const target=chooseHostileTarget(ally),move=tacticalAttackMove(ally,state.game.combat);let accuracy=Math.floor((ally.defense||10)/3)-groupAttackAccuracyPenalty(index,total);if(state.game.combat?.battlefield?.scenario==='gate_defense'&&ally.position==='wall')accuracy+=2;const roll=randInt(1,20)+accuracy;
    if(target.kind==='player'){if(roll>=playerCombatDefense()){let dmg=randInt(ally.dmg?.[0]||2,ally.dmg?.[1]||6);applyReactiveDamageToPlayer(ally,dmg,move);}else addLog(`<strong>${escapeHtml(ally.name)}</strong> attacks you with ${escapeHtml(move)}, but misses or is turned aside.`,'ai-narration');}
    else{const comp=target.comp,def=10+Math.floor((comp.loyalty||50)/25);if(roll>=def)damageCompanionTarget(comp,randInt(ally.dmg?.[0]||2,ally.dmg?.[1]||6),ally,move);else addLog(`<strong>${escapeHtml(ally.name)}</strong> turns on ${escapeHtml(comp.name)}, but the attack misses.`,'ai-narration');}
    ally.lastActionRound=state.game.combat?.round||0;return true;
  }
  function enemyTurn(){
    const e=state.game.combat;if(!e)return;const target=chooseHostileTarget({name:e.name,occupation:findNpcById(e.npcId)?.occupation||e.name,combatClass:e.combatClass});
    if(target.kind==='player')return enemyTurnV418();
    randomCombatBeat();if(hasEnemyStatus('staggered')&&Math.random()<.65){addLog(`${escapeHtml(e.name)} is staggered and loses the attack.`,'system');tickEnemyStatuses();if(state.game.combat)processCombatSupportRound();return;}
    const move=pick(e.attacks||['strike']),dmg=randInt(e.dmg?.[0]||2,e.dmg?.[1]||6)+Math.floor((e.level||1)/2);damageCompanionTarget(target.comp,dmg,{name:e.name},move);tickEnemyStatuses();if(state.game.combat)processCombatSupportRound();
  }

  // ---------- Consequence-aware maps ----------
  function syncDiscoveredSites(){ensureV419Collections();for(const d of state.world.dungeons||[]){if(d.status&&d.status!=='hidden'&&!state.world.discoveredSites.some(x=>x.id===d.id))state.world.discoveredSites.push({id:d.id,name:d.name,kingdomId:d.kingdomId,location:d.location||d.name,type:'dungeon',status:d.status});}}
  function playerMapMarker(x,y,label="You are here",compact=false){
    return `<g class="player-map-marker" transform="translate(${x} ${y})">
      <circle r="${compact?8:11}" class="player-marker-ring"/>
      <path d="M0 ${compact?-5:-7} L${compact?5:7} ${compact?6:9} L0 ${compact?3:5} L${compact?-5:-7} ${compact?6:9} Z" class="player-marker-icon"/>
      ${label?`<text x="${compact?14:17}" y="4" class="player-marker-label">${escapeHtml(label)}</text>`:""}
    </g>`;
  }

  function worldMapSvg(){
    ensureAtlasData();syncDiscoveredSites();
    const currentKingdomId=state.game.kingdomId,currentLocation=state.game.location;

    const regions=state.world.kingdoms.map(k=>{
      const p=state.world.atlas.kingdomPositions[k.id];
      const sites=(k.spawnSites||[]).slice(0,6);
      const isCurrentKingdom=k.id===currentKingdomId;
      let currentSiteFound=false;

      const siteLabels=sites.map((s,i)=>{
        const a=Math.PI*2*i/Math.max(1,sites.length)+.3;
        const sx=p.x+Math.cos(a)*(78+i*5),sy=p.y+Math.sin(a)*(60+i*4);
        const ss=ensureSettlementState(s.name,k.id),owner=kingdomById(ss.ownerKingdomId);
        const occupied=ss.ownerKingdomId!==k.id;
        const isHere=isCurrentKingdom&&String(s.name).toLowerCase()===String(currentLocation).toLowerCase();
        if(isHere)currentSiteFound=true;

        return `<g class="${isHere?"atlas-current-site":""}">
          <circle cx="${sx}" cy="${sy}" r="${s.kind==="capital"?8:5}"
            class="atlas-town ${s.kind==="capital"?"capital":""} ${ss.damage>=60?"ruined":""} ${isHere?"current":""}"/>
          <text x="${sx+9}" y="${sy+4}" class="atlas-settlement-label">
            ${escapeHtml(s.name)}${occupied?` [${escapeHtml(owner?.name||"Occupied")}]`:""}
          </text>
          ${isHere?playerMapMarker(sx,sy-21,"You are here"):""}
        </g>`;
      }).join("");

      const color=k.color||"#775533";
      return `<g class="${isCurrentKingdom?"atlas-current-region":""}">
        <ellipse cx="${p.x}" cy="${p.y}" rx="${isCurrentKingdom?137:125}" ry="${isCurrentKingdom?98:90}"
          fill="${escapeHtml(color)}" opacity="${isCurrentKingdom?.22:.14}"
          stroke="${isCurrentKingdom?"#8e2d28":escapeHtml(color)}" stroke-width="${isCurrentKingdom?5:2}"/>
        <text x="${p.x}" y="${p.y-18}" text-anchor="middle" class="atlas-region-label">${escapeHtml(k.region)}</text>
        <text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="atlas-kingdom-label">${escapeHtml(k.name)}</text>
        ${siteLabels}
        ${isCurrentKingdom&&!currentSiteFound?playerMapMarker(p.x,p.y+40,`You: ${currentLocation}`):""}
      </g>`;
    }).join("");

    const discovered=(state.world.discoveredSites||[]).map((d,i)=>{
      const p=state.world.atlas.kingdomPositions[d.kingdomId]||{x:500,y:325};
      const x=p.x-80+(i%4)*45,y=p.y+105+Math.floor(i/4)*24;
      return `<g class="atlas-discovered"><path d="M${x} ${y-6}l6 6-6 6-6-6Z"/><text x="${x+10}" y="${y+4}">${escapeHtml(d.name)}</text></g>`;
    }).join("");

    return `<svg class="atlas-svg world-atlas-svg" viewBox="0 0 1000 650" role="img" aria-label="World map">
      <defs>
        <pattern id="paperGridV420" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(115,83,47,.12)" stroke-width="1"/>
        </pattern>
        <filter id="mapShadowV420"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity=".24"/></filter>
      </defs>
      <rect width="1000" height="650" rx="16" fill="#d8c596"/>
      <rect width="1000" height="650" rx="16" fill="url(#paperGridV420)"/>
      <path d="M70,120 C190,40 310,70 400,130 S620,70 750,130 S930,210 905,360 S780,590 640,555 S430,610 300,545 S80,515 92,350 S15,205 70,120Z"
        fill="#b9a378" opacity=".38" stroke="#6a5031" stroke-width="3" filter="url(#mapShadowV420)"/>
      <path d="M90 465 Q250 395 390 455 T700 430 T910 365" fill="none" stroke="#806c4c" stroke-width="4" stroke-dasharray="10 8" opacity=".28"/>
      ${regions}${discovered}
      <g class="atlas-legend" transform="translate(30,545)">
        <rect width="270" height="72" rx="10"/>
        <circle cx="18" cy="20" r="6" class="atlas-town capital"/><text x="34" y="24">Capital / major settlement</text>
        <circle cx="18" cy="46" r="5" class="atlas-town"/><text x="34" y="50">Settlement</text>
        ${playerMapMarker(202,45,"Player",true)}
      </g>
      <text x="500" y="625" text-anchor="middle" class="atlas-caption">
        ${escapeHtml(state.world.name)} — ownership, damage, discoveries and your position
      </text>
    </svg>`;
  }

  function settlementMapSvg(){
    const map=ensureSettlementMap(),sim=currentSettlementState();
    const localNpcs=(state.world.npcs||[]).filter(n=>!n.dead&&(n.schedule?.currentLocation===state.game.location||n.location===state.game.location));

    const buildings=map.establishments.map(e=>{
      const es=sim.establishments[e.type]||{};
      const ruined=sim.damage>=75||es.status==="ruined"||Number(es.damage||0)>=80;
      const unstaffed=es.status==="unstaffed";
      return `<g class="settlement-place ${ruined?"ruined":""} ${unstaffed?"unstaffed":""}">
        <rect x="${e.x-50}" y="${e.y-29}" width="100" height="58" rx="8"/>
        <path d="M${e.x-55} ${e.y-29} L${e.x} ${e.y-55} L${e.x+55} ${e.y-29} Z" class="building-roof"/>
        <text x="${e.x}" y="${e.y+4}" text-anchor="middle">${escapeHtml(e.name)}</text>
        <text x="${e.x}" y="${e.y+20}" text-anchor="middle" class="small">
          ${ruined?"RUINED":unstaffed?"UNSTAFFED":escapeHtml(titleCase(e.type))}
        </text>
      </g>`;
    }).join("");

    const npcLayout=new Map();
    const npcs=localNpcs.slice(0,24).map(n=>{
      const rng=seeded(`${map.key}-${n.id}`),x=130+randInt(0,740,rng),y=105+randInt(0,430,rng);
      npcLayout.set(n.id,{x,y});
      const isActive=n.id===state.game.activeNpc?.id;
      return `<g class="settlement-npc ${isActive?"active-npc":""}">
        <circle cx="${x}" cy="${y}" r="${isActive?11:9}"/>
        <text x="${x+13}" y="${y+4}">${escapeHtml(n.name)}</text>
      </g>`;
    }).join("");

    let px=500,py=325;
    const activePoint=state.game.activeNpc?.id?npcLayout.get(state.game.activeNpc.id):null;
    if(activePoint){px=activePoint.x;py=activePoint.y;}
    else{
      const area=String(state.game.areaType||"").toLowerCase();
      if(area==="outskirts"){px=120;py=510;}
      else if(area==="road"){px=225;py=320;}
      else if(area==="wilderness"){px=105;py=105;}
    }

    const owner=kingdomById(sim.ownerKingdomId);
    return `<svg class="atlas-svg settlement-svg" viewBox="0 0 1000 650" role="img" aria-label="${escapeHtml(state.game.location)} settlement map">
      <defs><filter id="settlementShadowV420"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".22"/></filter></defs>
      <rect width="1000" height="650" rx="16" fill="#d8c596"/>
      <path d="M80 320H920M500 65V590" stroke="#9b845d" stroke-width="42" opacity=".26"/>
      <path d="M80 320H920M500 65V590" stroke="#6f5738" stroke-width="3" opacity=".45"/>
      <path d="M150 115 Q325 170 500 95 T850 145" fill="none" stroke="#81906b" stroke-width="16" opacity=".25"/>
      <rect x="55" y="55" width="890" height="540" rx="28" fill="none" stroke="#6b5131" stroke-width="5"/>
      ${buildings}${npcs}${playerMapMarker(px,py-24,"You are here")}
      <g class="settlement-map-key" transform="translate(728,515)">
        <rect width="205" height="70" rx="10"/>
        <circle cx="18" cy="20" r="7" class="npc-key-dot"/><text x="34" y="24">Known NPC</text>
        ${playerMapMarker(18,47,"Player",true)}
      </g>
      <text x="500" y="34" text-anchor="middle" class="atlas-title">
        ${escapeHtml(state.game.location)} — ${escapeHtml(owner?.name||"Unknown ruler")}
      </text>
      <text x="500" y="615" text-anchor="middle" class="atlas-caption">
        Population ${sim.population.toLocaleString()} • Security ${sim.security} • Food ${sim.foodSupply} • Damage ${sim.damage} • Watch ${sim.watchManpower}
      </text>
    </svg>`;
  }

  function validateAiIntent(intent,resolution,index=0){
    if(!intent||typeof intent!=='object'||!intent.type)return null;const i={...intent};
    if(i.type==='enemy_damage'&&(!resolution?.success||Number(resolution?.resolved_damage||0)<=0))return null;
    if(i.type==='npc_injury'&&!resolution?.success)return null;
    if(i.type==='start_combat'&&i.target_id){const n=findNpcById(i.target_id);if(n?.dead)return null;}
    if(i.type==='currency_transfer'){i.amount=Math.max(0,Math.round(Number(i.amount)||0));if(!i.amount)return null;i.transaction_id=i.transaction_id||`ai-${state.game.aiTurn+1}-${state.game.turn}-${index}-${i.target_id||'none'}-${i.amount}`;}
    return i;
  }
  function textClaimsDamage(text){return /\b(cut|cuts|sliced|slashes|struck|hits?|wound|bleed|blood|burns?|pierces?|impales?|crushes?|breaks? .*bone)\b/i.test(String(text||''));}
  function textClaimsMiss(text){return /\b(miss(?:es|ed)?|dodg(?:e|es|ed)|untouched|fails? to land|wide of|parries? cleanly|blocks? completely)\b/i.test(String(text||''));}
  function textClaimsDeath(text){return /\b(killed|dead|dies|died|lifeless|corpse|decapitated|death blow|falls dead)\b/i.test(String(text||''));}
  function targetStillAlive(resolution){if(!resolution?.target_npc_id)return true;const rec=combatantRecordForNpcId(resolution.target_npc_id);if(rec)return Number(rec.combatant.hp)>0;const n=findNpcById(resolution.target_npc_id);return n?!n.dead:true;}
  function sanitizeNarrationAgainstState(text,resolution){
    let n=String(text||'').trim();if(!resolution?.has_action)return n;const out=resolution.integrity_outcome||state.game.lastResolvedOutcome;
    if(out?.blocked_reason||(!resolution.success&&['attack','lethal_attack'].includes(resolution.action_kind))){if(textClaimsDamage(n)||textClaimsDeath(n))n=effectSpecificFallback(resolution,resolution.target_name||'the target',false);}
    if(resolution.success&&Number(resolution.resolved_damage||0)>0&&textClaimsMiss(n))n=effectSpecificFallback(resolution,resolution.target_name||'the target',false);
    if(targetStillAlive(resolution)&&textClaimsDeath(n))n=`${effectSpecificFallback(resolution,resolution.target_name||'the target',false)} ${resolution.target_name||'The target'} is hurt, but remains alive.`;
    if(state.game.lastTransactionFailure&&state.game.lastTransactionFailure.turn===state.game.turn&&/pay|buy|purchase|hand .*coin|gold|silver|copper|platinum/i.test(n))n+=`\n\nThe attempted exchange does not complete: ${state.game.lastTransactionFailure.reason}.`;
    return n;
  }
  function sanitizeDialogueForKnowledge(dialogue=[]){
    const d=state.character.disguise||{},alias=String(d.alias||'').trim();if(!(d.active&&d.quality>=55&&alias))return dialogue;
    return dialogue.map(line=>{const speakerNpc=(state.world.npcs||[]).find(n=>n.name===line.speaker);if(!speakerNpc)return line;const rec=recognitionForNpc(speakerNpc);if(rec?.recognised)return line;return {...line,text:String(line.text||'').replaceAll(state.character.name,alias)};});
  }
  function resolveDisarmFromResolution(resolution){if(!resolution?.success||resolution._disarmApplied)return;const t=String(resolution.action_text||'').toLowerCase();if(!/disarm|knock .*weapon|knock .*sword|cut .*weapon hand|slice .*sword hand|weapon hand/.test(t))return;if(resolution.target_npc_id&&resolution.target_npc_id!=='__combat_primary__'){if(disarmNpc(resolution.target_npc_id))resolution._disarmApplied=true;}else if(state.game.combat?.npcId&&disarmNpc(state.game.combat.npcId))resolution._disarmApplied=true;}
  function applyAiTurn(result,resolution){
    result=result&&typeof result==='object'?result:{narration:'',dialogue:[],intents:[],memory:[],suggested_actions:[]};result.intents=(result.intents||[]).map((x,i)=>validateAiIntent(x,resolution,i)).filter(Boolean);result.dialogue=sanitizeDialogueForKnowledge(result.dialogue||[]);
    const tx=atomicStateTransaction('AI state intents',()=>{result.intents.slice(0,12).forEach((intent,i)=>{state.game._currentTransactionId=intent.transaction_id||null;applyAiIntent(intent,resolution);state.game._currentTransactionId=null;});resolveDisarmFromResolution(resolution);return true;});state.game._currentTransactionId=null;
    if(!tx.ok){result.intents=[];state.game.lastSanityReport={turn:state.game.turn,issue:'intent_transaction_rollback',detail:tx.error};}
    result.narration=sanitizeNarrationAgainstState(result.narration,resolution);
    const g=state.game;if(result.narration)addLog(`<div class="ai-narrator-label">AI NARRATOR</div>${escapeHtml(result.narration).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')}`,'ai-narration');
    (result.dialogue||[]).slice(0,5).forEach(line=>{const speaker=String(line.speaker||'Unknown').slice(0,60),emotion=line.emotion?` <span class="ai-emotion">${escapeHtml(String(line.emotion).slice(0,30))}</span>`:'';addLog(`<strong>${escapeHtml(speaker)}:</strong>${emotion} “${escapeHtml(String(line.text||'').slice(0,1200))}”`,'ai-dialogue');});
    if(g.combat&&resolution?.has_action)g.combat.lastImpact={action_text:resolution.action_text,resolution:cloneJson(resolution),profile:resolution.consequence_profile||null,narration:String(result.narration||''),narrated_death:narrationClearlyDescribesDeath(result.narration)};
    (result.memory||[]).slice(0,5).forEach(m=>{const npc=findNpcById(m.npc_id);if(npc&&m.text)addNpcMemory(npc,String(m.text).slice(0,180));});
    g.aiSuggestions=Array.isArray(result.suggested_actions)?result.suggested_actions.slice(0,4).map(x=>String(x).slice(0,140)):[];g.aiHistory=Array.isArray(g.aiHistory)?g.aiHistory:[];g.aiHistory.push({turn:++g.aiTurn,narration:String(result.narration||'').slice(0,900),dialogue:(result.dialogue||[]).slice(0,3).map(x=>`${x.speaker}: ${x.text}`).join(' | ')});if(g.aiHistory.length>12)g.aiHistory.splice(0,g.aiHistory.length-12);rememberNarrationPatterns(result.narration,result.dialogue);state.game.lastSanityReport={turn:state.game.turn,issues:tx.ok?0:1,target_alive:targetStillAlive(resolution),resolution_success:!!resolution?.success};if(g.combat&&g.combat.hp<=0)finishCombatVictory();
  }

  // ---------- Context budgeting / world summaries ----------
  function compactPersistentHistory(){
    ensureV419Collections();
    const w=state.world,g=state.game;
    if((w.events||[]).length>420){
      const cut=w.events.splice(0,w.events.length-220);
      const text=cut.slice(-20).map(e=>stripHtml(e?.text||e)).filter(Boolean).join(' • ').slice(0,1200);
      if(text)w.longTermSummaries.push({day:w.day,text:`Archived world history: ${text}`});
    }
    if((w.rumours||[]).length>220)w.rumours=w.rumours.slice(-220);
    if((w.lawCases||[]).length>180)w.lawCases=w.lawCases.filter(c=>['reported','wanted','charged'].includes(c.status)).concat(w.lawCases.filter(c=>!['reported','wanted','charged'].includes(c.status)).slice(-80)).slice(-180);
    if((g.aiHistory||[]).length>16)g.aiHistory=g.aiHistory.slice(-16);
    if((g.log||[]).length>220)g.log=g.log.slice(-220);
    if(w.longTermSummaries.length>16)w.longTermSummaries=w.longTermSummaries.slice(-16);
  }
  function summariseLongTermHistory(){
    ensureV419Collections();const events=state.world.events||[];if(events.length>24){const old=events.slice(0,events.length-16),summary={day:state.world.day,text:`Earlier history: ${old.slice(-8).map(e=>stripHtml(e.text||e)).join(' • ').slice(0,900)}`};if(!state.world.longTermSummaries.some(x=>x.text===summary.text))state.world.longTermSummaries.push(summary);if(state.world.longTermSummaries.length>12)state.world.longTermSummaries.shift();}
  }
  function relevantFactionKnowledge(){const ids=new Set((state.world.factions||[]).filter(f=>f.kingdomId===state.game.kingdomId).map(f=>f.id));for(const n of getConversationNpcs())if(n.factionId)ids.add(n.factionId);return [...ids].slice(0,7).map(id=>{const f=factionById(id),k=factionKnowledgeRecord(id);return {id,name:f?.name||id,player_identity:k.playerIdentity,recent_reports:k.reports.slice(-5)};});}
  function npcForAi(n){
    const base=npcForAiV417(n);ensureFamilyData(n);ensureNpcVisualIdentity(n);syncNpcEquipmentState(n);const fk=n.factionId?factionKnowledgeRecord(n.factionId):null;return {...base,family:{sex:n.sex,pregnancy:n.pregnancy?.active?{days:n.pregnancy.days,term:n.pregnancy.term}:null,children:(n.childrenIds||[]).length,household:n.householdId||null},romance:{...base.romance,flirt_momentum:n.romance?.flirtMomentum||0,adult_only:true},wounds:(n.injuries||[]).map(i=>({part:i.part,severity:i.severity,days_healing:i.daysHealing||0})),scars:(n.scars||[]).slice(-5),authoritative_equipment:{...n.equipment},faction_shared_knowledge:fk?{name_known:fk.playerIdentity.nameKnown,threat:fk.playerIdentity.threat,respect:fk.playerIdentity.respect,recent_reports:fk.reports.slice(-4)}:null,visual_identity:n.visualIdentity?.summary||null};
  }
  function aiWorldSnapshot(){
    summariseLongTermHistory();const snap=aiWorldSnapshotV418(),weather=currentWeather(),settlement=state.game.areaType==='town'?currentSettlementState():null;const active=(state.world.quests||[]).filter(q=>q.status==='active').slice(0,8).map(q=>{ensureQuestCoherence(q);const s=activeQuestStage(q);return {id:q.id,title:q.title,status:q.status,current_stage:q.stageIndex+1,stage_title:s?.title,objective:s?.description,progress:s?.progress,goal:s?.goal,outcome:q.outcome,deadline_day:q.deadlineDay};});
    snap.active_quests=active;snap.weather={...weather,time_of_day:state.game.time};snap.settlement_state=settlement?{name:settlement.name,owner:kingdomById(settlement.ownerKingdomId)?.name,population:settlement.population,security:settlement.security,wealth:settlement.wealth,food_supply:settlement.foodSupply,damage:settlement.damage,watch_manpower:settlement.watchManpower,siege_pressure:settlement.siegePressure}:null;snap.faction_knowledge=relevantFactionKnowledge();snap.long_term_history=(state.world.longTermSummaries||[]).slice(-4);snap.persistent_encounter=persistentEncounterAtCurrentLocation();snap.state_validation=state.game.validation;snap.outcome_sanity=state.game.lastSanityReport;
    if(snap.conversation?.participants)snap.conversation.participants=snap.conversation.participants.slice(0,5).map(p=>({...p,memory:Array.isArray(p.memory)?p.memory.slice(-4):p.memory}));if(Array.isArray(snap.recent_world_events))snap.recent_world_events=snap.recent_world_events.slice(-5);if(Array.isArray(snap.recent_ai_memory))snap.recent_ai_memory=snap.recent_ai_memory.slice(-5);
    let estimated=JSON.stringify(snap).length;snap.context_budget={estimated_characters:estimated,target_max:52000,relevance_rule:'Current scene, current NPCs, active quests, current kingdom/faction reports, recent events and summaries only.'};
    if(estimated>52000&&snap.conversation?.participants){snap.conversation.participants=snap.conversation.participants.map(p=>({...p,memory:(p.memory||[]).slice(-2),knowledge:p.knowledge?{known_facts:(p.knowledge.known_facts||[]).slice(-4)}:p.knowledge}));snap.recent_story=(snap.recent_story||[]).slice(-4);snap.long_term_history=(snap.long_term_history||[]).slice(-2);snap.context_budget.trimmed=true;}
    estimated=JSON.stringify(snap).length;
    if(estimated>52000){
      if(Array.isArray(snap.local_factions))snap.local_factions=snap.local_factions.slice(0,6);
      if(Array.isArray(snap.active_quests))snap.active_quests=snap.active_quests.slice(0,6);
      if(Array.isArray(snap.faction_knowledge))snap.faction_knowledge=snap.faction_knowledge.slice(0,5).map(f=>({...f,recent_reports:(f.recent_reports||[]).slice(-3)}));
      if(Array.isArray(snap.player_truth_for_narrator_only?.skill_definitions))snap.player_truth_for_narrator_only.skill_definitions=snap.player_truth_for_narrator_only.skill_definitions.slice(0,10);
      if(Array.isArray(snap.player_truth_for_narrator_only?.equipment_definitions))snap.player_truth_for_narrator_only.equipment_definitions=snap.player_truth_for_narrator_only.equipment_definitions.slice(0,10);
      if(Array.isArray(snap.player_truth_for_narrator_only?.special_traits_and_auras))snap.player_truth_for_narrator_only.special_traits_and_auras=snap.player_truth_for_narrator_only.special_traits_and_auras.slice(0,8);
      snap.context_budget.trimmed=true;
    }
    snap.context_budget.final_characters=JSON.stringify(snap).length;
    return snap;
  }

  // ---------- Stable NPC visual identities ----------
  function ensureNpcVisualIdentity(npc){
    if(!npc)return null;if(npc.visualIdentity)return npc.visualIdentity;const v=ensureNpcVisualProfile(npc),identity={createdDay:state.world?.day||0,seed:Math.abs(hashString(`${state.world?.seed||'world'}-${npc.id}-identity`)),face:v.face,hair:v.hair,build:v.build,apparentAge:v.apparent_age,distinguishing:v.distinguishing_detail||'',summary:`${v.apparent_age}; ${v.build}; ${v.face}; ${v.hair}; ${v.distinguishing_detail||'no major distinguishing mark'}`};npc.visualIdentity=identity;return identity;
  }
  function npcPortraitPrompt(npc){const id=ensureNpcVisualIdentity(npc),v=ensureNpcVisualProfile(npc);syncNpcEquipmentState(npc);const gear=Object.values(npc.equipment||{}).filter(Boolean),wounds=(npc.injuries||[]).map(i=>`${i.severity} ${i.part} injury`).join(', '),scars=(npc.scars||[]).join(', ');return `Recurring character identity portrait. Preserve the SAME face and identity every time: ${id.summary}. ${npc.name}, ${npc.occupation}, age ${npc.age||id.apparentAge}. Current clothing: ${v.clothing}. Current equipment: ${gear.join(', ')||'simple period clothing'}. ${wounds?`Visible wounds/bandaging: ${wounds}.`:''} ${scars?`Scars: ${scars}.`:''} Medieval fantasy portrait, illuminated manuscript blended with realistic period portraiture, waist-up, neutral parchment background, accurate equipment, no text, no modern objects, no extra limbs. Identity seed ${id.seed}.`;
  }

  // ---------- Family / household / inheritance ----------
  function playerHousehold(){ensureV419Collections();const c=state.character,parts=String(c.name||'Adventurer').trim().split(/\s+/),surname=parts.length>1?parts.at(-1):parts[0];c.familyHousehold.id ||= `household-player`;c.familyHousehold.name ||= `Household of ${surname}`;c.familyHousehold.home ||= state.game.location;c.familyHousehold.assets=Array.isArray(c.familyHousehold.assets)?c.familyHousehold.assets:[];return c.familyHousehold;}
  function createChildNpc(carrier,otherParentId){const child=createChildNpcV418(carrier,otherParentId),house=playerHousehold(),parts=String(state.character.name||'').trim().split(/\s+/),surname=parts.length>1?parts.at(-1):parts[0]||'Foundling';child.surname=surname;if(!String(child.name).includes(' '))child.name=`${child.name} ${surname}`;child.householdId=house.id;child.householdLocation=house.home;child.familyAffection={player:70,otherParent:65};child.inheritance={household:house.id,eligible:true,share:'equal among recognised children'};child.milestones=[];child.traits=[pick(['curious','calm','bold','gentle']),pick(['observant','sociable','stubborn','imaginative'])];house.children=Array.isArray(house.children)?house.children:[];if(!house.children.includes(child.id))house.children.push(child.id);pushNotification('family',`${child.name} is born`,`A new persistent family member has joined ${house.name}.`,{npcId:child.id});return child;}
  function familyMilestone(n,age,label){n.milestones=Array.isArray(n.milestones)?n.milestones:[];if(n.milestones.some(x=>x.age===age))return;n.milestones.push({age,day:state.world.day,label});pushNotification('family',`${n.name}: ${label}`,`Age ${age} milestone.`,{npcId:n.id},{dedupe:`milestone:${n.id}:${age}`});}
  function advanceFamilySimulation(){advanceFamilySimulationV418();const house=playerHousehold();for(const id of state.character.childrenIds||[]){const n=findNpcById(id);if(!n)continue;n.householdId ||= house.id;n.daysAlive=Number(n.daysAlive||Math.round((n.age||0)*365));n.age=Math.floor(n.daysAlive/365);if(n.age>=5)familyMilestone(n,5,'early childhood');if(n.age>=12)familyMilestone(n,12,'adolescence');if(n.age>=16)familyMilestone(n,16,'coming of age');if(n.age>=18){familyMilestone(n,18,'adulthood');if(n.occupation==='child')n.occupation='young adult';ensureNpcLifeState(n);}}const preg=state.character.pregnancy;if(preg?.active){preg.notified=Array.isArray(preg.notified)?preg.notified:[];for(const d of [90,180,240])if(preg.days>=d&&!preg.notified.includes(d)){preg.notified.push(d);pushNotification('family','Pregnancy progresses',`Day ${preg.days}/${preg.term}.`,null,{dedupe:`player-preg:${d}`});}}}

  function maybeRelocateNpcsDaily(){
    for(const n of state.world.npcs||[]){if(n.dead||n.companion||n.factionId&&/guard|watch/i.test(String(n.occupation||'')))continue;if(n.questLocked||state.game.activeNpc?.id===n.id)continue;ensureNpcLifeState(n);if(Number(n.lifeGoal?.urgency||0)<65||Math.random()>.018)continue;const k=kingdomById(n.kingdomId);const choices=(k?.spawnSites||[]).filter(s=>s.areaType==='town'&&s.name!==n.location);if(!choices.length)continue;const dest=pick(choices),old=n.location;n.location=dest.name;n.schedule.home=dest.name;n.schedule.work=dest.name;n.schedule.currentLocation=dest.name;pushNotification('npc',`${n.name} moved`,`${old} → ${dest.name} while pursuing ${n.lifeGoal?.text||'personal goals'}.`,{npcId:n.id},{dedupe:`move:${n.id}:${dest.name}`});}
  }

  // ---------- World-day orchestration ----------
  function propagateFactionKnowledge(){
    for(const fk of Object.values(state.world.factionKnowledge||{})){fk.playerIdentity.threat=clamp(Number(fk.playerIdentity.threat||0)-1,0,100);fk.playerIdentity.respect=clamp(Number(fk.playerIdentity.respect||0),0,100);fk.reports=fk.reports.filter(r=>state.world.day-Number(r.day||0)<=90);fk.updatedDay=state.world.day;}
  }
  function updateBattlefieldCohesion(delta,reason='battle'){const e=state.game.combat,before=e?.battlefield?.broken;updateBattlefieldCohesionV418(delta,reason);if(e?.battlefield?.broken&&!before)pushNotification('combat','Enemy formation broken',`${e.battlefield.name||'Formation'} lost cohesion because ${reason}.`,null,{dedupe:`formation:${state.game.turn}`});}
  function requestCombatHelp(npc,kind='reinforcements',reason='calls for help'){
    const settlement=state.game.areaType==='town'||state.game.areaType==='outskirts'?ensureSettlementState(state.game.location,state.game.kingdomId):null;if(settlement&&['watch','reinforcements'].includes(kind)&&settlement.watchManpower<=0){addLog(`The alarm is raised, but ${escapeHtml(settlement.name)} has no immediately available watch manpower to answer it.`,'system');return;}
    const before=(state.game.combat?.reinforcementQueue||[]).reduce((s,q)=>s+q.count,0);requestCombatHelpV418(npc,kind,reason);if(settlement&&state.game.combat){const queued=state.game.combat.reinforcementQueue||[],after=queued.reduce((s,q)=>s+q.count,0),added=Math.max(0,after-before),cap=Math.max(0,settlement.watchManpower);if(added>cap){let excess=added-cap;for(let i=queued.length-1;i>=0&&excess>0;i--){const cut=Math.min(excess,queued[i].count);queued[i].count-=cut;excess-=cut;if(queued[i].count<=0)queued.splice(i,1);}}}
  }
  function advanceWorldDay(days=1){
    for(let i=0;i<days;i++){advanceWorldDayV418(1);processSettlementDay();progressNpcInjuries();progressPersistentEncounters();evaluateQuestConsequences();propagateFactionKnowledge();maybeRelocateNpcsDaily();generateWeather(state.game.kingdomId);summariseLongTermHistory();compactPersistentHistory();validateAndRepairState({quiet:true});}
  }
  function advanceTurn(amount=1){advanceTurnV418(amount);if(state.game.turn%4===0)validateAndRepairState({quiet:true});}

  // ---------- Enhanced family aging without double-ticks ----------
  // advanceFamilySimulation() above wraps the V4.18 single-day family tick.

  // ---------- Recovery & diagnostics ----------
  async function clearGeneratedMediaCache(){
    try{
      const db=await openMediaDb?.();if(!db)return false;
      return await new Promise(resolve=>{try{const tx=db.transaction('media','readwrite');tx.objectStore('media').clear();tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);}catch{resolve(false);}});
    }catch{return false;}
  }
  function recordRuntimeDiagnostic(kind,error){
    try{
      const entry={kind,at:new Date().toISOString(),turn:Number(state.game?.turn||0),day:Number(state.world?.day||0),screen:state.screen||null,message:String(error?.message||error||'Unknown runtime error').slice(0,700),stack:String(error?.stack||'').slice(0,1800)};
      if(state.game)state.game.lastRuntimeError=entry;
      localStorage.setItem(`${SAVE_KEY}.lastError`,JSON.stringify(entry));
    }catch{}
  }
  function installRuntimeErrorGuard(){
    if(window.__rrV419ErrorGuard)return;window.__rrV419ErrorGuard=true;
    window.addEventListener?.('error',e=>recordRuntimeDiagnostic('error',e?.error||e?.message));
    window.addEventListener?.('unhandledrejection',e=>recordRuntimeDiagnostic('unhandledrejection',e?.reason));
  }
  function showSaveRecovery(){
    const wrap=document.createElement('div');wrap.className='modal-backdrop',main=parseSaveRecord(localStorage.getItem(SAVE_KEY)),backs=backupRecords(),validation=validateAndRepairState({quiet:true});
    let runtimeError=null;try{runtimeError=JSON.parse(localStorage.getItem(`${SAVE_KEY}.lastError`)||'null');}catch{}
    wrap.innerHTML=`<div class="modal people-modal"><div class="ledger-head"><div><div class="eyebrow">Campaign protection</div><h2>Recovery & Diagnostics</h2><p class="section-copy">Versioned saves, automatic snapshots, export/import, runtime diagnostics and regression checks.</p></div><button class="ghost-button" data-close-modal>Close</button></div><div class="diagnostic-grid"><article class="people-card"><h3>Main save</h3><p>${main.ok?`Checksum OK • schema ${main.payload?.schemaVersion||'legacy'} • turn ${main.payload?.game?.turn||0}`:`INVALID — ${escapeHtml(main.error||'unknown error')}`}</p><p>Validator: ${validation.repaired.length} repair(s), ${validation.warnings.length} warning(s).</p>${runtimeError?`<p><strong>Last runtime diagnostic:</strong> ${escapeHtml(runtimeError.kind)} • ${escapeHtml(runtimeError.message)} <small>${escapeHtml(runtimeError.at||'')}</small></p>`:''}<div class="action-row"><button class="secondary-button" id="validateSave">Validate now</button><button class="secondary-button" id="exportSave">Export save</button><button class="ghost-button" id="importSave">Import save</button><button class="ghost-button" id="clearMediaCache">Clear generated art cache</button><input id="importSaveFile" type="file" accept="application/json,.json" hidden></div></article><article class="people-card"><h3>Automatic backups</h3>${backs.length?backs.map(b=>`<div class="system-row"><div><strong>Backup ${b.slot}</strong><small>Turn ${b.turn} • day ${b.day} • ${escapeHtml(String(b.savedAt))}</small></div><button class="ghost-button" data-restore-backup="${b.slot}">Restore</button></div>`).join(''):`<p>No backup snapshots yet. They are created automatically as the campaign advances.</p>`}</article><article class="people-card"><h3>Regression suite</h3><p>Runs deterministic checks against the current build, then restores your campaign state.</p><button class="primary-button" id="runRegression">Run V4.19 self-tests</button><pre id="regressionOutput" class="debug-pre compact-debug">Not run yet.</pre></article></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.querySelector('[data-close-modal]').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close();};wrap.querySelector('#validateSave').onclick=()=>{const r=validateAndRepairState({quiet:false});wrap.querySelector('#regressionOutput').textContent=`State validation\nRepairs: ${r.repaired.length}\nWarnings: ${r.warnings.length}\n${r.warnings.join('\n')}`;saveGame(false);};wrap.querySelector('#exportSave').onclick=exportCurrentSave;wrap.querySelector('#importSave').onclick=()=>wrap.querySelector('#importSaveFile').click();wrap.querySelector('#importSaveFile').onchange=e=>{const file=e.target.files?.[0];if(file){close();importSaveFile(file);}};wrap.querySelector('#clearMediaCache').onclick=async()=>{const ok=await clearGeneratedMediaCache();showToast(ok?'Generated portrait/bestiary art cache cleared.':'Generated art cache could not be cleared in this browser.');};wrap.querySelectorAll('[data-restore-backup]').forEach(b=>b.onclick=()=>{const raw=localStorage.getItem(`${V419_BACKUP_PREFIX}${b.dataset.restoreBackup}`),p=parseSaveRecord(raw);if(p.ok&&confirm(`Restore backup ${b.dataset.restoreBackup}? The current main save will be retained as a backup.`)){const current=localStorage.getItem(SAVE_KEY);if(current)rotateValidBackup(current);localStorage.setItem(SAVE_KEY,JSON.stringify(p.envelope||makeSaveEnvelope(p.payload)));close();loadGame();}});wrap.querySelector('#runRegression').onclick=()=>{const results=runV419SelfTests();wrap.querySelector('#regressionOutput').textContent=results.map(r=>`${r.ok?'PASS':'FAIL'} — ${r.name}${r.detail?`\n  ${r.detail}`:''}`).join('\n');};
  }

  function runV419SelfTests(){
    const original=snapshotCoreState(),results=[];const test=(name,fn)=>{try{const value=fn();if(value===false)throw new Error('assertion returned false');results.push({name,ok:true});}catch(err){results.push({name,ok:false,detail:String(err?.message||err)});}};
    try{
      ensureV419Collections();
      test('Save envelope checksum validates',()=>parseSaveRecord(JSON.stringify(makeSaveEnvelope())).ok);
      test('Atomic rollback restores state',()=>{const before=walletCopper(state.character.currency);const r=atomicStateTransaction('test rollback',()=>{changeCurrency(state.character,-Math.min(1,before));throw new Error('forced');});return !r.ok&&walletCopper(state.character.currency)===before;});
      test('Currency transfer conserves total coin and is idempotent',()=>{const a={currency:walletFromCopper(500)},b={currency:walletFromCopper(120)},before=walletCopper(a.currency)+walletCopper(b.currency),id='regression-fixed-tx';const one=transferCurrency(a,b,50,{transactionId:id,from:'a',to:'b',reason:'test'}),after1=walletCopper(a.currency)+walletCopper(b.currency),b1=walletCopper(b.currency),two=transferCurrency(a,b,50,{transactionId:id,from:'a',to:'b',reason:'test'});return one&&two&&after1===before&&walletCopper(b.currency)===b1;});
      test('Dead service provider is replaced',()=>{const n=getServiceNpc('blacksmith'),id=n.id;n.dead=true;const replacement=getServiceNpc('blacksmith');return replacement&&!replacement.dead&&replacement.id!==id;});
      test('Unwitnessed crime does not instantly create wanted heat',()=>{const heat=currentHeat(),len=state.world.lawCases.length;recordCrime('Regression hidden crime',5,false);const c=state.world.lawCases.at(-1);return state.world.lawCases.length===len+1&&c.status==='unreported'&&currentHeat()===heat;});
      test('Quest stage progresses one stage at a time',()=>{const q={id:'reg-q',title:'Regression Quest',description:'test',status:'active',multiStage:true,createdDay:state.world.day,stages:[{title:'One',objectiveKind:'explore',goal:1,progress:0,description:''},{title:'Two',objectiveKind:'combat',goal:1,progress:0,description:''},{title:'Three',objectiveKind:'return',goal:1,progress:0,description:''}],stageIndex:0,rewardCopper:10,rewardXp:1};state.world.quests=[q];progressQuests('explore',1);return q.stageIndex===1&&q.status==='active';});
      test('Pregnancy advances exactly one day per family tick',()=>{state.character.pregnancy={active:true,days:0,term:999,otherParentId:null};advanceFamilySimulation();return state.character.pregnancy.days===1;});
      test('Persistent encounter keeps reduced HP',()=>{state.game.combat={name:'Starved Wolf',level:1,hp:7,maxHp:22,dmg:[2,5],xp:10,gold:[0,0],attacks:['bite'],context:'wilderness',allies:[],reinforcementQueue:[]};rememberPersistentEncounter('fled');const e=persistentEncounterAtCurrentLocation();return e&&e.hp===7;});
      test('Settlement state is persistent and bounded',()=>{const s=ensureSettlementState();s.security=44;return ensureSettlementState().security===44&&s.population>0&&s.foodSupply>=0&&s.foodSupply<=100;});
      test('Weather state is deterministic within the current day',()=>{const a=currentWeather(),b=currentWeather();return a.type===b.type&&a.day===b.day;});
      test('NPC equipment is authoritative',()=>{const n={id:freshNpcId('testnpc'),name:'Test Guard',occupation:'guard',personality:'steady',kingdomId:state.game.kingdomId,location:state.game.location,relationship:0,memory:[],inventory:[],socialLinks:{},combatLoadout:{weapon:'spear and side sword',armour:'mail and shield'}};state.world.npcs.push(n);ensureNpcCombatIdentity(n,'watch');return !!n.equipment.mainHand&&n.inventory.includes(n.equipment.mainHand);});
      test('AI context remains relevance-bounded',()=>{const snap=aiWorldSnapshot();return JSON.stringify(snap).length<60000&&Number(snap.context_budget?.final_characters||0)<60000;});
      test('Immutable save envelope stays valid after live state changes',()=>{const env=makeSaveEnvelope(),oldDay=state.world.day;state.world.day=oldDay+1;const ok=parseSaveRecord(JSON.stringify(env)).ok;state.world.day=oldDay;return ok;});
      test('Rollback reinstalls the legacy gold compatibility bridge',()=>{const before=walletCopper(state.character.currency);atomicStateTransaction('test accessor rollback',()=>{changeCurrency(state.character,-Math.min(1,before));throw new Error('forced');});const d=Object.getOwnPropertyDescriptor(state.character,'gold');return typeof d?.get==='function'&&Math.round(state.character.gold*100)===walletCopper(state.character.currency);});
      test('Heavy rain suppresses fire and amplifies lightning',()=>{const kid=state.game.kingdomId,prior=cloneJson(state.world.weather[kid]);state.world.weather[kid]={type:'Heavy Rain',wetness:90,visibility:62,travelMultiplier:1.22,wind:20,temperature:10,day:state.world.day,year:state.world.year,season:state.world.season};const fire={has_action:true,action_text:'I cast a fireball',total:20,difficulty:10,success:true,resolved_damage:10},bolt={has_action:true,action_text:'I strike with lightning',total:20,difficulty:10,success:true,resolved_damage:10};weatherActionAdjust(fire);weatherActionAdjust(bolt);if(prior)state.world.weather[kid]=prior;else delete state.world.weather[kid];return fire.resolved_damage<10&&bolt.resolved_damage>10&&fire.weather_effect.modifier<0&&bolt.weather_effect.modifier>0;});
      test('Faction reports become shared organisational knowledge',()=>{const f=state.world.factions?.[0];if(!f)return true;const n={id:freshNpcId('faction-test'),name:'Faction Witness',occupation:'clerk',personality:'observant',kingdomId:f.kingdomId,location:state.game.location,factionId:f.id,relationship:0,memory:[],inventory:[],socialLinks:{}};state.world.npcs.push(n);const fk=factionKnowledgeRecord(f.id),before=fk.reports.length;shareFactionKnowledge(n,'The player attacked a patrol during regression testing.',{kind:'hostility',confidence:90});return fk.reports.length===before+1&&fk.playerIdentity.threat>0;});
      test('Minor NPC wounds heal over world time',()=>{const n={id:freshNpcId('wound-test'),name:'Wounded Tester',occupation:'farmer',personality:'patient',kingdomId:state.game.kingdomId,location:state.game.location,relationship:0,memory:[],inventory:[],socialLinks:{},injuries:[{part:'arm',severity:'minor',cause:'test',daysHealing:5}],resources:{ammo:0,mana:0,healing:0,stamina:50}};state.world.npcs.push(n);progressNpcInjuries();return n.injuries.length===0;});
      test('AI death contradiction is corrected while target is alive',()=>{const n={id:freshNpcId('sanity-test'),name:'Living Tester',occupation:'guard',personality:'steady',kingdomId:state.game.kingdomId,location:state.game.location,relationship:0,memory:[],inventory:[],socialLinks:{},dead:false};state.world.npcs.push(n);const r={has_action:true,action_kind:'attack',action_text:'I slash him',success:true,resolved_damage:2,target_npc_id:n.id,target_name:n.name,integrity_outcome:{}};const text=sanitizeNarrationAgainstState('The guard falls dead.',r);return /remains alive/i.test(text)&&!/^The guard falls dead\.?$/i.test(text);});
      test('Disarming moves the actual equipped weapon into the scene',()=>{const n={id:freshNpcId('disarm-test'),name:'Armed Tester',occupation:'guard',personality:'steady',kingdomId:state.game.kingdomId,location:state.game.location,relationship:0,memory:[],inventory:[],socialLinks:{},combatLoadout:{weapon:'spear and side sword',armour:'mail'}};state.world.npcs.push(n);ensureNpcCombatIdentity(n,'watch');const weapon=n.equipment.mainHand,ok=disarmNpc(n.id),ground=ensureSceneContainers().find(c=>c.id.endsWith('-ground'));return ok&&!n.equipment.mainHand&&!n.inventory.includes(weapon)&&ground?.contents?.includes(weapon);});
      test('Unknown wilderness locations do not create phantom settlements',()=>settlementStateForKnownLocation('Regression Deep Wilderness',state.game.kingdomId)===null);
      test('Damaged settlements are reflected on the atlas',()=>{const k=currentKingdom(),site=(k.spawnSites||[]).find(x=>x.areaType==='town')||(k.spawnSites||[])[0];if(!site)return true;const st=ensureSettlementState(site.name,k.id),old=st.damage;st.damage=80;const svg=worldMapSvg();st.damage=old;return svg.includes('ruined')&&svg.includes(site.name);});
      test('Quest deadlines fail cleanly rather than hanging active',()=>{const q={id:'reg-deadline',title:'Late Quest',description:'test',status:'active',multiStage:false,createdDay:state.world.day-30,deadlineDay:state.world.day-1,stages:[{title:'Late',objectiveKind:'explore',goal:1,progress:0,description:''}],stageIndex:0,rewardCopper:1,rewardXp:1};state.world.quests.push(q);evaluateQuestConsequences();return q.status==='failed'&&q.outcome==='deadline_missed';});
      test('State validator completes successfully',()=>validateAndRepairState({quiet:true}).warnings.length<8);
    }finally{restoreCoreState(original);ensureV419Collections();state.world.regressionHistory.push({day:state.world.day,turn:state.game.turn,passed:results.filter(r=>r.ok).length,total:results.length,failed:results.filter(r=>!r.ok).map(r=>r.name)});if(state.world.regressionHistory.length>20)state.world.regressionHistory.shift();}
    return results;
  }

  // ---------- V4.19 UI / notifications / debug ----------
  function injectAdventureUi(){injectAdventureUiV418();const panel=document.getElementById('adventureCodexPanel');if(panel&&!document.getElementById('openNotifications')){const btn=document.createElement('button');btn.className='secondary-button';btn.id='openNotifications';btn.innerHTML=`Events ${unreadNotificationCount()?`<span class="notification-badge">${unreadNotificationCount()}</span>`:''}`;panel.querySelector('.codex-button-grid')?.appendChild(btn);btn.onclick=showNotifications;}}
  function injectV419Ui(){
    injectAdventureUi();const left=document.querySelector('.left-panel');if(left&&!document.getElementById('weatherHud')){const w=currentWeather(),sec=document.createElement('section');sec.className='panel hud-card';sec.id='weatherHud';sec.innerHTML=`<div class="hud-heading">Weather & time</div><div class="hud-row"><span>Conditions</span><strong>${escapeHtml(w.type)}</strong></div><div class="hud-row"><span>Visibility</span><strong>${w.visibility}%</strong></div><div class="hud-row"><span>Time</span><strong>${escapeHtml(state.game.time)}</strong></div>`;left.appendChild(sec);}const right=document.querySelector('.right-panel');if(right&&!document.getElementById('coherenceHud')){const s=state.game.areaType==='town'?currentSettlementState():null,sec=document.createElement('section');sec.className='panel hud-card';sec.id='coherenceHud';sec.innerHTML=`<div class="hud-heading">World coherence</div><div class="hud-row"><span>Save integrity</span><strong>${state.game.validation?.warnings?.length?'Check':'OK'}</strong></div>${s?`<div class="hud-row"><span>Settlement</span><strong>${s.security} security • ${s.damage} damage</strong></div>`:''}<div class="hud-row"><span>Unread events</span><strong>${unreadNotificationCount()}</strong></div><button class="ghost-button ledger-button" id="openRecovery">Recovery & Diagnostics</button>`;right.appendChild(sec);sec.querySelector('#openRecovery').onclick=showSaveRecovery;}}
  function injectIntegrityUi(){injectIntegrityUiV418();injectV419Ui();}
  function showSimulationDebug(){const wrap=document.createElement('div');wrap.className='modal-backdrop';const snap={version:'4.19',validation:state.game.validation,save:state.world.saveMeta,weather:currentWeather(),settlement:state.game.areaType==='town'?currentSettlementState():null,faction_knowledge:relevantFactionKnowledge(),persistent_encounter:persistentEncounterAtCurrentLocation(),notifications:(state.world.notifications||[]).slice(-10),regression_history:(state.world.regressionHistory||[]).slice(-5),base:debugSnapshot(),context_budget:aiWorldSnapshot().context_budget};wrap.innerHTML=`<div class="modal debug-modal"><div class="ledger-head"><div><div class="eyebrow">Developer state</div><h2>Simulation Inspector V4.19</h2><p class="section-copy">Authoritative state, validation, save health and world coherence.</p></div><button class="ghost-button" id="debugClose">Close</button></div><pre class="debug-pre">${escapeHtml(JSON.stringify(snap,null,2))}</pre></div>`;document.body.appendChild(wrap);wrap.querySelector('#debugClose').onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};}

  function showMenu(){
    const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="Game menu"><div class="eyebrow">Campaign</div><h2>Adventure menu</h2><p>Your current adventure uses V4.19 versioned saves with automatic recovery snapshots.</p><div class="action-row"><button class="primary-button" id="menuSave">Save + verify</button><button class="secondary-button" id="menuRecovery">Recovery & Diagnostics</button><button class="secondary-button" id="menuReturn">Return to title</button><button class="danger-button" id="menuDelete">Delete save</button><button class="ghost-button" id="menuClose">Close</button></div></div>`;document.body.appendChild(wrap);wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};wrap.querySelector('#menuClose').onclick=()=>wrap.remove();wrap.querySelector('#menuSave').onclick=()=>{saveGame();wrap.remove();};wrap.querySelector('#menuRecovery').onclick=()=>{wrap.remove();showSaveRecovery();};wrap.querySelector('#menuReturn').onclick=()=>{saveGame(false);state.screen='title';wrap.remove();render();};wrap.querySelector('#menuDelete').onclick=()=>{if(confirm('Delete the main saved adventure and automatic backups from this browser?')){localStorage.removeItem(SAVE_KEY);for(let i=1;i<=V419_BACKUP_COUNT;i++)localStorage.removeItem(`${V419_BACKUP_PREFIX}${i}`);state.screen='title';wrap.remove();render();}};
  }

  // ---------- Additional atomic inventory / service commits ----------
  function takeContainerItem(containerId,index){
    const tx=atomicStateTransaction('Take container item',()=>{const c=ensureSceneContainers().find(x=>x.id===containerId);if(!c||c.locked)throw new Error('Container is inaccessible');const item=c.contents?.[index];if(!item)throw new Error('Item is no longer in the container');c.contents.splice(index,1);state.character.inventory.push(item);if(c.ownerId)recordCrime(`Theft of ${item}`,5,true);syncOwnershipLedger();updateCarryingState();return {item,container:c.name};});
    if(!tx.ok){showToast(tx.error);return false;}addLog(`You take <strong>${escapeHtml(tx.result.item)}</strong> from ${escapeHtml(tx.result.container)}.`,'event');return true;
  }
  function dropInventoryItem(index){
    const tx=atomicStateTransaction('Drop inventory item',()=>{const item=state.character.inventory?.[index];if(!item)throw new Error('Item no longer exists');state.character.inventory.splice(index,1);const containers=ensureSceneContainers();let ground=containers.find(x=>x.id.endsWith('-ground'));if(!ground){ground={id:`${currentLocationKey()}-ground`,name:'Items on the ground',ownerId:null,locked:false,contents:[]};containers.push(ground);}ground.contents.push(item);syncOwnershipLedger();updateCarryingState();return item;});
    if(!tx.ok){showToast(tx.error);return false;}addLog(`You leave <strong>${escapeHtml(tx.result)}</strong> here.`,'event');return true;
  }
  function serviceAction(action){
    if(action==='service-close'){state.game.servicesMenu=false;renderGame();return;}
    const providerType=action==='service-repair'?'blacksmith':action==='service-heal'?'healer':action==='service-stable'?'stable':action==='service-alchemy'?'alchemist':null,provider=providerType?getServiceNpc(providerType):null;if(provider){updateNpcSchedules();if(provider.dead||provider.imprisoned){addLog(`That service is currently unavailable because its provider cannot work.`,'system');renderGame();return;}if(provider.schedule?.available===false){addLog(`${escapeHtml(provider.name)} is currently ${escapeHtml(provider.schedule.activity)} and the service is closed.`,'system');renderGame();return;}}
    let label='Service';const tx=atomicStateTransaction(`Service: ${action}`,()=>{
      if(action==='service-repair'){const damaged=Object.values(state.character.equipment||{}).filter(Boolean).sort((a,b)=>durabilityFor(a)-durabilityFor(b))[0];if(!damaged)throw new Error('No equipped item needs repair');const missing=100-durabilityFor(damaged),cost=Math.max(5,missing*2);if(!executeNpcTransaction(provider,cost,'purchase',null,`Repair ${damaged}`))throw new Error('Repair payment failed');state.character.itemDurability[damaged]=100;state.character.equipmentCondition[damaged]=100;label=`${provider.name} repairs ${damaged} to full condition.`;}
      else if(action==='service-heal'){const cost=45;if(!executeNpcTransaction(provider,cost,'purchase',null,'Medical treatment'))throw new Error('Treatment payment failed');state.character.hp=Math.min(state.character.maxHp,state.character.hp+Math.round(state.character.maxHp*.55));const wound=(state.character.injuries||[]).find(x=>x.severity!=='severed');if(wound)state.character.injuries=state.character.injuries.filter(x=>x!==wound);label=`${provider.name} treats your wounds.`;}
      else if(action==='service-stable'){if(state.character.mount)throw new Error(`You already have ${state.character.mount.name}`);const cost=180;if(!executeNpcTransaction(provider,cost,'purchase',null,'Riding horse'))throw new Error('Horse purchase failed');state.character.mount={name:'Riding Horse',speedBonus:.35,carryBonus:24};updateCarryingState();label='You acquire a riding horse.';}
      else if(action==='service-alchemy'){const cost=55;if(!executeNpcTransaction(provider,cost,'purchase',null,'Healing Draught'))throw new Error('Alchemy purchase failed');state.character.inventory.push('Healing Draught');syncOwnershipLedger();label=`${provider.name} sells you a Healing Draught.`;}
      else throw new Error('Unknown service action');return true;
    });
    if(!tx.ok){addLog(`<strong>Service cancelled:</strong> ${escapeHtml(tx.error)}`,'system');renderGame();return;}addLog(escapeHtml(label),'event');advanceTurn();saveGame(false);renderGame();
  }

  installRuntimeErrorGuard();

  saveButton.addEventListener("click", () => saveGame(true));
  menuButton.addEventListener("click", showMenu);
  document.getElementById("viewModeButton")?.addEventListener("click", showViewModeMenu);
  brandButton.addEventListener("click", () => {
    if (state.screen === "game") {
      saveGame(false);
    }
    state.screen = "title";
    render();
  });

  try {
    applyViewMode();
    loadDraft();
    render();
    document.documentElement.dataset.rrReady = "true";
  } catch (err) {
    console.error("Realms & Ruin startup failed:", err);
    const root = document.getElementById("screenRoot");
    if (root) {
      root.innerHTML = `<div id="bootStatus"><strong>Realms & Ruin could not start.</strong><span>${escapeHtml(err?.message || String(err))}</span><div class="boot-error">Refresh once. If this remains, send a screenshot of this exact message.</div></div>`;
    }
  }
})();
