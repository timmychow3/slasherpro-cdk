// import { Construct } from "constructs";
// import * as aws_events from 'aws-cdk-lib/aws-events';
// import * as aws_logs from 'aws-cdk-lib/aws-logs';
// import * as aws_events_targets from 'aws-cdk-lib/aws-events-targets';


// //referece https://docs.stripe.com/event-destinations/eventbridge
// interface StripeEventBusToCloudWatchProps {
//   eventBusName: string;
//   ruleName: string;
//   ruleDescription?: string;
//   eventPattern: aws_events.EventPattern;
//   logGroupName?: string;
// }

// export class StripeEventBusToCloudWatch extends Construct {
//   public readonly eventBus: aws_events.EventBus;
//   public readonly eventRule: aws_events.Rule;
//   public readonly logGroup: aws_logs.LogGroup;

//   constructor(scope: Construct, id: string, props: StripeEventBusToCloudWatchProps) {
//     super(scope, id);

//     // Create an EventBridge EventBus for Stripe
//     this.eventBus = new aws_events.EventBus(this, 'StripeEventBus', {
//       eventBusName: props.eventBusName,
//     });

//     // Create a CloudWatch LogGroup for events
//     this.logGroup = new aws_logs.LogGroup(this, 'StripeEventsLogGroup', {
//       logGroupName: props.logGroupName ?? `/aws/events/${props.eventBusName}`,
//       removalPolicy: aws_logs.RemovalPolicy.DESTROY, // or RETAIN based on your retention policy
//     });

//     // Create an EventBridge Rule for Stripe events
//     this.eventRule = new aws_events.Rule(this, 'StripeEventRule', {
//       ruleName: props.ruleName,
//       description: props.ruleDescription,
//       eventBus: this.eventBus,
//       eventPattern: props.eventPattern,
//     });

//     // Pipe matched Stripe events to CloudWatch Logs
//     this.eventRule.addTarget(new aws_events_targets.CloudWatchLogGroup(this.logGroup));
//   }
// }