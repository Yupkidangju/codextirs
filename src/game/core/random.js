import { PIECE_KEYS } from "./pieces.js";

export class BagRandom {
  constructor(seed = Date.now()) {
    this.seed = seed | 0;
    this.bag = [];
  }

  rnd() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  next() {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_KEYS];
      for (let i = this.bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.rnd() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }
}
