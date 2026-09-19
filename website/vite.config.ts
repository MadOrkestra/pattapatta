import { mdsvex } from 'mdsvex';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { highlight } from './mdsvex-highlight.js';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: undefined,
				precompress: false
			}),
			prerender: {
				entries: ['*']
			},
			preprocess: [
				mdsvex({
					extensions: ['.svx', '.md'],
					highlight: { highlighter: highlight }
				})
			],
			extensions: ['.svelte', '.svx', '.md']
		})
	]
});
