import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { HandleMatchLambda } from './constructs/handle-match-lambda';
import { SharedTables } from './constructs/shared-tables';
import { SharedBucket } from './constructs/shared-buckets';
import * as dotenv from 'dotenv';

// dotenv.config({ path: '.env.local' });

export class SlasherproCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const resourcePrefix = `${process.env.PJ_PREFIX}-${process.env.ENV}`;
    // ============================================
    // IMPORT EXISTING AWS RESOURCES
    // ============================================
    // Run: ./scripts/discover-resources.sh
    // Then: node scripts/generate-imports.js
    // Copy the generated imports below

    // TODO: Add your imported resources here
    // Example:
    // const importedUserTable = dynamodb.Table.fromTableName(
    //   this,
    //   'ImportedUserTable',
    //   'YOUR_TABLE_NAME'
    // );

    // ============================================
    // NEW RESOURCES (or reference imported ones)
    // ============================================

    // Change the reosurce name here
    const userTableName = `${resourcePrefix}-USER`;
    const jobTableName = `${resourcePrefix}-JOB`;
    const transactionTableName = `${resourcePrefix}-TRANSACTION`;
    const matchHistoryTableName = `${resourcePrefix}-MATCH-HISTORY`;
    const matchTableName = `${resourcePrefix}-MATCH`;
    const failLogsBucketName = `${resourcePrefix.toLowerCase()}-lambda-fail-logs`;
    const uploadPrivateBucketName = `${resourcePrefix.toLowerCase()}-upload-private`;
    const uploadPublicBucketName = `${resourcePrefix.toLowerCase()}-upload-public`;
    // ============================================
    // SHARED TABLES
    // ============================================
    const sharedTables = new SharedTables(this, `${resourcePrefix}-TABLES`, {
      userTableName,
      jobTableName,
      transactionTableName,
      matchHistoryTableName,
      matchTableName,
      enableMatchTableStream: true, // Enable stream for Lambda trigger
    });

    // ============================================
    // SHARED BUCKETS
    // ============================================
    const sharedBuckets = new SharedBucket(this, `${resourcePrefix}-BUCKETS`, {
      logBucketName: failLogsBucketName,
      uploadPrivateBucketName: uploadPrivateBucketName,
      uploadPublicBucketName: uploadPublicBucketName,
    });

    // ============================================
    // HANDLE-MATCH LAMBDA CHAIN
    // ============================================
    // Includes: Lambda function, DynamoDB stream trigger, S3 failure logs
    const handleMatchLambda = new HandleMatchLambda(this, `${resourcePrefix}-HANDLE-MATCH-LAMBDA`, {
      userTable: sharedTables.userTable,
      jobTable: sharedTables.jobTable,
      transactionTable: sharedTables.transactionTable,
      matchHistoryTable: sharedTables.matchHistoryTable,
      matchTable: sharedTables.matchTable,
      failLogBucket: sharedBuckets.logBucket,
    });

    cdk.Tags.of(this).add('project', process.env.PJ_PREFIX || "undefined");
    cdk.Tags.of(this).add('env', process.env.ENV || "undefined");
  }
}
