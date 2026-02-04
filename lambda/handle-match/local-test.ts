/**
 * Local testing script for handle-match Lambda function
 * 
 * Usage:
 *   tsx local-test.ts
 *   or
 *   npm run test:local
 */

import 'dotenv/config';
import { handler } from './handler.js';
import { DynamoDBStreamEvent } from 'aws-lambda';

// Sample DynamoDB stream event for testing
const mockEvent: DynamoDBStreamEvent = {
    Records: [
        {
            eventID: 'test-event-1',
            eventName: 'INSERT',
            eventVersion: '1.0',
            eventSource: 'aws:dynamodb',
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            dynamodb: {
                ApproximateCreationDateTime: Math.floor(Date.now() / 1000),
                Keys: {
                    pk: { S: 'MATCH#test-match-123' },
                    sk: { S: 'USER#test-user-456' },
                },
                NewImage: {
                    pk: { S: 'MATCH#test-match-123' },
                    sk: { S: 'USER#test-user-456' },
                    userId: { S: 'test-user-456' },
                    jobId: { S: 'test-job-789' },
                    status: { S: 'ACTIVE' },
                    createdAt: { S: new Date().toISOString() },
                    updatedAt: { S: new Date().toISOString() },
                },
                StreamViewType: 'NEW_AND_OLD_IMAGES',
                SequenceNumber: '111',
                SizeBytes: 200,
            },
            eventSourceARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/SP-dev-Match/stream/2024-01-01T00:00:00.000',
        },
        {
            eventID: 'test-event-2',
            eventName: 'MODIFY',
            eventVersion: '1.0',
            eventSource: 'aws:dynamodb',
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            dynamodb: {
                ApproximateCreationDateTime: Math.floor(Date.now() / 1000),
                Keys: {
                    pk: { S: 'MATCH#test-match-456' },
                    sk: { S: 'USER#test-user-789' },
                },
                OldImage: {
                    pk: { S: 'MATCH#test-match-456' },
                    sk: { S: 'USER#test-user-789' },
                    userId: { S: 'test-user-789' },
                    jobId: { S: 'test-job-123' },
                    status: { S: 'ACTIVE' },
                    createdAt: { S: new Date().toISOString() },
                },
                NewImage: {
                    pk: { S: 'MATCH#test-match-456' },
                    sk: { S: 'USER#test-user-789' },
                    userId: { S: 'test-user-789' },
                    jobId: { S: 'test-job-123' },
                    status: { S: 'COMPLETED' },
                    createdAt: { S: new Date().toISOString() },
                    updatedAt: { S: new Date().toISOString() },
                },
                StreamViewType: 'NEW_AND_OLD_IMAGES',
                SequenceNumber: '222',
                SizeBytes: 300,
            },
            eventSourceARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/SP-dev-Match/stream/2024-01-01T00:00:00.000',
        },
    ],
};

// Mock context
const mockContext = {
    awsRequestId: 'test-request-id',
    functionName: 'SP-dev-HANDLE-MATCH',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:SP-dev-HANDLE-MATCH',
    memoryLimitInMB: '256',
    getRemainingTimeInMillis: () => 30000,
    logGroupName: '/aws/lambda/SP-dev-HANDLE-MATCH',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    callbackWaitsForEmptyEventLoop: true,
    succeed: () => { },
    fail: () => { },
    done: () => { },
};

// Validate environment variables
const requiredEnvVars = [
    'USER_TABLE_NAME',
    'JOB_TABLE_NAME',
    'TRANSACTION_TABLE_NAME',
    'MATCH_TABLE_NAME',
    'MATCH_HISTORY_TABLE_NAME',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease set these in .env.local or export them before running tests.');
    process.exit(1);
}

// Run the handler
console.log('🧪 Starting local Lambda test...\n');
console.log('Environment variables:');
requiredEnvVars.forEach((varName) => {
    console.log(`   ${varName}=${process.env[varName]}`);
});
console.log('\n');

handler(mockEvent, mockContext as any)
    .then(() => {
        console.log('\n✅ Handler executed successfully');
        process.exit(0);
    })
    .catch((error: unknown) => {
        console.error('\n❌ Handler failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    });
