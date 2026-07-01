# FEMA Elevation Certificate — Completeness Checklist (v2)

**Form**: FF-206-FY-22-152 (October 2022)
**Source**: Form page 2 of 19 (Section A & B fillable fields) and Instructions pages 9–12.

**POC scope**: Section A — Property Information, and Section B — Flood Insurance Rate Map (FIRM) Information only. Sections C–I are future scope.

**Purpose**: This file answers "is the field filled in at all?" — presence/required checks only. Whether a *filled* value is semantically correct (format, range, consistency) is covered in `fema-rules.md`.

**Logic**:
- Field present and filled → **PASS**
- Required field blank → **FLAG**
- Conditional field, condition not met, correctly marked "N/A" → **N/A**
- Conditional field, condition not met, but left truly blank (no value, no "N/A") → **FLAG** (the form requires an explicit "N/A", not silence — see A8.a/A9.a instructions)

---

## Section A — Property Information

### Always Required

| Field key | Label on form | Notes |
|-----------|--------------|-------|
| A1 | Building Owner's Name | Name(s) of the building owner(s) |
| A2_street | Building Street Address | Or P.O. Route and Box No. |
| A2_city | City | |
| A2_state | State | |
| A2_zip | ZIP Code | |
| A3 | Property Description | Lot/Block Numbers, Legal Description, and/or Tax Parcel Number — at least one required |
| A4 | Building Use | Residential / Non-Residential / Addition / Accessory / Other |
| A5_lat | Latitude | Decimal degrees (≥6 decimal places) or DMS |
| A5_lon | Longitude | Decimal degrees (≥6 decimal places) or DMS |
| A5_datum | Horizontal Datum | Checkbox: **NAD 1927**, **NAD 1983**, or **WGS 84** |
| A7 | Building Diagram Number | One of the 11 valid diagrams: **1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9** |

### A6 — Building Photographs

> **Location in PDF**: Not inline with Section A — appears as separate photo pages ("Photo One"/"Photo Two", with a continuation page for "Photo Three"/"Photo Four") after Section D.

| Requirement | Condition |
|-------------|-----------|
| Minimum 2 photographs | Always required |
| Preferred: 4 photographs | One per side (front, rear, left, right) |
| Caption present | Each photo should be captioned with date and view (Front/Rear/Right Side/Left Side) |

- Field key: `A6_photos`
- Check: at least 2 photograph pages/captions present
- Status if fewer than 2: **FLAG** (severity MEDIUM)
- Status if photo count can't be determined from text extraction: **UNVERIFIABLE**

### A8 — Crawlspace or Enclosure Details (Conditional)

**Presence gate** (per instructions, Item A8.a): *"If there is no crawlspace or enclosure, enter 'N/A' for Items A8.a-f."* This is a physical-presence gate, not a diagram-number gate — a diagram-vs-A8 plausibility cross-check exists separately in `fema-rules.md` (rule `A7_diagram_a8_consistency`).

| Sub-item | Field key | Label | Required when |
|----------|-----------|-------|--------------|
| A8.a | A8a | Sq. footage of crawlspace or enclosure(s) | Always — either a numeric value or explicit "N/A" |
| A8.b | A8b | Permanent flood opening on ≥2 sides? (Yes/No/N/A) | Always when A8.a is numeric |
| A8.c | A8c | No. of permanent flood openings (non-engineered / engineered) within 1.0 ft. of grade | When A8.a is numeric — enter "0" if A8.b = No |
| A8.d | A8d | Total net open area of non-engineered openings (sq. in.) | When A8.c non-engineered count > 0 — enter "0" if none |
| A8.e | A8e | Total rated area of engineered openings (sq. ft.) | When A8.c engineered count > 0 |
| A8.f | A8f | Sum of A8.d + A8.e | Only when both A8.d and A8.e are non-zero — otherwise "N/A" |

