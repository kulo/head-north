<template>
  <div class="global-objectives__container">
    <div
      class="global-objectives__chart-container"
      style="transform: rotateY(180deg) rotateX(180deg)">
      <apexchart
        class="global-objectives__chart global-objectives__chart_background"
        type="radialBar"
        height="100%"
        :options="options2"
        :series="objectiveTracks"></apexchart>
      <apexchart
        class="global-objectives__chart"
        type="radialBar"
        height="100%"
        :options="inProgressOptions"
        :series="objectiveInProgress"></apexchart>
      <apexchart
        class="global-objectives__chart"
        type="radialBar"
        height="100%"
        :options="options1"
        :series="objectiveProgresses"></apexchart>
    </div>
    <div class="global-objectives__details" :class="objectiveLengthClass()">
      <div>
        <div class="global-objectives__detail" v-for="objective in objectivesWithRelativeValues" :key="objective.name">
          <div class="global-objectives__detail__progress">{{ objective.progress }}%
            <div class="global-objectives__detail__weeks"><strong>{{ objective.weeksDone }}</strong> of {{ objective.weeks }} weeks</div></div>
          <div class="global-objectives__detail__name" v-if="objective.theme">
            <span class="theme-pill">{{ objective.theme }}</span>
            <span class="initiative">{{ objective.initiative }}</span>
          </div>
          <div class="global-objectives__detail__name" v-if="!objective.theme">
            <span class="initiative without-theme">{{ objective.initiative }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

const deepCopy = function(src) {
  return JSON.parse(JSON.stringify(src));
}

const sortObjectives = (objectives) => {
  return deepCopy(objectives).sort((obj1, obj2) => obj2.weeks - obj1.weeks)
}

export default {
  name: "objective-chart",
  props: {
    objectives: {
      type: Array,
      required: true
    }
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
            margin: 5
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
              opacity: 1
            }
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              show: false
            }
          }
        }
      },
      colors: ['var(--color-highlight)', 'var(--color-info)', 'var(--color-gray-500)', 'var(--color-gray-600)', 'var(--color-gray-600)', 'var(--color-gray-500)', 'var(--color-warning)', 'var(--color-gray-300)'],
      fill: {
        opacity: 1
      }
    }

    const options2Default = {
      chart: {
        animations: {
          enabled: false
        }
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
            margin: 5
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
              opacity: 1
            }
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              show: false
            }
          }
        }
      },
      colors: ['var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)', 'var(--color-gray-700)'],
      fill: {
        opacity: 1
      }
    }

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
            margin: 5
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
              opacity: 1
            }
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              show: false
            }
          }
        }
      },
      colors: ['var(--color-highlight)', 'var(--color-info)', 'var(--color-gray-500)', 'var(--color-gray-600)', 'var(--color-gray-600)', 'var(--color-gray-500)', 'var(--color-warning)', 'var(--color-gray-300)'],
      fill: {
        opacity: 0.3
      }
    }

    const summarizedObjectives = computed(() => {
      const maxObjectivesOnPage = 8;
      if(props.objectives.length <= maxObjectivesOnPage) {
        return props.objectives
      }

      const sortedObjectives = sortObjectives(props.objectives)
      const headObjectives = sortedObjectives.slice(0, maxObjectivesOnPage - 1)
      const tailObjectives = sortedObjectives.slice(maxObjectivesOnPage - 1)
      const defaultOtherObjective = {
        name: 'Other Projects',
        initiative: 'Other Projects',
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0
      }

      const summarizedOtherObjective = tailObjectives.reduce((acc, obj) => {
        acc.weeks += obj.weeks
        acc.weeksDone += obj.weeksDone
        acc.weeksInProgress += obj.weeksInProgress
        return acc
      }, defaultOtherObjective)

      const progressRate = summarizedOtherObjective.weeksDone / summarizedOtherObjective.weeks;
      summarizedOtherObjective.progress = Math.round(progressRate * 100) || 0;

      const inprogressRate = (summarizedOtherObjective.weeksDone + summarizedOtherObjective.weeksInProgress) / summarizedOtherObjective.weeks;
      summarizedOtherObjective.progressWithInProgress = Math.round(inprogressRate * 100) || 0;

      return sortObjectives(headObjectives.concat(summarizedOtherObjective))
    })

    const options1 = computed(() => {
      let options = deepCopy(options1Default)
      if (summarizedObjectives.value.length > 4) options.plotOptions.radialBar.hollow.size = '15%'
      return options
    })

    const options2 = computed(() => {
      let options = deepCopy(options2Default)
      if (summarizedObjectives.value.length > 4) options.plotOptions.radialBar.hollow.size = '15%'
      return options;
    })

    const inProgressOptions = computed(() => {
      let options = deepCopy(inProgressOptionsDefault)
      if (summarizedObjectives.value.length > 4) options.plotOptions.radialBar.hollow.size = '15%'
      return options;
    })

    const objectivesWithRelativeValues = computed(() => {
      let objectives = summarizedObjectives.value.map(objective => {
        return {
          name: objective.name,
          theme: objective.theme,
          initiative: objective.initiative,
          weeks: objective.weeks,
          weeksDone: objective.weeksDone,
          progress: objective.progress,
          progressWithInProgress: objective.progressWithInProgress
        }
      })

      let longestObjective = objectives[0]

      return objectives.map((objective, i) => {
        let relativeModifierToLongest = objective.weeks / longestObjective.weeks;
        let trackLength = Math.ceil(relativeModifierToLongest * 100 * 1.1) ||  0;

        if (trackLength < 10) trackLength *= 2.3;
        else if (trackLength < 30) trackLength *= 1.1;
        else if (trackLength < 80) trackLength *= 1.15;

        if (trackLength > 100) trackLength = 100;
        let progressOnTrack = Math.ceil((objective.progress / 100) * trackLength) || 0;
        let inprogressOnTrack = Math.ceil((objective.progressWithInProgress / 100) * trackLength) || 0;

        return {
          name: objective.name,
          theme: objective.theme,
          initiative: objective.initiative,
          weeks: objective.weeks,
          weeksDone: objective.weeksDone,
          progress: objective.progress,
          trackLength,
          progressOnTrack,
          inprogressOnTrack
        }
      })
    })

    const objectiveTracks = computed(() => {
      return objectivesWithRelativeValues.value.map(
        objective => objective.trackLength
      )
    })

    const objectiveProgresses = computed(() => {
      return objectivesWithRelativeValues.value.map(
        objective => objective.progressOnTrack
      )
    })

    const objectiveInProgress = computed(() => {
      return objectivesWithRelativeValues.value.map(
        objective => objective.inprogressOnTrack
      )
    })

    const objectiveLengthClass = () => {
      let objectiveClass = {}
      objectiveClass['global-objectives__details-' + summarizedObjectives.value.length] = true
      if (summarizedObjectives.value.length > 4) objectiveClass['global-objectives__details-gt4'] = true
      return objectiveClass
    }

    return {
      options1,
      options2,
      inProgressOptions,
      objectiveTracks,
      objectiveProgresses,
      objectiveInProgress,
      objectivesWithRelativeValues,
      objectiveLengthClass
    }
  }
}
</script>
