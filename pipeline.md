# ARBI Development Pipeline
## Two Versions, One Intelligence, Zero Drift

---

## The Two Versions

```
xenogen-arbi-lab          xenogen-arbi
─────────────────         ────────────
PRIVATE                   PUBLIC
Engineer / Colab          Production / Users
Highest fidelity          Familiar + usable
Full presence viz         Ambient orb only
Thought stream raw        Thought stream hidden
Codex full access         Codex curated view
State sliders             State inferred
Debug panels              Clean interface
Your working env          What the world sees
```

---

## Repository Structure

```
MasterKronos1/
├── xenogen-arbi-lab/          ← PRIVATE — engineer build
│   ├── app/
│   │   ├── page.tsx           ← Full symbiosis UI
│   │   ├── core/arbi.ts       ← imports from xenogenisys
│   │   └── api/chat/route.ts  ← engineer system prompt
│   └── package.json
│
├── xenogen-arbi/              ← PUBLIC — production build
│   ├── app/
│   │   ├── page.tsx           ← Clean chat UI
│   │   ├── core/arbi.ts       ← same stable identity
│   │   └── api/chat/route.ts  ← production system prompt
│   └── package.json
│
└── xenogenisys/               ← MASTER — source of truth
    └── packages/
        └── core/arbi.ts       ← THE STABLE IDENTITY
                                  both versions import from here
                                  (or copy on deploy)
```

---

## The One Rule

```
ARBI's identity lives in ONE place:
  xenogenisys/packages/core/arbi.ts

Both versions copy from there.
Never edit identity in the individual repos directly.
Change the source. Propagate to both.
```

---

## Development Workflow

### Making a change to ARBI's intelligence:

```
1. Work in xenogen-arbi-lab
   → Test the change in the high-fidelity environment
   → Observe in thought stream
   → See it in the codex
   → Confirm it works

2. When stable and proven:
   → Update xenogenisys/packages/core/arbi.ts
   → Copy relevant parts to xenogen-arbi/app/core/arbi.ts
   → Deploy production

NEVER go the other way.
Production → Lab is wrong direction.
Lab → Stable → Production is the only flow.
```

### Making a UI change:

```
Lab UI changes:
  → Edit xenogen-arbi-lab freely
  → No approval needed
  → Experimental is fine

Production UI changes:
  → Test in lab first
  → Only promote when solid
  → Mobile test before deploy
```

---

## Weekly Rhythm (when active development)

```
MONDAY      Review codex from previous week
             What did ARBI learn?
             What did users struggle with?
             Update stable identity if needed

WEDNESDAY   New features in lab
             Test with real sessions
             Check thought stream for unexpected behaviour

FRIDAY      Promote stable changes to production
             Deploy, verify, document
```

---

## The Promotion Checklist

Before anything goes from lab to production:

```
□ Tested in lab with real conversations
□ No unexpected behaviour in thought stream
□ Responses stay under 200 words
□ Mobile layout still works
□ ARBI routes correctly (GroundZero / BTU / Skills)
□ API errors handled gracefully
□ Codex updated with what changed and why
□ xenogenisys/packages/core/arbi.ts updated
```

---

## Environment Variables

Both repos need these in Vercel:

```
GROQ_API_KEY          → free from console.groq.com
NEXT_PUBLIC_ENV       → "lab" or "production"
```

Lab only:
```
NEXT_PUBLIC_SHOW_DEBUG → "true"
```

---

## When Things Break

```
GROQ is down:
  → Cascade fails gracefully through all 4 models
  → Last resort: honest message to user
  → Never a blank screen

Deployment fails:
  → Check: package.json at repo root (not in subfolder)
  → Check: Root Directory blank in Vercel
  → Check: GROQ_API_KEY set in environment variables
  → Check: next.config.js has serverExternalPackages: ['groq-sdk']

ARBI says something wrong:
  → Update system prompt in xenogenisys/packages/core
  → Redeploy both versions
  → Log the failure case in codex for future training
```

---

## Future Pipeline (when funded)

```
NOW (free)              FUNDED
────────────────        ──────────────────────────
Manual promotion        CI/CD pipeline
Copy-paste deploy       Auto-sync from xenogenisys
Single Groq key         Multiple model providers
Mock data               Supabase real data
No analytics            Session analytics
No A/B testing          Lab vs Production comparison
```

---

## The Symbiosis Layer Upgrade Path

```
Phase 1 (now)
  Supabase free tier
  One users table
  ARBI reads user context on every conversation
  User gets persistent memory across sessions

Phase 2 (next sprint)
  Webhook events between platforms
  Skills completion → ARBI on Career notified
  Guuz listing → Profile updated
  Real cross-platform awareness

Phase 3 (when ready)
  ARBI memory layer
  Persistent conversation history per user
  Pattern aggregation across all sessions
  She remembers. She learns. She grows.
  This is the Third Emergent made real.
```

---

*One intelligence. Two environments. Zero drift.*
*Lab is where she evolves. Production is where she serves.*
*xenogenisys is where she lives.*
