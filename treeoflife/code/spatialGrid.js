export class SpatialGrid {
  constructor(cellSize) {
    this.cells = new Map();
    this.cellSize = cellSize;

    this.maxQueryDistance = 60;
  }
  key(position) {
    return `${Math.floor(position[0] / this.cellSize) * this.cellSize}.${Math.floor(position[1] / this.cellSize) * this.cellSize}`;
  }
  newCircle(position) {
    for (const x of [position[0] - this.maxQueryDistance, position[0] + this.maxQueryDistance]) {
      for (const y of [position[1] - this.maxQueryDistance, position[1] + this.maxQueryDistance]) {
        const key = this.key([x, y]);

        if (!(key in this.cells)) {
          this.cells[key] = new Set();
        }
        this.cells[key].add(position);
      }
    }

    return position;
  }
  isNear(position, isNearCallback) {
    const key = this.key(position);

    if (key in this.cells) {
      for (const circle of this.cells[key]) {
        if (isNearCallback(circle)) {
          return true;
        }
      }
    }

    return false;
  }
  removeAll() {
    this.cells = new Map();
  }
}