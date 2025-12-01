export const spatialGrid = class SpatialHash {
  constructor(dimensions) {
    this._cells = new Map();
    this._dimensions = dimensions;
    this._queryIds = 0;
  }
  _getCellIndex(position) {
    const xIndex = Math.floor(Math.floor(position[0] / this._dimensions[0]) * this._dimensions[0]);
    const yIndex = Math.floor(Math.floor(position[1] / this._dimensions[1]) * this._dimensions[1])

    return [xIndex, yIndex];
  }
  _key(i1, i2) {
    return i1 + '.' + i2;
  }
  newClient(position, dimensions) {
    const client = {
      position: position,
      dimensions: dimensions,
      indices: null,
      _queryId: -1,
    };

    this._insert(client);

    return client;
  }
  updateClient(client) {
    this.remove(client);
    this._insert(client);
  }
  findNear(position, bounds) {
    const [x, y] = position;
    const [w, h] = bounds;

    const i1 = this._getCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._getCellIndex([x + w / 2, y + h / 2]);

    const clients = [];
    const queryId = this._queryIds++;

    for (let x = i1[0], xn = i2[0]; x <= xn; x += this._dimensions[0]) {
      for (let y = i1[1], yn = i2[1]; y <= yn; y += this._dimensions[1]) {
        const k = this._key(x, y);

        if (k in this._cells) {
          for (let v of this._cells[k]) {
            if (v._queryId != queryId) {
              v._queryId = queryId;
              clients.push(v);
            }
          }
        }
      }
    }
    return clients;
  }
  isNear(position, bounds, func) {
    const [x, y] = position;
    const [w, h] = bounds;

    const i1 = this._getCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._getCellIndex([x + w / 2, y + h / 2]);

    for (let x = i1[0], xn = i2[0]; x <= xn; x += this._dimensions[0]) {
      for (let y = i1[1], yn = i2[1]; y <= yn; y += this._dimensions[1]) {
        const k = this._key(x, y);

        if (k in this._cells) {
          for (let v of this._cells[k]) {
            if (func(v.position)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  _insert(client) {
    const [x, y] = client.position;
    const [w, h] = client.dimensions;

    const i1 = this._getCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._getCellIndex([x + w / 2, y + h / 2]);

    client.indices = [i1, i2];

    for (let x = i1[0], xn = i2[0]; x <= xn; x += this._dimensions[0]) {
      for (let y = i1[1], yn = i2[1]; y <= yn; y += this._dimensions[1]) {
        const k = this._key(x, y);
        if (!(k in this._cells)) {
          this._cells[k] = new Set();
        }
        this._cells[k].add(client);
      }
    }
  }
  remove(client) {
    const [i1, i2] = client.indices;

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const k = this._key(x, y);

        this._cells[k].delete(client);
      }
    }
  }
  removeAll() {
    this._cells = new Map();
  }
}