<template>
  <a-select
    v-model:value="selectedStages"
    class="external-selector stage-selector"
    mode="multiple"
    placeholder="All Stages"
    @change="setSelectedStages"
  >
    <a-select-option key="all" value="all"> All Stages </a-select-option>
    <a-select-option
      v-for="stage in filteredStages"
      :key="stage.id"
      :value="stage.id"
      :class="{
        'stage-option-selected': isStageSelected(stage.id),
      }"
    >
      {{ stage.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

export default {
  name: "StageSelector",
  setup() {
    const store = useStore();

    // Use store getters for global state
    const stages = computed(() => store.state.stages || []);
    const filteredStages = computed(() => store.getters.filteredStages);
    const isStageSelected = (stageId) => store.getters.isStageSelected(stageId);

    // Create writable ref for v-model
    const selectedStages = ref([]);

    // Watch store changes and update local ref
    watch(
      () => store.getters.selectedStageIds,
      (newValue) => {
        selectedStages.value = newValue || [];
      },
      { immediate: true },
    );

    const setSelectedStages = (stageIds) => {
      // If "all" is selected, clear all selections
      if (stageIds && stageIds.includes("all")) {
        store.dispatch("setSelectedStages", []);
        return;
      }

      // If no stages selected, clear the store (equivalent to "All Stages")
      if (!stageIds || stageIds.length === 0) {
        store.dispatch("setSelectedStages", []);
        return;
      }

      // Convert IDs back to stage objects for the store
      const stageObjects = stageIds.map((id) => {
        const stage = stages.value.find((stage) => stage.id === id);
        return stage || { id: id, name: "Unknown Stage" };
      });

      store.dispatch("setSelectedStages", stageObjects);
    };

    return {
      selectedStages,
      stages,
      filteredStages,
      isStageSelected,
      setSelectedStages,
    };
  },
};
</script>
