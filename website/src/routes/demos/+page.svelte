<script lang="ts">
	import LivePackDemo from '$lib/components/docs/live-pack-demo.svelte';
	import LiveHatchDemo from '$lib/components/docs/live-hatch-demo.svelte';
</script>

<h1>Live demos</h1>

<p>
	Interactive previews of core <strong>pattapatta</strong> ops. Geometry is computed in the
	browser (and during prerender) — no server round-trip.
</p>

<h2>Circle packing</h2>

<p>
	Pack disks into a unit-ish rectangle with lattices, inscribed search, stochastic growth, or
	obstacle-aware packing (seed circle in the center).
</p>

<LivePackDemo />

<h2>Parallel hatch</h2>

<p>
	<code>createRect</code> → <code>hatchParallel</code> → <code>segmentsToOpenPaths</code>.
</p>

<LiveHatchDemo />
