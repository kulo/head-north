import AreaData from "./areaData.js";

const uniq = (list) => [...new Set(list)];

const filterReleaseItems = (releaseItemPredicate) => (roadmapItem) => {
  return {
    ...roadmapItem,
    releaseItems: roadmapItem.releaseItems.filter(releaseItemPredicate)
  };
};

const hasReleaseItems = (roadmapItem) => roadmapItem.releaseItems.length !== 0;
const hasRoadmapItems = (objective) => objective.roadmapItems.length !== 0;

const recalculateReleaseItemBasedFields = (areaTranslation) => (roadmapItem) => {
  const areaIds = roadmapItem.releaseItems.map(releaseItem => releaseItem.areaIds).flat();
  const teams = roadmapItem.releaseItems.map(releaseItem => releaseItem.teams).flat();
  return {
    ...roadmapItem,
    crew: uniq(teams).join(', '),
    area: uniq(areaIds).map(id => areaTranslation[id]).join(', ')
  };
};

const filterRoadmapItems = (releaseItemPredicate, areaTranslation) => (objective) => {
  const roadmapItems = objective.roadmapItems
    .map(filterReleaseItems(releaseItemPredicate))
    .filter(hasReleaseItems)
    .map(recalculateReleaseItemBasedFields(areaTranslation));

  return { ...objective, roadmapItems };
};

const createPredicates = (areaMapping, predicate) => {
  const predicates = Object.keys(areaMapping).map(area => {
    return { id: area, releaseItemPredicate: createAreaPredicate(area, predicate) };
  });
  return predicates.concat({ id: 'overview', releaseItemPredicate: predicate });
}

const createAreaPredicate = (area, predicate) => {
  return (releaseItem) => releaseItem.areaIds.includes(area) && predicate(releaseItem);
}

export const calculateAreaData = 
  (cycleData, releaseItemPredicate = () => true, objectivePredicate = () => true) => {
  const areaMapping = cycleData.area;
  const predicates = createPredicates(areaMapping, releaseItemPredicate);

  const areaData = {};
  for(const { id, releaseItemPredicate } of predicates) {
    const objectives = cycleData.objectives
      .filter(objectivePredicate)
      .map(filterRoadmapItems(releaseItemPredicate, areaMapping))
      .filter(hasRoadmapItems);

    if(objectives.length !== 0) {
      areaData[id] = new AreaData().applyData({ ...cycleData, objectives });
    }
  }

  return areaData;
};
