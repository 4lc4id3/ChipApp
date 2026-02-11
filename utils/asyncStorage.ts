type StoragePair = [string, string];

const memoryStorage = new Map<string, string>();

const getStorage = () => {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
};

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = getStorage();

    if (storage) {
      return storage.getItem(key);
    }

    return memoryStorage.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const storage = getStorage();

    if (storage) {
      storage.setItem(key, value);
      return;
    }

    memoryStorage.set(key, value);
  },

  async multiGet(keys: readonly string[]): Promise<Array<[string, string | null]>> {
    return Promise.all(
      keys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        return [key, value];
      })
    );
  },

  async multiSet(keyValuePairs: readonly StoragePair[]): Promise<void> {
    await Promise.all(
      keyValuePairs.map(([key, value]) => {
        return AsyncStorage.setItem(key, value);
      })
    );
  }
};

export default AsyncStorage;
