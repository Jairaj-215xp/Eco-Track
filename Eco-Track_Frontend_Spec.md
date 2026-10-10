# Eco-Track — Frontend Build Spec

> AI-Powered Community Waste Reporting & Cleanup Verification
> SDG 6 (Clean Water & Sanitation) · Hand this file to your coding tool/AI as the single source of truth for the UI.

---

## 1. Product in one paragraph

A citizen photographs garbage; the app auto-captures GPS and posts it to a public **feed**. Nearby **municipal authorities** and **registered NGOs** are notified; one **accepts** the report, cleans the spot, and uploads **proof** (new photo/video, auto-geotagged). The system compares before/after (AI-assisted + location match) and marks the report **Resolved** or **Reopened**.

**Report lifecycle:** `Reported → Assigned → In Progress → Proof Submitted → Verified (Resolved)` or `→ Reopened`

---

## 2. Design direction: sleek, minimal, light

**Feel:** calm, airy, trustworthy. Lots of whitespace, soft shadows, rounded corners, almost no borders. One accent colour. No gradients-on-everything, no clutter.

### Colour tokens (light only)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F8FAF9` | App background |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--surface-2` | `#F1F5F3` | Inputs, chips, hover |
| `--border` | `#E6ECE9` | Hairlines (1px, used sparingly) |
| `--text` | `#1B2B25` | Primary text |
| `--text-muted` | `#6B7C75` | Secondary text |
| `--accent` | `#4FB286` | Primary buttons, links, active states |
| `--accent-soft` | `#E4F5EC` | Accent backgrounds |
| `--warn-soft` / `--warn` | `#FFF3DC` / `#C98A1B` | In progress / pending |
| `--info-soft` / `--info` | `#E6F0FF` / `#3D6FD8` | Assigned |
| `--danger-soft` / `--danger` | `#FDE8E8` / `#D45353` | Reported / Reopened |
| `--success-soft` / `--success` | `#E4F5EC` / `#2E8F63` | Verified |

### Type & shape
- Font: **Inter** (fallback `system-ui`). Sizes: 12 / 14 / 16 / 20 / 28. Weights 400, 500, 600 only.
- Radius: cards `16px`, buttons/inputs `12px`, chips `999px`.
- Shadow: `0 1px 2px rgba(20,40,30,.04), 0 8px 24px rgba(20,40,30,.06)`.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32. Content max-width `1080px`; feed column `640px`.
- Icons: **lucide-react**, stroke 1.75, muted colour by default.
- Motion: 150–200ms ease-out fades/slides only. Respect `prefers-reduced-motion`.

### Status chips

| Status | Chip colours |
|---|---|
| Reported | danger-soft / danger |
| Assigned | info-soft / info |
| In Progress | warn-soft / warn |
| Proof Submitted | surface-2 / text-muted |
| Verified | success-soft / success |
| Reopened | danger-soft / danger (outlined) |

---

## 3. Tech stack (from Review 0)

- **Web:** React + Vite + TypeScript, Tailwind CSS, React Router
- **Mobile (later):** React Native (reuse tokens/logic)
- **Backend:** Node.js + Firebase (Auth, Cloud Functions, Firestore, Storage)
- **Maps:** Leaflet + OpenStreetMap (free, no key) — or Google Maps if a key is available
- **AI verification:** called via a Cloud Function; frontend only shows the result and a confidence label

> For the UI phase, use **mock data + a service layer** (`/services/*.ts`) so Firebase can be plugged in without touching components.

---

## 4. Roles

| Role | Can do |
|---|---|
| **Citizen** | Report, browse feed, upvote/comment, track own reports |
| **Authority / NGO** (verified org) | See nearby reports, accept, upload proof, view stats |
| **Admin** (optional) | Approve org registrations, handle disputes |

---

## 5. Pages & routes

| Route | Page | Who |
|---|---|---|
| `/` | Landing | All |
| `/feed` | Public feed (list + map toggle) | All |
| `/report/new` | Report flow | Citizen |
| `/report/:id` | Report detail + timeline | All |
| `/my-reports` | My reports + statuses | Citizen |
| `/org` | Org dashboard (nearby, accepted, completed) | Authority/NGO |
| `/org/report/:id/proof` | Submit cleanup proof | Authority/NGO |
| `/login`, `/register` | Auth (role picker: Citizen / Organisation) | All |
| `/about` | How it works, SDG 6 | All |

---

## 6. Screen specs

### 6.1 Landing
- Top nav: logo (leaf + "Eco-Track"), links (Feed, How it works), **Report garbage** button (accent).
- Hero: headline *"Report it in a photo. Track it till it's clean."*; sub-copy one line; two CTAs (**Report garbage**, **Browse feed**). Right side: soft illustration/phone mock of a report card.
- "How it works" — 4 icon steps in one row: **Report → Notify & assign → Clean → Verify & resolve**.
- Small stat strip (Reports, Resolved, Active organisations) — pull from mock/Firestore counts.
- Footer: minimal, SDG 6 note.

### 6.2 Feed (`/feed`)
- Sticky filter bar: status chips, distance (1 / 5 / 10 km), waste type, sort (Newest / Nearest / Most upvoted). **List | Map** toggle.
- **Report card:** photo (16:10, rounded), status chip, short title/waste type, area name + distance, time ago, upvote count, comment count. Whole card clickable.
- Map view: pins coloured by status; bottom sheet preview on pin tap.
- Empty state: leaf icon + "Nothing reported nearby. That's good news."
- Infinite scroll with skeleton cards.

