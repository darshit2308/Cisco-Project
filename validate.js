/**
 * Helper function to normalize strings: trims whitespace and converts to uppercase.
 * Handles non-string values safely.
 */
function normalize(str) {
  if (typeof str !== "string") return "";
  return str.trim().toUpperCase();
}

/**
 * Validates the complete board data (residents, dishes, budget).
 * Stops at the first invalid field and returns an error object, or null if valid.
 *
 * Error format:
 * {
 *   type: "INVALID_INPUT" | "DUPLICATE_DISH_ID",
 *   table: "residents" | "dishes" | "budget",
 *   row: number | string, // 1-based index for residents, dish ID for dishes, 1 for budget
 *   field: string,
 *   message: string
 * }
 */
function validateBoard(residents, dishes, budget) {
  const VALID_RESIDENT_DIETS = ["VEGAN", "VEGETARIAN", "NON_VEGETARIAN", "NO_RESTRICTION"];
  const VALID_DISH_DIETS = ["VEGAN", "VEGETARIAN", "NON_VEGETARIAN"];

  // 1. Check Residents
  if (!Array.isArray(residents)) {
    return {
      type: "INVALID_INPUT",
      table: "residents",
      row: 1,
      field: "table",
      message: "Residents must be an array"
    };
  }

  for (let i = 0; i < residents.length; i++) {
    const resident = residents[i];
    const rowNum = i + 1;

    if (!resident || typeof resident !== "object") {
      return {
        type: "INVALID_INPUT",
        table: "residents",
        row: rowNum,
        field: "row",
        message: `Resident at row ${rowNum} is not a valid object`
      };
    }

    // Name must not be empty after trimming
    if (typeof resident.name !== "string" || resident.name.trim() === "") {
      return {
        type: "INVALID_INPUT",
        table: "residents",
        row: rowNum,
        field: "name",
        message: "Resident name must not be empty"
      };
    }

    // Diet must be one of the allowed resident diets
    const normDiet = normalize(resident.diet);
    if (!VALID_RESIDENT_DIETS.includes(normDiet)) {
      return {
        type: "INVALID_INPUT",
        table: "residents",
        row: rowNum,
        field: "diet",
        message: `Resident diet must be one of: ${VALID_RESIDENT_DIETS.join(", ")}`
      };
    }

    // Allergens must be an array
    if (!Array.isArray(resident.allergens)) {
      return {
        type: "INVALID_INPUT",
        table: "residents",
        row: rowNum,
        field: "allergens",
        message: "Resident allergens must be an array"
      };
    }

    // Each allergen tag if present must be a non-empty string after trimming
    for (let a = 0; a < resident.allergens.length; a++) {
      const tag = resident.allergens[a];
      if (typeof tag !== "string" || tag.trim() === "") {
        return {
          type: "INVALID_INPUT",
          table: "residents",
          row: rowNum,
          field: "allergens",
          message: "Allergen tags must be non-empty strings"
        };
      }
    }
  }

  // 2. Check Dishes
  if (!Array.isArray(dishes)) {
    return {
      type: "INVALID_INPUT",
      table: "dishes",
      row: 1,
      field: "table",
      message: "Dishes must be an array"
    };
  }

  const seenDishIds = new Set();

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const fallbackRow = i + 1;

    if (!dish || typeof dish !== "object") {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: fallbackRow,
        field: "row",
        message: `Dish at row ${fallbackRow} is not a valid object`
      };
    }

    // ID must not be empty after trimming
    if (typeof dish.id !== "string" || dish.id.trim() === "") {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: fallbackRow,
        field: "id",
        message: "Dish ID must not be empty"
      };
    }

    const trimmedId = dish.id.trim();
    const rowId = trimmedId;

    // Dish ID must be unique
    const normId = normalize(dish.id);
    if (seenDishIds.has(normId)) {
      return {
        type: "DUPLICATE_DISH_ID",
        table: "dishes",
        row: rowId,
        field: "id",
        message: `Duplicate dish ID: ${trimmedId}`
      };
    }
    seenDishIds.add(normId);

    // Cafe must not be empty after trimming
    if (typeof dish.cafe !== "string" || dish.cafe.trim() === "") {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: rowId,
        field: "cafe",
        message: "Cafe name must not be empty"
      };
    }

    // Dish name must not be empty after trimming
    if (typeof dish.name !== "string" || dish.name.trim() === "") {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: rowId,
        field: "name",
        message: "Dish name must not be empty"
      };
    }

    // Diet must be one of the allowed dish diets (VEGAN, VEGETARIAN, NON_VEGETARIAN)
    const normDishDiet = normalize(dish.diet);
    if (!VALID_DISH_DIETS.includes(normDishDiet)) {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: rowId,
        field: "diet",
        message: `Dish diet must be one of: ${VALID_DISH_DIETS.join(", ")}`
      };
    }

    // Ingredient tags must be a non-empty array with non-empty tags
    if (!Array.isArray(dish.tags) || dish.tags.length === 0) {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: rowId,
        field: "tags",
        message: "Ingredient tags must not be empty"
      };
    }

    for (let t = 0; t < dish.tags.length; t++) {
      const tag = dish.tags[t];
      if (typeof tag !== "string" || tag.trim() === "") {
        return {
          type: "INVALID_INPUT",
          table: "dishes",
          row: rowId,
          field: "tags",
          message: "Ingredient tags must not be empty strings"
        };
      }
    }

    // Price must be a positive whole integer (natural number)
    if (!Number.isInteger(dish.price) || dish.price <= 0) {
      return {
        type: "INVALID_INPUT",
        table: "dishes",
        row: rowId,
        field: "price",
        message: "Dish price must be a positive whole number"
      };
    }
  }

  // 3. Check Budget
  if (!Number.isInteger(budget) || budget <= 0) {
    return {
      type: "INVALID_INPUT",
      table: "budget",
      row: 1,
      field: "budget",
      message: "Budget must be a positive whole number"
    };
  }

  // Everything is valid
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateBoard, normalize };
}
