export class SpatialGrid {
  constructor(cellSize) {
    this.cells = new Map();
    this.cellSize = cellSize;
  }
  key(position) {
    return `${Math.floor(position[0] / this.cellSize) * this.cellSize}.${Math.floor(position[1] / this.cellSize) * this.cellSize}`;
  }
  newCircle(position) {
    const key = this.key(position);

    if (!(key in this.cells)) {
      this.cells[key] = new Set();
    }
    this.cells[key].add(position);

    return position;
  }
  isNear(position, queryDistance, isNearCallback) {
    for (let x = position[0] - queryDistance; x <= position[0] + queryDistance + this.cellSize; x += this.cellSize) {
      for (let y = position[1] - queryDistance; y <= position[1] + queryDistance + this.cellSize; y += this.cellSize) {
        const key = this.key([x, y]);

        if (key in this.cells) {
          for (const circle of this.cells[key]) {
            if (isNearCallback(circle)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
  removeAll() {
    this.cells = new Map();
  }
}