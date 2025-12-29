import type { HarFile, HarEntry } from '../har/types.js';
import { redactHeaders } from './headers.js';
import { redactBody, redactJsonContent } from './body.js';
import { redactQueryString } from './url.js';

export * from './patterns.js';
export * from './headers.js';
export * from './body.js';
export * from './url.js';

/**
 * Redact all sensitive data from a HAR file
 */
export function redactHarFile(har: HarFile): HarFile {
  return {
    log: {
      ...har.log,
      entries: har.log.entries.map(redactEntry),
    },
  };
}

/**
 * Redact a single HAR entry
 */
function redactEntry(entry: HarEntry): HarEntry {
  return {
    ...entry,
    request: {
      ...entry.request,
      headers: redactHeaders(entry.request.headers),
      cookies: [], // Always remove cookies
      queryString: redactQueryString(entry.request.queryString),
      postData: entry.request.postData ? redactPostData(entry.request.postData) : undefined,
    },
    response: {
      ...entry.response,
      headers: redactHeaders(entry.response.headers),
      cookies: [], // Always remove cookies
      content: redactContent(entry.response.content),
    },
  };
}

/**
 * Redact POST data
 */
function redactPostData(postData: HarEntry['request']['postData']): HarEntry['request']['postData'] {
  if (!postData) return undefined;

  let redactedText = postData.text;

  if (redactedText && postData.mimeType.includes('json')) {
    redactedText = redactJsonContent(redactedText);
  }

  return {
    ...postData,
    text: redactedText,
    params: postData.params?.map(param => ({
      ...param,
      value: param.value ? 'REDACTED' : undefined,
    })),
  };
}

/**
 * Redact response content
 */
function redactContent(content: HarEntry['response']['content']): HarEntry['response']['content'] {
  let redactedText = content.text;

  if (redactedText && content.mimeType.includes('json')) {
    redactedText = redactJsonContent(redactedText);
  }

  return {
    ...content,
    text: redactedText,
  };
}
