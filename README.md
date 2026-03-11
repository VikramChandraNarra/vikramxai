````md
# X Stories

AI News-style logged-out homepage for X.com Web (Desktop).

X Stories reimagines the logged-out X homepage as a modern editorial front page built from live public conversations. Instead of showing isolated viral posts, it clusters related posts into emerging stories with generated headlines, summaries, source posts, and live momentum signals.

[Add full homepage screenshot here]

## What it does

- Ingests recent public posts from X across topic buckets
- Clusters related posts into stories
- Ranks stories by engagement, velocity, recency, and author diversity
- Generates short editorial headlines and summaries
- Serves the homepage from cache for fast loads
- Supports a logged-out funnel with sign up / log in CTAs

## Why

The current logged-out X homepage does not fully convey what is happening across the platform. This project explores a different entry point: a live AI-curated front page for the internet built from public conversations on X.

## Architecture

```mermaid
flowchart LR
    A[X API v2] --> B[Ingest]
    B --> C[Preprocess]
    C --> D[Embed]
    D --> E[Cluster]
    E --> F[Rank]
    F --> G[Summarize]
    G --> H[Redis Cache]
    H --> I[GET /api/stories]
    I --> J[Homepage UI]
````

## Request flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as GET /api/stories
    participant R as Redis
    participant P as Pipeline

    U->>FE: Open homepage
    FE->>API: Request stories
    API->>R: Read cached stories
    alt cache fresh
        API-->>FE: Return cached stories
    else cache stale
        API->>P: Trigger background refresh
        API-->>FE: Return current cached stories
    end
```

## Pipeline

* Fetch public posts from X by bucket
* Normalize and deduplicate tweets
* Generate embeddings with OpenAI
* Cluster related tweets into stories
* Rank clusters by engagement, velocity, recency, and author diversity
* Select representative source posts
* Generate headline and summary
* Cache final stories in Redis

## Stack

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* Upstash Redis
* X API v2
* OpenAI API

## API routes

### `GET /api/stories`

Returns:

* `headlineStory`
* `stories`
* `status`

### `POST /api/stories/refresh`

Re-processes stories from cached tweets without calling the X API again.

## Local development

### Install

```bash
npm install
```

### Environment

```bash
X_BEARER_TOKEN=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
USE_MOCK_DATA=false
```

### Run

```bash
npm run dev
```

## Example response

```json
{
  "headlineStory": {
    "id": "story-123",
    "headline": "OpenAI unveils GPT-5 with stronger reasoning",
    "summary": "OpenAI introduced GPT-5, claiming major improvements in reasoning and multimodal tasks.",
    "category": "ai",
    "isHeadline": true
  },
  "stories": [],
  "status": {
    "isRunning": false,
    "lastRunAt": "2026-03-10T14:20:00Z",
    "lastSuccessfulRunAt": "2026-03-10T14:22:00Z",
    "storyCount": 12,
    "cacheAgeMs": 87000
  }
}
```

## Key design decisions

* Story-first instead of feed-first
* Fast responses via cache
* Source-grounded UI through representative X posts
* Logged-out conversion through gated deeper exploration
* Short summaries instead of full article generation

## Limitations

* Prototype-grade background scheduling
* Heuristic bucket queries
* Story IDs are not stable across runs
* Nearby feed is bucket-based, not true geo search
* Clustering is optimized for moderate batch sizes

## More detail

See `BACKEND_ARCHITECTURE.md` for the deeper backend writeup.

## Screenshots

* [Add full homepage screenshot here]
* [Add story detail modal screenshot here]
* [Add blur/signup gate screenshot here]

```
```
