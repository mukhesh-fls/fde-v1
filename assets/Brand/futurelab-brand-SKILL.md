---
name: "futurelab-brand"
description: "Official Futurelab Studios brand guideline. Use whenever producing Futurelab-branded content — PDFs, PPT/Keynote decks, Word/Google docs, websites, landing pages, social graphics, email templates, proposals, reports, or any internal/external collateral. Applies the Futurelab colour palette, typography, logo rules, and voice so output feels natively on-brand."
---

# Futurelab Studios — Brand Guideline

Futurelab Studios is a Forward AI Deployment company and AI enablement studio working across India, the GCC, Africa and Southeast Asia. Tagline: **"Your Forward AI Deployment partner, turning AI into scalable and measurable value."** Mission: *technology should empower, not overwhelm.*

When asked to design, draft or generate any Futurelab deliverable, **read this file first** and apply the rules below. Adapt the system to the medium; don't copy layouts mechanically.

**Palette version: "Afterhours" (Brand Essentials v1.0, adopted September 2026).** The identity is sophisticated, vibrant, bold and practical. Silver is the everyday canvas, White is the reading surface, Charcoal is for launches and statements. There is **one tier of five accents**, always carrying Ink text. This replaces the earlier "Futurelab Fresh" palette (white + steel grounds, +2/+3 accent tiers), which is retired.

## Brand assets

- **Primary logo:** the supplied horizontal lockup — a 3×3 grid glyph with one offset square top-right, "futurelab" in black, "studios" in grey. Source of truth: `https://futurelabstudios.com/images/logo.png` (4554×1139, transparent). If a logo file is provided in the conversation or folder, use that file.
- **Stacked logo:** the stacked original suits square formats (social avatars, 1:1 posts, stickers). Use it only if the file is supplied; never build one.
- Never redraw, crop, stretch, recolour or re-typeset the logo. Preserve proportions and colours.
- Clear space on every side: at least the height of the grid icon.
- On coloured or dark backgrounds (any accent, Charcoal, Deep, Iron), place the logo in a **white holder** (a White rounded card). There is no white/inverted logo.
- Minimum size: 24px tall on screen, 8mm in print. Default placement: top-left.

## Colour — Afterhours

### Accents (one tier, exact values)
| Token | Name | Hex | Ink contrast |
|---|---|---|---|
| `--fl-rose` | Rose | `#F49AB1` | 9.1:1 |
| `--fl-mint` | Mint | `#86DEB4` | 11.8:1 |
| `--fl-sky` | Sky | `#82C3FF` | 10.1:1 |
| `--fl-lilac` | Lilac | `#C0A1EE` | 8.6:1 |
| `--fl-gold` | Gold | `#F0D679` | 13.1:1 |

Sky was tuned from the Essentials PDF's `#92C4F5` to `#82C3FF` so all five accents have matching colour strength (OKLCH chroma ≈ 0.11). Always use `#82C3FF`.

Silver was lightened from the Essentials PDF's `#E2E5E9` to `#EBEDF0` for an airier canvas; White cards still read clearly on it. Always use `#EBEDF0`.

### Neutral foundations
| Token | Name | Hex | Role |
|---|---|---|---|
| `--fl-silver` | Silver | `#EBEDF0` | **Default canvas.** The everyday ground for web shells, deck covers, social backgrounds |
| `--fl-white` | White | `#FFFFFF` | Reading surfaces, work areas, document pages, cards on Silver, logo holders |
| `--fl-pale` | Pale | `#F8F9FA` | Quiet panels, table headers, subtle callouts on White |
| `--fl-iron` | Iron | `#B7BDC5` | Optional statement surface; borders on Silver |
| `--fl-charcoal` | Charcoal | `#242628` | Dark moments: launch/statement slides, dark sections, footers |
| `--fl-deep` | Deep | `#191A1C` | Dark outer canvas behind Charcoal panels |
| `--fl-ink` | Ink | `#111111` | Primary text on every light surface and every accent; primary buttons; icons |
| `--fl-secondary` | Secondary | `#4B5563` | Supporting text on White, Pale and Silver only |
| `--fl-light` | Light | `#F5F3EF` | Primary text on Charcoal/Deep |
| `--fl-dark-secondary` | Dark secondary | `#D0D5DB` | Supporting text on Charcoal/Deep |

