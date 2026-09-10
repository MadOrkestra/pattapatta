<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RiMoonLine, RiSunLine } from 'remixicon-svelte';
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggleMode}
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if mode.current === 'dark'}
		<RiSunLine class="size-4" />
		<span class="sr-only">Light</span>
	{:else}
		<RiMoonLine class="size-4" />
		<span class="sr-only">Dark</span>
	{/if}
</Button>
