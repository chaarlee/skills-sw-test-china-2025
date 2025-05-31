const express = require("express");
const cors = require("cors");
const { v4: uuidv4, validate } = require("uuid");
const fs = require("fs");
const PokerEvaluator = require("poker-evaluator");
const Coverage = require("./coverage");

const coverage = new Coverage();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initialDb = require("./db.json");

let db = {};
// Reset the database to the initial state
const reset = () => {
  db = JSON.parse(JSON.stringify(initialDb)); // Deep copy to reset the db
  console.log(
    "Database reset to initial state",
    db.players.length,
    "players loaded"
  );
};
reset();

// Coverage cases
const content = fs.readFileSync("./index.js", "utf-8");
const coverageCases =
  content
    .match(/coverage\.addCoverage\("([^"]+)"\);/g)
    .map((c) => c.replace(/coverage\.addCoverage\("([^"]+)"\);/, "$1"))
    .sort((a, b) => a.localeCompare(b)) || [];

const difference = (a, b) => {
  const _difference = new Set(a);
  for (const elem of b) {
    _difference.delete(elem);
  }
  return [..._difference];
};

const round = (value, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const validateToken = (token) => {
  try {
    const decodedToken = JSON.parse(token);
    console.log(
      "Decoded token:",
      decodedToken,
      decodedToken.hash,
      btoa(decodedToken.validAt)
    );
    if (decodedToken.hash !== btoa(decodedToken.validAt)) {
      coverage.addCoverage("auth.manipulated-token");
      return false;
    }
    if (!decodedToken.username || !decodedToken.validAt) {
      coverage.addCoverage("auth.invalid-token");
      return false;
    }
    if (new Date(decodedToken.validAt) < new Date()) {
      coverage.addCoverage("auth.token-expired");
      return false;
    }
    coverage.addCoverage("auth.success");
  } catch (error) {
    coverage.addCoverage("auth.error");
    return false;
  }
  return true;
};

const validateAuthHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    coverage.addCoverage("auth.required");
    return false;
  }
  const token = authHeader.split(" ")[1];
  if (!validateToken(token)) {
    return false;
  }
  return true;
};

const getCardsFromString = (cardsString) => {
  const matches = cardsString.matchAll(/([2-9TJQKA]{1}[shdc]{1})/g);
  const cards = Array.from(matches).map((m) => m[0]);
  return cards;
};

const handMap = {
  "one pair": "pair",
  "two pairs": "two pair",
};

const evalTexas = (hand, board) => {
  try {
    const cards = [...hand, ...board];
    const evalHand = PokerEvaluator.evalHand(cards);
    const evalBoard = PokerEvaluator.evalHand(board);
    const eval1Card = PokerEvaluator.evalHand([hand[0], ...board]);
    const eval2Card = PokerEvaluator.evalHand([hand[1], ...board]);
    if (evalHand.value === evalBoard.value) {
      coverage.addCoverage("evaluate.texas.play-board");
    } else if (
      eval1Card.value === evalHand.value ||
      eval2Card.value === evalHand.value
    ) {
      coverage.addCoverage("evaluate.texas.use-one-card");
    } else {
      coverage.addCoverage("evaluate.texas.use-both-cards");
    }
    if (evalHand.handType === 9 && evalHand.handRank === 10) {
      evalHand.handName = "royal flush";
    }

    if (!evalHand.handName) {
      evalHand.handName = "invalid hand";
    }

    let name = evalHand.handName.toLowerCase();
    name = handMap[name] ?? name;
    if (name === "high card") {
      coverage.addCoverage("evaluate.texas.high-card");
    }
    if (name === "pair") {
      coverage.addCoverage("evaluate.texas.pair");
    }
    if (name === "two pair") {
      coverage.addCoverage("evaluate.texas.two-pair");
    }
    if (name === "three of a kind") {
      coverage.addCoverage("evaluate.texas.three-of-a-kind");
    }
    if (name === "straight") {
      coverage.addCoverage("evaluate.texas.straight");
    }
    if (name === "flush") {
      coverage.addCoverage("evaluate.texas.flush");
    }
    if (name === "full house") {
      coverage.addCoverage("evaluate.texas.full-house");
    }
    if (name === "four of a kind") {
      coverage.addCoverage("evaluate.texas.four-of-a-kind");
    }
    if (name === "straight flush") {
      coverage.addCoverage("evaluate.texas.straight-flush");
    }
    if (name === "royal flush") {
      coverage.addCoverage("evaluate.texas.royal-flush");
    }
    return name;
  } catch (error) {
    console.error("Error evaluating hand:", error);
    return null;
  }
};

