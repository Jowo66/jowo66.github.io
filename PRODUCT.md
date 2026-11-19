# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain static HTML, CSS and a little vanilla JavaScript. No framework and no build step. Hosted on GitHub Pages at https://jowo66.github.io. Playwright tests run in GitHub Actions.

## Users

Primary: recruiters and hiring managers reading for co-op and internship roles in software. They skim for about thirty seconds, then open a project, GitHub or a contact link. Secondary: classmates and collaborators who arrive through the playful Neo-Jowo OS site.

## Product Purpose

A personal portfolio for Ejovwo Obahor, a computer science student in Toronto. The landing page shows what he builds (browser graphics, audio and simulations) and makes it easy to inspect the work. Success: a recruiter understands who he is, sees at least one real project, and reaches GitHub, a project or a contact link.

## Positioning

The work is built end to end without frameworks: a 3D renderer on a 2D canvas, a generative music synthesiser, agent simulations, an offline asset pipeline and automated browser tests. The portfolio itself is the proof, and it has a playful twin (Neo-Jowo OS) that a plain page cannot replace.

## Operating Context

Read on desktop and phone, usually briefly. The live site is a static GitHub Pages deployment; every push to `main` goes live. Other projects live in separate repositories under github.com/Jowo66 with their own pages: Mini Gym (/strong/), Reverb // Worlds (/reverb-worlds/), Weather Report (/weather-report/).

## Capabilities and Constraints

- The plain page becomes the root URL. The cyberpunk site moves to `neo.html` and every internal link is updated.
- An English, French and Spanish hover translator (`lang.js`) is shared across pages and must keep working.
- No fabricated personal facts. A photo is not yet provided; it stays hidden until supplied (user decision).
- No Hebrew text anywhere on the site.
- No paid services.
- Commit trailers are required on every commit.

## Brand Commitments

The name is Ejovwo Obahor. The playful side is the cyberpunk Neo-Jowo OS and must stay one clear step away from the landing page (ANTI-FUN / FUN switch).

## Evidence on Hand

- This repository: Neo-Jowo OS, nightclub (Casa Sofia / Playa Sofia), generative house-music engine, Spotify integration, hover translator, Playwright tests with CI (see `PROJECT_REPORT.md`).
- Live sibling projects: Mini Gym, Reverb // Worlds, Weather Report.
- From the resume (Claude Doc "Ejovwo Obahor — Resume"): Sheridan College, Honours BSc Computer Science (Cloud Computing); email; LinkedIn; work history at IJE, Halton Multicultural Council and William's Fresh Café; coursework projects (The Maple Table on AWS, IoT home camera, ride booking module); AWS Cloud Practitioner exam prep via LinkedIn Learning (Nov 2026).
- Kept off the site: phone number.
- Graduation year: 2028 (user confirmed). Public resume: https://claude.ai/artifact/GT6soQaRK9JSX5kVdJHR3K
- Absent, and not to be invented: photo, testimonials.

## Product Principles

1. Show real work before describing the person.
2. Every claim on the page is something the repository can demonstrate.
3. Gaps stay out of sight instead of being filled with placeholders or invention.
4. The playful site is a feature of the portfolio, one click away, never a barrier to the plain page.

## Accessibility & Inclusion

Keyboard operable, visible focus, sufficient contrast in both colour schemes, respects `prefers-reduced-motion`, and the language switcher stays usable without a mouse for navigation (hover translation itself is mouse or tap).
