/** Content shape from ScreenpipeResult for the predicate */
export interface ScreenpipeContentForPredicate {
  app_name?: string;
  window_name?: string;
  url?: string;
  browser_url?: string;
}

/** Browsers alone do not count as meetings without URL/window hints. */
export const BROWSER_APP_NAMES = new Set([
  "chrome",
  "google chrome",
  "msedge",
  "microsoft edge",
  "firefox",
  "brave",
  "arc",
  "safari",
]);

export const MEETING_APP_NAMES = new Set([
  "zoom.us",
  "zoom",
  "zoom meeting",
  "slack",
  "microsoft teams",
  "teams",
  "webex",
  "cisco webex",
  "google meet",
]);

export const MEETING_WINDOW_KEYWORDS = [
  "meet - ",
  "zoom meeting",
  "| call",
  "in a call",
  "webex",
  "teams", // Microsoft Teams in browser (e.g. "Microsoft Teams - Meeting" in Chrome)
  "google meet",
  "microsoft teams",
  "meet.google.com",
  "teams.microsoft.com",
  "zoom.us",
];

/** URL hostnames/paths that indicate a meeting (most reliable for in-browser meetings). */
export const MEETING_URL_PATTERNS = [
  "meet.google.com",
  "meet.google.com/",
  "zoom.us/",
  "zoom.us/j/",
  "teams.microsoft.com",
  "teams.live.com/",
  "webex.com",
  "meet.webex.com",
  "slack.com/",
];

/**
 * Returns the reason a content was classified as meeting-like, or null if not meeting-like.
 * Order: URL first, then window keywords, then native meeting app.
 */
export function getMeetingLikeReason(
  content: ScreenpipeContentForPredicate
): "url" | "window" | "app" | null {
  const urlRaw = (content.browser_url ?? content.url ?? "").toLowerCase();
  if (MEETING_URL_PATTERNS.some(p => urlRaw.includes(p))) return "url";

  const window = (content.window_name ?? "").toLowerCase();
  if (MEETING_WINDOW_KEYWORDS.some(kw => window.includes(kw))) return "window";

  const app = (content.app_name ?? "").toLowerCase().trim();
  if (MEETING_APP_NAMES.has(app)) return "app";

  return null;
}

/**
 * Returns true if the content looks like a meeting (Zoom, Meet, Teams, Slack, Webex, etc.).
 * URL and window are strongest signals; native meeting app counts; browsers alone do not.
 */
export function isMeetingLike(content: ScreenpipeContentForPredicate): boolean {
  return getMeetingLikeReason(content) !== null;
}
