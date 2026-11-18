# Plan: post-quantum signatures, EUDI wallet support and revocation (part 3)

Parts 1, 2 and 4 are done (0293 is live on Neon, the €150.90 cost bar works, the account details come from the hosting settings or bunq). Part 3 is too big for one pass and touches the binding rules in the handover dossier, so it is split into four phases. Each phase ships with its own tests and can be approved separately.

## Three corrections to the brief

1. **RSG1 is encryption, not a signature.** An RSG1 envelope locks a PDF with AES-256-GCM. "Dual-signing RSG1" therefore means adding a separate hybrid signature (Ed25519 + ML-DSA-65) over the envelope's fingerprint. The RSG1 format itself stays the same, so every existing document still opens.
2. **EUDI wallets do not use accumulators for revocation.** The EU wallet framework (ARF) and HAIP use the IETF *Token Status List* (a compressed list of bits, one per credential, that the issuer signs). That is what wallets can actually check. A cryptographic accumulator with zero-knowledge non-membership proofs is not supported by any EUDI wallet today. I suggest Token Status List for wallets, with an accumulator as an optional ROUT-only extra (phase D).
3. **ML-DSA in wallets.** EUDI wallets accept ES256 (P-256) today, not ML-DSA. Credentials for wallets are signed ES256 + Ed25519, and the ML-DSA-65 signature goes along as an extra proof that ROUT verifiers check. Otherwise no wallet could read the credential.

## Phase A: hybrid signatures for everything (about 1 to 2 days)
- One shared signer, `src/lib/crypto/hybrid-signer.server.ts`, built from the treasury signer that is already tested. Every purpose gets its own domain label (`rout.sign.attest.v1`, `rout.didit.attest.v1`, `rout.identity.doc.v1`) and a key derived from ROUT_SUBJECT_MASTER_KEY.
- Sign: on "sign", the server signs {envelope SHA-256, signer binding, time}. The signature is stored next to the existing signature record (new migration 0294, additive). The PDF shows "Ed25519 + ML-DSA-65 valid" only after the crypto worker has checked it.
- Didit: every new Didit result gets a hybrid attestation record (no personal data, only a commitment). The blue-mark card shows the PQ line only after verification.
- Identity documents: the same detached signature over the sealed copy's fingerprint. Plaintext never reaches the server.
- Public key at `/.well-known/rout-pq-keys.json` (Ed25519 + ML-DSA-65, with key ids).

## Phase B: OID4VCI, issuing credentials to wallets (about 3 to 4 days)
- Issuer metadata at `/.well-known/openid-credential-issuer`, plus authorization-server metadata.
- Pre-authorized code flow with a transaction code, then `/api/public/oid4vci/token` and `/api/public/oid4vci/credential` (with a key-binding proof JWT and nonce endpoint).
- First credential types: ROUT Supporter (already exists as an SD-JWT VC) and "Verified human / age over N" (built only from claims we already have, so no nationality).
- Format: SD-JWT VC (`dc+sd-jwt`). The mdoc format (ISO 18013-5) is left out for now.
- Developer Console: a new "Wallet issuance" tab with the credential offer QR code and a test log.

## Phase C: OID4VP, verifying wallet presentations (about 2 to 3 days)
- On `/oauth`: the relying party can ask for a wallet presentation (DCQL query, `response_mode=direct_post`, signed request object).
- Check: the issuer signature, key binding, nonce/audience, and status through the Status List from phase D.
- Developer Console: a request builder and a presentation inspector.

## Phase D: revocation (about 1 to 2 days)
- Token Status List (IETF draft, the one EUDI requires): `/api/public/status/<list>`, signed as a JWT, compressed, with one index per issued credential (migration 0295).
- Optional: a ROUT-only RSA accumulator with non-membership proofs for verifiers that want more privacy. This is only a real zero-knowledge proof if we also add a proof system. Without one I will call it an "accumulator proof", not ZK.

## What I need from you
- Approval per phase (or "A to D in order").
- Whether mdoc support is needed now or later.
- Whether "ROUT-only accumulator" in phase D is wanted on top of the status list.

## Technical notes
- Every new migration goes through `scripts/migration-rollout.ts`, only after a separate GO. Definers get search_path pg_catalog, pg_temp, and rout_app has no table rights.
- Every new createServerFn has a guard or a PUBLIC_SERVER_FNS entry. Every public route under /api/public checks its input itself.
- All verification in the browser goes through the crypto worker (new ops `pq.verify`, `vc.verify_status`). There is no fallback on the UI thread.
- Tests: known-answer vectors for ML-DSA-65 (FIPS 204), an OID4VCI/OID4VP conformance-style flow test against our own endpoints, a Status List encode/decode test, and replay tests for 0294 and 0295.
