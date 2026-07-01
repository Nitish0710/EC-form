# FEMA Elevation Certificate — Validation Rules (v1)

**Source**: FEMA Form FF-206-FY-22-152 (October 2022), Instructions pages 8–19.

**POC scope**: Section A — Property Information (items A1–A9). All other sections are marked as future scope.

**Completeness check definition**: Every field check first verifies that the field has a non-blank value. If blank → FLAG. Then applies any semantic rules below.

---

## Pre-Processing Checks

### P1: Extraction Confidence Gate
- **Rule**: Overall extraction confidence must be ≥ 85%
- **Flag if**: `extraction_confidence < 0.85`
- **Severity**: HIGH
- **Note**: Low confidence suggests poor scan quality or damaged document. All subsequent checks should be treated as UNVERIFIABLE if P1 fails.

### P2: Form Version
- **Rule**: Must be FEMA Form FF-206-FY-22-152 (October 2022 version)
- **Flag if**: Form header/footer doesn't show "FF-206-FY-22-152"
- **Severity**: HIGH
- **Note**: Different form versions have different field layouts and requirements. Only FF-206-FY-22-152 is supported in this POC.

---

## Section A — Property Information

> Source: Form instructions pages 9–10, diagrams pages 17–19.

---

### A1: Building Owner's Name

**FEMA instruction (page 9)**: *"Building Owner's Name"*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A1 | Field must be present and non-blank | A1 is blank or missing | HIGH |

- `highlight_refs`: `["A1"]`

---

### A2: Building Street Address

**FEMA instruction (page 9)**: *"Building Street Address (including Apt., Unit, Suite, and/or Bldg. No.) or P.O. Route and Box No.; City; State; ZIP Code"*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A2_street | Street address must be present | Street is blank | HIGH |
| COMP_A2_city | City must be present | City is blank | HIGH |
| COMP_A2_state | State must be present | State is blank | HIGH |
| COMP_A2_zip | ZIP code must be present | ZIP is blank | HIGH |
| A2_state_match | State in A2 must match State in B3 | A2 state ≠ B3 state | HIGH |

- `highlight_refs`: `["A2"]`

---

### A3: Property Description

**FEMA instruction (page 9)**: *"Property Description (Lot and Block Numbers, Tax Parcel Number, Legal Description, etc.)"*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A3 | At least one property identifier must be present (lot/block, parcel number, or legal description) | A3 is blank or missing | HIGH |

- `highlight_refs`: `["A3"]`

---

### A4: Building Use

**FEMA instruction (page 9)**: *"Building Use (e.g., Residential, Non-Residential, Addition, Accessory, etc.)"*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A4 | Field must be present and non-blank | A4 is blank or missing | HIGH |
| A4_valid | Value must be a recognized building use type | Value not in: Residential, Non-Residential, Addition, Accessory, Other | MEDIUM |

**Valid values**: Residential, Non-Residential, Addition, Accessory, Other

- `highlight_refs`: `["A4"]`

---

### A5: Latitude / Longitude and Horizontal Datum

**FEMA instruction (page 9)**: *"Latitude/Longitude: Lat. / Long. (##°##'##.##" OR ##.#####°) (use GPS or web mapping tool to determine); Horizontal Datum: □ NAD 1927 □ NAD 1983"*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A5_lat | Latitude must be present | Latitude is blank | HIGH |
| COMP_A5_lon | Longitude must be present | Longitude is blank | HIGH |
| COMP_A5_datum | Horizontal datum must be checked | Datum is blank or "Other" | HIGH |
| A5_precision | Decimal degrees must have ≥ 6 decimal places | < 6 decimal places (e.g., 25.76° instead of 25.761681°) | HIGH |
| A5_datum_valid | Datum must be NAD 1927 or NAD 1983 | Datum not in: NAD 1927, NAD 1983, NAD27, NAD83 | HIGH |
| A5_lat_range | Latitude must be in valid US range (17°N – 72°N) | Latitude outside US territory range | MEDIUM |
| A5_lon_range | Longitude must be in valid US range (65°W – 180°W) | Longitude outside US territory range | MEDIUM |

