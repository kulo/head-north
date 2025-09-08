import { logger } from '@omega-one/shared-utils';

export default async (context, next) => {
  try {
    await next();
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    logger.middleware.errorSafe('error-handler', error);

    context.status = 503;
    context.body = { message: 'An Error occurred!', error: errorMessage, stack: error?.stack || 'No stack trace available' };
  }
};
