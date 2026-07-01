# FEMA Elevation Certificate — Completeness Checklist

**Form**: FF-206-FY-22-152 (October 2022)
**Source**: Form pages 1–3 and instructions pages 4–9

**Logic**:
- Field present and filled → **PASS**
- Required field blank → **FLAG**
- Conditional field, condition not met → **N/A**

---

## Section A — Property Information

### Always Required

| Field key | Label on form | Notes |
|-----------|--------------|-------|
| A1 | Building Owner's Name | Full legal name |
| A2_street | Building Street Address | Street number + name; or P.O. Route and Box No. |
| A2_city | City | |
| A2_state | State | 2-letter code |
| A2_zip | ZIP Code | 5 or 9 digit |
| A3 | Property Description | Lot/Block No., Tax Parcel No., or Legal Description — at least one required |
| A4 | Building Use | Residential / Non-Residential / Addition / Accessory / Other |
| A5_lat | Latitude | Decimal degrees (min 6 decimal places) OR DMS format |
| A5_lon | Longitude | Decimal degrees (min 6 decimal places) OR DMS format |
| A5_datum | Horizontal Datum | Must be **NAD 1927** or **NAD 1983** (checkbox in A5) |
| A7 | Building Diagram Number | Must be one of: **1, 1A, 1B, 2, 3, 4, 5, 6, 7, 8, 9** (diagrams on pages 17–19) |

### A6 — Building Photographs

> **Location in PDF**: Photographs are NOT attached inline with Section A. They appear as separate pages at the **end of the document** (after Section D / comments).

| Requirement | Condition |
|-------------|-----------|
| Minimum 2 photographs | Always required when certificate is used for flood insurance |
| Front view | Shows building and approach from street |
| Rear or side view | Shows grade on at least one non-street side |
| Preferred: 4 photographs | Front, rear, and both sides |

- Field key: `A6_photos`
- Check: at least 2 photograph pages present at end of document
- Status if missing or fewer than 2: **FLAG** (severity MEDIUM)
- Status if content cannot be determined from text extraction: **UNVERIFIABLE**

### A8 — Crawl Space or Enclosure Details (Conditional)

**Condition**: Required when A7 ∈ {1B, 2, 3, 4, 5, 9}

| Sub-item | Field key | Label | Required when |
|----------|-----------|-------|--------------|
| A8.a | A8a | Square footage of crawl space or enclosure(s) | A8 applies |
| A8.b | A8b | No. of permanent flood openings within 1.0 ft. above adjacent grade | A8 applies |
| A8.c | A8c | Total net area of flood openings in A8.b (sq. in.) | A8.b > 0 |
| A8.d | A8d | Engineered flood openings? (Yes / No) | A8 applies |

**Semantic rules**:
- A8.c ≥ A8.a numerically: must have at least 1 sq. in. of opening per sq. ft. of enclosed area (NFIP non-engineered opening standard)
- If A8.d = Yes (engineered): A8.c requirement is waived (engineer certifies adequacy)
- If A8.b = 0: A8.c should be 0 or blank

### A9 — Attached Garage Details (Conditional)

**Condition**: Required when A7 ∈ {1A, 9}

| Sub-item | Field key | Label | Required when |
|----------|-----------|-------|--------------|
| A9.a | A9a | Square footage of attached garage | A9 applies |
| A9.b | A9b | No. of permanent flood openings within 1.0 ft. above adjacent grade | A9 applies |
| A9.c | A9c | Total net area of flood openings in A9.b (sq. in.) | A9.b > 0 |
| A9.d | A9d | Engineered flood openings? (Yes / No) | A9 applies |

**Semantic rules**: Same flood opening ratio as A8.

---

## Section B — Flood Insurance Rate Map (FIRM) Information

### Always Required

| Field key | Label on form | Notes |
|-----------|--------------|-------|
| B1a | NFIP Community Name | Full community/jurisdiction name |
| B1b | NFIP Community Number | 6-digit code (e.g., 120075) |
| B2 | County | County or parish name |
| B3 | State | 2-letter code; must match A2_state |
| B4 | Map/Panel Number | FIRM panel number (typically 12 digits) |
| B5 | Suffix | Panel suffix letter (e.g., H) |
| B6 | FIRM Index Date | Date of current FIRM index |
| B7 | FIRM Panel Effective/Revised Date | Date the panel was last revised |
| B8 | Flood Zone(s) | Must be a FEMA-approved zone: A, AE, AH, AO, AR, A99, V, VE, or numbered A/V zones |
| B11 | Elevation Datum | Datum used for the BFE and form elevations (NAVD 88 or NGVD 29) |

### Conditional

| Field key | Label | Condition |
|-----------|-------|-----------|
| B9 | Base Flood Elevation (BFE) | Required for zones: AE, AH, VE, A1–A30, V1–V30 |
| B10 | Source of BFE | Required when B9 is present (FIS, FIRM, LOMA, LOMR, community, etc.) |
| B12 | Is building in CBRS or OPA? | Required — Yes / No checkbox |
| B13 | Seaward of Limit of Moderate Wave Action (LiMWA)? | Required for V / VE zones only |

