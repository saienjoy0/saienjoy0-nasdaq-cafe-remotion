type AuthoredCausalPath = {
  nodeIds: string[];
  arrows: Array<{fromNodeId: string; toNodeId: string; path?: string}>;
  nodeOrder: string[];
  outcomeNodeId: string | null;
};

export const assertAuthoredCausalPath = (graph: AuthoredCausalPath, path: string) => {
  const fail = (field: string, message: string): never => {
    const fieldPath = field.startsWith("$") ? field : `${path}.${field}`;
    throw new Error(`E_AUTHORED_CAUSAL_PATH_INVALID:${fieldPath}: ${message}; RETURN_TO_STORY: author a bounded explicit path or separate Beats without inventing or reordering edges`);
  };
  const nodeIds = new Set(graph.nodeIds);
  if (graph.nodeIds.length < 2 || graph.nodeIds.length > 4 || nodeIds.size !== graph.nodeIds.length) {
    fail("objectIds", "requires two to four unique authored nodes; text is not a causal graph");
  }
  if (graph.arrows.length < 1 || graph.arrows.length > 3) fail("objectIds", "requires one to three authored arrows");
  if (graph.nodeOrder.length !== nodeIds.size || new Set(graph.nodeOrder).size !== nodeIds.size || graph.nodeOrder.some((id) => !nodeIds.has(id))) {
    fail("templateConfig.nodeOrder", "must cover every selected node exactly once in authored display order");
  }
  if (graph.outcomeNodeId !== null && !nodeIds.has(graph.outcomeNodeId)) fail("templateConfig.outcomeNodeId", "must be null or an authored selected node");
  const edges = new Set<string>();
  for (const [index, arrow] of graph.arrows.entries()) {
    const arrowPath = arrow.path ?? `${path}.arrows[${index}]`;
    if (!nodeIds.has(arrow.fromNodeId)) fail(`${arrowPath}.fromNodeId`, "must be a selected authored node");
    if (!nodeIds.has(arrow.toNodeId)) fail(`${arrowPath}.toNodeId`, "must be a selected authored node");
    const fromIndex = graph.nodeOrder.indexOf(arrow.fromNodeId);
    if (graph.nodeOrder[fromIndex + 1] !== arrow.toNodeId) fail(arrowPath, "this path layout supports only explicitly authored adjacent edges; unsupported edges cannot be dropped");
    const edgeKey = JSON.stringify([arrow.fromNodeId, arrow.toNodeId]);
    if (edges.has(edgeKey)) fail(arrowPath, "duplicate endpoint pair");
    edges.add(edgeKey);
  }
};

export const assertBeatAuthoredCausalPath = (
  scene: {nodes: Array<{nodeId: string}>; arrows: Array<{arrowId: string; fromNodeId: string; toNodeId: string}>},
  beat: {visualTemplate: string; objectIds: string[]; templateConfig: {nodeOrder: string[]; outcomeNodeId: string | null}; shots?: Array<{shotRecipe: string}>},
  path: string,
) => {
  if (!["causal-lane", "macro-pressure"].includes(beat.visualTemplate) && !(beat.shots ?? []).some((shot) => shot.shotRecipe === "causal-build")) return;
  const selected = new Set(beat.objectIds);
  const scenePath = path.replace(/\.visualBeats\[\d+\]$/u, "");
  assertAuthoredCausalPath({
    nodeIds: scene.nodes.filter((node) => selected.has(node.nodeId)).map((node) => node.nodeId),
    arrows: scene.arrows.flatMap((arrow, index) => selected.has(arrow.arrowId) ? [{...arrow, path: `${scenePath}.arrows[${index}]`}] : []),
    nodeOrder: beat.templateConfig.nodeOrder,
    outcomeNodeId: beat.templateConfig.outcomeNodeId,
  }, path);
};
