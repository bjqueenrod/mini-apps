import { PricingEnvelope } from '../../utils/pricing';

export type ClipItem = {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  pricePence?: number;
  priceLabel?: string;
  pricing?: PricingEnvelope;
  streamPrice?: number;
  streamPricePence?: number;
  streamPriceLabel?: string;
  streamPricing?: PricingEnvelope;
  watchPricePence?: number;
  watchPriceLabel?: string;
  watchPricing?: PricingEnvelope;
  downloadPrice?: number;
  downloadPricePence?: number;
  downloadPriceLabel?: string;
  downloadPricing?: PricingEnvelope;
  durationSeconds?: number;
  durationLabel?: string;
  thumbnailUrl?: string;
  previewWebpUrl?: string;
  previewEmbedUrl?: string;
  previewType?: string;
  category?: string;
  tags: string[];
  botStreamUrl: string;
  botDownloadUrl: string;
  watchProductId?: number;
  downloadProductId?: number;
  featured?: boolean;
};

export type ClipListResponse = {
  items: ClipItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  categories: string[];
};

export type ClipHashtagOption = {
  tag: string;
  count: number;
};

export type ClipHashtagListResponse = {
  items: ClipHashtagOption[];
};

export type ClipQueryState = {
  q: string;
  category: string;
  tags: string[];
  sort: string;
  page: number;
  currency?: 'GBP' | 'USD';
};
