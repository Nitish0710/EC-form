# FEMA Elevation Certificate — Validation Rules (v2)

**Source**: FEMA Form FF-206-FY-22-152 (October 2022), Instructions pages 9–19 and Building Diagrams pages 17–19.

**POC scope**: Section A — Property Information (Items A1–A9) only. Sections B–I are future scope.

**Relationship to completeness.md**: This file covers *semantic / business-logic* validation — is the value plausible, correctly formatted, internally consistent? Whether a field is *present at all* is covered separately in `completeness-checklist.md`. A rule below only needs to run once its underlying field has passed its completeness check (see each item's **Condition**).

---

## Preliminary / Gating Checks

These are not tied to a specific form field — they gate whether the rest of the checks below should be trusted at all. Not sourced from PDF instruction text; they are implementation-level guards.

### P1: Extraction Confidence Gate
- **Rule**: Overall extraction confidence must be ≥ 85%
- **Flag if**: `extraction_confidence < 0.85`
- **Severity**: HIGH
- **Note**: Low confidence suggests poor scan quality or a damaged document. If P1 fails, all downstream checks should be treated as UNVERIFIABLE rather than PASS/FLAG.

### P2: Form Version
- **Rule**: Must be FEMA Form FF-206-FY-22-152 (October 2022 edition)
- **Flag if**: Form header/footer doesn't show "FF-206-FY-22-152"
- **Severity**: HIGH
- **Note**: Other form versions have different field layouts and requirements. Only FF-206-FY-22-152 is supported in this POC.

---

## Section A — Property Information

> Source: Form Instructions, page 9 ("Items A1–A4", "Item A5", "Item A6", "Item A7", "Item A8.a", "Item A8.b") and page 10 ("Item A8.c" through "Item A9.f").

---

### A1 — Building Owner's Name

**FEMA instruction (page 9, Items A1–A4)**: *"Enter the name(s) of the building owner(s)... If the building's address is different from the owner's address, enter the address of the building being certified... For properties with multiple buildings, include a description for the specific building."*

**Rule Name**: Validate Building Owner's Name

**Rule Explanation**:
1. Verify A1 (Building Owner's Name) is present and non-blank.
2. If the extraction indicates more than one owner, verify all owner name(s) were captured — the field explicitly allows "name(s)" (plural).

**Pass Criteria**: A1 contains at least one legible owner name.

**Fail Criteria**: A1 is blank or missing.

**Severity**: HIGH
**Rule ID**: `A1`
**highlight_refs**: `["A1"]`

---

### A2 — Building Street Address, City, State, ZIP

**FEMA instruction (page 9, Items A1–A4)**: *"Enter... the building's complete street address or property description (e.g., lot and block numbers or legal description), and/or tax parcel number. If the building's address is different from the owner's address, enter the address of the building being certified. If the address is a rural route or a Post Office box number, enter the lot and block numbers, the tax parcel number, the legal description, or an abbreviated location description based on distance and direction from a fixed point of reference."*

**Rule Name**: Validate Building Street Address

**Rule Explanation**:
1. Verify Street Address / P.O. Route and Box No. is present.
2. Verify City is present.
3. Verify State is present.
4. Verify ZIP Code is present.
5. If the address entered is a rural route or P.O. Box number, verify an alternate location description is also present — lot/block numbers, tax parcel number, legal description, or a distance-and-direction description from a fixed reference point.
6. Verify the address entered describes the *building being certified*, not necessarily the owner's mailing address (these are allowed to differ per instructions — this is a plausibility note, not a hard fail condition).

**Pass Criteria**: Street/route, city, state, and ZIP are all present, and — if the address is a rural route or P.O. Box — an alternate location descriptor is also present.

**Fail Criteria**: Any of street/route, city, state, or ZIP is blank; or a rural route/P.O. Box is entered with no alternate location description.

**Severity**: HIGH
**Rule ID**: `A2_street`, `A2_city`, `A2_state`, `A2_zip`, `A2_rural_route_alt`
**highlight_refs**: `["A2"]`

---

### A3 — Property Description

**FEMA instruction (page 9, Items A1–A4)**: *"the building's complete street address or property description (e.g., lot and block numbers or legal description), and/or tax parcel number... For properties with multiple buildings, include a description for the specific building."*

**Rule Name**: Validate Property Description

**Rule Explanation**:
1. Verify at least one property identifier is present: Lot and Block Numbers, Legal Description, and/or Tax Parcel Number.
2. If the property is known (from context/comments) to have multiple buildings, verify the description identifies the specific building being certified.

**Pass Criteria**: At least one property identifier is present.

**Fail Criteria**: A3 is blank or missing, or (when multiple buildings are indicated) the description does not identify the specific building.

**Severity**: HIGH
**Rule ID**: `A3`
**highlight_refs**: `["A3"]`

---

### A4 — Building Use

**FEMA instruction (page 9, Items A1–A4)**: *"For building use, indicate whether the building is residential, non-residential, an addition to an existing residential or non-residential building, an accessory building (e.g., garage), or other type of structure."*

**Rule Name**: Validate Building Use

**Rule Explanation**:
1. Verify A4 is present and non-blank.
2. Verify the value maps to one of the recognized categories named in the instructions: Residential, Non-Residential, Addition, Accessory, or Other (with a description).

**Pass Criteria**: A4 is present and matches a recognized building-use category.

**Fail Criteria**: A4 is blank, or the value does not correspond to any recognized building-use category.

**Severity**: MEDIUM
**Rule ID**: `A4_valid`
**highlight_refs**: `["A4"]`

---

### A5 — Latitude / Longitude and Horizontal Datum

**FEMA instruction (page 9, Item A5)**: *"Provide latitude and longitude coordinates for the center of the front of the building. Use either decimal degrees (e.g., 39.504322°, −110.758522°) or degrees, minutes, seconds (e.g., 39° 30' 15.56", −110° 45' 30.68") format. If decimal degrees are used, provide coordinates to at least six decimal places or better. When using degrees, minutes, seconds, provide seconds to at least two decimal places or better. Provide the datum of the latitude and longitude coordinates (FEMA prefers the use of NAD 1983). Indicate the method or source used to determine the latitude and longitude in the Comments area of the appropriate section. When the latitude and longitude are provided by a land surveyor, check the 'Yes' box in Section D."*

**Rule Name**: Validate Latitude and Longitude Information

**Rule Explanation**: When validating Section A, Item A5, verify that:
1. Both latitude and longitude are present.
2. Coordinates are provided in either:
   - Decimal Degrees (DD), or
   - Degrees, Minutes, Seconds (DMS).
3. If Decimal Degrees are used, each coordinate contains at least six decimal places.
4. If DMS is used, the seconds value contains at least two decimal places.
5. A coordinate datum is specified — the form's checkbox options are **NAD 1927**, **NAD 1983**, or **WGS 84** (FEMA prefers NAD 1983, but all three are valid form selections).
6. The method or source used to determine the coordinates is documented in the Comments section.
7. If the coordinates were provided by a land surveyor, verify that the "Yes" checkbox is selected in Section D.

**Pass Criteria**: All applicable validation checks pass.

**Fail Criteria**: Any required coordinate, precision, datum, source, or cross-section validation is missing or invalid.

**Additional plausibility check (not from instruction text, engine-level)**: Latitude/longitude fall within continental/territorial US bounds (~17°N–72°N, 65°W–180°W). Severity MEDIUM — flags likely transcription errors rather than a form-completion defect.

**Severity**: HIGH (checks 1–6), MEDIUM (geographic range plausibility)
**Rule ID**: `A5_lat`, `A5_lon`, `A5_datum`, `A5_precision_dd`, `A5_precision_dms`, `A5_source_documented`, `A5_surveyor_flag`, `A5_range` (plausibility)
**highlight_refs**: `["A5"]`

---

### A6 — Building Photographs

**FEMA instruction (page 9, Item A6)**: *"The certifier must provide at least two and when possible four photographs showing each side of the building taken within 90 days from the date of certification. The photographs must be taken with views confirming the building description and Building Diagram number provided in Item A7. To the extent possible, these photographs should show the entire building including foundation. In addition, when applicable, provide a photograph of the foundation showing a representative example of the flood openings or vents. All photographs must be in color and measure at least 3"×3". Digital photographs are acceptable."*

**Rule Name**: Validate Building Photographs

**Rule Explanation**:
1. Verify at least two photographs are attached (four preferred — one per side).
2. Verify photographs appear to confirm the building description and the diagram number entered in A7 (foundation visible).
3. If A8 or A9 indicate permanent flood openings are present, verify at least one close-up photograph of a representative opening/vent is included.
4. Verify photographs are in color and captioned per the form's convention ("Front View," "Rear View," "Right Side View," "Left Side View").

**Pass Criteria**: At least 2 photographs are present, with content consistent with checks 2–4 where determinable.

**Fail Criteria**: Fewer than 2 photographs present, or a required close-up of flood openings is missing when A8/A9 indicate openings exist.

**Severity**: MEDIUM
**Rule ID**: `A6_photos`
**highlight_refs**: `["A6"]`
**Note**: Photo *content* (whether the image actually shows the foundation, is in color, meets the 3"×3" size, or was taken within 90 days) cannot be reliably verified from text/PDF extraction alone. Mark **UNVERIFIABLE** rather than FAIL when only the count of attached photo pages can be determined.

---

### A7 — Building Diagram Number

**FEMA instruction (page 9, Item A7)**: *"Select the Building Diagram (shown on pages 17–19) that best represents the building. Then enter the diagram number and use the diagram to identify and determine the appropriate elevations requested in Items C2.a–h. If you are unsure of the correct diagram, select the diagram that most closely resembles the building being certified."*

**Rule Name**: Validate Building Diagram Number

**Rule Explanation**:
1. Verify A7 is present and non-blank.
2. Verify the value is one of the eleven valid FEMA diagram numbers (Building Diagrams, pages 17–19): **1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9**.

**Pass Criteria**: A7 is present and matches one of the eleven valid diagram codes.

**Fail Criteria**: A7 is blank, or the value does not match any of the eleven valid diagram codes.

**Diagram reference table** (pages 17–19):

| Diagram | Distinguishing feature | Explicitly mentions attached garage? | Has crawlspace/enclosure below elevated floor? |
|---------|------------------------|:---:|:---:|
| 1A | Slab-on-grade; bottom floor at/above grade on ≥1 side | Yes | No |
| 1B | Raised-slab-on-grade / slab-on-stem-wall-with-fill; bottom floor at/above grade on ≥1 side | Yes | No |
| 2A | Basement; bottom floor below grade on all sides | Yes | No (basement, not enclosure) |
| 2B | Basement; bottom floor below grade on all sides, most wall height below grade, egress below grade | Yes | No (basement, not enclosure) |
| 3 | Split-level, slab-on-grade; bottom floor at/above grade on ≥1 side | Yes | No |
| 4 | Split-level, with basement; bottom floor below grade on all sides | Yes | No (basement, not enclosure) |
| 5 | Elevated on piers/posts/piles/columns/shear walls; **no obstruction** below elevated floor | Not mentioned | No (explicitly open) |
| 6 | Elevated on piers/posts/piles/columns/shear walls; full/partial **enclosure** below elevated floor | Not mentioned | Yes |
| 7 | Elevated on full-story foundation walls; partial/full enclosure below elevated floor (incl. walkout levels) | Not mentioned | Yes |
| 8 | Elevated on crawlspace; crawlspace floor at/above grade on ≥1 side | Yes | Yes |
| 9 | Elevated on sub-grade crawlspace (below grade on all sides) | Yes | Yes |

**Cross-field plausibility check** (severity MEDIUM, not a hard gate — see `completeness-checklist.md` for the actual A8/A9 presence gate, which is driven by whether a crawlspace/enclosure or garage physically exists, not by diagram number alone):
- If A7 ∈ {5} and A8.a (crawlspace/enclosure sq. ft.) is non-N/A/non-zero → flag as inconsistent (Diagram 5 is explicitly open, no enclosure).
- If A7 ∈ {2A, 2B, 4} and A8 sub-items are filled with a non-N/A crawlspace/enclosure value → flag as inconsistent (these are basement diagrams, not enclosure diagrams).
- Diagram drives which Section C elevation items (C2.a–h) are required — out of scope for this POC's Section A-only rule set, noted here for forward reference.

**Severity**: HIGH (presence/valid-code checks), MEDIUM (diagram-vs-A8 consistency)
**Rule ID**: `A7_valid`, `A7_diagram_a8_consistency`
**highlight_refs**: `["A7"]`

---

### A8 — Crawlspace or Enclosure Details

**FEMA instruction (page 9–10, Items A8.a–A8.f)**:
- **A8.a**: *"Provide the square footage of the crawlspace or enclosure(s) below the lowest elevated floor... If there is no crawlspace or enclosure, enter 'N/A' for Items A8.a-f."*
- **A8.b**: *"Indicate if there is at least one permanent flood opening within 1.0 foot of the adjacent grade on at least two exterior walls of each enclosed area... If the crawlspace or enclosure(s) have no permanent flood openings, or if none of the openings are within 1.0 foot above adjacent grade, enter '0' (zero) in Item A8.c-f. If there is no crawlspace or enclosure, enter 'N/A'."*
- **A8.c**: *"Enter the total number of permanent non-engineered and/or engineered flood openings in the crawlspace or enclosure(s) that are no higher than 1.0 foot above the higher of the exterior or interior grade or floor immediately below the opening."*
- **A8.d**: *"Enter the total measured net open area of permanent non-engineered flood openings indicated in A8.c in square inches, excluding any bars, louvers, or other covers..."*
- **A8.e**: *"Enter the total rated area of the permanent engineered flood openings indicated in A8.c, in square feet. Attach a copy of the Individual Engineered Flood Openings Certification... or an Evaluation Report issued by ICC ES... Flood openings cannot be considered engineered flood openings without documentation. If no documentation is available/provided, enter the net open (unobstructed) area of the flood openings in A8.d instead."*
- **A8.f**: *"Complete only if permanent engineered and permanent non-engineered flood openings are both present. Enter the sum of A8.d... and A8.e... If either A8.d or A8.e is '0', then enter 'N/A' for A8.f."*

**Rule Name**: Validate Crawlspace / Enclosure Flood Opening Details

**Condition**: Rule applies only when a crawlspace or enclosure physically exists (A8.a is a numeric square-footage value, not "N/A"). See `completeness-checklist.md` for the presence gate itself.

**Rule Explanation**:
1. If A8.b = "No" (no qualifying openings), verify A8.c through A8.f are entered as "0" rather than left blank.
2. If A8.c (opening count) > 0 for non-engineered openings, verify A8.d (net open area, sq. in.) is present.
3. If A8.c indicates engineered openings, verify A8.e (rated area, sq. ft.) is present and documentation (Individual Engineered Flood Openings Certification or ICC ES Evaluation Report) is referenced/attached; if no documentation is present, the opening should instead be counted in A8.d as non-engineered.
4. Verify A8.f is completed only when both A8.d and A8.e are non-zero (i.e., both engineered and non-engineered openings present); otherwise A8.f should read "N/A".
5. Opening ratio check: per NFIP Technical Bulletin 1, non-engineered openings must provide ≥ 1 sq. in. of net open area per sq. ft. of enclosed area — verify A8.d ≥ A8.a (when expressed in the same unit convention: 1 sq in per sq ft).

**Pass Criteria**: All applicable A8 sub-items are completed consistent with the rules above.

**Fail Criteria**: A8.c–f left blank where a "0" or value is required; A8.f completed/omitted incorrectly relative to A8.d/A8.e; engineered openings claimed in A8.e without documentation; or the non-engineered opening ratio (A8.d vs A8.a) falls below the 1 sq in/sq ft minimum.

**Severity**: HIGH (blank required sub-items, undocumented engineered openings), MEDIUM (opening ratio, A8.f logic)
**Rule ID**: `A8_zero_consistency`, `A8_noneng_area_required`, `A8_eng_area_required`, `A8_eng_documentation`, `A8_sum_logic`, `A8_opening_ratio`
**highlight_refs**: `["A8"]`

---

### A9 — Attached Garage Details

**FEMA instruction (page 10, Items A9.a–A9.f)**:
- **A9.a**: *"Provide the square footage of the attached garage with or without permanent flood openings. Take the measurement from the outside of the garage. If there is no attached garage, enter 'N/A' for items A9.a-f."*
- **A9.b**: *"Indicate if there is at least one permanent flood opening within 1.0 foot of the adjacent grade on at least two exterior walls of the attached garage... If the attached garage has no permanent flood openings, or if none of the openings are within 1.0 foot above adjacent grade, enter '0' (zero) in Items A9.c-f. If there is no attached garage, enter 'N/A'."*
- **A9.c**: *"Enter the total number of permanent non-engineered and/or engineered flood openings in the attached garage that are no higher than 1.0 foot above the higher of the exterior or interior grade or floor immediately below the opening. This includes any openings that are in the garage door that are no higher than 1.0 foot above the adjacent grade."*
- **A9.d**: *"Enter the total measured net open area of permanent non-engineered flood openings indicated in A9.c in square inches, excluding any bars, louvers, or other covers..."*
- **A9.e**: *"Enter the total rated area of the permanent engineered flood openings indicated in A9.c in square feet. Attach a copy of the Individual Engineered Flood Openings Certification... or an Evaluation Report issued by the ICC ES... If no documentation is available/provided, enter the net open (unobstructed) area of the flood openings in A9.d instead."*
- **A9.f**: *"Complete only if permanent engineered and permanent non-engineered flood openings are both present. Enter the sum of A9.d... and A9.e... If either A9.d or A9.e is '0', then enter 'N/A' for A9.f."*

**Rule Name**: Validate Attached Garage Flood Opening Details

**Condition**: Rule applies only when an attached garage physically exists (A9.a is a numeric square-footage value, not "N/A"). See `completeness-checklist.md` for the presence gate itself.

**Rule Explanation**:
1. If A9.b = "No" (no qualifying openings), verify A9.c through A9.f are entered as "0" rather than left blank.
2. If A9.c (opening count) > 0 for non-engineered openings, verify A9.d (net open area, sq. in.) is present — including openings located in the garage door itself, per instructions.
3. If A9.c indicates engineered openings, verify A9.e (rated area, sq. ft.) is present and documentation is referenced/attached; if undocumented, the opening should instead be counted in A9.d.
4. Verify A9.f is completed only when both A9.d and A9.e are non-zero; otherwise A9.f should read "N/A".
5. Opening ratio check: non-engineered openings must provide ≥ 1 sq. in. of net open area per sq. ft. of garage area — verify A9.d ≥ A9.a (1 sq in per sq ft convention).

**Pass Criteria**: All applicable A9 sub-items are completed consistent with the rules above.

**Fail Criteria**: A9.c–f left blank where a "0" or value is required; A9.f completed/omitted incorrectly relative to A9.d/A9.e; engineered openings claimed in A9.e without documentation; or the non-engineered opening ratio (A9.d vs A9.a) falls below the 1 sq in/sq ft minimum.

**Severity**: HIGH (blank required sub-items, undocumented engineered openings), MEDIUM (opening ratio, A9.f logic)
**Rule ID**: `A9_zero_consistency`, `A9_noneng_area_required`, `A9_eng_area_required`, `A9_eng_documentation`, `A9_sum_logic`, `A9_opening_ratio`
**highlight_refs**: `["A9"]`

---

## Sections B–I — Future Scope

Not implemented in this POC. Field *presence* for Section B is covered in `completeness-checklist.md`; semantic rules for B–I (BFE-vs-zone consistency, datum matching, LAG/HAG plausibility, freeboard, self-certification, etc.) are deferred to a future rules-file revision.

---

## Check Result Format

```json
{
  "check_id": "A7_valid",
  "check_name": "Building Diagram Number — Valid Diagram",
  "status": "FLAG",
  "found": "diagram 12",
  "expected": "One of: 1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9",
  "confidence": "High",
  "note": "Diagram '12' is not a valid FEMA diagram number for form FF-206-FY-22-152",
  "rules_version": "v2",
  "highlight_refs": ["A7"]
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| PASS | Rule satisfied |
| FLAG | Rule violated — reviewer action required |
| N/A | Rule not applicable (condition not met, e.g., A8 when no crawlspace/enclosure exists) |
| UNVERIFIABLE | Cannot determine from available data (e.g., photo content from text extraction) |

## Confidence Levels

| Level | When to use |
|-------|------------|
| High | Enumeration check, format validation, arithmetic, presence check |
| Medium | Conditional logic, name matching, semantic keyword scan |
| Low | Heuristic plausibility (rarely used) |

---

*v2 — frozen for form FF-206-FY-22-152. Rebuilt directly from PDF Instructions pages 9–19 and Building Diagrams pages 17–19. Section A only; future form-version or section additions get separate revisions.*
