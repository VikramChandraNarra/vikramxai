# Backend Architecture

> **vikramxai** — a Next.js 16 app that surfaces live X (Twitter) conversations as editorial news stories, ranked by engagement, velocity, recency, and author diversity.

---

## Overview

The backend is a self-contained data pipeline that runs inside the Next.js server process. It:

1. Ingests recent public posts from the X API v2 across seven topic buckets
2. Preprocesses and deduplicates the raw tweets
3. Embeds them with OpenAI (`text-embedding-3-small`)
4. Clusters them semantically with DBSCAN, then merges clusters that share URLs or hashtags
5. Ranks surviving clusters with a four-signal weighted score
6. Generates a headline + summary for each ranked cluster with GPT-4o-mini
7. Persists results in Upstash Redis and serves them from `GET /api/stories`

The pipeline runs on a background timer (dev) and is triggered on-demand by the stories route whenever tweets go stale.

---

## High-Level Architecture

```
X API v2
  └─► ingest       — fetch tweets per bucket, tag with category, dedup across buckets
        └─► preprocess  — normalize text, exact-dedup, extract hashtags + t.co URLs
              └─► embed       — OpenAI text-embedding-3-small, batches of 100
                    └─► cluster    — DBSCAN (cosine distance) + conservative URL/hashtag merge
                          └─► rank        — credibility filter, 4-signal score, top-N selection
                                └─► select     — author-diverse top-5 rep tweets per cluster
                                      └─► summarize  — GPT-4o-mini, JSON headline + 2-sentence summary
                                            └─► Redis    — stories (7-day TTL) + meta + raw tweet cache

GET /api/stories  ◄─── reads Redis, triggers pipeline if tweets are stale
POST /api/stories/refresh  ◄─── re-runs story generation from cached tweets (no X API call)
```

---

## API Routes

### `GET /api/stories`

Returns the current story feed and pipeline status. Also triggers pipeline runs when needed.

**Trigger logic (in order):**
1. If `cache.isRefreshing` is already `true` → do nothing, return current cache
2. If tweets are stale (`lastTweetsFetchedAt` older than `TWEETS_TTL_MS`) → `pipeline.run()` (full ingest)
3. Else if no stories exist in Redis → `pipeline.processStoriesFromCache()` (re-process only)
4. Otherwise → return cached stories immediately (stale-while-revalidate)

Both pipeline calls are **fire-and-forget** — the route does not await them.

**Response shape:**
```json
{
  "headlineStory": {
    "id": "story-1741621320000-a4f8b2",
    "headline": "OpenAI releases GPT-5 with multimodal reasoning",
    "summary": "OpenAI announced GPT-5 today, claiming significant improvements in reasoning and vision tasks. The release follows months of speculation and puts pressure on Google and Anthropic.",
    "isHeadline": true,
    "score": 0.87,
    "totalEngagement": 142300,
    "velocity": 48200,
    "uniqueAuthors": 214,
    "clusterSize": 87,
    "category": "ai",
    "generatedAt": "2026-03-10T14:22:00Z",
    "representativeTweets": [
      {
        "id": "1234567890",
        "text": "GPT-5 is here and it is genuinely shocking...",
        "authorUsername": "sama",
        "authorDisplayName": "Sam Altman",
        "authorProfileImageUrl": "https://pbs.twimg.com/...",
        "createdAt": "2026-03-10T13:55:00Z",
        "likeCount": 48200,
        "retweetCount": 12100,
        "replyCount": 3400,
        "media": [{ "url": "https://pbs.twimg.com/media/...", "type": "photo" }]
      }
    ]
  },
  "stories": [ /* same shape, isHeadline: false */ ],
  "status": {
    "isRunning": false,
    "lastRunAt": "2026-03-10T14:20:00Z",
    "lastSuccessfulRunAt": "2026-03-10T14:22:00Z",
    "lastTweetsFetchedAt": "2026-03-10T14:20:30Z",
    "error": null,
    "storyCount": 18,
    "cacheAgeMs": 87000
  }
}
```

