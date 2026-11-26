# v3 build notes (for continuing after a context reset)

Source: /home/claude/v3 (backup: /mnt/user-data/outputs/v3-src). Build: `python3 build.py out.html`
(concatenates head.html + <style>all.css</style> + body.html + <script>core_pre.js + lessons/*.js sorted + zz-boot.js</script> + tail.html).
Published artifact (update in place): https://claude.ai/artifact/WHNtGbwvPv8mVWqvzTReKR ; also copy out.html -> /mnt/user-data/outputs/site-v3.html

## Done
Linux 10, Git 4, Bash 4, Python 4, Ansible 3, AWS 6, Terraform 3, Docker 4, K8s 8, CI/CD 3, Observability 4, SRE 5, Projects 9 (59-proj-*; engine 59-proj-00-engine.js = PROJ()), Interview 1 (60). DevOps course COMPLETE (70 lessons: + linux/troubleshoot in 09b-troubleshoot.js, + projects/p10 Python). Module order now ... ansible, docker, aws, terraform, k8s ... Projects: p3 Containerized, p4 AWS, p5 Terraform. Next: review END_NOTES with Mahmoud, then security track. Then security track (CEH/SOC).

## Lesson pattern
(function(){ ... LESSON(mod,id,{title,sub,time,level,S,legend,hud,nodes,links,controls,goal,learn,steps}) })();
Scene viewBox 720x470. Left area x 0..380 for nodes; right column: panel {t:'panel',x:392,y:14,w:316,h:170} + term {t:'term',x:392,y:198,w:316,h:252}.
Helpers: H.tile(id,x,y,title,sub,tone,{w,h,fs,status,show}), H.box(id,x,y,label,tone,{center:true,led,lock,sub:fn}), H.lk(a,b,tone,{on:fn,dash}), crowd node.
Terminal: <=46 chars per line; '! ' prefix = red error line; '$ ' = typed command. Panel rows: string | {t,tone} | fn(S).
Steps: t,b,k:[kind,title,text],pill,tt,focus,S,set,hud,term,termClear,once,flows,timed,fx,goal(Try-it).
Try-it step goal:true + controls; runs with A.after must use a run id to cancel stale runs (see 21-py-apis.js `L()`).
Keep HUD chip values short (<= ~12 chars) or 1280x720 wraps.

## Tests
layout.py (LES=a,b VPS=1440x900,1280x720 ...): overlaps, clipped tile text, card scroll, scale. mob.py: phone/tablet. bh.py lesson step "btn|btn" ms: behaviour.
Each module: tester pass (4 viewports + mobile + behaviour) and teacher pass (accuracy of commands/outputs).

## User decisions pending: see END_NOTES.md

Test tools added: subchk.py (header text clipped, all lessons), ctlchk.py (control buttons overflowing the card, all lessons), snapc.py (screenshot after clicks; SEP env for labels with '|'), bh.py honours SEP too.
Site-wide fix: lesson subtitle now wraps to 2 lines (was cut with ellipsis on ~40 lessons); full text also in its title tooltip.
Rule: named control groups + wide items can overflow the card -> use unnamed groups for long labels.
Rule: Try-it terminal output lines must also stay <=46 chars (layout.py only checks step terms).
Right rail: "Commands in this lesson" card (#cmds) built from every '$ ' line in the steps' term arrays (joins '\' continuations); click number = go to step, ⧉ = copy. On desktop it fills leftover rail height (flex:1) and if shorter than 110px it collapses to its header (click to expand); hidden only if even the header does not fit. Logic: lessonCmds/buildCmds/fitCmds in core_pre.js.
Views: top nav + drawer nav switch Learn / Practice (#practice, #practice-<mod>) / Cheatsheets (#cheatsheets, #cheatsheets-<mod>). Code in lessons/zx-views.js (setView/routeView, practice quiz, cheatsheet builder). Question bank lessons/zw-practice-bank.js (64 Qs, options shuffled at runtime, best scores in PS.pq). Lesson deep link: #mod-id~STEP.
Drawer (<=1100px): app-style, full height with its own brand bar + close, Learn/Practice/Cheatsheets buttons, dimmed+blurred scrim, Esc/scrim closes, staggered slide-in.
Step labels: .tl.tight shows only the current label when labels would overlap (fitSteps()).
Search palette: lessons/zy-search.js. Opens with Ctrl/⌘K, "/", header search or mobile search button. Index: modules, pages, lessons, every step (title+text), every command. Groups: Modules & pages, Lessons, Commands, Lesson steps. Recent searches in localStorage (syam:recent).
Header sizing: all header controls 34px; nav items fixed height; kbd no-wrap; HUD tools vertically centred.
Home view (#home, also empty hash; brand click): continue card (PS.last = {k,s} saved on every go()), progress ring + stats, module cards (open first unfinished lesson), shortcuts. "Learn" nav resumes PS.last.
Extras (lessons/zy3-extras.js): study streak (PS.days per local date, counted on every step), spaced review of wrong practice answers (PS.rv, Leitner gaps 1/3/7/14/30 days, "Review · N due" chip, #practice-review), focus mode (F key / Focus button hides the course tree on desktop, PS.focus). Certificates were built and then removed at Mahmoud's request.
