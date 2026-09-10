<script lang="ts">
	import { resolve } from '$app/paths';
	import { findPager } from '$lib/nav';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RiArrowLeftLine, RiArrowRightLine } from 'remixicon-svelte';

	let { pathname }: { pathname: string } = $props();

	const pager = $derived(findPager(pathname));
</script>

{#if pager.prev || pager.next}
	<nav
		class="not-prose mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-stretch sm:justify-between"
		aria-label="Page navigation"
	>
		{#if pager.prev}
			<Button
				variant="outline"
				href={resolve(pager.prev.href as '/')}
				class="h-auto justify-start gap-2 px-3 py-3 text-left whitespace-normal"
			>
				<RiArrowLeftLine class="size-4 shrink-0" />
				<span class="flex min-w-0 flex-col gap-0.5">
					<span class="text-muted-foreground text-xs font-normal">Previous</span>
					<span class="truncate font-medium">{pager.prev.title}</span>
				</span>
			</Button>
		{:else}
			<div class="hidden sm:block"></div>
		{/if}
		{#if pager.next}
			<Button
				variant="outline"
				href={resolve(pager.next.href as '/')}
				class="h-auto justify-end gap-2 px-3 py-3 text-right whitespace-normal sm:ml-auto"
			>
				<span class="flex min-w-0 flex-col gap-0.5">
					<span class="text-muted-foreground text-xs font-normal">Next</span>
					<span class="truncate font-medium">{pager.next.title}</span>
				</span>
				<RiArrowRightLine class="size-4 shrink-0" />
			</Button>
		{/if}
	</nav>
{/if}
