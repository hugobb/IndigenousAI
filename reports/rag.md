# Implementing and Deploying a RAG System for Community Knowledge

_A technical reference for building a self-hosted retrieval-augmented generation system over a community's own data. It is organized by maturity level, from local development to full-scale deployment, and gives best-practice detail for ingestion, chunking, hybrid retrieval, reranking, context assembly, generation, and graph-augmented retrieval. It maps the full surface where data sovereignty considerations attach to the system, without assuming any particular sovereignty framework. It is a design and best-practices reference, not a tutorial: the implementation, as a library or notebooks, is yours to write._

---

## 1. Scope and stance

This guide is for the technical implementer building and running the system. It assumes Python or equivalent, containers, Linux, and the working vocabulary of ML (embeddings, tokenization, quantization, KV cache, ANN indexes). It contains no code by design, because the intent is that you build a reusable library and notebooks from these decisions. What follows is the set of choices, parameters, and patterns those notebooks should encode, and the order to make them in.

It does two things. It gives enough implementation detail to build from, and it separates that detail across maturity levels so a team can start small and grow without rearchitecting.

Two things it deliberately does not do: it does not supply a data sovereignty framework, and it assumes nothing about which one applies. The community you build for supplies the policy: what may be used, by whom, for what, what must never enter the system, and who decides. Section 10 maps every point where such a policy binds to the running system and the control available there. The framing to carry throughout: **the framework decides the policy; the system enforces it; this guide shows where enforcement lives and where it leaks.**

---

## 2. How RAG works

At index time (offline) the flow is: ingest and parse sources into clean text plus metadata, then chunk into passages, then embed each chunk (a dense vector, and a sparse representation for hybrid retrieval), then write vectors and metadata into a vector store with an approximate-nearest-neighbor index.

At query time (online) the flow is: embed the query, retrieve candidate chunks (dense and sparse branches, fused), filter the candidates by access metadata, rerank with a cross-encoder, assemble the survivors into a grounded prompt, and generate an answer with citations back to source chunks.

The quality-critical additions, all detailed below, are hybrid retrieval, reranking, access-aware filtering, and disciplined context assembly with citations. Treat them as core, not optional. Observability belongs inside the trust boundary, because query logs and retrieved-passage logs are sensitive content, not neutral operational data.

Meaning is shaped at every layer, and each layer is both a quality and a sovereignty concern. Chunking imposes boundaries that can strip governing context. Embedding imports a notion of similarity learned from some other corpus. Retrieval returns what is near, not what is appropriate. Generation produces fluent prose whose smoothness is independent of its correctness.

---

## 3. Maturity levels

The same architecture runs at three levels of operational maturity. Build at Level 0, harden toward Level 2. Nothing here requires discarding Level 0 work to move up; it requires promoting components from in-process libraries to standalone services.

| Concern         | L0 Local development          | L1 Single-node pilot / production       | L2 Full-scale / hardened                     |
| --------------- | ----------------------------- | --------------------------------------- | -------------------------------------------- |
| Generation      | Ollama or llama.cpp           | vLLM (or llama.cpp on CPU)              | vLLM / SGLang, multi-GPU, replicated         |
| Embeddings      | in-process library, or Ollama | Text Embeddings Inference (TEI) service | TEI replicas behind a load balancer          |
| Vector store    | LanceDB or Chroma (embedded)  | Qdrant (single node)                    | Qdrant cluster or Milvus                     |
| Hybrid / sparse | optional                      | BM25 or SPLADE + dense, RRF fusion      | same, tuned, monitored                       |
| Reranking       | cross-encoder in-process      | TEI rerank endpoint or service          | replicated rerank service                    |
| Graph layer     | none                          | optional, offline-built                 | GraphRAG where relational queries justify it |
| Orchestration   | script or notebook            | thin service, Docker Compose            | service on Kubernetes                        |
| Access control  | none                          | API gateway, keys, per-collection scope | RBAC/SSO, audit logging                      |
| Evaluation      | manual + small RAGAS run      | RAGAS on a golden set                   | RAGAS in CI with regression gates            |
| Egress          | open                          | controlled, monitored                   | air-gapped option                            |
| Observability   | console logs                  | Prometheus + Grafana                    | metrics + tracing + alerting                 |

