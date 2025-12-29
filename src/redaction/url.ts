import type { HarQueryString } from '../har/types.js';
import { PATH_ID_PATTERNS, REDACTION_PLACEHOLDERS, PII_PATTERNS } from './patterns.js';

export interface PathParam {
  name: string;
  originalValue: string;
}

export interface RedactedUrl {
  redactedUrl: string;
  pathParams: PathParam[];
}

/**
 * Redact a URL by replacing ID values with path parameters
 * e.g., /api/frames/abc123/chores -> /api/frames/{frameId}/chores
 */
export function redactUrl(url: string): RedactedUrl {
  let redactedUrl = url;
  const pathParams: PathParam[] = [];

  for (const { pattern, paramName } of PATH_ID_PATTERNS) {
    const match = redactedUrl.match(pattern);
    if (match && match[1]) {
      pathParams.push({
        name: paramName,
        originalValue: match[1],
      });
      // Replace the ID with a placeholder in curly braces
      redactedUrl = redactedUrl.replace(pattern, `/${paramName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}s/{${paramName}}`);
    }
  }

  // Also redact query string values that look like IDs
  try {
    const urlObj = new URL(redactedUrl);
    const params = new URLSearchParams(urlObj.search);
    const redactedParams = new URLSearchParams();

    for (const [key, value] of params.entries()) {
      // Redact UUID-like values in query params
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        redactedParams.set(key, REDACTION_PLACEHOLDERS.id);
      } else {
        redactedParams.set(key, value);
      }
    }

    urlObj.search = redactedParams.toString();
    redactedUrl = urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is
  }

  return { redactedUrl, pathParams };
}

/**
 * Normalize a URL path to use parameter placeholders
 * This doesn't redact but normalizes paths for OpenAPI spec
 */
export function normalizePathForOpenApi(path: string): string {
  let normalized = path;

  for (const { pattern, paramName } of PATH_ID_PATTERNS) {
    // Replace captured ID with parameter placeholder
    normalized = normalized.replace(pattern, (match, id) => {
      const prefix = match.replace(id, '');
      return `${prefix}{${paramName}}`;
    });
  }

  return normalized;
}

/**
 * Extract path parameters from a URL
 */
export function extractPathParams(url: string): PathParam[] {
  const pathParams: PathParam[] = [];

  for (const { pattern, paramName } of PATH_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      pathParams.push({
        name: paramName,
        originalValue: match[1],
      });
    }
  }

  return pathParams;
}

/**
 * Redact sensitive values in query string parameters
 */
export function redactQueryString(queryString: HarQueryString[]): HarQueryString[] {
  return queryString.map(param => {
    const value = param.value;

    // Redact UUID-like values
    if (PII_PATTERNS.uuid().test(value)) {
      return { ...param, value: REDACTION_PLACEHOLDERS.id };
    }

    // Redact email-like values
    if (PII_PATTERNS.email().test(value)) {
      return { ...param, value: REDACTION_PLACEHOLDERS.email };
    }

    // Redact JWT-like values
    if (PII_PATTERNS.jwt().test(value)) {
      return { ...param, value: REDACTION_PLACEHOLDERS.token };
    }

    return param;
  });
}
