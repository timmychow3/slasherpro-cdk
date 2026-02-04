import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface SharedTablesProps {
    userTableName: string;
    jobTableName: string;
    transactionTableName: string;
    matchHistoryTableName: string;
    matchTableName: string;
    enableMatchTableStream?: boolean; // Optional flag to enable stream on match table
}

export class SharedTables extends Construct {
    public readonly userTable: dynamodb.Table;
    /**
     * This table is used to store the job data.
     */
    public readonly jobTable: dynamodb.Table;
    /**
     * This table is used to store the transaction data.
     */
    public readonly transactionTable: dynamodb.Table;
    /**
     * This table is used to store the match history data.
     */
    public readonly matchHistoryTable: dynamodb.Table;
    /**
     * This table is used to store the match data.
     */
    public readonly matchTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: SharedTablesProps) {
        super(scope, id);

        // User Table
        this.userTable = new dynamodb.Table(this, 'UserTable', {
            tableName: `${props.userTableName}`,
            partitionKey: { name: 'acc_role', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE, // Prevent accidental deletion
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

        });
        this.userTable.addGlobalSecondaryIndex({
            indexName: 'acc_role-index',
            partitionKey: { name: 'acc_role', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        this.userTable.addGlobalSecondaryIndex({
            indexName: 'id-index',
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });


        // Job Table
        this.jobTable = new dynamodb.Table(this, 'JobTable', {
            tableName: props.jobTableName,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE, // Prevent accidental deletion
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });
        this.jobTable.addGlobalSecondaryIndex({
            indexName: 'pk-index',
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        this.jobTable.addGlobalSecondaryIndex({
            indexName: 'sk-index',
            partitionKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Transaction Table
        this.transactionTable = new dynamodb.Table(this, 'TransactionTable', {
            tableName: props.transactionTableName,
            partitionKey: { name: 'uid', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'matchId', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE, // Prevent accidental deletion
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        // Match History Table
        this.matchHistoryTable = new dynamodb.Table(this, 'MatchHistoryTable', {
            tableName: props.matchHistoryTableName,
            partitionKey: { name: 'sid', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'jid', type: dynamodb.AttributeType.STRING },

            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE, // Prevent accidental deletion
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        // Match Table with optional stream enabled for Lambda trigger
        this.matchTable = new dynamodb.Table(this, 'MatchTable', {
            tableName: props.matchTableName,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });
    }
}