**L0** validates the pipeline, chunking, prompts, and an evaluation set on one machine with fast iteration and no infrastructure. **L1** is where most community deployments live: one owned machine, components as services, real access control, a tuned hybrid-plus-rerank pipeline, and an evaluation harness. **L2** adds scale, hardening, air-gapping, and the full sovereignty controls of Section 10. GraphRAG (Section 9) is an advanced, optional capability, not a default, because of its indexing cost and its heightened sovereignty risk.

The core stack that spans all three levels: BAAI/bge-m3 for embeddings (dense and sparse from one model, multilingual), BAAI/bge-reranker-v2-m3 for reranking, Qdrant for the vector store, vLLM or SGLang for generation, TEI for serving embedding and rerank models, RAGAS for evaluation, and a layout-aware parser such as Docling or unstructured. Pin every version before you deploy.

---

## 4. Ingestion and parsing

**Goal.** Turn heterogeneous sources into clean, normalized text plus a complete metadata record, capturing provenance and access classification at the point of entry, because neither can be recovered later.

Best practices:

- **Capture provenance and classification at ingest.** For every source, record origin, contributor, a consent reference, an access label (the community-defined scheme, for example open, restricted, or excluded), a content hash, and the ingestion time. These travel on every downstream chunk. A chunk without them cannot be access-controlled or selectively deleted.
- **Refuse excluded material at the boundary.** Material classified as excluded never enters the parser. Enforce this as the first check, not a later filter.
- **Preserve structure during extraction.** Use a layout-aware parser that emits structured elements (headings, paragraphs, tables, speaker turns) rather than a flat string. That structure is what good chunking depends on.
- **Normalize deterministically.** Fix encoding, collapse whitespace, repair soft hyphens and OCR artifacts, and record a content hash for deduplication and change detection on re-ingest.
- **OCR only what needs it.** Detect scanned pages and OCR those; never OCR born-digital text, which degrades it.
- **Keep intermediates inside the trust boundary** with the same classification and retention as their source (Section 10.4).

Across levels: at L0 run ingestion over a folder and inspect the structured output. At L1 make it a service or scheduled job, persist the source records, and detect re-ingests by content hash. At L2 broaden format coverage, add local transcription for audio sources, and register provenance into a governed catalog.

---

## 5. Chunking strategies

**Goal.** Split documents into retrieval units large enough to carry meaning and small enough to be precise, while preserving the structure and metadata that retrieval and access control depend on.

Choosing a strategy:

| Strategy                  | When to use                                                    | Cost                                                            |
| ------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Fixed-size with overlap   | Baseline only, for unstructured text                           | Trivial; ignores meaning boundaries                             |
| Recursive (by separators) | General default; respects paragraphs, then sentences           | Low; good quality                                               |
| Structure-aware           | Sources with real structure (sections, turns, question/answer) | Low if the parser kept structure                                |
| Semantic                  | Long flowing prose where topics shift mid-section              | Embedding calls at index time                                   |
| Contextual augmentation   | When chunks are unintelligible out of context                  | One cheap LLM call per chunk at index time; strong recall gains |

Best practices:

- **Start structure-aware, fall back to recursive.** Split on the document's own boundaries (headings, speaker turns, list items) and only sub-split units that exceed the size budget. Within an oversized unit, split recursively, preferring higher-level separators (blank line, then line break, then sentence, then word) before any hard split.
- **Size in tokens, not characters,** measured with the embedding model's own tokenizer. A common starting band is 256 to 512 tokens per chunk with 10 to 20 percent overlap. Tune these against the evaluation set (Section 8), not by intuition.
- **Never split a unit whose meaning is the unit.** A dictionary entry, a single turn, or a short story segment stays whole even when small.
- **Carry full metadata onto every chunk,** including the access label, the source document id and title, the contributor, and the element reference. The chunk, not the document, is what gets retrieved and filtered.
- **Consider contextual augmentation** for context-poor corpora: before embedding, prepend to each chunk a single generated sentence, grounded in a short document summary, that situates the passage for search. This is the most effective recall improvement on corpora where passages are unintelligible alone, at the cost of one cheap local LLM call per chunk. Store the augmented text for retrieval but keep the original text for display and citation.
- **Watch the sovereignty edge.** A fragment retrievable on its own has been detached from the context that may have governed its appropriateness (Section 10.5). Keep context-dependent passages out of the retrievable set when that matters.

