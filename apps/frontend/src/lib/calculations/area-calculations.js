import CycleProgressData from "../models/area-data.js";

const uniq = (list) => [...new Set(list)];

const filterReleaseItems = (releaseItemPredicate) => (roadmapItem) => {
  return {
    ...roadmapItem,
    releaseItems: roadmapItem.releaseItems.filter(releaseItemPredicate)
  };
};

const hasReleaseItems = (roadmapItem) => roadmapItem.releaseItems.length !== 0;
const hasRoadmapItems = (initiative) => initiative.roadmapItems.length !== 0;

const recalculateReleaseItemBasedFields = (areaTranslation) => (roadmapItem) => {
  const areaIds = roadmapItem.releaseItems.map(releaseItem => releaseItem.areaIds).flat();
  const teams = roadmapItem.releaseItems.map(releaseItem => releaseItem.teams).flat();
  return {
    ...roadmapItem,
    crew: uniq(teams).join(', '),
    area: uniq(areaIds).map(id => areaTranslation[id]).join(', ')
  };
};

const filterRoadmapItems = (releaseItemPredicate, areaTranslation) => (initiative) => {
  const roadmapItems = initiative.roadmapItems
    .map(filterReleaseItems(releaseItemPredicate))
    .filter(hasReleaseItems)
    .map(recalculateReleaseItemBasedFields(areaTranslation));

  return { ...initiative, roadmapItems };
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

export const calculateCycleProgressData = 
  (unifiedData, releaseItemPredicate = () => true, initiativePredicate = () => true) => {
  // Extract data from unified structure - both initiatives and areas are now arrays
  const initiativesArray = unifiedData.data?.initiatives || [];
  const organisation = unifiedData.metadata?.organisation || {};
  const areas = organisation.areas || [];
  
  // Convert areas array to mapping format for backward compatibility
  const areaMapping = areas.reduce((acc, area) => {
    acc[area.id] = area.name || area.id;
    return acc;
  }, {});

  const predicates = createPredicates(areaMapping, releaseItemPredicate);

  const areaData = {};
  for(const { id, releaseItemPredicate } of predicates) {
    const filteredInitiatives = initiativesArray
      .filter(initiativePredicate)
      .map(filterRoadmapItems(releaseItemPredicate, areaMapping))
      .filter(hasRoadmapItems);

    if(filteredInitiatives.length !== 0) {
      areaData[id] = new CycleProgressData().applyData({ 
        ...unifiedData, 
        initiatives: filteredInitiatives 
      });
    }
  }

  return areaData;
};
