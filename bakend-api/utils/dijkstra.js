function findShortestPath(graphData, start, stops, end) {
  if (!stops || stops.length === 0) {
    // If no stops, just go from start to end
    return findPathBetween(graphData, start, end);
  }

  // Find the shortest path that visits all stops
  let bestPath = null;
  let bestLength = Infinity;

  // Try all possible permutations of stops
  const permutations = getPermutations(stops);
  
  for (const stopOrder of permutations) {
    let currentPath = [start];
    let currentLength = 0;
    let validPath = true;

    // Build path through stops in this order
    for (let i = 0; i < stopOrder.length; i++) {
      const from = i === 0 ? start : stopOrder[i - 1];
      const to = stopOrder[i];
      const segment = findPathBetween(graphData, from, to);
      
      if (segment.length === 0) {
        validPath = false;
        break;
      }
      
      // Add segment (excluding the first node to avoid duplication)
      currentPath = currentPath.concat(segment.slice(1));
      currentLength += getPathLength(graphData, segment);
    }

    // Add path from last stop to end
    if (validPath) {
      const finalSegment = findPathBetween(graphData, stopOrder[stopOrder.length - 1], end);
      if (finalSegment.length > 0) {
        currentPath = currentPath.concat(finalSegment.slice(1));
        currentLength += getPathLength(graphData, finalSegment);
        
        if (currentLength < bestLength) {
          bestLength = currentLength;
          bestPath = [...currentPath];
        }
      }
    }
  }

  return bestPath || [];
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
