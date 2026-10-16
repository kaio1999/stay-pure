import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { container } from '../../../core/di/container';
import type { JourneyDay } from '../../../core/domain/entities/models';

export function useJourney() {
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<JourneyDay[]>([]);

  const refresh = useCallback(() => {
    void Promise.all([container.journey.streak(), container.journey.list(21)]).then(
      ([nextStreak, nextDays]) => {
        setStreak(nextStreak);
        setDays(nextDays);
      },
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { streak, days, refresh };
}
