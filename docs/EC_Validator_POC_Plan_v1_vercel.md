# EC Validator — POC Plan v1 (Vercel)

**Form:** FEMA Elevation Certificate FF-206-FY-22-152 (Oct 2022)
**Scope:** Section A validation (POC); Sections B–I future scope
**Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · Anthropic Claude · Vercel Blob
**Last Updated:** July 2026

---

## 1. What Has Been Built

### 1.1 Core Validation Pipeline

The app sends the entire PDF (as base64) to Claude via a single API call. Claude reads all pages in one pass and returns extracted field values as structured JSON. Client-side TypeScript rules then run against those values synchronously — no second LLM call needed for rule evaluation.

```
User uploads PDF
  → /api/validate (POST)
      → Claude reads full PDF → ExtractionResult JSON
      → runValidation(extraction) → CheckResult[]
  → ResultsPanel renders checks
  → User reviews flags (confirm / override)
      → new VersionedOutput created client-side
      → localStorage history updated
```

### 1.2 Application Pages

| View | Trigger | Description |
|------|---------|-------------|
| Dashboard | Default (`/`) | History list, search/filter, stats, per-entry download |
| Validator | Upload or "Open Results" | Split PDF viewer + results panel |

### 1.3 Validation Checks (42 total)

> Rule catalog sourced from `agent/skills/fema-rules.md` (v2) and `agent/skills/completeness-checklist.md` (v2), rebuilt directly from FEMA Form FF-206-FY-22-152 form/instruction text.

#### Preliminary
| ID | Rule |
|----|------|
| P1 | Extraction confidence gate ≥ 85% |
| P2 | Form version must be FF-206-FY-22-152 |

#### Completeness (always-required fields)
| ID | Field |
|----|-------|
| COMP_A1 | Building Owner Name |
| COMP_A3 | Parcel / Legal Description |
| COMP_A4 | Building Use |
| COMP_A5_datum | Horizontal Datum (NAD/WGS 84) |
| COMP_A7 | Building Diagram Number |
| COMP_B1a | NFIP Community Name |
| COMP_B1b | NFIP Community Number |
| COMP_B2 | County |
| COMP_B3 | State |
| COMP_B4 | Map Number |
| COMP_B8 | Flood Zone |
| COMP_B10 | Elevation Datum |
| COMP_C1 | Basis of Elevation |
| COMP_C2a | Top of Bottom Floor (C2a) |
| COMP_C2f | Lowest Adjacent Grade (C2f) |
| COMP_C2g | Highest Adjacent Grade (C2g) |
| COMP_D1_name | Certifier Name |
| COMP_D2 | Certification Date |

> **Cascade rule:** If a COMP check fails (field is blank), all downstream rule checks that depend on that field are automatically flagged or marked UNVERIFIABLE — they do not run independently.

#### Section A — Property Information
| ID | Rule |
|----|------|
| A2 | Address sub-fields present (street, city, state, ZIP) |
| A4 | Building use is a valid enum (Residential / Non-Residential / Addition / Accessory / Other) |
| A5 | Lat/lon present with ≥ 6 decimal places |
| A5_datum | Horizontal datum is NAD 1927, NAD 1983, or WGS 84 |
| A6 | Building photographs detected at end of document |
| A7 | Diagram number is one of the 11 valid codes: 1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9 |
| COMP_A8a/b/d | Crawlspace/enclosure fields required when A8.a is a value, not the literal "N/A" (gated by A8.a itself, not by diagram number — see §3.2) |
| A8_ratio | Flood opening ratio ≥ 1 sq.in./sq.ft. (non-engineered) |
| A8_diagram_consistency | Plausibility flag: A8.a has a value, but A7's diagram description (pages 17–19) doesn't indicate a crawlspace/enclosure |
| COMP_A9a/b/d | Garage fields required when A9.a is a value, not the literal "N/A" (gated by A9.a itself, not by diagram number — see §3.2) |
| A9_ratio | Garage flood opening ratio ≥ 1 sq.in./sq.ft. (non-engineered) |
| A9_diagram_consistency | Plausibility flag: A9.a has a value, but A7's diagram description (pages 17–19) doesn't mention an attached garage |

#### Section B — Flood Insurance Rate Map
| ID | Rule |
|----|------|
| B8 | Flood zone is a valid FEMA zone code |
| B9 | BFE required and present for zones AE, AH, VE, A1–A30 |
| B10 | Elevation datum is NAVD 88, NGVD 29, or other valid datum |
| B11 | Datum in B10 matches datum used in Section C2 |
| B13 | LiMWA status present for V/VE zones |

#### Section C — Building Elevation
| ID | Rule |
|----|------|
| C2c | Bottom of lowest horizontal structural member required: V/VE + seaward of LiMWA + Diagram 5 or 6 |

#### Section D — Certification
| ID | Rule |
|----|------|
| D1 | Self-certification check: certifier name should not match owner name |

