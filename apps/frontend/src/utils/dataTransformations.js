/**
 * Data transformation utilities for frontend
 * Handles all presentation logic and calculations that were moved from backend
 */

import pkg from 'lodash';
const { groupBy } = pkg;

/**
 * Calculate progress percentage for release items
 * @param {Array} releaseItems - Array of release items
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (releaseItems) => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return 0;
  }

  const completedItems = releaseItems.filter(ri => ri.status === 'done').length;
  const totalItems = releaseItems.length;
  
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

/**
 * Calculate total weeks from effort values
 * @param {Array} releaseItems - Array of release items
 * @returns {number} Total weeks
 */
export const calculateTotalWeeks = (releaseItems) => {
  if (!Array.isArray(releaseItems)) {
    return 0;
  }

  return releaseItems.reduce((sum, ri) => sum + (ri.effort || 0), 0);
};

/**
 * Get primary owner from release items
 * @param {Array} releaseItems - Array of release items
 * @returns {string} Primary owner name
 */
export const getPrimaryOwner = (releaseItems) => {
  if (!Array.isArray(releaseItems) || releaseItems.length === 0) {
    return 'Unassigned';
  }

  const lastItem = releaseItems[releaseItems.length - 1];
  return lastItem.assignee || 'Unassigned';
};

/**
 * Get cycle name by ID
 * @param {Array} cycles - Array of cycles
 * @param {string|number} cycleId - Cycle ID to look up
 * @returns {string} Cycle name
 */
export const getCycleName = (cycles, cycleId) => {
  if (!Array.isArray(cycles)) {
    return `Cycle ${cycleId}`;
  }

  const cycle = cycles.find(c => c.id === cycleId);
  return cycle ? cycle.name : `Cycle ${cycleId}`;
};

/**
 * Group roadmap items by initiative
 * @param {Array} roadmapItems - Array of roadmap items
 * @returns {Object} Grouped roadmap items by initiative ID
 */
export const groupRoadmapItemsByInitiative = (roadmapItems) => {
  if (!Array.isArray(roadmapItems)) {
    return {};
  }

  return groupBy(roadmapItems, item => item.initiativeId);
};

/**
 * Transform raw roadmap item for display
 * @param {Object} item - Raw roadmap item
 * @param {Array} cycles - Array of cycles for name lookup
 * @returns {Object} Transformed roadmap item
 */
export const transformRoadmapItem = (item, cycles) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  // Get all release items from sprints
  const allReleaseItems = item.sprints?.flatMap(sprint => sprint.releaseItems || []) || [];
  
  return {
    id: item.id,
    name: item.summary || item.name || `Roadmap Item ${item.id}`,
    area: item.area,
    theme: item.theme,
    owner: getPrimaryOwner(allReleaseItems),
    progress: calculateProgress(allReleaseItems),
    weeks: calculateTotalWeeks(allReleaseItems),
    url: item.url || `https://example.com/browse/${item.id}`,
    validations: item.validations || [],
    releaseItems: allReleaseItems.map(releaseItem => ({
      ...releaseItem,
      cycle: {
        id: item.sprints?.find(s => s.releaseItems?.includes(releaseItem))?.sprintId,
        name: getCycleName(cycles, item.sprints?.find(s => s.releaseItems?.includes(releaseItem))?.sprintId)
      }
    }))
  };
};

/**
 * Transform raw data for cycle overview view
 * @param {Object} rawData - Raw data from backend
 * @returns {Object} Transformed data for cycle overview
 */
