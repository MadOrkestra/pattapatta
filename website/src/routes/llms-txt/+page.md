# llms.txt

**llms.txt** is a small, structured markdown index for AI agents and coding assistants ([llmstxt.org](https://llmstxt.org)). It tells models what this library is, how to import it, and where to find detailed docs — without scraping HTML.

pattapatta also ships **llms-full.txt**: one file with every concept and API page concatenated (function signatures, option tables, examples).

## Files

| File | Use when |
|------|----------|
| [llms.txt](/llms.txt) | Agent needs a curated overview + links |
| [llms-full.txt](/llms-full.txt) | Agent should load the entire public API in one shot |
| e.g. [llms/hatch.md](/llms/hatch.md) | Agent only needs one module (see `/llms/*.md`) |

These files are **generated** from the same Markdown that powers this site (`pnpm docs:llms`). Prefer editing the normal docs pages; do not hand-edit the generated outputs.

## For humans

You usually want [Quickstart](/quickstart) or [Getting started](/getting-started). Point your AI at `/llms.txt` (or paste `/llms-full.txt`) when you want it to use pattapatta accurately.
