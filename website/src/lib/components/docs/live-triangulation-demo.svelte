<script lang="ts">
	import {
		createStar,
		densify,
		earCutTriangulation,
		delaunayTriangulation,
		poissonTriangulation,
		refine,
		serializePathData,
		type Path,
	} from 'pattapatta';

	type DemoMode = 'earcut' | 'delaunay' | 'poisson' | 'refine';

	const outline = densify(createStar(50, 50, 40, 16, 5), 4);
	const outlineD = serializePathData(outline.rings, outline.closed);

	const modes: { value: DemoMode; label: string }[] = [
		{ value: 'earcut', label: 'Earcut' },
		{ value: 'delaunay', label: 'Delaunay' },
		{ value: 'poisson', label: 'Poisson' },
		{ value: 'refine', label: 'Refine' },
	];

	let mode = $state<DemoMode>('earcut');
	let minDist = $state(5.5);
	let seed = $state(4);
	let minAngleDeg = $state(20);
	let maxIterations = $state(80);

	const showPoisson = $derived(mode === 'poisson');
	const showRefine = $derived(mode === 'refine');

	const faces = $derived.by((): Path[] => {
		const dist = Math.max(3, Math.min(12, Number(minDist) || 5.5));
		const rng = Math.floor(Number(seed) || 1);
		const degrees = Math.max(1, Math.min(60, Number(minAngleDeg) || 20));
		const iterations = Math.max(
			1,
			Math.min(200, Math.floor(Number(maxIterations) || 80)),
		);

		switch (mode) {
			case 'earcut':
				return earCutTriangulation(outline);
			case 'delaunay':
				return delaunayTriangulation(outline);
			case 'poisson':
				return poissonTriangulation(outline, dist, rng);
			case 'refine':
				return refine(outline, {
					minAngle: (degrees * Math.PI) / 180,
					maxIterations: iterations,
				});
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

		{#if showPoisson}
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
		{/if}

		{#if showRefine}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Min angle (°)</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="60"
					step="1"
					bind:value={minAngleDeg}
				/>
			</label>

			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Max iterations</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="200"
					step="1"
					bind:value={maxIterations}
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
		aria-label="Triangulation preview"
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
