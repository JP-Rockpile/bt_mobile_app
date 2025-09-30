#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_SPEC_URL = process.env.API_SPEC_URL || 'http://localhost:3000/openapi.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'services', 'generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔄 Generating API client from OpenAPI spec...');
console.log(`📍 Source: ${API_SPEC_URL}`);
console.log(`📂 Output: ${OUTPUT_DIR}`);

const command = `npx openapi-typescript-codegen \
  --input ${API_SPEC_URL} \
  --output ${OUTPUT_DIR} \
  --client fetch \
  --useOptions \
  --useUnionTypes \
  --exportCore true \
  --exportServices true \
  --exportModels true`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating API client:', error);
    process.exit(1);
  }
  
  if (stderr) {
    console.warn('⚠️  Warnings:', stderr);
  }
  
  console.log(stdout);
  console.log('✅ API client generated successfully!');
  
  // Add index file for easier imports
  const indexContent = `// Auto-generated API client
export * from './models';
export * from './services';
export { ApiError, CancelablePromise, OpenAPI } from './core';
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('📝 Created index.ts for easier imports');
});