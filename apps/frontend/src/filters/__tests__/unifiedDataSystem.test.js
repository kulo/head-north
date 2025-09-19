/**
 * Tests for Unified Data System
 * 
 * These tests ensure the unified data system works correctly
 * and catches any issues during refactoring
 */

import {
  validateUnifiedData,
  transformRoadmapToUnified,
  transformCycleOverviewToUnified,
  transformUnifiedToRoadmap,
  transformUnifiedToCycleOverview,
  filterUnifiedData,
  applyFilters
} from '../unifiedDataSystem.js'

describe('Unified Data System', () => {
  // Test data
  const mockRoadmapData = {
    orderedSprints: [
      { id: 'cycle1', name: 'Sprint 1', startDate: '2024-01-01', endDate: '2024-01-14' }
    ],
    activeSprint: { id: 'cycle1', name: 'Sprint 1' },
    roadmapItems: [
      {
        initiativeId: 'init1',
        initiative: 'Frontend Initiative',
        roadmapItems: [
          {
            id: 'item1',
            name: 'Feature A',
            area: 'frontend',
            theme: 'UI',
            projectId: 'PROJ-1',
            url: 'https://jira.com/PROJ-1',
            startDate: '2024-01-01',
            validations: [],
            releaseItems: [
              {
                id: 'release1',
                ticketId: 'TICKET-1',
                area: 'frontend',
                areaIds: ['frontend'],
                stage: 's0',
                status: 'todo',
                effort: 5,
                assignee: { id: 'user1', name: 'John Doe' },
                teams: ['frontend-team'],
                validations: []
              }
            ]
          }
        ]
      }
    ]
  }

  const mockCycleOverviewData = {
    cycle: {
      id: 'cycle1',
      name: 'Q1 2024',
      start: '2024-01-01',
      delivery: '2024-03-31',
      end: '2024-03-31',
      progress: 50
    },
    initiatives: [
      {
        initiativeId: 'init1',
        initiative: 'Frontend Initiative',
        roadmapItems: [
          {
            id: 'item1',
            name: 'Feature A',
            area: 'frontend',
            theme: 'UI',
            projectId: 'PROJ-1',
            url: 'https://jira.com/PROJ-1',
            startDate: '2024-01-01',
            validations: [],
            releaseItems: [
              {
                id: 'release1',
                ticketId: 'TICKET-1',
                area: 'frontend',
                areaIds: ['frontend'],
                stage: 's0',
                status: 'todo',
                effort: 5,
                assignee: { id: 'user1', name: 'John Doe' },
                teams: ['frontend-team'],
                validations: []
              }
            ]
          }
        ]
      }
    ]
  }

  const mockUnifiedData = {
    metadata: {
      type: 'roadmap',
      cycle: null,
      cycles: [{ id: 'cycle1', name: 'Sprint 1', startDate: '2024-01-01', endDate: '2024-01-14' }],
      activeSprint: { id: 'cycle1', name: 'Sprint 1' }
    },
    initiatives: [
      {
        initiativeId: 'init1',
        initiative: 'Frontend Initiative',
        roadmapItems: [
          {
            id: 'item1',
            name: 'Feature A',
            area: 'frontend',
            theme: 'UI',
            projectId: 'PROJ-1',
            url: 'https://jira.com/PROJ-1',
            startDate: '2024-01-01',
            validations: [],
            releaseItems: [
              {
                id: 'release1',
                ticketId: 'TICKET-1',
                area: 'frontend',
                areaIds: ['frontend'],
                stage: 's0',
                status: 'todo',
                effort: 5,
                assignee: { id: 'user1', name: 'John Doe' },
                teams: ['frontend-team'],
                validations: []
              }
            ]
          }
        ]
      }
    ]
  }

  describe('validateUnifiedData', () => {
    it('should validate correct unified data', () => {
      expect(() => validateUnifiedData(mockUnifiedData)).not.toThrow()
    })

    it('should throw error for invalid data structure', () => {
      expect(() => validateUnifiedData(null)).toThrow('Invalid unifiedData: expected object, got object')
      expect(() => validateUnifiedData({})).toThrow('Invalid metadata: expected object, got undefined')
      expect(() => validateUnifiedData({ metadata: {} })).toThrow('Invalid metadata.type: expected non-empty string, got undefined')
    })

    it('should throw error for invalid metadata type', () => {
      const invalidData = { ...mockUnifiedData, metadata: { ...mockUnifiedData.metadata, type: 'invalid' } }
      expect(() => validateUnifiedData(invalidData)).toThrow("Invalid metadata.type: expected 'roadmap' or 'cycle-overview', got 'invalid'")
    })

    it('should throw error for invalid initiatives', () => {
      const invalidData = { ...mockUnifiedData, initiatives: 'not-an-array' }
      expect(() => validateUnifiedData(invalidData)).toThrow('Invalid initiatives: expected array, got string')
    })
  })

  describe('transformRoadmapToUnified', () => {
    it('should transform roadmap data to unified structure', () => {
      const result = transformRoadmapToUnified(mockRoadmapData)
      
      expect(result.metadata.type).toBe('roadmap')
      expect(result.metadata.cycle).toBeNull()
      expect(result.metadata.cycles).toEqual(mockRoadmapData.orderedSprints)
      expect(result.metadata.activeSprint).toEqual(mockRoadmapData.activeSprint)
      expect(result.initiatives).toEqual(mockRoadmapData.roadmapItems)
    })

    it('should handle empty roadmap data', () => {
      const emptyData = { orderedSprints: [], activeSprint: null, roadmapItems: [] }
      const result = transformRoadmapToUnified(emptyData)
      
      expect(result.metadata.type).toBe('roadmap')
      expect(result.initiatives).toEqual([])
    })

    it('should throw error for null data', () => {
      expect(() => transformRoadmapToUnified(null)).toThrow('Roadmap data is required')
    })
  })

  describe('transformCycleOverviewToUnified', () => {
    it('should transform cycle overview data to unified structure', () => {
      const result = transformCycleOverviewToUnified(mockCycleOverviewData)
      
      expect(result.metadata.type).toBe('cycle-overview')
      expect(result.metadata.cycle).toEqual(mockCycleOverviewData.cycle)
      expect(result.metadata.cycles).toEqual([])
      expect(result.metadata.activeSprint).toBeNull()
      expect(result.initiatives).toEqual(mockCycleOverviewData.initiatives)
    })

    it('should handle empty cycle overview data', () => {
      const emptyData = { cycle: null, initiatives: [] }
      const result = transformCycleOverviewToUnified(emptyData)
      
      expect(result.metadata.type).toBe('cycle-overview')
      expect(result.initiatives).toEqual([])
    })

    it('should throw error for null data', () => {
      expect(() => transformCycleOverviewToUnified(null)).toThrow('Cycle overview data is required')
    })
  })

  describe('transformUnifiedToRoadmap', () => {
    it('should transform unified data back to roadmap format', () => {
      const result = transformUnifiedToRoadmap(mockUnifiedData)
      
      expect(result.orderedSprints).toEqual(mockUnifiedData.metadata.cycles)
      expect(result.activeSprint).toEqual(mockUnifiedData.metadata.activeSprint)
      expect(result.roadmapItems).toEqual(mockUnifiedData.initiatives)
    })

    it('should throw error for non-roadmap data', () => {
      const cycleData = { ...mockUnifiedData, metadata: { ...mockUnifiedData.metadata, type: 'cycle-overview' } }
      expect(() => transformUnifiedToRoadmap(cycleData)).toThrow("Cannot convert unified data of type 'cycle-overview' to roadmap format")
    })
  })

  describe('transformUnifiedToCycleOverview', () => {
    it('should transform unified data back to cycle overview format', () => {
      const cycleData = { ...mockUnifiedData, metadata: { ...mockUnifiedData.metadata, type: 'cycle-overview', cycle: mockCycleOverviewData.cycle } }
      const result = transformUnifiedToCycleOverview(cycleData)
      
      expect(result.cycle).toEqual(cycleData.metadata.cycle)
      expect(result.initiatives).toEqual(cycleData.initiatives)
    })

    it('should throw error for non-cycle-overview data', () => {
      expect(() => transformUnifiedToCycleOverview(mockUnifiedData)).toThrow("Cannot convert unified data of type 'roadmap' to cycle overview format")
    })
  })

  describe('filterUnifiedData', () => {
    it('should return original data when no filters applied', () => {
      const result = filterUnifiedData(mockUnifiedData, {})
      expect(result).toEqual(mockUnifiedData)
    })

    it('should filter by initiatives', () => {
      const filters = {
        initiatives: [{ id: 'init1' }]
      }
      const result = filterUnifiedData(mockUnifiedData, filters)
      
      expect(result.initiatives).toHaveLength(1)
      expect(result.initiatives[0].initiativeId).toBe('init1')
    })

    it('should filter by area', () => {
      const filters = {
        area: 'frontend'
      }
      const result = filterUnifiedData(mockUnifiedData, filters)
      
      expect(result.initiatives).toHaveLength(1)
      expect(result.initiatives[0].roadmapItems).toHaveLength(1)
      expect(result.initiatives[0].roadmapItems[0].releaseItems).toHaveLength(1)
    })

    it('should filter by stages', () => {
      const filters = {
        stages: [{ id: 's0' }]
      }
      const result = filterUnifiedData(mockUnifiedData, filters)
      
      expect(result.initiatives).toHaveLength(1)
      expect(result.initiatives[0].roadmapItems).toHaveLength(1)
      expect(result.initiatives[0].roadmapItems[0].releaseItems).toHaveLength(1)
    })

    it('should handle "all" selections', () => {
      const filters = {
        initiatives: [{ id: 'all' }],
        stages: [{ id: 'all' }]
      }
      const result = filterUnifiedData(mockUnifiedData, filters)
      
      // Should return original data when "all" is selected
      expect(result).toEqual(mockUnifiedData)
    })

    it('should filter out initiatives with no matching roadmap items', () => {
      const dataWithEmptyInitiative = {
        ...mockUnifiedData,
        initiatives: [
          ...mockUnifiedData.initiatives,
          {
            initiativeId: 'init2',
            initiative: 'Backend Initiative',
            roadmapItems: []
          }
        ]
      }

      const filters = {
        area: 'frontend'
      }
      const result = filterUnifiedData(dataWithEmptyInitiative, filters)
      
      expect(result.initiatives).toHaveLength(1)
      expect(result.initiatives[0].initiativeId).toBe('init1')
    })
  })

  describe('applyFilters', () => {
    it('should work with unified data', () => {
      const filters = { area: 'frontend' }
      const result = applyFilters(mockUnifiedData, filters)
      
      expect(result.metadata.type).toBe('roadmap')
      expect(result.initiatives).toHaveLength(1)
    })

    it('should work with cycle overview data', () => {
      const filters = { area: 'frontend' }
      const result = applyFilters(mockCycleOverviewData, filters)
      
      expect(result.cycle).toEqual(mockCycleOverviewData.cycle)
      expect(result.initiatives).toHaveLength(1)
    })

    it('should work with roadmap data', () => {
      const filters = { area: 'frontend' }
      const result = applyFilters(mockRoadmapData, filters)
      
      expect(result.orderedSprints).toEqual(mockRoadmapData.orderedSprints)
      expect(result.roadmapItems).toHaveLength(1)
    })

    it('should work with initiatives array', () => {
      const initiatives = mockUnifiedData.initiatives
      const filters = { area: 'frontend' }
      const result = applyFilters(initiatives, filters)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })

    it('should handle null/undefined data', () => {
      expect(applyFilters(null, {})).toBeNull()
      expect(applyFilters(undefined, {})).toBeUndefined()
    })

    it('should handle unknown data types gracefully', () => {
      const unknownData = { someProperty: 'value' }
      const result = applyFilters(unknownData, {})
      
      expect(result).toBe(unknownData)
    })
  })

  describe('Error Handling', () => {
    it('should log errors and re-throw them', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const invalidData = { invalid: 'structure' }
      const filters = { area: 'frontend' }
      
      expect(() => applyFilters(invalidData, filters)).toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Error in applyFilters:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})
