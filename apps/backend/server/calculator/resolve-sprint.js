import { isFinishedStatus, possibleFutureStatus } from './resolve-status.js';

const isScheduledForFuture = (issueFields) => {
  return !!issueFields.sprint && new Date() < new Date(issueFields.sprint.endDate);
};

const isInBacklog = (issueFields) => {
  return possibleFutureStatus(issueFields) && !issueFields.sprint;
};

export {
  isScheduledForFuture,
  isInBacklog
};
