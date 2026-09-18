<script lang="ts">
	import LivePipelineDemo from '$lib/components/docs/live-pipeline-demo.svelte';
	import LivePackDemo from '$lib/components/docs/live-pack-demo.svelte';
	import LiveHatchDemo from '$lib/components/docs/live-hatch-demo.svelte';
	import LiveMeshingDemo from '$lib/components/docs/live-meshing-demo.svelte';
	import LiveTriangulationDemo from '$lib/components/docs/live-triangulation-demo.svelte';
</script>

<h1>Live demos</h1>

<p>
	Interactive previews of core <strong>pattapatta</strong> ops — packing, hatch, pipelines,
	triangulation, and meshing. Geometry is computed in the browser (and during prerender) — no
	server round-trip.
</p>

<h2>Pipelines</h2>

<p>
	Chained recipes: boolean / morphology → hatch or pack. Inputs are muted; result outlines and
	fill marks use the foreground stroke.
</p>

<LivePipelineDemo />

<h2>Circle packing</h2>

<p>
	Pack disks into a unit-ish rectangle with lattices, inscribed search, stochastic growth, or
	obstacle-aware packing (seed circle in the center).
</p>

<LivePackDemo />

<h2>Triangulation</h2>

<p>
	Star polygon via earcut, Delaunay, Poisson Steiner points, or Ruppert-inspired refine.
</p>

<LiveTriangulationDemo />

<h2>Meshing</h2>

<p>
	<code>createStar</code> → densify → Poisson triangulation, then graph filters, quadrangulation,
	or mesh processing. The star outline stays visible under the faces.
</p>

<LiveMeshingDemo />

<h2>Parallel hatch</h2>

<p>
	<code>createRect</code> → <code>hatchParallel</code> → <code>segmentsToOpenPaths</code>.
</p>

<LiveHatchDemo />
