export const renderManager = class renderManager {
  constructor(imageSize) {
    this.images = new Map();
    this.imageSize = imageSize;
  }
  _getImageIndex(position) {
    const xIndex = Math.floor(Math.floor(position[0] / this.imageSize[0]) * this.imageSize[0]);
    const yIndex = Math.floor(Math.floor(position[1] / this.imageSize[1]) * this.imageSize[1]);

    return [xIndex, yIndex];
  }
  _key(i1, i2) {
    return i1 + '.' + i2;
  }
  addNode(xpos, ypos, pxpos, pypos, color, radius) {
    const index1 = this._getImageIndex([xpos, ypos]);
    const diff = [xpos - index1[0], ypos - index1[1]];

    const index2 = this._getImageIndex([pxpos, pypos]);

    this.drawNode(xpos, ypos, pxpos, pypos, color, radius, index1);

    // lines on boundary
    if (index2[0] != index1[0] || index2[1] != index1[1]) {
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, index2);
    }

    if (index2[0] != index1[0] && index2[1] != index1[1]) {
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, [index2[0], index1[1]]);
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, [index1[0], index2[1]]);
    }

    // circles on boundary
    if (this.imageSize[0] - diff[0] < radius || diff[0] < radius || this.imageSize[1] - diff[1] < radius || diff[1] < radius) {
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, this._getImageIndex([xpos + 2 * radius, ypos + 2 * radius]));
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, this._getImageIndex([xpos + 2 * radius, ypos - 2 * radius]));
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, this._getImageIndex([xpos - 2 * radius, ypos + 2 * radius]));
      this.drawNode(xpos, ypos, pxpos, pypos, color, radius, this._getImageIndex([xpos - 2 * radius, ypos - 2 * radius]));
    }
  }
  drawNode(xpos, ypos, pxpos, pypos, color, radius, index) {
    const key = this._key(index[0], index[1]);
    if (!(key in this.images)) {
      const linesCanvas = this.createCanvas();
      linesCanvas.ctx.strokeStyle = "#555";
      linesCanvas.ctx.lineWidth = 3;

      this.images[key] = [linesCanvas, this.createCanvas()]; // lines canvas; circles canvas
    }

    const linesCtx = this.images[key][0].ctx;
    const circlesCtx = this.images[key][1].ctx;

    linesCtx.beginPath();
    linesCtx.moveTo(xpos - index[0], ypos - index[1]);
    linesCtx.lineTo(pxpos - index[0], pypos - index[1]);
    linesCtx.stroke();

    circlesCtx.fillStyle = color;
    circlesCtx.beginPath();
    circlesCtx.arc(xpos - index[0], ypos - index[1], radius, 0, Math.PI * 2);
    circlesCtx.fill();
  }
  createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.imageSize[0];
    canvas.height = this.imageSize[1];
    canvas.style.background = "#222";
    const ctx = canvas.getContext("2d");

    return {
      "ctx": ctx,
      "canvas": canvas,
    };
  }
  render(canvas, ctx, camera) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stepsizefac = 1 / Math.min(1, camera.zoom * 1000);

    for (let x = camera.x - ((canvas.width / 2) / camera.zoom) + (canvas.width / 2); x < camera.x - ((canvas.width / 2) / camera.zoom) + (canvas.width / 2) + (canvas.width / camera.zoom) + this.imageSize[0]; x += this.imageSize[0] * stepsizefac) {
      for (let y = camera.y - ((canvas.height / 2) / camera.zoom) + (canvas.height / 2); y < camera.y - ((canvas.height / 2) / camera.zoom) + (canvas.height / 2) + (canvas.height / camera.zoom) + this.imageSize[1]; y += this.imageSize[1] * stepsizefac) {
        const index = this._getImageIndex([x, y]);
        const key = this._key(index[0], index[1]);

        if (key in this.images) {
          const linesCanvas = this.images[key][0].canvas;
          const circlesCanvas = this.images[key][1].canvas;
          ctx.drawImage(linesCanvas, 0, 0, this.imageSize[0], this.imageSize[1], (index[0] - camera.x - canvas.width / 2) * camera.zoom + canvas.width / 2, (index[1] - camera.y - canvas.height / 2) * camera.zoom + canvas.height / 2, this.imageSize[0] * camera.zoom, this.imageSize[1] * camera.zoom);
          ctx.drawImage(circlesCanvas, 0, 0, this.imageSize[0], this.imageSize[1], (index[0] - camera.x - canvas.width / 2) * camera.zoom + canvas.width / 2, (index[1] - camera.y - canvas.height / 2) * camera.zoom + canvas.height / 2, this.imageSize[0] * camera.zoom, this.imageSize[1] * camera.zoom);
        }
      }
    }
  }
  removeAll() {
    this.images = new Map();
  }
}