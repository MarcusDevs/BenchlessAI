import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStorage } from './KeyValueStorage';

/** Device-only persistence. This adapter does not sync and must not report remote success. */
export const asyncStorageAdapter: KeyValueStorage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};
