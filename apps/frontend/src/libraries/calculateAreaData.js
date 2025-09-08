import AreaData from "./areaData.js";

const uniq = (list) => [...new Set(list)];

const filterEpics = (epicPredicate) => (project) => {
  return {
    ...project,
    epics: project.epics.filter(epicPredicate)
  };
};

const hasEpics = (project) => project.epics.length !== 0;
const hasProjects = (objective) => objective.projects.length !== 0;

const recalculateEpicBasedFields = (areaTranslation) => (project) => {
  const areaIds = project.epics.map(epic => epic.areaIds).flat();
  const teams = project.epics.map(epic => epic.teams).flat();
  return {
    ...project,
    crew: uniq(teams).join(', '),
    area: uniq(areaIds).map(id => areaTranslation[id]).join(', ')
  };
};

const filterProjects = (epicPredicate, areaTranslation) => (objective) => {
  const projects = objective.projects
    .map(filterEpics(epicPredicate))
    .filter(hasEpics)
    .map(recalculateEpicBasedFields(areaTranslation));

  return { ...objective, projects };
};

const createPredicates = (areaMapping, predicate) => {
  const predicates = Object.keys(areaMapping).map(area => {
    return { id: area, epicPredicate: createAreaPredicate(area, predicate) };
  });
  return predicates.concat({ id: 'overview', epicPredicate: predicate });
}

const createAreaPredicate = (area, predicate) => {
  return (epic) => epic.areaIds.includes(area) && predicate(epic);
}

export const calculateAreaData = (cycleData, epicPredicate = () => true, objectivePredicate = () => true) => {
  const areaMapping = cycleData.area;
  const predicates = createPredicates(areaMapping, epicPredicate);

  const areaData = {};
  for(const { id, epicPredicate } of predicates) {
    const objectives = cycleData.objectives
      .filter(objectivePredicate)
      .map(filterProjects(epicPredicate, areaMapping))
      .filter(hasProjects);

    if(objectives.length !== 0) {
      areaData[id] = new AreaData().applyData({ ...cycleData, objectives });
    }
  }

  return areaData;
};
