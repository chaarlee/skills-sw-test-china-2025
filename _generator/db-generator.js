const fs = require("fs");
const { faker } = require("@faker-js/faker");
const { randomPlayer } = require("./lib");

// Poker Domain

const CNT = {
  players: 100,
};

const main = () => {
  const db = {};

  // players
  db.players = faker.helpers.multiple(randomPlayer, {
    count: CNT.players,
  });
  console.log("player example", db.players[0]);
  console.log(`players: ${db.players.length}`);

  // write to db.json
  fs.writeFileSync("./assets/db.json", JSON.stringify(db, null, 2));
  console.log(`db.json created`);
};

main();
