/**
 * Patterns for identifying and redacting sensitive data
 */

/**
 * Headers that should always be redacted
 */
export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token',
];

/**
 * Path segments that contain resource IDs (to be parameterized)
 */
export const PATH_ID_PATTERNS: { pattern: RegExp; paramName: string }[] = [
  { pattern: /\/frames\/([a-f0-9-]+)/i, paramName: 'frameId' },
  { pattern: /\/lists\/([a-f0-9-]+)/i, paramName: 'listId' },
  { pattern: /\/chores\/([a-f0-9-]+)/i, paramName: 'choreId' },
  { pattern: /\/categories\/([a-f0-9-]+)/i, paramName: 'categoryId' },
  { pattern: /\/devices\/([a-f0-9-]+)/i, paramName: 'deviceId' },
  { pattern: /\/rewards\/([a-f0-9-]+)/i, paramName: 'rewardId' },
  { pattern: /\/reward_points\/([a-f0-9-]+)/i, paramName: 'rewardPointId' },
  { pattern: /\/items\/([a-f0-9-]+)/i, paramName: 'itemId' },
  { pattern: /\/source_calendars\/([a-f0-9-]+)/i, paramName: 'sourceCalendarId' },
  { pattern: /\/calendar_events\/([a-f0-9-]+)/i, paramName: 'calendarEventId' },
];

/**
 * Body fields that should be redacted
 */
export const SENSITIVE_BODY_FIELDS = [
  'email',
  'phone',
  'phone_number',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'password',
  'secret',
  'profile_pic_url',
  'avatar_url',
  'first_name',
  'last_name',
  'full_name',
  'address',
  'street',
  'city',
  'zip',
  'postal_code',
];

/**
 * Body fields that are IDs and should be redacted with placeholder
 */
export const ID_BODY_FIELDS = [
  'id',
  'user_id',
  'frame_id',
  'list_id',
  'chore_id',
  'category_id',
  'device_id',
];

/**
 * Regex pattern sources for detecting PII in values
 * Using functions to create fresh regex instances avoids global flag state issues
 */
export const PII_PATTERNS = {
  email: () => /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: () => /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  uuid: () => /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  jwt: () => /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g,
};

/**
 * Placeholder values for redacted data
 */
export const REDACTION_PLACEHOLDERS = {
  string: 'REDACTED',
  email: 'user@example.com',
  phone: '555-555-5555',
  id: 'REDACTED_ID',
  url: 'https://example.com/redacted',
  token: 'REDACTED_TOKEN',
};
