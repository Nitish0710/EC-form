# FEMA Elevation Certificate — Validation Rules (v1)

Selected set of FEMA validation rules for form FF-206-FY-22-152. These go beyond completeness to check semantic correctness, consistency, and compliance with NFIP requirements.

## Pre-Processing Checks

### P1: Extraction Confidence Gate
- **Rule**: Overall extraction confidence must be ≥ 85%
- **Flag if**: `extraction_confidence < 0.85`
- **Severity**: HIGH
- **Note**: Low confidence suggests poor scan quality or damaged document

### P2: Form Version
- **Rule**: Must be FEMA Form FF-206-FY-22-152 (October 2022 version)
- **Flag if**: Form header doesn't match "FEMA FF-206-FY-22-152"
- **Severity**: HIGH
- **Note**: Different versions have different field requirements

## Section A — Property Information

### A2: Address Sub-fields and Cross-check
- **Rule**: Address must have all components (street number, street name, city, state, ZIP)
- **Rule**: State in A2 must match state in B3
- **Flag if**: Any address component missing OR A2 state ≠ B3 state
- **Confidence**: High (text parsing)

### A5: Lat/Long Precision + Datum
- **Rule**: Latitude and longitude must have minimum 6 decimal places
- **Rule**: Must specify horizontal datum (NAD 27 or NAD 83)
- **Flag if**: Fewer than 6 decimals OR missing datum
- **Confidence**: High (format validation)

### A7: Building Diagram + Vision Match
- **Rule**: Building diagram (1-11) must match building photos
- **Use**: Vision model analyzes submitted building photos against all 11 FEMA diagram distinguishing features
- **Flag if**: Vision model suggests different diagram with medium+ confidence
- **Confidence**: Medium (vision-based)
- **Note**: This is the most sophisticated check — uses VLM to compare stated diagram vs. photo evidence

**Key diagram distinguishing features for vision:**
- Diagram 1: Basement, no elevated floor
- Diagram 2: Crawlspace/enclosure below elevated floor, less than 5 feet
- Diagram 3: Crawlspace/enclosure, slab on grade
- Diagram 4: Crawlspace with engineered openings
- Diagram 5: **Open piers/piles below elevated floor, no enclosure**
- Diagram 6: **Enclosed below elevated floor (garage, storage)**
- Diagram 7: Split-level, lowest floor below BFE
- Diagram 8: Elevated on continuous foundation
- Diagram 9: Attached garage
- Diagram 10: Addition
- Diagram 11: Elevated on posts/piers/columns over water

## Section B — Flood Map Information

### B8: Flood Zone Valid
- **Rule**: Flood zone must be one of: A, AE, AH, AO, AR, A99, V, VE, or variants
- **Flag if**: Zone not in FEMA approved list
- **Confidence**: High (enumeration check)

### B9: BFE Present and Plausible
- **Rule**: If zone has BFE (AE, AH, VE, etc.), B9 must be present
- **Rule**: BFE value must be plausible (typically -20 to +50 ft relative to common datums)
- **Flag if**: BFE required but missing OR value outside plausible range
- **Confidence**: High

### B10/B11: Elevation Datum Valid and Consistent
- **Rule**: Datum must be NAVD 88, NGVD 29, or other approved
- **Rule**: All elevation measurements (B9, C2 series) must use same datum
- **Flag if**: Invalid datum OR datum mismatch between sections
- **Confidence**: High

### B13: LiMWA ↔ Zone Consistency
- **Rule**: "Seaward of LiMWA" question is relevant only for V/VE zones
- **Flag if**: V/VE zone but LiMWA status not specified OR non-V zone but LiMWA answered
- **Confidence**: High

## Section C — Building Elevation

### C2a: Freeboard Input
- **Rule**: Top of bottom floor must be present (baseline for freeboard calculations)
- **Flag if**: Missing or unreadable
- **Confidence**: High

