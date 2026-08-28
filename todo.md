# Existing Dynamo Exporter Desktop — Verification Checklist

- [x] Verify this repository is the existing Vite/React app with `/`, `/tool`, and `/docs` routes, not a separate documentation-only site.
- [x] Verify `/tool` remains the primary interactive graph-builder route and `/docs` remains integrated in the same router.
- [x] Verify the deterministic templates, search/filter controls, and local custom-template persistence are present in the existing React components.
- [x] Verify the Electron main/preload shell loads the same React bundle without moving graph logic into Electron.
- [ ] Run type-check, production build, desktop configuration validation, and offline/file-route smoke tests.
- [ ] Run or confirm the GitHub Actions Windows NSIS build for the current commit and retrieve the installer artifact.
- [ ] Update README only where needed to document the existing-app desktop behavior and custom-template workflow.
- [ ] Save a checkpoint and deliver the repository URL and current installer artifact.

## Constraints

Do not create a separate static documentation site or move `/docs` out of the existing app. Deterministic graph generation, editing, search, persistence, validation, and `.dyn` export must remain local. LLM mode is opt-in only. Keep the deep graphite workspace, warm paper panels, monospace code surfaces, and compact utility controls.

## Desktop binding note

The project is being verified in the sandbox repository because no Manus Desktop folder is bound. If direct edits on a Windows device are desired later, bind the intended folder before continuing device-local work.
