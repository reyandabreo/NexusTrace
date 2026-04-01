# Work to do.

**Frontend**
- Add list virtualization for long feeds (audit trail, cases) to avoid slow renders.
- Debounce search inputs and filters to reduce state churn and query re-runs.
- Memoize heavy graph layouts and move layout work into a Web Worker for large graphs.
- Lazy-load heavy pages/components (graph, analytics, mindmap) via dynamic imports.
- Reduce XYFlow re-renders by only updating nodes/edges diffs and turning off animations for large graphs.
- Use `useDeferredValue` for expensive filtering to keep typing responsive.
- Limit logs and sample data inserts in production UI.

**Backend/API**
- Add pagination/limit params to list endpoints (cases, audit logs, graph relations).
- Cache graph responses per case + relation selection with a short TTL.
- Avoid returning large fields by default (e.g., full chunk text) unless explicitly requested.
- Use background tasks for heavy ingestion/graph building to keep API snappy.
- Add consistent `staleTime` caching hints for frontend to reduce repeat calls.

**Neo4j / Data**
- Add indexes/constraints on `Case(case_id)`, `Evidence(evidence_id)`, `Chunk(chunk_id)`, `Entity(name)`, `User(id/username/email)`.
- Cap graph traversals and use selective patterns to avoid large Cartesian expansions.
- Precompute commonly used stats (lead scoring, relations counts) if needed.

**Audit & Logging**
- Store audit logs server-side (or optionally) to avoid large client storage.
- Batch or cap audit entries client-side to reduce memory and render load.
- Replace console debug prints with structured logs and disable in production.

**UX/Perceived Performance**
- Use skeletons for heavy views and show “loading more” rather than blocking renders.
- Progressive graph loading (first N edges, then “load more”) for large cases.
- Minimap/labels toggle for heavy graphs to keep UI responsive.

**Build/Deploy**
- Enable compression and caching headers for static assets.
- Analyze bundle size and split large pages (graphs, analytics, mindmap).
