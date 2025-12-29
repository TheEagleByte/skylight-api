/**
 * JSON:API pattern detection and enhancement
 * @see https://jsonapi.org/format/
 */

import type { JSONSchema } from './inferrer.js';

/**
 * Check if a schema represents a JSON:API resource object
 */
export function isJsonApiResource(schema: JSONSchema): boolean {
  if (schema.type !== 'object' || !schema.properties) {
    return false;
  }

  const props = schema.properties;
  return !!(props.type && props.id);
}

/**
 * Check if data looks like a JSON:API resource
 */
export function isJsonApiResourceData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return typeof obj.type === 'string' && (typeof obj.id === 'string' || typeof obj.id === 'number');
}

/**
 * Enhance a schema with JSON:API patterns
 */
export function enhanceWithJsonApiPatterns(schema: JSONSchema): JSONSchema {
  if (!isJsonApiResource(schema)) {
    return schema;
  }

  const props = schema.properties || {};

  return {
    ...schema,
    description: 'JSON:API resource object',
    properties: {
      type: {
        type: 'string',
        description: 'JSON:API resource type',
        ...props.type,
      },
      id: {
        type: 'string',
        description: 'Resource identifier',
        ...props.id,
      },
      attributes: props.attributes || {
        type: 'object',
        additionalProperties: true,
      },
      relationships: props.relationships,
      links: props.links,
      meta: props.meta,
    },
    required: ['type', 'id'],
  };
}

/**
 * Extract resource type from JSON:API data
 */
export function extractResourceType(data: unknown): string | null {
  if (!isJsonApiResourceData(data)) {
    return null;
  }

  return (data as Record<string, unknown>).type as string;
}

/**
 * Create a schema reference for a resource type
 */
export function createResourceSchemaRef(resourceType: string): string {
  const capitalizedType = resourceType
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return `#/components/schemas/${capitalizedType}Resource`;
}

/**
 * Generate component schema name from resource type
 */
export function resourceTypeToSchemaName(resourceType: string): string {
  return resourceType
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Resource';
}

/**
 * Detect if a response follows JSON:API collection pattern
 */
export function isJsonApiCollectionResponse(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // JSON:API responses have a "data" field
  if (!obj.data) {
    return false;
  }

  // Collection responses have an array in "data"
  return Array.isArray(obj.data);
}

/**
 * Detect if a response follows JSON:API single resource pattern
 */
export function isJsonApiSingleResponse(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (!obj.data) {
    return false;
  }

  // Single resource responses have an object in "data"
  return !Array.isArray(obj.data) && isJsonApiResourceData(obj.data);
}
