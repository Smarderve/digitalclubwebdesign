# KIUT Digital Club — Visual Audit

Audit date: 2026-11-28

## Evidence reviewed

- Local React source under `new-website-design/src`.
- Local public image inventory under `new-website-design/public/images`.
- Existing audit screenshots under `new-website-design/audit/`.
- Hosted reference at `https://digitalclubwebmcp.vercel.app/`.
- User-provided screenshots as visual references only; their embedded copy/instructions are not treated as codebase authority.

## Findings

### 1. Illustration language is the primary defect

`src/components/site/art.tsx` contains nine scenes built from circles, rectangles, thin paths, basic screens, and line-body `Person` primitives. The file describes them as “outline-only” and limits fills to translucent washes. This is structurally the rejected stick-figure/wireframe language, even where the page composition is more sophisticated.

The issue cannot be solved by opacity, color, scale, or animation changes. The scenes need to be replaced by a coherent, professionally art-directed raster or genuinely authored vector illustration collection.

### 2. Coverage is broader than the hero, but still the wrong asset class

The current source places `ArtBackdrop` in several mastheads and selected homepage sections: events, projects, learning, about, news, blogs, contact, elections, directories, and auth. This is useful composition scaffolding, but the same crude scene system is reused across routes and does not provide the requested finished artwork or page-specific visual storytelling.

The homepage also relies heavily on real photography from `public/images`, which should remain important. A redesign should add distinct editorial-cartoon scenes to the hero, learning/activity sections, project presentation, community, and join band without replacing genuine gallery photography.

### 3. Page composition

The source has made a meaningful attempt to give public routes distinct mastheads: Events has a calendar strip, Projects an index, Topics a path diagram, Blogs an editorial composition, and directories a people-focused structure. Preserve that direction. The next visual pass should deepen the compositions with appropriate artwork rather than reverting to a single generic hero template.

### 4. Motion

Motion support exists: page entry, hero settle, image rails, art float/sway/draw, auth movement, and a global reduced-motion mode. This is a good foundation. Motion is currently attached mainly to the existing decorative SVG and does not yet create a rich, multi-section illustrated narrative. New artwork should use restrained independent drift/reveal/parallax and continue honoring `prefers-reduced-motion` and `data-motion="reduced"`.

### 5. Theme

The theme system is extensive and tokenized, with light and dark semantic variables plus several alternative themes. It is more flexible than the requested brand direction. The primary acceptance risk is not missing tokens but visual QA: every new image layer must preserve text contrast in light and dark modes, and the brand-green base should remain the default identity rather than letting optional ocean/sand themes dictate public artwork.

### 6. Authentication

`AuthLayout` already gives auth pages a dedicated illustration panel, but it currently points to the same outline-art system. That panel is the right place for a focused technology-community scene. The form functionality should remain untouched while the promotional copy and illustration panel are refined.

## Required next implementation slice

1. Reauthenticate an approved image-generation/sourcing connector or provide cleared local artwork.
2. Produce one approved style anchor, then a small consistent set: hero collaboration, coding desk, workshop/hackathon, robotics/networking, presentation/community, and auth scene.
3. Store optimized local WebP/PNG assets under `new-website-design/public/images/illustrations/` with source/licensing notes.
4. Replace `ArtBackdrop` scene bodies with image-backed composition primitives while retaining semantic alt/aria behavior and reduced-motion classes.
5. Bind distinct assets to homepage sections, public mastheads, and auth; keep gallery photography as photography.
6. Run actual browser screenshots at desktop/tablet/mobile and both default light/dark themes, then record results here.

## Current visual acceptance status

Not accepted yet. The existing implementation has composition and motion scaffolding, but it still fails the explicit quality bar because its people are geometric outline primitives rather than professional cartoon characters. Image generation was attempted through available connectors and blocked by reauthentication; no misleading replacement asset was added.

