# Futurelab FDE School

**Become a Forward Deployed Engineer.**

Futurelab FDE School is a 3-month programme for working engineers who want to become Forward Deployed Engineers (FDEs): engineers who sit with business teams, scope the real problem and put AI agents into production. It is taught by the team behind 50+ AI deployments across 75+ organisations.

This folder holds everything for the founding cohort launch: the landing page, the curriculum, the application form and all supporting assets.

---

## Programme at a glance

| | |
|---|---|
| **Duration** | 3 months (12 weeks) |
| **Format** | One live 2-hour session a week, plus about 45 minutes of short videos before and about 3 hours on a weekly build after |
| **Founding cohort price** | ₹35,000 + GST (regular price ₹80,000) |
| **Admission** | Selective. Every application is reviewed |
| **Certificate** | Futurelab FDE School Certificate of Completion |
| **Apply** | https://forms.gle/JrgavHXK2U2H8R3PA |

**The 4 phases**

1. **AI engineering foundations** (weeks 1 to 4): model APIs, structured outputs and tool calling, RAG, agents and MCP.
2. **Production engineering** (weeks 5 to 6): evals, guardrails, data privacy, full stack apps, deployment and monitoring.
3. **Forward deployment** (weeks 7 to 8): discovery, solution design, scoping and a take-home client brief.
4. **Capstone** (weeks 9 to 12): a brief inspired by real Futurelab work, ending with Demo Day.

---

## Folder structure

```
fde-school/
├── README.md
├── landing-page/
│   └── futurelab-fde-school.html
├── curriculum/
│   └── Futurelab_FDE_School_Curriculum.docx
├── forms/
│   ├── google-form-header.jpg
│   └── form-link.md
└── assets/
    ├── brand/
    │   ├── futurelab-logo.png
    │   └── futurelab-brand-SKILL.md
    ├── founders/
    │   ├── kuntal-sharma.jpg
    │   └── shabbir-haider.jpg
    ├── client-logos/
    │   └── (8 client logos)
    └── quotes/
        └── (3 headshots used in the quotes section)
```

| Folder | What's inside |
|---|---|
| `landing-page/` | The full landing page as a single HTML file. All images, styles and animations are built in, so it opens in any browser with nothing else needed |
| `curriculum/` | The 4-page curriculum: every week's engineering concepts, tools, client skill and build |
| `forms/` | The Google Form header image and `form-link.md`, which lists the form link, every question and the form settings |
| `assets/brand/` | The Futurelab logo and the Futurelab brand guide (colours, fonts, logo rules, voice) |
| `assets/founders/` | Photos of Kuntal Sharma and Shabbir Haider, used in the hero and faculty sections |
| `assets/client-logos/` | The 8 client logos shown in the "Organisations we've worked with" row |
| `assets/quotes/` | Headshots of Aaron Levie, Thomas Kurian and Carrol Chang, used with their public quotes about FDEs |

---

## Viewing the landing page

Open `landing-page/futurelab-fde-school.html` in any browser. It works on desktop and mobile.

**What's on the page**

- Hero with founder photos and the founding cohort call to action
- Key facts, a moving strip of FDE demand facts, and impact numbers (75+, 50+, 20,000+)
- Client logo row
- The opportunity: FDE demand data and quotes from industry leaders
- What an FDE does, who the programme is for, and outcomes
- Programme format and the 12-week curriculum (in tabs by phase)
- What makes it different, faculty, capstone and Demo Day
- Founding cohort price, how selection works, and FAQs

**Built-in animations:** text fades up on scroll, numbers count up, logos scroll in a loop, and blocks float near the founder photos. All movement switches off for visitors who have "reduce motion" turned on.

---

## Adding the page to the website

The Futurelab website is built with React, TypeScript, Vite and Tailwind CSS, with Framer Motion for animation, and is deployed on Netlify.

The HTML file here is the approved design and content. To add it to the site:

1. Rebuild each section as a React component in `src/components/`.
2. Add the page in `src/pages/`, with all text in `src/data/` so wording can be changed without touching the layout.
3. Move images from `assets/` into `public/`.
4. Recreate the animations with Framer Motion.
5. Point every "Apply" button to the form link above.
6. Test on mobile, then deploy.

---

## Brand basics

- **Fonts:** Space Grotesk (headings) and Inter (body text), both from Google Fonts
- **Background:** light only. Silver `#EBEDF0`, White `#FFFFFF`, Pale `#F8F9FA`
- **Text:** Ink `#111111`, Secondary `#4B5563`
- **Accents, used sparingly:** Gold `#F0D679`, Sky `#82C3FF`, Mint `#86DEB4`, Rose `#F49AB1`, Lilac `#C0A1EE`
- **Writing style:** plain English, short sentences, no em dashes, no hype

Full details are in `assets/brand/futurelab-brand-SKILL.md`.

---

## Sources for figures and quotes on the page

- FDE job postings rose from 643 to 5,330 in a year (Indeed data, reported by Business Insider)
- 5,200+ US FDE postings in the first seven months of 2026 (Lightcast)
- Aaron Levie, Co-founder and CEO, Box: post on X
- Thomas Kurian, CEO, Google Cloud: reported by Fast Company
- Carrol Chang, CEO, Andela: quoted by Illinois Tech
- Andreessen Horowitz (a16z): post on X

Quotes are from public remarks. The people quoted are not affiliated with or endorsing Futurelab.

---

## Still to be confirmed

- Cohort start date, application deadline and free info session date (shown as TBD)
- Instalment options (shown as "to be confirmed")

---

© 2026 Futurelab Studios. All rights reserved.
