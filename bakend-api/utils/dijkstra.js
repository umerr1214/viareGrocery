function findShortestPath(graphData, start, stops, end) {
  const visited = new Set();
  const queue = [[start, [start]]];
  const targetStops = new Set(stops);
  let shortest = [];

  while (queue.length) {
    const [current, path] = queue.shift();
    if (targetStops.size === 0 && current === end) {
      shortest = path;
      break;
    }

    visited.add(current);

    const neighbors = graphData.edges[current] || {};
    for (const [neighbor, _] of Object.entries(neighbors)) {
      if (!visited.has(neighbor)) {
        const newPath = [...path, neighbor];
        if (targetStops.has(neighbor)) targetStops.delete(neighbor);
        queue.push([neighbor, newPath]);
      }
    }
  }

  return shortest;
}

module.exports = { findShortestPath };
