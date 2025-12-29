/**
 * OpenAPI security schemes for Skylight API
 */

import type { OpenAPIV3 } from 'openapi-types';

/**
 * Get security schemes matching the Skylight API patterns
 */
export function getSecuritySchemes(): Record<string, OpenAPIV3.SecuritySchemeObject> {
  return {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    basicToken: {
      type: 'http',
      scheme: 'basic',
      description: 'Observed Authorization header uses an opaque Basic token. Treat as secret.',
    },
  };
}

/**
 * Get default security requirement
 */
export function getDefaultSecurity(): OpenAPIV3.SecurityRequirementObject[] {
  return [
    { bearerAuth: [] },
    { basicToken: [] },
  ];
}
