// Variables
const [width, height] = [100, 100];

const pixelSize = 32;

const arrowMovementSpeed = 1.8;

const useTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

// Setup
const canvas = document.getElementById("canvas");

canvas.style.backgroundColor = "#808080";

const ctx = canvas.getContext("2d");

canvas.width = width * pixelSize;
canvas.height = height * pixelSize;

ctx.imageSmoothingEnabled = false;

const sideCanvases = [];
for (const c of [[1, [1, 0]], [2, [0, 1]], [3, [1, 1]]]) {
  const sideCanvas = document.getElementById(`canvas${c[0]}`);

  sideCanvas.style.backgroundColor = "#808080";

  const sidectx = sideCanvas.getContext("2d");

  sideCanvas.width = width * pixelSize;
  sideCanvas.height = height * pixelSize;

  sideCanvases.push([sideCanvas, sidectx, c[1]]);
}

const pixels = new Map();

let sources = [];
let updateSources = new Set();

let nextSourceID = 0;

let camOffset = { x: 0, y: 0 };
let mouseStartPos = { x: null, y: null };

let resetCombiners = [];

const hueShiftCanvas = document.createElement("canvas");
const hueShiftCtx = hueShiftCanvas.getContext("2d", { "willReadFrequently": true });

hueShiftCanvas.width = 16;
hueShiftCanvas.height = 16;

let buttons = {};
if (!useTouch) {
  document.querySelectorAll("#controls button").forEach(element => {
    element.remove();
  });
  document.querySelector("#drawType").remove();
} else {
  for (const button of ["up", "down", "left", "right", "drawType"]) {
    buttons[button] = document.getElementById(button);
  }
}

const worldDiv = document.querySelector(".main");

let drawing = false;

let input = { "up": false, "down": false, "left": false, "right": false };

const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const offset2connections = {
  "[1,0]": 1,
  "[-1,0]": 3,
  "[0,1]": 2,
  "[0,-1]": 0
}

// import tiles
const filenames = ["0000e", "1000e", "0010e", "0100e", "0001e", "0101e", "1010e", "0110e", "0011e", "1100e", "1001e", "1101c0", "0111c0", "1110c0", "1011c0", "0000s", "0000f", "1000s", "0010s", "0100s", "0001s", "1000f", "0010f", "0100f", "0001f", "0101f", "1010f", "0110f", "0011f", "1100f", "1001f", "1101c1", "1101c2", "1101c3", "0111c1", "0111c2", "0111c3", "1110c1", "1110c2", "1110c3", "1011c1", "1011c2", "1011c3"];

let tileImages = {};
for (let i = 0; i < filenames.length; i++) {
  const img = new Image(16, 16);

  img.src = `./assets/tiles/${JSON.stringify(i).padStart(2, "0")}.png`;

  tileImages[filenames[i]] = img;
}

// helper functions
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
  console.log(event)
  if (event.button == 1) {
    mouseStartPos.x = event.clientX;
    mouseStartPos.y = event.clientY;
  } else {
    drawing = true;
    if (useTouch) {
      const parameters = getDrawParameters();
      drawAt([event.clientX, event.clientY], parameters[0], parameters[1]);
    } else {
      drawAt([event.clientX, event.clientY], event.button == 0 ? "hole" : "fill", event.shiftKey);
    }
  }
  const pos = [Math.floor((event.clientX + camOffset.x) / pixelSize), Math.floor((event.clientY + camOffset.y) / pixelSize)];
  console.log("Hue: ", getValue(pos, "hue"), "Connections: ", getValue(pos, "connections"), "Type: ", getValue(pos, "type"), "ID:", getValue(pos, "id"));
});

