#!/bin/bash

# AWS Resource Discovery Script
# This script discovers all AWS resources in your account

echo "=========================================="
echo "AWS Resource Discovery"
echo "=========================================="
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "ERROR: AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
echo "Account: $ACCOUNT"
echo "Region: $REGION"
echo ""

# Create output file
OUTPUT_FILE="discovered-resources.json"
echo "{" > $OUTPUT_FILE
echo "  \"account\": \"$ACCOUNT\"," >> $OUTPUT_FILE
echo "  \"region\": \"$REGION\"," >> $OUTPUT_FILE
echo "  \"resources\": {" >> $OUTPUT_FILE

# CloudFormation Stacks
echo "--- Discovering CloudFormation Stacks ---"
STACKS=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[*].StackName' --output json 2>/dev/null || echo "[]")
echo "\"cloudformationStacks\": $STACKS," >> $OUTPUT_FILE
echo "Found $(echo $STACKS | jq '. | length') stacks"
echo ""

# DynamoDB Tables
echo "--- Discovering DynamoDB Tables ---"
TABLES=$(aws dynamodb list-tables --output json 2>/dev/null || echo "{\"TableNames\":[]}")
TABLE_NAMES=$(echo $TABLES | jq -r '.TableNames[]' 2>/dev/null || echo "")
echo "\"dynamodbTables\": $TABLES," >> $OUTPUT_FILE
echo "Found tables: $TABLE_NAMES"
echo ""

# Lambda Functions
echo "--- Discovering Lambda Functions ---"
LAMBDAS=$(aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,FunctionArn]' --output json 2>/dev/null || echo "[]")
echo "\"lambdaFunctions\": $LAMBDAS," >> $OUTPUT_FILE
echo "Found $(echo $LAMBDAS | jq '. | length') Lambda functions"
echo ""

# S3 Buckets
echo "--- Discovering S3 Buckets ---"
BUCKETS=$(aws s3 ls 2>/dev/null | awk '{print $3}' | jq -R . | jq -s . || echo "[]")
echo "\"s3Buckets\": $BUCKETS," >> $OUTPUT_FILE
echo "Found $(echo $BUCKETS | jq '. | length') S3 buckets"
echo ""

# SQS Queues
echo "--- Discovering SQS Queues ---"
QUEUES=$(aws sqs list-queues --output json 2>/dev/null || echo "{\"QueueUrls\":[]}")
echo "\"sqsQueues\": $QUEUES," >> $OUTPUT_FILE
echo "Found $(echo $QUEUES | jq '.QueueUrls | length') SQS queues"
echo ""

# SNS Topics
echo "--- Discovering SNS Topics ---"
TOPICS=$(aws sns list-topics --output json 2>/dev/null || echo "{\"Topics\":[]}")
echo "\"snsTopics\": $TOPICS," >> $OUTPUT_FILE
echo "Found $(echo $TOPICS | jq '.Topics | length') SNS topics"
echo ""

# API Gateway
echo "--- Discovering API Gateway REST APIs ---"
APIS=$(aws apigateway get-rest-apis --query 'items[*].[name,id]' --output json 2>/dev/null || echo "[]")
echo "\"apiGateways\": $APIS" >> $OUTPUT_FILE
echo "Found $(echo $APIS | jq '. | length') API Gateway REST APIs"
echo ""

# Close JSON
echo "  }" >> $OUTPUT_FILE
echo "}" >> $OUTPUT_FILE

echo "=========================================="
echo "Discovery complete! Results saved to: $OUTPUT_FILE"
echo "=========================================="
echo ""
echo "To view the results:"
echo "  cat $OUTPUT_FILE | jq ."
echo ""
echo "To generate import code:"
echo "  node scripts/generate-imports.js"
