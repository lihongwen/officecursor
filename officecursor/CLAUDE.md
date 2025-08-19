# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Office Add-in project for Excel, built with React and TypeScript. The add-in provides a task pane interface and supports both Excel desktop and web versions. It uses the Office JavaScript API and Microsoft's Fluent UI components for the interface.

## Key Architecture

### Project Structure
- `src/taskpane/` - Main task pane React application
  - `components/` - React components (App, Header, HeroList, TextInsertion)
  - `index.tsx` - Entry point
  - `taskpane.ts` - Office.js integration
- `src/commands/` - Add-in commands that execute outside the task pane
- `assets/` - Icons and images
- `manifest.xml` - Office Add-in manifest (Excel desktop)
- `manifest.json` - Teams manifest (for Office on the web)

### Technology Stack
- **React 18** with TypeScript
- **Fluent UI React Components** (`@fluentui/react-components`)
- **Office.js API** for Excel integration
- **Webpack** for bundling with development server on HTTPS
- **Babel** for transpilation

### Development Configuration
- Development server runs on `https://localhost:3000` (HTTPS required for Office Add-ins)
- TypeScript configured with ES5 target and ES2020 modules
- Webpack handles React, TypeScript, and asset bundling
- Office Add-in CLI tools for linting and debugging

## Common Development Commands

### Building and Development
```bash
npm run build          # Production build
npm run build:dev      # Development build
npm run dev-server     # Start development server with hot reload
npm run watch          # Watch mode for development
```

### Office Add-in Specific
```bash
npm start              # Start debugging in Excel (requires Office/Excel installed)
npm stop               # Stop debugging session
npm run validate       # Validate the manifest.xml file
```

### Code Quality
```bash
npm run lint           # Check code with Office Add-in specific linting rules
npm run lint:fix       # Auto-fix linting issues
npm run prettier       # Format code
```

### Authentication (for M365 features)
```bash
npm run signin         # Sign in to M365 account for debugging
npm run signout        # Sign out of M365 account
```

## Office Add-in Integration

### Manifest Files
- `manifest.xml` - Primary manifest for Excel desktop, defines UI integration points and permissions
- `manifest.json` - Teams-style manifest for web versions

### Key Integration Points
- Task pane loads from `https://localhost:3000/taskpane.html` in development
- Commands execute from `commands.html` and `commands.js`
- Requires `ReadWriteDocument` permissions for Excel integration
- Icons and resources served from localhost during development

### Office.js Usage
- Initialize with `Office.onReady()`
- Task pane functionality in `src/taskpane/taskpane.ts`
- Command functions in `src/commands/commands.ts`
- Use `Office.context.workbook` for Excel-specific operations

## Development Notes

- HTTPS is required for all Office Add-in development
- The development server automatically handles SSL certificates via `office-addin-dev-certs`
- Production builds replace localhost URLs with production URLs (update `urlProd` in webpack.config.js)
- Fluent UI provides Office-consistent styling and components
- Hot reload is supported for efficient development workflow