### C2c: Required When V-Zone + LiMWA + Diagram 5/6
- **Rule**: Bottom of lowest horizontal structural member (C2c) is required if:
  - Zone is V or VE (B8) AND
  - Building is seaward of LiMWA (B13 = Yes) AND
  - Diagram is 5 or 6 (elevated on open piers or enclosed below)
- **Flag if**: Conditions met but C2c is blank
- **Confidence**: High (rule-based)
- **Note**: This is a common missing-field error for coastal V-zone properties

### C2: Datum Consistency
- **Rule**: All C2 elevation measurements must use the datum specified in B10
- **Flag if**: C2 datum field doesn't match B10
- **Confidence**: High

## Section D — Certifier and Comments

### D1: Self-Certification Flag
- **Rule**: If building owner (A1) is also the certifier (D1), raise awareness flag
- **Flag if**: Owner name matches certifier name
- **Confidence**: Medium (name-matching heuristic)
- **Severity**: LOW (not prohibited, but warrants review)

### D3: Comments Completeness
- **Rule**: Section D comments must document certain details when applicable:
  - If C2e present (M&E): Must describe M&E type and location
  - If A10 = Yes (floodproofed): Must describe method
  - If variance/exception claimed: Must reference documentation
- **Flag if**: Trigger condition present but corresponding comment missing
- **Confidence**: High (semantic scan)
- **Note**: Scan D3 text for keywords (e.g., "HVAC", "equipment", "platform", "floodproofing")

## Cross-Field Arithmetic and Logic

### X2: Zone-Conditional Completeness
- **Rule**: Section E is for A-type zones; Section C is for V-type zones
- **Flag if**: V/VE zone but Section E filled instead of C (or vice versa)
- **Confidence**: High

### X3: Freeboard Check — Lowest Floor vs BFE
- **Rule**: Lowest floor elevation (C2a) should be at or above BFE (B9) for NFIP compliance
- **Calculate**: Freeboard = C2a - B9 (must be same datum)
- **Flag if**: C2a < B9 (negative freeboard)
- **Confidence**: High (arithmetic, same datum)
- **Severity**: HIGH (compliance issue)
- **Note**: Clearly state the delta (e.g., "0.80 ft below BFE")

### X4: LAG/HAG Plausibility
- **Rule**: Highest adjacent grade (C2g) must be ≥ lowest adjacent grade (C2f)
- **Flag if**: C2g < C2f
- **Confidence**: High (simple arithmetic)

### X5: Multi-Story Logic
- **Rule**: If C2b (next higher floor) is present, it must be > C2a (bottom floor)
- **Flag if**: C2b ≤ C2a
- **Confidence**: High

## Check Result Format

Each rule produces a CheckResult:

```json
{
  "check_id": "X3",
  "check_name": "Freeboard Check — Lowest Floor vs BFE",
  "status": "FLAG",
  "found": "C2.a = 11.20 ft, BFE (B9) = 12.00 ft — 0.80 ft below BFE",
  "expected": "C2.a at or above B9 (same datum, NAVD 88) per NFIP compliance",
  "confidence": "High",
  "note": "Arithmetic cross-check; both NAVD 88. Margin = C2.a − B9 = −0.80 ft.",
  "rules_version": "v1",
  "highlight_refs": ["C2a", "B9"]
}
```

## Confidence Levels

- **High**: Rule-based, enumeration checks, arithmetic with same datum, format validation
- **Medium**: Name matching, vision model recommendations, semantic keyword scans
- **Low**: Heuristic plausibility (rarely used in this ruleset)

## Status Codes

- **PASS**: Rule satisfied
- **FLAG**: Rule violated, requires reviewer attention
- **N/A**: Rule not applicable (condition not met)
- **UNVERIFIABLE**: Cannot determine (e.g., datum mismatch prevents calculation)

## Applying the Rules

1. Run completeness checks first (from completeness-checklist.md)
2. Then apply these semantic validation rules
3. Stream results as CheckResult objects
4. Group by section for presentation (A, B, C, D, Cross-field)
5. Highlight severity HIGH flags prominently

---

This is v1 of the ruleset, frozen for form FF-206-FY-22-152. Future form versions will get separate skill files.
