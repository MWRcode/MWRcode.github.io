// Variables
const [width, height] = [100, 100];

const pixelSize = 64;

let sources = [];

const pixels = new Map();

let nextSourceID = 0;

const arrowMovementSpeed = 1.8;

const useTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

// Setup
const canvas = document.getElementById("canvas");

canvas.style.backgroundColor = "#808080";

const ctx = canvas.getContext("2d");

canvas.width = width * pixelSize;
canvas.height = height * pixelSize;

let camOffset = { x: 0, y: 0 };
let mouseStartPos = { x: null, y: null };

let buttons;
if (!useTouch) {
  document.querySelectorAll("#controls button").forEach(element => {
    element.remove();
  });
} else {
  buttons = { up: document.getElementById("up"), down: document.getElementById("down"), left: document.getElementById("left"), right: document.getElementById("right") };
}

let drawing = false;

let input = { "up": false, "down": false, "left": false, "right": false };

// Helper functions
function getDistance(xpos1, ypos1, xpos2, ypos2) {
  return Math.sqrt((xpos1 - xpos2) ** 2 + (ypos1 - ypos2) ** 2);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

function isArrayEqual(arr1, arr2) {
  if (arr1.length != arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i]) {
      return false;
    }
  }
  return true;
}

function lerpArray(arr1, arr2, t) {
  if (arr1.length != arr2.length) {
    return NaN;
  }

  let arr = [];

  for (let i = 0; i < arr1.length; i++) {
    arr.push(lerp(arr1[i], arr2[i], t));
  }
  return arr;
}

function hsl2rgb(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  const r = f(0);
  const g = f(8);
  const b = f(4);

  return [r, g, b, 255];
}

function wrap(n, min, max) {
  const range = max - min;
  return ((((n - min) % range) + range) % range) + min;
}

// event listeners
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

window.addEventListener("resize", function () {
  camOffset.x = clamp(camOffset.x, 0, 2008 - window.innerWidth);
  camOffset.y = clamp(camOffset.y, 0, 2008 - window.innerHeight);
});

canvas.addEventListener("mousedown", (event) => {
  if (event.button == 1) {
    mouseStartPos.x = event.clientX;
    mouseStartPos.y = event.clientY;
  } else if (event.button == 0) {
    drawing = true;
    drawAt([event.clientX, event.clientY]);
  }
  console.log("hue:", getHue(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)), "ID:", getID(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)));
});

canvas.addEventListener("mouseup", (event) => {
  if (event.button == 1 & mouseStartPos.x != null) {
    camOffset.x += mouseStartPos.x - event.clientX;
    camOffset.y += mouseStartPos.y - event.clientY;
    mouseStartPos.x = null;
    mouseStartPos.y = null;
  } else if (drawing) {
    drawAt([event.clientX, event.clientY]);
    drawing = false;
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (mouseStartPos.x != null) {
    camOffset.x += mouseStartPos.x - event.clientX;
    camOffset.y += mouseStartPos.y - event.clientY;
    mouseStartPos.x = event.clientX;
    mouseStartPos.y = event.clientY;
  } else if (drawing) {
    drawAt([event.clientX, event.clientY]);
  }

  // console.log(getHue(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)), getID(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)));
});

document.addEventListener('mouseleave', () => {
  mouseStartPos.x = null;
  mouseStartPos.y = null;
  drawing = false;
});

canvas.addEventListener("touchstart", (event) => {
  drawing = true;
  drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY]);
});

canvas.addEventListener("touchend", (event) => {
  if (drawing) {
    drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY]);
    drawing = false;
  }
});

canvas.addEventListener("touchmove", (event) => {
  if (drawing) {
    drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY]);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key == "ArrowUp") {
    input.up = true;
  }
  if (event.key == "ArrowDown") {
    input.down = true;
  }
  if (event.key == "ArrowLeft") {
    input.left = true;
  }
  if (event.key == "ArrowRight") {
    input.right = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key == "ArrowUp") {
    input.up = false;
  }
  if (event.key == "ArrowDown") {
    input.down = false;
  }
  if (event.key == "ArrowLeft") {
    input.left = false;
  }
  if (event.key == "ArrowRight") {
    input.right = false;
  }
});

if (useTouch) {
  for (const direction of ["up", "down", "left", "right"]) {
    for (const event of ["touchstart", "mousedown"]) {
      buttons[direction].addEventListener(event, () => {
        input[direction] = true;
      });
    }
    for (const event of ["touchend", "mouseup", "mouseleave"]) {
      buttons[direction].addEventListener(event, () => {
        input[direction] = false;
      });
    }
    buttons[direction].addEventListener("touchmove", (e) => {
      const rect = e.target.getBoundingClientRect();
      const pos = [e.touches[0].clientX, e.touches[0].clientY];
      
      input[direction] = pos[0] >= rect.x && pos[1] >= rect.y && pos[0] <= rect.right && pos[1] <= rect.bottom;
    });
  }
}

