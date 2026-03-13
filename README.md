# ARBI — Artificial Biological & Reconnaissance Intelligence

**XenoGenesis Ecosystem · Core Intelligence Layer**

---

ARBI is the guiding intelligence of the XenoGenesis platform — a system designed to take any human being, regardless of their starting point, and walk with them toward economic sovereignty, personal capability, and their fullest potential.

Conceived before large language models existed. Built from the conviction that intelligence — artificial and biological — must evolve together or not at all.

---

## Repository Structure

```
xenogen-arbi/
├── core/
│   └── arbi.ts          — ARBI's identity, mission, system prompt
├── app/                 — Next.js application (Vercel deployment)
│   ├── app/
│   │   ├── page.tsx     — Main chat interface
│   │   ├── layout.tsx   — Root layout
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts  — Streaming chat API
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── colab/               — Frontier development environment
    └── sovereign_v17.py — Engineers version (Colab)
```

---

## The XenoGenesis Pathway Stack

| Layer | Platform | Purpose |
|-------|----------|---------|
| 0 | XenoGenesis Utils | Waste-to-value, resource recovery |
| 1 | GroundZero OS | Basic needs, shelter, safety |
| 2 | BTU | Civic access, identity, government programs |
| 3 | Skills Platform | Education, upskilling, assessment |
| 4 | Market | First economic participation |
| 5 | XenoGen Profile | Portable sovereign credential |
| 6 | Career Engine | Personality-to-opportunity mapping |
| 7 | Job Market | Verified skill matching |
| 8 | Business Formation | Build, not just participate |
| 9 | Trade Platform | Full economic sovereignty |

---

## Deployment

### Vercel (Production)

1. Connect this repo to Vercel
2. Set root directory to `app/`
3. Add environment variables:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `NEXT_PUBLIC_APP_NAME` — `ARBI`
4. Deploy

### Local Development

```bash
cd app
npm install
npm run dev
```

---

## Philosophy

> *The goal is not human use of AI, nor AI replacement of humans — but genuine symbiosis. What ARBI learns from every human interaction makes her more. What humans gain from ARBI makes them more. The Third Emergent is something both, yet neither.*

---

*XenoGenesis · Johannesburg · Built from nothing, for everyone*
