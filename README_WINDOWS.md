# Dynamo Exporter Desktop — Windows build

This archive contains the Windows x64 installer produced by the public GitHub Actions build for **Dynamo Exporter Desktop**.

## Install

Run `Dynamo-Exporter-1.0.0-x64.exe` on Windows 10 or Windows 11. The installer creates a normal Windows application entry and a desktop shortcut when selected. This build is unsigned, so Windows SmartScreen may show a warning; verify the SHA-256 checksum before running it and use only a copy obtained from the repository or this archive.

## Offline behavior

The deterministic graph builder, templates, node editing, SVG graph preview, validation, JSON import/export, safety diagnostics, and Dynamo `.dyn` export run locally without a network connection. LLM assist is optional, disabled by default, and only makes a network request after the user explicitly enables it and enters an API key and endpoint.

## Safety

The tool can generate graphs containing write-back or other model-mutating nodes. Review the graph in Dynamo and test on a detached or backup Revit model before using it against production data. Structural JSON validation does not guarantee that every Dynamo or Revit node signature is compatible with every installed Dynamo version.

## Source and development

Source code, package scripts, Electron shell, exporter module, CI workflow, license, and development instructions are available at:

https://github.com/MazenMostafa2015/dynamo-exporter-desktop

The source repository documents `pnpm desktop:dev`, `pnpm desktop:package`, and `pnpm desktop:package:installer` for local development and packaging.
