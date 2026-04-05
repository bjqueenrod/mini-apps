import { useEffect, useMemo, useState } from 'react';
import { authenticate } from './api';
import { getTelegramContext } from '../../app/telegram';

export function useTelegramSession() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const context = useMemo(() => getTelegramContext(), []);

  useEffect(() => {
    let mounted = true;
    const fallbackUser = context.user ?? { id: 1, username: 'local-preview', firstName: 'Local' };
    authenticate(context.initData, fallbackUser, context.startParam)
      .catch((err: Error) => {
        if (mounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [context.initData, context.startParam, context.user?.id]);

  return { ...context, ready, error };
}
