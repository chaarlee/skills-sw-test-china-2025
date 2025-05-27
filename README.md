# WorldSkills Software Testing Competition – Poker API Task

## 📌 Table of Contents

- [WorldSkills Software Testing Competition – Poker API Task](#worldskills-software-testing-competition--poker-api-task)
  - [📌 Table of Contents](#-table-of-contents)
  - [🧪 Introduction](#-introduction)
  - [♠️ Domain Description](#️-domain-description)
    - [🔐 Authentication Requirements](#-authentication-requirements)
  - [🛠️ API Endpoints](#️-api-endpoints)
    - [🔐 Authentication](#-authentication)
      - [`POST /api/auth/login`](#post-apiauthlogin)
    - [👤 Player Management (CRUD)](#-player-management-crud)
      - [`GET /api/players`](#get-apiplayers)
      - [`GET /api/players/:id`](#get-apiplayersid)
      - [`POST /api/players`](#post-apiplayers)


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
- Evaluate a single player’s best hand based on their private cards and the community board
- Compare two players’ hands and determine the winner
- Retrieve basic statistics, such as the number of players per country
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
  "token": {
    "username": "admin",
    "hash": "MjAyNS0wNi0wM1QxMzowMDowMFo=",
    "validAt": "2025-06-03T13:00:00Z"
  }
}
```

**Error Response (401): Unauthorized**
```json
{ "error": "Unauthorized" }
```
These errors occur when calling a protected endpoint without a valid token.

### 👤 Player Management (CRUD)

> 🔒 All endpoints below require authentication via `Authorization: Bearer <token>` header

---

#### `GET /api/players`

**Description:** Lists all players, with optional filtering, sorting, and pagination.  
**Authentication:** ✅ Required

**Query Parameters (optional):**
- `country=HU`
- `sort=balance_desc`
- `page=1`
- `limit=10`

**Response Headers:**
- `X-Total-Count`: Total number of players matching the query

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

#### `GET /api/players/:id`

**Description:**  
Retrieves a single player by their unique ID.

**Authentication:** ✅ Required  
You must include the header:

```http
Authorization: Bearer <token>
```

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
{ "error": "Not found" }
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