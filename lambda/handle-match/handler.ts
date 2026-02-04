import { DynamoDBStreamEvent, DynamoDBRecord, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { MatchRecord, UserRecord, JobRecord, TransactionRecord, MatchHistoryRecord } from './types.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Get table names from environment variables
const USER_TABLE = process.env.USER_TABLE_NAME || '';
const JOB_TABLE = process.env.JOB_TABLE_NAME || '';
const TRANSACTION_TABLE = process.env.TRANSACTION_TABLE_NAME || '';
const MATCH_HISTORY_TABLE = process.env.MATCH_HISTORY_TABLE_NAME || '';
const MATCH_TABLE = process.env.MATCH_TABLE_NAME || '';

/**
 * Converts DynamoDB attribute map to plain object using AWS SDK utility
 */
function unmarshallDynamoDBItem(item: any): any {
    if (!item) return null;
    return unmarshall(item) as any;
}

/**
 * Creates a match history record
 */
async function createMatchHistory(
    matchId: string,
    action: string,
    previousStatus?: string,
    newStatus?: string,
    matchData?: MatchRecord
): Promise<void> {
    const historyRecord: MatchHistoryRecord = {
        id: `${matchId}-${Date.now()}`,
        matchId,
        userId: matchData?.userId,
        jobId: matchData?.jobId,
        action,
        previousStatus,
        newStatus,
        createdAt: new Date().toISOString(),
    };

    await docClient.send(
        new PutCommand({
            TableName: MATCH_HISTORY_TABLE,
            Item: historyRecord,
        })
    );

    console.log('Created match history record:', historyRecord.id);
}

/**
 * Creates a transaction record
 */
async function createTransaction(
    matchId: string,
    userId?: string,
    jobId?: string,
    amount?: number,
    type: string = 'MATCH'
): Promise<void> {
    const transactionRecord: TransactionRecord = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        matchId,
        userId,
        jobId,
        amount,
        type,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };

    await docClient.send(
        new PutCommand({
            TableName: TRANSACTION_TABLE,
            Item: transactionRecord,
        })
    );

    console.log('Created transaction record:', transactionRecord.id);
}

/**
 * Updates user record with match information
 */
async function updateUserMatch(userId: string, matchId: string, action: string): Promise<void> {
    if (!userId) return;

    try {
        // Get user record
        const userResult = await docClient.send(
            new GetCommand({
                TableName: USER_TABLE,
                Key: {
                    acc_type: 'USER', // Assuming standard acc_type
                    id: userId,
                },
            })
        );

        if (userResult.Item) {
            // Update user with match information
            await docClient.send(
                new UpdateCommand({
                    TableName: USER_TABLE,
                    Key: {
                        acc_type: 'USER',
                        id: userId,
                    },
                    UpdateExpression: 'SET updatedAt = :updatedAt ADD matchCount :increment',
                    ExpressionAttributeValues: {
                        ':updatedAt': new Date().toISOString(),
                        ':increment': action === 'INSERT' ? 1 : 0,
                    },
                })
            );

            console.log(`Updated user ${userId} with match ${matchId}`);
        }
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        // Don't throw - continue processing other records
    }
}

/**
 * Updates job record with match information
 */
async function updateJobMatch(jobId: string, matchId: string, action: string): Promise<void> {
    if (!jobId) return;

    try {
        // Get job record - assuming pk format
        const jobResult = await docClient.send(
            new GetCommand({
                TableName: JOB_TABLE,
                Key: {
                    pk: `JOB#${jobId}`,
                    sk: `METADATA#${jobId}`,
                },
            })
        );

        if (jobResult.Item) {
            // Update job with match information
            await docClient.send(
                new UpdateCommand({
                    TableName: JOB_TABLE,
                    Key: {
                        pk: `JOB#${jobId}`,
                        sk: `METADATA#${jobId}`,
                    },
                    UpdateExpression: 'SET updatedAt = :updatedAt ADD matchCount :increment',
                    ExpressionAttributeValues: {
                        ':updatedAt': new Date().toISOString(),
                        ':increment': action === 'INSERT' ? 1 : 0,
                    },
                })
            );

            console.log(`Updated job ${jobId} with match ${matchId}`);
        }
    } catch (error) {
        console.error(`Error updating job ${jobId}:`, error);
        // Don't throw - continue processing other records
    }
}

