---
name: release
description: Commit, push and deploy Lunibù to GitHub Pages safely (secret scan, tests, build, noreply author). Use when asked to commit, push, release or deploy.
---
# Rilascio

```bash
npm run check:secrets      # blocca email personali, token, chiavi
npm test && npm run build
git -c user.name="Marketto" -c user.email="Marketto@users.noreply.github.com" commit -m "..."
git push origin main       # il workflow .github/workflows/deploy.yml pubblica su GitHub Pages
```
- Mai `git add` di `.env*`, `dist/`, `node_modules/`, screenshot o archivi.
- Il messaggio di commit termina con le righe di attribuzione richieste dalla sessione.
- Dopo il push: controlla l'esito con `gh run list --limit 1`.
