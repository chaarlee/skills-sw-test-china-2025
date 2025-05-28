const express = require("express");
const cors = require("cors");
const { v4: uuidv4, validate } = require("uuid");
const PokerEvaluator = require("poker-evaluator");
const Coverage = require("./coverage");

const coverage = new Coverage();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./db.json");

const validateToken = (token) => {
  try {
    const decodedToken = JSON.parse(token);
    // console.log(
    //   "Decoded token:",
    //   decodedToken,
    //   decodedToken.hash,
    //   btoa(decodedToken.validAt)
    // );
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
    coverage.addCoverage("auth.invalid-token");
    return false;
  }
  return true;
};

const getCardsFromString = (cardsString) => {
  const matches = cardsString.matchAll(/([2-9TJQKA]{1}[shdc]{1})/g);
  const cards = Array.from(matches).map((m) => m[0]);
  return cards;
};

const evalTexas = (hand, board) => {
  try {
    const cards = [...hand, ...board];
    const evalHand = PokerEvaluator.evalHand(cards);
    if (evalHand.handType === 9 && evalHand.handRank === 10) {
      evalHand.handName = "royal flush";
    }
    return evalHand.handName;
  } catch (error) {
    console.error("Error evaluating hand:", error);
    coverage.addCoverage("evaluate.texas.error");
    return null;
  }
};

// Routes
app.get("/api/players", (req, res) => {
  const players = db.players.sort((a, b) =>
    a.username.localeCompare(b.username)
  );
  coverage.addCoverage("players.get.all");

  // Pagination logic
  const limit = parseInt(req.query.limit) || players.length;
  const page = parseInt(req.query.page) || 1;
  if (isNaN(limit) || isNaN(page)) {
    coverage.addCoverage("players.get.invalid-limit-or-page");
    return res.status(400).send("Invalid limit or page number");
  }
  if (page > 1) {
    coverage.addCoverage("players.get.page-greater-than-1");
  }
  if (limit != players.length) {
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
    return res.status(404).send("No players found for this page");
  }
  if (end > players.length) {
    coverage.addCoverage("players.get.no-more-players");
    return res.status(404).send("No more players available");
  }
  if (limit < 1 || page < 1) {
    coverage.addCoverage("players.get.invalid-limit-or-page");
    return res.status(400).send("Invalid limit or page number");
  }

  const ret = players.slice(start, end);
  if (ret.length === 0) {
    coverage.addCoverage("players.get.no-players-for-page");
    return res.status(404).send("No players found for this page");
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
    res.status(404).send("Player not found");
  }
});

app.post("/api/players", (req, res) => {
  // auth required
  const authHeader = req.headers.authorization;
  if (!validateAuthHeader(authHeader)) {
    coverage.addCoverage("players.post.auth.invalid-token");
    return res.status(401).send("Invalid token");
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
    return res.status(400).send("Invalid username");
  }
  if (!np.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(np.email)) {
    coverage.addCoverage("players.post.validation.email");
    return res.status(400).send("Invalid email format");
  }
  if (
    !np.birthDate ||
    new Date(np.birthDate) > new Date() ||
    np.birthDate.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(np.birthDate) ||
    !new Date(np.birthDate)
  ) {
    coverage.addCoverage("players.post.validation.birthDate");
    return res.status(400).send("Invalid birth date");
  }
  const age =
    (new Date() - new Date(np.birthDate)) / (1000 * 60 * 60 * 24 * 365);
  if (age < 18) {
    coverage.addCoverage("players.post.validation.age");
    return res.status(400).send("Underage");
  }
  if (typeof np.balance !== "number" || np.balance < 0) {
    coverage.addCoverage("players.post.validation.balance");
    return res.status(400).send("Balance must be greater than 0");
  }
  if (!np.country || !/^[A-Z]{2}$/.test(np.country)) {
    coverage.addCoverage("players.post.validation.country");
    return res.status(400).send("Invalid country code");
  }

  db.players.push(np);
  res.status(201).json(np);
});

app.delete("/api/players/:id", (req, res) => {
  // auth required
  const authHeader = req.headers.authorization;
  if (!validateAuthHeader(authHeader)) {
    coverage.addCoverage("players.delete.auth.invalid-token");
    return res.status(401).send("Invalid token");
  }

  const index = db.players.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    coverage.addCoverage("players.delete.by-id");
    db.players.splice(index, 1);
    res.status(204).send();
  } else {
    coverage.addCoverage("players.delete.by-id.not-found");
    res.status(404).send("Player not found");
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
    return res.status(400).send("Invalid Texas input");
  }
  if (hand.length !== 4) {
    coverage.addCoverage("evaluate.texas.invalid-hand-length");
    return res.status(400).send("Invalid Texas input");
  }
  if (board.length !== 10) {
    coverage.addCoverage("evaluate.texas.invalid-board-length");
    return res.status(400).send("Invalid Texas input");
  }

  const handCards = getCardsFromString(hand);
  if (handCards.length !== 2) {
    coverage.addCoverage("evaluate.texas.invalid-hand-cards");
    return res.status(400).send("Invalid Texas input");
  }
  const boardCards = getCardsFromString(board);
  if (boardCards.length !== 5) {
    coverage.addCoverage("evaluate.texas.invalid-board-cards");
    return res.status(400).send("Invalid Texas input");
  }

  const evalHand = evalTexas(handCards, boardCards);
  if (!evalHand) {
    coverage.addCoverage("evaluate.texas.error");
    return res.status(500).send("Invalid Texas input");
  }
  coverage.addCoverage("evaluate.texas.success");
  res.json(evalHand);
});
app.get("/api/evaluate/omaha", (req, res) => {
  // Placeholder for Omaha Hold'em evaluation logic
  res.json({ message: "Omaha Hold'em evaluation not implemented yet." });
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
    return res.status(400).send("Username and password are required");
  }
  if (!users[username]) {
    coverage.addCoverage("auth.login.unauthorized");
    return res.status(401).send("Unauthorized");
  }
  if (users[username] !== password) {
    coverage.addCoverage("auth.login.invalid-password");
    return res.status(401).send("Unauthorized");
  }
  coverage.addCoverage("auth.login.success");

  const validAt =
    new Date(Date.now() + 1000 * 60).toISOString().slice(0, 19) + "Z"; // valid for 1 mins
  const token = {
    username: username,
    hash: btoa(validAt),
    validAt: validAt,
  };

  res.json({ message: "Login successful", token: JSON.stringify(token) });
});

app.get("/api/coverage", (req, res) => {
  res.json({
    coverage: Array.from(coverage.getCoverage()).sort(),
    value: "TODO %",
  });
});

// Start the server
const PORT = process.env.PORT || 2345;
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
