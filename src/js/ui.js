/**
 * ui.js - Single DOM controller for Hostel Food Compatibility Board.
 * Connects data, validation, and engine modules to the user interface.
 */

// Local state for live filtering without re-running compatibility
let currentCompatibleDishes = [];

// DOM Element references
const budgetInput = document.getElementById("budget-input");
const btnCheckCompatibility = document.getElementById("btn-check-compatibility");
const btnReset = document.getElementById("btn-reset");
const validationAlert = document.getElementById("validation-alert");
const compatibleCountSummary = document.getElementById("compatible-count-summary");
const searchInput = document.getElementById("search-input");
const compatibleResultsContainer = document.getElementById("compatible-results");
const excludedResultsContainer = document.getElementById("excluded-results");
const compatibleColumnCount = document.getElementById("compatible-column-count");
const excludedColumnCount = document.getElementById("excluded-column-count");
const residentsTbody = document.getElementById("residents-tbody");
const dishesTbody = document.getElementById("dishes-tbody");
const residentsCountEl = document.getElementById("residents-count");
const dishesCountEl = document.getElementById("dishes-count");

/**
 * Renders the Residents table rows from an array of resident objects.
 */
function renderResidentsTable(residents) {
  residentsTbody.innerHTML = "";
  residents.forEach((r, idx) => {
    const tr = document.createElement("tr");

    // Format allergens as comma-separated string
    const allergensStr = (r.allergens || []).join(", ");

    tr.innerHTML = `
      <td class="row-index">${idx + 1}</td>
      <td><input type="text" class="resident-name" value="${escapeHtml(r.name || "")}" placeholder="Name"></td>
      <td>
        <select class="resident-diet">
          <option value="VEGAN" ${normalizeDiet(r.diet) === "VEGAN" ? "selected" : ""}>VEGAN</option>
          <option value="VEGETARIAN" ${normalizeDiet(r.diet) === "VEGETARIAN" ? "selected" : ""}>VEGETARIAN</option>
          <option value="NON_VEGETARIAN" ${normalizeDiet(r.diet) === "NON_VEGETARIAN" ? "selected" : ""}>NON_VEGETARIAN</option>
          <option value="NO_RESTRICTION" ${normalizeDiet(r.diet) === "NO_RESTRICTION" ? "selected" : ""}>NO_RESTRICTION</option>
        </select>
      </td>
      <td><input type="text" class="resident-allergens" value="${escapeHtml(allergensStr)}" placeholder="e.g. PEANUT, MILK"></td>
    `;
    residentsTbody.appendChild(tr);
  });
  if (residentsCountEl) residentsCountEl.textContent = residents.length;
}

/**
 * Renders the Dishes table rows from an array of dish objects.
 */
function renderDishesTable(dishes) {
  dishesTbody.innerHTML = "";
  dishes.forEach(d => {
    const tr = document.createElement("tr");

    const tagsStr = (d.tags || []).join(", ");
    const priceVal = d.price !== undefined && d.price !== null ? d.price : "";

    tr.innerHTML = `
      <td><input type="text" class="dish-id" value="${escapeHtml(d.id || "")}" placeholder="ID" style="text-align: center; font-weight: 700;"></td>
      <td><input type="text" class="dish-cafe" value="${escapeHtml(d.cafe || "")}" placeholder="Cafe"></td>
      <td><input type="text" class="dish-name" value="${escapeHtml(d.name || "")}" placeholder="Dish Name"></td>
      <td>
        <select class="dish-diet">
          <option value="VEGAN" ${normalizeDiet(d.diet) === "VEGAN" ? "selected" : ""}>VEGAN</option>
          <option value="VEGETARIAN" ${normalizeDiet(d.diet) === "VEGETARIAN" ? "selected" : ""}>VEGETARIAN</option>
          <option value="NON_VEGETARIAN" ${normalizeDiet(d.diet) === "NON_VEGETARIAN" ? "selected" : ""}>NON_VEGETARIAN</option>
        </select>
      </td>
      <td><input type="text" class="dish-tags" value="${escapeHtml(tagsStr)}" placeholder="e.g. WHEAT, TOMATO"></td>
      <td><input type="number" class="dish-price" value="${priceVal}" min="0" step="1" placeholder="Price" style="text-align: right;"></td>
    `;
    dishesTbody.appendChild(tr);
  });
  if (dishesCountEl) dishesCountEl.textContent = dishes.length;
}

/**
 * Scrapes residents from the DOM table into plain JS objects.
 */
