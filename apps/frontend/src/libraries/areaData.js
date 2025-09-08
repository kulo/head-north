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
    progressByEpics: 0,
    weeks: 0,
    weeksDone: 0,
    weeksInProgress: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    epicsCount: 0,
    epicsDoneCount: 0,
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
        epicsCount: 0,
        epicsDoneCount: 0,
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByEpics: 0,
        percentageNotToDo: 0,
        projects: []
      }

      preparedObjective.projects = objective.projects.map((project) => {
        let preparedProject = {
          area: project.area,
          name: project.name,
          owner: project.crew,
          ticketId: project.projectId,
          validations: project.validations,
          aggregatedValidations: [project.validations, project.epics.map(epic => epic.validations).flat()].flat(),
          startDate: project.startDate,
          epicsCount: 0,
          epicsDoneCount: 0,
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByEpics: 0,
          percentageNotToDo: 0,
          epics: project.epics,
          url: project.url,
          isPartOfReleaseNarrative: project.isPartOfReleaseNarrative,
          isReleaseAtRisk: project.isReleaseAtRisk,
          isCrossCloud: project.isCrossCloud
        }

        project.epics.forEach((epic) => {
          let effort = parseFloat(epic.effort)

          if (epic.status != STATUS.REPLANNED) {
            preparedProject.weeks += effort
            preparedProject.epicsCount += 1
          }

          if (epic.status == STATUS.TODO) {
            preparedProject.weeksTodo += epic.effort
          } else if (epic.status == STATUS.DONE) {
            preparedProject.weeksDone += epic.effort
            preparedProject.epicsDoneCount += 1
          } else if (epic.status == STATUS.IN_PROGRESS) {
            preparedProject.weeksInProgress += epic.effort
          } else if (epic.status == STATUS.POSTPONED) {
            preparedProject.weeksNotToDo += epic.effort
            preparedProject.weeksPostponed += epic.effort
          } else if (epic.status == STATUS.CANCELLED) {
            preparedProject.weeksNotToDo += epic.effort
            preparedProject.weeksCancelled += epic.effort
          }
        })
        preparedProject.weeks = this.roundToTwoDigit(preparedProject.weeks);
        preparedProject.progress = Math.round((preparedProject.weeksDone / preparedProject.weeks) * 100) || 0
        preparedProject.progressWithInProgress = Math.round(((preparedProject.weeksDone + preparedProject.weeksInProgress) / preparedProject.weeks) * 100) || 0
        preparedProject.progressByEpics = Math.round((preparedProject.epicsDoneCount / preparedProject.epicsCount) * 100) || 0
        preparedProject.percentageNotToDo = Math.round((preparedProject.weeksNotToDo / preparedProject.weeks) * 100) || 0

        preparedObjective.weeks = this.normalize(preparedObjective.weeks + preparedProject.weeks)
        preparedObjective.weeksDone = this.normalize(preparedObjective.weeksDone + preparedProject.weeksDone)
        preparedObjective.weeksInProgress = this.normalize(preparedObjective.weeksInProgress + preparedProject.weeksInProgress)
        preparedObjective.weeksTodo = this.normalize(preparedObjective.weeksTodo + preparedProject.weeksTodo)
        preparedObjective.weeksNotToDo = this.normalize(preparedObjective.weeksNotToDo + preparedProject.weeksNotToDo)
        preparedObjective.weeksCancelled = this.normalize(preparedObjective.weeksCancelled + preparedProject.weeksCancelled)
        preparedObjective.weeksPostponed = this.normalize(preparedObjective.weeksPostponed + preparedProject.weeksPostponed)

        preparedObjective.epicsCount += preparedProject.epicsCount
        preparedObjective.epicsDoneCount += preparedProject.epicsDoneCount

        return preparedProject
      })

      this.cycle.weeks = this.normalize(this.cycle.weeks + preparedObjective.weeks)
      this.cycle.weeksDone = this.normalize(this.cycle.weeksDone + preparedObjective.weeksDone)
      this.cycle.weeksInProgress = this.normalize(this.cycle.weeksInProgress + preparedObjective.weeksInProgress)
      this.cycle.weeksTodo = this.normalize(this.cycle.weeksTodo + preparedObjective.weeksTodo)
      this.cycle.weeksNotToDo = this.normalize(this.cycle.weeksNotToDo + preparedObjective.weeksNotToDo)
      this.cycle.weeksCancelled = this.normalize(this.cycle.weeksCancelled + preparedObjective.weeksCancelled)
      this.cycle.weeksPostponed = this.normalize(this.cycle.weeksPostponed + preparedObjective.weeksPostponed)

      this.cycle.epicsCount += preparedObjective.epicsCount
      this.cycle.epicsDoneCount += preparedObjective.epicsDoneCount

      preparedObjective.progress = Math.round((preparedObjective.weeksDone / preparedObjective.weeks) * 100) || 0
      preparedObjective.progressWithInProgress = Math.round(((preparedObjective.weeksDone + preparedObjective.weeksInProgress) / preparedObjective.weeks) * 100) || 0
      preparedObjective.progressByEpics = Math.round((preparedObjective.epicsDoneCount / preparedObjective.epicsCount) * 100) || 0
      preparedObjective.percentageNotToDo = Math.round((preparedObjective.weeksNotToDo / preparedObjective.weeks) * 100) || 0

      return preparedObjective
    })

    this.objectives = [...this.objectives].sort((objectiveA, objectiveB) => { return objectiveA.weeks < objectiveB.weeks ? 1 : -1 })

    this.cycle.progress = Math.round((this.cycle.weeksDone / this.cycle.weeks) * 100) || 0
    this.cycle.progressWithInProgress = Math.round(((this.cycle.weeksDone + this.cycle.weeksInProgress) / this.cycle.weeks) * 100) || 0
    this.cycle.progressByEpics = Math.round((this.cycle.epicsDoneCount / this.cycle.epicsCount) * 100) || 0
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
