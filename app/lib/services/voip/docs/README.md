# VoIP Documentation

Entry point for documentation of the peer-to-peer audio call subsystem. VoIP is the new WebRTC-based call stack — distinct from VideoConf (Jitsi/Redux).

## Index

| Document | Purpose |
| -------- | ------- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Subsystem structure: runtimes, layers, state model, signaling protocol, native bridge contract, invariants |
| [`FLOWS.md`](FLOWS.md) | Cross-runtime sequence diagrams for init/teardown, outgoing, incoming warm, incoming cold start, cross-workspace, end-call |
| [`PLATFORMS.md`](PLATFORMS.md) | iOS and Android platform quirks: PushKit/CallKit, FCM/Telecom, per-call DDP, audio routing, manifest and `Info.plist` |

## Glossary

Domain terms used throughout these docs are defined in the project glossary at `../../../../UBIQUITOUS_LANGUAGE.md` under "Video & Voice".
