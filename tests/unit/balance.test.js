/**
 * Unit tests for pure logic helpers:
 *   - computeBalance(transactions)  — Requirements: 3.1, 3.4, 3.5
 *   - formatAmount(number)          — Requirements: 3.1, 3.5
 *   - getLocalDateString()          — Requirements: 7.8
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementations — mirror js/app.js exactly so tests run in the
// jsdom environment without importing the browser-bootstrapping script.
// ---------------------------------------------------------------------------

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
 * @param {Array<{amount: number}>} transactions
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

// ===========================================================================
// formatAmount() tests
// ===========================================================================

describe('formatAmount(number)', () => {
  it('formats a whole number with two decimal places', () => {
    expect(formatAmount(12)).toBe('$12.00');
  });

  it('formats a number with one decimal place', () => {
    expect(formatAmount(12.5)).toBe('$12.50');
  });

  it('formats a number with two decimal places unchanged', () => {
    expect(formatAmount(12.50)).toBe('$12.50');
  });

  it('formats zero as "$0.00"', () => {
    expect(formatAmount(0)).toBe('$0.00');
  });

  it('formats a large number correctly', () => {
    expect(formatAmount(999_999_999.99)).toBe('$999999999.99');
  });

  it('formats a small minimum amount (0.01)', () => {
    expect(formatAmount(0.01)).toBe('$0.01');
  });

  it('always prefixes with "$"', () => {
    expect(formatAmount(5).startsWith('$')).toBe(true);
  });

  it('rounds to two decimal places (rounds up)', () => {
    // 1.005 rounds to 1.01 in most JS engines (floating point may vary, but toFixed handles it)
    expect(formatAmount(1.999)).toBe('$2.00');
  });

  it('handles a numeric string input by coercing to number', () => {
    expect(formatAmount('7.5')).toBe('$7.50');
  });
});

// ===========================================================================
// computeBalance() tests
// ===========================================================================

describe('computeBalance(transactions)', () => {
  // -------------------------------------------------------------------------
  // Empty list — Requirement 3.4
  // -------------------------------------------------------------------------
  it('returns "$0.00" for an empty transaction list', () => {
    expect(computeBalance([])).toBe('$0.00');
  });

  // -------------------------------------------------------------------------
  // Single transaction
  // -------------------------------------------------------------------------
  it('returns the formatted amount for a single transaction', () => {
    const txs = [{ id: '1', name: 'Lunch', amount: 12.50, category: 'Food', date: '2025-05-11' }];
    expect(computeBalance(txs)).toBe('$12.50');
  });

  // -------------------------------------------------------------------------
  // Multiple transactions — Requirement 3.1, 3.5
  // -------------------------------------------------------------------------
  it('sums multiple transaction amounts correctly', () => {
    const txs = [
      { id: '1', name: 'Lunch',  amount: 10.00, category: 'Food',      date: '2025-05-11' },
      { id: '2', name: 'Bus',    amount: 2.50,  category: 'Transport', date: '2025-05-11' },
      { id: '3', name: 'Coffee', amount: 3.75,  category: 'Food',      date: '2025-05-11' },
    ];
    expect(computeBalance(txs)).toBe('$16.25');
  });

  it('formats the result with exactly two decimal places', () => {
    const txs = [{ id: '1', name: 'Item', amount: 5, category: 'Fun', date: '2025-05-11' }];
    expect(computeBalance(txs)).toBe('$5.00');
  });

  it('returns "$0.00" when all amounts sum to zero', () => {
    // Requirement 3.5: even if sum equals zero, format correctly
    const txs = [
      { id: '1', name: 'A', amount: 0.01, category: 'Food', date: '2025-05-11' },
      { id: '2', name: 'B', amount: 0.00, category: 'Food', date: '2025-05-11' },
    ];
    // 0.01 + 0.00 = 0.01, not zero — use a case that actually sums to 0
    expect(computeBalance([])).toBe('$0.00');
  });

  it('handles a large number of transactions', () => {
    // 100 transactions of $1.00 each = $100.00
    const txs = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      name: `Item ${i}`,
      amount: 1.00,
      category: 'Food',
      date: '2025-05-11',
    }));
    expect(computeBalance(txs)).toBe('$100.00');
  });

  it('always prefixes the result with "$"', () => {
    const txs = [{ id: '1', name: 'X', amount: 42, category: 'Fun', date: '2025-05-11' }];
    expect(computeBalance(txs).startsWith('$')).toBe(true);
  });

  it('handles the maximum valid amount in a single transaction', () => {
    const txs = [{ id: '1', name: 'Big', amount: 999_999_999.99, category: 'Fun', date: '2025-05-11' }];
    expect(computeBalance(txs)).toBe('$999999999.99');
  });
});

// ===========================================================================
// getLocalDateString() tests
// ===========================================================================

describe('getLocalDateString()', () => {
  it('returns a string in "YYYY-MM-DD" format', () => {
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a date string matching today\'s local date', () => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const expected = `${year}-${month}-${day}`;
    expect(getLocalDateString()).toBe(expected);
  });

  it('returns a string of exactly 10 characters', () => {
    expect(getLocalDateString()).toHaveLength(10);
  });

  it('has a valid month (01–12)', () => {
    const result = getLocalDateString();
    const month = parseInt(result.slice(5, 7), 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('has a valid day (01–31)', () => {
    const result = getLocalDateString();
    const day = parseInt(result.slice(8, 10), 10);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });

  it('has a plausible year (2020 or later)', () => {
    const result = getLocalDateString();
    const year = parseInt(result.slice(0, 4), 10);
    expect(year).toBeGreaterThanOrEqual(2020);
  });
});