`headlineStory` is the highest-ranked story (`isHeadline: true`). `stories` contains the rest, ordered by score descending.

---

### `POST /api/stories/refresh`

Triggers `pipeline.processStoriesFromCache()` — re-runs the embed → cluster → rank → summarize stages using the already-cached raw tweets. **Does not call the X API.** Used by the manual refresh button in the UI.

```json
{ "message": "Refresh triggered" }
```

In mock mode (`USE_MOCK_DATA=true`) both routes return immediately without touching any pipeline or Redis.

---

## Data Flow / Pipeline Lifecycle

### Singleton management

The `Pipeline` class is stored on `globalThis.__pipeline` so it survives Next.js hot reloads. `getOrInitPipeline()` checks whether the stored instance has the latest method signature (`typeof g.__pipeline.forceIngest === 'function'`) and re-creates it if stale.

On first init, `pipeline.smartRun()` is called immediately and a `setInterval` repeating every `PIPELINE_REFRESH_MS` (24 hours) keeps it running in dev. In production this should be replaced by a platform scheduler.

### `smartRun()` decision tree

```
smartRun()
  ├─ tweets stale?  → run()            (full ingest + process)
  ├─ no stories?    → processStoriesFromCache()  (re-process only)
  └─ else           → skip
```

### `run()` flow

```
1. Guard: if already refreshing, return
2. Set isRefreshing = true, write lastRunAt to Redis meta
3. Check areTweetsStale()
   ├─ stale  → call X API via ingestTweets()
   │           write raw tweets to Redis (no TTL)
   │           write lastTweetsFetchedAt to Redis meta
   └─ fresh  → delegate to processStoriesFromCache(), return
4. Call processTweets(tweets)
5. On error: write error message to Redis meta
6. Finally: set isRefreshing = false
```

### X API fallback inside `run()`

If the X API call fails but there are previously-cached raw tweets, the pipeline falls back to those tweets and continues processing. The error is logged but does not bubble up.

---

## Cache Behavior

All persistent state lives in **Upstash Redis** (REST-based, serverless-compatible). The in-memory `cache` object holds only the single boolean `isRefreshing` — a process-local guard against concurrent runs.

### Redis keys

| Key | Type | TTL | Contents |
|---|---|---|---|
| `stories` | JSON array | 7 days (`STORIES_REDIS_TTL_MS`) | `Story[]` — the rendered story feed |
| `cache:meta` | JSON object | none | Run timestamps, error state |
| `tweets:raw` | JSON array | none | Raw `Tweet[]` for fallback/re-processing |

### `cache:meta` shape

```json
{
  "lastRunAt": "2026-03-10T14:20:00Z",
  "lastSuccessfulRunAt": "2026-03-10T14:22:00Z",
  "lastTweetsFetchedAt": "2026-03-10T14:20:30Z",
  "updatedAt": "2026-03-10T14:22:05Z",
  "error": null
}
```

### Freshness rules

- **Tweet freshness**: `lastTweetsFetchedAt` + `TWEETS_TTL_MS` (1 hour). Stale → full X API ingest.
- **Story freshness**: driven implicitly by tweet freshness + `updatedAt`. The `cacheAgeMs` field in the API response is `Date.now() - meta.updatedAt`.
- **Raw tweet cache**: stored without TTL, used as an ingest fallback when the X API fails and to power re-process runs without burning X API quota.

### `Date` re-hydration

Redis serializes `Date` objects as ISO strings. `getRawTweets()` maps them back: `createdAt: new Date(t.createdAt)` so downstream pipeline stages receive proper `Date` instances.

---

## Pipeline Stages

### 1. Ingest (`pipeline/ingest.ts`)

