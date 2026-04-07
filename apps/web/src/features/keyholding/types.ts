export type KeyholdingTier = {
  id: string;
  slug?: string;
  name: string;
  desc?: string;
  duration?: string;
  idealFor?: string;
  includes: string[];
  price?: string;
  priceLabel?: string;
  pricePerWeek?: string;
  priceValue?: number;
  paymentProductId?: number;
  badge?: string;
  durationWeeksOptions: number[];
  maxQuantity?: number;
};

export type KeyholdingOption = {
  id: string;
  slug: string;
  label: string;
  tooltip?: string;
  availabilityType?: string;
  availabilityTiers: string[];
  requiresLockboxPhoto: boolean;
  priceLabel?: string;
  priceCents?: number;
  paymentProductId?: number;
  order?: number;
};

export type KeyholdingTierListResponse = {
  items: KeyholdingTier[];
  total: number;
};

export type KeyholdingOptionListResponse = {
  items: KeyholdingOption[];
  total: number;
};
