# Memory: Removing expo-share-intent from Mobile App

**Date:** 2024-09-25

**Summary:** Temporarily removed the `expo-share-intent` package and functionality from the mobile app (`packages/mobile`) to simplify or debug.

**Details:**

1.  **Configuration Removed:** The `expo-share-intent` plugin configuration was removed from `packages/mobile/app.config.ts`. (Note: Initial attempts to edit this file failed, ensure this change is verified).
2.  **Code Commented Out:**
    *   The import `import { useShareIntent } from "expo-share-intent";` in `packages/mobile/app/(tabs)/index.tsx` was commented out.
    *   The line `const { shareIntent } = useShareIntent();` in the `HomeScreen` component (`packages/mobile/app/(tabs)/index.tsx`) was commented out.
    *   The `useEffect` hook responsible for handling `shareIntent` data (starting around line 39 in `packages/mobile/app/(tabs)/index.tsx`) was commented out using block comments (`/* ... */`). (This edit was successful).
3.  **Dependency Removed:**
    *   The `expo-share-intent` line was removed from the `dependencies` section in `packages/mobile/package.json`. (Note: Initial attempts to edit this file failed, ensure this change is verified).
    *   The command `pnpm remove -F=note-companion expo-share-intent` was run to uninstall the package. (This command was successful).
4.  **Patch Removed:** The `pnpm.patchedDependencies` section (patching `xcode@3.0.1`) was removed from the root `package.json` file.

**Future Application / Reversal:**

To re-enable share intent functionality:

1.  Run `pnpm add -F=note-companion expo-share-intent` in the project root.
2.  Uncomment the plugin configuration block in `packages/mobile/app.config.ts` (if it was actually removed).
3.  Uncomment the import, the `useShareIntent` hook usage, and the `useEffect` block in `packages/mobile/app/(tabs)/index.tsx` (search for `// TODO: Uncomment to re-enable share intent functionality`).
4.  Re-add the `pnpm.patchedDependencies` section to the root `package.json` if the `xcode@3.0.1` patch is still needed. 