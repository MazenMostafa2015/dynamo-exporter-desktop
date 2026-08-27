// Design system: the exporter is an offline-first desktop utility. Keep data deterministic, inspectable, and safe to review before a Revit run.

export type NodeKind = "query" | "core" | "action" | "python";

export interface GraphNodeSpec {
  id: string;
  title: string;
  code: string;
  type: NodeKind;
  x: number;
  y: number;
}

export interface GraphEdgeSpec {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
}

export interface GraphScenario {
  title: string;
  description: string;
  author: string;
  nodes: GraphNodeSpec[];
  edges: GraphEdgeSpec[];
}

export interface ParsedPorts {
  inputs: string[];
  outputs: string[];
}

export const nodeKinds: NodeKind[] = ["query", "core", "action", "python"];

export const nodeColors: Record<NodeKind, { fill: string; stroke: string; badge: string }> = {
  query: { fill: "#112d35", stroke: "#55d6c8", badge: "#baf7ed" },
  core: { fill: "#38270f", stroke: "#efb14c", badge: "#ffe2a8" },
  action: { fill: "#3b1925", stroke: "#ee7187", badge: "#ffc3cc" },
  python: { fill: "#183322", stroke: "#87d39b", badge: "#c9f4d3" },
};

export const nodeKindLabels: Record<NodeKind, string> = {
  query: "Query",
  core: "Core",
  action: "Action",
  python: "Python",
};

const reservedWords = new Set([
  "true", "false", "null", "if", "else", "return", "def", "for", "in", "while",
]);

const knownSymbols = new Set([
  "Categories", "Element", "List", "DSCore", "Point", "Vector", "Line", "Curve", "Surface",
  "Solid", "Geometry", "Color", "Math", "String", "Number", "Boolean", "FamilyInstance",
  "Level", "View", "Sheet", "Document", "AllElementsOfCategory", "Count", "Object",
]);

export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripLiteralsAndComments(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ");
}

export function parsePorts(code: string): ParsedPorts {
  const clean = stripLiteralsAndComments(code);
  const outputs: string[] = [];
  Array.from(clean.matchAll(/(?:^|;)\s*([A-Za-z_]\w*)\s*=(?!=)/g)).forEach((match) => {
    if (!outputs.includes(match[1])) outputs.push(match[1]);
  });

  const namespaces = new Set<string>();
  const methods = new Set<string>();
  const calls = new Set<string>();
  Array.from(clean.matchAll(/\b([A-Za-z_]\w*)\s*\./g)).forEach((match) => namespaces.add(match[1]));
  Array.from(clean.matchAll(/\.\s*([A-Za-z_]\w*)\b/g)).forEach((match) => methods.add(match[1]));
  Array.from(clean.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)).forEach((match) => calls.add(match[1]));

  const identifiers: string[] = [];
  Array.from(clean.matchAll(/\b[A-Za-z_]\w*\b/g)).forEach((match) => {
    if (!identifiers.includes(match[0])) identifiers.push(match[0]);
  });

  const inputs = identifiers.filter((identifier) =>
    !outputs.includes(identifier) &&
    !reservedWords.has(identifier) &&
    !knownSymbols.has(identifier) &&
    !namespaces.has(identifier) &&
    !methods.has(identifier) &&
    !calls.has(identifier)
  );
  return { inputs, outputs };
}

function codeBlockInput(name: string, id: string): Record<string, unknown> {
  return {
    Id: id,
    Name: name,
    Description: `Input variable ${name}`,
    UsingDefaultValue: false,
    Level: 2,
    UseLevels: false,
    KeepListStructure: false,
  };
}

function codeBlockOutput(name: string, id: string): Record<string, unknown> {
  return {
    Id: id,
    Name: name,
    Description: `Output variable ${name}`,
    Level: 2,
    UseLevels: false,
    KeepListStructure: false,
  };
}

export function ensureDynFilename(name: string): string {
  const safe = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "generated_graph";
  return safe.toLowerCase().endsWith(".dyn") ? safe : `${safe}.dyn`;
}

