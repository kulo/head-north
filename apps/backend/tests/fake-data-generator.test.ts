import FakeDataGenerator from '../src/service/fake-data-generator';

describe('FakeDataGenerator', () => {
  let fakeDataGenerator;

  beforeEach(() => {
    fakeDataGenerator = new FakeDataGenerator();
  });

  describe('constructor', () => {
    test('should initialize with correct data structures', () => {
      expect(fakeDataGenerator.assignees).toHaveLength(8);
      expect(fakeDataGenerator.areas).toHaveLength(6);
      expect(fakeDataGenerator.initiatives).toHaveLength(5);
      expect(Object.keys(fakeDataGenerator.projects)).toHaveLength(5);
    });

    test('should have correct assignee structure', () => {
      const firstAssignee = fakeDataGenerator.assignees[0];
      expect(firstAssignee).toHaveProperty('displayName');
      expect(firstAssignee).toHaveProperty('accountId');
      expect(firstAssignee.displayName).toBe('All Assignees');
    });

    test('should have correct area structure', () => {
      const firstArea = fakeDataGenerator.areas[0];
      expect(firstArea).toHaveProperty('id');
      expect(firstArea).toHaveProperty('name');
      expect(firstArea.id).toBe('frontend');
      expect(firstArea.name).toBe('Frontend');
    });

    test('should have correct initiative structure', () => {
      const firstInitiative = fakeDataGenerator.initiatives[0];
      expect(firstInitiative).toHaveProperty('id');
      expect(firstInitiative).toHaveProperty('name');
      expect(firstInitiative.id).toBe(1);
      expect(firstInitiative.name).toBe('AI Platform Enhancement');
    });
  });

  describe('getSprintById', () => {
    test('should return correct sprint structure', async () => {
      const result = await fakeDataGenerator.getSprintById(1);
      
      expect(result).toHaveProperty('sprint');
      expect(result).toHaveProperty('sprints');
      expect(result.sprint).toHaveProperty('id', 1);
      expect(result.sprint).toHaveProperty('name');
      expect(result.sprint).toHaveProperty('state');
      expect(Array.isArray(result.sprints)).toBe(true);
    });

    test('should return first sprint when invalid ID provided', async () => {
      const result = await fakeDataGenerator.getSprintById(999);
      expect(result.sprint.id).toBe(1);
    });

    test('should return first sprint when no ID provided', async () => {
      const result = await fakeDataGenerator.getSprintById();
      expect(result.sprint.id).toBe(1);
    });
  });

  describe('getIssuesForSprint', () => {
    test('should return correct number of issues', async () => {
      const issues = await fakeDataGenerator.getIssuesForSprint(1);
      expect(issues).toHaveLength(25);
    });

    test('should have correct issue structure', async () => {
      const issues = await fakeDataGenerator.getIssuesForSprint(1);
      const firstIssue = issues[0];
      
      expect(firstIssue).toHaveProperty('id');
      expect(firstIssue).toHaveProperty('key');
      expect(firstIssue).toHaveProperty('fields');
      expect(firstIssue.fields).toHaveProperty('summary');
      expect(firstIssue.fields).toHaveProperty('status');
      expect(firstIssue.fields).toHaveProperty('assignee');
      expect(firstIssue.fields).toHaveProperty('area');
      expect(firstIssue.fields).toHaveProperty('initiativeId');
    });

    test('should have valid assignees', async () => {
      const issues = await fakeDataGenerator.getIssuesForSprint(1);
      const assignees = issues.map(issue => issue.fields.assignee);
      
      assignees.forEach(assignee => {
        expect(assignee).toHaveProperty('displayName');
        expect(assignee).toHaveProperty('accountId');
        expect(fakeDataGenerator.assignees).toContainEqual(assignee);
      });
    });

    test('should have valid areas and initiatives', async () => {
      const issues = await fakeDataGenerator.getIssuesForSprint(1);
      
      issues.forEach(issue => {
        const area = issue.fields.area;
        const initiativeId = issue.fields.initiativeId;
        
        expect(fakeDataGenerator.areas.some(a => a.id === area)).toBe(true);
        expect(fakeDataGenerator.initiatives.some(i => i.id === initiativeId)).toBe(true);
      });
    });
  });

  describe('getProjects', () => {
    test('should return all projects', async () => {
      const projects = await fakeDataGenerator.getProjects();
      expect(Object.keys(projects)).toHaveLength(5);
    });

    test('should have correct project structure', async () => {
      const projects = await fakeDataGenerator.getProjects();
      const firstProject = projects[Object.keys(projects)[0]];
      
      expect(firstProject).toHaveProperty('summary');
      expect(firstProject).toHaveProperty('labels');
      expect(firstProject).toHaveProperty('area');
      expect(firstProject).toHaveProperty('initiativeId');
      expect(Array.isArray(firstProject.labels)).toBe(true);
    });
  });

  describe('getAreas', () => {
    test('should return all areas', () => {
      const areas = fakeDataGenerator.getAreas();
      expect(areas).toHaveLength(6);
      expect(areas).toEqual(fakeDataGenerator.areas);
    });
  });

  describe('getInitiatives', () => {
    test('should return all initiatives', () => {
      const initiatives = fakeDataGenerator.getInitiatives();
      expect(initiatives).toHaveLength(5);
      expect(initiatives).toEqual(fakeDataGenerator.initiatives);
    });
  });

  describe('getAssignees', () => {
    test('should return all assignees', () => {
      const assignees = fakeDataGenerator.getAssignees();
      expect(assignees).toHaveLength(8);
      expect(assignees).toEqual(fakeDataGenerator.assignees);
    });
  });
});