- Calls `GET https://api.twitter.com/2/tweets/search/recent` for each query in each bucket
- All buckets and all queries within a bucket run **concurrently** via `Promise.allSettled`
- Expansions requested: `author_id`, `attachments.media_keys`
- Fields requested: `public_metrics`, `created_at`, `author_id`, `attachments`; user fields: `username`, `name`, `profile_image_url`; media fields: `url`, `preview_image_url`, `type`
- Each tweet is tagged with its bucket's category string
- Cross-bucket deduplication: a `Set<string>` of tweet IDs ensures first-bucket wins; duplicates are dropped
- Per-query failures are caught and logged; a single failed query does not abort the entire ingest

### 2. Preprocess (`pipeline/preprocess.ts`)

- **Normalize**: strip zero-width chars (`\u200B`–`\u200D`, `\uFEFF`), collapse whitespace, lowercase — used for dedup comparison only (original `text` is preserved)
- **Exact dedup**: `Set<string>` of normalized texts; only the first occurrence survives
- **Entity extraction**: hashtags via `/(#\w+)/gi` → lowercased without `#`; t.co URLs via `/https?:\/\/t\.co\/\w+/gi` → used downstream as merge signals

### 3. Embed (`pipeline/embed.ts`)

- Model: `text-embedding-3-small` (1536 dimensions)
- Batch size: 100 tweets per OpenAI request
- Text truncated to 8191 chars per tweet
- Response sorted by `.index` before mapping back to tweets
- Returns the full `Tweet[]` with `.embedding` populated

### 4. Cluster (`pipeline/cluster.ts`)

**Step 1 — DBSCAN**
- Distance metric: cosine distance = `1 - dot(a, b) / (|a| · |b|)`, range [0, 2]
- Parameters: `CLUSTER_EPSILON = 0.25`, `CLUSTER_MIN_PTS = 2`
- O(n²) — fine for n ≤ ~500; tweet counts in practice are well under this
- Tweets without embeddings are silently skipped

**Step 2 — Noise handling**
- Noise tweets (no dense neighborhood) are kept as singleton clusters only if `tweetEngagement(t) ≥ NOISE_MIN_ENGAGEMENT` (500)
- Below that threshold they are discarded entirely

**Step 3 — Conservative merge**
- Single-pass O(n²) over cluster pairs
- Merge condition: `sharedUrls ≥ MERGE_MIN_SHARED_URLS (1)` **OR** `sharedTags ≥ MERGE_MIN_SHARED_TAGS (2)`
- Prevents semantically-distinct clusters from merging unless they share concrete linking signals
- Not iterative — merged clusters are not re-evaluated for further merges

### 5. Rank (`pipeline/rank.ts`)

**Credibility filter (OR logic)**

A cluster must pass at least one:
- `size ≥ MIN_CLUSTER_SIZE` (3)
- `totalEngagement ≥ MIN_TOTAL_ENGAGEMENT` (50)
- `uniqueAuthors ≥ MIN_UNIQUE_AUTHORS` (2)

Clusters failing all three are discarded before scoring.

**Engagement formula**
```
tweetEngagement(t) = t.likeCount
                   + 3 × t.retweetCount
                   + 2 × t.replyCount
                   + 0.01 × t.impressionCount
```

Retweets are weighted 3× because they represent active re-distribution.

**Signals**

| Signal | Formula | Weight |
|---|---|---|
| Total engagement | sum of `tweetEngagement` across all cluster tweets, min-max normalized | 0.35 |
| Velocity | sum of `tweetEngagement` for tweets posted in the last 1 hour, min-max normalized | 0.30 |
| Recency | `exp(-ln2 × medianAgeHours / RECENCY_HALF_LIFE_HOURS)` → 1.0 = brand new, 0.5 = 6h old | 0.20 |
| Unique authors | distinct `authorId` count, min-max normalized | 0.15 |

**Composite score**
```
score = 0.35 × norm(totalEngagement)
      + 0.30 × norm(velocity)
      + 0.20 × recencyScore
      + 0.15 × norm(uniqueAuthors)
```

