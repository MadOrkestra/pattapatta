/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `pattapatta-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()),
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
		}),
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);
			const cached = await caches.match(event.request);

			if (ASSETS.includes(url.pathname)) {
				return cached ?? fetch(event.request);
			}

			try {
				const response = await fetch(event.request);
				const cache = await caches.open(CACHE);
				if (response.ok) cache.put(event.request, response.clone());
				return response;
			} catch {
				if (cached) return cached;
				throw new Error(`Network error for ${event.request.url}`);
			}
		})(),
	);
});
