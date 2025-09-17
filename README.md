# ComfyUI Frontend Import Map Analyzer

A powerful tool to analyze and visualize import dependencies in TypeScript/Vue.js codebases, specifically designed for the ComfyUI frontend.

## Live Demo
View the interactive import map visualization at: https://comfyui-frontend-import-map.pages.dev/

![Demo](demo.png)

## Features

- **🔍 Import Dependency Analysis**: Scans TypeScript, Vue, and JavaScript files to extract import relationships
- **🔄 Circular Dependency Detection**: Identifies and categorizes circular dependencies as runtime or type-only
- **📊 Interactive Visualization**: D3.js-powered graph visualization with search, filtering, and zoom capabilities
- **📝 Type-only Import Detection**: Distinguishes between runtime and type-only imports
- **🌍 Multi-language Support**: Analyzes i18n locale files and categorizes them appropriately
- **⚙️ Configurable**: Customizable analysis settings via configuration files
- **🧪 Well-tested**: Comprehensive unit test coverage
- **📈 Detailed Reporting**: Generates both visual and text reports

## Quick Start

```bash
# Clone the repository
git clone https://github.com/snomiao/ComfyUI_frontend-import-map-analzye.git
cd ComfyUI_frontend-import-map-analzye

# Install dependencies
bun install

# Run the analyzer
bun run src/main.ts

# Open the visualization
open import-map.html
```

## Configuration

Create an `import-map.config.ts` file to customize the analysis:

```typescript
import { AnalysisConfig } from './src/types'

export default {
  include: ['src/**/*.ts', 'src/**/*.vue'],
  exclude: ['**/*.test.*', 'node_modules/**'],
  workingDir: 'ComfyUI_frontend',
  outputDir: '.',
  generateVisualization: true,
  maxFileSize: 1024 * 1024, // 1MB
  detectTypeOnlyImports: true
} as AnalysisConfig
```

## API Usage

```typescript
import { ImportMapAnalyzer } from './src/lib/analyzer'
import { defaultConfig } from './src/config/default'

const analyzer = new ImportMapAnalyzer(defaultConfig)
const result = await analyzer.analyze()

console.log(`Found ${result.stats.circularDependencies} circular dependencies`)
```

## Architecture

The project is organized into modular components:

```
src/
├── lib/
│   ├── analyzer.ts              # Main analysis orchestrator
│   ├── importAnalyzer.ts        # Import extraction logic
│   ├── circularDependencyDetector.ts  # Circular dependency detection
│   ├── htmlGenerator.ts         # Visualization generation
│   ├── logger.ts               # Logging and error handling
│   └── __tests__/              # Unit tests
├── templates/
│   └── visualization.html      # HTML template for visualization
├── config/
│   └── default.ts             # Default configuration
├── types.ts                   # TypeScript type definitions
└── main.ts                   # CLI entry point
```

## How it Works

1. **File Discovery**: Scans the target directory using configurable glob patterns
2. **Import Extraction**: Uses regex-based parsing to extract import statements from TypeScript/Vue files
3. **Dependency Graph Building**: Creates nodes for files and edges for import relationships
4. **Circular Dependency Detection**: Uses depth-first search to identify circular import chains
5. **Visualization Generation**: Creates an interactive D3.js graph with rich metadata
6. **Report Generation**: Produces both visual and textual analysis reports

## Visualization Features

- **🎨 Node Colors**: Different colors represent file categories (components, stores, services, etc.)
- **📏 Node Sizes**: Larger nodes indicate files with more dependencies
- **🔗 Edge Styles**: Dashed lines represent type-only imports, solid lines are runtime imports
- **⚠️ Circular Dependencies**: Red edges and highlighted nodes show circular dependency chains
- **🔍 Search**: Find specific files using the search box
- **🖱️ Interactive**: Drag nodes, zoom, and hover for detailed information
- **📱 Responsive**: Works on desktop and mobile devices

## Output Files

- `import-map.json`: Raw dependency graph data
- `import-map.html`: Interactive visualization
- `import-map-report.md`: Text-based analysis report
- `import-map-errors.json`: Error log (if any issues occurred)
- `dist/index.html`: Deployment-ready visualization

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/lib/__tests__/importAnalyzer.test.ts
```

## Development

```bash
# Development mode with auto-rebuild
bun --hot src/main.ts

# Build for production
bun build src/main.ts --target=node --outdir=dist

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=comfyui-frontend-import-map
```

## Environment Variables

- `LOG_LEVEL`: Set logging level (ERROR, WARN, INFO, DEBUG)

## Legacy Usage

The original `generate-import-map.ts` script is still available for backward compatibility:

```bash
bun run generate-import-map.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `bun test`
5. Commit your changes: `git commit -m "Description"`
6. Push to your branch: `git push origin feature-name`
7. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Related Projects

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - The main ComfyUI project
- [ComfyUI Frontend](https://github.com/Comfy-Org/ComfyUI_frontend) - The frontend being analyzed