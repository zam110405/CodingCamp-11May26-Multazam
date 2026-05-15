/**
 * Unit tests for populateCategorySelector(categories)
 * Requirements: 1.1, 1.2, 6.2, 6.6
 *
 * Uses jsdom (provided by Vitest config) to exercise real DOM manipulation.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Inline implementation — mirrors js/app.js exactly so tests run in the
// jsdom environment without importing the browser-bootstrapping script.
// ---------------------------------------------------------------------------

/**
 * Populates the `<select id="tx-category">` element with the provided categories.
 * Clears existing options first, then adds a blank placeholder, then one option per category.
 * @param {string[]} categories
 */
function populateCategorySelector(categories) {
  const select = document.getElementById('tx-category');
  if (!select) return;

  // Clear all existing options
  select.innerHTML = '';

  // Add blank placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select a category --';
  select.appendChild(placeholder);

  // Add one option per category
  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  }
}

// ---------------------------------------------------------------------------
// Test setup — create a minimal DOM with the select element before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = `<select id="tx-category"></select>`;
});

// ===========================================================================
// populateCategorySelector() tests
// ===========================================================================

describe('populateCategorySelector(categories)', () => {

  // -------------------------------------------------------------------------
  // Placeholder option
  // -------------------------------------------------------------------------
  describe('placeholder option', () => {
    it('always inserts a blank placeholder as the first option', () => {
      populateCategorySelector(['Food', 'Transport']);
      const select = document.getElementById('tx-category');
      expect(select.options[0].value).toBe('');
    });

    it('placeholder option has non-empty display text', () => {
      populateCategorySelector(['Food']);
      const select = document.getElementById('tx-category');
      expect(select.options[0].textContent.trim().length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Category options
  // -------------------------------------------------------------------------
  describe('category options', () => {
    it('adds one option per category after the placeholder', () => {
      const categories = ['Food', 'Transport', 'Fun'];
      populateCategorySelector(categories);
      const select = document.getElementById('tx-category');
      // Total options = 1 placeholder + 3 categories
      expect(select.options.length).toBe(4);
    });

    it('sets each option value to the category name', () => {
      const categories = ['Food', 'Transport', 'Fun'];
      populateCategorySelector(categories);
      const select = document.getElementById('tx-category');
      expect(select.options[1].value).toBe('Food');
      expect(select.options[2].value).toBe('Transport');
      expect(select.options[3].value).toBe('Fun');
    });

    it('sets each option text to the category name', () => {
      const categories = ['Food', 'Transport', 'Fun'];
      populateCategorySelector(categories);
      const select = document.getElementById('tx-category');
      expect(select.options[1].textContent).toBe('Food');
      expect(select.options[2].textContent).toBe('Transport');
      expect(select.options[3].textContent).toBe('Fun');
    });

    it('preserves the order of categories as passed', () => {
      const categories = ['Gym', 'Food', 'Transport'];
      populateCategorySelector(categories);
      const select = document.getElementById('tx-category');
      expect(select.options[1].value).toBe('Gym');
      expect(select.options[2].value).toBe('Food');
      expect(select.options[3].value).toBe('Transport');
    });

    it('handles a single category correctly', () => {
      populateCategorySelector(['Food']);
      const select = document.getElementById('tx-category');
      expect(select.options.length).toBe(2); // placeholder + 1
      expect(select.options[1].value).toBe('Food');
    });

    it('handles an empty categories array — only placeholder is present', () => {
      populateCategorySelector([]);
      const select = document.getElementById('tx-category');
      expect(select.options.length).toBe(1);
      expect(select.options[0].value).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Clearing existing options (Requirement 6.6 — refresh after adding category)
  // -------------------------------------------------------------------------
  describe('clearing existing options', () => {
    it('replaces previously populated options on a second call', () => {
      populateCategorySelector(['Food', 'Transport']);
      // Now call again with a different list
      populateCategorySelector(['Gym', 'Fun', 'Travel']);
      const select = document.getElementById('tx-category');
      // Should have placeholder + 3 new categories, not 5 old ones
      expect(select.options.length).toBe(4);
      expect(select.options[1].value).toBe('Gym');
      expect(select.options[2].value).toBe('Fun');
      expect(select.options[3].value).toBe('Travel');
    });

    it('removes stale options that are no longer in the list', () => {
      populateCategorySelector(['Food', 'Transport', 'Fun']);
      populateCategorySelector(['Food']);
      const select = document.getElementById('tx-category');
      expect(select.options.length).toBe(2); // placeholder + Food only
    });
  });

  // -------------------------------------------------------------------------
  // Graceful handling when element is absent
  // -------------------------------------------------------------------------
  describe('missing select element', () => {
    it('does not throw when #tx-category does not exist in the DOM', () => {
      document.body.innerHTML = ''; // remove the select
      expect(() => populateCategorySelector(['Food'])).not.toThrow();
    });
  });
});