document.addEventListener("mouseup", (event) => {
  if (event.button == 1 & mouseStartPos.x != null) {
    camOffset.x += mouseStartPos.x - event.clientX;
    camOffset.y += mouseStartPos.y - event.clientY;
    mouseStartPos.x = null;
    mouseStartPos.y = null;
  } else if (drawing) {
    if (useTouch) {
      const parameters = getDrawParameters();
      drawAt([event.clientX, event.clientY], parameters[0], parameters[1]);
    } else {
      drawAt([event.clientX, event.clientY], event.button == 0 ? "hole" : "fill", event.shiftKey);
    }
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
    if (useTouch) {
      const parameters = getDrawParameters();
      drawAt([event.clientX, event.clientY], parameters[0], parameters[1]);
    } else {
      drawAt([event.clientX, event.clientY], event.button == 0 ? "hole" : "fill", event.shiftKey);
    }
  }
});

document.addEventListener('mouseleave', () => {
  mouseStartPos.x = null;
  mouseStartPos.y = null;
  drawing = false;
});

worldDiv.addEventListener("touchstart", (event) => {
  drawing = true;

  const parameters = getDrawParameters();

  drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY], parameters[0], parameters[1]);
});

document.addEventListener("touchend", (event) => {
  if (drawing) {
    const parameters = getDrawParameters();

    drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY], parameters[0], parameters[1]);
    drawing = false;
  }
});

