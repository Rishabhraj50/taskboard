# TaskFlow - Team Task Board

A production-grade, Trello-style team task board application built with TypeScript, React, and a dedicated Node.js + Express REST API with MongoDB & Mongoose.

---

## 🚀 Quick Start & How to Run

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`
- Optional: MongoDB running locally or on MongoDB Atlas (if omitted, TaskFlow automatically uses its built-in in-memory MongoDB store with realistic seed data).

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
```env
PORT=3000
JWT_SECRET="taskflow-super-secret-jwt-key-2026-production-ready"
MONGODB_URI="mongodb://localhost:27017/taskflow" # Optional; falls back to in-memory MongoDB if unconnectable
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Sample Credentials (Pre-seeded Team)

All pre-seeded demo accounts share the default password: **`password123`** (bcrypt-hashed with 10 salt rounds).

| Name | Email | Role | Accessible Boards |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | `alex@team.dev` | Engineering Lead (Owner) | Product Engineering Sprint 14, Mobile App Redesign |
| **Priya Sharma** | `priya@team.dev` | Product Manager (Owner) | Product Engineering Sprint 14, Mobile App Redesign |
| **Carlos Mendez** | `carlos@team.dev` | Full-Stack Eng | Product Engineering Sprint 14, Mobile App Redesign |
| **Sunidhi Alok** | `sunidhi@team.dev` | Tech Reviewer | Product Engineering Sprint 14 |

*Tip: Use the top-right profile dropdown in the UI to switch between demo accounts in 1 click!*

---

## 📐 Database Schema Diagram

```
 +--------------------+       1:N        +--------------------+
 |       users        | <---------------+ |       boards       |
 +--------------------+                  +--------------------+
 | _id (PK)           |                  | _id (PK)           |
 | name               |                  | title              |
 | email (Unique)     |                  | description        |
 | password (bcrypt)  |                  | ownerId (FK->user) |
 | avatarUrl          |                  | members [FK->user] |
 | createdAt          |                  | createdAt          |
 +--------------------+                  +--------------------+
          |                                         |
          | 1:N (assigneeId)                        | 1:N
          v                                         v
 +--------------------+       1:N        +--------------------+
 |       tasks        | <---------------+ |      columns       |
 +--------------------+                  +--------------------+
 | _id (PK)           |                  | _id (PK)           |
 | boardId (FK)       |                  | boardId (FK)       |
 | columnId (FK)      |                  | title              |
 | title              |                  | order (Compound)   |
 | description        |                  | color              |
 | assigneeId (FK)    |                  | createdAt          |
 | priority (Index)   |                  +--------------------+
 | dueDate (Index)    |
 | labels [Multikey]  |
 | order (Compound)   |
 | activityLog [Embed]|
 | createdAt          |
 +--------------------+
```

---

## 🧠 Architectural Decisions (Live Review Defense)

### 1. Why Embed vs Reference in MongoDB?
- **Referenced**:
  - `users` on `boards` and `tasks`: Users are independent entities across multiple boards. Referencing prevents desynchronization anomalies when users update their profile or credentials.
  - `columns` and `tasks` to `board`: Boards can accumulate hundreds or thousands of cards over years. Embedding all tasks inside a single Board document would risk exceeding MongoDB's **16MB BSON document limit** and trigger heavy document-level write-lock contention during drag-and-drop operations.
  - `columns`: Modeled as separate documents with compound index `{ boardId: 1, order: 1 }` to allow atomic reordering without locking entire boards.
- **Embedded**:
  - `activityLog` on `tasks`: Activity logs have a strict 1:Few bounded relationship to their parent task. They are only ever read when inspecting that specific task. Embedding them avoids expensive `$lookup` joins and enables atomic transactional appends on every task mutation.
  - `labels` on `tasks`: Simple string arrays embedded in tasks. Multikey indexing provides instantaneous tag filtering without a separate normalization join table.

### 2. Why These Specific Indexes?
- `tasks.index({ columnId: 1, order: 1 })`: Powers the Kanban board render. Fetches all cards in a column pre-sorted by their drag-and-drop rank using an index-only scan (`IXSCAN`) with zero in-memory sorting.
- `tasks.index({ boardId: 1, assigneeId: 1 })` & `tasks.index({ boardId: 1, priority: 1 })`: Optimizes backend search and multi-facet filtering in sub-millisecond execution without collection scans (`COLLSCAN`).
- `tasks.index({ dueDate: 1 })`: Enables instant filtering of overdue tasks (`dueDate < today`).
- `users.index({ email: 1 }, { unique: true })`: Enforces uniqueness across registrations and provides O(1) B-tree lookup during login.

