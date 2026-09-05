const { BUILT_IN_DATA } = require("./data.js");
const { getExclusionReasons, computeCompatibility, filterCompatibleDishes } = require("./engine.js");

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

console.log("==========================================================");
console.log("             RUNNING ENGINE UNIT TESTS                   ");
console.log("==========================================================\n");

// ---------------------------------------------------------------------
// TEST 1: BUILT-IN BASELINE COMPATIBILITY & EXCLUSION REASONS
// ---------------------------------------------------------------------
console.log("--- TEST 1: Built-in Baseline Compatibility ---");
{
  const result = computeCompatibility(BUILT_IN_DATA.residents, BUILT_IN_DATA.dishes, BUILT_IN_DATA.budget);
  console.log("Raw computeCompatibility result:", JSON.stringify(result, null, 2));

  assert("Total compatible count is 2", result.totalCompatibleCount === 2);
  assert("Compatible dishes are D01 and D02 in source order",
    result.compatible.length === 2 &&
    result.compatible[0].id === "D01" &&
    result.compatible[1].id === "D02"
  );

  // Map excluded dishes for quick lookup
  const excludedMap = {};
  result.excluded.forEach(item => {
    excludedMap[item.dish.id] = item.reasons;
  });

  console.log("Raw excluded reasons map:", JSON.stringify(excludedMap, null, 2));

  assert("D03 exact exclusion reasons: ['DIET:Asha', 'ALLERGEN:Mira:MILK']",
    JSON.stringify(excludedMap["D03"]) === JSON.stringify(["DIET:Asha", "ALLERGEN:Mira:MILK"])
  );

  assert("D04 exact exclusion reasons: ['ALLERGEN:Dev:PEANUT']",
    JSON.stringify(excludedMap["D04"]) === JSON.stringify(["ALLERGEN:Dev:PEANUT"])
  );

  assert("D05 exact exclusion reasons: ['DIET:Asha', 'DIET:Dev']",
    JSON.stringify(excludedMap["D05"]) === JSON.stringify(["DIET:Asha", "DIET:Dev"])
  );
}

// ---------------------------------------------------------------------
// TEST 2: SEARCH QUERY & COUNT DECOUPLING
// ---------------------------------------------------------------------
console.log("\n--- TEST 2: Search Query & Count Decoupling ---");
{
  const { compatible, totalCompatibleCount } = computeCompatibility(
    BUILT_IN_DATA.residents,
    BUILT_IN_DATA.dishes,
    BUILT_IN_DATA.budget
  );

  // 2a. Query 'wheat' -> only D02 matches, count stays 2
  const searchWheat = filterCompatibleDishes(compatible, "wheat");
  console.log("Raw search 'wheat' displayed dishes:", JSON.stringify(searchWheat.map(d => d.id)));
  assert("Search 'wheat' displays only D02", searchWheat.length === 1 && searchWheat[0].id === "D02");
  assert("Overall compatible count remains 2 after search 'wheat'", totalCompatibleCount === 2);

  // 2b. Clear query '' -> displays both D01 and D02
  const searchEmpty = filterCompatibleDishes(compatible, "");
  console.log("Raw empty search displayed dishes:", JSON.stringify(searchEmpty.map(d => d.id)));
  assert("Empty search restores all compatible dishes", searchEmpty.length === 2);

  // 2c. Substring match in cafe: 'hostel' -> D01
  const searchCafe = filterCompatibleDishes(compatible, "hostel");
  console.log("Raw search 'hostel' (cafe match):", JSON.stringify(searchCafe.map(d => d.id)));
  assert("Search matches cafe name ('hostel' -> D01)", searchCafe.length === 1 && searchCafe[0].id === "D01");

  // 2d. Substring match in dish name: 'tomato' -> D02
  const searchName = filterCompatibleDishes(compatible, "tomato");
  console.log("Raw search 'tomato' (dish name match):", JSON.stringify(searchName.map(d => d.id)));
  assert("Search matches dish name ('tomato' -> D02)", searchName.length === 1 && searchName[0].id === "D02");

  // 2e. Non-matching query 'xyz' -> displays 0, count stays 2
  const searchNone = filterCompatibleDishes(compatible, "xyz");
  console.log("Raw non-matching search 'xyz':", JSON.stringify(searchNone));
  assert("Non-matching search returns empty displayed list", searchNone.length === 0);
  assert("Overall compatible count still remains 2", totalCompatibleCount === 2);

  // 2f. Search must NEVER show incompatible dishes, even if they match the query
  // D04 (Peanut Noodles) has 'PEANUT', but is excluded
  const searchPeanut = filterCompatibleDishes(compatible, "peanut");
  console.log("Raw search 'peanut' on compatible dishes:", JSON.stringify(searchPeanut));
  assert("Search 'peanut' on compatible list yields 0 results (D04 is excluded)", searchPeanut.length === 0);
}

