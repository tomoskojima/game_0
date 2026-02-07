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

const targetMaterial = new StandardMaterial("target-mat", scene);
targetMaterial.diffuseColor = new Color3(0.7, 0.15, 0.15);

const roomSize = 20;
const wallHeight = 4;
const wallThickness = 0.5;

const floor = MeshBuilder.CreateGround("floor", { width: roomSize, height: roomSize }, scene);
floor.checkCollisions = true;
floor.material = floorMaterial;

const walls: Mesh[] = [];
const wallOptions = { width: roomSize, height: wallHeight, depth: wallThickness };

const northWall = MeshBuilder.CreateBox("north-wall", wallOptions, scene);
northWall.position = new Vector3(0, wallHeight / 2, roomSize / 2);
walls.push(northWall);

const southWall = MeshBuilder.CreateBox("south-wall", wallOptions, scene);
southWall.position = new Vector3(0, wallHeight / 2, -roomSize / 2);
walls.push(southWall);

const eastWall = MeshBuilder.CreateBox(
  "east-wall",
  { width: wallThickness, height: wallHeight, depth: roomSize },
  scene,
);
eastWall.position = new Vector3(roomSize / 2, wallHeight / 2, 0);
walls.push(eastWall);

const westWall = MeshBuilder.CreateBox(
  "west-wall",
  { width: wallThickness, height: wallHeight, depth: roomSize },
  scene,
);
westWall.position = new Vector3(-roomSize / 2, wallHeight / 2, 0);
walls.push(westWall);

for (const wall of walls) {
  wall.checkCollisions = true;
  wall.material = wallMaterial;
}

const targets: Mesh[] = [];
const createTarget = (id: number, position: Vector3) => {
  const target = MeshBuilder.CreateBox(`target-${id}`, { size: 1.2 }, scene);
  target.position = new Vector3(position.x, 0.6, position.z);
  target.material = targetMaterial;
  target.metadata = { isTarget: true, health: 30 };
  targets.push(target);
};

createTarget(1, new Vector3(2, 0, 4));
createTarget(2, new Vector3(-3, 0, 1));
createTarget(3, new Vector3(4, 0, -2));

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
  const pick = scene.pickWithRay(ray, (mesh) => Boolean(mesh.metadata?.isTarget));
  if (!pick?.hit || !pick.pickedMesh) {
    return;
  }
  const picked = pick.pickedMesh as Mesh;
  const metadata = picked.metadata as { health: number } | undefined;
  if (!metadata) {
    return;
  }
  metadata.health -= 10;
  if (metadata.health <= 0) {
    const index = targets.indexOf(picked);
    if (index >= 0) {
      targets.splice(index, 1);
    }
    picked.dispose();
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
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
