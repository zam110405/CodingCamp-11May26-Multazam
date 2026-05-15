# Implementation Plan: Expense and Budget Visualizer

## Overview

Build a fully client-side SPA using plain HTML, CSS, and Vanilla JavaScript. The implementation follows an MVC pattern with `StorageManager` (Model), event handlers in `js/app.js` (Controller), and pure render functions (View). Chart.js is loaded via CDN. All state is persisted in `localStorage`. Testing uses Vitest + fast-check for unit and property-based tests.

## Tasks

- [x] 1. Set up project structure and core files
  - Create `index.html` with semantic HTML skeleton: form, transaction list, balance display, chart canvas, monthly summary section, category form, theme toggle, and toast container
  - Create `css/styles.css` with CSS custom properties for light/dark themes and base layout styles
  - Create `js/app.js` with module-level constants and the `AppState` object
  - Create `tests/unit/` and `tests/property/` directories with a `package.json` and Vitest + fast-check configuration
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 2. Implement `StorageManager` and data persistence
  - [x] 2.1 Implement `StorageManager` with `KEYS`, `isAvailable()`, `load(key)`, and `save(key, value)` methods in `js/app.js`
    - `load` must return `null` on parse errors without throwing; `save` must return `true`/`false`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Implement input validation logic
  - [x] 3.1 Implement `validateTransaction(name, amount, category, categories)` returning `{ valid, errors }` in `js/app.js`
    - Enforce: name non-empty after trim, max 100 chars; amount finite and in range 0.01–999,999,999.99; category present in list
    - _Requirements: 1.4, 1.5_

  - [x] 3.2 Implement `validateCategory(name, existingCategories)` returning `{ valid, error }` in `js/app.js`
    - Enforce: non-empty after trim, max 100 chars, case-insensitive duplicate check, max 50 custom categories
    - _Requirements: 6.3, 6.4, 6.8_
    
- [x] 4. Implement core computation functions
  - [x] 4.1 Implement `computeBalance(transactions)`, `formatAmount(number)`, and `getLocalDateString()` in `js/app.js`
    - `computeBalance` returns a `"$X.XX"` formatted string; `formatAmount` formats any number to two decimal places with `$`
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 4.2 Implement `buildChartData(transactions)` returning `{ labels, data, colors }` in `js/app.js`
    - Exclude categories with zero total; assign deterministic colors per category
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Implement `buildMonthlySummary(transactions)` returning sorted month groups in `js/app.js`
    - Group by `"YYYY-MM"` key, sort descending, sum amounts per category within each group
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

- [-] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement View render functions
  - [x] 6.1 Implement `updateTransactionList(transactions)` in `js/app.js`
    - Render each transaction as `<li>` with name, formatted amount, category, and delete button; show empty-state message when list is empty; display in newest-first order
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [x] 6.2 Implement `updateBalance(transactions)` in `js/app.js`
    - Update `#balance` element text using `computeBalance`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Implement `updateChart(transactions)` in `js/app.js`
    - Initialize Chart.js instance on first call; update `chartInstance.data` and call `chartInstance.update()` on subsequent calls; show/hide `#chart-empty` message; handle Chart.js CDN load failure gracefully
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 6.4 Implement `updateMonthlySummary(transactions)` in `js/app.js`
    - Render month groups using `buildMonthlySummary`; show empty-state message when no transactions exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 6.5 Implement `populateCategorySelector(categories)` in `js/app.js`
    - Populate `#tx-category` `<select>` with all categories from `AppState.categories`
    - _Requirements: 1.1, 1.2, 6.2, 6.6_

- [x] 7. Implement Controller — transaction and category event handlers
  - [x] 7.1 Implement the `#transaction-form` submit handler in `js/app.js`
    - Validate input via `validateTransaction`; on failure display inline errors in `#form-error`; on success create a transaction object with `crypto.randomUUID()` and `getLocalDateString()`, prepend to `AppState.transactions`, persist via `StorageManager.save`, re-render all view components, reset form fields
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1_

  - [x] 7.3 Implement the delete button click handler (event delegation on `#transaction-list`) in `js/app.js`
    - Remove transaction by `data-id` from `AppState.transactions`, persist via `StorageManager.save`, re-render all view components
    - _Requirements: 2.4, 5.2_

  - [x] 7.5 Implement the `#category-form` submit handler in `js/app.js`
    - Validate via `validateCategory`; on failure display inline error in `#cat-error`; on success append to `AppState.categories`, persist via `StorageManager.save`, refresh category selector
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8_

- [x] 8. Implement theme toggle and app initialization
  - [x] 8.1 Implement the `#theme-toggle` click handler in `js/app.js`
    - Toggle `AppState.theme` between `'light'` and `'dark'`, set `data-theme` attribute on `<html>`, update toggle button `aria-label`, persist via `StorageManager.save` (skip error toast per requirement 8.7)
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [x] 8.3 Implement `initApp()` in `js/app.js`
    - Check `StorageManager.isAvailable()`; load transactions, categories, and theme from `localStorage` with fallback defaults and toast warnings on parse errors; call all render functions; attach all event listeners
    - _Requirements: 2.3, 5.3, 5.4, 6.6, 8.4, 8.5, 9.2_

- [x] 9. Implement CSS theming and accessibility styles
  - [x] 9.1 Define CSS custom properties for light and dark themes in `css/styles.css`
    - Use `[data-theme="dark"]` selector to override variables; ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text/UI components) in both themes
    - _Requirements: 8.6, 9.1_

  - [x] 9.2 Style all UI components in `css/styles.css`
    - Style transaction list with overflow scroll, balance display, chart container, monthly summary, forms, toast notification, and empty-state messages; ensure all interactive elements have visible focus indicators
    - _Requirements: 2.2, 9.1, 9.7_

- [x] 10. Implement toast notification system
  - [x] 10.1 Implement `showToast(message, duration)` in `js/app.js`
    - Display message in `#toast` element, auto-dismiss after `duration` ms (default 5000); use `role="status"` and `aria-live="polite"` for accessibility
    - _Requirements: 1.7, 5.4, 5.5, 6.7, 6.9_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** with a minimum of 100 iterations per property; each test file is tagged with `// Feature: expense-budget-visualizer, Property N: <property text>`
- Unit tests use **Vitest** and mock `localStorage` via `vi.stubGlobal`
- Checkpoints ensure incremental validation before moving to the next phase
- The app must work via `file://` protocol — no module bundler or server required

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.3", "3.4", "3.5", "3.6", "3.7", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "6.1", "6.2", "6.3", "6.4", "6.5", "10.1"] },
    { "id": 4, "tasks": ["7.1", "7.3", "7.5", "8.1", "8.3", "9.1", "9.2"] },
    { "id": 5, "tasks": ["7.2", "7.4", "8.2"] }
  ]
}
```
