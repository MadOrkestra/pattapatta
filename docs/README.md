# Documentation

Project research, design notes, decisions, and other written docs live here.

## Layout

| Path | Purpose |
|------|---------|
| [`templates/`](templates/) | Copyable Markdown templates — do not edit in place for real docs |
| [`research/`](research/) | Literature, competitor, and domain research |
| [`design/`](design/) | Technical or product design notes |
| [`decisions/`](decisions/) | Architecture and product decision records |

## Creating a document

1. Copy the matching template from `templates/` into the right content folder.
2. Rename the file with `kebab-case.md` (e.g. `competitor-landscape.md`).
3. Fill in the YAML front matter and body sections.
4. Keep the **Document history** table at the end of the file up to date.

| Kind | Template | Destination |
|------|----------|-------------|
| Research | `templates/research.md` | `research/` |
| Design | `templates/design.md` | `design/` |
| Decision | `templates/decision.md` | `decisions/` |
| Other | `templates/note.md` | Closest matching folder, or add a new top-level folder if needed |

## Front matter

Every document starts with YAML front matter:

- `title` — human-readable title
- `status` — `draft` \| `active` \| `superseded` \| `archived`
- `owners` — list of responsible people
- `created` — `YYYY-MM-DD`
- `updated` — `YYYY-MM-DD` (last meaningful edit)
- `version` — document semver (must match the latest row in Document history)

## Document versioning

Versioning applies to the **document**, not the product.

| Bump | When |
|------|------|
| **MAJOR** | Structural rewrite or conclusion / decision reversal |
| **MINOR** | New sections, findings, or material expansion |
| **PATCH** | Typos, clarifications, link fixes |

Rules:

- Start drafts at `0.1.0`.
- Move to `1.0.0` when the document is first accepted as `active`.
- On every change that warrants a bump, update `version` and `updated` in front matter **and** add a row to the Document history table at the bottom of the file.
