import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CODE = 'ryom';
const STORAGE_KEY = 'debug_mode';

let cachedIsDebug = false;
const listeners = new Set<(val: boolean) => void>();

function broadcast(val: boolean) {
  cachedIsDebug = val;
  listeners.forEach((l) => l(val));
}

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(cachedIsDebug);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'true') broadcast(true);
    });
  }, []);

  useEffect(() => {
    const listener = (val: boolean) => setIsDebug(val);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const tryEnable = useCallback((code: string) => {
    if (code.trim() === CODE) {
      AsyncStorage.setItem(STORAGE_KEY, 'true');
      broadcast(true);
      return true;
    }
    return false;
  }, []);

  const disable = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY);
    broadcast(false);
  }, []);

  return { isDebug, tryEnable, disable };
}