**Completeness check**: FLAG if A8.a is truly blank (no value *and* no "N/A"). If A8.a = "N/A", all of A8.b–f should also read "N/A" (or be blank, since the section doesn't apply) — do not FLAG them individually in that case.

### A9 — Attached Garage Details (Conditional)

**Presence gate** (per instructions, Item A9.a): *"If there is no attached garage, enter 'N/A' for items A9.a-f."*

| Sub-item | Field key | Label | Required when |
|----------|-----------|-------|--------------|
| A9.a | A9a | Sq. footage of attached garage | Always — either a numeric value or explicit "N/A" |
| A9.b | A9b | Permanent flood opening on ≥2 sides? (Yes/No/N/A) | Always when A9.a is numeric |
| A9.c | A9c | No. of permanent flood openings (non-engineered / engineered, incl. garage-door openings) within 1.0 ft. of grade | When A9.a is numeric — enter "0" if A9.b = No |
| A9.d | A9d | Total net open area of non-engineered openings (sq. in.) | When A9.c non-engineered count > 0 — enter "0" if none |
| A9.e | A9e | Total rated area of engineered openings (sq. ft.) | When A9.c engineered count > 0 |
| A9.f | A9f | Sum of A9.d + A9.e | Only when both A9.d and A9.e are non-zero — otherwise "N/A" |

**Completeness check**: Same logic as A8 — FLAG only if A9.a is truly blank (no value, no "N/A").

---

## Section B — Flood Insurance Rate Map (FIRM) Information

> Source: Instructions pages 10–12 (Section B, Items B1.a–B13).

### Always Required

| Field key | Label on form | Notes |
|-----------|--------------|-------|
| B1a | NFIP Community Name | For unincorporated areas: county name + "unincorporated area" |
| B1b | NFIP Community Identification Number | Six-digit code |
| B2 | County Name | Or "independent city" |
| B3 | State | Two-letter abbreviation |
| B4 | Map/Panel Number | 10-character Map Number (county-wide format) or Community Panel Number |
| B5 | Suffix | Panel suffix letter |
| B6 | FIRM Index Date | Effective or map-revised date shown on the FIRM Index |
| B7 | FIRM Panel Effective/Revised Date | Effective date shown on the current FIRM panel |
| B8 | Flood Zone(s) | All zones containing "A" or "V" are Special Flood Hazard Areas (SFHAs) |
| B11 | Elevation datum used for BFE | Checkbox: NGVD 1929 / NAVD 1988 / Other-Source |
| B12 | CBRS/OPA status | Yes/No checkbox; if Yes, Designation (CBRS or OPA) also required |
| B13 | Seaward of LiMWA? | Yes/No checkbox — **always answered**, not conditional; per instructions, check "No" if the LiMWA is not shown on the FIRM (do not leave blank) |

### Conditional

| Field key | Label | Condition | Required value |
|-----------|-------|-----------|-----------------|
| B9 | Base Flood Elevation (BFE) or Base Flood Depth | Zones **A1–A30, AE, AH, V1–V30, VE, AR, AR/A, AR/AE, AR/A1–A30, AR/AH** → numeric BFE required. Zones **AO, AR/AO** → Base Flood Depth required instead. | If neither is obtainable from FIS/FIRM/community in an A Zone, enter "N/A" in B9 and complete Section E (out of POC scope). |
| B10 | Source of BFE/depth entered in B9 | Required whenever B9 contains a value (not "N/A") | Checkbox: FIS / FIRM / Community Determined / Other (name required if Other) |

**Completeness check for B9/B10**: FLAG if B8 (flood zone) is one of the BFE-required zones listed above and B9 is blank. FLAG if B9 is present with a value and B10 is blank. N/A if B8 indicates a zone where BFE is not applicable (B, C, X, D) — B9/B10 not required.

---

## Building Photographs

> **Pages**: Attached as separate pages after Section D, before the end of the document.

| Requirement |
|-------------|
| At least 2 photos required |
| Photo 1: Front view showing street approach |
| Photo 2: Rear or side view showing grade |
| Photos should show the full building and enough grade to verify diagram selection (A7) |

---

## Check Result Format

```json
{
  "check_id": "COMP_A8a",
  "check_name": "Crawlspace / Enclosure Area (A8.a) — Required",
  "status": "FLAG",
  "found": "(blank)",
  "expected": "A numeric square footage, or 'N/A' if no crawlspace/enclosure exists",
  "confidence": "High",
  "note": "A8.a was left blank instead of a value or explicit 'N/A'",
  "rules_version": "v2",
  "highlight_refs": ["A8"]
}
```

---

*v2 — frozen for form FF-206-FY-22-152. Rebuilt directly from PDF form page 2 of 19 and Instructions pages 9–12. Section A and B only; Sections C–I deferred to a future revision.*
