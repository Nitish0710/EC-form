import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const VALID_FLOOD_ZONES = new Set([
  'A','AE','AH','AO','AR','A99','V','VE',
  'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10',
  'A11','A12','A13','A14','A15','A16','A17','A18','A19','A20',
  'A21','A22','A23','A24','A25','A26','A27','A28','A29','A30',
]);
const BFE_REQUIRED_ZONES = new Set([
  'AE','AH','VE',
  'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10',
  'A11','A12','A13','A14','A15','A16','A17','A18','A19','A20',
  'A21','A22','A23','A24','A25','A26','A27','A28','A29','A30',
]);
const V_ZONES = new Set(['V', 'VE']);
const VALID_DIAGRAMS = new Set(['1A', '1B', '2A', '2B', '3', '4', '5', '6', '7', '8', '9']);
// Plausibility cross-checks only — A8/A9 requirement is gated by A8.a/A9.a itself (see runValidation).
// Diagrams whose description indicates a crawlspace/enclosure below the elevated floor (pages 17–19).
// Diagram 5 is explicitly "no obstructions below the elevated floor" and is excluded.
const A8_ENCLOSURE_DIAGRAMS = new Set(['2A', '2B', '4', '6', '7', '8', '9']);
// Diagrams whose description explicitly says "with or without attached garage" (pages 17–19).
const A9_GARAGE_DIAGRAMS = new Set(['1A', '1B', '2A', '2B', '3', '4', '8', '9']);

interface FieldValue {
  value: string;
  confidence: number;
  unit?: string;
  datum?: string;
}

interface ExtractionResult {
  form_version: string;
  extraction_confidence: number;
  fields: Record<string, FieldValue>;
}

interface CheckResult {
  check_id: string;
  check_name: string;
  status: 'PASS' | 'FLAG' | 'N/A' | 'UNVERIFIABLE';
  found: string;
  expected: string;
  confidence: 'High' | 'Medium' | 'Low';
  note?: string;
  rules_version: string;
  highlight_refs: string[];
}

function field(extraction: ExtractionResult, key: string): string {
  return extraction.fields[key]?.value?.trim() ?? '';
}