export function createDyn(scenario: GraphScenario): Record<string, unknown> {
  const graphId = generateUuid();
  const nodes: Array<Record<string, unknown>> = [];
  const views: Array<Record<string, unknown>> = [];
  const lookup = new Map<string, { id: string; inputs: Record<string, string>; outputs: Record<string, string> }>();

  for (const spec of scenario.nodes) {
    const nodeId = generateUuid();
    const ports = parsePorts(spec.code);
    const inputs: Record<string, string> = {};
    const outputs: Record<string, string> = {};
    ports.inputs.forEach((name) => { inputs[name] = generateUuid(); });
    ports.outputs.forEach((name) => { outputs[name] = generateUuid(); });
    lookup.set(spec.id, { id: nodeId, inputs, outputs });

    nodes.push({
      ConcreteType: "Dynamo.Graph.Nodes.CodeBlockNodeModel, CoreNodeModels",
      NodeType: "CodeBlockNode",
      Id: nodeId,
      Code: spec.code,
      Inputs: ports.inputs.map((name) => codeBlockInput(name, inputs[name])),
      Outputs: ports.outputs.map((name) => codeBlockOutput(name, outputs[name])),
      Replication: "Disabled",
      Description: "Allows for DesignScript code to be authored directly",
    });

    views.push({
      ConcreteType: "Dynamo.Graph.NodeViewModel, CoreNodeModels",
      Id: nodeId,
      Name: spec.title || "Code Block",
      IsVisible: true,
      IsUpstreamVisible: true,
      ShowGeometry: true,
      X: spec.x,
      Y: spec.y,
    });
  }

  const connectors: Array<Record<string, string>> = [];
  for (const edge of scenario.edges) {
    const source = lookup.get(edge.from);
    const target = lookup.get(edge.to);
    if (!source || !target) continue;
    const sourcePort = edge.fromPort && source.outputs[edge.fromPort]
      ? edge.fromPort
      : Object.keys(source.outputs).find((port) => Boolean(target.inputs[port]));
    const targetPort = edge.toPort && target.inputs[edge.toPort]
      ? edge.toPort
      : sourcePort && target.inputs[sourcePort]
        ? sourcePort
        : Object.keys(target.inputs)[0];
    if (!sourcePort || !targetPort) continue;
    connectors.push({ Id: generateUuid(), Start: source.outputs[sourcePort], End: target.inputs[targetPort] });
  }

  return {
    Uuid: graphId,
    IsCustomNode: false,
    Description: scenario.description || "Generated by Dynamo Exporter Tool",
    Name: ensureDynFilename(scenario.title).replace(/\.dyn$/i, ""),
    ElementResolver: { ResolutionMap: {} },
    Inputs: [],
    Outputs: [],
    Nodes: nodes,
    Connectors: connectors,
    Views: [{ CameraData: { X: 0, Y: 0, Z: 0 }, NodeViews: views, X: 0, Y: 0, Zoom: 1 }],
    CurrentWorkspace: graphId,
    EnableDebugFlags: false,
    VisibleInDynamo: true,
    Thumbnail: "",
    GraphDocumentationURL: "",
    Author: scenario.author || "Dynamo Exporter Tool",
    IsPackageImport: false,
    NodeLibraryDependencies: [],
    ApplicationVersion: "2.17.0.0",
  };
}

export function validateScenario(scenario: GraphScenario): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (!scenario.title.trim()) errors.push("Give the graph a filename before exporting.");
  if (scenario.nodes.length === 0) errors.push("Add at least one Code Block node.");

  for (const node of scenario.nodes) {
    if (!node.id.trim()) errors.push("Every node needs a unique id.");
    if (ids.has(node.id)) errors.push(`Duplicate node id: ${node.id}.`);
    ids.add(node.id);
    if (!node.code.trim()) errors.push(`${node.title || node.id} has no DesignScript code.`);
    if (!/\b[A-Za-z_]\w*\s*=(?!=)/.test(node.code)) errors.push(`${node.title || node.id} needs an assigned output variable.`);
  }

  for (const edge of scenario.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Connection ${edge.from} → ${edge.to} references a missing node.`);
    if (edge.from === edge.to) errors.push(`Connection ${edge.from} → ${edge.to} is a self-connection.`);
  }
  return errors;
}

export function mutationNodes(scenario: GraphScenario): GraphNodeSpec[] {
  return scenario.nodes.filter((node) => node.type === "action" || /setparameter|delete|bypoint|bycurve|move|rotate|override/i.test(node.code));
}

export function graphWarnings(scenario: GraphScenario): string[] {
  const warnings: string[] = [];
  for (const edge of scenario.edges) {
    const source = scenario.nodes.find((node) => node.id === edge.from);
    const target = scenario.nodes.find((node) => node.id === edge.to);
    if (!source || !target) continue;
    const sourcePorts = parsePorts(source.code).outputs;
    const targetPorts = parsePorts(target.code).inputs;
    if (!sourcePorts.length || !targetPorts.length) warnings.push(`${source.title} → ${target.title} has no detectable ports.`);
  }
  if (mutationNodes(scenario).length) warnings.push("Action nodes may mutate the active Revit model. Test on a detached backup first.");
  return warnings;
}

export function scenarioStats(scenario: GraphScenario) {
  return {
    nodes: scenario.nodes.length,
    edges: scenario.edges.length,
    inputs: scenario.nodes.reduce((sum, node) => sum + parsePorts(node.code).inputs.length, 0),
    outputs: scenario.nodes.reduce((sum, node) => sum + parsePorts(node.code).outputs.length, 0),
  };
}

export function downloadDyn(scenario: GraphScenario): void {
  const blob = new Blob([JSON.stringify(createDyn(scenario), null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, ensureDynFilename(scenario.title));
}

export function downloadJson(value: unknown, filename: string): void {
  downloadBlob(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" }), filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function safeJsonParse(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a JSON graph specification.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export function sanitizeScenario(value: unknown): GraphScenario {
  const source = (value || {}) as Record<string, unknown>;
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : [];
  const rawEdges = Array.isArray(source.edges) ? source.edges : [];
  const nodes: GraphNodeSpec[] = rawNodes.map((raw, index) => {
    const item = (raw || {}) as Record<string, unknown>;
    const code = String(item.code || "result = null;").trim();
    return {
      id: String(item.id || `n${index + 1}`),
      title: String(item.title || `Code Block ${index + 1}`),
      code: code.endsWith(";") ? code : `${code};`,
      type: nodeKinds.includes(item.type as NodeKind) ? item.type as NodeKind : "core",
      x: typeof item.x === "number" ? item.x : 80 + (index % 4) * 260,
      y: typeof item.y === "number" ? item.y : 90 + Math.floor(index / 4) * 150,
    };
  });
  const ids = new Set(nodes.map((node) => node.id));
  const edges: GraphEdgeSpec[] = rawEdges.flatMap((raw) => {
    if (Array.isArray(raw) && raw.length >= 2) return [{ from: String(raw[0]), to: String(raw[1]) }];
    if (raw && typeof raw === "object") {
      const item = raw as Record<string, unknown>;
      if (!item.from || !item.to) return [];
      return [{ from: String(item.from), to: String(item.to), fromPort: item.fromPort ? String(item.fromPort) : undefined, toPort: item.toPort ? String(item.toPort) : undefined }];
    }
    return [];
  }).filter((edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to);
  return {
    title: ensureDynFilename(String(source.title || "generated_graph.dyn")),
    description: String(source.description || "Generated by Dynamo Exporter Tool"),
    author: String(source.author || "Dynamo Exporter Tool"),
    nodes,
    edges,
  };
}

export const llmSystemPrompt = `Return JSON only with {"title":"file.dyn","description":"...","nodes":[{"id":"n1","title":"...","type":"query|core|action|python","code":"output = Function(input);","x":80,"y":80}],"edges":[{"from":"n1","to":"n2","fromPort":"output","toPort":"input"}]}. Every node must be a one-line DesignScript Code Block assignment. Referenced input names must match upstream output names. Keep nodes left-to-right and do not return prose.`;

export async function requestLlmScenario(endpoint: string, apiKey: string, prompt: string): Promise<GraphScenario> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1800,
      temperature: 0,
      system: llmSystemPrompt,
      messages: [{ role: "user", content: prompt.slice(0, 4000) }],
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status}). ${(await response.text()).slice(0, 160)}`);
  const data = await response.json() as { content?: Array<{ text?: string }> };
  const text = data.content?.map((item) => item.text || "").join("\n") || "";
  return sanitizeScenario(safeJsonParse(text));
}

export const exampleScenarios: Record<string, GraphScenario> = {
  rooms: {
    title: "renumber_rooms_level_03.dyn",
    description: "Filter Level 03 rooms, sort them north-to-south, and write sequential Number values.",
    author: "Dynamo Exporter Tool",
    nodes: [
      { id: "n1", title: "Rooms category", type: "query", code: 'cat = Categories.ByName("OST_Rooms");', x: 60, y: 90 },
      { id: "n2", title: "Room elements", type: "query", code: "elems = AllElementsOfCategory(cat);", x: 330, y: 90 },
      { id: "n3", title: "Level values", type: "core", code: 'levels = Element.GetParameterValueByName(elems, "Level");', x: 600, y: 90 },
      { id: "n4", title: "Level mask", type: "core", code: 'mask = levels == "Level 03";', x: 870, y: 90 },
      { id: "n5", title: "Filtered rooms", type: "core", code: 'filtered = List.FilterByBoolMask(elems, mask)["in"];', x: 600, y: 270 },
      { id: "n6", title: "Room positions", type: "core", code: "locations = Element.GetLocation(filtered);", x: 870, y: 270 },
      { id: "n7", title: "North-south key", type: "core", code: "ys = locations.Y;", x: 1140, y: 270 },
      { id: "n8", title: "Sorted rooms", type: "core", code: 'sorted = List.SortByKey(filtered, ys)["sorted list"];', x: 1140, y: 450 },
      { id: "n9", title: "Sequence", type: "core", code: "seq = Number.Sequence(301, 1, Count(sorted));", x: 1410, y: 450 },
      { id: "n10", title: "Write Number", type: "action", code: 'result = Element.SetParameterByName(sorted, "Number", seq);', x: 1680, y: 450 },
    ],
    edges: [
      { from: "n1", to: "n2", fromPort: "cat", toPort: "cat" },
      { from: "n2", to: "n3", fromPort: "elems", toPort: "elems" },
      { from: "n3", to: "n4", fromPort: "levels", toPort: "levels" },
      { from: "n2", to: "n5", fromPort: "elems", toPort: "elems" },
      { from: "n4", to: "n5", fromPort: "mask", toPort: "mask" },
      { from: "n5", to: "n6", fromPort: "filtered", toPort: "filtered" },
      { from: "n6", to: "n7", fromPort: "locations", toPort: "locations" },
      { from: "n5", to: "n8", fromPort: "filtered", toPort: "filtered" },
      { from: "n7", to: "n8", fromPort: "ys", toPort: "ys" },
      { from: "n8", to: "n9", fromPort: "sorted", toPort: "sorted" },
      { from: "n8", to: "n10", fromPort: "sorted", toPort: "sorted" },
      { from: "n9", to: "n10", fromPort: "seq", toPort: "seq" },
    ],
  },
  doors: {
    title: "export_wide_doors.dyn",
    description: "Collect doors, read their Width parameter, and prepare a schedule dataset.",
    author: "Dynamo Exporter Tool",
    nodes: [
      { id: "n1", title: "Doors category", type: "query", code: 'cat = Categories.ByName("OST_Doors");', x: 60, y: 120 },
      { id: "n2", title: "Door elements", type: "query", code: "doors = AllElementsOfCategory(cat);", x: 330, y: 120 },
      { id: "n3", title: "Width values", type: "core", code: 'widths = Element.GetParameterValueByName(doors, "Width");', x: 600, y: 120 },
      { id: "n4", title: "Wide-door mask", type: "core", code: "wideMask = widths > 900;", x: 870, y: 120 },
      { id: "n5", title: "Filtered doors", type: "core", code: 'wideDoors = List.FilterByBoolMask(doors, wideMask)["in"];', x: 1140, y: 120 },
      { id: "n6", title: "Schedule rows", type: "core", code: "rows = DSCore.List.Create(wideDoors, widths);", x: 1410, y: 120 },
    ],
    edges: [
      { from: "n1", to: "n2", fromPort: "cat", toPort: "cat" },
      { from: "n2", to: "n3", fromPort: "doors", toPort: "doors" },
      { from: "n3", to: "n4", fromPort: "widths", toPort: "widths" },
      { from: "n2", to: "n5", fromPort: "doors", toPort: "doors" },
      { from: "n4", to: "n5", fromPort: "wideMask", toPort: "wideMask" },
      { from: "n5", to: "n6", fromPort: "wideDoors", toPort: "wideDoors" },
      { from: "n3", to: "n6", fromPort: "widths", toPort: "widths" },
    ],
  },
  grids: {
    title: "place_columns_at_grids.dyn",
    description: "Collect grids, extract their curves, and pass them to a placement action.",
    author: "Dynamo Exporter Tool",
    nodes: [
      { id: "n1", title: "Grid category", type: "query", code: 'gridCat = Categories.ByName("OST_Grids");', x: 60, y: 120 },
      { id: "n2", title: "Grid elements", type: "query", code: "grids = AllElementsOfCategory(gridCat);", x: 330, y: 120 },
      { id: "n3", title: "Grid curves", type: "core", code: "curves = Element.GetLocation(grids);", x: 600, y: 120 },
      { id: "n4", title: "Intersection points", type: "core", code: "points = Geometry.Intersect(curves, curves);", x: 870, y: 120 },
      { id: "n5", title: "Place columns", type: "action", code: "result = FamilyInstance.ByPointAndLevel(points, level, familyType);", x: 1140, y: 120 },
    ],
    edges: [
      { from: "n1", to: "n2", fromPort: "gridCat", toPort: "gridCat" },
      { from: "n2", to: "n3", fromPort: "grids", toPort: "grids" },
      { from: "n3", to: "n4", fromPort: "curves", toPort: "curves" },
      { from: "n4", to: "n5", fromPort: "points", toPort: "points" },
    ],
  },
};

export function generateOfflineScenario(prompt: string): { scenario: GraphScenario; matchedTemplate: string | null } {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("room") || normalized.includes("renumber")) return { scenario: clone(exampleScenarios.rooms), matchedTemplate: "rooms" };
  if (normalized.includes("door") || normalized.includes("excel") || normalized.includes("schedule")) return { scenario: clone(exampleScenarios.doors), matchedTemplate: "doors" };
  if (normalized.includes("grid") || normalized.includes("column")) return { scenario: clone(exampleScenarios.grids), matchedTemplate: "grids" };

  const category = normalized.includes("wall") ? "OST_Walls" : normalized.includes("window") ? "OST_Windows" : normalized.includes("floor") ? "OST_Floors" : "OST_GenericModel";
  return {
    matchedTemplate: null,
    scenario: {
      title: "offline_starter_graph.dyn",
      description: `Offline starter graph for: ${prompt.trim() || "custom Revit automation"}.`,
      author: "Dynamo Exporter Tool",
      nodes: [
        { id: "n1", title: "Category", type: "query", code: `cat = Categories.ByName("${category}");`, x: 80, y: 120 },
        { id: "n2", title: "Elements", type: "query", code: "elems = AllElementsOfCategory(cat);", x: 360, y: 120 },
        { id: "n3", title: "Review and extend", type: "core", code: "result = elems;", x: 640, y: 120 },
      ],
      edges: [
        { from: "n1", to: "n2", fromPort: "cat", toPort: "cat" },
        { from: "n2", to: "n3", fromPort: "elems", toPort: "elems" },
      ],
    },
  };
}

export function matchingPorts(source: GraphNodeSpec, target: GraphNodeSpec): { sourcePort?: string; targetPort?: string } {
  const sourceOutputs = parsePorts(source.code).outputs;
  const targetInputs = parsePorts(target.code).inputs;
  const direct = sourceOutputs.find((port) => targetInputs.includes(port));
  return direct ? { sourcePort: direct, targetPort: direct } : { sourcePort: sourceOutputs[0], targetPort: targetInputs[0] };
}

export function makeEdge(source: GraphNodeSpec, target: GraphNodeSpec): GraphEdgeSpec {
  const ports = matchingPorts(source, target);
  return { from: source.id, to: target.id, fromPort: ports.sourcePort, toPort: ports.targetPort };
}

export function copyScenario<T>(scenario: T): T {
  return clone(scenario);
}

export function createBlankNode(index: number): GraphNodeSpec {
  return { id: `n${index + 1}`, title: "New Code Block", type: "core", code: "result = null;", x: 80 + (index % 4) * 260, y: 100 + Math.floor(index / 4) * 150 };
}

export function readStoredApiKey(): string {
  try { return localStorage.getItem("dynamo-exporter-anthropic-api-key") || ""; } catch { return ""; }
}

export function storeApiKey(value: string): void {
  try { value ? localStorage.setItem("dynamo-exporter-anthropic-api-key", value) : localStorage.removeItem("dynamo-exporter-anthropic-api-key"); } catch { /* optional browser storage */ }
}

export function graphJson(scenario: GraphScenario): string {
  return JSON.stringify(createDyn(scenario), null, 2);
}

export function isMutating(scenario: GraphScenario): boolean {
  return mutationNodes(scenario).length > 0;
}

export function graphHealth(scenario: GraphScenario): "ready" | "review" | "blocked" {
  if (validateScenario(scenario).length) return "blocked";
  if (graphWarnings(scenario).length) return "review";
  return "ready";
}

export function nodeDimensions(node: GraphNodeSpec): { width: number; height: number } {
  const ports = parsePorts(node.code);
  return { width: Math.max(214, Math.min(310, 160 + node.title.length * 4)), height: 108 + Math.max(ports.inputs.length, ports.outputs.length) * 13 };
}

export function graphBounds(nodes: GraphNodeSpec[]): { width: number; height: number } {
  return {
    width: Math.max(1100, ...nodes.map((node) => node.x + nodeDimensions(node).width + 100)),
    height: Math.max(620, ...nodes.map((node) => node.y + nodeDimensions(node).height + 100)),
  };
}

export function edgeKey(edge: GraphEdgeSpec): string {
  return `${edge.from}:${edge.fromPort || "*"}->${edge.to}:${edge.toPort || "*"}`;
}

export function dedupeEdges(edges: GraphEdgeSpec[]): GraphEdgeSpec[] {
  const result: GraphEdgeSpec[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = edgeKey(edge);
    if (!seen.has(key)) { seen.add(key); result.push(edge); }
  }
  return result;
}

export function safeTitle(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "generated_graph";
}

export function graphFileName(scenario: GraphScenario): string {
  return ensureDynFilename(safeTitle(scenario.title));
}

export function scenarioWithNodes(scenario: GraphScenario, nodes: GraphNodeSpec[]): GraphScenario {
  return { ...scenario, nodes };
}

export function scenarioWithEdges(scenario: GraphScenario, edges: GraphEdgeSpec[]): GraphScenario {
  return { ...scenario, edges: dedupeEdges(edges) };
}

export function downloadScenarioJson(scenario: GraphScenario): void {
  downloadJson(createDyn(scenario), `${safeTitle(scenario.title)}.json`);
}

export function inputNames(node: GraphNodeSpec): string[] { return parsePorts(node.code).inputs; }
export function outputNames(node: GraphNodeSpec): string[] { return parsePorts(node.code).outputs; }
export function nodePortSummary(node: GraphNodeSpec): string { return `${inputNames(node).length} in · ${outputNames(node).length} out`; }
export function nodeColor(node: GraphNodeSpec): { fill: string; stroke: string; badge: string } { return nodeColors[node.type]; }
export function nodeKindLabel(node: GraphNodeSpec): string { return nodeKindLabels[node.type]; }
export function scenarioDescription(scenario: GraphScenario): string { return `${scenario.nodes.length} nodes · ${scenario.edges.length} connectors`; }
export function schemaFields(): string[] { return ["Uuid", "ElementResolver", "Nodes", "Connectors", "Views"]; }
export function graphMutationNames(scenario: GraphScenario): string[] { return mutationNodes(scenario).map((node) => node.title); }
export function scenarioIsReady(scenario: GraphScenario): boolean { return validateScenario(scenario).length === 0 && scenario.nodes.length > 0; }
export function graphWarningsText(scenario: GraphScenario): string[] { return graphWarnings(scenario); }
export function graphStats(scenario: GraphScenario) { return scenarioStats(scenario); }
export function scenarioTitle(scenario: GraphScenario): string { return safeTitle(scenario.title); }
export function outputPortExists(node: GraphNodeSpec, name: string): boolean { return outputNames(node).includes(name); }
export function inputPortExists(node: GraphNodeSpec, name: string): boolean { return inputNames(node).includes(name); }
export function allScenarioPorts(scenario: GraphScenario): string[] { return scenario.nodes.flatMap((node) => [...inputNames(node), ...outputNames(node)]); }
export function graphHasPorts(scenario: GraphScenario): boolean { return allScenarioPorts(scenario).length > 0; }
export function graphNodeCount(scenario: GraphScenario): number { return scenario.nodes.length; }
export function graphEdgeCount(scenario: GraphScenario): number { return scenario.edges.length; }
export function graphInputCount(scenario: GraphScenario): number { return scenarioStats(scenario).inputs; }
export function graphOutputCount(scenario: GraphScenario): number { return scenarioStats(scenario).outputs; }
export function graphSchemaLabel(): string { return "CodeBlockNodeModel-compatible JSON"; }
export function graphOfflineLabel(): string { return "Offline-ready"; }
export function graphLlmLabel(): string { return "Optional LLM"; }
export function graphActionLabel(scenario: GraphScenario): string { return isMutating(scenario) ? "Mutating graph" : "Read-only graph"; }
export function graphModeDescription(mode: "offline" | "llm"): string { return mode === "offline" ? "Templates, editing, SVG rendering, validation, and export run without a network." : "Your browser sends the request to the configured provider only when you ask for LLM assistance."; }
export function localApiKeyNote(): string { return "The optional key is stored locally in this browser only."; }
export function defaultPrompt(): string { return "Renumber all rooms on Level 3 sequentially from north to south"; }
export function supportedTemplates(): string[] { return ["Renumber rooms", "Export doors", "Place columns"]; }
export function cloneScenario(scenario: GraphScenario): GraphScenario { return clone(scenario); }
export function normalizeScenario(scenario: GraphScenario): GraphScenario { return { ...scenario, title: ensureDynFilename(scenario.title), edges: dedupeEdges(scenario.edges) }; }
export function removeNode(scenario: GraphScenario, nodeId: string): GraphScenario { return { ...scenario, nodes: scenario.nodes.filter((node) => node.id !== nodeId), edges: scenario.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId) }; }
export function addNode(scenario: GraphScenario, node: GraphNodeSpec): GraphScenario { return { ...scenario, nodes: [...scenario.nodes, node] }; }
export function replaceNode(scenario: GraphScenario, nodeId: string, update: Partial<GraphNodeSpec>): GraphScenario { return { ...scenario, nodes: scenario.nodes.map((node) => node.id === nodeId ? { ...node, ...update } : node) }; }
export function addConnection(scenario: GraphScenario, edge: GraphEdgeSpec): GraphScenario { return scenarioWithEdges(scenario, [...scenario.edges, edge]); }
export function removeConnection(scenario: GraphScenario, edge: GraphEdgeSpec): GraphScenario { const key = edgeKey(edge); return scenarioWithEdges(scenario, scenario.edges.filter((item) => edgeKey(item) !== key)); }
export function canConnect(source: GraphNodeSpec, target: GraphNodeSpec): boolean { return Boolean(matchingPorts(source, target).sourcePort && matchingPorts(source, target).targetPort); }
export function sourceNodes(scenario: GraphScenario): GraphNodeSpec[] { const targets = new Set(scenario.edges.map((edge) => edge.to)); return scenario.nodes.filter((node) => !targets.has(node.id)); }
export function sinkNodes(scenario: GraphScenario): GraphNodeSpec[] { const sources = new Set(scenario.edges.map((edge) => edge.from)); return scenario.nodes.filter((node) => !sources.has(node.id)); }
export function hasDisconnectedNodes(scenario: GraphScenario): boolean { return scenario.nodes.some((node) => !scenario.edges.some((edge) => edge.from === node.id || edge.to === node.id)); }
export function disconnectedNames(scenario: GraphScenario): string[] { return scenario.nodes.filter((node) => !scenario.edges.some((edge) => edge.from === node.id || edge.to === node.id)).map((node) => node.title); }
export function scenarioSchemaReady(scenario: GraphScenario): boolean { const json = createDyn(scenario); return Boolean(json.Uuid && json.ElementResolver && json.Nodes && json.Connectors && json.Views); }
export function graphSafetyNote(scenario: GraphScenario): string { return isMutating(scenario) ? "Review action nodes on a detached backup before running." : "No action nodes detected; still review the graph in Dynamo."; }
export function graphReadyLabel(scenario: GraphScenario): string { const health = graphHealth(scenario); return health === "ready" ? "Ready to export" : health === "review" ? "Review suggested" : "Fix errors"; }
export function graphPortLabel(node: GraphNodeSpec): string { return `${outputNames(node).join(", ") || "—"} ← ${inputNames(node).join(", ") || "—"}`; }
export function graphNodeStatus(node: GraphNodeSpec, scenario: GraphScenario): string { return `${scenario.edges.filter((edge) => edge.to === node.id).length} in · ${scenario.edges.filter((edge) => edge.from === node.id).length} out`; }
export function graphNodeRole(node: GraphNodeSpec): string { return `${nodeKindLabel(node)} Code Block`; }
export function graphNodeA11yLabel(node: GraphNodeSpec): string { return `${node.title}, ${graphNodeRole(node)}, ${nodePortSummary(node)}`; }
export function graphConnectionLabel(edge: GraphEdgeSpec): string { return `${edge.fromPort || "output"} → ${edge.toPort || "input"}`; }
export function graphJsonSize(scenario: GraphScenario): string { const bytes = new Blob([graphJson(scenario)]).size; return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`; }
export function graphHealthColor(scenario: GraphScenario): string { const health = graphHealth(scenario); return health === "ready" ? "#55d6c8" : health === "review" ? "#efb14c" : "#ee7187"; }
export function scenarioExportSummary(scenario: GraphScenario): string { return `${graphFileName(scenario)} · ${scenarioDescription(scenario)} · ${graphJsonSize(scenario)}`; }
export function validateAndNormalize(scenario: GraphScenario): { scenario: GraphScenario; errors: string[]; warnings: string[] } { const normalized = normalizeScenario(scenario); return { scenario: normalized, errors: validateScenario(normalized), warnings: graphWarnings(normalized) }; }
export function graphVersion(): string { return "offline-1.0"; }
export function graphApplicationVersion(): string { return "2.17.0.0"; }
export function graphNodeModel(): string { return "CodeBlockNodeModel"; }
export function graphElementResolver(): string { return "ElementResolver"; }
export function graphViewMetadata(): string { return "NodeViews + X/Y + Zoom"; }
export function graphConnectorMetadata(): string { return "Start → End port UUIDs"; }
export function graphExportDescription(): string { return "Generates a JSON .dyn graph with UUIDs, Code Block nodes, connectors, and view metadata."; }
export function graphParserDescription(): string { return "Assigned variables become outputs; referenced variables become inputs."; }
export function graphOfflineDescription(): string { return "No server, account, or network is required for deterministic graph building and export."; }
export function graphLlmDescription(): string { return "Optional client-side LLM mode requires your own endpoint, API key, and network access."; }
export function graphSafetyDescription(): string { return "Dynamo and Revit compatibility should be verified in the installed environment before model changes."; }
export function graphToolTitle(): string { return "Dynamo Exporter Tool"; }
export function graphToolTagline(): string { return "Build valid .dyn files without leaving the browser."; }
export function graphToolFooter(): string { return "Offline-first graph builder for AEC automation teams."; }

export default { createDyn, parsePorts, downloadDyn, validateScenario, generateOfflineScenario };
