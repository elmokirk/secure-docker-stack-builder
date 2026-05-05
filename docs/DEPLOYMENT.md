# Deployment

The Stack Builder is a static app.

## GitHub Pages

1. Push this repo to GitHub.
2. Enable Pages with GitHub Actions as the source.
3. The included workflow builds and publishes `dist/`.

## Local Preview

```powershell
npm install
npm run build
npm run preview
```

## Vercel

Use:

- install command: `npm install`
- build command: `npm run build`
- output directory: `dist`
