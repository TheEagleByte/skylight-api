import {
  SENSITIVE_BODY_FIELDS,
  ID_BODY_FIELDS,
  PII_PATTERNS,
  REDACTION_PLACEHOLDERS,
} from './patterns.js';

/**
 * Recursively redact sensitive data from a JSON body
 */
export function redactBody(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactStringValue(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactBody(item));
  }

  if (typeof data === 'object') {
    return redactObject(data as Record<string, unknown>);
  }

  return data;
}

/**
 * Redact sensitive values from strings
 */
function redactStringValue(value: string): string {
  let result = value;

  // Redact emails (create fresh regex to avoid global flag state issues)
  result = result.replace(PII_PATTERNS.email(), REDACTION_PLACEHOLDERS.email);

  // Redact phone numbers
  result = result.replace(PII_PATTERNS.phone(), REDACTION_PLACEHOLDERS.phone);

  // Redact JWTs
  result = result.replace(PII_PATTERNS.jwt(), REDACTION_PLACEHOLDERS.token);

  return result;
}

/**
 * Redact fields in an object
 */
function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if this field should be redacted
    if (SENSITIVE_BODY_FIELDS.includes(lowerKey)) {
      result[key] = getRedactedValue(key, value);
    } else if (ID_BODY_FIELDS.includes(lowerKey)) {
      // Keep IDs but mark them as redacted if they look like real IDs
      result[key] = redactIdValue(value);
    } else {
      // Recursively redact nested values
      result[key] = redactBody(value);
    }
  }

  return result;
}

/**
 * Get appropriate redacted value based on field name
 */
function getRedactedValue(fieldName: string, originalValue: unknown): unknown {
  const lowerName = fieldName.toLowerCase();

  if (lowerName.includes('email')) {
    return REDACTION_PLACEHOLDERS.email;
  }

  if (lowerName.includes('phone')) {
    return REDACTION_PLACEHOLDERS.phone;
  }

  if (lowerName.includes('url')) {
    return REDACTION_PLACEHOLDERS.url;
  }

  if (lowerName.includes('token') || lowerName.includes('key') || lowerName.includes('secret')) {
    return REDACTION_PLACEHOLDERS.token;
  }

  // For other sensitive fields, use generic redaction
  if (typeof originalValue === 'string') {
    return REDACTION_PLACEHOLDERS.string;
  }

  return originalValue;
}

/**
 * Redact ID values (UUIDs, numeric IDs)
 */
function redactIdValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // If it looks like a UUID, redact it (create fresh regex)
    if (PII_PATTERNS.uuid().test(value)) {
      return REDACTION_PLACEHOLDERS.id;
    }
    return value;
  }

  // Keep numeric IDs as-is (they're often not PII)
  return value;
}

/**
 * Parse and redact JSON content text
 */
export function redactJsonContent(text: string): string {
  try {
    const parsed = JSON.parse(text);
    const redacted = redactBody(parsed);
    return JSON.stringify(redacted);
  } catch {
    // If not valid JSON, return original
    return text;
  }
}
