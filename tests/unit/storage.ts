// Shared fake Storage helpers for unit tests. Not a test file (no `.test.ts`).

export function makeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length(): number {
      return map.size;
    },
    clear(): void {
      map.clear();
    },
    getItem(key: string): string | null {
      return map.get(key) ?? null;
    },
    key(index: number): string | null {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    }
  };
}

export function throwingStorage(): Storage {
  return {
    get length(): number {
      return 0;
    },
    clear(): void {
      throw new Error('storage unavailable');
    },
    getItem(): string | null {
      throw new Error('storage unavailable');
    },
    key(): string | null {
      throw new Error('storage unavailable');
    },
    removeItem(): void {
      throw new Error('storage unavailable');
    },
    setItem(): void {
      throw new Error('storage unavailable');
    }
  };
}