### Colour rules
- **Start with one lead accent and one supporting accent.** Add more only when a layout has several separate items (e.g. four metric tiles), and then one accent per item.
- **Use accents as flat colour fields, cards and callouts** — never as page backgrounds for long reading, never as gradients.
- **Ink text on every accent.** Never Secondary grey on an accent (it drops below 4.5:1 on Rose, Sky and Lilac), never white or Light text on an accent.
- **On Charcoal/Deep:** Light `#F5F3EF` for text, Dark secondary `#D0D5DB` for support, Gold for the one highlighted word or CTA. Sky may be used for a secondary accent on dark.
- **No gradients, blends, glows, chrome or neon.** Flat fills only.
- **Never pure `#000000`.** Use Ink `#111111`.
- **Charts:** key series in Ink (Light on dark), supporting series in accents, labels placed directly on lines. At most three hues per chart.
- **Highlight marker (optional):** a Gold band behind the lower ~35% of 1–3 key words in a headline. At most one per headline. On Charcoal, colour the key word Gold instead.
- Default pairings for consistency (not a code; no service owns a colour): Rose → workshops/training/events; Mint → build/deployments; Sky → run/workflows/advisory; Lilac → case studies/research/careers; Gold → announcements, key metrics, exercises.

### Three treatments
| Treatment | Ground | Accents | Use for |
|---|---|---|---|
| **Silver** (default) | Silver canvas, White work areas | Any, one lead + one supporting | Everyday brand: website, decks, social, collateral |
| **Charcoal** | Charcoal (Deep as outer canvas) | Gold lead, Sky support | Launches, statements, hiring, closing slides |
| **White campaign** | White | **Gold + Sky + Ink only** | Campaign-specific work. Keep Rose, Mint and Lilac out of this treatment |

All three are the same Afterhours system — don't mix treatments within one piece except for a Charcoal closing slide/section.

### Retired values — do not use
Futurelab Fresh (retired Sept 2026): steel `#EEF1F4`, steel-2 `#E3E8ED`, +2 `#FFB6BC` `#ABF0CC` `#9BD1FF` `#DCC3FF` `#FBE7A6`, +3 `#FF9EA8` `#8EEFBF` `#77C1FF` `#D2AFFF` `#FBE085`, text-muted `#6B7280` (use Secondary). Older pastels: `#FAD9DB` `#CCF0DC` `#D6E8F8` `#E5D9F7` `#FBF0CC` `#F6F7F8` `#EFF1F3`. Also the Essentials PDF's original Sky `#92C4F5` and original Silver `#E2E5E9`.

Mapping: pink → Rose, green → Mint, blue → Sky, purple → Lilac, yellow → Gold, steel → Silver (as ground) or Pale (as panel on White).

## Typography

**Two families only.** Build hierarchy with size and spacing, not extra typefaces.

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | **Space Grotesk** | 700 | Headlines, card titles, big numbers, brand moments |
| Body | **Inter** | 400, 700 | 400 for body copy; 700 for labels, buttons and emphasis |

