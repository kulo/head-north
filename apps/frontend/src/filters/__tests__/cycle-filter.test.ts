import { filterByCycle } from '../cycle-filter';

describe('cycleFilter', () => {
  const mockData = [
    {
      id: 'initiative1',
      name: 'Test Initiative 1',
      roadmapItems: [
        {
          id: 'roadmap1',
          name: 'Roadmap Item 1',
          releaseItems: [
            {
              id: 'release1',
              name: 'Release Item 1',
              cycleId: 'cycle1',
              sprint: { id: 'cycle1', name: 'Sprint 1' }
            },
            {
              id: 'release2',
              name: 'Release Item 2',
              cycleId: 'cycle2',
              sprint: { id: 'cycle2', name: 'Sprint 2' }
            }
          ]
        }
      ]
    },
    {
      id: 'initiative2',
      name: 'Test Initiative 2',
      roadmapItems: [
        {
          id: 'roadmap2',
          name: 'Roadmap Item 2',
          releaseItems: [
            {
              id: 'release3',
              name: 'Release Item 3',
              cycleId: 'cycle1',
              sprint: { id: 'cycle1', name: 'Sprint 1' }
            }
          ]
        }
      ]
    }
  ];

  describe('filterByCycle', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should return empty array and log error when no cycle is selected', () => {
      const result = filterByCycle(mockData, null);
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('filterByCycle: No cycle provided. Client code must ensure a valid cycle is passed.');
    });

    test('should return empty array and log error when cycle is "all"', () => {
      const result = filterByCycle(mockData, 'all');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('filterByCycle: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.');
    });

    test('should return empty array and log error when cycle ID is empty', () => {
      const result = filterByCycle(mockData, '');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('filterByCycle: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.');
    });

    test('should filter by cycle ID', () => {
      const result = filterByCycle(mockData, 'cycle1');
      
      expect(result).toHaveLength(2);
      expect(result[0].roadmapItems[0].releaseItems).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems[0].cycleId).toBe('cycle1');
      expect(result[1].roadmapItems[0].releaseItems).toHaveLength(1);
      expect(result[1].roadmapItems[0].releaseItems[0].cycleId).toBe('cycle1');
    });

    test('should filter by cycle object', () => {
      const cycle = { id: 'cycle2', name: 'Cycle 2' };
      const result = filterByCycle(mockData, cycle);
      
      expect(result).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems[0].cycleId).toBe('cycle2');
    });

    test('should filter by sprint ID when cycleId is not available', () => {
      const dataWithSprintOnly = [
        {
          id: 'initiative1',
          name: 'Test Initiative 1',
          roadmapItems: [
            {
              id: 'roadmap1',
              name: 'Roadmap Item 1',
              releaseItems: [
                {
                  id: 'release1',
                  name: 'Release Item 1',
                  sprint: { id: 'cycle1', name: 'Sprint 1' }
                }
              ]
            }
          ]
        }
      ];

      const result = filterByCycle(dataWithSprintOnly, 'cycle1');
      expect(result).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems).toHaveLength(1);
    });

    test('should return empty array when no items match the cycle', () => {
      const result = filterByCycle(mockData, 'nonexistent-cycle');
      expect(result).toEqual([]);
    });

    test('should handle empty data', () => {
      const result = filterByCycle([], 'cycle1');
      expect(result).toEqual([]);
    });

    test('should handle null data', () => {
      const result = filterByCycle(null, 'cycle1');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('filterByCycle: Invalid items data provided. Expected an array.');
    });

    test('should work with cycle-overview data structure', () => {
      const cycleOverviewData = {
        initiatives: mockData
      };

      const result = filterByCycle([cycleOverviewData], 'cycle1');
      expect(result).toHaveLength(1);
      expect(result[0].initiatives).toHaveLength(2);
    });
  });
});
