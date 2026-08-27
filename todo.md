# Dynamo Exporter Tool — Remaining Work

- [x] Add the dual-mode generator: deterministic offline templates plus optional client-side LLM mode.
- [x] Add editable node ports, explicit edge creation, and live SVG graph rendering.
- [x] Add export validation, JSON preview, and downloadable `.dyn` generation.
- [x] Add offline bundle metadata and a local README with launch instructions.
- [x] Build, smoke-test, and package the production output as a ZIP.
- [ ] Create the final checkpoint and deliver the ZIP and project version.

## Notes

The application must remain usable without a network connection. LLM mode is optional and must never be required for deterministic template generation or `.dyn` export.

## Style Decisions

The tool should feel like a focused desktop utility rather than a marketing page: deep graphite workspace, warm paper panels, blue-violet brand accent, monospace code surfaces, and compact operational controls.