// ---------------------------------------------------------------------
// TEST 3: BUDGET BOUNDARY & BUDGET REDUCTION
// ---------------------------------------------------------------------
console.log("\n--- TEST 3: Budget Boundary & Reduction ---");
{
  // Boundary: D02 price is 150, budget is 150 -> passes
  const boundaryDish = BUILT_IN_DATA.dishes.find(d => d.id === "D02");
  const reasonsBoundary = getExclusionReasons(boundaryDish, BUILT_IN_DATA.residents, 150);
  console.log("Raw D02 (price 150) with budget 150 reasons:", JSON.stringify(reasonsBoundary));
  assert("Dish with price equal to budget passes (reasons = [])", reasonsBoundary.length === 0);

  // Budget reduced to 130
  const reducedResult = computeCompatibility(BUILT_IN_DATA.residents, BUILT_IN_DATA.dishes, 130);
  console.log("Raw budget 130 compatible IDs:", JSON.stringify(reducedResult.compatible.map(d => d.id)));
  assert("Budget 130 leaves only D01 compatible",
    reducedResult.compatible.length === 1 && reducedResult.compatible[0].id === "D01"
  );
  assert("Budget 130 sets compatible count to 1", reducedResult.totalCompatibleCount === 1);

  const d02Excluded = reducedResult.excluded.find(item => item.dish.id === "D02");
  console.log("Raw D02 exclusion reasons under budget 130:", JSON.stringify(d02Excluded.reasons));
  assert("D02 is excluded solely with OVER_BUDGET",
    JSON.stringify(d02Excluded.reasons) === JSON.stringify(["OVER_BUDGET"])
  );
}

// ---------------------------------------------------------------------
// TEST 4: RESIDENT WITH MULTIPLE ALLERGENS (DISH TAG ORDER TEST)
// ---------------------------------------------------------------------
console.log("\n--- TEST 4: Resident with Multiple Allergens (Dish Tag Order) ---");
{
  const residents = [
    { name: "Sam", diet: "NO_RESTRICTION", allergens: ["TOMATO", "WHEAT"] }
  ];

  // Dish has tags in order: WHEAT then TOMATO
  const dishA = { id: "T1", cafe: "Cafe", name: "Dish A", diet: "VEGAN", tags: ["WHEAT", "TOMATO"], price: 100 };
  const reasonsA = getExclusionReasons(dishA, residents, 200);
  console.log("Raw reasons for dishA [WHEAT, TOMATO]:", JSON.stringify(reasonsA));
  assert("Follows dish tag order: WHEAT then TOMATO",
    JSON.stringify(reasonsA) === JSON.stringify(["ALLERGEN:Sam:WHEAT", "ALLERGEN:Sam:TOMATO"])
  );

  // Dish has tags in opposite order: TOMATO then WHEAT
  const dishB = { id: "T2", cafe: "Cafe", name: "Dish B", diet: "VEGAN", tags: ["TOMATO", "WHEAT"], price: 100 };
  const reasonsB = getExclusionReasons(dishB, residents, 200);
  console.log("Raw reasons for dishB [TOMATO, WHEAT]:", JSON.stringify(reasonsB));
  assert("Follows dish tag order: TOMATO then WHEAT",
    JSON.stringify(reasonsB) === JSON.stringify(["ALLERGEN:Sam:TOMATO", "ALLERGEN:Sam:WHEAT"])
  );
}

