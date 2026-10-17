interface ImportMetaEnv {
  /** '1' when drafts are built (the LAN preview; dev builds them anyway) */
  readonly ZL_DRAFTS?: string;
  /** the build's own time, ISO 8601 (the footer's "Last edited") */
  readonly ZL_BUILT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/** the live figures' code of the posts this build shows, by '<post>/<name>' (astro.config.mjs, liveFigures) */
declare module 'virtual:zl-live' {
  const modules: Record<string, () => Promise<{ default: unknown }>>;
  export default modules;
}
