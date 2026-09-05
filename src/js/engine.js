/**
 * Compatibility Engine for Hostel Food Compatibility Board
 * Pure logic module implementing diet, allergen, budget, and search rules.
 * Consumes clean, normalized, and pre-validated data from validate.js.
 */

/**
 * Computes the exact list of exclusion reasons for a given dish against residents and budget.
 *
 * Exact ordering contract:
 * 1. Residents in resident table order
 * 2. For each resident -> diet reason first (DIET:<resident>)
 * 3. Followed by allergen reasons (ALLERGEN:<resident>:<tag>) in the dish's ingredient tag order
 * 4. OVER_BUDGET strictly last (after all residents are checked)
 *
 * @param {Object} dish
 * @param {Array} residents
 * @param {number} budget
 * @returns {Array<string>} Array of exclusion reason strings
 */
function getExclusionReasons(dish, residents, budget) {
  const reasons = [];

  // Iterate residents in resident table order
  for (const resident of residents) {
    // 1. Diet check first for this resident
    // VEGAN resident accepts only VEGAN dish
    // VEGETARIAN resident accepts VEGAN or VEGETARIAN dish
    // NON_VEGETARIAN / NO_RESTRICTION accepts any dish
    if (resident.diet === "VEGAN") {
      if (dish.diet !== "VEGAN") {
        reasons.push(`DIET:${resident.name}`);
      }
    } else if (resident.diet === "VEGETARIAN") {
      if (dish.diet !== "VEGAN" && dish.diet !== "VEGETARIAN") {
        reasons.push(`DIET:${resident.name}`);
      }
    }

    // 2. Allergen check follows for this resident
    // Exact match only - no inference, aliases, or cross-contamination
    // Reason ordering follows the dish's ingredient tag order
    if (resident.allergens && resident.allergens.length > 0) {
      const residentAllergens = new Set(resident.allergens);
      for (const tag of dish.tags) {
        if (residentAllergens.has(tag)) {
          reasons.push(`ALLERGEN:${resident.name}:${tag}`);
        }
      }
    }
  }

  // 3. Budget check: positive whole-rupee price <= budget
  // Pushed strictly after all resident checks
  if (dish.price > budget) {
    reasons.push("OVER_BUDGET");
  }

  return reasons;
}

/**
 * Computes compatibility for all dishes against the group of residents and per-person budget.
 * Preserves dish source order in both compatible and excluded results.
 *
 * @param {Array} residents
 * @param {Array} dishes
 * @param {number} budget
 * @returns {Object} { compatible: Array<dish>, excluded: Array<{ dish, reasons }>, totalCompatibleCount: number }
 */
function computeCompatibility(residents, dishes, budget) {
  const compatible = [];
  const excluded = [];

  for (const dish of dishes) {
    const reasons = getExclusionReasons(dish, residents, budget);
    if (reasons.length === 0) {
      compatible.push(dish);
    } else {
      excluded.push({ dish, reasons });
    }
  }

  return {
    compatible,
    excluded,
    totalCompatibleCount: compatible.length
  };
}

/**
 * Filters compatible dishes by a search query.
 * Trims query and performs case-insensitive substring match against:
 * dish.cafe, dish.name, or any tag in dish.tags.
 *
 * @param {Array} compatibleDishes
 * @param {string} query
 * @returns {Array} Filtered list of compatible dishes
 */
function filterCompatibleDishes(compatibleDishes, query) {
  if (!Array.isArray(compatibleDishes)) return [];
  if (typeof query !== "string") return [...compatibleDishes];

  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery === "") {
    return [...compatibleDishes];
  }

  return compatibleDishes.filter(dish => {
    const cafeMatch = dish.cafe.toLowerCase().includes(trimmedQuery);
    const nameMatch = dish.name.toLowerCase().includes(trimmedQuery);
    const tagMatch = dish.tags.some(tag => tag.toLowerCase().includes(trimmedQuery));

    return cafeMatch || nameMatch || tagMatch;
  });
}

// Dual Node / Browser export pattern
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getExclusionReasons,
    computeCompatibility,
    filterCompatibleDishes
  };
}
