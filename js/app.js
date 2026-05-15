/**
 * Expense & Budget Visualizer
 * Single-file Vanilla JS application — no build tools, no framework.
 * Works via file:// protocol in any modern browser.
 */

'use strict';

/* ============================================================
   Module-level Constants
   ============================================================ */

/** Default categories always present in the app. */
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

/** Maximum length for transaction names and category names. */
const MAX_NAME_LENGTH = 100;

/** Maximum number of custom (user-added) categories. */
const MAX_CUSTOM_CATEGORIES = 50;

/** Valid amount range. */
const AMOUNT_MIN = 0.01;
const AMOUNT_MAX = 999_999_999.99;

/** Auto-dismiss duration for toast notifications (ms). */
const TOAST_DURATION_MS = 5000;

/* ============================================================
   AppState — Single Source of Truth
   ============================================================ */

/**
 * @typedef {Object} Transaction
 * @property {string} id       - UUID v4
 * @property {string} name     - 1–100 characters
 * @property {number} amount   - 0.01 – 999,999,999.99
 * @property {string} category - Must match a name in AppState.categories
 * @property {string} date     - YYYY-MM-DD (local date at time of creation)
 */

/**
 * Central application state object.
 * All mutations go through this object; render functions read from it.
 */
const AppState = {
  /** @type {Transaction[]} */
  transactions: [],

  /** @type {string[]} All category names (default + custom). */
  categories: [...DEFAULT_CATEGORIES],

  /** @type {'light'|'dark'} Current theme. */
  theme: 'light',
};

/* ============================================================
   StorageManager — localStorage abstraction
   ============================================================ */

