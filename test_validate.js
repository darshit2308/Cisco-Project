const { BUILT_IN_DATA } = require("./data.js");
const { validateBoard, normalize } = require("./validate.js");

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let passed = 0;
let total = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
  }
}

console.log("--- Running Validation Tests ---");

// Test 1: Built-in data must be valid (null)
{
  const err = validateBoard(BUILT_IN_DATA.residents, BUILT_IN_DATA.dishes, BUILT_IN_DATA.budget);
  assert("Built-in data is completely valid", err === null);
}

// Test 2: normalize helper function
{
  assert("normalize trims and uppercases", normalize("  vegan  ") === "VEGAN");
  assert("normalize mixed case", normalize("VeGaN") === "VEGAN");
  assert("normalize handles non-string safely", normalize(null) === "" && normalize(undefined) === "");
}

// Test 3: Resident name validation
{
  const data = deepClone(BUILT_IN_DATA);
  data.residents[0].name = "   ";
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty resident name with 1-based row index", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 1 && err.field === "name"
  );
}

// Test 4: Resident diet validation (valid diet types)
{
  const data = deepClone(BUILT_IN_DATA);
  data.residents[1].diet = "CARNIVORE";
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects invalid resident diet", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 2 && err.field === "diet"
  );
}

// Test 5: Resident allergens - empty array and non-empty are both valid
{
  const data = deepClone(BUILT_IN_DATA);
  data.residents[0].allergens = [];
  data.residents[1].allergens = ["PEANUT"];
  data.residents[2].allergens = ["MILK", "SOY"];
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Accepts both empty and populated allergen arrays", err === null);
}

// Test 6: Resident allergens - non-array or empty strings rejected
{
  const data = deepClone(BUILT_IN_DATA);
  data.residents[0].allergens = "NOT_AN_ARRAY";
  let err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects non-array allergens", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 1 && err.field === "allergens"
  );

  data.residents[0].allergens = ["  "];
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty allergen tag", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 1 && err.field === "allergens"
  );

  // Explicit check: allergens containing a valid tag followed by whitespace
  data.residents[0].allergens = ["PEANUT", " "];
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects allergens array containing ['PEANUT', ' ']", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 1 && err.field === "allergens"
  );

  // Explicit check: allergens containing null
  data.residents[0].allergens = ["PEANUT", null];
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects allergens array containing null element", 
    err && err.type === "INVALID_INPUT" && err.table === "residents" && err.row === 1 && err.field === "allergens"
  );
}

// Test 7: Dish ID must not be empty or null
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].id = "  ";
  let err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty string dish ID", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.field === "id"
  );

  // Explicit check: dish ID is null
  data.dishes[0].id = null;
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects null dish ID", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === 1 && err.field === "id"
  );

  // Explicit check: dish ID is undefined
  data.dishes[0].id = undefined;
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects undefined dish ID", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === 1 && err.field === "id"
  );
}

// Test 8: Duplicate Dish ID
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[1].id = "D01"; // Duplicate with dishes[0]
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Detects duplicate dish ID with DUPLICATE_DISH_ID", 
    err && err.type === "DUPLICATE_DISH_ID" && err.table === "dishes" && err.row === "D01" && err.field === "id"
  );
}

// Test 9: Dish cafe and name must not be empty
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].cafe = "";
  let err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty cafe name", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "cafe"
  );

  data.dishes[0].cafe = "Hostel Cafe";
  data.dishes[0].name = "  ";
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty dish name", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "name"
  );
}

// Test 10: Dish diet must NOT be NO_RESTRICTION
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].diet = "NO_RESTRICTION";
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects NO_RESTRICTION for dish diet", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "diet"
  );
}

// Test 11: Dish tags must not be empty
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].tags = [];
  let err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty dish tags array", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "tags"
  );

  data.dishes[0].tags = [" "];
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects empty dish tag string", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "tags"
  );
}

// Test 12: Dish price = 0 (Spec acceptance test case)
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].price = 0;
  const err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects dish price of 0 naming D01 row and price field", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "price"
  );
}

// Test 13: Dish price negative and decimals rejected
{
  const data = deepClone(BUILT_IN_DATA);
  data.dishes[0].price = -50;
  let err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects negative dish price", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "price"
  );

  data.dishes[0].price = 99.5;
  err = validateBoard(data.residents, data.dishes, data.budget);
  assert("Rejects decimal dish price (99.5)", 
    err && err.type === "INVALID_INPUT" && err.table === "dishes" && err.row === "D01" && err.field === "price"
  );
}

// Test 14: Budget must be positive integer
{
  const data = deepClone(BUILT_IN_DATA);
  let err = validateBoard(data.residents, data.dishes, 0);
  assert("Rejects budget = 0", 
    err && err.type === "INVALID_INPUT" && err.table === "budget" && err.field === "budget"
  );

  err = validateBoard(data.residents, data.dishes, -100);
  assert("Rejects negative budget", 
    err && err.type === "INVALID_INPUT" && err.table === "budget" && err.field === "budget"
  );

  err = validateBoard(data.residents, data.dishes, 149.99);
  assert("Rejects decimal budget", 
    err && err.type === "INVALID_INPUT" && err.table === "budget" && err.field === "budget"
  );
}

// Test 15: Check ordering (Residents -> Dishes -> Budget)
{
  const data = deepClone(BUILT_IN_DATA);
  data.residents[0].name = "";
  data.dishes[0].price = 0;
  const err = validateBoard(data.residents, data.dishes, -10);
  assert("Stops at resident failure first before dish and budget", 
    err && err.table === "residents" && err.field === "name"
  );
}

console.log(`\nValidation Test Summary: ${passed} / ${total} passed.`);
if (passed !== total) {
  process.exit(1);
}
