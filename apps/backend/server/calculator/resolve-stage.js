export const finalReleaseStage = ['s3', 's3+'];
export const releasableStage = ['s1', 's2', ...finalReleaseStage];
export const externalStages = ['s0', ...releasableStage];

export function isFinalReleaseStage(stage) {
  return finalReleaseStage.includes(stage);
}

export function isReleasableStage(stage) {
  return releasableStage.includes(stage);
}

export function resolveStage(name = '') {
  const startPostfix = name.lastIndexOf('(');
  const endPostfix = name.lastIndexOf(')');
  const stage = name.substring(startPostfix + 1, endPostfix).toLowerCase();
  return externalStages.includes(stage) ? stage : 'internal';
}
