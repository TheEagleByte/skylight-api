/**
 * JSON Schema inference from observed data
 */

export interface JSONSchema {
  type?: string | string[];
  format?: string;
  description?: string;
  pattern?: string;
  nullable?: boolean;
  enum?: unknown[];
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  $ref?: string;
}

/**
 * Infer a JSON Schema from observed data
 */
export function inferSchema(data: unknown): JSONSchema {
  if (data === null) {
    return { type: 'null' };
  }

  if (data === undefined) {
    return {};
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  if (typeof data === 'number') {
    return Number.isInteger(data)
      ? { type: 'integer' }
      : { type: 'number' };
  }

  if (typeof data === 'string') {
    return inferStringSchema(data);
  }

  if (Array.isArray(data)) {
    return inferArraySchema(data);
  }

  if (typeof data === 'object') {
    return inferObjectSchema(data as Record<string, unknown>);
  }

  return {};
}

/**
 * Infer schema for string values with format detection
 */
function inferStringSchema(value: string): JSONSchema {
  const schema: JSONSchema = { type: 'string' };

  // Date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    schema.format = 'date';
    return schema;
  }

  // DateTime format (ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    schema.format = 'date-time';
    return schema;
  }

  // UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    schema.format = 'uuid';
    return schema;
  }

  // URI format
  if (/^https?:\/\//.test(value)) {
    schema.format = 'uri';
    return schema;
  }

  // Hex color format
  if (/^#?[0-9A-Fa-f]{6}$/.test(value)) {
    schema.pattern = '^#?[0-9A-Fa-f]{6}$';
    schema.description = 'Hex color';
    return schema;
  }

  // Time format (HH:MM)
  if (/^\d{2}:\d{2}$/.test(value)) {
    schema.format = 'time';
    schema.description = 'Time in HH:MM format';
    return schema;
  }

  // Email format
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    schema.format = 'email';
    return schema;
  }

  return schema;
}

/**
 * Infer schema for arrays
 */
function inferArraySchema(data: unknown[]): JSONSchema {
  if (data.length === 0) {
    return {
      type: 'array',
      items: {},
    };
  }

  // Infer schema from all items
  const itemSchemas = data.map(item => inferSchema(item));

  // Merge all item schemas
  const mergedItemSchema = mergeSchemas(itemSchemas);

  return {
    type: 'array',
    items: mergedItemSchema,
  };
}

/**
 * Infer schema for objects
 */
function inferObjectSchema(data: Record<string, unknown>): JSONSchema {
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const propSchema = inferSchema(value);

    // Mark nullable if value is null
    if (value === null) {
      propSchema.nullable = true;
    }

    properties[key] = propSchema;

    // Consider non-null values as required
    if (value !== null && value !== undefined) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: true,
  };
}

/**
 * Merge multiple schemas into one
 */
export function mergeSchemas(schemas: JSONSchema[]): JSONSchema {
  if (schemas.length === 0) {
    return {};
  }

  if (schemas.length === 1) {
    return schemas[0];
  }

  // Get unique types
  const types = new Set<string>();
  for (const schema of schemas) {
    if (schema.type) {
      if (Array.isArray(schema.type)) {
        schema.type.forEach(t => types.add(t));
      } else {
        types.add(schema.type);
      }
    }
  }

  // If all same type
  if (types.size === 1) {
    const type = types.values().next().value;

    if (type === 'object') {
      return mergeObjectSchemas(schemas);
    }

    if (type === 'array') {
      return mergeArraySchemas(schemas);
    }

    // For primitives, return first schema
    return schemas[0];
  }

  // Mixed types - use oneOf
  return {
    oneOf: schemas,
  };
}

/**
 * Merge multiple object schemas
 */
function mergeObjectSchemas(schemas: JSONSchema[]): JSONSchema {
  const allProperties: Record<string, JSONSchema[]> = {};
  const allRequired = new Set<string>();

  for (const schema of schemas) {
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (!allProperties[key]) {
          allProperties[key] = [];
        }
        allProperties[key].push(propSchema);
      }
    }

    if (schema.required) {
      for (const req of schema.required) {
        allRequired.add(req);
      }
    }
  }

  const mergedProperties: Record<string, JSONSchema> = {};
  for (const [key, propSchemas] of Object.entries(allProperties)) {
    mergedProperties[key] = mergeSchemas(propSchemas);
  }

  return {
    type: 'object',
    properties: mergedProperties,
    required: allRequired.size > 0 ? Array.from(allRequired) : undefined,
    additionalProperties: true,
  };
}

/**
 * Merge multiple array schemas
 */
function mergeArraySchemas(schemas: JSONSchema[]): JSONSchema {
  const itemSchemas: JSONSchema[] = [];

  for (const schema of schemas) {
    if (schema.items) {
      itemSchemas.push(schema.items);
    }
  }

  return {
    type: 'array',
    items: itemSchemas.length > 0 ? mergeSchemas(itemSchemas) : {},
  };
}
