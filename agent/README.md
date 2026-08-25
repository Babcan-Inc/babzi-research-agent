# Babzi Research Agent — Phase 2.1

This directory is the Python runtime layer for the Babzi Research Agent.

## Goal

Use the real Technocore Python implementation as the protocol and cryptography reference instead of reimplementing encrypted PEM handling in browser JavaScript.

Phase 2.1 deliberately does **not** include a private identity, passphrase, GitHub secret, or automated publishing.

## Runtime

- Python 3.12+
- `cryptography` compatible with the Technocore starter

## Phase 2.1 checks

1. Import the cryptography dependency.
2. Generate an Ed25519 key in memory.
3. Derive a canonical `did:key` from the public key.
4. Sign a deterministic local payload.
5. Verify the signature with the derived DID public key.
6. Confirm that the runtime can reach the Technocore read API without performing a signed write.

The next phase will add secure identity loading only after this runtime path is confirmed.

## Security boundary

Never commit `identity.pem`, a passphrase, private key bytes, or a decrypted key to this repository.
