import { isTelegramRuntime } from './runtime';

export function paymentWaitingCheckoutMessage(isCryptoReturn: boolean): string {
  if (isCryptoReturn) {
    return 'Thanks, confirming your payment…';
  }
  if (isTelegramRuntime()) {
    return 'Checkout opened outside Telegram. Keep this open for payment updates.';
  }
  return 'Checkout opened in your browser. Complete payment and we’ll update here.';
}

export function paymentReturnTimeoutMessage(): string {
  if (isTelegramRuntime()) {
    return 'Still waiting for confirmation. If you paid, it may take a minute. Try again or continue in the bot.';
  }
  return 'Still waiting for confirmation. If you paid, it may take a minute. Try again from this page.';
}

export function paymentReturnNoDeliveryMessage(): string {
  if (isTelegramRuntime()) {
    return 'You can close this window or continue in the bot.';
  }
  return 'You can close this window or return to the site.';
}

export function paymentSuccessGenericBodyMessage(): string {
  if (isTelegramRuntime()) {
    return 'You can close this window. If needed, continue in the bot.';
  }
  return 'You can close this window or keep browsing the site.';
}

export function labelPayInBotInstead(): string {
  return isTelegramRuntime() ? 'Pay in bot instead' : 'Pay in Telegram bot';
}

export function labelOpenBot(): string {
  return isTelegramRuntime() ? 'Open bot' : 'Open Telegram bot';
}