**Notes**:
- DMS format (`##°##'##.##"`) is also valid — check that degrees, minutes, and seconds are all present
- A5 coordinates are used for flood map lookup; missing or imprecise coordinates can affect the rate zone assignment

- `highlight_refs`: `["A5"]`

---

### A6: Photographs

**FEMA instruction (page 9)**: *"Attach at least 2 photographs of the building if the Certificate is being used to obtain flood insurance."*

**FEMA requirements**:
- Minimum 2 photographs required (front view showing street approach; rear/side view showing grade)
- Preferred: 4 photographs (front, rear, and both sides)
- Photographs must show the building clearly enough to verify building type and diagram selection

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| A6_photos | Form should indicate photographs are attached | No indication of attached photographs, or count < 2 | MEDIUM |

- `highlight_refs`: `["A6"]`
- **Note**: Photo content cannot be validated from text extraction alone. This check verifies whether the form indicates photos are present. Status may be UNVERIFIABLE for scanned forms where photo attachment note is not in text layer.

---

### A7: Building Diagram Number

**FEMA instruction (page 10)**: *"Select the Building Diagram (shown on pages 17–19) that best represents the building. Then enter the diagram number and use the diagram to identify and determine the appropriate elevations requested in Items C2.a–h. If you are unsure of the correct diagram, select the diagram that most closely resembles the building being certified."*

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A7 | Field must be present and non-blank | A7 is blank or missing | HIGH |
| A7_valid | Must be a valid FEMA diagram number | Value not in: 1, 1A, 1B, 2, 3, 4, 5, 6, 7, 8, 9 | HIGH |

**Valid diagram numbers and descriptions** (pages 17–19):

| Diagram | Description | Triggers A8? | Triggers A9? |
|---------|-------------|-------------|-------------|
| 1 | No basement; slab-on-grade, or subgrade crawl space with floor-to-ceiling height ≤ 5 ft | No | No |
| 1A | Same as 1, with attached garage | No | Yes |
| 1B | Same as 1, with subgrade crawl space | Yes | No |
| 2 | No basement; crawl space or enclosure(s) below elevated floor with floor-to-ceiling height ≤ 5 ft | Yes | No |
| 3 | No basement; crawl space or enclosure with floor-to-ceiling height > 5 ft | Yes | No |
| 4 | No basement; elevated on full-story foundation walls (e.g., garage, storage, or enclosure below) | Yes | No |
| 5 | No basement; elevated on piers, posts, columns, or piles — with enclosure(s) below | Yes | No |
| 6 | No basement; elevated on piers, posts, columns, or piles — without enclosure(s) below | No | No |
| 7 | Manufactured (mobile) home; elevated on permanent chassis | No | No |
| 8 | Manufactured (mobile) home; not elevated | No | No |
| 9 | No basement; elevated with attached garage | Yes | Yes |

**Cross-field impact**:
- Diagram drives which C2 elevation measurements are required (C2.a–h)
- Diagrams 5 and 6 in V/VE zones: C2.c (bottom of lowest horizontal structural member) required if seaward of LiMWA
- See completeness-checklist.md for full conditional logic

- `highlight_refs`: `["A7"]`

---

### A8: Crawl Space or Enclosure Details

**FEMA instruction (page 10)**: *"For a building with a crawl space or enclosure(s), provide: a. sq. ft. b. No. of permanent flood openings in the crawl space or enclosure(s) within 1.0 ft. above adjacent grade c. Total net area of flood openings in A8.b (sq. in.) d. Engineered flood openings? □ Yes □ No"*