function num(extraction: ExtractionResult, key: string): number | null {
  const v = field(extraction, key);
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function check(
  id: string,
  name: string,
  status: CheckResult['status'],
  found: string,
  expected: string,
  confidence: CheckResult['confidence'],
  refs: string[],
  note?: string
): CheckResult {
  return { check_id: id, check_name: name, status, found, expected, confidence, note, rules_version: 'v1', highlight_refs: refs };
}

function runValidation(extraction: ExtractionResult): CheckResult[] {
  const results: CheckResult[] = [];
  const f = (k: string) => field(extraction, k);
  const n = (k: string) => num(extraction, k);

  // P1: Extraction confidence gate
  const conf = extraction.extraction_confidence;
  results.push(check(
    'P1', 'Extraction Confidence Gate',
    conf >= 0.85 ? 'PASS' : 'FLAG',
    `Overall confidence: ${(conf * 100).toFixed(0)}%`,
    'Confidence ≥ 85%',
    'High', [],
    conf < 0.85 ? 'Low confidence may indicate poor scan quality or a damaged document.' : undefined
  ));

  // P2: Form version
  results.push(check(
    'P2', 'Form Version',
    extraction.form_version === 'FF-206-FY-22-152' ? 'PASS' : 'FLAG',
    extraction.form_version || 'Not detected',
    'FF-206-FY-22-152 (Oct 2022)',
    'High', []
  ));

  // --- Completeness checks — run first, track failures for cascade ---
  const required: [string, string, string][] = [
    ['A1', 'Building Owner Name', 'A1'],
    ['A3', 'Parcel / Legal Description', 'A3'],
    ['A4', 'Building Use', 'A4'],
    ['A5_datum', 'Horizontal Datum (NAD)', 'A5'],
    ['A7', 'Building Diagram Number', 'A7'],
    ['B1a', 'NFIP Community Name', 'B1a'],
    ['B1b', 'NFIP Community Number', 'B1b'],
    ['B2', 'County', 'B2'],
    ['B3', 'State', 'B3'],
    ['B4', 'Map Number', 'B4'],
    ['B8', 'Flood Zone', 'B8'],
    ['B10', 'Elevation Datum', 'B10'],
    ['C1', 'Basis of Elevation', 'C1'],
    ['C2a', 'Top of Bottom Floor (C2a)', 'C2a'],
    ['C2f', 'Lowest Adjacent Grade (C2f)', 'C2f'],
    ['C2g', 'Highest Adjacent Grade (C2g)', 'C2g'],
    ['D1_name', 'Certifier Name', 'D1'],
    ['D2', 'Certification Date', 'D2'],
  ];
  const failedFields = new Set<string>();

  for (const [fieldKey, fieldName, ref] of required) {
    const val = f(fieldKey);
    const passed = !!val;
    if (!passed) failedFields.add(fieldKey);
    results.push(check(
      `COMP_${fieldKey}`, `${fieldName} — Required`,
      passed ? 'PASS' : 'FLAG',
      val || '(blank)',
      'Required field must be present',
      'High', [ref]
    ));
  }

  // A2: Address completeness
  const addrParts = ['A2_street', 'A2_city', 'A2_state', 'A2_zip'];
  const missingAddr = addrParts.filter(k => !f(k));
  results.push(check(
    'A2', 'Address Sub-fields',
    missingAddr.length === 0 ? 'PASS' : 'FLAG',
    missingAddr.length === 0
      ? `${f('A2_street')}, ${f('A2_city')}, ${f('A2_state')} ${f('A2_zip')}`
      : `Missing: ${missingAddr.map(k => k.replace('A2_', '')).join(', ')}`,
    'All address components required (street, city, state, ZIP)',
    'High', ['A2']
  ));

  // A5: Lat/lon precision
  const lat = f('A5_lat');
  const lon = f('A5_lon');
  const latDecimals = lat.includes('.') ? lat.split('.')[1].length : 0;
  const lonDecimals = lon.includes('.') ? lon.split('.')[1].length : 0;
  const latLonOk = lat && lon && latDecimals >= 6 && lonDecimals >= 6;
  results.push(check(
    'A5', 'Lat/Long Precision',
    !lat && !lon ? 'FLAG' : latLonOk ? 'PASS' : 'FLAG',
    lat && lon ? `${lat}, ${lon}` : '(blank)',
    'Min 6 decimal places required',
    'High', ['A5'],
    !latLonOk && lat ? `Lat decimals: ${latDecimals}, Lon decimals: ${lonDecimals}` : undefined
  ));

  // A4: Valid building use — auto-flag if COMP_A4 failed
  if (failedFields.has('A4')) {
    results.push(check('A4', 'Building Use — Valid Value', 'FLAG', '(blank)',
      'Must be: Residential, Non-Residential, Addition, Accessory, or Other',
      'High', ['A4'], 'Field blank — COMP_A4 failed'));
  } else {
    const a4Val = f('A4').toLowerCase();
    const validUses = ['residential', 'non-residential', 'addition', 'accessory', 'other'];
    results.push(check(
      'A4', 'Building Use — Valid Value',
      validUses.some(u => a4Val.includes(u)) ? 'PASS' : 'FLAG',
      f('A4'),
      'Must be: Residential, Non-Residential, Addition, Accessory, or Other',
      'High', ['A4']
    ));
  }

  // A5_datum: Horizontal datum — auto-flag if COMP_A5_datum failed
  if (failedFields.has('A5_datum')) {
    results.push(check('A5_datum', 'Horizontal Datum (A5)', 'FLAG', '(blank)',
      'Must be NAD 1927, NAD 1983, or WGS 84', 'High', ['A5'], 'Field blank — COMP_A5_datum failed'));
  } else {
    const datumNAD = f('A5_datum').toUpperCase();
    results.push(check(
      'A5_datum', 'Horizontal Datum (A5)',
      datumNAD.includes('NAD') || datumNAD.includes('WGS') ? 'PASS' : 'FLAG',
      f('A5_datum'),
      'Must be NAD 1927, NAD 1983, or WGS 84',
      'High', ['A5']
    ));
  }

  // A6: Photographs at end of document
  const photosVal = f('A6_photos').toLowerCase();
  results.push(check(
    'A6', 'Building Photographs (A6)',
    !photosVal || photosVal === 'no' ? 'FLAG' : 'PASS',
    photosVal || '(not detected)',
    'At least 2 photographs required at end of document (front view + rear/side view)',
    'Medium', ['A6'],
    !photosVal ? 'Photos may be present but could not be detected from text extraction' : undefined
  ));

  // A7 — Building Diagram Number (valid-code check only; no longer gates A8/A9)
  const diagram = failedFields.has('A7') ? '' : f('A7').trim();

  if (failedFields.has('A7')) {
    results.push(check('A7', 'Building Diagram — Valid Number', 'FLAG', '(blank)',
      'Must be one of: 1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9 (see form pages 17–19)',
      'High', ['A7'], 'Field blank — COMP_A7 failed'));
  } else {
    results.push(check(
      'A7', 'Building Diagram — Valid Number',
      VALID_DIAGRAMS.has(diagram) ? 'PASS' : 'FLAG',
      diagram,
      'Must be one of: 1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8, 9 (see form pages 17–19)',
      'High', ['A7']
    ));
  }

  // A8 — Crawl Space / Enclosure. Gated by A8.a itself, per instructions:
  // "If there is no crawlspace or enclosure, enter 'N/A' for Items A8.a-f."
  // Diagram number is NOT the gate (2A/2B/4 can also have a sub-grade crawlspace per
  // the A8.a instruction) — it's used below only as a plausibility cross-check.
  {
    const a8aRaw = f('A8a');
    const a8aIsNA = /^n\/?a$/i.test(a8aRaw.trim());
    results.push(check('COMP_A8a', 'Crawl Space / Enclosure Area (A8.a) — Required',
      a8aRaw ? 'PASS' : 'FLAG',
      a8aRaw || '(blank)',
      'Must be a square footage value, or "N/A" if no crawlspace/enclosure exists',
      'High', ['A8']));

    if (!a8aRaw) {
      results.push(check('A8', 'Crawl Space / Enclosure (A8)', 'UNVERIFIABLE',
        'A8.a was not answered — cannot determine whether this section applies',
        'A8.a must be a square footage value or "N/A"', 'High', ['A8']));
    } else if (a8aIsNA) {
      results.push(check('A8', 'Crawl Space / Enclosure (A8)', 'N/A',
        'No crawlspace or enclosure (A8.a = N/A)',
        'Not applicable — building has no crawlspace or enclosure', 'High', ['A8']));
    } else {
      const a8b = f('A8b');
      const a8c = f('A8c');
      const a8d = f('A8d');
      results.push(check('COMP_A8b', 'Flood Openings Count (A8.b) — Required', a8b ? 'PASS' : 'FLAG',
        a8b || '(blank)', `Required — crawlspace/enclosure present (A8.a = ${a8aRaw} sq. ft.)`, 'High', ['A8']));
      results.push(check('COMP_A8d', 'Engineered Openings (A8.d) — Required', a8d ? 'PASS' : 'FLAG',
        a8d || '(blank)', 'Yes/No required — crawlspace/enclosure present', 'High', ['A8']));
      const sqft = parseFloat(a8aRaw);
      const sqin = parseFloat(a8c);
      const engineered = a8d.toLowerCase() === 'yes';
      if (!isNaN(sqft) && !isNaN(sqin) && !engineered) {
        results.push(check(
          'A8_ratio', 'Flood Opening Ratio (A8) — NFIP Standard',
          sqin >= sqft ? 'PASS' : 'FLAG',
          `${sqin} sq.in. opening area for ${sqft} sq.ft. enclosed area`,
          '≥ 1 sq.in. per sq.ft. of enclosed area (non-engineered openings)',
          'Medium', ['A8'],
          sqin < sqft ? `Deficit: need ${sqft} sq.in., have ${sqin} sq.in.` : undefined
        ));
      }

      if (diagram && VALID_DIAGRAMS.has(diagram) && !A8_ENCLOSURE_DIAGRAMS.has(diagram)) {
        results.push(check(
          'A8_diagram_consistency', 'Diagram vs. Crawlspace/Enclosure Consistency', 'FLAG',
          `Diagram ${diagram} with A8.a = ${a8aRaw} sq. ft.`,
          `Diagram ${diagram}'s description (pages 17–19) does not indicate a crawlspace/enclosure below the elevated floor`,
          'Medium', ['A7', 'A8'],
          'Diagram number and A8 entry appear inconsistent — verify against Building Diagrams pages 17–19'
        ));
      }
    }
  }

  // A9 — Attached Garage. Gated by A9.a itself, per instructions:
  // "If there is no attached garage, enter 'N/A' for items A9.a-f."
  {
    const a9aRaw = f('A9a');
    const a9aIsNA = /^n\/?a$/i.test(a9aRaw.trim());
    results.push(check('COMP_A9a', 'Attached Garage Area (A9.a) — Required',
      a9aRaw ? 'PASS' : 'FLAG',
      a9aRaw || '(blank)',
      'Must be a square footage value, or "N/A" if no attached garage exists',
      'High', ['A9']));

    if (!a9aRaw) {
      results.push(check('A9', 'Attached Garage (A9)', 'UNVERIFIABLE',
        'A9.a was not answered — cannot determine whether this section applies',
        'A9.a must be a square footage value or "N/A"', 'High', ['A9']));
    } else if (a9aIsNA) {
      results.push(check('A9', 'Attached Garage (A9)', 'N/A',
        'No attached garage (A9.a = N/A)',
        'Not applicable — building has no attached garage', 'High', ['A9']));
    } else {
      const a9b = f('A9b');
      const a9c = f('A9c');
      const a9d = f('A9d');
      results.push(check('COMP_A9b', 'Garage Flood Openings Count (A9.b) — Required', a9b ? 'PASS' : 'FLAG',
        a9b || '(blank)', `Required — attached garage present (A9.a = ${a9aRaw} sq. ft.)`, 'High', ['A9']));
      results.push(check('COMP_A9d', 'Garage Engineered Openings (A9.d) — Required', a9d ? 'PASS' : 'FLAG',
        a9d || '(blank)', 'Yes/No required — attached garage present', 'High', ['A9']));
      const sqft9 = parseFloat(a9aRaw);
      const sqin9 = parseFloat(a9c);
      const engineered9 = a9d.toLowerCase() === 'yes';
      if (!isNaN(sqft9) && !isNaN(sqin9) && !engineered9) {
        results.push(check(
          'A9_ratio', 'Garage Flood Opening Ratio (A9) — NFIP Standard',
          sqin9 >= sqft9 ? 'PASS' : 'FLAG',
          `${sqin9} sq.in. opening area for ${sqft9} sq.ft. garage`,
          '≥ 1 sq.in. per sq.ft. of garage area (non-engineered openings)',
          'Medium', ['A9'],
          sqin9 < sqft9 ? `Deficit: need ${sqft9} sq.in., have ${sqin9} sq.in.` : undefined
        ));
      }

      if (diagram && VALID_DIAGRAMS.has(diagram) && !A9_GARAGE_DIAGRAMS.has(diagram)) {
        results.push(check(
          'A9_diagram_consistency', 'Diagram vs. Attached Garage Consistency', 'FLAG',
          `Diagram ${diagram} with A9.a = ${a9aRaw} sq. ft.`,
          `Diagram ${diagram}'s description (pages 17–19) does not explicitly mention an attached garage`,
          'Medium', ['A7', 'A9'],
          'Diagram number and A9 entry appear inconsistent — verify against Building Diagrams pages 17–19'
        ));
      }
    }
  }

  // B8 + B9 + B13 + C2c — auto-flag/unverifiable if COMP_B8 failed
  if (failedFields.has('B8')) {
    results.push(check('B8', 'Flood Zone Valid', 'FLAG', '(blank)',
      'Must be FEMA-approved zone (A, AE, AH, AO, AR, A99, V, VE, A1-A30)',
      'High', ['B8'], 'Field blank — COMP_B8 failed'));
    results.push(check('B9', 'Base Flood Elevation (BFE)', 'UNVERIFIABLE',
      'Cannot determine — B8 (Flood Zone) is blank',
      'Zone required to determine if BFE is needed', 'High', ['B8', 'B9']));
    results.push(check('B13', 'LiMWA Status', 'UNVERIFIABLE',
      'Cannot determine — B8 (Flood Zone) is blank',
      'Only required for V/VE zones', 'High', ['B8', 'B13']));
    results.push(check('C2c', 'Bottom of Lowest Horizontal Structural Member (C2c)', 'UNVERIFIABLE',
      'Cannot determine — B8 (Flood Zone) is blank',
      'Only required for V/VE zone + seaward of LiMWA + Diagram 5 or 6', 'High', ['C2c', 'B8']));
  } else {
    const zone = f('B8').toUpperCase();
    results.push(check(
      'B8', 'Flood Zone Valid',
      VALID_FLOOD_ZONES.has(zone) ? 'PASS' : 'FLAG',
      zone,
      'Must be FEMA-approved zone (A, AE, AH, AO, AR, A99, V, VE, A1-A30)',
      'High', ['B8']
    ));

    const bfe = n('B9');
    if (BFE_REQUIRED_ZONES.has(zone)) {
      results.push(check(
        'B9', 'Base Flood Elevation (BFE) Present',
        bfe !== null ? 'PASS' : 'FLAG',
        bfe !== null ? `${bfe} ft (${extraction.fields['B9']?.datum || ''})` : '(blank)',
        `BFE required for zone ${zone}`,
        'High', ['B9']
      ));
    } else {
      results.push(check('B9', 'Base Flood Elevation (BFE)', 'N/A',
        'Zone does not require BFE', `Zone: ${zone}`, 'High', ['B8']));
    }

    const limwa = f('B13');
    if (V_ZONES.has(zone)) {
      results.push(check(
        'B13', 'LiMWA Status (V-zone requirement)',
        limwa ? 'PASS' : 'FLAG',
        limwa || '(blank)',
        'Required for V/VE zones',
        'High', ['B13', 'B8']
      ));
    } else {
      results.push(check('B13', 'LiMWA Status', 'N/A',
        `Zone ${zone} — LiMWA not applicable`, 'Only required for V/VE zones', 'High', ['B8']));
    }

    const isSeawardLiMWA = limwa?.toLowerCase() === 'yes';
    const c2cRequired = V_ZONES.has(zone) && isSeawardLiMWA && (diagram === '5' || diagram === '6');
    const c2c = f('C2c');
    if (c2cRequired) {
      results.push(check(
        'C2c', 'Bottom of Lowest Horizontal Structural Member (C2c)',
        c2c ? 'PASS' : 'FLAG',
        c2c || '(blank)',
        'Required: V/VE zone + seaward of LiMWA + Diagram 5 or 6',
        'High', ['C2c', 'B8', 'B13', 'A7']
      ));
    } else {
      results.push(check('C2c', 'Bottom of Lowest Horizontal Structural Member (C2c)', 'N/A',
        `Conditions not met (Zone: ${zone}, LiMWA: ${limwa || 'N/A'}, Diagram: ${diagram || 'unknown'})`,
        'Only required for V/VE zone + seaward of LiMWA + Diagram 5 or 6',
        'High', ['C2c']
      ));
    }
  }

  // B10 + B11 — auto-flag if COMP_B10 failed; B11 requires datum10 so skip if blank
  if (failedFields.has('B10')) {
    results.push(check('B10', 'Elevation Datum Valid', 'FLAG', '(blank)',
      'Must be NAVD 88, NGVD 29, or other approved datum',
      'High', ['B10'], 'Field blank — COMP_B10 failed'));
  } else {
    const datum10 = f('B10');
    const validDatums = new Set(['NAVD 88', 'NGVD 29', 'OTHER']);
    results.push(check(
      'B10', 'Elevation Datum Valid',
      datum10 && (validDatums.has(datum10.toUpperCase()) || datum10.length > 3) ? 'PASS' : 'FLAG',
      datum10 || '(blank)',
      'Must be NAVD 88, NGVD 29, or other approved datum',
      'High', ['B10']
    ));

    const datum11 = f('B11') || f('C2');
    if (datum10 && datum11) {
      results.push(check(
        'B11', 'Datum Consistency (B10 vs C2)',
        datum10.toUpperCase() === datum11.toUpperCase() ? 'PASS' : 'FLAG',
        `B10: ${datum10} | C2: ${datum11}`,
        'All elevation measurements must use same datum',
        'High', ['B10', 'C2']
      ));
    }
  }

  // D1: Self-certification flag
  const ownerName = f('A1').toLowerCase();
  const certName = f('D1_name').toLowerCase();
  if (ownerName && certName && ownerName.length > 3) {
    const selfCert = ownerName === certName ||
      ownerName.split(' ').some(w => w.length > 3 && certName.includes(w));
    results.push(check(
      'D1', 'Self-Certification Check',
      selfCert ? 'FLAG' : 'PASS',
      `Owner: "${f('A1')}" | Certifier: "${f('D1_name')}"`,
      'Certifier should not be the building owner',
      'Medium', ['A1', 'D1'],
      selfCert ? 'Owner appears to be self-certifying. Not prohibited, but warrants review.' : undefined
    ));
  }

  // X3: Freeboard check — auto-unverifiable if COMP_C2a failed
  if (failedFields.has('C2a')) {
    results.push(check('X3', 'Freeboard Check — Lowest Floor vs BFE', 'UNVERIFIABLE',
      'C2a missing — see completeness check', 'C2a required to compute freeboard',
      'High', ['C2a', 'B9']));
  } else {
    const c2a = n('C2a');
    const bfeVal = n('B9');
    if (c2a !== null && bfeVal !== null) {
      const freeboard = c2a - bfeVal;
      results.push(check(
        'X3', 'Freeboard Check — Lowest Floor vs BFE',
        freeboard >= 0 ? 'PASS' : 'FLAG',
        `C2a = ${c2a} ft, BFE = ${bfeVal} ft — ${freeboard >= 0 ? freeboard.toFixed(2) + ' ft above' : Math.abs(freeboard).toFixed(2) + ' ft below'} BFE`,
        'C2a must be at or above B9 (same datum) for NFIP compliance',
        'High', ['C2a', 'B9'],
        `Freeboard = C2a − B9 = ${freeboard.toFixed(2)} ft`
      ));
    } else if (bfeVal !== null && c2a === null) {
      results.push(check('X3', 'Freeboard Check — Lowest Floor vs BFE', 'UNVERIFIABLE',
        'C2a missing — cannot compute freeboard', 'C2a required', 'High', ['C2a', 'B9']));
    }
  }

  // X4: LAG/HAG plausibility — auto-unverifiable if COMP_C2f or COMP_C2g failed
  if (failedFields.has('C2f') || failedFields.has('C2g')) {
    const missing = [
      failedFields.has('C2f') ? 'LAG (C2f)' : null,
      failedFields.has('C2g') ? 'HAG (C2g)' : null,
    ].filter(Boolean).join(', ');
    results.push(check('X4', 'LAG/HAG Plausibility', 'UNVERIFIABLE',
      `${missing} missing — see completeness check`,
      'Both C2f and C2g required', 'High', ['C2f', 'C2g']));
  } else {
    const c2f = n('C2f');
    const c2g = n('C2g');
    if (c2f !== null && c2g !== null) {
      results.push(check(
        'X4', 'LAG/HAG Plausibility',
        c2g >= c2f ? 'PASS' : 'FLAG',
        `LAG (C2f) = ${c2f} ft, HAG (C2g) = ${c2g} ft`,
        'Highest adjacent grade must be ≥ Lowest adjacent grade',
        'High', ['C2f', 'C2g'],
        c2g < c2f ? `HAG (${c2g}) is less than LAG (${c2f}) — likely a data entry error` : undefined
      ));
    }
  }

  // X5: Multi-story logic (skip if C2a failed COMP)
  if (!failedFields.has('C2a')) {
    const c2a = n('C2a');
    const c2b = n('C2b');
    if (c2a !== null && c2b !== null) {
      results.push(check(
        'X5', 'Multi-Story Floor Elevation Logic',
        c2b > c2a ? 'PASS' : 'FLAG',
        `Bottom floor (C2a) = ${c2a} ft, Next higher floor (C2b) = ${c2b} ft`,
        'C2b (next higher floor) must be > C2a (bottom floor)',
        'High', ['C2a', 'C2b']
      ));
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, ecId } = await request.json();

    if (!pdfBase64 || !ecId) {
      return NextResponse.json({ success: false, error: 'Missing pdfBase64 or ecId' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[Validate] PDF received: ${(pdfBase64.length * 0.75 / 1024).toFixed(0)} KB`);

    // Step 2: Extract fields via Claude
    console.log(`[Validate] Calling Claude for extraction...`);
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
    });

    const extractionMessage = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as any,
          {
            type: 'text',
            text: `You are extracting fields from a FEMA Elevation Certificate. Read every field carefully and return a JSON object with EXACTLY this structure. Return ONLY valid JSON, no markdown, no explanation.

{
  "form_version": "FF-206-FY-22-152",
  "extraction_confidence": 0.94,
  "fields": {
    "A1": { "value": "", "confidence": 0.0, "page": 1 },
    "A2_street": { "value": "", "confidence": 0.0, "page": 1 },
    "A2_city": { "value": "", "confidence": 0.0, "page": 1 },
    "A2_state": { "value": "", "confidence": 0.0, "page": 1 },
    "A2_zip": { "value": "", "confidence": 0.0, "page": 1 },
    "A3": { "value": "", "confidence": 0.0, "page": 1 },
    "A4": { "value": "", "confidence": 0.0, "page": 1 },
    "A5_lat": { "value": "", "confidence": 0.0, "page": 1 },
    "A5_lon": { "value": "", "confidence": 0.0, "page": 1 },
    "A5_datum": { "value": "", "confidence": 0.0, "page": 1 },
    "A6_photos": { "value": "", "confidence": 0.0, "page": 1 },
    "A7": { "value": "", "confidence": 0.0, "page": 1 },
    "A8a": { "value": "", "unit": "sq ft", "confidence": 0.0, "page": 1 },
    "A8b": { "value": "", "confidence": 0.0, "page": 1 },
    "A8c": { "value": "", "unit": "sq in", "confidence": 0.0, "page": 1 },
    "A8d": { "value": "", "confidence": 0.0, "page": 1 },
    "A9a": { "value": "", "unit": "sq ft", "confidence": 0.0, "page": 1 },
    "A9b": { "value": "", "confidence": 0.0, "page": 1 },
    "A9c": { "value": "", "unit": "sq in", "confidence": 0.0, "page": 1 },
    "A9d": { "value": "", "confidence": 0.0, "page": 1 },
    "B1a": { "value": "", "confidence": 0.0, "page": 1 },
    "B1b": { "value": "", "confidence": 0.0, "page": 1 },
    "B2": { "value": "", "confidence": 0.0, "page": 1 },
    "B3": { "value": "", "confidence": 0.0, "page": 1 },
    "B4": { "value": "", "confidence": 0.0, "page": 1 },
    "B5": { "value": "", "confidence": 0.0, "page": 1 },
    "B6": { "value": "", "confidence": 0.0, "page": 1 },
    "B7": { "value": "", "confidence": 0.0, "page": 1 },
    "B8": { "value": "", "confidence": 0.0, "page": 1 },
    "B9": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 1 },
    "B10": { "value": "", "confidence": 0.0, "page": 1 },
    "B11": { "value": "", "confidence": 0.0, "page": 1 },
    "B12": { "value": "", "confidence": 0.0, "page": 1 },
    "B13": { "value": "", "confidence": 0.0, "page": 1 },
    "C1": { "value": "", "confidence": 0.0, "page": 2 },
    "C2": { "value": "", "confidence": 0.0, "page": 2 },
    "C2a": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2b": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2c": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2d": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2e": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2f": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2g": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "C2h": { "value": "", "unit": "ft", "datum": "", "confidence": 0.0, "page": 2 },
    "D1_name": { "value": "", "confidence": 0.0, "page": 3 },
    "D1_license": { "value": "", "confidence": 0.0, "page": 3 },
    "D1_title": { "value": "", "confidence": 0.0, "page": 3 },
    "D2": { "value": "", "confidence": 0.0, "page": 3 },
    "D3": { "value": "", "confidence": 0.0, "page": 3 }
  }
}

Rules:
- For fields you can read clearly, set confidence 0.85-1.0
- For fields you can read but are uncertain, set confidence 0.5-0.84
- Set "page" to the PDF page number (1-based) where the field appears
- For blank/empty fields, use empty string and confidence 0.0
- For elevation values (C2a, C2b, etc.) extract just the numeric value (e.g. "11.20")
- For B9 (BFE), extract just the numeric value
- For form_version, look at the form header/footer for the form number
- For extraction_confidence, give your overall confidence across all fields
- For A5_datum: extract the checked horizontal datum checkbox — "NAD 1927", "NAD 1983", or "WGS 84"
- For A6_photos: check the final pages of the document for building photographs; set value to "yes" if photos appear, "no" if absent; note count if visible (e.g. "yes - 4 photos"). Photos are NOT on page 1 — they are attached at the end of the document.
- For A8a: enter the numeric square footage if the building has a crawlspace or enclosure. If it has NO crawlspace or enclosure, set the value to the literal string "N/A" (do not leave it blank — the form requires an explicit N/A). For A8b–A8d: extract the details when A8a is a numeric value; if A8a is "N/A", set A8b–A8d to "N/A" as well.
- For A9a: enter the numeric square footage if the building has an attached garage. If it has NO attached garage, set the value to the literal string "N/A" (do not leave it blank). For A9b–A9d: extract the details when A9a is a numeric value; if A9a is "N/A", set A9b–A9d to "N/A" as well.
- Do not include any text outside the JSON`
          }
        ]
      }]
    });

    // Step 3: Parse extraction result
    const rawText = extractionMessage.content[0].type === 'text' ? extractionMessage.content[0].text : '';
    console.log(`[Validate] Raw extraction length: ${rawText.length} chars`);

    let extraction: ExtractionResult;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      extraction = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      console.error('[Validate] Failed to parse extraction JSON:', rawText.substring(0, 500));
      throw new Error('Claude returned invalid JSON during extraction');
    }

    // Step 4: Version gate
    console.log(`[Validate] Form version: ${extraction.form_version}`);
    if (extraction.form_version && extraction.form_version !== 'FF-206-FY-22-152') {
      return NextResponse.json({
        success: false, ecId,
        formVersion: extraction.form_version,
        error: `Form version "${extraction.form_version}" is not supported. Only FF-206-FY-22-152 is supported in this POC.`,
      }, { status: 400 });
    }

    // Step 5: Run validation rules
    console.log(`[Validate] Running validation rules...`);
    const checks = runValidation(extraction);
    const flagCount = checks.filter(c => c.status === 'FLAG').length;
    const passCount = checks.filter(c => c.status === 'PASS').length;
    console.log(`[Validate] Done: ${checks.length} checks, ${flagCount} flags, ${passCount} pass`);

    return NextResponse.json({
      success: true,
      ecId,
      formVersion: extraction.form_version,
      extractionConfidence: extraction.extraction_confidence,
      extractionData: extraction,
      checks,
      outputVersion: 1,
      downloadUrl: null,
      summary: { total: checks.length, flags: flagCount, pass: passCount },
    });

  } catch (error) {
    console.error('[Validate] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
