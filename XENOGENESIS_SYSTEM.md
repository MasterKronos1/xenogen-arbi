# XenoGenesis System Document
**Living Document — Last Updated:** March 2026  
**Maintained by:** Master Kronos + ARBI  
**Version:** 1.0.0  
**Status:** Active Development — Proof of Concept Phase

---

> This document is the single source of truth for the XenoGenesis ecosystem. It is read by ARBI, maintained by the builder, and used to brief collaborators. Update it when anything changes. ARBI can generate a briefing from it on demand.

---

## 1. Mission

XenoGenesis is a digital pathway system for economic inclusion in Johannesburg/Gauteng, South Africa, first to establish the proof of concept of the system and then it will be implemented globally to the requisite communities and systems. It meets people where they are — whether that's no income, informal work, or employment — and guides them through a structured set of platforms toward economic sovereignty.

**The core belief:** Most people in the informal economy have real skills, real ambition, and real constraints. The system failed them. XenoGenesis builds the infrastructure to fix that and .

---

## 2. Architecture Overview

```
USER
  │
  ▼
ARBI (xenogen-arbi.vercel.app)
  │  Central intelligence, memory, pathway guide
  │  Coordinates all platforms
  │  Remembers every user across sessions
  │
  ├── GroundZero      Layer 1 — Basic needs, shelter, food
  ├── BTU             Layer 2 — Civic access, SASSA, grants
  ├── XenoGen Skills  Layer 3 — Education, upskilling
  ├── Guuz            Layer 4 — Marketplace, first income [planned]
  ├── XenoGen Profile Layer 5 — Sovereign credential [planned]
  └── Career Engine   Layer 6 — Employment, entrepreneurship [planned]

INFRASTRUCTURE
  ├── Supabase        Database, auth, realtime
  ├── Vercel          Hosting (all platforms)
  ├── Groq            LLM inference (free tier)
  └── Pollinations    Image generation (free, no key)
```

---

## 3. Division Registry

### 3.1 ARBI — Central Intelligence
| Field | Value |
|---|---|
| **Status** | ✅ Active |
| **URL** | https://xenogen-arbi.vercel.app |
| **Repo** | MasterKronos1/xenogen-arbi |
| **Stack** | Next.js 16, Groq, Supabase, Vercel |
| **Branch** | main → auto-deploys to Vercel |
| **Owner** | Master Kronos |

**Capabilities (live):**
- User authentication (Google OAuth + Magic Link)
- Persistent memory per user across sessions
- Pathway guidance (XenoGuide mode)
- General intelligence (Open mode)
- Multi-agent pipeline (Analyst → Navigator → Synthesizer)
- Image generation via Pollinations
- File upload + analysis (images, PDFs, CSVs, docs)
- Text-to-speech readback
- Code generation + sandboxed execution
- Admin control plane at /admin
- Guuz scaffold at /guuz

**Key files:**
```
app/
  page.tsx              Main chat UI
  admin/page.tsx        Control plane (admin only)
  guuz/page.tsx         Guuz scaffold
  onboarding/page.tsx   New user onboarding
  auth/page.tsx         Sign in
  auth/exchange/        OAuth callback handler
  api/
    chat/route.ts       ARBI conversation engine
    agents/route.ts     Multi-agent pipeline
    analyze/route.ts    File analysis
    generate/route.ts   Image generation
    execute/route.ts    Code execution
    system/route.ts     Ecosystem state
    briefing/route.ts   System briefing [planned]
lib/
  user.ts               User service layer
  auth.ts               Auth helpers
  ecosystem.ts          Ecosystem registry
  supabase.ts           Singleton Supabase client
  adapters/
    storage.ts          Storage adapter interface
    supabase-adapter.ts Supabase implementation
config/
  registry.json         Ecosystem seed data
```

