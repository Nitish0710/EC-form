# EC Validator - Testing Guide

## Quick Test (No Dependencies Required)

You can test the UI structure right now without installing dependencies:

### Visual Structure Test
1. Open files in editor to verify:
   - `web/app/page.tsx` - Main app logic ✅
   - `web/components/PdfPanel.tsx` - PDF viewer ✅
   - `web/components/ResultsPanel.tsx` - Results display ✅
   - `web/components/FlagCard.tsx` - Flag review UI ✅
   - `web/app/api/validate/route.ts` - Validation API ✅
   - `web/app/api/feedback/route.ts` - Feedback API ✅
   - `web/app/api/upload/route.ts` - Upload API ✅

## Full Testing Workflow

### Phase 1: Installation & Setup (15-20 minutes)

#### Step 1: Install Dependencies
```bash
cd "d:\EC Form\ec-validator-new"

# Option A: Use setup script
.\setup.ps1

# Option B: Manual installation
cd agent
npm install
cd ..\web
npm install
cd ..
```

**Expected Result**: No errors, all packages installed

#### Step 2: Configure Environment
```bash
# Copy example environment file
copy .env.example .env.local

# Edit .env.local with your keys
# BLOB_READ_WRITE_TOKEN=<get from vercel.com>
# ANTHROPIC_API_KEY=<your claude key>
```

**Where to get keys**:
- Vercel Blob: https://vercel.com/dashboard → Storage → Blob → Create Token
- Anthropic: https://console.anthropic.com/ → API Keys

#### Step 3: Start Development Servers
```bash
# Terminal 1 - Agent
cd "d:\EC Form\ec-validator-new\agent"
npm run dev

# Terminal 2 - Web
cd "d:\EC Form\ec-validator-new\web"
npm run dev
```

**Expected Result**:
- Agent: Server running (or Eve not installed message)
- Web: Next.js server at http://localhost:3000

---

### Phase 2: Mock Integration Testing (30 minutes)

This tests the frontend and API with mock data (no Eve agent required yet).

#### Test 1: UI Loads
```
✅ Open http://localhost:3000
✅ See header with "EC.Validator"
✅ See "Upload EC" button
✅ See empty PDF panel (left)
✅ See empty results panel (right)
```

#### Test 2: File Upload
```
✅ Click "Upload EC" button
✅ Select any PDF file
✅ See "Uploading..." status
✅ See loading overlay with spinner
✅ Upload completes → Overlay disappears
```

**Expected Flow**:
1. File selected
2. Validation check (PDF type, size)
3. Upload to Blob (or mock)
4. Validation triggered
5. Mock results displayed

#### Test 3: Validation Results Display
```
✅ After upload, see results in right panel
✅ See "Validation Results" header
✅ See version number (v1)
✅ See tabs: "checks", "flags", "pass", "N/A"
✅ See 3 sample checks (2 PASS, 1 FLAG)
```

**Mock Data Check**:
- P2: Form Version (PASS)
- A1: Building Owner Name (PASS)
- X3: Freeboard Check (FLAG)

#### Test 4: Flag Card Interaction
```
✅ Click on flag card
✅ See found/expected comparison
✅ See confidence indicator
✅ See "Confirm flag" button
✅ See "Override" button
```

#### Test 5: Confirm Action
```
✅ Click "Confirm flag"
✅ Button text changes to "Confirmed"
✅ Card styling changes (green border)
✅ Version increments to v2
✅ Download button updates
```

#### Test 6: Override Action
```
✅ Click "Override" button
✅ Override picker expands
✅ See 4 reason options
✅ Select a reason
✅ Type optional comment
✅ Click "Submit Override"
✅ Card styling changes (teal border)
✅ Version increments to v3
```

#### Test 7: Tab Switching
```
✅ Click "flags" tab → See only FLAG checks
✅ Click "pass" tab → See only PASS checks
✅ Click "N/A" tab → See empty (no N/A in mock)
✅ Click "checks" tab → See all checks
```

#### Test 8: Error Handling
```
✅ Upload non-PDF file → See error banner
✅ Upload file > 25MB → See error banner
✅ Click × to dismiss error
```

#### Test 9: Loading States
```
✅ During upload → Button shows "Uploading..."
✅ During validation → Button shows "Validating..."
✅ During feedback → See overlay spinner
✅ After complete → Button returns to "Upload EC"
```

---

### Phase 3: API Testing (No Browser)

Test API endpoints directly:

