import { Construct } from "constructs";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from "aws-cdk-lib";
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
export interface matchQueueProps {
    requestQueueName: string;
    lambdaFunctionName: string;
    jobTable: dynamodb.Table;
}

/**
 * This constuct serve as a microservice that invokes the match AI lambda function when a payment is successful.
 * 
 * Properties:
 * - FIFO queues.
 * - Low concurrency inorder to avoid overwhelming the local server system.
 * 
 * Processes:
 * 1. When payment is successful, the lambda function will be invoked to invoke the match AI lambda function.
 */
export class MatchQueue extends Construct {
    public readonly sqsQueue: sqs.IQueue;
    public readonly jobTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: matchQueueProps) {
        super(scope, id);
        const qProps: sqs.QueueProps = {
            queueName: props.requestQueueName,
            retentionPeriod: Duration.days(14),
            visibilityTimeout: Duration.seconds(300),
            fifo: true,
        };
        this.sqsQueue = new sqs.Queue(this, props.requestQueueName, qProps);

        // Add the Lambda trigger to the SQS queue
        const invokeAIFunction = new NodejsFunction(
            this,
            `${props.lambdaFunctionName}-FUNCTION`,
            {
                entry: path.join(__dirname, '../../lambda/invoke-match-ai/index.ts'),
                handler: 'handler',
                functionName: props.lambdaFunctionName,
                runtime: lambda.Runtime.NODEJS_22_X,
            }
        );
        invokeAIFunction.addPermission(props.lambdaFunctionName, {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('sqs.amazonaws.com'),
            sourceArn: this.sqsQueue.queueArn,
        });
        invokeAIFunction.addPermission(props.lambdaFunctionName, {
            action: 'dynamodb:UpdateItem',
            principal: new iam.ServicePrincipal('dynamodb.amazonaws.com'),
            sourceArn: this.jobTable.tableArn,
        });
        // invokeAIFunction.addToRolePolicy(new iam.PolicyStatement({
        //     actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes', 'sqs:SendMessage', 'sqs:GetQueueUrl'],
        //     resources: [this.sqsQueue.queueArn],
        // }));
        this.sqsQueue.grantConsumeMessages(invokeAIFunction);
        invokeAIFunction.addEventSource(
            new lambdaEventSources.SqsEventSource(this.sqsQueue, {
                batchSize: 1, // Example batch size, adjust as needed
                enabled: true,
                maxConcurrency: 2,
            })
        );
    }
}