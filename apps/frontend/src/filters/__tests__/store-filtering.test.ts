import { createStore } from 'vuex';
import createAppStore from '../../store/index';

// Mock the CycleDataService
const mockCycleDataService = {
  getCycleData: jest.fn(),
  getAllCycles: jest.fn(),
  getAllInitiatives: jest.fn(),
  getAllAssignees: jest.fn(),
  getAllAreas: jest.fn(),
  getAllStages: jest.fn(),
  getActiveCycle: jest.fn()
};

// Mock omegaConfig
const mockOmegaConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [
      { id: 'cycle-overview', name: 'Cycle Overview', path: '/cycle-overview' }
    ]
  }),
  getPage: (pageId) => ({ id: pageId, name: 'Cycle Overview', path: '/cycle-overview' })
};

// Mock router
const mockRouter = {
  currentRoute: { value: { path: '/cycle-overview' } },
  push: jest.fn()
};

describe('Store Filtering', () => {
  let store;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create fresh store instance
    store = createAppStore(mockCycleDataService, mockOmegaConfig, mockRouter);
  });

  describe('cycle filtering integration', () => {
    let consoleErrorSpy;

    const mockCycleData = {
      cycles: [
        { id: 'cycle1', name: 'Cycle 1', state: 'active', start: '2024-01-01' },
        { id: 'cycle2', name: 'Cycle 2', state: 'active', start: '2024-02-01' },
        { id: 'cycle3', name: 'Cycle 3', state: 'completed', start: '2023-12-01' }
      ],
      initiatives: [
        {
          id: 1,
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
                  area: 'frontend',
                  stage: 's1'
                },
                {
                  id: 'release2',
                  name: 'Release Item 2',
                  cycleId: 'cycle2',
                  area: 'frontend',
                  stage: 's2'
                }
              ]
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCycleDataService.getCycleData.mockResolvedValue(mockCycleData);
      mockCycleDataService.getAllCycles.mockResolvedValue(mockCycleData.cycles);
      mockCycleDataService.getActiveCycle.mockResolvedValue(mockCycleData.cycles[0]);
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should filter initiatives by selected cycle', async () => {
      // Set up initial data
      await store.dispatch('fetchCycleOverviewData');
      
      // Select a specific cycle
      const cycle2 = mockCycleData.cycles[1];
      await store.dispatch('fetchCycle', cycle2);
      
      // Get filtered data
      const filteredData = store.getters.currentCycleOverviewData;
      
      expect(filteredData).toBeDefined();
      expect(filteredData.initiatives).toHaveLength(1);
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems).toHaveLength(1);
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems[0].cycleId).toBe('cycle2');
    });

    test('should select oldest active cycle by default', async () => {
      await store.dispatch('fetchCycles');
      
      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe('cycle1'); // Oldest active cycle
    });

    test('should refresh cycle overview data when cycle changes', async () => {
      const fetchCycleOverviewDataSpy = jest.spyOn(store, 'dispatch');
      
      await store.dispatch('fetchCycleOverviewData');
      const cycle2 = mockCycleData.cycles[1];
      await store.dispatch('fetchCycle', cycle2);
      
      expect(fetchCycleOverviewDataSpy).toHaveBeenCalledWith('fetchCycleOverviewData');
    });

    test('should return empty results and log error when no cycle is selected', async () => {
      await store.dispatch('fetchCycleOverviewData');
      
      // Clear the selected cycle
      store.commit('SET_SELECTED_CYCLE', null);
      
      const filteredData = store.getters.currentCycleOverviewData;
      
      expect(filteredData.initiatives).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('filterByCycle: No cycle provided. Client code must ensure a valid cycle is passed.');
    });
  });

  describe('filter combination', () => {
    const mockData = {
      cycles: [
        { id: 'cycle1', name: 'Cycle 1', state: 'active' }
      ],
      initiatives: [
        {
          id: 1,
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
                  area: 'frontend',
                  stage: 's1',
                  assignee: { id: 'user1', name: 'User 1' }
                },
                {
                  id: 'release2',
                  name: 'Release Item 2',
                  cycleId: 'cycle1',
                  area: 'backend',
                  stage: 's2',
                  assignee: { id: 'user2', name: 'User 2' }
                }
              ]
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      mockCycleDataService.getCycleData.mockResolvedValue(mockData);
      mockCycleDataService.getAllCycles.mockResolvedValue(mockData.cycles);
      mockCycleDataService.getActiveCycle.mockResolvedValue(mockData.cycles[0]);
    });

    test('should apply multiple filters simultaneously', async () => {
      await store.dispatch('fetchCycleOverviewData');
      
      // Set multiple filters
      store.commit('SET_SELECTED_AREA', 'frontend');
      store.commit('SET_SELECTED_STAGES', [{ value: 's1', name: 'Stage 1' }]);
      store.commit('SET_SELECTED_CYCLE', { id: 'cycle1', name: 'Cycle 1' });
      
      const filteredData = store.getters.currentCycleOverviewData;
      
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems).toHaveLength(1);
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems[0].area).toBe('frontend');
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems[0].stage).toBe('s1');
      expect(filteredData.initiatives[0].roadmapItems[0].releaseItems[0].cycleId).toBe('cycle1');
    });

    test('should return empty results when no items match all filters', async () => {
      await store.dispatch('fetchCycleOverviewData');
      
      // Set filters that don't match any items
      store.commit('SET_SELECTED_AREA', 'mobile');
      store.commit('SET_SELECTED_STAGES', [{ value: 's3', name: 'Stage 3' }]);
      
      const filteredData = store.getters.currentCycleOverviewData;
      
      expect(filteredData.initiatives).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    test('should handle errors in fetchCycleOverviewData', async () => {
      const error = new Error('Network error');
      mockCycleDataService.getCycleData.mockRejectedValue(error);
      
      await store.dispatch('fetchCycleOverviewData');
      
      expect(store.state.error).toBe('Network error');
      expect(store.state.loading).toBe(false);
    });

    test('should handle errors in fetchCycles', async () => {
      const error = new Error('Cycles fetch failed');
      mockCycleDataService.getAllCycles.mockRejectedValue(error);
      
      await store.dispatch('fetchCycles');
      
      expect(store.state.error).toBe('Cycles fetch failed');
    });
  });
});
