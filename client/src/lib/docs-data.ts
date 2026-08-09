// Structured documentation data for the Dynamo Exporter reference guide

export interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  subsections: DocSubsection[];
}

export interface DocSubsection {
  id: string;
  title: string;
  content: string;
  code?: CodeExample[];
  table?: TableData;
}

export interface CodeExample {
  language: string;
  title?: string;
  code: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export const docSections: DocSection[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Introduction to the Dynamo .dyn File Exporter",
    icon: "📋",
    subsections: [
      {
        id: "what-is",
        title: "What is the Dynamo Exporter?",
        content: `The **Dynamo Exporter** is a robust JSON generator that produces valid Dynamo \`.dyn\` files from a graph specification. It uses **Code Block nodes** as the primary building block, enabling simple and expressive graph wiring through DesignScript variable references.

This approach eliminates the need to support hundreds of Dynamo node types with their specific port signatures, instead representing every node as a \`CodeBlockNodeModel\` containing a single line of DesignScript.`,
      },
      {
        id: "core-concept",
        title: "Core Concept: Code Block as Universal Node",
        content: `Instead of trying to support hundreds of Dynamo node types with their specific port signatures, the exporter represents every node as a \`CodeBlockNodeModel\` containing a single line of DesignScript.

**Key benefits:**
- **Simplifies wiring**: Connections are based on variable names, not port indices.
- **Handles arbitrary logic**: Any DesignScript expression can be embedded.
- **Reduces metadata burden**: No need to track complex type information for each node.`,
        code: [
          {
            language: "json",
            title: "Graph Specification Example",
            code: `{
  "nodes": [
    { "id": "n1", "code": "cat = Categories.ByName(\\"Rooms\\");" },
    { "id": "n2", "code": "elems = AllElementsOfCategory(cat);" }
  ],
  "edges": [["n1", "n2"]]
}`,
          },
        ],
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "Deep dive into the exporter's design and implementation",
    icon: "🏗️",
    subsections: [
      {
        id: "port-parsing",
        title: "Port Parsing Algorithm",
        content: `The exporter automatically detects input and output ports by analyzing DesignScript code using regex-based pattern matching.

**Outputs** are identified by matching variable assignments: \`var =\`

**Inputs** are identified by finding variables referenced but not assigned in the block, excluding:
- Keywords: \`true\`, \`false\`, \`null\`, \`if\`, \`else\`, \`return\`, \`def\`, \`for\`, \`in\`, \`while\`
- Namespaces (left side of dots): \`Categories\`, \`Element\`, \`List\`, etc.
- Methods (right side of dots): \`ByName\`, \`GetParameterValueByName\`, etc.
- Function calls: Any identifier followed by \`(\`
- Known built-ins: \`Categories\`, \`AllElementsOfCategory\`, \`FamilyInstance\`, \`Level\`, etc.`,
        code: [
          {
            language: "text",
            title: "Parsing Example",
            code: `Code: "levels = Element.GetParameterValueByName(elems, \\"Level\\");"

Outputs: ["levels"]
Inputs: ["elems"]
(Element and GetParameterValueByName are filtered out)`,
          },
        ],
      },
      {
        id: "wiring-strategy",
        title: "Wiring Strategy",
        content: `The exporter uses **variable name matching** to wire nodes together:

1. **Direct Match**: If node A outputs \`cat\` and node B inputs \`cat\`, they are wired.
2. **Fallback**: If no variable name matches, the first output of A connects to the first input of B.
3. **Multiple Outputs**: If a node has multiple outputs, each is available as a separate port.`,
      },
    ],
  },
  {
    id: "schema",
    title: "JSON Schema",
    description: "Input and output data structures",
    icon: "📐",
    subsections: [
      {
        id: "scenario-object",
        title: "Scenario Object (Input)",
        content: `The scenario object defines the graph structure that will be exported to a \`.dyn\` file.`,
        code: [
          {
            language: "typescript",
            code: `{
  title: string;              // e.g., "renumber_rooms.dyn"
  clarify?: string[];         // Assumptions made
  checklist?: string[];       // What was resolved
  nodes: {
    id: string;               // Unique identifier (e.g., "n1")
    title: string;            // Display name
    sub?: string;             // Subtitle/description
    type?: string;            // "query", "core", "py", "action"
    code: string;             // DesignScript code line
    x?: number;               // X position (optional)
    y?: number;               // Y position (optional)
  }[];
  edges: [string, string][];  // [fromNodeId, toNodeId] pairs
  summary?: string;           // HTML summary
}`,
          },
        ],
      },
      {
        id: "dyn-object",
        title: "Generated .dyn Object (Output)",
        content: `The output is a complete Dynamo graph JSON object ready to be saved as a \`.dyn\` file.`,
        code: [
          {
            language: "typescript",
            code: `{
  Uuid: string;
  IsCustomNode: boolean;
  Description: string;
  Name: string;
  ElementResolver: { ResolutionMap: {} };
  Inputs: [];
  Outputs: [];
  Nodes: CodeBlockNodeModel[];
  Connectors: Connector[];
  Views: ViewData[];
  ApplicationVersion: string;
  Author: string;
  NodeLibraryDependencies: string[];
}`,
          },
        ],
      },
    ],
  },
  {
    id: "api",
    title: "API Reference",
    description: "JavaScript and Python APIs",
    icon: "⚙️",
    subsections: [
      {
        id: "js-api",
        title: "JavaScript API",
        content: `The JavaScript implementation is embedded in the HTML app and provides two main methods.`,
        code: [
          {
            language: "javascript",
            title: "DynamoExporter.createDyn(scenario)",
            code: `const scenario = {
  title: "my_graph.dyn",
  nodes: [
    { id: "n1", code: "cat = Categories.ByName(\\"Rooms\\");", x: 100, y: 100 },
    { id: "n2", code: "elems = AllElementsOfCategory(cat);", x: 400, y: 100 }
  ],
  edges: [["n1", "n2"]]
};

const dynJson = DynamoExporter.createDyn(scenario);
const blob = new Blob([JSON.stringify(dynJson, null, 2)], { type: 'application/json' });
// Download blob as .dyn file`,
          },
          {
            language: "javascript",
            title: "DynamoExporter.parsePorts(code)",
            code: `const { inputs, outputs } = DynamoExporter.parsePorts(
  'result = Element.SetParameterByName(elems, "Number", seq);'
);
// inputs: ["elems", "seq"]
// outputs: ["result"]`,
          },
        ],
      },
      {
        id: "py-api",
        title: "Python API",
        content: `A Python wrapper for building and serializing \`.dyn\` files programmatically.`,
        code: [
          {
            language: "python",
            title: "DynamoGraph Class",
            code: `from dynamo_exporter import DynamoGraph

graph = DynamoGraph("My Graph")
n1 = graph.add_node('cat = Categories.ByName("Rooms");', x=100, y=100, name="Get Category")
n2 = graph.add_node('elems = AllElementsOfCategory(cat);', x=400, y=100, name="Get Elements")

graph.add_connection(n1, 'cat', n2, 'cat')
graph.save("output.dyn")`,
          },
        ],
      },
    ],
  },
  {
    id: "integration",
    title: "Integration",
    description: "How to integrate with DynamoGPT",
    icon: "🔗",
    subsections: [
      {
        id: "dynamogpt-integration",
        title: "Integration with DynamoGPT",
        content: `The exporter is embedded in the DynamoGPT HTML app and triggered when the user clicks "Download .dyn":

1. Claude generates a scenario JSON with \`nodes\` and \`edges\`
2. \`DynamoExporter.createDyn(scenario)\` produces the \`.dyn\` JSON
3. The JSON is serialized and downloaded as a blob file

**Claude Prompt Requirements:**

The system prompt instructs Claude to include a \`code\` field in each node:

\`\`\`json
"nodes": [
  {
    "id": "n1",
    "title": "Categories",
    "code": "cat = Categories.ByName(\\"Rooms\\");",
    "type": "query"
  }
]
\`\`\`

Claude must follow the pattern: \`outputVar = Function(inputVar1, inputVar2);\``,
      },
    ],
  },
  {
    id: "validation",
    title: "Validation & Error Handling",
    description: "Port matching and error strategies",
    icon: "✓",
    subsections: [
      {
        id: "port-matching",
        title: "Port Matching",
        content: `When connecting nodes, the exporter follows this strategy:

1. Looks for a variable name that appears in both the source's outputs and the target's inputs.
2. If found, creates a connector between those ports.
3. If not found but both nodes have ports, connects the first output to the first input (fallback).`,
      },
      {
        id: "wiring-correctness",
        title: "Wiring Correctness",
        content: `The exporter **does not validate** that the DesignScript code is syntactically correct. It assumes:
- Claude provides valid DesignScript.
- Variable names are meaningful and match across edges.

If validation is needed, the \`.dyn\` file can be opened in Dynamo, which will report syntax errors.`,
      },
    ],
  },
  {
    id: "limitations",
    title: "Limitations & Future",
    description: "Known constraints and planned enhancements",
    icon: "🚀",
    subsections: [
      {
        id: "known-limitations",
        title: "Known Limitations",
        content: `1. **No type checking**: The exporter doesn't verify that function signatures match input types.
2. **Single-line code blocks**: Each node contains only one DesignScript line. Multi-line logic must be split across nodes or use Python nodes.
3. **No custom node support**: The exporter only generates Code Block nodes, not custom nodes from packages.
4. **Simplified input parsing**: The regex-based parser may misidentify inputs in complex expressions (e.g., nested function calls with dot notation).`,
      },
      {
        id: "future-enhancements",
        title: "Future Enhancements",
        content: `- **Python node support**: Generate \`PythonNodeModels\` for complex logic.
- **Type inference**: Validate that connected ports have compatible types.
- **Custom node resolution**: Support nodes from Dynamo packages via metadata.
- **Multi-line code blocks**: Allow node code to span multiple lines with proper formatting.
- **Graph optimization**: Detect and warn about redundant nodes or inefficient wiring.`,
      },
    ],
  },
];

export const codeExamples = {
  jsTest: `const scenario = {
  title: "test.dyn",
  nodes: [
    { id: "n1", code: 'x = 1;', x: 100, y: 100 },
    { id: "n2", code: 'y = x + 1;', x: 300, y: 100 }
  ],
  edges: [["n1", "n2"]]
};

const dyn = DynamoExporter.createDyn(scenario);
console.log(JSON.stringify(dyn, null, 2));`,

  pyTest: `from dynamo_exporter import DynamoGraph

graph = DynamoGraph("Test")
n1 = graph.add_node('x = 1;')
n2 = graph.add_node('y = x + 1;')
graph.add_connection(n1, 'x', n2, 'x')
graph.save("test.dyn")`,
};