/**
 * Processes a single DynamoDB stream record
 */
async function processRecord(record: DynamoDBRecord): Promise<void> {
    const eventName = record.eventName;

    if (!eventName) {
        console.warn('Record missing eventName, skipping');
        return;
    }

    console.log(`Processing ${eventName} event`);

    // Extract match data from stream record
    let newImage: MatchRecord | null = null;
    let oldImage: MatchRecord | null = null;

    if (record.dynamodb?.NewImage) {
        newImage = unmarshallDynamoDBItem(record.dynamodb.NewImage) as MatchRecord;
    }

    if (record.dynamodb?.OldImage) {
        oldImage = unmarshallDynamoDBItem(record.dynamodb.OldImage) as MatchRecord;
    }

    const matchId = newImage?.pk || oldImage?.pk || 'unknown';
    const userId = newImage?.userId || oldImage?.userId;
    const jobId = newImage?.jobId || oldImage?.jobId;
    const newStatus = newImage?.status;
    const oldStatus = oldImage?.status;

    try {
        switch (eventName) {
            case 'INSERT':
                console.log('Processing INSERT event for match:', matchId);

                // Create match history
                await createMatchHistory(matchId, 'CREATED', undefined, newStatus, newImage || undefined);

                // Update user and job records
                if (userId) {
                    await updateUserMatch(userId, matchId, 'INSERT');
                }
                if (jobId) {
                    await updateJobMatch(jobId, matchId, 'INSERT');
                }

                // Create transaction if needed (e.g., for paid matches)
                if (newImage && newStatus === 'ACTIVE') {
                    await createTransaction(matchId, userId, jobId, undefined, 'MATCH_CREATED');
                }

                console.log(`Successfully processed INSERT for match ${matchId}`);
                break;

            case 'MODIFY':
                console.log('Processing MODIFY event for match:', matchId);

                // Create match history for status change
                if (oldStatus !== newStatus) {
                    await createMatchHistory(matchId, 'STATUS_CHANGED', oldStatus, newStatus, newImage || undefined);
                } else {
                    await createMatchHistory(matchId, 'UPDATED', oldStatus, newStatus, newImage || undefined);
                }

                // Handle status-specific logic
                if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
                    // Create completion transaction
                    await createTransaction(matchId, userId, jobId, undefined, 'MATCH_COMPLETED');
                }

                console.log(`Successfully processed MODIFY for match ${matchId}`);
                break;

            case 'REMOVE':
                console.log('Processing REMOVE event for match:', matchId);

                // Create match history for deletion
                await createMatchHistory(matchId, 'DELETED', oldStatus, undefined, oldImage || undefined);

                // Update user and job records
                if (userId) {
                    await updateUserMatch(userId, matchId, 'REMOVE');
                }
                if (jobId) {
                    await updateJobMatch(jobId, matchId, 'REMOVE');
                }

                console.log(`Successfully processed REMOVE for match ${matchId}`);
                break;

            default:
                console.warn(`Unknown event type: ${eventName}`);
        }
    } catch (error) {
        console.error(`Error processing ${eventName} event for match ${matchId}:`, error);
        throw error; // Re-throw to trigger retry mechanism
    }
}

/**
 * Lambda handler for DynamoDB stream events
 */
export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<void> => {
    console.log('Received DynamoDB stream event:', JSON.stringify(event, null, 2));
    console.log('Context:', {
        requestId: context.awsRequestId,
        functionName: context.functionName,
        remainingTimeInMillis: context.getRemainingTimeInMillis(),
    });

    // Validate table names
    if (!USER_TABLE || !JOB_TABLE || !TRANSACTION_TABLE || !MATCH_HISTORY_TABLE) {
        throw new Error('Missing required environment variables for table names');
    }

    const records = event.Records || [];
    console.log(`Processing ${records.length} record(s)`);

    // Process each record
    const errors: Error[] = [];

    for (const record of records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error('Error processing record:', error);
            errors.push(error as Error);
        }
    }

    // If any record failed, throw to trigger retry
    if (errors.length > 0) {
        console.error(`Failed to process ${errors.length} record(s) out of ${records.length}`);
        throw new Error(`Failed to process ${errors.length} record(s): ${errors.map(e => e.message).join(', ')}`);
    }

    console.log(`Successfully processed all ${records.length} record(s)`);
};
