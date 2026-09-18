<script lang="ts">
	import { arcDivision, serializePathData } from 'pattapatta';

	let arcs = $state(8);
	let seed = $state(7);
	let circlePoints = $state(48);

	const cellPaths = $derived.by(() => {
		const n = Math.max(0, Math.floor(Number(arcs) || 0));
		const rng = Math.floor(Number(seed) || 1);
		const segs = Math.max(8, Math.floor(Number(circlePoints) || 8));
		const cells = arcDivision(100, 100, n, rng, segs);
		return cells.paths.map((p) => serializePathData(p.rings, p.closed));
	});
</script>

<div class="not-prose space-y-4">
	<div class="flex flex-wrap items-end gap-3">
		<label class="flex w-28 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Arcs</span>
			<input
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				type="number"
				min="0"
				max="24"
				step="1"
				bind:value={arcs}
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
		<label class="flex w-28 flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Circle pts</span>
			<input
				class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				type="number"
				min="8"
				max="96"
				step="8"
				bind:value={circlePoints}
			/>
		</label>
	</div>

	<p class="text-muted-foreground text-sm">
		{cellPaths.length} cell{cellPaths.length === 1 ? '' : 's'}
	</p>

	<svg
		class="border-border bg-muted/30 text-foreground aspect-square w-full max-w-md rounded-lg border"
		viewBox="0 0 100 100"
		fill="none"
		aria-label="Arc division preview"
	>
		{#each cellPaths as d, i (i)}
			<path {d} class="stroke-foreground" stroke-width="1" />
		{/each}
	</svg>
</div>
