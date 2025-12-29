#!/usr/bin/env node

/**
 * skylight-har2openapi CLI
 * Convert HAR files to OpenAPI specification for Skylight API
 */

import { Command } from 'commander';
import { convertCommand } from './cli.js';

const program = new Command();

program
  .name('skylight-har2openapi')
  .description('Convert HAR files to OpenAPI specification for Skylight API')
  .version('1.0.0');

program.addCommand(convertCommand);

// Default to convert command if no command specified
program.action(() => {
  program.help();
});

program.parse();
