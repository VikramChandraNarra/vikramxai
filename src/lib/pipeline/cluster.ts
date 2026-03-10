import { Tweet } from '../types';
import { MERGE_MIN_SHARED_URLS, MERGE_MIN_SHARED_TAGS, NOISE_MIN_ENGAGEMENT } from '../config';
import { tweetEngagement } from './rank';

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 1;
  return 1 - dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function dbscan(tweets: Tweet[], epsilon: number, minPts: number): { clusters: Tweet[][]; noise: Tweet[] } {
  const n = tweets.length;
  const visited = new Array<boolean>(n).fill(false);
  const clustered = new Array<boolean>(n).fill(false);
  const clusters: Tweet[][] = [];
  const noise: Tweet[] = [];

  function regionQuery(idx: number): number[] {
    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (idx === j) continue;
      const a = tweets[idx].embedding!;
      const b = tweets[j].embedding!;
      if (cosineDistance(a, b) <= epsilon) {
        neighbors.push(j);
      }
    }
    return neighbors;
  }

  function expandCluster(idx: number, neighbors: number[], cluster: Tweet[]): void {
    cluster.push(tweets[idx]);
    clustered[idx] = true;

    let i = 0;
    while (i < neighbors.length) {
      const ni = neighbors[i];
      if (!visited[ni]) {
        visited[ni] = true;
        const newNeighbors = regionQuery(ni);
        if (newNeighbors.length >= minPts) {
          for (const nn of newNeighbors) {
            if (!neighbors.includes(nn)) {
              neighbors.push(nn);
            }
          }
        }
      }
      if (!clustered[ni]) {
        cluster.push(tweets[ni]);
        clustered[ni] = true;
      }
      i++;
    }
  }

  for (let i = 0; i < n; i++) {
    if (visited[i] || !tweets[i].embedding) continue;
    visited[i] = true;
    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      noise.push(tweets[i]);
    } else {
      const cluster: Tweet[] = [];
      expandCluster(i, neighbors, cluster);
      clusters.push(cluster);
    }
  }

  return { clusters, noise };
}

function getClusterUrls(cluster: Tweet[]): Set<string> {
  const urls = new Set<string>();
  for (const t of cluster) {
    for (const url of t.entities?.urls ?? []) {
      urls.add(url);
    }
  }
  return urls;
}

function getClusterHashtags(cluster: Tweet[]): Set<string> {
  const tags = new Set<string>();
  for (const t of cluster) {
    for (const tag of t.entities?.hashtags ?? []) {
      tags.add(tag);
    }
  }
  return tags;
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const v of a) {
    if (b.has(v)) count++;
  }
  return count;
}

function conservativeMerge(clusters: Tweet[][]): Tweet[][] {
  const merged = new Array<boolean>(clusters.length).fill(false);
  const result: Tweet[][] = [];

  for (let i = 0; i < clusters.length; i++) {
    if (merged[i]) continue;
    const combined = [...clusters[i]];
    const urlsA = getClusterUrls(clusters[i]);
    const tagsA = getClusterHashtags(clusters[i]);

    for (let j = i + 1; j < clusters.length; j++) {
      if (merged[j]) continue;
      const urlsB = getClusterUrls(clusters[j]);
      const tagsB = getClusterHashtags(clusters[j]);

      const sharedUrls = intersectionSize(urlsA, urlsB);
      const sharedTags = intersectionSize(tagsA, tagsB);

      if (sharedUrls >= MERGE_MIN_SHARED_URLS || sharedTags >= MERGE_MIN_SHARED_TAGS) {
        for (const t of clusters[j]) combined.push(t);
        merged[j] = true;
      }
    }

    result.push(combined);
  }

  return result;
}

export function clusterTweets(tweets: Tweet[], epsilon: number, minPts: number): Tweet[][] {
  const withEmbeddings = tweets.filter((t) => t.embedding && t.embedding.length > 0);

  const { clusters, noise } = dbscan(withEmbeddings, epsilon, minPts);

  // Keep high-engagement noise tweets as singletons
  const singletons = noise
    .filter((t) => tweetEngagement(t) >= NOISE_MIN_ENGAGEMENT)
    .map((t) => [t]);

  const allClusters = [...clusters, ...singletons];
  return conservativeMerge(allClusters);
}
