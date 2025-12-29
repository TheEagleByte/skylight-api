/**
 * Documentation generator
 * Creates static HTML files for Swagger UI and ReDoc
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration for documentation generation
 */
export interface DocsConfig {
  /** Output directory for docs */
  outputDir: string;
  /** Relative path to OpenAPI spec from docs directory */
  specUrl?: string;
}

/**
 * Generate static HTML documentation files
 */
export async function generateDocs(config: DocsConfig): Promise<void> {
  const { outputDir, specUrl = './openapi/openapi.yaml' } = config;

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Generate Swagger UI
  await generateSwaggerUi(outputDir, specUrl);

  // Generate ReDoc
  await generateRedoc(outputDir, specUrl);

  // Generate landing page
  await generateLandingPage(outputDir, specUrl);
}

/**
 * Generate Swagger UI HTML
 */
async function generateSwaggerUi(outputDir: string, specUrl: string): Promise<void> {
  const templatePath = join(__dirname, 'templates', 'swagger.html');
  let template: string;

  try {
    template = await readFile(templatePath, 'utf-8');
  } catch {
    // Use inline template if file doesn't exist
    template = getSwaggerTemplate();
  }

  const html = template.replace(/\{\{SPEC_URL\}\}/g, specUrl);
  await writeFile(join(outputDir, 'swagger.html'), html, 'utf-8');
}

/**
 * Generate ReDoc HTML
 */
async function generateRedoc(outputDir: string, specUrl: string): Promise<void> {
  const templatePath = join(__dirname, 'templates', 'redoc.html');
  let template: string;

  try {
    template = await readFile(templatePath, 'utf-8');
  } catch {
    // Use inline template if file doesn't exist
    template = getRedocTemplate();
  }

  const html = template.replace(/\{\{SPEC_URL\}\}/g, specUrl);
  await writeFile(join(outputDir, 'redoc.html'), html, 'utf-8');
}

/**
 * Generate landing page
 */
async function generateLandingPage(outputDir: string, specUrl: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skylight API Documentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 600px;
      width: 90%;
    }
    h1 {
      color: #1a202c;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .subtitle {
      color: #718096;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .links {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    a {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
    }
    .swagger { background: #85ea2d; color: #173647; }
    .swagger:hover { background: #6bc62d; }
    .redoc { background: #32329f; color: white; }
    .redoc:hover { background: #28287f; }
    .spec { background: #e2e8f0; color: #475569; }
    .spec:hover { background: #cbd5e1; }
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Unofficial</span>
    <h1>Skylight API</h1>
    <p class="subtitle">Community-maintained API reference</p>
    <div class="links">
      <a href="swagger.html" class="swagger">Swagger UI</a>
      <a href="redoc.html" class="redoc">ReDoc</a>
      <a href="${specUrl}" class="spec">OpenAPI Spec</a>
    </div>
    <p class="footer">
      Generated from HAR files. For research and interoperability purposes only.
    </p>
  </div>
</body>
</html>`;

  await writeFile(join(outputDir, 'index.html'), html, 'utf-8');
}

/**
 * Inline Swagger UI template
 */
function getSwaggerTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Swagger UI - Skylight API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "{{SPEC_URL}}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Inline ReDoc template
 */
function getRedocTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ReDoc - Skylight API</title>
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="redoc-container">Loading...</div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('{{SPEC_URL}}', {
      scrollYOffset: 0,
      expandResponses: '200,201'
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>`;
}
