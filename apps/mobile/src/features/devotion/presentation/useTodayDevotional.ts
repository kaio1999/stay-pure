import { useCallback, useEffect, useState } from 'react';
import { container } from '../../../core/di/container';
import type { Devotional } from '../../../core/domain/entities/models';
import { todayKey } from '../../../core/domain/usecases/dateKey';

export function useTodayDevotional() {
  const dateKey = todayKey();
  const [devotion, setDevotion] = useState<Devotional | null>(null);
  const [read, setRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await container.getTodayDevotional.execute(dateKey);
    setDevotion(result.current);
    setRefreshing(true);
    const next = await result.refresh;
    setDevotion(next);
    setRefreshing(false);
    setRead(await container.journey.isRead(dateKey));
  }, [dateKey]);

  const markRead = useCallback(async () => {
    await container.markDevotionalRead.execute(dateKey);
    setRead(true);
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { devotion, refreshing, dateKey, read, markRead, reload: load };
}
