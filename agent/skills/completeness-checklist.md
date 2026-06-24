# FEMA Elevation Certificate — Completeness Checklist

This skill validates that all required fields in the FEMA Elevation Certificate (Form FF-206-FY-22-152) are present and complete.

## Validation Logic

For each field:
- **Present and filled** → PASS
- **Required but blank** → FLAG  
- **Conditional field, condition not met** → N/A

## Section A — Property Information

### Always Required
- **A1** — Building Owner Name
- **A2** — Street Address (full: number, street, city, state, ZIP)
- **A3** — Parcel / Legal Description
- **A4** — Building Use (Residential, Non-Residential, Addition)
- **A5** — Latitude / Longitude (format: decimal degrees, min 6 decimal places)
- **A6** — Horizontal Datum (NAD 27 or NAD 83)
- **A7** — Building Diagram Number (1-11, matches FEMA diagrams)

### Conditional
- **A8a** — Crawlspace area (sq ft) — Required if A7 = 4
- **A8b** — Engineered opening (Y/N) — Required if A7 = 4
- **A9a** — Attached garage area (sq ft) — Required if A7 = 9
- **A9b** — Garage finished above BFE (Y/N) — Required if A7 = 9
- **A10** — Non-residential floodproofed (Y/N) — Required if A4 = Non-Residential

## Section B — Flood Map Information

### Always Required
- **B1a** — NFIP Community Name
- **B1b** — NFIP Community Number (6 digits)
- **B2** — County
- **B3** — State (2-letter code)
- **B4** — Map Number
- **B5** — Map Panel Suffix
- **B6** — Map Index Date
- **B7** — FIRM Panel Effective/Revised Date
- **B8** — Flood Zone (A, AE, AH, AO, AR, A99, V, VE)
- **B10** — Elevation Datum (NAVD 88, NGVD 29, other)

### Conditional
- **B9** — Base Flood Elevation (BFE) — Required if zone has BFE (AE, AH, VE, etc.)
- **B11** — Datum match — Must match B10
- **B12** — Source of BFE (FIS, FIRM, LOMA, etc.) — Required if B9 present
- **B13** — Seaward of Limit of Moderate Wave Action (LiMWA) — Required if V zone

## Section C — Building Elevation Information

### Always Required
- **C1** — Basis of Elevation (Construction, Post-Construction, Design)
- **C2** — Vertical datum (must match B10)

### Elevation Measurements (context-dependent)
- **C2a** — Top of bottom floor (including basement) — Always required
- **C2b** — Top of next higher floor — Required if building has multiple floors
- **C2c** — Bottom of lowest horizontal structural member — Required if V/VE zone AND seaward of LiMWA AND Diagram 5 or 6
- **C2d** — Attached garage — Required if A7 = 9
- **C2e** — Lowest elevation of machinery/equipment — Required if M&E present
- **C2f** — Lowest adjacent finished grade (LAG) — Always required
- **C2g** — Highest adjacent finished grade (HAG) — Always required
- **C2h** — Lowest adjacent grade (next to building) — Required for Zone AO

## Section D — Surveyor/Engineer/Architect Certification

### Always Required
- **D1** — Certifier information (name, license number, title, company, address, phone)
- **D2** — Certification date
- **D3** — Comments section — Must document:
  - If C2e present: M&E type and location
  - If floodproofed (A10 = Y): method details
  - If exceptions/variances: documentation
  - Building photos reference

## Section E — Building Elevation Information (Zones A1-A30, AE, AH, AO, AR)

This section is N/A for V/VE zones (use Section C instead).

### Required if applicable zone
- **E1** — Elevation certificate prepared for (LOMA, rate, permit, etc.)
- **E2** — Building diagram number (if different from A7)
- **E3** — Attachments (surveys, photos, flood insurance, building plans)
- **E4** — Comments

## Section F — IBC Building Classification

### Conditional
- **F1** — IBC building code classification — Required if local jurisdiction uses IBC

## Section G — Building Elevation Information (for Zones A, A99, AR, or Unnumbered A Zones without BFE)

### Required if no BFE available
- **G1** — Community design flood elevation
- **G2** — Explanation of how community flood elevation determined
- **G3** — Elevation measurements relative to community flood elevation

## Section H — Insurance Information

### Optional but recommended
- **H1** — Policy number
- **H2** — NFIP carrier

## Section I — Building Owner Certification

### Required if owner self-certifies
- **I1** — Owner signature
- **I2** — Date

---

## Check Format

For each field, produce a CheckResult:

```json
{
  "check_id": "A1",
  "check_name": "Building Owner Name",
  "status": "PASS | FLAG | N/A",
  "found": "Robert T. Calloway",
  "expected": "Required field",
  "confidence": "High",
  "note": "",
  "rules_version": "v1",
  "highlight_refs": ["A1"]
}
```

## Cross-field completeness rules

1. **A2 ↔ B3** — State in address must match state in B3
2. **B10 ↔ C2** — Elevation datum must be consistent
3. **B8 ↔ Section E** — If zone is A-type, Section E should be used instead of C
4. **A7 ↔ C2c** — Diagram + zone determines if C2c required
5. **C2e ↔ D3** — If M&E elevation present, D3 must document it

Apply all rules. Flag missing required fields. Mark N/A for conditional fields where condition is not met.