#### Test Validate Endpoint
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"blobUrl":"https://example.com/test.pdf","ecId":"test_123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "ecId": "test_123",
  "formVersion": "FF-206-FY-22-152",
  "extractionConfidence": 0.94,
  "checks": [ /* array */ ],
  "outputVersion": 1,
  "downloadUrl": "https://..."
}
```

#### Test Feedback Endpoint
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "ecId":"test_123",
    "checkId":"X3",
    "action":"override",
    "reasonCode":"exception",
    "comment":"Test override",
    "currentVersion":1
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "ecId": "test_123",
  "checkId": "X3",
  "action": "override",
  "newVersion": 2,
  "downloadUrl": "https://..."
}
```

---

### Phase 4: Integration Issues Checklist

If tests fail, check:

#### Frontend Won't Start
```
❌ Error: Cannot find module 'next'
→ Solution: cd web && npm install

❌ Error: Module not found: Can't resolve '@/components/...'
→ Solution: Check tsconfig.json paths configuration

❌ Port 3000 already in use
→ Solution: Use PORT=3001 npm run dev
```

#### API Errors
```
❌ 404 on /api/validate
→ Solution: Check route.ts file exists in app/api/validate/

❌ 500 Internal Server Error
→ Solution: Check server console for detailed error

❌ CORS errors
→ Solution: Shouldn't occur (same origin), check network tab
```

#### Upload Issues
```
❌ Blob upload fails
→ Solution: Check BLOB_READ_WRITE_TOKEN in .env.local

❌ File validation fails
→ Solution: Ensure file is PDF and < 25MB

❌ Upload succeeds but validation doesn't trigger
→ Solution: Check console for JavaScript errors
```

#### UI Issues
```
❌ Components not rendering
→ Solution: Check React DevTools for component errors

❌ Styling broken
→ Solution: Ensure Tailwind CSS is configured

❌ PDF panel empty
→ Solution: Check pdfUrl state, verify Blob URL
```

---

### Phase 5: Eve Integration Testing (Future)

Once Eve agent is integrated:

#### Real Extraction Test
```
✅ Upload FF-206-FY-22-152 EC PDF
✅ Verify all fields extracted
✅ Check bounding boxes accuracy
✅ Verify extraction confidence score
```

#### Real Validation Test
```
✅ Run all completeness checks
✅ Run all FEMA rule checks
✅ Verify flag accuracy
✅ Test vision-based diagram check (A7)
```

#### Real Feedback Test
```
✅ Confirm flag → Real output_v2.json created
✅ Override flag → Real output_v2.json created
✅ Download JSON → Verify content
✅ Check feedback-log.json → Verify append
```

---

## Test Data

### Sample EC Data (for reference)
```json
{
  "A1": "Robert T. Calloway",
  "A2": "6 Scotch Bonnet Lane, Wrightsville Beach, NC 28480",
  "B8": "VE",
  "B9": "12.00 ft NAVD 88",
  "C2a": "11.20 ft NAVD 88"
}
```

### Expected Flags (on sample data)
1. **A7**: Building Diagram (vision mismatch)
2. **C2c**: Bottom of LSM (required but blank)
3. **D3**: M&E Documentation Missing
4. **X3**: Freeboard (0.80 ft below BFE)

---

## Troubleshooting

### Common Issues

#### "Eve not found"
Agent won't run because Eve CLI not installed.
```bash
npm install -g @vercel/eve
```

#### "Module not found"
Dependencies not installed.
```bash
cd agent && npm install
cd ../web && npm install
```

#### "Blob upload fails"
Token not configured or invalid.
- Check .env.local
- Verify token at vercel.com
- Ensure token has read/write permissions

#### "PDF won't render"
react-pdf worker not loaded.
- Check browser console for worker errors
- Verify CDN URL in PdfPanel.tsx
- Try different PDF (some are malformed)

#### "TypeScript errors"
Type mismatches.
- Run: `npx tsc --noEmit`
- Fix reported errors
- Restart dev server

---

## Success Criteria

### Mock Testing Success ✅
- [ ] UI loads without errors
- [ ] Upload triggers workflow
- [ ] Mock results display
- [ ] Tabs switch correctly
- [ ] Flag actions work
- [ ] Version increments
- [ ] Error handling works
- [ ] Loading states show

### Eve Integration Success (Future)
- [ ] Real extraction works
- [ ] Bounding boxes accurate
- [ ] All rules validate
- [ ] Feedback creates versions
- [ ] Files persist to Blob
- [ ] Download works

---

**Testing Status**: Mock tests ready ✅  
**Next**: Install dependencies and run Phase 2 tests  
**Created**: June 24, 2026