// classes and functions
class QueueElement {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class Queue {
  constructor() {
    this.front = null;
    this.rear = null;
    this.size = 0;
  }
  enqueue(data) {
    const newElement = new QueueElement(data);
    if (this.isEmpty()) {
      this.front = newElement;
      this.rear = newElement;
    } else {
      this.rear.next = newElement;
      this.rear = newElement;
    }
    this.size++;
  }
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    const removedElement = this.front;
    this.front = this.front.next;
    if (this.front === null) {
      this.rear = null;
    }
    this.size--;
    return removedElement.data;
  }
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.front.data;
  }
  isEmpty() {
    return this.size === 0;
  }
  getSize() {
    return this.size;
  }
  print() {
    if (this.size > 0) {
      let current = this.front;
      const elements = [];
      while (current) {
        elements.push(JSON.stringify(current.data));
        current = current.next;
      }
      console.log(elements.join(' -> '));
    }
  }
}

class Source {
  constructor(pos, id, hue) {
    this.pos = pos;
    this.hue = hue;
    this.color = hsl2rgb(hue, 100, 50);
    this.id = id;
  }
  produceFlow() {
    let offsetpos;
    let pos = this.pos;
    let pass = false;
    let visited = new Set();
    let forks = new Queue();
    let offsetedPositons = [];
    let color = darkenColor(this.color);
    let hue = this.hue;
    let id = new Set([this.id]);

    while (true) {
      pass = false;
      offsetedPositons = [];

      // check neighbors
      for (const offset of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        offsetpos = [offset[0] + pos[0], offset[1] + pos[1]];

        if (visited.has(`${wrap(offsetpos[0], 0, width)},${wrap(offsetpos[1], 0, height)}`) | isBlock(offsetpos)) continue;

        offsetedPositons.push(offsetpos);

        if (isFree(offsetpos)) {
          setColor(offsetpos[0], offsetpos[1], color);
          setID(offsetpos[0], offsetpos[1], id);
          setHue(offsetpos[0], offsetpos[1], hue);
          setVelocity(pos[0], pos[1], offset);
          return true;
        }

        const offsetid = getID(offsetpos[0], offsetpos[1]);
        const combinedID = new Set([...id, ...offsetid]);
        if (![...offsetid].some(n => id.has(n)) & offsetid != undefined & isArrayEqual(getColor(offsetpos[0], offsetpos[1]), color) & 2 ** ((hue + 36) / 36) <= combinedID.size) {
          hue += 36;
          if (hue == 144) { hue += 36 }
          color = darkenColor(hsl2rgb(hue, 100, 50));

          setColor(offsetpos[0], offsetpos[1], color);
          setID(offsetpos[0], offsetpos[1], new Set([...id, ...offsetid]));
          setHue(offsetpos[0], offsetpos[1], hue);
          setVelocity(pos[0], pos[1], offset);
          return true;
        }
      }

      // add color tiles to queue
      visited.add(`${pos[0]},${pos[1]}`);

      for (const offsetpos of offsetedPositons) {
        if (getHue(offsetpos[0], offsetpos[1]) >= hue) {
          forks.enqueue(offsetpos);
          pass = true;
        }
      }
      // forks.print();

      // start next iteration
      if (!pass & forks.size == 0) {
        return false;
      } else {
        while (visited.has(`${pos[0]},${pos[1]}`)) {
          if (forks.size == 0) {
            return false;
          }
          id = new Set([...id, ...getID(pos[0], pos[1])]);
          pos = forks.dequeue();
          const offsethue = getHue(pos[0], pos[1]);
          if (offsethue != hue) {
            color = getColor(pos[0], pos[1]);
            hue = offsethue;
          }
        }
      }
    }
  }
}

function getColor(x, y) {
  const pixel = pixels.get(`${wrap(x, 0, width)},${wrap(y, 0, height)}`);
  if (pixel === undefined) {
    return [128, 128, 128, 255];
  }
  return pixel.color;
}

function getVelocity(x, y) {
  const pixel = pixels.get(`${wrap(x, 0, width)},${wrap(y, 0, height)}`);
  if (pixel === undefined) {
    return [0, 0];
  }
  if (pixel.velocity === undefined) {
    return [0, 0];
  }
  return pixel.velocity;
}

function getID(x, y) {
  const pixel = pixels.get(`${wrap(x, 0, width)},${wrap(y, 0, height)}`);
  if (pixel === undefined) {
    return undefined;
  }
  return pixel.id;
}

