import { math } from './code/math.js';
import { spatialGrid } from './code/spatialGrid.js';
import { renderManager } from './code/renderManager.js';

const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

canvas.style.background = "#222";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const grid = new spatialGrid([50, 50]);

const renderer = new renderManager([1000, 1000]);

let nodes = new Set();

let circleCount = 0;

const circleCountDisplay = document.getElementById("pointsVar");

let camera = { x: 0, y: 0, zoom: 1 };

let mouseStartPos = { x: null, y: null };

let isUpdating = false;

// Simulation variables
let maxAge = 8;
let simSpeed = 3;
let minDistance = 20;
let maxProduce = 2;
let spawnRange = [-40, 40, -40, -8];
let mutation = 0.04;

// Interactions
document.getElementById("reset").onclick = reset;
document.getElementById("backward").onclick = reset;
document.getElementById("play").onclick = play;
document.getElementById("forward").onclick = () => { update(1000) };

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

canvas.addEventListener("mousedown", (event) => {
  mouseStartPos.x = event.clientX;
  mouseStartPos.y = event.clientY;
});

window.addEventListener("mousemove", (event) => {
  if (mouseStartPos.x != null) {
    camera.x += (mouseStartPos.x - event.clientX) * (1 / camera.zoom);
    camera.y += (mouseStartPos.y - event.clientY) * (1 / camera.zoom);
    mouseStartPos.x = event.clientX;
    mouseStartPos.y = event.clientY;
  }
});

window.addEventListener("mouseup", (event) => {
  if (mouseStartPos.x != null) {
    camera.x += (mouseStartPos.x - event.clientX) * (1 / camera.zoom);
    camera.y += (mouseStartPos.y - event.clientY) * (1 / camera.zoom);
    mouseStartPos.x = null;
    mouseStartPos.y = null;
  }
});

canvas.addEventListener("touchstart", (event) => {
  mouseStartPos.x = event.changedTouches[0].clientX;
  mouseStartPos.y = event.changedTouches[0].clientY;
});

window.addEventListener("touchmove", (event) => {
  if (mouseStartPos.x != null) {
    camera.x += (mouseStartPos.x - event.changedTouches[0].clientX) * (1 / camera.zoom);
    camera.y += (mouseStartPos.y - event.changedTouches[0].clientY) * (1 / camera.zoom);
    mouseStartPos.x = event.changedTouches[0].clientX;
    mouseStartPos.y = event.changedTouches[0].clientY;
  }
});

window.addEventListener("touchend", (event) => {
  if (mouseStartPos.x != null) {
    camera.x += (mouseStartPos.x - event.changedTouches[0].clientX) * (1 / camera.zoom);
    camera.y += (mouseStartPos.y - event.changedTouches[0].clientY) * (1 / camera.zoom);
    mouseStartPos.x = null;
    mouseStartPos.y = null;
  }
});

window.addEventListener('mouseleave', (event) => {
  if (mouseStartPos.x != null) {
    camera.x += (mouseStartPos.x - event.clientX) * (1 / camera.zoom);
    camera.y += (mouseStartPos.y - event.clientY) * (1 / camera.zoom);
    mouseStartPos.x = null;
    mouseStartPos.y = null;
  }
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();

  const abs = Math.abs(event.deltaY);
  const norm = event.deltaY / abs;

  if (abs > 50) {
    camera.zoom *= 1 + event.deltaY * -0.002;
  } else if (abs > 0) {
    camera.zoom *= 1 + event.deltaY * -0.02;
  }

  camera.zoom = math.clamp(camera.zoom, 0.001, 1000);
});

// Helper functions
function veiwTransform(xpos, ypos) {
  return [(xpos - camera.x - canvas.width / 2) * camera.zoom + canvas.width / 2, (ypos - camera.y - canvas.height / 2) * camera.zoom + canvas.height / 2];
}

