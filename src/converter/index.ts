/**
 * Main converter module
 * Orchestrates HAR to OpenAPI conversion
 */

import { generateSpec, type HarToOpenAPIConfig } from 'har-to-openapi';
import type { OpenAPIV3 } from 'openapi-types';
import type { HarFile } from '../har/types.js';
import { normalizeOpenApiPaths } from './path-normalizer.js';

export { normalizeOpenApiPaths, normalizePath, extractPathParameters } from './path-normalizer.js';

/**
 * Configuration for the converter
 */
export interface ConvertConfig {
  /** API version string */
  version?: string;
  /** Whether to normalize paths with parameters */
  normalizePaths?: boolean;
  /** URL filter pattern */
  urlFilter?: string | RegExp;
  /** Whether to attempt auto-parameterization */
  attemptToParameterizeUrl?: boolean;
}

/**
 * Convert a HAR file to OpenAPI spec
 */
export async function convertHarToOpenApi(
  har: HarFile,
  config: ConvertConfig = {}
): Promise<OpenAPIV3.Document> {
  const harConfig: HarToOpenAPIConfig = {
    // Force all requests to same spec since we're filtering to Skylight API only
    forceAllRequestsInSameSpec: true,

    // Attempt to parameterize URLs (like UUIDs in paths)
    attemptToParameterizeUrl: config.attemptToParameterizeUrl ?? true,

    // Filter standard headers from parameters
    filterStandardHeaders: true,

    // Guess authentication headers
    guessAuthenticationHeaders: true,

    // Drop paths without successful responses
    dropPathsWithoutSuccessfulResponse: true,

    // Try to parse non-json responses as json
    relaxedContentTypeJsonParse: true,

    // URL filter if provided
    urlFilter: config.urlFilter,

    // Generate tags from path
    tags: generateTagFromPath,
  };

  // Convert using har-to-openapi
  const result = await generateSpec(har as unknown as Parameters<typeof generateSpec>[0], harConfig);

  let spec = result.spec as unknown as OpenAPIV3.Document;

  // Normalize paths if enabled
  if (config.normalizePaths !== false && spec.paths) {
    spec = {
      ...spec,
      paths: normalizeOpenApiPaths(spec.paths),
    };
  }

  return spec;
}

/**
 * Generate tag from URL path
 */
function generateTagFromPath(url: string): string | void {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Match /api/frames/{frameId}/{resource}
    const match = path.match(/\/api\/frames\/[^/]+\/([a-z_]+)/i);
    if (match) {
      const resource = match[1];
      return capitalizeTag(resource);
    }

    // Match /api/frames/{frameId}
    if (/\/api\/frames\/[^/]+\/?$/.test(path)) {
      return 'Frames';
    }

    // Match /api/{resource}
    const topLevelMatch = path.match(/\/api\/([a-z_]+)/i);
    if (topLevelMatch) {
      return capitalizeTag(topLevelMatch[1]);
    }
  } catch {
    // Invalid URL
  }

  return undefined;
}

/**
 * Capitalize a tag name (snake_case to Title Case)
 */
function capitalizeTag(tag: string): string {
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
