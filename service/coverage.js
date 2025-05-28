class Coverage {
  constructor() {
    this.coverage = new Set();
  }

  addCoverage(name) {
    this.coverage.add(name);
  }

  getCoverage() {
    return this.coverage;
  }
}

module.exports = Coverage;
