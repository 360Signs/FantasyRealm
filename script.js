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

  const STAT_INFO = {
    str: ["Strength", "Damage & physical feats"],
    dex: ["Dexterity", "Speed, aim & stealth"],
    con: ["Constitution", "Health & endurance"],
    int: ["Intelligence", "Magic & knowledge"],
    wis: ["Wisdom", "Awareness & judgement"],
    cha: ["Charisma", "Influence & leadership"]
  };

  const WORLD_PREFIX = ["Ael", "Bran", "Caer", "Dra", "Eld", "Fyr", "Glen", "High", "Ivor", "Khar", "Lorn", "Mor", "Nor", "Ost", "Raven", "Storm", "Thorn", "Val", "West", "Yar"];
  const WORLD_SUFFIX = ["ador", "ath", "dor", "en", "eria", "fall", "gard", "helm", "ia", "mere", "or", "reach", "ryn", "spire", "vale", "wyn"];

  const KINGDOM_FIRST = ["Alder", "Ash", "Black", "Bright", "Cinder", "Crow", "Dawn", "Dragon", "Eagle", "Elder", "Ember", "Frost", "Gold", "Grey", "Iron", "Moon", "Oak", "Raven", "Red", "River", "Silver", "Stone", "Storm", "Sun", "Thorn", "White", "Wolf"];
  const KINGDOM_LAST = ["crest", "fall", "gard", "hold", "mark", "mere", "reach", "rest", "vale", "watch", "wood", "wyn", "moor", "haven", "spire"];

  const FIRST_NAMES = ["Aldric","Brenna","Cassian","Darian","Elara","Fenric","Garran","Helena","Isolde","Joren","Kael","Lyra","Mira","Nerys","Orin","Perrin","Rhea","Seren","Talia","Ulric","Veyra","Wren","Ysabel","Zoren"];
  const LAST_NAMES = ["Ashford","Blackwood","Crowe","Dunmere","Emberfell","Fairwind","Grey","Harrow","Ironwood","Kestrel","Locke","Mourn","North","Oakheart","Rook","Storme","Thorne","Vale","Westfall","Wolfe"];
  const SETTLEMENT_PREFIX = ["Oak","Raven","Red","Green","High","Low","Kings","Queens","Stone","River","West","East","North","South","Wolf","Ash","Briar","Gold","White","Black"];
  const SETTLEMENT_SUFFIX = ["mere","ford","bridge","haven","wick","field","bury","watch","cross","stead","brook","fall","gate","ton","ham","keep"];

  const CREATURES = [
    {name:"Starved Wolf", level:1, hp:18, dmg:[3,7], xp:25, gold:[0,2]},
    {name:"Goblin Scavenger", level:1, hp:22, dmg:[4,7], xp:30, gold:[2,8]},
    {name:"Roadside Bandit", level:2, hp:28, dmg:[5,9], xp:38, gold:[6,15]},
    {name:"Bog Imp", level:2, hp:24, dmg:[4,10], xp:36, gold:[1,6]},
    {name:"Dire Boar", level:3, hp:40, dmg:[6,11], xp:52, gold:[0,0]},
    {name:"Skeleton Guard", level:3, hp:34, dmg:[7,11], xp:55, gold:[4,12]}
  ];

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
      appearance: "Dark hair, weathered travelling clothes",
      background: "Peasant",
      className: "Warrior",
      stats: { str:8, dex:8, con:8, int:8, wis:8, cha:8 },
      pointsRemaining: 18
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
      if (parsed?.character && parsed?.world) draft = parsed;
    } catch {}
  }

  function saveGame(showMessage=true) {
    if (!state.character || !state.world || !state.game) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 1,
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
    return `
      <h2 class="section-title">Who are you?</h2>
      <p class="section-copy">Set the identity that the world will use when describing and reacting to your character.</p>
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
          <input class="input" id="charAge" type="number" min="16" max="120" value="${c.age}">
        </div>
        <div class="field">
          <label for="charRace">Race</label>
          <select class="select" id="charRace">
            ${Object.keys(RACES).map(x => `<option ${c.race===x?"selected":""}>${x}</option>`).join("")}
          </select>
          <small id="raceDesc">${RACES[c.race].desc}</small>
        </div>
        <div class="field full">
          <label for="appearance">Appearance</label>
          <textarea class="textarea" id="appearance" maxlength="240" placeholder="Hair, eyes, build, scars, clothing...">${escapeHtml(c.appearance)}</textarea>
        </div>
      </div>
    `;
  }

  function renderOriginStep() {
    const c = draft.character;
    return `
      <h2 class="section-title">Choose your origin</h2>
      <p class="section-copy">Your background determines starting money, equipment and an early skill. Your class shapes your combat growth.</p>
      <div class="eyebrow">Background</div>
      <div class="card-select-grid" id="backgroundGrid">
        ${Object.entries(BACKGROUNDS).map(([name, data]) => `
          <button type="button" class="select-card ${c.background===name?"selected":""}" data-background="${name}">
            <strong>${name}</strong>
            <span>${data.desc}</span>
          </button>
        `).join("")}
      </div>
      <div class="divider"></div>
      <div class="eyebrow">Starting class</div>
      <div class="card-select-grid" id="classGrid">
        ${Object.entries(CLASSES).map(([name, data]) => `
          <button type="button" class="select-card ${c.className===name?"selected":""}" data-class="${name}">
            <strong>${name}</strong>
            <span>${data.desc}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderStatsStep() {
    const c = draft.character;
    return `
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap">
        <div>
          <h2 class="section-title">Build your attributes</h2>
          <p class="section-copy" style="margin-bottom:0">Spend points now. Racial bonuses are applied after creation.</p>
        </div>
        <div class="points-pill"><span>Points remaining</span><strong id="pointsRemaining">${c.pointsRemaining}</strong></div>
      </div>
      <div class="divider"></div>
      <div class="stat-builder">
        ${Object.entries(STAT_INFO).map(([key, [name, desc]]) => `
          <div class="stat-row">
            <div class="stat-name"><strong>${name}</strong><small>${desc}</small></div>
            <div class="stat-value" id="stat-${key}">${c.stats[key]}</div>
            <div class="stat-controls">
              <button class="icon-button" type="button" data-stat="${key}" data-delta="-1" aria-label="Lower ${name}">−</button>
              <button class="icon-button" type="button" data-stat="${key}" data-delta="1" aria-label="Raise ${name}">+</button>
            </div>
          </div>
        `).join("")}
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
    const raceBonus = RACES[c.race].bonus;
    const finalStats = Object.fromEntries(Object.keys(c.stats).map(k => [k, c.stats[k] + (raceBonus[k] || 0)]));
    return `
      <h2 class="section-title">Ready to enter the realm</h2>
      <p class="section-copy">Review your setup. You can go back and change anything before generation.</p>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>${escapeHtml(c.name || "Unnamed Adventurer")}</h3>
          <div class="summary-list">
            <div><span>Identity</span><strong>${c.age} • ${c.sex} • ${c.race}</strong></div>
            <div><span>Origin</span><strong>${c.background}</strong></div>
            <div><span>Class</span><strong>${c.className}</strong></div>
            <div><span>Starting skill</span><strong>${BACKGROUNDS[c.background].skill}</strong></div>
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
            <div><span>Gold</span><strong>${BACKGROUNDS[c.background].gold}</strong></div>
            <div><span>Class technique</span><strong>${CLASSES[c.className].skill}</strong></div>
            <div><span>Equipment</span><strong>${BACKGROUNDS[c.background].items.length} items</strong></div>
          </div>
        </div>
      </div>
    `;
  }

  function wireWizardStep() {
    if (state.wizardStep === 0) {
      const race = document.getElementById("charRace");
      race.addEventListener("change", () => {
        document.getElementById("raceDesc").textContent = RACES[race.value].desc;
      });
    }

    if (state.wizardStep === 1) {
      document.querySelectorAll("[data-background]").forEach(btn => {
        btn.addEventListener("click", () => {
          draft.character.background = btn.dataset.background;
          render();
        });
      });
      document.querySelectorAll("[data-class]").forEach(btn => {
        btn.addEventListener("click", () => {
          draft.character.className = btn.dataset.class;
          render();
        });
      });
    }

    if (state.wizardStep === 2) {
      document.querySelectorAll("[data-stat]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.stat;
          const delta = Number(btn.dataset.delta);
          const current = draft.character.stats[key];
          if (delta > 0 && draft.character.pointsRemaining <= 0) return showToast("No attribute points remaining.");
          if (delta < 0 && current <= 8) return;
          draft.character.stats[key] += delta;
          draft.character.pointsRemaining -= delta;
          document.getElementById(`stat-${key}`).textContent = draft.character.stats[key];
          document.getElementById("pointsRemaining").textContent = draft.character.pointsRemaining;
          saveDraft();
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

  function captureCurrentStep() {
    const c = draft.character;
    const w = draft.world;

    if (state.wizardStep === 0) {
      c.name = document.getElementById("charName").value.trim();
      c.sex = document.getElementById("charSex").value;
      c.age = Math.max(16, Math.min(120, Number(document.getElementById("charAge").value) || 19));
      c.race = document.getElementById("charRace").value;
      c.appearance = document.getElementById("appearance").value.trim() || "A plainly dressed traveller.";
      if (c.name.length < 2) {
        showToast("Enter a character name.");
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
      kingdoms.push({
        id: `k${i}`,
        name,
        ruler,
        rulerTitle: rng() > .5 ? "King" : "Queen",
        capital,
        region: pick(regionTypes, rng),
        trait: pick(traits, rng),
        strength: randInt(35, 92, rng),
        color: colors[i % colors.length],
        relation: randInt(-55, 55, rng)
      });
    }

    const startKingdom = kingdoms[0];
    const settlement = settlementName(rng);
    return {
      name: worldName,
      seed: config.seed,
      kingdoms,
      startKingdomId: startKingdom.id,
      startSettlement: settlement,
      year: randInt(610, 980, rng),
      day: randInt(3, 25, rng),
      season: pick(["Springwane","Highsummer","Harvest","Frostfall"], rng),
      rumours: [
        `Caravans have vanished on the old road beyond ${settlement}.`,
        `${startKingdom.rulerTitle} ${startKingdom.ruler.split(" ")[0]} is said to be gathering troops near the border.`,
        `A ruined watchtower in the hills has begun showing lights after midnight.`
      ]
    };
  }

  function createAdventure() {
    const c = JSON.parse(JSON.stringify(draft.character));
    const wConfig = JSON.parse(JSON.stringify(draft.world));
    const raceBonus = RACES[c.race].bonus;
    Object.keys(c.stats).forEach(k => c.stats[k] += raceBonus[k] || 0);

    const bg = BACKGROUNDS[c.background];
    const cls = CLASSES[c.className];
    c.level = 1;
    c.xp = 0;
    c.xpNext = 100;
    c.maxHp = 65 + c.stats.con * 3 + cls.hp;
    c.hp = c.maxHp;
    c.gold = bg.gold;
    c.inventory = [...bg.items];
    c.skills = {
      [bg.skill]: 15,
      [cls.skill]: 10
    };

    const world = createWorld(wConfig);
    const startKingdom = world.kingdoms.find(k => k.id === world.startKingdomId);

    state.character = c;
    state.worldConfig = wConfig;
    state.world = world;
    state.game = {
      location: world.startSettlement,
      kingdomId: world.startKingdomId,
      time: "Morning",
      turn: 1,
      activeNpc: null,
      combat: null,
      mobileTab: "story",
      log: [
        {
          type: "event",
          text: `Year ${world.year}, ${world.day}th day of ${world.season}. ${c.name} begins in <strong>${world.startSettlement}</strong>, a small settlement within the Kingdom of <strong>${startKingdom.name}</strong>.`
        },
        {
          type: "story",
          text: openingText(c, world, startKingdom)
        }
      ],
      recentEvents: ["Adventure begun"]
    };

    state.screen = "worldReview";
    localStorage.removeItem(DRAFT_KEY);
    render();
  }

  function openingText(c, world, kingdom) {
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
    return `${openings[c.background]} You are free to investigate, leave town, seek work, speak to locals or simply choose another path.`;
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
              <p>${k.rulerTitle} ${k.ruler} rules from ${k.capital}. The realm spans ${k.region} and is ${k.trait}.</p>
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
    const c = state.character;
    const g = state.game;
    const w = state.world;
    const k = currentKingdom();
    const hpPct = Math.max(0, Math.round(c.hp / c.maxHp * 100));
    const xpPct = Math.max(0, Math.round(c.xp / c.xpNext * 100));

    const gameClass = g.mobileTab === "character" ? "show-character" : g.mobileTab === "world" ? "show-world" : "";

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
            <div class="character-sub">Level ${c.level} ${c.race} ${c.className}</div>
            <div class="divider"></div>
            <div class="hud-row"><span>HP</span><strong>${c.hp}/${c.maxHp}</strong></div>
            <div class="bar"><span class="hp-fill" style="width:${hpPct}%"></span></div>
            <div class="hud-row"><span>XP</span><strong>${c.xp}/${c.xpNext}</strong></div>
            <div class="bar"><span class="xp-fill" style="width:${xpPct}%"></span></div>
            <div class="hud-row"><span>Gold</span><strong>${c.gold}</strong></div>
            <div class="divider"></div>
            <div class="stat-chip-grid">
              ${Object.entries(STAT_INFO).map(([key,[name]]) => `<div class="stat-chip"><strong>${c.stats[key]}</strong><small>${name.slice(0,3).toUpperCase()}</small></div>`).join("")}
            </div>
          </section>

          <section class="panel hud-card">
            <div class="hud-heading">Inventory</div>
            <div class="inventory-list">
              ${c.inventory.length ? c.inventory.map(item => `<div class="inventory-item"><span>${escapeHtml(item)}</span></div>`).join("") : `<div class="inventory-item"><span>Empty</span></div>`}
            </div>
          </section>
        </aside>

        <section class="panel story-panel">
          <header class="scene-header">
            <div class="eyebrow">${escapeHtml(k.name)}</div>
            <h2>${escapeHtml(g.location)}</h2>
            <div class="scene-meta">Year ${w.year} • ${w.day} ${w.season} • ${g.time} • Turn ${g.turn}</div>
          </header>
          <div class="story-log" id="storyLog">
            ${g.log.slice(-10).map(entry => `<div class="story-entry ${entry.type}">${entry.text}</div>`).join("")}
          </div>
          <div class="choice-area">
            ${renderActionArea()}
          </div>
        </section>

        <aside class="side-stack right-panel">
          <section class="panel hud-card">
            <div class="hud-heading">Current realm</div>
            <h3 style="margin:0 0 5px">${escapeHtml(k.name)}</h3>
            <div class="character-sub">${k.rulerTitle} ${escapeHtml(k.ruler)}</div>
            <div class="divider"></div>
            <div class="hud-row"><span>Capital</span><strong>${escapeHtml(k.capital)}</strong></div>
            <div class="hud-row"><span>Region</span><strong>${titleCase(k.region)}</strong></div>
            <div class="hud-row"><span>Realm strength</span><strong>${k.strength}/100</strong></div>
          </section>

          <section class="panel hud-card">
            <div class="hud-heading">Rumours</div>
            <div class="event-list">
              ${w.rumours.map(r => `<div class="event-item"><span>${escapeHtml(r)}</span></div>`).join("")}
            </div>
          </section>

          <section class="panel hud-card">
            <div class="hud-heading">Recent</div>
            <div class="event-list">
              ${g.recentEvents.slice(-4).reverse().map(e => `<div class="event-item"><span>${escapeHtml(e)}</span></div>`).join("")}
            </div>
          </section>
        </aside>
      </div>
    `;

    document.querySelectorAll("[data-mobiletab]").forEach(btn => {
      btn.addEventListener("click", () => {
        g.mobileTab = btn.dataset.mobiletab;
        renderGame();
      });
    });

    wireGameActions();
  }

  function renderActionArea() {
    const g = state.game;
    if (g.combat) {
      const e = g.combat;
      return `
        <div class="combat-box">
          <h3>${escapeHtml(e.name)} — Lv.${e.level}</h3>
          <div class="hud-row"><span>Enemy HP</span><strong>${e.hp}/${e.maxHp}</strong></div>
          <div class="bar"><span class="hp-fill" style="width:${Math.max(0, e.hp/e.maxHp*100)}%"></span></div>
        </div>
        <div class="choice-grid">
          <button class="choice-button" data-action="combat-attack"><strong>Attack</strong><small>Strike with your equipped weapon.</small></button>
          <button class="choice-button" data-action="combat-power"><strong>Use Technique</strong><small>${escapeHtml(CLASSES[state.character.className].skill)}</small></button>
          <button class="choice-button" data-action="combat-defend"><strong>Defend</strong><small>Reduce the next incoming hit.</small></button>
          <button class="choice-button" data-action="combat-flee"><strong>Flee</strong><small>Attempt to escape the fight.</small></button>
        </div>
      `;
    }

    if (g.activeNpc) {
      const n = g.activeNpc;
      return `
        <div class="combat-box" style="border-color:rgba(117,167,200,.3);background:rgba(117,167,200,.05)">
          <h3>${escapeHtml(n.name)}</h3>
          <div class="character-sub">${escapeHtml(n.occupation)} • ${escapeHtml(n.personality)}</div>
        </div>
        <div class="choice-grid">
          <button class="choice-button" data-action="npc-talk"><strong>Ask about the area</strong><small>Listen for useful information.</small></button>
          <button class="choice-button" data-action="npc-work"><strong>Ask for work</strong><small>See if they know of paid work.</small></button>
          <button class="choice-button" data-action="npc-threaten"><strong>Intimidate</strong><small>Use force of personality.</small></button>
          <button class="choice-button" data-action="npc-leave"><strong>End conversation</strong><small>Return to your surroundings.</small></button>
        </div>
      `;
    }

    return `
      <div class="choice-grid">
        <button class="choice-button" data-action="explore"><strong>Explore</strong><small>Search the local area for people, places or trouble.</small></button>
        <button class="choice-button" data-action="talk"><strong>Speak to someone</strong><small>Meet a procedurally generated local.</small></button>
        <button class="choice-button" data-action="work"><strong>Look for work</strong><small>Find a simple contract for coin and XP.</small></button>
        <button class="choice-button" data-action="travel"><strong>Travel onward</strong><small>Move to another settlement within the realm.</small></button>
        <button class="choice-button" data-action="rest"><strong>Rest</strong><small>Recover health and advance the day.</small></button>
        <button class="choice-button" data-action="rumour"><strong>Follow a rumour</strong><small>Investigate something unusual.</small></button>
      </div>
      <div class="custom-action">
        <input class="input" id="customAction" maxlength="160" placeholder="Or type an action: 'go to the tavern', 'search the woods', 'check inventory'...">
        <button class="secondary-button" id="doCustomAction">Do it</button>
      </div>
    `;
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
    state.game.turn += amount;
    const times = ["Morning","Late Morning","Afternoon","Evening","Night"];
    const idx = times.indexOf(state.game.time);
    if (idx === times.length-1) {
      state.game.time = "Morning";
      state.world.day++;
    } else {
      state.game.time = times[(idx+1) % times.length];
    }
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
    const occupations = ["blacksmith","travelling merchant","town guard","hunter","scribe","innkeeper","hedge mage","farmhand","mercenary","messenger","herbalist","stablemaster"];
    const personalities = ["guarded but fair","cheerful and talkative","sharp-eyed and suspicious","weary but courteous","proud and impatient","soft-spoken and observant","reckless and amused","nervous around strangers"];
    return {
      name: personName(Math.random),
      occupation: pick(occupations),
      personality: pick(personalities),
      relationship: randInt(-10, 18),
      memory: []
    };
  }

  function maybeEncounter() {
    const dangerBonus = state.worldConfig.danger * 0.08;
    const beastsBonus = state.worldConfig.beasts * 0.04;
    if (Math.random() < 0.16 + dangerBonus + beastsBonus) {
      startCombat();
      return true;
    }
    return false;
  }

  function startCombat(forceType=null) {
    const c = state.character;
    const eligible = CREATURES.filter(x => x.level <= Math.max(1, c.level + 1));
    const base = forceType || pick(eligible);
    const scale = 1 + Math.max(0, c.level - base.level) * 0.12;
    state.game.combat = {
      name: base.name,
      level: Math.max(base.level, Math.min(c.level + 1, base.level + randInt(0,1))),
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      dmg: base.dmg,
      xp: Math.round(base.xp * scale),
      gold: base.gold,
      defending: false
    };
    addLog(`A <strong>${base.name}</strong> blocks your path. There is no time for negotiation.`, "event");
    addEvent(`Encountered ${base.name}`);
  }

  function handleGameAction(action) {
    const g = state.game;
    const c = state.character;

    if (action.startsWith("combat-")) {
      combatAction(action);
      return;
    }

    if (action.startsWith("npc-")) {
      npcAction(action);
      return;
    }

    if (action === "explore") {
      advanceTurn();
      if (!maybeEncounter()) {
        const finds = [
          `You follow a narrow lane beyond ${g.location} and discover an overgrown shrine. Someone has recently left fresh candles there.`,
          `You search the edge of town and find wagon tracks leaving the road toward the woods.`,
          `You spend an hour learning the streets, wells and back alleys of ${g.location}. Nothing attacks you, which counts as a success.`,
          `Behind a collapsed stone wall you find a discarded purse containing ${randInt(3,10)} gold.`
        ];
        const result = pick(finds);
        const goldMatch = result.match(/(\d+) gold/);
        if (goldMatch) c.gold += Number(goldMatch[1]);
        addLog(result);
        awardXp(8);
      }
    }

    if (action === "talk") {
      g.activeNpc = generateNpc();
      addLog(`You approach <strong>${g.activeNpc.name}</strong>, a ${g.activeNpc.occupation}. They seem ${g.activeNpc.personality}.`, "event");
      advanceTurn();
    }

    if (action === "work") {
      const pay = randInt(8, 24) + c.level * 2;
      const xp = randInt(12, 28);
      const jobs = [
        `You spend several hours helping escort a merchant cart through the nearby lanes.`,
        `A shopkeeper pays you to recover a missing crate from a flooded ditch outside town.`,
        `The local watch needs an extra pair of hands checking abandoned buildings near the wall.`,
        `You take a short guard contract for a travelling craftsman.`
      ];
      addLog(`${pick(jobs)} The work earns you <strong>${pay} gold</strong> and ${xp} XP.`);
      c.gold += pay;
      awardXp(xp);
      advanceTurn(2);
      addEvent(`Completed local work (+${pay}g)`);
    }

    if (action === "travel") {
      advanceTurn(2);
      if (!maybeEncounter()) {
        const newPlace = settlementName(Math.random);
        addLog(`You leave ${g.location} behind and spend several hours on the road. By ${g.time.toLowerCase()}, the roofs of <strong>${newPlace}</strong> come into view.`);
        g.location = newPlace;
        awardXp(10);
        addEvent(`Travelled to ${newPlace}`);
      }
    }

    if (action === "rest") {
      const recovered = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * .38));
      c.hp += recovered;
      state.world.day += 1;
      g.time = "Morning";
      g.turn += 1;
      addLog(`You find a safe place to sleep. Morning comes with ${recovered > 0 ? `${recovered} HP restored` : "your strength already fully restored"}.`);
      addEvent("Rested for the night");
    }

    if (action === "rumour") {
      advanceTurn();
      addLog(`You begin following one of the local rumours. The trail leads beyond the busiest streets and into a part of ${g.location} where people lower their voices after dark.`);
      if (!maybeEncounter()) {
        const npc = generateNpc();
        g.activeNpc = npc;
        addLog(`<strong>${npc.name}</strong>, a ${npc.occupation}, appears to know more than they first admit.`, "event");
      }
      awardXp(10);
    }

    saveGame(false);
    renderGame();
  }

  function npcAction(action) {
    const g = state.game;
    const c = state.character;
    const n = g.activeNpc;
    if (!n) return;

    if (action === "npc-talk") {
      const lines = [
        `"If you're new here, keep away from the old road after dark. Too many people have gone missing."`,
        `"The crown's tax men passed through yesterday. Means something expensive is happening somewhere."`,
        `"There's work if you don't mind blood. Ask at the inn after sunset."`,
        `"People say the ruined tower is haunted. People say many things. I only know no one who goes there comes back cheerful."`
      ];
      addLog(`${n.name} glances around before speaking. ${pick(lines)}`);
      n.relationship += 2;
      awardXp(4);
    }

    if (action === "npc-work") {
      const pay = randInt(9, 18);
      addLog(`${n.name} thinks for a moment. "I can pay <strong>${pay} gold</strong> if you carry a parcel to the other side of town and don't ask what's in it." You complete the errand without incident.`);
      c.gold += pay;
      n.relationship += 4;
      awardXp(12);
      addEvent(`Helped ${n.name}`);
    }

    if (action === "npc-threaten") {
      const roll = randInt(1,20) + Math.floor((c.stats.cha + c.stats.str) / 5);
      if (roll >= 13) {
        const gold = randInt(3,12);
        addLog(`You lean on the threat without quite drawing a weapon. ${n.name} backs down and hands over ${gold} gold just to end the encounter.`);
        c.gold += gold;
        n.relationship -= 18;
        addEvent(`Intimidated ${n.name}`);
      } else {
        addLog(`${n.name} refuses to be cowed. Nearby locals begin watching. Pushing this further would make trouble.`);
        n.relationship -= 10;
      }
    }

    if (action === "npc-leave") {
      addLog(`You end the conversation with ${n.name} and return your attention to the wider settlement.`);
      g.activeNpc = null;
    }

    advanceTurn();
    saveGame(false);
    renderGame();
  }

  function combatAction(action) {
    const c = state.character;
    const e = state.game.combat;
    if (!e) return;

    let playerDamage = 0;
    let text = "";

    if (action === "combat-attack") {
      playerDamage = randInt(5, 10) + Math.floor(c.stats.str / 3) + c.level;
      e.hp -= playerDamage;
      text = `You attack the ${e.name} for <strong>${playerDamage} damage</strong>.`;
    }

    if (action === "combat-power") {
      const primary = c.className === "Mage" ? c.stats.int : c.className === "Ranger" || c.className === "Rogue" ? c.stats.dex : c.stats.str;
      playerDamage = randInt(8, 14) + Math.floor(primary / 2) + c.level;
      e.hp -= playerDamage;
      text = `You use <strong>${CLASSES[c.className].skill}</strong>, dealing <strong>${playerDamage} damage</strong>.`;
    }

    if (action === "combat-defend") {
      e.defending = true;
      text = `You brace yourself and prepare for the next strike.`;
    }

    if (action === "combat-flee") {
      const chance = .34 + c.stats.dex * .025;
      if (Math.random() < chance) {
        addLog(`You break away from the ${e.name} and escape before it can follow.`);
        addEvent(`Escaped ${e.name}`);
        state.game.combat = null;
        advanceTurn();
        saveGame(false);
        renderGame();
        return;
      }
      text = `You try to flee, but the ${e.name} cuts off your escape.`;
    }

    addLog(text);

    if (e.hp <= 0) {
      const gold = randInt(e.gold[0], e.gold[1]);
      addLog(`The <strong>${e.name}</strong> falls. You gain <strong>${e.xp} XP</strong>${gold ? ` and <strong>${gold} gold</strong>` : ""}.`, "event");
      c.gold += gold;
      awardXp(e.xp);
      addEvent(`Defeated ${e.name}`);
      state.game.combat = null;
      advanceTurn();
      saveGame(false);
      renderGame();
      return;
    }

    let enemyDamage = randInt(e.dmg[0], e.dmg[1]) + Math.floor(e.level / 2);
    if (e.defending) {
      enemyDamage = Math.max(1, Math.floor(enemyDamage * .42));
      e.defending = false;
    }
    c.hp -= enemyDamage;
    addLog(`The ${e.name} hits you for <strong>${enemyDamage} damage</strong>.`);

    if (c.hp <= 0) {
      c.hp = Math.max(1, Math.floor(c.maxHp * .25));
      const lost = Math.min(c.gold, Math.max(2, Math.floor(c.gold * .18)));
      c.gold -= lost;
      state.game.combat = null;
      state.world.day += 1;
      state.game.time = "Morning";
      addLog(`You collapse. Hours later, you wake where a passing traveller dragged you from danger. You have ${c.hp} HP and discover ${lost} gold missing.`, "event");
      addEvent("Defeated in combat");
    }

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
      addLog(`You check your belongings: ${state.character.inventory.map(escapeHtml).join(", ")}. You have ${state.character.gold} gold.`);
    } else if (/\b(rest|sleep|camp)\b/.test(text)) {
      state.character.hp = Math.min(state.character.maxHp, state.character.hp + Math.round(state.character.maxHp * .3));
      state.game.time = "Morning";
      state.world.day++;
      addLog(`You find somewhere reasonably safe and rest until morning.`);
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
      awardXp(8);
    } else if (/\b(talk|speak|ask|person|local|guard|merchant)\b/.test(text)) {
      const npc = generateNpc();
      state.game.activeNpc = npc;
      addLog(`You seek someone out and meet <strong>${npc.name}</strong>, a ${npc.occupation} who seems ${npc.personality}.`);
    } else if (/\b(search|explore|look|investigate|woods|forest|ruin)\b/.test(text)) {
      if (!maybeEncounter()) {
        addLog(`You follow through on your plan. After a careful search, you uncover signs that someone passed through recently: boot prints, ash from a small fire and a strip of dark cloth caught on a thorn.`);
        awardXp(7);
      }
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