// ---------------------------------------------------------------------
// TEST 5: MULTIPLE RESIDENTS WITH SAME ALLERGEN (RESIDENT TABLE ORDER)
// ---------------------------------------------------------------------
console.log("\n--- TEST 5: Multiple Residents with Same Allergen ---");
{
  const residents = [
    { name: "Alice", diet: "NO_RESTRICTION", allergens: ["PEANUT"] },
    { name: "Bob", diet: "NO_RESTRICTION", allergens: ["PEANUT"] }
  ];
  const dish = { id: "T3", cafe: "Cafe", name: "Peanut Dish", diet: "VEGAN", tags: ["PEANUT"], price: 100 };
  const reasons = getExclusionReasons(dish, residents, 200);
  console.log("Raw reasons for multiple residents with PEANUT:", JSON.stringify(reasons));
  assert("Follows resident table order: Alice before Bob",
    JSON.stringify(reasons) === JSON.stringify(["ALLERGEN:Alice:PEANUT", "ALLERGEN:Bob:PEANUT"])
  );
}

// ---------------------------------------------------------------------
// TEST 6: DIET REASON BEFORE ALLERGEN REASON FOR SAME RESIDENT
// ---------------------------------------------------------------------
console.log("\n--- TEST 6: Diet Reason Before Allergen Reason for Same Resident ---");
{
  const residents = [
    { name: "Asha", diet: "VEGAN", allergens: ["MILK"] }
  ];
  // Vegetarian dish containing Milk
  const dish = { id: "T4", cafe: "Cafe", name: "Paneer Dish", diet: "VEGETARIAN", tags: ["MILK"], price: 100 };
  const reasons = getExclusionReasons(dish, residents, 200);
  console.log("Raw reasons for diet + allergen failure:", JSON.stringify(reasons));
  assert("Diet reason comes before allergen reason",
    JSON.stringify(reasons) === JSON.stringify(["DIET:Asha", "ALLERGEN:Asha:MILK"])
  );
}

// ---------------------------------------------------------------------
// TEST 7: TRIPLE FAILURE (DIET + ALLERGEN + OVER_BUDGET)
// ---------------------------------------------------------------------
console.log("\n--- TEST 7: Triple Failure (Diet + Allergen + OVER_BUDGET) ---");
{
  const residents = [
    { name: "Asha", diet: "VEGAN", allergens: ["MILK"] },
    { name: "Dev", diet: "VEGETARIAN", allergens: ["PEANUT"] }
  ];
  // Non-vegetarian dish with Milk, Peanut, price 250 > budget 100
  const dish = {
    id: "T5",
    cafe: "Cafe",
    name: "Combo Non-Veg",
    diet: "NON_VEGETARIAN",
    tags: ["MILK", "PEANUT"],
    price: 250
  };
  const reasons = getExclusionReasons(dish, residents, 100);
  console.log("Raw reasons for triple failure:", JSON.stringify(reasons));
  assert("Ordered: Asha diet -> Asha allergen -> Dev diet -> Dev allergen -> OVER_BUDGET last",
    JSON.stringify(reasons) === JSON.stringify([
      "DIET:Asha",
      "ALLERGEN:Asha:MILK",
      "DIET:Dev",
      "ALLERGEN:Dev:PEANUT",
      "OVER_BUDGET"
    ])
  );
}

// ---------------------------------------------------------------------
// TEST 8: RESIDENT DIET ACCEPTANCE HIERARCHY
// ---------------------------------------------------------------------
console.log("\n--- TEST 8: Resident Diet Acceptance Hierarchy ---");
{
  // 8a. NON_VEGETARIAN resident accepts all dish diets
  const nonVegResident = [{ name: "Alex", diet: "NON_VEGETARIAN", allergens: [] }];
  const nonVegDish = { id: "NV", cafe: "C", name: "Meat", diet: "NON_VEGETARIAN", tags: ["MEAT"], price: 50 };
  const vegDish = { id: "V", cafe: "C", name: "Salad", diet: "VEGETARIAN", tags: ["LETTUCE"], price: 50 };
  const veganDish = { id: "VG", cafe: "C", name: "Rice", diet: "VEGAN", tags: ["RICE"], price: 50 };

  assert("NON_VEGETARIAN accepts NON_VEGETARIAN dish", getExclusionReasons(nonVegDish, nonVegResident, 100).length === 0);
  assert("NON_VEGETARIAN accepts VEGETARIAN dish", getExclusionReasons(vegDish, nonVegResident, 100).length === 0);
  assert("NON_VEGETARIAN accepts VEGAN dish", getExclusionReasons(veganDish, nonVegResident, 100).length === 0);

  // 8b. VEGETARIAN resident accepts VEGAN and VEGETARIAN, rejects NON_VEGETARIAN
  const vegResident = [{ name: "Dev", diet: "VEGETARIAN", allergens: [] }];
  assert("VEGETARIAN accepts VEGETARIAN dish", getExclusionReasons(vegDish, vegResident, 100).length === 0);
  assert("VEGETARIAN accepts VEGAN dish", getExclusionReasons(veganDish, vegResident, 100).length === 0);
  assert("VEGETARIAN rejects NON_VEGETARIAN dish",
    JSON.stringify(getExclusionReasons(nonVegDish, vegResident, 100)) === JSON.stringify(["DIET:Dev"])
  );
}

