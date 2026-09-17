# A birthday keepsake for Sumaya

A Next.js 16, TypeScript, Tailwind CSS birthday surprise made by Shiam. The complete experience works before photos or music are added. The celebration is fixed to 18 September 2026 and can be opened at any time.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To verify a release build:

```bash
npm run build
npm start
```

## Add photos (100+ is fine)

1. Put original photos in `photo-source/`. Subfolders are supported. This folder is ignored by Git and is never served publicly.
2. Run `npm run photos:import`.
3. The script scans JPG, PNG, WebP, AVIF, HEIC/HEIF, and TIFF files; reports unsupported, unreadable, and duplicate files; and writes optimized WebP images to `public/photos/`. It corrects orientation and strips EXIF, including GPS. The gallery receives small thumbnails, while the slideshow and lightbox use larger display images. Originals stay in `photo-source/`.
4. The generated `content/photos.generated.json` stores stable content-hash IDs, paths, dimensions, and any metadata. Files are ordered naturally by relative filename, so `1.png`, `2.png`, `10.png` stay in numeric order. Re-running the import updates the manifest and removes old generated images. Keep `photo-source/` intact between runs.

For 100–300 photos, the gallery first renders 24, then reveals 24 more per click. Only the main hero photo is prioritized. The slideshow uses a curated subset and the lightbox preloads only adjacent display images.

### Captions, albums, and selections

Edit `content/photo-metadata.json` **after the first import**. Copy photo IDs from `content/photos.generated.json`:

```json
{
  "featured": "abcd1234abcd1234",
  "slideshow": ["abcd1234abcd1234", "ef567890ef567890"],
  "photos": {
    "abcd1234abcd1234": {
      "caption": "A little moment worth keeping",
      "album": "Favourite moments",
      "focalPoint": "50% 35%"
    }
  }
}
```

`featured` chooses the hero portrait. `slideshow` chooses and orders the story photos. If these are empty, the first photo becomes the hero and the first eight make up the story. Albums create optional filter buttons. Captions appear only when supplied. `focalPoint` is optional CSS `object-position`; it is most useful for small cropped contexts. Re-run `npm run photos:import` after metadata edits. The metadata file is separate so captions and selections survive later imports. Do not edit the generated manifest directly.

## Personalize the words

Edit `content/site.ts` for names, dates, headings, all 23 love notes, the full letter, the wish, the ending, and music settings. The starter notes are intentionally general and do not claim specific shared events.

## Add the song

Place a legally usable audio file at `public/audio/happy-birthday.mp3`. The site checks for it and hides music controls when it is absent. Visitors must interact before playback starts. The opening toggle chooses whether that interaction starts music. The cake button restarts the same shared player; sections never create overlapping tracks. Set `site.music.loop` to `true` in `content/site.ts` if you want looping, or change `site.music.src` for a different filename. Keep the audio file in `public/audio/`.

## Deploy to Netlify

The project includes `netlify.toml` (`npm run build`, publish directory `.next`) and `.nvmrc` (Node 22). Netlify uses its built-in Next.js adapter; do not add or pin a separate plugin.

1. Run `npm run photos:import` after copying your originals into `photo-source/`. Generated images in `public/photos/` and `content/photos.generated.json` **must be committed**. The original `photo-source/` folder is ignored by Git and is not needed for deployment.
2. Copy your song to `public/audio/happy-birthday.mp3` and commit it too. The `public/audio/.gitkeep` placeholder is not a song.
3. Run `npm run build` locally and check the site with `npm run dev`.
4. Commit and push the project to a Git provider. In Netlify, choose **Add new project → Import an existing project**, connect the repository, and deploy. The build command should be `npm run build` and the publish directory `.next` (already set in `netlify.toml`).
5. Visit the Netlify URL and check that photos and song load. Later changes are deployed by committing and pushing again.

The app has `noindex` metadata, which discourages search indexing but **does not make a public deployment private**. A public site exposes its images and audio to visitors. Use a private Git repository if you do not want the source files publicly visible.

## Deploy to Vercel

Vercel also supports the project: import the same repository and use `npm run build`. Generated photos and the song must be included in Git. The original `photo-source/` folder is not needed.
