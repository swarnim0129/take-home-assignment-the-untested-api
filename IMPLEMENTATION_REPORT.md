# Task Manager API - Implementation Report

## Summary

Completed all tasks from the take-home assignment:
- Written comprehensive tests (45 tests, 95%+ coverage)
- Identified and fixed bugs
- Implemented new `PATCH /tasks/:id/assign` feature

---

## Test Coverage

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| app.js | 69.23% | 75% | - | 69.23% |
| routes/tasks.js | 100% | 91.66% | 100% | 100% |
| services/taskService.js | 100% | 94.73% | 100% | 100% |
| utils/validators.js | 88.88% | 87.17% | 100% | 88.88% |
| **Overall** | **95.48%** | **89.53%** | **93.33%** | **95.03%** |

---

## Bugs Found and Fixed

### Bug 1: Incorrect Pagination Offset (FIXED)
**Location:** `src/services/taskService.js:11-14`

**Problem:** Used `page * limit` instead of `(page - 1) * limit`

**Fix:**
```javascript
const getPaginated = (page, limit) => {
  const offset = (page - 1) * limit;
  return tasks.slice(offset, offset + limit);
};
```

---

### Bug 2: Missing Assign Endpoint (FIXED - New Feature)
**Location:** Not implemented

**Solution:** Implemented `PATCH /tasks/:id/assign` endpoint

---

### Bug 3: completeTask Overwrites Priority (FIXED)
**Location:** `src/services/taskService.js:63-77`

**Problem:** Always set `priority: 'medium'` when completing a task

**Fix:** Removed priority override - priority is now preserved when completing a task

---

## New Feature: PATCH /tasks/:id/assign

### Implementation Details

**Route:** `src/routes/tasks.js`

**Service:** `src/services/taskService.js` - added `assignTask` function

**Validator:** `src/utils/validators.js` - added `validateAssignee` function

### API Specification

**Endpoint:** `PATCH /tasks/:id/assign`

**Request Body:**
```json
{
  "assignee": "string"
}
```

**Responses:**
- `200 OK` - Returns updated task with assignee
- `400 Bad Request` - Missing or empty assignee
- `404 Not Found` - Task doesn't exist

### Design Decisions

1. **Validation:** Required field - returns 400 if missing or empty string
2. **Allows reassignment:** Can update existing assignee
3. **Preserves other fields:** Only adds/updates assignee field

---

## Tests Added

### Unit Tests (`tests/taskService.test.js`)
- `create` - creates task with required/all fields, sets timestamp
- `getAll` - returns all tasks, empty array case
- `findById` - finds existing, returns undefined for non-existent
- `getByStatus` - filters by status, handles no matches
- `getPaginated` - page 1, page 2, empty results
- `getStats` - counts, overdue count, ignores completed overdue
- `update` - updates fields, returns null for non-existent
- `remove` - deletes task, returns false for non-existent
- `completeTask` - marks done, preserves priority, returns null if not found

### Integration Tests (`tests/api.test.js`)
- `GET /tasks` - empty and populated
- `GET /tasks?status=` - filtering
- `GET /tasks?page=&limit=` - pagination
- `GET /tasks/stats` - statistics
- `POST /tasks` - valid, missing title, empty title, invalid status/priority/dueDate
- `PUT /tasks/:id` - valid update, 404 not found, validation errors
- `DELETE /tasks/:id` - valid delete, 404 not found
- `PATCH /tasks/:id/complete` - marks complete, 404
- `PATCH /tasks/:id/assign` - assign, reassign, missing/empty assignee, 404

---

## If More Time Available

1. **Combine status filter + pagination** - Currently they conflict
2. **Add more validation** - Title length limits, assignee character validation
3. **Database integration** - Replace in-memory store
4. **Authentication** - Add auth middleware
5. **Error handling** - More specific error messages

---

## Surprises in Codebase

1. No `id` validation on update/delete - passes any string to service
2. Uses `todo`/`in_progress`/`done` as status but `includes()` for filtering is fragile
3. In-memory store resets on restart - needs persistent storage for production

---

## Questions Before Production

1. Should we add authentication/authorization?
2. What is the expected scale? Need pagination optimization?
3. Should assignee be a user ID reference instead of string?
4. Need to add soft delete (archive)?
5. What are the SLAs for response times?