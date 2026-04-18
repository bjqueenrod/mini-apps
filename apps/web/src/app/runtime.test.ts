import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeRuntime, resetRuntimeInitForTests } from './runtime';

function stubDocumentClassList() {
  const present = new Set<string>();
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        add(name: string) {
          present.add(name);
        },
        remove(...names: string[]) {
          names.forEach((name) => present.delete(name));
        },
        contains(name: string) {
          return present.has(name);
        },
      },
    },
  });
  return present;
}

describe('initializeRuntime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRuntimeInitForTests();
  });

  it('tags html as browser when Telegram WebApp is missing', () => {
    const present = stubDocumentClassList();
    vi.stubGlobal('window', { Telegram: undefined });
    initializeRuntime();
    expect(present.has('runtime--browser')).toBe(true);
    expect(present.has('runtime--telegram')).toBe(false);
  });

  it('tags html as telegram when WebApp is present', () => {
    const present = stubDocumentClassList();
    vi.stubGlobal('window', {
      Telegram: {
        WebApp: {
          ready: vi.fn(),
          expand: vi.fn(),
        },
      },
    });
    initializeRuntime();
    expect(present.has('runtime--telegram')).toBe(true);
    expect(present.has('runtime--browser')).toBe(false);
  });
});
