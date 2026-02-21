# Open Canva Monorepo

## Structure

- `apps/web`: React frontend application.
- `apps/api`: Node.js backend API.
- `packages/shared`: Shared types and configuration utilities.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run frontend and backend concurrently from repository root:

   ```bash
   npm run dev
   ```

3. Run each app independently:

   ```bash
   npm run dev:web
   npm run dev:api
   ```

## Workspace Notes

- Frontend source lives in `apps/web/src` and is organized by features/components.
- Backend source lives in `apps/api/src` and is organized by routes, controllers, and services.
- Shared package exports reusable types and constants for both applications.
