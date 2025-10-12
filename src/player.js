export class Player {
  constructor(name, options = {}) {
    this.id = options.id ?? name.toLowerCase().replace(/\s+/g, '-');
    this.name = name;
    this.followers = options.followers ?? 7;
    this.score = 0;
    this.isAI = options.isAI ?? false;
    this.color = options.color ?? null;
  }

  canPlaceFollower() {
    return this.followers > 0;
  }

  useFollower() {
    if (!this.canPlaceFollower()) {
      throw new Error(`${this.name} has no followers left to place.`);
    }
    this.followers -= 1;
  }

  returnFollower(count = 1) {
    this.followers += count;
  }

  addScore(points) {
    this.score += points;
  }
}
