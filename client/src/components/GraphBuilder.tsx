// Design reminder: this is the working utility, not a marketing surface. Use compact controls, deep graphite canvas, paper panels, and unmistakable status feedback.

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  Download,
  FileJson,
  FolderOpen,
  Info,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addConnection,
  cloneScenario,
  createBlankNode,
  createDyn,
  defaultPrompt,
  downloadDyn,
  downloadJson,
  exampleScenarios,
  generateOfflineScenario,
  graphBounds,
  graphFileName,
  graphHealth,
  graphJson,
  graphModeDescription,
  graphNodeCount,
  graphNodeStatus,
  graphSafetyNote,
  graphStats,
  graphWarnings,
  graphWarningsText,
  inputNames,
  matchingPorts,
  mutationNodes,
  nodeColors,
  nodeDimensions,
  nodeKindLabels,
  outputNames,
  parsePorts,
  readStoredApiKey,
  removeConnection,
  removeNode,
  replaceNode,
  readStoredTemplates,
  requestLlmScenario,
  renameStoredTemplate,
  saveStoredTemplate,
  deleteStoredTemplate,
  scenarioStats,
  storeApiKey,
  validateAndNormalize,
  type GraphEdgeSpec,
  type GraphNodeSpec,
  type GraphScenario,
  type NodeKind,
  type StoredGraphTemplate,
} from "@/lib/dyn-exporter";

type TemplateCategory = "all" | "Rooms" | "Schedules" | "Sheets" | "Parameters" | "Geometry" | "Placement";

type TemplateMeta = { key: keyof typeof exampleScenarios; title: string; eyebrow: string; description: string; category: Exclude<TemplateCategory, "all">; keywords: string };

const TEMPLATE_META: TemplateMeta[] = [
  { key: "rooms", title: "Renumber rooms", eyebrow: "Write-back", description: "Level filter → north/south sort → Number parameter", category: "Rooms", keywords: "room renumber level number write-back" },
  { key: "doors", title: "Export wide doors", eyebrow: "Data prep", description: "Width filter → schedule-ready dataset", category: "Schedules", keywords: "door width excel schedule export" },
  { key: "grids", title: "Place columns", eyebrow: "Placement", description: "Grid curves → intersections → placement", category: "Placement", keywords: "grid column intersection family placement" },
  { key: "schedules", title: "Audit schedules", eyebrow: "Review", description: "Schedule views → names and types → review table", category: "Schedules", keywords: "schedule audit names types table" },
  { key: "sheets", title: "Index sheets", eyebrow: "Documentation", description: "Sheet number → name → issue status", category: "Sheets", keywords: "sheet title block index issue documentation" },
  { key: "parameters", title: "Audit parameters", eyebrow: "Data prep", description: "Wall Mark + Comments → review rows", category: "Parameters", keywords: "parameter mark comments wall read audit" },
  { key: "wallGeometry", title: "Offset wall surfaces", eyebrow: "Geometry", description: "Wall curves → finish offsets → coordination surfaces", category: "Geometry", keywords: "wall curve offset surface geometry coordination" },
  { key: "roomGeometry", title: "Room centroid points", eyebrow: "Geometry", description: "Room locations → centroid points → downstream geometry", category: "Geometry", keywords: "room location centroid point geometry" },
];

const TEMPLATE_CATEGORIES: TemplateCategory[] = ["all", "Rooms", "Schedules", "Sheets", "Parameters", "Geometry", "Placement"];
const TYPE_OPTIONS: NodeKind[] = ["query", "core", "action", "python"];

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function edgeKeyForUi(edge: GraphEdgeSpec): string {
  return `${edge.from}:${edge.fromPort || "*"}->${edge.to}:${edge.toPort || "*"}`;
}

function portY(index: number, count: number, nodeY: number, nodeHeight: number): number {
  const usable = Math.max(28, nodeHeight - 46);
  return nodeY + 40 + (usable * (index + 1)) / (count + 1);
}

function escapeSvgText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

