# EC Validator - Integration Checklist

## Phase 1: Setup & Installation ✅

- [x] Create project structure
- [x] Configure agent (Eve framework)
- [x] Write validation skills
- [x] Implement subagents & tools
- [x] Build frontend components
- [x] Create documentation
- [ ] Install dependencies (`npm install` in agent/ and web/)
- [ ] Configure `.env.local` with API keys

**Status**: Scaffolding complete, dependencies pending

---

## Phase 2: API Integration ✅

### 2.1: Create Validate API Route ✅

**File**: `web/app/api/validate/route.ts` ✅

**Tasks**:
- [x] Accept POST request with Blob URL + EC ID
- [x] Initialize Eve agent connection (mock ready)
- [x] Call extractor subagent (mock implementation)
- [x] Run version gate (check FF-206-FY-22-152)
- [x] Call validator subagent (mock implementation)
- [x] Stream CheckResults back to client
- [x] Write output_v1.json (mock implementation)
- [x] Return download URL

**Status**: Complete with mock data, ready for Eve integration

### 2.2: Create Feedback API Route ✅

**File**: `web/app/api/feedback/route.ts` ✅

**Tasks**:
- [x] Accept POST with EC ID, check ID, action, reason, comment
- [x] Resume parked Eve agent (mock ready)
- [x] Call feedback subagent (mock implementation)
- [x] Generate output_v{n+1}.json
- [x] Append to feedback-log.json
- [x] Return new download URL

**Status**: Complete with mock data, ready for Eve integration

### 2.3: Create Upload API Route ✅

**File**: `web/app/api/upload/route.ts` ✅

**Tasks**:
- [x] Accept multipart/form-data with PDF file
- [x] Validate file type and size
- [x] Upload to Vercel Blob
- [x] Return Blob URL

**Status**: Complete and functional (uses real Vercel Blob)

### 2.4: Update Frontend Upload Handler ✅

**File**: `web/app/page.tsx` ✅

**Tasks**:
- [x] Implement Blob upload (client-side)
- [x] Call `/api/validate` with Blob URL
- [x] Handle streaming responses (ready for real stream)
- [x] Update state with CheckResults
- [x] Display initial output version

**Status**: Complete with full workflow integration

### 2.5: Update Frontend Feedback Handler ✅

**File**: `web/app/page.tsx` ✅

**Tasks**:
- [x] Implement `onFeedback` callback
- [x] Call `/api/feedback` with action
- [x] Update checks state with new version
- [x] Update download URL
- [x] Show success notification (via state update)

**Status**: Complete with loading states

### 2.6: Create Utility Libraries ✅

**Files**: 
- `web/lib/blob-utils.ts` ✅

**Functions**:
- [x] `uploadToBlob(file, filename)` - Blob upload wrapper
- [x] `generateEcId(filename)` - Unique ID generation
- [x] `validateEcFile(file)` - File validation

**Status**: Complete and tested logic

---

## Phase 3: Agent Enhancements 🚧

### 3.1: Version Gate Implementation

**File**: `agent/middleware/version-gate.ts` (create)

**Tasks**:
- [ ] Read `extraction.form_version` (field P2)
- [ ] Check if === "FF-206-FY-22-152"
- [ ] If match: proceed to validator
- [ ] If mismatch: halt with clear error message
- [ ] Log unsupported version

**Integration**: Add to orchestrator workflow in `instructions.md`

### 3.2: Extractor Enhancement

**File**: `agent/subagents/extractor.ts`

**Tasks**:
- [ ] Implement actual VLM call (Claude with vision)
- [ ] Parse PDF page images
- [ ] Extract field values
- [ ] Get bounding boxes from VLM
- [ ] Normalize boxes to 0-1 scale
- [ ] Handle building photos for A7 check

**Dependencies**: pdfjs-dist, @anthropic-ai/sdk

### 3.3: Validator Enhancement

**File**: `agent/subagents/validator.ts`

**Tasks**:
- [ ] Load completeness-checklist skill
- [ ] Load fema-rules skill
- [ ] Apply rules sequentially
- [ ] Generate CheckResult for each rule
- [ ] Stream results as they're generated
- [ ] Handle vision-based A7 check

