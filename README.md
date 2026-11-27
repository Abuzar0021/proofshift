# ProofShift — evidence consistency for the open agentic web

**Three valid signatures. One broken delivery.**

ProofShift demonstrates why separately authenticated agent commitments are insufficient to accept a composed workflow. A fixed policy checks catalog, inventory, shipping and budget, then verifies that the signed providers refer to compatible dependency digests. A stale or incompatible commitment blocks the acceptance verdict. The deterministic verifier—not an LLM—calculates the result.

- Public demo: https://abuzar0021.github.io/proofshift/
- No-key interoperability demo: https://abuzar0021.github.io/proofshift/integration-test.html
- Network: https://abuzar0021.github.io/proofshift/proofshift

## Reproduce
Node.js 22+; no npm dependencies for the lab itself.

```sh
npm test
npm start
```

Open http://127.0.0.1:8800/ and http://127.0.0.1:8800/integration-test.html. The checked-in historical examples are signed synthetic data. Local live mode creates three distinct Node processes on ports 8801–8803 with separate ephemeral keys. Run the compatible, mixed and reconciled scenarios; the historical verifier accepts only a fixed test policy and never authorizes real release or payment. Run the integration page to exercise the actual reference runtime with a **scripted test model**. It checks decline and approve paths, remote bridge reads, direct verification of the actual returned envelopes, and tampering rejection.

Public providers have distinct manifests and tool bridges but share one HTTPS origin. They expose historical samples, not live suppliers. The local cross-origin test exercises consent, while the public demo does not require third-party consent for same-origin peers. The optional chat requires the user's own authorized model/provider configuration. No real external inference has been verified; do not enter confidential data. No API key is shipped. The public demo is not a production release gate.

## Evidence and limitations
The November 27 local differential experiment used 250 synthetic transitions. Selective evaluation and full revalidation agreed in all cases (1,044 vs 1,500 policy evaluations, 30.4% fewer). This is not a speed benchmark or a proof against an independent implementation. The Chrome browser integration ran the actual organizer runtime, with scripted model outputs and separate provider origins. Signatures establish possession of the pinned demo keys, not truth of business claims. Historical timestamps are not independently notarized. No production SLA, customer demand, competitive superiority or unique invention is claimed.

## Architecture
`site/engine.mjs` verifies Ed25519 envelopes, nonce, typed data, revision, expiry, and dependency coherence, then calculates a policy DAG with invalidation. `provider.mjs` is a synthetic signed evidence provider. `lab.mjs` launches three test processes and the web interface. `site/integration-test.mjs` exercises the reference runtime. `docs/` is the static hosted version. `tests/` contains reproducible protocol tests. `configure-peers.mjs` regenerates local/public network definitions using the sponsor's adjacent agentic-web checkout (skills/agentify-website/scripts/build_network.mjs).

## Prior art and attribution
Related work includes signed supply-chain attestations (in-toto), VCAP and DONE / PROVEN dependency invalidation. Our demonstrator focuses on cross-provider digest consistency in the open agentic web, not claiming invention of signatures or dependency graphs. The reference runtime is copied without modification from https://github.com/cognizant-ai-labs/agentic-web at commit 05a665edcf11bac1eb6ab29c085040a7a4838182; see LICENSE and each runtime/LICENSE.txt. AI assistance was used in designing and implementing the prototype; the entrant should review and understand it before entering.
