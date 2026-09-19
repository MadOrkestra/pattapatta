<script lang="ts">
	import {
		createRect,
		frontChainPack,
		hexLatticePack,
		maximumInscribedPack,
		maximumInscribedPackUntil,
		obstaclePack,
		repulsionPack,
		serializePathData,
		squareLatticePack,
		stochasticPack,
		type Circle,
	} from 'pattapatta';

	type DemoMode =
		| 'square-overlap'
		| 'square-contained'
		| 'hex-contained'
		| 'hex-overlap'
		| 'maximum-inscribed'
		| 'maximum-inscribed-until'
		| 'stochastic'
		| 'front-chain'
		| 'repulsion'
		| 'obstacle';

	const shape = createRect(10, 10, 80, 80);
	const outlineD = serializePathData(shape.rings, shape.closed);
	const seedObstacle: Circle = { x: 50, y: 50, r: 12 };

	const modes: { value: DemoMode; label: string }[] = [
		{ value: 'square-overlap', label: 'Square lattice (overlap)' },
		{ value: 'square-contained', label: 'Square lattice (contained)' },
		{ value: 'hex-contained', label: 'Hex lattice (contained)' },
		{ value: 'hex-overlap', label: 'Hex lattice (overlap)' },
		{ value: 'maximum-inscribed', label: 'Maximum inscribed' },
		{ value: 'maximum-inscribed-until', label: 'Inscribed until' },
		{ value: 'stochastic', label: 'Stochastic' },
		{ value: 'front-chain', label: 'Front chain' },
		{ value: 'repulsion', label: 'Repulsion' },
		{ value: 'obstacle', label: 'Obstacle pack' },
	];

	let mode = $state<DemoMode>('square-overlap');
	let diameter = $state(14);
	let n = $state(8);
	let points = $state(200);
	let minR = $state(3);
	let seed = $state(1);

	const showDiameter = $derived(
		mode === 'square-overlap' ||
			mode === 'square-contained' ||
			mode === 'hex-contained' ||
			mode === 'hex-overlap',
	);
	const showN = $derived(mode === 'maximum-inscribed' || mode === 'obstacle');
	const showPoints = $derived(mode === 'stochastic');
	const showMinR = $derived(
		mode === 'stochastic' ||
			mode === 'front-chain' ||
			mode === 'repulsion' ||
			mode === 'maximum-inscribed-until',
	);
	const showSeed = $derived(
		mode === 'stochastic' || mode === 'front-chain' || mode === 'repulsion',
	);

	const packed = $derived.by((): Circle[] => {
		const d = Math.max(1, Number(diameter) || 1);
		const count = Math.max(1, Math.floor(Number(n) || 1));
		const samples = Math.max(1, Math.floor(Number(points) || 1));
		const radius = Math.max(0.5, Number(minR) || 0.5);
		const maxR = Math.max(radius * 1.6, radius + 1);
		const rng = Math.floor(Number(seed) || 1);

		switch (mode) {
			case 'square-overlap':
				return squareLatticePack(shape, d, 'overlap');
			case 'square-contained':
				return squareLatticePack(shape, d, 'contained');
			case 'hex-contained':
				return hexLatticePack(shape, d, 'contained');
			case 'hex-overlap':
				return hexLatticePack(shape, d, 'overlap');
			case 'maximum-inscribed':
				return maximumInscribedPack(shape, count, 0.5);
			case 'maximum-inscribed-until':
				return maximumInscribedPackUntil(shape, radius, 0.5);
			case 'stochastic':
				return stochasticPack(shape, samples, radius, rng);
			case 'front-chain':
				return frontChainPack(shape, radius, maxR, rng);
			case 'repulsion':
				return repulsionPack(shape, radius, maxR, rng);
			case 'obstacle':
				return obstaclePack(shape, [seedObstacle], count, 0.5);
		}
	});

	const circles = $derived(
		mode === 'obstacle' ? [seedObstacle, ...packed] : packed,
	);
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

		{#if showDiameter}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Diameter</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="2"
					max="40"
					step="1"
					bind:value={diameter}
				/>
			</label>
		{/if}

		{#if showN}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Count</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="1"
					max="40"
					step="1"
					bind:value={n}
				/>
			</label>
		{/if}

		{#if showPoints}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Samples</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="10"
					max="800"
					step="10"
					bind:value={points}
				/>
			</label>
		{/if}

		{#if showMinR}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Min radius</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="0.5"
					max="20"
					step="0.5"
					bind:value={minR}
				/>
			</label>
		{/if}

		{#if showSeed}
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
	</div>

	<p class="text-muted-foreground text-sm">
		{circles.length} circle{circles.length === 1 ? '' : 's'}
		{#if mode === 'obstacle'}
			<span class="text-muted-foreground/80"> (includes center seed)</span>
		{/if}
	</p>

	<svg
		class="border-border bg-muted/30 text-foreground aspect-square w-full max-w-md rounded-lg border"
		viewBox="0 0 100 100"
		fill="none"
		aria-label="Circle packing preview"
	>
		<defs>
			<clipPath id="pack-demo-clip">
				<path d={outlineD} clip-rule="evenodd" />
			</clipPath>
		</defs>
		<g clip-path="url(#pack-demo-clip)">
			{#each circles as c, i (i)}
				<circle
					cx={c.x}
					cy={c.y}
					r={c.r}
					class={mode === 'obstacle' && i === 0
						? 'stroke-slate-500 dark:stroke-slate-400'
						: 'stroke-foreground'}
					stroke-width="1"
				/>
			{/each}
		</g>
		<path d={outlineD} class="stroke-foreground" stroke-width="1.25" />
	</svg>
</div>
