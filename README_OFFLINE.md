# Dynamo Exporter Tool — Offline Bundle

This package contains the production build of the **Dynamo Exporter Tool**, an offline-first browser utility for assembling Dynamo Code Block graphs and exporting Dynamo-compatible `.dyn` JSON files.

## Open locally

1. Unzip the package.
2. Open `dist/index.html` in a modern browser. No install, server, account, or network connection is required for the deterministic offline workflow.
3. Use the `Build graph` tab to describe a task or select a deterministic starter template.
4. Inspect Code Block nodes, edit DesignScript, add explicit port connections, and review the live SVG graph.
5. Open `Inspect & export`, resolve any blocking issues, then download the `.dyn` file.

The app uses hash-based navigation (`index.html#/tool`) so it works when opened directly from `file://`. If your browser applies unusually strict local-file policies, serve the `dist` folder with any static file server; the bundle itself has no server dependency.

## Offline and optional LLM modes

**Offline templates** run entirely in the browser. Port detection, SVG rendering, validation, JSON serialization, import, and download are local operations. Included starters cover room renumbering, wide-door schedule preparation, and grid-intersection column placement.

**LLM assist** is optional. It requires a compatible provider endpoint, your own API key, and network access. The key is stored only in this browser's local storage. It is not needed for the offline builder or `.dyn` export.

## Export schema

The generated file includes a graph UUID, name and description, `ElementResolver`, `CodeBlockNodeModel` records, generated input/output port UUIDs, explicit `Connectors`, and `Views` metadata containing node positions and zoom.

The universal-node strategy intentionally uses Code Blocks so the exporter does not pretend to know every Dynamo or Revit node signature. Review the graph in Dynamo and test mutating workflows on a detached or backup model before changing production data.

## Included paths

- `dist/index.html` — offline entry point
- `dist/assets/` — bundled CSS and JavaScript
- `README.md` — this guide
