/**
 * OpenAPI spec writer
 * Outputs spec as YAML or JSON
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stringify as yamlStringify } from 'yaml';
import type { OpenAPIV3 } from 'openapi-types';

/**
 * Output format for the spec
 */
export type OutputFormat = 'yaml' | 'json';

/**
 * Write OpenAPI spec to file
 */
export async function writeOpenApiSpec(
  spec: OpenAPIV3.Document,
  outputPath: string,
  format: OutputFormat = 'yaml'
): Promise<void> {
  // Ensure directory exists
  await mkdir(dirname(outputPath), { recursive: true });

  // Format content
  const content = format === 'yaml'
    ? yamlStringify(spec, { indent: 2, lineWidth: 0 })
    : JSON.stringify(spec, null, 2);

  // Write file
  await writeFile(outputPath, content, 'utf-8');
}

/**
 * Format spec as string
 */
export function formatOpenApiSpec(
  spec: OpenAPIV3.Document,
  format: OutputFormat = 'yaml'
): string {
  return format === 'yaml'
    ? yamlStringify(spec, { indent: 2, lineWidth: 0 })
    : JSON.stringify(spec, null, 2);
}