Min-max normalization is computed across all surviving clusters in a single run, so scores are relative to each other, not absolute. Results are sorted descending and sliced to `MAX_STORIES` (20).

**Category assignment**

`modeCategory(tweets)` counts `tweet.category` values across a cluster and picks the most frequent. This propagates the bucket label from ingest through to the rendered story.

### 6. Select representative tweets (`pipeline/select.ts`)

For each ranked cluster, selects up to `REP_TWEET_COUNT` (5) tweets to send to the summarizer and display in the UI.

Algorithm (greedy):
1. Sort cluster tweets by `tweetEngagement` descending
2. Iterate; for each candidate skip if:
   - `text.length < MIN_TEXT_LENGTH` (30 chars)
   - more than `MAX_URLS_PER_TWEET` (1) URL in text
   - more than 50% of non-whitespace characters are emoji
   - the same `authorId` has already been picked 2+ times
3. Stop when 5 selected or candidates exhausted

This ensures the representative set is readable, substantive, and doesn't over-represent any single voice.

### 7. Summarize (`pipeline/summarize.ts`)

- Model: `gpt-4o-mini` via raw `fetch` to `POST https://api.openai.com/v1/chat/completions`
- `max_tokens: 256` per story
- Prompt asks for: (1) punchy headline under 12 words, (2) 2-sentence factual summary
- Unverified claim handling: prompt instructs the model to signal uncertainty with varied phrasing ("X users report...", "Social media reports suggest...", etc.) rather than stating unconfirmed claims as fact
- Output format: JSON `{"headline": "...", "summary": "..."}` — extracted with a regex (`/\{[\s\S]*\}/`) then `JSON.parse()`; on parse failure the story uses the fallback headline "Developing Story"
- Clusters are processed in batches of 10 (`SUMMARIZE_BATCH_SIZE`), with all 10 in a batch running concurrently via `Promise.allSettled`
- The first story in the first batch gets `isHeadline: true`

**Story ID format:** `story-${Date.now()}-${random 6-char base36}` — not stable across runs.

---

## Important Schemas / Types

### `Tweet` (internal)
```typescript
interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  createdAt: Date;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  impressionCount: number;
  media?: TweetMedia[];          // photos/videos from X API expansions
  embedding?: number[];          // set by embed stage
  normalizedText?: string;       // set by preprocess
  entities?: {                   // set by preprocess
    hashtags: string[];
    urls: string[];              // t.co URLs only
  };
  category?: string;             // bucket name from ingest
}
```

### `TweetPreview` (API surface / stored in Redis)
```typescript
interface TweetPreview {
  id: string;
  text: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  createdAt: string;             // ISO string (not Date)
  likeCount: number;
  retweetCount: number;
  replyCount?: number;
  media?: TweetMedia[];
}
```

### `Story` (stored in Redis + returned by API)
```typescript
interface Story {
  id: string;
  headline: string;
  summary: string;
  representativeTweets: TweetPreview[];
  isHeadline: boolean;
  score: number;
  totalEngagement: number;
  velocity: number;
  uniqueAuthors: number;
  clusterSize: number;
  generatedAt: string;           // ISO string
  category: string;
}
```

### `ScoredCluster` (internal, between rank and summarize)
```typescript
interface ScoredCluster {
  tweets: Tweet[];
  score: number;
  totalEngagement: number;
  velocity: number;
  uniqueAuthors: number;
  category: string;
}
```

---

## Config / Tuning

All tunables live in `src/lib/config.ts`. No code changes needed to adjust pipeline behavior.

