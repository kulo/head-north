# 🐛 Roadmap Data Debug Plan

## 🔍 **Root Cause Identified**

The "No roadmap data available" issue is caused by **missing `filteredRoadmapData` computed property** in the Pinia data store.

### **Problem Analysis**

1. **Missing Property**: `Roadmap-pinia.vue` tries to access `dataStore.filteredRoadmapData` but it doesn't exist
2. **Incomplete Migration**: The filtering logic from Vuex wasn't fully migrated to Pinia
3. **Service Integration Gap**: `CycleDataViewCoordinator` is not properly integrated with Pinia stores

## 📊 **Debug Test Results**

✅ **Confirmed Issues:**

- `filteredRoadmapData` property **does NOT exist** in data store
- `roadmapData` property **does exist** and works correctly
- Data processing works fine (cycles, initiatives, etc.)
- The issue is specifically with the **filtered data logic**

## 🎯 **Debugging Plan**

### **Phase 1: Immediate Fix (Temporary)**

- ✅ **Added fallback logic** in `Roadmap-pinia.vue` to use `roadmapData` when `filteredRoadmapData` is missing
- ✅ **Added comprehensive debug logs** to track data flow
- ✅ **Created debug tests** to verify the issue

### **Phase 2: Root Cause Analysis**

- ✅ **Identified missing `filteredRoadmapData`** computed property
- ✅ **Confirmed data processing works** (raw data → processed data)
- ✅ **Verified service integration** is working for basic data

### **Phase 3: Solution Implementation (Next Steps)**

#### **Option A: Add `filteredRoadmapData` to Data Store**

```typescript
// In src/stores/data.ts
const filteredRoadmapData = computed((): RoadmapData => {
  // Use CycleDataViewCoordinator to generate filtered data
  if (!cycleDataViewCoordinator) {
    console.warn(
      "CycleDataViewCoordinator not available, using unfiltered data",
    );
    return roadmapData.value;
  }

  return cycleDataViewCoordinator.generateFilteredRoadmapData(
    rawData.value,
    processedData.value,
  );
});
```

#### **Option B: Integrate CycleDataViewCoordinator with Pinia**

```typescript
// In src/stores/data.ts
let cycleDataViewCoordinator: CycleDataViewCoordinator | null = null;

function initializeServices(coordinator: CycleDataViewCoordinator) {
  cycleDataViewCoordinator = coordinator;
}

// Add filteredRoadmapData computed property
const filteredRoadmapData = computed(() => {
  if (!cycleDataViewCoordinator) return roadmapData.value;
  return cycleDataViewCoordinator.generateFilteredRoadmapData(
    rawData.value,
    processedData.value,
  );
});
```

#### **Option C: Use Composables Pattern**

```typescript
// In Roadmap-pinia.vue
import { useCycleData } from "../composables/useCycleData";

const { filteredRoadmapData } = useCycleData(cycleDataViewCoordinator, {
  rawData: dataStore.rawData,
  processedData: dataStore.processedData,
});
```

## 🔧 **Current Debug Logs Added**

### **1. Roadmap Component Debug**

- ✅ Store state logging on component setup
- ✅ `filteredRoadmapData` availability check
- ✅ Fallback logic with warnings
- ✅ Data computation logging

### **2. Data Store Debug**

- ✅ `roadmapData` computation logging
- ✅ Data availability checks
- ✅ Processed data validation

### **3. Service Integration Debug**

- ✅ Data fetch process logging
- ✅ Post-fetch data validation
- ✅ Store state verification

## 📋 **Next Steps (Implementation)**

### **Step 1: Choose Implementation Approach**

- **Recommended**: Option B (Integrate CycleDataViewCoordinator with Pinia)
- **Reason**: Maintains centralized service management while adding filtering capability

### **Step 2: Implement the Fix**

1. Add `CycleDataViewCoordinator` to data store
2. Add `filteredRoadmapData` computed property
3. Update service integration to inject coordinator
4. Remove temporary fallback logic

### **Step 3: Test the Fix**

1. Run existing tests to ensure no regressions
2. Test roadmap view with real data
3. Verify filtering functionality works
4. Remove debug logs

### **Step 4: Clean Up**

1. Remove temporary fallback logic
2. Remove debug logs
3. Update documentation

## 🚨 **Current Status**

- ✅ **Issue identified**: Missing `filteredRoadmapData` property
- ✅ **Temporary fix applied**: Fallback to `roadmapData`
- ✅ **Debug logs added**: Comprehensive logging for troubleshooting
- ✅ **Tests created**: Debug tests to verify the issue
- ⏳ **Root cause fix pending**: Need to implement proper filtering integration

## 🎯 **Expected Outcome**

After implementing the fix:

- ✅ Roadmap view will show data correctly
- ✅ Filtering functionality will work
- ✅ No more "No roadmap data available" message
- ✅ Full Pinia migration will be complete

## 📝 **Files Modified for Debugging**

1. **`src/components/roadmap/Roadmap-pinia.vue`**
   - Added debug logs
   - Added temporary fallback logic

2. **`src/stores/data.ts`**
   - Added debug logs to `roadmapData` computed property

3. **`src/stores/service-integration.ts`**
   - Added debug logs to `fetchData()` function

4. **`tests/debug/roadmap-data-debug.test.ts`**
   - Created comprehensive debug tests

## 🔍 **Debug Commands**

```bash
# Run debug tests
npm test -- tests/debug/roadmap-data-debug.test.ts

# Run all tests
npm test

# Build and check for errors
npm run build
```

## 📊 **Debug Output Example**

When you load the roadmap view, you should see console logs like:

```
🔍 Roadmap-pinia.vue setup - Store states: {...}
🔍 Checking filteredRoadmapData availability: {...}
⚠️ filteredRoadmapData not found, using roadmapData as fallback
🔍 Computing roadmapData: {...}
```

This confirms the issue and shows the temporary fix is working.