- Headlines: Space Grotesk 700, line-height 1.0–1.1, tracking −0.03em (tighter, to −0.045em, at very large sizes). Sentence case; never all-caps for main headlines.
- Body: Inter 400, line-height 1.5–1.6, no tracking. Lines near 65 characters.
- Labels / eyebrows / tags: Inter 700, uppercase, +0.08–0.12em tracking, small size, in Secondary (or Dark secondary on Charcoal). No monospace.
- Wordmark (only where the logo file can't be used, e.g. live text in a nav): "futurelab" Space Grotesk 700 Ink + "studios" 500 Secondary, same size.
- Install the supplied font files before editing. In Office apps without Space Grotesk, use Inter for everything. **Email may fall back to Arial**; nowhere else.

### Starting sizes (check at actual viewing size)
| Medium | Headline | Body / support |
|---|---|---|
| Web | 64–80px hero; 40–48px on mobile | 16–18px |
| Deck | 36–48pt title | 18–24pt |
| Social (1080px wide) | 80–112px | 32–40px |
| Documents | 20–28pt headings | 11–12pt |

## Shape & finish

- Generous space, aligned edges, flat colours, subtle borders.
- Radii: **24px** cards and tiles, **32px** hero panels, **fully rounded** pills (buttons, tags). Small inputs/chips may use 16px.
- Borders: 1px `rgba(17,17,17,0.08)` on White/Pale; Iron `#B7BDC5` hairline on Silver when a card needs definition. On Charcoal, `rgba(245,243,239,0.12)`.
- Shadows: none or very subtle (`0 8px 24px rgba(17,17,17,0.06)`). No heavy shadows.
- Motion (web): ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`, 300–400ms, hover lift 2px. Respect reduced motion.
- Icons: thin-stroke line icons (1.5–2px), Ink, rounded joins. Small rounded squares in accents may serve as bullets/markers (they echo the grid glyph). No emoji in formal collateral. No clip-art or decorative clutter.

## Voice & messaging

- **Website hero:** Your Forward AI Deployment partner, turning AI into scalable and measurable value.
- **Tagline:** Putting intelligence to work inside real organisations.
- **Services** (use these words when listing): 1) **Forward AI deployment** — Custom AI software built and deployed around how an organisation already works, including a central intelligence layer that connects its teams, knowledge and systems ; 2) **Workflow automation** — we map how a team works, decide task by task where AI should help and where people stay in charge, and automate only where it pays off ; 3) **Capability building** — practical AI workshops and learning programmes that help teams adopt, operate and improve the systems they use. Deployment stages on the website: **Build** (intelligence layer), **Run** (workflow automation), **Hand over** (team capability building).
- **How we sound:** clear, warm, confident. Short sentences, active verbs, concrete outcomes. Write to a person ("you"). Demystify AI.
- **Avoid:** hype ("revolutionise", "unleash", "disrupt", "game-changing"), generic slogans, buzzword salad, unsupported claims, exclamation marks, emoji in formal work.
- Headline pattern: tight noun phrases or clear benefit statements, e.g. "AI that works for your team, not around it."
- Use only numbers that can be backed up (e.g. 75+ organisations, 50+ AI deployments, 20,000+ professionals trained).

## Applying the system

### Website / app
- **Silver shell, White work areas, purposeful accent modules.** The page canvas is Silver; content sits in White cards/panels (24–32px radius). Accents fill specific modules: metric tiles, service cards, diagram panels, selected states.
- Nav: sticky, White at ~90% with backdrop blur, hairline bottom border; active link as a Silver pill; Ink pill CTA on the right.
- Hero: Silver or White panel, Ink headline (optional Gold marker), Ink pill CTA + outline pill.
- Metrics: one accent tile per number, big Space Grotesk numbers in Ink.
- Footer: Charcoal, Light text, Gold on the key word ("Enabling **abundance.**"), logo in a white holder.
- Primary button: Ink fill, White text, Inter 700, pill, 14×24px padding. On Charcoal: Gold fill, Ink text.
- Selected state: Gold fill with hairline Ink border.
- Container width `min(1180px, 100vw - 3rem)`; sections ≥ 5–7rem vertical padding.

### Knowledge Hub & category cards
- Category accents: Rose (tools/coding, e.g. Cursor), Mint (platforms/AI assistants, e.g. Replit, Claude), Sky (developer tools/integrations, e.g. GitHub Copilot), Lilac (advanced/research), Gold (courses/learning).
- Resting card: White on the Silver canvas. Hover/active/selected: the category's accent fill.
- Level tags ("Beginner", "Intermediate"): accent pill chips with a hairline `rgba(17,17,17,0.08)` border.
- Category accents may also mark section-header squares, active sidebar states and tag fills in dashboards or directories.

### Pitch & workshop decks
- 16:9, one idea per slide.
- **Cover: Silver or Charcoal.** Logo top-left (white holder on Charcoal), title Space Grotesk 36–48pt, subtitle Inter 18–24pt, one or two accent blocks.
- **Content slides are light:** White or Silver ground, Ink text, max five bullets. Accent cards for steps/concepts (one accent per card).
- Case study: Silver slide, one large accent panel for the story, White inset boxes for need / what we built / result.
- Workshop exercise ("your turn") slides: a large Gold panel.
- Closing / launch slides: Charcoal, Light headline, key phrase in Gold.

### Documents (proposals, reports, PDFs, Word/Google Docs)
- **White reading pages**, clear headings, restrained accent callouts. A4 or Letter, 24–32mm margins.
- Cover may use a Silver band or panel with the logo top-left (~40mm) and title 28–40pt; one accent block or strip.
- Headings Space Grotesk 20–28pt (H1), scaling down for H2/H3; body Inter 11–12pt Ink, line-height 1.5.
- Callouts and table headers on Pale or Silver; key-figure boxes may take one accent.
- Links in Ink, underlined, never blue. Footer/page numbers Inter 9pt Secondary.

### Social
- One strong message, bold headline, generous margins, one action.
- 4:5 (1080×1350) for LinkedIn/Instagram feed, 1:1 where needed. Outer margin ≥ 80px at 1080 wide.
- Silver background by default; White cards and accent cards on top; one lead + one supporting accent per post.
- Headline 80–112px Space Grotesk 700, left-aligned, ≤ 8 words. Support copy 32–40px Inter.
- Logo top-left (or bottom-right) in its original form on Silver/White; in a white holder on Charcoal or accents.
- Launch/hiring posts may use the Charcoal treatment. One key number or one photo per post, never both.
- Footer row: small meta text left, Ink pill CTA right. Carousels: a row of Ink progress segments and "01 / 06" in Inter 700.

### Email
- White body, Ink text, Inter with Arial fallback. One accent at most (a Gold or Sky callout or button border). Logo top-left.

### CSS tokens
```css
:root {
  /* accents */
  --fl-rose:  #F49AB1;
  --fl-mint:  #86DEB4;
  --fl-sky:   #82C3FF;
  --fl-lilac: #C0A1EE;
  --fl-gold:  #F0D679;

  /* neutrals */
  --fl-silver:   #EBEDF0;
  --fl-white:    #FFFFFF;
  --fl-pale:     #F8F9FA;
  --fl-iron:     #B7BDC5;
  --fl-charcoal: #242628;
  --fl-deep:     #191A1C;

  /* text */
  --fl-ink:            #111111;
  --fl-secondary:      #4B5563;
  --fl-light:          #F5F3EF;
  --fl-dark-secondary: #D0D5DB;

  /* lines, shape, motion, type */
  --fl-line: rgba(17,17,17,0.08);
  --fl-line-dark: rgba(245,243,239,0.12);
  --fl-radius-sm: 16px;
  --fl-radius-lg: 24px;
  --fl-radius-xl: 32px;
  --fl-radius-pill: 999px;
  --fl-shadow-subtle: 0 8px 24px rgba(17,17,17,0.06);
  --fl-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --fl-font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
  --fl-font-body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

/* Optional highlight marker, max one per headline */
.fl-mark {
  background: linear-gradient(transparent 62%, var(--fl-gold) 62%, var(--fl-gold) 94%, transparent 94%);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
```

Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
```

## Before anything goes out
1. Exact colours (Afterhours values, Sky `#82C3FF`, Silver `#EBEDF0`, no retired Fresh hexes), correct fonts (Space Grotesk + Inter only), and the logo unchanged with clear space.
2. Ink text on every accent; Light text on Charcoal; everything readable at final viewing size.
3. Right treatment: Silver by default, Charcoal for launches/statements, White campaign limited to Gold + Sky + Ink.
4. One lead + one supporting accent; flat fills; no gradients, neon, chrome or heavy shadows.
5. Verified facts and working links; no placeholders.
6. Inspect the export and save it beside the editable source.

If any answer is no, fix it before delivering.