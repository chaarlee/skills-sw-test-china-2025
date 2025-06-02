# WorldSkills Software Testing Competition – Poker API Task

## 📌 Table of Contents

- [WorldSkills Software Testing Competition – Poker API Task](#worldskills-software-testing-competition--poker-api-task)
  - [📌 Table of Contents](#-table-of-contents)
  - [🧪 Introduction](#-introduction)
  - [♠️ Domain Description](#️-domain-description)
    - [🔐 Authentication Requirements](#-authentication-requirements)
  - [🛠️ API Endpoints](#️-api-endpoints)
    - [🧹 Reset Database](#-reset-database)
      - [`GET /api/reset`](#get-apireset)
    - [🔐 Authentication](#-authentication)
      - [`POST /api/auth/login`](#post-apiauthlogin)
    - [👤 Player Management (CRUD)](#-player-management-crud)
      - [`GET /api/players`](#get-apiplayers)
      - [`GET /api/players/:id`](#get-apiplayersid)
      - [`POST /api/players`](#post-apiplayers)
      - [`DELETE /api/players/:id`](#delete-apiplayersid)
    - [📊 Player Statistics by Country](#-player-statistics-by-country)
      - [`GET /api/stats`](#get-apistats)
    - [🃏 Poker Hand Evaluation](#-poker-hand-evaluation)
      - [`GET /api/evaluate/texas`](#get-apievaluatetexas)
      - [`GET /api/evaluate/omaha`](#get-apievaluateomaha)
  - [🧪 Submitting and Validating Tests with Postman \& Newman](#-submitting-and-validating-tests-with-postman--newman)
    - [✅ Goals](#-goals)
    - [🛠️ Setup Instructions](#️-setup-instructions)


## 🧪 Introduction

Welcome to the WorldSkills Software Testing competition task: **API Testing Module**.

In this challenge, your goal is to test a RESTful API that simulates a poker application backend. You will use **Postman** to explore, validate, and automate test cases across multiple API endpoints including authentication, CRUD operations, and complex evaluation logic for poker hands in both **Texas Hold’em** and **Omaha** formats.

This task focuses on your ability to:
- Understand and test REST APIs using Postman
- Design and execute both **functional** and **boundary** test cases
- Handle **authentication** and **dynamic data** using environment variables
- Apply **automated assertions** to verify expected outcomes
- Ensure broad **test coverage** across key endpoints
- Submit your Postman Collection in a way that is **automatically verifiable**

You are encouraged to think like a real-world tester: write clear, reusable tests, identify edge cases, and ensure correctness under different input scenarios. A special `/api/coverage` endpoint is available to validate whether your tests have triggered all required logic branches.

By the end of this task, your Postman collection should reflect a professional-level API test suite that demonstrates thorough understanding, structured execution, and confidence in backend quality assurance.

Good luck, and test smart!

## ♠️ Domain Description

The system under test is a simplified backend for a **poker management and hand evaluation service**. The API simulates a realistic environment where players are registered, their profiles are maintained, and poker hands are evaluated for two popular variants: **Texas Hold’em** and **Omaha**.

This API can be used to:
- Manage a list of poker players using standard **CRUD operations**
- Retrieve basic statistics, such as the number of players per country
- Evaluate a single player’s best hand based on their private cards and the community board
- Validate complex game rules, including edge cases involving hand structure and card usage rules (especially in Omaha)

### 🔐 Authentication Requirements

- All **non-GET** endpoints require **authentication** via a bearer token.
- A valid token can be obtained by calling the `/api/auth/login` endpoint using the predefined credentials.
- The token must be sent with all subsequent protected requests using the header:

```http
Authorization: Bearer <token>
```

## 🛠️ API Endpoints

Below is a list of available endpoints for the Poker API. Each endpoint includes method, path, purpose, authentication requirements, and input/output structure.

### 🧹 Reset Database

#### `GET /api/reset`

**Description:** Reset the database to the original state.   
**Authentication:** ❌ Not required

---

### 🔐 Authentication

#### `POST /api/auth/login`

**Description:** Logs in a user and returns a bearer token.  
**Authentication:** ❌ Not required

**Body (JSON):**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response
```json
{
  "message": "Login successful",
  "token": {
    "username": "admin",
    "hash": "MjAyNS0wNi0wM1QxMzowMDowMFo=",
    "validAt": "2025-06-03T13:00:00Z"
  }
}
```

**Error Response (400): Bad request**
```json
{ "error": "Username and password are required" }
```

**Error Response (401): Unauthorized**
```json
{ "error": "Unauthorized" }
```
These errors occur when calling a protected endpoint without a valid token.

**Valid users**
- `user1`: `123456`
- `user2`: `qwerty`
- `user3`: `asdfgh`

---

### 👤 Player Management (CRUD)

#### `GET /api/players`

**Description:** Lists all players, with optional filtering, and pagination. Default sorted by name ASC.  
**Authentication:** ❌ Not required

**Query Parameters (optional):**
- `country=HU`
- `page=1`
- `limit=10`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "username": "pokerpro",
    "email": "poker@example.com",
    "birthDate": "2000-01-01",
    "balance": 5000,
    "country": "HU"
  }
]
```

**Error Response (400): Bad request**
```json
{ "error": "{message}" }
```
**Error Response (404): Not found**
```json
{ "error": "{message}" }
```

#### `GET /api/players/:id`

**Description:**  Retrieves a single player by their unique ID.
**Authentication:** ❌ Not required

**Path Parameters:**
- `:id` – The unique UUID of the player to fetch

**Response (200):**
```json
{
  "id": "2fbb3c10-8e1c-4e92-bd4e-a1f4f6e2a9d4",
  "username": "pokerpro",
  "email": "poker@example.com",
  "birthDate": "2000-01-01",
  "balance": 5000,
  "country": "HU"
}
```

**Response (404):**
```json
{ "error": "Player not found" }
```

#### `POST /api/players`

**Description:**  
Creates a new player in the system.

**Authentication:** ✅ Required  
Include the header:

```http
Authorization: Bearer <token>
```

**Request Body (JSON):**
```json
{
  "username": "pokerpro",
  "email": "poker@example.com",
  "birthDate": "2000-01-01",
  "balance": 5000,
  "country": "HU"
}
```

**Validation Rules:**

- `username`: required, non-empty string  
- `email`: must be in valid email format  
- `birthDate`: must represent a player aged **18 or older**  
- `balance`: must be a **positive number**  
- `country`: must be a **2-letter ISO country code** (e.g., `"HU"`)

**Error Response (400):**  
Returned when the input is invalid. Possible error messages:

```json
{ "error": "Invalid username" }
```
↳ Username can't be empty

```json
{ "error": "Invalid email format" }
```
↳ The email field is not in a valid email address format.

```json
{ "error": "Underage" }
```
↳ The player's birthDate indicates an age under 18.

```json
{ "error": "Balance must be greater than 0" }
```
↳ The balance field is 0 or negative.

```json
{ "error": "Invalid country code" }
```
↳ The country field is not exactly 2 letters.


#### `DELETE /api/players/:id`

**Description:**  
Deletes a player from the system by their unique ID.

**Authentication:** ✅ Required  
Include the header:

```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `:id` – The unique UUID of the player to delete

**Response (204):**  
No content. The player was successfully deleted.

**Error Response (404):**
```json
{ "error": "Not found" }
```

Note:
Once deleted, the player cannot be recovered. Make sure to use this endpoint carefully during tests.

---

### 📊 Player Statistics by Country

This endpoint provides a summary view of how many players are registered from each country.  
It is useful for verifying the effects of data manipulation (e.g., creation and deletion of players) and does not require authentication.


#### `GET /api/stats`

**Description:**  
Returns the number of registered players grouped by their country code (based on the `country` field of each player).

**Authentication:** ❌ Not required  
This endpoint is public and does **not require a token**.

**Request Example:**

`GET /api/stats`

**Response (200):**
```json
{
  "HU": 3,
  "US": 5,
  "DE": 1,
  "CN": 2
}
```

**Notes:**

- Country codes must follow the ISO 3166-1 alpha-2 standard (e.g., "HU", "US", "CN")
- The response is always a JSON object where:
- keys = country codes (strings)
- values = number of players from that country (integers)

---

### 🃏 Poker Hand Evaluation

This section of the API allows you to evaluate poker hands using standard rules for **Texas Hold’em** and **Omaha**. These endpoints return the best possible 5-card hand that can be formed using the player's hand and the board cards.

The evaluation logic simulates the **showdown phase** of a poker game, where the winner is determined based on hand rankings (e.g., Flush, Full House, Straight, etc.).

These endpoints are **read-only** and do **not require authentication**, making them ideal for public testing, simulation, and rule validation.

---

#### `GET /api/evaluate/texas`

**Description:**  
Evaluates a single Texas Hold’em hand based on exactly 2 private cards and 5 community cards.

**Authentication:** ❌ Not required

**Query Parameters:**
- `hand` – A string of 4 characters representing 2 private cards (e.g., `AhKh`)
- `board` – A string of 10 characters representing 5 board cards (e.g., `QhJhTh2c3d`)

**Request Example:**

`GET /api/evaluate/texas?hand=AhKh&board=QhJhTh2c3d`

**Response (200):**
```json
{
  "handRank": "royal flush"
}
```

**Error Responses (400):**

Missing or invalid number of cards:

```json
{ "error": "Invalid Texas input" }
```

**Validation Rules:**

- hand must contain 2 valid cards (4 characters total)
- board must contain 5 valid cards (10 characters total)
- Duplicate cards across hand and board will be rejected (even if technically possible)

**Note:**
Card notation uses standard abbreviations:

- Ranks: 2–9, T, J, Q, K, A
- Suits: `h` = hearts, `d` = diamonds, `c` = clubs, `s` = spades
- Example: `Ah` = Ace of Hearts, `Td` = Ten of Diamonds

#### `GET /api/evaluate/omaha`

**Description:**  
Evaluates an Omaha poker hand based on 4 private cards and 5 community board cards.  
The evaluation follows official Omaha rules:  
✅ You must use **exactly 2 cards from your hand** and **exactly 3 cards from the board** to form the best 5-card hand.

**Authentication:** ❌ Not required

**Query Parameters:**
- `hand` – A string of 8 characters representing 4 private cards (e.g., `AhKhQdJd`)
- `board` – A string of 10 characters representing 5 board cards (e.g., `Th9h8h2c3d`)

**Request Example:**

`GET /api/evaluate/omaha?hand=AhKhQdJd&board=Th9h8h2c3d`

**Response (200):**
```json
{
  "handRank": "straight flush"
}
```

**Error Responses (400):**

Missing or invalid number of cards:

```json
{ "error": "Invalid Omaha input" }
```

**Validation Rules:**

- hand must contain 4 valid cards (8 characters total)
- board must contain 5 valid cards (10 characters total)
- Duplicate cards across hand and board will be rejected (even if technically possible)

**Poker Hands**

![poker-hands](poker-hands.jpg)

---

## 🧪 Submitting and Validating Tests with Postman & Newman

Participants are expected to create a fully automated test suite in **Postman**, covering all critical functionalities of the poker API.

We will run your tests using **Newman**, Postman's CLI tool, and validate test coverage.

### ✅ Goals

- Automate all required validations:
  - CRUD operations
  - Evaluators (Texas, Omaha, compare)
  - Stats aggregation
  - Authentication handling

- Validate edge cases and failure responses
- Submit a collection that can be executed offline via CLI

### 🛠️ Setup Instructions

1. Import the collection into Postman and complete your tests
2. Export the collection as `worldskills-tests.postman_collection.json`
3. Run it via Newman:

```bash
newman run worldskills-tests.postman_collection.json --reporters cli,json
