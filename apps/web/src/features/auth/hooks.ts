import { useEffect, useState } from 'react';
import { authenticate } from './api';
import { getTelegramContext } from '../../app/telegram';

export function useTelegramSession() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [context, setContext] = useState(() => getTelegramContext());

  useEffect(() => {
    const ctx = getTelegramContext();
    setContext(ctx);

    let mounted = true;
    const fallbackUser = ctx.isTelegram
      ? undefined
      : ctx.user ?? { id: 1, username: 'local-preview', firstName: 'Local' };
    authenticate(ctx.initData, fallbackUser, ctx.startParam)
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
  }, []);

  return { ...context, ready, error };
}
