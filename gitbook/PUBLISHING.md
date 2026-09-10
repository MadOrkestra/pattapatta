# Publishing this book on GitBook

1. Create a GitBook space linked to this GitHub/Git repo.
2. Set the docs root using [`.gitbook.yaml`](../.gitbook.yaml) (`root: ./gitbook/`).
3. Ensure `SUMMARY.md` and `README.md` are at that root (already true).
4. After API or example changes, regenerate assets:

```bash
npm run docs:examples
```

Commit the updated `gitbook/assets/*.svg` so GitBook can render them without a build step.
