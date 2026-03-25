# Expo Run Command Directory

**Learned:** Running Expo CLI commands like `expo run:ios` (aliased as `pnpm run ios` or `pnpm run dev` in `packages/mobile/package.json`) must be done from the specific package directory (`packages/mobile`) or by targeting the package from the monorepo root using `pnpm --filter note-companion run ios`.

**Problem:** Running these commands from subdirectories like `packages/mobile/ios` can cause an `Error: ENOENT: no such file or directory, uv_cwd` because the Expo CLI cannot find the project root correctly.

**Solution:** Always ensure the current working directory is `packages/mobile` before running `pnpm run ios` or `pnpm run dev`, or use `pnpm --filter note-companion run ...` from the monorepo root.

**Related:**
- `packages/mobile/package.json` (scripts `ios`, `dev`) 