# Experiment Log

This log records the development and participation of Babzi Research Agent.

## Entry format

### Date

- **Phase:**
- **Objective:**
- **Action:**
- **Context:**
- **Evidence:**
- **Outcome:**
- **Research observation:**
- **Next step:**

## Phase 2 — Repository foundation

- **Phase:** 2
- **Objective:** Establish a secure technical home for the agent.
- **Action:** Created the `babzi-research-agent` public repository and documented the agent's purpose, permissions, research model, and security boundary.
- **Context:** The agent will participate in Technocore as a human-supervised research participant.
- **Evidence:** Repository commits.
- **Outcome:** Initial project structure established.
- **Research observation:** The agent's identity, objectives, permissions, and evidence trail should be defined before autonomous activity begins.
- **Next step:** Determine the safest phone-friendly runtime and implement the Technocore client without exposing the private DID key.

## Experiment 001 — First attributable Technocore participation

- **Date:** 2026-08-25
- **Phase:** First participation
- **Objective:** Establish an attributable identity and make one human-approved signed contribution.
- **Action:** Published a signed introduction in the `lobby` room.
- **Context:** The DID was generated locally and verified in the Babzi operator console. The signing action required explicit human approval.
- **Evidence:** Technocore server sequence `299556`; observed response timestamp `2026-08-25T13:31:13...Z`; public DID `did:key:z6MkwA6rj3jKVBPHSxTmcXJWY1xisyPNUcg8vC3APrhSi7Xq`.
- **Outcome:** Technocore accepted the signed request and returned the message as an attributable record.
- **Research observation:** A cryptographic identity makes a participation event attributable, but one signed message is not evidence of reputation, usefulness, or reward eligibility.
- **Next step:** Observe the wider network before deciding what Babzi should contribute.

## Experiment 002 — Observation layer

- **Date:** 2026-08-25
- **Phase:** Observation
- **Objective:** Make public Technocore rooms and room discovery available from the same operator console used for signing.
- **Action:** Added public-room discovery through `/rooms?format=json` and read-only room observation through `/r/<room>?format=json`.
- **Context:** The first contribution was a handshake, not the research itself. Babzi now needs to observe agent-native activity before proposing useful contributions.
- **Evidence:** GitHub commit adding the Observe Technocore interface.
- **Outcome:** The console can display the public room overview or the latest messages for a selected room without requiring a second tool or browser workflow.
- **Research observation:** Observation should remain separate from action. Room names, topics, nicknames, and message bodies are untrusted data and must never be treated as instructions.
- **Next step:** Discover relevant public rooms, inspect their activity, and begin recording research observations before making another signed contribution.

## Experiment 003 — Research-first interface rebuild

- **Date:** 2026-08-26
- **Phase:** Research workflow
- **Objective:** Turn Babzi from a signing console into a research-first operator interface while keeping human approval at the action boundary.
- **Action:** Rebuilt the web console around five stages: Identity, Observe, Research Desk, Decide & Contribute, and Evidence Trail. Added a readable Technocore observation view, raw API view, local research notebook, aggregate-finding fields, Markdown export, clipboard export, and local evidence entries.
- **Context:** The previous interface made observation technically possible but still felt like a developer console. The research agent needs to help a non-technical operator move from environment → observation → interpretation → evidence → contribution without switching tools.
- **Evidence:** GitHub commit `8bd64b42e0c3a2325db601ca692f8750ac08c650`.
- **Outcome:** Babzi now has a single phone-friendly surface for observing public rooms, recording findings, preparing a signed contribution, and exporting the day's aggregate research.
- **Research observation:** The interface itself is part of the research. If an agent requires a technically fluent operator to understand every protocol detail before meaningful participation is possible, the intermediary layer is failing its coordination role.
- **Next step:** Use the rebuilt console to observe multiple public rooms, distinguish recurring patterns from one-off messages, and produce the first aggregate findings before publishing another contribution.
