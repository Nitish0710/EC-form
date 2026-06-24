# EC Validator Development Setup - Complete

## What Has Been Built

### ✅ Agent Backend (Eve Framework)
- **Orchestrator** (`agent/instructions.md`) - Complete workflow management
- **Agent Configuration** (`agent/agent.ts`) - Claude Sonnet 4.5, durable workflows
- **Skills**:
  - `completeness-checklist.md` - All-field validation (Sections A-I)
  - `fema-rules.md` - FEMA compliance rules (P1-P2, A-D, X2-X5)
- **Subagents**:
  - `extractor.ts` - VLM PDF extraction with bounding boxes
  - `validator.ts` - Rule application and CheckResult streaming
  - `feedback.ts` - Output versioning on reviewer actions
- **Tools**:
  - `fetch_pdf.ts` - Download from Vercel Blob
  - `rasterize_pdf.ts` - PDF to page images
  - `write_output_version.ts` - Generate versioned JSON + Blob upload
  - `append_feedback.ts` - Feedback log management

### ✅ Frontend (Next.js + React)
- **Main App** (`web/app/page.tsx`) - Upload + orchestration UI
- **Components**:
  - `PdfPanel.tsx` - PDF viewer with bounding box overlays
  - `ResultsPanel.tsx` - Tabbed validation results
  - `FlagCard.tsx` - Flag review with confirm/override actions
- **Configuration**:
  - TypeScript, Tailwind CSS, react-pdf integration
  - Vercel Blob upload support

## Directory Structure

```
ec-validator-new/
├── agent/
│   ├── instructions.md           ✅
│   ├── agent.ts                   ✅
│   ├── package.json               ✅
│   ├── skills/
│   │   ├── completeness-checklist.md  ✅
│   │   └── fema-rules.md              ✅
│   ├── subagents/
│   │   ├── extractor.ts           ✅
│   │   ├── validator.ts           ✅
│   │   └── feedback.ts            ✅
│   └── tools/
│       ├── fetch_pdf.ts           ✅
│       ├── rasterize_pdf.ts       ✅
│       ├── write_output_version.ts ✅
│       └── append_feedback.ts     ✅
├── web/
│   ├── app/
│   │   ├── page.tsx               ✅
│   │   ├── layout.tsx             ✅
│   │   └── globals.css            ✅
│   ├── components/
│   │   ├── PdfPanel.tsx           ✅
│   │   ├── ResultsPanel.tsx       ✅
│   │   └── FlagCard.tsx           ✅
│   ├── package.json               ✅
│   ├── tsconfig.json              ✅
│   └── next.config.mjs            ✅
├── .env.example                   ✅
└── README.md                      ✅
```

## Next Steps for Implementation

### Step 1: Install Dependencies

```bash
# Agent dependencies
cd agent
npm install

# Web dependencies
cd ../web
npm install
```

### Step 2: Configure Environment Variables

Create `d:\EC Form\ec-validator-new\.env.local`:

```env
# Get these from Vercel dashboard
BLOB_READ_WRITE_TOKEN=your_token_here
ANTHROPIC_API_KEY=your_claude_key_here
AI_GATEWAY_URL=optional_gateway_url

# Local development
SANDBOX_WORKING_DIR=./tmp/ec-validator
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Remaining Implementation Tasks

#### 3.1: Version Gate (agent side)
Create `agent/middleware/version-gate.ts`:
```typescript
// Check extraction.form_version === "FF-206-FY-22-152"
// If mismatch, halt with clear error
// Otherwise, proceed to validator
```

#### 3.2: Agent-Web Integration
Create `web/app/api/validate/route.ts`:
```typescript
// Accept Blob URL
// Call Eve agent API
// Stream CheckResults back
// Return initial output_v1.json
```

Create `web/app/api/feedback/route.ts`:
```typescript
// Accept feedback action
// Resume Eve agent
// Return new output_v{n}.json
```

#### 3.3: Vercel Blob Upload (web side)
Update `web/app/page.tsx` `handleFileUpload`:
```typescript
// Upload to Vercel Blob (client-side)
// Get Blob URL
// Call /api/validate with URL
// Stream results
```

### Step 4: Testing

#### Test Data Needed:
1. Sample EC PDF (FF-206-FY-22-152 version)
2. Building photos (for A7 vision check)

#### Test Workflow:
1. Start agent: `cd agent && npm run dev`
2. Start web: `cd web && npm run dev`
3. Upload EC PDF
4. Verify extraction → validation → results display
5. Test confirm/override → v2 generation
6. Download output_v{n}.json

## Implementation Priorities

### High Priority (Required for POC):
- [x] Agent structure
- [x] Validation skills
- [x] Frontend components
- [ ] Version gate middleware
- [ ] API routes (validate, feedback)
- [ ] Blob upload integration
- [ ] End-to-end testing

### Medium Priority (Enhanced functionality):
- [ ] Error handling & retries
- [ ] Progress indicators
- [ ] Loading states
- [ ] Better TypeScript types

### Low Priority (Future enhancements):
- [ ] Multi-document batch processing
- [ ] Historical results view
- [ ] Export to different formats
- [ ] Mobile responsive design

## Known Issues & Notes

1. **Eve Framework**: The actual Eve framework integration needs to be completed. The current code provides the structure and interfaces, but requires Eve CLI and runtime.

2. **VLM Bounding Boxes**: The extractor subagent's vision-based bounding box extraction needs to be calibrated with real EC PDFs.

3. **Dependencies**: Some npm packages (especially canvas, pdfjs-dist) may require native dependencies on Windows. Use the Windows Build Tools if needed.

4. **Vercel Deployment**: Remember to:
   - Use Pro plan (not Hobby)
   - Set environment variables in dashboard
   - Configure Blob storage
   - Set up AI Gateway for Claude access

## Development Commands

```bash
# Agent development
cd agent
npm install
npm run dev

# Web development
cd web
npm install
npm run dev

# Build for production
npm run build

# Deploy to Vercel
cd ..
vercel deploy
```

## File Formats Reference

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

### output_v{n}.json
```json
{
  "output_version": 1,
  "ec_id": "1770267302",
  "form_version": "FF-206-FY-22-152",
  "rules_version": "v1",
  "generated_at": "2026-06-24T10:14:00Z",
  "summary": {
    "checks": 92,
    "pass": 84,
    "flag": 6,
    "na": 2,
    "confirmed": 0,
    "overridden": 0
  },
  "checks": [...],
  "download_url": "https://..."
}
```

## Questions for User

Before proceeding with implementation:

1. **EC Sample**: Do you have a real FF-206-FY-22-152 EC PDF we can test with?
2. **Vercel Account**: Is your Vercel account set up with Pro plan?
3. **API Keys**: Do you have Anthropic API key ready?
4. **Eve Framework**: Do you have Eve CLI installed? (Note: Eve is relatively new - may need setup guidance)

## Current Status

**Scaffolding: 100% Complete** ✅
- Agent structure built
- Skills authored
- Frontend components created
- Documentation written

**Integration: 30% Complete** 🚧
- API routes needed
- Blob upload needed
- Agent<->Web connection needed

**Testing: 0% Complete** ⏳
- Awaiting sample data
- End-to-end workflow pending

---

Created: June 24, 2026
Last Updated: June 24, 2026
Status: Development scaffolding complete, ready for integration phase
