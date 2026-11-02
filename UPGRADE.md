# Keep your content when upgrading

The new version opens on the normal portfolio first. The game is available from Play, and the existing game, character, music, media, PDF viewer, and star-collection rules are preserved.

1. Extract the new ZIP into a new folder.
2. Copy your old `dist/assets/` folder into the new `dist/assets/` folder.
3. Copy your personalized old `dist/content.js` into the new `dist/content.js`. The included content file is unchanged from the previous supplied version; it cannot contain edits you made only on your own computer.
4. Keep the new `dist/ui/` folder. Built-in interface assets now live here, separate from your uploads.
5. Run `python3 serve.py` (Windows: `py serve.py`) from the project folder and open http://localhost:8000.

No content keys, image paths, link fields, or file names need changing. The new portfolio has no additional required content fields. Keep `ui/` when copying the site to Git or Render.

You can also update your existing project by replacing `dist/index.html`, `dist/app.js`, `dist/style.css`, and `build.mjs`, and adding `dist/portfolio.css` plus the entire `dist/ui/` folder. Leave your existing `dist/content.js` and `dist/assets/` alone.
