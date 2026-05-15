/**
 * Unit tests for StorageManager
 * Tests: load, save, isAvailable methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Inline StorageManager — mirrors the implementation in js/app.js exactly so
// tests run in the jsdom environment without needing to import the browser
// script (which bootstraps the DOM on load).
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
// Helpers
// ---------------------------------------------------------------------------

/** Replace localStorage with a stub that always throws. */
function makeLocalStorageThrow() {
  const stub = {
    getItem:    vi.fn(() => { throw new Error('Storage error'); }),
    setItem:    vi.fn(() => { throw new Error('Storage error'); }),
    removeItem: vi.fn(() => { throw new Error('Storage error'); }),
  };
  vi.stubGlobal('localStorage', stub);
  return stub;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StorageManager', () => {
  beforeEach(() => {
    // Reset to real jsdom localStorage before each test
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  // -------------------------------------------------------------------------
  // KEYS
  // -------------------------------------------------------------------------
  describe('KEYS', () => {
    it('has the correct TRANSACTIONS key', () => {
      expect(StorageManager.KEYS.TRANSACTIONS).toBe('ebv_transactions');
    });

    it('has the correct CATEGORIES key', () => {
      expect(StorageManager.KEYS.CATEGORIES).toBe('ebv_categories');
    });

    it('has the correct THEME key', () => {
      expect(StorageManager.KEYS.THEME).toBe('ebv_theme');
    });
  });

  // -------------------------------------------------------------------------
  // isAvailable
  // -------------------------------------------------------------------------
  describe('isAvailable()', () => {
    it('returns true when localStorage works normally', () => {
      expect(StorageManager.isAvailable()).toBe(true);
    });

    it('returns false when localStorage throws on setItem', () => {
      makeLocalStorageThrow();
      expect(StorageManager.isAvailable()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // load
  // -------------------------------------------------------------------------
  describe('load(key)', () => {
    it('returns null when the key does not exist', () => {
      expect(StorageManager.load('nonexistent_key')).toBeNull();
    });

    it('returns null on a JSON parse error (corrupted data)', () => {
      localStorage.setItem('bad_key', '{not valid json}');
      expect(StorageManager.load('bad_key')).toBeNull();
    });

    it('returns null on a truncated / incomplete JSON string', () => {
      localStorage.setItem('truncated', '[1,2,');
      expect(StorageManager.load('truncated')).toBeNull();
    });

    it('returns the parsed value for a valid stored string', () => {
      localStorage.setItem('str_key', JSON.stringify('hello'));
      expect(StorageManager.load('str_key')).toBe('hello');
    });

    it('returns the parsed value for a valid stored number', () => {
      localStorage.setItem('num_key', JSON.stringify(42));
      expect(StorageManager.load('num_key')).toBe(42);
    });

    it('returns the parsed value for a valid stored array', () => {
      const arr = [{ id: '1', name: 'Lunch', amount: 12.5 }];
      localStorage.setItem('arr_key', JSON.stringify(arr));
      expect(StorageManager.load('arr_key')).toEqual(arr);
    });

    it('returns the parsed value for a valid stored object', () => {
      const obj = { theme: 'dark' };
      localStorage.setItem('obj_key', JSON.stringify(obj));
      expect(StorageManager.load('obj_key')).toEqual(obj);
    });

    it('does not throw even when localStorage itself throws', () => {
      makeLocalStorageThrow();
      expect(() => StorageManager.load('any_key')).not.toThrow();
      expect(StorageManager.load('any_key')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  describe('save(key, value)', () => {
    it('returns true on a successful save', () => {
      expect(StorageManager.save('test_key', { a: 1 })).toBe(true);
    });

    it('actually persists the value so load can retrieve it', () => {
      const data = ['Food', 'Transport', 'Fun'];
      StorageManager.save(StorageManager.KEYS.CATEGORIES, data);
      expect(StorageManager.load(StorageManager.KEYS.CATEGORIES)).toEqual(data);
    });

    it('returns false when localStorage throws (e.g. quota exceeded)', () => {
      makeLocalStorageThrow();
      expect(StorageManager.save('any_key', 'value')).toBe(false);
    });

    it('does not throw even when localStorage throws', () => {
      makeLocalStorageThrow();
      expect(() => StorageManager.save('any_key', 'value')).not.toThrow();
    });

    it('can save and reload a complex transaction array', () => {
      const transactions = [
        { id: 'abc', name: 'Coffee', amount: 3.5, category: 'Food', date: '2025-05-11' },
        { id: 'def', name: 'Bus',    amount: 1.2, category: 'Transport', date: '2025-05-10' },
      ];
      StorageManager.save(StorageManager.KEYS.TRANSACTIONS, transactions);
      expect(StorageManager.load(StorageManager.KEYS.TRANSACTIONS)).toEqual(transactions);
    });
  });
});
