# AGENT.md — Hostel Food Compatibility Board

> **Purpose**: This file provides comprehensive architectural context, domain rules, file boundaries, and engineering constraints for any AI coding assistant or engineer working on this repository. Read this file first before inspecting or modifying code.

---

## 1. Project Overview

- **Problem Context**: AI-Assisted Coding Interview Problem (`SI26_P02: Hostel Food Compatibility Board`).
- **Goal**: A compact client-side dashboard helping a group of hostel residents determine which campus cafe dishes are compatible with their collective dietary restrictions, allergen exclusions, and a per-person budget.
- **Tech Stack**: Pure **Vanilla HTML, CSS, JavaScript**.
  - **No external frameworks** (No React, Vue, Next.js, Angular).
  - **No CSS frameworks or build tools** (No Tailwind, SASS, Webpack, Vite, npm scripts).
  - **Zero runtime dependencies**: The entire app runs by double-clicking `index.html`.

---

## 2. Repository Map & Separation of Concerns

```
CISCO-Project/
├── index.html              # Semantic single-screen layout and UI structure
├── README.md               # User-facing summary and running guide
├── agent.md                # AI agent and developer architectural guide (this file)
├── docs/
│   └── design.md           # Architectural decisions, trade-offs, AI collaboration notes
├── src/
│   ├── css/
│   │   └── style.css       # Clean, modern dark-slate design system & micro-interactions
│   └── js/
│       ├── data.js         # Canonical built-in data (residents, dishes, budget)
│       ├── validate.js     # Structural validation & in-place normalization
│       ├── engine.js       # Pure business logic (diet, allergens, budget, search)
│       └── ui.js           # ONLY file allowed to touch the DOM
└── tests/
    ├── test_validate.js    # 27 Node.js unit tests for validation & edge cases
    └── test_engine.js      # 33 Node.js unit tests for compatibility engine rules
```

### Module Responsibilities:

| File | Primary Responsibility | Touches DOM? | Runs in Node? |
| :--- | :--- | :---: | :---: |
| **`data.js`** | Canonical single source of truth for built-in sample data. | ❌ No | ✅ Yes |
| **`validate.js`** | Structural checks (`validateBoard`) and string normalization (`normalize`). Mutates data in-place so downstream files receive clean inputs. | ❌ No | ✅ Yes |
| **`engine.js`** | Evaluates diet hierarchy, allergen exact-matching, budget limits, strict reason ordering, and search filtering. | ❌ No | ✅ Yes |
| **`ui.js`** | Scrapes table inputs, invokes validation, invokes engine, manages alert visibility, and renders cards/badges. | ✅ **YES (Exclusively)** | ❌ No |

---

## 3. Dual-Environment Pattern (Critical)

To ensure the exact same logic files back both browser execution and automated Node.js tests, **never use ES module syntax (`import`/`export`)**.

Every logic file (`data.js`, `validate.js`, `engine.js`) exposes functions to the browser global scope and ends with:
```javascript
if (typeof module !== "undefined" && module.exports) {
  module.exports = { functionA, functionB };
}
```
In `index.html`, scripts are loaded sequentially in dependency order:
```html
<script src="src/js/data.js"></script>
<script src="src/js/validate.js"></script>
<script src="src/js/engine.js"></script>
<script src="src/js/ui.js"></script>
```

---

## 4. Domain Rules & Business Logic Contracts

### A. Diet Acceptance Hierarchy
- `VEGAN` resident: Accepts **only** `VEGAN` dishes.
- `VEGETARIAN` resident: Accepts `VEGAN` and `VEGETARIAN` dishes.
- `NON_VEGETARIAN` & `NO_RESTRICTION` residents: Accept any dish class.
- *Constraint*: `NO_RESTRICTION` is valid for **residents only**; dishes must have a concrete diet (`VEGAN`, `VEGETARIAN`, or `NON_VEGETARIAN`).

### B. Allergen Matching (Strict / No Inference)
- A dish fails if any normalized dish ingredient tag **strictly equals** any normalized allergen of any resident.
- **NO INFERENCE**: Tags like `PEANUTS` or `PEANUT_OIL` do **not** trigger an exclusion for a resident with allergen `PEANUT`. Exact matches only.