const evalOmaha = (hand, board) => {
  try {
    const handCombinations = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const boardCombinations = [
      [0, 1, 2],
      [0, 1, 3],
      [0, 1, 4],
      [0, 2, 3],
      [0, 2, 4],
      [0, 3, 4],
      [1, 2, 3],
      [1, 2, 4],
      [1, 3, 4],
      [2, 3, 4],
    ];

    //const evalAllCards = PokerEvaluator.evalHand([...hand, ...board]);
    const evalHands = [];
    for (const handCombo of handCombinations) {
      for (const boardCombo of boardCombinations) {
        const cards = [
          hand[handCombo[0]],
          hand[handCombo[1]],
          board[boardCombo[0]],
          board[boardCombo[1]],
          board[boardCombo[2]],
        ];

        const evalHand = PokerEvaluator.evalHand(cards);
        evalHands.push(evalHand);
      }
    }
    const evalHand = evalHands.sort((a, b) => {
      return b.value - a.value;
    })[0];
    if (evalHand.handType === 9 && evalHand.handRank === 10) {
      evalHand.handName = "royal flush";
    }

    // if (evalAllCards.value > evalHand.value) {
    //   coverage.addCoverage("evaluate.omaha.higher-board");
    // }

    if (!evalHand.handName) {
      evalHand.handName = "invalid hand";
    }

    let name = evalHand.handName.toLowerCase();
    name = handMap[name] ?? name;
    if (name === "high card") {
      coverage.addCoverage("evaluate.omaha.high-card");
    }
    if (name === "pair") {
      coverage.addCoverage("evaluate.omaha.pair");
    }
    if (name === "two pair") {
      coverage.addCoverage("evaluate.omaha.two-pair");
    }
    if (name === "three of a kind") {
      coverage.addCoverage("evaluate.omaha.three-of-a-kind");
    }
    if (name === "straight") {
      coverage.addCoverage("evaluate.omaha.straight");
    }
    if (name === "flush") {
      coverage.addCoverage("evaluate.omaha.flush");
    }
    if (name === "full house") {
      coverage.addCoverage("evaluate.omaha.full-house");
    }
    if (name === "four of a kind") {
      coverage.addCoverage("evaluate.omaha.four-of-a-kind");
    }
    if (name === "straight flush") {
      coverage.addCoverage("evaluate.omaha.straight-flush");
    }
    if (name === "royal flush") {
      coverage.addCoverage("evaluate.omaha.royal-flush");
    }
    return name;
  } catch (error) {
    console.error("Error evaluating hand:", error);
    return null;
  }
};

