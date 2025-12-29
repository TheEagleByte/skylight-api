import type { HarFile, HarEntry } from './types.js';

/**
 * Default filter pattern for Skylight API requests
 */
export const SKYLIGHT_API_PATTERN = /^https:\/\/app\.ourskylight\.com\/api\//;

/**
 * Filter HAR entries to only include Skylight API requests
 */
export function filterSkylightRequests(har: HarFile, pattern: RegExp = SKYLIGHT_API_PATTERN): HarFile {
  const filteredEntries = har.log.entries.filter(entry =>
    pattern.test(entry.request.url)
  );

  return {
    log: {
      ...har.log,
      entries: filteredEntries,
    },
  };
}

/**
 * Filter entries that have successful responses (2xx or 304)
 */
export function filterSuccessfulResponses(har: HarFile): HarFile {
  const filteredEntries = har.log.entries.filter(entry => {
    const status = entry.response.status;
    return (status >= 200 && status < 300) || status === 304;
  });

  return {
    log: {
      ...har.log,
      entries: filteredEntries,
    },
  };
}

/**
 * Filter out OPTIONS preflight requests
 */
export function filterOutPreflight(har: HarFile): HarFile {
  const filteredEntries = har.log.entries.filter(entry =>
    entry.request.method.toUpperCase() !== 'OPTIONS'
  );

  return {
    log: {
      ...har.log,
      entries: filteredEntries,
    },
  };
}

/**
 * Apply all standard filters for Skylight API
 */
export function applyStandardFilters(har: HarFile): HarFile {
  let filtered = filterSkylightRequests(har);
  filtered = filterOutPreflight(filtered);
  filtered = filterSuccessfulResponses(filtered);
  return filtered;
}

/**
 * Get unique entry key for deduplication
 */
export function getEntryKey(entry: HarEntry): string {
  try {
    const url = new URL(entry.request.url);
    // Remove query params for the key to group similar requests
    const basePath = `${url.origin}${url.pathname}`;
    return `${entry.request.method}:${basePath}:${entry.response.status}`;
  } catch {
    // If URL is malformed, use the raw URL as the key
    return `${entry.request.method}:${entry.request.url}:${entry.response.status}`;
  }
}
