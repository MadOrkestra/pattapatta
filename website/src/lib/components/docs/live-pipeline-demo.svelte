<script lang="ts">
	import {
		buffer,
		createCircle,
		createRect,
		createStar,
		hatchCross,
		hatchParallel,
		hexLatticePack,
		segmentsToOpenPaths,
		serializePathData,
		subtract,
		union,
		type Circle,
		type Path,
	} from 'pattapatta';

	type RecipeId = 'union-hatch' | 'frame-pack' | 'star-cut-hatch' | 'ring-hatch';

	const recipes: { value: RecipeId; label: string; description: string }[] = [
		{
			value: 'union-hatch',
			label: 'Union → hatch',
			description: 'Two overlapping rects → union → parallel hatch',
		},
		{
			value: 'frame-pack',
			label: 'Frame → pack',
			description: 'Frame (rect − rect) → hex lattice pack (contained)',
		},
		{
			value: 'star-cut-hatch',
			label: 'Star cut → hatch',
			description: 'Star − circle → cross hatch',
		},
		{
			value: 'ring-hatch',
			label: 'Ring → hatch',
			description: 'Buffered circle − inner circle → parallel hatch',
		},
	];

	let recipe = $state<RecipeId>('union-hatch');
	let spacing = $state(6);
	let angleDeg = $state(45);
	let diameter = $state(10);

	const showHatchControls = $derived(recipe !== 'frame-pack');
	const showDiameter = $derived(recipe === 'frame-pack');
	const recipeMeta = $derived(recipes.find((r) => r.value === recipe) ?? recipes[0]!);

	const scene = $derived.by(() => {
		const hatchSpacing = Math.max(2, Number(spacing) || 2);
		const hatchAngle = ((Number(angleDeg) || 0) * Math.PI) / 180;
		const packDiameter = Math.max(1, Number(diameter) || 1);

		const inputPaths: Path[] = [];
		let resultPaths: Path[] = [];
		let hatchDs: string[] = [];
		let circles: Circle[] = [];
		let viewBox = '0 0 100 100';

		const hatchOpts = {
			spacing: hatchSpacing,
			count: 40,
			angle: hatchAngle,
		};

		switch (recipe) {
			case 'union-hatch': {
				viewBox = '0 0 110 100';
				const a = createRect(10, 25, 50, 40);
				const b = createRect(40, 35, 50, 40);
				inputPaths.push(a, b);
				const merged = union(a, b);
				resultPaths = merged.paths;
				const target = merged.paths[0];
				if (target) {
					hatchDs = segmentsToOpenPaths(hatchParallel(target, hatchOpts)).map((p) =>
						serializePathData(p.rings, p.closed),
					);
				}
				break;
			}
			case 'frame-pack': {
				const outer = createRect(10, 10, 80, 80);
				const inner = createRect(30, 30, 40, 40);
				inputPaths.push(outer, inner);
				const frame = subtract(outer, inner);
				resultPaths = frame.paths;
				const target = frame.paths[0];
				if (target) {
					circles = hexLatticePack(target, packDiameter, 'contained');
				}
				break;
			}
			case 'star-cut-hatch': {
				const star = createStar(50, 50, 38, 16, 5);
				const hole = createCircle(50, 50, 14);
				inputPaths.push(star, hole);
				const cut = subtract(star, hole);
				resultPaths = cut.paths;
				const target = cut.paths[0];
				if (target) {
					hatchDs = segmentsToOpenPaths(hatchCross(target, hatchOpts)).map((p) =>
						serializePathData(p.rings, p.closed),
					);
				}
				break;
			}
			case 'ring-hatch': {
				const seed = createCircle(50, 50, 28);
				const buffered = buffer(seed, 8);
				const outer = buffered.paths[0] ?? createCircle(50, 50, 36);
				const inner = createCircle(50, 50, 18);
				inputPaths.push(outer, inner);
				const ring = subtract(outer, inner);
				resultPaths = ring.paths;
				const target = ring.paths[0];
				if (target) {
					hatchDs = segmentsToOpenPaths(hatchParallel(target, hatchOpts)).map((p) =>
						serializePathData(p.rings, p.closed),
					);
				}
				break;
			}
		}

		return {
			viewBox,
			inputDs: inputPaths.map((p) => serializePathData(p.rings, p.closed)),
			resultDs: resultPaths.map((p) => serializePathData(p.rings, p.closed)),
			hatchDs,
			circles,
			markCount: recipe === 'frame-pack' ? circles.length : hatchDs.length,
			markKind: recipe === 'frame-pack' ? ('circle' as const) : ('stroke' as const),
		};
	});
</script>

<div class="not-prose space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
		<label class="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Recipe</span>
			<select
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				bind:value={recipe}
			>
				{#each recipes as r (r.value)}
					<option value={r.value}>{r.label}</option>
				{/each}
			</select>
		</label>

		{#if showHatchControls}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Spacing</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="2"
					max="20"
					step="1"
					bind:value={spacing}
				/>
			</label>
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Angle °</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="0"
					max="180"
					step="5"
					bind:value={angleDeg}
				/>
			</label>
		{/if}

		{#if showDiameter}
			<label class="flex w-28 flex-col gap-1 text-sm">
				<span class="text-muted-foreground">Diameter</span>
				<input
					class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					type="number"
					min="2"
					max="30"
					step="1"
					bind:value={diameter}
				/>
			</label>
		{/if}
	</div>

	<p class="text-muted-foreground text-sm">
		{recipeMeta.description} · {scene.markCount}
		{scene.markKind === 'circle'
			? `circle${scene.markCount === 1 ? '' : 's'}`
			: `stroke${scene.markCount === 1 ? '' : 's'}`}
	</p>

	<svg
		class="border-border bg-muted/30 text-foreground aspect-square w-full max-w-md rounded-lg border"
		viewBox={scene.viewBox}
		fill="none"
		aria-label="Chained pipeline preview"
	>
		{#each scene.inputDs as d, i (i)}
			<path {d} class="stroke-stone-400 dark:stroke-stone-500" stroke-width="1" />
		{/each}
		{#each scene.resultDs as d, i (i)}
			<path {d} class="stroke-foreground" stroke-width="1.25" />
		{/each}
		{#each scene.hatchDs as d, i (i)}
			<path {d} class="stroke-foreground" stroke-width="1" />
		{/each}
		{#each scene.circles as c, i (i)}
			<circle cx={c.x} cy={c.y} r={c.r} class="stroke-foreground" stroke-width="1" />
		{/each}
	</svg>
</div>
