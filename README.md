# X Stories

AI-curated news homepage for X.com - reimagining the logged-out experience.

[![Watch the video](https://img.youtube.com/vi/KANHt7wC4iQ/maxresdefault.jpg)](https://youtu.be/KANHt7wC4iQ)

### [Watch this video on YouTube](https://youtu.be/KANHt7wC4iQ)

**[https://vikramxai.vercel.app →](https://vikramxai.vercel.app)**



X Stories turns the logged-out X homepage into a modern editorial front page. Instead of showing isolated viral posts, it clusters live public conversations into emerging stories with AI-generated headlines, summaries, source posts, and momentum signals.

## Why

Tens of millions of people visit x.com logged out every single day, but the current homepage doesn't convey what's actually happening across the platform. This project explores a different entry point: a live, AI-curated front page for the internet — built entirely from public conversations on X.

## Architecture

For a deeper look at the backend pipeline, ranking, and cache behavior, see the **backend README**: [`docs/backend-architecture.md`](docs/backend-architecture.md).

![Pipeline Animation](public/pipeline.gif)

## Request Flow

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

1. **Ingest** - Fetch public posts from X across 7 topic buckets (breaking, AI, tech, politics, business, culture, nearby)
2. **Preprocess** - Normalize text, deduplicate, extract hashtags and URLs
3. **Embed** - Generate vector embeddings with OpenAI `text-embedding-3-small`
4. **Cluster** - DBSCAN with cosine distance, then conservative URL/hashtag merge
5. **Rank** - Weighted score across engagement, velocity, recency, and author diversity
6. **Select** - Pick author-diverse representative posts per cluster
7. **Summarize** - Generate headline + summary with GPT-4o-mini
8. **Cache** - Persist to Redis with stale-while-revalidate serving

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| Cache | Upstash Redis |
| Data | X API v2 |
| AI | OpenAI (embeddings + summarization) |

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/stories` | GET | Returns story feed + pipeline status; triggers refresh when stale |
| `/api/stories/refresh` | POST | Re-processes stories from cached tweets without calling the X API |

## Key Design Decisions

- **Story-first, not feed-first** - Conversations are grouped into narratives rather than shown as a raw stream
- **Cache-first serving** - Responses come from Redis; pipeline runs are fire-and-forget background tasks
- **Source-grounded** - Every story links back to real X posts, not just AI-generated text
- **Conversion-aware** - The logged-out experience complements the sign-up funnel with gated deeper exploration

## Limitations

- Nearby feed uses a hardcoded city instead of real user geolocation. This limits personalization and underestimates how much a location-based news feed can improve sign-up funnels.
- The pipeline currently ingests around 2,000 tweets from the X API per run; fetching more would surface richer clusters and higher-quality stories, at the cost of rate limits and processing time.
- Story IDs are not stable across pipeline runs (no deep linking yet).
- Scheduling is single-process only - production would use a platform scheduler (e.g., Vercel Cron).

## Deep Dive

See [`docs/backend-architecture.md`](docs/backend-architecture.md) for the full backend writeup — cache behavior, failure handling, ranking formulas, and configuration reference.
