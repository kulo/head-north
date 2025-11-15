<template>
  <div
    class="global-initiatives__progress"
    :class="{ 'global-initiatives__progress-gt4': initiatives.length > 4 }"
  >
    <div class="global-initiatives__progress__row">
      <div class="global-initiatives__progress__big-container">
        <div class="global-initiatives__progress__big">
          {{ cycle.progress }}%
        </div>
        <div class="global-initiatives__progress__big-title">
          Overall Progress
        </div>
      </div>

      <div
        class="global-initiatives__progress__bar"
        :style="{
          '--percentage': cycle.progress + '%',
          '--percentage-with-in-progress': cycle.progressWithInProgress + '%',
          '--percentage-not-to-do': cycle.percentageNotToDo + '%',
        }"
      >
        <a-tooltip placement="top-end">
          <template #title>In Progress</template>
          <div class="global-initiatives__progress__bar_inprogress"></div>
        </a-tooltip>
        <a-tooltip placement="top">
          <template #title>Done</template>
          <div class="global-initiatives__progress__bar_done"></div>
        </a-tooltip>
        <a-tooltip placement="top">
          <template #title>Cancelled / Postponed</template>
          <div class="global-initiatives__progress__bar_nottodo"></div>
        </a-tooltip>
      </div>

      <div class="global-initiatives__time__bar">
        <div class="global-initiatives__time__start">
          {{ cycle.startMonth }}
        </div>
        <div class="global-initiatives__time__end">{{ cycle.endMonth }}</div>
        <div
          v-if="cycle.currentDayPercentage > 30"
          class="global-initiatives__time__current label-left"
          :style="{ '--percentage': cycle.currentDayPercentage + '%' }"
        >
          Optimal Progress
          <UpOutlined />
        </div>
        <div
          v-if="cycle.currentDayPercentage <= 30"
          class="global-initiatives__time__current label-right"
          :style="{ '--percentage': cycle.currentDayPercentage + '%' }"
        >
          <UpOutlined /> Optimal Progress
        </div>
      </div>
    </div>

    <a-row :gutter="16" justify="start">
      <a-col :xs="8" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.weeks }} wks
          </div>
          <div class="global-initiatives__progress__title">Estimation</div>
        </div>
      </a-col>
      <a-col :xs="8" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.weeksDone }} wks
          </div>
          <div class="global-initiatives__progress__title">Done</div>
        </div>
      </a-col>
      <a-col class="hidden-xs-only" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.weeksInProgress }} wks
          </div>
          <div class="global-initiatives__progress__title">In Progress</div>
        </div>
      </a-col>
      <a-col class="hidden-xs-only" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.weeksCancelled }} wks
          </div>
          <div class="global-initiatives__progress__title">Cancelled</div>
        </div>
      </a-col>
      <a-col class="hidden-xs-only" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.weeksPostponed }} wks
          </div>
          <div class="global-initiatives__progress__title">Postponed</div>
        </div>
      </a-col>
      <a-col :xs="8" :sm="4">
        <div class="global-initiatives__progress__value-container">
          <div class="global-initiatives__progress_value">
            {{ cycle.releaseItemsDoneCount }} of {{ cycle.releaseItemsCount }}
          </div>
          <div class="global-initiatives__progress__title">
            Release Items Done
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { UpOutlined } from "@ant-design/icons-vue";

export default {
  name: "global-initiative-progress",
  components: {
    UpOutlined,
  },
  props: {
    cycle: {
      type: Object,
      required: true,
    },
    initiatives: {
      type: Array,
      required: true,
    },
  },
};
</script>