// Routes
app.get("/api/players", (req, res) => {
  let players = db.players.sort((a, b) => a.username.localeCompare(b.username));
  coverage.addCoverage("players.get.all");

  // Pagination logic
  const limit = parseInt(req.query.limit) || players.length;
  const page = parseInt(req.query.page) || 1;
  const country = req.query.country;
  if (country) {
    if (!/^[A-Z]{2}$/.test(country)) {
      coverage.addCoverage("players.get.invalid-country-code");
      return res.status(400).send({ error: "Invalid country code" });
    }
    coverage.addCoverage("players.get.by-country");
    players = players.filter(
      (p) => p.country && p.country.toLowerCase() === country.toLowerCase()
    );
    console.log("Filtered players by country:", country, players.length);
  }
  if (isNaN(limit) || isNaN(page)) {
    coverage.addCoverage("players.get.invalid-limit-or-page");
    return res.status(400).send({ error: "Invalid limit or page number" });
  }
  if (limit < 1 || page < 1) {
    coverage.addCoverage("players.get.negative-limit-or-page");
    return res.status(400).send({ error: "Invalid limit or page number" });
  }
  if (page > 1) {
    coverage.addCoverage("players.get.page-greater-than-1");
  }
  if (limit !== players.length) {
    coverage.addCoverage("players.get.limit-not-equal-to-total");
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  //   console.log(
  //     `Fetching players: limit=${limit}, page=${page}, start=${start}, end=${end}`,
  //     players.length
  //   );

  if (start >= players.length) {
    coverage.addCoverage("players.get.no-players-for-page");
    return res.status(404).send({ error: "No players found for this page" });
  }
  if (page > Math.ceil(players.length / limit)) {
    coverage.addCoverage("players.get.no-more-players");
    return res.status(404).send({ error: "No more players available" });
  }

  const ret = players.slice(start, end);
  if (ret.length === 0) {
    coverage.addCoverage("players.get.no-players");
    return res.status(404).send({ error: "No players found for this page" });
  }

  // Return paginated players
  res.json(ret);
});

app.get("/api/players/:id", (req, res) => {
  const player = db.players.find((p) => p.id === req.params.id);
  if (player) {
    coverage.addCoverage("players.get.by-id");
    res.json(player);
  } else {
    coverage.addCoverage("players.get.by-id.not-found");
    res.status(404).send({ error: "Player not found" });
  }
});

app.post("/api/players", (req, res) => {
  // auth required
  const authHeader = req.headers.authorization;
  if (!validateAuthHeader(authHeader)) {
    coverage.addCoverage("players.post.auth.invalid-token");
    return res.status(401).send({ error: "Invalid token" });
  }

  const np = {
    ...req.body,
    username: req.body.username.trim(),
    email: req.body.email.trim().toLowerCase(),
    id: uuidv4(),
  };

  // - `username`: required, non-empty string
  // - `email`: must be in valid email format
  // - `birthDate`: must represent a player aged **18 or older**
  // - `balance`: must be a **positive number**
  // - `country`: must be a **2-letter ISO country code** (e.g., `"HU"`)
  if (!np.username) {
    coverage.addCoverage("players.post.validation.username");
    return res.status(400).send({ error: "Invalid username" });
  }
  if (!np.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(np.email)) {
    coverage.addCoverage("players.post.validation.email");
    return res.status(400).send({ error: "Invalid email format" });
  }
  if (
    !np.birthDate ||
    new Date(np.birthDate) > new Date() ||
    np.birthDate.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(np.birthDate) ||
    !new Date(np.birthDate)
  ) {
    coverage.addCoverage("players.post.validation.birthDate");
    return res.status(400).send({ error: "Invalid birth date" });
  }
  const age =
    (new Date() - new Date(np.birthDate)) / (1000 * 60 * 60 * 24 * 365);
  if (age < 18) {
    coverage.addCoverage("players.post.validation.age");
    return res.status(400).send({ error: "Underage" });
  }
  if (typeof np.balance !== "number" || np.balance < 1) {
    coverage.addCoverage("players.post.validation.balance");
    return res.status(400).send({ error: "Balance must be greater than 0" });
  }
  if (!np.country || !/^[A-Z]{2}$/.test(np.country)) {
    coverage.addCoverage("players.post.validation.country");
    return res.status(400).send({ error: "Invalid country code" });
  }

  db.players.push(np);
  // @TODO: add X-Total-Count header
  res.status(201).json(np);
});

app.delete("/api/players/:id", (req, res) => {
  // auth required
  const authHeader = req.headers.authorization;
  if (!validateAuthHeader(authHeader)) {
    coverage.addCoverage("players.delete.auth.invalid-token");
    return res.status(401).send({ error: "Invalid token" });
  }

  const index = db.players.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    coverage.addCoverage("players.delete.by-id");
    db.players.splice(index, 1);
    res.status(204).send();
  } else {
    coverage.addCoverage("players.delete.by-id.not-found");
    res.status(404).send({ error: "Player not found" });
  }
});

app.get("/api/stats", (req, res) => {
  coverage.addCoverage("stats.get.by-country");
  const stats = db.players.reduce((acc, player) => {
    const country = player.country || "Unknown";
    if (!acc[country]) {
      acc[country] = 0;
    }
    acc[country] += 1;
    return acc;
  }, {});

  res.json(stats);
});

app.get("/api/evaluate/texas", (req, res) => {
  const { hand, board } = req.query;
  if (!hand || !board) {
    coverage.addCoverage("evaluate.texas.missing-params");
    return res.status(400).send({ error: "Invalid Texas input" });
  }
  if (hand.length !== 4) {
    coverage.addCoverage("evaluate.texas.invalid-hand-length");
    return res.status(400).send({ error: "Invalid Texas input" });
  }
  if (board.length !== 10) {
    coverage.addCoverage("evaluate.texas.invalid-board-length");
    return res.status(400).send({ error: "Invalid Texas input" });
  }

  const handCards = getCardsFromString(hand);
  if (handCards.length !== 2) {
    coverage.addCoverage("evaluate.texas.invalid-hand-cards");
    return res.status(400).send({ error: "Invalid Texas input" });
  }
  const boardCards = getCardsFromString(board);
  if (boardCards.length !== 5) {
    coverage.addCoverage("evaluate.texas.invalid-board-cards");
    return res.status(400).send({ error: "Invalid Texas input" });
  }

  const evalHand = evalTexas(handCards, boardCards);
  if (!evalHand || evalHand === "invalid hand") {
    coverage.addCoverage("evaluate.texas.error");
    return res.status(500).send({ error: "Invalid Texas input" });
  }
  coverage.addCoverage("evaluate.texas.success");
  res.json({ handRank: evalHand });
});
app.get("/api/evaluate/omaha", (req, res) => {
  const { hand, board } = req.query;
  if (!hand || !board) {
    coverage.addCoverage("evaluate.omaha.missing-params");
    return res.status(400).send({ error: "Invalid Omaha input" });
  }
  if (hand.length !== 8) {
    coverage.addCoverage("evaluate.omaha.invalid-hand-length");
    return res.status(400).send({ error: "Invalid Omaha input" });
  }
  if (board.length !== 10) {
    coverage.addCoverage("evaluate.omaha.invalid-board-length");
    return res.status(400).send({ error: "Invalid Omaha input" });
  }

  const handCards = getCardsFromString(hand);
  if (handCards.length !== 4) {
    coverage.addCoverage("evaluate.omaha.invalid-hand-cards");
    return res.status(400).send({ error: "Invalid Omaha input" });
  }
  const boardCards = getCardsFromString(board);
  if (boardCards.length !== 5) {
    coverage.addCoverage("evaluate.omaha.invalid-board-cards");
    return res.status(400).send({ error: "Invalid Omaha input" });
  }

  const evalHand = evalOmaha(handCards, boardCards);
  if (!evalHand || evalHand === "invalid hand") {
    coverage.addCoverage("evaluate.omaha.error");
    return res.status(500).send({ error: "Invalid Omaha input" });
  }
  coverage.addCoverage("evaluate.omaha.success");
  res.json({ handRank: evalHand });
});

