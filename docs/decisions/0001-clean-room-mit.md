---
title: "Clean-room MIT reimplementation"
status: accepted
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 1.0.0
---

# Clean-room MIT reimplementation

## Status

`accepted`

## Context

PGS is licensed **GPL-3.0**. Copying or translating its Java sources into `pattapatta` would force GPL obligations on the npm package. The project needs an installable library usable from websites and scripts under a permissive license, while still matching PGS behaviour via public docs and an oracle.

## Decision

Implement `pattapatta` as a **clean-room reimplementation**:

- Study **public** API docs, README behaviour, and examples.
- Compare outputs via the Processing oracle.
- **Do not** copy PGS (or GPL dependency) source into the published package.
- License `pattapatta` as **MIT**.
- The oracle may use GPL PGS locally for golden generation; oracle artifacts (JSON/SVG geometry) are test data, not a derivative of PGS source code.

## Alternatives considered

- **GPL port / line-by-line translation** — closest fidelity, incompatible with MIT npm distribution goals.
- **Depend on a GPL jar from JS** — awkward for browsers; license contamination risk.

## Consequences

### Positive

- Permissive adoption for scripts and websites.
- Clear provenance story in research docs.

### Negative

- More implementation work than a mechanical port.
- Numeric diffs vs JTS require tolerance-based tests.

### Neutral

- API naming can still mirror PGS for familiarity.

## Related

- [../research/pgs-overview.md](../research/pgs-overview.md)
- [typescript-pgs-port.md](../design/typescript-pgs-port.md)
- [processing-oracle-cli.md](../design/processing-oracle-cli.md)

## Document history

| Version | Date       | Author | Summary        |
|---------|------------|--------|----------------|
| 1.0.0   | 2026-09-10 | agent  | Accepted ADR   |
