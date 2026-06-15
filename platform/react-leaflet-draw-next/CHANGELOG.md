# react-leaflet-draw-next

## 1.0.3

### Patch Changes

- 9e4f78e: fix legacy deps warning

## 1.0.2

### Patch Changes

- 948c8b0: - Fixed TypeScript definitions to include missing `featureGroup` property in `EditControlProps` interface
  - Updated `edit` property type to use full `Control.EditOptions` instead of omitting `featureGroup`
  - Added comprehensive JSDoc comments for all properties in TypeScript definitions
  - Enhanced README with TypeScript usage examples and better documentation
  - Improved breaking changes documentation for React 19 and react-leaflet v5 compatibility

## 1.0.1

### Patch Changes

- 262bf18: Added Changeset support and automated release with github pipelines
- 4c3f8de: React 19 and react-leaflet v5 compatibility with package rename
  - Migrated to React 19 and react-leaflet v5
  - Renamed package from react-leaflet-draw to react-leaflet-draw-next
  - Updated EditControl API to require featureGroup prop
  - Changed from Map to MapContainer component
  - Updated all dependencies and peer dependencies
  - Added proper TypeScript support for React 19
  - Breaking changes: requires featureGroup prop, uses MapContainer instead of Map
- c02f96c: feat: refactor EditControl event handling
- 1714327: chore: update dependencies and Node.js version to add react 19 support
