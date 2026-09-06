# Design Summary — Hostel Food Compatibility Board

## Architecture
- `data.js` — the canonical built-in sample data, shared by the browser and the Node tests, so there's one source of truth instead of two copies drifting apart.
- `validate.js` — structural validation only. Checks names/diets/allergens/tags/prices/budget are well-formed, normalizes casing and whitespace, and mutates the data in place so nothing downstream has to re-normalize it.
- `engine.js` — the actual rules: diet acceptance, allergen matching, budget, exclusion-reason ordering, and the search filter. No DOM — testable directly in Node.
- `ui.js` — the only file that touches the DOM. Scrapes the tables, calls validate → engine in order, and renders the result.
- `tests/` — plain Node scripts, no framework.

The split exists so a live-modification request during the interview usually touches one small function in one file, not a rewrite.

## Technology choices
Vanilla HTML/CSS/JS, zero dependencies, no build step — opens by double-clicking `index.html`. Nothing to install, fewest moving parts to explain and modify live, matches the guide's own "prioritize simplicity and familiar tools."

`data.js`, `validate.js`, and `engine.js` all use a dual export pattern (plain `<script>` global in the browser, `module.exports` in Node) so the exact same logic file backs both the live app and the test scripts.

## How AI shaped decisions
- For the trickiest rule — the exact order exclusion reasons must appear in — I asked for the approach in plain language before any code was generated, so I could catch a wrong design before it got locked into an implementation.
- Before writing tests, I asked what edge cases I might be missing rather than writing the list myself first. That's how the eventual 33-case engine test suite grew well past my original 8.
- After the engine was built and tested, I ran a dedicated "re-verify this against the contract, line by line" pass specifically to catch drift between what was asked for and what got generated.

## Trade-offs
- `validateBoard()` normalizes by mutating its arguments in place rather than returning a clean copy — one fewer object to keep in sync, at the cost of not being a strictly pure function. (Tests account for this by deep-cloning the built-in data before each case.)
- `engine.js` currently trusts that `validateBoard()` already normalized the data — it doesn't normalize defensively on its own. Through the actual UI this is safe (the diet dropdowns only ever send canonical values, and validation always runs first), but calling `computeCompatibility` directly with raw, un-normalized data would silently give a wrong answer. Cheap to close by having `engine.js` call `normalize()` on its own inputs too — noted here deliberately rather than left to be discovered.
- No debounce on the search input, and the optional visual-evidence chips from the problem statement were intentionally skipped — kept the scope matched to the problem's size rather than polishing beyond what was asked.