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

	const siteUrl = 'https://pattapatta.madorkestra.com';
	const siteName = 'pattapatta';
	const defaultDescription =
		'Pen-plotter geometry library — hatching, circle packing, triangulation, meshing, boolean paths, and SVG I/O for Node and the browser.';

	let { children } = $props();

	const pager = $derived(findPager(page.url.pathname));
	const title = $derived(pager.current?.title ?? siteName);
	const pageTitle = $derived(
		pager.current ? `${pager.current.title} · ${siteName}` : `${siteName} — pen-plotter geometry`,
	);
	const description = $derived(defaultDescription);
	const canonical = $derived(
		page.url.pathname === '/' ? siteUrl : `${siteUrl}${page.url.pathname}`,
	);
	const ogImage = `${siteUrl}/og.png`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="icon" href="/icons/icon-32.png" type="image/png" sizes="32x32" />
	<link rel="icon" href="/icons/icon-16.png" type="image/png" sizes="16x16" />
	<link rel="apple-touch-icon" href="/icons/icon-192.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="canonical" href={canonical} />

	<meta name="theme-color" content="#1c1917" />
	<meta name="description" content={description} />
	<meta name="author" content="MadOrkestra" />
	<title>{pageTitle}</title>

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="pattapatta — circle with 45° hatch fill" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content="pattapatta — circle with 45° hatch fill" />
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
