const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('API Routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    it('should return empty array when no tasks', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all tasks', async () => {
      await taskService.create({ title: 'Task 1' });
      await taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /tasks?status=', () => {
    it('should filter by status', async () => {
      await taskService.create({ title: 'Todo', status: 'todo' });
      await taskService.create({ title: 'In Progress', status: 'in_progress' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe('todo');
    });
  });

  describe('GET /tasks?page=&limit=', () => {
    it('should return paginated results', async () => {
      for (let i = 0; i < 15; i++) {
        await taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(10);
    });

    it('should handle page 2', async () => {
      for (let i = 0; i < 15; i++) {
        await taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=2&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return task statistics', async () => {
      await taskService.create({ title: 'Task 1', status: 'todo' });
      await taskService.create({ title: 'Task 2', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('todo', 1);
      expect(res.body).toHaveProperty('done', 1);
      expect(res.body).toHaveProperty('in_progress', 0);
    });
  });

  describe('POST /tasks', () => {
    it('should create task with valid data', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New task', priority: 'high' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('New task');
      expect(res.body.priority).toBe('high');
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ priority: 'high' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for empty title', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '   ' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Test', status: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid priority', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Test', priority: 'urgent' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid dueDate', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Test', dueDate: 'not-a-date' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update existing task', async () => {
      const task = await taskService.create({ title: 'Original' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated', status: 'in_progress' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid update data', async () => {
      const task = await taskService.create({ title: 'Test' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ status: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete existing task', async () => {
      const task = await taskService.create({ title: 'To delete' });

      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task as complete', async () => {
      const task = await taskService.create({ title: 'Task', priority: 'high' });

      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.priority).toBe('high');
      expect(res.body.completedAt).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign task to user', async () => {
      const task = await taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'John Doe' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('John Doe');
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Task');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'John' });
      expect(res.status).toBe(404);
    });

    it('should return 400 for empty assignee', async () => {
      const task = await taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing assignee', async () => {
      const task = await taskService.create({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should update existing assignee', async () => {
      const task = await taskService.create({ title: 'Task', assignee: 'Alice' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Bob' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Bob');
    });
  });
});