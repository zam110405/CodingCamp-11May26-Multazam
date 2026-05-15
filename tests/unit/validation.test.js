/**
 * Unit tests for validation functions:
 *   - validateTransaction(name, amount, category, categories) — Requirements: 1.4, 1.5
 *   - validateCategory(name, existingCategories)              — Requirements: 6.3, 6.4, 6.8
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementations — mirror js/app.js exactly so tests run in the
// jsdom environment without importing the browser-bootstrapping script.
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
const MAX_NAME_LENGTH = 100;
const MAX_CUSTOM_CATEGORIES = 50;
const AMOUNT_MIN = 0.01;
const AMOUNT_MAX = 999_999_999.99;

/**
 * Validates the fields for a new transaction.
 * @param {string}   name
 * @param {*}        amount
 * @param {string}   category
 * @param {string[]} categories
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

/**
 * Validates a new custom category name.
 * @param {string}   name
 * @param {string[]} existingCategories
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a category list with `n` custom categories already added. */
function buildCategoriesWithCustom(n) {
  const cats = [...DEFAULT_CATEGORIES];
  for (let i = 1; i <= n; i++) {
    cats.push(`Custom${i}`);
  }
  return cats;
}

// ===========================================================================
// validateTransaction() tests
// ===========================================================================

describe('validateTransaction()', () => {

  // -------------------------------------------------------------------------
  // Valid cases
  // -------------------------------------------------------------------------
  describe('valid inputs', () => {
    it('returns valid=true and empty errors for a fully valid transaction', () => {
      const result = validateTransaction('Lunch', 12.50, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts amount at the minimum boundary (0.01)', () => {
      const result = validateTransaction('Coffee', 0.01, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts amount at the maximum boundary (999,999,999.99)', () => {
      const result = validateTransaction('Big Purchase', 999_999_999.99, 'Fun', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a name with exactly 100 characters', () => {
      const name = 'A'.repeat(100);
      const result = validateTransaction(name, 5.00, 'Transport', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a name that has leading/trailing whitespace (trimmed to valid)', () => {
      const result = validateTransaction('  Groceries  ', 20.00, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a custom category that is in the provided list', () => {
      const categories = [...DEFAULT_CATEGORIES, 'Gym'];
      const result = validateTransaction('Membership', 30.00, 'Gym', categories);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Name validation failures
  // -------------------------------------------------------------------------
  describe('name validation', () => {
    it('rejects an empty name string', () => {
      const result = validateTransaction('', 10.00, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a whitespace-only name (single space)', () => {
      const result = validateTransaction(' ', 10.00, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a whitespace-only name (tabs and spaces)', () => {
      const result = validateTransaction('   \t  ', 10.00, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a name exceeding 100 characters', () => {
      const name = 'A'.repeat(101);
      const result = validateTransaction(name, 10.00, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Amount validation failures
  // -------------------------------------------------------------------------
  describe('amount validation', () => {
    it('rejects amount = 0', () => {
      const result = validateTransaction('Item', 0, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a negative amount', () => {
      const result = validateTransaction('Item', -1, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects amount = 1,000,000,000 (above max)', () => {
      const result = validateTransaction('Item', 1_000_000_000, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a non-numeric string amount', () => {
      const result = validateTransaction('Item', 'abc', 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects NaN', () => {
      const result = validateTransaction('Item', NaN, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects Infinity', () => {
      const result = validateTransaction('Item', Infinity, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects -Infinity', () => {
      const result = validateTransaction('Item', -Infinity, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Category validation failures
  // -------------------------------------------------------------------------
  describe('category validation', () => {
    it('rejects a category not in the list', () => {
      const result = validateTransaction('Item', 10.00, 'Nonexistent', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects an empty string category', () => {
      const result = validateTransaction('Item', 10.00, '', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a category that differs only in case', () => {
      // Category matching is case-sensitive (exact match required)
      const result = validateTransaction('Item', 10.00, 'food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects when categories array is empty', () => {
      const result = validateTransaction('Item', 10.00, 'Food', []);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple errors
  // -------------------------------------------------------------------------
  describe('multiple validation errors', () => {
    it('reports errors for both empty name and invalid amount', () => {
      const result = validateTransaction('', 0, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('reports errors for all three fields when all are invalid', () => {
      const result = validateTransaction('', 0, 'Nonexistent', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe('return value shape', () => {
    it('always returns an object with valid (boolean) and errors (array)', () => {
      const result = validateTransaction('Lunch', 10, 'Food', DEFAULT_CATEGORIES);
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('errors array is empty when valid=true', () => {
      const result = validateTransaction('Lunch', 10, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('errors array is non-empty when valid=false', () => {
      const result = validateTransaction('', 10, 'Food', DEFAULT_CATEGORIES);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// ===========================================================================
// validateCategory() tests
// ===========================================================================

describe('validateCategory(name, existingCategories)', () => {
  const defaultCats = [...DEFAULT_CATEGORIES]; // ['Food', 'Transport', 'Fun']

  // -------------------------------------------------------------------------
  // Valid case
  // -------------------------------------------------------------------------
  describe('valid input', () => {
    it('returns { valid: true, error: null } for a new unique name', () => {
      const result = validateCategory('Gym', defaultCats);
      expect(result).toEqual({ valid: true, error: null });
    });

    it('accepts a name with leading/trailing spaces (trimmed to valid)', () => {
      const result = validateCategory('  Gym  ', defaultCats);
      expect(result).toEqual({ valid: true, error: null });
    });

    it('accepts a name that is exactly 100 characters long', () => {
      const name = 'A'.repeat(100);
      const result = validateCategory(name, defaultCats);
      expect(result).toEqual({ valid: true, error: null });
    });
  });

  // -------------------------------------------------------------------------
  // Empty / whitespace-only names
  // -------------------------------------------------------------------------
  describe('empty or whitespace-only name', () => {
    it('rejects an empty string', () => {
      const result = validateCategory('', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects a whitespace-only string (spaces)', () => {
      const result = validateCategory('   ', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects a whitespace-only string (tabs and newlines)', () => {
      const result = validateCategory('\t\n', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Name exceeds 100 characters
  // -------------------------------------------------------------------------
  describe('name exceeding 100 characters', () => {
    it('rejects a name that is 101 characters long', () => {
      const name = 'A'.repeat(101);
      const result = validateCategory(name, defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects a name that is 200 characters long', () => {
      const name = 'B'.repeat(200);
      const result = validateCategory(name, defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate detection — same case
  // -------------------------------------------------------------------------
  describe('duplicate name (same case)', () => {
    it('rejects a name that exactly matches an existing default category', () => {
      const result = validateCategory('Food', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects a name that exactly matches an existing custom category', () => {
      const cats = [...defaultCats, 'Gym'];
      const result = validateCategory('Gym', cats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate detection — different case
  // -------------------------------------------------------------------------
  describe('duplicate name (different case)', () => {
    it('rejects "food" when "Food" already exists', () => {
      const result = validateCategory('food', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects "TRANSPORT" when "Transport" already exists', () => {
      const result = validateCategory('TRANSPORT', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects "fUn" when "Fun" already exists', () => {
      const result = validateCategory('fUn', defaultCats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects mixed-case duplicate of a custom category', () => {
      const cats = [...defaultCats, 'Gym'];
      const result = validateCategory('GYM', cats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Max 50 custom categories
  // -------------------------------------------------------------------------
  describe('maximum custom category limit (50)', () => {
    it('accepts the 50th custom category (49 already exist)', () => {
      const cats = buildCategoriesWithCustom(49); // 3 defaults + 49 custom = 52 total, but customCount = 49
      const result = validateCategory('NewCat', cats);
      expect(result).toEqual({ valid: true, error: null });
    });

    it('rejects the 51st custom category (50 already exist)', () => {
      const cats = buildCategoriesWithCustom(50); // 3 defaults + 50 custom
      const result = validateCategory('OneMore', cats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects when well over 50 custom categories exist', () => {
      const cats = buildCategoriesWithCustom(60);
      const result = validateCategory('AnotherOne', cats);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe('return value shape', () => {
    it('always returns an object with valid (boolean) and error (string|null)', () => {
      const pass = validateCategory('Unique', defaultCats);
      expect(typeof pass.valid).toBe('boolean');
      expect(pass.error).toBeNull();

      const fail = validateCategory('', defaultCats);
      expect(typeof fail.valid).toBe('boolean');
      expect(typeof fail.error).toBe('string');
    });
  });
});
