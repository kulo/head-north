import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import InitiativeSelector from '../../src/components/InitiativeSelector.vue';

describe('InitiativeSelector', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = createStore({
      state: {
        initiatives: [
          { id: 1, name: 'AI Initiative' },
          { id: 2, name: 'Data Initiative' },
          { id: 3, name: 'Mobile Initiative' }
        ]
      },
      actions: {
        setSelectedInitiative: jest.fn(),
        fetchInitiatives: jest.fn()
      }
    });

    wrapper = mount(InitiativeSelector, {
      global: {
        plugins: [store]
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  test('should render correctly', () => {
    expect(wrapper.find('.initiative-selector').exists()).toBe(true);
    expect(wrapper.find('select').exists()).toBe(true);
  });

  test('should display initiatives in dropdown', () => {
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(4); // 3 initiatives + 1 placeholder
    expect(options[1].text()).toBe('AI Initiative');
    expect(options[2].text()).toBe('Data Initiative');
    expect(options[3].text()).toBe('Mobile Initiative');
  });

  test('should call setSelectedInitiative when selection changes', async () => {
    const select = wrapper.find('select');
    await select.setValue('2');
    
    expect(store.dispatch).toHaveBeenCalledWith('setSelectedInitiative', '2');
  });

  test('should fetch initiatives on mount', () => {
    expect(store.dispatch).toHaveBeenCalledWith('fetchInitiatives');
  });

  test('should have correct placeholder text', () => {
    const select = wrapper.find('select');
    expect(select.attributes('placeholder')).toBe('Select Initiative');
  });
});