| Constant | Default | Effect |
|---|---|---|
| `PIPELINE_REFRESH_MS` | 24h | Background timer interval (dev only) |
| `TWEETS_TTL_MS` | 1h | Age at which cached tweets are considered stale → triggers X API call |
| `STORIES_REDIS_TTL_MS` | 7d | Redis TTL on the `stories` key |
| `MAX_RESULTS_PER_QUERY` | 75 | Max tweets fetched per X search query (hard cap: 100) |
| `MAX_STORIES` | 20 | Maximum stories returned after ranking |
| `CLUSTER_EPSILON` | 0.25 | DBSCAN neighborhood radius (cosine distance) |
| `CLUSTER_MIN_PTS` | 2 | Minimum tweets to form a DBSCAN core point |
| `MERGE_MIN_SHARED_URLS` | 1 | Shared t.co URLs required to merge two clusters |
| `MERGE_MIN_SHARED_TAGS` | 2 | Shared hashtags required to merge two clusters |
| `NOISE_MIN_ENGAGEMENT` | 500 | Minimum engagement for a noise tweet to become a singleton cluster |
| `MIN_CLUSTER_SIZE` | 3 | Credibility filter: minimum cluster size |
| `MIN_TOTAL_ENGAGEMENT` | 50 | Credibility filter: minimum total engagement |
| `MIN_UNIQUE_AUTHORS` | 2 | Credibility filter: minimum distinct authors |
| `MIN_TEXT_LENGTH` | 30 | Minimum tweet text length for representative selection |
| `MAX_URLS_PER_TWEET` | 1 | Maximum URLs in a tweet text for it to qualify as representative |
| `RECENCY_HALF_LIFE_HOURS` | 6 | Exponential decay half-life for recency score |
| `SUMMARIZE_MODEL` | `gpt-4o-mini` | OpenAI model used for headline + summary generation |
| `REP_TWEET_COUNT` | 5 | Representative tweets per story (sent to LLM + shown in UI) |
| `EMBED_MODEL` | `text-embedding-3-small` | OpenAI embedding model |

### Story buckets (`STORY_BUCKETS`)

Seven topic buckets, each with 1–2 X search queries. Tweets are tagged with the bucket name as their `category`. The bucket structure can be edited freely in `config.ts` without touching pipeline code.

| Bucket | Queries focus on |
|---|---|
| `breaking` | "breaking news", "developing story", "just announced" |
| `ai` | AI, LLM, GPT, Grok, Claude, AI startups/research |
| `technology` | product launches, startups, funding rounds |
| `politics` | White House, Congress, elections, legislation |
| `business` | earnings, markets, IPOs, stock news |
| `culture` | film, music, box office, celebrity |
| `nearby` | San Francisco local news (hardcoded city — prototype) |

All queries filter `-is:retweet -is:reply` and most include `lang:en`.

---

## Environment Variables

```bash
X_BEARER_TOKEN=          # X/Twitter API v2 Bearer Token
OPENAI_API_KEY=          # OpenAI API key (embeddings + summarization)
UPSTASH_REDIS_REST_URL=  # Upstash Redis REST endpoint
UPSTASH_REDIS_REST_TOKEN=# Upstash Redis REST token
USE_MOCK_DATA=true       # Optional: skip all external APIs, use mock stories
```

`redis.ts` throws at module load time if either Upstash env var is missing, so misconfiguration fails loudly on startup rather than silently at runtime.

---

## Failure Handling / Fallbacks

| Failure | Behavior |
|---|---|
| X API call fails | Falls back to `tweets:raw` in Redis if it exists; re-processes from cache. If no cached tweets, the error propagates and is written to `cache:meta.error`. |
| Single X query fails | Logged; other queries in the same bucket continue via `Promise.allSettled`. |
| Single bucket fails | Logged; other buckets continue. |
| OpenAI embed call fails | Throws; `processTweets()` propagates the error, pipeline logs it and sets `error` in meta. |
| Single summarize call fails | That cluster is skipped (`Promise.allSettled`); remaining stories are still saved. |
| JSON parse failure in summarize | Falls back to headline `"Developing Story"` and empty summary string; story is still included. |
| Redis unavailable | Redis client throws; pipeline sets `error` in meta (or fails silently on meta write). Stories route returns empty array with `error` in status. |
| `isRefreshing` guard | All three public pipeline methods (`run`, `forceIngest`, `processStoriesFromCache`) check `cache.isRefreshing` and return immediately if a run is in progress. Prevents concurrent runs within a single process. |