### C. Budget Rule
- Positive whole rupee price $\le$ group budget (`price <= budget`).
- **Boundary condition**: When `price === budget` (e.g. D02 at ₹150 with budget ₹150), the dish **passes**.
- Do **not** multiply price by group size.

### D. Exclusion Reasons: Exact Syntax & Ordering Contract
When a dish is incompatible, reasons must be output in this precise order without manual sorting:
1. **Residents evaluated in table order**.
2. **For each resident**: Diet reason (`DIET:<resident>`) emitted **before** allergen reasons.
3. **Allergens for a resident**: Follow the **dish's ingredient tag order** (`ALLERGEN:<resident>:<tag>`).
4. **`OVER_BUDGET`**: Appended **strictly last** after all resident checks have concluded.

*Canonical baseline example*:
- `D03`: `["DIET:Asha", "ALLERGEN:Mira:MILK"]`
- `D04`: `["ALLERGEN:Dev:PEANUT"]`
- `D05`: `["DIET:Asha", "DIET:Dev"]`

### E. Search Filtering & Count Decoupling
- Search query trims whitespace and performs a case-insensitive substring match against:
  1. `dish.cafe`
  2. `dish.name`
  3. Any tag in `dish.tags`
- Search applies **only to compatible dishes**. Excluded dishes are never displayed in search results.
- **Count Decoupling**: The summary badge count (e.g. "2 compatible dishes") is derived strictly from the **unfiltered** compatible set. Filtering via search narrows the displayed cards but **never touches or recalculates the count**.

---

## 5. Validation Contract & Error Signaling

`validateBoard(residents, dishes, budget)` evaluates inputs in strict sequence:
1. **Residents** (row 1 to N, 1-based indexing)
2. **Dishes** (row 1 to N, identified by dish ID)
3. **Budget**

### Error Object Format:
If invalid, halts immediately and returns:
```javascript
{
  type: "INVALID_INPUT" | "DUPLICATE_DISH_ID",
  table: "residents" | "dishes" | "budget",
  row: string | number, // 1-based index for residents/budget, dish ID (e.g. "D01") for dishes
  field: string,        // e.g. "name", "diet", "allergens", "id", "cafe", "tags", "price", "budget"
  message: string
}
```
If valid, returns `null` and mutates string fields in-place (trimmed and uppercased).

---

## 6. How to Run & Verify

### Running the Application:
- **Direct file**: `open index.html` (or double click in file manager).
- **Local HTTP server**: `python3 -m http.server 8000` $\rightarrow$ open `http://localhost:8000`.

### Running Automated Test Suites:
Both test suites use built-in Node.js with zero test framework dependencies:
```bash
# Run validation tests (27 assertions)
node tests/test_validate.js

# Run compatibility engine tests (33 assertions)
node tests/test_engine.js

# Run both together
node tests/test_validate.js && node tests/test_engine.js
```

---

## 7. Guidelines for AI Agents Making Future Changes

1. **Do Not Break DOM Isolation**:
   - If adding a feature, **only** edit `ui.js` for DOM queries, event listeners, or rendering.
   - Keep `engine.js` and `validate.js` pure and testable from Node.js.
2. **Adding a New Diet or Rule**:
   - Update `VALID_RESIDENT_DIETS` and/or `VALID_DISH_DIETS` in `src/js/validate.js`.
   - Add the acceptance logic in `src/js/engine.js`.
   - Add the `<option>` values to the table dropdown generators in `src/js/ui.js`.
   - Add new tests in `tests/test_validate.js` and `tests/test_engine.js`.
3. **Preserve Exclusion Order**:
   - Never sort the output exclusion array after the fact. Maintain the natural sequence: Resident table order $\rightarrow$ Diet $\rightarrow$ Allergens in dish-tag order $\rightarrow$ `OVER_BUDGET` last.
4. **Never Install Heavy Dependencies**:
   - Avoid `npm install` or introducing a bundler unless explicitly directed by the user. Keep startup instant.
