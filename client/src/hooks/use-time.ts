import { useState, useEffect } from 'react';
import { getTWTime } from '@/lib/time';

export function useTaiwanTime() {
  const [twTime, setTwTime] = useState<Date>(getTWTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTwTime(getTWTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return twTime;
}
