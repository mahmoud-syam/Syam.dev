# SYAM.DEV — Interactive DevOps Course

An animated, hands-on DevOps course that runs as a single web page. Every lesson has an isometric scene that reacts as you move through the steps, a terminal, and a "Try it" challenge.

**70 lessons · 14 modules · 605 steps**

Linux → Git → Bash → Python → Ansible → Docker → AWS → Terraform → Kubernetes → CI/CD → Observability → SRE → 10 real-world projects → Interview preparation

## Features

- **Learn**: step-by-step animated lessons with a live scene, terminal output and a Try-it challenge in every lesson
- **Practice**: 64 questions across 12 modules, explained answers, links back to the lesson, best scores saved
- **Cheatsheets**: every command from every lesson (577), searchable, one-click copy, jump to the step that explains it
- **Search** (`Ctrl K` / `⌘K` / `/`): lessons, steps and commands in one place
- **Home**: progress, study streak, continue where you left off, module overview
- **Spaced review**: questions you miss come back after 1, 3, 7, 14 and 30 days
- **Focus mode** (`F`): hide the course tree and give the lesson the whole width
- Light and dark theme, works on desktop, tablet and phone
- **Installable app**: add it to your phone or computer home screen; it keeps working offline
- **Move your progress**: export a code or file on one device and import it on another (Home page or the Progress card)
- No framework: the whole course is one self-contained `index.html` plus a small service worker

Progress is saved in your browser (localStorage). Use Export / Import to carry it to another device.

## Run locally

Open `index.html` in a browser. That's it.

## Project layout

```
index.html          the built site (served by GitHub Pages)
manifest.webmanifest, sw.js, icon-*.png   install-as-app + offline support
src/
  head.html body.html tail.html   page shell
  all.css           all styles
  core_pre.js       engine: scene renderer, steps, HUD, terminal, course tree
  lessons/          one file per lesson + practice bank, views, search
  build.py          concatenates everything into one HTML file
  BUILD_NOTES.md    conventions for writing lessons
tools/              Playwright checks used while building (layout, mobile, behaviour)
```

## Rebuild after editing

```bash
cd src
python3 build.py ../index.html
```

## Checks (optional)

The tools need Python Playwright with Chromium.

```bash
LES=docker/images VPS=1280x720,1440x900 python3 tools/layout.py
python3 tools/ctlchk.py
```
