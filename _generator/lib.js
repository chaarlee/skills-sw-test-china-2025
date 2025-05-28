const { faker } = require("@faker-js/faker");

faker.setDefaultRefDate(new Date());

const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const round = (value, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

const dateAddDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const convertPhone = (phone) => {
  return phone.replace(/[^0-9]/g, "");
};

const randomPlayer = () => {
  const joinedAt = faker.date.past({ years: 5 });
  return {
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email().toLocaleLowerCase(),
    birthDate: faker.date
      .birthdate({
        min: 18,
        max: 99,
        mode: "age",
      })
      .toISOString()
      .split("T")[0],
    balance: parseFloat(
      faker.finance.amount({ min: 100, max: 10000, precision: 0 })
    ),
    country: faker.helpers.arrayElement([
      "US",
      "HU",
      "DE",
      "FR",
      "CN",
      "BR",
      "IN",
      "JP",
      "AU",
      "CA",
      "GB",
      "CO",
      "SG",
      "KR",
      "HK",
      "MO",
    ]),
  };
};

const json2csv = (json, sep = "\t") => {
  const headers = Object.keys(json[0]);
  let csv = headers.join(sep) + "\n";
  csv += json
    .map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          return value;
        })
        .join(sep);
    })
    .join("\n");
  return csv;
};

module.exports = {
  randomNumber,
  round,
  shuffle,
  dateAddDays,
  convertPhone,
  randomPlayer,
  json2csv,
};
