原　知安紀, below is a **development specification (v0.1)** for a **web-based 3D FPS “Doom-like” roguelite** that generates a new dungeon every run, awards score for kills, supports saving, and guarantees a boss at the end.

---

## 1. Overview

### 1.1 Purpose
Build a browser-playable 3D FPS game inspired by classic Doom arena flow:
- Fast movement, gun-focused combat
- Procedurally generated dungeon on each run
- Score-based progression (score from kills)
- Save/resume feature
- Boss encounter at the end of each dungeon

### 1.2 Target Platform
- Web browser (desktop first)
- WebGL rendering
- Keyboard + mouse controls (gamepad optional later)

### 1.3 Game Mode
- Single-player (no online multiplayer in this spec)

---

## 2. Core Gameplay Requirements

### 2.1 Player
**Capabilities**
- Move: WASD
- Look: mouse
- Shoot: left click
- Aim mode (optional): right click
- Jump (optional): Space
- Sprint (optional): Shift
- Interact: E (doors, pickups)

**Player Stats**
- Health
- Armor (optional)
- Ammo by weapon type

**Death/Fail Condition**
- Player health reaches 0 → run ends (option to restart with new seed)

### 2.2 Weapons (Gun Use)
**Minimum viable set**
- Pistol (infinite or limited ammo—choose one for MVP)
- Shotgun (spread, slower fire)
- Rifle/SMG (rapid fire)

**Weapon Requirements**
- Hitscan for MVP (raycast)
- Optional projectile weapons later (rockets, plasma)
- Reload can be arcade-style (optional)

### 2.3 Enemies
**Enemy Types (MVP)**
- Melee chaser
- Ranged attacker
- Tank enemy (high HP)

**Enemy Requirements**
- Spawn in rooms based on difficulty scaling
- Simple AI: patrol/idle → detect player → chase/attack
- Navigation: grid-based pathfinding or simple steering in corridors

### 2.4 Scoring (“Score to kill”)
**Rules**
- Each enemy has a score value (e.g., 10 / 25 / 50)
- Boss score bonus (e.g., 500)
- Optional multipliers: time-based, combo-based (not required for MVP)

**UI**
- Visible score counter on HUD
- End-of-run summary: kills, score, time, seed

---

## 3. Procedural Dungeon Requirements

### 3.1 Generation
A new dungeon is generated **every run**.
- Use a **seed** (integer) to make generation reproducible.
- Default seed is random; allow user to input seed (optional but helpful for testing).

### 3.2 Structure & Flow
- Dungeon consists of connected rooms and corridors.
- Must have:
  - Start room (player spawn)
  - Intermediate rooms (combat + pickups)
  - End room (boss arena)
  - Exit/goal after boss (portal/door)

### 3.3 Boss at the End
**Requirement:** “Boss should be located each end of dungeon”
- The generator must place a **Boss Room** that is:
  - Farthest (by graph distance) from the Start room, OR
  - Explicitly marked as the final node in a critical path.
- The boss spawns only when player enters boss room (or after door triggers).

### 3.4 Suggested Generation Algorithm (MVP-friendly)
**Option A (recommended): Room graph + layout**
1. Create a main path graph: Start → … → Boss (length N rooms)
2. Add side rooms branching off (loot/extra fights)
3. Place rooms in 2D plane with simple spacing rules
4. Connect with corridors (L-shaped corridors acceptable)
5. Convert to 3D level geometry

**Constraints**
- Must guarantee connectivity from Start to Boss room
- No overlapping rooms (or allow overlap resolution)
- Corridors wide enough for enemy navigation

---

## 4. Save Feature Requirements

### 4.1 What is Saved (Minimum)
- Dungeon seed
- Player position, rotation
- Player stats (health, ammo, current weapon)
- Current score
- Cleared rooms / enemy states (at minimum: which rooms cleared)
- Time played (optional)

### 4.2 Save/Load UX
- Auto-save at:
  - Room transitions, checkpoint rooms, or every X seconds
- Manual save button in pause menu (optional)
- “Continue” on main menu loads latest save