export const transformForCycleOverview = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return { cycles: [], initiatives: [] };
  }

  const { cycles, roadmapItems, releaseItems, initiatives: configInitiatives } = rawData;
  
  // Convert initiatives array to lookup object
  const initiativesLookup = {};
  if (Array.isArray(configInitiatives)) {
    configInitiatives.forEach(init => {
      initiativesLookup[init.id] = init.name;
    });
  }
  
  // Group roadmap items by initiative
  const groupedInitiatives = {};
  
  roadmapItems.forEach(item => {
    const initiativeId = item.initiativeId || 'unassigned';
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        initiativeId,
        initiative: initiativesLookup[initiativeId] || initiativeId,
        roadmapItems: []
      };
    }
    
    // Find release items for this roadmap item using foreign key
    const itemReleaseItems = releaseItems.filter(ri => ri.roadmapItemId === item.id);
    
    groupedInitiatives[initiativeId].roadmapItems.push({
      id: item.id,
      name: item.summary || item.name || `Roadmap Item ${item.id}`,
      area: item.area,
      theme: item.theme,
      owner: getPrimaryOwner(itemReleaseItems),
      progress: calculateProgress(itemReleaseItems),
      weeks: calculateTotalWeeks(itemReleaseItems),
      url: item.url || `https://example.com/browse/${item.id}`,
      validations: item.validations || {},
      releaseItems: itemReleaseItems.map(releaseItem => ({
        ...releaseItem,
        cycle: releaseItem.cycle || {
          id: releaseItem.cycleId,
          name: getCycleName(cycles, releaseItem.cycleId)
        }
      }))
    });
  });

  return {
    cycles: cycles || [],
    initiatives: Object.values(groupedInitiatives)
  };
};

/**
 * Transform raw data for roadmap view
 * @param {Object} rawData - Raw data from backend
 * @returns {Object} Transformed data for roadmap
 */
export const transformForRoadmap = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return { initiatives: [] };
  }

  const { cycles, roadmapItems, releaseItems, initiatives: configInitiatives } = rawData;
  
  // Convert initiatives array to lookup object
  const initiativesLookup = {};
  if (Array.isArray(configInitiatives)) {
    configInitiatives.forEach(init => {
      initiativesLookup[init.id] = init.name;
    });
  }
  
  // Group roadmap items by initiative
  const groupedInitiatives = {};
  
  roadmapItems.forEach(item => {
    const initiativeId = item.initiativeId || 'unassigned';
    if (!groupedInitiatives[initiativeId]) {
      groupedInitiatives[initiativeId] = {
        initiativeId,
        initiative: initiativesLookup[initiativeId] || initiativeId,
        roadmapItems: []
      };
    }
    
    // Find release items for this roadmap item using foreign key
    const itemReleaseItems = releaseItems.filter(ri => ri.roadmapItemId === item.id);
    
    groupedInitiatives[initiativeId].roadmapItems.push({
      id: item.id,
      name: item.summary || item.name || `Roadmap Item ${item.id}`,
      area: item.area,
      theme: item.theme,
      owner: getPrimaryOwner(itemReleaseItems),
      progress: calculateProgress(itemReleaseItems),
      weeks: calculateTotalWeeks(itemReleaseItems),
      url: item.url || `https://example.com/browse/${item.id}`,
      validations: item.validations || {},
      releaseItems: itemReleaseItems.map(releaseItem => ({
        ...releaseItem,
        cycle: releaseItem.cycle || {
          id: releaseItem.cycleId,
          name: getCycleName(cycles, releaseItem.cycleId)
        }
      }))
    });
  });

  return {
    initiatives: Object.values(groupedInitiatives)
  };
};

/**
 * Calculate cycle progress based on release items
 * @param {Array} cycles - Array of cycles
 * @param {Array} releaseItems - Array of release items
 * @returns {Array} Cycles with calculated progress
 */
export const calculateCycleProgress = (cycles, releaseItems) => {
  if (!Array.isArray(cycles) || !Array.isArray(releaseItems)) {
    return cycles || [];
  }

  return cycles.map(cycle => {
    // Get release items for this cycle using foreign key
    const cycleReleaseItems = releaseItems.filter(ri => ri.cycleId === cycle.id);

    if (cycleReleaseItems.length === 0) {
      return { ...cycle, progress: 0 };
    }

    // Count completed release items
    const completedItems = cycleReleaseItems.filter(ri => {
      const status = ri.status?.toLowerCase();
      return status === 'done' || status === 'completed' || status === 'closed';
    });

    const progress = Math.round((completedItems.length / cycleReleaseItems.length) * 100);
    return { ...cycle, progress };
  });
};
