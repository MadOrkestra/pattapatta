export type NavItem = {
	title: string
	href: string
}

export type NavGroup = {
	title: string
	items: NavItem[]
}

export const navGroups: NavGroup[] = [
	{
		title: 'Start here',
		items: [
			{ title: 'Welcome', href: '/' },
			{ title: 'Quickstart', href: '/quickstart' },
			{ title: 'Getting started', href: '/getting-started' },
			{ title: 'Examples', href: '/examples' },
			{ title: 'Live demos', href: '/demos' },
		],
	},
	{
		title: 'Concepts',
		items: [
			{ title: 'Geometry model', href: '/concepts/geometry-model' },
			{ title: 'Pen-plotter output', href: '/concepts/pen-plotter' },
			{ title: 'Operations', href: '/concepts/operations' },
			{ title: 'Fills', href: '/concepts/fills' },
			{ title: 'CLI', href: '/concepts/cli' },
		],
	},
	{
		title: 'Construction & I/O',
		items: [
			{ title: 'Types', href: '/api/types' },
			{ title: 'construction', href: '/api/construction' },
			{ title: 'SVG I/O', href: '/api/svg' },
			{ title: 'conversion', href: '/api/conversion' },
		],
	},
	{
		title: 'Operations',
		items: [
			{ title: 'transformation', href: '/api/transformation' },
			{ title: 'shapeBoolean', href: '/api/shape-boolean' },
			{ title: 'morphology', href: '/api/morphology' },
			{ title: 'processing', href: '/api/processing' },
			{ title: 'predicates', href: '/api/predicates' },
			{ title: 'compare', href: '/api/compare' },
		],
	},
	{
		title: 'Fills',
		items: [
			{ title: 'hatch', href: '/api/hatch' },
			{ title: 'segmentSet', href: '/api/segment-set' },
			{ title: 'circlePacking', href: '/api/circle-packing' },
			{ title: 'tiling', href: '/api/tiling' },
			{ title: 'contour', href: '/api/contour' },
		],
	},
	{
		title: 'Analysis',
		items: [
			{ title: 'hull', href: '/api/hull' },
			{ title: 'triangulation', href: '/api/triangulation' },
			{ title: 'voronoi', href: '/api/voronoi' },
			{ title: 'pointSet', href: '/api/point-set' },
			{ title: 'optimisation', href: '/api/optimisation' },
			{ title: 'polygonisation', href: '/api/polygonisation' },
			{ title: 'meshing', href: '/api/meshing' },
		],
	},
]

export function flattenNav(): NavItem[] {
	return navGroups.flatMap((g) => g.items)
}

export function findPager(pathname: string): {
	prev: NavItem | null
	next: NavItem | null
	current: NavItem | null
} {
	const items = flattenNav()
	const i = items.findIndex((item) => item.href === pathname)
	if (i < 0) return { prev: null, next: null, current: null }
	return {
		prev: i > 0 ? items[i - 1]! : null,
		next: i < items.length - 1 ? items[i + 1]! : null,
		current: items[i]!,
	}
}
