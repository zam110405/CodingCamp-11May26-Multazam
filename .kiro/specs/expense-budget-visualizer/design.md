# Design Document: Expense and Budget Visualizer

## Overview

The Expense and Budget Visualizer is a fully client-side single-page application (SPA) built with plain HTML, CSS, and Vanilla JavaScript. It requires no build tools, no backend, and no framework. All application state is persisted in the browser's `localStorage`. The app renders a pie chart via Chart.js (loaded from CDN) and provides transaction management, monthly summaries, custom categories, and a dark/light theme toggle.

The entry point is a single `index.html` file. Styles live in `css/styles.css` and all application logic in `js/app.js`. The app must be fully functional when opened via the `file://` protocol in any modern browser.

### Key Design Goals

- **Zero dependencies at runtime** beyond Chart.js via CDN.
- **Immediate reactivity**: every user action (add, delete, toggle) reflects in the UI within 100 ms.
- **Data integrity**: localStorage writes happen synchronously before returning control to the user; failures are surfaced as non-blocking toasts.
- **Accessibility**: WCAG AA contrast ratios in both themes; semantic HTML throughout.

---

## Architecture

The application follows a simple **Model → View → Controller** pattern implemented without any framework:

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │  css/styles  │   │   js/app.js  │  │  Chart.js CDN│  │
│  └──────────────┘   └──────┬───────┘  └──────────────┘  │
│                             │                            │
│          ┌──────────────────┼──────────────────┐         │
│          ▼                  ▼                  ▼         │
│     ┌─────────┐       ┌──────────┐       ┌──────────┐   │
│     │  Model  │◄─────►│Controller│◄─────►│   View   │   │
│     │(Storage)│       │ (app.js) │       │  (DOM)   │   │
│     └─────────┘       └──────────┘       └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Responsibility |
|---|---|
| **Model** | `StorageManager` — read/write `localStorage`; serialize/deserialize state |
| **Controller** | Event handlers in `app.js` — validate input, mutate state, trigger re-renders |
| **View** | Pure render functions — receive state, update DOM and Chart.js instance |

### Data Flow

```
User Action
    │
    ▼
Event Handler (Controller)
    │
    ├─► Validate Input
    │       └─► Show validation error (if invalid) → STOP
    │
    ├─► Mutate In-Memory State
    │
    ├─► Persist to localStorage (StorageManager)
    │       └─► Show toast error (if write fails) → ROLLBACK in-memory state
    │
    └─► Re-render affected View components
            ├─► updateTransactionList()
            ├─► updateBalance()
            ├─► updateChart()
            └─► updateMonthlySummary()
```

---

## Components and Interfaces

### 1. `StorageManager`

Encapsulates all `localStorage` interactions. Exposes a simple key-value interface so the rest of the app never calls `localStorage` directly.

```js
const StorageManager = {
  KEYS: {
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES:   'ebv_categories',
    THEME:        'ebv_theme',
  },

  // Returns parsed value or null; never throws
  load(key) { ... },

  // Returns true on success, false on failure (quota exceeded, etc.)
  save(key, value) { ... },

  // Returns true if localStorage is available
  isAvailable() { ... },
};
```

### 2. `AppState`

A plain object holding the single source of truth for the running application.

```js
const AppState = {
  transactions: [],   // Transaction[]
  categories:   [],   // string[]  (default + custom)
  theme:        'light', // 'light' | 'dark'
};
```

### 3. Input Form Component

HTML `<form id="transaction-form">` with:
- `<input type="text" id="tx-name" maxlength="100">`
- `<input type="number" id="tx-amount" step="0.01" min="0.01" max="999999999.99">`
- `<select id="tx-category">` — populated dynamically from `AppState.categories`
- `<button type="submit">Add Transaction</button>`
- `<div id="form-error" role="alert" aria-live="polite">` — validation messages

### 4. Transaction List Component

`<ul id="transaction-list">` — each item rendered as:

```html
<li class="tx-item" data-id="{id}">
  <span class="tx-name">{name}</span>
  <span class="tx-amount">${amount}</span>
  <span class="tx-category">{category}</span>
  <button class="tx-delete" aria-label="Delete {name}">✕</button>
</li>
```

Empty state: `<p id="empty-state">No expenses recorded yet.</p>`

### 5. Balance Display

`<div id="balance">$0.00</div>` — updated by `updateBalance()` on every state change.

### 6. Pie Chart Component

`<canvas id="spending-chart">` — managed by a single Chart.js instance stored in `chartInstance`. Re-rendered via `chartInstance.data = ...; chartInstance.update()` to avoid destroying and recreating the canvas.

No-data state: `<p id="chart-empty">No data to display</p>` shown/hidden based on transaction count.

### 7. Monthly Summary Component

`<section id="monthly-summary">` — rendered by `updateMonthlySummary()`:

```html
<div class="month-group">
  <h3>May 2025</h3>
  <p class="month-total">Total: $123.45</p>
  <ul class="category-breakdown">
    <li>Food: $80.00</li>
    <li>Transport: $43.45</li>
  </ul>
</div>
```

### 8. Custom Category Manager

