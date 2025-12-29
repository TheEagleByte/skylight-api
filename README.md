# Skylight API - HAR to OpenAPI Converter

Convert HAR files (exported from browser DevTools) into an OpenAPI specification for the Skylight API.

## Features

- **HAR Parsing**: Load and merge multiple HAR files
- **Smart Filtering**: Extract only Skylight API requests (`https://app.ourskylight.com/api/*`)
- **Auto Redaction**: Automatically redact sensitive data (auth tokens, UUIDs, PII)
- **Path Normalization**: Convert concrete paths to parameterized paths (e.g., `/frames/abc123` → `/frames/{frameId}`)
- **Schema Inference**: Infer JSON schemas from observed response bodies
- **Static Documentation**: Generate Swagger UI and ReDoc HTML viewers

## Installation

```bash
npm install
```

## Usage

### 1. Export HAR from Browser

1. Open the Skylight web app in Chrome/Firefox
2. Open DevTools (F12) → Network tab
3. Interact with the app to capture API requests
4. Right-click in the Network tab → "Save all as HAR with content"
5. Save the HAR file to the `har/` directory

### 2. Convert to OpenAPI

```bash
# Convert a single HAR file
npm run convert -- ./har/traffic.har

# Convert multiple HAR files (merged)
npm run convert -- "./har/*.har"

# With custom options
npm run convert -- "./har/*.har" -o ./docs -v "1.0.0"
```

### 3. View Documentation

```bash
# Serve the docs locally
npx serve ./docs

# Open http://localhost:3000
```

## CLI Options

```
Usage: skylight-har2openapi convert [options] <har-files...>

Convert HAR files to OpenAPI specification

Arguments:
  har-files              HAR file(s) or glob patterns

Options:
  -o, --output <dir>     Output directory (default: "./docs")
  -f, --format <format>  Output format (yaml|json) (default: "yaml")
  -v, --version <ver>    API version string (default: "0.1.0")
  --no-redact            Skip sensitive data redaction
  --no-docs              Skip HTML documentation generation
  --spec-url <url>       URL for spec in HTML docs (default: "./openapi/openapi.yaml")
  --verbose              Enable verbose logging
  -h, --help             Display help
```

## Output Structure

```
docs/
├── index.html           # Landing page
├── swagger.html         # Swagger UI viewer
├── redoc.html           # ReDoc viewer
└── openapi/
    └── openapi.yaml     # Generated OpenAPI spec
```

## Redaction

The tool automatically redacts:

- **Headers**: `Authorization`, `Cookie`, `Set-Cookie`, API keys
- **Path IDs**: UUIDs in URL paths (converted to parameters like `{frameId}`)
- **Body Fields**: `email`, `phone`, `token`, `password`, and other PII
- **Values**: Emails, phone numbers, JWTs, UUIDs in response bodies

To skip redaction (for local testing only):

```bash
npm run convert -- ./har/*.har --no-redact
```

## API Reference

The generated spec follows the patterns from the [skylight-api-old](../skylight-api-old/) reference:

- OpenAPI 3.0.3 format
- JSON:API resource patterns (`type`, `id`, `attributes`, `relationships`)
- Bearer and Basic authentication schemes
- Tags organized by resource type (Frames, Chores, Lists, etc.)

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Run directly with tsx
npm run dev -- convert ./har/*.har
```

## License

MIT
