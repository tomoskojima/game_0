import {
  Color3,
  Engine,
  HemisphericLight,
  KeyboardEventTypes,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import "./style.css";

type EnemyType = "melee" | "ranged" | "tank";

type Enemy = {
  mesh: Mesh;
  type: EnemyType;
  health: number;
  speed: number;
  attackRange: number;
  attackCooldownMs: number;
  lastAttackTime: number;
  damage: number;
  preferredDistance?: number;
  baseY: number;
};

type Room = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Dungeon = {
  grid: boolean[][];
  rooms: Room[];
  gridWidth: number;
  gridHeight: number;
};

const createRng = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const randomInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const gridToWorld = (
  x: number,
  y: number,
  tileSize: number,
  gridWidth: number,
  gridHeight: number,
) =>
  new Vector3(
    (x - gridWidth / 2) * tileSize + tileSize / 2,
    0,
    (y - gridHeight / 2) * tileSize + tileSize / 2,
  );

const getRoomCenter = (room: Room) => ({
  x: Math.floor(room.x + room.width / 2),
  y: Math.floor(room.y + room.height / 2),
});

const isOverlapping = (a: Room, b: Room, padding: number) =>
  a.x - padding < b.x + b.width + padding &&
  a.x + a.width + padding > b.x - padding &&
  a.y - padding < b.y + b.height + padding &&
  a.y + a.height + padding > b.y - padding;

const generateDungeon = (rng: () => number): Dungeon => {
  const gridWidth = 48;
  const gridHeight = 48;
  const grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));
  const rooms: Room[] = [];
  const roomCount = 7;
  const maxAttempts = 200;

  const setWalkable = (x: number, y: number) => {
    if (y < 0 || y >= gridHeight || x < 0 || x >= gridWidth) {
      return;
    }
    grid[y][x] = true;
  };

  const carveRoom = (room: Room) => {
    for (let y = room.y; y < room.y + room.height; y += 1) {
      for (let x = room.x; x < room.x + room.width; x += 1) {
        setWalkable(x, y);
      }
    }
  };

  for (let attempt = 0; attempt < maxAttempts && rooms.length < roomCount; attempt += 1) {
    const width = randomInt(rng, 6, 10);
    const height = randomInt(rng, 6, 10);
    const x = randomInt(rng, 1, gridWidth - width - 1);
    const y = randomInt(rng, 1, gridHeight - height - 1);
    const room: Room = { x, y, width, height };
    if (rooms.some((existing) => isOverlapping(existing, room, 1))) {
      continue;
    }
    rooms.push(room);
    carveRoom(room);
  }

  if (rooms.length === 0) {
    const fallback: Room = {
      x: Math.floor(gridWidth / 2) - 4,
      y: Math.floor(gridHeight / 2) - 4,
      width: 8,
      height: 8,
    };
    rooms.push(fallback);
    carveRoom(fallback);
  }

  const carveCorridor = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const width = 2;
    const carveAt = (x: number, y: number) => {
      for (let dy = 0; dy < width; dy += 1) {
        for (let dx = 0; dx < width; dx += 1) {
          setWalkable(x + dx, y + dy);
        }
      }
    };

    const carveHorizontal = (y: number, x1: number, x2: number) => {
      const from = Math.min(x1, x2);
      const to = Math.max(x1, x2);
      for (let x = from; x <= to; x += 1) {
        carveAt(x, y);
      }
    };

    const carveVertical = (x: number, y1: number, y2: number) => {
      const from = Math.min(y1, y2);
      const to = Math.max(y1, y2);
      for (let y = from; y <= to; y += 1) {
        carveAt(x, y);
      }
    };

    if (rng() < 0.5) {
      carveHorizontal(start.y, start.x, end.x);
      carveVertical(end.x, start.y, end.y);
    } else {
      carveVertical(start.x, start.y, end.y);
      carveHorizontal(end.y, start.x, end.x);
    }
  };

  for (let i = 1; i < rooms.length; i += 1) {
    const start = getRoomCenter(rooms[i - 1]);
    const end = getRoomCenter(rooms[i]);
    carveCorridor(start, end);
  }

  return { grid, rooms, gridWidth, gridHeight };
};

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element not found");
}

