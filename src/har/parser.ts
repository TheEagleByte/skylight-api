import { readFile } from 'node:fs/promises';
import { glob } from 'glob';
import type { HarFile } from './types.js';

/**
 * Parse a single HAR file from disk
 */
export async function parseHarFile(filePath: string): Promise<HarFile> {
  const content = await readFile(filePath, 'utf-8');
  const har = JSON.parse(content) as HarFile;

  validateHarStructure(har);

  return har;
}

/**
 * Parse multiple HAR files matching glob patterns
 */
export async function parseMultipleHarFiles(patterns: string[]): Promise<{ path: string; har: HarFile }[]> {
  const files = await glob(patterns, { nodir: true });

  if (files.length === 0) {
    throw new Error(`No HAR files found matching patterns: ${patterns.join(', ')}`);
  }

  const results: { path: string; har: HarFile }[] = [];

  for (const file of files) {
    try {
      const har = await parseHarFile(file);
      results.push({ path: file, har });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse HAR file "${file}": ${message}`);
    }
  }

  return results;
}

/**
 * Validate basic HAR structure
 */
function validateHarStructure(har: unknown): asserts har is HarFile {
  if (typeof har !== 'object' || har === null) {
    throw new Error('HAR file must be a JSON object');
  }

  const obj = har as Record<string, unknown>;

  if (!obj.log || typeof obj.log !== 'object') {
    throw new Error('HAR file must have a "log" property');
  }

  const log = obj.log as Record<string, unknown>;

  if (!Array.isArray(log.entries)) {
    throw new Error('HAR log must have an "entries" array');
  }

  for (const entry of log.entries) {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('HAR entry must be an object');
    }

    const e = entry as Record<string, unknown>;

    if (!e.request || typeof e.request !== 'object') {
      throw new Error('HAR entry must have a "request" object');
    }

    if (!e.response || typeof e.response !== 'object') {
      throw new Error('HAR entry must have a "response" object');
    }

    const request = e.request as Record<string, unknown>;
    if (typeof request.url !== 'string') {
      throw new Error('HAR request must have a "url" string');
    }

    if (typeof request.method !== 'string') {
      throw new Error('HAR request must have a "method" string');
    }
  }
}
