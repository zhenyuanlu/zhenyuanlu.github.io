// What every page shares: the person (content/site.yaml), the doors, addresses under the build's base, dates.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** the five doors, in the ring's order (a page's foot links the one before and the one after) */
export const DOORS = ['build', 'teach', 'see', 'blog', 'race'] as const;
export type Door = (typeof DOORS)[number];

/** the blog's topics, in the order the line above the list shows them (one it does not know comes last) */
export const TOPICS = ['vision', 'language', 'signals', 'health', 'self-supervised', 'transformers', 'augmentation'];

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
/** an address on this site, under the build's base (/ on the real site, the preview copy's own base on the LAN build) */
export function url(path = ''): string {
  return BASE + String(path).replace(/^\//, '');
}
/** the address on the real site (canonical, social cards, structured data): never the LAN copy's */
export function absolute(path = ''): string {
  return new URL(String(path).replace(/^\//, ''), 'https://zhenyuanlu.com/').href;
}

/** drafts build in dev and in the LAN preview only */
export const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.ZL_DRAFTS === '1';
/** the build's own date (the footer's "Last edited") */
export const BUILT = new Date(import.meta.env.ZL_BUILT || Date.now());

export async function person() {
  const e = await getEntry('site', 'site');
  if (!e) throw new Error('content/site.yaml has no "site" entry');
  return e.data;
}

/** every post that this build shows, newest first */
export async function posts(): Promise<Post[]> {
  const all = await getCollection('blog', (p) => SHOW_DRAFTS || !p.data.draft);
  return all.sort((a, b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id));
}
/** the blog's own list: posts, not talks (build lists those), and not hidden ones */
export function listed(all: Post[]): Post[] {
  return all.filter((p) => p.data.kind === 'post' && !p.data.hidden && !p.data.draft);
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Oct 6, 2022": a post's day as a blog writes it (dates are days: read in UTC, as YAML gives them) */
export function longDate(d: Date): string {
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
/** a post's day at noon in Boston, as an instant (the feed's time: a reader anywhere sees the right day, where
    midnight UTC is the evening before in America) */
export function noonInBoston(d: Date): Date {
  const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
  const guess = Date.UTC(y, m, day, 12);
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date(guess));
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  // Boston's clock at 12:00 UTC, against UTC: the offset (-4 h in summer, -5 h in winter), taken back off noon
  const offset = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute')) - guess;
  return new Date(guess - offset);
}
/** "Oct 2026", in Boston */
export function monthYear(d: Date): string {
  const p = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'America/New_York' }).formatToParts(d);
  return `${p.find((x) => x.type === 'month')?.value} ${p.find((x) => x.type === 'year')?.value}`;
}
/** the description's first sentence (the list and the dek show it) */
export function firstLine(s: string): string {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  if ((t.match(/"/g) || []).length % 2) t = t.replace(/"\s*$/, '');   // a stray closing quote
  const m = /^(.{40,}?[.!?])(?=\s+[A-Z])/.exec(t);
  return m ? m[1] : t;
}
export function topicSlug(t: string): string {
  return String(t).toLowerCase().trim().replace(/\s+/g, '-');
}
/** a post's topics, in the list's order */
export function topicsOf(p: Post): string[] {
  const ts = [...new Set(p.data.topics.map(topicSlug).filter(Boolean))];
  return ts.sort((a, b) => (TOPICS.indexOf(a) < 0 ? 99 : TOPICS.indexOf(a)) - (TOPICS.indexOf(b) < 0 ? 99 : TOPICS.indexOf(b)));
}