**Cross-field**:
- B3 (state) must match A2_state
- B11 datum must be consistent with C2 elevation measurements

---

## Section C — Building Elevation Information

> Used for NFIP flood insurance rating. Use this section for zones A1–A30, AE, AH, AO, AR, V, VE, V1–V30.

### Always Required

| Field key | Label | Notes |
|-----------|-------|-------|
| C1 | Basis of Elevation | Construction Drawings / Building Under Construction / Finished Construction |
| C2_datum | Vertical Datum (for all C2 measurements) | Must match B11 |

### Elevation Measurements

| Field key | Label | Required when |
|-----------|-------|--------------|
| C2a | Top of Bottom Floor (including basement, crawl space, or enclosure floor) | Always |
| C2b | Top of the Next Higher Floor | Required if building has multiple above-grade floors |
| C2c | Bottom of Lowest Horizontal Structural Member | Required: V/VE zone **AND** seaward of LiMWA (B13=Yes) **AND** Diagram 5 or 6 |
| C2d | Attached Garage (top of slab) | Required if A7 ∈ {1A, 9} |
| C2e | Lowest Elevation of Machinery or Equipment Servicing the Building | Required if M&E (e.g., HVAC, utilities) is present below BFE |
| C2f | Lowest Adjacent Finished Grade (LAG) | Always |
| C2g | Highest Adjacent Finished Grade (HAG) | Always |
| C2h | Lowest Adjacent Grade at Lowest Elevation of Deck or Stairs | Required for Zone AO or when deck/stairs present |

**Arithmetic rules**:
- C2g ≥ C2f (HAG must be ≥ LAG)
- C2a ≥ B9 for NFIP compliance (freeboard check)
- C2b > C2a if both present

---

## Section D — Surveyor, Engineer, or Architect Certification

### Always Required

| Field key | Label |
|-----------|-------|
| D1_name | Certifier's Name |
| D1_license | License / Certificate Number |
| D1_title | Title |
| D1_company | Company |
| D1_address | Address |
| D2 | Date of Certification |

### Conditional

| Field key | Label | Condition |
|-----------|-------|-----------|
| D3 | Comments | Must document: M&E type/location if C2e present; floodproofing method if A4 = Non-Residential and floodproofed; any exceptions or variances |

**Cross-field**:
- D1_name must NOT match A1 (Building Owner) without additional review (self-certification flag)

---

## Section E — Building Elevation Information (Community Official Use)

> Used by community officials to document community floodplain management elevations. Typically completed by local floodplain manager, not the certifier.

| Field key | Label | Condition |
|-----------|-------|-----------|
| E1 | Certificate is used for | Indicates purpose (LOMA, rating, permit, etc.) |
| E2 | Lowest floor elevation | If community requires separate elevation for permitting |

---

## Section F / Comments

> Free-text comments section. Required to document:
- If C2e is filled: describe M&E type and location
- If non-residential floodproofing: describe floodproofing method
- Any variances or exceptions from NFIP requirements

---

## Building Photographs

> **Pages**: Attached at the **end of the document**, after the form sections.

| Requirement |
|-------------|
| At least 2 photos required for flood insurance purposes |
| Photo 1: Front of building showing street approach |
| Photo 2: Rear or side of building showing grade |
| Photos should show the full building and enough grade to verify diagram selection |

---

## Cross-Field Completeness Rules

| Rule | Condition | Flag if |
|------|-----------|---------|
| A2_state = B3 | Always | State in address ≠ state in flood map section |
| B11 = C2_datum | Always | Elevation datum in B11 ≠ datum used in C2 measurements |
| A7 → A8 | If A7 ∈ {1B, 2, 3, 4, 5, 9} | A8 sub-items (a–d) missing |
| A7 → A9 | If A7 ∈ {1A, 9} | A9 sub-items (a–d) missing |
| A7 → C2c | If V/VE zone + B13=Yes + A7 ∈ {5, 6} | C2c blank |
| A7 → C2d | If A7 ∈ {1A, 9} | C2d blank |
| C2e → D3 | If C2e present | D3 must describe M&E type and location |
| B9 → B10 | If B9 present | B10 (source of BFE) must be filled |

---

## Check Result Format

```json
{
  "check_id": "COMP_A8a",
  "check_name": "Crawl Space Area (A8.a) — Required",
  "status": "FLAG",
  "found": "(blank)",
  "expected": "Required for Diagram 2 — square footage of crawl space or enclosure",
  "confidence": "High",
  "note": "A8 is required when building diagram is 1B, 2, 3, 4, 5, or 9",
  "rules_version": "v1",
  "highlight_refs": ["A8"]
}
```
