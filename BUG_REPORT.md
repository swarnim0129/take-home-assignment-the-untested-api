# Bug Report

## Bug 1: Incorrect Pagination Offset Calculation

**Location:** `src/services/taskService.js:11-14`

**What It Does:**
```javascript
const getPaginated = (page, limit) => {
  const offset = page * limit;  // BUG: Uses page * limit instead of (page - 1) * limit
  return tasks.slice(offset, offset + limit);
};
```

**Expected Behavior:**
- Page 1 with limit 10 should return items 0-9 (first 10 items)
- Page 2 with limit 10 should return items 10-19 (next 10 items)

**Actual Behavior:**
- Page 1 returns items 10-14 (only 5 items because offset = 1 * 10 = 10)
- Page 2 returns empty array (offset = 2 * 10 = 20, which is beyond the array)

**How Discovered:**
- Wrote tests for pagination with 15 items created
- Expected page 1 to have 10 items, got only 5
- Expected page 2 to have 5 items, got 0

**Fix:**
```javascript
const getPaginated = (page, limit) => {
  const offset = (page - 1) * limit;  // Correct: (page - 1) * limit
  return tasks.slice(offset, offset + limit);
};
```

---

## Bug 2: Missing PATCH /tasks/:id/assign Endpoint

**Location:** `src/routes/tasks.js`

**What It Does:**
The endpoint `PATCH /tasks/:id/assign` for assigning tasks to users does not exist.

**Expected Behavior:**
- Accepts `{ "assignee": "string" }` body
- Stores assignee on task object
- Returns updated task
- Returns 404 if task doesn't exist

**Actual Behavior:**
Route returns 404 for all requests (no route defined).

**Fix:**
Add new route handler and service function.

---

## Bug 3: completeTask Overwrites Priority

**Location:** `src/services/taskService.js:63-77`

**What It Does:**
```javascript
const completeTask = (id) => {
  // ...
  const updated = {
    ...task,
    priority: 'medium',  // BUG: Always overwrites priority to medium
    status: 'done',
    completedAt: new Date().toISOString(),
  };
```

**Expected Behavior:**
Completing a task should only change status to 'done' and set completedAt. Priority should remain unchanged unless explicitly specified.

**Actual Behavior:**
Always resets priority to 'medium', which may not be desired.

**Fix:**
Remove the priority override:
```javascript
const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };
```

---

## Bug 4: GET /tasks with status ignores other query params

**Location:** `src/routes/tasks.js:11-28`

**What It Does:**
When filtering by `?status=`, the code returns early without checking pagination params.

**Expected Behavior:**
Should support both status filter AND pagination together.

**Actual Behavior:**
Only status filter works, pagination params are ignored when status is provided.

**Fix:**
Combine filters instead of returning early.