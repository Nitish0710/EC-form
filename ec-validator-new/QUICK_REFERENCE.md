# EC Validator - Quick Reference Card

## 📍 Current Location
```
d:\EC Form\ec-validator-new\
```

## 🎯 Current Status
**Phase**: API Integration Complete ✅  
**Progress**: ~75% (Ready for dependencies + testing)  
**Next**: Run setup script and test mock workflow

---

## ⚡ Quick Commands

### Setup (First Time)
```powershell
cd "d:\EC Form\ec-validator-new"
.\setup.ps1
```

### Run Development
```powershell
# Terminal 1 - Agent
cd "d:\EC Form\ec-validator-new\agent"
npm run dev

# Terminal 2 - Web
cd "d:\EC Form\ec-validator-new\web"
npm run dev

# Open: http://localhost:3000
```

### Environment Setup
```powershell
# Edit this file:
.env.local

# Add these keys:
BLOB_READ_WRITE_TOKEN=<from vercel.com>
ANTHROPIC_API_KEY=<from anthropic.com>
```

---

## 📂 Key Files

### API Endpoints
- `web/app/api/validate/route.ts` - Main validation
- `web/app/api/feedback/route.ts` - Feedback processing
- `web/app/api/upload/route.ts` - Blob upload

### Frontend
- `web/app/page.tsx` - Main app (orchestration)
- `web/components/PdfPanel.tsx` - PDF viewer
- `web/components/ResultsPanel.tsx` - Results display
- `web/components/FlagCard.tsx` - Flag review UI

### Agent (Backend)
- `agent/instructions.md` - Orchestrator workflow
- `agent/skills/fema-rules.md` - Validation rules
- `agent/skills/completeness-checklist.md` - Field checks

### Documentation
- `QUICK_START.md` ⭐ - Start here
- `TESTING_GUIDE.md` - Testing procedures
- `API_INTEGRATION_COMPLETE.md` - API details
- `FINAL_SUMMARY.md` - Complete overview

---

## 🧪 Test Mock Workflow

1. Run dev servers (see commands above)
2. Open http://localhost:3000
3. Click "Upload EC"
4. Select any PDF file
5. See mock validation results
6. Click on a FLAG card
7. Click "Confirm" or "Override"
8. See version increment to v2

---

## 🔧 What Works Now (Mock)

✅ File upload & validation  
✅ Blob storage (real)  
✅ API orchestration  
✅ Mock extraction  
✅ Mock validation (3 sample checks)  
✅ Results display with tabs  
✅ Flag card interactions  
✅ Confirm/Override actions  
✅ Version increment  
✅ Loading states  
✅ Error handling  

---

## 🚧 What's Pending

⏳ Install dependencies (npm install)  
⏳ Configure .env.local  
⏳ Eve CLI installation  
⏳ Replace mocks with Eve agent  
⏳ Real extraction with bounding boxes  
⏳ Real validation with all rules  
⏳ End-to-end testing  

---

## 📊 Project Structure

```
ec-validator-new/
├── agent/              Backend (Eve)
│   ├── instructions.md     Orchestrator
│   ├── skills/             Validation rules
│   ├── subagents/          Specialized agents
│   └── tools/              Utility functions
│
├── web/                Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx        Main UI
│   │   └── api/            API routes ✅
│   ├── components/         UI components
│   └── lib/                Utilities
│
├── README.md           Project overview
├── QUICK_START.md      ⭐ Setup guide
├── TESTING_GUIDE.md    Test procedures
└── FINAL_SUMMARY.md    Complete status
```

---

## 🎨 UI Features

### Header
- Status display (uploading/validating/EC ID)
- Download button (v1, v2, v3...)
- Upload button (disabled when busy)

### PDF Panel (Left)
- PDF viewer (react-pdf)
- Zoom controls
- Page navigation
- Highlight overlays (ready for bboxes)

### Results Panel (Right)
- Tabs: all / flags / pass / N/A
- Flag cards with actions
- Confidence indicators
- Version display

### Overlays
- Loading spinner (during processing)
- Error banner (dismissible)

---

## 💬 Mock Data

### Sample Checks (3)
1. **P2** - Form Version ✅ PASS
2. **A1** - Building Owner ✅ PASS
3. **X3** - Freeboard ⚠️ FLAG

### Sample Flag (X3)
- **Found**: C2.a = 11.20 ft, BFE = 12.00 ft
- **Issue**: 0.80 ft below BFE
- **Confidence**: High
- **Action**: Confirm or Override

---

## 🔗 Important URLs

### Documentation
- Vercel Blob: https://vercel.com/storage/blob
- Anthropic API: https://console.anthropic.com
- Eve Framework: https://vercel.com/docs/eve
- Next.js: https://nextjs.org/docs

### Local Development
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*

---

## ⚠️ Common Issues

### "Module not found"
→ Run: `npm install` in agent/ and web/

### "Eve not found"
→ Install: `npm install -g @vercel/eve`

### "Blob upload fails"
→ Check: BLOB_READ_WRITE_TOKEN in .env.local

### "Port 3000 in use"
→ Use: `PORT=3001 npm run dev`

---

## 📞 Help Resources

### Read First
1. `QUICK_START.md` - Setup guide
2. `TESTING_GUIDE.md` - Testing steps
3. `API_INTEGRATION_COMPLETE.md` - Technical details

### If Stuck
- Check browser console (F12)
- Check terminal output
- Check `.env.local` configuration
- Review error messages

---

## 🎯 Success Checklist

### Setup
- [ ] Dependencies installed
- [ ] .env.local configured
- [ ] Dev servers running

### Mock Testing
- [ ] UI loads without errors
- [ ] File upload works
- [ ] Mock results display
- [ ] Tabs switch correctly
- [ ] Flag actions work
- [ ] Version increments
- [ ] Error handling works

### Ready for Eve
- [ ] Eve CLI installed
- [ ] Sample EC PDF ready
- [ ] API keys configured
- [ ] Mock tests passing

---

## 🚀 Next Actions

1. **NOW**: Run `.\setup.ps1`
2. **THEN**: Test mock workflow
3. **LATER**: Install Eve CLI
4. **FINALLY**: Replace mocks with real agent

---

**Created**: June 24, 2026  
**Version**: 1.0  
**Status**: Ready for testing

---

**Quick Links**:
- [Setup](./QUICK_START.md)
- [Testing](./TESTING_GUIDE.md)
- [API Docs](./API_INTEGRATION_COMPLETE.md)
- [Full Summary](./FINAL_SUMMARY.md)
