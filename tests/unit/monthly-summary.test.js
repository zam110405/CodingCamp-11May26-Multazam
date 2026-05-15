/**
 * Unit tests for buildMonthlySummary(transactions)
 * Requirements: 7.1, 7.2, 7.3, 7.7
 *
 * buildMonthlySummary groups transactions by "YYYY-MM" key derived from
 * transaction.date, sorts groups descending (most recent first), sums amounts
 * per category within each group, and returns:
 *   [{ label: "May 2025", key: "2025-05", total: number, categories: { [name]: number } }]
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementation — mirrors js/app.js exactly so tests run in the
// jsdom environment without importing the browser-bootstrapping script.
// ---------------------------------------------------------------------------

/**
 * Groups transactions by calendar month, sorts groups most-recent-first,
 * and sums amounts per category within each group.
 *
 * @param {Array} transactions
 * @returns {Array<{ label: string, key: string, total: number, categories: Object }>}
 */
function buildMonthlySummary(transactions) {
  // Group by "YYYY-MM" key
  const groups = {};
  for (const tx of transactions) {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid transaction object. */
function makeTx(id, name, amount, category, date) {
  return { id, name, amount, category, date };
}

// ===========================================================================
// buildMonthlySummary() tests
// ===========================================================================

describe('buildMonthlySummary(transactions)', () => {

  // -------------------------------------------------------------------------
  // Empty input
  // -------------------------------------------------------------------------
  describe('empty transaction list', () => {
    it('returns an empty array for an empty list', () => {
      expect(buildMonthlySummary([])).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Single transaction
  // -------------------------------------------------------------------------
  describe('single transaction', () => {
    it('returns one month group for a single transaction', () => {
      const txs = [makeTx('1', 'Lunch', 12.50, 'Food', '2025-05-11')];
      const result = buildMonthlySummary(txs);
      expect(result).toHaveLength(1);
    });

    it('group total equals the transaction amount', () => {
      const txs = [makeTx('1', 'Lunch', 12.50, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(group.total).toBe(12.50);
    });

    it('group categories contains the correct category total', () => {
      const txs = [makeTx('1', 'Lunch', 12.50, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(group.categories).toEqual({ Food: 12.50 });
    });

    it('group label is a human-readable month and year string', () => {
      const txs = [makeTx('1', 'Lunch', 12.50, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      // Label should contain "2025" and the month name
      expect(group.label).toMatch(/2025/);
      expect(group.label.length).toBeGreaterThan(4);
    });

    it('group key is the YYYY-MM string derived from the date', () => {
      const txs = [makeTx('1', 'Lunch', 12.50, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(group.key).toBe('2025-05');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple transactions in the same month
  // -------------------------------------------------------------------------
  describe('multiple transactions in the same month', () => {
    it('returns one group when all transactions share the same month', () => {
      const txs = [
        makeTx('1', 'Lunch',  12.50, 'Food',      '2025-05-01'),
        makeTx('2', 'Bus',     2.00, 'Transport',  '2025-05-15'),
        makeTx('3', 'Dinner', 30.00, 'Food',       '2025-05-31'),
      ];
      expect(buildMonthlySummary(txs)).toHaveLength(1);
    });

    it('sums all amounts into the group total', () => {
      const txs = [
        makeTx('1', 'Lunch',  12.50, 'Food',      '2025-05-01'),
        makeTx('2', 'Bus',     2.00, 'Transport',  '2025-05-15'),
        makeTx('3', 'Dinner', 30.00, 'Food',       '2025-05-31'),
      ];
      const [group] = buildMonthlySummary(txs);
      expect(group.total).toBeCloseTo(44.50, 10);
    });

    it('sums amounts per category within the group', () => {
      const txs = [
        makeTx('1', 'Lunch',  12.50, 'Food',      '2025-05-01'),
        makeTx('2', 'Bus',     2.00, 'Transport',  '2025-05-15'),
        makeTx('3', 'Dinner', 30.00, 'Food',       '2025-05-31'),
      ];
      const [group] = buildMonthlySummary(txs);
      expect(group.categories.Food).toBeCloseTo(42.50, 10);
      expect(group.categories.Transport).toBeCloseTo(2.00, 10);
    });

    it('only includes categories that appear in that month', () => {
      const txs = [
        makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-01'),
        makeTx('2', 'Bus',    5.00, 'Transport', '2025-05-10'),
      ];
      const [group] = buildMonthlySummary(txs);
      expect(Object.keys(group.categories)).toEqual(
        expect.arrayContaining(['Food', 'Transport'])
      );
      expect(Object.keys(group.categories)).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple months — sort order
  // -------------------------------------------------------------------------
  describe('multiple months — descending sort order', () => {
    it('returns groups sorted most-recent-first', () => {
      const txs = [
        makeTx('1', 'Old',     5.00, 'Food', '2025-01-10'),
        makeTx('2', 'Recent', 10.00, 'Food', '2025-05-20'),
        makeTx('3', 'Middle',  7.00, 'Food', '2025-03-15'),
      ];
      const result = buildMonthlySummary(txs);
      expect(result[0].key).toBe('2025-05');
      expect(result[1].key).toBe('2025-03');
      expect(result[2].key).toBe('2025-01');
    });

    it('returns one group per distinct month', () => {
      const txs = [
        makeTx('1', 'A', 1.00, 'Food', '2025-01-01'),
        makeTx('2', 'B', 2.00, 'Food', '2025-02-01'),
        makeTx('3', 'C', 3.00, 'Food', '2025-03-01'),
      ];
      expect(buildMonthlySummary(txs)).toHaveLength(3);
    });

    it('correctly orders months across year boundaries', () => {
      const txs = [
        makeTx('1', 'Old',    5.00, 'Food', '2024-12-31'),
        makeTx('2', 'New',   10.00, 'Food', '2025-01-01'),
      ];
      const result = buildMonthlySummary(txs);
      expect(result[0].key).toBe('2025-01');
      expect(result[1].key).toBe('2024-12');
    });

    it('transactions on the last day of a month belong to that month', () => {
      const txs = [
        makeTx('1', 'End of Jan', 5.00, 'Food', '2025-01-31'),
        makeTx('2', 'Start of Feb', 5.00, 'Food', '2025-02-01'),
      ];
      const result = buildMonthlySummary(txs);
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('2025-02');
      expect(result[1].key).toBe('2025-01');
    });
  });

  // -------------------------------------------------------------------------
  // Cross-month grouping correctness
  // -------------------------------------------------------------------------
  describe('cross-month grouping', () => {
    it('transactions in different months are placed in separate groups', () => {
      const txs = [
        makeTx('1', 'May Lunch',  20.00, 'Food', '2025-05-10'),
        makeTx('2', 'Apr Dinner', 15.00, 'Food', '2025-04-20'),
      ];
      const result = buildMonthlySummary(txs);
      expect(result).toHaveLength(2);
      const mayGroup = result.find(g => g.key === '2025-05');
      const aprGroup = result.find(g => g.key === '2025-04');
      expect(mayGroup.total).toBe(20.00);
      expect(aprGroup.total).toBe(15.00);
    });

    it('each month group only contains its own category totals', () => {
      const txs = [
        makeTx('1', 'May Food',       10.00, 'Food',      '2025-05-01'),
        makeTx('2', 'Apr Transport',   5.00, 'Transport',  '2025-04-01'),
      ];
      const result = buildMonthlySummary(txs);
      const mayGroup = result.find(g => g.key === '2025-05');
      const aprGroup = result.find(g => g.key === '2025-04');
      expect(mayGroup.categories).toEqual({ Food: 10.00 });
      expect(aprGroup.categories).toEqual({ Transport: 5.00 });
    });
  });

  // -------------------------------------------------------------------------
  // Total consistency (Property 8 from design.md)
  // -------------------------------------------------------------------------
  describe('total consistency — sum of monthly totals equals sum of all amounts', () => {
    it('sum of all monthly totals equals sum of all transaction amounts (single month)', () => {
      const txs = [
        makeTx('1', 'A', 10.00, 'Food',      '2025-05-01'),
        makeTx('2', 'B', 20.00, 'Transport', '2025-05-15'),
      ];
      const result = buildMonthlySummary(txs);
      const monthlySum = result.reduce((acc, g) => acc + g.total, 0);
      const txSum = txs.reduce((acc, tx) => acc + tx.amount, 0);
      expect(monthlySum).toBeCloseTo(txSum, 10);
    });

    it('sum of all monthly totals equals sum of all transaction amounts (multiple months)', () => {
      const txs = [
        makeTx('1', 'A',  5.00, 'Food',      '2025-01-10'),
        makeTx('2', 'B', 15.00, 'Transport', '2025-02-20'),
        makeTx('3', 'C', 25.00, 'Fun',       '2025-03-30'),
        makeTx('4', 'D', 10.00, 'Food',      '2025-03-05'),
      ];
      const result = buildMonthlySummary(txs);
      const monthlySum = result.reduce((acc, g) => acc + g.total, 0);
      const txSum = txs.reduce((acc, tx) => acc + tx.amount, 0);
      expect(monthlySum).toBeCloseTo(txSum, 10);
    });

    it('sum of category totals within a month equals the month total', () => {
      const txs = [
        makeTx('1', 'Lunch',  12.50, 'Food',      '2025-05-01'),
        makeTx('2', 'Bus',     2.00, 'Transport',  '2025-05-15'),
        makeTx('3', 'Dinner', 30.00, 'Food',       '2025-05-31'),
      ];
      const [group] = buildMonthlySummary(txs);
      const catSum = Object.values(group.categories).reduce((a, b) => a + b, 0);
      expect(catSum).toBeCloseTo(group.total, 10);
    });
  });

  // -------------------------------------------------------------------------
  // Return value shape
  // -------------------------------------------------------------------------
  describe('return value shape', () => {
    it('each group has label, key, total, and categories properties', () => {
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(group).toHaveProperty('label');
      expect(group).toHaveProperty('key');
      expect(group).toHaveProperty('total');
      expect(group).toHaveProperty('categories');
    });

    it('label is a non-empty string', () => {
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(typeof group.label).toBe('string');
      expect(group.label.length).toBeGreaterThan(0);
    });

    it('key is a string in YYYY-MM format', () => {
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(group.key).toMatch(/^\d{4}-\d{2}$/);
    });

    it('total is a number', () => {
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(typeof group.total).toBe('number');
    });

    it('categories is a plain object', () => {
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      const [group] = buildMonthlySummary(txs);
      expect(typeof group.categories).toBe('object');
      expect(group.categories).not.toBeNull();
    });

    it('returns an array', () => {
      expect(Array.isArray(buildMonthlySummary([]))).toBe(true);
      const txs = [makeTx('1', 'Lunch', 10.00, 'Food', '2025-05-11')];
      expect(Array.isArray(buildMonthlySummary(txs))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles a single category appearing across many months', () => {
      const txs = [
        makeTx('1', 'Jan Food',  5.00, 'Food', '2025-01-01'),
        makeTx('2', 'Feb Food', 10.00, 'Food', '2025-02-01'),
        makeTx('3', 'Mar Food', 15.00, 'Food', '2025-03-01'),
      ];
      const result = buildMonthlySummary(txs);
      expect(result).toHaveLength(3);
      result.forEach(group => {
        expect(Object.keys(group.categories)).toEqual(['Food']);
      });
    });

    it('handles many categories in a single month', () => {
      const txs = [
        makeTx('1', 'A',  1.00, 'Food',      '2025-05-01'),
        makeTx('2', 'B',  2.00, 'Transport', '2025-05-01'),
        makeTx('3', 'C',  3.00, 'Fun',       '2025-05-01'),
        makeTx('4', 'D',  4.00, 'Gym',       '2025-05-01'),
      ];
      const [group] = buildMonthlySummary(txs);
      expect(Object.keys(group.categories)).toHaveLength(4);
      expect(group.total).toBeCloseTo(10.00, 10);
    });

    it('handles transactions with small decimal amounts without precision loss', () => {
      const txs = [
        makeTx('1', 'A', 0.01, 'Food', '2025-05-01'),
        makeTx('2', 'B', 0.01, 'Food', '2025-05-02'),
      ];
      const [group] = buildMonthlySummary(txs);
      expect(group.total).toBeCloseTo(0.02, 10);
      expect(group.categories.Food).toBeCloseTo(0.02, 10);
    });

    it('handles the maximum valid amount', () => {
      const txs = [makeTx('1', 'Big', 999_999_999.99, 'Fun', '2025-05-01')];
      const [group] = buildMonthlySummary(txs);
      expect(group.total).toBe(999_999_999.99);
    });
  });
});
