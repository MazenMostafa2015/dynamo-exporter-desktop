# Dynamo Exporter Desktop — Task Checklist

- [ ] Inspect the current web application and select Electron or Tauri based on Windows build feasibility.
- [ ] Add a desktop shell while preserving the offline graph builder and optional LLM mode.
- [ ] Add Windows packaging scripts and a GitHub Actions Windows build workflow.
- [ ] Add a public-project README, license, and Node/Electron/Tauri ignore rules.
- [ ] Build and validate the web bundle and desktop packaging configuration.
- [ ] Create the reusable skill using skill-creator initialization, authoring, and validation.
- [ ] Create the public GitHub repository and push the complete source.
- [ ] Trigger the Windows build and retrieve the executable/installer artifact.
- [ ] Package the Windows artifact and source metadata into the requested downloadable ZIP.
- [ ] Deliver the repository URL, desktop ZIP, and reusable skill.

## Decisions to confirm during execution

- Prefer Electron for a practical cross-platform build unless the installed toolchain makes Tauri equally reliable.
- Keep deterministic templates and `.dyn` serialization fully local; only LLM mode may call an external endpoint after explicit user action.
- A Windows-native artifact must be built on a Windows runner or equivalent; if the sandbox cannot produce a trustworthy `.exe`, use GitHub Actions and retrieve its artifact.