worldDiv.addEventListener("touchmove", (event) => {
  if (drawing) {
    const parameters = getDrawParameters();

    drawAt([event.changedTouches[0].clientX, event.changedTouches[0].clientY], parameters[0], parameters[1]);
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
  buttons.drawType.addEventListener("mousedown", () => {
    const text = buttons.drawType.innerText;
    if (text == "Hole") {
      buttons.drawType.innerText = "Fill";
    } else if (text == "Fill") {
      buttons.drawType.innerText = "Combiner";
    } else if (text == "Combiner") {
      buttons.drawType.innerText = "Hole";
    }
  });

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
  constructor(pos, hue, id) {
    this.pos = pos;
    this.hue = hue;
    this.id = id;
  }
  produceFlow() {
    let offsetpos;
    let pos = this.pos;
    let visited = new Set();
    let forks = new Queue();
    let hue = this.hue;
    let id = [this.id];

    while (true) {
      const connections = getValue(pos, "connections");

      // check neighbors
      for (const offset of connections2offsets(connections)) {
        offsetpos = [offset[0] + pos[0], offset[1] + pos[1]];

        const offsetHue = getValue(offsetpos, "hue");
        const offsetType = getValue(offsetpos, "type");
        if (visited.has(`${wrap(offsetpos[0], 0, width)},${wrap(offsetpos[1], 0, height)}`) || offsetType == "filled" || (offsetHue != hue && offsetHue !== undefined) || offsetType == "source") continue;

        forks.enqueue(offsetpos);

        const offsetID = getValue(offsetpos, "id");
        if (offsetID !== undefined) {
          setValue(offsetpos, "id", [...new Set(id.concat(offsetID))]);
        }

        if (offsetType == "hole" && offsetHue === undefined) {
          setValue(offsetpos, "hue", hue);
          setValue(offsetpos, "id", id);
          drawTile(offsetpos);
          return true;
        }
        else if (offsetType == "combiner") {
          let state = getValue(offsetpos, "state");
          const offsetConnections = getValue(offsetpos, "connections").map(b => b ? 1 : 0).join('');

          if (state == 0) {
            const connectionIndex = offset2connections[JSON.stringify([-offset[0], -offset[1]])];
            if (offsetConnections == "0111" && connectionIndex == 3) state = 1
            if (offsetConnections == "0111" && connectionIndex == 1) state = 2
            if (offsetConnections == "1011" && connectionIndex == 0) state = 1
            if (offsetConnections == "1011" && connectionIndex == 2) state = 2
            if (offsetConnections == "1101" && connectionIndex == 1) state = 1
            if (offsetConnections == "1101" && connectionIndex == 3) state = 2
            if (offsetConnections == "1110" && connectionIndex == 2) state = 1
            if (offsetConnections == "1110" && connectionIndex == 0) state = 2

            if (state > 0) {
              setValue(offsetpos, "state", state);
              setValue(offsetpos, "hue", hue);

              if (getValue(offsetpos, "id") === undefined) {
                drawTile(offsetpos);
              } else {
                drawTile(offsetpos, { "state": 3 });
              }

              setValue(offsetpos, "id", id);
              return false;
            }
          }
          else if (state == 1) {
            const connectionIndex = offset2connections[JSON.stringify([-offset[0], -offset[1]])];
            if (offsetConnections == "0111" && connectionIndex == 1) state = 3
            if (offsetConnections == "1011" && connectionIndex == 2) state = 3
            if (offsetConnections == "1101" && connectionIndex == 3) state = 3
            if (offsetConnections == "1110" && connectionIndex == 0) state = 3

            if (state == 3) {
              drawTile(offsetpos, { "state": 3 });
              setValue(offsetpos, "state", 0);

              for (const updateID of offsetID) {
                updateSources.add(updateID);
              }

              id = id.concat(offsetID);
              setValue(offsetpos, "id", id);

              hue += 36;
              resetCombiners.push(offsetpos);
            } else {
              return false;
            }
          }
          else if (state == 2) {
            const connectionIndex = offset2connections[JSON.stringify([-offset[0], -offset[1]])];
            if (offsetConnections == "0111" && connectionIndex == 3) state = 3
            if (offsetConnections == "1011" && connectionIndex == 0) state = 3
            if (offsetConnections == "1101" && connectionIndex == 1) state = 3
            if (offsetConnections == "1110" && connectionIndex == 2) state = 3

            if (state == 3) {
              drawTile(offsetpos, { "state": 3 });
              setValue(offsetpos, "state", 0);

              for (const updateID of offsetID) {
                updateSources.add(updateID);
              }

              id = id.concat(offsetID);
              setValue(offsetpos, "id", id);

              hue += 36;
              resetCombiners.push(offsetpos);
            } else {
              return false;
            }
          }
        }
      }
      visited.add(`${pos[0]},${pos[1]}`);

      // start next iteration
      if (forks.size == 0) {
        return false;
      } else {
        while (visited.has(`${pos[0]},${pos[1]}`)) {
          if (forks.size == 0) {
            return false;
          }
          pos = forks.dequeue();
        }
      }
    }
  }
}

function drawTile(pos, override) {
  pos = [wrap(pos[0], 0, width), wrap(pos[1], 0, height)];

  let connections = getValue(pos, "connections");
  let type = getValue(pos, "type");
  let hue = getValue(pos, "hue");
  let state = getValue(pos, "state");

  if (override) {
    if (override["connections"]) {
      connections = override["connections"];
    }
    if (override["type"]) {
      type = override["type"];
    }
    if (override["hue"]) {
      hue = override["hue"];
    }
    if (override["state"]) {
      state = override["state"];
    }
  }

  // create draw buffer
  if (type == "filled") {
    ctx.beginPath();

    ctx.fillStyle = "#808080";
    ctx.fillRect(pos[0] * pixelSize, pos[1] * pixelSize, pixelSize, pixelSize);
    ctx.fill();
  }
  else {
    let filenameType = "e";
    if (type == "source") {
      filenameType = "s";
    } else if (type == "hole") {
      if (hue === undefined) {
        filenameType = "e";
      } else {
        filenameType = "f";
      }
    } else if (type == "combiner") {
      filenameType = `c${state}`;
    }

    if (hue === 0 || hue === undefined) {
      ctx.drawImage(tileImages[`${connections.map(b => b ? 1 : 0).join('')}${filenameType}`], pos[0] * pixelSize, pos[1] * pixelSize, pixelSize, pixelSize);
    } else {
      ctx.drawImage(hueShift(tileImages[`${connections.map(b => b ? 1 : 0).join('')}${filenameType}`], hue), pos[0] * pixelSize, pos[1] * pixelSize, pixelSize, pixelSize);
    }
  }
}

function getValue(pos, key) {
  const pixel = pixels.get(`${wrap(pos[0], 0, width)},${wrap(pos[1], 0, height)}`);

  if (pixel === undefined || pixel[key] === undefined) {
    switch (key) {
      case "connections":
        return [false, false, false, false];
      case "type":
        return "filled";
      case "state":
        return 0;
      default:
        return undefined;
    }
  }

  return pixel[key];
}

function setValue(pos, key, value) {
  pos = `${wrap(pos[0], 0, width)},${wrap(pos[1], 0, height)}`;

  let pixel = pixels.get(pos);

  if (value === undefined) {
    if (pixel === undefined) {
      return;
    }

    delete pixel[key];
  } else {
    if (pixel === undefined) {
      pixel = {};
    }

    pixel[key] = value;
  }
  pixels.set(pos, pixel);
}

function deletePixel(pos) {
  const key = `${wrap(pos[0], 0, width)},${wrap(pos[1], 0, height)}`;

  drawTile(pos, { "type": "filled" });

  pixels.delete(key);
}

function connections2offsets(connections) {
  let offsets = [];
  if (connections[0]) offsets.push([0, -1]);
  if (connections[1]) offsets.push([1, 0]);
  if (connections[2]) offsets.push([0, 1]);
  if (connections[3]) offsets.push([-1, 0]);

  return offsets;
}

function getDrawParameters() {
  let shift = false;
  let type = "hole";

  const text = buttons.drawType.innerText;
  if (text == "Fill") {
    type = "fill";
  } else if (text == "Combiner") {
    shift = true;
  }

  return [type, shift];
}

function hueShift(img, hue) {
  hueShiftCtx.drawImage(img, 0, 0);

  const imageData = hueShiftCtx.getImageData(0, 0, 16, 16);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Convert RGB to HSL
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Shift hue
    h = (h + hue / 360) % 1;
    if (h < 0) h += 1;

    // Convert HSL back to RGB
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    let r2, g2, b2;
    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r2 = hue2rgb(p, q, h + 1 / 3);
      g2 = hue2rgb(p, q, h);
      b2 = hue2rgb(p, q, h - 1 / 3);
    }

    data[i] = Math.round(r2 * 255);
    data[i + 1] = Math.round(g2 * 255);
    data[i + 2] = Math.round(b2 * 255);
  }
  hueShiftCtx.putImageData(imageData, 0, 0);

  return hueShiftCanvas;
}

