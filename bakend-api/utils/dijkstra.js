// Maximum number of unique stops for which we brute-force every permutation.
// Above this, n! explodes (8! = 40,320 orderings, each needing several BFS runs),
// so we fall back to a nearest-neighbour + 2-opt heuristic instead.
const MAX_EXACT_STOPS = 7;

/**
 * Find the shortest route: start -> (visit all stops) -> end.
 * Uses an exact permutation search for small stop counts and a
 * nearest-neighbour + 2-opt heuristic for large ones.
 */
function findShortestPath(graphData, start, stops, end) {
  if (!stops || stops.length === 0) {
    // If no stops, just go from start to end
    return findPathBetween(graphData, start, end);
  }

  // De-duplicate stops defensively so repeated aisles don't inflate the search
  const uniqueStops = [...new Set(stops)];

  if (uniqueStops.length <= MAX_EXACT_STOPS) {
    return findExactPath(graphData, start, uniqueStops, end);
  }
  return findHeuristicPath(graphData, start, uniqueStops, end);
}

// Exact solution: try every ordering of the stops and keep the shortest.
function findExactPath(graphData, start, stops, end) {
  let bestPath = null;
  let bestLength = Infinity;

  for (const order of getPermutations(stops)) {
    const result = buildPathFromOrder(graphData, start, order, end);
    if (result && result.length < bestLength) {
      bestLength = result.length;
      bestPath = result.path;
    }
  }

  return bestPath || [];
}

// Heuristic solution for many stops: greedy nearest-neighbour, refined with 2-opt.
function findHeuristicPath(graphData, start, stops, end) {
  const dist = computeDistanceMatrix(graphData, [start, ...stops, end]);

  let order = nearestNeighbourOrder(dist, start, stops);
  order = twoOptImprove(dist, start, order, end);

  const result = buildPathFromOrder(graphData, start, order, end);
  return result ? result.path : [];
}

// Build the full node-by-node path for a given stop ordering, plus its total length.
// Returns null if any required segment is unreachable.
function buildPathFromOrder(graphData, start, order, end) {
  let currentPath = [start];
  let currentLength = 0;
  let prev = start;

  for (const stop of order) {
    const segment = findPathBetween(graphData, prev, stop);
    if (segment.length === 0) return null;
    currentPath = currentPath.concat(segment.slice(1));
    currentLength += getPathLength(graphData, segment);
    prev = stop;
  }

  const finalSegment = findPathBetween(graphData, prev, end);
  if (finalSegment.length === 0) return null;
  currentPath = currentPath.concat(finalSegment.slice(1));
  currentLength += getPathLength(graphData, finalSegment);

  return { path: currentPath, length: currentLength };
}

// Pre-compute shortest distances between every pair of the given nodes.
function computeDistanceMatrix(graphData, nodes) {
  const dist = {};
  for (const a of nodes) {
    dist[a] = {};
    for (const b of nodes) {
      if (a === b) {
        dist[a][b] = 0;
        continue;
      }
      const segment = findPathBetween(graphData, a, b);
      dist[a][b] = segment.length === 0 ? Infinity : getPathLength(graphData, segment);
    }
  }
  return dist;
}

// Greedy ordering: repeatedly visit the nearest not-yet-visited stop.
function nearestNeighbourOrder(dist, start, stops) {
  const remaining = new Set(stops);
  const order = [];
  let current = start;

  while (remaining.size > 0) {
    let best = null;
    let bestDistance = Infinity;
    for (const stop of remaining) {
      const d = dist[current][stop];
      if (d < bestDistance) {
        bestDistance = d;
        best = stop;
      }
    }
    if (best === null) break; // remaining stops unreachable
    order.push(best);
    remaining.delete(best);
    current = best;
  }

  return order;
}

// 2-opt: reverse sub-segments for as long as it keeps shortening the tour.
function twoOptImprove(dist, start, order, end) {
  const tourLength = (candidate) => {
    if (candidate.length === 0) return dist[start][end] ?? Infinity;
    let len = dist[start][candidate[0]];
    for (let i = 0; i < candidate.length - 1; i++) {
      len += dist[candidate[i]][candidate[i + 1]];
    }
    len += dist[candidate[candidate.length - 1]][end];
    return len;
  };

  let best = order.slice();
  let bestLength = tourLength(best);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best
          .slice(0, i)
          .concat(best.slice(i, j + 1).reverse())
          .concat(best.slice(j + 1));
        const candidateLength = tourLength(candidate);
        if (candidateLength < bestLength - 1e-9) {
          best = candidate;
          bestLength = candidateLength;
          improved = true;
        }
      }
    }
  }

  return best;
}

function findPathBetween(graphData, start, end) {
  const visited = new Set();
  const queue = [[start, [start]]];

  while (queue.length) {
    const [current, path] = queue.shift();

    if (current === end) {
      return path;
    }

    visited.add(current);
    const neighbors = graphData.edges[current] || {};

    for (const [neighbor, _] of Object.entries(neighbors)) {
      if (!visited.has(neighbor)) {
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return [];
}

function getPathLength(graphData, path) {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    length += graphData.edges[current][next] || 1;
  }
  return length;
}

function getPermutations(arr) {
  if (arr.length <= 1) return [arr];

  const perms = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const remainingPerms = getPermutations(remaining);

    for (const perm of remainingPerms) {
      perms.push([current, ...perm]);
    }
  }

  return perms;
}

module.exports = { findShortestPath };