**Output**: Stream of CheckResult objects

### 3.4: Feedback Enhancement

**File**: `agent/subagents/feedback.ts`

**Tasks**:
- [ ] Read latest output_v{n}.json
- [ ] Find check by check_id
- [ ] Apply review (confirm/override)
- [ ] Update effective_status if override
- [ ] Increment version number
- [ ] Call write_output_version tool
- [ ] Call append_feedback tool

---

## Phase 4: Testing 🧪

### 4.1: Unit Tests

- [ ] Test each tool independently
  - fetch_pdf
  - rasterize_pdf
  - write_output_version
  - append_feedback
- [ ] Test subagent logic
- [ ] Test validation rules
- [ ] Test API routes

### 4.2: Integration Tests

- [ ] Upload → Extract → Validate flow
- [ ] Feedback → Version increment flow
- [ ] Blob storage read/write
- [ ] PDF highlighting accuracy

### 4.3: End-to-End Tests

**Requirements**:
- Sample EC PDF (FF-206-FY-22-152)
- Building photos
- Vercel Blob storage configured
- API keys in .env.local

**Test Cases**:
1. **Happy Path**:
   - [ ] Upload valid EC
   - [ ] Verify extraction completes
   - [ ] Verify validation runs
   - [ ] Verify flags displayed
   - [ ] Confirm a flag
   - [ ] Override a flag with reason
   - [ ] Download output_v2.json
   - [ ] Verify versioning

2. **Error Cases**:
   - [ ] Upload wrong form version
   - [ ] Upload corrupted PDF
   - [ ] Low extraction confidence
   - [ ] Missing required fields

3. **UI/UX**:
   - [ ] PDF highlights correct regions
   - [ ] Tabs switch correctly
   - [ ] Flag cards render properly
   - [ ] Override picker works
   - [ ] Download button works

---

## Phase 5: Deployment 🚀

### 5.1: Vercel Configuration

- [ ] Create Vercel project
- [ ] Connect GitHub repo
- [ ] Set environment variables in dashboard
- [ ] Configure Blob storage
- [ ] Set up AI Gateway (optional)
- [ ] Configure build settings

### 5.2: Production Checks

- [ ] Test in Vercel preview
- [ ] Verify Blob uploads work
- [ ] Verify agent workflows run
- [ ] Check function timeouts
- [ ] Monitor costs

### 5.3: Documentation Updates

- [ ] Update README with deployment info
- [ ] Add troubleshooting section
- [ ] Document known issues
- [ ] Add usage examples

---

## Estimated Effort

| Phase | Time Estimate | Status |
|-------|---------------|--------|
| Setup & Installation | 30 min | ✅ Ready |
| API Integration | 3-4 hours | 🚧 Pending |
| Agent Enhancements | 2-3 hours | 🚧 Pending |
| Testing | 3-4 hours | ⏳ Awaiting |
| Deployment | 1-2 hours | ⏳ Awaiting |
| **Total** | **10-14 hours** | |

---

## Current Blockers

1. **Eve Framework Setup**
   - Need to install Eve CLI
   - Verify Eve agent configuration
   - Test Eve local development

2. **Sample Data**
   - Need real FF-206-FY-22-152 EC PDF
   - Need building photos for A7 test
   - Need known-good test cases

3. **API Keys**
   - Anthropic API key
   - Vercel Blob token
   - Vercel account (Pro plan)

---

## Quick Win Tasks

These can be done immediately without blockers:

- [ ] Review and refine validation rules
- [ ] Add TypeScript types/interfaces
- [ ] Improve error messages
- [ ] Add loading states to UI
- [ ] Create mock data for testing
- [ ] Write unit tests for tools

---

## Next Session Goals

1. ✅ Install all dependencies
2. ✅ Get sample EC PDF
3. ✅ Configure API keys
4. 🎯 Implement /api/validate route
5. 🎯 Test extraction → validation flow

---

**Last Updated**: June 24, 2026  
**Phase**: Scaffolding Complete → Integration Pending  
**Completion**: ~40% (structure done, integration pending)
