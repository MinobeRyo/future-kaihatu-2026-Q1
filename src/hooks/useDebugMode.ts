import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const KEY = 'debug_mode';
const CODE = 'ryom';

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => setIsDebug(val === 'true'));
  }, []);

  const tryEnable = useCallback(async (code: string) => {
    if (code === CODE) {
      await AsyncStorage.setItem(KEY, 'true');
      setIsDebug(true);
      return true;
    }
    return false;
  }, []);

  const disable = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setIsDebug(false);
  }, []);

  const recheck = useCallback(async () => {
    const val = await AsyncStorage.getItem(KEY);
    setIsDebug(val === 'true');
  }, []);

  return { isDebug, tryEnable, disable, recheck };
}
