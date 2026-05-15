# Requirements Document

## Introduction

The Expense and Budget Visualizer is a client-side web application that allows users to track personal expenses, visualize spending distribution by category, and monitor their financial activity over time. The application runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted in the browser's Local Storage. It requires no backend server, no build tools, and no complex setup. Users can add transactions, delete them, view a live-updating pie chart, browse a monthly summary, manage custom categories, and toggle between dark and light themes.

## Glossary

- **App**: The Expense and Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of a name, amount, and category.
- **Category**: A label grouping transactions (e.g., Food, Transport, Fun, or a user-defined custom category).
- **Balance**: The running total of all transaction amounts currently stored (net sum).
- **Chart**: The pie chart that visualizes spending distribution across categories.
- **Local_Storage**: The browser's Web Storage API used to persist all application data client-side.
- **Transaction_List**: The scrollable UI component that displays all stored transactions.
- **Input_Form**: The UI form used to submit new transactions.
- **Monthly_Summary**: A view that aggregates and displays transaction totals grouped by calendar month.
- **Theme**: The visual color scheme of the App, either light or dark.
- **Custom_Category**: A user-defined category name added beyond the default set.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can record a new expense.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the transaction name (maximum 100 characters), a numeric field for the amount, and a category selector.
2. THE Input_Form SHALL populate the category selector with at minimum the default categories: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form with all fields filled and an amount in the range 0.01 to 999,999,999.99, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
4. WHEN the user submits the Input_Form with one or more empty fields, THE Input_Form SHALL display a validation error message identifying the missing field(s) and SHALL NOT add a transaction.
5. WHEN the user submits the Input_Form with a non-numeric amount, a value ≤ 0, or a value > 999,999,999.99, THE Input_Form SHALL display a validation error message and SHALL NOT add a transaction.
6. WHEN a transaction is successfully added, THE Input_Form SHALL reset the name and amount fields to empty and reset the category selector to its blank placeholder.
7. IF Local_Storage is unavailable when the user submits the Input_Form, THEN THE App SHALL display a non-blocking error message and SHALL NOT add the transaction to the Transaction_List.

---

### Requirement 2: View and Delete Transactions

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list and be able to remove any of them so that I can manage my expense history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the transaction name, amount formatted to two decimal places, and category.
2. THE Transaction_List SHALL enable vertical scrolling when its content overflows the visible container height; when content does not overflow, scrolling is not required.
3. WHEN the App loads, THE Transaction_List SHALL render all transactions previously persisted in Local_Storage, displayed in newest-first order.
4. WHEN the user activates the delete control on a transaction, THE App SHALL immediately remove that transaction from the Transaction_List UI and from Local_Storage.
5. WHEN the Transaction_List contains no transactions, THE App SHALL display an empty-state message indicating no expenses have been recorded.
6. THE Transaction_List SHALL display transactions in newest-first order (most recently added transaction appears at the top).

---

### Requirement 3: Display Total Balance

**User Story:** As a user, I want to see my total spending balance at the top of the page so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the total balance as the net sum of all transaction amounts at the top of the page, formatted with a currency symbol and two decimal places (e.g., $0.00).
2. WHEN a transaction is added, THE App SHALL update the displayed balance to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL update the displayed balance to reflect the new total without requiring a page reload.
4. WHEN the Transaction_List is empty, THE App SHALL display a balance of $0.00.
5. WHEN the Transaction_List is non-empty, THE App SHALL display the calculated net sum of all transaction amounts, formatted with a currency symbol and two decimal places, even if that sum equals zero.

---

### Requirement 4: Visualize Spending with a Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going at a glance.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart that shows each category's share of total spending as a proportional segment; categories with zero spending SHALL be excluded from the chart.
2. THE Chart SHALL label each segment with the corresponding category name and its percentage of total spending rounded to one decimal place.
3. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new spending distribution.
4. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the revised spending distribution.
5. WHEN no transactions exist, THE Chart SHALL display a visible text message (e.g., "No data to display") in place of the chart.
6. THE App SHALL use Chart.js loaded via CDN to render the Chart as a pie chart.

---

### Requirement 5: Persist Data Across Sessions

**User Story:** As a user, I want my transactions to be saved so that my data is still available when I reopen the browser or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the updated transaction list to Local_Storage before the next user interaction is processed.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to Local_Storage before the next user interaction is processed.
3. WHEN the App initializes, THE App SHALL read all transactions from Local_Storage and restore the Transaction_List, Balance, and Chart to values derived from the persisted transactions.
4. IF Local_Storage is unavailable or returns a parse error on initialization, THEN THE App SHALL initialize with an empty transaction list and SHALL display a non-blocking warning (no modal or alert dialog) to the user.
5. IF a Local_Storage write operation fails (e.g., quota exceeded), THEN THE App SHALL display a non-blocking error message and SHALL NOT update the in-memory transaction list to prevent data inconsistency.

