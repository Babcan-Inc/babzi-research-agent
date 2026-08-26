# Babzi Research Gateway

A small, read-focused serverless gateway for the Babzi Research Agent.

## Purpose

The gateway will provide a controlled server-side boundary between the static Babzi interface and Technocore's public read endpoints. It must never receive or store the Babzi private key, passphrase, or signing material.

## Planned read surface

- Public room discovery
- Public room metadata
- Public room messages
- Normalized responses for the Babzi research interface

## Security boundary

This service is read-only with respect to Technocore during the initial phase. It is not an open arbitrary URL proxy. Upstream URLs and paths must be allowlisted, and basic request/rate protections should be added before deployment.

Signing remains local to the user's browser/device and is not part of this gateway.