function createSource(pos, hue) {
  sources.push(new Source(pos, hue, nextSourceID));

  setValue(pos, "type", "source");
  setValue(pos, "hue", hue);
  setValue(pos, "id", [nextSourceID]);
  drawTile(pos);

  updateSources.add(nextSourceID);

  nextSourceID++;
}

function drawAt(clientPos, drawingType, shift) {
  pos = [Math.floor((clientPos[0] + camOffset.x) / pixelSize), Math.floor((clientPos[1] + camOffset.y) / pixelSize)];

  if (getValue(pos, "type") == "filled" && drawingType == "hole") {
    // update connections
    const maxConnections = shift ? 3 : 2;
    let connections = [false, false, false, false];
    let connectionsCount = 0;

    for (const offset of offsets) {
      const offsetpos = [pos[0] + offset[0], pos[1] + offset[1]];
      const offsetType = getValue(offsetpos, "type");

      if (offsetType != "filled" && connectionsCount < maxConnections) {
        const offsetConnections = getValue(offsetpos, "connections");

        if (offsetConnections.filter(value => value === true).length < (offsetType == "source" ? 1 : maxConnections)) {
          connections[offset2connections[JSON.stringify(offset)]] = true;
          connectionsCount++;

          const connectionsIndex = offset2connections[JSON.stringify([-offset[0], -offset[1]])];
          if (!offsetConnections[connectionsIndex]) {
            offsetConnections[connectionsIndex] = true;
            const offsetID = getValue(offsetpos, "id");

            if (offsetID !== undefined) {
              for (const id of offsetID) {
                updateSources.add(id);
              }
            }
          }

          setValue(offsetpos, "connections", offsetConnections);
          if (offsetType != "source") {
            if (offsetConnections.filter(value => value === true).length == 3) {
              setValue(offsetpos, "type", "combiner");
              setValue(offsetpos, "hue", undefined);
              setValue(offsetpos, "id", undefined);
            } else {
              setValue(offsetpos, "type", "hole");
            }
          }
          drawTile(offsetpos);
        }
      }
    }

    setValue(pos, "connections", connections);
    setValue(pos, "type", connectionsCount == 3 ? "combiner" : "hole");

    drawTile(pos);
  }
  else if ((getValue(pos, "type") == "hole" || getValue(pos, "type") == "combiner") && drawingType == "fill") {
    const ids = getValue(pos, "id");
    if (ids !== undefined) {
      for (const id of ids) {
        updateSources.add(id);
      }
    }

    // update connections
    for (const offset of offsets) {
      const offsetpos = [pos[0] + offset[0], pos[1] + offset[1]];

      if (getValue(offsetpos, "type") != "filled") {
        let offsetConnections = getValue(offsetpos, "connections");

        const connectionsIndex = offset2connections[JSON.stringify([-offset[0], -offset[1]])];
        if (offsetConnections[connectionsIndex]) {
          offsetConnections[connectionsIndex] = false;

          const offsetID = getValue(offsetpos, "id");
          if (offsetID !== undefined) {
            for (const id of offsetID) {
              updateSources.add(id);
            }
          }
        }

        setValue(offsetpos, "connections", offsetConnections);
        if (getValue(offsetpos, "type") != "source") setValue(offsetpos, "type", "hole");
        setValue(offsetpos, "state", undefined);
        drawTile(offsetpos);
      }
    }

    deletePixel(pos);
  }
}

