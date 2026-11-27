# Nightly auto-build log

Each entry is written by the scheduled build run. Newest last.

## 2026-11-27

**Rollback point:** branch `pre-auto-2026-11-27` (main HEAD before tonight, commit 24f88d7).
The proxy in the build sandbox refuses tag pushes, so the rollback point is a branch instead of a tag.
A leftover branch `auto/2026-11-27` (from a push-access test) points at the same commit and can be deleted.
To roll back: `git push origin pre-auto-2026-11-27:main --force-with-lease`.

### Built
- **Security track started: new module "Security: Ethical Hacking" (CEH)**, same lesson engine and layout as the DevOps course:
  - `ceh/phases`: Ethical hacking & the five phases. White/grey/black hat, CIA triad (with md5sum/sha256sum), scope and rules of engagement, recon → scanning → access → persistence → report instead of covering tracks. Try-it: run a legal engagement in order (blocked without a signed scope).
  - `ceh/recon`: Footprinting & reconnaissance. Passive vs active, whois, NS/MX/TXT (SPF), subdomains from certificate transparency (subfinder), search operators and theHarvester, DNS zone transfer (dig axfr) and how to block it. Try-it: map all 4 hosts of acme.example.
  - `ceh/scanning`: Scanning with Nmap. -sn host discovery, -sS and the open/closed/filtered states, -sT and -sU, -sV versions, -O and NSE, timing and -oA. Try-it: sweep, port scan, version scan to find vsftpd 2.3.4.
- 10 new practice questions (module "Hacking"), and 35 new commands in the cheatsheets (automatic from the lessons).
- README counts updated (73 lessons, 15 modules, 633 steps, 74 questions, 612 commands). Service worker cache bumped to `syam-course-v3`.

### Decisions made on Mahmoud's behalf
- Built to `app.html`, not `index.html`: since the academy move, `index.html` is only the redirect to learn.mahmoud-syam.me and the README/tools/public.sh all use `app.html`. Building into `index.html` would have broken the redirect.
- Only built CEH lessons are listed in the course tree (no "soon" placeholders), so home progress and module counts stay honest.
- Lab data is fictional: lab network 10.10.10.0/24, `target.lab`, `acme.example` with 203.0.113.x documentation IPs.
- Long tool outputs (e.g. full OpenSSH version strings, "scanned in N seconds") are trimmed to fit the 46-char terminal.

### Checks
build OK · layout.py (1440x900, 1280x720) clean on the 3 lessons · mob.py clean · ctlchk.py and subchk.py clean on all 73 lessons · Try-it behaviour checked with bh.py · no JavaScript errors (only the Google Fonts request is blocked in the sandbox).

### Needs attention
- Nothing blocking. Worker code was not touched.

### Next
1. CEH: enumeration (SMB/SNMP/LDAP), vulnerability analysis (CVE/CVSS, scanners).
2. CEH: system hacking & password attacks (hashes, cracking, privilege escalation basics), then sniffing, social engineering, web app attacks.
3. Practice questions for each new lesson; then start the SOC module (SIEM, alerts triage, log analysis, incident response).