Across levels: at L0 eyeball chunk boundaries on real documents. At L1 fix a configuration (strategy, size, overlap, augmentation on or off), tune it against the evaluation set, and version it. At L2 treat re-chunking as a tested pipeline tied to the embedding-model version, since changing either forces a full re-index.

---

## 6. Embedding

**Goal.** Map chunks and queries into the same vector space, served locally.

Best practices:

- **Serve the embedding model inside the boundary.** Never call a hosted embedding API; that is the most common way a "local" system silently leaks the corpus (Section 10.6).
- **Apply the model's required prefixes or instructions.** Several models distinguish document encodings from query encodings (for example, some prepend a document prefix and a query prefix; instruction-tuned models take a task instruction on the query side). Getting this wrong silently halves retrieval quality, so confirm it against the model card.
- **Normalize embeddings** when using cosine or inner-product indexes.
- **Pick the model for your trajectory.** For an English start, a light model is fine. For multilingual and the low-resource path, BAAI/bge-m3 produces dense, learned-sparse, and multi-vector outputs from one model, which also gives you the sparse branch of hybrid retrieval for free. Record the chosen model's identity and license as part of system provenance.

Across levels: in-process at L0; a single TEI service at L1; replicated TEI behind a balancer at L2.

---

## 7. Indexing, hybrid retrieval, and reranking

These three determine retrieval quality and are presented together because the production pattern fuses them: retrieve wide and cheap across two branches, fuse, filter by access, then rerank narrow and accurate.

### 7.1 Indexing and the vector store

Best practices:

- **Use a store with metadata filtering and native hybrid support.** Qdrant is the default; LanceDB or Chroma are fine embedded options at L0; Milvus and pgvector are alternatives.
- **Separate collections per access level.** Restricted and open material go in different collections reachable by different principals, never one collection with a filter you must get right on every query (Section 10.8).
- **Tune the ANN index.** For HNSW, a graph connectivity parameter (commonly 16 to 32) and a higher construction-time search width improve recall at index-build cost; raising the search-time width trades latency for recall. Apply scalar or product quantization to cut memory at large scale.
- **Store dense and sparse vectors together** with the full payload (chunk text, source ids, access label, contributor) so a single query can do both branches and return everything needed for filtering, reranking, and citation.

### 7.2 Hybrid retrieval

