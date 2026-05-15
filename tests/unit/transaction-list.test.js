/**
 * Unit tests for updateTransactionList(transactions)
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6
 *
 * Tests run in jsdom environment (see vitest.config.js).
 * The function is inlined here to avoid importing the browser-bootstrapping app.js.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementations — mirror js/app.js exactly
// ---------------------------------------------------------------------------

function formatAmount(number) {
  return '$' + Number(number).toFixed(2);
}

function updateTransactionList(transactions) {
  const ul = document.getElementById('transaction-list');
  if (!ul) return;

  ul.innerHTML = '';

  if (transactions.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.id = 'empty-state';
    emptyState.textContent = 'No expenses recorded yet.';
    ul.appendChild(emptyState);
    return;
  }

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

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Creates a minimal transaction object. */
function makeTx(overrides = {}) {
  return {
    id: 'abc-123',
    name: 'Lunch',
    amount: 12.50,
    category: 'Food',
    date: '2025-05-11',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup: inject a <ul id="transaction-list"> before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = '<ul id="transaction-list"></ul>';
});

// ===========================================================================
// Empty state — Requirement 2.3
// ===========================================================================

describe('updateTransactionList — empty state', () => {
  it('renders the empty-state paragraph when the list is empty', () => {
    updateTransactionList([]);
    const p = document.getElementById('empty-state');
    expect(p).not.toBeNull();
    expect(p.tagName).toBe('P');
    expect(p.textContent).toBe('No expenses recorded yet.');
  });

  it('does not render any <li> elements when the list is empty', () => {
    updateTransactionList([]);
    const items = document.querySelectorAll('li.tx-item');
    expect(items.length).toBe(0);
  });
});

// ===========================================================================
// Single transaction rendering — Requirements 2.1, 2.2
// ===========================================================================

describe('updateTransactionList — single transaction', () => {
  it('renders one <li class="tx-item"> for a single transaction', () => {
    updateTransactionList([makeTx()]);
    const items = document.querySelectorAll('li.tx-item');
    expect(items.length).toBe(1);
  });

  it('sets data-id attribute to the transaction id', () => {
    updateTransactionList([makeTx({ id: 'tx-001' })]);
    const li = document.querySelector('li.tx-item');
    expect(li.dataset.id).toBe('tx-001');
  });

  it('renders the transaction name in a <span class="tx-name">', () => {
    updateTransactionList([makeTx({ name: 'Coffee' })]);
    const span = document.querySelector('.tx-name');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('Coffee');
  });

  it('renders the amount formatted to 2 decimal places in a <span class="tx-amount">', () => {
    updateTransactionList([makeTx({ amount: 7.5 })]);
    const span = document.querySelector('.tx-amount');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('$7.50');
  });

  it('renders the category in a <span class="tx-category">', () => {
    updateTransactionList([makeTx({ category: 'Transport' })]);
    const span = document.querySelector('.tx-category');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('Transport');
  });

  it('renders a delete button with class "tx-delete"', () => {
    updateTransactionList([makeTx()]);
    const btn = document.querySelector('button.tx-delete');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('✕');
  });

  it('sets aria-label on the delete button to "Delete {name}"', () => {
    updateTransactionList([makeTx({ name: 'Gym' })]);
    const btn = document.querySelector('button.tx-delete');
    expect(btn.getAttribute('aria-label')).toBe('Delete Gym');
  });

  it('does not render the empty-state paragraph when there is a transaction', () => {
    updateTransactionList([makeTx()]);
    expect(document.getElementById('empty-state')).toBeNull();
  });
});

// ===========================================================================
// Multiple transactions — Requirements 2.5, 2.6
// ===========================================================================

