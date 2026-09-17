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
4. The generated `content/photos.generated.json` stores stable content-hash IDs, paths, dimensions, and any metadata. Files are ordered by relative filename; use numeric prefixes in source filenames if you want a specific order. Re-running the import updates the manifest and removes old generated images. Keep `photo-source/` intact between runs.

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

## Deploy to Vercel

Push the project to a Git repository, add the generated `public/photos/` assets and song to that repository or your deployment process, and import the repository into Vercel. Vercel detects Next.js; build command is `npm run build`. The original `photo-source/` folder is not needed in deployment. The app has `noindex` metadata, which discourages search indexing but **does not make a public deployment private**. Use deployment access controls or an unshared URL if privacy matters.
