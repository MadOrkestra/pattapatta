<script lang="ts">
	import {
		createRect,
		hatchParallel,
		segmentsToOpenPaths,
		serializePathData,
	} from 'pattapatta';

	let spacing = $state(6);
	let angleDeg = $state(45);

	const cell = createRect(15, 15, 70, 70);
	const outlineD = serializePathData(cell.rings, cell.closed);

	const hatchPaths = $derived.by(() => {
		const strokes = hatchParallel(cell, {
			spacing: Math.max(2, Number(spacing) || 2),
			angle: ((Number(angleDeg) || 0) * Math.PI) / 180,
		});
		return segmentsToOpenPaths(strokes).map((p) => serializePathData(p.rings, p.closed));
	});
</script>

<div class="not-prose space-y-4">
	<div class="flex flex-wrap items-end gap-3">
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
	</div>

	<svg
		class="border-border bg-muted/30 text-foreground aspect-square w-full max-w-md rounded-lg border"
		viewBox="0 0 100 100"
		fill="none"
		aria-label="Parallel hatch preview"
	>
		<path d={outlineD} class="stroke-foreground" stroke-width="1.25" />
		{#each hatchPaths as d, i (i)}
			<path {d} class="stroke-foreground" stroke-width="1" />
		{/each}
	</svg>
</div>
