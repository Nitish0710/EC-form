# EC Validator - Quick Start Guide

## 🎉 What You Have Now

A fully scaffolded EC Validator POC with:
- ✅ Eve agent backend (orchestrator, skills, subagents, tools)
- ✅ Next.js frontend (PDF viewer, results panel, flag review UI)
- ✅ Complete validation rules for FF-206-FY-22-152
- ✅ Bounding box highlighting system
- ✅ Feedback loop with output versioning

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies (5-10 minutes)

```powershell
cd "d:\EC Form\ec-validator-new"

# Run the setup script
.\setup.ps1

# OR manually:
cd agent
npm install
cd ..\web
npm install
cd ..
```

### Step 2: Configure Environment (2 minutes)

Edit `.env.local` (created from `.env.example`):

```env
# Required
BLOB_READ_WRITE_TOKEN=<get from vercel.com dashboard>
ANTHROPIC_API_KEY=<your claude api key>

# Optional
AI_GATEWAY_URL=<vercel ai gateway url>
SANDBOX_WORKING_DIR=./tmp/ec-validator
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Where to get keys:**
- Vercel Blob Token: https://vercel.com/dashboard → Storage → Blob → Create Token
- Anthropic API Key: https://console.anthropic.com/ → API Keys

### Step 3: Run Development Servers (1 minute)

```powershell
# Terminal 1 - Start the agent
cd "d:\EC Form\ec-validator-new\agent"
npm run dev

# Terminal 2 - Start the web app
cd "d:\EC Form\ec-validator-new\web"
npm run dev
```

Open: **http://localhost:3000**

## 📂 Project Structure

```
ec-validator-new/
├── agent/              # Backend (Eve framework)
│   ├── instructions.md     # Main orchestrator logic
│   ├── agent.ts            # Configuration (Claude Sonnet 4.5)
│   ├── skills/             # Validation rules (Markdown)
│   │   ├── completeness-checklist.md  # All fields A-I
│   │   └── fema-rules.md              # FEMA compliance
│   ├── subagents/          # Specialized processors
│   │   ├── extractor.ts    # PDF → fields + bboxes
│   │   ├── validator.ts    # Rules → CheckResults
│   │   └── feedback.ts     # Review → new version
│   └── tools/              # Utilities
│       ├── fetch_pdf.ts
│       ├── rasterize_pdf.ts
│       ├── write_output_version.ts
│       └── append_feedback.ts
│
├── web/                # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx            # Main upload & orchestration UI
│   │   └── layout.tsx
│   └── components/
│       ├── PdfPanel.tsx        # PDF viewer + highlights
│       ├── ResultsPanel.tsx    # Tabbed results view
│       └── FlagCard.tsx        # Flag review actions
│
├── README.md                   # Full documentation
├── DEVELOPMENT_STATUS.md       # Current state & next steps
├── PROJECT_SUMMARY.md          # Initialization summary
├── .env.example                # Environment template
└── setup.ps1                   # Automated setup script
```

## 🔄 Development Workflow

### Current Status: **Scaffolding Complete** ✅

What's built:
- [x] All agent components (orchestrator, skills, subagents, tools)
- [x] All frontend components (PDF viewer, results, flag cards)
- [x] Validation rules (completeness + FEMA compliance)
- [x] Documentation & setup scripts

### Next Phase: **Integration** 🚧

What remains:
- [ ] Create API routes (`web/app/api/validate/route.ts`, `feedback/route.ts`)
- [ ] Implement Blob upload in frontend
- [ ] Connect frontend ↔ agent
- [ ] Test with real EC PDF sample

**Estimated time**: 6-8 hours

## 📋 Validation Rules Included

### Completeness Checks (completeness-checklist.md)
- Section A: Property Information (10 fields)
- Section B: Flood Map Information (13 fields)
- Section C: Building Elevation (10 fields)
- Section D: Certifier Info (3 fields)
- Sections E-I: Additional fields

### FEMA Rules (fema-rules.md)
- **P1-P2**: Extraction confidence, form version gate
- **A2, A5**: Address validation, lat/long precision
- **A7**: **Vision-based building diagram matching** 🎯
- **B8-B13**: Zone validation, BFE, datum, LiMWA
- **C2**: Elevation completeness, conditional C2c
- **D1-D3**: Self-certification, comments completeness
- **X2-X5**: Freeboard calculation, cross-field arithmetic

## 🎯 Key Features

1. **VLM-Based Extraction**
   - Extracts fields from PDF using Claude's vision
   - Returns normalized bounding boxes (0-1 per page)
   - Vision-based diagram matching (A7 check)

2. **Split-Panel UI**
   - Left: PDF viewer with clickable highlights
   - Right: Validation results with tabs
   - Click flag → highlights corresponding PDF regions

3. **Feedback Loop**
   - Confirm or Override each flag
   - Override with reason code + comment
   - Generates versioned outputs (v1, v2, v3...)
   - Downloadable JSON for each version

4. **Durable Workflows**
   - Agent parks after presenting v1
   - Resumes on each feedback action
   - Produces new version, parks again

## ⚠️ Important Notes

### Eve Framework
This project uses Vercel's **Eve** agent framework (preview/beta). You may need to install:

```bash
npm install -g @vercel/eve
```

Check Eve documentation: https://vercel.com/docs/eve

### Vercel Plan
**Use Pro, not Hobby**:
- Hobby = non-commercial only + training data usage
- Pro = commercial OK + exclude training data
- Pro trial: 14 days free
- Pro cost: $20/month

### Form Version
POC supports **FF-206-FY-22-152 ONLY**. Other versions will be rejected with:
```
"Form version [X] is not supported in this POC — only FF-206-FY-22-152 is wired up"
```

### Dependencies
Some npm packages (canvas, pdfjs-dist) may require native build tools on Windows. If install fails, you may need:

```powershell
npm install --global windows-build-tools
```

## 📚 Documentation Files

- **README.md**: Full project overview, architecture, data contracts
- **DEVELOPMENT_STATUS.md**: Current status, next steps, detailed task list
- **PROJECT_SUMMARY.md**: Initialization summary, what was created
- **QUICK_START.md**: This file - fast setup guide

## 🤝 Getting Help

### If Dependencies Fail:
1. Check Node.js version: `node --version` (need 22+)
2. Try clearing npm cache: `npm cache clean --force`
3. Delete `node_modules` and retry: `rm -rf node_modules; npm install`

### If Eve Doesn't Start:
1. Check if Eve CLI is installed: `eve --version`
2. Install if missing: `npm install -g @vercel/eve`
3. Check agent/agent.ts configuration

### If Frontend Won't Build:
1. Check TypeScript version: `npx tsc --version`
2. Verify all components exist
3. Check console for specific errors

## 📞 Next Steps

Once you complete Quick Start:

1. **Test the UI**
   - Verify PDF panel renders
   - Verify results panel layout
   - Check flag card interactions

2. **Review the Plan**
   - Read `d:\CNC git\docs\EC_Validator_POC_Plan_v1_vercel.md`
   - Compare prototype vs. current build

3. **Prepare for Integration**
   - Get sample FF-206-FY-22-152 EC PDF
   - Set up Vercel project
   - Configure Blob storage

4. **Continue Development**
   - Implement API routes
   - Connect frontend ↔ agent
   - Test end-to-end workflow

---

**Created**: June 24, 2026  
**Status**: Ready for dependency installation  
**Next**: Run `.\setup.ps1` or follow manual install steps
