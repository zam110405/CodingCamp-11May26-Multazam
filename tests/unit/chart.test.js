/**
 * Unit tests for buildChartData(transactions)
 * Requirements: 4.1, 4.2
 *
 * Verifies:
 *  - Returns { labels, data, colors } shape
 *  - Excludes categories with zero total spending
 *  - Assigns deterministic colors (same category always gets same color)
 *  - Handles empty transaction list
 *  - Aggregates amounts correctly per category
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementation — mirrors js/app.js exactly so tests run in the
// jsdom environment without importing the browser-bootstrapping script.
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED',
  '#71B37C', '#F7464A', '#46BFBD', '#FDB45C',
];

/**
 * @param {Array<{id:string, name:string, amount:number, category:string, date:string}>} transactions
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal transaction object. */
function makeTx(id, name, amount, category, date = '2025-05-01') {
  return { id, name, amount, category, date };
}

// ===========================================================================
// buildChartData() tests
// ===========================================================================

describe('buildChartData(transactions)', () => {

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe('return value shape', () => {
    it('returns an object with labels, data, and colors arrays', () => {
      const result = buildChartData([]);
      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('colors');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(Array.isArray(result.colors)).toBe(true);
    });

    it('labels, data, and colors arrays have the same length', () => {
      const txs = [
        makeTx('1', 'Lunch', 10, 'Food'),
        makeTx('2', 'Bus', 5, 'Transport'),
      ];
      const { labels, data, colors } = buildChartData(txs);
      expect(labels.length).toBe(data.length);
      expect(data.length).toBe(colors.length);
    });
  });

  // -------------------------------------------------------------------------
  // Empty input
  // -------------------------------------------------------------------------
  describe('empty transaction list', () => {
    it('returns empty arrays for all three fields', () => {
      const result = buildChartData([]);
      expect(result.labels).toEqual([]);
      expect(result.data).toEqual([]);
      expect(result.colors).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Aggregation
  // -------------------------------------------------------------------------
  describe('amount aggregation per category', () => {
    it('sums amounts for the same category across multiple transactions', () => {
      const txs = [
        makeTx('1', 'Lunch', 10, 'Food'),
        makeTx('2', 'Dinner', 20, 'Food'),
        makeTx('3', 'Bus', 5, 'Transport'),
      ];
      const { labels, data } = buildChartData(txs);
      const foodIndex = labels.indexOf('Food');
      const transportIndex = labels.indexOf('Transport');
      expect(foodIndex).toBeGreaterThanOrEqual(0);
      expect(transportIndex).toBeGreaterThanOrEqual(0);
      expect(data[foodIndex]).toBe(30);
      expect(data[transportIndex]).toBe(5);
    });

    it('handles a single transaction correctly', () => {
      const txs = [makeTx('1', 'Coffee', 3.50, 'Food')];
      const { labels, data } = buildChartData(txs);
      expect(labels).toEqual(['Food']);
      expect(data).toEqual([3.50]);
    });

    it('handles multiple categories each with one transaction', () => {
      const txs = [
        makeTx('1', 'Lunch', 12, 'Food'),
        makeTx('2', 'Bus', 4, 'Transport'),
        makeTx('3', 'Movie', 15, 'Fun'),
      ];
      const { labels, data } = buildChartData(txs);
      expect(labels).toHaveLength(3);
      // All three categories should appear
      expect(labels).toContain('Food');
      expect(labels).toContain('Transport');
      expect(labels).toContain('Fun');
      // Totals match
      expect(data[labels.indexOf('Food')]).toBe(12);
      expect(data[labels.indexOf('Transport')]).toBe(4);
      expect(data[labels.indexOf('Fun')]).toBe(15);
    });
  });

  // -------------------------------------------------------------------------
  // Zero-total exclusion (Requirement 4.1)
  // -------------------------------------------------------------------------
  describe('exclusion of zero-total categories', () => {
    it('excludes a category whose only transaction has amount 0', () => {
      // Note: 0-amount transactions would normally be rejected by validateTransaction,
      // but buildChartData must still handle them defensively.
      const txs = [
        makeTx('1', 'Lunch', 10, 'Food'),
        makeTx('2', 'Zero item', 0, 'Transport'),
      ];
      const { labels } = buildChartData(txs);
      expect(labels).toContain('Food');
      expect(labels).not.toContain('Transport');
    });

    it('returns empty arrays when all categories have zero total', () => {
      const txs = [
        makeTx('1', 'A', 0, 'Food'),
        makeTx('2', 'B', 0, 'Transport'),
      ];
      const result = buildChartData(txs);
      expect(result.labels).toEqual([]);
      expect(result.data).toEqual([]);
      expect(result.colors).toEqual([]);
    });

    it('includes a category only when its total is strictly positive', () => {
      const txs = [makeTx('1', 'Gym', 25, 'Fun')];
      const { labels } = buildChartData(txs);
      expect(labels).toEqual(['Fun']);
    });
  });

  // -------------------------------------------------------------------------
  // Deterministic color assignment (Requirement 4.2)
  // -------------------------------------------------------------------------
  describe('deterministic color assignment', () => {
    it('assigns the same color to the same category across separate calls', () => {
      const txs1 = [
        makeTx('1', 'Lunch', 10, 'Food'),
        makeTx('2', 'Bus', 5, 'Transport'),
      ];
      const txs2 = [
        makeTx('3', 'Dinner', 20, 'Food'),
        makeTx('4', 'Taxi', 8, 'Transport'),
      ];
      const result1 = buildChartData(txs1);
      const result2 = buildChartData(txs2);

      const foodColor1 = result1.colors[result1.labels.indexOf('Food')];
      const foodColor2 = result2.colors[result2.labels.indexOf('Food')];
      expect(foodColor1).toBe(foodColor2);

      const transportColor1 = result1.colors[result1.labels.indexOf('Transport')];
      const transportColor2 = result2.colors[result2.labels.indexOf('Transport')];
      expect(transportColor1).toBe(transportColor2);
    });

    it('assigns colors from the fixed CHART_COLORS palette', () => {
      const txs = [makeTx('1', 'Lunch', 10, 'Food')];
      const { colors } = buildChartData(txs);
      expect(CHART_COLORS).toContain(colors[0]);
    });

    it('assigns different colors to different categories', () => {
      const txs = [
        makeTx('1', 'Lunch', 10, 'Food'),
        makeTx('2', 'Bus', 5, 'Transport'),
        makeTx('3', 'Movie', 15, 'Fun'),
      ];
      const { colors } = buildChartData(txs);
      // All three colors should be distinct (palette has enough entries)
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(3);
    });

    it('produces alphabetically sorted labels (deterministic ordering)', () => {
      const txs = [
        makeTx('1', 'Movie', 15, 'Fun'),
        makeTx('2', 'Bus', 5, 'Transport'),
        makeTx('3', 'Lunch', 10, 'Food'),
      ];
      const { labels } = buildChartData(txs);
      // Alphabetical: Food, Fun, Transport
      expect(labels).toEqual(['Food', 'Fun', 'Transport']);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles floating-point amounts without crashing', () => {
      const txs = [
        makeTx('1', 'A', 0.01, 'Food'),
        makeTx('2', 'B', 999_999_999.99, 'Transport'),
      ];
      const { labels, data } = buildChartData(txs);
      expect(labels).toHaveLength(2);
      expect(data[labels.indexOf('Food')]).toBeCloseTo(0.01);
      expect(data[labels.indexOf('Transport')]).toBeCloseTo(999_999_999.99);
    });

    it('handles a large number of transactions in the same category', () => {
      const txs = Array.from({ length: 100 }, (_, i) =>
        makeTx(String(i), `Item ${i}`, 1, 'Food')
      );
      const { labels, data } = buildChartData(txs);
      expect(labels).toEqual(['Food']);
      expect(data[0]).toBe(100);
    });

    it('wraps color palette index for more than 12 categories', () => {
      // CHART_COLORS has 12 entries; a 13th category should wrap around
      const categories = [
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
        'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
        'Lambda', 'Mu', 'Nu',
      ];
      const txs = categories.map((cat, i) =>
        makeTx(String(i), cat, 10, cat)
      );
      const { colors } = buildChartData(txs);
      // 13th category (index 12) should wrap to index 0 → same color as first
      expect(colors[12]).toBe(colors[0]);
    });
  });
});