#### Cross-field / Computed
| ID | Rule |
|----|------|
| X3 | Freeboard: C2a ≥ B9 (same datum) |
| X4 | LAG/HAG plausibility: C2g ≥ C2f |
| X5 | Multi-story logic: C2b > C2a |

---

## 2. Architecture

### 2.1 File Structure

```
d:\EC Form\
├── docs/
│   └── EC_Validator_POC_Plan_v1_vercel.md   ← this file
├── agent/
│   └── skills/
│       ├── completeness-checklist.md         ← field inventory (reference)
│       └── fema-rules.md                     ← rule definitions (reference)
└── web/
    ├── app/
    │   ├── page.tsx                           ← root; dashboard/validator routing
    │   ├── layout.tsx
    │   └── api/
    │       ├── validate/route.ts              ← Claude extraction + rule engine
    │       ├── pdf-proxy/route.ts             ← CORS proxy for Vercel Blob PDFs
    │       └── store-pdf/route.ts             ← upload PDF to Vercel Blob
    ├── components/
    │   ├── Dashboard.tsx                      ← history list, search, stats
    │   ├── ResultsPanel.tsx                   ← tabbed check results + download
    │   ├── PdfPanel.tsx                       ← PDF viewer + highlight overlays
    │   └── FlagCard.tsx                       ← flag review (confirm/override)
    └── lib/
        ├── types.ts                           ← shared Check, VersionedOutput, HistoryEntry
        ├── history.ts                         ← localStorage CRUD (max 100 entries)
        ├── pdf-store.ts                       ← IndexedDB binary PDF storage
        └── blob-utils.ts                      ← generateEcId, validateEcFile
```

### 2.2 Data Flow

#### Upload & Validate
```
handleFileUpload(file)
  1. validateEcFile(file)                   — type/size check
  2. generateEcId(file.name)                — deterministic ID
  3. URL.createObjectURL(file)              — local PDF display
  4. storePdf(ecId, bytes)                  — IndexedDB (for history re-open)
  5. POST /api/validate { pdfBase64, ecId }
       a. Claude reads PDF (all pages) → ExtractionResult
       b. runValidation(extraction) → CheckResult[]
       c. Returns { checks, extractionData }
  6. buildVersionedOutput(1, ...)           → VersionedOutput v1
  7. saveEntry(historyEntry)                → localStorage
```

#### Flag Review (client-side, no API call)
```
handleFeedback(checkId, action, reasonCode, comment)
  1. Update check: review + effective_status
  2. buildVersionedOutput(n+1, ...) → new VersionedOutput
  3. setVersions([...prev, newVersion])
  4. saveEntry(updated entry)      → localStorage (summary refreshed)
```

#### Open Historical Entry
```
openEntry(historyEntry)
  1. Load checks + versions from historyEntry
  2. loadPdf(ecId) from IndexedDB → Blob URL
  3. If no PDF in IndexedDB: pdfUrl = null (results still shown full-width)
```

### 2.3 Versioned Output Schema

```typescript
interface VersionedOutput {
  schema_version: '1.0';
  version: number;           // 1 = original, 2+ = after each override batch
  ec_id: string | null;
  form_version: string;      // 'FF-206-FY-22-152'
  generated_at: string;      // ISO 8601
  extraction_confidence: number;
  summary: {
    total: number;
    pass: number;
    flag: number;            // only unreviewed flags (effective_status undefined)
    na: number;
    unverifiable: number;
    overrides: number;       // count of review.action === 'override'
    confirmed: number;       // count of review.action === 'confirmed'
  };
  checks: Check[];
}
```

**Flag count:** Only checks with `status === 'FLAG'` and no `effective_status` count as active flags. Confirmed and overridden checks are excluded from the flag count in all summary displays (results panel header, dashboard card, stats bar).

### 2.4 PDF Storage

| Scenario | Storage | How loaded |
|---------|---------|-----------|
| Fresh upload (current session) | `URL.createObjectURL(file)` | Direct blob URL |
| Historical re-open | IndexedDB (`ec-validator-pdfs` DB) | `loadPdf(ecId)` → blob URL |
| Vercel Blob (future/fallback) | `blob.vercel-storage.com/...` | Via `/api/pdf-proxy` (avoids CORS) |

---

## 3. Key Behaviors

### 3.1 COMP Cascade
When a required field is blank, the COMP check flags it, and all rule checks that depend on that field are automatically resolved:
- Blank A7 → A7 rule = FLAG only. **A8 and A9 are no longer cascaded from A7** — see §3.2, they're gated independently by A8.a/A9.a.
- Blank B8 → B8 rule = FLAG, B9 = UNVERIFIABLE, B13 = UNVERIFIABLE, C2c = UNVERIFIABLE
- Blank B10 → B10 rule = FLAG, B11 (datum consistency) = skipped
- Blank C2a → X3 (freeboard) = UNVERIFIABLE, X5 (multi-story) = skipped
- Blank C2f or C2g → X4 (LAG/HAG) = UNVERIFIABLE

