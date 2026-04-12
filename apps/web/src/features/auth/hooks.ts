import { useEffect, useState } from 'react';
import { authenticate } from './api';
import { getTelegramContext } from '../../app/telegram';

const AUTH_RETRY_DELAYS_MS = [0, 120, 350];

export function useTelegramSession() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [context, setContext] = useState(() => getTelegramContext());

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();

    let mounted = true;
    const fallbackDevUser = { id: 1, username: 'local-preview', firstName: 'Local' };

    (async () => {
      for (let i = 0; i < AUTH_RETRY_DELAYS_MS.length; i += 1) {
        if (i > 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(
              resolve,
              AUTH_RETRY_DELAYS_MS[i] - AUTH_RETRY_DELAYS_MS[i - 1],
            );
          });
        }
        if (!mounted) {
          return;
        }

        const ctx = getTelegramContext();
        setContext(ctx);

        const fallbackUser = ctx.isTelegram ? undefined : ctx.user ?? fallbackDevUser;
        const waitForInitData =
          ctx.isTelegram && !ctx.initData?.trim() && i < AUTH_RETRY_DELAYS_MS.length - 1;

        if (waitForInitData) {
          continue;
        }

        try {
          await authenticate(ctx.initData, fallbackUser, ctx.startParam);
          break;
        } catch (err) {
          const retry =
            ctx.isTelegram && !ctx.initData?.trim() && i < AUTH_RETRY_DELAYS_MS.length - 1;
          if (retry) {
            continue;
          }
          if (mounted) {
            setError((err as Error).message);
          }
          break;
        }
      }

      if (mounted) {
        setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { ...context, ready, error };
}
