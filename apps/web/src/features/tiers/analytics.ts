import { trackInteraction, trackScreenView } from '../../app/analytics';
import { TierItem } from './types';

function tierParams(tier: TierItem) {
  return {
    tier_id: tier.id,
    tier_name: tier.name,
    tier_product_id: tier.productId,
    duration_days: tier.durationDays,
    tasks_per_day: tier.tasksPerDay,
    price: tier.price,
    price_label: tier.priceLabel,
    is_unlimited_tasks: tier.isUnlimitedTasks,
    badge: tier.badge,
  };
}

export function trackTierSelect(params: {
  tier: TierItem;
  source: 'tier_card';
}) {
  trackInteraction({
    screen: 'tasks_home',
    actionKey: 'tier_select',
    properties: {
      source: params.source,
      ...tierParams(params.tier),
    },
  });
}

export function trackTierDetailView(tier: TierItem) {
  trackScreenView({
    screen: 'tier_detail',
    properties: tierParams(tier),
  });
}

export function trackTierBotCtaClick(params: {
  tier: TierItem;
  source: 'tier_card' | 'tier_carousel' | 'detail_sheet';
}) {
  trackInteraction({
    screen: params.source === 'detail_sheet' ? 'tier_detail' : 'tasks_home',
    actionKey: 'tier_continue_to_payment',
    properties: {
      source: params.source,
      ...tierParams(params.tier),
    },
  });
}