**Environment variables required:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
GROQ_API_KEY
```

---

### 3.2 GroundZero — Basic Needs
| Field | Value |
|---|---|
| **Status** | ✅ Active (MVP) |
| **URL** | https://gzbnos.vercel.app |
| **Repo** | TBD |
| **Layer** | 1 |
| **Integration** | ARBI links users here from pathway |

**Purpose:** First port of call for users with immediate basic needs — shelter, food, emergency support. Connects to local resources in Johannesburg/Gauteng.

**Integration with ARBI:** ARBI detects GroundZero-stage users and surfaces this platform. URL in pathway sidebar.

**Current state:** MVP with mock data. Needs real resource database.

**Next steps:**
- [ ] Connect to real shelter/food resource database
- [ ] Add ARBI widget for in-platform guidance
- [ ] Share user session with ARBI via Supabase user ID

---

### 3.3 BTU — Civic Access
| Field | Value |
|---|---|
| **Status** | ✅ Active (MVP) |
| **URL** | https://btu-two.vercel.app |
| **Repo** | TBD |
| **Layer** | 2 |
| **Integration** | ARBI links users here from pathway |

**Purpose:** Navigate SASSA grants, government programs, civic documentation. Demystifies the bureaucracy for people who've been failed by these systems.

**Integration with ARBI:** ARBI detects grant/SASSA interest via memory tags and routes users here.

**Current state:** MVP. Needs live SASSA data and form navigation.

**Next steps:**
- [ ] Live SASSA eligibility checker
- [ ] Document checklist generator
- [ ] ARBI embedded for guided navigation

---

### 3.4 XenoGen Skills — Education
| Field | Value |
|---|---|
| **Status** | ✅ Active (MVP) |
| **URL** | https://xenogen-skills.vercel.app |
| **Repo** | TBD |
| **Layer** | 3 |
| **Integration** | ARBI links users here from pathway |

**Purpose:** Skills learning pathways. Connects people with the right learning tracks based on their situation and goals.

**Integration with ARBI:** ARBI routes skill-interested users here. Tracks progress via memory.

**Current state:** MVP. Needs real course content and progress tracking.

**Next steps:**
- [ ] Real course content integration
- [ ] Progress sync with ARBI memory
- [ ] Certificate/completion tracking → XenoGen Profile

---

### 3.5 Guuz — Marketplace
| Field | Value |
|---|---|
| **Status** | 🔧 Scaffold (not yet live) |
| **URL** | /guuz (within ARBI) |
| **Repo** | MasterKronos1/xenogen-arbi |
| **Layer** | 4 |

**Purpose:** First income layer. Informal economy marketplace where users list skills and services. No CVs, no gatekeepers.

**Current state:** Landing/waitlist page at /guuz within ARBI. Core marketplace not yet built.

**Next steps:**
- [ ] Separate Vercel deployment
- [ ] Listing creation (name, skill, rate, location)
- [ ] Basic search and browse
- [ ] ARBI-guided matching
- [ ] First transaction flow

---

### 3.6 XenoGen Profile — Sovereign Credential
| Field | Value |
|---|---|
| **Status** | 📋 Planned |
| **URL** | TBD |
| **Repo** | TBD |
| **Layer** | 5 |

**Purpose:** Portable verified identity built from real work history. Replaces the CV for people without formal credentials.

**Next steps:**
- [ ] Define credential schema
- [ ] Connect to Skills completion + Guuz transactions
- [ ] Verification mechanism
- [ ] Export/share capability

---

### 3.7 Career Engine — Employment
| Field | Value |
|---|---|
| **Status** | 📋 Planned |
| **URL** | TBD |
| **Repo** | TBD |
| **Layer** | 6 |

**Purpose:** Job matching and entrepreneurship support. Uses XenoGen Profile as the credential input.

---

## 4. Database Schema (Supabase)

**Project:** ocwxyhgcgegdiigpxytc  
**Region:** eu-west-2 (London — closest to Johannesburg)

### Tables

```sql
public.users
  id          text PRIMARY KEY    -- Supabase auth user UUID as text
  name        text
  location    text
  stage       text DEFAULT 'groundzero'
  created_at  timestamptz

public.conversations
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     text REFERENCES users(id)
  title       text
  mode        text DEFAULT 'xeno'
  created_at  timestamptz

public.messages
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  conv_id     uuid REFERENCES conversations(id)
  role        text                -- 'user' | 'assistant'
  content     text
  created_at  timestamptz

public.arbi_memory
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     text
  key         text
  value       text
  updated_at  timestamptz
  UNIQUE(user_id, key)

public.observation_log
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     text
  key         text
  value       text
  source      text DEFAULT 'arbi_conversation'
  created_at  timestamptz

public.ecosystem_registry     -- [TO BE CREATED — see Section 7]
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  org_id      text UNIQUE
  name        text
  description text
  status      text
  url         text
  repo        text
  platform    text
  services    jsonb
  last_checked timestamptz
  updated_at  timestamptz
```

### RLS Policies (active)
- users: select/insert/update own row only
- conversations: select/insert own conversations
- messages: select/insert via own conversations
- arbi_memory: select/insert/update own memory
- observation_log: insert own logs

---

## 5. Integration Architecture

### How platforms connect to ARBI

Currently: ARBI links OUT to platforms via URLs in the sidebar and pathway.

**Target architecture (next phase):**
```
Platform → Supabase (shared user ID) → ARBI reads context
ARBI → Platform API → executes actions on behalf of user
```

### Shared session model
All platforms should use the same Supabase project. When a user authenticates on any platform with the same email, they get the same `user_id`. ARBI then has context from all platforms.

### ARBI embed pattern (planned)
Any platform can embed ARBI as a widget:
```html
<script src="https://xenogen-arbi.vercel.app/embed.js"
  data-user-id="..." data-context="skills">
