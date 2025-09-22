<template>
  <div class="global-initiatives__container">
    <div
      class="global-initiatives__chart-container"
      style="transform: rotateY(180deg) rotateX(180deg)"
    >
      <apexchart
        class="global-initiatives__chart global-initiatives__chart_background"
        type="radialBar"
        height="100%"
        :options="options2"
        :series="initiativeTracks"
      ></apexchart>
      <apexchart
        class="global-initiatives__chart"
        type="radialBar"
        height="100%"
        :options="inProgressOptions"
        :series="initiativeInProgress"
      ></apexchart>
      <apexchart
        class="global-initiatives__chart"
        type="radialBar"
        height="100%"
        :options="options1"
        :series="initiativeProgresses"
      ></apexchart>
    </div>
    <div class="global-initiatives__details" :class="initiativeLengthClass()">
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
            <span class="initiative">{{ initiative.initiative }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

const deepCopy = function (src) {
  return JSON.parse(JSON.stringify(src));
};

const sortInitiatives = (initiatives) => {
  return deepCopy(initiatives).sort(
    (init1, init2) => init2.weeks - init1.weeks,
  );
};

export default {
  name: "initiative-chart",
  props: {
    initiatives: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
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

    const summarizedInitiatives = computed(() => {
      const maxInitiativesOnPage = 8;
      if (props.initiatives.length <= maxInitiativesOnPage) {
        return props.initiatives;
      }

      const sortedInitiatives = sortInitiatives(props.initiatives);
      const headInitiatives = sortedInitiatives.slice(
        0,
        maxInitiativesOnPage - 1,
      );
      const tailInitiatives = sortedInitiatives.slice(maxInitiativesOnPage - 1);
      const defaultOtherInitiative = {
        name: "Other Projects",
        initiative: "Other Projects",
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
      };

      const summarizedOtherInitiative = tailInitiatives.reduce((acc, init) => {
        acc.weeks += init.weeks;
        acc.weeksDone += init.weeksDone;
        acc.weeksInProgress += init.weeksInProgress;
        return acc;
      }, defaultOtherInitiative);

      const progressRate =
        summarizedOtherInitiative.weeks > 0
          ? summarizedOtherInitiative.weeksDone /
            summarizedOtherInitiative.weeks
          : 0;
      summarizedOtherInitiative.progress = Math.round(progressRate * 100) || 0;

      const inprogressRate =
        summarizedOtherInitiative.weeks > 0
          ? (summarizedOtherInitiative.weeksDone +
              summarizedOtherInitiative.weeksInProgress) /
            summarizedOtherInitiative.weeks
          : 0;
      summarizedOtherInitiative.progressWithInProgress =
        Math.round(inprogressRate * 100) || 0;

      return sortInitiatives(headInitiatives.concat(summarizedOtherInitiative));
    });

    const options1 = computed(() => {
      let options = deepCopy(options1Default);
      if (summarizedInitiatives.value.length > 4)
        options.plotOptions.radialBar.hollow.size = "25%"; // Increased from 15% to prevent negative radii

      return options;
    });

    const options2 = computed(() => {
      let options = deepCopy(options2Default);
      if (summarizedInitiatives.value.length > 4)
        options.plotOptions.radialBar.hollow.size = "25%"; // Increased from 15% to prevent negative radii
      return options;
    });

    const inProgressOptions = computed(() => {
      let options = deepCopy(inProgressOptionsDefault);
      if (summarizedInitiatives.value.length > 4)
        options.plotOptions.radialBar.hollow.size = "25%"; // Increased from 15% to prevent negative radii
      return options;
    });

    const initiativesWithRelativeValues = computed(() => {
      let initiatives = summarizedInitiatives.value.map((initiative) => {
        return {
          name: initiative.name,
          initiative: initiative.initiative,
          weeks: initiative.weeks,
          weeksDone: initiative.weeksDone,
          progress: initiative.progress,
          progressWithInProgress: initiative.progressWithInProgress,
        };
      });

      let longestInitiative = initiatives[0];

      return initiatives.map((initiative, i) => {
        // Prevent division by zero and ensure positive values
        let relativeModifierToLongest =
          longestInitiative.weeks > 0
            ? initiative.weeks / longestInitiative.weeks
            : 0;

        // Ensure relativeModifierToLongest is always positive and finite
        relativeModifierToLongest = Math.max(
          0,
          Math.min(10, relativeModifierToLongest),
        ); // Cap at 10 to prevent extreme values
        if (!isFinite(relativeModifierToLongest)) relativeModifierToLongest = 0;

        let trackLength = Math.max(
          1,
          Math.ceil(relativeModifierToLongest * 100 * 1.1),
        ); // Start with minimum 1

        // Apply multipliers with safety checks
        if (trackLength < 10) {
          trackLength = Math.max(1, Math.min(100, trackLength * 2.3));
        } else if (trackLength < 30) {
          trackLength = Math.max(1, Math.min(100, trackLength * 1.1));
        } else if (trackLength < 80) {
          trackLength = Math.max(1, Math.min(100, trackLength * 1.15));
        }

        // Final safety check - ensure trackLength is always positive and within bounds
        trackLength = Math.max(1, Math.min(100, Math.abs(trackLength)));
        if (!isFinite(trackLength)) trackLength = 1;

        // Ensure progress values are not negative and within bounds
        let safeProgress = Math.max(
          0,
          Math.min(100, Math.abs(initiative.progress || 0)),
        );
        let safeInProgress = Math.max(
          0,
          Math.min(100, Math.abs(initiative.progressWithInProgress || 0)),
        );

        // Ensure progress values are finite
        if (!isFinite(safeProgress)) safeProgress = 0;
        if (!isFinite(safeInProgress)) safeInProgress = 0;

        let progressOnTrack = Math.max(
          0,
          Math.min(trackLength, Math.ceil((safeProgress / 100) * trackLength)),
        );
        let inprogressOnTrack = Math.max(
          0,
          Math.min(
            trackLength,
            Math.ceil((safeInProgress / 100) * trackLength),
          ),
        );

        // Final safety check - ensure all values are non-negative and finite
        trackLength = Math.abs(trackLength);
        progressOnTrack = Math.abs(progressOnTrack);
        inprogressOnTrack = Math.abs(inprogressOnTrack);

        // Final validation for all values
        if (!isFinite(trackLength) || trackLength <= 0) trackLength = 1;
        if (!isFinite(progressOnTrack) || progressOnTrack < 0)
          progressOnTrack = 0;
        if (!isFinite(inprogressOnTrack) || inprogressOnTrack < 0)
          inprogressOnTrack = 0;

        return {
          name: initiative.name,
          initiative: initiative.initiative,
          weeks: initiative.weeks,
          weeksDone: initiative.weeksDone,
          progress: initiative.progress,
          trackLength,
          progressOnTrack,
          inprogressOnTrack,
        };
      });
    });

    const initiativeTracks = computed(() => {
      const result = initiativesWithRelativeValues.value.map((initiative) => {
        const value = Math.max(
          1,
          Math.min(100, Math.abs(initiative.trackLength || 1)),
        );
        if (value <= 0 || isNaN(value) || !isFinite(value)) {
          return 1;
        }
        return value;
      });

      // Final safety check - ensure no values are negative or invalid
      const safeResult = result.map((value) => {
        if (value <= 0 || !isFinite(value) || isNaN(value)) {
          return 1;
        }
        return value;
      });

      return safeResult;
    });

    const initiativeProgresses = computed(() => {
      const result = initiativesWithRelativeValues.value.map((initiative) => {
        const value = Math.max(
          0,
          Math.min(100, Math.abs(initiative.progressOnTrack || 0)),
        );
        if (value < 0 || isNaN(value) || !isFinite(value)) {
          return 0;
        }
        return value;
      });

      // Final safety check
      const safeResult = result.map((value) => {
        if (value < 0 || !isFinite(value) || isNaN(value)) {
          return 0;
        }
        return value;
      });

      return safeResult;
    });

    const initiativeInProgress = computed(() => {
      const result = initiativesWithRelativeValues.value.map((initiative) => {
        const value = Math.max(
          0,
          Math.min(100, Math.abs(initiative.inprogressOnTrack || 0)),
        );
        if (value < 0 || isNaN(value) || !isFinite(value)) {
          return 0;
        }
        return value;
      });

      // Final safety check
      const safeResult = result.map((value) => {
        if (value < 0 || !isFinite(value) || isNaN(value)) {
          return 0;
        }
        return value;
      });

      return safeResult;
    });

    const initiativeLengthClass = () => {
      let initiativeClass = {};
      initiativeClass[
        "global-initiatives__details-" + summarizedInitiatives.value.length
      ] = true;
      if (summarizedInitiatives.value.length > 4)
        initiativeClass["global-initiatives__details-gt4"] = true;
      return initiativeClass;
    };

    return {
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