function portPosition(node: GraphNodeSpec, port: string, direction: "input" | "output"): { x: number; y: number } {
  const { width, height } = nodeDimensions(node);
  const ports = direction === "input" ? inputNames(node) : outputNames(node);
  const index = Math.max(0, ports.indexOf(port));
  return {
    x: direction === "input" ? node.x : node.x + width,
    y: portY(index, Math.max(ports.length, 1), node.y, height),
  };
}

function makeNewNode(nodes: GraphNodeSpec[]): GraphNodeSpec {
  let candidate = createBlankNode(nodes.length);
  let suffix = nodes.length + 1;
  while (nodes.some((node) => node.id === candidate.id)) {
    candidate = { ...candidate, id: `n${suffix++}` };
  }
  return candidate;
}

export default function GraphBuilder() {
  const [mode, setMode] = useState<"offline" | "llm">("offline");
  const [prompt, setPrompt] = useState(defaultPrompt());
  const [scenario, setScenario] = useState<GraphScenario>(cloneScenario(exampleScenarios.rooms));
  const [selectedId, setSelectedId] = useState("n1");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [apiKey, setApiKey] = useState(readStoredApiKey());
  const [endpoint, setEndpoint] = useState("https://api.anthropic.com/v1/messages");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Room renumbering template loaded. Inspect the graph before exporting.");
  const [showJson, setShowJson] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>("all");
  const [nodeSearch, setNodeSearch] = useState("");
  const [nodeKindFilter, setNodeKindFilter] = useState<"all" | NodeKind>("all");
  const [savedTemplates, setSavedTemplates] = useState<StoredGraphTemplate[]>(() => readStoredTemplates());
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [activePanel, setActivePanel] = useState<"build" | "inspect">("build");
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => scenarioStats(scenario), [scenario]);
  const validation = useMemo(() => validateAndNormalize(scenario), [scenario]);
  const health = useMemo(() => graphHealth(scenario), [scenario]);
  const bounds = useMemo(() => graphBounds(scenario.nodes), [scenario.nodes]);
  const selectedNode = scenario.nodes.find((node) => node.id === selectedId) || scenario.nodes[0];
  const sourceNode = scenario.nodes.find((node) => node.id === sourceId);
  const targetNode = scenario.nodes.find((node) => node.id === targetId);
  const sourcePorts = sourceNode ? outputNames(sourceNode) : [];
  const targetPorts = targetNode ? inputNames(targetNode) : [];
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return TEMPLATE_META.filter((template) => {
      const categoryMatches = templateCategory === "all" || template.category === templateCategory;
      const queryMatches = !query || [template.title, template.eyebrow, template.description, template.category, template.keywords].join(" ").toLowerCase().includes(query);
      return categoryMatches && queryMatches;
    });
  }, [templateCategory, templateSearch]);
  const visibleNodes = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase();
    return scenario.nodes.filter((node) => {
      const kindMatches = nodeKindFilter === "all" || node.type === nodeKindFilter;
      const queryMatches = !query || [node.id, node.title, node.code, nodeKindLabels[node.type]].join(" ").toLowerCase().includes(query);
      return kindMatches && queryMatches;
    });
  }, [nodeKindFilter, nodeSearch, scenario.nodes]);
  const jsonText = useMemo(() => graphJson(scenario), [scenario]);

  const loadScenario = (next: GraphScenario, message: string) => {
    setScenario(cloneScenario(next));
    setSelectedId(next.nodes[0]?.id || "");
    setSourceId("");
    setTargetId("");
    setSourcePort("");
    setTargetPort("");
    setNotice(message);
  };

  const loadTemplate = (key: keyof typeof exampleScenarios) => {
    loadScenario(exampleScenarios[key], `Loaded deterministic ${TEMPLATE_META.find((item) => item.key === key)?.title.toLowerCase() || "workflow"} template. No network request was made.`);
  };

  const loadSavedTemplate = (template: StoredGraphTemplate) => {
    loadScenario(template.scenario, `Loaded local template “${template.name}”. No network request was made.`);
  };

  const saveCurrentTemplate = () => {
    const name = templateName.trim() || window.prompt("Name this local template", scenario.title.replace(/\.dyn$/i, "")) || "";
    if (!name.trim()) {
      setNotice("Enter a name to save this graph as a local template.");
      return;
    }
    setSavedTemplates(saveStoredTemplate(name, scenario));
    setTemplateName("");
    setShowSaveTemplate(false);
    setNotice(`Saved “${name.trim()}” locally. It will remain available on this device.`);
  };

  const renameCustomTemplate = (template: StoredGraphTemplate) => {
    const name = window.prompt("Rename local template", template.name);
    if (name === null || !name.trim()) return;
    setSavedTemplates(renameStoredTemplate(template.id, name));
    setNotice(`Renamed local template to “${name.trim()}”.`);
  };

  const removeCustomTemplate = (template: StoredGraphTemplate) => {
    if (!window.confirm(`Delete the local template “${template.name}”?`)) return;
    setSavedTemplates(deleteStoredTemplate(template.id));
    setNotice(`Deleted “${template.name}” from local templates.`);
  };

  const generateGraph = async () => {
    if (!prompt.trim()) {
      setNotice("Describe a Revit automation task first.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "offline") {
        const generated = generateOfflineScenario(prompt);
        loadScenario(generated.scenario, generated.matchedTemplate ? `Offline template matched: ${generated.matchedTemplate}.` : "No template matched; a generic category starter graph was created for you to extend.");
      } else {
        if (!apiKey.trim()) {
          setNotice("Add an API key to use LLM assist, or switch back to Offline templates.");
          return;
        }
        storeApiKey(apiKey.trim());
        const generated = await requestLlmScenario(endpoint.trim(), apiKey.trim(), prompt);
        loadScenario(generated, "LLM graph draft loaded. Review every node and connector before export.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Generation failed. Offline templates remain available.");
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = (update: Partial<GraphNodeSpec>) => {
    if (!selectedNode) return;
    setScenario((current) => replaceNode(current, selectedNode.id, update));
  };

  const addNode = () => {
    const node = makeNewNode(scenario.nodes);
    setScenario((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setNotice("New Code Block added. Give it an assignment and connect it from the inspector.");
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    const next = removeNode(scenario, selectedNode.id);
    loadScenario(next, `${selectedNode.title} removed from the graph.`);
  };

  const addExplicitConnection = () => {
    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) {
      setNotice("Choose different source and target nodes before adding a connection.");
      return;
    }
    const matched = matchingPorts(sourceNode, targetNode);
    const edge: GraphEdgeSpec = {
      from: sourceNode.id,
      to: targetNode.id,
      fromPort: sourcePort || matched.sourcePort,
      toPort: targetPort || matched.targetPort,
    };
    if (!edge.fromPort || !edge.toPort) {
      setNotice("Both nodes need detectable ports before they can be connected.");
      return;
    }
    setScenario((current) => addConnection(current, edge));
    setNotice(`Connection added: ${sourceNode.title} → ${targetNode.title}.`);
    setSourcePort("");
    setTargetPort("");
  };

  const deleteConnection = (edge: GraphEdgeSpec) => {
    setScenario((current) => removeConnection(current, edge));
    setNotice(`Connection removed: ${edge.from} → ${edge.to}.`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const normalized = validateAndNormalize(parsed as GraphScenario).scenario;
        loadScenario(normalized, `Imported ${file.name}. Review the normalized graph before export.`);
      } catch {
        setNotice("Import failed. Choose a graph specification JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setNotice(".dyn JSON copied to the clipboard.");
    } catch {
      setNotice("Clipboard access is unavailable; use the JSON download instead.");
    }
  };

  const healthText = health === "ready" ? "READY" : health === "review" ? "REVIEW" : "BLOCKED";
  const healthClass = health === "ready" ? "status-ready" : health === "review" ? "status-review" : "status-blocked";

  return (
    <div className="tool-shell">
      <section className="tool-hero">
        <div className="tool-hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Local-first graph workspace <span className="eyebrow-divider">/</span> {healthText}</div>
          <h2>Turn intent into a<br /><em>reviewable</em> Dynamo graph.</h2>
          <p>Build with deterministic templates, inspect every Code Block and port, then export a Dynamo-compatible <code>.dyn</code> file without needing a server.</p>
        </div>
        <div className="tool-hero-meta">
          <div className="meta-mark"><Zap size={19} /></div>
          <div><span>EXPORTER</span><strong>offline-1.0</strong></div>
        </div>
      </section>

      <div className="tool-tabs" role="tablist" aria-label="Builder panels">
        <button className={activePanel === "build" ? "active" : ""} onClick={() => setActivePanel("build")}><WandSparkles size={15} /> Build graph</button>
        <button className={activePanel === "inspect" ? "active" : ""} onClick={() => setActivePanel("inspect")}><ShieldCheck size={15} /> Inspect & export</button>
        <div className="tool-tabs-spacer" />
        <span className="offline-chip"><span /> {typeof navigator !== "undefined" && navigator.onLine === false ? "Browser offline" : "Offline capable"}</span>
      </div>

      {activePanel === "build" ? (
        <div className="builder-grid">
          <aside className="builder-sidebar">
            <Card className="control-card prompt-card">
              <div className="card-kicker"><Search size={14} /> INTENT</div>
              <label htmlFor="automation-prompt">What do you want to automate?</label>
              <Textarea id="automation-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} placeholder="Describe the Revit automation you want to build…" rows={5} />
              <div className="prompt-footer"><span>{prompt.length}/4000</span><span>plain English</span></div>
              <div className="mode-switch" role="tablist" aria-label="Generation mode">
                <button className={mode === "offline" ? "selected" : ""} onClick={() => setMode("offline")}><span className="mode-status" /> Offline templates</button>
                <button className={mode === "llm" ? "selected" : ""} onClick={() => setMode("llm")}><WandSparkles size={13} /> LLM assist</button>
              </div>
              <p className="mode-copy">{graphModeDescription(mode)}</p>
              {mode === "llm" && (
                <div className="llm-fields">
                  <label htmlFor="api-endpoint">Provider endpoint</label>
                  <Input id="api-endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className="mono-input" />
                  <label htmlFor="api-key">Anthropic API key</label>
                  <div className="key-input-wrap"><Input id="api-key" type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-ant-…" className="mono-input" /><button type="button" onClick={() => setShowKey((current) => !current)}>{showKey ? "Hide" : "Show"}</button></div>
                  <p className="key-note">Stored locally in this browser only. It is not required for offline export.</p>
                </div>
              )}
              <Button className="generate-button" onClick={generateGraph} disabled={busy || !prompt.trim()}>{busy ? <Loader2 size={16} className="spin" /> : <WandSparkles size={16} />} {busy ? "Generating…" : mode === "offline" ? "Generate offline graph" : "Ask LLM for a draft"}</Button>
            </Card>

            <div className="section-label"><span>DETERMINISTIC STARTERS</span><span className="section-rule" /></div>
            <div className="template-discovery">
              <label className="search-field" htmlFor="template-search"><Search size={15} /><Input id="template-search" value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search templates…" /></label>
              <div className="filter-row" aria-label="Template categories">
                {TEMPLATE_CATEGORIES.map((category) => <button key={category} className={`filter-chip ${templateCategory === category ? "active" : ""}`} onClick={() => setTemplateCategory(category)}>{category === "all" ? "All" : category}</button>)}
              </div>
            </div>
            <div className="template-stack">
              {visibleTemplates.length ? visibleTemplates.map((template) => {
                const active = graphFileName(scenario) === graphFileName(exampleScenarios[template.key]);
                return <button key={template.key} className={`template-card ${active ? "active" : ""}`} onClick={() => loadTemplate(template.key)}><div className="template-topline"><span>{template.category} · {template.eyebrow}</span><ChevronDown size={14} className="template-arrow" /></div><strong>{template.title}</strong><small>{template.description}</small><div className="template-count">{exampleScenarios[template.key].nodes.length} Code Blocks <span>·</span> {exampleScenarios[template.key].edges.length} connections</div></button>;
              }) : <div className="filtered-empty"><Search size={15} /><span>No templates match this search.</span><button className="text-button" onClick={() => { setTemplateSearch(""); setTemplateCategory("all"); }}>Clear filters</button></div>}
            </div>

            <div className="saved-template-section">
              <div className="section-label"><span>MY LOCAL TEMPLATES</span><span className="section-rule" /></div>
              <Button variant="outline" size="sm" onClick={() => { setTemplateName(scenario.title.replace(/\.dyn$/i, "")); setShowSaveTemplate(true); }}><Bookmark size={14} /> Save current graph</Button>
              {showSaveTemplate && <div className="save-template-form"><Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveCurrentTemplate(); }} placeholder="Template name" aria-label="Local template name" autoFocus /><div><Button size="sm" onClick={saveCurrentTemplate}>Save</Button><Button size="sm" variant="ghost" onClick={() => setShowSaveTemplate(false)}>Cancel</Button></div></div>}
              {savedTemplates.length ? <div className="saved-template-stack">{savedTemplates.map((template) => <div className="saved-template-row" key={template.id}><button className="saved-template-load" onClick={() => loadSavedTemplate(template)}><FolderOpen size={14} /><span><strong>{template.name}</strong><small>{template.scenario.nodes.length} nodes · saved {new Date(template.createdAt).toLocaleDateString()}</small></span></button><div className="saved-template-actions"><button onClick={() => renameCustomTemplate(template)} aria-label={`Rename ${template.name}`} title="Rename"><Pencil size={13} /></button><button onClick={() => removeCustomTemplate(template)} aria-label={`Delete ${template.name}`} title="Delete"><Trash2 size={13} /></button></div></div>)}</div> : <p className="muted-copy saved-empty">Save a graph here to reuse your own workflow later.</p>}
            </div>

            <div className="sidebar-actions">
              <Button variant="outline" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import spec JSON</Button>
              <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} hidden />
              <p>Import a scenario object to continue an existing graph.</p>
            </div>
          </aside>

          <section className="builder-main">
            <Card className="canvas-card">
              <div className="canvas-header"><div><div className="card-kicker"><Link2 size={14} /> GRAPH CANVAS</div><h3>{scenario.title}</h3><p>{scenario.description}</p></div><div className="canvas-tools"><span className={`health-pill ${healthClass}`}><span /> {healthText}</span><button aria-label="Reset to room template" title="Reset to room template" onClick={() => loadTemplate("rooms")}><RefreshCw size={15} /></button></div></div>
              <div className="canvas-wrap" aria-label="Live Dynamo graph preview">
                {scenario.nodes.length === 0 ? <div className="empty-canvas"><Code2 size={28} /><strong>Your canvas is empty</strong><span>Add a Code Block or choose a deterministic starter.</span></div> : <svg className="graph-svg" viewBox={`0 0 ${bounds.width} ${bounds.height}`} role="img" aria-label="Dynamo Code Block graph">
                  <defs><pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r="1" fill="#34434d" opacity="0.75" /></pattern><filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#000" floodOpacity="0.22" /></filter></defs>
                  <rect width="100%" height="100%" fill="#182129" /><rect width="100%" height="100%" fill="url(#dot-grid)" />
                  {scenario.edges.map((edge, index) => {
                    const source = scenario.nodes.find((node) => node.id === edge.from);
                    const target = scenario.nodes.find((node) => node.id === edge.to);
                    if (!source || !target) return null;
                    const sourcePortName = edge.fromPort || outputNames(source)[0];
                    const targetPortName = edge.toPort || inputNames(target)[0];
                    if (!sourcePortName || !targetPortName) return null;
                    const start = portPosition(source, sourcePortName, "output");
                    const end = portPosition(target, targetPortName, "input");
                    const curve = `M ${start.x} ${start.y} C ${start.x + 80} ${start.y}, ${end.x - 80} ${end.y}, ${end.x} ${end.y}`;
                    return <g key={`${edge.from}-${edge.to}-${index}`} className="edge-group"><path d={curve} fill="none" stroke="#6c858d" strokeWidth="2" opacity="0.9" /><circle cx={start.x} cy={start.y} r="3" fill="#a9c7c7" /><circle cx={end.x} cy={end.y} r="3" fill="#a9c7c7" /></g>;
                  })}
                  {scenario.nodes.map((node) => {
                    const color = nodeColors[node.type];
                    const dimensions = nodeDimensions(node);
                    const ports = parsePorts(node.code);
                    const selected = selectedId === node.id;
                    return <g key={node.id} className={`graph-node ${selected ? "selected" : ""}`} transform={`translate(${node.x},${node.y})`} onClick={() => setSelectedId(node.id)} tabIndex={0} role="button" aria-label={`${node.title}, ${nodeKindLabels[node.type]} Code Block`}>
                      <rect width={dimensions.width} height={dimensions.height} rx="7" fill={color.fill} stroke={selected ? "#ffffff" : color.stroke} strokeWidth={selected ? 2.4 : 1.5} filter="url(#node-shadow)" />
                      <rect width={dimensions.width} height="31" rx="7" fill="#ffffff" fillOpacity="0.075" /><rect y="24" width={dimensions.width} height="7" fill="#ffffff" fillOpacity="0.075" />
                      <circle cx="14" cy="15" r="4" fill={color.stroke} /><text x="25" y="19" fill="#ecf5f4" fontSize="11" fontWeight="600">{escapeSvgText(node.title.length > 27 ? `${node.title.slice(0, 26)}…` : node.title)}</text><text x={dimensions.width - 10} y="19" fill={color.badge} fontSize="8.5" textAnchor="end" fontWeight="700" letterSpacing="1">{nodeKindLabels[node.type].toUpperCase()}</text>
                      {ports.inputs.map((port, index) => <g key={`in-${port}`}><circle cx="0" cy={portY(index, Math.max(ports.inputs.length, 1), 0, dimensions.height)} r="4" fill="#b5cbcb" stroke="#182129" strokeWidth="1.5" /><text x="10" y={portY(index, Math.max(ports.inputs.length, 1), 0, dimensions.height) + 3} fill="#c4d0d0" fontSize="9">{escapeSvgText(port)}</text></g>)}
                      {ports.outputs.map((port, index) => <g key={`out-${port}`}><circle cx={dimensions.width} cy={portY(index, Math.max(ports.outputs.length, 1), 0, dimensions.height)} r="4" fill={color.stroke} stroke="#182129" strokeWidth="1.5" /><text x={dimensions.width - 10} y={portY(index, Math.max(ports.outputs.length, 1), 0, dimensions.height) + 3} fill="#e4f4f0" fontSize="9" textAnchor="end">{escapeSvgText(port)}</text></g>)}
                      <line x1="10" y1={dimensions.height - 30} x2={dimensions.width - 10} y2={dimensions.height - 30} stroke="#ffffff" strokeOpacity="0.1" /><text x="11" y={dimensions.height - 13} fill="#a9b7b9" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, monospace">{escapeSvgText(node.code.length > 38 ? `${node.code.slice(0, 37)}…` : node.code)}</text>
                    </g>;
                  })}
                </svg>}
              </div>
              <div className="canvas-footer"><span><span className="legend-dot query" /> Query</span><span><span className="legend-dot core" /> Core</span><span><span className="legend-dot action" /> Action</span><span className="canvas-footer-spacer" /><span>{bounds.width} × {bounds.height} canvas</span></div>
            </Card>

            <div className="workspace-bottom">
              <Card className="node-list-card"><div className="card-heading-row"><div><div className="card-kicker"><Code2 size={14} /> NODE STACK</div><h3>{graphNodeCount(scenario)} Code Blocks</h3></div><Button size="sm" onClick={addNode}><Plus size={14} /> Add node</Button></div><div className="node-discovery"><label className="search-field" htmlFor="node-search"><Search size={15} /><Input id="node-search" value={nodeSearch} onChange={(event) => setNodeSearch(event.target.value)} placeholder="Search nodes, code, or IDs…" /></label><label className="node-filter-label" htmlFor="node-kind-filter"><SlidersHorizontal size={14} /><select id="node-kind-filter" value={nodeKindFilter} onChange={(event) => setNodeKindFilter(event.target.value as "all" | NodeKind)}><option value="all">All node types</option>{TYPE_OPTIONS.map((type) => <option key={type} value={type}>{nodeKindLabels[type]}</option>)}</select></label></div><div className="node-list">{visibleNodes.length ? visibleNodes.map((node) => <button key={node.id} className={`node-list-row ${selectedId === node.id ? "selected" : ""}`} onClick={() => setSelectedId(node.id)}><span className="node-type-bar" style={{ backgroundColor: nodeColors[node.type].stroke }} /><span className="node-list-copy"><strong>{node.title}</strong><small>{shortId(node.id)} · {nodeKindLabels[node.type]} · {graphNodeStatus(node, scenario)}</small></span><span className="node-list-code">{node.code}</span><ChevronDown size={14} /></button>) : <div className="filtered-empty node-empty"><Search size={15} /><span>No nodes match these filters.</span><button className="text-button" onClick={() => { setNodeSearch(""); setNodeKindFilter("all"); }}>Clear filters</button></div>}</div></Card>
              <div className="inspector-column">
                <Card className="inspector-card"><div className="card-heading-row"><div><div className="card-kicker"><Code2 size={14} /> INSPECTOR</div><h3>{selectedNode?.title || "Select a node"}</h3></div>{selectedNode && <button className="icon-button danger" onClick={deleteSelected} aria-label="Delete selected node"><Trash2 size={15} /></button>}</div>{selectedNode ? <div className="inspector-form"><label>Title<Input value={selectedNode.title} onChange={(event) => updateSelected({ title: event.target.value })} /></label><label>Node type<select value={selectedNode.type} onChange={(event) => updateSelected({ type: event.target.value as NodeKind })}>{TYPE_OPTIONS.map((type) => <option key={type} value={type}>{nodeKindLabels[type]}</option>)}</select></label><label>DesignScript code<Textarea value={selectedNode.code} onChange={(event) => updateSelected({ code: event.target.value })} rows={4} className="code-editor" /></label><div className="port-readout"><span>Inputs <strong>{inputNames(selectedNode).join(", ") || "—"}</strong></span><span>Outputs <strong>{outputNames(selectedNode).join(", ") || "—"}</strong></span></div></div> : <p className="muted-copy">Choose a node in the stack or on the canvas to edit its Code Block.</p>}</Card>
                <Card className="connection-card"><div className="card-heading-row"><div><div className="card-kicker"><Link2 size={14} /> CONNECT NODES</div><h3>Explicit wiring</h3></div></div><p className="muted-copy connection-help">Choose ports when variable-name matching is not enough.</p><div className="connection-form"><label>Source node<select value={sourceId} onChange={(event) => { setSourceId(event.target.value); setSourcePort(""); }}>{<option value="">Choose source…</option>}{scenario.nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label><label>Output port<select value={sourcePort} onChange={(event) => setSourcePort(event.target.value)} disabled={!sourceNode}><option value="">Auto-match output…</option>{sourcePorts.map((port) => <option key={port} value={port}>{port}</option>)}</select></label><label>Target node<select value={targetId} onChange={(event) => { setTargetId(event.target.value); setTargetPort(""); }}><option value="">Choose target…</option>{scenario.nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label><label>Input port<select value={targetPort} onChange={(event) => setTargetPort(event.target.value)} disabled={!targetNode}><option value="">Auto-match input…</option>{targetPorts.map((port) => <option key={port} value={port}>{port}</option>)}</select></label><Button size="sm" onClick={addExplicitConnection} disabled={!sourceNode || !targetNode}><Link2 size={14} /> Add connection</Button></div><div className="connection-list">{scenario.edges.length ? scenario.edges.map((edge, index) => <div className="connection-row" key={`${edgeKeyForUi(edge)}-${index}`}><span><strong>{edge.from}</strong> <em>{edge.fromPort || "output"} → {edge.toPort || "input"}</em> <strong>{edge.to}</strong></span><button onClick={() => deleteConnection(edge)} aria-label={`Remove connection ${edge.from} to ${edge.to}`}><X size={13} /></button></div>) : <p className="muted-copy">No connections yet.</p>}</div></Card>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="inspect-grid">
          <section className="inspect-main">
            <Card className="export-card"><div className="export-card-header"><div><div className="card-kicker"><ShieldCheck size={14} /> EXPORT CHECK</div><h3>Review before you download</h3><p>The exporter will write UUIDs, Code Block nodes, explicit connectors, ElementResolver metadata, and view positions.</p></div><span className={`health-pill ${healthClass}`}><span /> {healthText}</span></div><div className="diagnostic-grid"><div><strong>{stats.nodes}</strong><span>nodes</span></div><div><strong>{stats.edges}</strong><span>connections</span></div><div><strong>{stats.inputs}</strong><span>inputs</span></div><div><strong>{stats.outputs}</strong><span>outputs</span></div><div><strong>{mutationNodes(scenario).length}</strong><span>write actions</span></div></div>{validation.errors.length > 0 && <div className="issue-box blocked"><AlertTriangle size={16} /><div><strong>Blocking issues</strong>{validation.errors.map((error) => <p key={error}>{error}</p>)}</div></div>}{graphWarnings(scenario).length > 0 && <div className="issue-box review"><Info size={16} /><div><strong>Review notes</strong>{graphWarningsText(scenario).map((warning) => <p key={warning}>{warning}</p>)}</div></div>}<div className="schema-checks">{["Graph UUID", "ElementResolver", "CodeBlockNodeModel records", "Connector Start / End IDs", "View node positions + zoom"].map((label) => <div key={label}><Check size={14} /> {label}</div>)}</div><div className="export-actions"><Button onClick={() => downloadDyn(scenario)} disabled={validation.errors.length > 0} className="download-button"><Download size={16} /> Download {graphFileName(scenario)}</Button><Button variant="outline" onClick={() => downloadJson(createDyn(scenario), `${graphFileName(scenario).replace(/\.dyn$/i, "")}.json`)}><FileJson size={16} /> JSON copy</Button><Button variant="ghost" onClick={copyJson}><Clipboard size={16} /> Copy JSON</Button></div></Card>
            <Card className="json-card"><div className="card-heading-row"><div><div className="card-kicker"><FileJson size={14} /> GENERATED PAYLOAD</div><h3>{showJson ? "Dynamo JSON preview" : "Peek at the generated schema"}</h3></div><button className="text-button" onClick={() => setShowJson((current) => !current)}>{showJson ? "Hide preview" : "Show preview"}</button></div>{showJson ? <pre className="json-preview">{jsonText}</pre> : <div className="schema-preview"><div><span>Uuid</span><strong>generated per export</strong></div><div><span>ElementResolver</span><strong>ResolutionMap included</strong></div><div><span>Nodes</span><strong>{stats.nodes} CodeBlockNodeModel records</strong></div><div><span>Connectors</span><strong>{stats.edges} Start → End links</strong></div><div><span>Views</span><strong>positions, zoom, camera data</strong></div></div>}</Card>
          </section>
          <aside className="inspect-side"><Card className="file-card"><div className="card-kicker"><Download size={14} /> DOWNLOAD PROFILE</div><h3>{graphFileName(scenario)}</h3><div className="file-meta"><span>Format</span><strong>Dynamo .dyn JSON</strong><span>Schema</span><strong>CodeBlockNodeModel</strong><span>Application</span><strong>2.17.0.0</strong></div><div className="file-note"><FileJson size={15} /> {scenarioStats(scenario).nodes} nodes · {scenarioStats(scenario).edges} connectors</div></Card><Card className="safety-card"><div className="card-kicker"><AlertTriangle size={14} /> SAFETY GATE</div><h3>{isMutating(scenario) ? "This graph writes to Revit" : "Read-only graph detected"}</h3><p>{graphSafetyNote(scenario)}</p>{mutationNodes(scenario).map((node) => <div className="mutation-row" key={node.id}><span /> {node.title}</div>)}</Card><Card className="scope-card"><div className="card-kicker"><Zap size={14} /> OFFLINE SCOPE</div><h3>What runs locally</h3><p>Templates, port parsing, node editing, SVG rendering, validation, and .dyn serialization all run in this browser tab.</p><div className="scope-line"><Check size={14} /> no server required</div><div className="scope-line"><Check size={14} /> no API key required</div><div className="scope-line"><Check size={14} /> no project files uploaded</div></Card></aside>
        </div>
      )}

      <div className="tool-notice"><span className={healthClass}><span /></span><p>{notice}</p><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={14} /></button></div>
    </div>
  );
}

function isMutating(scenario: GraphScenario): boolean {
  return mutationNodes(scenario).length > 0;
}

// Keep imports explicit in the component file so the offline tool remains straightforward to audit.
void escapeSvgText;
void portPosition;