Why it matters: dense vectors capture semantic similarity but miss exact terms, rare tokens, names, and morphologically distinctive words. Sparse lexical retrieval (BM25, a learned sparse model such as SPLADE, or BGE-M3's own sparse output) captures those. Fusing both recovers what either alone misses, which matters disproportionately for community and low-resource corpora dense with names and place words.

Best practices:

- **Run dense and sparse in parallel, then fuse,** rather than choosing one. Reciprocal Rank Fusion is the robust default because it needs no score calibration between the two systems: each result contributes one divided by the sum of a small constant (about 60) and its rank within a branch, and contributions are summed across branches. Sort by the summed score.
- **Retrieve wide before fusing,** roughly 40 to 100 candidates per branch, so the reranker downstream has good material to work with.
- **Generate the sparse vector locally too,** with a local BM25 or SPLADE encoder or BGE-M3's sparse head. Never a hosted service.
- **Apply access filters in both branches** at retrieval time, before fusion.
- **Prefer server-side fusion** where the store supports it (for example a query that prefetches a dense branch and a sparse branch and fuses them in one call), which keeps the round trips and the logic in one place. Fall back to client-side fusion only if the store cannot.

### 7.3 Reranking

Why it matters: bi-encoder retrieval scores query and passage independently. A cross-encoder reranker scores them jointly, reading both together, which is substantially more accurate. It is the highest-leverage quality step after basic retrieval works.

Best practices:

- **Rerank the fused candidates and keep only the top few,** three to eight, to reach the model.
- **Use an open multilingual cross-encoder** such as BAAI/bge-reranker-v2-m3, which suits the low-resource trajectory. Serve it locally: in-process at L0, via a rerank endpoint (TEI) at L1 and above.
- **Apply a score threshold** so that when nothing is relevant, nothing passes, and generation declines rather than answering from noise.

Across levels: at L0, retrieval and reranking run in one process over an embedded store. At L1, Qdrant plus a TEI rerank service, with access filters enforced and thresholds tuned on the evaluation set. At L2, replicated retrieval and rerank services, monitored recall, and quantized indexes.

---

## 8. Context assembly and generation

### 8.1 Context assembly

**Goal.** Turn the reranked chunks into a prompt that fits the model's budget, orders information well, removes duplication, and makes the answer auditable.

Best practices:

- **Budget tokens explicitly.** Reserve room for the system prompt, the query, and the answer, then fill the remainder with chunks in rank order, stopping before overflow. Do not assume the chunks fit.
- **Order for attention.** Models attend most strongly to the start and end of a long context and most weakly to the middle. Place the highest-ranked chunk last, nearest the question, or split the strongest chunks to the two ends.
- **Deduplicate.** Overlapping chunks and near-duplicates waste budget; drop them by content hash or high similarity before assembly.
- **Label every chunk with a citation id and its source,** so the model can cite by id and a reviewer can trace each claim back to a passage. This traceability is the non-negotiable property for educational use. Keep the original (un-augmented) chunk text for display and citation even if an augmented version was used for retrieval.
- **Instruct grounding and refusal.** Tell the model to answer only from the provided passages, to cite the passages it uses by id, and to state plainly when the passages do not contain the answer, using no outside knowledge. Pair this with the retrieval threshold so that an empty candidate set yields an explicit "not in the corpus" rather than an invented answer.

### 8.2 Generation and serving

Serve generation behind an OpenAI-compatible endpoint so the same client code runs across engines and levels.

Best practices:

- **Default serving engine: vLLM.** OpenAI-compatible, broad model and hardware support, permissively licensed, with paged attention for concurrency.
- **Strong alternative for RAG: SGLang.** Its prefix caching processes a stable system prompt and repeated context once across requests, which fits the RAG access pattern, and it tends to lead on throughput for smaller models. Choose it when prefix reuse is high.
- **CPU or small hardware: llama.cpp's server.** Prototyping: Ollama.
- **Avoid TGI for new builds;** it entered maintenance in late 2025, and Hugging Face now points to vLLM, SGLang, and llama.cpp.
- **Keep temperature low** for factual educational drafting.

Across levels: at L0, the whole retrieve-rerank-assemble-generate flow runs in one process against Ollama. At L1, vLLM plus TEI plus Qdrant run as composed services behind a thin API. At L2, vLLM or SGLang with multi-GPU and replicas, the pipeline running as a service.

---

## 9. GraphRAG and graph-augmented retrieval

Standard vector RAG retrieves passages by similarity. It is strong at local, fact-lookup questions ("what does the corpus say about X") and weak at two things: multi-hop relational questions that require connecting facts spread across many documents, and global questions that require synthesizing across the whole corpus ("what are the main themes," "how do these accounts relate"). GraphRAG addresses both by building an explicit graph of entities and relationships from the corpus and querying over that structure rather than, or alongside, the vector index.

This is worth a careful treatment here for two opposite reasons. Much community and cultural knowledge is inherently relational: kinship, place, role, season, and the links between people, stories, and land. A graph representation can model those relationships in a way that flat similarity search cannot, which makes GraphRAG genuinely appealing for this domain. At the same time, GraphRAG's core mechanism, connecting dispersed facts and synthesizing across documents, is exactly the mechanism by which restricted knowledge can be reconstructed from individually permitted fragments. So GraphRAG is simultaneously the most relevant advanced technique and the highest-sovereignty-risk one. Both halves are true and both are stated below.

### 9.1 How it works

The index-time pipeline adds, on top of chunking and embedding:

- **Entity and relationship extraction.** An LLM reads each chunk and extracts entities (people, places, roles, events, concepts) and the relationships between them, usually with short descriptions. This is many LLM calls, one or more per chunk, and is the expensive part.
- **Graph construction.** Extracted entities and relationships are merged across the corpus into a single graph, with duplicate entities resolved and relationship descriptions aggregated.
- **Community detection.** A graph clustering algorithm (Leiden is the common choice) partitions the graph into nested communities of densely related entities, producing a hierarchy from broad to specific.
- **Community summaries.** An LLM writes a summary of each community at each level of the hierarchy. These summaries are what make global, corpus-level questions answerable.

The query-time pipeline offers two modes:

- **Local search,** for questions centered on specific entities: find the relevant entities, gather their neighborhood in the graph plus the associated source chunks, and generate from that. This is the multi-hop, relational strength.
- **Global search,** for corpus-level questions: run the question against the community summaries in a map-reduce fashion (partial answers from each relevant summary, then a combined answer). This is the synthesis strength that flat RAG lacks.

A common and sensible deployment is hybrid: keep vector RAG as the default for ordinary lookups, and route only relational or global questions to the graph, because the graph is expensive to build and maintain and is overkill for simple retrieval.

### 9.2 Implementations

The well-known reference is Microsoft's GraphRAG, which established the entity-extraction, community-detection, and local-versus-global-search pattern. Lighter and faster variants exist, including LightRAG and nano-graphrag, which reduce indexing cost. Property-graph databases such as Neo4j, paired with a vector index, support graph-plus-vector retrieval directly. The tooling moves quickly, so treat specific projects as substitutable and the pattern (extract, build, cluster, summarize, then local or global search) as the stable part.

### 9.3 Costs and honest limitations

- **Indexing is expensive.** Extraction and summarization are many LLM calls over the whole corpus; for a community running everything locally, this is real compute and time, and it must be redone, at least partially, when the corpus changes.
- **Extraction quality bounds everything.** The graph is only as good as the LLM's extraction. A weaker local model produces a noisier graph, and errors propagate into every downstream answer. Evaluate the extracted graph, not just the final answers.
- **The ontology is imposed.** The entities and relationship types the model extracts reflect the categories the model learned elsewhere. Applied to community knowledge, this can flatten or mis-frame relationships that do not fit those default categories. This is the "whose categories" problem made concrete and is a governance question, not a tuning detail (Section 9.4).
- **More moving parts.** A graph store, an extraction pipeline, and the summary hierarchy are additional components to operate, version, and keep in sync with the source corpus.
- **Evaluation is harder.** Global answers have no single right passage to check against, so faithfulness is harder to measure than in passage-level RAG.

### 9.4 Sovereignty considerations specific to GraphRAG

GraphRAG adds surface beyond the lifecycle map in Section 10, and the additions are not minor:

- **Extraction reinterprets the corpus.** The extraction step runs the entire corpus through an LLM and re-represents it as entities and relationships under an imposed ontology. That re-representation is a new act of interpretation over community knowledge, and the schema it produces encodes a worldview. The entity and relationship types, and ideally a sample of the extracted graph, warrant community review before the graph is trusted or used.
- **The graph and the summaries are new derivative artifacts** that synthesize and relate knowledge across documents. They carry the corpus's classification and custody rules and must be protected, versioned, and disposed of like the corpus and the vector index, not treated as neutral byproducts (Section 10.12).
- **The compositional leak risk is amplified, by design.** Connecting dispersed facts is the feature. The same feature can assemble restricted knowledge from permitted fragments more readily than flat retrieval does, and community summaries are aggregations that may surface patterns the community considers sensitive even when no single source is. For this reason, building a graph over restricted material deserves particular caution, and in many cases the graph should be built only over open material, or not at all over the most sensitive collections.
- **Extraction and summarization must run on local models,** inside the boundary, like every other model in the pipeline. Sending the corpus to a hosted model for extraction is the same corpus-exfiltration leak as a hosted embedding API, at larger scale.

Across levels: GraphRAG is not an L0 default. Prototype the extraction and a small graph at L0 to judge quality and ontology fit. Introduce it at L1 only where relational or global queries justify the cost, built offline over open material. At L2, operate it as a maintained, versioned, access-scoped capability with the graph and summaries under the same custody and review as the corpus.

---

## 10. The data sovereignty surface

Framework-neutral by design: it does not say what the policy should be, only where each policy decision binds to the running system, the risk if it is left unaddressed, and the control available there. "The framework decides" marks a real handoff to the community's authority.

| #     | Lifecycle stage                | Consideration                                                                                         | Risk if unaddressed                                                                                           | Mitigation / where it binds                                                                                                                                           |
| ----- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1  | Acquisition and consent        | Consent to record is not consent to ingest into a recombining system                                  | Unauthorized use; no way to withdraw                                                                          | Treat ingestion as its own consent question; store a consent reference in provenance (Section 4); make per-source delete-and-reindex tested (Sections 4, 8)           |
| 10.2  | Curation and classification    | Which material is eligible, at what access level                                                      | Sensitive material ingested by default                                                                        | Authority-gated classification producing a per-source label carried as chunk metadata; excluded material never enters                                                 |
| 10.3  | Storage and possession         | Where bytes and derived artifacts physically live                                                     | "Local" assumed but not verified; index on uncontrolled infrastructure                                        | Community-controlled hosting; encryption at rest; documented custody of corpus, index, graph, and backups                                                             |
| 10.4  | Parsing and normalization      | Parsing creates derivative copies                                                                     | Intermediate copies leak to temp dirs, caches, logs                                                           | Keep intermediates in-boundary with source classification and retention; clean transient files                                                                        |
| 10.5  | Chunking                       | Fragments lose the context that governs appropriateness                                               | Out-of-context fragments become independently retrievable                                                     | Carry classification on every chunk; filter at chunk level; keep context-dependent passages out of the retrievable set                                                |
| 10.6  | Embedding                      | May send text out; embeddings are derivative, not anonymized                                          | Hosted embedding API exfiltrates the corpus (most common leak)                                                | Serve embeddings locally; verify with egress monitoring; record model provenance; protect vectors as data (10.7)                                                      |
| 10.7  | Indexing                       | The index is a derivative artifact; inversion can reconstruct text                                    | Index treated as a safe opaque blob and under-protected                                                       | Apply corpus classification, custody, and access rules to index and backups; separate indexes per access level                                                        |
| 10.8  | Retrieval and access control   | Who may query, and what scope                                                                         | A worded query surfaces restricted content                                                                    | Authenticate every caller; map to permitted collections; enforce as a pre-retrieval filter and separate collections; default-deny                                     |
| 10.9  | Generation                     | Outside model; outputs are new artifacts; compositional leak                                          | Restricted knowledge reconstructed from permitted fragments                                                   | Exclusion over restriction; separated corpora and indexes; grounding and citations; mandatory output review; no reliance on automatic "refusal"                       |
| 10.10 | Graph extraction and summaries | Extraction re-represents the corpus under an imposed ontology; the graph synthesizes across documents | Worldview imposed silently; compositional leak amplified; sensitive aggregate patterns surfaced (Section 9.4) | Community review of ontology and sample graph; run extraction on local models; build graphs over open material; protect graph and summaries as corpus-class artifacts |
| 10.11 | Output and downstream use      | Generated material is community-derived                                                               | Published under default (open or individual) terms that misfit collective knowledge                           | Apply framework terms to outputs; decide ownership and permitted use before publication; human review in the path                                                     |
| 10.12 | Logging and telemetry          | Query and passage logs are sensitive content; frameworks phone home                                   | Sensitive content accumulates in "ops" logs or leaves via telemetry                                           | Logs in-boundary under corpus rules; minimize, redact, short retention; disable or locally sink all telemetry; verify egress                                          |
| 10.13 | Model and system artifacts     | Weights, fine-tunes, embeddings, indexes, graphs have provenance                                      | Shared as ordinary open assets, detached from data terms                                                      | Provenance per artifact; apply framework terms to community-derived artifacts including fine-tunes and graphs                                                         |
| 10.14 | Hosting and infrastructure     | Where it runs and who operates it                                                                     | Sovereignty asserted at the data layer, undermined by a third-party operator                                  | Prefer community-controlled hosting; make third-party access, jurisdiction, and custody explicit; control egress                                                      |
| 10.15 | Maintenance and personnel      | Who holds admin and data access over time                                                             | Key-person or contractor concentration; capability leaves with a person                                       | Least-privilege, reviewed; runbooks keep capability in-community; named owner with backstop; offboarding revokes and rotates                                          |
| 10.16 | Decommissioning                | Fate of data and all derivatives at shutdown                                                          | Indexes, backups, graphs, fine-tunes, logs persist after "deletion"                                           | A plan enumerating every artifact (corpus, intermediates, index, graph, summaries, backups, models, logs, eval sets) with repatriation or destruction for each        |

The egress discipline behind several rows is concrete at the engine level: set the Hugging Face and Transformers offline environment variables and pre-stage tokenizers, because engines fetch them by default; run the embedding, rerank, and any extraction models inside the boundary, since the embedding step is the most frequent air-gap break, usually discovered as a DNS query to a cloud API from a supposedly local pipeline; and stub or locally sink framework telemetry, all verified with network monitoring.

---

## 11. Evaluation

Build the evaluation harness before tuning anything, and gate changes on it.

Best practices:

- **Measure the right things.** Context precision and recall (did retrieval surface the right passages), faithfulness (does the answer follow from the retrieved passages rather than invent), and answer relevance. RAGAS or an equivalent framework computes these.
- **The golden set is community-owned and itself sensitive:** a reviewed set of representative questions with known good passages and acceptable answers. Treat it with the same custody as the corpus.
- **Gate on regressions.** Run the harness on every change to chunking, embedding model, retrieval parameters, reranker, prompt, or generation model, and block regressions. Changing the embedding model forces a full re-index, so version embeddings and indexes together.
- **Evaluate the graph separately** where GraphRAG is used: the quality of extracted entities and relationships, and the faithfulness of global answers, which have no single source passage to check against.

Across levels: a handful of questions run by hand at L0; a maintained golden set run before each release at L1; the harness in CI with regression gates and per-component recall monitoring at L2.

---

## 12. Deploying per level

**L0, local development.** One process or notebooks: an in-process embedding model, an embedded store (LanceDB or Chroma), an in-process cross-encoder reranker, and Ollama for generation. No gateway. Iterate on chunking, prompts, and the evaluation set.

**L1, single-node pilot or production.** Components run as services on one owned machine: Qdrant, a TEI service for embeddings, a TEI service for reranking, and vLLM for generation, with a thin API behind a gateway that authenticates callers and maps them to permitted collections. Pin versions; keep configuration in version control; inject secrets via the environment, never via command-line arguments, which leak into process listings and audit logs; control and monitor egress; export metrics to a local Prometheus and Grafana; back up corpus and index under the same custody rules. The graph layer, if used, is built offline over open material.

**L2, full-scale, hardened, or air-gapped.** Orchestrated on Kubernetes with the GPU operator, replicas for the embedding, rerank, and generation services, autoscaling, RBAC or SSO at the gateway, audit logging, tracing, and high availability on the vector store. For air-gapped operation, pre-stage all weights, tokenizers, the embedding, rerank, and extraction models, container images, and packages inside the enclave; set the offline environment variables; stub telemetry; verify with egress monitoring; and bring updates in on signed physical media on a deliberate cadence.

---

## 13. Operating and using the system

- **The system drafts; people decide.** Every output is a draft for a knowledge keeper or educator to review, correct, and approve before it reaches a learner. This is the permanent operating mode, not a launch-phase caution.
- **Preserve traceability end to end.** Each draft carries citations to source chunks; a claim that cannot be traced to real passages is a sign the model invented it, so discard rather than patch.
- **Scope to strengths:** retrieval and surfacing, summarizing provided text, repetitive drafting at scale, and, where the graph is built, relational and corpus-level questions. Keep the system away from tasks that require authority it lacks, such as interpreting meaning or deciding significance.
- **Correct flattening.** Models smooth distinctive voices into a generic register and resolve ambiguity that was meant to remain open; restoring voice is editorial work, not optional polish.

---

## 14. Limitations to state plainly

- **Hallucination is not fully solvable.** Measure faithfulness and review outputs; never trust an answer because it reads well.
- **Fluency is decoupled from accuracy.** A wrong answer reads as smoothly as a right one, the central risk for educational use.
- **Retrieval fails quietly.** Reranking and thresholds reduce but do not remove the case where the system answers confidently from the wrong passages.
- **The compositional leak problem.** Excluding sensitive documents does not prevent reconstruction from permitted fragments, and GraphRAG amplifies this by design (Section 9.4). The controls are architectural and procedural (exclusion over restriction, separated corpora and indexes, query-time access enforcement, mandatory review, and caution with graphs over sensitive material), not a model setting. Treat any automatic "refusal" of sensitive content as unproven.
- **The low-resource language path is not a configuration change.** Prefer retrieval before generation. Move to a multilingual embedding model and evaluate it for the target language specifically rather than assuming. Expect tokenization to fight morphologically rich and polysynthetic languages, much of it an artifact of word-level vocabularies and unequal training data rather than anything intrinsic to the language. Bilingual material is leverage. The evaluation set is itself low-resource and needs fluent-speaker authority. Realistic near term: strong retrieval over existing English and bilingual material now; human-reviewed retrieval in the target language next; reliable generation in a low-resource language last, approached slowly.

---

## 15. Checklist by level

**L0 done when:** the full retrieve, rerank, assemble, and generate flow runs locally; chunking and prompts are sane on real documents; a small evaluation set exists.

**L1 done when:** components run as pinned, version-controlled services; hybrid retrieval is access-filtered, with reranking and thresholds; the gateway maps callers to permitted collections, default-deny; egress is controlled and monitored; embedding, rerank, and generation are all served locally with no hosted-API calls in the data path; restricted and open material live in separate collections; per-source delete-and-reindex is tested; the golden-set evaluation runs before releases; metrics and backups are in place.

**L2 done when:** the system is replicated and autoscaled; RBAC or SSO and audit logging are in place; the air-gapped option is verified (weights, tokenizers, embedding, rerank, and extraction models, images, and packages pre-staged; offline environment variables set; telemetry stubbed; egress monitored); evaluation runs in CI with regression gates; every Section 10 stage has an owner and a community decision; compositional-leak controls are in place with no reliance on automatic refusal, including caution on graphs over sensitive material; output ownership and permitted use are decided before publication; and a decommissioning plan enumerates and disposes of every artifact, the graph and summaries included.

---

## 16. References

**Serving.** vLLM and SGLang (OpenAI-compatible production engines; SGLang's prefix caching suits RAG); llama.cpp and Ollama for prototyping and CPU; TEI and Infinity for serving embedding and rerank models. TGI has been in maintenance since late 2025, with Hugging Face recommending vLLM, SGLang, and llama.cpp.

**Retrieval and models.** Qdrant, Milvus, Weaviate, pgvector, LanceDB for stores; BAAI/bge-m3 (dense, sparse, and multi-vector, multilingual, MIT-licensed) and English alternatives; BAAI/bge-reranker-v2-m3 as the cross-encoder; local BM25 or SPLADE for the sparse branch; Reciprocal Rank Fusion for hybrid combination.

**GraphRAG.** Microsoft GraphRAG and the local-to-global query-focused summarization approach behind it; LightRAG and nano-graphrag as lighter variants; Neo4j or another property-graph store paired with a vector index for graph-plus-vector retrieval. Leiden community detection for the clustering step.

**Parsing and evaluation.** Docling and unstructured for layout-aware parsing; RAGAS for context precision and recall, faithfulness, and answer relevance.

**Air-gapped practice.** Pre-stage weights and tokenizers; set the offline environment variables; keep embedding, rerank, and extraction models in-boundary; disable framework telemetry; verify with egress monitoring.

**Data sovereignty (the community supplies the framework; these are examples an implementer may be handed, not a prescription).** FNIGC OCAP principles; Global Indigenous Data Alliance CARE Principles; Te Hiku Media and Papa Reo Kaitiakitanga License; Local Contexts TK and BC Labels and Mukurtu CMS for provenance labeling and graded access.

---

_This guide describes a system, how to build it, and the surface where governance attaches to it. It does not define any community's policy. Every point in Section 10 marked "the framework decides" is a real handoff to the community's authority, and the system should be built to enforce exactly what that authority specifies and nothing more._
