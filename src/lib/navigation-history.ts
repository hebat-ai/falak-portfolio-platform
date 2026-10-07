// Tracks the pages visited inside the app this browser tab, so the Back
// button only shows (and only goes back) when the previous page is part of
// the app -- never out to an email or another site. Kept in
// sessionStorage, so it survives a page reload but not a new tab.

const KEY = "falak:visited";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(stack: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-50)));
  } catch {
    // Storage unavailable (private mode): the Back button just stays hidden.
  }
}

// Signing in, signing up, resetting a password or accepting an invite
// starts a fresh history: Back should never lead to those pages.
const FRESH_START = ["/sign-in", "/sign-up", "/reset-password", "/accept-invite", "/accept-investor-invite"];

/** Record arriving at `path`: going back to the previous page pops, anything else pushes. */
export function recordVisit(path: string) {
  if (FRESH_START.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))) {
    write([]);
    listeners.forEach((l) => l());
    return;
  }
  const stack = read();
  if (stack.at(-1) === path) return;
  if (stack.at(-2) === path) stack.pop();
  else stack.push(path);
  write(stack);
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canGoBack(): boolean {
  return read().length > 1;
}