const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.collisionsEnabled = true;
scene.gravity = new Vector3(0, -9.81, 0);

const camera = new UniversalCamera("player-camera", new Vector3(0, 1.6, -6), scene);
camera.attachControl(canvas, true);
camera.setTarget(new Vector3(0, 1.6, 0));
camera.minZ = 0.1;
camera.speed = 0.35;
camera.angularSensibility = 4000;
camera.applyGravity = true;
camera.checkCollisions = true;
camera.ellipsoid = new Vector3(0.4, 0.9, 0.4);
camera.keysUp = [87];
camera.keysDown = [83];
camera.keysLeft = [65];
camera.keysRight = [68];

const light = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), scene);
light.intensity = 0.9;

const floorMaterial = new StandardMaterial("floor-mat", scene);
floorMaterial.diffuseColor = new Color3(0.15, 0.15, 0.18);

const wallMaterial = new StandardMaterial("wall-mat", scene);
wallMaterial.diffuseColor = new Color3(0.2, 0.2, 0.25);

const enemyMaterials: Record<EnemyType, StandardMaterial> = {
  melee: new StandardMaterial("enemy-melee", scene),
  ranged: new StandardMaterial("enemy-ranged", scene),
  tank: new StandardMaterial("enemy-tank", scene),
};
enemyMaterials.melee.diffuseColor = new Color3(0.75, 0.2, 0.2);
enemyMaterials.ranged.diffuseColor = new Color3(0.2, 0.45, 0.8);
enemyMaterials.tank.diffuseColor = new Color3(0.2, 0.7, 0.35);

const tileSize = 2;
const wallHeight = 4;
const wallThickness = 0.4;
const floorHeight = 0.2;

const seedParam = new URLSearchParams(window.location.search).get("seed");
const parsedSeed = seedParam ? Number.parseInt(seedParam, 10) : Number.NaN;
const seed = Number.isFinite(parsedSeed) ? parsedSeed : Math.floor(Math.random() * 1_000_000_000);
const rng = createRng(seed);

const { grid, rooms, gridWidth, gridHeight } = generateDungeon(rng);

const isWalkable = (x: number, y: number) => grid[y]?.[x] ?? false;
const createWall = (name: string, position: Vector3, width: number, depth: number) => {
  const wall = MeshBuilder.CreateBox(name, { width, height: wallHeight, depth }, scene);
  wall.position = position;
  wall.checkCollisions = true;
  wall.material = wallMaterial;
};

for (let y = 0; y < gridHeight; y += 1) {
  for (let x = 0; x < gridWidth; x += 1) {
    if (!grid[y][x]) {
      continue;
    }
    const world = gridToWorld(x, y, tileSize, gridWidth, gridHeight);
    const floorTile = MeshBuilder.CreateBox(
      `floor-${x}-${y}`,
      { width: tileSize, height: floorHeight, depth: tileSize },
      scene,
    );
    floorTile.position = new Vector3(world.x, -floorHeight / 2, world.z);
    floorTile.checkCollisions = true;
    floorTile.material = floorMaterial;

    if (!isWalkable(x, y + 1)) {
      createWall(
        `wall-n-${x}-${y}`,
        new Vector3(world.x, wallHeight / 2, world.z + tileSize / 2),
        tileSize,
        wallThickness,
      );
    }
    if (!isWalkable(x, y - 1)) {
      createWall(
        `wall-s-${x}-${y}`,
        new Vector3(world.x, wallHeight / 2, world.z - tileSize / 2),
        tileSize,
        wallThickness,
      );
    }
    if (!isWalkable(x + 1, y)) {
      createWall(
        `wall-e-${x}-${y}`,
        new Vector3(world.x + tileSize / 2, wallHeight / 2, world.z),
        wallThickness,
        tileSize,
      );
    }
    if (!isWalkable(x - 1, y)) {
      createWall(
        `wall-w-${x}-${y}`,
        new Vector3(world.x - tileSize / 2, wallHeight / 2, world.z),
        wallThickness,
        tileSize,
      );
    }
  }
}

