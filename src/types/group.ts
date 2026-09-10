import type { Path } from './path.js'
import { clonePath } from './path.js'

/**
 * Ordered collection of paths. Later entries are “on top” for occlusion-style ops.
 */
export type Group = {
  paths: Path[]
}

export function group(paths: Path[] = []): Group {
  return { paths: paths.map(clonePath) }
}

export function groupFromPaths(...paths: Path[]): Group {
  return group(paths)
}

export function cloneGroup(g: Group): Group {
  return group(g.paths)
}
