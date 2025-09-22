import { STATUS } from "@/lib/constants/status-constants";

export default class CycleProgressData {
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
    percentageNotToDo: 0,
  };

  initiatives = [];

  constructor({ cycle, initiatives } = {}) {
    if (cycle) this.cycle = cycle;
    if (initiatives) this.initiatives = initiatives;
  }

  applyData(data) {
    Object.assign(this.cycle, data.cycle);

    this.initiatives = data.initiatives.map((initiative) => {
      let preparedInitiative = {
        name: initiative.initiative,
        initiative: initiative.initiative,
        initiativeId: initiative.initiativeId,
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
        roadmapItems: [],
      };

      preparedInitiative.roadmapItems = initiative.roadmapItems.map(
        (roadmapItem) => {
          let preparedRoadmapItem = {
            area: roadmapItem.area,
            name: roadmapItem.name,
            owner: roadmapItem.crew,
            ticketId: roadmapItem.projectId,
            validations: roadmapItem.validations,
            aggregatedValidations: [
              roadmapItem.validations,
              roadmapItem.releaseItems
                .map((releaseItem) => releaseItem.validations)
                .flat(),
            ].flat(),
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
            isCrossCloud: roadmapItem.isCrossCloud,
          };

          roadmapItem.releaseItems.forEach((releaseItem) => {
            let effort = parseFloat(releaseItem.effort);

            if (releaseItem.status != STATUS.REPLANNED) {
              preparedRoadmapItem.weeks += effort;
              preparedRoadmapItem.releaseItemsCount += 1;
            }

            if (releaseItem.status == STATUS.TODO) {
              preparedRoadmapItem.weeksTodo += releaseItem.effort;
            } else if (releaseItem.status == STATUS.DONE) {
              preparedRoadmapItem.weeksDone += releaseItem.effort;
              preparedRoadmapItem.releaseItemsDoneCount += 1;
            } else if (releaseItem.status == STATUS.IN_PROGRESS) {
              preparedRoadmapItem.weeksInProgress += releaseItem.effort;
            } else if (releaseItem.status == STATUS.POSTPONED) {
              preparedRoadmapItem.weeksNotToDo += releaseItem.effort;
              preparedRoadmapItem.weeksPostponed += releaseItem.effort;
            } else if (releaseItem.status == STATUS.CANCELLED) {
              preparedRoadmapItem.weeksNotToDo += releaseItem.effort;
              preparedRoadmapItem.weeksCancelled += releaseItem.effort;
            }
          });
          preparedRoadmapItem.weeks = this.roundToTwoDigit(
            preparedRoadmapItem.weeks,
          );
          preparedRoadmapItem.progress =
            Math.round(
              (preparedRoadmapItem.weeksDone / preparedRoadmapItem.weeks) * 100,
            ) || 0;
          preparedRoadmapItem.progressWithInProgress =
            Math.round(
              ((preparedRoadmapItem.weeksDone +
                preparedRoadmapItem.weeksInProgress) /
                preparedRoadmapItem.weeks) *
                100,
            ) || 0;
          preparedRoadmapItem.progressByReleaseItems =
            Math.round(
              (preparedRoadmapItem.releaseItemsDoneCount /
                preparedRoadmapItem.releaseItemsCount) *
                100,
            ) || 0;
          preparedRoadmapItem.percentageNotToDo =
            Math.round(
              (preparedRoadmapItem.weeksNotToDo / preparedRoadmapItem.weeks) *
                100,
            ) || 0;

          preparedInitiative.weeks = this.normalize(
            preparedInitiative.weeks + preparedRoadmapItem.weeks,
          );
          preparedInitiative.weeksDone = this.normalize(
            preparedInitiative.weeksDone + preparedRoadmapItem.weeksDone,
          );
          preparedInitiative.weeksInProgress = this.normalize(
            preparedInitiative.weeksInProgress +
              preparedRoadmapItem.weeksInProgress,
          );
          preparedInitiative.weeksTodo = this.normalize(
            preparedInitiative.weeksTodo + preparedRoadmapItem.weeksTodo,
          );
          preparedInitiative.weeksNotToDo = this.normalize(
            preparedInitiative.weeksNotToDo + preparedRoadmapItem.weeksNotToDo,
          );
          preparedInitiative.weeksCancelled = this.normalize(
            preparedInitiative.weeksCancelled +
              preparedRoadmapItem.weeksCancelled,
          );
          preparedInitiative.weeksPostponed = this.normalize(
            preparedInitiative.weeksPostponed +
              preparedRoadmapItem.weeksPostponed,
          );

          preparedInitiative.releaseItemsCount +=
            preparedRoadmapItem.releaseItemsCount;
          preparedInitiative.releaseItemsDoneCount +=
            preparedRoadmapItem.releaseItemsDoneCount;

          return preparedRoadmapItem;
        },
      );

      this.cycle.weeks = this.normalize(
        this.cycle.weeks + preparedInitiative.weeks,
      );
      this.cycle.weeksDone = this.normalize(
        this.cycle.weeksDone + preparedInitiative.weeksDone,
      );
      this.cycle.weeksInProgress = this.normalize(
        this.cycle.weeksInProgress + preparedInitiative.weeksInProgress,
      );
      this.cycle.weeksTodo = this.normalize(
        this.cycle.weeksTodo + preparedInitiative.weeksTodo,
      );
      this.cycle.weeksNotToDo = this.normalize(
        this.cycle.weeksNotToDo + preparedInitiative.weeksNotToDo,
      );
      this.cycle.weeksCancelled = this.normalize(
        this.cycle.weeksCancelled + preparedInitiative.weeksCancelled,
      );
      this.cycle.weeksPostponed = this.normalize(
        this.cycle.weeksPostponed + preparedInitiative.weeksPostponed,
      );

      this.cycle.releaseItemsCount += preparedInitiative.releaseItemsCount;
      this.cycle.releaseItemsDoneCount +=
        preparedInitiative.releaseItemsDoneCount;

      preparedInitiative.progress =
        Math.round(
          (preparedInitiative.weeksDone / preparedInitiative.weeks) * 100,
        ) || 0;
      preparedInitiative.progressWithInProgress =
        Math.round(
          ((preparedInitiative.weeksDone + preparedInitiative.weeksInProgress) /
            preparedInitiative.weeks) *
            100,
        ) || 0;
      preparedInitiative.progressByReleaseItems =
        Math.round(
          (preparedInitiative.releaseItemsDoneCount /
            preparedInitiative.releaseItemsCount) *
            100,
        ) || 0;
      preparedInitiative.percentageNotToDo =
        Math.round(
          (preparedInitiative.weeksNotToDo / preparedInitiative.weeks) * 100,
        ) || 0;

      return preparedInitiative;
    });

    this.initiatives = [...this.initiatives].sort(
      (initiativeA, initiativeB) => {
        return initiativeA.weeks < initiativeB.weeks ? 1 : -1;
      },
    );

    this.cycle.progress =
      Math.round((this.cycle.weeksDone / this.cycle.weeks) * 100) || 0;
    this.cycle.progressWithInProgress =
      Math.round(
        ((this.cycle.weeksDone + this.cycle.weeksInProgress) /
          this.cycle.weeks) *
          100,
      ) || 0;
    this.cycle.progressByReleaseItems =
      Math.round(
        (this.cycle.releaseItemsDoneCount / this.cycle.releaseItemsCount) * 100,
      ) || 0;
    this.cycle.percentageNotToDo =
      Math.round((this.cycle.weeksNotToDo / this.cycle.weeks) * 100) || 0;

    this.cycle.startMonth = new Date(this.cycle.delivery).toLocaleString(
      "en-us",
      { month: "short" },
    );
    this.cycle.endMonth = new Date(this.cycle.end).toLocaleString("en-us", {
      month: "short",
    });
    this.cycle.daysFromStartOfCycle = Math.floor(
      Math.abs(new Date(this.cycle.delivery) - new Date()) / 1000 / 86400,
    );
    this.cycle.daysInCycle = Math.floor(
      Math.abs(new Date(this.cycle.delivery) - new Date(this.cycle.end)) /
        1000 /
        86400,
    );
    this.cycle.currentDayPercentage = Math.round(
      (this.cycle.daysFromStartOfCycle / this.cycle.daysInCycle) * 100,
    );
    if (this.cycle.currentDayPercentage > 100)
      this.cycle.currentDayPercentage = 100;

    return this;
  }

  normalize(number) {
    return Math.round(number * 10) / 10;
  }

  roundToTwoDigit(number) {
    return Math.round(number * 100) / 100;
  }
}
