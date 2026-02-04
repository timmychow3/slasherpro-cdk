# AWS Resource Import Guide

A simple guide to import your existing AWS resources into CDK.

## Quick Start

```bash
# 1. Discover all your AWS resources
npm run discover

# 2. Generate import code
npm run generate-imports

# 3. Copy the output and paste into lib/slasherpro-cdk-stack.ts

# 4. Verify
npm run build && cdk synth
```

---

## Detailed Steps

### Step 1: Discover Resources

**Command:**
```bash
npm run discover
```

**What it does:**
- Checks AWS credentials
- Finds all DynamoDB tables, Lambda functions, S3 buckets, SQS queues, SNS topics, and API Gateways
- Saves results to `discovered-resources.json`

**Requirements:**
- AWS CLI configured (`aws configure`)
- `jq` installed (`brew install jq` on macOS)

### Step 2: Generate Import Code

**Command:**
```bash
npm run generate-imports
```

**What it does:**
- Reads `discovered-resources.json`
- Generates TypeScript import statements
- Prints them to console (copy and paste into your stack)

### Step 3: Add to CDK Stack

1. Open `lib/slasherpro-cdk-stack.ts`
2. Find: `// IMPORT EXISTING AWS RESOURCES`
3. Paste the generated code there

### Step 4: Verify

```bash
npm run build    # Compile TypeScript
cdk synth        # Generate CloudFormation
cdk diff         # See what will change
```

---

## Examples

### Import DynamoDB Table

```typescript
const myTable = dynamodb.Table.fromTableName(
  this,
  'MyTable',
  'your-table-name'
);
```

### Import Lambda Function

```typescript
const myLambda = lambda.Function.fromFunctionName(
  this,
  'MyLambda',
  'your-function-name'
);
```

### Import S3 Bucket

```typescript
const myBucket = s3.Bucket.fromBucketName(
  this,
  'MyBucket',
  'your-bucket-name'
);
```

### Use Imported Resources

```typescript
// Grant permissions
myTable.grantReadWriteData(myLambda);
myBucket.grantRead(myLambda);
```

---

## Key Concepts

**Import vs Create:**
- `fromXxx()` = Reference existing resource (CDK doesn't manage it)
- `new Xxx()` = Create new resource (CDK manages it)

**Safety:**
- Imported resources won't be deleted when you destroy the stack
- Always run `cdk diff` before deploying

---

## Troubleshooting

**"AWS credentials not configured"**
```bash
aws configure
```

**"jq: command not found"**
```bash
brew install jq  # macOS
# or
sudo apt-get install jq  # Linux
```

**"No resources found"**
```bash
aws configure list          # Check profile
aws configure get region     # Check region
aws sts get-caller-identity # Verify credentials
```

---

## Need More Help?

- See `scripts/README.md` for script details
- AWS CDK docs: https://docs.aws.amazon.com/cdk/
- Check `discovered-resources.json` for raw data
