# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CLI tool that converts browser HAR files to OpenAPI 3.0.3 specifications for the Skylight family calendar API. Generates interactive documentation (Swagger UI, ReDoc) with automatic PII redaction.

## Commands

```bash
npm install
npm run build          # Compile TypeScript to dist/
npm run typecheck      # tsc --noEmit
npm run convert -- ./har/*.har  # Convert HAR files to OpenAPI
npm run dev -- convert ./har/*.har  # Run with tsx (no build needed)
npm run clean          # Remove dist/ and docs/openapi
```

## Architecture

The conversion pipeline flows through these modules in order:

1. **har/** - Parse and filter HAR files
   - `parser.ts` - Load HAR from disk, validate structure
   - `filter.ts` - Keep only Skylight API requests (`SKYLIGHT_API_PATTERN`), filter preflight/errors
   - `merger.ts` - Deduplicate entries across multiple HAR files

2. **redaction/** - Remove sensitive data before spec generation
   - `patterns.ts` - Regex patterns for emails, JWTs, UUIDs, phone numbers
   - `headers.ts` - Strip Authorization, Cookie, API keys
   - `body.ts` - Redact PII fields in JSON (`email`, `token`, `password`, etc.)
   - `url.ts` - Redact query string values

3. **converter/** - Transform HAR to OpenAPI
   - Uses `har-to-openapi` library as the core engine
   - `path-normalizer.ts` - Convert concrete paths to parameterized (e.g., `/frames/abc123` → `/frames/{frameId}`)

4. **openapi/** - Build final spec
   - `builder.ts` - Add metadata, security schemes, tags
   - `security.ts` - Bearer and Basic auth definitions
   - `writer.ts` - Output YAML or JSON

5. **docs/** - Generate static HTML
   - `generator.ts` - Create Swagger UI and ReDoc pages
   - `templates/` - HTML templates with embedded CDN scripts

## Key Files

- `src/cli.ts` - Commander CLI with the `convert` command orchestrating the full pipeline
- `src/index.ts` - Entry point with shebang for `npx` execution
- `src/har/types.ts` - TypeScript interfaces for HAR format

## Output Structure

Running `npm run convert` produces:
```
docs/
├── index.html         # Landing page
├── swagger.html       # Swagger UI viewer
├── redoc.html         # ReDoc viewer
└── openapi/
    └── openapi.yaml   # Generated OpenAPI 3.0.3 spec
```

## Technical Notes

- **ESM only** - All imports use `.js` extension (NodeNext resolution)
- **No tests** - This is a build/documentation tool, not a library
- **JSON:API format** - Generated schemas follow JSON:API patterns (type, id, attributes, relationships)
