/**
 * CLI commands for skylight-har2openapi
 */

import { Command } from 'commander';
import { join } from 'node:path';
import chalk from 'chalk';

import { parseMultipleHarFiles, applyStandardFilters, mergeHarFiles } from './har/index.js';
import { redactHarFile } from './redaction/index.js';
import { convertHarToOpenApi } from './converter/index.js';
import { buildOpenApiSpec, writeOpenApiSpec, type OutputFormat } from './openapi/index.js';
import { generateDocs } from './docs/index.js';

/**
 * Options for the convert command
 */
interface ConvertOptions {
  output: string;
  format: OutputFormat;
  version: string;
  redact: boolean;
  docs: boolean;
  specUrl: string;
  verbose: boolean;
}

/**
 * Logger for CLI output
 */
function createLogger(verbose: boolean) {
  return {
    info: (message: string) => console.log(chalk.blue('ℹ'), message),
    success: (message: string) => console.log(chalk.green('✓'), message),
    warn: (message: string) => console.log(chalk.yellow('⚠'), message),
    error: (message: string) => console.error(chalk.red('✗'), message),
    debug: (message: string) => {
      if (verbose) {
        console.log(chalk.gray('→'), message);
      }
    },
  };
}

/**
 * Convert command
 */
export const convertCommand = new Command('convert')
  .description('Convert HAR files to OpenAPI specification')
  .argument('<har-files...>', 'HAR file(s) or glob patterns')
  .option('-o, --output <dir>', 'Output directory', './docs')
  .option('-f, --format <format>', 'Output format (yaml|json)', (value) => {
    if (value !== 'yaml' && value !== 'json') {
      throw new Error(`Invalid format "${value}". Must be "yaml" or "json".`);
    }
    return value as OutputFormat;
  }, 'yaml')
  .option('-v, --version <version>', 'API version string', '0.1.0')
  .option('--no-redact', 'Skip sensitive data redaction')
  .option('--no-docs', 'Skip HTML documentation generation')
  .option('--spec-url <url>', 'URL for spec in HTML docs', './openapi/openapi.yaml')
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (harFiles: string[], options: ConvertOptions) => {
    const log = createLogger(options.verbose);

    try {
      log.info('Starting HAR to OpenAPI conversion...');
      log.debug(`HAR patterns: ${harFiles.join(', ')}`);
      log.debug(`Options: ${JSON.stringify(options, null, 2)}`);

      // Step 1: Parse HAR files
      log.info('Loading HAR files...');
      const parsed = await parseMultipleHarFiles(harFiles);
      log.success(`Loaded ${parsed.length} HAR file(s)`);

      for (const { path } of parsed) {
        log.debug(`  - ${path}`);
      }

      // Step 2: Filter to Skylight API requests
      log.info('Filtering to Skylight API requests...');
      const filteredHars = parsed.map(({ har }) => applyStandardFilters(har));
      const totalEntries = filteredHars.reduce((sum, har) => sum + har.log.entries.length, 0);
      log.success(`Found ${totalEntries} Skylight API request(s)`);

      if (totalEntries === 0) {
        log.warn('No Skylight API requests found in the HAR file(s)');
        log.warn('Make sure the HAR contains requests to https://app.ourskylight.com/api/');
        return;
      }

      // Step 3: Merge HAR files
      log.info('Merging HAR files...');
      const mergedHar = mergeHarFiles(filteredHars);
      log.success(`Merged into ${mergedHar.log.entries.length} unique request(s)`);

      // Step 4: Redact sensitive data
      let processedHar = mergedHar;
      if (options.redact) {
        log.info('Redacting sensitive data...');
        processedHar = redactHarFile(mergedHar);
        log.success('Redaction complete');
      } else {
        log.warn('Skipping redaction - sensitive data will be preserved');
      }

      // Step 5: Convert to OpenAPI
      log.info('Converting to OpenAPI specification...');
      const rawSpec = await convertHarToOpenApi(processedHar, {
        version: options.version,
        normalizePaths: true,
      });
      log.success('Conversion complete');

      // Step 6: Build final spec with metadata
      log.info('Building final OpenAPI spec...');
      const finalSpec = buildOpenApiSpec(rawSpec, {
        version: options.version,
      });

      const pathCount = Object.keys(finalSpec.paths || {}).length;
      log.success(`Generated spec with ${pathCount} path(s)`);

      // Step 7: Write OpenAPI spec
      const specPath = join(options.output, 'openapi', `openapi.${options.format}`);
      log.info(`Writing spec to ${specPath}...`);
      await writeOpenApiSpec(finalSpec, specPath, options.format);
      log.success(`OpenAPI spec written to: ${specPath}`);

      // Step 8: Generate HTML docs
      if (options.docs) {
        log.info('Generating HTML documentation...');
        await generateDocs({
          outputDir: options.output,
          specUrl: options.specUrl,
        });
        log.success('Documentation generated');
        log.info(`  - ${join(options.output, 'index.html')}`);
        log.info(`  - ${join(options.output, 'swagger.html')}`);
        log.info(`  - ${join(options.output, 'redoc.html')}`);
      }

      console.log();
      log.success('Conversion complete!');
      console.log();
      console.log(chalk.cyan('To view the documentation:'));
      console.log(chalk.gray(`  npx serve ${options.output}`));
      console.log(chalk.gray(`  # Then open http://localhost:3000`));
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });
