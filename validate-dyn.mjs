// Deterministic smoke test for a downloaded Dynamo .dyn JSON file.
import { readFile } from "node:fs/promises";

const path = process.argv[2] || "/home/ubuntu/Downloads/renumber_rooms_level_03.dyn";
const graph = JSON.parse(await readFile(path, "utf8"));
const required = ["Uuid", "ElementResolver", "Nodes", "Connectors", "Views"];
const missing = required.filter((key) => !(key in graph));
const nodeErrors = graph.Nodes.filter((node) => node.NodeType !== "CodeBlockNode" || !node.Id || typeof node.Code !== "string");
const connectorErrors = graph.Connectors.filter((connector) => !connector.Id || !connector.Start || !connector.End);
const viewErrors = graph.Views.flatMap((view) => view.NodeViews || []).filter((view) => !view.Id || typeof view.X !== "number" || typeof view.Y !== "number");
if (missing.length || nodeErrors.length || connectorErrors.length || viewErrors.length) {
  console.error(JSON.stringify({ missing, nodeErrors: nodeErrors.length, connectorErrors: connectorErrors.length, viewErrors: viewErrors.length }));
  process.exit(1);
}
console.log(JSON.stringify({ uuid: graph.Uuid, nodes: graph.Nodes.length, connectors: graph.Connectors.length, views: graph.Views[0]?.NodeViews?.length || 0, status: "valid-shape" }));