// ---------------------------------------------------------------------
// TEST 9: NO ALLERGEN INFERENCE / EXACT MATCH ONLY
// ---------------------------------------------------------------------
console.log("\n--- TEST 9: Exact Allergen Match Only (No Inference) ---");
{
  const residents = [
    { name: "Dev", diet: "NO_RESTRICTION", allergens: ["PEANUT"] }
  ];
  // Plural 'PEANUTS' or 'PEANUT OIL' should NOT fail - exact match only!
  const dishPlural = { id: "P1", cafe: "C", name: "Dish", diet: "VEGAN", tags: ["PEANUTS"], price: 50 };
  const dishOil = { id: "P2", cafe: "C", name: "Dish", diet: "VEGAN", tags: ["PEANUT_OIL"], price: 50 };

  const reasonsPlural = getExclusionReasons(dishPlural, residents, 100);
  const reasonsOil = getExclusionReasons(dishOil, residents, 100);

  console.log("Raw reasons for 'PEANUTS' vs 'PEANUT':", JSON.stringify(reasonsPlural));
  console.log("Raw reasons for 'PEANUT_OIL' vs 'PEANUT':", JSON.stringify(reasonsOil));

  assert("No inference: 'PEANUTS' tag does not trigger 'PEANUT' allergen", reasonsPlural.length === 0);
  assert("No inference: 'PEANUT_OIL' tag does not trigger 'PEANUT' allergen", reasonsOil.length === 0);
}

// ---------------------------------------------------------------------
// TEST 10: EMPTY LISTS & PRESERVATION OF SOURCE ORDER
// ---------------------------------------------------------------------
console.log("\n--- TEST 10: Empty Lists & Source Order Preservation ---");
{
  // 10a. Empty dishes
  const emptyDishesRes = computeCompatibility(BUILT_IN_DATA.residents, [], 150);
  console.log("Raw empty dishes result:", JSON.stringify(emptyDishesRes));
  assert("Empty dishes returns 0 compatible and 0 excluded",
    emptyDishesRes.compatible.length === 0 &&
    emptyDishesRes.excluded.length === 0 &&
    emptyDishesRes.totalCompatibleCount === 0
  );

  // 10b. Empty residents
  const emptyResidentsRes = computeCompatibility([], BUILT_IN_DATA.dishes, 150);
  console.log("Raw empty residents compatible IDs:", JSON.stringify(emptyResidentsRes.compatible.map(d => d.id)));
  assert("With empty residents, all within-budget dishes are compatible",
    emptyResidentsRes.compatible.length === 5 &&
    emptyResidentsRes.totalCompatibleCount === 5
  );

  // 10c. Source order preservation
  const dishesReversed = deepClone(BUILT_IN_DATA.dishes).reverse();
  const reversedRes = computeCompatibility(BUILT_IN_DATA.residents, dishesReversed, 150);
  console.log("Raw reversed input compatible IDs:", JSON.stringify(reversedRes.compatible.map(d => d.id)));
  assert("Source order is strictly preserved (D02 then D01 when reversed in source)",
    reversedRes.compatible[0].id === "D02" && reversedRes.compatible[1].id === "D01"
  );
}

console.log("\n==========================================================");
console.log(`Engine Test Summary: ${passed} / ${total} passed.`);
console.log("==========================================================");

if (passed !== total) {
  process.exit(1);
}
