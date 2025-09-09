export const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'inprogress',
  DONE: 'done',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  REPLANNED: 'replanned'
}

export default class AreaData {

  cycle = {
    name: "",
    start: "1975-01-01",
    delivery: "1975-01-01",
    end: "1975-01-01",
    progress: 0,
    progressWithInProgress: 0,
    progressByReleaseItems: 0,
    weeks: 0,
    weeksDone: 0,
    weeksInProgress: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    releaseItemsCount: 0,
    releaseItemsDoneCount: 0,
    percentageNotToDo: 0
  }

  objectives = []

  constructor({ cycle, objectives } = {}) {
    if (cycle) this.cycle = cycle
    if (objectives) this.objectives = objectives
  }

  applyData(data) {
    Object.assign(this.cycle, data.cycle)

    this.objectives = data.objectives.map((objective) => {
      let preparedObjective = {
        name: objective.objective,
        theme: objective.theme,
        initiative: objective.initiative,
        initiativeId: objective.initiativeId,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
        roadmapItems: []
      }

      preparedObjective.roadmapItems = objective.roadmapItems.map((roadmapItem) => {
        let preparedRoadmapItem = {
          area: roadmapItem.area,
          name: roadmapItem.name,
          owner: roadmapItem.crew,
          ticketId: roadmapItem.projectId,
          validations: roadmapItem.validations,
          aggregatedValidations: [roadmapItem.validations, roadmapItem.releaseItems.map(releaseItem => releaseItem.validations).flat()].flat(),
          startDate: roadmapItem.startDate,
          releaseItemsCount: 0,
          releaseItemsDoneCount: 0,
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByReleaseItems: 0,
          percentageNotToDo: 0,
          releaseItems: roadmapItem.releaseItems,
          url: roadmapItem.url,
          isPartOfReleaseNarrative: roadmapItem.isPartOfReleaseNarrative,
          isReleaseAtRisk: roadmapItem.isReleaseAtRisk,
          isCrossCloud: roadmapItem.isCrossCloud
        }

        roadmapItem.releaseItems.forEach((releaseItem) => {
          let effort = parseFloat(releaseItem.effort)

          if (releaseItem.status != STATUS.REPLANNED) {
            preparedRoadmapItem.weeks += effort
            preparedRoadmapItem.releaseItemsCount += 1
          }

          if (releaseItem.status == STATUS.TODO) {
            preparedRoadmapItem.weeksTodo += releaseItem.effort
          } else if (releaseItem.status == STATUS.DONE) {
            preparedRoadmapItem.weeksDone += releaseItem.effort
            preparedRoadmapItem.releaseItemsDoneCount += 1
          } else if (releaseItem.status == STATUS.IN_PROGRESS) {
            preparedRoadmapItem.weeksInProgress += releaseItem.effort
          } else if (releaseItem.status == STATUS.POSTPONED) {
            preparedRoadmapItem.weeksNotToDo += releaseItem.effort
            preparedRoadmapItem.weeksPostponed += releaseItem.effort
          } else if (releaseItem.status == STATUS.CANCELLED) {
            preparedRoadmapItem.weeksNotToDo += releaseItem.effort
            preparedRoadmapItem.weeksCancelled += releaseItem.effort
          }
        })
        preparedRoadmapItem.weeks = this.roundToTwoDigit(preparedRoadmapItem.weeks);
        preparedRoadmapItem.progress = Math.round((preparedRoadmapItem.weeksDone / preparedRoadmapItem.weeks) * 100) || 0
        preparedRoadmapItem.progressWithInProgress = Math.round(((preparedRoadmapItem.weeksDone + preparedRoadmapItem.weeksInProgress) / preparedRoadmapItem.weeks) * 100) || 0
        preparedRoadmapItem.progressByReleaseItems = Math.round((preparedRoadmapItem.releaseItemsDoneCount / preparedRoadmapItem.releaseItemsCount) * 100) || 0
        preparedRoadmapItem.percentageNotToDo = Math.round((preparedRoadmapItem.weeksNotToDo / preparedRoadmapItem.weeks) * 100) || 0

        preparedObjective.weeks = this.normalize(preparedObjective.weeks + preparedRoadmapItem.weeks)
        preparedObjective.weeksDone = this.normalize(preparedObjective.weeksDone + preparedRoadmapItem.weeksDone)
        preparedObjective.weeksInProgress = this.normalize(preparedObjective.weeksInProgress + preparedRoadmapItem.weeksInProgress)
        preparedObjective.weeksTodo = this.normalize(preparedObjective.weeksTodo + preparedRoadmapItem.weeksTodo)
        preparedObjective.weeksNotToDo = this.normalize(preparedObjective.weeksNotToDo + preparedRoadmapItem.weeksNotToDo)
        preparedObjective.weeksCancelled = this.normalize(preparedObjective.weeksCancelled + preparedRoadmapItem.weeksCancelled)
        preparedObjective.weeksPostponed = this.normalize(preparedObjective.weeksPostponed + preparedRoadmapItem.weeksPostponed)

        preparedObjective.releaseItemsCount += preparedRoadmapItem.releaseItemsCount
        preparedObjective.releaseItemsDoneCount += preparedRoadmapItem.releaseItemsDoneCount

        return preparedRoadmapItem
      })

      this.cycle.weeks = this.normalize(this.cycle.weeks + preparedObjective.weeks)
      this.cycle.weeksDone = this.normalize(this.cycle.weeksDone + preparedObjective.weeksDone)
      this.cycle.weeksInProgress = this.normalize(this.cycle.weeksInProgress + preparedObjective.weeksInProgress)
      this.cycle.weeksTodo = this.normalize(this.cycle.weeksTodo + preparedObjective.weeksTodo)
      this.cycle.weeksNotToDo = this.normalize(this.cycle.weeksNotToDo + preparedObjective.weeksNotToDo)
      this.cycle.weeksCancelled = this.normalize(this.cycle.weeksCancelled + preparedObjective.weeksCancelled)
      this.cycle.weeksPostponed = this.normalize(this.cycle.weeksPostponed + preparedObjective.weeksPostponed)

      this.cycle.releaseItemsCount += preparedObjective.releaseItemsCount
      this.cycle.releaseItemsDoneCount += preparedObjective.releaseItemsDoneCount

      preparedObjective.progress = Math.round((preparedObjective.weeksDone / preparedObjective.weeks) * 100) || 0
      preparedObjective.progressWithInProgress = Math.round(((preparedObjective.weeksDone + preparedObjective.weeksInProgress) / preparedObjective.weeks) * 100) || 0
      preparedObjective.progressByReleaseItems = Math.round((preparedObjective.releaseItemsDoneCount / preparedObjective.releaseItemsCount) * 100) || 0
      preparedObjective.percentageNotToDo = Math.round((preparedObjective.weeksNotToDo / preparedObjective.weeks) * 100) || 0

      return preparedObjective
    })

    this.objectives = [...this.objectives].sort((objectiveA, objectiveB) => { return objectiveA.weeks < objectiveB.weeks ? 1 : -1 })

    this.cycle.progress = Math.round((this.cycle.weeksDone / this.cycle.weeks) * 100) || 0
    this.cycle.progressWithInProgress = Math.round(((this.cycle.weeksDone + this.cycle.weeksInProgress) / this.cycle.weeks) * 100) || 0
    this.cycle.progressByReleaseItems = Math.round((this.cycle.releaseItemsDoneCount / this.cycle.releaseItemsCount) * 100) || 0
    this.cycle.percentageNotToDo = Math.round((this.cycle.weeksNotToDo / this.cycle.weeks) * 100) || 0

    this.cycle.startMonth = new Date(this.cycle.delivery).toLocaleString('en-us', { month: 'short' })
    this.cycle.endMonth = new Date(this.cycle.end).toLocaleString('en-us', { month: 'short' })
    this.cycle.daysFromStartOfCycle = Math.floor(Math.abs(new Date(this.cycle.delivery) - new Date()) / 1000 / 86400)
    this.cycle.daysInCycle = Math.floor(Math.abs(new Date(this.cycle.delivery) - new Date(this.cycle.end)) / 1000 / 86400)
    this.cycle.currentDayPercentage = Math.round((this.cycle.daysFromStartOfCycle / this.cycle.daysInCycle) * 100)
    if (this.cycle.currentDayPercentage > 100) this.cycle.currentDayPercentage = 100

    return this
  }

  normalize(number) {
    return Math.round(number*10)/10
  }

  roundToTwoDigit(number) {
    return Math.round(number * 100) / 100
  }
}
