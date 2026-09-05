# Hostel Food Compatibility Board

A compact, client-side web application built with vanilla HTML, CSS, and JavaScript that determines which dishes from nearby campus cafes are compatible for a group of hostel residents based on their dietary needs, allergen exclusions, and a per-person budget.

---

## Built-in Sample Data Summary

Pre-loaded with 3 residents (**Asha**: Vegan, **Dev**: Vegetarian with peanut allergy, **Mira**: No restrictions with milk allergy), 5 cafe dishes (**D01–D05** ranging from ₹100 to ₹150), and a **₹150 per-person budget**, yielding **D01** and **D02** as compatible.

---

## How to Run the Application

No build tools, package managers, or server installations are required:

1. **Launch the Application**:
   Simply open `index.html` in any modern web browser:
   ```bash
   open index.html
   ```
   *(or double-click `index.html` in your file explorer)*.

2. **Optional Local Server**:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

---

## Test Evidence

Automated unit tests run in Node.js with zero external dependencies:

- **Validation Tests (27 checks)**:
  ```bash
  node tests/test_validate.js
  ```
- **Compatibility Engine Tests (33 checks)**:
  ```bash
  node tests/test_engine.js
  ```
- **Run all tests together**:
  ```bash
  node tests/test_validate.js && node tests/test_engine.js
  ```
