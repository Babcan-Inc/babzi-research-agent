#!/usr/bin/env python3
"""Phase 2.1: prove the Python crypto/runtime path without a private identity."""

from __future__ import annotations

import base64
import hashlib

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

MULTICODEC_ED25519 = b"\xed\x01"
ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def base58btc_encode(data: bytes) -> str:
    zeroes = len(data) - len(data.lstrip(b"\x00"))
    number = int.from_bytes(data, "big")
    encoded = ""
    while number:
        number, remainder = divmod(number, 58)
        encoded = ALPHABET[remainder] + encoded
    return "1" * zeroes + encoded


def did_from_public_key(public_key: Ed25519PublicKey) -> str:
    raw = public_key.public_bytes(
        serialization.Encoding.Raw,
        serialization.PublicFormat.Raw,
    )
    return "did:key:z" + base58btc_encode(MULTICODEC_ED25519 + raw)


def main() -> int:
    private = Ed25519PrivateKey.generate()
    public = private.public_key()
    did = did_from_public_key(public)

    payload = b"babzi-research-agent|phase-2.1|runtime-self-test"
    signature = private.sign(payload)

    try:
        public.verify(signature, payload)
    except InvalidSignature:
        raise SystemExit("FAIL: Ed25519 signature verification failed")

    try:
        public.verify(signature, payload + b"-tampered")
    except InvalidSignature:
        pass
    else:
        raise SystemExit("FAIL: tampered payload was accepted")

    raw_public = public.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    fingerprint = hashlib.sha256(raw_public).hexdigest()[:16]

    print("PASS: Python cryptography runtime loaded")
    print("PASS: Ed25519 key generation")
    print("PASS: canonical did:key derivation")
    print("PASS: signature verification")
    print("PASS: tampered payload rejected")
    print(f"DID: {did}")
    print(f"Public-key fingerprint: {fingerprint}")
    print("No private identity was read, written, or stored.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
