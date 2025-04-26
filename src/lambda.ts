import serverless from "serverless-http";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import app from "./app";

const serverlessApp = serverless(app);

export const handler: APIGatewayProxyHandler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const result = await serverlessApp(event, context);
    return result as APIGatewayProxyResult;
};