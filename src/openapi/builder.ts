/**
 * OpenAPI spec builder
 * Finalizes the OpenAPI document with proper metadata
 */

import type { OpenAPIV3 } from 'openapi-types';
import { getSecuritySchemes, getDefaultSecurity } from './security.js';

/**
 * Configuration for building the final spec
 */
export interface BuildConfig {
  /** API version string */
  version?: string;
  /** API title */
  title?: string;
  /** API description */
  description?: string;
  /** Server URL */
  serverUrl?: string;
}

/**
 * Build the final OpenAPI spec with proper metadata
 */
export function buildOpenApiSpec(
  baseSpec: OpenAPIV3.Document,
  config: BuildConfig = {}
): OpenAPIV3.Document {
  const version = config.version || '0.1.0';
  const title = config.title || 'Unofficial Skylight API (Community Reference)';
  const description = config.description || getDefaultDescription();
  const serverUrl = config.serverUrl || 'https://app.ourskylight.com';

  // Extract unique tags from paths
  const tags = extractTags(baseSpec.paths || {});

  // Build the final spec
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      title,
      version,
      description,
    },
    servers: [
      { url: serverUrl },
    ],
    tags: tags.map(name => ({ name })),
    components: {
      ...baseSpec.components,
      securitySchemes: getSecuritySchemes(),
    },
    paths: addSecurityToPaths(baseSpec.paths || {}),
    security: getDefaultSecurity(),
  };

  return spec;
}

/**
 * Get default API description
 */
function getDefaultDescription(): string {
  return `Reverse-engineered reference for Skylight endpoints based on observed traffic.
JSON:API-style resources are common (type, id, attributes, relationships).
**Unofficial**; for research and interoperability. All examples redacted.

Generated on: ${new Date().toISOString()}`;
}

/**
 * Extract unique tags from paths
 */
function extractTags(paths: OpenAPIV3.PathsObject): string[] {
  const tagSet = new Set<string>();

  for (const pathItem of Object.values(paths)) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (operation?.tags) {
        for (const tag of operation.tags) {
          tagSet.add(tag);
        }
      }
    }
  }

  // Sort tags alphabetically
  return Array.from(tagSet).sort();
}

/**
 * Add security to all operations that don't have it
 */
function addSecurityToPaths(paths: OpenAPIV3.PathsObject): OpenAPIV3.PathsObject {
  const result: OpenAPIV3.PathsObject = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const newPathItem: OpenAPIV3.PathItemObject = { ...pathItem };

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    for (const method of methods) {
      const operation = newPathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (operation && !operation.security) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newPathItem as any)[method] = {
          ...operation,
          security: getDefaultSecurity(),
        };
      }
    }

    result[path] = newPathItem;
  }

  return result;
}

/**
 * Merge additional schemas into components
 */
export function mergeComponentSchemas(
  spec: OpenAPIV3.Document,
  schemas: Record<string, OpenAPIV3.SchemaObject>
): OpenAPIV3.Document {
  return {
    ...spec,
    components: {
      ...spec.components,
      schemas: {
        ...spec.components?.schemas,
        ...schemas,
      },
    },
  };
}