### 6.3 New report (`/report/new`) — 3 quick steps, one screen each
1. **Photo** — camera/upload (drag-drop on desktop), preview, retake. Validation hint if image is blurry/dark.
2. **Location** — auto-detected via GPS, mini map with draggable pin, address text (editable), accuracy badge (e.g. "±12 m"). Show friendly prompt if permission denied → manual pin.
3. **Details** — waste type chips (Household, Plastic, Construction, Organic, Near water/drain, Other), severity (Low/Med/High), optional note, **Submit**.
- Progress dots at top; sticky bottom primary button. Success screen with check animation + "Track this report".

### 6.4 Report detail (`/report/:id`)
- Large photo; status chip; location mini-map; waste type, severity, reporter (first name), time.
- **Timeline** (vertical, minimal): Reported → Accepted by *{org}* → Cleanup in progress → Proof submitted → Verified/Reopened, each with timestamp.
- **Before / After** slider (appears once proof exists) with verification result card: `Location match ✓`, `Waste reduction: High`, `Result: Verified`.
- Actions by role: Citizen → upvote, comment, "Still dirty?" (flag/reopen request). Org → **Accept** / **Submit proof**.
- Comments (simple, flat).

### 6.5 Org dashboard (`/org`)
- Tabs: **Nearby** · **Accepted** · **Awaiting verification** · **Completed**.
- Compact table/list: thumbnail, location, distance, severity, age, action button.
- Top summary cards (4): New nearby, In progress, Verified this month, Avg. response time.
- Notification bell with dropdown for new nearby reports.

### 6.6 Submit proof (`/org/report/:id/proof`)
- Side-by-side: original photo (left) vs. upload slot (right).
- Capture/upload photo or short video; **auto-attach GPS**; show distance from original report pin ("12 m from report location ✓" / warning if > 50 m).
- Submit → status becomes *Proof Submitted* → loading state "Verifying…" → result card.

### 6.7 My reports (`/my-reports`)
- Segmented tabs: All · Active · Resolved. Same card style as feed but with status emphasis and a mini timeline progress bar.

### 6.8 Auth
- Centered card, minimal fields. Register has a **Citizen / Organisation** toggle; org adds name, type (Municipal / NGO), service area, ID/proof upload → "Pending approval" state.

---

## 7. Component library (build these first)

`Button` (primary / soft / ghost) · `Input` · `Select` · `Chip` · `StatusChip` · `Card` · `ReportCard` · `Avatar` · `Tabs` · `SegmentedToggle` · `Modal` / `BottomSheet` · `Toast` · `Skeleton` · `EmptyState` · `Timeline` · `BeforeAfterSlider` · `MapView` · `LocationPicker` · `PhotoUploader` · `StatCard` · `NotificationBell` · `Navbar` · `Footer`

---

## 8. Data model (for typing mock data)

```ts
type Status = 'reported' | 'assigned' | 'in_progress' | 'proof_submitted' | 'verified' | 'reopened';

interface Report {
  id: string;
  photoUrl: string;
  location: { lat: number; lng: number; address: string; accuracyM: number };
  wasteType: 'household' | 'plastic' | 'construction' | 'organic' | 'near_water' | 'other';
  severity: 'low' | 'medium' | 'high';
  note?: string;
  status: Status;
  reporterId: string;
  assignedOrgId?: string;
  upvotes: number;
  createdAt: string;
  timeline: { status: Status; at: string; by?: string }[];
  proof?: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    location: { lat: number; lng: number };
    distanceFromReportM: number;
    submittedAt: string;
    verification?: {
      locationMatch: boolean;
      wasteReduction: 'none' | 'partial' | 'high';
      result: 'verified' | 'reopened';
    };
  };
}

interface Organisation { id: string; name: string; type: 'municipal' | 'ngo'; serviceArea: string; approved: boolean; }
interface User { id: string; name: string; role: 'citizen' | 'org' | 'admin'; orgId?: string; }
```

Seed 12–15 mock reports around **Pune (18.52 N, 73.85 E)** across all statuses.

---

## 9. UX rules & states

- Every async view has **loading (skeleton), empty, error** states.
- Mobile-first; breakpoints 640 / 1024. Bottom tab bar on mobile (Feed · Report · My reports · Profile), top nav on desktop. The **Report** button is a centered accent FAB on mobile.
- Accessibility: contrast AA on text, visible focus ring (`--accent` 2px), alt text on images, tap targets ≥ 44px, status never conveyed by colour alone (chip includes text + icon).
- Privacy: show reporter's first name only; blur faces/number plates is a *future* enhancement (note in UI backlog).
- Microcopy: friendly, short, no jargon. E.g. "Spot it. Snap it. Track it."

---

## 10. Folder structure

```
src/
  components/ui/        # Button, Chip, Card...
  components/report/    # ReportCard, Timeline, BeforeAfterSlider
  pages/                # Landing, Feed, NewReport, ReportDetail, OrgDashboard, ...
  services/             # reportService.ts, authService.ts (mock → Firebase)
  hooks/                # useGeolocation, useReports
  data/mock.ts
  styles/tokens.css
  types.ts
```

---

## 11. Build order (suggested)

1. Tokens, Tailwind config, base UI components
2. Landing + Navbar/Footer
3. Feed (list) with mock data → map toggle
4. New report flow (photo → location → details)
5. Report detail + Timeline + Before/After
6. Org dashboard + Submit proof
7. Auth + role-based routing
8. Polish: skeletons, empty states, responsive, a11y pass
9. Swap services to Firebase; wire AI verification Cloud Function

---

## 12. Ready-to-paste prompt

> Build the Eco-Track frontend using **React + Vite + TypeScript + Tailwind + lucide-react + React Router**, following this spec exactly. Use a **light, minimalist, sleek** design with the given colour tokens, Inter font, generous whitespace, soft shadows, and rounded corners. Start with steps 1–4 of the build order, using mock data from `data/mock.ts` and a `services/` layer. Mobile-first and accessible. Ask before adding any dependency not listed.
