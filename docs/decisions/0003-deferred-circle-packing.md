---
title: "Deferred circle-packing algorithms"
status: accepted
owners: []
created: 2026-09-11
updated: 2026-09-11
version: 1.0.0
---

# Deferred circle-packing algorithms

## Status

`accepted`

## Context

PGS exposes packing methods beyond lattices and LEC-style inscribed packs (`tangencyPack`, `trinscribedPack`, and a fuller `obstaclePack` / front-chain). Porting those line-for-line is high cost and GPL-adjacent risk under our clean-room policy. Plotter users primarily need **contained** disks (fully inside the path) and **overlap** lattices (PGS-compatible coverage).

## Decision

1. Ship **overlap** (default) and **contained** modes for square/hex lattices.
2. Keep **LEC / stochastic / front-chain / repulsion** approximations as implemented.
3. Ship a **simple** `obstaclePack`: successive LECs that treat caller-supplied circles as obstacles (not a full PGS obstacle packer).
4. **Defer** `tangencyPack` and `trinscribedPack` until there is a clear clean-room design and plotter demand; document them as unimplemented in the inventory / API docs.

## Consequences

- Oracle lattice goldens continue to validate **overlap** mode only.
- Contained mode is the recommended plotter fill for “fill the region with equal disks.”
- Callers needing Apollonius / true tangency graphs must wait or compose MIC packs themselves.

## Document history

| Version | Date       | Author | Summary        |
|---------|------------|--------|----------------|
| 1.0.0   | 2026-09-11 | agent  | Initial ADR    |
