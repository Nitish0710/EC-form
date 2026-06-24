# EC Validator — FEMA Elevation Certificate Validation System

A proof-of-concept validation system for FEMA Elevation Certificates built with **Vercel Eve** (agent framework) and **Next.js**.

## Architecture

- **Backend**: Eve agent framework with durable workflows
  - VLM-based PDF extraction with bounding boxes
  - Rule-based validation (completeness + FEMA compliance)
  - Feedback loop with output versioning
  
- **Frontend**: Next.js + React + Tailwind CSS
  - Split-panel UI (PDF viewer + validation results)
  - PDF region highlighting
  - Real-time result streaming
  - Download latest output version

## Project Structure

```
ec-validator-new/
├── agent/                    # Eve agent (backend)
│   ├── instructions.md       # Orchestrator instructions
│   ├── agent.ts             # Agent configuration
│   ├── skills/              # Markdown-based validation rules
│   │   ├── completeness-checklist.md
│   │   └── fema-rules.md
│   ├── subagents/           # Specialized agents
│   │   ├── extractor.ts     # PDF → extraction.json
│   │   ├── validator.ts     # Validation rules → CheckResults
│   │   └── feedback.ts      # Feedback → new output version
│   ├── tools/               # TypeScript tools
│   │   ├── fetch_pdf.ts
│   │   ├── rasterize_pdf.ts
│   │   ├── write_output_version.ts
│   │   └── append_feedback.ts
│   └── package.json
└── web/                     # Next.js frontend
    ├── app/
    │   ├── page.tsx
    │   └── api/
    └── components/
        ├── PdfPanel.tsx
        ├── ResultsPanel.tsx
        └── FlagCard.tsx
```

## Setup

### Prerequisites

- Node.js 22+
- npm or yarn
- Vercel account (for Blob storage and deployment)
- Anthropic API key (for Claude Sonnet 4.5)

### Installation

1. **Install agent dependencies**:
   ```bash
   cd agent
   npm install
   ```

2. **Install web dependencies**:
   ```bash
   cd web
   npm install
   npm install react-pdf pdfjs-dist @vercel/blob ai
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in:
   - `BLOB_READ_WRITE_TOKEN` — Get from Vercel dashboard
   - `ANTHROPIC_API_KEY` — Your Claude API key
   - `AI_GATEWAY_URL` — (Optional) Vercel AI Gateway endpoint

### Development

1. **Start the Eve agent**:
   ```bash
   cd agent
   npm run dev
   ```

2. **Start the Next.js frontend**:
   ```bash
   cd web
   npm run dev
   ```

3. **Open**: http://localhost:3000

## Workflow

1. **Upload EC PDF** → Vercel Blob
2. **Extract** → VLM extracts fields + bounding boxes
3. **Version Gate** → Check form version (FF-206-FY-22-152 only)
4. **Validate** → Apply completeness + FEMA rules
5. **Review** → Confirm or override flags
6. **Download** → Get latest `output_v{n}.json`

## Data Contracts

### extraction.json
```json
{
  "form_version": "FF-206-FY-22-152",
  "extraction_confidence": 0.94,
  "fields": {
    "A1": {
      "value": "Robert T. Calloway",
      "confidence": 0.97,
      "bbox": { "page": 1, "x": 0.10, "y": 0.18, "w": 0.42, "h": 0.03 }
    }
  }
}
```

### CheckResult
```json
{
  "check_id": "X3",
  "check_name": "Freeboard Check",
  "status": "FLAG",
  "found": "C2.a = 11.20 ft, BFE = 12.00 ft",
  "expected": "C2.a ≥ BFE",
  "confidence": "High",
  "rules_version": "v1",
  "highlight_refs": ["C2a", "B9"]
}
```

### output_v{n}.json
```json
{
  "output_version": 1,
  "ec_id": "1770267302",
  "form_version": "FF-206-FY-22-152",
  "summary": { "checks": 92, "pass": 84, "flag": 6 },
  "checks": [...],
  "download_url": "https://..."
}
```

## Validation Rules

### Completeness (completeness-checklist.md)
- All required fields present (Sections A-I)
- Conditional fields based on zone/diagram
- Cross-field consistency

### FEMA Rules (fema-rules.md)
- **P1-P2**: Confidence gate, form version
- **A2, A5, A7**: Address, lat/long, diagram vision match
- **B8-B13**: Zone, BFE, datum, LiMWA consistency
- **C2a-C2h**: Elevations, freeboard, conditional requirements
- **D1-D3**: Certifier info, comments completeness
- **X2-X5**: Cross-field arithmetic (freeboard, LAG/HAG)

## POC Scope

**Supported**:
- Form version: FF-206-FY-22-152 only
- All-field completeness validation
- Selected FEMA rule validations
- Vision-based diagram matching (A7)
- Feedback loop with output versioning

**Out of Scope** (future):
- Multi-version form support
- All 43 QA-adjuster depth rules
- Auto-generated rules from guidelines PDFs
- Multi-user roles & audit dashboards
- FEMA NFIP API integration

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import to Vercel**
3. **Set environment variables** in Vercel dashboard
4. **Deploy**

The Eve agent and Next.js app deploy together as a single Vercel project.

## Development Checklist

- [x] Scaffold Eve agent structure
- [x] Create validation skills (completeness + FEMA rules)
- [x] Implement tools (fetch, rasterize, write_output, append_feedback)
- [x] Define subagents (extractor, validator, feedback)
- [ ] Complete Next.js frontend setup
- [ ] Implement PdfPanel with highlighting
- [ ] Implement ResultsPanel with streaming
- [ ] Implement FlagCard with confirm/override
- [ ] End-to-end testing with sample EC

## Notes

- **Vercel Plan**: Use **Pro** (not Hobby) for commercial use and to exclude training data
- **Vision Model**: Claude Sonnet 4.5 via AI Gateway for bounding boxes
- **Durable Workflows**: Agent parks after presenting v1, resumes on feedback
- **Bounding Boxes**: VLM-returned boxes (normalized 0-1 per page)

## Support

For issues or questions, refer to:
- Eve documentation: https://vercel.com/docs/eve
- Plan document: `docs/EC_Validator_POC_Plan_v1_vercel.md`
- Prototype: `ec-validator-prototype.html`
