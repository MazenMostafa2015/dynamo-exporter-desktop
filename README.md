# Dynamo Exporter Desktop

Dynamo Exporter Desktop is an offline-first Windows utility for turning plain-English Revit automation ideas into reviewable Dynamo Code Block graphs and `.dyn` files. It preserves the existing React/Vite workbench while adding a thin Electron shell so the same deterministic templates, SVG graph view, node inspector, explicit port wiring, validation, JSON preview, and download flow can run as a native desktop application.

The universal-node strategy intentionally represents each generated node as a `CodeBlockNodeModel`. A DesignScript assignment such as `rooms = AllElementsOfCategory(cat);` exposes `rooms` as an output and referenced variables such as `cat` as inputs. This keeps serialization transparent and avoids pretending that one metadata table covers every Dynamo and Revit node signature.

## Features

The desktop app includes deterministic offline templates for room renumbering, wide-door schedule preparation, and grid-intersection column placement. It provides manual Code Block editing, type labels for query/core/action/Python nodes, explicit source-to-target port connections, live SVG rendering, graph health diagnostics, write-action safety warnings, JSON preview, scenario JSON import, and `.dyn` download.

LLM assist is optional and disabled by default. When explicitly enabled, the browser renderer sends the prompt to the configured endpoint with the API key supplied by the user. Deterministic generation, editing, validation, serialization, and exporting never require network access or an API key.

## Repository layout

| Path | Purpose |
| --- | --- |
| `client/src/lib/dyn-exporter.ts` | Offline-safe graph model, port parser, serializer, templates, validation, and download helpers |
| `client/src/components/GraphBuilder.tsx` | Interactive graph canvas, inspector, port wiring, LLM/offline controls, and export UI |
| `client/src/pages/Tool.tsx` | Desktop-oriented tool page and navigation shell |
| `electron/main.cjs` | Minimal Electron main process that loads the bundled app and opens external web links safely |
| `electron/preload.cjs` | Isolated preload bridge with a non-privileged runtime marker |
| `postbuild-offline.mjs` | Converts Vite output to a deferred local IIFE entry point for direct file launch |
| `scripts/validate-desktop-config.mjs` | Deterministic packaging configuration check used before release |
| `.github/workflows/windows-build.yml` | Windows CI workflow that builds NSIS and portable artifacts and uploads a ZIP |

## Requirements

For local development, install Node.js 22 or later and pnpm 10. Windows packaging is performed on a Windows runner because the Linux sandbox is not a trustworthy environment for producing and signing a Windows executable. The application itself does not require a server, database, Revit installation, or network connection for its offline mode.

## Local development

Install dependencies and verify the project:

```bash
pnpm install
pnpm check
pnpm build
```

Run the web workbench:

```bash
pnpm dev
```

Run the Electron shell against the Vite development server:

```bash
pnpm desktop:dev
```

The development shell opens the local Vite URL. The packaged shell loads `dist/public/index.html` directly and does not start an application server.

## Windows packaging

Build Windows NSIS and portable artifacts on Windows:

```powershell
pnpm install --frozen-lockfile
pnpm desktop:validate
pnpm desktop:package
```

The package configuration writes releases into `release/` and creates an installer plus a portable executable. The CI workflow uses the same commands and packages the artifacts into `dynamo-exporter-windows.zip`.

For a directory-only smoke test:

```powershell
pnpm desktop:package:dir
```

Do not treat an unsigned build as enterprise-distributed software. Add a code-signing certificate and signing configuration before distributing the installer outside a trusted team.

## Using the tool

Open the `Build graph` tab, describe the automation, and choose `Offline templates` for deterministic generation. Select a starter template or generate a category starter. Click nodes in the canvas or node stack to edit titles, node type, and one-line DesignScript. The port readout updates from assigned and referenced variable names.

Use `Connect nodes` in the inspector when automatic variable-name matching is not sufficient. The canvas renders each connector as a visible SVG curve, and the `Inspect & export` tab shows the node count, connector count, port counts, schema checks, and potential write actions. Download is blocked when the graph has missing IDs, empty code, or unassigned outputs.

Action nodes such as `Element.SetParameterByName` or placement calls may mutate the active Revit model. Always review the exported graph in Dynamo and test on a detached or backup model before running against production data.

## Export shape

Each generated `.dyn` payload contains a graph UUID, name, description, `ElementResolver`, Code Block node records with generated input/output port UUIDs, connector records with `Start` and `End` port UUIDs, and view metadata containing node positions and zoom. The project validates the JSON shape but cannot guarantee compatibility with every Dynamo version or every arbitrary Revit node signature; the installed Dynamo environment remains the final authority.

## Security and privacy

The Electron renderer runs with Node integration disabled, context isolation enabled, and a sandboxed web preference. The preload exposes only a non-privileged runtime marker. External HTTP links are handed to the operating system, while new in-app windows are denied. The optional API key is stored in browser local storage when the user chooses to save it; it is not part of graph exports or source files.

## License

Released under the MIT License. Copyright (c) 2026 Mostafa Zeada.
