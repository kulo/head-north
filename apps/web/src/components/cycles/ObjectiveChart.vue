<template>
  <div class="global-initiatives__container">
    <div
      v-if="!initiatives || initiatives.length === 0"
      class="global-initiatives__loading"
    >
      <p>Loading initiatives...</p>
    </div>
    <div
      v-else-if="isReady"
      class="global-initiatives__chart-container"
      style="transform: rotateY(180deg) rotateX(180deg)"
    >
      <apexchart
        :key="`background-${initiatives.length}`"
        class="global-initiatives__chart global-initiatives__chart_background"
        type="radialBar"
        height="100%"
        :options="options2"
        :series="initiativeTracks"
      ></apexchart>
      <apexchart
        :key="`inprogress-${initiatives.length}`"
        class="global-initiatives__chart"
        type="radialBar"
        height="100%"
        :options="inProgressOptions"
        :series="initiativeInProgress"
      ></apexchart>
      <apexchart
        :key="`progress-${initiatives.length}`"
        class="global-initiatives__chart"
        type="radialBar"
        height="100%"
        :options="options1"
        :series="initiativeProgresses"
      ></apexchart>
    </div>
    <div
      v-if="initiatives && initiatives.length > 0 && isReady"
      class="global-initiatives__details"
      :class="initiativeLengthClass()"
    >
      <div>
        <div
          v-for="initiative in initiativesWithRelativeValues"
          :key="initiative.name"
          class="global-initiatives__detail"
        >
          <div class="global-initiatives__detail__progress">
            {{ initiative.progress }}%
            <div class="global-initiatives__detail__weeks">
              <strong>{{ initiative.weeksDone }}</strong> of
              {{ initiative.weeks }} weeks
            </div>
          </div>
          <div class="global-initiatives__detail__name">
            <span class="initiative">{{ initiative.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, onMounted, ref } from "vue";
import {
  summarizeInitiatives,
  calculateInitiativeRelativeValues,
  extractInitiativeTracks,
  extractInitiativeProgresses,
  extractInitiativeInProgress,
  validateChartOptions,
  getInitiativeLengthClass,
} from "../../lib/charts/initiative-chart-calculations";

export default {
  name: "initiative-chart",
  props: {
    initiatives: {
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

    const summarizedInitiatives = computed(() =>
      summarizeInitiatives(props.initiatives, 8),
    );

    const options1 = computed(() => {
      return validateChartOptions(
        options1Default,
        summarizedInitiatives.value.length,
      );
    });

    const options2 = computed(() => {
      return validateChartOptions(
        options2Default,
        summarizedInitiatives.value.length,
      );
    });

    const inProgressOptions = computed(() => {
      return validateChartOptions(
        inProgressOptionsDefault,
        summarizedInitiatives.value.length,
      );
    });

    const initiativesWithRelativeValues = computed(() =>
      calculateInitiativeRelativeValues(summarizedInitiatives.value),
    );

    const initiativeTracks = computed(() =>
      extractInitiativeTracks(initiativesWithRelativeValues.value),
    );

    const initiativeProgresses = computed(() =>
      extractInitiativeProgresses(initiativesWithRelativeValues.value),
    );

    const initiativeInProgress = computed(() =>
      extractInitiativeInProgress(initiativesWithRelativeValues.value),
    );

    const initiativeLengthClass = () =>
      getInitiativeLengthClass(summarizedInitiatives.value.length);

    return {
      isReady,
      options1,
      options2,
      inProgressOptions,
      initiativeTracks,
      initiativeProgresses,
      initiativeInProgress,
      initiativesWithRelativeValues,
      initiativeLengthClass,
    };
  },
};
</script>
