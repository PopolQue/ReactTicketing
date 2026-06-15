#!/bin/bash
# Aggregate test coverage script

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (assuming scripts/ is one level deep)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Running coverage for all packages from $PROJECT_ROOT..."

# Run coverage in each package using absolute paths
cd "$PROJECT_ROOT/platform" && npm run test -- --coverage --run
cd "$PROJECT_ROOT/reactticket" && npm test -- --coverage --run
cd "$PROJECT_ROOT/reactticket-core" && npm test -- --coverage --run

echo "Coverage reports generated."
