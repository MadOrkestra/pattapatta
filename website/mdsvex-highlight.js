import { createHighlighter } from 'shiki'

/** Languages used in docs code fences. */
const langs = [
	'typescript',
	'javascript',
	'tsx',
	'jsx',
	'bash',
	'shellscript',
	'shell',
	'sh',
	'json',
	'html',
	'css',
	'markdown',
	'md',
	'svelte',
	'yaml',
	'toml',
	'diff',
]

const themes = {
	light: 'catppuccin-latte',
	dark: 'catppuccin-mocha',
}

/** Survive Vite/HMR re-imports of this module. */
const GLOBAL_KEY = Symbol.for('pattapatta.mdsvex-shiki.catppuccin')

/**
 * @returns {Promise<import('shiki').Highlighter>}
 */
function getHighlighter() {
	const g = globalThis
	if (!g[GLOBAL_KEY]) {
		g[GLOBAL_KEY] = createHighlighter({
			themes: [themes.light, themes.dark],
			langs,
		})
	}
	return g[GLOBAL_KEY]
}

/**
 * mdsvex highlighter: build-time Shiki with dual light/dark CSS variables.
 * @param {string} code
 * @param {string | undefined} lang
 */
export async function highlight(code, lang) {
	const hl = await getHighlighter()
	const requested = (lang ?? '').trim()
	const loaded = new Set(hl.getLoadedLanguages())
	const language = requested && loaded.has(requested) ? requested : 'text'

	let html
	try {
		html = hl.codeToHtml(code, {
			lang: language,
			themes,
			defaultColor: false,
		})
	} catch {
		html = hl.codeToHtml(code, {
			lang: 'text',
			themes,
			defaultColor: false,
		})
	}

	// Safe for Svelte compilation (escapes quotes / braces via JSON).
	return `{@html ${JSON.stringify(html)}}`
}
