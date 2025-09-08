/**
 * API Service Tests
 * Unit tests for the API service functionality
 */

import { CycleDataService } from '../index.js'
import { OmegaConfig } from '@omega/shared-config'

// Mock fetch globally
global.fetch = jest.fn()

describe('Cycle Data Service', () => {
  let cycleDataService
  let omegaConfig

  beforeEach(() => {
    fetch.mockClear()
    omegaConfig = new OmegaConfig()
    cycleDataService = new CycleDataService(omegaConfig)
  })

  describe('Configuration', () => {
    test('should have correct default host', () => {
      expect(cycleDataService.getHost()).toBe('http://localhost:3000')
    })

    test('should allow host to be changed', () => {
      cycleDataService.setHost('https://api.example.com')
      expect(cycleDataService.getHost()).toBe('https://api.example.com')
    })
  })

  describe('API Endpoints', () => {
    test('should have all required endpoints defined', () => {
      const endpoints = omegaConfig.getEndpoints()
      expect(endpoints.CYCLE_OVERVIEW).toBe('/cycles/:id/overview')
      expect(endpoints.CYCLES_ROADMAP).toBe('/cycles/roadmap')
      expect(endpoints.HEALTH_CHECK).toBe('/healthcheck')
    })
  })

  describe('Request handling', () => {
    test('should make successful API request', async () => {
      const mockData = { test: 'data' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      })

      const result = await cycleDataService.getCyclesRoadmap()
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/cycles/roadmap',
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(cycleDataService.getCyclesRoadmap()).rejects.toThrow('API request failed after 3 attempts: Network error')
    })
  })
})
