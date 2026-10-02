/**
 * What a task reads. Keys are made of git tree ids of these paths at the revision, so a task is
 * reused only when its inputs are byte-identical.
 */
export type Files =
  | { readonly _tag: "All" }
  | { readonly _tag: "Of"; readonly paths: ReadonlyArray<string> }
  | { readonly _tag: "Workspace"; readonly dirs: ReadonlyArray<string> }
  | { readonly _tag: "Glob"; readonly patterns: ReadonlyArray<string> }
  | { readonly _tag: "Union"; readonly members: ReadonlyArray<Files> }

/** The whole repository. */
export const all = (): Files => ({ _tag: "All" })

/** Exact files or directories. */
export const of = (...paths: ReadonlyArray<string>): Files => ({ _tag: "Of", paths: paths.map(normalize) })

/**
 * Workspace packages (pnpm or npm workspaces) and every workspace package they depend on.
 * `"."` means the whole repository.
 */
export const workspace = (...dirs: ReadonlyArray<string>): Files => ({ _tag: "Workspace", dirs: dirs.map(normalize) })

/** Files matching globs. `*` stays within a directory, `**` crosses directories. */
export const glob = (...patterns: ReadonlyArray<string>): Files => ({ _tag: "Glob", patterns })

export const union = (...members: ReadonlyArray<Files>): Files => ({ _tag: "Union", members })

const normalize = (path: string) => path.replace(/^\.\//, "").replace(/\/+$/, "") || "."

const globCache = new Map<string, RegExp>()

export const globToRegExp = (pattern: string): RegExp => {
  let re = globCache.get(pattern)
  if (re === undefined) {
    const source = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*\/?/g, "\u0000")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]")
      .replace(/\u0000/g, "(?:.*/)?")
    re = new RegExp(`^${source}$`)
    globCache.set(pattern, re)
  }
  return re
}
