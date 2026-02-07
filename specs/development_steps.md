# Development Steps (v0.1)

## 1) Project Setup
- Choose engine: Babylon.js (recommended) or Three.js.
- Scaffold Vite + TypeScript project structure.
- Define core modules: rendering, input, gameplay systems, dungeon generation, save/load, UI.

## 2) Core Gameplay Loop
- Implement FPS camera with Pointer Lock.
- Add WASD movement, mouse look, basic collision.
- Build player stats model (health, ammo, current weapon).

## 3) Combat MVP
- Implement hitscan weapons (pistol, shotgun, SMG).
- Add enemy HP, damage, death, and despawn.
- Wire score on kill and HUD score display.

## 4) Enemy AI
- Implement 3 enemy types: melee chaser, ranged attacker, tank.
- Basic state machine: idle/patrol → detect → chase/attack.
- Simple navigation suitable for corridors and rooms.

## 5) Procedural Dungeon Generation
- Seeded generator with reproducible runs.
- Room graph with guaranteed Start → Boss path.
- Layout rooms and corridors (non-overlapping, connected).

## 6) Boss Encounter
- Place boss room at farthest node or explicit end of main path.
- Spawn boss on boss-room entry trigger.
- End-of-run conditions for victory/defeat.

## 7) Save/Load
- Snapshot seed, player state, score, cleared rooms.
- Store in IndexedDB (or localStorage for MVP fallback).
- Title screen Continue flow and autosave strategy.

## 8) UX + Menus
- Title screen: New Run / Continue / Settings.
- Pause menu: resume, save (optional), quit.
- HUD: crosshair, health, ammo, weapon, score.

## 9) Polish & Optimization
- Balance enemy stats and weapon tuning.
- Performance pass for 60 FPS target.
- Add basic audio and VFX if time permits.