**Condition**: Required when A7 ∈ {1B, 2, 3, 4, 5, 9}

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A8a | Sq. footage of crawl space/enclosure must be present | A8.a blank when A8 applies | HIGH |
| COMP_A8b | Number of permanent flood openings must be present | A8.b blank when A8 applies | HIGH |
| COMP_A8c | Total net area of flood openings must be present | A8.c blank when A8.b > 0 | HIGH |
| COMP_A8d | Engineered flood openings (Yes/No) must be answered | A8.d blank when A8 applies | HIGH |
| A8_opening_ratio | If non-engineered: net area (sq. in.) should be ≥ sq. ft. of enclosed area | A8.c < A8.a (1 sq. in. per sq. ft. minimum per NFIP standard) | MEDIUM |
| A8_zero_area | If A8.b = 0, A8.c should also be 0 | A8.b = 0 but A8.c > 0 | MEDIUM |

- `highlight_refs`: `["A8"]`
- **Note**: If condition not met (A7 not in trigger list) → all A8 checks are N/A.

---

### A9: Attached Garage Details

**FEMA instruction (page 10)**: *"For a building with an attached garage, provide: a. sq. ft. b. No. of permanent flood openings in the attached garage within 1.0 ft. above adjacent grade c. Total net area of flood openings in A9.b (sq. in.) d. Engineered flood openings? □ Yes □ No"*

**Condition**: Required when A7 ∈ {1A, 9} or when certifier notes an attached garage

| Rule | Check | Flag condition | Severity |
|------|-------|---------------|----------|
| COMP_A9a | Sq. footage of attached garage must be present | A9.a blank when A9 applies | HIGH |
| COMP_A9b | Number of permanent flood openings must be present | A9.b blank when A9 applies | HIGH |
| COMP_A9c | Total net area of flood openings must be present | A9.c blank when A9.b > 0 | HIGH |
| COMP_A9d | Engineered flood openings (Yes/No) must be answered | A9.d blank when A9 applies | HIGH |
| A9_opening_ratio | If non-engineered: net area (sq. in.) should be ≥ sq. ft. of garage area | A9.c < A9.a | MEDIUM |
| A9_zero_area | If A9.b = 0, A9.c should also be 0 | A9.b = 0 but A9.c > 0 | MEDIUM |

- `highlight_refs`: `["A9"]`
- **Note**: If condition not met → all A9 checks are N/A.

---

## Sections B–I — Future Scope

Not implemented in this POC. The following are planned for future versions:

| Section | Key rules |
|---------|-----------|
| B | Flood zone valid (B8), BFE present when required (B9), datum valid/consistent (B10/B11), LiMWA status (B13) |
| C | C2a always required, C2c V-zone conditional, freeboard C2a ≥ B9, LAG/HAG plausibility (C2f ≤ C2g) |
| D | Self-cert check (A1 vs D1), comments completeness when C2e/A10 present |
| E | Zone A: use Section E instead of C |
| G | Unnumbered A-zone: community design flood elevation required |

---

## Check Result Format

```json
{
  "check_id": "A7_valid",
  "check_name": "Building Diagram Number — Valid Diagram",
  "status": "FLAG",
  "found": "diagram 12",
  "expected": "One of: 1, 1A, 1B, 2, 3, 4, 5, 6, 7, 8, 9",
  "confidence": "High",
  "note": "Diagram '12' is not a valid FEMA diagram number for form FF-206-FY-22-152",
  "rules_version": "v1",
  "highlight_refs": ["A7"]
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| PASS | Rule satisfied |
| FLAG | Rule violated — reviewer action required |
| N/A | Rule not applicable (condition not met, e.g., A8 when diagram has no crawl space) |
| UNVERIFIABLE | Cannot determine from available data (e.g., photo content from text extraction) |

## Confidence Levels

| Level | When to use |
|-------|------------|
| High | Enumeration check, format validation, arithmetic, presence check |
| Medium | Conditional logic, name matching, semantic keyword scan |
| Low | Heuristic plausibility (rarely used) |

---

*v1 — frozen for form FF-206-FY-22-152. Future form versions will get separate rule files.*
