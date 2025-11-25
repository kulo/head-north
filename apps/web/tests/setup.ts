// Configure global test environment
// This file is automatically loaded by Vitest

import { vi } from "vitest";

// Mock localStorage for jsdom environment
// Vue devtools and other libraries may try to access it
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  get length() {
    return Object.keys(this).filter((k) => k !== "length").length;
  },
};

// Set up localStorage mock before any imports that might use it
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Also define it globally for Node.js environment
if (typeof global !== "undefined") {
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
}
