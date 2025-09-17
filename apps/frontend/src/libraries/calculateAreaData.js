import AreaData from "./areaData.js";

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

export const calculateAreaData = 
  (unifiedData, releaseItemPredicate = () => true, initiativePredicate = () => true) => {
  // Extract data from unified structure
  const initiatives = unifiedData.data?.initiatives || {};
  const organisation = unifiedData.metadata?.organisation || {};
  const areas = organisation.areas || {};
  
  // Convert initiatives object to array format
  const initiativesArray = Object.entries(initiatives).map(([id, initiativeData]) => ({
    id,
    initiative: initiativeData.initiative,
    initiativeId: initiativeData.initiativeId,
    roadmapItems: initiativeData.roadmapItems || []
  }));

  // Convert areas to mapping format for backward compatibility
  const areaMapping = Object.entries(areas).reduce((acc, [id, areaData]) => {
    acc[id] = areaData.name || id;
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
      areaData[id] = new AreaData().applyData({ 
        ...unifiedData, 
        initiatives: filteredInitiatives 
      });
    }
  }

  return areaData;
};