// Authentication route (placeholder)
app.post("/api/auth/login", (req, res) => {
  const users = {
    user1: "123456",
    user2: "qwerty",
    user3: "asdfgh",
  };
  const { username, password } = req.body;

  if (!username || !password) {
    coverage.addCoverage("auth.login.missing-credentials");
    return res
      .status(400)
      .send({ error: "Username and password are required" });
  }
  if (!users[username]) {
    coverage.addCoverage("auth.login.unauthorized");
    return res.status(401).send({ error: "Unauthorized" });
  }
  if (users[username] !== password) {
    coverage.addCoverage("auth.login.invalid-password");
    return res.status(401).send({ error: "Unauthorized" });
  }
  coverage.addCoverage("auth.login.success");

  const validAt =
    new Date(Date.now() + 1000 * 120).toISOString().slice(0, 19) + "Z"; // valid for 2 mins
  const token = {
    username: username,
    hash: btoa(validAt),
    validAt: validAt,
  };

  res.json({ message: "Login successful", token: JSON.stringify(token) });
});

app.get("/api/coverage", (req, res) => {
  const c = coverage.getCoverage();
  const cEvaluate = coverageCases.filter((e) => e.startsWith("evaluate."));
  const cCRUD = coverageCases.filter((e) => !e.startsWith("evaluate."));
  const diff = difference(coverageCases, c);
  const diffEvaluate = difference(cEvaluate, c);
  const diffCRUD = difference(cCRUD, c);
  res.json({
    value: {
      total: round((c.length / coverageCases.length) * 100, 2),
      crud: round(((cCRUD.length - diffCRUD.length) / cCRUD.length) * 100, 2),
      evaluate: round(
        ((cEvaluate.length - diffEvaluate.length) / cEvaluate.length) * 100,
        2
      ),
    },
    coveredCases: {
      total: coverageCases.length,
      crud: cCRUD.length,
      evaluate: cEvaluate.length,
    },
    covered: c,
    missing: {
      crud: diffCRUD,
      evaluate: diffEvaluate,
      total: diff,
    },
    testCases: {
      crud: cCRUD,
      evaluate: cEvaluate,
      total: coverageCases,
    },
  });
});

app.get("/api/reset", (req, res) => {
  reset();
  res.status(200).send("Database reset successfully");
});

let port = 2345;

const args = process.argv.slice(2);
if (args[0]) {
  port = parseInt(args[0], 10);
}

// Start the server
const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// API Documentation
// - [🔐 Authentication](#-authentication)
//   - [`POST /api/auth/login`](#post-apiauthlogin)
// - [👤 Player Management (CRUD)](#-player-management-crud)
//   - [`GET /api/players`](#get-apiplayers)
//   - [`GET /api/players/:id`](#get-apiplayersid)
//   - [`POST /api/players`](#post-apiplayers)
//   - [`DELETE /api/players/:id`](#delete-apiplayersid)
// - [📊 Player Statistics by Country](#-player-statistics-by-country)
//   - [`GET /api/stats`](#get-apistats)
// - [🃏 Poker Hand Evaluation](#-poker-hand-evaluation)
//   - [`GET /api/evaluate/texas`](#get-apievaluatetexas)
//   - [`GET /api/evaluate/omaha`](#get-apievaluateomaha)