function createNode(xpos, ypos, pxpos, pypos, color) {
  grid.newClient([xpos, ypos], [minDistance, minDistance]);
  const node = new Node(xpos, ypos, color);
  nodes.add(node);
  renderer.addNode(xpos, ypos, pxpos, pypos, hslToHex(color[0] * 360, 100, color[1] * 100), 5);

  circleCount++;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  const r = f(0);
  const g = f(8);
  const b = f(4);

  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function reset() {
  nodes = new Set();
  grid.removeAll();
  renderer.removeAll();

  circleCount = 0;
  circleCountDisplay.innerText = 1;

  createNode(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, [Math.random(), math.randrange(0.4, 0.8)]);
  camera = { x: 0, y: 0, zoom: 1 };
  pause();
}

function play() {
  const button = document.getElementById("play");
  isUpdating = true;
  button.style.backgroundImage = "url(assets/pause.svg)";
  button.onclick = pause;
  button.title = "Pause";
}

function pause() {
  const button = document.getElementById("play");
  isUpdating = false;
  button.style.backgroundImage = "url(assets/play.svg)";
  button.onclick = play;
  button.title = "Play";
}

// Sliders
function setupSliders() {
  const sliderVars = [
    "simSpeed",
    "maxProduce",
    "minDistance",
    "maxAge",
    "mutation",
  ];
  sliderVars.forEach((sliderVar) => {
    const element = document.getElementById(sliderVar);
    document.getElementById(sliderVar + "Var").innerText = element.value;
    element.style.setProperty('--value', math.map(element.value, element.min, element.max) * 100 + "%");
  });
}
setupSliders();

document.getElementById("simSpeed").addEventListener("input", event => {
  simSpeed = event.target.value;
  document.getElementById(event.target.id + "Var").innerText = event.target.value;
  event.target.style.setProperty('--value', math.map(event.target.value, event.target.min, event.target.max) * 100 + "%");
});

document.getElementById("maxProduce").addEventListener("input", event => {
  maxProduce = event.target.value;
  document.getElementById(event.target.id + "Var").innerText = event.target.value;
  event.target.style.setProperty('--value', math.map(event.target.value, event.target.min, event.target.max) * 100 + "%");
});

document.getElementById("minDistance").addEventListener("input", event => {
  minDistance = event.target.value;
  document.getElementById(event.target.id + "Var").innerText = event.target.value;
  event.target.style.setProperty('--value', math.map(event.target.value, event.target.min, event.target.max) * 100 + "%");
});

document.getElementById("maxAge").addEventListener("input", event => {
  maxAge = event.target.value;
  document.getElementById(event.target.id + "Var").innerText = event.target.value;
  event.target.style.setProperty('--value', math.map(event.target.value, event.target.min, event.target.max) * 100 + "%");
});

document.getElementById("mutation").addEventListener("input", event => {
  mutation = event.target.value;
  document.getElementById(event.target.id + "Var").innerText = event.target.value;
  event.target.style.setProperty('--value', math.map(event.target.value, event.target.min, event.target.max) * 100 + "%");
});

// Simulation code
class Node {
  constructor(xpos, ypos, color) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.age = 0;
    this.produced = 0;
    this.dead = false;
    this.color = color;
    this.timer = math.randrange(-1000, 0);
  }
  update(deltaTime) {
    this.timer += deltaTime;
    this.age += deltaTime / 1000;

    while (this.timer > 1000 && !this.dead) {
      this.timer -= 1000;
      const xpos = this.xpos + math.randrange(spawnRange[0], spawnRange[1]);
      const ypos = this.ypos + math.randrange(spawnRange[2], spawnRange[3]);

      const minDistanceSqr = minDistance * minDistance;
      const isNearCircle = grid.isNear([xpos, ypos], [minDistance, minDistance], (position) => {
        return math.getsqrdist(xpos, ypos, position[0], position[1]) < minDistanceSqr;
      });

      if (!isNearCircle) {
        const color = [
          math.wrap(this.color[0] + math.randrange(-mutation / 2, mutation / 2), 0, 1),
          math.pingpong(this.color[1] + math.randrange(-mutation / 2, mutation / 2), 0, 1)
        ];
        createNode(xpos, ypos, this.xpos, this.ypos, color);
        this.produced++;
      }

      if (this.produced >= maxProduce) {
        this.dead = true;
      }
    }
    if (this.age >= maxAge && maxAge != 0) {
      this.dead = true;
    }
  }
}

reset();

function update(deltaTime) {
  for (const node of nodes) {
    node.update(deltaTime);
    if (node.dead) {
      nodes.delete(node);
    }
  }

  circleCountDisplay.innerText = circleCount;
}

let lastTime = 0;
function loop(timeStamp) {
  let deltaTime = Math.min(timeStamp - lastTime, 100); // limit deltatime to 100 to avoid lag
  lastTime = timeStamp;

  renderer.render(canvas, ctx, camera);

  if (isUpdating) {
    for (let i = 0; i < simSpeed; i++) {
      update(deltaTime);
    }
  }

  requestAnimationFrame(loop);
}

loop(0);