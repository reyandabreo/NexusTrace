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









For your guide, the best “novel” features are the ones that look like research contributions, not just extra CRUD screens.

**Best Novel Features (ranked)**
1. Counterfactual Explainable Risk Scoring  
Shows not only risk score, but why it was high and what would need to change for it to drop or rise.  
Why this is novel: most tools only show scores, not actionable “why/why-not” explanations.

2. Attack-Chain Reconstruction with MITRE ATT&CK Mapping  
Automatically converts timeline + entities into an inferred kill chain (Initial Access → Execution → Persistence → Exfiltration), with confidence per step.  
Why this is novel: turns raw forensic logs into interpretable attacker behavior graph.

3. Verifiable Chain-of-Custody Integrity Layer  
Hash every uploaded evidence/chunk, keep a tamper-evident chain, and provide one-click integrity verification report.  
Why this is novel: combines AI investigation with legal-grade forensic integrity.

4. Cross-Case Similar Incident Retrieval  
Given a new case, find top similar historical cases using hybrid graph + embedding similarity, and suggest likely next leads.  
Why this is novel: brings “case memory” and investigator acceleration.

5. Adversarial RAG Guardrail (Answer + Verifier)  
One model answers, another verifies whether the answer is fully grounded in retrieved evidence and flags unsupported claims.  
Why this is novel: reduces hallucination risk in forensic contexts.

**If you can build only one**
Pick Attack-Chain Reconstruction with MITRE mapping.  
Reason: highest demo impact, clearly “new”, and easy for faculty to understand in 30 seconds.

**Quick capstone framing (for report/presentation)**
- Problem: forensic tools are descriptive, not inferential.  
- Contribution: evidence-grounded attack graph with explainable confidence.  
- Evaluation: precision of mapped ATT&CK techniques, analyst time saved, false-positive reduction.

If you want, I can give you a practical 2-week implementation plan for one selected feature (API endpoints, UI changes, and demo storyline).

