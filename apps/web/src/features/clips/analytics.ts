import { trackEvent } from '../../app/analytics';
import { ClipItem } from './types';

const TRACKED_START_PARAM_PATTERN = /^l_[0-9a-z]+(?:__[A-Za-z0-9_-]{1,64})?$/;

type ClipListType = 'search_results' | 'new_clips' | 'top_sellers';

function clipParams(clip: ClipItem) {
  return {
    clip_id: clip.id,
    clip_title: clip.title,
    clip_category: clip.category || 'Library',
    clip_duration_seconds: clip.durationSeconds,
    stream_price: clip.streamPrice ?? clip.price,
    download_price: clip.downloadPrice ?? clip.price,
  };
}

function classifyStartParam(startParam?: string) {
  if (!startParam) {
    return 'none';
  }
  if (TRACKED_START_PARAM_PATTERN.test(startParam)) {
    return 'tracked_link';
  }
  if (startParam.startsWith('stream_')) {
    return 'clip_stream';
  }
  if (startParam.startsWith('download_')) {
    return 'clip_download';
  }
  if (startParam.startsWith('buy_')) {
    return 'tier_buy';
  }
  return 'other';
}

export function trackMiniAppOpenAttributed(params: {
  startParam?: string;
  isTelegram: boolean;
  entryPath: string;
}) {
  trackEvent('miniapp_open_attributed', {
    entry_path: params.entryPath,
    is_telegram: params.isTelegram,
    start_param_present: Boolean(params.startParam),
    start_param_type: classifyStartParam(params.startParam),
  });
}

export function trackClipListView(params: {
  listType: ClipListType;
  itemCount: number;
  totalCount?: number;
  page?: number;
  query?: string;
  tags?: string[];
}) {
  trackEvent('clip_list_view', {
    list_type: params.listType,
    item_count: params.itemCount,
    total_count: params.totalCount,
    page: params.page,
    query: params.query || undefined,
    tags: params.tags?.join(',') || undefined,
    has_filters: Boolean(params.query || params.tags?.length),
  });
}

export function trackClipSearch(params: {
  query?: string;
  tags?: string[];
  resultCount: number;
}) {
  const tags = params.tags ?? [];
  const query = params.query?.trim() ?? '';
  trackEvent('clip_search', {
    query: query || undefined,
    tags: tags.join(',') || undefined,
    result_count: params.resultCount,
    search_type: query && tags.length ? 'text_and_tag' : query ? 'text' : 'tag',
  });
}

export function trackClipSelect(params: {
  clip: ClipItem;
  sourceList: ClipListType;
  position: number;
  query?: string;
  tags?: string[];
}) {
  trackEvent('clip_select', {
    ...clipParams(params.clip),
    source_list: params.sourceList,
    list_position: params.position,
    query: params.query || undefined,
    tags: params.tags?.join(',') || undefined,
  });
}

export function trackClipDetailView(clip: ClipItem) {
  trackEvent('clip_detail_view', {
    ...clipParams(clip),
    has_public_preview: Boolean(clip.previewEmbedUrl),
    tag_count: clip.tags.length,
  });
}

export function trackClipTagSelect(params: {
  tag: string;
  source: 'featured_filter' | 'secondary_filter' | 'detail_sheet';
  clip?: ClipItem;
}) {
  trackEvent('clip_tag_select', {
    tag: params.tag,
    source: params.source,
    clip_id: params.clip?.id,
    clip_title: params.clip?.title,
  });
}

export function trackClipBotCtaClick(params: {
  clip: ClipItem;
  ctaType: 'stream' | 'download';
}) {
  trackEvent('clip_bot_cta_click', {
    ...clipParams(params.clip),
    cta_type: params.ctaType,
    price: params.ctaType === 'stream' ? params.clip.streamPrice ?? params.clip.price : params.clip.downloadPrice ?? params.clip.price,
  });
}