function scrapeResidents() {
  const rows = residentsTbody.querySelectorAll("tr");
  const residents = [];

  rows.forEach(row => {
    const nameInput = row.querySelector(".resident-name");
    const dietSelect = row.querySelector(".resident-diet");
    const allergensInput = row.querySelector(".resident-allergens");

    const name = nameInput ? nameInput.value : "";
    const diet = dietSelect ? dietSelect.value : "";
    const rawAllergens = allergensInput ? allergensInput.value : "";

    let allergens = [];
    if (rawAllergens !== undefined && rawAllergens !== null) {
      const trimmed = rawAllergens.trim();
      if (trimmed !== "") {
        if (trimmed.toUpperCase() === "NONE") {
          allergens = [];
        } else {
          // Split by comma; retain trimmed elements (including empty strings if user left trailing commas)
          allergens = rawAllergens.split(",").map(s => s.trim());
        }
      }
    }

    residents.push({ name, diet, allergens });
  });

  return residents;
}

/**
 * Scrapes dishes from the DOM table into plain JS objects.
 */
function scrapeDishes() {
  const rows = dishesTbody.querySelectorAll("tr");
  const dishes = [];

  rows.forEach(row => {
    const idInput = row.querySelector(".dish-id");
    const cafeInput = row.querySelector(".dish-cafe");
    const nameInput = row.querySelector(".dish-name");
    const dietSelect = row.querySelector(".dish-diet");
    const tagsInput = row.querySelector(".dish-tags");
    const priceInput = row.querySelector(".dish-price");

    const id = idInput ? idInput.value : "";
    const cafe = cafeInput ? cafeInput.value : "";
    const name = nameInput ? nameInput.value : "";
    const diet = dietSelect ? dietSelect.value : "";
    const rawTags = tagsInput ? tagsInput.value : "";
    const rawPrice = priceInput ? priceInput.value : "";

    let tags = [];
    if (rawTags !== undefined && rawTags !== null) {
      const trimmedTags = rawTags.trim();
      if (trimmedTags !== "") {
        tags = rawTags.split(",").map(s => s.trim());
      }
    }

    // Parse price: preserve exact number or NaN so validateBoard handles it properly
    let price;
    const trimmedPrice = (rawPrice || "").trim();
    if (trimmedPrice === "") {
      price = NaN;
    } else {
      price = Number(trimmedPrice);
    }

    dishes.push({ id, cafe, name, diet, tags, price });
  });

  return dishes;
}

/**
 * Scrapes the budget input into a number.
 */
function scrapeBudget() {
  const raw = (budgetInput.value || "").trim();
  return raw === "" ? NaN : Number(raw);
}

/**
 * Cleanup step: hides alert, clears results, summary count, and reset local state.
 */
function cleanupResultsAndAlert() {
  validationAlert.classList.add("hidden");
  validationAlert.textContent = "";

  compatibleCountSummary.classList.add("hidden");
  compatibleCountSummary.textContent = "";

  compatibleResultsContainer.innerHTML = '<div class="empty-state">Click "Check Compatibility" to calculate results.</div>';
  excludedResultsContainer.innerHTML = '<div class="empty-state">Excluded dishes and reasons will appear here.</div>';

  if (compatibleColumnCount) compatibleColumnCount.textContent = "0";
  if (excludedColumnCount) excludedColumnCount.textContent = "0";

  currentCompatibleDishes = [];
}

/**
 * Renders only the compatible dishes list (used on initial calculation and live search).
 */
function renderCompatibleList(dishesToRender) {
  compatibleResultsContainer.innerHTML = "";

  if (dishesToRender.length === 0) {
    compatibleResultsContainer.innerHTML = '<div class="empty-state">No matching compatible dishes found.</div>';
    if (compatibleColumnCount) compatibleColumnCount.textContent = "0";
    return;
  }

  if (compatibleColumnCount) compatibleColumnCount.textContent = dishesToRender.length;

  dishesToRender.forEach(dish => {
    const card = document.createElement("div");
    card.className = "dish-card compatible-card";

    const dietClass = (dish.diet || "").toLowerCase();
    const tagsHtml = (dish.tags || [])
      .map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
      .join("");

    card.innerHTML = `
      <div class="dish-card-header">
        <div class="dish-title-group">
          <span class="dish-id-badge">${escapeHtml(dish.id)}</span>
          <span class="dish-name-title">${escapeHtml(dish.name)}</span>
        </div>
        <span class="dish-price-tag">₹${dish.price}</span>
      </div>
      <div class="dish-meta-row">
        <span class="dish-cafe-name">📍 ${escapeHtml(dish.cafe)}</span>
        <span class="diet-tag ${dietClass}">${escapeHtml(dish.diet)}</span>
      </div>
      <div class="dish-ingredients-row">
        ${tagsHtml}
      </div>
    `;

    compatibleResultsContainer.appendChild(card);
  });
}

