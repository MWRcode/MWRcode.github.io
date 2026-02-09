// Variables
const [width, height] = [100, 100];

const pixelSize = 32;

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

const worldDiv = document.querySelector(".main");

let drawing = false;

let input = { "up": false, "down": false, "left": false, "right": false };

const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1]];

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

worldDiv.addEventListener("mousedown", (event) => {
  if (event.button == 1) {
    mouseStartPos.x = event.clientX;
    mouseStartPos.y = event.clientY;
  } else if (event.button == 0) {
    drawing = true;
    drawAt([event.clientX, event.clientY]);
  }
  console.log("hue:", getHue(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)), "ID:", getID(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)), "Connections:", getConnections(Math.floor((event.clientX + camOffset.x - 4) / pixelSize), Math.floor((event.clientY + camOffset.y - 4) / pixelSize)));
});

document.addEventListener("mouseup", (event) => {
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

worldDiv.addEventListener("mousemove", (event) => {
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

worldDiv.addEventListener("touchstart", (event) => {
  drawing = true;
  drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY]);
});

document.addEventListener("touchend", (event) => {
  if (drawing) {
    drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY]);
    drawing = false;
  }
});

worldDiv.addEventListener("touchmove", (event) => {
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
      for (const offset of getConnections(pos[0], pos[1])) {
        offsetpos = [offset[0] + pos[0], offset[1] + pos[1]];

        if (visited.has(`${wrap(offsetpos[0], 0, width)},${wrap(offsetpos[1], 0, height)}`) || isBlock(offsetpos)) continue;

        offsetedPositons.push(offsetpos);

        if (isFree(offsetpos)) {
          setColor(offsetpos[0], offsetpos[1], color);
          setID(offsetpos[0], offsetpos[1], id);
          setHue(offsetpos[0], offsetpos[1], hue);
          return true;
        }

        const offsetid = getID(offsetpos[0], offsetpos[1]);
        const combinedID = new Set([...id, ...offsetid]);
        if (![...offsetid].some(n => id.has(n)) && offsetid != undefined && isArrayEqual(getColor(offsetpos[0], offsetpos[1]), color) && getRequiredIDsFormHue(hue + 36) <= combinedID.size) {
          hue += 36;
          if (hue == 144) { hue += 36 }
          color = darkenColor(hsl2rgb(hue, 100, 50));

          setColor(offsetpos[0], offsetpos[1], color);
          setID(offsetpos[0], offsetpos[1], new Set([...id, ...offsetid]));
          setHue(offsetpos[0], offsetpos[1], hue);
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
  if (pixel.color === undefined) {
    return [128, 128, 128, 255];
  }
  return pixel.color;
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

function getConnections(x, y) {
  const pixel = pixels.get(`${wrap(x, 0, width)},${wrap(y, 0, height)}`);
  if (pixel === undefined) {
    return [];
  }
  return pixel.connections;
}

function setColor(x, y, color) {
  let rects = [];

  [x, y] = [wrap(x, 0, width), wrap(y, 0, height)];
  
  if (color == "free") {
    color = [64, 64, 64, 255];
  }
  
  const connections = getConnections(x, y);

  // create draw buffer
  if (isArrayEqual(color, [64, 64, 64, 255])) {
    if (!connections.some(connection => connection[0] == 0 && connection[1] == -1)) {
      rects.push([1/8, 1/8, 3/4, 1/2, [96, 96, 96]]);
      rects.push([1/8, 5/8, 3/4, 1/4, [64, 64, 64]]);
    } else {
      rects.push([1/8, 1/8, 3/4, 3/4, [64, 64, 64]]);
    }

    for (const connection of connections) {
      if (connection[0] == 0) {
        rects.push([1/8, connection[1] == -1 ? 0 : 7/8, 3/4, 1/8, [64, 64, 64]]);
      } else {
        rects.push([connection[0] == -1 ? 0 : 7/8, 1/8, 1/8, 3/4, [64, 64, 64]]);
        rects.push([connection[0] == -1 ? 0 : 7/8, 1/8, 1/8, 1/2, [96, 96, 96]]);
      }
    }
  } else {
    if (!connections.some(connection => connection[0] == 0 && connection[1] == -1)) {
      rects.push([1/8, 1/8, 3/4, 1/4, lerpArray(color, [96, 96, 96, 255], 0.8)]);
      rects.push([1/8, 3/8, 3/4, 1/2, color]);
    } else {
      rects.push([1/8, 1/8, 3/4, 3/4, color]);
    }

    for (const connection of connections) {
      if (connection[0] == 0) {
        rects.push([1/8, connection[1] == -1 ? 0 : 7/8, 3/4, 1/8, color]);
      } else {
        rects.push([connection[0] == -1 ? 0 : 7/8, 1/8, 1/8, 3/4, color]);
        rects.push([connection[0] == -1 ? 0 : 7/8, 1/8, 1/8, 1/4, lerpArray(color, [96, 96, 96, 255], 0.8)]);
      }
    }
  }

  //draw draw buffer
  for (const rect of rects) {
    ctx.beginPath();

    ctx.fillStyle = `rgba(${rect[4][0]}, ${rect[4][1]}, ${rect[4][2]}, 1)`;
    ctx.rect((x + rect[0]) * pixelSize, (y + rect[1]) * pixelSize, pixelSize * rect[2], pixelSize * rect[3]);
    ctx.fill();
  }

  // write color to grid
  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  if (pixel === undefined) {
    pixels.set(pos, { "color": color });
  } else {
    pixel["color"] = color;

    pixels.set(pos, pixel);
  }
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

function setConnections(x, y, connections) {
  const pos = `${wrap(x, 0, width)},${wrap(y, 0, height)}`;

  const pixel = pixels.get(pos);

  if (pixel === undefined) {
    pixels.set(pos, { "connections": connections });
  } else {
    pixel["connections"] = connections;

    pixels.set(pos, pixel);
  }
}

function isFree(pos) {
  return isArrayEqual(getColor(pos[0], pos[1]), [64, 64, 64, 255]);
}

function isBlock(pos) {
  return isArrayEqual(getColor(pos[0], pos[1]), [128, 128, 128, 255]);
}

function getRequiredIDsFormHue(hue) {
  let required = 2 ** Math.round(hue / 36);
  if (required >= 32) { // wired logic to skip hue value of 144 because it is to similar to 108
    required /= 2;
  }
  return required;
}

function darkenColor(color) {
  return [Math.max(color[0] - 32, 0), Math.max(color[1] - 32, 0), Math.max(color[2] - 32, 0), color[3]];
}

function createSource(pos, hue) {
  sources.push(new Source(pos, nextSourceID, hue));
  setColor(pos[0], pos[1], sources[sources.length - 1].color);

  let ids = [];
  for (let i = 0; i < getRequiredIDsFormHue(hue); i++) {
    ids.push(nextSourceID)
    nextSourceID++;
  }

  setID(pos[0], pos[1], new Set(ids));
  setConnections(pos[0], pos[1], []);

  if (!isBlock([pos[0], pos[1] + 1])) {
    setColor(pos[0], pos[1] + 1, getColor(pos[0], pos[1] + 1));
  }
}

function drawAt(clientPos) {
  pos = [Math.floor((clientPos[0] + camOffset.x) / pixelSize), Math.floor((clientPos[1] + camOffset.y) / pixelSize)];
  
  if (isBlock(pos)) {
    // update connections
    let connections = [];
    for (const offset of offsets) {
      const offsetpos = [pos[0] + offset[0], pos[1] + offset[1]];
      
      if (!isBlock(offsetpos) && connections.length < 3) {
        const offsetConnections = getConnections(offsetpos[0], offsetpos[1]);

        if (offsetConnections.length < 3) {
          connections.push(offset);

          offsetConnections.push([-offset[0], -offset[1]]);
          setConnections(offsetpos[0], offsetpos[1], offsetConnections);
          setColor(offsetpos[0], offsetpos[1], getColor(offsetpos[0], offsetpos[1]));
        }
      }
    }
    setConnections(pos[0], pos[1], connections);

    setColor(pos[0], pos[1], "free");
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
  let hue = 0;
  while (Math.random() < 0.2) {
    hue += 36;
    if (hue == 144) {
      hue += 36
    }
  }
  createSource([Math.round(Math.random() * width), Math.round(Math.random() * height)], hue);
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