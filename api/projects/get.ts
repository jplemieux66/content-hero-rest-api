import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Project } from '../../db/models/project';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { DbMiddleware } from '../../utils/db-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const getHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const projectId = event.pathParameters.projectId;

  try {
    const userEmail = getUserEmail(event);
    await getProjectUser(projectId, userEmail);

    const project = await Project.findById(projectId);

    return {
      statusCode: 200,
      body: JSON.stringify(project),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't update the item.",
    };
  }
};

export const handler = middy(getHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(new DbMiddleware())
  .use(cors());