</script>
```

---

## 6. Operational Runbook

### Deploying ARBI changes
1. Make changes to `main` branch
2. Push to GitHub
3. Vercel auto-deploys (watch build logs)
4. Check Vercel dashboard for errors
5. Test auth flow after any auth-related changes

### Adding a new environment variable
1. Add to Vercel → Project Settings → Environment Variables
2. Add to this document (Section 3.1)
3. Add to `.env.local` for local development
4. Redeploy

### Checking system health
- Visit `/api/system` — returns ecosystem registry state
- Visit `/admin` — full control plane with user/conversation/memory counts
- Check Supabase dashboard for DB health

### Debugging auth issues
1. Check browser DevTools → Application → Local Storage for `sb-*` key
2. Check Supabase → Authentication → Users for session
3. Check browser console for specific error
4. Common fix: clear localStorage and re-authenticate

### Adding a new division
1. Build the platform (separate Vercel deployment)
2. Add entry to `config/registry.json`
3. Add entry to `ecosystem_registry` Supabase table
4. Add URL to ARBI's system prompt in `app/api/chat/route.ts`
5. Add pathway stage if applicable in `lib/user.ts` STAGE_ORDER
6. Update this document

---

## 7. Migration & Portability

### Current platform: Vercel (free tier)
**Limits:**
- 100GB bandwidth/month
- Serverless functions (no persistent compute)
- 12 deployments/day on free tier

**Migration targets when needed:**
- Railway — simple, generous free tier, persistent compute
- Fly.io — edge deployment, good for latency
- Self-hosted VPS — full control, requires DevOps

### Migration checklist
- [ ] All DB calls go through `lib/adapters/supabase-adapter.ts` ✅
- [ ] No hardcoded URLs (use env vars) ✅
- [ ] Storage adapter interface defined ✅
- [ ] `NEXT_PUBLIC_APP_URL` env var controls redirect URLs ✅
- [ ] Registry is data-driven not hardcoded ✅
- [ ] Auth uses Supabase (portable across any host) ✅

### To migrate to a new host:
1. Copy env vars to new platform
2. Update `NEXT_PUBLIC_APP_URL`
3. Update Supabase redirect URLs
4. Update Google OAuth authorized origins
5. Deploy — nothing else should change

---

## 8. ARBI System Prompt Reference

ARBI's core identity and pathway knowledge lives in `app/api/chat/route.ts`.

**Key components:**
- Voice and personality definition
- Pathway layer descriptions with URLs
- Stage progression rules (`[STAGE_UPDATE: stage_id]`)
- Image generation trigger (`[GENERATE_IMAGE: prompt]`)
- Ecosystem state injected at runtime from `/api/system`
- User memory injected from `arbi_memory` table
- Recent conversation history for continuity

---

## 9. Open Items & Next Steps

### Immediate (this phase)
- [ ] Move ecosystem registry from JSON → Supabase table
- [ ] Build `/api/briefing` endpoint
- [ ] Fix Pollinations image generation reliability
- [ ] Add Whisper audio transcription
- [ ] Mobile UX polish pass
- [ ] Real conversation history loading when tapping sidebar items

### Near term (next 2-3 sessions)
- [ ] Guuz marketplace proper build (separate deployment)
- [ ] ARBI embed widget for other platforms
- [ ] Scheduled agent tasks (job scout, grant checker)
- [ ] XenoGen Profile scaffold
- [ ] Engineer Collab version port

### Architecture evolution
- [ ] Move ecosystem_registry to Supabase (live state)
- [ ] Platform health monitoring (ping each URL, record status)
- [ ] ARBI self-update capability (staging branch → test → PR)
- [ ] Cross-platform user session (shared Supabase project)
- [ ] WhatsApp integration (Twilio or unofficial API)

### Known issues
- Pollinations image generation intermittently fails (free tier load)
- Audio file analysis needs Whisper integration
- Onboarding stage mapping needs validation
- Admin dashboard only shows current user's data due to RLS

---

## 10. Collaboration & Handoff Protocol

### When onboarding a collaborator on a division:
1. Share this document
2. Grant access to relevant Vercel project
3. Grant read access to Supabase dashboard
4. Ask ARBI: *"Brief me on the [division name] division"* — she will generate a context briefing
5. Division-specific README in that repo covers the specifics

### Access control
| Resource | Who has access |
|---|---|
| Supabase project | Master Kronos |
| Vercel (ARBI) | Master Kronos |
| GitHub repos | Master Kronos |
| Admin dashboard | nathimthunzini@gmail.com only |

### Asking ARBI about the system
ARBI can answer:
- "What's the current state of the ecosystem?"
- "Brief me on [division]"
- "What are the open items for [platform]?"
- "How many users have reached [stage]?"
- "What does [user] need next?"

---

## 11. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | March 2026 | Initial system document — base infrastructure complete |

---

*This document is maintained by Master Kronos and ARBI. When in doubt, ask ARBI.*
