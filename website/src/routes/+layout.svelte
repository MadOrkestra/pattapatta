<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { findPager } from '$lib/nav';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		SidebarInset,
		SidebarProvider,
		SidebarTrigger,
	} from '$lib/components/ui/sidebar/index.js';
	import DocsSidebar from '$lib/components/docs/docs-sidebar.svelte';
	import DocsPager from '$lib/components/docs/docs-pager.svelte';
	import ModeToggle from '$lib/components/docs/mode-toggle.svelte';

	let { children } = $props();

	const pager = $derived(findPager(page.url.pathname));
	const title = $derived(pager.current?.title ?? 'pattapatta');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#1c1917" />
	<meta name="description" content="Pen-plotter geometry docs — hatching, packing, boolean paths" />
	<title>{title} · pattapatta</title>
</svelte:head>

<ModeWatcher />

<SidebarProvider>
	<DocsSidebar />
	<SidebarInset>
		<header
			class="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4"
		>
			<SidebarTrigger class="-ms-1" />
			<Separator orientation="vertical" class="mr-1 h-4" />
			<p class="truncate text-sm font-medium">{title}</p>
			<div class="ms-auto">
				<ModeToggle />
			</div>
		</header>
		<main class="flex flex-1 flex-col px-4 py-8 md:px-8">
			<div class="prose prose-stone dark:prose-invert mx-auto w-full max-w-3xl flex-1">
				{@render children()}
				<DocsPager pathname={page.url.pathname} />
			</div>
		</main>
	</SidebarInset>
</SidebarProvider>
