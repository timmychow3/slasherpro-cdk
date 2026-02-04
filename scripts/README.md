# AWS Resource Import Scripts

This directory contains scripts to help you discover and import existing AWS resources into your CDK stack.

## Quick Start

1. **Discover all AWS resources:**
   ```bash
   ./scripts/discover-resources.sh
   ```
   This will create `discovered-resources.json` with all your AWS resources.

2. **Generate import code:**
   ```bash
   node scripts/generate-imports.js
   ```
   This will output TypeScript import statements that you can copy into your CDK stack.

3. **Add imports to your stack:**
   - Copy the generated code from step 2
   - Paste it into `lib/slasherpro-cdk-stack.ts` in the "IMPORT EXISTING AWS RESOURCES" section

4. **Verify your imports:**
   ```bash
   npm run build
   cdk synth
   cdk diff
   ```

## Prerequisites

- AWS CLI configured with appropriate credentials
- `jq` installed (for JSON parsing): `brew install jq` (macOS) or `apt-get install jq` (Linux)
- Node.js installed

## What Gets Discovered

The discovery script finds:
- CloudFormation Stacks
- DynamoDB Tables
- Lambda Functions
- S3 Buckets
- SQS Queues
- SNS Topics
- API Gateway REST APIs

## Manual Import

If you prefer to manually import resources, you can use these patterns:

### DynamoDB Table
```typescript
const importedTable = dynamodb.Table.fromTableName(
  this,
  'ImportedTable',
  'YOUR_TABLE_NAME'
);
```

### Lambda Function
```typescript
const importedLambda = lambda.Function.fromFunctionName(
  this,
  'ImportedLambda',
  'YOUR_FUNCTION_NAME'
);
```

### S3 Bucket
```typescript
const importedBucket = s3.Bucket.fromBucketName(
  this,
  'ImportedBucket',
  'YOUR_BUCKET_NAME'
);
```

## Notes

- Imported resources are **referenced** but not managed by CDK
- To fully manage resources with CDK, use `cdk import` command
- Always run `cdk diff` before deploying to see what will change
- Imported resources won't be deleted when you destroy the CDK stack