function updateMovement(deltaTime) {
  camOffset.x += (+input.right - +input.left) * arrowMovementSpeed * deltaTime;
  camOffset.y += (+input.down - +input.up) * arrowMovementSpeed * deltaTime;
  camOffset.x = wrap(camOffset.x, 0, canvas.width);
  camOffset.y = wrap(camOffset.y, 0, canvas.width);
}

let lastTime = 0;
let lastUpdate = 0;

tileImages[filenames[filenames.length - 1]].onload = () => {
  // world gen
  for (let i = 0; i < 100; i++) {
    let hue = 0;
    while (Math.random() < 0.5) {
      hue += 36;
      if (hue == 144) {
        hue += 36
      }
    }
    createSource([Math.round(Math.random() * width), Math.round(Math.random() * height)], hue);
  }

  // for (let x = 0; x < canvas.width; x += pixelSize) {
  //   for (let y = 0; y < canvas.height; y += pixelSize) {
  //     drawAt([x, y], "hole", false);
  //   }
  // }

  // start simulation
  update(0);
}

function update(timeStamp) {
  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;

  // update game state
  if (timeStamp - lastUpdate > 50) {
    for (const sourceID of updateSources) {
      if (sources[sourceID].produceFlow() === false) {
        updateSources.delete(sourceID);
      }
    }

    for (const sideCanvas of sideCanvases) {
      sideCanvas[1].drawImage(canvas, 0, 0);
    }
    lastUpdate = timeStamp;
  }

  // update graphics (outside of 20 tps game loop)
  updateMovement(deltaTime);

  canvas.style.transform = `translate(${-camOffset.x}px, ${-camOffset.y}px)`;

  for (const sideCanvas of sideCanvases) {
    sideCanvas[0].style.transform = `translate(${-camOffset.x + (sideCanvas[2][0] * canvas.width)}px, ${-camOffset.y + (sideCanvas[2][1] * canvas.width)}px)`;
  }

  requestAnimationFrame(update);
}