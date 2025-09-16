# ComfyUI Frontend Import Map Analyzer

A tool to analyze and visualize the import dependencies in the ComfyUI frontend codebase.

## Overview

This project provides utilities to analyze the import structure of ComfyUI's frontend code, generating both a JSON import map and an interactive HTML visualization to help developers understand the module dependencies and architecture.

## Live Demo

View the interactive import map visualization at: https://comfyui-frontend-import-map.pages.dev/

## Features

- **Import Map Generation**: Automatically scans and generates a comprehensive import map from TypeScript/JavaScript files
- **Interactive Visualization**: Browse the import dependencies in an easy-to-navigate HTML interface
- **Dependency Graph**: Visual representation of module relationships (SVG format)
- **JSON Export**: Machine-readable import map for further analysis or tooling

## Files

- `generate-import-map.ts` - Main script to analyze imports and generate the map
- `import-map.json` - Generated JSON file containing the import mappings
- `import-map.html` - Interactive HTML visualization of the import structure
- `dependency-graph.svg` - Visual dependency graph

## Usage

1. Run the import map generator:
   ```bash
   tsx generate-import-map.ts
   ```

2. Open `import-map.html` in your browser to explore the interactive visualization

## Purpose

This tool helps ComfyUI developers and contributors:
- Understand the module structure and dependencies
- Identify circular dependencies
- Plan refactoring efforts
- Onboard new developers to the codebase architecture

## License

This project is part of the ComfyUI ecosystem analysis tools.