const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('should create a task with required fields', () => {
      const task = taskService.create({ title: 'Test task' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
    });

    it('should create task with all fields', () => {
      const dueDate = new Date().toISOString();
      const task = taskService.create({
        title: 'Full task',
        description: 'Description',
        status: 'in_progress',
        priority: 'high',
        dueDate
      });
      expect(task.description).toBe('Description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });

    it('should set createdAt timestamp', () => {
      const task = taskService.create({ title: 'Test' });
      expect(task.createdAt).toBeDefined();
      expect(typeof task.createdAt).toBe('string');
    });
  });

  describe('getAll', () => {
    it('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
    });

    it('should return empty array when no tasks', () => {
      const tasks = taskService.getAll();
      expect(tasks).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find task by id', () => {
      const created = taskService.create({ title: 'Test' });
      const found = taskService.findById(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return undefined for non-existent id', () => {
      const found = taskService.findById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('should filter tasks by status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].status).toBe('todo');
    });

    it('returns empty array for non-matching status', () => {
      taskService.create({ title: 'Task', status: 'todo' });
      const doneTasks = taskService.getByStatus('done');
      expect(doneTasks).toHaveLength(0);
    });
  });

  describe('getPaginated', () => {
    it('should return paginated results', () => {
      for (let i = 0; i < 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }
      const page1 = taskService.getPaginated(1, 10);
      expect(page1).toHaveLength(10);
    });

    it('should handle page 2', () => {
      for (let i = 0; i < 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }
      const page2 = taskService.getPaginated(2, 10);
      expect(page2).toHaveLength(5);
    });
  });

  describe('getStats', () => {
    it('should return correct counts', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'todo' });
      taskService.create({ title: 'Task 3', status: 'in_progress' });
      taskService.create({ title: 'Task 4', status: 'done' });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
    });

    it('should count overdue tasks', () => {
      const overdueDate = new Date(Date.now() - 86400000).toISOString();
      taskService.create({
        title: 'Overdue',
        status: 'todo',
        dueDate: overdueDate
      });

      const stats = taskService.getStats();
      expect(stats.overdue).toBe(1);
    });

    it('should not count completed overdue tasks', () => {
      const overdueDate = new Date(Date.now() - 86400000).toISOString();
      taskService.create({
        title: 'Overdue but done',
        status: 'done',
        dueDate: overdueDate
      });

      const stats = taskService.getStats();
      expect(stats.overdue).toBe(0);
    });
  });

  describe('update', () => {
    it('should update task fields', () => {
      const task = taskService.create({ title: 'Original' });
      const updated = taskService.update(task.id, { title: 'Updated' });
      expect(updated.title).toBe('Updated');
    });

    it('should return null for non-existent task', () => {
      const updated = taskService.update('non-existent', { title: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete task', () => {
      const task = taskService.create({ title: 'To delete' });
      const result = taskService.remove(task.id);
      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return false for non-existent task', () => {
      const result = taskService.remove('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should mark task as done', () => {
      const task = taskService.create({ title: 'Task', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
    });

    it('should preserve priority', () => {
      const task = taskService.create({ title: 'Task', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      expect(completed.priority).toBe('high');
    });

    it('should return null for non-existent task', () => {
      const completed = taskService.completeTask('non-existent');
      expect(completed).toBeNull();
    });
  });
});