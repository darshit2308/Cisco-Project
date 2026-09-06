# Implementation Plan — Hostel Food Compatibility Board

## Goal
Build a small in-browser tool that applies a group's diet/allergen/budget rules to a fixed list of dishes and shows which are compatible, and why the rest are excluded.

## Constraints taken from the problem statement
- No backend, database, or account — everything runs client-side, in memory.
- Search is a secondary, incidental feature — not the main point of the tool.
- Prioritize a working, testable solution over polish (per the interview guide's own "functionality over perfection").

## Tech choice
Vanilla HTML/CSS/JS, zero dependencies, no build step. Nothing to install, opens by double-clicking `index.html`, and it's the fastest thing to explain or modify live if asked to. `data.js`/`validate.js`/`engine.js` are written to work both as plain `<script>` tags in the browser and as `require()`'d modules in Node, so the same files back the live app and the test scripts.

## Steps

### Step 1 — Data model & structural validation
**What:** Lock in the built-in sample data (`data.js`), then write `validate.js` to catch malformed input — empty fields, invalid diet classes, duplicate dish IDs, non-whole prices — before any business logic runs.
**Why first:** Garbage input should never reach the compatibility rules. Catching it early means every later step can assume clean data.
**Checkpoint:** Every structural edge case (empty names, invalid diets, duplicate IDs, bad prices/budget) is covered by a Node test script and passes before moving on.

### Step 2 — Compatibility engine
**What:** `engine.js` — the diet/allergen/budget rules, the exact exclusion-reason ordering, and the search filter. Pure logic, no DOM, so it's directly testable.
**Why this order:** This is the actual hard part of the problem (getting the exclusion-reason ordering exactly right). Isolating it from the UI means a wrong rule shows up as a one-line test failure, not a mystery in the browser.
**Checkpoint:** The engine's test output matches the contract exactly — the built-in compatible list, the exact exclusion reasons per dish, and the budget boundary case.

### Step 3 — Verification checkpoint
**What:** Before writing any HTML, re-check both `validate.js` and `engine.js` against the full contract line by line.
**Why:** A logic bug found here costs a one-line fix and a re-run. The same bug found after the UI exists costs time spent figuring out whether it's the logic or the DOM wiring.
**Checkpoint:** Both test files still pass clean after the re-check; any gap found gets fixed before Step 4 starts.

### Step 4 — Frontend dashboard
**What:** `index.html`, `style.css`, `ui.js` — editable tables, the Check Compatibility / Reset / search controls, wired to the already-verified `validate`/`engine` functions.
**Why last:** The UI is a thin rendering layer over logic that's already proven correct, so bugs at this stage are visual and fast to spot, not silent correctness issues.
**Checkpoint:** A manual walkthrough of every required scenario in the problem statement (built-in result, search narrowing, budget change, invalid price, reset) behaves correctly in the browser.

### Step 5 — Hardening & documentation
**What:** A final pass against every acceptance-criteria line item, then the README, design summary, and test evidence.
**Checkpoint:** Every acceptance-criteria scenario re-verified end-to-end, one last time, before calling it done.

## How this plan was actually used
I created this plan, by using multiple models, to verify it with different edge cases, and scenarios, and engineering decisions, and based on that, I was able to create a robust and comprehensive implementation plan, that was able to cover all the requirements of the problem statement.