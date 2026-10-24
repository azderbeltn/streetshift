# Moss — saved documentation (StreetShift)

Fetched: 2026-10-24

Sources:
- https://www.moss.dev/llms-full.txt (full content, Part A)
- https://docs.moss.dev/llms.txt (doc index) and individual pages at https://docs.moss.dev/docs/<path>.md (Part C)
- https://github.com/usemoss/moss README, sdks/python/sdk/README.md, sdks/javascript/sdk/README.md and SDK samples (downloaded from codeload.github.com, HEAD) (Part B, D)

## Quick facts (verified from the sources below)

- Python package: `pip install moss` / `uv add moss` — latest on PyPI at fetch time: **1.21.0** (released 2026-10-23). Import: `from moss import MossClient, DocumentInfo, QueryOptions` (as used in the LiveKit starter).
- JS/TS package: `npm install @moss-js/moss` — latest on npm at fetch time: **1.21.0**. (Browser SDK: `@moss-dev/moss-web`.)
- Auth env vars: `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` (from https://portal.usemoss.dev).
- Default model id used in the starter: `moss-minilm` (env `MOSS_MODEL_ID`).
- Hybrid search: `alpha` in QueryOptions; `1.0` = pure semantic, `0.0` = pure keyword (BM25), default `0.8`.
- Free tier: ~60 voice-minutes/month and up to 3 indexes (per the LiveKit starter README; see Pricing page below for current numbers).
- Python SDK changelog (top entries) is in Part D; the full docs changelog was 334 KB and is NOT included.

---

# Part A — https://www.moss.dev/llms-full.txt (verbatim)

# Moss — Complete Technical Reference for AI Agents

> Moss is a real-time semantic search runtime for AI agents, voice agents, copilots, and multimodal apps. Sub-10ms lookups, zero infrastructure. Built in Rust and WebAssembly. Backed by Y Combinator.
> This document contains everything an AI coding agent (like Claude Code, Cursor, GitHub Copilot, etc.) needs to help a developer integrate Moss into their codebase.

---

## 1. What is Moss?

Moss is the runtime for real-time semantic search in conversational apps. It delivers sub-10ms lookups and instant index updates without extra infrastructure. It runs in the browser, on-device, or in the cloud — wherever your agent lives — so search feels native.

Connect your data once; Moss packages, distributes, and keeps indexes fresh.

Key properties:
- Sub-10ms lookups with instant updates
- No infra to run; local-first with optional cloud sync
- Browser, device, or cloud — same API
- Privacy by architecture: data stays on-device by default
- Built in Rust and WebAssembly for maximum performance
- Trusted by 500+ teams including Microsoft, EPAM, UC Berkeley, Carnegie Mellon, Podium, and Stanford

### The Problem Moss Solves

Agents make dozens of lookups per task. At 100–500ms each, that's seconds of dead time on every turn, every user. With a remote database, your context is only as fresh as your last sync job. Moss runs search inside your agent runtime to eliminate this latency.

### Where Moss Shines

- Sub-10ms answers for docs/FAQ/search
- Ground agents with your data without centralizing user info
- Local or hybrid embeddings; minimal infra
- Voice agents & copilots: sub-10ms context retrieval for real-time conversation
- Docs & knowledge search: instant semantic search inside help centers and knowledge bases
- On-device & edge apps: lightweight runtime for browsers, mobile apps, desktop tools. Works offline, syncs when connected
- AI-native platforms: drop into any agent framework with built-in A/B testing for embeddings

---

## 2. Installation

### JavaScript / TypeScript

```bash
npm install @moss-dev/moss
```

The npm package name is `@moss-dev/moss`.

### Python

```bash
pip install moss
```

The PyPI package name is `moss`. The import name is `moss`.

### Prerequisites

- Node.js 16+ (for JavaScript/TypeScript)
- Python 3.8+ (for Python)
- Valid Moss project credentials (MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

---

## 3. Authentication

Moss uses project-based authentication with two credentials:
- `MOSS_PROJECT_ID`: Your project identifier
- `MOSS_PROJECT_KEY`: Your project authentication key

### Getting Credentials

1. Sign up at https://portal.usemoss.dev
2. Confirm your email and sign in
3. From the portal, click "Create Index" and copy your Project ID and Project Key

### Setting Environment Variables

```bash
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

### Initializing the Client

**TypeScript:**
```typescript
import { MossClient } from '@moss-dev/moss';

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!
);
```

**Python:**
```python
import os
from moss import MossClient

client = MossClient(
    os.getenv("MOSS_PROJECT_ID"),
    os.getenv("MOSS_PROJECT_KEY")
)
```

Authentication is used for optional cloud features like syncing or hosted embedding models. Local mode requires no network access after initial index creation.

---

## 4. Core Concepts

### Index
A searchable structure that powers fast, local search. You add documents, Moss builds an efficient index for sub-10ms queries. Supports multiple indexes per project.

### Document Schema
Each document has:
- `id` (string): Unique identifier. Upserts replace matching ids; keep ids stable for updates.
- `text` (string): The searchable content.
- `metadata` (optional string map): Key-value pairs for filtering (e.g., category, lang, tags).

### Embeddings
Semantic vector representations of text. Can be generated locally or via a remote model, then stored alongside your index.

Available models:
- `moss-minilm` (default): Fast, lightweight, ideal for edge/offline use
- `moss-mediumlm`: Higher accuracy with reasonable performance

Use `moss-minilm` for speed-first, edge/offline use. Use `moss-mediumlm` when you need higher recall/precision.

### Chunking Best Practices
- Aim for ~200–500 tokens per chunk
- Overlap 10–20% to preserve context continuity
- Normalize whitespace and strip boilerplate
- Smaller chunks improve recall; overlap preserves context

### Retrieval
How results are fetched. Options include:
- Vector similarity (pure semantic)
- Keyword/BM25 (pure keyword)
- Hybrid (best of both, controlled via alpha parameter)

Retrieval knobs:
- `top_k`: Number of results to return
- `alpha`: Blend semantic (1.0) vs keyword (0.0); defaults to semantic-heavy (~0.8)
- Filters: Constrain by metadata (e.g., category, lang)
- Rerank: Reorder top-k for precision

### Storage & Sync
Indexes are stored on-device. Optionally enable background sync to cloud for backup and sharing. Export/import indexes periodically for disaster recovery.

### Client Lifecycle
Create index → upsert docs → load → query → delete when done.

### Performance Expectations
- Sub-10ms local queries (hardware-dependent)
- Sync is optional; compute stays on-device
- Without loadIndex(): queries go to cloud API (~100-500ms)
- With loadIndex(): queries run entirely in-memory (~1-10ms)

---

## 5. Quickstart — Complete Working Examples

### TypeScript Quickstart

```typescript
import { MossClient, DocumentInfo } from '@moss-dev/moss';

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!
);

const indexName = "faqs";

const documents: DocumentInfo[] = [
  {
    id: 'doc1',
    text: 'How do I track my order? You can track your order by logging into your account.',
    metadata: { category: 'shipping' }
  },
  {
    id: 'doc2',
    text: 'What is your return policy? We offer a 30-day return policy for most items.',
    metadata: { category: 'returns' }
  },
  {
    id: 'doc3',
    text: 'How can I change my shipping address? Contact our customer service team.',
    metadata: { category: 'support' }
  }
];

// Create the index (uses moss-minilm by default)
await client.createIndex(indexName, documents);

// Load index into memory for fast local queries
await client.loadIndex(indexName);

// Query
const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 });
console.log(results.docs[0].id);    // "doc2"
console.log(results.docs[0].text);  // "What is your return policy?..."
console.log(results.docs[0].score); // ~0.88
```

### Python Quickstart

```python
import os
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions

client = MossClient(
    os.getenv("MOSS_PROJECT_ID"),
    os.getenv("MOSS_PROJECT_KEY")
)

index_name = "faqs"

documents = [
    DocumentInfo(
        id="doc1",
        text="How do I track my order? You can track your order by logging into your account.",
        metadata={"category": "shipping"}
    ),
    DocumentInfo(
        id="doc2",
        text="What is your return policy? We offer a 30-day return policy for most items.",
        metadata={"category": "returns"}
    ),
    DocumentInfo(
        id="doc3",
        text="How can I change my shipping address? Contact our customer service team.",
        metadata={"category": "support"}
    ),
]

async def main():
    # Create index with moss-minilm (default); use "moss-mediumlm" for higher accuracy
    await client.create_index(index_name, documents, "moss-minilm")

    # Load index into memory for fast local queries
    await client.load_index(index_name)

    # Query with hybrid search (alpha=0.6 means 60% semantic, 40% keyword)
    results = await client.query(index_name, "How do I return a damaged product?", QueryOptions(top_k=3, alpha=0.6))

    print(f"  ID: {results.docs[0].id}")
    print(f"  Text: {results.docs[0].text}")
    print(f"  Score: {results.docs[0].score}")

asyncio.run(main())
```

### Expected Output

```json
{
  "id": "doc2",
  "score": 0.88,
  "text": "What is your return policy? We offer a 30-day return policy for most items."
}
```

---

## 6. JavaScript/TypeScript SDK — Full API Reference

Package: `@moss-dev/moss`

### MossClient Class

```typescript
import { MossClient } from '@moss-dev/moss';
const client = new MossClient(projectId: string, projectKey: string);
```

### Methods

#### createIndex(indexName, docs, options?)
Creates a new index with the provided documents. Handles the full flow: init → upload → build → poll until complete.

```typescript
const result = await client.createIndex('knowledge-base', [
  { id: 'doc1', text: 'Introduction to AI' },
  { id: 'doc2', text: 'Machine learning basics' }
], {
  onProgress: (p) => console.log(`${p.status} ${p.progress}%`),
});
```

Parameters:
- indexName (string): Name of the index to create
- docs (DocumentInfo[]): Documents, optionally with pre-computed embeddings
- options? (CreateIndexOptions): Optional model ID and progress callback

Returns: Promise<MutationResult>
Throws: If the index already exists or creation fails.

#### loadIndex(indexName, options?)
Downloads an index from the cloud into memory for fast local querying (~1-10ms instead of ~100-500ms).

```typescript
// Simple load
await client.loadIndex('my-index');

// Load with auto-refresh to keep index up-to-date
await client.loadIndex('my-index', {
  autoRefresh: true,
  pollingIntervalInSeconds: 300, // Check cloud every 5 minutes
});
```

Parameters:
- indexName (string): Name of the index to load
- options? (LoadIndexOptions): Optional auto-refresh settings

Returns: Promise<string>

#### query(indexName, query, options?)
Performs semantic similarity search. If index is loaded via loadIndex(), runs in-memory. Otherwise falls back to cloud.

```typescript
const results = await client.query('knowledge-base', 'machine learning');
results.docs.forEach(doc => {
  console.log(`${doc.id}: ${doc.text} (score: ${doc.score})`);
});
```

Parameters:
- indexName (string): Name of the index to search
- query (string): The search query text
- options? (QueryOptions): topK (default: 5), embedding overrides

Returns: Promise<SearchResult>

#### addDocs(indexName, docs, options?)
Adds or updates documents in an index asynchronously. Polls until rebuild is complete.

```typescript
const result = await client.addDocs('knowledge-base', [
  { id: 'new-doc', text: 'New content to index' }
], { upsert: true });
```

Parameters:
- indexName (string): Name of the target index
- docs (DocumentInfo[]): Documents to add or update
- options? (MutationOptions): upsert boolean, onProgress callback

Returns: Promise<MutationResult>

#### deleteDocs(indexName, docIds, options?)
Deletes documents from an index by their IDs asynchronously.

```typescript
const result = await client.deleteDocs('knowledge-base', ['doc1', 'doc2']);
```

#### getDocs(indexName, options?)
Retrieves documents from an index.

```typescript
// Get all documents
const allDocs = await client.getDocs('knowledge-base');

// Get specific documents
const specificDocs = await client.getDocs('knowledge-base', {
  docIds: ['doc1', 'doc2']
});
```

#### getIndex(indexName)
Gets information about a specific index.

```typescript
const info = await client.getIndex('knowledge-base');
console.log(`Index has ${info.docCount} documents`);
```

Returns: Promise<IndexInfo>

#### listIndexes()
Lists all available indexes.

```typescript
const indexes = await client.listIndexes();
indexes.forEach(index => {
  console.log(`${index.name}: ${index.docCount} docs`);
});
```

Returns: Promise<IndexInfo[]>

#### deleteIndex(indexName)
Deletes an index and all its data.

```typescript
const deleted = await client.deleteIndex('old-index');
```

Returns: Promise<boolean>

#### getJobStatus(jobId)
Gets the current status of an async job.

```typescript
const status = await client.getJobStatus(jobId);
console.log(`${status.status} — ${status.progress}%`);
```

Returns: Promise<JobStatusResponse>

### TypeScript Interfaces

```typescript
interface DocumentInfo {
  id: string;
  text: string;
  metadata?: Record<string, string>;
}

interface QueryOptions {
  topK?: number;       // default: 5
  embedding?: number[]; // optional pre-computed embedding
}

interface SearchResult {
  docs: QueryResultDocumentInfo[];
}

interface QueryResultDocumentInfo {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, string>;
}

interface IndexInfo {
  name: string;
  docCount: number;
  // additional fields may be present
}

interface MutationResult {
  jobId: string;
}

interface MutationOptions {
  upsert?: boolean;
  onProgress?: (progress: JobProgress) => void;
}

interface CreateIndexOptions {
  modelId?: string; // "moss-minilm" (default) or "moss-mediumlm"
  onProgress?: (progress: JobProgress) => void;
}

interface LoadIndexOptions {
  autoRefresh?: boolean;
  pollingIntervalInSeconds?: number;
}

interface GetDocumentsOptions {
  docIds?: string[];
}

interface JobProgress {
  status: string;
  progress: number;
}

interface JobStatusResponse {
  status: string;
  progress: number;
}
```

---

## 7. Python SDK Reference

Package: `moss` (pip install moss)
Import: `from moss import MossClient, DocumentInfo, QueryOptions, AddDocumentsOptions, GetDocumentsOptions`

### MossClient Class

```python
from moss import MossClient

client = MossClient(project_id: str, project_key: str)
```

### Methods (all async)

#### create_index(index_name, documents, model_id="moss-minilm")
```python
await client.create_index("faqs", documents, "moss-minilm")
```

#### load_index(index_name)
```python
await client.load_index("faqs")
```

#### query(index_name, query_text, options?)
```python
from moss import QueryOptions

# Hybrid search (60% semantic, 40% keyword)
results = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.6))

# Pure keyword
results = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.0))

# Pure semantic
results = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=1.0))

# With pre-computed embedding (BYOE)
results = await client.query("faqs", "return policy", QueryOptions(embedding=my_embedding, top_k=3))
```

The alpha parameter controls hybrid weighting:
- alpha=1.0: pure semantic (embeddings only)
- alpha=0.0: pure keyword (BM25 only)
- Values between 0 and 1 blend both (default is semantic-heavy, ~0.8)

#### add_docs(index_name, documents, options?)
```python
from moss import AddDocumentsOptions

await client.add_docs("my-index", [
    {"id": "doc-2", "text": "updated text"},
    {"id": "doc-3", "text": "new text"}
], AddDocumentsOptions(upsert=True))
```

#### get_docs(index_name, options?)
```python
from moss import GetDocumentsOptions

subset = await client.get_docs("my-index", GetDocumentsOptions(doc_ids=["doc-1", "doc-3"]))
```

#### delete_docs(index_name, doc_ids)
```python
await client.delete_docs("my-index", ["doc-3"])
```

#### delete_index(index_name)
```python
await client.delete_index("my-index")
```

### Python Types

```python
from moss import DocumentInfo, QueryOptions, AddDocumentsOptions, GetDocumentsOptions

# DocumentInfo
DocumentInfo(id="doc1", text="some text", metadata={"category": "faq"})

# QueryOptions
QueryOptions(top_k=3, alpha=0.6, filters={"category": "faq"})

# AddDocumentsOptions
AddDocumentsOptions(upsert=True)

# GetDocumentsOptions
GetDocumentsOptions(doc_ids=["doc-1", "doc-3"])
```

### Metadata Filtering (Python)

```python
# Filter by metadata during query
filtered = await client.query("my-index", "refund policy", QueryOptions(top_k=5, filters={"category": "faq", "lang": "en"}))
```

---

## 8. REST API Reference

Base URL: https://service.usemoss.dev/v1

The Moss Control Plane API powers all index lifecycle operations. It exposes a single authenticated control plane endpoint for managing indexes.

### Endpoints

#### Index Management
- Init Upload: Initialize an upload for index creation
- Start Build: Trigger index building after upload
- Get Job Status: Check async job progress
- Get Index: Retrieve index information
- List Indexes: List all indexes in the project
- Delete Index: Remove an index and all its data

#### Document Operations
- Add Documents: Add or upsert documents to an existing index
- Get Documents: Retrieve documents from an index
- Delete Documents: Remove documents by ID

Full REST API documentation: https://docs.moss.dev/docs/api-reference/v1/getting-started/introduction

---

## 9. Integration Guide — Voice Agent with LiveKit

Build a voice AI agent with sub-10ms semantic retrieval using Moss + LiveKit + OpenAI + Deepgram.

### Required Tools
- Moss (semantic search)
- LiveKit (voice infrastructure)
- OpenAI (LLM)
- Deepgram (speech-to-text)

### Step 1: Install Dependencies

```bash
pip install moss python-dotenv
```

### Step 2: Environment Setup

Create a .env file:

```
# LiveKit Credentials (for local dev)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Moss Credentials
MOSS_PROJECT_ID=your-moss-id
MOSS_PROJECT_KEY=your-moss-key

# AI Provider Keys
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=your-deepgram-key
```

### Step 3: Build the Knowledge Base

```python
import asyncio
import os
from dotenv import load_dotenv
from moss import MossClient, DocumentInfo

load_dotenv()

async def main():
    client = MossClient(
        project_id=os.environ["MOSS_PROJECT_ID"],
        project_key=os.environ["MOSS_PROJECT_KEY"]
    )
    index_name = os.getenv("MOSS_INDEX_NAME", "product-knowledge")

    docs = [
        DocumentInfo(id="1", text="Our return policy allows returns within 30 days of purchase with a receipt."),
        DocumentInfo(id="2", text="Standard shipping takes 3-5 business days. Express shipping takes 1-2 days."),
        DocumentInfo(id="3", text="Technical support is available 24/7 via email at support@example.com."),
    ]

    print(f"Creating index '{index_name}'...")
    await client.create_index(index_name, docs, model_id="moss-minilm")
    print("Index created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 4: Build the Voice Agent

Uses a Context Injection pattern — Moss is queried automatically on every user message and results are injected into the LLM context. This is faster than tool calling because there's no LLM "thinking" step to decide whether to search.

```python
import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit.plugins import openai, deepgram, silero
from livekit.plugins.turn_detector.english import EnglishModel
from livekit.agents import (
    JobContext, WorkerOptions, cli, ChatContext, ChatMessage, Agent, AgentSession,
)
from moss import MossClient

load_dotenv()

MOSS_PROJECT_ID = os.getenv("MOSS_PROJECT_ID")
MOSS_PROJECT_KEY = os.getenv("MOSS_PROJECT_KEY")
INDEX_NAME = os.getenv("MOSS_INDEX_NAME", "product-knowledge")

logger = logging.getLogger("moss-agent")

class MossSemanticRetrievalAgent(Agent):
    def __init__(self, moss_client: MossClient):
        super().__init__(
            instructions="""You are a helpful customer support voice assistant.
            You have access to a knowledge base which will be provided to you as context.
            Always answer the user's question based on the provided context.
            If the context doesn't contain the answer, politely say you don't know."""
        )
        self.moss = moss_client

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        user_query = new_message.text_content
        try:
            results = await self.moss.query(INDEX_NAME, user_query, top_k=5, alpha=0.8)
            if results.docs:
                context_str = "\n".join([f"- {d.text}" for d in results.docs])
                injection = f"Relevant context from knowledge base:\n{context_str}\n\nUse this to answer the user."
                turn_ctx.add_message(role="system", content=injection)
        except Exception as e:
            logger.error(f"Moss search failed: {e}", exc_info=True)
        await super().on_user_turn_completed(turn_ctx, new_message)

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    moss_client = MossClient(project_id=MOSS_PROJECT_ID, project_key=MOSS_PROJECT_KEY)
    await moss_client.load_index(INDEX_NAME)

    session = AgentSession(
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(),
        turn_detection=EnglishModel(),
        vad=silero.VAD.load(),
    )
    await session.start(agent=MossSemanticRetrievalAgent(moss_client), room=ctx.room)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

### Step 5: Run

```bash
# Terminal 1: Start LiveKit server
livekit-server --dev

# Terminal 2: Start agent
python agent.py download-files
python agent.py console
```

---

## 10. Deployment / Production Checklist

- Configure API keys via environment variables (never hardcode)
- Persist indexes to a durable path
- Monitor index size and query latency (track p50/p95)
- Enable sync (optional) and test offline mode
- Add health checks for embedding/runtime services
- Keep data local whenever possible
- Encrypt synced data at rest/in transit
- Log index lifecycle events (create/load/delete, rebuilds)
- Establish backup/export cadence for disaster recovery

---

## 11. Common Patterns

### Upsert Documents (Add or Update)

```python
await client.add_docs("my-index", [
    {"id": "doc-2", "text": "updated text"},
    {"id": "doc-3", "text": "new text"}
], AddDocumentsOptions(upsert=True))
```

### Metadata Filtering

```python
filtered = await client.query("my-index", "refund policy", 5, {
    "filters": {"category": "faq", "lang": "en"}
})
```

### Auto-Refresh Index (JS)

```typescript
await client.loadIndex('my-index', {
  autoRefresh: true,
  pollingIntervalInSeconds: 300,
});
```

### Multiple Indexes

```python
await client.create_index("faq-index", faq_docs, "moss-minilm")
await client.create_index("product-index", product_docs, "moss-mediumlm")
await client.load_index("faq-index")
await client.load_index("product-index")
```

---

## 12. Bring Your Own Embeddings (BYOE)

Moss supports custom embeddings — generate vectors with any external model (OpenAI, Cohere, a local model, etc.) and pass them directly. Moss stores and searches against your embeddings instead of generating its own.

### When to Use BYOE
- You already have an embedding pipeline and want consistency across your stack
- You need a domain-specific or fine-tuned embedding model (e.g., for aviation, medical, legal)
- You want to use a high-dimensional model like `text-embedding-3-large` for maximum recall

### Install

```bash
pip install moss openai python-dotenv
```

### Python — Full BYOE Example

```python
import os
import asyncio
from dotenv import load_dotenv
from moss import MossClient, DocumentInfo, QueryOptions
from openai import OpenAI

load_dotenv()

moss = MossClient(
    os.getenv("MOSS_PROJECT_ID"),
    os.getenv("MOSS_PROJECT_KEY")
)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text: str) -> list[float]:
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

async def main():
    index_name = "pilot-docs"

    # Index documents with your own pre-computed embeddings
    docs = [
        DocumentInfo(
            id="doc-1",
            text="Standard instrument departure procedures require...",
            embedding=get_embedding("Standard instrument departure procedures require...")
        ),
        DocumentInfo(
            id="doc-2",
            text="Weather minimums for IFR flight are defined as...",
            embedding=get_embedding("Weather minimums for IFR flight are defined as...")
        ),
    ]

    await moss.create_index(index_name, docs)

    # Load index into memory for sub-10ms queries
    await moss.load_index(index_name)

    # Query using your own embedding for the query too
    query_text = "what are the IFR weather minimums?"
    results = await moss.query(
        index_name,
        query_text,
        QueryOptions(embedding=get_embedding(query_text))
    )

    for doc in results.docs:
        print(f"[{doc.score:.3f}] {doc.id}: {doc.text[:80]}")

asyncio.run(main())
```

Full working example: https://github.com/usemoss/moss-samples/blob/main/python/custom_embedding_sample.py

### Key Points
- Pass `embedding` on each `DocumentInfo` at index creation time to use your vectors
- Pass `QueryOptions(embedding=...)` at query time so Moss compares against your embedding space
- You must use the same model for both indexing and querying — mixing models will degrade results
- The `model_id` parameter in `create_index` is ignored when all documents carry pre-computed embeddings

---

## 13. Pricing Summary

- Developer (Free): $5/month free credits, unlimited local queries, shared infra, community support
- Hobbyist ($30/mo): Continuous sync engine, unlimited projects & indexes, 3 concurrent sessions, file uploads
- Start-up ($200/mo): Hot path cloud search, 100 concurrent sessions, priority ingest, email support
- Enterprise (Custom): Custom scale, white glove onboarding, 99.9% SLA, SSO, 24/7 Slack support, SOC2 & HIPAA compliance

Full pricing details: https://www.moss.dev/pricing

---

## 14. Links & Resources

- Website: https://www.moss.dev
- Documentation: https://docs.moss.dev/docs
- Moss Portal (sign up / dashboard): https://portal.usemoss.dev
- GitHub: https://github.com/usemoss
- Sample Code: https://github.com/usemoss/moss-samples
- Discord Community: https://moss.link/discord
- Release Notes: https://docs.moss.dev/docs/changelog
- Privacy Policy: https://docs.moss.dev/docs/privacy
- Terms of Service: https://docs.moss.dev/docs/tos

---

## 15. Company

Moss is built by InferEdge Inc., based in San Francisco, CA. Backed by Y Combinator.
---

# Part B — usemoss/moss repository README.md (verbatim)

<!-- markdownlint-disable MD033 MD041 -->

<div align="center">

<img src="https://github.com/user-attachments/assets/25f92357-a670-4564-881d-e336f668c252" alt="Moss — Real-time semantic search for AI agents. Sub-10 ms." width="1200" />

<br /><br />

[![License](https://img.shields.io/badge/License-BSD_2--Clause_%2B_PolyForm_Shield-orange.svg)](#license)
[![PyPI](https://img.shields.io/pypi/v/moss?color=deepgreen)](https://pypi.org/project/moss/)
[![PyPI downloads](https://static.pepy.tech/personalized-badge/inferedge-moss-core?period=total&units=international_system&left_color=grey&right_color=blue&left_text=pypi+downloads)](https://pepy.tech/project/inferedge-moss-core)
[![npm](https://img.shields.io/npm/v/@moss-js/moss?color=deepgreen)](https://www.npmjs.com/package/@moss-js/moss)
[![npm downloads](https://img.shields.io/npm/dt/@moss-js/moss?label=npm+downloads&color=blue)](https://www.npmjs.com/package/@moss-js/moss)
[![Discord](https://img.shields.io/discord/1433962929526542346?logo=discord&logoColor=white&label=Discord&color=7B2FBE)](https://moss.link/discord)

[Website](https://moss.dev) · [Docs](https://docs.moss.dev) · [Discord](https://moss.link/discord) · [Blog](https://moss.dev/blog)

</div>

---

Moss is a sub-10 ms semantic search runtime built for Conversational AI agents. Hybrid retrieval (semantic + Keyword Search), built-in embeddings, metadata filtering, and a WebAssembly build that runs in the browser - all from a single SDK that embeds in your application.

No network hop on the hot path. No clusters to tune. Point the SDK at Moss Cloud, load your index, and query it in **under 10 ms**. Python, TypeScript, Elixir, and C.

![Moss Python walkthrough](https://github.com/user-attachments/assets/d826023d-92d6-49ac-8e5e-81cf04d409c5)

## Quickstart

**Before you start:** sign up at [moss.dev](https://moss.dev) for `project_id` and `project_key` - free tier available.

The snippets below need Python 3.10+ or Node.js 20+.

### Python

```bash
pip install moss
```

```python
from moss import MossClient, QueryOptions

client = MossClient("your_project_id", "your_project_key")

# Create an index and add documents
await client.create_index("support-docs", [
    {"id": "1", "text": "Refunds are processed within 3-5 business days."},
    {"id": "2", "text": "You can track your order on the dashboard."},
    {"id": "3", "text": "We offer 24/7 live chat support."},
])

# Load and query — results in <10 ms
await client.load_index("support-docs")
results = await client.query("support-docs", "how long do refunds take?", QueryOptions(top_k=3))

for doc in results.docs:
    print(f"[{doc.score:.3f}] {doc.text}")  # Returned in {results.time_taken_ms}ms
```

### TypeScript

```bash
npm install @moss-js/moss
```

```typescript
import { MossClient } from "@moss-js/moss";

const client = new MossClient("your_project_id", "your_project_key");

// Create an index and add documents
await client.createIndex("support-docs", [
  { id: "1", text: "Refunds are processed within 3-5 business days." },
  { id: "2", text: "You can track your order on the dashboard." },
  { id: "3", text: "We offer 24/7 live chat support." },
]);

// Load and query — results in <10 ms
await client.loadIndex("support-docs");
const results = await client.query("support-docs", "how long do refunds take?", { topK: 3 });

results.docs.forEach((doc) => {
  console.log(`[${doc.score.toFixed(3)}] ${doc.text}`); // Returned in ${results.timeTakenInMs}ms
});
```

## Why Moss?

**Most retrieval stacks call out to a remote vector database. The round trip alone runs 200–500 ms - enough to break a real-time conversation.**

Moss runs search and embedding *inside* your process. There's no network hop on the hot path, so query latency lands in the single digits - fast enough that retrieval disappears from the latency budget. If you're building a voice bot, a copilot, or any agent that talks to humans, that's the difference between a tool that feels alive and one that feels laggy.

### Benchmarks

End-to-end query latency (embedding + search) on 100,000 documents, 750 measured queries, top_k=5. Tested with Macbook pro (M4 Pro, 24GB).

| System | P50 | P95 | P99 | Mean |
|--------|-----|-----|-----|------|
| **Moss** | **3.1 ms** | **4.3 ms** | **5.4 ms** | **3.3 ms** |
| Pinecone | 432.6 ms | 732.1 ms | 934.2 ms | 485.8 ms |
| Qdrant | 597.6 ms | 682.0 ms | 771.4 ms | 596.5 ms |
| ChromaDB | 351.8 ms | 423.5 ms | 538.5 ms | 358.0 ms |

Moss includes embedding in the measurement — competitors use an external embedding service ([modal](https://modal.com/docs/examples/text_embeddings_inference)). Pinecone and Qdrant use cloud search.

> [Reproduce these benchmarks →](./benchmarks/)

Moss isn't a database! It's a **search runtime**. You don't manage clusters, tune HNSW parameters, or worry about sharding. You index documents, load them into the runtime, and query. That's it.

## Features

- **Sub-10 ms semantic search** - single-digit-ms p99 in our [benchmarks](#benchmarks)
- **Hybrid search** - semantic + keyword in a single query
- **Built-in embedding models** - no OpenAI key required (or bring your own)
- **Metadata filtering** - `$eq`, `$and`, `$in`, `$near` operators
- **Runs in the browser too** - separate WebAssembly SDK ([`@moss-dev/moss-web`](https://www.npmjs.com/package/@moss-dev/moss-web)) for client-side semantic search with no server
- **Database connectors** - ingest directly from SQLite, MongoDB, MySQL, and Supabase ([`packages/moss-data-connector/`](packages/moss-data-connector/))
- **CLI** - manage indexes and query from the terminal ([`moss-cli`](https://docs.moss.dev/docs/integrations/moss-cli))
- **SDKs** - Python (3.10+), TypeScript / Node.js (20+), Elixir, and C ([`libmoss`](https://github.com/usemoss/moss/releases))
- **Framework integrations** - LangChain, DSPy, LlamaIndex, Pipecat, LiveKit, Vapi, ElevenLabs, Strands Agents

## Examples

This repo contains working examples you can copy straight into your project:

```text
examples/
├── python/                  # Python SDK samples
│   ├── load_and_query_sample.py
│   ├── comprehensive_sample.py
│   ├── custom_embedding_sample.py
│   └── metadata_filtering.py
├── python-classification/   # Classification example
├── javascript/              # TypeScript SDK samples
│   ├── load_and_query_sample.ts
│   ├── comprehensive_sample.ts
│   └── custom_embedding_sample.ts
├── javascript-web/          # Browser / WASM SDK samples
├── c/                       # C SDK samples (libmoss)
├── go/                      # Go SDK samples
├── voice-agents/            # End-to-end voice agents (ambient + multi-agent)
│   ├── airline-pnr/         # Ambient retrieval; per-PNR Moss indexes, swap mid-call
│   └── mortgage-lending/    # Multi-agent flow with shared session state
└── cookbook/                # Framework integrations
    ├── langchain/           # LangChain retriever
    ├── dspy/                # DSPy module
    ├── crewai/              # CrewAI integration
    ├── haystack/            # Haystack retriever
    ├── autogen/             # AutoGen integration
    ├── mastra/              # Mastra retriever
    ├── langflow/            # Langflow drag-and-drop retriever
    ├── pydantic-ai/         # Pydantic AI integration
    ├── daytona/             # Daytona sandbox example
     └── vercel-ai-sdk/       # Vercel AI SDK RAG agent example

apps/
├── next-js/                 # Next.js semantic search UI
├── pipecat-moss/            # Pipecat voice agent with Moss retrieval
├── vapi-moss/               # Vapi voice agent with Moss retrieval
├── elevenlabs-moss/         # ElevenLabs voice agent with Moss retrieval
├── livekit-moss-vercel/     # LiveKit voice agent on Vercel
├── agora-moss/              # Agora Conversational AI MCP server with Moss retrieval
├── agora-custom-llm-moss/   # Agora custom-llm middleware (ambient + in-process tool loop)
├── ten-moss/                # TEN voice agent (ambient default + tool-call graph)
├── moss-llamaindex/         # LlamaIndex RAG backend + frontend
├── moss-bun/                # Bun runtime example
└── docker/                  # Dockerized examples (ECS/K8s pattern)

moss-live-labs/              # Experimental zone: prototypes and community demos
├── python/                  # Minimal Python quickstart + advanced query example
├── typescript/              # Minimal TypeScript quickstart + advanced query example
├── examples/                # Larger experiments (image search, voice agents)
│   ├── voice-agent/         # LiveKit + Moss voice assistant
│   ├── advanced-voice-agent/ # Persona impersonator built on a PDF knowledge base
│   └── image-search/        # FastAPI + React image search over COCO
└── community-demos/         # Community-contributed projects
    └── voice-agents/        # bharat-benefits, shoplabs-voice-agent
```

### Run the Python examples

```bash
cd examples/python
pip install -r requirements.txt
cp ../../.env.example .env   # Add your credentials
python load_and_query_sample.py
```

### Run the TypeScript examples

```bash
cd examples/javascript
npm install
cp ../../.env.example .env   # Add your credentials
npx tsx load_and_query_sample.ts
```

### Run the Next.js app

```bash
cd apps/next-js
npm install
cp ../../.env.example .env   # Add your credentials
npm run dev                  # Open http://localhost:3000
```

### Run the Pipecat voice agent

Sub-10 ms retrieval plugged into [Pipecat's](https://github.com/pipecat-ai/pipecat) real-time voice pipeline — a customer support agent that actually keeps up with conversation.

```bash
cd apps/pipecat-moss/pipecat-quickstart
# See README for setup and Pipecat Cloud deployment
```

### Run the fully-local voice agent (Ollama + Moss + Pipecat)

A privacy-first voice AI stack: **Ollama** for LLM inference, **Moss** for retrieval, **Pipecat** for real-time audio - the LLM and retrieval both run on your machine.

```bash
cd apps/pipecat-moss/ollama-local
docker compose up
```

Full API reference: [docs.moss.dev](https://docs.moss.dev).

## Integrations

| Framework | Status | Example |
|-----------|--------|---------|
| [LangChain](https://github.com/langchain-ai/langchain) | Available | [`examples/cookbook/langchain/`](examples/cookbook/langchain/) |
| [DSPy](https://github.com/stanfordnlp/dspy) | Available | [`examples/cookbook/dspy/`](examples/cookbook/dspy/) |
| [LlamaIndex](https://github.com/run-llama/llama_index) | Available | [`apps/moss-llamaindex/`](apps/moss-llamaindex/) |
| [CrewAI](https://github.com/crewAIInc/crewAI) | Available | [`examples/cookbook/crewai/`](examples/cookbook/crewai/) |
| [AutoGen](https://github.com/microsoft/autogen) | Available | [`examples/cookbook/autogen/`](examples/cookbook/autogen/) |
| [Haystack](https://github.com/deepset-ai/haystack) | Available | [`examples/cookbook/haystack/`](examples/cookbook/haystack/) |
| [Mastra](https://mastra.ai) | Available | [`examples/cookbook/mastra/`](examples/cookbook/mastra/) |
| [Pydantic AI](https://ai.pydantic.dev) | Available | [`examples/cookbook/pydantic-ai/`](examples/cookbook/pydantic-ai/) |
| [Pipecat](https://github.com/pipecat-ai/pipecat) | Available | [`apps/pipecat-moss/`](apps/pipecat-moss/) |
| [LiveKit](https://github.com/livekit/livekit) | Available | [`apps/livekit-moss-vercel/`](apps/livekit-moss-vercel/) |
| [Vapi](https://vapi.ai) | Available | [`apps/vapi-moss/`](apps/vapi-moss/) |
| [ElevenLabs](https://elevenlabs.io) | Available | [`apps/elevenlabs-moss/`](apps/elevenlabs-moss/) |
| [Agora](https://www.agora.io/) | Available | [`apps/agora-moss/`](apps/agora-moss/) (MCP) and [`apps/agora-custom-llm-moss/`](apps/agora-custom-llm-moss/) (custom-llm: ambient + tool-call) |
| [TEN Framework](https://github.com/ten-framework/ten-framework) | Available | [`apps/ten-moss/`](apps/ten-moss/) (ambient + tool-call) |
| [Strands Agents](https://github.com/strands-agents/sdk-python) | Available | [`packages/strands-agents-moss/`](packages/strands-agents-moss/) |
| [Langflow](https://github.com/langflow-ai/langflow) | Available | [`examples/cookbook/langflow/`](examples/cookbook/langflow/) |
| [Next.js](https://nextjs.org) | Available | [`apps/next-js/`](apps/next-js/) |
| [VitePress](https://vitepress.dev) | Available | [`packages/vitepress-plugin-moss/`](packages/vitepress-plugin-moss/) |
| [Vercel AI SDK](https://sdk.vercel.ai) | Available | [`examples/cookbook/vercel-ai-sdk/`](examples/cookbook/vercel-ai-sdk/) |
| [n8n](https://n8n.io) | Available | [`packages/n8n-nodes-moss/`](packages/n8n-nodes-moss/) |

## Architecture

![Moss runtime architecture](https://github.com/user-attachments/assets/7aebbedf-a467-48a4-be38-feddfa4f7d04)

Three parts:

- **Moss Cloud** - handles ingestion, document embedding, storage, and distribution. Point the SDK at it with a project ID and key.
- **Index** - your documents and their vectors, packaged as a single artifact that lives on Moss Cloud.
- **Runtime** - embedded in your application. It pulls indexes over HTTPS, holds them in memory, and serves queries locally.

Once an index is loaded, queries don't leave your process - that's where the sub-10 ms latency comes from. Document changes flow through Moss Cloud and the runtime stays in sync.

### Two ways to run the runtime

- **Server-side** - `moss` (Python) and `@moss-js/moss` (Node.js 20+) embed the runtime in your backend. Use this when your agent runs on a server.
- **Browser** - `@moss-dev/moss-web` is a WebAssembly build that downloads the index and runs queries entirely client-side, no server required. Use this for static sites, browser extensions, and offline-first apps. See [`examples/javascript-web/`](examples/javascript-web/).

The source and samples of each JavaScript, Python and Elixir SDK release are in [`sdks/`](sdks/).

## Contributing

<div align="center">
  <img src="https://github.com/user-attachments/assets/80b9dd1c-661c-4201-a1b4-9d191afa8e6b" alt="We welcome contributions!" width="1200" />
</div>

Here's where the community can have the most impact:

- **New SDK bindings** — Swift, Go, Elixir,...
- **Framework integrations** — CrewAI, Haystack, AutoGen
- **Reranking support** — plug in cross-encoder rerankers
- **Doc-parsing connectors** — PDF, DOCX, HTML, Markdown ingestion
- **Examples and tutorials** — if you build something with Moss, we'd love to feature it

See our [Contributing Guide](CONTRIBUTING.md) for setup instructions and our [Roadmap](ROADMAP.md) for what's planned.

Check out issues labeled [`good first issue`](https://github.com/usemoss/moss/labels/good%20first%20issue) to get started.

## Contributors

[![Contributors](https://contrib.rocks/image?repo=usemoss/moss)](https://github.com/usemoss/moss/graphs/contributors)

## Community

- [Discord](https://moss.link/discord) — ask questions, share what you're building
- [GitHub Issues](https://github.com/usemoss/moss/issues) — bug reports and feature requests
- [Twitter](https://x.com/usemoss) — announcements and updates

## License

The SDKs that Moss releases sync into [`sdks/`](sdks/) are licensed under the [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/): Swift now, as its `LICENSE.txt` states, and JavaScript, Python and Elixir from their next release, which replaces each folder's BSD `LICENSE` with a PolyForm Shield `LICENSE.txt`. The Go SDK in `sdks/go`, and code already contributed under the BSD 2-Clause License, stay under it. Everything else in this repository is under the [BSD 2-Clause License](LICENSE).

---

<div align="center">
  <sub>Built by the team at <a href="https://moss.dev">Moss</a> · Backed by <a href="https://www.ycombinator.com">Y Combinator</a></sub>
</div>

---

# Part C — docs.moss.dev pages (verbatim markdown; each page starts at its own "# Title" heading)

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/start/quickstart.md

# Quickstart

> Install, authenticate, create an index, and query it (JS/Python tabs)

Follow one path to a visible result. Choose your language tab.

## Prerequisites:

* Node.js 20.4+ or Python 3.10+
* Valid Moss project credentials (`MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`)
* JS: `@moss-js/moss`; Python: `moss`

**1. Install**

```bash JavaScript theme={null}
npm install @moss-js/moss
```

```bash Python theme={null}
pip install moss
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

> [!NOTE]
>
> Moss for Node moved from `@moss-dev/moss` to `@moss-js/moss` with 1.8.0. `@moss-dev/moss` is a frozen 1.7.1 package. Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to `@moss-js/moss` 1.9.0+ before then. The date will be announced in the changelog. `@moss-dev/moss-web` is the browser SDK and is not this package.

**2. Configure credentials**

From the Moss portal, copy your Project ID and create a key on the **API Keys** page. Set them as env vars:

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

**3. Create and query an index**

Save the JavaScript as `quickstart.mts` and run `npx tsx quickstart.mts` (the `.mts` extension lets it use top-level `await`), or save the Python as `quickstart.py` and run `python quickstart.py`:

```ts JavaScript theme={null}
import { MossClient, DocumentInfo } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const documents: DocumentInfo[] = [
  { id: 'doc1', text: 'How do I track my order? You can track your order by logging into your account.', metadata: { category: 'shipping' } },
  { id: 'doc2', text: 'What is your return policy? We offer a 30-day return policy for most items.', metadata: { category: 'returns' } },
  { id: 'doc3', text: 'How can I change my shipping address? Contact our customer service team.', metadata: { category: 'support' } },
]
const indexName = 'faqs'
await client.createIndex(indexName, documents, { modelId: 'moss-minilm' }) // default; use 'moss-mediumlm' for higher accuracy
await client.loadIndex(indexName)
const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })
console.log(results.docs[0])
```

```python Python theme={null}
import os
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions
client = MossClient(os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY"))
index_name = "faqs"
documents = [
    DocumentInfo(id="doc1", text="How do I track my order? You can track your order by logging into your account.", metadata={"category": "shipping"}),
    DocumentInfo(id="doc2", text="What is your return policy? We offer a 30-day return policy for most items.", metadata={"category": "returns"}),
    DocumentInfo(id="doc3", text="How can I change my shipping address? Contact our customer service team.", metadata={"category": "support"}),
]
async def main():
    await client.create_index(index_name, documents, "moss-minilm")  # default; use "moss-mediumlm" for higher accuracy
    await client.load_index(index_name)
    results = await client.query(index_name, "How do I return a damaged product?", QueryOptions(top_k=3, alpha=0.6))
    print(f"  ID: {results.docs[0].id}")
    print(f"  Text: {results.docs[0].text}")
    print(f"  Score: {results.docs[0].score}")
asyncio.run(main())
```

## Example output

```json theme={null}
{
  "id": "doc2",
  "score": 0.82,
  "text": "What is your return policy? We offer a 30-day return policy for most items."
}
```

> [!NOTE]
>
> `score` is each result's relevance to the query, from 0 to 1 (the value here is illustrative). See
> [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics) for what it means and the SDK version it needs.

> [!TIP]
>
> Need keyword-heavy results? Set `alpha` to `0.0` for pure keyword, `1.0` for pure semantic, or a blend in between (see [Hybrid Search](https://docs.moss.dev/docs/integrate/hybrid-search.md) for details).

## Next steps

You just created a cloud index and queried it. Moss does much more:

> **[Core concepts](https://docs.moss.dev/docs/start/core-concepts.md)**
>
> Indexes, embeddings, retrieval, sessions, and sync in one place.

> **[Sessions](https://docs.moss.dev/docs/integrate/sessions.md)**
>
> Local-first, real-time indexing during a live interaction.

> **[Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)**
>
> Blend semantic and keyword scoring with `alpha`.

> **[Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)**
>
> Narrow results with `$eq`, `$in`, `$near`, and more.

> **[Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)**
>
> Bring your own vectors instead of the built-in model.

> **[Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md)**
>
> Query several indexes at once for a global top-K.

> **[Data hydration & sync](https://docs.moss.dev/docs/build/data-hydration-sync.md)**
>
> Hydrate on-device indexes and keep them fresh.

> **[SDK Overview](https://docs.moss.dev/docs/reference/sdk.md)**
>
> Full per-language API: Python, JavaScript, Swift, Elixir, Browser, C.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/start/core-concepts.md

# Core Concepts

> Indexes, embeddings, retrieval, sessions, sync, and the rest of the Moss model.

This page defines the concepts you'll use across Moss. Most link to a How-it-works guide
where they go deeper.

## Index

A structure that powers fast, local search. You add documents and Moss builds an efficient
index for sub-10 ms queries. A project can hold many indexes.

### Document schema

* `id` (string), `text` (string), `metadata` (optional string map)
* Upserts replace matching `id`s; keep ids stable for updates

## Embeddings

Semantic vector representations of text. Moss embeds **on-device** with a built-in model, or
you can [bring your own vectors](https://docs.moss.dev/docs/integrate/custom-embeddings.md) using a `custom` model
(you then supply an `embedding` for every document and every query).

### Models

* `moss-minilm` (default): fast, lightweight, good for edge/offline
* `moss-mediumlm`: higher accuracy with reasonable performance
* `moss-litelm`: the on-device default on iOS
* `custom`: bring your own embedding vectors

### Chunking

* Uploaded files and web sources are chunked automatically; for your own documents, see [Chunking tips](https://docs.moss.dev/docs/integrate/indexing-data.md#chunking-tips)
* Smaller chunks improve recall; overlap preserves context continuity

## Loading

Querying always runs against an index held in memory. Load the index (or open a
[session](https://docs.moss.dev/docs/integrate/sessions.md)) before you query - there is no cloud-query-without-loading
path. You can also [load several indexes at once](https://docs.moss.dev/docs/integrate/multi-index-search.md)
for a single query, then unload them when done.

## Retrieval

How results are fetched, all over one query call:

* **Vector** (semantic) - matches on meaning
* **Keyword** (BM25) - matches on exact terms
* **[Hybrid](https://docs.moss.dev/docs/integrate/hybrid-search.md)** - blends both, tuned with `alpha` (1.0 semantic, 0.0 keyword, default 0.8)

### Retrieval knobs

* Result count: how many results to return
* `alpha`: the semantic/keyword blend
* `filter`: [metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md) with `$eq`, `$in`, `$near`, `$and`/`$or`, and more

Each result carries a relevance `score` from 0 to 1, and it is not the sort key: results stay in hybrid
order. See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics) for how it behaves and the SDK
version it needs.

## Multi-index search

Query several loaded indexes at once and get a single global top-K, each result tagged by its
source index. Useful when the answer is spread across separate corpora you keep as distinct
indexes. See [Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md).

## Sessions

A local-first index you read and write in real time, with no cloud round trip on any
operation. The workflow is create-resume-query-push: open a session by name, index documents
locally as they arrive, query in-memory, and optionally push the result to the cloud. Ideal
for indexing during a live interaction. See [Sessions](https://docs.moss.dev/docs/integrate/sessions.md).

## Storage, sync, and freshness

Indexes persist locally on the device; the cloud copy is the source of truth. Loading pulls a
local snapshot, and [hydration and auto-refresh](https://docs.moss.dev/docs/build/data-hydration-sync.md) keep a loaded
index current by polling for newer versions and hot-swapping with no query downtime. Pushing
uploads local changes back to the cloud.

## Cross-agent handoff

Because a session is just a named cloud index, one agent can push a conversation and another
can resume it by opening a session with the same name - across agents, channels, and devices.
See [Cross-agent handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md).

## Cross-platform compatibility

Indexes are portable across SDKs: an index built or pushed from one language (Python,
JavaScript, Swift, Elixir, C) can be loaded and queried from another.

## Authentication

SDKs authenticate with project credentials (`MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`). For
browsers and other untrusted clients, mint short-lived tokens with a
[custom authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md) instead of shipping the
project key. See [Authentication](https://docs.moss.dev/docs/integrate/authentication.md).

## Jobs

Cloud index builds (create, add, push) run as async jobs. The mutation returns a job id;
poll the job-status method to track progress through to completion.

## Performance expectations

* Sub-10 ms local queries (hardware-dependent)
* Sync is optional; compute stays on-device


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/authentication.md

# Authentication

> Configure project credentials for the Moss SDKs

For SDK access, export your Moss project credentials in the shell.

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
```

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
```

```python Python theme={null}
import os
from moss import MossClient

client = MossClient(os.getenv('MOSS_PROJECT_ID'), os.getenv('MOSS_PROJECT_KEY'))
```

## Managing project keys

Create keys on the project's **API Keys** page in the [Moss Portal](https://portal.usemoss.dev). New projects start with no key.

* **Shown once.** A key is displayed only at creation. Store it in a secret manager right away. If you lose it, create a new one.
* **Rotate with overlap.** Create a new key, move your clients to it, then delete the old one. A project can hold several keys at once, so nothing goes down during the switch.
* **Delete revokes.** Deleting a key blocks new tokens right away. Tokens already issued with it stop working within about 20 seconds.

Any org member can see the list of keys. Org owners, admins, and the project owner can create and delete them.

You can also manage keys from the terminal with the [Moss CLI](https://docs.moss.dev/docs/integrations/moss-cli.md#log-in-and-manage-keys): `moss login`, then `moss keys create`, `list` or `delete`.

## Session authentication

Project credentials are validated when a session is opened: `client.session(...)` raises if they're invalid. For long-lived sessions, tokens are cached and auto-refreshed, so you stay authenticated without re-supplying credentials. See [Sessions](https://docs.moss.dev/docs/integrate/sessions.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/indexing-data.md

# Indexing Data

> Prepare and upsert your content into Moss indexes

## Data model

Each document has an `id` and `text` (plus optional metadata). Use `moss-minilm` as the default model.

## Examples

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.createIndex('my-index', [
  { id: 'doc-1', text: '...', metadata: { category: 'faq', tags: 'returns,shipping', lang: 'en' } },
  { id: 'doc-2', text: '...' }
], { modelId: 'moss-minilm' })

// Upsert more docs later
await client.addDocs('my-index', [
  { id: 'doc-2', text: 'updated text' }, // will be updated
  { id: 'doc-3', text: 'new text' }
], { upsert: true })

// Fetch specific docs
const subset = await client.getDocs('my-index', { docIds: ['doc-1', 'doc-3'] })

// Delete docs or the index when done
await client.deleteDocs('my-index', ['doc-3'])
await client.deleteIndex('my-index')
```

```python Python theme={null}
from moss import MossClient, DocumentInfo, MutationOptions, GetDocumentsOptions

client = MossClient(project_id, project_key)
await client.create_index('my-index', [
    DocumentInfo(id='doc-1', text='...', metadata={'category': 'faq', 'tags': 'returns,shipping', 'lang': 'en'}),
    DocumentInfo(id='doc-2', text='...')
], 'moss-minilm')

# Upsert more docs later
await client.add_docs('my-index', [
    DocumentInfo(id='doc-2', text='updated text'),
    DocumentInfo(id='doc-3', text='new text')
], MutationOptions(upsert=True))

# Fetch specific docs
subset = await client.get_docs('my-index', GetDocumentsOptions(doc_ids=['doc-1', 'doc-3']))

# Delete docs or the index when done
await client.delete_docs('my-index', ['doc-3'])
await client.delete_index('my-index')
```

## From JSON or TXT files

JSON and text files don't need server-side parsing: read them in your code and pass the
contents to `createIndex` / `create_index` or `addDocs` / `add_docs` as documents. A JSON array
of `{id, text, metadata}` records maps one to one; metadata values must be strings (Python
1.18.0+ converts numbers and booleans in dict and JSON input, see below). Split text files into
passages (see [Chunking tips](#chunking-tips)) rather than indexing a whole file as
one document. In Python, `create_index` and `add_docs` can also take the JSON or the file itself,
and can chunk text for you; see [Python: JSON, JSON Lines and files](#python-json-json-lines-and-files).

```ts JavaScript theme={null}
import { readFile } from 'node:fs/promises'
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// JSON: [{ "id": "faq-1", "text": "...", "metadata": { "category": "billing" } }, ...]
const docs = JSON.parse(await readFile('faqs.json', 'utf8'))
await client.createIndex('my-index', docs, { modelId: 'moss-minilm' })

// TXT: one document per paragraph
const paragraphs = (await readFile('policies.txt', 'utf8'))
  .split('\n\n')
  .map((p) => p.trim())
  .filter(Boolean)
await client.addDocs('my-index', paragraphs.map((text, i) => ({
  id: `policies-${i}`,
  text,
  metadata: { source: 'policies.txt' },
})))
```

```python Python theme={null}
import json
from pathlib import Path
from moss import MossClient, DocumentInfo

client = MossClient(project_id, project_key)

# JSON: [{"id": "faq-1", "text": "...", "metadata": {"category": "billing"}}, ...]
records = json.loads(Path('faqs.json').read_text(encoding='utf-8'))
docs = [DocumentInfo(id=str(r['id']), text=r['text'], metadata=r.get('metadata')) for r in records]
await client.create_index('my-index', docs, 'moss-minilm')

# TXT: one document per paragraph
text = Path('policies.txt').read_text(encoding='utf-8')
paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
await client.add_docs('my-index', [
    DocumentInfo(id=f'policies-{i}', text=p, metadata={'source': 'policies.txt'})
    for i, p in enumerate(paragraphs)
])
```

### Python: JSON, JSON Lines and files

In Python, `create_index`, `add_docs` and `SessionIndex.add_docs` take JSON, dicts and file
paths directly, so the code above is optional. *(moss 1.18.0+)*

```python theme={null}
from pathlib import Path

# JSON array or JSON Lines text, or a .json, .jsonl or .ndjson file
await client.create_index("faqs", '[{"id": "1", "text": "Track your order in your account."}]')
await client.create_index("faqs-jsonl", Path("faqs.jsonl"))  # one JSON object per line

# Dicts with the DocumentInfo fields
await client.add_docs("faqs", [{"id": "2", "text": "30-day returns.", "metadata": {"days": 30}}])

# Text and markdown files are chunked for you, into handbook.md#0, handbook.md#1, ...
await client.create_index("handbook", [Path("docs/handbook.md"), Path("docs/faq.txt")])
```

* A `str` is always read as JSON text, so wrap file paths in `pathlib.Path`. Supported files are `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown`; use `create_index_from_files` for PDF and DOCX.
* Each JSON record has an `id` and `text`, plus optional `metadata`, `embedding` and `payload`. Integer ids become strings, and number and boolean metadata values are stored as strings: booleans as `"true"` and `"false"`.
* Chunks of a `.txt` or `.md` file get the ids `{path}#{n}` and the metadata `parentId`. Markdown chunks start with their heading path, such as `Returns > Refunds`, and front matter is not indexed. Pass relative paths for stable ids.
* Re-ingesting a file that now has fewer chunks leaves its old higher-numbered chunks in the index; remove them with `delete_docs`. A document's `payload` is copied onto every chunk.

Pass `chunking=` to tune the native chunker. With it, `DocumentInfo`, dict and JSON input is chunked too, which is how you split documents that you add yourself:

```python theme={null}
from pathlib import Path
from moss import Chunking

# chunk_size 200 to 2000 characters (default 1200), chunk_overlap 0 to half of chunk_size (default 200),
# mode "pages" or "sentences", markdown_header_depth 1 to 6
await client.create_index("kb", Path("notes.md"), chunking=Chunking(chunk_size=800, chunk_overlap=100))
await client.add_docs("kb", [{"id": "policy", "text": long_text}], chunking=Chunking())
```

Pass `chunker=` instead to split the text yourself. It is a synchronous function from a document's text to a list of chunk strings, it runs for every document, files included, and each chunk may have at most 2,000 characters. Pass `chunker` or `chunking`, not both, and neither with `model_id="custom"`.

```python theme={null}
await client.create_index("kb", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```

See [`Chunking`](https://docs.moss.dev/docs/reference/python/interfaces/Chunking) for the limits, defaults and errors.

## From files (PDF and DOCX)

Build an index directly from raw documents - the server parses, chunks, and embeds them.
Up to 20 files per call, 50 MB per file. Parsed document pages count against your plan's
monthly allowance; see [Pricing & Limits](https://docs.moss.dev/docs/pricing.md). When the allowance is used up on a
plan without overage billing, `createIndexFromFiles` fails with `429 USAGE_LIMIT_EXCEEDED` at
init or at confirm; a denial at confirm marks the job failed. PDF pages are counted before
parsing. A PDF that cannot be page-counted before parsing (larger than 10 MB, unreadable, or
past the page-counting budget of 200 MB or 20 seconds per request) is also denied on those
plans. A confirm denied because your organization is running its maximum number of crawl and
parse jobs leaves the job open: retry the confirm once a job finishes.

```ts JavaScript theme={null}
await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
], { parseOptions: { ocrMode: 'full_ocr' } }) // full_ocr for scanned documents
```

```python Python theme={null}
from moss import ParseFileInput, ParseOptions

await client.create_index_from_files('contracts', [
    ParseFileInput(name='report.pdf', content_type='application/pdf', path='/docs/report.pdf'),
], parse_options=ParseOptions(ocr_mode='full_ocr'))
```

See [Index from files](https://docs.moss.dev/docs/reference/js/files.md) for parse options, limits, and querying notes.

## From a website

Register a site as a web source and Moss crawls it into an index - optionally on a daily or
weekly refresh schedule (scheduled refresh requires the Startup plan or above; omit
`refreshCadence` on Developer and Hobbyist and re-sync manually on Hobbyist). Linked PDF and
DOCX files found during the crawl are parsed into the same index.

An index can hold up to 20 web sources. Each site is crawled and refreshed on its own, and a
crawl only replaces that source's pages, so several sites can share one index together with
documents you add directly. The first source creates the index; later ones add to it, and a
crawl requested while another is running on the index simply queues behind it.

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss' // 1.10.0+

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const docs = await client.createWebSource('https://docs.yoursite.com', 'support-kb', {
  maxPages: 500,
  refreshCadence: 'weekly',
})
const blog = await client.createWebSource('https://blog.yoursite.com', 'support-kb', {
  maxPages: 200,
})
// Poll docs.jobId and blog.jobId with client.getJobStatus until status is 'completed'
```

```python Python theme={null}
from moss import MossClient  # 1.10.0+

client = MossClient(project_id, project_key)

docs = await client.create_web_source('https://docs.yoursite.com', 'support-kb',
                                      max_pages=500, refresh_cadence='weekly')
blog = await client.create_web_source('https://blog.yoursite.com', 'support-kb',
                                      max_pages=200)
# Poll docs.job_id and blog.job_id with client.get_job_status until status.value == 'completed'
```

```bash curl theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "createWebSource",
    "projectId": "project_123",
    "rootUrl": "https://docs.yoursite.com",
    "indexName": "support-kb",
    "refreshCadence": "weekly"
  }'
```

See [Web Sources](https://docs.moss.dev/docs/reference/js/web-sources.md) for the JavaScript SDK,
[Web Sources](https://docs.moss.dev/docs/reference/python/web-sources.md) for Python, and
[Create Web Source](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource.md) for crawl limits,
scheduling, and the full set of web source actions.

## Local-first indexing (sessions)

`createIndex` / `create_index` builds an index through the cloud (then keeps it usable locally). When you need to index *during* a live interaction - adding transcript turns mid-call or building a per-user working set - use a **session** instead. A session indexes documents locally in real time with no cloud round trip, embedding each document on-device, and lets you optionally push the result to the cloud when you're done.

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient

async def main():
    client = MossClient(project_id, project_key)

    # Create or resume a local index by name.
    session = await client.session(index_name="my-session-index")

    # Index locally in real time - embedded on-device, no network.
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer confirmed the refund was received."),
    ])

    # Optionally push the session to the cloud when done.
    await session.push_index()

asyncio.run(main())
```

See [Sessions](https://docs.moss.dev/docs/integrate/sessions.md) for the full create-resume-query-push lifecycle.

## Notes

* `createIndex` / `create_index` will sync indexes to cloud (if enabled) while remaining usable locally
* Supports multiple indexes per project; pick the model per index:
  * `moss-minilm`: fast, lightweight (default)
  * `moss-mediumlm`: higher accuracy, still efficient
  * Use `moss-minilm` for speed-first, edge/offline use; use `moss-mediumlm` when you need higher recall/precision

## Chunking tips

Uploaded files and web sources are chunked automatically; see Files ([JavaScript](https://docs.moss.dev/docs/reference/js/files.md), [Python](https://docs.moss.dev/docs/reference/python/files.md)). Documents you add yourself are indexed as given, so split them first. In Python, `chunking=` and `chunker=` can do that for you, and `.txt` and `.md` files are chunked by default (see [Python: JSON, JSON Lines and files](#python-json-json-lines-and-files)). If you split documents yourself:

* Keep chunks under about 1200 characters, cut at sentence boundaries, overlapping by about 200 characters
* Start each chunk with the document title so a hit identifies its source
* Normalize whitespace and strip boilerplate


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/sessions.md

# Sessions

> Local-first, real-time indexing with create-resume-query-push.

A **session** is a local index you read and write in real time, with no cloud round trip
on any operation. Sessions are how Moss does indexing *during* a live interaction -
indexing transcript turns mid-call, building a per-user working set, or accumulating
context that's handed off between agents.

A session is represented by a [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex),
created from [`MossClient.session()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#session-index_name-model_id).

## Lifecycle

**1. Create or resume**

`client.session(name)` returns a `SessionIndex`. In Python, Elixir, Swift and C, a cloud
index with that name loads into the session by default if it exists (no re-embedding);
otherwise the session starts empty. Python and Elixir skip that load with
`auto_load_on_init`, and Swift with `autoLoadOnInit`, for example to restore a session saved
on disk. A JavaScript session always starts empty: call `session.loadIndex(name)` to pull the
cloud index in, which resolves to `0` when there is none. The rest of the workflow is the
same either way.

**2. Mutate locally**

`add_docs`, `delete_docs`, and `get_docs` run in-memory. `add_docs` embeds locally via the
Rust core, with no network round trip. With `model_id="custom"`, each document must carry its own
`.embedding`.

**3. Query locally**

`query` runs entirely in-memory (\~1-10 ms) and supports the same metadata filter syntax as
[`MossClient.query()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#query-name-query-options).

**4. Persist (optional)**

`push_index()` uploads the session's documents to the cloud under the session's name,
creating or replacing that index. For a built-in model the service re-embeds the text with
that model, so the pushed index answers text queries like one built with `create_index`. A
custom-model session keeps its own embeddings.

To keep the session on the device instead, `save_to_disk(cache_path)` writes it under
`<cache_path>/<name>/`, and `load_from_disk(cache_path)` restores it into a later session with
the same name (`saveToDisk` and `loadFromDisk` in JavaScript). See the
[Python](https://docs.moss.dev/docs/reference/python/sessions.md#save-and-restore-on-disk),
[Elixir](https://docs.moss.dev/docs/reference/elixir/classes/Session.md#save_to_disk-session-cache_path) and
[JavaScript](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md#savetodisk) references.

The path is optional. Without one, the session saves to `sessions/<project id>/` under the
directory below, so sessions of the same name in two projects stay apart.
`MOSS_SESSION_CACHE_PATH` is an environment variable only session snapshots read.

| SDK | Directory without a path |
| - | - |
| Python, JavaScript, Elixir | The client's cache path, else `MOSS_SESSION_CACHE_PATH`, else `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows |
| Swift | `MOSS_SESSION_CACHE_PATH` when it is set, else the app's `Library/Caches/moss` |
| Kotlin (Android) | The app's `cacheDir/moss` |
| C | `MOSS_SESSION_CACHE_PATH`, else `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, the app's `Library/Caches/moss` on iOS, `%LOCALAPPDATA%\moss` on Windows. Android has no default, so the call fails with `ERR_INVALID_ARG` unless `MOSS_SESSION_CACHE_PATH` is set |

**5. Close**

`close()` sends the final usage report and frees the session's documents and vectors.
Closing the client also closes its sessions in Python and JavaScript. See
[Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Short-term vs. long-term context

A session is **short-term context** - the working set for the current interaction. A
persistent cloud index loaded with
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
is **long-term context** - durable knowledge shared across interactions. Most real-time
apps query both; see [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).

## Models

The session's embedding model is set by the `model_id` argument to `session()` (default
`"moss-minilm"`; also `"moss-mediumlm"` or `"custom"`). A session takes the model of the cloud
index or disk snapshot it loads, and `model_id` (`modelId` in JavaScript) reports the model in
use. After a custom-model load, adding documents and querying need embeddings. When resuming
an existing cloud index in Python or Elixir, omit `model_id` to adopt the stored model:
passing a different one raises a `ValueError` in Python and returns an `:invalid_argument`
error in Elixir. All participants resuming the same index must use the same model.

## Authentication

Project credentials are validated when the session is opened; `session()` raises if they're
invalid. See [Authentication](https://docs.moss.dev/docs/integrate/authentication.md).

## Implementation

Runnable, per-language examples (create-or-resume, mutate, query, push) live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/sessions.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/sessions.md)

## Related

> **[Real-time local indexing](https://docs.moss.dev/docs/build/real-time-local-indexing.md)**
>
> Why sessions are sub-10 ms.

> **[Cross-agent handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)**
>
> Resume a session on another agent or channel.

> **[Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md)**
>
> Close sessions and clients, and close idle clients.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/retrieval.md

# Retrieval

> Choose vector, keyword, or hybrid retrieval

Moss supports three retrieval strategies, all over the same query call:

* **Vector similarity** (semantic) - matches on meaning
* **Keyword / BM25** - matches on exact terms
* **Hybrid** - blends both, tuned with `alpha`

An index must be loaded before you query it. Call
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/integrate/sessions.md)) first; queries then run entirely in-memory
(\~1-10 ms).

## Basic query

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.loadIndex('my-index')
const results = await client.query('my-index', 'getting started latency', { topK: 5 })
```

```python Python theme={null}
from moss import MossClient, QueryOptions
import os

client = MossClient(os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY"))
await client.load_index("my-index")
results = await client.query("my-index", "getting started latency", QueryOptions(top_k=5))
```

## Score semantics

Every result carries a `score`: the hit's relevance to the query, from 0 to 1, on single- and
multi-index queries alike. It is a per-model rescaled similarity, not a calibrated probability, and it
depends on the embedding model, so tune any threshold against your own queries and model. Results stay
in hybrid (semantic plus keyword) order, so the score is not the sort key: a lower-ranked result can
carry a higher score. A keyword-only query (`alpha=0`, or an index without vectors) scores every hit 0.

In Python and JavaScript, set `min_score` (`minScore`) to drop low-relevance hits. It takes a value
from 0 to 1, and a query then returns up to `top_k` results that clear the floor, in hybrid order. It
needs a semantic signal to score against, so it is rejected on a keyword-only query (`alpha=0`, or
an index without vectors), and session queries ignore it. The Browser, Elixir and Swift SDKs return
the same `score` but have no threshold option.

> [!NOTE]
>
> The relevance `score` requires `moss` **1.14.0+** (Python), `@moss-js/moss` **1.15.0+** (JavaScript),
> `@moss-dev/moss-web` **1.3.0+** (Browser), Elixir `moss` **1.4.0+**, or the Swift SDK **0.6.3+**.
> `min_score` and `minScore` need the same Python and JavaScript versions.

## Go deeper

> **[Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)**
>
> Blend semantic and keyword scoring with `alpha`.

> **[Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)**
>
> Narrow results by document metadata.

> **[Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)**
>
> Bring your own query and document vectors.

> **[Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md)**
>
> Query several loaded indexes in one call.

## Tuning

* Adjust `topK` / `top_k` to trade recall for latency
* Drop low-relevance hits with `min_score` (`minScore`) in Python and JavaScript (a value from 0 to 1; see [Score semantics](#score-semantics))
* Layer metadata filters to narrow candidate sets
* Group queries by intent (returns, billing, onboarding) and tune per index
* Choose model per index: `moss-minilm` (fast) or `moss-mediumlm` (more accurate)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/hybrid-search.md

# Hybrid Search

> Blend semantic and keyword scoring with a single alpha parameter.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, so you can tune relevance per query
or per index. As with all queries, load the index first (or open a
[session](https://docs.moss.dev/docs/integrate/sessions.md)).

## The `alpha` parameter

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, etc.).

## What the score means

The returned `score` is a relevance value, not the sort key: results stay in hybrid order. A pure
keyword query (`alpha=0`) scores every hit 0. See
[Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics) for exactly what it means, how to
threshold with `min_score`, and the SDK version it needs.

## Implementation

Runnable, per-language examples live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/hybrid-search.md)

## Related

> **[Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)**
>
> Constrain results by document metadata.

> **[Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)**
>
> Bring your own vectors.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/metadata-filtering.md

# Metadata Filtering

> Narrow query results to documents whose metadata matches a filter, date ranges included.

Attach metadata to documents when you add them, then constrain queries to the documents whose
metadata matches a filter. Filtering is evaluated on the **locally loaded index**, so call
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/integrate/sessions.md)) before querying with a filter. There is no
cloud query.

## Attach metadata

Metadata is a map of string keys to **string values** in every SDK. Convert numbers and dates
to strings before you add them. Pass it on each document, whether you add documents to a
session, to a new cloud index, or to an existing one.

> [!NOTE]
>
> In Python 1.18.0+, dicts and JSON passed to `create_index` or `add_docs` may hold number and
> boolean metadata values, which are stored as strings. A number such as `30` becomes `"30"`, and
> a boolean becomes `"true"` or `"false"`. Filter booleans with those strings, such as
> `{"$eq": "true"}`, not with Python `True`.

```ts JavaScript theme={null}
const session = await client.session('support-calls')

await session.addDocs(
  [
    {
      id: 'call-1',
      text: 'Customer asked for a refund on a duplicate charge.',
      metadata: { topic: 'refund', priority: '5', createdAt: '1768035600' },
    },
  ],
)
```

```python Python theme={null}
from moss import DocumentInfo

session = await client.session(index_name="support-calls")

await session.add_docs(
    [
        DocumentInfo(
            id="call-1",
            text="Customer asked for a refund on a duplicate charge.",
            metadata={"topic": "refund", "priority": "5", "created_at": "1768035600"},
        ),
    ]
)
```

## Operators

| Operator | Meaning |
| - | - |
| `$eq`, `$ne` | equals / not equals |
| `$gt`, `$gte`, `$lt`, `$lte` | greater than, greater than or equal to, less than, less than or equal to. See [How ranges compare](#how-ranges-compare) |
| `$in`, `$nin` | value in / not in a list |
| `$near` | within a haversine distance of a point: `"lat,lng,radiusMeters"` |

A condition names one field: `{ field: 'topic', condition: { $eq: 'refund' } }`. Compose
several with `$and` / `$or` (nestable). A single condition can be passed on its own without a
wrapper.

A condition never matches a document that lacks the field, `$ne` and `$nin` included, so a
misspelled field name matches nothing and raises no error.

Filter values can be strings or numbers; a number is compared in its plain decimal form. A
JavaScript `Date` or a Python `datetime` is rejected, so **convert it first**, as in
[Filter by date](#filter-by-date).

## How ranges compare

`$gt`, `$gte`, `$lt` and `$lte` compare the stored value with the filter value like this:

| Values | Comparison |
| - | - |
| Both are plain decimals, such as `"42"` or `"-3.5"` | As numbers, so `"9"` is less than `"50"` |
| Neither is a plain decimal | As text, character by character, so `"2026-01-15"` is greater than `"2026-01-01"` |
| One is a plain decimal and the other is not | Never matches |

A plain decimal is one or more digits, optionally preceded by `-` and optionally followed by
`.` and one or more digits. The digits before the point have no leading zero unless they are
just `0`. So `"0"`, `"-3.5"` and `"0.25"` are plain decimals, while `"-"`, `".5"`, `"5."`,
`"007"`, `"1e3"`, `"+5"`, `" 5"` and `"NaN"` are text, and so is a numeral too large for a
64-bit float.

> [!NOTE]
>
> This rule needs `moss` >= **1.15.0** (Python), `@moss-js/moss` >= **1.16.0** (JavaScript),
> `@moss-dev/moss-web` >= **1.4.0** (Browser), Elixir `moss` >= **1.5.0**, the Swift SDK
>
> > \= **0.8.0**, or the C SDK >= **0.24.0**. Earlier releases order some values differently.

## Filter by date

Store dates as **Unix epoch seconds** in a decimal string, and filter with numbers. Both sides
are then plain decimals, so they compare as numbers and in time order. Epoch milliseconds work
the same way.

```ts JavaScript theme={null}
const toEpoch = (iso: string) => Math.floor(Date.parse(iso) / 1000)

await session.addDocs([
  {
    id: 'call-1',
    text: 'Customer asked for a refund on a duplicate charge.',
    metadata: { createdAt: String(toEpoch('2026-01-10T09:00:00Z')) },
  },
  {
    id: 'call-2',
    text: 'Customer asked to move to the annual plan.',
    metadata: { createdAt: String(toEpoch('2026-02-03T14:30:00Z')) },
  },
])

// January 2026 in UTC, both bounds included.
const january = {
  $and: [
    { field: 'createdAt', condition: { $gte: toEpoch('2026-01-01T00:00:00Z') } },
    { field: 'createdAt', condition: { $lte: toEpoch('2026-01-31T23:59:59Z') } },
  ],
}

const results = await session.query('refund', { topK: 5, filter: january })
```

```python Python theme={null}
from datetime import datetime, timezone
from moss import DocumentInfo, QueryOptions


def to_epoch(dt: datetime) -> int:
    return int(dt.timestamp())


def to_epoch_str(dt: datetime) -> str:
    return str(to_epoch(dt))


call_1_at = to_epoch_str(datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc))
call_2_at = to_epoch_str(datetime(2026, 2, 3, 14, 30, tzinfo=timezone.utc))

await session.add_docs(
    [
        DocumentInfo(
            id="call-1",
            text="Customer asked for a refund on a duplicate charge.",
            metadata={"created_at": call_1_at},
        ),
        DocumentInfo(
            id="call-2",
            text="Customer asked to move to the annual plan.",
            metadata={"created_at": call_2_at},
        ),
    ]
)

# January 2026 in UTC, both bounds included.
start = to_epoch(datetime(2026, 1, 1, tzinfo=timezone.utc))
end = to_epoch(datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc))
january = {
    "$and": [
        {"field": "created_at", "condition": {"$gte": start}},
        {"field": "created_at", "condition": {"$lte": end}},
    ]
}

results = await session.query("refund", QueryOptions(top_k=5, filter=january))
```

The same filter works on a loaded index: pass it as `filter` to `client.query()`.

> [!WARNING]
>
> Give Python datetimes a time zone. `timestamp()` reads a naive `datetime` as local time.

### List every document in a range

A query returns the best matches for its text, and a blank query returns nothing. To list
every document in a date range, call `get_docs` with a filter on a session. It returns every
match without ranking, and `sort_by` orders numbers numerically, so epoch values come back in
time order. Python, Swift and C sessions support this; JavaScript and Elixir sessions fetch
documents by id only.

```python theme={null}
from moss import GetDocumentsOptions

in_january = await session.get_docs(
    GetDocumentsOptions(filter=january, sort_by="created_at")
)
```

### ISO 8601 strings

ISO 8601 strings compare as text. Text order is time order only when every value uses one
fixed, zero-padded UTC format, such as `2026-01-10T09:00:00Z`.

> [!WARNING]
>
> Text ranges are easy to get wrong:
>
> * Mixed formats break the order. `2026-01-10T09:00:00.5Z` sorts before `2026-01-10T09:00:00Z`
>   though it is later, and offsets such as `+02:00` are not converted to UTC.
> * A date-only upper bound leaves out that day: `"2026-01-31T09:00:00Z"` sorts after
>   `"2026-01-31"`, so `$lte: "2026-01-31"` excludes it. Use `$lt: "2026-02-01"`.
> * A text range matches any text that sorts inside it, so a value such as `"pending"` passes
>   `$gt: "2026-01-01"`.
> * An ISO value never matches an epoch filter, and an epoch value never matches an ISO filter.

## Where filters apply

| Call | Filter |
| - | - |
| `query` on a loaded index, in every SDK | Yes, once the index is loaded |
| `query` on a session (Python, JavaScript, Swift, Elixir, C) | Yes |
| Multi-index query | Yes, the same filter on every index |
| `get_docs` on a session (Python, Swift, C) | Yes, every match without ranking, optionally sorted |
| `getDocs` / `get_docs` on a JavaScript or Elixir session | No, by id only |
| `getDocs` / `get_docs` on a cloud index | No, by id only. Python's `GetDocumentsOptions` takes `filter` and `sort_by`, but `MossClient.get_docs` ignores them |

## Implementation

Runnable, per-language examples (catalog filters, geo `$near`, and filtering inside a
session) live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/metadata-filtering.md)

The other SDKs take the same filters:

* **Swift**: the typed `Filter`, such as
  `.and([.greaterThanOrEqual("created_at", 1767225600), .lessThanOrEqual("created_at", 1769903999)])`,
  set as `QueryOptions(filter:)` or passed to `session.getDocs(where:sortBy:)`. See
  [Graph retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md).
* **Elixir**: the same maps with string keys, such as
  `%{"field" => "created_at", "condition" => %{"$gte" => 1767225600}}`, passed as `filter:`.
  See [Moss.Session](https://docs.moss.dev/docs/reference/elixir/classes/Session.md).
* **C**: the same filter as a JSON string in `MossQueryOptions.filter_json`. See
  [C API](https://docs.moss.dev/docs/reference/c/api.md).
* **Browser**: the same objects as JavaScript, on a loaded index. See
  [Browser SDK](https://docs.moss.dev/docs/reference/browser/api.md).

## Related

> **[Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)**
>
> Blend semantic and keyword scoring.

> **[Retrieval](https://docs.moss.dev/docs/integrate/retrieval.md)**
>
> Retrieval strategies overview.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/multi-index-search.md

# Multi-Index Search

> Search across multiple loaded indexes in one call and get a global top-K.

Sometimes the answer is spread across separate corpora - a product catalog, its reviews,
and an FAQ - that you keep as distinct indexes. **Multi-index search** queries several
loaded indexes in a single call and returns the global top-K, with each result tagged by
its source index.

## How it works

Load the indexes (in bulk with `load_indexes`, or concurrently with one `load_index` per
index under `asyncio.gather`), then query them together with `query_multi_index`. Every
result document carries an `index_name` so you know where it came from. Each loaded index
holds its own memory; see [Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md) to plan for many
indexes.

## Behavior

* **All indexes must be loaded** locally (via `load_index` / `load_indexes`) and **share
  the same embedding model**. Querying indexes with different models returns an error.
* **`top_k` is global**, not per-index - it caps the merged result set. The default is `10`
  (a single-index `query` defaults to `5`).
* **Hybrid via `alpha`**: `alpha` works as in a single-index query (default `0.8`). `1.0`
  is embedding-only, `0.0` is keyword-only, and values in between fuse both signals with
  Reciprocal Rank Fusion. Keyword scoring runs each index's own BM25 and merges hits by
  score before fusion, so keyword and hybrid ordering across indexes is approximate.
  `filter` and `embedding` work the same as in a single-index query.
* **Bulk lifecycle**:
  [`load_indexes(names)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds)
  returns a [`LoadIndexesResult`](https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult) with
  `loaded` and `failed` (best-effort; a typo in one name doesn't roll back the others), and
  [`unload_indexes(names)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#unload_indexes-names)
  releases them and is idempotent.

## Implementation

Multi-index search is available in the Python (`query_multi_index`), JavaScript
(`queryMultiIndex`), and Elixir (`Moss.Client.query_multi_index/4`) SDKs, each with
matching bulk `load_indexes` / `unload_indexes` calls. See the
[Python guide](https://docs.moss.dev/docs/reference/python/multi-index-search.md) for a runnable example.

## Related

> **[Retrieval](https://docs.moss.dev/docs/integrate/retrieval.md)**
>
> Single-index querying, filters, and hybrid search.

> **[Python reference](https://docs.moss.dev/docs/reference/python/classes/MossClient.md)**
>
> `query_multi_index`, `load_indexes`, `unload_indexes`.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/storage-persistence.md

# Storage & Persistence

> Persist loaded indexes to disk and keep them in sync with the cloud.

## How indexes are stored

Indexes live in the cloud. The SDKs fetch them into memory with
`loadIndex()` / `load_index()` so queries run locally without network round
trips. The canonical copy is always the cloud index - your local process holds
an in-memory snapshot for fast retrieval.

## Disk cache

The Node (`@moss-js/moss`) and Python SDKs can cache the downloaded index to disk so subsequent loads skip
the download when the cloud data hasn't changed. Each load still checks the
cloud for a newer version. Pass a cache directory to `loadIndex()` /
`load_index()`:

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(projectId, projectKey)

await client.loadIndex('my-index', {
  cachePath: '/var/cache/moss',
})
```

```python Python theme={null}
from moss import MossClient

client = MossClient(project_id, project_key)

await client.load_index("my-index", cache_path="/var/cache/moss")
```

Auto-refresh writes through to the same cache, so restarts stay warm.

The cache saves downloads, not memory: every process that loads an index holds its own copy in
memory, even when processes share a `cache_path`. See [Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md).

In Python, `cache_path` on `load_index()` and `load_indexes()` requires `moss`
**1.11.0+**. With `moss` **1.14.0+**, `MossClient(project_id, project_key, cache_path=...)`
sets a default for every load, and a per-call `cache_path` overrides it. In JavaScript,
the `cachePath` client option only sets where the device id file lives, so pass
`cachePath` to each `loadIndex()` or `loadIndexes()` call.

### Loading from the cache offline

Requires `moss` **1.14.0+** (Python) or `@moss-js/moss` **1.15.0+** (JavaScript).

When a snapshot is already on disk, a load checks the cloud once within 5 seconds
instead of retrying. If the cloud is unreachable or answers with a temporary error,
such as a 429 or 503, the load serves the snapshot instead of failing. It also starts
a refresh poller, even without auto-refresh, so the index catches up when the cloud
returns. A 401, 403 or 404 still fails, so a forbidden or deleted index does not come
back from cache. In Python,
[`was_served_stale(name)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#was_served_stale-name)
reports whether an index is served from the snapshot.

A snapshot saved by `moss` 1.13.0 or earlier, or by `@moss-js/moss` 1.14.0 or earlier, is not
served until the index is downloaded again, which happens when the cloud copy changes. A snapshot
saved under another project or cloud origin is never served.

Until the cloud is reachable, a built-in embedding model may not open, so text queries
with `alpha` above 0 can fail. Keyword-only queries (`alpha` 0) and queries that pass
their own embedding keep working.

## Hot reload & auto-refresh

Enable `autoRefresh` to periodically poll the cloud and hot-swap the
in-memory index when a newer version is detected - in-flight queries are not
interrupted.

```ts JavaScript theme={null}
await client.loadIndex('my-index', {
  autoRefresh: true,
  pollingIntervalInSeconds: 300, // every 5 minutes
})
```

```python Python theme={null}
await client.load_index(
    "my-index",
    auto_refresh=True,
    polling_interval_in_seconds=300,
)
```

Calling `loadIndex()` again without `autoRefresh` stops the polling loop and
loads the index again, from the disk cache when a `cachePath` is set and the cloud copy
is unchanged. A load served from the cache while the cloud is unreachable starts the
poller anyway, as described in [Loading from the cache offline](#loading-from-the-cache-offline).

Each poll counts as session time, so a long-running process with auto-refresh on is billed for
session minutes around the clock, even when it serves no queries. To pick up an edit you know about,
load the index again instead.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/releasing-resources.md

# Releasing Resources

> Close clients and sessions to free local memory promptly, and close idle clients in apps that search in bursts.

A client holds the indexes it loaded, their refresh pollers and the embedding model. A session
holds its documents and vectors. Garbage collection frees them eventually; `close()` frees
them now and sends the [final usage report](https://docs.moss.dev/docs/reference/telemetry.md). Close every client
and session when you are done with it.

## Close when you are done

In JavaScript, `MossClient` and `SessionIndex` support `await using`, which closes them when
the enclosing block ends. In Python, both are context managers, so `async with` does the same.

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

await using client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.loadIndex('support-faqs')
const answers = await client.query('support-faqs', 'refund policy', { topK: 5 })

await using session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about a refund.' }])
const recent = await session.query('refund', { topK: 3 })
// Both close when this block ends, the session first.
```

```python Python theme={null}
import os
from moss import DocumentInfo, MossClient, QueryOptions

async with MossClient(
    os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY")
) as client:
    await client.load_index("support-faqs")
    answers = await client.query("support-faqs", "refund policy", QueryOptions(top_k=5))

    async with await client.session(index_name="call-123") as session:
        await session.add_docs(
            [DocumentInfo(id="turn-1", text="Customer asked about a refund.")]
        )
        recent = await session.query("refund", QueryOptions(top_k=3))
    # The session is closed here, the client when the outer block ends.
```

`await using` needs Node.js 24 or later. On older versions, call `close()` in a `finally`
block:

```typescript theme={null}
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
try {
  await client.loadIndex('support-faqs')
  const answers = await client.query('support-faqs', 'refund policy', { topK: 5 })
} finally {
  await client.close()
}
```

In synchronous Python code, `with` works too. It blocks the calling thread while the final
report is sent, so prefer `async with` inside async code.

> [!NOTE]
>
> `close()`, `with` and `async with` need `moss` >= **1.15.0** (Python). Every `@moss-js/moss`
> release (JavaScript) has `close()` and `await using`, and the 2-second bound on the final
> report needs >= **1.16.0**. In Swift the bound needs >= **0.8.0**, and in C >= **0.24.0**.

## What close does

1. **Sends the final usage report.** It waits until the report arrives or 2 seconds pass, so
   `close()` can take up to 2 seconds.
2. **Frees local data.** It stops auto-refresh polling, unloads the indexes, and frees the
   documents and vectors, including memory-mapped vector files.
3. **Lets go of the embedding model.** One copy of each model is shared by every client and
   session in the process that uses it. It is freed when the last of them closes, and loaded
   again on next use. Process memory may not shrink right away, because the allocator keeps
   freed pages for reuse.

Closing is safe to repeat. A closed object can't be reopened: create a new client instead.
After `close()`:

* **JavaScript**: client methods reject with `MossClient is closed`. A closed session still
  reads `name` and `modelId`; everything else throws.
* **Python**: client methods raise `RuntimeError("MossClient is closed")`. A closed session
  still reads `name`; everything else raises `InvalidArgumentError`.

In JavaScript and Python, closing a client also closes the sessions it opened. A client or
session that is garbage collected without `close()` still tries to send its final report, but
a process that exits first can lose the last few seconds of usage.

In Python, each client and session also keeps its own background threads until it is garbage
collected. `close()` frees the memory but not those threads.

## Other SDKs

| SDK | How to close | Notes |
| - | - | - |
| Swift | `client.close()`, `session.close()`, also run on `deinit` | Blocks until in-flight calls return, then waits up to 2 seconds for the final report. Closing the client leaves its sessions open. Later calls throw `MossClient already closed` or `MossSession already closed`. |
| Elixir | `Moss.Client.close/1`, `Moss.Session.close/1` | Also runs when a supervisor stops the process. Sessions are separate processes, so close each one. After `Moss.Client.close/1`, cloud calls such as `create_index/4` still work, and calls that go through the index manager, such as `load_index/3`, exit. Needs Elixir `moss` >= **1.5.0**. |
| C | `moss_client_free`, `moss_session_free` | Waits up to 2 seconds for the final report, or sends it in the background when called inside a Tokio runtime. Sessions stay valid after their client is freed. `NULL` is a no-op; freeing the same handle twice is undefined behavior. |
| Browser | `client.dispose()` | Synchronous. Stops auto-refresh, frees the loaded indexes and the ONNX Runtime sessions of models no longer in use, and sends the pending usage counts. The WebAssembly module stays loaded. Load indexes again before the next query. |

## Close idle clients

An app that searches in bursts, such as a search box or a desktop assistant, can close its
client after a quiet period and create a new one on the next search. Memory stays free
between bursts. The first search after a close pays for loading the index and the model
again. Give the client a cache directory so the reload reads the index from disk when the
cloud copy hasn't changed; see [Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md).

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const IDLE_MS = 15_000

class IdleSearch {
  #client: Promise<MossClient> | null = null
  #timer: ReturnType<typeof setTimeout> | undefined
  #active = 0

  async query(text: string) {
    clearTimeout(this.#timer)
    this.#active++
    try {
      this.#client ??= this.#open()
      const client = await this.#client
      return await client.query('notes', text, { topK: 5 })
    } finally {
      if (--this.#active === 0) this.#timer = setTimeout(() => this.#close(), IDLE_MS)
    }
  }

  async #open() {
    const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
    try {
      await client.loadIndex('notes', { cachePath: '/var/cache/moss' })
      return client
    } catch (err) {
      this.#client = null
      await client.close()
      throw err
    }
  }

  async #close() {
    const pending = this.#client
    this.#client = null
    const client = await pending?.catch(() => null)
    await client?.close()
  }
}
```

```python Python theme={null}
import asyncio
import os
from moss import MossClient, QueryOptions

IDLE_SECONDS = 15


class IdleSearch:
    def __init__(self):
        self._client = None
        self._lock = asyncio.Lock()
        self._timer = None
        self._active = 0

    async def query(self, text):
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
        self._active += 1
        try:
            client = await self._open()
            return await client.query("notes", text, QueryOptions(top_k=5))
        finally:
            self._active -= 1
            if self._active == 0:
                self._timer = asyncio.create_task(self._close_after_idle())

    async def _open(self):
        async with self._lock:
            if self._client is None:
                client = MossClient(
                    os.getenv("MOSS_PROJECT_ID"),
                    os.getenv("MOSS_PROJECT_KEY"),
                    cache_path="/var/cache/moss",
                )
                try:
                    await client.load_index("notes")
                except BaseException:
                    await client.close()
                    raise
                self._client = client
            return self._client

    async def _close_after_idle(self):
        await asyncio.sleep(IDLE_SECONDS)
        self._timer = None
        client, self._client = self._client, None
        if client is not None:
            await client.close()
```

## Related

> **[Sessions](https://docs.moss.dev/docs/integrate/sessions.md)**
>
> Create, query and push a session.

> **[Telemetry](https://docs.moss.dev/docs/reference/telemetry.md)**
>
> What the final usage report contains.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/memory-sizing.md

# Memory Sizing

> Estimate the memory a server process needs for the embedding model and its loaded indexes, and keep it bounded with many indexes.

On a server, a loaded index lives entirely in process memory: its document text, metadata,
vectors, keyword index and id map. Query time does not grow with the number of loaded indexes, so
what limits how many indexes a process can hold is memory. This page gives the measured costs, a
formula to estimate a process, and the practices that keep memory bounded when you serve many
knowledge bases.

## What a process holds

| What | Memory |
| - | - |
| Python, the SDK and a `MossClient` | 37 MiB |
| Embedding model, once per process | 149 MiB |
| Whole process while the model loads | 370 to 379 MiB |
| Each loaded chunk, in a process holding many indexes | 5.7 to 7.1 KB |
| 500 indexes of 200 chunks each, whole process | 810 to 859 MiB |
| Each further process that loads the same 500 indexes | 786 to 792 MiB more |

Measured with `moss` 1.19.0 and Python 3.12 on Linux (arm64, glibc), with the `moss-minilm` model
and chunks of 800 to 1,200 characters of English text with four metadata fields. Memory is RSS,
which is what a container's memory limit counts. Your text, chunk size and metadata change the cost
per chunk, so check these figures against your own data.

* **The embedding model loads once per process** for each model, with the first load that needs it,
  and every client and session in the process shares it. Opening it briefly holds 2.2 to 2.5 times its
  steady size.
* **A load briefly needs about twice the index's size**, for the download and parse buffers. A
  refresh needs about three times, because the old copy keeps serving queries until the new version
  replaces it.
* **Memory grows linearly** with the number of loaded chunks, and with the number of indexes. Each
  index keeps its own keyword vocabulary, so many small indexes cost 1.5 to 2 times more per chunk
  than one large index with the same chunks. Non-Latin text, such as Hindi, roughly doubled the cost
  per chunk in our test.
* **Processes share nothing.** Each process holds its own model and its own copy of every index it
  loads, even when they use the same `cache_path`. The disk cache saves downloads, not memory.
* **Text query time stays flat.** With 50 or 500 indexes loaded, a text query on one of them took
  about 6 ms at the median and 9 to 10 ms at p95, embedding included.

The JavaScript SDK runs the same core, so plan with the same model and per-chunk figures and
measure the Node.js baseline separately.

## Estimate a process

Plan each process for the larger of two numbers:

* **About 380 MiB plus the indexes loading at the same time**, the peak while the embedding model
  loads. It happens once, with the first load in the process.
* **186 MiB + 7 KB per loaded chunk + twice the largest index**, the steady memory plus room to load
  or refresh the largest index. The steady term already counts the old copy that a refresh keeps
  serving, so twice the index on top covers the refresh's total of about three times. An index of
  `n` chunks takes about `n × 7 KB`.

Add your application's own memory on top: the web framework, the agent runtime, voice activity
detection and other models.

> **Example: one process holding 500 knowledge bases**
>
> 500 knowledge bases of 200 chunks each, all loaded in one process:
>
> * Loaded chunks: 500 × 200 = 100,000, so 100,000 × 7 KB ≈ 668 MiB.
> * Largest index: 200 × 7 KB ≈ 1.3 MiB, twice that ≈ 3 MiB.
> * Steady estimate: 186 + 668 + 3 ≈ 857 MiB, above the 380 MiB model peak.
>
> Plan about 860 MiB for this process. The measured process used 810 to 859 MiB. A second process that
> loads the same 500 indexes needs another 860 MiB.
>
> If all 500 loads start together with the first one, they overlap the model load and can peak at
> about 380 + 668 ≈ 1,048 MiB. Load one index first, then the rest concurrently: the model opens
> with that first index, and the process stays at the steady estimate.

> **Example: 20 concurrent voice calls on one host**
>
> Each call loads 3 knowledge bases of 2,000 chunks each.
>
> With one call per process, as in the default LiveKit setup:
>
> * Per process: 6,000 chunks × 7 KB ≈ 40 MiB, and the largest index ≈ 13 MiB, so
>   186 + 40 + 2 × 13 ≈ 253 MiB steady.
> * The model load sets the peak instead: about 380 MiB, plus the 40 MiB of indexes that load
>   alongside it, so about 420 MiB.
> * 20 calls ≈ 20 × 420 MiB ≈ 8.2 GiB for Moss alone.
>
> With every call in one process (the LiveKit thread executor) and no knowledge base shared between
> calls:
>
> * 60 indexes × 2,000 chunks = 120,000 chunks × 7 KB ≈ 801 MiB.
> * 186 + 801 + 2 × 13 ≈ 1,014 MiB steady for all 20 calls, and less when calls share knowledge
>   bases.
> * If all 60 loads overlap the first model load, the peak is about 380 + 801 ≈ 1,181 MiB, so plan
>   about 1.2 GiB for the process.
>
> See [Process model and index loading](https://docs.moss.dev/docs/integrations/livekit.md#process-model-and-index-loading) for
> the trade-offs.

## Many indexes

### One index per knowledge base

Give each knowledge base, tenant or agent its own index, and load the ones a request needs. Query
time does not depend on how many indexes are loaded, and
[multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md) queries several of them in one call.

One large index filtered per tenant is a poor fit:

* **A filtered query still scores every vector** in the index, then drops the ones the filter
  excludes, so every tenant pays for the size of all tenants.
* **Every edit rewrites the whole index.** A new version is rebuilt in full, and every process that
  refreshes it downloads the whole index again.
* **Every process holds every tenant's data**, whether or not it serves them.

### Load on first use, concurrently

Load an index when a request first needs it, with a `cache_path` on persistent storage so a reload
reads it from disk when the cloud copy is unchanged. To load several, start the loads together so
their round trips to the cloud overlap.

```ts JavaScript theme={null}
const names = ['acme-faq', 'acme-policies']

await Promise.all(
  names.map((name) => client.loadIndex(name, { cachePath: '/var/cache/moss' })),
)
```

```python Python theme={null}
import asyncio

client = MossClient(project_id, project_key, cache_path="/var/cache/moss")
names = ["acme-faq", "acme-policies"]

await asyncio.gather(*(client.load_index(name) for name in names))
```

Use one client per process. Clients in a process share the embedding model, but each client holds its
own copy of the indexes it loads.

### Unload idle indexes

A process that serves many knowledge bases over time keeps every index it loads until you unload it.
Track when each index was last queried, and unload the ones that have gone idle with `unload_index` /
`unloadIndex` (or `unload_indexes` / `unloadIndexes` for several). The next request that needs one
loads it again, from the disk cache when the cloud copy is unchanged.

On Linux, glibc keeps freed memory inside the process, so RSS does not drop right after an unload.
Later loads in the same process reuse that memory. To return it to the operating system, call
`malloc_trim` after unloading:

```python theme={null}
import ctypes

await client.unload_indexes(idle)
ctypes.CDLL("libc.so.6").malloc_trim(0)
```

So size a process for the most indexes it holds at once, not the average.

### Refresh sparingly

With `auto_refresh`, each poll makes three requests per index. 500 indexes at the default interval of
600 seconds make 150 requests a minute; at 10 seconds they make 9,000. Keep the default interval or a
longer one when a process holds many indexes, and refresh the indexes you know have changed by loading
them again.

Each poll also counts as session time, so a long-running process with `auto_refresh` on is billed for
session minutes around the clock, even when it serves no calls.

## Related

> **[Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md)**
>
> Disk cache, offline loads and auto-refresh.

> **[Releasing Resources](https://docs.moss.dev/docs/integrate/releasing-resources.md)**
>
> Close clients and sessions to free memory.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrate/deployment-production.md

# Deployment / Production

> Checklist for shipping Moss-backed features

## Checklist

* Configure API keys via env vars
* Persist indexes to a durable path
* Size each process for the embedding model and its loaded indexes
  ([Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md))
* Monitor index size and query latency
* Enable sync (optional) and test offline mode
* Add health checks for embedding/runtime services
* Close clients and sessions on shutdown, and close idle ones in apps that search in bursts
  ([Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md))

## Security

* Keep data local whenever possible
* Review what the SDKs send to Moss ([Telemetry](https://docs.moss.dev/docs/reference/telemetry.md))
* Encrypt synced data at rest/in transit

## Observability

* Track query latency (p50/p95) and index size growth
* Log index lifecycle events (create/load/delete, rebuilds)
* Establish backup/export cadence for disaster recovery


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/build/live-call-context.md

# Live-Call Context

> Query a persistent cloud index and a live session together during a conversation.

During a live interaction you typically query two indexes:

* **Long-term context** - a persistent cloud index of durable knowledge and account facts
  (FAQs, policies, profile). You load it once at the start of the call with `load_index()`.
* **Short-term context** - a [session](https://docs.moss.dev/docs/integrate/sessions.md) holding the current
  conversation, which you build up with `add_docs()` as turns arrive.

Both run locally once loaded, so each turn can query the knowledge index and the session
without a network round trip, then pass the combined results to the model.

## A single agent turn

![A caller turn reaches an agent, which updates a short-term session, queries recent context and long-term cloud knowledge, then responds](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/live-call-context-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=d89ade0d0c3fc7d372706c25049088c7)

![A caller turn reaches an agent, which updates a short-term session, queries recent context and long-term cloud knowledge, then responds](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/live-call-context-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=aab230eec0ffcd50cc3313256ab1d65d)

## How it works

**1. Load the long-term index**

`load_index("support-faqs")` loads the persistent knowledge index into memory for querying.

**2. Open a session for the call**

`client.session(call_id)` returns a local [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex).
If an index with that name already exists in the cloud it is loaded; otherwise the session starts empty.

**3. Index transcript turns**

Call `add_docs` as turns arrive; documents are embedded and indexed locally.

**4. Query both indexes per turn**

Query the loaded knowledge index and the session, and pass both result sets to the model.

**5. Persist the session**

`session.push_index()` writes the session to the cloud so a later interaction can resume it.

## Example

```python theme={null}
import asyncio
from datetime import datetime
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Long-term context: load a persistent knowledge index.
    await client.load_index("support-faqs")

    # Short-term context: open a session for this call.
    call_id = f"call-{datetime.now():%Y%m%d-%H%M%S}"
    session = await client.session(index_name=call_id)

    # Index transcript turns into the session.
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer was billed twice for the same renewal."),
        DocumentInfo(id="turn-2", text="Customer requested a refund for the duplicate $49.99 charge."),
    ])

    # Query both indexes and combine the results for the model.
    knowledge = await client.query("support-faqs", "duplicate charge refund policy", QueryOptions(top_k=3))
    recent = await session.query("refund request", QueryOptions(top_k=3))

    for doc in recent.docs:
        print(f"[session] {doc.id} score={doc.score:.3f} {doc.text}")
    for doc in knowledge.docs:
        print(f"[faqs]    {doc.id} score={doc.score:.3f} {doc.text}")

    # Persist the session at call end.
    result = await session.push_index()
    print(f"Pushed {result.doc_count} docs to cloud index {result.index_name!r}")

asyncio.run(main())
```

## Two kinds of context

| | Short-term context | Long-term context |
| - | - | - |
| **What** | The current conversation: working notes, live transcript | Durable knowledge and account facts: FAQs, policies, profile, history |
| **Where** | A local [session](https://docs.moss.dev/docs/integrate/sessions.md), built turn by turn | A persistent cloud index, loaded once |
| **Lifetime** | The current interaction (optionally persisted at the end) | Across interactions |

## Data hydration and sync

At call start the long-term index and the session are loaded from the cloud (no
re-embedding); during the call the long-term index can stay current with `auto_refresh`; and
`session.push_index()` writes the session back. See
[Data hydration & sync](https://docs.moss.dev/docs/build/data-hydration-sync.md) for the load/refresh model and
refresh-interval tuning.

## Related

> **[Sessions](https://docs.moss.dev/docs/integrate/sessions.md)**
>
> The session lifecycle and API.

> **[Real-time local indexing](https://docs.moss.dev/docs/build/real-time-local-indexing.md)**
>
> How local sessions work.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/build/offline-first-search.md

# Sub-10ms Knowledge Retrieval

> Load an index into memory and run semantic queries in-process.

Moss loads an index into memory and runs embedding and search in-process, so a query is a
local call with no network round trip per operation. The pattern is the same in every SDK:
load the index once, then query it.

```ts theme={null}
await client.loadIndex(indexName)
const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })
```

Queries run against the in-memory index and embed the query text with a local model.

## The query pipeline

![Query text is embedded locally, retrieved from an in-process loaded index, optionally reranked, and returned as results](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/offline-first-search-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=30c2869bae1001203721436fc245f3dc)

![Query text is embedded locally, retrieved from an in-process loaded index, optionally reranked, and returned as results](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/offline-first-search-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=71b4a8ef2747d363022821e8dc8c2e1e)

* Load the index once, then query it in-process.
* Optional background sync to the cloud.
* Query pipeline: text -> embed -> retrieve -> rerank (optional).

## Prerequisites

* Node.js 18+ or Python 3.10+
* Moss credentials: `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`
* An index to query (create `faqs` via the [Quickstart](https://docs.moss.dev/docs/start/quickstart.md) if you don't have one yet)

## Steps

**1. Export credentials (and index if different)**

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
export MOSS_INDEX_NAME=faqs   # or your index
```

**2. Ensure the index exists**

Ensure the index exists (see [Quickstart](https://docs.moss.dev/docs/start/quickstart.md) to create `faqs`).

**3. Run one of the snippets below**

Run one of the snippets below.

## Run the sample (JavaScript or Python)

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!
)

const indexName = process.env.MOSS_INDEX_NAME || 'faqs' // ensure this exists (see Quickstart)

async function main() {
  await client.loadIndex(indexName)
  const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })

  console.log(`Found ${results.docs.length} docs in ${results.timeTakenInMs}ms`)
  results.docs.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.id}] ${doc.text} (score: ${doc.score.toFixed(3)})`)
  })
}

main().catch(console.error)
```

```python Python theme={null}
import os
import asyncio
from moss import MossClient, QueryOptions

project_id = os.getenv("MOSS_PROJECT_ID")
project_key = os.getenv("MOSS_PROJECT_KEY")
index_name = os.getenv("MOSS_INDEX_NAME", "faqs")  # ensure this exists (see Quickstart)

async def main():
    client = MossClient(project_id, project_key)
    await client.load_index(index_name)
    results = await client.query(index_name, "How do I return a damaged product?", QueryOptions(top_k=3))

    print(f"Found {len(results.docs)} docs")
    for i, doc in enumerate(results.docs, 1):
        print(f"{i}. [{doc.id}] {doc.text} (score: {doc.score:.3f})")

asyncio.run(main())
```

The sample loads your index into memory and returns the top matches. An index must be loaded
with `loadIndex` / `load_index` (or opened as a session) before you can query it.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/build/real-time-local-indexing.md

# Real-Time Local Indexing

> Index and query in-process with a local session - no per-operation network call.

A **session** is an in-process index. You open it with `client.session(name)`, then add,
query, and delete documents locally; embedding and search run on-device, with no network
call per operation. When you are done, `push_index()` persists the index to the cloud.

A session is represented by a [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex).

## Operations

![Session operations run on device, with add\_docs and query in process before optional push\_index to cloud](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/real-time-local-indexing-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=b8d71193d5c75cdb622b08faa0d70f84)

![Session operations run on device, with add\_docs and query in process before optional push\_index to cloud](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/real-time-local-indexing-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=e25c731910af3f6cbdb56237653b98e0)

* **`add_docs(docs, options?)`** - embeds and indexes documents locally; returns `(added, updated)`.
* **`query(text, options?)`** - semantic or hybrid search over the in-memory index; returns a `SearchResult`.
* **`get_docs(options?)` / `delete_docs(ids)`** - read and remove documents locally.
* **`push_index()`** - uploads the session to the cloud, creating or replacing the cloud index of the same name. For a built-in model the service re-embeds the text with that model; a custom-model session keeps its own embeddings.

In Python and Elixir, and by default in Swift and C, `session(name)` is **create-or-resume**:
if a cloud index with that name already exists it is loaded into the session (no
re-embedding); otherwise the session starts empty. A JavaScript session always starts empty;
call `session.loadIndex(name)` to resume the cloud index. The rest of the API is the same
either way.

## Example

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Open a session: new local index, or load an existing cloud index by name.
    session = await client.session(index_name="notes")

    # Add documents (embedded and indexed locally).
    added, updated = await session.add_docs([
        DocumentInfo(id="1", text="Ship the on-device SDK by Friday."),
        DocumentInfo(id="2", text="Follow up with the LiveKit team about latency."),
    ])
    print(f"{added} added, {updated} updated, {session.doc_count} total")

    # Query the in-memory index.
    results = await session.query("what's due this week", QueryOptions(top_k=3))
    for doc in results.docs:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

asyncio.run(main())
```

## Performance characteristics

* Operations run in-process: no network round trip, TLS, or serialization on the query path.
* Query text is embedded by a local model; with `model_id="custom"` you supply the query vector via `QueryOptions.embedding` instead.
* Local queries typically complete in single-digit milliseconds, which suits short, frequent queries against a per-session or per-user working set.

## Session vs. loaded cloud index

| Use a **session** when | Use a **loaded cloud index** when |
| - | - |
| You are indexing data created at runtime (a live call, a chat, a working set) | You are querying a large, stable corpus built ahead of time |
| You need writes and reads against the same in-memory index | Reads dominate and the data changes infrequently |
| The data is per-conversation or per-user and short-lived | The index is shared across many sessions |

The two compose: load a persistent index and open a session in the same client. See
[Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).

## Related

> **[Sessions guide](https://docs.moss.dev/docs/integrate/sessions.md)**
>
> The full session lifecycle and API.

> **[SessionIndex reference](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md)**
>
> Methods, parameters, and return types.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/build/agent-context.md

# Agent Context

> Persist and recall agent context as documents in a Moss index.

Persist agent context as documents in a Moss index. On each turn the agent queries the
index for relevant context, grounds its response in the results, then writes new context
back with `addDocs`. The pattern is: store documents, query per turn, write new context back.

Two kinds of context live in the same index and surface through the same semantic query:

* **Working context** - unstructured insights drawn from conversations: preferences, tone,
  recurring topics, and decisions. Updated after each interaction.
* **Durable context** - stable facts about the user: profile, account tier, identifiers,
  long-standing preferences. Changes rarely.

## Capture and recall loop

![An agent recalls relevant context for a user turn, grounds the LLM response, then captures the turn back into context](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/agent-context-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=a0b247fe2cbd8af32b09d232fb365bc8)

![An agent recalls relevant context for a user turn, grounds the LLM response, then captures the turn back into context](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/agent-context-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=eed1944cdc5569f1bfe7163c1e861ecf)

On each turn the agent queries the index for the most relevant context, grounds its
response in it, then writes new context back with `addDocs`. Subsequent turns query the
updated index.

## Example (JavaScript)

```ts theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const index = 'agent-context'
await client.createIndex(index, [
  { id: 'user_profile', text: 'User prefers concise answers.' }
], { modelId: 'moss-minilm' })

// Load before querying.
await client.loadIndex(index)

// Recall: pull relevant context for this turn.
const context = await client.query(index, 'preferences for responses', { topK: 3 })

// Capture: write new insights back so the next turn can use them.
await client.addDocs(index, [
  { id: 'pref_format', text: 'User asked for bullet-point summaries.' }
], { upsert: true })
```

## Let Moss ground the reply

If the LLM call itself can go through Moss, skip the recall step: [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) search your indexes on every turn and add the hits to the prompt before the model answers, with any OpenAI client, or with the SDK's `MossInference` client ([JavaScript](https://docs.moss.dev/docs/reference/js/inference.md), [Python](https://docs.moss.dev/docs/reference/python/inference.md)). Name the context index, with `X-Moss-Indexes: agent-context` or `indexes: ['agent-context']` in the SDK, so the project's other indexes stay out of the prompt.

## Related

> **[Live-call context](https://docs.moss.dev/docs/build/live-call-context.md)**
>
> Short-term + long-term context during a call.

> **[Cross-agent handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)**
>
> Carry context across agents and channels.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/build/voice-agent-livekit.md

# Voice Agent (LiveKit)

> Ground a LiveKit voice agent in your Moss index for real-time retrieval.

LiveKit provides the real-time audio pipeline (speech-to-text, LLM, text-to-speech); Moss
supplies retrieval. The agent loads a Moss index (and optionally opens a session for the live
conversation), then queries it in-process to ground its answers - each lookup is a local call,
not a network request.

## Pipeline

![Voice agent pipeline from mic to speech-to-text, Moss retrieval, LLM, and speaker](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/voice-agent-livekit-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=6b53d2e180b30870c6a709180c1d7f83)

![Voice agent pipeline from mic to speech-to-text, Moss retrieval, LLM, and speaker](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/voice-agent-livekit-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=8858b7b6e293775c3d94081e05a91a39)

## Two ways to build it

> **[LiveKit integration (DIY)](https://docs.moss.dev/docs/integrations/livekit.md)**
>
> Add Moss to your own LiveKit agent: load a knowledge index, open a per-call session, and
> expose search as function tools. Full, copy-pasteable recipe.

> **[Managed Voice Agents](https://docs.moss.dev/docs/voice-agents/voice-agents.md)**
>
> Let Moss host the agent: the Agent SDK, backend token minting, and the deploy CLI.

> [!NOTE]
>
> Prefer to start from a working app? Clone the
> [LiveKit voice agent sample](https://github.com/usemoss/moss/tree/main/apps/livekit-moss-vercel/livekit-voice-agent/livekit-moss-agent)
> and add your own keys.

## How retrieval fits

* Load a Moss index into memory at start; retrieval then runs in-process (single-digit ms).
* For live conversation memory, open a [session](https://docs.moss.dev/docs/integrate/sessions.md) and index transcript
  turns as they arrive - see [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).
* Expose retrieval to the LLM as a function tool so it searches only when it needs to. This keeps the
  chat context stable at the turn boundary, so retrieval composes with LiveKit preemptive generation -
  see [Retrieval and preemptive generation](https://docs.moss.dev/docs/integrations/livekit.md#retrieval-and-preemptive-generation).

## Related

> **[Live-call context](https://docs.moss.dev/docs/build/live-call-context.md)**
>
> Short-term session context plus long-term knowledge during a call.

> **[Sub-10ms knowledge retrieval](https://docs.moss.dev/docs/build/offline-first-search.md)**
>
> The load-then-query retrieval pipeline.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/integrations/livekit.md

# LiveKit

Integrate Moss Semantic Search SDK directly into a LiveKit Voice Agent. This setup allows your voice AI to perform ultra-low latency searches over your custom data to answer user questions in real-time. It pairs a persistent knowledge base with a per-call session that indexes the conversation as it happens.

## Why Use Moss with LiveKit?

Moss delivers sub-10ms semantic retrieval, ensuring your voice agents respond naturally without noticeable delays. A session gives each call its own local index, so the agent can recall what was said earlier in the conversation with no cloud round trip.

## Required Tools

* [Moss](https://www.moss.dev/)
* [LiveKit](https://livekit.io/)
* [OpenAI](https://openai.com/api/)
* [Deepgram](https://deepgram.com/)

## Integration Guide

**1. Installation**

Install the Moss SDK.

```bash theme={null}
pip install moss \
    python-dotenv
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Environment Setup**

Create a `.env` file in your project root directory with your API keys.

**File: `.env`**

```bash theme={null}
# LiveKit Credentials, keep it as it is for local deployment, don't change it.
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Moss Credentials
MOSS_PROJECT_ID=your-moss-id
MOSS_PROJECT_KEY=your-moss-key

# Moss index cache. In production, point it at persistent storage.
MOSS_CACHE_PATH=./moss-cache

# AI Provider Keys
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=your-deepgram-key
```

**3. Creating the Knowledge Base with Moss**

Before the agent can answer questions, build the long-term knowledge base. Run this script once to upload your documents to Moss as a cloud index.

**File: `build_index.py`**

```python theme={null}
import asyncio
import os
from dotenv import load_dotenv
from moss import MossClient, DocumentInfo

load_dotenv()

async def main():
    # Initialize the Moss Client
    client = MossClient(
        project_id=os.environ["MOSS_PROJECT_ID"],
        project_key=os.environ["MOSS_PROJECT_KEY"]
    )
    
    index_name = os.getenv("MOSS_INDEX_NAME", "product-knowledge")

    # Define documents
    docs = [
        DocumentInfo(
            id="1", 
            text="Our return policy allows returns within 30 days of purchase with a receipt."
        ),
        DocumentInfo(
            id="2", 
            text="Standard shipping takes 3-5 business days. Express shipping takes 1-2 days."
        ),
        DocumentInfo(
            id="3", 
            text="Technical support is available 24/7 via email at support@example.com."
        ),
    ]

    print(f"Creating index '{index_name}'...")
    
    await client.create_index(index_name, docs, model_id="moss-minilm")
    
    print("Index created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
```

Run the builder:

```bash theme={null}
python build_index.py
```

**4. Building the Agent**

This agent exposes Moss search as **function tools**. The LLM decides when to call them during a turn, reads the results, and uses them to answer, so it can search, refine, or skip retrieval on turns that don't need it.

Two tools are registered:

* `search_knowledge_base` queries the persistent knowledge base you built above (long-term context).
* `search_conversation` queries this call's [session](https://docs.moss.dev/docs/reference/python/sessions.md) (short-term context) to recall something said earlier.

Each user turn is also recorded into the session, and the session is pushed to the cloud when the call ends, so the conversation can be resumed or handed to another agent later.

The Moss client is created once per worker process in `prewarm`, with a `cache_path`. Each call reads
its knowledge base names from the job metadata and starts loading them before `ctx.connect()`, so
the loads run while the call connects. See [Process model and index loading](#process-model-and-index-loading)
for why.

**File: `agent.py`**

```python theme={null}
import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from livekit.plugins import openai, deepgram, silero
from livekit.plugins.turn_detector.english import EnglishModel
from livekit.agents import (
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    Agent,
    AgentSession,
    ChatContext,
    ChatMessage,
    RunContext,
    function_tool,
)

# Moss imports
from moss import MossClient, DocumentInfo, QueryOptions

load_dotenv()

# Knowledge bases for a call dispatched without "moss_indexes" in its metadata
DEFAULT_INDEXES = [os.getenv("MOSS_INDEX_NAME", "product-knowledge")]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("moss-agent")


class MossSemanticRetrievalAgent(Agent):

    def __init__(self, moss_client: MossClient, indexes: list[str], moss_session):
        super().__init__(
            instructions="""
                You are a helpful customer support voice assistant.
                When you need facts about products or policies, call
                search_knowledge_base. To recall something said earlier in this
                call, call search_conversation. If the tools return nothing
                useful, say you don't know.
            """
        )
        self.moss = moss_client
        self.indexes = indexes  # long-term knowledge bases loaded for this call
        self.moss_session = moss_session  # short-term, per-call SessionIndex
        self._turn = 0

    @function_tool
    async def search_knowledge_base(self, context: RunContext, query: str) -> str:
        """Search the product and support knowledge base.

        Args:
            query: A focused query describing the facts to look up.
        """
        if not self.indexes:
            return "The knowledge base is unavailable."
        # Searches every loaded knowledge base at once. They must share one embedding model.
        results = await self.moss.query_multi_index(
            self.indexes, query, QueryOptions(top_k=5, alpha=0.8)
        )
        if not results.docs:
            return "No relevant entries found."
        return "\n".join(f"- {d.text}" for d in results.docs)

    @function_tool
    async def search_conversation(self, context: RunContext, query: str) -> str:
        """Recall something said earlier in this same call.

        Args:
            query: What to look for in the conversation so far.
        """
        results = await self.moss_session.query(query, QueryOptions(top_k=3))
        if not results.docs:
            return "Nothing relevant was said earlier in this call."
        return "\n".join(f"- {d.text}" for d in results.docs)

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        # Record each turn in the session (local, ~1-5 ms) so it can be recalled
        # later via search_conversation and persisted at call end. This only
        # writes to the session; it does not inject anything into the prompt.
        self._turn += 1
        try:
            await self.moss_session.add_docs(
                [DocumentInfo(id=f"user-turn-{self._turn}", text=new_message.text_content)]
            )
        except Exception as e:
            logger.error(f"Failed to index turn: {e}")

        await super().on_user_turn_completed(turn_ctx, new_message)


def prewarm(proc: JobProcess) -> None:
    # Runs once in each new worker process, before a call is assigned to it.
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["moss"] = MossClient(
        os.environ["MOSS_PROJECT_ID"],
        os.environ["MOSS_PROJECT_KEY"],
        cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
    )


async def load_knowledge(moss: MossClient, names: list[str]) -> list[str]:
    # Concurrent loads overlap their round trips to the cloud.
    results = await asyncio.gather(
        *(moss.load_index(name) for name in names), return_exceptions=True
    )
    loaded = []
    for name, result in zip(names, results):
        if isinstance(result, BaseException):
            logger.warning(f"Knowledge index '{name}' not loaded: {result}")
        else:
            loaded.append(name)
    return loaded


async def entrypoint(ctx: JobContext):
    moss: MossClient = ctx.proc.userdata["moss"]

    # The dispatch names the call's knowledge bases in the job metadata,
    # for example {"moss_indexes": ["acme-faq", "acme-policies"]}.
    metadata = json.loads(ctx.job.metadata or "{}")
    indexes = metadata.get("moss_indexes", DEFAULT_INDEXES)

    # Short-term context: a session keyed to this call. It auto-loads if a cloud
    # index with this name already exists (an earlier handoff), or starts empty
    # for a brand-new call.
    call_id = f"call-{ctx.job.room.name}"

    # Start loading before connecting, so the loads run while the call connects.
    loading = asyncio.gather(load_knowledge(moss, indexes), moss.session(index_name=call_id))

    await ctx.connect()

    # Create the LiveKit voice pipeline.
    session = AgentSession(
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(),
        turn_detection=EnglishModel(),
        vad=ctx.proc.userdata["vad"],
    )

    loaded, moss_session = await loading
    logger.info(f"Loaded {loaded}, opened session '{call_id}' ({moss_session.doc_count} docs)")

    # When the call ends, push the session to the cloud so the conversation can
    # be resumed later or handed off to another agent.
    async def persist_session():
        try:
            result = await moss_session.push_index()
            logger.info(f"Pushed session '{call_id}': {result.doc_count} docs")
        except Exception as e:
            logger.error(f"Failed to push session: {e}")

    ctx.add_shutdown_callback(persist_session)

    # Start the session with our custom MossSemanticRetrievalAgent.
    await session.start(
        agent=MossSemanticRetrievalAgent(moss, loaded, moss_session),
        room=ctx.room,
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
```

> [!NOTE]
>
> The session indexes each turn locally during the call and pushes to the cloud
> at the end, so a later session opened with the same name resumes the
> conversation, which is the basis for cross-agent handoff. See
> [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) for the full API.

**5. Running the Agent**

First, start the LiveKit server in development mode:

```bash theme={null}
livekit-server --dev
```

Then, in a separate terminal, start your worker. The necessary VAD models will handle themselves or be downloaded automatically if needed by the plugin.

```bash theme={null}
python agent.py download-files
python agent.py console
```

## Process model and index loading

By default, LiveKit Agents runs each call in its own process. The worker keeps idle processes
ready, runs `prewarm` once in each new process before a call is assigned to it, then gives the
process one call. The process exits when the call ends, so nothing loaded for a call carries
over to the next one.

That decides where each piece of Moss work goes:

* **`prewarm` creates the client.** It holds what every call needs: the VAD model, and a
  `MossClient` with its `cache_path`.
* **The entrypoint loads the call's indexes.** Only the job knows which knowledge bases a call
  needs. Read their names from the job metadata and start one `load_index` per index under
  `asyncio.gather` before `ctx.connect()`, so the loads run concurrently while the call connects.
* **Index loads stay out of `prewarm`.** It runs in every new process before any call is known, so
  loading every knowledge base there makes each process download, parse and hold all of them. It
  must also finish within `initialize_process_timeout`, 10 seconds by default.
* **`cache_path` keeps loads short.** Without it, each load makes four round trips to the cloud,
  the last one downloading the index. With the index already in the cache it makes two and reads
  the index from disk. If the cloud is unreachable or answers with a temporary error, it serves the
  cached copy instead of failing; a 401, 403 or 404 still fails
  ([Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md#loading-from-the-cache-offline)).
  With a process per call, the embedding model opens fresh in every call and cannot open while
  the cloud is unreachable, so queries with `alpha` above 0 fail during an outage; keyword-only
  queries (`alpha=0`) and queries that pass their own embedding keep working.
  Put the directory on storage that outlives the container.
* **The first load in a process also opens the embedding model**, about half a second when the
  model is on disk. The model is cached under `~/.cache/moss-models/`. Keep that directory in the
  image or on persistent storage too, or every new container downloads the model (about 91 MB for
  `moss-minilm`) on its first call.

Each process holds its own embedding model, about 150 MiB, and its own copy of every index it
loads. Nothing is shared between processes, even with a common `cache_path`. See
[Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md) to estimate a host's memory. When many concurrent
calls use the same knowledge bases, two setups share that memory:

* **The thread executor.** `WorkerOptions(job_executor_type=JobExecutorType.THREAD)` runs every
  call of a worker in one process, so calls share one client, one model and one copy of each
  index. Calls are no longer isolated: a crash or a blocking call affects every call on the
  worker. In this mode `prewarm` runs once per call, so keep the client at module level, as below.
* **A retrieval service per host.** One process holds the client and the indexes and answers
  queries from every worker process on the host over a local connection. It fits when you want to
  keep one call per process, or when several services need the same indexes.

> **A shared client for the thread executor**
>
> `MossClient` is not tied to an event loop: every method runs the core on a worker thread, so one
> module-level client serves the loop of every call. Each call loads its indexes: for an index that is
> already loaded, `load_index` checks the cloud for a newer version, and each load is also where Moss
> checks the project's account, for example a paused project.
>
> ```python theme={null}
> import asyncio
> import json
> import os
>
> from livekit.agents import JobContext, JobExecutorType, WorkerOptions, cli
> from moss import MossClient
>
> # One client for every call on the worker: one embedding model, one copy of each index.
> moss = MossClient(
>     os.environ["MOSS_PROJECT_ID"],
>     os.environ["MOSS_PROJECT_KEY"],
>     cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
> )
>
>
> async def entrypoint(ctx: JobContext):
>     indexes = json.loads(ctx.job.metadata or "{}")["moss_indexes"]
>     # Loads each index, or checks a loaded one for a newer version.
>     loading = asyncio.gather(*(moss.load_index(name) for name in indexes))
>     await ctx.connect()
>     # ... create the AgentSession, then:
>     await loading
>     # ... start the session with an agent that calls moss.query_multi_index(indexes, text, options)
>
>
> if __name__ == "__main__":
>     cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, job_executor_type=JobExecutorType.THREAD))
> ```
>
> With `moss` 1.20 and earlier, loading an index that is already loaded reads it again from
> `cache_path`. The worker keeps every index a call has used until it exits; if it can see more
> knowledge bases than its memory holds, unload the idle ones as in
> [Unload idle indexes](https://docs.moss.dev/docs/integrate/memory-sizing.md#unload-idle-indexes). Leave `auto_refresh` off in
> a worker like this: its periodic refresh counts as session time, so a worker that runs for days is
> billed for session minutes around the clock, with or without calls.

## Retrieval and preemptive generation

LiveKit's `AgentSession` runs **preemptive generation** by default: it starts drafting the reply
speculatively as soon as a final transcript arrives, before the turn is confirmed. In current LiveKit
Agents it is set through `turn_handling` (`TurnHandlingOptions(preemptive_generation={"enabled": ...})`);
the older top-level `preemptive_generation` argument is deprecated.

`on_user_turn_completed` runs later, at turn confirmation, after that draft has started. Injecting
retrieval there with `turn_ctx.add_message` makes the draft stale, so LiveKit discards and regenerates
it on every injected turn. So expose retrieval as a `@function_tool` (as the agent above does, and as
the [Founding Agent](https://docs.moss.dev/docs/founding-agent/overview.md) runs in production): `turn_ctx` stays stable at the
boundary, and retrieval composes with preemptive generation. An ambient pattern that injects every turn
must instead turn preemptive generation off
(`turn_handling=TurnHandlingOptions(preemptive_generation={"enabled": False})`); see the
[airline customer agent](https://docs.moss.dev/docs/cookbook/airline-customer-agent.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/errors.md

# Errors & Troubleshooting

> Reference for common Moss SDK errors and how to fix them

## Error codes

Every failure the native core reports carries a stable code. Branch on the code, not on the
message: a core failure's message is fixed text for each kind of failure, such as
`Index not found.`, with no URLs, file paths or index names. An argument the SDK rejects
itself keeps a message that describes it. *(Python moss 1.15.0+, @moss-js/moss 1.16.0+,
@moss-dev/moss-web 1.4.0+, Elixir moss 1.5.0+, Swift SDK 0.8.0+)*

| Code | Meaning |
| - | - |
| `INVALID_ARGUMENT` | The caller passed a value the operation cannot accept. |
| `NOT_FOUND` | The index or other named resource does not exist or is not loaded. |
| `UNAUTHORIZED` | The credentials, token or plan do not permit the operation. |
| `NETWORK` | The Moss service could not be reached or did not answer in time. |
| `DESERIALIZATION` | Index data, a snapshot or a service response could not be decoded. |
| `MODEL_UNAVAILABLE` | The embedding model could not be downloaded, verified or loaded. |
| `INTERNAL` | A failure inside the SDK that the caller cannot correct. |

Each SDK exposes the code in its own form:

| SDK | Error | Code |
| - | - | - |
| Python | [`MossError`](https://docs.moss.dev/docs/reference/python/interfaces/MossError), a `RuntimeError`. [`InvalidArgumentError`](https://docs.moss.dev/docs/reference/python/interfaces/InvalidArgumentError) is its `INVALID_ARGUMENT` subclass and also a `ValueError`. | `error.code`, a string such as `"NOT_FOUND"` |
| JavaScript | An `Error` that [`isMossError`](https://docs.moss.dev/docs/reference/js/functions/isMossError) accepts, typed [`MossError`](https://docs.moss.dev/docs/reference/js/interfaces/MossError) | `error.code`, a [`MossErrorCode`](https://docs.moss.dev/docs/reference/js/type-aliases/MossErrorCode) |
| Browser | An `Error` with a `code` property. See [Errors](https://docs.moss.dev/docs/reference/browser/api.md#errors). | `error.code`, a string such as `"NOT_FOUND"` |
| Elixir | [`%Moss.Error{}`](https://docs.moss.dev/docs/reference/elixir/types#error), the `reason` in `{:error, reason}` | `reason.code`, an atom such as `:not_found` |
| Swift | [`MossError`](https://docs.moss.dev/docs/reference/swift/types#mosserror) | `error.code`, an `Int32` to compare with a constant such as `MossError.notFound` |

Some errors an SDK raises before it calls the core carry no code. In Python a closed
`MossClient` raises `RuntimeError` and some argument checks raise `ValueError` or `TypeError`;
in JavaScript a closed client or session and `createIndex` with no documents throw a plain
`Error`; in the browser `queryMultiIndex([])` throws a plain `Error`. The Python and
JavaScript web source methods raise `ManageApiError`. Elixir and Swift report their own
argument checks as a `%Moss.Error{}` and a `MossError` too.

`detail` holds the core error text: diagnostic text for logs and support, at most 512 bytes,
and not a stable contract. It names the operation or host instead of a request URL, and the
file instead of an absolute path. A failed response contributes only its HTTP status and the
error code its body names, such as `HTTP 403 Forbidden: AccessDenied`.

A bulk load reports the code of each index it could not load next to the message:
`LoadIndexesResult.failed_codes` in [Python](https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult.md)
and [Elixir](https://docs.moss.dev/docs/reference/elixir/types.md#loadindexesresult), and `failedCodes` in
[JavaScript](https://docs.moss.dev/docs/reference/js/interfaces/LoadIndexesResult.md),
[the browser](https://docs.moss.dev/docs/reference/browser/classes/MossClient.md#loadindexes) and
[Swift](https://docs.moss.dev/docs/reference/swift/types.md#loadindexesresult).

***

## Error reference

| Error | Cause | Fix |
| - | - | - |
| `Unauthorized` | Missing or invalid credentials | Set `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` in your environment |
| `Cannot find native binding` | `@moss-js/moss` was installed without optional dependencies, so the native binary for your platform is missing | Reinstall with optional dependencies. See [Install](https://docs.moss.dev/docs/reference/js/api.md#install) |
| `Index not found` | Querying or loading an index that doesn't exist | Call `createIndex()` first; verify the name matches exactly (case-sensitive) |
| `Index not loaded` | Calling `query()` before `loadIndex()` | Call `loadIndex(name)` before `query()`. `query()` throws if the index isn't loaded locally |
| `Index already exists` | Calling `createIndex()` on an existing index name | Use `addDocs()` with `upsert: true` to update documents, or delete the index first |
| `Missing embeddings runtime` | Invalid or unrecognised `modelId` | Use `moss-minilm`, `moss-mediumlm`, or `custom` |
| `Embedding required` | Using `modelId: 'custom'` without providing `embedding` | Supply an `embedding` array on every document and every `query()` call |
| `Job failed` | Async mutation error | Inspect `JobStatusResponse.error` via `getJobStatus(jobId)` |
| `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes` | An index name that is blank, `.` or `..`, contains `/` or a control character, or is longer than 256 bytes. The SDK rejects it before sending any request | Use a name within these rules. Pass the raw name: the SDK percent-encodes it, so an already encoded name addresses a different index. *(Python moss 1.14.0+, @moss-js/moss 1.15.0+, @moss-dev/moss-web 1.3.0+, Elixir moss 1.4.0+, Swift SDK 0.7.0+)* |
| `Unsupported chunk_size 100. Supported: 200 to 2000` (also `chunk_overlap`, `markdown_header_depth` and `mode`) | Python `Chunking(...)` got a value out of range. It raises `InvalidArgumentError` | Use `chunk_size` 200 to 2000, `chunk_overlap` 0 to half of `chunk_size`, `markdown_header_depth` 1 to 6, and `mode` `"pages"` or `"sentences"`. See [`Chunking`](https://docs.moss.dev/docs/reference/python/interfaces/Chunking). *(Python moss 1.18.0+)* |
| `chunk 1 of document "faq" has 2001 characters; chunks may have at most 2000 (about 512 tokens of English, the embedding model's input limit)` | A Python `chunker` returned a chunk of more than 2,000 characters. It raises `InvalidArgumentError` | Return chunks of at most 2,000 characters from `chunker`. *(Python moss 1.18.0+)* |
| `pass chunker or chunking, not both` | Python `create_index` or `add_docs` got both `chunker=` and `chunking=`. It raises `TypeError` | Pass one of them. *(Python moss 1.18.0+)* |
| `chunker and chunking cannot be used with model_id='custom': chunks have no embeddings` | Python `create_index` with `model_id="custom"`, or `SessionIndex.add_docs` on a custom-model session, got `chunker=` or `chunking=`. It raises `ValueError` | Chunk and embed the text yourself, then pass the chunks as documents with their `embedding`, without `chunker` or `chunking`. *(Python moss 1.18.0+)* |
| `no text to index in: a.md` | A Python file or document had no text left to index after chunking, such as a markdown file with only headings. It raises `InvalidArgumentError` | Add text to the listed files or documents, or leave them out. *(Python moss 1.18.0+)* |
| `cannot chunk document "faq" because it has an embedding` | A Python document with an `embedding` was passed with `chunker=` or `chunking=`. It raises `InvalidArgumentError` | Remove `embedding` and let the model embed each chunk, or chunk the text yourself and pass the chunks with their embeddings. *(Python moss 1.18.0+)* |

***

## Common scenarios

### Search results are irrelevant

* **Try hybrid search**: lower `alpha` for more keyword matching (default is `0.8`):
  ```ts theme={null}
  await client.query('my-index', 'query text', { topK: 5, alpha: 0.5 })
  ```
* **Check document chunking**: very long documents dilute embedding signal. Keep chunks under about 1200 characters, cut at sentence boundaries - see [Chunking tips](https://docs.moss.dev/docs/integrate/indexing-data.md#chunking-tips).
* **Switch models**: try `moss-mediumlm` for higher accuracy.

***

## SDK error behaviour

* Most methods throw if the target index does not exist.
* `createIndex()` throws if the index already exists.
* `loadIndex()` throws if the index does not exist in cloud storage or loading fails. With a `cachePath` (`cache_path` in Python) and a snapshot already on disk, it serves that snapshot instead when the cloud is unreachable or answers with a temporary error, while a 401, 403 or 404 still throws. *(Python moss 1.14.0+, @moss-js/moss 1.15.0+)*

If a job reaches `"failed"`, its `JobStatusResponse.error` will be non-null. The job's `currentPhase` (see [JobPhase](https://docs.moss.dev/docs/reference/js/type-aliases/JobPhase.md)) can hint at where it failed - a job stuck on `downloading` usually means a network issue.

***

## Still stuck?

* Join the [Moss Discord](https://discord.gg/eMXExuafBR) for community help
* Open an issue on [GitHub](https://github.com/usemoss/moss)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/pricing.md

# Pricing & Limits

> Plan allowances, limits, and pay-as-you-go rates for Moss.

| Feature | Developer | Hobbyist | Startup | Enterprise | Pay-as-you-go |
| - | - | - | - | - | - |
| **Price** | Free - \$5/mo in credits | \$30 / mo | \$200 / mo | Custom | - |
| **Storage** | 500 MB | 2 GB | 10 GB | Custom | \$1.50 / GB-month |
| **Ingest** | 50 MB / mo | 500 MB / mo | 5 GB / mo | Custom | \$0.03 / MB |
| **Egress** | 10 GB / mo | 100 GB / mo | 500 GB / mo | Custom | \$0.09 / GB |
| **Session minutes** | 60 / mo | 250 / mo | 1,500 / mo | Commit ladder | \$0.05 / min |
| **Crawled URLs** | 25 / mo | 100 / mo | 250 / mo | Custom | \$0.005 / URL |
| **Parsed document pages** | 10 / mo | 25 / mo | 100 / mo | Custom | \$0.01 / page |
| **Crawl size per crawl run** | 25 pages | 500 pages | 5,000 pages | Custom (up to 5,000 per request) | - |
| **Concurrent crawl and parse jobs** | 1 | 1 | 150 | Custom | - |
| **Manual web source re-sync** | - | ✅ | ✅ | ✅ | - |
| **Scheduled web source refresh** | - | - | ✅ | ✅ | - |
| **Projects** | 1 | Unlimited | Unlimited | Unlimited | - |
| **Indexes** | 3 | Unlimited | Unlimited | Unlimited | - |
| **Local queries** | Unlimited | Unlimited | Unlimited | Unlimited | Never metered |
| **Sync Engine** | - | Standard | Standard | Dedicated | - |
| **Sessions** | ✅ | ✅ | ✅ | ✅ | - |
| **Standard / BYO embedding models** | ✅ | ✅ | ✅ | ✅ | - |
| **HQ / HP embedding models** | - | - | - | ✅ | - |
| **SOC 2** | - | - | - | ✅ | - |
| **HIPAA** | - | - | - | ✅ | - |
| **Data residency / VPC deploy** | - | - | - | ✅ | - |
| **Support** | Discord | Discord | Email | Shared Slack | - |

*Per-turn and per-async-conversation pricing available on request. VPC / on-prem offered as an add-on. Parsed document pages count every page of a parsed PDF. Every crawl run counts its pages against the monthly crawled URL allowance: the first crawl, each manual re-sync, and each scheduled refresh. On the Developer plan, crawling and parsing stop at the included pages unless pay-as-you-go is on with a payment method; otherwise upgrade to Hobbyist.*

## Inference

| Item | Price |
| - | - |
| `moss` input tokens | \$0.25 / 1M tokens |
| `moss` output tokens | \$1.75 / 1M tokens |
| Retrievals | \$0.50 / 1k retrievals |
| Vendor model tokens, with your own key | Billed by the vendor |

*Billed on every plan, no included allowance. Tokens are the `usage` counts of `moss` replies from [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md), retrieved facts included. A retrieval is one request that searches your indexes, with any model; `X-Moss-Retrieve: off` skips it. Inference is not billed as session minutes.*


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/sdk.md

# SDK Overview

> Every Moss SDK capability, with links to the detailed guide for each.

Moss ships official SDKs for seven platforms. They share one conceptual API (create or load an
index, then query) and one index format, so you can build in one and query from another.

> **[Python](https://docs.moss.dev/docs/reference/python/api.md)**
>
> Async Python SDK. `pip install moss`

> **[JavaScript](https://docs.moss.dev/docs/reference/js/api.md)**
>
> Node.js server-side SDK. `npm install @moss-js/moss`

> **[Swift (iOS)](https://docs.moss.dev/docs/reference/swift/api.md)**
>
> On-device iOS SDK via Swift Package Manager.

> **[Android](https://docs.moss.dev/docs/reference/android/getting-started.md)**
>
> On-device Android SDK, a Kotlin AAR.

> **[Elixir](https://docs.moss.dev/docs/reference/elixir/api.md)**
>
> Elixir SDK on Hex. `{:moss, "~> 1.0"}`

> **[Browser](https://docs.moss.dev/docs/reference/browser/api.md)**
>
> In-browser / WebAssembly SDK. `npm install @moss-dev/moss-web`

> **[C](https://docs.moss.dev/docs/reference/c/getting-started.md)**
>
> Native C library (libmoss).

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

## Capabilities

Everything the SDKs can do. Pick a language above for install and quickstart; follow a link
below for the details.

Links below go to the Python pages; each topic has a JavaScript equivalent under the JavaScript SDK.

| Capability | What it does | Learn more |
| - | - | - |
| Index management | Create, add, update, delete, get, and list indexes | [Indexing](https://docs.moss.dev/docs/reference/python/api.md#indexes) |
| Index from files | Build an index from PDF/DOCX with server-side parsing and OCR | [Index from files](https://docs.moss.dev/docs/reference/python/files.md) |
| Load and query | Load an index into memory and run semantic search | [Load and query](https://docs.moss.dev/docs/reference/python/api.md#load-and-query) |
| Hybrid search | Blend semantic and keyword scoring with `alpha` | [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md) |
| Metadata filtering | Narrow results with `$eq`, `$in`, `$near`, `$and`/`$or`, and more | [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md) |
| Custom embeddings | Bring your own vectors with `model_id="custom"` | [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md) |
| Multi-index search | Query across several loaded indexes in one call, with the same `alpha` blend as a single-index query. Also in the JavaScript and Elixir SDKs | [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md) |
| Real-time sessions | Local-first indexing during a live interaction | [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) |
| Cross-agent handoff | Resume a session across agents, channels, and devices | [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) |
| Hydration and sync | Hydrate from the cloud, auto-refresh, and push updates | [Keeping indexes fresh](https://docs.moss.dev/docs/reference/python/api.md#keeping-indexes-fresh) |
| Inference | OpenAI-compatible chat completions answered from your indexes. Every SDK has an inference client, and any OpenAI client works too, on a server or in a browser page. Direct page calls with the project key are for prototypes, local demos and internal tools; a public page calls through a route of yours, see [Keep the project key on your server](https://docs.moss.dev/docs/reference/browser/inference.md#keep-the-project-key-on-your-server) | [Python](https://docs.moss.dev/docs/reference/python/inference.md), [JavaScript](https://docs.moss.dev/docs/reference/js/inference.md), [Swift](https://docs.moss.dev/docs/reference/swift/inference.md), [Android](https://docs.moss.dev/docs/reference/android/inference.md), [Elixir](https://docs.moss.dev/docs/reference/elixir/inference.md), [Browser](https://docs.moss.dev/docs/reference/browser/inference.md), [C](https://docs.moss.dev/docs/reference/c/inference.md), [HTTP API](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) |

## Models

* `moss-minilm` (default) - fast, lightweight, good for edge and offline
* `moss-mediumlm` - higher accuracy with reasonable performance
* `moss-litelm` - the on-device default on iOS and Android
* `custom` - bring your own embedding vectors

## Samples

Runnable end-to-end examples live in the
[moss](https://github.com/usemoss/moss) repo, with parallel JavaScript and
Python projects you can adapt by swapping in your own data.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/api.md

# Overview

> Everything the Moss Python SDK can do, with a snippet for each operation.

The Moss Python SDK (`moss`) brings semantic search to Python. It wraps a high-performance
Rust core and exposes an async API. Documents are embedded and queried locally, with optional
cloud sync.

## Requirements

* Python 3.10 or higher

## Install

```bash theme={null}
pip install moss
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

Get your project credentials from the [Moss portal](https://portal.usemoss.dev).

## Two ways to search

* [`MossClient`](./classes/MossClient) - the entry point. Manage cloud indexes, load one into memory, and query it.
* [`SessionIndex`](./classes/SessionIndex) - a local, in-process index for real-time indexing during a live interaction; push to the cloud when done.

## Quick start

```python theme={null}
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    await client.create_index("faqs", [
        DocumentInfo(id="doc1", text="Track your order in your account.", metadata={"category": "shipping"}),
        DocumentInfo(id="doc2", text="30-day return policy for most items.", metadata={"category": "returns"}),
    ])
    await client.load_index("faqs")
    results = await client.query("faqs", "return a damaged product", QueryOptions(top_k=3))
    for doc in results.docs:
        print(doc.id, doc.score)

asyncio.run(main())
```

## Indexes

Create, inspect, and delete cloud indexes. Mutations run as async jobs and return a
`MutationResult` with a `job_id` and `doc_count`.

```python theme={null}
# Create (defaults to moss-minilm)
result = await client.create_index("faqs", documents)

# Inspect
info = await client.get_index("faqs")     # IndexInfo: name, doc_count, model.id, status
indexes = await client.list_indexes()      # list[IndexInfo]

# Delete
await client.delete_index("faqs")
```

## Index from files

Build an index straight from PDF and DOCX files - the server parses, chunks, and embeds
them. Up to 20 files per call.

```python theme={null}
from moss import ParseFileInput, ParseOptions

await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
], parse_options=ParseOptions(ocr_mode="full_ocr"))
```

See [Index from files](https://docs.moss.dev/docs/reference/python/files.md).

## Documents

Add, update, fetch, and remove documents on an existing index.

```python theme={null}
from moss import MutationOptions, GetDocumentsOptions

# Add or upsert
await client.add_docs("faqs", new_docs, MutationOptions(upsert=True))

# Fetch all, or by id
all_docs = await client.get_docs("faqs")
some = await client.get_docs("faqs", GetDocumentsOptions(doc_ids=["doc1", "doc2"]))

# Delete by id
await client.delete_docs("faqs", ["doc6", "doc7"])
```

## JSON, files and chunking

`create_index`, `add_docs` and `SessionIndex.add_docs` also take dicts, JSON array or JSON Lines
text, and `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` files as
`pathlib.Path` objects. Text and markdown files are chunked into documents `{path}#{n}` with
metadata `parentId`. Tune that with `chunking=Chunking(...)`, or split text yourself with
`chunker=`. *(moss 1.18.0+)*

```python theme={null}
from pathlib import Path
from moss import Chunking

await client.create_index("faqs", Path("faqs.jsonl"))
await client.add_docs("faqs", [{"id": "doc9", "text": "30-day returns."}])
await client.create_index("handbook", Path("handbook.md"), chunking=Chunking(chunk_size=800))
```

`Chunking`, `DocsInput` and `Chunker` are exported from `moss`. See [`Chunking`](./interfaces/Chunking).

## Load and query

Load an index into memory, then query it in-process. Call `load_index` before querying.

```python theme={null}
await client.load_index("faqs")
results = await client.query("faqs", "return a damaged product", QueryOptions(top_k=3))
for doc in results.docs:
    print(doc.id, doc.score, doc.text)

await client.unload_index("faqs")   # free memory when done
```

## Hybrid search

Blend semantic and keyword scoring with `alpha` (1.0 = semantic, 0.0 = keyword; default 0.8).

```python theme={null}
await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.6))
```

See [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md).

## Metadata filtering

Narrow results by document metadata on a loaded index.

```python theme={null}
await client.query("products", "running shoes", QueryOptions(top_k=5, filter={
    "$and": [
        {"field": "category", "condition": {"$eq": "shoes"}},
        {"field": "price",    "condition": {"$lt": "100"}},
    ],
}))
```

Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`, composed with
`$and` / `$or`. See [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md).

## Custom embeddings

Supply your own vectors with `model_id="custom"` (each document carries `embedding`, and
queries pass `embedding`).

```python theme={null}
await client.create_index("tickets", docs_with_embeddings, model_id="custom")
await client.load_index("tickets")
await client.query("tickets", "billing problem", QueryOptions(top_k=3, embedding=query_vector))
```

See [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md).

## Multi-index search

Query several loaded indexes in one call; each result is tagged with its source `index_name`.

```python theme={null}
await client.load_indexes(["products", "reviews", "faqs"])
results = await client.query_multi_index(["products", "reviews", "faqs"], "battery life", QueryOptions(top_k=6))
for doc in results.docs:
    print(doc.index_name, doc.id, doc.score)
await client.unload_indexes(["products", "reviews", "faqs"])
```

See [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md).

## Sessions

Index and query locally in real time with a [`SessionIndex`](./classes/SessionIndex), then
push to the cloud. `session()` resumes an existing cloud index by name, or starts empty.

```python theme={null}
session = await client.session(index_name="call-123")
await session.add_docs([DocumentInfo(id="turn-1", text="Customer reported a duplicate charge.")])
hits = await session.query("billing issue", QueryOptions(top_k=3))
await session.push_index()
```

Save a session to disk and restore it in a later run with no index download.
*(moss 1.16.0+)*

```python theme={null}
await session.save_to_disk("/var/cache/my-app/moss")

# Later: skip the cloud load and restore the snapshot
session = await client.session(index_name="call-123", auto_load_on_init=False)
loaded = await session.load_from_disk("/var/cache/my-app/moss")
```

See [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md).

## Keeping indexes fresh

Auto-refresh a loaded index (poll the cloud and hot-swap newer versions in automatically),
and track async jobs.

```python theme={null}
await client.load_index("faqs", auto_refresh=True, polling_interval_in_seconds=300)
status = await client.get_job_status(result.job_id)
```

## Inference

Answer chat messages with facts from your indexes. A `MossInference` client takes the
arguments of OpenAI's `chat.completions.create`, plus `indexes`, and returns replies with
OpenAI's field names. *(moss 1.20.0+)*

```python theme={null}
from moss import MossInference

llm = MossInference(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
stream = await llm.chat.completions.create(
    model="moss",
    messages=[{"role": "user", "content": "Do you ship to Canada?"}],
    indexes=["faqs"],
    stream=True,
)
async with stream:
    async for chunk in stream:
        if chunk.choices:
            print(chunk.choices[0].delta.content or "", end="")
```

See [Inference](https://docs.moss.dev/docs/reference/python/inference.md).

## Errors

Every failure the native core reports raises [`MossError`](./interfaces/MossError), a
`RuntimeError` whose `code` is a stable string such as `"NOT_FOUND"` or `"NETWORK"`. Branch on
`code`, not on the message. [`InvalidArgumentError`](./interfaces/InvalidArgumentError) is the
`INVALID_ARGUMENT` subclass and is also a `ValueError`. `load_indexes` reports each failed
name's code in `failed_codes`. Checks the SDK makes before calling the core, such as a closed
client, raise plain Python exceptions with no `code`. *(moss 1.15.0+)*

```python theme={null}
from moss import MossError

try:
    results = await client.query("faqs", "refund policy")
except MossError as e:
    if e.code != "NOT_FOUND":
        raise
    await client.load_index("faqs")
    results = await client.query("faqs", "refund policy")
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Models

* `moss-minilm` (default) - fast, lightweight
* `moss-mediumlm` - higher accuracy
* `custom` - supply your own embedding vectors via `DocumentInfo.embedding`

## Guides

* [Index from files](https://docs.moss.dev/docs/reference/python/files.md)
* [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md)
* [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
* [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
* [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md)
* [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md)
* [Inference](https://docs.moss.dev/docs/reference/python/inference.md)

## Reference

[MossClient](https://docs.moss.dev/docs/reference/python/classes/MossClient.md) and [SessionIndex](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md), plus all interfaces and types, are in the Reference section of the sidebar.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/sessions.md

# Sessions

> Index and query locally in real time with a SessionIndex, then push to the cloud.

A session is a local, in-process index you read and write in real time, with no cloud round
trip on any operation. Sessions are how the Python SDK does indexing during a live
interaction: indexing transcript turns mid-call, building a per-user working set, or
accumulating context that is handed off between agents.

A session is a [`SessionIndex`](./classes/SessionIndex), created from
[`client.session()`](./classes/MossClient#session-index_name-model_id). For the full method
list, see the [SDK reference](https://docs.moss.dev/docs/reference/python/api.md).

## Create or resume

`client.session(index_name=...)` returns a `SessionIndex`. If a cloud index with that name
already exists, it auto-loads into the session (no re-embedding); otherwise the session
starts empty. The workflow is identical in both cases, so you do not branch on whether the
index exists. Pass `auto_load_on_init=False` to skip that load and start empty, for example
to [restore the session from disk](#save-and-restore-on-disk).

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Auto-loads from cloud if the index exists, starts fresh if not.
    session = await client.session(index_name="my-session-index")
    print(f"{session.doc_count} existing docs loaded")

asyncio.run(main())
```

## Mutate and query locally

`add_docs`, `delete_docs`, and `get_docs` run in-memory; `add_docs` embeds locally via the
Rust core with no network round trip. `query` also runs entirely in-memory (\~1-10 ms) and supports
the same metadata filter syntax as [`client.query()`](./classes/MossClient#query-name-query-options).

```python theme={null}
session = await client.session(index_name="call-123")

# Add or update docs - appended to whatever was loaded.
added, updated = await session.add_docs([
    DocumentInfo(id="turn-1", text="Customer reported a duplicate charge on their March invoice."),
    DocumentInfo(id="turn-2", text="Agent confirmed the refund would arrive in 3-5 business days."),
])
print(f"{added} added, {updated} updated (total: {session.doc_count})")

# Query locally.
results = await session.query("refund timeline", QueryOptions(top_k=3))
for doc in results.docs:
    print(f"{doc.id} score={doc.score:.3f} {doc.text}")

# Fetch and delete by id, all in-memory.
some = await session.get_docs()
await session.delete_docs(["turn-1"])
```

## Persist to the cloud

`push_index()` uploads the session's documents to the cloud under the session's name,
creating or replacing that index. For a built-in model the service re-embeds the text with
that model, so the pushed index answers text queries like one built with `create_index`. A
custom-model session keeps its own embeddings.

```python theme={null}
result = await session.push_index()
print(f"Pushed {result.doc_count} docs (job {result.job_id}) status={result.status}")
```

## Extend an existing index

Because `session()` resumes by name, the same code extends an index across runs. Resume,
append new documents, then push back to overwrite the cloud copy with the combined set.

```python theme={null}
session = await client.session(index_name="my-session-index")  # loads prior docs

await session.add_docs([
    DocumentInfo(id="follow-up-1", text="Customer called back to confirm the refund was received."),
    DocumentInfo(id="follow-up-2", text="Refund of $49.99 appeared on the statement within 3 days."),
])

results = await session.query("refund outcome and customer satisfaction", QueryOptions(top_k=3))
await session.push_index()   # creates or overwrites the cloud index
```

## Save and restore on disk

[`save_to_disk(cache_path)`](./classes/SessionIndex#save_to_disk-cache_path) writes the
session under `<cache_path>/<name>/`. A later session with the same name restores it with
[`load_from_disk(cache_path)`](./classes/SessionIndex#load_from_disk-cache_path-rebuild_legacy),
which returns the number of documents loaded. Open that session with
`auto_load_on_init=False`, so it skips the cloud load and the restore downloads no index.
*(moss 1.16.0+)*

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, MossError

CACHE_DIR = "/var/cache/my-app/moss"

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Skip the cloud load, then restore the last saved snapshot.
    session = await client.session(index_name="notes", auto_load_on_init=False)
    try:
        loaded = await session.load_from_disk(CACHE_DIR)
    except MossError as e:
        if e.code != "DESERIALIZATION":
            raise
        loaded = 0  # no snapshot yet, so the session starts empty
    print(f"{loaded} docs restored, model {session.model_id}")

    await session.add_docs([
        DocumentInfo(id="note-1", text="Customer prefers a call back on Friday."),
    ])

    # Save for the next run.
    await session.save_to_disk(CACHE_DIR)

asyncio.run(main())
```

* The snapshot replaces the session's documents and model, so `session.model_id` reports
  the snapshot's model after a load. After a custom-model snapshot loads, `add_docs` and
  `query` need embeddings.
* A missing or damaged snapshot raises `MossError` with code `DESERIALIZATION` and leaves the
  session as it was. A failed or interrupted save leaves the last saved snapshot loadable.
* A snapshot that an older core saved for a built-in model has no model artifact identity.
  By default `load_from_disk` rebuilds it for a session opened with the same model: it
  re-embeds the stored documents and saves the snapshot back in the same call, which needs
  the cloud for the model. If the model cannot be loaded, it raises `MossError` with code
  `MODEL_UNAVAILABLE` and changes nothing. Pass `rebuild_legacy=False` to load such a snapshot
  as a custom-model session.
* A relative `cache_path` resolves against the current working directory, and `~` is not
  expanded.
* `cache_path` is optional. Without one, snapshots go in `sessions/<project id>/` under the
  client's `cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which
  only session snapshots read, else under `moss` in the default cache directory:
  `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. *(moss 1.19.0+)*

## Live-call context: short-term plus long-term

A session is short-term context - the working set for the current interaction. A persistent
cloud index loaded with [`load_index()`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
is long-term context - durable knowledge shared across interactions. A typical live call
loads a cloud FAQ index for long-term context and opens a session for short-term context,
then queries both for each turn.

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Long-term context: a persistent cloud index, loaded for in-process queries.
    await client.load_index("support-faqs")

    # Short-term context: a session for this specific call.
    session = await client.session(index_name="call-abc")

    # As each turn arrives, index it locally (~1-5 ms).
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer was billed twice for the same renewal."),
    ])

    # Query both for context on the current turn.
    user_turn = "why was I charged twice"
    recent = await session.query(user_turn, QueryOptions(top_k=3))          # this call
    knowledge = await client.query("support-faqs", user_turn, QueryOptions(top_k=3))  # all-time

    context = list(recent.docs) + list(knowledge.docs)
    for doc in context:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

    # At call end, persist the session for future retrieval.
    await session.push_index()
    await client.unload_index("support-faqs")

asyncio.run(main())
```

## Behavior notes

* The session's embedding model is set by `model_id` on `session()` (default `"moss-minilm"`;
  also `"moss-mediumlm"` or `"custom"`). When resuming an existing cloud index, omit
  `model_id` to adopt the stored model - passing a different one raises a `ValueError`. All
  participants resuming the same index must use the same model.
* `session.model_id` is the model the session uses, or `"custom"`. Loading a cloud index or
  a disk snapshot moves the session to the loaded model. *(moss 1.16.0+)*
* With `model_id="custom"`, each document must carry its own `.embedding` and every query
  must pass `QueryOptions.embedding`. See [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md).
* Project credentials are validated when the session is opened; `session()` raises if they
  are invalid.
* `close()` sends the final usage report and frees the session's memory, and
  `async with await client.session(...) as session:` calls it for you. `client.close()`
  also closes every session the client opened. Requires `moss` >= **1.15.0**. See
  [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Related

> **[SessionIndex reference](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md)**
>
> Every session method and property.

> **[Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)**
>
> Filter inside a session query.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/hybrid-search.md

# Hybrid search

> Blend semantic and keyword scoring with a single alpha parameter.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, set on
[`QueryOptions`](./interfaces/QueryOptions). As with all queries, load the index first with
[`load_index()`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/reference/python/sessions.md)).

## The `alpha` parameter

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Example

```python theme={null}
import asyncio
from moss import MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    await client.load_index("faqs")   # required before querying

    # Blend semantic and keyword scoring (60/40).
    hybrid = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.6))

    # Pure keyword.
    keyword_only = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.0))

    # Pure semantic (the default leans here at 0.8).
    semantic_only = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=1.0))

    for doc in hybrid.docs:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

asyncio.run(main())
```

`alpha` also applies inside a [session](https://docs.moss.dev/docs/reference/python/sessions.md) query and composes with
[metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md):

```python theme={null}
session = await client.session(index_name="call-123")
await session.query("billing dispute", QueryOptions(top_k=3, alpha=0.6))
```

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, and so on).

## Behavior notes

* If you omit `alpha`, it defaults to `0.8`.
* `alpha` works the same way for [multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md).

## Related

> **[Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)**
>
> Constrain results by document metadata.

> **[Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md)**
>
> Bring your own vectors.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/metadata-filtering.md

# Metadata filtering

> Narrow query results to documents whose metadata matches a filter.

Attach metadata to documents at index time, then constrain queries to the documents whose
metadata matches a filter passed as [`QueryOptions.filter`](./interfaces/QueryOptions).
Filtering is evaluated on the locally loaded index, so call
[`load_index()`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/reference/python/sessions.md)) before querying with a filter.

## Operators

| Operator | Meaning |
| - | - |
| `$eq`, `$ne` | equals / not equals |
| `$gt`, `$gte`, `$lt`, `$lte` | greater than, greater than or equal to, less than, less than or equal to. See [how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare) |
| `$in`, `$nin` | value in / not in a list |
| `$near` | within a haversine distance of a point: `"lat,lng,radiusMeters"` |

Compose multiple conditions with `$and` / `$or` (nestable). A single condition can be passed
on its own without a wrapper.

Metadata values are strings. Filter values can be `str`, `int` or `float`; a `datetime`
raises `TypeError`.

Dicts and JSON passed to `create_index` or `add_docs` may also hold number and boolean metadata
values. They are stored as strings: `30` becomes `"30"`, and a boolean becomes `"true"` or
`"false"`. Filter booleans with those strings, such as `{"$eq": "true"}`, not with Python
`True`. *(moss 1.18.0+)*

## On a loaded index

```python theme={null}
import asyncio
from datetime import datetime
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    docs = [
        DocumentInfo(id="doc1", text="Running shoes with breathable mesh for daily training.",
                     metadata={"category": "shoes", "price": "79", "city": "new-york",
                               "location": "40.7580,-73.9855"}),
        DocumentInfo(id="doc2", text="Trail running shoes built for rocky terrain.",
                     metadata={"category": "shoes", "price": "149", "city": "seattle",
                               "location": "47.6062,-122.3321"}),
        DocumentInfo(id="doc3", text="Lightweight city backpack with laptop compartment.",
                     metadata={"category": "bags", "price": "95", "city": "new-york",
                               "location": "40.7505,-73.9934"}),
    ]

    index = f"catalog-{datetime.now():%Y%m%d-%H%M%S}"
    await client.create_index(index, docs)
    await client.load_index(index)   # required before filtering

    # $eq - a single condition needs no wrapper.
    await client.query(index, "running gear",
        QueryOptions(top_k=5, filter={"field": "category", "condition": {"$eq": "shoes"}}))

    # $and - shoes under $100.
    await client.query(index, "running shoes",
        QueryOptions(top_k=5, alpha=0.6, filter={"$and": [
            {"field": "category", "condition": {"$eq": "shoes"}},
            {"field": "price",    "condition": {"$lt": "100"}},
        ]}))

    # $in - city in a set.
    await client.query(index, "city essentials",
        QueryOptions(top_k=5, filter={"field": "city", "condition": {"$in": ["new-york"]}}))

    # $near - within 5km of Times Square.
    await client.query(index, "city products",
        QueryOptions(top_k=5, filter={"field": "location",
                                      "condition": {"$near": "40.7580,-73.9855,5000"}}))

asyncio.run(main())
```

## Inside a session

A [session](https://docs.moss.dev/docs/reference/python/sessions.md) query takes the same filter syntax, evaluated in-memory against the
local session index. The example below indexes a call transcript and applies a range of
operators.

```python theme={null}
session = await client.session(index_name="call-123")
await session.add_docs([
    DocumentInfo(id="t1", text="Customer opened the call about an incorrect charge.",
                 metadata={"speaker": "agent", "topic": "billing", "priority": "3"}),
    DocumentInfo(id="t2", text="I need a full refund for the duplicate charge of $49.99.",
                 metadata={"speaker": "customer", "topic": "refund", "priority": "5"}),
    DocumentInfo(id="t3", text="The refund will be processed within 3 to 5 business days.",
                 metadata={"speaker": "agent", "topic": "refund", "priority": "4"}),
])

# $eq - customer turns only.
await session.query("what did the customer say",
    QueryOptions(top_k=5, filter={"field": "speaker", "condition": {"$eq": "customer"}}))

# $ne - exclude agent turns.
await session.query("what was discussed",
    QueryOptions(top_k=5, filter={"field": "speaker", "condition": {"$ne": "agent"}}))

# $gt - priority > 3.
await session.query("urgent issues",
    QueryOptions(top_k=5, filter={"field": "priority", "condition": {"$gt": "3"}}))

# $or - refund or upgrade topics.
await session.query("account changes",
    QueryOptions(top_k=5, filter={"$or": [
        {"field": "topic", "condition": {"$eq": "refund"}},
        {"field": "topic", "condition": {"$eq": "upgrade"}},
    ]}))
```

## Date ranges

Store dates as Unix epoch seconds in a decimal string and filter with integers, so both
sides compare as numbers. [Filter by date](https://docs.moss.dev/docs/integrate/metadata-filtering.md#filter-by-date)
explains the encoding and the pitfalls of ISO 8601 strings.

```python theme={null}
from datetime import datetime, timezone
from moss import GetDocumentsOptions

created = datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc)
timestamp_str = str(int(created.timestamp()))
await session.add_docs(
    [
        DocumentInfo(
            id="t4",
            text="Customer confirmed the refund arrived.",
            metadata={"created_at": timestamp_str},
        ),
    ]
)

january = {
    "$and": [
        # 2026-01-01T00:00:00Z to 2026-01-31T23:59:59Z
        {"field": "created_at", "condition": {"$gte": 1767225600}},
        {"field": "created_at", "condition": {"$lte": 1769903999}},
    ]
}
await session.query("refund", QueryOptions(top_k=5, filter=january))

# Every match, oldest first, with no ranking (sessions only).
await session.get_docs(GetDocumentsOptions(filter=january, sort_by="created_at"))
```

## Related

> **[Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)**
>
> Blend semantic and keyword scoring.

> **[Sessions](https://docs.moss.dev/docs/reference/python/sessions.md)**
>
> Filter against a live local index.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/multi-index-search.md

# Multi-index search

> Search across multiple loaded indexes in one call and get a global top-K.

Sometimes the answer is spread across separate corpora - a product catalog, its reviews,
and an FAQ - that you keep as distinct indexes. Multi-index search queries several loaded
indexes in a single call and returns the global top-K, with each result tagged by its source
index. See [`query_multi_index`](./classes/MossClient#query_multi_index-names-query-options)
in the reference.

## Usage

Load the indexes (in bulk with `load_indexes`), then query them together with
`query_multi_index`. Every result document carries an `index_name` so you know where it came
from.

```python theme={null}
import asyncio
from moss import MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    indexes = ["products", "reviews", "faqs"]

    # Bulk-load (best-effort; one failure does not roll back the others).
    result = await client.load_indexes(indexes)
    print(f"loaded={result.loaded} failed={result.failed}")

    # One query across all three; global top-K, tagged by source.
    results = await client.query_multi_index(
        indexes, "wireless headphones battery life", QueryOptions(top_k=6)
    )
    for doc in results.docs:
        print(f"[{doc.index_name}] {doc.id} score={doc.score:.3f} {doc.text[:60]}")

    await client.unload_indexes(indexes)

asyncio.run(main())
```

## Behavior notes

* All indexes must be loaded locally (via
  [`load_index`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
  or [`load_indexes`](./classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds))
  and share the same embedding model. Querying indexes with different models raises an error.
* `top_k` is global, not per-index - it caps the merged result set. The default is `10`
  (single-index `query` defaults to `5`).
* `QueryOptions.alpha` works as in single-index
  [`query`](./classes/MossClient#query-name-query-options) (default `0.8`): `1.0` is
  embedding-only, `0.0` is keyword-only, and values in between fuse both signals with
  Reciprocal Rank Fusion. Keyword scoring runs each index's own BM25 and merges hits by score
  before fusion, so keyword and hybrid ordering across indexes is approximate. `filter` and
  `embedding` work the same as in single-index `query`.

## Bulk lifecycle

`load_indexes(names)` returns a
[`LoadIndexesResult`](./interfaces/LoadIndexesResult) with `loaded` and `failed`. It is
best-effort: a typo in one name does not roll back the others, and reloading an
already-loaded index is idempotent.
[`unload_indexes(names)`](./classes/MossClient#unload_indexes-names) releases them when you
are done.

```python theme={null}
# A typo on one name does not stop the others from loading.
partial = await client.load_indexes(["products", "does-not-exist-xyz"])
print(partial.loaded, partial.failed)
```

## Related

> **[Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)**
>
> How `alpha` blends semantic and keyword scoring.

> **[MossClient reference](https://docs.moss.dev/docs/reference/python/classes/MossClient.md)**
>
> `query_multi_index`, `load_indexes`, `unload_indexes`.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/classes/MossClient.md

# MossClient

> Semantic search client for vector similarity operations.

[moss v1.19.0](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MossClient

# MossClient

Semantic search client for vector similarity operations.

All mutations and reads go through the Rust core. Querying runs against an index that
has been loaded into memory with [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds)
(or [`load_indexes()`](#load_indexes-names-auto_refresh-polling_interval_in_seconds)) -
load the index before you query it.

For real-time, local-first indexing during a live interaction, use
[`session()`](#session-index_name-model_id), which returns a
[`SessionIndex`](./SessionIndex).

Chat completions grounded in your indexes come from a separate client, `MossInference`, not from `MossClient`. See [Inference](https://docs.moss.dev/docs/reference/python/inference.md).

## Constructor

### `MossClient(project_id, project_key, cache_path)`

Create a client. `cache_path` is keyword-only.

#### Parameters

* **project\_id** (`str`)
* **project\_key** (`str`)
* **cache\_path** (`Optional[str]` = `None`) - default directory for the on-disk index cache and the `.moss-device-id` file. A `cache_path` passed to [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds) or [`load_indexes()`](#load_indexes-names-auto_refresh-polling_interval_in_seconds) overrides it. With neither, indexes are not cached on disk and the device id stays in `~/.moss`. *(moss 1.14.0+)* Sessions from this client save to `<cache_path>/sessions/<project id>/` when [`save_to_disk()`](./SessionIndex#save_to_disk-cache_path) gets no directory. *(moss 1.19.0+)*

## Methods

### `create_index(name, docs, model_id, wait)`

Create a new index and populate it with documents.

`docs` takes `DocumentInfo` objects, dicts with the same fields, JSON array or JSON Lines
text, or `pathlib.Path` objects for `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and
`.markdown` files. Text and markdown files are chunked natively into documents `{path}#{n}`
with metadata `parentId`; `chunking` tunes that and `chunker` replaces it. See
[`DocsInput`](../interfaces/Chunking#docsinput) and [`Chunking`](../interfaces/Chunking).
*(moss 1.18.0+)*

When `model_id` is omitted, the SDK picks `"moss-minilm"` when no documents
carry pre-computed embeddings and `"custom"` when every document provides an
`embedding`. Mixed documents are rejected.

By default (`wait=True`) the call blocks until the build finishes and returns a
[`MutationResult`](../interfaces/MutationResult). With `wait=False` it submits the
build and returns a [`JobHandle`](./JobHandle) as soon as the upload is accepted, so
you can fire the build, tear down the machine, and check on it later.

> [!NOTE]
>
> The `wait` parameter and [`JobHandle`](./JobHandle) require `moss` **1.7.1+** (which pulls `inferedge-moss-core` `0.20.1`).

#### Parameters

* **name** (`str`)
* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - documents, JSON text or file paths. A `str` is always read as JSON text, never as a path, so wrap a path in `pathlib.Path`. In a dict or JSON document, boolean metadata values are stored as `"true"` and `"false"` and numbers as decimal strings. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **model\_id** (`Optional[str]` = `None`)
* **wait** (`bool` = `True`) — when `False`, return a [`JobHandle`](./JobHandle) immediately instead of blocking until the build completes.
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. A synchronous function from a document's text to a list of chunk strings, applied to every document, files included. Each chunk may have at most 2,000 characters. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Tunes the native chunker (`chunk_size`, `chunk_overlap`, `mode`, `markdown_header_depth`). It also chunks `DocumentInfo`, dict and JSON input, which are indexed as given without it. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

[`MutationResult`](../interfaces/MutationResult) when `wait=True`, otherwise [`JobHandle`](./JobHandle).

#### Raises

* [`InvalidArgumentError`](../interfaces/InvalidArgumentError) - for invalid JSON, a record that breaks the document rules (the message gives its position), an unsupported file type, a file with no text to index, or a `chunker` chunk of more than 2,000 characters. See [`Chunking`](../interfaces/Chunking#errors).
* `TypeError` - when both `chunker` and `chunking` are passed (`pass chunker or chunking, not both`).
* `ValueError` - when `chunker` or `chunking` is passed with `model_id="custom"` (`chunker and chunking cannot be used with model_id='custom': chunks have no embeddings`).

#### Example: submit without waiting

```python theme={null}
# Submit the build and return right away
job = await client.create_index("my-index", docs, "moss-minilm", wait=False)
print(job.job_id)                 # available immediately

# Optional: watch progress
status = await job.status()       # status, progress, current_phase

# Block until done if you want the result in-process
result = await job.wait()

# Or reconnect later from a fresh client and poll by id
status = await client.get_job_status(job.job_id)
```

#### Example: JSON, files and chunking

```python theme={null}
from pathlib import Path
from moss import Chunking

# JSON text, a JSON Lines file, or dicts
await client.create_index("faqs", '[{"id": "1", "text": "Track your order in your account."}]')
await client.create_index("faqs-jsonl", Path("faqs.jsonl"))  # one JSON object per line
await client.add_docs("faqs", [{"id": "2", "text": "30-day returns.", "metadata": {"days": 30}}])

# Text and markdown files are chunked into handbook.md#0, handbook.md#1, ...
await client.create_index("handbook", [Path("handbook.md"), Path("faq.txt")])

# Tune the native chunker, or split text yourself
await client.create_index("kb", Path("notes.md"), chunking=Chunking(chunk_size=800, chunk_overlap=100))
await client.create_index("kb-custom", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```

***

### `create_index_from_files(name, files, model_id, parse_options)`

Create a new index by uploading raw files (PDF and DOCX) for server-side parsing and
embedding. Blocks until the index is ready.

> [!NOTE]
>
> Requires `moss` **1.7.3+**.

#### Parameters

* **name** (`str`)
* **files** (List\[`ParseFileInput`]) - each file carries `name` (`str`, unique within the call), `content_type` (`"application/pdf"` or `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"`), and either `path` (`Optional[str]`) or `data` (`Optional[bytes]`).
* **model\_id** (`Optional[str]` = `None`) - defaults to `"moss-minilm"`; `"custom"` is not supported because embeddings are generated server-side during parsing.
* **parse\_options** (Optional\[`ParseOptions`] = `None`) - extraction controls: `ocr_mode` (`"auto_ocr"` / `"full_ocr"`, use `"full_ocr"` for scanned documents with no text layer), `use_high_resolution` (higher fidelity, useful for dense tables), `segmentation_method` (`"smart_layout_detection"` / `"page_by_page"`), `merge_tables`, `chunk_size` (maximum characters per chunk, 200-2000, default 1200) and `chunk_overlap` (0 to half of `chunk_size`, default 200 or half of `chunk_size` when smaller) *(moss 1.17.0+)*. Omitted fields use the server defaults.

#### Returns

[`MutationResult`](../interfaces/MutationResult)

#### Example

```python theme={null}
from moss import MossClient, ParseFileInput, ParseOptions

result = await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
], parse_options=ParseOptions(ocr_mode="full_ocr"))
```

Up to 20 files per call, 50 MB per file. See the [Index from Files](https://docs.moss.dev/docs/reference/python/files.md) guide for
parse options, limits, and querying notes.

***

### `add_docs(name, docs, options)`

Add or update documents in an index. `docs`, `chunker` and `chunking` work as in
[`create_index()`](#create_index-name-docs-model_id-wait).

#### Parameters

* **name** (`str`)
* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - `DocumentInfo` objects, dicts, JSON array or JSON Lines text, or `pathlib.Path` objects for `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` files. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **options** (Optional\[[`MutationOptions`](../interfaces/MutationOptions)] = `None`)
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

[`MutationResult`](../interfaces/MutationResult)

#### Raises

[`InvalidArgumentError`](../interfaces/InvalidArgumentError) and `TypeError` as in [`create_index()`](#create_index-name-docs-model_id-wait).

```python theme={null}
await client.add_docs("handbook", Path("docs/returns.md"), chunking=Chunking(chunk_size=800))
```

***

### `delete_docs(name, doc_ids)`

Delete documents from an index by their IDs.

#### Parameters

* **name** (`str`)
* **doc\_ids** (`List[str]`)

#### Returns

[`MutationResult`](../interfaces/MutationResult)

***

### `get_job_status(job_id)`

Get the status of a bulk operation job.

#### Parameters

* **job\_id** (`str`)

#### Returns

[`JobStatusResponse`](../interfaces/JobStatusResponse)

***

### `get_index(name)`

Get information about a specific index.

#### Parameters

* **name** (`str`)

#### Returns

[`IndexInfo`](../interfaces/IndexInfo)

***

### `list_indexes()`

List all indexes with their information.

#### Returns

List\[[`IndexInfo`](../interfaces/IndexInfo)]

***

### `delete_index(name)`

Delete an index and all its data.

#### Parameters

* **name** (`str`)

#### Returns

`bool`

***

### `get_docs(name, options)`

Retrieve documents from an index.

#### Parameters

* **name** (`str`)
* **options** (Optional\[[`GetDocumentsOptions`](../interfaces/GetDocumentsOptions)] = `None`)

#### Returns

List\[[`DocumentInfo`](../interfaces/DocumentInfo)]

***

### `load_index(name, auto_refresh, polling_interval_in_seconds)`

Downloads an index from the cloud into memory for fast local querying. An index must be
loaded before you can [`query()`](#query-name-query-options) it; once loaded, queries run
entirely in-memory (\~1-10 ms). Set `auto_refresh=True` to keep the loaded index in sync
with cloud updates by polling every `polling_interval_in_seconds`.

With a `cache_path`, the downloaded index is saved under that directory and reused on later
loads while the cloud copy is unchanged. Each load still checks the cloud for a newer version.
When a snapshot is already on disk and the cloud is unreachable or answers with a temporary
error, the load serves that snapshot instead of raising. A 401, 403 or 404 still raises. See
[`was_served_stale()`](#was_served_stale-name) and
[Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md#disk-cache).

> [!NOTE]
>
> `cache_path` requires `moss` **1.11.0+**. The client-level default and serving the snapshot while the cloud is unreachable require `moss` **1.14.0+** (which pulls `inferedge-moss-core` `0.26.0`).

#### Parameters

* **name** (`str`)
* **auto\_refresh** (`bool` = `False`)
* **polling\_interval\_in\_seconds** (`int` = `600`)
* **cache\_path** (`Optional[str]` = `None`) - directory for the on-disk index cache. When omitted, the client's [`cache_path`](#constructor) is used.

#### Returns

`str`

***

### `unload_index(name)`

Unload an index from memory.

#### Parameters

* **name** (`str`)

***

### `query(name, query, options)`

Perform a semantic similarity search against a loaded index. Call
[`load_index(name)`](#load_index-name-auto_refresh-polling_interval_in_seconds) first;
queries then run entirely in-memory (\~1-10 ms). Metadata filtering is supported on
locally loaded indexes.

#### Parameters

* **name** (`str`)
* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`): Query options (`top_k`, `alpha`, `embedding`, `filter`, `group_by`, `min_score`, `candidate_depth`). `min_score` and `candidate_depth` require `moss` **1.14.0+**.

#### Returns

[`SearchResult`](../interfaces/SearchResult)

***

### `query_multi_index(names, query, options)`

Search across multiple loaded indexes and return the global top-K. All requested indexes
must be loaded locally and share the same embedding model. Each result document is tagged
with its source `index_name`.

`options.top_k` is the **global** cap across the merged result. See [Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md).

#### Parameters

* **names** (`List[str]`): Non-empty list of loaded index names.
* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`)

#### Returns

[`SearchResult`](../interfaces/SearchResult) - `docs` carry `index_name` per result.

***

### `load_indexes(names, auto_refresh, polling_interval_in_seconds)`

Bulk-load many indexes into memory. Best-effort: a failure on one name does not roll back
the others. `auto_refresh`, `polling_interval_in_seconds` and `cache_path` apply to the whole
batch, as in [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds).

#### Parameters

* **names** (`List[str]`)
* **auto\_refresh** (`bool` = `False`)
* **polling\_interval\_in\_seconds** (`int` = `600`)
* **cache\_path** (`Optional[str]` = `None`) - directory for the on-disk index cache. *(moss 1.11.0+)* When omitted, the client's [`cache_path`](#constructor) is used. *(moss 1.14.0+)*

#### Returns

[`LoadIndexesResult`](../interfaces/LoadIndexesResult)

***

### `unload_indexes(names)`

Bulk-unload many indexes from memory. Idempotent for names that aren't loaded.

#### Parameters

* **names** (`List[str]`)

***

### `was_served_stale(name)`

Whether a loaded index is served from an on-disk snapshot because the cloud was unreachable
when it loaded. Such a load starts a refresh poller on its own, and this returns `False` again
once a refresh or a new load reaches the cloud. Raises `RuntimeError` when the index is not loaded.

Until the cloud is reachable, a built-in embedding model may not open, so text queries with
`alpha` above 0 can fail. Keyword-only queries (`alpha=0`) and queries that pass their own
`embedding` keep working.

> [!NOTE]
>
> Requires `moss` **1.14.0+** (which pulls `inferedge-moss-core` `0.26.0`).

#### Parameters

* **name** (`str`)

#### Returns

`bool`

***

### `session(index_name, model_id)`

Create or resume a local, real-time [`SessionIndex`](./SessionIndex). If a cloud index with
the given name already exists, it is auto-loaded into the session (no re-embedding), and the
session takes its model, even when the index has no documents. Otherwise the session starts
empty. The `index_name` is also the target when [`push_index()`](./SessionIndex#push_index)
is later called.

With `auto_load_on_init=False` the session skips that load and starts empty with
`model_id`, so [`load_from_disk()`](./SessionIndex#load_from_disk-cache_path-rebuild_legacy)
can restore a saved session with no index download. A `push_index()` before any load
replaces the cloud index with the session's documents. *(moss 1.16.0+)*

Raises `ValueError` if an existing cloud index uses a different model than an explicit
`model_id`. See the [Sessions guide](https://docs.moss.dev/docs/integrate/sessions.md).

#### Parameters

* **index\_name** (`str`)
* **model\_id** (`Optional[str]` = `None`): Local embedding model. Defaults to `"moss-minilm"`. Other options: `"moss-mediumlm"`, `"custom"`.
* **auto\_load\_on\_init** (`bool` = `True`): Keyword-only. Load an existing cloud index into the session before returning. *(moss 1.16.0+)*

#### Returns

[`SessionIndex`](./SessionIndex)

```python theme={null}
# Resume the cloud index of the same name, or start empty
session = await client.session(index_name="call-123")

# Skip the cloud load and restore a snapshot saved with save_to_disk
session = await client.session(index_name="notes", auto_load_on_init=False)
loaded = await session.load_from_disk("/var/cache/my-app/moss")
```

***

### `close()`

Send the final usage report, then free the native memory of this client and of every
session it opened. Waits until the report arrives or 2 seconds pass. Safe to call more
than once. Afterwards every method raises `RuntimeError("MossClient is closed")`; create a
new client to continue. *(moss 1.15.0+)*

```python theme={null}
client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
try:
    await client.load_index("my-index")
    results = await client.query("my-index", "refund policy")
finally:
    await client.close()
```

`MossClient` is also a context manager: leaving an `async with` or `with` block calls
`close()` automatically.

```python theme={null}
async with MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY) as client:
    await client.load_index("my-index")
    results = await client.query("my-index", "refund policy")
# client.close() ran here
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md

# SessionIndex

> Local, in-session index for real-time indexing and querying.

[moss v1.19.0](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / SessionIndex

# SessionIndex

A local, in-session index for real-time indexing and querying.

All operations (`add_docs`, `delete_docs`, `query`) run entirely in-memory with no
cloud round trips (\~1-10 ms). Open a session with
[`MossClient.session()`](./MossClient#session-index_name-model_id), which auto-loads an
existing cloud index by name or starts empty. Call `push_index()` at the end of the
session to persist the index to the cloud for future retrieval, or
[`save_to_disk()`](#save_to_disk-cache_path) to keep it on this device.

```python theme={null}
# Auto-loads from cloud if the index exists, starts fresh if not
session = await client.session(index_name="session-abc")

await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
results = await session.query("billing question")

result = await session.push_index()
# optionally: await client.get_job_status(result.job_id)
```

## Properties

* **name** (`str`): The index name.
* **doc\_count** (`int`): Number of documents in the local session index.
* **model\_id** (`str`): The embedding model the session uses, or `"custom"`. A load moves
  the session to the loaded model, and `add_docs` and `query` read it on every call. The
  value is as of the last completed call, so reading it never waits for a call in progress,
  and it still reads after `close()`. *(moss 1.16.0+)*

## Methods

### `add_docs(docs, options)`

Add or update documents in the local session index. Embeddings are generated locally
via the Rust core - no cloud round trip. When the session uses `model_id="custom"`, each
document must have `.embedding` set.

`docs` takes the same inputs as
[`MossClient.create_index()`](./MossClient#create_index-name-docs-model_id-wait): dicts, JSON
array or JSON Lines text, and `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file
paths, besides `DocumentInfo` objects. Text and markdown files are chunked natively. *(moss 1.18.0+)*

#### Parameters

* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - `DocumentInfo` objects, dicts, JSON array or JSON Lines text, or `pathlib.Path` objects for files. A `str` is always read as JSON text, never as a path. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **options** (Optional\[[`MutationOptions`](../interfaces/MutationOptions)] = `None`)
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. A synchronous function from a document's text to a list of chunk strings. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Tunes the native chunker, and also chunks `DocumentInfo`, dict and JSON input. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

`Tuple[int, int]` - `(added_count, updated_count)`

#### Raises

* [`InvalidArgumentError`](../interfaces/InvalidArgumentError) - for invalid JSON, an unsupported file type, a file with no text to index, or a `chunker` chunk of more than 2,000 characters. See [`Chunking`](../interfaces/Chunking#errors).
* `TypeError` - when both `chunker` and `chunking` are passed.
* `ValueError` - when `chunker` or `chunking` is passed to a session that uses `model_id="custom"`, because chunks have no embeddings.

```python theme={null}
from pathlib import Path
from moss import Chunking

await session.add_docs(Path("notes.md"), chunking=Chunking(chunk_size=800))
```

***

### `delete_docs(doc_ids)`

Delete documents from the local session index by their IDs.

#### Parameters

* **doc\_ids** (`List[str]`)

#### Returns

`int` - the number of documents deleted.

***

### `get_docs(options)`

Retrieve documents from the local session index.

#### Parameters

* **options** (Optional\[[`GetDocumentsOptions`](../interfaces/GetDocumentsOptions)] = `None`)

#### Returns

List\[[`DocumentInfo`](../interfaces/DocumentInfo)]

***

### `query(query, options)`

Perform a semantic search over the local session index. Runs entirely in-memory
(\~1-10 ms) with no cloud call. Supports the same metadata filter syntax as
[`MossClient.query()`](./MossClient#query-name-query-options).

When the session uses `model_id="custom"`, provide a query embedding via
`QueryOptions.embedding`.

#### Parameters

* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`)

#### Returns

[`SearchResult`](../interfaces/SearchResult)

***

### `push_index()`

Push the local session index to the cloud. The cloud index is created, or replaced if
one already exists with the same name. For a built-in model the service re-embeds the
text with that model, so the index loads and answers text queries like one built with
`create_index`. A custom-model session keeps its own embeddings.

#### Returns

[`PushIndexResult`](../interfaces/PushIndexResult)

***

### `save_to_disk(cache_path)`

Save the session under `<cache_path>/<name>/`, so a later session with the same name can
restore it with [`load_from_disk()`](#load_from_disk-cache_path-rebuild_legacy). Open that
session with `auto_load_on_init=False` so the restore downloads no index. A failed or
interrupted save leaves the last saved snapshot loadable. For a built-in model the snapshot
records the model id and the exact model artifact, so the restored session embeds text with
the same model. *(moss 1.16.0+)*

Without `cache_path`, or with an empty one, the snapshot goes in `sessions/<project id>/`
under the client's [`cache_path`](./MossClient#constructor),
else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots
read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
`%LOCALAPPDATA%\moss` on Windows. *(moss 1.19.0+)*

#### Parameters

* **cache\_path** (`Optional[str]` = `None`): Directory that holds one snapshot directory per
  session name. A relative path resolves against the current working directory, and `~` is
  not expanded.

#### Returns

`None`

```python theme={null}
await session.save_to_disk()
await session.save_to_disk("/var/cache/my-app/moss")
```

***

### `load_from_disk(cache_path, rebuild_legacy)`

Restore a session saved by [`save_to_disk()`](#save_to_disk-cache_path) from
`<cache_path>/<name>/`, or without `cache_path` from the directory `save_to_disk` uses
without one. The snapshot replaces this session's documents and model, so after a
custom-model snapshot loads, `add_docs` and `query` need embeddings. If the session has
already loaded the snapshot's model, it keeps that model instead of loading it again. A missing or damaged snapshot raises
[`MossError`](../interfaces/MossError) with code `DESERIALIZATION` and leaves the session as
it was before the call. *(moss 1.16.0+)*

A snapshot that an older core saved for a built-in model has no model artifact identity, so
it can only load as a custom-model session. With `rebuild_legacy=True` (the default), a
session opened with that same built-in model rebuilds the snapshot instead: the call
re-embeds the stored documents with the current model and saves the snapshot back, so later
loads skip the rebuild. The rebuild needs the model, so the cloud must be
reachable. When the model cannot be loaded, the call raises `MossError` with code
`MODEL_UNAVAILABLE` and changes neither the snapshot nor the session, so retry later instead
of discarding the snapshot. Custom-model sessions and snapshots of another model load
without a rebuild. Pass `rebuild_legacy=False` to load such a snapshot as a custom-model
session.

#### Parameters

* **cache\_path** (`Optional[str]` = `None`): Directory passed to `save_to_disk`, resolved the
  same way.
* **rebuild\_legacy** (`bool` = `True`): Keyword-only. Rebuild a built-in model snapshot that
  has no model artifact identity.

#### Returns

`int` - the number of documents loaded.

```python theme={null}
from moss import MossError

session = await client.session(index_name="notes", auto_load_on_init=False)
try:
    loaded = await session.load_from_disk()
except MossError as e:
    if e.code != "DESERIALIZATION":
        raise
    loaded = 0  # no snapshot yet, so the session starts empty
```

***

### `close()`

Send the final usage report, then free the session's native memory. Waits until the
report arrives or 2 seconds pass. Safe to call more than once. Afterwards `name` and
`model_id` still read and every other member raises `InvalidArgumentError`.
[`MossClient.close()`](./MossClient#close) also closes every session the client opened.
*(moss 1.15.0+)*

```python theme={null}
session = await client.session(index_name="session-abc")
try:
    await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
    results = await session.query("billing question")
finally:
    await session.close()
```

`SessionIndex` is also a context manager: leaving an `async with` or `with` block calls
`close()` automatically.

```python theme={null}
async with await client.session(index_name="session-abc") as session:
    await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
    results = await session.query("billing question")
# session.close() ran here
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/classes/JobHandle.md

# JobHandle

> Handle to an in-flight index build submitted with wait=False.

[moss v1.19.0](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / JobHandle

# JobHandle

Returned by [`create_index(..., wait=False)`](./MossClient#create_index-name-docs-model_id-wait).
The build runs server-side, so you can read the [`job_id`](#job_id), tear down your
process, and reconnect later to check on it — or call [`wait()`](#wait) to block
until it completes.

> [!NOTE]
>
> Requires `moss` **1.7.1+** (which pulls `inferedge-moss-core` `0.20.1`).

## Properties

### `job_id`

* **Type:** `str`

The build job id. Available immediately, before the build finishes. Persist it to
poll the build later via [`get_job_status(job_id)`](./MossClient#get_job_status-job_id).

## Methods

### `status()`

Current build status — a live readout of the phase and progress.

#### Returns

[`JobStatusResponse`](../interfaces/JobStatusResponse)

***

### `wait()`

Block until the build completes. Raises if the build fails or times out.

#### Returns

[`MutationResult`](../interfaces/MutationResult)

***

## Example

```python theme={null}
import asyncio

job = await client.create_index("my-index", docs, "moss-minilm", wait=False)

# Fire-and-forget: save the id, tear down, reconnect later
job_id = job.job_id

# Or watch it in-process — throttle your polling so you don't hammer the API
while True:
    status = await job.status()
    if status.status.value in ("completed", "failed"):
        break
    await asyncio.sleep(2)

# Or simply block until done (the SDK polls for you)
result = await job.wait()
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/DocumentInfo.md

# DocumentInfo

[moss v1.0.1](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / DocumentInfo

# Interface: DocumentInfo

DocumentInfo

## Properties

* **id**: `str`
* **text**: `str`
* **metadata**: `Optional[Dict[str, str]]`
* **embedding**: `Optional[Sequence[float]]`
* **payload**: `Optional[str]` - Opaque structured value (e.g. a JSON string) stored and returned verbatim; never embedded or searched. See [Structured payload](https://docs.moss.dev/docs/reference/python/structured-payload.md). *(moss 1.5.0+)*


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/QueryOptions.md

# QueryOptions

[moss v1.0.1](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / QueryOptions

# Interface: QueryOptions

Optional parameters for `MossClient.query()`.

## Properties

| Property | Type | Description |
| - | - | - |
| `embedding` | `Optional[Sequence[float]]` | Caller-provided query embedding. When supplied, the service/client skips embedding generation. |
| `top_k` | `Optional[int]` | Number of top results to return. |
| `alpha` | `Optional[float]` | Weight for hybrid search fusion. `1.0` = pure semantic, `0.0` = pure keyword. **Default** `0.8`. |
| `filter` | `Optional[dict]` | Metadata filter applied to the query. Honored on locally loaded indexes; load the index (or open a session) before querying with a filter. |
| `group_by` | `Optional[ParentGrouping]` | Collapse sibling hits sharing a parent id into one result per unit. See [`ParentGrouping`](./ParentGrouping) and [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/python/graph-retrieval.md). *(moss 1.6.0+)* |
| `min_score` | `Optional[float]` | Drops results whose `score` is below this floor, from 0 to 1. A query returns up to `top_k` results that clear it, in hybrid order. Rejected on a keyword-only query (`alpha=0`). `SessionIndex.query` ignores it. *(moss 1.14.0+)* |
| `candidate_depth` | `Optional[int]` | How many hits a hybrid query ranks on each signal before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Defaults to `2 * top_k`. A set value must be at least 1 and is raised to `top_k` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it. Used by `MossClient.query` and `query_multi_index`; `SessionIndex.query` ignores it. *(moss 1.14.0+)* |

## Filter shape

The `filter` value is a dict with either a field condition or a logical
composition:

```python theme={null}
# Field condition
{"field": "city", "condition": {"$eq": "NYC"}}

# Logical composition
{"$and": [filter_a, filter_b, ...]}
{"$or":  [filter_a, filter_b, ...]}
```

Supported condition operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`,
`$in`, `$nin`, `$near`.

## Example

```python theme={null}
from moss import QueryOptions

options = QueryOptions(
    top_k=5,
    alpha=0.6,
    filter={
        "$and": [
            {"field": "category", "condition": {"$eq": "shoes"}},
            {"field": "price",    "condition": {"$lt": 100}},
        ],
    },
)
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/SearchResult.md

# SearchResult

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / SearchResult

# Interface: SearchResult

SearchResult

## Properties

* **docs**: List\[[`QueryResultDocumentInfo`](./QueryResultDocumentInfo)]
* **query**: `str`
* **index\_name**: `Optional[str]`
* **time\_taken\_ms**: `Optional[int]`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/QueryResultDocumentInfo.md

# QueryResultDocumentInfo

[moss v1.4.0](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / QueryResultDocumentInfo

# Interface: QueryResultDocumentInfo

QueryResultDocumentInfo

## Properties

* **id**: `str`
* **text**: `str`
* **metadata**: `Optional[Dict[str, str]]`
* **score**: `float` - Relevance to the query from 0 to 1. It comes from vector similarity alone, so rank never changes it and every `alpha` above 0 gives the same value. Results are ordered by hybrid relevance, so a lower-ranked result can show a higher score. A keyword-only query (`alpha` 0, or an index without vectors) scores every hit 0. Scores depend on the embedding model: tune `min_score` on your own queries. See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics). *(moss 1.14.0+)*
* **index\_name**: `Optional[str]` - Source index for the result. Set by [`query_multi_index()`](../classes/MossClient#query_multi_index-names-query-options); `None` for single-index queries.
* **payload**: `Optional[str]` - Opaque structured value stored at index time, returned verbatim; `None` when the document has none. See [Structured payload](https://docs.moss.dev/docs/reference/python/structured-payload.md). *(moss 1.5.0+)*


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/MutationOptions.md

# MutationOptions

[moss v1.0.1](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MutationOptions

# Interface: MutationOptions

Options for add\_docs (e.g. upsert behavior).

## Properties

* **upsert**: `Optional[bool]`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/MutationResult.md

# MutationResult

[moss v1.0.1](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MutationResult

# Interface: MutationResult

Return value from create\_index/add\_docs/delete\_docs.

## Properties

* **job\_id**: `str`
* **index\_name**: `str`
* **doc\_count**: `int`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult.md

# LoadIndexesResult

[moss v1.4.0](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / LoadIndexesResult

# Interface: LoadIndexesResult

The result of [`MossClient.load_indexes()`](../classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds).
Bulk loading is best-effort - failures on individual names do not roll back successes.

## Properties

* **loaded**: `List[str]` - Names of the indexes that loaded successfully.
* **failed**: `Dict[str, str]` - Mapping of index name → error message for the names that failed to load.
* **failed\_codes**: `Dict[str, str]` - Mapping of index name → error code, such as `"NOT_FOUND"`, for the names that failed to load. The codes are the ones [`MossError.code`](./MossError) carries. *(moss 1.15.0+, with `inferedge-moss-core` 0.27.0)*


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/IndexInfo.md

# IndexInfo

[moss v1.0.1](../README)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / IndexInfo

# Interface: IndexInfo

IndexInfo

## Properties

* **id**: `str`
* **name**: `str`
* **version**: `str`
* **status**: `str`
* **doc\_count**: `int`
* **created\_at**: `str`
* **updated\_at**: `str`
* **model**: [`ModelRef`](./ModelRef)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/python/interfaces/MossError.md

# MossError

> The exception raised for every failure the Moss native core reports.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MossError

# Interface: MossError

A `RuntimeError` subclass raised for every failure the native core reports. Branch on
`code`, not on the message: the message is fixed text for each kind of failure, such as
`Index not found.`, with no URLs, file paths or index names. *(moss 1.15.0+, with
`inferedge-moss-core` 0.27.0)*

[`InvalidArgumentError`](./InvalidArgumentError) is the subclass raised for
`INVALID_ARGUMENT`. Not every exception the SDK raises is a `MossError`: a closed
`MossClient` raises a plain `RuntimeError`, a filter value of the wrong type raises
`TypeError`, some argument checks raise a bare `ValueError`, and web source methods raise
`ManageApiError` (see [Web sources](https://docs.moss.dev/docs/reference/python/web-sources.md)). None of these has a `code`.

## Properties

* **code**: `Optional[str]` - The kind of failure, stable across releases: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. Every `MossError` the SDK raises sets it. See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).
* **detail**: `Optional[str]` - The core error text, for logs and support, at most 512 bytes. Released wheels carry it too. Diagnostic text, not a stable contract. `None` when there is none.

## Example

```python theme={null}
from moss import MossError

try:
    results = await client.query("faqs", "refund policy")
except MossError as e:
    if e.code != "NOT_FOUND":
        raise
    await client.load_index("faqs")
    results = await client.query("faqs", "refund policy")
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/api.md

# Overview

> Everything the Moss JavaScript SDK can do, with a snippet for each operation.

The Moss JavaScript SDK (`@moss-js/moss`) brings semantic search to Node.js. It wraps a
high-performance Rust core and exposes an async, Promise-based API. Documents are embedded
and queried locally, with optional cloud sync.

## Requirements

* Node.js 20.4 or higher

## Install

```bash theme={null}
npm install @moss-js/moss
```

> [!WARNING]
>
> Keep optional dependencies on. The native binary comes only from the
> `@moss-js/moss-core-<platform>` package that npm installs for your platform as an optional
> dependency. After `npm install --omit=optional`, `optional=false` in `.npmrc` or
> `pnpm --no-optional`, importing `@moss-js/moss` throws `Cannot find native binding`. The same
> happens on `npm ci` from a lockfile that npm older than 11.3 rebuilt while `node_modules`
> existed, because that lockfile keeps only that machine's platform package. Before installing on
> another platform, such as Linux CI or Docker from a lockfile made on a Mac, regenerate the
> lockfile with `node_modules` removed, or with npm 11.3 or newer. *(@moss-js/moss 1.17.0+)*

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

> [!NOTE]
>
> Moss for Node moved from `@moss-dev/moss` to `@moss-js/moss` with 1.8.0. `@moss-dev/moss` is a frozen 1.7.1 package. Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to `@moss-js/moss` 1.9.0+ before then. The date will be announced in the changelog. `@moss-dev/moss-web` is the browser SDK and is not this package.

Get your `projectId` and `projectKey` from the [Moss portal](https://portal.usemoss.dev).

## Two ways to search

* [`MossClient`](./classes/MossClient) - the entry point. Manage cloud indexes, load one into memory, and query it.
* [`SessionIndex`](./classes/SessionIndex) - a local, in-process index for real-time indexing during a live interaction; push to the cloud when done.

## Quick start

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.createIndex('faqs', [
  { id: 'doc1', text: 'Track your order in your account.', metadata: { category: 'shipping' } },
  { id: 'doc2', text: '30-day return policy for most items.', metadata: { category: 'returns' } },
])
await client.loadIndex('faqs')
const results = await client.query('faqs', 'return a damaged product', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score))
```

## Indexes

Create, inspect, and delete cloud indexes. Mutations run as async jobs and return a
`MutationResult` with a `jobId` and `docCount`.

```typescript theme={null}
// Create (defaults to moss-minilm)
const result = await client.createIndex('faqs', documents)

// Inspect
const info = await client.getIndex('faqs')   // IndexInfo: name, docCount, model.id, status
const indexes = await client.listIndexes()    // IndexInfo[]

// Delete
await client.deleteIndex('faqs')
```

## Index from files

Build an index straight from PDF and DOCX files - the server parses, chunks, and embeds
them. Up to 20 files per call.

```typescript theme={null}
await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
], { parseOptions: { ocrMode: 'full_ocr' } })
```

See [Index from files](https://docs.moss.dev/docs/reference/js/files.md).

## Documents

Add, update, fetch, and remove documents on an existing index.

```typescript theme={null}
// Add or upsert
await client.addDocs('faqs', newDocs, { upsert: true })

// Fetch all, or by id
const allDocs = await client.getDocs('faqs')
const some = await client.getDocs('faqs', { docIds: ['doc1', 'doc2'] })

// Delete by id
await client.deleteDocs('faqs', ['doc6', 'doc7'])
```

## Load and query

Load an index into memory, then query it in-process. Call `loadIndex` before querying.

```typescript theme={null}
await client.loadIndex('faqs')
const results = await client.query('faqs', 'return a damaged product', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score, d.text))
```

## Hybrid search

Blend semantic and keyword scoring with `alpha` (1.0 = semantic, 0.0 = keyword; default 0.8).

```typescript theme={null}
await client.query('faqs', 'return policy', { topK: 3, alpha: 0.6 })
```

See [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md).

## Metadata filtering

Narrow results by document metadata on a loaded index.

```typescript theme={null}
await client.query('products', 'running shoes', {
  topK: 5,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
})
```

Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`, composed with
`$and` / `$or`. See [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md).

## Custom embeddings

Supply your own vectors with `modelId: 'custom'` (each document carries `embedding`, and
queries pass `embedding`).

```typescript theme={null}
await client.createIndex('tickets', docsWithEmbeddings, { modelId: 'custom' })
await client.loadIndex('tickets')
await client.query('tickets', 'billing problem', { topK: 3, embedding: queryVector })
```

See [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md).

## Sessions

Index and query locally in real time with a [`SessionIndex`](./classes/SessionIndex), then
push to the cloud. `session()` starts empty; `session.loadIndex(name)` resumes an existing
cloud index.

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer reported a duplicate charge.' }])
const hits = await session.query('billing issue', { topK: 3 })
await session.pushIndex()
```

See [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md).

## Keeping indexes fresh

Auto-refresh a loaded index (poll the cloud and hot-swap newer versions in automatically),
and track async jobs.

```typescript theme={null}
await client.loadIndex('faqs', { autoRefresh: true, pollingIntervalInSeconds: 300 })
const status = await client.getJobStatus(result.jobId)
```

## Inference

Answer chat messages with facts from your indexes. A `MossInference` client takes the
arguments of OpenAI's `chat.completions.create`, plus `indexes`, and returns the same shapes.
*(@moss-js/moss 1.20.0+)*

```typescript theme={null}
import { MossInference } from '@moss-js/moss'

const llm = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const stream = await llm.chat.completions.create({
  model: 'moss',
  messages: [{ role: 'user', content: 'Do you ship to Canada?' }],
  indexes: ['faqs'],
  stream: true,
})
for await (const chunk of stream) process.stdout.write(chunk.choices[0]?.delta.content ?? '')
```

See [Inference](https://docs.moss.dev/docs/reference/js/inference.md).

## Authentication

Construct the client with a `projectKey` for server-side use, or use a custom authenticator
to mint short-lived tokens for untrusted clients (`getAuthToken()`).

```typescript theme={null}
const { token, expiresIn } = await client.getAuthToken()
```

See [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md).

## Errors

A failure from the native core rejects with an `Error` whose `code` is a stable
[`MossErrorCode`](./type-aliases/MossErrorCode), such as `NOT_FOUND` or `NETWORK`. Branch on
`code`, not on the message. [`isMossError`](./functions/isMossError) narrows a caught value,
and `loadIndexes` reports each failed name's code in `failedCodes`. Some checks the SDK makes
itself, such as a closed client, throw a plain `Error` with no `code`. *(@moss-js/moss 1.16.0+)*

```typescript theme={null}
import { isMossError } from '@moss-js/moss'

try {
  await client.query('faqs', 'refund policy')
} catch (error) {
  if (isMossError(error) && error.code === 'NOT_FOUND') {
    await client.loadIndex('faqs')
  } else {
    throw error
  }
}
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Models

* `moss-minilm` (default) - fast, lightweight
* `moss-mediumlm` - higher accuracy
* `custom` - supply your own embedding vectors via `DocumentInfo.embedding`

## Guides

* [Index from files](https://docs.moss.dev/docs/reference/js/files.md)
* [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md)
* [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md)
* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md)
* [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md)
* [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md)
* [Inference](https://docs.moss.dev/docs/reference/js/inference.md)

## Reference

[MossClient](https://docs.moss.dev/docs/reference/js/classes/MossClient.md) and [SessionIndex](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md), plus all interfaces and types, are in the Reference section of the sidebar.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/sessions.md

# Sessions

> Local-first, real-time indexing in JavaScript with create-resume-query-push.

A session is a local index you read and write in real time, with no cloud round trip on any
operation. Sessions are how Moss indexes data during a live interaction - indexing transcript
turns mid-call, building a per-user working set, or accumulating context that is handed off
between agents.

A session is a [`SessionIndex`](./classes/SessionIndex), created from
[`client.session()`](./classes/MossClient#session). It works with a client built with either a
`projectKey` or a custom authenticator. A project key goes to the session directly, and a custom
authenticator supplies the session's tokens through the same bridge as
[`loadIndex`](./classes/MossClient#loadindex).

## Create or resume

`client.session(name)` returns a `SessionIndex` that starts empty, even when a cloud index
with that name exists. To resume that index, call
[`session.loadIndex(name)`](./classes/SessionIndex#loadindex): it pulls the documents in
without re-embedding and resolves to the number loaded, `0` when no cloud index has that
name. `name` is also the target when [`pushIndex()`](./classes/SessionIndex#pushindex) is
called, and a push replaces that cloud index with the session's documents, so load it first
to add to an existing index.

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// Create, then resume the cloud index of the same name if there is one.
const session = await client.session('call-123')
const loaded = await session.loadIndex('call-123')
console.log(`${loaded} existing docs loaded`)

// Mutate locally - appended to whatever was loaded. Embeds in-process, no network round trip.
await session.addDocs([
  { id: 'turn-1', text: 'Customer reported a duplicate charge on their March invoice.' },
])

// Query locally (~1-10ms). Same options as MossClient.query (topK, alpha, filter, embedding).
const results = await session.query('billing issue', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score, d.text))

// Fetch and delete by id, also local.
const docs = await session.getDocs({ docIds: ['turn-1'] })
await session.deleteDocs(['turn-1'])

// Persist to the cloud under the session name.
const pushed = await session.pushIndex()
console.log(`Pushed ${pushed.docCount} docs (job ${pushed.jobId})`)
```

## Short-term vs. long-term context

A session is short-term context - the working set for the current interaction. A persistent
cloud index loaded with [`client.loadIndex()`](./classes/MossClient#loadindex) is long-term
context - durable knowledge shared across interactions. Most real-time apps query both: load
a cloud index for long-term knowledge, open a session for the live turns, and query each.

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// Long-term context: load a persistent cloud index into memory.
await client.loadIndex('product-faqs')

// Short-term context: open a session for the live call.
const session = await client.session('call-123')

// As the call progresses, index transcript turns locally.
await session.addDocs([
  { id: 'turn-1', text: 'Customer was billed twice for the same subscription renewal.' },
  { id: 'turn-2', text: 'Customer requested a refund for the duplicate charge of $49.99.' },
])

// On each new turn, query both: the FAQ index for knowledge, the session for what was said.
const userQuestion = 'how long does a refund take'
const [knowledge, recall] = await Promise.all([
  client.query('product-faqs', userQuestion, { topK: 3 }),
  session.query(userQuestion, { topK: 3 }),
])

// At the end of the call, persist the session for future retrieval.
await session.pushIndex()
```

## Loading a cloud index into a session

[`loadIndex()`](./classes/SessionIndex#loadindex) can pull any cloud index into the session's
local store, not only the one named after the session. With `autoRefresh: true` the SDK polls
the cloud and pulls newer versions in on subsequent reads (paused while the session has
un-pushed local edits).

```typescript theme={null}
const session = await client.session('call-123')
const loaded = await session.loadIndex('product-faqs', { autoRefresh: true })
console.log(`${loaded} docs loaded into the session`)
```

## Behavior notes

* Every session operation (`addDocs`, `deleteDocs`, `getDocs`, `query`) runs in process memory
  with no per-operation cloud round trip.
* The embedding model is set by the optional second argument to `session()` (default
  `"moss-minilm"`; also `"moss-mediumlm"` or `"custom"`). `loadIndex()` and `loadFromDisk()`
  move the session to the model of the index or snapshot they load, and `session.modelId`
  reports the model in use. After a custom-model load, `addDocs` takes the documents'
  embeddings and `query` without an `embedding` rejects with code `INVALID_ARGUMENT`.
  *(@moss-js/moss 1.17.0+)* All participants resuming the same index must use the same model.
* With `modelId: 'custom'`, each added document must carry an `embedding` and every `query`
  must pass an `embedding`. See [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md).
* `pushIndex()` uploads the session's documents. For a built-in model the service re-embeds
  the text with that model, and a custom-model session keeps its own embeddings.
* `close()` sends the final usage report and frees the session's memory, and
  `await using session = await client.session(name)` calls it for you on Node.js 24 or
  later. `client.close()` also closes every session the client opened. See
  [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Related

* [SessionIndex reference](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md) - every session method.
* [MossClient.session()](https://docs.moss.dev/docs/reference/js/classes/MossClient.md#session) - open an empty session.
* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md) - filter inside a session query.
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/hybrid-search.md

# Hybrid search

> Blend semantic and keyword scoring in JavaScript with a single alpha parameter.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, so you can tune relevance per query.
As with all queries, load the index first (or open a [session](https://docs.moss.dev/docs/reference/js/sessions.md)).

## The `alpha` parameter

`alpha` lives on [`QueryOptions`](./interfaces/QueryOptions).

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.loadIndex('faqs') // required before querying

// Blend semantic and keyword scoring (60/40).
const hybrid = await client.query('faqs', 'return policy', { topK: 3, alpha: 0.6 })

// Pure keyword.
const keywordOnly = await client.query('faqs', 'return policy', { topK: 3, alpha: 0.0 })

// Pure semantic (the default leans here at 0.8).
const semanticOnly = await client.query('faqs', 'return policy', { topK: 3, alpha: 1.0 })

hybrid.docs.forEach(d => console.log(d.id, d.score, d.text))
```

The same `alpha` applies inside a [session](https://docs.moss.dev/docs/reference/js/sessions.md):

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about the SKU-4421 refund.' }])

// Lean on keyword scoring to match the exact SKU.
const hits = await session.query('SKU-4421', { topK: 3, alpha: 0.2 })
```

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, and so on).

## Related

* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md) - constrain results by document metadata.
* [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md) - bring your own vectors.
* [QueryOptions](https://docs.moss.dev/docs/reference/js/interfaces/QueryOptions.md) - all query parameters.
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/metadata-filtering.md

# Metadata filtering

> Narrow JavaScript query results to documents whose metadata matches a filter.

Attach metadata to documents at index time, then constrain queries to the documents whose
metadata matches a filter. Filtering is evaluated on the locally loaded index, so call
[`loadIndex()`](./classes/MossClient#loadindex) (or open a [session](https://docs.moss.dev/docs/reference/js/sessions.md)) before
querying with a filter. The filter is passed as
[`QueryOptions.filter`](./interfaces/QueryOptions).

## Operators

A single condition compares one metadata field with one operator. The
[condition shape](https://docs.moss.dev/docs/reference/js/type-aliases/FilterCondition.md) lists them all.

| Operator | Meaning |
| - | - |
| `$eq`, `$ne` | equals / not equals |
| `$gt`, `$gte`, `$lt`, `$lte` | greater than, greater than or equal to, less than, less than or equal to. See [how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare) |
| `$in`, `$nin` | value in / not in a list |
| `$near` | within a haversine distance of a point: `"lat,lng,radiusMeters"` |

Compose multiple conditions with `$and` / `$or` (nestable). A single condition can be passed
on its own without a wrapper. The [filter shape](https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md) page describes
the full structure. `@moss-js/moss` does not export `MetadataFilter` or `FilterCondition`:
`QueryOptions.filter` is typed `any`, so pass a plain object as in the examples below.

Metadata values are strings. Filter values can be strings or numbers; a `Date` is rejected.

## Examples

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.createIndex('catalog', [
  { id: 'doc1', text: 'Running shoes with breathable mesh for daily training.',
    metadata: { category: 'shoes', price: '79', city: 'new-york', location: '40.7580,-73.9855' } },
  { id: 'doc2', text: 'Trail running shoes built for rocky terrain.',
    metadata: { category: 'shoes', price: '149', city: 'seattle', location: '47.6062,-122.3321' } },
  { id: 'doc3', text: 'Lightweight city backpack with laptop compartment.',
    metadata: { category: 'bags', price: '95', city: 'new-york', location: '40.7505,-73.9934' } },
])

await client.loadIndex('catalog') // required before filtering

// $eq - a single condition needs no wrapper.
await client.query('catalog', 'running gear', {
  topK: 5,
  filter: { field: 'category', condition: { $eq: 'shoes' } },
})

// $and - shoes under $100.
await client.query('catalog', 'running shoes', {
  topK: 5,
  alpha: 0.6,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
})

// $or - New York or Seattle.
await client.query('catalog', 'city essentials', {
  topK: 5,
  filter: {
    $or: [
      { field: 'city', condition: { $eq: 'new-york' } },
      { field: 'city', condition: { $eq: 'seattle' } },
    ],
  },
})

// $in - city in a set.
await client.query('catalog', 'city essentials', {
  topK: 5,
  filter: { field: 'city', condition: { $in: ['new-york', 'seattle'] } },
})

// $near - within 5km of Times Square.
await client.query('catalog', 'city products', {
  topK: 5,
  filter: { field: 'location', condition: { $near: '40.7580,-73.9855,5000' } },
})
```

## Filtering inside a session

The same filter syntax works on a [session](https://docs.moss.dev/docs/reference/js/sessions.md) query, evaluated entirely in-memory.

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([
  { id: 't1', text: 'Customer opened the call about an incorrect charge.',
    metadata: { speaker: 'agent', topic: 'billing', priority: '3' } },
  { id: 't2', text: 'I need a full refund for the duplicate charge.',
    metadata: { speaker: 'customer', topic: 'refund', priority: '5' } },
])

// Customer turns about refunds only.
await session.query('what did the customer want', {
  topK: 5,
  filter: {
    $and: [
      { field: 'speaker', condition: { $eq: 'customer' } },
      { field: 'topic',   condition: { $eq: 'refund' } },
    ],
  },
})
```

## Date ranges

Store dates as Unix epoch seconds in a decimal string and filter with numbers, so both sides
compare as numbers. [Filter by date](https://docs.moss.dev/docs/integrate/metadata-filtering.md#filter-by-date)
explains the encoding and the pitfalls of ISO 8601 strings.

```typescript theme={null}
const toEpoch = (iso: string) => Math.floor(Date.parse(iso) / 1000)

await session.addDocs([
  {
    id: 't3',
    text: 'Customer confirmed the refund arrived.',
    metadata: { createdAt: String(toEpoch('2026-01-10T09:00:00Z')) },
  },
])

await session.query('refund', {
  topK: 5,
  filter: {
    $and: [
      { field: 'createdAt', condition: { $gte: toEpoch('2026-01-01T00:00:00Z') } },
      { field: 'createdAt', condition: { $lte: toEpoch('2026-01-31T23:59:59Z') } },
    ],
  },
})
```

## Related

* [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md) - blend semantic and keyword scoring.
* [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md) - filter inside a live session.
* [MetadataFilter](https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md) and [FilterCondition](https://docs.moss.dev/docs/reference/js/type-aliases/FilterCondition.md) - the filter and condition shapes (documented, not exported).
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/classes/MossClient.md

# MossClient

> Async-first semantic search client for vector similarity operations.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MossClient

# MossClient

MossClient - Async-first semantic search client for vector similarity operations.

All mutations (createIndex, addDocs, deleteDocs) are async operations
that run server-side and poll until complete.

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient('your-project-id', 'your-project-key');

// Create an index with documents (polls until complete)
const result = await client.createIndex('docs', [
  { id: '1', text: 'Machine learning fundamentals' },
  { id: '2', text: 'Deep learning neural networks' }
]);

// Add docs (polls until complete)
await client.addDocs('docs', [
  { id: '3', text: 'Natural language processing' }
]);

// Query the index
await client.loadIndex('docs');
const results = await client.query('docs', 'AI and neural networks');
```

Chat completions grounded in your indexes come from a separate client, `MossInference`, not from `MossClient`. See [Inference](https://docs.moss.dev/docs/reference/js/inference.md).

## Constructors

### Constructor

> **new MossClient**(`projectId`, `projectKey`, `options?`): `MossClient`

Creates a new MossClient instance.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `projectKey` | `string` | Your project authentication key. Use the `projectKey` form for server-side code only. |
| `options?` | [`MossClientOptions`](#mossclientoptions) | Client options. |

#### Returns

`MossClient`

### Constructor (custom authenticator)

> **new MossClient**(`projectId`, `authenticator`, `options?`): `MossClient`

Creates a new MossClient instance with a custom authenticator. Use this pattern from
browser or untrusted clients where the `projectKey` must never be embedded in shipped code.
See the [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md) guide for details.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `authenticator` | `IAuthenticator` | Implementation that returns a short-lived bearer token from your backend. |
| `options?` | [`MossClientOptions`](#mossclientoptions) | Client options. |

### MossClientOptions

The optional last argument of both constructors.

| Option | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory whose `.moss-device-id` file is this client's stable device id, created on first use. Without it the SDK uses `~/.moss/.moss-device-id`. Sessions from this client save to `<cachePath>/sessions/<project id>/` when `saveToDisk` gets no directory *(@moss-js/moss 1.19.0+)*. |
| `identity?` | `MossIdentity` | Your own `deviceId` and an optional `userId`, sent with this client's usage telemetry. Each is 1 to 256 UTF-8 bytes with no leading or trailing whitespace. See [Device id and user id](https://docs.moss.dev/docs/reference/telemetry.md#device-id-and-user-id). |

## Methods

### createIndex()

> **createIndex**(`indexName`, `docs`, `options?`): `Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Creates a new index with the provided documents via async upload.

Handles the full flow: init, upload, build, then poll until complete.
Returns when the index is ready.

When all documents have pre-computed embeddings, they are serialized as raw
float32 in the binary upload. When no documents have embeddings, the server
generates embeddings in batches (dimension=0 flow).

Mixed documents (some with embeddings, some without) are rejected.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index to create. |
| `docs` | [`DocumentInfo`](../interfaces/DocumentInfo)\[] | Documents, optionally with pre-computed embeddings. |
| `options?` | [`CreateIndexOptions`](../interfaces/CreateIndexOptions) | Optional model ID and progress callback. |

#### Returns

`Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Promise that resolves to MutationResult when the index is ready.

#### Throws

If the index already exists or creation fails.

#### Example

```typescript theme={null}
const result = await client.createIndex('knowledge-base', [
  { id: 'doc1', text: 'Introduction to AI' },
  { id: 'doc2', text: 'Machine learning basics' }
], {
  onProgress: (p) => console.log(`${p.status} ${p.progress}%`),
});
```

***

### createIndexFromFiles()

> **createIndexFromFiles**(`indexName`, `files`, `options?`): `Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Creates a new index by uploading raw files for server-side parsing and embedding.

Handles the full flow: init, upload files, confirm, then poll until complete.
Returns when the index is ready. Supported file types are PDF and DOCX.

See the [Index from Files](https://docs.moss.dev/docs/reference/js/files.md) guide for parse options, limits, and querying notes.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index to create. |
| `files` | [`ParseFileInput`](../interfaces/ParseFileInput)\[] | File descriptors. `name` and `contentType` are required on each; supply either `path` or `data`. |
| `options?` | [`CreateIndexFromFilesOptions`](../interfaces/CreateIndexFromFilesOptions) | Model ID (defaults to `"moss-minilm"`), extraction controls via `parseOptions`, and a progress callback. |

#### Returns

`Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Promise that resolves to MutationResult when the index is ready.

#### Throws

If `files` is empty, exceeds 20 files, has an unsupported `contentType`, uses
`modelId: 'custom'`, or creation fails.

#### Example

```typescript theme={null}
const result = await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
], {
  parseOptions: { ocrMode: 'full_ocr' }, // scanned documents with no text layer
  onProgress: (p) => console.log(p.status, p.currentPhase),
});
```

***

### getIndex()

> **getIndex**(`indexName`): `Promise`\<[`IndexInfo`](../interfaces/IndexInfo)>

Gets information about a specific index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index to retrieve. |

#### Returns

`Promise`\<[`IndexInfo`](../interfaces/IndexInfo)>

Promise that resolves to IndexInfo object.

#### Throws

If the index does not exist.

#### Example

```typescript theme={null}
const info = await client.getIndex('knowledge-base');
console.log(`Index has ${info.docCount} documents`);
```

***

### listIndexes()

> **listIndexes**(): `Promise`\<[`IndexInfo`](../interfaces/IndexInfo)\[]>

Lists all available indexes.

#### Returns

`Promise`\<[`IndexInfo`](../interfaces/IndexInfo)\[]>

Promise that resolves to array of IndexInfo objects.

#### Example

```typescript theme={null}
const indexes = await client.listIndexes();
indexes.forEach(index => {
  console.log(`${index.name}: ${index.docCount} docs`);
});
```

***

### deleteIndex()

> **deleteIndex**(`indexName`): `Promise`\<`boolean`>

Deletes an index and all its data.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index to delete. |

#### Returns

`Promise`\<`boolean`>

Promise that resolves to true if successful.

#### Throws

If the index does not exist.

#### Example

```typescript theme={null}
const deleted = await client.deleteIndex('old-index');
```

***

### addDocs()

> **addDocs**(`indexName`, `docs`, `options?`): `Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Adds or updates documents in an index asynchronously.

The index rebuild happens server-side. This method polls until
the rebuild is complete and then returns.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the target index. |
| `docs` | [`DocumentInfo`](../interfaces/DocumentInfo)\[] | Documents to add or update. |
| `options?` | [`MutationOptions`](../interfaces/MutationOptions) | Optional configuration (upsert, onProgress callback). |

#### Returns

`Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Promise that resolves to MutationResult when the operation is complete.

#### Throws

If the index does not exist.

#### Example

```typescript theme={null}
const result = await client.addDocs('knowledge-base', [
  { id: 'new-doc', text: 'New content to index' }
], { upsert: true });
console.log(`Job ${result.jobId} completed`);
```

***

### deleteDocs()

> **deleteDocs**(`indexName`, `docIds`, `options?`): `Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Deletes documents from an index by their IDs asynchronously.

The index rebuild happens server-side. This method polls until
the rebuild is complete and then returns.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the target index. |
| `docIds` | `string`\[] | Array of document IDs to delete. |
| `options?` | [`MutationOptions`](../interfaces/MutationOptions) | Optional configuration (onProgress callback). |

#### Returns

`Promise`\<[`MutationResult`](../interfaces/MutationResult)>

Promise that resolves to MutationResult when the operation is complete.

#### Throws

If the index does not exist.

#### Example

```typescript theme={null}
const result = await client.deleteDocs('knowledge-base', ['doc1', 'doc2']);
console.log(`Job ${result.jobId} completed`);
```

***

### getJobStatus()

> **getJobStatus**(`jobId`): `Promise`\<[`JobStatusResponse`](../interfaces/JobStatusResponse)>

Gets the current status of an async job.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `jobId` | `string` | The job ID returned by createIndex, addDocs, or deleteDocs. |

#### Returns

`Promise`\<[`JobStatusResponse`](../interfaces/JobStatusResponse)>

Promise that resolves to JobStatusResponse with progress details.

#### Example

```typescript theme={null}
const status = await client.getJobStatus(jobId);
console.log(`${status.status} - ${status.progress}%`);
```

***

### getDocs()

> **getDocs**(`indexName`, `options?`): `Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

Retrieves documents from an index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the target index. |
| `options?` | [`GetDocumentsOptions`](../interfaces/GetDocumentsOptions) | Optional configuration for retrieval. |

#### Returns

`Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

Promise that resolves to array of documents.

#### Throws

If the index does not exist.

#### Example

```typescript theme={null}
// Get all documents
const allDocs = await client.getDocs('knowledge-base');

// Get specific documents
const specificDocs = await client.getDocs('knowledge-base', {
  docIds: ['doc1', 'doc2']
});
```

***

### loadIndex()

> **loadIndex**(`indexName`, `options?`): `Promise`\<`string`>

Downloads an index from the cloud into memory for fast local querying.

**How it works:**

1. Fetches the index assets from the cloud
2. Loads the embedding model for generating query embeddings
3. Executes a local similarity match between the query embedding and the retrieved index.

**Why use this?**
An index must be loaded before you can `query()` it. Once loaded, queries run entirely in-memory (\~1-10ms).

**Reload behavior:**
If the index is already loaded, calling `loadIndex()` again will:

* Stop any existing auto-refresh polling
* Download a fresh copy from the cloud
* Replace the in-memory index

**Auto-refresh (optional):**
Enable `autoRefresh: true` to periodically poll the cloud for updates.
When a newer version is detected, the index is automatically hot-swapped
without interrupting queries.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index to load. |
| `options?` | [`LoadIndexOptions`](../interfaces/LoadIndexOptions) | Optional configuration including auto-refresh settings. |

#### Returns

`Promise`\<`string`>

Promise that resolves to the index name.

#### Throws

If the index does not exist in the cloud or loading fails.

#### Example

```typescript theme={null}
// Simple load - enables fast local queries
await client.loadIndex('my-index');

// Now queries run locally (fast, no network calls)
const results = await client.query('my-index', 'search text');

// Load with auto-refresh to keep index up-to-date
await client.loadIndex('my-index', {
  autoRefresh: true,
  pollingIntervalInSeconds: 300, // Check cloud every 5 minutes
});

// Stop auto-refresh by reloading without the option
await client.loadIndex('my-index');
```

***

### loadIndexes()

> **loadIndexes**(`indexNames`, `options?`): `Promise`\<[`LoadIndexesResult`](../interfaces/LoadIndexesResult)>

Loads several indexes into memory in one call. A name that fails to load is reported
in `failed` and does not affect the others.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexNames` | `string`\[] | Names of the indexes to load. |
| `options?` | [`LoadIndexOptions`](../interfaces/LoadIndexOptions) | Auto-refresh and cache settings, applied to every index. |

#### Returns

`Promise`\<[`LoadIndexesResult`](../interfaces/LoadIndexesResult)>

`{ loaded, failed, failedCodes }`: `failed` maps a name to its error message, and
`failedCodes` maps it to its [`MossErrorCode`](../type-aliases/MossErrorCode).

#### Example

```typescript theme={null}
const { loaded, failed } = await client.loadIndexes(['products', 'reviews']);
```

***

### unloadIndex()

> **unloadIndex**(`indexName`): `Promise`\<`void`>

Removes a loaded index from memory and stops its auto-refresh polling.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the loaded index to remove from memory. |

#### Returns

`Promise`\<`void`>

#### Example

```typescript theme={null}
await client.unloadIndex('my-index');
```

***

### unloadIndexes()

> **unloadIndexes**(`indexNames`): `Promise`\<`void`>

Removes several loaded indexes from memory. Names that are not loaded are ignored.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexNames` | `string`\[] | Names of the indexes to remove from memory. |

#### Returns

`Promise`\<`void`>

#### Example

```typescript theme={null}
await client.unloadIndexes(['products', 'reviews']);
```

***

### query()

> **query**(`indexName`, `query`, `options?`): `Promise`\<[`SearchResult`](../interfaces/SearchResult)>

Performs a semantic similarity search against a loaded index. Call `loadIndex()` first;
queries then run entirely in-memory. Metadata filtering is supported on loaded indexes.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the target index to search. |
| `query` | `string` | The search query text. |
| `options?` | [`QueryOptions`](../interfaces/QueryOptions) | Optional query configuration including topK (default: 5) and embedding overrides. |

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult)>

Promise that resolves to SearchResult with matching documents.

#### Throws

If the specified index does not exist.

#### Example

```typescript theme={null}
const results = await client.query('knowledge-base', 'machine learning');
results.docs.forEach(doc => {
  console.log(`${doc.id}: ${doc.text} (score: ${doc.score})`);
});
```

***

### queryMultiIndex()

> **queryMultiIndex**(`indexNames`, `query`, `options?`): `Promise`\<[`SearchResult`](../interfaces/SearchResult)>

Searches several loaded indexes in one call and returns the global top-k, with each
result's `indexName` set to its source index. All indexes must already be loaded and
share the same embedding model.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexNames` | `string`\[] | Names of the loaded indexes to search. |
| `query` | `string` | The search query text. |
| `options?` | [`QueryOptions`](../interfaces/QueryOptions) | Same options as [`query()`](#query). `topK` (default: 10) caps the merged result, and `filter` applies to every index. |

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult)>

SearchResult whose docs carry `indexName`.

#### Throws

If no names are given, a name is not loaded, or models differ.

#### Example

```typescript theme={null}
await client.loadIndexes(['products', 'reviews']);
const results = await client.queryMultiIndex(
  ['products', 'reviews'],
  'noise cancelling headphones',
  { topK: 5, alpha: 0.5 },
);
results.docs.forEach(doc => console.log(doc.indexName, doc.id, doc.score));
```

***

### getAuthToken()

> **getAuthToken**(): `Promise`\<`AuthToken`>

Returns a short-lived auth token for the current project. This is primarily
useful for custom-authenticator patterns, where your backend mints tokens for
untrusted clients instead of shipping the `projectKey`. See the
[Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md) guide for details.

#### Returns

`Promise`\<`AuthToken`>

Promise that resolves to an `AuthToken` containing the `token` string and its
`expiresIn` lifetime in seconds.

#### Example

```typescript theme={null}
const { token, expiresIn } = await client.getAuthToken();
console.log(`Token valid for ${expiresIn}s`);
```

***

### session()

> **session**(`indexName`, `modelId?`, `modelArtifact?`): `Promise`\<[`SessionIndex`](./SessionIndex)>

Creates a local-first [`SessionIndex`](./SessionIndex). The session starts empty, even when
a cloud index with the given name exists; call
[`session.loadIndex(indexName)`](./SessionIndex#loadindex) to pull that index in without
re-embedding. The `indexName` is also the target when
[`pushIndex()`](./SessionIndex#pushindex) is called.

Works with a client built with either a project key or a custom `IAuthenticator`. With a
project key, the session exchanges the key for an access token when it opens, and the promise
rejects if the key is invalid. With a custom `IAuthenticator`, the session gets its tokens
through the same bridge as [`loadIndex()`](#loadindex). For a built-in model, opening the
session also loads the embedding model, which calls Moss with that token, so the promise
rejects if the authenticator fails or Moss refuses its token. With a custom `IAuthenticator`
and the `"custom"` model, opening asks the authenticator for a token but makes no call to
Moss, so a token Moss refuses first surfaces on `session.loadIndex()` or `pushIndex()`.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Session name and the cloud index `pushIndex()` writes to. Pass it to `loadIndex()` to resume that index. |
| `modelId?` | [`MossModel`](../type-aliases/MossModel) | Embedding model for the session. **Default** `"moss-minilm"`. Other options: `"moss-mediumlm"`, `"custom"`. |
| `modelArtifact?` | `ModelArtifactIdentity` | Exact publisher identity of a local foundation model: the manifest `version` and the lowercase SHA-256 of the manifest bytes (`manifestSha256`). |

#### Returns

`Promise`\<[`SessionIndex`](./SessionIndex)>

#### Example

```typescript theme={null}
const session = await client.session('chat-session-123');
await session.addDocs([{ id: '1', text: 'Customer asked about billing' }]);
const results = await session.query('billing question');
await session.pushIndex();
```

***

### close()

> **close**(): `Promise`\<`void`>

Sends the final usage report, then releases the client's native resources: its loaded
indexes, refresh pollers and telemetry. Also closes every session the client opened.
Resolves once the report arrives or 2 seconds pass. Safe to call more than once;
concurrent callers share one promise. Afterwards every method rejects with
`MossClient is closed`; create a new client to continue.

`MossClient` also implements `Symbol.asyncDispose`, so `await using` closes it when the
enclosing block ends (Node.js 24 or later).

#### Returns

`Promise`\<`void`>

#### Example

```typescript theme={null}
await using client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!);
await client.loadIndex('my-index');
const results = await client.query('my-index', 'refund policy');
// client.close() runs when the block ends
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md

# SessionIndex

> Local-first, in-process index for real-time indexing and querying.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / SessionIndex

# SessionIndex

A local-first, in-process index for real-time indexing and querying. All operations
(`addDocs`, `deleteDocs`, `query`) run in process memory with no cloud round-trip per
operation. Call [`pushIndex()`](#pushindex) to persist the session to the cloud.

Construct a session with [`MossClient.session()`](./MossClient#session); the constructor is
not used directly.

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient('your-project-id', 'your-project-key');

const session = await client.session('chat-session-123');
await session.addDocs([{ id: '1', text: 'Customer asked about billing' }]);
const results = await session.query('billing question');
await session.pushIndex();
```

## Accessors

| Property | Type | Description |
| - | - | - |
| `name` | `string` | The session name, and the cloud index `pushIndex` writes to. |
| `docCount` | `number` | Number of documents currently in the local session. |
| `modelId` | [`MossModel`](../type-aliases/MossModel) | The embedding model the session uses, as of its last completed call. `loadIndex`, `loadFromDisk` and auto-refresh can change it *(@moss-js/moss 1.17.0+)*. |

## Methods

### addDocs()

> **addDocs**(`docs`, `options?`): `Promise`\<\{ `added`: `number`; `updated`: `number` }>

Adds or updates documents in the local session index. For built-in models, embeddings are
generated locally. For `modelId: "custom"`, each document must carry an `embedding`.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `docs` | [`DocumentInfo`](../interfaces/DocumentInfo)\[] | Documents to add or update. |
| `options?` | [`MutationOptions`](../interfaces/MutationOptions) | Mutation options (e.g. `upsert`). |

#### Returns

`Promise`\<\{ `added`: `number`; `updated`: `number` }>

***

### deleteDocs()

> **deleteDocs**(`docIds`): `Promise`\<`number`>

Deletes documents from the local session by id. Returns the number removed.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `docIds` | `string`\[] | Document ids to delete. |

#### Returns

`Promise`\<`number`>

***

### getDocs()

> **getDocs**(`options?`): `Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

Fetches documents currently in the local session.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `options?` | [`GetDocumentsOptions`](../interfaces/GetDocumentsOptions) | Pass `docIds` to filter. |

#### Returns

`Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

***

### query()

> **query**(`query`, `options?`): `Promise`\<[`SearchResult`](../interfaces/SearchResult)>

Hybrid (keyword + semantic) search over the local session index, entirely in-memory. For
`modelId: "custom"`, an explicit `options.embedding` is required.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `query` | `string` | The search query text. |
| `options?` | [`QueryOptions`](../interfaces/QueryOptions) | Query options (`topK`, `alpha`, `embedding`, `filter`). |

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult)>

***

### loadIndex()

> **loadIndex**(`indexName`, `options?`): `Promise`\<`number`>

Loads an existing cloud index into the session by name. A session starts empty, so this is
how it resumes the cloud index it is named after. With `options.autoRefresh = true`,
the SDK polls the cloud index and pulls newer versions in on subsequent reads (paused while
the session has un-pushed local edits). Returns the number of documents loaded, `0` when no
cloud index has that name.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the cloud index to load into the session. |
| `options?` | [`LoadSessionOptions`](../interfaces/LoadSessionOptions) | Auto-refresh settings. |

#### Returns

`Promise`\<`number`>

***

### pushIndex()

> **pushIndex**(): `Promise`\<[`PushIndexResult`](../interfaces/PushIndexResult)>

Uploads the session to the cloud, creating or replacing the index with the same name.
For a built-in model the service re-embeds the text with that model, so the index loads and
answers text queries like one built with `createIndex`. A custom-model session keeps its own
embeddings.

#### Returns

`Promise`\<[`PushIndexResult`](../interfaces/PushIndexResult)>

***

### saveToDisk()

> **saveToDisk**(`cachePath?`): `Promise`\<`void`>

Persists the session to `<cachePath>/<name>/` for offline reuse without a cloud round-trip.
A relative `cachePath` resolves against the current working directory, and `~` is not
expanded.

Without `cachePath`, or with an empty one, the snapshot goes in `sessions/<project id>/`
under the client's [`cachePath` option](./MossClient#mossclientoptions), else under the
`MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else
under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
`%LOCALAPPDATA%\moss` on Windows. *(@moss-js/moss 1.19.0+)*

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory to write the session to. Defaults to the directory above. |

***

### loadFromDisk()

> **loadFromDisk**(`cachePath?`, `options?`): `Promise`\<`number`>

Restores a session previously written by `saveToDisk`. Without `cachePath` it reads the
directory `saveToDisk` uses without one. Returns the number of documents loaded.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory a session was saved to. Defaults to the directory `saveToDisk` uses without one. |
| `options?` | `LoadFromDiskOptions` | `rebuildLegacy` (default `true`) rebuilds a snapshot that an SDK older than 1.8 saved for a built-in model. Pass `{ rebuildLegacy: false }` to load it as a custom-model session. |

#### Returns

`Promise`\<`number`>

***

### inspectSnapshot()

> **inspectSnapshot**(`cachePath?`): `Promise`\<`SnapshotInfo`>

Describes the snapshot under `<cachePath>/<name>/` without loading it. Without `cachePath` it
reads the directory `saveToDisk` uses without one *(@moss-js/moss 1.19.0+)*.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory a session was saved to. Defaults to the directory `saveToDisk` uses without one. |

#### Returns

`Promise`\<`SnapshotInfo`>:

| Field | Type | Description |
| - | - | - |
| `modelId` | `string` | The model the snapshot was saved with: `"custom"` or a built-in model such as `"moss-minilm"`. |
| `hasModelArtifact` | `boolean` | `false` for a built-in model snapshot an SDK older than 1.8 saved, which `loadFromDisk` rebuilds by default. |
| `docCount` | `number` | Documents in the snapshot. |
| `dimension` | `number` | Vector dimension. |
| `legacyLayout` | `boolean` | `true` for the on-disk layout of older SDKs. |

***

### close()

> **close**(): `Promise`\<`void`>

Sends the final usage report, then releases the session's native resources: its
auto-refresh poller, its in-memory index and its reference to the shared embedding model.
Resolves once the report arrives or 2 seconds pass. Safe to call more than once.
Afterwards `name` and `modelId` still read; `docCount` and every method throw.
[`MossClient.close()`](./MossClient#close) also closes every session the client opened.

`SessionIndex` also implements `Symbol.asyncDispose`, so `await using` closes it when the
enclosing block ends (Node.js 24 or later).

#### Returns

`Promise`\<`void`>

#### Example

```typescript theme={null}
await using session = await client.session('call-123');
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about a refund.' }]);
const results = await session.query('refund');
// session.close() runs when the block ends
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/DocumentInfo.md

# DocumentInfo

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / DocumentInfo

# Interface: DocumentInfo

Document that can be indexed and retrieved.

## Extended by

* [`QueryResultDocumentInfo`](./QueryResultDocumentInfo)

## Properties

| Property | Type | Description |
| - | - | - |
| `id` | `string` | Unique identifier within an index. |
| `text` | `string` | REQUIRED canonical text to embed/search. |
| `metadata?` | `Record`\<`string`, `string`> | Optional metadata associated with the document. |
| `embedding?` | `number`\[] | Optional caller-provided embedding vector. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/QueryOptions.md

# QueryOptions

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / QueryOptions

# Interface: QueryOptions

Optional parameters for semantic queries.

## Properties

| Property | Type | Description |
| - | - | - |
| `embedding?` | `number`\[] | Caller-provided embedding vector. When supplied, the service/client skips embedding generation. |
| `topK?` | `number` | Number of top results to return. Overrides method-level defaults. |
| `alpha?` | `number` | Weight for hybrid search fusion. `1.0` = pure semantic, `0.0` = pure keyword. **Default** `0.8`. |
| `filter?` | `any` | Optional metadata filter applied to the query. Supports field conditions and `$and` / `$or` composition. Pass a plain object in the shape described under [`MetadataFilter`](../type-aliases/MetadataFilter), with operators from [`FilterCondition`](../type-aliases/FilterCondition). The package does not export either type. |
| `minScore?` | `number` | Minimum `score` a hit must reach, from 0 to 1. Drops hits below it; a query returns up to `topK` hits that clear it, in hybrid order. Rejected on a keyword-only query (`alpha === 0`). Session queries ignore it. *(@moss-js/moss 1.15.0+)* |
| `candidateDepth?` | `number` | How many hits a hybrid query (`alpha` between 0 and 1) ranks on each signal before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Defaults to `2 * topK`. A set value must be at least 1 and is raised to `topK` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it. Used by `query()` and [`queryMultiIndex()`](../classes/MossClient#querymultiindex); session queries ignore it. *(@moss-js/moss 1.15.0+)* |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/SearchResult.md

# SearchResult

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / SearchResult

# Interface: SearchResult

Search operation result.

## Properties

| Property | Type | Description |
| - | - | - |
| `docs` | [`QueryResultDocumentInfo`](./QueryResultDocumentInfo)\[] | Matching documents in hybrid relevance order. |
| `query` | `string` | The original search query. |
| `indexName?` | `string` | Name of the index that was searched. |
| `timeTakenInMs?` | `number` | Time taken to execute the search in milliseconds. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/QueryResultDocumentInfo.md

# QueryResultDocumentInfo

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / QueryResultDocumentInfo

# Interface: QueryResultDocumentInfo

Document result from a query, with its relevance score.

## Extends

* [`DocumentInfo`](./DocumentInfo)

## Properties

| Property | Type | Description | Inherited from |
| - | - | - | - |
| `id` | `string` | Unique identifier within an index. | [`DocumentInfo`](./DocumentInfo).[`id`](./DocumentInfo#property-id) |
| `text` | `string` | REQUIRED canonical text to embed/search. | [`DocumentInfo`](./DocumentInfo).[`text`](./DocumentInfo#property-text) |
| `metadata?` | `Record`\<`string`, `string`> | Optional metadata associated with the document. | [`DocumentInfo`](./DocumentInfo).[`metadata`](./DocumentInfo#property-metadata) |
| `embedding?` | `number`\[] | Optional caller-provided embedding vector. | [`DocumentInfo`](./DocumentInfo).[`embedding`](./DocumentInfo#property-embedding) |
| `score` | `number` | Relevance to the query from 0 to 1. It comes from vector similarity alone, so rank never changes it and every `alpha` above 0 gives the same value. Results are ordered by hybrid relevance, so a lower-ranked result can show a higher score. A keyword-only query (`alpha` 0, or an index without vectors) scores every hit 0. Scores depend on the embedding model: tune `minScore` on your own queries. See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics). *(@moss-js/moss 1.15.0+)* | - |
| `indexName?` | `string` | Source index name. Set on [`queryMultiIndex()`](../classes/MossClient#querymultiindex) results; absent for single-index queries. | - |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/LoadIndexOptions.md

# LoadIndexOptions

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / LoadIndexOptions

# Interface: LoadIndexOptions

## Properties

| Property | Type | Description |
| - | - | - |
| `autoRefresh?` | `boolean` | Whether to enable auto-refresh polling for this index. When enabled, the index will periodically check for updates from the cloud. **Default** `false` |
| `pollingIntervalInSeconds?` | `number` | Polling interval in seconds. Only used when autoRefresh is true. **Default** `600 (10 minutes)` |
| `cachePath?` | `string` | Filesystem path for caching index data to disk. When set, downloaded indexes are persisted and reused on subsequent loads if the cloud data hasn't changed. Auto-refresh also writes to this cache. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/interfaces/MutationOptions.md

# MutationOptions

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MutationOptions

# Interface: MutationOptions

Options for async mutation operations (addDocs, deleteDocs).

## Properties

| Property | Type | Description |
| - | - | - |
| `upsert?` | `boolean` | Whether to update existing documents with the same ID. Only applies to addDocs. **Default** `true` |
| `onProgress?` | (`progress`) => `void` | Callback invoked with progress updates (\~every 2s) while the server is processing. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md

# MetadataFilter

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MetadataFilter

# Type Alias: MetadataFilter

Composable metadata filter passed to [`QueryOptions.filter`](../interfaces/QueryOptions). Metadata
filtering narrows query results to only documents whose metadata satisfies the filter. It is
evaluated on the loaded (local) index; load the index via `loadIndex()` before querying.

> [!NOTE]
>
> `@moss-js/moss` does not export `MetadataFilter`. This page documents the shape of a filter
> object. `QueryOptions.filter` is typed `any`, so pass a plain object, or declare this type and
> [`FilterCondition`](./FilterCondition) in your own code to have TypeScript check your filters.

```ts theme={null}
type MetadataFilter =
  | { field: string; condition: FilterCondition }
  | { $and: MetadataFilter[] }
  | { $or:  MetadataFilter[] };
```

## Shapes

* **Field condition** - compare a single metadata field using a [`FilterCondition`](./FilterCondition) operator.
* **`$and`** - logical AND of nested filters; a document must satisfy every entry.
* **`$or`** - logical OR of nested filters; a document must satisfy at least one entry.

## Example

```ts theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient(projectId, projectKey);
await client.loadIndex('products');

const results = await client.query('products', 'running shoes', {
  topK: 5,
  alpha: 0.6,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
});
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

<!-- ================================================================ -->
## Page: https://docs.moss.dev/docs/reference/js/type-aliases/MossModel.md

# MossModel

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MossModel

# Type Alias: MossModel

> **MossModel** = `"moss-minilm"` | `"moss-mediumlm"` | `"custom"`

Available embedding models for text-to-vector conversion.

Each model offers different trade-offs between speed, accuracy, and resource usage:

* **moss-minilm**: Lightweight model optimized for speed and efficiency.
  Best for applications requiring fast response times with moderate accuracy requirements.

* **moss-mediumlm**: Balanced model offering higher accuracy with reasonable performance.
  Best for applications where search quality is important and moderate latency is acceptable.

* **custom**: Use this when providing pre-computed embeddings from external sources.
  No embedding model is loaded. All documents must include embeddings, and all queries
  must provide embeddings via QueryOptions.embedding.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

---

# Part D — SDK READMEs, samples and changelogs (from usemoss/moss repo)

## sdks/python/sdk/README.md (verbatim)

`````markdown
# Moss client library for Python

`moss` enables **private, on-device semantic search** in your Python applications with cloud storage capabilities.

Built for developers who want **instant, memory-efficient, privacy-first AI features** with seamless cloud integration.

## ✨ Features

- ⚡ **On-Device Vector Search** - Sub-millisecond retrieval with zero network latency
- 🔍 **Semantic, Keyword & Hybrid Search** - Embedding search blended with Keyword matching
- ☁️ **Cloud Storage Integration** - Automatic index synchronization with cloud storage
- 📦 **Multi-Index Support** - Manage multiple isolated search spaces
- 🛡️ **Privacy-First by Design** - Computation happens locally. Indexes sync to the cloud, and usage telemetry is sent (see [Telemetry](#telemetry))
- 🚀 **High-Performance Rust Core** - Built on optimized Rust bindings for maximum speed
- 🧠 **Custom Embedding Overrides** - Provide your own document and query vectors when you need full control

## 📦 Installation

```bash
pip install moss
```

## 🚀 Quick Start

```python
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions

async def main():
    # Initialize search client with project credentials
    client = MossClient("your-project-id", "your-project-key")

    # Prepare documents to index
    documents = [
        DocumentInfo(
            id="doc1",
            text="How do I track my order? You can track your order by logging into your account.",
            metadata={"category": "shipping"}
        ),
        DocumentInfo(
            id="doc2", 
            text="What is your return policy? We offer a 30-day return policy for most items.",
            metadata={"category": "returns"}
        ),
        DocumentInfo(
            id="doc3",
            text="How can I change my shipping address? Contact our customer service team.",
            metadata={"category": "support"}
        )
    ]

    # Create an index with documents (syncs to cloud)
    index_name = "faqs"
    await client.create_index(index_name, documents)  # Defaults to moss-minilm
    print("Index created and synced to cloud!")

    # Load the index (from cloud or local cache)
    await client.load_index(index_name)

    # Search the index
    result = await client.query(
        index_name,
        "How do I return a damaged product?",
        QueryOptions(top_k=3, alpha=0.6),
    )

    # Display results
    print(f"Query: {result.query}")
    for doc in result.docs:
        print(f"Score: {doc.score:.4f}")
        print(f"ID: {doc.id}")
        print(f"Text: {doc.text}")
        print("---")

asyncio.run(main())
```

### Scores and `min_score`

Each result's `score` is its relevance to the query from 0 to 1. Results are
ordered by hybrid relevance, so a lower result can show a higher score. Scores
depend on the embedding model: tune `min_score` on your own queries.

`QueryOptions(min_score=0.5)` drops results whose score is below 0.5; a query
returns up to `top_k` results that clear it, in hybrid order. It takes a value
from 0 to 1. Keyword-only queries (`alpha=0.0`) have no embedding to score
against: every result scores 0.0 and `min_score` raises an error.

## 🔥 Example Use Cases

- Smart knowledge base search with cloud backup
- Realtime Voice AI agents with persistent indexes
- Personal note-taking search with sync across devices
- Private in-app AI features with cloud storage
- Local semantic search in edge devices, fully on-device

## Available Models

- `moss-minilm`: Lightweight model optimized for speed and efficiency
- `moss-mediumlm`: Balanced model offering higher accuracy with reasonable performance

## 🔧 Getting Started

### Prerequisites

- Python 3.8 or higher
- Valid InferEdge project credentials

### Environment Setup

1. **Install the package:**

```bash
pip install moss
```

2. **Get your credentials:**

Sign up at [InferEdge Platform](https://platform.inferedge.dev) to get your `project_id` and `project_key`.

3. **Set up environment variables (optional):**

```bash
export MOSS_PROJECT_ID="your-project-id"
export MOSS_PROJECT_KEY="your-project-key"
# Optional: override the manage API host (defaults to https://service.usemoss.dev)
export MOSS_CLOUD_API_BASE_URL="https://service.usemoss.dev"
```

### Basic Usage

```python
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions

async def main():
    # Initialize client
    client = MossClient("your-project-id", "your-project-key")
    
    # Create and populate an index
    documents = [
        DocumentInfo(id="1", text="Python is a programming language"),
        DocumentInfo(id="2", text="Machine learning with Python is popular"),
    ]
    
    await client.create_index("my-docs", documents)
    await client.load_index("my-docs")
    
    # Search
    results = await client.query(
        "my-docs",
        "programming language",
        QueryOptions(alpha=1.0),
    )
    for doc in results.docs:
        print(f"{doc.id}: {doc.text} (score: {doc.score:.3f})")

asyncio.run(main())
```

### Hybrid Search Controls

`alpha` lets you decide how much weight to give semantic similarity versus keyword relevance when running `query()`:

```python
# Pure keyword search
await client.query("my-docs", "programming language", QueryOptions(alpha=0.0))

# Mixed results (default 0.8 => semantic heavy)
await client.query("my-docs", "programming language")

# Pure embedding search
await client.query("my-docs", "programming language", QueryOptions(alpha=1.0))
```

Pick any value between 0.0 and 1.0 to tune the blend for your use case.

### Disk cache

Pass `cache_path` to persist the downloaded index to disk. Later loads reuse the
cached copy while the cloud version is unchanged, so restarts skip the download.
Auto-refresh writes through to the same cache. Each load still contacts the cloud
to check for a newer version.

```python
await client.load_index(
    "my-docs",
    auto_refresh=True,
    polling_interval_in_seconds=300,
    cache_path="/var/cache/moss",
)
```

Set `cache_path` once on the client to make it the default for every load. A
per-call `cache_path` overrides it, and both override the native default
(`~/.moss`). The chosen directory also holds the `.moss-device-id` file that
keys Monthly Active Device billing.

```python
client = MossClient(
    "your-project-id",
    "your-project-key",
    cache_path="/var/cache/moss",
)

# Uses /var/cache/moss.
await client.load_index("my-docs", auto_refresh=True)

# Overrides it for this load only.
await client.load_index("other-docs", cache_path="/tmp/moss")
```

### Offline-tolerant load

With a `cache_path` set and a snapshot already on disk, a load whose cloud
metadata check fails on a transport error (unreachable network, timeout) serves
the cached snapshot instead of failing, so a restart during an outage still
answers queries. The probe uses a few-second budget, not the full retry window,
and the load starts a refresh poller so the index self-heals when the cloud
returns. A real "index not found" (404) still fails, so a deleted index does not
resurrect from cache.

A load served this way opens the index, but a built-in embedding model cannot be
opened until the Moss cloud is reachable, so text queries with `alpha` above 0
fail until then. Keyword-only queries (`alpha=0.0`) and queries that pass their
own `embedding` keep working, and a later refresh or query warms the model once
the cloud returns.

`was_served_stale(name)` reports whether an index is currently served from such a
snapshot; it clears once a refresh reconfirms it against the cloud.

```python
await client.load_index("my-docs", cache_path="/var/cache/moss")
if await client.was_served_stale("my-docs"):
    # Serving a cached copy; the cloud was unreachable at load.
    ...
```

### Save a session to disk

`client.session(name)` opens a local session index. `save_to_disk(cache_path)`
writes it under `<cache_path>/<name>/`, and `load_from_disk(cache_path)` restores
it into a later session with the same name and returns the number of documents
loaded. Open that session with `auto_load_on_init=False`: it then skips the cloud
index load that the snapshot would replace, so the restore downloads no index. A
failed or interrupted save leaves the last saved snapshot loadable. A relative
`cache_path` resolves against the current working directory, and `~` is not expanded.

```python
session = await client.session("memory")
await session.add_docs([DocumentInfo(id="refund", text="Customer requested a refund")])
await session.save_to_disk("/var/cache/moss")
await session.close()

restored = await client.session("memory", auto_load_on_init=False)
await restored.load_from_disk("/var/cache/moss")
results = await restored.query("refund")
```

Without `cache_path`, `save_to_disk()` and `load_from_disk()` use
`sessions/<project id>/` under the first of these that is set:

1. the client's `cache_path` (`MossClient(..., cache_path=...)`)
2. the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots
   read: the index cache and the model cache ignore it
3. `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
   `%LOCALAPPDATA%\moss` on Windows

A snapshot that an older core saved for a built-in model has no model artifact
identity. `load_from_disk` rebuilds it for a session opened with the same model:
the stored documents are re-embedded with the current model and the upgraded
snapshot is saved back, so the rebuild runs once per device. It needs the cloud
for the model. When the model cannot be loaded, it raises `MossError` with code
`MODEL_UNAVAILABLE` and changes nothing, so retry later. Pass
`rebuild_legacy=False` to load such a snapshot as a custom-model session, whose
queries need an explicit embedding.

### Multi-index search

Search several loaded indexes in one call and get the global top-K back, with
each result tagged by its source `index_name`. All indexes must be loaded
locally and share the same embedding model.

```python
loaded = await client.load_indexes(["products", "reviews"])
if not loaded.loaded:
    raise RuntimeError(f"no indexes loaded: {loaded.failed}")

results = await client.query_multi_index(
    loaded.loaded,
    "noise cancelling headphones",
    QueryOptions(top_k=5, alpha=0.5),
)
for doc in results.docs:
    print(f"[{doc.index_name}] {doc.id}: {doc.text} (score: {doc.score:.3f})")

await client.unload_indexes(loaded.loaded)
```

`alpha` works exactly as in `query()` (default 0.8): `1.0` is embedding-only,
`0.0` is keyword-only, and anything in between blends both with Reciprocal
Rank Fusion. Keyword scoring runs each index's own BM25 and merges each index's
raw hits before fusion; because BM25 statistics stay per-corpus, cross-index
keyword ranking is approximate. `top_k` caps the merged result, not each index,
and `filter` applies to every index. `load_indexes` is best-effort: names that
fail are reported in `failed` without rolling back the ones that loaded.

### Web sources

POST the existing `/v1/manage` web-source actions and return typed results.
Poll `job_id` with `get_job_status`. Set `MOSS_CLOUD_API_BASE_URL` to send manage calls
to a non-default host (defaults to `https://service.usemoss.dev`).

```python
created = await client.create_web_source(
    "https://docs.example.com",
    "knowledge-base",
    max_pages=200,
    refresh_cadence="weekly",
)
await client.get_job_status(created.job_id)

sources = await client.list_web_sources(index_name="knowledge-base")
source = await client.get_web_source(created.id)
updated = await client.update_web_source(created.id, refresh_cadence="daily")
# updated.job_id is set when resync=True enqueued a crawl.
resync = await client.resync_web_source(created.id)
deleted = await client.delete_web_source(created.id)
# deleted.purge_job_id is set when a purge was enqueued.
```

### Metadata filtering

You can pass a metadata filter directly to `query()` after loading an index locally:

```python
results = await client.query(
    "my-docs",
    "running shoes",
    QueryOptions(top_k=5, alpha=0.6),
    filter={
        "$and": [
            {"field": "category", "condition": {"$eq": "shoes"}},
            {"field": "price", "condition": {"$lt": "100"}},
        ]
    },
)
```

For a complete runnable example, see [`examples/python/metadata_filtering.py`](https://github.com/usemoss/moss/blob/main/examples/python/metadata_filtering.py).

### Load documents from JSON, text and markdown

`create_index`, `add_docs` and `SessionIndex.add_docs` take documents as `DocumentInfo` objects, dicts (or any `collections.abc.Mapping`) with the same fields, JSON text, or file paths:

```python
from pathlib import Path

await client.create_index("faqs", '[{"id": "1", "text": "Track your order in your account."}]')
await client.create_index("faqs-jsonl", Path("faqs.jsonl"))  # one JSON object per line
await client.add_docs("faqs", [{"id": "2", "text": "30-day returns.", "metadata": {"days": 30}}])
await client.create_index("handbook", [Path("docs/handbook.md"), Path("docs/faq.txt")])
```

- Each JSON object uses the `DocumentInfo` fields: `id`, `text`, and optional `metadata`, `embedding` and `payload`. Integer ids and number or boolean metadata values become strings. `$gt` and `$lt` filters still compare plain decimals as numbers; `$eq` and `$in` compare the stored string exactly, so store numbers you filter by equality as integers or strings (for example `30` or `"30"`, not `30.0`). Booleans are stored as `"true"` and `"false"`, so filter them with those strings (for example `{"$eq": "true"}`), not with Python `True`.
- `.txt`, `.md` and `.markdown` files are chunked natively so long files stay fully searchable. Chunk ids are `{path}#{n}` and each chunk's metadata has `parentId`. Markdown chunks start with their heading path, such as `Returns > Refunds`. Pass relative paths for stable ids. Use `create_index_from_files` for PDF and DOCX.
- Front matter at the top of a markdown file, from a first `---` line (not followed by a blank line) through the next `---` or `...` line outside a code fence, is not indexed, and markdown sections with no letters or digits, such as a lone `---` rule, produce no chunk.
- Pass `chunker=` to split text yourself. It runs on a worker thread for every document, files included, and must be synchronous:

```python
await client.create_index("kb", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```

- `chunking=Chunking(...)` tunes the native chunker within bounds sized for the embedding model's input limit (about 512 tokens of English), with the names and limits of `ParseOptions`: `chunk_size` 200 to 2000 characters (default 1200), `chunk_overlap` 0 to half of `chunk_size` (default 200, capped at half of `chunk_size`), `mode="pages"` (packed sentences, default) or `"sentences"` (one sentence per chunk, no overlap), and `markdown_header_depth` 1 to 6 (deepest heading that starts a section, default 6). Out-of-range values raise `InvalidArgumentError`. With `chunking=`, `DocumentInfo`, dict and JSON input is chunked too. Pass `chunker` or `chunking`, not both:

```python
from moss import Chunking

await client.create_index("kb", Path("notes.md"), chunking=Chunking(chunk_size=800, chunk_overlap=100))
```

- Chunks from your own `chunker` may have at most 2,000 characters (about 512 tokens of English, the embedding model's input limit); a longer one raises `InvalidArgumentError` naming the document.
- Re-ingesting a file that now has fewer chunks leaves its old higher-numbered chunks in the index; remove them with `delete_docs`.
- A document's `payload` is copied onto every chunk, so its size is multiplied by the chunk count.
- There is no client-side batching. `create_index` uploads one blob and `add_docs` sends one request body, and the service can reject a very large one, which surfaces as `InvalidArgumentError`. As a guide, a 5 MB markdown file becomes about 5,000 chunks and about 6 MB of request body.
- Native chunking is tuned for English. A word longer than `chunk_size`, such as a long URL, is split into `chunk_size` pieces, so no text is dropped. Sentence ends are only `.`, `!` and `?`, and text in scripts without spaces, such as Chinese or Japanese, is split by length only; at the default `chunk_size` of 1200, a chunk of it exceeds the embedding model's 512-token limit, so pass a smaller `chunk_size` for such text.

## 🧠 Providing custom embeddings

Already using your own embedding model? Supply vectors directly when managing
indexes and queries:

```python
import asyncio

from moss import DocumentInfo, MossClient, QueryOptions


def my_embedding_model(text: str) -> list[float]:
    """Placeholder for your custom embedding generator."""
    ...


async def main() -> None:
    client = MossClient("your-project-id", "your-project-key")

    documents = [
        DocumentInfo(
            id="doc-1",
            text="Attach a caller-provided embedding.",
            embedding=my_embedding_model("doc-1"),
        ),
        DocumentInfo(
            id="doc-2",
            text="Fallback to the built-in model when the field is omitted.",
            embedding=my_embedding_model("doc-2"),
        ),
    ]

    await client.create_index("custom-embeddings", documents)  # Defaults to moss-minilm
    await client.load_index("custom-embeddings")

    results = await client.query(
        "custom-embeddings",
        "<query text>",
        QueryOptions(embedding=my_embedding_model("<query text>"), top_k=10),
    )

    print(results.docs[0].id, results.docs[0].score)


asyncio.run(main())
```

Leaving the model argument undefined defaults to `moss-minilm`.
Pass `QueryOptions` to reuse your own embeddings or to override `top_k` on a per-query basis.

> **Normalize your vectors.** Moss does not normalize caller-provided embeddings, so
> rankings match cosine similarity only when document and query vectors are unit
> length (L2-normalized). Hosted embedding APIs such as OpenAI return normalized
> vectors already; local models often do not. Un-normalized vectors still return
> results, but the order can differ from what you would compute with cosine similarity.

## Inference

`MossInference` answers chat messages with facts from your Moss indexes. It is async only, and its `chat.completions.create` takes the arguments of OpenAI's, plus an optional `indexes` list of the indexes to search. Replies have OpenAI's field names and attribute access, such as `chunk.choices[0].delta.content`, but they are dataclasses, not OpenAI's types, and a chunk's `raw` holds the decoded event. To send a reply's `message` back, append the message itself, not a `dataclasses.asdict` of it, which moves fields such as Gemini's thought signature under `raw`.

```python
from moss import MossInference

async with MossInference("your-project-id", "your-project-key") as client:
    stream = await client.chat.completions.create(
        messages=[{"role": "user", "content": "Do you ship to Canada?"}],
        indexes=["faq"],
        stream=True,
    )
    async with stream:
        async for chunk in stream:
            if chunk.choices:
                print(chunk.choices[0].delta.content or "", end="", flush=True)
```

Without `stream=True` the call returns one `ChatCompletion`:

```python
async with MossInference("your-project-id", "your-project-key") as client:
    completion = await client.chat.completions.create(
        messages=[{"role": "user", "content": "Do you ship to Canada?"}],
        indexes=["faq"],
    )
    print(completion.choices[0].message.content)
```

With `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` set, `from moss import inference` gives the same call on a client built from them: `await inference.chat.completions.create(messages=messages)`.

`model` is `"moss"`, the Moss model, unless you pass another. `api_key` is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. Set it on the client, or pass it to `create` for one call, where it replaces the client's:

```python
async with MossInference(
    "your-project-id", "your-project-key", api_key="your-openai-key"
) as client:
    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Do you ship to Canada?"}],
        indexes=["faq"],
    )
```

- `api_key` is sent as the `X-Moss-Provider-Key` header, never in the body or an error message, and an empty one is an error.
- A client checks its credentials, provider key, headers and timeouts when you build it. It keeps one connection pool, for the event loop it last ran in, until `close()` or the end of `async with`. A call in another loop drops that pool without closing it, so open and close a client in the loop that uses it.
- Other OpenAI arguments, such as `temperature` or `stream_options`, reach the model unchanged, and a reply's `message` can go back into `messages`.
- Without `indexes`, every index of the project is searched, and `indexes=[]` or `retrieve=False` skips the search. `default_headers` go with every call and `extra_headers` with one. Neither can set `Host`, `Content-Length` or `Transfer-Encoding`.
- `timeout` limits a whole call, stream included, and `idle_timeout` limits the wait for the reply and each pause in it. Both are in seconds, and 0 or less turns one off. On the client, `timeout` is off by default and `idle_timeout` is 120, also when you pass `None`. `create` can change either for one call, where `None` keeps the client's.
- Moss can answer an identical request from its reply cache; `cache=False` always asks the model.
- `max_retries`, 2 by default, on the client or for one call, sends a call again after a connection failure or a `408`, `409`, `429` or `5xx`, waiting its `Retry-After` when it is 60 s or less, else 0.5 s doubled each time, within `timeout`. 0 turns it off.
- Leaving a stream early, with `break` or `aclose()`, closes the connection and stops the model. A cancelled task does the same and raises `CancelledError`.
- Failures raise `inference.InferenceError` with `status`, `type` (such as `authentication_error`, `rate_limit_error`, `model_error`, `timeout`, `connection_error` or `incomplete_stream`) and `message`. Once the service has answered, `request_id` holds its `X-Moss-Request-Id`, `code` its error code, such as `rate_limit_exceeded`, and `retry_after` the seconds an error response asks you to wait in `Retry-After`. Each is `None` when absent, and a stream and a `ChatCompletion` have a `request_id` too. A redirect is an error too, so your credentials never reach another URL.
- Calls go to `https://inference.moss.dev/v1`. To call another gateway, set `MOSS_INFERENCE_URL` to its base URL, such as `https://gateway.example.com/v1`, and `/chat/completions` goes after it. A client reads the variable when you build it, and raises `InferenceError` for a value that is not an `http` or `https` URL with a host and no user info, query or fragment.

### Tool calls

`tools`, `tool_choice` and `parallel_tool_calls` go to the model as you pass them. Put the reply's `message` back into `messages` as is, then one `tool` message for each call. The message keeps every field of its tool calls, such as the thought signature Gemini needs in the next turn, and each call's `raw` holds them. A call goes back as its `raw`, so a changed call needs a changed `raw`. On a stream, `await stream.get_final_completion()` gives the whole reply, joined from every chunk, the ones you already read included. If the stream was closed before its end, it fails with `incomplete_stream`, so it never returns part of a reply.

```python
import json

tools = [{
    "type": "function",
    "function": {
        "name": "lookup_order",
        "parameters": {"type": "object", "properties": {"id": {"type": "string"}}},
    },
}]
messages = [{"role": "user", "content": "Where is order A1?"}]
async with MossInference("your-project-id", "your-project-key") as client:
    while True:
        stream = await client.chat.completions.create(
            messages=messages, tools=tools, stream=True
        )
        async for chunk in stream:
            if chunk.choices:
                print(chunk.choices[0].delta.content or "", end="")
        message = (await stream.get_final_completion()).choices[0].message
        messages.append(message)
        if not message.tool_calls:
            break
        for call in message.tool_calls:
            output = lookup_order(**json.loads(call.function.arguments))
            messages.append({"role": "tool", "tool_call_id": call.id, "content": output})
```

### MCP servers

An `McpServer` in `tools` lets the model call that server's tools. Moss runs them during the reply, and each call and result comes as a chunk's `tool_step`:

```python
from moss.inference import McpServer

crm = McpServer(
    server_label="crm",
    server_url="https://mcp.example.com/mcp",
    headers={"Authorization": "Bearer your-crm-token"},
    allowed_tools=["lookup_order"],
)
async with MossInference("your-project-id", "your-project-key") as client:
    stream = await client.chat.completions.create(
        messages=[{"role": "user", "content": "Where is order A1?"}],
        tools=[crm],
        stream=True,
    )
    async with stream:
        async for chunk in stream:
            if chunk.tool_step:
                print(chunk.tool_step.type, chunk.tool_step.name)
            elif chunk.choices:
                print(chunk.choices[0].delta.content or "", end="")
```

A step's `type` is `call` before the tool runs, with its `arguments`, and `result` after it, with `is_error`, `duration_ms` and `output`. Without `stream=True`, `completion.tool_steps` lists the same steps, in order. Neither `server_url` nor `headers` show in the repr of an `McpServer`.

| `status` | `type` | `code` | When |
| --- | --- | --- | --- |
| 403 | `permission_error` | `mcp_not_enabled` | MCP is switched off on the gateway |
| 429 | `capacity` | `mcp_loops_busy` | The gateway is busy; retry after `retry_after` |
| 400, 424 | `mcp_error` | `mcp_server_error` | The URL was refused, or the server failed to connect or list its tools |
| 400 | `invalid_request_error` | (none) | A bad `tools` entry, or a `server_label` or tool name used twice |

Once a tool step has arrived, every `InferenceError` of that call has the code `failed_after_tool_call`: a tool may have changed data already, so do not replay the call blindly. A call you cancel or time out yourself after a step, such as with `asyncio.timeout`, may also have changed data. A stream that fails after it started is never retried.

## Telemetry

The SDK always sends usage telemetry to the Moss cloud, and there is no option
to turn it off. It sends event types, your project id, index names, query and
document counts, query latencies, SDK and model versions, and a device id, which
is a random UUID stored on the device. Telemetry never includes query text,
document text, metadata, embeddings or file paths. Document text and embeddings
leave the device only when you create, add to or push an index in the cloud.

See [Telemetry](https://docs.moss.dev/docs/reference/telemetry) for every field and when it is sent.

## 📄 License

This package is licensed under the [PolyForm Shield License 1.0.0](./LICENSE.txt).

- ✅ Free for any use, including production and commercial use.
- ❌ Not permitted: providing a product that competes with Moss.
- 📩 For commercial licenses, contact: <contact@usemoss.dev>

## 📬 Contact

For support, commercial licensing, or partnership inquiries, contact us: [contact@usemoss.dev](mailto:contact@usemoss.dev)
`````

## sdks/python/sdk/samples/example_extend_index.py

````python
"""
Example: Resume an existing cloud index, extend it in-session, push the update.

session(index_name) automatically loads from cloud if the index exists,
or starts fresh if it doesn't — the workflow is identical in both cases.

  1. First run  — index doesn't exist yet, session starts empty
  2. Second run — index exists in cloud, session auto-loads it, new docs are appended
"""

import asyncio
import os
import time
from moss import DocumentInfo, MossClient, QueryOptions
from dotenv import load_dotenv

load_dotenv()

def _ms(start: float) -> str:
    return f"{(time.perf_counter() - start) * 1000:.1f}ms"


async def main() -> None:
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")
    index_name = os.getenv("MOSS_EXISTING_INDEX", "my-session-index")

    if not project_id or not project_key:
        print("Please set MOSS_PROJECT_ID and MOSS_PROJECT_KEY in samples/.env")
        return

    client = MossClient(project_id, project_key)

    # Auto-loads from cloud if the index exists, starts fresh if not
    print(f"Opening session for '{index_name}'...")
    t = time.perf_counter()
    session = await client.session(index_name=index_name)
    print(f"  Session ready — {session.doc_count} existing docs loaded  [{_ms(t)}]")

    # Add new docs — appended to whatever was already loaded
    new_docs = [
        DocumentInfo(id="follow-up-1", text="Customer called back to confirm refund was received."),
        DocumentInfo(id="follow-up-2", text="Refund of $49.99 appeared on statement within 3 days."),
        DocumentInfo(id="follow-up-3", text="Customer expressed satisfaction and closed the case."),
    ]
    print("\nAdding new docs...")
    t = time.perf_counter()
    added, updated = await session.add_docs(new_docs)
    print(f"  {added} added, {updated} updated  (total: {session.doc_count})  [{_ms(t)}]")

    # Query the combined index
    print("\nQuerying combined index...")
    t = time.perf_counter()
    results = await session.query("refund outcome and customer satisfaction", QueryOptions(top_k=3))
    print(f"  Query complete  [{_ms(t)}]")
    for doc in results.docs:
        print(f"    [{doc.id}] score={doc.score:.3f}  {doc.text[:60]}...")

    # Push back to cloud — creates or overwrites
    print(f"\nPushing to cloud as '{index_name}'...")
    t = time.perf_counter()
    push_result = await session.push_index()
    print(f"  job_id:    {push_result.job_id}  [{_ms(t)}]")
    print(f"  doc_count: {push_result.doc_count}")
    print(f"  status:    {push_result.status}")


if __name__ == "__main__":
    asyncio.run(main())
````

## sdks/python/sdk/samples/example_session_usage.py

````python
"""
Example: Live Call Session Indexing with moss

Demonstrates the full session workflow:
  1. Load a persistent FAQ index from cloud
  2. Start a local session for an active call
  3. Index call transcript turns locally during the call (~1-5ms each)
  4. Query both the session index and the cloud FAQ index for context
  5. Push the session index to cloud at call end
"""

import asyncio
import os
import time
from datetime import datetime
from moss import DocumentInfo, MossClient, QueryOptions
from dotenv import load_dotenv
load_dotenv()

def _ms(start: float) -> str:
    return f"{(time.perf_counter() - start) * 1000:.1f}ms"


async def main() -> None:
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")

    if not project_id or not project_key:
        print("Please set MOSS_PROJECT_ID and MOSS_PROJECT_KEY in samples/.env")
        print("Copy samples/.env.template to samples/.env and fill in your credentials.")
        return

    client = MossClient(project_id, project_key)

    # -- Simulated call data ---------------------------------------------------
    call_id = f"call-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    transcript = [
        ("turn-1", "Customer called about an incorrect charge on their March invoice."),
        ("turn-2", "The customer was billed twice for the same subscription renewal."),
        ("turn-3", "Customer requested a refund for the duplicate charge of $49.99."),
        ("turn-4", "Agent confirmed the refund would be processed in 3-5 business days."),
        ("turn-5", "Customer also asked about upgrading to the Business plan."),
        ("turn-6", "Agent explained Business plan includes 1TB storage at $79.99/month."),
        ("turn-7", "Customer decided to upgrade immediately after hearing the benefits."),
    ]

    print(f"\n--- Starting session: {call_id} ---\n")

    # -- Step 1: Open session — auto-loads from cloud if it exists, starts fresh if not
    t = time.perf_counter()
    session = await client.session(index_name=call_id)
    print(f"Session ready: {session.name!r}  ({session.doc_count} existing docs)  [{_ms(t)}]")

    # -- Step 2: Index transcript turns as they arrive -------------------------
    print("\nIndexing call transcript locally...")
    docs = [DocumentInfo(id=turn_id, text=text) for turn_id, text in transcript]
    t = time.perf_counter()
    added, updated = await session.add_docs(docs)
    print(f"  {added} turns added, {updated} updated  (total: {session.doc_count})  [{_ms(t)}]")

    # -- Step 3: Query the local session index for context ---------------------
    print("\nQuerying session index (local, no cloud)...")
    queries = [
        "billing issue and invoice dispute",
        "refund processing timeline",
        "plan upgrade storage",
    ]

    for query_text in queries:
        t = time.perf_counter()
        results = await session.query(query_text, QueryOptions(top_k=2))
        print(f"\n  Query: {query_text!r}  [{_ms(t)}]")
        for doc in results.docs:
            print(f"    [{doc.id}] score={doc.score:.3f}  {doc.text[:60]}...")

    # -- Step 4: Add more turns mid-call and query again -----------------------
    print("\nAdding follow-up turns...")
    follow_ups = [
        DocumentInfo(id="turn-8", text="Agent initiated the plan upgrade and sent confirmation email."),
        DocumentInfo(id="turn-9", text="Customer confirmed they received the email and were satisfied."),
    ]
    t = time.perf_counter()
    await session.add_docs(follow_ups)
    print(f"  Session now has {session.doc_count} documents  [{_ms(t)}]")

    t = time.perf_counter()
    result = await session.query("call resolution and next steps", QueryOptions(top_k=3))
    print(f"\n  Final context query results  [{_ms(t)}]:")
    for doc in result.docs:
        print(f"    [{doc.id}] score={doc.score:.3f}  {doc.text[:60]}...")

    # -- Step 5: End of call — push session index to cloud ---------------------
    print(f"\nPushing session index to cloud as {call_id!r}...")
    t = time.perf_counter()
    push_result = await session.push_index()
    print(f"  job_id:    {push_result.job_id}  [{_ms(t)}]")
    print(f"  index:     {push_result.index_name}")
    print(f"  doc_count: {push_result.doc_count}")
    print(f"  status:    {push_result.status}")

    print("\nDone! The session index is now available in the cloud for future retrieval.")
    print(f"Next run with index_name={call_id!r} will auto-load it.")


if __name__ == "__main__":
    asyncio.run(main())
````

## sdks/python/sdk/samples/example_usage.py

````python
"""
Example usage of the Moss Python SDK

This example demonstrates the complete workflow.
"""

import asyncio
import os
from typing import List
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

from moss import (
    MossClient,
    DocumentInfo,
    MutationOptions,
    GetDocumentsOptions,
    QueryOptions,
)


async def example_usage():
    """Complete example demonstrating all Moss SDK functionality."""
    print("⭐ Moss API Complete Example ⭐")

    # Initialize client with project credentials from environment
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")

    if not project_id or not project_key:
        print(
            "❌ Please set MOSS_TEST_PROJECT_ID and MOSS_TEST_PROJECT_KEY in .env file"
        )
        print("Copy .env.template to .env and fill in your credentials")
        return

    client = MossClient(project_id, project_key)

    # Example documents following the API contract with metadata
    documents: List[DocumentInfo] = [
        DocumentInfo(
            id="doc1",
            text="Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
            metadata={
                "category": "ai",
                "topic": "machine_learning",
                "difficulty": "intermediate",
            },
        ),
        DocumentInfo(
            id="doc2",
            text="Deep learning uses neural networks with multiple layers to model and understand complex patterns in data.",
            metadata={
                "category": "ai",
                "topic": "deep_learning",
                "difficulty": "advanced",
            },
        ),
        DocumentInfo(
            id="doc3",
            text="Natural language processing enables computers to interpret and manipulate human language for various applications.",
            metadata={"category": "ai", "topic": "nlp", "difficulty": "intermediate"},
        ),
        DocumentInfo(
            id="doc4",
            text="Computer vision enables machines to interpret and understand visual information from the world around them.",
            metadata={
                "category": "ai",
                "topic": "computer_vision",
                "difficulty": "intermediate",
            },
        ),
        DocumentInfo(
            id="doc5",
            text="Reinforcement learning is a type of machine learning where an agent learns to make decisions by performing actions and receiving rewards.",
            metadata={
                "category": "ai",
                "topic": "reinforcement_learning",
                "difficulty": "advanced",
            },
        ),
    ]

    # Use timestamp to create unique index name
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    index_name = f"example-cloud-index-{timestamp}"

    try:
        print(f"\n[1/12] Creating index '{index_name}' with {len(documents)} documents...")
        created = await client.create_index(index_name, documents)
        print(f"✅ Created — {created.doc_count} docs indexed (job {created.job_id})")

        print("\n[2/12] Getting index information...")
        index_info = await client.get_index(index_name)
        print("✅ Index info")
        print(f"     Name:    {index_info.name}")
        print(f"     Docs:    {index_info.doc_count}")
        print(f"     Model:   {index_info.model.id}")
        print(f"     Status:  {index_info.status}")

        print("\n[3/12] Listing all indexes in this project...")
        indexes = await client.list_indexes()
        print(f"✅ Found {len(indexes)} index(es):")
        preview_limit = 5
        for idx in indexes[:preview_limit]:
            print(f"     - {idx.name}  ({idx.doc_count} docs, {idx.status})")
        if len(indexes) > preview_limit:
            print(f"     ... and {len(indexes) - preview_limit} more")

        print("\n[4/12] Adding more documents...")
        new_docs: List[DocumentInfo] = [
            DocumentInfo(
                id="doc6",
                text="Data science combines statistics, programming, and domain expertise to extract insights from data.",
                metadata={
                    "category": "data_science",
                    "topic": "analytics",
                    "difficulty": "intermediate",
                },
            ),
            DocumentInfo(
                id="doc7",
                text="Cloud computing provides on-demand access to computing resources over the internet.",
                metadata={
                    "category": "infrastructure",
                    "topic": "cloud",
                    "difficulty": "beginner",
                },
            ),
        ]
        add_result = await client.add_docs(
            index_name, new_docs, MutationOptions(upsert=True)
        )
        print(f"✅ Added {add_result.doc_count} docs (job {add_result.job_id})")

        print("\n[5/12] Getting all documents...")
        all_docs = await client.get_docs(index_name)
        print(f"✅ Total documents in index: {len(all_docs)}")

        print("\n[6/12] Getting specific documents by id...")
        specific_docs = await client.get_docs(
            index_name, GetDocumentsOptions(doc_ids=["doc1", "doc2", "doc6"])
        )
        print(f"✅ Fetched {len(specific_docs)} docs:")
        for doc in specific_docs:
            text_preview = doc.text[:60] + "..." if len(doc.text) > 60 else doc.text
            print(f"     [{doc.id}] {text_preview}")
            if doc.metadata:
                print(f"            metadata: {doc.metadata}")

        print("\n[7/12] Loading index for querying...")
        await client.load_index(index_name)
        print("✅ Index loaded and ready for queries")

        query_text = "artificial intelligence and neural networks"
        print(f"\n[8/12] Semantic search: \"{query_text}\"")
        search_results = await client.query(
            index_name,
            query_text,
            QueryOptions(top_k=3, alpha=0.6),
        )
        print(f"✅ {len(search_results.docs)} result(s):")
        for i, item in enumerate(search_results.docs, 1):
            text_preview = item.text[:80] + "..." if len(item.text) > 80 else item.text
            print(f"     {i}. [{item.id}]  score={item.score:.3f}")
            print(f"        {text_preview}")
            if item.metadata:
                print(f"        metadata: {item.metadata}")

        print("\n[9/12] Deleting some documents...")
        delete_result = await client.delete_docs(index_name, ["doc6", "doc7"])
        print(f"✅ Deleted {delete_result.doc_count} docs (job {delete_result.job_id})")

        print("\n[10/12] Verifying document count after deletion...")
        remaining_docs = await client.get_docs(index_name)
        print(f"✅ Remaining documents: {len(remaining_docs)}")

        final_query = "machine learning algorithms"
        print(f"\n[11/12] Final search: \"{final_query}\"")
        final_results = await client.query(
            index_name,
            final_query,
            QueryOptions(top_k=2),
        )
        print(f"✅ {len(final_results.docs)} result(s):")
        for i, item in enumerate(final_results.docs, 1):
            print(f"     {i}. [{item.id}]  score={item.score:.3f}")

        print(f"\n[12/12] Cleaning up — deleting index '{index_name}'...")
        await client.delete_index(index_name)
        print("✅ Index deleted")

        print("\n🎉 All operations completed successfully!")

    except Exception as error:
        print(f"❌ Error: {error}")
        if hasattr(error, "message"):
            print(f"Error message: {error.message}")


# Export for use in tests or other modules
__all__ = ["example_usage"]


# Run the example
if __name__ == "__main__":
    asyncio.run(example_usage())
````

## sdks/python/sdk/samples/ios_cloud_index.py

````python
"""
Build a `moss-litelm` index in the cloud for on-device search.

The cloud embeds the documents with `moss-litelm` and stores a compact INT8
index. An app then loads that index with the same project credentials and
queries it on-device with `moss-litelm`, without embedding the documents again.

Prerequisites:
  - Python SDK `moss`.
  - The project's organization has access to `moss-litelm`.
  - MOSS_PROJECT_ID / MOSS_PROJECT_KEY in the environment (or samples/.env).

Run:
  python samples/ios_cloud_index.py
"""
import asyncio
import os
import time

from dotenv import load_dotenv
from moss import DocumentInfo, MossClient

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

INDEX_NAME = os.getenv("MOSS_INDEX", "video-scenes")
MODEL_ID = "moss-litelm"  # the model the app queries with on-device

# Representative records, one document per scene, with metadata for
# filtered queries on-device (for example, a single video).
SCENES = [
    DocumentInfo(id="v1#0", text="A cyclist rides along a coastal road at sunset.",
                 metadata={"video_id": "v1", "scene": "0", "t_start": "0"}),
    DocumentInfo(id="v1#1", text="Two people unload boxes from a delivery van.",
                 metadata={"video_id": "v1", "scene": "1", "t_start": "42"}),
    DocumentInfo(id="v2#0", text="A chef plates a dessert in a busy restaurant kitchen.",
                 metadata={"video_id": "v2", "scene": "0", "t_start": "0"}),
    DocumentInfo(id="v2#1", text="Customers wait in line at the counter to pay.",
                 metadata={"video_id": "v2", "scene": "1", "t_start": "75"}),
]


async def main() -> None:
    pid, key = os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY")
    if not pid or not key:
        print("Set MOSS_PROJECT_ID / MOSS_PROJECT_KEY (see samples/.env)")
        return

    client = MossClient(pid, key)

    print(f"Creating cloud index '{INDEX_NAME}' with {MODEL_ID} ({len(SCENES)} docs)...")
    result = await client.create_index(INDEX_NAME, SCENES, model_id=MODEL_ID)

    # The build runs in the background: the cloud embeds, then builds the index.
    start = time.perf_counter()
    while True:
        st = await client.get_job_status(result.job_id)
        status = st.status.value
        if status in ("completed", "failed"):
            break
        if time.perf_counter() - start > 180:
            raise TimeoutError(f"job {result.job_id} stuck in {status}")
        await asyncio.sleep(2)

    if status != "completed":
        raise RuntimeError(f"index build failed: {getattr(st, 'error', None)}")

    info = await client.get_index(INDEX_NAME)
    print(f"'{INDEX_NAME}' ready: {info.doc_count} docs, model={info.model.id}")
    print("Load it in an app with the same project credentials,")
    print("then query it on-device (MossClient.loadIndex, then query).")


if __name__ == "__main__":
    asyncio.run(main())
````

## sdks/python/sdk/samples/metadata_filtering.py

````python
"""
Metadata filtering sample for the Moss Python SDK.

This example demonstrates querying with metadata filters on a locally loaded index.
"""

import asyncio
import os
from datetime import datetime
from typing import List

from dotenv import load_dotenv
from moss import DocumentInfo, MossClient, QueryOptions

# Load environment variables
load_dotenv()


async def metadata_filtering_sample() -> None:
    """Run metadata-filtered queries using eq, and, in, and near operators."""
    print("⭐ Moss Metadata Filtering Sample (Python) ⭐")

    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")

    if not project_id or not project_key:
        print("❌ Please set MOSS_PROJECT_ID and MOSS_PROJECT_KEY in .env file")
        print("Copy .env.template to .env and fill in your credentials")
        return

    client = MossClient(project_id, project_key)

    documents: List[DocumentInfo] = [
        DocumentInfo(
            id="doc1",
            text="Running shoes with breathable mesh for daily training.",
            metadata={
                "category": "shoes",
                "brand": "swiftfit",
                "price": "79",
                "city": "new-york",
                "location": "40.7580,-73.9855",
            },
        ),
        DocumentInfo(
            id="doc2",
            text="Trail running shoes built for rocky mountain terrain.",
            metadata={
                "category": "shoes",
                "brand": "peakstride",
                "price": "149",
                "city": "seattle",
                "location": "47.6062,-122.3321",
            },
        ),
        DocumentInfo(
            id="doc3",
            text="Lightweight city backpack with laptop compartment.",
            metadata={
                "category": "bags",
                "brand": "urbanpack",
                "price": "95",
                "city": "new-york",
                "location": "40.7505,-73.9934",
            },
        ),
    ]

    index_name = f"metadata-filter-sample-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    try:
        print("\n1. Creating index...")
        await client.create_index(index_name, documents)

        print("2. Loading index locally (required for filtering)...")
        await client.load_index(index_name)

        print("\n3. $eq filter: category == shoes")
        eq_filter = {"field": "category", "condition": {"$eq": "shoes"}}
        eq_results = await client.query(
            index_name,
            "running gear",
            QueryOptions(top_k=5, alpha=0.5, filter=eq_filter),
        )
        for item in eq_results.docs:
            print(f"- {item.id} | score={item.score:.3f} | metadata={item.metadata}")

        print("\n4. $and filter: shoes and price < 100")
        and_filter = {
            "$and": [
                {"field": "category", "condition": {"$eq": "shoes"}},
                {"field": "price", "condition": {"$lt": "100"}},
            ]
        }
        and_results = await client.query(
            index_name,
            "running shoes",
            QueryOptions(top_k=5, alpha=0.6, filter=and_filter),
        )
        for item in and_results.docs:
            print(f"- {item.id} | score={item.score:.3f} | metadata={item.metadata}")

        print("\n5. $in filter: city in [new-york]")
        in_filter = {"field": "city", "condition": {"$in": ["new-york"]}}
        in_results = await client.query(
            index_name,
            "city essentials",
            QueryOptions(top_k=5, filter=in_filter),
        )
        for item in in_results.docs:
            print(f"- {item.id} | score={item.score:.3f} | metadata={item.metadata}")

        print("\n6. $near filter: within 5km of Times Square")
        near_filter = {
            "field": "location",
            "condition": {"$near": "40.7580,-73.9855,5000"},
        }
        near_results = await client.query(
            index_name,
            "city products",
            QueryOptions(top_k=5, filter=near_filter),
        )
        for item in near_results.docs:
            print(f"- {item.id} | score={item.score:.3f} | metadata={item.metadata}")

        print("\n✅ Metadata filtering sample completed")
    finally:
        print("\n7. Cleaning up index...")
        await client.delete_index(index_name)


__all__ = ["metadata_filtering_sample"]


if __name__ == "__main__":
    asyncio.run(metadata_filtering_sample())
````

## sdks/python/sdk/samples/multi_index_search.py

````python
"""
Multi-index search sample for the Moss Python SDK.

Demonstrates the v1.1.0 additions:

- `load_indexes` / `unload_indexes` for bulk lifecycle management
- `query_multi_index` for searching across multiple loaded indexes in one
  call, returning the global top-K with each result tagged by its source
  `index_name`

Notes:
    - All indexes participating in `query_multi_index` must be loaded
      locally and share the same embedding model.
    - `QueryOptions.alpha` works as in `query` (default 0.8): 1.0 is
      embedding-only, 0.0 is keyword-only, anything between is hybrid via
      Reciprocal Rank Fusion. Keyword scoring runs each index's own BM25 and
      merges the hits by score before fusion.
"""

import asyncio
import os
from datetime import datetime
from typing import List

from dotenv import load_dotenv

load_dotenv()

from moss import (
    DocumentInfo,
    LoadIndexesResult,
    MossClient,
    QueryOptions,
)


PRODUCT_DOCS: List[DocumentInfo] = [
    DocumentInfo(
        id="p1",
        text="Sony WH-1000XM5 wireless noise-cancelling headphones with 30-hour battery life.",
        metadata={"category": "electronics", "price": "399"},
    ),
    DocumentInfo(
        id="p2",
        text="Bose QuietComfort Ultra over-ear headphones, immersive audio and ANC.",
        metadata={"category": "electronics", "price": "429"},
    ),
    DocumentInfo(
        id="p3",
        text="Apple AirPods Max with H1 chip, spatial audio, premium leather ear cushions.",
        metadata={"category": "electronics", "price": "549"},
    ),
]

REVIEW_DOCS: List[DocumentInfo] = [
    DocumentInfo(
        id="r1",
        text="Battery on these wireless headphones easily lasts a 30-hour transatlantic week.",
        metadata={"product_id": "p1", "stars": "5"},
    ),
    DocumentInfo(
        id="r2",
        text="Comfortable for long flights but the noise cancelling could be stronger.",
        metadata={"product_id": "p2", "stars": "4"},
    ),
    DocumentInfo(
        id="r3",
        text="Sound quality is incredible but the battery degrades after a year of heavy use.",
        metadata={"product_id": "p3", "stars": "3"},
    ),
]

FAQ_DOCS: List[DocumentInfo] = [
    DocumentInfo(
        id="f1",
        text="How long does the battery last on wireless noise-cancelling headphones?",
        metadata={"topic": "battery"},
    ),
    DocumentInfo(
        id="f2",
        text="Do over-ear headphones support spatial audio for movies and games?",
        metadata={"topic": "audio"},
    ),
    DocumentInfo(
        id="f3",
        text="What is the warranty period for premium wireless headphones?",
        metadata={"topic": "warranty"},
    ),
]


async def main() -> None:
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")

    if not project_id or not project_key:
        print("Set MOSS_PROJECT_ID and MOSS_PROJECT_KEY in your environment.")
        return

    client = MossClient(project_id, project_key)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    products_index = f"sample-multi-products-{timestamp}"
    reviews_index = f"sample-multi-reviews-{timestamp}"
    faqs_index = f"sample-multi-faqs-{timestamp}"

    all_indexes = [products_index, reviews_index, faqs_index]

    try:
        print("1. Creating three indexes with related but distinct content...")
        await asyncio.gather(
            client.create_index(products_index, PRODUCT_DOCS),
            client.create_index(reviews_index, REVIEW_DOCS),
            client.create_index(faqs_index, FAQ_DOCS),
        )
        print(f"   created: {all_indexes}")

        print("\n2. Bulk-loading all three with load_indexes...")
        load_result: LoadIndexesResult = await client.load_indexes(all_indexes)
        print(f"   loaded: {load_result.loaded}")
        print(f"   failed: {load_result.failed}")

        print("\n3. Querying across all three indexes in one call.")
        print("   Each result is tagged with its source index_name.")
        results = await client.query_multi_index(
            all_indexes,
            "wireless headphones battery life",
            QueryOptions(top_k=6),
        )
        print(f'\n   Query: "{results.query}"')
        print(f"   Returned {len(results.docs)} docs (global top-K across indexes):\n")
        for i, doc in enumerate(results.docs, 1):
            preview = doc.text[:70] + "..." if len(doc.text) > 70 else doc.text
            print(f"   {i}. [{doc.index_name}] [{doc.id}] score={doc.score:.3f}")
            print(f"      {preview}")

        print("\n4. options.alpha picks the signal mix, as in single-index query.")
        print("   alpha=0.0 is keyword-only (BM25 per index, merged), 1.0 is")
        print("   embedding-only, and the default 0.8 blends both with RRF:")
        keyword_only = await client.query_multi_index(
            all_indexes,
            "wireless headphones battery life",
            QueryOptions(top_k=6, alpha=0.0),
        )
        embedding_only = await client.query_multi_index(
            all_indexes,
            "wireless headphones battery life",
            QueryOptions(top_k=6, alpha=1.0),
        )
        print(f"   hybrid (0.8):   {[f'{d.index_name}/{d.id}' for d in results.docs]}")
        print(f"   keyword (0.0):  {[f'{d.index_name}/{d.id}' for d in keyword_only.docs]}")
        print(f"   embedding (1.0): {[f'{d.index_name}/{d.id}' for d in embedding_only.docs]}")

        print("\n5. load_indexes is best-effort — a typo on one name does not")
        print("   roll back the others. (Reusing already-loaded names here is fine;")
        print("   load_index is idempotent and will reload them.)")
        partial = await client.load_indexes([products_index, "does-not-exist-xyz"])
        print(f"   loaded: {partial.loaded}")
        print(f"   failed: {partial.failed}")

        print("\n6. Bulk-unloading all three with unload_indexes...")
        await client.unload_indexes(all_indexes)
        print("   unloaded.")

        print("\n7. Cleaning up cloud indexes...")
        await asyncio.gather(*(client.delete_index(name) for name in all_indexes))
        print("   deleted.")

        print("\nDone.")

    except Exception as error:
        print(f"Error: {error}")
        # Best-effort cleanup so the sample doesn't leave orphan indexes around.
        try:
            await client.unload_indexes(all_indexes)
        except Exception:
            pass
        for name in all_indexes:
            try:
                await client.delete_index(name)
            except Exception:
                pass


if __name__ == "__main__":
    asyncio.run(main())
````

## sdks/python/sdk/samples/session_metadata_filtering.py

````python
"""
Example: Metadata Filtering in a Session Index

Demonstrates querying a local session index with metadata filters.
All operations run in-memory — no cloud round trips during the session.

Filter operators shown:
  $eq, $ne, $gt, $in, $and, $or, $near
"""

import asyncio
import os
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

from moss import DocumentInfo, MossClient, QueryOptions


def _ms(start: float) -> str:
    return f"{(time.perf_counter() - start) * 1000:.1f}ms"


# -- Sample data: support call transcript with rich metadata ------------------

TRANSCRIPT = [
    DocumentInfo(
        id="t1",
        text="Customer opened the call about an incorrect charge on their March invoice.",
        metadata={"speaker": "agent", "topic": "billing", "priority": "3", "location": "40.7580,-73.9855"},
    ),
    DocumentInfo(
        id="t2",
        text="The account was billed twice for the same subscription renewal on March 5th.",
        metadata={"speaker": "agent", "topic": "billing", "priority": "5", "location": "40.7580,-73.9855"},
    ),
    DocumentInfo(
        id="t3",
        text="I need a full refund for the duplicate charge of $49.99 immediately.",
        metadata={"speaker": "customer", "topic": "refund", "priority": "5", "location": "40.6892,-74.0445"},
    ),
    DocumentInfo(
        id="t4",
        text="The refund will be processed within 3 to 5 business days to your original payment method.",
        metadata={"speaker": "agent", "topic": "refund", "priority": "4", "location": "40.7580,-73.9855"},
    ),
    DocumentInfo(
        id="t5",
        text="Can you also tell me what is included in the Business plan upgrade?",
        metadata={"speaker": "customer", "topic": "upgrade", "priority": "2", "location": "40.6892,-74.0445"},
    ),
    DocumentInfo(
        id="t6",
        text="The Business plan includes 1TB storage, priority support, and team collaboration at $79.99 per month.",
        metadata={"speaker": "agent", "topic": "upgrade", "priority": "2", "location": "40.7580,-73.9855"},
    ),
    DocumentInfo(
        id="t7",
        text="That sounds good, I would like to upgrade my plan right now.",
        metadata={"speaker": "customer", "topic": "upgrade", "priority": "3", "location": "40.6892,-74.0445"},
    ),
    DocumentInfo(
        id="t8",
        text="I have processed the plan upgrade and sent a confirmation email to your address.",
        metadata={"speaker": "agent", "topic": "upgrade", "priority": "3", "location": "40.7580,-73.9855"},
    ),
]


async def main() -> None:
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")

    if not project_id or not project_key:
        print("Please set MOSS_PROJECT_ID and MOSS_PROJECT_KEY in samples/.env")
        print("Copy samples/.env.template to samples/.env and fill in your credentials.")
        return

    client = MossClient(project_id, project_key)
    call_id = f"filter-sample-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    print(f"\n--- Session: {call_id} ---\n")

    # -- Open session and index the transcript ---------------------------------
    t = time.perf_counter()
    session = await client.session(index_name=call_id)
    await session.add_docs(TRANSCRIPT)
    print(f"Session ready: {session.doc_count} turns indexed  [{_ms(t)}]\n")

    # -- 1. $eq: customer turns only ------------------------------------------
    print("1. $eq  — customer turns only")
    t = time.perf_counter()
    results = await session.query(
        "what did the customer say",
        QueryOptions(top_k=5, filter={"field": "speaker", "condition": {"$eq": "customer"}}),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  {doc.text[:70]}...")

    # -- 2. $ne: exclude agent turns ------------------------------------------
    print("\n2. $ne  — exclude agent turns")
    t = time.perf_counter()
    results = await session.query(
        "what was discussed",
        QueryOptions(top_k=5, filter={"field": "speaker", "condition": {"$ne": "agent"}}),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  speaker={doc.metadata['speaker']}  {doc.text[:60]}...")

    # -- 3. $gt: high-priority turns ------------------------------------------
    print("\n3. $gt  — priority > 3")
    t = time.perf_counter()
    results = await session.query(
        "urgent issues",
        QueryOptions(top_k=5, filter={"field": "priority", "condition": {"$gt": "3"}}),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  priority={doc.metadata['priority']}  {doc.text[:60]}...")

    # -- 4. $in: billing or refund turns --------------------------------------
    print("\n4. $in  — topic in [billing, refund]")
    t = time.perf_counter()
    results = await session.query(
        "payment and charges",
        QueryOptions(top_k=5, filter={"field": "topic", "condition": {"$in": ["billing", "refund"]}}),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  topic={doc.metadata['topic']}  {doc.text[:60]}...")

    # -- 5. $and: agent turns about billing -----------------------------------
    print("\n5. $and  — agent + billing")
    t = time.perf_counter()
    results = await session.query(
        "billing explanation",
        QueryOptions(
            top_k=5,
            filter={"$and": [
                {"field": "speaker", "condition": {"$eq": "agent"}},
                {"field": "topic",   "condition": {"$eq": "billing"}},
            ]},
        ),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  {doc.text[:70]}...")

    # -- 6. $or: refund or upgrade topics -------------------------------------
    print("\n6. $or  — refund or upgrade")
    t = time.perf_counter()
    results = await session.query(
        "account changes",
        QueryOptions(
            top_k=5,
            filter={"$or": [
                {"field": "topic", "condition": {"$eq": "refund"}},
                {"field": "topic", "condition": {"$eq": "upgrade"}},
            ]},
        ),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  topic={doc.metadata['topic']}  {doc.text[:60]}...")

    # -- 7. $near: turns from the Times Square office (within 1km) ------------
    print("\n7. $near  — within 1km of Times Square (agent location)")
    t = time.perf_counter()
    results = await session.query(
        "agent response",
        QueryOptions(
            top_k=5,
            filter={"field": "location", "condition": {"$near": "40.7580,-73.9855,1000"}},
        ),
    )
    print(f"   [{_ms(t)}]  {len(results.docs)} result(s)")
    for doc in results.docs:
        print(f"   [{doc.id}] score={doc.score:.3f}  speaker={doc.metadata['speaker']}  {doc.text[:60]}...")

    # -- Push session index to cloud ------------------------------------------
    print(f"\nPushing session index to cloud as {call_id!r}...")
    t = time.perf_counter()
    push_result = await session.push_index()
    print(f"  job_id:    {push_result.job_id}  [{_ms(t)}]")
    print(f"  index:     {push_result.index_name}")
    print(f"  doc_count: {push_result.doc_count}")
    print(f"  status:    {push_result.status}")
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
````

## sdks/python/sdk/CHANGELOG.md (first 150 lines)

`````markdown
# Changelog

## [Unreleased]

## [1.21.0] - 2026-10-23

### Added

- `create` takes `tools`, `tool_choice` and `parallel_tool_calls` as typed arguments, sent only when given.
- Tool calls keep every field the model sends, such as Gemini's `extra_content` with its thought signature. `raw` on `ChoiceDeltaToolCall` and `ChatCompletionMessageToolCall` holds them, and a reply message put back into `messages` sends them unchanged.
- `moss.inference.McpServer` puts an MCP server in `tools`, and Moss runs its tools during the reply. Neither its `server_url` nor its `headers` show in a repr.
- `ChatCompletionChunk.tool_step` and `ChatCompletion.tool_steps` hold each MCP tool call and result as a `ToolStep`.
- `ChatCompletionStream.get_final_completion()` returns the whole reply as one `ChatCompletion`, joined from every chunk of the stream, the ones already read included.
- Once a call has streamed a tool step, any error it raises has the code `failed_after_tool_call`, since a tool may have changed data.
- `max_retries`, 2 by default, on `MossInference` or for one call of `create`, sends a call again when it fails before its reply starts: a connection failure, or a `408`, `409`, `429` or `5xx` response, unless its `x-should-retry` header says otherwise. The wait is the `Retry-After` in seconds when it is 60 or less, else 0.5 s doubled for each retry up to 8 s, and it counts against `timeout`. A stream that fails after it started is never retried.
- `create(cache=False)` always asks the model, never Moss's reply cache.
- `request_id` on `ChatCompletionStream` and `ChatCompletion` holds the `X-Moss-Request-Id` of the reply, or `None`.
- `logprobs` on each choice of a chunk and of a `ChatCompletion`, as a `ChoiceLogprobs`. A joined choice's `content` and `refusal` lists are those of its chunks, in order. `CompletionUsage` has `completion_tokens_details` and `prompt_tokens_details`.

### Changed

- `load_indexes` runs up to eight loads at once instead of one after another, so many indexes load in about the time of the slowest few. A name listed twice loads once.
- `load_index` on an index that is already loaded checks the cloud version first. An unchanged copy stays loaded with no download or parse, and a changed one is swapped in without interrupting queries. Either way the call's `auto_refresh` and polling options replace the current ones.
- Auto-refresh polls a loaded index first at a random point of its first interval, then every interval give or take 10%, so indexes loaded together no longer poll together.
- On Linux with glibc, `unload_index`, `unload_indexes`, `close`, each refresh or reload that installs a newer version, and a `SessionIndex` that swaps in a refreshed version or is deleted hand the freed memory back to the operating system, so a long-running process shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`, and each refresh left the replaced version resident.

### Fixed

- `indexes=[]` searches no index. Leaving `indexes` out still searches every index of the project.
- Tool call pieces with no `index` no longer merge parallel calls into one. A piece joins the call with its `id`. A new `id` starts the next call, unless the latest call has no id yet and takes it. A piece with no `id` joins the latest call.
- A joined reply message always has `content`: its text, else `None` when it has tool calls and `""` when it has none. Put back into `messages`, it keeps that `content`.

## [1.20.0] - 2026-10-22

### Added

- `MossInference(project_id, project_key)` answers chat messages with facts from your Moss indexes. `await client.chat.completions.create(...)` takes the arguments of OpenAI's `chat.completions.create` plus `indexes` and `retrieve`, and returns a `ChatCompletionStream` of `ChatCompletionChunk` with `stream=True`, else one `ChatCompletion`, with OpenAI's field names. `model` is `"moss"` by default. `api_key`, on the client or for one call of `create`, is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. The client also takes `timeout` for a whole call, `idle_timeout` for each wait for data or a free connection (120 seconds by default or when `None`), and `default_headers`. A timeout of 0 or less is off. `create` can change the key and both timeouts for one call, and `None` there keeps the client's. The client checks its arguments when built, keeps one connection pool, and closes it with `close()` or `async with`. Failures raise `moss.inference.InferenceError` with `status`, `type` and `message`, and, once the service has answered, its `request_id`, error `code` and `retry_after` in seconds. A redirect is one of those failures, so credentials never reach another URL. Calls go to `https://inference.moss.dev/v1`, or to the base URL in `MOSS_INFERENCE_URL`, which a client reads when built. `moss.inference.chat.completions.create` makes the same call on a client built from `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` and `MOSS_INFERENCE_URL`.

### Changed

- Requires `httpx`, which `moss.inference` streams replies with, along with `h11` 0.16 or later and `anyio` 4.14.2 or later, the first releases of each without published advisories.
- Requires `inferedge-moss-core` 0.34.0. Every native object shares one process-wide async runtime instead of starting its own 18 threads, so a process keeps the same few threads however many clients and sessions it opens. `MOSS_TOKIO_WORKER_THREADS` sets its worker count, by default the number of CPU cores, at least 2 and at most 4, and a forked child builds its own. The background flush a dropped object starts runs to the end.
- A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.

## [1.19.0] - 2026-10-20

### Added

- The package metadata declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, so PyPI and license scanners show it.
- The `inferedge-moss-core` wheels carry `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code the extension links: the Rust crates of that target, ONNX Runtime and the components it includes, and the Rust standard library.
- `SessionIndex.save_to_disk` and `load_from_disk` take `cache_path` as optional. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A directory you pass is used as before.

### Changed

- Requires `inferedge-moss-core` 0.33.0.
- The custom embeddings section of the README says to L2-normalize the vectors you provide. Thanks @VeshRaazThapa (usemoss/moss#529).
- `inferedge-moss-core`, the native runtime of `moss`, is not supported for direct use, and its `moss_core` module no longer exports `Index`. Import every Moss type from `moss`. No change to the `moss` API.
- `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
- `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.

### Fixed

- Deleting a `MossClient` or `SessionIndex` waits at most 100 ms for a DNS lookup still in progress. It used to hold the GIL until DNS gave up.

## [1.18.0] - 2026-10-14

### Added

- `MossClient.create_index`, `MossClient.add_docs` and `SessionIndex.add_docs` take documents as dicts (or any `collections.abc.Mapping`), JSON array or JSON Lines text, or `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file paths, as well as `DocumentInfo` objects. Text and markdown files are chunked natively into documents `{path}#{n}` with metadata `parentId`. A word longer than `chunk_size` (1200 by default), such as a long URL or a run of text without spaces, is split into `chunk_size` pieces, so no text is dropped. Markdown front matter (a first `---` line through the next `---` or `...` line) is not indexed.
- A keyword-only `chunker` argument on the same methods splits every document's text with your own function. Pass `chunker` or `chunking`, not both: using both raises `TypeError`. Neither can be used with `model_id="custom"`.
- `moss.Chunking` and a keyword-only `chunking` argument on the same methods tune the native chunker within the embedding model's limits, with the names and limits of `ParseOptions`: `chunk_size` 200 to 2000 characters (default 1200), `chunk_overlap` 0 to half of `chunk_size` (default 200, capped at half of `chunk_size`), `mode` `"pages"` or `"sentences"`, and `markdown_header_depth` 1 to 6. With `chunking`, `DocumentInfo`, dict and JSON input is chunked too, not only text and markdown files. Out-of-range values raise `InvalidArgumentError` with `ParseOptions`-style messages, such as `Unsupported chunk_size 100. Supported: 200 to 2000`. Chunks from a user `chunker` longer than 2,000 characters raise `InvalidArgumentError`.
- `moss.DocsInput`, `moss.Chunker` and `moss.Chunking` are new exports.

### Changed

- Requires `inferedge-moss-core` 0.32.0, which adds `moss_core.parse_documents_json` and `moss_core.to_document_infos`.

### Fixed

- The type stub declares `MossClient.create_index_from_files`, `ParseFileInput` and `ParseOptions`, and its `__all__` lists them and `ParentGrouping`. It also declares `SearchResult.model_id`, `IndexStatus.value` and the `JobPhase.CRAWLING` and `JobPhase.PARSING_DOCUMENTS` phases, types `create_index(..., wait=flag)` for a `bool` flag, and declares fields that are read-only at runtime, such as `MutationResult.job_id` and `SessionIndex.name`, as read-only properties. The `LoadIndexesResult` arguments no longer accept `None`, which the core refuses. No runtime change.
- The type stub marks the classes of the native core, such as `DocumentInfo` and `QueryOptions`, final, since Python cannot subclass them, and declares their constructors with `__new__`, as the core defines them. No runtime change.

## [1.17.0] - 2026-10-14

### Added

- `ParseOptions.chunk_size` (200 to 2000 characters, default 1200) and `ParseOptions.chunk_overlap` (0 to half of `chunk_size`, default 200 capped at half of `chunk_size`) control how the parse pipeline splits extracted text. Out-of-range values raise `InvalidArgumentError` before any upload.

### Changed

- Requires `inferedge-moss-core` 0.31.0.

## [1.16.1] - 2026-10-13

### Changed

- Requires `inferedge-moss-core` 0.30.1.

### Fixed

- `MossClient.query`, `query_multi_index`, `unload_index`, `unload_indexes` and `was_served_stale` release the GIL while they run, so the event loop keeps running other tasks during a query or while an unload waits for one.

## [1.16.0] - 2026-10-12

### Added

- `SessionIndex.save_to_disk(cache_path)` and `SessionIndex.load_from_disk(cache_path, *, rebuild_legacy=True)` save a session to disk and restore it. `save_to_disk` writes the session under `<cache_path>/<name>/`, and a failed or interrupted save leaves the last saved snapshot loadable. `load_from_disk` restores it into a session with the same name and returns the number of documents loaded, and the session takes the snapshot's model. A session that already loaded the same model keeps it instead of loading it again. A missing or damaged snapshot raises `MossError` with code `DESERIALIZATION` and leaves the session as it was. A snapshot that an older core saved for a built-in model has no model artifact identity: by default `load_from_disk` rebuilds it for a session opened with the same model, re-embedding the stored documents and saving the snapshot back in the same call, which needs the cloud for the model. When the model cannot be loaded it raises `MossError` with code `MODEL_UNAVAILABLE` and changes nothing. `rebuild_legacy=False` loads such a snapshot as a custom-model session. Code that calls `load_from_disk` on the private `SessionIndex._inner` gets no rebuild unless it passes `rebuild_legacy=True`; the public method rebuilds by default.
- `MossClient.session(name, auto_load_on_init=False)` opens the session without loading the cloud index of that name. The session starts empty with the given model, so `load_from_disk` restores a saved session with no index download. A `push_index` before any load replaces the cloud index with the session's documents.
- `SessionIndex.model_id`, the embedding model the session uses, or `"custom"`. A load moves the session to the loaded model, and `add_docs` and `query` read it on every call. Reading it never waits for a call in progress, and it still reads after `close()`.

### Changed

- Requires `inferedge-moss-core` 0.30.0.
- `SessionIndex.add_docs` and `delete_docs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
- **Behavior change:** `SessionIndex.add_docs` checks every document of a call first, so a call with a vector whose length differs from the session's vectors raises `InvalidArgumentError` and adds nothing.
- `SessionIndex` keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
- The token cache keeps a token until 60 seconds before it expires or for 90% of its life, whichever is later, so short-lived tokens are cached too.
- A 401 drops only the token it rejected from the cache, and a refused telemetry request keeps the token.
- A project key session fetches one token for its requests and its telemetry.

### Fixed

- `MossClient.session` moves the session to the model of an existing cloud index that has no documents, as it does for one with documents. Without `model_id`, a session on an empty custom-model index opens and takes embeddings instead of raising `InvalidArgumentError` while it warms the default model, and an explicit `model_id` the index does not use raises `ValueError`.
- When `MossClient.session` raises, it closes the session it opened, so the session's final telemetry is sent and its native memory freed then, not at `MossClient.close`.

## [1.15.1] - 2026-10-06

### Fixed

- `SessionIndex.push_index()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `create_index`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Requires `inferedge-moss-core` 0.28.1.

## [1.15.0] - 2026-10-05

### Added

- `MossClient.close()` and `SessionIndex.close()`, and both work as `with` and `async with` context managers. `close()` sends the final usage telemetry, waiting until it is delivered or 2 seconds pass, and frees the native memory; `MossClient.close()` also closes the sessions the client opened. Afterwards every `MossClient` method raises `RuntimeError("MossClient is closed")` and every `SessionIndex` method but `name` raises `InvalidArgumentError`. Requires `inferedge-moss-core` 0.27.0.
- `moss.MossError`, a `RuntimeError` subclass raised for every failure the native core reports. `code` is a stable string to branch on: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. `moss.InvalidArgumentError` is the `INVALID_ARGUMENT` subclass and is also a `ValueError`. `detail` holds the core error text in released wheels too: diagnostic text for logs and support, at most 512 bytes, and not a stable contract. Requires `inferedge-moss-core` 0.27.0.
- `LoadIndexesResult.failed_codes` maps each index that `load_indexes` could not load to its code, such as `"NOT_FOUND"`. Requires `inferedge-moss-core` 0.27.0.

### Changed

- `MossError.detail` carries no request URL for a cloud or model download error: a cloud timeout, retry or response parse failure names the operation, such as `get_index_info`, and a model download names only the host. Cache, repair, snapshot and `MOSS_CA_BUNDLE` errors name the file, not its absolute path. Parser text from `.moss` payloads and from release and manifest files goes to the debug log, and ONNX Runtime and tokenizer failures give fixed text. A failed response contributes only its HTTP status and the error code its body names, such as `HTTP 403 Forbidden: AccessDenied` from the object store or `HTTP 409 Conflict: INDEX_EXISTS` from the Moss service, never the rest of the body. A `.moss` payload whose JSON does not parse, or whose document count does not match its header, gives the detail `index payload is malformed`; header and length errors keep their own short text, such as `binary data truncated`. A lock left unusable by an earlier panic raises `MossError` with code `INTERNAL` and the detail `internal state is unavailable after an earlier failure`, also when an embedding model load hits it.
- `MossError.detail` names a numbered fault for a damaged on-device vector file or session snapshot, such as `fault 1028` for a vector count that differs from the snapshot metadata, and no longer describes the file layout or the snapshot files.
- **Behavior change:** error messages from the native core are fixed text per kind of failure, such as `Index not found.` or `The Moss service could not be reached.`, and no longer carry URLs, file paths or index names. Code that matched on message text should branch on `MossError.code`. A failed `load_index` or `unload_index` now raises the core's `MossError` directly instead of wrapping it in a `RuntimeError` that names the index. A text query on an index that cannot embed it (a custom-embedding index, or a foundation index without an artifact identity) raises `InvalidArgumentError`, still a `ValueError`, with the core's message. The reasons in `load_indexes().failed` are the same fixed messages. `query` on an index that is not loaded raises `MossError` with code `NOT_FOUND`, still a `RuntimeError`, and its message still names the load call.
- **Behavior change:** only `INVALID_ARGUMENT` failures are still a `ValueError`. These session failures were `ValueError` and are now a `MossError` (a `RuntimeError`) with the code shown: a rejected project key when opening a session (`UNAUTHORIZED`), a service or network failure when opening one (`NETWORK` or another cloud code), a model that cannot be downloaded or loaded during `add_docs` or `query` with text (`MODEL_UNAVAILABLE`), and an embedding failure during those calls (`INTERNAL`). Code that catches `ValueError` around these calls should catch `MossError` as well.
- Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change. Requires `inferedge-moss-core` 0.27.0.
- `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7. Requires `inferedge-moss-core` 0.27.0.
- **Behavior change:** a malformed `$near` filter value is rejected with a `ValueError` naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
- **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. Sorting `get_docs` by a field (`sort_by`) and assembling a `ParentGrouping` by `order_field` put decimals first in numeric order, zero padded ones included, so `"099"` sorts before `"100"`, then every other value in text order, forms such as `"1e3"` or `"NaN"` included. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
- Filter validation and ordering come from `inferedge-moss-core` 0.27.0.
`````

## sdks/javascript/sdk/README.md (verbatim)

`````markdown
# Moss client library for JavaScript


`@moss-js/moss` enables **private, on-device semantic search** in your web, mobile, and edge applications - without cloud dependencies.

Built for developers who want **instant, memory-efficient, privacy-first AI features** inside their apps.

## ✨ Features

- ⚡ **On-Device Vector Search** - Sub-millisecond retrieval with zero network latency
- 🔍 **Semantic Search & Hybrid Search** - Beyond keyword matching
- 📦 **Multi-Index Support** - Manage multiple isolated search spaces
- 🛠️ **Tiny SDK** - Optimized for edge deployments
- 🛡️ **Privacy-First by Design** - No server-side cloud calls required to perform searches

## 📦 Installation

```bash
npm install @moss-js/moss
```

## 🚀 Quick Start

```typescript
import { MossClient, DocumentInfo } from "@moss-js/moss";

async function main() {
  // Initialize search client with project credentials
  const mossClient = new MossClient(
    "your-project-id",
    "your-project-key"
  );

  // Prepare documents to index
  const documents: DocumentInfo[] = [
    {
      id: "doc1",
      text: "How do I track my order? You can track your order by logging into your account.",
    },
    {
      id: "doc2", 
      text: "What is your return policy? We offer a 30-day return policy for most items.",
    },
    {
      id: "doc3",
      text: "How can I change my shipping address? Contact our customer service team.",
    },
    // Add more documents here
    // .
    // .
    // .
  ];

  try {
    // Create an index with documents and model
    const indexName = "faqs";
    const created = await mossClient.createIndex(
      indexName,
      documents
    ); // Defaults to the service's `moss-minilm` model when omitted
    console.log("Index created:", created);

    // Load the index before searching
    await mossClient.loadIndex(indexName);

    // Search the index
    const result = await mossClient.query(indexName, "How do I return a damaged product?", {
      topK: 3,
    });

    // Display results
    console.log(`Query: ${result.query}`);
    result.docs.forEach((match) => {
      console.log(`Score: ${match.score.toFixed(4)}`);
      console.log(`ID: ${match.id}`);
      console.log(`Text: ${match.text}`);
      console.log("---");
    });
  } finally {
    // Release the client's underlying resources once you're done with it
    await mossClient.close();
  }
}

main().catch(console.error);
```

To use a host-managed stable id for MAD billing while retaining Moss's own
device UUID for correlation:

```typescript
const mossClient = new MossClient("project", "key", {
  identity: { deviceId: "host-installation-id", userId: "optional-user-id" },
});
```

`deviceId` is billable. `userId` is optional and non-billable. Telemetry also
includes Moss's file-backed UUID as `mossDeviceId`; without a host id, both
device fields contain that Moss UUID.

## Telemetry

The SDK always sends usage telemetry to the Moss cloud, and there is no option
to turn it off. It sends event types, your project id, index names, query and
document counts, query latencies, SDK and model versions, and a device id: a
random UUID stored on the device, or the `identity.deviceId` you supply, plus
`identity.userId` when you set one. Telemetry never includes query text,
document text, metadata, embeddings or file paths. Document text and embeddings
leave the device only when you create, add to or push an index in the cloud.

See [Telemetry](https://docs.moss.dev/docs/reference/telemetry) for every field and when it is sent.

## Resource cleanup

`MossClient` and sessions returned by `client.session(...)` hold native resources that must be released explicitly. Call `close()` on each one when you are done with it, in a `finally` block or equivalent. `close()` is idempotent, so it is safe to call more than once.

`client.close()` also closes every live session created from that client. Closing a session individually first is fine; `close()` is idempotent on both.

On Node 24 and later, both `MossClient` and sessions implement `Symbol.asyncDispose`, so you can use `await using` instead of a manual `try/finally`:

```typescript
await using mossClient = new MossClient("your-project-id", "your-project-key");
// mossClient.close() is called automatically when it goes out of scope
```

## 🔥 Example Use Cases

- Smart knowledge base search
- Realtime Voice AI agents
- Personal note-taking search
- Private in-app AI features (recommendations, retrieval)
- Local semantic search in edge devices, AR/VR, mobile apps

## 🧠 Providing custom embeddings

Already using your own embedding model? Supply vectors directly when managing indexes:

```typescript
const documents = [
  {
    id: "doc-1",
    text: "Attach a caller-provided embedding",
    embedding: myEmbeddingModel("doc-1"),
  },
  {
    id: "doc-2",
    text: "Fallback to the built-in model when the field is omitted.",
  },
];

await mossClient.createIndex("custom-embeddings", documents);

await mossClient.loadIndex("custom-embeddings");

const results = await mossClient.query("custom-embeddings", "", {
  embedding: myEmbeddingModel("query"),
  topK: 10,
});
```

Leaving `modelId` undefined defaults to `moss-minilm`. You can still pass `{ modelId: "moss-mediumlm" }` or another supported identifier if you want the service to generate embeddings for documents without the optional `embedding` field.

> **Normalize your vectors.** Moss does not normalize caller-provided embeddings, so
> rankings match cosine similarity only when document and query vectors are unit
> length (L2-normalized). Hosted embedding APIs such as OpenAI return normalized
> vectors already; local models often do not. Un-normalized vectors still return
> results, but the order can differ from what you would compute with cosine similarity.

### Foundation model identity

Moss generates local query embeddings for a foundation-model index only when
the service supplies the exact immutable model artifact identity used to build
that index. This prevents a query from being embedded with different model
bytes than the stored document vectors.

Fresh local sessions using `moss-minilm`, `moss-mediumlm`, or `moss-litelm`
bind that model's official current artifact automatically before model warmup.
Caller-supplied artifact identities are validated and kept, while custom models
are never auto-bound. `saveToDisk` records the exact model id, artifact version,
and manifest SHA-256, so the same session can be restored and queried with raw
text:

```typescript
const first = await mossClient.session("memory");
await first.addDocs([{ id: "refund", text: "Customer requested a refund" }]);
await first.saveToDisk(cachePath);
await first.close();

const restored = await mossClient.session("memory");
await restored.loadFromDisk(cachePath);
const results = await restored.query("refund");
```

Without `cachePath`, `saveToDisk()` and `loadFromDisk()` use `sessions/<project id>/`
under the first of these that is set:

1. the client's `cachePath` option (`new MossClient(id, key, { cachePath })`)
2. the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots
   read: the index cache and the model cache ignore it
3. `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
   `%LOCALAPPDATA%\moss` on Windows

A relative `cachePath` resolves against the current working directory, and `~` is not expanded.

Session caches created by older SDKs without an artifact version and manifest
SHA-256 load as `custom` sessions through the legacy fail-closed path. Their raw
text queries require an explicit caller-generated embedding. Rebuild those
caches from their source documents with the current SDK, then save them again
so the automatically bound foundation identity is persisted.

Older indexes without that identity still load and remain queryable, but the
query must include a caller-generated vector of the correct dimension:

```typescript
const results = await mossClient.query("legacy-index", "search text", {
  embedding: myEmbeddingModel("search text"),
  topK: 10,
});
```

If the vector is omitted, the query fails closed with an error stating that an
explicit query embedding is required. Moss does not silently fall back to an
unverified local model or send the query to the cloud.

## Offline-tolerant load

With a `cachePath` set and a snapshot already on disk, a `loadIndex` whose cloud
metadata check fails on a transport error (unreachable network, timeout) serves
the cached snapshot instead of failing, and starts a refresh poller so the index
catches up when the cloud returns. A real "index not found" (404) still fails,
so a deleted index does not come back from cache.

A load served this way opens the index, but a built-in embedding model cannot be
opened until the Moss cloud is reachable, so text queries with `alpha` above 0
fail until then. Keyword-only queries (`alpha: 0`) and queries that pass their
own embedding keep working.

```typescript
await mossClient.loadIndex("my-docs", { cachePath: "/var/cache/moss" });
```

## Multi-index search

Search several loaded indexes in one call and get the global top-k back, with
each result tagged by its source `indexName`. All indexes must be loaded
locally and share the same embedding model.

```typescript
const { loaded, failed } = await mossClient.loadIndexes(["products", "reviews"]);
if (loaded.length === 0) {
  throw new Error(`No indexes loaded: ${JSON.stringify(failed)}`);
}

const results = await mossClient.queryMultiIndex(
  loaded,
  "noise cancelling headphones",
  { topK: 5, alpha: 0.5 },
);
for (const doc of results.docs) {
  console.log(`[${doc.indexName}] ${doc.id}: ${doc.text} (score: ${doc.score.toFixed(3)})`);
}

await mossClient.unloadIndexes(loaded);
```

`alpha` works exactly as in `query` (default 0.8): `1.0` is embedding-only,
`0.0` is keyword-only, and anything in between blends both with Reciprocal
Rank Fusion. Keyword scoring runs each index's own BM25 and merges each index's
raw hits before fusion; because BM25 statistics stay per-corpus, cross-index
keyword ranking is approximate. `topK` (default 10) caps the merged result, not
each index, and `filter` applies to every index. `loadIndexes` is best-effort:
names that fail are reported in `failed` without rolling back the ones that
loaded.

## Web sources

POST the existing `/v1/manage` web-source actions and return typed results.
Poll `jobId` with `getJobStatus`. Set `MOSS_CLOUD_API_BASE_URL` to send manage calls
to a non-default host (defaults to `https://service.usemoss.dev`).

```typescript
const created = await mossClient.createWebSource(
  "https://docs.example.com",
  "knowledge-base",
  { maxPages: 200, refreshCadence: "weekly" },
);
await mossClient.getJobStatus(created.jobId);

const sources = await mossClient.listWebSources("knowledge-base");
const source = await mossClient.getWebSource(created.id);
const updated = await mossClient.updateWebSource(created.id, {
  refreshCadence: "daily",
});
// updated.jobId is set when resync: true enqueued a crawl.
const resync = await mossClient.resyncWebSource(created.id);
const deleted = await mossClient.deleteWebSource(created.id);
// deleted.purgeJobId is set when a purge was enqueued.
```

## Metadata filtering

You can pass a metadata filter in `query` options after loading an index locally:

```typescript
const results = await mossClient.query("my-docs", "running shoes", {
  topK: 5,
  alpha: 0.6,
  filter: {
    $and: [
      { field: "category", condition: { $eq: "shoes" } },
      { field: "price", condition: { $lt: "100" } },
    ],
  },
});
```

## Inference

`MossInference` answers OpenAI's `chat.completions.create`, with the same
arguments and return shapes, through the Moss inference gateway. The gateway
searches the `indexes` you pass and adds what it finds to the prompt, so code
written for OpenAI swaps its client for `MossInference` and adds `indexes`.

```typescript
import { MossInference } from "@moss-js/moss";

const client = new MossInference("your-project-id", "your-project-key");

const stream = await client.chat.completions.create({
  messages: [{ role: "user", content: "Do you ship to Canada?" }],
  indexes: ["faq"],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta.content ?? "");
}
```

`model` is optional and defaults to `"moss"`, Moss's own model. Without
`stream: true` the call reads the whole stream and returns one completion:

```typescript
const completion = await client.chat.completions.create(
  {
    messages: [{ role: "user", content: "Do you ship to Canada?" }],
    indexes: ["faq"],
  },
  { timeout: 30_000 },
);
console.log(completion.choices[0].message.content);
```

With `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` set,
`inference.chat.completions.create(...)` takes the same arguments without a client.

`apiKey` is optional: your own OpenAI, Anthropic or Google key, for a vendor
model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one
is refused. Set it on the client, or pass it with one call, where it wins over
the client's:

```typescript
const keyed = new MossInference("your-project-id", "your-project-key", {
  apiKey: "your-openai-key",
});
const reply = await keyed.chat.completions.create(
  { model: "gpt-4o-mini", messages: [{ role: "user", content: "Hi" }] },
  { apiKey: "your-other-openai-key" },
);
```

The other client options are `timeout` for each whole call (no limit by
default), `idleTimeout` for the longest wait for response headers or for more of
the body (120 000 ms by default, `null` for none), `maxRetries` and `headers`.
Node's built-in `fetch` also ends a silence of 300 000 ms, unless its global
dispatcher allows more. Each call takes `apiKey`, `signal`, `timeout`,
`idleTimeout`, `maxRetries` and `headers`, which replace or add to the client's
for that call. Neither `headers` can set `Host`, `Content-Length` or
`Transfer-Encoding`.

`maxRetries` (2 by default, `0` for none) sends a call again when the connection
fails, or when the gateway answers 408, 409, 429 or 5xx before the stream
starts, after a `Retry-After` of up to 60 s, else a backoff of 0.5 s doubling
up to 8 s, within `timeout`. `retrieve: false` or `indexes: []` skips the
search, and leaving `indexes` out searches every index. Moss can answer an
identical request from its reply cache; `cache: false` always asks the model.
`stream.requestId` and a completion's `requestId`, which `JSON.stringify` leaves
out, hold the response's `X-Moss-Request-Id`.

To call another gateway, set `MOSS_INFERENCE_URL` to
its base URL, up to and including `/v1`, before you build the client. A
`baseURL` or `baseUrl` option, on the client or a call, is an error.

Leaving the `for await` loop early, or calling `stream.controller.abort()`,
closes the connection, stops the model and ends the loop quietly. An abort with
any other reason, such as the `TimeoutError` of `AbortSignal.timeout()`, throws
that reason. Without `stream: true`, an abort rejects with the signal's reason,
an `AbortError` for a plain `abort()`. Every other failure throws
`InferenceError` with `status`, `type` and a Moss `code` that `isMossError`
accepts, including an error the model reports mid-stream, a stream that ends
early (`incomplete_stream`), a broken connection (`connection_error`) and a
timeout (`timeout`). It also carries the gateway's `errorCode`, the response's
`requestId` and, for a `429` or another error that sends `Retry-After`,
`retryAfter` in milliseconds. The client does not follow redirects.

### Tool calls

`tools`, `tool_choice` and `parallel_tool_calls` are sent as given. Each tool
call keeps every field the model sent, such as Gemini's `extra_content` with the
thought signature Gemini 3 needs back. After streaming the text,
`finalChatCompletion()` joins the stream into the reply. Push its message into
`messages` unchanged, add one `tool` message per call, and call again:

```typescript
import type { ChatCompletionMessageParam } from "@moss-js/moss";

const messages: ChatCompletionMessageParam[] = [
  { role: "user", content: "Is the EQB jacket in stock?" },
];
const tools = [
  {
    type: "function" as const,
    function: {
      name: "check_stock",
      parameters: { type: "object", properties: { sku: { type: "string" } } },
    },
  },
];
const stream = await client.chat.completions.create({ messages, tools, stream: true });
for await (const chunk of stream) process.stdout.write(chunk.choices[0]?.delta.content ?? "");
const { message } = (await stream.finalChatCompletion()).choices[0];
messages.push(message);
for (const call of message.tool_calls ?? []) {
  const { sku } = JSON.parse(call.function.arguments);
  messages.push({ role: "tool", tool_call_id: call.id, content: await checkStock(sku) });
}
const answer = await client.chat.completions.create({ messages, tools });
```

### MCP servers

An `McpServer` entry in `tools` lets the gateway call that server's tools for
the model and stream the final answer.

```typescript
import type { ChatCompletionMessageParam, McpServer } from "@moss-js/moss";

const crm: McpServer = {
  type: "mcp",
  server_label: "crm",
  server_url: "https://mcp.example.com/mcp",
  headers: { Authorization: "Bearer your-crm-token" },
};
const messages: ChatCompletionMessageParam[] = [{ role: "user", content: "Where is order A1?" }];
const stream = await client.chat.completions.create({ messages, tools: [crm], stream: true });
for await (const chunk of stream) {
  const step = chunk.moss_tool_step;
  if (step) console.log(step.type, step.server_label, step.name, step.output ?? "");
  else process.stdout.write(chunk.choices[0]?.delta.content ?? "");
}
const { moss_tool_steps } = await stream.finalChatCompletion();
console.log(moss_tool_steps?.map((step) => `${step.type} ${step.name}`));
```

Before and after each tool call the stream carries a chunk with an empty delta
and a `moss_tool_step`: `call` with the `arguments`, then `result` with
`is_error`, `duration_ms` and `output`. A completion lists them in
`moss_tool_steps`. A turn with tools can run for a few minutes.

| `status` | `type` | `errorCode` | When |
| --- | --- | --- | --- |
| 403 | `permission_error` | `mcp_not_enabled` | MCP is switched off on the gateway |
| 429 | `capacity` | `mcp_loops_busy` | The gateway is busy; retry after `retryAfter` |
| 400, 424 | `mcp_error` | `mcp_server_error` | The URL was refused, or the server failed |
| 400 | `invalid_request_error` | (none) | A bad `tools` entry, or a label or tool name used twice |

After a tool step every failure has `errorCode` `failed_after_tool_call`, and
the SDK never retries. Nor does it retry any stream that fails after it started.
The tool may have changed data, and so may a call you abort or time out after a
step, so do not replay such a call blindly.

## 📄 License

This package is licensed under the [PolyForm Shield License 1.0.0](./LICENSE.txt).

- ✅ Free for any use, including production and commercial use.
- ❌ Not permitted: providing a product that competes with Moss.
- 📩 For commercial licenses, contact: <contact@inferedge.dev>

## 📬 Contact

For support, commercial licensing, or partnership inquiries, contact us: [contact@inferedge.dev](mailto:contact@inferedge.dev)
`````

## sdks/javascript/sdk/samples/cached-loading.ts

````ts
/**
 * Moss SDK - Cached Index Loading Sample
 *
 * Demonstrates using the `cachePath` option to persist downloaded indexes to disk.
 * On the first run, the index is fetched from the cloud and saved locally.
 * On subsequent runs, the index loads instantly from the local cache.
 *
 * You can also combine caching with auto-refresh for long-running processes:
 *   await client.loadIndex(indexName, {
 *     cachePath: CACHE_DIR,
 *     autoRefresh: true,
 *     pollingIntervalInSeconds: 60,
 *   });
 *
 * Required Environment Variables:
 * - MOSS_TEST_PROJECT_ID: Your Moss project ID
 * - MOSS_TEST_PROJECT_KEY: Your Moss project key
 *
 * @example
 * ```bash
 * npx tsx cached-loading.ts
 * ```
 */

import { MossClient } from "../src";
import { performance } from "node:perf_hooks";
import { config } from "dotenv";

config();

const CACHE_DIR = "./.moss-cache";

async function cachedLoadSample(): Promise<void> {
  console.log("Moss SDK - Cached Index Loading Sample");
  console.log("=".repeat(45));

  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;
  const indexName = process.env.MOSS_INDEX_NAME;
  if (!projectId || !projectKey || !indexName) {
    console.error(
      "Error: Please set MOSS_TEST_PROJECT_ID, MOSS_TEST_PROJECT_KEY, and MOSS_INDEX_NAME in .env"
    );
    return;
  }

  const client = new MossClient(projectId, projectKey);

  try {
    console.log(`\nLoading index '${indexName}' (cache dir: ${CACHE_DIR})...`);
    const start = performance.now();
    await client.loadIndex(indexName, { cachePath: CACHE_DIR });
    const loadMs = (performance.now() - start).toFixed(0);
    console.log(`Index loaded in ${loadMs}ms`);

    // Run a few queries to verify the loaded index works
    const queries = [
      "how to return damaged item",
      "return shipping label process",
      "refund processing time and policy",
    ];

    console.log("\nRunning sample queries...");
    for (const query of queries) {
      const results = await client.query(indexName, query, { topK: 3 });
      console.log(
        `\n  "${query}" -> ${results.docs.length} results (${results.timeTakenInMs}ms)`
      );
      results.docs.forEach((doc, i) => {
        const preview =
          doc.text.length > 80 ? doc.text.substring(0, 80) + "..." : doc.text;
        console.log(`    ${i + 1}. [${doc.id}] score=${doc.score.toFixed(3)}`);
        console.log(`       ${preview}`);
      });
    }

    console.log("\nDone! Run again to see the faster cached load time.");
  } finally {
    await client.close();
  }
}

// Export for use in tests or other modules
export { cachedLoadSample };

// Run the sample
cachedLoadSample().catch(console.error);
````

## sdks/javascript/sdk/samples/custom-authenticator.ts

````ts
/**
 * Custom Authenticator Sample
 *
 * Demonstrates how to implement IAuthenticator for use cases where the
 * project key must not be embedded in client-side code — e.g. browser apps,
 * multi-tenant services, or environments that issue short-lived tokens from
 * their own auth system.
 *
 * Pattern: Backend-delegated auth — the client calls your own API to get a
 * Moss token. The project key never leaves your server.
 */

import { MossClient, IAuthenticator, AuthToken, DocumentInfo } from "../src";
import { config } from "dotenv";

config();

// ---------------------------------------------------------------------------
// Backend-delegated authenticator
//
// Your backend holds the project key and issues short-lived Moss tokens to
// authenticated clients on request. The client never sees the project key.
// ---------------------------------------------------------------------------

class BackendDelegatedAuthenticator implements IAuthenticator {
  constructor(
    private readonly tokenEndpoint: string,
    private readonly getRequestHeaders: () => Promise<Record<string, string>>,
  ) {}

  async getAuthToken(): Promise<AuthToken> {
    // Call your own backend endpoint that securely exchanges credentials for a
    // Moss token. The backend calls the Moss identity service with the project
    // key and returns the resulting JWT.
    const headers = await this.getRequestHeaders();
    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token endpoint returned HTTP ${response.status}: ${text}`);
    }

    // Your endpoint should return { token: string, expiresIn: number }
    const data = (await response.json()) as { token: string; expiresIn: number };
    return { token: data.token, expiresIn: data.expiresIn };
  }

  async getAuthHeader(): Promise<string> {
    const { token } = await this.getAuthToken();
    return `Bearer ${token}`;
  }
}

// ---------------------------------------------------------------------------
// Demo: use MossClient with a custom authenticator
// ---------------------------------------------------------------------------

async function customAuthenticatorDemo() {
  console.log("Custom Authenticator Demo");

  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;

  if (!projectId || !projectKey) {
    console.error("Set MOSS_TEST_PROJECT_ID and MOSS_TEST_PROJECT_KEY in .env");
    return;
  }

  // For the demo we wire up a minimal authenticator backed by the real
  // project key — this mimics what your backend would return to the client.
  const demoAuthenticator: IAuthenticator = {
    async getAuthToken(): Promise<AuthToken> {
      // In a real app this fetch goes to YOUR backend, e.g.:
      //   POST /api/moss-token  →  { token, expiresIn }
      // Here we call the Moss identity service directly to keep the sample
      // self-contained (equivalent to what your backend would do server-side).
      const IDENTITY_URL =
        process.env.MOSS_AUTH_URL ?? "https://service.usemoss.dev/identity/auth/token";
      const response = await fetch(IDENTITY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, projectKey }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth failed HTTP ${response.status}: ${text}`);
      }

      const data = (await response.json()) as { token: string; expiresIn: number };
      return { token: data.token, expiresIn: data.expiresIn };
    },

    async getAuthHeader(): Promise<string> {
      const { token } = await this.getAuthToken();
      return `Bearer ${token}`;
    },
  };

  // Pass the authenticator instead of a raw project key.
  // The SDK uses it to obtain tokens for every Rust NAPI call.
  const client = new MossClient(projectId, demoAuthenticator);

  const indexName = `custom-auth-demo-${Date.now()}`;
  const docs: DocumentInfo[] = [
    { id: "1", text: "Custom authenticators keep the project key server-side." },
    { id: "2", text: "Short-lived tokens limit the blast radius of a credential leak." },
    { id: "3", text: "The IAuthenticator interface lets you plug in any token source." },
  ];

  try {
    console.log("\n1. Creating index via custom authenticator...");
    const result = await client.createIndex(indexName, docs, { modelId: "moss-minilm" });
    console.log("   Created:", result);

    console.log("\n2. Loading index locally...");
    await client.loadIndex(indexName);

    console.log("\n3. Querying...");
    const results = await client.query(indexName, "keeping credentials safe", { topK: 2 });
    console.log(`   Query: "${results.query}"`);
    results.docs.forEach((doc, i) =>
      console.log(`   ${i + 1}. [score ${doc.score.toFixed(3)}] ${doc.text}`),
    );

    console.log("\n4. Cleaning up...");
    await client.deleteIndex(indexName);
    console.log("   Index deleted.");

    console.log("\nDemo complete.");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
  } finally {
    await client.close();
  }

  // Illustrate constructing a BackendDelegatedAuthenticator — not invoked
  // here since it requires a live backend endpoint.
  const _backendAuth = new BackendDelegatedAuthenticator(
    "https://your-api.example.com/moss-token",
    async () => ({ "X-Session-Token": "user-session-token-here" }),
  );
  console.log("\nBackendDelegatedAuthenticator is ready to use:");
  console.log("  new MossClient(projectId, backendAuth)");
}

export { BackendDelegatedAuthenticator };

customAuthenticatorDemo().catch(console.error);
````

## sdks/javascript/sdk/samples/custom-embeddings.ts

````ts
````

## sdks/javascript/sdk/samples/example-usage.ts

````ts
/**
 * Example usage of the Moss JavaScript SDK
 *
 * This example demonstrates the complete workflow.
 */

import { MossClient, DocumentInfo } from "../src/index";
import { config } from 'dotenv';

// Load environment variables
config();

async function exampleUsage() {
  console.log('⭐ Moss API Complete Example ⭐');

  // Initialize client with project credentials from environment
  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;

  if (!projectId || !projectKey) {
    console.error('Please set MOSS_TEST_PROJECT_ID and MOSS_TEST_PROJECT_KEY in .env file');
    console.error('Copy .env.template to .env and fill in your credentials');
    return;
  }

  const client = new MossClient(projectId, projectKey);

  // Example documents following the API contract
  const documents: DocumentInfo[] = [
    {
      id: 'doc1',
      text: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.'
    },
    {
      id: 'doc2',
      text: 'Deep learning uses neural networks with multiple layers to model and understand complex patterns in data.'
    },
    {
      id: 'doc3',
      text: 'Natural language processing enables computers to interpret and manipulate human language for various applications.'
    },
    {
      id: 'doc4',
      text: 'Computer vision enables machines to interpret and understand visual information from the world around them.'
    },
    {
      id: 'doc5',
      text: 'Reinforcement learning is a type of machine learning where an agent learns to make decisions by performing actions and receiving rewards.'
    }
  ];

  const indexName = `example-cloud-index-${Date.now()}`;

  try {
    console.log('1. Creating index with documents...');
    const created = await client.createIndex(indexName, documents, { modelId: "moss-minilm" });
    console.log('✅ Index created:', created);

    console.log('\n2. Getting index information...');
    const indexInfo = await client.getIndex(indexName);
    console.log('✅ Index info:', {
      name: indexInfo.name,
      docCount: indexInfo.docCount,
      model: indexInfo.model.id,
      status: indexInfo.status
    });

    console.log('\n3. Listing all indexes...');
    const indexes = await client.listIndexes();
    console.log('✅ All indexes:', indexes.map(idx => ({
      name: idx.name,
      docCount: idx.docCount,
      status: idx.status
    })));

    console.log('\n4. Adding more documents...');
    const newDocs: DocumentInfo[] = [
      {
        id: 'doc6',
        text: 'Data science combines statistics, programming, and domain expertise to extract insights from data.'
      },
      {
        id: 'doc7',
        text: 'Cloud computing provides on-demand access to computing resources over the internet.'
      }
    ];
    const addResult = await client.addDocs(indexName, newDocs, { upsert: true });
    console.log('✅ Documents added:', addResult);

    console.log('\n5. Getting all documents...');
    const allDocs = await client.getDocs(indexName);
    console.log('✅ Total documents:', allDocs.length);

    console.log('\n6. Getting specific documents...');
    const specificDocs = await client.getDocs(indexName, {
      docIds: ['doc1', 'doc2', 'doc6']
    });
    console.log('✅ Specific documents:', specificDocs.map(doc => ({ id: doc.id, text: doc.text.substring(0, 50) + '...' })));

    console.log('\n7. Performing semantic search...');
    const searchResults = await client.query(
      indexName,
      'artificial intelligence and neural networks',
      { topK: 3 }
    );

    console.log('✅ Search results:');
    console.log(`Query: "${searchResults.query}"`);
    console.log(`Found ${searchResults.docs.length} results`);

    searchResults.docs.forEach((item, index) => {
      console.log(`${index + 1}. [${item.id}] Score: ${item.score.toFixed(3)}`);
      console.log(`   Text: ${item.text.substring(0, 80)}${item.text.length > 80 ? '...' : ''}`);
    });

    console.log('\n8. Deleting some documents...');
    const deleteResult = await client.deleteDocs(indexName, ['doc6', 'doc7']);
    console.log('✅ Documents deleted:', deleteResult.docCount);

    console.log('\n9. Verifying document count after deletion...');
    const remainingDocs = await client.getDocs(indexName);
    console.log('✅ Remaining documents:', remainingDocs.length);

    console.log('\n10. Loading index ...');
    const loadedIndex = await client.loadIndex(indexName);
    console.log('✅ Loaded index:', loadedIndex);

    console.log('\n11. Final search to verify everything works...');
    const finalResults = await client.query(
      indexName,
      'machine learning algorithms',
      { topK: 2 }
    );

    console.log('✅ Final search results:');
    finalResults.docs.forEach((item, index) => {
      console.log(`${index + 1}. [${item.id}] Score: ${item.score.toFixed(3)}`);
    });

    console.log('\n12. Cleaning up - deleting the test index...');
    // const deleted = await client.deleteIndex(indexName);
    // console.log('✅ Index deleted:', deleted);

    console.log('\n🎉 All operations completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  } finally {
    await client.close();
  }
}

// Export for use in tests or other modules
export { exampleUsage };

// Run the example
exampleUsage().catch(console.error);````

## sdks/javascript/sdk/samples/multiple-indexes.ts

````ts
import { MossClient } from '../src';
import { config } from 'dotenv';
// Load environment variables from the samples directory
config();

async function main() {
  console.log('⭐ Multiple Indexes Demo ⭐');

  // Initialize search client with project credentials
  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;

  if (!projectId || !projectKey) {
    console.error('Please set MOSS_TEST_PROJECT_ID and MOSS_TEST_PROJECT_KEY in .env file');
    console.error('Copy .env.template to .env and fill in your credentials');
    return;
  }

  const mossClient = new MossClient(projectId, projectKey);

  try {
    // List all available indexes
    console.log('Listing all available indexes...');
    const indexes = await mossClient.listIndexes();
    console.log(`Found ${indexes.length} indexes:`);
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${index.docCount} documents`);
    });

    if (indexes.length === 0) {
      console.log('No indexes found. Please create indexes first using the example-usage.ts sample.');
      return;
    }

    // Search multiple indexes with the same query
    const query = "wireless bluetooth devices";
    console.log(`\nSearching for: "${query}" across all indexes:`);

    // Search each index and collect results
    const allResults: Array<{ indexName: string; id: string; text: string; score: number }> = [];
    for (const index of indexes) {
      try {
        console.log(`\nSearching in ${index.name}...`);
  const results = await mossClient.query(index.name, query, { topK: 3 });
        console.log(`Found ${results.docs.length} matches in ${index.name}`);

        // Add index name to each result for clarity
        results.docs.forEach(doc => {
          allResults.push({
            indexName: index.name,
            id: doc.id,
            text: doc.text,
            score: doc.score
          });
        });
      } catch (error) {
        console.warn(`Error searching ${index.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Sort all results by score and display top results
    allResults.sort((a, b) => b.score - a.score);
    const topResults = allResults.slice(0, 5);

    console.log(`\nTop ${topResults.length} results across all indexes:`);
    topResults.forEach((result, index) => {
      console.log(`#${index + 1} - Score: ${result.score.toFixed(4)} [${result.indexName}]`);
      console.log(`ID: ${result.id}`);
      console.log(`Text: ${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}`);
      console.log('---');
    });

    // Demonstrate different search query
    const secondQuery = "product return policy";
    console.log(`\nSearching for: "${secondQuery}" across all indexes:`);

    const secondResults: Array<{ indexName: string; id: string; text: string; score: number }> = [];
    for (const index of indexes) {
      try {
  const results = await mossClient.query(index.name, secondQuery, { topK: 2 });
        results.docs.forEach(doc => {
          secondResults.push({
            indexName: index.name,
            id: doc.id,
            text: doc.text,
            score: doc.score
          });
        });
      } catch (error) {
        console.warn(`Error searching ${index.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Sort and display second query results
    secondResults.sort((a, b) => b.score - a.score);
    const topSecondResults = secondResults.slice(0, 4);

    topSecondResults.forEach((result, index) => {
      console.log(`#${index + 1} - Score: ${result.score.toFixed(4)} [${result.indexName}]`);
      console.log(`ID: ${result.id}`);
      console.log(`Text: ${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error occurred:', error instanceof Error ? error.message : String(error));
  } finally {
    await mossClient.close();
  }
}

main().catch(console.error);
````

## sdks/javascript/sdk/samples/query.ts

````ts
import { MossClient } from '../src';
import { config } from 'dotenv';

// Load environment variables from the samples directory
config();

async function main() {
  console.log('⭐ Moss Index Query Demo ⭐');

  // Initialize search client with project credentials
  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;

  if (!projectId || !projectKey) {
    console.error('Please set MOSS_TEST_PROJECT_ID and MOSS_TEST_PROJECT_KEY in .env file');
    console.error('Copy .env.template to .env and fill in your credentials');
    return;
  }

  const mossClient = new MossClient(projectId, projectKey);

  try {
    // List available indexes first
    console.log('Listing available indexes...');
    const indexes = await mossClient.listIndexes();
    console.log(`Found ${indexes.length} indexes:`);
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${index.docCount} documents`);
    });

    if (indexes.length === 0) {
      console.log('No indexes found. Please create an index first using the example-usage.ts sample.');
      return;
    }

    // Use MOSS_INDEX_NAME env var or fall back to the first available index
    const indexName = process.env.MOSS_INDEX_NAME || indexes[0].name;
    console.log(`\nUsing index: ${indexName}`);

    // Get index information
    const indexInfo = await mossClient.getIndex(indexName);
    console.log(`Index details: ${indexInfo.docCount} documents, model: ${indexInfo.model.id}`);

    // Search the index
    const query = "How do we use cloudflare?";
    console.log(`\nSearching for: "${query}"`);

    await mossClient.loadIndex(indexName); // Ensure index is loaded before querying
    const result = await mossClient.query(indexName, query, { topK: 5 });

    console.log(`\nTotal matches found: ${result.docs.length}`);
    console.log(`Query: ${result.query}`);
    console.log('---');

    // Display results
    result.docs.forEach((match, index) => {
      console.log(`#${index + 1} - Score: ${match.score.toFixed(4)}`);
      console.log(`ID: ${match.id}`);
      console.log(`Text: ${match.text.substring(0, 150)}${match.text.length > 150 ? '...' : ''}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error occurred:', error instanceof Error ? error.message : String(error));
  } finally {
    await mossClient.close();
  }
}

main().catch(console.error);````

## sdks/javascript/sdk/samples/session_smoke.ts

````ts
/**
 * Smoke test for `client.session(...)`.
 *
 * Uses `modelId="custom"` so document `addDocs` / `query` / `deleteDocs`
 * stay in-process — no cloud round trip. The only network call is the
 * credential validation that `SessionIndex` performs at construction
 * (so real creds in `MOSS_TEST_PROJECT_ID` / `MOSS_TEST_PROJECT_KEY` are required).
 *
 * Run:
 *   npx tsx samples/session_smoke.ts
 */

import { config } from "dotenv";

import { MossClient, type DocumentInfo, type SessionIndex } from "../src";

// SessionIndex's constructor validates credentials against the cloud,
// so even an in-process smoke test needs real creds from .env.
config();

async function main(): Promise<void> {
  const projectId = process.env.MOSS_TEST_PROJECT_ID;
  const projectKey = process.env.MOSS_TEST_PROJECT_KEY;
  if (!projectId || !projectKey) {
    throw new Error(
      "MOSS_TEST_PROJECT_ID / MOSS_TEST_PROJECT_KEY not set. Check .env",
    );
  }

  const client = new MossClient(projectId, projectKey);
  let session: SessionIndex | undefined;

  try {
    session = await client.session("smoke-session", "custom");
    console.log(`Created session: name=${session.name}, modelId=${session.modelId}`);

    const docs: DocumentInfo[] = [
      {
        id: "a",
        text: "Machine learning models",
        metadata: { topic: "ml" },
        embedding: [1, 0, 0],
      },
      {
        id: "b",
        text: "Cloud infrastructure",
        metadata: { topic: "infra" },
        embedding: [0, 1, 0],
      },
      {
        id: "c",
        text: "Neural networks",
        metadata: { topic: "ml" },
        embedding: [0.9, 0.1, 0],
      },
    ];

    const addResult = await session.addDocs(docs);
    console.log(
      `addDocs: added=${addResult.added}, updated=${addResult.updated}, docCount=${session.docCount}`,
    );
    if (addResult.added !== 3 || session.docCount !== 3) {
      throw new Error("expected 3 docs added");
    }

    // Custom-embedding query: "show me ML stuff" with embedding ~ [1, 0, 0]
    const result = await session.query("ML stuff", {
      topK: 2,
      embedding: [1, 0, 0],
    });
    console.log(
      `query: query="${result.query}", count=${result.docs.length}, top=[${result.docs
        .map((d) => `${d.id}:${d.score.toFixed(3)}`)
        .join(", ")}]`,
    );
    if (result.docs.length !== 2) {
      throw new Error(`expected 2 results, got ${result.docs.length}`);
    }
    if (result.docs[0].id !== "a") {
      throw new Error(`expected top doc to be 'a', got '${result.docs[0].id}'`);
    }

    const deleted = await session.deleteDocs(["b"]);
    console.log(`deleteDocs: removed=${deleted}, docCount=${session.docCount}`);
    if (deleted !== 1 || session.docCount !== 2) {
      throw new Error("expected b to be removed");
    }

    // Custom-embedding session should reject queryText
    try {
      await session.query("anything"); // no embedding supplied
      throw new Error("expected query() without embedding to throw on custom");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("custom embeddings")) {
        throw new Error(`unexpected error message: ${message}`);
      }
      console.log(`custom-without-embedding correctly rejected: ${message}`);
    }

    console.log("✓ session smoke test passed");
  } finally {
    await session?.close();
    await client.close();
  }
}

main().catch((err) => {
  console.error("✗ smoke test failed:", err);
  process.exit(1);
});
````