function getHue(x, y) {
  const pixel = pixels.get(`${wrap(x, 0, width)},${wrap(y, 0, height)}`);
  if (pixel === undefined) {
    return -1;
  }
  if (pixel.hue === undefined) {
    return -1;
  }
  return pixel.hue;
}

function setColor(x, y, color) {
  if (isArrayEqual(color, [64, 64, 64, 255])) {
    if (isBlock([x, y - 1])) {
      ctx.beginPath();

      ctx.fillStyle = `rgba(64, 64, 64, 1)`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize + (pixelSize * 1 / 2), 0, canvas.height), pixelSize, (pixelSize * 1 / 2));
      ctx.fill();

      ctx.beginPath();

      ctx.fillStyle = `rgba(96, 96, 96, 1)`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize, 0, canvas.height), pixelSize, (pixelSize * 1 / 2));
      ctx.fill();
    } else {
      ctx.beginPath();

      ctx.fillStyle = `rgba(64, 64, 64, 1)`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize, 0, canvas.height), pixelSize, pixelSize);
      ctx.fill();
    }
  } else {
    if (isBlock([x, y - 1])) {
      ctx.beginPath();

      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize + (pixelSize * 1 / 4), 0, canvas.height), pixelSize, (pixelSize * 3 / 4));
      ctx.fill();

      ctx.beginPath();

      ctx.fillStyle = `rgba(${lerp(96, color[0], 0.2)}, ${lerp(96, color[1], 0.2)}, ${lerp(96, color[2], 0.5)}, 1)`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize, 0, canvas.height), pixelSize, (pixelSize * 1 / 4));
      ctx.fill();
    } else {
      ctx.beginPath();

      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
      ctx.rect(wrap(x * pixelSize, 0, canvas.width), wrap(y * pixelSize, 0, canvas.height), pixelSize, pixelSize);
      ctx.fill();
    }
  }

  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  if (pixel === undefined) {
    pixels.set(pos, { "color": color });
  } else {
    pixel["color"] = color;

    pixels.set(pos, pixel);
  }
}

function setVelocity(x, y, velocity) {
  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  pixel["velocity"] = velocity;

  pixels.set(pos, pixel);
}

function setID(x, y, id) {
  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  pixel["id"] = id;

  pixels.set(pos, pixel);
}

function setHue(x, y, hue) {
  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  pixel["hue"] = hue;

  pixels.set(pos, pixel);
}

function isFree(pos) {
  return isArrayEqual(getColor(pos[0], pos[1]), [64, 64, 64, 255]);
}

function isBlock(pos) {
  return isArrayEqual(getColor(pos[0], pos[1]), [128, 128, 128, 255]);
}

function darkenColor(color) {
  return [Math.max(color[0] - 32, 0), Math.max(color[1] - 32, 0), Math.max(color[2] - 32, 0), color[3]];
}

function createSource(pos, hue) {
  sources.push(new Source(pos, nextSourceID, hue));
  setColor(pos[0], pos[1], sources[sources.length - 1].color);
  setID(pos[0], pos[1], new Set([nextSourceID]));
  nextSourceID++;

  if (!isBlock([pos[0], pos[1] + 1])) {
    setColor(pos[0], pos[1] + 1, getColor(pos[0], pos[1] + 1));
  }
}

function drawAt(clientPos) {
  pos = [Math.floor((clientPos[0] + camOffset.x - 4) / pixelSize), Math.floor((clientPos[1] + camOffset.y - 4) / pixelSize)];
  if (isBlock(pos)) {
    setColor(pos[0], pos[1], [64, 64, 64, 255]);
  }
  if (!isBlock([pos[0], pos[1] + 1])) {
    setColor(pos[0], pos[1] + 1, getColor(pos[0], pos[1] + 1));
  }
}

function updateMovement(deltaTime) {
  camOffset.x += (+input.right - +input.left) * arrowMovementSpeed * deltaTime;
  camOffset.y += (+input.down - +input.up) * arrowMovementSpeed * deltaTime;
}

// world gen
for (let i = 0; i < 100; i++) {
  createSource([Math.round(Math.random() * width), Math.round(Math.random() * height)], 0)
}

// Simulation
let lastTime = 0;
let lastUpdate = 0;

update(0);
function update(timeStamp) {
  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;

  // update game state
  if (timeStamp - lastUpdate > 50) {
    for (const source of sources) {
      source.produceFlow();
    }

    lastUpdate = timeStamp;
  }

  // update movement (outside of 20 tps game loop)
  updateMovement(deltaTime);

  canvas.style.transform = `translate(${-camOffset.x}px, ${-camOffset.y}px)`;

  requestAnimationFrame(update);
}