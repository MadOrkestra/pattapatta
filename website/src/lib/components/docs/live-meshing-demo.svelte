<script lang="ts">
	import {
		createStar,
		densify,
		poissonTriangulation,
		urquhartFaces,
		gabrielFaces,
		relativeNeighborFaces,
		spannerFaces,
		dualFaces,
		centroidQuadrangulation,
		edgeCollapseQuadrangulation,
		splitQuadrangulation,
		matchingQuadrangulation,
		smoothMesh,
		subdivideMesh,
		simplifyMesh,
		stochasticMerge,
		areaMerge,
		serializePathData,
		type Path,
	} from 'pattapatta';

	type DemoMode =
		| 'triangulation'
		| 'urquhart'
		| 'gabriel'
		| 'rng'
		| 'spanner'
		| 'dual'
		| 'centroid-quad'
		| 'edge-collapse-quad'
		| 'split-quad'
		| 'matching-quad'
		| 'smooth'
		| 'subdivide'
		| 'simplify'
		| 'stochastic-merge'
		| 'area-merge';

	const outline = densify(createStar(50, 50, 40, 16, 5), 4);
	const outlineD = serializePathData(outline.rings, outline.closed);

	const modes: { value: DemoMode; label: string }[] = [
		{ value: 'triangulation', label: 'Triangulation' },
		{ value: 'urquhart', label: 'Urquhart' },
		{ value: 'gabriel', label: 'Gabriel' },
		{ value: 'rng', label: 'Relative neighbor' },
		{ value: 'spanner', label: 'Spanner' },
		{ value: 'dual', label: 'Dual' },
		{ value: 'centroid-quad', label: 'Centroid quad' },
		{ value: 'edge-collapse-quad', label: 'Edge-collapse quad' },
		{ value: 'split-quad', label: 'Split quad' },
		{ value: 'matching-quad', label: 'Matching quad' },
		{ value: 'smooth', label: 'Smooth' },
		{ value: 'subdivide', label: 'Subdivide' },
		{ value: 'simplify', label: 'Simplify' },
		{ value: 'stochastic-merge', label: 'Stochastic merge' },
		{ value: 'area-merge', label: 'Area merge' },
	];

	let mode = $state<DemoMode>('gabriel');
	let minDist = $state(5.5);
	let seed = $state(4);
	let spannerK = $state(2);
	let smoothIterations = $state(60);
	let simplifyTolerance = $state(1);
	let mergeClasses = $state(4);
	let minArea = $state(8);

	const showSpannerK = $derived(mode === 'spanner');
	const showSmoothIterations = $derived(mode === 'smooth');
	const showSimplifyTolerance = $derived(mode === 'simplify');
	const showMergeClasses = $derived(mode === 'stochastic-merge');
	const showMinArea = $derived(mode === 'area-merge');

	function asFaces(result: Path[] | { paths: Path[] }): Path[] {
		return Array.isArray(result) ? result : result.paths;
	}

	const faces = $derived.by((): Path[] => {
		const dist = Math.max(3, Math.min(12, Number(minDist) || 5.5));
		const rng = Math.floor(Number(seed) || 1);
		const base = poissonTriangulation(outline, dist, rng);

		switch (mode) {
			case 'triangulation':
				return base;
			case 'urquhart':
				return asFaces(urquhartFaces(base, true));
			case 'gabriel':
				return asFaces(gabrielFaces(base, true));
			case 'rng':
				return asFaces(relativeNeighborFaces(base, true));
			case 'spanner': {
				const k = Math.max(1, Math.min(4, Number(spannerK) || 2));
				return asFaces(spannerFaces(base, k, true));
			}
			case 'dual':
				return asFaces(dualFaces(base));
			case 'centroid-quad':
				return asFaces(centroidQuadrangulation(base, true));
			case 'edge-collapse-quad':
				return asFaces(edgeCollapseQuadrangulation(base, true));
			case 'split-quad':
				return asFaces(splitQuadrangulation(base));
			case 'matching-quad':
				return asFaces(matchingQuadrangulation(base));
			case 'smooth': {
				const iterations = Math.max(
					1,
					Math.min(120, Math.floor(Number(smoothIterations) || 60)),
				);
				return asFaces(smoothMesh(base, iterations, true));
			}
			case 'subdivide':
				return asFaces(subdivideMesh(base, 0.5));
			case 'simplify': {
				const tolerance = Math.max(0.1, Number(simplifyTolerance) || 1);
				return asFaces(simplifyMesh(base, tolerance, true));
			}
			case 'stochastic-merge': {
				const classes = Math.max(1, Math.floor(Number(mergeClasses) || 4));
				return asFaces(stochasticMerge(base, classes, rng));
			}
			case 'area-merge': {
				const area = Math.max(0.5, Number(minArea) || 8);
				return asFaces(areaMerge(base, area));
			}
		}
	});
</script>

<div class="not-prose space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
		<label class="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Mode</span>
			<select
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				bind:value={mode}
			>
				{#each modes as m (m.value)}
					<option value={m.value}>{m.label}</option>
				{/each}
			</select>
		</label>

		<label class="flex w-28 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Min distance</span>
			<input
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				type="number"
				min="3"
				max="12"
				step="0.5"
				bind:value={minDist}
			/>
		</label>

		<label class="flex w-28 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Seed</span>
			<input
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				type="number"
				min="1"
				step="1"
				bind:value={seed}
			/>
		</label>

		{#if showSpannerK}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Spanner k</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="4"
					step="1"
					bind:value={spannerK}
				/>
			</label>
		{/if}

		{#if showSmoothIterations}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Iterations</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="120"
					step="1"
					bind:value={smoothIterations}
				/>
			</label>
		{/if}

		{#if showSimplifyTolerance}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Tolerance</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="0.1"
					max="10"
					step="0.1"
					bind:value={simplifyTolerance}
				/>
			</label>
		{/if}

		{#if showMergeClasses}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Classes</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="20"
					step="1"
					bind:value={mergeClasses}
				/>
			</label>
		{/if}

		{#if showMinArea}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Min area</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="0.5"
					max="50"
					step="0.5"
					bind:value={minArea}
				/>
			</label>
		{/if}
	</div>

	<p class="text-muted-foreground text-sm">
		{faces.length} face{faces.length === 1 ? '' : 's'}
	</p>

	<svg
		class="border-border bg-muted/30 text-foreground aspect-square w-full max-w-md rounded-lg border"
		viewBox="0 0 100 100"
		fill="none"
		aria-label="Meshing preview"
	>
		<path d={outlineD} class="stroke-muted-foreground" stroke-width="1" />
		{#each faces as f, i (i)}
			<path
				d={serializePathData(f.rings, f.closed)}
				class="stroke-foreground"
				stroke-width="0.85"
			/>
		{/each}
	</svg>
</div>
