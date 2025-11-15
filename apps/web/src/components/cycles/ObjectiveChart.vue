<template>
  <div class="global-objectives__container">
    <div
      v-if="!objectives || objectives.length === 0"
      class="global-objectives__loading"
    >
      <p>Loading objectives...</p>
    </div>
    <div
      v-else-if="isReady"
      class="global-objectives__chart-container"
      style="transform: rotateY(180deg) rotateX(180deg)"
    >
      <apexchart
        :key="`background-${objectives.length}`"
        class="global-objectives__chart global-objectives__chart_background"
        type="radialBar"
        height="100%"
        :options="options2"
        :series="objectiveTracks"
      ></apexchart>
      <apexchart
        :key="`inprogress-${objectives.length}`"
        class="global-objectives__chart"
        type="radialBar"
        height="100%"
        :options="inProgressOptions"
        :series="objectiveInProgress"
      ></apexchart>
      <apexchart
        :key="`progress-${objectives.length}`"
        class="global-objectives__chart"
        type="radialBar"
        height="100%"
        :options="options1"
        :series="objectiveProgresses"
      ></apexchart>
    </div>
    <div
      v-if="objectives && objectives.length > 0 && isReady"
      class="global-objectives__details"
      :class="objectiveLengthClass()"
    >
      <div>
        <div
          v-for="objective in objectivesWithRelativeValues"
          :key="objective.name"
          class="global-objectives__detail"
        >
          <div class="global-objectives__detail__progress">
            {{ objective.progress }}%
            <div class="global-objectives__detail__weeks">
              <strong>{{ objective.weeksDone }}</strong> of
              {{ objective.weeks }} weeks
            </div>
          </div>
          <div class="global-objectives__detail__name">
            <span class="objective">{{ objective.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, onMounted, ref } from "vue";
import {
  summarizeObjectives,
  calculateObjectiveRelativeValues,
  extractObjectiveTracks,
  extractObjectiveProgresses,
  extractObjectiveInProgress,
  validateChartOptions,
  getObjectiveLengthClass,
} from "../../lib/charts/objective-chart-calculations";

export default {
  name: "objective-chart",
  props: {
    objectives: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const isReady = ref(false);

    onMounted(async () => {
      await nextTick();
      isReady.value = true;
    });
    const options1Default = {
      chart: {},
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: -50,
          endAngle: 230,
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "var(--color-gray-800)",
            strokeWidth: "0%",
            opacity: 1,
            margin: 5,
          },
          hollow: {
            margin: 50,
            size: "35%",
            background: "transparent",
            image: undefined,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 1,
            },
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: false,
            },
          },
        },
      },
      colors: [
        "var(--color-highlight)",
        "var(--color-info)",
        "var(--color-gray-500)",
        "var(--color-gray-600)",
        "var(--color-gray-600)",
        "var(--color-gray-500)",
        "var(--color-warning)",
        "var(--color-gray-300)",
      ],
      fill: {
        opacity: 1,
      },
    };

    const options2Default = {
      chart: {
        animations: {
          enabled: false,
        },
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: -50,
          endAngle: 230,
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "transparent",
            strokeWidth: "0%",
            opacity: 1,
            margin: 5,
          },
          hollow: {
            margin: 50,
            size: "35%",
            background: "transparent",
            image: undefined,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 1,
            },
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: false,
            },
          },
        },
      },
      colors: [
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
        "var(--color-gray-700)",
      ],
      fill: {
        opacity: 1,
      },
    };

    const inProgressOptionsDefault = {
      chart: {},
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: -50,
          endAngle: 230,
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "var(--color-gray-800)",
            strokeWidth: "0%",
            opacity: 1,
            margin: 5,
          },
          hollow: {
            margin: 50,
            size: "35%",
            background: "transparent",
            image: undefined,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 1,
            },
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: false,
            },
          },
        },
      },
      colors: [
        "var(--color-highlight)",
        "var(--color-info)",
        "var(--color-gray-500)",
        "var(--color-gray-600)",
        "var(--color-gray-600)",
        "var(--color-gray-500)",
        "var(--color-warning)",
        "var(--color-gray-300)",
      ],
      fill: {
        opacity: 0.3,
      },
    };

    const summarizedObjectives = computed(() =>
      summarizeObjectives(props.objectives, 8),
    );

    const options1 = computed(() => {
      return validateChartOptions(
        options1Default,
        summarizedObjectives.value.length,
      );
    });

    const options2 = computed(() => {
      return validateChartOptions(
        options2Default,
        summarizedObjectives.value.length,
      );
    });

    const inProgressOptions = computed(() => {
      return validateChartOptions(
        inProgressOptionsDefault,
        summarizedObjectives.value.length,
      );
    });

    const objectivesWithRelativeValues = computed(() =>
      calculateObjectiveRelativeValues(summarizedObjectives.value),
    );

    const objectiveTracks = computed(() =>
      extractObjectiveTracks(objectivesWithRelativeValues.value),
    );

    const objectiveProgresses = computed(() =>
      extractObjectiveProgresses(objectivesWithRelativeValues.value),
    );

    const objectiveInProgress = computed(() =>
      extractObjectiveInProgress(objectivesWithRelativeValues.value),
    );

    const objectiveLengthClass = () =>
      getObjectiveLengthClass(summarizedObjectives.value.length);

    return {
      isReady,
      options1,
      options2,
      inProgressOptions,
      objectiveTracks,
      objectiveProgresses,
      objectiveInProgress,
      objectivesWithRelativeValues,
      objectiveLengthClass,
    };
  },
};
</script>
