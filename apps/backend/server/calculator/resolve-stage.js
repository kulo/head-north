/**
 * Stage resolution functions that use OmegaConfig for stage categorization
 * These functions should be called with an OmegaConfig instance
 */

export function isFinalReleaseStage(stage, omegaConfig) {
  return omegaConfig.isFinalReleaseStage(stage);
}

export function isReleasableStage(stage, omegaConfig) {
  return omegaConfig.isReleasableStage(stage);
}

export function isExternalStage(stage, omegaConfig) {
  return omegaConfig.isExternalStage(stage);
}

/**
 * 
 * @param {*} name - name or summary of the issues / ticket which contains the stage within brackets, e.g. "Feature (s1)".
 * @param {*} omegaConfig - OmegaConfig instance where the stages are defined.
 * @returns - the stage name if it is an external stage, otherwise "internal".
 */
export function resolveStage(name = '', omegaConfig) {
  const startPostfix = name.lastIndexOf('(');
  const endPostfix = name.lastIndexOf(')');
  const stage = name.substring(startPostfix + 1, endPostfix).toLowerCase();
  return omegaConfig.isExternalStage(stage) ? stage : 'internal';
}
