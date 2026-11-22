# justinsmithphd.com

Static Jekyll site, served by GitHub Pages.

- `index.html` – the home screen (fluid background + typewriter intro). Edit the intro text in `assets/typewriter.js`.
- `_config.yml` – title, description, email.
- `_posts/` – notepad entries. New file: `_posts/YYYY-MM-DD-slug.md` with front matter `layout: note` and `title:`.
- `assets/fluid.js` – WebGL2 fluid sim. Tuning knobs are in `CFG` at the top.

Local preview: `jekyll serve` then open http://localhost:4000.
