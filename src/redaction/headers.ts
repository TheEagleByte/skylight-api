import type { HarHeader } from '../har/types.js';
import { SENSITIVE_HEADERS, REDACTION_PLACEHOLDERS } from './patterns.js';

/**
 * Redact sensitive headers from an array of headers
 */
export function redactHeaders(headers: HarHeader[]): HarHeader[] {
  return headers.map(header => {
    const lowerName = header.name.toLowerCase();

    if (SENSITIVE_HEADERS.includes(lowerName)) {
      return {
        ...header,
        value: REDACTION_PLACEHOLDERS.token,
      };
    }

    return header;
  });
}

/**
 * Check if a header is sensitive
 */
export function isSensitiveHeader(headerName: string): boolean {
  return SENSITIVE_HEADERS.includes(headerName.toLowerCase());
}