describe('updateTransactionList — multiple transactions', () => {
  const txs = [
    makeTx({ id: 'tx-1', name: 'Newest', amount: 5.00, category: 'Fun' }),
    makeTx({ id: 'tx-2', name: 'Middle', amount: 10.00, category: 'Food' }),
    makeTx({ id: 'tx-3', name: 'Oldest', amount: 3.00, category: 'Transport' }),
  ];

  it('renders the correct number of <li> elements', () => {
    updateTransactionList(txs);
    const items = document.querySelectorAll('li.tx-item');
    expect(items.length).toBe(3);
  });

  it('renders transactions in the order provided (newest-first = index 0 first)', () => {
    updateTransactionList(txs);
    const items = document.querySelectorAll('li.tx-item');
    expect(items[0].dataset.id).toBe('tx-1');
    expect(items[1].dataset.id).toBe('tx-2');
    expect(items[2].dataset.id).toBe('tx-3');
  });

  it('each item has the correct name', () => {
    updateTransactionList(txs);
    const names = [...document.querySelectorAll('.tx-name')].map((s) => s.textContent);
    expect(names).toEqual(['Newest', 'Middle', 'Oldest']);
  });

  it('each item has the correct formatted amount', () => {
    updateTransactionList(txs);
    const amounts = [...document.querySelectorAll('.tx-amount')].map((s) => s.textContent);
    expect(amounts).toEqual(['$5.00', '$10.00', '$3.00']);
  });

  it('each item has the correct category', () => {
    updateTransactionList(txs);
    const cats = [...document.querySelectorAll('.tx-category')].map((s) => s.textContent);
    expect(cats).toEqual(['Fun', 'Food', 'Transport']);
  });

  it('each item has a delete button with the correct aria-label', () => {
    updateTransactionList(txs);
    const labels = [...document.querySelectorAll('button.tx-delete')].map(
      (b) => b.getAttribute('aria-label')
    );
    expect(labels).toEqual(['Delete Newest', 'Delete Middle', 'Delete Oldest']);
  });
});

// ===========================================================================
// Re-render / idempotency — Requirement 2.1
// ===========================================================================

describe('updateTransactionList — re-render', () => {
  it('replaces previous content on subsequent calls', () => {
    updateTransactionList([makeTx({ id: 'old', name: 'Old Item' })]);
    updateTransactionList([makeTx({ id: 'new', name: 'New Item' })]);
    const items = document.querySelectorAll('li.tx-item');
    expect(items.length).toBe(1);
    expect(items[0].dataset.id).toBe('new');
  });

  it('shows empty-state after clearing all transactions', () => {
    updateTransactionList([makeTx()]);
    updateTransactionList([]);
    expect(document.getElementById('empty-state')).not.toBeNull();
    expect(document.querySelectorAll('li.tx-item').length).toBe(0);
  });

  it('removes empty-state when transactions are added after being empty', () => {
    updateTransactionList([]);
    updateTransactionList([makeTx()]);
    expect(document.getElementById('empty-state')).toBeNull();
    expect(document.querySelectorAll('li.tx-item').length).toBe(1);
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================

describe('updateTransactionList — edge cases', () => {
  it('handles a transaction with the maximum valid amount', () => {
    updateTransactionList([makeTx({ amount: 999_999_999.99 })]);
    const span = document.querySelector('.tx-amount');
    expect(span.textContent).toBe('$999999999.99');
  });

  it('handles a transaction with the minimum valid amount (0.01)', () => {
    updateTransactionList([makeTx({ amount: 0.01 })]);
    const span = document.querySelector('.tx-amount');
    expect(span.textContent).toBe('$0.01');
  });

  it('handles a transaction name with special HTML characters safely (textContent escaping)', () => {
    updateTransactionList([makeTx({ name: '<script>alert(1)</script>' })]);
    const span = document.querySelector('.tx-name');
    // textContent assignment escapes HTML — no actual script element should exist
    expect(document.querySelector('script')).toBeNull();
    expect(span.textContent).toBe('<script>alert(1)</script>');
  });

  it('does nothing when the target <ul> element is absent', () => {
    document.body.innerHTML = ''; // remove the ul
    // Should not throw
    expect(() => updateTransactionList([makeTx()])).not.toThrow();
  });
});
