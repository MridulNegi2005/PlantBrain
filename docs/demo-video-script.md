# PlantBrain AI — Demo Video Run-of-Show (NO VOICEOVER)

A silent screen recording. **On-screen text captions carry the story** — no narration.
Target length **~2:00–2:30**. Add soft royalty-free background music (calm, techy).

**Record against the live app:** https://plantbrain-production.up.railway.app
**Hero asset:** P-204A (Boiler Feed Pump) · **Compliance asset:** V-301 (Pressure Vessel)

---

## Before you hit record (demo-safety)
1. **Pre-warm the backend** — open the live app and click around once. The first request after
   idle is slow (hosted DB cold start). Do a full dry run of the whole flow before recording.
2. Set browser zoom ~110–125% and use a clean full-screen window (hide bookmarks bar, close other tabs).
3. Have the two questions copy-pasteable so typing is clean (or paste them):
   - Hero: `Why did P-204A fail twice this month, and is there a compliance issue with how it was closed out?`
   - Refusal: `What is the share price of the plant?`
4. Record at 1080p. Move the mouse slowly and deliberately — the mouse is the "narrator."
5. Keep each caption on screen ~2.5–3s so it's readable.

---

## Shot list

### 0:00–0:08 — Opening title card
- **Full-screen text card** (black bg, ember accent), then fade to the app:
  > **PlantBrain AI**
  > The missing memory layer for industrial operations.
- Cut to the **Overview / dashboard** page.
- **Caption (bottom):** *"A plant runs 7–12 disconnected document systems. This is all of them, connected."*
- Let the stat tiles animate in. Mouse gestures across: **53 documents · 5 equipment · open risks · compliance gaps.**

### 0:08–0:16 — The setup
- Slowly hover the sidebar nav so the range is visible (Overview, Ask a question, Connections, Diagnose, Compliance, Accuracy…).
- **Caption:** *"Ask anything in plain English. Every answer is backed by a real document."*

### 0:16–0:55 — THE HERO MOMENT (the whole demo hinges on this)
- Click **Ask a question**.
- Make sure scope shows **P-204A**.
- **Type (visibly) the hero question**, then hit send.
- **Caption while it's thinking:** *"One question. It reads the work order, the incident report, and the compliance record together."*
- When the answer glides in, **slow down**. Let it breathe.
- Mouse-highlight each part, one at a time, with a caption per element:
  - The answer text → **Caption:** *"A direct answer — fused from multiple documents."*
  - The **citations** (click to open the evidence panel) → **Caption:** *"Every claim cites the exact document and page."*
  - **Confidence** score → **Caption:** *"It tells you how sure it is."*
  - **"What's still missing"** → **Caption:** *"…and what it couldn't find."*
  - **Recommended actions** → **Caption:** *"…and what to do next."*
- **Big caption (hold 3s):** *"An answer no single system in the plant could give."*

### 0:55–1:08 — Proof it isn't guessing (the guardrail)
- Ask the **refusal question**: `What is the share price of the plant?`
- It refuses.
- **Caption:** *"No source, no answer. It refuses to guess — that's the guardrail."*

### 1:08–1:28 — The connections (GraphRAG)
- Click **Connections**. Load **P-204A**.
- Let the lane diagram render (Equipment → Documents → Failure modes → Components).
- **Click one document card** — watch the ember trail light up its links.
- **Caption:** *"Behind the scenes: a knowledge graph. The copilot walks these links — real multi-hop reasoning, not keyword search."*

### 1:28–1:50 — Business value: Diagnose + Compliance
- Click **Diagnose issue** → it's pre-filled for **P-204A** → hit *Find likely causes*.
- Show the structured causes with evidence + "still worth checking."
- **Caption:** *"Root-cause analysis in seconds — each cause backed by a source."*
- Click **Compliance** → run **V-301**.
- It flags the **missing pressure-test certificate — high risk.**
- **Caption:** *"It catches a missing statutory certificate automatically — before an auditor does."*

### 1:50–2:08 — Prove it works (Evaluation)
- Click **Accuracy**.
- Show the metric tiles.
- **Caption:** *"We measured it. Retrieval 100% · faithfulness 0.82 · relevancy 0.91 · ~4 seconds vs ~12 minutes by hand."*

### 2:08–2:20 — Trust & security (quick)
- Click **Activity log** — scroll the logged actions.
- **Caption:** *"Every action logged. Uploaded documents are scanned for hidden instructions — the AI refuses to obey them."*

### 2:20–2:30 — Closing card
- Fade to a **full-screen text card** (black bg, ember):
  > **PlantBrain AI**
  > Fully cited. On real infrastructure. On-prem ready.
  > **plantbrain-production.up.railway.app**
  > *Mridul Negi · Atishay Jain — ET AI Hackathon 2026*

---

## If something goes wrong mid-record
- **LLM rate-limited (Groq free tier):** the copilot falls back to extractive cited answers — still grounded, still cited. Fine to show.
- **A page is slow:** cut the dead air in editing; keep the video tight.
- **Retrieval misses on an improvised question:** only ask the two scripted questions — they're tuned to hit.

## Editing notes
- This is silent — **captions and pacing are everything.** Bigger text, fewer words, hold long enough to read.
- Keep the ember (#FF6A2A) as the only accent color in captions/cards to match the product.
- A 10–15s tight version (just the hero moment + the metrics + closing card) makes a great social/teaser cut.
