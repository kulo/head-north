import { createStore } from 'vuex';
import store from '../src/store/index.js';

// Mock fetch
global.fetch = jest.fn();

describe('Vuex Store', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('state', () => {
    test('should have correct initial state', () => {
      expect(store.state.loading).toBe(false);
      expect(store.state.error).toBe(null);
      expect(store.state.initiatives).toEqual([]);
      expect(store.state.assignees).toEqual([]);
      expect(store.state.areas).toEqual([]);
      expect(store.state.selectedInitiative).toBe(null);
      expect(store.state.selectedAssignee).toBe(null);
      expect(store.state.selectedArea).toBe(null);
    });
  });

  describe('mutations', () => {
    test('SET_LOADING should update loading state', () => {
      store.commit('SET_LOADING', true);
      expect(store.state.loading).toBe(true);
    });

    test('SET_ERROR should update error state', () => {
      store.commit('SET_ERROR', 'Test error');
      expect(store.state.error).toBe('Test error');
    });

    test('SET_INITIATIVES should update initiatives', () => {
      const initiatives = [{ id: 1, name: 'Test Initiative' }];
      store.commit('SET_INITIATIVES', initiatives);
      expect(store.state.initiatives).toEqual(initiatives);
    });

    test('SET_ASSIGNEES should update assignees', () => {
      const assignees = [{ id: 'user1', name: 'Test User' }];
      store.commit('SET_ASSIGNEES', assignees);
      expect(store.state.assignees).toEqual(assignees);
    });

    test('SET_AREAS should update areas', () => {
      const areas = [{ id: 'frontend', name: 'Frontend' }];
      store.commit('SET_AREAS', areas);
      expect(store.state.areas).toEqual(areas);
    });

    test('SET_SELECTED_INITIATIVE should update selected initiative', () => {
      store.commit('SET_SELECTED_INITIATIVE', 1);
      expect(store.state.selectedInitiative).toBe(1);
    });

    test('SET_SELECTED_ASSIGNEE should update selected assignee', () => {
      store.commit('SET_SELECTED_ASSIGNEE', 'user1');
      expect(store.state.selectedAssignee).toBe('user1');
    });

    test('SET_SELECTED_AREA should update selected area', () => {
      store.commit('SET_SELECTED_AREA', 'frontend');
      expect(store.state.selectedArea).toBe('frontend');
    });
  });

  describe('actions', () => {
    test('fetchInitiatives should fetch and set initiatives', async () => {
      const mockData = {
        initiatives: [
          { id: 1, name: 'AI Initiative' },
          { id: 2, name: 'Data Initiative' }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      await store.dispatch('fetchInitiatives');
      
      expect(fetch).toHaveBeenCalledWith('/api/jira-overview');
      expect(store.state.initiatives).toEqual(mockData.initiatives);
    });

    test('fetchInitiatives should fallback to mock data on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch('fetchInitiatives');
      
      expect(store.state.initiatives).toEqual([
        { id: 1, name: 'AI Platform Enhancement' },
        { id: 2, name: 'Customer Data Platform' },
        { id: 3, name: 'Mobile Experience' }
      ]);
    });

    test('fetchAssignees should fetch and set assignees', async () => {
      const mockData = {
        devCycleData: {
          assignees: [
            { accountId: 'user1', displayName: 'John Doe' },
            { accountId: 'user2', displayName: 'Jane Smith' }
          ]
        }
      };
      
      fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      await store.dispatch('fetchAssignees');
      
      expect(store.state.assignees).toEqual([
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Smith' }
      ]);
    });

    test('fetchAreas should fetch and set areas', async () => {
      const mockData = {
        areas: [
          { id: 'frontend', name: 'Frontend' },
          { id: 'backend', name: 'Backend' }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      await store.dispatch('fetchAreas');
      
      expect(store.state.areas).toEqual(mockData.areas);
    });

    test('setSelectedInitiative should commit correct mutation', () => {
      const spy = jest.spyOn(store, 'commit');
      store.dispatch('setSelectedInitiative', 1);
      expect(spy).toHaveBeenCalledWith('SET_SELECTED_INITIATIVE', 1);
    });

    test('setSelectedAssignee should commit correct mutation', () => {
      const spy = jest.spyOn(store, 'commit');
      store.dispatch('setSelectedAssignee', 'user1');
      expect(spy).toHaveBeenCalledWith('SET_SELECTED_ASSIGNEE', 'user1');
    });

    test('setSelectedArea should commit correct mutation', () => {
      const spy = jest.spyOn(store, 'commit');
      store.dispatch('setSelectedArea', 'frontend');
      expect(spy).toHaveBeenCalledWith('SET_SELECTED_AREA', 'frontend');
    });
  });

  describe('getters', () => {
    test('releaseOverviewData should return correct data', () => {
      const mockData = {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null
      };
      store.commit('SET_RELEASE_OVERVIEW_DATA', mockData);
      expect(store.getters.releaseOverviewData).toEqual(mockData);
    });

    test('initiativeName should return correct name', () => {
      const initiatives = [
        { id: 1, name: 'AI Initiative' },
        { id: 2, name: 'Data Initiative' }
      ];
      store.commit('SET_INITIATIVES', initiatives);
      
      expect(store.getters.initiativeName(1)).toBe('AI Initiative');
      expect(store.getters.initiativeName(2)).toBe('Data Initiative');
      expect(store.getters.initiativeName(999)).toBe('Unknown Initiative');
    });
  });
});
