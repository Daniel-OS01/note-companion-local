/** Content shape from ScreenpipeResult for the predicate */
export interface ScreenpipeContentForPredicate {
  app_name?: string;
  window_name?: string;
  url?: string;
  browser_url?: string;
}

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
];

/** URL hostnames/paths that indicate a meeting (most reliable for in-browser meetings). */
export const MEETING_URL_PATTERNS = [
  "meet.google.com",
  "zoom.us/",
  "zoom.us/j/",
  "teams.microsoft.com",
  "webex.com",
  "meet.webex.com",
  "slack.com/",
];

/**
 * Returns true if the content looks like a meeting (Zoom, Meet, Teams, Slack, Webex, etc.).
 * Matches by app_name (lowercased), window_name containing meeting keywords, or url/browser_url.
 */
export function isMeetingLike(content: ScreenpipeContentForPredicate): boolean {
  const app = (content.app_name ?? "").toLowerCase().trim();
  if (MEETING_APP_NAMES.has(app)) return true;
  const window = (content.window_name ?? "").toLowerCase();
  if (MEETING_WINDOW_KEYWORDS.some(kw => window.includes(kw))) return true;
  const urlRaw = (content.browser_url ?? content.url ?? "").toLowerCase();
  if (MEETING_URL_PATTERNS.some(p => urlRaw.includes(p))) return true;
  return false;
}
