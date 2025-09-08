/**
 * Route Consistency Tests
 * Tests to ensure frontend and backend use the same API paths
 */

import { API_ENDPOINTS } from '../index.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

describe('Route Consistency', () => {
  describe('API Endpoints', () => {
    it('should have consistent endpoint paths', () => {
      // These paths must match exactly between frontend and backend
      assert.strictEqual(API_ENDPOINTS.HEALTH_CHECK, '/healthcheck');
      assert.strictEqual(API_ENDPOINTS.JIRA_OVERVIEW, '/jira/overview');
      assert.strictEqual(API_ENDPOINTS.JIRA_RELEASE_OVERVIEW, '/jira/release-overview');
    });

    it('should have all endpoints start with forward slash', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        assert.match(endpoint, /^\//, `Endpoint ${endpoint} should start with forward slash`);
      });
    });

    it('should not have trailing slashes', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        assert.doesNotMatch(endpoint, /\/$/, `Endpoint ${endpoint} should not have trailing slash`);
      });
    });

    it('should have consistent naming convention', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        // Should be lowercase with hyphens or forward slashes
        assert.match(endpoint, /^\/[a-z0-9\/-]+$/, `Endpoint ${endpoint} should follow naming convention`);
      });
    });
  });

  describe('Endpoint Structure', () => {
    it('should have health check endpoint', () => {
      assert.ok(API_ENDPOINTS.HEALTH_CHECK);
      assert.strictEqual(API_ENDPOINTS.HEALTH_CHECK, '/healthcheck');
    });

    it('should have JIRA endpoints', () => {
      assert.ok(API_ENDPOINTS.JIRA_OVERVIEW);
      assert.ok(API_ENDPOINTS.JIRA_RELEASE_OVERVIEW);
    });

    it('should have consistent JIRA endpoint structure', () => {
      assert.match(API_ENDPOINTS.JIRA_OVERVIEW, /^\/jira\//);
      assert.match(API_ENDPOINTS.JIRA_RELEASE_OVERVIEW, /^\/jira\//);
    });
  });

  describe('Backend Route Registration', () => {
    it('should be able to import route registry', async () => {
      // This test ensures the route registry can be imported
      // and that it uses the same API_ENDPOINTS
      const { registerApiRoutes, API_ENDPOINTS: registryEndpoints } = await import('../../../apps/backend/server/utils/route-registry.js');
      
      assert.ok(registerApiRoutes);
      assert.strictEqual(typeof registerApiRoutes, 'function');
      assert.deepStrictEqual(registryEndpoints, API_ENDPOINTS);
    });

    it('should have consistent endpoint definitions', async () => {
      const { API_ENDPOINTS: registryEndpoints } = await import('../../../apps/backend/server/utils/route-registry.js');
      
      // Check that all endpoints are defined in both places
      Object.keys(API_ENDPOINTS).forEach(key => {
        assert.ok(registryEndpoints[key], `Endpoint ${key} should be defined in route registry`);
        assert.strictEqual(registryEndpoints[key], API_ENDPOINTS[key], `Endpoint ${key} should match between shared-config and route-registry`);
      });
    });
  });
});
