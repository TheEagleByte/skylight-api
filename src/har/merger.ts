import type { HarFile, HarEntry } from './types.js';
import { getEntryKey } from './filter.js';

/**
 * Merge multiple HAR files into a single HAR file
 * Deduplicates entries by method + path + status code
 */
export function mergeHarFiles(harFiles: HarFile[]): HarFile {
  if (harFiles.length === 0) {
    throw new Error('No HAR files to merge');
  }

  if (harFiles.length === 1) {
    return harFiles[0];
  }

  // Collect all entries
  const allEntries = harFiles.flatMap(har => har.log.entries);

  // Deduplicate entries
  const uniqueEntries = deduplicateEntries(allEntries);

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'skylight-har2openapi',
        version: '1.0.0',
      },
      entries: uniqueEntries,
    },
  };
}

/**
 * Deduplicate entries by method + normalized path + status
 * Keeps the entry with the most complete response body
 */
function deduplicateEntries(entries: HarEntry[]): HarEntry[] {
  const entryMap = new Map<string, HarEntry>();

  for (const entry of entries) {
    const key = getEntryKey(entry);
    const existing = entryMap.get(key);

    if (!existing) {
      entryMap.set(key, entry);
    } else {
      // Keep the entry with more response content
      const existingBodySize = existing.response.content.size || 0;
      const newBodySize = entry.response.content.size || 0;

      if (newBodySize > existingBodySize) {
        entryMap.set(key, entry);
      }
    }
  }

  // Sort entries by URL path for consistent output
  return Array.from(entryMap.values()).sort((a, b) => {
    const urlA = a.request.url;
    const urlB = b.request.url;

    if (urlA !== urlB) {
      return urlA.localeCompare(urlB);
    }

    // Same URL, sort by method
    const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const orderA = methodOrder.indexOf(a.request.method.toUpperCase());
    const orderB = methodOrder.indexOf(b.request.method.toUpperCase());

    return orderA - orderB;
  });
}
