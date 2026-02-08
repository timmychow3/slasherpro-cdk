import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdaDestinations from 'aws-cdk-lib/aws-lambda-destinations';
import path from 'path';
import { AttributeAction } from '@aws-sdk/client-dynamodb';
import { AttributeValues } from 'aws-cdk-lib/aws-appsync';

export interface HandleMatchLambdaProps {
  userTable: dynamodb.ITable;
  jobTable: dynamodb.ITable;
  transactionTable: dynamodb.ITable;
  matchHistoryTable: dynamodb.ITable;
  matchTable: dynamodb.ITable;
  failLogBucket: s3.Bucket;
}
/**
 * This contruct handles the Match-Table-DB streams function and the related resources.
 */
export class HandleMatchLambda extends Construct {
  public readonly lambdaFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: HandleMatchLambdaProps) {
    super(scope, id);



    // Lambda Function
    this.lambdaFunction = new NodejsFunction(
      this,
      `HANDLE-MATCH-LAMBDA`,
      {
        entry: path.join(__dirname, '../../lambda/handle-match/index.ts'),
        handler: 'handler',
        functionName: `${process.env.PJ_PREFIX}-${process.env.ENV}-HANDLE-MATCH`,
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: {
          USER_TABLE_NAME: props.userTable.tableName,
          JOB_TABLE_NAME: props.jobTable.tableName,
          TRANSACTION_TABLE_NAME: props.transactionTable.tableName,
          MATCH_TABLE_NAME: props.matchTable.tableName,
          MATCH_HISTORY_TABLE_NAME: props.matchHistoryTable.tableName,
          ENV: process.env.ENV || 'dev',
        },
        onFailure: new lambdaDestinations.S3Destination(props.failLogBucket),
        // events: [
        //   new lambdaEventSources.DynamoEventSource(props.matchTable, {
        //     startingPosition: lambda.StartingPosition.LATEST,
        //     batchSize: 10,
        //     bisectBatchOnError: true,
        //     retryAttempts: 3,
        //     filters: [
        //       lambda.FilterCriteria.filter({
        //         eventName: lambda.FilterRule.isEqual('INSERT'),
        //       }),
        //       lambda.FilterCriteria.filter({
        //         eventName: lambda.FilterRule.isEqual('MODIFY'),
        //         dynamodb: {
        //           NewImage: {
        //             slasher_id: {
        //               exists: true,
        //             }
        //           },
        //         },
        //       }),
        //       // lambda.FilterCriteria.filter({
        //       //   eventName: lambda.FilterRule.isEqual('MODIFY'),
        //       //   // Filter for status attribute changing (old != new)
        //       //   dynamodb: {
        //       //     OldImage: {
        //       //       status: lambda.FilterRule.exists(),
        //       //     },
        //       //     NewImage: {
        //       //       status: lambda.FilterRule.exists(),
        //       //     },
        //       //   },
        //       //   // This checks that the old value of status is not equal to the new value
        //       //   // Supported filter language uses .notEquals for this
        //       //   // But here we use attribute-level comparison via filter patterns.
        //       //   // See: https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventfiltering.html#filtering-patterns.dynamodb
        //       //   // For the pattern, use filter pattern shorthand for state change:
        //       //   // 'dynamodb.OldImage.status.S': [{ "anything-but": [{ "ref": "dynamodb.NewImage.status.S" }] }]
        //       //   // [`dynamodb.OldImage.status.S`]: [{ "anything-but": [{ "ref": "dynamodb.NewImage.status.S" }] }],
        //       // }),


        //       // lambda.FilterCriteria.filter({
        //       //   eventName: lambda.FilterRule.isEqual('REMOVE'),
        //       // }),
        //     ]
        //   })
        // ]
      }
    );


    // Grant permissions
    props.userTable.grantReadWriteData(this.lambdaFunction);
    props.jobTable.grantReadWriteData(this.lambdaFunction);
    props.transactionTable.grantReadWriteData(this.lambdaFunction);
    props.matchHistoryTable.grantReadWriteData(this.lambdaFunction);
    props.matchTable.grantReadWriteData(this.lambdaFunction);
    props.failLogBucket.grantWrite(this.lambdaFunction);
  }
}