---

## Tradeoffs / Prototype Limitations

**Single-process scheduler.** `setInterval` only works while one Node.js process is alive. Under serverless cold starts, multi-instance deployments, or process restarts the timer resets and pipeline state is inconsistent. The `isRefreshing` in-memory flag is also process-local — two instances can run the pipeline concurrently.

**O(n²) DBSCAN.** The cosine distance computation visits every tweet pair. Fine at n ≤ 500; degrades noticeably at n ≈ 1000+. No approximate nearest-neighbor index is used.

**No stable story IDs.** Each pipeline run generates new random IDs (`story-${timestamp}-${random}`). URLs and client-side state keyed on story ID break across refreshes. Deep links to individual stories are not possible.

**Single-pass cluster merge.** The conservative merge algorithm makes one pass over cluster pairs. Chains of three or more related clusters that should merge into one may stay separate if no single pair in the chain meets the threshold.

**Nearby bucket is hardcoded.** The `nearby` bucket has "San Francisco" baked into the query string in `config.ts`.

**`USE_MOCK_DATA` bypass.** In mock mode all X API, OpenAI, and Redis calls are skipped entirely and a static array of 20 mock stories is returned. Mock stories do not refresh or age.

**No rate-limit handling.** The pipeline does not implement retry-with-backoff for X API or OpenAI rate limit responses. A 429 will propagate as an error.

**Story ID collision risk.** IDs use `Date.now()` + 6 random base36 chars. Collision probability is extremely low but non-zero for rapid sequential calls.

---

## Production Follow-Ups

- Replace `setInterval` with a platform scheduler (Vercel Cron, Railway cron, AWS EventBridge) and remove the dev timer entirely
- Add distributed locking (Redis `SET NX EX`) for the `isRefreshing` guard across multiple instances
- Switch to approximate nearest-neighbor search (HNSW, Faiss) for clustering at scale
- Assign stable, content-addressed story IDs (e.g., hash of headline + generatedAt bucket) to support deep links and incremental updates
- Add retry logic with exponential backoff for X API and OpenAI calls
- Parameterize the `nearby` bucket location via environment variable or user preference
- Persist `isRefreshing` to Redis so process restarts don't leave the flag stuck `true`
- Add observability: structured logging, pipeline run duration metrics, per-stage tweet/cluster counts

---

## File Map

```
src/
├── app/
│   └── api/
│       └── stories/
│           ├── route.ts              GET /api/stories — serves feed, triggers pipeline
│           └── refresh/
│               └── route.ts          POST /api/stories/refresh — re-process from cache
├── lib/
│   ├── types.ts                      All shared interfaces (Tweet, Story, ScoredCluster, ...)
│   ├── config.ts                     All tunables in one place
│   ├── redis.ts                      Upstash Redis client singleton
│   ├── cache.ts                      Redis read/write helpers + freshness checks
│   └── pipeline/
│       ├── index.ts                  Pipeline class + getOrInitPipeline() singleton
│       ├── ingest.ts                 X API v2 search, user/media expansions
│       ├── preprocess.ts             Normalize, exact-dedup, entity extraction
│       ├── embed.ts                  OpenAI embeddings, batched
│       ├── cluster.ts                DBSCAN + noise filter + conservative merge
│       ├── rank.ts                   Credibility filter, 4-signal score, category assignment
│       ├── select.ts                 Author-diverse representative tweet selection
│       ├── summarize.ts              GPT-4o-mini headline + summary generation
│       └── mock-data.ts              Static mock stories for USE_MOCK_DATA mode
```