const StorageManager = {
  KEYS: {
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES:   'ebv_categories',
    THEME:        'ebv_theme',
  },

  /**
   * Returns true if localStorage is available and writable.
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__ebv_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Loads and parses a value from localStorage.
   * Returns null on missing key or parse error — never throws.
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Serializes and saves a value to localStorage.
   * Returns true on success, false on failure (e.g. quota exceeded).
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

/* ============================================================
   Validation
   ============================================================ */

/**
 * Validates the fields for a new transaction.
 *
 * @param {string} name        - Transaction name (will be trimmed internally)
 * @param {*}      amount      - Raw amount value (number or string from input)
 * @param {string} category    - Selected category name
 * @param {string[]} categories - Current list of valid category names
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTransaction(name, amount, category, categories) {
  const errors = [];

  // --- name validation ---
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length === 0) {
    errors.push('Name is required.');
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.push(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }

  // --- amount validation ---
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!isFinite(numericAmount) || numericAmount < AMOUNT_MIN || numericAmount > AMOUNT_MAX) {
    errors.push(`Amount must be a number between ${AMOUNT_MIN} and ${AMOUNT_MAX}.`);
  }

  // --- category validation ---
  if (!Array.isArray(categories) || !categories.includes(category)) {
    errors.push('Category must be selected from the available list.');
  }

  return { valid: errors.length === 0, errors };
}

/* ============================================================
   Validation Helpers
   ============================================================ */

/**
 * Validates a new custom category name against the existing category list.
 *
 * Rules:
 *  - Name must be non-empty after trimming whitespace.
 *  - Name must not exceed MAX_NAME_LENGTH (100) characters.
 *  - Name must not already exist in existingCategories (case-insensitive).
 *  - The number of custom categories (existingCategories.length - DEFAULT_CATEGORIES.length)
 *    must be less than MAX_CUSTOM_CATEGORIES (50).
 *
 * @param {string} name - The proposed category name.
 * @param {string[]} existingCategories - Current full category list (default + custom).
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateCategory(name, existingCategories) {
  const trimmed = typeof name === 'string' ? name.trim() : '';

  if (trimmed.length === 0) {
    return { valid: false, error: 'Category name cannot be empty.' };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Category name cannot exceed ${MAX_NAME_LENGTH} characters.` };
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = existingCategories.some(
    (cat) => cat.toLowerCase() === lowerTrimmed
  );
  if (isDuplicate) {
    return { valid: false, error: 'A category with that name already exists.' };
  }

  const customCount = existingCategories.length - DEFAULT_CATEGORIES.length;
  if (customCount >= MAX_CUSTOM_CATEGORIES) {
    return { valid: false, error: `You cannot add more than ${MAX_CUSTOM_CATEGORIES} custom categories.` };
  }

  return { valid: true, error: null };
}

/* ============================================================
   Pure Logic Helpers — Tasks 4.1, 4.2, 4.3
   ============================================================ */

/**
 * Formats a number as a USD currency string with two decimal places.
 * @param {number} number
 * @returns {string} e.g. "$12.50"
 */
function formatAmount(number) {
  return '$' + Number(number).toFixed(2);
}

/**
 * Returns the net sum of all transaction amounts as a formatted currency string.
 * Returns "$0.00" for an empty list.
 * @param {Transaction[]} transactions
 * @returns {string} e.g. "$42.00"
 */
function computeBalance(transactions) {
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  return formatAmount(total);
}

/**
 * Returns today's date as a "YYYY-MM-DD" string using the user's local timezone.
 * @returns {string}
 */
function getLocalDateString() {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fixed color palette for chart segments.
 * Colors are assigned deterministically by the order categories first appear
 * when iterating over the transactions array (sorted by category name for
 * stability across re-renders).
 */
const CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED',
  '#71B37C', '#F7464A', '#46BFBD', '#FDB45C',
];

/**
 * Builds the data object required by Chart.js for a pie chart.
 * Categories with a zero total are excluded.
 * Colors are assigned deterministically: categories are sorted alphabetically
 * so the same category always receives the same color index.
 *
 * @param {Transaction[]} transactions
 * @returns {{ labels: string[], data: number[], colors: string[] }}
 */
function buildChartData(transactions) {
  // Aggregate totals per category
  const totals = {};
  for (const tx of transactions) {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  }

  // Sort category names alphabetically for deterministic color assignment
  const sortedCategories = Object.keys(totals).sort();

  const labels = [];
  const data   = [];
  const colors = [];

  sortedCategories.forEach((cat, index) => {
    const total = totals[cat];
    if (total > 0) {
      labels.push(cat);
      data.push(total);
      colors.push(CHART_COLORS[index % CHART_COLORS.length]);
    }
  });

  return { labels, data, colors };
}

/**
 * Groups transactions by calendar month, sorts groups most-recent-first,
 * and sums amounts per category within each group.
 *
 * @param {Transaction[]} transactions
 * @returns {Array<{ label: string, key: string, total: number, categories: Object.<string, number> }>}
 *   e.g. [{ label: "May 2025", key: "2025-05", total: 123.45, categories: { Food: 80, Transport: 43.45 } }]
 */
function buildMonthlySummary(transactions) {
  // Group by "YYYY-MM" key
  const groups = {};
  for (const tx of transactions) {
    // tx.date is "YYYY-MM-DD"; take the first 7 characters as the key
    const key = tx.date.slice(0, 7);
    if (!groups[key]) {
      groups[key] = { total: 0, categories: {} };
    }
    groups[key].total += tx.amount;
    groups[key].categories[tx.category] =
      (groups[key].categories[tx.category] || 0) + tx.amount;
  }

  // Sort keys descending (most recent first)
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    // Format "YYYY-MM" → "Month YYYY" using the local locale
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      label,
      key,
      total: groups[key].total,
      categories: groups[key].categories,
    };
  });
}

/* ============================================================
   Render Functions
   ============================================================ */

/**
 * Renders the monthly summary section.
 * Groups transactions by calendar month using buildMonthlySummary(),
 * then writes the resulting HTML into <div id="monthly-summary-content">.
 *
 * Each month group is rendered as:
 *   <div class="month-group">
 *     <h3>{label}</h3>
 *     <p class="month-total">Total: ${total}</p>
 *     <ul class="category-breakdown">
 *       <li>{category}: ${amount}</li>
 *       ...
 *     </ul>
 *   </div>
 *
 * When no transactions exist, an empty-state message is shown instead.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 *
 * @param {Transaction[]} transactions
 */
function updateMonthlySummary(transactions) {
  const container = document.getElementById('monthly-summary-content');
  if (!container) return;

  // Empty-state: no transactions (Requirement 7.6)
  if (!transactions || transactions.length === 0) {
    container.innerHTML = '<p class="empty-state">No expenses recorded yet.</p>';
    return;
  }

  const groups = buildMonthlySummary(transactions);

  // Build HTML for all month groups
  const html = groups.map((group) => {
    // Build category breakdown list items
    const categoryItems = Object.entries(group.categories)
      .map(([cat, amount]) => `<li>${cat}: ${formatAmount(amount)}</li>`)
      .join('');

    return `<div class="month-group">
  <h3>${group.label}</h3>
  <p class="month-total">Total: ${formatAmount(group.total)}</p>
  <ul class="category-breakdown">
    ${categoryItems}
  </ul>
</div>`;
  }).join('');

  container.innerHTML = html;
}

