## Summary

<!-- What changed, in a few bullets. -->

## Why

<!-- The problem or ticket this solves. -->

## Test plan

- [ ] Unit tests added or updated for the change
- [ ] `npm run lint && npm run typecheck && npm test && npm run test:contract`
- [ ] `npm run build && npm run smoke:pack`

## Checklist

- [ ] PR title is a conventional commit (`feat:`, `fix:`, `chore:` ...). Release notes are built from it
- [ ] API change? The spec was changed first in `documentation/openapi/public`, then `npm run sync-spec` and `npm run generate` here
- [ ] No breaking change to the public API, or the title says `feat!:` and explains it
- [ ] README updated if usage changed