### 4.3 Storage
**MVP (client-only)**
- Use **IndexedDB** (preferred) or localStorage (too small for future growth)
- Store a JSON snapshot of game state + seed

**Optional (future)**
- Account-based cloud saves via backend (OAuth/email)

---

## 5. UI / UX Requirements

### 5.1 Menus
- Title screen: New Run / Continue / Settings
- Settings: mouse sensitivity, volume, graphics quality
- Pause menu: resume, save (optional), quit to menu

### 5.2 HUD
- Crosshair
- Health
- Ammo
- Current weapon
- Score
- Mini-map (optional; can be later)

---

## 6. Technical Specification (Web App)

### 6.1 Architecture (Recommended)
- **Frontend-only** for MVP (faster iteration), structured as:
  - Rendering layer (WebGL engine)
  - Game loop / ECS-style systems (movement, combat, AI)
  - Procedural generation module
  - Save/load module

### 6.2 Recommended Tech Stack Options
**Option 1 (recommended for FPS in browser): Babylon.js**
- Strong WebGL support, cameras, collisions, asset pipeline, physics integrations
- Good dev speed for 3D games

**Option 2: Three.js**
- More flexible/lower-level; you build more yourself

**Physics**
- Lightweight collisions for MVP (capsule vs AABB, raycasts)
- Optional: Havok (Babylon integration) or Cannon/Ammo (if needed)

**Build Tooling**
- Vite + TypeScript
- ESLint/Prettier
- Asset bundling + lazy loading

### 6.3 Performance Targets
- 60 FPS on mid-range desktop
- Draw-call and geometry budget appropriate for simple “Doom-like” visuals
- Avoid runtime allocations inside the main loop (GC spikes)

### 6.4 Input
- Pointer Lock API for mouse look
- WASD keyboard mapping
- Optional: Gamepad API later

### 6.5 Audio
- Web Audio API
- Positional audio for enemies (optional for MVP)

---

## 7. Data Models (Draft)

### 7.1 Dungeon State
- `seed: number`
- `rooms: Room[]` (id, type: start/normal/boss, connections, cleared flag)
- `entities: EntityState[]` (optional depending on how you track enemies)
- `bossDefeated: boolean`

### 7.2 Player Save State
- `position: {x,y,z}`, `rotation: {yaw,pitch}`
- `health`, `ammoByType`, `currentWeaponId`
- `score`
- `elapsedTime`

---

## 8. Acceptance Criteria (MVP)
1. User can start a new run and a dungeon is generated randomly.
2. Player can move, look, and shoot guns; enemies take damage and die.
3. Killing enemies increases score; score shown on HUD.
4. There is always a boss room at the end; boss spawns and can be defeated.
5. Save + resume works (close tab → reopen → Continue brings player back).
6. Run ends when player dies or boss is defeated (define win screen).

---

## 9. Milestones / Roadmap

### Milestone 1: Prototype (1–2 weeks)
- FPS camera + pointer lock
- Basic shooting (hitscan)
- One enemy type with simple chase AI
- Simple “box rooms” hand-authored

### Milestone 2: Procedural Dungeon (1–2 weeks)
- Seeded generation
- Start → boss path guaranteed
- Basic level geometry generation

### Milestone 3: Boss + Scoring (1 week)
- Boss arena and boss AI
- Score system + end-of-run summary

### Milestone 4: Save/Load (1 week)
- IndexedDB save snapshots
- Continue flow + basic checkpointing

### Milestone 5: Polish (ongoing)
- More weapons/enemies
- Better lighting/VFX/audio
- Difficulty scaling, pickups, UI improvements

---

## 10. Clarifications Needed (to finalize spec)
Answering these will tighten the design and avoid rework:
1. **Single-player only**, right?
2. Should save persist **per run** (continue the same dungeon) or be a **meta-progression** save (unlock weapons across runs)?
3. Prefer **hitscan** (Doom-like) or projectile weapons too?
4. Any target art style: retro low-poly, pixelated, modern PBR?
5. Dungeon size expectations: ~10 rooms/run or larger?

If you reply with your choices, I can produce a **v0.2 spec** with concrete numbers (room count ranges, enemy stats, scoring table, save schema, and a more detailed module breakdown).