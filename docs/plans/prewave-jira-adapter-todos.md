## Prewave Jira Adapter – Follow-up TODOs

- Confirm sprint field stability
  - Verify `customfield_10021` is stable across all Prewave Jira projects or make it env-driven via `HN_JIRA_FIELD_SPRINT`.
  - Add fallback logic if field is missing or renamed.

- Product Area extraction
  - Implement label-based parsing for `area:<AreaName>`.
  - Implement assignee → team → area mapping as a deterministic fallback.
  - Replace current default/unknown area and remove the warning once implemented.
  - Add unit tests for: label-based, mapping-based, and missing-data cases.

- Team extraction
  - Implement label-based parsing for `team:<TeamName>`.
  - Implement assignee → team mapping as fallback.
  - Add unit tests for label-based, mapping-based, and missing-data cases.

- Release Stage
  - Define convention (e.g., `stage:<StageName>`) or configure a field via env when available.
  - Replace current empty string placeholder.
  - Add unit tests for presence and absence.

- Objectives
  - Support label-based parsing `objective:<ObjectiveName>` as soon as labels exist.
  - Replace current default `uncategorized` objective.
  - Add unit tests for mapping and missing-data.

- Effort/Appetite field
  - Replace effort=1 with a concrete appetite/effort field once defined.
  - Make field id env-driven (e.g., `HN_JIRA_FIELD_EFFORT`) and update extractor.
  - Add tests for numeric and missing values.

- Concrete Prewave mapping
  - Provide and maintain a source-of-truth mapping: ProductAreas → Teams → Assignees.
  - Store mapping in code (adapter) or via config (JSON file / env) with validation.
  - Add tests to validate mapping coverage (warn on unmapped users).

- Virtual Roadmap Items
  - Keep generating a virtual item per Cycle Item until real items exist.
  - Add a toggle/strategy to switch to real roadmap items when provided.
  - Add tests to ensure IDs remain stable and deduplicated.

- Logging and diagnostics
  - Keep current debug logs short-term; gate them behind `HN_LOG_LEVEL=debug`.
  - Ensure error logs use enhanced serialization (message, code, status, response, stack).

- Config hardening
  - Ensure all Jira custom fields are adapter- or env-driven (no hardcoded defaults in shared config).
  - Validate presence of required env values on startup with clear error messages.

- API client behavior
  - Continue using Jira REST API v3 `/rest/api/3/search` and avoid deprecated endpoints.
  - Maintain normalization ensuring every issue has a `fields` object.

- Test coverage
  - Add/extend tests for: status mapping, sprint array parsing, labels extraction for area/team/objective, release stage placeholder, effort default, and mapping fallbacks.
  - Include edge cases (missing labels, multiple labels, unknown assignee, empty sprints).

- Frontend alignment (optional follow-up)
  - Verify frontend consumes new area/team/objective once implemented.
  - Update typings and remove temporary workarounds when backend schema stabilizes.
