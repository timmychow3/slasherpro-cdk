# Handle Match Lambda Function

This Lambda function processes DynamoDB stream events from the Match table and performs the following operations:

- Creates match history records
- Updates user and job records with match information
- Creates transaction records for match events
- Handles INSERT, MODIFY, and REMOVE events

## Environment Variables

The following environment variables are required:

- `USER_TABLE_NAME` - DynamoDB table name for users
- `JOB_TABLE_NAME` - DynamoDB table name for jobs
- `TRANSACTION_TABLE_NAME` - DynamoDB table name for transactions
- `MATCH_TABLE_NAME` - DynamoDB table name for matches
- `MATCH_HISTORY_TABLE_NAME` - DynamoDB table name for match history
- `ENV` - Environment name (dev, uat, prod)

## Local Development

### Prerequisites

```bash
# Install dependencies (from project root)
npm install

# Or install Lambda-specific dependencies
cd lambda/handle-match && npm install
```

### Testing Locally

```bash
# Run local test
npm run test:local

# Or from project root
tsx lambda/handle-match/local-test.ts
```

### Local Testing Setup

1. Set environment variables in `.env.local` or export them:
   ```bash
   export USER_TABLE_NAME=SP-dev-USER
   export JOB_TABLE_NAME=SP-dev-JOB
   export TRANSACTION_TABLE_NAME=SP-dev-Transaction
   export MATCH_TABLE_NAME=SP-dev-Match
   export MATCH_HISTORY_TABLE_NAME=SP-dev-MatchHistory
   export ENV=dev
   ```

2. Use DynamoDB Local or mock AWS services for testing

## Structure

- `index.ts` - Entry point that exports the handler
- `handler.ts` - Main Lambda handler logic
- `types.ts` - TypeScript type definitions
- `local-test.ts` - Local testing script
- `updateEvent.json` - Sample DynamoDB stream event for testing

## Deployment

This Lambda is deployed via AWS CDK. The CDK construct is defined in:
`lib/constructs/handle-match-lambda.ts`

To deploy:
```bash
# From project root
npm run deploy:dev  # or deploy:uat, deploy:prod
```

## Event Processing

The function processes three types of DynamoDB stream events:

1. **INSERT** - New match created
   - Creates match history record
   - Updates user and job match counts
   - Creates transaction if match is ACTIVE

2. **MODIFY** - Match updated
   - Creates match history record for status changes
   - Creates transaction for completion events

3. **REMOVE** - Match deleted
   - Creates match history record
   - Updates user and job records

## Error Handling

- Individual record failures are logged but don't stop batch processing
- If any record fails, the entire batch is retried
- Errors are logged to CloudWatch Logs
- Failed invocations are sent to S3 failure logs bucket
