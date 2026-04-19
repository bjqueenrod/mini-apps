import { useEffect, useState } from 'react';
import { getBrowserGuestUser } from '../../app/browserGuest';
import { getTelegramContext } from '../../app/telegram';
import { authenticate } from './api';

const AUTH_RETRY_DELAYS_MS = [0, 120, 350];

export function useTelegramSession() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  /** True once the auth retry loop has finished (success or final failure). */
  const [authResolved, setAuthResolved] = useState(false);
  const [context, setContext] = useState(() => getTelegramContext());

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();

    let mounted = true;
    (async () => {
      let sessionEstablished = false;
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

        const trimmedInit = ctx.initData?.trim() ?? '';
        // When WebApp exists but signed initData is missing (common outside a real mini-app open),
        // we must still send devUser for browser-guest auth — never omit both initData and devUser.
        const fallbackUser = trimmedInit ? undefined : (ctx.user ?? getBrowserGuestUser());
        const waitForInitData =
          ctx.isTelegram && !trimmedInit && i < AUTH_RETRY_DELAYS_MS.length - 1;

        if (waitForInitData) {
          continue;
        }

        try {
          await authenticate(trimmedInit || undefined, fallbackUser, ctx.startParam);
          if (mounted) {
            setError(null);
          }
          sessionEstablished = true;
          break;
        } catch (err) {
          const retry =
            ctx.isTelegram && !trimmedInit && i < AUTH_RETRY_DELAYS_MS.length - 1;
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
        setReady(sessionEstablished);
        setAuthResolved(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { ...context, ready, error, authResolved };
}