`<form id="category-form">` with:
- `<input type="text" id="cat-name" maxlength="100">`
- `<button type="submit">Add Category</button>`
- `<div id="cat-error" role="alert" aria-live="polite">`

### 9. Theme Toggle

`<button id="theme-toggle" aria-label="Switch to dark mode">` — toggles `data-theme` attribute on `<html>` element; CSS variables handle all color changes.

### 10. Toast Notification

`<div id="toast" role="status" aria-live="polite">` — non-blocking, auto-dismisses after 3 seconds. Used for localStorage errors and warnings.

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string} id        - UUID v4 (crypto.randomUUID() or fallback)
 * @property {string} name      - 1–100 characters
 * @property {number} amount    - 0.01 – 999,999,999.99 (stored as number)
 * @property {string} category  - Must match a name in AppState.categories
 * @property {string} date      - ISO 8601 date string (YYYY-MM-DD), local date at time of creation
 */
```

### Stored Shape in localStorage

```json
{
  "ebv_transactions": [
    {
      "id": "a1b2c3d4-...",
      "name": "Lunch",
      "amount": 12.50,
      "category": "Food",
      "date": "2025-05-11"
    }
  ],
  "ebv_categories": ["Food", "Transport", "Fun", "Gym"],
  "ebv_theme": "dark"
}
```

### Validation Rules (enforced in Controller)

| Field | Rule |
|---|---|
| `name` | Non-empty string, stripped of leading/trailing whitespace, max 100 chars |
| `amount` | Finite number, `0.01 ≤ amount ≤ 999,999,999.99`, parsed via `parseFloat` |
| `category` | Must be a non-empty string present in `AppState.categories` |
| `date` | Auto-generated at submission time; not user-editable |

### Category List

- Default categories: `["Food", "Transport", "Fun"]` — always present, cannot be deleted.
- Custom categories: appended to the list; max 50 custom entries.
- Duplicate check: case-insensitive comparison against all existing category names.
- Stored as a flat `string[]` in `localStorage` under `ebv_categories`.

### Monthly Summary Aggregation

Computed on-the-fly from `AppState.transactions` — not stored separately:

```js
// Pseudocode
function buildMonthlySummary(transactions) {
  // Group by "YYYY-MM" key derived from transaction.date
  // Sort groups descending by key
  // Within each group, sum amounts per category
  return monthGroups; // [{ label: "May 2025", total, categories: {name: total} }]
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction Persistence Round-Trip

*For any* valid transaction object, serializing the transaction list to localStorage and then deserializing it should produce a list containing an equivalent transaction (same id, name, amount, category, date).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 2: Balance Equals Sum of Amounts

*For any* non-empty list of transactions, the displayed balance should equal the arithmetic sum of all transaction amounts, formatted to two decimal places.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

---

### Property 3: Adding a Transaction Grows the List by One

*For any* transaction list and any valid transaction input, adding the transaction should result in the transaction list length increasing by exactly one, and the new transaction should appear at the head of the list.

**Validates: Requirements 1.3, 2.6**

---

### Property 4: Deleting a Transaction Removes It from the List

*For any* transaction list containing at least one transaction, deleting a transaction by its id should result in a list that no longer contains that id, with all other transactions unchanged.

**Validates: Requirements 2.4**

---

### Property 5: Whitespace-Only and Empty Names Are Rejected

*For any* string composed entirely of whitespace characters (including the empty string), attempting to add it as a transaction name should be rejected, and the transaction list should remain unchanged.

**Validates: Requirements 1.4**

---

### Property 6: Out-of-Range Amounts Are Rejected

*For any* numeric value that is ≤ 0 or > 999,999,999.99, or any non-numeric input, attempting to add it as a transaction amount should be rejected, and the transaction list should remain unchanged.

**Validates: Requirements 1.5**

---

### Property 7: Chart Segments Match Category Totals

*For any* transaction list, the set of pie chart segments should correspond exactly to the set of categories that have a positive total spending amount, and each segment's percentage should equal that category's total divided by the overall total, rounded to one decimal place.

**Validates: Requirements 4.1, 4.2**

---

### Property 8: Monthly Summary Totals Are Consistent with Transactions

*For any* transaction list, the sum of all monthly totals in the Monthly_Summary should equal the sum of all transaction amounts in the list.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 9: Custom Category Duplicate Rejection (Case-Insensitive)

*For any* existing category list and any new category name whose normalized (lowercased, trimmed) form already exists in the list, attempting to add it should be rejected, and the category list should remain unchanged.

**Validates: Requirements 6.4**

---

### Property 10: Theme Preference Round-Trip

*For any* theme value ('light' or 'dark'), saving it to localStorage and then restoring it on initialization should result in the same theme being applied.

**Validates: Requirements 8.3, 8.4**

---

## Error Handling

### localStorage Unavailability

Detected at startup via `StorageManager.isAvailable()`. If unavailable:
- App initializes with empty state (no transactions, default categories, light theme).
- A non-blocking toast warning is shown: *"Storage unavailable — your data will not be saved this session."*
- All subsequent save calls are silently skipped (no further toasts per action).

### localStorage Write Failure (Quota Exceeded)

Detected by wrapping `localStorage.setItem` in a `try/catch`:
- The in-memory state is **rolled back** to its pre-action value.
- A non-blocking toast error is shown: *"Could not save data — storage quota may be exceeded."*
- The UI is re-rendered to reflect the rolled-back state.

### localStorage Parse Error on Load

If `JSON.parse` throws when reading stored data:
- The affected key is treated as if it were absent.
- App initializes with defaults for that key.
- A non-blocking toast warning is shown once.

### Form Validation Errors

Displayed inline in `<div role="alert" aria-live="polite">` elements adjacent to the relevant form. Errors are cleared on the next valid submission or when the user modifies the field.

### Chart.js Load Failure

If the Chart.js CDN script fails to load (network error):
- The `<canvas>` is hidden.
- A static message is shown: *"Chart unavailable — could not load charting library."*
- All other app functionality continues normally.

### Error Display Rules

| Scenario | Display Method | Auto-dismiss |
|---|---|---|
| Form validation | Inline `role="alert"` | No (cleared on next valid action) |
| localStorage unavailable | Toast | No (persists for session) |
| localStorage write failure | Toast | Yes (5 s) |
| localStorage parse error | Toast | Yes (5 s) |
| Chart.js load failure | Inline static message | No |

---

## Testing Strategy

### Overview

This app is a pure client-side Vanilla JS application with no build pipeline. Testing uses **Vitest** (or Jest) for unit and property-based tests against the pure logic functions extracted from `app.js`, and manual browser testing for UI/integration scenarios.

### Unit Tests

Focus on the pure logic functions that can be tested in isolation:

- `validateTransaction(name, amount, category, categories)` — returns `{ valid, errors }`
- `validateCategory(name, existingCategories)` — returns `{ valid, error }`
- `computeBalance(transactions)` — returns formatted string
- `buildChartData(transactions)` — returns `{ labels, data, colors }`
- `buildMonthlySummary(transactions)` — returns sorted month groups
- `formatAmount(number)` — returns `"$X.XX"` string
- `getLocalDateString()` — returns `"YYYY-MM-DD"` string
- `StorageManager.load` / `StorageManager.save` — with mocked `localStorage`

**Specific examples to cover:**
- Adding a transaction with all valid fields succeeds
- Adding a transaction with an empty name fails
- Adding a transaction with amount = 0 fails
- Adding a transaction with amount = 999,999,999.99 succeeds
- Adding a transaction with amount = 1,000,000,000 fails
- Deleting a transaction that exists removes it
- Deleting a transaction that does not exist leaves the list unchanged
- Balance of empty list is `"$0.00"`
- Chart data excludes categories with zero total
- Monthly summary groups correctly across month boundaries
- Duplicate category (case-insensitive) is rejected
- 51st custom category is rejected

### Property-Based Tests

Use **fast-check** (JavaScript property-based testing library) with a minimum of **100 iterations per property**.

Each test is tagged with a comment referencing the design property:
```js
// Feature: expense-budget-visualizer, Property N: <property text>
```

| Property | Test Description |
|---|---|
| **Property 1** | Generate random valid transaction arrays → serialize → deserialize → assert deep equality |
| **Property 2** | Generate random valid transaction arrays → assert `computeBalance` equals `sum(amounts).toFixed(2)` |
| **Property 3** | Generate random transaction list + valid new transaction → add → assert length +1 and head matches |
| **Property 4** | Generate random non-empty transaction list → delete random item → assert id absent, rest unchanged |
| **Property 5** | Generate whitespace-only strings → assert `validateTransaction` rejects name |
| **Property 6** | Generate out-of-range numbers and non-numeric strings → assert `validateTransaction` rejects amount |
| **Property 7** | Generate random transaction arrays → assert chart segment count = categories with positive total; percentages sum to ~100% |
| **Property 8** | Generate random transaction arrays → assert sum of monthly totals = sum of all amounts |
| **Property 9** | Generate random category list + duplicate name (varied casing) → assert `validateCategory` rejects |
| **Property 10** | For each theme value → save → load → assert restored value matches |

### Integration / Manual Browser Tests

These scenarios require a real browser and cannot be automated without a test harness like Playwright:

- App loads from `file://` protocol in Chrome, Firefox, Edge, Safari
- Transactions persist across page reload
- Theme preference persists across page reload
- Custom categories persist across page reload
- Chart renders correctly with Chart.js from CDN
- UI responds within 100 ms for all interactions
- Dark mode meets WCAG AA contrast ratios (verified with browser DevTools)
- App loads and becomes interactive in under 3 seconds on a 10 Mbps connection

### Test File Structure

```
tests/
  unit/
    validation.test.js
    balance.test.js
    chart.test.js
    monthly-summary.test.js
    storage.test.js
  property/
    transaction-persistence.property.test.js
    balance-sum.property.test.js
    list-mutation.property.test.js
    validation-rejection.property.test.js
    chart-segments.property.test.js
    monthly-totals.property.test.js
    category-duplicate.property.test.js
    theme-roundtrip.property.test.js
```
