# Eco-Track — UI v2 Redesign Spec (Visual Upgrade + New Features)

> Feed this whole file to your AI coding tool. It **replaces the visual direction** of the v1 spec and **adds features**. Keep the v1 routes, data model and stack unless changed here.

**Stack:** React + Vite + TypeScript, Tailwind CSS, React Router, **Framer Motion** (animation), **lucide-react** (icons), **Recharts** (charts), **Leaflet + react-leaflet** (maps), **react-hot-toast**, Firebase later (keep a `services/` mock layer).

---

## 0. What's wrong with v1 (fix all of this)

| Problem | Fix |
|---|---|
| UI feels empty and flat: one narrow column, huge blank margins, no personality | Use bento grids, side panels, hero visuals, soft gradients, illustrations, real depth |
| **Navbar shows everything to everyone**: Feed, My Reports, Org Dashboard, Login, bell and Report button all at once, even when logged out | **Role-aware navbar** (see §2) |
| Tiny pixelated logo image | Use a clean vector mark (leaf-pin icon) + wordmark, SVG only |
| Empty states are a grey icon and text | Illustrated, friendly empty states with a clear CTA |
| Login card is plain; site chrome repeats on auth | Split-screen auth page, no marketing navbar clutter |
| Report flow is a bare dropzone | Guided, animated, camera-first stepper with live preview and map |
| No landing page, no sense of impact | Add landing page with live stats, how it works, features, map teaser |
| Dashboard is a single table row | Add charts, hotspot map, activity feed, richer cards |

---

## 1. Visual direction: "Fresh, airy, alive"

Still **light and minimal**, but with more depth and delight. Think Airbnb × Linear × a nature app.

### Palette (light)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F6FAF8` | App background (with soft mint radial glows) |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-glass` | `rgba(255,255,255,.72)` + `backdrop-blur(16px)` | Navbar, floating panels, bottom sheets |
| `--ink` | `#10231C` | Headings |
| `--text` | `#2F4A40` | Body |
| `--muted` | `#7A8F87` | Secondary |
| `--brand-500` | `#34B27B` | Primary |
| `--brand-600` | `#27976A` | Hover |
| `--brand-100` | `#DDF4E8` | Soft fills |
| `--aqua` | `#4CC9C0` | Secondary accent (water / SDG 6 feel) |
| `--sun` | `#FFC857` | Highlights, points, badges |
| `--sky` | `#6FA8FF` | Info |
| `--coral` | `#FF7A6B` | Alerts, reported |
| `--line` | `#E4EEE9` | Hairlines |

**Signature gradient:** `linear-gradient(135deg, #34B27B 0%, #4CC9C0 100%)` — use on primary CTA, hero accents, progress bars, stat numbers (text-clip).
**Background decoration:** 2–3 blurred gradient blobs (mint, aqua, a hint of sun) behind hero/sections; faint dotted grid on empty areas. No harsh black.

### Shape, depth, type
- Font pairing: **Plus Jakarta Sans** (headings, 700/800) + **Inter** (body). Hero heading 56–64px on desktop, tight tracking.
- Radius: cards `20–24px`, buttons `14px` (pill for primary CTA), chips pill.
- Shadows layered: `0 1px 2px rgba(16,35,28,.04), 0 12px 32px -8px rgba(16,35,28,.10)`; hover lifts `translateY(-4px)` with stronger shadow.
- Cards have a 1px `--line` border + inner highlight; images get rounded corners and a subtle gradient overlay at the bottom for text.
- Use **bento layouts** (mixed-size cards) on landing and dashboards.
- **Motion (Framer Motion):** page fade/slide-in, staggered card entrance, hover lift, animated counters, number tick-ups, checkmark draw on success, skeleton shimmer, smooth tab underline (`layoutId`). Keep it subtle; respect `prefers-reduced-motion`.
- Illustrations: inline SVG / simple geometric shapes (leaves, pins, bins, droplets). No stock clip-art. Emoji only for badges.

---

## 2. Navbar (rebuild)

**Glass sticky bar**, height 68px, max-width 1200px, floating with 12px top margin and rounded `20px` on desktop (pill-style), turns solid on scroll with shadow.

**Left:** vector logo + "Eco-Track" wordmark (link to `/`).

**Center links (change by auth state/role):**