### 3.2 A8 / A9 Gating (Presence-Based, Not Diagram-Based)

Per the form instructions (Item A8.a: *"If there is no crawlspace or enclosure, enter 'N/A' for Items A8.a-f"*; Item A9.a: *"If there is no attached garage, enter 'N/A' for items A9.a-f"*), whether A8/A9 sub-fields are required is driven by **A8.a/A9.a itself**, not by the Building Diagram number in A7. The same diagram code can represent different physical configurations (e.g., Diagrams 2A/2B/4 are normally "basement" diagrams but the instructions explicitly allow them for a sub-grade crawlspace too), so a diagram-number lookup table can't reliably gate these fields.

| A8.a / A9.a value | A8 / A9 status |
|---|---|
| Blank (not answered at all) | `UNVERIFIABLE` — form requires an explicit value or "N/A"; extraction/reviewer must resolve which |
| Literal `"N/A"` | `N/A` — section correctly marked not applicable |
| Numeric square footage | Sub-items (b–f) required; opening-ratio rule (`A8_ratio`/`A9_ratio`) runs |

Diagram number is still used, but only as a **secondary plausibility flag** (`A8_diagram_consistency`, `A9_diagram_consistency`, severity MEDIUM) — e.g., if A8.a reports a crawlspace but A7 = Diagram 5 (explicitly "no obstructions below the elevated floor"), that's flagged as an inconsistency to review, not treated as a hard rule violation.

| Diagram | Enclosure/crawlspace plausible (A8)? | Attached garage explicitly mentioned (A9)? |
|---------|:---:|:---:|
| 1A, 1B, 3 | No | Yes |
| 2A, 2B, 4 | Yes (sub-grade crawlspace case) | Yes |
| 5 | No (explicitly open) | Not mentioned |
| 6, 7 | Yes | Not mentioned |
| 8, 9 | Yes | Yes |

This required a matching change to the Claude extraction prompt: A8a/A9a must now be extracted as the literal string `"N/A"` when no crawlspace/garage exists, rather than left blank, so the engine can distinguish "correctly marked not applicable" from "field never answered."

### 3.3 Two-Phase Loading
1. **"Reading form..."** — PDF sent to Claude, Claude is extracting fields
2. **"Running validation..."** — Claude response received, JS rules running client-side

### 3.4 Check Badge Display
COMP check IDs are shortened in the UI badge:
- `COMP_A1` → displays `A1`
- `COMP_A5_datum` → displays `A5`
- `COMP_B1a` → displays `B1a`
- `COMP_A8a` → displays `A8a`

---

## 4. Environment Variables

### Required (all environments)
```env
ANTHROPIC_API_KEY=sk-...
ANTHROPIC_MODEL=claude-opus-4-8          # or claude-sonnet-4-6
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BLOB_STORE_ID=store_...
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Local development only
```env
ANTHROPIC_BASE_URL=https://llm-gateway.damcogroup.com   # corporate LLM proxy
NODE_TLS_REJECT_UNAUTHORIZED=0                           # corporate SSL bypass
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> **Note:** `NODE_TLS_REJECT_UNAUTHORIZED=0` is required locally because the corporate SSL proxy intercepts HTTPS. On Vercel this is not needed and should not be set.

---

## 5. Deployment (Vercel)

### Steps
1. Push changes to `main` branch — Vercel auto-deploys on push
2. Set all required environment variables in Vercel dashboard → Settings → Environment Variables
3. Vercel Blob store (`store_buxSzqOJx6LTZgVQ`) is already configured

### What changes on Vercel vs localhost
| Issue | Localhost | Vercel |
|-------|----------|--------|
| PDF loading from history | Fails (corporate SSL proxy blocks server-side fetch) | Works (clean network) |
| Vercel Blob upload | May fail due to SSL proxy | Works |
| Direct Blob URL in browser | Requires `/api/pdf-proxy` workaround | Can load directly (ACAO: *) |

---

## 6. Known Limitations (POC Scope)

| Area | Limitation |
|------|-----------|
| Validation rules | Section A only; Sections B–I partially covered (completeness checks only) |
| History persistence | localStorage (browser-local, not cross-device, max 100 entries) |
| PDF in history | Requires IndexedDB; cleared if user clears browser data |
| A6 (photos) | LLM-based detection; may be UNVERIFIABLE on text-only PDFs |
| Form version | Only FF-206-FY-22-152 accepted; older forms rejected |
| Batch processing | Single document at a time |
| Lat/lon range | Not validated against US geographic bounds |
| A8/A9 diagram consistency | Heuristic plausibility flag based on diagram description text (pages 17–19), not a hard FEMA rule — may false-positive on legitimate atypical construction |

---

## 7. Future Scope

- Full Section B–I rule coverage
- Cloud-based history (replace localStorage with database)
- Batch PDF upload
- Export to PDF report
- Lat/lon US boundary validation
- Mobile responsive design
- Audit trail / reviewer sign-off
- Role-based access (reviewer vs. admin)