---

### Requirement 6: Manage Custom Categories

**User Story:** As a user, I want to add my own custom categories beyond the defaults so that I can organize expenses in a way that fits my personal spending habits.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated input control that allows the user to enter and save a new Custom_Category name of up to 100 characters.
2. WHEN the user saves a Custom_Category, THE App SHALL add it to the category selector in the Input_Form immediately.
3. WHEN the user saves a Custom_Category with an empty, whitespace-only, or name exceeding 100 characters, THE App SHALL display a validation error and SHALL NOT add the category.
4. WHEN the user saves a Custom_Category whose name (case-insensitive) already exists in the category list, THE App SHALL display a duplicate error and SHALL NOT add the category.
5. WHEN the user saves a valid Custom_Category, THE App SHALL persist it to Local_Storage immediately.
6. WHEN the App initializes, THE App SHALL restore all previously saved Custom_Category entries into the category selector.
7. IF the Local_Storage save for a Custom_Category fails, THEN THE App SHALL display a non-blocking error message and SHALL NOT add the category to the selector.
8. WHEN the total number of custom categories reaches 50, THE App SHALL display an error message and SHALL NOT allow additional custom categories to be added.
9. IF Local_Storage restore of custom categories fails on initialization, THEN THE App SHALL initialize with only the default categories and SHALL display a non-blocking warning.

---

### Requirement 7: Monthly Summary View

**User Story:** As a user, I want to view a summary of my spending grouped by month so that I can track how my expenses change over time.

#### Acceptance Criteria

1. THE App SHALL provide a Monthly_Summary view that groups transactions by calendar month and year (e.g., "May 2025").
2. THE Monthly_Summary SHALL display the total spending amount for each month that contains at least one transaction.
3. THE Monthly_Summary SHALL display a per-category breakdown of spending totals within each month; transactions without a recognized category SHALL be grouped under an "Uncategorized" label.
4. WHEN a transaction is added, THE Monthly_Summary SHALL update to include the new transaction in the correct month group.
5. WHEN a transaction is deleted, THE Monthly_Summary SHALL update to reflect the removal from the correct month group.
6. IF the Transaction_List contains no transaction records, THEN THE Monthly_Summary SHALL display an empty-state message.
7. WHEN transactions exist, THE Monthly_Summary SHALL display the grouped summary with months sorted in most-recent-first order.
8. THE App SHALL record the date of each transaction at the time it is added, using the user's local date, and use this date for Monthly_Summary grouping.

---

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light visual themes so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between light mode and dark mode.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all visible UI elements within 100 milliseconds without a page reload.
3. WHEN the user activates the toggle, THE App SHALL persist the selected Theme preference to Local_Storage.
4. WHEN the App initializes and a Theme preference exists in Local_Storage, THE App SHALL restore that saved Theme preference.
5. WHEN the App initializes and no Theme preference is saved in Local_Storage, THE App SHALL default to light mode.
6. WHILE dark mode is active, THE App SHALL ensure all text and UI controls meet WCAG AA contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text and UI components).
7. IF Local_Storage is unavailable when persisting the Theme preference, THEN THE App SHALL still apply the selected Theme for the current session without displaying an error.

---

### Requirement 9: Technical Constraints

**User Story:** As a developer, I want the application to be built with plain HTML, CSS, and Vanilla JavaScript so that it requires no build tools, no server, and no framework dependencies.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no frontend frameworks (e.g., no React, Vue, or Angular).
2. THE App SHALL require no backend server and SHALL be fully functional — including transaction add/delete, Local_Storage persistence, pie chart rendering, monthly summary, custom categories, and theme toggle — when opened as a local file (file:// protocol) in a modern browser.
3. THE App SHALL store all data exclusively in Local_Storage with no external API calls for data persistence.
4. THE App SHALL use a single CSS file located at `css/styles.css` and a single JavaScript file located at `js/app.js`.
5. THE App SHALL be compatible with the latest stable release of Chrome, Firefox, Edge, and Safari available at the time of testing.
6. THE App SHALL load and become interactive — defined as the point at which the user can perform the first input action — in under 3 seconds on a connection of at least 10 Mbps download speed.
7. WHEN the user interacts with any UI control (add, delete, toggle, chart update), THE App SHALL reflect the change within 100 milliseconds.
