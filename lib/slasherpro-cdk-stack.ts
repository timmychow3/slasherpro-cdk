import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SlasherproCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    
    const userTable = new dynamodb.Table(this, `${process.env.PJ_PREFIX}-${process.env.ENV}-USER`, {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    const jobTable = new dynamodb.Table(this, `${process.env.PJ_PREFIX}-${process.env.ENV}-JOB`, {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      
    });
    // Create Seat Function
    const fn = new NodejsFunction(this, 'lambda', {
      entry: 'lambda/create-seat.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
    })
    // const queue = new sqs.Queue(this, 'SlasherproCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
