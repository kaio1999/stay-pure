import { router } from 'expo-router';
import { useEffect } from 'react';
import { container } from '../../../core/di/container';

export function useBlockEvents() {
  useEffect(() => {
    return container.shield.subscribe((event) => {
      router.push({
        pathname: '/interrupted',
        params: { host: event.host, verseId: event.verseId },
      });
    });
  }, []);
}
