import { App, TFile } from "obsidian";

/**
 * Resolve a path (or title/basename) to a TFile.
 * Tries exact path first, then path with .md, then match by basename.
 * Use when the AI may pass display names instead of full vault paths (e.g. after @ mentions).
 */
export function resolveFile(app: App, path: string): TFile | null {
  const trimmed = path.trim();
  if (!trimmed) return null;
  const byPath = app.vault.getAbstractFileByPath(trimmed);
  if (byPath instanceof TFile) return byPath;
  const withExt = trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`;
  const byPathWithExt = app.vault.getAbstractFileByPath(withExt);
  if (byPathWithExt instanceof TFile) return byPathWithExt;
  const basenameFromPath = trimmed.split("/").pop() || trimmed;
  const basenameNoExt = basenameFromPath.endsWith(".md")
    ? basenameFromPath.slice(0, -3)
    : basenameFromPath;
  const mdFiles = app.vault.getMarkdownFiles();
  const byBasename = mdFiles.find(
    (f) =>
      f.path === trimmed ||
      f.path === withExt ||
      f.basename === basenameNoExt ||
      f.basename === basenameFromPath ||
      f.name === basenameFromPath ||
      f.path.endsWith("/" + basenameFromPath) ||
      f.path.endsWith("/" + basenameNoExt + ".md")
  );
  return byBasename ?? null;
}