### 3. Where JWT is Stored & Security Threat Mitigations
- In this SPA, the JWT is stored in `localStorage` and sent via standard `Authorization: Bearer <token>` headers.
- **Trade-off:** `localStorage` is accessible to client scripts, posing an XSS threat if untrusted scripts run.
- **Mitigation in place:** Strict input sanitization via Zod schemas, zero `dangerouslySetInnerHTML`, short token lifespan (7 days), and immediate 401 client-side session invalidation.
- **Production Evolution:** For banking or medical-grade tiers, migrate to a dual-token architecture: short-lived access token in React memory (15 min) + httpOnly, Secure, SameSite=Strict refresh token cookie.

### 4. What Breaks First at 100x Traffic & How to Scale?
1. **Reorder Index Collisions:**
   - Sequential integer ordering (`0, 1, 2, ...`) requires re-indexing sibling cards on every drag. At high concurrency, this creates write lock contention.
   - *Solution:* Switch to **Fractional Indexing** (Lexorank strings like `"a0", "a1", "am"`). Moving a task requires writing only 1 document with zero neighbor updates!
2. **Stats Aggregation Saturation:**
   - Running `$group` and `$lookup` aggregations on every page view consumes CPU on primary database nodes.
   - *Solution:* Offload reads to MongoDB secondary read replicas, or maintain pre-calculated column/assignee task counters directly on the Board document using atomic `$inc`.
3. **Live Real-time Collaboration:**
   - Client-side polling at 100x traffic introduces excessive server overhead.
   - *Solution:* Deploy WebSockets (Socket.IO) backed by a Redis Pub/Sub cluster to broadcast task movements with sub-50ms latency.

---

## 🛠️ API Structure

```
/server/
  ├── db/
  │   └── connection.ts    # MongoDB / Mongoose connection + In-Memory fallback store
  ├── models/
  │   ├── User.ts          # User Mongoose schema, bcrypt compare, UserRepository
  │   ├── Board.ts         # Board Mongoose schema, BoardRepository with populate
  │   ├── Column.ts        # Column Mongoose schema, ColumnRepository with reorder
  │   └── Task.ts          # Task Mongoose schema, filters & Aggregation Pipeline
  ├── controllers/
  │   ├── authController.ts
  │   ├── boardController.ts
  │   ├── columnController.ts
  │   ├── taskController.ts
  │   └── statsController.ts
  ├── middleware/
  │   ├── auth.ts          # Bearer JWT verification & board member authorization
  │   ├── validate.ts      # Zod validation schema middleware
  │   └── errorHandler.ts  # Custom AppError & centralized Express error handler
  ├── routes/
  │   ├── authRoutes.ts
  │   ├── boardRoutes.ts
  │   ├── columnRoutes.ts
  │   └── taskRoutes.ts
  └── docs/
      └── openapi.json     # OpenAPI 3.0 API Documentation specification
```

---

## 📊 Aggregation Pipeline Endpoint: `GET /api/boards/:id/stats`

Returns real-time task counts per column and per assignee built using MongoDB `$match`, `$group`, `$lookup`, and `$project` stages:
```json
{
  "success": true,
  "boardId": "brd_sprint14",
  "boardTitle": "Product Engineering Sprint 14",
  "stats": {
    "totalTasks": 6,
    "overdueTasks": 1,
    "byColumn": [
      { "columnId": "col_todo", "columnTitle": "To Do", "columnColor": "#3B82F6", "count": 1 },
      { "columnId": "col_inprogress", "columnTitle": "In Progress", "columnColor": "#F59E0B", "count": 2 },
      { "columnId": "col_review", "columnTitle": "Code Review", "columnColor": "#8B5CF6", "count": 1 },
      { "columnId": "col_done", "columnTitle": "Done", "columnColor": "#10B981", "count": 1 },
      { "columnId": "col_backlog", "columnTitle": "Backlog", "columnColor": "#64748B", "count": 1 }
    ],
    "byAssignee": [
      { "assigneeId": "usr_alex", "count": 2, "userName": "Alex Rivera", "userEmail": "alex@team.dev" },
      { "assigneeId": "usr_carlos", "count": 2, "userName": "Carlos Mendez", "userEmail": "carlos@team.dev" },
      { "assigneeId": "usr_priya", "count": 1, "userName": "Priya Sharma", "userEmail": "priya@team.dev" },
      { "assigneeId": null, "count": 1, "userName": "Unassigned" }
    ]
  }
}
```