/* ============================================================
   View Render Functions
   ============================================================ */

/**
 * Renders the transaction list into `<ul id="transaction-list">`.
 *
 * - Displays transactions in newest-first order (index 0 = most recently added).
 * - Each transaction is rendered as an `<li class="tx-item" data-id="{id}">` containing:
 *     - `<span class="tx-name">{name}</span>`
 *     - `<span class="tx-amount">${amount formatted to 2 decimal places}</span>`
 *     - `<span class="tx-category">{category}</span>`
 *     - `<button class="tx-delete" aria-label="Delete {name}">✕</button>`
 * - When the list is empty, renders `<p id="empty-state">No expenses recorded yet.</p>` instead.
 *
 * @param {Transaction[]} transactions - Array of transactions (index 0 = newest).
 */
function updateTransactionList(transactions) {
  const ul = document.getElementById('transaction-list');
  if (!ul) return;

  // Clear existing content
  ul.innerHTML = '';

  if (transactions.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.id = 'empty-state';
    emptyState.textContent = 'No expenses recorded yet.';
    ul.appendChild(emptyState);
    return;
  }

  // Transactions are stored newest-first (index 0 = most recently added),
  // so we iterate in order.
  for (const tx of transactions) {
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.dataset.id = tx.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tx-name';
    nameSpan.textContent = tx.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'tx-amount';
    amountSpan.textContent = formatAmount(tx.amount);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'tx-category';
    categorySpan.textContent = tx.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tx-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${tx.name}`);
    deleteBtn.textContent = '✕';

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);

    ul.appendChild(li);
  }
}

/* ============================================================
   View Render Functions
   ============================================================ */

/**
 * Updates the #balance element to display the current total balance.
 * Uses computeBalance to calculate the formatted sum of all transaction amounts.
 * Displays "$0.00" when the transaction list is empty.
 *
 * @param {Transaction[]} transactions
 */
function updateBalance(transactions) {
  const balanceEl = document.getElementById('balance');
  if (!balanceEl) return;
  balanceEl.textContent = computeBalance(transactions);
}

/* ============================================================
   View Render Functions
   ============================================================ */

/**
 * Populates the `<select id="tx-category">` element with the provided categories.
 *
 * Clears all existing options first, then inserts a blank placeholder option,
 * followed by one `<option>` per category in the supplied array.
 *
 * @param {string[]} categories - The full list of category names to render.
 */
function populateCategorySelector(categories) {
  const select = document.getElementById('tx-category');
  if (!select) return;

  // Clear all existing options
  select.innerHTML = '';

  // Add blank placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select category';
  select.appendChild(placeholder);

  // Add one option per category
  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  }
}

/* ============================================================
   Placeholder render / controller stubs
   (Full implementations in Tasks 4–10)
   ============================================================ */

// These stubs allow the file to load without errors.
// They will be replaced with real implementations in subsequent tasks.

/** Chart.js instance — created on first render. */
let chartInstance = null;

/**
 * Updates (or initializes) the pie chart with the given transactions.
 *
 * Behaviour:
 *  - If Chart.js failed to load from CDN (`window.Chart` is undefined), shows a
 *    static error message inside the chart container and returns early.
 *  - When `transactions` is empty: hides the `<canvas>` and shows `#chart-empty`.
 *  - When `transactions` is non-empty: hides `#chart-empty` and shows the `<canvas>`.
 *    - First call: creates a new Chart.js instance and stores it in `chartInstance`.
 *    - Subsequent calls: mutates `chartInstance.data` in-place and calls
 *      `chartInstance.update()` — the canvas is never destroyed/recreated.
 *
 * @param {Transaction[]} transactions
 */
function updateChart(transactions) {
  const canvas    = document.getElementById('spending-chart');
  const emptyMsg  = document.getElementById('chart-empty');

  // Guard: Chart.js CDN load failure
  if (typeof window.Chart === 'undefined') {
    if (canvas)   canvas.style.display   = 'none';
    if (emptyMsg) {
      emptyMsg.textContent    = 'Chart unavailable — could not load charting library.';
      emptyMsg.style.display  = 'block';
    }
    return;
  }

  // No transactions — show empty state
  if (!transactions || transactions.length === 0) {
    if (canvas)   canvas.style.display   = 'none';
    if (emptyMsg) {
      emptyMsg.textContent   = 'No data to display';
      emptyMsg.style.display = 'block';
    }
    // Destroy existing instance so it doesn't hold stale data
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  // Transactions exist — hide empty message, show canvas
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (canvas)   canvas.style.display   = 'block';

  const { labels, data, colors } = buildChartData(transactions);

  if (chartInstance) {
    // Update existing instance in-place (no destroy/recreate)
    chartInstance.data.labels                          = labels;
    chartInstance.data.datasets[0].data               = data;
    chartInstance.data.datasets[0].backgroundColor    = colors;
    chartInstance.update();
  } else {
    // First call — create the Chart.js instance
    const ctx = canvas.getContext('2d');
    chartInstance = new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label(context) {
                const total   = context.dataset.data.reduce((s, v) => s + v, 0);
                const value   = context.parsed;
                const pct     = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${context.label}: ${pct}%`;
              },
            },
          },
        },
      },
    });
  }
}

/** Timer handle for the current toast auto-dismiss. */
let toastTimer = null;

/**
 * Displays a non-blocking toast notification and auto-dismisses it.
 *
 * The `#toast` element in index.html already carries `role="status"` and
 * `aria-live="polite"` so screen readers announce the message without
 * interrupting the user's current task.
 *
 * Calling `showToast` while a toast is already visible cancels the previous
 * timer and restarts the countdown with the new message, preventing stale
 * dismissals from hiding a newer notification too early.
 *
 * @param {string} message   - Text to display in the toast.
 * @param {number} [duration=TOAST_DURATION_MS] - Auto-dismiss delay in ms.
 */
function showToast(message, duration = TOAST_DURATION_MS) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Ensure accessibility attributes are present (defensive — already set in HTML)
  if (!toast.getAttribute('role')) {
    toast.setAttribute('role', 'status');
  }
  if (!toast.getAttribute('aria-live')) {
    toast.setAttribute('aria-live', 'polite');
  }

  // Cancel any in-flight dismiss timer so rapid calls don't race
  if (toastTimer !== null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  // Update content and make visible
  toast.textContent = message;
  toast.classList.add('toast--visible');

  // Schedule auto-dismiss
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.textContent = '';
    toastTimer = null;
  }, duration);
}

/**
 * Initializes the application.
 * Loads persisted state, renders all components, attaches event listeners.
 *
 * Requirements: 2.3, 5.3, 5.4, 6.6, 8.4, 8.5, 9.2
 */
function initApp() {
  // ── 1. Check localStorage availability ──────────────────────────────────
  if (!StorageManager.isAvailable()) {
    showToast('Storage unavailable — your data will not be saved this session.');
    AppState.transactions = [];
    AppState.categories   = [...DEFAULT_CATEGORIES];
    AppState.theme        = 'light';
  } else {
    // ── 2. Load transactions ───────────────────────────────────────────────
    const storedTransactions = StorageManager.load(StorageManager.KEYS.TRANSACTIONS);
    if (Array.isArray(storedTransactions)) {
      AppState.transactions = storedTransactions;
    } else {
      AppState.transactions = [];
      if (storedTransactions !== null) {
        // null means key was absent — only warn on a genuine parse error
        showToast('Could not restore transactions — data may be corrupted. Starting fresh.');
      }
    }

    // ── 3. Load categories ─────────────────────────────────────────────────
    const storedCategories = StorageManager.load(StorageManager.KEYS.CATEGORIES);
    if (Array.isArray(storedCategories)) {
      AppState.categories = storedCategories;
    } else {
      AppState.categories = [...DEFAULT_CATEGORIES];
      if (storedCategories !== null) {
        showToast('Could not restore categories — data may be corrupted. Using defaults.');
      }
    }

    // ── 4. Load theme ──────────────────────────────────────────────────────
    const storedTheme = StorageManager.load(StorageManager.KEYS.THEME);
    AppState.theme = storedTheme === 'dark' ? 'dark' : 'light';
  }

  // ── 5. Apply theme ─────────────────────────────────────────────────────
  document.documentElement.setAttribute('data-theme', AppState.theme);

  // ── 6. Update theme toggle aria-label ──────────────────────────────────
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute(
      'aria-label',
      AppState.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // ── 7. Render all view components ──────────────────────────────────────
  populateCategorySelector(AppState.categories);
  updateTransactionList(AppState.transactions);
  updateBalance(AppState.transactions);
  updateChart(AppState.transactions);
  updateMonthlySummary(AppState.transactions);

  // ── 8. Attach event listeners ──────────────────────────────────────────

  // Task 7.1 — #transaction-form submit handler
  // Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1
  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nameInput     = document.getElementById('tx-name');
      const amountInput   = document.getElementById('tx-amount');
      const categoryInput = document.getElementById('tx-category');
      const formError     = document.getElementById('form-error');

      const name     = nameInput     ? nameInput.value     : '';
      const amount   = amountInput   ? amountInput.value   : '';
      const category = categoryInput ? categoryInput.value : '';

      const { valid, errors } = validateTransaction(name, amount, category, AppState.categories);

      if (!valid) {
        if (formError) formError.textContent = errors.join(' ');
        return;
      }

      // Clear any previous error
      if (formError) formError.textContent = '';

      // Build transaction object
      const trimmedName = name.trim();
      const newTransaction = {
        id:       crypto.randomUUID(),
        name:     trimmedName,
        amount:   parseFloat(amount),
        category: category,
        date:     getLocalDateString(),
      };

      // Prepend (newest first)
      AppState.transactions.unshift(newTransaction);

      // Persist
      const saved = StorageManager.save(StorageManager.KEYS.TRANSACTIONS, AppState.transactions);
      if (!saved) {
        showToast('Could not save data — storage quota may be exceeded.');
        // Rollback
        AppState.transactions.shift();
        updateTransactionList(AppState.transactions);
        updateBalance(AppState.transactions);
        updateChart(AppState.transactions);
        updateMonthlySummary(AppState.transactions);
        return;
      }

      // Re-render
      updateTransactionList(AppState.transactions);
      updateBalance(AppState.transactions);
      updateChart(AppState.transactions);
      updateMonthlySummary(AppState.transactions);

      // Reset form fields
      if (nameInput)     nameInput.value     = '';
      if (amountInput)   amountInput.value   = '';
      if (categoryInput) categoryInput.value = '';
    });
  }

  // Task 7.3 — Delete button handler (event delegation on #transaction-list)
  // Requirements: 2.4, 5.2
  const transactionList = document.getElementById('transaction-list');
  if (transactionList) {
    transactionList.addEventListener('click', function (event) {
      if (!event.target.classList.contains('tx-delete')) return;

      const txItem = event.target.closest('.tx-item');
      if (!txItem) return;

      const id = txItem.dataset.id;

      // Find and remove the transaction
      const index = AppState.transactions.findIndex((tx) => tx.id === id);
      if (index === -1) return;

      const [removed] = AppState.transactions.splice(index, 1);

      // Persist
      const saved = StorageManager.save(StorageManager.KEYS.TRANSACTIONS, AppState.transactions);
      if (!saved) {
        showToast('Could not save data — storage quota may be exceeded.');
        // Rollback — re-insert at original position
        AppState.transactions.splice(index, 0, removed);
        updateTransactionList(AppState.transactions);
        updateBalance(AppState.transactions);
        updateChart(AppState.transactions);
        updateMonthlySummary(AppState.transactions);
        return;
      }

      // Re-render
      updateTransactionList(AppState.transactions);
      updateBalance(AppState.transactions);
      updateChart(AppState.transactions);
      updateMonthlySummary(AppState.transactions);
    });
  }

  // Task 7.5 — #category-form submit handler
  // Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8
  const categoryForm = document.getElementById('category-form');
  if (categoryForm) {
    categoryForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const catNameInput = document.getElementById('cat-name');
      const catError     = document.getElementById('cat-error');

      const name = catNameInput ? catNameInput.value : '';

      const { valid, error } = validateCategory(name, AppState.categories);

      if (!valid) {
        if (catError) catError.textContent = error;
        return;
      }

      // Clear any previous error
      if (catError) catError.textContent = '';

      // Append trimmed name
      const trimmedName = name.trim();
      AppState.categories.push(trimmedName);

      // Persist
      const saved = StorageManager.save(StorageManager.KEYS.CATEGORIES, AppState.categories);
      if (!saved) {
        showToast('Could not save data — storage quota may be exceeded.');
        // Rollback
        AppState.categories.pop();
        return;
      }

      // Refresh category selector
      populateCategorySelector(AppState.categories);

      // Reset input
      if (catNameInput) catNameInput.value = '';
    });
  }

  // Task 8.1 — #theme-toggle click handler
  // Requirements: 8.1, 8.2, 8.3, 8.7
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      // Toggle theme
      AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';

      // Apply to document
      document.documentElement.setAttribute('data-theme', AppState.theme);

      // Update aria-label
      themeToggleBtn.setAttribute(
        'aria-label',
        AppState.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );

      // Persist — no error toast on failure (Requirement 8.7)
      StorageManager.save(StorageManager.KEYS.THEME, AppState.theme);
    });
  }
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
