// The old home's sections: the Jekyll site was one page, and its menu, the courses site's menu and old bookmarks name
// its parts as /#software, /#publications, /#blog and /#courses. Each is a page of its own now, so the home, opened at
// one of those addresses, goes on to that page at once, before its engine starts, and without a step in the history
// (Back returns to where the reader came from). The home's own address and any other # stay as they are.
// scripts/check-dist.mjs holds the same list: it fails the build if this one differs, or if a place is not in it.
export const OLD_ANCHORS = { software: '/build/#software', publications: '/build/#research', blog: '/blog/', courses: '/teach/#courses' };

/** the address names an old section: go on to its page, under the site's base; true when it goes */
export function followOldAnchor(loc = location, base = import.meta.env.BASE_URL) {
  const to = OLD_ANCHORS[loc.hash.slice(1)];
  if (typeof to !== 'string') return false;   // (not one of them, nor a name every object has, as #constructor)
  loc.replace(base.replace(/\/$/, '') + to);
  return true;
}
