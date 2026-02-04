import { DynamoDBStreamEvent } from "aws-lambda";
import { DynamoDBRecord } from "aws-lambda";
export interface MatchRecord {
    pk: string;
    sk: string;
    userId?: string;
    jobId?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface UserRecord {
    acc_type: string;
    id: string;
    [key: string]: any;
}

export interface JobRecord {
    pk: string;
    sk: string;
    [key: string]: any;
}

export interface TransactionRecord {
    id: string;
    matchId?: string;
    userId?: string;
    jobId?: string;
    amount?: number;
    type?: string;
    status?: string;
    createdAt?: string;
    [key: string]: any;
}

export interface MatchHistoryRecord {
    id: string;
    matchId?: string;
    userId?: string;
    jobId?: string;
    action?: string;
    previousStatus?: string;
    newStatus?: string;
    createdAt?: string;
    [key: string]: any;
}

export { DynamoDBStreamEvent, DynamoDBRecord };
