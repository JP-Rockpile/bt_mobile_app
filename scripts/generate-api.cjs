#!/usr/bin/env node
/* eslint-disable no-console */
const { generate } = require('openapi-typescript-codegen');

async function main() {
  const specUrl = process.env.OPENAPI_SPEC_URL;
  const output = process.env.OUTPUT_DIR || 'packages/shared/src/api';
  if (!specUrl) {
    console.error('OPENAPI_SPEC_URL is required');
    process.exit(1);
  }
  await generate({
    input: specUrl,
    output,
    httpClient: 'fetch',
    useOptions: true,
    useUnionTypes: true,
  });
  console.log(`Generated API client from ${specUrl} into ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