/**
 * Renders the excluded dishes list with their exact reason strings.
 */
function renderExcludedList(excludedItems) {
  excludedResultsContainer.innerHTML = "";

  if (excludedItems.length === 0) {
    excludedResultsContainer.innerHTML = '<div class="empty-state">No dishes excluded. Everyone can eat everything!</div>';
    if (excludedColumnCount) excludedColumnCount.textContent = "0";
    return;
  }

  if (excludedColumnCount) excludedColumnCount.textContent = excludedItems.length;

  excludedItems.forEach(({ dish, reasons }) => {
    const card = document.createElement("div");
    card.className = "dish-card excluded-card";

    const dietClass = (dish.diet || "").toLowerCase();
    const tagsHtml = (dish.tags || [])
      .map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
      .join("");

    // Exact exclusion reason chips
    const reasonsHtml = reasons.map(r => {
      const isOverBudget = r === "OVER_BUDGET";
      return `<span class="reason-chip ${isOverBudget ? "over-budget" : ""}">${escapeHtml(r)}</span>`;
    }).join("");

    card.innerHTML = `
      <div class="dish-card-header">
        <div class="dish-title-group">
          <span class="dish-id-badge">${escapeHtml(dish.id)}</span>
          <span class="dish-name-title">${escapeHtml(dish.name)}</span>
        </div>
        <span class="dish-price-tag">₹${dish.price}</span>
      </div>
      <div class="dish-meta-row">
        <span class="dish-cafe-name">📍 ${escapeHtml(dish.cafe)}</span>
        <span class="diet-tag ${dietClass}">${escapeHtml(dish.diet)}</span>
      </div>
      <div class="dish-ingredients-row">
        ${tagsHtml}
      </div>
      <div class="exclusion-reasons-box">
        <span class="reasons-title">Exclusion Reasons (${reasons.length}):</span>
        <div class="reasons-list">
          ${reasonsHtml}
        </div>
      </div>
    `;

    excludedResultsContainer.appendChild(card);
  });
}

/**
 * Main compatibility check handler.
 */
function handleCheckCompatibility() {
  // 1. Scrape inputs
  const residents = scrapeResidents();
  const dishes = scrapeDishes();
  const budget = scrapeBudget();

  // 2. Hide alert and clear previous results/summary
  cleanupResultsAndAlert();

  // 3. Validate board data
  const err = validateBoard(residents, dishes, budget);
  if (err !== null) {
    // Show table/row/field in the alert and unhide
    const errorMsg = `${err.type}: Table '${err.table}', Row '${err.row}', Field '${err.field}' — ${err.message}`;
    validationAlert.textContent = errorMsg;
    validationAlert.classList.remove("hidden");
    // Stop without calling engine
    return;
  }

  // 4. Compute compatibility
  const result = computeCompatibility(residents, dishes, budget);
  currentCompatibleDishes = result.compatible;

  // Update summary badge with total count (independent of search)
  const count = result.totalCompatibleCount;
  compatibleCountSummary.textContent = `${count} compatible dish${count === 1 ? "" : "es"}`;
  compatibleCountSummary.classList.remove("hidden");

  // Render compatible list (taking into account any current search input)
  const filtered = filterCompatibleDishes(currentCompatibleDishes, searchInput.value || "");
  renderCompatibleList(filtered);

  // Render excluded list
  renderExcludedList(result.excluded);
}

/**
 * Search input handler: filters displayed compatible dishes live without re-running compatibility or changing count.
 */
function handleSearchInput() {
  if (!currentCompatibleDishes) return;
  const filtered = filterCompatibleDishes(currentCompatibleDishes, searchInput.value || "");
  renderCompatibleList(filtered);
}

/**
 * Reset handler: restores BUILT_IN_DATA, resets budget and search, reuses cleanup step.
 */
function handleReset() {
  if (typeof BUILT_IN_DATA !== "undefined") {
    renderResidentsTable(BUILT_IN_DATA.residents);
    renderDishesTable(BUILT_IN_DATA.dishes);
    budgetInput.value = BUILT_IN_DATA.budget || 150;
  } else {
    budgetInput.value = 150;
  }

  searchInput.value = "";
  cleanupResultsAndAlert();
}

// Helpers
function escapeHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeDiet(diet) {
  if (typeof diet !== "string") return "";
  return diet.trim().toUpperCase();
}

// Attach Event Listeners
btnCheckCompatibility.addEventListener("click", handleCheckCompatibility);
btnReset.addEventListener("click", handleReset);
searchInput.addEventListener("input", handleSearchInput);

// Initial Page Setup
document.addEventListener("DOMContentLoaded", () => {
  handleReset();
});

// If script runs after DOM is already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
  handleReset();
}
