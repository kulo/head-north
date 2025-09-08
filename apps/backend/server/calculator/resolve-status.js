const IN_PROGRESS_STATUS_ID = '18264';
const PLANNED_STATUS_ID = '18234';
const DONE_STATUS_ID = '18235';
const CANCELLED_STATUS_ID = '18295';
const POSTPONED_STATUS_ID = '18306';

const statusMapping = {
  [PLANNED_STATUS_ID]: 'todo',
  [IN_PROGRESS_STATUS_ID]: 'inprogress',
  [DONE_STATUS_ID]: 'done',
  [CANCELLED_STATUS_ID]: 'cancelled',
  [POSTPONED_STATUS_ID]: 'postponed'
};

const finishedStatuses = [DONE_STATUS_ID, CANCELLED_STATUS_ID];

export function isFinishedStatus(issueFields) {
  const statusId = issueFields.status.id;
  return finishedStatuses.includes(statusId);
}

export function possibleFutureStatus(issueFields) {
  const statusId = issueFields.status.id;
  return [PLANNED_STATUS_ID, IN_PROGRESS_STATUS_ID, POSTPONED_STATUS_ID].includes(statusId);
}

export function resolveStatus(issueFields, sprint) {
  const statusId = issueFields.status.id;

  if(issueFields.sprint && new Date(sprint.start) < new Date(issueFields.sprint.startDate)) {
    return statusMapping[POSTPONED_STATUS_ID];
  }
  return statusMapping[statusId] || 'todo';
}
