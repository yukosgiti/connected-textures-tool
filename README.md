# Texture

A texture is stored in a canvas element of size 16x60 (using the SIZE and FRAMES constants)

Texture data is stored in the node data

## GitHub Pages deployment

This app is configured to build as a static Next.js export so it can be published with GitHub Pages.

1. Push this repository to GitHub.
2. In the repository settings, open Pages and set the source to GitHub Actions.
3. Push to the `master` branch or run the `Deploy Next.js to GitHub Pages` workflow manually.

The build automatically infers the GitHub Pages base path from the repository name.

If you publish from a user site repository such as `your-name.github.io`, or from a custom domain, set `NEXT_PUBLIC_BASE_PATH` to an empty string in the workflow or repository variables.