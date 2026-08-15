// Source adapters for vocabulary-image tools. Configure only the providers
// whose API credentials or approved search endpoint are available locally.

const defaults = ['unsplash', 'pinterest', 'pexels', 'pixabay', 'openverse'];
const supported = new Set(defaults);

function listFromEnv() {
  const requested = (process.env.IMAGE_SOURCE_PRIORITY ?? defaults.join(','))
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(requested.filter(value => supported.has(value)))];
  return unique.includes('openverse') ? unique : [...unique, 'openverse'];
}

function queryUrl(base, params) {
  return `${base}?${new URLSearchParams(params)}`;
}

function asCandidates(items, mapper) {
  return (items ?? []).map(mapper).filter(item => item.url && item.width && item.height);
}

async function tryFetchJson(fetchJson, url, headers) {
  try { return await fetchJson(url, headers); }
  catch { return null; }
}

function pinterestUrl(template, query) {
  return template
    .replaceAll('{query}', encodeURIComponent(query))
    .replaceAll('{access_token}', encodeURIComponent(process.env.PINTEREST_ACCESS_TOKEN ?? ''));
}

/**
 * Returns candidates from the first configured preferred provider that yields
 * results. Pinterest requires PINTEREST_IMAGE_SEARCH_URL: an approved search
 * endpoint returning { results: [{ url, width, height, title, tags }] }.
 */
export async function preferredCandidates(query, fetchJson) {
  for (const source of listFromEnv()) {
    if (source === 'openverse') return null;

    if (source === 'unsplash' && process.env.UNSPLASH_ACCESS_KEY) {
      const data = await tryFetchJson(fetchJson, queryUrl('https://api.unsplash.com/search/photos', {
        query, per_page: '20', orientation: 'landscape', content_filter: 'high',
      }), { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` });
      const candidates = asCandidates(data?.results, item => ({
        url: item.urls?.regular ?? item.urls?.full,
        width: item.width,
        height: item.height,
        title: item.alt_description ?? item.description ?? '',
        tags: [],
        source: item.links?.html ?? 'https://unsplash.com',
        attribution: item.user?.name ?? '',
        license: 'Unsplash License',
      }));
      if (candidates.length) return candidates;
    }

    if (source === 'pinterest' && process.env.PINTEREST_IMAGE_SEARCH_URL) {
      const headers = process.env.PINTEREST_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}` }
        : {};
      const data = await tryFetchJson(fetchJson, pinterestUrl(process.env.PINTEREST_IMAGE_SEARCH_URL, query), headers);
      const candidates = asCandidates(data?.results ?? data?.items, item => ({
        url: item.url ?? item.image_url ?? item.media?.url,
        width: item.width ?? item.media?.width,
        height: item.height ?? item.media?.height,
        title: item.title ?? item.description ?? '',
        tags: item.tags ?? [],
        source: item.link ?? item.page_url ?? 'https://www.pinterest.com',
        attribution: item.attribution ?? '',
        license: item.license ?? 'Pinterest source',
      }));
      if (candidates.length) return candidates;
    }

    if (source === 'pexels' && process.env.PEXELS_API_KEY) {
      const data = await tryFetchJson(fetchJson, queryUrl('https://api.pexels.com/v1/search', {
        query, per_page: '20', orientation: 'landscape', size: 'medium', locale: 'en-US',
      }), { Authorization: process.env.PEXELS_API_KEY });
      const candidates = asCandidates(data?.photos, item => ({
        url: item.src?.large2x ?? item.src?.large ?? item.src?.original,
        width: item.width,
        height: item.height,
        title: item.alt ?? '',
        tags: [],
        source: item.url ?? 'https://www.pexels.com',
        attribution: item.photographer ?? '',
        license: 'Pexels License',
      }));
      if (candidates.length) return candidates;
    }

    if (source === 'pixabay' && process.env.PIXABAY_API_KEY) {
      const data = await tryFetchJson(fetchJson, queryUrl('https://pixabay.com/api/', {
        key: process.env.PIXABAY_API_KEY, q: query, image_type: 'photo',
        orientation: 'horizontal', safesearch: 'true', per_page: '20', lang: 'en',
      }));
      const candidates = asCandidates(data?.hits, item => ({
        url: item.largeImageURL ?? item.webformatURL,
        width: item.imageWidth ?? item.webformatWidth,
        height: item.imageHeight ?? item.webformatHeight,
        title: item.tags ?? '',
        tags: (item.tags ?? '').split(',').map(tag => tag.trim()),
        source: item.pageURL ?? 'https://pixabay.com',
        attribution: item.user ?? '',
        license: 'Pixabay Content License',
      }));
      if (candidates.length) return candidates;
    }
  }
  return null;
}

export function configuredSourceSummary() {
  return listFromEnv().map(source => {
    if (source === 'unsplash') return `${source}${process.env.UNSPLASH_ACCESS_KEY ? '' : ' (not configured)'}`;
    if (source === 'pinterest') return `${source}${process.env.PINTEREST_IMAGE_SEARCH_URL ? '' : ' (not configured)'}`;
    if (source === 'pexels') return `${source}${process.env.PEXELS_API_KEY ? '' : ' (not configured)'}`;
    if (source === 'pixabay') return `${source}${process.env.PIXABAY_API_KEY ? '' : ' (not configured)'}`;
    return source;
  }).join(', ');
}
