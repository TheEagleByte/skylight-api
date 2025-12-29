/**
 * Path normalization for OpenAPI spec
 * Converts concrete paths to parameterized paths
 */

import type { OpenAPIV3 } from 'openapi-types';

/**
 * Path parameter patterns for Skylight API
 */
const PATH_PARAM_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Frame ID patterns
  { pattern: /\/frames\/([a-f0-9-]+)/gi, replacement: '/frames/{frameId}' },

  // Nested resource ID patterns (must come after frames)
  { pattern: /\/lists\/([a-f0-9-]+)/gi, replacement: '/lists/{listId}' },
  { pattern: /\/chores\/([a-f0-9-]+)/gi, replacement: '/chores/{choreId}' },
  { pattern: /\/categories\/([a-f0-9-]+)/gi, replacement: '/categories/{categoryId}' },
  { pattern: /\/devices\/([a-f0-9-]+)/gi, replacement: '/devices/{deviceId}' },
  { pattern: /\/rewards\/([a-f0-9-]+)/gi, replacement: '/rewards/{rewardId}' },
  { pattern: /\/reward_points\/([a-f0-9-]+)/gi, replacement: '/reward_points/{rewardPointId}' },
  { pattern: /\/items\/([a-f0-9-]+)/gi, replacement: '/items/{itemId}' },
  { pattern: /\/source_calendars\/([a-f0-9-]+)/gi, replacement: '/source_calendars/{sourceCalendarId}' },
  { pattern: /\/calendar_events\/([a-f0-9-]+)/gi, replacement: '/calendar_events/{calendarEventId}' },

  // Generic UUID pattern (fallback)
  { pattern: /\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi, replacement: '/{id}' },

  // Generic numeric ID pattern (for IDs that are just numbers)
  { pattern: /\/(\d{5,})/g, replacement: '/{id}' },
];

/**
 * Normalize a single path to use parameter placeholders
 */
export function normalizePath(path: string): string {
  let normalized = path;

  for (const { pattern, replacement } of PATH_PARAM_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

/**
 * Extract path parameters from a normalized path
 */
export function extractPathParameters(path: string): OpenAPIV3.ParameterObject[] {
  const params: OpenAPIV3.ParameterObject[] = [];
  const paramPattern = /\{(\w+)\}/g;
  let match;

  while ((match = paramPattern.exec(path)) !== null) {
    const paramName = match[1];
    params.push({
      name: paramName,
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }

  return params;
}

/**
 * Normalize all paths in an OpenAPI spec
 */
export function normalizeOpenApiPaths(
  paths: OpenAPIV3.PathsObject
): OpenAPIV3.PathsObject {
  const normalizedPaths: OpenAPIV3.PathsObject = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const normalizedPath = normalizePath(path);

    if (normalizedPaths[normalizedPath]) {
      // Merge with existing path item
      normalizedPaths[normalizedPath] = mergePathItems(
        normalizedPaths[normalizedPath] as OpenAPIV3.PathItemObject,
        pathItem as OpenAPIV3.PathItemObject
      );
    } else {
      normalizedPaths[normalizedPath] = addPathParameters(
        pathItem as OpenAPIV3.PathItemObject,
        normalizedPath
      );
    }
  }

  return normalizedPaths;
}

/**
 * Add path parameters to a path item
 */
function addPathParameters(
  pathItem: OpenAPIV3.PathItemObject,
  normalizedPath: string
): OpenAPIV3.PathItemObject {
  const pathParams = extractPathParameters(normalizedPath);

  if (pathParams.length === 0) {
    return pathItem;
  }

  // Add parameters to each operation
  const result: OpenAPIV3.PathItemObject = { ...pathItem };

  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

  for (const method of methods) {
    const operation = result[method] as OpenAPIV3.OperationObject | undefined;
    if (operation) {
      const existingParams = (operation.parameters || []) as OpenAPIV3.ParameterObject[];
      const existingParamNames = new Set(existingParams.map(p => p.name));

      // Add path params that don't already exist
      const newParams = pathParams.filter(p => !existingParamNames.has(p.name));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[method] = {
        ...operation,
        parameters: [...newParams, ...existingParams],
      };
    }
  }

  return result;
}

/**
 * Merge two path items (when same normalized path)
 */
function mergePathItems(
  existing: OpenAPIV3.PathItemObject,
  incoming: OpenAPIV3.PathItemObject
): OpenAPIV3.PathItemObject {
  const result: OpenAPIV3.PathItemObject = { ...existing };

  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

  for (const method of methods) {
    if (incoming[method] && !existing[method]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[method] = incoming[method];
    }
    // If both have the same method, keep existing (first one wins)
  }

  return result;
}