| State | Links |
|---|---|
| Logged out | Home · Feed · How it works · Impact |
| Citizen | Feed · Map · My Reports · Leaderboard |
| Organisation | Dashboard · Nearby · Feed · Analytics |
| Admin | Overview · Approvals · Reports · Users |

**Right:**
- Logged out → `Log in` (ghost) + `Get started` (gradient pill). **No bell, no Report button for logged-out users** (Report button can show but should route to login if not authed).
- Logged in → **Report garbage** button (gradient pill with camera icon, citizens only), notification bell with unread count popover, avatar dropdown (Profile, My points, Settings, Language, Sign out).
- Active link: soft brand pill background + dark text (not just green text). Animated underline/pill using `layoutId`.
- **Mobile:** collapse to logo + bell + avatar; **bottom tab bar** (Feed · Map · ➕ big centered Report FAB · Reports · Profile) with glass background and safe-area padding.
- Remove duplicated links, "Org Dashboard" must never be visible to citizens, "Login" must never show when logged in.

---

## 3. Pages (redesigned)

### 3.1 Landing `/`
1. **Hero** (full-width, gradient blobs): left: badge *"♻️ SDG 6 · Clean Water & Sanitation"*, H1 *"See garbage? Snap it. Track it. Watch it disappear."*, sub-copy, CTAs (**Report garbage**, **Explore the feed**), trust row (avatars + "1,200+ reports resolved"). Right: floating phone mock showing a report card, with 2–3 small floating cards around it (e.g. "📍 Reported · FC Road", "✅ Verified by Pune Cleanup Crew", "+50 pts") that gently bob (Framer Motion float).
2. **Live stats strip:** animated counters (Reports, Resolved, Organisations, Avg response time, kg waste cleared estimate).
3. **How it works** — 4 connected steps with icons and a line animating between them: Report → Notify & assign → Clean → Verify & resolve (use the project's own wording).
4. **Bento feature grid** (6 tiles, mixed sizes): Geotagged reports · AI waste detection · Before/After verification · Live map & hotspots · Eco points & badges · Org dashboards.
5. **Before / After showcase:** interactive draggable slider with a real-looking example + verified badge.
6. **Map teaser:** embedded Leaflet map of Pune with colored pins, overlay card "Live reports near you".
7. **For citizens / For NGOs & authorities** — two side-by-side cards with benefits + CTA.
8. **Testimonials / pilot partners** (placeholder cards), **FAQ accordion**, **final CTA band** (gradient), then rich footer (links, SDG 6 note, language switcher, social).

### 3.2 Feed `/feed`
Replace the single narrow column with a **3-zone layout** (desktop):
- **Left rail (260px, sticky):** filters — Status (chips), Waste type (icon chips), Severity, Distance slider (1–25 km), Sort. "Clear filters".
- **Center (feed):** report cards in a **masonry/2-column grid** (1 column on mobile). Top: search bar + List/Grid/Map toggle + "Near me" button.
- **Right rail (300px, sticky):** *Nearby hotspots* mini map, *Top contributors* (top 5 with points), *Recently resolved* carousel, *Community events* card.

**Report card v2:** image with bottom gradient, status pill top-left, severity dots top-right, waste-type icon chip, title, address + distance, reporter avatar + name, time. Footer: 👍 upvote (animated pop), 💬 comments, ↗ share, 🔖 save. Resolved cards show a green "Verified ✓" ribbon and a mini before/after thumbnail. Hover: lift + image zoom 1.04.
Add **sticky "stories" row** at top: circular thumbnails of *Recently cleaned spots* (before/after) — click to open a full-screen viewer.
Skeleton shimmer while loading; illustrated empty state ("All clear nearby 🌿") with "Report something" CTA.

### 3.3 Report flow `/report/new` (camera-first, 4 steps)
Full-screen focused flow (hide marketing nav; show close ✕ and animated progress bar).
1. **Capture:** large camera/upload area with dotted animated border; tips ("Include landmarks", "Daylight helps"); multi-photo (up to 4) + optional 10s video. On upload → **AI check** animation: "Detecting waste…" then chips auto-filled (e.g. *Plastic · High confidence 92%*). Block/blur warning if image is dark/blurry or no waste detected ("We couldn't spot garbage. Retake?").
2. **Location:** GPS auto-detect with pulsing blue dot, draggable pin on Leaflet map, address autocomplete, accuracy badge, "Use my location" and "Search address". Show nearby existing reports → **duplicate detection** ("A similar report exists 40 m away: Upvote it instead?").
3. **Details:** waste type icon grid, severity slider with colored feedback, "Near water body / drain" toggle (SDG 6 tie-in, raises priority), optional note with voice-to-text button, **Post anonymously** toggle.
4. **Review & submit:** summary card preview exactly as it'll appear in the feed. Success screen: animated check + confetti, **+20 Eco points**, "Track this report", "Share on WhatsApp".

### 3.4 Report detail `/report/:id`
- Two-column on desktop: left media gallery (swipeable, video support) + sticky map card; right: status, title, meta, **vertical animated timeline**, action card.
- **SLA timer** badge ("Awaiting action · 6h 12m") and **priority score** chip.
- **Before/After slider** with verification card: Location match ✓ (distance in m) · Waste reduction % (animated ring) · AI confidence · Final verdict.
- Org card (logo, rating ⭐, avg response) once accepted. Comments with replies, reactions, report-abuse menu. "Still dirty?" → reopen request with photo.
- Share sheet: WhatsApp, copy link, QR code.

### 3.5 My Reports `/my-reports`
- Header with profile summary: avatar, **Eco level** (progress ring), points, streak 🔥, badges row.
- Segmented tabs (All · Active · Resolved) with counts; cards show mini progress stepper (5 dots). Illustrated empty state with CTA.

### 3.6 Map `/map` (new)
Full-screen Leaflet map: clustered pins colored by status, **heatmap toggle** of garbage hotspots, filters floating top-left, bottom-sheet preview on pin tap, "Locate me" FAB, legend card. Light map tiles (CartoDB Positron).

### 3.7 Org dashboard `/org`
- Greeting header with org logo, verified badge, **Filter + Search**, and a **Service area** selector.
- 4 **gradient stat cards** with sparkline and delta vs last week.
- **Bento row:** left — Recharts area chart "Reports vs Resolved (30 days)"; right — donut "By waste type"; below — **hotspot heatmap** card and **Team/volunteers** card.
- Tabs: Nearby · Accepted · Awaiting verification · Completed. Rows become **rich cards/table** with thumbnail, priority, distance, SLA countdown, severity pills, **Accept** / **Navigate** (opens Google Maps directions) / **Submit proof**.
- Bulk actions, CSV export, notification preferences, **performance score + public rating**.

### 3.8 Submit proof `/org/report/:id/proof`
Side-by-side before vs after capture; live **distance-from-report** meter (green ≤ 30 m, amber 30–100 m, red > 100 m); capture only via live camera option to reduce fakes (upload allowed with EXIF GPS check); optional video; checklist (waste collected, area swept, disposal method); verifying animation → result card (Verified / Needs another look).

### 3.9 Auth `/login`, `/register`
**Split-screen:** left — gradient panel with illustration, rotating quote and impact stats; right — form card. Social login buttons (Google), show/hide password, role toggle on register (**Citizen / Organisation**), org verification upload with "Pending approval" state, password strength meter, inline validation. Minimal chrome (logo + back link only).

### 3.10 New pages
- `/leaderboard` — podium for top 3, weekly/monthly/all-time tabs, city and college filters.
- `/impact` — public impact dashboard: counters, charts, ward-wise heat table, downloadable monthly report (PDF).
- `/events` — community cleanup drives: create/join, date, location, RSVP count, calendar add.
- `/profile` — avatar, points, badges, certificates, language, notification settings, report history.
- `/admin` — org approvals, flagged content, user management, analytics.
- `/how-it-works`, `/about`, `/faq`, `/privacy`.

---

## 4. Extra features to add (UI + mock logic first)

**Reporting & AI**
- AI waste-type auto-detection with confidence and editable result
- Duplicate-report detection and "merge/upvote"
- Image quality check (blur/dark) before submit
- Auto-priority score (severity + near water/drain + upvotes + age)
- Voice note / speech-to-text for description
- Anonymous reporting option
- Offline queue (PWA): save report offline, auto-sync later

**Community & motivation**
- **Eco points, levels, streaks, badges** (First Report, Hotspot Hero, Water Guardian, 10 Verified, etc.)
- Weekly **leaderboard**; shareable **impact card** image ("I helped clean 5 spots")
- **Cleanup events** and volunteer sign-up
- Comment/upvote/save; follow an area ("Notify me about Deccan")
- Downloadable **certificates** for NGOs/volunteers

**Organisations & authorities**
- SLA timers and escalation (auto-flag if no action in 24h)
- Org rating & response-time public stats
- Team assignment (assign to a worker/vehicle), route to site via Maps
- Hotspot heatmap and weekly analytics, CSV/PDF export

**Platform**
- **Notifications center** (in-app + email/push placeholders), granular preferences
- **Multilingual:** English, हिन्दी, मराठी (i18n with `react-i18next`)
- Dark mode toggle (optional; light stays default)
- Accessibility: AA contrast, focus rings, keyboard nav, alt text, reduced motion
- PWA install prompt, share to WhatsApp, QR code per report
- Trust & safety: report abuse, profanity filter, rate limiting, face/number-plate blur (future flag)
- Command palette (`Ctrl/Cmd + K`) for quick navigation (nice-to-have)

---

## 5. Component additions

`GlassNavbar` · `BottomTabBar` · `HeroPhoneMock` · `AnimatedCounter` · `BentoGrid` · `FilterRail` · `ReportCardV2` · `StoryRing` · `BeforeAfterSlider` · `ProgressRing` · `StepperTimeline` · `SlaBadge` · `PriorityChip` · `PointsToast` · `BadgeCard` · `LeaderboardPodium` · `HeatmapLayer` · `MapSheet` · `SplitAuthLayout` · `EmptyState (illustrated)` · `SkeletonShimmer` · `ShareSheet` · `ConfettiBurst` · `LanguageSwitcher` · `NotificationPopover` · `CommandPalette`

---

## 6. Mock data upgrades
- 25+ reports around **Pune** (FC Road, Deccan, Karve Nagar, Kothrud, Baner, Swargate…) with varied statuses, severities, waste types and real-looking Unsplash image URLs.
- 6 organisations (mix of municipal + NGOs) with ratings and response times; 12 users with points/badges; 5 events; 30 days of stats for charts.
- Extend types: `priorityScore`, `slaDueAt`, `nearWater: boolean`, `aiDetection: { type, confidence }`, `duplicateOf?`, `anonymous: boolean`, `points`, `badges[]`, `events[]`.

---

## 7. Quality bar / Do-not list
- Never leave large blank areas: fill with rails, cards, illustrations or stats.
- No default-looking forms: every input has an icon, focus glow and helpful microcopy.
- Consistent spacing (8px grid), consistent radius, max 2 font families.
- No logged-out users seeing org/citizen-only links; no duplicate navbar items.
- All pages responsive (mobile-first), with loading, empty and error states.
- Keep it **light, minimal and sleek**: depth comes from gradients, glass, spacing and motion, not from clutter or heavy colours.

---

## 8. Build order
1. Design tokens, fonts, Tailwind theme, base components, glass navbar + bottom tabs (role-aware)
2. Landing page
3. Feed v2 (rails, cards, stories, map toggle)
4. Report flow v2 with AI-check mock + duplicate detection
5. Report detail + before/after + timeline
6. Auth split-screen, My Reports with gamification
7. Org dashboard with charts + proof flow
8. Map, Leaderboard, Impact, Events, Profile, Admin
9. i18n, notifications, PWA, polish pass (motion, a11y, performance)

---

## 9. Ready-to-paste prompt

> Redesign my existing **Eco-Track** React + Tailwind app using this spec. Keep current routes, mock data and services layer, but **rebuild the UI** to be visually rich yet minimal and light: mint-to-aqua gradients, glassmorphism navbar, bento layouts, Plus Jakarta Sans + Inter, layered shadows, and Framer Motion micro-interactions. **First fix the navbar** so links are role-aware (logged out / citizen / org / admin) and remove duplicate or wrong items. Then build in the order given in §8, starting with steps 1–4, and add the extra features in §4 using mock logic. Install only: framer-motion, recharts, react-leaflet + leaflet, react-hot-toast, react-i18next, qrcode.react, canvas-confetti. Make everything responsive, accessible and consistent. After each step, summarise what changed and list any files touched.
