const residents = [
  { name: "Asha", diet: "VEGAN", allergens: [] },
  { name: "Dev", diet: "VEGETARIAN", allergens: ["PEANUT"] },
  { name: "Mira", diet: "NO_RESTRICTION", allergens: ["MILK"] }
];

const dishes = [
  { id: "D01", cafe: "Hostel Cafe", name: "Lentil Rice Bowl", diet: "VEGAN", tags: ["LENTIL", "RICE", "SPINACH"], price: 110 },
  { id: "D02", cafe: "Library Cafe", name: "Tomato Pasta", diet: "VEGAN", tags: ["WHEAT", "TOMATO"], price: 150 },
  { id: "D03", cafe: "Hostel Cafe", name: "Paneer Wrap", diet: "VEGETARIAN", tags: ["MILK", "WHEAT"], price: 140 },
  { id: "D04", cafe: "East Cafe", name: "Peanut Noodles", diet: "VEGAN", tags: ["PEANUT", "WHEAT"], price: 130 },
  { id: "D05", cafe: "Library Cafe", name: "Egg Sandwich", diet: "NON_VEGETARIAN", tags: ["EGG", "WHEAT"], price: 100 }
];

const budget = 150;

const BUILT_IN_DATA = { residents, dishes, budget };

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BUILT_IN_DATA, residents, dishes, budget };
}
