# ProofShift — competition materials (draft; entrant review required)

## Elevator pitch
Three agents can sign three valid receipts and still deliver one incompatible workflow. ProofShift checks that their commitments refer to the same dependencies before a synthetic project is accepted.

## Description
A decentralized agent workflow can pass individual checks while relying on mismatched versions of shared dependencies. ProofShift makes this failure visible. Three independently keyed test provider processes publish catalog, stock and shipping evidence. Each receipt is signed and bound to a challenge; a deterministic, typed policy validates authenticity, expiry, revision, budget, availability, shipping deadline and cross-provider digest consistency. When a catalog changes, stock and shipping can remain individually valid while their combined commitments are incompatible. The acceptance gate returns FAIL rather than trusting the model's completion claim.

The web interface supports compatible, incompatible, reconciled and deadline-missed historical samples, portable agent manifests, read-only bridges and optional user-controlled inference. The free deterministic interoperability demonstration exercises actual browser runtime and bridge calls with a scripted test model, then verifies actual returned envelopes; it does not simulate an external LLM. Local live lab separately exercises independent processes and cross-origin consent. Public providers are cohosted under one HTTPS origin and expose historical synthetic data.

## What we learned
A valid signature is not proof of factual truth or compatibility. Selective verification avoids some redundant policy checks. 250 synthetic transitions agreed with full revalidation; 1,044 vs 1,500 policy checks (30.4% fewer), not a measured speedup. Browser integration validated consent denial, bridge execution, and tampering rejection. This is a research prototype, not a real commercial release gate. We use the sponsor's licensed browser runtime unchanged. No production customers, novelty or superiority claims.

## Links
Project: https://abuzar0021.github.io/proofshift/
Source: https://github.com/Abuzar0021/proofshift
Interoperability demo: https://abuzar0021.github.io/proofshift/integration-test.html

## Demo instructions
Open project, select mixed sample, click Verify evidence. All three signatures are valid, four individual business rules pass, but cross-provider consistency fails. Select reconciled, verify PASS. Open the interoperability proof, run the demonstration and inspect the returned-envelope verification and signature rejection. No API key needed. Live external LLM configuration remains optional and untested. No real transaction is authorized.

## Required personal steps
Entrant reviews code and eligibility; personally explains the actual project in a <2-minute video, using their own voice or on-camera explanation (not AI-generated). Upload video publicly to YouTube and supply link, screenshot(s), project URL and description on Devpost. Do not state real-world deployment or live inference has been validated beyond the verified static public demo. Check and accept official competition rules personally.
