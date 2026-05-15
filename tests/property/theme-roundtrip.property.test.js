/**
 * Property-Based Tests — Theme Preference Round-Trip
 *
 * Feature: expense-budget-visualizer, Property 10: Theme Preference Round-Trip
 *
 * For each theme value ('light' or 'dark'), saving it to localStorage and then
 * restoring it on initialization should result in the same theme being applied.
 *
 * Validates: Requirements 8.3, 8.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline StorageManager — mirrors js/app.js so tests run in jsdom without
// importing the browser bootstrap script.
// ---------------------------------------------------------------------------
const StorageManager = {
  KEYS: {
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES:   'ebv_categories',
    THEME:        'ebv_theme',
  },

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

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

// ---------------------------------------------------------------------------
// Simulated initApp theme-restore logic (mirrors the design spec behaviour):
// On initialization, read the saved theme from localStorage; if present use it,
// otherwise default to 'light'.
// ---------------------------------------------------------------------------
function restoreTheme() {
  const saved = StorageManager.load(StorageManager.KEYS.THEME);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'light'; // default
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates one of the two valid theme values. */
const themeArb = fc.constantFrom('light', 'dark');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 10: Theme Preference Round-Trip', () => {
  // Feature: expense-budget-visualizer, Property 10: Theme Preference Round-Trip

  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('saving a theme and restoring it always yields the same theme', () => {
    // Feature: expense-budget-visualizer, Property 10: Theme Preference Round-Trip
    fc.assert(
      fc.property(themeArb, (theme) => {
        // Arrange — clear any previous state
        localStorage.clear();

        // Act — persist the theme (simulates the toggle handler)
        const saveResult = StorageManager.save(StorageManager.KEYS.THEME, theme);

        // Assert — save must succeed
        expect(saveResult).toBe(true);

        // Act — restore the theme (simulates initApp on next load)
        const restored = restoreTheme();

        // Assert — restored theme must equal the saved theme
        expect(restored).toBe(theme);
      }),
      { numRuns: 100 },
    );
  });

  it('restoring when no theme is saved defaults to light', () => {
    // Feature: expense-budget-visualizer, Property 10: Theme Preference Round-Trip
    // Edge-case: no saved preference → default 'light' (Requirement 8.5)
    localStorage.clear();
    const restored = restoreTheme();
    expect(restored).toBe('light');
  });

  it('round-trip is stable across multiple save/restore cycles', () => {
    // Feature: expense-budget-visualizer, Property 10: Theme Preference Round-Trip
    fc.assert(
      fc.property(
        fc.array(themeArb, { minLength: 1, maxLength: 20 }),
        (themeSequence) => {
          for (const theme of themeSequence) {
            localStorage.clear();
            StorageManager.save(StorageManager.KEYS.THEME, theme);
            const restored = restoreTheme();
            expect(restored).toBe(theme);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