const startRoom = rooms[0];
const startCell = startRoom ? getRoomCenter(startRoom) : { x: 0, y: 0 };
const startWorld = gridToWorld(startCell.x, startCell.y, tileSize, gridWidth, gridHeight);
camera.position = new Vector3(startWorld.x, 1.6, startWorld.z);
camera.setTarget(new Vector3(startWorld.x, 1.6, startWorld.z + 1));

const healthDisplay = document.getElementById("health") as HTMLDivElement | null;
const scoreDisplay = document.getElementById("score") as HTMLDivElement | null;
const player = {
  health: 100,
  maxHealth: 100,
  score: 0,
};

const updateHealthUI = () => {
  if (healthDisplay) {
    healthDisplay.textContent = `Health: ${Math.ceil(player.health)}/${player.maxHealth}`;
  }
};

const updateScoreUI = () => {
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${player.score}`;
  }
};

const applyDamage = (amount: number) => {
  if (player.health <= 0) {
    return;
  }
  player.health = Math.max(0, player.health - amount);
  updateHealthUI();
};

const enemyStats: Record<
  EnemyType,
  {
    health: number;
    speed: number;
    attackRange: number;
    attackCooldownMs: number;
    damage: number;
    preferredDistance?: number;
    score: number;
  }
> = {
  melee: {
    health: 30,
    speed: 2.2,
    attackRange: 1.2,
    attackCooldownMs: 800,
    damage: 6,
    score: 10,
  },
  ranged: {
    health: 25,
    speed: 1.8,
    attackRange: 6,
    attackCooldownMs: 1200,
    damage: 4,
    preferredDistance: 5,
    score: 25,
  },
  tank: {
    health: 60,
    speed: 1.2,
    attackRange: 1.5,
    attackCooldownMs: 1200,
    damage: 10,
    score: 50,
  },
};

const enemies: Enemy[] = [];
const enemyByMesh = new Map<Mesh, Enemy>();

const spawnEnemy = (type: EnemyType, position: Vector3) => {
  const size = type === "tank" ? 1.8 : type === "ranged" ? 1.1 : 1.2;
  const baseY = size / 2;
  const mesh = MeshBuilder.CreateBox(`enemy-${type}-${enemies.length}`, { size }, scene);
  mesh.position = new Vector3(position.x, baseY, position.z);
  mesh.material = enemyMaterials[type];
  mesh.checkCollisions = true;
  mesh.ellipsoid = new Vector3(size * 0.35, size * 0.5, size * 0.35);
  mesh.metadata = { isEnemy: true };

  const stats = enemyStats[type];
  const enemy: Enemy = {
    mesh,
    type,
    health: stats.health,
    speed: stats.speed,
    attackRange: stats.attackRange,
    attackCooldownMs: stats.attackCooldownMs,
    lastAttackTime: 0,
    damage: stats.damage,
    preferredDistance: stats.preferredDistance,
    baseY,
  };
  enemies.push(enemy);
  enemyByMesh.set(mesh, enemy);
};

const randomPointInRoom = (room: Room) => {
  const margin = 1;
  const minX = room.x + margin;
  const maxX = room.x + room.width - margin - 1;
  const minY = room.y + margin;
  const maxY = room.y + room.height - margin - 1;
  const cellX = minX <= maxX ? randomInt(rng, minX, maxX) : Math.floor(room.x + room.width / 2);
  const cellY = minY <= maxY ? randomInt(rng, minY, maxY) : Math.floor(room.y + room.height / 2);
  return gridToWorld(cellX, cellY, tileSize, gridWidth, gridHeight);
};

const spawnEnemiesInRooms = () => {
  const enemyTypes: EnemyType[] = ["melee", "ranged", "tank"];
  const minSpawnDistanceSq = 36;
  for (let i = 1; i < rooms.length; i += 1) {
    const room = rooms[i];
    const type = enemyTypes[i % enemyTypes.length];
    let spawn: Vector3 | null = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = randomPointInRoom(room);
      if (Vector3.DistanceSquared(candidate, startWorld) >= minSpawnDistanceSq) {
        spawn = candidate;
        break;
      }
    }
    if (spawn) {
      spawnEnemy(type, spawn);
    }
  }
};

spawnEnemiesInRooms();
updateHealthUI();
updateScoreUI();

const ammoDisplay = document.getElementById("ammo") as HTMLDivElement | null;
const weapon = {
  clipSize: 12,
  ammoInClip: 12,
  ammoReserve: 36,
  fireCooldownMs: 180,
};
let lastShotTime = 0;

const updateAmmoUI = () => {
  if (ammoDisplay) {
    ammoDisplay.textContent = `Ammo: ${weapon.ammoInClip}/${weapon.ammoReserve}`;
  }
};

const reload = () => {
  const needed = weapon.clipSize - weapon.ammoInClip;
  if (needed <= 0 || weapon.ammoReserve <= 0) {
    return;
  }
  const transfer = Math.min(needed, weapon.ammoReserve);
  weapon.ammoReserve -= transfer;
  weapon.ammoInClip += transfer;
  updateAmmoUI();
};

const fire = () => {
  const now = performance.now();
  if (now - lastShotTime < weapon.fireCooldownMs) {
    return;
  }
  if (weapon.ammoInClip <= 0) {
    return;
  }
  lastShotTime = now;
  weapon.ammoInClip -= 1;
  updateAmmoUI();

  const ray = camera.getForwardRay(100);
  const pick = scene.pickWithRay(ray, (mesh) => enemyByMesh.has(mesh as Mesh));
  if (!pick?.hit || !pick.pickedMesh) {
    return;
  }
  const picked = pick.pickedMesh as Mesh;
  const enemy = enemyByMesh.get(picked);
  if (!enemy) {
    return;
  }
  enemy.health -= 10;
  if (enemy.health <= 0) {
    player.score += enemyStats[enemy.type].score;
    updateScoreUI();
    enemyByMesh.delete(enemy.mesh);
    const index = enemies.indexOf(enemy);
    if (index >= 0) {
      enemies.splice(index, 1);
    }
    enemy.mesh.dispose();
  }
};

const updateEnemies = (deltaSeconds: number) => {
  if (enemies.length === 0) {
    return;
  }
  const now = performance.now();
  const playerPos = camera.position;
  for (const enemy of enemies) {
    const enemyPos = enemy.mesh.position;
    const toPlayer = new Vector3(playerPos.x - enemyPos.x, 0, playerPos.z - enemyPos.z);
    const distance = toPlayer.length();
    let moveDir = Vector3.Zero();

    if (distance > 0.001) {
      if (enemy.type === "ranged") {
        const preferred = enemy.preferredDistance ?? enemy.attackRange;
        if (distance > preferred + 0.5) {
          moveDir = toPlayer;
        } else if (distance < preferred - 0.5) {
          moveDir = toPlayer.scale(-1);
        }
      } else if (distance > enemy.attackRange) {
        moveDir = toPlayer;
      }
    }

    if (moveDir.lengthSquared() > 0.0001) {
      moveDir.normalize();
      enemy.mesh.moveWithCollisions(moveDir.scale(enemy.speed * deltaSeconds));
    }
    enemy.mesh.position.y = enemy.baseY;

    if (
      player.health > 0 &&
      distance <= enemy.attackRange &&
      now - enemy.lastAttackTime >= enemy.attackCooldownMs
    ) {
      enemy.lastAttackTime = now;
      applyDamage(enemy.damage);
    }
  }
};

scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
    return;
  }
  const event = pointerInfo.event as PointerEvent;
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
  if (event.button === 0) {
    fire();
  }
});

scene.onKeyboardObservable.add((kbInfo) => {
  if (kbInfo.type !== KeyboardEventTypes.KEYDOWN) {
    return;
  }
  if (kbInfo.event.code === "KeyR") {
    reload();
  }
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

updateAmmoUI();

engine.runRenderLoop(() => {
  const deltaSeconds = engine.getDeltaTime() / 1000;
  updateEnemies(deltaSeconds);
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
