export const handler = async (event: any, context: any) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello, world!' }),
    };
};